/* eslint-disable guard-for-in */
// Fastify
import Fastify from 'fastify';
// routes
import partners from './partners';
import users from './users';
import workspaces from './workspaces';
import subscription from './subscription';
// webhooks
import stripeWebhook from './stripe-webhook';
// domains & mailbxoes
import domains from './domains';
import mailboxes from './mailboxes';
import contacts from './contacts';
import lists from './lists';
import globalSuppressions from './global_suppressions';
import sendingSchedules from './sending_schedules';

import internal from './internal';
import hasura from './hasura_events';

// other imports
import Logger from '../../loaders/logger';

import { StatusCodes } from 'http-status-codes';
import { BE_URL, WARMUP_PROXY_URL, STATS_PROXY_URL } from '../../config/constants';

import { apiRateLimiterMiddleware, trackAPIstatisticsMiddleware } from '../../middleware/track-api-requests';
import axios from 'axios';

// hooks

// swagger
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

// create a new fastify instance
export const fastify = Fastify({
  loggerInstance: Logger,
  requestTimeout: 120000, // 120 seconds
});

export const initialize = async(fastifyApp, redisClient) => {

  // Register the rate limit plugin (global false to control manually)
  await fastifyApp.register(import('@fastify/rate-limit'), {
    global: true,
    redis: redisClient,
    nameSpace: 'ss_api_rate_limit',
    addHeaders: {
      'x-rate-limit-limit': true,
      'x-rate-limit-remaining': true,
      'x-rate-limit-reset': true,
      'retry-after': true
    },
    errorResponseBuilder: (req) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `You have exceeded the ${req.headers['maxRateLimt']} requests per minute limit!`,
      };
    },
    keyGenerator: (req) => {
      return req.headers['apikey'] ? `:${req.headers['apikey']}` : `:ip-limit:${req.ip}`;
    },
    max: apiRateLimiterMiddleware,
    timeWindow: 60000,
  });

  // Hook to apply API tracking only to public routes
  fastifyApp.addHook('onRequest', async(req, reply) => {
    if (req.url.startsWith('/api/v1')) {
      trackAPIstatisticsMiddleware(req, reply);
    }
  });

  // Set up a global error handler for validation errors and other errors
  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        message: error.validation.map(err => `${err.instancePath} ${err.message}`).join(', '),
      });
    }
    reply.send(error);
  });

  // Register the swagger plugin
  fastifyApp.register(swagger, {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'Outreach API Docs',
        contact: {
          name: 'SkySenders Team',
          email: 'support@skysenders.ai',
          url: 'https://www.skysenders.ai/contact-us'
        },
        description: `
          Welcome to the API Documentation - your gateway to seamless cold email automation. 
          Note**: Please include the **apikey** in the request headers for all requests.
        `,
        version: '1.0.0',
      },
      host: BE_URL,
      schemes: ['https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      exposeRoute: true,
      tags: [
        { name: 'Users', description: 'Endpoints for managing users' },
        { name: 'Workspaces', description: 'Endpoints for managing workspaces' },
        { name: 'Domains', description: 'Endpoints for managing domains' },
        { name: 'Mailboxes', description: 'Endpoints for managing mailboxes' },
        { name: 'Warmup', description: 'Endpoints for managing warmup processes' },
        { name: 'Contacts', description: 'Endpoints for managing contacts' },
        { name: 'Lists', description: 'Endpoints for managing contact lists' },
        { name: 'Global Suppressions', description: 'Endpoints for managing global suppressions' },
        { name: 'Sending Schedules', description: 'Endpoints for managing sending schedules' },
        { name: 'Mailbox Statistics', description: 'Endpoints for managing mailbox statistics' },
        { name: 'Domain Statistics', description: 'Endpoints for managing domain statistics' },
      ],
      docExpansion: 'none',
      deepLinking: true,
    },
  });
};

