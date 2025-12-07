"use client";

import { useState, useEffect } from "react";
import lostVilly from "../assets/images/pagenotfound.png";

const Page404 = () => {
  const [currentTheme, setCurrentTheme] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (e) => {
      setCurrentTheme(e.matches);
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
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
          onClick={() => window.history.back()}
          style={{
            ...styles.button,
            backgroundColor: "#f34d01",
            color: "#ffffff",
            fontSize: isMobile ? "14px" : "15px",
            padding: isMobile ? "8px 16px" : "10px 20px",
            cursor: "pointer",
          }}
        >
          Return
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
