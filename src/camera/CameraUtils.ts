import React from "react";
import { isMobile } from 'react-device-detect';
import cv from "@techstark/opencv-js";

export const getVideoConstraints = () => {
    let videoConstraints = {
        facingMode: { exact: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
    };
    if(isMobile) {
        videoConstraints = {
          facingMode: { exact: "environment" },
          width: { ideal: window.innerHeight },
          height: { ideal: window.screen.width } 
        };
      }
    return videoConstraints;
}

export const setupCanvasSize = (
  videoRef: any,
  canvasRef: any,
  canvasWrapperRef: any,
  config: any,
  updateGuidancePoints: any,
) => {
    const video = videoRef?.current?.video;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper.style.width = `${video.videoWidth}px`;
    canvasWrapper.style.height = `${video.videoHeight}px`;

  updateGuidancePoints(getGuidancePoints(config, canvas.width, canvas.height));
};

export const renderVideoToCanvas = (
  videoRef: any,
  canvasRef: any,
  config: any,
  guidancePoints: cv.Point[],
  lastDetectedPoints: cv.Point[],
) => {
    const canv = videoRef?.current?.getCanvas();
    if (canv) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(videoRef.current.video, 0, 0, canv.width, canv.height);

        const img = cv.imread(canvasRef.current);

    drawGuidanceFrame(img, guidancePoints);

        if (lastDetectedPoints && config.debug) {
      drawDebugContour(img, lastDetectedPoints);
        }

        cv.imshow(canvasRef.current, img);
        img.delete();
    }
};

const drawDebugContour = (input: cv.Mat, points: cv.Point[]) => {
  let contour = new cv.MatVector();
  let pointArray = cv.matFromArray(
    points.length,
    1,
    cv.CV_32SC2,
    points.flatMap((p) => [p.x, p.y]),
  );

  contour.push_back(pointArray);

  const isClosed = true;
  const color = new cv.Scalar(255, 0, 0, 255);
  const thickness = 2;

  cv.polylines(input, contour, isClosed, color, thickness);

  pointArray.delete();
  contour.delete();
};

export const detectDocument = (videoRef: any, canvasRef: any, config: any, updatePointDetected: any) => {
    const video = videoRef?.current?.video;
    // fixes bug https://github.com/opencv/opencv/issues/19922
    video.height = video.videoHeight;
    video.width = video.videoWidth;
    const cap = new cv.VideoCapture(video);
    const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    cap.read(src);

  preprocessImage(src);

  let contoursVec = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(
    src,
    contoursVec,
      hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );

  const minArea = ((video.height / 2) * video.width) / 8;
  // const minArea = 5000;
  let largestContour = findBiggestContour(contoursVec, minArea);
  let largestContourPoints = getCornerPoints(largestContour);

  updatePointDetected(largestContourPoints);

  src.delete();
  hierarchy.delete();
  contoursVec.delete();
};

const isQuadrilateral = (contour: cv.Mat | null) => {
  return contour && contour.rows === 4;
};

const findBiggestContour = (
  contoursVec: cv.MatVector,
  minAreaThreshold: number,
) => {
  let maxArea = 1000;
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

    if (area > maxArea && isQuadrilateral(approx)) {
      if (largestContour) largestContour.delete();
      largestContour = approx;
      maxArea = area;
    } else {
      approx.delete();
    }

    contour.delete();
  }

  return largestContour;
};

// Note the source is passed by ref
const preprocessImage = (source: cv.Mat, output: cv.Mat = source) => {
  // Convert to grayscale
  cv.cvtColor(source, output, cv.COLOR_RGB2GRAY);

  // Apply gaussian blur
  let kernelSize = Math.max(
    3,
    Math.floor(Math.min(source.rows, source.cols) / 100),
  );
  cv.GaussianBlur(source, output, new cv.Size(kernelSize, kernelSize), 0, 0);

  // Apply canny edge
  let intensityThresholds = calculateIntensityThresholds(source);
  cv.Canny(source, output, intensityThresholds[0], intensityThresholds[1]);

  // Apply morphology closing
  let morphKernel = cv.getStructuringElement(
    cv.MORPH_ELLIPSE,
    new cv.Size(5, 5),
  );
  cv.morphologyEx(source, output, cv.MORPH_CLOSE, morphKernel);
};

// Calculates intensity thresholds required for canny filter
const calculateIntensityThresholds = (
  canvas: cv.Mat,
  lowerScalar: number = 0.66,
  upperScalar: number = 1.33,
) => {
  let meanIntensity = cv.mean(canvas)[0];
  let lowerThreshold = lowerScalar * meanIntensity;
  let upperThreshold = upperScalar * meanIntensity;

  return [lowerThreshold, upperThreshold];
};

export const getCornerPoints = (contour: any) => {
  if (!contour) return null;

  let points: cv.Point[] = [];
    let rect = cv.minAreaRect(contour);
    const center = rect.center

    let topLeftPoint
    let topLeftDistance = 0

    let topRightPoint
    let topRightDistance = 0

    let bottomLeftPoint
    let bottomLeftDistance = 0

    let bottomRightPoint
    let bottomRightDistance = 0

    for (let i = 0; i < contour.data32S.length; i += 2) {
        const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
        const distance = Math.hypot(point.x - center.x, point.y - center.y);
        if (point.x < center.x && point.y < center.y) {
        if (distance > topLeftDistance) {
            topLeftPoint = point
            topLeftDistance = distance
        }
        } else if (point.x > center.x && point.y < center.y) {
        if (distance > topRightDistance) {
            topRightPoint = point
            topRightDistance = distance
        }
        } else if (point.x < center.x && point.y > center.y) {
        if (distance > bottomLeftDistance) {
            bottomLeftPoint = point
            bottomLeftDistance = distance
        }
        } else if (point.x > center.x && point.y > center.y) {
        if (distance > bottomRightDistance) {
            bottomRightPoint = point
            bottomRightDistance = distance
        }
        }
    }

  points.push(new cv.Point(topLeftPoint?.x, topLeftPoint?.y));
  points.push(new cv.Point(topRightPoint?.x, topRightPoint?.y));
  points.push(new cv.Point(bottomRightPoint?.x, bottomRightPoint?.y));
  points.push(new cv.Point(bottomLeftPoint?.x, bottomLeftPoint?.y));
  return points;
};

const getGuidancePoints = (config: any, width: number, height: number) => {
  const boxWidth = Math.round(width * (config.documentWidth / 100));
  const boxHeight = Math.round(height * (config.documentHeight / 100));

  const widthFactor = isMobile ? boxWidth / 2 : boxWidth / 4;

  const heightFactor = boxHeight / 2;

  const topLeft = new cv.Point(
    width / 2 - widthFactor,
    height / 2 - heightFactor,
  );
  const topRight = new cv.Point(
    width / 2 + widthFactor,
    height / 2 - heightFactor,
  );
  const bottomLeft = new cv.Point(
    width / 2 - widthFactor,
    height / 2 + heightFactor,
  );
  const bottomRight = new cv.Point(
    width / 2 + widthFactor,
    height / 2 + heightFactor,
  );

  return [topLeft, topRight, bottomRight, bottomLeft];
};

const drawGuidanceFrame = (canvas: cv.Mat, points: cv.Point[]) => {
  const white = [255, 255, 255, 255];
  cv.rectangle(canvas, points[0], points[2], white, 2);
};
