/* eslint-disable no-unused-vars */
import { QueryTypes } from 'sequelize';
import { db } from '../index';
import { Container } from 'typedi';

export const getWorkspacesByWhere = async(where) => {
  try {
    return await db.workspaces.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching workspaces: ${err.message}`);
    throw err;
  }
};

export const getWorkspaceById = async(id) => {
  try {
    return await db.workspaces.findOne({ where: { id }, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching workspace: ${err.message}`);
    throw err;
  }
};

export const getWorkspaceByWhere = async(where) => {
  try {
    return await db.workspaces.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching one workspace: ${err.message}`);
    throw err;
  }
};

export const createWorkspace = async(data) => {
  try {
    return await db.workspaces.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating workspace: ${err.message}`);
    throw err;
  }
};

export const updateWorkspace = async(data, where) => {
  try {
    const [_, updated] = await db.workspaces.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating workspace: ${err.message}`);
    throw err;
  }
};

export const deleteWorkspace = async(id) => {
  try {
    return await db.workspaces.destroy({ where: { id } });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting workspace: ${err.message}`);
    throw err;
  }
};

/**
 * Functionality used to fetch a workspace object
 * from the database using api key
 * @param {string} apiKey workspace apiKey
 * @returns {Object} workspace
 */
export const findWorkspaceWithPlanDetailsByAPIKey = async(apiKey) => {
  try {
    const workspaceData = await db.sequelize.query(`
      SELECT
        w.id,
        w.uuid,
        w.name,
        w.slug,
        w.api_key,
        w.custom_api_rate_limit,
        w.partner_id as tenant_id,
        jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'name', u.name,
          'tenant_id', u.partner_id,
          'workspace_id', w.id
        ) AS user,

        jsonb_build_object(
          'id', pd.id,
          'plan_name', pd.plan_name,
          'trial_start_date', pd.trial_start_date,
          'trial_end_date', pd.trial_end_date,
          'plan_end_date', pd.plan_end_date
        ) AS plan_details

      FROM workspaces w
      LEFT JOIN users u
        ON u.id = w.owner_user_id
      LEFT JOIN workspace_plan_details pd
        ON pd.workspace_id = w.id
      WHERE w.api_key = '${apiKey}';`,
    { type: QueryTypes.SELECT });

    return workspaceData[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error while finding workspace plan data by api key ${err.message}`);
    throw err;
  }
};
