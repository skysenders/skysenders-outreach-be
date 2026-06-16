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
      emails = [],
      suppression_type: suppressionType,
      search_text: searchText
    } = req.body;

    if ((!Array.isArray(emails) || emails.length === 0) && !searchText) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Emails or search text are required'
      });
    }

    // throw error if both emails and searchText are provided to avoid ambiguity
    if (Array.isArray(emails) && emails.length > 0 && searchText) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Provide either emails or search text, not both'
      });
    }

    // 1. Build where clause
    const whereClause = {
      workspace_id: workspaceId,
    };

    // Normalize + dedupe
    if (emails.length > 0) {
      const normalizedEmails = [
        ...new Set(
          emails
            .map(e => e?.trim()?.toLowerCase())
            .filter(Boolean)
        )
      ];
      whereClause.email = {
        [Op.in]: normalizedEmails
      };
    }

    if (suppressionType) {
      whereClause.suppression_type = suppressionType;
    }

    if (searchText) {
      whereClause.email = {
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
