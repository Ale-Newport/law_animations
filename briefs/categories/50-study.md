# 50. Estudio y explicación de law

40 animaciones; IDs LAW-1961–LAW-2000. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1961 · Despiece de caso — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Despiece de caso» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un relato se separa en hechos, cuestión y argumentos identificados.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de despiece de caso en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un relato se separa en hechos, cuestión y argumentos identificados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato del caso` / `conclusión propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un relato se separa en hechos, cuestión y argumentos identificados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1961.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1962 · Despiece de caso — Mecanismo o relación explicada

**Objetivo:** Descomponer «Despiece de caso» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un relato se separa en hechos, cuestión y argumentos identificados.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un relato se separa en hechos, cuestión y argumentos identificados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en despiece de caso.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato del caso` / `conclusión propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un relato se separa en hechos, cuestión y argumentos identificados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1962.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1963 · Despiece de caso — Comparación de dos supuestos

**Objetivo:** Comparar «Dato del caso» y «conclusión propuesta» dentro de despiece de caso, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un relato se separa en hechos, cuestión y argumentos identificados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de despiece de caso, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Dato del caso» y en B «conclusión propuesta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un relato se separa en hechos, cuestión y argumentos identificados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato del caso` / `conclusión propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Dato del caso / conclusión propuesta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1963.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1964 · Despiece de caso — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Despiece de caso» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un relato se separa en hechos, cuestión y argumentos identificados.

**Composición:** Escena principal de despiece de caso con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un relato se separa en hechos, cuestión y argumentos identificados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Dato del caso» de «conclusión propuesta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato del caso` / `conclusión propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para despiece de caso, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1964.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1965 · Estructura IRAC editable — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Estructura IRAC editable» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Cuatro apartados se construyen sin completar doctrina no aportada.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de estructura irac editable en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: cuatro apartados se construyen sin completar doctrina no aportada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Identificación de cuestión` / `aplicación argumentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Cuatro apartados se construyen sin completar doctrina no aportada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1965.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1966 · Estructura IRAC editable — Mecanismo o relación explicada

**Objetivo:** Descomponer «Estructura IRAC editable» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Cuatro apartados se construyen sin completar doctrina no aportada.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: cuatro apartados se construyen sin completar doctrina no aportada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en estructura irac editable.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Identificación de cuestión` / `aplicación argumentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Cuatro apartados se construyen sin completar doctrina no aportada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1966.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1967 · Estructura IRAC editable — Comparación de dos supuestos

**Objetivo:** Comparar «Identificación de cuestión» y «aplicación argumentada» dentro de estructura irac editable, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Cuatro apartados se construyen sin completar doctrina no aportada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de estructura irac editable, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Identificación de cuestión» y en B «aplicación argumentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «cuatro apartados se construyen sin completar doctrina no aportada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Identificación de cuestión` / `aplicación argumentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Identificación de cuestión / aplicación argumentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1967.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1968 · Estructura IRAC editable — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Estructura IRAC editable» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Cuatro apartados se construyen sin completar doctrina no aportada.

**Composición:** Escena principal de estructura irac editable con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: cuatro apartados se construyen sin completar doctrina no aportada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Identificación de cuestión» de «aplicación argumentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Identificación de cuestión` / `aplicación argumentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para estructura irac editable, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1968.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1969 · Recuperación activa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Recuperación activa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una pregunta oculta una respuesta aportada hasta el momento configurado.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de recuperación activa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una pregunta oculta una respuesta aportada hasta el momento configurado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pregunta visible` / `respuesta revelada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una pregunta oculta una respuesta aportada hasta el momento configurado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1969.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1970 · Recuperación activa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Recuperación activa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una pregunta oculta una respuesta aportada hasta el momento configurado.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una pregunta oculta una respuesta aportada hasta el momento configurado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en recuperación activa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pregunta visible` / `respuesta revelada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una pregunta oculta una respuesta aportada hasta el momento configurado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1970.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1971 · Recuperación activa — Comparación de dos supuestos

