import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  useEffect(() => {
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, [token]);

  const login = (authToken, userData) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // redirect user to login page after logout
    try {
      navigate('/login', { replace: true });
    } catch (e) {
      // navigate may be undefined if used outside router, ignore
    }
  };

  return (
    <div className="App">
      <Navbar user={user} logout={logout} />
      <div className="container">
        <Outlet context={{ user, login, logout }} />
      </div>
    </div>
  );
}

export default App;


