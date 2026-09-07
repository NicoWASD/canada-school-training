# Desafío de Arquitectura (Fase 2 del proyecto)

Una vez que endurezcas el código y corrijas los defectos de tu track, viene el desafío senior:
**darle a este sistema una arquitectura limpia**. Hoy no la tiene — la UI habla con la base de
datos directo y las reglas de negocio (mora, descuentos, aumentos, cobros) están mezcladas dentro
de un componente de React. Eso lo hace imposible de testear y de mantener.

El objetivo es refactorizar hacia **Clean Architecture** (R. C. Martin), separando responsabilidades
por capas y respetando la **regla de dependencia**: las dependencias apuntan siempre hacia adentro,
hacia el dominio.

## Estructura objetivo

```
src/
  domain/          # Entidades, value objects y reglas de negocio PURAS.
                   # No importa React, ni Supabase, ni ninguna librería externa.
                   # Ej: Dinero (centavos enteros), Cuota, GrupoFamiliar, calcularMora (pura).
  application/     # Casos de uso. Orquestan el dominio. Dependen de PUERTOS, no de adaptadores.
    ports/         # Interfaces (ej: CuotaRepository, PagoRepository).
                   # Ej: RegistrarPago, AplicarAumento, CalcularDeuda.
  infrastructure/  # Adaptadores. Implementan los puertos con Supabase.
                   # Ej: SupabaseCuotaRepository implements CuotaRepository.
  presentation/    # React. Componentes tontos (container/presentational).
                   # No accede a Supabase directo: usa los casos de uso.
```

## Regla de dependencia (la clave)

```
presentation ─▶ application ─▶ domain
                     ▲
infrastructure ──────┘  (implementa los puertos; nadie de adentro la conoce)
```

- `domain/` no importa NADA de afuera. Es el corazón, testeable sin mocks.
- `application/` depende de `domain/` y de sus propios `ports/` (interfaces), nunca de Supabase.
- `infrastructure/` implementa esos puertos (inversión de dependencias).
- `presentation/` invoca casos de uso; no arma queries.

## Cómo sabés que terminaste

Tu refactor está completo cuando se cumple la regla de dependencia. El mentor lo mide con una
fitness function que verifica, entre otras cosas, que `domain/` no importe Supabase/React y que
los casos de uso no conozcan la infraestructura. No se trata de "que compile": se trata de que las
**dependencias apunten en la dirección correcta**.

> Pista: si extraés bien el dominio (por ejemplo, `Dinero` en centavos enteros y una `calcularMora`
> pura que recibe la fecha por parámetro), vas a descubrir que varios de los defectos que venías
> arrastrando se vuelven imposibles de cometer. Esa es la idea: **una buena arquitectura previene
> bugs, no sólo los ordena.**
