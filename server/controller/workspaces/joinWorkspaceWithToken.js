import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import {
  WORKSPACE_USER_MAPPING_STATUS,
} from '../../config/constants';


const joinWorkspaceById = async({ workspaceId, userId }) => {
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const logger = Container.get('logger');

  // 1. Fetch specific mapping
  // Query specifically for the pending mapping to avoid ambiguity
  const result = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
    workspace_id: workspaceId,
    user_id: userId,
    status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING,
    is_deleted: false
  });

  if (result.length === 0) {
    logger.info(`No pending invitation found for user ${userId} in workspace ${workspaceId}`);
    return [null, { message: 'No pending invitation found or it has already been accepted.', status: StatusCodes.NOT_FOUND }];
  }

  const userWorkspaceMapping = result[0];

  // check if the resend is atleast 5 mins time before reinvite
  const invitedAt = new Date(userWorkspaceMapping.invited_at);
  const now = new Date();
  const diffInMs = now - invitedAt;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // check if invitation is expired or not (expiry time is 7 days)
  if (diffInDays >= 7) {
    return [null, { message: 'Invitation expired. Please contact the admin to resend invitation.', status: StatusCodes.NOT_ACCEPTABLE }];
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
  return [{ workspace_id: workspaceId, role: userWorkspaceMapping.role }, null];
};

export const joinWorkspace = async(token, userId) => {
  const StringHelper = Container.get('StringHelper');
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

    const [result, error] = await joinWorkspaceById({ workspaceId, userId });

    logger.info(`User ${userId} successfully joined workspace ${workspaceId}, userId: ${userId}`);
    return [result, error];
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

export const joinWorkspaceWithSlug = async(req, res) => {

  try {
    const { slug } = req.body;
    const partnerId = req.user.tenant_id;

    // find workspaces by slug
    const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({ partner_id: partnerId, slug, is_deleted: false });

    const [result, error] = await joinWorkspaceById({ workspaceId: workspace.id, userId: req.user.id });

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
