import { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('orbit_token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('orbit_refreshToken') || null);
  const [userId, setUserId] = useState(localStorage.getItem('orbit_userId') || null);

  // When a user successfully logs in, we save their tokens in LocalStorage
  const login = (newToken, newRefreshToken, newUserId) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    setUserId(newUserId);
    localStorage.setItem('orbit_token', newToken);
    localStorage.setItem('orbit_refreshToken', newRefreshToken);
    localStorage.setItem('orbit_userId', newUserId);
  };

  // When they log out, we delete it
  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUserId(null);
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_refreshToken');
    localStorage.removeItem('orbit_userId');
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, userId, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
