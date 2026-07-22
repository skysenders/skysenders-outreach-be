import { db } from '../index';
import { Container } from 'typedi';

export const getSeqStepBranchByWhere = async(where) => {
  try {
    return await db.seq_step_branches.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step branch: ${err.message}`);
    throw err;
  }
};

export const getSeqStepBranchWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_step_branches.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step branch: ${err.message}`);
    throw err;
  }
};

export const getAllSeqStepBranchesByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_step_branches.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step branches: ${err.message}`);
    throw err;
  }
};

export const countSeqStepBranchesByWhere = async(where) => {
  try {
    return await db.seq_step_branches.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq step branches: ${err.message}`);
    throw err;
  }
};

export const createSeqStepBranch = async(data) => {
  try {
    return await db.seq_step_branches.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq step branch: ${err.message}`);
    throw err;
  }
};

export const updateSeqStepBranch = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_step_branches.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq step branch: ${err.message}`);
    throw err;
  }
};

export const deleteSeqStepBranch = async(where) => {
  try {
    return await db.seq_step_branches.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq step branch: ${err.message}`);
    throw err;
  }
};
