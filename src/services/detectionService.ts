import cv from '@techstark/opencv-js';
import Webcam from 'react-webcam';
import {
  AutoCaptureConfig,
  DetectionResult,
} from '../context/AutoCaptureConfig';
import { createFeature } from '../features/featureFactory';

export const runDetection = (
  videoRef: React.RefObject<Webcam>,
  // TODO: change type from any
  canvasRef: any,
  autoCaptureConfig: AutoCaptureConfig,
  setGlobalData: any,
) => {
  // TODO: Check how this part of code can be done better
  // Get height and width of the video
  if (!videoRef?.current?.video) {
    return [{ type: 'video', feedback: 'Video not detected.' }];
  }

  videoRef.current.video.width = videoRef.current.video.videoWidth;
  videoRef.current.video.height = videoRef.current.video.videoHeight;

  // // Get an image from the camera
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

  // Clean canvas
  const context = canvasRef.current.getContext('2d');
  context.clearRect(0, 0, 1000, 1000);

  const featuresToUse = autoCaptureConfig.activeFeatures;
  const detectionResults: DetectionResult[] = [];

  featuresToUse.forEach((featuresType) => {
    // Clone of the source is created because each feature would edit it since it is passed by ref
    let srcClone = src.clone();
    const feature = createFeature(
      featuresType,
      autoCaptureConfig,
      setGlobalData, // !! Is not needed anymore
    );

    const result = feature.validate(srcClone);
    srcClone.delete();

    feature.updateConfig(setGlobalData);

    // console.log(autoCaptureConfig);
    // debugger;

    if (autoCaptureConfig.debug) {
      feature.draw(drawMat);
    }

    detectionResults.push({
      type: featuresType,
      isValid: result.isValid,
      feedback: feature.getFeedback(result.isValid),
    });
  });

  cv.imshow(canvasRef.current, drawMat);

  // Clean resources
  src.delete();
  drawMat.delete();

  autoCaptureConfig.detectionResults.splice(
    0,
    autoCaptureConfig.detectionResults.length,
    ...detectionResults,
  );

  setGlobalData({ autoCaptureConfig });
};
