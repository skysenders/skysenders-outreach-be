import { Container } from 'typedi';
import { AUTH_PROVIDER } from '../../../config/constants';
const { google } = require('googleapis');

const GOOGLE_LOGIN_SCOPE = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

export const getGoogleOAuthClientByPartnerId = async(partnerId) => {
  // get the partner oAuth credentials from redis
  const redisClient = Container.get('redisClient');
  // fetch the google login config for the partner from redis
  if (partnerId) {
    const partnerGoogleConfig = await redisClient.get(`partner_google_login_config:${partnerId}`);
    if (partnerGoogleConfig) {
      // json parse the config
      const config = JSON.parse(partnerGoogleConfig);
      if (config.CLIENT_ID && config.CLIENT_SECRET) {
        return new google.auth.OAuth2(
          config.CLIENT_ID,
          config.CLIENT_SECRET,
          config.REDIRECT_URI
        );
      }
    }
  }
  throw new Error('Google OAuth configuration not found for partner');
};

/**
 * get the Google authentication URL
 * @param {object} stateData - the state data to be passed to Google
 * @param {string} partnerId - the partnerId
 * @returns {string} - The Google authentication URL
 */
export const getAuthUrl = async(stateData, partnerId) => {
  const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);
  const state = JSON.stringify(stateData);
  return oauth2Client.generateAuthUrl({
    access_type: 'online', // 'online' for pure google OAuth login (just validating email)
    scope: GOOGLE_LOGIN_SCOPE,
    state: state
  });
};

/**
 * handle Google OAuth callback to exchange code for tokens
 * @param {string} code - The authorization code received from Google
 * @param {string} partnerId - the partnerId
 * @returns {object} - The tokens object containing access_token, refresh_token, etc.
 */
export const handleGoogleCallback = async(code, partnerId) => {
  const logger = Container.get('logger');

  try {
    const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);

    logger.info(`Exchanging code for tokens for Partner ID: ${partnerId}`);

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // verify ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: oauth2Client._clientId,
    });

    const payload = ticket.getPayload();

    logger.info(`Google user extracted for partner id: ${partnerId}`);
    return {
      partnerId,
      email: payload.email,
      name: payload.name,
      profileUrl: payload.picture,
      authProvider: AUTH_PROVIDER.GOOGLE,
      providerUserId: payload.sub,
      // emailVerified: payload.email_verified,
      // tokens
    };
  } catch (e) {
    logger.error(`Exception occurred while handling Google callback - ${e}`);
    throw e;
  }
};
