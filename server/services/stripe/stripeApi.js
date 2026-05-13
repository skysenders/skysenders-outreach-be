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

// internal node cache for stripe instances to avoid creating multiple instances for the same partner
const PartnerStripeInstances = {};
// fetch stripe instance for the partner
export const getStripeInstanceForPartner = async(partnerId) => {
  if (PartnerStripeInstances[partnerId]) {
    return PartnerStripeInstances[partnerId];
  }
  const partnerPaymentDetails = await fetchPartnerPaymentDetails(partnerId);
  if (!partnerPaymentDetails?.STRIPE_PAY_KEY) {
    throw new Error('Stripe payment key not found for partner');
  }
  const stripeInstance = require('stripe')(partnerPaymentDetails.STRIPE_PAY_KEY);
  PartnerStripeInstances[partnerId] = stripeInstance;
  return stripeInstance;
};

/**
 * Functionality used to create customer
 * @param {*} partnerId partnerId
 * @param {*} customerData customerData
 * @returns {String} it returns customer details
 */
export const createCustomer = async(partnerId, customerData) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.create(customerData);
};

/**
 * Functionality used to update customer
 * @param {*} partnerId partnerId
 * @param {*} id id
 * @param {*} customerData customerData
 * @returns {String} it returns customer details
 */
export const updateCustomer = async(partnerId, id, customerData) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.update(id, customerData);
};

/**
 * Functionality used to create subscription
 * @param {*} partnerId partnerId
 * @param {*} subscriptionInput subscriptionInput
 * @param {*} isINRPayment isINRPayment
 * @returns {String} it returns subscription details
 */
export const createSubscription = async(partnerId, subscriptionInput, isINRPayment = false) => {
  // set GST TAX ID for INR payments
  if (isINRPayment) {
    // fetch the partnerPaymentDetails
    const partnerPaymentDetails = await fetchPartnerPaymentDetails(partnerId);
    const STRIPE_GST_TAX_ID = partnerPaymentDetails.STRIPE_GST_TAX_ID;
    subscriptionInput.items = subscriptionInput.items.map(item => ({
      ...item,
      tax_rates: [STRIPE_GST_TAX_ID],
    }));
  }

  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.create(subscriptionInput);
};

/**
 * Functionality used to create subscription
 * @param {*} partnerId partnerId
 * @param {*} id id
 * @param {*} subscriptionInput subscriptionInput
 * @returns {String} it returns subscription details
 */
export const createSubscriptionItem = async(partnerId, id, subscriptionInput) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptionItems.create({
    subscription: id,
    ...subscriptionInput
  });
};

/**
 * Functionality used to delete subscription
 * @param {*} partnerId partnerId
 * @param {*} subscriptionId subscriptionInput
 * @returns {String} it returns subscription details
 */
export const deleteSubscription = async(partnerId, subscriptionId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.del(subscriptionId);
};

/**
 * Functionality used to delete subscription
 * @param {*} partnerId partnerId
 * @param {*} subscriptionItemId subscriptionItemId
 * @returns {String} it returns subscription details
 */
export const deleteSubscriptionItem = async(partnerId, subscriptionItemId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptionItems.del(subscriptionItemId);
};

/**
 * Functionality used to update subscription
 * @param {*} partnerId partnerId
 * @param {*} subId subId
 *  @returns {String} it returns subscription details
 */
export const deleteSubscriptionDiscount = async(partnerId, subId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.deleteDiscount(subId);
};

/**
 * Functionality used to update subscription
 * @param {*} partnerId partnerId
 * @param {*} subItemId subItemId
 * @param {*} userCount userCount
 *  @returns {String} it returns subscription details
 */
export const updateSubscriptionItemCount = async(partnerId, subItemId, userCount) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
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
 * @param {*} partnerId partnerId
 * @param {*} subItemId subItemId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const updateSubscriptionItem = async(partnerId, subItemId, data) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptionItems.update(subItemId, data);
};

/**
 * Functionality used to update subscription
 * @param {*} partnerId partnerId
 * @param {*} subId subId
 * @param {*} data data
 * @param {*} isInRPayment isInRPayment
 *  @returns {String} it returns subscription details
 */
