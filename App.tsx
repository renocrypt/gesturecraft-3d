import React, { useState, useEffect } from "react";
import Scene3D from "./components/Scene3D";
import GestureHandler from "./components/GestureHandler";
import Overlay from "./components/Overlay";
import { DetectionResult, GestureType } from "./types";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleDetection = (result: DetectionResult) => {
    setDetectionResult(result);
  };

  // Sync class on body for Tailwind global dark mode if needed (though we use class strategy)
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      document.body.style.backgroundColor = "#0a0a12";
    } else {
      document.body.classList.remove("dark");
      document.body.style.backgroundColor = "#f0f0f5";
    }
  }, [isDarkMode]);

  return (
    <div className={`relative h-screen w-screen overflow-hidden font-sans transition-colors duration-700 ${
      isDarkMode ? "bg-cyber-dark text-white" : "bg-cyber-light text-black"
    }`}>
      {/* 3D Scene Layer */}
      <Scene3D 
        detectionResult={detectionResult} 
        isDarkMode={isDarkMode} 
      />

      {/* UI Overlay Layer */}
      <Overlay 
        detectionResult={detectionResult} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
      />

      {/* Logic/Camera Layer */}
      <GestureHandler 
        onDetection={handleDetection} 
        isDarkMode={isDarkMode} 
      />
    </div>
  );
};

export default App;