import cv from '@techstark/opencv-js';

export interface IFeature {
  config: any;
  validate(imageData: cv.Mat): {
    isValid: boolean;
    error: string | null;
  };
  draw(canvas: any | null): void;
  getFeedback(): string;
  release(): void;
}
