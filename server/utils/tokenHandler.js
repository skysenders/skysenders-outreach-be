import * as jwt from 'jsonwebtoken';
import { Container } from 'typedi';
import { HASURA_ROLES, JWT } from '../config/constants';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT.SECRET_KEY, { expiresIn: JWT.ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT.REFRESH_TOKEN_SECRET_KEY, { expiresIn: JWT.REFRESH_TOKEN_EXPIRY });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT.SECRET_KEY);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT.REFRESH_TOKEN_SECRET_KEY);
};

/**
 * Functionality used to generate a token on successful login
 * @argument {user} user object
 * @argument {partner} partner object
 * @returns {String} Token
 */
export const generate = async(user) => {
  const logger = Container.get('logger');
  try {
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        uuid: user.uuid,
        tenant_id: user.partner_id,
        is_client: user.is_client || false
      },
      type: 'user',
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': [ HASURA_ROLES.USERS ],
        'x-hasura-default-role': HASURA_ROLES.USERS,
        'x-hasura-tenant-id': `${user.partner_id || 0}`,
        'x-hasura-user-id': `${user.id || 0}`,
        'x-hasura-user-uuid': `${user.uuid || 0}`,
        'x-hasura-user-name': `${user.name || 0}`,
        'x-hasura-user-email': `${user.email || 0}`,
      },
    };
    return {
      access_token: generateAccessToken(payload),
      refresh_token: generateRefreshToken(payload),
      access_token_expiries_at: new Date(Date.now() + JWT.ACCESS_TOKEN_EXPIRY_IN_SECONDS * 1000).toISOString(),
      refresh_token_expiries_at: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS * 1000).toISOString()
    };
  } catch (err) {
    logger.error(`Error while generating token for user ${user.email} ${err.message}`);
    throw err;
  }
};

/**
 * Functionality used to generate a token on successful partner login
 * @argument {partner} partner object
 * @returns {String} Token
 */
export const generatePartnerToken = async(partner) => {
  const logger = Container.get('logger');
  try {
    const payload = {
      partner: {
        id: partner.id,
        email: partner.email,
        name: partner.name,
        uuid: partner.uuid
      },
      type: 'partner',
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': [HASURA_ROLES.PARTNERS],
        'x-hasura-default-role': HASURA_ROLES.PARTNERS,
        'x-hasura-partner-id': `${partner.id || 0}`,
        'x-hasura-partner-uuid': `${partner.uuid || 0}`,
        'x-hasura-partner-name': `${partner.name || ''}`,
        'x-hasura-partner-email': `${partner.email || ''}`,
      },
    };
    return {
      access_token: generateAccessToken(payload),
      refresh_token: generateRefreshToken(payload),
      access_token_expiries_at: new Date(Date.now() + JWT.ACCESS_TOKEN_EXPIRY_IN_SECONDS * 1000).toISOString(),
      refresh_token_expiries_at: new Date(Date.now() + JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS * 1000).toISOString()
    };
  } catch (err) {
    logger.error(`Error while generating token for partner ${partner.email}: ${err.message}`);
    throw err;
  }
};

export const setRefreshTokenCookie = (res, refreshToken, reqOrigin) => {
  const hostname = reqOrigin ? new URL(reqOrigin).hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname.includes('.localhost');

  const isSkySendersDomain = hostname.endsWith('.skysenders.ai');
  const isSkysendersLocalDomain = hostname.endsWith('.skysenders.local');

  if (isSkySendersDomain) {
    // set logged_in cookie for frontend to check if user is logged in
    res.setCookie('logged_in', 'true', {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.ai',
      maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });

    return res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.ai',
      maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });
  } else if (isSkysendersLocalDomain) {
    // set logged_in cookie for frontend to check if user is logged in
    res.setCookie('logged_in', 'true', {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.local',
      maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });

    return res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.local',
      maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });
  } else if (isLocalhost) {
    return res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
    });
  }

  // set refresh token in http only cookie
  return res.setCookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS,
  });
};

export const clearRefreshTokenCookie = (res, reqOrigin) => {
  const hostname = reqOrigin ? new URL(reqOrigin).hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname.includes('.localhost');
  const isSkySendersDomain = hostname.endsWith('.skysenders.ai');
  const isSkysendersLocalDomain = hostname.endsWith('.skysenders.local');

  if (isSkySendersDomain) {
    res.clearCookie('logged_in', {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.ai',
    });
    // clear refresh token from http only cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.ai',
    });
  } else if (isSkysendersLocalDomain) {
    res.clearCookie('logged_in', {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.local',
    });
    // clear refresh token from http only cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.skysenders.local',
    });
  } else if (isLocalhost) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  // clear refresh token from http only cookie
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
};
