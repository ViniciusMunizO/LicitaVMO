import React, { createContext, useContext, useState, ReactNode } from 'react'

type User = {
  id: number
  name: string
  role: 'admin' | 'user'
}

type AuthContextValue = {
  user: User | null
  login: (name: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) as User : null
  })

  const login = async (name: string, password: string) => {
    // simple stub: any password allowed; 'admin' user becomes administrator
    const u: User = { id: 1, name, role: name === 'admin' ? 'admin' : 'user' }
    localStorage.setItem('user_name', name)
    localStorage.setItem('auth_user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
