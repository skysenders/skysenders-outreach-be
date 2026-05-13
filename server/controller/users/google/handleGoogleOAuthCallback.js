import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { handleGoogleCallback } from '../../../services/esp_provides/google/google.login.api';
import { socialLoginOrSignup } from '../signup';
import { FRONTEND_URL, JWT } from '../../../config/constants';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const handleGoogleOAuthCallback = async(req, res) => {
  const logger = Container.get('logger');
  try {
    const { code, state } = req.query;
    let partnerId, redirectUrl, token;

    logger.info('Received Google OAuth callback with code and state');
    // extract user_id from the state parameter
    if (state) {
      const stateData = JSON.parse(state);
      partnerId = stateData.partnerId || null;
      redirectUrl = stateData.redirectUrl || FRONTEND_URL;
      token = stateData.token || null;
    }
    logger.info(`Received Google OAuth callback for partner ID - ${partnerId}`);
    const userData = await handleGoogleCallback(code, partnerId);

    const { user, jwtToken } = await socialLoginOrSignup(userData, token, req.headers['user-agent'] || '', req.ip || '');

    // set access token in http only cookie
    res.setCookie('access_token', jwtToken.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/users/refresh-token',
      maxAge: 1000 * JWT.ACCESS_TOKEN_EXPIRY_IN_SECONDS,
    });

    // set refresh token in http only cookie
    res.setCookie('refresh_token', jwtToken.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/users/refresh-token',
      maxAge: 1000 * JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });

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
