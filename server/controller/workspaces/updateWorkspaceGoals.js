import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const updateWorkspaceGoals = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.params.id;
    const { goals = [] } = req.body;
    const user = req.user;

    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update workspace' });
    }

    const updatedWorkspace = await WorkspaceModelHandler.updateWorkspace(
      { goals },
      { account_id: user.account_id, id: workspaceId }
    );

    if (!updatedWorkspace) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Workspace not found' });
    }

    return res.status(StatusCodes.OK).send(updatedWorkspace);

  } catch (err) {
    logger.error(`Error updating workspace goals: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Error while updating workspace goals - ${err.message}` });
  }
};
