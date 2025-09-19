import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoIconOrange from '../assets/images/logoiconorange.png';
import { API_URL } from '../utils/auth';
import LoadingScreen from './LoadingScreen';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    profilePicture: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Example toast functions for future use
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: '12px',
        background: '#4CAF50',
        color: '#ffffff',
      },
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: '12px',
        background: '#F44336',
        color: '#ffffff',
      },
    });
  };

  const showInfoToast = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: '12px',
        background: '#2196F3',
        color: '#ffffff',
      },
    });
  };

  const showWarningToast = (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: '12px',
        background: '#FF9800',
        color: '#ffffff',
      },
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevState => ({
        ...prevState,
        profilePicture: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleChatRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/chat');
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Passwords do not match');
      setIsLoading(false);
      return;
    }
  
    // Validate terms agreement
    if (!formData.agreeToTerms) {
      showErrorToast('You must agree to the terms and conditions');
      setIsLoading(false);
      return;
    }
  
    try {
      // Prepare form data
      const data = new FormData();
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('username', formData.username);
      
      // Only append profile picture if it exists
      if (formData.profilePicture) {
        data.append('profilePicture', formData.profilePicture);
      }
  
      // Send request to backend
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
        }
      }).catch(err => {
        showErrorToast('Server is not responding');
        throw err;
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account');
      }
      
      // Get the response data
      let userData = null;
      try {
        userData = await response.json();
        console.log('Signup response data:', userData);
        
        // Save authentication token if available
        if (userData && userData.token) {
          localStorage.setItem('authToken', userData.token);
          console.log('Saved auth token to localStorage');
        }
        
        // Save user data to localStorage
        if (userData && userData.user) {
          // If the backend returns a user object, use it
          localStorage.setItem('user', JSON.stringify(userData.user));
          console.log('Saved user data from backend to localStorage:', userData.user);
        } else if (userData) {
          // If the backend returns user data directly
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Saved user data from backend to localStorage:', userData);
        } else {
          // Fallback to creating user data from form
          const userToSave = {
            username: formData.username,
            email: formData.email,
            profile_picture_url: previewUrl // Use the preview URL from the file input
          };
          localStorage.setItem('user', JSON.stringify(userToSave));
          console.log('Saved fallback user data to localStorage:', userToSave);
        }
      } catch (jsonError) {
        console.log('Response is not JSON or already consumed');
        // Create basic user data from form
        const userToSave = {
          username: formData.username,
          email: formData.email,
          profile_picture_url: previewUrl
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
        console.log('Saved basic user data to localStorage:', userToSave);
      }
      
      // Automatically log in after successful registration to get the authentication token
      try {
        const loginResponse = await fetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'email': formData.email,
            'password': formData.password
          })
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          
          // Save the authentication token
          if (loginData && loginData.token) {
            localStorage.setItem('authToken', loginData.token);
            console.log('Saved auth token from login to localStorage');
          }
          
          // Update user data with more complete information from login
          if (loginData && loginData.user) {
            localStorage.setItem('user', JSON.stringify(loginData.user));
            console.log('Updated user data from login:', loginData.user);
          }
        } else {
          console.warn('Auto-login after registration failed, but registration was successful');
        }
      } catch (loginError) {
        console.error('Error during auto-login after registration:', loginError);
        // Continue even if auto-login fails, since registration was successful
      }
      
      showSuccessToast('Account created successfully!');
      handleChatRedirect();
    } catch (err) {
      console.error('Registration error:', err);
      showErrorToast(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // No Google sign-in functionality as requested
  useEffect(() => {
    document.title = 'Civilify | Sign Up';
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      padding: '0',
      margin: '0',
      overflow: 'hidden', // Prevent scrolling and hide scrollbars
      position: 'fixed', // Fix the container to the viewport
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    signupContainer: {
      width: '100%',
      maxWidth: '520px',
      padding: '32px 32px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      textAlign: 'center',
      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.08)',
      margin: 'auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    formContent: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
      padding: '0',
      backgroundColor: '#ffffff',
      position: 'relative',
      boxSizing: 'border-box',
    },
    logo: {
      width: '48px',
      height: '48px',
      marginBottom: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '2px',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: '14px',
      color: '#666666',
      marginBottom: '12px',
      textAlign: 'center',
    },
    profilePictureContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '0',
    },
    profilePictureWrapper: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '2px solid rgba(0, 0, 0, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    },
    profilePicture: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    profilePicturePlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    },
    fileInput: {
      display: 'none',
    },
    fileInputLabel: {
      fontSize: '13px',
      color: '#F34D01',
      cursor: 'pointer',
      textDecoration: 'none',
      fontWeight: '500',
    },
    form: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      marginBottom: '0',
      alignItems: 'center',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      gap: '14px',
      width: '100%',
      justifyContent: 'center',
    },
    inputGroup: {
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: 1,
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#1a1a1a',
      marginBottom: '4px',
      textAlign: 'left',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '6px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      backgroundColor: '#ffffff',
      textAlign: 'left',
      boxSizing: 'border-box',
    },
    passwordWrapper: {
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    eyeIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      padding: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    termsContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '2px',
      width: '100%',
      marginBottom: '0',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    checkbox: {
      margin: '0',
      width: '16px',
      height: '16px',
      position: 'relative',
      top: '0',
    },
    checkboxText: {
      fontSize: '12px',
      color: '#666666',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    termsLink: {
      color: '#F34D01',
      textDecoration: 'none',
      fontWeight: '500',
    },
    submitButton: {
      width: '100%',
      padding: '10px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#fff',
      backgroundColor: '#F34D01',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '6px',
      transition: 'all 0.3s ease',
    },
    alreadyHaveAccount: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '12px',
    },
    alreadyHaveAccountText: {
      fontSize: '13px',
      color: '#666666',
    },
    signInLink: {
      color: '#F34D01',
      textDecoration: 'none',
      fontWeight: '500',
    },
    divider: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      marginTop: '16px',
      marginBottom: '16px',
      position: 'relative',
    },
    dividerLine: {
      flex: '1',
      height: '1px',
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
    },
    dividerText: {
      backgroundColor: '#ffffff',
      color: '#666666',
      fontSize: '12px',
      padding: '0 16px',
      position: 'relative',
      zIndex: '1',
    },
    socialButtons: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    error: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#ffebee',
      color: '#d32f2f',
      borderRadius: '6px',
      fontSize: '13px',
      marginBottom: '12px',
      textAlign: 'center',
    },
  };

  // Add CSS for animations
  const animationStyleSheet = document.createElement('style');
  animationStyleSheet.textContent = `
    @keyframes buttonShine {
      0% {
        background-position: -100% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    button[type="submit"]:hover {
      background: linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01);
      background-size: 200% auto;
      animation: buttonShine 1.5s linear infinite;
    }
    /* Hide scrollbars for the whole page */
    html, body {
      overflow: hidden !important;
      height: 100vh !important;
    }
    ::-webkit-scrollbar {
      width: 0 !important;
      background: transparent !important;
    }
    body {
      overscroll-behavior: none !important;
    }
  `;
  document.head.appendChild(animationStyleSheet);

  if (loading) return <LoadingScreen />;

  return (
      <div style={styles.container}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div style={styles.signupContainer}>
        <div style={styles.formContent}>
          <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
          
          <h2 style={styles.title}>Create your account</h2>
          <p style={styles.subtitle}>Join Civilify to access AI-powered legal assistance</p>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.profilePictureContainer}>
              <div style={styles.profilePictureWrapper}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile Preview" style={styles.profilePicture} />
                ) : (
                  <div style={styles.profilePicturePlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#666"/>
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
                id="profilePicture"
              />
              <label htmlFor="profilePicture" style={styles.fileInputLabel}>
                Upload Profile Picture
              </label>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="What should we call you?"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Minimum of 8 characters"
                    required
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('password')}
                      style={styles.eyeIcon}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#666"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#666"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Confirm your password"
                    required
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={styles.eyeIcon}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#666"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#666"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div style={styles.termsContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>
                  I agree to the 
                  <Link
                    to="/civilify-documents"
                    style={styles.termsLink}
                    onClick={() => {
                      window.localStorage.setItem('selectedDocSection', 'security');
                      window.localStorage.setItem('docFromSignup', 'true');
                    }}
                  >
                    Terms of Service
                  </Link>
                  and 
                  <Link
                    to="/civilify-documents"
                    style={styles.termsLink}
                    onClick={() => {
                      window.localStorage.setItem('selectedDocSection', 'security');
                      window.localStorage.setItem('docFromSignup', 'true');
                    }}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>
            
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          
          <div style={styles.alreadyHaveAccount}>
            <span style={styles.alreadyHaveAccountText}>
              Already have an account? <Link to="/signin" style={styles.signInLink}>Sign In</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
