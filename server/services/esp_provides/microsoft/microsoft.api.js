import axios from 'axios';
import { MICROSOFT_CONFIG } from '../../../config/constants';
import { Container } from 'typedi';
const qs = require('querystring');

export const getMicrosoftOAuthClientByPartnerId = async(partnerId) => {
  const redisClient = Container.get('redisClient');
  // if partnerId then check if the partner has nay google / outlook client secrete
  if (partnerId) {
    const partnerMicrosoftConfig = await redisClient.get(`${MICROSOFT_CONFIG.REDIS_CACHE_KEY}:${partnerId}`);
    if (partnerMicrosoftConfig) {
      const config = JSON.parse(partnerMicrosoftConfig);
      if (config.CLIENT_ID && config.CLIENT_SECRET) {
        return {
          clientId: config.CLIENT_ID,
          clientSecret: config.CLIENT_SECRET,
          beRedirectUrl: config.REDIRECT_URI,
        };
      }
    }
  }
  throw new Error('Microsoft OAuth configuration not found for partner');
};

export const getMicrosoftAuthUrl = async(stateData, partnerId) => {
  const { clientId, beRedirectUrl } = await getMicrosoftOAuthClientByPartnerId(partnerId);
  const params = qs.stringify({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: beRedirectUrl,
    response_mode: 'query',
    scope: MICROSOFT_CONFIG.MAIL_SCOPE.join(' '),
    state: JSON.stringify(stateData),
    prompt: 'consent'
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
};

/** Handle Microsoft OAuth callback to exchange code for tokens
 * @param {string} code - The authorization code received from Microsoft
 * @param {string} partnerId - the partnerId
 * @returns {object} - The tokens object containing access_token, refresh_token, etc.
 */
export const handleMicrosoftCallback = async(code, partnerId) => {
  const logger = Container.get('logger');

  try {
    const { clientId, clientSecret, beRedirectUrl } = await getMicrosoftOAuthClientByPartnerId(partnerId);

    const data = qs.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: beRedirectUrl,
      scope: MICROSOFT_CONFIG.MAIL_SCOPE.join(' ')
    });

    const response = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    logger.info(`Microsoft OAuth tokens received for partnerId: ${partnerId}`);
    return response.data;
  } catch (e) {
    logger.error(`Microsoft OAuth token exchange failed - ${e}`);
    throw e;
  }
};

/** Refresh Microsoft Token
 * @param {string} token - The refresh token
 * @param {string} partnerId - the partnerId
 * @returns {object} - The new tokens object containing access_token, refresh_token, etc.
 */
export const getNewMicrosoftAccessToken = async(token, partnerId) => {
  const { clientId, clientSecret } = await getMicrosoftOAuthClientByPartnerId(partnerId);

  const data = qs.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    scope: MICROSOFT_CONFIG.MAIL_SCOPE.join(' ')
  });

  const response = await axios.post(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    data,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  const newTokens = response.data;
  const expiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  return {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: expiry,
    scope: newTokens.scope,
    provider: 'microsoft'
  };
};

/** Get normalized Microsoft user data
 * @param {object} userData - The raw user data fetched from Microsoft Graph API
 * @param {object} tokens - The tokens object
 * @returns {object} - The normalized user data
 */
export const getMicrosoftNormalisedData = (userData, tokens) => {
  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  return {
    email: userData.mail || userData.userPrincipalName || '',
    name: userData.displayName || '',
    credentials: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiry,
      last_token_refresh_at: new Date().toISOString()
    },
  };
};

// get user details using access token
export const getMicrosoftUserDetails = async(token) => {
  const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });
  return response.data;
};
