/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getSubscriptionByWhere = async(where) => {
  try {
    return await db.account_subscriptions.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching subscription: ${err.message}`);
    throw err;
  }
};

export const getSubscriptionsByWhere = async(where) => {
  try {
    return await db.account_subscriptions.findAll({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching subscriptions: ${err.message}`);
    throw err;
  }
};

export const createSubscription = async(data) => {
  try {
    return await db.account_subscriptions.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating subscription: ${err.message}`);
    throw err;
  }
};

export const updateSubscription = async(data, where) => {
  try {
    const [_, updated] = await db.account_subscriptions.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating subscription: ${err.message}`);
    throw err;
  }
};

export const deleteSubscription = async(where) => {
  try {
    return await db.account_subscriptions.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting subscription: ${err.message}`);
    throw err;
  }
};
