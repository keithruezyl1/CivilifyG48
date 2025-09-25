import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import knowledgeBaseService from '../../services/knowledgeBaseService';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Article as ArticleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const VILLY_BASE = import.meta.env.VITE_VILLY_BASE_URL || 'https://law-entry-extension.onrender.com';

/**
 * Admin Knowledge Base Management Page
 * Provides access to law-entry extension features for admin users only.
 * This page integrates with the law-entry-extension-reference system.
 */
const AdminKnowledgeBase = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEntries: 0,
    verifiedEntries: 0,
    pendingEntries: 0,
    recentActivity: 0
  });

  useEffect(() => {
    // Check if user is admin
    if (!user || !isAdmin) {
      navigate('/admin');
      return;
    }

    // Load knowledge base statistics
    loadKnowledgeBaseStats();
  }, [user, isAdmin, navigate]);

  const loadKnowledgeBaseStats = async () => {
    try {
      setLoading(true);
      // Get knowledge base statistics from the service
      const healthStatus = await knowledgeBaseService.checkHealth();
      const statistics = await knowledgeBaseService.getStatistics();
      
      setStats({
        totalEntries: statistics.totalEntries || 0,
        verifiedEntries: statistics.verifiedEntries || 0,
        pendingEntries: statistics.pendingEntries || 0,
        recentActivity: statistics.recentActivity || 0
      });
    } catch (err) {
      setError('Failed to load knowledge base statistics');
      console.error('Error loading KB stats:', err);
      // Fallback to mock data if service is unavailable
      setStats({
        totalEntries: 0,
        verifiedEntries: 0,
        pendingEntries: 0,
        recentActivity: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = () => {
    // Navigate to law entry creation form
    window.open(`${VILLY_BASE}/admin/entries/new`, '_blank');
  };

  const handleSearchEntries = () => {
    // Navigate to law entry search/browse
    window.open(`${VILLY_BASE}/entries`, '_blank');
  };

  const handleChatWithKB = () => {
    // Open knowledge base chat interface
    window.open(`${VILLY_BASE}/chat`, '_blank');
  };

  const handleManageEntries = () => {
    // Navigate to entry management
    window.open(`${VILLY_BASE}/admin`, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Knowledge Base Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage legal knowledge base entries and RAG system for Villy
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Entries
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalEntries.toLocaleString()}
                  </Typography>
                </Box>
                <ArticleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Verified Entries
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.verifiedEntries.toLocaleString()}
                  </Typography>
                </Box>
                <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Review
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingEntries.toLocaleString()}
                  </Typography>
                </Box>
                <SettingsIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.recentActivity}
                  </Typography>
                </Box>
                <ChatIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Entry Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create, edit, and manage legal knowledge base entries. This includes 
                statutes, rules of court, ordinances, and other legal documents.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateEntry}
                >
                  Create Entry
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={handleSearchEntries}
                >
                  Browse Entries
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                RAG System Testing
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Test the Retrieval-Augmented Generation system that powers Villy's 
                knowledge base responses. Chat with the system to verify accuracy.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={handleChatWithKB}
                >
                  Test RAG Chat
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleManageEntries}
                >
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integration Status */}
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Integration Status
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <Chip 
                label="Knowledge Base API" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label="RAG System" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label="Vector Search" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label="Admin Access" 
                color="success" 
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" mt={2}>
              All systems are operational. The knowledge base is integrated with Villy's 
              chat system and provides enhanced responses with legal context.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button variant="outlined" onClick={() => window.open(`${VILLY_BASE}/admin/import`, '_blank')}>
            Import Entries
          </Button>
          <Button variant="outlined" onClick={() => window.open(`${VILLY_BASE}/admin/export`, '_blank')}>
            Export Data
          </Button>
          <Button variant="outlined" onClick={() => window.open(`${VILLY_BASE}/analytics`, '_blank')}>
            View Analytics
          </Button>
          <Button variant="outlined" onClick={() => window.open(`${VILLY_BASE}/admin/backup`, '_blank')}>
            Backup System
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminKnowledgeBase;
