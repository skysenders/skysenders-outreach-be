import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE, PARTNER_EMAIL_SETTINGS_CACHE, EMAIL_TEMPLATE_NAME } from '../../config/constants';

/**
 * Functionality used send otp to a mail for resetting password
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const forgotPassword = async(req, res) => {
  try {

    const UserModelHandler = Container.get('UserModelHandler');
    const MailerInstance = Container.get('MailerInstance');
    const redisClient = Container.get('redisClient');
    const logger = Container.get('logger');
    const StringHelper = Container.get('StringHelper');

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    // normalize email to lowercase
    const email = req.body.email.toLowerCase().trim();

    const user = await UserModelHandler.getUserByWhere({
      partner_id: partnerId,
      email,
      is_client: false
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    await UserModelHandler.updateUser(
      { last_sent_password_link_date: new Date().toISOString() },
      { id: user.id });

    // fetch partner email details from the redis cache
    const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${partnerId}`);
    const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

    const token = StringHelper.encodeToken({ partner_id: partnerId, uuid: user.uuid});

    // send welcome email
    MailerInstance.sendMail({
      partnerId,
      type: EMAIL_TEMPLATE_NAME.FORGOT_PASSWORD,
      to: user.email,
      cc: [],
      data: {
        reset_link_expiry_minutes: 30,
        token,
        ...parsedPartnerEmailDetails
      }
    });

    return res
      .status(StatusCodes.OK)
      .send({ message: `Password reset link has been sent to ${email}` });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const resetPassword = async(req, res) => {
  const UserModelHandler = Container.get('UserModelHandler');
  try {
    const { token, new_password: newPassword } = { ...req.body };

    // decode the token to get partner_id and uuid
    const StringHelper = Container.get('StringHelper');
    const decodedToken = StringHelper.decodeToken(token);

    // throw error if token does not have partner_id and uuid
    if (!decodedToken.partner_id || !decodedToken.uuid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid token' });
    }

    // check if the user exist
    const user = await await UserModelHandler.getUserByWhere({
      partner_id: decodedToken.partner_id,
      uuid: decodedToken.uuid,
    });

    if (user) {
      if (!user.last_sent_password_link_date) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ message: 'Password link expired!' });
      }
      const updatePasswordData = {
        password: newPassword,
        last_reset_password_date: new Date().toISOString(),
        last_sent_password_link_date: null,
      };

      await UserModelHandler.updateUser(updatePasswordData, { id: user.id });

      return res
        .status(StatusCodes.OK)
        .send({ message: 'Password reset successful.' });
    }
    return res
      .status(StatusCodes.NOT_FOUND)
      .send({ message: 'Link is not valid.' });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const updatePassword = async(req, res) => {
  try {
    const { password, new_password: newPassword } = { ...req.body };

    const { id } = req.user;

    const UserModelHandler = Container.get('UserModelHandler');
    const PasswordHandler = Container.get('PasswordHandler');
    const logger = Container.get('logger');

    let user, oldPassword;

    user = await UserModelHandler.getUserByWhere({ id });

    if (!user) {
      logger.info(`user not found! - ${id}`);
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    oldPassword = user.password;

    const isPasswordRight = PasswordHandler.compare(password, oldPassword);

    if (!isPasswordRight) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Credentials does not match' });
    }

    const updatePasswordData = {
      password: newPassword,
      last_reset_password_date: new Date().toISOString(),
    };
    await UserModelHandler.updateUser(updatePasswordData, { id: user.id });

    return res
      .status(StatusCodes.OK)
      .send({ message: 'Password has been updated.' });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const updateUserInfo = async(req, res) => {
  try {
    const userData = { ...req.body };
    const { id } = req.user;

    const UserModelHandler = Container.get('UserModelHandler');
    const user = await UserModelHandler.getUserByWhere({ id });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    const updateUserData = { name: userData.name, profile_url: userData.profile_url, timezone: userData.timezone };

    await UserModelHandler.updateUser(updateUserData, { id: user.id });

    return res
      .status(StatusCodes.OK)
      .send({ message: 'Profile updated successfully.' });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
