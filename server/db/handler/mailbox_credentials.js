import { db } from '../index';
import { Container } from 'typedi';

export const getMailboxCredentialsByWhere = async(where) => {
  try {
    return await db.mailbox_credentials.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox credentials: ${err.message}`);
    throw err;
  }
};

export const getAllMailboxCredentialsByWhere = async(where) => {
  try {
    return await db.mailbox_credentials.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox credentials list: ${err.message}`);
    throw err;
  }
};

export const createMailboxCredentials = async(data) => {
  try {
    return await db.mailbox_credentials.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating mailbox credentials: ${err.message}`);
    throw err;
  }
};

export const updateMailboxCredentials = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.mailbox_credentials.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating mailbox credentials: ${err.message}`);
    throw err;
  }
};

export const deleteMailboxCredentials = async(where) => {
  try {
    return await db.mailbox_credentials.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting mailbox credentials: ${err.message}`);
    throw err;
  }
};
