import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto'; // Ensure this is imported
import {
  WORKSPACE_USER_ROLE,
  WORKSPACE_USER_MAPPING_STATUS,
  USER_STATUS,
  WORKSPACE_ROLE_PERMISSIONS,
} from '../../config/constants';

export const inviteWorkspaceClients = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserModelHandler = Container.get('UserModelHandler');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.workspace?.id;
    const { clients } = req.body; // Guaranteed max 10
    const user = req.user;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    // 1. Validate Workspace & Permissions
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      id: workspaceId,
      partner_id: user.tenant_id,
      is_deleted: false
    });

    if (!workspace) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Workspace not found' });
    }

    const isOwner = workspace.owner_user_id === user.id;

    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: user.id,
      workspaceId: workspace.id
    });

    if (!isOwner && !hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to invite clients' });
    }

    // remove duplicate emails from the request
    const uniqueClientsMap = {};

    clients.forEach(c => {
      c.email = c.email.toLowerCase().trim(); // Normalize email
      uniqueClientsMap[c.email] = c; // Last one wins if duplicates
    });

    const uniqueClients = Object.values(uniqueClientsMap);

    // 2. Pre-fetch Data
    const clientEmails = uniqueClients.map(c => c.email);

    // fetch existing clients for the provided emails
    const existingClients = await UserModelHandler.getUsersByWhere({
      partner_id: user.tenant_id,
      email: clientEmails,
      is_client: true,
      is_deleted: false
    });

    // fetch existing mappings to avoid duplicates
    let existingUserWorkspaceClients = [];

    if (existingClients.length > 0) {
      existingUserWorkspaceClients = await WorkspaceClientMappingModelHandler.getAllWorkspaceClientMappingByWhere({
        workspace_id: workspace.id,
        user_id: existingClients.map(u => u.id)
      });
    }

    const invited = [];
    const failed = [];

    const userWorkspaceMappingsToCreate = [];

    // 3. Process Clients in Parallel (Safe for batch of 10 with unique emails)
    await Promise.all(uniqueClients.map(async(client) => {
      try {
        const { email, name, password, permission } = client;

        let targetClient = existingClients.find(u => u.email === email);

        // Check for existing mapping
        const hasMapping = targetClient && existingUserWorkspaceClients.some(m => m.user_id === targetClient.user_id);

        if (hasMapping) {
          failed.push({ email, reason: 'Client already associated with workspace' });
          return;
        }

        // Create user if missing
        if (!targetClient) {
          targetClient = await UserModelHandler.createUser({
            partner_id: user.tenant_id,
            email,
            name,
            password: crypto.randomUUID(), // Secure random string
            status: USER_STATUS.ACTIVE,
            is_client: true
          });
        }

        // create a entry in workspace_client_mappings with the provided password
        await WorkspaceClientMappingModelHandler.createWorkspaceClientMapping({
          user_id: targetClient.id,
          workspace_id: workspace.id,
          password
        });

        // Prepare Bulk Data
        userWorkspaceMappingsToCreate.push({
          workspace_id: workspace.id,
          user_id: targetClient.id,
          role: WORKSPACE_USER_ROLE.CLIENT,
          permission: permission || WORKSPACE_ROLE_PERMISSIONS.CLIENT,
          status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_ACCEPTED,
          invited_by: user.id,
          is_active: true
        });

        invited.push({ email, status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_ACCEPTED });

      } catch (err) {
        logger.error(`Individual invite failed for ${client.email}: ${err.message}`);
        failed.push({ email: client.email, reason: 'Internal processing error' });
      }
    }));

    // 4. Execute Bulk Operations
    if (userWorkspaceMappingsToCreate.length > 0) {
      await UserWorkspaceMappingModelHandler.bulkCreateUserToWorkspace(userWorkspaceMappingsToCreate);
      for (const mapping of userWorkspaceMappingsToCreate) {
        await WorkspaceRedisCacheHelper.addWorkspaceAccess({
          userId: mapping.user_id,
          workspaceId: mapping.workspace_id,
          role: mapping.role
        });
      }
    }

    return res.status(StatusCodes.OK).send({
      message: 'Invitation process completed',
      data: { invited, failed }
    });

  } catch (err) {
    logger.error(`Critical error in inviteWorkspaceClients: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
