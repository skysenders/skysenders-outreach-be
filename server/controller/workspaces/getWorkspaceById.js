import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const getWorkspaceById = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.workspace?.id;
    const user = req.user;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Workspace ID is missing in request header'
      });
    }

    // check if the user has access to workspace or not via cache
    const hasAccess = await WorkspaceRedisCacheHelper.hasWorkspaceAccess({
      userId: user.id,
      workspaceId: workspaceId
    });

    if (!hasAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'You are not authorized to access this workspace'
      });
    }

    // check workspace exists under partner
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: user.tenant_id,
      id: workspaceId,
    });

    if (!workspace) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Workspace not found'
      });
    }

    return res.status(StatusCodes.OK).send(workspace);

  } catch (err) {
    logger.error(`Error fetching workspace: ${err.message}`);
    throw err;
  }
};

export const getWorkspaceBySlug = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const PartnerCacheHelper = Container.get('PartnerCacheHelper');

  try {
    // get the partner id from the origin
    const partnerId = await PartnerCacheHelper.getPartnerIdFromOrigin(req.origin);

    // get workspace slug from req params
    const workspaceSlug = req.query.slug;

    // slug normalization
    const normalizedSlug = workspaceSlug.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');


    // check duplicate slug under same partner
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: partnerId,
      slug: normalizedSlug
    });

    if (!workspace) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Workspace not found'
      });
    }

    return res.status(StatusCodes.OK).send(workspace);

  } catch (err) {
    logger.error(`Error fetching workspace: ${err.message}`);
    throw err;
  }
};
