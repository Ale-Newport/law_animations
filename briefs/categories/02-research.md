# 02. Investigación jurídica

40 animaciones; IDs LAW-0041–LAW-0080. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-0041 · Búsqueda por términos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Búsqueda por términos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Palabras de una consulta conectan con pasajes dentro de varios documentos.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de búsqueda por términos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: palabras de una consulta conectan con pasajes dentro de varios documentos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Coincidencia exacta` / `coincidencia contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Palabras de una consulta conectan con pasajes dentro de varios documentos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0041.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0042 · Búsqueda por términos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Búsqueda por términos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Palabras de una consulta conectan con pasajes dentro de varios documentos.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: palabras de una consulta conectan con pasajes dentro de varios documentos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en búsqueda por términos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Coincidencia exacta` / `coincidencia contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Palabras de una consulta conectan con pasajes dentro de varios documentos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0042.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0043 · Búsqueda por términos — Comparación de dos supuestos

**Objetivo:** Comparar «Coincidencia exacta» y «coincidencia contextual» dentro de búsqueda por términos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Palabras de una consulta conectan con pasajes dentro de varios documentos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de búsqueda por términos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Coincidencia exacta» y en B «coincidencia contextual» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «palabras de una consulta conectan con pasajes dentro de varios documentos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Coincidencia exacta` / `coincidencia contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Coincidencia exacta / coincidencia contextual debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0043.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0044 · Búsqueda por términos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Búsqueda por términos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Palabras de una consulta conectan con pasajes dentro de varios documentos.

**Composición:** Escena principal de búsqueda por términos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: palabras de una consulta conectan con pasajes dentro de varios documentos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Coincidencia exacta» de «coincidencia contextual».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Coincidencia exacta` / `coincidencia contextual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para búsqueda por términos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0044.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0045 · Cita localizada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cita localizada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una referencia se descompone y dirige a un párrafo resaltado.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cita localizada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una referencia se descompone y dirige a un párrafo resaltado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Referencia localizable` / `referencia incompleta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una referencia se descompone y dirige a un párrafo resaltado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0045.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0046 · Cita localizada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cita localizada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una referencia se descompone y dirige a un párrafo resaltado.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una referencia se descompone y dirige a un párrafo resaltado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cita localizada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Referencia localizable` / `referencia incompleta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una referencia se descompone y dirige a un párrafo resaltado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0046.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0047 · Cita localizada — Comparación de dos supuestos

**Objetivo:** Comparar «Referencia localizable» y «referencia incompleta» dentro de cita localizada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una referencia se descompone y dirige a un párrafo resaltado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cita localizada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Referencia localizable» y en B «referencia incompleta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una referencia se descompone y dirige a un párrafo resaltado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Referencia localizable` / `referencia incompleta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Referencia localizable / referencia incompleta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0047.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0048 · Cita localizada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cita localizada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una referencia se descompone y dirige a un párrafo resaltado.

**Composición:** Escena principal de cita localizada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una referencia se descompone y dirige a un párrafo resaltado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Referencia localizable» de «referencia incompleta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Referencia localizable` / `referencia incompleta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cita localizada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0048.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0049 · Historial de una norma — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Historial de una norma» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Capas temporales muestran versiones y destacan la fecha seleccionada.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de historial de una norma en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: capas temporales muestran versiones y destacan la fecha seleccionada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Versión aplicable seleccionada` / `versión posterior`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Capas temporales muestran versiones y destacan la fecha seleccionada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0049.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0050 · Historial de una norma — Mecanismo o relación explicada

**Objetivo:** Descomponer «Historial de una norma» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Capas temporales muestran versiones y destacan la fecha seleccionada.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: capas temporales muestran versiones y destacan la fecha seleccionada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en historial de una norma.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Versión aplicable seleccionada` / `versión posterior`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Capas temporales muestran versiones y destacan la fecha seleccionada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0050.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0051 · Historial de una norma — Comparación de dos supuestos

