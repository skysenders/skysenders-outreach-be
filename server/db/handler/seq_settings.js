import { db } from '../index';
import { Container } from 'typedi';

export const getSeqSettingByWhere = async(where) => {
  try {
    return await db.seq_settings.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq setting: ${err.message}`);
    throw err;
  }
};

export const getSeqSettingWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_settings.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq setting: ${err.message}`);
    throw err;
  }
};

export const getAllSeqSettingsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_settings.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq settings: ${err.message}`);
    throw err;
  }
};

export const countSeqSettingsByWhere = async(where) => {
  try {
    return await db.seq_settings.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq settings: ${err.message}`);
    throw err;
  }
};

export const createSeqSetting = async(data) => {
  try {
    return await db.seq_settings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq setting: ${err.message}`);
    throw err;
  }
};

export const updateSeqSetting = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_settings.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq setting: ${err.message}`);
    throw err;
  }
};

export const deleteSeqSetting = async(where) => {
  try {
    return await db.seq_settings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq setting: ${err.message}`);
    throw err;
  }
};
