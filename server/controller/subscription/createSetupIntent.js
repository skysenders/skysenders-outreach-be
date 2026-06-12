import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const createSetupIntent = async(req, res) => {
  const StripeAPIServices = Container.get('StripeAPIServices');
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');

  const logger = Container.get('logger');


  logger.info(`Creating setup intent for user - ${req.user.email}`);
  try {
    // token varaible
    const partnerId = req.user.tenant_id;
    const workspaceId = req.workspace?.id;
    const userId = req.user.id;

    // if workspaceId is null or empty throw invalid request error
    if (!workspaceId) {
      return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Invalid workspace id' });
    }

    // check
    const hasAdminAccess = await WorkspaceRedisCacheHelper.hasAdminRoleAccess({
      userId: userId,
      workspaceId
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions' });
    }

    // Fetch subsription details by partnerId
    let subscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({
      partner_id: partnerId,
      workspace_id: workspaceId,
    });

    // Check if subscription details exist for the user
    if (!subscriptionDetails) {
      // create a new subscription entry in the database with the partnerId and workspaceId
      subscriptionDetails = await WorkspaceSubscriptionModelHandler.createSubscription({
        partner_id: partnerId,
        workspace_id: workspaceId,
        is_active: false,
      });
    }

    let customerId = subscriptionDetails?.customer_id;

    // if customerId is not present, create a new customer
    if (!customerId) {
      // fetch the workspace owner user_id to add in the metadata while creating the customer in stripe
      const workspaceOwnerDetails = await WorkspaceModelHandler.fetchWorkspaceOwnerDetails(workspaceId);

      // create stripe customer
      const customerData = {
        name: workspaceOwnerDetails.name,
        email: workspaceOwnerDetails.email,
        metadata: {
          user_id: workspaceOwnerDetails.id,
          user_uuid: workspaceOwnerDetails.uuid,
          workspace_id: workspaceOwnerDetails.workspace_id,
          workspace_name: workspaceOwnerDetails.workspace_name,
          owner_name: workspaceOwnerDetails.name,
          tenant_id: workspaceOwnerDetails.tenant_id,
        }
      };

      // call stripe api to create customer
      const stripeCustomerDetails = await StripeAPIServices.createCustomer(partnerId, customerData);

      // update customerId in subscription details
      await WorkspaceSubscriptionModelHandler.updateSubscription({
        customer_id: stripeCustomerDetails.id,
      }, { workspace_id: workspaceId });
      customerId = stripeCustomerDetails.id;
    }

    // Create a setup intent for the customer
    logger.info(`Creating setup intent for customer - ${customerId}`);
    const setupIntent = await StripeAPIServices.createSetupIntent(partnerId, customerId);

    return res.status(StatusCodes.OK).send({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    logger.error(`Error creating setup intent: ${error}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: `Server error: ${error.message}` });
  }
};