**Objetivo:** Comparar «Versión aplicable seleccionada» y «versión posterior» dentro de historial de una norma, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Capas temporales muestran versiones y destacan la fecha seleccionada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de historial de una norma, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Versión aplicable seleccionada» y en B «versión posterior» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «capas temporales muestran versiones y destacan la fecha seleccionada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Versión aplicable seleccionada` / `versión posterior`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Versión aplicable seleccionada / versión posterior debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0051.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0052 · Historial de una norma — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Historial de una norma» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Capas temporales muestran versiones y destacan la fecha seleccionada.

**Composición:** Escena principal de historial de una norma con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: capas temporales muestran versiones y destacan la fecha seleccionada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Versión aplicable seleccionada» de «versión posterior».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Versión aplicable seleccionada` / `versión posterior`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para historial de una norma, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0052.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0053 · Tratamiento de un caso — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Tratamiento de un caso» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varias resoluciones conectan con una decisión mediante etiquetas suministradas.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de tratamiento de un caso en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varias resoluciones conectan con una decisión mediante etiquetas suministradas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Tratamientos distintos sin jerarquía inventada` / `supuesto alternativo`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varias resoluciones conectan con una decisión mediante etiquetas suministradas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0053.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0054 · Tratamiento de un caso — Mecanismo o relación explicada

**Objetivo:** Descomponer «Tratamiento de un caso» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varias resoluciones conectan con una decisión mediante etiquetas suministradas.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varias resoluciones conectan con una decisión mediante etiquetas suministradas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en tratamiento de un caso.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Tratamientos distintos sin jerarquía inventada` / `supuesto alternativo`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varias resoluciones conectan con una decisión mediante etiquetas suministradas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0054.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0055 · Tratamiento de un caso — Comparación de dos supuestos

**Objetivo:** Comparar «Tratamientos distintos sin jerarquía inventada» y «supuesto alternativo» dentro de tratamiento de un caso, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varias resoluciones conectan con una decisión mediante etiquetas suministradas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de tratamiento de un caso, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Tratamientos distintos sin jerarquía inventada» y en B «supuesto alternativo» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varias resoluciones conectan con una decisión mediante etiquetas suministradas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Tratamientos distintos sin jerarquía inventada` / `supuesto alternativo`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Tratamientos distintos sin jerarquía inventada / supuesto alternativo debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0055.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0056 · Tratamiento de un caso — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Tratamiento de un caso» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varias resoluciones conectan con una decisión mediante etiquetas suministradas.

**Composición:** Escena principal de tratamiento de un caso con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varias resoluciones conectan con una decisión mediante etiquetas suministradas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Tratamientos distintos sin jerarquía inventada» de «supuesto alternativo».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Tratamientos distintos sin jerarquía inventada` / `supuesto alternativo`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para tratamiento de un caso, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0056.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0057 · Lectura de sumario — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Lectura de sumario» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un sumario se abre hasta el pasaje que pretende resumir.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de lectura de sumario en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un sumario se abre hasta el pasaje que pretende resumir.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Resumen` / `texto de la resolución`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un sumario se abre hasta el pasaje que pretende resumir. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0057.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0058 · Lectura de sumario — Mecanismo o relación explicada

**Objetivo:** Descomponer «Lectura de sumario» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un sumario se abre hasta el pasaje que pretende resumir.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un sumario se abre hasta el pasaje que pretende resumir.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en lectura de sumario.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Resumen` / `texto de la resolución`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un sumario se abre hasta el pasaje que pretende resumir» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0058.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0059 · Lectura de sumario — Comparación de dos supuestos

**Objetivo:** Comparar «Resumen» y «texto de la resolución» dentro de lectura de sumario, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un sumario se abre hasta el pasaje que pretende resumir.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de lectura de sumario, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Resumen» y en B «texto de la resolución» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un sumario se abre hasta el pasaje que pretende resumir» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Resumen` / `texto de la resolución`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Resumen / texto de la resolución debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0059.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0060 · Lectura de sumario — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Lectura de sumario» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un sumario se abre hasta el pasaje que pretende resumir.

**Composición:** Escena principal de lectura de sumario con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un sumario se abre hasta el pasaje que pretende resumir.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Resumen» de «texto de la resolución».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Resumen` / `texto de la resolución`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para lectura de sumario, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0060.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0061 · Fuente primaria y comentario — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Fuente primaria y comentario» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un documento base y una nota lateral se conectan sin fusionarse.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de fuente primaria y comentario en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un documento base y una nota lateral se conectan sin fusionarse.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Texto fuente` / `interpretación del comentarista`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un documento base y una nota lateral se conectan sin fusionarse. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0061.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0062 · Fuente primaria y comentario — Mecanismo o relación explicada

**Objetivo:** Descomponer «Fuente primaria y comentario» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un documento base y una nota lateral se conectan sin fusionarse.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un documento base y una nota lateral se conectan sin fusionarse.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en fuente primaria y comentario.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Texto fuente` / `interpretación del comentarista`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un documento base y una nota lateral se conectan sin fusionarse» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0062.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0063 · Fuente primaria y comentario — Comparación de dos supuestos

