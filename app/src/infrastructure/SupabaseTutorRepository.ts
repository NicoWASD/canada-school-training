import type { SupabaseClient } from '@supabase/supabase-js'
import type { TutorProps } from '../domain/index.ts'
import type { TutorRepository } from '../application/index.ts'
import { fetchAllRowsFromSupabase } from './supabaseHelpers.ts'

export class SupabaseTutorRepository implements TutorRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  private toDomain(row: any): TutorProps {
    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      dni: row.dni,
      email: row.email || null,
      telefono: row.telefono || null,
    }
  }

  async obtenerTodos(): Promise<TutorProps[]> {
    const rows = await fetchAllRowsFromSupabase<any>(this.client, 'tutores')
    return rows.map((r) => this.toDomain(r))
  }
}
