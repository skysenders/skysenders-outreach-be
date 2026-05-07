
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE, IS_PRODUCTION, FRONTEND_URL } from '../../config/constants';

/**
 * Functionality used to create a new user to the database
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} new user data
 */
export const addNewUser = async(req, res) => {
  try {
    const EmailVerificationHelper = Container.get('EmailVerificationHelper');
    const userData = req.body;

    const UserModelHandler = Container.get('UserModelHandler');
    const UserSessionModelHandler = Container.get('UserSessionModelHandler');
    const MailerInstance = Container.get('MailerInstance');
    const TokenHandler = Container.get('TokenHandler');
    const OtpGeneratorHelper = Container.get('OtpGeneratorHelper');
    const redisClient = Container.get('redisClient');
    const logger = Container.get('logger');

    console.log('request origin is ', req.origin);

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    const userEmails = [userData.email];

    // only do this for production
    if (IS_PRODUCTION) {
      // find user with two emails, one which he has provided, second removing the +
      userEmails.push(EmailVerificationHelper.getFormattedEmail(userData.email));
    }

    const [existUser] = await Promise.all([
      UserModelHandler.getUserByWhere({
        partner_id: partnerId,
        email: userEmails
      })
    ]);

    if (existUser && existUser.id) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'User exist in the system already. Please login to continue' });
    }

    // generatee otp for the user
    const otp = OtpGeneratorHelper.generateOTP();
    userData.signup_otp = otp;
    userData.partner_id = partnerId;

    const newUser = await UserModelHandler.createUser(userData);

    if (!(newUser && newUser.id)) {
      throw new Error('Something went wrong in database');
    }

    const emailInput = {
      from: 'Ramesh from Sky Senders <ramesh@skysendershq.com>',
      toAddress: userData.email,
      subject: 'Welcome to SkySenders, here’s your OTP to log in!',
      html: `<html>
    <head>
      <title>Verify Email | Skysenders</title>
    </head>
    <body>
      <div>
        <p><b>${otp}</b> is your SkySenders OTP code.</p>
        <p>
            Alternatively, you can verify your account automatically by clicking the link
            <a href="${FRONTEND_URL}/user-verification?partner_id=${partnerId}&uuid=${newUser.uuid}&otp=${otp}">here</a>.
        </p>
        <p>If you did not sign up for this account, you can safely ignore this email.</p>
     </div>
    </body>
</html>`,
    };

    // send welcome email
    MailerInstance.sendMail(emailInput);

    // send success response to UI  with user data & token
    const token = await TokenHandler.generate(newUser);
    // create a new session for the user
    UserSessionModelHandler.createUserSession({
      user_id: newUser.id,
      partner_id: partnerId,
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at
    });
    delete newUser.password;
    return res.status(StatusCodes.CREATED).send({ user: newUser, token });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Server error: ${error.message}`});
  }
};
