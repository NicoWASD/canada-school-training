import type { AlumnoProps } from '../../domain/index.ts'
import { Dinero } from '../../domain/index.ts'
import type { AlumnoRepository } from '../ports/index.ts'

export interface CrearAlumnoDTO {
  nombre: string
  apellido: string
  dni: string
  nivel?: string
  curso?: string
  arancelBaseNumero: number
  tutorId?: number | null
}

export class CrearAlumnoUseCase {
  private readonly alumnoRepo: AlumnoRepository

  constructor(alumnoRepo: AlumnoRepository) {
    this.alumnoRepo = alumnoRepo
  }

  async ejecutar(dto: CrearAlumnoDTO): Promise<AlumnoProps> {
    if (!dto.nombre.trim() || !dto.apellido.trim() || !dto.dni.trim()) {
      throw new Error('Nombre, apellido y DNI son obligatorios.')
    }

    return await this.alumnoRepo.crear({
      nombre: dto.nombre.trim(),
      apellido: dto.apellido.trim(),
      dni: dto.dni.trim(),
      nivel: dto.nivel || 'Primario',
      curso: dto.curso || '1º Primaria',
      arancelBase: Dinero.desdeMonto(dto.arancelBaseNumero || 0),
      tutorId: dto.tutorId ?? null,
      activo: true,
    })
  }
}
