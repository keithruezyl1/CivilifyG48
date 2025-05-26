import React from 'react';
import logoIconOrange from '../assets/images/logoiconorange.png';

const LoadingScreen = ({ isDarkMode = false }) => {
  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDarkMode ? '#232323' : '#ffffff'
    }}>
      <div style={styles.content}>
        <img src={logoIconOrange} alt="Civilify Logo" style={styles.logo} />
        <div style={{
          ...styles.loader,
          border: `4px solid ${isDarkMode ? '#363636' : '#f3f4f6'}`,
          borderTop: '4px solid #F34D01'
        }}></div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    width: '64px',
    height: '64px',
  },
  loader: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS for the spin animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default LoadingScreen; 