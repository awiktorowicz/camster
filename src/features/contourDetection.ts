import cv from '@techstark/opencv-js';
import { getCornerPoints } from '../camera/CameraUtils';
import {
  AutoCaptureConfig,
  ContourDetectionConfig,
} from '../context/AutoCaptureConfig';
import { IFeature } from './IFeature';

class ContourDetection implements IFeature {
  config: ContourDetectionConfig;
  autoCaptureConfig: AutoCaptureConfig;

  constructor(config: AutoCaptureConfig) {
    this.config = config.features.find(
      (f) => f.factoryName === 'contour',
    ) as ContourDetectionConfig;
    this.autoCaptureConfig = config;
  }

  validate(imageData: cv.Mat): {
    isValid: boolean;
  } {
    this.config.detectedContour = this.detectDocument(imageData);
    return this.config.detectedContour ? { isValid: true } : { isValid: false };
  }

  // TODO: Change the canvas type from any
  draw(canvas: any | null): void {
    if (!canvas || !this.config.detectedContour) {
      return;
    }

    let contour = new cv.MatVector();
    let pointArray = cv.matFromArray(
      this.config.detectedContour.length,
      1,
      cv.CV_32SC2,
      this.config.detectedContour.flatMap((p) => [p.x, p.y]),
    );

    contour.push_back(pointArray);

    cv.polylines(
      canvas,
      contour,
      this.config.draw.isClosed,
      this.config.draw.color,
      this.config.draw.thickness,
    );

    pointArray.delete();
    contour.delete();
  }

  getFeedback(isValid: boolean): string {
    return isValid
      ? 'Contour detected'
      : 'Position your "DOCUMENT" in the frame.';
  }

  updateConfig(setFunction: any): void {
    // throw new Error('Method not implemented.');
    setFunction({
      ...this.autoCaptureConfig.features.find(
        (f) => f.factoryName === 'contour',
      ),
      ...this.config,
    });
  }
  // ?? Potential idea is to create all required MATs in the constructor and delete them using the release function.
  // release(): void {
  //   // throw new Error('Method not implemented.');
  // }

  private detectDocument(imageData: cv.Mat): cv.Point[] | null {
    this.preprocessImage(imageData);

    const detectedContours = this.detectContours(imageData);

    return detectedContours;
  }

  private detectContours(imageData: cv.Mat): cv.Point[] | null {
    let contoursVec = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(
      imageData,
      contoursVec,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    let largestContour = this.findBiggestContour(
      contoursVec,
      this.config.minimumDetectableArea,
    );
    let largestContourPoints = getCornerPoints(largestContour);

    hierarchy.delete();
    contoursVec.delete();

    return largestContourPoints;
  }

  findBiggestContour(contoursVec: cv.MatVector, minAreaThreshold: number) {
    // maxArea is used to store the biggest area and the initial value is used to reduce noise.
    let maxArea = minAreaThreshold;
    let largestContour = null;

    for (let i = 0; i < contoursVec.size(); ++i) {
      let contour = contoursVec.get(i);
      let area = cv.contourArea(contour);

      if (area < minAreaThreshold) {
        contour.delete();
        continue;
      }

      let peri = cv.arcLength(contour, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (area > maxArea && this.isQuadrilateral(approx)) {
        if (largestContour) largestContour.delete();
        largestContour = approx;
        maxArea = area;
      } else {
        approx.delete();
      }

      contour.delete();
    }

    return largestContour;
  }

  isQuadrilateral(contour: cv.Mat) {
    return contour && contour.rows === 4;
  }

  private preprocessImage = (source: cv.Mat, output: cv.Mat = source) => {
    // Convert to grayscale
    cv.cvtColor(source, output, cv.COLOR_RGB2GRAY);

    // Apply gaussian blur
    let kernelSize = Math.max(
      3,
      Math.floor(Math.min(source.rows, source.cols) / 100),
    );
    cv.GaussianBlur(source, output, new cv.Size(kernelSize, kernelSize), 0, 0);

    // Apply canny edge
    let intensityThresholds = this.calculateIntensityThresholds(source);
    cv.Canny(source, output, intensityThresholds[0], intensityThresholds[1]);

    // Apply morphology closing
    let morphKernel = cv.getStructuringElement(
      cv.MORPH_ELLIPSE,
      new cv.Size(5, 5),
    );
    cv.morphologyEx(source, output, cv.MORPH_CLOSE, morphKernel);
  };

  // Calculates intensity thresholds required for canny filter
  private calculateIntensityThresholds = (
    canvas: cv.Mat,
    lowerScalar: number = 0.66,
    upperScalar: number = 1.33,
  ) => {
    let meanIntensity = cv.mean(canvas)[0];
    let lowerThreshold = lowerScalar * meanIntensity;
    let upperThreshold = upperScalar * meanIntensity;

    return [lowerThreshold, upperThreshold];
  };
}

export default ContourDetection;
