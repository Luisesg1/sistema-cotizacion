import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface Props {
  imagen?: string
  onUpload: (file: File) => void
  onRemove: () => void
}

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB = 5

function validate(file: File): string | null {
  if (!VALID_TYPES.includes(file.type)) return 'Formato inválido (JPG, PNG o WebP)'
  if (file.size > MAX_MB * 1024 * 1024) return `Máximo ${MAX_MB} MB`
  return null
}

export default function ProductImageCell({ imagen, onUpload, onRemove }: Props) {
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const err = validate(file)
    if (err) { setError(err); return }
    setError('')
    onUpload(file)
  }

  if (imagen) {
    return (
      <>
        <div className="flex flex-col items-center gap-1">
          <div className="relative group">
            <img
              src={imagen}
              alt="Producto"
              title="Clic para ampliar"
              onClick={() => setLightbox(true)}
              className="w-10 h-10 rounded object-cover border border-gray-200 cursor-zoom-in hover:opacity-80 transition-opacity"
              style={{ minWidth: 40, minHeight: 40 }}
            />
            <button
              type="button"
              onClick={onRemove}
              title="Eliminar imagen"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow"
            >
              <X size={8} />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
            />
          </div>
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <div className="relative" onClick={e => e.stopPropagation()}>
              <img
                src={imagen}
                alt="Producto"
                className="max-h-[80vh] max-w-[80vw] rounded-2xl shadow-2xl object-contain"
              />
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => { setLightbox(false); inputRef.current?.click() }}
                  className="text-[12px] font-medium text-white/80 hover:text-white bg-black/40 hover:bg-black/60 px-4 py-1.5 rounded-full transition-colors"
                >
                  Cambiar imagen
                </button>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(false)}
                className="absolute -top-3 -right-3 w-7 h-7 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <label
        title="Subir imagen del producto"
        className="w-10 h-10 rounded border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center cursor-pointer transition-colors"
      >
        <Camera size={15} className="text-gray-400" />
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => { setError(''); if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
      </label>
      {error && (
        <p className="text-[10px] text-red-500 leading-tight text-center w-14">{error}</p>
      )}
    </div>
  )
}
