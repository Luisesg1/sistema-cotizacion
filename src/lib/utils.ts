export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value))
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function validateRUT(raw: string): { valid: boolean; error?: string } {
  if (!raw || !raw.trim()) return { valid: false, error: 'RUT requerido' }
  const clean = raw.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase()
  if (clean.length < 2) return { valid: false, error: 'RUT muy corto' }
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!/^\d+$/.test(body)) return { valid: false, error: 'RUT inválido' }
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const rem = 11 - (sum % 11)
  const expected = rem === 11 ? '0' : rem === 10 ? 'K' : String(rem)
  if (dv !== expected) return { valid: false, error: `Dígito verificador incorrecto (esperado: ${expected})` }
  return { valid: true }
}

export function formatRUT(raw: string): string {
  const clean = raw.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase()
  if (clean.length < 2) return raw
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!/^\d+$/.test(body)) return raw
  const num = parseInt(body).toLocaleString('es-CL')
  return `${num}-${dv}`
}

export function getImgFormat(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' {
  if (dataUrl.includes('jpeg') || dataUrl.includes('jpg')) return 'JPEG'
  if (dataUrl.includes('webp')) return 'WEBP'
  return 'PNG'
}
