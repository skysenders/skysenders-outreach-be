import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
DELETE DOMAIN BY ID
*/
export const deleteDomainById = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  const { id } = req.params;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({
      message: 'Workspace ID not found.'
    });
  }

  try {

    const domain = await DomainsModelHandler.getDomainByWhere({
      id,
      workspace_id: workspaceId,
      partner_id: partnerId
    });

    if (!domain) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Domain not found'
      });
    }

    const deleted = await DomainsModelHandler.deleteDomain({
      id,
      workspace_id: workspaceId,
      partner_id: partnerId
    });

    if (!deleted) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: 'Failed to delete domain'
      });
    }

    return res.status(StatusCodes.OK).send({
      success: true,
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    logger.error(`Error deleting domain: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
