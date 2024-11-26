import cv from '@techstark/opencv-js';

export interface DetectionResult {
  type: string;
  isValid: boolean;
  feedback: string;
}

export interface Result {
  isValid: boolean;
  feedback: string | null;
}

export interface Feature {
  name: string;
  factoryName: string;
  draw: any;
  result: Result;
  [key: string]: any;
}

export interface ContourDetectionConfig extends Feature {
  name: string;
  factoryName: string;

  draw: {
    isClosed: boolean;
    thickness: number;
    color: number[];
  };

  minimumDetectableArea: number;
  detectedContour: cv.Point[] | null;

  result: Result;
}

export interface DetectionFrame {
  width: number;
  height: number;
  cornerRadius: number;
  thickness: number;
}

export interface Validation {
  sideDetectionMargin: number;
  holdingTime: number;
}

export interface AutoCaptureConfig {
  debug: boolean;

  detectionFrame: DetectionFrame;

  guidancePoints: cv.Point[] | null;

  activeFeatures: string[];

  features: Feature[];

  detectionResults: DetectionResult[];

  validation: Validation;
}
