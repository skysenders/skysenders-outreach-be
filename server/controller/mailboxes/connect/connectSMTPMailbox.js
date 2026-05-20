import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { MAILBOX_TYPE, MAILBOX_DEFAULT_SEND_LIMTS, MAILBOX_AUTH_TYPE } from '../../../config/constants';

export const verifyAndCreateSMTPMailbox = async(req, res) => {
  const logger = Container.get('logger');
  const AwsService = Container.get('AwsService');
  const ConnectESPMailboxServices = Container.get('ConnectESPMailboxServices');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace ID not found.',
    });
  }

  try {
    const { id, email } = req.body;

    // call lambda function for verifying the SMTP credentials
    const lambdaPayload = {
      smtp: {
        host: req.body.smtp_host,
        port: req.body.smtp_port,
        secure: req.body.smtp_secure,
        username: req.body.smtp_username,
        password: req.body.smtp_password,
      }, imap: {
        host: req.body.imap_host,
        port: req.body.imap_port,
        secure: req.body.imap_secure,
        username: req.body.imap_username,
        password: req.body.imap_password,
      }
    };
    // invoke lambda function to verify SMTP credentials
    const result = await AwsService.verifySMTPMailbox({ body: lambdaPayload});

    // throw error if verification failed
    if (result.statusCode !== 200) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Mailbox verification failed',
        details: result?.body,
      });
    }

    const [ success, error ] = await ConnectESPMailboxServices.connectMailbox(
      { mailboxId: id, userId: req.user.id, partnerId, workspaceId },
      email,
      MAILBOX_TYPE.SMTP,
      MAILBOX_AUTH_TYPE.SMTP_PASSWORD,
      {
        name: req.body.name || email,
        email,
        sending_limit_per_day: req.body.sending_limit_per_day || MAILBOX_DEFAULT_SEND_LIMTS.sending_limit_per_day,
        minimum_time_gap_mins: req.body.minimum_time_gap_mins || MAILBOX_DEFAULT_SEND_LIMTS.minimum_time_gap_mins,
        different_reply_to: req.body.different_reply_to,
        bcc_to_crm: req.body.bcc_to_crm,
        credentials: {
          smtp_host: req.body.smtp_host,
          smtp_port: req.body.smtp_port,
          smtp_secure: req.body.smtp_secure,
          smtp_username: req.body.smtp_username,
          smtp_password: req.body.smtp_password,

          imap_host: req.body.imap_host,
          imap_port: req.body.imap_port,
          imap_secure: req.body.imap_secure,
          imap_username: req.body.imap_username,
          imap_password: req.body.imap_password,
        }
      }
    );

    // if there was an error during connection (after successful verification), return the error message
    if (error) {
      return res.status(error.status_code).send({
        message: error.message
      });
    }

    // else return success message with mailbox details
    return res.status(StatusCodes.OK).send({
      message: success.message,
      mailbox: success.mailbox,
      verification: result.body,
    });

  } catch (error) {
    logger.error(`Error verifying mailbox: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message,
    });
  }
};
