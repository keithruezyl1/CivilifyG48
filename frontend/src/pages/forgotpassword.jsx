import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import LoadingScreen from './LoadingScreen';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Toast notification functions
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the backend forgot password endpoint
      console.log("Sending forgot password request for:", email);
      
      const response = await axios.post('http://localhost:8081/api/auth/forgot-password', 
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Response:', response);
      
      if (response.data && response.data.success) {
        showSuccessToast("Password reset email sent successfully. Please check your inbox.");
        // Navigate to sign in page after a short delay
        setTimeout(() => {
          handleSigninRedirect();
        }, 3000);
      } else {
        const errorMessage = response.data?.message || "Failed to send reset link. Please try again.";
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error("Error sending password reset email:", err);
      setError("Failed to send reset link. Please try again.");
      showErrorToast("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordRedirect = (email) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/resetpassword', { state: { email } });
    }, 1000);
  };

  const handleSigninRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/signin');
    }, 1000);
  };

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
      <div style={styles.formContainer}>
        <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>
          Enter your email address and we'll send you
          <br />
          a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Remember your password?{" "}
            <button
              onClick={handleSigninRedirect}
              style={styles.footerLink}
            >
              Sign in
            </button>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: "0",
    margin: "0",
    overflow: "hidden",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logo: {
    height: "48px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666666",
    marginBottom: "24px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: "320px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a1a",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    width: "100%",
    boxSizing: 'border-box',
  },
  error: {
    color: "#dc3545",
    fontSize: "14px",
    marginTop: "-8px",
  },
  submitButton: {
    backgroundColor: "#F34D01",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    width: "100%",
    boxSizing: 'border-box',
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    color: "#666666",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "#F34D01",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: 0,
  },
};

export default ForgotPassword;
