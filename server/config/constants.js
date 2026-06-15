import { isUndefined } from 'lodash';
import dotenv from 'dotenv';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'LOCAL') {
  const envFound = dotenv.config();
  if (!isUndefined(envFound.error)) {
    throw new Error('⚠️  Couldn\'t find .env file  ⚠️');
  }
} else {
  dotenv.config({
    path: '',
  });
}

export const ENVIRONMENT = process.env.NODE_ENV || 'LOCAL';

export const CORS = {
  ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
  ALLOWED_REGEX_DOMAINS: process.env.ALLOWED_REGEX_DOMAINS,
};

export const BE_URL = process.env.BE_URL;
export const IS_PRODUCTION = process.env.NODE_ENV === 'PROD';
export const SALT_WORK_FACTOR = 12;

export const DB = {
  NAME: process.env.DB_NAME,
  HOST: process.env.DB_URI_HOST,
  PORT: process.env.DB_PORT,
  USER_NAME: process.env.DB_USER_NAME,
  PASSWORD: process.env.DB_PASSWORD,
  DIALECT: 'postgres',
  LOGGING: true,
  CONNECTED: 'DATABASE CONNECTED SUCCESSFULLY',
  TRANSACTION_TYPE: 'IMMEDIATE',
  TRUST_SERVER: true,
};

export const READ_REPLICA_DB = [
  {
    host: process.env.READ_REPLICA_DB_URI_HOST_1 || process.env.DB_URI_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
  }
];

export const HASURA_ROLES = {
  ADMIN: 'admin',
  USERS: 'users',
  PARTNERS: 'partners',
  TEAM_MEMBERS: 'team_members',
  clients: 'clients',
};

export const APP = {
  LISTEN: 'MAIN SERVICE IS LISTENING TO THE PORT: ',
};

export const JWT = {
  SECRET_KEY: process.env.JWT_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY: process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
  ACCESS_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_EXPIRY_IN_SECONDS: 60 * 60 * 24 * 7,
  REFRESH_TOKEN_EXPIRY: '60d',
  REFRESH_TOKEN_EXPIRY_IN_SECONDS: 60 * 60 * 24 * 60,
};

export const API = {
  PREFIX: '/api',
};

export const AUTH_PROVIDER = {
  EMAIL: 'email',
  GOOGLE: 'google',
  MICROSOFT: 'microsoft',
};

export const JWT_ALLOWED_URLS = {
  '/health': true,
  '/api/users/login': true,
  '/api/users/magic-link-login': true,
  '/api/users/cs-admin-login': true,
  '/api/users/signup': true,
  '/api/users/refresh-token': true,
  '/api/users/logout': true,
  '/api/users/forget-password': true,
  '/api/users/reset-password': true,
  '/api/users/verify-user': true,
  '/api/users/resend-verify-link': true,
  // oauth login urls
  '/api/users/auth/google/signin': true,
  '/api/users/auth/google/callback': true,
  '/api/users/auth/microsoft/signin': true,
  '/api/users/auth/microsoft/callback': true,
  // partners
  '/api/partners/login': true,
  '/api/partners/signup': true,
  '/api/partners/customers/login': true,
  '/api/partners/refresh-token': true,
  '/api/partners/logout': true,
  '/api/partners/branding/public': true,
  '/api/partners/custom-scripts/public': true,
  // Rate limit ADMIN use
  '/api/workspaces/details': true,
  '/api/workspaces/details-by-domain': true,
  '/api/workspaces/redis/api-stats-leader-board': true,
  '/api/workspaces/redis/api-limit-by-apikey': true,
  '/api/workspaces/redis/set-user-custom-rate-limit': true,

  // stripe webhook
  '/api/stripe-webhook/process-webhook': true,

  // scalar api docs for whitelabel clients
  '/custom-whitelabel-api-docs': true,

  // google oauth for mailboxes
  '/api/mailboxes/connect/gmail/callback': true,
  // mailboxes outlook oauth
  '/api/mailboxes/connect/outlook/callback': true,
  // fetch mailboxes for internal use
  '/api/mailboxes/internal/fetch-all': true,
  // hasura events
  '/api/hasura/events': true,
};


