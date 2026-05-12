import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE, WORKSPACE_USER_MAPPING_STATUS } from '../../config/constants';

export const leaveWorkspace = async(req, res) => {
  const logger = Container.get('logger');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const user = req.user;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    // 1. Fetch the user's current mapping in this workspace
    const existingMapping = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
      workspace_id: workspaceId,
      user_id: user.id,
      is_deleted: false
    });

    if (!existingMapping || existingMapping.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'You are not a member of this workspace'
      });
    }

    const userMapping = existingMapping[0];

    // 2. Critical Safety Check: Prevent the only Super Admin from leaving
    if (userMapping.role === WORKSPACE_USER_ROLE.SUPER_ADMIN) {
      // Check if there are any other active Super Admins
      // Since you mentioned there is only 1 Super Admin, this user is the only one.
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'As the Super Admin, you cannot leave the workspace. You must transfer ownership or delete the workspace instead.'
      });
    }

    // 3. Perform the "Leave" action
    // We usually soft-delete the mapping or update status to 'left'
    await UserWorkspaceMappingModelHandler.updateWorkspaceMember({
      status: WORKSPACE_USER_MAPPING_STATUS.LEFT,
      is_active: false
    }, {
      id: userMapping.id
    });

    // 4. Immediate Cache Invalidation
    // Remove their access from Redis so they are locked out instantly
    await WorkspaceRedisCacheHelper.removeWorkspaceAccess({
      userId: user.id,
      workspaceId
    });

    return res.status(StatusCodes.OK).send({
      message: 'Successfully left the workspace'
    });

  } catch (err) {
    logger.error(`Critical error in leaveWorkspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
