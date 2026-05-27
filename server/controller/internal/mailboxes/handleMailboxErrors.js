import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { AUTH_TOKEN } from '../../../config/constants';
import { makeWarmupProxyAPICall } from '../../../api/routes/proxy/warmup-proxy';


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
    const { partner_id: partnerId, workspace_id: workspaceId, mailbox_id: mailboxId, disconnect_stage: disconnectStage, disconnect_reason: disconnectReason } = req.body;

    if (!partnerId || !workspaceId || !mailboxId) {
      throw new Error('Invalid payload: partner_id, workspace_id or mailbox_id missing');
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
          partner_id: partnerId,
          id: mailboxId
        }),
        makeWarmupProxyAPICall(`/api/internal/add-mailbox-to-warmup-pool?auth-token=${AUTH_TOKEN}`, 'POST', {
          partner_id: partnerId,
          workspace_id: workspaceId,
          mailbox_id: mailboxId,
          delay: 1800000
        })
      ]);
    } else {
      await Promise.all([
        DomainMailboxesHandler.updateDomainMailbox({
          status: 'DISCONNECTED',
          disconnect_stage: null,
          disconnect_reason: disconnectReason,
        }, {
          partner_id: partnerId,
          id: mailboxId
        }),
        makeWarmupProxyAPICall(`/api/internal/block-warmup-mailbox?auth-token=${AUTH_TOKEN}`, 'POST', {
          partner_id: partnerId,
          workspace_id: workspaceId,
          mailbox_id: mailboxId,
          block_reason: disconnectReason
        })
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
    const { partner_id: partnerId, workspace_id: workspaceId, mailbox_id: mailboxId, disconnect_stage: disconnectStage, disconnect_reason: disconnectReason } = req.body;

    if (!partnerId || !workspaceId || !mailboxId) {
      throw new Error('Invalid payload: partner_id, workspace_id or mailbox_id missing');
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
          partner_id: partnerId,
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
          partner_id: partnerId,
          id: mailboxId
        }),
        makeWarmupProxyAPICall(`/api/internal/block-warmup-mailbox?auth-token=${AUTH_TOKEN}`, 'POST', {
          partner_id: partnerId,
          workspace_id: workspaceId,
          mailbox_id: mailboxId,
          block_reason: disconnectReason
        })
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
    const { partner_id: partnerId, workspace_id: workspaceId, mailbox_id: mailboxId } = req.body;

    // sent ressponse and process the request
    res.status(StatusCodes.OK).send({
      message: 'Mailbox disconnect status reset successfully'
    });
    isReplySent = true;

    await DomainMailboxesHandler.updateDomainMailbox({
      disconnect_stage: null,
      disconnect_reason: null,
    }, {
      partner_id: partnerId,
      workspace_id: workspaceId,
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
