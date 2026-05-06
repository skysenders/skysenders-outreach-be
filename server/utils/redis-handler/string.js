import { Container } from 'typedi';

/**
 * Sets a key-value pair in Redis with an expiration time.
 *
 * @param {string} key - The key to set in Redis.
 * @param {string} value - The value to set for the key.
 * @param {number} expirationInSeconds - The expiration time in seconds.
 * @throws {Error} If there is an error setting the key in Redis.
 */

export const setKeyWithExpiration = async(key, value, expirationInSeconds) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  if (
    !key ||
    typeof key !== 'string' ||
    !value ||
    typeof expirationInSeconds !== 'number'
  ) {
    const error = new Error(
      'Invalid input parameters for setting key with expiration'
    );
    logger.error(error.message);
    throw error;
  }
  try {
    await redisClient.set(key, value, 'EX', expirationInSeconds);
    logger.info(
      `Key set successfully: ${key} with expiration of ${expirationInSeconds} seconds.`
    );
  } catch (error) {
    // Handle the error here
    logger.error(
      `Error setting key with expiration for key: ${key} - ${error.name} : ${error.message}`,
      error
    );
    throw error;
  }
};

/**
 * Retrieves the value associated with the given key from Redis.
 *
 * @param {string} key - The key to retrieve the value for.
 * @returns {Promise<any>} - A promise that resolves to the value associated with the key.
 * @throws {Error} - If there is an error retrieving the value from Redis.
 */
export const getKey = async(key) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  try {
    return await redisClient.get(key);
  } catch (error) {
    // Handle the error here
    logger.error('Error getting key:', error);
    throw error;
  }
};
