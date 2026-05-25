import { Container } from 'typedi';
import { db } from '../../../db';
import { QueryTypes } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { AWS_IMAP_REGION_SQS_URL_MAP, AWS_IMAP_SQS_REGIONS, AUTH_TOKEN } from '../../../config/constants';


// handler to fetch mailboxes for sync
export const fetchMailboxesForSync = async(req, reply) => {
  const logger = Container.get('logger');
  const AwsService = Container.get('AwsService');
  let isReplySent = false;

  try {
    // validate auth token
    if (req.query['auth-token'] !== AUTH_TOKEN) {
      return reply.status(StatusCodes.OK).send({
        message: 'Fetching eligible sync mailboxes failed | Auth validation failed.'
      });
    }

    // Immediate response
    reply.status(StatusCodes.OK).send({
      message: 'Fetching eligible mailboxes initiated successfully.',
    });

    isReplySent = true;

    logger.info('Fetching eligible sync mailboxes...');

    const [rows] = await db.sequelize.query(
      `
      WITH cte AS (
        SELECT mailbox_id, partner_id, workspace_id, esp_type
        FROM mailboxes_sync_state
        WHERE last_checked_at <= now() - interval '30 minutes'
        ORDER BY last_checked_at NULLS FIRST
        LIMIT 10000
        FOR UPDATE SKIP LOCKED
      )
      UPDATE mailboxes_sync_state d
      SET last_checked_at = now()
      FROM cte
      WHERE d.mailbox_id = cte.mailbox_id
      RETURNING d.partner_id, d.workspace_id, d.mailbox_id, d.esp_type;
      `,
      { type: QueryTypes.UPDATE }
    );

    logger.info(`Eligible sync mailboxes fetched: ${rows.length}`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map((mailbox) => {
          const randomRegion =
            AWS_IMAP_SQS_REGIONS[
              Math.floor(Math.random() * AWS_IMAP_SQS_REGIONS.length)
            ];

          const sqsUrl = AWS_IMAP_REGION_SQS_URL_MAP[randomRegion];

          return AwsService.sendSQSMessageByRegion(
            sqsUrl,
            mailbox,
            randomRegion
          );
        })
      );
    }
  } catch (error) {
    logger.error(
      `Error during fetch of eligible sync mailboxes: ${error.message}`
    );

    if (!isReplySent) {
      return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: `Error during fetch: ${error.message}`,
      });
    }
  }
};

