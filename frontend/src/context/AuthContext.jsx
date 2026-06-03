/**
 * @file        AuthContext.jsx
 * @module      AuthContext
 * @description Provides authentication state context to components.
 * @layer       config
 * @author      Architect Agent
 * @version     1.0.0
 */

import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

/**
 * @function  AuthProvider
 * @summary   Provides authentication context to all child React components
 * @param     {object}  props           - React component properties
 * @param     {React.ReactNode} props.children - Child elements to wrap
 * @returns   {React.ReactElement} The Context Provider markup
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
