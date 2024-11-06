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
  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideRef = React.useRef<HTMLDivElement | null>(null);
  const screenReaderRef = React.useRef<HTMLDivElement | null>(null);

  const videoConstraints = getVideoConstraints();

  const initialiseCanvas = () => {
    setupCanvasSize(
      videoRef,
      canvasRef,
      canvasWrapperRef,
      config,
      updateGuidancePoints,
    );
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
      guideRef,
      config.capturingType,
      config.capturingMargin,
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

  const runScreenReader = () => {
    const guideText = guideRef.current?.innerText;
    const screenReaderText = screenReaderRef.current?.innerText;

    if (screenReaderText !== guideText && screenReaderRef.current && guideRef.current) {
      screenReaderRef.current && guideText ? screenReaderRef.current.innerText = guideText : screenReaderRef.current.innerText = '';
    }
  }

  const videoStarted = () => {
    // seems to have issues on ios without delay
    setTimeout(() => {
      initialiseCanvas();
      animationManager.registerTask(renderVideo, 60);
      animationManager.registerTask(runDetection, 10);
      animationManager.registerTask(runCapturing, 2);
      animationManager.registerTask(runScreenReader, 10);
    }, 2000);
  }

  return (
    <div>
      <div style={{position: 'relative'}}>
        <div ref={videoWrapperRef}><Webcam videoConstraints={videoConstraints} ref={videoRef} onUserMedia={videoStarted} style={{position: 'absolute'}} /></div>
        <div ref={canvasWrapperRef} style={{position: 'relative'}}>
          <canvas id="canvasOutput" ref={canvasRef} style={{position: 'absolute'}}></canvas>
          <div ref={guideRef} id="guidance" style={{position: 'absolute', color: "white", textAlign: "center", bottom: "40px", width: "100%"}}>Position document inside boundary</div>
          <div ref={screenReaderRef} role="alert" style={{clipPath: 'inset(50%)', height: '1px', overflow: 'hidden', position: 'absolute', whiteSpace: 'nowrap', width: '1px'}}>Position document inside boundary</div>
        </div>
      </div>
      <div style={{position: 'relative'}}><a href="/camster">Back to settings</a></div>
    </div>
  );
}

export default Camera;