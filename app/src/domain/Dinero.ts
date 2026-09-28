/**
 * Value Object inmutable para representar montos monetarios en centavos enteros.
 * Erradica por diseño errores de precisión de punto flotante IEEE 754.
 */
export class Dinero {
  private readonly _centavos: number

  private constructor(centavos: number) {
    this._centavos = Math.round(centavos)
  }

  public static desdeCentavos(centavos: number): Dinero {
    return new Dinero(centavos)
  }

  public static desdeMonto(monto: number): Dinero {
    return new Dinero(monto * 100)
  }

  public static cero(): Dinero {
    return new Dinero(0)
  }

  public get centavos(): number {
    return this._centavos
  }

  public get monto(): number {
    return this._centavos / 100
  }

  public sumar(otro: Dinero): Dinero {
    return new Dinero(this._centavos + otro._centavos)
  }

  public restar(otro: Dinero): Dinero {
    return new Dinero(this._centavos - otro._centavos)
  }

  public multiplicarPorFactor(factor: number): Dinero {
    return new Dinero(this._centavos * factor)
  }

  public esMayorOIgualQue(otro: Dinero, toleranciaCentavos = 1): boolean {
    return this._centavos >= otro._centavos - toleranciaCentavos
  }

  public esCero(): boolean {
    return this._centavos === 0
  }

  public esPositivo(): boolean {
    return this._centavos > 0
  }

  public formatear(): string {
    return this.monto.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}
