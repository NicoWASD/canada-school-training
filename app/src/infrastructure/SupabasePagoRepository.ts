import type { SupabaseClient } from '@supabase/supabase-js'
import type { PagoProps } from '../domain/index.ts'
import { Dinero } from '../domain/index.ts'
import type { PagoRepository } from '../application/index.ts'
import { fetchAllRowsFromSupabase } from './supabaseHelpers.ts'

export class SupabasePagoRepository implements PagoRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  private toDomain(row: any): PagoProps {
    return {
      id: row.id,
      cuotaId: row.cuota_id,
      montoAbonado: Dinero.desdeMonto(Number(row.monto_abonado || 0)),
      medioPago: row.medio_pago || 'efectivo',
      fechaPago: row.fecha_pago,
    }
  }

  async obtenerTodos(): Promise<PagoProps[]> {
    const rows = await fetchAllRowsFromSupabase<any>(this.client, 'pagos')
    return rows.map((r) => this.toDomain(r))
  }

  async registrar(pago: Omit<PagoProps, 'id'>): Promise<PagoProps> {
    const raw = {
      cuota_id: pago.cuotaId,
      monto_abonado: pago.montoAbonado.monto,
      medio_pago: pago.medioPago,
      fecha_pago: pago.fechaPago,
    }

    const { data, error } = await this.client.from('pagos').insert(raw).select()
    if (error) throw error
    if (!data || !data[0]) throw new Error('No se retornó el pago insertado')
    return this.toDomain(data[0])
  }

  suscribirACambios(callback: () => void): () => void {
    const channel = this.client
      .channel('pagos-live-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => {
        callback()
      })
      .subscribe()

    return () => {
      this.client.removeChannel(channel)
    }
  }
}
