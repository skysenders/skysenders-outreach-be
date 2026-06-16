import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { db } from '../../db/index';

/*
CREATE SENDING SCHEDULE
*/
export const createSendingSchedule = async(req, res) => {
  const logger = Container.get('logger');

  const SendingSchedulesModelHandler = Container.get('SendingSchedulesModelHandler');
  const SendingScheduleWindowsModelHandler = Container.get('SendingScheduleWindowsModelHandler');

  const workspaceId = req.workspace.id;
  const partnerId = req.user.tenant_id;
  const userId = req.user.id;

  const {
    name,
    timezone,
    use_contact_timezone: useContactTimezone = false,
    skip_holidays: skipHolidays = false,
    holiday_country_code: holidayCountryCode,
    is_active: isActive = true,
    windows
  } = req.body;

  const transaction = await db.sequelize.transaction();

  try {

    const schedule = await SendingSchedulesModelHandler.createSchedule(
      {
        partner_id: partnerId,
        workspace_id: workspaceId,
        name,
        timezone,
        use_contact_timezone: useContactTimezone,
        skip_holidays: skipHolidays,
        holiday_country_code: skipHolidays
          ? holidayCountryCode
          : null,
        is_active: isActive,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      },
      transaction
    );

    // before creating the windows, just order them by day_of_week and start_time to maintain consistency
    windows.sort((a, b) => {
      if (a.day_of_week === b.day_of_week) {
        return a.start_time.localeCompare(b.start_time);
      }
      return a.day_of_week - b.day_of_week;
    });

    await SendingScheduleWindowsModelHandler.bulkCreateWindows(
      windows.map((window, index) => ({
        id: index + 1,
        schedule_id: schedule.id,
        day_of_week: window.day_of_week,
        start_time: window.start_time,
        end_time: window.end_time,
        created_at: new Date()
      })),
      transaction
    );

    await transaction.commit();

    return res.status(StatusCodes.CREATED).send({
      ...schedule.toJSON(),
      windows
    });

  } catch (error) {
    await transaction.rollback();

    logger.error(`Error creating sending schedule: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
