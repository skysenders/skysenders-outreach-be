import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
GET SENDING SCHEDULE BY ID
*/
export const getSendingScheduleById = async(req, res) => {
  const logger = Container.get('logger');

  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');

  const workspaceId = req.workspace.id;
  const scheduleId = Number(req.params.id);

  try {

    const schedule = await SendingSchedulesModelHandler.getScheduleWithWindowsById({
      id: scheduleId,
      workspace_id: workspaceId,
      deleted_at: null
    });

    if (!schedule) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sending schedule not found'
      });
    }

    return res.status(StatusCodes.OK).send(schedule);

  } catch (error) {
    logger.error(`Error fetching sending schedule: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
