import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
LIST SENDING SCHEDULES
*/
export const listSendingSchedules = async(req, res) => {
  const logger = Container.get('logger');

  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText,
    is_active: isActive,
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const filters = {
      workspace_id: workspaceId,
      search_text: searchText,
      is_active: isActive,
      offset,
      limit
    };

    const [schedules, count] = await Promise.all([
      SendingSchedulesModelHandler.getAllSchedules(filters),
      SendingSchedulesModelHandler.countSchedules(filters)
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: schedules
    });

  } catch (error) {
    logger.error(`Error listing sending schedules: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
