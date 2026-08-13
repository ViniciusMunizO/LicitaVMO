import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { dbGet } from '../../utils/db'
import { exportElementsToPdf } from '../../utils/pdf'
import AttachmentsModal from '../../components/AttachmentsModal'

export default function DetailLicitacao() {
  const { codigo } = useParams()
  const nav = useNavigate()
  const [model, setModel] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const printRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLDivElement | null>(null)
  const snapshotContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { dbGet } = await import('../../utils/db')
      const list = (await dbGet('licitacoes')) || []
      const found = list.find((x: any) => String(x.codigo) === String(codigo))
      if (!mounted) return
      setModel(found || null)
      // load attachments and items
      try {
        const atKey = `attachments_${codigo}`
        const itKey = `items_${codigo}`
        const rawAt = (await dbGet(atKey)) || (localStorage.getItem(atKey) ? JSON.parse(localStorage.getItem(atKey) || '[]') : [])
        const rawIt = (await dbGet(itKey)) || (localStorage.getItem(itKey) ? JSON.parse(localStorage.getItem(itKey) || '[]') : [])
        if (mounted) {
          setAttachments(rawAt)
          setItems(rawIt)
        }
      } catch (err) {
        // ignore
      }
    }
    load()
    return () => { mounted = false }
  }, [codigo])

  const { user } = useAuth()
  const [openHistoryIndex, setOpenHistoryIndex] = useState<number | null>(null)
  const [openAttachments, setOpenAttachments] = useState(false)

  const downloadJson = (obj: any, filename = 'export.json') => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportSnapshotPdf = async (snapshot: any, filename = 'snapshot.pdf') => {
    // create a temporary container
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    container.style.padding = '20px'
    container.style.background = '#fff'
    container.id = `snapshot-export-${Date.now()}`
    container.innerHTML = `<h2>Licitação ${snapshot.codigo || ''} — ${snapshot.ano || ''}</h2>`
    const c = snapshot.contratante || {}
    container.innerHTML += `<div><strong>Contratante:</strong> ${c.codigo ? c.codigo + ' — ' : ''}${c.nome || snapshot.contratado || (snapshot.empresa && snapshot.empresa.razaoSocial) || '-'}</div>`
    if (snapshot.habilitacao) {
      container.innerHTML += `<h4>Habilitação</h4><ul>`
      Object.entries(snapshot.habilitacao).forEach(([k, v]) => {
        container.innerHTML += `<li>${k}: ${String(v)}</li>`
      })
      container.innerHTML += `</ul>`
    }
    if (snapshot.items && Array.isArray(snapshot.items)) {
      container.innerHTML += `<h4>Itens</h4><table style="width:100%;border-collapse:collapse"><thead><tr><th>#</th><th>Descrição</th><th>Unidade</th><th>Quantidade</th></tr></thead><tbody>`
      snapshot.items.forEach((it: any, idx: number) => {
        container.innerHTML += `<tr><td>${idx + 1}</td><td>${it.descricao || it.description || '-'}</td><td>${it.unidade || '-'}</td><td>${it.quantidade || it.qty || '-'}</td></tr>`
      })
      container.innerHTML += `</tbody></table>`
    }
    document.body.appendChild(container)
    try {
      await exportElementsToPdf([container], filename)
    } finally {
      document.body.removeChild(container)
    }
  }

  if (!model) return (
    <div className="bg-white p-6 rounded shadow max-w-3xl">
      <p className="text-sm text-gray-600">Licitação não encontrada.</p>
      <div className="mt-4">
        <button onClick={() => nav('/licitacoes')} className="btn btn-ghost">Voltar</button>
      </div>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded shadow max-w-3xl">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold">Licitação {model.codigo} — {model.ano}</h3>
        <div className="flex gap-2">
          <Link to={`/licitacoes/novo?edit=${model.codigo}`} className="btn btn-primary">Editar</Link>
          <button onClick={() => nav('/licitacoes')} className="btn btn-ghost">Voltar</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <strong>Contratante</strong>
          <div className="mt-1">{(model.contratante?.codigo ? model.contratante.codigo + ' — ' : '') + (model.contratante?.nome || model.contratado || model.empresa?.razaoSocial || '-')}</div>
        </div>
        <div>
          <strong>Número do Pregão</strong>
          <div className="mt-1">{model.numeroPregao || '-'}</div>
        </div>
        <div>
          <strong>Número do Processo</strong>
          <div className="mt-1">{model.numeroProcesso || '-'}</div>
        </div>
        <div>
          <strong>Portal</strong>
          <div className="mt-1">{model.portal || '-'}</div>
        </div>
        <div>
          <strong>Data da Licitação</strong>
          <div className="mt-1">{model.dataLicitacao || '-'}</div>
        </div>
        <div>
          <strong>Tipo Objeto</strong>
          <div className="mt-1">{model.tipoObjeto || '-'}</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Habilitação (Checklist)</h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {model.habilitacao ? Object.entries(model.habilitacao).map(([k, v]) => (
            <div key={k} className="text-sm text-gray-700">{k}: {String(v)}</div>
          )) : <div className="text-sm text-gray-500">Sem dados de habilitação</div>}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Anexos</h4>
        <div className="mt-2">
          <button onClick={() => setOpenAttachments(true)} className="btn btn-ghost">Gerenciar Anexos</button>
        </div>
        {attachments.length === 0 ? (
          <div className="text-sm text-gray-500 mt-2">Nenhum anexo</div>
        ) : (
          <ul className="mt-2 list-disc ml-5">
            {attachments.map((a, i) => (
              <li key={i} className="text-sm">
                <strong>{a.category || 'Anexo'}</strong>: {a.name || `anexo-${i}`}
                {a.linkedItemIndex !== undefined && a.linkedItemIndex !== null && items[a.linkedItemIndex] && (
                  <span className="ml-2 text-xs text-gray-600">(vinculado ao item #{a.linkedItemIndex + 1})</span>
                )}
                {a.data && <a className="ml-2 link-primary" href={a.data} target="_blank" rel="noreferrer">Abrir</a>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Itens</h4>
        {items.length === 0 ? (
          <div className="text-sm text-gray-500 mt-2">Nenhum item importado</div>
        ) : (
          <table className="w-full table-auto mt-2">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="p-2">#</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Unidade</th>
                <th className="p-2">Quantidade</th>
                <th className="p-2">Vencedor</th>
                <th className="p-2">Anexos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{it.descricao || it.description || '-'}</td>
                  <td className="p-2">{it.unidade || '-'}</td>
                  <td className="p-2">{it.quantidade || it.qty || '-'}</td>
                  <td className="p-2">
                    {it.vencedor ? <span className="text-sm font-medium text-green-600">Vencedor</span> : <span className="text-sm text-gray-600">—</span>}
                    <div className="mt-1">
                      <button onClick={async () => {
                        const key = `items_${model.codigo}`
                        const { dbGet, dbSet } = await import('../../utils/db')
                        const list = (await dbGet(key)) || []
                        list[idx] = { ...(list[idx] || {}), vencedor: !list[idx]?.vencedor }
                        await dbSet(key, list)
                        setItems(list)
                        try {
                          const { auditLog } = await import('../../utils/audit')
                          const user = localStorage.getItem('user_name') || undefined
                          await auditLog('item_mark_winner', { codigo: model.codigo, itemIndex: idx, vencedor: list[idx].vencedor, descricao: list[idx].descricao }, user)
                        } catch (err) { /* ignore */ }
                      }} className="btn btn-ghost text-xs mt-1">Marcar/Desmarcar vencedor</button>
                    </div>
                  </td>
                  <td className="p-2">
                    {attachments.filter(a => a.linkedItemIndex !== undefined && a.linkedItemIndex === idx).length} anexos
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={async () => {
          if (!printRef.current) return
          await exportElementsToPdf([printRef.current], `checklist_${model.codigo}.pdf`)
        }} className="btn btn-primary">Exportar Checklist (PDF)</button>
        <button onClick={async () => {
          if (!itemsRef.current) return
          await exportElementsToPdf([itemsRef.current], `itens_${model.codigo}.pdf`)
        }} className="btn btn-primary">Exportar Itens (PDF)</button>
        <button onClick={() => downloadJson(model, `licitacao_${model.codigo}.json`)} className="btn btn-ghost">Exportar JSON</button>
        <button onClick={async () => await exportSnapshotPdf(model, `licitacao_${model.codigo}_snapshot.pdf`)} className="btn btn-ghost">Exportar PDF (JSON snapshot)</button>
      </div>

      {/* hidden printable DOM */}
      <div style={{ position: 'absolute', left: -9999 }} aria-hidden>
        <div ref={printRef} style={{ width: 800, padding: 20, background: '#fff' }}>
          <h2>Checklist — Licitação {model.codigo} / {model.ano}</h2>
          <div><strong>Contratante:</strong> {model.contratado || model.empresa?.razaoSocial || '-'}</div>
          <div style={{ marginTop: 12 }}>
            <h4>Habilitação</h4>
            <ul>
              {model.habilitacao ? Object.entries(model.habilitacao).map(([k, v]) => (<li key={k}>{k}: {String(v)}</li>)) : <li>Sem dados</li>}
            </ul>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>Anexos</h4>
            <ul>
              {attachments.map((a, i) => (<li key={i}>{a.name || `anexo-${i}`}</li>))}
            </ul>
          </div>
        </div>

        <div ref={itemsRef} style={{ width: 800, padding: 20, background: '#fff' }}>
          <h2>Itens — Licitação {model.codigo}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{it.descricao || it.description || '-'}</td>
                  <td>{it.unidade || '-'}</td>
                  <td>{it.quantidade || it.qty || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6">
        <h4 className="font-semibold">Histórico de versões</h4>
        {(!model?.history || model.history.length === 0) ? (
          <div className="text-sm text-gray-500 mt-2">Sem versões anteriores</div>
        ) : (
          <div className="mt-2 space-y-2">
            {model.history.map((h: any, idx: number) => (
              <div key={idx} className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">Versão #{idx + 1} — {new Date(h.at).toLocaleString()} — por {h.by || 'unknown'}</div>
                  <div className="flex gap-2">
                      <button onClick={() => setOpenHistoryIndex(openHistoryIndex === idx ? null : idx)} className="text-sm link-primary">Visualizar</button>
                      <button onClick={() => downloadJson(h.snapshot, `licitacao_${model.codigo}_v${idx+1}.json`)} className="text-sm bg-gray-100 px-2 py-1 rounded">Baixar JSON</button>
                      <button onClick={async () => await exportSnapshotPdf(h.snapshot, `licitacao_${model.codigo}_v${idx+1}.pdf`)} className="text-sm bg-gray-100 px-2 py-1 rounded">Exportar PDF</button>
                    </div>
                </div>
                {openHistoryIndex === idx && (
                  <pre className="mt-2 text-xs bg-white p-2 border rounded max-h-48 overflow-auto">{JSON.stringify(h.snapshot, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* (Revert removed) */}

      <AttachmentsModal open={openAttachments} onClose={async () => {
        setOpenAttachments(false)
        try {
          const { dbGet } = await import('../../utils/db')
          const rawAt = (await dbGet(`attachments_${model.codigo}`)) || []
          setAttachments(rawAt)
        } catch (err) { /* ignore */ }
      }} codigo={Number(model.codigo)} />
    </div>
  )
}
