import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';

// Main function to handle invoice payment failure
export const handlePaymentIntentSucceeded = async(event, res) => {
  const logger = Container.get('logger');
  try {

    // Extract webhook data (Invoice failure details)
    const webhookData = event.data.object;
    const partnerId = event.partner_id;

    const metadata = webhookData.metadata || {};

    const { accountId } = metadata;

    // If no accountId found, ignore the webhook
    if (!partnerId || !accountId) {
      return res.status(StatusCodes.OK).send({
        ok: false,
        data: { message: 'Webhook ignored - accountId not found' },
      });
    }

    // return the response
    res.status(StatusCodes.CREATED).send({ message: 'Payment intent webhook processed successfully.' });
  } catch (e) {
    // Log error and return failure response
    logger.error(`Unexpected error while handling invoice payment intent success - ${e.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      ok: false,
      data: e
    });
  }
};
