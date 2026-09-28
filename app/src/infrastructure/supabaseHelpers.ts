import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Función utilitaria para paginar la lectura completa de tablas grandes
 * que superan el límite de 1000 filas por defecto de PostgREST / Supabase.
 */
export async function fetchAllRowsFromSupabase<T>(
  client: SupabaseClient,
  tableName: string
): Promise<T[]> {
  let rows: T[] = []
  let page = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) {
      console.error(`Error fetching all from ${tableName}:`, error)
      break
    }
    if (!data || data.length === 0) break
    rows = rows.concat(data as T[])
    if (data.length < pageSize) break
    page++
  }
  return rows
}
