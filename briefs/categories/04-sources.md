# 04. Fuentes e interpretación

40 animaciones; IDs LAW-0121–LAW-0160. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-0121 · Texto y contexto — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Texto y contexto» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una palabra se amplía y vuelve a situarse dentro del artículo completo.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de texto y contexto en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una palabra se amplía y vuelve a situarse dentro del artículo completo.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura aislada` / `lectura contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una palabra se amplía y vuelve a situarse dentro del artículo completo. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0121.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0122 · Texto y contexto — Mecanismo o relación explicada

**Objetivo:** Descomponer «Texto y contexto» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una palabra se amplía y vuelve a situarse dentro del artículo completo.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una palabra se amplía y vuelve a situarse dentro del artículo completo.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en texto y contexto.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura aislada` / `lectura contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una palabra se amplía y vuelve a situarse dentro del artículo completo» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0122.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0123 · Texto y contexto — Comparación de dos supuestos

**Objetivo:** Comparar «Lectura aislada» y «lectura contextual» dentro de texto y contexto, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una palabra se amplía y vuelve a situarse dentro del artículo completo.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de texto y contexto, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Lectura aislada» y en B «lectura contextual» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una palabra se amplía y vuelve a situarse dentro del artículo completo» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura aislada` / `lectura contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Lectura aislada / lectura contextual debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0123.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0124 · Texto y contexto — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Texto y contexto» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una palabra se amplía y vuelve a situarse dentro del artículo completo.

**Composición:** Escena principal de texto y contexto con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una palabra se amplía y vuelve a situarse dentro del artículo completo.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Lectura aislada» de «lectura contextual».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura aislada` / `lectura contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para texto y contexto, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0124.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0125 · Definición legislativa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Definición legislativa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un término se conecta con una definición suministrada en otra sección.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de definición legislativa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un término se conecta con una definición suministrada en otra sección.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Término definido` / `uso ordinario propuesto`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un término se conecta con una definición suministrada en otra sección. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0125.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0126 · Definición legislativa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Definición legislativa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un término se conecta con una definición suministrada en otra sección.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un término se conecta con una definición suministrada en otra sección.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en definición legislativa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Término definido` / `uso ordinario propuesto`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un término se conecta con una definición suministrada en otra sección» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0126.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0127 · Definición legislativa — Comparación de dos supuestos

**Objetivo:** Comparar «Término definido» y «uso ordinario propuesto» dentro de definición legislativa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un término se conecta con una definición suministrada en otra sección.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de definición legislativa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Término definido» y en B «uso ordinario propuesto» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un término se conecta con una definición suministrada en otra sección» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Término definido` / `uso ordinario propuesto`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Término definido / uso ordinario propuesto debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0127.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0128 · Definición legislativa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Definición legislativa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un término se conecta con una definición suministrada en otra sección.

**Composición:** Escena principal de definición legislativa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un término se conecta con una definición suministrada en otra sección.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Término definido» de «uso ordinario propuesto».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Término definido` / `uso ordinario propuesto`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para definición legislativa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0128.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0129 · Conflicto entre textos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Conflicto entre textos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos disposiciones se aproximan y resaltan su zona de tensión.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de conflicto entre textos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos disposiciones se aproximan y resaltan su zona de tensión.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aplicación compatible` / `conflicto señalado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos disposiciones se aproximan y resaltan su zona de tensión. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0129.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0130 · Conflicto entre textos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Conflicto entre textos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos disposiciones se aproximan y resaltan su zona de tensión.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos disposiciones se aproximan y resaltan su zona de tensión.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en conflicto entre textos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aplicación compatible` / `conflicto señalado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos disposiciones se aproximan y resaltan su zona de tensión» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0130.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0131 · Conflicto entre textos — Comparación de dos supuestos

**Objetivo:** Comparar «Aplicación compatible» y «conflicto señalado» dentro de conflicto entre textos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos disposiciones se aproximan y resaltan su zona de tensión.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de conflicto entre textos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Aplicación compatible» y en B «conflicto señalado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos disposiciones se aproximan y resaltan su zona de tensión» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aplicación compatible` / `conflicto señalado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Aplicación compatible / conflicto señalado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0131.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0132 · Conflicto entre textos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Conflicto entre textos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos disposiciones se aproximan y resaltan su zona de tensión.

**Composición:** Escena principal de conflicto entre textos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos disposiciones se aproximan y resaltan su zona de tensión.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Aplicación compatible» de «conflicto señalado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aplicación compatible` / `conflicto señalado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para conflicto entre textos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0132.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0133 · Ámbito temporal — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ámbito temporal» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una norma se coloca sobre un intervalo y varios hechos quedan alrededor.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ámbito temporal en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una norma se coloca sobre un intervalo y varios hechos quedan alrededor.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho dentro` / `fuera del intervalo suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una norma se coloca sobre un intervalo y varios hechos quedan alrededor. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0133.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0134 · Ámbito temporal — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ámbito temporal» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una norma se coloca sobre un intervalo y varios hechos quedan alrededor.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una norma se coloca sobre un intervalo y varios hechos quedan alrededor.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ámbito temporal.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho dentro` / `fuera del intervalo suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una norma se coloca sobre un intervalo y varios hechos quedan alrededor» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0134.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0135 · Ámbito temporal — Comparación de dos supuestos

