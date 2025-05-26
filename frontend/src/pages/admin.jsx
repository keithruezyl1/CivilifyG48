import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/auth';
import { API_URL } from '../utils/auth';
import ProfileAvatar from '../components/ProfileAvatar';

const Admin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: <div style={{ backgroundColor: '#F34D01', width: '48px', height: '48px', borderRadius: '50%' }} />
  });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch current admin user details
  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if user has admin role, if not redirect to home
    if (user.role !== 'ROLE_ADMIN') {
      navigate('/');
      return;
    }
    
    // Create userData object with expected property names for ProfileAvatar
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

  // Role management functionality has been removed per client request

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
        // Remove the deleted user from the list
        setUsers(users.filter(user => user.userId !== selectedUser));
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
    clearAuthData();
    navigate('/signin');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.userInfo}>
          {userData.avatar}
          <div style={styles.userDetails}>
            <h2 style={styles.name}>{userData.name}</h2>
            <p style={styles.email}>{userData.email}</p>
          </div>
        </div>
        <div style={styles.headerButtons}>
          <button 
            onClick={() => navigate('/edit-profile')}
            style={styles.editProfileButton}
          >
            Edit Profile
          </button>
          <button 
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        <h1 style={styles.title}>User Management</h1>
        
        {error && (
          <div style={styles.errorMessage}>
            Error: {error}
            <button 
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div style={styles.loadingMessage}>Loading users...</div>
        ) : (
          <div style={styles.userList}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Email</th>
                  <th style={styles.tableHeader}>Username</th>
                  <th style={styles.tableHeader}>Role</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.userId} style={styles.tableRow}>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>{user.username}</td>
                    <td style={styles.tableCell}>
                      {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                    </td>
                    <td style={styles.tableCell}>
                      <button
                        onClick={() => handleDeleteUser(user.userId)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {confirmDelete && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Confirm Deletion</h2>
            <p style={styles.modalText}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button 
                onClick={cancelDelete}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteUser}
                style={styles.confirmButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
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
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  errorMessage: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#B91C1C',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
  },
  loadingMessage: {
    padding: '20px',
    color: '#666666',
    textAlign: 'center',
  },
  userList: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#F3F4F6',
    borderBottom: '1px solid #E5E7EB',
  },
  tableRow: {
    borderBottom: '1px solid #E5E7EB',
  },
  tableCell: {
    padding: '12px',
  },
  selectRole: {
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '100%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  modalText: {
    marginBottom: '24px',
    color: '#4B5563',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#D93D00',
    },
  },
};

export default Admin; 