import { supabase } from './supabase.ts'
import {
  SupabaseAlumnoRepository,
  SupabaseTutorRepository,
  SupabaseCuotaRepository,
  SupabasePagoRepository,
} from './infrastructure/index.ts'
import {
  ObtenerDashboardUseCase,
  AplicarAumentoGeneralUseCase,
  RegistrarPagoUseCase,
  CrearAlumnoUseCase,
} from './application/index.ts'

// Instanciación de repositorios (infraestructura)
export const alumnoRepository = new SupabaseAlumnoRepository(supabase)
export const tutorRepository = new SupabaseTutorRepository(supabase)
export const cuotaRepository = new SupabaseCuotaRepository(supabase)
export const pagoRepository = new SupabasePagoRepository(supabase)

// Instanciación de Casos de Uso (aplicación) inyectando dependencias
export const obtenerDashboardUseCase = new ObtenerDashboardUseCase(
  alumnoRepository,
  tutorRepository,
  cuotaRepository,
  pagoRepository
)

export const aplicarAumentoGeneralUseCase = new AplicarAumentoGeneralUseCase(
  cuotaRepository,
  pagoRepository
)

export const registrarPagoUseCase = new RegistrarPagoUseCase(
  cuotaRepository,
  pagoRepository
)

export const crearAlumnoUseCase = new CrearAlumnoUseCase(alumnoRepository)
