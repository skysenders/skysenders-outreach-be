import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { db } from '../../db/index';

/*
UPDATE SENDING SCHEDULE
*/
export const updateSendingSchedule = async(req, res) => {
  const logger = Container.get('logger');

  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');
  const SendingScheduleWindowsModelHandler = Container.get('SendingScheduleWindowsModelHandler');

  const workspaceId = req.workspace.id;

  const scheduleId = Number(req.params.id);

  const {
    name,
    timezone,
    use_contact_timezone: useContactTimezone = false,
    skip_holidays: skipHolidays = false,
    holiday_country_code: holidayCountryCode,
    is_active: isActive = true,
    windows = []
  } = req.body;

  const transaction = await db.sequelize.transaction();

  try {

    const existingSchedule = await SendingSchedulesModelHandler.getScheduleByWhere({
      id: scheduleId,
      workspace_id: workspaceId,
      deleted_at: null
    });

    if (!existingSchedule) {
      await transaction.rollback();

      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Sending schedule not found'
      });
    }

    const updatedSchedule = await SendingSchedulesModelHandler.updateSchedule(
      {
        name,
        timezone,
        use_contact_timezone: useContactTimezone,
        skip_holidays: skipHolidays,
        holiday_country_code: skipHolidays
          ? holidayCountryCode
          : null,
        is_active: isActive,
        updated_at: new Date()
      },
      {
        id: scheduleId,
        workspace_id: workspaceId
      },
      transaction
    );

    await SendingScheduleWindowsModelHandler.deleteWindows(
      {
        schedule_id: scheduleId
      },
      transaction
    );

    if (windows.length) {
      // sort the windows by day_of_week and start_time before creating to maintain consistency
      windows.sort((a, b) => {
        if (a.day_of_week === b.day_of_week) {
          return a.start_time.localeCompare(b.start_time);
        }
        return a.day_of_week - b.day_of_week;
      });

      await SendingScheduleWindowsModelHandler.bulkCreateWindows(
        windows.map((window, index) => ({
          id: index + 1,
          schedule_id: scheduleId,
          day_of_week: window.day_of_week,
          start_time: window.start_time,
          end_time: window.end_time,
          created_at: new Date()
        })),
        transaction
      );
    }

    await transaction.commit();

    return res.status(StatusCodes.OK).send({
      message: 'Sending schedule updated successfully',
      data: {
        ...updatedSchedule.toJSON?.() || updatedSchedule,
        windows
      }
    });

  } catch (error) {
    await transaction.rollback();

    logger.error(`Error updating sending schedule: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
