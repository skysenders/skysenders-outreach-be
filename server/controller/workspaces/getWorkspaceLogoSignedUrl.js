import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

// Generate a signed URL for workspace logo upload.
export const getWorkspaceLogoSignedUrl = async(req, res) => {
  const AwsService = Container.get('AwsService');
  const logger = Container.get('logger');

  const { filename, content_type: contentType } = req.body;
  const workspaceId = req.workspace?.id;
  const partnerId = req.user.tenant_id; // tenant_id is used as partner_id in the token

  if (!workspaceId) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace ID is missing in request header'
    });
  }

  try {
    logger.info(`Generating signed URL for workspace logo for workspace ID: ${workspaceId}`);
    const signedUrl = await AwsService.getWorkspaceBrandingLogoUrl(partnerId, workspaceId, filename, contentType);

    const filenameUrl = new URL(signedUrl);
    logger.info(`Generated signed URL for workspace logo for workspace ID: ${workspaceId}`);
    return res.status(StatusCodes.OK).send({ request_url: signedUrl, filename, file_url: `${filenameUrl.origin}${filenameUrl.pathname}` });
  } catch (error) {
    logger.error(`Error generating signed URL for workspace logo: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};
