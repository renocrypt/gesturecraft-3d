import React, { useEffect, useRef, useState, useCallback } from "react";
import { GestureRecognizer } from "@mediapipe/tasks-vision";
import { initializeGestureRecognizer } from "../services/mediapipe";
import { DetectionResult, GestureType } from "../types";
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react";

interface GestureHandlerProps {
  onDetection: (result: DetectionResult) => void;
  isDarkMode: boolean;
}

// Finger connections for wireframe drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Palm Base
];

const GestureHandler: React.FC<GestureHandlerProps> = ({ onDetection, isDarkMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  
  // Track dark mode in ref to avoid stale closures in animation loop
  const isDarkModeRef = useRef(isDarkMode);
  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  // Initialize MediaPipe
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        const recognizer = await initializeGestureRecognizer();
        if (mounted) {
          recognizerRef.current = recognizer;
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        if (mounted) {
          setError("Failed to load AI model. Please refresh.");
          setIsLoading(false);
        }
      }
    };
    setup();
    return () => { mounted = false; };
  }, []);

  const predictWebcam = useCallback(() => {
    if (!recognizerRef.current || !videoRef.current) return;

    const video = videoRef.current;

    // Check if video is ready and playing
    if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused && !video.ended) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        try {
          const startTimeMs = performance.now();
          const result = recognizerRef.current.recognizeForVideo(video, startTimeMs);

          let detectedGesture = GestureType.None;
          let confidence = 0;
          let handedness: "Left" | "Right" | "Unknown" = "Unknown";
          let pinchState = { isPinching: false, x: 0, y: 0 };
          const landmarks = result.landmarks ? result.landmarks : [];

          // 1. Gesture Detection
          if (result.gestures && result.gestures.length > 0) {
            const topGesture = result.gestures[0][0];
            detectedGesture = topGesture.categoryName as GestureType;
            confidence = topGesture.score;
            
            if (result.handedness && result.handedness.length > 0) {
                handedness = result.handedness[0][0].displayName as "Left" | "Right";
            }
          }

          // 2. Pinch Detection (Thumb Tip #4, Index Tip #8)
          if (landmarks.length > 0) {
            const hand = landmarks[0];
            const thumbTip = hand[4];
            const indexTip = hand[8];
            
            // Calculate distance between thumb and index finger
            const distance = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2)
            );

            // Threshold for pinch (normalized coordinates)
            if (distance < 0.08) {
              pinchState = {
                isPinching: true,
                x: (thumbTip.x + indexTip.x) / 2,
                y: (thumbTip.y + indexTip.y) / 2
              };
            }
          }

          // 3. Draw Wireframe
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Match resolution to video
                if (canvasRef.current.width !== video.videoWidth) {
                    canvasRef.current.width = video.videoWidth;
                    canvasRef.current.height = video.videoHeight;
                }

                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (landmarks.length > 0) {
                    const hand = landmarks[0];
                    const width = canvasRef.current.width;
                    const height = canvasRef.current.height;
                    const isDark = isDarkModeRef.current;

                    // Style settings
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.8)' : 'rgba(37, 99, 235, 0.8)'; // Cyan / Blue
                    
                    // Draw Connections
                    ctx.beginPath();
                    for (const [start, end] of HAND_CONNECTIONS) {
                        const p1 = hand[start];
                        const p2 = hand[end];
                        ctx.moveTo(p1.x * width, p1.y * height);
                        ctx.lineTo(p2.x * width, p2.y * height);
                    }
                    ctx.stroke();

                    // Draw Joints
                    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
                    for (const point of hand) {
                        ctx.beginPath();
                        ctx.arc(point.x * width, point.y * height, 3, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                    
                    // Draw Pinch Point if active
                    if (pinchState.isPinching) {
                        ctx.fillStyle = '#ff8800'; // Orange
                        ctx.beginPath();
                        ctx.arc(pinchState.x * width, pinchState.y * height, 8, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
          }

          onDetection({
            landmarks,
            gesture: detectedGesture,
            confidence,
            handedness,
            pinchState
          });

        } catch (e) {
          // If a frame fails, we log but continue to the next frame
          console.warn("Prediction error:", e);
        }
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [onDetection]);

  const startCamera = async () => {
    if (!videoRef.current) return;
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      
      videoRef.current.srcObject = stream;
      
      // Wait for the video to actually load metadata before playing
      videoRef.current.onloadedmetadata = async () => {
        try {
            await videoRef.current?.play();
            setIsCameraActive(true);
            requestRef.current = requestAnimationFrame(predictWebcam);
        } catch (playError) {
            console.error("Play error:", playError);
            setError("Failed to start video stream.");
        }
      };
      
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Camera permission denied.");
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className={`fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
      isDarkMode ? "border-white/20 bg-black/80" : "border-black/10 bg-white/80"
    } shadow-xl backdrop-blur-md`}>
      <div className="relative h-32 w-48 sm:h-40 sm:w-60">
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center z-10 bg-inherit">
             {isLoading ? (
               <>
                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-cyber-primary' : 'text-blue-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading AI...</span>
               </>
             ) : error ? (
               <div className="flex flex-col items-center gap-1">
                 <AlertCircle className="h-6 w-6 text-red-500" />
                 <div className="text-red-500 text-[10px] leading-tight px-2">{error}</div>
                 <button onClick={startCamera} className="mt-2 text-xs underline">Retry</button>
               </div>
             ) : (
                <button
                  onClick={startCamera}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-transform hover:scale-105 active:scale-95 ${
                    isDarkMode ? "bg-cyber-primary text-black" : "bg-blue-600 text-white"
                  }`}
                >
                  <Camera size={16} />
                  Start Cam
                </button>
             )}
          </div>
        )}
        
        {/* Video Feed */}
        <video
          ref={videoRef}
          className={`h-full w-full object-cover transform scale-x-[-1] ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
          playsInline
          muted
        />
        
        {/* Canvas Overlay for Wireframe */}
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full object-cover transform scale-x-[-1] pointer-events-none ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {isCameraActive && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <div className="flex items-center gap-1 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
              LIVE
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestureHandler;