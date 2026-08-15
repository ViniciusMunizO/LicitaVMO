import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { dbGet } from '../../utils/db'
import { exportElementsToPdf } from '../../utils/pdf'
import { formatDateTimeBR } from '../../utils/date'
import AttachmentsModal from '../../components/AttachmentsModal'
import DeclaracoesSection from '../../components/DeclaracoesSection'

export default function DetailLicitacao() {
  const { codigo } = useParams()
  const nav = useNavigate()
  const [model, setModel] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const printRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLDivElement | null>(null)

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
  const [openAttachments, setOpenAttachments] = useState(false)

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
          <strong>Data de Credenciamento</strong>
          <div className="mt-1">{formatDateTimeBR(model.dataCredenciamento, model.horaCredenciamento)}</div>
        </div>
        <div>
          <strong>Data da Licitação</strong>
          <div className="mt-1">{formatDateTimeBR(model.dataLicitacao, model.horaLicitacao)}</div>
        </div>
        <div>
          <strong>Tipo Objeto</strong>
          <div className="mt-1">{model.tipoObjeto || '-'}</div>
        </div>
      </div>

      <div className="mt-4">
        <strong>Objeto Licitação</strong>
        <div className="mt-1 whitespace-pre-wrap">{model.objetoLicitacao || '-'}</div>
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
          <div className="mt-2 overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 whitespace-nowrap">
                  <th className="p-2">Item</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Uni</th>
                  <th className="p-2">Qtd</th>
                  <th className="p-2">Valor Edital</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Marca</th>
                  <th className="p-2">Apresentação</th>
                  <th className="p-2">Nº Anvisa</th>
                  <th className="p-2">Valor Custo</th>
                  <th className="p-2">TX</th>
                  <th className="p-2">Custo + 15% (Uni)</th>
                  <th className="p-2">Total Custo</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Custo Caixa</th>
                  <th className="p-2">Vencedor</th>
                  <th className="p-2">Anexos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t whitespace-nowrap">
                    <td className="p-2">{it.item ?? idx + 1}</td>
                    <td className="p-2 whitespace-normal">{it.descricao || it.description || '-'}</td>
                    <td className="p-2">{it.unidade || '-'}</td>
                    <td className="p-2">{it.quantidade ?? it.qty ?? '-'}</td>
                    <td className="p-2">{it.valorEdital ?? '-'}</td>
                    <td className="p-2">{it.totalEdital ?? '-'}</td>
                    <td className="p-2">{it.marca || '-'}</td>
                    <td className="p-2">{it.apresentacao || '-'}</td>
                    <td className="p-2">{it.anvisa || '-'}</td>
                    <td className="p-2">{it.valorCusto ?? '-'}</td>
                    <td className="p-2">{it.tx ?? '-'}</td>
                    <td className="p-2">{it.custoUnitario ?? '-'}</td>
                    <td className="p-2">{it.totalCusto ?? '-'}</td>
                    <td className="p-2">{it.status || '-'}</td>
                    <td className="p-2">{it.custoCaixa ?? '-'}</td>
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
                        }} className="btn btn-ghost text-xs mt-1">Marcar/Desmarcar</button>
                      </div>
                    </td>
                    <td className="p-2">
                      {attachments.filter(a => a.linkedItemIndex !== undefined && a.linkedItemIndex === idx).length} anexos
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeclaracoesSection modelo={model} />

      <div className="mt-6 flex gap-2">
        <button onClick={async () => {
          if (!printRef.current) return
          await exportElementsToPdf([printRef.current], `checklist_${model.codigo}.pdf`, 'Checklist')
        }} className="btn btn-primary">Exportar Checklist (PDF)</button>
        <button onClick={async () => {
          if (!itemsRef.current) return
          await exportElementsToPdf([itemsRef.current], `itens_${model.codigo}.pdf`, 'Itens')
        }} className="btn btn-primary">Exportar Itens (PDF)</button>
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
