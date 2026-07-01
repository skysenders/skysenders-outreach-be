import { listGlobalSuppressions } from '../../controller/global_suppressions/listGlobalSuppressions';
import { createGlobalSuppression } from '../../controller/global_suppressions/createGlobalSuppression';
import { bulkImportGlobalSuppressions } from '../../controller/global_suppressions/bulkImportGlobalSuppressions';
import { bulkDeleteGlobalSuppressions } from '../../controller/global_suppressions/bulkDeleteGlobalSuppressions';

export default async function suppressionRoutes(fastify) {

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Global Suppressions'],
        summary: 'List global suppressions',
        description: 'Fetch global suppressions for a workspace',
        operationId: 'listGlobalSuppressions',
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
              type: 'string'
            },
            suppression_type: {
              type: 'string',
              enum: [
                'UNSUBSCRIBE',
                'HARD_BOUNCE',
                'SOFT_BOUNCE',
                'MANUAL_BLOCK',
                'SPAM_COMPLAINT',
                'INVALID_EMAIL'
              ]
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
                    value: { type: 'string' },
                    suppression_type: { type: 'string' },
                    reason: { type: ['string', 'null'] },
                    sequence_id: { type: ['number', 'null'] },
                    step_id: { type: ['number', 'null'] },
                    mailbox_id: { type: ['number', 'null'] },
                    message_id: { type: ['string', 'null'] },
                    created_by: { type: ['number', 'null'] },
                    created_at: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    listGlobalSuppressions
  );

  fastify.post(
    '/',
    {
      schema: {
        tags: ['Global Suppressions'],
        summary: 'Create global suppression',
        description: 'Add an email/value to global suppression list',
        operationId: 'createGlobalSuppression',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['value', 'suppression_type'],
          properties: {
            value: { type: 'string' },
            suppression_type: {
              type: 'string',
              enum: [
                'UNSUBSCRIBE',
                'HARD_BOUNCE',
                'SOFT_BOUNCE',
                'MANUAL_BLOCK',
                'SPAM_COMPLAINT',
                'INVALID_EMAIL'
              ]
            },
            reason: { type: 'string' },
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              value: { type: 'string' },
              suppression_type: { type: 'string' },
              created_at: { type: 'string' }
            }
          }
        }
      }
    },
    createGlobalSuppression
  );
  fastify.post(
    '/bulk-import',
    {
      schema: {
        tags: ['Global Suppressions'],
        summary: 'Bulk import global suppressions',
        description: 'Import multiple emails into suppression list',
        operationId: 'bulkImportGlobalSuppressions',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['values', 'suppression_type'],
          properties: {
            values: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1
            },
            suppression_type: {
              type: 'string',
              enum: [
                'UNSUBSCRIBE',
                'HARD_BOUNCE',
                'SOFT_BOUNCE',
                'MANUAL_BLOCK',
                'SPAM_COMPLAINT',
                'INVALID_EMAIL'
              ]
            },
            reason: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              inserted: { type: 'integer' },
              skipped: { type: 'integer' },
              total: { type: 'integer' }
            }
          }
        }
      }
    },
    bulkImportGlobalSuppressions
  );

  fastify.delete(
    '/bulk-delete',
    {
      schema: {
        tags: ['Global Suppressions'],
        summary: 'Bulk delete global suppressions',
        description: 'Delete multiple suppressed emails',
        operationId: 'bulkDeleteGlobalSuppressions',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['suppression_type'],
          properties: {
            search_text: {
              type: 'string',
              description: 'Optional text to search within values for deletion'
            },
            suppression_type: {
              type: 'string',
              enum: [
                'UNSUBSCRIBE',
                'HARD_BOUNCE',
                'SOFT_BOUNCE',
                'MANUAL_BLOCK',
                'SPAM_COMPLAINT',
                'INVALID_EMAIL'
              ]
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              deleted: { type: 'integer' }
            }
          }
        }
      }
    },
    bulkDeleteGlobalSuppressions
  );
}
