import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE } from '../../../config/constants';
import { getAuthUrl } from '../../../services/esp_provides/google/google.login.api';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const signinWithGoogle = async(req, res) => {
  try {
    const redisClient = Container.get('redisClient');
    const logger = Container.get('logger');

    const { token, redirectUrl } = req.query;

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    // frame stateData to be passed to Google
    const stateData = {
      partnerId, // pass the partner id
      redirectUrl,
      token, // pass the invitation token if exist, otherwise pass null
    };

    const googleAuthUrl = await getAuthUrl(stateData, partnerId);

    // redirect to Google authentication URL
    return res.redirect(googleAuthUrl);

  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
