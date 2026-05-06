import Container from 'typedi';
import { PARTNER_PAYMENT_CACHE } from '../../config/constants';

// const stripe = require('stripe')(STRIPE_PAY_KEY);

export const fetchPartnerPaymentDetails = async(partnerId) => {
  const redisClient = Container.get('redisClient');
  const partnerPaymentDetails = await redisClient.get(`${PARTNER_PAYMENT_CACHE}${partnerId}`);
  if (partnerPaymentDetails) {
    return JSON.parse(partnerPaymentDetails);
  }
  // throw error that partner paymenrt details not found
  throw new Error('Partner payment details not found in cache');
};

/**
 * Functionality used to create customer
 * @param {*} stripe stripe instance
 * @param {*} customerData customerData
 * @returns {String} it returns customer details
 */
export const createCustomer = async(stripe, customerData) => {
  return await stripe.customers.create(customerData);
};

/**
 * Functionality used to update customer
 * @param {*} stripe stripe instance
 * @param {*} id id
 * @param {*} customerData customerData
 * @returns {String} it returns customer details
 */
export const updateCustomer = async(stripe, id, customerData) => {
  return await stripe.customers.update(id, customerData);
};

/**
 * Functionality used to create subscription
 * @param {*} stripe stripe instance
 * @param {*} subscriptionInput subscriptionInput
 * @returns {String} it returns subscription details
 */
export const createSubscription = async(stripe, subscriptionInput) => {
  return await stripe.subscriptions.create(subscriptionInput);
};

/**
 * Functionality used to create subscription
 * @param {*} stripe stripe instance
 * @param {*} id id
 * @param {*} subscriptionInput subscriptionInput
 * @returns {String} it returns subscription details
 */
export const createSubscriptionItem = async(stripe, id, subscriptionInput) => {
  return await stripe.subscriptionItems.create({
    subscription: id,
    ...subscriptionInput
  });
};

/**
 * Functionality used to delete subscription
 * @param {*} stripe stripe instance
 * @param {*} subscriptionId subscriptionInput
 * @returns {String} it returns subscription details
 */
export const deleteSubscription = async(stripe, subscriptionId) => {
  return await stripe.subscriptions.del(subscriptionId);
};

/**
 * Functionality used to delete subscription
 * @param {*} stripe stripe instance
 * @param {*} subscriptionItemId subscriptionItemId
 * @returns {String} it returns subscription details
 */
export const deleteSubscriptionItem = async(stripe, subscriptionItemId) => {
  return await stripe.subscriptionItems.del(subscriptionItemId);
};

/**
 * Functionality used to update subscription
 * @param {*} stripe stripe instance
 * @param {*} subId subId
 *  @returns {String} it returns subscription details
 */
export const deleteSubscriptionDiscount = async(stripe, subId) => {
  return await stripe.subscriptions.deleteDiscount(subId);
};

/**
 * Functionality used to update subscription
 * @param {*} stripe stripe instance
 * @param {*} subItemId subItemId
 * @param {*} userCount userCount
 *  @returns {String} it returns subscription details
 */
export const updateSubscriptionItemCount = async(stripe, subItemId, userCount) => {
  return await stripe.subscriptionItems.update(
    subItemId, {
      quantity: userCount,
      proration_behavior: 'always_invoice',
      payment_behavior: 'error_if_incomplete'
    }
  );
};

/**
 * Functionality used to update subscription
 * @param {*} stripe stripe instance
 * @param {*} subItemId subItemId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const updateSubscriptionItem = async(stripe, subItemId, data) => {
  return await stripe.subscriptionItems.update(subItemId, data);
};

/**
 * Functionality used to update subscription
 * @param {*} stripe stripe instance
 * @param {*} subId subId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const updateSubscription = async(stripe, subId, data) => {
  return await stripe.subscriptions.update(subId, data);
};

/**
 * Functionality used to adding discount for agency partnerships
 * @param {*} stripe stripe instance
 * @param   {[type]}  customerId  customer id
 * @param   {[type]}  coupon      discount code
 * @returns  {[type]}             success or not
 */
