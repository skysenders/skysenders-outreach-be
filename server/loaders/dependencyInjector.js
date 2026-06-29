import { Container } from 'typedi';
import LoggerInstance from './logger';
import { redisClient } from '../connection/redis-client';

// Partner Modules
import * as PartnerModelHandler from '../db/handler/partners';
import * as PartnerBrandingModelHandler from '../db/handler/partners_branding';
import * as PartnerCustomScriptsModelHandler from '../db/handler/partners_custom_scripts';
import * as PartnerSessionModelHandler from '../db/handler/partner_sessions';

// User + Workspace Modules
import * as AccountsModelHandler from '../db/handler/accounts';
import * as UserModelHandler from '../db/handler/users';
import * as WorkspaceModelHandler from '../db/handler/workspaces';
import * as WorkspaceClientMappingModelHandler from '../db/handler/workspace_client_mappings';
import * as UserSessionModelHandler from '../db/handler/user_sessions';

// Domains & Mailboxes
import * as DomainsModelHandler from '../db/handler/domains';
import * as MailboxesModelHandler from '../db/handler/mailboxes';
import * as MailboxCredentialsModelHandler from '../db/handler/mailbox_credentials';
import * as ContactsModelHandler from '../db/handler/contacts';
import * as ListsModelHandler from '../db/handler/lists';
import * as ContactListMappingsModelHandler from '../db/handler/contact_list_mappings';
import * as ListImportJobsModelHandler from '../db/handler/list_import_jobs';
import * as GlobalSuppressionsModelHandler from '../db/handler/global_suppressions';
import * as SendingSchedulesModelHandler from '../db/handler/sending_schedules';
import * as SendingScheduleWindowsModelHandler from '../db/handler/sending_schedule_windows';

// Billing Modules
import * as AccountPlanDetailsModelHandler from '../db/handler/account_plan_details';
import * as AccountSubscriptionModelHandler from '../db/handler/account_subscriptions';
import * as AccountSubscriptionItemsModelHandler from '../db/handler/account_subscription_items';
import * as AccountSubscriptionLogsModelHandler from '../db/handler/account_subscription_logs';

// services
import * as AwsService from '../services/aws/aws_service';
import * as StripeAPIServices from '../services/stripe/stripeApi';
import * as ConnectESPMailboxServices from '../services/esp_provides/connect_esp';
import * as GoogleApiServices from '../services/esp_provides/google/google.api';
import * as MicrosoftApiServices from '../services/esp_provides/microsoft/microsoft.api';
import * as MailerInstance from '../services/email-service/send-email';

// utils
import * as TokenHandler from '../utils/tokenHandler';
import * as PasswordHandler from '../utils/passwordHandler';
import * as EmailVerificationHelper from '../utils/emailVerification';
import * as OtpGeneratorHelper from '../utils/otpGenerator';
import * as APIKeyGenerator from '../utils/api_key_generator';
import * as StringHelper from '../utils/string-helper';
import * as DetectESPHelper from '../utils/detectEsp';
import * as AccountWorkspaceRedisCacheHelper from '../utils/redis-handler/redis-account-workspace-cache';
import * as DomainDNSConfigHelper from '../utils/domain-dns-helper';
import * as PartnerCacheHelper from '../utils/redis-handler/partner-cache-finder';
import * as PartnerKeyHelper from '../utils/partner-key-helper';

/**
 * Functionalilty used to set the container services
 * @returns {null} it returns null
 */
const injectorInstance = async() => {
  try {
    Container.set('logger', LoggerInstance);
    Container.set('redisClient', redisClient);

    // DB Handler
    // ---- Partners ----
    Container.set('PartnerModelHandler', PartnerModelHandler);
    Container.set('PartnerBrandingModelHandler', PartnerBrandingModelHandler);
    Container.set('PartnerCustomScriptsModelHandler', PartnerCustomScriptsModelHandler);
    Container.set('PartnerSessionModelHandler', PartnerSessionModelHandler);

    // ---- Users / Workspace ----
    Container.set('AccountsModelHandler', AccountsModelHandler);
    Container.set('UserModelHandler', UserModelHandler);
    Container.set('WorkspaceModelHandler', WorkspaceModelHandler);
    Container.set('WorkspaceClientMappingModelHandler', WorkspaceClientMappingModelHandler);
    Container.set('UserSessionModelHandler', UserSessionModelHandler);

    // user billing & subscription
    Container.set('AccountPlanDetailsModelHandler', AccountPlanDetailsModelHandler);
    Container.set('AccountSubscriptionModelHandler', AccountSubscriptionModelHandler);
    Container.set('AccountSubscriptionItemsModelHandler', AccountSubscriptionItemsModelHandler);
    Container.set('AccountSubscriptionLogsModelHandler', AccountSubscriptionLogsModelHandler);

    // Domains & Mailboxes
    Container.set('DomainsModelHandler', DomainsModelHandler);
    Container.set('MailboxesModelHandler', MailboxesModelHandler);
    Container.set('MailboxCredentialsModelHandler', MailboxCredentialsModelHandler);
    Container.set('ContactsModelHandler', ContactsModelHandler);
    Container.set('ListsModelHandler', ListsModelHandler);
    Container.set('ContactListMappingsModelHandler', ContactListMappingsModelHandler);
    Container.set('ListImportJobsModelHandler', ListImportJobsModelHandler);
    Container.set('GlobalSuppressionsModelHandler', GlobalSuppressionsModelHandler);
    Container.set('SendingSchedulesModelHandler', SendingSchedulesModelHandler);
    Container.set('SendingScheduleWindowsModelHandler', SendingScheduleWindowsModelHandler);
    // Services
    Container.set('AwsService', AwsService);
    Container.set('StripeAPIServices', StripeAPIServices);
    Container.set('ConnectESPMailboxServices', ConnectESPMailboxServices);
    Container.set('GoogleApiServices', GoogleApiServices);
    Container.set('MicrosoftApiServices', MicrosoftApiServices);

    // utils
    Container.set('TokenHandler', TokenHandler);
    Container.set('MailerInstance', MailerInstance);
    Container.set('PasswordHandler', PasswordHandler);
    Container.set('EmailVerificationHelper', EmailVerificationHelper);
    Container.set('OtpGeneratorHelper', OtpGeneratorHelper);
    Container.set('APIKeyGenerator', APIKeyGenerator);
    Container.set('StringHelper', StringHelper);
    Container.set('DetectESPHelper', DetectESPHelper);
    Container.set('AccountWorkspaceRedisCacheHelper', AccountWorkspaceRedisCacheHelper);
    Container.set('DomainDNSConfigHelper', DomainDNSConfigHelper);
    Container.set('PartnerCacheHelper', PartnerCacheHelper);
    Container.set('PartnerKeyHelper', PartnerKeyHelper);

    return;
  } catch (err) {
    LoggerInstance.error('Error on dependency injector instance loader: %o', err);
    throw new Error(err);
  }
};

export default injectorInstance;
