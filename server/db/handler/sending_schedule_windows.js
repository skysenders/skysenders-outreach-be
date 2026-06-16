import { db } from '../index';
import { Container } from 'typedi';

export const getWindowByWhere = async(where) => {
  try {
    return await db.sending_schedule_windows.findOne({
      where,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedule window: ${err.message}`);
    throw err;
  }
};

export const getAllWindowsByWhere = async(where) => {
  try {
    return await db.sending_schedule_windows.findAll({
      where,
      raw: true,
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC']
      ]
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedule windows: ${err.message}`);
    throw err;
  }
};

export const createWindow = async(data) => {
  try {
    return await db.sending_schedule_windows.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating schedule window: ${err.message}`);
    throw err;
  }
};

export const bulkCreateWindows = async(data, transaction) => {
  try {
    return db.sending_schedule_windows.bulkCreate(
      data,
      {
        transaction
      }
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating schedule windows: ${err.message}`);
    throw err;
  }
};

export const deleteWindows = async(where, transaction) => {
  try {
    return db.sending_schedule_windows.destroy({
      where,
      transaction
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting schedule windows: ${err.message}`);
    throw err;
  }
};
