// Import necessary modules and dependencies
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { FRONTEND_URL, MAILBOX_AUTH_TYPE, MAILBOX_TYPE } from '../../../config/constants';

export const getOutlookAuthorizeUrl = async(req, res) => {
  const logger = Container.get('logger');
  const MicrosoftApiServices = Container.get('MicrosoftApiServices');
  const { redirect_uri: redirectUrl } = req.query;
  try {
    const authorizeUrl = await MicrosoftApiServices.getMicrosoftAuthUrl({
      userId: req.user.id,
      redirectUrl,
      partnerId: req.user.tenant_id,
      workspaceId: req.workspace?.id
    }, req.user.tenant_id);

    // redirect to Google authentication URL
    return res.redirect(authorizeUrl);
  } catch (error) {
    logger.error('Error fetching Outlook authorize URL: %o', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: error.message || 'Failed to fetch Outlook authorize URL' });
  }
};

export const handleOutlookOAuthCallback = async(req, res) => {
  const logger = Container.get('logger');
  const MicrosoftApiServices = Container.get('MicrosoftApiServices');
  const ConnectESPMailboxServices = Container.get('ConnectESPMailboxServices');

  try {
    const { code, state } = req.query;
    let userId, workspaceId, partnerId;
    let redirectUrl = FRONTEND_URL;
    // extract user_id from the state parameter
    if (state) {
      const stateData = JSON.parse(state);
      userId = stateData.userId;
      partnerId = stateData.partnerId || null;
      workspaceId = stateData.workspaceId || null;
      redirectUrl = stateData.redirectUrl || FRONTEND_URL;
    }
    logger.info(`Received Outlook OAuth callback for user ID - ${userId}`);
    const tokens = await MicrosoftApiServices.handleMicrosoftCallback(code, partnerId);

    logger.info(`Outlook tokens obtained for user ID - ${userId}`);
    const userData = await MicrosoftApiServices.getMicrosoftUserDetails(tokens);

    logger.info(`Outlook user data fetched for user ID - ${userId}, email - ${userData.mail}`);
    const providerData = MicrosoftApiServices.getMicrosoftNormalisedData(userData, tokens);
    const email = providerData.email;

    logger.info(`Connecting mailbox for user ID - ${userId}, email - ${providerData.email}`);

    const [ success, error ] = await ConnectESPMailboxServices.connectMailbox(
      { userId, partnerId, workspaceId },
      email,
      MAILBOX_TYPE.OUTLOOK,
      MAILBOX_AUTH_TYPE.OAUTH,
      providerData
    );

    // if there was an error during connection (after successful verification), return the error message
    if (error) {
      return res.redirect(`${redirectUrl}/app/mailbox?error=${error.message}`);
    }
    return res.redirect(`${redirectUrl}/app/mailbox/${success.mailbox.id}/warmup?connectionSuccess=true&email=${email}&mailbox_id=${success.mailbox.id}`);
  } catch (error) {
    logger.error(`Error handling Outlook OAuth callback: ${error}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: 'Failed to handle Outlook OAuth callback' });
  }
};
