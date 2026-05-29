// Import necessary modules and dependencies
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { FRONTEND_URL, MAILBOX_AUTH_TYPE, MAILBOX_TYPE } from '../../../config/constants';

export const getGoogleAuthorizeUrl = async(req, res) => {
  const logger = Container.get('logger');
  const GoogleApiServices = Container.get('GoogleApiServices');
  const { redirect_uri: redirectUrl } = req.query;
  try {
    const authorizeUrl = await GoogleApiServices.getAuthUrl({
      userId: req.user.id,
      redirectUrl,
      partnerId: req.user.tenant_id,
      workspaceId: req.workspace?.id
    }, req.user.tenant_id);

    // redirect to Google authentication URL
    return res.status(StatusCodes.OK).send({ auth_url: authorizeUrl });
  } catch (error) {
    logger.error('Error fetching Google authorize URL: %o', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: 'Failed to fetch Google authorize URL' });
  }
};

export const handleGoogleOAuthCallback = async(req, res) => {
  const logger = Container.get('logger');
  const GoogleApiServices = Container.get('GoogleApiServices');
  const ConnectESPMailboxServices = Container.get('ConnectESPMailboxServices');

  try {
    const { code, state } = req.query;
    let userId = 0, workspaceId, partnerId, redirectUrl;

    // extract user_id from the state parameter
    if (state) {
      const stateData = JSON.parse(state);
      userId = stateData.userId;
      partnerId = stateData.partnerId || null;
      workspaceId = stateData.workspaceId || null;
      redirectUrl = stateData.redirectUrl || FRONTEND_URL;
    }
    logger.info(`Received Google OAuth callback for user ID - ${userId}`);
    const tokens = await GoogleApiServices.handleGoogleCallback(code, partnerId);

    logger.info(`Google tokens obtained for user ID - ${userId}`);
    const googleUser = await GoogleApiServices.verify(tokens.id_token, partnerId);

    const providerData = GoogleApiServices.getNormalisedData(googleUser, tokens);
    const email = providerData.email;

    logger.info(`Connecting mailbox for user ID - ${userId}, email - ${email}`);
    const [ success, error ] = await ConnectESPMailboxServices.connectMailbox(
      { userId, partnerId, workspaceId },
      email,
      MAILBOX_TYPE.GMAIL,
      MAILBOX_AUTH_TYPE.OAUTH,
      providerData
    );

    // if there was an error during connection (after successful verification), return the error message
    if (error) {
      return res.redirect(`${redirectUrl}/app/mailbox?error=${error.message}`);
    }
    return res.redirect(`${redirectUrl}/app/mailbox/${success.mailbox.id}/warmup?connectionSuccess=true&email=${email}&mailbox_id=${success.mailbox.id}`);
  } catch (error) {
    logger.error(`Error handling Google OAuth callback: ${error}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: error.message || 'Failed to handle Google OAuth callback' });
  }
};
