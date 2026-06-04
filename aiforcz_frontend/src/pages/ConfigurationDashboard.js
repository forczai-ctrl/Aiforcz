import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getConfigChanges, getConfigSummary } from '../api';

export default function ConfigurationDashboard() {
  const [configs, setConfigs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [c, s] = await Promise.all([getConfigChanges(), getConfigSummary()]);
      setConfigs(c.data);
      setSummary(s.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Configuration Dashboard</Typography>
        <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Changes</Typography>
            <Typography variant="h4">{summary?.totalChanges || 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Unauthorized</Typography>
            <Typography variant="h4" color="error.main">{summary?.unauthorized || 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Public Buckets</Typography>
            <Typography variant="h4" color="error.main">{summary?.publicBuckets || 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Open Security Groups</Typography>
            <Typography variant="h4" color="error.main">{summary?.openSecurityGroups || 0}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configuration Changes</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Approved</TableCell>
                  <TableCell>Violation</TableCell>
                  <TableCell>Severity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{config.resource_id}</Typography>
                    </TableCell>
                    <TableCell>{config.resource_type}</TableCell>
                    <TableCell>{config.change_type}</TableCell>
                    <TableCell>{config.changed_by}</TableCell>
                    <TableCell>
                      <Chip label={config.is_approved ? 'Yes' : 'No'} 
                        color={config.is_approved ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>
                      {config.violation_type ? (
                        <Chip label={config.violation_type} color="error" size="small" />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={config.severity} 
                        color={config.severity === 'CRITICAL' ? 'error' : 'warning'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
