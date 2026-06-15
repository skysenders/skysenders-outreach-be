import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
UPDATE DOMAIN DETAILS
*/
export const updateDomainDetails = async(req, res) => {
  const logger = Container.get('logger');
  const DomainsModelHandler = Container.get('DomainsModelHandler');

  const workspaceId = req.workspace.id;

  const { id } = req.params;

  try {

    const updateColumns = {};

    if (req.body.tracking_domain_url) {
      updateColumns.tracking_domain_url = req.body.tracking_domain_url;
    }

    if (req.body.dkim_selector) {
      updateColumns.dkim_selector = req.body.dkim_selector;
    }

    if (Object.keys(updateColumns).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'No valid fields to update.'
      });
    }

    const updated = await DomainsModelHandler.updateDomain(
      updateColumns,
      {
        id,
        workspace_id: workspaceId
      }
    );

    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Domain not found'
      });
    }

    return res.status(StatusCodes.OK).send(updated);

  } catch (error) {
    logger.error(`Error updating domain details: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
