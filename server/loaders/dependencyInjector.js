import { Container } from 'typedi';
import LoggerInstance from './logger';
import { redisClient } from '../connection/redis-client';


// Partner Modules
import * as PartnerModelHandler from '../db/handler/partners';
import * as PartnerBrandingModelHandler from '../db/handler/partners_branding';
import * as PartnerCustomScriptsModelHandler from '../db/handler/partners_custom_scripts';
import * as PartnerSessionModelHandler from '../db/handler/partner_sessions';

// User + Workspace Modules
import * as UserModelHandler from '../db/handler/users';
import * as WorkspaceModelHandler from '../db/handler/workspaces';
import * as UserWorkspaceMappingModelHandler from '../db/handler/user_workspace_mappings';
import * as WorkspaceClientMappingModelHandler from '../db/handler/workspace_client_mappings';
import * as UserSessionModelHandler from '../db/handler/user_sessions';

// Domains & Mailboxes
import * as DomainsModelHandler from '../db/handler/domains';
import * as MailboxesModelHandler from '../db/handler/mailboxes';
import * as MailboxCredentialsModelHandler from '../db/handler/mailbox_credentials';
import * as WarmupMessagesModelHandler from '../db/handler/warmup_messages';
import * as WarmupProfileDetailsModelHandler from '../db/handler/warmup_profile_details';
import * as MailboxWarmupDetailsModelHandler from '../db/handler/mailbox_warmup_details';
import * as WarmupTriggerDetailsModelHandler from '../db/handler/warmup_trigger_details';
import * as WarmupReplyTriggersModelHandler from '../db/handler/warmup_reply_triggers';
import * as MailboxBlockHistoryModelHandler from '../db/handler/mailbox_block_history';
import * as WarmupSentLogsModelHandler from '../db/handler/warmup_sent_logs';

// Billing Modules
import * as WorkspacePlanDetailsModelHandler from '../db/handler/workspace_plan_details';
import * as WorkspaceSubscriptionModelHandler from '../db/handler/workspace_subscriptions';
import * as WorkspaceSubscriptionItemsModelHandler from '../db/handler/workspace_subscription_items';
import * as WorkspaceSubscriptionLogsModelHandler from '../db/handler/workspace_subscription_logs';


// services
import * as AwsService from '../services/aws/aws_service';
import * as StripeAPIServices from '../services/stripe/stripeApi';
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
import * as WorkspaceRedisCacheHelper from '../utils/redis-handler/redis-workspace-user-cache';
import * as DomainDNSConfigHelper from '../utils/domain-dns-helper';
import * as PartnerCacheHelper from '../utils/redis-handler/partner-cache-finder';

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
    Container.set('UserModelHandler', UserModelHandler);
    Container.set('WorkspaceModelHandler', WorkspaceModelHandler);
    Container.set('UserWorkspaceMappingModelHandler', UserWorkspaceMappingModelHandler);
    Container.set('WorkspaceClientMappingModelHandler', WorkspaceClientMappingModelHandler);
    Container.set('UserSessionModelHandler', UserSessionModelHandler);

    // ---- Billing / Subscription ----
    Container.set('WorkspacePlanDetailsModelHandler', WorkspacePlanDetailsModelHandler);
    Container.set('WorkspaceSubscriptionModelHandler', WorkspaceSubscriptionModelHandler);
    Container.set('WorkspaceSubscriptionItemsModelHandler', WorkspaceSubscriptionItemsModelHandler);
    Container.set('WorkspaceSubscriptionLogsModelHandler', WorkspaceSubscriptionLogsModelHandler);

    // Domains & Mailboxes
    Container.set('DomainsModelHandler', DomainsModelHandler);
    Container.set('MailboxesModelHandler', MailboxesModelHandler);
    Container.set('MailboxCredentialsModelHandler', MailboxCredentialsModelHandler);
    Container.set('WarmupMessagesModelHandler', WarmupMessagesModelHandler);
    Container.set('WarmupProfileDetailsModelHandler', WarmupProfileDetailsModelHandler);
    Container.set('MailboxWarmupDetailsModelHandler', MailboxWarmupDetailsModelHandler);
    Container.set('WarmupTriggerDetailsModelHandler', WarmupTriggerDetailsModelHandler);
    Container.set('WarmupReplyTriggersModelHandler', WarmupReplyTriggersModelHandler);
    Container.set('MailboxBlockHistoryModelHandler', MailboxBlockHistoryModelHandler);
    Container.set('WarmupSentLogsModelHandler', WarmupSentLogsModelHandler);

    // Services
    Container.set('AwsService', AwsService);
    Container.set('StripeAPIServices', StripeAPIServices);
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
    Container.set('WorkspaceRedisCacheHelper', WorkspaceRedisCacheHelper);
    Container.set('DomainDNSConfigHelper', DomainDNSConfigHelper);
    Container.set('PartnerCacheHelper', PartnerCacheHelper);
    return;
  } catch (err) {
    LoggerInstance.error('🔥 Error on dependency injector instance loader: %o', err);
    throw new Error(err);
  }
};

export default injectorInstance;
