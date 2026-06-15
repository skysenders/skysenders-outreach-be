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
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  // Stripe API services
  const StripeAPIServices = Container.get('StripeAPIServices');

  // token varaible
  const partnerId = req.user.tenant_id;
  const workspaceId = req.workspace?.id;
  const userId = req.user.id;

  try {
    // if workspaceId is null or empty throw invalid request error
    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid workspace id' });
    }

    // check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: userId,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions' });
    }

    // Fetch subsription details by partnerId
    const subscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({
      workspace_id: workspaceId,
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
