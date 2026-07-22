import { db } from '../index';
import { Container } from 'typedi';

export const getSeqStepVariantByWhere = async(where) => {
  try {
    return await db.seq_step_variants.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step variant: ${err.message}`);
    throw err;
  }
};

export const getSeqStepVariantWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_step_variants.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step variant: ${err.message}`);
    throw err;
  }
};

export const getAllSeqStepVariantsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_step_variants.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step variants: ${err.message}`);
    throw err;
  }
};

export const getAllSeqStepVariants = async(where, attributes = ['id']) => {
  try {
    return await db.seq_step_variants.findAll({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step variants: ${err.message}`);
    throw err;
  }
};

export const countSeqStepVariantsByWhere = async(where) => {
  try {
    return await db.seq_step_variants.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq step variants: ${err.message}`);
    throw err;
  }
};

export const createSeqStepVariant = async(data) => {
  try {
    return await db.seq_step_variants.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq step variant: ${err.message}`);
    throw err;
  }
};

export const updateSeqStepVariant = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_step_variants.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq step variant: ${err.message}`);
    throw err;
  }
};

export const deleteSeqStepVariant = async(where) => {
  try {
    return await db.seq_step_variants.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq step variant: ${err.message}`);
    throw err;
  }
};

export const softDeleteSeqStepVariant = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_step_variants.update(
      {
        deleted_at: new Date(),
        updated_at: new Date()
      },
      { where, returning: ['id', 'label'], }
    );
    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting seq step variant: ${err.message}`);
    throw err;
  }
};
