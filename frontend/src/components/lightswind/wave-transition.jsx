import React, { useEffect } from "react";

const WaveTransition = ({ isDarkMode }) => {
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes waveMove {
        0% { transform: translateX(0) translateY(0); }
        50% { transform: translateX(-50px) translateY(-15px); }
        100% { transform: translateX(0) translateY(0); }
      }

      .wave-back { animation: waveMove 8s ease-in-out infinite; }
      .wave-middle { animation: waveMove 6s ease-in-out infinite; animation-delay: -2s; }
      .wave-front { animation: waveMove 7s ease-in-out infinite; animation-delay: -1s; }

      @keyframes floatSphere1 {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(40px, -30px); }
        50% { transform: translate(20px, -50px); }
        75% { transform: translate(-20px, -20px); }
      }
      @keyframes floatSphere2 {
        0%, 100% { transform: translate(0, 0); }
        33% { transform: translate(-50px, -40px); }
        66% { transform: translate(-30px, -60px); }
      }
      @keyframes floatSphere3 {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(30px, -40px); }
      }
      @keyframes floatSphere4 {
        0%, 100% { transform: translate(0, 0); }
        40% { transform: translate(-40px, -30px); }
        80% { transform: translate(-20px, -50px); }
      }

      .sphere-1 { animation: floatSphere1 7s ease-in-out infinite; }
      .sphere-2 { animation: floatSphere2 9s ease-in-out infinite; }
      .sphere-3 { animation: floatSphere3 6s ease-in-out infinite; }
      .sphere-4 { animation: floatSphere4 8s ease-in-out infinite; }

      .wave-back, .wave-middle, .wave-front,
      .sphere-1, .sphere-2, .sphere-3, .sphere-4 {
        will-change: transform;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  return (
    <div
      style={{
        background: isDarkMode ? "#181818" : "#ffffff",
        position: "relative",
        overflow: "hidden",
        height: "250px",
        width: "100%",
      }}
    >
      {/* Ultra-wide SVG to prevent edge visibility */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "300%", // 3x screen width
          height: "100%",
        }}
        viewBox="0 0 3000 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back wave - scaled path */}
        <path
          fill={isDarkMode ? "#2a2a2a" : "#ffd4b8"}
          fillOpacity="0.6"
          d="M0,96L100,112C200,128,400,160,600,165.3C800,171,1000,149,1200,133.3C1400,117,1600,107,1800,122.7C2000,139,2200,181,2400,181.3C2600,181,2800,149,2900,117.3L3000,96L3000,320L2900,320C2800,320,2600,320,2400,320C2200,320,2000,320,1800,320C1600,320,1400,320,1200,320C1000,320,800,320,600,320C400,320,200,320,100,320L0,320Z"
          className="wave-back"
        />
        {/* Middle wave */}
        <path
          fill={isDarkMode ? "#3d3d3d" : "#ff8c5a"}
          fillOpacity="0.7"
          d="M0,160L100,170.7C200,181,400,203,600,197.3C800,192,1000,160,1200,154.7C1400,149,1600,171,1800,181.3C2000,192,2200,192,2400,181.3C2600,171,2800,149,2900,138.7L3000,128L3000,320L2900,320C2800,320,2600,320,2400,320C2200,320,2000,320,1800,320C1600,320,1400,320,1200,320C1000,320,800,320,600,320C400,320,200,320,100,320L0,320Z"
          className="wave-middle"
        />
        {/* Front wave */}
        <path
          fill={isDarkMode ? "#4a4a4a" : "#F34D01"}
          fillOpacity="0.8"
          d="M0,224L100,213.3C200,203,400,181,600,186.7C800,192,1000,224,1200,234.7C1400,245,1600,235,1800,213.3C2000,192,2200,160,2400,154.7C2600,149,2800,171,2900,181.3L3000,192L3000,320L2900,320C2800,320,2600,320,2400,320C2200,320,2000,320,1800,320C1600,320,1400,320,1200,320C1000,320,800,320,600,320C400,320,200,320,100,320L0,320Z"
          className="wave-front"
        />
      </svg>

      {/* Floating Spheres (now relative to container) */}
      <div
        className="sphere sphere-1"
        style={{
          position: "absolute",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: isDarkMode
            ? "radial-gradient(circle at 30% 30%, #6a6a6a, #3d3d3d)"
            : "radial-gradient(circle at 30% 30%, #ffb380, #F34D01)",
          boxShadow: isDarkMode
            ? "0 8px 24px rgba(106, 106, 106, 0.4)"
            : "0 8px 24px rgba(243, 77, 1, 0.4)",
          left: "15%",
          top: "30%",
        }}
      />
      <div
        className="sphere sphere-2"
        style={{
          position: "absolute",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: isDarkMode
            ? "radial-gradient(circle at 30% 30%, #5a5a5a, #2a2a2a)"
            : "radial-gradient(circle at 30% 30%, #ffd4b8, #ff8c5a)",
          boxShadow: isDarkMode
            ? "0 12px 32px rgba(90, 90, 90, 0.3)"
            : "0 12px 32px rgba(255, 140, 90, 0.3)",
          right: "20%",
          top: "50%",
        }}
      />
      <div
        className="sphere sphere-3"
        style={{
          position: "absolute",
          width: "35px",
          height: "35px",
          borderRadius: "50%",
          background: isDarkMode
            ? "radial-gradient(circle at 30% 30%, #7a7a7a, #4a4a4a)"
            : "radial-gradient(circle at 30% 30%, #ff8c5a, #F34D01)",
          boxShadow: isDarkMode
            ? "0 6px 20px rgba(122, 122, 122, 0.35)"
            : "0 6px 20px rgba(255, 140, 90, 0.35)",
          left: "50%",
          top: "20%",
        }}
      />
      <div
        className="sphere sphere-4"
        style={{
          position: "absolute",
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          background: isDarkMode
            ? "radial-gradient(circle at 30% 30%, #5d5d5d, #3a3a3a)"
            : "radial-gradient(circle at 30% 30%, #ffb380, #ff6b3d)",
          boxShadow: isDarkMode
            ? "0 10px 28px rgba(93, 93, 93, 0.3)"
            : "0 10px 28px rgba(255, 107, 61, 0.3)",
          left: "75%",
          top: "40%",
        }}
      />
    </div>
  );
};

export default WaveTransition;
