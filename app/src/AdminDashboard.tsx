import * as Icons from 'react-icons/fa'
import { useDashboard } from './presentation/hooks/useDashboard.ts'
import { ContactoModal, FormNuevoAlumno, TablaAlumnos } from './presentation/components/index.ts'

export default function AdminDashboard(props: any) {
  const {
    alumnos,
    loading,
    filtro,
    contador,
    detalle,
    buscar,
    verContacto,
    cerrarContacto,
    aplicarAumento,
    cobrarCuota,
    crearNuevoAlumno,
  } = useDashboard()

  const usuario = props.user as unknown as { rol: string }

  if (loading && alumnos.length === 0) {
    return <div className="spin">Cargando alumnos y estado de cuenta...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <div style={{ fontSize: 22, color: '#c0142c', fontWeight: 'bold' }}>
          <Icons.FaSchool style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Canada School - Panel {usuario.rol}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>refresh #{contador}</div>
      </div>

      {/* Controles de Búsqueda y Aumento */}
      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Buscar alumno..."
          value={filtro}
          onChange={(e) => buscar(e.target.value)}
          style={{ padding: 8, width: 260 }}
        />
        <button className="btn" style={{ marginLeft: 10 }} onClick={aplicarAumento}>
          Aplicar aumento 15% (pendientes)
        </button>
      </div>

      {/* Modal / Panel de contacto */}
      {detalle && (
        <ContactoModal
          nombre={detalle.nombre}
          email={detalle.email}
          onCerrar={cerrarContacto}
        />
      )}

      {/* Formulario de creación de alumno */}
      <FormNuevoAlumno onCrear={crearNuevoAlumno} />

      {/* Tabla de Alumnos */}
      <TablaAlumnos
        alumnos={alumnos}
        onVerContacto={verContacto}
        onCobrar={cobrarCuota}
      />
    </div>
  )
}
