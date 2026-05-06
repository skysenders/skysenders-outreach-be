import { Container } from 'typedi';
import crypto from 'crypto';

// 1. The script string (keep it constant)
const ROTATION_LUA = `
  local pool_key = KEYS[1]
  local new_score = tonumber(ARGV[1])

  local members = redis.call('ZRANGE', pool_key, 0, 0)
  if #members == 0 then return nil end

  local selected = members[1]
  redis.call('ZADD', pool_key, new_score, selected)

  return selected
`;

// 2. Pre-calculate the SHA1 hash
const SCRIPT_SHA = crypto.createHash('sha1').update(ROTATION_LUA).digest('hex');

// Ensures the script is loaded into Redis Cloud memory.
// Call this once during your App's initialization/startup.
export const initWarmupScript = async() => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  try {
    await redisClient.script('LOAD', ROTATION_LUA);
    logger.info('✅ Warmup Lua script pre-loaded into Redis Cloud');
  } catch (error) {
    logger.error('Failed to load Lua script:', error);
  }
};

export const fetchNextWarmupAccount = async(poolKey) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  // random jitter between 90-120 seconds to prevent thundering herd when multiple accounts are in the pool
  const jitter = Math.floor(Math.random() * (120000 - 90000 + 1)) + 90000;
  const nextScore = Date.now() + jitter;

  try {

    // Use evalsha for O(1) script lookup
    const key = await redisClient.evalsha(
      SCRIPT_SHA,
      1,
      poolKey,
      nextScore
    );

    if (!key) {
      logger.info('Warmup pool is empty');
      return null;
    }

    const splitResult = key.split('-');
    return {
      userId: splitResult[0],
      mailboxId: splitResult[1],
    };

  } catch (error) {
    // Fallback: If Redis was restarted, the script might be missing from cache
    if (error.message.includes('NOSCRIPT')) {
      logger.warn('Script missing from Redis cache, reloading...');
      await initWarmupScript();
      // Retry once after loading
      const key = await redisClient.eval(ROTATION_LUA, 1, poolKey, nextScore);

      if (!key) {
        logger.info('Warmup pool is empty after reload');
        return null;
      }
      // split key and return result
      const splitResult = key.split('-');
      return {
        userId: splitResult[0],
        mailboxId: splitResult[1],
      };
    }
    logger.error('Error fetching next warmup account:', error);
    throw error;
  }
};

// Adds a mailbox to the warmup pool.
// Uses score now + 5mins so it's immediately available for the next fetch.
export const addMailboxToPool = async(poolKey, userId, mailboxId) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  const nextScore = Date.now() + 300000;

  try {
    // ZSET (Sorted Set) automatically maintains uniqueness
    return await redisClient.zadd(poolKey, nextScore, `${userId}-${mailboxId}`);
  } catch (error) {
    logger.error('Error adding mailbox to warmup pool:', error);
    throw error;
  }
};

// Adds a mailbox to the warmup pool.
// Uses score now + 5mins so it's immediately available for the next fetch.
export const addMailboxToPoolWithDelay = async(poolKey, userId, mailboxId, delay = 300000) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  const nextScore = Date.now() + delay;

  try {
    // ZSET (Sorted Set) automatically maintains uniqueness
    return await redisClient.zadd(poolKey, nextScore, `${userId}-${mailboxId}`);
  } catch (error) {
    logger.error('Error adding mailbox to warmup pool:', error);
    throw error;
  }
};

// Removes a mailbox from the warmup pool.
export const removeMailboxFromPool = async(poolKey, userId, mailboxId) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  try {
    return await redisClient.zrem(poolKey, `${userId}-${mailboxId}`);
  } catch (error) {
    logger.error('Error removing mailbox from warmup pool:', error);
    throw error;
  }
};

// Gets the current count of mailboxes in the pool.
export const getPoolSize = async(poolKey) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  try {
    return await redisClient.zcard(poolKey);
  } catch (error) {
    logger.error('Error getting warmup pool size:', error);
    throw error;
  }
};

/**
 * Calculates a shuffled message ID.
 * Because we don't reset the 'step', the account will visit every
 * message in a unique order, and the order will shift in the next cycle.
 * @param {number} step - The current step or iteration count.
 * @param {number} seed - A seed value to ensure different shuffle orders for different accounts.
 * @param {number} maxMessages - The total number of messages to shuffle through (default is 2000).
 * @returns {number} A shuffled message ID between 1 and maxMessages.
 */
const getShuffledId = (step, seed, maxMessages = 2000) => {
  const JUMP_PRIME = 15485863;
  // Formula: ((step * prime) + seed) % max
  const shuffledIndex = ((step * JUMP_PRIME) + seed) % maxMessages;
  return Math.abs(shuffledIndex) + 1;
};

// A secondary large prime to "explode" small IDs
const SEED_SALT_PRIME = 49979687;

/**
 * Fetches the next unique message ID for a specific account.
 * Uses Redis HINCRBY to maintain the step counter atomically.
 * @param {string} mailboxId - The ID of the sender mailbox
 * @param {number} maxMessages - Total messages in DB (default 2000)
 * @returns {number} The next unique message ID for the account
 */
export const getNextMessageIdForAccount = async(mailboxId, maxMessages = 10180) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  const stepsHashKey = 'wm:message_steps';

  try {
    // 1. Atomically increment the total "sends" count for this account
    // This ensures no two concurrent workers get the same index
    const currentStep = await redisClient.hincrby(stepsHashKey, mailboxId, 1);

    const accountSeed = (mailboxId * SEED_SALT_PRIME) % 2147483647;

    // 2. Calculate the Shuffled ID
    const messageId = getShuffledId(currentStep, accountSeed, maxMessages);

    // 3. Maintenance: If the counter gets massive (e.g. > 1L),
    // reset it to a small number to keep Redis memory lean.
    if (currentStep > 100000) {
      const resetValue = currentStep % maxMessages;
      await redisClient.hset(stepsHashKey, mailboxId, resetValue);
    }

    return messageId;
  } catch (error) {
    logger.error(`Error rotating message index for account ${mailboxId}:`, error);
    throw error;
  }
};

export const removeMessageStepCounter = async(mailboxId) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  const stepsHashKey = 'wm:message_steps';

  try {
    await redisClient.hdel(stepsHashKey, mailboxId);
    logger.info(`Removed message step counter for mailbox ${mailboxId}`);
  } catch (error) {
    logger.error(`Error removing message step counter for mailbox ${mailboxId}:`, error);
    throw error;
  }
};
