import { db } from '../index';
import { Container } from 'typedi';
import { DEFAULT_CONTACT_ATTRIBUTES } from '../../config/constants';
import { QueryTypes } from 'sequelize';

export const addContactsToList = async(
  workspaceId,
  listId,
  contactIds = []
) => {
  try {
    if (!contactIds.length) return [];

    const rows = contactIds.map(contactId => ({
      workspace_id: workspaceId,
      list_id: listId,
      contact_id: contactId
    }));

    return await db.contact_list_mappings.bulkCreate(rows, {
      ignoreDuplicates: true
    });

  } catch (err) {
    const logger = Container.get('logger');
    logger.error(`Error adding contacts to list: ${err.message}`);
    throw err;
  }
};

export const removeContactsFromList = async(
  workspaceId,
  listId,
  contactIds
) => {
  try {
    return await db.contact_list_mappings.destroy({
      where: {
        workspace_id: workspaceId,
        list_id: listId,
        contact_id: contactIds
      }
    });
  } catch (err) {
    Container.get('logger').error(
      `Error removing contacts from list: ${err.message}`
    );
    throw err;
  }
};

export const getContactsByList = async({
  workspaceId,
  listId,
  offset = 0,
  limit = 100,
  searchText = '',
  espProvider,
  contactStatus,
  attributes = DEFAULT_CONTACT_ATTRIBUTES
}) => {
  try {
    const attrSql = attributes
      .map(attr => `c.${attr}`)
      .join(', ');

    const values = [
      workspaceId,
      listId,
      offset,
      limit
    ];

    let additionalWhere = '';

    if (searchText) {
      additionalWhere = `AND (
        c.email ILIKE $5
        OR c.first_name ILIKE $5
        OR c.last_name ILIKE $5
      )`;
      values.push(`%${searchText}%`);
    }

    if (espProvider) {
      additionalWhere = `AND c.esp_provider = $${values.length + 1}`;
      values.push(espProvider);
    }

    if (contactStatus) {
      switch (contactStatus) {
        case 'BOUNCED':
          additionalWhere += ' AND c.bounced_at is not null';
          break;
        case 'UNSUBSCRIBED':
          additionalWhere += ' AND c.unsubscribed_at is not null';
          break;
        case 'BLOCKED':
          additionalWhere += ' AND c.blocked_at is not null';
          break;
        case 'ACTIVE':
        default:
          additionalWhere += ' AND (c.bounced_at is null AND c.unsubscribed_at is null AND c.blocked_at is null)';
          break;
      }
    }

    const query = `
      SELECT
        ${attrSql},
        clm.created_at AS list_added_at
      FROM contact_list_mappings clm
      JOIN contacts c
        ON c.workspace_id = clm.workspace_id
       AND c.id = clm.contact_id
      WHERE clm.workspace_id = $1
        AND clm.list_id = $2
        AND c.deleted_at IS NULL
      ${additionalWhere}
      ORDER BY clm.created_at DESC
      OFFSET $3
      LIMIT $4
    `;

    return await db.sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: values
    });

  } catch (err) {
    Container.get('logger').error(
      `Error fetching contacts by list: ${err.message}`
    );
    throw err;
  }
};

export const countContactsByList = async({ workspaceId, listId, searchText = '', espProvider, contactStatus }) => {
  let additionalWhere = '';
  const values = [workspaceId, listId];

  if (searchText) {
    additionalWhere = `AND (
      c.email ILIKE $3
      OR c.first_name ILIKE $3
      OR c.last_name ILIKE $3
    )`;
    values.push(`%${searchText}%`);
  }

  if (espProvider) {
    additionalWhere = `AND c.esp_provider = $${values.length + 1}`;
    values.push(espProvider);
  }

  if (contactStatus) {
    switch (contactStatus) {
      case 'BOUNCED':
        additionalWhere += ' AND c.bounced_at is not null';
        break;
      case 'UNSUBSCRIBED':
        additionalWhere += ' AND c.unsubscribed_at is not null';
        break;
      case 'BLOCKED':
        additionalWhere += ' AND c.blocked_at is not null';
        break;
      case 'ACTIVE':
      default:
        additionalWhere += ' AND (c.bounced_at is null AND c.unsubscribed_at is null AND c.blocked_at is null)';
        break;
    }
  }

  const query = `
    SELECT COUNT(*)::int
    FROM contact_list_mappings clm
    JOIN contacts c
      ON c.workspace_id = clm.workspace_id
     AND c.id = clm.contact_id
    WHERE clm.workspace_id = $1
      AND clm.list_id = $2
      AND c.deleted_at IS NULL
    ${additionalWhere}
  `;

  const result = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    bind: values
  });

  return result[0].count;
};

export const isContactInList = async(
  workspaceId,
  listId,
  contactId
) => {
  try {
    const record = await db.contact_list_mappings.findOne({
      where: {
        workspace_id: workspaceId,
        list_id: listId,
        contact_id: contactId
      },
      attributes: ['contact_id'],
      raw: true
    });

    return !!record;
  } catch (err) {
    Container.get('logger').error(
      `Error checking contact in list: ${err.message}`
    );
    throw err;
  }
};
