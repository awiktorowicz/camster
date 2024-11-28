import {
  AutoCaptureConfig,
  ContourDetectionConfig,
} from '../AutoCaptureConfig';

export const InitialConfig: AutoCaptureConfig = {
  debug: true,

  detectionFrame: {
    width: 75,
    height: 75,
    cornerRadius: 5,
    thickness: 3,
  },

  guidancePoints: null,

  activeFeatures: ['contour', 'position'],

  features: [
    {
      name: 'Contour Detection',
      factoryName: 'contour',
      draw: {
        isClosed: true,
        thickness: 2,
        color: [255, 0, 0, 255],
      },
      minimumDetectableArea: 5000,
      detectedContour: null,
      result: {
        isValid: false,
        feedback: null,
      },
    } as ContourDetectionConfig,
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
    sideDetectionMargin: 20,
    holdingTime: 2000,
  },
};
