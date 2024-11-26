import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoCaptureConfig } from '../context/AutoCaptureConfig';
import { useGlobalContext } from '../context/GlobalContext';
import DocPresets from '../context/initialValues/docPresets';
import { InitialConfig } from '../context/initialValues/initialConfig';

const Settings = () => {
  const navigate = useNavigate();

  // TODO: Update setting with the edge detection instead of area
  // const [documentCapturingType, setDocumentCapturingType] = useState('area');

  // const [capturingMargin, setCapturingMargin] = useState(10);

  const [globalData, setGlobalData] = useGlobalContext();

  // Guidance Frame
  const [detectionFrameWidth, setDetectionFrameWidth] = useState<number>(75);
  const [detectionFrameHeight, setDetectionFrameHeight] = useState<number>(75);
  const [detectionFrameCornerRadius, setDetectionFrameCornerRadius] =
    useState<number>(10);
  const [detectionFrameThickness, setDetectionFrameThickness] =
    useState<number>(3);

  const selectChange = (val: string) => {
    setDetectionFrameWidth(
      DocPresets[val as keyof typeof DocPresets].documentWidth,
    );
    setDetectionFrameHeight(
      DocPresets[val as keyof typeof DocPresets].documentHeight,
    );
  };

  // Contour detection
  const [contourDetectionThickness, setContourDetectionThickness] =
    useState<number>(2);
  const [contourDetectionColour, setContourDetectionColour] = useState<
    number[]
  >([255, 0, 0, 255]);
  const [
    contourDetectionMinimumDetectableArea,
    setContourDetectionMinimumDetectableArea,
  ] = useState<number>(5000);

  // Active detection features
  const [activeFeatures, setActiveFeatures] = useState<string[]>([
    'contour',
    'position',
  ]);

  const handleCheckboxChange = (value: string) => {
    setActiveFeatures((prevValues) =>
      prevValues.includes(value)
        ? prevValues.filter((feature) => feature !== value)
        : [...prevValues, value],
    );
  };

  // Validation
  const [sideDetectionMargin, setSideDetectionMargin] = useState<number>(10);
  const [holdingTime, setHoldingTime] = useState<number>(2000);

  // Debug mode
  const handleDebugClick = () => setDebugMode(!debugMode);
  const [debugMode, setDebugMode] = useState(true);

  const launchCamera = () => {
    let autoCaptureConfig: AutoCaptureConfig = {
      debug: debugMode,
      detectionFrame: {
        width: detectionFrameWidth,
        height: detectionFrameHeight,
        cornerRadius: detectionFrameCornerRadius,
        thickness: detectionFrameThickness,
      },
      guidancePoints: null,
      activeFeatures: activeFeatures,
      features: [
        {
          name: 'Contour Detection',
          factoryName: 'contour',
          draw: {
            isClosed: true,
            thickness: contourDetectionThickness,
            color: contourDetectionColour,
          },
          minimumDetectableArea: contourDetectionMinimumDetectableArea,
          detectedContour: null,
          result: {
            isValid: false,
            feedback: null,
          },
        },
        {
          name: 'Position Detection',
          factoryName: 'position',
          draw: undefined,
          result: {
            isValid: false,
            feedback: null,
          },
        },
      ],
      detectionResults: [],
      validation: {
        sideDetectionMargin: sideDetectionMargin,
        holdingTime: holdingTime,
      },
    };

    setGlobalData({ autoCapture: autoCaptureConfig });
    navigate('/camera');
  };

  const hexToRGBA = (hex: string): number[] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return [r, g, b, 255];
  };

  const RGBAToHex = (rgba: number[]): string => {
    return (
      '#' +
      ((1 << 24) + (rgba[0] << 16) + (rgba[1] << 8) + rgba[2])
        .toString(16)
        .slice(1)
    );
  };

  return (
    <div>
      <h1>Settings</h1>

      <h2>Guidance Frame</h2>
      <div>
        <label>Choose a preset: </label>
        <select
          name="documentType"
          id="document-select"
          onChange={(e) => selectChange(e.target.value)}
        >
          <option
            value=""
            key={'0'}
          >
            None
          </option>
          {Object.keys(DocPresets).map((key) => (
            <option
              key={key}
              value={key}
            >
              {key}
            </option>
          ))}
        </select>
      </div>
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
      <div>
        <label>Corner radius: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={detectionFrameCornerRadius}
          onChange={(e) =>
            setDetectionFrameCornerRadius(parseInt(e.target.value))
          }
        ></input>
        % Not Implemented!
      </div>
      <div>
        <label>Frame thickness: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={detectionFrameThickness}
          onChange={(e) => setDetectionFrameThickness(parseInt(e.target.value))}
        ></input>
      </div>
      <h2>Contour Detection</h2>
      <div>
        <label>Colour: </label>
        <input
          type="color"
          value={RGBAToHex(contourDetectionColour)}
          onChange={(e) => setContourDetectionColour(hexToRGBA(e.target.value))}
        ></input>
      </div>
      <div>
        <label>Frame thickness: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={contourDetectionThickness}
          onChange={(e) =>
            setContourDetectionThickness(parseInt(e.target.value))
          }
        ></input>
      </div>
      <div>
        <label>Minimum detectable area: </label>
        <input
          type="number"
          min="1"
          max="10000"
          value={contourDetectionMinimumDetectableArea}
          onChange={(e) =>
            setContourDetectionMinimumDetectableArea(parseInt(e.target.value))
          }
        ></input>
      </div>

      <h2>Active Features</h2>
      <div>
        {InitialConfig.features.map((x) => (
          <>
            {/* //TODO: Is causing key warning */}
            <input
              type="checkbox"
              id={x.factoryName}
              value={x.factoryName}
              checked={activeFeatures.includes(x.factoryName)}
              onChange={() => handleCheckboxChange(x.factoryName)}
            ></input>
            <label>{x.name}</label>
          </>
        ))}
      </div>

      <h2>Validation</h2>
      <div>
        <label htmlFor="sideValidationMargin">Side validation margin: </label>
        <input
          type="number"
          min="1"
          max="100"
          value={sideDetectionMargin}
          onChange={(e) => setSideDetectionMargin(parseInt(e.target.value))}
        ></input>
        %
      </div>
      <div>
        <label htmlFor="holdingTime">
          Time to hold steady until the picture is taken:{' '}
        </label>
        <input
          type="number"
          min="1"
          max="1000"
          value={holdingTime}
          onChange={(e) => setHoldingTime(parseInt(e.target.value))}
        ></input>
        ms
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
