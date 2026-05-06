// controllers/partner/customScriptController.js

import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';

/**
 * Adds or updates a partner's custom script
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} response object
 */
export const addOrUpdatePartnerCustomScript = async(req, res) => {

  const logger = Container.get('logger');
  const PartnerCustomScriptsModelHandler = Container.get('PartnerCustomScriptsModelHandler');

  try {
    const partnerId = req.partner?.id;
    const id = req.body?.id;

    // if partnerId is not provided, return an error
    if (!partnerId) {
      logger.error('Partner ID is required to add or update custom script.');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
    }

    let result;

    // if id is provided, update the existing script; otherwise, create a new one
    if (id) {
      logger.info(`Updating custom script with id: ${id} for partner: ${partnerId}`);
      result = await PartnerCustomScriptsModelHandler.updatePartnerScript({
        name: req.body.name,
        placement: req.body.placement,
        script: req.body.script,
        status: req.body.status,
      }, { id, partner_id: partnerId });
      if (!result) {
        return res.status(StatusCodes.NOT_FOUND).send({ message: 'Custom script not found or update failed.' });
      }
    } else {
      logger.info(`Adding new custom script for partner: ${partnerId}`);
      // else create a new custom script
      result = await PartnerCustomScriptsModelHandler.createPartnerScript({
        partner_id: partnerId,
        ...req.body,
      });
    }
    logger.info(`Custom script ${id ? 'updated' : 'added'} successfully for partner: ${partnerId}`);

    return res.status(StatusCodes.OK).send({
      message: id ? 'Custom script updated successfully.' : 'Custom script added successfully.',
      script: result,
    });
  } catch (error) {
    logger.error(`Error occurred while adding/updating custom script: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};
