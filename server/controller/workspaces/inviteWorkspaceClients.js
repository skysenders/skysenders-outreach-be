import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto'; // Ensure this is imported
import {
  USER_STATUS,
  USER_ROLE,
} from '../../config/constants';

export const inviteWorkspaceClients = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserModelHandler = Container.get('UserModelHandler');
  const WorkspaceClientMappingModelHandler = Container.get('WorkspaceClientMappingModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.params.id;
    const { clients } = req.body; // Guaranteed max 10
    const user = req.user;

    // 1. Validate Workspace & Permissions
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      id: workspaceId,
      partner_id: user.tenant_id,
      deleted_at: null
    });

    if (!workspace) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Workspace not found' });
    }

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
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
      deleted_at: null
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

    // 3. Process Clients in Parallel (Safe for batch of 10 with unique emails)
    await Promise.all(uniqueClients.map(async(client) => {
      try {
        const { email, name, password, role } = client;

        let targetClient = existingClients.find(u => u.email === email);

        // Check for existing mapping
        const hasMapping = targetClient && existingUserWorkspaceClients.some(m => m.user_id === targetClient.id);

        if (hasMapping) {
          failed.push({ email, reason: 'Client already associated with the workspace' });
          return;
        }

        if (targetClient && targetClient.account_id !== user.account_id) {
          failed.push({ email, reason: 'Client belongs to a different account' });
          return;
        }

        // Create user if missing
        if (!targetClient) {
          targetClient = await UserModelHandler.createUser({
            partner_id: user.tenant_id,
            account_id: user.account_id,
            email,
            name,
            password: crypto.randomUUID(), // Secure random string
            status: USER_STATUS.ACTIVE,
            role: role || USER_ROLE.ACCOUNT_MANAGER, // Default role for clients
            is_client: true
          });
        }

        // create a entry in workspace_client_mappings with the provided password
        await WorkspaceClientMappingModelHandler.createWorkspaceClientMapping({
          user_id: targetClient.id,
          workspace_id: workspace.id,
          password
        });

        // 5. Update Redis Cache
        await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
          accountId: targetClient.account_id,
          userId: targetClient.id,
          role: targetClient.role
        });

        invited.push({ email, status: USER_STATUS.ACTIVE, role: targetClient.role });

      } catch (err) {
        logger.error(`Individual invite failed for ${client.email}: ${err.message}`);
        failed.push({ email: client.email, reason: 'Internal processing error' });
      }
    }));

    return res.status(StatusCodes.OK).send({
      message: 'Invitation process completed',
      data: { invited, failed }
    });

  } catch (err) {
    logger.error(`Critical error in inviteWorkspaceClients: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
