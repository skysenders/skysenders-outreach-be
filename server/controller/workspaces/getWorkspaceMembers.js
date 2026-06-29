import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db';

export const getWorkspaceClients = async(req, res) => {
  const logger = Container.get('logger');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const user = req.user;
    const workspaceId = req.params?.id;

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: req.user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to view workspace clients' });
    }

    let searchQuery = `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at
       FROM users u
       INNER JOIN workspace_client_mappings wcm ON u.id = wcm.user_id
       WHERE wcm.workspace_id = :workspaceId AND u.account_id = :accountId AND u.is_client = true AND u.deleted_at IS NULL
      `;
    const replacements = {
      workspaceId,
      accountId: user.account_id
    };

    if (req.query.search_text) {
      searchQuery += ' AND (u.name ILIKE :searchText OR u.email ILIKE :searchText)';
      replacements.searchText = `%${req.query.search_text}%`;
    }

    if (req.query.role) {
      searchQuery += ' AND u.role IN (:roles)';
      replacements.roles = req.query.role;
    }

    const members = await db.sequelize.query(searchQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    // 3. Return Data
    return res.status(StatusCodes.OK).send(members.map(m => ({
      user_id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      created_at: m.created_at
    })));

  } catch (err) {
    logger.error(`Critical error in getWorkspaceMembers (Raw Query): ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
