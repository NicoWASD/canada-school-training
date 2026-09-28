import type { SupabaseClient } from '@supabase/supabase-js'
import type { AlumnoProps } from '../domain/index.ts'
import { Dinero } from '../domain/index.ts'
import type { AlumnoRepository } from '../application/index.ts'
import { fetchAllRowsFromSupabase } from './supabaseHelpers.ts'

export class SupabaseAlumnoRepository implements AlumnoRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  private toDomain(row: any): AlumnoProps {
    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      dni: row.dni,
      nivel: row.nivel,
      curso: row.curso,
      tutorId: row.tutor_id,
      arancelBase: Dinero.desdeMonto(Number(row.arancel_base || 0)),
      activo: Boolean(row.activo),
    }
  }

  async obtenerTodos(): Promise<AlumnoProps[]> {
    const rows = await fetchAllRowsFromSupabase<any>(this.client, 'alumnos')
    return rows.map((r) => this.toDomain(r))
  }

  async buscarPorNombreOApellido(query: string): Promise<AlumnoProps[]> {
    const res = await this.client.rpc('buscar_alumnos', { q: query })
    if (res.error) {
      console.error('Error en RPC buscar_alumnos:', res.error)
      return []
    }
    return (res.data || []).map((r: any) => this.toDomain(r))
  }

  async crear(alumno: Omit<AlumnoProps, 'id'>): Promise<AlumnoProps> {
    const raw = {
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      dni: alumno.dni,
      nivel: alumno.nivel,
      curso: alumno.curso,
      tutor_id: alumno.tutorId,
      arancel_base: alumno.arancelBase.monto,
      activo: alumno.activo,
    }

    const { data, error } = await this.client.from('alumnos').insert(raw).select()
    if (error) throw error
    if (!data || !data[0]) throw new Error('No se retornó el alumno insertado')
    return this.toDomain(data[0])
  }
}
