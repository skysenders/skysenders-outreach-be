import { db } from '../index';
import { Container } from 'typedi';
import { QueryTypes } from 'sequelize';

export const getSeqStepByWhere = async(where) => {
  try {
    return await db.seq_steps.findOne({ where, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step: ${err.message}`);
    throw err;
  }
};

export const getSeqStepWithAttribute = async(where, attributes) => {
  try {
    return await db.seq_steps.findOne({ where, attributes, raw: true });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq step: ${err.message}`);
    throw err;
  }
};

export const getAllSeqStepsByWhere = async(where, offset = 0, limit = 1000) => {
  try {
    return await db.seq_steps.findAll({ where, raw: true, offset, limit });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching seq steps: ${err.message}`);
    throw err;
  }
};

export const countSeqStepsByWhere = async(where) => {
  try {
    return await db.seq_steps.count({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error counting seq steps: ${err.message}`);
    throw err;
  }
};

export const createSeqStep = async(data) => {
  try {
    return await db.seq_steps.create(data);
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error creating seq step: ${err.message}`);
    throw err;
  }
};

export const updateSeqStep = async(data, where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_steps.update(data, {
      where,
      returning: true,
      raw: true
    });

    return updated?.[0];
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error updating seq step: ${err.message}`);
    throw err;
  }
};

export const deleteSeqStep = async(where) => {
  try {
    return await db.seq_steps.destroy({ where });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error deleting seq step: ${err.message}`);
    throw err;
  }
};

export const softDeleteSeqStep = async(where) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [_, updated] = await db.seq_steps.update(
      {
        deleted_at: new Date(),
        updated_at: new Date()
      },
      { where, returning: ['id', 'step_order'], }
    );
    return updated;
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error soft deleting seq step: ${err.message}`);
    throw err;
  }
};

export const getBasicSeqStepsWithVariantId = async(seqId) => {
  const rawQuery = `
    SELECT 
      seq_steps.id, 
      seq_steps.seq_id, 
      seq_steps.parent_branch_id,
      JSON_AGG(v.id) FILTER (WHERE v.id IS NOT NULL) AS variants
    FROM seq_steps
    LEFT JOIN seq_step_variants v ON seq_steps.id = v.step_id AND v.deleted_at IS NULL
    WHERE seq_steps.seq_id = :seq_id AND seq_steps.deleted_at IS NULL
    GROUP BY seq_steps.id, seq_steps.seq_id, seq_steps.parent_branch_id
  `;

  try {
    return await db.sequelize.query(rawQuery, {
      replacements: { seq_id: seqId },
      type: QueryTypes.SELECT,
      raw: true
    });
  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching basic seq steps: ${err.message}`);
    throw err;
  }
};

// Fetches the complete sequence step hierarchy with variants, A/B tests, and nested branches.
export const getFullSeqStepTreeBySeqId = async(seqId) => {
  const rawQuery = `
    SELECT 
      s.id,
      s.seq_id,
      s.step_order,
      s.step_type,
      s.parent_branch_id,
      s.delay_value,
      s.delay_unit,
      s.condition_type,
      s.timeout_value,
      s.timeout_unit,
      
      -- Aggregate Variants (Soft deleted checked)
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', v.id,
            'label', v.label,
            'weight', v.weight,
            'subject', v.subject,
            'message', v.message,
            'notes', v.notes
          )
        ) FILTER (WHERE v.id IS NOT NULL AND v.deleted_at IS NULL), '[]'
      ) AS variants,

      -- Aggregate A/B Test Config (No deleted_at column)
      (
        SELECT JSONB_BUILD_OBJECT(
          'is_ab_test_enabled', ab.is_ab_test_enabled,
          'test_contacts_percentage', ab.test_contacts_percentage,
          'winning_metric', ab.winning_metric,
          'fallback_variant_id', ab.fallback_variant_id
        )
        FROM seq_step_ab_tests ab
        WHERE ab.step_id = s.id
        LIMIT 1
      ) AS ab_test,

      -- Aggregate Branches (No deleted_at column)
      (
        SELECT COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'id', b.id,
              'step_id', b.step_id,
              'branch_key', b.branch_key
            )
          ), '[]'
        )
        FROM seq_step_branches b
        WHERE b.step_id = s.id
      ) AS branches

    FROM seq_steps s
    LEFT JOIN seq_step_variants v ON s.id = v.step_id AND v.deleted_at IS NULL
    WHERE s.seq_id = :seq_id AND s.deleted_at IS NULL
    GROUP BY s.id
    ORDER BY s.step_order ASC;
  `;

  try {
    const rawSteps = await db.sequelize.query(rawQuery, {
      replacements: { seq_id: seqId },
      type: QueryTypes.SELECT
    });

    if (!rawSteps || rawSteps.length === 0) {
      return [];
    }

    // Map steps by ID for quick lookup and branch step nesting
    const stepMap = new Map();
    rawSteps.forEach(step => {
      stepMap.set(step.id, {
        ...step,
        branches: (step.branches || []).map(branch => ({
          ...branch,
          steps: []
        }))
      });
    });

    const rootSteps = [];

    // Build the nested tree structure matching parent_branch_id
    rawSteps.forEach(step => {
      const currentStep = stepMap.get(step.id);

      if (step.parent_branch_id) {
        for (const parentStep of stepMap.values()) {
          const targetBranch = parentStep.branches.find(b => b.id === step.parent_branch_id);
          if (targetBranch) {
            targetBranch.steps.push(currentStep);
            break;
          }
        }
      } else {
        rootSteps.push(currentStep);
      }
    });

    return rootSteps;

  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error fetching full seq step tree for seq_id ${seqId}: ${err.message}`);
    throw err;
  }
};
