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
import PatchNotes from "../components/lightswind/patch-notes";
import AnimateInView from "../components/lightswind/animate-in-view";
import { TrustedUsers } from "../components/lightswind/trusted-users";
import { getAuthToken } from "../utils/auth";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const patchNotesRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState("hero");
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Found a session token, redirect to /signin (which should then lead to /chat)
      setLoading(true);
      console.log("Session found on landing page, redirecting to /signin.");
      // Use a slight delay to ensure loading screen flashes
      const redirectTimer = setTimeout(() => {
        setLoading(false);
        // Redirect to signin; the signin component will handle validation and subsequent redirect to /chat
        navigate("/signin", { replace: true });
      }, 500);

      return () => clearTimeout(redirectTimer);
    }

    const container = containerRef.current;
    if (!container) return;

    // Map of ref to section name
    const sectionRefs = {
      hero: heroRef.current,
      features: featuresRef.current,
      "how-it-works": howItWorksRef.current,
      "patch-notes": patchNotesRef.current,
      cta: ctaRef.current,
      footer: footerRef.current,
    };

    // Filter out null refs and get the list of DOM elements
    const sections = Object.entries(sectionRefs)
      .filter(([, element]) => element)
      .map(([name, element]) => ({ name, element }));

    if (sections.length === 0) return;

    // === 1. Intersection Observer for Active Section Highlighting ===
    // Use a high threshold (80%) and rootMargin to identify the *primary* section
    const observerOptions = {
      root: container,
      rootMargin: "-50% 0px -50% 0px", // The target element only becomes active when it hits the middle 50% of the viewport.
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // The name is stored as the data-section-name attribute on the section div.
          const sectionName = entry.target.id;
          setActiveSection(sectionName);
          if (sectionName !== "hero") {
            setShowScrollIndicator(false);
          } else {
            setShowScrollIndicator(
              container.scrollTop < window.innerHeight / 2
            );
          }
        }
      });
    }, observerOptions);

    sections.forEach((s) => observer.observe(s.element));

    // === 2. Scroll Snapping Wheel Handler ===
    const SCROLL_DURATION = 500;
    let isScrolling = false;

    const getCurrentSectionIndex = () => {
      const center = container.scrollTop + container.clientHeight / 2;
      return sections.findIndex((section) => {
        return (
          section.element.offsetTop <= center &&
          section.element.offsetTop + section.element.offsetHeight > center
        );
      });
    };

    const scrollToSection = (index) => {
      if (index < 0 || index >= sections.length || isScrolling) return;
      isScrolling = true;
      sections[index].element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        isScrolling = false;
      }, SCROLL_DURATION);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (isScrolling) return;

      const delta = e.deltaY;
      let currentIndex = getCurrentSectionIndex();
      if (currentIndex === -1) currentIndex = 0;

      let nextIndex = currentIndex;
      if (delta > 0 && currentIndex < sections.length - 1)
        nextIndex = currentIndex + 1;
      if (delta < 0 && currentIndex > 0) nextIndex = currentIndex - 1;

      if (nextIndex !== currentIndex) {
        scrollToSection(nextIndex);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      observer.disconnect();
    };
  }, [setShowScrollIndicator]);

  useEffect(() => {
    // Triggers the Hero content to fade in once the component is mounted.
    setIsHeroVisible(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  useEffect(() => {
    document.title = "Civilify";
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const SCROLL_DURATION = 500; // <-- CONTROL THE SPEED HERE (in milliseconds)
    let isScrolling = false;

    const sections = [
      heroRef.current,
      featuresRef.current,
      howItWorksRef.current,
      patchNotesRef.current,
      ctaRef.current,
      footerRef.current,
    ].filter(Boolean);

    const getCurrentSectionIndex = () => {
      const offset = 50; // Account for the navbar height / scroll padding
      return sections.findIndex((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= offset && rect.bottom >= offset;
      });
    };

    const scrollToSection = (index) => {
      if (index < 0 || index >= sections.length || isScrolling) return;
      isScrolling = true;
      sections[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        isScrolling = false;
      }, SCROLL_DURATION);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (isScrolling) return;

      const delta = e.deltaY;
      let currentIndex = getCurrentSectionIndex();
      if (currentIndex === -1) {
        currentIndex = Math.round(container.scrollTop / window.innerHeight);
      }

      let nextIndex = currentIndex;
      if (delta > 0 && currentIndex < sections.length - 1)
        nextIndex = currentIndex + 1;
      if (delta < 0 && currentIndex > 0) nextIndex = currentIndex - 1;

      if (nextIndex !== currentIndex) {
        scrollToSection(nextIndex);
      }
      if (currentIndex === 0 && delta > 0) {
        setShowScrollIndicator(false);
      } else if (currentIndex === 1 && nextIndex === 0) {
        setShowScrollIndicator(true);
      } else if (currentIndex === 0 && delta < 0) {
        setShowScrollIndicator(true);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
    // NOTE: Make sure setShowScrollIndicator is included in the dependency array
  }, [setShowScrollIndicator]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const handleNavClick = (e, ref) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const index = [
      heroRef,
      featuresRef,
      howItWorksRef,
      patchNotesRef,
      ctaRef,
      footerRef,
    ].findIndex((r) => r === ref);
    const sections = [
      heroRef.current,
      featuresRef.current,
      howItWorksRef.current,
      patchNotesRef.current,
      ctaRef.current,
      footerRef.current,
    ];
    sections[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSignIn = () => {
    const token = getAuthToken(); // Get the token locally for this decision

    if (token) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // If logged in, go straight to chat
        navigate("/chat", { replace: true });
      }, 500); // Use a shorter, consistent timeout
      setIsMenuOpen(false);
      return;
    }

    // Original logic for logged-out users
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/signin");
    }, 1500); // Keep original, longer timeout for actual navigation
    setIsMenuOpen(false);
  };

  const handleSignup = () => {
    const token = getAuthToken(); // Get the token locally for this decision

    if (token) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // If logged in, go straight to chat
        navigate("/chat", { replace: true });
      }, 500);
      return;
    }

    // Original logic for logged-out users
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
        "Talk to Villy the way you'd talk to a person. Our AI instantly understands your question, recognizes legal terms, and provides clear, accurate guidance—no jargon needed. ",
      imageSrc: villyNaturalLanguage,
      imageAlt: "Natural language processing illustration",
      isDarkMode: isDarkMode,
    },
    {
      title: "Legal Analysis",
      subtitle: "Instant case intelligence",
      description:
        "Describe your legal situation to get a comprehensive analysis. Villy provides potential outcomes, identifies key legal risks, and gives you detailed, actionable answers tailored to Philippine law. ",
      imageSrc: villyLegalAnalysis,
      imageAlt: "Legal analysis illustration",
      isDarkMode: isDarkMode,
    },
    {
      title: "AI Assistance",
      subtitle: "Smart next steps, instantly",
      description:
        "Receive personalized, intelligent next steps based on your conversational query. Villy guides you through the process, making sure you always know the best way forward for your situation. ",
      imageSrc: villyAiAssistance,
      imageAlt: "AI assistance illustration",
      isDarkMode: isDarkMode,
    },
  ];

  // Inside your Landing component, before return()
  const patchNotes = [
    {
      appVersion: "v2.4.1",
      kbVersion: "v18",
      date: "October 28, 2025",
      tag: "IMPROVEMENT",
      title: "Enhanced AI Context Engine",
      changes: [
        "Improved understanding of multi-party legal disputes",
        "Added support for 12 new Philippine legal forms",
        "Reduced response latency by 42% in Case Analysis mode",
        "Enhanced citation accuracy for Supreme Court decisions",
      ],
      colorStart: "#8b5cf6",
      colorEnd: "#6d28d9",
      tagColor: "#8b5cf6",
      tagBgLight: "#faf5ff",
      tagBgDark: "#2d1f3d",
      tagBorderLight: "#e9d5ff",
      tagBorderDark: "#4a3366",
    },
    {
      appVersion: "v2.3.0",
      kbVersion: "v16",
      date: "August 15, 2025",
      tag: "FEATURE",
      title: "Document Upload & Analysis",
      changes: [
        "Upload contracts, complaints, or court orders",
        "AI extracts key clauses and risks instantly",
        "Generate plain-language summaries",
        "Export findings as PDF or share via link",
      ],
      colorStart: "#F34D01",
      colorEnd: "#d94600",
      tagColor: "#F34D01",
      tagBgLight: "#fff5f0",
      tagBgDark: "#2d1f1a",
      tagBorderLight: "#ffd4c0",
      tagBorderDark: "#4a2f24",
    },
    // Add more...
  ];
  return (
    <>
      <div
        ref={containerRef}
        className="scroll-snap-container"
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",

          overflowY: "scroll",
          scrollSnapType: "y mandatory", // Primary scroll snap property
          scrollBehavior: "smooth", // Ensure smooth scrolling
        }}
      >
        <nav style={styles.navbar}>
          <div style={styles.logoContainer}>
            <AnimateInView animationType="slide-left" delay={100}>
              <img
                src={logoIconOrange || "/placeholder.svg"}
                alt="Civilify Logo"
                style={styles.logo}
                onClick={handleLogoClick}
                className="logo-clickable"
              />
            </AnimateInView>
          </div>
          <div style={styles.navContainer}>
            <AnimateInView animationType="slide-right" delay={100}>
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
            </AnimateInView>

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
              <AnimateInView animationType="slide-right" delay={100}>
                <a
                  href="#features"
                  style={{
                    ...styles.navLink,
                    color:
                      activeSection === "features" || activeSection === "cta"
                        ? "#F34D01"
                        : isDarkMode
                        ? "#e0e0e0"
                        : "#333",
                    fontWeight:
                      activeSection === "features" || activeSection === "cta"
                        ? "600"
                        : "500",
                  }}
                  onClick={(e) => handleNavClick(e, featuresRef)}
                >
                  Features
                </a>
              </AnimateInView>
              <AnimateInView animationType="slide-right" delay={200}>
                <a
                  href="#how-it-works"
                  style={{
                    ...styles.navLink,
                    color:
                      activeSection === "how-it-works" ||
                      activeSection === "cta"
                        ? "#F34D01"
                        : isDarkMode
                        ? "#e0e0e0"
                        : "#333",
                    fontWeight:
                      activeSection === "how-it-works" ||
                      activeSection === "cta"
                        ? "600"
                        : "500",
                  }}
                  onClick={(e) => handleNavClick(e, howItWorksRef)}
                >
                  How It Works
                </a>
              </AnimateInView>
              <AnimateInView animationType="slide-right" delay={300}>
                <a
                  href="#patch-notes"
                  style={{
                    ...styles.navLink,
                    color:
                      activeSection === "patch-notes" || activeSection === "cta"
                        ? "#F34D01"
                        : isDarkMode
                        ? "#e0e0e0"
                        : "#333",
                    fontWeight:
                      activeSection === "patch-notes" || activeSection === "cta"
                        ? "600"
                        : "500",
                  }}
                  onClick={(e) => handleNavClick(e, patchNotesRef)}
                >
                  What's New
                </a>
              </AnimateInView>
              <AnimateInView animationType="slide-right" delay={400}>
                <button style={styles.navButton} onClick={handleSignIn}>
                  Sign In
                </button>
              </AnimateInView>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div
          id="hero"
          ref={heroRef}
          className="scroll-snap-section"
          style={{
            backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            overflowX: "hidden",
            // ADD: position: relative is the anchor for the absolute grid
            position: "relative",
            // ADD: clip the grid if it overflows the 100vh section
            overflow: "hidden",
            scrollSnapAlign: "start",
            opacity: isHeroVisible ? 1 : 0, // Control opacity with state
            transition: "opacity 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0, // Top, right, bottom, left 0
              zIndex: 0, // Should be behind content
            }}
          >
            <BeamGridBackground />
          </div>
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <AnimateInView delay={100} flexDirection="col">
              {/* 1. TITLE MASK */}
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

              {/* 2. SUBHEADING */}
              <AnimateInView delay={300}>
                <h2
                  style={{ ...styles.subheading, zIndex: 1 }}
                  className="subheading-shine"
                >
                  AI-Powered Legal Clarity
                </h2>
              </AnimateInView>

              {/* 3. DESCRIPTION */}
              <AnimateInView delay={500}>
                <p
                  style={{
                    ...styles.description,
                    color: isDarkMode ? "#d1d5db" : "#4b5563",
                    padding: "1em",
                    zIndex: 1,
                  }}
                  className={`text-gray-300 p-4 sm:p-6 md:p-8 text-sm sm:text-base md:text-lg leading-relaxed z-10`}
                >
                  Ask a legal question, assess your legal case, get insights,
                  and know what to do next with{" "}
                  <span style={styles.highlight}>Villy</span>, your intelligent
                  legal companion.
                </p>
              </AnimateInView>

              {/* 4. BUTTON */}
              <AnimateInView
                delay={700}
                contentAlign="center"
                contentJustify="center"
              >
                <button
                  style={{ ...styles.primaryButton }}
                  onClick={handleSignup}
                  className="get-started-button text-base leading-6 text-gray-600 mb-8 sm:text-lg sm:leading-7 md:text-xl md:leading-8 md:mb-10 mx-auto"
                  variant="contained"
                >
                  Chat Villy Now
                </button>
              </AnimateInView>
            </AnimateInView>
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
        {/* Features Section */}
        <div
          id="features"
          ref={featuresRef}
          className="scroll-snap-section"
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
            scrollSnapAlign: "start",
          }}
        >
          <AnimateInView animationType="fade-in" delay={0}>
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
          </AnimateInView>
          <AnimateInView animationType="slide-up" delay={100}>
            <h2
              style={{
                fontSize: "clamp(2rem, 8vw, 3rem)", // Min: 2rem, Ideal: 8vw, Max: 3rem
                fontWeight: "700",
                color: isDarkMode ? "#ffffff" : "#F34D01",
                paddingTop: "1em",
                position: "relative",
                zIndex: 1,
              }}
            >
              Features
            </h2>
          </AnimateInView>
          <AnimateInView animationType="slide-up" delay={200}>
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
          </AnimateInView>
        </div>
        {/* How It Works Section */}
        <div
          id="how-it-works"
          ref={howItWorksRef}
          className="scroll-snap-section"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            justifyContent: "center",
            scrollSnapAlign: "start",
          }}
        >
          <AnimateInView animationType="slide-up" delay={100}>
            <h2
              style={{
                fontSize: "clamp(2rem, 8vw, 3rem)", // Min: 2rem, Ideal: 8vw, Max: 3rem
                fontWeight: "700",
                color: isDarkMode ? "#ffffff" : "#F34D01",
                paddingTop: "1em",
                position: "relative",
                zIndex: 1,
              }}
            >
              How It Works
            </h2>
          </AnimateInView>

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
                  <strong>General Information</strong> for quick, broad legal
                  questions, or select
                  <br />
                  <br /> <strong>Case Analysis</strong> for a detailed,
                  personalized assessment of your specific legal situation.
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
                  Villy uses Philippine law and legal precedents to generate
                  instant, <strong>detailed insights</strong> based on your
                  chosen mode. You'll receive clear, actionable information and
                  initial recommendations.
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
                  className="number-three-icon"
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
                  Review the <strong>guided next steps</strong> and clear
                  insights provided by Villy.
                  <br /> You'll understand the{" "}
                  <strong>best path forward</strong> for your situation,
                  empowering you to take effective action.
                </p>
              </GlowingCard>
            </GlowingCards>
          </div>
        </div>

        {/* Patch Notes Section */}
        <div
          id="patch-notes"
          ref={patchNotesRef}
          className="scroll-snap-section"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#0d0d0d" : "#f8f9fa",
            justifyContent: "center",
            padding: "2em",
            scrollSnapAlign: "start",
            position: "relative",
            overflow: "hidden",
            scrollSnapAlign: "start",
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
          <AnimateInView animationType="slide-up" delay={100}>
            <h2
              style={{
                fontSize: "clamp(2rem, 8vw, 3rem)", // Min: 2rem, Ideal: 8vw, Max: 3rem
                fontWeight: "700",
                color: isDarkMode ? "#ffffff" : "#F34D01",
                // paddingBottom: "1em",
                position: "relative",
                zIndex: 1,
              }}
            >
              What's New
            </h2>
          </AnimateInView>
          <PatchNotes notes={patchNotes} isDarkMode={isDarkMode} />
        </div>

        {/* CTA Section */}
        <div
          id="cta"
          ref={ctaRef}
          className="scroll-snap-section"
          style={{
            padding: "80px 5%",
            textAlign: "center",
            // backgroundColor: isDarkMode ? "#181818" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "90vh",
            scrollSnapAlign: "start",

            position: "relative",
            overflow: "hidden",
          }}
        >
          <video
            id="video-background"
            autoPlay
            loop
            muted
            playsInline
            poster="https://plus.unsplash.com/premium_photo-1698084059560-9a53de7b816b?q=80&w=1111&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://plus.unsplash.com/premium_photo-1698084059560-9a53de7b816b?q=80&w=2011&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Optional: A static image to show while loading
            style={{
              // CSS to make the video cover the entire area
              position: "absolute",
              top: "50%",
              left: "50%",
              minWidth: "100%",
              minHeight: "100%",
              width: "auto",
              height: "auto",
              zIndex: "0", // Send it behind the content
              transform: "translate(-50%, -50%)", // Center it perfectly
              objectFit: "cover", // Ensures it covers without distortion
              opacity: 1, // Slightly dim the video for better text readability
            }}
          >
            <source
              src="https://assets.mixkit.co/videos/47687/47687-720.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
          <div
            style={{
              position: "relative",
              zIndex: 10, // Bring content to the front
              width: "100%", // Optional: Add a subtle overlay color for better text readability
              // backgroundColor: isDarkMode
              //   ? "rgba(255, 255, 255, 0.4)"
              //   : "rgba(0, 0, 0, 0.4)",
              padding: "20px", // Add some padding around the text
            }}
          >
            <h2
              style={{
                fontSize: "4rem",
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
                color: isDarkMode ? "white" : "white",
                marginBottom: "32px",
                maxWidth: "600px",
                margin: "0 auto 32px",
              }}
            >
              Join thousands of users who trust Civilify for their legal needs.
            </p>

            <TrustedUsers
              avatars={[
                "https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQ24oBB2hUUQvi1yVx5xTgtglt1IunMbROHsMMPz34Cf5PB-V6G_uIiNjwV3-YLmfbfAw-lJqaVYCUYr3j5OLMsDQzJcCHDFiZTkxyCQqKreuWh9gw",
                "https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQKsofwXDcBe8IsN5tj2-D1xUCTWGCrQN-2y_lDa-c-vNaI_L9L5KZ1EzIfMTI-IEHwixcHfJhom9x15nXFJD2aR14_6UayxGjAc1G0NIuyCxYUX1M",
                "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              ]}
              rating={5}
              totalUsersText={5000}
              caption="Loved by"
              starColorClass="text-yellow-400"
              ringColors={[
                "ring-pink-500",
                "ring-green-500",
                "ring-blue-500",
                "ring-purple-500",
              ]}
            />
            <br />

            <button
              style={styles.primaryButton}
              onClick={handleSignup}
              className="get-started-button"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer
          id="footer"
          ref={footerRef}
          className="scroll-snap-footer"
          style={{
            backgroundColor: isDarkMode ? "#0d0d0d" : "#ffffff",
            padding: "20px 5%",
            borderTop: isDarkMode ? "1px solid #333" : "1px solid #eee",
            scrollSnapAlign: "start",
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
  navContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  hamburgerButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
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
    border: "none",
    boxShadow:
      "0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset",
  },
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
  sidebarOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
    transition: "background 0.25s ease, opacity 0.25s ease",
  },
  sidebar: {
    width: "280px",
    maxWidth: "92%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.98)",
    backdropFilter: "saturate(120%) blur(6px)",
    boxShadow: "-18px 0 40px rgba(2,6,23,0.12)",
    borderRadius: "16px 0 0 16px",
    padding: "1.25rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 1001,
    overflowY: "auto",
    gap: "1rem",
  },
  sidebarLinks: {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    paddingTop: "0.5rem",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    minHeight: "200px",
  },
  closeButton: {
    alignSelf: "flex-end",
    background: "transparent",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    marginBottom: "0.25rem",
    padding: "6px",
    borderRadius: "8px",
    transition: "background 0.15s ease",
    color: "#1f2937",
  },
};
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .logo-clickable:hover {
    transform: scale(1.1);
  }

  /* ADD THIS BLOCK to animationStyleSheet.textContent */

/* === CSS SCROLL SNAP STYLES === */
.scroll-snap-container {
  scroll-snap-type: y mandatory !important; 
  
  height: 100vh;
  overflow-y: scroll;
}

.scroll-snap-section {
  scroll-snap-align: start;
  min-height: 100vh; 
  display: flex; 
  flex-direction: column;
}

.scroll-snap-footer {
  scroll-snap-align: start;
  min-height: 10vh; 
}

/* Scroll Padding: Important for fixed header */
.scroll-snap-container {
  scroll-padding-top: 10px !important;

/* === END CSS SCROLL SNAP STYLES === */

.is-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

/* 1. SIMPLE FADE (For sections/large blocks) */
.animate-fade-in {
  /* Inherits opacity transition from the component wrapper */
  opacity: 1; 
  /* Ensures no vertical shift if you only want a fade */
  transform: translateY(0); 
}

/* 2. SLIDE UP (For cards/content elements) */
.animate-slide-up {
  /* The component wrapper handles the transition from translate-y-8 to 0 */
  opacity: 1;
  transform: translateY(0);
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
    }

    .sidebar-overlay {
      background-color: rgba(0, 0, 0, 0.7) !important;
    }

    /* Nav links */
    .nav-links a {
      color: #e0e0e0;
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
@media (max-width: 768px) and (min-width: 475px){
  .number-three-icon{
  width: 250px !important;   /* e.g., 40px, a good size for an interactive icon */
    height: 250px !important;  /* Ensure it's a perfect square if it's an icon */
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

  @media (max-width: 475px) {
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

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
