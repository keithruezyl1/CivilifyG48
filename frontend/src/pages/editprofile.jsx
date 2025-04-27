import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: 'John Doe',
    email: 'john.doe@example.com',
    password: '',
    confirmPassword: '',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    // Prefer location.state, fallback to localStorage, else defaults
    if (location.state) {
      setFormData(prev => ({ ...prev, ...location.state }));
      if (location.state.avatar) setAvatarPreview(location.state.avatar);
    } else {
      const saved = localStorage.getItem('profileData');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
        if (parsed.avatar) setAvatarPreview(parsed.avatar);
      }
    }
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: null })); // We'll store base64
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save to localStorage
    const { password, confirmPassword, ...profileToSave } = formData;
    localStorage.setItem('profileData', JSON.stringify({
      ...profileToSave,
      avatar: avatarPreview || null,
    }));
    navigate('/profile');
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
      marginTop: '0.5rem',
    }
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <nav style={{ paddingTop: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, marginLeft: 0 }}>
            <li style={{ marginBottom: '1rem' }}>
              <button
                style={{ color: '#F34D01', fontWeight: 600, background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
                onClick={() => navigate('/profile')}
              >
                Profile
              </button>
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
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.avatar}>
            <input
              type="file"
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#999', fontSize: '24px' }}>+</span>
            )}
          </label>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              style={styles.input}
              autoFocus
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
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
          <button type="submit" className="orange-animated-btn" style={styles.button}>
            Save Changes
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;
