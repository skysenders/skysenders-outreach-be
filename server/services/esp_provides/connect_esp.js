// services/mailbox/MailboxService.js
import { Container } from 'typedi';
import { DOMAIN_MAILBOX_STATUS, DOMAIN_STATUS, DOMAIN_EMAIL_SERVER_TYPE, DNS_PROVIDERS } from '../../config/constants';
import { literal } from 'sequelize';

export const connectMailbox = async(userId, mailboxType, providerData, partnerId) => {
  const logger = Container.get('logger');
  const DomainHandler = Container.get('DomainHandler');
  const DomainMailboxesHandler = Container.get('DomainMailboxesHandler');
  try {

    const email = providerData.email;
    const domainName = email.split('@')[1];
    logger.info(`Connecting mailbox for userId: ${userId}, email: ${email}, domainName: ${domainName}, mailboxType: ${mailboxType}`);

    // 1️⃣ Check existing mailbox
    let existingMailbox = await DomainMailboxesHandler.getDomainMailboxByWhere({
      user_id: userId,
      email,
      is_deleted: false
    });

    if (existingMailbox) {
      // eslint-disable-next-line eqeqeq
      if (existingMailbox.user_id != userId) {
        logger.error(`Mailbox ${email} already connected to another user: ${existingMailbox.user_id}`);
        throw new Error('Mailbox already connected to another user');
      }

      // check if the provider is same or not
      if (existingMailbox.esp_type !== mailboxType) {
        logger.error(`Mailbox ${email} already connected with different provider: ${existingMailbox.esp_type}`);
        throw new Error('Mailbox already connected with different provider');
      }
      logger.info(`Mailbox ${email} already connected for userId: ${userId}`);
    }

    // 2️⃣ Find or create domain
    let existingDomain = await DomainHandler.getDomainsByWhere({
      user_id: userId,
      domain_name: domainName,
      is_deleted: false
    });

    // If the domain exists
    if (existingDomain) {
    // just increment the mailbox_count
      await DomainHandler.updateDomains({
        mailboxes_count: existingMailbox.id ? literal('mailboxes_count') : literal('mailboxes_count+1'),
        status: DOMAIN_STATUS.ACTIVE,
        is_domain_verified: true,
        email_server_type: mailboxType,
        esp_type: DOMAIN_EMAIL_SERVER_TYPE[mailboxType],
        partner_id: partnerId
      }, { id: existingDomain.id });
    } else {
      existingDomain = await DomainHandler.createDomains({
        user_id: userId,
        domain_name: domainName,
        is_domain_verified: true,
        email_server_type: mailboxType,
        status: DOMAIN_STATUS.ACTIVE,
        status_message: 'Domain connected via oauth mailbox setup',
        mailboxes_count: 1,
        esp_type: DOMAIN_EMAIL_SERVER_TYPE[mailboxType],
        dns_provider: DNS_PROVIDERS.NONE,
        partner_id: partnerId
      });
    }

    if (existingMailbox) {
    // update the existing mailbox
      await DomainMailboxesHandler.updateDomainMailbox({
        user_id: userId,
        domain_id: existingDomain.id,
        created_at: new Date().toISOString(),
        first_name: providerData.first_name,
        last_name: providerData.last_name,
        password: mailboxType,
        status: DOMAIN_MAILBOX_STATUS.CONNECTED,
        token: providerData.token,
        token_expiry_at: providerData.token_expiry_at,
        esp_type: mailboxType,
        partner_id: partnerId
      }, {
        user_id: userId,
        email: email,
        is_deleted: false
      });
    } else {
      existingMailbox = await DomainMailboxesHandler.createDomainMailbox({
        user_id: userId,
        domain_id: existingDomain.id,
        email,
        created_at: new Date().toISOString(),
        first_name: providerData.first_name,
        last_name: providerData.last_name,
        password: mailboxType,
        status: DOMAIN_MAILBOX_STATUS.CONNECTED,
        token: providerData.token,
        token_expiry_at: providerData.token_expiry_at,
        esp_type: mailboxType,
        partner_id: partnerId
      });
    }
    logger.info(`Mailbox ${email} connected successfully for userId: ${userId}`);
    return { message: 'Mailbox connected successfully', esp_type: mailboxType, id: existingMailbox.id, domain_id: existingDomain.id, email: existingMailbox.email };
  } catch (error) {
    logger.error(`Error connecting mailbox for userId: ${userId}, error: ${error.message}`);
    throw error;
  }
};
