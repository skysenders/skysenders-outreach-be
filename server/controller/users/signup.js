
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { TRIM_ORIGIN_DOMAIN, DEFAULT_PARTNER_ID, PARTNER_ORIGIN_CACHE,
  IS_PRODUCTION, PARTNER_EMAIL_SETTINGS_CACHE, EMAIL_TEMPLATE_NAME,
  USER_STATUS, AUTH_PROVIDER} from '../../config/constants';
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
        email: userEmails,
        is_client: false
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
      auth_provider: AUTH_PROVIDER.EMAIL
    });

    // delete the password
    delete newUser.password;

    return res.status(StatusCodes.CREATED).send({ user: newUser, token });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Server error: ${error.message}`});
  }
};

export const socialLoginOrSignup = async({ partnerId, email, name, profileUrl, authProvider, providerUserId }, token, userAgent, ip) => {
  const UserModelHandler = Container.get('UserModelHandler');
  const UserSessionModelHandler = Container.get('UserSessionModelHandler');
  const TokenHandler = Container.get('TokenHandler');
  const logger = Container.get('logger');

  try {
    // check whether email with that email address exists
    let existUser = await UserModelHandler.getUserByWhere({
      email: email.toLowerCase().trim(),
      partner_id: partnerId,
      is_client: false
    });

    if (existUser && existUser.id && existUser.auth_provider !== authProvider) {
      // update user auth provider if it's different from the one in the database
      existUser = await UserModelHandler.updateUser({
        name: name || existUser.name,
        profile_url: profileUrl || existUser.profile_url,
        auth_provider: authProvider,
        provider_user_id: providerUserId,
        status: USER_STATUS.ACTIVE
      }, {
        id: existUser.id
      });
      logger.info(`Updated auth provider for user ${existUser.id} to ${authProvider}`);
    } else if (!existUser || !existUser.id) {
      // else create a new user, create session and return the token
      existUser = await UserModelHandler.createUser({
        partner_id: partnerId,
        email,
        name,
        status: USER_STATUS.ACTIVE,
        profile_url: profileUrl,
        auth_provider: authProvider,
        provider_user_id: providerUserId,
      });

      if (!(existUser && existUser.id)) {
        throw new Error('Something went wrong in database');
      } else {
        logger.info(`New user created with id ${existUser.id} through social login/signup`);
      }
    }

    // create a session and return the token
    const tokenData = await TokenHandler.generate(existUser);

    // create a new user session in the database
    await UserSessionModelHandler.createUserSession({
      user_id: existUser.id,
      partner_id: partnerId,
      refresh_token: tokenData.refresh_token,
      user_agent: userAgent || '',
      ip_address: ip || '',
      is_active: true,
      expires_at: tokenData.refresh_token_expiries_at,
      auth_provider: authProvider
    });

    // if invite token exists, then join the user to the workspace
    if (token) {
      const joinWorkspaceResult = await joinWorkspace(token, existUser.id);
      if (joinWorkspaceResult[1]) {
        logger.error(`Error joining workspace for user ${existUser.id}: ${joinWorkspaceResult[1].message}`);
        existUser.invited_accepted = false;
        existUser.invited_workspace_join_error = joinWorkspaceResult[1].message;
      } else {
        existUser.invited_accepted = true;
        existUser.invited_workspace_id = joinWorkspaceResult[0].workspace_id;
        existUser.invited_workspace_role = joinWorkspaceResult[0].role;
      }
    }

    // return user and token to the UI
    return { jwtToken: tokenData, user: {
      name: existUser.name,
      email: existUser.email,
      invited_accepted: existUser.invited_accepted,
      invited_workspace_id: existUser.invited_workspace_id,
      invited_workspace_role: existUser.invited_workspace_role,
      invited_workspace_join_error: existUser.invited_workspace_join_error
    } };
  } catch (error) {
    console.error('Error in social login/signup:', error);
    throw error;
  }
};
