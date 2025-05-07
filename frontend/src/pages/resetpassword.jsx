import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import LoadingScreen from './LoadingScreen';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const email = location.state?.email || "";

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement reset password logic
      console.log("Reset password for:", email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to sign in page
      handleSigninRedirect();
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
      <div style={styles.formContainer}>
        <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              minLength={8}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
              minLength={8}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
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
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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

export default ResetPassword;
