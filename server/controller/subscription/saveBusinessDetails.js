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
  const logger = Container.get('logger');
  const StripeAPIServices = Container.get('StripeAPIServices');
  // accounts related imports
  const AccountsModelHandler = Container.get('AccountsModelHandler');
  const AccountPlanDetailsModelHandler = Container.get('AccountPlanDetailsModelHandler');
  const AccountSubscriptionModelHandler = Container.get('AccountSubscriptionModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');

  logger.info(`Saving business details for user - ${req.user.email}`);
  try {
    // Extract user ID and reason for unsubscribing from the request
    const partnerId = req.user.tenant_id;
    const user = req.user;

    // validate permissions for the user to invite members
    const hasAdminAccess = await AccountWorkspaceRedisCacheHelper.hasAdminRoleAccess({
      accountId: user.account_id,
      userId: user.id
    });

    if (!hasAdminAccess) {
      return res.status(StatusCodes.FORBIDDEN).send({ message: 'Insufficient permissions to update team members role' });
    }

    // Fetch subsription details
    let subscriptionDetails = await AccountSubscriptionModelHandler.getSubscriptionByWhere({
      account_id: user.account_id,
    });

    // Check if subscription details exist for the user
    if (!subscriptionDetails) {
      // create a new subscription entry in the database with the partnerId and userId
      subscriptionDetails = await AccountSubscriptionModelHandler.createSubscription({
        partner_id: partnerId,
        account_id: user.account_id,
        is_active: false,
      });
    }

    let customerId = subscriptionDetails?.customer_id;

    // fetch the account details to create a customer in stripe
    const accountDetails = await AccountsModelHandler.getAccountByWhere({ id: user.account_id });

    // create stripe customer
    const customerData = {
      name: accountDetails.name,
      email: accountDetails.email,
      metadata: {
        account_id: accountDetails.id,
        account_name: accountDetails.name,
        account_uuid: accountDetails.uuid,
        user_id: req.user.id,
        tenant_id: partnerId,
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
      await AccountSubscriptionModelHandler.updateSubscription({
        customer_id: stripeCustomerDetails.id,
      }, { account_id: accountDetails.id });

      customerId = stripeCustomerDetails.id;
    } else {
      // Update customer details in Stripe
      logger.info(`Updating customer details for user - ${customerId}`);
      await StripeAPIServices.updateCustomer(partnerId, customerId, customerData);
    }

    const taxId = await saveBusinessTaxDetails(partnerId, customerId, req.body.tax_details, logger, StripeAPIServices);

    // Save business details in the plan details model
    await AccountPlanDetailsModelHandler.updatePlanDetails({
      billing_details: {
        ...req.body.business_address,
        tax_details: req.body.tax_details || {},
        tax_id: taxId || null,
      },
    }, {
      account_id: accountDetails.id,
    });

    logger.info(`Business details saved successfully for user - ${req.user.email}`);
    return res.status(StatusCodes.OK).send({ message: 'Business details saved successfully.' });
  } catch (error) {
    logger.error('Error while saving business details:', error);
    return res.status(500).send({ message: error.message || 'Internal server error' });
  }
};
