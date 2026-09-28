import { useEffect, useState, useMemo } from 'react'
import { supabase } from './supabase'
import _ from 'lodash'
import * as Icons from 'react-icons/fa'
import { useApp } from './AppContext'

// Utilidad para chequear si un estado representa "pagado"
function esEstadoPagado(estado: string | null | undefined): boolean {
  if (!estado) return false
  const norm = estado.trim().toLowerCase()
  return norm === 'pagado' || norm === 'pago' || norm === 'ok'
}

// Utilidad para redondear a 2 decimales para evitar problemas de coma flotante
function redondear(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export default function AdminDashboard(props: any) {
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<any[]>([])
  const [cuotas, setCuotas] = useState<any[]>([])
  const [tutores, setTutores] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { filtro, setFiltro } = useApp()
  const [contador, setContador] = useState(0)
  const [detalle, setDetalle] = useState<any>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [nuevoDni, setNuevoDni] = useState('')
  const [nuevoArancel, setNuevoArancel] = useState('')

  useEffect(() => {
    cargar()

    // Suscripción a cambios de pagos en vivo
    const canal = supabase
      .channel('pagos-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => {
        cargar()
      })
      .subscribe()

    // Contador visual con cleanup adecuado
    const intervalId = setInterval(() => {
      setContador((prev) => prev + 1)
    }, 5000)

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(canal)
    }
  }, [])

  // Carga paginada eficiente para tablas que superan el límite de 1000 filas de PostgREST
  async function fetchAllRows(tableName: string) {
    let rows: any[] = []
    let page = 0
    const pageSize = 1000
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      if (error) {
        console.error(`Error fetching ${tableName}:`, error)
        break
      }
      if (!data || data.length === 0) break
      rows = rows.concat(data)
      if (data.length < pageSize) break
      page++
    }
    return rows
  }

  async function cargar() {
    setLoading(true)
    try {
      // Carga concurrente en lote para eliminar el cuello de botella N+1 (800 llamadas secuenciales)
      const [alumnosData, tutoresData, cuotasData, pagosData] = await Promise.all([
        fetchAllRows('alumnos'),
        fetchAllRows('tutores'),
        fetchAllRows('cuotas'),
        fetchAllRows('pagos'),
      ])

      setAlumnos(alumnosData)
      setAlumnosFiltrados(alumnosData)
      setCuotas(cuotasData)
      setTutores(tutoresData)
      setPagos(pagosData)
    } catch (e) {
      console.error('Error cargando datos:', e)
    } finally {
      setLoading(false)
    }
  }

  async function buscar(texto: string) {
    setFiltro(texto)
    if (!texto.trim()) {
      setAlumnosFiltrados(alumnos)
      return
    }
    const res = await supabase.rpc('buscar_alumnos', { q: texto.trim() })
    if (res.data) {
      setAlumnosFiltrados(res.data)
    }
  }

  function verContacto(al: any) {
    const t = tutores.find((x: any) => x.id === al.tutor_id)
    const email = t && t.email ? t.email.toLowerCase() : 'Sin email registrado'
    setDetalle({ nombre: `${al.nombre} ${al.apellido}`, email })
  }

  // Diccionarios indexados en memoria para O(1) de pagos y cuotas por alumno/cuota
  const pagosPorCuota = useMemo(() => {
    const map = new Map<number, number>()
    for (const p of pagos) {
      const actual = map.get(p.cuota_id) || 0
      map.set(p.cuota_id, redondear(actual + Number(p.monto_abonado || 0)))
    }
    return map
  }, [pagos])

  const cuotasPorAlumno = useMemo(() => {
    const map = new Map<number, any[]>()
    for (const c of cuotas) {
      const list = map.get(c.alumno_id) || []
      list.push(c)
      map.set(c.alumno_id, list)
    }
    return map
  }, [cuotas])

  // Cantidad de hermanos agrupados por tutor_id real (familia real)
  const hermanosPorTutor = useMemo(() => {
    const map = new Map<number, number>()
    for (const a of alumnos) {
      if (a.tutor_id != null) {
        map.set(a.tutor_id, (map.get(a.tutor_id) || 0) + 1)
      }
    }
    return map
  }, [alumnos])

  function pagadoDe(cuota: any): number {
    return pagosPorCuota.get(cuota.id) || 0
  }

  // Una cuota está saldada si su estado es pagado o si lo abonado cubre el monto (con tolerancia a centavos)
  function estaSaldada(cuota: any): boolean {
    if (esEstadoPagado(cuota.estado)) return true
    const abonado = pagadoDe(cuota)
    const totalEsperado = redondear(Number(cuota.monto) + Number(cuota.recargo || 0) - Number(cuota.descuento || 0))
    return abonado >= totalEsperado - 0.01
  }

  function saldadasDe(al: any): number {
    const cuotasAl = cuotasPorAlumno.get(al.id) || []
    return cuotasAl.filter(estaSaldada).length
  }

  function deudaDe(al: any): number {
    const cuotasAl = cuotasPorAlumno.get(al.id) || []
    let total = 0
    for (const c of cuotasAl) {
      if (!estaSaldada(c)) {
        const esperado = redondear(Number(c.monto) + Number(c.recargo || 0) - Number(c.descuento || 0))
        const faltante = redondear(esperado - pagadoDe(c))
        if (faltante > 0) total += faltante
      }
    }
    return redondear(total)
  }

  // Conteo de hermanos por tutor_id real
  function hermanos(al: any): number {
    if (al.tutor_id == null) return 1
    return hermanosPorTutor.get(al.tutor_id) || 1
  }

  // Regla oficial de Canadá School: 10% al 2º hijo, 20% al 3º o más
  function descuentoHermano(al: any): number {
    const h = hermanos(al)
    if (h === 2) return 0.1
    if (h >= 3) return 0.2
    return 0
  }

  // Recargo por mora: $50 por cada día de atraso desde el vencimiento (sólo si no está saldada)
  function calcularMora(cuota: any): number {
    if (estaSaldada(cuota)) return 0
    if (!cuota.fecha_vencimiento) return 0

    const partes = String(cuota.fecha_vencimiento).split('/')
    if (partes.length !== 3) return 0

    const venc = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]))
    const hoy = new Date()
    // Normalizar a inicio del día para evitar discrepancias de horas
    venc.setHours(0, 0, 0, 0)
    hoy.setHours(0, 0, 0, 0)

    const diffMs = hoy.getTime() - venc.getTime()
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (dias > 0) return dias * 50
    return 0
  }

  function moraDe(al: any): number {
    const cuotasAl = cuotasPorAlumno.get(al.id) || []
    let total = 0
    for (const c of cuotasAl) {
      total += calcularMora(c)
    }
    return redondear(total)
  }

  // Aumento de aranceles: aplica el 15% ÚNICAMENTE sobre cuotas NO pagadas/pendientes
  async function aumentarCuotas() {
    setLoading(true)
    try {
      // Filtrar únicamente cuotas pendientes/no saldadas
      const cuotasPendientes = cuotas.filter((c) => !estaSaldada(c))
      if (cuotasPendientes.length === 0) {
        alert('No hay cuotas pendientes para aplicar aumento.')
        setLoading(false)
        return
      }

      // Actualizar en bloques para mayor rapidez
      for (const c of cuotasPendientes) {
        const nuevoMonto = redondear(Number(c.monto) * 1.15)
        await supabase.from('cuotas').update({ monto: nuevoMonto }).eq('id', c.id)
      }

      alert(`Aumento del 15% aplicado a ${cuotasPendientes.length} cuotas pendientes.`)
      await cargar()
    } catch (err) {
      console.error('Error aplicando aumento:', err)
      alert('Error al aplicar aumento.')
      setLoading(false)
    }
  }

  async function cobrar(cuota: any) {
    try {
      const montoTotal = redondear(Number(cuota.monto) + Number(cuota.recargo || 0) - Number(cuota.descuento || 0))
      const yaPagado = pagadoDe(cuota)
      const montoAPagar = redondear(Math.max(0, montoTotal - yaPagado))

      const hoyStr = new Date().toLocaleDateString('es-AR')

      const { error: errorPago } = await supabase.from('pagos').insert({
        cuota_id: cuota.id,
        monto_abonado: montoAPagar,
        medio_pago: 'efectivo',
        fecha_pago: hoyStr,
      })

      if (errorPago) throw errorPago

      const { error: errorCuota } = await supabase
        .from('cuotas')
        .update({ estado: 'pagado' })
        .eq('id', cuota.id)

      if (errorCuota) throw errorCuota

      alert('Pago registrado exitosamente.')
      await cargar()
    } catch (err) {
      console.error('Error al cobrar cuota:', err)
      alert('No se pudo registrar el pago.')
    }
  }

  async function crearAlumno() {
    if (!nuevoNombre.trim() || !nuevoApellido.trim() || !nuevoDni.trim()) {
      alert('Por favor complete nombre, apellido y DNI.')
      return
    }

    const nuevo: any = {
      nombre: nuevoNombre.trim(),
      apellido: nuevoApellido.trim(),
      dni: nuevoDni.trim(),
      nivel: 'Primario',
      curso: '1º Primaria',
      arancel_base: Number(nuevoArancel) || 0,
      activo: true,
    }

    const { data, error } = await supabase.from('alumnos').insert(nuevo).select()
    if (error) {
      alert('Error al crear el alumno: ' + error.message)
      return
    }

    if (data && data[0]) {
      setAlumnos((prev) => [...prev, data[0]])
      setAlumnosFiltrados((prev) => [...prev, data[0]])
    }

    setNuevoNombre('')
    setNuevoApellido('')
    setNuevoDni('')
    setNuevoArancel('')
  }

  if (loading) {
    return <div className="spin">Cargando alumnos y estado de cuenta...</div>
  }

  const usuario = props.user as unknown as { rol: string }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ fontSize: 22, color: '#c0142c', fontWeight: 'bold' }}>
          <Icons.FaSchool style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Canada School - Panel {usuario.rol}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>refresh #{contador}</div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Buscar alumno..."
          value={filtro}
          onChange={(e) => buscar(e.target.value)}
          style={{ padding: 8, width: 260 }}
        />
        <button className="btn" style={{ marginLeft: 10 }} onClick={aumentarCuotas}>
          Aplicar aumento 15% (pendientes)
        </button>
      </div>

      {detalle && (
        <div style={{ marginBottom: 15, background: '#eef', padding: 10 }}>
          <b>Contacto de {detalle.nombre}:</b> {detalle.email}
          <button className="btn" style={{ marginLeft: 10 }} onClick={() => setDetalle(null)}>
            Cerrar
          </button>
        </div>
      )}

      <div style={{ marginBottom: 15, background: '#fff', padding: 10 }}>
        <b>Nuevo alumno:</b>
        <input
          placeholder="Nombre"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <input
          placeholder="Apellido"
          value={nuevoApellido}
          onChange={(e) => setNuevoApellido(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <input
          placeholder="DNI"
          value={nuevoDni}
          onChange={(e) => setNuevoDni(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <input
          placeholder="Arancel"
          value={nuevoArancel}
          onChange={(e) => setNuevoArancel(e.target.value)}
          style={{ marginLeft: 8, width: 90 }}
        />
        <button className="btn" style={{ marginLeft: 8 }} onClick={crearAlumno}>
          Crear
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>DNI</th>
            <th>Nivel</th>
            <th>Curso</th>
            <th>Hermanos</th>
            <th>Desc.</th>
            <th>Arancel</th>
            <th>Saldadas</th>
            <th>Mora</th>
            <th>Deuda</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {_.orderBy(alumnosFiltrados, ['apellido'], ['asc']).map((a: any) => {
            const cuotasAl = cuotasPorAlumno.get(a.id) || []
            const cuotasImpagas = cuotasAl.filter((c: any) => !estaSaldada(c))
            const mora = moraDe(a)
            const deuda = deudaDe(a)

            return (
              <tr key={a.id}>
                <td>
                  <a onClick={() => verContacto(a)} style={{ cursor: 'pointer', color: '#0645ad' }}>
                    {a.nombre} {a.apellido}
                  </a>
                </td>
                <td>{a.dni}</td>
                <td>{a.nivel}</td>
                <td>{a.curso}</td>
                <td>{hermanos(a)}</td>
                <td>{descuentoHermano(a) * 100}%</td>
                <td>${a.arancel_base}</td>
                <td>{saldadasDe(a)}</td>
                <td style={{ color: mora > 0 ? '#c0142c' : '#999' }}>${mora}</td>
                <td style={{ color: deuda > 0 ? 'red' : 'green' }}>${deuda}</td>
                <td>
                  {cuotasImpagas.map((c: any) => (
                    <button
                      key={c.id}
                      className="btn"
                      style={{ marginRight: 4, fontSize: 11, padding: '3px 6px' }}
                      onClick={() => cobrar(c)}
                    >
                      Cobrar {c.mes}/{c.anio}
                    </button>
                  ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
