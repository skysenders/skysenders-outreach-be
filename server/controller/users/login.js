import { Container } from 'typedi';
import { isEmpty } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE, USER_STATUS, PARTNER_EMAIL_SETTINGS_CACHE, EMAIL_TEMPLATE_NAME } from '../../config/constants';

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const userLogin = async(req, res) => {
  try {
    const TokenHandler = Container.get('TokenHandler');
    const PasswordHandler = Container.get('PasswordHandler');
    const UserModelHandler = Container.get('UserModelHandler');
    const UserSessionModelHandler = Container.get('UserSessionModelHandler');
    const redisClient = Container.get('redisClient');
    const logger = Container.get('logger');

    const { password } = req.body;

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }
    // normalize email to lowercase
    const email = req.body.email.toLowerCase().trim();

    // check if user exists in the database
    let userDBData = await UserModelHandler.getUserByWhere({
      partner_id: partnerId,
      email,
      is_client: false
    });

    // if the user is not found in the database, respond with user not found
    if (!userDBData) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    // check user password is right or not
    let isPasswordRight;

    if (req.body.cs_email && req.body.cs_email_verified) {
      isPasswordRight = true; // CS user login does not require password verification
    } else {
      isPasswordRight = PasswordHandler.compare(
        password,
        userDBData.password
      );
    }

    // if password is not right, respond with unauthorized
    if (!isPasswordRight) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Credentials does not match' });
    }
    // check if user is verified or not, return email not verified
    if (userDBData.status !== USER_STATUS.ACTIVE) {
      return res
        .status(StatusCodes.NOT_ACCEPTABLE)
        .send({ message: 'Email not verified' });
    }

    // generate token with user
    const token = await TokenHandler.generate(userDBData);

    // create a new session for the user
    UserSessionModelHandler.createUserSession({
      user_id: userDBData.id,
      partner_id: partnerId,
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at
    });

    // remove password from user data
    delete userDBData.password;

    // return user and token to the UI
    return res
      .status(StatusCodes.OK)
      .send({ token, user: userDBData });

  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to log in a user
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const userMagicLinkLogin = async(req, res) => {
  try {
    const TokenHandler = Container.get('TokenHandler');
    const UserModelHandler = Container.get('UserModelHandler');
    const UserSessionModelHandler = Container.get('UserSessionModelHandler');
    const StringHelper = Container.get('StringHelper');

    // encode the token to handle special characters in the token
    const decodedToken = StringHelper.decodeToken(req.query.token);

    // throw error if token does not have partner_id and uuid
    if (!decodedToken.partner_id || !decodedToken.uuid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid token' });
    }

    // check if user exists in the database
    let userDBData = await UserModelHandler.getUserByWhere({
      partner_id: decodedToken.partner_id,
      uuid: decodedToken.uuid,
    });

    // if the user is not found in the database, respond with user not found
    if (!userDBData) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'User not found' });
    }

    if (userDBData.magic_link_expiry_date < new Date()) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Magic link has expired' });
    }

    // generate token with user
    const token = await TokenHandler.generate(userDBData);

    // create a new session for the user
    UserSessionModelHandler.createUserSession({
      user_id: userDBData.id,
      partner_id: userDBData.partner_id,
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at
    });

    // remove password from user data
    delete userDBData.password;

    // reset the magic link
    await UserModelHandler.updateUser({
      magic_link_expiry_date: null,
    }, {
      id: userDBData.id
    });

    // return user and token to the UI
    return res
      .status(StatusCodes.OK)
      .type('application/json')
      .send({ token, user: userDBData });

  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to resend user activation link
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const resendUserActivationLink = async(req, res) => {
  try {
    const UserModelHandler = Container.get('UserModelHandler');
    const MailerInstance = Container.get('MailerInstance');
    const redisClient = Container.get('redisClient');
    const StringHelper = Container.get('StringHelper');
    const logger = Container.get('logger');

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    // normalize email to lowercase
    const email = req.body.email.toLowerCase().trim();

    let user = await UserModelHandler.getUserByWhere({
      partner_id: partnerId,
      email,
      is_client: false
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'Invalid email address!' });
    }

    if (user.status === USER_STATUS.ACTIVE) {
      return res
        .status(StatusCodes.OK)
        .send({ message: 'Account already active. Please proceed to log in.' });
    }

    if (user.status !== USER_STATUS.INVITED) {
      return res.status(StatusCodes.OK).send({
        message: 'Account deactivated. Contact support for reactivation.',
      });
    }

    // fetch partner email details from the redis cache
    const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${partnerId}`);
    const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

    const token = StringHelper.encodeToken({ partner_id: partnerId, uuid: user.uuid});

    // send welcome email
    MailerInstance.sendMail({
      partnerId,
      type: EMAIL_TEMPLATE_NAME.SIGNUP,
      to: user.email,
      cc: [],
      data: {
        otp_code: user.signup_otp,
        otp_expiry_minutes: 30,
        token,
        ...parsedPartnerEmailDetails
      }
    });

    // send success response to UI
    return res
      .status(StatusCodes.OK)
      .send({ message: 'Email sent successfully!' });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

/**
 * Functionality used to verify a user email address
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} user and token
 */
export const verifyUserByUuid = async(req, res) => {
  try {
    const TokenHandler = Container.get('TokenHandler');
    const UserModelHandler = Container.get('UserModelHandler');
    const UserSessionModelHandler = Container.get('UserSessionModelHandler');
    const StringHelper = Container.get('StringHelper');

    // encode the token to handle special characters in the token
    const decodedToken = StringHelper.decodeToken(req.query.token);

    // throw error if token does not have partner_id and uuid
    if (!decodedToken.partner_id || !decodedToken.uuid) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid token' });
    }

    const { otp } = req.query;

    const user = await UserModelHandler.getUserByWhere({
      partner_id: decodedToken.partner_id,
      uuid: decodedToken.uuid,
    });

    if (isEmpty(user)) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'Invalid link!' });
    }

    if (user.signup_otp !== otp) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Invalid otp!' });
    }

    // update user status to active
    user.status = USER_STATUS.ACTIVE;

    // delete password from user object
    delete user.password;

    // generate token with user
    const token = await TokenHandler.generate(user);

    // create a new session for the user
    UserSessionModelHandler.createUserSession({
      user_id: user.id,
      partner_id: user.partner_id,
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at
    });

    // update user with is_email_verified as true
    UserModelHandler.updateUser({ status: USER_STATUS.ACTIVE, signup_otp: null }, { id: user.id });

    // return user and token to the UI
    res.status(StatusCodes.OK).send({ user, token });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

