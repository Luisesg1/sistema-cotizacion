import { useState } from 'react'
import { validateRUT, formatRUT } from '../lib/utils'

interface Props {
  value: string
  onChange: (val: string) => void
  required?: boolean
  className?: string
}

export default function RutInput({ value, onChange, required, className }: Props) {
  const [touched, setTouched] = useState(false)

  const { valid, error } = value.trim() ? validateRUT(value) : { valid: !required, error: required ? 'RUT requerido' : undefined }
  const showError = touched && !valid

  const handleBlur = () => {
    setTouched(true)
    if (value.trim()) onChange(formatRUT(value))
  }

  return (
    <div>
      <input
        className={`${className ?? 'input'} ${showError ? 'border-red-400 focus:ring-red-400' : ''}`}
        value={value}
        placeholder="Ej: 76.892.993-9"
        onChange={e => onChange(e.target.value)}
        onBlur={handleBlur}
      />
      {showError && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
