import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

// A planilha de cotação sempre vem no mesmo layout de colunas (A a O), mas o
// texto do cabeçalho pode se repetir (ex: duas colunas "TOTAL") e o número de
// linhas preenchidas varia a cada licitação. Por isso a leitura é posicional
// (por índice de coluna), ignorando o texto do cabeçalho, e para no primeiro
// item sem descrição — o restante da planilha costuma vir com linhas em
// branco do modelo.
const COLUMNS = [
  'item', 'descricao', 'unidade', 'quantidade', 'valorEdital', 'totalEdital',
  'marca', 'apresentacao', 'anvisa', 'valorCusto', 'tx', 'custoUnitario', 'totalCusto',
  'status', 'custoCaixa',
] as const

function rowToItem(row: any[]): Record<string, any> {
  const item: Record<string, any> = {}
  COLUMNS.forEach((key, idx) => { item[key] = row[idx] ?? '' })
  return item
}

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
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      const dataRows = rows.slice(1) // linha 1 é o cabeçalho
      const parsed = dataRows
        .map(rowToItem)
        .filter(it => String(it.descricao || '').trim() !== '')
      setItems(parsed)
      import('../utils/db').then(async db => await db.dbSet(key, parsed))
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
          {items.slice(0, 50).map((it, i) => (
            <div key={i} className="text-sm border-b py-2">
              <div className="font-medium">Item {it.item || i + 1} — {it.descricao || '-'}</div>
              <div className="text-xs text-gray-700 mt-1">Uni: {it.unidade || '-'} — Qtd: {it.quantidade || '-'} — Marca: {it.marca || '-'}</div>
            </div>
          ))}
          {items.length > 50 && <p className="text-xs text-gray-500 mt-2">+ {items.length - 50} itens não exibidos aqui (todos foram importados).</p>}
        </div>
      </div>
    </div>
  )
}
