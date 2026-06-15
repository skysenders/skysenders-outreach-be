import { StatusCodes } from 'http-status-codes';
import { Op, literal } from 'sequelize';
import { stringify } from 'csv-stringify/sync';
import Container from 'typedi';
import { DEFAULT_CONTACT_ATTRIBUTES } from '../../config/constants';

const MAX_EXPORT_ROWS = 10000;
const BATCH_SIZE = 500;

/*
EXPORT CONTACTS
*/
export const exportContacts = async(req, res) => {
  const logger = Container.get('logger');

  const ContactsModelHandler = Container.get('ContactsModelHandler');
  const ContactListMappingsModelHandler = Container.get('ContactListMappingsModelHandler');

  const workspaceId = req.workspace.id;

  const {
    search_text: searchText,
    esp_provider: espProvider,
    list_id: listId,
    contact_status: contactStatus,
    attributes = DEFAULT_CONTACT_ATTRIBUTES
  } = req.query;

  try {

    // validate & format attributes
    const formattedAttributes = [];

    for (const attr of attributes) {
      if (attr.startsWith('custom_fields.')) {
        const fieldName = attr.split('.')[1];
        formattedAttributes.push([
          literal(`custom_fields->>'${fieldName}'`),
          fieldName
        ]);
      } else if (DEFAULT_CONTACT_ATTRIBUTES.includes(attr)) {
        formattedAttributes.push(attr);
      } else {
        return res.status(StatusCodes.BAD_REQUEST).send({
          message: `Invalid attribute: ${attr}. For custom fields use the format custom_fields.field_name`
        });
      }
    }

    const where = {
      workspace_id: workspaceId,
      deleted_at: null
    };

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

    // count first to avoid partial exports
    const totalCount = listId
      ? await ContactListMappingsModelHandler.countContactsByList({
        workspaceId,
        listId,
        searchText,
        contactStatus,
        espProvider
      })
      : await ContactsModelHandler.countContactsByWhere(where);

    if (totalCount > MAX_EXPORT_ROWS) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Export limit exceeded. Maximum ${MAX_EXPORT_ROWS} contacts can be exported at once.`
      });
    }

    const contacts = [];

    let offset = 0;

    while (contacts.length < MAX_EXPORT_ROWS) {

      const limit = Math.min(
        BATCH_SIZE,
        MAX_EXPORT_ROWS - contacts.length
      );

      let batch;

      if (listId) {

        batch = await ContactListMappingsModelHandler.getContactsByList({
          workspaceId,
          listId,
          searchText,
          contactStatus,
          espProvider,
          attributes: formattedAttributes,
          offset,
          limit
        });

      } else {

        batch = await ContactsModelHandler.getAllContactsByWhere(
          where,
          formattedAttributes,
          offset,
          limit
        );

      }

      if (!batch?.length) {
        break;
      }

      contacts.push(...batch);

      if (batch.length < limit) {
        break;
      }

      offset += limit;
    }

    const csv = stringify(contacts, {
      header: true
    });

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="contacts-${Date.now()}.csv"`
    );

    return res.send(csv);

  } catch (error) {

    logger.error(`Error exporting contacts: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
