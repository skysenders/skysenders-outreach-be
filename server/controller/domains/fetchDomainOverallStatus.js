import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const fetchDomainOverallStatus = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  try {
    const result = await DomainsModelHandler.getDomainOverallStatus(partnerId, workspaceId);

    return res.status(StatusCodes.OK).send(result);
  } catch (error) {

    logger.error(`Error fetching overall domain status: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
