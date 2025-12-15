import React, { useState, useEffect } from "react";
import Scene3D from "./components/Scene3D";
import GestureHandler from "./components/GestureHandler";
import Overlay from "./components/Overlay";
import { DetectionResult, GestureType, ShapeType } from "./types";

const SHAPE_STORAGE_KEY = "gesturecraft-3d.shape";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [shape, setShape] = useState<ShapeType>(() => {
    try {
      const saved = localStorage.getItem(SHAPE_STORAGE_KEY);
      if (saved && (Object.values(ShapeType) as string[]).includes(saved)) {
        return saved as ShapeType;
      }
    } catch {
      // Ignore persistence errors (e.g. blocked storage).
    }
    return ShapeType.Icosahedron;
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(SHAPE_STORAGE_KEY, shape);
    } catch {
      // Ignore persistence errors (e.g. blocked storage).
    }
  }, [shape]);

  return (
    <div className={`relative h-screen w-screen overflow-hidden font-sans transition-colors duration-700 ${
      isDarkMode ? "bg-cyber-dark text-white" : "bg-cyber-light text-black"
    }`}>
      {/* 3D Scene Layer */}
      <Scene3D 
        detectionResult={detectionResult} 
        isDarkMode={isDarkMode} 
        shape={shape}
      />

      {/* UI Overlay Layer */}
      <Overlay 
        detectionResult={detectionResult} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        shape={shape}
        onShapeChange={setShape}
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
