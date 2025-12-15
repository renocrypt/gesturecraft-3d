import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

// Use a promise to store the initialization state.
// This prevents multiple calls (e.g. from React StrictMode) from triggering multiple loads.
let recognitionPromise: Promise<GestureRecognizer> | null = null;

export const initializeGestureRecognizer = async (): Promise<GestureRecognizer> => {
  if (recognitionPromise) return recognitionPromise;

  recognitionPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    const recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return recognizer;
  })();

  return recognitionPromise;
};