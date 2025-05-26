import React from 'react';

// Helper to parse the report text into sections
function parseReport(reportText) {
  const sections = {
    summary: '',
    issues: [],
    score: '',
    scoreLabel: '',
    scoreExplanation: '',
    steps: [],
    disclaimer: '',
    sources: [],
  };
  if (!reportText) return sections;

  // Extract Case Summary
  const summaryMatch = reportText.match(/Case Summary:\s*([\s\S]*?)(?:\n\n|Legal Issues|Plausibility Score:|Suggested Next Steps:|Sources:)/i);
  if (summaryMatch) sections.summary = summaryMatch[1].trim();

  // Extract Legal Issues or Concerns
  const issuesMatch = reportText.match(/Legal Issues(?: or Concerns)?:\s*([\s\S]*?)(?:\n\n|Plausibility Score:|Suggested Next Steps:|Sources:)/i);
  if (issuesMatch) {
    sections.issues = issuesMatch[1].split(/\n- /).map(s => s.replace(/^[-\s]*/, '').trim()).filter(Boolean);
  }

  // Extract Plausibility Score
  const scoreMatch = reportText.match(/Plausibility Score:\s*(\d{1,3})%\s*-?\s*([\w\s]+)?-?\s*([\s\S]*?)(?:\n\n|Suggested Next Steps:|Sources:|$)/i);
  if (scoreMatch) {
    sections.score = scoreMatch[1];
    sections.scoreLabel = scoreMatch[2] ? scoreMatch[2].trim() : '';
    sections.scoreExplanation = scoreMatch[3] ? scoreMatch[3].trim() : '';
  } else {
    const scoreLine = reportText.split('\n').find(l => l.toLowerCase().includes('plausibility score'));
    if (scoreLine) sections.scoreExplanation = scoreLine.trim();
  }

  // Extract Suggested Next Steps
  const stepsMatch = reportText.match(/Suggested Next Steps:\s*([\s\S]*?)(?:\n\n|Sources:|This is a legal pre-assessment|$)/i);
  if (stepsMatch) {
    sections.steps = stepsMatch[1].split(/\n- /).map(s => s.replace(/^[-\s]*/, '').trim()).filter(Boolean);
  }

  // Extract Sources
  const sourcesMatch = reportText.match(/Sources:\s*([\s\S]*?)(?:\n\n|This is a legal pre-assessment|$)/i);
  if (sourcesMatch) {
    sections.sources = sourcesMatch[1].split(/\n- /).map(s => s.replace(/^[-\s]*/, '').trim()).filter(Boolean);
  }

  // Extract disclaimer
  const disclaimerMatch = reportText.match(/(This is a legal pre-assessment[\s\S]*)/i);
  if (disclaimerMatch) sections.disclaimer = disclaimerMatch[1].trim();

  return sections;
}

// Helper to extract label and description from scoreLabel
function extractLabelAndDescription(scoreLabel) {
  if (!scoreLabel) return { label: '', description: '' };
  // Match 'Highly Likely', 'Highly Unlikely', 'Likely', 'Unlikely', 'Moderate', 'Possible', etc.
  const match = scoreLabel.match(/^(Highly Likely|Highly Unlikely|Likely|Unlikely|Moderate|Possible|Improbable|Rare|Low|High|Certain|Uncertain|Unknown|\w+)/i);
  if (match) {
    const label = match[0];
    let description = scoreLabel.slice(label.length).trim();
    // Only keep the description if it is a short summary (not a next step or bullet)
    if (description.startsWith('-') || description.startsWith('•')) {
      description = '';
    }
    // If description contains multiple sentences, keep only the first sentence
    if (description.includes('.')) {
      description = description.split('.').shift().trim() + '.';
    }
    return { label, description };
  }
  return { label: scoreLabel, description: '' };
}

// ProgressCircle component
function ProgressCircle({ percent, size = 64, stroke = 7, color = '#F34D01', bg = '#ffe5d6' }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
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
        style={{ transition: 'stroke-dashoffset 0.6s' }}
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
  if (!label) return '#F34D01';
  const l = label.toLowerCase();
  if (l.includes('highly likely') || l.includes('likely') || l.includes('possible')) return '#16a34a'; // green
  if (l.includes('moderate')) return '#F59E42'; // orange
  if (l.includes('unlikely')) return '#dc2626'; // red
  return '#F34D01'; // default orange
};

