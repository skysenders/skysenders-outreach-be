import { processStripeWebhook } from '../../controller/stripe_webhook/processStripeWebhook';

export default async function stripeWebhookRoutes(fastify) {
  // Route for fetching domains
  fastify.post(
    '/process-webhook',
    {
      schema: {
        tags: ['Stripe Webhook'],
        summary: 'Process partner stripe webhook',
        description: 'API endpoint to process partner stripe webhook',
        operationId: 'processPartnerStripeWebhook',
        hide: true,
        querystring: {
          type: 'object',
          properties: {
            partner_id: { type: 'integer' },
          },
          required: ['partner_id'],
        },
        body: {
          type: 'object', additionalProperties: true
        },
        response: {
          200: {
            description: 'Webhook processed successfully',
            type: 'object',
            additionalProperties: true,
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    processStripeWebhook
  );
}

