"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaQuestionCircle,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import villyAvatar from "../assets/images/villypfporange.jpg";
import LoadingScreen from "./LoadingScreen";
import ProfileAvatar from "../components/ProfileAvatar";
import logoIconOrange from "../assets/images/logoiconorange.png";
import {
  fetchUserProfile,
  getUserData,
  API_URL,
  clearAuthData,
} from "../utils/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VillyReportCard from "../components/VillyReportCard";
import { validateAuthToken, getAuthToken } from "../utils/auth";
import ReactMarkdown from "react-markdown";

// System prompts for different modes
const GLI_SYSTEM_PROMPT =
  "You are Villy, a helpful assistant providing general information.";
const CPA_SYSTEM_PROMPT =
  "You are Villy, a helpful assistant analyzing cases and providing assessments.";

// Function to format AI response text
const formatAIResponse = (text) => {
  if (!text) return "";
  
  // Clean up metadata tags and unnecessary formatting
  let cleanedText = text
    // Remove metadata tags like {sourcesUsed: [...]}
    .replace(/\{sourcesUsed:\s*\[.*?\]\}/g, "")
    // Remove any remaining metadata patterns
    .replace(/\{[^}]*\}/g, "")
    // Remove standalone "Sources:" sections that are just text (not structured)
    .replace(/\n\s*Sources?:\s*\n?\s*[-•]\s*[^\n]+\n?/gi, "")
    .replace(/\n\s*Sources?:\s*$/gi, "")
    // Remove bulleted source lists
    .replace(/\n\s*Sources?:\s*\n?\s*[-•]\s*[^\n]+(\n\s*[-•]\s*[^\n]+)*/gi, "")
    // Remove numbered source lists
    .replace(/\n\s*Sources?:\s*\n?\s*\d+\.\s*[^\n]+(\n\s*\d+\.\s*[^\n]+)*/gi, "")
    // Remove any remaining source references
    .replace(/\n\s*Sources?:\s*[^\n]+/gi, "")
    // Remove inline source references at the end of text (like "Sources: • Rape Laws...")
    .replace(/\s+Sources?:\s*[-•]\s*[^.]*\.?\s*$/gi, "")
    // Remove source references that appear inline (like "Sources: • Rape Laws in the Philippines")
    .replace(/\s+Sources?:\s*[-•]\s*[^.]*\.?\s*(?=\s|$)/gi, "")
    // Remove "For more detailed information, refer to..." patterns
    .replace(/\s*For\s+more\s+detailed\s+information,?\s+refer\s+to[^.]*\.?\s*$/gi, "")
    // Remove "Legal Reference:" sections that contain source information
    .replace(/\n\s*\d+\.\s*Legal\s+Reference:?\s*[^.]*\.?\s*$/gi, "")
    // Remove specific law mentions that are clearly source references
    .replace(/\s*Republic\s+Act\s+No\.\s+\d+[^.]*\.?\s*$/gi, "")
    .replace(/\s*RA\s+No\.\s+\d+[^.]*\.?\s*$/gi, "")
    // Remove any "Sources:" text followed by anything
    .replace(/\n?\s*Sources?:\s*.*$/gim, "")
    // Remove any remaining source-related text patterns
    .replace(/\n?\s*Sources?:\s*.*?(?=\n\n|\n[A-Z]|$)/gim, "")
    // Clean up extra whitespace
    .replace(/\s+/g, " ")
    .trim();
  
  // Replace Markdown-like symbols with HTML tags
  const formattedText = cleanedText
    // Replace ***text*** with <strong><em>text</em></strong>
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Replace **text** with <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Replace *text* with <em>text</em>
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return formattedText;
};

// Function to fetch response from GPT-3.5 Turbo API via backend
const fetchGPTResponse = async (
  userMessage,
  mode = "A",
  conversationId = null,
  userId = null,
  userEmail = null
) => {
  console.log("Fetching AI response for:", userMessage);
  console.log("Conversation ID:", conversationId);

  try {
    // Get user data for the request
    const user = getUserData();

    // Call the backend API endpoint with conversation context
    const response = await axios.post(`${API_URL}/ai/chat`, {
      message: userMessage,
      mode: mode,
      conversationId: conversationId,
      userId: userId || (user ? user.uid : null),
      userEmail: userEmail || (user ? user.email : null),
    });

    console.log("AI response received:", response.data);

    if (response.data && response.data.success) {
      return {
        success: true,
        response: response.data.response,
        conversationId: response.data.conversationId, // Get the conversation ID from the response
        plausibilityLabel: response.data.plausibilityLabel,
        plausibilitySummary: response.data.plausibilitySummary,
        sources: response.data.sources || [], // Knowledge base sources
        hasKnowledgeBaseContext: response.data.hasKnowledgeBaseContext || false,
      };
    } else {
      console.error("Error in AI response:", response.data);
      return {
        success: false,
        response:
          "Sorry, I encountered an error processing your request. Please try again later.",
        conversationId: conversationId,
        plausibilityLabel: null,
        plausibilitySummary: null,
        sources: [],
        hasKnowledgeBaseContext: false,
      };
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);

    // Fallback to mock responses if the backend is unavailable
    console.log("Using fallback mock response");
    let responseText = "";

    // Generate different responses based on the content of the message
    if (
      userMessage.toLowerCase().includes("hello") ||
      userMessage.toLowerCase().includes("hi")
    ) {
      responseText =
        "Hello! I'm Villy, your virtual assistant. How can I help you today?";
    } else if (userMessage.toLowerCase().includes("help")) {
      responseText =
        "I'm here to help you with your questions and concerns. What would you like assistance with?";
    } else if (userMessage.toLowerCase().includes("report")) {
      responseText =
        "To submit a report, please provide details about what happened and any other relevant information. This will help us address your concern.";
    } else if (userMessage.toLowerCase().includes("status")) {
      responseText =
        "You can check the status of your reports in the conversation history. Your reports will be updated as they are processed.";
    } else if (userMessage.toLowerCase().includes("admin")) {
      responseText =
        "Admins will be notified of your report and will contact you through this chat interface once they start working on it.";
    } else {
      responseText =
        "Thank you for your message. I've recorded your report. Is there anything else you'd like to add?";
    }

    return {
      success: true,
      response: responseText,
      plausibilityLabel: null,
      plausibilitySummary: null,
    };
  }
};

const isVague = (text) => {
  // Simple ruleset for vagueness
  const vaguePatterns = [
    /something wrong/i,
    /did a bad thing/i,
    /in trouble/i,
    /help/i,
    /problem/i,
    /issue/i,
    /need advice/i,
    /not sure/i,
    /don't know/i,
    /unsure/i,
    /can you help/i,
    /what should i do/i,
    /accident/i,
    /mistake/i,
    /legal trouble/i,
    /broke the law/i,
    /illegal/i,
    /crime/i,
    /wrong/i,
  ];
  return vaguePatterns.some((pat) => pat.test(text));
};

const genericSuggestions = [
  [
    "Tell me more",
    "Who was involved?",
    "When did this happen?",
    "Any evidence?",
  ],
  [
    "Did you report it?",
    "Was anyone hurt?",
    "Any witnesses?",
    "What do you want?",
  ],
  [
    "First time issue?",
    "Tried resolving it?",
    "Received a notice?",
    "Worried about charges?",
  ],
];

const getRandomGenericSuggestions = () => {
  // Pick a random set from the above
  return genericSuggestions[
    Math.floor(Math.random() * genericSuggestions.length)
  ];
};

// Rules-based mode fit detection
const fitsCPAMode = (text) => {
  // Looks for legal situation keywords
  const situationKeywords = [
    /accident/i,
    /injured/i,
    /harassed/i,
    /fired/i,
    /arrested/i,
    /stolen/i,
    /scammed/i,
    /sued/i,
    /charged/i,
    /court/i,
    /police/i,
    /conflict/i,
    /dispute/i,
    /harm/i,
    /damage/i,
    /threat/i,
    /violence/i,
    /abuse/i,
    /case/i,
    /complaint/i,
    /report/i,
    /violation/i,
    /crime/i,
    /legal issue/i,
    /problem/i,
    /trouble/i,
  ];
  return situationKeywords.some((pat) => pat.test(text));
};

const fitsGeneralInfoMode = (text) => {
  // Looks for fact/legal question patterns
  return /^(what|how|can|is|are|does|do|when|where|who|why)\b/i.test(
    text.trim()
  );
};

// Utility to filter out system echo and mode switch prompts from AI responses
const filterSystemEchoAndModeSwitch = (text, mode) => {
  if (!text) return text;
  // Remove system echo
  text = text
    .replace(
      /I'll continue assisting you under Case Plausibility Assessment mode\.?/gi,
      ""
    )
    .replace(
      /I'll continue assisting you under General Legal Information mode\.?/gi,
      ""
    )
    .replace(
      /I will continue assisting you under Case Plausibility Assessment mode\.?/gi,
      ""
    )
    .replace(
      /I will continue assisting you under General Legal Information mode\.?/gi,
      ""
    )
    .replace(/Thank you for sharing that\.?/gi, "")
    .replace(/^\s+/gm, "");
  // Remove mode switch prompts
  if (mode === "B") {
    text = text
      .replace(
        /would you like to switch to case plausibility assessment mode[^?.!]*[?.!]/i,
        ""
      )
      .replace(/switch to assessment mode[^?.!]*[?.!]/i, "")
      .trim();
  }
  if (mode === "A") {
    text = text
      .replace(
        /would you like to switch to general legal information mode[^?.!]*[?.!]/i,
        ""
      )
      .replace(/switch to general information mode[^?.!]*[?.!]/i, "")
      .trim();
  }
  // Remove system prompt echoes (blockquotes or quoted system prompt)
  text = text.replace(/^>\s*"I am Villy[^"]*"[\s\S]*?(?=\n|$)/gi, "").trim();
  return text.trim();
};

