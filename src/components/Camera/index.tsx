import React, { useRef, useState, useContext, createContext } from 'react';
import Webcam from 'react-webcam';
import { isMobile } from 'react-device-detect';

import { CameraContext } from './CameraContext';
import AutoCapture from './AutoCapture';

const Camera = (props: any) => {

  // console.log(props);

  const [docDetected, setDocDetected] = useState(false);

  let autocaptureProps = {};
  if(props && props.autoCapture) {
    autocaptureProps = props.autoCapture;
  }

  const videoWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<Webcam>(null);
  const AutoCaptureRef = useRef<any>(null);

  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);

  const [guidanceWidth, setGuidanceWidth] = useState<number>(0);
  const [guidanceHeight, setGuidanceHeight] = useState<number>(0);

  const getVideoConstraints = () => {
    let videoConstraints = {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
    if (isMobile) {
      videoConstraints = {
        facingMode: 'environment',
        width: { ideal: window.innerHeight },
        height: { ideal: window.screen.width },
      };
    }
    return videoConstraints;
  };

  const drawGuidanceFrame = () => {
    const videoWidth = videoRef.current?.video?.videoWidth ? videoRef.current?.video?.videoWidth : 0;
    const videoHeight = videoRef.current?.video?.videoHeight ? videoRef.current?.video?.videoHeight : 0;

    const widthFactor = isMobile ? 1 : 2;

    setGuidanceWidth(Math.round(videoWidth * (props.autoCapture.detectionFrameWidth / 100)) / widthFactor);
    setGuidanceHeight(Math.round(videoHeight * (props.autoCapture.detectionFrameHeight / 100)));

    //console.log(Math.round(videoWidth * (props.autoCapture.detectionFrameWidth / 100)) / widthFactor);
    //console.log(videoHeight * (props.autoCapture.detectionFrameHeight / 100));
  }

  const videoStarted = () => {
    // seems to have issues on ios without delay
    setTimeout(() => {
      if (AutoCaptureRef.current) {
        setVideoWidth(videoRef.current?.video?.videoWidth ? videoRef.current?.video?.videoWidth : 0);
        setVideoHeight(videoRef.current?.video?.videoHeight ? videoRef.current?.video?.videoHeight : 0);
        drawGuidanceFrame();
        AutoCaptureRef.current.videoStarted();
      }
    }, 2000);
  };

  const videoConstraints = getVideoConstraints();

  return (
    <div>
      <div style={{ position: 'relative' }}>
        
        {/* react webcam component */}
        <div ref={videoWrapperRef}>
          <Webcam
            videoConstraints={videoConstraints}
            ref={videoRef}
            style={{ position: 'absolute' }}
            onUserMedia={videoStarted}
          />
        </div>
        {/* guidance frame */}
        <div style={{ position: 'absolute', zIndex: 2, width: videoWidth, height: videoHeight }}>
          { guidanceWidth && guidanceHeight ?
          <svg width={videoWidth} height={videoHeight} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="mask1">
                <rect mask="url(#mask1)" width={videoWidth} height={videoHeight} x="0" y="0" style={{ fill: 'white', stroke:'none', strokeWidth:5, opacity:0.5 }} />
                <rect width={guidanceWidth} height={guidanceHeight} x={videoWidth / 2 - guidanceWidth / 2} y={videoHeight / 2 - guidanceHeight / 2} rx="20" ry="20" />
              </mask>
            </defs>
            <rect mask="url(#mask1)" width={videoWidth} height={videoHeight} x="0" y="0" style={{ fill: 'white', stroke:'none', strokeWidth:5, opacity:0.5 }} />
            <rect width={guidanceWidth} height={guidanceHeight} x={videoWidth / 2 - guidanceWidth / 2} y={videoHeight / 2 - guidanceHeight / 2} rx="20" ry="20" style={{ fill: 'none', stroke:docDetected ? 'green' : 'black', strokeWidth:5, opacity:1 }} />
          </svg>
           : null }
        </div>
        {/* auto capture */}
        <div style={{ position: 'absolute', zIndex: 1 }}>
        <CameraContext.Provider value={{docDetected, setDocDetected}}>
          <AutoCapture {...autocaptureProps} ref={AutoCaptureRef} videoRef={videoRef} />
        </CameraContext.Provider>
        </div>

      </div>

      <div style={{ position: 'relative', zIndex: 3 }}>
        <a href="/camster">Back to settings</a>
      </div>
    </div>
  );
};

export default Camera;
