import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
LIST GLOBAL SUPPRESSIONS
*/
export const listGlobalSuppressions = async(req, res) => {
  const logger = Container.get('logger');
  const GlobalSuppressionsModelHandler = Container.get('GlobalSuppressionsModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText = '',
    suppression_type: suppressionType = null,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const whereClause = {
      workspace_id: workspaceId
    };

    const [suppressions, count] = await Promise.all([
      GlobalSuppressionsModelHandler.getAllGlobalSuppressionsByWhere(
        whereClause,
        offset,
        limit,
        searchText,
        suppressionType
      ),
      GlobalSuppressionsModelHandler.countGlobalSuppressionsByWhere(
        whereClause,
        searchText,
        suppressionType
      )
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: suppressions
    });

  } catch (error) {
    logger.error(`Error listing global suppressions: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
