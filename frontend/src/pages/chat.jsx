import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logoIconOrange from "../assets/images/logoiconorange.png";
import axios from "axios";
import { FaUser, FaCog, FaQuestionCircle, FaSignOutAlt, FaKeyboard, FaRobot, FaCheckCircle, FaClipboardList } from "react-icons/fa";
import villyAvatar from "../assets/images/villypfporange.jpg";

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

// Function to fetch response from GPT-3.5 Turbo API
const fetchGPTResponse = async (userMessage) => {
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const GPT_API_URL = "https://api.openai.com/v1/chat/completions";

  // Define system prompt
  const systemPrompt = `You are Villy, Civilify's AI-powered legal assistant.

You are a separate digital entity operating under Civilify.  
You are not Civilify itself — you are Villy, a bot created by Civilify to assist users with assessing legal concerns.

If the user asks about your identity, always respond exactly with:

> "I am Villy, Civilify's AI-powered legal assistant. I aim to provide credible, thoughtful insights to help you understand your legal situation by offering general analysis, plausibility scores, and suggested next steps."

---

Civilify Information:

- Civilify is an online platform that helps users assess their legal concerns using AI-powered insights.
- Civilify is not a law firm and does not provide legal representation, binding legal advice, or connections to lawyers.
- Civilify's AI assistant, Villy, interacts conversationally with users to help them:
  - Understand their legal situation
  - Receive a plausibility score regarding their potential case
  - Get suggested next steps for handling their issue responsibly
- Civilify emphasizes user privacy and transparency:
  - No conversation data is stored unless a registered user opts in.
  - Authentication is handled via OAuth.
  - Backend services like Firebase and TLS 1.2+ encryption are used to protect user data.
- Civilify's mission is to make early legal understanding accessible, respectful, and affordable.
- Brand primary color is orange (#F34D01).

If unsure about a detail not covered, respond politely that further information will be available soon on Civilify's website.

---

Follow this strict process during every session:

---

## Mode Selection Behavior

- At the beginning of every new session or conversation, if no mode has been set by the frontend, you must ask the user to choose how they would like to proceed.

Prompt the user like this:
> "To assist you best, could you please let me know how you'd like to proceed?"  
> - Type **A** for **General Legal Information** (Quick answers to your law-related questions)  
> - Type **B** for **Case Plausibility Assessment** (Help to understand if your situation could lead to a valid legal case)

Behavior After Selection:

- If the user selects **A (General Legal Information Mode)**:
    - Stay in **Light Mode**.
    - Respond casually, lightly, and informatively.
    - Do NOT automatically build structured case reports unless explicitly asked.

- If the user selects **B (Case Plausibility Mode)**:
    - Activate **Clarity Mode**.
    - Engage the user thoughtfully.
    - Gather facts about the situation.
    - After 2–4 meaningful exchanges, **proactively generate a full structured case report** without needing to be asked.

If the user responds with something unclear, politely re-ask the mode selection once.

If the frontend eventually passes a mode automatically, respect the passed mode and skip asking.

Summary:
- **Light Inquiry Mode** ➔ Casual answers only.
- **Case Plausibility Mode** ➔ Full analysis, report generation, structured closure.

---

## Mode Mismatch Detection and Switching

- After every user message, assess if their input matches the currently selected mode.

Mismatch Behavior:
- If user selected **General Legal Information Mode** but now shares a **personal legal situation** (real-world harm, dispute, or legal concern):
    - Politely acknowledge the mismatch.
    - Offer to switch to **Case Plausibility Assessment Mode**.

Sample phrasing:
> "It sounds like you're describing a personal situation involving a legal issue.  
> Would you like me to switch to Case Plausibility Assessment Mode so I can help you assess your situation properly?"

- If user selected **Case Plausibility Mode** but only asks simple legal fact questions:
    - Lightly answer the question.
    - Then politely offer to switch to **General Legal Information Mode** if they prefer.

Sample phrasing:
> "If you prefer quick legal information without a full case assessment, I can switch to General Legal Information Mode. Would you like me to do that?"

**Important:**  
- If the user's input already fits the currently active mode, politely confirm:
> "Thank you for sharing that. I'll continue assisting you under [current mode]."

- Only offer switching if truly necessary.
- Always respect the user's decision.

---

## 1. Smart User Intent Handling

- If the user asks for legal definitions, facts, procedures, or general explanations:
    - Respond lightly and conversationally.
    - Do NOT initiate full case analysis unless switched.
    - Keep answers friendly, brief, and helpful.

- If the user shares a **personal situation**, **conflict**, **harm**, **dispute**, or **real-world legal problem**:
    - Assume they are seeking case clarity.
    - Engage to gather facts thoughtfully.
    - Plan to generate a structured case report once enough information is gathered.

---

## 2. Initial User Input Handling

- If the user greets you or says "Hi", "I need help", "Can I ask something?", etc.:
    - Gently invite them to describe their situation:
      > "Of course! Could you briefly describe the situation you're facing?"

---

## 3. Knowledge Sufficiency Evaluation
- As the user shares facts, gather information about:
    - Who are the involved parties?
    - What happened?
    - Is there evidence of harm, violation, or dispute?
    - (Optional) Is the jurisdiction specified?

---

## 4. Outcome Inference
- Infer the user's goal from context (e.g., seeking compensation, avoiding liability, filing a report, defending).
- Only explicitly ask about the desired outcome if it remains unclear.

---

## 5. Clarification and Conversation Depth

- Ask **one thoughtful question at a time**.
- Avoid bullet points or asking multiple questions at once.
- Never re-ask information already provided.

Maximum Clarification Attempts:
- After three failed clarification attempts (if unclear or vague), politely recommend consulting a licensed attorney.

---

## 6. Proactive Report Triggering

General Trigger:
- After 2 to 4 meaningful exchanges about the user's situation:
    - Assume enough information has been gathered.
    - Smoothly transition into delivering a full structured case report.

Immediate Trigger:
- If the user asks for **help**, **guidance**, **advice**, **options**, **next steps**, or similar:
    - Immediately generate the full structured report without further waiting.

Transition Example:
> "Thank you for sharing all of that information. Based on what you've shared, here's a summary of your situation and next steps you might consider:"

---

## 7. Sensitive or Serious Cases

- If the user shares a sensitive, emotionally difficult, or criminal situation:
    - Remain calm, professional, and empathetic.
    - Proceed to generate a full structured case report as usual.
    - Never refuse to generate a report unless legally prohibited.
    - In Suggested Next Steps, respectfully recommend seeking immediate advice from a licensed legal professional if serious criminal implications are involved.

---

## 8. Structured Case Report Generation

When generating the full case report, include:

---

### a. Villy's Analysis
- Begin with:
  > "Based on the information you've shared..."
- Summarize the user's situation factually and thoughtfully.
- Highlight important legal issues, risks, and defenses.
- Keep writing clean, clear, and paragraph-based.

---

### b. Sources
- Link 1–2 reputable public legal resources if available:
    - (e.g., Cornell LII, government legal sites)
- If no source link is available, cite the legal concept and note "(no official link available)".

Example:
> Sources:  
> - Breach of Contract – https://www.law.cornell.edu/wex/breach_of_contract  
> - Duty of Care – (no official link available)

---

### c. Plausibility Score

Estimate how likely the user's situation could lead to a successful legal outcome:

| Score Range | Rating |
|:------------|:--------|
| 80–100%     | Highly Likely |
| 60–79%      | Moderately Likely |
| 40–59%      | Uncertain / Moderately Unlikely |
| 20–39%      | Unlikely |
| 0–19%       | Highly Unlikely |

Example:
> Plausibility Score: 65% (Moderately Likely)

---

### d. Suggested Next Steps

Recommend practical next actions depending on context:
- Cooperate with authorities if involved
- Gather supporting evidence
- Consult with a licensed attorney
- Prepare defense or documentation

For criminal issues, strongly recommend seeking legal counsel immediately.

---

## 9. Handling Non-Serious Input

- Politely redirect once if user input becomes unserious.
- Respectfully end the session if unserious behavior continues.

---

## 10. Internal Error Fallback

- If unable to assist clearly, recommend consulting a licensed legal professional.

---

## 11. Session Flow Management

- After delivering the report:
    - Offer to assist with another concern.
    - Or politely conclude if the user seems satisfied.

---

## 12. Tone and Behavior

- Maintain a calm, friendly, professional tone at all times.
- Use plain English unless technical legal terms are necessary.
- Never fake knowledge or promise guaranteed legal outcomes.
- Civilify's mission is to provide **clarity without judgment**.
`;

  try {
    const response = await axios.post(
      GPT_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
      }
    );

    console.log("GPT API Response:", response.data);

    const generatedText = response.data.choices[0]?.message?.content || "No response generated.";

    console.log("Generated Text:", generatedText);

    return {
      success: true,
      response: generatedText,
    };
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    return {
      success: false,
      response: "Sorry, I couldn't process your request. Please try again.",
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
  return genericSuggestions[Math.floor(Math.random() * genericSuggestions.length)];
};

// Rules-based mode fit detection
const fitsCPAMode = (text) => {
  // Looks for legal situation keywords
  const situationKeywords = [
    /accident/i, /injured/i, /harassed/i, /fired/i, /arrested/i, /stolen/i, /scammed/i, /sued/i, /charged/i, /court/i, /police/i, /conflict/i, /dispute/i, /harm/i, /damage/i, /threat/i, /violence/i, /abuse/i, /case/i, /complaint/i, /report/i, /violation/i, /crime/i, /legal issue/i, /problem/i, /trouble/i
  ];
  return situationKeywords.some((pat) => pat.test(text));
};

const fitsGeneralInfoMode = (text) => {
  // Looks for fact/legal question patterns
  return /^(what|how|can|is|are|does|do|when|where|who|why)\b/i.test(text.trim());
};

// Utility to filter out system echo and mode switch prompts from AI responses
const filterSystemEchoAndModeSwitch = (text, mode) => {
  if (!text) return text;
  // Remove system echo
  text = text.replace(/I'll continue assisting you under Case Plausibility Assessment mode\.?/gi, '')
             .replace(/I'll continue assisting you under General Legal Information mode\.?/gi, '')
             .replace(/I will continue assisting you under Case Plausibility Assessment mode\.?/gi, '')
             .replace(/I will continue assisting you under General Legal Information mode\.?/gi, '')
             .replace(/Thank you for sharing that\.?/gi, '')
             .replace(/^\s+/gm, '');
  // Remove mode switch prompts
  if (mode === 'B') {
    text = text.replace(/would you like to switch to case plausibility assessment mode[^?.!]*[?.!]/i, '').replace(/switch to assessment mode[^?.!]*[?.!]/i, '').trim();
  }
  if (mode === 'A') {
    text = text.replace(/would you like to switch to general legal information mode[^?.!]*[?.!]/i, '').replace(/switch to general information mode[^?.!]*[?.!]/i, '').trim();
  }
  return text.trim();
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const chatContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);

  const suggestedQuestions = [
    "I have a land dispute",
    "Can I break an NDA?",
    "Workplace harassment",
    "In trouble with the police",
  ];

  const handleToggleSuggestions = () => {
    setSuggestedRepliesEnabled(!suggestedRepliesEnabled);
  };

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    const aiMessage = {
      text:
        mode === 'A'
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
    let prependSystem = '';
    if (selectedMode === 'B' && fitsCPAMode(userMessage)) {
      prependSystem = "The user's input fits the current mode (Case Plausibility Assessment). Please confirm and continue. Do not offer a mode switch. Do not repeat this system message in your reply.";
    } else if (selectedMode === 'A' && fitsGeneralInfoMode(userMessage)) {
      prependSystem = "The user's input fits the current mode (General Legal Information). Please confirm and continue. Do not offer a mode switch. Do not repeat this system message in your reply.";
    }
    let aiResponse;
    if (prependSystem) {
      aiResponse = await fetchGPTResponse(`${prependSystem}\n\n${userMessage}`);
    } else {
      aiResponse = await fetchGPTResponse(userMessage);
    }
    // Filter out system echo and mode switch prompts if already in correct mode
    return {
      ...aiResponse,
      response: filterSystemEchoAndModeSwitch(aiResponse.response, selectedMode)
    };
  };

  // Update handleSubmit and handleSuggestedReply to use fetchGPTWithModeFit
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

      const aiResponse = await fetchGPTWithModeFit(question);
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

    const aiResponse = await fetchGPTWithModeFit(reply);
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

  const handleNewChatConfirm = (confirm) => {
    if (confirm) {
      setMessages([]);
      setQuestion("");
      setShowTimestamp(null);
    }
    setShowNewChatConfirm(false);
  };

  const handleLogoutConfirm = (confirm) => {
    if (confirm) {
      navigate("/signin");
    }
    setShowLogoutConfirm(false);
  };

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Update GPT prompt for suggested replies to explicitly require only user messages
  useEffect(() => {
    if (
      selectedMode === 'B' &&
      suggestedRepliesEnabled &&
      messages.length > 0 &&
      // Only show suggestions if last message is from AI (user's turn)
      !messages[messages.length - 1].isUser
    ) {
      // Find the last user message for context
      const lastUserMsg = messages.filter(m => m.isUser).slice(-1)[0]?.text || '';
      if (isVague(lastUserMsg)) {
        setDynamicSuggestions(getRandomGenericSuggestions());
      } else {
        // Call GPT to generate 4 contextually relevant suggestions
        (async () => {
          try {
            const prompt = `Given the following conversation, generate 4 short, concise user follow-up messages (not AI responses, not questions for the AI to ask the user), each 3–7 words, that a user might want to send next in this conversation. Output only a JSON array of strings.` +
              `\n\nConversation so far:\n${messages.map(m => (m.isUser ? 'User: ' : 'AI: ') + m.text).join('\n')}\n\nSuggestions:`;
            const response = await axios.post(
              "https://api.openai.com/v1/chat/completions",
              {
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a helpful legal assistant for generating short, concise user follow-up messages (not AI responses, not questions for the AI to ask the user). Only output plausible user messages." },
                  { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                },
              }
            );
            // Try to parse the JSON array from the response
            const text = response.data.choices[0]?.message?.content || '';
            let suggestions = [];
            try {
              suggestions = JSON.parse(text);
            } catch {
              // fallback: try to extract array from text
              const match = text.match(/\[(.*?)\]/s);
              if (match) {
                suggestions = JSON.parse('[' + match[1] + ']');
              }
            }
            // Filter out mode switch/process suggestions and AI-like statements/questions
            const filtered = (Array.isArray(suggestions) ? suggestions : []).filter(s =>
              !/switch to|assessment mode|process|procedure|how long|how do i start|how to begin|how to proceed|can you switch|i can|let me|i will|i'm here|i'll|allow me|i understand|i suggest|i recommend|please/i.test(s)
            );
            if (filtered.length > 0) {
              setDynamicSuggestions(filtered.slice(0, 4));
            } else {
              setDynamicSuggestions(getRandomGenericSuggestions());
            }
          } catch {
            setDynamicSuggestions(getRandomGenericSuggestions());
          }
        })();
      }
    } else {
      setDynamicSuggestions([]);
    }
  }, [messages, selectedMode, suggestedRepliesEnabled]);

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

    const modeHoverStyle = document.createElement('style');
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

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

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
          >
          </button>
          {selectedMode === 'B' && (
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
          )}
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
                backgroundColor: isDarkMode ? '#232323' : '#f8f8f8',
              }}>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#fff' : '#232323',
                  }}
                  className="dropdown-item-hover"
                >
                  <FaUser style={styles.dropdownIcon} />
                  <span style={{ fontSize: '15px' }}>My Profile</span>
                </button>
                {/* Dark Mode Toggle */}
                <div style={{
                  ...styles.dropdownToggleRow,
                  color: isDarkMode ? '#fff' : '#232323',
                  cursor: 'default',
                }}>
                  <div
                    style={{
                      ...styles.switchRect,
                      ...(isDarkMode ? {} : styles.switchRectInactive),
                    }}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    <div
                      style={{
                        ...styles.switchKnob,
                        left: isDarkMode ? '10px' : '2px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Dark Mode</span>
                </div>
                 <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#fff' : '#232323',
                  }}
                  className="dropdown-item-hover"
                >
                  <FaCog style={styles.dropdownIcon} />
                  <span style={{ fontSize: '15px' }}>Settings</span>
                </button>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#fff' : '#232323',
                  }}
                  className="dropdown-item-hover"
                >
                  <FaQuestionCircle style={styles.dropdownIcon} />
                  <span style={{ fontSize: '15px' }}>Support</span>
                </button>
                <div style={{...styles.dropdownSeparatorBase, backgroundColor: isDarkMode ? '#444' : 'rgba(0, 0, 0, 0.12)', margin: '6px 0'}}></div>
                <button
                  style={{
                    ...styles.dropdownItem,
                    color: isDarkMode ? '#fff' : '#232323',
                  }}
                  onClick={handleLogout}
                  className="dropdown-item-hover"
                >
                  <FaSignOutAlt style={styles.dropdownIcon} />
                  <span style={{ fontSize: '15px' }}>Logout</span>
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
          border: isDarkMode ? '1.5px solid #444' : '1.5px solid #bdbdbd'
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
                <div style={styles.modeSelectionContainer}>
                  <div 
                    style={{
                      ...styles.modeOption,
                      backgroundColor: isDarkMode ? '#333' : '#ffffff',
                      color: isDarkMode ? '#fff' : '#1a1a1a',
                      border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
                    }}
                    onClick={() => handleModeSelection('A')}
                    className="mode-option-hover"
                  >
                    <div style={styles.modeIcon}>
                      <FaQuestionCircle size={24} />
                    </div>
                    <div style={styles.modeContent}>
                      <h3 style={{
                        ...styles.modeTitle,
                        color: isDarkMode ? '#fff' : styles.modeTitle.color
                      }}>
                        General Legal Information
                      </h3>
                      <p style={{
                        ...styles.modeDescription,
                        color: isDarkMode ? '#bbbbbb' : styles.modeDescription.color
                      }}>
                        Ask general questions about laws, procedures, and legal concepts.
                      </p>
                    </div>
                  </div>
                  <div 
                    style={{
                      ...styles.modeOption,
                      backgroundColor: isDarkMode ? '#333' : '#ffffff',
                      color: isDarkMode ? '#fff' : '#1a1a1a',
                      border: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
                    }}
                    onClick={() => handleModeSelection('B')}
                    className="mode-option-hover"
                  >
                    <div style={styles.modeIcon}>
                      <FaClipboardList size={24} />
                    </div>
                    <div style={styles.modeContent}>
                      <h3 style={{
                        ...styles.modeTitle,
                        color: isDarkMode ? '#fff' : styles.modeTitle.color
                      }}>
                        Case Plausibility Assessment
                      </h3>
                      <p style={{
                        ...styles.modeDescription,
                        color: isDarkMode ? '#bbbbbb' : styles.modeDescription.color
                      }}>
                        Get a detailed analysis of your specific legal situation.
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
                    flexDirection: message.isUser ? 'row-reverse' : 'row',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.isUser ? (
                  <div style={{
                    ...styles.messageAvatar,
                      ...styles.userAvatar,
                    }} />
                  ) : (
                    <img
                      src={villyAvatar}
                      alt="Villy Avatar"
                      style={{
                        ...styles.messageAvatar,
                          ...styles.aiAvatar,
                          backgroundColor: isDarkMode ? "#363636" : "#ffffff",
                          border: `1px solid ${isDarkMode ? "#555" : "#e0e0e0"}`,
                        objectFit: 'cover',
                      }}
                    />
                  )}
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

          {selectedMode && (
          <div style={{
            ...styles.inputWrapper,
            backgroundColor: isDarkMode ? '#2d2d2d' : '#F6F6F8'
          }}>
              {selectedMode === 'B' && suggestedRepliesEnabled && messages.length > 0 && !messages[messages.length - 1].isUser && dynamicSuggestions.length > 0 && (
              <div style={styles.suggestedReplies}>
                <div style={styles.suggestedButtonsContainer}>
                    {dynamicSuggestions.map((question, index) => (
                    <button
                      key={index}
                        style={{
                          ...styles.suggestedButton,
                          background: isDarkMode ? '#333' : '#ffffff',
                          color: isDarkMode ? '#fff' : '#333',
                          border: isDarkMode ? '1px solid #444' : '1px solid #ccc',
                        }}
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
          )}
        </div>
      </main>

      {/* Popup Overlays */}
      {showLogoutConfirm ? (
        <div style={styles.overlay}>
          <div
            style={{
              ...styles.popup,
              maxWidth: "400px",
              backgroundColor: isDarkMode ? "#232323" : styles.popup.backgroundColor,
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
                style={styles.confirmButton}
                onClick={() => handleLogoutConfirm(true)}
                className="primary-button-hover"
              >
                Yes, Logout
              </button>
              <button
                style={{
                  ...styles.cancelButton,
                  background: isDarkMode ? "#444" : styles.cancelButton.background,
                  color: isDarkMode ? "#fff" : styles.cancelButton.color,
                  border: isDarkMode ? "1px solid #bbb" : styles.cancelButton.border,
                }}
                onClick={() => handleLogoutConfirm(false)}
                className="secondary-button-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : showNewChatConfirm ? (
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
      ) : showHowItWorks ? (
        <div style={styles.overlay}>
          <div style={{
            backgroundColor: isDarkMode ? '#232323' : '#fff',
            color: isDarkMode ? '#fff' : '#1a1a1a',
            borderRadius: '18px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            maxWidth: 420,
            width: '92vw',
            padding: '28px 32px 24px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{ marginBottom: 40, width: '100%' }}>
              <h2 style={{ color: isDarkMode ? '#fff' : '#1a1a1a', marginBottom: 24, fontSize: 28, fontWeight: 700 }}>How Civilify Works</h2>
              <ol style={{ paddingLeft: 0, margin: 0, listStyle: 'none', width: '100%' }}>
                <li style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontSize: 18 }}>1. Choose a mode</span><br />
                  <span style={{ fontSize: 15, color: isDarkMode ? '#bbbbbb' : '#666666' }}>Pick between quick legal info or full case assessment.</span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontSize: 18 }}>2. Chat naturally</span><br />
                  <span style={{ fontSize: 15, color: isDarkMode ? '#bbbbbb' : '#666666' }}>Tell Villy your situation or question in simple words. No legal jargon needed.</span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontSize: 18 }}>3. Smart help</span><br />
                  <span style={{ fontSize: 15, color: isDarkMode ? '#bbbbbb' : '#666666' }}>If needed, Civilify will offer to switch modes to better assist you.</span>
                </li>
                <li style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontSize: 18 }}>4. Get your answer</span><br />
                  <span style={{ fontSize: 15, color: isDarkMode ? '#bbbbbb' : '#666666' }}>If you're sharing a real situation, Civilify will build a personalized case report with analysis, sources, a plausibility score, and next steps.</span>
                </li>
                <li style={{ marginBottom: 0 }}>
                  <span style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a1a1a', fontSize: 18 }}>5. Stay in control</span><br />
                  <span style={{ fontSize: 15, color: isDarkMode ? '#bbbbbb' : '#666666' }}>You decide if you want deeper help or just a quick answer. Your privacy and understanding come first.</span>
                </li>
              </ol>
            </div>
            <button
              style={{
                background: '#F34D01',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: 32,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'background-color 0.2s ease, transform 0.1s ease',
              }}
              onClick={() => setShowHowItWorks(false)}
              className="primary-button-hover"
            >
              I understand now
            </button>
          </div>
        </div>
      ) : null}

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
    border: '1.5px solid #bdbdbd',
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "64px",
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  welcomeTitle: {
    fontSize: "48px",
    fontWeight: "500",
    margin: 0,
    whiteSpace: "nowrap",
    marginBottom: '32px',
  },
  villyText: {
    color: "#F34D01",
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
    position: "relative",
    justifyContent: 'flex-start',
    gap: '16px',
  },
  messageAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: '0',
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
    marginRight: "0",
    textAlign: "right",
    alignSelf: 'flex-start',
    minWidth: '120px',
  },
  aiMessage: {
    borderBottomLeftRadius: "4px",
    marginRight: "auto",
    marginLeft: "0",
    textAlign: "left",
    alignSelf: 'flex-start',
    minWidth: '120px',
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
    borderRadius: '14px',
    padding: '6px 0',
    minWidth: '160px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'background-color 0.2s ease, border 0.2s ease',
    background: '#232323',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    gap: '0',
  },
  dropdownItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '7px 14px',
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    backgroundColor: 'transparent',
    textAlign: 'left',
    gap: '10px',
    transition: 'background-color 0.2s ease',
  },
  dropdownToggleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    padding: '7px 14px',
    gap: '10px',
    color: '#fff',
  },
  switchRect: {
    width: '20px',
    height: '14px',
    backgroundColor: '#F34D01',
    borderRadius: '4px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  switchRectInactive: {
    backgroundColor: '#444',
  },
  switchKnob: {
    position: 'absolute',
    top: '3px',
    left: '2px',
    width: '8px',
    height: '8px',
    backgroundColor: '#fff',
    borderRadius: '2px',
    transition: 'left 0.2s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  dropdownIcon: {
    width: '16px',
    height: '16px',
    marginRight: 0,
  },
  dropdownSeparatorBase: {
    height: '1px',
    margin: '6px 0',
  },
  modeSelectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '600px',
    alignItems: 'center',
    margin: 0,
  },
  modeOption: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '600px',
    boxSizing: 'border-box',
  },
  modeIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#F34D01',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: '12px',
  },
  modeContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  modeDescription: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
    lineHeight: 1.5,
  },
};

export default Chat;
