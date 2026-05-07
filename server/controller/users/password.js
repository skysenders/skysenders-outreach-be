import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE, FRONTEND_URL } from '../../config/constants';

/**
 * Functionality used send otp to a mail for resetting password
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const forgotPassword = async(req, res) => {
  try {
    const { email } = { ...req.body };

    const UserModelHandler = Container.get('UserModelHandler');
    const MailerInstance = Container.get('MailerInstance');
    const redisClient = Container.get('redisClient');
    const logger = Container.get('logger');

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    const user = await UserModelHandler.getUserByWhere({
      partner_id: partnerId,
      email,
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    await UserModelHandler.updateUser(
      { last_sent_password_link_date: new Date().toISOString() },
      { id: user.id });

    const emailInput = {
      from: 'Ramesh from Sky Senders <ramesh@skysendershq.com>',
      toAddress: email,
      subject: 'Reset your password',
      html: `<html>
    <head>
      <title>Reset Password | Skysenders</title>
    </head>
    <body>
      <div>
        <p>
          Please click 👉 <a href="${FRONTEND_URL}/reset-password?partner_id=${partnerId}&uuid=${user.uuid}">here</a> to reset your password
        </p>
     </div>
    </body>
</html>`,
    };

    // send reset password email
    MailerInstance.sendMail(emailInput);

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
    const { partner_id: partnerId, uuid, new_password: newPassword } = { ...req.body };

    // check if the user exist
    const user = await await UserModelHandler.getUserByWhere({
      partner_id: partnerId,
      uuid,
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
