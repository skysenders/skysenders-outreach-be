import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
DELETE SENDING SCHEDULE
*/
export const deleteSendingSchedule = async(req, res) => {
  const logger = Container.get('logger');

  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');

  const workspaceId = req.workspace.id;
  const scheduleId = Number(req.params.id);

  try {

    const existingSchedule = await SendingSchedulesModelHandler.getScheduleByWhere({
      id: scheduleId,
      workspace_id: workspaceId,
      deleted_at: null
    });

    if (!existingSchedule) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sending schedule not found'
      });
    }

    // Hard delete (windows will be cascade deleted)
    await SendingSchedulesModelHandler.deleteSchedule({
      id: scheduleId,
      workspace_id: workspaceId
    });

    return res.status(StatusCodes.OK).send({
      message: 'Sending schedule deleted successfully'
    });

  } catch (error) {
    logger.error(`Error deleting sending schedule: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
