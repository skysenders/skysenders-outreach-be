import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { SEQUENCE_STEP_DELAY_UNITS } from '../../config/constants';

/*
SAVE SEQUENCE STEPS
*/
export const saveSequenceSteps = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqStepsModelHandler = Container.get('SeqStepsModelHandler');
  const SeqStepBranchesModelHandler = Container.get('SeqStepBranchesModelHandler');
  const SeqStepVariantsModelHandler = Container.get('SeqStepVariantsModelHandler');
  const SeqStepAbTestsModelHandler = Container.get('SeqStepAbTestsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);
  const { archived_steps_id: archivedStepsId = [], steps = [] } = req.body;

  let sequenceStepCounter = 0;

  try {
    // Validate sequence ownership
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // Fetch all the current steps associated with the sequence to identify removals
    const existingSteps = await SeqStepsModelHandler.getBasicSeqStepsWithVariantId(seqId);

    const existingStepIds = existingSteps.map(step => step.id);

    const existingVariantIds = existingSteps.reduce((acc, step) => {
      if (step.variants && step.variants.length > 0) {
        const variantIds = step.variants.map(variant => variant.id);
        acc.push(...variantIds);
      }
      return acc;
    }, []);

    const incomingStepIds = [];
    const incomingVariantIds = [];

    // Recursively extract all incoming IDs down to any nesting depth
    const extractIncomingIdsRecursively = (stepsList) => {
      for (const step of stepsList) {
        if (step.id) incomingStepIds.push(step.id);

        if (step.variants && step.variants.length > 0) {
          for (const variant of step.variants) {
            if (variant.id) incomingVariantIds.push(variant.id);
          }
        }

        if (step.branches && step.branches.length > 0) {
          for (const branch of step.branches) {
            if (branch.steps && branch.steps.length > 0) {
              extractIncomingIdsRecursively(branch.steps);
            }
          }
        }
      }
    };

    // Run the extraction across the payload tree
    extractIncomingIdsRecursively(req.body.steps);

    // Calculate missing references
    const stepsToRemove = existingStepIds.filter(id => !incomingStepIds.includes(id));

    if (stepsToRemove.length > 0 && archivedStepsId.some(id => !stepsToRemove.includes(id))) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Cannot remove steps. Please provide all deleted steps in the request body. Missing steps are: ${stepsToRemove.join(', ')}`
      });
    }

    const variantsToRemove = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
    if (variantsToRemove.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Cannot remove variants. Please provide all deleted variants in the request body. Missing variants are: ${variantsToRemove.join(', ')}`
      });
    }

    // Soft delete parent-level archived steps if provided safely
    if (archivedStepsId.length > 0) {
      await SeqStepsModelHandler.softDeleteSeqStep({ id: archivedStepsId, seq_id: seqId });
    }

    // Recursive Orchestration Tree Processor
    const processStepsRecursively = async(stepsList, parentBranchId = null) => {
      for (let i = 0; i < stepsList.length; i++) {
        const stepData = stepsList[i];
        sequenceStepCounter++;
        const assignedOrder = sequenceStepCounter;

        const stepPayload = {
          seq_id: seqId,
          step_order: assignedOrder,
          step_type: stepData.step_type,
          parent_branch_id: parentBranchId,
          delay_value: stepData.delay_value ?? 0,
          delay_unit: stepData.delay_unit || SEQUENCE_STEP_DELAY_UNITS.DAYS,
          condition_type: stepData.condition_type || null,
          timeout_value: stepData.timeout_value || null,
          timeout_unit: stepData.timeout_unit || null,
          updated_at: new Date()
        };

        let executedStepId;

        if (stepData.id) {
          await SeqStepsModelHandler.updateSeqStep(stepPayload, { id: stepData.id, seq_id: seqId });
          executedStepId = stepData.id;
        } else {
          stepPayload.created_at = new Date();
          const newStep = await SeqStepsModelHandler.createSeqStep(stepPayload);
          executedStepId = newStep.id;
        }

        // --- Process Step Variants ---
        if (stepData.archived_variants_id && stepData.archived_variants_id.length > 0) {
          await SeqStepVariantsModelHandler.softDeleteSeqStepVariant({ id: stepData.archived_variants_id, step_id: executedStepId });
        }

        if (stepData.variants && stepData.variants.length > 0) {
          let varaintLabelIndex = 0;
          for (const variant of stepData.variants) {
            const variantPayload = {
              step_id: executedStepId,
              label: String.fromCharCode(65 + varaintLabelIndex++), // A, B, C, ...
              weight: variant.weight ?? 100,
              subject: variant.subject || null,
              message: variant.message || null,
              notes: variant.notes || null,
              updated_at: new Date()
            };

            if (variant.id) {
              await SeqStepVariantsModelHandler.updateSeqStepVariant(variantPayload, { id: variant.id, step_id: executedStepId });
            } else {
              Object.assign(variantPayload, { created_at: new Date() });
              await SeqStepVariantsModelHandler.createSeqStepVariant(variantPayload);
            }
          }
        }

        // --- Process Step A/B Testing Configs ---
        if (stepData.ab_test) {
          const abTestPayload = {
            is_ab_test_enabled: stepData.ab_test.is_ab_test_enabled ?? false,
            test_contacts_percentage: stepData.ab_test.test_contacts_percentage ?? 100,
            winning_metric: stepData.ab_test.winning_metric || null,
            fallback_variant_id: stepData.ab_test.fallback_variant_id || null,
            updated_at: new Date()
          };

          const existingAbConfig = await SeqStepAbTestsModelHandler.getSeqStepAbTestByWhere({ step_id: executedStepId });
          if (existingAbConfig) {
            await SeqStepAbTestsModelHandler.updateSeqStepAbTest(abTestPayload, { step_id: executedStepId });
          } else {
            Object.assign(abTestPayload, { step_id: executedStepId, created_at: new Date() });
            await SeqStepAbTestsModelHandler.createSeqStepAbTest(abTestPayload);
          }
        }

        // --- Process Downstream Branches Recursively ---
        if (stepData.step_type === 'CONDITION' && stepData.branches && stepData.branches.length > 0) {
          for (const branch of stepData.branches) {
            let activeBranchRecord = await SeqStepBranchesModelHandler.getSeqStepBranchByWhere({
              step_id: executedStepId,
              branch_key: branch.branch_key
            });

            if (!activeBranchRecord) {
              activeBranchRecord = await SeqStepBranchesModelHandler.createSeqStepBranch({
                step_id: executedStepId,
                branch_key: branch.branch_key,
                created_at: new Date()
              });
            }

            if (branch.steps && branch.steps.length > 0) {
              await processStepsRecursively(branch.steps, activeBranchRecord.id);
            }
          }
        }
      }
    };

    // Initialize root processing chain execution
    await processStepsRecursively(steps, null);

    // Record global footprint parameters to main orchestration settings tracker
    await SequencesModelHandler.updateSequence(
      {
        total_no_of_seq: sequenceStepCounter,
        updated_at: new Date()
      },
      { id: seqId }
    );

    return res.status(StatusCodes.OK).send({
      success: true,
      message: 'Recursive campaign steps layout mapping synchronized successfully'
    });

  } catch (error) {
    logger.error(`Error saving recursive pipeline configuration tree details for seq_id ${seqId}: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
