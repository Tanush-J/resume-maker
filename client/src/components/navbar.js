import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "../config_db/firebase";
import { authenticate } from "../redux/authSlice";
import { toast } from "react-toastify";
import { useState } from "react";

import classes from './navbar.module.css'

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [navToggle, setNavToggle] = useState(false);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)

  const handleLogout = () => {
    signOut(auth)
    .then(() => {
      localStorage.removeItem('yourpholio')
      dispatch(authenticate(false));
      toast.success('Logged out successfully')
      navigate('/signin')
    })
    .catch(() => {
      toast.error('Error logging out')
    })
  }

  return (
    <>
      <nav className={classes.navbar}>
        {isAuthenticated && (
          <>
            <NavLink to="/">Details</NavLink>
            <NavLink style={{margin: '0 1rem'}} to="/resume">Resume</NavLink>
          </>
        )}

        {isAuthenticated && <button onClick={() => setNavToggle(prevState => !prevState)} className={classes.navbarToggler} >
          ☰
        {navToggle && <div className={classes.navbarPopdown} onClick={handleLogout}>Logout</div>}
        </button>}

        {!isAuthenticated ? (
          <>
            <NavLink style={{margin: '0 1rem 0 auto'}} to="/signin">Sign In</NavLink>
            <NavLink to="/signup">Sign Up</NavLink>
          </>
        ) : (
          <span onClick={handleLogout} style={{ cursor: "pointer", marginLeft: "auto" }}>Logout</span>
        )}
      </nav>
   
    </>
  );
}

export default Navbar;
