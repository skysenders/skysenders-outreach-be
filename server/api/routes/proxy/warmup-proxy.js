import { WARMUP_PROXY_URL } from '../../../config/constants.js';

const warmupProxyConfig = {
  upstream: WARMUP_PROXY_URL,
  disableRequestBodyParser: true,

  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => {
      headers['x-partner-id'] = originalReq.workspace?.tenant_id;
      headers['x-workspace-id'] = originalReq.workspace?.id;
      headers['x-user-id'] = originalReq.user?.id;
      return headers;
    },
  },
  http: {
    agentOptions: {
      keepAlive: true,
      maxSockets: 1000,
    },
  },
};

export const warmupProxy = (fastifyHttpProxy, fastify) => {

  // internal api registration for warmup proxy
  fastify.register(fastifyHttpProxy, {
    ...warmupProxyConfig,
    prefix: '/api/warmup',
    rewritePrefix: '/api/warmup',
  });

  // public api registration for warmup proxy
  fastify.register(fastifyHttpProxy, {
    ...warmupProxyConfig,
    prefix: '/api/v1/warmup',
    rewritePrefix: '/api/v1/warmup',
  });

};
