/* eslint-disable no-undef */
import { Container } from 'typedi';
import { loaderInstance } from './loaders/index';
import { allowCrossDomain } from './cors';
import verifyToken from './interceptor';
import { connect } from './db/index';
import { fastify, initialize, registerRoutes } from './api/routes/index';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { JWT_ALLOWED_URLS, JWT, SKIPPED_PREFIXES, APP, PORT } from './config/constants';
import logger from './loaders/logger';
import { registerProxyRoutes } from './api/routes/proxy/index.js';

loaderInstance();
const Logger = Container.get('logger');
const redisClient = Container.get('redisClient');

export const startFastifyServer = async() => {
  // This is Workers can share any TCP connection
  // It will be initialized using fastify
  Logger.info(`Worker ${process.pid} started`);

  // Register the CORS plugin with custom logic
  fastify.register(fastifyCors, {
    origin: allowCrossDomain, // Use the custom function for CORS origin validation
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allow only GET and POST methods
    credentials: true, // Allow cookies
    exposedHeaders: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'X-Requested-With',
    ],
  });

  // register cookie
  fastify.register(cookie, {});

  // Initialize the fastify server
  await initialize(fastify, redisClient);
  // Register the routes
  registerRoutes(fastify);
  // Register proxy routes
  registerProxyRoutes(fastify);

  // Register JWT plugin
  fastify.register(fastifyJwt, {
    secret: JWT.SECRET_KEY,
  });

  // middleware to skip swagger documentation other than /api/v1
  fastify.addHook('onRoute', (routeOptions) => {
    const { url } = routeOptions;

    // Hide everything outside /api/v1
    if (!url.startsWith('/api/v1')) {
      routeOptions.schema ??= {};
      routeOptions.schema.hide = true;
      return;
    }

    // Hide internal proxy routes
    if (
      url.startsWith('/api/warmup/internal') ||
    url.startsWith('/api/stats/internal')
    ) {
      routeOptions.schema ??= {};
      routeOptions.schema.hide = true;
      return;
    }

    // Hide workspace warmup/stats routes
    if (
      /^\/api(?:\/v1)\/workspace\/[^/]+\/(?:warmup|stats)/.test(url)
    ) {
      routeOptions.schema ??= {};
      routeOptions.schema.hide = true;
    }
  });

  // Middleware to handle JWT validation with skipping certain routes
  fastify.addHook('preValidation', async(request, reply) => {
    // Fastify provides the matched route path without query strings!
  // e.g., '/api/user/:id' instead of '/api/user/123?foo=bar'
    const routePath = request.routeOptions.url;

    if (!routePath) return; // Fallback safety

    // 2. O(1) Lookup for exact allowed URLs
    if (JWT_ALLOWED_URLS[routePath]) {
      return;
    }

    // 3. Fast prefix matching using .some()
    const isSkippedPrefix = SKIPPED_PREFIXES.some(prefix => routePath.startsWith(prefix));
    if (isSkippedPrefix) {
      return;
    }

    // Otherwise, validate
    await verifyToken(request, reply);
  });

  // Server Listening
  fastify.listen({ port: PORT, host: '0.0.0.0' }, async(err, address) => {
    if (err) {
      Logger.error(err.message);
      throw new Error(`Error while starting the server ${err}`);
    }
    Logger.info(
      ` 🛡️  ${APP.LISTEN} ${address} ${PORT} AND THE WORKER ID IS ${process.pid}  🛡️ `
    );
    logger.info('Connecting to the database...');
    await Promise.all([
      connect(),
    ]);
    Logger.info('Database connected successfully');
    Logger.info(`Worker ${process.pid} is listening on ${address}`);
  });
};

// Start the Fastify server
startFastifyServer();

export default fastify;
