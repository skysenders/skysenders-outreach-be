import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { WORKSPACE_USER_ROLE } from '../../config/constants';
import { db } from '../../db/index';

export const getWorkspaceMembers = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');

  try {
    const { workspaceId } = req.params;
    const user = req.user;

    // 1. Permission Check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasRequiredRoleAccess({
      userId: user.id,
      workspaceId,
      requiredRoles: [WORKSPACE_USER_ROLE.ADMIN, WORKSPACE_USER_ROLE.SUPER_ADMIN]
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({
        message: 'Insufficient permissions to view workspace members'
      });
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
        AND uwm.is_deleted = false;
    `;

    const members = await db.sequelize.query(query, {
      replacements: { workspaceId },
      type: db.sequelize.QueryTypes.SELECT
    });

    // 3. Return Data
    return res.status(StatusCodes.OK).send(members);

  } catch (err) {
    logger.error(`Critical error in getWorkspaceMembers (Raw Query): ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
