import React, { useEffect, useState } from 'react'

type Contratante = {
  codigo: string
  nome: string
  uf: string
}

export default function ContractorModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (c: Contratante) => void }) {
  const [list, setList] = useState<Contratante[]>([])
  const [form, setForm] = useState<Partial<Contratante>>({ nome: '', uf: '' })

  useEffect(() => {
    let mounted = true
    import('../utils/db').then(async db => {
      await db.migrateFromLocalStorage()
      const raw = await db.dbGet('contratantes')
      if (!mounted) return
      setList(raw || [])
    })
    return () => { mounted = false }
  }, [open])

  function nextCodigo() {
    const raw = localStorage.getItem('contratante_next')
    const n = raw ? Number(raw) : 1
    localStorage.setItem('contratante_next', String(n + 1))
    return String(n).padStart(4, '0')
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const novo: Contratante = { codigo: nextCodigo(), nome: form.nome || '', uf: (form.uf || '').toUpperCase() }
    const updated = [...list, novo]
    setList(updated)
    import('../utils/db').then(async db => await db.dbSet('contratantes', updated))
    setForm({ nome: '', uf: '' })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
      <div className="bg-white rounded shadow max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Contratantes (Municípios)</h4>
          <button onClick={onClose} className="text-gray-500">Fechar</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold mb-2">Cadastrar novo</h5>
            <form onSubmit={save} className="space-y-2">
              <input placeholder="Nome do Município" value={form.nome || ''} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full p-2 rounded" required />
              <input placeholder="UF" value={form.uf || ''} onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })} className="w-full p-2 rounded" maxLength={2} required />
              <div className="flex gap-2">
                <button className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>

          <div>
            <h5 className="font-semibold mb-2">Contratantes cadastrados</h5>
            <div className="max-h-60 overflow-auto rounded p-2">
              {list.length === 0 && <p className="text-sm text-gray-500">Nenhum contratante cadastrado.</p>}
              {list.map(c => (
                <div key={c.codigo} className="flex justify-between items-center border-b py-2">
                  <div>
                    <div className="text-sm font-medium">{c.codigo} — {c.nome} / {c.uf}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { onSelect(c); onClose() }} className="btn btn-primary">Selecionar</button>
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
