import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("healthconnect_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem("healthconnect_role") || null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("healthconnect_token") || null;
  });

  const login = (userData, userRole, userToken) => {
    setUser(userData);
    setRole(userRole);
    setToken(userToken);
    localStorage.setItem("healthconnect_user", JSON.stringify(userData));
    localStorage.setItem("healthconnect_role", userRole);
    if (userToken) {
      localStorage.setItem("healthconnect_token", userToken);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("healthconnect_user");
    localStorage.removeItem("healthconnect_role");
    localStorage.removeItem("healthconnect_token");
  };

  const isAuthenticated = !!user;
  const isRole = (roleName) => role === roleName;

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, isAuthenticated, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
