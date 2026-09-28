import type { AlumnoProps, TutorProps, CuotaProps, PagoProps } from '../../domain/index.ts'

export interface AlumnoRepository {
  obtenerTodos(): Promise<AlumnoProps[]>
  buscarPorNombreOApellido(query: string): Promise<AlumnoProps[]>
  crear(alumno: Omit<AlumnoProps, 'id'>): Promise<AlumnoProps>
}

export interface TutorRepository {
  obtenerTodos(): Promise<TutorProps[]>
}

export interface CuotaRepository {
  obtenerTodas(): Promise<CuotaProps[]>
  actualizarMonto(id: number, nuevoMontoCentavos: number): Promise<void>
  marcarComoPagada(id: number): Promise<void>
}

export interface PagoRepository {
  obtenerTodos(): Promise<PagoProps[]>
  registrar(pago: Omit<PagoProps, 'id'>): Promise<PagoProps>
  suscribirACambios(callback: () => void): () => void
}
