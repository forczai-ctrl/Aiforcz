import React from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  useTheme, Avatar, Chip
} from '@mui/material';
import {
  Dashboard, ChangeCircle, Settings, Warning,
  Psychology, Rule, Menu as MenuIcon, Security,
  TrendingUp, BugReport, SmartToy
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Executive Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Access Management', icon: <Security />, path: '/access' },
  { text: 'Change Management', icon: <ChangeCircle />, path: '/change' },
  { text: 'Configuration', icon: <Settings />, path: '/config' },
  { text: 'ITGC Findings', icon: <Warning />, path: '/findings' },
  { text: 'AI Insights', icon: <Psychology />, path: '/ai-insights' },
  { text: 'Audit Copilot', icon: <SmartToy />, path: '/copilot' },
  { text: 'ITGC Rules', icon: <Rule />, path: '/rules' },
];

export default function Layout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
          <Security />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            AIForcz
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ITGC Monitoring
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'rgba(124, 77, 255, 0.15)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.1)' },
                  color: isActive ? theme.palette.primary.light : 'text.secondary',
                }}
              >
                <ListItemIcon sx={{ color: isActive ? theme.palette.primary.light : 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Chip
          icon={<TrendingUp />}
          label="Audit Ready: 87%"
          color="success"
          size="small"
          variant="outlined"
          sx={{ width: '100%' }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.default',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            AIForcz Platform
          </Typography>
          <Chip
            icon={<BugReport />}
            label="POC Mode"
            color="warning"
            size="small"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: 'background.paper', borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
