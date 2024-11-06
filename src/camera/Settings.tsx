import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DocPresets from "./docPresets"
import { useGlobalContext } from "../GlobalContext";

const Settings = () => {
  const navigate = useNavigate();

  const handleDebugClick = () => setDebugChecked(!debugChecked);

  const [documentWidthValue, setDocumentWidthValue] = useState(DocPresets.passport.documentWidth);
  const [documentHeightValue, setDocumentHeightValue] = useState(DocPresets.passport.documentHeight);

  const [documentCapturingType, setDocumentCapturingType] = useState('area');

  const [capturingMargin, setCapturingMargin] = useState(10);

  const [debugChecked, setDebugChecked] = useState(false);

  const [globalData, setGlobalData] = useGlobalContext();

  const selectChange = (val: string) => {
    setDocumentWidthValue(DocPresets[val as keyof typeof DocPresets].documentWidth);
    setDocumentHeightValue(DocPresets[val as keyof typeof DocPresets].documentHeight);
  }

  const launchCamera = () => {
    setGlobalData({
      autoCapture: {
        config: {
          documentWidth: documentWidthValue,
          documentHeight: documentHeightValue,
          capturingType: documentCapturingType,
          capturingMargin: capturingMargin,
          debug: debugChecked,
        },
      },
    });
    navigate('/camera');
  }

  return (
    <div>
      <h2>Settings</h2>

      <div>
        <label htmlFor="cars">Choose a preset:</label>
        <select name="documentType" id="document-select" onChange={e => selectChange(e.target.value)}>
          <option value="passport">Passport</option>
          <option value="dl">Driving license</option>
        </select>
      </div>

      <div>
        <label htmlFor="documentWidth">Document width:</label>
        <input type="number" id="documentWidth" name="documentWidth" min="1" max="100" value={documentWidthValue} onChange={e => setDocumentWidthValue(parseInt(e.target.value, 10))} />%
      </div>

      <div>
        <label htmlFor="documentHeight">Document height:</label>
        <input type="number" id="documentHeight" name="documentHeight" min="1" max="100" value={documentHeightValue} onChange={e => setDocumentHeightValue(parseInt(e.target.value, 10))} />%
      </div>

      <div>
        <label htmlFor="toleranceWidth">Tolerance width:</label>
        <input type="number" id="toleranceWidth" name="toleranceWidth" min="1" max="100"/>%
      </div>

      <div>
        <label htmlFor="toleranceHeight">Tolerance height:</label>
        <input type="number" id="toleranceHeight" name="toleranceHeight" min="1" max="100" />%
      </div>

      <div>
        <label htmlFor="cornerRadius">Corner radius:</label>
        <input type="number" id="cornerRadius" name="cornerRadius" min="1" max="100" />%
      </div>

      <div>
        <label htmlFor="detectionMethod">Capturing Method By: </label>
        <select onChange={(e) => setDocumentCapturingType(e.target.value)}>
          <option value="area">Area</option>
          <option value="edges">Side Edges</option>
        </select>
      </div>

      {documentCapturingType === 'edges' && (
        <div>
          <label htmlFor="capturingMargin">
            Allowed distance from the sides (0-1)
          </label>
          <input
            type="number"
            id="capturingMargin"
            name="capturingMargin"
            min="0"
            max="100"
            value={capturingMargin}
            onChange={(e) => setCapturingMargin(parseInt(e.target.value))}
          />
          %
        </div>
      )}

      <div>
        <label htmlFor="debug">debug:</label>
        <input type="checkbox" id="debug" name="debug" onClick={handleDebugClick} defaultChecked={debugChecked} />
      </div>

      <button onClick={launchCamera}>
        Launch camera
      </button>

    </div>
  );
}
export default Settings;