import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET SEQUENCE SETTINGS BY SEQUENCE ID
*/
export const getSequenceSettings = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqSettingsModelHandler = Container.get('SeqSettingsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  try {
    // 1. Verify parent sequence scope identity within workspace
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Fetch associated seq_settings record
    const settings = await SeqSettingsModelHandler.getSeqSettingByWhere({ seq_id: seqId });

    if (!settings) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence settings not found' });
    }

    return res.status(StatusCodes.OK).send(settings);

  } catch (error) {
    logger.error(`Failed to fetch settings for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
