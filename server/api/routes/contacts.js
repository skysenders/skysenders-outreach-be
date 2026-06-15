import { DEFAULT_CONTACT_ATTRIBUTES } from '../../config/constants';
// controllers
import { fetchContactById } from '../../controller/contacts/fetchContactById';
import { listContacts } from '../../controller/contacts/listContacts';
import { exportContacts } from '../../controller/contacts/exportContacts';
import { updateContact } from '../../controller/contacts/updateContact';
import { deleteContact } from '../../controller/contacts/deleteContact';
import { bulkDeleteContacts } from '../../controller/contacts/bulkDeleteContacts';
import { importContacts } from '../../controller/contacts/importContacts';
// lsits
import { getListById, getLists } from '../../controller/contacts/getLists';
import { createList } from '../../controller/contacts/createList';
import { updateList } from '../../controller/contacts/updateList';

export default async function authRoutes(fastify) {
  // fetch contact by id
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Fetch contact by ID',
        description: 'Fetch contact details by ID',
        operationId: 'fetchContactById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          },
          required: ['id']
        },
        response: {
          200: {
            description: 'Contact fetched successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              esp_provider: { type: 'string' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              phone: { type: 'string' },
              job_title: { type: 'string' },
              linkedin_url: { type: 'string' },
              company_name: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              custom_fields: {
                type: 'object',
                additionalProperties: true
              },
              unsubscribed_at: { type: 'string' },
              bounced_at: { type: 'string' },
              blocked_at: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
            }
          },

          404: {
            description: 'Contact not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },

          500: {
            description: 'Failed to fetch contact',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    fetchContactById
  );
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'List contacts',
        description: 'Fetch contacts with filters and pagination',
        operationId: 'listContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: {
              type: 'string',
              maxLength: 255
            },
            esp_provider: {
              type: 'string',
              enum: [
                'GMAIL',
                'OUTLOOK',
                'ZOHO',
                'YAHOO',
                'OTHERS'
              ]
            },
            list_id: {
              type: 'number'
            },
            contact_status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'UNSUBSCRIBED',
                'BOUNCED',
                'BLOCKED'
              ]
            },
            attributes: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Contact attribute to include in the response, for custom_fields use the format custom_fields.field_name'
              },
              default: DEFAULT_CONTACT_ATTRIBUTES
            },
            offset: {
              type: 'integer',
              minimum: 0,
              default: 0
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        },
        response: {
          200: {
            description: 'Contacts fetched successfully',
            type: 'object',
            properties: {
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_prev: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    esp_provider: { type: 'string' },
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                    phone: { type: 'string' },
                    job_title: { type: 'string' },
                    linkedin_url: { type: 'string' },
                    company_name: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    country: { type: 'string' },
                    unsubscribed_at: { type: 'string' },
                    bounced_at: { type: 'string' },
                    blocked_at: { type: 'string' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                    custom_fields: {
                      type: 'object',
                      additionalProperties: true
                    },
                  }
                }
              }
            }
          },
          500: {
            description: 'Failed to fetch contacts',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    listContacts
  );
  fastify.get(
    '/export',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Export contacts',
        description: 'Export contacts as CSV',
        operationId: 'exportContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: {
              type: 'string',
              maxLength: 255
            },

            esp_provider: {
              type: 'string',
              enum: [
                'GMAIL',
                'OUTLOOK',
                'ZOHO',
                'YAHOO',
                'OTHERS'
              ]
            },
            list_id: {
              type: 'number'
            },
            contact_status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'UNSUBSCRIBED',
                'BOUNCED',
                'BLOCKED'
              ]
            },
            attributes: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Contact attribute to export. For custom fields use custom_fields.field_name'
              },
              default: DEFAULT_CONTACT_ATTRIBUTES
            }
          }
        },
        response: {
          200: {
            description: 'CSV file'
          },
          500: {
            description: 'Failed to export contacts',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    exportContacts
  );
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Update contact',
        description: 'Update a contact by ID',
        operationId: 'updateContact',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          },
          required: ['id']
        },
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            esp_provider: {
              type: 'string',
              enum: [
                'GMAIL',
                'OUTLOOK',
                'ZOHO',
                'YAHOO',
                'OTHERS'
              ]
            },

            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },

            job_title: { type: 'string' },

            linkedin_url: { type: 'string' },

            company_name: { type: 'string' },

            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },

            custom_fields: {
              type: 'object',
              additionalProperties: true
            },

            metadata: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        response: {
          200: {
            description: 'Contact updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Contact not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          500: {
            description: 'Failed to update contact',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    updateContact
  );
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Delete contact',
        description: 'Soft delete a contact by ID',
        operationId: 'deleteContact',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          },
          required: ['id']
        },
        response: {
          200: {
            description: 'Contact deleted successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Contact not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          500: {
            description: 'Failed to delete contact',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    deleteContact
  );
  fastify.delete(
    '/',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Bulk delete contacts',
        description: 'Soft delete contacts matching filters',
        operationId: 'bulkDeleteContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            search_text: {
              type: 'string',
              maxLength: 255
            },
            esp_provider: {
              type: 'string',
              enum: [
                'GMAIL',
                'OUTLOOK',
                'ZOHO',
                'YAHOO',
                'OTHERS'
              ]
            },
            list_id: {
              type: 'number'
            },
            contact_status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'UNSUBSCRIBED',
                'BOUNCED',
                'BLOCKED'
              ]
            }
          }
        },
        response: {
          200: {
            description: 'Contacts deleted successfully',
            type: 'object',
            properties: {
              deleted_count: {
                type: 'number'
              }
            }
          }
        }
      }
    },
    bulkDeleteContacts
  );

  fastify.post(
    '/import',
    {
      schema: {
        tags: ['Contacts'],
        summary: 'Import contacts',
        operationId: 'importContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            list_id: {
              type: 'number',
              description: 'ID of the list to import contacts into'
            },
            source: {
              type: 'string',
              enum: ['CSV_UPLOAD', 'API', 'MANUAL'],
              description: 'Format of the contacts being imported'
            },
            source_file_name: { type: 'string', description: 'Original file name for CSV uploads' },
            merge_strategy: {
              type: 'string',
              enum: [ 'SKIP', 'MERGE'],
              description: 'Strategy to handle duplicate contacts based on email.'
            },
            contacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string' },
                  job_title: { type: 'string' },
                  linkedin_url: { type: 'string' },
                  company_name: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  custom_fields: {
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            },
          }
        }
      }
    },
    importContacts
  );
  fastify.get(
    '/lists/',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Get lists',
        operationId: 'getLists',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: {
              type: 'string',
              maxLength: 255
            },
            offset: {
              type: 'integer',
              minimum: 0,
              default: 0
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            },
          }
        },
        response: {
          200: {
            description: 'Lists fetched successfully',
            type: 'object',
            properties: {
              count: { type: 'integer' },
              offset: { type: 'integer' },
              limit: { type: 'integer' },
              has_next: { type: 'boolean' },
              has_prev: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                    created_by: { type: 'integer' },
                    custom_fields_map: { type: 'object', additionalProperties: true }
                  }
                }
              }
            }
          },
          500: {
            description: 'Failed to fetch lists',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    getLists
  );
  // route to get list by id
  fastify.get(
    '/lists/:id',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Get list by ID',
        operationId: 'getListById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          }
        },
        response: {
          200: {
            description: 'List fetched successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              created_by: { type: 'integer' },
              custom_fields_map: { type: 'object', additionalProperties: true }
            }
          },
          404: {
            description: 'List not found',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          },
          500: {
            description: 'Failed to fetch list',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    getListById
  );
  // Route to create a list
  fastify.post(
    '/lists/',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Create list',
        operationId: 'createList',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name']
        },
        response: {
          201: {
            description: 'List created successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              created_by: { type: 'integer' },
              custom_fields_map: { type: 'object', additionalProperties: true }
            }
          },
          500: {
            description: 'Failed to create list',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    createList
  );
  // Route to update a list
  fastify.put(
    '/lists/:listId',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Update list',
        operationId: 'updateList',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            listId: { type: 'integer' }
          },
          required: ['listId']
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          },
          minProperties: 1
        },
        response: {
          200: {
            description: 'List updated successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string' },
              updated_at: { type: 'string' },
              created_by: { type: 'integer' },
              custom_fields_map: { type: 'object', additionalProperties: true }
            }
          },
          404: {
            description: 'List not found',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          },
          500: {
            description: 'Failed to update list',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    updateList
  );
}
