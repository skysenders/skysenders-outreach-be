/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getPlanDetailsByWhere = async(where) => {
  try {
    return await db.workspace_plan_details.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching plan details: ${err.message}`);
    throw err;
  }
};

export const getPlansByWhere = async(where) => {
  try {
    return await db.workspace_plan_details.findAll({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching plans: ${err.message}`);
    throw err;
  }
};

export const createPlanDetails = async(data) => {
  try {
    return await db.workspace_plan_details.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating plan details: ${err.message}`);
    throw err;
  }
};

export const updatePlanDetails = async(data, where) => {
  try {
    const [_, updated] = await db.workspace_plan_details.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating plan details: ${err.message}`);
    throw err;
  }
};

export const deletePlanDetails = async(where) => {
  try {
    return await db.workspace_plan_details.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting plan details: ${err.message}`);
    throw err;
  }
};
