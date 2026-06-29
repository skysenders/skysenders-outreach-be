import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import {
  USER_STATUS,
} from '../../config/constants';


const joinAccount = async({ userId }) => {
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');

  // 1. Fetch specific mapping
  const existingUser = await UserModelHandler.getUserById(userId);

  if (!existingUser || existingUser.status !== USER_STATUS.INVITED || existingUser.deleted_at) {
    logger.info(`No pending invitation found for user ${userId}`);
    return [null, { message: 'No pending invitation found or it has already been accepted.', status: StatusCodes.NOT_FOUND }];
  }

  // check if the resend is atleast 5 mins time before reinvite
  const invitedAt = new Date(existingUser.created_at);
  const now = new Date();
  const diffInMs = now - invitedAt;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // check if invitation is expired or not (expiry time is 7 days)
  if (diffInDays >= 7) {
    return [null, { message: 'Invitation expired. Please contact the admin to resend invitation.', status: StatusCodes.NOT_ACCEPTABLE }];
  }

  // 4. Update Database
  await UserModelHandler.updateUser({
    status: USER_STATUS.ACTIVE,
    updated_at: new Date()
  }, {
    id: existingUser.id
  });

  // 5. Update Redis Cache
  await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
    accountId: existingUser.account_id,
    userId: userId,
    role: existingUser.role
  });

  return [{ user_id: existingUser.id, role: existingUser.role }, null];
};

export const joinAccountByToken = async(token, userId) => {
  const StringHelper = Container.get('StringHelper');
  const logger = Container.get('logger');

  try {
    const decoded = StringHelper.decodeToken(token);

    // Check if token is valid and contains necessary IDs
    if (!decoded || !decoded.user_id) {
      logger.warn(`Invalid token provided for joining team. userId: ${userId}`);
      return [null, { message: 'Invalid or expired token', status: StatusCodes.BAD_REQUEST }];
    }

    const { user_id: tokenUserId } = decoded;

    // 2. Security Check: Authenticated user must match token user
    if (userId !== tokenUserId) {
      logger.warn(`User ${userId} attempted to join account with token belonging to user ${tokenUserId}`);
      return [null, {
        message: 'This invitation token belongs to a different account. Please switch accounts and try again.',
        status: StatusCodes.FORBIDDEN
      }];
    }

    const [result, error] = await joinAccount({ userId });

    logger.info(`User ${userId} successfully joined account, userId: ${userId}`);
    return [result, error];
  } catch (err) {
    logger.error(`Critical error in joinAccount: ${err.message}`);
    return [null, { message: 'Internal Server Error', status: StatusCodes.INTERNAL_SERVER_ERROR }];
  }
};

export const joinAccountWithToken = async(req, res) => {

  try {
    const { token } = req.body;

    const [result, error] = await joinAccountByToken(token, req.user.id);

    if (error) {
      return res.status(error.status).send({ message: error.message });
    }

    return res.status(StatusCodes.OK).send({
      message: 'Successfully joined the team',
      data: {
        user_id: result.user_id,
        role: result.role
      }
    });

  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
