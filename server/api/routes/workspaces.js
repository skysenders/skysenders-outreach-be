// comman workspace api
import { createWorkspace } from '../../controller/workspaces/createWorkspace';
import { updateWorkspace } from '../../controller/workspaces/updateWorkspace';
import { updateWorkspaceGoals } from '../../controller/workspaces/updateWorkspaceGoals';
import { getWorkspaceLogoSignedUrl } from '../../controller/workspaces/getWorkspaceLogoSignedUrl';
import { getWorkspaceById, getWorkspaceBySlug, getWorkspaceByCustomDomainUrl } from '../../controller/workspaces/getWorkspaceById';
import { getAllWorkspaces } from '../../controller/workspaces/getAllWorkspaces';
import { deleteWorkspace } from '../../controller/workspaces/deleteWorkspace';

// team members
import { inviteWorkspaceClients } from '../../controller/workspaces/inviteWorkspaceClients';
import { updateWorkspaceClient } from '../../controller/workspaces/updateWorkspaceClient';
import { getWorkspaceClients } from '../../controller/workspaces/getWorkspaceMembers';
import { deleteWorkspaceClient } from '../../controller/workspaces/deleteWorkspaceClient';

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
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
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
              logo_bg_color: { type: 'string' },
              theme_color: { type: 'string' },
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
    '/:id/get-logo-signed-url',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get signed URL for uploading workspace logo',
        description: 'Returns a pre-signed S3 URL for uploading workspace logo image',
        operationId: 'getSignedUrlForWorkspaceLogo',
        hide: true,
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer', description: 'Workspace ID' }
          }
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
    '/:id',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by ID',
        description: 'Returns workspace details for the given workspace ID',
        operationId: 'getWorkspaceById',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'number', description: 'Workspace ID' },
          },
        },
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
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
              logo_bg_color: { type: 'string' },
              theme_color: { type: 'string' },
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

  // Route to get workspace details by slug
  fastify.get(
    '/details',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by slug',
        description: 'Returns workspace details for the given workspace slug',
        operationId: 'getWorkspaceBySlug',
        hide: true,
        querystring: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string', description: 'Workspace slug' },
          },
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
              logo_bg_color: { type: 'string' },
              theme_color: { type: 'string' },
              timezone: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
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
    getWorkspaceBySlug
  );

  // Route to get workspace details by custom domain url
  fastify.get(
    '/details-by-domain',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by custom domain url',
        description: 'Returns workspace details for the given custom domain url',
        operationId: 'getWorkspaceByCustomDomainUrl',
        hide: true,
        querystring: {
          type: 'object',
          required: ['custom_domain_url'],
          properties: {
            custom_domain_url: { type: 'string', description: 'Workspace custom domain url' },
          },
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
              logo_bg_color: { type: 'string' },
              theme_color: { type: 'string' },
              timezone: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
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
    getWorkspaceByCustomDomainUrl
  );

  // Route to get all workspaces associated to logged in user
  fastify.get(
    '/fetch-all',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get all workspaces for logged in user',
        description: 'Returns a list of all workspaces associated to the logged in user',
        operationId: 'getAllWorkspaces',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Workspaces retrieved successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                logo_url: { type: 'string' },
                logo_bg_color: { type: 'string' },
                theme_color: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' }
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
    '/:id',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update workspace details',
        description: 'Update workspace details like name, logo, timezone, team size etc.',
        operationId: 'updateWorkspace',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 150 },
            logo_url: { type: 'string' },
            logo_bg_color: { type: 'string' },
            theme_color: { type: 'string' },
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
              logo_bg_color: { type: 'string' },
              theme_color: { type: 'string' },
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
    '/:id/goals',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update workspace goals',
        description: 'Update workspace goals',
        operationId: 'updateWorkspaceGoals',
        hide: true,
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          },
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

  // Route to delete workspace
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete workspace',
        description: 'Delete a workspace and all its associated data',
        operationId: 'deleteWorkspace',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          },
        },
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
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
    deleteWorkspace
  );

  // Route to invite clients to workspace
  fastify.post('/:id/invite-clients',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Invite clients to workspace',
        description: 'Invite clients to join the workspace by sending them an email invitation',
        operationId: 'inviteWorkspaceClients',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          },
        },
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            clients: {
              type: 'array',
              minItems: 1,
              maxItems: 10,
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  role: {
                    type: 'string',
                    enum: ['ACCOUNT_MANAGER', 'INBOX_MANAGER', 'VIEWER']
                  },
                },
                required: ['email', 'name', 'password', 'role']
              }
            }
          },
          required: ['clients']
        },
        response: {
          200: {
            description: 'Workspace client invitations processed successfully',
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
    inviteWorkspaceClients
  );

  // Route for updating client detials or deactivate from workspace
  fastify.patch('/:id/clients/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update client details or deactivate client from workspace',
        description: 'API endpoint to update a client\'s details or deactivate their account in the workspace',
        operationId: 'updateWorkspaceClient',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' }
          },
          required: ['id', 'userId']
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            password: { type: 'string', minLength: 6 },
            role: {
              type: 'string',
              enum: ['ACCOUNT_MANAGER', 'INBOX_MANAGER', 'VIEWER']
            }
          }
        },
        response: {
          200: {
            description: 'Client updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            description: 'Client not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    updateWorkspaceClient
  );

  // Route to list clients of a workspace
  fastify.get('/:id/clients',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'List workspace clients',
        description: 'API endpoint to list all clients of a workspace',
        operationId: 'getWorkspaceClients',
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string', description: 'Text to search clients by name or email' },
          },
        },
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Workspace clients retrieved successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' }
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
    getWorkspaceClients
  );

  // Route to delete a client from workspace
  fastify.delete('/:id/clients/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete a client from workspace',
        description: 'API endpoint to delete a client from workspace',
        operationId: 'deleteWorkspaceClient',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' }
          },
          required: ['id', 'userId']
        },
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Client deleted successfully',
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
            description: 'Client not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    deleteWorkspaceClient
  );
}
