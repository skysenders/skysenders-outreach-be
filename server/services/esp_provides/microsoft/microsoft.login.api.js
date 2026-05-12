import axios from 'axios';
import { Container } from 'typedi';
import { AUTH_PROVIDER } from '../../../config/constants';
const qs = require('querystring');

const MICROSOFT_LOGIN_SCOPE = [
  'openid',
  'profile',
  'email',
  'User.Read'
];

export const getMicrosoftOAuthClientByPartnerId = async(patnerId) => {
  // if partnerId then check if the partner has nay google / outlook client secrete
  if (patnerId) {
    const redisClient = Container.get('redisClient');
    const partnerConfig = await redisClient.get(`partner_microsoft_login_config:${patnerId}`);
    if (partnerConfig) {
      const config = JSON.parse(partnerConfig);
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

  const state = JSON.stringify(stateData);

  const params = qs.stringify({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: beRedirectUrl,
    response_mode: 'query',
    scope: MICROSOFT_LOGIN_SCOPE.join(' '),
    state: state,
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

    // 1. Exchange code for tokens
    const data = qs.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: beRedirectUrl,
      scope: MICROSOFT_LOGIN_SCOPE.join(' ')
    });

    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokens = tokenResponse.data;

    logger.info(`Microsoft tokens received for partnerId: ${partnerId}`);

    // 2. Fetch user profile from Graph API
    const profileResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );

    const profile = profileResponse.data;


    // 3. Normalize user
    return {
      partnerId,
      email: profile.mail || profile.userPrincipalName,
      name: profile.displayName,
      profileUrl: null,
      authProvider: AUTH_PROVIDER.MICROSOFT,
      providerUserId: profile.id,
      // tokens
    };

  } catch (e) {
    logger.error(`Microsoft OAuth failed - ${e}`);
    throw e;
  }
};
