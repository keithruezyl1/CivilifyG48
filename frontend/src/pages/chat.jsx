import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIconOrange from '../assets/images/logoiconorange.png';

const Chat = () => {
  const navigate = useNavigate();
  const [suggestedRepliesEnabled, setSuggestedRepliesEnabled] = useState(true);
  const [question, setQuestion] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const suggestedQuestions = [
    "I have a land dispute",
    "Can I break an NDA?",
    "Workplace harassment",
    "In trouble with the police"
  ];

  const handleToggleSuggestions = () => {
    setSuggestedRepliesEnabled(!suggestedRepliesEnabled);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle chat submission
  };

  const handleHowItWorks = () => {
    setShowHowItWorks(true);
  };

  const handleNewChat = () => {
    setShowNewChatConfirm(true);
  };

  const handleNewChatConfirm = (confirm) => {
    if (confirm) {
      // Clear current conversation
      setQuestion('');
    }
    setShowNewChatConfirm(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      navigate('/signin');
    }
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
        </div>
        
        <div style={styles.centerSection}>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.suggestedRepliesToggle}>
            <div style={styles.toggleLabelContainer}>
              <span style={styles.toggleLabel}>Suggested Replies</span>
              <div 
                style={styles.infoIcon} 
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#666"/>
                </svg>
                {showTooltip && (
                  <div style={styles.tooltip}>
                    Enable or disable AI-suggested responses based on common legal queries. These suggestions help you get started with your conversation.
                  </div>
                )}
              </div>
            </div>
            <div 
              style={{
                ...styles.toggleSwitch,
                backgroundColor: suggestedRepliesEnabled ? '#F34D01' : '#ccc'
              }}
              onClick={handleToggleSuggestions}
            >
              <div style={{
                ...styles.toggleHandle,
                transform: suggestedRepliesEnabled ? 'translateX(20px)' : 'translateX(0)'
              }} />
            </div>
          </div>
          <button style={styles.headerButton} onClick={handleHowItWorks}>How it works</button>
          <button style={styles.headerButton}>Support</button>
          <button style={styles.newChatButton} onClick={handleNewChat}>+ New chat</button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main style={styles.mainContent}>
        <div style={styles.chatContainer}>
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle}>
              Start your conversation with <span style={styles.villyText}>Villy</span>.
            </h1>
          </div>

          {suggestedRepliesEnabled && (
            <div style={styles.suggestedReplies}>
              <div style={styles.suggestedButtonsContainer}>
                {suggestedQuestions.map((question, index) => (
                  <button 
                    key={index}
                    style={styles.suggestedButton}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={styles.inputSection}>
            <form onSubmit={handleSubmit} style={styles.inputForm}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question"
                style={styles.input}
              />
              <button 
                type="submit" 
                style={styles.sendButton}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  button.style.backgroundColor = '#F34D01';
                  button.style.borderColor = '#F34D01';
                  const path = button.querySelector('path');
                  path.setAttribute('stroke', '#ffffff');
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.style.backgroundColor = 'transparent';
                  button.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  const path = e.currentTarget.querySelector('path');
                  path.setAttribute('stroke', '#666666');
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
                  <path d="M12 20V4M5 11l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
            <p style={styles.disclaimer}>
              Villy offers AI-powered legal insights to help you explore your situation. While it's here to assist, it's not a substitute for professional legal advice.
            </p>
          </div>
        </div>
      </main>

      {/* Popup Overlays */}
      {(showHowItWorks || showNewChatConfirm || showLogoutConfirm) && (
        <div style={styles.overlay}>
          {showHowItWorks && (
            <div style={styles.popup}>
              <h2 style={styles.popupTitle}>How Civilify Works</h2>
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
              <button style={styles.closeButton} onClick={() => setShowHowItWorks(false)}>Close</button>
            </div>
          )}

          {showNewChatConfirm && (
            <div style={styles.popup}>
              <h2 style={styles.popupTitle}>You are starting a new conversation</h2>
              <p style={styles.popupSubtitle}>That means all information in the current conversation will be deleted. Continue?</p>
              <div style={styles.confirmButtons}>
                <button style={styles.confirmButton} onClick={() => handleNewChatConfirm(true)}>Yes</button>
                <button style={styles.cancelButton} onClick={() => handleNewChatConfirm(false)}>No</button>
              </div>
            </div>
          )}

          {showLogoutConfirm && (
            <div style={styles.popup}>
              <h2 style={styles.popupTitle}>Logout</h2>
              <p style={styles.popupSubtitle}>Are you sure you want to logout?</p>
              <div style={styles.confirmButtons}>
                <button style={styles.confirmButton} onClick={() => handleLogoutConfirm(true)}>Yes, Logout</button>
                <button style={styles.cancelButton} onClick={() => handleLogoutConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <span>© The Civilify Company, Cebu City 2025</span>
          <button style={styles.footerLink}>What is Civilify?</button>
          <button style={styles.footerLink}>Why use Civilify?</button>
          <button style={styles.footerLink}>FAQs</button>
          <button style={styles.footerLink}>Security and Privacy</button>
        </div>
        <div style={styles.footerRight}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <span>Logout</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },

  header: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: '32px',
  },
  centerSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  headerButton: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  newChatButton: {
    background: '#1a1a1a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  suggestedRepliesToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toggleLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toggleLabel: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '500',
  },
  infoIcon: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '12px',
    width: '240px',
    textAlign: 'left',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-6px',
      left: '50%',
      transform: 'translateX(-50%)',
      border: '6px solid transparent',
      borderBottomColor: '#333',
    },
  },
  toggleSwitch: {
    width: '40px',
    height: '20px',
    backgroundColor: '#ccc',
    borderRadius: '10px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  toggleHandle: {
    width: '16px',
    height: '16px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.2s',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    padding: '12px 32px',
    overflow: 'hidden',
    height: 'calc(100vh - 96px)',
  },
  chatContainer: {
    position: 'relative',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    margin: '0 auto',
    maxWidth: '1600px',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
  },
  welcomeSection: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: '48px',
    fontWeight: '500',
    color: '#1a1a1a',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  villyText: {
    color: '#F34D01',
  },
  suggestedReplies: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  suggestedButtonsContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  suggestedButton: {
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '24px',
    padding: '12px 24px',
    fontSize: '14px',
    color: '#1a1a1a',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inputSection: {
    position: 'absolute',
    bottom: '24px',
    height: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputForm: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '0 16px',
    fontSize: '14px',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#ffffff',
    height: '32px',
    lineHeight: '32px',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '6px',
    background: 'none',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#F34D01',
      border: '1px solid #F34D01',
    },
  },
  disclaimer: {
    fontSize: '11px',
    color: '#666666',
    textAlign: 'center',
    marginTop: '12px',
    fontStyle: 'italic',
    width: '100%',
  },
  footer: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    color: '#666666',
    fontSize: '14px',
    marginLeft: '-8px',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '-8px',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    cursor: 'pointer',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
  },
  popupTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '16px',
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    marginBottom: '32px',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  stepDescription: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#666666',
    margin: 0,
  },
  closeButton: {
    background: '#F34D01',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
  },
  confirmButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  confirmButton: {
    background: '#F34D01',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelButton: {
    background: '#ffffff',
    color: '#1a1a1a',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default Chat;
