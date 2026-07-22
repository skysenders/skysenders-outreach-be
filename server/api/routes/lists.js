import { DEFAULT_CONTACT_ATTRIBUTES, CONTACT_IMPORT_CONFLICT_ACTION } from '../../config/constants';
// lsits
import { getListById, getLists } from '../../controller/contacts/getLists';
import { createList } from '../../controller/contacts/createList';
import { updateList } from '../../controller/contacts/updateList';
import { listContactsInList } from '../../controller/contacts/listContactsInList';
import { importContactsToList } from '../../controller/contacts/importContactsToList';
// list jobs
import { getListImportJobById, getListImportJobs } from '../../controller/contacts/getListJobs';

export default async function authRoutes(fastify) {
  fastify.get(
    '/',
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
                    total_contacts: { type: 'integer' },
                    description: { type: 'string' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                    created_by: { type: 'integer' },
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
    '/:id',
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
              total_contacts: { type: 'integer' },
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
    '/',
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
              total_contacts: { type: 'integer' },
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
    '/:id',
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
            id: { type: 'integer' }
          },
          required: ['id']
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
              total_contacts: { type: 'integer' },
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
  fastify.get(
    '/:id/contacts',
    {
      schema: {
        tags: ['Lists'],
        summary: 'List contacts in a list',
        description: 'Fetch contacts belonging to a specific list with filters and pagination',
        operationId: 'listListContacts',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            }
          },
          required: ['id']
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
            description: 'List contacts fetched successfully',
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
                    }
                  }
                }
              }
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
            description: 'Failed to fetch list contacts',
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
    listContactsInList
  );
  fastify.post(
    '/:id/import',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Import contacts to a list',
        operationId: 'importContactsToList',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              enum: ['CSV_UPLOAD', 'API', 'MANUAL'],
              description: 'Format of the contacts being imported'
            },
            source_file_name: { type: 'string', description: 'Original file name for CSV uploads' },
            merge_strategy: {
              type: 'string',
              enum: Object.values(CONTACT_IMPORT_CONFLICT_ACTION),
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
    importContactsToList
  );
  // api to fetch all jobs for a list
  fastify.get(
    '/:id/import-jobs',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Get all import jobs for a list',
        operationId: 'getListImportJobs',
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
        querystring: {
          type: 'object',
          properties: {
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
            description: 'Jobs fetched successfully',
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
                    list_id: { type: 'integer' },
                    source: { type: 'string' },
                    status: { type: 'string' },
                    source_file_name: { type: 'string' },
                    import_settings: { type: 'object', additionalProperties: true },
                    total_rows: { type: 'integer' },
                    valid_count: { type: 'integer' },
                    duplicate_count: { type: 'integer' },
                    unsubscribed_count: { type: 'integer' },
                    bounced_count: { type: 'integer' },
                    blocked_count: { type: 'integer' },
                    invalid_count: { type: 'integer' },
                    already_existing_count: { type: 'integer' },
                    started_at: { type: 'string' },
                    completed_at: { type: 'string' },
                    error_message: { type: 'string' },
                    created_by: { type: 'integer' },
                  }
                }
              }
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
            description: 'Failed to fetch list jobs',
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
    getListImportJobs
  );

  // api to fetch a specific job for a list
  fastify.get(
    '/:id/import-jobs/:jobId',
    {
      schema: {
        tags: ['Lists'],
        summary: 'Get a specific import job for a list',
        operationId: 'getListImportJobById',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            jobId: { type: 'number' }
          }
        },
        response: {
          200: {
            description: 'Job fetched successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              list_id: { type: 'integer' },
              source: { type: 'string' },
              status: { type: 'string' },
              source_file_name: { type: 'string' },
              import_settings: { type: 'object', additionalProperties: true },
              total_rows: { type: 'integer' },
              valid_count: { type: 'integer' },
              duplicate_count: { type: 'integer' },
              unsubscribed_count: { type: 'integer' },
              bounced_count: { type: 'integer' },
              blocked_count: { type: 'integer' },
              invalid_count: { type: 'integer' },
              already_existing_count: { type: 'integer' },
              started_at: { type: 'string' },
              completed_at: { type: 'string' },
              error_message: { type: 'string' },
              created_by: { type: 'integer' },
            }
          },
          404: {
            description: 'Job not found',
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          },
          500: {
            description: 'Failed to fetch list job',
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
    getListImportJobById
  );
}
