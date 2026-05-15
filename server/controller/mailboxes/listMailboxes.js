import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { Op } from 'sequelize';

/*
LIST MAILBOXES
*/
export const listMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  const {
    search_text: searchText,
    provider,
    is_active: isActive,
    warmup_enabled: warmupEnabled,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const where = {
      partner_id: partnerId,
      workspace_id: workspaceId,
      is_deleted: false
    };

    if (searchText) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${searchText}%` } },
        { name: { [Op.iLike]: `%${searchText}%` } }
      ];
    }

    if (provider) where.provider = provider;

    if (typeof isActive === 'boolean') where.is_active = isActive;

    if (typeof warmupEnabled === 'boolean') {
      where.warmup_enabled = warmupEnabled;
    }

    const mailboxes = await MailboxesModelHandler.getAllMailboxesByWhere(where, offset, limit, [['id', 'DESC']]);

    return res.status(StatusCodes.OK).send(mailboxes);

  } catch (error) {

    logger.error(`Error fetching mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
