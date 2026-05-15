import { db } from '../index';
import { Container } from 'typedi';

export const getWarmupTriggerByWhere = async(where) => {
  try {
    return await db.warmup_trigger_details.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup trigger details: ${err.message}`);
    throw err;
  }
};

export const getAllWarmupTriggersByWhere = async(where) => {
  try {
    return await db.warmup_trigger_details.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup triggers: ${err.message}`);
    throw err;
  }
};

export const createWarmupTrigger = async(data) => {
  try {
    return await db.warmup_trigger_details.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating warmup trigger: ${err.message}`);
    throw err;
  }
};

export const updateWarmupTrigger = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.warmup_trigger_details.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating warmup trigger: ${err.message}`);
    throw err;
  }
};

export const resetDailyWarmupTrigger = async(mailboxId) => {
  try {
    return await db.warmup_trigger_details.update({
      sent_today: 0,
      last_reset_at: new Date(),
      updated_at: new Date()
    }, {
      where: { mailbox_id: mailboxId }
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error resetting warmup trigger: ${err.message}`);
    throw err;
  }
};

export const deleteWarmupTrigger = async(where) => {
  try {
    return await db.warmup_trigger_details.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting warmup trigger: ${err.message}`);
    throw err;
  }
};
