import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
UPDATE LIST
*/
export const updateList = async(req, res) => {
  const logger = Container.get('logger');

  const ListsModelHandler = Container.get('ListsModelHandler');
  const workspaceId = req.workspace.id;

  try {

    const { id } = req.params;
    const { name, description } = req.body;

    const list = await ListsModelHandler.getListByWhere({
      id,
      workspace_id: workspaceId
    });

    if (!list) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'List not found'
      });
    }

    const updatedList = await ListsModelHandler.updateList(
      {
        name,
        description
      },
      {
        id,
        workspace_id: workspaceId
      }
    );

    return res.status(StatusCodes.OK).send(updatedList);

  } catch (error) {

    logger.error(`Error updating list: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
