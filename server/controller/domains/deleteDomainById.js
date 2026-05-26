import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { Op } from 'sequelize';

/*
DELETE DOMAIN BY ID
*/
export const deleteDomainById = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');

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

    await DomainsModelHandler.softDeleteDomain({
      id,
      workspace_id: workspaceId,
      partner_id: partnerId
    });

    // soft delete domain mailboxes
    await MailboxesModelHandler.deleteDomain({ partner_id: partnerId, workspace_id: workspaceId, domain_id: id });

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

// Delete all mailboxes
export const bulkDeleteDomains = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  if (!workspaceId) {
    logger.warn('Workspace ID not found in request');
    return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID not found.' });
  }

  try {

    const {
      domain_ids: domainIds,
      search_text: searchText,
      provider,
    } = req.body || {};

    let isFilterProvided = false;
    const where = { partner_id: partnerId, workspace_id: workspaceId };

    // if domainIds are provided, filter by those IDs
    if (domainIds && Array.isArray(domainIds) && domainIds.length > 0) {
      where.id = domainIds;
      isFilterProvided = true;
    }
    // if searchText is provided, filter by email or name containing the searchText
    if (searchText) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${searchText}%` } },
        { name: { [Op.iLike]: `%${searchText}%` } }
      ];
      isFilterProvided = true;
    }
    // if provider is provided, filter by provider
    if (provider) {
      where.provider = provider;
      isFilterProvided = true;
    }

    if (!isFilterProvided) {
      logger.warn('No filter provided for bulk delete');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one filter must be provided for bulk delete.' });
    }

    // bulk delete domains
    const deletedDomains = await DomainsModelHandler.deleteDomain(where);

    return res.status(StatusCodes.OK).send({
      message: `${deletedDomains ? deletedDomains.length : 0} domains deleted successfully.`,
      deleted_domains: deletedDomains
    });
  } catch (error) {

    logger.error(`Error updating domains: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};

