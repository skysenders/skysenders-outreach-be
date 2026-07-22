import { db } from '../index';
import { Container } from 'typedi';

export const getSeqStepAbTestByWhere = async(where) => {
  try {
    return await db.seq_step_ab_tests.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step ab test: ${err.message}`);
    throw err;
  }
};

export const getSeqStepAbTestWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_step_ab_tests.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step ab test: ${err.message}`);
    throw err;
  }
};

export const getAllSeqStepAbTestsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_step_ab_tests.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step ab tests: ${err.message}`);
    throw err;
  }
};

export const countSeqStepAbTestsByWhere = async(where) => {
  try {
    return await db.seq_step_ab_tests.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq step ab tests: ${err.message}`);
    throw err;
  }
};

export const createSeqStepAbTest = async(data) => {
  try {
    return await db.seq_step_ab_tests.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq step ab test: ${err.message}`);
    throw err;
  }
};

export const updateSeqStepAbTest = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_step_ab_tests.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq step ab test: ${err.message}`);
    throw err;
  }
};

export const deleteSeqStepAbTest = async(where) => {
  try {
    return await db.seq_step_ab_tests.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq step ab test: ${err.message}`);
    throw err;
  }
};
