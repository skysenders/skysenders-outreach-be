/* eslint-disable no-unused-vars */
import { db } from '../index';
import { Container } from 'typedi';
import { USER_ROLE } from '../../config/constants';
import { QueryTypes } from 'sequelize';

export const getAccountsByWhere = async(where) => {
  try {
    return await db.accounts.findAll({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching accounts: ${err.message}`);
    throw err;
  }
};

export const getAccountByWhere = async(where) => {
  try {
    return await db.accounts.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching account: ${err.message}`);
    throw err;
  }
};

export const getAccountById = async(id) => {
  try {
    return await db.accounts.findOne({
      where: { id },
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching account by id: ${err.message}`);
    throw err;
  }
};

export const createAccount = async(data) => {
  try {
    return await db.accounts.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating account: ${err.message}`);
    throw err;
  }
};

export const updateAccount = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.accounts.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating account: ${err.message}`);
    throw err;
  }
};

export const deleteAccountById = async(id) => {
  try {
    return await db.accounts.destroy({
      where: { id }
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting account: ${err.message}`);
    throw err;
  }
};

export const findAccountWithPlanDetailsByAPIKey = async(apiKey) => {
  try {
    const accountData = await db.sequelize.query(`
      SELECT
        a.id,
        a.uuid,
        a.name,
        a.email,
        a.api_key,
        a.custom_api_rate_limit,
        a.partner_id as tenant_id,
        jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'tenant_id', u.partner_id,
          'account_id', a.id
        ) AS user,
        jsonb_build_object(
          'id', pd.id,
          'plan_name', pd.plan_name,
          'has_api_access', pd.has_api_access,
          'trial_start_date', pd.trial_start_date,
          'trial_end_date', pd.trial_end_date,
          'plan_end_date', pd.plan_end_date
        ) AS plan_details

      FROM accounts a
      LEFT JOIN account_plan_details pd
        ON pd.account_id = a.id
      LEFT JOIN users u
        ON u.account_id = a.id and u.role = '${USER_ROLE.SUPER_ADMIN}'
      WHERE a.api_key = '${apiKey}';`,
    { type: QueryTypes.SELECT });

    return accountData[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error while finding account plan data by api key ${err.message}`);
    throw err;
  }
};
