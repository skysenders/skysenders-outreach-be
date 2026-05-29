
import Container from 'typedi';
import { makeWarmupProxyAPICall } from '../../../api/routes/proxy/warmup-proxy';

/**
 * Functionality used to delete cron triggers for gsheet scheduler
 * @param {*} req request
 * @param {*} res response
 * @param {*} next middleware
 * @returns {Object} user and token
 */
export const prcoessWarmupStatusUpdate = async(req) => {
  const logger = Container.get('logger');
  try {
    const result = await makeWarmupProxyAPICall('/api/warmup/internal/process-warmup-status-change', 'POST', req.body);
    logger.info(`Warmup status update processed successfully: ${JSON.stringify(result)}`);
    return 'Warmup status update processed successfully!';
  } catch (error) {
    logger.error(`Error processing warmup status update: ${error.message}`);
    return;
  }
};
