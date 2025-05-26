import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/auth';

const Admin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatar: <div style={{ backgroundColor: '#F34D01', width: '48px', height: '48px', borderRadius: '50%' }} />
  });

  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData({
      name: user.name || 'Admin User',
      email: user.email || 'admin@example.com',
      avatar: user.profilePicture ? (
        <img 
          src={user.profilePicture} 
          alt="Admin Avatar" 
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ backgroundColor: '#F34D01', width: '48px', height: '48px', borderRadius: '50%' }} />
      )
    });
  }, []);

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
        <button 
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>
      </div>
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
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
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