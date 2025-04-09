import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/images/civilifyorangetext.png';

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [suggestReplies, setSuggestReplies] = useState(true);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle message submission logic here
    setMessage('');
  };

  const toggleSuggestReplies = () => {
    setSuggestReplies(!suggestReplies);
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };

  const suggestions = [
    "I have a land dispute",
    "Can I break an NDA?",
    "Leave request not approved",
    "In trouble with the police"
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.leftHeader}>
          <button style={styles.newChatButton}>+ New chat</button>
          <div style={styles.suggestRepliesToggle}>
            Suggest Replies
            <label style={styles.toggle}>
              <input 
                type="checkbox" 
                checked={suggestReplies} 
                onChange={toggleSuggestReplies}
                style={styles.toggleInput}
              />
              <div style={suggestReplies ? {...styles.toggleSlider, ...styles.toggleSliderChecked} : styles.toggleSlider}>
                <div style={suggestReplies ? {...styles.toggleKnob, ...styles.toggleKnobChecked} : styles.toggleKnob}></div>
              </div>
            </label>
          </div>
        </div>
        
        <div style={styles.logo}>
          <img src={logoImage} alt="Civilify" style={styles.logoImage} />
        </div>
        
        <div style={styles.rightHeader}>
          <button style={styles.headerButton}>How it works</button>
          <button style={styles.headerButton}>Support</button>
          <button style={styles.shareButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08059 9.11438C7.54431 8.43928 6.7921 8 5.93431 8C4.31233 8 3 9.34315 3 11C3 12.6569 4.31233 14 5.93431 14C6.7921 14 7.54431 13.5607 8.08059 12.8856L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.1422 14 16.39 14.4393 15.8537 15.1144L8.91165 11.3706C8.9267 11.2492 8.93431 11.1255 8.93431 11C8.93431 10.8745 8.9267 10.7508 8.91165 10.6294L15.8537 6.88562C16.39 7.56072 17.1422 8 18 8Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.chatContainer}>
          <div style={styles.welcomeMessage}>
            Start a conversation with <span style={styles.highlightText}>Villy</span>.
          </div>

          {suggestions.length > 0 && (
            <div style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index} 
                  style={styles.suggestionButton}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder="Enter your message..."
              style={styles.input}
            />
            <button type="submit" style={styles.sendButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#111',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#FF5722',
    color: 'white',
    height: '60px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  mainContent: {
    flex: 1,
    marginTop: '60px', // Height of header
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 60px)', // Viewport height minus header height
    overflow: 'hidden',
  },
  leftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  rightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    height: '40px',
  },
  newChatButton: {
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  suggestRepliesToggle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    gap: '8px',
  },
  toggle: {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '20px',
    marginLeft: '8px',
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '34px',
    transition: '0.4s',
    display: 'flex',
    alignItems: 'center',
    padding: '0 3px',
  },
  toggleSliderChecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'flex-end',
  },
  toggleKnob: {
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: '0.4s',
  },
  toggleKnobChecked: {
    backgroundColor: '#FF5722',
  },
  headerButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  shareButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '12px',
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
  },
  welcomeMessage: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '40px',
    textAlign: 'center',
  },
  highlightText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '40px',
    maxWidth: '800px',
    padding: '0 20px',
  },
  suggestionButton: {
    padding: '16px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#FF5722',
    },
  },
  inputContainer: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    padding: '16px 24px',
    border: 'none',
    fontSize: '16px',
    outline: 'none',
  },
  sendButton: {
    width: '48px',
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#666',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#FF5722',
    },
  },
};

export default Chat;
