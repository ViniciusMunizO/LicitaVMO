import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import ListLicitacoes from './pages/Licitacoes/List'
import FormLicitacao from './pages/Licitacoes/Form'
import DetailLicitacao from './pages/Licitacoes/Detail'
import Users from './pages/Users'
import AdminAudit from './pages/AdminAudit'
import { AdminRoute } from './components/AdminRoute'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="bg-white shadow p-4">
        <div className="container-fixed flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="brand text-lg">LicitaVMO</Link>
            <Link to="/licitacoes" className="nav-link text-sm">Licitações</Link>
            {user?.role === 'admin' && <Link to="/users" className="nav-link text-sm">Usuários</Link>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <Link to="/login" className="btn btn-ghost">Sair</Link>
          </div>
        </div>
      </nav>
      <main className="container-fixed p-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/licitacoes" element={<ProtectedRoute><ListLicitacoes /></ProtectedRoute>} />
          <Route path="/licitacoes/novo" element={<ProtectedRoute><FormLicitacao /></ProtectedRoute>} />
          <Route path="/licitacoes/:codigo" element={<ProtectedRoute><DetailLicitacao /></ProtectedRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  )
}
