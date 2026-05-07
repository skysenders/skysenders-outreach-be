/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getUsersByWhere = async(where) => {
  try {
    return await db.users.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching users: ${err.message}`);
    throw err;
  }
};

export const getUserByWhere = async(where) => {
  try {
    return await db.users.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching user: ${err.message}`);
    throw err;
  }
};

export const getUserById = async(id) => {
  try {
    return await db.users.findOne({ where: { id }, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching user by id: ${err.message}`);
    throw err;
  }
};

export const createUser = async(data) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    return await db.users.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating user: ${err.message}`);
    throw err;
  }
};

export const updateUser = async(data, where) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    const [_, updated] = await db.users.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating user: ${err.message}`);
    throw err;
  }
};

export const deleteUser = async(id) => {
  try {
    return await db.users.destroy({ where: { id } });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting user: ${err.message}`);
    throw err;
  }
};
