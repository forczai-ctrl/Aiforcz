import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================================
// FALLBACK DEMO DATA
// Used when backend is unavailable so the frontend still works
// ============================================================

const FALLBACK_SUMMARY = {
  totalControls: 125,
  openIssues: 19,
  highRisk: 6,
  critical: 5,
  medium: 4,
  low: 4,
  auditReadiness: 42,
  usersReviewed: 12,
  privilegedAccounts: 5,
  inactiveUsers: 3,
  dormantAccounts: 2,
  sodViolations: 2,
  mfaDisabled: 4,
};

const FALLBACK_TRENDS = [
  { week: 'Week 1', critical: 3, high: 2, medium: 1 },
  { week: 'Week 2', critical: 4, high: 3, medium: 2 },
  { week: 'Week 3', critical: 3, high: 4, medium: 2 },
  { week: 'Week 4', critical: 5, high: 3, medium: 3 },
  { week: 'Week 5', critical: 4, high: 5, medium: 2 },
  { week: 'Week 6', critical: 5, high: 4, medium: 3 },
  { week: 'Week 7', critical: 4, high: 4, medium: 4 },
  { week: 'Week 8', critical: 5, high: 5, medium: 3 },
  { week: 'Week 9', critical: 5, high: 6, medium: 4 },
  { week: 'Week 10', critical: 4, high: 5, medium: 4 },
  { week: 'Week 11', critical: 5, high: 6, medium: 4 },
  { week: 'Week 12', critical: 5, high: 6, medium: 4 },
];

const FALLBACK_FINDINGS_BY_CONTROL = [
  { name: 'Access Controls', value: 12, color: '#f44336' },
  { name: 'Change Management', value: 4, color: '#ff9800' },
  { name: 'Config Controls', value: 3, color: '#2196f3' },
];

const FALLBACK_CHANGE_COMPLIANCE = {
  totalChanges: 13,
  approved: 7,
  unauthorized: 3,
  emergency: 3,
};

const FALLBACK_USERS = [
  { id: 1, username: 'john.admin', email: 'john.admin@company.com', role: 'admin', department: 'IT', manager: null, mfaEnabled: false, isActive: true, isPrivileged: true, accessKeysCount: 2, loginCount: 150, lastLogin: '2025-04-19T10:30:00', createdDate: '2024-06-01T00:00:00', isSharedAccount: false },
  { id: 2, username: 'susan.finance', email: 'susan.finance@company.com', role: 'finance', department: 'Finance', manager: 'finance-dir@company.com', mfaEnabled: true, isActive: true, isPrivileged: true, accessKeysCount: 1, loginCount: 250, lastLogin: '2025-05-30T08:00:00', createdDate: '2024-01-15T00:00:00', isSharedAccount: false },
  { id: 3, username: 'mike.developer', email: 'mike.dev@company.com', role: 'developer', department: 'Engineering', manager: 'dev-mgr@company.com', mfaEnabled: true, isActive: true, isPrivileged: false, accessKeysCount: 1, loginCount: 400, lastLogin: '2025-06-02T14:00:00', createdDate: '2024-08-10T00:00:00', isSharedAccount: false },
  { id: 4, username: 'audit.test', email: 'audit.test@company.com', role: 'auditor', department: 'Audit', manager: 'audit-dir@company.com', mfaEnabled: false, isActive: false, isPrivileged: false, accessKeysCount: 0, loginCount: 5, lastLogin: '2024-12-06T09:00:00', createdDate: '2023-10-01T00:00:00', isSharedAccount: false },
  { id: 5, username: 'service.account', email: 'svc.account@company.com', role: 'service', department: 'DevOps', manager: null, mfaEnabled: false, isActive: true, isPrivileged: true, accessKeysCount: 4, loginCount: 1000, lastLogin: '2025-06-03T06:00:00', createdDate: '2023-01-01T00:00:00', isSharedAccount: true },
  { id: 6, username: 'admin-sarah', email: 'sarah@company.com', role: 'admin', department: 'IT', manager: 'cto@company.com', mfaEnabled: true, isActive: true, isPrivileged: true, accessKeysCount: 1, loginCount: 500, lastLogin: '2025-06-02T11:00:00', createdDate: '2023-06-05T00:00:00', isSharedAccount: false },
  { id: 7, username: 'root-account', email: 'aws-root@company.com', role: 'root', department: 'IT', manager: null, mfaEnabled: false, isActive: true, isPrivileged: true, accessKeysCount: 2, loginCount: 50, lastLogin: '2025-05-28T16:00:00', createdDate: '2022-06-01T00:00:00', isSharedAccount: false },
  { id: 8, username: 'jane.smith', email: 'jane.smith@company.com', role: 'developer', department: 'Engineering', manager: 'dev-mgr@company.com', mfaEnabled: true, isActive: true, isPrivileged: false, accessKeysCount: 1, loginCount: 200, lastLogin: '2025-02-04T10:00:00', createdDate: '2024-01-20T00:00:00', isSharedAccount: false },
  { id: 9, username: 'bob.wilson', email: 'bob.wilson@company.com', role: 'qa', department: 'QA', manager: 'qa-mgr@company.com', mfaEnabled: true, isActive: true, isPrivileged: false, accessKeysCount: 0, loginCount: 80, lastLogin: '2024-11-16T13:00:00', createdDate: '2024-08-15T00:00:00', isSharedAccount: false },
  { id: 10, username: 'legacy-admin', email: 'legacy@company.com', role: 'admin', department: 'IT', manager: null, mfaEnabled: false, isActive: true, isPrivileged: true, accessKeysCount: 3, loginCount: 300, lastLogin: '2024-12-06T09:00:00', createdDate: '2023-03-01T00:00:00', isSharedAccount: false },
  { id: 11, username: 'emergency-admin', email: 'emergency@company.com', role: 'admin', department: 'IT', manager: null, mfaEnabled: true, isActive: true, isPrivileged: true, accessKeysCount: 2, loginCount: 10, lastLogin: '2025-03-01T08:00:00', createdDate: '2024-02-20T00:00:00', isSharedAccount: false },
  { id: 12, username: 'alice.johnson', email: 'alice@company.com', role: 'developer', department: 'Engineering', manager: 'dev-mgr@company.com', mfaEnabled: true, isActive: true, isPrivileged: false, accessKeysCount: 1, loginCount: 400, lastLogin: '2025-06-03T09:00:00', createdDate: '2024-08-10T00:00:00', isSharedAccount: false },
];

