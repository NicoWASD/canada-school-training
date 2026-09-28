import type {
  TutorProps,
  CuotaProps,
  PagoProps,
} from '../../domain/index.ts'
import {
  Dinero,
  calcularPorcentajeDescuentoHermanos,
  estaCuotaSaldada,
  calcularMora,
  calcularDeudaCuota,
} from '../../domain/index.ts'
import type {
  AlumnoRepository,
  TutorRepository,
  CuotaRepository,
  PagoRepository,
} from '../ports/index.ts'

export interface AlumnoResumenDTO {
  id: number
  nombre: string
  apellido: string
  dni: string
  nivel: string
  curso: string
  tutorId: number | null
  tutorNombre?: string
  tutorEmail?: string | null
  cantidadHermanos: number
  porcentajeDescuento: number
  arancelBase: Dinero
  cuotasSaldadasCount: number
  moraTotal: Dinero
  deudaTotal: Dinero
  cuotasImpagas: CuotaProps[]
}

export class ObtenerDashboardUseCase {
  private readonly alumnoRepo: AlumnoRepository
  private readonly tutorRepo: TutorRepository
  private readonly cuotaRepo: CuotaRepository
  private readonly pagoRepo: PagoRepository

  constructor(
    alumnoRepo: AlumnoRepository,
    tutorRepo: TutorRepository,
    cuotaRepo: CuotaRepository,
    pagoRepo: PagoRepository
  ) {
    this.alumnoRepo = alumnoRepo
    this.tutorRepo = tutorRepo
    this.cuotaRepo = cuotaRepo
    this.pagoRepo = pagoRepo
  }

  async ejecutar(filtroTexto?: string): Promise<{
    alumnosResumen: AlumnoResumenDTO[]
    tutores: TutorProps[]
  }> {
    const [alumnos, tutores, cuotas, pagos] = await Promise.all([
      filtroTexto && filtroTexto.trim()
        ? this.alumnoRepo.buscarPorNombreOApellido(filtroTexto.trim())
        : this.alumnoRepo.obtenerTodos(),
      this.tutorRepo.obtenerTodos(),
      this.cuotaRepo.obtenerTodas(),
      this.pagoRepo.obtenerTodos(),
    ])

    // Mapa de tutores por id
    const tutorMap = new Map<number, TutorProps>()
    for (const t of tutores) {
      tutorMap.set(t.id, t)
    }

    // Mapa de pagos agrupados por cuotaId
    const pagosPorCuota = new Map<number, PagoProps[]>()
    for (const p of pagos) {
      const list = pagosPorCuota.get(p.cuotaId) || []
      list.push(p)
      pagosPorCuota.set(p.cuotaId, list)
    }

    // Mapa de cuotas agrupadas por alumnoId
    const cuotasPorAlumno = new Map<number, CuotaProps[]>()
    for (const c of cuotas) {
      const list = cuotasPorAlumno.get(c.alumnoId) || []
      list.push(c)
      cuotasPorAlumno.set(c.alumnoId, list)
    }

    // Agrupación de alumnos por tutor_id para calcular cantidad real de hermanos
    const todosAlumnos = filtroTexto && filtroTexto.trim() ? await this.alumnoRepo.obtenerTodos() : alumnos
    const alumnosPorTutor = new Map<number, number>()
    for (const a of todosAlumnos) {
      if (a.tutorId != null) {
        alumnosPorTutor.set(a.tutorId, (alumnosPorTutor.get(a.tutorId) || 0) + 1)
      }
    }

    const fechaHoy = new Date()

    const alumnosResumen: AlumnoResumenDTO[] = alumnos.map((alumno) => {
      const tutor = alumno.tutorId != null ? tutorMap.get(alumno.tutorId) : undefined
      const cantidadHermanos = alumno.tutorId != null ? alumnosPorTutor.get(alumno.tutorId) || 1 : 1
      const porcentajeDescuento = calcularPorcentajeDescuentoHermanos(cantidadHermanos)

      const cuotasAlumno = cuotasPorAlumno.get(alumno.id) || []

      let cuotasSaldadasCount = 0
      let moraTotal = Dinero.cero()
      let deudaTotal = Dinero.cero()
      const cuotasImpagas: CuotaProps[] = []

      for (const cuota of cuotasAlumno) {
        const pagosCuota = pagosPorCuota.get(cuota.id) || []
        const saldada = estaCuotaSaldada(cuota, pagosCuota)

        if (saldada) {
          cuotasSaldadasCount++
        } else {
          cuotasImpagas.push(cuota)
          moraTotal = moraTotal.sumar(calcularMora(cuota, pagosCuota, fechaHoy))
          deudaTotal = deudaTotal.sumar(calcularDeudaCuota(cuota, pagosCuota))
        }
      }

      return {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        dni: alumno.dni,
        nivel: alumno.nivel,
        curso: alumno.curso,
        tutorId: alumno.tutorId,
        tutorNombre: tutor ? `${tutor.nombre} ${tutor.apellido}` : undefined,
        tutorEmail: tutor ? tutor.email : null,
        cantidadHermanos,
        porcentajeDescuento,
        arancelBase: alumno.arancelBase,
        cuotasSaldadasCount,
        moraTotal,
        deudaTotal,
        cuotasImpagas,
      }
    })

    return { alumnosResumen, tutores }
  }
}
