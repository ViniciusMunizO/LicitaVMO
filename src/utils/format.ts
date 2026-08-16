// Números vindos de planilha (via fórmulas de Excel) costumam chegar com erro
// de ponto flutuante, ex: 0.58 * 1.15 vira 0.6699999999999999. Formata para
// no máximo `maxDecimals` casas decimais, sem casas extras quando o valor é
// exato (5750 continua "5750", não "5750.0000").
export function formatNumeric(value: any, maxDecimals = 4): string {
  if (value === undefined || value === null || value === '') return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '' || isNaN(num))) {
    return String(value)
  }
  if (isNaN(num)) return String(value)
  return String(Number(num.toFixed(maxDecimals)))
}
