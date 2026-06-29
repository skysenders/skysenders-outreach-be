import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { USER_STATUS } from '../../config/constants';

export const deleteWorkspaceClient = async(req, res) => {
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');


  try {
    const { id: workspaceId, userId } = req.params;
    const user = req.user;

    // 1. Prevent Self-Deletion
    if (user.id === userId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'You cannot delete yourself. Please use the leave workspace option.'
      });
    }

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

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

    // 5. Perform the "Delete" action
    await Promise.all([
      UserModelHandler.updateUser({
        status: USER_STATUS.DELETED, // Updated status
        deleted_at: new Date().toISOString(),
      }, {
        id: userId,
        account_id: user.account_id
      }),

      // delete the workspace client mapping for this user
      WorkspaceClientMappingModelHandler.deleteWorkspaceClientMapping({
        workspace_id: workspaceId,
        user_id: userId
      })
    ]);

    // Immediate Cache Invalidation
    await AccountWorkspaceRedisCacheHelper.removeAccountUser({
      userId: userId,
      accountId: user.account_id
    });

    return res.status(StatusCodes.OK).send({
      message: 'Client deleted from workspace successfully'
    });

  } catch (err) {
    logger.error(`Critical error in deleteWorkspaceClient: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
