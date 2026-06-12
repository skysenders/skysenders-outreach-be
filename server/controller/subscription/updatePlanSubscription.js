import { get, isEmpty } from 'lodash';
import { Container } from 'typedi';
import { HttpStatusCode } from 'axios';
import { StatusCodes } from 'http-status-codes';

// Function to create a new subscription
const createSubscription = async(partnerId, customer, paymentMethodId, planId, subscriptionQuantity, coupon = '', isINRPayment = false) => {
  const StripeAPIServices = Container.get('StripeAPIServices');
  let subscription;

  try {
    const subscriptionData = {
      customer,
      items: [{
        plan: planId,
        quantity: subscriptionQuantity || 1,
      }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payments.data.payment'],
    };

    if (coupon) subscriptionData.discounts = [{ coupon }];

    subscription = await StripeAPIServices.createSubscription(partnerId, subscriptionData, isINRPayment);
    const paymentIntent = get(subscription, 'latest_invoice.payments.data[0].payment.payment_intent');

    if (paymentIntent) {
      console.log(`fetching payment intent ${paymentIntent}`);
      // fetch the payment intent
      const paymentIntentDetails = await StripeAPIServices.fetchPaymentIntentById(partnerId, paymentIntent);

      if (paymentIntentDetails && (paymentIntentDetails.status === 'requires_action' || paymentIntentDetails.status === 'requires_confirmation' )) {
        return {
          ...subscription,
          isPaymentAuthenticationRequired: true,
          paymentIntentClientSecret: paymentIntentDetails.client_secret,
          message: 'The card needs to perform an another level of confirmationPayment for this subscription requires additional user action before it can be completed successfully.',
        };
      }
    }
  } catch (e) {
    console.error('Error occurred while creating subscription -', e.message);
    throw e;
  }
  return subscription;
};

// Function to update an existing subscription plan
const updateSubscriptionItemPlan = async(partnerId, subId, paymentMethodId, items, coupon = '', isINRPayment = false) => {
  const StripeAPIServices = Container.get('StripeAPIServices');

  try {
    const subscriptionData = {
      proration_behavior: 'always_invoice',
      payment_behavior: 'default_incomplete',
      default_payment_method: paymentMethodId,
      items,
      expand: ['latest_invoice.payments.data.payment']
    };

    if (coupon) subscriptionData.discounts = [{ coupon }];

    // await StripeAPIServices.updateSubscriptionItem(itemId, subscriptionData);
    const subscription = await StripeAPIServices.updateSubscription(partnerId, subId, subscriptionData, isINRPayment);
    //  await StripeAPIServices.getSubscriptionWithExpandInvoice(subId);

    const paymentIntent = get(subscription, 'latest_invoice.payments.data[0].payment.payment_intent');

    if (paymentIntent) {
      console.log(`fetching payment intent for subscription item ${paymentIntent}`);
      // fetch the payment intent
      const paymentIntentDetails = await StripeAPIServices.fetchPaymentIntentById(partnerId, paymentIntent);

      if (paymentIntentDetails && (paymentIntentDetails.status === 'requires_action' || paymentIntentDetails.status === 'requires_confirmation' )) {
        return {
          ...subscription,
          isPaymentAuthenticationRequired: true,
          paymentIntentClientSecret: paymentIntentDetails.client_secret,
          message: 'The card needs to perform an another level of confirmationPayment for this subscription requires additional user action before it can be completed successfully.',
        };
      }
    }
    return subscription;
  } catch (e) {
    console.error('Error occurred while updating subscription item -', e.message);
    throw e;
  }
};

// Function to handle subscription updates
const updateSubscription = async(partnerId, customerId, PLAN_TYPE, subId, paymentMethodId, planId, subscriptionQuantity, coupon, isINRPayment = false) => {
  const logger = Container.get('logger');
  const StripeAPIServices = Container.get('StripeAPIServices');

  try {
    const stripeSubDetails = await StripeAPIServices.getSubscriptionWithExpandInvoice(partnerId, subId);

    if (isEmpty(stripeSubDetails) || stripeSubDetails.status !== 'active') {
      logger.info('Subscription is canceled. Creating a new subscription.');
      return await createSubscription(partnerId, customerId, paymentMethodId, planId, subscriptionQuantity, coupon, isINRPayment);
    }

    const items = [];
    let isMainPlanFound = false;

    for (const eachItem of stripeSubDetails?.items?.data) {
      if (PLAN_TYPE[eachItem?.plan?.nickname]) {
        items.push({
          id: eachItem.id,
          price: planId,
          quantity: subscriptionQuantity || 1,
        });
        isMainPlanFound = true;
      } else {
        items.push({
          id: eachItem.id,
          price: eachItem.price.id,
        });
      }
    }

    if (!isMainPlanFound) {
      logger.info('Subscription item is empty. Creating a new subscription.');
      return await createSubscription(partnerId, customerId, paymentMethodId, planId, subscriptionQuantity, coupon, isINRPayment);
    }

    logger.info('Updating the existing subscription plan.');
    return await updateSubscriptionItemPlan(partnerId, subId, paymentMethodId, items, coupon, isINRPayment);
  } catch (err) {
    console.error('Error occurred while updating subscription -', err.message);
    throw err;
  }
};

// Controller function to update the subscription plan for a user
export const updatePlanSubscription = async(req, res) => {
  const logger = Container.get('logger');
  const StripeAPIServices = Container.get('StripeAPIServices');

  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const WorkspaceSubscriptionItemsModelHandler = Container.get('WorkspaceSubscriptionItemsModelHandler');
  const WorkspaceSubscriptionLogsModelHandler = Container.get('WorkspaceSubscriptionLogsModelHandler');

  const { is_inr_payment: isINRPayment } = req.body;
  let planName = req.body.plan_name;
  let subscriptionQuantity = req.body.quantity;

  // Extract user ID and reason for unsubscribing from the request
  const partnerId = req.user.tenant_id;
  const workspaceId = req.workspace?.id;
  const userId = req.user.id;

  let coupon = req.body.coupon || '';

  let paymentMethodId = req.body.payment_method_id;

  const { email } = req.user;
  const currentDate = new Date();

  logger.info(`Updating subscription for user: ${email}, plan: ${planName} with quantity: ${subscriptionQuantity}, workspace_id: ${workspaceId}`);
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

    const [subscriptionDetails, planDetails] = await Promise.all([
      WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({
        partner_id: partnerId,
        workspace_id: workspaceId,
      }),
      WorkspacePlanDetailsModelHandler.getPlanDetailsByWhere({
        partner_id: partnerId,
        workspace_id: workspaceId,
      }),
    ]);

    // fetch partner payment details
    const partnerPaymentDetails = await StripeAPIServices.fetchPartnerPaymentDetails(partnerId);
    const PLAN_TYPE = partnerPaymentDetails.PLAN_TYPE;
    const PLAN_EMAIL_COUNT = partnerPaymentDetails.PLAN_EMAIL_COUNT;
    const ADD_ON_ENTERPRISE_PLAN = partnerPaymentDetails.ADD_ON_ENTERPRISE_PLAN;
    const PLAN_PRICE_ID_MAP = partnerPaymentDetails.PLAN_PRICE_ID_MAP;
    const INDIA_PLAN_PRICE_ID_MAP = partnerPaymentDetails.INDIA_PLAN_PRICE_ID_MAP;
    const PLAN_FUP_MAILBOX_COUNT = partnerPaymentDetails.PLAN_FUP_MAILBOX_COUNT;
    const PLAN_FUP_CONTACT_COUNT = partnerPaymentDetails.PLAN_FUP_CONTACT_COUNT;

    if (!PLAN_TYPE[planName]) {
      throw new Error('Invalid plan name.');
    }

    // update the planName to add on based on quantity if the plan is enterprise plan and quantity is more than ENTERPRISE_PLAN
    if (planName === PLAN_TYPE.ENTERPRISE_PLAN) {
      if (subscriptionQuantity > PLAN_EMAIL_COUNT.ENTERPRISE_PLAN) {
        // this is hard coded for skysenders, as we charge per 100K emails in subscription
        subscriptionQuantity = subscriptionQuantity / 100000;
        // round off to whole number
        subscriptionQuantity = Math.ceil(subscriptionQuantity);
        // update plan name to enterprise add on if quantity is more than 1
        planName = subscriptionQuantity > 9 ? PLAN_TYPE.ENTERPRISE_PLAN_1M : PLAN_TYPE.ENTERPRISE_PLAN_100K;
      } else {
        subscriptionQuantity = 1;
      }
    }

    const isAddOnPlan = ADD_ON_ENTERPRISE_PLAN[planName];

    if (planDetails.plan_name === planName && subscriptionDetails?.is_active && !isAddOnPlan) {
      throw new Error('Cannot upgrade to the same plan.');
    }

    let planMailboxCount = PLAN_FUP_MAILBOX_COUNT[planName];
    let planContactCount = PLAN_FUP_CONTACT_COUNT[planName];

    let planPriceId = isINRPayment ? INDIA_PLAN_PRICE_ID_MAP[planName] : PLAN_PRICE_ID_MAP[planName];

    if (isAddOnPlan) {
      planMailboxCount = (subscriptionQuantity * PLAN_FUP_MAILBOX_COUNT.ENTERPRISE_PLAN_ADD_ON) + PLAN_FUP_MAILBOX_COUNT.ENTERPRISE_PLAN;
      planContactCount = (subscriptionQuantity * PLAN_FUP_CONTACT_COUNT.ENTERPRISE_PLAN_ADD_ON) + PLAN_FUP_CONTACT_COUNT.ENTERPRISE_PLAN;
    }

    const { mailboxes_count: actualMailboxCount = 0, contacts_count: actualContactCount = 0 } = await WorkspacePlanDetailsModelHandler.fetchWorkspaceContactMailboxCount(partnerId, workspaceId);

    // Check if the workspace has any extra mailboxes
    if (planMailboxCount < Number(actualMailboxCount)) {
      throw new Error(`The new plan allows fewer FUP usage mailboxes than your current count(${actualMailboxCount}).
         Please delete some mailboxes to comply with the plan FUP limit.`);
    }

    // Check if the workspace has any extra contacts
    if (planContactCount < Number(actualContactCount)) {
      throw new Error(`The new plan allows fewer FUP usage contacts than your current count(${actualContactCount}).
         Please delete some contacts to comply with the plan FUP limit.`);
    }

    if (paymentMethodId) {
      logger.info(`updating the new payment method id ${paymentMethodId} for workspace: ${workspaceId}, user: ${email}`);
      // save the new payment method id to the db
      await StripeAPIServices.updateCustomer(partnerId, subscriptionDetails.customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        }
      });
    } else {
      paymentMethodId = subscriptionDetails.payment_method_id;
    }

    // if there is no coupon & subscriptionDetails.early_access?.early_access_coupon & subscriptionDetails.early_access?.early_access_coupon_used is false
    if (!coupon && subscriptionDetails?.early_access?.early_access_coupon && !subscriptionDetails?.early_access?.early_access_coupon_used) {
      coupon = subscriptionDetails.early_access.early_access_coupon;
      subscriptionDetails.early_access.early_access_coupon_used = true;
      logger.info(`Using early access coupon: ${coupon} for workspace: ${workspaceId}, user: ${email}`);
    }

    // check if plan_details has custom price id for the plan
    if (planDetails?.custom_plan_details?.[planName]?.price_id) {
      logger.info(`Using custom price id for plan ${planName} for workspace: ${workspaceId}, user: ${email}`);
      planPriceId = planDetails.custom_plan_details[planName].price_id;
    }

    // create or update the subscription
    logger.info(`Creating or updating subscription for workspace: ${workspaceId}, user: ${email}, plan: ${planName}`);
    const subscription = subscriptionDetails?.subscription_id
      ? await updateSubscription(partnerId, subscriptionDetails.customer_id, PLAN_TYPE, subscriptionDetails.subscription_id, paymentMethodId, planPriceId, subscriptionQuantity, coupon, isINRPayment)
      : await createSubscription(partnerId, subscriptionDetails.customer_id, paymentMethodId, planPriceId, subscriptionQuantity, coupon, isINRPayment);

    logger.info(`Subscription created/updated successfully for workspace: ${workspaceId}, user: ${email}, plan: ${planName}`);

    // update the subscription details to the database
    const subscriptionItemData = subscription.items.data.map(item => ({
      partner_id: partnerId,
      workspace_id: workspaceId,
      subscription_id: subscription.id,
      sub_item_id: item.id,
      item_plan_name: item.plan.nickname,
      amount: (item.plan.amount / 100).toFixed(2),
      quantity: item.quantity,
      interval: item.plan.interval,
      created_at: new Date(item.created * 1000).toISOString(),
    }));

    await WorkspaceSubscriptionItemsModelHandler.deleteAndBulkAddSubscriptionItemDetails(subscriptionItemData, { partner_id: partnerId, workspace_id: workspaceId });

    await WorkspaceSubscriptionModelHandler.updateSubscription(
      {
        subscription_id: subscription.id,
        customer_id: subscription.customer,
        plan_name: planName,
        payment_method_id: paymentMethodId,
        is_inr_payment: isINRPayment,
        early_access: subscriptionDetails.early_access,
        payment_status: {
          status: 'STARTED',
          planName,
          subscriptionQuantity,
          lastUpdatedAt: currentDate,
          manualInvoiceHostedUrl: subscription.manualInvoiceHostedUrl,
          isManualInvoice: subscription.isManualInvoice,
          manualInvoiceDueDate: subscription.manualInvoiceDueDate,
        },
      },
      { id: subscriptionDetails.id, partner_id: partnerId, workspace_id: workspaceId }
    );

    await WorkspaceSubscriptionLogsModelHandler.createSubscriptionLog({
      partner_id: partnerId,
      workspace_id: workspaceId,
      subscription_id: subscription.id,
      amount: (subscription.plan.amount / 100).toFixed(2),
      invoice_url: subscription?.latest_invoice?.invoice_pdf,
      payment_status: 'INITIATED',
      subscription_items: subscriptionItemData,
      additional_info: {
        subscriptionQuantity,
      }
    });

    await WorkspacePlanDetailsModelHandler.updatePlanDetails(
      {
        plan_name: planName,
      },
      {
        workspace_id: workspaceId,
        partner_id: partnerId,
      }
    );

    logger.info(`Subscription updated successfully for ${email}`);
    res.status(HttpStatusCode.Ok).send({
      message: subscription.message || 'Subscription updated successfully!',
      isPaymentAuthenticationRequired: subscription.isPaymentAuthenticationRequired,
      paymentIntentClientSecret: subscription.paymentIntentClientSecret
    });
  } catch (e) {
    logger.error(`Error while updating subscription for ${email}: ${e.message}`);
    res.status(HttpStatusCode.NotAcceptable).send({ message: e.message });
  }
};
