import React from 'react'

type Props = {
  codigo: number
  pageRef?: React.RefObject<HTMLDivElement>
}

export default function PrintableItems({ codigo, pageRef }: Props) {
  const items = JSON.parse(localStorage.getItem(`items_${codigo}`) || '[]') as any[]

  return (
    <div id="print-items" ref={pageRef} style={{ width: '794px', padding: 24, background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Itens - Licitação {codigo}</h2>
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
  )
}