const FALLBACK_IAM_SUMMARY = {
  totalUsers: 12, activeUsers: 11, privilegedUsers: 5, mfaEnabled: 8, mfaDisabled: 4, inactiveUsers: 3, sharedAccounts: 1,
};

const FALLBACK_FINDINGS = [
  { id: 1, finding_type: 'ACCESS', rule_id: 'ITGC-01', rule_name: 'Inactive User Account', description: "User 'audit.test' has not logged in for 180 days - dormant account", severity: 'HIGH', status: 'OPEN', source: 'AWS IAM', resource_name: 'audit.test', username: 'audit.test', detected_at: '2025-06-01T00:00:00', control_id: 'AC-01', control_name: 'Access Review - User Account Management', sop_reference: 'ITGC-SOP-AC-001', ai_risk_analysis: { risk: 'HIGH', auditImpact: 'Non-compliance with access review policy', businessImpact: 'Potential unauthorized access', recommendation: 'Disable or remove inactive user account' } },
  { id: 2, finding_type: 'ACCESS', rule_id: 'ITGC-04', rule_name: 'MFA Not Enabled - Privileged User', description: "Privileged user 'john.admin' does not have MFA enabled - AdministratorAccess risk", severity: 'CRITICAL', status: 'OPEN', source: 'AWS IAM', resource_name: 'john.admin', username: 'john.admin', detected_at: '2025-06-01T00:00:00', control_id: 'AC-04', control_name: 'Multi-Factor Authentication', sop_reference: 'ITGC-SOP-AC-004', ai_risk_analysis: { risk: 'CRITICAL', auditImpact: 'SOX 404 violation risk', businessImpact: 'Account takeover risk', recommendation: 'Enable MFA immediately on privileged account' } },
  { id: 3, finding_type: 'CONFIG', rule_id: 'ITGC-10', rule_name: 'Public S3 Bucket Detected', description: "Public S3 bucket detected: customer-data-backup - sensitive data exposure risk", severity: 'CRITICAL', status: 'OPEN', source: 'AWS Config', resource_name: 'customer-data-backup', username: 'service.account', detected_at: '2025-06-01T00:00:00', control_id: 'CF-01', control_name: 'Public Access Configuration', sop_reference: 'ITGC-SOP-CF-001', ai_risk_analysis: { risk: 'CRITICAL', auditImpact: 'Data breach risk', businessImpact: 'Customer data exposure', recommendation: 'Remove public access and enable block public access settings' } },
  { id: 4, finding_type: 'CONFIG', rule_id: 'ITGC-11', rule_name: 'Security Group Open to Internet', description: "Security group open to internet: sg-production-db - 0.0.0.0/0 inbound access", severity: 'CRITICAL', status: 'OPEN', source: 'AWS Config', resource_name: 'sg-production-db', username: 'mike.developer', detected_at: '2025-06-01T00:00:00', control_id: 'CF-02', control_name: 'Network Security Configuration', sop_reference: 'ITGC-SOP-CF-002', ai_risk_analysis: { risk: 'CRITICAL', auditImpact: 'Network security violation', businessImpact: 'Database exposure to internet', recommendation: 'Restrict security group to specific IP ranges' } },
  { id: 5, finding_type: 'CHANGE', rule_id: 'ITGC-06', rule_name: 'Unauthorized Configuration Change', description: "Unauthorized IAM change 'PutRolePolicy' by john.admin - 2 changes without approval", severity: 'HIGH', status: 'OPEN', source: 'CloudTrail', resource_name: 'IAM Policy', username: 'john.admin', detected_at: '2025-06-01T00:00:00', control_id: 'CM-01', control_name: 'Change Management - Authorization', sop_reference: 'ITGC-SOP-CM-001', ai_risk_analysis: { risk: 'HIGH', auditImpact: 'SOX 404 change management violation', businessImpact: 'Unauthorized privilege escalation', recommendation: 'Implement CAB approval for all IAM policy changes' } },
];

