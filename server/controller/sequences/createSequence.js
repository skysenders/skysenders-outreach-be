import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
CREATE SEQUENCE
*/
export const createSequence = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;

  const { name } = req.body;

  try {
    const payload = {
      partner_id: partnerId,
      workspace_id: workspaceId,
      name,
      status: 'DRAFTED',
      total_no_of_seq: 0,
      total_no_contacts: 0,
      current_seq_no: 0,
      total_no_days: 0
    };

    const newSequence = await SequencesModelHandler.createSequence(payload);

    return res.status(StatusCodes.CREATED).send(newSequence);

  } catch (error) {
    logger.error(`Error creating sequence: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
