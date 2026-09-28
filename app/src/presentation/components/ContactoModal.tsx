import React from 'react'

interface ContactoModalProps {
  nombre: string
  email: string | null
  onCerrar: () => void
}

export const ContactoModal: React.FC<ContactoModalProps> = ({ nombre, email, onCerrar }) => {
  return (
    <div style={{ marginBottom: 15, background: '#eef', padding: 10, borderRadius: 4 }}>
      <b>Contacto de {nombre}:</b> {email || 'Sin email registrado'}
      <button className="btn" style={{ marginLeft: 10 }} onClick={onCerrar}>
        Cerrar
      </button>
    </div>
  )
}
