import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const name = Cookies.get('userName');
    const role = Cookies.get('userRole');
    const profilePic = Cookies.get('userProfilePic');
    const teamCode = Cookies.get('userTeamCode');
    const teamName = Cookies.get('userTeamName');

    if (token && name) {
      setUser({ name, role, profilePic, teamCode, teamName });
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    Cookies.set('token', token, { expires: 1 });
    Cookies.set('userName', userData.name, { expires: 1 });
    Cookies.set('userRole', userData.role, { expires: 1 });
    if (userData.profilePic) {
      Cookies.set('userProfilePic', userData.profilePic, { expires: 1 });
    }
    if (userData.teamCode) {
      Cookies.set('userTeamCode', userData.teamCode, { expires: 1 });
    }
    if (userData.teamName) {
      Cookies.set('userTeamName', userData.teamName, { expires: 1 });
    }
    setUser({ ...userData, profilePic: userData.profilePic, teamCode: userData.teamCode, teamName: userData.teamName });
  };

  const updateProfile = (profilePic) => {
    Cookies.set('userProfilePic', profilePic, { expires: 1 });
    setUser(prev => ({ ...prev, profilePic }));
  };

  const updateTeamCode = (teamCode) => {
    Cookies.set('userTeamCode', teamCode, { expires: 1 });
    setUser(prev => ({ ...prev, teamCode }));
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('userName');
    Cookies.remove('userRole');
    Cookies.remove('userProfilePic');
    Cookies.remove('userTeamCode');
    Cookies.remove('userTeamName');
    setUser(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, updateTeamCode }}>
      {children}
    </AuthContext.Provider>
  );
};
