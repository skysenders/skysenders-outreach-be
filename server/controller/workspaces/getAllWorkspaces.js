import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/index';

export const getAllWorkspaces = async(req, res) => {
  const logger = Container.get('logger');

  try {
    const user = req.user;

    // fetch all the workspaces associated to the logged in user
    const query = `SELECT 
          w.id as id,
          w.name,
          w.slug,
          w.logo_url,
          w.logo_bg_color,
          w.theme_color,
          u.role,
          u.status,
          w.created_at
      FROM users u
      INNER JOIN workspaces w ON u.account_id = w.account_id
      WHERE u.id = :userId;`;

    const workspaces = await db.sequelize.query(query, {
      replacements: { userId: user.id },
      type: db.sequelize.QueryTypes.SELECT
    });

    // return the workspaces associated to the logged in user
    return res.status(StatusCodes.OK).send(workspaces);

  } catch (err) {
    logger.error(`Error fetching workspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};

export const getAllWorkspacesByPartner = async(req, res) => {
  const logger = Container.get('logger');
  const PartnerKeyHelper = Container.get('PartnerKeyHelper');

  try {
    // encode the token to handle special characters in the token
    const decodedToken = PartnerKeyHelper.validatePartnerToken(req.headers['x-partner-key']);

    // throw error if token does not have partner_id
    if (!decodedToken.partner_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send({ message: 'Invalid partner key' });
    }

    const partnerId = decodedToken.partner_id;

    // fetch all the workspaces associated to the account by partner
    const query = `SELECT 
          w.id as id,
          w.name,
          w.slug,
          w.logo_url,
          w.logo_bg_color,
          w.theme_color,
          w.created_at
      FROM workspaces w
      WHERE w.account_id = :accountId AND w.partner_id = :partnerId;`;

    const workspaces = await db.sequelize.query(query, {
      replacements: { accountId: req.query.account_id, partnerId },
      type: db.sequelize.QueryTypes.SELECT
    });

    // return the workspaces associated to the account by partner
    return res.status(StatusCodes.OK).send(workspaces);

  } catch (err) {
    logger.error(`Error fetching workspace: ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
