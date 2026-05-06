import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { PARTNER_BRANDING_CACHE } from '../../config/constants';
import { isEmpty } from 'lodash';

/**
 * Get branding data for a given partner
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} branding data
 */
export const getPartnerBranding = async(req, res) => {
  const logger = Container.get('logger');
  const PartnerBrandingModelHandler = Container.get('PartnerBrandingModelHandler');

  try {
    const partnerId = req.partner.id;
    // if partnerId is not provided, return an error
    if (!partnerId) {
      logger.error('Partner ID is required to add or update custom script.');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
    }

    logger.info(`Fetching branding for partner ID: ${partnerId}`);
    const branding = await PartnerBrandingModelHandler.getPartnersBrandingByPartnerId(partnerId);

    if (!branding) {
      logger.warn(`Branding not found for partner ID: ${partnerId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Branding not found.' });
    }

    return res.status(StatusCodes.OK).send(branding);
  } catch (error) {
    logger.error(`Error occurred while fetching partner branding: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};

/**
 * Get branding data for a given partner
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} branding data
 */
export const getPublicPartnerBranding = async(req, res) => {
  const logger = Container.get('logger');
  const PartnerBrandingModelHandler = Container.get('PartnerBrandingModelHandler');
  const redisClient = Container.get('redisClient');

  try {
    const partnerDomain = req.query.domain;
    logger.info(`Fetching branding for public partner domain: ${partnerDomain}`);

    // Check if user info exist in redis
    logger.info(`Checking cache for partner branding with domain: ${partnerDomain}`);
    let partnerBrandingDetails = await redisClient.get(`${PARTNER_BRANDING_CACHE}${partnerDomain}`);

    if (!partnerBrandingDetails) {
      logger.info(`Cache miss for partner branding with domain: ${partnerDomain}, checking in database`);
      // verify api key is valid or not
      partnerBrandingDetails = await PartnerBrandingModelHandler.getPartnersBrandingByWhere({ customer_portal_domain_url: partnerDomain });
      logger.info(`Fetched branding details from database for domain: ${partnerDomain}`);
      if (isEmpty(partnerBrandingDetails)) {
        logger.warn(`Branding not found for partner domain: ${partnerDomain}`);
        return res.status(StatusCodes.NOT_FOUND).send({message: 'partner branding not found'});
      }
      // update the cache in Redis
      logger.info(`Setting cache for partner branding with domain: ${partnerDomain}`);
      redisClient.set(`${PARTNER_BRANDING_CACHE}${partnerBrandingDetails.customer_portal_domain_url}`, JSON.stringify({
        name: partnerBrandingDetails.name,
        primary_color: partnerBrandingDetails.primary_color,
        secondary_color: partnerBrandingDetails.secondary_color,
        dark_text_color: partnerBrandingDetails.dark_text_color,
        light_text_color: partnerBrandingDetails.light_text_color,
        logo_url: partnerBrandingDetails.logo_url,
        fav_icon_url: partnerBrandingDetails.fav_icon_url,
        partner_id: partnerBrandingDetails.partner_id,
      }));
    } else {
      partnerBrandingDetails = JSON.parse(partnerBrandingDetails);
    }

    return res.status(StatusCodes.OK).send(partnerBrandingDetails);
  } catch (error) {
    logger.error(`Error occurred while fetching public partner branding: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });
  }
};
