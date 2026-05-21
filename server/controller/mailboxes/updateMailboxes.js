import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import Container from 'typedi';

const getUpdateData = (updateFields) => {
  const updateData = {};
  if (typeof updateFields.is_active === 'boolean') updateData.is_active = updateFields.is_active;
  if (typeof updateFields.warmup_enabled === 'boolean') updateData.warmup_enabled = updateFields.warmup_enabled;
  if (updateFields.sending_limit_per_day) updateData.sending_limit_per_day = updateFields.sending_limit_per_day;
  if (updateFields.minimum_time_gap_mins) updateData.minimum_time_gap_mins = updateFields.minimum_time_gap_mins;
  return updateData;
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

    const mailbox = await MailboxesModelHandler.updateMailbox(updateData, where);

    // if mailbox not found, return 404
    if (!mailbox) {
      logger.warn(`Mailbox with ID ${id} not found for workspace ID ${workspaceId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Mailbox not found.' });
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
      is_active: isActive,
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

    if (typeof isActive === 'boolean') {
      where.is_active = isActive;
      isFilterProvided = true;
    }

    if (typeof warmupEnabled === 'boolean') {
      where.warmup_enabled = warmupEnabled;
      isFilterProvided = true;
    }

    if (!isFilterProvided) {
      logger.warn('No filter provided for bulk update');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one filter must be provided for bulk update.' });
    }

    // bulk update mailboxes matching the where condition with the updateData
    const updatedMailboxes = await MailboxesModelHandler.updateMailboxes(updateData, where);

    return res.status(StatusCodes.OK).send({
      message: `${updatedMailboxes ? updatedMailboxes.length : 0} mailboxes updated successfully.`
    });
  } catch (error) {

    logger.error(`Error updating mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
