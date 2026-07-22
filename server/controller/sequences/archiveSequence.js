import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
ARCHIVE SEQUENCE
*/
export const archiveSequence = async(req, res) => {
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

    // Leverages the softDelete function built into your model handlers
    const archivedData = await SequencesModelHandler.softDeleteSequence(whereClause);

    return res.status(StatusCodes.OK).send(archivedData);

  } catch (error) {
    logger.error(`Error archiving sequence: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
