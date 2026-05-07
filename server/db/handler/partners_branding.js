/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getPartnersBrandingByWhere = async(where) => {
  try {
    return await db.partners_branding.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching branding: ${err.message}`);
    throw err;
  }
};

export const getPartnersBrandingByPartnerId = async(partnerId) => {
  try {
    return await db.partners_branding.findOne({
      where: { partner_id: partnerId },
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching branding by partner_id: ${err.message}`);
    throw err;
  }
};

export const createPartnersBranding = async(data) => {
  try {
    return await db.partners_branding.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating branding: ${err.message}`);
    throw err;
  }
};

export const updatePartnersBranding = async(data, where) => {
  try {
    const [_, updated] = await db.partners_branding.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating branding: ${err.message}`);
    throw err;
  }
};

export const deletePartnersBranding = async(partnerId) => {
  try {
    return await db.partners_branding.destroy({ where: { partner_id: partnerId } });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting branding: ${err.message}`);
    throw err;
  }
};
