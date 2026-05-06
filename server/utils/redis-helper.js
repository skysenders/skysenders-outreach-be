/**
 * Get the current date in UTC format: YYYY-MM-DD
 * @returns {string} Current date in UTC format: YYYY-MM-DD
 */
const getCurrentUTCDate = () => new Date().toISOString().split('T')[0];

/**
 * Create a Redis key in the format "public_api_leaderboard:YYYY-MM-DD"
 *
 * @returns {string} Redis key in the format "public_api_leaderboard:YYYY-MM-DD"
 */
export const getLeaderBoardKey = () => {
  const currentDate = getCurrentUTCDate();
  return `public_api_leaderboard:${currentDate}`;
};

/**
 * Returns the Redis key for a database query.
 *
 * @param {string} remainderKey - The remainder key to be appended to the Redis key.
 * @returns {string} The Redis key for the database query.
 */
export const getDBQueryKey = (remainderKey) => {
  return `db_query:${remainderKey}`;
};
