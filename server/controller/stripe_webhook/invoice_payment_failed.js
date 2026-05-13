import { filter, isEmpty } from 'lodash';
import { Container } from 'typedi';
import { HttpStatusCode } from 'axios';
import { EMAIL_TEMPLATE_NAME, PARTNER_EMAIL_SETTINGS_CACHE } from '../../config/constants';

const processUserSubscriptionFailure = async(partnerId, workspaceId, PLAN_TYPE, webhookData, subscriptionItems, stripeSubscription, planName, subscriptionEndDate, currentDate) => {
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
  const WorkspaceSubscriptionLogsModelHandler = Container.get('WorkspaceSubscriptionLogsModelHandler');

  // Use Promise.all for concurrent updates to subscription details and logs
  await Promise.all([
    // Update plan details indicating payment failure
    WorkspacePlanDetailsModelHandler.updatePlanDetails({
      email_credits: 0,
      max_leads_count: 0,
      max_mailbox_count: 0,
      plan_end_date: subscriptionEndDate,
      is_sub_active: false,
      last_reset_date: currentDate,
      is_payment_failed: true
    }, {
      partner_id: partnerId,
      workspace_id: workspaceId
    }),

    // Update subscription details (set to failed)
    WorkspaceSubscriptionModelHandler.updateSubscription({
      end_date: subscriptionEndDate,
      subscription_id: null,
      is_active: false,
      payment_status: {
        status: 'FAILED',
        planName: planName,
        lastUpdatedAt: currentDate,
        attemptCount: webhookData.attempt_count
      }
    }, { partner_id: partnerId, workspace_id: workspaceId }),

    // Log the failure details for future reference
    WorkspaceSubscriptionLogsModelHandler.createSubscriptionLog({
      partner_id: partnerId,
      workspace_id: workspaceId,
      created_at: currentDate,
      subscription_id: stripeSubscription.id,
      amount: (stripeSubscription.plan.amount / 100).toFixed(2),
      invoice_url: webhookData.invoice_pdf,
      subscription_items: subscriptionItems,
      payment_status: 'FAILURE',
      addition_info: {
        status: webhookData.status,
        currency: webhookData.currency,
        total: webhookData.total,
        collection_method: webhookData.collection_method,
        billing_reason: webhookData.billing_reason,
      }
    })
  ]);
};

// Main function to handle invoice payment failure
export const handleInvoicePaymentFailure = async(event, res) => {
  const logger = Container.get('logger');
  try {
    // Retrieve necessary services and handlers from the container
    const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
    const WorkspaceSubscriptionLogsModelHandler = Container.get('WorkspaceSubscriptionLogsModelHandler');
    const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
    const redisClient = Container.get('redisClient');

    // otehr services
    const StripeAPIServices = Container.get('StripeAPIServices');
    const MailerInstance = Container.get('MailerInstance');

    // Current date for logging and timestamps
    const currentDate = new Date();

    logger.info('Processing webhook for invoice payment failure...');

    // Extract webhook data (Invoice failure details)
    const webhookData = event.data.object;
    const partnerId = event.partner_id;

    // Fetch user subscription details and Stripe subscription
    const worksapceSubscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({ partner_id: partnerId, customer_id: webhookData.customer });

    // If no subscription details found, ignore the webhook
    if (!worksapceSubscriptionDetails) {
      return res.status(HttpStatusCode.Ok).send({
        ok: false,
        data: { message: 'Webhook ignored - No subscription details found' },
      });
    }
    // fetch worksapceId and subId form the subscription details
    const workspaceId = worksapceSubscriptionDetails?.workspace_id;
    const subId = worksapceSubscriptionDetails?.subscription_id;

    const [stripeSubscription, workspaceOwner, partnerPaymentDetails ] = await Promise.all([
      StripeAPIServices.getSubscription(partnerId, subId),
      WorkspaceModelHandler.fetchWorkspaceOwnerDetails(workspaceId),
      StripeAPIServices.fetchPartnerPaymentDetails(partnerId)
    ]);

    const email = workspaceOwner.email;

    const planName = worksapceSubscriptionDetails?.sub_plan_name;
    const PLAN_TYPE = partnerPaymentDetails.PLAN_TYPE;

    // Identify the main subscription item based on the plan type
    const mainPlanItem = filter(stripeSubscription?.items?.data, (item) =>
      PLAN_TYPE[item?.plan?.nickname]
    )[0];

    const subscriptionEndDate = new Date((stripeSubscription?.items?.data?.[0]?.current_period_end) * 1000).toISOString();


    if (!isEmpty(mainPlanItem)) {
      // Prepare subscription item data for logging and processing
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

      // If payment has failed more than 3 times, proceed with canceling and deleting associated data
      if (webhookData.attempt_count > 3) {
        await processUserSubscriptionFailure(partnerId, workspaceId, PLAN_TYPE, webhookData, subscriptionItems, stripeSubscription, planName, subscriptionEndDate, currentDate);

        // fetch partner email details from the redis cache
        const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${partnerId}`);
        const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

        // send welcome email
        MailerInstance.sendMail({
          partnerId,
          type: EMAIL_TEMPLATE_NAME.SUBSCRIPTION_FAILURE,
          to: email,
          cc: [],
          data: {
            billing_url: webhookData.hosted_invoice_url,
            ...parsedPartnerEmailDetails
          }
        });
      } else if (webhookData.attempt_count > 1) {
        // fetch partner email details from the redis cache
        const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${partnerId}`);
        const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

        // send welcome email
        MailerInstance.sendMail({
          partnerId,
          type: EMAIL_TEMPLATE_NAME.SUBSCRIPTION_FAILURE,
          to: email,
          cc: [],
          data: {
            billing_url: webhookData.hosted_invoice_url,
            ...parsedPartnerEmailDetails
          }
        });

        // Log the failure and update subscription status
        await Promise.all([
          WorkspaceSubscriptionModelHandler.updateSubscriptionDetails({
            payment_status: {
              status: 'FAILED',
              planName: planName,
              lastUpdatedAt: currentDate,
              attemptCount: webhookData.attempt_count
            },
            updated_at: currentDate
          }, { partner_id: partnerId, workspace_id: workspaceId }),

          // Log the failure details for future reference
          WorkspaceSubscriptionLogsModelHandler.createSubscriptionLog({
            partner_id: partnerId,
            workspace_id: workspaceId,
            created_at: currentDate,
            subscription_id: stripeSubscription.id,
            amount: (stripeSubscription.plan.amount / 100).toFixed(2),
            invoice_url: webhookData.invoice_pdf,
            payment_status: 'FAILURE',
            subscription_items: subscriptionItems,
            addition_info: {
              status: webhookData.status,
              currency: webhookData.currency,
              total: webhookData.total,
              collection_method: webhookData.collection_method,
              billing_reason: webhookData.billing_reason,
            }
          })
        ]);
      }
    }

    // Return success response
    return res.status(HttpStatusCode.Ok).send({
      ok: true,
      data: {
        invoice_id: webhookData.id,
        paid_date: currentDate
      }
    });

  } catch (e) {
    // Log error and return failure response
    logger.error(`Unexpected error while handling invoice payment failure - ${e.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      ok: false,
      data: e
    });
  }
};
