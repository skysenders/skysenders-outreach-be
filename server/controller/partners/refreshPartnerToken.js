import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { PARTNER_STATUS } from '../../config/constants';

/**
 * Functionality used to refresh a partner's authentication token
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} new token and partner info
 */
export const refreshPartnerToken = async(req, res) => {

  const TokenHandler = Container.get('TokenHandler');
  const PartnerModelHandler = Container.get('PartnerModelHandler');
  const PartnerSessionModelHandler = Container.get('PartnerSessionModelHandler');
  const logger = Container.get('logger');

  try {
    const { refresh_token: refreshToken } = req.body;

    // check if partner exists in the database
    logger.info('Attempting to refresh token for partner with refresh token');

    let partnerSessionDBData = await PartnerSessionModelHandler.getPartnerSessionByWhere({ refresh_token: refreshToken });

    // if the partner session is not found in the database, respond with not found
    if (!partnerSessionDBData) {
      logger.error('Partner session with provided refresh token not found');
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'Partner session not found' });
    }

    // if the partner session is not active, respond with unauthorized
    if (!partnerSessionDBData.is_active) {
      logger.error('Partner session with provided refresh token is not active');
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Partner session is not active' });
    }

    // check if partner is active
    let partnerDBData = await PartnerModelHandler.getPartnerByWhere({ id: partnerSessionDBData.partner_id });

    if (!partnerDBData || partnerDBData.status !== PARTNER_STATUS.ACTIVE) {
      logger.error('Partner associated with the session is not active or not found');
      return res
        .status(StatusCodes.NOT_ACCEPTABLE)
        .send({ message: 'Partner not active or not found' });
    }

    // generate token with partner
    const token = await TokenHandler.generatePartnerToken(partnerDBData);

    // create a new partner session in the database
    await PartnerSessionModelHandler.updatePartnerSession({
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at,
      updated_at: new Date().toISOString()
    }, {
      id: partnerSessionDBData.id
    });

    logger.info('Token refreshed successfully for partner');

    // return token and partner info
    return res.status(StatusCodes.OK).send(token);

  } catch (error) {
    logger.error(`Error occurred during partner login: ${error.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
