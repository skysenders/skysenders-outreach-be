import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { MAILBOX_TYPE, MAILBOX_AUTH_TYPE, MAILBOX_STATUS, MAILBOX_DEFAULT_SEND_LIMTS } from '../../../config/constants';

export const verifyAndCreateSMTPMailbox = async(req, res) => {
  const logger = Container.get('logger');
  const AwsService = Container.get('AwsService');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  const DomainsModelHandler = Container.get('DomainsModelHandler');
  const MailboxCredentialsModelHandler = Container.get('MailboxCredentialsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace ID not found.',
    });
  }

  try {
    const { id, email, provider = MAILBOX_TYPE.SMTP } = req.body;

    // first chec k if the mailbox with same email already exists in the workspace
    const existingMailbox = await MailboxesModelHandler.getMailboxByWhere({
      partner_id: partnerId,
      email,
      is_deleted: false,
    });

    // eslint-disable-next-line eqeqeq
    if (existingMailbox && existingMailbox.workspace_id != workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'A mailbox with this email already exists in another workspace. Please switch workspace to access it or contact customer support team.'
      });
    }

    if (existingMailbox && existingMailbox.id !== id) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'A mailbox with this email already exists in the workspace. Please use a different email or use the right "id" to update it.'
      });
    }

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

    const currentDate = new Date().toISOString();

    // if successfully verified, create/update mailbox record in the database
    if (existingMailbox) {
      await MailboxesModelHandler.updateMailbox({
        name: req.body.name || existingMailbox.name,
        email: email || existingMailbox.email,
        status: MAILBOX_STATUS.ACTIVE,
        provider,
        auth_type: MAILBOX_AUTH_TYPE.SMTP,
        domain_id: existingMailbox.domain_id,
        sending_limit_per_day: req.body.sending_limit_per_day || existingMailbox.sending_limit_per_day,
        minimum_time_gap_mins: req.body.minimum_time_gap_mins || existingMailbox.minimum_time_gap_mins,
        last_connected_at: currentDate,
        disconnect_reason: null,
        different_reply_to: req.body.different_reply_to || existingMailbox.different_reply_to,
        bcc_to_crm: req.body.bcc_to_crm || existingMailbox.bcc_to_crm,
        is_active: true,
        is_deleted: false,
        updated_at: currentDate,
      }, {
        id: existingMailbox.id
      });

      // update credentials in the credentials table as well
      await MailboxCredentialsModelHandler.updateMailboxCredentials({
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

        updated_at: currentDate,
      }, {
        mailbox_id: existingMailbox.id
      });

      return res.status(StatusCodes.OK).send({
        message: 'Mailbox verified and updated successfully',
        mailbox: existingMailbox
      });
    }

    const domian = await DomainsModelHandler.createNewDomain({
      partner_id: partnerId,
      workspace_id: workspaceId,
      domain_name: email.split('@')[1],
      provider,
    });

    // else create new mailbox record
    const mailbox = await MailboxesModelHandler.createMailbox({
      partner_id: partnerId,
      workspace_id: workspaceId,
      name: req.body.name || email,
      email,
      status: MAILBOX_STATUS.ACTIVE,
      provider,
      domain_id: domian.id,
      auth_type: MAILBOX_AUTH_TYPE.SMTP,
      sending_limit_per_day: req.body.sending_limit_per_day || MAILBOX_DEFAULT_SEND_LIMTS.sending_limit_per_day,
      minimum_time_gap_mins: req.body.minimum_time_gap_mins || MAILBOX_DEFAULT_SEND_LIMTS.minimum_time_gap_mins,
      last_connected_at: currentDate,
      different_reply_to: req.body.different_reply_to,
      bcc_to_crm: req.body.bcc_to_crm,
    });

    // create credentials record in the credentials table as well
    await MailboxCredentialsModelHandler.createMailboxCredentials({
      mailbox_id: mailbox.id,
      email,
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
      created_at: currentDate,
      updated_at: currentDate,
    });

    return res.status(StatusCodes.OK).send({
      message: 'Mailbox verified and created successfully',
      mailbox,
      verification: result,
    });

  } catch (error) {
    logger.error(`Error verifying mailbox: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message,
    });
  }
};
