import { db } from '../index';
import { Container } from 'typedi';

export const getSeqMailboxMappingByWhere = async(where) => {
  try {
    return await db.seq_mailbox_mappings.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const getSeqMailboxMappingWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_mailbox_mappings.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const getAllSeqMailboxMappingsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_mailbox_mappings.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq mailbox mappings: ${err.message}`);
    throw err;
  }
};

export const countSeqMailboxMappingsByWhere = async(where) => {
  try {
    return await db.seq_mailbox_mappings.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq mailbox mappings: ${err.message}`);
    throw err;
  }
};

export const createSeqMailboxMapping = async(data) => {
  try {
    return await db.seq_mailbox_mappings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const updateSeqMailboxMapping = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_mailbox_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const deleteSeqMailboxMapping = async(where) => {
  try {
    return await db.seq_mailbox_mappings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const softDeleteSeqMailboxMapping = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    return await db.seq_mailbox_mappings.update(
      { is_active: false },
      {
        where,
        returning: true,
        raw: true
      }
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting seq mailbox mapping: ${err.message}`);
    throw err;
  }
};

export const bulkCreateSeqMailboxMappings = async(data) => {
  try {
    return await db.seq_mailbox_mappings.bulkCreate(data, { ignoreDuplicates: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating seq mailbox mappings: ${err.message}`);
    throw err;
  }
};

export const getSeqMailboxMappings = async(seqId, searchText = '', offset = 0, limit = 1000) => {
  try {
    return await db.sequelize.query(
      `SELECT smm.*, m.name as mailbox_name, m.email as mailbox_email, m.provider, m.status as mailbox_status, m.warmup_enabled, m.warmup_status
       FROM seq_mailbox_mappings smm
       JOIN mailboxes m ON smm.mailbox_id = m.id
       WHERE smm.seq_id = :seqId AND smm.is_active = true
       ${searchText ? 'AND m.email ILIKE :searchText' : ''}
       ORDER BY smm.created_at DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { seqId, searchText: `%${searchText}%`, limit, offset },
        type: db.sequelize.QueryTypes.SELECT,
        raw: true
      }
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq mailbox mappings with details: ${err.message}`);
    throw err;
  }
};
