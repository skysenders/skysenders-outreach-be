import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const deleteWorkspace = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const user = req.user;
    const workspaceId = req.params.id;

    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update workspace' });
    }


    // for each deleted memebrs, remove their workspace access from redis cache
    await AccountWorkspaceRedisCacheHelper.removeAccountWorkspace({
      accountId: user.account_id,
      workspaceId
    });

    // mark workspace as deleted
    await WorkspaceModelHandler.updateWorkspace({
      deleted_at: new Date()
    }, {
      account_id: user.account_id,
      id: workspaceId
    });

    return res.status(StatusCodes.OK).send({
      message: 'Workspace deleted successfully'
    });

  } catch (err) {
    logger.error(`Critical error in deleteWorkspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
