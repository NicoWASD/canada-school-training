-- Migración 0002: Corrección de SQL Injection y optimización de índices

-- 1. Corregir SQL Injection en función buscar_alumnos
-- Se evita la concatenación dinámica execute '... || q || ...' usando consulta parametrizada segura
create or replace function buscar_alumnos(q text)
returns setof alumnos as $$
begin
  return query
  select * from alumnos
  where nombre ilike ('%' || q || '%')
     or apellido ilike ('%' || q || '%');
end;
$$ language plpgsql;

-- 2. Índices para acelerar búsquedas y joins
create index if not exists idx_alumnos_tutor_id on alumnos(tutor_id);
create index if not exists idx_cuotas_alumno_id on cuotas(alumno_id);
create index if not exists idx_cuotas_estado on cuotas(estado);
create index if not exists idx_pagos_cuota_id on pagos(cuota_id);
