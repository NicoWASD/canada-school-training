import type { FC } from 'react'
import type { AlumnoResumenDTO } from '../../application/index.ts'
import type { CuotaProps } from '../../domain/index.ts'

interface TablaAlumnosProps {
  alumnos: AlumnoResumenDTO[]
  onVerContacto: (alumno: AlumnoResumenDTO) => void
  onCobrar: (cuota: CuotaProps) => void
}

export const TablaAlumnos: FC<TablaAlumnosProps> = ({
  alumnos,
  onVerContacto,
  onCobrar,
}) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>DNI</th>
          <th>Nivel</th>
          <th>Curso</th>
          <th>Hermanos</th>
          <th>Desc.</th>
          <th>Arancel</th>
          <th>Saldadas</th>
          <th>Mora</th>
          <th>Deuda</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {alumnos.map((a) => (
          <tr key={a.id}>
            <td>
              <a
                onClick={() => onVerContacto(a)}
                style={{ cursor: 'pointer', color: '#0645ad', textDecoration: 'underline' }}
              >
                {a.nombre} {a.apellido}
              </a>
            </td>
            <td>{a.dni}</td>
            <td>{a.nivel}</td>
            <td>{a.curso}</td>
            <td>{a.cantidadHermanos}</td>
            <td>{Math.round(a.porcentajeDescuento * 100)}%</td>
            <td>${a.arancelBase.monto}</td>
            <td>{a.cuotasSaldadasCount}</td>
            <td style={{ color: a.moraTotal.esPositivo() ? '#c0142c' : '#999' }}>
              ${a.moraTotal.monto}
            </td>
            <td style={{ color: a.deudaTotal.esPositivo() ? 'red' : 'green' }}>
              ${a.deudaTotal.monto}
            </td>
            <td>
              {a.cuotasImpagas.map((c) => (
                <button
                  key={c.id}
                  className="btn"
                  style={{ marginRight: 4, fontSize: 11, padding: '3px 6px' }}
                  onClick={() => onCobrar(c)}
                >
                  Cobrar {c.mes}/{c.anio}
                </button>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
