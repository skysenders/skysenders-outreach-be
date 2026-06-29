import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { USER_STATUS, USER_ROLE } from '../../config/constants';

export const deleteAccountMember = async(req, res) => {
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const { userId } = req.params;
    const user = req.user;

    // 1. Prevent Self-Deletion
    if (user.id === userId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'You cannot delete yourself.'
      });
    }

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    const existingUser = await UserModelHandler.getUserById(userId);

    if (!existingUser || existingUser.account_id !== user.account_id) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'User not found in this account' });
    }

    // 4. Hierarchy Check: Protect the Super Admin
    if (existingUser.role === USER_ROLE.SUPER_ADMIN) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'The Super Admin cannot be deleted.'
      });
    }

    // 5. Perform the "Delete" action
    await UserModelHandler.updateUser({
      status: USER_STATUS.DELETED, // Updated status
      deleted_at: new Date().toISOString(),
    }, {
      id: userId,
      account_id: user.account_id
    });

    // 6. Immediate Cache Invalidation
    await AccountWorkspaceRedisCacheHelper.removeAccountUser({
      userId: userId,
      accountId: user.account_id
    });

    return res.status(StatusCodes.OK).send({
      message: 'Member deleted successfully'
    });

  } catch (err) {
    logger.error(`Critical error in deleteAccountMember: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
