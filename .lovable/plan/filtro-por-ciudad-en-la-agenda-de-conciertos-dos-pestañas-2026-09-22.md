# Filtro por ciudad en la Agenda de conciertos (dos pestañas)

## Dónde están los datos

La agenda **no está en la base de datos**: está en tu hoja de Google Sheets, con dos pestañas:
- `2026` → conciertos de **Madrid**
- `Barcelona 2026-2027` → conciertos de **Barcelona**

Ambas con el mismo formato A–D: Fecha, Artista, Sala, Precio.

**No tienes que tocar el Excel**: la ciudad se asigna automáticamente según la pestaña de la que viene cada fila.

## Cambios en get-conciertos (función de servidor)

1. En lugar de una sola lectura (`2026!A2:D1000`), hará una **lectura por lotes de ambas pestañas** (`batchGet`), que cuenta como una sola llamada — importante para no volver a chocar con el límite de consultas de Google que ya nos dio errores 429.
2. A cada fila de `2026` se le asigna `ciudad: "Madrid"` y a cada fila de `Barcelona 2026-2027`, `ciudad: "Barcelona"`. Si una pestaña no existe o está vacía, simplemente no aporta conciertos (la otra sigue funcionando).
3. La respuesta incluye ahora el campo `ciudad` por concierto.
4. El resto se mantiene igual: caché de 1 minuto, reintentos automáticos, mensajes de error genéricos.

## Cambios en la página de Música

1. Encima de la tabla, botones: **Todas · Madrid · Barcelona** (solo aparecen ciudades que realmente tengan conciertos).
2. Filtro por defecto: **Todas**.
3. Título dinámico: "Agenda de conciertos en Madrid" / "en Barcelona" / "Agenda de conciertos" en "Todas".
4. Columna "Ciudad" visible solo cuando el filtro es "Todas".
5. Se conserva: orden por fecha, ocultar pasados, botón de actualizar, texto explicativo.

## Notas

- Sin cambios en la base de datos.
- El despliegue de la función se hace al final, junto con la página.
