import { Container } from 'typedi';
import { WORKSPACE_USER_ROLE } from '../../config/constants';

const getWorkspaceMemberKey = (userId, workspaceId) => {
  return `workspace_member:${userId}:${workspaceId}`;
};

// Create active workspace access
export const addWorkspaceAccess = async({
  userId,
  workspaceId,
  role
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);

  // Normalizing to hset (lowercase)
  // Note: some redis clients expect (key, field, value) or (key, object)
  await redisClient.hset(key,
    'role', role,
    'updated_at', new Date().toISOString()
  );

  return true;
};

// Update role
export const updateWorkspaceAccess = async({
  userId,
  workspaceId,
  role,
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);

  const fields = ['updated_at', new Date().toISOString()];

  if (role) {
    fields.push('role', role);
  }

  // hset can take multiple field/value pairs in most modern drivers
  await redisClient.hset(key, ...fields);

  return true;
};

// Remove workspace access
export const removeWorkspaceAccess = async({
  userId,
  workspaceId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);

  await redisClient.del(key);

  return true;
};

// Check if user has workspace access
export const hasWorkspaceAccess = async({
  userId,
  workspaceId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);
  const exists = await redisClient.exists(key);

  // In some clients exists returns a boolean, in others it returns 1 or 0
  return exists === 1 || exists === true;
};

// Check if the user has the required role access
export const hasRequiredRoleAccess = async({
  userId,
  workspaceId,
  requiredRoles
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);

  const role = await redisClient.hget(key, 'role');

  if (!role) {
    return false;
  }

  return requiredRoles.includes(role);
};

// Check if the user has the admin role access
export const hasAdminRoleAccess = async({
  userId,
  workspaceId,
}) => {
  return await hasRequiredRoleAccess({
    userId,
    workspaceId,
    requiredRoles: [WORKSPACE_USER_ROLE.ADMIN, WORKSPACE_USER_ROLE.SUPER_ADMIN]
  });
};

// Get workspace access details
export const getWorkspaceAccess = async({
  userId,
  workspaceId
}) => {
  const redisClient = Container.get('redisClient');
  const key = getWorkspaceMemberKey(userId, workspaceId);

  const data = await redisClient.hgetall(key);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return data;
};
