import axios from 'axios';
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
    config: {
      hide: true,
    },
  });

  // public api registration for warmup proxy
  fastify.register(fastifyHttpProxy, {
    ...warmupProxyConfig,
    prefix: '/api/v1/warmup',
    rewritePrefix: '/api/v1/warmup',
    config: {
      hide: true,
    },
  });
};

export const makeWarmupProxyAPICall = async(endpoint, method = 'GET', data = {}) => {
  const url = `${WARMUP_PROXY_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'POST' || method === 'PUT') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await axios(url, options);
    const responseData = await response.data;
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error('Error making warmup proxy API call:', error);
    throw error;
  }
};
