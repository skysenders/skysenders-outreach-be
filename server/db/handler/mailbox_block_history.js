import { db } from '../index';
import { Container } from 'typedi';

export const getMailboxBlockHistoryByWhere = async(where) => {
  try {
    return await db.mailbox_block_history.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox block history: ${err.message}`);
    throw err;
  }
};

export const getAllMailboxBlockHistoryByWhere = async(where) => {
  try {
    return await db.mailbox_block_history.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox block history list: ${err.message}`);
    throw err;
  }
};

export const createMailboxBlockHistory = async(data) => {
  try {
    return await db.mailbox_block_history.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating mailbox block history: ${err.message}`);
    throw err;
  }
};
