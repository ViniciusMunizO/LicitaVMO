import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bem-vindo</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="btn btn-ghost text-sm">Sair</button>
        </div>
      </div>
      <p className="text-sm text-gray-700">Use o menu para acessar as licitações.</p>
    </div>
  )
}
