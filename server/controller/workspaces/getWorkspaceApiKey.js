
import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
/**
 * Functionality used to fetch workspace API key
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const getWorkspaceApiKey = async(req, res) => {
  try {
    const partnerId = req.user.tenant_id; // tenant_id is used as partner_id in the token
    const ownerUserId = req.user.id;
    const workspaceId = req.workspace?.id;

    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Workspace ID is missing in request header' });
    }

    const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: partnerId,
      id: workspaceId,
      owner_user_id: ownerUserId
    });

    if (workspace) {
      // return the result with success message
      res.status(StatusCodes.OK).send({ api_key: workspace.api_key, api_key_created_at: workspace.api_key_created_at, custom_api_rate_limit: workspace.custom_api_rate_limit });

    } else {
      return res.status(StatusCodes.NOT_ACCEPTABLE).send({message: 'Invalid request! Workspace not found!'});
    }

    return;
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};

