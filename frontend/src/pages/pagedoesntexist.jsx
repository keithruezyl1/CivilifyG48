"use client";

import { useState, useEffect } from "react";
import lostVilly from "../assets/images/pagenotfound.png";

const Page404 = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window === "undefined") return false;
    const localTheme = localStorage.getItem("darkMode");
    if (localTheme !== null) return localTheme === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const updateTheme = () => {
      const localTheme = localStorage.getItem("darkMode");
      let newTheme;

      if (localTheme !== null) {
        newTheme = localTheme === "true";
      } else {
        newTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      setCurrentTheme(newTheme);
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // System preference listener: Only matters if no local preference is set
    const handleSystemThemeChange = (e) => {
      if (localStorage.getItem("darkMode") === null) {
        setCurrentTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Custom listener for changes made by a theme toggle component
    window.addEventListener("local-storage-theme-change", updateTheme);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("local-storage-theme-change", updateTheme); // Clean up custom listener
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Responsive styles based on window width
  const isMobile = windowWidth <= 480;

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: currentTheme ? "#232323" : "#ffffff",
        padding: isMobile ? "10px" : "20px",
      }}
    >
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
            ...styles.title,
            color: currentTheme ? "#ff784e" : "#d84315",
            fontSize: isMobile ? "22px" : "28px",
          }}
        >
          Oops! Page Not Found.
        </h1>

        <p
          style={{
            ...styles.text,
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
