import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import Container from 'typedi';

/*
DELETE MAILBOX BY ID
*/
export const deleteMailboxById = async(req, res) => {
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
    const mailbox = await MailboxesModelHandler.softDeleteMailbox({ partner_id: partnerId, workspace_id: workspaceId, id });

    // if mailbox not found, return 404
    if (!(mailbox && mailbox[0])) {
      logger.warn(`Mailbox with ID ${id} not found for workspace ID ${workspaceId}`);
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Mailbox not found.' });
    }

    return res.status(StatusCodes.OK).send({ message: 'Mailbox deleted successfully!' });
  } catch (error) {

    logger.error(`Error fetching mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};

// Delete all mailboxes
export const bulkDeleteMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  try {

    const {
      mailbox_ids: mailboxIds,
      search_text: searchText,
      provider,
      is_active: isActive,
      warmup_enabled: warmupEnabled,
    } = req.body || {};

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
      logger.warn('No filter provided for bulk delete');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one filter must be provided for bulk delete.' });
    }

    // bulk delete mailboxes
    const deletedMailboxes = await MailboxesModelHandler.softDeleteMailbox(where);

    return res.status(StatusCodes.OK).send({
      message: `${deletedMailboxes ? deletedMailboxes.length : 0} mailboxes deleted successfully.`,
      deleted_mailboxes: deletedMailboxes
    });
  } catch (error) {

    logger.error(`Error updating mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
