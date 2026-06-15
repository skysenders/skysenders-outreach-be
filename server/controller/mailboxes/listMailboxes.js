import Container from 'typedi';
import { Op } from 'sequelize';
import { AUTH_TOKEN } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';

/*
LIST MAILBOXES
*/
export const listMailboxesInternal = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.query.workspace_id;

  const {
    search_text: searchText,
    mailbox_ids: mailboxIds,
    domain_id: domainId
  } = req.query;

  try {

    // Validate the auth token from the query string
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return res.status(StatusCodes.UNAUTHORIZED).send({ message: 'Please pass the right auth token to access this api.' });
    }

    const where = {
      workspace_id: workspaceId,
      is_deleted: false
    };

    if (searchText) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${searchText}%` } },
        { name: { [Op.iLike]: `%${searchText}%` } }
      ];
    }

    if (mailboxIds) {
      const idsArray = mailboxIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      where.id = { [Op.in]: idsArray };
    }

    if (domainId) {
      where.domain_id = domainId;
    }

    const mailboxes = await MailboxesModelHandler.getAllInternalMailboxesByWhere(where);

    return res.status(StatusCodes.OK).send(mailboxes);

  } catch (error) {

    logger.error(`Error fetching mailboxes for internal use: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};

export const listMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText,
    provider,
    warmup_enabled: warmupEnabled,
    domain_id: domainId,
    status,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const where = {
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

    if (status) where.status = status;

    if (domainId) where.domain_id = domainId;

    if (typeof warmupEnabled === 'boolean') {
      where.warmup_enabled = warmupEnabled;
    }

    const [mailboxes, count] = await Promise.all([
      MailboxesModelHandler.getAllMailboxesByWhere(where, offset, limit, [['id', 'DESC']]),
      MailboxesModelHandler.countMailboxesByWhere(where)
    ]);

    return res.status(StatusCodes.OK).send({ count, offset, limit, has_next: offset + limit < count, has_prev: offset > 0, data: mailboxes });

  } catch (error) {

    logger.error(`Error fetching mailboxes: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
