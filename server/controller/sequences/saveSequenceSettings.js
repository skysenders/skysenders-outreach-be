/* eslint-disable no-undefined */
import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
SAVE SEQUENCE SETTINGS
*/
export const saveSequenceSettings = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqSettingsModelHandler = Container.get('SeqSettingsModelHandler');
  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  // Destructure snake_case payload into camelCase variables for ESLint
  const {
    new_contacts_per_day: newContactsPerDay,
    sending_schedule_id: sendingScheduleId,
    stop_contact_when: stopContactWhen,
    variant_spintax_distribution: variantSpintaxDistribution,
    stop_contact_on_company_level_reply: stopContactOnCompanyLevelReply,
    follow_up_percent: followUpPercent,
    ai_categorisation: aiCategorisation,
    categories,
    ignore_ooo_category_reply: ignoreOooCategoryReply,
    delay_reactivation_ooo_contact: delayReactivationOooContact,
    send_plain_text: sendPlainText,
    match_esp_contact: matchEspContact,
    block_previously_bounced_contact: blockPreviouslyBouncedContact,
    auto_optimize_ab_test: autoOptimizeAbTest,
    pause_campaign_when_bounce_rate_at: pauseCampaignWhenBounceRateAt,
    include_unsubscribe_message: includeUnsubscribeMessage
  } = req.body;

  try {
    // 1. Verify sequence scope identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Validate sending_schedule_id if explicitly provided
    if (sendingScheduleId !== undefined && sendingScheduleId !== null) {
      const schedule = await SendingSchedulesModelHandler.getScheduleByWhere({ id: sendingScheduleId, workspace_id: workspaceId });
      if (!schedule) {
        return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sending schedule not found' });
      }
    }

    // 3. Construct update payload strictly using seq_settings table columns
    const settingsPayload = {
      ...(newContactsPerDay !== undefined && { new_contacts_per_day: newContactsPerDay }),
      ...(sendingScheduleId !== undefined && { sending_schedule_id: sendingScheduleId }),
      ...(stopContactWhen !== undefined && { stop_contact_when: stopContactWhen }),
      ...(variantSpintaxDistribution !== undefined && { variant_spintax_distribution: variantSpintaxDistribution }),
      ...(stopContactOnCompanyLevelReply !== undefined && { stop_contact_on_company_level_reply: stopContactOnCompanyLevelReply }),
      ...(followUpPercent !== undefined && { follow_up_percent: followUpPercent }),
      ...(aiCategorisation !== undefined && { ai_categorisation: aiCategorisation }),
      ...(categories !== undefined && { categories }),
      ...(ignoreOooCategoryReply !== undefined && { ignore_ooo_category_reply: ignoreOooCategoryReply }),
      ...(delayReactivationOooContact !== undefined && { delay_reactivation_ooo_contact: delayReactivationOooContact }),
      ...(sendPlainText !== undefined && { send_plain_text: sendPlainText }),
      ...(matchEspContact !== undefined && { match_esp_contact: matchEspContact }),
      ...(blockPreviouslyBouncedContact !== undefined && { block_previously_bounced_contact: blockPreviouslyBouncedContact }),
      ...(autoOptimizeAbTest !== undefined && { auto_optimize_ab_test: autoOptimizeAbTest }),
      ...(pauseCampaignWhenBounceRateAt !== undefined && { pause_campaign_when_bounce_rate_at: pauseCampaignWhenBounceRateAt }),
      ...(includeUnsubscribeMessage !== undefined && { include_unsubscribe_message: includeUnsubscribeMessage }),
      updated_at: new Date()
    };

    // 4. Upsert into seq_settings
    const existingSettings = await SeqSettingsModelHandler.getSeqSettingByWhere({ seq_id: seqId });

    if (existingSettings) {
      await SeqSettingsModelHandler.updateSeqSetting(settingsPayload, { seq_id: seqId });
    } else {
      settingsPayload.seq_id = seqId;
      settingsPayload.created_at = new Date();
      await SeqSettingsModelHandler.createSeqSetting(settingsPayload);
    }

    return res.status(StatusCodes.OK).send({
      success: true,
      message: 'Sequence settings synchronized successfully'
    });

  } catch (error) {
    logger.error(`Failed to update seq_settings for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
