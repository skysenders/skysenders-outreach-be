import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
SAVE MAILBOXES TO SEQUENCE
*/
export const saveSequenceMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const MailboxesModelHandler = Container.get('MailboxesModelHandler');
  const SeqMailboxMappingsModelHandler = Container.get('SeqMailboxMappingsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  // Destructure snake_case payload into camelCase variables for ESLint
  const {
    mailbox_ids: mailboxIds = [],
    archived_mailbox_ids: archivedMailboxIds = []
  } = req.body;

  try {
    // 1. Verify sequence scope identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });

    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Verify all provided mailboxes exist and belong to the workspace
    const mailboxes = await MailboxesModelHandler.getAllInternalMailboxesByWhere({
      workspace_id: workspaceId,
      id: mailboxIds,
    });

    if (!mailboxes || mailboxes.length < mailboxIds.length) {
      const foundIds = mailboxes ? mailboxes.map(m => m.id) : [];
      const missingIds = mailboxIds.filter(id => !foundIds.includes(id));
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'One or more mailboxes not found in the workspace. Please verify mailbox IDs and try again.',
        missing_mailbox_ids: missingIds
      });
    }


    // 3. Handle soft deletion of archived mailboxes if provided
    if (archivedMailboxIds.length > 0) {
      await SeqMailboxMappingsModelHandler.softDeleteSeqMailboxMapping({
        seq_id: seqId,
        mailbox_id: archivedMailboxIds
      });
    }

    // 4. Fetch existing active mappings to prevent duplicate insertions
    const existingMappings = await SeqMailboxMappingsModelHandler.getAllSeqMailboxMappingsByWhere({
      seq_id: seqId
    });

    const mappedMailboxIdSet = new Set(existingMappings.map(mapping => mapping.mailbox_id));

    // 5. Filter out mailboxes that are already mapped
    const newMailboxIdsToMap = mailboxIds.filter(mailboxId => !mappedMailboxIdSet.has(mailboxId));

    if (newMailboxIdsToMap.length > 0) {
      const mappingsToCreate = newMailboxIdsToMap.map(mailboxId => ({
        seq_id: seqId,
        mailbox_id: mailboxId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await SeqMailboxMappingsModelHandler.bulkCreateSeqMailboxMappings(mappingsToCreate);
    }

    // 6. Calculate total active mailboxes linked to this sequence
    const totalActiveMailboxes = mappedMailboxIdSet.size + newMailboxIdsToMap.length - archivedMailboxIds.length;

    return res.status(StatusCodes.OK).send({
      success: true,
      associated_count: Math.max(0, totalActiveMailboxes),
      message: 'Sequence mailboxes updated successfully'
    });

  } catch (error) {
    logger.error(`Failed to save mailboxes for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
