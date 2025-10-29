"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthData } from "../utils/auth";
import { API_URL } from "../utils/auth";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  FaSearch,
  FaSignOutAlt,
  FaTrash,
  FaUser,
  FaMoon,
  FaSun,
  FaUsers,
  FaUserShield,
  FaCog,
  FaLaptop,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logoIconOrange from "../assets/images/logoiconorange.png";

const Admin = () => {
  const navigate = useNavigate();

  // === THEME STATE ===
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("adminTheme") || "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("adminTheme");
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
      localStorage.setItem("adminTheme", next);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutYesHovered, setLogoutYesHovered] = useState(false);
  const [logoutNoHovered, setLogoutNoHovered] = useState(false);

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === "ROLE_ADMIN").length,
    regularUsers: users.filter((u) => u.role !== "ROLE_ADMIN").length,
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.role !== "ROLE_ADMIN") {
      navigate("/");
      return;
    }

    const formattedUserData = {
      username: user.username,
      email: user.email,
      profile_picture_url: user.profilePictureUrl || user.profile_picture_url,
    };

    setUserData({
      name: user.username || "Admin User",
      email: user.email || "admin@example.com",
      avatar: <ProfileAvatar size="medium" userData={formattedUserData} />,
    });
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  useEffect(() => {
    document.title = "Civilify | Admin";
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
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

  const handleDeleteUser = async (userId) => {
    setSelectedUser(userId);
    setConfirmDelete(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("authToken");
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

  // Update window width on resize
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

  return (
    <div style={currentStyles.container} className="admin-container">
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
        className="admin-sidebar"
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
            <div style={currentStyles.sectionTitle}>Overview</div>
            <div style={currentStyles.sectionText}>
              Manage users, monitor activity, and maintain system health from
              this central dashboard.
            </div>
          </div>
        </div>

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
              {theme === "dark" ? (
                <FaMoon size={16} />
              ) : theme === "light" ? (
                <FaSun size={16} />
              ) : (
                <FaLaptop size={16} />
              )}
            </button>

            <button
              onClick={() => {
                localStorage.setItem("forceLightMode", "true");
                navigate("/edit-profile");
              }}
              style={currentStyles.sidebarActionBtn}
              className="sidebar-action-hover"
              aria-label="Edit profile"
            >
              <FaCog size={16} />
            </button>
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
        className="main-content"
      >
        <div style={currentStyles.topBar} className="top-bar">
          <div>
            <h1 style={currentStyles.pageTitle} className="page-title">
              User Management
            </h1>
            <p style={currentStyles.pageSubtitle} className="page-subtitle">
              Monitor and manage all registered users
            </p>
          </div>
          <div
            style={currentStyles.searchContainer}
            className="search-container"
          >
            <FaSearch style={currentStyles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
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
              <FaUser style={{ ...currentStyles.statIcon, color: "#10b981" }} />
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
            <h2 style={currentStyles.tableTitle}>All Users</h2>
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
                    {filteredUsers.map((user) => (
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
                          <span
                            style={{
                              ...currentStyles.roleBadge,
                              backgroundColor:
                                user.role === "ROLE_ADMIN"
                                  ? "#F34D01"
                                  : "#10b981",
                              color: "#fff",
                            }}
                          >
                            {user.role === "ROLE_ADMIN" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td style={currentStyles.tableCell}>
                          <button
                            onClick={() => handleDeleteUser(user.userId)}
                            style={currentStyles.deleteButton}
                            className="danger-button-hover"
                          >
                            <FaTrash style={{ marginRight: "6px" }} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={currentStyles.mobileCardContainer}
                className="mobile-card-container"
              >
                {filteredUsers.map((user) => (
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
                      <span
                        style={{
                          ...currentStyles.roleBadge,
                          backgroundColor:
                            user.role === "ROLE_ADMIN" ? "#F34D01" : "#10b981",
                          color: "#fff",
                        }}
                      >
                        {user.role === "ROLE_ADMIN" ? "Admin" : "User"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.userId)}
                      style={currentStyles.mobileDeleteButton}
                      className="danger-button-hover"
                    >
                      <FaTrash style={{ marginRight: "8px" }} />
                      Delete User
                    </button>
                  </div>
                ))}
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
              This user will not be able to retrieve their account, including
              their previous session. This action cannot be undone.
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
    borderTop: "4px solid #F34D01",
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
    color: #F34D01 !important;
    transform: translateY(-2px);
  }

  body.light-mode .sidebar-action-hover:hover {
    background-color: #f9fafb !important;
    color: #F34D01 !important;
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
    border-color: #F34D01 !important;
    box-shadow: 0 0 0 3px rgba(243, 77, 1, 0.1) !important;
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
    background-color: rgba(243, 77, 1, 0.1) !important;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .mobile-header {
      display: flex !important;
    }
    
    .admin-sidebar {
    transform: translateX(-100%);
  }
    
    .sidebar-overlay {
      display: block !important;
    }
    
    .main-content {
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
    
    .modal-content, .modal-content {
      padding: 24px !important;
      margin: 0 16px !important;
    }
    
    .modal-buttons {
      flex-direction: column !important;
    }
    
    .modal-buttons button {
      width: 100% !important;
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

if (!document.getElementById("admin-no-horizontal-scroll-style")) {
  const style = document.createElement("style");
  style.id = "admin-no-horizontal-scroll-style";
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

export default Admin;
