"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import {
  fetchUserProfile,
  clearAuthData,
  validateAuthToken,
  getAuthToken,
} from "../utils/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingScreen from "./LoadingScreen";
import AnimateInView from "../components/lightswind/animate-in-view";

const handleBackClick = (navigate) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role !== "ROLE_ADMIN") {
    navigate("/chat");
    return;
  } else if (user.role === "ROLE_ADMIN") {
    navigate("/admin");
    return;
  } else if (user.role === "ROLE_SYSTEM_ADMIN") {
    navigate("/system");
    return;
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    profile_picture_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const token = getAuthToken();
    const authStatus = validateAuthToken();
    if (!token || !authStatus.valid) {
      console.log("Profile: Authentication check failed, redirecting to login");
      localStorage.setItem("redirectAfterLogin", "/profile");
      navigate("/signin", { replace: true });
      return;
    }
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const userData = await fetchUserProfile();
        if (userData) {
          setProfile({
            username: userData.username || "",
            email: userData.email || "",
            profile_picture_url: userData.profile_picture_url || null,
          });
        } else {
          console.error("Authentication failed, redirecting to signin");
          toast.error("Please sign in to view your profile");
          setTimeout(() => navigate("/#/signin"), 1500);
          return;
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          toast.error("Authentication failed. Please sign in again.");
          clearAuthData();
          setTimeout(() => navigate("/#/signin"), 1500);
        } else {
          toast.error("Failed to load profile data");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfileData();
    document.title = "Civilify | Profile";
  }, [navigate]);

  if (isLoading) {
    return <LoadingScreen isDarkMode={isDarkMode} />;
  }

  return (
    <div className="profile-container">
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
        <AnimateInView asChild={true} animationType="slide-left" delay={0}>
          <div className="back-button">
            <button
              onClick={() => {
                handleBackClick(navigate);
              }}
              className="back-btn"
            >
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
              <span className="full-text">Back</span>
              <span className="short-text">Back</span>
            </button>
          </div>
        </AnimateInView>
        <AnimateInView asChild={true} animationType="slide-right" delay={0}>
          <div>
            <img
              src={logoIconOrange}
              alt="Civilify"
              style={{ height: "30px", marginRight: "12px", marginTop: "6px" }}
            />
          </div>
        </AnimateInView>
      </div>

      <div className="content">
        <AnimateInView asChild={true} animationType="slide-up" delay={0}>
          <div className="avatar-section">
            <div className="avatar">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url || "/placeholder.svg"}
                  alt={profile.username}
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <h1>{profile.username || "User Name"}</h1>
            <p>{profile.email}</p>
            <div className="action-buttons">
              <button
                onClick={() =>
                  navigate("/edit-profile", {
                    state: { ...profile, mode: "edit" },
                  })
                }
                className="action-btn edit-btn"
              >
                Edit Profile
              </button>
              <button
                onClick={() =>
                  navigate("/edit-profile", {
                    state: { ...profile, mode: "change-password" },
                  })
                }
                className="action-btn change-password-btn"
              >
                Change Password
              </button>
            </div>
          </div>
        </AnimateInView>
        <AnimateInView asChild={true} animationType="slide-up" delay={200}>
          <div className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings">
              <div className="setting">
                <div>
                  <h3>Language</h3>
                  <p>English (US)</p>
                </div>
                <button
                  className="change-btn"
                  onClick={() => toast.info("Language settings coming soon")}
                >
                  Change
                </button>
              </div>
              <div className="setting">
                <div>
                  <h3>Theme</h3>
                  <p>{isDarkMode ? "Dark Mode" : "Light Mode"}</p>
                </div>
                <div className="theme-toggle">
                  <div
                    className="toggle-switch"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    <div
                      className="toggle-slider"
                      style={{ left: isDarkMode ? "22px" : "2px" }}
                    />
                  </div>
                  <span
                    className="toggle-label"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? "Dark" : "Light"}
                  </span>
                </div>
              </div>
              <div
                className="delete-section"
                onClick={() => toast.info("Delete functionality coming soon")}
              >
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all data.</p>
                </div>
                <button className="delete-btn">Delete</button>
              </div>
            </div>
          </div>
        </AnimateInView>
      </div>
      <style>{`
  .profile-container {
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
  .logo { display: flex; align-items: center; }

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

  .content { max-width: 600px; margin: 0 auto; padding: 0px 30px 30px 30px; }
  .avatar-section { text-align: center; margin-bottom: 24px; }
  .avatar { position: relative; display: inline-block; margin-bottom: 16px }
  .avatar-img, .avatar-placeholder {
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

  .action-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  .action-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .edit-btn {
    background-color: #f24c00;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(242, 76, 0, 0.3);
  }
  .edit-btn:hover {
    background-color: #d64500;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(242, 76, 0, 0.4);
  }
  .edit-btn:not(:hover) {
    background-color: #f24c00;
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(242, 76, 0, 0.3);
  }
  .change-password-btn {
    background-color: ${isDarkMode ? "#404040" : "#f1f5f9"};
    color: ${isDarkMode ? "#ffffff" : "#475569"};
  }
  .change-password-btn:hover {
    background-color: ${isDarkMode ? "#555555" : "#e2e8f0"};
    transform: translateY(-1px);
  }
  .change-password-btn:not(:hover) {
    background-color: ${isDarkMode ? "#404040" : "#f1f5f9"};
    transform: translateY(0);
  }

  .settings-section { margin-top: 24px; }
  .settings { display: flex; flex-direction: column; gap: 16px; }
  .setting { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${
    isDarkMode ? "#404040" : "#e2e8f0"
  }; }
  .change-btn {
    background: none;
    border: none;
    color: #f24c00;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .change-btn:hover { color: #d64500; }
  .theme-toggle { display: flex; align-items: center; gap: 12px; }
  .toggle-switch {
    width: 44px;
    height: 24px;
    background-color: ${isDarkMode ? "#f24c00" : "#e2e8f0"};
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .toggle-slider {
    width: 20px;
    height: 20px;
    background-color: #ffffff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    transition: left 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .toggle-label {
    font-size: 16px;
    font-weight: 600;
    color: #f24c00;
    cursor: pointer;
  }

  .delete-section {
    background-color: ${isDarkMode ? "#4a1a1a" : "#fef2f2"};
    border: 1px solid ${isDarkMode ? "#7f1d1d" : "#fecaca"};
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
    gap: 3vh;
  }
  .delete-btn {
    padding: 12px 20px;
    background-color: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .delete-btn:hover {
    background-color: #b91c1c;
    transform: translateY(-1px);
  }
  .delete-btn:not(:hover) {
    background-color: #dc2626;
    transform: translateY(0);
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

export default Profile;
