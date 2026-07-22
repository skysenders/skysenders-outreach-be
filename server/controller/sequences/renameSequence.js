import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
RENAME SEQUENCE
*/
export const renameSequence = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');

  const workspaceId = req.workspace.id;

  const { id } = req.params;
  const { name } = req.body;

  try {
    const whereClause = {
      id,
      workspace_id: workspaceId
    };

    // Verify if sequence exists before attempting rename
    const sequenceExists = await SequencesModelHandler.getSequenceByWhere(whereClause);

    if (!sequenceExists) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sequence not found'
      });
    }

    const updatedSequence = await SequencesModelHandler.updateSequence(
      { name, updated_at: new Date() },
      whereClause
    );

    return res.status(StatusCodes.OK).send(updatedSequence);

  } catch (error) {
    logger.error(`Error renaming sequence: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
