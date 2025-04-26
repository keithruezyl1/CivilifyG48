import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        borderRadius: "12px",
        background: "#4CAF50",
        color: "#ffffff",
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
        borderRadius: "12px",
        background: "#F44336",
        color: "#ffffff",
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
        borderRadius: "12px",
        background: "#2196F3",
        color: "#ffffff",
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
        borderRadius: "12px",
        background: "#FF9800",
        color: "#ffffff",
      },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Example: showSuccessToast('Successfully signed in!');
      navigate("/chat");
    } catch (err) {
      // Example: showErrorToast('Invalid email or password. Please try again.');
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Example: showInfoToast('Password reset functionality will be implemented soon.');
    // alert('Password reset functionality will be implemented soon.');
    navigate("/forgot-password");
  };

  const handleGoogleSignIn = () => {
    // Example: showWarningToast('Google sign-in will be implemented soon.');
    alert("Google sign-in will be implemented soon.");
  };

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
      <div style={styles.signinContainer}>
        <div style={styles.formContent}>
          <img src={logoIconOrange} alt="Civilify" style={styles.logo} />

          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to continue</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
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

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={styles.label}>Password</label>
                <button
                  onClick={() => navigate("/forgot-password")}
                  style={styles.forgotPasswordLink}
                >
                  Forgot password?
                </button>
              </div>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="********"
                  required
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="#666"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                          fill="#666"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={isLoading}
            >
              Sign In
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <button onClick={handleGoogleSignIn} style={styles.googleButton}>
            <img
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
              alt="Google"
              style={styles.googleIcon}
            />
            Continue with Google
          </button>

          <p style={styles.signupText}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "0",
    margin: "0",
    overflow: "hidden",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: "100vh",
    minWidth: "100vw",
  },
  signinContainer: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px 32px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
    margin: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  logo: {
    width: "40px",
    height: "40px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#666666",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "16px",
    width: "100%",
    maxWidth: "320px",
    margin: "0 auto",
  },
  inputGroup: {
    width: "100%",
    textAlign: "left",
    position: "relative",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: "6px",
  },
  input: {
    width: "285px",
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s ease",
    backgroundColor: "#ffffff",
    "&:focus": {
      borderColor: "#F34D01",
    },
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassword: {
    textAlign: "right",
    marginTop: "-8px",
    marginBottom: "16px",
  },
  forgotPasswordLink: {
    background: "none",
    border: "none",
    color: "#F34D01",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: 0,
  },
  submitButton: {
    width: "100%",
    maxWidth: "320px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#F34D01",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    margin: "0 auto",
    transition: "all 0.3s ease",
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "16px 0",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "1px",
      backgroundColor: "rgba(0, 0, 0, 0.08)",
    },
  },
  dividerText: {
    position: "relative",
    backgroundColor: "#ffffff",
    padding: "0 16px",
    color: "#666666",
    fontSize: "14px",
  },
  googleButton: {
    width: "100%",
    maxWidth: "320px",
    padding: "12px",
    fontSize: "15px",
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    margin: "0 auto",
  },
  googleIcon: {
    width: "18px",
    height: "18px",
  },
  signupText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#666666",
  },
  signupLink: {
    color: "#F34D01",
    textDecoration: "none",
    fontWeight: "500",
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#d32f2f",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    width: "100%",
    maxWidth: "320px",
    margin: "0 auto 16px",
  },
  formContent: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

// Add CSS for animations
const animationStyleSheet = document.createElement("style");
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
`;
document.head.appendChild(animationStyleSheet);

export default SignIn;
