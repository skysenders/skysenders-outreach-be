import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

/**
 * Functionality used to log out a partner by revoking their refresh token
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} success message
 */
export const logoutUser = async(req, res) => {
  const UserSessionModelHandler = Container.get('UserSessionModelHandler');
  const TokenHandler = Container.get('TokenHandler');
  const logger = Container.get('logger');

  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.code(StatusCodes.UNAUTHORIZED).send({
        message: 'Refresh token missing',
      });
    }

    // delete partner session from the database
    logger.info('Attempting to log out user with refresh token');

    let revokedSession = await UserSessionModelHandler.revokeUserSessionByToken(refreshToken);

    // if the user session is not found in the database, respond with not found
    if (!revokedSession) {
      logger.error('User session with provided refresh token not found for logout');
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User session not found' });
    }

    logger.info('User logged out successfully');

    // clear res cookie
    TokenHandler.clearRefreshTokenCookie(res, req.headers.origin);

    // return success message
    return res.status(StatusCodes.OK).send({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error(`Error occurred during user login: ${error.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