const VillyReportCard = ({ reportText, isDarkMode = false, plausibilityLabel, plausibilitySummary }) => {
  const sections = parseReport(reportText);
  const hasContent = sections.summary || sections.issues.length || sections.score || sections.steps.length;
  const scoreNum = parseInt(sections.score, 10) || 0;
  const headerColor = isDarkMode ? '#fff' : '#444';
  const bodyColor = isDarkMode ? '#e0e0e0' : '#232323';
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
  const plausibilityBg = isDarkMode ? '#3a2f29' : 'rgba(243,77,1,0.13)';
  return (
    <div style={{
      background: 'none',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(243,77,1,0.07)',
      padding: '18px 14px 14px 14px',
      margin: '16px 0',
      maxWidth: 900,
      minWidth: 220,
      width: '100%',
      color: bodyColor,
      fontSize: 15,
      lineHeight: 1.65,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      position: 'relative',
      alignSelf: 'flex-start',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Villy's Report Title */}
      <div style={{ fontWeight: 800, fontSize: 20, color: '#F34D01', letterSpacing: 0.1, marginBottom: 16, textAlign: 'center' }}>
        Villy's Report
      </div>
      {/* Plausibility Score Card */}
      <div style={{
        width: '100%',
        maxWidth: 850,
        minWidth: 120,
        margin: '0 auto 18px auto',
        background: plausibilityBg,
        borderRadius: 18,
        padding: '24px 0 20px 0',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.18)' : '0 2px 12px rgba(243,77,1,0.07)',
      }}>
        <div style={{ fontSize: 20, color: scoreTextColor, fontWeight: 800, marginBottom: 10, letterSpacing: 0.2, textAlign: 'center' }}>
          Plausibility Score
        </div>
        <div style={{ margin: '0 auto', marginBottom: 10 }}>
          <ProgressCircle percent={scoreNum} size={90} color={scoreTextColor} bg={isDarkMode ? '#5a463a' : '#ffe5d6'} />
        </div>
        {label && (
          <div style={{ fontSize: 20, color: scoreLabelColor, fontWeight: 700, marginTop: 2, marginBottom: description ? 0 : 2, textAlign: 'center' }}>
            {label}
          </div>
        )}
        {description && (
          <div style={{ fontSize: 16, color: isDarkMode ? '#e0e0e0' : '#444', marginTop: 4, textAlign: 'center', maxWidth: 700, fontWeight: 400 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ borderTop: isDarkMode ? '1px solid #444' : '1px solid #f3f3f3', margin: '4px 0 10px 0' }} />
      {sections.summary && (
        <div style={{ marginBottom: 8, color: bodyColor }}>
          <span style={{ fontWeight: 600, color: headerColor }}>Case Summary:</span><br />
          <span>{sections.summary}</span>
        </div>
      )}
      {sections.issues.length > 0 && (
        <div style={{ marginBottom: 8, color: bodyColor }}>
          <span style={{ fontWeight: 600, color: headerColor }}>Legal Issues or Concerns:</span>
          <ul style={{ margin: '4px 0 4px 18px', padding: 0 }}>
            {sections.issues.map((issue, i) => <li key={i} style={{ marginBottom: 2 }}>{issue}</li>)}
          </ul>
        </div>
      )}
      {sections.steps.length > 0 && (
        <div style={{ marginBottom: 8, color: bodyColor }}>
          <span style={{ fontWeight: 600, color: headerColor }}>Suggested Next Steps:</span>
          <ul style={{ margin: '4px 0 4px 18px', padding: 0 }}>
            {sections.steps.map((step, i) => <li key={i} style={{ marginBottom: 2 }}>{step}</li>)}
          </ul>
        </div>
      )}
      {/* Styled Sources Section */}
      {sections.sources.length > 0 && (
        <div style={{
          background: '#fffbe6',
          border: '1px solid #ffe5a0',
          borderRadius: 8,
          padding: '12px 16px',
          margin: '10px 0 8px 0',
          color: '#7c5a00',
          fontSize: 15,
          boxShadow: '0 1px 4px rgba(243,77,1,0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>📚</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#b97a00' }}>Sources</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            {sections.sources.map((src, i) => (
              <li key={i} style={{ marginBottom: 2, wordBreak: 'break-word' }}>{src}</li>
            ))}
          </ul>
        </div>
      )}
      {sections.disclaimer && (
        <div style={{ fontSize: 12, color: isDarkMode ? '#aaa' : '#888', marginTop: 8, borderTop: isDarkMode ? '1px solid #444' : '1px solid #f3f3f3', paddingTop: 6 }}>
          {sections.disclaimer}
        </div>
      )}
      {/* Fallback: if everything is missing, show the raw text */}
      {!hasContent && (
        <div style={{ color: isDarkMode ? '#aaa' : '#888', fontStyle: 'italic' }}>{reportText}</div>
      )}
    </div>
  );
};

export default VillyReportCard; 