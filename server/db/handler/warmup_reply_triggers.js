import { db } from '../index';
import { Container } from 'typedi';

export const getWarmupReplyTriggerByWhere = async(where) => {
  try {
    return await db.warmup_reply_triggers.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup reply trigger: ${err.message}`);
    throw err;
  }
};

export const getAllWarmupReplyTriggersByWhere = async(where) => {
  try {
    return await db.warmup_reply_triggers.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup reply triggers: ${err.message}`);
    throw err;
  }
};

export const createWarmupReplyTrigger = async(data) => {
  try {
    return await db.warmup_reply_triggers.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating warmup reply trigger: ${err.message}`);
    throw err;
  }
};

export const updateWarmupReplyTrigger = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.warmup_reply_triggers.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating warmup reply trigger: ${err.message}`);
    throw err;
  }
};

export const deleteWarmupReplyTrigger = async(where) => {
  try {
    return await db.warmup_reply_triggers.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting warmup reply trigger: ${err.message}`);
    throw err;
  }
};
