# 26. Defensas y cuestiones exculpatorias

40 animaciones; IDs LAW-1001–LAW-1040. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1001 · Defensa propia alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Defensa propia alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una amenaza abstracta y una respuesta se comparan sin violencia gráfica.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de defensa propia alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una amenaza abstracta y una respuesta se comparan sin violencia gráfica.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Amenaza descrita` / `respuesta por evaluar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una amenaza abstracta y una respuesta se comparan sin violencia gráfica. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1001.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1002 · Defensa propia alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Defensa propia alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una amenaza abstracta y una respuesta se comparan sin violencia gráfica.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una amenaza abstracta y una respuesta se comparan sin violencia gráfica.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en defensa propia alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Amenaza descrita` / `respuesta por evaluar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una amenaza abstracta y una respuesta se comparan sin violencia gráfica» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1002.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1003 · Defensa propia alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Amenaza descrita» y «respuesta por evaluar» dentro de defensa propia alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una amenaza abstracta y una respuesta se comparan sin violencia gráfica.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de defensa propia alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Amenaza descrita» y en B «respuesta por evaluar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una amenaza abstracta y una respuesta se comparan sin violencia gráfica» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Amenaza descrita` / `respuesta por evaluar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Amenaza descrita / respuesta por evaluar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1003.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1004 · Defensa propia alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Defensa propia alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una amenaza abstracta y una respuesta se comparan sin violencia gráfica.

**Composición:** Escena principal de defensa propia alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una amenaza abstracta y una respuesta se comparan sin violencia gráfica.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Amenaza descrita» de «respuesta por evaluar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Amenaza descrita` / `respuesta por evaluar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para defensa propia alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1004.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1005 · Necesidad alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Necesidad alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos riesgos se muestran como circunstancias del supuesto.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de necesidad alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos riesgos se muestran como circunstancias del supuesto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Riesgo afrontado` / `alternativa descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos riesgos se muestran como circunstancias del supuesto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1005.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1006 · Necesidad alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Necesidad alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos riesgos se muestran como circunstancias del supuesto.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos riesgos se muestran como circunstancias del supuesto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en necesidad alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Riesgo afrontado` / `alternativa descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos riesgos se muestran como circunstancias del supuesto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1006.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1007 · Necesidad alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Riesgo afrontado» y «alternativa descrita» dentro de necesidad alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos riesgos se muestran como circunstancias del supuesto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de necesidad alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Riesgo afrontado» y en B «alternativa descrita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos riesgos se muestran como circunstancias del supuesto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Riesgo afrontado` / `alternativa descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Riesgo afrontado / alternativa descrita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1007.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1008 · Necesidad alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Necesidad alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos riesgos se muestran como circunstancias del supuesto.

**Composición:** Escena principal de necesidad alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos riesgos se muestran como circunstancias del supuesto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Riesgo afrontado» de «alternativa descrita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Riesgo afrontado` / `alternativa descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para necesidad alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1008.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1009 · Coacción alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Coacción alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una presión externa se conecta con la acción del sujeto.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de coacción alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una presión externa se conecta con la acción del sujeto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción libre descrita` / `presión alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una presión externa se conecta con la acción del sujeto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1009.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1010 · Coacción alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Coacción alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una presión externa se conecta con la acción del sujeto.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una presión externa se conecta con la acción del sujeto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en coacción alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción libre descrita` / `presión alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una presión externa se conecta con la acción del sujeto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1010.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1011 · Coacción alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Acción libre descrita» y «presión alegada» dentro de coacción alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una presión externa se conecta con la acción del sujeto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de coacción alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acción libre descrita» y en B «presión alegada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una presión externa se conecta con la acción del sujeto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción libre descrita` / `presión alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acción libre descrita / presión alegada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1011.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1012 · Coacción alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Coacción alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una presión externa se conecta con la acción del sujeto.

**Composición:** Escena principal de coacción alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una presión externa se conecta con la acción del sujeto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acción libre descrita» de «presión alegada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción libre descrita` / `presión alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para coacción alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1012.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1013 · Error de hecho alegado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Error de hecho alegado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** La percepción del personaje se compara con el hecho documentado.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de error de hecho alegado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: la percepción del personaje se compara con el hecho documentado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Percepción declarada` / `situación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: La percepción del personaje se compara con el hecho documentado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1013.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1014 · Error de hecho alegado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Error de hecho alegado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** La percepción del personaje se compara con el hecho documentado.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: la percepción del personaje se compara con el hecho documentado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en error de hecho alegado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Percepción declarada` / `situación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «La percepción del personaje se compara con el hecho documentado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1014.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1015 · Error de hecho alegado — Comparación de dos supuestos

**Objetivo:** Comparar «Percepción declarada» y «situación descrita» dentro de error de hecho alegado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** La percepción del personaje se compara con el hecho documentado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de error de hecho alegado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Percepción declarada» y en B «situación descrita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «la percepción del personaje se compara con el hecho documentado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Percepción declarada` / `situación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Percepción declarada / situación descrita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1015.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1016 · Error de hecho alegado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Error de hecho alegado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** La percepción del personaje se compara con el hecho documentado.

