import React, { useState, useEffect } from "react";
import { DetectionResult, GestureType } from "../types";
import { Moon, Sun, Hand, Zap, Move } from "lucide-react";

interface OverlayProps {
  detectionResult: DetectionResult | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ detectionResult, isDarkMode, toggleTheme }) => {
  const currentGesture = detectionResult?.gesture || GestureType.None;
  const isPinching = detectionResult?.pinchState?.isPinching || false;
  const [gestureQueue, setGestureQueue] = useState<{ id: number; type: GestureType }[]>([]);

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
                <span className="mt-4 text-xl font-black text-orange-500 tracking-widest uppercase shadow-black drop-shadow-md">Pinch Drag</span>
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
        
        {/* Persistent Pinch Hint (Reacts to state) */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                isPinching
                ? "bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/20"
                : isDarkMode ? "bg-white/5 text-white/70" : "bg-black/5 text-gray-600"
            }`}>
             {isPinching ? <Move size={12} className="animate-spin" /> : <Move size={12} />}
             <span>Pinch & Drag</span>
             {!isPinching && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase opacity-60">Tip</span>}
        </div>

        {/* Dynamic Stream of Recognized Gestures */}
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
  );
};

export default Overlay;