export const updateSubscription = async(partnerId, subId, data, isInRPayment = false) => {
  if (isInRPayment) {
    // fetch the partnerPaymentDetails
    const partnerPaymentDetails = await fetchPartnerPaymentDetails(partnerId);
    const STRIPE_GST_TAX_ID = partnerPaymentDetails.STRIPE_GST_TAX_ID;
    data.items = data.items.map(item => ({
      ...item,
      tax_rates: [STRIPE_GST_TAX_ID],
    }));
  }
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.update(subId, data);
};

/**
 * Functionality used to adding discount for agency partnerships
 * @param {*} partnerId partnerId
 * @param   {[type]}  customerId  customer id
 * @param   {[type]}  coupon      discount code
 * @returns  {[type]}             success or not
 */
export const addSubscriptionDiscount = async(partnerId, customerId, coupon) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.update(
    customerId,
    {coupon}
  );
};


/**
 * Functionality used to get subscription
 * @param {*} partnerId partnerId
 * @param {*} subId subId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const getSubscription = async(partnerId, subId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.retrieve(subId);
};

/**
 * Functionality used to get subscription
 * @param {*} partnerId partnerId
 * @param {*} subId subId
 * @param {*} data data
 *  @returns {String} it returns subscription details
 */
export const getSubscriptionWithExpandInvoice = async(partnerId, subId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice.payments.data.payment'] });
};


/**
 * Functionality to create customer portal session
 * @param {*} partnerId partnerId
 * @param {*} customerId customerId
 *  @returns {String} it returns the redirect URL
 *
 * https://stripe.com/docs/billing/subscriptions/integrating-customer-portal#redirect
 */
export const createCustomerPortalSession = async(partnerId, customerId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);

  const partnerPaymentDetails = await fetchPartnerPaymentDetails(partnerId);
  const returnUrl = partnerPaymentDetails.returnUrl;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
};

/**
 * Functionality used to update subscription
 * @param {*} partnerId partnerId
 * @param {*} invoiceId invoiceId
 *  @returns {String} it returns subscription details
 */
export const sendManualInvoice = async(partnerId, invoiceId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.invoices.sendInvoice(invoiceId);
};

export const createPayment = async(partnerId, data) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return stripe.paymentIntents.create(data);
};

export const getPaymentIntent = async(partnerId, data) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return stripe.paymentIntents.list(data);
};

/**
 * Retrieves the default payment method for a customer.
 * @param {*} partnerId partnerId
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Object>} An object containing the payment method ID and type. If no default payment method is set, returns an object with a null payment method ID. If the customer has no payment methods, returns an object with a null payment method ID.
 */
export const getDefaultPaymentMethod = async(partnerId, customerId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
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

export const createSetupIntent = async(partnerId, customerId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
};

export const saveBusinessDetails = async(partnerId, customerId, address) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.update(customerId, { address });
};

export const saveBusinessEmailName = async(partnerId, customerId, name, email) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.update(customerId, { name, email });
};

export const saveCustomerTaxDetails = async(partnerId, customerId, taxDetails) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.createTaxId(customerId, taxDetails);
};

export const deleteCustomerTaxDetails = async(partnerId, customerId, taxId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.deleteTaxId(customerId, taxId);
};

export const getCustomerTaxDetails = async(partnerId, customerId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.customers.listTaxIds(customerId);
};

export const updateCustomerTaxDetails = async(partnerId, customerId, taxDetails) => {
  // first fetch all the existing tax IDs of customer
  const existingTaxIds = await getCustomerTaxDetails(partnerId, customerId);
  // delete all existing tax IDs
  for (const taxId of existingTaxIds.data) {
    await deleteCustomerTaxDetails(partnerId, customerId, taxId.id);
  }
  // then create new tax IDs
  return await saveCustomerTaxDetails(partnerId, customerId, taxDetails);
};

export const fetchPaymentIntentById = async(partnerId, paymentIntentId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};
export const fetchPaymentMethodById = async(partnerId, paymentMethodId) => {
  const stripe = await getStripeInstanceForPartner(partnerId);
  return await stripe.paymentMethods.retrieve(paymentMethodId);
};
