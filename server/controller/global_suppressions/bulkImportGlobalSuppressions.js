import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import Container from 'typedi';

/*
BULK IMPORT GLOBAL SUPPRESSIONS
*/
export const bulkImportGlobalSuppressions = async(req, res) => {
  const logger = Container.get('logger');
  const GlobalSuppressionsModelHandler = Container.get('GlobalSuppressionsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user?.tenant_id;
  const createdBy = req.user?.id;

  try {
    let {
      values = [],
      suppression_type: suppressionType,
      reason
    } = req.body;

    // 1. Normalize + dedupe in-memory
    const normalizedValues = [
      ...new Set(values.map(v => v?.trim()?.toLowerCase()).filter(Boolean))
    ];

    // 2. Fetch existing suppressions in ONE query
    const existing = await GlobalSuppressionsModelHandler.getAllGlobalSuppressions({
      workspace_id: workspaceId,
      suppression_type: suppressionType,
      value: {
        [Op.in]: normalizedValues
      }
    });

    const existingSet = new Set(existing.map(e => e.value));

    // 3. Filter only new values
    const newRecords = normalizedValues
      .filter(value => !existingSet.has(value))
      .map(value => ({
        partner_id: partnerId,
        workspace_id: workspaceId,
        value,
        suppression_type: suppressionType,
        reason: reason || null,
        created_by: createdBy || null
      }));

    // 4. Bulk insert
    let insertedCount = 0;

    if (newRecords.length > 0) {
      const result = await GlobalSuppressionsModelHandler.bulkCreateGlobalSuppressions(newRecords);
      insertedCount = result.length || 0;
    }

    return res.status(StatusCodes.OK).send({
      inserted: insertedCount,
      skipped: normalizedValues.length - insertedCount,
      total: normalizedValues.length
    });

  } catch (error) {
    logger.error(`Error bulk importing suppressions: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
