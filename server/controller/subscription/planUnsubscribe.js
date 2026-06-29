import { HttpStatusCode } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { isEmpty } from 'lodash';
import { Container } from 'typedi';

/**
 * Unsubscribe a user from their current subscription plan.
 * @param {Object} req - HTTP request object, contains user details and unsubscribe reason.
 * @param {Object} res - HTTP response object to send the response.
 * @returns {Object} Response indicating the success of the operation.
 */
export const planUnsubscribe = async(req, res) => {
  // Logger for tracking actions
  const logger = Container.get('logger');

  // Service handlers
  const StripeAPIServices = Container.get('StripeAPIServices');
  const AccountPlanDetailsModelHandler = Container.get('AccountPlanDetailsModelHandler');
  const AccountSubscriptionModelHandler = Container.get('AccountSubscriptionModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');


  // Extract user ID and reason for unsubscribing from the request
  const partnerId = req.user.tenant_id;
  const user = req.user;

  const { reason: unsubscribeReason } = req.body;

  try {
    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // Fetch subsription details by partnerId
    const subscriptionDetails = await AccountSubscriptionModelHandler.getSubscriptionByWhere({
      account_id: user.account_id,
    });

    // Check if subscription details exist for the user
    if (!subscriptionDetails) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Subscription details not found for the account.' });
    }

    // Check if the user has an active subscription
    if (subscriptionDetails) {
      const subscriptionId = subscriptionDetails.subscription_id;

      // Fetch the subscription details from Stripe
      const stripeSubscription = await StripeAPIServices.getSubscription(partnerId, subscriptionId);

      // Cancel the subscription if it exists and is not already canceled
      if (!isEmpty(stripeSubscription) && stripeSubscription.status !== 'canceled') {
        await StripeAPIServices.deleteSubscription(partnerId, subscriptionId);
      }

      // Update subscription details in the database
      await AccountSubscriptionModelHandler.updateSubscription({
        is_active: false,
        subscription_id: null,
      }, { account_id: user.account_id });
    }

    // If the user provided a reason, update the plan details with it
    if (unsubscribeReason) {
      AccountPlanDetailsModelHandler.updatePlanDetails(
        { reason_for_unsubscribe: unsubscribeReason },
        { account_id: user.account_id }
      );
    }

    logger.info(`Account ${user.account_id} | User ${user.id} unsubscribed successfully.`);
    return res.status(HttpStatusCode.Ok).send({ message: 'Subscription cancelled successfully!' });
  } catch (error) {
    logger.error(`Unexpected error while unsubscribing user ${user.id}: ${error.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      message: `Server error: ${error.message}`,
    });
  }
};
