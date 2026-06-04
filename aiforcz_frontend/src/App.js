import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AccessManagement from './pages/AccessManagement';
import ChangeManagement from './pages/ChangeManagement';
import ConfigurationDashboard from './pages/ConfigurationDashboard';
import FindingsPage from './pages/FindingsPage';
import AIInsights from './pages/AIInsights';
import ITGCRules from './pages/ITGCRules';
import AuditCopilot from './pages/AuditCopilot';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    secondary: {
      main: '#00e5ff',
    },
    background: {
      default: '#0a0e27',
      paper: '#111638',
    },
    success: {
      main: '#00e676',
    },
    warning: {
      main: '#ff9100',
    },
    error: {
      main: '#ff1744',
    },
    info: {
      main: '#00b0ff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #111638 0%, #1a2050 100%)',
          border: '1px solid rgba(124, 77, 255, 0.1)',
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ExecutiveDashboard />} />
            <Route path="/access" element={<AccessManagement />} />
            <Route path="/change" element={<ChangeManagement />} />
            <Route path="/config" element={<ConfigurationDashboard />} />
            <Route path="/findings" element={<FindingsPage />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/rules" element={<ITGCRules />} />
            <Route path="/copilot" element={<AuditCopilot />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
