import { db } from '../index';
import { Container } from 'typedi';

export const getListByWhere = async(where) => {
  try {
    return await db.lists.findOne({
      where,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching list: ${err.message}`);
    throw err;
  }
};

export const getAllListsByWhere = async(
  where,
  offset = 0,
  limit = 100
) => {
  try {
    return await db.lists.findAll({
      where,
      offset,
      limit,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching lists: ${err.message}`);
    throw err;
  }
};

export const getActiveLists = async(workspaceId, offset = 0, limit = 50) => {
  try {
    return await db.lists.findAll({
      where: {
        workspace_id: workspaceId,
        deleted_at: null
      },
      offset,
      limit,
      order: [['created_at', 'DESC']],
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching active lists: ${err.message}`);
    throw err;
  }
};

export const countListsByWhere = async(where) => {
  try {
    return await db.lists.count({ where });
  } catch (err) {
    Container.get('logger').error(`Error counting lists: ${err.message}`);
    throw err;
  }
};

export const createList = async(data) => {
  try {
    return await db.lists.create(data);
  } catch (err) {
    Container.get('logger').error(`Error creating list: ${err.message}`);
    throw err;
  }
};

export const updateList = async(data, where) => {
  try {
    const [, updated] = await db.lists.update(
      {
        ...data,
        updated_at: new Date()
      },
      {
        where,
        returning: true,
        raw: true
      }
    );

    return updated?.[0];
  } catch (err) {
    Container.get('logger').error(`Error updating list: ${err.message}`);
    throw err;
  }
};

export const softDeleteList = async(where) => {
  try {
    const [, updated] = await db.lists.update(
      {
        deleted_at: new Date()
      },
      {
        where,
        returning: true,
        raw: true
      }
    );

    return updated;
  } catch (err) {
    Container.get('logger').error(`Error deleting list: ${err.message}`);
    throw err;
  }
};
