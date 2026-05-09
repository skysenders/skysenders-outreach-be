// comman workspace api
import { createWorkspace } from '../../controller/workspaces/createWorkspace';
import { updateWorkspace } from '../../controller/workspaces/updateWorkspace';
import { updateWorkspaceGoals } from '../../controller/workspaces/updateWorkspaceGoals';
import { getWorkspaceLogoSignedUrl } from '../../controller/workspaces/getWorkspaceLogoSignedUrl';
import { getWorkspaceById } from '../../controller/workspaces/getWorkspaceById';
import { getAllWorkspaces } from '../../controller/workspaces/getAllWorkspaces';

// team members
import { inviteWorkspaceMembers } from '../../controller/workspaces/inviteWorkspaceMembers';
import { joinWorkspaceWithToken } from '../../controller/workspaces/joinWorkspaceWithToken';
import { updateWorkspaceMember } from '../../controller/workspaces/updateWorkspaceMember';
import { getWorkspaceMembers } from '../../controller/workspaces/getWorkspaceMembers';
import { leaveWorkspace } from '../../controller/workspaces/leaveWorkspace';
import { deleteWorkspaceMember } from '../../controller/workspaces/deleteWorkspaceMember';

// api key routes
import { generateNewAPIKey } from '../../controller/workspaces/generateNewAPIKey';
import { fetchAPIConsumedCountByAPIKey, fetchAPIRateLimitStatLeaderBoard, setWorkspaceApiCustomLimitToRedis } from '../../controller/workspaces/rateLimitAPIFetch';

export default async function workspaceRoutes(fastify) {

  // api to create workspace
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Workspaces'],
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
        tags: ['Workspaces'],
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

  // Route to get workspace details by id
  fastify.get(
    '/:workspaceId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by ID',
        description: 'Returns workspace details for the given workspace ID',
        operationId: 'getWorkspaceById',
        params: {
          type: 'object',
          required: ['workspaceId'],
          properties: {
            workspaceId: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Workspace details retrieved successfully',
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
            description: 'Forbidden access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Workspace not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    getWorkspaceById
  );

  // Route to get all workspaces associated to logged in user
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get all workspaces for logged in user',
        description: 'Returns a list of all workspaces associated to the logged in user',
        operationId: 'getAllWorkspaces',
        headers: {
          type: 'object',
          properties: {
            authorization: { type: 'string', description: 'Bearer token for authentication' }
          },
          required: [],
        },
        response: {
          200: {
            description: 'Workspaces retrieved successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                workspace_id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                logo_url: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                is_active: { type: 'boolean' },
                joined_at: { type: 'string', format: 'date-time' }
              }
            }
          },
          403: {
            description: 'Forbidden access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    getAllWorkspaces
  );

  // update workspace details
  fastify.put(
    '/:workspaceId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update workspace details',
        description: 'Update workspace details like name, logo, timezone, team size etc.',
        operationId: 'updateWorkspace',
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
        tags: ['Workspaces'],
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

  // invite team members to workspace
  fastify.post('/:workspaceId/invite-members',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Invite team members to workspace',
        description: 'Invite team members to join the workspace by sending them an email invitation',
        operationId: 'inviteWorkspaceMembers',
        params: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' }
          },
          required: ['workspaceId']
        },
        body: {
          type: 'object',
          properties: {
            members: {
              type: 'array',
              minItems: 1,
              maxItems: 10,
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER', 'CLIENT']
                  }
                },
                required: ['email', 'name', 'role']
              }
            }
          },
          required: ['members']
        },
        response: {
          200: {
            description: 'Workspace invitations processed successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  invited: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        email: { type: 'string' },
                        status: { type: 'string' }
                      }
                    }
                  },
                  failed: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        email: { type: 'string' },
                        reason: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Workspace not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          422: {
            description: 'Validation failed',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    inviteWorkspaceMembers
  );

  // Route to join workspace with token
  fastify.post('/join',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Join workspace with token',
        description: 'API endpoint to join workspace using invitation token',
        operationId: 'joinWorkspaceWithToken',
        hide: true,
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          },
          required: ['token']
        },
        response: {
          200: {
            description: 'Joined workspace successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Invalid or expired token',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Workspace not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, joinWorkspaceWithToken
  );

  // Update team member role or deactivate member
  fastify.patch('/:workspaceId/members/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update team member role or deactivate member',
        description: 'API endpoint to update a team member\'s role or deactivate their account',
        operationId: 'updateWorkspaceMember',
        params: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
            userId: { type: 'string' }
          },
          required: ['workspaceId', 'userId']
        },
        body: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER', 'CLIENT']
            },
            is_active: { type: 'boolean' }
          }
        },
        response: {
          200: {
            description: 'Member updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Member not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    updateWorkspaceMember
  );

  // Route to list members of a workspace
  fastify.get('/:workspaceId/members',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'List workspace members',
        description: 'API endpoint to list all members of a workspace',
        operationId: 'getWorkspaceMembers',
        params: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' }
          },
          required: ['workspaceId']
        },
        response: {
          200: {
            description: 'Workspace members retrieved successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                is_active: { type: 'boolean' },
                joined_at: { type: 'string', format: 'date-time' }
              }
            }
          },
          403: {
            description: 'Forbidden access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Workspace not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    getWorkspaceMembers
  );

  // delete a team member from workspace
  fastify.delete('/:workspaceId/members/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete a team member from workspace',
        description: 'API endpoint to delete a team member from workspace',
        operationId: 'deleteWorkspaceMember',
        params: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' },
            userId: { type: 'string' }
          },
          required: ['workspaceId', 'userId']
        },
        response: {
          200: {
            description: 'Member deleted successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Member not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    deleteWorkspaceMember
  );

  // leave workspace
  fastify.post('/:workspaceId/leave',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Leave workspace',
        description: 'API endpoint for a member to leave the workspace',
        operationId: 'leaveWorkspace',
        params: {
          type: 'object',
          properties: {
            workspaceId: { type: 'string' }
          },
          required: ['workspaceId']
        },
        response: {
          200: {
            description: 'Successfully left the workspace',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          403: {
            description: 'Forbidden access',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Member not found in this workspace',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    leaveWorkspace
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
  fastify.get('/redis/api-stats-leader-board', {
    schema: {
      hide: true,
    }
  }, fetchAPIRateLimitStatLeaderBoard);

  // find api rate limit by api key
  fastify.get('/redis/api-limit-by-apikey', {
    schema: {
      hide: true,
    }
  }, fetchAPIConsumedCountByAPIKey);

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
        hide: true,
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
