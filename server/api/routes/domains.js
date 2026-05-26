import { listDomains } from '../../controller/domains/listDomains';
import { getDomainById } from '../../controller/domains/getDomainById';
import { updateDomainDetails } from '../../controller/domains/updateDomainDetails';
import { deleteDomainById, bulkDeleteDomains } from '../../controller/domains/deleteDomainById';
import { checkDomainDns } from '../../controller/domains/checkDomainDns';

// cosntants
import { MAILBOX_TYPE } from '../../config/constants';

export default async function domainsRoutes(fastify) {

  /*
  LIST DOMAINS
  */
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Domains'],
        summary: 'List domains',
        description: 'Fetch all domains for a workspace',
        operationId: 'listDomains',
        headers: {
          type: 'object',
          properties: {
            apikey: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            search_text: { type: 'string' },
            provider: { type: 'string', enum: Object.values(MAILBOX_TYPE) },
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', maximum: 100, default: 20 }
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
                    domain_name: { type: 'string' },
                    is_verified: { type: 'boolean' },
                    provider: { type: 'string' },
                    health_score: { type: 'number' },
                    spf_pass: { type: 'boolean' },
                    dkim_pass: { type: 'boolean' },
                    dmarc_pass: { type: 'boolean' },
                    mx_pass: { type: 'boolean' },
                    tracking_domain_pass: { type: 'boolean' },
                    created_at: { type: 'string' },
                    dns_last_checked_at: { type: 'string' },
                    dns_errors: { type: 'object', additionalProperties: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    listDomains
  );

  /*
  GET DOMAIN BY ID
  */
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Domains'],
        summary: 'Get domain by ID',
        description: 'Fetch a single domain by ID for the current workspace',
        operationId: 'getDomainById',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              domain_name: { type: 'string' },
              is_verified: { type: 'boolean' },
              provider: { type: 'string' },
              health_score: { type: 'number' },
              spf_pass: { type: 'boolean' },
              dkim_pass: { type: 'boolean' },
              dmarc_pass: { type: 'boolean' },
              mx_pass: { type: 'boolean' },
              tracking_domain_pass: { type: 'boolean' },
              dns_errors: { type: 'object', additionalProperties: true },
              dns_last_checked_at: { type: 'string' },
              created_at: { type: 'string' },
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
    getDomainById
  );
  /*
  UPDATE DOMAIN DETAILS (DKIM + Tracking)
  */
  fastify.put(
    '/:id/details',
    {
      schema: {
        tags: ['Domains'],
        summary: 'Update domain DKIM and tracking details',
        description: 'Updates DKIM selector and tracking domain URL for a domain',
        operationId: 'updateDomainDetails',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        body: {
          type: 'object',
          properties: {
            dkim_selector: { type: 'string', maxLength: 50 },
            tracking_domain_url: { type: 'string', maxLength: 100 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              domain_name: { type: 'string' },
              dkim_selector: { type: 'string' },
              tracking_domain_url: { type: 'string' },
              updated_at: { type: 'string' }
            }
          }
        }
      }
    },
    updateDomainDetails
  );
  /*
  DELETE DOMAIN BY ID
  */
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Domains'],
        summary: 'Delete domain',
        description: 'Deletes a domain by ID for the current workspace',
        operationId: 'deleteDomainById',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
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
    deleteDomainById
  );
  // ROute to check domain DNS configuration
  fastify.post(
    '/:id/check-dns',
    {
      schema: {
        tags: ['Domains'],
        summary: 'Check domain DNS configuration',
        description: 'Checks the DNS configuration for a domain and updates the results in the database',
        operationId: 'checkDomainDns',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'integer' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              domain: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  domain_name: { type: 'string' },
                  spf_pass: { type: 'boolean' },
                  dkim_pass: { type: 'boolean' },
                  dmarc_pass: { type: 'boolean' },
                  mx_pass: { type: 'boolean' },
                  tracking_domain_pass: { type: 'boolean' },
                  dns_errors: { type: 'object', additionalProperties: true },
                  dns_last_checked_at: { type: 'string' },
                  updated_at: { type: 'string' }
                }
              },
              dns_result: {
                type: 'object',
                additionalProperties: true
              }
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
    checkDomainDns
  );
  // route to bulk delete domains by IDs
  fastify.put(
    '/bulk-delete',
    {
      schema: {
        tags: ['Domains'],
        summary: 'Bulk delete domains',
        description: 'Deletes multiple domains by their IDs for the current workspace',
        operationId: 'bulkDeleteDomains',
        body: {
          type: 'object',
          properties: {
            ids: {
              type: 'array', items: { type: 'integer' } },
            search_text: { type: 'string', maxLength: 255 },
            provider: { type: 'string', enum: Object.values(MAILBOX_TYPE) },
          }
        },
        response: {
          200: {
            description: 'Domain(s) delete successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
              deleted_domains: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    domain_name: { type: 'string' },
                  }
                }
              }
            }
          },
        }
      }
    },
    bulkDeleteDomains
  );
}
