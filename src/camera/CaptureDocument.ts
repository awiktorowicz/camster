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
  guideRef: any,
  capturingType: string,
  capturingMargin: number,
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

  if (capturingType === 'area') {
    const guidanceArea = cv.contourArea(guidancePointsMat);
    const detectedArea = cv.contourArea(detectedPointsMat);

    updateIsValidArea(
      validateArea(guidanceArea, detectedArea, guideRefCurrent),
    );
    if (!isAreaValid) {
      timer = 6;
      return;
    }
  } else if (capturingType === 'edges') {
    let distances = calculatePointLineDistances(
      lastDetectedPoints,
      guidancePoints,
    );

    updateIsValidArea(
      validateDistances(
        distances,
        guidancePoints,
        capturingMargin,
        guideRefCurrent,
      ),
    );
    if (!isAreaValid) {
      timer = 6;
      return;
    }
  }

  updateIsValidPosition(
    validatePosition(guidancePoints, lastDetectedPoints, guideRefCurrent),
  );
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

const validateDistances = (
  distances: number[],
  guidancePoints: cv.Point[],
  margin: number,
  guideRefCurrent: any,
) => {
  let width = guidancePoints[1].x - guidancePoints[0].x;

  if (distances.every((num) => num < 0)) {
    guideRefCurrent.innerText = 'Zoom out.';
    return false;
  }

  if (distances.every((num) => num >= 0)) {
    if (distances.some((distance) => distance / width > margin / 100)) {
      guideRefCurrent.innerText = 'Zoom in.';
      return false;
    }
    guideRefCurrent.innerText = '';
  }

  return true;
};

const calculatePointLineDistances = (
  lastDetectedPoints: cv.Point[],
  guidancePoints: cv.Point[],
) => {
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

const validateArea = (
  guidanceArea: number,
  detectedArea: number,
  guideRefCurrent: any,
) => {
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
  guideRefCurrent: any,
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
