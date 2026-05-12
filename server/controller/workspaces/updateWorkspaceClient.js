import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE } from '../../config/constants';

export const updateWorkspaceClient = async(req, res) => {
  const logger = Container.get('logger');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const { userId } = req.params;
    const { password, is_active: isActive } = req.body;
    const user = req.user;

    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    // 1. Basic Validation
    if (!password && typeof isActive !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one of password or is_active must be provided' });
    }

    // 2. Prevent Self-Modification (Security Best Practice)
    if (user.id === userId) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'You cannot update your own role or status' });
    }

    // 3. Permission Check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: user.id,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions' });
    }

    // 4. Check if client exists in this workspace before updating
    const existingMapping = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
      workspace_id: workspaceId,
      user_id: userId,
      role: WORKSPACE_USER_ROLE.CLIENT, // Ensure we are only fetching client mappings
      is_deleted: false
    });

    if (!existingMapping || existingMapping.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Client not found in this workspace' });
    }

    // 6. Perform Update
    if (typeof isActive === 'boolean') {
      await UserWorkspaceMappingModelHandler.updateWorkspaceMember({
        is_active: isActive
      }, {
        workspace_id: workspaceId,
        user_id: userId,
      });
    }

    if (password) {
      await WorkspaceClientMappingModelHandler.updateWorkspaceClientMapping({
        password
      }, {
        workspace_id: workspaceId,
        user_id: userId,
      });
    }


    // Sync Redis Cache
    // If Deactivating: Remove access immediately
    // Else If Role Change or Re-activation: Update/Restore access
    if (typeof isActive === 'boolean' && !isActive) {
      await WorkspaceRedisCacheHelper.removeWorkspaceAccess({
        userId,
        workspaceId
      });
    } else if (isActive === true) {
      await WorkspaceRedisCacheHelper.updateWorkspaceAccess({
        userId,
        workspaceId,
        role: WORKSPACE_USER_ROLE.CLIENT
      });
    }

    return res.status(StatusCodes.OK).send({
      message: 'Client updated successfully'
    });

  } catch (err) {
    logger.error(`Critical error in updateWorkspaceClient: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
