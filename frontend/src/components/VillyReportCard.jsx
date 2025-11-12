import React from "react";

// Helper to clean markdown bold markers from text (but preserve them for step labels)
function cleanMarkdownBold(text) {
  if (!text) return "";
  // Remove ** markers but preserve content
  return text.replace(/\*\*/g, "").trim();
}

// Helper to parse step labels that may have **bold** markers
function parseStepLabel(stepText) {
  // Match pattern like "1. **Label:** description" or "1. Label: description"
  const labelMatch = stepText.match(/^\d+\.\s*\*\*(.*?)\*\*:\s*(.*)$/);
  if (labelMatch) {
    return { label: labelMatch[1], description: labelMatch[2] };
  }
  // Match pattern without bold: "1. Label: description"
  const plainMatch = stepText.match(/^\d+\.\s*(.*?):\s*(.*)$/);
  if (plainMatch) {
    return { label: plainMatch[1], description: plainMatch[2] };
  }
  // Fallback: return as-is
  return { label: "", description: cleanMarkdownBold(stepText) };
}

// Helper to parse the report text into sections
function parseReport(reportText) {
  const sections = {
    summary: "",
    issues: [],
    score: "",
    scoreLabel: "",
    scoreExplanation: "",
    steps: [],
    disclaimer: "",
    sources: [],
  };
  if (!reportText) return sections;

  // Extract Case Summary - clean markdown bold markers
  const summaryMatch = reportText.match(
    /Case Summary:\s*([\s\S]*?)(?:\n\n|Legal Issues|Plausibility Score:|Suggested Next Steps:|Sources:|DISCLAIMER:)/i
  );
  if (summaryMatch) sections.summary = cleanMarkdownBold(summaryMatch[1]);

  // Extract Legal Issues or Concerns - clean markdown bold markers
  const issuesMatch = reportText.match(
    /Legal Issues(?: or Concerns)?:\s*([\s\S]*?)(?:\n\n|Plausibility Score:|Suggested Next Steps:|Sources:|DISCLAIMER:)/i
  );
  if (issuesMatch) {
    sections.issues = issuesMatch[1]
      .split(/\n- /)
      .map((s) => cleanMarkdownBold(s.replace(/^[-\s]*/, "")))
      .filter(Boolean);
  }

  // Extract Plausibility Score - clean markdown bold markers
  const scoreMatch = reportText.match(
    /Plausibility Score:\s*(\d{1,3})%\s*-?\s*([\w\s]+)?-?\s*([\s\S]*?)(?:\n\n|Suggested Next Steps:|Sources:|DISCLAIMER:|$)/i
  );
  if (scoreMatch) {
    sections.score = scoreMatch[1];
    sections.scoreLabel = scoreMatch[2] ? cleanMarkdownBold(scoreMatch[2]) : "";
    sections.scoreExplanation = scoreMatch[3] ? cleanMarkdownBold(scoreMatch[3]) : "";
  } else {
    const scoreLine = reportText
      .split("\n")
      .find((l) => l.toLowerCase().includes("plausibility score"));
    if (scoreLine) sections.scoreExplanation = cleanMarkdownBold(scoreLine);
  }

  // Extract Suggested Next Steps - parse numbered list with bold labels
  const stepsMatch = reportText.match(
    /Suggested Next Steps:\s*([\s\S]*?)(?:\n\n|Sources:|DISCLAIMER:|This is a legal pre-assessment|$)/i
  );
  if (stepsMatch) {
    // Split by numbered lines (1., 2., 3., etc.)
    const stepsText = stepsMatch[1];
    // Split by lines starting with a number followed by a dot and space
    const stepLines = stepsText.split(/\n(?=\d+\.\s)/);
    sections.steps = stepLines
      .map((s) => s.trim().replace(/\n+/g, " ")) // Replace newlines with spaces
      .filter(Boolean)
      .map((step) => {
        const parsed = parseStepLabel(step);
        return parsed; // Return object with label and description
      });
  }

  // Extract Sources
  const sourcesMatch = reportText.match(
    /Sources:\s*([\s\S]*?)(?:\n\n|This is a legal pre-assessment|$)/i
  );
  if (sourcesMatch) {
    sections.sources = sourcesMatch[1]
      .split(/\n- /)
      .map((s) => s.replace(/^[-\s]*/, "").trim())
      .filter(Boolean);
  }

  // Extract disclaimer - clean markdown bold markers
  const disclaimerMatch = reportText.match(
    /DISCLAIMER:\s*([\s\S]*?)(?:\n\n|$)|(This is a legal pre-assessment[\s\S]*?)(?:\n\n|$)/i
  );
  if (disclaimerMatch) {
    sections.disclaimer = cleanMarkdownBold(disclaimerMatch[1] || disclaimerMatch[2] || "");
  }

  return sections;
}

