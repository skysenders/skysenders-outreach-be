import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const fetchMailboxOverallStatus = async(req, res) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  const workspaceId = req.workspace.id;

  try {
    const result = await MailboxesModelHandler.getMailboxesOverallStatus(workspaceId);

    return res.status(StatusCodes.OK).send(result);
  } catch (error) {

    logger.error(`Error fetching overall mailbox status: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
