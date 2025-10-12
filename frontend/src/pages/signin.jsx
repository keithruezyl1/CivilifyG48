"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";
import { API_URL, clearAuthData, validateAuthToken } from "../utils/auth";
import LoadingScreen from "./LoadingScreen";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "433624047904-ea5ipm4k3ogi6fumrpjdu9c59hq1119l.apps.googleusercontent.com";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordClicked, setForgotPasswordClicked] = useState(false);
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

  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
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
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        borderRadius: "12px",
        background: "#EF4444",
        color: "#ffffff",
        fontWeight: "500",
      },
    });
  };

  const showWarningToast = (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        borderRadius: "12px",
        background: "#F59E0B",
        color: "#ffffff",
        fontWeight: "500",
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
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const responseText = await response.text();

      if (!responseText) {
        throw new Error("Server returned an empty response");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        let errorMessage = "Authentication failed";
        if (data && data.error) {
          errorMessage = data.error;
        } else if (data && data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      clearAuthData();

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        if (data.expiresAt) {
          localStorage.setItem(
            "tokenExpires",
            new Date(data.expiresAt).getTime().toString()
          );
        }
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        showSuccessToast("Successfully signed in!");
        handleChatRedirect();
        return;
      }

      try {
        const userResponse = await fetch(
          `${API_URL}/users/email/${formData.email}`
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        localStorage.setItem("user", JSON.stringify(userData));

        showSuccessToast("Successfully signed in!");
        handleChatRedirect();
      } catch (userError) {
        showSuccessToast("Signed in, but user data could not be loaded");
        handleChatRedirect();
      }
    } catch (err) {
      const errorMessage = err.message || "";
      const lowerCaseError = errorMessage.toLowerCase();

      if (
        lowerCaseError.includes("network") ||
        lowerCaseError.includes("connection")
      ) {
        showErrorToast(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else if (lowerCaseError.includes("empty response")) {
        showErrorToast("The server is not responding. Please try again later.");
      } else if (lowerCaseError.includes("invalid response format")) {
        showErrorToast(
          "Received an invalid response from the server. Please try again later."
        );
      } else if (
        lowerCaseError.includes("email not found") ||
        lowerCaseError.includes("user not found")
      ) {
        showWarningToast(
          "This email is not registered. Please check your email or sign up for a new account."
        );
      } else if (
        lowerCaseError.includes("incorrect password") ||
        lowerCaseError.includes("wrong password")
      ) {
        showWarningToast(
          "Incorrect password. Please try again or use the forgot password option."
        );
      } else if (
        lowerCaseError.includes("account locked") ||
        lowerCaseError.includes("too many attempts")
      ) {
        showErrorToast(
          "Your account has been temporarily locked due to too many failed attempts. Please try again later or reset your password."
        );
      } else {
        showErrorToast(
          "Authentication failed. Please check your email and password."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/chat");
    }, 1000);
  };

  const handleForgotPassword = () => {
    setForgotPasswordClicked(true);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/forgot-password");
    }, 1000);
  };

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google && !window.googleSignInInitialized) {
        console.log("Initializing Google Sign-In in signin page...");
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          prompt_parent_id: "googleSignInButton",
          ux_mode: "popup",
          allowed_origins: [
            window.location.origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://civilify.vercel.app",
          ],
        });
        window.googleSignInInitialized = true;
        console.log(
          "Google Sign-In initialized with origin:",
          window.location.origin
        );
      }

      if (window.google) {
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            width: "100%",
          }
        );
      }
    };

    if (window.google) {
      initGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
    }

    return () => {};
  }, []);

  useEffect(() => {
    const authStatus = validateAuthToken();
    if (authStatus.valid) {
      navigate("/chat");
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Civilify | Sign In";
  }, []);

  const handleGoogleSignIn = (response) => {
    setIsLoading(true);
    try {
      clearAuthData();

      const { credential } = response;
      let payload;

      try {
        payload = JSON.parse(atob(credential.split(".")[1]));
      } catch (parseError) {
        showErrorToast("Error processing Google sign-in data");
        setIsLoading(false);
        return;
      }

      const userToSave = {
        username: payload.name || "Google User",
        email: payload.email || "user@example.com",
        profile_picture_url:
          payload.picture || "https://randomuser.me/api/portraits/lego/1.jpg",
      };

      localStorage.setItem("user", JSON.stringify(userToSave));

      fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: credential }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          } else if (data) {
            localStorage.setItem("user", JSON.stringify(data));
          }

          if (data && data.token) {
            localStorage.setItem("authToken", data.token);
            if (data.expiresAt) {
              localStorage.setItem(
                "tokenExpires",
                new Date(data.expiresAt).getTime().toString()
              );
            }
          }

          showSuccessToast("Successfully signed in with Google!");
          handleChatRedirect();
        })
        .catch((error) => {
          showErrorToast("Google sign-in failed");
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      showErrorToast("Error processing Google sign-in");
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className={`signin-container ${isDarkMode ? "dark" : "light"}`}>
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

      <div className="signin-card">
        <div className="form-content">
          <img
            src={logoIconOrange || "/placeholder.svg"}
            alt="Civilify"
            className="logo"
            onClick={() => navigate("/landing")}
          />

          <h1 className="title">Welcome back</h1>
          <p className="subtitle">Sign in to continue to your account</p>

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
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
                          fill="currentColor"
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
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className={`forgot-password ${
                  forgotPasswordClicked ? "clicked" : ""
                }`}
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="divider">
            <span className="divider-text">or continue with</span>
          </div>

          <div
            id="googleSignInButton"
            className="google-button-container"
          ></div>

          <p className="signup-text">
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        * {
          transition: background-color 0.15s ease, color 0.15s ease,
            border-color 0.15s ease;
        }

        #root {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important;
          display: block !important;
          flex-direction: unset !important;
          justify-content: unset !important;
          align-items: unset !important;
          min-height: 100vh;
        }

        .signin-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          transition: background 0.15s ease;
        }

        .signin-container.light {
          background: linear-gradient(270deg, #ffa966, #ffd8b0, #ffc290);
          background-size: 400% 400%;
        }

        .signin-container.dark {
          background: #2d2d2d;
        }

        .signin-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background-size: 20px 20px;
          animation: movePattern 10s linear infinite;
          z-index: 0;
          transition: background-image 0.15s ease;
        }

        .signin-container.light::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.3) 1px,
            transparent 2px
          );
        }

        .signin-container.dark::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.1) 1px,
            transparent 2px
          );
        }

        .signin-container > * {
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

        .signin-card {
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          transition: all 0.15s ease;
        }

        .light .signin-card {
          background: white;
          box-shadow: 0 20px 40px rgba(255, 94, 62, 0.4);
        }

        .dark .signin-card {
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

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
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

        .password-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .light .password-toggle {
          color: #9ca3af;
        }

        .light .password-toggle:hover {
          color: #6b7280;
        }

        .dark .password-toggle {
          color: #ccc;
        }

        .dark .password-toggle:hover {
          color: #fff;
        }

        .forgot-password {
          background: none;
          border: none;
          color: #f34d01;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-align: right;
          display: block;
          margin: 12px 0 0 auto;
          padding: 4px 0;
          transition: all 0.2s ease;
        }

        .forgot-password:hover {
          color: #d43f01;
          text-decoration: underline;
        }

        .forgot-password.clicked {
          color: #d43f01;
          font-weight: 600;
        }

        .submit-button {
          width: 100%;
          padding: 14px;
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

        .divider {
          position: relative;
          text-align: center;
          margin: 12px 0 12px 0;
        }

        .divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          transition: background 0.15s ease;
        }

        .light .divider::before {
          background: #e2e8f0;
        }

        .dark .divider::before {
          background: #444;
        }

        .divider-text {
          position: relative;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .light .divider-text {
          background: white;
          color: #9ca3af;
        }

        .dark .divider-text {
          background: #232323;
          color: #ccc;
        }

        .google-button-container {
          margin-bottom: 18px;
          display: flex;
          justify-content: center;
        }

        .signup-text {
          font-size: 14px;
          margin: 0;
          transition: color 0.15s ease;
        }

        .light .signup-text {
          color: #718096;
        }

        .dark .signup-text {
          color: #ccc;
        }

        .signup-link {
          color: #f34d01;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .signup-link:hover {
          color: #d43f01;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .signin-container {
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

        @media (max-height: 700px) or (max-width: 400px) {
          .signin-container {
            align-items: flex-start;
            overflow-y: auto;
            padding: 20px 0;
          }

          .signin-card {
            margin: 5%;
          }
        }
      `}</style>
    </div>
  );
};

export default SignIn;
