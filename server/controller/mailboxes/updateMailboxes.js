import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import Container from 'typedi';
import { makeWarmupProxyAPICall } from '../../api/routes/proxy/warmup-proxy';

const getUpdateData = (updateFields) => {
  const updateData = {};
  if (typeof updateFields.warmup_enabled === 'boolean') updateData.warmup_enabled = updateFields.warmup_enabled;
  if (updateFields.sending_limit_per_day) updateData.sending_limit_per_day = updateFields.sending_limit_per_day;
  if (updateFields.minimum_time_gap_mins) updateData.minimum_time_gap_mins = updateFields.minimum_time_gap_mins;
  if (updateFields.bcc_to_crm) updateData.bcc_to_crm = updateFields.bcc_to_crm;
  if (updateFields.signature) updateData.signature = updateFields.signature;
  return updateData;
};

export const bulkUpdateWarmupOnProxyWarmupServer = async(mailboxIds, warmupEnabled, profileId, partnerId, worksapceId) => {
  try {
    if (mailboxIds.length === 0) return;
    await makeWarmupProxyAPICall('/api/warmup/bulk-update', 'POST', {
      mailbox_ids: mailboxIds,
      status: warmupEnabled ? 'ACTIVE' : 'INACTIVE',
      warmup_profile_id: profileId,
    }, null, {
      'x-partner-id': partnerId,
      'x-workspace-id': worksapceId,
    });

  } catch (error) {
    const logger = Container.get('logger');
    logger.error(`Error updating warmup status on proxy warmup server for mailbox IDs ${mailboxIds}: ${error.message}`);
  }
};

/*
UPDATE MAILBOX BY ID
*/
export const updateMailboxById = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const id = req.params.id;
  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  try {

    const where = { partner_id: partnerId, workspace_id: workspaceId, id };
    const updateData = getUpdateData(req.body);

    if (updateData.warmup_enabled && !req.body.warmup_profile_id) {
      logger.warn('Warmup profile ID must be provided when enabling warmup');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Warmup profile ID must be provided when enabling warmup.' });
    }

    const mailbox = await MailboxesModelHandler.updateMailbox(updateData, where);

    // if mailbox not found, return 404
    if (!mailbox) {
      logger.warn(`Mailbox with ID ${id} not found for workspace ID ${workspaceId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Mailbox not found.' });
    }

    if (typeof updateData.warmup_enabled === 'boolean') {
      if (!mailbox.warmup_first_started_at) {
        await MailboxesModelHandler.updateMailbox({ warmup_first_started_at: new Date().toISOString() }, where);
      }
      // bulk update warmup status on proxy warmup server for the updated mailbox
      bulkUpdateWarmupOnProxyWarmupServer(
        [{
          id: mailbox.id,
          email: mailbox.email,
          provider: mailbox.provider,
        }],
        req.body.warmup_enabled,
        req.body.warmup_profile_id,
        partnerId,
        workspaceId
      );
    }

    return res.status(StatusCodes.OK).send(mailbox);
  } catch (error) {

    logger.error(`Error fetching mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};

/*
BULK UPDATE MAILBOX BY ID
*/
export const bulkUpdateMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }


  try {

    const updateFields = req.body.update_fields || {};
    const updateData = getUpdateData(updateFields);

    const {
      mailbox_ids: mailboxIds,
      search_text: searchText,
      provider,
      warmup_enabled: warmupEnabled,
    } = req.body.filter || {};

    let isFilterProvided = false;
    const where = { partner_id: partnerId, workspace_id: workspaceId, is_deleted: false };

    // if mailboxIds are provided, filter by those IDs
    if (mailboxIds && Array.isArray(mailboxIds) && mailboxIds.length > 0) {
      where.id = mailboxIds;
      isFilterProvided = true;
    }

    // if searchText is provided, filter by email or name containing the searchText
    if (searchText) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${searchText}%` } },
        { name: { [Op.iLike]: `%${searchText}%` } }
      ];
      isFilterProvided = true;
    }

    // if provider is provided, filter by provider
    if (provider) {
      where.provider = provider;
      isFilterProvided = true;
    }

    if (typeof warmupEnabled === 'boolean') {
      where.warmup_enabled = warmupEnabled;
      isFilterProvided = true;
    }

    if (updateData.warmup_enabled && !updateFields.warmup_profile_id) {
      logger.warn('Warmup profile ID must be provided when bulk updating warmup status');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Warmup profile ID must be provided when bulk updating warmup status.' });
    }

    if (!isFilterProvided) {
      logger.warn('No filter provided for bulk update');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one filter must be provided for bulk update.' });
    }

    // bulk update mailboxes matching the where condition with the updateData
    const updatedMailboxes = await MailboxesModelHandler.updateMailboxes(updateData, where);

    if (typeof updateData.warmup_enabled === 'boolean') {
      const firstTimeWarmupEnabledMailboxes = updatedMailboxes.filter(mailbox => mailbox.warmup_enabled && !mailbox.warmup_first_started_at);
      const firstTimeWarmupEnabledMailboxIds = firstTimeWarmupEnabledMailboxes.map(mailbox => mailbox.id);
      if (firstTimeWarmupEnabledMailboxIds.length > 0) {
        await MailboxesModelHandler.updateMailboxes({ warmup_first_started_at: new Date().toISOString() }, { id: firstTimeWarmupEnabledMailboxIds });
      }

      // update warmup status on proxy warmup server for the updated mailboxes
      const warmupMailboxIds = updatedMailboxes.map(mailbox => ({
        id: mailbox.id,
        email: mailbox.email,
        provider: mailbox.provider,
      }));
      // bulk update warmup status on proxy warmup server for the updated mailboxes
      bulkUpdateWarmupOnProxyWarmupServer(warmupMailboxIds, updateData.warmup_enabled, updateFields.warmup_profile_id, partnerId, workspaceId);
    }

    return res.status(StatusCodes.OK).send({
      message: `${updatedMailboxes ? updatedMailboxes.length : 0} mailboxes updated successfully.`,
      updated_mailboxes: updatedMailboxes
    });
  } catch (error) {

    logger.error(`Error updating mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
