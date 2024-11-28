import cv, { Mat } from '@techstark/opencv-js';
import {
  AutoCaptureConfig,
  ContourDetectionConfig,
} from '../context/AutoCaptureConfig';
import { IFeature } from './IFeature';

enum ZoomAction {
  Problem,
  None,
  ZoomIn,
  ZoomOut,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
}

interface GuidanceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class PositionDetection implements IFeature {
  autoCaptureConfig: AutoCaptureConfig;
  contourDetectionConfig: ContourDetectionConfig;
  config: any; // ????

  private zoomAction: ZoomAction;
  private guidanceBounds: GuidanceBounds | null;
  private detectedBounds: GuidanceBounds | null;

  constructor(config: AutoCaptureConfig) {
    this.autoCaptureConfig = config;
    this.contourDetectionConfig = this.autoCaptureConfig.features.find(
      (f) => f.factoryName === 'contour',
    ) as ContourDetectionConfig;
    this.zoomAction = ZoomAction.Problem;
    this.guidanceBounds = this.getBounds(this.autoCaptureConfig.guidancePoints);
    this.detectedBounds = this.getBounds(
      this.contourDetectionConfig.detectedContour,
    );
  }

  // TODO:: Rewrite this spaghetti
  validate(imageData: Mat): { isValid: boolean } {
    const guidancePoints = this.autoCaptureConfig.guidancePoints;
    const contourDetectionConfig = this.autoCaptureConfig.features.find(
      (f) => f.factoryName === 'contour',
    ) as ContourDetectionConfig;

    const detectedContour = contourDetectionConfig.detectedContour;
    const margin = this.autoCaptureConfig.validation.sideDetectionMargin;

    if (!guidancePoints || !detectedContour) return { isValid: false };

    const distances = this.calculatePointLineDistances(
      detectedContour,
      guidancePoints,
    );

    let width = guidancePoints[1].x - guidancePoints[0].x;
    if (distances.every((num) => num < 0)) {
      this.zoomAction = ZoomAction.ZoomOut;
      return { isValid: false };
    }

    if (distances.every((num) => num >= 0)) {
      if (distances.some((distance) => distance / width > margin / 100)) {
        this.zoomAction = ZoomAction.ZoomIn;
        return { isValid: false };
      }
    }

    if (!this.detectedBounds || !this.guidanceBounds) return { isValid: false };

    if (this.detectedBounds.minX < this.guidanceBounds.minX) {
      this.zoomAction = ZoomAction.MoveLeft;
      return { isValid: false };
    }

    if (this.detectedBounds.maxX > this.guidanceBounds.maxX) {
      this.zoomAction = ZoomAction.MoveRight;
      return { isValid: false };
    }

    // Check up-down
    if (this.detectedBounds.minY < this.guidanceBounds.minY) {
      this.zoomAction = ZoomAction.MoveUp;
      return { isValid: false };
    }

    if (this.detectedBounds.maxY > this.guidanceBounds.maxY) {
      this.zoomAction = ZoomAction.MoveDown;
      return { isValid: false };
    }

    this.zoomAction = ZoomAction.None;
    return { isValid: true };
  }
  draw(canvas: any | null): void {
    if (!canvas || !this.autoCaptureConfig.guidancePoints) return;

    const margin = this.autoCaptureConfig.validation.sideDetectionMargin;
    const width =
      this.autoCaptureConfig.guidancePoints[1].x -
      this.autoCaptureConfig.guidancePoints[0].x;

    const distanceFromBorder = (width * margin) / 100;

    const leftLineStartPoint = new cv.Point(
      this.autoCaptureConfig.guidancePoints[0].x + distanceFromBorder,
      this.autoCaptureConfig.guidancePoints[0].y,
    );

    const leftLineEndPoint = new cv.Point(
      this.autoCaptureConfig.guidancePoints[0].x + distanceFromBorder,
      this.autoCaptureConfig.guidancePoints[3].y,
    );

    const rightLineStartPoint = new cv.Point(
      this.autoCaptureConfig.guidancePoints[1].x - distanceFromBorder,
      this.autoCaptureConfig.guidancePoints[0].y,
    );

    const rightLineEndPoint = new cv.Point(
      this.autoCaptureConfig.guidancePoints[1].x - distanceFromBorder,
      this.autoCaptureConfig.guidancePoints[3].y,
    );

    cv.line(
      canvas,
      leftLineStartPoint,
      leftLineEndPoint,
      new cv.Scalar(0, 255, 0, 255),
      2,
    );

    cv.line(
      canvas,
      rightLineStartPoint,
      rightLineEndPoint,
      new cv.Scalar(0, 255, 0, 255),
      2,
    );
  }
  getFeedback(isValid: boolean): string {
    switch (this.zoomAction) {
      case ZoomAction.ZoomIn:
        return 'Zoom in on the "DOCUMENT"';
      case ZoomAction.ZoomOut:
        return 'Zoom out of the "DOCUMENT"';
      case ZoomAction.MoveLeft:
        return 'Move the camera to the left';
      case ZoomAction.MoveRight:
        return 'Move the camera to the right';
      case ZoomAction.MoveUp:
        return 'Move the camera up';
      case ZoomAction.MoveDown:
        return 'Move the camera down';
      case ZoomAction.None:
        return '"Document" in the correct position';
      case ZoomAction.Problem:
        return 'Problem with validation.';
    }
  }

  updateConfig(setFunction: any): void {
    // throw new Error('Method not implemented.');
  }

  private calculatePointLineDistances = (
    lastDetectedPoints: cv.Point[] | null,
    guidancePoints: cv.Point[] | null,
  ) => {
    if (!lastDetectedPoints || !guidancePoints) return [];

    let distances = [];
    distances.push(
      this.calculatePointLineDistance(
        lastDetectedPoints[0],
        guidancePoints[0],
        guidancePoints[3],
      ),
    );
    distances.push(
      -this.calculatePointLineDistance(
        lastDetectedPoints[1],
        guidancePoints[1],
        guidancePoints[2],
      ),
    );
    distances.push(
      -this.calculatePointLineDistance(
        lastDetectedPoints[2],
        guidancePoints[1],
        guidancePoints[2],
      ),
    );
    distances.push(
      this.calculatePointLineDistance(
        lastDetectedPoints[3],
        guidancePoints[0],
        guidancePoints[3],
      ),
    );
    return distances;
  };

  private calculatePointLineDistance = (
    point: cv.Point,
    lineStart: cv.Point,
    lineEnd: cv.Point,
  ) => {
    // Absolute value is not calculated on purpose
    let numerator =
      (lineEnd.y - lineStart.y) * point.x -
      (lineEnd.x - lineStart.x) * point.y +
      lineEnd.x * lineStart.y -
      lineEnd.y * lineStart.x;
    let denominator = Math.sqrt(
      (lineEnd.y - lineStart.y) ** 2 + (lineEnd.x - lineStart.x) ** 2,
    );

    return numerator / denominator;
  };

  private getBounds = (points: cv.Point[] | null) => {
    if (!points) return null;

    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    return { minX, maxX, minY, maxY };
  };
}
