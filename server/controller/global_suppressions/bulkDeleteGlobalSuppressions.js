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
      suppression_type: suppressionType,
      search_text: searchText
    } = req.body;

    // 1. Build where clause
    const whereClause = {
      workspace_id: workspaceId,
    };

    if (suppressionType) {
      whereClause.suppression_type = suppressionType;
    }

    if (searchText) {
      whereClause.value = {
        [Op.iLike]: `%${searchText}%`
      };
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
