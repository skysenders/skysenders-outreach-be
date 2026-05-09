import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

// Generate a signed URL for user profile upload.
export const getUserProfileSignedUrl = async(req, res) => {
  const AwsService = Container.get('AwsService');
  const logger = Container.get('logger');

  const { filename, content_type: contentType } = req.body;
  const userId = req.user.id;
  const partnerId = req.user.tenant_id; // tenant_id is used as partner_id in the token

  try {
    logger.info(`Generating signed URL for user profile for user ID: ${userId}`);
    const signedUrl = await AwsService.getUserProfileLogoUrl(partnerId, userId, filename, contentType);

    const filenameUrl = new URL(signedUrl);
    logger.info(`Generated signed URL for user profile for user ID: ${userId}`);
    return res.status(StatusCodes.OK).send({ request_url: signedUrl, filename, file_url: `${filenameUrl.origin}${filenameUrl.pathname}` });
  } catch (error) {
    logger.error(`Error generating signed URL for user profile: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};
