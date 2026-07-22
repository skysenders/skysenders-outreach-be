import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { Op } from 'sequelize';
import { SEQUENCE_STATUS } from '../../config/constants';

/*
LIST SEQUENCES
*/
export const listSequences = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText = '',
    status,
    offset = 0,
    limit = 20
  } = req.query;

  try {
    const whereClause = {
      workspace_id: workspaceId,
      deleted_at: null
    };

    if (searchText) {
      whereClause.name = { [Op.iLike]: `%${searchText}%` };
    }

    if (status) {
      whereClause.status = status;
      if (status === SEQUENCE_STATUS.ARCHIVED) {
        delete whereClause.deleted_at;
      }
    }

    const [sequences, count] = await Promise.all([
      SequencesModelHandler.getAllSequencesByWhere(whereClause, offset, limit),
      SequencesModelHandler.countSequencesByWhere(whereClause)
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: sequences
    });

  } catch (error) {
    logger.error(`Error listing sequences: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
