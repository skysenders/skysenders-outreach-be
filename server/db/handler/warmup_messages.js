import { db } from '../index';
import { Container } from 'typedi';

export const getWarmupMessageByWhere = async(where) => {
  try {
    return await db.warmup_messages.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup message: ${err.message}`);
    throw err;
  }
};

export const getAllWarmupMessagesByWhere = async(where) => {
  try {
    return await db.warmup_messages.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup messages: ${err.message}`);
    throw err;
  }
};

export const createWarmupMessage = async(data) => {
  try {
    return await db.warmup_messages.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating warmup message: ${err.message}`);
    throw err;
  }
};

export const updateWarmupMessage = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.warmup_messages.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating warmup message: ${err.message}`);
    throw err;
  }
};

export const deleteWarmupMessage = async(where) => {
  try {
    return await db.warmup_messages.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting warmup message: ${err.message}`);
    throw err;
  }
};
