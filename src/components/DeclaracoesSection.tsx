import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dbGet } from '../utils/db'
import { exportElementsToPdf } from '../utils/pdf'
import { DECLARACOES, buildDeclaracaoContext, renderDeclaracaoText, DeclaracaoContext } from '../utils/declaracoes'
import PrintableDeclaracao from './PrintableDeclaracao'

function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function DeclaracoesSection({ modelo }: { modelo: any }) {
  const [empresa, setEmpresa] = useState<any>(null)
  const [current, setCurrent] = useState<{ titulo: string; corpo: string; ctx: DeclaracaoContext; filename: string } | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customTitulo, setCustomTitulo] = useState('')
  const [customCorpo, setCustomCorpo] = useState('')
  const pageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    dbGet('empresa_info').then(v => { if (mounted) setEmpresa(v || null) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!current) return
    let cancelled = false
    const run = async () => {
      await new Promise(r => setTimeout(r, 80))
      if (cancelled || !pageRef.current) return
      await exportElementsToPdf([pageRef.current], current.filename, current.titulo)
    }
    run()
    return () => { cancelled = true }
  }, [current])

  const empresaVazia = !empresa || !empresa.razaoSocial

  const gerar = (titulo: string, corpoTemplate: string) => {
    const ctx = buildDeclaracaoContext(empresa, modelo)
    const corpo = renderDeclaracaoText(corpoTemplate, ctx)
    setCurrent({ titulo, corpo, ctx, filename: `${slugify(titulo)}_${modelo.codigo}.pdf` })
  }

  const gerarPersonalizada = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitulo.trim()) return
    gerar(customTitulo, customCorpo)
    setShowCustom(false)
    setCustomTitulo('')
    setCustomCorpo('')
  }

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-2">Declarações</h4>
      {empresaVazia && (
        <div className="text-sm text-yellow-700 bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-3">
          Cadastre as <Link to="/empresa" className="link-primary">Informações da Empresa</Link> antes de emitir declarações.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {DECLARACOES.map(d => (
          <button key={d.id} type="button" onClick={() => gerar(d.titulo, d.corpo)} className="btn btn-ghost text-xs">
            {d.titulo}
          </button>
        ))}
        <button type="button" onClick={() => setShowCustom(true)} className="btn btn-primary text-xs">
          Declaração Personalizada
        </button>
      </div>

      {showCustom && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white rounded shadow max-w-2xl w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Declaração Personalizada</h4>
              <button onClick={() => setShowCustom(false)} className="text-gray-500">Fechar</button>
            </div>
            <form onSubmit={gerarPersonalizada} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Título</label>
                <input value={customTitulo} onChange={e => setCustomTitulo(e.target.value)} className="w-full p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Texto</label>
                <textarea value={customCorpo} onChange={e => setCustomCorpo(e.target.value)} className="w-full p-2 rounded" rows={8} />
              </div>
              <button className="btn btn-primary" type="submit">Gerar PDF</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: -9999 }} aria-hidden>
        {current && <PrintableDeclaracao titulo={current.titulo} corpo={current.corpo} ctx={current.ctx} pageRef={pageRef} />}
      </div>
    </div>
  )
}