export const API_KEY_ACCESS_NOT_ALLOWED_URLS = {
  '/api/users/login': true,
  '/api/users/magic-link-login': true,
  '/api/users/cs-admin-login': true,
  '/api/users/signup': true,
  '/api/users/early-access': true,
  '/api/users/verify-user': true,
  '/api/users/resend-verify-link': true,
  '/api/users/forget-password': true,
  '/api/users/reset-password': true,
  '/api/users/update-password': true,
  '/api/users/update-user-details': true,
  '/api/subscription/subscribe': true,
  '/api/subscription/unsubscribe': true,
  '/api/subscription/new-portal-session': true,

  // Rate limit ADMIN use
  '/api/workspaces/redis/api-stats-leader-board': true,
  '/api/workspaces/redis/api-limit-by-apikey': true,
  '/api/workspaces/redis/set-user-custom-rate-limit': true,
  '/json-docs': true,

  // mailboxes google oauth
  '/api/mailboxes/google/oauth-callback': true,
  // mailboxes outlook oauth
  '/api/mailboxes/outlook/oauth-callback': true,
  // fetch mailboxes for internal use
  '/api/mailboxes/internal/fetch-all': true,
  // hasura events
  '/api/hasura/events': true,
};

export const RESTRICTED_API_URLS = [
];

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
  INVITED: 'invited',
};

export const PARTNER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

export const PARTNER_CUSTOM_SCRIPTS_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const WORKSPACE_USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  INBOX_MANAGER: 'INBOX_MANAGER',
  VIEWER: 'VIEWER',
  CLIENT: 'CLIENT'
};

export const WORKSPACE_USER_MAPPING_STATUS = {
  INVITATION_PENDING: 'invitation_pending',
  INVITATION_ACCEPTED: 'invitation_accepted',
  INVITATION_EXPIRED: 'invitation_expired',
  DELETED: 'deleted',
  LEFT: 'left',
};

export const STRIPE_PAY_KEY = process.env.STRIPE_PAY_KEY;

export const PORT = process.env.PORT;

export const USD_INR_VALUE = 94;

export const FRONTEND_URL = process.env.FRONTEND_URL;

export const AWS_CONFIG = {
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
  SW_AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  SW_AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

export const escapeSequelizeQueryText = (value) => value.replace(/'/g, '\'\'').replace(/\$/g, '$$$$');

// RATE LIMITTER REDIS CONFIG
export const REDIS_CONFIG = {
  REDIS_CONNECTION_NAME: 'api-limits',
  REDIS_USERNAME: process.env.REDIS_USERNAME || 'default',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
};

export const RATE_LIMITER_CONFIG = {
  // RATE LIMITTER MIDDLEWARE CONFIG
  MAX_REQUESTS_PER_MINUTE: process.env.MAX_REQUESTS_PER_MINUTE || 60,
  WINDOW_SIZE_IN_MINUTES: process.env.WINDOW_SIZE_IN_MINUTES || 1,
  RESTRICTED_API_MAX_REQUESTS_PER_MINUTE: 10,
};

export const WORKSPACE_API_CACHE = 'workspace_api_cache:';
export const PARTNER_ORIGIN_CACHE = 'partner_origin_cache:';
export const PARTNER_BRANDING_CACHE = 'partner_branding:';
export const PARTNER_EMAIL_SETTINGS_CACHE = 'partner_email_settings:';
export const PARTNER_PAYMENT_CACHE = 'partner_payment:';
export const DEFAULT_PARTNER_ID = 1;

export const TRIM_ORIGIN_DOMAIN = (origin = '') => {
  const host = origin.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
  // split by .
  const parts = host.split('.');
  // apple.app.skysenders.ai -> app.skysenders.ai
  if (parts.length > 3) {
    return parts.slice(-3).join('.');
  }
  return host;
};

export const WORKSPACE_CUSTOM_RATE_LIMIT_PREFIX = 'workspace_custom_rate_limit:';

export const GOOGLE_CONFIG = {
  REDIS_CACHE_KEY: 'partner_google_mailbox_config',
  // https://developers.google.com/gmail/api/auth/scopes
  MAIL_SCOPE: [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
};

// MIcrosoft OAuth Config
export const MICROSOFT_CONFIG = {
  REDIS_CACHE_KEY: 'partner_microsoft_mailbox_config',
  MAIL_SCOPE: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'User.Read',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send'
  ]
};

export const AWS_WARMUP_REGION_SQS_URL_MAP = {
  'us-east-1': 'https://sqs.us-east-1.amazonaws.com/454953019380/skysenders-warmup-messages',
  'us-east-2': 'https://sqs.us-east-2.amazonaws.com/454953019380/skysenders-warmup-messages',
  'us-west-1': 'https://sqs.us-west-1.amazonaws.com/454953019380/skysenders-warmup-messages',
};

export const AWS_WARMUP_SQS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
];

