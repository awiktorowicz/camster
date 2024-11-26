import cv from '@techstark/opencv-js';

export interface IFeature {
  config: any;
  validate(imageData: cv.Mat): {
    isValid: boolean;
  };
  draw(canvas: any | null): void;
  getFeedback(isValid: boolean): string;
  updateConfig(setFunction: any): void;
}
