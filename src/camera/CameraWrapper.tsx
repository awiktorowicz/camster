import React, { Suspense, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { InitialConfig } from '../context/initialValues/initialConfig';

const Camera = React.lazy(() => import('./Camera'));

const CameraWrapper = () => {
  let [globalData, setGlobalData] = useGlobalContext();

  if (!globalData) {
    globalData = { autoCapture: { ...InitialConfig } };
  }
  //  else if (!globalData.autoCapture) {
  //   globalData.autoCapture = { ...InitialConfig };
  // }

  useEffect(() => {
    setGlobalData(globalData);
  }, []);

  return (
    <div>
      <Suspense fallback={<div>loading</div>}>
        {<Camera {...globalData.autoCapture} />}
      </Suspense>
    </div>
  );
};

export default CameraWrapper;
