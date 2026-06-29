
import { Container } from 'typedi';
import { ACCOUNT_API_CACHE, ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';
/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const generateNewAPIKey = async(req, res) => {
  try {
    const accountId = req.user.account_id;

    const APIKeyGenerator = Container.get('APIKeyGenerator');
    const redisClient = Container.get('redisClient');
    const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');
    const AccountsModelHandler = Container.get('AccountsModelHandler');

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // get the account details to fetch the API key
    const account = await AccountsModelHandler.getAccountByWhere({ id: accountId });


    if (account) {
      const newAPIKey = APIKeyGenerator.generateUniqueAPIKey(account.uuid);

      // update account with new API key
      await AccountsModelHandler.updateAccount(
        { api_key: newAPIKey, api_key_created_at: new Date().toISOString() },
        { id: account.id }
      );

      let customeRateLimit = account.custom_api_rate_limit;
      let apiKey = account.api_key;

      // If custom rate limit exist for this account set it in redis & remove old key
      if (customeRateLimit) {
        redisClient.set(ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX + newAPIKey, customeRateLimit);
        // remove old key from redis cache
        // check if apiKey is not null
        if (apiKey)
          redisClient.del(ACCOUNT_CUSTOM_RATE_LIMIT_PREFIX + apiKey);
      }

      // update account object with new API key
      account.api_key = newAPIKey;
      // fetch the account details with plan details
      const cacheAccountDetails = await AccountsModelHandler.findAccountWithPlanDetailsByAPIKey(newAPIKey);

      // REMOVE old key and add new key to redis cache
      redisClient.set(ACCOUNT_API_CACHE + newAPIKey, JSON.stringify(cacheAccountDetails));

      // remove old key from redis cache
      // check if apiKey is not null
      if (apiKey) {
        redisClient.del(`${ACCOUNT_API_CACHE}${apiKey}`);
      }

      // return the result with success message
      res.status(StatusCodes.OK).send({ message: 'success', api_key: newAPIKey });

    } else {
      return res.status(StatusCodes.NOT_ACCEPTABLE).send({message: 'Invalid request! Account not found!'});
    }

    return;
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

