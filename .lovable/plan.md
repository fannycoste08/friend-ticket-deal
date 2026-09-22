# Filtro por ciudad en la Agenda de conciertos

## Dónde están los datos hoy

La agenda **no está en la base de datos**. Está en una hoja de cálculo de Google Sheets, en la pestaña llamada `2026`, y se leen las columnas A–D:

| A | B | C | D |
|---|---|---|---|
| Fecha | Artista | Sala | Precio |

La app lee esa hoja a través de una función de servidor (`get-conciertos`), guarda el resultado un minuto en memoria y la página de Música lo muestra en la tabla.

## Cambio que necesito de tu parte

Añadir una **columna E llamada "Ciudad"** en la pestaña `2026` de la hoja, y rellenarla (Madrid, Barcelona, etc.). Las filas que queden vacías se tratarán como "Madrid" para no perder los conciertos actuales.

## Qué haré yo

1. Ampliar la lectura de la hoja de A:D a A:E e incluir la ciudad en los datos que devuelve el servidor (con "Madrid" como valor por defecto si la celda está vacía).
2. En la página de Música, añadir encima de la tabla unos botones de ciudad generados automáticamente a partir de los datos: `Todas · Madrid · Barcelona · ...` (solo aparecen las ciudades que realmente tengan conciertos).
3. Filtro por defecto: **Todas**.
4. Añadir una columna "Ciudad" en la tabla cuando el filtro está en "Todas" (se oculta si ya has elegido una ciudad concreta, para no repetir información).
5. Título dinámico: "Agenda de conciertos en Madrid" / "en Barcelona" / solo "Agenda de conciertos" en "Todas".
6. Mantener todo lo actual: orden por fecha, ocultar conciertos pasados, botón de actualizar y el texto explicativo.

## Notas

- No hace falta ningún cambio en la base de datos.
- Si prefieres que por defecto se muestre la ciudad con más conciertos en lugar de "Todas", dímelo y lo cambio.
