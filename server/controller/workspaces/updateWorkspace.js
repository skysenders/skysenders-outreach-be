import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const updateWorkspace = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.params.id;

    const {
      name,
      logo_url: logoUrl,
      logo_bg_color: logoBgColor,
      theme_color: themeColor,
      timezone,
      team_size: teamSize
    } = req.body;

    const user = req.user;

    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update workspace' });
    }

    // update payload
    const updatePayload = {};

    if (name) updatePayload.name = name;
    if (logoUrl) updatePayload.logo_url = logoUrl;
    if (logoBgColor) updatePayload.logo_bg_color = logoBgColor;
    if (themeColor) updatePayload.theme_color = themeColor;
    if (timezone) updatePayload.timezone = timezone;
    if (teamSize) updatePayload.team_size = teamSize;

    // make sure it is the owner of the workspace who is updating the workspace
    const updatedWorkspace = await WorkspaceModelHandler.updateWorkspace(
      updatePayload,
      { account_id: user.account_id, id: workspaceId }
    );

    if (!updatedWorkspace) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Workspace not found' });
    }

    return res.status(StatusCodes.OK).send(updatedWorkspace);

  } catch (err) {
    logger.error(`Error updating workspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Error while updating workspace - ${err.message}` });
  }
};

export const updateWorkspaceByPartner = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const PartnerKeyHelper = Container.get('PartnerKeyHelper');

  try {

    // encode the token to handle special characters in the token
    const decodedToken = PartnerKeyHelper.validatePartnerToken(req.headers['x-partner-key']);

    // throw error if token does not have partner_id
    if (!decodedToken.partner_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid partner key' });
    }

    const partnerId = decodedToken.partner_id;

    const {
      id: workspaceId,
      name,
      logo_url: logoUrl,
      logo_bg_color: logoBgColor,
      theme_color: themeColor,
      timezone,
      team_size: teamSize
    } = req.body;

    // update payload
    const updatePayload = {};

    if (name) updatePayload.name = name;
    if (logoUrl) updatePayload.logo_url = logoUrl;
    if (logoBgColor) updatePayload.logo_bg_color = logoBgColor;
    if (themeColor) updatePayload.theme_color = themeColor;
    if (timezone) updatePayload.timezone = timezone;
    if (teamSize) updatePayload.team_size = teamSize;

    // make sure it is the owner of the workspace who is updating the workspace
    const updatedWorkspace = await WorkspaceModelHandler.updateWorkspace(
      updatePayload,
      { id: workspaceId, partner_id: partnerId }
    );

    if (!updatedWorkspace) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Workspace not found' });
    }

    return res.status(StatusCodes.OK).send(updatedWorkspace);

  } catch (err) {
    logger.error(`Error updating workspace by partner: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Error while updating workspace by partner - ${err.message}` });
  }
};