const FALLBACK_EVENTS = [
  { id: 1, event_id: 'event-0001', event_name: 'CreateUser', event_time: '2025-05-30T10:00:00', username: 'admin-sarah', resource_type: 'IAM User', is_unauthorized: false, has_approval: true, is_emergency: false, ticket_number: 'CHG001234' },
  { id: 2, event_id: 'event-0002', event_name: 'PutRolePolicy', event_time: '2025-06-03T08:30:00', username: 'john.admin', resource_type: 'IAM Policy', is_unauthorized: true, has_approval: false, is_emergency: false, ticket_number: null },
  { id: 3, event_id: 'event-0003', event_name: 'PutBucketAcl', event_time: '2025-06-02T14:00:00', username: 'service.account', resource_type: 'S3', is_unauthorized: true, has_approval: false, is_emergency: false, ticket_number: null },
];

const FALLBACK_CONFIGS = [
  { id: 1, resource_id: 'policy-admin-full-access', resource_type: 'AWS::IAM::Policy', change_type: 'AttachRolePolicy - Unauthorized', changed_by: 'john.admin', changed_at: '2025-06-03T08:30:00', is_approved: false, has_ticket: false, violation_type: 'UNATHORIZED_POLICY_CHANGE', severity: 'CRITICAL' },
  { id: 2, resource_id: 'customer-data-backup', resource_type: 'AWS::S3::Bucket', change_type: 'PutBucketAcl - Unauthorized', changed_by: 'service.account', changed_at: '2025-06-02T14:00:00', is_approved: false, has_ticket: false, violation_type: 'PUBLIC_BUCKET_ACL', severity: 'CRITICAL' },
  { id: 3, resource_id: 'sg-production-db', resource_type: 'AWS::EC2::SecurityGroup', change_type: 'AuthorizeSecurityGroupIngress - Unauthorized', changed_by: 'mike.developer', changed_at: '2025-06-03T06:00:00', is_approved: false, has_ticket: false, violation_type: 'SG_OPEN_TO_INTERNET', severity: 'CRITICAL' },
];

const FALLBACK_CONFIG_SUMMARY = {
  totalChanges: 9, unauthorized: 3, publicBuckets: 2, openSecurityGroups: 2, policyViolations: 3,
};

