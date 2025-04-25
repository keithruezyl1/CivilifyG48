import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import axios from "axios";
import { FaSun, FaMoon, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt, FaKeyboard, FaRobot, FaCheckCircle } from "react-icons/fa";

// Function to format AI response text
const formatAIResponse = (text) => {
  // Replace Markdown-like symbols with HTML tags
  let formattedText = text
    // Replace ***text*** with <strong><em>text</em></strong>
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Replace **text** with <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Replace *text* with <em>text</em>
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return formattedText;
};

// Function to fetch response from Gemini API
const fetchGeminiResponse = async (userMessage) => {
  const API_KEY = "AIzaSyDIYQK3WWrxfW1mDgWErLdb7lggBqog6xE";
  const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // Define system prompt
  const systemPrompt = `
You are an AI trained in Philippine law, based on information from the Official Gazette, Supreme Court rulings, and lawphil.net. 
Always include legal basis (if known) and keep your answer simple and understandable to regular Filipinos. 
If necessary, explain the steps the person should take in the situation. 
Answer the question clearly and concisely. 

For greetings like "hello", "hi", "kumusta", etc., just respond:
"Hello! I am your AI legal assistant, trained in Philippine law. How can I help you today?"

End every legal response with:
"This is not legal advice. Please consult a licensed attorney."
`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\nUser: ${userMessage}`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Gemini API Response:", response.data);

    const generatedText =
      response.data.candidates[0]?.content?.parts[0]?.text ||
      "No response generated.";

    console.log("Generated Text:", generatedText);

    return {
      success: true,
      response: generatedText,
    };
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return {
      success: false,
      response: "Sorry, I couldn't process your request. Please try again.",
    };
  }
};

const Chat = () => {
  const navigate = useNavigate();
  const [suggestedRepliesEnabled, setSuggestedRepliesEnabled] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const chatContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const suggestedQuestions = [
    "I have a land dispute",
    "Can I break an NDA?",
    "Workplace harassment",
    "In trouble with the police",
  ];

  const handleToggleSuggestions = () => {
    setSuggestedRepliesEnabled(!suggestedRepliesEnabled);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim()) {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const userMessage = { text: question, isUser: true, timestamp };
      setMessages([...messages, userMessage]);
      setQuestion("");
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }

      const aiResponse = await fetchGeminiResponse(question);
      const aiMessage = {
        text: aiResponse.response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, aiMessage];
        console.log("Updated Messages:", newMessages);
        return newMessages;
      });

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  const handleSuggestedReply = async (reply) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMessage = { text: reply, isUser: true, timestamp };
    setMessages([...messages, userMessage]);

    const aiResponse = await fetchGeminiResponse(reply);
    const aiMessage = {
      text: aiResponse.response,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, aiMessage];
      console.log("Updated Messages:", newMessages);
      return newMessages;
    });

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleMessageClick = (index) => {
    setShowTimestamp(showTimestamp === index ? null : index);
  };

  const handleHowItWorks = () => {
    setShowHowItWorks(true);
  };

  const handleNewChat = () => {
    setShowNewChatConfirm(true);
  };

  const handleNewChatConfirm = (confirm) => {
    if (confirm) {
      setMessages([]);
      setQuestion("");
      setShowTimestamp(null);
    }
    setShowNewChatConfirm(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      navigate("/signin");
    }
    setShowLogoutConfirm(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    // Add global style to remove focus outline
    const style = document.createElement('style');
    style.textContent = `
      button:focus,
      a:focus,
      div[role="button"]:focus,
      input:focus {
        outline: none !important;
        box-shadow: none !important; /* Optional: Remove default focus shadow */
      }
      button,
      a,
      div[role="button"] {
        -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
      }
      button::-moz-focus-inner {
        border: 0; /* Remove Firefox dotted border */
      }
    `;
    document.head.appendChild(style);

    // Add CSS Class Styles for Hover/Active states
    const hoverStyle = document.createElement('style');
    hoverStyle.textContent = `
        .text-button-hover:hover {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }
        .text-button-hover:active {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
          transform: scale(0.98);
        }
    
        .icon-button-hover:hover {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        }
        .icon-button-hover:active {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
          transform: scale(0.95);
        }
    
        .primary-button-hover:hover {
            background-color: #e04000; /* Darker orange */
            transform: translateY(-1px);
        }
        .primary-button-hover:active {
            background-color: #c73800; /* Even darker orange */
            transform: translateY(0px);
        }
        
        .secondary-button-hover:hover {
            background-color: #f2f2f2; /* Light grey */
            border-color: #bbb;
        }
        .secondary-button-hover:active {
            background-color: #e6e6e6; /* Darker grey */
            border-color: #aaa;
            transform: scale(0.98);
        }
        
        .suggested-button-hover:hover {
            background-color: #f2f2f2;
            border-color: #bbb;
        }
        .suggested-button-hover:active {
            background-color: #e6e6e6;
            border-color: #aaa;
            transform: scale(0.98);
        }
        
        .send-button-hover {
            background-color: ${isDarkMode ? '#363636' : '#ffffff'};
            color: ${isDarkMode ? '#666666' : '#666666'};
            border: 1px solid ${isDarkMode ? '#555' : '#ccc'};
        }
        .send-button-hover:hover {
            background-color: ${isDarkMode ? '#ffffff' : '#F34D01'};
            color: ${isDarkMode ? '#ffffff' : '#ffffff'};
            border-color: ${isDarkMode ? '#ffffff' : '#F34D01'};
        }
        .send-button-hover:active {
            background-color: ${isDarkMode ? '#f0f0f0' : '#e04000'};
            transform: scale(0.95);
        }
        
        .toggle-switch-hover:hover > div { /* Target the handle */
           box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        }
        .toggle-switch-hover:active {
           transform: scale(0.97);
        }
    
        .avatar-button-hover:hover > div { /* Target the circle */
           background-color: #e04000;
        }
        .avatar-button-hover:active {
           transform: scale(0.95);
        }
    
        .dropdown-item-hover:hover {
           background-color: ${isDarkMode ? '#404040' : '#f0f0f0'};
        }
         /* No active state needed for dropdown items usually */
    
      `;
    document.head.appendChild(hoverStyle);

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.head.removeChild(style); // Clean up injected style
      document.head.removeChild(hoverStyle); // Clean up hover styles
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDarkMode]); // Add isDarkMode dependency for hover styles

  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDarkMode ? '#2d2d2d' : '#F7F7F9',
      color: isDarkMode ? '#ffffff' : '#1a1a1a'
    }}>
      {/* Header */}
      <header style={{
        ...styles.header,
        backgroundColor: isDarkMode ? '#2d2d2d' : '#F7F7F9'
      }}>
        <div style={styles.logoSection}>
          <img src={logoIconOrange} alt="Civilify" style={styles.logo} />
        </div>

        <div style={styles.centerSection}></div>

        <div style={styles.rightSection}>
          <button
            style={{
              ...styles.headerButton,
              color: isDarkMode ? '#ffffff' : '#1a1a1a'
            }}
            onClick={toggleDarkMode}
            className="icon-button-hover"
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
          <div style={styles.suggestedRepliesToggle}>
            <div style={styles.toggleLabelContainer}>
              <span style={{
                ...styles.toggleLabel,
                color: isDarkMode ? '#ffffff' : '#1a1a1a'
              }}>Suggested Replies</span>
              <div
                style={styles.infoIcon}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isDarkMode ? '#ffffff' : '#666'}>
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                  />
                </svg>
                {showTooltip && (
                  <div style={styles.tooltip}>
                    Enable or disable AI-suggested responses based on common
                    legal queries. These suggestions help you get started with
                    your conversation.
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                ...styles.toggleSwitch,
                backgroundColor: suggestedRepliesEnabled ? "#F34D01" : "#ccc",
              }}
              onClick={handleToggleSuggestions}
              className="toggle-switch-hover"
            >
              <div
                style={{
                  ...styles.toggleHandle,
                  transform: suggestedRepliesEnabled
                    ? "translateX(20px)"
                    : "translateX(0)",
                }}
              />
            </div>
          </div>
          <button style={{
            ...styles.headerButton,
            color: isDarkMode ? '#ffffff' : '#1a1a1a'
          }} onClick={handleHowItWorks} className="text-button-hover">
            How it works
          </button>
          <button style={{
            ...styles.newChatButton,
            background: isDarkMode ? "#ffffff" : "#1a1a1a",
            color: isDarkMode ? "#1a1a1a" : "#ffffff"
          }} onClick={handleNewChat} className="primary-button-hover">
            + New chat
          </button>
          <div style={styles.avatarContainer} ref={dropdownRef}>
            <button
              style={styles.avatarButton}
              onClick={() => setShowDropdown(!showDropdown)}
              className="avatar-button-hover"
            >
              <div style={styles.avatarCircle}>
                <FaUser size={16} />
              </div>
            </button>
            {showDropdown && (
              <div style={{
                ...styles.dropdownMenu,
                backgroundColor: isDarkMode ? '#363636' : '#f8f8f8',
              }}>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#ffffff' : '#1a1a1a'
                  }}
                  className="dropdown-item-hover"
                >
                  <FaUser style={styles.dropdownIcon} />
                  My Profile
                </button>
                 <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#ffffff' : '#1a1a1a'
                  }}
                  className="dropdown-item-hover"
                >
                  <FaCog style={styles.dropdownIcon} />
                  Settings
                </button>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#ffffff' : '#1a1a1a'
                  }}
                  className="dropdown-item-hover"
                >
                  <FaQuestionCircle style={styles.dropdownIcon} />
                  Support
                </button>
                <div style={{...styles.dropdownSeparatorBase, backgroundColor: isDarkMode ? '#404040' : 'rgba(0, 0, 0, 0.12)'}}></div>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#ffffff' : '#1a1a1a'
                  }}
                  onClick={handleLogout}
                  className="dropdown-item-hover"
                >
                  <FaSignOutAlt style={styles.dropdownIcon} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main style={styles.mainContent}>
        <div style={{
          ...styles.chatContainer,
          backgroundColor: isDarkMode ? '#2d2d2d' : '#F6F6F8',
          border: isDarkMode ? '1px solid #404040' : '1px solid #e0e0e0'
        }}>
          <div style={styles.chatMessages} ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div style={styles.welcomeSection}>
                <h1 style={{
                  ...styles.welcomeTitle,
                  color: isDarkMode ? '#ffffff' : '#1a1a1a'
                }}>
                  Start your conversation with{" "}
                  <span style={styles.villyText}>Villy</span>.
                </h1>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageWrapper,
                    alignItems: message.isUser ? "flex-end" : "flex-start",
                    alignSelf: message.isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    ...styles.messageAvatar,
                    ...(message.isUser 
                      ? styles.userAvatar 
                      : {
                          ...styles.aiAvatar,
                          backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                          border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                        })
                  }} />
                  <div
                    style={{
                      ...styles.message,
                      ...(message.isUser
                        ? styles.userMessage
                        : {
                            ...styles.aiMessage,
                            backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                            color: isDarkMode ? "#ffffff" : "#1a1a1a",
                            border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                            boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(0, 0, 0, 0.05)",
                          }),
                      cursor: "pointer",
                    }}
                    onClick={() => handleMessageClick(index)}
                    dangerouslySetInnerHTML={{
                      __html: message.isUser
                        ? message.text
                        : formatAIResponse(message.text),
                    }}
                  />
                  {showTimestamp === index && message.timestamp && (
                    <div
                      style={{
                        ...styles.timestamp,
                        ...(message.isUser
                          ? styles.userTimestamp
                          : styles.aiTimestamp),
                      }}
                    >
                      {message.timestamp}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{
            ...styles.inputWrapper,
            backgroundColor: isDarkMode ? '#2d2d2d' : '#F6F6F8'
          }}>
            {suggestedRepliesEnabled && (
              <div style={styles.suggestedReplies}>
                <div style={styles.suggestedButtonsContainer}>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      style={styles.suggestedButton}
                      onClick={() => handleSuggestedReply(question)}
                      className="suggested-button-hover"
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
                  style={{
                    ...styles.input,
                    backgroundColor: isDarkMode ? '#363636' : '#ffffff', 
                    borderColor: isDarkMode ? '#555' : '#ccc', 
                    color: isDarkMode ? '#ffffff' : '#1a1a1a',
                  }}
                />
                <button
                  type="submit"
                  style={styles.sendButton}
                  className="send-button-hover"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 20V4M5 11l7-7 7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
              <p style={styles.disclaimer}>
                Villy offers AI-powered legal insights to help you explore your
                situation. While it's here to assist, it's not a substitute for
                professional legal advice.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Popup Overlays */}
      {(showHowItWorks || showNewChatConfirm || showLogoutConfirm) && (
        <div style={styles.overlay}>
          {showHowItWorks && (
            <div style={styles.popup}>
              
              <div style={styles.stepsContainerImproved}>
                <div style={styles.stepImproved}>
                  <FaKeyboard style={styles.stepIconImproved} />
                  <div>
                    <h3 style={styles.stepTitleImproved}>1. Describe Your Case</h3>
                    <p style={styles.stepDescriptionImproved}>
                      Tell us about your legal situation in simple terms or ask specific questions.
                    </p>
                  </div>
                </div>
                <div style={styles.stepImproved}>
                  <FaRobot style={styles.stepIconImproved} />
                  <div>
                    <h3 style={styles.stepTitleImproved}>2. Get AI Analysis</h3>
                    <p style={styles.stepDescriptionImproved}>
                      Villy provides insights, potential outcomes, and legal context based on Philippine law.
                    </p>
                  </div>
                </div>
                <div style={styles.stepImproved}>
                  <FaCheckCircle style={styles.stepIconImproved} />
                  <div>
                    <h3 style={styles.stepTitleImproved}>3. Take Action</h3>
                    <p style={styles.stepDescriptionImproved}>
                      Receive suggested next steps and understand the potential path forward.
                    </p>
                  </div>
                </div>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => setShowHowItWorks(false)}
                className="primary-button-hover"
              >
                Close
              </button>
            </div>
          )}

          {showNewChatConfirm && (
            <div style={styles.popup}>
              <h2 style={styles.popupTitle}>
                You are starting a new conversation
              </h2>
              <p style={styles.popupSubtitle}>
                That means all information in the current conversation will be
                deleted. Continue?
              </p>
              <div style={styles.confirmButtons}>
                <button
                  style={styles.confirmButton}
                  onClick={() => handleNewChatConfirm(true)}
                  className="primary-button-hover"
                >
                  Yes
                </button>
                <button
                  style={styles.cancelButton}
                  onClick={() => handleNewChatConfirm(false)}
                  className="secondary-button-hover"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {showLogoutConfirm && (
            <div style={{...styles.popup, maxWidth: "400px"}}>
              <h2 style={styles.popupTitle}>Logout</h2>
              <p style={styles.popupSubtitle}>
                Are you sure you want to logout?
              </p>
              <div style={styles.confirmButtons}>
                <button
                  style={styles.confirmButton}
                  onClick={() => handleLogoutConfirm(true)}
                  className="primary-button-hover"
                >
                  Yes, Logout
                </button>
                <button
                  style={styles.cancelButton}
                  onClick={() => handleLogoutConfirm(false)}
                  className="secondary-button-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        ...styles.footer,
        backgroundColor: isDarkMode ? '#2d2d2d' : '#F7F7F9'
      }}>
        <div style={{
          ...styles.footerLeft,
          color: isDarkMode ? '#ffffff' : '#666666'
        }}>
          <span>© The Civilify Company, Cebu City 2025</span>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    padding: "0 32px",
    flexShrink: 0,
    borderBottom: 'none',
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "32px",
  },
  centerSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  headerButton: {
    background: "none",
    border: "none",
    color: "#1a1a1a",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
  },
  newChatButton: {
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  suggestedRepliesToggle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  toggleLabelContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toggleLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  infoIcon: {
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginTop: "8px",
    padding: "12px",
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: "6px",
    fontSize: "12px",
    width: "240px",
    textAlign: "left",
    zIndex: 1000,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  toggleSwitch: {
    width: "40px",
    height: "20px",
    backgroundColor: "#ccc",
    borderRadius: "20px",
    padding: "2px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
  },
  toggleHandle: {
    width: "16px",
    height: "16px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    transition: "transform 0.2s",
  },
  mainContent: {
    flex: 1,
    position: "relative",
    padding: "12px 32px",
    overflow: "hidden",
    height: "calc(100vh - 112px)",
  },
  chatContainer: {
    position: "relative",
    height: "100%",
    backgroundColor: "#F6F6F8",
    borderRadius: "16px",
    margin: "0 auto",
    maxWidth: "1600px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: '1px solid #e0e0e0'
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "64px",
  },
  welcomeSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  welcomeTitle: {
    fontSize: "48px",
    fontWeight: "500",
    margin: 0,
    whiteSpace: "nowrap",
  },
  villyText: {
    color: "#F34D01",
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "70%",
    width: "500px",
    margin: "0 auto",
    position: "relative",
  },
  messageAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    position: "absolute",
    top: "-16px",
  },
  userAvatar: {
    right: "-16px",
    backgroundColor: "#F34D01",
  },
  aiAvatar: {
    left: "-16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
  },
  message: {
    maxWidth: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
    textAlign: "left",
  },
  userMessage: {
    backgroundColor: "#F34D01",
    color: "#ffffff",
    borderBottomRightRadius: "4px",
    marginLeft: "auto",
    marginRight: "32px",
    textAlign: "right",
  },
  aiMessage: {
    borderBottomLeftRadius: "4px",
    marginRight: "auto",
    marginLeft: "32px",
    textAlign: "left",
  },
  timestamp: {
    fontSize: "12px",
    color: "#666666",
    marginTop: "4px",
  },
  userTimestamp: {
    textAlign: "right",
  },
  aiTimestamp: {
    textAlign: "left",
  },
  inputWrapper: {
    padding: "24px",
    backgroundColor: '#F6F6F8',
    borderTop: 'none',
  },
  suggestedReplies: {
    marginBottom: "16px",
  },
  suggestedButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "center",
  },
  suggestedButton: {
    background: "#ffffff",
    border: "1px solid #ccc",
    borderRadius: "24px",
    padding: "10px 20px",
    fontSize: "14px",
    color: "#333",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease",
  },
  inputSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  inputForm: {
    width: "100%",
    maxWidth: '900px',
    margin: '0 auto',
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "0 16px",
    fontSize: "14px",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "8px",
    outline: "none",
    height: "40px",
    lineHeight: "40px",
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease, color 0.2s ease, transform 0.1s ease, border-color 0.2s ease",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#666666",
    textAlign: "center",
    marginTop: "12px",
    fontStyle: "italic",
    width: "100%",
  },
  footer: {
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    flexShrink: 0,
    borderTop: 'none',
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    color: "#666666",
    fontSize: "14px",
    marginLeft: "-8px",
  },
  footerRight: {
    display: "flex",
    alignItems: "center",
    marginRight: "-8px",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "#1a1a1a",
    fontSize: "14px",
    cursor: "pointer",
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#1a1a1a",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popup: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "600px",
    width: "90%",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
  },
  popupTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "16px",
    textAlign: "center",
  },
  popupSubtitle: {
    fontSize: "16px",
    fontWeight: "400",
    color: "#666666",
    textAlign: "center",
    marginBottom: "32px",
  },
  stepsContainerImproved: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
  },
  stepImproved: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    textAlign: "left",
  },
  stepIconImproved: {
    fontSize: "24px",
    color: "#F34D01",
    marginTop: "4px",
    flexShrink: 0,
  },
  stepTitleImproved: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 4px 0",
  },
  stepDescriptionImproved: {
    fontSize: "14px",
    fontWeight: "400",
    color: "#666666",
    margin: 0,
    lineHeight: 1.5,
  },
  closeButton: {
    background: "#F34D01",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  confirmButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
  },
  confirmButton: {
    background: "#F34D01",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  cancelButton: {
    background: "#ffffff",
    color: "#1a1a1a",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease",
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50%',
    transition: "background-color 0.2s ease",
  },
  avatarCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    borderRadius: '8px',
    padding: '8px 0',
    minWidth: '200px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'background-color 0.2s ease, border 0.2s ease',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: 'transparent',
    textAlign: 'left',
    gap: '12px',
    transition: 'background-color 0.2s ease',
  },
  dropdownIcon: {
    width: '16px',
    height: '16px',
    marginRight: '8px',
  },
  dropdownSeparatorBase: {
    height: '1px',
    margin: '8px 0',
  },
};

export default Chat;
