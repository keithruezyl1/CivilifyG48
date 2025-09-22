"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import LoadingScreen from "./LoadingScreen";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { API_URL } from "../utils/auth";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.matches !== isDarkMode) {
      setIsDarkMode(mediaQuery.matches);
    }

    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isDarkMode]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
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
        background: "#10B981",
        color: "#ffffff",
        fontWeight: "500",
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
        background: "#EF4444",
        color: "#ffffff",
        fontWeight: "500",
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if the email exists in the database
      console.log("Checking if email exists:", email);

      // Prepare the URL for checking email existence
      const emailCheckUrl = `${API_URL}/users/email/${encodeURIComponent(
        email
      )}`;
      console.log("Checking email at URL:", emailCheckUrl);

      let emailExists = false;

      try {
        // Call the getUserByEmail endpoint to check if email exists
        const checkResponse = await axios.get(emailCheckUrl);
        console.log("Email check response:", checkResponse);

        // Check if we got a valid user object back (not empty)
        // The API returns an empty object if the email doesn't exist
        if (checkResponse.status === 200 && checkResponse.data) {
          // Check if the data object contains any properties besides 'error'
          // If it has email or other user properties, the user exists
          if (
            checkResponse.data.email &&
            Object.keys(checkResponse.data).length > 0
          ) {
            emailExists = true;
            console.log("Valid user found with this email");
          } else {
            console.log(
              "Empty user data returned, email likely does not exist"
            );
            emailExists = false;
          }
        }
      } catch (emailErr) {
        console.error("Email check error:", emailErr);

        // If we get a 404, it means the email doesn't exist
        if (emailErr.response && emailErr.response.status === 404) {
          emailExists = false;
        } else {
          // For other errors, we'll still say email verification failed
          throw new Error("Email verification failed. Please try again.");
        }
      }

      // If email doesn't exist, show error toast and stop
      if (!emailExists) {
        showErrorToast("Email does not exist in our system.");
        return;
      }

      // If we get here, the email exists, so proceed with password reset
      console.log("Email exists. Sending forgot password request for:", email);

      const response = await axios.post(
        `${API_URL}/auth/forgot-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Password reset response:", response);

      if (response.data && response.data.success) {
        showSuccessToast(
          "Password reset email sent successfully. Please check your inbox."
        );
        // Navigate to sign in page after a short delay
        setTimeout(() => {
          handleSigninRedirect();
        }, 3000);
      } else {
        const errorMessage =
          response.data?.message ||
          "Failed to send reset link. Please try again.";
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error("Error in forgot password flow:", err);
      const errorMessage =
        err.message || "Failed to process your request. Please try again.";
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordRedirect = (email) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/resetpassword", { state: { email } });
    }, 1000);
  };

  const handleSigninRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/signin");
    }, 1000);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div
      className={`forgot-password-container ${isDarkMode ? "dark" : "light"}`}
    >
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

      <div className="forgot-password-card">
        <div className="form-content">
          <img
            src={logoIconOrange || "/placeholder.svg"}
            alt="Civilify"
            className="logo"
            onClick={() => navigate("/landing")}
          />

          <h1 className="title">Forgot Password</h1>
          <p className="subtitle">
            Enter your email address and we'll send you
            <br />a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <p className="signin-text">
            Remember your password?{" "}
            <button onClick={handleSigninRedirect} className="signin-link">
              Sign in
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        * {
          transition: background-color 0.15s ease, color 0.15s ease,
            border-color 0.15s ease;
        }

        .forgot-password-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          transition: background 0.15s ease;
        }

        .forgot-password-container.light {
          background: linear-gradient(270deg, #ffa966, #ffd8b0, #ffc290);
          background-size: 400% 400%;
        }

        .forgot-password-container.dark {
          background: #2d2d2d;
        }

        .forgot-password-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background-size: 20px 20px;
          animation: movePattern 10s linear infinite;
          z-index: 0;
          transition: background-image 0.15s ease;
        }

        .forgot-password-container.light::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.3) 1px,
            transparent 2px
          );
        }

        .forgot-password-container.dark::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.1) 1px,
            transparent 2px
          );
        }

        .forgot-password-container > * {
          position: relative;
          z-index: 1;
        }

        @keyframes movePattern {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 200px 200px;
          }
        }

        .forgot-password-card {
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          transition: all 0.15s ease;
        }

        .light .forgot-password-card {
          background: white;
          box-shadow: 0 20px 40px rgba(255, 94, 62, 0.4);
        }

        .dark .forgot-password-card {
          background: #232323;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          border: 1px solid #444;
        }

        .form-content {
          padding: 48px 40px;
          text-align: center;
        }

        .logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 24px;
        }

        .title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
          transition: color 0.15s ease;
        }

        .light .title {
          color: #1a202c;
        }

        .dark .title {
          color: #f7fafc;
        }

        .subtitle {
          font-size: 16px;
          margin: 0 0 32px 0;
          line-height: 1.5;
          transition: color 0.15s ease;
        }

        .light .subtitle {
          color: #718096;
        }

        .dark .subtitle {
          color: #a0aec0;
        }

        .forgot-password-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 24px;
        }

        .input-group {
          text-align: left;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          transition: color 0.15s ease;
        }

        .light .input-label {
          color: #374151;
        }

        .dark .input-label {
          color: #e2e8f0;
        }

        .input-field {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          border: 2px solid;
          border-radius: 12px;
          outline: none;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        .light .input-field {
          border-color: #e2e8f0;
          background: #f8fafc;
          color: #1a202c;
        }

        .light .input-field:focus {
          border-color: #f34d01;
          background: white;
          box-shadow: 0 0 0 3px rgba(243, 77, 1, 0.1);
        }

        .dark .input-field {
          border-color: #444;
          background: #2d2d2d;
          color: #ffffff;
        }

        .dark .input-field:focus {
          border-color: #f34d01;
          background: #232323;
          box-shadow: 0 0 0 3px rgba(243, 77, 1, 0.2);
        }

        .dark .input-field::placeholder {
          color: #ccc;
        }

        .submit-button {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #f34d01 0%, #ff6b3d 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(243, 77, 1, 0.3);
          background: linear-gradient(90deg, #f34d01, #ff6b3d, #f34d01);
          background-size: 200% auto;
          animation: buttonShine 1.5s linear infinite;
        }

        @keyframes buttonShine {
          0% {
            background-position: -100% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .signin-text {
          font-size: 14px;
          margin: 0;
          transition: color 0.15s ease;
        }

        .light .signin-text {
          color: #718096;
        }

        .dark .signin-text {
          color: #ccc;
        }

        .signin-link {
          background: none;
          border: none;
          color: #f34d01;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }

        .signin-link:hover {
          color: #d43f01;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .forgot-password-container {
            padding: 16px;
          }

          .form-content {
            padding: 32px 24px;
          }

          .title {
            font-size: 28px;
          }

          .input-field {
            padding: 14px;
            font-size: 16px;
          }

          .submit-button {
            padding: 14px;
          }
        }

        @media (max-height: 700px), (max-width: 400px) {
          .forgot-password-container {
            align-items: flex-start;
            overflow-y: auto;
            padding: 20px 0;
          }

          .forgot-password-card {
            margin: 5%;
          }
        }

        #root:not(:has(.docs-page)) {
          padding: 0 !important;
          display: block !important;
          overflow-y: hidden scroll !important;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
