import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE } from '../../config/constants';

export const updateWorkspaceMember = async(req, res) => {
  const logger = Container.get('logger');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const { workspaceId, userId } = req.params;
    const { role, is_active: isActive } = req.body;
    const user = req.user;

    // 1. Basic Validation
    if (!role && typeof isActive !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one of role or is_active must be provided' });
    }

    // 2. Prevent Self-Modification (Security Best Practice)
    if (user.id === userId) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'You cannot update your own role or status' });
    }

    // 3. Permission Check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasRequiredRoleAccess({
      userId: user.id,
      workspaceId,
      requiredRoles: [WORKSPACE_USER_ROLE.ADMIN, WORKSPACE_USER_ROLE.SUPER_ADMIN]
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions' });
    }

    // 4. Check if member exists in this workspace before updating
    const existingMapping = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
      workspace_id: workspaceId,
      user_id: userId,
      is_deleted: false
    });

    if (!existingMapping || existingMapping.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Member not found in this workspace' });
    }

    const currentMemberData = existingMapping[0];

    // 5. Hierarchy Check: ADMINs should not be able to demote SUPER_ADMINs
    if (currentMemberData.role === WORKSPACE_USER_ROLE.SUPER_ADMIN) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Admins cannot modify Super Admin accounts' });
    }

    // 6. Perform Update
    const updateData = {};
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.is_active = isActive;

    await UserWorkspaceMappingModelHandler.updateWorkspaceMember(updateData, {
      workspace_id: workspaceId,
      user_id: userId,
    });

    // Sync Redis Cache
    // If Deactivating: Remove access immediately
    // Else If Role Change or Re-activation: Update/Restore access
    if (typeof isActive === 'boolean' && !isActive) {
      await WorkspaceRedisCacheHelper.removeWorkspaceAccess({
        userId,
        workspaceId
      });
    } else if (role || isActive === true) {
      await WorkspaceRedisCacheHelper.updateWorkspaceAccess({
        userId,
        workspaceId,
        role: role || currentMemberData.role, // Fallback to existing role if only isActive changed
      });
    }

    return res.status(StatusCodes.OK).send({
      message: 'Member updated successfully'
    });

  } catch (err) {
    logger.error(`Critical error in updateWorkspaceMember: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
