import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Button, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, LinearProgress, Alert, Divider,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  Refresh, Warning, Security, Key, Group, Policy,
  VerifiedUser, Lock, Person, ErrorOutline,
  Visibility, ArrowDropDown, ArrowRight, VpnKeyOutlined
} from '@mui/icons-material';
import * as awsIAM from '../services/aws-iam';

// ---------- Tab Panel ----------
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ---------- Status Badge ----------
const Badge = ({ label, type = 'default' }) => {
  const colorMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
    default: 'default',
  };
  return <Chip label={label} size="small" color={colorMap[type] || 'default'} />;
};

// ---------- Summary Cards ----------
const SummaryCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Box sx={{ bgcolor: `${color}20`, borderRadius: 2, p: 0.5, display: 'flex' }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      )}
    </CardContent>
  </Card>
);

// ---------- Main Component ----------
export default function AccessManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configError, setConfigError] = useState(false);

  // Data states
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [summary, setSummary] = useState(null);

  // Detail dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState(null);
  const [expandedRows, setExpandedRows] = useState({}); // For user detail expansion

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConfigError(false);

    try {
      const result = await awsIAM.tryFetchAWSData();
      setUsers(result.users || []);
      setRoles(result.roles || []);
      setGroups(result.groups || []);
      setPolicies(result.policies || []);
      setSummary(result.summary);
      if (result.demoMode) {
        // Demo mode - use static JSON data, no error needed
        setConfigError(false);
        setError(null);
      } else if (!result.configured) {
        setConfigError(true);
        setError(result.error);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('AWS IAM Fetch Error:', err);
      setError(err.message || 'Failed to fetch IAM data from AWS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ---------- Helpers ----------
  const getDaysSince = (date) => {
    if (!date) return null;
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getAccessKeyAgeStatus = (createDate) => {
    const days = getDaysSince(createDate);
    if (days === null) return { label: 'N/A', color: 'default' };
    if (days > 365) return { label: `${days}d (Expired)`, color: 'error' };
    if (days > 90) return { label: `${days}d (Expiring)`, color: 'warning' };
    return { label: `${days}d`, color: 'success' };
  };

  const getLastUsedStatus = (lastUsedDate) => {
    const days = getDaysSince(lastUsedDate);
    if (days === null) return { label: 'Never Used', color: 'error' };
    if (days > 180) return { label: `${days}d ago`, color: 'error' };
    if (days > 90) return { label: `${days}d ago`, color: 'warning' };
    return { label: `${days}d ago`, color: 'success' };
  };

  const toggleExpand = (userId) => {
    setExpandedRows(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const openDetailDialog = (title, content) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogOpen(true);
  };

  // ---------- Render: Config Error ----------
  if (configError) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>AWS Credentials Not Configured</Typography>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mb: 3, textAlign: 'left' }}>
          To use live AWS IAM data, you need to configure AWS credentials in your <code>.env</code> file:
          <ol style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Create an IAM user in your AWS account with <strong>ReadOnlyAccess</strong> policy</li>
            <li>Generate an access key for that user</li>
            <li>Add the credentials to your <code>.env</code> file</li>
          </ol>
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          REACT_APP_AWS_ACCESS_KEY_ID=YOUR_KEY<br />
          REACT_APP_AWS_SECRET_ACCESS_KEY=YOUR_SECRET<br />
          REACT_APP_AWS_REGION=us-east-1
        </Typography>
        <Button onClick={fetchAllData} variant="contained" startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">Fetching live IAM data from AWS...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Listing users, roles, groups, policies & account summary
        </Typography>
      </Box>
    );
  }

  if (error && !configError) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Failed to Fetch IAM Data</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
        <Button onClick={fetchAllData} variant="contained" startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  // Account-level statistics
  const privilegedUsers = users.filter(u => u.isPrivileged).length;
  const mfaDisabledUsers = users.filter(u => !u.mfaEnabled).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const usersWithAccessKeys = users.filter(u => u.accessKeys.length > 0).length;
  const oldAccessKeys = users.flatMap(u => u.accessKeys || []).filter(k => {
    const days = getDaysSince(k.CreateDate);
    return days !== null && days > 365;
  }).length;
  const neverUsedKeys = users.flatMap(u => u.accessKeys || []).filter(k => !k.lastUsedDate).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">AWS IAM Live Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            IAM User & Access Management Dashboard
            <Chip label="Demo Mode" color="warning" size="small" sx={{ ml: 1 }} />
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip icon={<Security />} label={`${summary?.totalUsers || 0} Users`} variant="outlined" size="small" />
          <Chip icon={<Group />} label={`${summary?.totalRoles || 0} Roles`} variant="outlined" size="small" />
          <Chip icon={<Key />} label={`${usersWithAccessKeys} Have Keys`} variant="outlined" size="small" color={usersWithAccessKeys > 0 ? 'warning' : 'default'} />
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAllData} size="small">
            Refresh from AWS
          </Button>
        </Box>
      </Box>

      {/* Security Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard title="Total Users" value={summary?.totalUsers || users.length} icon={<Person />} color="#7c4dff" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard title="Privileged" value={privilegedUsers} icon={<Security />} color="#ff9800" subtitle={`${((privilegedUsers / (users.length || 1)) * 100).toFixed(1)}% of users`} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard title="MFA Disabled" value={mfaDisabledUsers} icon={<Lock />} color="#f44336" subtitle={`${((mfaDisabledUsers / (users.length || 1)) * 100).toFixed(1)}% risk`} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard title="Inactive Users" value={inactiveUsers} icon={<Warning />} color="#ff5722" subtitle="No console login configured" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard title="Old/Unused Keys" value={oldAccessKeys + neverUsedKeys} icon={<Key />} color="#f44336" subtitle={`${oldAccessKeys} >1yr + ${neverUsedKeys} unused`} />
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button size="small" onClick={fetchAllData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`Users (${users.length})`} icon={<Person />} iconPosition="start" />
            <Tab label={`Roles (${roles.length})`} icon={<Security />} iconPosition="start" />
            <Tab label={`Groups (${groups.length})`} icon={<Group />} iconPosition="start" />
            <Tab label={`Policies (${policies.length})`} icon={<Policy />} iconPosition="start" />
            <Tab label="Account Summary" icon={<VerifiedUser />} iconPosition="start" />
          </Tabs>
        </CardContent>
      </Card>

      {/* ========== TAB: Users ========== */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              IAM Users - Detailed View
              <Chip label="Direct from AWS" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Username</TableCell>
                    <TableCell>ARN</TableCell>
                    <TableCell>MFA</TableCell>
                    <TableCell>Console</TableCell>
                    <TableCell>Access Keys</TableCell>
                    <TableCell>Groups</TableCell>
                    <TableCell>Policies</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                      <TableRow sx={{
                        bgcolor: user.enrichmentError ? 'rgba(255,152,0,0.05)' : 
                                 !user.mfaEnabled ? 'rgba(244,67,54,0.03)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(124,77,255,0.04)' },
                      }}>
                        <TableCell padding="checkbox">
                          <IconButton size="small" onClick={() => toggleExpand(user.id)}>
                            {expandedRows[user.id] ? <ArrowDropDown /> : <ArrowRight />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.arn}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ wordBreak: 'break-all', maxWidth: 200, display: 'block' }}>
                            {user.arn}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Badge label={user.mfaEnabled ? 'Enabled' : 'Disabled'} 
                            type={user.mfaEnabled ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell>
                          <Badge label={user.hasConsolePassword ? 'Enabled' : 'Disabled'}
                            type={user.hasConsolePassword ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${user.accessKeys.length} key${user.accessKeys.length !== 1 ? 's' : ''}`}
                            size="small"
                            color={user.accessKeys.length > 1 ? 'warning' : user.accessKeys.length === 0 ? 'default' : 'info'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {user.groups.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                              {user.groups.slice(0, 2).map((g, i) => (
                                <Chip key={i} label={g} size="small" variant="outlined" />
                              ))}
                              {user.groups.length > 2 && (
                                <Chip label={`+${user.groups.length - 2}`} size="small" color="info" />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">None</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                            {user.attachedPolicies.slice(0, 2).map((p, i) => (
                              <Chip key={i} label={p.name} size="small" color="primary" variant="outlined" />
                            ))}
                            {user.attachedPolicies.length > 2 && (
                              <Chip label={`+${user.attachedPolicies.length - 2}`} size="small" color="info" />
                            )}
                            {user.inlinePolicies.length > 0 && (
                              <Chip label={`${user.inlinePolicies.length} inline`} size="small" variant="outlined" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {user.createDate ? new Date(user.createDate).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => openDetailDialog(
                            `User: ${user.username}`,
                            <UserDetail user={user} getDaysSince={getDaysSince} getAccessKeyAgeStatus={getAccessKeyAgeStatus} getLastUsedStatus={getLastUsedStatus} />
                          )}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {/* Expanded row */}
                      {expandedRows[user.id] && (
                        <TableRow>
                          <TableCell colSpan={10} sx={{ py: 2, bgcolor: 'rgba(124,77,255,0.02)' }}>
                            <UserDetailCompact 
                              user={user} 
                              getDaysSince={getDaysSince} 
                              getAccessKeyAgeStatus={getAccessKeyAgeStatus} 
                              getLastUsedStatus={getLastUsedStatus}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ========== TAB: Roles ========== */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>IAM Roles</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Role Name</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Trust Policy</TableCell>
                    <TableCell>Attached Policies</TableCell>
                    <TableCell>Inline Policies</TableCell>
                    <TableCell>Max Session</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{role.roleName}</Typography>
                        <Typography variant="caption" color="text.secondary">{role.arn}</Typography>
                      </TableCell>
                      <TableCell><Chip label={role.path || '/'} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        {role.trustPolicy ? (
                          <Tooltip title={JSON.stringify(role.trustPolicy, null, 2).substring(0, 200)}>
                            <Chip label="Has Trust Policy" color="info" size="small" />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                          {role.attachedPolicies.slice(0, 3).map((p, i) => (
                            <Chip key={i} label={p.name} size="small" color="primary" variant="outlined" />
                          ))}
                          {role.attachedPolicies.length > 3 && (
                            <Chip label={`+${role.attachedPolicies.length - 3}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {role.inlinePolicies.length > 0 ? (
                          <Chip label={`${role.inlinePolicies.length}`} color="warning" size="small" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">0</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={role.maxSessionDuration ? `${role.maxSessionDuration / 3600}h` : '1h'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{role.createDate ? new Date(role.createDate).toLocaleDateString() : '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ========== TAB: Groups ========== */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>IAM Groups</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group Name</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>ARN</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{group.groupName}</Typography>
                      </TableCell>
                      <TableCell><Chip label={group.path || '/'} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{group.arn}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{group.createDate ? new Date(group.createDate).toLocaleDateString() : '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No IAM groups found in this account</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ========== TAB: Policies ========== */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer Managed Policies</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Policy Name</TableCell>
                    <TableCell>Attachment Count</TableCell>
                    <TableCell>Attached To</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{policy.policyName}</Typography>
                        <Typography variant="caption" color="text.secondary">{policy.arn}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={policy.attachmentCount} size="small" color={policy.attachmentCount > 0 ? 'info' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {policy.usersAttached.length > 0 && (
                            <Chip icon={<Person fontSize="small" />} label={`${policy.usersAttached.length} users`} size="small" variant="outlined" />
                          )}
                          {policy.groupsAttached.length > 0 && (
                            <Chip icon={<Group fontSize="small" />} label={`${policy.groupsAttached.length} groups`} size="small" variant="outlined" />
                          )}
                          {policy.rolesAttached.length > 0 && (
                            <Chip icon={<Security fontSize="small" />} label={`${policy.rolesAttached.length} roles`} size="small" variant="outlined" />
                          )}
                          {policy.attachmentCount === 0 && (
                            <Typography variant="caption" color="text.secondary">Unused</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {policy.updateDate ? new Date(policy.updateDate).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openDetailDialog(
                          `Policy: ${policy.policyName}`,
                          <PolicyDetail policy={policy} />
                        )}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ========== TAB: Account Summary ========== */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Account Summary
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell>Total Users</TableCell><TableCell align="right"><strong>{summary?.totalUsers}</strong></TableCell></TableRow>
                    <TableRow><TableCell>Users with MFA</TableCell><TableCell align="right"><Chip label={summary?.usersWithMFA} color="success" size="small" /></TableCell></TableRow>
                    <TableRow><TableCell>Users without MFA</TableCell><TableCell align="right"><Chip label={summary?.usersWithoutMFA} color="error" size="small" /></TableCell></TableRow>
                    <TableRow><TableCell>Total Roles</TableCell><TableCell align="right"><strong>{summary?.totalRoles}</strong></TableCell></TableRow>
                    <TableRow><TableCell>Total Groups</TableCell><TableCell align="right"><strong>{summary?.totalGroups}</strong></TableCell></TableRow>
                    <TableRow><TableCell>Managed Policies</TableCell><TableCell align="right"><strong>{summary?.totalPolicies}</strong></TableCell></TableRow>
                    <TableRow><TableCell>MFA Devices (Assigned)</TableCell><TableCell align="right"><strong>{summary?.virtualMFADevices}</strong></TableCell></TableRow>
                    <TableRow><TableCell>Access Keys per User (limit)</TableCell><TableCell align="right">{summary?.accessKeysPerUser}</TableCell></TableRow>
                    <TableRow><TableCell>Instance Profiles</TableCell><TableCell align="right">{summary?.instanceProfiles}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Policy */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Password Policy
                </Typography>
                {summary?.passwordPolicy ? (
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Min Length</TableCell>
                        <TableCell align="right"><Chip label={summary.passwordPolicy.minimumPasswordLength} size="small" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Require Symbols</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.requireSymbols ? 'Yes' : 'No'} 
                            type={summary.passwordPolicy.requireSymbols ? 'success' : 'error'} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Require Numbers</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.requireNumbers ? 'Yes' : 'No'}
                            type={summary.passwordPolicy.requireNumbers ? 'success' : 'error'} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Require Uppercase</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.requireUppercaseCharacters ? 'Yes' : 'No'}
                            type={summary.passwordPolicy.requireUppercaseCharacters ? 'success' : 'error'} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Require Lowercase</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.requireLowercaseCharacters ? 'Yes' : 'No'}
                            type={summary.passwordPolicy.requireLowercaseCharacters ? 'success' : 'error'} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Expire Passwords</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.expirePasswords ? `Yes (${summary.passwordPolicy.maxPasswordAge}d)` : 'No'}
                            type={summary.passwordPolicy.expirePasswords ? 'success' : 'warning'} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Password Reuse</TableCell>
                        <TableCell align="right">
                          <Chip label={`Prevent last ${summary.passwordPolicy.passwordReusePrevention || 0}`} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Allow Change</TableCell>
                        <TableCell align="right">
                          <Badge label={summary.passwordPolicy.allowUsersToChangePassword ? 'Yes' : 'No'}
                            type={summary.passwordPolicy.allowUsersToChangePassword ? 'success' : 'warning'} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Warning color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography color="text.secondary">No password policy set</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Consider configuring an account password policy for security compliance
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* MFA Usage Bar */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>MFA Adoption</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={summary?.totalUsers ? ((summary.usersWithMFA / summary.totalUsers) * 100) : 0}
                      sx={{
                        height: 20, borderRadius: 10,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 10,
                          background: 'linear-gradient(90deg, #f44336, #ff9800, #4caf50)',
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                    {summary?.totalUsers ? ((summary.usersWithMFA / summary.totalUsers) * 100).toFixed(0) : 0}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" color="success.main">With MFA: {summary?.usersWithMFA}</Typography>
                  <Typography variant="body2" color="error.main">Without MFA: {summary?.usersWithoutMFA}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Accounts: {summary?.totalUsers}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUser color="primary" />
            {dialogTitle}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {dialogContent}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------- User Detail View (Dialog) ----------
function UserDetail({ user, getDaysSince, getAccessKeyAgeStatus, getLastUsedStatus }) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2">Username</Typography>
          <Typography variant="body2" gutterBottom>{user.username}</Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>ARN</Typography>
          <Typography variant="body2" gutterBottom sx={{ wordBreak: 'break-all' }}>{user.arn}</Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Path</Typography>
          <Typography variant="body2" gutterBottom>{user.role}</Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Created</Typography>
          <Typography variant="body2" gutterBottom>
            {user.createDate ? new Date(user.createDate).toLocaleString() : '-'}
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Department (Tag)</Typography>
          <Typography variant="body2" gutterBottom>{user.department}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2">MFA Status</Typography>
          <Box sx={{ mb: 1 }}>
            <Chip label={user.mfaEnabled ? 'MFA Enabled' : 'MFA Disabled'} 
              color={user.mfaEnabled ? 'success' : 'error'} size="small" />
          </Box>

          {user.mfaDevices.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>MFA Devices</Typography>
              {user.mfaDevices.map((m, i) => (
                <Typography key={i} variant="caption" display="block" color="text.secondary">
                  Serial: {m.serialNumber} (since {new Date(m.enableDate).toLocaleDateString()})
                </Typography>
              ))}
            </>
          )}

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Console Access</Typography>
          <Box sx={{ mb: 1 }}>
            <Chip label={user.hasConsolePassword ? 'Console Enabled' : 'Console Disabled'}
              color={user.hasConsolePassword ? 'success' : 'default'} size="small" />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Last Login</Typography>
          <Typography variant="body2" gutterBottom>
            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Groups */}
      <Typography variant="subtitle2" gutterBottom>Group Memberships ({user.groups.length})</Typography>
      {user.groups.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {user.groups.map((g, i) => (
            <Chip key={i} label={g} size="small" icon={<Group />} variant="outlined" />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>No group memberships</Typography>
      )}

      {/* Attached Policies */}
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" gutterBottom>Attached Managed Policies ({user.attachedPolicies.length})</Typography>
      {user.attachedPolicies.length > 0 ? (
        <List dense disablePadding>
          {user.attachedPolicies.map((p, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Policy fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={p.name} secondary={p.arn} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>No managed policies attached</Typography>
      )}

      {/* Inline Policies */}
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" gutterBottom>Inline Policies ({user.inlinePolicies.length})</Typography>
      {user.inlinePolicies.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {user.inlinePolicies.map((name, i) => (
            <Chip key={i} label={`inline: ${name}`} size="small" color="warning" variant="outlined" />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>No inline policies</Typography>
      )}

      {/* Access Keys */}
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" gutterBottom>Access Keys ({user.accessKeys.length})</Typography>
      {user.accessKeys.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {user.accessKeys.map((key, i) => {
              const ageStatus = getAccessKeyAgeStatus(key.CreateDate);
              const lastUsedStatus = getLastUsedStatus(key.lastUsedDate);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {key.AccessKeyId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={key.Status} size="small"
                      color={key.Status === 'Active' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {key.CreateDate ? new Date(key.CreateDate).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Badge label={ageStatus.label} type={ageStatus.color} />
                  </TableCell>
                  <TableCell>
                    <Badge label={lastUsedStatus.label} type={lastUsedStatus.color} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{key.lastUsedService || '-'}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body2" color="text.secondary">No access keys</Typography>
      )}

      {/* Tags */}
      {user.tags.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>Tags ({user.tags.length})</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {user.tags.map((t, i) => (
              <Chip key={i} label={`${t.Key}: ${t.Value}`} size="small" variant="outlined" />
            ))}
          </Box>
        </>
      )}

      {user.enrichmentError && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Partial data: {user.enrichmentError}
        </Alert>
      )}
    </Box>
  );
}

// ---------- User Detail Compact (In-Table Expand) ----------
function UserDetailCompact({ user, getDaysSince, getAccessKeyAgeStatus, getLastUsedStatus }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" color="text.secondary" display="block">Access Keys</Typography>
        {user.accessKeys.length > 0 ? (
          user.accessKeys.map((key, i) => {
            const age = getAccessKeyAgeStatus(key.CreateDate);
            const lastUsed = getLastUsedStatus(key.lastUsedDate);
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <VpnKeyOutlined fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{key.AccessKeyId}</Typography>
                <Chip label={key.Status} size="small" variant="outlined" />
                <Badge label={age.label} type={age.color} />
                <Badge label={lastUsed.label} type={lastUsed.color} />
              </Box>
            );
          })
        ) : (
          <Typography variant="caption" color="text.secondary">No access keys</Typography>
        )}
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" color="text.secondary" display="block">Policies & Groups</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {user.attachedPolicies.map((p, i) => (
            <Chip key={i} label={p.name} size="small" color="primary" variant="outlined" />
          ))}
          {user.groups.map((g, i) => (
            <Chip key={i} label={g} size="small" variant="outlined" />
          ))}
          {user.attachedPolicies.length === 0 && user.groups.length === 0 && (
            <Typography variant="caption" color="text.secondary">No policies or groups</Typography>
          )}
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">MFA Devices</Typography>
          {user.mfaDevices.length > 0 ? (
            user.mfaDevices.map((m, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary">
                {m.serialNumber} (since {new Date(m.enableDate).toLocaleDateString()})
              </Typography>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">No MFA devices</Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}

// ---------- Policy Detail View ----------
function PolicyDetail({ policy }) {
  return (
    <Box>
      <Typography variant="subtitle2">Policy Name</Typography>
      <Typography variant="body2" gutterBottom>{policy.policyName}</Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>ARN</Typography>
      <Typography variant="body2" gutterBottom sx={{ wordBreak: 'break-all' }}>{policy.arn}</Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Path</Typography>
      <Typography variant="body2" gutterBottom>{policy.path || '/'}</Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Created</Typography>
      <Typography variant="body2" gutterBottom>
        {policy.createDate ? new Date(policy.createDate).toLocaleString() : '-'}
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Last Updated</Typography>
      <Typography variant="body2" gutterBottom>
        {policy.updateDate ? new Date(policy.updateDate).toLocaleString() : '-'}
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Attachment Count</Typography>
      <Typography variant="body2" gutterBottom>
        <Chip label={policy.attachmentCount} color={policy.attachmentCount > 0 ? 'info' : 'default'} size="small" />
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>Attached Entities</Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Card variant="outlined" sx={{ bgcolor: 'rgba(33,150,243,0.05)' }}>
            <CardContent>
              <Typography variant="body2" color="info.main" fontWeight={600}>Users</Typography>
              <Typography variant="h5">{policy.usersAttached.length}</Typography>
              {policy.usersAttached.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {policy.usersAttached.join(', ')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card variant="outlined" sx={{ bgcolor: 'rgba(76,175,80,0.05)' }}>
            <CardContent>
              <Typography variant="body2" color="success.main" fontWeight={600}>Groups</Typography>
              <Typography variant="h5">{policy.groupsAttached.length}</Typography>
              {policy.groupsAttached.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {policy.groupsAttached.join(', ')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card variant="outlined" sx={{ bgcolor: 'rgba(255,152,0,0.05)' }}>
            <CardContent>
              <Typography variant="body2" color="warning.main" fontWeight={600}>Roles</Typography>
              <Typography variant="h5">{policy.rolesAttached.length}</Typography>
              {policy.rolesAttached.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {policy.rolesAttached.join(', ')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}