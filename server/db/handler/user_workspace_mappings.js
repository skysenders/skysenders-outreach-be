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

export const bulkCreateUserToWorkspace = async(data) => {
  try {
    return await db.user_workspace_mappings.bulkCreate(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating user to workspace: ${err.message}`);
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

export const bulkUpdateWorkspaceMember = async(data, where) => {
  try {
    const [_, updated] = await db.user_workspace_mappings.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk updating workspace member: ${err.message}`);
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

export const getWorkspaceMemberDetails = async(workspaceId, { search_text: searchText, userId, role, status }) => {
  let filterWhereQuery = ' AND uwm.is_deleted = false';
  const replacements = { workspaceId };

  if (userId) {
    filterWhereQuery += ' AND uwm.user_id = :userId';
    replacements.userId = userId;
  }

  if (status?.length) {

    if (status.includes('deleted')) {
      filterWhereQuery = ' AND uwm.is_deleted = true';
    } else {
      filterWhereQuery += ' AND uwm.status IN (:status)';
    }

    replacements.status = status;
  }

  if (searchText) {
    filterWhereQuery += ' AND (u.name ILIKE :searchText OR u.email ILIKE :searchText)';
    replacements.searchText = `%${searchText}%`;
  }

  if (role?.length) {
    filterWhereQuery += ' AND uwm.role IN (:role)';
    replacements.role = role;
  }

  const query = `
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      u.is_first_invite,
      uwm.role,
      uwm.permission,
      uwm.status,
      uwm.is_active,
      uwm.invited_at,
      uwm.invited_by,
      uwm.created_at as joined_at
    FROM user_workspace_mappings uwm
    INNER JOIN users u ON uwm.user_id = u.id
    WHERE uwm.workspace_id = :workspaceId
    ${filterWhereQuery}
    ORDER BY uwm.id ASC;
  `;

  return await db.sequelize.query(query, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT
  });
};
