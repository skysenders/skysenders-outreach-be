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
import internal from './internal';
import hasura from './hasura_events';

// other imports
import Logger from '../../loaders/logger';

import { StatusCodes } from 'http-status-codes';
import { BE_URL, WARMUP_PROXY_URL } from '../../config/constants';

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
        { name: 'Statistics', description: 'Endpoints for fetching stats and analytics' },
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
  fastifyApp.register(workspaces, { prefix: '/api/workspaces' });
  fastifyApp.register(subscription, { prefix: '/api/subscription' });
  fastifyApp.register(stripeWebhook, { prefix: '/api/stripe-webhook' });
  fastifyApp.register(domains, { prefix: '/api/domains' });
  fastifyApp.register(mailboxes, { prefix: '/api/mailboxes' });
  fastifyApp.register(internal, { prefix: '/api/internal' });
  fastifyApp.register(hasura, { prefix: '/api/hasura' });

  // register public v1 api routes
  fastifyApp.register(users, { prefix: '/api/v1/users' });
  fastifyApp.register(workspaces, { prefix: '/api/v1/workspaces' });
  fastifyApp.register(domains, { prefix: '/api/v1/domains' });
  fastifyApp.register(mailboxes, { prefix: '/api/v1/mailboxes' });

  const getMergeSpec = async() => {
    const localSpec = fastify.swagger();

    // Fetch remote spec
    const response = await axios.get(`${WARMUP_PROXY_URL}/docs/json`);
    const remoteSpec = await response.data;

    // Create a clean base clone of your local spec
    const combinedSpec = JSON.parse(JSON.stringify(localSpec));

    // 1. Move Remote Schemas over with a prefix (e.g., "Remote_User" instead of "User")
    if (remoteSpec.components && remoteSpec.components.schemas) {
      combinedSpec.components = combinedSpec.components || {};
      combinedSpec.components.schemas = combinedSpec.components.schemas || {};

      for (const [schemaName, schemaDefinition] of Object.entries(remoteSpec.components.schemas)) {
        combinedSpec.components.schemas[`Remote_${schemaName}`] = schemaDefinition;
      }
    }

    // 2. Move Remote Paths over with a prefix to prevent route overwrites
    if (remoteSpec.paths) {
      for (const [pathName, pathDefinition] of Object.entries(remoteSpec.paths)) {

        // Convert any internal $ref pointers inside the remote paths to point to the new 'Remote_' schemas
        let pathString = JSON.stringify(pathDefinition);
        // pathString = pathString.replace(/#\/components\/schemas\//g, '#/components/schemas/Remote_');
        const updatedPathDefinition = JSON.parse(pathString);

        // Add to combined spec under a prefixed path (e.g., /remote-api/users)
        combinedSpec.paths[`${pathName}`] = updatedPathDefinition;
      }
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
