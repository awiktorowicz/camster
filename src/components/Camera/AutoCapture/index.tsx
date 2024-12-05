import React, { useRef, forwardRef, useImperativeHandle, useContext, useState } from 'react';
import AutoCaptureProps from './interface';
import { setupCanvasSize, renderVideoToCanvas, detectDocumentPoints, getGuidancePoints, calculatePointLineDistances, validatePoints  } from './utils';
import { animationManager } from './AnimationManger';
import { CameraContext } from '../CameraContext';

const AutoCapture = forwardRef<any, AutoCaptureProps>(({
  debug = false,
  detectionFrameWidth = 75,
  detectionFrameHeight = 75,
  videoRef
}, ref) => {

  const { docDetected, setDocDetected } = useContext(CameraContext);
  let detectedPoints: any = [];
  let noDetectionCounter: number = 0;

  let canvas: any;
  let guidancePoints: any;

  const [guidanceMsg, setGuidanceMsg] = useState<string>('Position document inside boundary');

  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasDebugRef = useRef<HTMLCanvasElement | null>(null);
  const guideRef = React.useRef<HTMLDivElement | null>(null);
  const screenReaderRef = React.useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    videoStarted: () => {
      initialiseCanvas();
      animationManager.registerTask(renderVideo, 60);
      animationManager.registerTask(detectDocument, 10);
    }
  }));

  const initialiseCanvas = () => {
    setupCanvasSize(
      videoRef,
      canvasRef,
      canvasWrapperRef
    );
    canvas = canvasRef.current ? canvasRef.current : { width: 0, height: 0};
    guidancePoints = getGuidancePoints(detectionFrameWidth, detectionFrameHeight, canvas.width, canvas.height);
  };

  const renderVideo = () => {
    renderVideoToCanvas(videoRef, canvasRef, detectionFrameWidth, detectionFrameHeight, detectedPoints, debug);
  };

  const detectDocument = () => {
    const largestPointsDetected = detectDocumentPoints(canvasRef);
    if (largestPointsDetected?.length === 4) {
      detectedPoints = largestPointsDetected;
      const isValid = validatePoints(detectedPoints, guidancePoints);
      // console.log(isValid);
      if (isValid.isValid) {
        setDocDetected(true);
        setGuidanceMsg('capturing');
      } else {
        setDocDetected(false);
        setGuidanceMsg(isValid.action ? isValid.action : 'Position document inside boundary');
      }
    } else {
      noDetectionCounter+=1;
    }
    if (noDetectionCounter > 10) {
      noDetectionCounter = 0;
      detectedPoints = [];
      setDocDetected(false);
      setGuidanceMsg('Position document inside boundary');
    }
  };

  return (
    <div
          ref={canvasWrapperRef}
          style={{ position: 'relative' }}
        >
          {/* Video canvas */}
          <canvas
            id="canvasOutput"
            ref={canvasRef}
            style={{ position: 'absolute' }}
          ></canvas>

          {/* Guidance frame + debug canvas */}
          <canvas
            id="canvasDebug"
            ref={canvasDebugRef}
            style={{ position: 'absolute' }}
          ></canvas>

          <div
            ref={guideRef}
            id="guidance"
            style={{
              position: 'absolute',
              color: 'white',
              textAlign: 'center',
              bottom: '40px',
              width: '100%',
            }}
          >
            {guidanceMsg}
          </div>
          <div
            ref={screenReaderRef}
            role="alert"
            style={{
              clipPath: 'inset(50%)',
              height: '1px',
              overflow: 'hidden',
              position: 'absolute',
              whiteSpace: 'nowrap',
              width: '1px',
            }}
          >
            {guidanceMsg}
          </div>
        </div>
  );
});

export default AutoCapture;
