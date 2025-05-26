import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/auth';
import { API_URL } from '../utils/auth';
import ProfileAvatar from '../components/ProfileAvatar';
import { FaSearch, FaEdit, FaSignOutAlt, FaTrash, FaUser } from 'react-icons/fa';

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
    
    if (user.role !== 'ROLE_ADMIN') {
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
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
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
            onClick={() => {
              localStorage.setItem('forceLightMode', 'true');
              navigate('/edit-profile');
            }}
            style={styles.editProfileButton}
            className="primary-button-hover"
          >
            <FaUser style={{ marginRight: '8px' }} />
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            className="primary-button-hover"
          >
            <FaSignOutAlt style={{ marginRight: '8px' }} />
            Logout
          </button>
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>User Management</h1>
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
        
        {error && (
          <div style={styles.errorMessage}>
            <span>Error: {error}</span>
            <button 
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
              style={styles.retryButton}
              className="primary-button-hover"
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading users...</p>
          </div>
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
                {filteredUsers.map(user => (
                  <tr key={user.userId} style={styles.tableRow}>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>{user.username}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: user.role === 'ROLE_ADMIN' ? '#F34D01' : '#4CAF50',
                        color: '#fff',
                      }}>
                        {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <button
                        onClick={() => handleDeleteUser(user.userId)}
                        style={styles.deleteButton}
                        className="danger-button-hover"
                      >
                        <FaTrash style={{ marginRight: '6px' }} />
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
            <h2 style={styles.modalTitle}>
              You are deleting {users.find(u => u.userId === selectedUser)?.username || 'this user'}
            </h2>
            <p style={styles.modalText}>
              They will not be able to retrieve this account, including their previous session. Continue?
            </p>
            <div style={styles.modalButtons}>
              <button 
                onClick={confirmDeleteUser}
                style={{
                  ...styles.confirmButton,
                  backgroundColor: '#fff',
                  color: '#F34D01',
                  border: '2px solid #F34D01',
                  fontWeight: 600,
                  transition: 'background 0.2s, color 0.2s, border 0.2s',
                }}
                className="primary-button-hover"
              >
                Confirm
              </button>
              <button 
                onClick={cancelDelete}
                style={{
                  ...styles.cancelButton,
                  backgroundColor: '#F34D01',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  transition: 'background 0.2s, color 0.2s, border 0.2s',
                }}
                className="primary-button-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: '16px',
            padding: '32px 32px 24px 32px',
            maxWidth: 400,
            width: '90vw',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Logout</h2>
            <div style={{ fontSize: 16, color: '#444', marginBottom: 24 }}>
              Are you sure you want to logout?
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                style={{
                  background: logoutYesHovered ? '#e04000' : '#F34D01',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.1s',
                  transform: logoutYesHovered ? 'translateY(0px) scale(0.98)' : undefined,
                }}
                onClick={() => handleLogoutConfirm(true)}
                onMouseEnter={() => setLogoutYesHovered(true)}
                onMouseLeave={() => setLogoutYesHovered(false)}
              >
                Yes, Logout
              </button>
              <button
                style={{
                  background: logoutNoHovered ? '#f2f2f2' : '#fff',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  fontSize: 16,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s, transform 0.1s',
                  transform: logoutNoHovered ? 'translateY(0px) scale(0.98)' : undefined,
                }}
                onClick={() => handleLogoutConfirm(false)}
                onMouseEnter={() => setLogoutNoHovered(true)}
                onMouseLeave={() => setLogoutNoHovered(false)}
              >
                Cancel
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