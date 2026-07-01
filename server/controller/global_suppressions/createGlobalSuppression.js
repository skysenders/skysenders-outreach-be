import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
CREATE GLOBAL SUPPRESSION
*/
export const createGlobalSuppression = async(req, res) => {
  const logger = Container.get('logger');
  const GlobalSuppressionsModelHandler = Container.get('GlobalSuppressionsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;
  const createdBy = req.user?.id;

  try {
    const {
      value,
      suppression_type: suppressionType,
      reason,
    } = req.body;

    const normalizedValue = value?.trim()?.toLowerCase();

    if (!normalizedValue) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Value is required'
      });
    }

    // Idempotency check (avoid duplicates)
    const existing = await GlobalSuppressionsModelHandler.getGlobalSuppressionByWhere({
      workspace_id: workspaceId,
      value: normalizedValue,
      suppression_type: suppressionType
    });

    if (existing) {
      return res.status(StatusCodes.OK).send(existing);
    }

    const suppression = await GlobalSuppressionsModelHandler.createGlobalSuppression({
      partner_id: partnerId,
      workspace_id: workspaceId,
      value: normalizedValue,
      suppression_type: suppressionType,
      reason: reason || null,
      created_by: createdBy || null
    });

    return res.status(StatusCodes.CREATED).send(suppression);

  } catch (error) {
    logger.error(`Error creating global suppression: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
