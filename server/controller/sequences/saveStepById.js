import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { SEQUENCE_STEP_DELAY_UNITS } from '../../config/constants';

/*
SAVE STEP BY ID WITH VARIANTS & A/B TEST CONFIG
*/
export const saveStepById = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqStepsModelHandler = Container.get('SeqStepsModelHandler');
  const SeqStepVariantsModelHandler = Container.get('SeqStepVariantsModelHandler');
  const SeqStepAbTestsModelHandler = Container.get('SeqStepAbTestsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);
  const stepId = parseInt(req.params.stepId, 10);

  // Destructuring snake_case payload directly into camelCase variables for ESLint
  const {
    step_type: stepType,
    delay_value: delayValue,
    delay_unit: delayUnit,
    condition_type: conditionType,
    timeout_value: timeoutValue,
    timeout_unit: timeoutUnit,
    archived_variants_id: archivedVariantsId = [],
    variants = [],
    ab_test: abTest
  } = req.body;

  try {
    // 1. Verify sequence scope identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Verify target step exists inside sequence scope boundary
    const step = await SeqStepsModelHandler.getSeqStepByWhere({ id: stepId, seq_id: seqId });
    if (!step) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence step not found' });
    }

    // 3. Cross-check existing variants vs incoming payload variants
    const existingVariants = await SeqStepVariantsModelHandler.getAllSeqStepVariants({
      step_id: stepId
    });

    const existingVariantIds = (existingVariants || []).map(v => v.id);
    const incomingVariantIds = variants.filter(v => v.id).map(v => v.id);

    // Calculate which existing variants are missing from the payload
    const variantsToRemove = existingVariantIds.filter(id => !incomingVariantIds.includes(id));

    // Halt if missing variants were not explicitly provided in archived_variants_id
    if (variantsToRemove.length > 0) {
      const unarchivedMissingIds = variantsToRemove.filter(id => !archivedVariantsId.includes(id));
      if (unarchivedMissingIds.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).send({
          message: `Cannot remove variants. Please provide all deleted variants in the 'archived_variants_id' array. Missing variant IDs are: ${unarchivedMissingIds.join(', ')}`
        });
      }
    }

    // 4. Update core step structural timing & type properties
    const stepPayload = {
      ...(stepType && { step_type: stepType }),
      delay_value: delayValue ?? step.delay_value ?? 0,
      delay_unit: delayUnit || step.delay_unit || SEQUENCE_STEP_DELAY_UNITS.DAYS,
      condition_type: conditionType || step.condition_type || null,
      timeout_value: timeoutValue || step.timeout_value || null,
      timeout_unit: timeoutUnit || step.timeout_unit || null,
      updated_at: new Date()
    };

    await SeqStepsModelHandler.updateSeqStep(stepPayload, { id: stepId, seq_id: seqId });

    // 5. Soft delete archived variant references if provided
    if (archivedVariantsId.length > 0) {
      await SeqStepVariantsModelHandler.softDeleteSeqStepVariant({
        id: archivedVariantsId,
        step_id: stepId
      });
    }

    // 6. Process variants with dynamic A-Z labeling
    if (variants.length > 0) {
      let variantLabelIndex = 0;
      for (const variant of variants) {
        const variantPayload = {
          step_id: stepId,
          label: variant.label || String.fromCharCode(65 + variantLabelIndex++), // A, B, C...
          weight: variant.weight ?? 100,
          subject: variant.subject || null,
          message: variant.message || null,
          notes: variant.notes || null,
          updated_at: new Date()
        };

        if (variant.id) {
          await SeqStepVariantsModelHandler.updateSeqStepVariant(variantPayload, { id: variant.id, step_id: stepId });
        } else {
          variantPayload.created_at = new Date();
          await SeqStepVariantsModelHandler.createSeqStepVariant(variantPayload);
        }
      }
    }

    // 7. Process Step A/B Testing Configs
    if (abTest) {
      const abTestPayload = {
        is_ab_test_enabled: abTest.is_ab_test_enabled ?? false,
        test_contacts_percentage: abTest.test_contacts_percentage ?? 100,
        winning_metric: abTest.winning_metric || null,
        fallback_variant_id: abTest.fallback_variant_id || null,
        updated_at: new Date()
      };

      const existingAbConfig = await SeqStepAbTestsModelHandler.getSeqStepAbTestByWhere({ step_id: stepId });
      if (existingAbConfig) {
        await SeqStepAbTestsModelHandler.updateSeqStepAbTest(abTestPayload, { step_id: stepId });
      } else {
        Object.assign(abTestPayload, { step_id: stepId, created_at: new Date() });
        await SeqStepAbTestsModelHandler.createSeqStepAbTest(abTestPayload);
      }
    }

    return res.status(StatusCodes.OK).send({
      success: true,
      message: 'Step configurations, variants, and A/B test settings synchronized successfully'
    });

  } catch (error) {
    logger.error(`Error saving workflow step details for step_id ${stepId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
