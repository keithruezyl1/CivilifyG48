"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAuthToken, clearAuthData } from "../utils/auth";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  FaSearch,
  FaSignOutAlt,
  FaTrash,
  FaMoon,
  FaSun,
  FaUsers,
  FaUserShield,
  FaLaptop,
  FaBars,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaCrown,
  FaUserCog,
  FaTools,
} from "react-icons/fa";
import logoIconOrange from "../assets/images/logoiconorange.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const SystemAdminPage = () => {
  const navigate = useNavigate();

  // === THEME STATE ===
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("systemAdminTheme") || "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("systemAdminTheme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync isDarkMode with theme + system
  useEffect(() => {
    const updateDarkMode = () => {
      const dark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(dark);
    };

    updateDarkMode();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next =
        prev === "light" ? "dark" : prev === "dark" ? "light" : "light";
      localStorage.setItem("systemAdminTheme", next);
      return next;
    });
  };

  const getStyles = () => styles(isDarkMode);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: (
      <div
        style={{
          backgroundColor: "#F34D01",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
        }}
      />
    ),
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutYesHovered, setLogoutYesHovered] = useState(false);
  const [logoutNoHovered, setLogoutNoHovered] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  const stats = {
    totalUsers: users.length,
    systemAdmins: users.filter((u) => u.role === "ROLE_SYSTEM_ADMIN").length,
    adminUsers: users.filter((u) => u.role === "ROLE_ADMIN").length,
    regularUsers: users.filter((u) => u.role === "ROLE_USER").length,
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.role !== "ROLE_SYSTEM_ADMIN") {
      navigate("/");
      return;
    }

    const formattedUserData = {
      username: user.username,
      email: user.email,
      profile_picture_url: user.profilePictureUrl || user.profile_picture_url,
    };

    setUserData({
      name: user.username || "System Admin",
      email: user.email || "sysadmin@example.com",
      avatar: <ProfileAvatar size="medium" userData={formattedUserData} />,
    });
    setCurrentUserId(user.userId || user.id || user.uid || null);
    setCurrentUserEmail(user.email || null);
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const base =
      searchQuery.trim() === ""
        ? [...users]
        : users.filter(
            (user) =>
              user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase())
          );
    // Put the logged-in user at the top
    base.sort((a, b) => {
      const aIsMe = a.userId === currentUserId || a.email === currentUserEmail;
      const bIsMe = b.userId === currentUserId || b.email === currentUserEmail;
      if (aIsMe && !bIsMe) return -1;
      if (!aIsMe && bIsMe) return 1;
      return 0;
    });
    setFilteredUsers(base);
  }, [searchQuery, users, currentUserId, currentUserEmail]);

  useEffect(() => {
    document.title = "Civilify | System Admin";
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      if (data.result === "SUCCESS") {
        setUsers(data.data || []);
        setFilteredUsers(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (userId, nextRole) => {
    try {
      setActionBusy(userId + ":" + nextRole);
      const token = getAuthToken();
      const res = await fetch(
        `${API_URL}/admin/users/${encodeURIComponent(userId)}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: nextRole }),
        }
      );
      if (!res.ok) throw new Error("Failed to update role");
      await fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update role");
    } finally {
      setActionBusy(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setSelectedUser(userId);
    setConfirmDelete(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionBusy(selectedUser + ":DELETE");
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/admin/users/${selectedUser}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      const data = await response.json();
      if (data.result === "SUCCESS") {
        setUsers(users.filter((user) => user.userId !== selectedUser));
        setFilteredUsers(
          filteredUsers.filter((user) => user.userId !== selectedUser)
        );
        setConfirmDelete(false);
        setSelectedUser(null);
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error.message);
    } finally {
      setActionBusy(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
    setSelectedUser(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      clearAuthData();
      navigate("/signin");
    }
    setShowLogoutConfirm(false);
  };

  const currentStyles = getStyles();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  // Inject small spinner CSS used for promote/demote buttons
  useEffect(() => {
    const styleId = "sysadmin-btn-spinner-style";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      .btn-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.25);
        border-top-color: rgba(255,255,255,0.95);
        border-radius: 50%;
        vertical-align: middle;
        margin-right: 8px;
        animation: spin 0.8s linear infinite;
      }
      /* darker spinner on light backgrounds */
      body.light-mode .btn-spinner {
        border: 2px solid rgba(0,0,0,0.15);
        border-top-color: rgba(0,0,0,0.6);
      }
    `;
    document.head.appendChild(s);
  }, []);

  const getRoleBadge = (role) => {
    const roleMap = {
      ROLE_SYSTEM_ADMIN: { label: "System Admin", color: "#8b5cf6" },
      ROLE_ADMIN: { label: "Admin", color: "#F34D01" },
      ROLE_USER: { label: "User", color: "#10b981" },
    };
    const roleInfo = roleMap[role] || roleMap.ROLE_USER;
    return (
      <span
        style={{
          ...currentStyles.roleBadge,
          backgroundColor: roleInfo.color,
          color: "#fff",
        }}
      >
        {roleInfo.label}
      </span>
    );
  };

  return (
    <div style={currentStyles.container} className="sysadmin-container">
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
      <div style={currentStyles.mobileHeader} className="mobile-header">
        <button
          style={currentStyles.hamburgerButton}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
          className="hamburger-btn"
        >
          {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <div style={currentStyles.mobileLogoContainer}>
          <div style={currentStyles.logoIcon}>
            <img src={logoIconOrange || "/placeholder.svg"} alt="Logo" />
          </div>
          <span style={currentStyles.logoText}>Civilify</span>
        </div>
        <div style={{ width: "40px" }} />
      </div>

      {isSidebarOpen && (
        <div
          style={currentStyles.sidebarOverlay}
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        style={{
          ...currentStyles.sidebar,
          ...(window.innerWidth <= 768
            ? {
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
                transition: "transform 0.3s ease",
              }
            : {}),
        }}
        className="sysadmin-sidebar"
      >
        <div style={currentStyles.sidebarHeader}>
          <div style={currentStyles.logoContainer}>
            <div style={currentStyles.logoIcon}>
              <img src={logoIconOrange || "/placeholder.svg"} alt="Logo" />
            </div>
            <span style={currentStyles.logoText}>Civilify</span>
          </div>
        </div>

        <div style={currentStyles.sidebarContent}>
          <div style={currentStyles.sidebarSection}>
            <div style={currentStyles.sectionTitle}>
              <FaCrown
                style={{
                  marginRight: "8px",
                  color: "#8b5cf6",
                  fontSize: "16px",
                }}
              />
              System Administration
            </div>
            <div style={currentStyles.sectionText}>
              Full platform control with user role management, promotion,
              demotion, and system-wide oversight capabilities.
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.info("Adding patches feature coming soon")}
          style={currentStyles.patchButton}
          className="patch-button-hover"
        >
          <FaTools style={{ marginRight: "8px", color: "#8b5cf6" }} />
          Add New Patch
        </button>
        <div style={currentStyles.sidebarFooter}>
          <div style={currentStyles.sidebarUser}>
            {userData.avatar}
            <div style={currentStyles.sidebarUserInfo}>
              <div style={currentStyles.sidebarUserName}>{userData.name}</div>
              <div style={currentStyles.sidebarUserEmail}>{userData.email}</div>
            </div>
          </div>
          <div style={currentStyles.sidebarActions}>
            <button
              onClick={toggleTheme}
              style={currentStyles.sidebarActionBtn}
              className="sidebar-action-hover"
              aria-label="Toggle theme"
              title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
            >
              {theme === "dark" ? <FaMoon size={16} /> : <FaSun size={16} />}
            </button>

            {/* Settings button removed as requested */}
            <button
              onClick={handleLogout}
              style={currentStyles.sidebarActionBtn}
              className="sidebar-action-hover"
              aria-label="Logout"
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          ...currentStyles.mainContent,
          marginLeft: windowWidth <= 768 ? 0 : "280px",
          paddingTop: windowWidth <= 768 ? "88px" : "32px",
        }}
        className="main-content-system"
      >
        <div style={currentStyles.topBar} className="top-bar">
          <div>
            <h1 style={currentStyles.pageTitle} className="page-title">
              System Administration
            </h1>
            <p style={currentStyles.pageSubtitle} className="page-subtitle">
              Manage platform roles and user permissions
            </p>
          </div>
          <div
            style={currentStyles.searchContainer}
            className="search-container"
          >
            <FaSearch style={currentStyles.searchIcon} />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={currentStyles.searchInput}
              className="search-input"
            />
          </div>
        </div>

        <div style={currentStyles.statsGrid} className="stats-grid">
          <div
            style={currentStyles.statCard}
            className="stat-card stat-card-hover"
          >
            <div style={currentStyles.statIconWrapper}>
              <FaUsers
                style={{ ...currentStyles.statIcon, color: "#3b82f6" }}
              />
            </div>
            <div style={currentStyles.statContent}>
              <div style={currentStyles.statLabel}>Total Users</div>
              <div style={currentStyles.statValue}>{stats.totalUsers}</div>
            </div>
          </div>

          <div
            style={currentStyles.statCard}
            className="stat-card stat-card-hover"
          >
            <div style={currentStyles.statIconWrapper}>
              <FaCrown
                style={{ ...currentStyles.statIcon, color: "#8b5cf6" }}
              />
            </div>
            <div style={currentStyles.statContent}>
              <div style={currentStyles.statLabel}>System Admins</div>
              <div style={currentStyles.statValue}>{stats.systemAdmins}</div>
            </div>
          </div>

          <div
            style={currentStyles.statCard}
            className="stat-card stat-card-hover"
          >
            <div style={currentStyles.statIconWrapper}>
              <FaUserShield
                style={{ ...currentStyles.statIcon, color: "#F34D01" }}
              />
            </div>
            <div style={currentStyles.statContent}>
              <div style={currentStyles.statLabel}>Administrators</div>
              <div style={currentStyles.statValue}>{stats.adminUsers}</div>
            </div>
          </div>

          <div
            style={currentStyles.statCard}
            className="stat-card stat-card-hover"
          >
            <div style={currentStyles.statIconWrapper}>
              <FaUserCog
                style={{ ...currentStyles.statIcon, color: "#10b981" }}
              />
            </div>
            <div style={currentStyles.statContent}>
              <div style={currentStyles.statLabel}>Regular Users</div>
              <div style={currentStyles.statValue}>{stats.regularUsers}</div>
            </div>
          </div>
        </div>

        {error && (
          <div style={currentStyles.errorMessage}>
            <span>Error: {error}</span>
            <button
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
              style={currentStyles.retryButton}
              className="primary-button-hover"
            >
              Retry
            </button>
          </div>
        )}

        <div style={currentStyles.tableCard} className="table-card">
          <div style={currentStyles.tableHeader}>
            <h2 style={currentStyles.tableTitle}>All Platform Users</h2>
            <div style={currentStyles.tableBadge}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
            </div>
          </div>

          {isLoading ? (
            <div style={currentStyles.loadingContainer}>
              <div style={currentStyles.loadingSpinner}></div>
              <p style={currentStyles.loadingText}>Loading users...</p>
            </div>
          ) : (
            <>
              <div style={currentStyles.tableWrapper} className="table-wrapper">
                <table style={currentStyles.table}>
                  <thead>
                    <tr>
                      <th style={currentStyles.tableHead}>Email</th>
                      <th style={currentStyles.tableHead}>Username</th>
                      <th style={currentStyles.tableHead}>Role</th>
                      <th style={currentStyles.tableHead}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const role = user.role || "ROLE_USER";
                      const isBusyPromote =
                        actionBusy === user.userId + ":ROLE_ADMIN";
                      const isBusyDemote =
                        actionBusy === user.userId + ":ROLE_USER";
                      const isBusyDelete =
                        actionBusy === user.userId + ":DELETE";

                      return (
                        <tr
                          key={user.userId}
                          style={currentStyles.tableRow}
                          className="table-row"
                        >
                          <td style={currentStyles.tableCell}>{user.email}</td>
                          <td style={currentStyles.tableCell}>
                            <div style={currentStyles.usernameBold}>
                              {user.username}
                            </div>
                          </td>
                          <td style={currentStyles.tableCell}>
                            {getRoleBadge(role)}
                          </td>
                          <td style={currentStyles.tableCell}>
                            <div style={currentStyles.actionButtons}>
                              {role === "ROLE_USER" && (
                                <button
                                  onClick={() =>
                                    updateRole(user.userId, "ROLE_ADMIN")
                                  }
                                  style={currentStyles.promoteButton}
                                  className="promote-button-hover"
                                  disabled={isBusyPromote}
                                >
                                  {isBusyPromote ? (
                                    <>
                                      <span className="btn-spinner" />
                                      Promoting...
                                    </>
                                  ) : (
                                    <>
                                      <FaArrowUp
                                        style={{ marginRight: "6px" }}
                                      />
                                      Promote
                                    </>
                                  )}
                                </button>
                              )}
                              {role === "ROLE_ADMIN" && (
                                <button
                                  onClick={() =>
                                    updateRole(user.userId, "ROLE_USER")
                                  }
                                  style={currentStyles.demoteButton}
                                  className="demote-button-hover"
                                  disabled={isBusyDemote}
                                >
                                  {isBusyDemote ? (
                                    <>
                                      <span className="btn-spinner" />
                                      Demoting...
                                    </>
                                  ) : (
                                    <>
                                      <FaArrowDown
                                        style={{ marginRight: "6px" }}
                                      />
                                      Demote
                                    </>
                                  )}
                                </button>
                              )}
                              {role !== "ROLE_SYSTEM_ADMIN" &&
                                !(
                                  user.userId === currentUserId ||
                                  user.email === currentUserEmail
                                ) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteUser(user.userId)
                                    }
                                    style={currentStyles.deleteButton}
                                    className="danger-button-hover"
                                    disabled={isBusyDelete}
                                  >
                                    <FaTrash style={{ marginRight: "6px" }} />
                                    Delete
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={currentStyles.mobileCardContainer}
                className="mobile-card-container"
              >
                {filteredUsers.map((user) => {
                  const role = user.role || "ROLE_USER";
                  const isBusyPromote =
                    actionBusy === user.userId + ":ROLE_ADMIN";
                  const isBusyDemote =
                    actionBusy === user.userId + ":ROLE_USER";
                  const isBusyDelete = actionBusy === user.userId + ":DELETE";

                  return (
                    <div
                      key={user.userId}
                      style={currentStyles.mobileCard}
                      className="mobile-card"
                    >
                      <div style={currentStyles.mobileCardHeader}>
                        <div>
                          <div style={currentStyles.mobileCardUsername}>
                            {user.username}
                          </div>
                          <div style={currentStyles.mobileCardEmail}>
                            {user.email}
                          </div>
                        </div>
                        {getRoleBadge(role)}
                      </div>
                      <div style={currentStyles.mobileActionButtons}>
                        {role === "ROLE_USER" && (
                          <button
                            onClick={() =>
                              updateRole(user.userId, "ROLE_ADMIN")
                            }
                            style={currentStyles.mobilePromoteButton}
                            className="promote-button-hover"
                            disabled={isBusyPromote}
                          >
                            {isBusyPromote ? (
                              <>
                                <span className="btn-spinner" />
                                Promoting...
                              </>
                            ) : (
                              <>
                                <FaArrowUp style={{ marginRight: "8px" }} />
                                Promote to Admin
                              </>
                            )}
                          </button>
                        )}
                        {role === "ROLE_ADMIN" && (
                          <button
                            onClick={() => updateRole(user.userId, "ROLE_USER")}
                            style={currentStyles.mobileDemoteButton}
                            className="demote-button-hover"
                            disabled={isBusyDemote}
                          >
                            {isBusyDemote ? (
                              <>
                                <span className="btn-spinner" />
                                Demoting...
                              </>
                            ) : (
                              <>
                                <FaArrowDown style={{ marginRight: "8px" }} />
                                Demote to User
                              </>
                            )}
                          </button>
                        )}
                        {role !== "ROLE_SYSTEM_ADMIN" &&
                          !(
                            user.userId === currentUserId ||
                            user.email === currentUserEmail
                          ) && (
                            <button
                              onClick={() => handleDeleteUser(user.userId)}
                              style={currentStyles.mobileDeleteButton}
                              className="danger-button-hover"
                              disabled={isBusyDelete}
                            >
                              <FaTrash style={{ marginRight: "8px" }} />
                              Delete User
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div style={currentStyles.modal} className="modal">
          <div
            style={currentStyles.modalContent}
            className="modal-content modal-content-animate"
          >
            <h2 style={currentStyles.modalTitle}>
              Delete {users.find((u) => u.userId === selectedUser)?.username}?
            </h2>
            <p style={currentStyles.modalText}>
              This user will permanently lose access to their account and all
              associated data. This action cannot be undone.
            </p>
            <div style={currentStyles.modalButtons} className="modal-buttons">
              <button
                onClick={cancelDelete}
                style={currentStyles.cancelButton}
                className="cancel-button-hover"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                style={currentStyles.confirmButton}
                className="confirm-button-hover"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div style={currentStyles.logoutModal} className="modal">
          <div
            style={currentStyles.logoutModalContent}
            className="modal-content modal-content-animate"
          >
            <h2 style={currentStyles.logoutModalTitle}>Logout</h2>
            <div style={currentStyles.logoutModalText}>
              Are you sure you want to logout?
            </div>
            <div
              style={currentStyles.logoutModalButtons}
              className="modal-buttons"
            >
              <button
                style={{
                  ...currentStyles.logoutNoButton,
                  background: logoutNoHovered
                    ? isDarkMode
                      ? "#2a2a2a"
                      : "#f2f2f2"
                    : isDarkMode
                    ? "#1f1f1f"
                    : "#fff",
                  transform: logoutNoHovered ? "scale(0.98)" : "scale(1)",
                }}
                onClick={() => handleLogoutConfirm(false)}
                onMouseEnter={() => setLogoutNoHovered(true)}
                onMouseLeave={() => setLogoutNoHovered(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...currentStyles.logoutYesButton,
                  background: logoutYesHovered ? "#e04000" : "#F34D01",
                  transform: logoutYesHovered ? "scale(0.98)" : "scale(1)",
                }}
                onClick={() => handleLogoutConfirm(true)}
                onMouseEnter={() => setLogoutYesHovered(true)}
                onMouseLeave={() => setLogoutYesHovered(false)}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = (isDarkMode) => ({
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: isDarkMode ? "#0a0a0a" : "#f5f7fa",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "background-color 0.3s ease",
  },
  mobileHeader: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderBottom: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    zIndex: 999,
    boxShadow: isDarkMode
      ? "0 2px 8px rgba(0,0,0,0.3)"
      : "0 2px 8px rgba(0,0,0,0.05)",
  },
  hamburgerButton: {
    background: "none",
    border: "none",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  mobileLogoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sidebarOverlay: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 998,
  },
  sidebar: {
    width: "280px",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderRight: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    borderRadius: "0 12px 12px 0",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    position: "fixed",
    height: "100vh",
    left: 0,
    top: 0,
    transition: "transform 0.3s ease",
    boxShadow: isDarkMode
      ? "2px 0 12px rgba(0,0,0,0.3)"
      : "2px 0 12px rgba(0,0,0,0.05)",
    zIndex: 1000,
  },
  sidebarHeader: {
    marginBottom: "32px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
  },
  logoText: {
    fontSize: "24px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #F34D01 0%, #ff6b3d 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  sidebarContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  sidebarSection: {
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: isDarkMode ? "#0f0f0f" : "#f9fafb",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
  },
  sectionText: {
    fontSize: "13px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    lineHeight: "1.6",
  },
  sidebarFooter: {
    borderTop: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    paddingTop: "20px",
    marginTop: "20px",
  },
  sidebarUser: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  sidebarUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  sidebarUserName: {
    fontSize: "14px",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sidebarUserEmail: {
    fontSize: "12px",
    color: isDarkMode ? "#6b7280" : "#9ca3af",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sidebarActions: {
    display: "flex",
    gap: "8px",
  },
  sidebarActionBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6",
    color: isDarkMode ? "#a0a0a0" : "#6b7280",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    flex: 1,
    marginLeft: "280px",
    padding: "32px",
    minHeight: "100vh",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    gap: "24px",
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    margin: 0,
    marginBottom: "4px",
  },
  pageSubtitle: {
    fontSize: "15px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    margin: 0,
  },
  searchContainer: {
    position: "relative",
    width: "320px",
    maxWidth: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: isDarkMode ? "#6b7280" : "#9ca3af",
    fontSize: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px 12px 44px",
    borderRadius: "12px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    boxShadow: isDarkMode
      ? "0 1px 3px rgba(0,0,0,0.3)"
      : "0 1px 3px rgba(0,0,0,0.05)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    boxShadow: isDarkMode
      ? "0 2px 8px rgba(0,0,0,0.3)"
      : "0 2px 8px rgba(0,0,0,0.05)",
  },
  statIconWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: {
    fontSize: "24px",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: isDarkMode ? "#ffffff" : "#1f2937",
  },
  tableCard: {
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderRadius: "16px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    overflow: "hidden",
    boxShadow: isDarkMode
      ? "0 2px 8px rgba(0,0,0,0.3)"
      : "0 2px 8px rgba(0,0,0,0.05)",
  },
  tableHeader: {
    padding: "24px",
    borderBottom: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    margin: 0,
  },
  tableBadge: {
    padding: "6px 12px",
    borderRadius: "8px",
    backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6",
    color: isDarkMode ? "#a0a0a0" : "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
  },
  tableWrapper: {
    overflowX: "auto",
    display: "block",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHead: {
    padding: "16px 24px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: isDarkMode ? "#0a0a0a" : "#f9fafb",
    borderBottom: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
  },
  tableRow: {
    borderBottom: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    transition: "all 0.2s ease",
  },
  tableCell: {
    padding: "16px 24px",
    fontSize: "14px",
    color: isDarkMode ? "#d1d5db" : "#374151",
  },
  usernameBold: {
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#1f2937",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  promoteButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  demoteButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  mobileCardContainer: {
    display: "none",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
  },
  mobileCard: {
    backgroundColor: isDarkMode ? "#0f0f0f" : "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
  },
  mobileCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "12px",
  },
  mobileCardUsername: {
    fontSize: "16px",
    fontWeight: "600",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    marginBottom: "4px",
  },
  mobileCardEmail: {
    fontSize: "13px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
  },
  mobileActionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mobilePromoteButton: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  mobileDemoteButton: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  mobileDeleteButton: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  errorMessage: {
    backgroundColor: isDarkMode ? "#3d1a1a" : "#fee2e2",
    color: isDarkMode ? "#ff6b6b" : "#b91c1c",
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: isDarkMode ? "1px solid #5a2a2a" : "1px solid #fecaca",
  },
  retryButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: isDarkMode ? "#ff6b6b" : "#b91c1c",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: isDarkMode ? "4px solid #2a2a2a" : "4px solid #e5e7eb",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    fontSize: "14px",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "480px",
    width: "100%",
    boxShadow: isDarkMode
      ? "0 20px 60px rgba(0,0,0,0.5)"
      : "0 20px 60px rgba(0,0,0,0.15)",
    border: isDarkMode ? "1px solid #2a2a2a" : "none",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    marginBottom: "12px",
  },
  modalText: {
    fontSize: "15px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    lineHeight: "1.6",
    marginBottom: "28px",
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  cancelButton: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6",
    color: isDarkMode ? "#ffffff" : "#374151",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  confirmButton: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  logoutModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
  },
  logoutModalContent: {
    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    boxShadow: isDarkMode
      ? "0 20px 60px rgba(0,0,0,0.5)"
      : "0 20px 60px rgba(0,0,0,0.15)",
    border: isDarkMode ? "1px solid #2a2a2a" : "none",
  },
  logoutModalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    marginBottom: "12px",
  },
  logoutModalText: {
    fontSize: "15px",
    color: isDarkMode ? "#9ca3af" : "#6b7280",
    marginBottom: "28px",
  },
  logoutModalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  logoutNoButton: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    color: isDarkMode ? "#ffffff" : "#374151",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  logoutYesButton: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "none",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  patchButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6",
    color: isDarkMode ? "#ffffff" : "#1f2937",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    marginTop: "12px",
  },
});

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .modal-content-animate {
    animation: slideIn 0.2s ease-out;
  }
  
  body.dark-mode .sidebar-action-hover:hover {
    background-color: #232323 !important;
    color: #8b5cf6 !important;
    transform: translateY(-2px);
  }

  body.light-mode .sidebar-action-hover:hover {
    background-color: #f9fafb !important;
    color: #8b5cf6 !important;
    transform: translateY(-2px);
  }
  
  .stat-card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
  }
  
  body.dark-mode .table-row:hover {
    background-color: #232323 !important;
  }
  
  body.light-mode .table-row:hover {
    background-color: #f9fafb !important;
  }
  
  .search-input:focus {
    border-color: #8b5cf6 !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
  }
  
  .promote-button-hover:hover {
    background-color: #059669 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
  }
  
  .demote-button-hover:hover {
    background-color: #d97706 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important;
  }
  
  .danger-button-hover:hover {
    background-color: #dc2626 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
  }
  
  .confirm-button-hover:hover {
    background-color: #dc2626 !important;
    transform: translateY(-2px);
  }
  
  .cancel-button-hover:hover {
    background-color: #3a3a3a !important;
    transform: translateY(-2px);
  }
  
  .primary-button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  .hamburger-btn:hover {
    background-color: rgba(139, 92, 246, 0.1) !important;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .mobile-header {
      display: flex !important;
    }
    
    .sysadmin-sidebar {
      transform: translateX(-100%);
    }
    
    .sidebar-overlay {
      display: block !important;
    }
    
    .main-content-system {
      margin-left: 0 !important;
      padding: 88px 16px 24px 16px !important;
    }
    
    .top-bar {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    
    .page-title {
      font-size: 24px !important;
    }
    
    .page-subtitle {
      font-size: 14px !important;
    }
    
    .search-container {
      width: 100% !important;
    }
    
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
    
    .table-wrapper {
      display: none !important;
    }
    
    .mobile-card-container {
      display: flex !important;
    }
    
    .modal-content, .logoutModalContent {
      padding: 24px !important;
      margin: 0 16px !important;
    }
    
    .modal-buttons {
      flex-direction: column !important;
    }
    
    .modal-buttons button {
      width: 100% !important;
    }
      .patch-button-hover:hover {
  background-color: #8b5cf6 !important;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
}
  }

  @media (max-width: 480px) {
    .stat-card {
      padding: 20px !important;
    }
    
    .page-title {
      font-size: 20px !important;
    }
    
    .mobile-header {
      padding: 0 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

if (!document.getElementById("sysadmin-no-horizontal-scroll-style")) {
  const style = document.createElement("style");
  style.id = "sysadmin-no-horizontal-scroll-style";
  style.textContent = `
    html, body, #root {
      overscroll-behavior-x: none !important;
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }
    body {
      width: 100vw !important;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  document.head.appendChild(style);
}

export default SystemAdminPage;
