import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import ContractorModal from '../../components/ContractorModal'
import AttachmentsModal from '../../components/AttachmentsModal'
import ItemsImportModal from '../../components/ItemsImportModal'
import PrintableChecklist from '../../components/PrintableChecklist'
import { exportElementsToPdf } from '../../utils/pdf'
import { nowInBrasilia } from '../../utils/date'
import { DateInputBR, TimeInputBR } from '../../components/DateTimeBR'

type Licitacao = {
  codigo: number
  ano: number
  contratado?: string
  numeroPregao?: string
  numeroProcesso?: string
  portal?: string
  tipoObjeto?: string
  objetoLicitacao?: string
  dataCredenciamento?: string
  horaCredenciamento?: string
  dataLicitacao?: string
  horaLicitacao?: string
  tipoDisputa?: string
  definJulgamento?: string
  prazoGarantia?: string
  vigenciaContrato?: string
  habilitacao?: any
  [key: string]: any
}

function nextCodigo() {
  const raw = localStorage.getItem('licitacao_next')
  const n = raw ? Number(raw) : 1
  localStorage.setItem('licitacao_next', String(n + 1))
  return n
}

export default function FormLicitacao() {
  const { user } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [modelo, setModelo] = useState<Licitacao>({ codigo: 0, ano: new Date().getFullYear() })
  const [selectedContratante, setSelectedContratante] = useState<any>(null)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false)
  const [showItemsImportModal, setShowItemsImportModal] = useState(false)
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [contratantes, setContratantes] = useState<any[]>([])
  const checklistRef = useRef<HTMLDivElement | null>(null)
  const page1Ref = useRef<HTMLDivElement | null>(null)
  const page2Ref = useRef<HTMLDivElement | null>(null)
  const itemsOnlyRef = useRef<HTMLDivElement | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [habilitacao, setHabilitacao] = useState<any>({
    habilitacaoJuridica: false,
    habilitacaoFiscal: false,
    balanco: false,
    anvisa: false,
    boasPraticas: false,
    laudo: false,
    bula: false,
    ggrem: false,
    cti: false,
    outras: false,
    outrasTexto: '',
    observacaoInterna: ''
  })

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const params = new URLSearchParams(location.search)
      const edit = params.get('edit')
      await import('../../utils/db').then(m => m.migrateFromLocalStorage())
      // load contratantes
      try {
        const { dbGet } = await import('../../utils/db')
        const cs = (await dbGet('contratantes')) || []
        if (mounted) setContratantes(cs)
      } catch (err) { /* ignore */ }
      if (!mounted) return
      if (edit) {
        const { dbGet } = await import('../../utils/db')
        const list = (await dbGet('licitacoes')) || []
        const found = list.find((x: any) => String(x.codigo) === String(edit))
        if (found) {
          setModelo(found)
          setHabilitacao(found.habilitacao || ({} as any))
          setIsEditing(true)
          return
        }
      }
      const { date, time } = nowInBrasilia()
      setModelo(m => ({ ...m, codigo: nextCodigo(), dataCredenciamento: date, horaCredenciamento: time }))
    }
    init()
    return () => { mounted = false }
  }, [])

  const [isEditing, setIsEditing] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const pushAndSave = async () => {
      const { dbGet, dbSet } = await import('../../utils/db')
      const list = (await dbGet('licitacoes')) || []
      const record = { ...modelo, criadoPor: user?.name, contratante: selectedContratante || { nome: modelo.contratado }, habilitacao }
      if (isEditing) {
        const idx = list.findIndex((x: any) => String(x.codigo) === String(modelo.codigo))
        if (idx >= 0) list[idx] = record
        else list.push(record)
      } else {
        list.push(record)
      }
      await dbSet('licitacoes', list)
      // audit
      try {
        const { auditLog } = await import('../../utils/audit')
        const userName = localStorage.getItem('user_name') || undefined
        await auditLog(isEditing ? 'licitacao_update' : 'licitacao_create', { codigo: modelo.codigo }, userName)
      } catch (err) { /* ignore */ }
    }
    await pushAndSave()
    nav('/licitacoes')
  }

  // audit on save
  useEffect(() => {
    return () => {
      // noop
    }
  }, [])

  return (
    <div className="bg-white p-6 rounded shadow max-w-3xl">
      <h3 className="text-xl font-semibold mb-4">Nova Licitação</h3>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Código</label>
            <input value={modelo.codigo} readOnly className="w-full p-2 bg-gray-100 rounded readonly-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Ano</label>
            <input type="number" value={modelo.ano} onChange={e => setModelo({ ...modelo, ano: Number(e.target.value) })} className="w-full p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Criado por</label>
            <input value={user?.name || ''} readOnly className="w-full p-2 bg-gray-100 rounded readonly-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Contratante</label>
          <div className="relative">
            <input placeholder="Município" value={selectedContratante ? `${selectedContratante.nome} / ${selectedContratante.uf}` : (modelo.contratado || '')} onChange={e => {
              setModelo({ ...modelo, contratado: e.target.value })
              setSelectedContratante(null)
            }} className="w-full p-2 rounded" onFocus={() => { if (contratantes.length === 0) { /* no-op */ } }} />
            <div className="absolute right-2 top-2">
              <button type="button" onClick={() => setShowContractorModal(true)} className="btn btn-ghost">Selecionar/Cadastrar</button>
            </div>
              {/* suggestions */}
              {String(modelo.contratado || '').trim().length > 0 && (
                (() => {
                  const q = String(modelo.contratado || '').toLowerCase()
                  const matches = contratantes.filter(c => c.nome.toLowerCase().includes(q) || c.uf.toLowerCase().includes(q)).slice(0, 20)
                  return (
                    <div className="absolute left-0 right-0 bg-white border rounded mt-1 max-h-40 overflow-auto z-20">
                      {matches.length > 0 ? matches.map((c) => (
                        <div key={c.codigo} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onMouseDown={() => {
                          setSelectedContratante(c)
                          setModelo({ ...modelo, contratado: c.nome })
                        }}>{c.codigo} — {c.nome} / {c.uf}</div>
                      )) : (
                        <div className="p-3 text-sm text-gray-500 flex justify-between items-center">
                          <span>Nenhuma sugestão</span>
                          <button type="button" onMouseDown={() => setShowContractorModal(true)} className="text-sm link-primary">Cadastrar</button>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Número do Pregão</label>
            <input value={(modelo as any).numeroPregao || ''} onChange={e => setModelo({ ...modelo, numeroPregao: e.target.value })} className="w-full p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Número do Processo</label>
            <input value={(modelo as any).numeroProcesso || ''} onChange={e => setModelo({ ...modelo, numeroProcesso: e.target.value })} className="w-full p-2 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Portal Eletrônico</label>
            <input value={(modelo as any).portal || ''} onChange={e => setModelo({ ...modelo, portal: e.target.value })} className="w-full p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Tipo Objeto</label>
            <select value={(modelo as any).tipoObjeto || ''} onChange={e => setModelo({ ...modelo, tipoObjeto: e.target.value })} className="w-full p-2 rounded">
              <option value="">— selecione —</option>
              <option>Medicamentos</option>
              <option>Materiais</option>
              <option>Misto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Objeto Licitação</label>
          <textarea value={(modelo as any).objetoLicitacao || ''} onChange={e => setModelo({ ...modelo, objetoLicitacao: e.target.value })} className="w-full p-2 rounded" rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Data de Credenciamento</label>
            <DateInputBR value={(modelo as any).dataCredenciamento || ''} readOnly className="w-full p-2 rounded readonly-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Horário de Credenciamento</label>
            <TimeInputBR value={(modelo as any).horaCredenciamento || ''} readOnly className="w-full p-2 rounded readonly-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Data da Licitação</label>
            <DateInputBR value={(modelo as any).dataLicitacao || ''} onChange={v => setModelo({ ...modelo, dataLicitacao: v })} className="w-full p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Horário da Licitação</label>
            <TimeInputBR value={(modelo as any).horaLicitacao || ''} onChange={v => setModelo({ ...modelo, horaLicitacao: v })} className="w-full p-2 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Tipo de disputa</label>
            <select value={(modelo as any).tipoDisputa || ''} onChange={e => setModelo({ ...modelo, tipoDisputa: e.target.value })} className="w-full p-2 rounded">
              <option value="">— selecione —</option>
              <option>Aberto</option>
              <option>Fechado</option>
              <option>Aberto-Fechado</option>
              <option>Fechado-Aberto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Definição de Julgamento</label>
            <select value={(modelo as any).definJulgamento || ''} onChange={e => setModelo({ ...modelo, definJulgamento: e.target.value })} className="w-full p-2 rounded">
              <option value="">— selecione —</option>
              <option>Item</option>
              <option>Lote</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Prazo de garantia</label>
            <input value={(modelo as any).prazoGarantia || 'Conforme Edital'} onChange={e => setModelo({ ...modelo, prazoGarantia: e.target.value })} className="w-full p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Vigência do contrato</label>
          <input value={(modelo as any).vigenciaContrato || '12 (doze) meses'} onChange={e => setModelo({ ...modelo, vigenciaContrato: e.target.value })} className="w-full p-2 rounded" />
        </div>

        <div className="mt-6 bg-white border rounded p-4">
          <h4 className="font-semibold mb-2">Habilitação (Checklist)</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.habilitacaoJuridica} onChange={e => setHabilitacao({ ...habilitacao, habilitacaoJuridica: e.target.checked })} /> Habilitação Jurídica</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.habilitacaoFiscal} onChange={e => setHabilitacao({ ...habilitacao, habilitacaoFiscal: e.target.checked })} /> Habilitação Fiscal, Social e Trabalhista</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.balanco} onChange={e => setHabilitacao({ ...habilitacao, balanco: e.target.checked })} /> Balanço</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.anvisa} onChange={e => setHabilitacao({ ...habilitacao, anvisa: e.target.checked })} /> Anvisa</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.boasPraticas} onChange={e => setHabilitacao({ ...habilitacao, boasPraticas: e.target.checked })} /> Boas Práticas</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.laudo} onChange={e => setHabilitacao({ ...habilitacao, laudo: e.target.checked })} /> Laudo</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.bula} onChange={e => setHabilitacao({ ...habilitacao, bula: e.target.checked })} /> Bula</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.ggrem} onChange={e => setHabilitacao({ ...habilitacao, ggrem: e.target.checked })} /> GGREM</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.cti} onChange={e => setHabilitacao({ ...habilitacao, cti: e.target.checked })} /> CTI com Transportadora</label>
            <div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={habilitacao.outras} onChange={e => setHabilitacao({ ...habilitacao, outras: e.target.checked })} /> Outras declarações</label>
              {habilitacao.outras && <textarea value={habilitacao.outrasTexto} onChange={e => setHabilitacao({ ...habilitacao, outrasTexto: e.target.value })} className="w-full p-2 rounded mt-2" placeholder="Descrever outras declarações" />}
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm text-gray-600">Observação interna</label>
            <textarea value={habilitacao.observacaoInterna} onChange={e => setHabilitacao({ ...habilitacao, observacaoInterna: e.target.value })} className="w-full p-2 rounded" />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">Salvar</button>
          <button type="button" onClick={() => setShowAttachmentsModal(true)} className="btn btn-ghost">Anexos</button>
          <button type="button" onClick={() => setShowItemsImportModal(true)} className="btn btn-ghost">Importar Itens</button>
          <button type="button" onClick={() => window.print()} className="btn btn-ghost">Gerar Checklist (Imprimir)</button>
          <button type="button" onClick={async () => {
            // prepare and validate warnings
            const required = [
              ['Número do Pregão', modelo['numeroPregao']],
              ['Número do Processo', modelo['numeroProcesso']],
              ['Contratante', modelo['contratado']],
              ['Portal', modelo['portal']],
              ['Data da licitação', modelo['dataLicitacao']],
              ['Tipo Objeto', modelo['tipoObjeto']],
              ['Tipo de disputa', modelo['tipoDisputa']],
              ['Definição do Julgamento', modelo['definJulgamento']]
            ]
            const missing = required.filter(([, v]) => !v).map(([k]) => k as string)
            setWarnings(missing)

            if (!page1Ref.current || !page2Ref.current) return
            await exportElementsToPdf([page1Ref.current, page2Ref.current], `checklist_${modelo.codigo}.pdf`, 'Checklist')
          }} className="bg-indigo-600 text-white px-4 py-2 rounded">Exportar PDF</button>
          <button type="button" onClick={async () => {
            if (!page2Ref.current) return
            await exportElementsToPdf([page2Ref.current], `itens_${modelo.codigo}.pdf`, 'Itens')
          }} className="btn btn-primary">Exportar Itens (PDF)</button>
        </div>
      </form>
      <AttachmentsModal open={showAttachmentsModal} onClose={() => setShowAttachmentsModal(false)} codigo={modelo.codigo} />
      <ItemsImportModal open={showItemsImportModal} onClose={() => setShowItemsImportModal(false)} codigo={modelo.codigo} />
      <ContractorModal open={showContractorModal} onClose={async () => {
        setShowContractorModal(false)
        try {
          const { dbGet } = await import('../../utils/db')
          const cs = (await dbGet('contratantes')) || []
          setContratantes(cs)
        } catch (err) { /* ignore */ }
      }} onSelect={(c) => { setSelectedContratante(c); setModelo(m => ({ ...m, contratado: c.nome })) }} />
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
          <strong>Atenção — campos vazios salvos como aviso:</strong>
          <ul className="list-disc ml-6 mt-2">
            {warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <div style={{ position: 'absolute', left: -9999 }} aria-hidden>
        <PrintableChecklist modelo={modelo} codigo={modelo.codigo} user={user} habilitacao={habilitacao} page1Ref={page1Ref} page2Ref={page2Ref} />
        {/* items-only printable for separate export */}
        <div style={{ display: 'none' }}>
          {/* PrintableItems is rendered here so its DOM can be captured */}
          <div id="print-items-wrapper">
            {/* The PrintableItems component reads from localStorage directly */}
            <div id="print-items-placeholder"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
