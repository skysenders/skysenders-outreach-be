import axios from 'axios';
import { WARMUP_PROXY_URL, AUTH_TOKEN } from '../../../config/constants.js';

const warmupProxyConfig = {
  upstream: WARMUP_PROXY_URL,
  disableRequestBodyParser: true,

  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => {
      headers['x-partner-id'] = originalReq.user?.tenant_id || 1;
      headers['x-workspace-id'] = originalReq.workspace?.id || 1;
      headers['x-user-id'] = originalReq.user?.id || 1;
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
    prefix: '/api/workspace/:workspace_id/warmup',
    rewritePrefix: '/api/workspace/:workspace_id/warmup',
    config: {
      hide: true,
    },
  });

  // internal api registration for warmup proxy
  fastify.register(fastifyHttpProxy, {
    ...warmupProxyConfig,
    prefix: '/api/warmup/internal',
    rewritePrefix: '/api/warmup/internal',
    config: {
      hide: true,
    },
  });

  // public api registration for warmup proxy
  fastify.register(fastifyHttpProxy, {
    ...warmupProxyConfig,
    prefix: '/api/v1/workspace/:workspace_id/warmup',
    rewritePrefix: '/api/v1/workspace/:workspace_id/warmup',
    config: {
      hide: true,
    },
  });
};

export const makeWarmupProxyAPICall = async(endpoint, method = 'GET', data = {}, params = {
  'auth-token': AUTH_TOKEN
}, customHeaders = {}) => {
  const url = `${WARMUP_PROXY_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders
    },
    params,
  };

  if (method === 'POST' || method === 'PUT') {
    options.data = data;
  }

  try {
    const response = await axios(url, options);
    const responseData = await response.data;
    return responseData;
  } catch (error) {
    console.error('Error making warmup proxy API call:', error);
    throw error;
  }
};
