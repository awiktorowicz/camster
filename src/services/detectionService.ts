import cv from '@techstark/opencv-js';
import Webcam from 'react-webcam';
import { createFeature } from '../features/featureFactory';

type DetectionResult = {
  type: string;
  feedback: string;
};

//TODO: How to get access to the globalContext? Pass congif as a class parameter
let debug = true;

export const runDetection2 = (
  videoRef: React.RefObject<Webcam>,
  // TODO: change type from any
  canvasRef: any,
  config: any,
): DetectionResult[] => {
  // Get height and width of the video
  // TODO: Check how this part of code can be done better
  if (!videoRef?.current?.video) {
    return [{ type: 'video', feedback: 'Video not detected.' }];
  }

  videoRef.current.video.width = videoRef.current.video.videoWidth;
  videoRef.current.video.height = videoRef.current.video.videoHeight;

  // Get an image from the camera
  const src = new cv.Mat(
    videoRef.current.video.height,
    videoRef.current.video.width,
    cv.CV_8UC4,
  );
  let cap = new cv.VideoCapture(videoRef.current.video);
  cap.read(src);

  // Create debug mat
  // TODO: Should be created only in the debug mode. A function (handler) creating/deleting can be created.
  let drawMat = new cv.Mat(
    videoRef.current.video.height,
    videoRef.current.video.width,
    cv.CV_8UC4,
  );

  // TODO: Consider passing features as a parameter
  const featuresToUse = ['contour'];
  const detectionResults: DetectionResult[] = [];

  featuresToUse.forEach((featuresType) => {
    // Clone of the source is created because each feature would edit it since it is passed by ref
    let srcClone = src.clone();
    const feature = createFeature(featuresType, config);
    const result = feature.validate(srcClone);
    feature.release();

    if (debug) {
      feature.draw(drawMat);
    }

    // if (!result.isValid) {
    //   detectionResults.push({
    //     type: featuresType,
    //     feedback: feature.getFeedback(),
    //   });
    // }
    srcClone.delete();
  });

  cv.imshow(canvasRef.current, drawMat);
  // Clean resources
  src.delete();
  drawMat.delete();
  return detectionResults;
};
