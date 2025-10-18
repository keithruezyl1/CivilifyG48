import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, getAuthToken, clearAuthData } from '../utils/auth';
import { Box, Typography, Button, Card, CardContent, Grid, Alert, CircularProgress, Chip, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';
import { Refresh as RefreshIcon, AdminPanelSettings as AdminIcon, Delete as DeleteIcon, ArrowUpward as PromoteIcon, ArrowDownward as DemoteIcon, Settings as SettingsIcon, Logout as LogoutIcon } from '@mui/icons-material';

const SystemAdminPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionBusy, setActionBusy] = useState(null);
  const token = useMemo(() => getAuthToken(), []);

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  const handleLogout = () => {
    try { clearAuthData(); } catch {}
    navigate('/signin');
  };

  const roleChip = (role) => {
    const r = role || 'ROLE_USER';
    const color = r === 'ROLE_SYSTEM_ADMIN' ? 'secondary' : (r === 'ROLE_ADMIN' ? 'primary' : 'default');
    const label = r.replace('ROLE_', '');
    return <Chip size="small" color={color} variant={color === 'default' ? 'outlined' : 'filled'} label={label} />;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      if (!res.ok) throw new Error('Failed to load users');
      const body = await res.json();
      const list = Array.isArray(body?.data) ? body.data : [];
      // Hide all SYSTEM_ADMINs and optionally hide self
      const filtered = list.filter(u => (u.role || 'ROLE_USER') !== 'ROLE_SYSTEM_ADMIN');
      setUsers(filtered);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId, nextRole) => {
    try {
      setActionBusy(userId + ':' + nextRole);
      const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: nextRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      await fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to update role');
    } finally {
      setActionBusy(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      setActionBusy(userId + ':DELETE');
      const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to delete user');
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            System Administration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage platform roles and users.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button onClick={fetchUsers} startIcon={<RefreshIcon />} variant="outlined">Refresh</Button>
          <Button onClick={() => navigate('/admin')} startIcon={<AdminIcon />} variant="outlined">Go to Admin</Button>
          <Button onClick={handleLogout} startIcon={<LogoutIcon />} color="error" variant="outlined">Logout</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Users</Typography>
                <Chip label="SYSTEM_ADMIN hidden from list" size="small" color="info" variant="outlined" />
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
              ) : users.length === 0 ? (
                <Box p={2} color="text.secondary">No users found.</Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User ID</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => {
                        const role = u.role || 'ROLE_USER';
                        const isBusyPromote = actionBusy === (u.userId + ':ROLE_ADMIN');
                        const isBusyDemote = actionBusy === (u.userId + ':ROLE_USER');
                        const isBusyDelete = actionBusy === (u.userId + ':DELETE');
                        return (
                          <TableRow key={u.userId || u.email}>
                            <TableCell>{u.userId || '-'}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.username || '-'}</TableCell>
                            <TableCell>{roleChip(role)}</TableCell>
                            <TableCell align="right">
                              <Box display="flex" gap={1} justifyContent="flex-end">
                                {role !== 'ROLE_ADMIN' && (
                                  <Button size="small" variant="contained" startIcon={<PromoteIcon />} disabled={isBusyPromote} onClick={() => updateRole(u.userId, 'ROLE_ADMIN')}>Promote</Button>
                                )}
                                {role !== 'ROLE_USER' && (
                                  <Button size="small" color="warning" variant="contained" startIcon={<DemoteIcon />} disabled={isBusyDemote} onClick={() => updateRole(u.userId, 'ROLE_USER')}>Demote</Button>
                                )}
                                <Button size="small" color="error" variant="contained" startIcon={<DeleteIcon />} disabled={isBusyDelete} onClick={() => deleteUser(u.userId)}>Delete</Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">System Settings</Typography>
                <SettingsIcon color="action" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                RBAC is active. Hierarchy: SYSTEM_ADMIN &gt; ADMIN &gt; USER.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemAdminPage;


