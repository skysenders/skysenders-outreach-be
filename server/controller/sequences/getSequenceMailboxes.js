import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
LIST MAILBOXES BY SEQUENCE ID
*/
export const getSequenceMailboxes = async(req, res) => {
  const logger = Container.get('logger');
  const SequencesModelHandler = Container.get('SequencesModelHandler');
  const SeqMailboxMappingsModelHandler = Container.get('SeqMailboxMappingsModelHandler');

  const workspaceId = req.workspace.id;
  const seqId = parseInt(req.params.id, 10);

  // Destructure query parameters into camelCase variables for ESLint
  const {
    search_text: searchText,
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
      seq_id: seqId
    };

    if (searchText) {
      where.mailbox_email = { $iLike: `%${searchText}%` };
    }

    // 2. Fetch associated sequence mailboxes and total count
    const [mailboxes, count] = await Promise.all([
      SeqMailboxMappingsModelHandler.getSeqMailboxMappings(seqId, searchText, offset, limit),
      SeqMailboxMappingsModelHandler.countSeqMailboxMappingsByWhere(where)
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
      data: mailboxes
    });

  } catch (error) {
    logger.error(`Failed to fetch mailboxes for sequence ${seqId}: ${error.message}`, {
      stack: error.stack
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
