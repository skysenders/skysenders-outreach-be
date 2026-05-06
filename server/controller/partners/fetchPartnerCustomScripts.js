import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';

/**
 * Get custom scripts for a given partner
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} header and footer scripts
 */
export const getPartnerCustomScripts = async(req, res) => {
  const PartnerCustomScriptsModelHandler = Container.get('PartnerCustomScriptsModelHandler');
  const logger = Container.get('logger');

  try {
    const partnerId = req.partner.id;
    // if partnerId is not provided, return an error
    if (!partnerId) {
      logger.error('Partner ID is required to add or update custom script.');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
    }

    logger.info(`Fetching custom scripts for partner ID: ${partnerId}`);
    const scripts = await PartnerCustomScriptsModelHandler.getPartnerScriptsByWhere({ partner_id: partnerId });

    if (!scripts) {
      logger.warn(`Custom scripts not found for partner ID: ${partnerId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Custom scripts not found.' });
    }

    return res.status(StatusCodes.OK).send({
      scripts,
    });
  } catch (error) {
    logger.error(`Error occurred while fetching partner custom scripts: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};


/**
 * Get custom scripts for a given partner
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} header and footer scripts
 */
export const getPartnerPublicCustomScripts = async(req, res) => {
  const PartnerCustomScriptsModelHandler = Container.get('PartnerCustomScriptsModelHandler');
  const logger = Container.get('logger');

  try {
    const partnerId = req.query.partner_id;

    logger.info(`Fetching custom scripts for partner ID: ${partnerId}`);
    const scripts = await PartnerCustomScriptsModelHandler.getPartnerScriptsByWhere({
      partner_id: partnerId,
      status: 'active'
    });

    if (!scripts) {
      logger.warn(`Custom scripts not found for partner ID: ${partnerId}`);
      return res.status(StatusCodes.OK).send({ message: 'Custom scripts not found.', scripts: [] });
    }

    return res.status(StatusCodes.OK).send({
      scripts,
    });
  } catch (error) {
    logger.error(`Error occurred while fetching public partner custom scripts: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};

