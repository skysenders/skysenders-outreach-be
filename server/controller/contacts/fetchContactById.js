import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
FETCH CONTACT BY ID
*/
export const fetchContactById = async(req, res) => {
  const logger = Container.get('logger');
  const ContactsModelHandler = Container.get('ContactsModelHandler');

  const { id } = req.params;

  const workspaceId = req.workspace.id;

  try {

    const contact = await ContactsModelHandler.getContactByWhere({
      workspace_id: workspaceId,
      id,
      deleted_at: null
    });

    if (!contact) {
      logger.warn(
        `Contact with ID ${id} not found for workspace ID ${workspaceId}`
      );

      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Contact not found.'
      });
    }

    return res.status(StatusCodes.OK).send(contact);

  } catch (error) {

    logger.error(`Error fetching contact: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
