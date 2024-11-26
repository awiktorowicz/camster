import cv from '@techstark/opencv-js';
import { IFeature } from './IFeature';

class GlareDetection implements IFeature {
  updateConfig(): void {
    throw new Error('Method not implemented.');
  }
  config: any;

  private _detectedGlare: cv.MatVector = new cv.MatVector();

  validate(imageData: cv.Mat): { isValid: boolean; error: string | null } {
    // TODO: brightness threshold should be passed as a parameter
    let glareContours = new cv.MatVector();
    // TODO: Glare Contours are passed by reference, it means I do not need a return in detectGlare
    // TODO: How to clean the memory then???
    this._detectedGlare = this.detectGlare(imageData, glareContours, 240);

    return this._detectedGlare
      ? { isValid: true, error: null }
      : { isValid: false, error: 'Glare Detected' };
  }

  draw(canvas: any | null): void {
    if (!canvas || !this._detectedGlare) {
      return;
    }
    for (let i = 0; i < this._detectedGlare.size(); i++) {
      cv.drawContours(
        canvas,
        this._detectedGlare,
        i,
        new cv.Scalar(0, 0, 255, 255),
        2,
      );
    }
  }

  getFeedback(): string {
    throw new Error('Method not implemented.');
  }

  private detectGlare(
    imageData: cv.Mat,
    contoursMatVector: cv.MatVector,
    brightnessThreshold: number,
  ) {
    let gray = new cv.Mat();
    cv.cvtColor(imageData, gray, cv.COLOR_RGB2GRAY);

    cv.threshold(gray, imageData, brightnessThreshold, 255, cv.THRESH_BINARY);

    // Find contours of the bright areas
    let glareContours = new cv.MatVector();
    let glareHierarchy = new cv.Mat();
    cv.findContours(
      imageData,
      glareContours,
      glareHierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    for (let i = 0; i < glareContours.size(); i++) {
      let contour = glareContours.get(i);
      let area = cv.contourArea(contour);

      if (area > 500) {
        let mask = cv.Mat.zeros(imageData.rows, imageData.cols, cv.CV_8UC1);
        cv.drawContours(mask, glareContours, i, new cv.Scalar(255), cv.FILLED);
        let meanIntensity = cv.mean(gray, mask)[0];

        if (meanIntensity > brightnessThreshold) {
          contoursMatVector.push_back(contour);
        }
        mask.delete();
      }
      contour.delete();
    }

    glareContours.delete();
    glareHierarchy.delete();

    return contoursMatVector;
  }
}

export default GlareDetection;
