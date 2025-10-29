"use client";

import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logoIconOrange from "../assets/images/logoiconorange.png";
import villyBackground from "../assets/images/villy_3dbackground.png";
import villyNaturalLanguage from "../assets/images/villy_naturallanguage.png";
import villyLegalAnalysis from "../assets/images/villy_legalanalysis3.PNG";
import villyAiAssistance from "../assets/images/villy_aiassistance2.PNG";
import number1Icon from "../assets/images/1(1).png";
import number2Icon from "../assets/images/2(1).png";
import number3Icon from "../assets/images/3(1).png";
import LoadingScreen from "./LoadingScreen";
import SeasonalHoverCards from "../components/lightswind/seasonal-hover-cards";
import "@quietui/quiet/components/text-mask/text-mask.js";
import BeamGridBackground from "../components/lightswind/beam-grid-background";
import {
  GlowingCards,
  GlowingCard,
} from "@/components/lightswind/glowing-cards";
import WaveTransition from "../components/lightswind/wave-transition";
import ParticlesBackground from "../components/lightswind/particles-background";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const patchNotesRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);
  const [activeSection, setActiveSection] = useState("hero");
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  useEffect(() => {
    document.title = "Civilify";
  }, []);

  useEffect(() => {
    const sections = [
      { id: "hero", ref: heroRef },
      { id: "features", ref: featuresRef },
      { id: "how-it-works", ref: howItWorksRef },
      { id: "patch-notes", ref: patchNotesRef },
      { id: "cta", ref: ctaRef },
      { id: "footer", ref: footerRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => s.ref.current && observer.observe(s.ref.current));
    return () =>
      sections.forEach(
        (s) => s.ref.current && observer.unobserve(s.ref.current)
      );
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setIsMenuOpen(false);
  };

  const smoothScroll = (element) => {
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleNavClick = (e, ref) => {
    e.preventDefault();
    smoothScroll(ref.current);
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/signin");
    }, 1500);
    setIsMenuOpen(false);
  };

  const handleSignup = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/signup");
    }, 1500);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    } else {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.classList.add("closing");
        setTimeout(() => {
          setIsMenuOpen(false);
          sidebar.classList.remove("closing");
        }, 300);
      }
    }
  };

  const navigateToDocsSection = (sectionId) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("selectedDocSection", sectionId);
      navigate("/civilify-documents");
    }, 1500);
  };

  if (loading) return <LoadingScreen icon={logoIconOrange} />;

  const seasonCards = [
    {
      title: "Natural Language Processing",
      subtitle: "Ask in plain English",
      description:
        "Communicate with Villy in plain English, just like talking to a legal expert. Our AI understands context and legal terminology to provide clear, accurate guidance for your legal needs.",
      imageSrc: villyNaturalLanguage,
      imageAlt: "Natural language processing illustration",
      isDarkMode: isDarkMode,
    },
    {
      title: "Legal Analysis",
      subtitle: "Instant case intelligence",
      description:
        "Get comprehensive analysis of your legal situation or detailed answers to your legal questions, with potential outcomes and recommended actions tailored to your needs.",
      imageSrc: villyLegalAnalysis,
      imageAlt: "Legal analysis illustration",
      isDarkMode: isDarkMode,
    },
    {
      title: "AI Assistance",
      subtitle: "Smart next steps, instantly",
      description:
        "Receive intelligent suggested next steps and personalized guidance powered by advanced AI technology, whether you're asking general questions or analyzing a specific case.",
      imageSrc: villyAiAssistance,
      imageAlt: "AI assistance illustration",
      isDarkMode: isDarkMode,
    },
  ];

  return (
    <>
      <div
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <nav style={styles.navbar}>
          <div style={styles.logoContainer}>
            <img
              src={logoIconOrange || "/placeholder.svg"}
              alt="Civilify Logo"
              style={styles.logo}
              onClick={handleLogoClick}
              className="logo-clickable"
            />
          </div>
          <div style={styles.navContainer}>
            <button
              style={styles.hamburgerButton}
              onClick={toggleMenu}
              className="hamburger-button"
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
                  stroke="#F34D01"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {isMenuOpen && (
              <div
                style={styles.sidebarOverlay}
                className="sidebar-overlay"
                onClick={(e) => e.target === e.currentTarget && toggleMenu()}
              >
                <div
                  style={styles.sidebar}
                  className={`sidebar ${isMenuOpen ? "" : "closing"}`}
                >
                  <div style={styles.sidebarLinks}>
                    <a
                      href="#features"
                      style={{
                        ...styles.navLink,
                        color:
                          activeSection === "features"
                            ? "#F34D01"
                            : isDarkMode
                            ? "#e0e0e0"
                            : "#333",
                        fontWeight:
                          activeSection === "features" ? "600" : "500",
                      }}
                      onClick={(e) => handleNavClick(e, featuresRef)}
                    >
                      Features
                    </a>
                    <a
                      href="#how-it-works"
                      style={{
                        ...styles.navLink,
                        color:
                          activeSection === "how-it-works"
                            ? "#F34D01"
                            : isDarkMode
                            ? "#e0e0e0"
                            : "#333",
                        fontWeight:
                          activeSection === "how-it-works" ? "600" : "500",
                      }}
                      onClick={(e) => handleNavClick(e, howItWorksRef)}
                    >
                      How It Works
                    </a>
                    <a
                      href="#patch-notes"
                      style={{
                        ...styles.navLink,
                        color:
                          activeSection === "patch-notes"
                            ? "#F34D01"
                            : isDarkMode
                            ? "#e0e0e0"
                            : "#333",
                        fontWeight:
                          activeSection === "patch-notes" ? "600" : "500",
                      }}
                      onClick={(e) => handleNavClick(e, patchNotesRef)}
                    >
                      What's New
                    </a>
                    <button style={styles.navButton} onClick={handleSignIn}>
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              style={styles.navLinks}
              className={isMenuOpen ? "nav-links open" : "nav-links"}
            >
              <a
                href="#features"
                style={{
                  ...styles.navLink,
                  color:
                    activeSection === "features"
                      ? "#F34D01"
                      : isDarkMode
                      ? "#e0e0e0"
                      : "#333",
                  fontWeight: activeSection === "features" ? "600" : "500",
                }}
                onClick={(e) => handleNavClick(e, featuresRef)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                style={{
                  ...styles.navLink,
                  color:
                    activeSection === "how-it-works"
                      ? "#F34D01"
                      : isDarkMode
                      ? "#e0e0e0"
                      : "#333",
                  fontWeight: activeSection === "how-it-works" ? "600" : "500",
                }}
                onClick={(e) => handleNavClick(e, howItWorksRef)}
              >
                How It Works
              </a>
              <a
                href="#patch-notes"
                style={{
                  ...styles.navLink,
                  color:
                    activeSection === "patch-notes"
                      ? "#F34D01"
                      : isDarkMode
                      ? "#e0e0e0"
                      : "#333",
                  fontWeight: activeSection === "patch-notes" ? "600" : "500",
                }}
                onClick={(e) => handleNavClick(e, patchNotesRef)}
              >
                What's New
              </a>
              <button style={styles.navButton} onClick={handleSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div
          id="hero"
          ref={heroRef}
          style={{
            backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            overflowX: "hidden",
          }}
        >
          <BeamGridBackground />
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <quiet-text-mask
              image={villyBackground}
              fixed
              style={{
                fontFamily: "'Fira Sans', sans-serif",
                fontSize: "10vw",
                fontWeight: 900,
                lineHeight: 1,
                textAlign: "center",
                "--brightness": "90%",
                "--contrast": "90%",
              }}
            >
              CIVILIFY
            </quiet-text-mask>
            <h2
              style={{
                ...styles.subheading,
                zIndex: 1,
              }}
              className="subheading-shine"
            >
              AI-Powered Legal Clarity
            </h2>
            <p
              style={{
                ...styles.description,
                color: isDarkMode ? "#d1d5db" : "#4b5563",
                padding: "1em",
                zIndex: 1,
              }}
              className={`text-gray-300 text-gray-700 p-4 sm:p-6 md:p-8 text-sm sm:text-base md:text-lg leading-relaxed z-10`}
            >
              Ask a legal question, assess your legal case, get insights, and
              know what to do next with{" "}
              <span style={styles.highlight}>Villy</span>, your intelligent
              legal companion.
            </p>
            <button
              style={{
                ...styles.primaryButton,
              }}
              onClick={handleSignup}
              className="get-started-button text-base leading-6 text-gray-600 text-center mb-8 sm:text-lg sm:leading-7 md:text-xl md:leading-8 md:mb-10"
              variant="contained"
            >
              Chat Villy Now
            </button>
          </div>
          <div
            style={{
              ...styles.scrollIndicator,
              opacity: showScrollIndicator ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.5s",
            }}
          >
            <div style={styles.scrollIndicatorBg}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
              >
                <path d="M12 16L6 10H18L12 16Z" fill="#fff" />
              </svg>
            </div>
          </div>
        </div>
        <div
          id="features"
          ref={featuresRef}
          style={{
            background: isDarkMode
              ? "linear-gradient(to bottom, #0d0d0d, #181818)"
              : "#ffffff",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative", // Added position relative for absolute positioning of wave
            overflow: "hidden", // Hide overflow to contain wave
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <WaveTransition isDarkMode={isDarkMode} />
          </div>

          <h2
            style={{
              fontSize: "3em",
              fontWeight: "700",
              color: isDarkMode ? "#ffffff" : "#F34D01",
              paddingTop: "1em",
              position: "relative",
              zIndex: 1,
            }}
          >
            Features
          </h2>
          <div
            style={{
              padding: "2em 2em 10em 2em ",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <SeasonalHoverCards cards={seasonCards} />
          </div>
        </div>

        <div
          id="how-it-works"
          ref={howItWorksRef}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: "3em",
              fontWeight: "700",
              color: isDarkMode ? "#ffffff" : "#F34D01",
              paddingTop: "1em",
              position: "relative",
              zIndex: 1,
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              alignContent: "center",
            }}
          >
            <GlowingCards>
              <GlowingCard
                responsive={true}
                glowColor="#10b981"
                glowOpacity={1}
                glowRadius={1.9}
                backgroundColor={
                  isDarkMode
                    ? "rgba(24, 24, 24, 0.6)"
                    : "rgba(255, 255, 255, 0.6)"
                }
                style={{
                  padding: "2rem",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                }}
              >
                <img
                  src={number1Icon || "/placeholder.svg"}
                  style={{ width: "80%" }}
                  alt="Number one icon"
                ></img>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    marginBottom: "1rem",
                    marginTop: "1.5rem",
                    lineHeight: "1.3",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Choose Your Mode
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "400",
                    color: isDarkMode ? "#d1d5db" : "#4b5563",
                    lineHeight: "1.6",
                    marginBottom: "0.5rem",
                    maxWidth: "90%",
                  }}
                >
                  Select between General Legal Information for quick answers to
                  legal questions, or Case Analysis for a detailed assessment of
                  your specific legal situation. Pick the mode that fits your
                  needs best.
                </p>
              </GlowingCard>
              <GlowingCard
                glowColor="#8b5cf6"
                glowOpacity={1}
                glowRadius={1.9}
                backgroundColor={
                  isDarkMode
                    ? "rgba(24, 24, 24, 0.6)"
                    : "rgba(255, 255, 255, 0.6)"
                }
                style={{
                  padding: "2rem",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                }}
              >
                <img
                  src={number2Icon || "/placeholder.svg"}
                  style={{ width: "80%" }}
                  alt="Number two icon"
                ></img>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    marginBottom: "1rem",
                    marginTop: "1.5rem",
                    lineHeight: "1.3",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Get AI-Powered Answers
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "400",
                    color: isDarkMode ? "#d1d5db" : "#4b5563",
                    lineHeight: "1.6",
                    marginBottom: "0.5rem",
                    maxWidth: "90%",
                  }}
                >
                  Receive detailed insights and recommendations based on
                  Philippine law and legal precedents, tailored to your chosen
                  mode. Villy provides clear, actionable information every step
                  of the way.
                </p>
              </GlowingCard>
              <GlowingCard
                glowColor="#60a5fa"
                glowOpacity={1}
                glowRadius={1.9}
                backgroundColor={
                  isDarkMode
                    ? "rgba(24, 24, 24, 0.6)"
                    : "rgba(255, 255, 255, 0.6)"
                }
                style={{
                  padding: "2rem",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                }}
              >
                <img
                  src={number3Icon || "/placeholder.svg"}
                  style={{ width: "80%" }}
                  alt="Number three icon"
                ></img>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: isDarkMode ? "#ffffff" : "#1f2937",
                    marginBottom: "1rem",
                    marginTop: "1.5rem",
                    lineHeight: "1.3",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Take Action
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: "400",
                    color: isDarkMode ? "#d1d5db" : "#4b5563",
                    lineHeight: "1.6",
                    marginBottom: "0.5rem",
                    maxWidth: "90%",
                  }}
                >
                  Follow the guided next steps, gain clear insights, and
                  understand the best path forward for your situation—whether
                  you need general information or specific case guidance, Villy
                  is here to help.
                </p>
              </GlowingCard>
            </GlowingCards>
          </div>
        </div>

        {/* Patch Notes Section */}
        <div
          id="patch-notes"
          ref={patchNotesRef}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
            justifyContent: "center",
            padding: "80px 5%",
            scrollSnapAlign: "start",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <ParticlesBackground />
          </div>

          <h2
            style={{
              fontSize: "3em",
              color: isDarkMode ? "#ffffff" : "#F34D01",
              marginBottom: "1em",
              position: "relative",
              fontWeight: "700",
              zIndex: 1,
            }}
          >
            What's New
          </h2>
          <div
            style={{
              maxWidth: "900px",
              width: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Timeline line */}
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "0",
                bottom: "0",
                width: "2px",
                backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
              }}
              className="timeline-line"
            />

            {/* Patch note items */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "40px",
              }}
            >
              {/* Update 1 */}
              <div
                style={{
                  position: "relative",
                  paddingLeft: "60px",
                }}
                className="patch-note-update"
              >
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "8px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#8b5cf6",
                    border: `3px solid ${isDarkMode ? "#0d0d0d" : "#f8f9fa"}`,
                    zIndex: 1,
                  }}
                  className="timeline-dot"
                />
                <div
                  style={{
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                    padding: "24px",
                    borderRadius: "12px",
                    border: `1px solid ${isDarkMode ? "#333" : "#e0e0e0"}`,
                    transition: "all 0.3s ease",
                  }}
                  className="patch-note-card"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        backgroundColor: isDarkMode ? "#2d1f3d" : "#faf5ff",
                        color: "#8b5cf6",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        border: `1px solid ${
                          isDarkMode ? "#4a3366" : "#e9d5ff"
                        }`,
                      }}
                    >
                      IMPROVEMENT
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#888" : "#666",
                      }}
                    >
                      October 2025
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      color: isDarkMode ? "#ffffff" : "#1f2937",
                      marginBottom: "12px",
                    }}
                  >
                    Improved User Interface
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: isDarkMode ? "#b0b0b0" : "#4b5563",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    Redesigned interface with enhanced accessibility and
                    smoother navigation. Dark mode support added for comfortable
                    viewing in any lighting condition.
                  </p>
                </div>
              </div>

              {/* Update 2 */}
              <div
                style={{
                  position: "relative",
                  paddingLeft: "60px",
                }}
                className="patch-note-update"
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "8px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#F34D01",
                    border: `3px solid ${isDarkMode ? "#0d0d0d" : "#f8f9fa"}`,
                    zIndex: 1,
                  }}
                  className="timeline-dot"
                />
                <div
                  style={{
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                    padding: "24px",
                    borderRadius: "12px",
                    border: `1px solid ${isDarkMode ? "#333" : "#e0e0e0"}`,
                    transition: "all 0.3s ease",
                  }}
                  className="patch-note-card"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        backgroundColor: isDarkMode ? "#2d1f1a" : "#fff5f0",
                        color: "#F34D01",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        border: `1px solid ${
                          isDarkMode ? "#4a2f24" : "#ffd4c0"
                        }`,
                      }}
                    >
                      IMPROVEMENT
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#888" : "#666",
                      }}
                    >
                      August 2025
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      color: isDarkMode ? "#ffffff" : "#1f2937",
                      marginBottom: "12px",
                    }}
                  >
                    Enhanced AI Analysis Engine
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: isDarkMode ? "#b0b0b0" : "#4b5563",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    Villy now provides even more accurate legal analysis with
                    improved understanding of complex case scenarios and
                    Philippine legal precedents. Response times have been
                    optimized for faster insights.
                  </p>
                </div>
              </div>

              {/* Update 2 */}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          id="cta"
          ref={ctaRef}
          style={{
            padding: "80px 5%",
            textAlign: "center",
            backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <h2
            style={{
              fontSize: "2.25rem",
              fontWeight: "700",
              marginBottom: "16px",
              color: isDarkMode ? "#ffffff" : "#333",
            }}
            className="subheading-shine"
          >
            Ready to Get Started?
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: "1.6",
              color: isDarkMode ? "#d1d5db" : "#666",
              marginBottom: "32px",
              maxWidth: "600px",
              margin: "0 auto 32px",
            }}
          >
            Join thousands of users who trust Civilify for their legal needs.
          </p>
          <button
            style={styles.primaryButton}
            onClick={handleSignup}
            className="get-started-button"
          >
            Get Started
          </button>
        </div>

        {/* Footer */}
        <footer
          id="footer"
          ref={footerRef}
          style={{
            backgroundColor: isDarkMode ? "#0d0d0d" : "#ffffff",
            padding: "20px 5%",
            borderTop: isDarkMode ? "1px solid #333" : "1px solid #eee",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
            }}
            className="footer-content"
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: isDarkMode ? "#a0a0a0" : "#666",
                margin: 0,
              }}
            >
              © The Civilify Company, Cebu City 2025
            </p>
            <div
              style={{
                display: "flex",
                gap: "24px",
                flexWrap: "wrap",
              }}
              className="footer-links"
            >
              <a
                href="/civilify-documents"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDocsSection("what-is");
                }}
                style={{
                  color: isDarkMode ? "#a0a0a0" : "#666",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  fontSize: "0.875rem",
                }}
                className="footer-link"
              >
                What is Civilify
              </a>
              <a
                href="/civilify-documents"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDocsSection("why-use");
                }}
                style={{
                  color: isDarkMode ? "#a0a0a0" : "#666",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  fontSize: "0.875rem",
                }}
                className="footer-link"
              >
                Why use Civilify
              </a>
              <a
                href="/civilify-documents"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDocsSection("getting-started");
                }}
                style={{
                  color: isDarkMode ? "#a0a0a0" : "#666",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  fontSize: "0.875rem",
                }}
                className="footer-link"
              >
                FAQs
              </a>
              <a
                href="/civilify-documents"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDocsSection("security");
                }}
                style={{
                  color: isDarkMode ? "#a0a0a0" : "#666",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  fontSize: "0.875rem",
                }}
                className="footer-link"
              >
                Security and Privacy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  scrollIndicator: {
    position: "absolute",
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "40px",
    height: "40px",
    zIndex: 2,
  },
  scrollIndicatorBg: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#F34D01",
    boxShadow: "0 4px 10px rgba(243, 77, 1, 0.3)",
    animation: "pulse 2s infinite",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 5%",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "2rem",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  navLink: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#333",
    textDecoration: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
    padding: "8px 0",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "2px",
      backgroundColor: "#F34D01",
      transform: "scaleX(0)",
      transition: "transform 0.3s ease",
    },
    "&:hover::after": {
      transform: "scaleX(1)",
    },
  },
  navButton: {
    padding: "12px 24px",
    fontSize: "0.875rem",
    fontWeight: "600",
    backgroundColor: "#F34D01",
    color: "white",
    borderRadius: "30px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    border: "none",
    boxShadow:
      "0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow:
        "0 6px 15px rgba(243, 77, 1, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.3) inset",
    },
    "&:active": {
      transform: "translateY(0)",
      boxShadow:
        "0 2px 5px rgba(243, 77, 1, 0.2), 1px 1px 1px rgba(255, 255, 255, 0.3) inset",
    },
  },
  feature1section: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10%",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  heroContainer: {
    display: "flex",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    position: "relative",
    flex: "wrap",
  },
  //
  // heroContent: {
  //   maxWidth: "450px",
  //   textAlign: "center",
  // },
  heroLogo: {
    height: "4rem",
  },

  feature1grid: {
    display: "grid",
    gridTemplateColumns: window.innerWidth <= 475 ? "1fr" : "1fr 1fr",
    // gap: "40px",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    alignItems: "center",
  },

  feature1left: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  feature1right: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  villyIllustration: {
    maxWidth: "100%",
    height: "auto",
  },

  // villyIllustration: {
  //   maxWidth: "100%",
  //   height: "auto",
  //   position: "absolute",
  //   bottom: "-400px",
  // },
  subheading: {
    fontSize: "2.25rem",
    fontWeight: "600",
    marginBottom: "24px",
    color: "#333",
    background: "linear-gradient(90deg, #333, #F34D01, #333)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "shine 3s linear infinite",
    textAlign: "center",
  },
  description: {
    marginBottom: "32px",
    color: "#666",
    textAlign: "center",
  },
  highlight: {
    color: "#F34D01",
    fontWeight: "600",
  },
  featuresSection: {
    padding: "80px 5% 60px",
    backgroundColor: "#ffffff",
    minHeight: "calc(100vh - 60px)",
    textAlign: "center",
  },
  sectionHeading: {
    fontSize: "4rem",
    // fontWeight: "700",
    // marginBottom: "0.8em",
    color: "#333",
    textAlign: "center",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "48px",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    justifyItems: "center",
  },
  featureCard: {
    padding: "2rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
    // display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    overflow: "visible",
    height: "fit-content",
    justifyContent: "space-between",
    maxWidth: "375px",
  },
  featureImage: {
    width: "auto",
    height: "auto",
    maxWidth: "150px",
    // marginBottom: "24px",
    objectFit: "contain",
  },
  featureTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#333",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featureDescription: {
    fontSize: "0.875rem",
    lineHeight: "1.6",
    color: "#666",
    marginBottom: "24px",
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  howItWorksSection: {
    padding: "120px 5% 60px",
    backgroundColor: "#ffffff",
    minHeight: "calc(100vh - 60px)",
    textAlign: "center",
  },
  stepsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "32px",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 5%",
    // transform: 'translateX(-5%)',
  },
  step: {
    padding: "32px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  stepNumber: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#F34D01",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "24px",
  },
  stepTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#333",
  },
  stepDescription: {
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#666",
  },
  ctaSection: {
    padding: "80px 5%",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
  },
  ctaHeading: {
    fontSize: "2.25rem",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#333",
  },
  ctaDescription: {
    fontSize: "1.125rem",
    lineHeight: "1.6",
    color: "#666",
    marginBottom: "32px",
    maxWidth: "600px",
    margin: "0 auto 32px",
  },
  primaryButton: {
    padding: "16px 32px",
    fontSize: "0.875rem",
    fontWeight: "600",
    backgroundColor: "#F34D01",
    color: "white",
    borderRadius: "30px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "0",
    position: "relative",
    border: "none",
    boxShadow:
      "0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset",
    width: "200px",
  },
  footer: {
    backgroundColor: "#ffffff",
    padding: "20px 5%",
    borderTop: "1px solid #eee",
  },
  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
  },
  copyright: {
    fontSize: "0.875rem",
    color: "#666",
    margin: 0,
  },
  footerLinks: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  footerLink: {
    color: "#666",
    textDecoration: "none",
    transition: "color 0.3s ease",
    fontSize: "0.875rem",
    "&:hover": {
      color: "#F34D01",
    },
  },
  sidebarOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",

    zIndex: 999,
    display: "flex",
    justifyContent: "flex-end",
    transition: "background 0.3s ease",
  },

  sidebar: {
    width: "200px",
    maxWidth: "80%",
    height: "100%",
    backgroundColor: "#fff",
    boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
    borderRadius: "20px 0 0px 20px",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    right: 0,
    top: 0,
  },

  sidebarLinks: {
    marginTop: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },

  closeButton: {
    alignSelf: "flex-end",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    marginBottom: "1rem",
  },
};
const styleSheet = document.createElement("style");
styleSheet.textContent = `

  .logo-clickable:hover {
    transform: scale(1.1);
  }
`;
document.head.appendChild(styleSheet);

