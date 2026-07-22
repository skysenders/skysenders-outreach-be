import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { SEQUENCE_STATUS } from '../../config/constants';

/*
PAUSE SEQUENCE
*/
export const pauseSequence = async(req, res) => {
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

    // before update jsut cross check the sequence status, only active or auto pause sequence can be paused, else throw error
    if (![SEQUENCE_STATUS.ACTIVE, SEQUENCE_STATUS.AUTO_PAUSED, SEQUENCE_STATUS.PAUSED_SUB_FAILED].includes(sequence.status)) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Sequence cannot be paused as it is currently in '${sequence.status}' status. Only sequences with 'ACTIVE' or 'AUTO_PAUSED' status can be paused.`
      });
    }

    const updatedSequence = await SequencesModelHandler.updateSequence(
      {
        status: SEQUENCE_STATUS.PAUSED,
        updated_at: new Date()
      },
      whereClause
    );

    return res.status(StatusCodes.OK).send(updatedSequence);

  } catch (error) {
    logger.error(`Error pausing sequence: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
