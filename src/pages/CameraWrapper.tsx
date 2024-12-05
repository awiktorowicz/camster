import React, { Suspense } from 'react';
import { useGlobalContext } from '../context/GlobalContext';

const Camera = React.lazy(() => import('../components/Camera'));

const CameraWrapper = () => {
  const [globalData] = useGlobalContext();
  //console.log(globalData);
  let props = {};
  if(globalData) {
    props = globalData;
  }

  return (
    <div>
      <Suspense fallback={<div>loading</div>}>
        {<Camera {...props} />}
      </Suspense>
    </div>
  );
};

export default CameraWrapper;
