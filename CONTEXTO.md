# Contexto del Proyecto — Canada School Training

Este documento recopila el contexto de negocio, técnico, accesos y estado actual del sistema para permitir retomar el desarrollo o auditoría de forma inmediata.

---

## 1. Información General y Repositorio

* **Proyecto:** Canada School — Sistema de Gestión Escolar (Caballito, CABA).
* **Propósito:** Proyecto de rescate/entrenamiento técnico (heredado de un vendor anterior con problemas críticos de rendimiento, seguridad y lógica financiera).
* **Repositorio Fork (tu cuenta):** [https://github.com/NicoWASD/canada-school-training](https://github.com/NicoWASD/canada-school-training)
* **Repositorio Upstream (original):** [https://github.com/seba-graciano/canada-school-training](https://github.com/seba-graciano/canada-school-training)
* **Directorio Local:** `C:\Users\nicol\OneDrive\Documentos\GitHub - Personal\canada-school-training`

---

## 2. Credenciales y Entorno

### Supabase
* **Dashboard Org:** `https://supabase.com/dashboard/org/vgcpzbwdyirstcbcvkxp`
* **Login Supabase:**
  * Usuario: `canadaschoolinstitute@gmail.com`
  * Contraseña: `gKBK&WbHKg9N8F#`
* **Database Password:** `Emmk3UGYGmyiixT4`

### Correo Institucional
* **Gmail:** `canadaschoolinstitute@gmail.com`
* **Password:** `canadaSchool2026!`

### Variables de Entorno (`app/.env`)
```ini
VITE_SUPABASE_URL=https://fbiqwwdyfualkbfqhzgv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaXF3d2R5ZnVhbGtiZnFoemd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzc1NzUsImV4cCI6MjEwMzk1MzU3NX0.DZaO501SLrYEMuOna2d0lNX1dZuolD9V_VZc8jl8V0U
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FAKE_service_role_placeholder_NO_USAR.0000000000000000000000000000000000000000000
```

---

## 3. Arquitectura del Sistema

El proyecto fue refactorizado a **Clean Architecture** (R. C. Martin) respetando la regla estricta de dependencias:
```
presentation ──▶ application ──▶ domain
                     ▲
infrastructure ──────┘  (implementa los puertos de application)
```

### Capas Implementadas en `app/src/`:
1. **`domain/` (100% puro):**
   * Sin dependencias de React, Vite ni `@supabase/supabase-js`.
   * `Dinero.ts`: Value Object inmutable que maneja importes en centavos enteros para evitar imprecisiones de coma flotante IEEE 754.
   * `types.ts`: Tipos puros (`AlumnoProps`, `TutorProps`, `CuotaProps`, `PagoProps`).
   * `reglasNegocio.ts`: Funciones de negocio puras (`calcularPorcentajeDescuentoHermanos`, `estaCuotaSaldada`, `calcularMora`, `calcularDeudaCuota`).
2. **`application/` (Casos de uso y Puertos):**
   * `ports/repositories.ts`: Interfaces abstractas (`AlumnoRepository`, `TutorRepository`, `CuotaRepository`, `PagoRepository`).
   * `useCases/`:
     * `ObtenerDashboardUseCase.ts`: Orquesta alumnos, tutores, cuotas y pagos.
     * `CuotasUseCases.ts`: `AplicarAumentoGeneralUseCase` (solo sobre cuotas impagas) y `RegistrarPagoUseCase`.
     * `CrearAlumnoUseCase.ts`: Alta de alumno validando datos obligatorios.
3. **`infrastructure/` (Adaptadores de Supabase):**
   * `supabaseHelpers.ts`: Paginador concurrente `fetchAllRowsFromSupabase` para superar el límite de 1000 filas de PostgREST.
   * `SupabaseAlumnoRepository.ts`, `SupabaseTutorRepository.ts`, `SupabaseCuotaRepository.ts`, `SupabasePagoRepository.ts`.
4. **`container.ts`:**
   * Contenedor de Inyección de Dependencias.
5. **`presentation/`:**
   * `hooks/useDashboard.ts`: Custom Hook orquestador del estado y los casos de uso.
   * `components/`: Componentes limpios (`TablaAlumnos.tsx`, `FormNuevoAlumno.tsx`, `ContactoModal.tsx`).
   * `AdminDashboard.tsx`: Contenedor principal de UI.

---

## 4. Estado de Corrección de Defectos Críticos

| Defecto | Estado Previo (Vendor) | Estado Actual (Corregido) |
| :--- | :--- | :--- |
| **SQL Injection** | `EXECUTE '... ' \|\| q \|\| '...'` en función `buscar_alumnos`. | Parametrizado seguro en `0001_schema.sql` y `0002_fix_sqli_and_indexes.sql`. |
| **Cuello de botella N+1** | 800 consultas HTTP secuenciales a `cuotas` (~40s a minutos). | Carga paralela con paginación (`range`), demora ~500ms. |
| **Descuento Hermanos** | Comparaba `alumnos[i].apellido == al.apellido`. | Agrupación real por `tutor_id` (1 hijo = 0%, 2 = 10%, 3+ = 20%). |
| **Aumento de Cuotas** | Pisaba el monto de todas las cuotas (incluso pagadas). | Aplica el 15% **únicamente** a cuotas pendientes / impagas. |
| **Coma flotante (Centavos)** | `0.10 + 0.20 !== 0.30` dejaba cuotas pagadas como impagas. | Manejo con `Dinero` en centavos enteros y tolerancia en comparación. |
| **Fugas de memoria** | `setInterval` sin cleanup y mutaciones `alumnos.push()`. | Hooks limpios con cleanup y actualización inmutable. |

---

## 5. Comandos para Levantar y Validar

En Windows PowerShell dentro de `app/`:
```powershell
# Levantar en desarrollo
cmd /c npm run dev

# Compilar proyecto y verificar TypeScript
cmd /c npm run build

# Validar linter (oxlint)
cmd /c npm run lint

# Chequeo de dependencias de Clean Architecture
node --experimental-strip-types check-architecture.ts
```
