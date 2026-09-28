import { useState, useEffect, useCallback } from 'react'
import type { AlumnoResumenDTO, CrearAlumnoDTO } from '../../application/index.ts'
import type { CuotaProps } from '../../domain/index.ts'
import {
  obtenerDashboardUseCase,
  aplicarAumentoGeneralUseCase,
  registrarPagoUseCase,
  crearAlumnoUseCase,
  pagoRepository,
} from '../../container.ts'

export function useDashboard() {
  const [alumnos, setAlumnos] = useState<AlumnoResumenDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [contador, setContador] = useState(0)
  const [detalle, setDetalle] = useState<{ nombre: string; email: string | null } | null>(null)

  const cargar = useCallback(async (busquedaTexto?: string) => {
    setLoading(true)
    try {
      const data = await obtenerDashboardUseCase.ejecutar(busquedaTexto)
      // Ordenar por apellido alfabéticamente
      const ordenados = [...data.alumnosResumen].sort((a, b) =>
        a.apellido.localeCompare(b.apellido)
      )
      setAlumnos(ordenados)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar(filtro)

    // Suscripción reactiva a pagos
    const desuscribir = pagoRepository.suscribirACambios(() => {
      cargar(filtro)
    })

    // Ticker visual con cleanup
    const timer = setInterval(() => {
      setContador((prev) => prev + 1)
    }, 5000)

    return () => {
      clearInterval(timer)
      desuscribir()
    }
  }, [cargar, filtro])

  const buscar = (texto: string) => {
    setFiltro(texto)
    cargar(texto)
  }

  const verContacto = (al: AlumnoResumenDTO) => {
    setDetalle({
      nombre: `${al.nombre} ${al.apellido}`,
      email: al.tutorEmail || 'Sin email registrado',
    })
  }

  const cerrarContacto = () => {
    setDetalle(null)
  }

  const aplicarAumento = async () => {
    try {
      const res = await aplicarAumentoGeneralUseCase.ejecutar(0.15)
      alert(`Aumento del 15% aplicado exitosamente a ${res.cuotasAfectadas} cuotas pendientes.`)
      await cargar(filtro)
    } catch (err: any) {
      alert('Error al aplicar aumento: ' + (err.message || 'Desconocido'))
    }
  }

  const cobrarCuota = async (cuota: CuotaProps) => {
    try {
      await registrarPagoUseCase.ejecutar(cuota)
      alert('Pago registrado con éxito.')
      await cargar(filtro)
    } catch (err: any) {
      alert('Error registrando pago: ' + (err.message || 'Desconocido'))
    }
  }

  const crearNuevoAlumno = async (dto: CrearAlumnoDTO) => {
    await crearAlumnoUseCase.ejecutar(dto)
    await cargar(filtro)
  }

  return {
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
  }
}
