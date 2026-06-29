
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { IS_PRODUCTION, PARTNER_EMAIL_SETTINGS_CACHE, EMAIL_TEMPLATE_NAME,
  USER_STATUS, AUTH_PROVIDER, USER_ROLE } from '../../config/constants';
import { joinAccountByToken } from './joinAccountWithToken';

const createAccountPlanDetails = async(accountId, partnerId) => {
  const AccountPlanDetailsModelHandler = Container.get('AccountPlanDetailsModelHandler');
  const AccountSubscriptionModelHandler = Container.get('AccountSubscriptionModelHandler');
  const logger = Container.get('logger');
  try {
    logger.info(`Creating account plan details for account ${accountId} and partner ${partnerId}`);
    await Promise.all([
      AccountPlanDetailsModelHandler.createPlanDetails({
        partner_id: partnerId,
        account_id: accountId,
      }),
      AccountSubscriptionModelHandler.createSubscription({
        partner_id: partnerId,
        account_id: accountId,
      })
    ]);
    logger.info(`Account plan details created successfully for account ${accountId} and partner ${partnerId}`);
  } catch (error) {
    logger.error(`Error creating account plan details for account ${accountId}: ${error.message}`);
    throw error;
  }
};

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

    const AccountsModelHandler = Container.get('AccountsModelHandler');
    const UserModelHandler = Container.get('UserModelHandler');
    const UserSessionModelHandler = Container.get('UserSessionModelHandler');

    const MailerInstance = Container.get('MailerInstance');
    const TokenHandler = Container.get('TokenHandler');
    const OtpGeneratorHelper = Container.get('OtpGeneratorHelper');

    const redisClient = Container.get('redisClient');
    const PartnerCacheHelper = Container.get('PartnerCacheHelper');
    const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

    const StringHelper = Container.get('StringHelper');
    const logger = Container.get('logger');

    const partnerId = await PartnerCacheHelper.getPartnerIdFromOrigin(req.origin);
    if (!partnerId) {
      logger.warn(`Partner ID not found in cache for origin: ${req.origin}`);
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

    if (existUser && existUser.id && existUser.status !== USER_STATUS.INVITED) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'User exist in the system already. Please login to continue' });
    }
    let newUser;
    if (existUser && existUser.id && existUser.status === USER_STATUS.INVITED) {

      // reset the status and flag
      userData.status = USER_STATUS.ACTIVE;
      newUser = await UserModelHandler.updateUser(userData, {
        id: existUser.id
      });

      if (req.body.token) {
        const joinAccountResult = await joinAccountByToken(req.body.token, newUser.id);
        if (joinAccountResult[1]) {
          logger.error(`Error joining account for user ${newUser.id}: ${joinAccountResult[1].message}`);
          newUser.invited_accepted = false;
          newUser.invited_account_join_error = joinAccountResult[1].message;
        } else {
          newUser.invited_accepted = true;
          newUser.invited_user_role = joinAccountResult[0].role;
        }
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

      // set refresh token in http only cookie
      TokenHandler.setRefreshTokenCookie(res, token.refresh_token, req.headers.origin);

      // remove password from user data
      delete newUser.password;
      delete token.refresh_token;
      delete token.refresh_token_expiries_at;

      return res.status(StatusCodes.CREATED).send({ message: 'User created successfuly!', otp_validation_required: false, user: newUser, token });
    } else {
      // generatee otp for the user
      const otp = OtpGeneratorHelper.generateOTP();
      userData.signup_otp = otp;
      userData.partner_id = partnerId;

      // first create a account for the user
      const account = await AccountsModelHandler.createAccount({
        partner_id: partnerId,
        name: userData.name,
        email: userData.email
      });

      if (!(account && account.id)) {
        throw new Error('Something went wrong in database while creating account');
      }

      userData.account_id = account.id;

      newUser = await UserModelHandler.createUser(userData);
      createAccountPlanDetails(account.id, partnerId);
      // update user as SUPER_ADMIN in the redis
      await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
        accountId: account.id,
        userId: newUser.id,
        role: USER_ROLE.SUPER_ADMIN
      });

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
      return res.status(StatusCodes.CREATED).send({ message: `OPT sent successfully to ${userData.email}`, otp_validation_required: true, otp_token: token });
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Server error: ${error.message}`});
  }
};

export const createUserForPartner = async(req, res) => {
  const UserModelHandler = Container.get('UserModelHandler');
  const AccountsModelHandler = Container.get('AccountsModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');
  const PartnerKeyHelper = Container.get('PartnerKeyHelper');

  try {
    const userData = req.body;
    // encode the token to handle special characters in the token
    const decodedToken = PartnerKeyHelper.validatePartnerToken(req.headers['x-partner-key']);

    // throw error if token does not have partner_id
    if (!decodedToken.partner_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid partner key' });
    }

    const partnerId = decodedToken.partner_id;

    // normalize email to lowercase
    userData.email = userData.email.toLowerCase().trim();
    userData.partner_id = partnerId;

    // normalize email to lowercase
    userData.email = userData.email.toLowerCase().trim();

    const userEmails = [userData.email];

    const [existUser] = await Promise.all([
      UserModelHandler.getUserByWhere({
        partner_id: partnerId,
        email: userEmails,
        is_client: false
      })
    ]);

    if (existUser && existUser.id && existUser.status !== USER_STATUS.INVITED) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'User exist in the system already. Please login to continue' });
    }

    // first create a account for the user
    const account = await AccountsModelHandler.createAccount({
      partner_id: partnerId,
      name: userData.name,
      email: userData.email
    });

    if (!(account && account.id)) {
      throw new Error('Something went wrong in database while creating account');
    }

    userData.account_id = account.id;

    // set user status as active and auth provider as email
    userData.status = USER_STATUS.ACTIVE;

    const newUser = await UserModelHandler.createUser(userData);
    createAccountPlanDetails(account.id, partnerId);

    // update user as SUPER_ADMIN in the redis
    await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
      accountId: account.id,
      userId: newUser.id,
      role: USER_ROLE.SUPER_ADMIN
    });

    return res.status(StatusCodes.CREATED).send({ message: 'User created successfuly!', user: newUser });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Server error: ${error.message}`});
  }
};

