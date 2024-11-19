import ContourDetection from './contourDetection';
import GlareDetection from './glareDetection';
import { IFeature } from './IFeature';

const featureList: { [key: string]: new (config: any) => IFeature } = {
  contour: ContourDetection,
  glare: GlareDetection,
};

export const createFeature = (type: string, config: any): IFeature => {
  const Feature = featureList[type];
  if (!Feature) throw new Error(`Feature ${type} not found`);
  return new Feature(config);
};
