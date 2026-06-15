import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const saveBusinessTaxDetails = async(partnerId, customerId, taxDetails, logger, StripeAPIServices) => {
  // check if the tax_details exists
  if (taxDetails) {
    // update the tax details for the customer
    const taxData = await StripeAPIServices.updateCustomerTaxDetails(partnerId, customerId, taxDetails);
    logger.info(`Updated tax details for customer - ${customerId}`);
    return taxData.id;
  }
  return null;
};

export const saveBusinessDetails = async(req, res) => {
  const StripeAPIServices = Container.get('StripeAPIServices');
  const WorkspaceModelHandler = Container.get('WorkspaceModelHandler');
  const WorkspaceSubscriptionModelHandler = Container.get('WorkspaceSubscriptionModelHandler');
  const WorkspacePlanDetailsModelHandler = Container.get('WorkspacePlanDetailsModelHandler');
  const WorkspaceRedisCacheHelper = Container.get('WorkspaceRedisCacheHelper');
  const logger = Container.get('logger');

  logger.info(`Saving business details for user - ${req.user.email}`);
  try {
    // Extract user ID and reason for unsubscribing from the request
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

    // Fetch subsription details by partnerId and workspaceId
    let subscriptionDetails = await WorkspaceSubscriptionModelHandler.getSubscriptionByWhere({
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

    // fetch the workspace owner user_id to add in the metadata while creating the customer in stripe
    const workspaceOwnerDetails = await WorkspaceModelHandler.fetchWorkspaceOwnerDetails(workspaceId);

    // create stripe customer
    const customerData = {
      name: workspaceOwnerDetails.name,
      email: workspaceOwnerDetails.email,
      address: req.body.business_address,
      metadata: {
        user_id: workspaceOwnerDetails.id,
        user_uuid: workspaceOwnerDetails.uuid,
        workspace_id: workspaceOwnerDetails.workspace_id,
        workspace_name: workspaceOwnerDetails.workspace_name,
        owner_name: workspaceOwnerDetails.name,
        tenant_id: workspaceOwnerDetails.tenant_id,
      }
    };

    if (req.body.tax_details) {
      customerData.tax = {
        ip_address: req.ip, // Use the request IP address for tax purposes
      };
    }

    // if customerId is not present, create a new customer
    if (!customerId) {
      // call stripe api to create customer
      const stripeCustomerDetails = await StripeAPIServices.createCustomer(partnerId, customerData);
      // update customerId in subscription details
      await WorkspaceSubscriptionModelHandler.updateSubscription({
        customer_id: stripeCustomerDetails.id,
      }, { workspace_id: workspaceId });

      customerId = stripeCustomerDetails.id;
    } else {
      // Update customer details in Stripe
      logger.info(`Updating customer details for user - ${customerId}`);
      await StripeAPIServices.updateCustomer(partnerId, customerId, customerData);
    }

    const taxId = await saveBusinessTaxDetails(partnerId, customerId, req.body.tax_details, logger, StripeAPIServices);

    // Save business details in the plan details model
    await WorkspacePlanDetailsModelHandler.updatePlanDetails({
      billing_details: {
        ...req.body.business_address,
        tax_details: req.body.tax_details || {},
        tax_id: taxId || null,
      },
    }, {
      workspace_id: workspaceId,
    });

    logger.info(`Business details saved successfully for user - ${req.user.email}`);
    return res.status(StatusCodes.OK).send({ message: 'Business details saved successfully.' });
  } catch (error) {
    logger.error('Error while saving business details:', error);
    return res.status(500).send({ message: error.message || 'Internal server error' });
  }
};
