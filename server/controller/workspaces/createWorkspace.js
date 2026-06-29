import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const createWorkspace = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

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
      partner_id: user.tenant_id,
      slug: normalizedSlug
    });

    if (existing) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace slug already exists' });
    }

    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to create workspace' });
    }

    // create workspace
    const workspace = await WorkspaceModelHandler.createWorkspace({
      name,
      slug: normalizedSlug,
      partner_id: user.tenant_id,
      account_id: user.account_id,
      logo_url: logoUrl,
      timezone,
      team_size: teamSize,
      goals
    });

    // add workspace to account's workspace list in redis
    await AccountWorkspaceRedisCacheHelper.addAccountWorkspace({
      accountId: user.account_id,
      workspaceId: workspace.id
    });

    return res.status(StatusCodes.CREATED).send(workspace);
  } catch (err) {
    logger.error(`Error creating workspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Error while creating workspace - ${err.message}` });
  }
};

export const createWorkspaceByPartner = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const PartnerKeyHelper = Container.get('PartnerKeyHelper');

  try {

    // encode the token to handle special characters in the token
    const decodedToken = PartnerKeyHelper.validatePartnerToken(req.headers['x-partner-key']);

    // throw error if token does not have partner_id
    if (!decodedToken.partner_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid partner key' });
    }

    const partnerId = decodedToken.partner_id;

    const {
      name,
      slug,
      logo_url: logoUrl,
      timezone = 'UTC',
      team_size: teamSize,
      goals = []
    } = req.body;

    // slug normalization
    const normalizedSlug = slug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // check duplicate slug under same partner
    const existing = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: partnerId,
      slug: normalizedSlug
    });

    if (existing) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace slug already exists' });
    }

    // create workspace
    const workspace = await WorkspaceModelHandler.createWorkspace({
      name,
      slug: normalizedSlug,
      partner_id: partnerId,
      account_id: req.query.account_id,
      logo_url: logoUrl,
      timezone,
      team_size: teamSize,
      goals
    });

    return res.status(StatusCodes.CREATED).send(workspace);
  } catch (err) {
    logger.error(`Error creating workspace by partner: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Error while creating workspace for partner - ${err.message}` });
  }
};
