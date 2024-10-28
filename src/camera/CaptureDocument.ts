import cv from '@techstark/opencv-js';
// Can get number of frames instead
let timer = 6;

export const captureDocument = (
  guidancePoints: cv.Point[],
  lastDetectedPoints: cv.Point[],
  isAreaValid: boolean,
  isPositionValid: boolean,
  updateIsValidArea: (isValid: boolean) => void,
  updateIsValidPosition: (isValid: boolean) => void,
) => {
  if (!lastDetectedPoints) return;

  const guidancePointsMat = cv.matFromArray(
    guidancePoints.length,
    1,
    cv.CV_32SC2,
    guidancePoints.flatMap((p) => [p.x, p.y]),
  );

  const detectedPointsMat = cv.matFromArray(
    lastDetectedPoints.length,
    1,
    cv.CV_32SC2,
    lastDetectedPoints.flatMap((p) => [p.x, p.y]),
  );

  const guidanceArea = cv.contourArea(guidancePointsMat);

  const detectedArea = cv.contourArea(detectedPointsMat);

  updateIsValidArea(validateArea(guidanceArea, detectedArea));
  if (!isAreaValid) {
    timer = 6;
    return;
  }

  updateIsValidPosition(validatePosition(guidancePoints, lastDetectedPoints));
  if (!isPositionValid) {
    timer = 6;
    return;
  }

  if (isAreaValid && isPositionValid) {
    console.log('Object ready to be captured.');
    console.log(timer);
    timer--;
  }

  if (timer === 0) {
    console.log('CAPTURE');
    timer = 6;
  }

  guidancePointsMat.delete();
  detectedPointsMat.delete();
};

const validateArea = (guidanceArea: number, detectedArea: number) => {
  let minArea = 0.5 * guidanceArea;

  if (detectedArea < minArea) {
    console.log('Zoom in.');
  }

  if (detectedArea > guidanceArea) {
    console.log('Zoom out');
  }

  if (minArea <= detectedArea && detectedArea <= guidanceArea) {
    console.log('Area in range.');

    return true;
  }
  return false;
};

const validatePosition = (
  guidancePoints: cv.Point[],
  detectedPoints: cv.Point[],
) => {
  const guidanceBounds = getBounds(guidancePoints);
  const detectedBounds = getBounds(detectedPoints);

  if (detectedBounds.minX < guidanceBounds.minX) {
    console.log('Move left');
    return false;
  }

  if (detectedBounds.maxX > guidanceBounds.maxX) {
    console.log('Move right');
    return false;
  }

  // Check up-down
  if (detectedBounds.minY < guidanceBounds.minY) {
    console.log('Move up');
    return false;
  }

  if (detectedBounds.maxY > guidanceBounds.maxY) {
    console.log('Move down');
    return false;
  }

  return true;
};

const getBounds = (points: cv.Point[]) => {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return { minX, maxX, minY, maxY };
};
