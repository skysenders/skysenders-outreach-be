import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db/index';

export const getWorkspaceMembers = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const user = req.user;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: 'Workspace ID is missing in request header'
      });
    }

    // 1. Permission Check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: user.id,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'Insufficient permissions to view workspace members'
      });
    }

    let filterWhereQuery = ' AND uwm.is_deleted = false';
    const replacements = { workspaceId };

    const { search_text: searchText, role, status } = req.query;

    if (status) {
      filterWhereQuery += ' AND uwm.status = :status';
      replacements.status = status;
      if (status === 'deleted') {
        filterWhereQuery = ' AND uwm.is_deleted = true AND uwm.status = :status';
      }
    }

    if (searchText) {
      filterWhereQuery += ' AND (u.name ILIKE :searchText OR u.email ILIKE :searchText)';
      replacements.searchText = `%${searchText}%`;
    }
    if (role) {
      filterWhereQuery += ' AND uwm.role = :role';
      replacements.role = role;
    }

    // 2. Execute Raw SQL Query
    // We join the UserWorkspaceMappings with the Users table
    const query = `
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        uwm.role,
        uwm.status,
        uwm.is_active,
        uwm.created_at as joined_at
      FROM user_workspace_mappings uwm
      INNER JOIN users u ON uwm.user_id = u.id
      WHERE uwm.workspace_id = :workspaceId 
       ${filterWhereQuery};
    `;

    const members = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    // 3. Return Data
    return res.status(StatusCodes.OK).send(members);

  } catch (err) {
    logger.error(`Critical error in getWorkspaceMembers (Raw Query): ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
