import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { refreshGmailToken } from './refreshGmailAuthToken';
import { refreshOutlookToken } from './refreshOutlookAuthToken';
import { AUTH_TOKEN, MAILBOX_TYPE, MAILBOX_AUTH_TYPE } from '../../../config/constants';

export const fetchMailboxDetailsById = async(req, res) => {

  // Fetch dependencies from DI container
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  try {
    // validate auth token
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return res.status(StatusCodes.OK).send({
        message: 'Fetching eligible warmup mailboxes failed | Auth validation failed.'
      });
    }

    /**
     * Step 2: Fetch mailbox details
     */
    const mailboxes = await MailboxesModelHandler.getMailboxAndAllCredsByWhere({
      partnerId: req.query.partner_id,
      workspaceId: req.query.workspace_id,
      id: req.query.mailbox_id
    });

    if (mailboxes && mailboxes.id) {
      // check if the token exists and if it is expired or not, if expired then refresh the token before sending the response
      if (mailboxes.auth_type === MAILBOX_AUTH_TYPE.OAUTH
         && mailboxes.access_token
         && mailboxes.token_expiry
         && (new Date(mailboxes.token_expiry) - new Date() < 60000)) {

        logger.info(`Token expired for mailbox ID - ${req.query.mailbox_id}. Refreshing token...`);

        // GMAIL
        if (mailboxes.provider === MAILBOX_TYPE.GMAIL) {
          const token = await refreshGmailToken(mailboxes);
          mailboxes.access_token = token.access_token;
          mailboxes.refresh_token = token.refresh_token;
          mailboxes.token_expiry = token.token_expiry;
          // OUTLOOK
        } else if (mailboxes.provider === MAILBOX_TYPE.OUTLOOK) {
          const token = await refreshOutlookToken(mailboxes);
          mailboxes.access_token = token.access_token;
          mailboxes.refresh_token = token.refresh_token;
          mailboxes.token_expiry = token.token_expiry;
        }
      }

      return res.status(StatusCodes.OK).send(mailboxes);
    } else {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: `Mailbox id: ${req.query.mailbox_id} not found`
      });
    }

  } catch (error) {

    logger.error(`Error occurred while fetching mailbox details: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: `Server error: ${error.message}`,
    });

  }
};
