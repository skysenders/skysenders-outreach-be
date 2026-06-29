
import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
/**
 * Functionality used to fetch workspace API key
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const getApiKey = async(req, res) => {
  const AccountsModelHandler = Container.get('AccountsModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: req.user.account_id,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // get the account details to fetch the API key
    const account = await AccountsModelHandler.getAccountByWhere({ id: req.user.account_id });

    if (account) {
      // return the result with success message
      res.status(StatusCodes.OK).send({ api_key: account.api_key, api_key_created_at: account.api_key_created_at, custom_api_rate_limit: account.custom_api_rate_limit });

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

