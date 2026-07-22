import { db } from '../index';
import { Container } from 'typedi';

export const getSeqContactMappingByWhere = async(where) => {
  try {
    return await db.seq_contact_mappings.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq contact mapping: ${err.message}`);
    throw err;
  }
};

export const getSeqContactMappingWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_contact_mappings.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq contact mapping: ${err.message}`);
    throw err;
  }
};

export const getAllSeqContactMappings = async(where, attributes = ['contact_id']) => {
  try {
    return await db.seq_contact_mappings.findAll({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq contact mappings: ${err.message}`);
    throw err;
  }
};

export const getSeqContactDetailsByContactId = async(workspaceId, contactId) => {
  try {
    const contact = await db.sequelize.query(`
      select scm.*, c.*
      FROM seq_contact_mappings scm
      JOIN contacts c
        ON c.workspace_id = scm.workspace_id
       AND c.id = scm.contact_id
      WHERE scm.workspace_id = $1
        AND scm.contact_id = $2`, {
      bind: [workspaceId, contactId],
      type: db.sequelize.QueryTypes.SELECT
    });
    return contact[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq contact mapping by contact ID: ${err.message}`);
    throw err;
  }
};

export const getAllPaginatedSeqContactMappings = async(where, offset, limit) => {
  try {
    return await db.seq_contact_mappings.findAll({ where, offset, limit, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq contact mappings: ${err.message}`);
    throw err;
  }
};

export const countSeqContactMappingsByWhere = async(where) => {
  try {
    return await db.seq_contact_mappings.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq contact mappings: ${err.message}`);
    throw err;
  }
};

export const createSeqContactMapping = async(data) => {
  try {
    return await db.seq_contact_mappings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq contact mapping: ${err.message}`);
    throw err;
  }
};

export const updateSeqContactMapping = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_contact_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq contact mapping: ${err.message}`);
    throw err;
  }
};

export const deleteSeqContactMapping = async(where) => {
  try {
    return await db.seq_contact_mappings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq contact mapping: ${err.message}`);
    throw err;
  }
};

export const bulkCreateSeqContactMappings = async(data) => {
  try {
    return await db.seq_contact_mappings.bulkCreate(data, { ignoreDuplicates: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating seq contact mappings: ${err.message}`);
    throw err;
  }
};
