import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const updateWorkspaceGoals = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

  try {
    const workspaceId = req.workspace?.id;
    const { goals = [] } = req.body;
    const user = req.user;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Workspace ID is missing in request header'
      });
    }

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

    const updatedWorkspace = await WorkspaceModelHandler.updateWorkspace(
      { goals },
      { partner_id: user.tenant_id, id: workspaceId }
    );

    return res.status(StatusCodes.OK).send(updatedWorkspace);

  } catch (err) {
    logger.error(`Error updating workspace goals: ${err.message}`);
    throw err;
  }
};
