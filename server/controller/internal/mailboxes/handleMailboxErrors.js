import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { db } from '../../../db';
import { QueryTypes } from 'sequelize';
import { addMailboxToPoolWithDelay } from './../../../utils/redis-handler/redis-warmup-pool-cache';
import { AUTH_TOKEN } from '../../../config/constants';

export const handleMailboxForwardingErrors = async(req, res) => {
  const logger = Container.get('logger');
  let isReplySent = false;
  try {

    // validate auth token
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return res.status(StatusCodes.OK).send({
        message: 'Fetching eligible warmup mailboxes failed | Auth validation failed.'
      });
    }

    const { error_message: blockReason, partner_id: partnerId, mailbox_id: mailboxId } = req.body;

    if (!partnerId || !mailboxId) {
      throw new Error('Invalid payload: partner_id or mailbox_id missing');
    }
    // sent ressponse and process the request
    res.status(StatusCodes.OK).send({
      message: 'Mailbox forwarding failure issue handled successfully'
    });
    isReplySent = true;


    // update mailbox_warmup_details mark status as BLOCKED and the block_reason
    await db.warmupSequelize.query(
      `UPDATE public.mailbox_warmup_details SET status = 'BLOCKED', block_stage = null,
       block_reason = :blockReason WHERE partner_id = :partnerId AND mailbox_id = :mailboxId`,
      {
        replacements: { blockReason: blockReason || null, partnerId, mailboxId },
        type: QueryTypes.UPDATE
      }
    );

  } catch (error) {
    logger.error(`Error occurred while updating mailbox warmup error forwarding issue: ${error.message}`);
    if (!isReplySent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: `Server error: ${error.message}`,
      });
    }
  }
};

export const handleSenderFailureErrors = async(req, res) => {
  const logger = Container.get('logger');
  const DomainMailboxesHandler = Container.get('DomainMailboxesHandler');
  let isReplySent = false;
  try {

    // validate auth token
    if (req.query['auth-token'] !== 'Test1234!') {
      return res.status(StatusCodes.OK).send({
        message: 'Fetching eligible warmup mailboxes failed | Auth validation failed.'
      });
    }
    const { user_id: userId, mailbox_id: mailboxId, disconnect_stage: disconnectStage, disconnect_reason: disconnectReason } = req.body;

    if (!userId || !mailboxId) {
      throw new Error('Invalid payload: user_id or mailbox_id missing');
    }

    // sent ressponse and process the request
    res.status(StatusCodes.OK).send({
      message: 'Mailbox warmup sender failure issue handled successfully'
    });
    isReplySent = true;

    if (Number(disconnectStage) < 3) {
      await Promise.all([
        DomainMailboxesHandler.updateDomainMailbox({
          disconnect_stage: disconnectStage,
          disconnect_reason: disconnectReason,
        }, {
          user_id: userId,
          id: mailboxId
        }),
        // add to warmup pool with delay of 30 mins
        addMailboxToPoolWithDelay('wp', userId, mailboxId, 1800000),
        // update warmup_trigger_details next_send_time to now + 30 mins and set is_processing to false
        db.warmupSequelize.query(`UPDATE public.warmup_trigger_details SET next_send_time = now() + INTERVAL '30 minutes', 
          is_processing = false WHERE user_id = :userId AND mailbox_id = :mailboxId`,
        {
          replacements: { userId, mailboxId },
          type: QueryTypes.UPDATE
        }
        )
      ]);
    } else {
      await Promise.all([
        DomainMailboxesHandler.updateDomainMailbox({
          status: 'DISCONNECTED',
          disconnect_stage: null,
          disconnect_reason: disconnectReason,
        }, {
          user_id: userId,
          id: mailboxId
        }),
        db.warmupSequelize.query(
          `UPDATE public.mailbox_warmup_details SET status = 'BLOCKED', block_stage = null,
       block_reason = :blockReason WHERE user_id = :userId AND mailbox_id = :mailboxId`,
          {
            replacements: { blockReason: disconnectReason, userId, mailboxId },
            type: QueryTypes.UPDATE
          }
        )
      ]);
    }

  } catch (error) {
    logger.error(`Error occurred while updating mailbox warmup sender failure issue: ${error.message}`);
    if (!isReplySent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: `Server error: ${error.message}`,
      });
    }
  }
};

export const handleImapFailureErrors = async(req, res) => {
  const logger = Container.get('logger');
  const DomainMailboxesHandler = Container.get('DomainMailboxesHandler');
  let isReplySent = false;
  try {

    // validate auth token
    if (req.query['auth-token'] !== 'Test1234!') {
      return res.status(StatusCodes.OK).send({
        message: 'Mailbox imap failure handler auth fails | Auth validation failed.'
      });
    }
    const { user_id: userId, mailbox_id: mailboxId, disconnect_stage: disconnectStage, disconnect_reason: disconnectReason } = req.body;

    if (!userId || !mailboxId) {
      throw new Error('Invalid payload: user_id or mailbox_id missing');
    }

    // sent ressponse and process the request
    res.status(StatusCodes.OK).send({
      message: 'Mailbox imap failure issue handled successfully'
    });
    isReplySent = true;

    if (Number(disconnectStage) < 3) {
      await Promise.all([
        DomainMailboxesHandler.updateDomainMailbox({
          disconnect_stage: disconnectStage,
          disconnect_reason: disconnectReason,
        }, {
          user_id: userId,
          id: mailboxId
        }),
      ]);
    } else {
      await Promise.all([
        DomainMailboxesHandler.updateDomainMailbox({
          status: 'DISCONNECTED',
          disconnect_stage: null,
          disconnect_reason: disconnectReason,
        }, {
          user_id: userId,
          id: mailboxId
        }),
        db.warmupSequelize.query(
          `UPDATE public.mailbox_warmup_details SET status = 'BLOCKED', block_stage = null,
       block_reason = :blockReason WHERE user_id = :userId AND mailbox_id = :mailboxId`,
          {
            replacements: { blockReason: disconnectReason, userId, mailboxId },
            type: QueryTypes.UPDATE
          }
        )
      ]);
    }
  } catch (error) {
    logger.error(`Error occurred while handling imap failure issue: ${error.message}`);
    if (!isReplySent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: `Server error: ${error.message}`,
      });
    }
  }
};

export const resetMailboxDisconnectStatus = async(req, res) => {
  const logger = Container.get('logger');
  const DomainMailboxesHandler = Container.get('DomainMailboxesHandler');
  let isReplySent = false;
  try {

    // validate auth token
    if (req.query['auth-token'] !== 'Test1234!') {
      return res.status(StatusCodes.OK).send({
        message: 'Reset mailbox disconnect status auth fails | Auth validation failed.'
      });
    }
    const { user_id: userId, mailbox_id: mailboxId } = req.body;

    // sent ressponse and process the request
    res.status(StatusCodes.OK).send({
      message: 'Mailbox disconnect status reset successfully'
    });
    isReplySent = true;

    await DomainMailboxesHandler.updateDomainMailbox({
      disconnect_stage: null,
      disconnect_reason: null,
    }, {
      user_id: userId,
      id: mailboxId
    });

  } catch (error) {
    logger.error(`Error occurred while resetting mailbox disconnect status: ${error.message}`);
    if (!isReplySent) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: `Server error: ${error.message}`,
      });
    }
  }
};