**Objetivo:** Comparar «Pregunta visible» y «respuesta revelada» dentro de recuperación activa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una pregunta oculta una respuesta aportada hasta el momento configurado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de recuperación activa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Pregunta visible» y en B «respuesta revelada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una pregunta oculta una respuesta aportada hasta el momento configurado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pregunta visible` / `respuesta revelada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Pregunta visible / respuesta revelada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1971.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1972 · Recuperación activa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Recuperación activa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una pregunta oculta una respuesta aportada hasta el momento configurado.

**Composición:** Escena principal de recuperación activa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una pregunta oculta una respuesta aportada hasta el momento configurado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Pregunta visible» de «respuesta revelada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pregunta visible` / `respuesta revelada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para recuperación activa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1972.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1973 · Mapa de conceptos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Mapa de conceptos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Nodos se organizan por relaciones suministradas sin jerarquía universal.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de mapa de conceptos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: nodos se organizan por relaciones suministradas sin jerarquía universal.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación principal` / `conexión secundaria`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Nodos se organizan por relaciones suministradas sin jerarquía universal. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1973.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1974 · Mapa de conceptos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Mapa de conceptos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Nodos se organizan por relaciones suministradas sin jerarquía universal.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: nodos se organizan por relaciones suministradas sin jerarquía universal.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en mapa de conceptos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación principal` / `conexión secundaria`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Nodos se organizan por relaciones suministradas sin jerarquía universal» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1974.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1975 · Mapa de conceptos — Comparación de dos supuestos

**Objetivo:** Comparar «Relación principal» y «conexión secundaria» dentro de mapa de conceptos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Nodos se organizan por relaciones suministradas sin jerarquía universal.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de mapa de conceptos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Relación principal» y en B «conexión secundaria» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «nodos se organizan por relaciones suministradas sin jerarquía universal» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación principal` / `conexión secundaria`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Relación principal / conexión secundaria debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1975.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1976 · Mapa de conceptos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Mapa de conceptos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Nodos se organizan por relaciones suministradas sin jerarquía universal.

**Composición:** Escena principal de mapa de conceptos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: nodos se organizan por relaciones suministradas sin jerarquía universal.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Relación principal» de «conexión secundaria».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación principal` / `conexión secundaria`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para mapa de conceptos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1976.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1977 · Comparación de argumentos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Comparación de argumentos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos líneas argumentales se alinean bajo la misma cuestión.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de comparación de argumentos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos líneas argumentales se alinean bajo la misma cuestión.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento A` / `argumento B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos líneas argumentales se alinean bajo la misma cuestión. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1977.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1978 · Comparación de argumentos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Comparación de argumentos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos líneas argumentales se alinean bajo la misma cuestión.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos líneas argumentales se alinean bajo la misma cuestión.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en comparación de argumentos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento A` / `argumento B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos líneas argumentales se alinean bajo la misma cuestión» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1978.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1979 · Comparación de argumentos — Comparación de dos supuestos

**Objetivo:** Comparar «Argumento A» y «argumento B» dentro de comparación de argumentos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos líneas argumentales se alinean bajo la misma cuestión.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de comparación de argumentos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Argumento A» y en B «argumento B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos líneas argumentales se alinean bajo la misma cuestión» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento A` / `argumento B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Argumento A / argumento B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1979.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1980 · Comparación de argumentos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Comparación de argumentos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos líneas argumentales se alinean bajo la misma cuestión.

