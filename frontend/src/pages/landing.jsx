import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/images/civilifyorangetext.png';
import heroImage from '../assets/images/heropic.png';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <img src={logoImage} alt="Civilify Logo" style={styles.logo} />
          <span style={styles.logoText}>Civilify</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#how-it-works" style={styles.navLink}>How It Works</a>
          <button style={styles.navButton} onClick={handleLogin}>Sign In</button>
        </div>
      </nav>

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heading}>Civilify</h1>
          <h2 style={styles.subheading}>AI-Powered Legal Assistant</h2>
          <p style={styles.description}>
            Assess your legal case, get insights, and generate documents with Villy, your intelligent legal companion.
          </p>
          <div style={styles.buttonContainer}>
            <button style={styles.primaryButton} onClick={handleSignup}>
              Get Started
            </button>
            <button style={styles.secondaryButton} onClick={handleLogin}>
              Sign In
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <img 
            src={heroImage} 
            alt="Legal Assistant" 
            style={styles.heroImg}
          />
        </div>
      </div>
      
      <div id="features" style={styles.featuresSection}>
        <h2 style={styles.featuresHeading}>How Civilify Works</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <img src={logoImage} alt="Chat" style={styles.iconImg} />
            </div>
            <h3 style={styles.featureTitle}>Chat with Villy</h3>
            <p style={styles.featureDescription}>
              Describe your legal situation to our AI assistant and get personalized guidance.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <img src={logoImage} alt="Assessment" style={styles.iconImg} />
            </div>
            <h3 style={styles.featureTitle}>Case Assessment</h3>
            <p style={styles.featureDescription}>
              Receive an evaluation of your case's viability and potential legal pathways.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <img src={logoImage} alt="Document" style={styles.iconImg} />
            </div>
            <h3 style={styles.featureTitle}>Document Generation</h3>
            <p style={styles.featureDescription}>
              Create and customize legal documents based on your specific situation.
            </p>
          </div>
        </div>
      </div>

      <div id="how-it-works" style={styles.howItWorksSection}>
        <h2 style={styles.sectionHeading}>How It Works</h2>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Sign Up</h3>
            <p style={styles.stepDescription}>
              Create your account to access Villy, your AI legal assistant.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Describe Your Case</h3>
            <p style={styles.stepDescription}>
              Tell Villy about your legal situation in simple, everyday language.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Get Insights</h3>
            <p style={styles.stepDescription}>
              Receive an assessment of your case and potential legal pathways.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <h3 style={styles.stepTitle}>Generate Documents</h3>
            <p style={styles.stepDescription}>
              Create and customize legal documents based on your specific needs.
            </p>
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <div style={styles.logoContainer}>
              <img src={logoImage} alt="Civilify Logo" style={styles.footerLogo} />
              <span style={styles.logoText}>Civilify</span>
            </div>
            <p style={styles.footerDescription}>
              AI-powered legal assistant to help you assess your case and generate documents.
            </p>
          </div>
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Quick Links</h3>
            <a href="#features" style={styles.footerLink}>Features</a>
            <a href="#how-it-works" style={styles.footerLink}>How It Works</a>
            <button style={styles.footerButton} onClick={handleLogin}>Sign In</button>
          </div>
          <div style={styles.footerSection}>
            <h3 style={styles.footerHeading}>Contact</h3>
            <p style={styles.footerText}>Email: support@civilify.com</p>
            <p style={styles.footerText}>Phone: (555) 123-4567</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.copyright}>© {new Date().getFullYear()} Civilify. All rights reserved.</p>
          <div style={styles.legalLinks}>
            <a href="#" style={styles.legalLink}>Privacy Policy</a>
            <a href="#" style={styles.legalLink}>Terms of Service</a>
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
    backgroundColor: '#f8f9fa',
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 5%',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: '40px',
    marginRight: '10px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(90deg, #3a7bd5, #00d2ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  },
  navButton: {
    padding: '8px 16px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#3a7bd5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '80px 5%',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  heroContent: {
    flex: '1',
    maxWidth: '600px',
  },
  heading: {
    fontSize: '64px',
    fontWeight: '700',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #3a7bd5, #00d2ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subheading: {
    fontSize: '32px',
    fontWeight: '500',
    marginBottom: '24px',
    color: '#333',
  },
  description: {
    fontSize: '18px',
    lineHeight: '1.6',
    marginBottom: '32px',
    color: '#666',
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#3a7bd5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 4px 6px rgba(58, 123, 213, 0.2)',
  },
  secondaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#3a7bd5',
    border: '2px solid #3a7bd5',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  heroImage: {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImg: {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  featuresSection: {
    padding: '80px 5%',
    textAlign: 'center',
  },
  featuresHeading: {
    fontSize: '36px',
    fontWeight: '600',
    marginBottom: '48px',
    color: '#333',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImg: {
    width: '100%',
    height: 'auto',
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
  },
  howItWorksSection: {
    padding: '80px 5%',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: '36px',
    fontWeight: '600',
    marginBottom: '48px',
    color: '#333',
  },
  stepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  step: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3a7bd5',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  stepDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
  },
  footer: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '60px 5% 20px',
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    marginBottom: '40px',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  footerLogo: {
    height: '30px',
    marginRight: '10px',
  },
  footerDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#bdc3c7',
  },
  footerHeading: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: 'white',
  },
  footerLink: {
    fontSize: '14px',
    color: '#bdc3c7',
    textDecoration: 'none',
    marginBottom: '8px',
    display: 'block',
  },
  footerButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#3a7bd5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: 'fit-content',
  },
  footerText: {
    fontSize: '14px',
    color: '#bdc3c7',
    marginBottom: '8px',
  },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #34495e',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  copyright: {
    fontSize: '14px',
    color: '#bdc3c7',
  },
  legalLinks: {
    display: 'flex',
    gap: '16px',
  },
  legalLink: {
    fontSize: '14px',
    color: '#bdc3c7',
    textDecoration: 'none',
  },
};

export default Landing;
