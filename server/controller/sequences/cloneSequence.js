import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { SEQUENCE_STATUS } from '../../config/constants';

/*
CLONE SEQUENCE
*/
export const cloneSequence = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqSettingsModelHandler = Container.get('SeqSettingsModelHandler');
  const SeqStepsModelHandler = Container.get('SeqStepsModelHandler');
  const SeqStepVariantsModelHandler = Container.get('SeqStepVariantsModelHandler');
  const SeqStepBranchesModelHandler = Container.get('SeqStepBranchesModelHandler');
  const SeqStepAbTestsModelHandler = Container.get('SeqStepAbTestsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  try {
    // 1. Verify source sequence exists
    const sourceSequence = await SequencesModelHandler.getSequenceByWhere({
      id: seqId,
      workspace_id: workspaceId
    });

    if (!sourceSequence) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sequence to clone not found'
      });
    }

    // 2. Create target sequence copy resetting performance metrics
    const clonePayload = {
      partner_id: sourceSequence.partner_id,
      workspace_id: sourceSequence.workspace_id,
      name: `${sourceSequence.name} - Copy`,
      status: SEQUENCE_STATUS.DRAFTED,
      total_no_of_seq: sourceSequence.total_no_of_seq || 0,
      total_no_contacts: 0,
      current_seq_no: 0,
      total_no_days: sourceSequence.total_no_days || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const newSequence = await SequencesModelHandler.createSequence(clonePayload);
    const newSeqId = newSequence.id;

    // 3. Clone Sequence Settings (seq_settings)
    const sourceSettings = await SeqSettingsModelHandler.getSeqSettingByWhere({ seq_id: seqId });
    if (sourceSettings) {
      // eslint-disable-next-line no-unused-vars
      const { id: _settingId, seq_id: _oldSeqId, created_at: _cAt, updated_at: _uAt, ...settingsToCopy } = sourceSettings;
      await SeqSettingsModelHandler.createSeqSetting({
        ...settingsToCopy,
        seq_id: newSeqId,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // 4. Fetch the full recursive sequence step tree
    const rootSteps = await SeqStepsModelHandler.getFullSeqStepTreeBySeqId(seqId);

    if (rootSteps && rootSteps.length > 0) {
      // Recursive helper to clone steps, variants, A/B tests, and downstream branches.
      const cloneStepsRecursively = async(stepsToClone, parentBranchId = null) => {
        for (const step of stepsToClone) {
          // Clone Step Record
          const stepPayload = {
            seq_id: newSeqId,
            step_order: step.step_order,
            step_type: step.step_type,
            parent_branch_id: parentBranchId,
            delay_value: step.delay_value ?? 0,
            delay_unit: step.delay_unit || 'DAYS',
            condition_type: step.condition_type || null,
            timeout_value: step.timeout_value || null,
            timeout_unit: step.timeout_unit || null,
            created_at: new Date(),
            updated_at: new Date()
          };

          const newStep = await SeqStepsModelHandler.createSeqStep(stepPayload);
          const newStepId = newStep.id;

          const variantIdMap = new Map(); // Maps old variant ID -> new variant ID

          // Clone Step Variants
          if (step.variants && step.variants.length > 0) {
            for (const variant of step.variants) {
              const variantPayload = {
                step_id: newStepId,
                label: variant.label,
                weight: variant.weight ?? 100,
                subject: variant.subject || null,
                message: variant.message || null,
                notes: variant.notes || null,
                created_at: new Date(),
                updated_at: new Date()
              };

              const newVariant = await SeqStepVariantsModelHandler.createSeqStepVariant(variantPayload);
              variantIdMap.set(variant.id, newVariant.id);
            }
          }

          // Clone Step A/B Testing Config
          if (step.ab_test) {
            const mappedFallbackVariantId = step.ab_test.fallback_variant_id
              ? variantIdMap.get(step.ab_test.fallback_variant_id) || null
              : null;

            const abTestPayload = {
              step_id: newStepId,
              is_ab_test_enabled: step.ab_test.is_ab_test_enabled ?? false,
              test_contacts_percentage: step.ab_test.test_contacts_percentage ?? 100,
              winning_metric: step.ab_test.winning_metric || null,
              fallback_variant_id: mappedFallbackVariantId,
              created_at: new Date(),
              updated_at: new Date()
            };

            await SeqStepAbTestsModelHandler.createSeqStepAbTest(abTestPayload);
          }

          // Clone Downstream Branches & Steps
          if (step.step_type === 'CONDITION' && step.branches && step.branches.length > 0) {
            for (const branch of step.branches) {
              const newBranch = await SeqStepBranchesModelHandler.createSeqStepBranch({
                step_id: newStepId,
                branch_key: branch.branch_key,
                created_at: new Date()
              });

              if (branch.steps && branch.steps.length > 0) {
                await cloneStepsRecursively(branch.steps, newBranch.id);
              }
            }
          }
        }
      };

      // Initiate recursive cloning from root steps
      await cloneStepsRecursively(rootSteps, null);
    }

    return res.status(StatusCodes.CREATED).send(newSequence);

  } catch (error) {
    logger.error(`Error cloning sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