**Objetivo:** Comparar «Texto fuente» y «interpretación del comentarista» dentro de fuente primaria y comentario, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un documento base y una nota lateral se conectan sin fusionarse.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de fuente primaria y comentario, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Texto fuente» y en B «interpretación del comentarista» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un documento base y una nota lateral se conectan sin fusionarse» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Texto fuente` / `interpretación del comentarista`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Texto fuente / interpretación del comentarista debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0063.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0064 · Fuente primaria y comentario — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Fuente primaria y comentario» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un documento base y una nota lateral se conectan sin fusionarse.

**Composición:** Escena principal de fuente primaria y comentario con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un documento base y una nota lateral se conectan sin fusionarse.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Texto fuente» de «interpretación del comentarista».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Texto fuente` / `interpretación del comentarista`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para fuente primaria y comentario, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0064.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0065 · Extracción de hechos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Extracción de hechos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Marcadores sacan de una página los hechos indicados por el usuario.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de extracción de hechos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: marcadores sacan de una página los hechos indicados por el usuario.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho documentado` / `inferencia anotada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Marcadores sacan de una página los hechos indicados por el usuario. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0065.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0066 · Extracción de hechos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Extracción de hechos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Marcadores sacan de una página los hechos indicados por el usuario.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: marcadores sacan de una página los hechos indicados por el usuario.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en extracción de hechos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho documentado` / `inferencia anotada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Marcadores sacan de una página los hechos indicados por el usuario» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0066.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0067 · Extracción de hechos — Comparación de dos supuestos

**Objetivo:** Comparar «Hecho documentado» y «inferencia anotada» dentro de extracción de hechos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Marcadores sacan de una página los hechos indicados por el usuario.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de extracción de hechos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Hecho documentado» y en B «inferencia anotada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «marcadores sacan de una página los hechos indicados por el usuario» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho documentado` / `inferencia anotada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Hecho documentado / inferencia anotada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0067.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0068 · Extracción de hechos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Extracción de hechos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Marcadores sacan de una página los hechos indicados por el usuario.

**Composición:** Escena principal de extracción de hechos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: marcadores sacan de una página los hechos indicados por el usuario.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Hecho documentado» de «inferencia anotada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho documentado` / `inferencia anotada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para extracción de hechos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0068.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0069 · Comprobación de jurisdicción — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Comprobación de jurisdicción» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un filtro separa documentos según la jurisdicción que declaran.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de comprobación de jurisdicción en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un filtro separa documentos según la jurisdicción que declaran.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Jurisdicción pertinente` / `otra jurisdicción`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un filtro separa documentos según la jurisdicción que declaran. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0069.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0070 · Comprobación de jurisdicción — Mecanismo o relación explicada

**Objetivo:** Descomponer «Comprobación de jurisdicción» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un filtro separa documentos según la jurisdicción que declaran.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un filtro separa documentos según la jurisdicción que declaran.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en comprobación de jurisdicción.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Jurisdicción pertinente` / `otra jurisdicción`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un filtro separa documentos según la jurisdicción que declaran» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0070.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0071 · Comprobación de jurisdicción — Comparación de dos supuestos

