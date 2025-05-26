import { useNavigate } from 'react-router-dom';import { useEffect, useRef, useState } from 'react';
import logoIconOrange from '../assets/images/logoiconorange.png';
import logoTextOrange from '../assets/images/logotextorange.png';
import heroImage from '../assets/images/heropic.png';
import villy3dIllustration from '../assets/images/villy_3dillustration.png';
import villy3dIllustrationCropped from '../assets/images/villy_3dillustration_cropped.png';
import featureIcon1 from '../assets/images/1.png';
import featureIcon2 from '../assets/images/2.png';
import featureIcon3 from '../assets/images/3.png';
import number1Icon from '../assets/images/1(1).png';
import number2Icon from '../assets/images/2(1).png';
import number3Icon from '../assets/images/3(1).png';
import LoadingScreen from './LoadingScreen';

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

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

  useEffect(() => {
    // Scroll indicator fade logic
    const handleScrollIndicator = () => {
      if (window.scrollY > 40) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener('scroll', handleScrollIndicator);
    return () => window.removeEventListener('scroll', handleScrollIndicator);
  }, []);

  useEffect(() => {
    document.title = 'Civilify';
  }, []);

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/signin');
    }, 1500);
  };

  const handleSignup = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/signup');
    }, 1500);
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
      const footerTop = document.querySelector('footer')?.offsetTop || 0;
      
      // Determine current section and scroll direction
      let targetPosition;
      
      if (e.deltaY > 0) { // Scrolling down
        if (scrollY < featuresTop - windowHeight/2) {
          targetPosition = featuresTop;
        } else if (scrollY < howItWorksTop - windowHeight/2) {
          targetPosition = howItWorksTop;
        } else if (scrollY < footerTop - windowHeight/2) {
          targetPosition = footerTop;
        }
      } else { // Scrolling up
        if (scrollY > howItWorksTop + windowHeight/2) {
          targetPosition = howItWorksTop;
        } else if (scrollY > featuresTop + windowHeight/2) {
          targetPosition = featuresTop;
        } else if (scrollY > heroTop + windowHeight/2) {
          targetPosition = heroTop;
        }
      }
      
      // Scroll to target position if defined
      if (targetPosition !== undefined) {
        e.preventDefault();
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Function to navigate to docs with a specific section
  const navigateToDocsSection = (sectionId) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('selectedDocSection', sectionId);
      navigate('/civilify-documents');
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

      <div ref={heroRef} style={{...styles.heroSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <div style={styles.heroContainer}>
          <div style={styles.heroLeft}>
            <div style={styles.heroContent}>
              <img src={logoTextOrange} alt="Civilify" style={styles.heroLogo} />
              <h2 style={styles.subheading} className="subheading-shine">AI-Powered Legal Clarity</h2>
              <p style={styles.description}>
                Ask a legal question, assess your legal case, get insights, and know what to do next with <span style={styles.highlight}>Villy</span>, your intelligent legal companion.
              </p>
              <button style={styles.primaryButton} onClick={handleSignup} className="get-started-button">
                Get Started
              </button>
            </div>
          </div>
          <div style={styles.heroRight}>
            <img src={villy3dIllustrationCropped} alt="Villy AI Assistant" style={styles.villyIllustration} />
          </div>
        </div>
        <div style={{
          ...styles.scrollIndicator,
          opacity: showScrollIndicator ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.5s',
        }}>
          <div style={styles.scrollIndicatorBg}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display: 'block'}}>
              <path d="M12 16L6 10H18L12 16Z" fill="#fff"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div id="features" ref={featuresRef} style={{...styles.featuresSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <h2 style={styles.sectionHeading}>Features</h2>
        <div style={styles.featuresGrid}>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={featureIcon1} alt="Natural Language Processing" style={styles.featureImage} />
            <h3 style={{...styles.featureTitle, fontSize: '20px'}}>Natural Language Processing</h3>
            <p style={styles.featureDescription}>
              <span>Communicate with Villy in plain English, just like talking to a legal expert. Our AI understands context and legal terminology to provide clear, accurate guidance for your legal needs.</span>
            </p>
          </div>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={featureIcon2} alt="Legal Analysis" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Legal Analysis</h3>
            <p style={styles.featureDescription}>
              <span>Get comprehensive analysis of your legal situation or detailed answers to your legal questions, with potential outcomes and recommended actions tailored to your needs.</span>
            </p>
          </div>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={featureIcon3} alt="AI Assistance" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>AI Assistance</h3>
            <p style={styles.featureDescription}>
              <span>Receive intelligent suggested next steps and personalized guidance powered by advanced AI technology, whether you're asking general questions or analyzing a specific case.</span>
            </p>
          </div>
        </div>
      </div>

      <div id="how-it-works" ref={howItWorksRef} style={{...styles.howItWorksSection, opacity: 0, transform: 'translateY(20px)', transition: 'all 0.6s ease-out'}}>
        <h2 style={styles.sectionHeading}>How It Works</h2>
        <div style={styles.featuresGrid}>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={number1Icon} alt="Step 1" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Choose Your Mode</h3>
            <p style={styles.featureDescription}>
              <span>Select between General Legal Information for quick answers to legal questions, or Case Analysis for a detailed assessment of your specific legal situation. Pick the mode that fits your needs best.</span>
            </p>
          </div>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={number2Icon} alt="Step 2" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Get AI-Powered Answers</h3>
            <p style={styles.featureDescription}>
              <span>Receive detailed insights and recommendations based on Philippine law and legal precedents, tailored to your chosen mode. Villy provides clear, actionable information every step of the way.</span>
            </p>
          </div>
          <div 
            style={styles.featureCard}
            className="feature-card"
          >
            <img src={number3Icon} alt="Step 3" style={styles.featureImage} />
            <h3 style={styles.featureTitle}>Take Action</h3>
            <p style={styles.featureDescription}>
              <span>Follow the guided next steps, gain clear insights, and understand the best path forward for your situation—whether you need general information or specific case guidance, Villy is here to help.</span>
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
            <a href="/civilify-documents" onClick={(e) => { e.preventDefault(); navigateToDocsSection('what-is'); }} style={styles.footerLink}>What is Civilify</a>
            <a href="/civilify-documents" onClick={(e) => { e.preventDefault(); navigateToDocsSection('why-use'); }} style={styles.footerLink}>Why use Civilify</a>
            <a href="/civilify-documents" onClick={(e) => { e.preventDefault(); navigateToDocsSection('getting-started'); }} style={styles.footerLink}>FAQs</a>
            <a href="/civilify-documents" onClick={(e) => { e.preventDefault(); navigateToDocsSection('security'); }} style={styles.footerLink}>Security and Privacy</a>
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
  scrollIndicator: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40px',
    height: '40px',
    zIndex: 2,
  },
  scrollIndicatorBg: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    boxShadow: '0 4px 10px rgba(243, 77, 1, 0.3)',
    animation: 'pulse 2s infinite',
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
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    border: 'none',
    boxShadow: '0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 15px rgba(243, 77, 1, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.3) inset',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 5px rgba(243, 77, 1, 0.2), 1px 1px 1px rgba(255, 255, 255, 0.3) inset',
    },
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5%',
    minHeight: '100vh',
    borderBottom: '1px solid #eee',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  heroContainer: {
    display: 'flex',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },
  heroLeft: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  heroRight: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
    height: '100%',
  },
  heroContent: {
    maxWidth: '450px',
    textAlign: 'center',
  },
  heroLogo: {
    height: '60px',
    marginBottom: '24px',
  },
  villyIllustration: {
    maxWidth: '100%',
    height: 'auto',
    position: 'absolute',
    bottom: '-400px',
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
    textAlign: 'center',
  },
  description: {
    fontSize: '18px',
    lineHeight: '1.6',
    marginBottom: '32px',
    color: '#666',
    textAlign: 'center',
  },
  highlight: {
    color: '#F34D01',
    fontWeight: '600',
  },
  featuresSection: {
    padding: '80px 5% 60px',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 60px)',
    textAlign: 'center',
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
    gap: '48px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    padding: '32px',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'visible',
    height: '400px',
    justifyContent: 'space-between',
  },
  featureImage: {
    width: '150px',
    height: '150px',
    marginBottom: '24px',
    objectFit: 'contain',
  },
  featureTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    marginBottom: '24px',
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  howItWorksSection: {
    padding: '120px 5% 60px',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 60px)',
    textAlign: 'center',
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
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '0',
    display: 'inline-block',
    position: 'relative',
    border: 'none',
    boxShadow: '0 4px 10px rgba(243, 77, 1, 0.25), 1px 1px 2px rgba(255, 255, 255, 0.3) inset',
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
    transition: all 0.3s ease;
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
`;
document.head.appendChild(animationStyleSheet);

export default Landing;