import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE, WORKSPACE_USER_MAPPING_STATUS } from '../../config/constants';

export const deleteWorkspace = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const user = req.user;

    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    // 2. Permission Check: Only Super Admin can delete
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasRequiredRoleAccess({
      userId: user.id,
      workspaceId,
      requiredRoles: [ WORKSPACE_USER_ROLE.SUPER_ADMIN ] // Only Super Admin can delete workspace
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Only Super Admins can delete workspaces' });
    }

    // 5. Remove team members from the workspace and mark them as deleted
    const [ deletedMembers ] = await Promise.all([
      UserWorkspaceMappingModelHandler.bulkUpdateWorkspaceMember({
        status: WORKSPACE_USER_MAPPING_STATUS.DELETED, // Updated status
        is_active: false,
        is_deleted: true, // Marking as soft-deleted
        deleted_at: new Date()
      }, {
        workspace_id: workspaceId,
        is_deleted: false
      }),
      // delete the workspace client mapping for this user
      WorkspaceClientMappingModelHandler.deleteWorkspaceClientMapping({
        workspace_id: workspaceId,
      }),
    ]);

    // for each deleted memebrs, remove their workspace access from redis cache
    await Promise.all(deletedMembers.map(member => WorkspaceRedisCacheHelper.removeWorkspaceAccess({
      userId: member.user_id,
      workspaceId
    })));

    // mark workspace as deleted
    await WorkspaceModelHandler.updateWorkspace({
      is_deleted: true,
      deleted_at: new Date()
    }, {
      id: workspaceId
    });

    return res.status(StatusCodes.OK).send({
      message: 'Workspace deleted successfully'
    });

  } catch (err) {
    logger.error(`Critical error in deleteWorkspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
