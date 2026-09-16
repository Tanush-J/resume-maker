import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { useSelector, useDispatch } from 'react-redux';

import Signup from './pages/signup/signup';
import Signin from './pages/signin/signin';
import ProtectedRoutes from './components/protectedroutes/protectedroutes'
import Navbar from './components/navbar/navbar'
import BuildResume from './components/resumeBuilder/buildResume';
import { authenticate } from './redux/authSlice';
import { loadingSelector } from './redux/loadingSlice';

function App() {
  // Use the useSelector hook to get the loading state from the Redux store
  const loading = useSelector(loadingSelector).loading;
  const userData = localStorage.getItem('yourpholio');
  const ifUserToken: string | null = userData ? JSON.parse(userData)?.uid : null
  const dispatch = useDispatch();

  if(ifUserToken){
    dispatch(authenticate(true));
  }

  return (
    <>
      <BrowserRouter>
        {loading && <div className='loading-screen'>
          <div className='dot1'></div>
          <div className='dot2'></div>
          <div className='dot3'></div>
        </div>}
        <Navbar />
        <Routes>
          <Route path="/" index element={<ProtectedRoutes><BuildResume /></ProtectedRoutes>} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
