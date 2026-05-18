import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { getMicrosoftAuthUrl } from '../../../services/esp_provides/microsoft/microsoft.login.api';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const signinWithMicrosoft = async(req, res) => {
  try {
    const PartnerCacheHelper = Container.get('PartnerCacheHelper');
    const logger = Container.get('logger');

    const { token, redirectUrl } = req.query;

    // find the partner_id based on the req.origin
    let partnerId = await PartnerCacheHelper.getPartnerIdFromOrigin(req.origin);

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${req.origin}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    // frame stateData to be passed to Microsoft
    const stateData = {
      partnerId, // pass the partner id
      redirectUrl,
      token, // pass the invitation token if exist, otherwise pass null
    };

    const microsoftAuthUrl = await getMicrosoftAuthUrl(stateData, partnerId);

    // redirect to Microsoft authentication URL
    return res.redirect(microsoftAuthUrl);

  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
