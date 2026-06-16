import { db } from '../index';
import { Container } from 'typedi';
import { QueryTypes } from 'sequelize';

export const getScheduleByWhere = async(where, options = {}) => {
  try {
    return await db.sending_schedules.findOne({
      where,
      raw: true,
      ...options
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedule: ${err.message}`);
    throw err;
  }
};

export const getAllSchedulesByWhere = async(where, offset = 0, limit = 1000, options = {}) => {
  try {
    return await db.sending_schedules.findAll({
      where,
      offset,
      limit,
      raw: true,
      ...options
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedules: ${err.message}`);
    throw err;
  }
};

export const countSchedulesByWhere = async(where) => {
  try {
    return await db.sending_schedules.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting schedules: ${err.message}`);
    throw err;
  }
};

export const createSchedule = async(data) => {
  try {
    return await db.sending_schedules.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating schedule: ${err.message}`);
    throw err;
  }
};

export const updateSchedule = async(data, where, transaction) => {
  try {
    const [, updated] = await db.sending_schedules.update(
      data,
      {
        where,
        transaction,
        returning: true
      }
    );

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating schedule: ${err.message}`);
    throw err;
  }
};

export const deleteSchedule = async(where) => {
  try {
    return await db.sending_schedules.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting schedule: ${err.message}`);
    throw err;
  }
};

export const softDeleteSchedule = async(where) => {
  try {
    const [, updated] = await db.sending_schedules.update(
      {
        deleted_at: new Date(),
        updated_at: new Date()
      },
      {
        where,
        returning: true
      }
    );

    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting schedule: ${err.message}`);
    throw err;
  }
};

export const getScheduleWithWindowsById = async(where) => {
  try {
    const result = await db.sequelize.query(
      `
      SELECT
        s.id,
        s.partner_id,
        s.workspace_id,
        s.name,
        s.timezone,
        s.use_contact_timezone,
        s.skip_holidays,
        s.holiday_country_code,
        s.is_active,
        s.created_by,
        s.created_at,
        s.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', sw.id,
                'schedule_id', sw.schedule_id,
                'day_of_week', sw.day_of_week,
                'start_time', sw.start_time,
                'end_time', sw.end_time,
                'created_at', sw.created_at
              )
              ORDER BY sw.day_of_week, sw.start_time
            )
            FROM sending_schedule_windows sw
            WHERE sw.schedule_id = s.id
          ),
          '[]'::json
        ) AS windows
      FROM sending_schedules s
      WHERE s.id = :id
        AND s.workspace_id = :workspace_id
        AND s.deleted_at IS NULL
      LIMIT 1
      `,
      {
        replacements: {
          id: where.id,
          workspace_id: where.workspace_id
        },
        type: QueryTypes.SELECT
      }
    );

    return result?.[0] || null;

  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedule by id: ${err.message}`);
    throw err;
  }
};

export const getAllSchedules = async({
  workspace_id: workspaceId,
  search_text: searchText,
  is_active: isActive,
  offset = 0,
  limit = 20
}) => {
  try {
    const where = [
      's.workspace_id = :workspace_id',
      's.deleted_at IS NULL'
    ];

    const replacements = {
      workspace_id: workspaceId,
      offset,
      limit
    };

    if (searchText) {
      where.push('s.name ILIKE :search_text');
      replacements.search_text = `%${searchText}%`;
    }

    if (typeof isActive === 'boolean') {
      where.push('s.is_active = :is_active');
      replacements.is_active = isActive;
    }

    return await db.sequelize.query(
      `
      SELECT
        s.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', sw.id,
                'schedule_id', sw.schedule_id,
                'day_of_week', sw.day_of_week,
                'start_time', sw.start_time,
                'end_time', sw.end_time,
                'created_at', sw.created_at
              )
              ORDER BY sw.day_of_week, sw.start_time
            )
            FROM sending_schedule_windows sw
            WHERE sw.schedule_id = s.id
          ),
          '[]'::json
        ) AS windows
      FROM sending_schedules s
      WHERE ${where.join(' AND ')}
      ORDER BY s.created_at DESC
      OFFSET :offset
      LIMIT :limit
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
        raw: true
      }
    );
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching schedules: ${err.message}`);
    throw err;
  }
};

export const countSchedules = async({
  workspace_id: workspaceId,
  search_text: searchText,
  is_active: isActive
}) => {
  try {
    const where = [
      'workspace_id = :workspace_id',
      'deleted_at IS NULL'
    ];

    const replacements = {
      workspace_id: workspaceId
    };

    if (searchText) {
      where.push('name ILIKE :search_text');
      replacements.search_text = `%${searchText}%`;
    }

    if (typeof isActive === 'boolean') {
      where.push('is_active = :is_active');
      replacements.is_active = isActive;
    }

    const result = await db.sequelize.query(
      `
      SELECT COUNT(*)::INTEGER AS count
      FROM sending_schedules
      WHERE ${where.join(' AND ')}
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
        raw: true
      }
    );

    return result[0].count;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting schedules: ${err.message}`);
    throw err;
  }
};
