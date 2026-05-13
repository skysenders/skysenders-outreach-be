import { Container } from 'typedi';
import { HttpStatusCode } from 'axios';

// Main function to handle setup intent succeeded
export const handleSetupIntentSucceeded = async(event, res) => {
  const logger = Container.get('logger');
  try {
    // Retrieve necessary services and handlers from the container
    const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
    const StripeAPIServices = Container.get('StripeAPIServices');

    // Current date for logging and timestamps
    const currentDate = new Date();
    const partnerId = event.partner_id;

    logger.info('Processing webhook for setup intent succeeded...');

    // Extract webhook data (setup intent succeeded details)
    const webhookData = event.data.object;

    const customerId = webhookData.customer;
    const paymentMethodId = webhookData.payment_method;

    // Fetch user subscription details and Stripe subscription
    const userSubscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({ partner_id: partnerId, customer_id: customerId });


    // If no subscription details found, ignore the webhook
    if (!userSubscriptionDetails) {
      return res.status(HttpStatusCode.Ok).send({
        ok: false,
        data: { message: 'Webhook ignored - No subscription details found' },
      });
    }

    const [ paymentMethod ] = await Promise.all([
      // fetch the payment intent for the paymentMethodId
      StripeAPIServices.fetchPaymentMethodById(partnerId, paymentMethodId),
      // save the new payment method id to the db
      StripeAPIServices.updateCustomer(partnerId, customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        }
      }),
    ]);

    // update the subscription details with the payment method
    await WorkspaceSubscriptionModelHandler.updateSubscription({
      payment_method_id: paymentMethodId,
      payment_card_details: {
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
        brand: paymentMethod.card?.brand,
        funding: paymentMethod.card?.funding,
        stripe_payment_method_id: paymentMethod?.id,
        stripe_customer_id: paymentMethod?.customer,
      }
    }, { partner_id: partnerId, id: userSubscriptionDetails.id });

    // Return success response
    return res.status(HttpStatusCode.Ok).send({
      ok: true,
      data: {
        customer_id: customerId,
        payment_method: paymentMethodId,
        process_date: currentDate
      }
    });

  } catch (e) {
    // Log error and return failure response
    logger.error(`Unexpected error while handling setup intent succeeded - ${e.message}`);
    return res.status(HttpStatusCode.InternalServerError).send({
      ok: false,
      data: e
    });
  }
};
