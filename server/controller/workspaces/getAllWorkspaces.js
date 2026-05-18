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
          uwm.role,
          uwm.permission,
          uwm.status,
          uwm.is_active,
          uwm.created_at as joined_at
      FROM user_workspace_mappings uwm
      INNER JOIN workspaces w ON uwm.workspace_id = w.id
      WHERE uwm.user_id = :userId 
        AND uwm.is_active = true
        AND uwm.is_deleted = false;`;

    const workspaces = await db.sequelize.query(query, {
      replacements: { userId: user.id },
      type: db.sequelize.QueryTypes.SELECT
    });

    // return the workspaces associated to the logged in user
    return res.status(StatusCodes.OK).send(workspaces);

  } catch (err) {
    logger.error(`Error fetching workspace: ${err.message}`);
    throw err;
  }
};
