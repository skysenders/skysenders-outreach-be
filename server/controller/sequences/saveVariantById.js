import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
SAVE VARIANT BY ID
*/
export const saveVariantById = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqStepsModelHandler = Container.get('SeqStepsModelHandler');
  const SeqStepVariantsModelHandler = Container.get('SeqStepVariantsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);
  const stepId = parseInt(req.params.stepId, 10);
  const variantId = parseInt(req.params.variantId, 10);

  const {
    weight,
    subject,
    message,
    notes
  } = req.body;

  try {
    // 1. Verify sequence scope context identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Verify target step exists inside this sequence boundary
    const step = await SeqStepsModelHandler.getSeqStepByWhere({ id: stepId, seq_id: seqId });
    if (!step) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence step not found' });
    }

    // 3. Verify variant exists inside this specific step structure
    const variant = await SeqStepVariantsModelHandler.getSeqStepVariantByWhere({ id: variantId, step_id: stepId });
    if (!variant) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Step variant not found' });
    }

    // 4. Update the variant fields safely
    const variantPayload = {
      weight: weight ?? 100,
      subject: subject || null,
      message: message || null,
      notes: notes || null,
      updated_at: new Date()
    };

    await SeqStepVariantsModelHandler.updateSeqStepVariant(variantPayload, { id: variantId, step_id: stepId });

    return res.status(StatusCodes.OK).send({
      success: true,
      message: 'Step variant template configurations saved successfully'
    });

  } catch (error) {
    logger.error(`Error saving variant details for variant_id ${variantId}: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
