import { db } from '../index';
import { Container } from 'typedi';

export const getDomainByWhere = async(where) => {
  try {
    return await db.domains.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domain: ${err.message}`);
    throw err;
  }
};

export const getAllDomainsByWhere = async(where, offset, limit) => {
  try {
    return await db.domains.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching domains: ${err.message}`);
    throw err;
  }
};

export const createDomain = async(data) => {
  try {
    return await db.domains.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating domain: ${err.message}`);
    throw err;
  }
};

export const updateDomain = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.domains.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating domain: ${err.message}`);
    throw err;
  }
};

export const deleteDomain = async(where) => {
  try {
    return await db.domains.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting domain: ${err.message}`);
    throw err;
  }
};
