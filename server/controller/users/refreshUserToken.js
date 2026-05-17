import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { USER_STATUS } from '../../config/constants';

/**
 * Functionality used to refresh a user's authentication token
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} new token and user info
 */
export const refreshUserToken = async(req, res) => {

  const TokenHandler = Container.get('TokenHandler');
  const UserModelHandler = Container.get('UserModelHandler');
  const UserSessionModelHandler = Container.get('UserSessionModelHandler');

  const logger = Container.get('logger');

  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.code(StatusCodes.UNAUTHORIZED).send({
        message: 'Refresh token missing',
      });
    }

    // check if user exists in the database
    logger.info('Attempting to refresh token for user with refresh token');

    let userSessionDBData = await UserSessionModelHandler.getUserSessionByWhere({ refresh_token: refreshToken });

    // if the user session is not found in the database, respond with not found
    if (!userSessionDBData) {
      logger.error('User session with provided refresh token not found');
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User session not found' });
    }

    // if the user session is not active, respond with unauthorized
    if (!userSessionDBData.is_active) {
      logger.error('User session with provided refresh token is not active');
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'User session is not active' });
    }

    // check if user is active
    let userDBData = await UserModelHandler.getUserByWhere({ id: userSessionDBData.user_id });

    if (!userDBData || userDBData.status !== USER_STATUS.ACTIVE) {
      logger.error('User associated with the session is not active or not found');
      return res
        .status(StatusCodes.NOT_ACCEPTABLE)
        .send({ message: 'User not active or not found' });
    }

    // generate token with user
    const token = await TokenHandler.generate(userDBData);

    // create a new user session in the database
    await UserSessionModelHandler.updateUserSession({
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at,
      updated_at: new Date().toISOString()
    }, {
      id: userSessionDBData.id
    });

    // set refresh token in http only cookie
    TokenHandler.setRefreshTokenCookie(res, token.refresh_token, req.headers.origin);

    delete token.refresh_token;
    delete token.refresh_token_expiries_at;

    logger.info('Token refreshed successfully for user');

    // return token and user info
    return res.status(StatusCodes.OK).send({ token, user: userDBData });

  } catch (error) {
    logger.error(`Error occurred during user login: ${error.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