const markdownComponents = {
  h1: ({ node, ...props }) => (
    <h1
      style={{
        fontSize: "1.3em",
        fontWeight: 700,
        margin: "12px 0 6px 0",
        color: "#F34D01",
      }}
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      style={{
        fontSize: "1.15em",
        fontWeight: 700,
        margin: "10px 0 5px 0",
        color: "#F34D01",
      }}
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      style={{
        fontSize: "1.05em",
        fontWeight: 700,
        margin: "8px 0 4px 0",
        color: "#F34D01",
      }}
      {...props}
    />
  ),
  p: ({ node, children, ...props }) => {
    if (typeof children[0] === "string" && children[0].startsWith("Note:")) {
      return (
        <p
          style={{
            background: "#fffbe6",
            color: "#b45309",
            padding: "6px 10px",
            borderRadius: 6,
            margin: "8px 0",
          }}
        >
          {children}
        </p>
      );
    }
    return (
      <p style={{ margin: 0, padding: 0, lineHeight: "1.5" }} {...props}>
        {children}
      </p>
    );
  },
  ul: ({ node, ...props }) => (
    <ul style={{ margin: 0, paddingLeft: 22, lineHeight: "1.5" }} {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol style={{ margin: 0, paddingLeft: 22, lineHeight: "1.5" }} {...props} />
  ),
  li: ({ node, ...props }) => (
    <li
      style={{ margin: "0 0 2px 0", padding: 0, lineHeight: "1.5" }}
      {...props}
    />
  ),
  a: ({ node, ...props }) => (
    <a
      style={{
        color: "#2563eb",
        textDecoration: "underline",
        fontWeight: 500,
        wordBreak: "break-all",
      }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

// 1. VillyReportUI component
const VillyReportUI = ({ reportText, isDarkMode }) => {
  // Parse the reportText for score, label, summary, sources, and steps
  // Simple regex-based extraction for demo; adjust as needed for your format
  const scoreMatch = reportText.match(
    /(\d{1,3})%\s*(Possible|Likely|Unlikely|Highly Likely|Highly Unlikely)/i
  );
  const score = scoreMatch ? scoreMatch[1] : null;
  const label = scoreMatch ? scoreMatch[2] : null;

  // Extract summary (first paragraph)
  const summary = reportText.split("Sources:")[0].replace(/\n+/g, " ").trim();

  // Extract sources
  let sources = "";
  let steps = "";
  if (reportText.includes("Sources:")) {
    const afterSources = reportText.split("Sources:")[1];
    const sourcesEnd = afterSources.indexOf("Suggested Steps:");
    if (sourcesEnd !== -1) {
      sources = afterSources.substring(0, sourcesEnd).trim();
      steps = afterSources
        .substring(sourcesEnd + "Suggested Steps:".length)
        .trim();
    } else {
      sources = afterSources.trim();
    }
  }
  // Extract steps as list
  let stepsList = [];
  if (steps) {
    stepsList = steps
      .split(/\n\d+\./)
      .map((s) => s.trim())
      .filter(Boolean);
    if (stepsList.length === 0 && steps) {
      // fallback: try splitting by newlines
      stepsList = steps
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Helper to style report text for dark mode
  function formatReportText(text, isDarkMode) {
    if (!text) return "";
    
    // Clean up metadata tags and unnecessary formatting
    let cleanedText = text
      // Remove metadata tags like {sourcesUsed: [...]}
      .replace(/\{sourcesUsed:\s*\[.*?\]\}/g, "")
      // Remove any remaining metadata patterns
      .replace(/\{[^}]*\}/g, "")
      // Remove standalone "Sources:" sections that are just text (not structured)
      .replace(/\n\s*Sources?:\s*\n?\s*[-•]\s*[^\n]+\n?/gi, "")
      .replace(/\n\s*Sources?:\s*$/gi, "")
      // Remove bulleted source lists
      .replace(/\n\s*Sources?:\s*\n?\s*[-•]\s*[^\n]+(\n\s*[-•]\s*[^\n]+)*/gi, "")
      // Remove numbered source lists
      .replace(/\n\s*Sources?:\s*\n?\s*\d+\.\s*[^\n]+(\n\s*\d+\.\s*[^\n]+)*/gi, "")
      // Remove any remaining source references
      .replace(/\n\s*Sources?:\s*[^\n]+/gi, "")
      // Remove inline source references at the end of text (like "Sources: • Rape Laws...")
      .replace(/\s+Sources?:\s*[-•]\s*[^.]*\.?\s*$/gi, "")
      // Remove source references that appear inline (like "Sources: • Rape Laws in the Philippines")
      .replace(/\s+Sources?:\s*[-•]\s*[^.]*\.?\s*(?=\s|$)/gi, "")
      // Remove "For more detailed information, refer to..." patterns
      .replace(/\s*For\s+more\s+detailed\s+information,?\s+refer\s+to[^.]*\.?\s*$/gi, "")
      // Remove "Legal Reference:" sections that contain source information
      .replace(/\n\s*\d+\.\s*Legal\s+Reference:?\s*[^.]*\.?\s*$/gi, "")
      // Remove specific law mentions that are clearly source references
      .replace(/\s*Republic\s+Act\s+No\.\s+\d+[^.]*\.?\s*$/gi, "")
      .replace(/\s*RA\s+No\.\s+\d+[^.]*\.?\s*$/gi, "")
      // Remove any "Sources:" text followed by anything
      .replace(/\n?\s*Sources?:\s*.*$/gim, "")
      // Remove any remaining source-related text patterns
      .replace(/\n?\s*Sources?:\s*.*?(?=\n\n|\n[A-Z]|$)/gim, "")
      // Remove emojis from the text
      .replace(
        /[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F300}-\u{1F5FF}]/gu,
        ""
      )
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim();
    
    // Split into lines
    const lines = cleanedText.split("\n");
    let html = "";
    lines.forEach((line) => {
      let styledLine = line;
      // Highlight section headers in white for dark mode
      if (
        isDarkMode &&
        (line.trim().startsWith("Case Summary:") ||
          line.trim().startsWith("Legal Issues or Concerns:") ||
          line.trim().startsWith("Suggested Next Steps:"))
      ) {
        styledLine = `<span style=\"color: #fff; font-weight: 600;\">${line}</span>`;
      } else if (isDarkMode) {
        styledLine = `<span style=\"color: #e0e0e0;\">${line}</span>`;
      }
      html += `<div style=\"margin-bottom: 4px;\">${styledLine}</div>`;
    });
    return html;
  }

  return (
    <div
      style={{
        background: isDarkMode ? "#1C1C1C" : "#fff",
        border: "1.5px solid #F34D01",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(243,77,1,0.08)",
        // padding: "32px 32px 24px 32px",
        margin: "24px 0",
        maxWidth: 600,
        minWidth: 320,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 32,
      }}
    >
      {/* Score section */}
      <div
        style={{
          minWidth: 120,
          textAlign: "center",
          color: "#F34D01",
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.1,
          marginRight: 16,
          marginTop: 8,
        }}
      >
        {score ? `${score}%` : ""}
        <div
          style={{
            fontSize: 22,
            color: "#16a34a",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {label || ""}
        </div>
      </div>
      {/* Main content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: "#F34D01",
            marginBottom: 8,
          }}
        >
          Villy's Report
        </div>
        <div
          style={{
            fontSize: 16,
            color: isDarkMode ? "#e0e0e0" : "#222",
            marginBottom: 16,
          }}
          dangerouslySetInnerHTML={{
            __html: formatReportText(summary, isDarkMode),
          }}
        />
        {sources && (
          <div
            style={{
              fontSize: 14,
              color: isDarkMode ? "#e0e0e0" : "#666",
              marginBottom: 12,
            }}
          >
            <b>Sources:</b>
            <br />
            {sources.split(/\s+/).map(
              (src, i) =>
                src && (
                  <span key={i}>
                    {src}
                    <br />
                  </span>
                )
            )}
          </div>
        )}
        {stepsList.length > 0 && (
          <div
            style={{
              fontSize: 15,
              color: isDarkMode ? "#e0e0e0" : "#222",
              marginTop: 8,
            }}
          >
            <b>Suggested Steps:</b>
            <ol style={{ margin: "8px 0 0 20px", padding: 0 }}>
              {stepsList.map((step, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const navigate = useNavigate();
  // const [suggestedRepliesEnabled, setSuggestedRepliesEnabled] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const chatContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [noButtonHovered, setNoButtonHovered] = useState(false);
  const [yesButtonHovered, setYesButtonHovered] = useState(false);
  const [logoutYesHovered, setLogoutYesHovered] = useState(false);
  const [logoutNoHovered, setLogoutNoHovered] = useState(false);
  const [howItWorksHovered, setHowItWorksHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendHovered, setSendHovered] = useState(false);
  const inputRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // New state variables for chat history
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [conversationTitle, setConversationTitle] = useState("");
  const [showNewConversationForm, setShowNewConversationForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showReportThanksPopup, setShowReportThanksPopup] = useState(false); // controls the 'Villy is glad' popup
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return sessionStorage.getItem("disclaimerDismissed") !== "true";
  });

  useEffect(() => {
    sessionStorage.setItem("disclaimerDismissed", (!showDisclaimer).toString());
  }, [showDisclaimer]);

  // controls the disclaimer visibility
  // Undeclared variables for new conversation creation
  const conversationLocation = ""; // Placeholder, assuming it's not used or will be defined elsewhere
  const conversationCategory = ""; // Placeholder, assuming it's not used or will be defined elsewhere

  const suggestedQuestions = [
    "I have a land dispute",
    "Can I break an NDA?",
    "Workplace harassment",
    "In trouble with the police",
  ];

  // const handleToggleSuggestions = () => {
  //   setSuggestedRepliesEnabled(!suggestedRepliesEnabled);
  // };

  const handleModeSelection = async (mode) => {
    setSelectedMode(mode);

    // Delete all previous conversations when starting a new chat to maintain confidentiality
    if (userData && userData.email) {
      try {
        // Show loading state
        setLoading(true);

        // Call the backend API to delete all previous conversations
        const response = await axios.post(
          `${API_URL}/ai/delete-previous-conversations`,
          {
            userEmail: userData.email,
          }
        );

        console.log("Deleted previous conversations:", response.data);

        // Clear current conversation state
        setCurrentConversationId(null);
        setConversations([]);
      } catch (error) {
        console.error("Error deleting previous conversations:", error);
        // We don't show an error to the user as this is a background operation
      } finally {
        setLoading(false);
      }
    }

    // Set initial AI message based on selected mode
    const aiMessage = {
      text:
        mode === "A"
          ? "You've chosen to talk about General Legal Information. What would you like to ask?"
          : "You've chosen Case Plausibility Assessment mode. Please describe your situation, and I'll help you assess your case.",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([aiMessage]);
  };

  // Wrap the GPT call to prepend a system message if mode fits, and filter mode switch prompts and system echo from AI response
  const fetchGPTWithModeFit = async (userMessage) => {
    let prependSystem = "";
    if (selectedMode === "B" && fitsCPAMode(userMessage)) {
      prependSystem =
        "The user's input fits the current mode (Case Plausibility Assessment). Please confirm and continue. Do not offer a mode switch. Do not repeat this system message in your reply.";
    } else if (selectedMode === "A" && fitsGeneralInfoMode(userMessage)) {
      prependSystem =
        "The user's input fits the current mode (General Legal Information). Please confirm and continue. Do not offer a mode switch. Do not repeat this system message in your reply.";
    }

    // Prepare to send the request with conversation context
    let aiResponse;
    // Do NOT include the system hint in the text sent to backend; send plain user message
    const messageToSend = userMessage;

    if (userData) {
      aiResponse = await fetchGPTResponse(
        messageToSend,
        selectedMode,
        currentConversationId,
        userData.uid,
        userData.email
      );
    } else {
      aiResponse = await fetchGPTResponse(messageToSend, selectedMode);
    }

    // Update conversation ID if it was created by the backend
    if (aiResponse.conversationId && !currentConversationId) {
      setCurrentConversationId(aiResponse.conversationId);
      console.log(
        "New conversation created with ID:",
        aiResponse.conversationId
      );
    }

    // Filter out system echo and mode switch prompts if already in correct mode
    return {
      ...aiResponse,
      response: filterSystemEchoAndModeSwitch(
        aiResponse.response,
        selectedMode
      ),
    };
  };

  // Auto-expand textarea as user types, but only if content exceeds initial height
  const handleInputChange = (e) => {
    setQuestion(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "40px"; // initial height
      if (inputRef.current.scrollHeight > 40) {
        inputRef.current.style.height = inputRef.current.scrollHeight + "px";
      }
    }
    // Auto-scroll chat to bottom when input expands
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Handle Enter/Shift+Enter in textarea
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setSendHovered(true);
      if (!isTyping) {
        handleSubmit(e);
      }

      setTimeout(() => setSendHovered(false), 750);
    }
    // else allow default (newline)
  };

  // Function to fetch user conversations from backend API - commented out as per requirements
  /*
  const fetchUserConversations = async () => {
    try {
      if (!userData || !userData.email) {
        console.log('No user email available to fetch conversations');
        return;
      }

      const response = await axios.get(`${API_URL}/chat/conversations/user/${userData.email}`);
      const data = response.data;
      console.log('Fetched conversations:', data);
      setConversations(data);
    } catch (error) {
      console.log('Note: Conversations are not being fetched as per requirements');
      // No error toast to avoid disrupting user experience
    }
  };
  */

  // Placeholder function that does nothing - to avoid errors when called
  const fetchUserConversations = async () => {
    console.log(
      "Note: Conversations are not being fetched as per requirements"
    );
    return; // Do nothing
  };

  // Placeholder function that does nothing - to avoid errors when called
  const createConversation = async (
    userId,
    userEmail,
    title,
    location,
    category
  ) => {
    console.log("Note: Conversation creation is disabled as per requirements");
    return { id: null }; // Return a mock object
  };

  // Function to create a new conversation
  const createNewConversation = async () => {
    try {
      if (!userData || !userData.email) {
        toast.error("You must be logged in to create a conversation");
        return;
      }

      const newConversation = await createConversation(
        userData.uid || "unknown",
        userData.email,
        conversationTitle || "New Conversation",
        conversationLocation,
        conversationCategory
      );

      console.log("Created new conversation:", newConversation);

      // Update conversations list
      setConversations([newConversation, ...conversations]);

      // Set as current conversation
      setCurrentConversationId(newConversation.id);
      setMessages([]);
      setShowNewConversationForm(false);

      toast.success("New conversation created");
      // Clear session from localStorage
      localStorage.removeItem("currentConversationId");
      localStorage.removeItem("chatMessages");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new conversation");
    }
  };

  // Function to load messages for a conversation
  const loadConversationMessages = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}/messages`
      );
      const data = response.data;
      console.log("Fetched messages:", data);

      // Convert to the format expected by the UI
      const formattedMessages = data.map((msg) => ({
        text: msg.content,
        isUser: msg.userMessage,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load conversation messages");
    }
  };

  // Function to save a message to the current conversation
  const saveMessageToConversation = async (content, isUserMessage) => {
    try {
      if (!currentConversationId) {
        // Create a new conversation first if none exists
        const response = await axios.post(`${API_URL}/chat/conversations`, {
          userId: userData.uid || "unknown",
          userEmail: userData.email,
          title:
            content.length > 50 ? content.substring(0, 50) + "..." : content,
        });

        const newConversation = response.data;
        console.log("Created new conversation for message:", newConversation);
        setCurrentConversationId(newConversation.id);

        // We're not fetching conversations as per requirements
        // await fetchUserConversations();
      }

      // Now save the message
      await axios.post(
        `${API_URL}/chat/conversations/${currentConversationId}/messages`,
        {
          userId: userData.uid || "unknown",
          userEmail: userData.email,
          content: content,
          isUserMessage: isUserMessage,
        }
      );

      console.log("Message saved to conversation");
    } catch (error) {
      // Just log the error without showing any error messages to the user
      console.log(
        "Note: Error occurred while saving message, but not showing error to user"
      );
      // We're intentionally not showing error messages as per requirements
    }
  };

  // Function to update conversation title
  const updateConversationTitle = async () => {
    try {
      if (!currentConversationId || !editTitle.trim()) {
        setIsEditingTitle(false);
        return;
      }

      // Find the current conversation
      const conversation = conversations.find(
        (conv) => conv.id === currentConversationId
      );
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Update the title
      conversation.title = editTitle.trim();

      // Update the conversation in the backend
      await axios.put(
        `${API_URL}/chat/conversations/${currentConversationId}`,
        conversation
      );

      // Update local state
      setConversations(
        conversations.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, title: editTitle.trim() }
            : conv
        )
      );

      setIsEditingTitle(false);
      toast.success("Conversation title updated");
    } catch (error) {
      console.error("Error updating conversation title:", error);
      toast.error("Failed to update conversation title");
      setIsEditingTitle(false);
    }
  };

  // Function to delete a conversation
  const deleteConversation = async (conversationId) => {
    try {
      // Confirm deletion with the user
      if (
        !window.confirm(
          "Are you sure you want to delete this conversation? This action cannot be undone."
        )
      ) {
        return;
      }

      // Delete the conversation from backend
      await axios.delete(`${API_URL}/chat/conversations/${conversationId}`);

      // Remove from local state
      setConversations(
        conversations.filter((conv) => conv.id !== conversationId)
      );

      // If the deleted conversation was the current one, reset current conversation
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }

      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  // Function to handle conversation selection
  const handleConversationSelect = (conversationId) => {
    setCurrentConversationId(conversationId);
    loadConversationMessages(conversationId);

    // On mobile, hide the conversation list after selection
    if (window.innerWidth < 768) {
      setShowConversationList(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent sending empty, whitespace, or malformed messages (e.g., only brackets)
    if (
      !question ||
      question.trim() === "" ||
      question.trim() === "{}" ||
      question.trim() === "[]"
    ) {
      return;
    }

    // If mode is not selected, show mode selection instead
    if (!selectedMode) {
      setShowDropdown(true);
      return;
    }

    // Add user message to the chat
    const userMessage = {
      text: question,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuestion(""); // Clear input field
    setIsTyping(true); // Show typing indicator

    // Reset input height to default
    // Reset input height to default and remove focus
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
    }

    // Auto-scroll chat to bottom when input expands
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    // Generate dynamic suggestions if input is vague
    if (isVague(question)) {
      setDynamicSuggestions(getRandomGenericSuggestions());
    } else {
      setDynamicSuggestions([]);
    }

    try {
      // Save user message to conversation if user is logged in
      if (userData && userData.email) {
        await saveMessageToConversation(question, true);
      }

      // Call the backend API for GPT response with conversation context
      const result = await fetchGPTWithModeFit(question);

      // Update conversation ID if a new one was created
      if (
        result.conversationId &&
        result.conversationId !== currentConversationId
      ) {
        setCurrentConversationId(result.conversationId);
        console.log("New conversation created with ID:", result.conversationId);
      }

      // Add AI response to chat
      if (result.success) {
        const aiMessage = {
          text: result.response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isReport: result.isReport || false,
          sources: result.sources || [],
          hasKnowledgeBaseContext: result.hasKnowledgeBaseContext || false,
          plausibilityLabel: result.plausibilityLabel,
          plausibilitySummary: result.plausibilitySummary,
        };

        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);

        // Save AI response to conversation if user is logged in
        if (userData && userData.email) {
          await saveMessageToConversation(result.response, false);
        }

        // Auto-scroll to bottom of messages
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        // Handle error
        const errorMessage = {
          text: result.response || "An error occurred. Please try again.",
          isUser: false,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages([...newMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Error in chat response:", error);
      // Add error message to chat
      const errorMessage = {
        text: "An error occurred. Please try again later.",
        isUser: false,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false); // Hide typing indicator
    }
  };

  const handleSuggestedReply = async (reply) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMessage = { text: reply, isUser: true, timestamp };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Save user message to conversation
    await saveMessageToConversation(reply, true);

    // Show typing animation
    setIsTyping(true);

    // Scroll to bottom to show typing indicator
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    const aiResponse = await fetchGPTWithModeFit(reply);

    // Hide typing animation
    setIsTyping(false);

    const aiMessage = {
      text: aiResponse.response,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sources: aiResponse.sources || [],
      hasKnowledgeBaseContext: aiResponse.hasKnowledgeBaseContext || false,
      plausibilityLabel: aiResponse.plausibilityLabel,
      plausibilitySummary: aiResponse.plausibilitySummary,
    };
    const finalMessages = [...updatedMessages, aiMessage];
    setMessages(finalMessages);

    // Save AI response to conversation
    await saveMessageToConversation(aiResponse.response, false);

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
    setShowLogoutConfirm(false);
    setShowNewChatConfirm(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setShowHowItWorks(false);
    setShowNewChatConfirm(false);
  };

  const handleNewChat = () => {
    setShowNewChatConfirm(true);
    setShowHowItWorks(false);
    setShowLogoutConfirm(false);
  };

  const handleNewChatConfirm = async (confirm) => {
    if (confirm) {
      try {
        // Check if user is logged in and has an email
        if (userData && userData.email) {
          // Only show loading state if we're making the API call
          setLoading(true);

          // Call API to delete previous conversations
          const response = await axios.post(
            `${API_URL}/ai/delete-previous-conversations`,
            {
              userEmail: userData.email,
            }
          );

          // Log the result based on whether conversations existed
          if (response.data.conversationsExisted) {
            console.log(
              `Deleted ${response.data.deletedCount} previous conversations for user ${userData.email}`
            );
          } else {
            console.log("No previous conversations found to delete");
          }
        }
      } catch (error) {
        console.error("Error during conversation cleanup:", error);
        // We don't show an error to the user as this is a background operation
      } finally {
        setLoading(false);
      }

      // Clear current conversation state regardless of API results
      setCurrentConversationId(null);
      setMessages([]);
      setQuestion("");
      setShowTimestamp(null);
      setSelectedMode(null);

      // Show new conversation form
      setShowNewConversationForm(true);
    }
    setShowNewChatConfirm(false);
  };

  // Function to toggle conversation list visibility (for mobile)
  const toggleConversationList = () => {
    setShowConversationList(!showConversationList);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      clearAuthData(); // Clear all auth data
      navigate("/signin");
    }
    setShowLogoutConfirm(false);
  };

  const handleSigninRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/signin");
    }, 1000);
  };

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Fetch user profile data when component mounts
    const getUserProfile = async () => {
      try {
        console.log("Fetching user profile data...");

        // Get user data from localStorage (populated by auth.js or signup.jsx)
        const userData = localStorage.getItem("user");

        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            console.log("User data from localStorage:", parsedData);

            // Set the user data in state
            setUserData(parsedData);

            // Set profile picture if available
            if (parsedData.profile_picture_url) {
              setProfilePicture(parsedData.profile_picture_url);
            } else {
              // Try to fetch profile picture from Firebase if we have a uid
              if (parsedData.uid) {
                fetchProfilePicture(parsedData.uid);
              }
            }
          } catch (error) {
            console.error("Error parsing user data from localStorage:", error);
            createDefaultUser();
          }
        } else {
          // Try to fetch from backend API
          try {
            const fetchedUserData = await fetchUserProfile();
            if (fetchedUserData) {
              setUserData(fetchedUserData);

              // Set profile picture if available
              if (fetchedUserData.profile_picture_url) {
                setProfilePicture(fetchedUserData.profile_picture_url);
              } else {
                // Try to fetch profile picture from Firebase if we have a uid
                if (fetchedUserData.uid) {
                  fetchProfilePicture(fetchedUserData.uid);
                }
              }
            } else {
              console.log("No user data from API, creating default user");
              createDefaultUser();
            }
          } catch (error) {
            console.error("Error fetching user profile from API:", error);
            createDefaultUser();
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in getUserProfile:", error);
        createDefaultUser();
        setLoading(false);
      }
    };

    // Helper function to fetch profile picture from Firebase
    const fetchProfilePicture = async (uid) => {
      try {
        // Fetch user profile picture from backend
        const response = await axios.get(
          `${API_URL}/users/${uid}/profile-picture`
        );
        if (response.data && response.data.profile_picture_url) {
          console.log(
            "Fetched profile picture:",
            response.data.profile_picture_url
          );
          setProfilePicture(response.data.profile_picture_url);

          // Update userData with profile picture
          setUserData((prevData) => ({
            ...prevData,
            profile_picture_url: response.data.profile_picture_url,
          }));

          // Update localStorage
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          storedUser.profile_picture_url = response.data.profile_picture_url;
          localStorage.setItem("user", JSON.stringify(storedUser));
        } else {
          console.log("No profile picture found for user");
          setProfilePicture("https://randomuser.me/api/portraits/men/32.jpg");
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePicture("https://randomuser.me/api/portraits/men/32.jpg");
      }
    };

    // Helper function to create a default user if none exists
    const createDefaultUser = () => {
      // Create a default user for Civilify
      const defaultUser = {
        username: "Civilify User",
        email: "user@civilify.com",
        profile_picture_url: "https://randomuser.me/api/portraits/men/32.jpg",
      };

      console.log("Created default user:", defaultUser);
      setUserData(defaultUser);
      setProfilePicture(defaultUser.profile_picture_url);

      // Save to localStorage for other components
      localStorage.setItem("user", JSON.stringify(defaultUser));
    };

    getUserProfile();
  }, []);

  // We're not fetching conversations as per requirements
  /*
  useEffect(() => {
    if (userData && userData.email) {
      fetchUserConversations();
    }
  }, [userData]);
  */

  useEffect(() => {
    // Add global style to remove focus outline
    const style = document.createElement("style");
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
    const hoverStyle = document.createElement("style");
    hoverStyle.textContent = `
        .text-button-hover:hover {
          background-color: ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
          };
        }
        .text-button-hover:active {
          background-color: ${
            isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
          };
          transform: scale(0.98);
        }
    
        .icon-button-hover:hover {
          background-color: ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
          };
        }
        .icon-button-hover:active {
          background-color: ${
            isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
          };
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
            background-color: ${isDarkMode ? "#363636" : "#ffffff"};
            color: ${isDarkMode ? "#666666" : "#666666"};
            border: 1px solid ${isDarkMode ? "#555" : "#ccc"};
        }
        .send-button-hover:hover {
            background-color: ${isDarkMode ? "#ffffff" : "#F34D01"};
            color: ${isDarkMode ? "#ffffff" : "#ffffff"};
            border-color: ${isDarkMode ? "#ffffff" : "#F34D01"};
        }
        .send-button-hover:active {
            background-color: ${isDarkMode ? "#f0f0f0" : "#e04000"};
            transform: scale(0.95);
        }
        
        .toggle-switch-hover:hover > div { /* Target the handle */
           box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        }
        .toggle-switch-hover:active {
           transform: scale(0.97);
        }
    
        .avatar-button-hover:hover {
      transform: scale(1.01); /* Scale down to 0.5 */
      box-shadow: 0 0 8px 4px rgba(243, 77, 1, 0.5); /* Orange glow */
    }
    .avatar-button-hover:active {
      transform: scale(0.7); /* Slightly smaller on click */
      box-shadow: 0 0 6px 3px rgba(243, 77, 1, 0.4); /* Slightly dimmer glow */
    }
    
        .dropdown-item-hover:hover {
           background-color: ${isDarkMode ? "#404040" : "#f0f0f0"};
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

    const modeHoverStyle = document.createElement("style");
    modeHoverStyle.textContent = `
      @keyframes orange-glow-move {
        0% {
          box-shadow: 0 0 0 0 rgba(243,77,1,0.14), 0 0 16px 6px rgba(243,77,1,0.10);
          border-radius: 16px;
        }
        50% {
          box-shadow: 0 0 0 6px rgba(243,77,1,0.10), 0 0 32px 16px rgba(243,77,1,0.16);
          border-radius: 16px;
        }
        100% {
          box-shadow: 0 0 0 0 rgba(243,77,1,0.14), 0 0 16px 6px rgba(243,77,1,0.10);
          border-radius: 16px;
        }
      }
      .mode-option-hover,
      .mode-option-hover:hover {
        border-radius: 16px !important;
      }
      .mode-option-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 0 0 0 rgba(243,77,1,0.14), 0 0 16px 6px rgba(243,77,1,0.10);
        animation: orange-glow-move 1.6s linear infinite;
        border: none !important;
      }
      .mode-option-hover:active {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(modeHoverStyle);

    return () => {
      document.head.removeChild(style); // Clean up injected style
      document.head.removeChild(hoverStyle); // Clean up hover styles
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.removeEventListener("mousedown", handleClickOutside);
      document.head.removeChild(modeHoverStyle);
    };
  }, [isDarkMode]); // Add isDarkMode dependency for hover styles

  // Track if initial mount is done
  const initialMount = useRef(true);

  useEffect(() => {
    const savedConversationId = localStorage.getItem("currentConversationId");
    const savedMessages = localStorage.getItem("chatMessages");
    const savedMode = localStorage.getItem("selectedMode");

    if (savedConversationId) {
      setCurrentConversationId(savedConversationId);
    }
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        initialMount.current = true; // Set flag for initial load
      } catch (e) {
        setMessages([]);
      }
    }
    if (savedMode) {
      setSelectedMode(savedMode);
    }
  }, []);

  // Auto-scroll chat to bottom on every new message (user or Villy)
  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (messages.length === 0) return; // Don't scroll if no messages (welcome screen)
    const container = chatContainerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    document.title = "Civilify | Chat";
    return () => {
      document.title = "Civilify";
    };
  }, []);

  // Add CSS for typing animation
  useEffect(() => {
    const typingAnimationStyle = document.createElement("style");
    typingAnimationStyle.textContent = `
      .typing-animation {
        display: flex;
        align-items: center;
        column-gap: 6px;
      }
      
      .typing-animation span {
        height: 8px;
        width: 8px;
        background-color: ${isDarkMode ? "#f34d01" : "#f34d01"};
        border-radius: 50%;
        display: block;
        opacity: 0.4;
      }
      
      .typing-animation span:nth-child(1) {
        animation: pulse 1.4s infinite ease-in-out;
      }
      
      .typing-animation span:nth-child(2) {
        animation: pulse 1.4s infinite ease-in-out 0.2s;
      }
      
      .typing-animation span:nth-child(3) {
        animation: pulse 1.4s infinite ease-in-out 0.4s;
      }
      
      @keyframes pulse {
        0%, 100% {
          transform: scale(0.8);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.3);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(typingAnimationStyle);

    return () => {
      document.head.removeChild(typingAnimationStyle);
    };
  }, [isDarkMode]);

  useEffect(() => {
    // Check authentication on mount
    const token = getAuthToken();
    const authStatus = validateAuthToken();

    if (!token || !authStatus.valid) {
      console.log("Chat: Authentication check failed, redirecting to login");
      localStorage.setItem("redirectAfterLogin", "/chat");
      navigate("/signin", { replace: true });
      return;
    }
  }, [navigate]);

  // Helper to detect if last message is a report
  const isLastMessageReport = () => {
    if (messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (!last.text || last.isUser) return false;
    const text = last.text.toLowerCase();
    return (
      text.includes("plausibility score") ||
      text.includes("villy's assessment") ||
      text.includes("villy's report") ||
      text.includes("case summary")
    );
  };

  // Handler for 'This report was helpful. Thanks!'
  const handleReportThanks = () => {
    setShowReportThanksPopup(true);
  };

  // Handler for closing the popup and starting a new chat
  const handleGoBackToChat = () => {
    setShowReportThanksPopup(false);
    // Trigger new chat logic
    setCurrentConversationId(null);
    setMessages([]);
    setQuestion("");
    setShowTimestamp(null);
    setSelectedMode(null);
    // Clear session from localStorage
    localStorage.removeItem("currentConversationId");
    localStorage.removeItem("chatMessages");
  };

  // Persist session to localStorage on change
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("currentConversationId", currentConversationId);
    } else {
      localStorage.removeItem("currentConversationId");
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("chatMessages");
    }
  }, [messages]);

  useEffect(() => {
    if (selectedMode) {
      localStorage.setItem("selectedMode", selectedMode);
    }
  }, [selectedMode]);

  const inputWrapperRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(0);

  // Track input wrapper height
  useEffect(() => {
    if (inputWrapperRef.current) {
      setInputHeight(inputWrapperRef.current.offsetHeight || 0);
    }
  });

  // Loading messages for each mode
  const villyLoadingMessagesGLI = [
    "Villy is thinking...",
    "Villy is looking up legal facts...",
    "Villy is searching for the right law...",
    "Villy is checking the legal database...",
    "Villy is reviewing legal information...",
    "Villy is preparing a clear answer...",
    "Villy is making sure the info is accurate...",
    "Villy is finding the best legal explanation...",
  ];
  const villyLoadingMessagesCPA = [
    "Villy is analyzing your case...",
    "Villy is reviewing your situation...",
    "Villy is assessing the details...",
    "Villy is checking for possible outcomes...",
    "Villy is preparing a case assessment...",
    "Villy is evaluating the plausibility...",
    "Villy is building your case report...",
    "Villy is considering next steps...",
  ];
  const getVillyLoadingMessages = () =>
    selectedMode === "B" ? villyLoadingMessagesCPA : villyLoadingMessagesGLI;
  const [villyLoadingMessage, setVillyLoadingMessage] = useState(
    villyLoadingMessagesGLI[0]
  );

  useEffect(() => {
    if (isTyping) {
      const messages = getVillyLoadingMessages();
      setVillyLoadingMessage(
        messages[Math.floor(Math.random() * messages.length)]
      );
    }
  }, [isTyping, selectedMode]);

  // Added toggleDarkMode function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (loading) return <LoadingScreen isDarkMode={isDarkMode} />;

  return (
    <div
      className="app-container"
      style={{
        minHeight: "100vh",
        backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff",
        backgroundImage: isDarkMode
          ? `radial-gradient(circle, #333333 1px, transparent 1px)`
          : `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Header */}
      <header
        style={{
          ...styles.header,
          backgroundColor: isDarkMode ? "#1C1C1C" : "#ffffff",
          borderBottom: `1px solid ${isDarkMode ? "#F3640B" : "#F3640B"}`,
        }}
      >
        <div style={styles.headerLeft}>
          <img
            src={logoIconOrange}
            alt="Civilify Logo"
            style={{ ...styles.logo, height: "30px", marginRight: "12px" }}
          />
          <span
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
            }}
            className="header-to-mobile"
          >
            Civilify
          </span>
        </div>
        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.headerButton,
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              background: "none",
              transition:
                "background 0.2s, width 0.2s, height 0.2s, min-width 0.2s, transform 0.1s",
              minWidth: howItWorksHovered ? "110px" : undefined,
              height: howItWorksHovered ? "40px" : undefined,
              borderRadius: howItWorksHovered ? "6px" : "6px",
              padding: howItWorksHovered ? "8px 16px" : "8px 16px",
              fontWeight: 500,
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transform: howItWorksHovered ? "translateY(-2px)" : "none",
            }}
            onClick={handleHowItWorks}
            className="primary-button-hover header-to-mobile"
            onMouseEnter={() => setHowItWorksHovered(true)}
            onMouseLeave={() => setHowItWorksHovered(false)}
          >
            How it works
          </button>
          <button
            style={{
              ...styles.newChatButton,
              background: isDarkMode ? "#ffffff" : "#1a1a1a",
              color: isDarkMode ? "#1a1a1a" : "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onClick={handleNewChat}
            className="primary-button-hover"
          >
            + New chat
          </button>
          <div style={styles.avatarContainer} ref={dropdownRef}>
            <button
              style={styles.avatarButton}
              onClick={() => setShowDropdown(!showDropdown)}
              className="avatar-button-hover"
            >
              <ProfileAvatar
                onClick={() => setShowDropdown(!showDropdown)}
                style={styles.avatarCircle}
              />
            </button>
            {showDropdown && (
              <div
                style={{
                  ...styles.dropdownMenu,
                  backgroundColor: isDarkMode ? "#232323" : "#f8f8f8",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${
                      isDarkMode ? "#444" : "#e5e5e5"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: isDarkMode ? "#fff" : "#232323",
                  }}
                >
                  <ProfileAvatar size="small" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                      {getUserData()?.username || "User"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: isDarkMode ? "#ccc" : "#666",
                      }}
                    >
                      {getUserData()?.email || "user@example.com"}
                    </span>
                  </div>
                </div>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? "#fff" : "#232323",
                  }}
                  onClick={handleHowItWorks}
                  className="dropdown-item-hover mobile-to-header"
                >
                  <FaQuestionCircle style={styles.dropdownIcon} />
                  <span style={{ fontSize: "15px" }}>How it works</span>
                </button>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? "#fff" : "#232323",
                  }}
                  onClick={() => navigate("/profile")}
                  className="dropdown-item-hover"
                >
                  <FaUser style={styles.dropdownIcon} />
                  <span style={{ fontSize: "15px" }}>My Profile</span>
                </button>
                <div
                  style={{
                    ...styles.dropdownToggleRow,
                    color: isDarkMode ? "#fff" : "#232323",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      ...styles.switchRect,
                      ...(isDarkMode ? {} : styles.switchRectInactive),
                    }}
                    onClick={toggleDarkMode}
                    className="toggle-switch-hover"
                  >
                    <div
                      style={{
                        ...styles.switchKnob,
                        left: isDarkMode ? "10px" : "2px",
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: "15px", fontWeight: 500 }}
                    onClick={toggleDarkMode}
                    className="toggle-switch-hover"
                  >
                    Dark Mode
                  </span>
                </div>
                <div
                  style={{
                    ...styles.dropdownSeparatorBase,
                    backgroundColor: isDarkMode
                      ? "#444"
                      : "rgba(0, 0, 0, 0.12)",
                    margin: "6px 0",
                  }}
                ></div>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? "#fff" : "#232323",
                  }}
                  onClick={handleLogout}
                  className="dropdown-item-hover"
                >
                  <FaSignOutAlt style={styles.dropdownIcon} />
                  <span style={{ fontSize: "15px" }}>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main
        style={{ ...styles.mainContent, backgroundColor: "transparent" }}
        className="main-content"
      >
        <div
          style={{
            ...styles.chatContainer,
            backgroundColor: "transparent",
            border: isDarkMode ? "0px solid #444" : "0px solid #bdbdbd",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start", // always flex-start
            alignItems: "center",
            overflow: "hidden",
            height: "100%",
            minHeight: 0,
          }}
        >
          {/* White background overlay for the chat area, now using isDarkMode from component scope */}
          {messages.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "-5px",
                left: 0,
                right: 0,
                bottom: 0,
                // alignItems: "stretch",
                background: isDarkMode ? "transparent" : "transparent",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
          )}
          <div
            style={{
              ...styles.chatMessages,
              flex: 1,
              // maxWidth: "100%",
              width: "100%",
              maxWidth: "900px",
              overflowY: messages.length === 0 ? "hidden" : "scroll",
              alignItems: "stretch",
              justifyContent: messages.length === 0 ? "center" : "flex-start",
              padding: selectedMode == null ? "0px !important" : "0px 24px",
              paddingTop: messages.length === 0 ? 0 : 24,
              paddingBottom: messages.length === 0 ? 0 : inputHeight + 20,
              marginBottom: messages.length === 0 ? 0 : 24,
              // gap: messages.length === 0 ? 0 : 64,
              background: "transparent",
              minHeight: 0,
              height: "100%",
            }}
            className="chatMessages"
            ref={chatContainerRef}
          >
            {messages.length === 0 ? (
              <div style={styles.welcomeSection}>
                <h1
                  style={{
                    ...styles.welcomeTitle,
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                  }}
                  className="welcome-title"
                >
                  Start your conversation with{" "}
                  <span style={styles.villyText}>Villy</span>.
                </h1>
                <div style={styles.modeSelectionContainer}>
                  <div
                    style={{
                      ...styles.modeOption,
                      backgroundColor: isDarkMode ? "#333" : "#ffffff",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      border: isDarkMode
                        ? "1px solid #444"
                        : "1px solid #e0e0e0",
                    }}
                    onClick={() => handleModeSelection("A")}
                    className="mode-option-hover"
                  >
                    <div style={styles.modeIcon}>
                      <FaQuestionCircle size={24} />
                    </div>
                    <div style={styles.modeContent}>
                      <h3
                        style={{
                          ...styles.modeTitle,
                          color: isDarkMode ? "#fff" : styles.modeTitle.color,
                        }}
                      >
                        General Legal Information
                      </h3>
                      <p
                        style={{
                          ...styles.modeDescription,
                          color: isDarkMode
                            ? "#bbbbbb"
                            : styles.modeDescription.color,
                        }}
                      >
                        Ask general questions about laws, procedures, and legal
                        concepts.
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      ...styles.modeOption,
                      backgroundColor: isDarkMode ? "#333" : "#ffffff",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      border: isDarkMode
                        ? "1px solid #444"
                        : "1px solid #e0e0e0",
                    }}
                    onClick={() => handleModeSelection("B")}
                    className="mode-option-hover"
                  >
                    <div style={styles.modeIcon}>
                      <FaClipboardList size={24} />
                    </div>
                    <div style={styles.modeContent}>
                      <h3
                        style={{
                          ...styles.modeTitle,
                          color: isDarkMode ? "#fff" : styles.modeTitle.color,
                        }}
                      >
                        Case Plausibility Assessment
                      </h3>
                      <p
                        style={{
                          ...styles.modeDescription,
                          color: isDarkMode
                            ? "#bbbbbb"
                            : styles.modeDescription.color,
                        }}
                      >
                        Get a detailed analysis of your specific legal
                        situation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageWrapper,
                    flexDirection: message.isUser ? "row-reverse" : "row",
                    justifyContent: message.isUser ? "flex-end" : "flex-start",
                    marginBottom:
                      index === messages.length - 1 ? 20 : undefined,
                  }}
                  className="message-wrapper"
                >
                  {message.isUser ? (
                    <img
                      src={
                        profilePicture ||
                        "https://randomuser.me/api/portraits/men/32.jpg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt="User Avatar"
                      style={{
                        ...styles.messageAvatar,
                        ...styles.userAvatar,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <img
                      src={villyAvatar || "/placeholder.svg"}
                      alt="Villy Avatar"
                      style={{
                        ...styles.messageAvatar,
                        ...styles.aiAvatar,
                        backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                        // border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div
                    style={{
                      ...styles.message,
                      ...(message.isUser
                        ? styles.userMessage
                        : message.isError
                        ? {
                            ...styles.aiMessage,
                            backgroundColor: "#fff0f0",
                            color: "#b91c1c",
                            // border: "1px solid #fca5a5",
                            fontStyle: "italic",
                          }
                        : {
                            ...styles.aiMessage,
                            backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                            color: isDarkMode ? "#ffffff" : "#1a1a1a",
                            // border: `1px solid ${
                            //   isDarkMode ? "#555" : "#e0e0e0"
                            // }`,
                            boxShadow: isDarkMode
                              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                              : "0 4px 12px rgba(0, 0, 0, 0.15)",
                          }),
                      cursor: "pointer",
                    }}
                    onClick={() => handleMessageClick(index)}
                  >
                    {!message.isUser &&
                    selectedMode === "B" &&
                    (message.text
                      .toLowerCase()
                      .includes("plausibility score") ||
                      message.text.toLowerCase().includes("case summary") ||
                      message.text.toLowerCase().includes("legal issues") ||
                      message.text
                        .toLowerCase()
                        .includes("suggested next steps")) ? (
                      <VillyReportCard
                        reportText={message.text}
                        isDarkMode={isDarkMode}
                        plausibilityLabel={message.plausibilityLabel}
                        plausibilitySummary={message.plausibilitySummary}
                      />
                    ) : (
                      <div>
                        <ReactMarkdown components={markdownComponents}>
                          {message.isUser ? message.text : message.text}
                        </ReactMarkdown>
                        {!message.isUser && message.sources && message.sources.length > 0 && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                            fontSize: '13px'
                          }}>
                            <div style={{
                              marginBottom: '8px',
                              color: isDarkMode ? '#888' : '#666',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              Sources:
                            </div>
                            <div style={{ lineHeight: '1.6' }}>
                              {message.sources.slice(0, 3).map((source, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                  {source.sourceUrls && source.sourceUrls.length > 0 ? (
                                    <a
                                      href={source.sourceUrls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: isDarkMode ? '#64b5f6' : '#1976d2',
                                        textDecoration: 'none',
                                        fontSize: '12px'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.textDecoration = 'underline';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.textDecoration = 'none';
                                      }}
                                    >
                                      {source.title}
                                      {source.canonicalCitation && ` (${source.canonicalCitation})`}
                                    </a>
                                  ) : (
                                    <span style={{ 
                                      color: isDarkMode ? '#aaa' : '#666',
                                      fontSize: '12px'
                                    }}>
                                      {source.title}
                                      {source.canonicalCitation && ` (${source.canonicalCitation})`}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {message.sources.length > 3 && (
                                <div style={{
                                  color: isDarkMode ? '#888' : '#666',
                                  fontSize: '11px',
                                  fontStyle: 'italic',
                                  marginTop: '4px'
                                }}>
                                  +{message.sources.length - 3} more sources available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

            {/* Typing animation */}
            {isTyping && (
              <div
                style={{
                  ...styles.messageWrapper,
                  flexDirection: "row",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  src={villyAvatar || "/placeholder.svg"}
                  alt="Villy Avatar"
                  style={{
                    ...styles.messageAvatar,
                    ...styles.aiAvatar,
                    backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                    border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    ...styles.message,
                    ...styles.aiMessage,
                    backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                    boxShadow: isDarkMode
                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                      : "0 4px 12px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px 20px",
                    minHeight: "20px",
                  }}
                >
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Only show chat input if a mode is selected AND the welcome screen is not showing */}
        {selectedMode && messages.length > 0 && (
          <div
            style={{ ...styles.inputWrapper, marginBottom: "10px" }}
            ref={inputWrapperRef}
          >
            {showDisclaimer && (
              <div
                style={{
                  ...styles.disclaimer,
                  background: isDarkMode
                    ? "rgba(220, 38, 38, 0.50)"
                    : "rgba(239, 68, 68, 0.50)",

                  padding: "8px",
                  margin: "12px 0",
                  maxWidth: "900px",
                  borderRadius: "20px",
                  color: isDarkMode ? "#bbbbbb" : "#ffffff",
                  cursor: "pointer",
                  boxShadow: isDarkMode
                    ? "0 2px 8px rgba(0,0,0,0.32)"
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
                onClick={() => setShowDisclaimer(false)} // Hide disclaimer on click
              >
                Villy offers AI-powered legal insights to help you explore your
                situation. While it's here to assist, it's not a substitute for
                professional legal advice.
                <div
                  style={{ marginTop: "3px", fontSize: "12px", opacity: 0.8 }}
                >
                  (Click to dismiss)
                </div>
              </div>
            )}
            <div
              style={{
                ...styles.inputSection,
                background: isDarkMode ? "#353535" : "#ffffff",
                boxShadow: isDarkMode
                  ? "0 2px 8px rgba(0,0,0,0.32)"
                  : "0 1px 2px rgba(0, 0, 0, 0.05)",
                border: isDarkMode ? "1.5px solid #555" : "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                transition: "box-shadow 0.2s ease, border-color 0.2s ease",
              }}
              className="inputSection"
            >
              <form
                onSubmit={handleSubmit}
                style={{
                  ...styles.inputForm,
                  position: "relative",
                  background: "transparent",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask a question"
                  style={{
                    ...styles.input,
                    backgroundColor: isDarkMode ? "#353535" : "#ffffff",
                    border: "none",
                    color: isDarkMode ? "#fff" : "#1a1a1a",
                    minHeight: "40px",
                    maxHeight: "120px",
                    lineHeight: "24px",
                    padding: "0 16px",
                    boxSizing: "border-box",
                    width: "400px",
                    verticalAlign: "middle",
                    fontFamily:
                      "Lato, system-ui, Avenir, Helvetica, Arial, sans-serif",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    resize: "none",
                    overflowY: "auto",
                    "::placeholder": { color: isDarkMode ? "#ccc" : "#888" },
                    outline: "none",
                  }}
                  rows={1}
                  className="chat-input-no-scrollbar"
                />
                <button
                  type="submit"
                  style={{
                    ...styles.sendButton,
                    backgroundColor: isTyping
                      ? "#f0f0f0"
                      : sendHovered
                      ? "#F34D01"
                      : "#fff",
                    border: isTyping
                      ? "2px solid #cccccc"
                      : sendHovered
                      ? "none"
                      : "2px solid #cccccc",
                    color: isTyping ? "#888" : sendHovered ? "#fff" : "#666",
                    boxShadow: "none",
                    marginLeft: "8px",
                    marginBottom: "2px",
                    position: "static",
                    zIndex: 21,
                    transition:
                      "background-color 0.2s, color 0.2s, transform 0.1s, border-color 0.2s",
                  }}
                  onMouseEnter={() => setSendHovered(true)}
                  onMouseLeave={() => setSendHovered(false)}
                  disabled={isTyping}
                >
                  {isTyping ? (
                    <svg
                      className="spinner"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                    >
                      <path
                        d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10"
                        strokeDasharray="31.4 31.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      key={sendHovered ? "hovered" : "not-hovered"}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={sendHovered ? "#fff" : "#666"}
                      strokeWidth="2"
                      style={{ transition: "stroke 0.2s" }}
                    >
                      <path
                        d="M12 20V4M5 11l7-7 7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Popup Overlays */}
      {showLogoutConfirm ? (
        <div
          style={{
            ...styles.overlay,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              ...styles.popup,
              maxWidth: "400px",
              margin: 0,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              position: "fixed",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDarkMode
                ? "#232323"
                : styles.popup.backgroundColor,
            }}
          >
            <h2
              style={{
                ...styles.popupTitle,
                color: isDarkMode ? "#fff" : styles.popupTitle.color,
              }}
            >
              Logout
            </h2>
            <p
              style={{
                ...styles.popupSubtitle,
                color: isDarkMode ? "#bbbbbb" : styles.popupSubtitle.color,
              }}
            >
              Are you sure you want to logout?
            </p>
            <div style={styles.confirmButtons}>
              <button
                style={{
                  ...styles.cancelButton,
                  background: isDarkMode
                    ? logoutNoHovered
                      ? "#555"
                      : "#444"
                    : styles.cancelButton.background,
                  color: isDarkMode ? "#fff" : styles.cancelButton.color,
                  border: isDarkMode
                    ? "1px solid #bbb"
                    : styles.cancelButton.border,
                  transform:
                    isDarkMode && logoutNoHovered
                      ? "translateY(0px) scale(0.98)"
                      : undefined,
                  transition:
                    "background-color 0.2s, border-color 0.2s, transform 0.1s",
                }}
                onClick={() => handleLogoutConfirm(false)}
                className="secondary-button-hover"
                onMouseEnter={() => setLogoutNoHovered(true)}
                onMouseLeave={() => setLogoutNoHovered(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.confirmButton,
                  background: isDarkMode
                    ? logoutYesHovered
                      ? "#e04000"
                      : "#F34D01"
                    : styles.confirmButton.background,
                  color: isDarkMode ? "#fff" : styles.confirmButton.color,
                  border: isDarkMode ? "none" : styles.confirmButton.border,
                  transform:
                    isDarkMode && logoutYesHovered
                      ? "translateY(0px) scale(0.98)"
                      : undefined,
                  transition:
                    "background-color 0.2s, border-color 0.2s, transform 0.1s",
                }}
                onClick={() => handleLogoutConfirm(true)}
                className="primary-button-hover"
                onMouseEnter={() => setLogoutYesHovered(true)}
                onMouseLeave={() => setLogoutYesHovered(false)}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      ) : showNewChatConfirm ? (
        <div
          style={{
            ...styles.overlay,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              ...styles.popup,
              maxWidth: "400px",
              margin: 0,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              position: "fixed",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDarkMode
                ? "#232323"
                : styles.popup.backgroundColor,
            }}
          >
            <h2
              style={{
                ...styles.popupTitle,
                color: isDarkMode ? "#fff" : styles.popupTitle.color,
              }}
            >
              You are starting a new conversation
            </h2>
            <p
              style={{
                ...styles.popupSubtitle,
                color: isDarkMode ? "#bbbbbb" : styles.popupSubtitle.color,
              }}
            >
              That means all information in the current conversation will be
              deleted. Continue?
            </p>
            <div style={styles.confirmButtons}>
              <button
                style={{
                  ...styles.cancelButton,
                  background: isDarkMode
                    ? noButtonHovered
                      ? "#555"
                      : "#444"
                    : styles.cancelButton.background,
                  color: isDarkMode ? "#fff" : styles.cancelButton.color,
                  border: isDarkMode
                    ? "1px solid #bbb"
                    : styles.cancelButton.border,
                  transform:
                    isDarkMode && noButtonHovered
                      ? "translateY(0px) scale(0.98)"
                      : undefined,
                  transition:
                    "background-color 0.2s, border-color 0.2s, transform 0.1s",
                }}
                onClick={() => handleNewChatConfirm(false)}
                className="secondary-button-hover"
                onMouseEnter={() => setNoButtonHovered(true)}
                onMouseLeave={() => setNoButtonHovered(false)}
              >
                No
              </button>
              <button
                style={{
                  ...styles.confirmButton,
                  background: isDarkMode
                    ? yesButtonHovered
                      ? "#e04000"
                      : "#F34D01"
                    : styles.confirmButton.background,
                  color: isDarkMode ? "#fff" : styles.confirmButton.color,
                  border: isDarkMode ? "none" : styles.confirmButton.border,
                  transform:
                    isDarkMode && yesButtonHovered
                      ? "translateY(0px) scale(0.98)"
                      : undefined,
                  transition:
                    "background-color 0.2s, border-color 0.2s, transform 0.1s",
                }}
                onClick={() => handleNewChatConfirm(true)}
                className="primary-button-hover"
                onMouseEnter={() => setYesButtonHovered(true)}
                onMouseLeave={() => setYesButtonHovered(false)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : showHowItWorks ? (
        <div style={styles.overlay}>
          <div
            style={{
              backgroundColor: isDarkMode ? "#232323" : "#fff",
              color: isDarkMode ? "#fff" : "#1a1a1a",
              borderRadius: "18px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
              maxWidth: 375,
              width: "92vw",
              padding: "28px 32px 24px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              overflowY: "hidden", // Enable scrolling if content overflows
              animation: "popUpAnimationHIW 0.3s ease-out forwards",
            }}
          >
            <div style={{ width: "100%" }}>
              <h2
                style={{
                  color: isDarkMode ? "#fff" : "#1a1a1a",
                  marginBottom: 24,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                How Civilify Works
              </h2>
              <ol
                style={{
                  paddingLeft: 0,
                  margin: 0,
                  listStyle: "none",
                  width: "100%",
                }}
              >
                <li style={{ marginBottom: 18 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      fontSize: 18,
                    }}
                  >
                    1. Choose a mode
                  </span>
                  <br />
                  <span
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#bbbbbb" : "#666666",
                    }}
                  >
                    Pick between quick legal info or full case assessment.
                  </span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      fontSize: 18,
                    }}
                  >
                    2. Chat naturally
                  </span>
                  <br />
                  <span
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#bbbbbb" : "#666666",
                    }}
                  >
                    Tell Villy your situation or question in simple words. No
                    legal jargon needed.
                  </span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      fontSize: 18,
                    }}
                  >
                    3. Smart help
                  </span>
                  <br />
                  <span
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#bbbbbb" : "#666666",
                    }}
                  >
                    If needed, Civilify will offer to switch modes to better
                    assist you.
                  </span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      fontSize: 18,
                    }}
                  >
                    4. Get your answer
                  </span>
                  <br />
                  <span
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#bbbbbb" : "#666666",
                    }}
                  >
                    If you're sharing a real situation, Civilify will build a
                    personalized case report with analysis, sources, a
                    plausibility score, and next steps.
                  </span>
                </li>
                <li style={{ marginBottom: 0 }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: isDarkMode ? "#fff" : "#1a1a1a",
                      fontSize: 18,
                    }}
                  >
                    5. Stay in control
                  </span>
                  <br />
                  <span
                    style={{
                      fontSize: 15,
                      color: isDarkMode ? "#bbbbbb" : "#666666",
                    }}
                  >
                    You decide if you want deeper help or just a quick answer.
                    Your privacy and understanding come first.
                  </span>
                </li>
              </ol>
            </div>
            <button
              style={{
                background: isDarkMode
                  ? howItWorksHovered
                    ? "#e04000"
                    : "#F34D01"
                  : "#F34D01",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                marginTop: 32,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "background-color 0.2s ease, transform 0.1s ease",
                transform:
                  isDarkMode && howItWorksHovered
                    ? "translateY(0px) scale(0.98)"
                    : undefined,
              }}
              onClick={() => setShowHowItWorks(false)}
              className="primary-button-hover"
              onMouseEnter={() => setHowItWorksHovered(true)}
              onMouseLeave={() => setHowItWorksHovered(false)}
            >
              I understand now
            </button>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      {/* <footer
        style={{
          ...styles.footer,
          backgroundColor: "transparent",
        }}
        className="footer-left"
      >
        <div
          style={{
            ...styles.footerLeft,
            color: "#b0b0b0",
            fontSize: "13px",
            marginLeft: "-8px",
            flex: 1,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          <span>The Civilify Company, Cebu City 2025</span>
        </div>
        <div
          style={{
            ...styles.footerRight,
            color: "#b0b0b0",
            fontSize: "13px",
            marginRight: "-8px",
            flex: 1,
            minWidth: 0,
            justifyContent: "flex-end",
            wordBreak: "break-word",
          }}
        >
          {selectedMode && messages.length > 0 && (
            <span>
              You are in:{" "}
              {selectedMode === "A"
                ? "General Legal Information"
                : "Case Plausibility Assessment"}{" "}
              Mode
            </span>
          )}
        </div>
      </footer> */}
      {/* Report Thanks Popup */}
      {showReportThanksPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: isDarkMode ? "#232323" : "#fff",
              color: isDarkMode ? "#fff" : "#1a1a1a",
              borderRadius: "16px",
              padding: "32px 32px 24px 32px",
              maxWidth: 400,
              width: "90vw",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              Villy is glad to be of assistance!
            </h2>
            <div
              style={{
                fontSize: 16,
                color: isDarkMode ? "#e0e0e0" : "#444",
                marginBottom: 24,
              }}
            >
              {/* Add additional message here */}
              If you have more questions or need further help, feel free to
              start a new conversation anytime.
            </div>
            <button
              style={{
                background: "#F34D01",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                cursor: "pointer",
              }}
              onClick={handleGoBackToChat}
            >
              Go back to chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  aiAvatar: {
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    // left: "-16px",
  },
  aiMessage: {
    borderRadius: "0px 24px 24px 24px",
    alignSelf: "flex-start",
    backgroundColor: "#232f3a", // slightly darker for dark modeS
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)", // Enhanced shadow
    color: "#e0e0e0",
    marginLeft: "0",
    marginRight: "auto",
    textAlign: "left",
  },
  aiTimestamp: {
    textAlign: "left",
  },
  avatarButton: {
    alignItems: "center",
    background: "none",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    padding: 0,
    transition: "transform 0.2s ease, box-shadow 0.2s ease", // Updated to include transform and box-shadow
  },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "#F34D01",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    height: "32px",
    justifyContent: "center",
    width: "32px",
  },
  avatarContainer: {
    position: "relative",
  },
  cancelButton: {
    background: "#ffffff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    color: "#1a1a1a",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 24px",
    transition:
      "background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease",
  },
  centerSection: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    justifyContent: "center",
  },
  chatContainer: {
    backgroundColor: "transparent",
    // border: "1.5px solid #bdbdbd",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    margin: "0 auto",
    width: "100%",
    maxWidth: "1600px",
    overflow: "hidden",
    position: "relative",
  },
  chatMessages: {
    alignItems: "stretch",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    // flex: 1,
    gap: "5%",
    marginBottom: "24px",
    overflowY: "auto",
    // padding: "24px",
    paddingBottom: "96px",
  },
  closeButton: {
    background: "#F34D01",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 24px",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    width: "100%",
  },
  confirmButton: {
    background: "#F34D01",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 24px",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  confirmButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    left: 0,
    overflow: "hidden",
    position: "fixed",
    top: 0,
    width: "100vw",
  },
  disclaimer: {
    border: "none",
    boxShadow: "none",
    color: "#666666",
    fontSize: "11px",
    fontStyle: "italic",
    marginTop: "12px",
    textAlign: "center",
    width: "100%",
    // background moved inline
  },
  dropdownIcon: {
    height: "16px",
    marginRight: 0,
    width: "16px",
  },
  dropdownItem: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    fontSize: "15px",
    gap: "10px",
    justifyContent: "flex-start",
    padding: "7px 14px",
    textAlign: "left",
    transition: "background-color 0.2s ease",
    width: "100%",
  },
  dropdownMenu: {
    alignItems: "flex-start",
    background: "#232323",
    borderRadius: "14px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    marginTop: "8px",
    minWidth: "160px",
    padding: "6px 0",
    position: "absolute",
    right: 0,
    textAlign: "left",
    top: "100%",
    transition: "background-color 0.2s ease, border 0.2s ease",
    zIndex: 1000,
  },
  dropdownSeparatorBase: {
    height: "1px",
    margin: "6px 0",
  },
  dropdownToggleRow: {
    alignItems: "center",
    color: "#fff",
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    justifyContent: "flex-start",
    padding: "7px 14px",
    width: "100%",
  },
  footer: {
    alignItems: "center",
    borderTop: "none",
    display: "flex",
    flexShrink: 0,
    flexWrap: "wrap", // allow wrapping on small screens
    height: "auto",
    justifyContent: "space-between",
    minHeight: "48px",
    padding: "8px 32px", // increased vertical padding
  },
  footerLeft: {
    color: "#b0b0b0",
    display: "flex",
    flex: 1,
    fontSize: "13px",
    gap: "24px",
    marginLeft: "-8px",
    minWidth: 0,
    wordBreak: "break-word",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "#1a1a1a",
    cursor: "pointer",
    fontSize: "14px",
  },
  footerRight: {
    alignItems: "center",
    color: "#b0b0b0",
    display: "flex",
    flex: 1,
    fontSize: "13px",
    justifyContent: "flex-end",
    marginRight: "-8px",
    minWidth: 0,
    wordBreak: "break-word",
  },
  header: {
    alignItems: "center",
    borderBottom: "0.5px solid ##F3640B",
    display: "flex",
    flexShrink: 0,
    height: "64px",
    padding: "0 32px",
    justifyContent: "space-between",
  },
  headerButton: {
    background: "none",
    border: "none",
    borderRadius: "4px",
    color: "#1a1a1a",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "4px",
    transition: "background-color 0.2s ease",
  },
  headerLeft: {
    alignItems: "center",
    display: "flex",
  },
  headerRight: {
    alignItems: "center",
    display: "flex",
    gap: "24px",
  },
  infoIcon: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    position: "relative",
  },
  input: {
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "8px",
    flex: 1,
    fontSize: "14px",
    height: "40px",
    lineHeight: "25px",
    outline: "none",
    padding: "0 16px",

    // backgroundColor, borderColor, color moved inline
  },
  inputForm: {
    alignItems: "center",
    display: "flex",
    gap: "12px",
    width: "100%",
    // background moved inline
  },
  inputSection: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    maxWidth: "900px",
    width: "100%",

    // margin: "0 auto",
    // background, boxShadow, border, borderRadius, padding moved inline
  },
  inputWrapper: {
    alignItems: "center",
    background: "transparent",
    border: "none",
    bottom: 0,

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    left: 0,
    padding: "16px 24px",
    pointerEvents: "auto",
    position: "fixed",
    right: 0,
    zIndex: 20,
  },
  logoutButton: {
    alignItems: "center",
    background: "none",
    border: "none",
    color: "#1a1a1a",
    cursor: "pointer",
    display: "flex",
    fontSize: "14px",
    gap: "8px",
  },
  logo: {
    height: "32px",
  },
  logoSection: {
    alignItems: "center",
    display: "flex",
  },
  mainContent: {
    height: "calc(100vh - 112px)",
    overflow: "hidden",
    // padding: "12px 32px",
    position: "relative",
  },
  message: {
    fontSize: "14px",
    lineHeight: "1.5",
    maxWidth: "80%",
    padding: "12px 16px",
    textAlign: "left",
    wordBreak: "break-word",
    boxSizing: "border-box",
  },
  messageAvatar: {
    borderRadius: "50%",
    flexShrink: 0,
    height: "32px",
    marginTop: "10",
    width: "32px",
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "row",
    gap: "16px", // Spread content to edges
    maxWidth: "100%", // Full width of parent
    width: "100%", // Ensure full width
    position: "relative",
    animation: "fadeIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important", // Moved animation
  },
  modeContent: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    flexDirection: "column",
  },
  modeDescription: {
    color: "#666666",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
  },
  modeIcon: {
    alignItems: "center",
    backgroundColor: "#F34D01",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    flexShrink: 0,
    height: "48px",
    justifyContent: "center",
    marginBottom: "12px",
    width: "48px",
  },
  modeOption: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "600px",
    padding: "24px",
    textAlign: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    width: "90%",
    zIndex: 2,
  },
  modeSelectionContainer: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    margin: 0,
    maxWidth: "600px",
    width: "100%",
  },
  modeTitle: {
    color: "#1a1a1a",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  newChatButton: {
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    padding: "8px 16px",
    transition: "background-color 0.2s ease, transform 0.1s ease",
  },
  overlay: {
    alignItems: "center",
    backdropFilter: "blur(4px)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    bottom: 0,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    left: 0,
    overflowY: "auto",
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  popup: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    padding: "32px",
    width: "90%",
    opacity: 0, // Starts invisible
    transform: "scale(0.5)", // Starts scaled down
    animation: "popUpAnimation 0.3s ease-out forwards", // Trigger the animation
  },
  popupSubtitle: {
    color: "#666666",
    fontSize: "16px",
    fontWeight: "400",
    marginBottom: "32px",
    textAlign: "center",
  },
  popupTitle: {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "16px",
    textAlign: "center",
  },
  rightSection: {
    alignItems: "center",
    display: "flex",
    gap: "24px",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#F34D01",
    border: "2px solid #cccccc", // visible light grey outline for all modes
    borderRadius: "50%", // fully round
    boxShadow: "0 2px 8px rgba(243,77,1,0.10)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    fontSize: "20px",
    height: "44px",
    justifyContent: "center",
    outline: "none",
    padding: 0,
    transition:
      "background-color 0.2s, color 0.2s, transform 0.1s, border-color 0.2s",
    width: "44px",
  },
  stepDescriptionImproved: {
    color: "#666666",
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: 1.5,
    margin: 0,
  },
  stepIconImproved: {
    color: "#F34D01",
    flexShrink: 0,
    fontSize: "24px",
    marginTop: "4px",
  },
  stepImproved: {
    alignItems: "flex-start",
    display: "flex",
    gap: "16px",
    textAlign: "left",
  },
  stepTitleImproved: {
    color: "#1a1a1a",
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 4px 0",
  },
  stepsContainerImproved: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
  },
  switchRect: {
    alignItems: "center",
    backgroundColor: "#F34D01", // Orange for "on" state
    borderRadius: "12px", // More rounded
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    height: "12px", // Taller for better touch target
    position: "relative",
    transition: "background-color 0.3s ease, box-shadow 0.2s ease",
    width: "20px", // Wider for better proportions
  },
  switchKnob: {
    backgroundColor: "#fff",
    borderRadius: "50%", // Circular knob
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)", // Subtle shadow for depth
    height: "10px", // Larger knob
    position: "absolute",
    top: "1px",
    left: "2px", // Starting position for "off"
    transition: "left 0.3s ease, transform 0.2s ease", // Smooth slide and slight bounce
    width: "10px",
  },
  switchRectInactive: {
    backgroundColor: "#666", // Gray for "off" state
  },
  themeToggle: {
    backgroundColor: "#f0f0f0",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
    height: "36px",
    width: "36px",
    transition: "background-color 0.2s ease, color 0.2s ease",
  },
  timestamp: {
    color: "#666666",
    fontSize: "12px",
    marginTop: "4px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: 0,
  },
  toggleHandle: {
    backgroundColor: "#fff",
    borderRadius: "50%",
    height: "16px",
    transition: "transform 0.2s",
    width: "16px",
  },
  toggleLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  toggleLabelContainer: {
    alignItems: "center",
    display: "flex",
    gap: "8px",
  },
  toggleSwitch: {
    alignItems: "center",
    backgroundColor: "#ccc",
    borderRadius: "20px",
    cursor: "pointer",
    display: "flex",
    height: "20px",
    padding: "2px",
    transition: "background-color 0.2s",
    width: "40px",
  },
  tooltip: {
    backgroundColor: "#333",
    borderRadius: "6px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    color: "#fff",
    fontSize: "12px",
    left: "50%",
    marginTop: "8px",
    padding: "12px",
    position: "absolute",
    textAlign: "left",
    top: "100%",
    transform: "translateX(-50%)",
    width: "240px",
    zIndex: 1000,
  },
  userAvatar: {
    backgroundColor: "#F34D01",
    // right: "-16px",
  },
  userMessage: {
    borderRadius: "24px 0px 24px 24px",
    alignSelf: "flex-start",
    backgroundColor: "#F34D01",
    boxShadow: "0 4px 12px rgba(243,77,1,0.2)", // Enhanced shadow
    color: "#ffffff",
    marginLeft: "auto",
    marginRight: "0",
    textAlign: "left",
  },
  userTimestamp: {
    textAlign: "right",
  },
  villyText: {
    color: "#F34D01",
  },
  welcomeSection: {
    alignItems: "center",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: "48px",
    fontWeight: "500",
    margin: 0,
    margin: "16px 0",
    marginBottom: "32px",
    whiteSpace: "wrap",
  },
};

// Add global CSS for hiding textarea scrollbar and styling chatMessages scrollbar
if (!document.getElementById("chat-input-no-scrollbar-style")) {
  const style = document.createElement("style");
  style.id = "chat-input-no-scrollbar-style";
  style.textContent = `
    /* Hide Scrollbars for Textarea and General Elements */
    .chat-input-no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari, and Opera */
    }

    /* Custom Scrollbar for Chat Messages */
    .chatMessages::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }
    .chatMessages::-webkit-scrollbar-thumb {
      background: #ffffff;
      border-radius: 4px;
    }
    .chatMessages::-webkit-scrollbar-thumb:hover {
      background: #e04000;
    }
    .chatMessages::-webkit-scrollbar-button {
      display: none;
    }
    .chatMessages::-webkit-scrollbar-corner {
      display: none;
    }
    .chatMessages {
      scrollbar-width: thin;
      scrollbar-color: rgba(243, 77, 1, 0) transparent;
    }

    /* Mobile Header Visibility */
    .mobile-to-header {
      display: none !important;
    }

    /* New rule for input wrapper glow */
    .inputSection:has(textarea:focus) {
      box-shadow: 0 0 4px 1px rgba(255, 150, 5, 1) !important;
      border-color: #F34D01 !important;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
      animation: bounceFocus 0.3s ease;
      } 

      @keyframes bounceFocus {
        0%   { transform: scale(1); }
        50%  { transform: scale(1.01); }
        100% { transform: scale(1); }
      }

    /* Style inputSection when AI is typing */
    .inputSection.is-typing {
      opacity: 0.8; /* Subtle dim to indicate submission is blocked */
      transition: opacity 0.2s ease;
    }
      /* Spinner Animation for Disabled Button */
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    /* Animations */
    /* Pop-up Animation for General Popups */
    @keyframes popUpAnimation {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
      }
      50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    /* Fade-in Animation for Messages */
    @keyframes fadeIn {
      0% {
        opacity: 1; /* No fade, fully opaque from start */
        transform: scale(0.6); /* Start smaller for strong bounce */
      }
      40% {
        transform: scale(1.3); /* Overshoot for pronounced bounce */
      }
      60% {
        transform: scale(0.85); /* Pull back for second bounce */
      }
      80% {
        transform: scale(1.1); /* Smaller third bounce */
      }
      100% {
        opacity: 1;
        transform: scale(1); /* Final position */
      }
    }

    /* Pop-up Animation for How It Works (Default for Larger Screens) */
    @keyframes popUpAnimationHIW {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Mobile Styles (max-width: 431px) */
    @media (max-width: 431px) {
      .welcome-title {
        font-size: 1.5rem !important;
        margin-bottom: 2rem !important;
        padding: 1rem 1rem 0rem 1rem !important;
      }
      .mode-option-hover {
        gap: 0px !important;
        padding: 12px !important;
      }
      .main-content {
        padding: 12px 16px !important;
      }
      .message-wrapper {
        gap: 5px !important;
      }
      .footer-left {
        flex-direction: column !important;
      }
      .header-to-mobile {
        display: none !important;
      }
      .mobile-to-header {
        display: inline-flex !important;
      }
      .right-section {
        gap: 12px !important;
      }
      /* Override popUpAnimationHIW for Fade-Only on Mobile */
      @keyframes popUpAnimationHIW {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      .chatMessages {
        min-width: 100% !important;
      }
    }

    /* Tablet Styles (min-width: 432px and max-width: 785px) */
    @media (min-width: 432px) and (max-width: 785px) {
      .welcome-title {
        font-size: 2rem !important;
        margin-bottom: 2rem !important;
        padding: 1rem 1rem 0rem 1rem !important;
      }
      .mode-option-hover {
        gap: 0px !important;
        padding: 12px !important;
      }
      .main-content {
        padding: 12px 16px !important;
      }
    }

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

    
  `;
  document.head.appendChild(style);
}

export default Chat;