const FALLBACK_RULES = [
  { rule_id: 'ITGC-01', name: 'Inactive User Account', control_id: 'AC-01', control_name: 'Access Review - User Account Management', category: 'ACCESS_CONTROL', description: 'Detect user accounts inactive for 90+ days', severity: 'HIGH', sop: 'ITGC-SOP-AC-001' },
  { rule_id: 'ITGC-04', name: 'MFA Not Enabled - Privileged User', control_id: 'AC-04', control_name: 'Multi-Factor Authentication', category: 'ACCESS_CONTROL', description: 'Detect privileged users without MFA enabled', severity: 'CRITICAL', sop: 'ITGC-SOP-AC-004' },
  { rule_id: 'ITGC-10', name: 'Public S3 Bucket Detected', control_id: 'CF-01', control_name: 'Public Access Configuration', category: 'CONFIG', description: 'Detect S3 buckets with public read/write access', severity: 'CRITICAL', sop: 'ITGC-SOP-CF-001' },
  { rule_id: 'ITGC-11', name: 'Security Group Open to Internet', control_id: 'CF-02', control_name: 'Network Security Configuration', category: 'CONFIG', description: 'Detect security groups with 0.0.0.0/0 inbound rules', severity: 'CRITICAL', sop: 'ITGC-SOP-CF-002' },
  { rule_id: 'ITGC-06', name: 'Unauthorized Configuration Change', control_id: 'CM-01', control_name: 'Change Management - Authorization', category: 'CHANGE', description: 'Detect changes made without proper approval', severity: 'HIGH', sop: 'ITGC-SOP-CM-001' },
  { rule_id: 'ITGC-07', name: 'Emergency Change Without Post-Review', control_id: 'CM-02', control_name: 'Emergency Change Management', category: 'CHANGE', description: 'Detect emergency changes without post-change review', severity: 'HIGH', sop: 'ITGC-SOP-CM-002' },
];

const FALLBACK_GROUPS = [
  { id: 1, group_name: 'Administrators', description: 'Full administrative access to all AWS resources', policy_count: 5, user_count: 3 },
  { id: 2, group_name: 'Finance', description: 'Access to financial systems and S3 buckets', policy_count: 3, user_count: 2 },
  { id: 3, group_name: 'Developers', description: 'Developer access to dev and test environments', policy_count: 4, user_count: 3 },
  { id: 4, group_name: 'ReadOnly', description: 'Read-only access for auditing and monitoring', policy_count: 2, user_count: 2 },
  { id: 5, group_name: 'Auditors', description: 'Auditor access for compliance review', policy_count: 2, user_count: 1 },
];

const FALLBACK_CHANGE_REQUESTS = [
  { id: 1, change_id: 'CR-001', approved: true, emergency: false, implemented_by: 'admin-sarah', ticket_number: 'CHG001234', description: 'Create new IAM user for developer onboarding', detected_at: '2025-05-30T10:00:00' },
  { id: 2, change_id: 'CR-002', approved: false, emergency: false, implemented_by: 'john.admin', ticket_number: null, description: 'Attach AdministratorAccess policy without approval', detected_at: '2025-06-03T08:30:00' },
  { id: 3, change_id: 'CR-003', approved: true, emergency: true, implemented_by: 'admin-sarah', ticket_number: 'CHG001237', description: 'Emergency IAM role update for production incident', detected_at: '2025-06-03T06:00:00' },
];

const FALLBACK_CHANGE_COMPLIANCE_DETAILED = {
  totalChanges: 3, approved: 2, unauthorized: 1, emergency: 1, noTicket: 1, complianceRate: 66.7,
};

const FALLBACK_USER_ACCESS_RISK = {
  mfaDisabled: 4, sharedAccounts: 1, noManagerApproval: 3,
};

// Helper to wrap API calls with fallback
// Returns axios-like response object so pages using .data work correctly
const withFallback = (apiCall, fallbackData) => {
  return apiCall()
    .then(response => response)
    .catch(() => ({ data: fallbackData, status: 200, statusText: 'OK', headers: {}, config: {} }));
};

// Dashboard APIs
export const getDashboardSummary = () => withFallback(() => api.get('/api/dashboard/summary'), FALLBACK_SUMMARY);
export const getRiskTrends = () => withFallback(() => api.get('/api/dashboard/trends'), FALLBACK_TRENDS);
export const getFindingsByControl = () => withFallback(() => api.get('/api/dashboard/findings-by-control'), FALLBACK_FINDINGS_BY_CONTROL);
export const getChangeCompliance = () => withFallback(() => api.get('/api/dashboard/change-compliance'), FALLBACK_CHANGE_COMPLIANCE);
export const getUserAccessRisk = () => withFallback(() => api.get('/api/dashboard/user-access-risk'), FALLBACK_USER_ACCESS_RISK);

// IAM APIs
export const getIAMUsers = (skip = 0, limit = 100) => withFallback(() => api.get(`/api/iam/users?skip=${skip}&limit=${limit}`), FALLBACK_USERS);
export const getIAMSummary = () => withFallback(() => api.get('/api/iam/users/summary'), FALLBACK_IAM_SUMMARY);

