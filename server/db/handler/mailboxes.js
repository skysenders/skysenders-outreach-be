import { QueryTypes } from 'sequelize';
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

export const countMailboxesByWhere = async(where) => {
  try {
    return await db.mailboxes.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting mailboxes: ${err.message}`);
    throw err;
  }
};

export const getMailboxWithCredsByWhere = async({ workspaceId, id }) => {
  try {
    const mailbox = await db.sequelize.query(
      `SELECT m.*, 
      c.smtp_host, c.smtp_port, c.smtp_username, c.smtp_password, c.smtp_secure,
      c.imap_host, c.imap_port, c.imap_username, c.imap_password, c.imap_secure
      FROM mailboxes m
      JOIN mailbox_credentials c ON m.id = c.mailbox_id
      WHERE m.workspace_id = :workspace_id AND m.id = :id AND m.is_deleted = false
      LIMIT 1`,
      {
        replacements: { workspace_id: workspaceId, id },
        type: QueryTypes.SELECT,
        raw: true
      }
    );
    return mailbox[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox: ${err.message}`);
    throw err;
  }
};

export const getMailboxAndAllCredsByWhere = async({ workspaceId, id }) => {
  try {
    const mailbox = await db.sequelize.query(
      `SELECT m.*, c.*
      FROM mailboxes m
      JOIN mailbox_credentials c ON m.id = c.mailbox_id
      WHERE m.workspace_id = :workspace_id AND m.id = :id AND m.is_deleted = false
      LIMIT 1`,
      {
        replacements: { workspace_id: workspaceId, id },
        type: QueryTypes.SELECT,
        raw: true
      }
    );
    return mailbox[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox: ${err.message}`);
    throw err;
  }
};

export const getAllMailboxesByWhere = async(where, offset = 0, limit = 1000, order = [['id', 'DESC']]) => {
  try {
    return await db.mailboxes.findAll({ where, raw: true, offset, limit, order });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailboxes: ${err.message}`);
    throw err;
  }
};

export const getAllInternalMailboxesByWhere = async(where, offset = 0, limit = 1000, order = [['id', 'DESC']]) => {
  try {
    return await db.mailboxes.findAll({ where, raw: true, offset, limit, order, attributes: ['id', 'domain_id', 'email', 'name', 'provider', 'status', 'warmup_enabled'] });
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

export const updateMailboxes = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.mailboxes.update(data, {
      where,
      returning: ['id', 'email', 'provider'],
      raw: true
    });

    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating mailboxes: ${err.message}`);
    throw err;
  }
};

export const softDeleteMailbox = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.mailboxes.update(
      {
        is_deleted: true,
        deleted_at: new Date(),
        updated_at: new Date()
      },
      { where, returning: ['id', 'email'], }
    );
    return updated;
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

export const getMailboxesOverallStatus = async(workspaceId) => {
  try {
    const mailboxes = await db.sequelize.query(
      `SELECT 
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS connected_count,
        SUM(CASE WHEN status = 'DISCONNECTED' THEN 1 ELSE 0 END) AS disconnected_count,
        SUM(CASE WHEN warmup_status = 'BLOCKED' THEN 1 ELSE 0 END) AS warmup_error_count
      FROM mailboxes
      WHERE workspace_id = :workspace_id AND is_deleted = false`,
      {
        replacements: { workspace_id: workspaceId },
        type: QueryTypes.SELECT,
        raw: true
      }
    );
    return mailboxes[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching mailbox overall status: ${err.message}`);
    throw err;
  }
};
