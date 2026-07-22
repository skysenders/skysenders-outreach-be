import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET SEQUENCE BY ID
*/
export const getSequenceById = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');

  const workspaceId = req.workspace.id;
  const { id } = req.params;

  try {
    const whereClause = {
      id,
      workspace_id: workspaceId
    };

    const sequence = await SequencesModelHandler.getSequenceByWhere(whereClause);

    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sequence not found'
      });
    }

    return res.status(StatusCodes.OK).send(sequence);

  } catch (error) {
    logger.error(`Error fetching sequence by ID: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
