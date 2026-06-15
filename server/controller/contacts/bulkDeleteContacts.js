import { StatusCodes } from 'http-status-codes';
import { Op, Sequelize } from 'sequelize';
import Container from 'typedi';

/*
BULK DELETE CONTACTS
*/
export const bulkDeleteContacts = async(req, res) => {

  const logger = Container.get('logger');
  const ContactsModelHandler = Container.get('ContactsModelHandler');
  const workspaceId = req.workspace.id;

  const {
    search_text: searchText,
    esp_provider: espProvider,
    list_id: listId,
    contact_status: contactStatus
  } = req.body;

  try {

    const where = {
      workspace_id: workspaceId,
      deleted_at: null
    };

    if (searchText) {
      where[Op.or] = [
        {
          first_name: {
            [Op.iLike]: `%${searchText}%`
          }
        },
        {
          last_name: {
            [Op.iLike]: `%${searchText}%`
          }
        },
        {
          email: {
            [Op.iLike]: `%${searchText}%`
          }
        }
      ];
    }

    if (espProvider) {
      where.esp_provider = espProvider;
    }

    switch (contactStatus) {

      case 'UNSUBSCRIBED':
        where.unsubscribed_at = {
          [Op.ne]: null
        };
        break;

      case 'BOUNCED':
        where.bounced_at = {
          [Op.ne]: null
        };
        break;

      case 'BLOCKED':
        where.blocked_at = {
          [Op.ne]: null
        };
        break;

      case 'ACTIVE':
      default:
        where.unsubscribed_at = null;
        where.bounced_at = null;
        where.blocked_at = null;
        break;
    }

    if (listId) {
      where[Op.and] = [
        Sequelize.literal(`EXISTS (
          SELECT 1
          FROM contact_list_mappings clm
          WHERE clm.workspace_id = ${workspaceId}
          AND clm.list_id = ${listId}
          AND clm.contact_id = contacts.id
        )`)
      ];
    }

    const deletedCount = await ContactsModelHandler.softDeleteContact(where);

    return res.status(StatusCodes.OK).send({
      deleted_count: deletedCount
    });

  } catch (error) {

    logger.error(
      `Error bulk deleting contacts: ${error.message}`
    );

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });
  }
};
