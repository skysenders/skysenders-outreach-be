import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const getWorkspaceMembers = async(req, res) => {
  const logger = Container.get('logger');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const user = req.user;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Workspace ID is missing in request header'
      });
    }

    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: user.id,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'Insufficient permissions to view workspace members'
      });
    }

    const members = await UserWorkspaceMappingModelHandler.getWorkspaceMemberDetails(workspaceId, req.query);

    // 3. Return Data
    return res.status(StatusCodes.OK).send(members);

  } catch (err) {
    logger.error(`Critical error in getWorkspaceMembers (Raw Query): ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
