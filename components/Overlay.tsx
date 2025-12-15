import React, { useState, useEffect, useRef } from "react";
import { DetectionResult, GestureType, ShapeType } from "../types";
import { Moon, Sun, Hand, Zap, Move, ChevronDown } from "lucide-react";

interface OverlayProps {
  detectionResult: DetectionResult | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  shape: ShapeType;
  onShapeChange: (shape: ShapeType) => void;
}

const Overlay: React.FC<OverlayProps> = ({ detectionResult, isDarkMode, toggleTheme, shape, onShapeChange }) => {
  const currentGesture = detectionResult?.gesture || GestureType.None;
  const isPinching = detectionResult?.pinchState?.isPinching || false;
  const [gestureQueue, setGestureQueue] = useState<{ id: number; type: GestureType }[]>([]);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  // Manage Dynamic Gesture Feed
  useEffect(() => {
    if (currentGesture !== GestureType.None) {
      setGestureQueue((prev) => {
        // Prevent duplicate spam: if the last item is the same, don't add new one
        const lastItem = prev[prev.length - 1];
        if (lastItem && lastItem.type === currentGesture) {
            return prev;
        }
        
        // Add new gesture and limit queue size to 3
        const newItem = { id: Date.now(), type: currentGesture };
        return [...prev.slice(-2), newItem];
      });
    }
  }, [currentGesture]);

  // Auto-remove items from queue after 3 seconds
  useEffect(() => {
    if (gestureQueue.length === 0) return;
    
    const timeout = setTimeout(() => {
        setGestureQueue(prev => prev.slice(1));
    }, 2500);

    return () => clearTimeout(timeout);
  }, [gestureQueue]);

  useEffect(() => {
    if (!isShapeMenuOpen) return;

    const onDocumentPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(target)) {
        setIsShapeMenuOpen(false);
      }
    };

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShapeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentPointerDown);
    document.addEventListener("touchstart", onDocumentPointerDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentPointerDown);
      document.removeEventListener("touchstart", onDocumentPointerDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [isShapeMenuOpen]);

  const getShapeLabel = (shape: ShapeType) => {
    switch (shape) {
      case ShapeType.Icosahedron:
        return "Ico";
      case ShapeType.Torus:
        return "Donut";
      case ShapeType.Capsule:
        return "Capsule";
      default:
        return "Ico";
    }
  };

  const getGestureInstructions = (gesture: GestureType) => {
    switch (gesture) {
        case GestureType.Closed_Fist: return "Holding Energy";
        case GestureType.Open_Palm: return "Expansion Shield";
        case GestureType.Pointing_Up: return "Levitate Up";
        case GestureType.Pointing_Down: return "Descend Down";
        case GestureType.Victory: return "Super Charge!";
        case GestureType.Thumb_Up: return "Positive Polarity";
        case GestureType.Thumb_Down: return "Negative Polarity";
        default: return "Show hand to control";
    }
  }

  const getGestureColor = (gesture: GestureType) => {
    switch (gesture) {
        case GestureType.Closed_Fist: return "text-red-500";
        case GestureType.Open_Palm: return "text-cyan-500";
        case GestureType.Pointing_Up: return "text-purple-500";
        case GestureType.Victory: return "text-yellow-400";
        default: return isDarkMode ? "text-gray-400" : "text-gray-500";
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex w-full items-start justify-between">
        <div className="pointer-events-auto flex flex-col gap-1">
          <h1 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            GESTURE<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">CRAFT</span>
          </h1>
          <p className={`text-sm font-medium opacity-60 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Interactive 3D Experience
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className={`pointer-events-auto rounded-full p-3 transition-colors ${
            isDarkMode 
              ? "bg-white/10 hover:bg-white/20 text-yellow-300" 
              : "bg-black/5 hover:bg-black/10 text-gray-700"
          }`}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Center Feedback */}
      <div className="flex flex-col items-center justify-center gap-4 transition-all duration-500">
        
        {/* Pinch Indicator - Shows when pinching */}
        {isPinching && (
            <div className={`flex flex-col items-center animate-bounce transition-all duration-200`}>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50">
                    <Move className="text-white" size={32} />
                </div>
                <span className="mt-4 text-xl font-black text-orange-500 tracking-widest uppercase shadow-black drop-shadow-md">Pinch Rotate</span>
            </div>
        )}

        {/* Gesture Indicator - Consolidated Card */}
        {!isPinching && (
            <div className={`flex items-center gap-5 rounded-3xl pl-6 pr-10 py-5 backdrop-blur-xl transition-all duration-300 border shadow-2xl ${
                 isDarkMode 
                 ? "bg-black/60 border-white/10 shadow-black/40" 
                 : "bg-white/70 border-white/40 shadow-xl"
            }`}>
                
                {/* Icon Container */}
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    currentGesture !== GestureType.None
                    ? "bg-gradient-to-br from-gray-800 to-black shadow-inner"
                    : "bg-gray-500/10"
                }`}>
                    <Zap className={`h-8 w-8 ${currentGesture !== GestureType.None ? 'animate-pulse' : ''} ${getGestureColor(currentGesture)}`} />
                </div>

                {/* Text Content */}
                <div className="flex flex-col min-w-[120px]">
                    <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Detected
                    </span>
                    <span className={`text-3xl font-black leading-none tracking-tight ${getGestureColor(currentGesture)}`}>
                        {currentGesture === GestureType.None ? 'Scanning...' : currentGesture.replace(/_/g, " ")}
                    </span>
                    <span className={`mt-1 text-xs font-semibold tracking-wide ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                        {getGestureInstructions(currentGesture)}
                    </span>
                </div>
            </div>
        )}
      </div>

      {/* Footer / Dynamic Legend */}
      <div className="pointer-events-auto flex flex-wrap items-end gap-2 sm:gap-4 max-w-3xl min-h-[40px]">
        
        <div className="flex flex-wrap items-end gap-2 sm:gap-4">
          {/* Persistent Pinch Hint (Reacts to state) */}
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                  isPinching
                  ? "bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/20"
                  : isDarkMode ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-black/5 text-gray-600 hover:bg-black/10"
              }`}>
               {isPinching ? <Move size={12} className="animate-spin" /> : <Move size={12} />}
               <span>Pinch & Rotate</span>
               {!isPinching && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase opacity-60">Tip</span>}
          </div>

          {/* Shape selector (disclosure pill) */}
          <div ref={shapeMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isShapeMenuOpen}
              onClick={() => setIsShapeMenuOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                isDarkMode ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-black/5 text-gray-600 hover:bg-black/10"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Shape</span>
              <span className={isDarkMode ? "text-white" : "text-gray-800"}>{getShapeLabel(shape)}</span>
              <ChevronDown size={14} className={`transition-transform ${isShapeMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isShapeMenuOpen && (
              <div
                role="menu"
                className={`absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur-md ${
                  isDarkMode ? "bg-black/70 border-white/10" : "bg-white/80 border-black/10"
                }`}
              >
                {[
                  { value: ShapeType.Icosahedron, label: "Ico" },
                  { value: ShapeType.Torus, label: "Donut" },
                  { value: ShapeType.Capsule, label: "Capsule" },
                ].map((option) => {
                  const isSelected = shape === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onShapeChange(option.value);
                        setIsShapeMenuOpen(false);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? isDarkMode
                            ? "bg-cyber-primary text-black"
                            : "bg-blue-600 text-white"
                          : isDarkMode
                            ? "bg-white/5 text-white/70 hover:bg-white/10"
                            : "bg-black/5 text-gray-700 hover:bg-black/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Stream of Recognized Gestures */}
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto sm:ml-auto sm:justify-end">
          {gestureQueue.map((item) => (
              <div 
                  key={item.id} 
                  className={`flex animate-in fade-in slide-in-from-bottom-4 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm shadow-lg ${
                      isDarkMode ? "bg-white/10 text-white" : "bg-white/80 text-gray-800"
                  } border-l-4 ${
                      item.type === GestureType.Closed_Fist ? 'border-red-500' :
                      item.type === GestureType.Open_Palm ? 'border-cyan-500' :
                      item.type === GestureType.Pointing_Up ? 'border-purple-500' :
                      item.type === GestureType.Victory ? 'border-yellow-400' : 'border-gray-500'
                  }`}
              >
                  <Hand size={12} />
                  {item.type.replace(/_/g, " ")}
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overlay;
