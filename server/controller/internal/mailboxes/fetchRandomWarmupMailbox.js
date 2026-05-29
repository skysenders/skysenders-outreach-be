import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { AUTH_TOKEN } from '../../../config/constants';
import { makeWarmupProxyAPICall } from '../../../api/routes/proxy/warmup-proxy';

export const fetchRandomWarmupMailbox = async(req, res) => {

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

    // fetch next warmup mailbox from Redis pool
    const warmupAccountDetails = await makeWarmupProxyAPICall('/api/warmup/internal/fetch-next-mailbox-from-warmup-pool', 'GET');
    /**
     * Step 2: Fetch mailbox details
     */
    const mailboxes = await MailboxesModelHandler.getMailboxByWhere({
      partner_id: warmupAccountDetails.partnerId,
      id: warmupAccountDetails.mailboxId
    });

    if (mailboxes && mailboxes.id) {
      return res.status(StatusCodes.OK).send(mailboxes);
    } else {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: `Mailbox id: ${warmupAccountDetails.mailboxId} not found`
      });
    }

  } catch (error) {

    logger.error(`Error occurred while fetching random warmup account details: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });

  }
};
