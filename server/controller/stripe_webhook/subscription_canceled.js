import { filter, get, isEmpty } from 'lodash';
import { Container } from 'typedi';
import { HttpStatusCode } from 'axios';

const processUserSubscription = async(partnerId, workspaceId, subscriptionEventData, subscriptionItems, validDate, currentDate) => {
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
  const WorkspaceSubscriptionLogsModelHandler = Container.get('WorkspaceSubscriptionLogsModelHandler');

  // Concurrently perform multiple actions like updating plan details, subscription details, and logging
  await Promise.all([
    // Update plan details indicating the subscription payment failed
    WorkspacePlanDetailsModelHandler.updatePlanDetails({
      email_credits: 0,
      max_leads_count: 0,
      max_mailbox_count: 0,
      plan_name: 'TRIAL_PLAN',
      plan_end_date: validDate,
      last_reset_date: currentDate,
      is_payment_failed: true,
      is_sub_active: false
    }, { partner_id: partnerId, workspace_id: workspaceId }),

    // Update subscription details to mark it as canceled
    WorkspaceSubscriptionModelHandler.updateSubscription({
      end_date: validDate,
      subscription_id: null,
      is_active: false,
      payment_status: {
        status: 'FAILED',
        amount: (subscriptionEventData.plan.amount / 100).toFixed(2),
        invoice_url: subscriptionEventData.invoice_pdf,
        cancelledAt: currentDate,
      }
    }, { partner_id: partnerId, workspace_id: workspaceId }),

    // Log the cancellation details for future reference
    WorkspaceSubscriptionLogsModelHandler.createSubscriptionLog({
      partner_id: partnerId,
      workspace_id: workspaceId,
      created_at: currentDate,
      subscription_id: subscriptionEventData.id,
      amount: (subscriptionEventData.plan.amount / 100).toFixed(2),
      invoice_url: subscriptionEventData.invoice_pdf,
      payment_status: 'FAILURE',
      subscription_items: subscriptionItems
    })
  ]);
};

// Handles the webhook event when a subscription is canceled
export const handleSubscriptionCanceled = async(event, res) => {
  const LOGGER = Container.get('logger');
  try {
    const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
    const StripeAPIServices = Container.get('StripeAPIServices');

    // Current Date to be used for logging and updating records
    const currentDate = new Date().toISOString();

    LOGGER.info('Processing webhook for customer.subscription.update / canceled event.');

    const subscriptionEventData = event.data.object;
    const partnerId = event.partner_id;

    // If the subscription is canceled and the user subscription details exist
    if (subscriptionEventData.status === 'canceled') {

      // fetchPartnerPaymentDetails
      const partnerPaymentDetails = await StripeAPIServices.fetchPartnerPaymentDetails(partnerId);
      const PLAN_TYPE = partnerPaymentDetails.PLAN_TYPE;

      // Fetch user subscription details using the customer ID from the event
      const userSubscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({ partner_id: partnerId, customer_id: subscriptionEventData.customer });

      // check if it is a partner subscription
      if (!userSubscriptionDetails) {
        // If no user subscription details are found, check for partner subscription details
        LOGGER.info('No user subscription details found.');
        // If no subscription details are found, ignore the webhook and send response
        return res.status(HttpStatusCode.Ok).send({
          ok: false,
          data: { message: 'Webhook ignored' }
        });
      }

      // find the workspaceId
      const workspaceId = userSubscriptionDetails.workspace_id;

      // Identify the main subscription item based on the plan type using lodash's filter method
      const mainPlanItem = filter(subscriptionEventData?.items?.data, (item) => PLAN_TYPE[item?.plan?.nickname])[0];

      if (!isEmpty(mainPlanItem)) {
      // Determine the valid date from the webhook data, fall back to current date if not found
        let validDate = get(mainPlanItem, 'current_period_end');
        validDate = validDate ? new Date(validDate * 1000).toISOString() : currentDate;

        // Prepare subscription item data for logging and processing
        const subscriptionItems = subscriptionEventData.items.data.map((item) => ({
          workspace_id: workspaceId,
          partner_id: partnerId,
          subscription_item_id: item.id,
          subscription_id: subscriptionEventData.id,
          item_plan_name: item.plan.nickname,
          amount: (item.plan.amount / 100).toFixed(2), // Convert amount from cents to dollars
          interval: item.plan.interval,
          quantity: item.quantity,
          created_at: new Date(item.created * 1000).toISOString(),
        }));

        await processUserSubscription(partnerId, workspaceId, subscriptionEventData, subscriptionItems, validDate, currentDate);
      }
    }

    // Return a success response once the operations are completed
    return res.status(HttpStatusCode.Ok).send({
      ok: true,
      data: {
        sub_id: subscriptionEventData.id,
        paid_date: currentDate,
      },
    });
  } catch (e) {
    // Handle unexpected errors and log them
    LOGGER.error(`Unexpected error while processing subscription canceled event - ${e.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      ok: false,
      data: e,
    });
  }
};
