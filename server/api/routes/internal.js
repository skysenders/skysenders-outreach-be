// mailboxes
import { fetchMailboxDetailsById } from '../../controller/internal/mailboxes/fetchMailboxDetailsById';
import { fetchRandomWarmupMailbox } from '../../controller/internal/mailboxes/fetchRandomWarmupMailbox';
import { updateMailboxWarmupStatus } from '../../controller/internal/mailboxes/updateMailboxWarmupStatus';
import { handleSenderFailureErrors,
  handleImapFailureErrors, resetMailboxDisconnectStatus } from '../../controller/internal/mailboxes/handleMailboxErrors';
import { updateMailboxLastFetchUuid } from '../../controller/internal/mailboxes/updateMailboxLastFetchUuid';
import { fetchMailboxesForSync } from '../../controller/internal/mailboxes/fetchMailboxesForSync';
// google mailbox oauth
import { handleGoogleOAuthCallback } from '../../controller/mailboxes/connect/connectGoogleMailbox';
// microsoft mailbox oauth
import { handleOutlookOAuthCallback } from '../../controller/mailboxes/connect/connectMicrosoftMailbox';
// fetch mailbox internal
import { listMailboxesInternal } from '../../controller/mailboxes/listMailboxes';

export default async function internalRoutes(fastify) {
  // mailboxes
  // fetch mailbox details
  fastify.get(
    '/fetch-mailbox-details-by-id',
    {
      schema: {
        tags: ['Internal'],
        summary: 'API to fetch mailbox details by ID',
        description: 'fetch mailbox details by ID',
        operationId: 'fetchMailboxDetailsById',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token', 'workspace_id', 'mailbox_id'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
            workspace_id: {
              type: 'integer',
              description: 'Workspace ID to identify which workspace the mailbox belongs to'
            },
            mailbox_id: {
              type: 'integer',
              description: 'ID of the warmup account'
            },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    fetchMailboxDetailsById
  );

  // fetch random email account from the warmup pool
  fastify.get(
    '/fetch-random-warmup-mailbox',
    {
      schema: {
        tags: ['Internal'],
        summary: 'API to fetch random warmup mailbox',
        description: 'fetch random warmup mailbox',
        operationId: 'fetchRandomWarmupMailbox',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
            mailbox_id: {
              type: 'integer',
              description: 'ID of the warmup account to exclude from the random selection'
            }
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    fetchRandomWarmupMailbox
  );
  // handle imap failure errors
  fastify.post(
    '/handle-imap-failure-errors',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Handle imap failure errors',
        description: 'Handle imap failure errors and update the mailbox status accordingly',
        operationId: 'handleImapFailureErrors',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        body: {
          type: 'object',
          required: [ 'partner_id', 'workspace_id', 'mailbox_id', 'disconnect_stage', 'disconnect_reason' ],
          properties: {
            partner_id: { type: 'integer' },
            workspace_id: { type: 'integer' },
            mailbox_id: { type: 'integer' },
            disconnect_stage: { type: 'string' },
            disconnect_reason: { type: 'string' },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    handleImapFailureErrors
  );
  // handle sender failure errors
  fastify.post(
    '/handle-sender-failure-errors',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Handle sender failure errors',
        description: 'Handle sender failure errors and update the mailbox status accordingly',
        operationId: 'handleSenderFailureErrors',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        body: {
          type: 'object',
          required: [ 'partner_id', 'workspace_id', 'mailbox_id', 'disconnect_stage', 'disconnect_reason' ],
          properties: {
            partner_id: { type: 'integer' },
            workspace_id: { type: 'integer' },
            mailbox_id: { type: 'integer' },
            disconnect_stage: { type: 'string' },
            disconnect_reason: { type: 'string' },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    handleSenderFailureErrors
  );

  // Route to update mailbox last fetch uid
  fastify.post(
    '/update-mailbox-last-fetch-uid',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Update mailbox last fetch uid',
        description: 'Update the last fetch uid for a mailbox',
        operationId: 'updateMailboxLastFetchUid',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        body: {
          type: 'object',
          required: [ 'mailbox_id' ],
          properties: {
            mailbox_id: { type: 'integer' },
            last_tracking_details: { type: 'object' },
            last_checked_at: { type: 'string' },
            sync_status: { type: 'string' },
            error_message: { type: 'string' },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateMailboxLastFetchUuid
  );

  // Route to reset mailbox disconnect status
  fastify.post(
    '/reset-mailbox-disconnect-status',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Reset mailbox disconnect status',
        description: 'Reset the disconnect status for a mailbox',
        operationId: 'resetMailboxDisconnectStatus',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        body: {
          type: 'object',
          required: [ 'workspace_id', 'mailbox_id' ],
          properties: {
            workspace_id: { type: 'integer' },
            mailbox_id: { type: 'integer' },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    resetMailboxDisconnectStatus
  );
  // sync mailboxes for tracking replies
  fastify.post(
    '/sync-mailbox-for-tracking-replies',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Sync mailbox for tracking replies',
        description: 'Sync mailbox for tracking replies and update the last fetch uid',
        operationId: 'syncMailboxForTrackingReplies',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        response: {
          200: {
            description: '',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, fetchMailboxesForSync);
  // ROute to update mailbox warmup status
  fastify.post(
    '/update-mailbox-warmup-status',
    {
      schema: {
        tags: ['Internal'],
        summary: 'Update mailbox warmup status',
        description: 'Update the warmup status for a mailbox',
        operationId: 'updateMailboxWarmupStatus',
        hide: true,
        querystring: {
          type: 'object',
          required: ['auth-token'],
          properties: {
            'auth-token': {
              type: 'string',
              description: 'Authentication token required to authorize this request'
            },
          },
        },
        body: {
          type: 'object',
          required: [ 'mailbox_id', 'status' ],
          properties: {
            mailbox_id: { type: 'integer' },
            status: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Mailbox updated successfully.',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateMailboxWarmupStatus
  );
  // route to handle google oauth callback
  fastify.get(
    '/mailboxes/connect/gmail/callback',
    {
      schema: {
        tags: ['Internal'], // Group under "Internal" tag
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
  // Route to handle outlook oauth callback
  fastify.get(
    '/mailboxes/connect/outlook/callback',
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
  // list mailboxes with search and filters
  fastify.get(
    '/mailboxes/fetch-all',
    {
      schema: {
        tags: ['Mailboxes'],
        summary: 'List mailboxes for internal use',
        description: 'Fetch all mailboxes for a workspace for internal use',
        operationId: 'listMailboxesInternal',
        hide: true,
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          required: ['workspace_id'],
          properties: {
            workspace_id: { type: 'number' },
            domain_id: { type: 'number' },
            search_text: { type: 'string', maxLength: 255 },
            mailbox_ids: { type: 'string' },
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
                email: { type: 'string' },
                provider: { type: 'string' },
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
    listMailboxesInternal
  );
}
