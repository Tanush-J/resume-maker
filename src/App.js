import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from 'react-redux';

import Details from './components/details'
import Signup from './signup/signup';
import Signin from './signin/signin';
import ProtectedRoutes from './protectedroutes/protectedroutes'
import Navbar from './components/navbar'
import Resume from './components/resume';
import { authenticate } from './redux/authSlice';

function App() {
  // Use the useSelector hook to get the loading state from the Redux store
  const loading = useSelector(state => state.loading.loading);
  const ifUserToken = JSON.parse(localStorage.getItem('yourpholio'))?.uid
  const dispatch = useDispatch();

  if(ifUserToken){
    dispatch(authenticate(true));
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        {loading && <div className='loading-screen'>
          <div className='dot1'></div>
          <div className='dot2'></div>
          <div className='dot3'></div>
        </div>}
        <Navbar />
        <Routes>
          <Route index element={<ProtectedRoutes><Details /></ProtectedRoutes>} />
          <Route path="/resume" element={<ProtectedRoutes><Resume /></ProtectedRoutes>} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