// CloudTrail APIs
export const getCloudTrailEvents = (skip = 0, limit = 100) => withFallback(() => api.get(`/api/cloudtrail/events?skip=${skip}&limit=${limit}`), FALLBACK_EVENTS);

// Config APIs
export const getConfigChanges = (skip = 0, limit = 100) => withFallback(() => api.get(`/api/config/changes?skip=${skip}&limit=${limit}`), FALLBACK_CONFIGS);
export const getConfigSummary = () => withFallback(() => api.get('/api/config/summary'), FALLBACK_CONFIG_SUMMARY);

// Findings APIs
export const getFindings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return withFallback(() => api.get(`/api/findings?${query}`), FALLBACK_FINDINGS);
};
export const getFinding = (id) => withFallback(() => api.get(`/api/findings/${id}`), FALLBACK_FINDINGS[0] || {});
export const updateFindingStatus = (id, status) => withFallback(() => api.patch(`/api/findings/${id}/status?status=${status}`), { message: `Finding ${id} status updated to ${status}` });

// AI APIs
export const analyzeFinding = (id) => withFallback(() => api.post(`/api/ai/analyze/${id}`), { risk: 'MEDIUM', auditImpact: 'Fallback analysis', businessImpact: 'Pending', recommendation: 'Review finding manually', soxRisk: 'Pending', regulatoryReferences: ['SOX 404', 'ISO 27001'], probability: 50, detectionDifficulty: 'Medium' });
export const getAuditPrediction = () => withFallback(() => api.get('/api/ai/audit-prediction'), { overallRisk: 'High', predictedFindings: 5, recommendation: 'Prioritize remediation of critical and high-severity findings before audit' });
export const getRemediationPlan = () => withFallback(() => api.get('/api/ai/remediation-plan'), { summary: 'Focus on critical findings first', items: ['Enable MFA on privileged accounts', 'Disable inactive users', 'Remove public S3 bucket access', 'Restrict open security groups', 'Implement change management approval process'] });

// System APIs
export const getHealth = () => withFallback(() => api.get('/api/health'), { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', ai_enabled: false, demo_mode: true });
export const seedData = () => withFallback(() => api.post('/api/seed-data'), { message: 'Demo mode - data already available' });
export const runRules = () => withFallback(() => api.post('/api/run-rules'), { message: 'Demo mode - rules executed with sample data', total_findings: 5, new_findings: 5 });
export const getITGCRules = () => withFallback(() => api.get('/api/rules'), FALLBACK_RULES);

// New endpoints
export const askCopilot = (question) => withFallback(() => api.post('/api/copilot/ask', null, { params: { question } }), { answer: `I'm in demo mode. Regarding your question about "${question}", please set up the backend for full AI-powered responses.`, source: 'demo', context: [] });
export const getCopilotHistory = () => withFallback(() => api.get('/api/copilot/history'), []);
export const getIAMGroups = () => withFallback(() => api.get('/api/iam/groups'), FALLBACK_GROUPS);
export const getChangeRequests = () => withFallback(() => api.get('/api/change-requests'), FALLBACK_CHANGE_REQUESTS);
export const getChangeRequestCompliance = () => withFallback(() => api.get('/api/change-requests/compliance'), FALLBACK_CHANGE_COMPLIANCE_DETAILED);
export const generatePDFReport = () => withFallback(() => api.get('/api/report/pdf', { responseType: 'blob' }), null);
export const runIAMScan = () => withFallback(() => api.get('/api/scanners/iam'), { total_users: 12, risks_found: 5, risks: [{ type: 'MFA_DISABLED', severity: 'CRITICAL', users: ['john.admin', 'root-account', 'service.account', 'legacy-admin'] }, { type: 'INACTIVE_USER', severity: 'HIGH', users: ['audit.test', 'jane.smith', 'bob.wilson'] }] });
export const runCloudTrailScan = () => withFallback(() => api.get('/api/scanners/cloudtrail'), { total_events: 13, findings: ['Unauthorized changes by john.admin', 'Emergency change without post-review'], root_activity: false });
export const runConfigScan = () => withFallback(() => api.get('/api/scanners/config'), { total_configs: 9, violations_found: 6, public_buckets: ['customer-data-backup', 'logs-archive', 'backup-bucket'], open_security_groups: ['sg-production-db', 'sg-dev-servers'], policy_violations: ['policy-admin-full-access'] });

export default api;