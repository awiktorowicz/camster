import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';

const Settings = () => {
  const navigate = useNavigate();

  const [globalData, setGlobalData] = useGlobalContext();

  // Guidance Frame
  const [detectionFrameWidth, setDetectionFrameWidth] = useState<number>(75);
  const [detectionFrameHeight, setDetectionFrameHeight] = useState<number>(75);

  // Debug mode
  const handleDebugClick = () => setDebugMode(!debugMode);
  const [debugMode, setDebugMode] = useState(true);

  const launchCamera = () => {
    let autoCaptureConfig = {
      debug: debugMode,
      detectionFrameWidth: detectionFrameWidth,
      detectionFrameHeight: detectionFrameHeight
    };

    let newData = globalData;
    newData.autoCapture = autoCaptureConfig;

    setGlobalData(newData);
    navigate('/camera');
  };

  return (
    <div>
      <h1>Settings</h1>

      <div>
        <label>Width: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={detectionFrameWidth}
          onChange={(e) => setDetectionFrameWidth(parseInt(e.target.value))}
        ></input>
        %
      </div>
      <div>
        <label>Height: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={detectionFrameHeight}
          onChange={(e) => setDetectionFrameHeight(parseInt(e.target.value))}
        ></input>
        %
      </div>

      <h2>Debug Mode</h2>
      <div>
        <label htmlFor="debug">Debug:</label>
        <input
          type="checkbox"
          id="debug"
          name="debug"
          onClick={handleDebugClick}
          defaultChecked={debugMode}
        />
      </div>

      <button
        style={{ marginTop: 10 }}
        onClick={launchCamera}
      >
        Launch camera
      </button>
    </div>
  );
};
export default Settings;
