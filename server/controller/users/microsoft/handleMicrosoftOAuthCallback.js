import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { handleMicrosoftCallback } from '../../../services/esp_provides/microsoft/microsoft.login.api';
import { socialLoginOrSignup } from '../signup';
import { FRONTEND_URL } from '../../../config/constants';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const handleMicrosoftOAuthCallback = async(req, res) => {
  const logger = Container.get('logger');
  const TokenHandler = Container.get('TokenHandler');
  try {
    const { code, state } = req.query;
    let partnerId, redirectUrl, token;

    logger.info('Received Microsoft OAuth callback with code and state');
    // extract user_id from the state parameter
    if (state) {
      const stateData = JSON.parse(state);
      partnerId = stateData.partnerId || null;
      redirectUrl = stateData.redirectUrl || FRONTEND_URL;
      token = stateData.token || null;
    }
    logger.info(`Received Microsoft OAuth callback for partner ID - ${partnerId}`);
    const userData = await handleMicrosoftCallback(code, partnerId);

    const { user, jwtToken } = await socialLoginOrSignup(userData, token, req.headers['user-agent'] || '', req.ip || '');

    // set refresh token in http only cookie
    TokenHandler.setRefreshTokenCookie(res, jwtToken.refresh_token, redirectUrl);

    // redirect to frontend with user data and token
    const redirectWithParams = `${redirectUrl}?user=${encodeURIComponent(JSON.stringify(user))}&token=${encodeURIComponent(jwtToken.access_token)}`;

    logger.info(`Redirecting to frontend with user data and token for partner ID - ${partnerId}`);
    return res.redirect(redirectWithParams);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
