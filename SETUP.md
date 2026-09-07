# SETUP — Levantar el proyecto en local

## 0. Requisitos
- Node 20+ y npm.
- Una cuenta de Supabase.

## 1. Instalar
```bash
cd app && npm install
```

## 2. Base de datos (tu propia Supabase)
1. Creá un proyecto en https://supabase.com.
2. Aplicá el esquema y los datos (SQL Editor del dashboard, o psql):
   - `supabase/migrations/0001_schema.sql`
   - `supabase/seed.sql`
3. Copiá tus claves desde Project Settings → API (URL y anon key).

## 3. Variables de entorno
```bash
cd app
cp env.example .env    # completá con tus valores
```
La app corre con `VITE_SUPABASE_ANON_KEY`.

## 4. Levantar la app
```bash
cd app
NODE_OPTIONS=--max-http-header-size=65536 npm run dev
```
Abrí `http://localhost:5173` y clic en **Ingresar**.

> Notas: el `NODE_OPTIONS` evita un `HTTP 431` por headers grandes. Si al abrir ves pantalla en
> blanco, probablemente creaste el `.env` después de arrancar Vite: reiniciá el dev server. La lista
> de alumnos puede tardar en cargar la primera vez.
