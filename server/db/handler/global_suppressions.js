import { Op } from 'sequelize';
import { db } from '../index';
import { Container } from 'typedi';

export const createGlobalSuppression = async(data) => {
  try {
    return await db.global_suppressions.create({
      ...data,
      email: data.email?.trim()?.toLowerCase()
    });
  } catch (err) {
    Container.get('logger').error(
      `Error creating global suppression: ${err.message}`
    );
    throw err;
  }
};

export const getGlobalSuppressionByWhere = async(where) => {
  try {
    return await db.global_suppressions.findOne({
      where,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(
      `Error fetching suppression: ${err.message}`
    );
    throw err;
  }
};

export const getAllGlobalSuppressions = async(where) => {
  try {
    return await db.global_suppressions.findAll({
      where,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(
      `Error fetching all suppression: ${err.message}`
    );
    throw err;
  }
};

export const getAllGlobalSuppressionsByWhere = async(
  where,
  offset = 0,
  limit = 50,
  search = '',
  suppressionType = null
) => {
  try {
    const finalWhere = { ...where };

    if (suppressionType) {
      finalWhere.suppression_type = suppressionType;
    }

    if (search) {
      finalWhere.email = {
        [Op.iRegexp]: search
      };
    }

    return await db.global_suppressions.findAll({
      where: finalWhere,
      offset,
      limit,
      order: [['created_at', 'DESC']],
      raw: true
    });

  } catch (err) {
    Container.get('logger').error(
      `Error fetching suppressions: ${err.message}`
    );
    throw err;
  }
};

export const countGlobalSuppressionsByWhere = async(
  where,
  search = '',
  suppressionType = null
) => {
  try {
    const finalWhere = { ...where };

    if (suppressionType) {
      finalWhere.suppression_type = suppressionType;
    }

    if (search) {
      finalWhere.email = {
        [Op.iRegexp]: search
      };
    }

    return await db.global_suppressions.count({
      where: finalWhere
    });

  } catch (err) {
    Container.get('logger').error(
      `Error counting suppressions: ${err.message}`
    );
    throw err;
  }
};

export const isEmailSuppressed = async(workspaceId, email) => {
  try {
    const normalized = email?.trim()?.toLowerCase();
    const domain = normalized?.split('@')[1];

    // email-level check
    const emailBlocked = await db.global_suppressions.findOne({
      where: {
        workspace_id: workspaceId,
        email: normalized
      },
      attributes: ['id'],
      raw: true
    });

    if (emailBlocked) return true;

    // domain-level block (manual/spam)
    const domainBlocked = await db.global_suppressions.findOne({
      where: {
        workspace_id: workspaceId,
        email: {
          [Op.iLike]: `%@${domain}`
        },
        suppression_type: {
          [Op.in]: ['MANUAL_BLOCK', 'SPAM_COMPLAINT']
        }
      },
      attributes: ['id'],
      raw: true
    });

    return !!domainBlocked;

  } catch (err) {
    Container.get('logger').error(
      `Error checking suppression: ${err.message}`
    );
    throw err;
  }
};

export const deleteGlobalSuppression = async(where) => {
  try {
    return await db.global_suppressions.destroy({ where });
  } catch (err) {
    Container.get('logger').error(
      `Error deleting suppression: ${err.message}`
    );
    throw err;
  }
};

export const bulkCreateGlobalSuppressions = async(records) => {
  try {
    return await db.global_suppressions.bulkCreate(records, {
      ignoreDuplicates: true
    });
  } catch (err) {
    Container.get('logger').error(
      `Error bulk creating suppressions: ${err.message}`
    );
    throw err;
  }
};
