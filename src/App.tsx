import { HashRouter, Route, Routes } from 'react-router-dom';
import CameraWrapper from './pages/CameraWrapper';
import Settings from './pages/Settings';
import GlobalContextProvider from './context/GlobalContext';

const App = () => {
  return (
    <HashRouter>
      <GlobalContextProvider>
        <Routes>
          <Route
            path="/"
            element={<Settings />}
          ></Route>
          <Route
            path="/camera"
            element={<CameraWrapper />}
          />
        </Routes>
      </GlobalContextProvider>
    </HashRouter>
  );
};

export default App;