export const socialLoginOrSignup = async({ partnerId, email, name, profileUrl, authProvider, providerUserId }, token, userAgent, ip) => {
  const UserModelHandler = Container.get('UserModelHandler');
  const AccountsModelHandler = Container.get('AccountsModelHandler');
  const UserSessionModelHandler = Container.get('UserSessionModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');
  const TokenHandler = Container.get('TokenHandler');
  const logger = Container.get('logger');

  try {
    // check whether email with that email address exists
    const existUserList = await UserModelHandler.getUsersByWhere({
      email: email.toLowerCase().trim(),
      partner_id: partnerId,
    });

    let existUser = existUserList.filter(u => !u.is_client)[0] || null;
    let existClientUser = existUserList.filter(u => u.is_client)[0] || null;

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
      // check if it is a client user
      if (existClientUser && existClientUser.id) {
        // if auth provider is not set, then update it
        if (existClientUser.auth_provider !== authProvider) {
          // update user auth provider if it's different from the one in the database
          existClientUser = await UserModelHandler.updateUser({
            name: name || existClientUser.name,
            profile_url: profileUrl || existClientUser.profile_url,
            auth_provider: authProvider,
            provider_user_id: providerUserId
          }, {
            id: existClientUser.id
          });
        }
        existUser = existClientUser;
      } else {
        // create a account for the user
        const account = await AccountsModelHandler.createAccount({
          partner_id: partnerId,
          name: name,
          email: email
        });

        // else create a new user, create session and return the token
        existUser = await UserModelHandler.createUser({
          partner_id: partnerId,
          email,
          name,
          status: USER_STATUS.ACTIVE,
          account_id: account.id,
          profile_url: profileUrl,
          auth_provider: authProvider,
          provider_user_id: providerUserId,
        });
        createAccountPlanDetails(account.id, partnerId);
        // update user as SUPER_ADMIN in the redis
        await AccountWorkspaceRedisCacheHelper.setAccountUserRole({
          accountId: account.id,
          userId: existUser.id,
          role: USER_ROLE.SUPER_ADMIN
        });
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
      const joinAccountResult = await joinAccountByToken(token, existUser.id);
      if (joinAccountResult[1]) {
        logger.error(`Error joining account for user ${existUser.id}: ${joinAccountResult[1].message}`);
        existUser.invited_accepted = false;
        existUser.invited_account_join_error = joinAccountResult[1].message;
      } else {
        existUser.invited_accepted = true;
        existUser.invited_user_role = joinAccountResult[0].role;
      }
    }

    // return user and token to the UI
    return { jwtToken: tokenData, user: {
      id: existUser.id,
      name: existUser.name,
      email: existUser.email,
      is_client: existUser.is_client,
      invited_accepted: existUser.invited_accepted,
      invited_user_role: existUser.invited_user_role,
      invited_account_join_error: existUser.invited_account_join_error
    } };
  } catch (error) {
    logger.error(`Error in social login/signup: ${error.message}`);
    throw error;
  }
};
