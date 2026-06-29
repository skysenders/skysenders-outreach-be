import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';

/**
 * Functionality used to create a new session for the Stripe customer portal. This allows users to
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */

export const newPartnerPortalSession = async(req, res) => {
  // Date
  const LOGGER = Container.get('logger');
  // Subscription Handler
  const AccountSubscriptionModelHandler = Container.get('AccountSubscriptionModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  // Stripe API services
  const StripeAPIServices = Container.get('StripeAPIServices');

  // token varaible
  const user = req.user;
  const partnerId = user.tenant_id;

  try {
    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // Fetch subsription details by accountId
    const subscriptionDetails = await AccountSubscriptionModelHandler.getSubscriptionByWhere({
      account_id: user.account_id,
    });

    /** If found, sent the redirect url by calling stripe createCustomerPortalSession Method
     */
    if (subscriptionDetails) {
      // create session and get the url to redirect
      const sessionUrl = await StripeAPIServices.createCustomerPortalSession(partnerId, subscriptionDetails.customer_id);
      return res.status(StatusCodes.OK).send({ url: sessionUrl });
    }

    return res.status(StatusCodes.NOT_ACCEPTABLE).send({ message: 'Partner Customer portal not found' });
  } catch (e) {
    LOGGER.error(`Unexpected error while redirecting to stripe customer portal for partner id: ${partnerId} - ${e.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: 'An error occurred while redirecting to the customer portal',
    });
  }
};

module.exports = {
  newPartnerPortalSession
};
