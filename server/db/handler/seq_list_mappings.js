import { db } from '../index';
import { Container } from 'typedi';

export const getSeqListMappingByWhere = async(where) => {
  try {
    return await db.seq_list_mappings.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq list mapping: ${err.message}`);
    throw err;
  }
};

export const getSeqListMappingWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_list_mappings.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq list mapping: ${err.message}`);
    throw err;
  }
};

export const getAllSeqListMappingsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_list_mappings.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq list mappings: ${err.message}`);
    throw err;
  }
};

export const countSeqListMappingsByWhere = async(where) => {
  try {
    return await db.seq_list_mappings.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq list mappings: ${err.message}`);
    throw err;
  }
};

export const createSeqListMapping = async(data) => {
  try {
    return await db.seq_list_mappings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq list mapping: ${err.message}`);
    throw err;
  }
};

export const bulkCreateSeqListMappings = async(data) => {
  try {
    return await db.seq_list_mappings.bulkCreate(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating seq list mappings: ${err.message}`);
    throw err;
  }
};

export const updateSeqListMapping = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_list_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq list mapping: ${err.message}`);
    throw err;
  }
};

export const deleteSeqListMapping = async(where) => {
  try {
    return await db.seq_list_mappings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq list mapping: ${err.message}`);
    throw err;
  }
};
