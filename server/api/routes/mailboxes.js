import { listMailboxes } from '../../controller/mailboxes/listMailboxes';
import { verifyAndCreateSMTPMailbox } from '../../controller/mailboxes/connect/connectSMTPMailbox';

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
  // Route to connect SMTP mailbox
  fastify.post(
    '/connect/smtp',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'Connect SMTP mailbox',
        description: 'Verify SMTP credentials and connect mailbox',
        operationId: 'connectSMTPMailbox',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['email', 'name', 'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_username', 'smtp_password', 'imap_host', 'imap_port', 'imap_secure', 'imap_username', 'imap_password'],
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            smtp_host: { type: 'string' },
            smtp_port: { type: 'number' },
            smtp_secure: { type: 'boolean' },
            smtp_username: { type: 'string' },
            smtp_password: { type: 'string' },
            imap_host: { type: 'string' },
            imap_port: { type: 'number' },
            imap_secure: { type: 'boolean' },
            imap_username: { type: 'string' },
            imap_password: { type: 'string' },
            different_reply_to: { type: 'boolean' },
            bcc_to_crm: { type: 'boolean' },
            sending_limit_per_day: { type: 'number' },
            minimum_time_gap_mins: { type: 'number' }
          }
        },
        response: {
          200: {
            description: 'Mailbox connected successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              mailbox: {
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
                }
              }
            }
          },
          400: {
            description: 'Invalid request or failed to connect mailbox',
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: true }
            }
          }
        }
      }
    },
    verifyAndCreateSMTPMailbox
  );
}
