"use client";

import { useState, useEffect } from "react";
import lostVilly from "../assets/images/pagenotfound.png";

// The Page404 component does not receive an isDarkMode prop,
// so it will execute steps 2 and 3 of the logic.
const Page404 = () => {
  const [currentTheme, setCurrentTheme] = useState(false);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    // 1. Check if user is logged in (User Preference)
    const isLoggedIn =
      localStorage.getItem("authToken") ||
      localStorage.getItem("user") ||
      localStorage.getItem("isAuthenticated");

    if (isLoggedIn) {
      // If logged in, prioritize user-specific theme (userTheme or theme)
      const userTheme =
        localStorage.getItem("userTheme") || localStorage.getItem("theme");
      setCurrentTheme(userTheme === "dark");
    } else {
      // 2. Fallback to System Preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setCurrentTheme(systemPrefersDark); // Set up listener for system theme changes (since no user login or prop)

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleThemeChange = (e) => setCurrentTheme(e.matches);
      mediaQuery.addEventListener("change", handleThemeChange);

      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    } // NOTE: The Page404 component's original theme update logic // based on 'darkMode' and 'local-storage-theme-change' event // has been removed to strictly follow the LoadingScreen's logic.
  }, []); // Empty dependency array as it doesn't rely on props like the LoadingScreen

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Responsive styles based on window width

  const isMobile = windowWidth <= 480;

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: currentTheme ? "#232323" : "#ffffff",
        padding: isMobile ? "10px" : "20px",
      }}
    >
      {" "}
         
      <div
        style={{
          ...styles.content,
          gap: isMobile ? "16px" : "24px",
        }}
      >
        <img
          src={lostVilly}
          alt="Page Not Found"
          style={{
            ...styles.icon,
            width: isMobile ? "180px" : "300px",
          }}
        />
        <h1
          style={{
            ...styles.title, // Ensure colors match the theme
            color: currentTheme ? "#ff784e" : "#d84315",
            fontSize: isMobile ? "22px" : "28px",
          }}
        >
          Oops! Page Not Found.
        </h1>
        <p
          style={{
            ...styles.text, // Ensure colors match the theme
            color: currentTheme ? "#e5e5e5" : "#374151",
            fontSize: isMobile ? "14px" : "16px",
            maxWidth: isMobile ? "240px" : "320px",
          }}
        >
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          style={{
            ...styles.button,
            backgroundColor: "#f34d01",
            color: "#ffffff",
            fontSize: isMobile ? "14px" : "15px",
            padding: isMobile ? "8px 16px" : "10px 20px",
          }}
        >
          Return Home
        </a>
      </div>
    </div>
  );
};

export default Page404;

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  icon: {
    height: "auto",
    userSelect: "none",
  },
  title: {
    fontWeight: "600",
    margin: 0,
  },
  text: {},
  button: {
    marginTop: "4px",
    fontWeight: "500",
    borderRadius: "8px",
    textDecoration: "none",
    transition: "opacity 0.2s ease",
  },
};
