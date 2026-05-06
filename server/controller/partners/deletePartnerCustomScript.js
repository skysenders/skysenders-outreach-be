// controllers/partner/customScriptController.js

import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';

/**
 * Delete a partner's custom script
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} response object
 */
export const deletePartnerCustomScript = async(req, res) => {

  const logger = Container.get('logger');
  const PartnerCustomScriptsModelHandler = Container.get('PartnerCustomScriptsModelHandler');

  try {
    const partnerId = req.partner?.id;
    const id = req.params?.id;

    // if partnerId is not provided, return an error
    if (!partnerId) {
      logger.error('Partner ID is required to delete custom script.');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
    }


    logger.info(`Deleting custom script with id: ${id} for partner: ${partnerId}`);
    const result = await PartnerCustomScriptsModelHandler.deletePartnerScript(id, partnerId);

    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Custom script not found.' });
    }

    logger.info(`Custom script deleted successfully for partner: ${partnerId}`);

    return res.status(StatusCodes.OK).send({
      message: 'Custom script deleted successfully.',
      script: result,
    });

  } catch (error) {
    logger.error(`Error occurred while deleting custom script: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};
