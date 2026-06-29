/* eslint-disable no-unused-vars */
import { QueryTypes } from 'sequelize';
import { db } from '../index';
import { Container } from 'typedi';

export const getPlanDetailsByWhere = async(where) => {
  try {
    return await db.account_plan_details.findOne({
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
    return await db.account_plan_details.findAll({
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
    return await db.account_plan_details.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating plan details: ${err.message}`);
    throw err;
  }
};

export const updatePlanDetails = async(data, where) => {
  try {
    const [_, updated] = await db.account_plan_details.update(data, {
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
    return await db.account_plan_details.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting plan details: ${err.message}`);
    throw err;
  }
};

export const fetchUserContactMailboxCount = async(userId) => {
  const logger = Container.get('logger');
  try {
    logger.info(`Fetching user mailboxes and contacts live count for user ID: ${userId}`);
    // NOTE: If your mailboxes and contacts tables are also moving to user-level,
    // update the columns below from user_id instead of workspace_id.

    // const query = `SELECT
    //       (SELECT COUNT(*) FROM mailboxes WHERE user_id = :userId AND is_deleted = false) AS mailboxes_count,
    //       (SELECT COUNT(*) FROM contacts WHERE user_id = :userId) AS contacts_count`;

    // return (await db.sequelize.query(query, {
    //   replacements: { userId },
    //   type: QueryTypes.SELECT,
    // }))[0] || {};

    return { mailboxes_count: 0, contacts_count: 0 };

  } catch (err) {
    logger.error(`Error while fetching user mailboxes and contacts live count ${err.message}`);
    throw err;
  }
};
