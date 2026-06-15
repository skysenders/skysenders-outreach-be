import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
DELETE CONTACT
*/
export const deleteContact = async(req, res) => {
  const logger = Container.get('logger');

  const ContactsModelHandler = Container.get('ContactsModelHandler');

  const { id } = req.params;

  const workspaceId = req.workspace.id;

  try {

    const contact = await ContactsModelHandler.getContactByWhere({
      id,
      workspace_id: workspaceId,
      deleted_at: null
    });

    if (!contact) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Contact not found.'
      });
    }

    await ContactsModelHandler.updateContact(
      {
        deleted_at: new Date()
      },
      {
        id,
        workspace_id: workspaceId,
      }
    );

    return res.status(StatusCodes.OK).send({
      message: 'Contact deleted successfully.'
    });

  } catch (error) {

    logger.error(`Error deleting contact: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
