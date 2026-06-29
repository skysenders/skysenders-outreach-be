import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const updateWorkspaceClient = async(req, res) => {
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const { id: workspaceId, userId } = req.params;
    const { password, role } = req.body;
    const user = req.user;

    // 1. Basic Validation
    if (!password && !role) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one of password or role must be provided' });
    }

    // 2. Prevent Self-Modification (Security Best Practice)
    if (user.id === userId) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'You cannot update your own role or status' });
    }

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // find existing client
    // 3. Fetch target user mapping
    const existingUser = await UserModelHandler.getUserByWhere({
      id: userId,
      account_id: user.account_id,
      is_client: true,
      deleted_at: null
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Client not found in this workspace' });
    }

    const updateFields = {};

    if (password) {
      updateFields.password = password;
    }

    if (role) {
      await UserModelHandler.updateUser({
        role
      }, {
        id: userId
      });
      await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
        accountId: existingUser.account_id,
        userId: userId,
        role
      });
    }

    if (Object.keys(updateFields).length > 0) {
      await WorkspaceClientMappingModelHandler.updateWorkspaceClientMapping(updateFields, {
        workspace_id: workspaceId,
        user_id: userId,
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
