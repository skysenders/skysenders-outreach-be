import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { PARTNER_STATUS } from '../../config/constants';

/**
 * Functionality used to log out a partner by revoking their refresh token
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} success message
 */
export const logoutPartner = async(req, res) => {

  const PartnerSessionModelHandler = Container.get('PartnerSessionModelHandler');
  const logger = Container.get('logger');

  try {
    const { refresh_token: refreshToken } = req.body;

    // delete partner session from the database
    logger.info('Attempting to log out partner with refresh token');

    let revokedSession = await PartnerSessionModelHandler.revokePartnerSessionByToken(refreshToken);

    // if the partner session is not found in the database, respond with not found
    if (!revokedSession) {
      logger.error('Partner session with provided refresh token not found for logout');
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'Partner session not found' });
    }

    logger.info('Partner logged out successfully');

    // return success message
    return res.status(StatusCodes.OK).type('application/json').send({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error(`Error occurred during partner login: ${error.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
