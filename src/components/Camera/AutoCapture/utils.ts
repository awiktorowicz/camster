import cv from '@techstark/opencv-js';
import { isMobile } from 'react-device-detect';

export const setupCanvasSize = (
    videoRef: any,
    canvasRef: any,
    canvasWrapperRef: any
  ) => {
    const video = videoRef?.current?.video;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const canvasWrapper = canvasWrapperRef.current;
    canvasWrapper.style.width = `${video.videoWidth}px`;
    canvasWrapper.style.height = `${video.videoHeight}px`;
};

export const getGuidancePoints = (detectionFrameWidth: number, detectionFrameHeight: number, width: number, height: number) => {
  const boxWidth = Math.round(width * (detectionFrameWidth / 100));
  const boxHeight = Math.round(height * (detectionFrameHeight / 100));

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

//TODO: Seperate drawing logic
export const renderVideoToCanvas = (
  videoRef: any,
  canvasRef: any,
  detectionFrameWidth: number,
  detectionFrameHeight: number,
  detectedPoints: Array<any>,
  debug: boolean
) => {
  const canv = videoRef?.current?.getCanvas();
  if (canv) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoRef.current.video, 0, 0, canv.width, canv.height);

    const img = cv.imread(canvasRef.current);

    if (debug && detectedPoints.length === 4) {
      // console.log(detectedPoints);
      const red = [255, 0, 0, 255];
      cv.rectangle(img, detectedPoints[0], detectedPoints[2], red, 2);
    }

    cv.imshow(canvasRef.current, img);

    img.delete();

    //setDocDetected(true);
  }
};

export const detectDocumentPoints = (videoRef: any) => {
  const video = videoRef.current.video;
  video.height = video.videoHeight;
  video.width = video.videoWidth;
  const cap = new cv.VideoCapture(video);
  const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  cap.read(src);

  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

  // Apply gaussian blur
  let kernelSize = Math.max(
    3,
    Math.floor(Math.min(src.rows, src.cols) / 100),
  );
  cv.GaussianBlur(src, src, new cv.Size(kernelSize, kernelSize), 0, 0);

  const lowerScalar = 0.66;
  const upperScalar = 1.33;

  let meanIntensity = cv.mean(src)[0];
  let lowerThreshold = lowerScalar * meanIntensity;
  let upperThreshold = upperScalar * meanIntensity;
  const intensityThresholds = [lowerThreshold, upperThreshold];

  // Apply canny edge
  cv.Canny(src, src, intensityThresholds[0], intensityThresholds[1]);

  // Apply morphology closing
  let morphKernel = cv.getStructuringElement(
    cv.MORPH_ELLIPSE,
    new cv.Size(5, 5),
  );
  cv.morphologyEx(src, src, cv.MORPH_CLOSE, morphKernel);

  let contoursVec = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    src,
    contoursVec,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );

  let largestContour = findBiggestContour(
    contoursVec,
    5000,
  );
  let largestContourPoints = getCornerPoints(largestContour);

  hierarchy.delete();
  contoursVec.delete();
  src.delete();

  return largestContourPoints;
  
};

const findBiggestContour = (contoursVec: cv.MatVector, minAreaThreshold: number) => {
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

    const isQuadrilateral = approx && approx.rows === 4;

    if (area > maxArea && isQuadrilateral) {
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

const getCornerPoints = (contour: any) => {
  if (!contour) return null;

  let points: cv.Point[] = [];
  let rect = cv.minAreaRect(contour);
  const center = rect.center;

  let topLeftPoint;
  let topLeftDistance = 0;

  let topRightPoint;
  let topRightDistance = 0;

  let bottomLeftPoint;
  let bottomLeftDistance = 0;

  let bottomRightPoint;
  let bottomRightDistance = 0;

  for (let i = 0; i < contour.data32S.length; i += 2) {
    const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
    const distance = Math.hypot(point.x - center.x, point.y - center.y);
    if (point.x < center.x && point.y < center.y) {
      if (distance > topLeftDistance) {
        topLeftPoint = point;
        topLeftDistance = distance;
      }
    } else if (point.x > center.x && point.y < center.y) {
      if (distance > topRightDistance) {
        topRightPoint = point;
        topRightDistance = distance;
      }
    } else if (point.x < center.x && point.y > center.y) {
      if (distance > bottomLeftDistance) {
        bottomLeftPoint = point;
        bottomLeftDistance = distance;
      }
    } else if (point.x > center.x && point.y > center.y) {
      if (distance > bottomRightDistance) {
        bottomRightPoint = point;
        bottomRightDistance = distance;
      }
    }
  }

  points.push(new cv.Point(topLeftPoint?.x, topLeftPoint?.y));
  points.push(new cv.Point(topRightPoint?.x, topRightPoint?.y));
  points.push(new cv.Point(bottomRightPoint?.x, bottomRightPoint?.y));
  points.push(new cv.Point(bottomLeftPoint?.x, bottomLeftPoint?.y));
  return points;
};

export const calculatePointLineDistances = (
  lastDetectedPoints: cv.Point[] | null,
  guidancePoints: cv.Point[] | null,
) => {
  if (!lastDetectedPoints || !guidancePoints) return [];

  let distances = [];
  distances.push(
    calculatePointLineDistance(
      lastDetectedPoints[0],
      guidancePoints[0],
      guidancePoints[3],
    ),
  );
  distances.push(
    -calculatePointLineDistance(
      lastDetectedPoints[1],
      guidancePoints[1],
      guidancePoints[2],
    ),
  );
  distances.push(
    -calculatePointLineDistance(
      lastDetectedPoints[2],
      guidancePoints[1],
      guidancePoints[2],
    ),
  );
  distances.push(
    calculatePointLineDistance(
      lastDetectedPoints[3],
      guidancePoints[0],
      guidancePoints[3],
    ),
  );
  return distances;
};

const calculatePointLineDistance = (
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

export const validatePoints = (detectedPoints: any, guidancePoints: any) => {
  const distances = calculatePointLineDistances(
    detectedPoints,
    guidancePoints,
  );
  const margin = 20;
  let width = guidancePoints[1].x - guidancePoints[0].x;
  if (distances.every((num) => num < 0)) {
    return { isValid: false, action: 'zoom out' };
  }

  if (distances.every((num) => num >= 0)) {
    if (distances.some((distance) => distance / width > margin / 100)) {
      return { isValid: false, action: 'zoom in' };
    }
  }

  const guidanceBounds = getBounds(guidancePoints);
  const detectedBounds = getBounds(detectedPoints);

  if (!detectedBounds || !guidanceBounds) return { isValid: false };

  if (detectedBounds.minX < guidanceBounds.minX) {
    return { isValid: false, action: 'move left' };
  }

  if (detectedBounds.maxX > guidanceBounds.maxX) {
    return { isValid: false, action: 'move right' };
  }

  // Check up-down
  if (detectedBounds.minY < guidanceBounds.minY) {
    return { isValid: false, action: 'move up' };
  }

  if (detectedBounds.maxY > guidanceBounds.maxY) {
    return { isValid: false, action: 'move down' };
  }

  return { isValid: true };
};

const getBounds = (points: cv.Point[] | null) => {
  if (!points) return null;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return { minX, maxX, minY, maxY };
};
