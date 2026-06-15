import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const fetchDomainOverallStatus = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;

  try {
    const result = await DomainsModelHandler.getDomainOverallStatus(workspaceId);

    return res.status(StatusCodes.OK).send(result);
  } catch (error) {

    logger.error(`Error fetching overall domain status: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
