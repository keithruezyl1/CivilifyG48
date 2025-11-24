"use client";

import { useState, useEffect } from "react";
import LogoIcon from "../assets/images/logoicongradient.png";

// Define all styles as JS objects
const styles = {
  // Global styles (will be applied via useEffect)
  globalStyles: `
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
    
    button:focus, input:focus, a:focus, div[role="button"]:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    
    button, input, a, div[role="button"] {
      -webkit-tap-highlight-color: transparent;
    }
    
    button::-moz-focus-inner {
      border: 0;
    }
  `,

  // Component styles
  docsPage: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    paddingTop: "4rem", // Account for fixed appbar
  },

  appbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "4rem",
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1rem",
    zIndex: 1000,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
  },

  logo: {
    height: "1em !important",
    cursor: "pointer",
  },

  hamburgerButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "0.375rem",
    transition: "background-color 0.2s ease",
    display: "flex", // Ensuring button is always displayed as flex
    alignItems: "center",
    justifyContent: "center",
    // Always visible, no media query hiding
  },

  sidebarOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1001,
    display: "flex",
    justifyContent: "flex-end",
    transition: "background 0.3s ease",
  },

  sidebar: (isCollapsed, isMobile) => ({
    width: isMobile ? "80%" : "20rem",
    maxWidth: "80%",
    height: "100vh",
    backgroundColor: "#fff",
    boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
    borderRadius: "20px 0 0px 20px",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    right: 0,
    top: 0,
    overflowY: "auto",
    overflowX: "hidden",
    transition: "transform 0.3s ease-out",
    transform: isCollapsed ? "translateX(100%)" : "translateX(0)",
  }),

  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "2rem",
    cursor: "pointer",
    color: "#6b7280",
    padding: "0.25rem",
    borderRadius: "0.25rem",
    transition: "color 0.2s ease",
  },

  sidebarLinks: {
    marginTop: "3rem", // More space for close button
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
    overflowY: "auto",
  },

  navItem: {
    width: "100%",
    padding: "0.75rem 1rem",
    textAlign: "left",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "0.95rem",
    fontWeight: "500",
  },

  navItemSelected: {
    backgroundColor: "#F34D01",
    color: "white",
  },

  navItemUnselected: {
    backgroundColor: "transparent",
    color: "#374151",
  },

  content: {
    flex: 1,
    padding: "2rem",
    maxWidth: "100%",
    overflowY: "auto",
    minHeight: "calc(100vh - 4rem)",
    backgroundColor: "white",
    // margin: "1rem",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  backLink: {
    marginTop: "auto",
    // paddingTop: "1rem",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    flex: 0.5,
    fontSize: "1rem",
    fontWeight: "500",
  },

  // Original styles that are not being changed
  docsPageOriginal: {
    maxWidth: "none",
    margin: 0,
    padding: 0,
    textAlign: "left",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "stretch",
    width: "100%",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    color: "black",
  },

  sidebarOriginal: {
    position: "fixed",
    height: "100vh",
    width: "18rem",
    overflowY: "auto",
    overflowX: "hidden",
    borderRight: "1px solid #e5e7eb",
    backgroundColor: "white",
    zIndex: 10,
  },

  contentOriginal: {
    overflowY: "auto",
    minHeight: "100vh",
    padding: "2rem",
    width: "calc(100% - 18rem)",
    marginLeft: "18rem",
    paddingLeft: "2rem",
  },

  backLinkOriginal: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: "0.75rem",
    borderTop: "1px solid #f1f1f1",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#F34D01",
  },

  navItemOriginal: {
    width: "100%",
    textAlign: "left",
    padding: "0.5rem",
    transition: "all 0.2s",
    backgroundColor: "transparent",
    borderRadius: 0,
    fontSize: "1rem",
  },

  navItemSelectedOriginal: {
    color: "#F34D01",
    borderLeft: "2px solid #F34D01",
    paddingLeft: "0.75rem",
    fontWeight: 600,
  },

  navItemUnselectedOriginal: {
    color: "#4B5563",
  },

  contentHeader: {
    paddingBottom: "1.5rem",
  },

  contentHeaderTitle: {
    fontSize: "2.25rem",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "1rem",
  },

  contentDivider: {
    height: "0.125rem",
    width: "100%",
    backgroundColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: "#1F2937",
  },

  sectionDescription: {
    fontSize: "1.125rem",
    color: "#4B5563",
    marginBottom: "1.5rem",
  },

  codeBlock: {
    overflowX: "auto",
    borderRadius: "0.375rem",
    backgroundColor: "#1e293b",
    padding: "1rem",
    margin: "1rem 0",
    color: "white",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  collapsibleSection: {
    marginBottom: "1.5rem",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    overflow: "visible",
  },

  collapsibleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    borderBottom: "1px solid #e5e7eb",
  },

  collapsibleHeaderOpen: {
    borderBottom: "1px solid #e5e7eb",
  },

  collapsibleHeaderClosed: {
    borderBottom: "none",
  },

  collapsibleTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#111827",
    display: "flex",
    alignItems: "center",
  },

  collapsibleIcon: {
    width: "1.25rem",
    height: "1.25rem",
    transition: "transform 0.2s ease",
  },

  collapsibleIconOpen: {
    transform: "rotate(180deg)",
  },

  collapsibleBody: {
    padding: "1rem",
    backgroundColor: "white",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.5rem",
    backgroundColor: "#e9ecef",
    color: "#495057",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "500",
    margin: "0.25rem",
  },

  badgeIcon: {
    marginRight: "0.25rem",
  },

  disclaimer: {
    padding: "1rem",
    backgroundColor: "#fff8f5",
    border: "1px solid #feeae1",
    borderRadius: "0.375rem",
    color: "#d47706",
    fontSize: "0.875rem",
    fontStyle: "italic",
    marginTop: "1rem",
    marginBottom: "1rem",
  },

  // Add a style for navigation links between sections
  nextSectionLink: {
    display: "block",
    margin: "0.5rem 0 1.5rem 0", // More space below to ensure visibility
    padding: "0.5rem 1rem",
    color: "#F34D01",
    textAlign: "right",
    fontSize: "0.875rem",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: "500",
    position: "relative",
    zIndex: "5",
  },

  // Theme variants (light / dark)
  light: {
    primary: "#F34D01",
    background: "#f9fafb",
    pageBg: "#f9fafb",
    appbarBg: "#ffffff",
    sidebarBg: "#ffffff",
    contentBg: "#ffffff",
    text: "#111827",
    subtle: "#4B5563",
    muted: "#6b7280",
    border: "#e5e7eb",
    cardBg: "#fff8f5",
    cardBorder: "#feeae1",
    codeBg: "#1e293b",
    disclaimerBg: "#fff8f5",
    disclaimerBorder: "#feeae1",
    link: "#3b82f6",
    navLinkBg: "#FFF8F5",
    overlay: "rgba(0,0,0,0.5)",
  },

  dark: {
    primary: "#FF8A4B", // This orange seems to be from the original design
    background: "#1c1c1c", // Dark background from your image
    pageBg: "#1c1c1c", // Dark background from your image
    appbarBg: "#1c1c1c", // Dark background from your image
    sidebarBg: "#1c1c1c", // Dark background from your image
    contentBg: "#1c1c1c", // Dark background from your image
    text: "#e0e0e0", // Lighter text color to contrast with the dark background
    subtle: "#b0b0b0", // Slightly darker subtle text
    muted: "#8a8a8a", // Muted text
    border: "#424242", // Border color
    cardBg: "#292929", // Card background, slightly lighter than main background
    cardBorder: "#424242", // Card border
    codeBg: "#292929", // Code block background
    disclaimerBg: "#292929", // Disclaimer background
    disclaimerBorder: "#424242", // Disclaimer border
    link: "#FF8A4B", // Keeping the primary orange for links
    navLinkBg: "#292929", // Navigation link background
    overlay: "rgba(0,0,0,0.6)",
  },
  logo: {
    height: "64px",
  },
};

