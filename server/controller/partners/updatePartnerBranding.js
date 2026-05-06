import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { PARTNER_BRANDING_CACHE } from '../../config/constants';

/**
 * Functionality used to update partner branding in the database
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} updated branding data
 */
export const updatePartnerBranding = async(req, res) => {
  const PartnerBrandingModelHandler = Container.get('PartnerBrandingModelHandler');
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  try {
    const partnerId = req.partner?.id;
    const brandingData = req.body;
    // if partnerId is not provided, return an error
    if (!partnerId) {
      logger.error('Partner ID is required to add or update custom script.');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
    }

    logger.info(`Updating branding for partner ID: ${partnerId}`);
    // Update branding
    const updatedBranding = await PartnerBrandingModelHandler.updatePartnersBranding(brandingData, { partner_id: partnerId });

    // return error if partner not found or update failed
    if (!updatedBranding) {
      logger.warn(`Branding not found or update failed for partner ID: ${partnerId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Branding not found or update failed.' });
    }

    // update the cache in Redis
    redisClient.set(`${PARTNER_BRANDING_CACHE}${updatedBranding.customer_portal_domain_url}`, JSON.stringify({
      name: updatedBranding.name,
      primary_color: updatedBranding.primary_color,
      secondary_color: updatedBranding.secondary_color,
      dark_text_color: updatedBranding.dark_text_color,
      light_text_color: updatedBranding.light_text_color,
      logo_url: updatedBranding.logo_url,
      fav_icon_url: updatedBranding.fav_icon_url,
      partner_id: updatedBranding.partner_id,
    }));

    logger.info(`Branding updated successfully for partner ID: ${partnerId}`);
    return res.status(StatusCodes.OK).send({
      message: 'Branding updated successfully.',
      branding: updatedBranding,
    });
  } catch (error) {
    logger.error(`Error occurred while updating partner branding: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};
