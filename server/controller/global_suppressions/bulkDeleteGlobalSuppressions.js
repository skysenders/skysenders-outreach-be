import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { Op } from 'sequelize';

/*
BULK DELETE GLOBAL SUPPRESSIONS
*/
export const bulkDeleteGlobalSuppressions = async(req, res) => {
  const logger = Container.get('logger');
  const GlobalSuppressionsModelHandler = Container.get('GlobalSuppressionsModelHandler');

  const workspaceId = req.workspace.id;

  try {
    let {
      ids,
      suppression_type: suppressionType,
      search_text: searchText,
      select_all: selectAll
    } = req.body;

    // 1. Build where clause
    const whereClause = {
      workspace_id: workspaceId,
    };

    let isFilterProvided = false;

    if (ids && ids.length > 0) {
      whereClause.id = ids;
      isFilterProvided = true;
    }

    if (suppressionType) {
      whereClause.suppression_type = suppressionType;
      isFilterProvided = true;
    }

    if (searchText) {
      whereClause.value = {
        [Op.iLike]: `%${searchText}%`
      };
      isFilterProvided = true;
    }

    if (!isFilterProvided && !selectAll) {
      logger.warn('No filter provided for bulk delete');
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'At least one filter or select_all must be provided for bulk delete.' });
    }

    // 3. Delete in single query
    const deletedCount = await GlobalSuppressionsModelHandler.deleteGlobalSuppression(
      whereClause
    );

    return res.status(StatusCodes.OK).send({
      deleted: deletedCount
    });

  } catch (error) {
    logger.error(`Error bulk deleting suppressions: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
