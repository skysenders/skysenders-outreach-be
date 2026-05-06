import { db } from '../index';
import { Container } from 'typedi';

export const getPartnerSessionByWhere = async(where) => {
  try {
    return await db.partner_sessions.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching partner session: ${err.message}`);
    throw err;
  }
};

export const getAllPartnerSessionsByWhere = async(where) => {
  try {
    return await db.partner_sessions.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching partner sessions: ${err.message}`);
    throw err;
  }
};

export const createPartnerSession = async(data) => {
  try {
    return await db.partner_sessions.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating partner session: ${err.message}`);
    throw err;
  }
};

export const updatePartnerSession = async(data, where) => {
  try {
    const [_, updated] = await db.partner_sessions.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating partner session: ${err.message}`);
    throw err;
  }
};

export const revokePartnerSessionByToken = async(refreshToken) => {
  try {
    const [_, updated] = await db.partner_sessions.update({
      is_active: false,
      revoked_at: new Date(),
      updated_at: new Date()
    }, {
      where: { refresh_token: refreshToken },
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error revoking partner session: ${err.message}`);
    throw err;
  }
};

export const deletePartnerSession = async(where) => {
  try {
    return await db.partner_sessions.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting partner session: ${err.message}`);
    throw err;
  }
};