**Objetivo:** Comparar «Hecho dentro» y «fuera del intervalo suministrado» dentro de ámbito temporal, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una norma se coloca sobre un intervalo y varios hechos quedan alrededor.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ámbito temporal, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Hecho dentro» y en B «fuera del intervalo suministrado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una norma se coloca sobre un intervalo y varios hechos quedan alrededor» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho dentro` / `fuera del intervalo suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Hecho dentro / fuera del intervalo suministrado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0135.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0136 · Ámbito temporal — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ámbito temporal» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una norma se coloca sobre un intervalo y varios hechos quedan alrededor.

**Composición:** Escena principal de ámbito temporal con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una norma se coloca sobre un intervalo y varios hechos quedan alrededor.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Hecho dentro» de «fuera del intervalo suministrado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho dentro` / `fuera del intervalo suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ámbito temporal, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0136.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0137 · Ámbito material — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ámbito material» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una colección de actividades atraviesa un filtro de materias.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ámbito material en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una colección de actividades atraviesa un filtro de materias.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Materia incluida` / `materia no clasificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una colección de actividades atraviesa un filtro de materias. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0137.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0138 · Ámbito material — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ámbito material» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una colección de actividades atraviesa un filtro de materias.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una colección de actividades atraviesa un filtro de materias.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ámbito material.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Materia incluida` / `materia no clasificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una colección de actividades atraviesa un filtro de materias» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0138.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0139 · Ámbito material — Comparación de dos supuestos

**Objetivo:** Comparar «Materia incluida» y «materia no clasificada» dentro de ámbito material, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una colección de actividades atraviesa un filtro de materias.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ámbito material, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Materia incluida» y en B «materia no clasificada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una colección de actividades atraviesa un filtro de materias» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Materia incluida` / `materia no clasificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Materia incluida / materia no clasificada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0139.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0140 · Ámbito material — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ámbito material» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una colección de actividades atraviesa un filtro de materias.

**Composición:** Escena principal de ámbito material con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una colección de actividades atraviesa un filtro de materias.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Materia incluida» de «materia no clasificada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Materia incluida` / `materia no clasificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ámbito material, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0140.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0141 · Ámbito territorial — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ámbito territorial» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Áreas geométricas neutrales muestran dónde se sitúan hechos y textos.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ámbito territorial en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: áreas geométricas neutrales muestran dónde se sitúan hechos y textos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ámbito compartido` / `ámbitos distintos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Áreas geométricas neutrales muestran dónde se sitúan hechos y textos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0141.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0142 · Ámbito territorial — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ámbito territorial» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Áreas geométricas neutrales muestran dónde se sitúan hechos y textos.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: áreas geométricas neutrales muestran dónde se sitúan hechos y textos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ámbito territorial.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ámbito compartido` / `ámbitos distintos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Áreas geométricas neutrales muestran dónde se sitúan hechos y textos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0142.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0143 · Ámbito territorial — Comparación de dos supuestos

**Objetivo:** Comparar «Ámbito compartido» y «ámbitos distintos» dentro de ámbito territorial, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Áreas geométricas neutrales muestran dónde se sitúan hechos y textos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ámbito territorial, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Ámbito compartido» y en B «ámbitos distintos» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «áreas geométricas neutrales muestran dónde se sitúan hechos y textos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ámbito compartido` / `ámbitos distintos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Ámbito compartido / ámbitos distintos debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0143.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0144 · Ámbito territorial — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ámbito territorial» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Áreas geométricas neutrales muestran dónde se sitúan hechos y textos.

**Composición:** Escena principal de ámbito territorial con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: áreas geométricas neutrales muestran dónde se sitúan hechos y textos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Ámbito compartido» de «ámbitos distintos».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ámbito compartido` / `ámbitos distintos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ámbito territorial, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0144.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0145 · Delegación normativa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Delegación normativa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un instrumento enlaza con el documento que describe su habilitación.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de delegación normativa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un instrumento enlaza con el documento que describe su habilitación.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Habilitación aportada` / `habilitación por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un instrumento enlaza con el documento que describe su habilitación. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0145.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0146 · Delegación normativa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Delegación normativa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un instrumento enlaza con el documento que describe su habilitación.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un instrumento enlaza con el documento que describe su habilitación.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en delegación normativa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Habilitación aportada` / `habilitación por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un instrumento enlaza con el documento que describe su habilitación» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0146.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0147 · Delegación normativa — Comparación de dos supuestos

**Objetivo:** Comparar «Habilitación aportada» y «habilitación por comprobar» dentro de delegación normativa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un instrumento enlaza con el documento que describe su habilitación.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de delegación normativa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Habilitación aportada» y en B «habilitación por comprobar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un instrumento enlaza con el documento que describe su habilitación» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Habilitación aportada` / `habilitación por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Habilitación aportada / habilitación por comprobar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0147.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0148 · Delegación normativa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Delegación normativa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un instrumento enlaza con el documento que describe su habilitación.

