import { Container } from 'typedi';
import { WORKSPACE_USER_ROLE, WORKSPACE_USER_ROLE_PERMISSION, WORKSPACE_USER_MAPPING_STATUS } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';

export const createWorkspace = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const UserWorkspaceMappingModelHandler = Container.get('UserWorkspaceMappingModelHandler');

  try {
    const {
      name,
      slug,
      logo_url: logoUrl,
      timezone = 'UTC',
      team_size: teamSize,
      goals = []
    } = req.body;

    const user = req.user;

    // slug normalization
    const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // check duplicate slug under same partner
    const existing = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: user.partner_id,
      slug: normalizedSlug
    });

    if (existing) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace slug already exists' });
    }

    // create workspace
    const workspace = await WorkspaceModelHandler.createWorkspace({
      name,
      slug: normalizedSlug,
      partner_id: user.partner_id,
      owner_user_id: user.id,
      logo_url: logoUrl,
      timezone,
      team_size: teamSize,
      goals
    });

    // assign owner as super_admin
    await UserWorkspaceMappingModelHandler.createUserWorkspaceMapping({
      workspace_id: workspace.id,
      user_id: user.id,
      role: WORKSPACE_USER_ROLE.SUPER_ADMIN,
      permission: WORKSPACE_USER_ROLE_PERMISSION.ADMIN,
      status: WORKSPACE_USER_MAPPING_STATUS.INVITATION_ACCEPTED,
      is_active: true
    });

    return res.status(StatusCodes.CREATED).send(workspace);

  } catch (err) {
    logger.error(`Error creating workspace: ${err.message}`);
    throw err;
  }
};
