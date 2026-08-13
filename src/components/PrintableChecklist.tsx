import React from 'react'

type Props = {
  modelo: any
  codigo: number
  user: any
  habilitacao?: any
  page1Ref?: React.RefObject<HTMLDivElement>
  page2Ref?: React.RefObject<HTMLDivElement>
}

export default function PrintableChecklist({ modelo, codigo, user, habilitacao = {}, page1Ref, page2Ref }: Props) {
  const attachments = JSON.parse(localStorage.getItem(`attachments_${codigo}`) || '[]') as any[]
  const items = JSON.parse(localStorage.getItem(`items_${codigo}`) || '[]') as any[]

  return (
    <>
      <div id="print-page-1" ref={page1Ref} style={{ width: '794px', padding: 28, paddingTop: 48, background: '#fff', color: '#000', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ marginBottom: 14, borderBottom: '1px solid #e6e6e6', paddingBottom: 8 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Checklist - Licitação {codigo}</h1>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Gerado por: {user?.name || '-'}</div>
        </header>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>1. Dados da Licitação</h2>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div><strong>Ano:</strong> {modelo?.ano}</div>
            <div><strong>Código:</strong> {modelo?.codigo}</div>
            <div><strong>Contratante:</strong> {modelo?.contratado || modelo?.empresa?.razaoSocial || '-'}</div>
            <div><strong>Número do Pregão:</strong> {modelo?.numeroPregao || '-'}</div>
            <div><strong>Número do Processo:</strong> {modelo?.numeroProcesso || '-'}</div>
            <div><strong>Portal:</strong> {modelo?.portal || '-'}</div>
            <div><strong>Data da Licitação:</strong> {modelo?.dataLicitacao || '-'}</div>
            <div><strong>Tipo Objeto:</strong> {modelo?.tipoObjeto || '-'}</div>
            <div><strong>Tipo de disputa:</strong> {modelo?.tipoDisputa || '-'}</div>
            <div><strong>Definição do Julgamento:</strong> {modelo?.definJulgamento || '-'}</div>
          </div>
        </section>

        <section style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>2. Habilitação</h2>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div>Habilitação Jurídica: {habilitacao.habilitacaoJuridica ? 'Sim' : 'Não'}</div>
            <div>Habilitação Fiscal, Social e Trabalhista: {habilitacao.habilitacaoFiscal ? 'Sim' : 'Não'}</div>
            <div>Balanço: {habilitacao.balanco ? 'Sim' : 'Não'}</div>
            <div>Anvisa: {habilitacao.anvisa ? 'Sim' : 'Não'}</div>
            <div>Boas Práticas: {habilitacao.boasPraticas ? 'Sim' : 'Não'}</div>
            <div>Laudo: {habilitacao.laudo ? 'Sim' : 'Não'}</div>
            <div>Bula: {habilitacao.bula ? 'Sim' : 'Não'}</div>
            <div>GGREM: {habilitacao.ggrem ? 'Sim' : 'Não'}</div>
            <div>CTI com Transportadora: {habilitacao.cti ? 'Sim' : 'Não'}</div>
            <div>Outras declarações: {habilitacao.outrasTexto || '-'}</div>
            <div style={{ marginTop: 8 }}><strong>Observação interna:</strong> {habilitacao.observacaoInterna || '-'}</div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>3. Proposta</h2>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div>Prazo de Validade: {modelo?.prazoValidade || '-'}</div>
            <div>Prazo de entrega: {modelo?.prazoEntrega || '-'}</div>
            <div>Local de Entrega: {modelo?.localEntrega || '-'}</div>
            <div>Prazo de Pagamento: {modelo?.prazoPagamento || '-'}</div>
            <div>Prazo de garantia: {modelo?.prazoGarantia || 'Conforme Edital'}</div>
            <div>Vigência do contrato: {modelo?.vigenciaContrato || '12 (doze) meses'}</div>
            <div style={{ marginTop: 8 }}><strong>Declarações:</strong></div>
            <div style={{ fontSize: 11 }}>{modelo?.declaracoes || ''}</div>
          </div>
        </section>

        <section style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Anexos</h2>
          <div style={{ fontSize: 12 }}>{attachments.map(a => a.name).join(', ') || 'Nenhum'}</div>
        </section>
      </div>

      <div id="print-page-2" ref={page2Ref} style={{ width: '794px', padding: 24, paddingTop: 48, background: '#fff', color: '#000', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>4. Itens</h2>
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          {items.length === 0 && <div>Nenhum item importado.</div>}
          {items.map((it, i) => (
            <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Item {i + 1}</div>
              <div>{Object.entries(it).map(([k, v]) => `${k}: ${v}`).join(' — ')}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
