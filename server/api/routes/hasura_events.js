import { parseEvents } from './../../controller/hasura/hasura_events';

export default async function hasuraWebhookRoutes(fastify) {
  // Route for fetching domains
  fastify.post(
    '/events',
    {
      schema: {
        tags: ['Hasura Events'],
        summary: 'Process hasura events',
        description: 'API endpoint to process hasura events',
        operationId: 'processHasuraEvents',
        hide: true,
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
    parseEvents
  );
}

