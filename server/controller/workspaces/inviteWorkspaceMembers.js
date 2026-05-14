import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto'; // Ensure this is imported
import {
  WORKSPACE_USER_ROLE,
  WORKSPACE_USER_MAPPING_STATUS,
  USER_STATUS,
  EMAIL_TEMPLATE_NAME,
  PARTNER_EMAIL_SETTINGS_CACHE
} from '../../config/constants';

export const inviteWorkspaceMembers = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserModelHandler = Container.get('UserModelHandler');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const MailerInstance = Container.get('MailerInstance');
  const StringHelper = Container.get('StringHelper');
  const redisClient = Container.get('redisClient');

  try {
    const workspaceId = req.workspace?.id;
    const { members } = req.body; // Guaranteed max 10
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
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to invite members' });
    }

    // remove duplicate emails from the request
    const uniqueMembersMap = {};
    members.forEach(m => {
      m.email = m.email.toLowerCase().trim(); // Normalize email
      uniqueMembersMap[m.email] = m; // Last one wins if duplicates
    });
    const uniqueMembers = Object.values(uniqueMembersMap);

    // 2. Pre-fetch Data
    const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${user.tenant_id}`);
    const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

    const memberEmails = uniqueMembers.map(m => m.email);
    // fetch existing users for the provided emails
    const existingUsers = await UserModelHandler.getUsersByWhere({
      email: memberEmails
    });
    // fetch existing mappings to avoid duplicates
    let existingUserWorkspaceMembers = [];

    if (existingUsers.length > 0) {
      existingUserWorkspaceMembers = await UserWorkspaceMappingModelHandler.getWorkspaceMembers({
        workspace_id: workspace.id,
        user_id: existingUsers.map(u => u.id),
        is_deleted: false
      });
    }

    const invited = [];
    const failed = [];
    const userWorkspaceMappingsToCreate = [];
    const emailsToSend = [];
    const currentDate = new Date().toISOString();

    // 3. Process Members in Parallel (Safe for batch of 10 with unique emails)
    await Promise.all(uniqueMembers.map(async(member) => {
      try {
        const { email, name, role } = member;
        let firstTimeInvite = false;
        let targetUser = existingUsers.find(u => u.email === email);
        let isMemberAssociated = false;
        // Create user if missing
        if (targetUser) {
          // Check for existing mapping
          const hasMapping = existingUserWorkspaceMembers.some(m => m.user_id === targetUser.id);
          if (hasMapping) {
            if (member.re_invite) {
              await UserWorkspaceMappingModelHandler.updateWorkspaceMember({
                role: role || WORKSPACE_USER_ROLE.MEMBER,
                status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING,
                invited_by: user.id,
                invited_at: currentDate,
                is_active: false
              }, {
                workspace_id: workspace.id,
                user_id: targetUser.id,
              });
              isMemberAssociated = true;
            } else {
              failed.push({ email, reason: 'User already associated with workspace' });
              return;
            }
          }
        } else {
          targetUser = await UserModelHandler.createUser({
            partner_id: user.tenant_id,
            email,
            name,
            password: crypto.randomUUID(), // Secure random string
            status: USER_STATUS.INVITED,
            is_first_invite: true
          });
          firstTimeInvite = true;
        }

        // Prepare Bulk Data
        if (!isMemberAssociated) {
          userWorkspaceMappingsToCreate.push({
            workspace_id: workspace.id,
            user_id: targetUser.id,
            role: role || WORKSPACE_USER_ROLE.MEMBER,
            status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING,
            invited_by: user.id,
            invited_at: currentDate,
            is_active: false
          });
        }

        const token = StringHelper.encodeToken({ partner_id: user.tenant_id, user_id: targetUser.id, workspace_id: workspace.id });

        emailsToSend.push({
          partnerId: user.tenant_id,
          type: firstTimeInvite ? EMAIL_TEMPLATE_NAME.INVITE_NEW_TEAM_MEMBER : EMAIL_TEMPLATE_NAME.INVITE_EXISTING_TEAM_MEMBER,
          to: targetUser.email,
          data: {
            workspace_name: workspace.name,
            workspace_slug: workspace.slug,
            inviter_name: user.name || user.email,
            invite_expiry_days: 7,
            token,
            ...parsedPartnerEmailDetails
          }
        });

        invited.push({ email, status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING });

      } catch (err) {
        logger.error(`Individual invite failed for ${member.email}: ${err.message}`);
        failed.push({ email: member.email, reason: 'Internal processing error' });
      }
    }));

    // 4. Execute Bulk Operations
    if (userWorkspaceMappingsToCreate.length > 0) {
      await UserWorkspaceMappingModelHandler.bulkCreateUserToWorkspace(userWorkspaceMappingsToCreate);

      // Sending emails in parallel is efficient for small batches
      await Promise.allSettled(emailsToSend.map(emailData => MailerInstance.sendMail(emailData)));
    }

    return res.status(StatusCodes.OK).send({
      message: 'Invitation process completed',
      data: { invited, failed }
    });

  } catch (err) {
    logger.error(`Critical error in inviteWorkspaceMembers: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};

export const resendInvitation = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const MailerInstance = Container.get('MailerInstance');
  const redisClient = Container.get('redisClient');
  const StringHelper = Container.get('StringHelper');

  try {
    const workspaceId = req.workspace?.id;
    const userId = req.params.user_id;
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
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to invite members' });
    }

    // 2. Pre-fetch Data
    const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${user.tenant_id}`);
    const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

    const [ userWorkspaceMappings ] = await UserWorkspaceMappingModelHandler.getWorkspaceMemberDetails(workspace.id, {
      userId,
      status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_PENDING
    });

    if (!userWorkspaceMappings) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'User with status "invitation_pending" does not exists',
      });
    }

    // check if the resend is atleast 5 mins time before reinvite
    const invitedAt = new Date(userWorkspaceMappings.invited_at);
    const now = new Date();

    const diffInMs = now - invitedAt;
    const diffInMinutes = diffInMs / (1000 * 60);

    // check if resend is triggered within 5 mins
    if (diffInMinutes < 5) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Resend invitation can only be triggered after 5 minutes',
      });
    }

    const emailTemplateData = {
      partnerId: user.tenant_id,
      type: userWorkspaceMappings.is_first_invite ? EMAIL_TEMPLATE_NAME.INVITE_NEW_TEAM_MEMBER : EMAIL_TEMPLATE_NAME.INVITE_EXISTING_TEAM_MEMBER,
      to: userWorkspaceMappings.email,
      data: {
        workspace_name: workspace.name,
        workspace_slug: workspace.slug,
        inviter_name: user.name || user.email,
        invite_expiry_days: 7,
        token: StringHelper.encodeToken({ partner_id: user.tenant_id, user_id: userWorkspaceMappings.user_id, workspace_id: workspace.id }),
        ...parsedPartnerEmailDetails
      }
    };

    await Promise.all([
      MailerInstance.sendMail(emailTemplateData),
      UserWorkspaceMappingModelHandler.updateWorkspaceMember({
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        is_active: false
      }, {
        workspace_id: workspace.id,
        user_id: userWorkspaceMappings.user_id,
      })
    ]);

    return res.status(StatusCodes.OK).send({
      message: 'Invitation sent successfully'
    });

  } catch (err) {
    logger.error(`Critical error in resendInvitation: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
