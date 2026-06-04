import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, IconButton,
  CircularProgress, Chip, Avatar, Divider, Paper, Button,
  Alert, Grid
} from '@mui/material';
import {
  Send, SmartToy, Person, Refresh, History, Lightbulb,
  QuestionAnswer, CloudDownload
} from '@mui/icons-material';
import { askCopilot, getCopilotHistory, generatePDFReport } from '../api';

const SUGGESTED_QUESTIONS = [
  'Why is Audit Readiness low?',
  'Show dormant admin accounts',
  'What SOX findings are likely?',
  'Summarize access control weaknesses',
  'Show me the MFA compliance status',
  'What will the auditor likely flag?',
  'List all unauthorized changes',
  'Are there any public S3 buckets?',
];

export default function AuditCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getCopilotHistory();
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load copilot history:', err);
    }
  };

  const handleAsk = async (question) => {
    if (!question.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: question, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askCopilot(question);
      const botMsg = {
        role: 'assistant',
        content: res.data.answer,
        source: res.data.source,
        id: Date.now() + 1,
      };
      setMessages(prev => [...prev, botMsg]);
      loadHistory(); // Refresh history
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        source: 'error',
        id: Date.now() + 1,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk(input);
    }
  };

  const handlePDFDownload = async () => {
    setPdfLoading(true);
    try {
      const res = await generatePDFReport();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `itgc-audit-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to generate PDF report. Ensure backend server is running.');
    } finally {
      setPdfLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy sx={{ fontSize: 32, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4">Audit Copilot</Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered ITGC audit assistant - ask questions about your compliance posture
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={handlePDFDownload}
            disabled={pdfLoading}
            size="small"
          >
            {pdfLoading ? 'Generating...' : 'Export PDF Report'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setShowHistory(!showHistory)}
            size="small"
          >
            History
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={clearChat}
            size="small"
            color="warning"
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Chat Area */}
        <Grid item xs={12} md={showHistory ? 8 : 12}>
          <Card sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
            {/* Suggested Questions */}
            {messages.length === 0 && (
              <CardContent sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Lightbulb color="warning" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Try asking:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <Chip
                      key={i}
                      label={q}
                      size="small"
                      variant="outlined"
                      onClick={() => handleAsk(q)}
                      icon={<QuestionAnswer fontSize="small" />}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(124,77,255,0.08)' } }}
                    />
                  ))}
                </Box>
                <Divider sx={{ mb: 1 }} />
              </CardContent>
            )}

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                      <SmartToy fontSize="small" />
                    </Avatar>
                  )}

                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: '80%',
                      p: 2,
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'rgba(124,77,255,0.08)',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(124,77,255,0.15)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', color: msg.role === 'user' ? 'white' : 'inherit' }}
                    >
                      {msg.content}
                    </Typography>
                    {msg.source && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                        Source: {msg.source}
                      </Typography>
                    )}
                  </Paper>

                  {msg.role === 'user' && (
                    <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
                      <Person fontSize="small" />
                    </Avatar>
                  )}
                </Box>
              ))}

              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    <SmartToy fontSize="small" />
                  </Avatar>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <CircularProgress size={12} />
                    <CircularProgress size={12} sx={{ animationDelay: '0.2s' }} />
                    <CircularProgress size={12} sx={{ animationDelay: '0.4s' }} />
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask the Audit Copilot a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 4,
                    }
                  }}
                />
                <IconButton
                  color="secondary"
                  onClick={() => handleAsk(input)}
                  disabled={loading || !input.trim()}
                  sx={{ bgcolor: 'rgba(124,77,255,0.1)', '&:hover': { bgcolor: 'rgba(124,77,255,0.2)' } }}
                >
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* History Panel */}
        {showHistory && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History fontSize="small" />
                  Conversation History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {history.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                    No previous conversations
                  </Typography>
                ) : (
                  history.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{ p: 1.5, mb: 1, cursor: 'pointer' }}
                      onClick={() => {
                        setMessages(prev => {
                          const exists = prev.find(m => m.id === `hist-${item.id}`);
                          if (exists) return prev;
                          return [...prev,
                            { role: 'user', content: item.question, id: `hist-${item.id}-q` },
                            { role: 'assistant', content: item.answer, id: `hist-${item.id}-a` }
                          ];
                        });
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.answer?.substring(0, 80)}...
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, opacity: 0.6 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </Typography>
                    </Paper>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}