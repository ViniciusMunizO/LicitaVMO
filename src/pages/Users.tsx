import React, { useState, useEffect } from 'react'

type User = { id: number; name: string; role: 'admin' | 'user' }

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')

  useEffect(() => {
    const raw = localStorage.getItem('users')
    setUsers(raw ? JSON.parse(raw) : [])
  }, [])

  function nextId() {
    const raw = localStorage.getItem('users_next')
    const n = raw ? Number(raw) : 1
    localStorage.setItem('users_next', String(n + 1))
    return n
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const u: User = { id: nextId(), name, role }
    const updated = [...users, u]
    localStorage.setItem('users', JSON.stringify(updated))
    setUsers(updated)
    setName('')
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Gerenciar Usuários</h3>
      <div className="bg-white p-4 rounded shadow mb-4">
        <form onSubmit={add} className="flex gap-2 items-center">
          <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="p-2 rounded" required />
          <select value={role} onChange={e => setRole(e.target.value as any)} className="p-2 rounded">
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="btn btn-primary">Criar</button>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500"><th>ID</th><th>Nome</th><th>Role</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t"><td className="p-2">{u.id}</td><td className="p-2">{u.name}</td><td className="p-2">{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