**Objetivo:** Comparar «Jurisdicción pertinente» y «otra jurisdicción» dentro de comprobación de jurisdicción, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un filtro separa documentos según la jurisdicción que declaran.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de comprobación de jurisdicción, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Jurisdicción pertinente» y en B «otra jurisdicción» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un filtro separa documentos según la jurisdicción que declaran» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Jurisdicción pertinente` / `otra jurisdicción`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Jurisdicción pertinente / otra jurisdicción debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0071.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0072 · Comprobación de jurisdicción — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Comprobación de jurisdicción» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un filtro separa documentos según la jurisdicción que declaran.

**Composición:** Escena principal de comprobación de jurisdicción con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un filtro separa documentos según la jurisdicción que declaran.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Jurisdicción pertinente» de «otra jurisdicción».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Jurisdicción pertinente` / `otra jurisdicción`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para comprobación de jurisdicción, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0072.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0073 · Matriz de autoridades — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Matriz de autoridades» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Filas de proposiciones conectan con columnas de fuentes aportadas.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de matriz de autoridades en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: filas de proposiciones conectan con columnas de fuentes aportadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proposición apoyada` / `fuente pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Filas de proposiciones conectan con columnas de fuentes aportadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0073.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0074 · Matriz de autoridades — Mecanismo o relación explicada

**Objetivo:** Descomponer «Matriz de autoridades» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Filas de proposiciones conectan con columnas de fuentes aportadas.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: filas de proposiciones conectan con columnas de fuentes aportadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en matriz de autoridades.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proposición apoyada` / `fuente pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Filas de proposiciones conectan con columnas de fuentes aportadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0074.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0075 · Matriz de autoridades — Comparación de dos supuestos

**Objetivo:** Comparar «Proposición apoyada» y «fuente pendiente» dentro de matriz de autoridades, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Filas de proposiciones conectan con columnas de fuentes aportadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de matriz de autoridades, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Proposición apoyada» y en B «fuente pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «filas de proposiciones conectan con columnas de fuentes aportadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proposición apoyada` / `fuente pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Proposición apoyada / fuente pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0075.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0076 · Matriz de autoridades — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Matriz de autoridades» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Filas de proposiciones conectan con columnas de fuentes aportadas.

**Composición:** Escena principal de matriz de autoridades con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: filas de proposiciones conectan con columnas de fuentes aportadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Proposición apoyada» de «fuente pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proposición apoyada` / `fuente pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para matriz de autoridades, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0076.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0077 · Trazabilidad de una cita — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Trazabilidad de una cita» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una cadena recorre nota, referencia intermedia y documento de origen.

**Composición:** Escenario abierto: biblioteca como ancla, buscador como interlocutor u objeto secundario y ficha como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de trazabilidad de una cita en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una cadena recorre nota, referencia intermedia y documento de origen.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `query, sources, citations, dates, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acceso al original` / `cita indirecta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una cadena recorre nota, referencia intermedia y documento de origen. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0077.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0078 · Trazabilidad de una cita — Mecanismo o relación explicada

**Objetivo:** Descomponer «Trazabilidad de una cita» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una cadena recorre nota, referencia intermedia y documento de origen.

**Composición:** Composición espacial con biblioteca, ficha y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una cadena recorre nota, referencia intermedia y documento de origen.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en trazabilidad de una cita.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `query, sources, citations, dates, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acceso al original` / `cita indirecta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una cadena recorre nota, referencia intermedia y documento de origen» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0078.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0079 · Trazabilidad de una cita — Comparación de dos supuestos

**Objetivo:** Comparar «Acceso al original» y «cita indirecta» dentro de trazabilidad de una cita, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una cadena recorre nota, referencia intermedia y documento de origen.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de trazabilidad de una cita, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acceso al original» y en B «cita indirecta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una cadena recorre nota, referencia intermedia y documento de origen» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `query, sources, citations, dates, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acceso al original` / `cita indirecta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acceso al original / cita indirecta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0079.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0080 · Trazabilidad de una cita — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Trazabilidad de una cita» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una cadena recorre nota, referencia intermedia y documento de origen.

**Composición:** Escena principal de trazabilidad de una cita con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una cadena recorre nota, referencia intermedia y documento de origen.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acceso al original» de «cita indirecta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `query, sources, citations, dates, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acceso al original` / `cita indirecta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para trazabilidad de una cita, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/research/LAW-0080.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
