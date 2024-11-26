import {
  AutoCaptureConfig,
  DetectionResult,
} from '../context/AutoCaptureConfig';

export enum FeatureValidationStatus {
  None,
  Some,
  All,
}

export class ValidationService {
  validationStatus: FeatureValidationStatus;
  private guidanceService: GuidanceService;
  private timeElapsed: number;
  private timerId: number | null;
  private autoCaptureConfig: AutoCaptureConfig;
  private isPictureTaken: boolean;

  constructor(
    autoCaptureConfig: AutoCaptureConfig,
    guidanceService: GuidanceService,
  ) {
    this.autoCaptureConfig = autoCaptureConfig;
    this.validationStatus = FeatureValidationStatus.None;
    this.guidanceService = guidanceService;
    this.timerId = null;
    this.timeElapsed = 0;
    this.isPictureTaken = false;
  }

  validateFeatures = async (detectionResults: DetectionResult[]) => {
    const invalidResults = detectionResults.filter((r) => !r.isValid);

    // can be done as switch for clarity
    // console.log(invalidResults);
    this.validationStatus =
      invalidResults.length === detectionResults.length
        ? FeatureValidationStatus.None
        : invalidResults.length === 0
        ? FeatureValidationStatus.All
        : FeatureValidationStatus.Some;

    switch (this.validationStatus) {
      case FeatureValidationStatus.None:
        this.guidanceService.updateGuidanceWithDefaultMessage();
        this.resetTimer();
        break;
      case FeatureValidationStatus.Some:
        // display first failed message
        this.guidanceService.updateGuidanceWithInvalidFeedback(
          invalidResults[0].feedback,
        );
        this.resetTimer();
        break;
      case FeatureValidationStatus.All:
        // !! This case just for debuging
        if (this.isPictureTaken) {
          await new Promise((r) => setTimeout(r, 1500));
          this.isPictureTaken = false;
        }
        // display hold steady message
        this.guidanceService.updateGuidanceWithHoldSteadyMessage();
        // start position validation
        this.validatePositionContinously(
          () => {
            this.guidanceService.updateGuidanceWithSuccessMessage();
            this.isPictureTaken = true;
          },
          () => this.guidanceService.updateGuidanceWithResetMessage(),
        );
        break;
    }
  };

  private validatePositionContinously = (
    onSucess: () => void,
    onRestart: () => void,
  ) => {
    // Poiston validation functionality
    if (!this.timerId) {
      this.timerId = window.setInterval(() => {
        // if (
        //   validatePosition(this.autoCaptureConfig) &&
        //   this.validationStatus === FeatureValidationStatus.All
        // )
        if (this.validationStatus === FeatureValidationStatus.All) {
          this.timeElapsed += 100;
          console.log(this.timeElapsed);
          if (
            this.timeElapsed >= this.autoCaptureConfig.validation.holdingTime
          ) {
            this.resetTimer();
            onSucess();
          }
        } else {
          this.resetTimer();
          onRestart();
        }
      }, 100);
    }
  };

  private resetTimer = () => {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.timeElapsed = 0;
  };

  // private validatePosition = () => {
  //   // return Math.floor(Math.random() * (2 - 0 + 1)) + 0;
  //   return 1;
  // };
}

export class GuidanceService {
  readonly defaultMessage: string;
  readonly holdSteadyMessage: string;

  // TODO: change from any
  guideRef: any;

  // TODO: constructor will be needed to pass references to the document type
  constructor(guideRef: React.MutableRefObject<HTMLDivElement | null>) {
    this.guideRef = guideRef;
    this.defaultMessage = 'Position your "DOCUMENT" in the frame';
    this.holdSteadyMessage = 'Hold steady to take a photo';
  }

  updateGuidance = (message: string | null) => {
    // updates the guidance functionality
    this.guideRef.current.innerText = message;
  };

  updateGuidanceWithDefaultMessage = () => {
    this.updateGuidance(this.defaultMessage);
  };

  updateGuidanceWithInvalidFeedback = (message: string | null) => {
    this.updateGuidance(message);
  };

  updateGuidanceWithHoldSteadyMessage = () => {
    this.updateGuidance(this.holdSteadyMessage);
  };

  updateGuidanceWithSuccessMessage = () => {
    this.updateGuidance('Success, photo taken.');
  };

  updateGuidanceWithResetMessage = () => {
    this.updateGuidance('Process of taking a picture got interrupted.');
  };
}
