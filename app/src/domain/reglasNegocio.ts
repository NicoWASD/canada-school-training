import type { CuotaProps, PagoProps } from './types.ts'
import { Dinero } from './Dinero.ts'

/**
 * Normaliza el string de estado para determinar si una cuota está marcada formalmente como pagada.
 */
export function esEstadoPagado(estado: string | null | undefined): boolean {
  if (!estado) return false
  const norm = estado.trim().toLowerCase()
  return norm === 'pagado' || norm === 'pago' || norm === 'ok'
}

/**
 * Calcula la suma total abonada para una cuota dada.
 */
export function calcularTotalAbonado(pagosCuota: PagoProps[]): Dinero {
  return pagosCuota.reduce((acum, pago) => acum.sumar(pago.montoAbonado), Dinero.cero())
}

/**
 * Calcula el monto neto esperado a abonar para una cuota (monto + recargo - descuento).
 */
export function calcularMontoEsperado(cuota: CuotaProps): Dinero {
  const base = cuota.monto.sumar(cuota.recargo)
  return cuota.descuento.centavos <= base.centavos ? base.restar(cuota.descuento) : Dinero.cero()
}

/**
 * Determina si una cuota está saldada ya sea por estado o por montos abonados.
 */
export function estaCuotaSaldada(cuota: CuotaProps, pagosCuota: PagoProps[]): boolean {
  if (esEstadoPagado(cuota.estado)) return true
  const totalAbonado = calcularTotalAbonado(pagosCuota)
  const esperado = calcularMontoEsperado(cuota)
  return totalAbonado.esMayorOIgualQue(esperado, 1) // tolerancia de 1 centavo
}

/**
 * Función pura para calcular el recargo de mora:
 * $50 por cada día de atraso desde el vencimiento, si la cuota no está saldada.
 */
export function calcularMora(
  cuota: CuotaProps,
  pagosCuota: PagoProps[],
  fechaReferencia: Date = new Date()
): Dinero {
  if (estaCuotaSaldada(cuota, pagosCuota)) return Dinero.cero()
  if (!cuota.fechaVencimiento) return Dinero.cero()

  const partes = cuota.fechaVencimiento.split('/')
  if (partes.length !== 3) return Dinero.cero()

  const dia = Number(partes[0])
  const mes = Number(partes[1]) - 1
  const anio = Number(partes[2])

  const venc = new Date(anio, mes, dia)
  venc.setHours(0, 0, 0, 0)

  const ref = new Date(fechaReferencia)
  ref.setHours(0, 0, 0, 0)

  const diffMs = ref.getTime() - venc.getTime()
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (dias > 0) {
    return Dinero.desdeMonto(dias * 50)
  }
  return Dinero.cero()
}

/**
 * Regla de negocio oficial de Canadá School:
 * Descuento por hermanos en la misma familia real (tutor_id):
 * - 1 hijo: 0%
 * - 2 hijos: 10% (0.10)
 * - 3 hijos o más: 20% (0.20)
 */
export function calcularPorcentajeDescuentoHermanos(cantidadHijos: number): number {
  if (cantidadHijos === 2) return 0.1
  if (cantidadHijos >= 3) return 0.2
  return 0
}

/**
 * Calcula la deuda pendiente de una cuota considerando pagos parciales.
 */
export function calcularDeudaCuota(cuota: CuotaProps, pagosCuota: PagoProps[]): Dinero {
  if (estaCuotaSaldada(cuota, pagosCuota)) return Dinero.cero()
  const esperado = calcularMontoEsperado(cuota)
  const abonado = calcularTotalAbonado(pagosCuota)
  return esperado.centavos > abonado.centavos ? esperado.restar(abonado) : Dinero.cero()
}
