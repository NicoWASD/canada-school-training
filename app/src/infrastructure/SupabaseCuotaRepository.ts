import type { SupabaseClient } from '@supabase/supabase-js'
import type { CuotaProps, EstadoCuota } from '../domain/index.ts'
import { Dinero } from '../domain/index.ts'
import type { CuotaRepository } from '../application/index.ts'
import { fetchAllRowsFromSupabase } from './supabaseHelpers.ts'

export class SupabaseCuotaRepository implements CuotaRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  private toDomain(row: any): CuotaProps {
    return {
      id: row.id,
      alumnoId: row.alumno_id,
      concepto: row.concepto,
      mes: Number(row.mes),
      anio: Number(row.anio),
      monto: Dinero.desdeMonto(Number(row.monto || 0)),
      descuento: Dinero.desdeMonto(Number(row.descuento || 0)),
      recargo: Dinero.desdeMonto(Number(row.recargo || 0)),
      estado: (row.estado || 'pendiente') as EstadoCuota,
      fechaVencimiento: row.fecha_vencimiento || null,
    }
  }

  async obtenerTodas(): Promise<CuotaProps[]> {
    const rows = await fetchAllRowsFromSupabase<any>(this.client, 'cuotas')
    return rows.map((r) => this.toDomain(r))
  }

  async actualizarMonto(id: number, nuevoMontoCentavos: number): Promise<void> {
    const montoFloat = nuevoMontoCentavos / 100
    const { error } = await this.client
      .from('cuotas')
      .update({ monto: montoFloat })
      .eq('id', id)
    if (error) throw error
  }

  async marcarComoPagada(id: number): Promise<void> {
    const { error } = await this.client
      .from('cuotas')
      .update({ estado: 'pagado' })
      .eq('id', id)
    if (error) throw error
  }
}
