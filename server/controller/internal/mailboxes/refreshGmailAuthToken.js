import Container from 'typedi';

export const refreshGmailToken = async(mailboxes) => {
  const logger = Container.get('logger');
  const GoogleApiServices = Container.get('GoogleApiServices');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  try {
    // fetch the partnerId and mailboxId
    const refreshToken = await GoogleApiServices.getRefreshToken(
      {
        access_token: mailboxes.access_token,
        refresh_token: mailboxes.refresh_token,
      },
      mailboxes.partner_id
    );

    logger.info(`Gmail token refreshed successfully for mailbox ID - ${mailboxes.id}`);

    // update the token value to the database
    MailboxesModelHandler.updateMailbox({
      access_token: refreshToken.access_token,
      refresh_token: refreshToken.refresh_token,
      token_expiry: new Date(refreshToken.expiry_date).toISOString()
    }, {
      id: mailboxes.id,
      partner_id: mailboxes.partner_id
    });

    logger.info(`Gmail token updated in DB successfully for mailbox ID - ${mailboxes.id}`);

    return refreshToken;

  } catch (error) {
    logger.error(`Error occurred while refreshing Gmail token for mailbox ID - ${mailboxes.id}: ${error.message}`);
    return {
      access_token: mailboxes.access_token,
      refresh_token: mailboxes.refresh_token,
      token_expiry: mailboxes.token_expiry
    };
  }
};
