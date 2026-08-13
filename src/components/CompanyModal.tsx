import React, { useState, useEffect } from 'react'

type Empresa = {
  codigo: number
  cnpj?: string
  razaoSocial: string
  inscricao?: string
  endereco?: string
  representante?: string
}

export default function CompanyModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (e: Empresa) => void }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [form, setForm] = useState<Partial<Empresa>>({ razaoSocial: '' })

  useEffect(() => {
    let mounted = true
    import('../utils/db').then(async db => {
      await db.migrateFromLocalStorage()
      const raw = await db.dbGet('empresas')
      if (!mounted) return
      setEmpresas(raw || [])
    })
    return () => { mounted = false }
  }, [open])

  function nextCodigo() {
    const raw = localStorage.getItem('empresa_next')
    const n = raw ? Number(raw) : 1
    localStorage.setItem('empresa_next', String(n + 1))
    return n
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const novo: Empresa = { codigo: nextCodigo(), razaoSocial: form.razaoSocial || '', cnpj: form.cnpj, inscricao: form.inscricao, endereco: form.endereco, representante: form.representante }
    const updated = [...empresas, novo]
    setEmpresas(updated)
    import('../utils/db').then(async (db) => { await db.dbSet('empresas', updated) })
    setForm({ razaoSocial: '' })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
      <div className="bg-white rounded shadow max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Empresas</h4>
          <button onClick={onClose} className="text-gray-500">Fechar</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold mb-2">Cadastrar nova</h5>
            <form onSubmit={save} className="space-y-2">
              <input placeholder="Razão Social" value={form.razaoSocial || ''} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} className="w-full p-2 rounded" required />
              <input placeholder="CNPJ" value={form.cnpj || ''} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="w-full p-2 rounded" />
              <input placeholder="Inscrição Estadual" value={form.inscricao || ''} onChange={e => setForm({ ...form, inscricao: e.target.value })} className="w-full p-2 rounded" />
              <input placeholder="Endereço" value={form.endereco || ''} onChange={e => setForm({ ...form, endereco: e.target.value })} className="w-full p-2 rounded" />
              <input placeholder="Representante" value={form.representante || ''} onChange={e => setForm({ ...form, representante: e.target.value })} className="w-full p-2 rounded" />
              <div className="flex gap-2">
                <button className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>

          <div>
            <h5 className="font-semibold mb-2">Empresas cadastradas</h5>
            <div className="max-h-60 overflow-auto rounded p-2">
              {empresas.length === 0 && <p className="text-sm text-gray-500">Nenhuma empresa cadastrada.</p>}
              {empresas.map(e => (
                <div key={e.codigo} className="flex justify-between items-center border-b py-2">
                  <div>
                    <div className="text-sm font-medium">{e.codigo} — {e.razaoSocial}</div>
                    <div className="text-xs text-gray-500">{e.representante}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { onSelect(e); onClose() }} className="btn btn-primary">Selecionar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
