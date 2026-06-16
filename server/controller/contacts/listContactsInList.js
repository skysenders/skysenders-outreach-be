import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';
import { DEFAULT_CONTACT_ATTRIBUTES } from '../../config/constants';

/*
LIST CONTACTS IN A LIST
*/
export const listContactsInList = async(req, res) => {
  const logger = Container.get('logger');

  const ContactListMappingsModelHandler = Container.get('ContactListMappingsModelHandler');

  const workspaceId = req.workspace.id;
  const listId = req.params.id;

  const {
    search_text: searchText,
    esp_provider: espProvider,
    contact_status: contactStatus,
    attributes = DEFAULT_CONTACT_ATTRIBUTES,
    offset = 0,
    limit = 20
  } = req.query;

  try {
    // check attributes and for custom fields, convert to the format used in the database
    const formattedAttributes = [];
    for (const attr of attributes) {
      if (attr.startsWith('custom_fields.')) {
        formattedAttributes.push(`custom_fields->>'${attr.split('.')[1]}'`);
      } else if (DEFAULT_CONTACT_ATTRIBUTES.includes(attr)) {
        formattedAttributes.push(attr);
      } else {
        res.status(StatusCodes.BAD_REQUEST).send({
          message: `Invalid attribute: ${attr}. For custom fields, use the format custom_fields.field_name`
        });
        return;
      }
    }

    const [ contacts, count ] = await Promise.all([
      ContactListMappingsModelHandler.getContactsByList({
        workspaceId,
        listId,
        searchText,
        contactStatus,
        espProvider,
        attributes: formattedAttributes,
        offset,
        limit
      }),
      ContactListMappingsModelHandler.countContactsByList({
        workspaceId,
        listId,
        searchText,
        contactStatus,
        espProvider
      })
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: contacts
    });

  } catch (error) {

    logger.error(`Error fetching contacts: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