**Composición:** Escena principal de error de hecho alegado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: la percepción del personaje se compara con el hecho documentado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Percepción declarada» de «situación descrita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Percepción declarada` / `situación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para error de hecho alegado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1016.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1017 · Alibi ilustrativo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Alibi ilustrativo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos ubicaciones abstractas y sus horas se comparan.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de alibi ilustrativo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos ubicaciones abstractas y sus horas se comparan.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Presencia alegada` / `registro aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos ubicaciones abstractas y sus horas se comparan. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1017.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1018 · Alibi ilustrativo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Alibi ilustrativo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos ubicaciones abstractas y sus horas se comparan.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos ubicaciones abstractas y sus horas se comparan.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en alibi ilustrativo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Presencia alegada` / `registro aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos ubicaciones abstractas y sus horas se comparan» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1018.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1019 · Alibi ilustrativo — Comparación de dos supuestos

**Objetivo:** Comparar «Presencia alegada» y «registro aportado» dentro de alibi ilustrativo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos ubicaciones abstractas y sus horas se comparan.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de alibi ilustrativo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Presencia alegada» y en B «registro aportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos ubicaciones abstractas y sus horas se comparan» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Presencia alegada` / `registro aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Presencia alegada / registro aportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1019.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1020 · Alibi ilustrativo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Alibi ilustrativo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos ubicaciones abstractas y sus horas se comparan.

**Composición:** Escena principal de alibi ilustrativo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos ubicaciones abstractas y sus horas se comparan.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Presencia alegada» de «registro aportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Presencia alegada` / `registro aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para alibi ilustrativo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1020.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1021 · Autorización alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Autorización alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una acción se conecta con un permiso cuyo alcance se despliega.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de autorización alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una acción se conecta con un permiso cuyo alcance se despliega.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación dentro del permiso descrito` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una acción se conecta con un permiso cuyo alcance se despliega. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1021.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1022 · Autorización alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Autorización alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una acción se conecta con un permiso cuyo alcance se despliega.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una acción se conecta con un permiso cuyo alcance se despliega.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en autorización alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación dentro del permiso descrito` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una acción se conecta con un permiso cuyo alcance se despliega» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1022.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1023 · Autorización alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Actuación dentro del permiso descrito» y «alcance discutido» dentro de autorización alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una acción se conecta con un permiso cuyo alcance se despliega.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de autorización alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Actuación dentro del permiso descrito» y en B «alcance discutido» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una acción se conecta con un permiso cuyo alcance se despliega» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación dentro del permiso descrito` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Actuación dentro del permiso descrito / alcance discutido debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1023.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1024 · Autorización alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Autorización alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una acción se conecta con un permiso cuyo alcance se despliega.

**Composición:** Escena principal de autorización alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una acción se conecta con un permiso cuyo alcance se despliega.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Actuación dentro del permiso descrito» de «alcance discutido».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación dentro del permiso descrito` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para autorización alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1024.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1025 · Desistimiento alegado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Desistimiento alegado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una secuencia se interrumpe y se documentan actos posteriores.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de desistimiento alegado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una secuencia se interrumpe y se documentan actos posteriores.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Continuación prevista` / `interrupción descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una secuencia se interrumpe y se documentan actos posteriores. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1025.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1026 · Desistimiento alegado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Desistimiento alegado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una secuencia se interrumpe y se documentan actos posteriores.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una secuencia se interrumpe y se documentan actos posteriores.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en desistimiento alegado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Continuación prevista` / `interrupción descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una secuencia se interrumpe y se documentan actos posteriores» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1026.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1027 · Desistimiento alegado — Comparación de dos supuestos

**Objetivo:** Comparar «Continuación prevista» y «interrupción descrita» dentro de desistimiento alegado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una secuencia se interrumpe y se documentan actos posteriores.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de desistimiento alegado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Continuación prevista» y en B «interrupción descrita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una secuencia se interrumpe y se documentan actos posteriores» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Continuación prevista` / `interrupción descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Continuación prevista / interrupción descrita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1027.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1028 · Desistimiento alegado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Desistimiento alegado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una secuencia se interrumpe y se documentan actos posteriores.

**Composición:** Escena principal de desistimiento alegado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una secuencia se interrumpe y se documentan actos posteriores.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Continuación prevista» de «interrupción descrita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Continuación prevista` / `interrupción descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para desistimiento alegado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1028.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1029 · Imputabilidad como cuestión — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Imputabilidad como cuestión» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Documentos de evaluación se organizan sin diagnosticar a nadie.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de imputabilidad como cuestión en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: documentos de evaluación se organizan sin diagnosticar a nadie.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Evaluación aportada` / `cuestión no resuelta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Documentos de evaluación se organizan sin diagnosticar a nadie. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1029.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1030 · Imputabilidad como cuestión — Mecanismo o relación explicada

