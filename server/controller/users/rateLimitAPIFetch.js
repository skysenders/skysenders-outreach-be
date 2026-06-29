import { getLeaderBoardKey } from '../../utils/redis-helper';
import { AUTH_TOKEN, RATE_LIMITER_CONFIG } from '../../config/constants';
import { Container } from 'typedi';
import { ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';

/**
 *  Customfetch api stats leaderboard - api rate limiter
 * @param {req} req object
 * @param {res} res object
 *
 * @returns {void} object
 */
export const fetchAPIRateLimitStatLeaderBoard = async(req, res) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  logger.info('fetching leader board api rate limit');
  try {
    if (req.query.auth !== AUTH_TOKEN) {
      return res.status(StatusCodes.OK).send({ok: true});
    }

    // fetch the leaderboard value
    const leaderBoardKey = getLeaderBoardKey();

    // pick top 10 top consuming API Keys
    const leaderBoardData = await redisClient.zrevrange(
      leaderBoardKey,
      0,
      (req.query.limit || 9),
      'WITHSCORES'
    );

    logger.info('Results fetched for leader board api rate limit');
    // Convert the flat array to a structured object
    const leaderBoardObject = {};

    for (let i = 0; i < leaderBoardData.length; i += 2) {
      leaderBoardObject[leaderBoardData[i]] = leaderBoardData[i + 1];
    }
    // return the results
    return res.status(StatusCodes.OK).send({ ok: true, data: leaderBoardObject });
  } catch (error) {
    logger.error(`Exception occurred while fetching for leader board api rate limit - ${error}`);
    return;
  }
};

/**
 *  Custom middleware to track requests to the API
 * @param {req} req object
 * @param {res} res object
 *
 * @returns {void} object
 */
export const fetchAPIConsumedCountByAPIKey = async(req, res) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');

  logger.info(`fetching API consumed count by API Key - ${req.query.apiKey}`);
  try {
    const { apiKey } = req.query;
    if (req.query.auth !== AUTH_TOKEN) {
      return res.status(StatusCodes.OK).send({ok: true, apiKey });
    }

    // fetch the leaderboard value
    const leaderBoardKey = getLeaderBoardKey();
    // fetch the leaderboard api key count
    const leaderBoardAPIKeyCount = await redisClient.zscore(leaderBoardKey, apiKey);
    // fetch api key rate limit count
    const apikeyRateLimitCount = await redisClient.get(`rl:${apiKey}`);
    logger.info('Results fetched for lead api rate limit by apikey');
    // return the results
    return res.status(StatusCodes.OK).send({ ok: true, apiKey, leaderBoardAPIKeyCount, apikeyRateLimitCount });
  } catch (error) {
    logger.error(`Exception occurred while fetching api rate limit by apikey - ${req.query.apiKey} - ${error}`);
    return;
  }
};

/**
 * Updating users custome api rate limit in redis
 * @param {req} req object
 * @param {res} res object
 *
 * @returns {void} object
 */
export const setAccountApiCustomLimitToRedis = async(req, res) => {
  const logger = Container.get('logger');
  const redisClient = Container.get('redisClient');
  const AccountsModelHandler = Container.get('AccountsModelHandler');

  // check if auth token is valid or not
  if (req.query.auth !== AUTH_TOKEN) {
    return res.status(StatusCodes.UNAUTHORIZED).send({ message: 'Unauthorized access' });
  }

  logger.info('Start fetching custom api rate limt for workspace and set to redis');

  try {
    const { custom_api_rate_limit: customApiRateLimit } = req.body;
    const accountId = req.user.account_id;

    const account = await AccountsModelHandler.getAccountByWhere({ id: accountId });

    if (!account) {
      return res.status(StatusCodes.NOT_FOUND).send({message: 'Account not found'});
    }

    // if custom api rate limit is less than 60 than set null in table
    let updateCustomRateLimitData = {custom_api_rate_limit: null };

    if (customApiRateLimit > RATE_LIMITER_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      updateCustomRateLimitData = { custom_api_rate_limit: customApiRateLimit };
      redisClient.set(`${ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX}${account.api_key}`, customApiRateLimit);
    } else {
      redisClient.del(`${ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX}${account.api_key}`);
    }

    const editAccount = await AccountsModelHandler.updateAccount(updateCustomRateLimitData, { id: account.id });

    if (!editAccount) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: 'update failed'});
    }

    if (!updateCustomRateLimitData.custom_api_rate_limit) {
      return res.status(StatusCodes.OK).send({ message: `Custom api rate limit updated null as values is less than default value ${RATE_LIMITER_CONFIG.MAX_REQUESTS_PER_MINUTE}` });
    } else {
      logger.info('succesfully updated workspace api rate limit to redis');
      return res.status(StatusCodes.OK).send({ message: 'succesfully updated workspace api rate limit to redis' });
    }

  } catch (error) {
    logger.error(`Exception occurred while updating workspaces api custom rate limit to redis - ${error}`);
    return;
  }
};
