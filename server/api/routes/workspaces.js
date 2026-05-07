// comman workspace api
import { createWorkspace } from '../../controller/workspaces/createWorkspace';
import { updateWorkspace } from '../../controller/workspaces/updateWorkspace';
import { updateWorkspaceGoals } from '../../controller/workspaces/updateWorkspaceGoals';
import { getWorkspaceLogoSignedUrl } from '../../controller/workspaces/getWorkspaceLogoSignedUrl';

// api key routes
import { generateNewAPIKey } from '../../controller/workspaces/generateNewAPIKey';
import { fetchAPIConsumedCountByAPIKey, fetchAPIRateLimitStatLeaderBoard, setWorkspaceApiCustomLimitToRedis } from '../../controller/workspaces/rateLimitAPIFetch';

export default async function workspaceRoutes(fastify) {

  // api to create workspace
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Workspace'],
        summary: 'Create workspace',
        description: 'Create a new workspace',
        operationId: 'createWorkspace',
        hide: true,
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', maxLength: 150 },
            slug: { type: 'string', maxLength: 150 },
            logo_url: { type: 'string' },
            timezone: { type: 'string', default: 'UTC' },
            team_size: { type: 'string' },
            goals: { type: 'array', items: { type: 'string' } }
          }
        },

        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              logo_url: { type: 'string' },
              timezone: { type: 'string' },
              team_size: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          },
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    createWorkspace
  );
  // Route to get signed URL for uploading workspace logo
  fastify.post(
    '/:workspaceId/get-logo-signed-url',
    {
      schema: {
        tags: ['Workspace'],
        summary: 'Get signed URL for uploading workspace logo',
        description: 'Returns a pre-signed S3 URL for uploading workspace logo image',
        operationId: 'getSignedUrlForWorkspaceLogo',
        hide: true,
        headers: {
          type: 'object',
          properties: {
            authorization: { type: 'string', description: 'Bearer token for authentication' }
          },
          required: [],
        },
        body: {
          type: 'object',
          required: ['filename', 'content_type'],
          properties: {
            filename: { type: 'string', description: 'File name of the logo' },
            content_type: { type: 'string', description: 'Content type of the logo image' },
          },
        },
        response: {
          200: {
            description: 'Signed URL generated successfully',
            type: 'object',
            properties: {
              request_url: { type: 'string' },
              file_url: { type: 'string' },
              filename: { type: 'string' },
            },
          },
          404: {
            description: 'Partner not found',
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
    },
    getWorkspaceLogoSignedUrl
  );

  // update workspace details
  fastify.put(
    '/:workspaceId',
    {
      schema: {
        tags: ['Workspace'],
        summary: 'Update workspace details',
        description: 'Update workspace details like name, logo, timezone, team size etc.',
        operationId: 'updateWorkspace',
        hide: true,
        params: {
          type: 'object',
          required: ['workspaceId'],
          properties: {
            workspaceId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 150 },
            logo_url: { type: 'string' },
            timezone: { type: 'string' },
            team_size: { type: 'string' }
          }
        },

        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              logo_url: { type: 'string' },
              timezone: { type: 'string' },
              team_size: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    updateWorkspace
  );

  // update workspace goals
  fastify.put(
    '/:workspaceId/goals',
    {
      schema: {
        tags: ['Workspace'],
        summary: 'Update workspace goals',
        description: 'Update workspace goals',
        operationId: 'updateWorkspaceGoals',
        hide: true,
        params: {
          type: 'object',
          required: ['workspaceId'],
          properties: {
            workspaceId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            goals: { type: 'array', items: { type: 'string' } }
          }
        },

        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              logo_url: { type: 'string' },
              timezone: { type: 'string' },
              team_size: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          },
          403: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    updateWorkspaceGoals
  );
  // generate api key route
  fastify.post(
    '/:workspaceId/generate-api-key',
    {
      schema: {
        tags: ['Auth'], // Group under "Auth" tag
        summary: 'Generate API key',
        description: 'API endpoint to create new API key',
        operationId: 'generateApiKey',
        hide: true,
        response: {
          200: {
            description: 'API key generated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          406: {
            description: 'Invalid request! Workspace not found!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    generateNewAPIKey
  );
  // find api rate limit leader board
  fastify.get('/redis/api-stats-leader-board', fetchAPIRateLimitStatLeaderBoard);

  // find api rate limit by api key
  fastify.get('/redis/api-limit-by-apikey', fetchAPIConsumedCountByAPIKey);

  // update workspace api rate limit
  fastify.post('/redis/:workspaceId/set-custom-rate-limit',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            auth: { type: 'string' }
          },
          required: ['auth']
        },
        body: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            custom_api_rate_limit: { type: 'number' }
          },
          required: ['user_id', 'custom_api_rate_limit']
        },
        response: {
          200: {
            description: 'User custom api rate limit updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized access',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, setWorkspaceApiCustomLimitToRedis);
}
