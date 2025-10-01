"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import {
  getUserData,
  updateUserProfile,
  uploadProfilePicture,
  validateAuthToken,
} from "../utils/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { mode: rawMode, ...profile } = location.state || {};
  const mode = rawMode ? rawMode.toLowerCase() : "edit"; // Default to "edit"

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (location.state) {
          setFormData((prev) => ({
            ...prev,
            username: location.state.username || "",
            email: location.state.email || "",
          }));
          if (location.state.profile_picture_url) {
            setAvatarPreview(location.state.profile_picture_url);
          }
        } else {
          const userData = getUserData();
          if (userData) {
            setFormData((prev) => ({
              ...prev,
              username: userData.username || "",
              email: userData.email || "",
            }));
            if (userData.profile_picture_url) {
              setAvatarPreview(userData.profile_picture_url);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load user data");
      }
    };

    loadUserData();
    mode === "edit"
      ? (document.title = "Civilify | Edit Profile")
      : (document.title = "Civilify | Change Password");
  }, [location.state, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        setIsLoading(true);
        const tokenStatus = validateAuthToken();
        if (!tokenStatus.valid) {
          toast.error(`${tokenStatus.message}. Please sign in again.`);
          setTimeout(() => navigate("/signin"), 2000);
          return;
        }
        const profilePictureUrl = await uploadProfilePicture(file);
        toast.success("Profile picture uploaded successfully");
        setAvatarPreview(profilePictureUrl);
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        if (error.response && error.response.status === 403) {
          toast.error("Session expired. Please sign in again.");
          setTimeout(() => navigate("/signin"), 2000);
        } else {
          toast.error("Failed to upload profile picture. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setIsLoading(true);
      const tokenStatus = validateAuthToken();
      if (!tokenStatus.valid) {
        toast.error(`${tokenStatus.message}. Please sign in again.`);
        setTimeout(() => navigate("/signin"), 2000);
        return;
      }
      const updateData = { username: formData.username, email: formData.email };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateUserProfile(updateData);
      toast.success("Profile updated successfully");
      setTimeout(() => navigate("/profile"), 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response && error.response.status === 403) {
        toast.error("Session expired. Please sign in again.");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case "username":
        if (!value.trim()) newErrors.username = "Username is required";
        else if (value.length < 3)
          newErrors.username = "Username must be at least 3 characters";
        else delete newErrors.username;
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) newErrors.email = "Email is required";
        else if (!emailRegex.test(value))
          newErrors.email = "Please enter a valid email";
        else delete newErrors.email;
        break;
      case "password":
        if (value && value.length < 6)
          newErrors.password = "Password must be at least 6 characters";
        else delete newErrors.password;
        break;
      case "confirmPassword":
        if (formData.password && value !== formData.password)
          newErrors.confirmPassword = "Passwords do not match";
        else delete newErrors.confirmPassword;
        break;
    }
    setErrors(newErrors);
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  return (
    <div className="edit-profile-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />

      <div className="header">
        <div className="back-button">
          <button onClick={() => navigate("/profile")} className="back-btn">
            <svg
              style={{ width: "20px", height: "20px", marginRight: "8px" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="full-text">Back to Profile</span>
            <span className="short-text">Profile</span>
          </button>
        </div>
        <div>
          <img
            src={logoIconOrange}
            alt="Civilify"
            style={{ height: "30px", marginRight: "12px", marginTop: "6px" }}
          />
        </div>
      </div>

      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="avatar-section">
            {mode === "edit" && (
              <div
                className="avatar"
                onClick={() => document.getElementById("avatar-upload").click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar Preview"
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.username.substring(0, 2).toUpperCase() || "U"}
                  </div>
                )}
                <div className="avatar-overlay">
                  {isLoading ? "Uploading..." : "Change Photo"}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  disabled={isLoading}
                />
              </div>
            )}
            <h1
              {...(mode === "change-password" && {
                style: { marginTop: "10vh" },
              })}
            >
              {mode === "edit"
                ? "Edit Profile"
                : mode === "change-password"
                ? "Change Password"
                : "Invalid Mode"}
            </h1>
            <p>
              {mode === "edit"
                ? "Update your profile information"
                : mode === "change-password"
                ? "Update your password"
                : "Please navigate from the profile page."}
            </p>
          </div>

          {mode === "edit" || mode === "change-password" ? (
            <div className="form-fields">
              {mode === "edit" && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                    {errors.username && (
                      <p className="error">{errors.username}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder="Enter your email address"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                  </div>
                </>
              )}
              {mode === "change-password" && (
                <>
                  <div className="form-group">
                    <label>
                      {mode === "edit"
                        ? "New Password (Optional)"
                        : "New Password"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder={
                        mode === "edit"
                          ? "Leave blank to keep current password"
                          : "Enter your new password"
                      }
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="error">{errors.password}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <p className="error">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}

          <div className="submit-button">
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || Object.keys(errors).length > 0}
            >
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
  .edit-profile-container {
    min-height: 100vh;
    background-color: ${isDarkMode ? "#1c1c1c" : "#ffffff"};
    color: ${isDarkMode ? "#ffffff" : "#1a1a1a"};
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

 .header {
    padding: 24px;
    margin: 0 auto;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .back-button, .logo { flex: 1; }
  .logo { display: flex; justify-content: flex-end; }

  .back-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: ${isDarkMode ? "#ffffff" : "#64748b"};
    font-size: 16px;
    cursor: pointer;
    padding: 8px 0;
    transition: color 0.2s ease;
  }

  .full-text {
    display: inline;
  }

  .short-text {
    display: none;
  }

  .back-btn:hover {
    color: ${isDarkMode ? "#cccccc" : "#334155"};
  }

  /* Mobile and below (≤431px) */
  @media (max-width: 431px) {
    .full-text {
      display: none;
    }
    .short-text {
      display: inline;
    }
    h1 { font-size: 24px; }
    h2 { font-size: 18px; }
    h3 { font-size: 14px; }
    p, label, button, input { font-size: 12px; }
  }

  .avatar-section { text-align: center; margin-bottom: 0px; }
  .avatar {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .avatar-img,
  .avatar-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid ${isDarkMode ? "#404040" : "#ffffff"};
    box-shadow: ${
      isDarkMode
        ? "0 8px 32px rgba(0, 0, 0, 0.3)"
        : "0 8px 32px rgba(0, 0, 0, 0.1)"
    };
    transition: transform 0.2s ease;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #f24c00 0%, #ea580c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
    color: #ffffff;
  }

  .avatar:hover .avatar-img,
  .avatar:hover .avatar-placeholder .avatar-overlay:hover {
    transform: scale(1.05);
    box-shadow: 0 0 0 3px rgba(242, 76, 0, 0.1), 0 0 20px rgba(242, 76, 0, 0.3);
  }

  .avatar-overlay {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 125px;
    height: 125px;
    border-radius: 50%;
    background: rgba(242, 76, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: white;
    font-size: 14px;
    font-weight: 600;
  }

  .avatar:hover .avatar-overlay {
    opacity: 1;
  }

  .content { max-width: 600px; margin: 0 auto; padding: 0px 30px 30px 30px; }
  .form-fields { display: flex; flex-direction: column; gap: 24px; }
  .form-group { display: block; }
  .form-input {
    width: 100%;
    padding: 16px 20px;
    border-radius: 12px;
    border: 2px solid ${isDarkMode ? "#404040" : "#e2e8f0"};
    font-size: 16px;
    background-color: ${isDarkMode ? "#232323" : "#ffffff"};
    color: ${isDarkMode ? "#ffffff" : "#1f2937"};
    transition: all 0.3s ease;
    box-sizing: border-box;
  }
  .form-input:focus { 
    border-color: #f24c00; 
    box-shadow: 0 0 0 3px rgba(242, 76, 0, 0.1), 0 0 20px rgba(242, 76, 0, 0.3);
    outline: none;
  }
  
  .form-input:hover:not(:focus) {
    border-color: #f24c00;
    box-shadow: 0 0 10px rgba(242, 76, 0, 0.2);
  }

  .error { color: #dc2626; font-size: 14px; margin-top: 4px; }

  .submit-button { text-align: center; margin-top: 48px; }
  .submit-btn {
    padding: 16px 32px;
    background-color: #f24c00;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(242, 76, 0, 0.3);
    opacity: 1;
    min-width: 200px;
  }
  .submit-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .submit-btn:hover:not(:disabled) {
    background-color: #d64500;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(242, 76, 0, 0.4);
  }
  .submit-btn:not(:hover):not(:disabled) {
    background-color: #f24c00;
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(242, 76, 0, 0.3);
  }

  /* Base font sizes */
  h1 { font-size: 32px; }
  h2 { font-size: 24px; }
  h3 { font-size: 18px; }
  p, label, button, input { font-size: 16px; }

  /* Tablet and below (≤768px) */
  @media (max-width: 768px) {
    h1 { font-size: 28px; }
    h2 { font-size: 20px; }
    h3 { font-size: 16px; }
    p, label, button, input { font-size: 14px; }
  }

  /* Mobile and below (≤431px) */
  @media (max-width: 431px) {
    h1 { font-size: 24px; }
    h2 { font-size: 18px; }
    h3 { font-size: 14px; }
    p, label, button, input { font-size: 12px; }
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

export default EditProfile;
