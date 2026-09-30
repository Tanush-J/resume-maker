import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';

import ProtectedRoutes from './components/protectedroutes/protectedroutes'
import Navbar from './components/navbar/navbar'
import Dashboard from './pages/home/dashboard';
import LandingPage from './pages/landing/landingPage';
import BuildResume from './components/resumeBuilder/buildResume';
import { setAuthInitialized, setUser } from './redux/authSlice';
import { useSelector } from 'react-redux';
import { loadingSelector } from './redux/loadingSlice';
import { auth } from './firebase';

function App() {
  const loading = useSelector(loadingSelector).loading;
  const dispatch = useDispatch();

  // Initialize auth state once from Firebase (not during render) per plan §12
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch(setUser(user));
      dispatch(setAuthInitialized(true));
      // isAuthenticated derived from user in slice; no localStorage auth flag.
    });
    return unsubscribe;
  }, [dispatch]);

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
          {/* Public homepage — no auth required */}
          <Route path="/" element={<LandingPage />} />

          {/* User dashboard — lists resumes when logged in, or shows preview + auth prompt */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Protected routes — require authentication */}
          <Route path="/resumes/:resumeId/edit" element={<ProtectedRoutes><BuildResume /></ProtectedRoutes>} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