**Composición:** Escena principal de delegación normativa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un instrumento enlaza con el documento que describe su habilitación.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Habilitación aportada» de «habilitación por comprobar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Habilitación aportada` / `habilitación por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para delegación normativa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0148.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0149 · Remisión entre artículos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Remisión entre artículos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un marcador salta de una disposición al texto al que remite.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de remisión entre artículos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un marcador salta de una disposición al texto al que remite.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Remisión directa` / `cadena de remisiones`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un marcador salta de una disposición al texto al que remite. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0149.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0150 · Remisión entre artículos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Remisión entre artículos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un marcador salta de una disposición al texto al que remite.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un marcador salta de una disposición al texto al que remite.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en remisión entre artículos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Remisión directa` / `cadena de remisiones`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un marcador salta de una disposición al texto al que remite» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0150.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0151 · Remisión entre artículos — Comparación de dos supuestos

**Objetivo:** Comparar «Remisión directa» y «cadena de remisiones» dentro de remisión entre artículos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un marcador salta de una disposición al texto al que remite.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de remisión entre artículos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Remisión directa» y en B «cadena de remisiones» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un marcador salta de una disposición al texto al que remite» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Remisión directa` / `cadena de remisiones`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Remisión directa / cadena de remisiones debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0151.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0152 · Remisión entre artículos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Remisión entre artículos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un marcador salta de una disposición al texto al que remite.

**Composición:** Escena principal de remisión entre artículos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un marcador salta de una disposición al texto al que remite.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Remisión directa» de «cadena de remisiones».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Remisión directa` / `cadena de remisiones`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para remisión entre artículos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0152.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0153 · Interpretaciones concurrentes — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Interpretaciones concurrentes» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un pasaje origina dos lecturas etiquetadas y separadas.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de interpretaciones concurrentes en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un pasaje origina dos lecturas etiquetadas y separadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interpretación A` / `interpretación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un pasaje origina dos lecturas etiquetadas y separadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0153.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0154 · Interpretaciones concurrentes — Mecanismo o relación explicada

**Objetivo:** Descomponer «Interpretaciones concurrentes» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un pasaje origina dos lecturas etiquetadas y separadas.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un pasaje origina dos lecturas etiquetadas y separadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en interpretaciones concurrentes.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interpretación A` / `interpretación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un pasaje origina dos lecturas etiquetadas y separadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0154.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0155 · Interpretaciones concurrentes — Comparación de dos supuestos

**Objetivo:** Comparar «Interpretación A» y «interpretación B» dentro de interpretaciones concurrentes, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un pasaje origina dos lecturas etiquetadas y separadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de interpretaciones concurrentes, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Interpretación A» y en B «interpretación B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un pasaje origina dos lecturas etiquetadas y separadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interpretación A` / `interpretación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Interpretación A / interpretación B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0155.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0156 · Interpretaciones concurrentes — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Interpretaciones concurrentes» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un pasaje origina dos lecturas etiquetadas y separadas.

**Composición:** Escena principal de interpretaciones concurrentes con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un pasaje origina dos lecturas etiquetadas y separadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Interpretación A» de «interpretación B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interpretación A` / `interpretación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para interpretaciones concurrentes, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0156.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0157 · Regla transitoria — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Regla transitoria» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una franja entre dos versiones distribuye supuestos por fecha.

**Composición:** Escenario abierto: libro como ancla, artículo como interlocutor u objeto secundario y jerarquía editable como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de regla transitoria en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una franja entre dos versiones distribuye supuestos por fecha.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto anterior` / `posterior al hito configurable`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una franja entre dos versiones distribuye supuestos por fecha. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0157.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0158 · Regla transitoria — Mecanismo o relación explicada

**Objetivo:** Descomponer «Regla transitoria» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una franja entre dos versiones distribuye supuestos por fecha.

**Composición:** Composición espacial con libro, jerarquía editable y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una franja entre dos versiones distribuye supuestos por fecha.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en regla transitoria.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto anterior` / `posterior al hito configurable`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una franja entre dos versiones distribuye supuestos por fecha» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0158.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0159 · Regla transitoria — Comparación de dos supuestos

**Objetivo:** Comparar «Supuesto anterior» y «posterior al hito configurable» dentro de regla transitoria, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una franja entre dos versiones distribuye supuestos por fecha.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de regla transitoria, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Supuesto anterior» y en B «posterior al hito configurable» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una franja entre dos versiones distribuye supuestos por fecha» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto anterior` / `posterior al hito configurable`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Supuesto anterior / posterior al hito configurable debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0159.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0160 · Regla transitoria — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Regla transitoria» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una franja entre dos versiones distribuye supuestos por fecha.

**Composición:** Escena principal de regla transitoria con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una franja entre dos versiones distribuye supuestos por fecha.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Supuesto anterior» de «posterior al hito configurable».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `sources, hierarchy, passages, interpretations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto anterior` / `posterior al hito configurable`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para regla transitoria, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/sources/LAW-0160.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
