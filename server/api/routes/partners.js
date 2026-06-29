// partners
import { partnerLogin } from '../../controller/partners/partnerLogin';
import { createPartner } from '../../controller/partners/partnerSignup';
import { refreshPartnerToken } from '../../controller/partners/refreshPartnerToken';
import { logoutPartner } from '../../controller/partners/logoutPartner';
import { updatePartnerBranding } from '../../controller/partners/updatePartnerBranding';
import { getSignedUrlForPartnerLogo, getSignedUrlForPartnerFavicon } from '../../controller/partners/partnerBrandingSignedUrl';
import { getPartnerBranding, getPublicPartnerBranding } from '../../controller/partners/fetchPartnerBranding';
import { getPartnerCustomScripts, getPartnerPublicCustomScripts } from '../../controller/partners/fetchPartnerCustomScripts';
import { addOrUpdatePartnerCustomScript } from '../../controller/partners/addOrUpdatePartnerCustomScript';
import { deletePartnerCustomScript } from '../../controller/partners/deletePartnerCustomScript';

// partner special apis
import { createUserForPartner } from '../../controller/users/signup';
import { getAllWorkspacesByPartner } from '../../controller/workspaces/getAllWorkspaces';
import { createWorkspaceByPartner } from '../../controller/workspaces/createWorkspace';
import { updateWorkspaceByPartner } from '../../controller/workspaces/updateWorkspace';


