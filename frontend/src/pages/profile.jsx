import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar';
import { getUserData, fetchUserProfile, clearAuthData } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    profile_picture_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user profile data from backend
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        // Try to fetch fresh data from the backend
        const userData = await fetchUserProfile();
        
        if (userData) {
          // Successfully fetched profile from API
          setProfile({
            username: userData.username || '',
            email: userData.email || '',
            profile_picture_url: userData.profile_picture_url || null,
          });
        } else {
          // No userData means authentication failed
          console.error('Authentication failed, redirecting to signin');
          toast.error('Please sign in to view your profile');
          // Redirect to signin after a short delay
          setTimeout(() => navigate('/#/signin'), 1500);
          return; // Exit early
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        
        // Check if this is an authentication error (401/403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error('Authentication failed. Please sign in again.');
          // Clear all auth data
          clearAuthData();
          // Redirect to signin after a short delay
          setTimeout(() => navigate('/#/signin'), 1500);
        } else {
          toast.error('Failed to load profile data');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
    
    // Add animated orange button style and disable scrollbars
    const style = document.createElement('style');
    style.textContent = `
      .orange-animated-btn {
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        background-color: #F34D01;
        color: white;
        border-radius: 30px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset;
        display: inline-block;
        position: relative;
      }
      .orange-animated-btn:hover {
        transform: translateY(-2px);
        background: linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01);
        background-size: 200% auto;
        animation: buttonShine 1.5s linear infinite;
        box-shadow: 0 6px 15px rgba(243, 77, 1, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.3) inset;
      }
      .orange-animated-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 5px rgba(243, 77, 1, 0.2), 1px 1px 1px rgba(255, 255, 255, 0.3) inset;
      }
      @keyframes buttonShine {
        0% { background-position: -100% center; }
        100% { background-position: 200% center; }
      }
      ::-webkit-scrollbar { display: none; }
      main, html, body { scrollbar-width: none; -ms-overflow-style: none; }
      button:focus, a:focus { outline: none !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  const styles = {
    page: {
      maxWidth: 'none',
      margin: 0,
      padding: 0,
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      width: '100%',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#FAFAF9',
      color: 'black',
    },
    sidebar: {
      position: 'fixed',
      height: '100vh',
      width: '18rem',
      overflowY: 'auto',
      overflowX: 'hidden',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: 'white',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      padding: '1.5rem 1rem 0 1rem',
    },
    content: {
      marginLeft: '18rem',
      width: 'calc(100% - 18rem)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '2.5rem', // Move UI up
      background: 'transparent',
      overflow: 'hidden',
    },
    avatar: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      backgroundColor: '#e5e7eb',
      marginBottom: '1.5rem',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: {
      width: '100%',
      maxWidth: '350px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    },
    formGroup: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.25rem',
    },
    label: {
      color: '#000',
      fontWeight: '500',
      fontSize: '1rem',
      marginBottom: '0.25rem',
    },
    text: {
      fontSize: '1.125rem',
      color: '#000',
      fontWeight: 400,
      marginBottom: 0,
    },
    button: {
      width: '100%',
      marginTop: '0.5rem',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    },
  };

  return (
    <div style={styles.page}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <aside style={styles.sidebar}>
        <nav style={{ paddingTop: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, marginLeft: 0 }}>
            <li style={{ marginBottom: '1rem' }}>
              <button style={{ color: '#F34D01', fontWeight: 600, background: 'none', border: 'none', fontSize: '1rem' }}>Profile</button>
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <button style={{ color: '#4B5563', background: 'none', border: 'none', fontSize: '1rem' }}>Settings</button>
            </li>
          </ul>
        </nav>
        <div style={{ position: 'absolute', bottom: '2rem', width: '100%', padding: '0.75rem', borderTop: '1px solid #f1f1f1', backgroundColor: 'white', color: '#F34D01' }}>
          <a href="#" style={{ color: '#F34D01' }} onClick={e => { e.preventDefault(); navigate('/chat'); }}>Back</a>
        </div>
      </aside>
      <main style={styles.content}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <p>Loading profile data...</p>
          </div>
        ) : (
          <div style={styles.form}>
            <div style={styles.avatar}>
              {profile.profile_picture_url ? (
                <img 
                  src={profile.profile_picture_url} 
                  alt={profile.username} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    // Show ProfileAvatar as fallback
                    const avatarContainer = e.target.parentNode;
                    if (avatarContainer) {
                      const avatar = document.createElement('div');
                      avatar.style.width = '100%';
                      avatar.style.height = '100%';
                      avatar.style.display = 'flex';
                      avatar.style.alignItems = 'center';
                      avatar.style.justifyContent = 'center';
                      avatarContainer.appendChild(avatar);
                      // We can't render React components directly here, so we'll show a placeholder
                      avatar.innerHTML = profile.username.substring(0, 2).toUpperCase();
                    }
                  }}
                />
              ) : (
                <ProfileAvatar size="large" />
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.text}>{profile.username}</div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.text}>{profile.email}</div>
            </div>
            <button
              type="button"
              className="orange-animated-btn"
              style={styles.button}
              onClick={() => navigate('/edit-profile', { state: profile })}
            >
              Edit Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
