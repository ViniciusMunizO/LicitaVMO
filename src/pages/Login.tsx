import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [name, setName] = useState('admin')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(name, password)
    nav('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Usuário</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded" />
        </div>
        <button className="btn btn-primary">Entrar</button>
      </form>
    </div>
  )
}
