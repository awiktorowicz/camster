import cv from '@techstark/opencv-js';
import { isMobile } from 'react-device-detect';

export const getVideoConstraints = () => {
  let videoConstraints = {
    facingMode: {},
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };
  if (isMobile) {
    videoConstraints = {
      facingMode: { exact: 'environment' },
      width: { ideal: window.innerHeight },
      height: { ideal: window.screen.width },
    };
  }
  return videoConstraints;
};

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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoRef.current.video, 0, 0, canv.width, canv.height);

    const img = cv.imread(canvasRef.current);

    drawGuidanceFrame(img, guidancePoints);

    cv.imshow(canvasRef.current, img);
    img.delete();
  }
};

export const getCornerPoints = (contour: any) => {
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
