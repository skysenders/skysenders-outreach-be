import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { AUTH_TOKEN } from '../../../config/constants';

export const updateMailboxWarmupStatus = async(req, res) => {

  // Fetch dependencies from DI container
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  try {
    // validate auth token
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return res.status(StatusCodes.OK).send({
        message: 'Fetching random warmup mailboxes failed | Auth validation failed.'
      });
    }

    const status = req.body.status;
    const mailboxId = req.body.mailbox_id;

    /**
     * Step 2: Fetch mailbox details
     */
    const mailbox = await MailboxesModelHandler.updateMailbox({
      warmup_enabled: status === 'ACTIVE' ? true : false,
      warmup_status: status,
    }, {
      id: mailboxId
    });

    if (mailbox && mailbox.id) {
      return res.status(StatusCodes.OK).send(mailbox);
    } else {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: `Mailbox id: ${mailboxId} not found`
      });
    }

  } catch (error) {

    logger.error(`Error occurred while updating mailbox warmup status: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });

  }
};
