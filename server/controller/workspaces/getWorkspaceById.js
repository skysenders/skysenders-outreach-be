import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

export const getWorkspaceById = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const workspaceId = req.params.id;
    const user = req.user;

    const hasAccountAccess = await AccountWorkspaceRedisCacheHelper.hasAccountUser({
      accountId: req.user.account_id,
      userId: req.user.id
    });

    if (!hasAccountAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to access this workspace' });
    }

    // check workspace exists under account
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      account_id: user.account_id,
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};

export const getWorkspaceByCustomDomainUrl = async(req, res) => {
  const logger = Container.get('logger');

  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

  try {
    // get workspace custom domain url from req params
    const customDomainUrl = req.query.custom_domain_url;

    // check if workspace exists with the custom domain url
    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      custom_domain_url: customDomainUrl
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