// Add CSS for animations
const animationStyleSheet = document.createElement("style");
animationStyleSheet.textContent = `

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }

  @keyframes buttonShine {
    0% {
      background-position: -100% center;
    }
    100% {
      background-position: 200% center;
    }
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .get-started-button {
    transition: all 0.3s ease;
  }

  .hamburger-button {
    display: none !important;
  }

  .get-started-button:hover {
    transform: translateY(-2px);
    background: linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01);
    background-size: 200% auto;
    animation: buttonShine 1.5s linear infinite;
    box-shadow: 0 6px 15px rgba(243, 77, 1, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.3) inset;
  }

  .get-started-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(243, 77, 1, 0.2), 1px 1px 1px rgba(255, 255, 255, 0.3) inset;
  }

  .subheading-shine {
    background: linear-gradient(90deg, #333, #F34D01, #333);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 3s linear infinite;
  }

  .nav-link-active {
    color: #F34D01 !important;
    font-weight: 600;
  }

  .nav-link-active::after {
    transform: scaleX(1) !important;
  }

  .feature-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 32px rgba(243, 77, 1, 0.2);
  }

  .footer-link {
    position: relative;
  }

  .footer-link::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -2px;
    left: 0;
    background-color: #F34D01;
    transition: width 0.3s ease;
  }

  .footer-link:hover::after {
    width: 100%;
  }

  .feature-list-item {
    margin-bottom: 8px;
    padding-left: 24px;
    position: relative;
  }

  .feature-list-item::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #F34D01;
  }

  /* === THIN SCROLLBAR FOR ENTIRE PAGE === */
  /* WebKit (Chrome, Edge, Safari) */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #888 transparent;
  }

  /* Optional: Dark mode scrollbar */
  @media (prefers-color-scheme: dark) {
    ::-webkit-scrollbar-thumb {
      background: #666;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #999;
    }
    * {
      scrollbar-color: #666 transparent;
    }
  }

  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    /* Navbar */
    .navbar {
      background-color: #1a1a1a !important;
      border-bottom: 1px solid #333 !important;
    }
    
    .section-heading{color: #e0e0e0 !important;
    }

    /* Sidebar */
    .sidebar {
      background-color: #1a1a1a !important;
      box-shadow: -4px 0 12px rgba(255, 255, 255, 0.1) !important;
    }

    .sidebar-overlay {
      background-color: rgba(0, 0, 0, 0.7) !important;
    }

    /* Nav links */
    .nav-links a {
      color: #e0e0e0 !important;
    }

    .nav-links a:hover {
      color: #ff6b3d !important;
    }

    /* Nav button */
    .nav-button {
      background-color: #ff6b3d !important;
      box-shadow: 0 4px 10px rgba(255, 107, 61, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.2) inset !important;
    }

    .nav-button:hover {
      background: linear-gradient(90deg, #ff6b3d, #F34D01, #ff6b3d) !important;
      box-shadow: 0 6px 15px rgba(255, 107, 61, 0.4), 1px 1px 2px rgba(255, 255, 255, 0.2) inset !important;
    }

    /* Sections */
    .hero-section,
    .features-section,
    .how-it-works-section {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
    }

    /* Feature cards */
    .feature-card {
      background-color: #1e1e1e !important;
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.05) !important;
    }

    .feature-card:hover {
      box-shadow: 0 12px 32px rgba(255, 107, 61, 0.15) !important;
    }

    .feature-title {
      color: #e0e0e0 !important;
    }

    .feature-description {
      color: #a0a0a0 !important;
    }

    /* How it works steps */
    .step {
      background-color: #1e1e1e !important;
    }

    .step-title {
      color: #e0e0e0 !important;
    }

    .step-description {
      color: #a0a0a0 !important;
    }

    /* CTA section */
    .cta-section {
      background-color: #1a1a1a !important;
    }

    .cta-heading {
      color: #e0e0e0 !important;
    }

    .cta-description {
      color: #a0a0a0 !important;
    }

    .primary-button {
      background-color: #ff6b3d !important;
      box-shadow: 0 4px 10px rgba(255, 107, 61, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.2) inset !important;
    }

    .primary-button:hover {
      background: linear-gradient(90deg, #ff6b3d, #F34D01, #ff6b3d) !important;
      box-shadow: 0 6px 15px rgba(255, 107, 61, 0.4), 1px 1px 2px rgba(255, 255, 255, 0.2) inset !important;
    }

    /* Footer */
    .footer {
      background-color: #121212 !important;
      border-top: 1px solid #333 !important;
    }

    .footer-link,
    .copyright {
      color: #a0a0a0 !important;
    }

    .footer-link:hover {
      color: #ff6b3d !important;
    }

  }

  @media (max-width: 475px) {
    .villy-illustration-right {
      display: none !important;
    }
    .villy-illustration-mobile {
      display: block !important;
    }
    .feature-card-container {
      flex-direction: column !important;
      align-items: center !important;
    }
    .timeline-dot{
      display:none !important;
    }
    .patch-note-update {
      padding-left: 0px !important;
    }
  }

  @media (max-width: 475px) {
    .hero-grid {
      grid-template-columns: 1fr !important;
    }
    .hero-logo {
      height: 3rem !important;
      margin-top: 2rem;
    }
    .subheading-shine {
      font-size: 1.5rem !important;
      margin-top: 1rem !important;
    }
    .footer-content {
      flex-direction: column-reverse !important;
      align-items: center !important;
      text-align: center;
    }
    .footer-links {
      flex-direction: column !important;
      gap: 16px !important;
      margin-top: 16px;
    }
  }

  @media (min-width: 476px) {
    .hero-grid {
      grid-template-columns: 1fr 1fr !important;
    }
    .villy-illustration-mobile {
      display: none !important;
    }
  }

  @media (max-width: 376px) {
    .hamburger-button {
      display: block !important;
      background: transparent !important;
    }

    .section-heading {
      font-size: 1.5rem !important;
      margin: 0 0 0;
    }

    .nav-links {
      display: none !important;
    }

    .sidebar-overlay {
      animation: fadeIn 0.3s ease-out;
    }

    .sidebar {
      animation: slideInFromRight 0.3s ease-out forwards;
    }

    .sidebar.closing {
      animation: slideOutToRight 0.3s ease-out forwards;
    }

    .close-button:hover {
      color: #F34D01;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Added hover effect for patch note cards */
  .patch-note-card:hover {
    transform: translateX(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (prefers-color-scheme: dark) {
    .patch-note-card:hover {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
    }
  }

  /* Hide timeline line on mobile */
  @media (max-width: 475px) {
    .timeline-line {
      display: none !important;
    }
  }
`;
document.head.appendChild(animationStyleSheet);
export default Landing;
