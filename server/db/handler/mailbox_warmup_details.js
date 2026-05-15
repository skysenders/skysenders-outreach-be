import { db } from '../index';
import { Container } from 'typedi';

export const getMailboxWarmupDetailsByWhere = async(where) => {
  try {
    return await db.mailbox_warmup_details.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox warmup details: ${err.message}`);
    throw err;
  }
};

export const getAllMailboxWarmupDetailsByWhere = async(where) => {
  try {
    return await db.mailbox_warmup_details.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox warmup details list: ${err.message}`);
    throw err;
  }
};

export const createMailboxWarmupDetails = async(data) => {
  try {
    return await db.mailbox_warmup_details.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating mailbox warmup details: ${err.message}`);
    throw err;
  }
};

export const updateMailboxWarmupDetails = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.mailbox_warmup_details.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating mailbox warmup details: ${err.message}`);
    throw err;
  }
};

export const deleteMailboxWarmupDetails = async(where) => {
  try {
    return await db.mailbox_warmup_details.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting mailbox warmup details: ${err.message}`);
    throw err;
  }
};
