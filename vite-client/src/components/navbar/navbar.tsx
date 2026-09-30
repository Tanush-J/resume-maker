import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import { Button, Tooltip, message } from "antd";
import {
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  CloseOutlined,
  LogoutOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import { auth } from "../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { AuthModal } from "../auth/authModal";
import type { RootState } from "../../redux/store";

import classes from './navbar.module.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success('Logged out successfully');
      setMobileMenuOpen(false);
      navigate('/');
    } catch {
      message.error('Error logging out');
    }
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={classes.navbar}>
        <div className={classes.navContainer}>
          {/* Brand Link */}
          <NavLink to="/" className={classes.brandLink} onClick={() => setMobileMenuOpen(false)}>
            <FileTextOutlined className={classes.brandIcon} />
            <span>Resume Maker</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className={classes.navLinks}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? `${classes.navLink} ${classes.navLinkActive}` : classes.navLink
              }
            >
              Dashboard
            </NavLink>

            <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
              <button
                className={classes.themeToggleBtn}
                onClick={toggleTheme}
                aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              >
                {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            {!isAuthenticated ? (
              <>
                <Button
                  type="text"
                  className={classes.actionBtn}
                  onClick={() => openAuth('signin')}
                >
                  Sign In
                </Button>
                <Button
                  type="primary"
                  className={classes.actionBtn}
                  onClick={() => openAuth('signup')}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className={classes.actionBtn}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className={classes.mobileToggle}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={classes.mobileMenu}>
            <NavLink
              to="/dashboard"
              className={classes.navLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>

            <div className={classes.mobileMenuActions}>
              <button
                className={classes.themeToggleBtn}
                onClick={toggleTheme}
                aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              >
                {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              </button>

              {!isAuthenticated ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button size="middle" onClick={() => openAuth('signin')}>
                    Sign In
                  </Button>
                  <Button type="primary" size="middle" onClick={() => openAuth('signup')}>
                    Sign Up
                  </Button>
                </div>
              ) : (
                <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default Navbar;
