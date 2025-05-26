import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../assets/images/logoiconorange.png'; // Import the logo image

// Define all styles as JS objects
const styles = {
  // Global styles (will be applied via useEffect)
  globalStyles: `
    #root {
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: left !important;
      display: block !important;
      flex-direction: unset !important;
      justify-content: unset !important;
      align-items: unset !important;
    }
    
    button:focus, input:focus, a:focus, div[role="button"]:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    
    button, input, a, div[role="button"] {
      -webkit-tap-highlight-color: transparent;
    }
    
    button::-moz-focus-inner {
      border: 0;
    }
  `,
  
  // Component styles
  docsPage: {
    maxWidth: 'none',
    margin: 0,
    padding: 0,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    width: '100%',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    color: 'black',
  },
  
  sidebar: {
    position: 'fixed',
    height: '100vh',
    width: '18rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRight: '1px solid #e5e7eb',
    backgroundColor: 'white',
    zIndex: 10,
  },
  
  content: {
    overflowY: 'auto',
    minHeight: '100vh',
    padding: '2rem',
    width: 'calc(100% - 18rem)',
    marginLeft: '18rem',
    paddingLeft: '2rem',
  },
  
  backLink: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: '0.75rem',
    borderTop: '1px solid #f1f1f1',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#F34D01',
  },
  
  navItem: {
    width: '100%',
    textAlign: 'left',
    padding: '0.5rem',
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
    borderRadius: 0,
    fontSize: '1rem',
  },
  
  navItemSelected: {
    color: '#F34D01',
    borderLeft: '2px solid #F34D01',
    paddingLeft: '0.75rem',
    fontWeight: 600,
  },
  
  navItemUnselected: {
    color: '#4B5563',
  },
  
  contentHeader: {
    paddingBottom: '1.5rem',
  },
  
  contentHeaderTitle: {
    fontSize: '2.25rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '1rem',
  },
  
  contentDivider: {
    height: '0.125rem',
    width: '100%',
    backgroundColor: '#e5e7eb',
  },
  
  sectionTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1F2937',
  },
  
  sectionDescription: {
    fontSize: '1.125rem',
    color: '#4B5563',
    marginBottom: '1.5rem',
  },
  
  codeBlock: {
    overflowX: 'auto',
    borderRadius: '0.375rem',
    backgroundColor: '#1e293b',
    padding: '1rem',
    margin: '1rem 0',
    color: 'white',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  
  collapsibleSection: {
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    overflow: 'visible',
  },
  
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb',
  },
  
  collapsibleHeaderOpen: {
    borderBottom: '1px solid #e5e7eb',
  },
  
  collapsibleHeaderClosed: {
    borderBottom: 'none',
  },
  
  collapsibleTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
  },
  
  collapsibleIcon: {
    width: '1.25rem',
    height: '1.25rem',
    transition: 'transform 0.2s ease',
  },
  
  collapsibleIconOpen: {
    transform: 'rotate(180deg)',
  },
  
  collapsibleBody: {
    padding: '1rem',
    backgroundColor: 'white',
  },
  
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#e9ecef',
    color: '#495057',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    margin: '0.25rem',
  },
  
  badgeIcon: {
    marginRight: '0.25rem',
  },
  
  disclaimer: {
    padding: '1rem',
    backgroundColor: '#fff8f5',
    border: '1px solid #feeae1',
    borderRadius: '0.375rem',
    color: '#d47706',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  
  // Add a style for navigation links between sections
  nextSectionLink: {
    display: 'block',
    margin: '0.5rem 0 1.5rem 0',  // More space below to ensure visibility
    padding: '0.5rem 1rem',
    color: '#F34D01',
    textAlign: 'right',
    fontSize: '0.875rem',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    position: 'relative',
    zIndex: '5',
  },
};

