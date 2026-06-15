import { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('orbit_token') || null);
  const [userId, setUserId] = useState(localStorage.getItem('orbit_userId') || null);

  // When a user successfully logs in, we save their token in LocalStorage
  const login = (newToken, newUserId) => {
    setToken(newToken);
    setUserId(newUserId);
    localStorage.setItem('orbit_token', newToken);
    localStorage.setItem('orbit_userId', newUserId);
  };

  // When they log out, we delete it
  const logout = () => {
    setToken(null);
    setUserId(null);
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_userId');
  };

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
