import { Container } from 'typedi';
import bcrypt from 'bcryptjs';
import { SALT_WORK_FACTOR } from '../config/constants';

/**
 * Functionality used to encrypt user password
 * @param {*} password password
 * @returns {String} it returns encrypted password
 */
export const encrypt = (password) => {
  const logger = Container.get('logger');
  try {
    // Hashing the password
    const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
    return bcrypt.hashSync(password, salt);
  } catch (err) {
    logger.error(`Error while encrypting password ${err.message}`);
    throw err;
  }
};

/**
 * Functionality used to compare user password
 * @param {*} password password
 * @param {*} hash hashs
 * @returns {String} it returns decrypted password
 */
export const compare = (password, hash) => {
  const logger = Container.get('logger');
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    logger.error(`Error while comparing password ${err.message}`);
    throw err;
  }
};