**Composición:** Escena principal de comparación de argumentos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos líneas argumentales se alinean bajo la misma cuestión.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Argumento A» de «argumento B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento A` / `argumento B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para comparación de argumentos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1980.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1981 · Detección de hecho relevante — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Detección de hecho relevante» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un relato destaca una circunstancia y atenúa detalles accesorios.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de detección de hecho relevante en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un relato destaca una circunstancia y atenúa detalles accesorios.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho seleccionado` / `contexto restante`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un relato destaca una circunstancia y atenúa detalles accesorios. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1981.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1982 · Detección de hecho relevante — Mecanismo o relación explicada

**Objetivo:** Descomponer «Detección de hecho relevante» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un relato destaca una circunstancia y atenúa detalles accesorios.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un relato destaca una circunstancia y atenúa detalles accesorios.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en detección de hecho relevante.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho seleccionado` / `contexto restante`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un relato destaca una circunstancia y atenúa detalles accesorios» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1982.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1983 · Detección de hecho relevante — Comparación de dos supuestos

**Objetivo:** Comparar «Hecho seleccionado» y «contexto restante» dentro de detección de hecho relevante, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un relato destaca una circunstancia y atenúa detalles accesorios.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de detección de hecho relevante, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Hecho seleccionado» y en B «contexto restante» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un relato destaca una circunstancia y atenúa detalles accesorios» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho seleccionado` / `contexto restante`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Hecho seleccionado / contexto restante debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1983.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1984 · Detección de hecho relevante — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Detección de hecho relevante» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un relato destaca una circunstancia y atenúa detalles accesorios.

**Composición:** Escena principal de detección de hecho relevante con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un relato destaca una circunstancia y atenúa detalles accesorios.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Hecho seleccionado» de «contexto restante».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hecho seleccionado` / `contexto restante`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para detección de hecho relevante, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1984.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1985 · Secuencia de examen — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Secuencia de examen» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un enunciado se conecta con etapas de lectura y organización.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de secuencia de examen en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un enunciado se conecta con etapas de lectura y organización.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura inicial` / `plan de respuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un enunciado se conecta con etapas de lectura y organización. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1985.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1986 · Secuencia de examen — Mecanismo o relación explicada

**Objetivo:** Descomponer «Secuencia de examen» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un enunciado se conecta con etapas de lectura y organización.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un enunciado se conecta con etapas de lectura y organización.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en secuencia de examen.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura inicial` / `plan de respuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un enunciado se conecta con etapas de lectura y organización» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1986.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1987 · Secuencia de examen — Comparación de dos supuestos

**Objetivo:** Comparar «Lectura inicial» y «plan de respuesta» dentro de secuencia de examen, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un enunciado se conecta con etapas de lectura y organización.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de secuencia de examen, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Lectura inicial» y en B «plan de respuesta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un enunciado se conecta con etapas de lectura y organización» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura inicial` / `plan de respuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Lectura inicial / plan de respuesta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1987.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1988 · Secuencia de examen — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Secuencia de examen» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un enunciado se conecta con etapas de lectura y organización.

**Composición:** Escena principal de secuencia de examen con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un enunciado se conecta con etapas de lectura y organización.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Lectura inicial» de «plan de respuesta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Lectura inicial` / `plan de respuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para secuencia de examen, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1988.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1989 · Error frecuente ilustrativo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Error frecuente ilustrativo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos respuestas ficticias muestran un salto lógico señalado.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de error frecuente ilustrativo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos respuestas ficticias muestran un salto lógico señalado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta incompleta` / `versión con premisa explícita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos respuestas ficticias muestran un salto lógico señalado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1989.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1990 · Error frecuente ilustrativo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Error frecuente ilustrativo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos respuestas ficticias muestran un salto lógico señalado.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos respuestas ficticias muestran un salto lógico señalado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en error frecuente ilustrativo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta incompleta` / `versión con premisa explícita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos respuestas ficticias muestran un salto lógico señalado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1990.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1991 · Error frecuente ilustrativo — Comparación de dos supuestos

**Objetivo:** Comparar «Respuesta incompleta» y «versión con premisa explícita» dentro de error frecuente ilustrativo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos respuestas ficticias muestran un salto lógico señalado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de error frecuente ilustrativo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Respuesta incompleta» y en B «versión con premisa explícita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos respuestas ficticias muestran un salto lógico señalado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta incompleta` / `versión con premisa explícita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Respuesta incompleta / versión con premisa explícita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1991.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1992 · Error frecuente ilustrativo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Error frecuente ilustrativo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos respuestas ficticias muestran un salto lógico señalado.

