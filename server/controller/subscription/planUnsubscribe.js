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
  const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  // Extract user ID and reason for unsubscribing from the request
  const partnerId = req.user.tenant_id;
  const workspaceId = req.workspace?.id;
  const userId = req.user.id;

  const { reason: unsubscribeReason } = req.body;

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

    // Check if subscription details exist for the user
    if (!subscriptionDetails) {
      return res.status(StatusCodes.NOT_FOUND).send({ message: 'Subscription details not found for the workspace.' });
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
      await WorkspaceSubscriptionModelHandler.updateSubscription({
        is_sub: false,
        sub_id: null,
      }, { workspace_id: workspaceId });
    }

    // If the user provided a reason, update the plan details with it
    if (unsubscribeReason) {
      WorkspacePlanDetailsModelHandler.updatePlanDetails(
        { reason_for_unsubscribe: unsubscribeReason },
        { workspace_id: workspaceId }
      );
    }

    logger.info(`Workspace ${workspaceId} | User ${userId} unsubscribed successfully.`);
    return res.status(HttpStatusCode.Ok).send({ message: 'Subscription cancelled successfully!' });
  } catch (error) {
    logger.error(`Unexpected error while unsubscribing user ${userId}: ${error.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      message: `Server error: ${error.message}`,
    });
  }
};
