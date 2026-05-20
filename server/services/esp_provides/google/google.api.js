import { GOOGLE_CONFIG } from '../../../config/constants';
import { Container } from 'typedi';
const { google } = require('googleapis');

export const getGoogleOAuthClientByPartnerId = async(partnerId) => {
  // get the partner oAuth credentials from redis
  const redisClient = Container.get('redisClient');
  // fetch the google login config for the partner from redis
  if (partnerId) {
    const partnerGoogleConfig = await redisClient.get(`${GOOGLE_CONFIG.REDIS_CACHE_KEY}:${partnerId}`);
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
 * @param {object} stateData - userId, workspaceId, redirectUrl, partnerId
 * @param {string} partnerId - partnerId
 * @returns {string} - The Google authentication URL
 */
export const getAuthUrl = async(stateData, partnerId) => {
  const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);
  const state = JSON.stringify(stateData);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for getting the refresh_token
    scope: GOOGLE_CONFIG.MAIL_SCOPE,
    prompt: 'consent', // Forces Google to provide a refresh_token every time
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
    logger.info(`Tokens received from Google OAuth for partner id: ${partnerId}`);
    return tokens;
  } catch (e) {
    logger.error(`Exception occurred while exchanging code for tokens - ${e}`);
    throw e;
  }
};

/**
 * verify a Google ID token
 * @param {string} idToken - The ID token to verify
 * @param {string} partnerId - the partnerId
 * @returns {object} - The verified token payload
 */
export const verify = async(idToken, partnerId) => {
  const logger = Container.get('logger');
  try {
    logger.info(`Verifying Google ID token for partner ID: ${partnerId}`);
    const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);
    // print the client id
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: oauth2Client._clientId
    });
    logger.info(`Google ID token verified for partner ID: ${partnerId}`);
    return ticket.getPayload();
  } catch (e) {
    logger.error(`Exception occurred while verifying google id token - ${e}`);
  }
};

/** disconnect a Google account by revoking its credentials
 * @param {object} token - The token object containing access_token and refresh_token
 * @param {string} partnerId - the partnerId
 * @returns {object} - The response from the revoke operation
 */
export const disconnectGoogleAccount = async(token, partnerId) => {
  const logger = Container.get('logger');
  try {
    const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);
    // set oAuth credentials
    oauth2Client.setCredentials(token);
    return await oauth2Client.revokeCredentials();
  } catch (e) {
    logger.error(`Exception occurred while disconnecting google account - ${e}`);
  }
};

/** get a new access token using a refresh token
 * @param {object} token - The token object containing access_token and refresh_token
 * @param {string} partnerId - the partnerId
 * @returns {object} - The new token object containing access_token, refresh_token, etc.
 */
export const getRefreshToken = async(token, partnerId) => {
  const oauth2Client = await getGoogleOAuthClientByPartnerId(partnerId);
  oauth2Client.setCredentials(token);
  const result = await oauth2Client.refreshAccessToken();
  return result?.credentials;
};

/** Get normalised user data from Google
 * @param {object} googleUser - The Google user profile object
 * @param {object} tokens - The tokens object containing access_token, refresh_token, etc.
 * @returns {object} - The normalised user data
 */
export const getNormalisedData = (googleUser, tokens) => {
  const logger = Container.get('logger');
  logger.info(`Normalising Google user data - ${googleUser.email}`);
  try {
    return {
      email: googleUser.email.toLowerCase(),
      first_name: googleUser.family_name && googleUser.given_name ? googleUser.given_name : googleUser.name,
      last_name: googleUser.family_name && googleUser.given_name ? googleUser.family_name : '',
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date,
        last_token_refresh_at: new Date().toISOString()
      },
      token_expiry_at: new Date(tokens.expiry_date).toISOString(),
    };
  } catch (e) {
    logger.error(`Exception occurred while normalising google user data - ${e}`);
    throw new Error('Error normalising Google user data');
  }
};
