import type { CuotaProps } from '../../domain/index.ts'
import { Dinero, estaCuotaSaldada } from '../../domain/index.ts'
import type { CuotaRepository, PagoRepository } from '../ports/index.ts'

export class AplicarAumentoGeneralUseCase {
  private readonly cuotaRepo: CuotaRepository
  private readonly pagoRepo: PagoRepository

  constructor(cuotaRepo: CuotaRepository, pagoRepo: PagoRepository) {
    this.cuotaRepo = cuotaRepo
    this.pagoRepo = pagoRepo
  }

  async ejecutar(porcentajeDecimal: number = 0.15): Promise<{ cuotasAfectadas: number }> {
    const [todasLasCuotas, todosLosPagos] = await Promise.all([
      this.cuotaRepo.obtenerTodas(),
      this.pagoRepo.obtenerTodos(),
    ])

    const pagosPorCuota = new Map<number, any[]>()
    for (const p of todosLosPagos) {
      const list = pagosPorCuota.get(p.cuotaId) || []
      list.push(p)
      pagosPorCuota.set(p.cuotaId, list)
    }

    // Regla de negocio inquebrantable: Aumentar ÚNICAMENTE cuotas pendientes/no saldadas
    const cuotasPendientes = todasLasCuotas.filter(
      (c) => !estaCuotaSaldada(c, pagosPorCuota.get(c.id) || [])
    )

    const factor = 1 + porcentajeDecimal

    for (const c of cuotasPendientes) {
      const nuevoMonto = c.monto.multiplicarPorFactor(factor)
      await this.cuotaRepo.actualizarMonto(c.id, nuevoMonto.centavos)
    }

    return { cuotasAfectadas: cuotasPendientes.length }
  }
}

export class RegistrarPagoUseCase {
  private readonly cuotaRepo: CuotaRepository
  private readonly pagoRepo: PagoRepository

  constructor(cuotaRepo: CuotaRepository, pagoRepo: PagoRepository) {
    this.cuotaRepo = cuotaRepo
    this.pagoRepo = pagoRepo
  }

  async ejecutar(cuota: CuotaProps, medioPago: string = 'efectivo'): Promise<void> {
    const pagos = await this.pagoRepo.obtenerTodos()
    const pagosDeEstaCuota = pagos.filter((p) => p.cuotaId === cuota.id)
    const yaAbonado = pagosDeEstaCuota.reduce((acum, p) => acum.sumar(p.montoAbonado), Dinero.cero())

    const totalEsperado = cuota.monto.sumar(cuota.recargo).restar(cuota.descuento)
    const faltante = totalEsperado.centavos > yaAbonado.centavos ? totalEsperado.restar(yaAbonado) : Dinero.cero()

    const hoyStr = new Date().toLocaleDateString('es-AR')

    await this.pagoRepo.registrar({
      cuotaId: cuota.id,
      montoAbonado: faltante,
      medioPago,
      fechaPago: hoyStr,
    })

    await this.cuotaRepo.marcarComoPagada(cuota.id)
  }
}
