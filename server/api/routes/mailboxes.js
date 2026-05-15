import { listMailboxes } from '../../controller/mailboxes/listMailboxes';

export default async function mailboxRoutes(fastify) {

  /*
  --------------------------------------------------
  LIST MAILBOXES
  --------------------------------------------------
  */

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'List mailboxes',
        description: 'Fetch all mailboxes for a workspace',
        operationId: 'listMailboxes',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string', maxLength: 255 },
            provider: { type: 'string' },
            is_active: { type: 'boolean' },
            warmup_enabled: { type: 'boolean' },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: {type: 'integer', minimum: 1, maximum: 100, default: 20 }
          }
        },
        response: {
          200: {
            description: 'Mailboxes fetched successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                domain_id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
                provider: { type: 'string' },
                auth_type: { type: 'string' },
                is_authenticated: { type: 'boolean' },
                is_active: { type: 'boolean' },
                warmup_enabled: { type: 'boolean' },
                sending_limit_per_day: { type: 'number' },
                minimum_time_gap_mins: { type: 'number' },
                health_score: { type: 'number' },
                last_connected_at: { type: 'string' },
                last_sync_at: { type: 'string' },
                created_at: { type: 'string' }
              }
            }
          },
          500: {
            description: 'Failed to fetch mailboxes',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    listMailboxes
  );

}
