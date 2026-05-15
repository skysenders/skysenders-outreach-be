import { db } from '../index';
import { Container } from 'typedi';

export const getMailboxByWhere = async(where) => {
  try {
    return await db.mailboxes.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox: ${err.message}`);
    throw err;
  }
};

export const getAllMailboxesByWhere = async(where, offset = 0, limit = 1000, order = []) => {
  try {
    return await db.mailboxes.findAll({ where, raw: true, offset, limit, order });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailboxes: ${err.message}`);
    throw err;
  }
};

export const createMailbox = async(data) => {
  try {
    return await db.mailboxes.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating mailbox: ${err.message}`);
    throw err;
  }
};

export const updateMailbox = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.mailboxes.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating mailbox: ${err.message}`);
    throw err;
  }
};

export const softDeleteMailbox = async(where) => {
  try {
    return await db.mailboxes.update(
      {
        is_deleted: true,
        deleted_at: new Date(),
        is_active: false,
        updated_at: new Date()
      },
      { where }
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting mailbox: ${err.message}`);
    throw err;
  }
};

export const deleteMailbox = async(where) => {
  try {
    return await db.mailboxes.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting mailbox: ${err.message}`);
    throw err;
  }
};
