import { db } from '../index';
import { Container } from 'typedi';
import { SEQUENCE_STATUS } from '../../config/constants';

export const getSequenceByWhere = async(where) => {
  try {
    return await db.sequences.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching sequence: ${err.message}`);
    throw err;
  }
};

export const getSequenceWithAttribute = async(where, attributes) => {
  try {
    return await db.sequences.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching sequence: ${err.message}`);
    throw err;
  }
};

export const getAllSequencesByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.sequences.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching sequences: ${err.message}`);
    throw err;
  }
};

export const countSequencesByWhere = async(where) => {
  try {
    return await db.sequences.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting sequences: ${err.message}`);
    throw err;
  }
};

export const createSequence = async(data) => {
  try {
    return await db.sequences.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating sequence: ${err.message}`);
    throw err;
  }
};

export const updateSequence = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.sequences.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating sequence: ${err.message}`);
    throw err;
  }
};

export const deleteSequence = async(where) => {
  try {
    return await db.sequences.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting sequence: ${err.message}`);
    throw err;
  }
};

export const softDeleteSequence = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.sequences.update(
      {
        deleted_at: new Date(),
        updated_at: new Date(),
        status: SEQUENCE_STATUS.ARCHIVED
      },
      { where, returning: ['id', 'name'], }
    );
    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting sequence: ${err.message}`);
    throw err;
  }
};

export const updateSequenceTotalContactsCount = async(seqId) => {
  try {
    await db.sequelize.query(`
      update sequences set total_no_contacts = (
        select count(*) from seq_contact_mappings scm
        where scm.workspace_id = sequences.workspace_id and scm.seq_id = sequences.id
      )
      where sequences.id = ${seqId}`
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating sequence total contacts count: ${err.message}`);
    throw err;
  }
};
