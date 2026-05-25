import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { fetchNextWarmupAccount } from '../../../utils/redis-handler/redis-warmup-pool-cache';
import { AUTH_TOKEN } from '../../../config/constants';

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
    const warmupAccountDetails = await fetchNextWarmupAccount('wp');

    if (!warmupAccountDetails) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'No warmup mailbox found in the pool'
      });
    }

    // check if the fetched warmupAccountDetails matches the same with req.query.user_id and mailbox_id
    // if so then move to next warmup account in the pool and fetch details
    // eslint-disable-next-line eqeqeq
    if (warmupAccountDetails.workspaceId == req.query.workspace_id && warmupAccountDetails.mailboxId == req.query.mailbox_id) {
      logger.info('Fetched warmup account details from pool matches with the request query params, fetching next warmup account details from pool..', req.query.mailbox_id);
      const nextWarmupAccountDetails = await fetchNextWarmupAccount('wp');
      if (nextWarmupAccountDetails) {
        warmupAccountDetails.workspaceId = nextWarmupAccountDetails.workspaceId;
        warmupAccountDetails.mailboxId = nextWarmupAccountDetails.mailboxId;
      } else {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: 'No more warmup mailbox found in the pool'
        });
      }
    }

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
