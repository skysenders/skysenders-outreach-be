import { db } from '../index';
import { Container } from 'typedi';

export const getUserSessionByWhere = async(where) => {
  try {
    return await db.user_sessions.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching user session: ${err.message}`);
    throw err;
  }
};

export const getAllUserSessionsByWhere = async(where) => {
  try {
    return await db.user_sessions.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching user sessions: ${err.message}`);
    throw err;
  }
};

export const createUserSession = async(data) => {
  try {
    return await db.user_sessions.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating user session: ${err.message}`);
    throw err;
  }
};

export const updateUserSession = async(data, where) => {
  try {
    const [_, updated] = await db.user_sessions.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating user session: ${err.message}`);
    throw err;
  }
};

export const revokeUserSessionByToken = async(refreshToken) => {
  try {
    const [_, updated] = await db.user_sessions.update({
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
    logger.error(`Error revoking user session: ${err.message}`);
    throw err;
  }
};

export const deleteUserSession = async(where) => {
  try {
    return await db.user_sessions.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting user session: ${err.message}`);
    throw err;
  }
};
