/**
 * Functionality used to generate UNIQUE API key for the user
 * @argument {name} uuid String
 * @returns {String} unique_user_key
 */
export const generateUniqueAPIKey = (uuid) => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return `${uuid}_${Math.random().toString(36).slice(2, 9)}`;
};

module.exports = {
  generateUniqueAPIKey,
};
