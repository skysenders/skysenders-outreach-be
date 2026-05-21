import { listMailboxes } from '../../controller/mailboxes/listMailboxes';
import { fetchMailboxById } from '../../controller/mailboxes/fetchMailboxById';
import { updateMailboxById, bulkUpdateMailboxes } from '../../controller/mailboxes/updateMailboxes';
// connect and save smtp mailbox
import { verifyAndCreateSMTPMailbox } from '../../controller/mailboxes/connect/connectSMTPMailbox';
// google mailbox oauth
import { getGoogleAuthorizeUrl, handleGoogleOAuthCallback } from '../../controller/mailboxes/connect/connectGoogleMailbox';
// microsoft mailbox oauth
import { getOutlookAuthorizeUrl, handleOutlookOAuthCallback } from '../../controller/mailboxes/connect/connectMicrosoftMailbox';

export default async function mailboxRoutes(fastify) {

  // list mailboxes with search and filters
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
  // fetch mailbox by id
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'Fetch mailbox by ID',
        description: 'Fetch mailbox details by ID',
        operationId: 'fetchMailboxById',
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
            description: 'Mailbox fetched successfully',
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
              created_at: { type: 'string' },
              smtp_host: { type: 'string' },
              smtp_port: { type: 'number' },
              smtp_username: { type: 'string' },
              smtp_password: { type: 'string' },
              smtp_secure: { type: 'boolean' },
              imap_host: { type: 'string' },
              imap_port: { type: 'number' },
              imap_username: { type: 'string' },
              imap_password: { type: 'string' },
              imap_secure: { type: 'boolean' }
            }
          },
          404: {
            description: 'Mailbox not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          500: {
            description: 'Failed to fetch mailbox',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    fetchMailboxById
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

  // route to connect gmail account with redirect to authorized url
  fastify.get(
    '/connect/gmail',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'connect Gmail mailbox',
        description: 'API endpoint to connect Gmail mailbox using OAuth',
        operationId: 'connectGmailMailbox',
        hide: true,
        response: {
          // redirect response will not be handled by fastify, but we can document the expected response for better API documentation
          302: {
            description: 'Redirect to Google for authentication',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, getGoogleAuthorizeUrl
  );

  // route to handle google oauth callback
  fastify.get(
    '/connect/gmail/callback',
    {
      schema: {
        tags: ['Mailboxes'], // Group under "Product" tag
        summary: 'connect gmail account callback',
        description: 'API endpoint to handle Google OAuth callback and connect Gmail mailbox',
        operationId: 'handleGoogleOAuthCallback',
        hide: true,
        querystring: {
          type: 'object',
          required: ['code', 'state'],
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
          },
        },
        response: {
          302: {
            description: 'Redirect to frontend with success or error message after handling Google OAuth callback',
            type: 'object',
            properties: {
              message: { type: 'string' },
              mailbox_id: { type: 'number' },
              email: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, handleGoogleOAuthCallback
  );

  // Route to connect outlook account with redirect to authorized url
  fastify.get(
    '/connect/outlook',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'connect Outlook mailbox',
        description: 'API endpoint to connect Outlook mailbox using OAuth',
        operationId: 'connectOutlookMailbox',
        hide: true,
        response: {
          // redirect response will not be handled by fastify, but we can document the expected response for better API documentation
          302: {
            description: 'Redirect to Microsoft for authentication',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, getOutlookAuthorizeUrl
  );

  // Route to handle outlook oauth callback
  fastify.get(
    '/connect/outlook/callback',
    {
      schema: {
        tags: ['Mailboxes'], // Group under "Product" tag
        summary: 'connect Outlook account callback',
        description: 'API endpoint to handle Microsoft OAuth callback and connect Outlook mailbox',
        operationId: 'handleOutlookOAuthCallback',
        hide: true,
        querystring: {
          type: 'object',
          required: ['code', 'state'],
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
          },
        },
        response: {
          302: {
            description: 'Redirect to frontend with success or error message after handling Microsoft OAuth callback',
            type: 'object',
            properties: {
              message: { type: 'string' },
              mailbox_id: { type: 'number' },
              email: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, handleOutlookOAuthCallback
  );

  // Route to update mailbox by id
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'Update mailbox by ID',
        description: 'Update mailbox details by ID',
        operationId: 'updateMailboxById',
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
            name: { type: 'string' },
            is_active: { type: 'boolean' },
            warmup_enabled: { type: 'boolean' },
            sending_limit_per_day: { type: 'number' },
            minimum_time_gap_mins: { type: 'number' }
          }
        },
        response: {
          200: {
            description: 'Mailbox updated successfully',
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
          },
          400: {
            description: 'Invalid request or failed to update mailbox details',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          },
          404: {
            description: 'Mailbox not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          },
          500: {
            description: 'Failed to update mailbox details',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          }
        }
      },
    }, updateMailboxById
  );

  // Route to bulk update mailboxes
  fastify.put(
    '/',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'Bulk update mailboxes',
        description: 'Bulk update mailbox details based on filters',
        operationId: 'bulkUpdateMailboxes',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                mailbox_ids: { type: 'array', items: { type: 'number' } },
                search_text: { type: 'string', maxLength: 255 },
                provider: { type: 'string' },
                is_active: { type: 'boolean' },
                warmup_enabled: { type: 'boolean' },
              },
            },
            update_fields: {
              type: 'object',
              properties: {
                is_active: { type: 'boolean' },
                warmup_enabled: { type: 'boolean' },
                sending_limit_per_day: { type: 'number' },
                minimum_time_gap_mins: { type: 'number' }
              },
            },
          },
        },
        response: {
          200: {
            description: 'Mailboxes updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          400: {
            description: 'Invalid request or failed to update mailboxes',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          },
          500: {
            description: 'Failed to update mailboxes',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          }
        },
      },
    }, bulkUpdateMailboxes
  );
}
