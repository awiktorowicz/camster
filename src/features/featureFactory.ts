import { AutoCaptureConfig } from '../context/AutoCaptureConfig';
import ContourDetection from './contourDetection';
import GlareDetection from './glareDetection';
import { IFeature } from './IFeature';
import { PositionDetection } from './positionDetection';

const featureList: {
  [key: string]: new (config: any, setGlobalData: any) => IFeature;
} = {
  contour: ContourDetection,
  glare: GlareDetection,
  position: PositionDetection,
};

export const createFeature = (
  type: string,
  config: AutoCaptureConfig,
  // !! setGlobalData is not needed anymore
  setGlobalData: any,
): IFeature => {
  const Feature = featureList[type];
  if (!Feature) throw new Error(`Feature ${type} not found`);
  return new Feature(
    // config.features.find((f) => f.factoryName === type),
    config,
    setGlobalData,
  );
};
