import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import type { CrearAlumnoDTO } from '../../application/index.ts'

interface FormNuevoAlumnoProps {
  onCrear: (dto: CrearAlumnoDTO) => Promise<void>
}

export const FormNuevoAlumno: FC<FormNuevoAlumnoProps> = ({ onCrear }) => {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [arancel, setArancel] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      alert('Por favor complete Nombre, Apellido y DNI.')
      return
    }

    try {
      setEnviando(true)
      await onCrear({
        nombre,
        apellido,
        dni,
        arancelBaseNumero: Number(arancel) || 0,
      })
      setNombre('')
      setApellido('')
      setDni('')
      setArancel('')
    } catch (err: any) {
      alert('Error al crear alumno: ' + (err.message || 'Desconocido'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 15, background: '#fff', padding: 10, borderRadius: 4 }}>
      <b>Nuevo alumno:</b>
      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={{ marginLeft: 8 }}
        disabled={enviando}
      />
      <input
        placeholder="Apellido"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        style={{ marginLeft: 8 }}
        disabled={enviando}
      />
      <input
        placeholder="DNI"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        style={{ marginLeft: 8 }}
        disabled={enviando}
      />
      <input
        placeholder="Arancel"
        value={arancel}
        onChange={(e) => setArancel(e.target.value)}
        style={{ marginLeft: 8, width: 90 }}
        disabled={enviando}
      />
      <button className="btn" type="submit" style={{ marginLeft: 8 }} disabled={enviando}>
        {enviando ? 'Creando...' : 'Crear'}
      </button>
    </form>
  )
}
