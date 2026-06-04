import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard APIs
export const getDashboardSummary = () => api.get('/api/dashboard/summary');
export const getRiskTrends = () => api.get('/api/dashboard/trends');
export const getFindingsByControl = () => api.get('/api/dashboard/findings-by-control');
export const getChangeCompliance = () => api.get('/api/dashboard/change-compliance');
export const getUserAccessRisk = () => api.get('/api/dashboard/user-access-risk');

// IAM APIs
export const getIAMUsers = (skip = 0, limit = 100) => api.get(`/api/iam/users?skip=${skip}&limit=${limit}`);
export const getIAMSummary = () => api.get('/api/iam/users/summary');

// CloudTrail APIs
export const getCloudTrailEvents = (skip = 0, limit = 100) => api.get(`/api/cloudtrail/events?skip=${skip}&limit=${limit}`);

// Config APIs
export const getConfigChanges = (skip = 0, limit = 100) => api.get(`/api/config/changes?skip=${skip}&limit=${limit}`);
export const getConfigSummary = () => api.get('/api/config/summary');

// Findings APIs
export const getFindings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/api/findings?${query}`);
};
export const getFinding = (id) => api.get(`/api/findings/${id}`);
export const updateFindingStatus = (id, status) => api.patch(`/api/findings/${id}/status?status=${status}`);

// AI APIs
export const analyzeFinding = (id) => api.post(`/api/ai/analyze/${id}`);
export const getAuditPrediction = () => api.get('/api/ai/audit-prediction');
export const getRemediationPlan = () => api.get('/api/ai/remediation-plan');

// System APIs
export const getHealth = () => api.get('/api/health');
export const seedData = () => api.post('/api/seed-data');
export const runRules = () => api.post('/api/run-rules');
export const getITGCRules = () => api.get('/api/rules');

// New endpoints
export const askCopilot = (question) => api.post('/api/copilot/ask', null, { params: { question } });
export const getCopilotHistory = () => api.get('/api/copilot/history');
export const getIAMGroups = () => api.get('/api/iam/groups');
export const getChangeRequests = () => api.get('/api/change-requests');
export const getChangeRequestCompliance = () => api.get('/api/change-requests/compliance');
export const generatePDFReport = () => api.get('/api/report/pdf', { responseType: 'blob' });
export const runIAMScan = () => api.get('/api/scanners/iam');
export const runCloudTrailScan = () => api.get('/api/scanners/cloudtrail');
export const runConfigScan = () => api.get('/api/scanners/config');

export default api;
