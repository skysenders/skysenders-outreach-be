// comman workspace api
import { createWorkspace } from '../../controller/workspaces/createWorkspace';
import { updateWorkspace } from '../../controller/workspaces/updateWorkspace';
import { updateWorkspaceGoals } from '../../controller/workspaces/updateWorkspaceGoals';
import { getWorkspaceLogoSignedUrl } from '../../controller/workspaces/getWorkspaceLogoSignedUrl';
import { getWorkspaceById, getWorkspaceBySlug } from '../../controller/workspaces/getWorkspaceById';
import { getAllWorkspaces } from '../../controller/workspaces/getAllWorkspaces';
import { deleteWorkspace } from '../../controller/workspaces/deleteWorkspace';

// team members
import { inviteWorkspaceMembers, resendInvitation } from '../../controller/workspaces/inviteWorkspaceMembers';
import { inviteWorkspaceClients } from '../../controller/workspaces/inviteWorkspaceClients';
import { joinWorkspaceWithToken, joinWorkspaceWithSlug } from '../../controller/workspaces/joinWorkspaceWithToken';
import { updateWorkspaceMember } from '../../controller/workspaces/updateWorkspaceMember';
import { updateWorkspaceClient } from '../../controller/workspaces/updateWorkspaceClient';
import { getWorkspaceMembers } from '../../controller/workspaces/getWorkspaceMembers';
import { leaveWorkspace } from '../../controller/workspaces/leaveWorkspace';
import { deleteWorkspaceMember } from '../../controller/workspaces/deleteWorkspaceMember';
import { deleteWorkspaceClient } from '../../controller/workspaces/deleteWorkspaceClient';

// api key routes
import { getWorkspaceApiKey } from '../../controller/workspaces/getWorkspaceApiKey';
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
    '/get-logo-signed-url',
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
    '/',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by ID',
        description: 'Returns workspace details for the given workspace ID',
        operationId: 'getWorkspaceById',
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

  // Route to get workspace details by id
  fastify.get(
    '/details',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Get workspace details by slug',
        description: 'Returns workspace details for the given workspace slug',
        operationId: 'getWorkspaceBySlug',
        hide: true,
        queryparam: {
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
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                logo_url: { type: 'string' },
                logo_bg_color: { type: 'string' },
                theme_color: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                is_active: { type: 'boolean' },
                invited_by: { type: 'integer' },
                invited_at: { type: 'string' },
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
    '/',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update workspace details',
        description: 'Update workspace details like name, logo, timezone, team size etc.',
        operationId: 'updateWorkspace',
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
    '/goals',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update workspace goals',
        description: 'Update workspace goals',
        operationId: 'updateWorkspaceGoals',
        hide: true,
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
    '/',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete workspace',
        description: 'Delete a workspace and all its associated data',
        operationId: 'deleteWorkspace',
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

  // invite team members to workspace
  fastify.post('/invite-members',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Invite team members to workspace',
        description: 'Invite team members to join the workspace by sending them an email invitation',
        operationId: 'inviteWorkspaceMembers',
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
                    enum: ['ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER']
                  },
                  re_invite: { type: 'boolean', description: 'Enable this to re-invite users with a "left" status' }
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

  // resend invitation to workspace team members
  fastify.post('/members/:userId/resend-invitation',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'resend invitation to workspace team members',
        description: 'Resend email invitation to the wrokspace exisiting team member',
        operationId: 'resendInvitationForTeamMember',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        },
        response: {
          200: {
            description: 'Invitation sent successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
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
          }
        }
      }
    },
    resendInvitation
  );

  // Route to invite clients to workspace
  fastify.post('/invite-clients',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Invite clients to workspace',
        description: 'Invite clients to join the workspace by sending them an email invitation',
        operationId: 'inviteWorkspaceClients',
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
                  password: { type: 'string', minLength: 6 }
                },
                required: ['email', 'name', 'password']
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

  // Route to invite clients to workspace
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

  // Route to join workspace with slug and user should be authenticated
  fastify.post('/join-with-slug',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Join workspace with slug',
        description: 'API endpoint to join workspace using workspace slug. User must be authenticated to use this endpoint',
        operationId: 'joinWorkspaceWithSlug',
        hide: true,
        body: {
          type: 'object',
          properties: {
            slug: { type: 'string' }
          },
          required: ['slug']
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
            description: 'Invalid request',
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
    }, joinWorkspaceWithSlug
  );

  // Update team member role or deactivate member
  fastify.patch('/members/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update team member role or deactivate member',
        description: 'API endpoint to update a team member\'s role or deactivate their account',
        operationId: 'updateWorkspaceMember',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        },
        body: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER']
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

  // Route for updating client detials or deactivate from workspace
  fastify.patch('/clients/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Update client details or deactivate client from workspace',
        description: 'API endpoint to update a client\'s details or deactivate their account in the workspace',
        operationId: 'updateWorkspaceClient',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            password: { type: 'string', minLength: 6 },
            is_active: { type: 'boolean' }
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

  // Route to list members of a workspace
  fastify.get('/members',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'List workspace members',
        description: 'API endpoint to list all members of a workspace',
        operationId: 'getWorkspaceMembers',
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string', description: 'Text to search members by name or email' },
            role: { type: 'array', items: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'INBOX_MANAGER', 'VIEWER', 'CLIENT'] }, description: 'Filter members by role' },
            status: { type: 'array', items: { type: 'string', enum: ['invitation_pending', 'invitation_accepted', 'invitation_expired', 'deleted', 'left'] }, description: 'Filter members by status' },
          },
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
                invited_by: { type: 'integer' },
                invited_at: { type: 'string' },
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
  fastify.delete('/members/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete a team member from workspace',
        description: 'API endpoint to delete a team member from workspace',
        operationId: 'deleteWorkspaceMember',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
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

  // Route to dleete a client from workspace
  fastify.delete('/clients/:userId',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Delete a client from workspace',
        description: 'API endpoint to delete a client from workspace',
        operationId: 'deleteWorkspaceClient',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
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

  // leave workspace
  fastify.post('/leave',
    {
      schema: {
        tags: ['Workspaces'],
        summary: 'Leave workspace',
        description: 'API endpoint for a member to leave the workspace',
        operationId: 'leaveWorkspace',
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

  // get workspace api key
  fastify.get(
    '/api-key',
    {
      schema: {
        tags: ['Workspaces'], // Group under "Auth" tag
        summary: 'Get workspace API key',
        description: 'API endpoint to fetch workspace API key',
        operationId: 'getWorkspaceApiKey',
        hide: true,
        response: {
          200: {
            description: 'API key retrieved successfully',
            type: 'object',
            properties: {
              api_key: { type: 'string' },
              api_key_created_at: { type: 'string', format: 'date-time' },
              custom_api_rate_limit: { type: 'number' }
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
    },
    getWorkspaceApiKey
  );

  // generate api key route
  fastify.post(
    '/generate-api-key',
    {
      schema: {
        tags: ['Workspaces'], // Group under "Workspaces" tag
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
              api_key: { type: 'string' }
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
  fastify.post('/redis/set-custom-rate-limit',
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
