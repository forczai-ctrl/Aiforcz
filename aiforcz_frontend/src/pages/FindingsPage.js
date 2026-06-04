import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tab, Tabs
} from '@mui/material';
import { Refresh, Visibility, Psychology, Warning } from '@mui/icons-material';
import { getFindings, analyzeFinding, updateFindingStatus } from '../api';

export default function FindingsPage() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getFindings({ limit: 100 });
      setFindings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleViewDetails = async (finding) => {
    setSelectedFinding(finding);
    setAnalysis(finding.ai_risk_analysis);
    setDialogOpen(true);
    setTabValue(0);
  };

  const handleRunAI = async () => {
    if (!selectedFinding) return;
    setAnalyzing(true);
    try {
      const res = await analyzeFinding(selectedFinding.id);
      setAnalysis(res.data);
      setSelectedFinding(prev => ({ ...prev, ai_risk_analysis: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateFindingStatus(id, status);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length;
  const highCount = findings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM' && f.status === 'OPEN').length;
  const resolvedCount = findings.filter(f => f.status === 'RESOLVED').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">ITGC Findings</Typography>
        <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Critical</Typography>
            <Typography variant="h4" color="error.main">{criticalCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">High</Typography>
            <Typography variant="h4" color="warning.main">{highCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Medium</Typography>
            <Typography variant="h4" color="info.main">{mediumCount}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Resolved</Typography>
            <Typography variant="h4" color="success.main">{resolvedCount}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>All Findings</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {findings.map((finding) => (
                  <TableRow key={finding.id} sx={{
                    bgcolor: finding.severity === 'CRITICAL' ? 'rgba(244,67,54,0.05)' : 'transparent'
                  }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{finding.rule_id}</Typography>
                      <Typography variant="caption" color="text.secondary">{finding.rule_name}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap>{finding.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={finding.severity} size="small"
                        color={finding.severity === 'CRITICAL' ? 'error' : 
                               finding.severity === 'HIGH' ? 'warning' : 
                               finding.severity === 'MEDIUM' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={finding.status} size="small"
                        color={finding.status === 'OPEN' ? 'error' : 
                               finding.status === 'IN_PROGRESS' ? 'warning' : 'success'} />
                    </TableCell>
                    <TableCell>{finding.source}</TableCell>
                    <TableCell>{finding.username || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewDetails(finding)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {finding.status === 'OPEN' && (
                        <Button size="small" onClick={() => handleStatusUpdate(finding.id, 'IN_PROGRESS')}>
                          Start
                        </Button>
                      )}
                      {finding.status === 'IN_PROGRESS' && (
                        <Button size="small" color="success" onClick={() => handleStatusUpdate(finding.id, 'RESOLVED')}>
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color={selectedFinding?.severity === 'CRITICAL' ? 'error' : 'warning'} />
            {selectedFinding?.rule_id} - {selectedFinding?.rule_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Details" />
            <Tab label="AI Risk Analysis" icon={<Psychology />} iconPosition="start" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <Typography variant="body2" gutterBottom><strong>Description:</strong> {selectedFinding?.description}</Typography>
              <Typography variant="body2" gutterBottom><strong>Control:</strong> {selectedFinding?.control_id} - {selectedFinding?.control_name}</Typography>
              <Typography variant="body2" gutterBottom><strong>SOP Reference:</strong> {selectedFinding?.sop_reference}</Typography>
              <Typography variant="body2" gutterBottom><strong>Severity:</strong> {selectedFinding?.severity}</Typography>
              <Typography variant="body2" gutterBottom><strong>Status:</strong> {selectedFinding?.status}</Typography>
              <Typography variant="body2" gutterBottom><strong>Detected:</strong> {selectedFinding?.detected_at}</Typography>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {analysis ? (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Chip label={`Risk: ${analysis.risk}`} color={
                      analysis.risk === 'Critical' ? 'error' : 
                      analysis.risk === 'High' ? 'warning' : 'info'
                    } /></Grid>
                    <Grid item xs={6}><Chip label={`SOX Risk: ${analysis.soxRisk}`} color="warning" variant="outlined" /></Grid>
                  </Grid>
                  <Typography variant="body2" sx={{ mt: 2 }}><strong>Audit Impact:</strong></Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>{analysis.auditImpact}</Typography>
                  <Typography variant="body2"><strong>Business Impact:</strong></Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>{analysis.businessImpact}</Typography>
                  <Typography variant="body2"><strong>Root Cause:</strong></Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>{analysis.rootCause}</Typography>
                  <Typography variant="body2"><strong>Recommendation:</strong></Typography>
                  <Typography variant="body2" color="success.main" paragraph>{analysis.recommendation}</Typography>
                  {analysis.regulatoryReferences && (
                    <Box>
                      <Typography variant="body2"><strong>Regulatory References:</strong></Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {analysis.regulatoryReferences.map((ref, i) => (
                          <Chip key={i} label={ref} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" gutterBottom>Run AI analysis to get risk assessment</Typography>
                  <Button variant="contained" onClick={handleRunAI} disabled={analyzing}>
                    {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}