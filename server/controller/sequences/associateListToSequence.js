import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

// Shared utility function to associate a list and safely enroll its active contacts into a sequence.
export const enrollListContactsToSequence = async({ workspaceId, seqId, listIds }) => {
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqListMappingsModelHandler = Container.get('SeqListMappingsModelHandler');
  const ContactListMappingsModelHandler = Container.get('ContactListMappingsModelHandler');
  const SeqContactMappingsModelHandler = Container.get('SeqContactMappingsModelHandler');

  // 1. Verify sequence scope context identity
  const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
  if (!sequence) {
    throw new Error('Sequence not found');
  }

  // 2. Establish structural relational binding between the list and sequence
  const existingMapping = await SeqListMappingsModelHandler.getAllSeqListMappingsByWhere({
    seq_id: seqId,
    list_id: listIds
  });

  const missingSeqListMappings = listIds.filter(listId => !existingMapping.some(mapping => mapping.list_id === listId));
  if (missingSeqListMappings.length > 0) {
    await SeqListMappingsModelHandler.bulkCreateSeqListMappings(
      missingSeqListMappings.map(listId => ({
        seq_id: seqId,
        list_id: listId,
        workspace_id: workspaceId,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );
  }

  const contactsToEnroll = [];


  // 3. Extract eligible contacts (filtering out hard-bounces, unsubscribes, and blocks)
  const eligibleContacts = await ContactListMappingsModelHandler.getContactsBasicDetails(workspaceId, listIds);

  if (eligibleContacts.length === 0) {
    return 0;
  }

  // 4. Fetch already enrolled sequence contacts to prevent duplicate entry constraints
  const existingEnrollments = await SeqContactMappingsModelHandler.getAllSeqContactMappings({
    workspace_id: workspaceId,
    seq_id: seqId
  });

  const enrolledContactIdSet = new Set(existingEnrollments.map(c => c.contact_id));

  // 5. Map batch data records skipping any contacts already inside this sequence runner queue
  eligibleContacts.forEach(contact => {
    if (!enrolledContactIdSet.has(contact.id)) {
      contactsToEnroll.push({
        workspace_id: workspaceId,
        seq_id: seqId,
        list_id: contact.list_id,
        contact_id: contact.id,
        contact_email: contact.email,
        created_at: new Date(),
        updated_at: new Date()
      });
      // push it to the enrolledContactIdSet
      enrolledContactIdSet.add(contact.id);
    }
  });

  // 6. Bulk execute structural database insertion in chunks of 1000 for optimization
  let cleanEnrolledTotal = 0;
  for (let i = 0; i < contactsToEnroll.length; i += 1000) {
    const chunk = contactsToEnroll.slice(i, i + 1000);
    await SeqContactMappingsModelHandler.bulkCreateSeqContactMappings(chunk);
    cleanEnrolledTotal += chunk.length;
  }

  await SequencesModelHandler.updateSequenceTotalContactsCount(workspaceId, seqId);

  return cleanEnrolledTotal;
};

/*
ASSOCIATE LIST TO SEQUENCE & ENROLL CONTACTS
*/
export const associateListToSequence = async(req, res) => {
  const logger = Container.get('logger');
  const ListsModelHandler = Container.get('ListsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  // CamelCase destruction for internal variables
  const { list_ids: listIds } = req.body;

  try {
    // Verify contact list exists before proceeding
    const list = await ListsModelHandler.getAllListsByWhere({ id: listIds, workspace_id: workspaceId });

    if (!list || list.length < listIds.length) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'One or more lists not found in the workspace. Please verify the list IDs and try again.',
        missing_list_ids: listIds.filter(id => !list.some(l => l.id === id))
      });
    }

    // Call the shared core logic runner
    const cleanEnrolledTotal = await enrollListContactsToSequence({
      workspaceId,
      seqId,
      listIds
    });

    return res.status(StatusCodes.OK).send({
      success: true,
      enrolled_count: cleanEnrolledTotal,
      message: `Successfully mapped list and enrolled ${cleanEnrolledTotal} unique new contacts into the campaign execution queue.`
    });

  } catch (error) {
    logger.error(`Failed to associate list ${listIds} to sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    if (error.message === 'Sequence not found') {
      return res.status(StatusCodes.NOT_FOUND).send({ message: error.message });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
