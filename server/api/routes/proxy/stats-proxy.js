import axios from 'axios';
import { STATS_PROXY_URL, AUTH_TOKEN } from '../../../config/constants.js';

const statsProxyConfig = {
  upstream: STATS_PROXY_URL,
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

export const statsProxy = (fastifyHttpProxy, fastify) => {
  // internal api registration for stats proxy
  fastify.register(fastifyHttpProxy, {
    ...statsProxyConfig,
    prefix: '/api/stats',
    rewritePrefix: '/api/stats',
    config: {
      hide: true,
    },
  });

  // public api registration for stats proxy
  fastify.register(fastifyHttpProxy, {
    ...statsProxyConfig,
    prefix: '/api/v1/stats',
    rewritePrefix: '/api/v1/stats',
    config: {
      hide: true,
    },
  });
};

export const makeStatsProxyAPICall = async(endpoint, method = 'GET', data = {}, params = {
  'auth-token': AUTH_TOKEN
}, customHeaders = {}) => {
  const url = `${STATS_PROXY_URL}${endpoint}`;
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
    console.error('Error making stats proxy API call:', error);
    throw error;
  }
};