**Objetivo:** Descomponer «Imputabilidad como cuestión» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Documentos de evaluación se organizan sin diagnosticar a nadie.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: documentos de evaluación se organizan sin diagnosticar a nadie.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en imputabilidad como cuestión.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Evaluación aportada` / `cuestión no resuelta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Documentos de evaluación se organizan sin diagnosticar a nadie» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1030.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1031 · Imputabilidad como cuestión — Comparación de dos supuestos

**Objetivo:** Comparar «Evaluación aportada» y «cuestión no resuelta» dentro de imputabilidad como cuestión, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Documentos de evaluación se organizan sin diagnosticar a nadie.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de imputabilidad como cuestión, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Evaluación aportada» y en B «cuestión no resuelta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «documentos de evaluación se organizan sin diagnosticar a nadie» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Evaluación aportada` / `cuestión no resuelta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Evaluación aportada / cuestión no resuelta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1031.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1032 · Imputabilidad como cuestión — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Imputabilidad como cuestión» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Documentos de evaluación se organizan sin diagnosticar a nadie.

**Composición:** Escena principal de imputabilidad como cuestión con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: documentos de evaluación se organizan sin diagnosticar a nadie.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Evaluación aportada» de «cuestión no resuelta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Evaluación aportada` / `cuestión no resuelta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para imputabilidad como cuestión, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1032.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1033 · Consentimiento como cuestión — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Consentimiento como cuestión» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un registro de decisión se coloca junto a la conducta analizada.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de consentimiento como cuestión en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un registro de decisión se coloca junto a la conducta analizada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Consentimiento alegado` / `límites jurídicos por revisar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un registro de decisión se coloca junto a la conducta analizada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1033.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1034 · Consentimiento como cuestión — Mecanismo o relación explicada

**Objetivo:** Descomponer «Consentimiento como cuestión» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un registro de decisión se coloca junto a la conducta analizada.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un registro de decisión se coloca junto a la conducta analizada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en consentimiento como cuestión.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Consentimiento alegado` / `límites jurídicos por revisar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un registro de decisión se coloca junto a la conducta analizada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1034.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1035 · Consentimiento como cuestión — Comparación de dos supuestos

**Objetivo:** Comparar «Consentimiento alegado» y «límites jurídicos por revisar» dentro de consentimiento como cuestión, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un registro de decisión se coloca junto a la conducta analizada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de consentimiento como cuestión, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Consentimiento alegado» y en B «límites jurídicos por revisar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un registro de decisión se coloca junto a la conducta analizada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Consentimiento alegado` / `límites jurídicos por revisar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Consentimiento alegado / límites jurídicos por revisar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1035.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1036 · Consentimiento como cuestión — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Consentimiento como cuestión» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un registro de decisión se coloca junto a la conducta analizada.

**Composición:** Escena principal de consentimiento como cuestión con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un registro de decisión se coloca junto a la conducta analizada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Consentimiento alegado» de «límites jurídicos por revisar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Consentimiento alegado` / `límites jurídicos por revisar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para consentimiento como cuestión, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1036.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1037 · Carga de una defensa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Carga de una defensa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Los hechos invocados se conectan con la cuestión procesal suministrada.

**Composición:** Escenario abierto: escenario abstracto como ancla, escudo como interlocutor u objeto secundario y hechos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de carga de una defensa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: los hechos invocados se conectan con la cuestión procesal suministrada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `facts, defences, triggers, limitations, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento presentado` / `apoyo pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Los hechos invocados se conectan con la cuestión procesal suministrada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1037.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1038 · Carga de una defensa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Carga de una defensa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Los hechos invocados se conectan con la cuestión procesal suministrada.

**Composición:** Composición espacial con escenario abstracto, hechos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: los hechos invocados se conectan con la cuestión procesal suministrada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en carga de una defensa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `facts, defences, triggers, limitations, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento presentado` / `apoyo pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Los hechos invocados se conectan con la cuestión procesal suministrada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1038.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1039 · Carga de una defensa — Comparación de dos supuestos

**Objetivo:** Comparar «Argumento presentado» y «apoyo pendiente» dentro de carga de una defensa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Los hechos invocados se conectan con la cuestión procesal suministrada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de carga de una defensa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Argumento presentado» y en B «apoyo pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «los hechos invocados se conectan con la cuestión procesal suministrada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `facts, defences, triggers, limitations, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento presentado` / `apoyo pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Argumento presentado / apoyo pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1039.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1040 · Carga de una defensa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Carga de una defensa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Los hechos invocados se conectan con la cuestión procesal suministrada.

**Composición:** Escena principal de carga de una defensa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: los hechos invocados se conectan con la cuestión procesal suministrada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Argumento presentado» de «apoyo pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `facts, defences, triggers, limitations, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Argumento presentado` / `apoyo pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para carga de una defensa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/criminal-defences/LAW-1040.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
