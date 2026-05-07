/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getWorkspaceMembers = async(where) => {
  try {
    return await db.user_workspace_mappings.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching workspace members: ${err.message}`);
    throw err;
  }
};

export const addUserToWorkspace = async(data) => {
  try {
    return await db.user_workspace_mappings.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error adding user to workspace: ${err.message}`);
    throw err;
  }
};

export const updateWorkspaceMember = async(data, where) => {
  try {
    const [_, updated] = await db.user_workspace_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating workspace member: ${err.message}`);
    throw err;
  }
};

export const removeWorkspaceMember = async(where) => {
  try {
    return await db.user_workspace_mappings.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error removing workspace member: ${err.message}`);
    throw err;
  }
};
