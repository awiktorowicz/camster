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
  guideRef: any
) => {
  const guideRefCurrent = guideRef.current;
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

  updateIsValidArea(validateArea(guidanceArea, detectedArea, guideRefCurrent));
  if (!isAreaValid) {
    timer = 6;
    return;
  }

  updateIsValidPosition(validatePosition(guidancePoints, lastDetectedPoints, guideRefCurrent));
  if (!isPositionValid) {
    timer = 6;
    return;
  }

  if (isAreaValid && isPositionValid) {
    guideRefCurrent.innerText = 'Document ready to be captured.';
    console.log('Document ready to be captured.');
    console.log(timer);
    timer--;
  }

  if (timer === 0) {
    guideRefCurrent.innerText = 'CAPTURE';
    console.log('CAPTURE');
    timer = 6;
  }

  guidancePointsMat.delete();
  detectedPointsMat.delete();
};

const validateArea = (guidanceArea: number, detectedArea: number, guideRefCurrent: any) => {
  let minArea = 0.5 * guidanceArea;

  if (detectedArea < minArea) {
    guideRefCurrent.innerText = 'Zoom in.';
    console.log('Zoom in.');
  }

  if (detectedArea > guidanceArea) {
    guideRefCurrent.innerText = 'Zoom out';
    console.log('Zoom out');
  }

  if (minArea <= detectedArea && detectedArea <= guidanceArea) {
    guideRefCurrent.innerText = 'Area in range.';
    console.log('Area in range.');

    return true;
  }
  return false;
};

const validatePosition = (
  guidancePoints: cv.Point[],
  detectedPoints: cv.Point[],
  guideRefCurrent: any
) => {
  const guidanceBounds = getBounds(guidancePoints);
  const detectedBounds = getBounds(detectedPoints);

  if (detectedBounds.minX < guidanceBounds.minX) {
    guideRefCurrent.innerText = 'Move left';
    console.log('Move left');
    return false;
  }

  if (detectedBounds.maxX > guidanceBounds.maxX) {
    guideRefCurrent.innerText = 'Move right';
    console.log('Move right');
    return false;
  }

  // Check up-down
  if (detectedBounds.minY < guidanceBounds.minY) {
    guideRefCurrent.innerText = 'Move up';
    console.log('Move up');
    return false;
  }

  if (detectedBounds.maxY > guidanceBounds.maxY) {
    guideRefCurrent.innerText = 'Move down';
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
