export enum GestureType {
  None = "None",
  Closed_Fist = "Closed_Fist",
  Open_Palm = "Open_Palm",
  Pointing_Up = "Pointing_Up",
  Pointing_Down = "Pointing_Down",
  Victory = "Victory",
  Thumb_Up = "Thumb_Up",
  Thumb_Down = "Thumb_Down"
}

export enum ShapeType {
  Icosahedron = "Icosahedron",
  Torus = "Torus",
  Capsule = "Capsule",
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PinchState {
  isPinching: boolean;
  x: number;
  y: number;
}

export interface DetectionResult {
  landmarks: HandLandmark[][];
  gesture: GestureType;
  confidence: number;
  handedness: "Left" | "Right" | "Unknown";
  pinchState: PinchState;
}

export interface SceneState {
  gesture: GestureType;
  isConnected: boolean;
}
