import RedisClient from 'ioredis';
import { REDIS_CONFIG } from '../config/constants';
import { Container } from 'typedi';
import { IS_PRODUCTION } from '../config/constants';

/**
 * To log when redis client is connected
 * @returns {void}
 */
const handleRedisConnect = () => {
  const logger = Container.get('logger');
  logger.info(`Connected to Redis - ${REDIS_CONFIG.REDIS_HOST}`);
};

/**
 * To log when redis client is not connected or error
 *
 * @param {*} error The error message
 * @returns {void}
 */
const handleRedisError = (error) => {
  const logger = Container.get('logger');
  logger.info(`Redis connection error - ${error}, host - ${REDIS_CONFIG.REDIS_HOST}`);
  if (IS_PRODUCTION) {
    // notify via email that redis is not connected on production
    logger.error(`Redis connection error - ${error}, host - ${REDIS_CONFIG.REDIS_HOST}`);
  }
};

// Create a redis client
/**
 * @type {import('ioredis').Redis}
 */
export const redisClient = new RedisClient({
  connectionName: REDIS_CONFIG.REDIS_CONNECTION_NAME,
  password: REDIS_CONFIG.REDIS_PASSWORD,
  username: REDIS_CONFIG.REDIS_USERNAME,
  host: REDIS_CONFIG.REDIS_HOST,
  port: REDIS_CONFIG.REDIS_PORT,
});

// Add event listeners
redisClient.on('connect', handleRedisConnect);
redisClient.on('error', handleRedisError);