export const AWS_IMAP_REGION_SQS_URL_MAP = {
  'us-east-1': 'https://sqs.us-east-1.amazonaws.com/454953019380/skysenders-track-reply',
  'us-east-2': 'https://sqs.us-east-2.amazonaws.com/454953019380/skysenders-track-reply',
  'us-west-1': 'https://sqs.us-west-1.amazonaws.com/454953019380/skysenders-track-reply',
};

export const AWS_IMAP_SQS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
];

export const AUTH_TOKEN = process.env.AUTH_TOKEN;

export const EMAIL_TEMPLATE_NAME = {
  SIGNUP: 'signup',
  FORGOT_PASSWORD: 'forgotPassword',
  SUBSCRIPTION_FAILURE: 'subscriptionFailure',
  INVITE_EXISTING_TEAM_MEMBER: 'inviteExistingTeamMember',
  INVITE_NEW_TEAM_MEMBER: 'inviteNewTeamMember',
};

// ESP Type
export const ESP_TYPE = {
  SKY_SENDERS: 'SKY_SENDERS',
  GMAIL: 'GMAIL',
  OUTLOOK: 'OUTLOOK',
  YAHOO: 'YAHOO',
  ZOHO: 'ZOHO',
  OTHERS: 'OTHERS',
};

// Mailbox Type
export const MAILBOX_TYPE = {
  SKY_SENDERS: 'SKY_SENDERS',
  GMAIL: 'GMAIL',
  OUTLOOK: 'OUTLOOK',
  YAHOO: 'YAHOO',
  ZOHO: 'ZOHO',
  SMTP: 'SMTP',
};

export const MAILBOX_AUTH_TYPE = {
  OAUTH: 'OAUTH',
  SMTP_PASSWORD: 'SMTP_PASSWORD',
  APP_PASSWORD: 'APP_PASSWORD',
};

export const MAILBOX_STATUS = {
  ACTIVE: 'ACTIVE',
  DISCONNECTED: 'DISCONNECTED',
  DELETED: 'DELETED',
  DISABLED: 'DISABLED',
};

export const MAILBOX_DEFAULT_SEND_LIMTS = {
  sending_limit_per_day: 30,
  minimum_time_gap_mins: 5,
};

export const TRACKING_DOMAIN_CNAME_TARGET = '';

export const WORKSPACE_ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    isSuperAdmin: true,
    canWrite: true,
    canManageInbox: true,
    canManageWorkspace: true,
  },

  ADMIN: {
    isSuperAdmin: false,
    canWrite: true,
    canManageInbox: true,
    canManageWorkspace: true,
  },

  MEMBER: {
    isSuperAdmin: false,
    canWrite: true,
    canManageInbox: true,
    canManageWorkspace: false,
  },

  INBOX_MANAGER: {
    isSuperAdmin: false,
    canWrite: false,
    canManageInbox: true,
    canManageWorkspace: false,
  },

  VIEWER: {
    isSuperAdmin: false,
    canWrite: false,
    canManageInbox: false,
    canManageWorkspace: false,
  },
  CLIENT: {
    isSuperAdmin: false,
    canWrite: false,
    canManageInbox: true,
    canManageWorkspace: false,
  },
};

export const WARMUP_PROXY_URL = process.env.WARMUP_PROXY_URL || 'http://localhost:3001';
export const STATS_PROXY_URL = process.env.STATS_PROXY_URL || 'http://localhost:3002';

export const HASURA_EVENTS = {
  WARMUP_STATUS_UPDATE: 'warmup_status_update',
};

export const CONTACT_IMPORT_CONFLICT_ACTION = {
  SKIP: 'SKIP',
  MERGE: 'MERGE'
};

export const DEFAULT_CONTACT_ATTRIBUTES = [
  'id',
  'email',
  'esp_provider',
  'first_name',
  'last_name',
  'phone',
  'job_title',
  'linkedin_url',
  'company_name',
  'city',
  'state',
  'country',
  'unsubscribed_at',
  'bounced_at',
  'blocked_at',
  'created_at',
  'updated_at'
];

export const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
