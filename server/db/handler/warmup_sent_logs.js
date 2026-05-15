import { db } from '../index';
import { Container } from 'typedi';

export const getWarmupSentLogByWhere = async(where) => {
  try {
    return await db.warmup_sent_logs.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup sent log: ${err.message}`);
    throw err;
  }
};

export const getAllWarmupSentLogsByWhere = async(where) => {
  try {
    return await db.warmup_sent_logs.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup sent logs: ${err.message}`);
    throw err;
  }
};

export const createWarmupSentLog = async(data) => {
  try {
    return await db.warmup_sent_logs.create({
      ...data,
      sent_time: data.sent_time || new Date(),
      log_date: data.log_date || new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating warmup sent log: ${err.message}`);
    throw err;
  }
};

export const bulkCreateWarmupSentLogs = async(dataArray) => {
  try {
    return await db.warmup_sent_logs.bulkCreate(
      dataArray.map(d => ({
        ...d,
        sent_time: d.sent_time || new Date(),
        log_date: d.log_date || new Date().toISOString().split('T')[0]
      }))
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating warmup sent logs: ${err.message}`);
    throw err;
  }
};

export const deleteWarmupSentLogs = async(where) => {
  try {
    return await db.warmup_sent_logs.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting warmup sent logs: ${err.message}`);
    throw err;
  }
};
