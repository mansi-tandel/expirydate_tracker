import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📅</span>
          <span className="brand-text">ExpiryTracker</span>
        </Link>
        
        <ul className="navbar-nav desktop-nav">
          {user ? (
            <>
              <li>
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  <span className="nav-icon">🏠</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/add-reminder" 
                  className={`nav-link ${isActive('/add-reminder') ? 'active' : ''}`}
                >
                  <span className="nav-icon">➕</span>
                  Add Reminder
                </Link>
              </li>
              <li>
                <Link 
                  to="/search-reminder" 
                  className={`nav-link ${isActive('/search-reminder') ? 'active' : ''}`}
                >
                  <span className="nav-icon">🔍</span>
                  Search
                </Link>
              </li>
              <li className="user-section">
                <div className="user-info">
                  <span className="user-avatar">👤</span>
                  <span className="user-name">{user.name}</span>
                </div>
                <button onClick={logout} className="logout-btn">
                  <span className="logout-icon">🚪</span>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link 
                  to="/signup" 
                  className={`nav-link signup-link ${isActive('/signup') ? 'active' : ''}`}
                >
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>

        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-nav">
          <ul className="mobile-nav-list">
            {user ? (
              <>
                <li>
                  <Link 
                    to="/" 
                    className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">🏠</span>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/add-reminder" 
                    className={`mobile-nav-link ${isActive('/add-reminder') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">➕</span>
                    Add Reminder
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/search-reminder" 
                    className={`mobile-nav-link ${isActive('/search-reminder') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">🔍</span>
                    Search
                  </Link>
                </li>
                <li className="mobile-user-section">
                  <div className="user-info">
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{user.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }} 
                    className="logout-btn"
                  >
                    <span className="logout-icon">🚪</span>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to="/login" 
                    className={`mobile-nav-link ${isActive('/login') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/signup" 
                    className={`mobile-nav-link signup-link ${isActive('/signup') ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


