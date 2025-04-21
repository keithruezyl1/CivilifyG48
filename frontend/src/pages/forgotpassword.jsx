import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showInfoToast = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
      style: {
        borderRadius: "12px",
        background: "#2196F3",
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
    if (!email) {
      showErrorToast("Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      //   showInfoToast(
      //     "If your email exists in our system, you’ll receive a reset link."
      //   );
      alert(
        "Password reset functionality will be implemented soon. Proceeding to dummy verification code page."
      );
      setTimeout(() => navigate("/verify-code"), 2000);
    } catch (err) {
      showErrorToast("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      <div style={styles.signinContainer}>
        <div style={styles.formContent}>
          <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>
            We’ll send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p style={styles.signupText}>
            Remembered your password?{" "}
            <Link to="/signin" style={styles.signupLink}>
              Sign In
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
    padding: "32px",
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
  },
  submitButton: {
    backgroundColor: "#F97316",
    color: "#ffffff",
    padding: "12px",
    fontSize: "15px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  signupText: {
    fontSize: "14px",
    marginTop: "24px",
    color: "#666666",
  },
  signupLink: {
    color: "#F97316",
    fontWeight: "500",
    textDecoration: "none",
    marginLeft: "4px",
  },
};

export default ForgotPassword;
