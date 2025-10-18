import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/auth';
import { API_URL } from '../utils/auth';
import ProfileAvatar from '../components/ProfileAvatar';
import { Box, Typography, Button, Card, CardContent, Grid, Alert, CircularProgress, Chip, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon, Logout as LogoutIcon, ManageSearch as ManageSearchIcon, Edit as EditIcon } from '@mui/icons-material';

const Admin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: <div style={{ backgroundColor: '#F34D01', width: '48px', height: '48px', borderRadius: '50%' }} />
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutYesHovered, setLogoutYesHovered] = useState(false);
  const [logoutNoHovered, setLogoutNoHovered] = useState(false);

  // Fetch current admin user details
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SYSTEM_ADMIN') {
      navigate('/');
      return;
    }
    
    const formattedUserData = {
      username: user.username,
      email: user.email,
      profile_picture_url: user.profilePictureUrl || user.profile_picture_url
    };
    
    setUserData({
      name: user.username || 'Admin User',
      email: user.email || 'admin@example.com',
      avatar: <ProfileAvatar size="medium" userData={formattedUserData} />
    });
  }, [navigate]);

  // Fetch all users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  useEffect(() => {
    document.title = 'Civilify | Admin';
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.result === 'SUCCESS') {
        setUsers(data.data || []);
        setFilteredUsers(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setSelectedUser(userId);
    setConfirmDelete(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/admin/users/${selectedUser}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.result === 'SUCCESS') {
        setUsers(users.filter(user => user.userId !== selectedUser));
        setFilteredUsers(filteredUsers.filter(user => user.userId !== selectedUser));
        setConfirmDelete(false);
        setSelectedUser(null);
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
    setSelectedUser(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      clearAuthData();
      navigate('/signin');
    }
    setShowLogoutConfirm(false);
  };

  // Hide SYSTEM_ADMIN from list in UI
  const displayedUsers = (filteredUsers || []).filter(u => (u.role || 'ROLE_USER') !== 'ROLE_SYSTEM_ADMIN');

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          {userData.avatar}
          <Box>
            <Typography variant="h6">{userData.name}</Typography>
            <Typography variant="body2" color="text.secondary">{userData.email}</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { localStorage.setItem('forceLightMode','true'); navigate('/edit-profile'); }}>Edit Profile</Button>
          <Button variant="outlined" startIcon={<ManageSearchIcon />} onClick={() => navigate('/admin/knowledge-base')}>Knowledge Base</Button>
          <Button variant="contained" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">User Management</Typography>
            <TextField
              size="small"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )}}
            />
          </Box>

          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Chip size="small" label={(user.role || 'ROLE_USER').replace('ROLE_', '')} color={user.role === 'ROLE_ADMIN' ? 'primary' : 'default'} variant={user.role === 'ROLE_ADMIN' ? 'filled' : 'outlined'} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" variant="contained" startIcon={<DeleteIcon />} onClick={() => handleDeleteUser(user.userId)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onClose={cancelDelete}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          You are deleting {users.find(u => u.userId === selectedUser)?.username || 'this user'}. This action is irreversible.
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showLogoutConfirm} onClose={() => handleLogoutConfirm(false)}>
        <DialogTitle>Logout</DialogTitle>
        <DialogContent>Are you sure you want to logout?</DialogContent>
        <DialogActions>
          <Button onClick={() => handleLogoutConfirm(false)}>Cancel</Button>
          <Button onClick={() => handleLogoutConfirm(true)} color="error" variant="contained" startIcon={<LogoutIcon />}>Logout</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F7F7F9',
    padding: '0',
    width: '100vw',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'auto',
    marginTop: '-16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px 40px 24px 40px',
    backgroundColor: '#ffffff',
    borderRadius: '0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    marginBottom: '0',
    width: '100%',
    boxSizing: 'border-box',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  name: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  email: {
    fontSize: '14px',
    color: '#666666',
    margin: '4px 0 0 0',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
  },
  editProfileButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  content: {
    backgroundColor: '#ffffff',
    padding: '32px 40px',
    borderRadius: '0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    width: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  titleSection: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '24px',
    width: '100%',
    gap: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
    flex: 'none',
    minWidth: 0,
    textAlign: 'left',
  },
  searchContainer: {
    position: 'relative',
    width: '320px',
    minWidth: '220px',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666666',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorMessage: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '100%',
  },
  retryButton: {
    backgroundColor: '#B91C1C',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    width: '100%',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #F34D01',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#666666',
    fontSize: '14px',
  },
  userList: {
    width: '100%',
    overflowX: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
    boxSizing: 'border-box',
    tableLayout: 'fixed',
    maxWidth: '100%',
  },
  tableHeader: {
    textAlign: 'center',
    padding: '12px 16px',
    backgroundColor: '#F7F7F9',
    color: '#666666',
    fontSize: '14px',
    fontWeight: '500',
    boxSizing: 'border-box',
    width: '25%',
  },
  tableRow: {
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#1a1a1a',
    maxWidth: '1px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxSizing: 'border-box',
    width: '25%',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1a1a1a',
  },
  modalText: {
    marginBottom: '24px',
    color: '#666666',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
};

// Add CSS for animations and hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .primary-button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .secondary-button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .danger-button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }
  
  .searchInput:focus {
    border-color: #F34D01;
    box-shadow: 0 0 0 2px rgba(243, 77, 1, 0.1);
  }
  
  .tableRow:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;
document.head.appendChild(styleSheet);

// Add CSS to disable horizontal scroll wheel
if (!document.getElementById('admin-no-horizontal-scroll-style')) {
  const style = document.createElement('style');
  style.id = 'admin-no-horizontal-scroll-style';
  style.textContent = `
    html, body, #root {
      overscroll-behavior-x: none !important;
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }
    body {
      width: 100vw !important;
    }
    ::-webkit-scrollbar:horizontal {
      display: none !important;
      height: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

export default Admin; 