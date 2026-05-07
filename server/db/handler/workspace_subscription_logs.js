/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getSubscriptionLogsByWhere = async(where) => {
  try {
    return await db.workspace_subscription_logs.findAll({
      where,
      raw: true,
      order: [['created_at', 'DESC']]
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching subscription logs: ${err.message}`);
    throw err;
  }
};

export const createSubscriptionLog = async(data) => {
  try {
    return await db.workspace_subscription_logs.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating subscription log: ${err.message}`);
    throw err;
  }
};

export const bulkCreateSubscriptionLogs = async(data) => {
  try {
    return await db.workspace_subscription_logs.bulkCreate(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating subscription logs: ${err.message}`);
    throw err;
  }
};
