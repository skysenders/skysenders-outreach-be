import { db } from '../index';
import { Container } from 'typedi';


export const getPartnerScriptsByWhere = async(where) => {
  try {
    return await db.partners_custom_scripts.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching scripts: ${err.message}`);
    throw err;
  }
};

export const createPartnerScript = async(data) => {
  try {
    return await db.partners_custom_scripts.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating script: ${err.message}`);
    throw err;
  }
};

export const updatePartnerScript = async(data, where) => {
  try {
    const [_, updated] = await db.partners_custom_scripts.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating script: ${err.message}`);
    throw err;
  }
};

export const deletePartnerScript = async(id, partnerId) => {
  try {
    return await db.partners_custom_scripts.destroy({ where: { id, partner_id: partnerId } });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting script: ${err.message}`);
    throw err;
  }
};
