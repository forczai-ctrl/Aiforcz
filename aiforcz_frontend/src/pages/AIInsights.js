import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, LinearProgress, Divider, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Psychology, Assessment, Warning, CheckCircle, Refresh,
  EventNote, Rule
} from '@mui/icons-material';
import { getAuditPrediction, getRemediationPlan } from '../api';

export default function AIInsights() {
  const [prediction, setPrediction] = useState(null);
  const [remediation, setRemediation] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, r] = await Promise.all([
        getAuditPrediction(),
        getRemediationPlan()
      ]);
      setPrediction(p.data);
      setRemediation(r.data);
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
        <Typography variant="h4">AI Insights & Audit Prediction</Typography>
        <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      {/* Audit Prediction */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assessment color="primary" />
                <Typography variant="h6">Audit Readiness Prediction</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={prediction?.auditReadiness || 0}
                    sx={{ 
                      height: 16, borderRadius: 8,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 8,
                        background: `linear-gradient(90deg, #f44336, #ff9800, ${prediction?.auditReadiness > 70 ? '#4caf50' : '#ff9800'})`
                      }
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right' }}>
                  {prediction?.auditReadiness || 0}%
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Predicted Findings</Typography>
                  <Typography variant="h5" color="error.main">{prediction?.predictedFindings || 0}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Critical Issues</Typography>
                  <Typography variant="h5" color="error.main">{prediction?.criticalIssues || 0}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Overall Risk</Typography>
                  <Chip 
                    label={prediction?.overallRisk || 'Unknown'} 
                    color={prediction?.overallRisk === 'High' ? 'error' : 
                           prediction?.overallRisk === 'Medium' ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                <strong>Recommendation:</strong> {prediction?.recommendation}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Psychology color="secondary" />
                <Typography variant="h6">AI Risk Engine</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Rule-based analysis active" secondary="Pre-configured risk patterns" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Warning color="warning" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="OpenAI integration ready" secondary="Set OPENAI_API_KEY for GPT-4o" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Rule color="info" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="12 ITGC rules monitored" secondary="AC, CM, CF controls" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Remediation Plan */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EventNote color="warning" />
            <Typography variant="h6">AI-Powered Remediation Plan</Typography>
          </Box>
          
          {remediation.length === 0 ? (
            <Typography color="text.secondary">No remediations needed. All issues resolved.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Finding</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Recommendation</TableCell>
                    <TableCell>Target</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {remediation.map((item) => (
                    <TableRow key={item.priority}>
                      <TableCell>
                        <Chip 
                          label={`#${item.priority}`}
                          color={item.priority <= 3 ? 'error' : item.priority <= 6 ? 'warning' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.finding}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.severity} size="small"
                          color={item.severity === 'CRITICAL' ? 'error' : 'warning'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.risk} size="small" variant="outlined"
                          color={item.risk === 'Critical' ? 'error' : 
                                 item.risk === 'High' ? 'warning' : 'info'} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2">{item.recommendation}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.targetDate} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
