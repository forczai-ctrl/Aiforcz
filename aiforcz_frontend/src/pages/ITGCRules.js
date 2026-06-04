import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getITGCRules } from '../api';

export default function ITGCRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getITGCRules();
      setRules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const categories = [...new Set(rules.map(r => r.category))];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">ITGC Rules & Controls Library</Typography>
        <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      {/* Summary by Category */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {categories.map(cat => {
          const catRules = rules.filter(r => r.category === cat);
          const critical = catRules.filter(r => r.severity === 'CRITICAL').length;
          const high = catRules.filter(r => r.severity === 'HIGH').length;
          return (
            <Grid item xs={12} sm={4} key={cat}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{cat} Controls</Typography>
                  <Typography variant="h4">{catRules.length}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {critical > 0 && <Chip label={`${critical} Critical`} color="error" size="small" />}
                    {high > 0 && <Chip label={`${high} High`} color="warning" size="small" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Rules Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>ITGC Rules Library</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Control</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>SOP Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.rule_id}>
                    <TableCell>
                      <Chip label={rule.rule_id} color="primary" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{rule.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.category} size="small"
                        color={rule.category === 'ACCESS' ? 'info' : 
                               rule.category === 'CHANGE' ? 'warning' : 'secondary'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {rule.control_id} - {rule.control_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.severity} size="small"
                        color={rule.severity === 'CRITICAL' ? 'error' : 
                               rule.severity === 'HIGH' ? 'warning' : 'info'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={rule.sop} size="small" variant="outlined" />
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
