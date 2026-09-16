import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

import { auth } from "../../firebase";
import { authenticate } from "../../redux/authSlice";
import { useState } from "react";

import classes from './navbar.module.css'
import type { RootState } from "../../redux/store";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [navToggle, setNavToggle] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  const handleLogout = () => {
    signOut(auth)
    .then(() => {
      localStorage.removeItem('yourpholio')
      dispatch(authenticate(false));
      message.success('Logged out successfully')
      navigate('/signin')
    })
    .catch(() => {
      message.error('Error logging out')
    })
  }

  return (
    <>
      <nav className={classes.navbar}>
        {isAuthenticated && (
          <>
            <NavLink to="/">Build Resume</NavLink>
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
