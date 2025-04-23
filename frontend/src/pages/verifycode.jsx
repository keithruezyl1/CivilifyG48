import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";

const VerifyCode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      style: {
        borderRadius: "12px",
        background: "#F44336",
        color: "#ffffff",
      },
    });
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      style: {
        borderRadius: "12px",
        background: "#4CAF50",
        color: "#ffffff",
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      showErrorToast("Please enter the verification code.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate backend check
      if (code === "123456") {
        showSuccessToast("Code verified!");
        setTimeout(() => navigate("/reset-password"), 2000);
      } else {
        showErrorToast("Invalid code. Please try again.");
      }
    } catch (err) {
      showErrorToast("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    showSuccessToast("Verification code resent!");
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      <div style={styles.card}>
        <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
        <h2 style={styles.title}>Verify Code</h2>
        <p style={styles.subtitle}>
          Enter the 6-digit code we sent to your email.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Verification Code</label>
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={styles.input}
              placeholder="Enter code"
            />
          </div>

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p style={styles.resendText}>
          Didn’t get the code?{" "}
          <span onClick={handleResend} style={styles.resendLink}>
            Resend Code
          </span>
        </p>

        <p style={styles.backToLogin}>
          <Link to="/signin" style={styles.backLink}>
            Back to Sign In
          </Link>
        </p>
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
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
    textAlign: "center",
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
    marginBottom: "8px",
    color: "#1a1a1a",
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
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: "6px",
    display: "block",
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
    width: "100%",
    backgroundColor: "#F97316",
    color: "#ffffff",
    padding: "12px",
    fontSize: "15px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  resendText: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#666666",
  },
  resendLink: {
    color: "#F97316",
    fontWeight: "500",
    cursor: "pointer",
    marginLeft: "4px",
  },
  backToLogin: {
    fontSize: "14px",
    marginTop: "24px",
    color: "#666666",
  },
  backLink: {
    textDecoration: "none",
    color: "#F97316",
    fontWeight: "500",
  },
};

export default VerifyCode;