// For media queries and other special CSS that can't be easily represented as inline styles
const createGlobalStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 768px) {
      .content {
        margin-left: 0;
        max-width: 100%;
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
    
    .navigation-link {
      margin-top: 2rem !important;
      padding: 0.75rem 1rem !important;
      background-color: #fff8f5 !important;
      border: 1px solid #feeae1 !important;
      border-radius: 0.375rem !important;
      text-align: right !important;
      font-weight: 500 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
      position: relative !important;
      z-index: 50 !important;
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;
      clear: both !important;
    }
    
    .navigation-link:hover {
      background-color: #fff2ea !important;
      cursor: pointer !important;
    }
    
    /* Ensure collapsible sections don't hide anything outside of them */
    .collapsibleSection {
      overflow: visible !important;
    }
    
    /* Ensure section containers properly display all content */
    .section-container {
      position: relative !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }
    
    /* Force navigation links to be visible */
    .section-container > .navigation-link {
      opacity: 1 !important;
      height: auto !important;
    }
  `;
  return style;
};

// CollapsibleSection component
const CollapsibleSection = ({ title, children, icon, isLast }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleSection = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="collapsibleSection" style={{
      ...styles.collapsibleSection,
      marginBottom: isLast ? '0' : '1rem', // No margin if it's the last section
    }}>
      <div 
        style={{
          ...styles.collapsibleHeader,
          ...(isOpen ? styles.collapsibleHeaderOpen : styles.collapsibleHeaderClosed)
        }}
        onClick={toggleSection}
      >
        <h3 style={styles.collapsibleTitle}>
          {title}
        </h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={{
            ...styles.collapsibleIcon,
            ...(isOpen ? styles.collapsibleIconOpen : {})
          }}
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {isOpen && (
        <div className="collapsible-body" style={styles.collapsibleBody}>
          {children}
        </div>
      )}
    </div>
  );
};

// Sample documentation items for the sidebar
const sidebarItems = [  
  { id: 'what-is', title: 'What is Civilify?', content: 'Civilify is an AI-powered legal assistant that helps you with both general legal questions and case-specific analysis. Choose between General Legal Information mode for quick answers, or Case Analysis mode for a detailed assessment of your situation.' },
  { id: 'why-use', title: 'Why Use Civilify?', content: 'Legal advice is expensive and inaccessible to many. Civilify bridges that gap by offering an AI-powered assistant that answers legal questions clearly and affordably, whether you need general information or a case assessment.' },
  { id: 'getting-started', title: 'Getting Started', content: 'Learn how to start using Civilify in just a few simple steps. Choose your mode, ask your question, and get AI-powered legal insights.' },
  { id: 'security', title: 'Security and Privacy', content: 'At Civilify, your data security and privacy come first.' },
  { id: 'troubleshooting', title: 'Troubleshooting & Support', content: 'Having issues? Here are common fixes for problems you might encounter while using Civilify.' },
];

const CivilifyDocuments = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [fromSignup, setFromSignup] = useState(false);
  const navigate = window.reactRouterNavigate || null; // fallback if not in router context

  // Load selected section from localStorage
  useEffect(() => {
    try {
      const savedSection = window.localStorage.getItem('selectedDocSection');
      const fromSignupFlag = window.localStorage.getItem('docFromSignup');
      if (savedSection) {
        setSelectedItem(savedSection);
        window.localStorage.removeItem('selectedDocSection');
      }
      if (fromSignupFlag) {
        setFromSignup(true);
        window.localStorage.removeItem('docFromSignup');
      }
    } catch (e) {
      console.warn('Storage access error:', e);
    }
  }, []);

  // Apply global styles
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    // Add global styles
    const style = document.createElement('style');
    style.textContent = styles.globalStyles;
    document.head.appendChild(style);
    
    // Add media query styles
    const mediaStyles = createGlobalStyles();
    document.head.appendChild(mediaStyles);
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      if (document.head.contains(mediaStyles)) {
        document.head.removeChild(mediaStyles);
      }
    };
  }, []);

  // Navigation link component to ensure consistent visibility
  const NavigationLink = ({ targetId, title }) => {
    return (
      <button 
        className="navigation-link"
        style={{
          display: 'block',
          width: '100%',
          margin: '1rem 0', // Add space above and below
          padding: '0.5rem 1rem',
          backgroundColor: '#FFF8F5',
          color: '#F34D01',
          textAlign: 'right',
          borderRadius: '0.375rem',
          border: '1px solid #FEEAE1',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative', // Use relative positioning
          zIndex: '5',
          outline: 'none',
        }}
        onClick={() => setSelectedItem(targetId)}
      >
        Go to "{title}" →
      </button>
    );
  };

  // Update the section container style
  const sectionContainerStyle = {
    marginTop: '1.5rem',
    paddingBottom: '1rem', // Increased to ensure navigation is visible
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={styles.docsPage} className="docsPage">
      {/* Sidebar */}
      <aside style={styles.sidebar} className="sidebar">
        {/* Navigation */}
        <nav style={{ paddingTop: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, marginLeft: 0 }}>
            {sidebarItems.map((item) => (
              <li key={item.id} style={{ marginBottom: '1rem' }}>
                <button
                  style={{
                    ...styles.navItem,
                    ...(selectedItem === item.id ? styles.navItemSelected : styles.navItemUnselected)
                  }}
                  onClick={() => setSelectedItem(item.id)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom navigation with Back link */}
        <div style={styles.backLink} className="bottom-nav">
          <a 
            href="#" 
            style={{ color: '#F34D01', marginRight: 'auto' }}
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Back
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.content} className="content">
        <div style={styles.contentHeader}>
          <h1 style={styles.contentHeaderTitle}>Documentation</h1>
          <div style={styles.contentDivider}></div>
        </div>

        <div style={{ maxWidth: 'none' }}>
          {selectedItem ? (
            <div>
              <h2 style={styles.sectionTitle}>
                {sidebarItems.find(item => item.id === selectedItem)?.title}
              </h2>
              <p style={styles.sectionDescription}>
                {sidebarItems.find(item => item.id === selectedItem)?.content}
              </p>
              
              {/* Add the Getting Started section */}
              {selectedItem === 'getting-started' && (
                <div className="section-container" style={sectionContainerStyle}>
                  <CollapsibleSection title="How to Begin">
                    <ol style={{ paddingLeft: '2rem', marginBottom: '1.5rem', listStyleType: 'decimal' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Visit <a href="#" style={{ color: '#3b82f6', fontWeight: '500' }}>www.civilify.com</a>
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Sign up for an account or sign in if you already have one. Continue with Google is an option.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Enter the chat and choose your mode: <strong>General Legal Information</strong> for quick legal answers, or <strong>Case Analysis</strong> for a detailed assessment of your situation.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Ask your question or describe your case. Villy will guide you and provide insights based on your chosen mode.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Review the AI-generated response, which may include a case plausibility score and suggested next steps if you chose Case Analysis.
                      </li>
                    </ol>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Tips for Best Results" isLast={true}>
                    <ul style={{ paddingLeft: '2rem', marginBottom: '1.5rem', listStyleType: 'disc' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.75rem' }}>
                        Use clear, concise language
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.75rem' }}>
                        Be honest and complete in your description
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.75rem' }}>
                        Try rephrasing if the answer seems unclear
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.75rem' }}>
                        For case analysis, provide as much relevant detail as possible
                      </li>
                    </ul>
                  </CollapsibleSection>
                  
                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <NavigationLink targetId="security" title="Security and Privacy" />
                  </div>
                </div>
              )}
              
              {/* Update the sections to add navigation links */}
              {selectedItem === 'what-is' && (
                <div className="section-container" style={sectionContainerStyle}>
                  <CollapsibleSection title="Introduction">
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      Civilify is an AI-powered legal assistant designed to give users a better understanding of their legal standing. By interacting with "Villy," you can ask general legal questions or describe your specific situation for a detailed case analysis.
                    </p>
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      Civilify is <strong>not</strong> a substitute for legal professionals—it serves as a guide for early-stage legal questions and understanding.
                    </p>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Mission">
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      To empower individuals by making legal knowledge more accessible, digestible, and actionable—particularly for those who may be underserved by traditional legal systems.
                    </p>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Key Features">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: '1 1 300px', minWidth: '0', backgroundColor: '#f0f8ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e1effe' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>General Legal Information Mode</h4>
                        <p style={{ color: '#374151' }}>Ask questions about laws, rights, and legal procedures. Get quick, clear answers from Villy.</p>
                      </div>
                      <div style={{ flex: '1 1 300px', minWidth: '0', backgroundColor: '#f0fff4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e1fcef' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#047857', marginBottom: '0.5rem' }}>Case Analysis Mode</h4>
                        <p style={{ color: '#374151' }}>Describe your situation for a detailed analysis, plausibility score, and suggested next steps.</p>
                      </div>
                      <div style={{ flex: '1 1 300px', minWidth: '0', backgroundColor: '#fff0f0', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fee1e1' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#b91c1c', marginBottom: '0.5rem' }}>AI-Powered Legal Analysis</h4>
                        <p style={{ color: '#374151' }}>Understand your legal situation using natural language and advanced AI.</p>
                      </div>
                      <div style={{ flex: '1 1 300px', minWidth: '0', backgroundColor: '#f8f0ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5d1fe' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#7c3aed', marginBottom: '0.5rem' }}>Flexible Chat Modes</h4>
                        <p style={{ color: '#374151' }}>Switch between quick legal Q&A and in-depth case analysis as needed.</p>
                      </div>
                      <div style={{ flex: '1 1 300px', minWidth: '0', backgroundColor: '#fff7e6', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #feecc8' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#c2410c', marginBottom: '0.5rem' }}>Privacy-First Design</h4>
                        <p style={{ color: '#374151' }}>Your data stays with you. No conversations are stored.</p>
                      </div>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Legal Disclaimer" isLast={true}>
                    <div style={styles.disclaimer}>
                      Civilify is not a law firm and does not offer legal representation or advice. The platform provides AI-generated legal insights based on publicly available legal standards and should not be relied on as legal counsel. Always consult with a licensed attorney for legally binding advice or action.
                    </div>
                  </CollapsibleSection>
                  
                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <NavigationLink targetId="why-use" title="Why Use Civilify?" />
                  </div>
                </div>
              )}
              
              {/* Example content for "Why use Civilify?" section */}
              {selectedItem === 'why-use' && (
                <div className="section-container" style={sectionContainerStyle}>
                  <CollapsibleSection title="Why Civilify Exists">
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      Legal advice is expensive and inaccessible to many Filipinos. Civilify bridges that gap by offering an AI-powered assistant that answers legal questions clearly and affordably.
                    </p>
                    
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      It's backed by research showing:
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        85% of Filipinos cannot afford legal services, with only 1 lawyer for every 1,000 people (Philippine Statistics Authority, 2023).
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        AI tools like Civilify reduce reliance on expensive consultations for preliminary assessments, making legal knowledge more accessible.
                      </li>
                    </ul>
                    
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      With AI systems like GPT, Civilify is making Philippine legal knowledge approachable and helping users feel more confident about their rights.
                    </p>
                    
                    <div style={{ marginTop: '1.5rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>References:</h4>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#4B5563' }}>
                        <li style={{ marginBottom: '0.25rem' }}>
                          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>PSA: Legal Services Accessibility in the Philippines (2023)</a>
                        </li>
                        <li style={{ marginBottom: '0.25rem' }}>
                          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>Supreme Court of the Philippines: Legal Aid Report (2023)</a>
                        </li>
                        <li style={{ marginBottom: '0.25rem' }}>
                          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>Philippine Bar Association: Legal Services Survey (2023)</a>
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Who is Civilify For?" isLast={true}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Civilify is designed for:
                      </p>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          People curious about whether they have a legal issue
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Entrepreneurs dealing with contracts or disputes
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Individuals exploring rights in tenancy, employment, consumer protection, etc.
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Students and researchers looking to understand law in simple terms
                        </li>
                      </ul>
                    </div>
                    
                    <div style={{ backgroundColor: '#fff5f5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fee2e2' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#b91c1c', marginBottom: '0.5rem' }}>Not for:</h4>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '1rem', color: '#4B5563' }}>
                        <li style={{ marginBottom: '0.25rem' }}>
                          Those seeking legally binding advice
                        </li>
                        <li style={{ marginBottom: '0.25rem' }}>
                          Users involved in sensitive or criminal cases
                        </li>
                        <li style={{ marginBottom: '0.25rem' }}>
                          Anyone looking to replace qualified legal professionals
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>
                  
                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <NavigationLink targetId="getting-started" title="Getting Started" />
                  </div>
                </div>
              )}
              
              {/* Example content for "Security and Privacy" section */}
              {selectedItem === 'security' && (
                <div className="section-container" style={sectionContainerStyle}>
                  <CollapsibleSection title="Authentication">
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        We use <strong>OAuth</strong> to authenticate users via Google or other trusted platforms.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        Multi-factor authentication (MFA) is enforced for sensitive access.
                      </li>
                    </ul>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Data Handling">
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        Uses <strong>Firebase</strong> for secure backend operations.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        <strong>No conversation data is stored</strong> unless you're a registered user who has opted in.
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        No information is shared with third parties.
                      </li>
                    </ul>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Encryption">
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        Data in transit is secured with <strong>TLS 1.2+</strong>
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        Any stored information is encrypted with <strong>AES-256</strong>
                      </li>
                    </ul>
                  </CollapsibleSection>

                  <CollapsibleSection title="Terms of Service">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>1. Acceptance of Terms</h4>
                      <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        By accessing and using Civilify, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                      </p>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>2. Service Description</h4>
                      <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Civilify provides AI-powered legal information and case analysis. Our service is not a substitute for professional legal advice and should not be relied upon as such.
                      </p>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>3. User Responsibilities</h4>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Provide accurate and truthful information
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Maintain the confidentiality of your account
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Use the service in compliance with applicable laws
                        </li>
                      </ul>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>4. Limitations of Service</h4>
                      <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        Civilify is not a law firm and does not provide legal representation. Our AI-generated responses are for informational purposes only and should not be considered legal advice.
                      </p>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Privacy Policy">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>1. Information We Collect</h4>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Account information (email, name)
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Usage data (interactions with the service)
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Conversation data (only if explicitly opted in)
                        </li>
                      </ul>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>2. How We Use Your Information</h4>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          To provide and improve our services
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          To communicate with you about your account
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          To ensure platform security
                        </li>
                      </ul>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>3. Data Protection</h4>
                      <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                        We implement industry-standard security measures to protect your data. This includes encryption, secure servers, and regular security audits.
                      </p>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>4. Your Rights</h4>
                      <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Access your personal data
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Request data deletion
                        </li>
                        <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                          Opt-out of data collection
                        </li>
                      </ul>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Compliance" isLast={true}>
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem' }}>
                      Civilify is designed to comply with:
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        <strong>GDPR</strong>
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        <strong>ISO 27001</strong>
                      </li>
                      <li style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                        <strong>HIPAA</strong> (where applicable)
                      </li>
                    </ul>
                    
                    <p style={{ fontSize: '1.125rem', color: '#4B5563', marginBottom: '1rem', fontWeight: '600' }}>
                      We <strong>never store</strong> anything beyond what you explicitly allow. That means <strong>no hidden tracking, no data mining, no surprises.</strong>
                    </p>
                  </CollapsibleSection>
                  
                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <NavigationLink targetId="troubleshooting" title="Troubleshooting & Support" />
                  </div>
                </div>
              )}
              
              {/* Example content for "Troubleshooting & Support" section */}
              {selectedItem === 'troubleshooting' && (
                <div className="section-container" style={sectionContainerStyle}>
                  <CollapsibleSection title="Frequently Asked Questions">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Q: The chatbot isn't responding.</h4>
                        <p style={{ fontSize: '1rem', color: '#4B5563', paddingLeft: '1rem', borderLeft: '3px solid #d1d5db' }}>
                          Check your internet connection. Civilify requires online access for AI processing.
                        </p>
                      </div>
                      
                      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Q: The response was unclear.</h4>
                        <p style={{ fontSize: '1rem', color: '#4B5563', paddingLeft: '1rem', borderLeft: '3px solid #d1d5db' }}>
                          Try rephrasing your question or choosing a simpler version.
                        </p>
                      </div>
                      
                      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Q: I forgot my password.</h4>
                        <p style={{ fontSize: '1rem', color: '#4B5563', paddingLeft: '1rem', borderLeft: '3px solid #d1d5db' }}>
                          Use the "Forgot Password" option on the sign-in page.
                        </p>
                      </div>
                      
                      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Q: I want to report a bug.</h4>
                        <p style={{ fontSize: '1rem', color: '#4B5563', paddingLeft: '1rem', borderLeft: '3px solid #d1d5db' }}>
                          Email us at: <a href="mailto:support@civilify.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>support@civilify.com</a>
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>
                  
                  <CollapsibleSection title="Contact Support" isLast={true}>
                    <div style={{ backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0369a1', marginBottom: '1rem' }}>Need additional help?</h4>
                      <p style={{ fontSize: '1rem', color: '#4B5563', marginBottom: '1.5rem', textAlign: 'center' }}>
                        Our support team is available Monday through Friday, 9am-5pm EST.
                      </p>
                      <a 
                        href="mailto:support@civilify.com" 
                        style={{ 
                          backgroundColor: '#0ea5e9', 
                          color: 'white', 
                          padding: '0.75rem 1.5rem', 
                          borderRadius: '0.375rem',
                          textDecoration: 'none',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Contact Support
                      </a>
                    </div>
                  </CollapsibleSection>
                  
                  {/* Navigation section outside of collapsible sections */}
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <NavigationLink targetId="what-is" title="What is Civilify?" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#6B7280' }}>
                Select a topic from the sidebar to view documentation.
              </h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CivilifyDocuments;
