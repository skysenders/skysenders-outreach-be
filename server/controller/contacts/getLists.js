import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import Container from 'typedi';

/*
LIST LISTS
*/
export const getLists = async(req, res) => {
  const logger = Container.get('logger');

  const ListsModelHandler = Container.get('ListsModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const where = {
      workspace_id: workspaceId,
      deleted_at: null
    };

    if (searchText) {
      where.name = {
        [Op.iLike]: `%${searchText.trim()}%`
      };
    }

    const [lists, count] = await Promise.all([
      ListsModelHandler.getAllListsByWhere(
        where,
        offset,
        limit
      ),
      ListsModelHandler.countListsByWhere(where)
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: lists
    });

  } catch (error) {

    logger.error(`Error fetching lists: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};

export const getListById = async(req, res) => {
  const logger = Container.get('logger');

  const ListsModelHandler = Container.get('ListsModelHandler');

  const workspaceId = req.workspace.id;
  const listId = req.params.id;

  try {

    const list = await ListsModelHandler.getListByWhere({
      id: listId,
      workspace_id: workspaceId
    });

    if (!list) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'List not found'
      });
    }

    return res.status(StatusCodes.OK).send(list);

  } catch (error) {

    logger.error(`Error fetching list by id: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
