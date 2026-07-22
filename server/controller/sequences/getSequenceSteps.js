import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET SEQUENCE STEPS WITH VARIANTS, BRANCHES AND A/B TESTS
*/
export const getSequenceSteps = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqStepsModelHandler = Container.get('SeqStepsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  try {
    // 1. Verify parent sequence scope identity within workspace
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Fetch the complete step hierarchy with variants, A/B test configs, and nested branches
    const stepTree = await SeqStepsModelHandler.getFullSeqStepTreeBySeqId(seqId);

    return res.status(StatusCodes.OK).send(stepTree);

  } catch (error) {
    logger.error(`Failed to fetch steps tree for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
