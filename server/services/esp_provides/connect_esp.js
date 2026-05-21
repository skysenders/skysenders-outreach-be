// services/mailbox/MailboxService.js
import { Container } from 'typedi';
import { MAILBOX_AUTH_TYPE, MAILBOX_STATUS, MAILBOX_DEFAULT_SEND_LIMTS, MAILBOX_TYPE } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';

export const connectMailbox = async({ mailboxId, userId, partnerId, workspaceId }, email, provider = MAILBOX_TYPE.SMTP, mailboxAuthType = MAILBOX_AUTH_TYPE.SMTP_PASSWORD, providerData) => {
  const logger = Container.get('logger');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  const DomainsModelHandler = Container.get('DomainsModelHandler');
  const MailboxCredentialsModelHandler = Container.get('MailboxCredentialsModelHandler');
  try {
    logger.info(`Connecting mailbox for userId: ${userId}, email: ${email}, mailboxAuthType: ${mailboxAuthType}`);

    // first chec k if the mailbox with same email already exists in the workspace
    const existingMailbox = await MailboxesModelHandler.getMailboxByWhere({
      partner_id: partnerId,
      email,
      is_deleted: false,
    });

    // eslint-disable-next-line eqeqeq
    if (existingMailbox && existingMailbox.workspace_id != workspaceId) {
      return [ null, {
        message: 'A mailbox with this email already exists in another workspace. Please switch workspace to access it or contact customer support team.',
        status_code: StatusCodes.BAD_REQUEST
      } ];
    }

    if (existingMailbox && mailboxId && existingMailbox.id !== mailboxId) {
      return [ null, {
        message: 'A mailbox with this email already exists in the workspace. Please use a different email or use the right "id" to update it.',
        status_code: StatusCodes.BAD_REQUEST
      }];
    }

    const currentDate = new Date().toISOString();

    // if successfully verified, create/update mailbox record in the database
    if (existingMailbox) {
      await MailboxesModelHandler.updateMailbox({
        name: providerData.name || existingMailbox.name,
        email: email || existingMailbox.email,
        status: MAILBOX_STATUS.ACTIVE,
        provider,
        auth_type: mailboxAuthType,
        domain_id: existingMailbox.domain_id,
        sending_limit_per_day: providerData.sending_limit_per_day || existingMailbox.sending_limit_per_day,
        minimum_time_gap_mins: providerData.minimum_time_gap_mins || existingMailbox.minimum_time_gap_mins,
        last_connected_at: currentDate,
        disconnect_reason: null,
        different_reply_to: providerData.different_reply_to || existingMailbox.different_reply_to,
        bcc_to_crm: providerData.bcc_to_crm || existingMailbox.bcc_to_crm,
        is_authenticated: true,
        is_active: true,
        is_deleted: false,
        updated_at: currentDate,
      }, {
        id: existingMailbox.id
      });

      // update credentials in the credentials table as well
      await MailboxCredentialsModelHandler.updateMailboxCredentials({
        ...providerData.credentials,
        updated_at: currentDate,
      }, {
        mailbox_id: existingMailbox.id
      });

      return [ {
        message: 'Mailbox verified and updated successfully',
        mailbox: existingMailbox
      }, null ];
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
      name: providerData.name || email,
      email,
      status: MAILBOX_STATUS.ACTIVE,
      provider,
      auth_type: mailboxAuthType,
      domain_id: domian.id,
      is_authenticated: true,
      is_active: true,
      sending_limit_per_day: providerData.sending_limit_per_day || MAILBOX_DEFAULT_SEND_LIMTS.sending_limit_per_day,
      minimum_time_gap_mins: providerData.minimum_time_gap_mins || MAILBOX_DEFAULT_SEND_LIMTS.minimum_time_gap_mins,
      last_connected_at: currentDate,
      different_reply_to: providerData.different_reply_to,
      bcc_to_crm: providerData.bcc_to_crm,
    });

    // create credentials record in the credentials table as well
    await MailboxCredentialsModelHandler.createMailboxCredentials({
      ...providerData.credentials,
      mailbox_id: mailbox.id,
      email,
      created_at: currentDate,
      updated_at: currentDate,
    });

    logger.info(`Mailbox ${email} connected successfully for userId: ${userId}`);

    return [{
      message: 'Mailbox verified and created successfully',
      mailbox: mailbox
    }, null];

  } catch (error) {
    logger.error(`Error connecting mailbox for userId: ${userId}, error: ${error.message}`);
    throw error;
  }
};
