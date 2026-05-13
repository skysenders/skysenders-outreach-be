/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';

export const getSubscriptionItemsByWhere = async(where) => {
  try {
    return await db.workspace_subscription_items.findAll({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching subscription items: ${err.message}`);
    throw err;
  }
};

export const getSubscriptionItemByWhere = async(where) => {
  try {
    return await db.workspace_subscription_items.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching subscription item: ${err.message}`);
    throw err;
  }
};

export const createSubscriptionItem = async(data) => {
  try {
    return await db.workspace_subscription_items.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating subscription item: ${err.message}`);
    throw err;
  }
};

export const bulkCreateSubscriptionItems = async(data) => {
  try {
    return await db.workspace_subscription_items.bulkCreate(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error bulk creating subscription items: ${err.message}`);
    throw err;
  }
};

export const deleteAndBulkAddSubscriptionItemDetails = async(itemsData, where) => {
  const transaction = await db.sequelize.transaction();
  try {
    await db.workspace_subscription_items.destroy({ where, transaction });
    const createdItems = await db.workspace_subscription_items.bulkCreate(itemsData, { transaction });
    await transaction.commit();
    return createdItems;
  } catch (err) {
    await transaction.rollback();
    const logger = Container.get('logger');
    logger.error(`Error in delete and bulk add subscription items: ${err.message}`);
    throw err;
  }
};

export const updateSubscriptionItem = async(data, where) => {
  try {
    const [_, updated] = await db.workspace_subscription_items.update(data, {
      where,
      returning: true,
      raw: true
    });
    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating subscription item: ${err.message}`);
    throw err;
  }
};

export const deleteSubscriptionItem = async(where) => {
  try {
    return await db.workspace_subscription_items.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting subscription item: ${err.message}`);
    throw err;
  }
};
