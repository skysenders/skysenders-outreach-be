import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
LIST CONTACTS BY SEQUENCE ID
*/
export const getSequenceContacts = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqContactMappingsModelHandler = Container.get('SeqContactMappingsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  // Destructure query parameters into camelCase variables for ESLint
  const {
    search_text: searchText,
    status,
    offset = 0,
    limit = 20
  } = req.query;

  try {
    // 1. Verify parent sequence scope identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    const where = {
      workspace_id: workspaceId,
      seq_id: seqId
    };

    if (searchText) {
      where.contact_email = { $iLike: `%${searchText}%` };
    }

    if (status) {
      where.status = status;
    }

    // 2. Fetch sequence contacts and total count
    const [contacts, count] = await Promise.all([
      SeqContactMappingsModelHandler.getAllPaginatedSeqContactMappings(where, offset, limit),
      SeqContactMappingsModelHandler.countSeqContactMappingsByWhere(where)
    ]);

    // 3. Compute pagination state flags
    const hasNext = offset + limit < count;
    const hasPrev = offset > 0;

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: hasNext,
      has_prev: hasPrev,
      data: contacts
    });

  } catch (error) {
    logger.error(`Failed to fetch contacts for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};

/*
GET SINGLE SEQUENCE CONTACT BY ID
*/
export const getSequenceContactById = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqContactMappingsModelHandler = Container.get('SeqContactMappingsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);
  const contactId = parseInt(req.params.contactId, 10);

  try {
    // 1. Verify sequence scope identity
    const sequence = await SequencesModelHandler.getSequenceByWhere({ id: seqId, workspace_id: workspaceId });
    if (!sequence) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence not found' });
    }

    // 2. Fetch specific sequence contact mapping
    const contact = await SeqContactMappingsModelHandler.getSeqContactDetailsByContactId(workspaceId, contactId);

    if (!contact) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Sequence contact not found' });
    }

    return res.status(StatusCodes.OK).send(contact);

  } catch (error) {
    logger.error(`Failed to fetch contact ${contactId} for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