export const registerRoutes = async(fastifyApp) => {
  // Optional: Add Swagger UI for interactive API docs
  fastifyApp.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'none',
      deepLinking: true,
      urls: [{ 'url': `${BE_URL}/docs/merged`, name: 'Outreach API Docs' }],
    },
  });

  // Basic health check route
  fastify.get('/health', async(request, reply) => {
    reply.status(StatusCodes.OK).send({ status: 'success' });
  });

  // register auth
  fastifyApp.register(partners, { prefix: '/api/partners' });
  fastifyApp.register(users, { prefix: '/api/users' });
  fastifyApp.register(workspaces, { prefix: '/api/workspace' });
  fastifyApp.register(subscription, { prefix: '/api/subscription' });
  fastifyApp.register(stripeWebhook, { prefix: '/api/stripe-webhook' });
  fastifyApp.register(domains, { prefix: '/api/workspace/:workspace_id/domains' });
  fastifyApp.register(mailboxes, { prefix: '/api/workspace/:workspace_id/mailboxes' });
  fastifyApp.register(contacts, { prefix: '/api/workspace/:workspace_id/contacts' });
  fastifyApp.register(lists, { prefix: '/api/workspace/:workspace_id/lists' });
  fastifyApp.register(globalSuppressions, { prefix: '/api/workspace/:workspace_id/global-suppressions' });
  fastifyApp.register(sendingSchedules, { prefix: '/api/workspace/:workspace_id/sending-schedules' });
  fastifyApp.register(internal, { prefix: '/api/internal' });
  fastifyApp.register(hasura, { prefix: '/api/hasura' });

  // register public v1 api routes
  fastifyApp.register(users, { prefix: '/api/v1/users' });
  fastifyApp.register(workspaces, { prefix: '/api/v1/workspace' });
  fastifyApp.register(domains, { prefix: '/api/v1/workspace/:workspace_id/domains' });
  fastifyApp.register(mailboxes, { prefix: '/api/v1/workspace/:workspace_id/mailboxes' });
  fastifyApp.register(contacts, { prefix: '/api/v1/workspace/:workspace_id/contacts' });
  fastifyApp.register(lists, { prefix: '/api/v1/workspace/:workspace_id/lists' });
  fastifyApp.register(globalSuppressions, { prefix: '/api/v1/workspace/:workspace_id/global-suppressions' });
  fastifyApp.register(sendingSchedules, { prefix: '/api/v1/workspace/:workspace_id/sending-schedules' });
  const fetchOpenApiSpec = async(url) => {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      Logger.error(`Error fetching OpenAPI spec from ${url}: ${err.message}`);
      return null; // Return null or handle the error as needed
    }
  };

  const mergeSchemas = (combinedSpec, remoteSpec, prefix = 'Remote') => {
    if (!remoteSpec?.components?.schemas) return;

    combinedSpec.components = combinedSpec.components || {};
    combinedSpec.components.schemas = combinedSpec.components.schemas || {};

    for (const [name, schema] of Object.entries(remoteSpec.components.schemas)) {
      combinedSpec.components.schemas[`${prefix}_${name}`] = schema;
    }
  };

  const mergePaths = (combinedSpec, remoteSpec, prefix = 'Remote') => {
    if (!remoteSpec?.paths) return;

    combinedSpec.paths = combinedSpec.paths || {};

    for (const [path, definition] of Object.entries(remoteSpec.paths)) {
      let pathString = JSON.stringify(definition);

      // Rewrite schema refs if needed
      pathString = pathString.replace(
        /#\/components\/schemas\//g,
        `#/components/schemas/${prefix}_`
      );

      const updatedDefinition = JSON.parse(pathString);

      combinedSpec.paths[`${path}`] = updatedDefinition;
    }
  };

  const getMergeSpec = async() => {
    const localSpec = fastify.swagger();

    let remoteSpec;
    let combinedSpec = JSON.parse(JSON.stringify(localSpec));

    // merge warmup proxy spec into local spec
    remoteSpec = await fetchOpenApiSpec(
      `${WARMUP_PROXY_URL}/docs/json`
    );
    if (remoteSpec) {
      mergeSchemas(combinedSpec, remoteSpec, 'Remote');
      mergePaths(combinedSpec, remoteSpec, 'Remote');
    }

    // merge stats proxy spec into local spec
    remoteSpec = await fetchOpenApiSpec(
      `${STATS_PROXY_URL}/docs/json`
    );
    if (remoteSpec) {
      mergeSchemas(combinedSpec, remoteSpec, 'Remote');
      mergePaths(combinedSpec, remoteSpec, 'Remote');
    }

    return combinedSpec;
  };

  // Custom Swagger route to set host dynamically
  fastify.get('/custom-whitelabel-api-docs', async(req) => {
    const spec = await getMergeSpec();
    const host = req.query.hostname || 'apiruntime.com';
    if (host) {
      spec.host = host; // safely modify per request
      // change the contact info
      if (spec.info && spec.info.contact) {
        spec.info.contact = {
          name: 'API Support Team',
          email: req.query.email || '',
          url: `https://${host.replace('outreach-api.', '')}`
        };
      }
    }
    return spec;
  });

  // clone local swagger
  fastify.get('/docs/merged', async() => {
    return getMergeSpec();
  });
};
