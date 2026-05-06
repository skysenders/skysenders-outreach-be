import { Container } from 'typedi';

import { getLeaderBoardKey } from '../utils/redis-helper';
import { RATE_LIMITER_CONFIG, USER_CUSTOM_RATE_LIMIT_PREFIX, RESTRICTED_API_URLS } from '../config/constants';

const restrictedApiUrlRegex = new RegExp(RESTRICTED_API_URLS.join('|'));
/**
 * Seconds until the next day
 *
 * @returns {number} Number of seconds until the next day
 */
const secondsUntilNextDay = () => {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.floor((tomorrow - now) / 1000);
};

/**
 *  Custom middleware to track requests to the API
 * @param {apiKey} apiKey request apiKey
 *
 * @returns {void}
 */
const trackAPIKeyStats = async(apiKey) => {
  const redisClient = Container.get('redisClient');
  const leaderBoardKey = getLeaderBoardKey();

  /**
   * Check if there is a key for the leaderboard
   * @type {number} 0 if the key doesn't exist, 1 if it exists
   */
  const isNewKey = await redisClient.exists(leaderBoardKey);

  // If the key was just created, set its expiration time to the end of the day
  if (isNewKey === 0) {
    // Need to create the key before setting the expiration time
    const pipeline = redisClient.pipeline();
    pipeline.zincrby(leaderBoardKey, 1, apiKey);
    pipeline.expire(leaderBoardKey, secondsUntilNextDay());
    await pipeline.exec();
  } else {
    // Increment the score of the API key
    await redisClient.zincrby(leaderBoardKey, 1, apiKey);
  }
};

/**
 *  Custom middleware to track requests to the API
 * @param {Request} req request object
 * @returns {void}
 */
const trackAPIstatistics = async(req) => {
  const logger = Container.get('logger');
  /**
   * Get the API key from the request headers
   * @type {string}
   */
  const apiKey = req.headers['apikey'];

  // Only track requests with an API key otherwise skip
  if (!apiKey) {
    logger.info('API key not found so not tracking the request');
    return;
  }

  trackAPIKeyStats(apiKey);
};

/**
 * Function to rate limit only if the redis client is ready
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 *
 * @returns {void}
 */
export const trackAPIstatisticsMiddleware = (req, res) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  if (redisClient.status === 'ready') {
    trackAPIstatistics(req, res);
  } else {
    logger.info('Skipping track api statis due to Redis connection issue.');
  }
};

// Custom API rate limiting middleware
export const apiRateLimiterMiddleware = async(req) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  if (!req.url.startsWith('/api/v1')) {
    req.headers['maxRateLimt'] = 500; // No rate limit for non-API routes
    return 500; // No rate limit for non-API routes restricted per IP
  }

  // Check if Redis is connected
  if (redisClient.status !== 'ready') {
    logger.info('Skipping rate limiting due to Redis connection issue.');
    return RATE_LIMITER_CONFIG.MAX_REQUESTS_PER_MINUTE;
  }

  try {

    // check if the request url matches any of the restricted API URLs
    if (restrictedApiUrlRegex.test(req.url)) {
      // set the max rate limit in the request headers for logging purposes
      req.headers['maxRateLimt'] = RATE_LIMITER_CONFIG.RESTRICTED_API_MAX_REQUESTS_PER_MINUTE;
      return RATE_LIMITER_CONFIG.RESTRICTED_API_MAX_REQUESTS_PER_MINUTE;
    }

    // Default rate limit
    let maxRateLimt = RATE_LIMITER_CONFIG.MAX_REQUESTS_PER_MINUTE;
    const apiKey = req.headers['apikey'];

    // Construct the custom rate limit key
    const userCustomRateLimitKey = USER_CUSTOM_RATE_LIMIT_PREFIX + apiKey;

    // Check for a custom rate limit in Redis
    const customRateLimit = await redisClient.get(userCustomRateLimitKey);
    if (customRateLimit) {
      maxRateLimt = parseInt(customRateLimit, 10);
    }

    // set the max rate limit in the request headers for logging purposes
    req.headers['maxRateLimt'] = maxRateLimt;
    return maxRateLimt;
  } catch (err) {
    logger.error('Error applying rate limiting:', err);
  }
};
