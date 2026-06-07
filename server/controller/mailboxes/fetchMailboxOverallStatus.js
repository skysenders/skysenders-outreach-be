import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const fetchMailboxOverallStatus = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  try {
    const result = await MailboxesModelHandler.getMailboxesOverallStatus(partnerId, workspaceId);

    return res.status(StatusCodes.OK).send(result);
  } catch (error) {

    logger.error(`Error fetching overall mailbox status: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
