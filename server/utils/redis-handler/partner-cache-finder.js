import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE } from '../../config/constants';

export const getPartnerIdFromOrigin = async(origin) => {
  const redisClient = Container.get('redisClient');
  const logger = Container.get('logger');
  try {
    // trim origin to just one .com or .net etc and get partner id from cache
    const trimmedOrigin = TRIM_ORIGIN_DOMAIN(origin);
    // find the partner_id based on the origin
    return await redisClient.get(`${PARTNER_ORIGIN_CACHE}${trimmedOrigin}`) || DEFAULT_PARTNER_ID;
  } catch (error) {
    logger.error('Error fetching partner ID from Redis:', error);
    return DEFAULT_PARTNER_ID;
  }
};

