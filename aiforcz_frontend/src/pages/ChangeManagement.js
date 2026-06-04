import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getCloudTrailEvents } from '../api';

export default function ChangeManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCloudTrailEvents();
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const total = events.length;
  const approved = events.filter(e => e.has_approval).length;
  const unauthorized = events.filter(e => e.is_unauthorized).length;
  const emergency = events.filter(e => e.is_emergency).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Change Management Dashboard</Typography>
        <Button startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Total Changes</Typography>
            <Typography variant="h4">{total}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Approved</Typography>
            <Typography variant="h4" color="success.main">{approved}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Unauthorized</Typography>
            <Typography variant="h4" color="error.main">{unauthorized}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Emergency</Typography>
            <Typography variant="h4" color="warning.main">{emergency}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>CloudTrail Events</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Approval</TableCell>
                  <TableCell>Emergency</TableCell>
                  <TableCell>Ticket</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{event.event_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.event_time).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{event.username}</TableCell>
                    <TableCell>{event.resource_type}</TableCell>
                    <TableCell>
                      <Chip label={event.has_approval ? 'Approved' : 'Unauthorized'} 
                        color={event.has_approval ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={event.is_emergency ? 'Yes' : 'No'} 
                        color={event.is_emergency ? 'warning' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {event.ticket_number || <Chip label="No Ticket" color="warning" size="small" variant="outlined" />}
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
