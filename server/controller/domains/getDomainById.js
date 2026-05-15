import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET DOMAIN BY ID
*/
export const getDomainById = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace not found in request');

    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace not found.'
    });
  }

  const { id } = req.params;

  try {

    const domain = await DomainsModelHandler.getDomainByWhere({
      id,
      partner_id: partnerId,
      workspace_id: workspaceId,
    });

    if (!domain) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Domain not found'
      });
    }

    return res.status(StatusCodes.OK).send(domain);

  } catch (error) {
    logger.error(`Error fetching domain by id: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
