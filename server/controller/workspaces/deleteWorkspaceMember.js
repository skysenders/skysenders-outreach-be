import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE, WORKSPACE_USER_MAPPING_STATUS } from '../../config/constants';

export const deleteWorkspaceMember = async(req, res) => {
  const logger = Container.get('logger');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const { userId } = req.params;
    const user = req.user;

    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    // 1. Prevent Self-Deletion
    if (user.id === userId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'You cannot delete yourself. Please use the leave workspace option.'
      });
    }

    // 2. Permission Check: Only Admin or Super Admin can delete members
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: user.id,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to delete members' });
    }

    // 3. Fetch target user mapping
    const existingMapping = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
      workspace_id: workspaceId,
      user_id: userId,
      is_deleted: false
    });

    if (!existingMapping || existingMapping.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Member not found in this workspace' });
    }

    const targetUserMapping = existingMapping[0];

    // 4. Hierarchy Check: Protect the Super Admin
    if (targetUserMapping.role === WORKSPACE_USER_ROLE.SUPER_ADMIN) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'The Super Admin cannot be deleted from the workspace.'
      });
    }

    // 5. Perform the "Delete" action
    await UserWorkspaceMappingModelHandler.updateWorkspaceMember({
      status: WORKSPACE_USER_MAPPING_STATUS.DELETED, // Updated status
      is_active: false,
      is_deleted: true, // Marking as soft-deleted
      deleted_at: new Date()
    }, {
      id: targetUserMapping.id
    });

    // 6. Immediate Cache Invalidation
    await WorkspaceRedisCacheHelper.removeWorkspaceAccess({
      userId: userId,
      workspaceId
    });

    return res.status(StatusCodes.OK).send({
      message: 'Member deleted from workspace successfully'
    });

  } catch (err) {
    logger.error(`Critical error in deleteWorkspaceMember: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
