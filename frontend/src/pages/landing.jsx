import { useNavigate } from 'react-router-dom';import { useEffect, useRef, useState } from 'react';
import logoIconOrange from '../assets/images/logoiconorange.png';
import logoTextOrange from '../assets/images/logotextorange.png';
import heroImage from '../assets/images/heropic.png';

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // Smooth scroll function
  const smoothScroll = (element) => {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Handle logo click
  const handleLogoClick = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle navigation link clicks
  const handleNavClick = (e, ref) => {
    e.preventDefault();
    smoothScroll(ref.current);
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
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
      // Show back to top button after scrolling 300px
      setShowBackToTop(window.scrollY > 300);

      // Update active section based on scroll position
      const heroPosition = heroRef.current?.getBoundingClientRect();
      const featuresPosition = featuresRef.current?.getBoundingClientRect();
      const howItWorksPosition = howItWorksRef.current?.getBoundingClientRect();

      if (heroPosition && heroPosition.top <= 100 && heroPosition.bottom >= 100) {
        setActiveSection('hero');
      } else if (featuresPosition && featuresPosition.top <= 100 && featuresPosition.bottom >= 100) {
        setActiveSection('features');
      } else if (howItWorksPosition && howItWorksPosition.top <= 100 && howItWorksPosition.bottom >= 100) {
        setActiveSection('howItWorks');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCardClick = (index) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

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
        <div style={styles.navLinks}>
          <a 
            href="#features" 
            style={{
              ...styles.navLink,
              color: activeSection === 'features' ? '#F34D01' : '#333',
              fontWeight: activeSection === 'features' ? '600' : '500'
            }}
            onClick={(e) => handleNavClick(e, featuresRef)}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            style={{
              ...styles.navLink,
              color: activeSection === 'howItWorks' ? '#F34D01' : '#333',
              fontWeight: activeSection === 'howItWorks' ? '600' : '500'
            }}
            onClick={(e) => handleNavClick(e, howItWorksRef)}
          >
            How It Works
          </a>
          <button style={styles.navButton} onClick={handleSignIn}>Sign In</button>
        </div>
      </nav>

      {showBackToTop && (
        <button 
          style={styles.backToTop}
          onClick={handleBackToTop}
          className="back-to-top-button"
        >
          ↑
        </button>
      )}

      <div ref={heroRef} style={{...styles.heroSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <div style={styles.heroContent}>
          <img src={logoTextOrange} alt="Civilify" style={styles.heroLogo} />
          <h2 style={styles.subheading} className="subheading-shine">AI-Powered Legal Clarity</h2>
          <p style={styles.description}>
            Assess your legal case, get insights, and generate documents with <span style={styles.highlight}>Villy</span>, your intelligent legal companion.
          </p>
          <button style={styles.primaryButton} onClick={handleSignup} className="get-started-button">
            Get Started
          </button>
        </div>
        <div style={styles.heroImages}>
          <img src={heroImage} alt="Legal Assistant 1" style={styles.heroImg} />
          <img src={heroImage} alt="Legal Assistant 2" style={styles.heroImg} />
          <img src={heroImage} alt="Legal Assistant 3" style={styles.heroImg} />
        </div>
      </div>
      
      <div id="features" ref={featuresRef} style={{...styles.featuresSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <h2 style={styles.sectionHeading}>Features</h2>
        <div style={styles.featuresGrid}>
          <div 
            style={{
              ...styles.featureCard,
              transform: hoveredCard === 0 ? 'translateY(-10px)' : 'none',
              boxShadow: hoveredCard === 0 ? '0 12px 32px rgba(243, 77, 1, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={() => setHoveredCard(0)}
            onMouseLeave={() => setHoveredCard(null)}
            className="feature-card"
          >
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.featureTitle}>Natural Language Processing</h3>
            <p style={styles.featureDescription}>
              Communicate with Villy in plain English. Our AI understands context and nuance to provide accurate legal guidance.
            </p>
            <button 
              style={styles.learnMoreButton}
              onClick={() => handleCardClick(0)}
            >
              {expandedCard === 0 ? 'Show Less' : 'Learn More'}
            </button>
            {expandedCard === 0 && (
              <div style={styles.expandedContent}>
                <ul style={styles.featureList}>
                  <li className="feature-list-item">Advanced context understanding</li>
                  <li className="feature-list-item">Multi-language support</li>
                  <li className="feature-list-item">Real-time conversation analysis</li>
                </ul>
              </div>
            )}
          </div>
          <div 
            style={{
              ...styles.featureCard,
              transform: hoveredCard === 1 ? 'translateY(-10px)' : 'none',
              boxShadow: hoveredCard === 1 ? '0 12px 32px rgba(243, 77, 1, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className="feature-card"
          >
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Case Analysis</h3>
            <p style={styles.featureDescription}>
              Get comprehensive analysis of your legal situation with potential outcomes and recommended actions.
            </p>
            <button 
              style={styles.learnMoreButton}
              onClick={() => handleCardClick(1)}
            >
              {expandedCard === 1 ? 'Show Less' : 'Learn More'}
            </button>
            {expandedCard === 1 && (
              <div style={styles.expandedContent}>
                <ul style={styles.featureList}>
                  <li className="feature-list-item">Detailed case assessment</li>
                  <li className="feature-list-item">Risk analysis and predictions</li>
                  <li className="feature-list-item">Actionable recommendations</li>
                </ul>
              </div>
            )}
          </div>
          <div 
            style={{
              ...styles.featureCard,
              transform: hoveredCard === 2 ? 'translateY(-10px)' : 'none',
              boxShadow: hoveredCard === 2 ? '0 12px 32px rgba(243, 77, 1, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className="feature-card"
          >
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>AI Assistance</h3>
            <p style={styles.featureDescription}>
              Receive intelligent suggestions and document generation assistance powered by advanced AI technology.
            </p>
            <button 
              style={styles.learnMoreButton}
              onClick={() => handleCardClick(2)}
            >
              {expandedCard === 2 ? 'Show Less' : 'Learn More'}
            </button>
            {expandedCard === 2 && (
              <div style={styles.expandedContent}>
                <ul style={styles.featureList}>
                  <li className="feature-list-item">Smart document generation</li>
                  <li className="feature-list-item">Legal form assistance</li>
                  <li className="feature-list-item">24/7 AI support</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="how-it-works" ref={howItWorksRef} style={{...styles.howItWorksSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <h2 style={styles.sectionHeading}>How It Works</h2>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Describe Your Case</h3>
            <p style={styles.stepDescription}>
              Tell us about your legal situation in simple terms.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Get AI Analysis</h3>
            <p style={styles.stepDescription}>
              Receive detailed insights and recommendations.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Take Action</h3>
            <p style={styles.stepDescription}>
              Generate documents and follow guided next steps.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.ctaSection}>
        <h2 style={styles.ctaHeading} className="subheading-shine">Ready to Get Started?</h2>
        <p style={styles.ctaDescription}>
          Join thousands of users who trust Civilify for their legal needs.
        </p>
        <button style={styles.primaryButton} onClick={handleSignup} className="get-started-button">
          Get Started
        </button>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.copyright}>© The Civilify Company, Cebu City 2025</p>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>What is Civilify</a>
            <a href="#" style={styles.footerLink}>Why use Civilify</a>
            <a href="#" style={styles.footerLink}>FAQs</a>
            <a href="#" style={styles.footerLink}>Security and Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 5%',
    backgroundColor: '#ffffff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottom: '1px solid #eee',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: '40px',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    padding: '8px 0',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '2px',
      backgroundColor: '#F34D01',
      transform: 'scaleX(0)',
      transition: 'transform 0.3s ease',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
    },
  },
  navButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#F34D01',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '100px 5% 40px',
    textAlign: 'center',
    minHeight: 'calc(100vh - 60px)',
  },
  heroContent: {
    width: '100%',
    marginBottom: '60px',
    padding: '0 5%',
  },
  heroLogo: {
    height: '60px',
    marginBottom: '24px',
  },
  subheading: {
    fontSize: '36px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#333',
    background: 'linear-gradient(90deg, #333, #F34D01, #333)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'shine 3s linear infinite',
  },
  description: {
    fontSize: '18px',
    lineHeight: '1.6',
    marginBottom: '32px',
    color: '#666',
    maxWidth: '600px',
    margin: '0 auto 32px',
  },
  highlight: {
    color: '#F34D01',
    fontWeight: '600',
  },
  heroImages: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    width: '100%',
    padding: '0 5%',
  },
  heroImg: {
    width: '30%',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  },
  featuresSection: {
    padding: '60px 5%',
    backgroundColor: '#f8f9fa',
    minHeight: 'calc(100vh - 60px)',
  },
  sectionHeading: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '48px',
    color: '#333',
    textAlign: 'center',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 5%',
    transform: 'translateX(-5%)',
  },
  featureCard: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    height: '350px',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  featureDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    flex: 1,
  },
  expandedContent: {
    marginTop: '24px',
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0',
  },
  learnMoreButton: {
    backgroundColor: 'transparent',
    border: '1px solid #F34D01',
    color: '#F34D01',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 'auto',
    alignSelf: 'center',
    '&:hover': {
      backgroundColor: '#F34D01',
      color: 'white',
    },
  },
  howItWorksSection: {
    padding: '60px 5%',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 60px)',
  },
  stepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 5%',
    transform: 'translateX(-5%)',
  },
  step: {
    padding: '32px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  stepNumber: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  stepDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
  },
  ctaSection: {
    padding: '80px 5%',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  ctaHeading: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#333',
  },
  ctaDescription: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#666',
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px',
  },
  primaryButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#F34D01',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
    marginBottom: '40px',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: '20px 5%',
    borderTop: '1px solid #eee',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },
  copyright: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#666',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    fontSize: '14px',
    '&:hover': {
      color: '#F34D01',
    },
  },
  backToTop: {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    boxShadow: '0 4px 12px rgba(243, 77, 1, 0.3)',
    transition: 'all 0.3s ease',
    zIndex: 1000,
  },
};

// Add CSS for logo hover effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .logo-clickable:hover {
    transform: scale(1.1);
  }
`;
document.head.appendChild(styleSheet);

// Add CSS for animations
const animationStyleSheet = document.createElement('style');
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

  .get-started-button {
    transform: translateY(0);
    transition: all 0.3s ease;
  }

  .get-started-button:hover {
    transform: translateY(-4px);
    background: linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01);
    background-size: 200% auto;
    animation: buttonShine 1.5s linear infinite;
  }

  .back-to-top-button:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(243, 77, 1, 0.4);
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
`;
document.head.appendChild(animationStyleSheet);

export default Landing;
