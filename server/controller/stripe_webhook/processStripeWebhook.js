import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
// webhook handlers
import { handleInvoicePaymentSucceeded } from './invoice_payment_succeeded';
import { handleInvoicePaymentFailure } from './invoice_payment_failed';
import { handleSetupIntentSucceeded } from './setup_intent.succeeded';
import { handlePaymentIntentSucceeded } from './payment_intent.succeeded';
import { handleSubscriptionCanceled } from './subscription_canceled';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @param {*} next middleware
 * @returns {Object} user and token
 */
export const processStripeWebhook = async(req, res) => {
  // Date
  const LOGGER = Container.get('logger');
  let event;

  try {
    event = req.body;
    // set partner_id to the event object
    event.partner_id = req.query.partner_id;

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        return await handleInvoicePaymentSucceeded(event, res);
      }
      case 'invoice.payment_failed': {
        return await handleInvoicePaymentFailure(event, res);
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      {
        return await handleSubscriptionCanceled(event, res);
      }
      case 'setup_intent.succeeded':
      {
        return await handleSetupIntentSucceeded(event, res);
      }
      case 'payment_intent.succeeded':
      {
        return await handlePaymentIntentSucceeded(event, res);
      }
      default: {
        // Unexpected event type
        return res.status(StatusCodes.BAD_REQUEST).end();
      }
    }

  } catch (e) {
    LOGGER.error(`Unexpected error while saving stripe event - ${e.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      ok: false,
      data: e
    });
  }
};