export default async function authRoutes(fastify) {
  // Partner Login route
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Partner login',
        description: 'API endpoint to login a partner',
        operationId: 'partnerLogin',
        hide: true,
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
            password: { type: 'string', maxLength: 100 },
          },
        },
        response: {
          200: {
            description: 'Login successful',
            type: 'object',
            properties: {
              partner: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uuid: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string' },
                  company_name: { type: 'string' },
                  company_url: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              },
              token: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  refresh_token: { type: 'string' },
                  access_token_expiries_at: { type: 'string', format: 'date-time' },
                  refresh_token_expiries_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Partner not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          406: {
            description: 'Partner not verified',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    partnerLogin
  );

  // Partners signup route
  fastify.post(
    '/signup',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Partner signup',
        description: 'API endpoint to register a new partner',
        operationId: 'partnerSignup',
        hide: true,
        body: {
          type: 'object',
          required: ['name', 'email', 'password', 'customer_portal_domain_url'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              minLength: 5,
              maxLength: 100,
            },
            customer_portal_domain_url: { type: 'string', maxLength: 200 },
            name: { type: 'string', maxLength: 100 },
            password: { type: 'string', maxLength: 30 },
            company_name: { type: 'string', maxLength: 100 },
            company_url: { type: 'string', maxLength: 100 },
          },
        },
        response: {
          201: {
            description: 'Partner created',
            type: 'object',
            properties: {
              partner: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                  uuid: { type: 'string' },
                  id: { type: 'number' },
                  status: { type: 'string' },
                  company_name: { type: 'string' },
                  company_url: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              }
            },
          },
          403: {
            description: 'Partner already exists',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    createPartner
  );

  // refresh partner refresh token route
  fastify.post(
    '/refresh-token',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Refresh Partner Token',
        description: 'API endpoint for partners to refresh their authentication token',
        operationId: 'refreshPartnerToken',
        hide: true,
        body: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string' }
          }
        },
        response: {
          200: {
            description: 'Token refreshed successfully',
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              refresh_token: { type: 'string' },
              access_token_expiries_at: { type: 'string', format: 'date-time' },
              refresh_token_expiries_at: { type: 'string', format: 'date-time' },
            }
          },
          401: {
            description: 'Invalid refresh token',
            type: 'object',
            properties: {
              message: { type: 'string' },
            }
          }
        }
      }
    },
    refreshPartnerToken
  );

  // logout partner session by revoking the refresh token
  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Logout Partner',
        description: 'API endpoint for partners to logout and revoke their session',
        operationId: 'logoutPartner',
        hide: true,
        body: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string' }
          }
        }
      }
    },
    logoutPartner
  );

  // Partner branding update route
  fastify.put(
    '/branding',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Update Partner Branding',
        description: 'API endpoint for partners to update branding settings',
        operationId: 'updatePartnerBranding',
        hide: true,
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            primary_color: { type: 'string' },
            secondary_color: { type: 'string' },
            dark_text_color: { type: 'string' },
            light_text_color: { type: 'string' },
            fav_icon_url: {
              anyOf: [
                { type: 'string', format: 'uri' }, // valid URI
                { type: 'string', maxLength: 0 } // empty string
              ]
            },
            logo_url: {
              anyOf: [
                { type: 'string', format: 'uri' }, // valid URI
                { type: 'string', maxLength: 0 } // empty string
              ]
            },
          },
        },
        response: {
          200: {
            description: 'Branding updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              branding: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  partner_id: { type: 'number' },
                  name: { type: 'string' },
                  customer_portal_domain_url: { type: 'string' },
                  primary_color: { type: 'string' },
                  secondary_color: { type: 'string' },
                  dark_text_color: { type: 'string' },
                  light_text_color: { type: 'string' },
                  fav_icon_url: { type: 'string', format: 'uri' },
                  logo_url: { type: 'string', format: 'uri' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          400: {
            description: 'Invalid input',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updatePartnerBranding
  );
  // Route to get signed URL for uploading partner logo
  fastify.post(
    '/get-logo-signed-url',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Get signed URL for uploading partner logo',
        description: 'Returns a pre-signed S3 URL for uploading partner logo image',
        operationId: 'getSignedUrlForPartnerLogo',
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
    getSignedUrlForPartnerLogo
  );

  // Route to get signed URL for uploading partner favicon
  fastify.post(
    '/get-favicon-signed-url',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Get signed URL for uploading partner favicon',
        description: 'Returns a pre-signed S3 URL for uploading partner favicon',
        operationId: 'getSignedUrlForPartnerFavicon',
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
            filename: { type: 'string', description: 'File name of the favicon' },
            content_type: { type: 'string', description: 'Content type of the favicon image' },
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
    getSignedUrlForPartnerFavicon
  );
  fastify.get(
    '/branding',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Fetch partner branding',
        description: 'Returns branding settings such as logo, favicon, and color configurations for a partner',
        operationId: 'getPartnerBranding',
        hide: true,
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string', description: 'API key for authentication' },
          },
          required: [],
        },
        response: {
          200: {
            description: 'Partner branding fetched successfully',
            type: 'object',
            properties: {
              id: { type: 'number' },
              partner_id: { type: 'number' },
              name: { type: 'string' },
              customer_portal_domain_url: { type: 'string' },
              primary_color: { type: 'string' },
              secondary_color: { type: 'string' },
              dark_text_color: { type: 'string' },
              light_text_color: { type: 'string' },
              fav_icon_url: { type: 'string', format: 'uri' },
              logo_url: { type: 'string', format: 'uri' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
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
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    getPartnerBranding
  );
  // Fetch partner custom scripts
  fastify.get(
    '/custom-scripts',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Fetch partner custom scripts',
        description: 'Returns custom JavaScript snippets or configurations injected by the partner',
        operationId: 'getPartnerCustomScripts',
        hide: true,
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string', description: 'API key for authentication' },
          },
          required: [],
        },
        response: {
          200: {
            description: 'Partner custom scripts fetched successfully',
            type: 'object',
            properties: {
              scripts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    partner_id: { type: 'number' },
                    name: { type: 'string' },
                    placement: { type: 'string' },
                    status: { type: 'string' },
                    script: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
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
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    getPartnerCustomScripts
  );
  // Fetch partner custom scripts (public, by partner domain)
  fastify.get(
    '/custom-scripts/public',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Fetch partner public custom scripts',
        description: 'Returns custom JavaScript snippets or configurations injected by the partner',
        operationId: 'getPartnerPublicCustomScripts',
        hide: 'true',
        querystring: {
          type: 'object',
          properties: {
            partner_id: { type: 'number', description: 'ID of the partner' },
          },
          required: ['partner_id'],
        },
        response: {
          200: {
            description: 'Partner custom scripts fetched successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              scripts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    partner_id: { type: 'number' },
                    name: { type: 'string' },
                    placement: { type: 'string' },
                    status: { type: 'string' },
                    script: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
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
    getPartnerPublicCustomScripts
  );
  // Add or update partner custom script
  fastify.post(
    '/custom-scripts',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Add or update partner custom script',
        description: 'Adds a new custom script if ID is not present, updates if ID is passed.',
        operationId: 'addOrUpdatePartnerCustomScript',
        hide: true,
        body: {
          type: 'object',
          required: ['name', 'placement', 'script', 'status'],
          properties: {
            id: { type: 'number', description: 'Script ID (if updating)' },
            name: { type: 'string', description: 'Script name' },
            placement: { type: 'string', description: 'Script placement' },
            status: { type: 'string', description: 'Script status' },
            script: { type: 'string', description: 'Custom script content' }
          },
        },
        response: {
          200: {
            description: 'Script added/updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              script: { type: 'object', properties: {
                id: { type: 'number' },
                partner_id: { type: 'number' },
                name: { type: 'string' },
                placement: { type: 'string' },
                status: { type: 'string' },
                script: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
              },
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
    },
    addOrUpdatePartnerCustomScript
  );

  // Route to delete custom scripts
  fastify.delete(
    '/custom-scripts/:id',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Delete partner custom script',
        description: 'Deletes a custom script for a partner by ID.',
        operationId: 'deletePartnerCustomScript',
        hide: true,
        params: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Script ID' },
          },
          required: ['id'],
        },
        response: {
          200: {
            description: 'Script deleted successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Script not found',
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
    deletePartnerCustomScript
  );

  // public route to fetch partner branding by domian
  fastify.get(
    '/branding/public',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Fetch partner branding by domain',
        description: 'Returns branding settings for a partner based on the provided domain',
        operationId: 'getPartnerBrandingByDomain',
        hide: 'true',
        querystring: {
          type: 'object',
          properties: {
            domain: { type: 'string', description: 'Domain of the partner' },
          },
          required: ['domain'],
        },
        response: {
          200: {
            description: 'Partner branding fetched successfully',
            type: 'object',
            properties: {
              partner_id: { type: 'number' },
              name: { type: 'string' },
              primary_color: { type: 'string' },
              secondary_color: { type: 'string' },
              dark_text_color: { type: 'string' },
              light_text_color: { type: 'string' },
              fav_icon_url: { type: 'string', format: 'uri' },
              logo_url: { type: 'string', format: 'uri' },
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
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    getPublicPartnerBranding
  );

  // Route to create a new user for a partner
  fastify.post(
    '/create-new-user',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Create a new user for a partner',
        description: 'Creates a new user associated with the authenticated partner',
        operationId: 'createUserForPartner',
        hide: true,
        headers: {
          type: 'object',
          required: ['x-partner-key'],
          properties: {
            'x-partner-key': { type: 'string', description: 'API key for authentication' },
          },
        },
        body: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email of the new user' },
            name: { type: 'string', description: 'Name of the new user' },
            password: { type: 'string', description: 'Password for the new user' },
          },
        },
        response: {
          201: {
            description: 'User created successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                  account_id: { type: 'number' },
                  profile_url: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          403: {
            description: 'Forbidden',
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
    createUserForPartner
  );
  // api to create workspace
  fastify.post(
    '/workspace',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Create workspace by partner',
        description: 'Create a new workspace associated with the authenticated partner',
        operationId: 'createWorkspaceByPartner',
        headers: {
          type: 'object',
          required: ['x-partner-key'],
          properties: {
            'x-partner-key': { type: 'string', description: 'API key for authentication' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            account_id: { type: 'number', description: 'Account ID for the workspace' },
          },
          required: ['account_id'],
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
              id: { type: 'number' },
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
    createWorkspaceByPartner
  );
  // update workspace details
  fastify.put(
    '/workspace/update',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Update workspace details by partner',
        description: 'Update workspace details like name, logo, timezone, team size etc.',
        operationId: 'updateWorkspaceByPartner',
        querystring: {
          type: 'object',
          properties: {
            account_id: { type: 'number', description: 'Account ID for the workspace' },
          },
          required: ['account_id'],
        },
        body: {
          type: 'object',
          properties: {
            id: { type: 'number' },
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
              id: { type: 'number' },
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
    updateWorkspaceByPartner
  );
  // Route to get all workspaces associated to the account by partner
  fastify.get(
    '/workspace/all',
    {
      schema: {
        tags: ['Partners'],
        summary: 'Get all workspaces by partner',
        description: 'Returns a list of all workspaces associated to the account by partner',
        operationId: 'getAllWorkspacesByPartner',
        querystring: {
          type: 'object',
          properties: {
            account_id: { type: 'integer', description: 'Account ID for the workspace' },
          },
          required: ['account_id'],
        },
        response: {
          200: {
            description: 'Workspaces retrieved successfully',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
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
    getAllWorkspacesByPartner
  );
}
