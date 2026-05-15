import { db } from '../index';
import { Container } from 'typedi';

export const getWarmupProfileByWhere = async(where) => {
  try {
    return await db.warmup_profile_details.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup profile: ${err.message}`);
    throw err;
  }
};

export const getAllWarmupProfilesByWhere = async(where) => {
  try {
    return await db.warmup_profile_details.findAll({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching warmup profiles: ${err.message}`);
    throw err;
  }
};

export const createWarmupProfile = async(data) => {
  try {
    return await db.warmup_profile_details.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating warmup profile: ${err.message}`);
    throw err;
  }
};

export const updateWarmupProfile = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.warmup_profile_details.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating warmup profile: ${err.message}`);
    throw err;
  }
};

export const deleteWarmupProfile = async(where) => {
  try {
    return await db.warmup_profile_details.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting warmup profile: ${err.message}`);
    throw err;
  }
};
