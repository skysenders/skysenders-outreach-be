import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { JWT, PARTNER_STATUS } from '../../config/constants';

/**
 * Functionality used to log in a partner
 * @param {*} req request
 * @param {*} res response
 * @returns {Object} partner and token
 */
export const partnerLogin = async(req, res) => {

  const TokenHandler = Container.get('TokenHandler');
  const PasswordHandler = Container.get('PasswordHandler');
  const PartnerModelHandler = Container.get('PartnerModelHandler');
  const PartnerSessionModelHandler = Container.get('PartnerSessionModelHandler');
  const logger = Container.get('logger');

  try {
    const { email, password } = req.body;

    // check if partner exists in the database
    logger.info(`Attempting to log in partner with email: ${email}`);
    let partnerDBData = await PartnerModelHandler.getPartnerByWhere({ email });

    // if the partner is not found in the database, respond with not found
    if (!partnerDBData) {
      logger.error(`Partner with email: ${email} not found`);
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: 'Partner not found' });
    }
    let isPasswordRight = false;

    if (req.body.cs_email && req.body.cs_email_verified) {
      isPasswordRight = true; // CS user login does not require password verification
    } else {
      // check partner password
      isPasswordRight = PasswordHandler.compare(password, partnerDBData.password);
    }

    // if password is not right, respond with unauthorized
    if (!isPasswordRight) {
      logger.error(`Invalid password attempt for partner with email: ${email}`);
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Credentials do not match' });
    }

    // check if partner is active
    if (partnerDBData.status !== PARTNER_STATUS.ACTIVE) {
      return res
        .status(StatusCodes.NOT_ACCEPTABLE)
        .send({ message: 'Email not verified or partner not active' });
    }

    // generate token with partner
    const token = await TokenHandler.generatePartnerToken(partnerDBData);

    // create a new partner session in the database
    await PartnerSessionModelHandler.createPartnerSession({
      partner_id: partnerDBData.id,
      refresh_token: token.refresh_token,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.ip || '',
      is_active: true,
      expires_at: token.refresh_token_expiries_at
    });

    // set access token in http only cookie
    res.setCookie('access_token', token.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/partners/refresh-token',
      maxAge: 1000 * JWT.ACCESS_TOKEN_EXPIRY_IN_SECONDS,
    });

    // set refresh token in http only cookie
    res.setCookie('refresh_token', token.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/partners/refresh-token',
      maxAge: 1000 * JWT.REFRESH_TOKEN_EXPIRY_IN_SECONDS, // 60 days
    });

    // remove password from response
    delete partnerDBData.password;
    delete token.refresh_token;
    delete token.refresh_token_expiries_at;

    logger.info(`Partner with email: ${email} logged in successfully`);
    // return token and partner info
    return res
      .status(StatusCodes.OK)
      .send({ token, partner: partnerDBData });

  } catch (error) {
    logger.error(`Error occurred during partner login: ${error.message}`);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
