import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logoIconOrange from "../assets/images/logoiconorange.png";
import logoTextOrange from "../assets/images/logotextorange.png";
import heroImage from "../assets/images/heropic.png";
import villy3dIllustration from "../assets/images/villy_3dillustration.png";
import villy3dIllustrationCropped from "../assets/images/villy_3dillustration_cropped.png";
import featureIcon1 from "../assets/images/1.png";
import featureIcon2 from "../assets/images/2.png";
import featureIcon3 from "../assets/images/3.png";
import number1Icon from "../assets/images/1(1).png";
import number2Icon from "../assets/images/2(1).png";
import number3Icon from "../assets/images/3(1).png";
import LoadingScreen from "./LoadingScreen";

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const [activeSection, setActiveSection] = useState("hero");
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Smooth scroll function
  const smoothScroll = (element) => {
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Handle logo click
  const handleLogoClick = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setIsMenuOpen(false);
  };

  // Handle navigation link clicks
  const handleNavClick = (e, ref) => {
    e.preventDefault();
    smoothScroll(ref.current);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    if (heroRef.current) observer.observe(heroRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (howItWorksRef.current) observer.observe(howItWorksRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Update active section based on scroll position
      const heroPosition = heroRef.current?.getBoundingClientRect();
      const featuresPosition = featuresRef.current?.getBoundingClientRect();
      const howItWorksPosition = howItWorksRef.current?.getBoundingClientRect();

      if (
        heroPosition &&
        heroPosition.top <= 100 &&
        heroPosition.bottom >= 100
      ) {
        setActiveSection("hero");
      } else if (
        featuresPosition &&
        featuresPosition.top <= 100 &&
        featuresPosition.bottom >= 100
      ) {
        setActiveSection("features");
      } else if (
        howItWorksPosition &&
        howItWorksPosition.top <= 100 &&
        howItWorksPosition.bottom >= 100
      ) {
        setActiveSection("howItWorks");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Scroll indicator fade logic
    const handleScrollIndicator = () => {
      if (window.scrollY > 40) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener("scroll", handleScrollIndicator);
    return () => window.removeEventListener("scroll", handleScrollIndicator);
  }, []);

  useEffect(() => {
    document.title = "Civilify";
  }, []);

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
        }, 300); // Match animation duration
      }
    }
  };

  // Handle wheel events for section locking
  useEffect(() => {
    const handleWheel = (e) => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Define section positions
      const heroTop = heroRef.current?.offsetTop || 0;
      const featuresTop = featuresRef.current?.offsetTop || 0;
      const howItWorksTop = howItWorksRef.current?.offsetTop || 0;
      const footerTop = document.querySelector("footer")?.offsetTop || 0;

      // Determine current section and scroll direction
      let targetPosition;

      if (e.deltaY > 0) {
        // Scrolling down
        if (scrollY < featuresTop - windowHeight / 2) {
          targetPosition = featuresTop;
        } else if (scrollY < howItWorksTop - windowHeight / 2) {
          targetPosition = howItWorksTop;
        } else if (scrollY < footerTop - windowHeight / 2) {
          targetPosition = footerTop;
        }
      } else {
        // Scrolling up
        if (scrollY > howItWorksTop + windowHeight / 2) {
          targetPosition = howItWorksTop;
        } else if (scrollY > featuresTop + windowHeight / 2) {
          targetPosition = featuresTop;
        } else if (scrollY > heroTop + windowHeight / 2) {
          targetPosition = heroTop;
        }
      }

      // Scroll to target position if defined
      if (targetPosition !== undefined) {
        e.preventDefault();
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Function to navigate to docs with a specific section
  const navigateToDocsSection = (sectionId) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("selectedDocSection", sectionId);
      navigate("/civilify-documents");
    }, 1500);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <img
            src={logoIconOrange}
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
                      color: activeSection === "features" ? "#F34D01" : "#333",
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
                        activeSection === "howItWorks" ? "#F34D01" : "#333",
                      fontWeight:
                        activeSection === "howItWorks" ? "600" : "500",
                    }}
                    onClick={(e) => handleNavClick(e, howItWorksRef)}
                  >
                    How It Works
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
                color: activeSection === "features" ? "#F34D01" : "#333",
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
                color: activeSection === "howItWorks" ? "#F34D01" : "#333",
                fontWeight: activeSection === "howItWorks" ? "600" : "500",
              }}
              onClick={(e) => handleNavClick(e, howItWorksRef)}
            >
              How It Works
            </a>
            <button style={styles.navButton} onClick={handleSignIn}>
              Sign In
            </button>
          </div>
        </div>
      </nav>
      <div
        ref={heroRef}
        style={{
          ...styles.heroSection,
          opacity: 0,
          transform: "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}
      >
        <div style={styles.heroGrid} className="hero-grid">
          {/* Left: Text */}
          <div style={styles.heroLeft}>
            <div style={styles.heroContent}>
              <img
                src={logoTextOrange}
                alt="Civilify"
                style={styles.heroLogo}
                className="hero-logo"
              />
              <h2 style={styles.subheading} className="subheading-shine">
                AI-Powered Legal Clarity
              </h2>
              <p style={styles.description}>
                Ask a legal question, assess your legal case, get insights, and
                know what to do next with{" "}
                <span style={styles.highlight}>Villy</span>, your intelligent
                legal companion.
              </p>
              <button
                style={styles.primaryButton}
                onClick={handleSignup}
                className="get-started-button"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Right: Villy bot */}
          <div style={styles.heroRight}>
            <img
              src={villy3dIllustrationCropped}
              alt="Villy AI Assistant"
              style={styles.villyIllustration}
              className="villy-illustration"
            />
          </div>
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
          ...styles.featuresSection,
          opacity: 0,
          transform: "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}
      >
        <h2 style={styles.sectionHeading} className="section-heading">
          Features
        </h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard} className="feature-card ">
            <img
              src={featureIcon1}
              alt="Natural Language Processing"
              style={styles.featureImage}
            />
            <h3 style={{ ...styles.featureTitle, fontSize: "1.25rem" }}>
              Natural Language Processing
            </h3>
            <p style={styles.featureDescription}>
              <span>
                Communicate with Villy in plain English, just like talking to a
                legal expert. Our AI understands context and legal terminology
                to provide clear, accurate guidance for your legal needs.
              </span>
            </p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <img
              src={featureIcon2}
              alt="Legal Analysis"
              style={styles.featureImage}
            />
            <h3 style={styles.featureTitle}>Legal Analysis</h3>
            <p style={styles.featureDescription}>
              <span>
                Get comprehensive analysis of your legal situation or detailed
                answers to your legal questions, with potential outcomes and
                recommended actions tailored to your needs.
              </span>
            </p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <img
              src={featureIcon3}
              alt="AI Assistance"
              style={styles.featureImage}
            />
            <h3 style={styles.featureTitle}>AI Assistance</h3>
            <p style={styles.featureDescription}>
              <span>
                Receive intelligent suggested next steps and personalized
                guidance powered by advanced AI technology, whether you're
                asking general questions or analyzing a specific case.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        id="how-it-works"
        ref={howItWorksRef}
        style={{
          ...styles.howItWorksSection,
          opacity: 0,
          transform: "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}
      >
        <h2 style={styles.sectionHeading} className="section-heading">
          How It Works
        </h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard} className="feature-card">
            <img src={number1Icon} alt="Step 1" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Choose Your Mode</h3>
            <p style={styles.featureDescription}>
              <span>
                Select between General Legal Information for quick answers to
                legal questions, or Case Analysis for a detailed assessment of
                your specific legal situation. Pick the mode that fits your
                needs best.
              </span>
            </p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <img src={number2Icon} alt="Step 2" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Get AI-Powered Answers</h3>
            <p style={styles.featureDescription}>
              <span>
                Receive detailed insights and recommendations based on
                Philippine law and legal precedents, tailored to your chosen
                mode. Villy provides clear, actionable information every step of
                the way.
              </span>
            </p>
          </div>
          <div style={styles.featureCard} className="feature-card">
            <img src={number3Icon} alt="Step 3" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Take Action</h3>
            <p style={styles.featureDescription}>
              <span>
                Follow the guided next steps, gain clear insights, and
                understand the best path forward for your situation—whether you
                need general information or specific case guidance, Villy is
                here to help.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div style={styles.ctaSection}>
        <h2 style={styles.ctaHeading} className="subheading-shine">
          Ready to Get Started?
        </h2>
        <p style={styles.ctaDescription}>
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

      <footer style={styles.footer}>
        <div style={styles.footerContent} className="footer-content">
          <p style={styles.copyright}>© The Civilify Company, Cebu City 2025</p>
          <div style={styles.footerLinks} className="footer-links">
            <a
              href="/civilify-documents"
              onClick={(e) => {
                e.preventDefault();
                navigateToDocsSection("what-is");
              }}
              style={styles.footerLink}
            >
              What is Civilify
            </a>
            <a
              href="/civilify-documents"
              onClick={(e) => {
                e.preventDefault();
                navigateToDocsSection("why-use");
              }}
              style={styles.footerLink}
            >
              Why use Civilify
            </a>
            <a
              href="/civilify-documents"
              onClick={(e) => {
                e.preventDefault();
                navigateToDocsSection("getting-started");
              }}
              style={styles.footerLink}
            >
              FAQs
            </a>
            <a
              href="/civilify-documents"
              onClick={(e) => {
                e.preventDefault();
                navigateToDocsSection("security");
              }}
              style={styles.footerLink}
            >
              Security and Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
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
    backgroundColor: "#ffffff",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottom: "1px solid #eee",
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
  heroSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5%",
    minHeight: "100vh",
    borderBottom: "1px solid #eee",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  heroContainer: {
    display: "flex",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    position: "relative",
  },

  heroContent: {
    maxWidth: "450px",
    textAlign: "center",
  },
  heroLogo: {
    height: "4rem",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: window.innerWidth <= 475 ? "1fr" : "1fr 1fr",
    // gap: "40px",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    alignItems: "center",
  },

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  heroRight: {
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
    fontSize: "1rem",
    lineHeight: "1.6",
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
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1.5em",
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
    display: "flex",
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
    display: "inline-block",
    position: "relative",
    border: "none",
    boxShadow:
      "0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset",
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

// Add CSS for logo hover effect
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

  @media (max-width: 475px) {
    .villy-illustration {
      display: none !important;
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
  }

  @media (max-width: 330px) {
    .hamburger-button {
      display: block !important;
      background: transparent !important;
    }

    .section-heading {
      font-size: 1.5rem !important;
      margin: 0 0 0 
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
`;
document.head.appendChild(animationStyleSheet);

export default Landing;