// Helper to extract label and description from scoreLabel
function extractLabelAndDescription(scoreLabel) {
  if (!scoreLabel) return { label: "", description: "" };
  // Match 'Highly Likely', 'Highly Unlikely', 'Likely', 'Unlikely', 'Moderate', 'Possible', etc.
  const match = scoreLabel.match(
    /^(Highly Likely|Highly Unlikely|Likely|Unlikely|Moderate|Possible|Improbable|Rare|Low|High|Certain|Uncertain|Unknown|\w+)/i
  );
  if (match) {
    const label = match[0];
    let description = scoreLabel.slice(label.length).trim();
    // Only keep the description if it is a short summary (not a next step or bullet)
    if (description.startsWith("-") || description.startsWith("•")) {
      description = "";
    }
    // If description contains multiple sentences, keep only the first sentence
    if (description.includes(".")) {
      description = description.split(".").shift().trim() + ".";
    }
    return { label, description };
  }
  return { label: scoreLabel, description: "" };
}

// ProgressCircle component
function ProgressCircle({
  percent,
  size = 64,
  stroke = 7,
  color = "#F34D01",
  bg = "#ffe5d6",
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bg}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        fontSize={size * 0.32}
        fontWeight="bold"
        fill={color}
      >
        {percent}%
      </text>
    </svg>
  );
}

const getScoreColor = (label) => {
  if (!label) return "#F34D01";
  const l = label.toLowerCase();
  if (
    l.includes("highly likely") ||
    l.includes("likely") ||
    l.includes("possible")
  )
    return "#16a34a"; // green
  if (l.includes("moderate")) return "#F59E42"; // orange
  if (l.includes("unlikely")) return "#dc2626"; // red
  return "#F34D01"; // default orange
};

