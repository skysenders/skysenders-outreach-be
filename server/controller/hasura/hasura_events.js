
import { get } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { HASURA_EVENTS } from '../../config/constants';
import { prcoessWarmupStatusUpdate } from './../../services/hasura/events/prcoessWarmupStatusUpdate';

/**
 * Functionality used to send emails to customers to add standup
 * @param {*} req request
 * @param {*} res response
 * @param {*} next middleware
 * @returns {Object} user and token
 */
export const parseEvents = async(req, res) => {
  try {
    const body = req.body;
    switch (get(body, 'trigger.name')) {
      case HASURA_EVENTS.WARMUP_STATUS_UPDATE:
        return await prcoessWarmupStatusUpdate(req, res);
      default:
        res.status(StatusCodes.OK).send('Event processed successfully!');
    }
    return;
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: error.message });
    return;
  }
};
