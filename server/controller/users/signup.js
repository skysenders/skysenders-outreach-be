
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE,
  IS_PRODUCTION, PARTNER_EMAIL_SETTINGS_CACHE, EMAIL_TEMPLATE_NAME,
  USER_STATUS} from '../../config/constants';
import { joinWorkspace } from '../workspaces/joinWorkspaceWithToken';

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
    const StringHelper = Container.get('StringHelper');
    const logger = Container.get('logger');

    console.log('request origin is ', req.origin);

    // find the partner_id based on the req.origin
    let partnerId = await redisClient.get(`${PARTNER_ORIGIN_CACHE}${TRIM_ORIGIN_DOMAIN(req.origin)}`) || DEFAULT_PARTNER_ID;

    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${TRIM_ORIGIN_DOMAIN(req.origin)}`);
      // if partner id is not found in cache return error
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid origin. Please contact support if you think this is an error.' });
    }

    // normalize email to lowercase
    userData.email = userData.email.toLowerCase().trim();

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

    if (existUser && existUser.id && !existUser.is_first_invite) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'User exist in the system already. Please login to continue' });
    }
    let newUser;
    if (existUser && existUser.id && existUser.is_first_invite) {
      // reset the status and flag
      userData.status = USER_STATUS.ACTIVE;
      userData.is_first_invite = false;
      newUser = await UserModelHandler.updateUser(userData, {
        id: existUser.id
      });
      if (req.body.token) {
        const joinWorkspaceResult = await joinWorkspace(req.body.token, newUser.id);
        if (joinWorkspaceResult[1]) {
          logger.error(`Error joining workspace for user ${newUser.id}: ${joinWorkspaceResult[1].message}`);
          newUser.invited_accepted = false;
          newUser.invited_workspace_join_error = joinWorkspaceResult[1].message;
        } else {
          newUser.invited_accepted = true;
          newUser.invited_workspace_id = joinWorkspaceResult[0].workspace_id;
          newUser.invited_workspace_role = joinWorkspaceResult[0].role;
        }
      }
    } else {
      // generatee otp for the user
      const otp = OtpGeneratorHelper.generateOTP();
      userData.signup_otp = otp;
      userData.partner_id = partnerId;

      newUser = await UserModelHandler.createUser(userData);

      if (!(newUser && newUser.id)) {
        throw new Error('Something went wrong in database');
      }

      // fetch partner email details from the redis cache
      const partnerEmailDetails = await redisClient.get(`${PARTNER_EMAIL_SETTINGS_CACHE}${partnerId}`);
      const parsedPartnerEmailDetails = JSON.parse(partnerEmailDetails || '{}');

      const token = StringHelper.encodeToken({ partner_id: partnerId, uuid: newUser.uuid});

      // send welcome email
      MailerInstance.sendMail({
        partnerId,
        type: EMAIL_TEMPLATE_NAME.SIGNUP,
        to: userData.email,
        cc: [],
        data: {
          otp_code: otp,
          otp_expiry_minutes: 30,
          token,
          ...parsedPartnerEmailDetails
        }
      });
    }

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
      expires_at: token.refresh_token_expiries_at,
      invited_accepted: newUser.invited_accepted || null,
      invited_workspace_join_error: newUser.invited_workspace_join_error || null,
      invited_workspace_id: newUser.invited_workspace_id || null,
      invited_workspace_role: newUser.invited_workspace_role || null,
    });
    // delete the password
    delete newUser.password;

    return res.status(StatusCodes.CREATED).send({ user: newUser, token });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Server error: ${error.message}`});
  }
};
