/* eslint-disable no-undef */
import { Container } from 'typedi';
import { loaderInstance } from './loaders/index';
import { allowCrossDomain } from './cors';
import verifyToken from './interceptor';
import { connect } from './db/index';
import { fastify, initialize, registerRoutes } from './api/routes/index';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { JWT_ALLOWED_URLS, JWT, APP, PORT } from './config/constants';
import logger from './loaders/logger';

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

  // Initialize the fastify server
  await initialize(fastify, redisClient);
  // Register the routes
  registerRoutes(fastify);

  // Register JWT plugin
  fastify.register(fastifyJwt, {
    secret: JWT.SECRET_KEY,
  });

  // middleware to skip swagger documentation other than /api/v1
  fastify.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.url.startsWith('/api/v1')) {
      routeOptions.schema = routeOptions.schema || {};
      routeOptions.schema.hide = true;
    }
  });

  // Middleware to handle JWT validation with skipping certain routes
  fastify.addHook('preValidation', async(request, reply) => {
    // exclude the swagger documentation route from JWT validation
    if (
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/docs') ||
      request.url.startsWith('/api/internal') ||
      request.url.startsWith('/api/queue-server')
    ) {
      return; // Skip JWT validation for Swagger documentation
    }
    const requestUrl = request.url.split('?')[0];
    // Check if the current request URL is in the allowed list
    if (JWT_ALLOWED_URLS[requestUrl]) {
      return; // Skip JWT validation for allowed URLs
    }
    // Otherwise, run JWT validation
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
