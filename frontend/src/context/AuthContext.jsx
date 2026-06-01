import { createContext, useContext, useState, useEffect } from 'react'
import { getUser, getToken, setAuthData, logout as doLogout } from '../utils/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser())
  const [token, setToken] = useState(getToken())

  const login = (token, userData) => {
    setAuthData(token, userData)
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    doLogout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
