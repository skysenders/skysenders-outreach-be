import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

// Generate a signed URL for partner logo upload.
export const getSignedUrlForPartnerLogo = async(req, res) => {
  const AwsService = Container.get('AwsService');
  const logger = Container.get('logger');

  const { filename, content_type: contentType } = req.body;
  const partnerId = req.partner.id;

  // if partnerId is not provided, return an error
  if (!partnerId) {
    logger.error('Partner ID is required to add or update custom script.');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
  }

  try {
    logger.info(`Generating signed URL for partner logo for partner ID: ${partnerId}`);
    const signedUrl = await AwsService.getPartnerBrandingLogoUrl(partnerId, filename, contentType);

    const filenameUrl = new URL(signedUrl);
    logger.info(`Generated signed URL for partner logo for partner ID: ${partnerId}`);
    return res.status(StatusCodes.OK).send({ request_url: signedUrl, filename, file_url: `${filenameUrl.origin}${filenameUrl.pathname}` });
  } catch (error) {
    logger.error(`Error generating signed URL for partner logo: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};

// Generate a signed URL for partner favicon upload.
export const getSignedUrlForPartnerFavicon = async(req, res) => {
  const AwsService = Container.get('AwsService');
  const logger = Container.get('logger');

  const { filename, content_type: contentType } = req.body;
  const partnerId = req.partner.id;
  // if partnerId is not provided, return an error
  if (!partnerId) {
    logger.error('Partner ID is required to add or update custom script.');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Partner authentication required. Please log in as a partner.' });
  }

  try {
    logger.info(`Generating signed URL for partner favicon for partner ID: ${partnerId}`);
    const signedUrl = await AwsService.getPartnerBrandingFavIconUrl(partnerId, filename, contentType);
    const filenameUrl = new URL(signedUrl);
    logger.info(`Generated signed URL for partner favicon for partner ID: ${partnerId}`);
    return res.status(StatusCodes.OK).send({ request_url: signedUrl, filename, file_url: `${filenameUrl.origin}${filenameUrl.pathname}` });
  } catch (error) {
    logger.error(`Error generating signed URL for partner favicon: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};