export const addSubscriptionDiscount = async(stripe, customerId, coupon) => {
  return await stripe.customers.update(
    customerId,
    {coupon}
  );
};


/**
 * Functionality used to get subscription
 * @param {*} stripe stripe instance
 * @param {*} subId subId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const getSubscription = async(stripe, subId) => {
  return await stripe.subscriptions.retrieve(subId);
};

/**
 * Functionality used to get subscription
 * @param {*} stripe stripe instance
 * @param {*} subId subId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const getSubscriptionWithExpandInvoice = async(stripe, subId) => {
  return await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice.payments.data.payment'] });
};


/**
 * Functionality to create customer portal session
 * @param {*} stripe stripe instance
 * @param {*} customerId subId
 *  @returns {String} it returns the redirect URL
 *
 * https://stripe.com/docs/billing/subscriptions/integrating-customer-portal#redirect
 */
export const createCustomerPortalSession = async(stripe, customerId) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'https://mail.skysenders.ai/app/settings/subscription',
  });
  return session.url;
};

/**
 * Functionality used to update subscription
 * @param {*} stripe stripe instance
 * @param {*} invoiceId invoiceId
 *  @returns {String} it returns subscription details
 */
export const sendManualInvoice = async(stripe, invoiceId) => {
  return await stripe.invoices.sendInvoice(invoiceId);
};

export const createPayment = async(stripe, data) => {
  return stripe.paymentIntents.create(data);
};

export const getPaymentIntent = async(stripe, data) => {
  return stripe.paymentIntents.list(data);
};

/**
 * Retrieves the default payment method for a customer.
 * @param {*} stripe stripe instance
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Object>} An object containing the payment method ID and type. If no default payment method is set, returns an object with a null payment method ID. If the customer has no payment methods, returns an object with a null payment method ID.
 */
export const getDefaultPaymentMethod = async(stripe, customerId) => {
  const customer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethodId = customer?.invoice_settings?.default_payment_method;

  // if default payment method is set, return it
  if (defaultPaymentMethodId) {
    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

    return {
      paymentMethodId: paymentMethod?.id,
      type: paymentMethod?.type,
    };
  }

  // if no default payment method is set, find the other payment methods
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  // if no payment methods found, return an object with a null payment method ID
  if (paymentMethods?.data?.length === 0) {
    return {
      paymentMethodId: null,
    };
  }

  return {
    paymentMethodId: paymentMethods.data[0].id,
    type: 'card',
  };
};

export const createSetupIntent = async(stripe, customerId) => {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
};

export const saveBusinessDetails = async(stripe, customerId, address) => {
  return await stripe.customers.update(customerId, { address });
};

export const saveBusinessEmailName = async(stripe, customerId, name, email) => {
  return await stripe.customers.update(customerId, { name, email });
};

export const saveCustomerTaxDetails = async(stripe, customerId, taxDetails) => {
  return await stripe.customers.createTaxId(customerId, taxDetails);
};

export const deleteCustomerTaxDetails = async(stripe, customerId, taxId) => {
  return await stripe.customers.deleteTaxId(customerId, taxId);
};

export const getCustomerTaxDetails = async(stripe, customerId) => {
  return await stripe.customers.listTaxIds(customerId);
};

export const updateCustomerTaxDetails = async(stripe, customerId, taxDetails) => {
  // first fetch all the existing tax IDs of customer
  const existingTaxIds = await getCustomerTaxDetails(stripe, customerId);
  // delete all existing tax IDs
  for (const taxId of existingTaxIds.data) {
    await deleteCustomerTaxDetails(stripe, customerId, taxId.id);
  }
  // then create new tax IDs
  return await saveCustomerTaxDetails(stripe, customerId, taxDetails);
};

export const fetchPaymentIntentById = async(stripe, paymentIntentId) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};
export const fetchPaymentMethodById = async(stripe, paymentMethodId) => {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
};
