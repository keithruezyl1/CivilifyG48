"use client";

import { useState, useEffect } from "react";
import logoIconOrange from "../assets/images/logoiconorange.png";

const LoadingScreen = ({ isDarkMode }) => {
  const [currentTheme, setCurrentTheme] = useState(false);

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem("authToken") ||
      localStorage.getItem("user") ||
      localStorage.getItem("isAuthenticated");

    if (isDarkMode !== undefined) {
      setCurrentTheme(isDarkMode);
    } else if (isLoggedIn) {
      const userTheme =
        localStorage.getItem("userTheme") || localStorage.getItem("theme");
      setCurrentTheme(userTheme === "dark");
    } else {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setCurrentTheme(systemPrefersDark);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleThemeChange = (e) => setCurrentTheme(e.matches);
      mediaQuery.addEventListener("change", handleThemeChange);

      return () => mediaQuery.removeEventListener("change", handleThemeChange);
    }
  }, [isDarkMode]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const loadingText = "Loading...";

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: currentTheme ? "#232323" : "#ffffff",
      }}
    >
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <img
            src={logoIconOrange || "/placeholder.svg"}
            alt="Civilify Logo"
            style={styles.logo}
          />
        </div>
        <div style={styles.loadingText}>
          <span style={{ display: "flex", gap: 0 }}>
            {loadingText.split("").map((char, index) => (
              <span
                key={index}
                style={{
                  ...styles.bouncingChar,
                  color: currentTheme ? "#ffffff" : "#374151",
                  animationDelay: `${index * 0.15}s`,
                }}
                aria-hidden="true"
              >
                {char}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.3s ease-out",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    animation: "slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  logoContainer: {
    animation: "logoEntrance 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 4px 12px rgba(243, 77, 1, 0.2))",
  },
  logo: {
    width: "80px",
    height: "80px",
    animation: "logoEntranceAndBreathe 3s ease-in-out infinite",
  },
  loadingText: {
    fontSize: "16px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    animation: "textFadeIn 1s ease-out 0.3s both",
  },
  bouncingChar: {
    display: "inline-block",
    animationName: "charBounceUpDown",
    animationDuration: "1.5s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
};

// Add the CSS keyframes for animations to the document head
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes logoEntranceAndBreathe {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(-10deg);
    }
    20% {
      opacity: 1;
      transform: scale(1.1) rotate(5deg);
    }
    40% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    70% {
      transform: scale(1.08) rotate(0deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes textFadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes charBounceUpDown {
    0%, 40%, 100% {
      transform: translateY(0);
    }
    20% {
      transform: translateY(-2px);
    }
  }
`;
document.head.appendChild(styleSheet);

export default LoadingScreen;
