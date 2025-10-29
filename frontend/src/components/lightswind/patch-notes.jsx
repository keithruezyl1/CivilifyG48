// components/PatchNotes.jsx
import React, { useEffect, useState } from "react";

const PatchNotes = ({ notes, isDarkMode = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 3;
  const totalPages = Math.ceil(notes.length / notesPerPage);

  // Get current notes
  const currentNotes = notes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  );

  // Inject dynamic & responsive CSS once
  useEffect(() => {
    const styleId = "patch-notes-aesthetic-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: 640px) {
        .patch-notes-table { display: none !important; }
      }
      @media (min-width: 641px) {
        .patch-notes-mobile { display: none !important; }
      }

      /* Glass badge shine */
      .version-badge {
        position: relative;
        overflow: hidden;
      }
      .version-badge::before {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%);
        transform: translateX(-100%) translateY(-100%) rotate(35deg);
        transition: transform 0.6s ease;
      }
      .version-badge:hover::before {
        transform: translateX(100%) translateY(100%) rotate(35deg);
      }

      /* Subtle row hover glow */
      .patch-row:hover {
        background: ${
          isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(243,77,1,0.04)"
        } !important;
      }

      /* Pagination */
      .pagination-container {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
        flex-wrap: wrap;
      }
      .pagination-btn {
        min-width: 36px;
        height: 36px;
        padding: 0 0.75rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        cursor: pointer;
        backdrop-filter: blur(6px);
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      }
      .pagination-btn.active {
        background: linear-gradient(135deg, #F34D01, #d94600);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(243,77,1,0.3);
      }
      .pagination-btn:not(.active) {
        background: ${
          isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
        };
        color: ${isDarkMode ? "#ccc" : "#666"};
        border: 1px solid ${isDarkMode ? "#444" : "#ddd"};
      }
      .pagination-btn:hover:not(.active) {
        background: ${
          isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"
        };
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [isDarkMode]);

  // Shared styles
  const container = {
    maxWidth: "90vw",
    width: "100%",
    overflowX: "auto",
    padding: "1.5rem 0",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };

  const cell = (align = "left") => ({
    padding: "0.9rem 1rem",
    textAlign: align,
    fontSize: "0.925rem",
    lineHeight: "1.5",
    color: isDarkMode ? "#e0e0e0" : "#1f2937",
  });

  const header = {
    ...cell(),
    fontWeight: "700",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: isDarkMode ? "#a0a0a0" : "#666",
    borderBottom: `2px solid ${isDarkMode ? "#333" : "#e0e0e0"}`,
  };

  const rowBase = {
    background: isDarkMode
      ? "linear-gradient(145deg, #1a1a1a, #1e1e1e)"
      : "linear-gradient(145deg, #ffffff, #f8f9fa)",
    border: `1px solid ${isDarkMode ? "#2a2a2a" : "#e0e0e0"}`,
    borderRadius: "12px",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: isDarkMode
      ? "0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
      : "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  };

  return (
    <div style={container}>
      {/* ====== DESKTOP: GLASS TABLE ====== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 1rem",
        }}
        className="patch-notes-table"
      >
        <thead>
          <tr>
            <th style={{ ...header, width: "110px" }}>Version</th>
            <th style={{ ...header, width: "90px" }}>Type</th>
            <th style={header}>Date</th>
            <th style={header}>What's New</th>
          </tr>
        </thead>
        <tbody>
          {currentNotes.map((note, i) => (
            <tr
              key={i}
              className="patch-row"
              style={rowBase}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = isDarkMode
                  ? "0 16px 32px rgba(0,0,0,0.4), 0 0 20px rgba(243,77,1,0.15)"
                  : "0 16px 32px rgba(243,77,1,0.12), 0 0 16px rgba(243,77,1,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = rowBase.boxShadow;
              }}
            >
              {/* Version Badge */}
              <td style={cell("center")}>
                <div
                  className="version-badge"
                  style={{
                    background: `linear-gradient(135deg, ${note.colorStart}, ${note.colorEnd})`,
                    color: "#fff",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: "78px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div>{note.appVersion}</div>
                  <div style={{ fontSize: "0.65rem", opacity: 0.9 }}>
                    KB {note.kbVersion}
                  </div>
                </div>
              </td>

              {/* Tag */}
              <td style={cell("center")}>
                <span
                  style={{
                    background: isDarkMode ? note.tagBgDark : note.tagBgLight,
                    color: note.tagColor,
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    border: `1px solid ${
                      isDarkMode ? note.tagBorderDark : note.tagBorderLight
                    }`,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {note.tag}
                </span>
              </td>

              {/* Date */}
              <td style={cell()}>{note.date}</td>

              {/* Changes */}
              <td style={cell()}>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.4rem",
                    color: isDarkMode ? "#fff" : "#1f2937",
                  }}
                >
                  {note.title}
                </div>
                <ul className="patch-changes-list" style={{ margin: 0 }}>
                  {note.changes.map((c, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#b0b0b0" : "#4b5563",
                      }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ====== MOBILE: STACKED GLASS CARDS ====== */}
      <div className="patch-notes-mobile">
        {currentNotes.map((note, i) => (
          <div
            key={i}
            style={{
              ...rowBase,
              padding: "1.25rem",
              marginBottom: i < currentNotes.length - 1 ? "1rem" : 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = isDarkMode
                ? "0 12px 24px rgba(0,0,0,0.4), 0 0 16px rgba(243,77,1,0.2)"
                : "0 12px 24px rgba(243,77,1,0.1), 0 0 12px rgba(243,77,1,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = rowBase.boxShadow;
            }}
          >
            {/* Header: Version + Tag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <div
                className="version-badge"
                style={{
                  background: `linear-gradient(135deg, ${note.colorStart}, ${note.colorEnd})`,
                  color: "#fff",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {note.appVersion}{" "}
                <small style={{ opacity: 0.9 }}>KB {note.kbVersion}</small>
              </div>

              <span
                style={{
                  background: isDarkMode ? note.tagBgDark : note.tagBgLight,
                  color: note.tagColor,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  border: `1px solid ${
                    isDarkMode ? note.tagBorderDark : note.tagBorderLight
                  }`,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {note.tag}
              </span>
            </div>

            {/* Date */}
            <div
              style={{
                fontSize: "0.85rem",
                color: isDarkMode ? "#888" : "#666",
                marginBottom: "0.5rem",
              }}
            >
              {note.date}
            </div>

            {/* Title */}
            <div
              style={{
                fontWeight: "700",
                fontSize: "1.1rem",
                marginBottom: "0.5rem",
                color: isDarkMode ? "#fff" : "#1f2937",
              }}
            >
              {note.title}
            </div>

            {/* Changes */}
            <ul className="patch-changes-list" style={{ margin: 0 }}>
              {note.changes.map((c, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: "0.9rem",
                    color: isDarkMode ? "#b0b0b0" : "#4b5563",
                  }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ====== PAGINATION BAR ====== */}
      {totalPages > 1 && (
        <div className="pagination-container">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`pagination-btn ${
                currentPage === i + 1 ? "active" : ""
              }`}
              onClick={() => {
                setCurrentPage(i + 1);
              }}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatchNotes;
