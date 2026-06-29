import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';

export const getAccountMembers = async(req, res) => {
  const logger = Container.get('logger');
  const UserModelHandler = Container.get('UserModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  try {
    const user = req.user;

    // validate permissions for the user to view account members
    const hasAccountAccess = await AccountWorkspaceRedisCacheHelper.hasAccountUser({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAccountAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to view account members' });
    }

    const where = {
      account_id: user.account_id,
      is_client: false,
      deleted_at: null
    };

    if (req.query.search_text) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.search_text}%` } },
        { email: { [Op.iLike]: `%${req.query.search_text}%` } }
      ];
    }

    if (req.query.role) {
      where.role = {
        [Op.in]: req.query.role,
      };
    }

    const members = await UserModelHandler.getUsersByWhere(where);

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
    logger.error(`Critical error in getAccountMembers (Raw Query): ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
  }
};
