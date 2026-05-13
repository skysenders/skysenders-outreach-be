import { Container } from 'typedi';
import { isEmpty, filter } from 'lodash';
import { HttpStatusCode } from 'axios';

/**
 * Handles Stripe invoice.payment_succeeded event
 * @param {Object} event - The webhook event from Stripe
 * @param {Object} res - The response object
 * @returns {Object} - Response message and details of the invoice payment
 */
export const handleInvoicePaymentSucceeded = async(event, res) => {
  const LOGGER = Container.get('logger');

  try {
    // Dependency Injection: Retrieve required services
    const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
    const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
    const WorkspaceSubscriptionLogsModelHandler = Container.get('WorkspaceSubscriptionLogsModelHandler');
    const WorkspaceSubscriptionItemsModelHandler = Container.get('WorkspaceSubscriptionItemsModelHandler');

    const StripeAPIServices = Container.get('StripeAPIServices');

    // Log the processing event
    LOGGER.info('Processing webhook for invoice.payment_succeeded event.');

    const webhookData = event.data.object;
    const partnerId = event.partner_id;

    // Fetch user subscription details and Stripe subscription
    const userSubscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({ partner_id: partnerId, customer_id: webhookData.customer });

    // If no subscription details found, ignore the webhook
    if (!userSubscriptionDetails) {
      return res.status(HttpStatusCode.Ok).send({
        ok: false,
        data: { message: 'Webhook ignored - No subscription details found' },
      });
    }

    const workspaceId = userSubscriptionDetails?.workspace_id;
    const subId = userSubscriptionDetails?.subscription_id;

    const [ stripeSubscription, partnerPaymentDetails ] = await Promise.all([
      StripeAPIServices.getSubscription(partnerId, subId),
      StripeAPIServices.fetchPartnerPaymentDetails(partnerId)
    ]);

    const PLAN_TYPE = partnerPaymentDetails.PLAN_TYPE;
    const ADD_ON_ENTERPRISE_PLAN = partnerPaymentDetails.ADD_ON_ENTERPRISE_PLAN;
    const PLAN_EMAIL_COUNT = partnerPaymentDetails.PLAN_EMAIL_COUNT;
    const PLAN_FUP_MAILBOX_COUNT = partnerPaymentDetails.PLAN_FUP_MAILBOX_COUNT;
    const PLAN_FUP_CONTACT_COUNT = partnerPaymentDetails.PLAN_FUP_CONTACT_COUNT;

    // Identify the main subscription item based on the plan type
    const mainPlanItem = filter(stripeSubscription?.items?.data, (item) =>
      PLAN_TYPE[item?.plan?.nickname]
    )[0];

    const subscriptionStartDate = new Date(mainPlanItem?.current_period_start * 1000).toISOString();
    const subscriptionEndDate = new Date(mainPlanItem?.current_period_end * 1000).toISOString();

    const currentDate = new Date().toISOString();

    if (!isEmpty(mainPlanItem) && webhookData.status === 'paid') {
      // Map subscription items for bulk operations
      const subscriptionItems = stripeSubscription.items.data.map((item) => ({
        partner_id: partnerId,
        workspace_id: workspaceId,
        subscription_item_id: item.id,
        subscription_id: stripeSubscription.id,
        item_plan_name: item.plan.nickname,
        amount: (item.plan.amount / 100).toFixed(2),
        interval: item.plan.interval,
        quantity: item.quantity,
        created_at: new Date(item.created * 1000).toISOString(),
      }));

      // fetch plan name from the main subscription item
      const planName = mainPlanItem?.plan?.nickname;

      const isAddOnPlan = ADD_ON_ENTERPRISE_PLAN[planName];
      const subscriptionItemQuantity = mainPlanItem?.quantity || 1;

      const planEmailCount = isAddOnPlan ? partnerPaymentDetails?.PLAN_EMAIL_COUNT[planName] : subscriptionItemQuantity * PLAN_EMAIL_COUNT[planName];
      const planMaxFUPMailboxCount = isAddOnPlan ? partnerPaymentDetails?.PLAN_FUP_MAILBOX_COUNT[planName] : subscriptionItemQuantity * PLAN_FUP_MAILBOX_COUNT[planName];
      const planMaxFUPContactCount = isAddOnPlan ? partnerPaymentDetails?.PLAN_FUP_CONTACT_COUNT[planName] : subscriptionItemQuantity * PLAN_FUP_CONTACT_COUNT[planName];

      // Prepare subscription update data
      const subscriptionUpdateData = {
        subscription_id: stripeSubscription.id,
        is_active: true,
        last_invoice_url: webhookData.invoice_pdf,
        paid_date: currentDate,
        sub_start_date: subscriptionStartDate,
        sub_end_date: subscriptionEndDate,
        sub_payment_status: {
          status: 'SUCCESS',
          planName,
          lastUpdatedAt: currentDate,
        },
      };

      // Prepare plan update data
      const planUpdateData = {
        plan_name: planName,
        email_credits: planEmailCount,
        max_leads_count: planMaxFUPContactCount,
        max_mailbox_count: planMaxFUPMailboxCount,
        last_reset_date: currentDate,
        plan_end_date: subscriptionEndDate,
        is_sub_active: true,
        is_sub_payment_failed: false,
      };

      // Log the subscription details
      const subscriptionLogData = {
        workspace_id: workspaceId,
        partner_id: partnerId,
        subscription_id: stripeSubscription.id,
        created_at: currentDate,
        amount: (stripeSubscription.plan.amount / 100).toFixed(2),
        invoice_url: stripeSubscription.latest_invoice,
        payment_status: 'SUCCESS',
        subscription_items: subscriptionItems,
        addition_info: {
          status: webhookData.status,
          currency: webhookData.currency,
          total: webhookData.total,
          collection_method: webhookData.collection_method,
          billing_reason: webhookData.billing_reason,
          email_credits: planEmailCount,
          max_leads_count: planMaxFUPContactCount,
          max_mailbox_count: planMaxFUPMailboxCount,
        }
      };

      // Perform updates in parallel
      await Promise.all([
        WorkspaceSubscriptionModelHandler.updateSubscription(subscriptionUpdateData, { partner_id: partnerId, workspace_id: workspaceId }),
        WorkspacePlanDetailsModelHandler.updatePlanDetails(planUpdateData, { partner_id: partnerId, workspace_id: workspaceId }),
        WorkspaceSubscriptionItemsModelHandler.deleteAndBulkAddSubscriptionItemDetails(subscriptionItems, { partner_id: partnerId, workspace_id: workspaceId }),
        WorkspaceSubscriptionLogsModelHandler.createSubscriptionLog(subscriptionLogData),
      ]);
    }

    // Respond with success
    return res.status(HttpStatusCode.Ok).send({
      ok: true,
      data: {
        invoice_id: webhookData.id,
        paid_date: currentDate,
      },
    });
  } catch (error) {
    // Log the error and return internal server error response
    LOGGER.error(`Error processing invoice.payment_succeeded event: ${error.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      ok: false,
      data: { message: 'Internal Server Error', error: error.message },
    });
  }
};
