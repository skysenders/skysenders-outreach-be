import { db } from '../index';
import { Container } from 'typedi';
import { CONTACT_IMPORT_CONFLICT_ACTION, DEFAULT_CONTACT_ATTRIBUTES } from '../../config/constants';
import { QueryTypes } from 'sequelize';

export const getContactByWhere = async(where) => {
  try {
    return await db.contacts.findOne({
      where,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching contact: ${err.message}`);
    throw err;
  }
};

export const getContactWithAttributes = async(where, attributes = DEFAULT_CONTACT_ATTRIBUTES) => {
  try {
    return await db.contacts.findOne({
      where,
      attributes,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching contact: ${err.message}`);
    throw err;
  }
};

export const getAllContactsByWhere = async(
  where,
  attributes = DEFAULT_CONTACT_ATTRIBUTES,
  offset = 0,
  limit = 100
) => {
  try {
    return await db.contacts.findAll({
      where,
      attributes,
      offset,
      limit,
      raw: true
    });
  } catch (err) {
    Container.get('logger').error(`Error fetching all contacts: ${err.message}`);
    throw err;
  }
};

export const countContactsByWhere = async(where) => {
  try {
    return await db.contacts.count({ where });
  } catch (err) {
    Container.get('logger').error(`Error counting contacts: ${err.message}`);
    throw err;
  }
};

export const createContact = async(data) => {
  try {
    return await db.contacts.create(data);
  } catch (err) {
    Container.get('logger').error(`Error creating contact: ${err.message}`);
    throw err;
  }
};

export const updateContact = async(data, where) => {
  try {
    const [, updated] = await db.contacts.update(
      {
        ...data,
        updated_at: new Date()
      },
      {
        where,
        returning: true,
        raw: true
      }
    );

    return updated?.[0];
  } catch (err) {
    Container.get('logger').error(`Error updating contact: ${err.message}`);
    throw err;
  }
};

export const deleteContact = async(where) => {
  try {
    return await db.contacts.destroy({ where });
  } catch (err) {
    Container.get('logger').error(`Error deleting contact: ${err.message}`);
    throw err;
  }
};

const bulkSkipInsert = async(records) => {
  return db.contacts.bulkCreate(records, {
    ignoreDuplicates: true
  });
};

const bulkMergeInsert = async(records) => {
  const values = [];
  const placeholders = [];

  records.forEach((r, i) => {
    const baseIndex = i * 14;

    placeholders.push(
      `(
        $${baseIndex + 1},
        $${baseIndex + 2},
        $${baseIndex + 3},
        $${baseIndex + 4},
        $${baseIndex + 5},
        $${baseIndex + 6},
        $${baseIndex + 7},
        $${baseIndex + 8},
        $${baseIndex + 9},
        $${baseIndex + 10},
        $${baseIndex + 11},
        $${baseIndex + 12},
        $${baseIndex + 13},
        $${baseIndex + 14}
      )`
    );

    values.push(
      r.partner_id,
      r.workspace_id,
      r.email,
      r.esp_provider || 'OTHERS',
      r.first_name,
      r.last_name,
      r.phone,
      r.job_title,
      r.linkedin_url,
      r.company_name,
      r.city,
      r.state,
      r.country,
      JSON.stringify(r.custom_fields || {})
    );
  });

  const query = `
    INSERT INTO contacts (
      partner_id,
      workspace_id,
      email,
      esp_provider,
      first_name,
      last_name,
      phone,
      job_title,
      linkedin_url,
      company_name,
      city,
      state,
      country,
      custom_fields
    )
    VALUES ${placeholders.join(',')}
    ON CONFLICT (workspace_id, email)
    DO UPDATE SET
      esp_provider = EXCLUDED.esp_provider,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      job_title = EXCLUDED.job_title,
      linkedin_url = EXCLUDED.linkedin_url,
      company_name = EXCLUDED.company_name,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      custom_fields = contacts.custom_fields || EXCLUDED.custom_fields,
      updated_at = NOW()
    RETURNING id, email, xmax;
  `;

  return db.sequelize.query(query, {
    type: QueryTypes.INSERT,
    bind: values
  });
};

export const bulkCreateContacts = async(
  contacts,
  conflictAction = CONTACT_IMPORT_CONFLICT_ACTION.SKIP
) => {
  try {
    switch (conflictAction) {
      case CONTACT_IMPORT_CONFLICT_ACTION.SKIP:
        return await bulkSkipInsert(contacts);

      case CONTACT_IMPORT_CONFLICT_ACTION.MERGE:
        return await bulkMergeInsert(contacts);

      default:
        throw new Error(`Unsupported conflict action: ${conflictAction}`);
    }
  } catch (err) {
    Container.get('logger').error(
      `Error bulk creating contacts: ${err.message}`
    );
    throw err;
  }
};

export const softDeleteContact = async(where) => {
  try {
    const [, updated] = await db.contacts.update(
      {
        deleted_at: new Date()
      },
      {
        where,
        returning: true,
        raw: true
      }
    );

    return updated;
  } catch (err) {
    Container.get('logger').error(`Error soft deleting contact: ${err.message}`);
    throw err;
  }
};

export const markContactUnsubscribed = async(where) => {
  return updateContact({
    unsubscribed_at: new Date()
  }, where);
};

export const markContactBounced = async(where) => {
  return updateContact({
    bounced_at: new Date()
  }, where);
};

export const markContactBlocked = async(where) => {
  return updateContact({
    blocked_at: new Date()
  }, where);
};
