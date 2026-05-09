import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const updateWorkspace = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

  try {
    const { workspaceId } = req.params;

    const {
      name,
      logo_url: logoUrl,
      timezone,
      team_size: teamSize
    } = req.body;

    const user = req.user;

    // check workspace exists under partner
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: user.tenant_id,
      id: workspaceId,
    });

    if (!workspace) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Workspace not found'
      });
    }

    // check if the user is the owner of the workspace
    if (workspace.owner_user_id !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'You are not authorized to update this workspace'
      });
    }

    // update payload
    const updatePayload = {};

    if (name) updatePayload.name = name;
    if (logoUrl) updatePayload.logo_url = logoUrl;
    if (timezone) updatePayload.timezone = timezone;
    if (teamSize) updatePayload.team_size = teamSize;

    // make sure it is the owner of the workspace who is updating the workspace
    const updatedWorkspace = await WorkspaceModelHandler.updateWorkspace(
      updatePayload,
      { partner_id: user.tenant_id, id: workspaceId }
    );

    return res.status(StatusCodes.OK).send(updatedWorkspace);

  } catch (err) {
    logger.error(`Error updating workspace: ${err.message}`);
    throw err;
  }
};
