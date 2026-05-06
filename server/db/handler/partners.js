import { db } from '../index';
import { Container } from 'typedi';


export const getPartnersByWhere = async(where) => {
  try {
    return await db.partners.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching partners: ${err.message}`);
    throw err;
  }
};

export const getPartnerByWhere = async(where) => {
  try {
    return await db.partners.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching partner: ${err.message}`);
    throw err;
  }
};

export const getPartnerById = async(id) => {
  try {
    return await db.partners.findOne({ where: { id }, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching partner by id: ${err.message}`);
    throw err;
  }
};

export const createPartner = async(data) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    return await db.partners.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating partner: ${err.message}`);
    throw err;
  }
};

export const updatePartner = async(data, where) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // Encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.partners.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating partner: ${err.message}`);
    throw err;
  }
};

export const deletePartnerById = async(id) => {
  try {
    return await db.partners.destroy({ where: { id } });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting partner: ${err.message}`);
    throw err;
  }
};
