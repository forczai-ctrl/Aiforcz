import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, IconButton,
  CircularProgress, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import {
  ArrowUpward, ArrowDownward, Warning, Security, Refresh, Upload
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  getDashboardSummary, getRiskTrends, getFindingsByControl,
  getChangeCompliance, seedData, runRules
} from '../api';

const StatCard = ({ title, value, subtitle, icon, color, severity }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Box sx={{ 
          bgcolor: `${color}20`, borderRadius: 2, p: 0.5, display: 'flex' 
        }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {severity && (
        <Chip 
          label={severity} 
          size="small" 
          color={severity === 'Critical' ? 'error' : severity === 'High' ? 'warning' : 'info'}
          sx={{ mt: 1, fontWeight: 600 }}
        />
      )}
    </CardContent>
  </Card>
);

const COLORS_PIE = ['#f44336', '#ff9800', '#2196f3'];

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [findingsByControl, setFindingsByControl] = useState([]);
  const [changeCompliance, setChangeCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sum, tr, fbc, cc] = await Promise.all([
        getDashboardSummary(),
        getRiskTrends(),
        getFindingsByControl(),
        getChangeCompliance(),
      ]);
      setSummary(sum.data);
      setTrends(tr.data);
      setFindingsByControl(fbc.data);
      setChangeCompliance(cc.data);
      setError(null);
    } catch (err) {
      setError('Backend not connected. Please start the backend server and seed data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSeedAndRun = async () => {
    try {
      setSeeding(true);
      await seedData();
      await runRules();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Backend Not Connected</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={handleSeedAndRun}
            disabled={seeding}
          >
            {seeding ? 'Seeding Data...' : 'Seed Database & Run Rules'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            Retry Connection
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Executive Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={handleSeedAndRun}
            disabled={seeding}
            size="small"
          >
            {seeding ? 'Seeding...' : 'Seed Data'}
          </Button>
          <IconButton onClick={fetchData} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Controls Monitored" value={summary?.totalControls || 125} icon={<Security />} color="#7c4dff" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Open Issues" value={summary?.openIssues || 0} icon={<Warning />} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="High Risk" value={summary?.highRisk || 0} icon={<ArrowUpward />} color="#ff5722" severity="High" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Critical" value={summary?.critical || 0} icon={<ArrowDownward />} color="#f44336" severity="Critical" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Audit Readiness" value={`${summary?.auditReadiness || 0}%`} icon={<Security />} color="#4caf50" />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Trend (Last 12 Weeks)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ background: '#1a2050', border: '1px solid rgba(124,77,255,0.2)', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="high" stackId="1" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Findings by Control</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={findingsByControl}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {findingsByControl.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second row charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Change Management Compliance</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={changeCompliance ? [
                  { name: 'Total', value: changeCompliance.totalChanges, color: '#7c4dff' },
                  { name: 'Approved', value: changeCompliance.approved, color: '#4caf50' },
                  { name: 'Unauthorized', value: changeCompliance.unauthorized, color: '#f44336' },
                  { name: 'Emergency', value: changeCompliance.emergency, color: '#ff9800' },
                ] : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {changeCompliance && [
                      <Cell fill="#7c4dff" />,
                      <Cell fill="#4caf50" />,
                      <Cell fill="#f44336" />,
                      <Cell fill="#ff9800" />,
                    ]}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Access Management Metrics</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Users Reviewed</TableCell>
                      <TableCell align="right">{summary?.usersReviewed || 0}</TableCell>
                      <TableCell align="right"><Chip label="Active" color="info" size="small" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Privileged Accounts</TableCell>
                      <TableCell align="right">{summary?.privilegedAccounts || 0}</TableCell>
                      <TableCell align="right"><Chip label="Monitored" color="warning" size="small" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Inactive Users</TableCell>
                      <TableCell align="right">{summary?.inactiveUsers || 0}</TableCell>
                      <TableCell align="right">
                        <Chip label="Action Required" color="error" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dormant Admins</TableCell>
                      <TableCell align="right">{summary?.dormantAccounts || 0}</TableCell>
                      <TableCell align="right">
                        <Chip label="Review" color="warning" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>SoD Violations</TableCell>
                      <TableCell align="right">{summary?.sodViolations || 0}</TableCell>
                      <TableCell align="right">
                        <Chip label="Critical" color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Audit Readiness */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Audit Readiness Score</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={summary?.auditReadiness || 0} 
                sx={{ 
                  height: 12, borderRadius: 6,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: `linear-gradient(90deg, #f44336, #ff9800, ${summary?.auditReadiness > 70 ? '#4caf50' : '#ff9800'})`
                  }
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
              {summary?.auditReadiness || 0}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {summary?.auditReadiness > 80 ? 'Strong audit posture. Continue monitoring.' :
             summary?.auditReadiness > 60 ? 'Moderate risk. Prioritize high-severity findings.' :
             'High risk of audit findings. Immediate remediation recommended.'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
