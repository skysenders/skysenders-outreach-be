/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const createWorkspaceClientMapping = async(data) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    return await db.workspace_client_mappings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating workspace client mapping: ${err.message}`);
    throw err;
  }
};

export const getWorkspaceClientMappingByWhere = async(where) => {
  try {
    return await db.workspace_client_mappings.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching workspace client mapping: ${err.message}`);
    throw err;
  }
};

export const getAllWorkspaceClientMappingByWhere = async(where) => {
  try {
    return await db.workspace_client_mappings.findAll({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching all workspace client mappings: ${err.message}`);
    throw err;
  }
};

export const updateWorkspaceClientMapping = async(data, where) => {
  const PasswordHandler = Container.get('PasswordHandler');
  try {
    // encrypt password if it exists
    if (data.password) {
      data.password = await PasswordHandler.encrypt(data.password);
    }
    const [_, updated] = await db.workspace_client_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating workspace client mapping: ${err.message}`);
    throw err;
  }
};


export const deleteWorkspaceClientMapping = async(where) => {
  try {
    return await db.workspace_client_mappings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting workspace client mapping: ${err.message}`);
    throw err;
  }
};
