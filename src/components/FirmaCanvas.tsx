import { useEffect, useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import { Trash2, Upload } from 'lucide-react'

interface Props {
  value: string
  onChange: (base64: string) => void
}

export default function FirmaCanvas({ value, onChange }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const padRef     = useRef<SignaturePad | null>(null)
  const uploadRef  = useRef<HTMLInputElement>(null)
  const [isEmpty, setIsEmpty] = useState(!value)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let pad: SignaturePad | null = null
    let initialized = false

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const data = pad && !pad.isEmpty() ? pad.toData() : null
      canvas.width  = canvas.offsetWidth  * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      if (pad) {
        pad.clear()
        if (data) { pad.fromData(data); setIsEmpty(false) }
      }
    }

    const initPad = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width  = canvas.offsetWidth  * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      pad = new SignaturePad(canvas, {
        penColor: '#111827',
        minWidth: 1,
        maxWidth: 2.5,
        backgroundColor: 'rgba(0,0,0,0)',
      })
      padRef.current = pad

      if (value) {
        pad.fromDataURL(value)
        setIsEmpty(false)
      }

      const onEnd = () => {
        setIsEmpty(pad!.isEmpty())
        onChange(pad!.toDataURL('image/png'))
      }
      pad.addEventListener('endStroke', onEnd)
      initialized = true
    }

    // ResizeObserver stays active: re-sizes canvas whenever column width changes
    const ro = new ResizeObserver(() => {
      if (canvas.offsetWidth === 0) return
      if (!initialized) {
        initPad()
      } else {
        resizeCanvas()
      }
    })
    ro.observe(canvas)

    return () => {
      ro.disconnect()
      if (pad) pad.off()
    }
  }, [])

  // Load signature when value arrives async (e.g. after getEmpresa resolves)
  useEffect(() => {
    const pad = padRef.current
    if (!pad || !value) return
    if (pad.isEmpty()) {
      pad.fromDataURL(value)
      setIsEmpty(false)
    }
  }, [value])

  const clear = () => {
    padRef.current?.clear()
    setIsEmpty(true)
    onChange('')
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const pad = padRef.current
      const canvas = canvasRef.current
      if (!pad || !canvas) return
      pad.clear()
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        // scale to fit with padding
        const pad_px = 12
        const scale = Math.min((w - pad_px * 2) / img.width, (h - pad_px * 2) / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        const dx = (w - dw) / 2
        const dy = (h - dh) / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, dx, dy, dw, dh)
        const out = canvas.toDataURL('image/png')
        setIsEmpty(false)
        onChange(out)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden"
        style={{ height: 200 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          style={{ display: 'block' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-400">Dibuja tu firma aquí</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400">Dibuja o sube una imagen</p>
          <button type="button" onClick={() => uploadRef.current?.click()}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
            <Upload size={12} /> Subir imagen
          </button>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        {!isEmpty && (
          <button onClick={clear} type="button"
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={12} /> Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
