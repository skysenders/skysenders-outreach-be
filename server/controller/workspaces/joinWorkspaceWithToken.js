import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import {
  WORKSPACE_USER_MAPPING_STATUS,
} from '../../config/constants';

export const joinWorkspace = async(token, userId) => {
  const StringHelper = Container.get('StringHelper');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const logger = Container.get('logger');

  try {
    const decoded = StringHelper.decodeToken(token);

    // Check if token is valid and contains necessary IDs
    if (!decoded || !decoded.user_id || !decoded.workspace_id) {
      logger.warn(`Invalid token provided for joining workspace. userId: ${userId}`);
      return [null, { message: 'Invalid or expired token', status: StatusCodes.BAD_REQUEST }];
    }

    const { user_id: tokenUserId, workspace_id: workspaceId } = decoded;

    // 2. Security Check: Authenticated user must match token user
    if (userId !== tokenUserId) {
      logger.warn(`User ${userId} attempted to join workspace with token belonging to user ${tokenUserId}`);
      return [null, {
        message: 'This invitation token belongs to a different account. Please switch accounts and try again.',
        status: StatusCodes.FORBIDDEN
      }];
    }

    // 3. Fetch specific mapping
    // Query specifically for the pending mapping to avoid ambiguity
    const [userWorkspaceMapping] = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
      workspace_id: workspaceId,
      user_id: userId,
      status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING,
      is_deleted: false
    });

    if (!userWorkspaceMapping) {
      logger.warn(`No pending invitation found for user ${userId} in workspace ${workspaceId}`);
      return [null, { message: 'No pending invitation found or it has already been accepted.', status: StatusCodes.NOT_FOUND }];
    }

    // 4. Update Database
    await UserWorkspaceMappingModelHandler.updateWorkspaceMember({
      status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_ACCEPTED,
      is_active: true,
      updated_at: new Date()
    }, {
      id: userWorkspaceMapping.id
    });

    // 5. Update Redis Cache
    // Ensure the user gets immediate access without waiting for a cache TTL
    await WorkspaceRedisCacheHelper.addWorkspaceAccess({
      userId: userId,
      workspaceId,
      role: userWorkspaceMapping.role
    });
    logger.info(`User ${userId} successfully joined workspace ${workspaceId} with role ${userWorkspaceMapping.role}`);
    return [{ workspace_id: workspaceId, role: userWorkspaceMapping.role }, null];
  } catch (err) {
    logger.error(`Critical error in joinWorkspace: ${err.message}`);
    return [null, { message: 'Internal Server Error', status: StatusCodes.INTERNAL_SERVER_ERROR }];
  }
};

export const joinWorkspaceWithToken = async(req, res) => {

  try {
    const { token } = req.body;

    const [result, error] = await joinWorkspace(token, req.user.id);

    if (error) {
      return res.status(error.status).send({ message: error.message });
    }

    return res.status(StatusCodes.OK).send({
      message: 'Successfully joined the workspace',
      data: {
        workspace_id: result.workspace_id,
        role: result.role
      }
    });

  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
