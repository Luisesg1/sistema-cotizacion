import jsPDF from 'jspdf'
import { Cotizacion, Empresa } from '../types'
import { formatCLP, formatDate } from './utils'

async function toJpeg(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

const C = {
  primary:  [37,  99,  235] as [number,number,number],
  ink:      [17,  24,  39]  as [number,number,number],
  mid:      [71,  85,  105] as [number,number,number],
  muted:    [107, 114, 128] as [number,number,number],
  soft:     [156, 163, 175] as [number,number,number],
  border:   [226, 232, 240] as [number,number,number],
  borderMd: [203, 213, 225] as [number,number,number],
  surface:  [248, 249, 251] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
}

export async function generatePDFNative(cotizacion: Cotizacion, empresa: Empresa | null) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

  const PW       = 210
  const PH       = 297
  const M        = 18
  const CW       = PW - M * 2        // 174mm
  const FOOTER_H = 10
  const FOOTER_Y = PH - FOOTER_H     // 287mm
  const PAGE_TOP = M + 2             // y after accent strip

  const detalles = cotizacion.detalles || []

  const logoJpeg  = empresa?.logo  ? await toJpeg(empresa.logo).catch(() => null)  : null
  const firmaJpeg = empresa?.firma ? await toJpeg(empresa.firma).catch(() => null) : null
  const detallesConImg = await Promise.all(
    detalles.map(async d => ({
      ...d,
      imagenJpeg: d.imagen ? await toJpeg(d.imagen).catch(() => null) : null,
    }))
  )
  const hasImages = detallesConImg.some(d => d.imagenJpeg)

  const fc  = (...c: [number,number,number]) => doc.setFillColor(...c)
  const dc  = (...c: [number,number,number]) => doc.setDrawColor(...c)
  const tc  = (...c: [number,number,number]) => doc.setTextColor(...c)
  const lw  = (w: number) => doc.setLineWidth(w)
  const fnt = (style: 'normal'|'bold', size: number) => {
    doc.setFont('helvetica', style); doc.setFontSize(size)
  }

  // ── Column layout ─────────────────────────────────────────────────────────
  // img(24) + name(88) + qty(14) + unit(24) + tot(24) = 174
  // no-img: name(112) + qty(14) + unit(24) + tot(24) = 174
  const imgColW  = hasImages ? 24 : 0
  const nameColW = hasImages ? 88 : 112
  const qtyColW  = 14
  const unitColW = 24
  const totColW  = 24

  const COL = {
    img:   M,
    name:  M + imgColW,
    qty:   M + imgColW + nameColW,
    unit:  M + imgColW + nameColW + qtyColW,
    tot:   M + imgColW + nameColW + qtyColW + unitColW,
    end:   PW - M,
    textR: PW - M - 2,
  }

  const IMG_SIZE  = 20    // image display size mm
  const IMG_PAD   = 1.5   // border padding mm
  const ROW_PAD   = 7     // top/bottom padding per row mm
  const ROW_GAP   = 3     // gap between rows mm
  const cardH     = 22

  // Parse description into bullet lines, handling CamelCase-concatenated attributes
  const parseSpecs = (desc: string): string[] => {
    if (!desc?.trim()) return []

    // Already has newlines — trust them
    const byNewline = desc.split('\n').map(s => s.trim()).filter(Boolean)
    if (byNewline.length > 1) return byNewline.slice(0, 10)

    // Detect CamelCase concatenation: lowercase/digit → uppercase+lowercase
    // e.g. "SamsungLínea:" → "Samsung\nLínea:"
    const decat = desc.replace(/([a-záéíóúñüA-Za-z0-9])([A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,})/g, '$1\n$2')
    if (decat !== desc) {
      const lines = decat.split('\n').map(s => s.trim()).filter(Boolean)
      if (lines.length > 1) return lines.slice(0, 10)
    }

    // Split by semicolons
    const bySemi = desc.split(';').map(s => s.trim()).filter(s => s.length > 2)
    if (bySemi.length > 1) return bySemi.slice(0, 10)

    // Single block — return as-is (will wrap in column)
    return [desc.trim()]
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRE-CALCULATE all section heights (single-page mode)
  // ══════════════════════════════════════════════════════════════════════════

  // — Header —
  const logoBlockW    = 34
  const companyBlockX = M + logoBlockW + 5
  const companyBlockW = 72
  const cardBlockX    = companyBlockX + companyBlockW + 4
  const cardBlockW    = PW - M - cardBlockX

  const empRows: string[] = [
    empresa?.rut       ? `RUT ${empresa.rut}` : '',
    empresa?.giro      || '',
    empresa?.direccion || '',
    [empresa?.ciudad, empresa?.region].filter(Boolean).join(', '),
    empresa?.telefono  ? `Tel. ${empresa.telefono}` : '',
    empresa?.email     || '',
  ].filter(Boolean)

  const companyTextH = 8 + empRows.length * 3.5
  const headerH      = Math.max(companyTextH, cardH)  // height of header block

  // — Client / conditions cards —
  const cardPad  = 3.5
  const twoColW  = (CW - 5) / 2
  const cCard1X  = M
  const cCard2X  = M + twoColW + 5

  const cl = cotizacion.cliente
  const condRows: [string, string][] = [
    cotizacion.compra_agil    ? ['Proceso de Compra', cotizacion.compra_agil]    : null,
    cotizacion.condicion_pago ? ['Condición de pago', cotizacion.condicion_pago] : null,
    cotizacion.validez        ? ['Validez de oferta', cotizacion.validez]     : null,
  ].filter(Boolean) as [string, string][]

  const clientLines: string[] = [
    cl?.rut       ? `RUT ${cl.rut}` : '',
    cl?.giro      || '',
    cl?.direccion || '',
    [cl?.ciudad, cl?.region].filter(Boolean).join(', '),
    cl?.email     || '',
    cl?.contacto  ? `Atención: ${cl.contacto}` : '',
  ].filter(Boolean)

  fnt('normal', 7.5)
  const clCardContentH   = cardPad + (cl?.razon_social ? 4.5 : 0) + clientLines.length * 3.4 + cardPad + 6
  const condCardContentH = cardPad + condRows.reduce((s, [,v]) => s + doc.splitTextToSize(v, twoColW - cardPad * 2).length * 3.6 + 5.5, 0) + cardPad + 2
  const twoCardH         = Math.max(clCardContentH, condCardContentH, 20)

  // — Table rows — fonts must match drawing exactly
  const rowHeights = detallesConImg.map(det => {
    fnt('bold', 10)
    const nameLines = doc.splitTextToSize(det.producto || '', nameColW - 5)
    const specs     = parseSpecs(det.descripcion || '')
    fnt('normal', 7.5)
    const specWrapped = specs.flatMap(s => doc.splitTextToSize(`• ${s}`, nameColW - 6))
    const nameH  = nameLines.length * 4.8
    const specsH = specWrapped.length > 0 ? specWrapped.length * 3.8 + 2.5 : 0
    const textH  = nameH + specsH + 3.5   // 3.5 = initial top offset
    const minH   = hasImages
      ? Math.max(textH + ROW_PAD * 2, IMG_SIZE + IMG_PAD * 2 + ROW_PAD * 2)
      : textH + ROW_PAD * 2
    return Math.max(minH, 22)
  })
  const tableH = 10 + rowHeights.reduce((s, h) => s + h + ROW_GAP, 0)

  // — Obs + totals —
  const totW  = 78
  const totX  = PW - M - totW
  const totR  = PW - M - 2
  const obsW  = totX - M - 5

  const obsText   = cotizacion.observaciones?.trim()
    ? doc.splitTextToSize(cotizacion.observaciones, obsW - 8)
    : []
  const obsCardH  = obsText.length > 0 ? obsText.length * 4.3 + 14 : 0

  // — Banking + signature (pre-calc real heights) —
  const hasBanking   = !!(empresa?.datos_bancarios?.trim())
  const hasSignature = !!(empresa?.ejecutivo || firmaJpeg)
  const bankLines    = hasBanking
    ? doc.splitTextToSize(empresa!.datos_bancarios!, obsW - 8)
    : []
  const bankBlockH   = hasBanking ? bankLines.length * 3.6 + 12 : 0
  const totBlockH    = 3 + 7 + 7 + 2 + 4 + 14   // subtotal + iva + divider + total box
  const leftColH     = (obsText.length > 0 ? obsCardH + 4 : 0) + bankBlockH
  const mainRowH     = Math.max(leftColH, totBlockH) + 2
  const sigH         = hasSignature ? 35 : 0

  // — Total content height (base gaps) —
  const BASE = {
    afterDivider: 4,   // gap after the horizontal rule under header
    afterCards:   4,
    introLine:    5,   // intro sentence + gap
    afterTable:   3,
    afterObs:     3,
    bankingDiv:   5,   // the divider line before banking block
  }

  const fixedContent =
    headerH +
    4 +                    // divider line area
    BASE.afterDivider +
    twoCardH +
    BASE.afterCards +
    BASE.introLine +
    tableH +
    BASE.afterTable +
    mainRowH +
    BASE.afterObs +
    sigH

  const available  = FOOTER_Y - PAGE_TOP
  const extra      = Math.max(0, available - fixedContent)

  // Only distribute gaps if content is clearly short (< 80% of available height)
  const contentRatio = fixedContent / available
  const GAP_COUNT    = 5
  const extraEach    = contentRatio < 0.80 ? Math.min(extra / GAP_COUNT, 8) : 0

  const G = {
    afterDivider: BASE.afterDivider + extraEach,
    afterCards:   BASE.afterCards   + extraEach,
    introLine:    BASE.introLine    + extraEach,
    afterTable:   BASE.afterTable   + extraEach,
    afterObs:     BASE.afterObs     + extraEach,
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DRAW — multi-page fallback still active for very long content
  // ══════════════════════════════════════════════════════════════════════════
  let y = 0
  let pageBreakOccurred = false

  const initPage = () => {
    fc(...C.primary); doc.rect(0, 0, PW, 3.5, 'F')
    y = PAGE_TOP
  }

  const nextPage = () => {
    doc.addPage(); initPage()
    pageBreakOccurred = true
  }

  const ensureSpace = (need: number) => {
    if (y + need > FOOTER_Y - 4) { nextPage(); return true }
    return false
  }

  // After table rows, collapse gaps to BASE if a page break happened
  const safeG = (base: number, distributed: number) =>
    pageBreakOccurred ? base : distributed

  initPage()

  // ── HEADER ────────────────────────────────────────────────────────────────
  const HEADER_TOP = y

  if (logoJpeg) {
    try { doc.addImage(logoJpeg, 'JPEG', M, HEADER_TOP, 28, 14) } catch { /* skip */ }
  }

  let cy = HEADER_TOP
  fnt('bold', 12); tc(...C.ink)
  const razonLine = doc.splitTextToSize(empresa?.razon_social || 'Mi Empresa', companyBlockW)[0]
  doc.text(razonLine, companyBlockX, cy + 4.5)
  cy += 8

  empRows.forEach(row => {
    fnt('normal', 7); tc(...C.muted)
    doc.text(doc.splitTextToSize(row, companyBlockW)[0], companyBlockX, cy)
    cy += 3.5
  })

  fc(...C.primary)
  doc.roundedRect(cardBlockX, HEADER_TOP, cardBlockW, cardH, 3, 3, 'F')

  fnt('normal', 5.5); tc(188, 210, 255)
  doc.text('COTIZACIÓN', cardBlockX + cardBlockW / 2, HEADER_TOP + 5.5, { align: 'center' })

  fnt('bold', 13); tc(...C.white)
  doc.text(cotizacion.numero, cardBlockX + cardBlockW / 2, HEADER_TOP + 13, { align: 'center' })

  fnt('normal', 6); tc(188, 210, 255)
  const cardDateY = empresa?.ejecutivo ? HEADER_TOP + 16.5 : HEADER_TOP + 18.5
  doc.text(formatDate(cotizacion.fecha), cardBlockX + cardBlockW / 2, cardDateY, { align: 'center' })
  if (empresa?.ejecutivo) {
    doc.text(empresa.ejecutivo, cardBlockX + cardBlockW / 2, HEADER_TOP + 20.5, { align: 'center' })
  }

  y = Math.max(cy, HEADER_TOP + cardH) + 4

  lw(0.2); dc(...C.borderMd)
  doc.line(M, y, PW - M, y)
  y += G.afterDivider

  // ── CLIENT + CONDITIONS ───────────────────────────────────────────────────
  fc(...C.surface); dc(...C.borderMd); lw(0.2)
  doc.roundedRect(cCard1X, y, twoColW, twoCardH, 2, 2, 'FD')
  doc.roundedRect(cCard2X, y, twoColW, twoCardH, 2, 2, 'FD')

  let clY = y + cardPad + 0.5
  fnt('bold', 5.5); tc(...C.soft)
  doc.text('CLIENTE', cCard1X + cardPad, clY)
  lw(0.15); dc(...C.border)
  doc.line(cCard1X + cardPad, clY + 1, cCard1X + cardPad + 16, clY + 1)
  clY += 4

  if (cl?.razon_social) {
    fnt('bold', 9); tc(...C.ink)
    doc.text(cl.razon_social, cCard1X + cardPad, clY); clY += 5
  }
  clientLines.forEach(row => {
    fnt('normal', 6.5); tc(...C.muted)
    doc.text(row, cCard1X + cardPad, clY); clY += 3.4
  })

  let condY = y + cardPad + 0.5
  fnt('bold', 5.5); tc(...C.soft)
  doc.text('CONDICIONES', cCard2X + cardPad, condY)
  lw(0.15); dc(...C.border)
  doc.line(cCard2X + cardPad, condY + 1, cCard2X + cardPad + 24, condY + 1)
  condY += 4

  condRows.forEach(([lbl, val]) => {
    fnt('bold', 5.5); tc(...C.soft)
    doc.text(lbl.toUpperCase(), cCard2X + cardPad, condY); condY += 3
    fnt('bold', 7.5); tc(...C.ink)
    const wrapped = doc.splitTextToSize(val, twoColW - cardPad * 2)
    doc.text(wrapped, cCard2X + cardPad, condY)
    condY += wrapped.length * 3.6 + 2
  })

  y += twoCardH + G.afterCards

  // Intro line
  fnt('normal', 7); tc(...C.muted)
  doc.text(
    'Estimado cliente, presentamos a continuación nuestra cotización por los productos y/o servicios solicitados:',
    M, y
  )
  y += G.introLine

  // ── PRODUCTS TABLE ────────────────────────────────────────────────────────
  const BORDER_COL: [number,number,number] = [233, 238, 245]  // #E9EEF5

  const drawTableHeader = () => {
    fc(...C.ink); doc.rect(M, y, CW, 10, 'F')
    fnt('bold', 7); tc(...C.white)
    doc.text('PRODUCTO / DESCRIPCIÓN', COL.name + 3, y + 6.8)
    doc.text('CANT.', COL.qty + qtyColW / 2, y + 6.8, { align: 'center' })
    doc.text('V. UNITARIO', COL.unit + unitColW - 3, y + 6.8, { align: 'right' })
    doc.text('TOTAL', COL.tot + totColW - 3, y + 6.8, { align: 'right' })
    y += 10
  }

  drawTableHeader()

  detallesConImg.forEach((det, idx) => {
    const rowH = rowHeights[idx]

    // ── Page break: never split a row ──────────────────────────────────────
    if (y + rowH > FOOTER_Y - 4) {
      nextPage()
      drawTableHeader()
    }

    // ── Pre-compute wrapped lines (correct fonts) ──────────────────────────
    fnt('bold', 10); tc(...C.primary)
    const nameLines = doc.splitTextToSize(det.producto || '', nameColW - 5)

    const specs = parseSpecs(det.descripcion || '')
    fnt('normal', 7.5)
    const specWrappedLines: string[] = specs.flatMap(s =>
      doc.splitTextToSize(`• ${s}`, nameColW - 6)
    )

    // ── Row background ─────────────────────────────────────────────────────
    fc(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251, idx % 2 === 0 ? 255 : 252)
    doc.rect(M, y, CW, rowH, 'F')

    // Outer border
    lw(0.18); dc(...BORDER_COL)
    doc.rect(M, y, CW, rowH)

    // Column separators (full height, lighter)
    lw(0.12); dc(...BORDER_COL)
    doc.line(COL.qty,  y + 2, COL.qty,  y + rowH - 2)
    doc.line(COL.unit, y + 2, COL.unit, y + rowH - 2)
    doc.line(COL.tot,  y + 2, COL.tot,  y + rowH - 2)

    const textX   = COL.name + 4
    const textTopY = y + ROW_PAD
    const vCenter = y + rowH / 2

    // ── Image (vertically centered) ────────────────────────────────────────
    if (hasImages) {
      const imgBoxX = COL.img + (imgColW - IMG_SIZE - IMG_PAD * 2) / 2
      const imgBoxY = vCenter - (IMG_SIZE + IMG_PAD * 2) / 2
      fc(...C.white); dc(...BORDER_COL); lw(0.25)
      doc.roundedRect(imgBoxX, imgBoxY, IMG_SIZE + IMG_PAD * 2, IMG_SIZE + IMG_PAD * 2, 1.5, 1.5, 'FD')
      if (det.imagenJpeg) {
        try {
          doc.addImage(det.imagenJpeg, 'JPEG', imgBoxX + IMG_PAD, imgBoxY + IMG_PAD, IMG_SIZE, IMG_SIZE)
        } catch { /* skip */ }
      }
    }

    // ── Product name ────────────────────────────────────────────────────────
    fnt('bold', 10); tc(...C.primary)
    doc.text(nameLines, textX, textTopY + 3.5)

    // ── Specs / description ─────────────────────────────────────────────────
    if (specWrappedLines.length > 0) {
      const specsTopY = textTopY + nameLines.length * 4.8 + 2.5
      fnt('normal', 7.5); tc(...C.muted)
      doc.text(specWrappedLines, textX, specsTopY)
    }

    // ── Qty + unit (vertically centered) ────────────────────────────────────
    fnt('bold', 10); tc(...C.ink)
    doc.text(String(det.cantidad), COL.qty + qtyColW / 2, vCenter + 1.5, { align: 'center' })
    if (det.unidad) {
      fnt('normal', 6); tc(...C.soft)
      doc.text(det.unidad, COL.qty + qtyColW / 2, vCenter + 5.5, { align: 'center' })
    }

    // ── Unit price ───────────────────────────────────────────────────────────
    fnt('normal', 9); tc(...C.mid)
    doc.text(formatCLP(det.valor_unitario), COL.unit + unitColW - 3, vCenter + 1.5, { align: 'right' })

    // ── Total ────────────────────────────────────────────────────────────────
    fnt('bold', 10); tc(...C.ink)
    doc.text(formatCLP(det.subtotal), COL.tot + totColW - 3, vCenter + 1.5, { align: 'right' })

    y += rowH
    if (idx < detallesConImg.length - 1) y += ROW_GAP
  })

  y += safeG(BASE.afterTable, G.afterTable)

  // ── Page break before bottom block if it doesn't fit ─────────────────────
  const bottomNeed = mainRowH + (hasSignature ? sigH + 6 : 0)
  if (y + bottomNeed > FOOTER_Y - 4) {
    nextPage()
  }

  // ── OBS (left) + TOTALS (right) — luego bancarios bajo obs ──────────────
  const rowY = y

  // Observations card (left)
  if (obsText.length > 0) {
    lw(0.2); dc(...C.borderMd); fc(248, 249, 251)
    doc.roundedRect(M, rowY, obsW, obsCardH, 2.5, 2.5, 'FD')
    fnt('bold', 5.5); tc(...C.soft)
    doc.text('OBSERVACIONES', M + 5.5, rowY + 6)
    lw(0.15); dc(...C.border)
    doc.line(M + 5.5, rowY + 7, M + 5.5 + 26, rowY + 7)
    fnt('normal', 7.5); tc(...C.mid)
    doc.text(obsText, M + 5.5, rowY + 11.5)
  }

  // Banking below observations (left)
  if (hasBanking) {
    const bankY = rowY + (obsText.length > 0 ? obsCardH + 4 : 0)
    fnt('bold', 5.5); tc(...C.soft)
    doc.text('DATOS BANCARIOS', M, bankY)
    lw(0.15); dc(...C.border)
    doc.line(M, bankY + 1, M + 28, bankY + 1)
    fnt('normal', 7); tc(...C.muted)
    doc.text(bankLines, M, bankY + 6)
  }

  // Totals (right)
  let ty = rowY + 3
  const drawTotLine = (lbl: string, val: string) => {
    fnt('normal', 8); tc(...C.muted)
    doc.text(lbl, totX + 2, ty)
    fnt('bold', 8.5); tc(...C.ink)
    doc.text(val, totR, ty, { align: 'right' })
    ty += 7
  }

  drawTotLine('Subtotal neto', formatCLP(cotizacion.subtotal))
  drawTotLine('IVA (19%)',     formatCLP(cotizacion.iva))

  ty += 2
  lw(0.4); dc(...C.borderMd)
  doc.line(totX + 2, ty, totR, ty)
  ty += 4

  fc(...C.primary)
  doc.roundedRect(totX - 2, ty, totW + 2, 14, 2.5, 2.5, 'F')
  fnt('bold', 7); tc(188, 210, 255)
  doc.text('TOTAL', totX + 3, ty + 5.5)
  fnt('bold', 14); tc(...C.white)
  doc.text(formatCLP(cotizacion.total), totR - 1, ty + 11, { align: 'right' })

  y = rowY + mainRowH + safeG(BASE.afterObs, G.afterObs)

  // ── SIGNATURE — centrada ──────────────────────────────────────────────────
  if (hasSignature) {
    const sigCX  = M + CW / 2
    const sigW   = 60

    fnt('bold', 5.5); tc(...C.soft)
    doc.text('FIRMA / APROBACIÓN', sigCX, y, { align: 'center' })
    lw(0.15); dc(...C.border)
    doc.line(sigCX - 15, y + 1, sigCX + 15, y + 1)

    // Firma imagen (si existe) centrada sobre la línea
    if (firmaJpeg) {
      try {
        const fW = 50, fH = 18
        doc.addImage(firmaJpeg, 'JPEG', sigCX - fW / 2, y + 1, fW, fH)
      } catch { /* skip */ }
    }

    lw(0.4); dc(...C.border)
    doc.line(sigCX - sigW / 2, y + 20, sigCX + sigW / 2, y + 20)

    if (empresa?.ejecutivo) {
      fnt('bold', 8); tc(...C.ink)
      doc.text(empresa.ejecutivo, sigCX, y + 25, { align: 'center' })
    }
    if (empresa?.email) {
      fnt('normal', 6); tc(...C.soft)
      doc.text(empresa.email, sigCX, y + (empresa?.ejecutivo ? 30 : 25), { align: 'center' })
    }
    y += 35
  }

  // ── FOOTER — every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)

    fc(248, 249, 251); doc.rect(0, FOOTER_Y, PW, FOOTER_H, 'F')
    lw(0.15); dc(...C.borderMd)
    doc.line(0, FOOTER_Y, PW, FOOTER_Y)
    fc(...C.primary); doc.rect(0, FOOTER_Y, 3, FOOTER_H, 'F')

    fnt('normal', 6); tc(...C.muted)
    doc.text(`${empresa?.razon_social || ''} · Cotización N° ${cotizacion.numero}`, M, FOOTER_Y + 6.5)
    fnt('bold', 6); tc(...C.soft)
    doc.text(`Página ${p} de ${totalPages}`, PW - M - 2, FOOTER_Y + 6.5, { align: 'right' })
  }

  doc.save(`cotizacion-${cotizacion.numero}.pdf`)
}
