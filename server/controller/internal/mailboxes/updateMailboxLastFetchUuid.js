import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { db } from '../../../db';
import { AUTH_TOKEN } from '../../../config/constants';

export const updateMailboxLastFetchUuid = async(req, res) => {
  const logger = Container.get('logger');

  try {
    // 1. Security Check
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return res.status(StatusCodes.UNAUTHORIZED).send({
        message: 'Unauthorized access.'
      });
    }

    const { partner_id: partnerId, workspace_id: workspaceId, mailbox_id: mailboxId } = req.body;

    if (!partnerId || !mailboxId || !workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Invalid payload: partner_id, workspace_id, and mailbox_id are required'
      });
    }

    // 2. Build Dynamic Query safely
    const updates = [];
    const bindValues = [];

    const addField = (key, value) => {
      // eslint-disable-next-line no-undefined
      if (value !== undefined) {
        bindValues.push(value);
        updates.push(`${key} = $${bindValues.length}`);
      }
    };

    addField('last_tracking_details', req.body.last_tracking_details);
    addField('last_checked_at', req.body.last_checked_at);
    addField('sync_status', req.body.sync_status);
    addField('error_message', req.body.error_message);

    if (updates.length === 0) {
      return res.status(StatusCodes.OK).send({ message: 'Nothing to update' });
    }

    // Add identifiers to bind values for the WHERE clause
    bindValues.push(partnerId);
    bindValues.push(workspaceId);
    bindValues.push(mailboxId);

    const partnerIdPos = bindValues.length - 2;
    const workspaceIdPos = bindValues.length - 1;
    const mailboxIdPos = bindValues.length;

    const queryString = `
      UPDATE mailboxes_sync_state 
      SET ${updates.join(', ')} 
      WHERE partner_id = $${partnerIdPos} AND workspace_id = $${workspaceIdPos} AND mailbox_id = $${mailboxIdPos}
    `;

    // 3. Execute (Awaiting ensures the DB actually registers the change)
    await db.sequelize.query(queryString, { bind: bindValues });

    return res.status(StatusCodes.OK).send({
      message: 'Mailbox sync state updated successfully'
    });

  } catch (error) {
    logger.error(`Error updating mailbox UUID: ${error.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: 'Internal Server Error',
    });
  }
};
