import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET DOMAIN BY ID
*/
export const getDomainById = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;

  const { id } = req.params;

  try {

    const domain = await DomainsModelHandler.getDomainByWhere({
      id,
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

/*
GET DOMAIN DNS AUTH RESULT BY ID
*/
export const getDomainDnsAuthResultById = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;

  const { id } = req.params;

  try {

    const domain = await DomainsModelHandler.getDomainWithAttribute({
      id,
      workspace_id: workspaceId,
    }, [
      'id',
      'domain_name',
      'spf_pass',
      'dmarc_pass',
      'dkim_pass',
      'mx_pass',
      'tracking_domain_pass',
      'dns_last_checked_at',
      'dns_errors',
      'dns_value',
    ]);

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
