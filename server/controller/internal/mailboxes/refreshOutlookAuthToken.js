import Container from 'typedi';

export const refreshOutlookToken = async(mailboxes) => {
  const logger = Container.get('logger');
  const MicrosoftApiServices = Container.get('MicrosoftApiServices');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

  try {
    // fetch the partnerId and mailboxId
    const refreshToken = await MicrosoftApiServices.getNewMicrosoftAccessToken(
      {
        access_token: mailboxes.access_token,
        refresh_token: mailboxes.refresh_token,
      },
      mailboxes.partner_id,
    );
    logger.info(`Outlook token refreshed successfully for mailbox ID - ${mailboxes.id}`);

    // update the token value to the database
    MailboxesModelHandler.updateMailbox({
      access_token: refreshToken.access_token,
      refresh_token: refreshToken.refresh_token,
      token_expiry: refreshToken.expires_at
    }, {
      id: mailboxes.id,
      partner_id: mailboxes.partner_id
    });


    logger.info(`Outlook token updated in DB successfully for mailbox ID - ${mailboxes.id}`);

    return refreshToken;

  } catch (error) {
    logger.error(`Error occurred while refreshing Outlook token for mailbox ID - ${mailboxes.id}: ${error.message}`);
    return {
      access_token: mailboxes.access_token,
      refresh_token: mailboxes.refresh_token,
      token_expiry: mailboxes.token_expiry
    };
  }
};
