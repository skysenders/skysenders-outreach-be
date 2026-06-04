import fastifyHttpProxy from '@fastify/http-proxy';
// proxy routes
import { warmupProxy } from './warmup-proxy.js';
import { statsProxy } from './stats-proxy.js';

export const registerProxyRoutes = (fastify) => {
  warmupProxy(fastifyHttpProxy, fastify);
  statsProxy(fastifyHttpProxy, fastify);
};