// For media queries and other special CSS that can't be easily represented as inline styles
const createGlobalStyles = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    @media (max-width: 768px) {
      .content {
        margin-left: 0;
        max-width: 100%;
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
    
    .navigation-link {
      margin-top: 2rem !important;
      padding: 0.75rem 1rem !important;
      background-color: #fff8f5 ;
      border: 1px solid #feeae1;
      border-radius: 0.375rem !important;
      text-align: right !important;
      font-weight: 500 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
      position: relative !important;
      z-index: 50 !important;
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;
      clear: both !important;
    }
  .navigation-link:hover {
      background-color: #fff2ea !important; 
      cursor: pointer !important;
    }

    /* Dark Mode Hover (Conditional via [data-theme]) */
    [data-theme="dark"] .navigation-link:hover {
      background-color: #363636 !important; /* Lighter dark-gray for hover effect */
    }
    
    /* Ensure collapsible sections don't hide anything outside of them */
    .collapsibleSection {
      overflow: visible !important;
    }
    
    /* Ensure section containers properly display all content */
    .section-container {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }
    
    /* Force navigation links to be visible */
    .section-container > .navigation-link {
      opacity: 1 !important;
      height: auto !important;
    }
  `;
  return style;
};

// CollapsibleSection component
const CollapsibleSection = ({ title, children, icon, isLast, theme }) => {
  const [isOpen, setIsOpen] = useState(true);
  const effectiveTheme =
    theme ||
    (typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? styles.dark
      : styles.light);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  // Derived styles using theme
  const headerStyle = {
    ...styles.collapsibleHeader,
    backgroundColor: effectiveTheme.cardBg,
    borderBottom: `1px solid ${effectiveTheme.border}`,
    cursor: "pointer",
  };

  const titleStyle = {
    ...styles.collapsibleTitle,
    color: effectiveTheme.text,
  };

  const iconStyle = {
    ...styles.collapsibleIcon,
    color: effectiveTheme.primary,
    fill: effectiveTheme.primary,
    ...(isOpen ? styles.collapsibleIconOpen : {}),
  };

  const sectionStyle = {
    ...styles.collapsibleSection,
    border: `1px solid ${effectiveTheme.border}`,
    backgroundColor: effectiveTheme.contentBg,
  };

  const bodyStyle = {
    ...styles.collapsibleBody,
    backgroundColor: effectiveTheme.contentBg,
    color: effectiveTheme.subtle,
  };

  return (
    <div
      className="collapsibleSection"
      style={{
        ...sectionStyle,
        marginBottom: isLast ? "0" : "1rem", // No margin if it's the last section
      }}
    >
      <div
        style={{
          ...(isOpen ? headerStyle : { ...headerStyle, borderBottom: "none" }),
        }}
        onClick={toggleSection}
      >
        <h3 style={titleStyle}>{title}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={iconStyle}
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {isOpen && (
        <div className="collapsible-body" style={bodyStyle}>
          {children}
        </div>
      )}
    </div>
  );
};

// Sample documentation items for the sidebar
const sidebarItems = [
  {
    id: "what-is",
    title: "What is Civilify?",
    content:
      "Civilify is an AI-powered legal assistant that helps you with both general legal questions and case-specific analysis. Choose between General Legal Information mode for quick answers, or Case Analysis mode for a detailed assessment of your situation.",
  },
  {
    id: "why-use",
    title: "Why Use Civilify?",
    content:
      "Legal advice is expensive and inaccessible to many. Civilify bridges that gap by offering an AI-powered assistant that answers legal questions clearly and affordably, whether you need general information or a case assessment.",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    content:
      "Learn how to start using Civilify in just a few simple steps. Choose your mode, ask your question, and get AI-powered legal insights.",
  },
  {
    id: "security",
    title: "Security and Privacy",
    content: "At Civilify, your data security and privacy come first.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & Support",
    content:
      "Having issues? Here are common fixes for problems you might encounter while using Civilify.",
  },
];

const CivilifyDocuments = () => {
  const [selectedItem, setSelectedItem] = useState("getting-started");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initial check for system preference
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }); // Removed unused state variables: fromSignup, navigate
  // Apply global styles
  useEffect(() => {
    document.body.style.overflow = "scroll";
    document.body.style.height = "100vh";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    // Add global styles
    const style = document.createElement("style");
    style.textContent = styles.globalStyles;
    document.head.appendChild(style);

    // Add media query styles
    const mediaStyles = createGlobalStyles();
    document.head.appendChild(mediaStyles);

    // Check for mobile screen size
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      if (document.head.contains(mediaStyles)) {
        document.head.removeChild(mediaStyles);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    document.title = "Civilify | Documents";
  }, []);

  // Listen to website theme changes (data-theme or class on <html>) and apply when user has no explicit preference
  useEffect(() => {
    document.title = "Civilify | Documents";
  }, []); // Listen to OS system theme changes

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    }; // Setup event listener

    mediaQuery.addEventListener("change", handleThemeChange); // Cleanup listener

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleItemSelect = (itemId) => {
    setSelectedItem(itemId);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // Navigation link component to ensure consistent visibility
  const NavigationLink = ({ targetId, title }) => {
    const theme = isDarkMode ? styles.dark : styles.light;
    return (
      <button
        className="navigation-link"
        style={{
          display: "block",
          width: "100%",
          margin: "1rem 0", // Add space above and below
          padding: "0.5rem 1rem",
          backgroundColor: theme.cardBg, // #292929 (Lighter than background #1c1c1c)
          color: theme.primary, // #FF8A4B (The bright accent color)
          textAlign: "right",
          borderRadius: "0.375rem",
          border: `1px solid ${theme.border}`, // #424242 (Visible border)
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          position: "relative", // Use relative positioning
          zIndex: "5",
          outline: "none",
        }}
        onClick={() => handleItemSelect(targetId)}
      >
        Go to "{title}" →
      </button>
    );
  };

  // Update the section container style
  const sectionContainerStyle = {
    marginTop: "1.5rem",
    paddingBottom: "1rem", // Increased to ensure navigation is visible
    display: "flex",
    flexDirection: "column",
  };

  // theme to merge with styles where needed
  const theme = isDarkMode ? styles.dark : styles.light;

  // helper to merge sidebar function result with theme
  const sidebarStyleMerged = {
    ...styles.sidebar(isCollapsed, isMobile),
    backgroundColor: theme.sidebarBg,
    borderColor: theme.border,
  };

  return (
    <div
      style={{ ...styles.docsPage, backgroundColor: theme.pageBg }}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <nav
        style={{
          ...styles.appbar,
          backgroundColor: theme.appbarBg,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={styles.logoContainer}>
          <img
            src={LogoIcon}
            alt="Civilify Logo"
            style={{ ...styles.logo, height: "30px", marginRight: "12px" }}
          />
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: theme.primary,
            }}
          >
            Civilify Docs
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            style={{
              ...styles.hamburgerButton,
              display: "flex !important", // Force display on all screen sizes
              visibility: "visible !important", // Ensure visibility
              opacity: "1 !important", // Ensure opacity
              color: theme.primary,
            }}
            onClick={toggleSidebar}
            className="hamburger-button"
            aria-label="Open navigation"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6H21M3 12H21M3 18H21"
                stroke={theme.primary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      {!isCollapsed && (
        <div
          style={{ ...styles.sidebarOverlay, backgroundColor: theme.overlay }}
          className="sidebar-overlay"
          onClick={(e) => e.target === e.currentTarget && toggleSidebar()}
        >
          <aside style={sidebarStyleMerged} className="sidebar">
            <button
              style={{ ...styles.closeButton, color: theme.muted }}
              onClick={toggleSidebar}
              className="close-button"
            >
              ×
            </button>

            <div style={styles.sidebarLinks}>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  style={{
                    ...styles.navItem,
                    fontSize: isMobile ? "0.9rem" : "1rem",
                    ...(selectedItem === item.id
                      ? {
                          ...styles.navItemSelected,
                          backgroundColor: theme.primary,
                          color: theme.text,
                        }
                      : { ...styles.navItemUnselected, color: theme.subtle }),
                    backgroundColor:
                      selectedItem === item.id ? theme.primary : "transparent",
                  }}
                  onClick={() => handleItemSelect(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div
              style={{
                ...styles.backLink,
                borderTop: `1px solid ${theme.border}`,
              }}
              className="bottom-nav"
            >
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: theme.primary,
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => window.history.back()}
              >
                ← Back
              </button>
            </div>
          </aside>
        </div>
      )}

      <main
        style={{
          ...styles.content,
          backgroundColor: theme.contentBg,
          borderColor: theme.border,
        }}
      >
        <div style={styles.contentHeader}>
          <h1 style={{ ...styles.contentHeaderTitle, color: theme.text }}>
            Documentation
          </h1>
          <div
            style={{ ...styles.contentDivider, backgroundColor: theme.border }}
          ></div>
        </div>

        <div style={{ maxWidth: "none" }}>
          {selectedItem ? (
            <div>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>
                {sidebarItems.find((item) => item.id === selectedItem)?.title}
              </h2>
              <p style={{ ...styles.sectionDescription, color: theme.subtle }}>
                {sidebarItems.find((item) => item.id === selectedItem)?.content}
              </p>

              {/* Add the Getting Started section */}
              {selectedItem === "getting-started" && (
                <div
                  className="section-container"
                  style={sectionContainerStyle}
                >
                  <CollapsibleSection title="How to Begin" theme={theme}>
                    <ol
                      style={{
                        paddingLeft: "2rem",
                        marginBottom: "1.5rem",
                        listStyleType: "decimal",
                      }}
                    >
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Visit{" "}
                        <a
                          href="https://civilify.vercel.app"
                          style={{ color: theme.link, fontWeight: "500" }}
                        >
                          www.civilify.com
                        </a>
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Sign up for an account or sign in if you already have
                        one. Continue with Google is an option.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Enter the chat and choose your mode:{" "}
                        <strong>General Legal Information</strong> for quick
                        legal answers, or <strong>Case Analysis</strong> for a
                        detailed assessment of your situation.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Ask your question or describe your case. Villy will
                        guide you and provide insights based on your chosen
                        mode.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Review the AI-generated response, which may include a
                        case plausibility score and suggested next steps if you
                        chose Case Analysis.
                      </li>
                    </ol>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Tips for Best Results"
                    isLast={true}
                    theme={theme}
                  >
                    <ul
                      style={{
                        paddingLeft: "2rem",
                        marginBottom: "1.5rem",
                        listStyleType: "disc",
                      }}
                    >
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.75rem",
                        }}
                      >
                        Use clear, concise language
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.75rem",
                        }}
                      >
                        Be honest and complete in your description
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.75rem",
                        }}
                      >
                        Try rephrasing if the answer seems unclear
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.75rem",
                        }}
                      >
                        For case analysis, provide as much relevant detail as
                        possible
                      </li>
                    </ul>
                  </CollapsibleSection>

                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <NavigationLink
                      targetId="security"
                      title="Security and Privacy"
                    />
                  </div>
                </div>
              )}

              {/* Update the sections to add navigation links */}
              {selectedItem === "what-is" && (
                <div
                  className="section-container"
                  style={sectionContainerStyle}
                >
                  <CollapsibleSection title="Introduction" theme={theme}>
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      Civilify is an AI-powered legal assistant designed to give
                      users a better understanding of their legal standing. By
                      interacting with "Villy," you can ask general legal
                      questions or describe your specific situation for a
                      detailed case analysis.
                    </p>
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      Civilify is <strong>not</strong> a substitute for legal
                      professionals—it serves as a guide for early-stage legal
                      questions and understanding.
                    </p>
                  </CollapsibleSection>

                  <CollapsibleSection title="Mission" theme={theme}>
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      To empower individuals by making legal knowledge more
                      accessible, digestible, and actionable—particularly for
                      those who may be underserved by traditional legal systems.
                    </p>
                  </CollapsibleSection>

                  <CollapsibleSection title="Key Features" theme={theme}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          flex: "1 1 300px",
                          minWidth: "0",
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            theme.cardBorder || theme.border
                          }`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#1e40af",
                            marginBottom: "0.5rem",
                          }}
                        >
                          General Legal Information Mode
                        </h4>
                        <p style={{ color: theme.subtle }}>
                          Ask questions about laws, rights, and legal
                          procedures. Get quick, clear answers from Villy.
                        </p>
                      </div>
                      <div
                        style={{
                          flex: "1 1 300px",
                          minWidth: "0",
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            theme.cardBorder || theme.border
                          }`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#047857",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Case Analysis Mode
                        </h4>
                        <p style={{ color: theme.subtle }}>
                          Describe your situation for a detailed analysis,
                          plausibility score, and suggested next steps.
                        </p>
                      </div>
                      <div
                        style={{
                          flex: "1 1 300px",
                          minWidth: "0",
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            theme.cardBorder || theme.border
                          }`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#b91c1c",
                            marginBottom: "0.5rem",
                          }}
                        >
                          AI-Powered Legal Analysis
                        </h4>
                        <p style={{ color: theme.subtle }}>
                          Understand your legal situation using natural language
                          and advanced AI.
                        </p>
                      </div>
                      <div
                        style={{
                          flex: "1 1 300px",
                          minWidth: "0",
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            theme.cardBorder || theme.border
                          }`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#7c3aed",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Flexible Chat Modes
                        </h4>
                        <p style={{ color: theme.subtle }}>
                          Switch between quick legal Q&A and in-depth case
                          analysis as needed.
                        </p>
                      </div>
                      <div
                        style={{
                          flex: "1 1 300px",
                          minWidth: "0",
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            theme.cardBorder || theme.border
                          }`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#c2410c",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Privacy-First Design
                        </h4>
                        <p style={{ color: theme.subtle }}>
                          Your data stays with you. No conversations are stored.
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Legal Disclaimer"
                    isLast={true}
                    theme={theme}
                  >
                    <div
                      style={{
                        ...styles.disclaimer,
                        backgroundColor: theme.disclaimerBg,
                        border: `1px solid ${theme.disclaimerBorder}`,
                        color: theme.primary,
                      }}
                    >
                      Civilify is not a law firm and does not offer legal
                      representation or advice. The platform provides
                      AI-generated legal insights based on publicly available
                      legal standards and should not be relied on as legal
                      counsel. Always consult with a licensed attorney for
                      legally binding advice or action.
                    </div>
                  </CollapsibleSection>

                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <NavigationLink
                      targetId="why-use"
                      title="Why Use Civilify?"
                    />
                  </div>
                </div>
              )}

              {/* Example content for "Why use Civilify?" section */}
              {selectedItem === "why-use" && (
                <div
                  className="section-container"
                  style={sectionContainerStyle}
                >
                  <CollapsibleSection title="Why Civilify Exists" theme={theme}>
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      Legal advice is expensive and inaccessible to many
                      Filipinos. Civilify bridges that gap by offering an
                      AI-powered assistant that answers legal questions clearly
                      and affordably.
                    </p>

                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      It's backed by research showing:
                    </p>
                    <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        85% of Filipinos cannot afford legal services, with only
                        1 lawyer for every 1,000 people (Philippine Statistics
                        Authority, 2023).
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        AI tools like Civilify reduce reliance on expensive
                        consultations for preliminary assessments, making legal
                        knowledge more accessible.
                      </li>
                    </ul>

                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      With AI systems like GPT, Civilify is making Philippine
                      legal knowledge approachable and helping users feel more
                      confident about their rights.
                    </p>

                    <div
                      style={{
                        marginTop: "1.5rem",
                        backgroundColor: theme.cardBg,
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${theme.cardBorder || theme.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "0.5rem",
                        }}
                      >
                        References:
                      </h4>
                      <ul
                        style={{
                          paddingLeft: "1.5rem",
                          fontSize: "0.875rem",
                          color: theme.subtle,
                        }}
                      >
                        <li style={{ marginBottom: "0.25rem" }}>
                          <a
                            href="https://legacy.senate.gov.ph/lisdata/4029936714!.pdf"
                            style={{
                              color: theme.link,
                              textDecoration: "none",
                            }}
                          >
                            PSA: Legal Services Accessibility in the Philippines
                            (2023)
                          </a>
                        </li>
                        <li style={{ marginBottom: "0.25rem" }}>
                          <a
                            href="https://sc.judiciary.gov.ph/sc-approves-the-rules-on-unified-legal-aid-service/"
                            style={{
                              color: theme.link,
                              textDecoration: "none",
                            }}
                          >
                            Supreme Court of the Philippines: Legal Aid Report
                            (2023)
                          </a>
                        </li>
                        <li style={{ marginBottom: "0.25rem" }}>
                          <a
                            href="https://worldjusticeproject.org/sites/default/files/documents/Access-to-Justice-2019-Philippines.pdf"
                            style={{
                              color: theme.link,
                              textDecoration: "none",
                            }}
                          >
                            Philippine Bar Association: Legal Services Survey
                            (2023)
                          </a>
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Who is Civilify For?"
                    isLast={true}
                    theme={theme}
                  >
                    <div style={{ marginBottom: "1.5rem" }}>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Civilify is designed for:
                      </p>
                      <ul
                        style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}
                      >
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          People curious about whether they have a legal issue
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Entrepreneurs dealing with contracts or disputes
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Individuals exploring rights in tenancy, employment,
                          consumer protection, etc.
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Students and researchers looking to understand law in
                          simple terms
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.cardBg,
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${theme.cardBorder || theme.border}`,
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#b91c1c",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Not for:
                      </h4>
                      <ul
                        style={{
                          paddingLeft: "1.5rem",
                          fontSize: "1rem",
                          color: theme.subtle,
                        }}
                      >
                        <li style={{ marginBottom: "0.25rem" }}>
                          Those seeking legally binding advice
                        </li>
                        <li style={{ marginBottom: "0.25rem" }}>
                          Users involved in sensitive or criminal cases
                        </li>
                        <li style={{ marginBottom: "0.25rem" }}>
                          Anyone looking to replace qualified legal
                          professionals
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>

                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <NavigationLink
                      targetId="getting-started"
                      title="Getting Started"
                    />
                  </div>
                </div>
              )}

              {/* Example content for "Security and Privacy" section */}
              {selectedItem === "security" && (
                <div
                  className="section-container"
                  style={sectionContainerStyle}
                >
                  <CollapsibleSection title="Authentication" theme={theme}>
                    <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        We use <strong>OAuth</strong> to authenticate users via
                        Google or other trusted platforms.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        Multi-factor authentication (MFA) is enforced for
                        sensitive access.
                      </li>
                    </ul>
                  </CollapsibleSection>

                  <CollapsibleSection title="Data Handling" theme={theme}>
                    <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        Uses <strong>Firebase</strong> for secure backend
                        operations.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>No conversation data is stored</strong> unless
                        you're a registered user who has opted in.
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        No information is shared with third parties.
                      </li>
                    </ul>
                  </CollapsibleSection>

                  <CollapsibleSection title="Encryption" theme={theme}>
                    <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        Data in transit is secured with{" "}
                        <strong>TLS 1.2+</strong>
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        Any stored information is encrypted with{" "}
                        <strong>AES-256</strong>
                      </li>
                    </ul>
                  </CollapsibleSection>

                  <CollapsibleSection title="Terms of Service" theme={theme}>
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        1. Acceptance of Terms
                      </h4>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        By accessing and using Civilify, you agree to be bound
                        by these Terms of Service. If you do not agree to these
                        terms, please do not use our service.
                      </p>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        2. Service Description
                      </h4>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Civilify provides AI-powered legal information and case
                        analysis. Our service is not a substitute for
                        professional legal advice and should not be relied upon
                        as such.
                      </p>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        3. User Responsibilities
                      </h4>
                      <ul
                        style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}
                      >
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Provide accurate and truthful information
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Maintain the confidentiality of your account
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Use the service in compliance with applicable laws
                        </li>
                      </ul>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        4. Limitations of Service
                      </h4>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        Civilify is not a law firm and does not provide legal
                        representation. Our AI-generated responses are for
                        informational purposes only and should not be considered
                        legal advice.
                      </p>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Privacy Policy" theme={theme}>
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        1. Information We Collect
                      </h4>
                      <ul
                        style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}
                      >
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Account information (email, name)
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Usage data (interactions with the service)
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Conversation data (only if explicitly opted in)
                        </li>
                      </ul>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        2. How We Use Your Information
                      </h4>
                      <ul
                        style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}
                      >
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          To provide and improve our services
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          To communicate with you about your account
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          To ensure platform security
                        </li>
                      </ul>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        3. Data Protection
                      </h4>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "1rem",
                        }}
                      >
                        We implement industry-standard security measures to
                        protect your data. This includes encryption, secure
                        servers, and regular security audits.
                      </p>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "1rem",
                        }}
                      >
                        4. Your Rights
                      </h4>
                      <ul
                        style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}
                      >
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Access your personal data
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Request data deletion
                        </li>
                        <li
                          style={{
                            fontSize: "1.125rem",
                            color: theme.subtle,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Opt-out of data collection
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Compliance"
                    isLast={true}
                    theme={theme}
                  >
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                      }}
                    >
                      Civilify is designed to comply with:
                    </p>
                    <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>GDPR</strong>
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>ISO 27001</strong>
                      </li>
                      <li
                        style={{
                          fontSize: "1.125rem",
                          color: theme.subtle,
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong>HIPAA</strong> (where applicable)
                      </li>
                    </ul>

                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: theme.subtle,
                        marginBottom: "1rem",
                        fontWeight: "600",
                      }}
                    >
                      We <strong>never store</strong> anything beyond what you
                      explicitly allow. That means{" "}
                      <strong>
                        no hidden tracking, no data mining, no surprises.
                      </strong>
                    </p>
                  </CollapsibleSection>

                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <NavigationLink
                      targetId="troubleshooting"
                      title="Troubleshooting & Support"
                    />
                  </div>
                </div>
              )}
              {selectedItem === "troubleshooting" && (
                <div
                  className="section-container"
                  style={sectionContainerStyle}
                >
                  <CollapsibleSection
                    title="Frequently Asked Questions"
                    theme={theme}
                  >
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${theme.border}`,
                          marginBottom: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: theme.text,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Q: The chatbot isn't responding.
                        </h4>
                        <p
                          style={{
                            fontSize: "1rem",
                            color: theme.subtle,
                            paddingLeft: "1rem",
                            borderLeft: `3px solid ${theme.muted}`,
                          }}
                        >
                          {" "}
                          Check your internet connection. Civilify requires
                          online access for AI processing.
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${theme.border}`,
                          marginBottom: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: theme.text,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Q: The response was unclear.
                        </h4>
                        <p
                          style={{
                            fontSize: "1rem",
                            color: theme.subtle,
                            paddingLeft: "1rem",
                            borderLeft: `3px solid ${theme.muted}`,
                          }}
                        >
                          {" "}
                          Try rephrasing your question or choosing a simpler
                          version.
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${theme.border}`,
                          marginBottom: "1rem",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: theme.text,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Q: I forgot my password.
                        </h4>
                        <p
                          style={{
                            fontSize: "1rem",
                            color: theme.subtle,
                            paddingLeft: "1rem",
                            borderLeft: `3px solid ${theme.muted}`,
                          }}
                        >
                          Use the "Forgot Password" option on the sign-in page.
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.cardBg,
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: theme.text,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Q: I want to report a bug.
                        </h4>
                        <p
                          style={{
                            fontSize: "1rem",
                            color: theme.subtle,
                            paddingLeft: "1rem",
                            borderLeft: `3px solid ${theme.muted}`,
                          }}
                        >
                          {" "}
                          Email us at:
                          <a
                            href="mailto:support@civilify.com"
                            style={{
                              color: theme.link,
                              textDecoration: "none",
                            }}
                          >
                            support@civilify.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Contact Support"
                    isLast={true}
                    theme={theme}
                  >
                    <div
                      style={{
                        backgroundColor: theme.cardBg,
                        padding: "1.5rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${theme.border}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: theme.primary,
                          marginBottom: "1rem",
                        }}
                      >
                        {" "}
                        Need additional help?
                      </h4>
                      <p
                        style={{
                          fontSize: "1rem",
                          color: theme.subtle,
                          marginBottom: "1.5rem",
                          textAlign: "center",
                        }}
                      >
                        {" "}
                        Our support team is available Monday through Friday,
                        9am-5pm
                      </p>
                      <a
                        href="mailto:support@civilify.com"
                        style={{
                          backgroundColor: theme.primary,
                          color: theme.contentBg, // Use a contrasting background color for the text
                          padding: "0.75rem 1.5rem",
                          borderRadius: "0.375rem",
                          textDecoration: "none",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Contact Support
                      </a>
                    </div>
                  </CollapsibleSection>
                  <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
                    <NavigationLink
                      targetId="what-is"
                      title="What is Civilify?"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 500,
                  color: theme.muted,
                }}
              >
                Select a topic from the sidebar to view documentation.
              </h3>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .sidebar-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        .sidebar {
          animation: slideInFromRight 0.3s ease-out forwards;
        }

        .close-button:hover {
          color: ${styles.light.primary};
        }

        .hamburger-button:hover {
          background-color: #f3f4f6;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        /* Ensure proper scrolling on all devices */
        .docsPage {
          overflow-x: hidden;
        }

        .sidebar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }

        /* Explicit hamburger button visibility rules for all screen sizes */
        .hamburger-button {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        @media (min-width: 769px) {
          .hamburger-button {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 768px) {
          .hamburger-button {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        /* Responsive font sizes for readability across screen sizes */
        :root {
          font-size: 16px; /* Base font size for rem calculations */
        }

        /* Default font sizes for larger screens (>1024px) */
        .content h1 {
          font-size: 2.25rem; /* Matches contentHeaderTitle */
        }

        .content h2 {
          font-size: 1.875rem; /* Matches sectionTitle */
        }

        .content p,
        .content li {
          font-size: 1.125rem; /* Matches sectionDescription and list items */
        }

        .navigation-link {
          font-size: 0.875rem; /* Matches navigation link */
        }

        .collapsibleSection h3 {
          font-size: 1.125rem; /* Matches collapsibleTitle */
        }

        .collapsibleSection .disclaimer {
          font-size: 0.875rem; /* Matches disclaimer */
        }

        .sidebar button {
          font-size: 1rem; /* Matches navItem */
        }

        .bottom-nav button,
        .bottom-nav a {
          font-size: 1rem; /* Matches backLink */
        }

        /* Tablet screens (768px - 1024px) */
        @media (max-width: 1024px) {
          :root {
            font-size: 15px; /* Slightly smaller base font */
          }

          .content h1 {
            font-size: 2rem;
          }

          .content h2 {
            font-size: 1.75rem;
          }

          .content p,
          .content li {
            font-size: 1rem;
          }

          .navigation-link {
            font-size: 0.85rem;
          }

          .collapsibleSection h3 {
            font-size: 1rem;
          }

          .collapsibleSection .disclaimer {
            font-size: 0.8rem;
          }

          .sidebar button {
            font-size: 0.95rem; /* Matches mobile adjustment in navItem */
          }

          .bottom-nav button,
          .bottom-nav a {
            font-size: 1rem;
          }
        }

        /* Mobile screens (<768px) */
        @media (max-width: 768px) {
          :root {
            font-size: 14px; /* Smaller base font for mobile */
          }

          .content h1 {
            font-size: 1.75rem;
          }

          .content h2 {
            font-size: 1.5rem;
          }

          .content p,
          .content li {
            font-size: 0.95rem;
          }

          .navigation-link {
            font-size: 0.8rem;
          }

          .collapsibleSection h3 {
            font-size: 0.95rem;
          }

          .collapsibleSection .disclaimer {
            font-size: 0.75rem;
          }

          .sidebar button {
            font-size: 0.9rem; /* Matches navItem mobile adjustment */
          }

          .bottom-nav button,
          .bottom-nav a {
            font-size: 1rem;
          }
        }

        /* Extra small screens (<480px, e.g., small mobile devices) */
        @media (max-width: 480px) {
          :root {
            font-size: 13px; /* Smallest base font */
          }

          .content h1 {
            font-size: 1.5rem;
          }

          .content h2 {
            font-size: 1.25rem;
          }

          .content p,
          .content li {
            font-size: 0.9rem;
          }

          .navigation-link {
            font-size: 0.75rem;
          }

          .collapsibleSection h3 {
            font-size: 0.9rem;
          }

          .collapsibleSection .disclaimer {
            font-size: 0.7rem;
          }

          .sidebar button {
            font-size: 0.85rem;
          }

          .bottom-nav button,
          .bottom-nav a {
            font-size: 0.85rem;
          }
        }

        /* Existing styles from Code 2 to preserve animations and other effects */
        .sidebar-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        .sidebar {
          animation: slideInFromRight 0.3s ease-out forwards;
        }

        .close-button:hover {
          color: #f34d01;
        }

        .hamburger-button:hover {
          background-color: #f3f4f6;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        /* Existing scrollbar styles */
        .sidebar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }

        /* Existing hamburger button visibility */
        .hamburger-button {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        @media (min-width: 769px) {
          .hamburger-button {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 768px) {
          .hamburger-button {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CivilifyDocuments;
