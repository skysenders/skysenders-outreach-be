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
