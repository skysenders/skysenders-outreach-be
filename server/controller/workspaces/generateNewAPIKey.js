
import { Container } from 'typedi';
import { WORKSPACE_API_CACHE, WORKSPACE_CUSTOM_RATE_LIMIT_PREFIX } from '../../config/constants';
import { StatusCodes } from 'http-status-codes';
/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const generateNewAPIKey = async(req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const partnerId = req.user.tenant_id; // tenant_id is used as partner_id in the token
    const ownerUserId = req.user.id;

    const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
    const APIKeyGenerator = Container.get('APIKeyGenerator');
    const redisClient = Container.get('redisClient');

    const workspace = await WorkspaceModelHandler.getWorkspaceByWhere({
      partner_id: partnerId,
      id: workspaceId,
      owner_user_id: ownerUserId
    });

    if (workspace) {
      const newAPIKey = APIKeyGenerator.generateUniqueAPIKey(workspace.uuid);

      // update workspace with new API key
      await WorkspaceModelHandler.updateWorkspace(
        { api_key: newAPIKey, api_key_created_at: new Date().toISOString() },
        { partner_id: partnerId, id: workspaceId }
      );

      let customeRateLimit = workspace.custom_api_rate_limit;
      let apiKey = workspace.api_key;

      // If custom rate limit exist for this workspace set it in redis & remove old key
      if (customeRateLimit) {
        redisClient.set(WORKSPACE_CUSTOM_RATE_LIMIT_PREFIX + newAPIKey, customeRateLimit);
        // remove old key from redis cache
        // check if apiKey is not null
        if (apiKey)
          redisClient.del(WORKSPACE_CUSTOM_RATE_LIMIT_PREFIX + apiKey);
      }

      // update workspace object with new API key
      workspace.api_key = newAPIKey;
      // fetch the workspace details with plan details
      const cacheWorkspaceDetails = await WorkspaceModelHandler.findWorkspaceWithPlanDetailsByAPIKey(newAPIKey);

      // REMOVE old key and add new key to redis cache
      redisClient.set(WORKSPACE_API_CACHE + newAPIKey, JSON.stringify(cacheWorkspaceDetails));

      // remove old key from redis cache
      // check if apiKey is not null
      if (apiKey) {
        redisClient.del(`${WORKSPACE_API_CACHE}${apiKey}`);
      }

      // return the result with success message
      res.status(StatusCodes.OK).send({ message: 'success', apiKey: newAPIKey });

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

