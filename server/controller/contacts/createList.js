import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
CREATE LIST
*/
export const createList = async(req, res) => {
  const logger = Container.get('logger');

  const ListsModelHandler = Container.get('ListsModelHandler');

  const workspaceId = req.workspace.id;

  try {

    const { name, description } = req.body;
    const list = await ListsModelHandler.createList({
      name,
      description,
      partner_id: req.user.tenant_id,
      workspace_id: workspaceId,
      custom_fields_map: {},
      created_by: req.user.id
    });

    return res.status(StatusCodes.CREATED).send(list);

  } catch (error) {

    logger.error(`Error creating list: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
