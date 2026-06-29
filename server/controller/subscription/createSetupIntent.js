import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

export const createSetupIntent = async(req, res) => {
  const StripeAPIServices = Container.get('StripeAPIServices');
  const AccountSubscriptionModelHandler = Container.get('AccountSubscriptionModelHandler');
  const AccountWorkspaceRedisCacheHelper = Container.get('AccountWorkspaceRedisCacheHelper');
  const AccountsModelHandler = Container.get('AccountsModelHandler');

  const logger = Container.get('logger');


  logger.info(`Creating setup intent for user - ${req.user.email}`);
  try {
    // token varaible
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

    // if customerId is not present, create a new customer
    if (!customerId) {
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

      // call stripe api to create customer
      const stripeCustomerDetails = await StripeAPIServices.createCustomer(partnerId, customerData);

      // update customerId in subscription details
      await AccountSubscriptionModelHandler.updateSubscription({
        customer_id: stripeCustomerDetails.id,
      }, { account_id: accountDetails.id });
      // update the customer_id
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