**Composición:** Escena principal de error frecuente ilustrativo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos respuestas ficticias muestran un salto lógico señalado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Respuesta incompleta» de «versión con premisa explícita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta incompleta` / `versión con premisa explícita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para error frecuente ilustrativo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1992.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1993 · Resumen visual de tema — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Resumen visual de tema» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Objetos de un tema se reúnen en una composición con relaciones claras.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de resumen visual de tema en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: objetos de un tema se reúnen en una composición con relaciones claras.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vista global` / `ampliación de una relación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Objetos de un tema se reúnen en una composición con relaciones claras. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1993.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1994 · Resumen visual de tema — Mecanismo o relación explicada

**Objetivo:** Descomponer «Resumen visual de tema» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Objetos de un tema se reúnen en una composición con relaciones claras.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: objetos de un tema se reúnen en una composición con relaciones claras.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en resumen visual de tema.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vista global` / `ampliación de una relación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Objetos de un tema se reúnen en una composición con relaciones claras» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1994.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1995 · Resumen visual de tema — Comparación de dos supuestos

**Objetivo:** Comparar «Vista global» y «ampliación de una relación» dentro de resumen visual de tema, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Objetos de un tema se reúnen en una composición con relaciones claras.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de resumen visual de tema, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Vista global» y en B «ampliación de una relación» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «objetos de un tema se reúnen en una composición con relaciones claras» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vista global` / `ampliación de una relación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Vista global / ampliación de una relación debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1995.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1996 · Resumen visual de tema — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Resumen visual de tema» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Objetos de un tema se reúnen en una composición con relaciones claras.

**Composición:** Escena principal de resumen visual de tema con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: objetos de un tema se reúnen en una composición con relaciones claras.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Vista global» de «ampliación de una relación».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vista global` / `ampliación de una relación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para resumen visual de tema, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1996.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1997 · Pregunta con cambio de hecho — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Pregunta con cambio de hecho» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una misma pregunta se repite modificando un dato concreto.

**Composición:** Escenario abierto: tarjetas como ancla, esquema como interlocutor u objeto secundario y caso ficticio como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de pregunta con cambio de hecho en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una misma pregunta se repite modificando un dato concreto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `concepts, facts, issues, answers, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto base` / `supuesto alterado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una misma pregunta se repite modificando un dato concreto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1997.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1998 · Pregunta con cambio de hecho — Mecanismo o relación explicada

**Objetivo:** Descomponer «Pregunta con cambio de hecho» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una misma pregunta se repite modificando un dato concreto.

**Composición:** Composición espacial con tarjetas, caso ficticio y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una misma pregunta se repite modificando un dato concreto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en pregunta con cambio de hecho.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `concepts, facts, issues, answers, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto base` / `supuesto alterado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una misma pregunta se repite modificando un dato concreto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1998.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1999 · Pregunta con cambio de hecho — Comparación de dos supuestos

**Objetivo:** Comparar «Supuesto base» y «supuesto alterado» dentro de pregunta con cambio de hecho, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una misma pregunta se repite modificando un dato concreto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de pregunta con cambio de hecho, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Supuesto base» y en B «supuesto alterado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una misma pregunta se repite modificando un dato concreto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `concepts, facts, issues, answers, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto base` / `supuesto alterado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Supuesto base / supuesto alterado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-1999.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-2000 · Pregunta con cambio de hecho — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Pregunta con cambio de hecho» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una misma pregunta se repite modificando un dato concreto.

**Composición:** Escena principal de pregunta con cambio de hecho con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una misma pregunta se repite modificando un dato concreto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Supuesto base» de «supuesto alterado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `concepts, facts, issues, answers, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Supuesto base` / `supuesto alterado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para pregunta con cambio de hecho, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/study/LAW-2000.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