const VillyReportCard = ({
  reportText,
  isDarkMode = false,
  plausibilityLabel,
  plausibilitySummary,
  sources = [], // KB sources from API response
}) => {
  const sections = parseReport(reportText);
  
  // If sources are provided as prop (from API), use them; otherwise use parsed sources
  const displaySources = sources.length > 0 ? sources : sections.sources;
  const hasContent =
    sections.summary ||
    sections.issues.length ||
    sections.score ||
    sections.steps.length;
  const scoreNum = parseInt(sections.score, 10) || 0;
  const headerColor = isDarkMode ? "#fff" : "#2c2c2c";
  const bodyColor = isDarkMode ? "#e0e0e0" : "#3a3a3a";
  // Use backend-provided label/summary if available, else extract from reportText
  let label = plausibilityLabel;
  let description = plausibilitySummary;
  if (!label && !description) {
    const extracted = extractLabelAndDescription(sections.scoreLabel);
    label = extracted.label;
    description = extracted.description;
  }
  const scoreLabelColor = getScoreColor(label);
  const scoreTextColor = getScoreColor(label);
  
  // Enhanced plausibility background with gradient based on score
  const getScoreBgColor = () => {
    if (isDarkMode) return "#3a2f29";
    if (scoreNum >= 65) return "linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0.15) 100%)";
    if (scoreNum >= 40) return "linear-gradient(135deg, rgba(245,158,66,0.08) 0%, rgba(245,158,66,0.15) 100%)";
    return "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.15) 100%)";
  };
  const plausibilityBg = getScoreBgColor();
  return (
    <div
      style={{
        background: "none",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(243,77,1,0.07)",
        // padding: "16px 16px 12px 16px",
        margin: "12px 0",
        // maxWidth: "700px",
        // minWidth: "320px",
        width: "100%",
        color: bodyColor,
        fontSize: 15,
        lineHeight: 1.65,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
        alignSelf: "flex-start",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Villy's Report Title */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 20,
          color: "#F34D01",
          letterSpacing: 0.1,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Villy's Report
      </div>
      {/* Plausibility Score Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 850,
          minWidth: 120,
          margin: "0 auto 24px auto",
          background: plausibilityBg,
          borderRadius: 18,
          padding: "28px 20px 24px 20px",
          boxSizing: "border-box",
          overflowWrap: "break-word",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: isDarkMode
            ? "0 4px 16px rgba(0,0,0,0.25)"
            : "0 4px 20px rgba(0,0,0,0.08)",
          border: isDarkMode ? "1px solid rgba(243,77,1,0.2)" : `2px solid ${scoreTextColor}20`,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: scoreTextColor,
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: 0.3,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Plausibility Score
        </div>
        <div style={{ margin: "0 auto", marginBottom: 16 }}>
          <ProgressCircle
            percent={scoreNum}
            size={100}
            stroke={8}
            color={scoreTextColor}
            bg={isDarkMode ? "#5a463a" : "#f0f0f0"}
          />
        </div>
        {label && (
          <div
            style={{
              fontSize: 22,
              color: scoreLabelColor,
              fontWeight: 700,
              marginTop: 4,
              marginBottom: description ? 8 : 4,
              textAlign: "center",
            }}
          >
            {label}
          </div>
        )}
        {description && (
          <div
            style={{
              fontSize: 15,
              color: isDarkMode ? "#d0d0d0" : "#555",
              marginTop: 0,
              textAlign: "center",
              maxWidth: 650,
              fontWeight: 400,
              lineHeight: 1.6,
              padding: "0 12px",
            }}
          >
            {description}
          </div>
        )}
      </div>
      {/* Case Summary Section */}
      {sections.summary && (
        <div style={{ 
          marginBottom: 16, 
          color: bodyColor,
          background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          padding: "16px 18px",
          borderRadius: 12,
          borderLeft: `4px solid ${isDarkMode ? "#F34D01" : "#F59E42"}`,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: 10,
            gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontWeight: 700, color: headerColor, fontSize: 16 }}>
              Case Summary
            </span>
          </div>
          <span style={{ fontSize: 15, lineHeight: 1.7 }}>{sections.summary}</span>
        </div>
      )}
      
      {/* Legal Issues Section */}
      {sections.issues.length > 0 && (
        <div style={{ 
          marginBottom: 16, 
          color: bodyColor,
          background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          padding: "16px 18px",
          borderRadius: 12,
          borderLeft: `4px solid ${isDarkMode ? "#dc2626" : "#F34D01"}`,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: 10,
            gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>⚖️</span>
            <span style={{ fontWeight: 700, color: headerColor, fontSize: 16 }}>
              Legal Issues or Concerns
            </span>
          </div>
          <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
            {sections.issues.map((issue, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 15, lineHeight: 1.7 }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Suggested Next Steps Section - Most Important */}
      {sections.steps.length > 0 && (
        <div style={{ 
          marginBottom: 16, 
          color: bodyColor,
          background: isDarkMode ? "rgba(22,163,74,0.08)" : "rgba(22,163,74,0.06)",
          padding: "18px 18px",
          borderRadius: 12,
          borderLeft: `4px solid ${isDarkMode ? "#16a34a" : "#16a34a"}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: 12,
            gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontWeight: 700, color: "#16a34a", fontSize: 17 }}>
              Suggested Next Steps
            </span>
          </div>
          <ol style={{ margin: "4px 0 0 20px", padding: 0, listStyleType: "decimal" }}>
            {sections.steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 12, fontSize: 15, lineHeight: 1.7 }}>
                {step.label ? (
                  <>
                    <strong style={{ fontWeight: 700, color: isDarkMode ? "#fff" : "#2c2c2c" }}>{step.label}:</strong>{" "}
                    {step.description}
                  </>
                ) : (
                  <span>{step.description || (typeof step === 'string' ? step : '')}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      {/* Styled Sources Section */}
      {displaySources.length > 0 && (
        <div
          style={{
            background: isDarkMode ? "rgba(255,251,230,0.08)" : "#fffbe6",
            border: isDarkMode ? "1px solid rgba(255,229,160,0.2)" : "1px solid #ffe5a0",
            borderRadius: 10,
            padding: "14px 18px",
            margin: "0 0 16px 0",
            color: isDarkMode ? "#ffd96a" : "#7c5a00",
            fontSize: 15,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}
          >
            <span style={{ fontSize: 18 }}>📚</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: isDarkMode ? "#ffd96a" : "#b97a00" }}>
              Sources
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            {displaySources.map((src, i) => {
              // Check if source is an object (from API) or string (from parsed text)
              if (typeof src === 'object' && src.title) {
                return (
                  <li key={i} style={{ marginBottom: 8, wordBreak: "break-word", lineHeight: 1.6 }}>
                    <strong style={{ color: isDarkMode ? "#ffe066" : "#8c6500" }}>{src.title}</strong>
                    {src.canonicalCitation && (
                      <div style={{ fontSize: 13, marginTop: 2, opacity: 0.9 }}>
                        {src.canonicalCitation}
                      </div>
                    )}
                    {src.summary && (
                      <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
                        {src.summary}
                      </div>
                    )}
                  </li>
                );
              } else {
                // Fallback for string sources (from parsed text)
                return (
                  <li key={i} style={{ marginBottom: 4, wordBreak: "break-word", lineHeight: 1.6 }}>
                    {typeof src === 'string' ? src : JSON.stringify(src)}
                  </li>
                );
              }
            })}
          </ul>
        </div>
      )}
      
      {/* Disclaimer Section - Enhanced */}
      {sections.disclaimer && (
        <div
          style={{
            fontSize: 13,
            color: isDarkMode ? "#b0b0b0" : "#666",
            marginTop: 8,
            background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)",
            borderRadius: 8,
            padding: "12px 14px",
            borderLeft: `3px solid ${isDarkMode ? "#666" : "#999"}`,
            lineHeight: 1.6,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <span>{sections.disclaimer}</span>
        </div>
      )}
      {/* Fallback: if everything is missing, show the raw text */}
      {!hasContent && (
        <div
          style={{ color: isDarkMode ? "#aaa" : "#888", fontStyle: "italic" }}
        >
          {reportText}
        </div>
      )}
    </div>
  );
};

export default VillyReportCard;
