import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { Op } from 'sequelize';

/*
LIST DOMAINS
*/
export const listDomains = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;
  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  const {
    search_text: searchText = '',
    provider,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const whereClause = {
      partner_id: req.user.tenant_id,
      workspace_id: workspaceId,
    };

    if (searchText) {
      whereClause.domain_name = { [Op.iLike]: `%${searchText}%` };
    }

    if (provider) {
      whereClause.provider = provider;
    }

    const [domains, count] = await Promise.all([
      DomainsModelHandler.getAllDomainsByWhere(whereClause, offset, limit),
      DomainsModelHandler.countDomainsByWhere(whereClause)
    ]);

    return res.status(StatusCodes.OK).send({ count, offset, limit, has_next: offset + limit < count, has_prev: offset > 0, data: domains });

  } catch (error) {
    logger.error(`Error listing domains: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
