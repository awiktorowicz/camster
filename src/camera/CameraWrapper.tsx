import React, { Suspense, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import DocPresets from './docPresets';

const Camera = React.lazy(() => import('./Camera'));

const CameraWrapper = () => {
  let [globalData, setGlobalData] = useGlobalContext();
  if (!globalData) {
    globalData = {
      autoCapture: {
        config: DocPresets.test,
      },
    };
  } else if (!globalData.autoCapture) {
    globalData.autoCapture.config = DocPresets.test;
  }

  useEffect(() => {
    setGlobalData(globalData);
  }, []);

  return (
    <div>
      <Suspense fallback={<div>loading</div>}>
        {<Camera {...globalData.autoCapture.config} />}
      </Suspense>
    </div>
  );
};

export default CameraWrapper;
