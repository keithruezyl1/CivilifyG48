import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileAvatar from '../components/ProfileAvatar';
import { getUserData, updateUserProfile, uploadProfilePicture } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user data when component mounts
    const loadUserData = async () => {
      try {
        // Prefer location.state, fallback to localStorage
        if (location.state) {
          setFormData(prev => ({ 
            ...prev, 
            username: location.state.username || '',
            email: location.state.email || '',
          }));
          if (location.state.profile_picture_url) {
            setAvatarPreview(location.state.profile_picture_url);
          }
        } else {
          const userData = getUserData();
          if (userData) {
            setFormData(prev => ({ 
              ...prev, 
              username: userData.username || '',
              email: userData.email || '',
            }));
            if (userData.profile_picture_url) {
              setAvatarPreview(userData.profile_picture_url);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      }
    };

    loadUserData();

    // Disable scrollbars for the whole page
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      try {
        setIsLoading(true);
        // Upload to Cloudinary via backend
        const profilePictureUrl = await uploadProfilePicture(file);
        toast.success('Profile picture uploaded successfully');
        setAvatarPreview(profilePictureUrl);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to upload profile picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare data for update
      const updateData = {
        username: formData.username,
        email: formData.email,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Update user profile
      await updateUserProfile(updateData);
      
      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add animated orange button style
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
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
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
      marginBottom: '2rem',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
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
      fontWeight: '500',
      fontSize: '1rem',
      marginBottom: '0.25rem',
      color: '#000',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #e5e7eb',
      fontSize: '1rem',
      background: '#fff',
    },
    button: {
      width: '100%',
      marginTop: '1rem',
    },
    uploadOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.2s ease',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      '&:hover': {
        opacity: 1,
      },
    },
    fileInput: {
      display: 'none',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
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
          <a href="#" style={{ color: '#F34D01' }} onClick={e => { e.preventDefault(); navigate('/profile'); }}>Back</a>
        </div>
      </aside>
      <main style={styles.content}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.avatar}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ProfileAvatar size="large" />
            )}
            <label htmlFor="avatar-upload" style={{
              ...styles.uploadOverlay,
              opacity: 0.7,
            }}>
              Change Photo
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={styles.fileInput}
              disabled={isLoading}
            />
            {isLoading && (
              <div style={styles.loadingOverlay}>
                <span>Uploading...</span>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Your username"
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Your email"
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Password (optional)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Leave blank to keep current"
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Confirm new password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="orange-animated-btn"
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;
