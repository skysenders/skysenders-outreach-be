import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
FETCH MAILBOX BY ID
*/
export const fetchMailboxById = async(req, res) => {
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
    const mailbox = await MailboxesModelHandler.getMailboxWithCredsByWhere({partnerId, workspaceId, id});

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
