import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
UPDATE CONTACT
*/
export const updateContact = async(req, res) => {
  const logger = Container.get('logger');

  const ContactsModelHandler = Container.get('ContactsModelHandler');

  const { id } = req.params;

  const workspaceId = req.workspace.id;

  try {

    const existingContact = await ContactsModelHandler.getContactByWhere({
      workspace_id: workspaceId,
      id,
      deleted_at: null
    });

    if (!existingContact) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Contact not found.'
      });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // normalize email
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    // merge custom fields
    if (updateData.custom_fields) {
      updateData.custom_fields = {
        ...(existingContact.custom_fields || {}),
        ...updateData.custom_fields
      };
    }

    // merge metadata
    if (updateData.metadata) {
      updateData.metadata = {
        ...(existingContact.metadata || {}),
        ...updateData.metadata
      };
    }

    await ContactsModelHandler.updateContact(
      updateData,
      {
        id,
        workspace_id: workspaceId
      }
    );

    return res.status(StatusCodes.OK).send({
      message: 'Contact updated successfully.'
    });

  } catch (error) {

    logger.error(`Error updating contact: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
