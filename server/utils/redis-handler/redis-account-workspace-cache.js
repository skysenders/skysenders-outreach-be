import { Container } from 'typedi';

/**
 * Redis Structure
 *
 * Account User Role
 * -----------------
 * account_user:{accountId}:{userId}
 *
 * HSET account_user:1:10
 * role ADMIN
 * updated_at 2026-06-20T10:00:00Z
 *
 *
 * Account Workspaces
 * ------------------
 * account_workspaces:{accountId}
 *
 * SADD account_workspaces:1 101 102 103
 */

// 60 minutes in milliseconds
const CACHE_TTL_MS = 60 * 60 * 1000;

// Internal L1 Memory Cache
const localCache = new Map();

// Helper to get data from local memory cache with TTL validation
const getLocalCache = (key) => {
  const cached = localCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    localCache.delete(key); // Evict expired entry
    return null;
  }
  return cached.value;
};

// Helper to set data in local memory cache
const setLocalCache = (key, value) => {
  localCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
};

// Helper to invalidate local memory cache
const invalidateLocalCache = (key) => {
  localCache.delete(key);
};

const getAccountUserKey = (accountId, userId) => {
  return `account_user:${accountId}:${userId}`;
};

const getAccountWorkspacesKey = (accountId) => {
  return `account_workspaces:${accountId}`;
};

/* -------------------------------------------------------------------------- */
/* ACCOUNT USER ROLE                             */
/* -------------------------------------------------------------------------- */

// Create or update account user role
export const setAccountUserRole = async({
  accountId,
  userId,
  role
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountUserKey(accountId, userId);

  await redisClient.hset(
    key,
    'role',
    role,
    'updated_at',
    new Date().toISOString()
  );

  // Invalidate local memory cache so next read fetches updated data
  invalidateLocalCache(key);

  return true;
};

// Remove account user
export const removeAccountUser = async({
  accountId,
  userId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountUserKey(accountId, userId);

  await redisClient.del(key);

  // Invalidate local memory cache
  invalidateLocalCache(key);

  return true;
};

// Get account user details
export const getAccountUser = async({
  accountId,
  userId
}) => {
  const key = getAccountUserKey(accountId, userId);

  // 1. Check L1 Cache
  const cachedData = getLocalCache(key);
  if (cachedData !== null) {
    return Object.keys(cachedData).length === 0 ? null : cachedData;
  }

  // 2. Fallback to L2 (Redis)
  const redisClient = Container.get('redisClient');
  const data = await redisClient.hgetall(key);

  if (!data || Object.keys(data).length === 0) {
    setLocalCache(key, {}); // Cache empty state to prevent cache-penetration issues
    return null;
  }

  // 3. Save to L1 Cache
  setLocalCache(key, data);
  return data;
};

// Get user role
export const getAccountUserRole = async({
  accountId,
  userId
}) => {
  // Leverage the getAccountUser function to optimize cache usage
  const userData = await getAccountUser({ accountId, userId });
  return userData ? userData.role : null;
};

// Check if account user exists
export const hasAccountUser = async({
  accountId,
  userId
}) => {
  const userData = await getAccountUser({ accountId, userId });
  return userData !== null;
};

// Check required role access
export const hasRequiredRoleAccess = async({
  accountId,
  userId,
  requiredRoles
}) => {
  const role = await getAccountUserRole({
    accountId,
    userId
  });

  if (!role) {
    return false;
  }

  return requiredRoles.includes(role);
};

export const hasAdminRoleAccess = async({
  accountId,
  userId,
}) => {
  return await hasRequiredRoleAccess({
    accountId,
    userId,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN']
  });
};

/* -------------------------------------------------------------------------- */
/* ACCOUNT WORKSPACES                            */
/* -------------------------------------------------------------------------- */

// Add workspace to account
export const addAccountWorkspace = async({
  accountId,
  workspaceId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountWorkspacesKey(accountId);

  await redisClient.sadd(key, workspaceId);

  // Reset local memory cache on update
  invalidateLocalCache(key);

  return true;
};

// Remove workspace from account
export const removeAccountWorkspace = async({
  accountId,
  workspaceId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountWorkspacesKey(accountId);

  await redisClient.srem(key, workspaceId);

  // Reset local memory cache on update
  invalidateLocalCache(key);

  return true;
};

// Get all workspaces for an account
export const getAccountWorkspaces = async({
  accountId
}) => {
  const key = getAccountWorkspacesKey(accountId);

  // 1. Check L1 Cache
  const cachedWorkspaces = getLocalCache(key);
  if (cachedWorkspaces !== null) {
    return cachedWorkspaces;
  }

  // 2. Fallback to L2 (Redis)
  const redisClient = Container.get('redisClient');
  const workspaces = await redisClient.smembers(key);

  // 3. Save to L1 Cache
  setLocalCache(key, workspaces || []);
  return workspaces || [];
};

// Check workspace belongs to account
export const hasAccountWorkspace = async({
  accountId,
  workspaceId
}) => {
  const workspaces = await getAccountWorkspaces({ accountId });
  return workspaces.includes(String(workspaceId)) || workspaces.includes(Number(workspaceId));
};

// Replace all workspaces for an account
export const setAccountWorkspaces = async({
  accountId,
  workspaceIds = []
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountWorkspacesKey(accountId);

  const multi = redisClient.multi();
  multi.del(key);

  if (workspaceIds.length > 0) {
    multi.sadd(key, ...workspaceIds);
  }

  await multi.exec();

  // Reset local memory cache on update
  invalidateLocalCache(key);

  return true;
};

// Remove all workspaces for an account
export const clearAccountWorkspaces = async({
  accountId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getAccountWorkspacesKey(accountId);

  await redisClient.del(key);

  // Reset local memory cache on update
  invalidateLocalCache(key);

  return true;
};
