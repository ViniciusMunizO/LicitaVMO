import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

export default function ItemsImportModal({ open, onClose, codigo }: { open: boolean; onClose: () => void; codigo: number }) {
  const key = `items_${codigo}`
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    import('../utils/db').then(async db => {
      await db.migrateFromLocalStorage()
      const raw = await db.dbGet(key)
      if (!mounted) return
      setItems(raw || [])
    })
    return () => { mounted = false }
  }, [open, codigo])

  const onFile = (f: File | null) => {
    if (!f) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      setItems(json)
      import('../utils/db').then(async db => await db.dbSet(key, json))
    }
    reader.readAsBinaryString(f)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
      <div className="bg-white rounded shadow max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Importar Itens — Licitação {codigo}</h4>
          <button onClick={onClose} className="text-gray-500">Fechar</button>
        </div>

        <div>
          <label className="btn btn-ghost inline-flex items-center gap-2">
            <input type="file" accept=".xls,.xlsx" onChange={e => onFile(e.target.files?.[0] || null)} className="hidden" />
            Selecionar planilha (.xls/.xlsx)
          </label>
        </div>

        <div className="mt-4 max-h-64 overflow-auto rounded p-2">
          {items.length === 0 && <p className="text-sm text-gray-500">Nenhum item importado.</p>}
          {items.slice(0,50).map((it, i) => (
            <div key={i} className="text-sm border-b py-2">
              <div className="font-medium">Linha {i + 1}</div>
              <div className="text-xs text-gray-700 mt-1">{Object.values(it).slice(0,5).map(v => String(v)).join(' — ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
