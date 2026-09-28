import { Dinero } from './Dinero'

export interface TutorProps {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string | null
  telefono: string | null
}

export interface AlumnoProps {
  id: number
  nombre: string
  apellido: string
  dni: string
  nivel: string
  curso: string
  tutorId: number | null
  arancelBase: Dinero
  activo: boolean
}

export type EstadoCuota = 'pendiente' | 'pagado' | 'vencida'

export interface CuotaProps {
  id: number
  alumnoId: number
  concepto: string
  mes: number
  anio: number
  monto: Dinero
  descuento: Dinero
  recargo: Dinero
  estado: EstadoCuota
  fechaVencimiento: string | null
}

export interface PagoProps {
  id: number
  cuotaId: number
  montoAbonado: Dinero
  medioPago: string
  fechaPago: string
}
