import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { USER_ROLE } from '../../config/constants';

export const updateTeamMemberRole = async(req, res) => {
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const { userId } = req.params;

    const { role } = req.body;
    const user = req.user;


    // 2. Prevent Self-Modification (Security Best Practice)
    if (user.id === userId) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'You cannot update your own role or status' });
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

    // 5. Hierarchy Check: ADMINs should not be able to demote SUPER_ADMINs
    if (existingUser.role === USER_ROLE.SUPER_ADMIN) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Admins cannot modify Super Admin accounts' });
    }

    await UserModelHandler.updateUser(
      { role },
      { id: userId, account_id: user.account_id }
    );

    // Sync Redis Cache
    await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
      accountId: existingUser.account_id,
      userId: userId,
      role: role
    });

    return res.status(StatusCodes.OK).send({
      message: 'Member updated successfully'
    });

  } catch (err) {
    logger.error(`Critical error in updateTeamMemberRole: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
