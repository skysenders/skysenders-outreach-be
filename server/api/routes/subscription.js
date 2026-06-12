import { newPartnerPortalSession } from '../../controller/subscription/manageStripePortal';
import { createSetupIntent } from '../../controller/subscription/createSetupIntent';
import { saveBusinessDetails } from '../../controller/subscription/saveBusinessDetails';
import { updatePlanSubscription } from '../../controller/subscription/updatePlanSubscription';
import { planUnsubscribe } from '../../controller/subscription/planUnsubscribe';

export default async function subscriptionRoutes(fastify) {

  // Route to create a setup intent for a workspace.
  fastify.post(
    '/create-setup-intent',
    {
      schema: {
        tags: ['Subscription'],
        summary: 'Create a setup intent',
        description: 'API endpoint to create a setup intent for a workspace',
        operationId: 'createSetupIntent',
        hide: true,
        body: {
          type: 'object',
          required: [],
          properties: {},
          additionalProperties: true
        },
        response: {
          200: {
            description: 'Setup intent created successfully!',
            type: 'object',
            properties: {
              clientSecret: { type: 'string' },
            },
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
    }, createSetupIntent);

  // Route to save business details of the customer
  fastify.post(
    '/save-business-details',
    {
      schema: {
        tags: ['Subscription'],
        summary: 'Save business details',
        description: 'API endpoint to save business details of the customer',
        operationId: 'saveBusinessDetails',
        hide: true,
        body: {
          type: 'object',
          required: [ 'business_address' ],
          properties: {
            business_address: {
              type: 'object',
              required: [ 'line1', 'postal_code', 'country' ],
              properties: {
                line1: { type: 'string' },
                line2: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                postal_code: { type: 'string' },
                country: { type: 'string' }
              },
            },
            tax_details: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' }
              },
            },
          },
          additionalProperties: true
        },
        response: {
          200: {
            description: 'Business details saved successfully!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
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
    }, saveBusinessDetails );

  // Route for fetching domains
  fastify.post(
    '/subscribe',
    {
      schema: {
        tags: ['Subscription'],
        summary: 'Subscribe to a plan',
        description: 'API endpoint to subscribe to a plan',
        operationId: 'subscribeToPlan',
        hide: true,
        body: {
          type: 'object',
          required: [ 'plan_name' ],
          properties: {
            plan_name: { type: 'string' },
            coupon: { type: 'string' },
            payment_method_id: { type: 'string' },
            is_inr_payment: { type: 'boolean' },
            domain_count: { type: 'number' },
          },
          additionalProperties: true
        },
        response: {
          200: {
            description: 'Partner subscribed successfully!',
            type: 'object',
            properties: {
              message: { type: 'string' },
              isPaymentAuthenticationRequired: { type: 'boolean' },
              paymentIntentClientSecret: { type: 'string' }
            },
            additionalProperties: true
          },
          406: {
            description: 'Subsction plan already exists',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
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
    updatePlanSubscription
  );

  // Route for fetching domains
  fastify.post(
    '/unsubscribe',
    {
      schema: {
        tags: ['Subscription'],
        summary: 'Unsubscribe from a plan',
        description: 'API endpoint to unsubscribe from a plan',
        operationId: 'unsubscribeFromPlan',
        hide: true,
        body: {
          type: 'object',
          required: [],
          properties: {
            reason: { type: 'string' },
          },
          additionalProperties: true
        },
        response: {
          200: {
            description: 'Partner unscubscribed successfully!',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
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
    planUnsubscribe
  );

  /**
  * Route to manage billing cycle via Stripe's
  * own customer portal.
  */
  fastify.get('/create-portal-session', {
    schema: {
      tags: ['Subscription'],
      summary: 'Create new portal session',
      description: 'API endpoint to create a new portal session',
      operationId: 'createNewPortalSession',
      hide: true,
      response: {
        200: {
          description: 'New portal session created successfully!',
          type: 'object',
          properties: {
            url: { type: 'string' }
          }
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
  }, newPartnerPortalSession);
}
