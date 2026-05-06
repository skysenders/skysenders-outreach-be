import { CORS } from './config/constants';

/**
 * CORS controller which controls the cross domain access
 * @returns {Boolean} it returns a boolean value which indicates
 * the requested host is a whitelist(allowed) or not
 * @param {*} origin origin from the client
 * @param {*} callback middleware to next request
 */
export const allowCrossDomain = (origin, callback) => {
  const whitelist = CORS.ALLOWED_DOMAINS.split(',');
  if (!origin || whitelist.indexOf(origin) > -1) {
    // Allow the request
    return callback(null, true);
  }
  // Deny the request
  callback(new Error('Not allowed by CORS'));
};
