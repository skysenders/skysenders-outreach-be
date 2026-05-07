import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, PARTNER_ORIGIN_CACHE, PARTNER_BRANDING_CACHE } from '../../config/constants';

/**
 * Functionality used to create a new partner in the database
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} newly created partner data
 */
export const createPartner = async(req, res) => {
  const PartnerModelHandler = Container.get('PartnerModelHandler');
  const PartnerBrandingModelHandler = Container.get('PartnerBrandingModelHandler');
  const redisClient = Container.get('redisClient');
  const logger = Container.get('logger');

  try {
    const partnerData = req.body;
    logger.info(`Creating new partner with email: ${partnerData.email}`);
    // Check if partner already exists
    const existingPartner = await PartnerModelHandler.getPartnerByWhere({ email: partnerData.email });

    if (existingPartner && existingPartner.id) {
      logger.warn(`Partner with email: ${partnerData.email} already exists`);
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Partner already exists with this email.' });
    }

    // Create partner
    const newPartner = await PartnerModelHandler.createPartner(partnerData);

    if (!(newPartner && newPartner.id)) {
      logger.error(`Failed to create new partner with email: ${partnerData.email}`);
      throw new Error('Failed to create new partner in database');
    }

    // remove the https:// from the url
    partnerData.customer_portal_domain_url = TRIM_ORIGIN_DOMAIN(partnerData.customer_portal_domain_url);
    redisClient.set(`${PARTNER_ORIGIN_CACHE}${partnerData.customer_portal_domain_url}`, newPartner.id);

    // Create default branding
    const partnerBranding = await PartnerBrandingModelHandler.createPartnersBranding({
      partner_id: newPartner.id,
      name: 'Default Branding',
      customer_portal_domain_url: partnerData.customer_portal_domain_url
    });

    if (partnerBranding && partnerBranding.partner_id) {
      // update the cache in Redis
      redisClient.set(`${PARTNER_BRANDING_CACHE}${partnerBranding.customer_portal_domain_url}`, JSON.stringify({
        name: partnerBranding.name,
        primary_color: partnerBranding.primary_color,
        secondary_color: partnerBranding.secondary_color,
        dark_text_color: partnerBranding.dark_text_color,
        light_text_color: partnerBranding.light_text_color,
        logo_url: partnerBranding.logo_url,
        fav_icon_url: partnerBranding.fav_icon_url,
        partner_id: partnerBranding.partner_id,
      }));
    }

    logger.info(`New partner created successfully with email: ${partnerData.email}`);
    return res.status(StatusCodes.CREATED).send({ partner: newPartner });
  } catch (error) {
    logger.error(`Error occurred while creating partner: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};
