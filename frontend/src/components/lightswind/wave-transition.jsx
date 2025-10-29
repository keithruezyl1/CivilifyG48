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
        height: "200px",
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
          width: "300%",
          height: "100%",
        }}
        viewBox="0 0 3000 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back wave - taller, wavier */}
        <path
          fill={isDarkMode ? "#2a2a2a" : "#ffd4b8"}
          fillOpacity="0.6"
          d="M0,64L75,80C150,96,300,128,450,144C600,160,750,160,900,144C1050,128,1200,96,1350,90.7C1500,85,1650,107,1800,122.7C1950,139,2100,149,2250,144C2400,139,2550,117,2700,106.7C2850,96,3000,96,3075,96L3150,96L3150,320L3075,320C3000,320,2850,320,2700,320C2550,320,2400,320,2250,320C2100,320,1950,320,1800,320C1650,320,1500,320,1350,320C1200,320,1050,320,900,320C750,320,600,320,450,320C300,320,150,320,75,320L0,320Z"
          className="wave-back"
        />
        {/* Middle wave - more peaks */}
        <path
          fill={isDarkMode ? "#3d3d3d" : "#ff8c5a"}
          fillOpacity="0.7"
          d="M0,96L75,112C150,128,300,160,450,170.7C600,181,750,171,900,160C1050,149,1200,128,1350,133.3C1500,139,1650,171,1800,181.3C1950,192,2100,181,2250,170.7C2400,160,2550,149,2700,138.7C2850,128,3000,128,3075,128L3150,128L3150,320L3075,320C3000,320,2850,320,2700,320C2550,320,2400,320,2250,320C2100,320,1950,320,1800,320C1650,320,1500,320,1350,320C1200,320,1050,320,900,320C750,320,600,320,450,320C300,320,150,320,75,320L0,320Z"
          className="wave-middle"
        />
        {/* Front wave - sharpest, tallest */}
        <path
          fill={isDarkMode ? "#4a4a4a" : "#F34D01"}
          fillOpacity="0.8"
          d="M0,128L75,138.7C150,149,300,171,450,181.3C600,192,750,192,900,181.3C1050,171,1200,149,1350,154.7C1500,160,1650,192,1800,202.7C1950,213,2100,203,2250,181.3C2400,160,2550,128,2700,122.7C2850,117,3000,139,3075,149.3L3150,160L3150,320L3075,320C3000,320,2850,320,2700,320C2550,320,2400,320,2250,320C2100,320,1950,320,1800,320C1650,320,1500,320,1350,320C1200,320,1050,320,900,320C750,320,600,320,450,320C300,320,150,320,75,320L0,320Z"
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
