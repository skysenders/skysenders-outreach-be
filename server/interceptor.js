import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';
import { WORKSPACE_API_CACHE, PLAN_TYPE_API_ACCESS } from './config/constants';
import { isEmpty, get } from 'lodash';

const updateUserTokenDataBasedonRoute = (req, tokenData) => {
  // If the request URL starts with /api/v1/partners or /api/partners, set partner data
  if (tokenData.type === 'partner') {
    req.partner = tokenData.partner;
    return;
  }

  req.user = tokenData.user;
  // set workspace id
  req.workspace = {
    id: req.headers['x-workspace-id'],
    tenant_id: tokenData.user.tenant_id // tenant_id is used as partner_id in the token
  };
  return;
};

/**
 * Interceptor which verifies the jwt token before allowing requests
 * @returns {Boolean} it returns a boolean value which indicates
 * the token is valid
 * @param {*} req request from the client
 * @param {*} res request to the client from server
 */
export const verifyToken = async(req, res) => {
  const logger = Container.get('logger');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const redisClient = Container.get('redisClient');
  try {
    // check if the API path starts with /api/v1/
    if (req.url && req.url.startsWith('/api/v1')) {

      const apiKey = req.headers['apikey']; // Assuming API key is passed in the request headers

      if (!apiKey) {
        return res.status(StatusCodes.UNAUTHORIZED).send({ message: 'API key is required. Please add apikey in Request Headers.' });
      }

      // Check if user info exist in redis
      let workspace = await redisClient.get(`${WORKSPACE_API_CACHE}${apiKey}`);

      if (!workspace) {
        // verify api key is valid or not
        workspace = await WorkspaceModelHandler.findWorkspaceWithPlanDetailsByAPIKey(apiKey);

        if (isEmpty(workspace)) {
          return res.status(StatusCodes.UNAUTHORIZED).send({message: 'Invalid API Key'});
        }
        // Set user data into redis
        redisClient.set(`${WORKSPACE_API_CACHE}${apiKey}`, JSON.stringify(workspace));
        redisClient.expire(`${WORKSPACE_API_CACHE}${apiKey}`, 24 * 60 * 60);
      } else {
        workspace = JSON.parse(workspace);
      }

      // If the user's plan doesn't include API access, return unauthorized access
      const planName = get(workspace, 'plan_details.plan_name');

      if (!PLAN_TYPE_API_ACCESS[planName]) {
        return res.status(StatusCodes.UNAUTHORIZED).send({
          message: `The current plan (${planName}) does not include API access. Please upgrade to a supported plan.`,
        });
      }

      const planEndDate = new Date(get(workspace, 'plan_details.plan_end_date')) || new Date();
      const pendingTimeWithBuffer = planEndDate - new Date() + 86400000;
      // check if the plan end date is expired or not (with 1 day buffer +86400000)
      if (pendingTimeWithBuffer <= 0) {
        return res.status(StatusCodes.UNAUTHORIZED).send({message: 'Plan expired!'});
      }

      req.workspace = {
        id: workspace.id,
        uuid: workspace.uuid,
        name: workspace.name,
        slug: workspace.slug,

        plan_name: workspace?.plan_details?.plan_name,
        plan_end_date: workspace?.plan_details?.plan_end_date,

        tenant_id: workspace?.tenant_id, // tenant_id is used as partner_id in the token
      };

      req.user = workspace.user;

    } else {
      const tokenData = await req.jwtVerify();
      if (!tokenData) {
        return res.status(StatusCodes.UNAUTHORIZED).send({message: 'Invalid token'});
      }
      // Set user data into request object
      updateUserTokenDataBasedonRoute(req, tokenData);
    }

  } catch (err) {
    logger.error(`Error while verifying token for user - ${req.url} - ${err.message}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({message: `Unauthorized: Invalid token - ${err.message}`});
  }
};

// Export the middleware
export default verifyToken;
