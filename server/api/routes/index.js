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

// other imports
import Logger from '../../loaders/logger';

import { StatusCodes } from 'http-status-codes';
import { BE_URL } from '../../config/constants';

import { apiRateLimiterMiddleware, trackAPIstatisticsMiddleware } from '../../middleware/track-api-requests';

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
        { name: 'Workspaces', description: 'Endpoints for managing workspaces' },
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

  // register public v1 api routes
  fastifyApp.register(workspaces, { prefix: '/api/v1/workspaces' });
  fastifyApp.register(workspaces, { prefix: '/api/v1/domains' });
  fastifyApp.register(workspaces, { prefix: '/api/v1/mailboxes' });

  // Custom Swagger route to set host dynamically
  fastify.get('/custom-whitelabel-api-docs', async(req) => {
    const originalSpec = fastify.swagger();
    const spec = JSON.parse(JSON.stringify(originalSpec)); // deep clone
    // const host = req.query.hostname;
    const host = 'apiruntime.com';
    if (host) {
      spec.host = host; // safely modify per request
      // change the contact info
      if (spec.info && spec.info.contact) {
        spec.info.contact = {
          name: 'API Support Team',
          email: req.query.email || '',
          url: `https://${req.query.hostname.replace('server.', '')}`
        };
      }
    }
    return spec;
  });
};
