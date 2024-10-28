import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { useGlobalContext } from '../GlobalContext';
import { animationManager } from './AnimationManger';
import {
  detectDocument,
  getVideoConstraints,
  renderVideoToCanvas,
  setupCanvasSize,
} from './CameraUtils';
import { captureDocument } from './CaptureDocument';

const Camera = (config: any) => {

  const [globalData, setGlobalData] = useGlobalContext();

  const videoWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoConstraints = getVideoConstraints();

  const initialiseCanvas = () => {
    setupCanvasSize(videoRef, canvasRef, config, updateGuidancePoints);
  };

  const renderVideo = () => {
    renderVideoToCanvas(
      videoRef,
      canvasRef,
      config,
      globalData.autoCapture.guidancePoints,
      globalData.autoCapture.lastDetectedPoints,
    );
  };

  const runDetection = () => {
    detectDocument(videoRef, canvasRef, config, updatePointDetected);
  };

  const runCapturing = () => {
    captureDocument(
      globalData.autoCapture.guidancePoints,
      globalData.autoCapture.lastDetectedPoints,
      globalData.autoCapture.isAreaValid,
      globalData.autoCapture.isPositionValid,
      updateIsValidArea,
      updateIsValidPosition,
    );
  };

  const updatePointDetected = (points: any) => {
    const globalDataUpdate = globalData;
    globalDataUpdate.autoCapture.lastDetectedPoints = points;
    setGlobalData(globalDataUpdate);
  };

  const updateGuidancePoints = (points: any) => {
    const globalDataUpdate = globalData;
    globalDataUpdate.autoCapture.guidancePoints = points;
    setGlobalData(globalDataUpdate);
  };

  const updateIsValidArea = (isValid: boolean) => {
    const globalDataUpdate = globalData;
    globalDataUpdate.autoCapture.isAreaValid = isValid;
    setGlobalData(globalDataUpdate);
  };

  const updateIsValidPosition = (isValid: boolean) => {
    const globalDataUpdate = globalData;
    globalDataUpdate.autoCapture.isPositionValid = isValid;
    setGlobalData(globalDataUpdate);
  };

  const videoStarted = () => {
    // seems to have issues on ios without delay
    setTimeout(() => {
      initialiseCanvas();
      animationManager.registerTask(renderVideo, 60);
      animationManager.registerTask(runDetection, 10);
      animationManager.registerTask(runCapturing, 2);
    }, 2000);
  }

  return (
    <div>
      <div style={{position: 'relative'}}>
        <div ref={videoWrapperRef}><Webcam videoConstraints={videoConstraints} ref={videoRef} onUserMedia={videoStarted} style={{position: 'absolute'}} /></div>
        <div><canvas id="canvasOutput" ref={canvasRef} style={{position: 'absolute'}}></canvas></div>
      </div>
      {/* <div style={{position: 'relative'}}><Link to="/" reloadDocument>Back to settings</Link></div> */}
      <div style={{position: 'relative'}}><a href="/camster" >Back to settings</a></div>
    </div>
  );
}

export default Camera;