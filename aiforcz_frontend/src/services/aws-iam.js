/**
 * AWS IAM Direct Integration Service
 * 
 * DEFAULT MODE: Uses static demo JSON data for POC/demo purposes.
 * AWS SDK v3 code is preserved (commented) for production use.
 * 
 * To enable live AWS integration:
 * 1. Uncomment the AWS SDK import below
 * 2. Configure REACT_APP_AWS_ACCESS_KEY_ID and REACT_APP_AWS_SECRET_ACCESS_KEY in .env
 * 3. Set DEMO_MODE=false below
 */

import demoIAMData from './demo-iam-data.json';

// === CONFIGURATION ===
// Set to false to use live AWS integration (requires AWS SDK & credentials)
const DEMO_MODE = true;

// =========================================================================
// AWS SDK v3 Integration Code (Preserved for production use)
// Uncomment the import below and set DEMO_MODE=false to enable live AWS calls
// =========================================================================
// import { IAMClient, paginateListUsers, paginateListRoles, paginateListGroups,
//   paginateListPolicies, ListAccessKeysCommand, ListGroupsForUserCommand,
//   ListAttachedUserPoliciesCommand, ListUserPoliciesCommand,
//   GetAccessKeyLastUsedCommand, ListMFADevicesCommand,
//   GetLoginProfileCommand, ListAttachedRolePoliciesCommand,
//   ListRolePoliciesCommand, ListEntitiesForPolicyCommand,
//   GetAccountPasswordPolicyCommand, ListVirtualMFADevicesCommand,
//   GetAccountSummaryCommand } from '@aws-sdk/client-iam';
// 
// const createIAMClient = () => {
//   const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY;
//   const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_KEY;
//   const region = process.env.REACT_APP_AWS_REGION || 'us-east-1';
//   if (!accessKeyId || !secretAccessKey) {
//     throw new Error('AWS credentials not configured.');
//   }
//   return new IAMClient({ region, credentials: { accessKeyId, secretAccessKey } });
// };
// =========================================================================

// --- Demo Data Service ---

const getDemoUsers = () => {
  return demoIAMData.users.map(u => ({
    ...u,
    id: u.id,
    username: u.username,
    email: u.username + '@company.com',
    arn: u.arn,
    role: u.role,
    department: u.department,
    mfaEnabled: u.mfaEnabled,
    isPrivileged: u.isPrivileged,
    isActive: u.isActive,
    hasConsolePassword: u.hasConsolePassword,
    passwordLastUsed: u.passwordLastUsed || null,
    lastLogin: u.lastLogin || null,
    createDate: u.createDate,
    groups: u.groups || [],
    attachedPolicies: u.attachedPolicies || [],
    inlinePolicies: u.inlinePolicies || [],
    accessKeys: u.accessKeys || [],
    mfaDevices: u.mfaDevices || [],
    tags: u.tags || [],
  }));
};

const getDemoRoles = () => {
  return demoIAMData.roles.map(r => ({
    id: r.id,
    roleName: r.roleName,
    arn: r.arn,
    path: r.path,
    createDate: r.createDate,
    maxSessionDuration: r.maxSessionDuration,
    description: r.description,
    trustPolicy: r.trustPolicy || null,
    attachedPolicies: r.attachedPolicies || [],
    inlinePolicies: r.inlinePolicies || [],
    tags: r.tags || [],
  }));
};

const getDemoGroups = () => {
  return demoIAMData.groups.map(g => ({
    id: g.id,
    groupName: g.groupName,
    arn: g.arn,
    path: g.path,
    createDate: g.createDate,
  }));
};

const getDemoPolicies = () => {
  return demoIAMData.policies.map(p => ({
    id: p.id,
    policyName: p.policyName,
    arn: p.arn,
    path: p.path,
    createDate: p.createDate,
    updateDate: p.updateDate,
    isAttachable: p.isAttachable,
    attachmentCount: p.attachmentCount,
    usersAttached: p.usersAttached || [],
    groupsAttached: p.groupsAttached || [],
    rolesAttached: p.rolesAttached || [],
  }));
};

const getDemoSummary = () => {
  return demoIAMData.summary;
};

// --- Public API ---

export const getIAMUsers = async () => {
  if (DEMO_MODE) {
    return getDemoUsers();
  }
  // =============================================================
  // AWS SDK LIVE INTEGRATION (uncomment when ready)
  // =============================================================
  // const client = createIAMClient();
  // const users = [];
  // try {
  //   const paginator = paginateListUsers({ client }, {});
  //   for await (const page of paginator) {
  //     for (const user of page.Users || []) { users.push(user); }
  //   }
  //   // Enrich each user with additional details...
  //   return enrichedUsers;
  // } catch (err) { throw err; }
  // =============================================================
  throw new Error('AWS live mode not configured. Set DEMO_MODE=true or provide AWS credentials.');
};

export const getIAMRoles = async () => {
  if (DEMO_MODE) {
    return getDemoRoles();
  }
  // AWS SDK live code...
  throw new Error('AWS live mode not configured.');
};

export const getIAMGroups = async () => {
  if (DEMO_MODE) {
    return getDemoGroups();
  }
  // AWS SDK live code...
  throw new Error('AWS live mode not configured.');
};

export const getIAMPolicies = async () => {
  if (DEMO_MODE) {
    return getDemoPolicies();
  }
  // AWS SDK live code...
  throw new Error('AWS live mode not configured.');
};

export const getIAMAccountSummary = async () => {
  if (DEMO_MODE) {
    return getDemoSummary();
  }
  // AWS SDK live code...
  throw new Error('AWS live mode not configured.');
};

export const isAWSConfigured = () => {
  return !DEMO_MODE;
};

export const tryFetchAWSData = async () => {
  if (DEMO_MODE) {
    return {
      configured: true,
      demoMode: true,
      users: getDemoUsers(),
      roles: getDemoRoles(),
      groups: getDemoGroups(),
      policies: getDemoPolicies(),
      summary: getDemoSummary(),
    };
  }
  // =============================================================
  // Live AWS Fetch (requires AWS SDK & credentials)
  // =============================================================
  // try {
  //   const [usersData, rolesData, groupsData, policiesData, summaryData] = await Promise.all([
  //     getIAMUsers(), getIAMRoles(), getIAMGroups(), getIAMPolicies(), getIAMAccountSummary(),
  //   ]);
  //   return { configured: true, users: usersData, roles: rolesData, groups: groupsData, policies: policiesData, summary: summaryData };
  // } catch (err) {
  //   return { configured: true, error: err.message, users: [], roles: [], groups: [], policies: [], summary: null };
  // }
  // =============================================================
  return {
    configured: true,
    demoMode: true,
    users: getDemoUsers(),
    roles: getDemoRoles(),
    groups: getDemoGroups(),
    policies: getDemoPolicies(),
    summary: getDemoSummary(),
  };
};

const awsIAMService = {
  getIAMUsers,
  getIAMRoles,
  getIAMGroups,
  getIAMPolicies,
  getIAMAccountSummary,
  isAWSConfigured,
  tryFetchAWSData,
};

export default awsIAMService;