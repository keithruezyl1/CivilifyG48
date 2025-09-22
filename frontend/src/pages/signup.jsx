"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";
import { API_URL } from "../utils/auth";
import LoadingScreen from "./LoadingScreen";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    profilePicture: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        profilePicture: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleChatRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/chat");
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      showErrorToast("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      showErrorToast("You must agree to the terms and conditions");
      setIsLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("username", formData.username);

      if (formData.profilePicture) {
        data.append("profilePicture", formData.profilePicture);
      }

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      }).catch((err) => {
        showErrorToast("Server is not responding");
        throw err;
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create account");
      }

      let userData = null;
      try {
        userData = await response.json();
        console.log("Signup response data:", userData);

        if (userData && userData.token) {
          localStorage.setItem("authToken", userData.token);
          console.log("Saved auth token to localStorage");
        }

        if (userData && userData.user) {
          localStorage.setItem("user", JSON.stringify(userData.user));
          console.log(
            "Saved user data from backend to localStorage:",
            userData.user
          );
        } else if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
          console.log(
            "Saved user data from backend to localStorage:",
            userData
          );
        } else {
          const userToSave = {
            username: formData.username,
            email: formData.email,
            profile_picture_url: previewUrl,
          };
          localStorage.setItem("user", JSON.stringify(userToSave));
          console.log("Saved fallback user data to localStorage:", userToSave);
        }
      } catch (jsonError) {
        console.log("Response is not JSON or already consumed");
        const userToSave = {
          username: formData.username,
          email: formData.email,
          profile_picture_url: previewUrl,
        };
        localStorage.setItem("user", JSON.stringify(userToSave));
        console.log("Saved basic user data to localStorage:", userToSave);
      }

      try {
        const loginResponse = await fetch(`${API_URL}/users/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();

          if (loginData && loginData.token) {
            localStorage.setItem("authToken", loginData.token);
            console.log("Saved auth token from login to localStorage");
          }

          if (loginData && loginData.user) {
            localStorage.setItem("user", JSON.stringify(loginData.user));
            console.log("Updated user data from login:", loginData.user);
          }
        } else {
          console.warn(
            "Auto-login after registration failed, but registration was successful"
          );
        }
      } catch (loginError) {
        console.error(
          "Error during auto-login after registration:",
          loginError
        );
      }

      showSuccessToast("Account created successfully!");
      handleChatRedirect();
    } catch (err) {
      console.error("Registration error:", err);
      showErrorToast(
        err.message || "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Civilify | Sign Up";
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className={`signup-container ${isDarkMode ? "dark" : "light"}`}>
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
        sx={{ zIndex: 2 }}
      />

      <div className="signup-card">
        <div className="form-content">
          <img
            src={logoIconOrange || "/placeholder.svg"}
            alt="Civilify"
            className="logo"
            onClick={() => navigate("/landing")}
          />

          <h1 className="title">Create Account</h1>
          <p className="subtitle">
            Join Civilify for AI-powered legal assistance
          </p>

          {error && <div className="error-message">{error}</div>}

          <div className="profile-section">
            {/* Clickable profile wrapper */}
            <label htmlFor="profilePicture" className="profile-wrapper">
              {previewUrl ? (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Profile Preview"
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                      fill="#9ca3af"
                    />
                  </svg>
                </div>
              )}
            </label>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden-input"
              id="profilePicture"
            />

            {/* Text label (also clickable) */}
            <label htmlFor="profilePicture" className="upload-label">
              Upload Profile Picture
            </label>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="What should we call you?"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Minimum 8 characters"
                    required
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("password")}
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
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Confirm your password"
                    required
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? (
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
              </div>
            </div>

            <div className="terms-container">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="terms-checkbox"
                id="terms"
              />
              <label htmlFor="terms" className="terms-text">
                I agree to the{" "}
                <Link
                  to="/civilify-documents"
                  className="terms-link"
                  onClick={() => {
                    window.localStorage.setItem(
                      "selectedDocSection",
                      "security"
                    );
                    window.localStorage.setItem("docFromSignup", "true");
                  }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/civilify-documents"
                  className="terms-link"
                  onClick={() => {
                    window.localStorage.setItem(
                      "selectedDocSection",
                      "security"
                    );
                    window.localStorage.setItem("docFromSignup", "true");
                  }}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="signin-text">
            Already have an account?{" "}
            <Link to="/signin" className="signin-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        #root {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important;
          display: block !important;
          flex-direction: unset !important;
          justify-content: unset !important;
          align-items: unset !important;
        }

        .signup-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          position: relative;
        }

        .signup-container.light {
          background: linear-gradient(270deg, #ffa966, #ffd8b0, #ffc290);
          background-size: 400% 400%;
        }

        .signup-container.dark {
          background: #2d2d2d;
        }

        .signup-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background-size: 20px 20px;
          animation: movePattern 10s linear infinite;
          z-index: 0;
        }

        .signup-container.light::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.3) 1px,
            transparent 2px
          );
        }

        .signup-container.dark::before {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.1) 1px,
            transparent 2px
          );
        }

        .signup-container > * {
          position: relative;
        }

        @keyframes movePattern {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 200px 200px;
          }
        }

        .signup-card {
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          margin: auto;
          transition: all 0.3s ease;
        }

        .light .signup-card {
          background: white;
          box-shadow: 0 20px 40px rgba(255, 94, 62, 0.4);
        }

        .dark .signup-card {
          background: #232323;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          border: 1px solid #444;
        }

        .form-content {
          padding: 32px;
          text-align: center;
        }

        .logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          cursor: pointer;
        }

        .title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
          transition: color 0.3s ease;
        }

        .light .title {
          color: #1a202c;
        }

        .dark .title {
          color: #f7fafc;
        }

        .subtitle {
          font-size: 16px;
          margin: 0 0 24px 0;
          line-height: 1.5;
          transition: color 0.3s ease;
        }

        .light .subtitle {
          color: #718096;
        }

        .dark .subtitle {
          color: #a0aec0;
        }

        .error-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 16px;
          border: 1px solid;
          transition: all 0.3s ease;
        }

        .light .error-message {
          background-color: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .dark .error-message {
          background-color: rgba(220, 38, 38, 0.1);
          color: #fca5a5;
          border-color: rgba(220, 38, 38, 0.3);
        }

        .profile-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .profile-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #f34d01;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .light .profile-wrapper {
          background-color: #f3f4f6;
        }

        .dark .profile-wrapper {
          background-color: #2d2d2d;
        }

        .profile-wrapper:hover {
          border-color: #d43f01;
          transform: scale(1.05);
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .light .profile-placeholder {
          background-color: #f9fafb;
        }

        .dark .profile-placeholder {
          background-color: #232323;
        }

        .hidden-input {
          display: none;
        }

        .upload-label {
          font-size: 14px;
          color: #f34d01;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .upload-label:hover {
          color: #d43f01;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .input-group {
          flex: 1;
          text-align: left;
        }

        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          transition: color 0.3s ease;
        }

        .light .input-label {
          color: #374151;
        }

        .dark .input-label {
          color: #ffffff;
        }

        .input-field {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          border: 2px solid;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s ease;
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
          transition: color 0.2s ease;
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

        .terms-container {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
        }

        .terms-checkbox {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: #f34d01;
        }

        .terms-text {
          font-size: 14px;
          line-height: 1.5;
          transition: color 0.3s ease;
        }

        .light .terms-text {
          color: #6b7280;
        }

        .dark .terms-text {
          color: #ccc;
        }

        .terms-link {
          color: #f34d01;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .terms-link:hover {
          color: #d43f01;
          text-decoration: underline;
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

        .signin-text {
          font-size: 14px;
          margin: 0;
          transition: color 0.3s ease;
        }

        .light .signin-text {
          color: #718096;
        }

        .dark .signin-text {
          color: #ccc;
        }

        .signin-link {
          color: #f34d01;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .signin-link:hover {
          color: #d43f01;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .signup-container {
            padding: 10px;
            align-items: flex-start;
          }

          .form-content {
            padding: 24px 20px;
          }

          .title {
            font-size: 28px;
          }

          .form-row {
            flex-direction: column;
            gap: 16px;
          }

          .input-field {
            padding: 12px;
            font-size: 16px;
          }

          .submit-button {
            padding: 12px;
          }
        }

        @media (max-height: 700px), (max-width: 400px) {
          .signup-container {
            align-items: flex-start;
            overflow-y: auto;
            padding: 10px;
          }

          .signup-card {
            margin-top: 10px;
            margin-bottom: 10px;
          }
        }

        @media (max-height: 600px) {
          .form-content {
            padding: 20px;
          }

          .profile-section {
            margin-bottom: 12px;
          }

          .signup-form {
            gap: 12px;
            margin-bottom: 16px;
          }

          .profile-wrapper {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignUp;
