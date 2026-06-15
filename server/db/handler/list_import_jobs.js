import { db } from '../index';
import { Container } from 'typedi';
import { QueryTypes } from 'sequelize';

export const getListImportJobByWhere = async(where) => {
  try {
    return await db.list_import_jobs.findOne({
      where,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching import job: ${err.message}`);
    throw err;
  }
};

export const getAllListImportJobsByWhere = async(
  where,
  offset = 0,
  limit = 50
) => {
  try {
    return await db.list_import_jobs.findAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching import jobs: ${err.message}`);
    throw err;
  }
};

export const countListImportJobsByWhere = async(where) => {
  try {
    return await db.list_import_jobs.count({ where });
  } catch (err) {
    Container.get('logger').error(`Error counting import jobs: ${err.message}`);
    throw err;
  }
};

export const createListImportJob = async(data) => {
  try {
    return await db.list_import_jobs.create({
      ...data,
      status: data.status || 'PENDING',
      created_at: new Date()
    });
  } catch (err) {
    Container.get('logger').error(`Error creating import job: ${err.message}`);
    throw err;
  }
};

export const updateListImportJob = async(data, where) => {
  try {
    const [, updated] = await db.list_import_jobs.update(
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
    Container.get('logger').error(`Error updating import job: ${err.message}`);
    throw err;
  }
};

export const markImportJobStarted = async(jobId) => {
  try {
    return await updateListImportJob(
      {
        status: 'PROCESSING',
        started_at: new Date()
      },
      { id: jobId }
    );
  } catch (err) {
    Container.get('logger').error(`Error marking job started: ${err.message}`);
    throw err;
  }
};

export const markImportJobCompleted = async(
  jobId,
  summary = {}
) => {
  try {
    return await updateListImportJob(
      {
        status: 'COMPLETED',
        completed_at: new Date(),

        total_rows: summary.total_rows || 0,
        valid_count: summary.valid_count || 0,
        duplicate_count: summary.duplicate_count || 0,
        already_existing_count: summary.already_existing_count || 0,
        unsubscribed_count: summary.unsubscribed_count || 0,
        bounced_count: summary.bounced_count || 0,
        blocked_count: summary.blocked_count || 0,
        invalid_count: summary.invalid_count || 0
      },
      { id: jobId }
    );
  } catch (err) {
    Container.get('logger').error(`Error completing job: ${err.message}`);
    throw err;
  }
};

export const markImportJobFailed = async(jobId, errorMessage) => {
  try {
    return await updateListImportJob(
      {
        status: 'FAILED',
        completed_at: new Date(),
        error_message: errorMessage
      },
      { id: jobId }
    );
  } catch (err) {
    Container.get('logger').error(`Error failing job: ${err.message}`);
    throw err;
  }
};

export const incrementImportJobCounters = async(
  jobId,
  counters = {}
) => {
  try {
    const fields = Object.keys(counters);

    if (!fields.length) return;

    const increments = fields.map(field => {
      return `${field} = COALESCE(${field}, 0) + ${counters[field]}`;
    }).join(', ');

    await db.sequelize.query(
      `
        UPDATE list_import_jobs
        SET ${increments}
        WHERE id = :jobId
      `,
      {
        replacements: { jobId },
        type: QueryTypes.UPDATE
      }
    );

    return true;
  } catch (err) {
    Container.get('logger').error(`Error incrementing counters: ${err.message}`);
    throw err;
  }
};
