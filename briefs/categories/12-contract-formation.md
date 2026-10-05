# 12. Formación del contrato

40 animaciones; IDs LAW-0441–LAW-0480. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-0441 · Oferta comunicada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Oferta comunicada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una propuesta viaja de una persona a otra mostrando sus términos.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de oferta comunicada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una propuesta viaja de una persona a otra mostrando sus términos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta enviada` / `propuesta recibida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una propuesta viaja de una persona a otra mostrando sus términos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0441.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0442 · Oferta comunicada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Oferta comunicada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una propuesta viaja de una persona a otra mostrando sus términos.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una propuesta viaja de una persona a otra mostrando sus términos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en oferta comunicada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta enviada` / `propuesta recibida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una propuesta viaja de una persona a otra mostrando sus términos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0442.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0443 · Oferta comunicada — Comparación de dos supuestos

**Objetivo:** Comparar «Propuesta enviada» y «propuesta recibida» dentro de oferta comunicada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una propuesta viaja de una persona a otra mostrando sus términos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de oferta comunicada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Propuesta enviada» y en B «propuesta recibida» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una propuesta viaja de una persona a otra mostrando sus términos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta enviada` / `propuesta recibida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Propuesta enviada / propuesta recibida debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0443.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0444 · Oferta comunicada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Oferta comunicada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una propuesta viaja de una persona a otra mostrando sus términos.

**Composición:** Escena principal de oferta comunicada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una propuesta viaja de una persona a otra mostrando sus términos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Propuesta enviada» de «propuesta recibida».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta enviada` / `propuesta recibida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para oferta comunicada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0444.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0445 · Aceptación y contrapropuesta — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Aceptación y contrapropuesta» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una respuesta conserva términos o sustituye una pieza del documento.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de aceptación y contrapropuesta en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una respuesta conserva términos o sustituye una pieza del documento.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta coincidente` / `términos modificados`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una respuesta conserva términos o sustituye una pieza del documento. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0445.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0446 · Aceptación y contrapropuesta — Mecanismo o relación explicada

**Objetivo:** Descomponer «Aceptación y contrapropuesta» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una respuesta conserva términos o sustituye una pieza del documento.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una respuesta conserva términos o sustituye una pieza del documento.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en aceptación y contrapropuesta.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta coincidente` / `términos modificados`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una respuesta conserva términos o sustituye una pieza del documento» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0446.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0447 · Aceptación y contrapropuesta — Comparación de dos supuestos

**Objetivo:** Comparar «Respuesta coincidente» y «términos modificados» dentro de aceptación y contrapropuesta, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una respuesta conserva términos o sustituye una pieza del documento.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de aceptación y contrapropuesta, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Respuesta coincidente» y en B «términos modificados» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una respuesta conserva términos o sustituye una pieza del documento» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta coincidente` / `términos modificados`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Respuesta coincidente / términos modificados debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0447.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0448 · Aceptación y contrapropuesta — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Aceptación y contrapropuesta» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una respuesta conserva términos o sustituye una pieza del documento.

**Composición:** Escena principal de aceptación y contrapropuesta con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una respuesta conserva términos o sustituye una pieza del documento.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Respuesta coincidente» de «términos modificados».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta coincidente` / `términos modificados`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para aceptación y contrapropuesta, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0448.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0449 · Retirada de propuesta — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Retirada de propuesta» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un mensaje de retirada se cruza con el recorrido de una propuesta.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de retirada de propuesta en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un mensaje de retirada se cruza con el recorrido de una propuesta.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Retirada comunicada` / `secuencia temporal por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un mensaje de retirada se cruza con el recorrido de una propuesta. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0449.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0450 · Retirada de propuesta — Mecanismo o relación explicada

**Objetivo:** Descomponer «Retirada de propuesta» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un mensaje de retirada se cruza con el recorrido de una propuesta.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un mensaje de retirada se cruza con el recorrido de una propuesta.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en retirada de propuesta.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Retirada comunicada` / `secuencia temporal por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un mensaje de retirada se cruza con el recorrido de una propuesta» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0450.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0451 · Retirada de propuesta — Comparación de dos supuestos

**Objetivo:** Comparar «Retirada comunicada» y «secuencia temporal por examinar» dentro de retirada de propuesta, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un mensaje de retirada se cruza con el recorrido de una propuesta.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de retirada de propuesta, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Retirada comunicada» y en B «secuencia temporal por examinar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un mensaje de retirada se cruza con el recorrido de una propuesta» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Retirada comunicada` / `secuencia temporal por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Retirada comunicada / secuencia temporal por examinar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0451.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0452 · Retirada de propuesta — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Retirada de propuesta» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un mensaje de retirada se cruza con el recorrido de una propuesta.

**Composición:** Escena principal de retirada de propuesta con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un mensaje de retirada se cruza con el recorrido de una propuesta.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Retirada comunicada» de «secuencia temporal por examinar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Retirada comunicada` / `secuencia temporal por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para retirada de propuesta, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0452.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0453 · Vencimiento de propuesta — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Vencimiento de propuesta» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un reloj editable llega a una marca junto a la propuesta.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de vencimiento de propuesta en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un reloj editable llega a una marca junto a la propuesta.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta anterior` / `posterior al hito suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un reloj editable llega a una marca junto a la propuesta. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0453.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0454 · Vencimiento de propuesta — Mecanismo o relación explicada

**Objetivo:** Descomponer «Vencimiento de propuesta» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un reloj editable llega a una marca junto a la propuesta.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un reloj editable llega a una marca junto a la propuesta.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en vencimiento de propuesta.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta anterior` / `posterior al hito suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un reloj editable llega a una marca junto a la propuesta» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0454.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0455 · Vencimiento de propuesta — Comparación de dos supuestos

**Objetivo:** Comparar «Respuesta anterior» y «posterior al hito suministrado» dentro de vencimiento de propuesta, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un reloj editable llega a una marca junto a la propuesta.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de vencimiento de propuesta, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Respuesta anterior» y en B «posterior al hito suministrado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un reloj editable llega a una marca junto a la propuesta» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta anterior` / `posterior al hito suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Respuesta anterior / posterior al hito suministrado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0455.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0456 · Vencimiento de propuesta — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Vencimiento de propuesta» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un reloj editable llega a una marca junto a la propuesta.

**Composición:** Escena principal de vencimiento de propuesta con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un reloj editable llega a una marca junto a la propuesta.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Respuesta anterior» de «posterior al hito suministrado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Respuesta anterior` / `posterior al hito suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para vencimiento de propuesta, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0456.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0457 · Intercambio de promesas — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Intercambio de promesas» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos compromisos cruzan entre partes conservando sus titulares.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de intercambio de promesas en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos compromisos cruzan entre partes conservando sus titulares.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromisos recíprocos` / `promesa unilateral`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos compromisos cruzan entre partes conservando sus titulares. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0457.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0458 · Intercambio de promesas — Mecanismo o relación explicada

**Objetivo:** Descomponer «Intercambio de promesas» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos compromisos cruzan entre partes conservando sus titulares.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos compromisos cruzan entre partes conservando sus titulares.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en intercambio de promesas.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromisos recíprocos` / `promesa unilateral`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos compromisos cruzan entre partes conservando sus titulares» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0458.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0459 · Intercambio de promesas — Comparación de dos supuestos

**Objetivo:** Comparar «Compromisos recíprocos» y «promesa unilateral» dentro de intercambio de promesas, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos compromisos cruzan entre partes conservando sus titulares.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de intercambio de promesas, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Compromisos recíprocos» y en B «promesa unilateral» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos compromisos cruzan entre partes conservando sus titulares» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromisos recíprocos` / `promesa unilateral`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Compromisos recíprocos / promesa unilateral debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0459.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0460 · Intercambio de promesas — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Intercambio de promesas» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos compromisos cruzan entre partes conservando sus titulares.

**Composición:** Escena principal de intercambio de promesas con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos compromisos cruzan entre partes conservando sus titulares.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Compromisos recíprocos» de «promesa unilateral».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromisos recíprocos` / `promesa unilateral`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para intercambio de promesas, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0460.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0461 · Consideration como concepto — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Consideration como concepto» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una ficha de prestación y otra de promesa se conectan sin afirmar validez.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de consideration como concepto en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una ficha de prestación y otra de promesa se conectan sin afirmar validez.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prestación identificada` / `cuestión por analizar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una ficha de prestación y otra de promesa se conectan sin afirmar validez. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0461.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0462 · Consideration como concepto — Mecanismo o relación explicada

**Objetivo:** Descomponer «Consideration como concepto» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una ficha de prestación y otra de promesa se conectan sin afirmar validez.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una ficha de prestación y otra de promesa se conectan sin afirmar validez.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en consideration como concepto.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prestación identificada` / `cuestión por analizar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una ficha de prestación y otra de promesa se conectan sin afirmar validez» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0462.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0463 · Consideration como concepto — Comparación de dos supuestos

**Objetivo:** Comparar «Prestación identificada» y «cuestión por analizar» dentro de consideration como concepto, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una ficha de prestación y otra de promesa se conectan sin afirmar validez.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de consideration como concepto, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Prestación identificada» y en B «cuestión por analizar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una ficha de prestación y otra de promesa se conectan sin afirmar validez» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prestación identificada` / `cuestión por analizar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Prestación identificada / cuestión por analizar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0463.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0464 · Consideration como concepto — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Consideration como concepto» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una ficha de prestación y otra de promesa se conectan sin afirmar validez.

**Composición:** Escena principal de consideration como concepto con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una ficha de prestación y otra de promesa se conectan sin afirmar validez.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Prestación identificada» de «cuestión por analizar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prestación identificada` / `cuestión por analizar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para consideration como concepto, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0464.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0465 · Intención de vincularse — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Intención de vincularse» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un contexto social y otro negociado rodean la misma conversación.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de intención de vincularse en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un contexto social y otro negociado rodean la misma conversación.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Contexto A` / `contexto B sin conclusión automática`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un contexto social y otro negociado rodean la misma conversación. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0465.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0466 · Intención de vincularse — Mecanismo o relación explicada

**Objetivo:** Descomponer «Intención de vincularse» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un contexto social y otro negociado rodean la misma conversación.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un contexto social y otro negociado rodean la misma conversación.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en intención de vincularse.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Contexto A` / `contexto B sin conclusión automática`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un contexto social y otro negociado rodean la misma conversación» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0466.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0467 · Intención de vincularse — Comparación de dos supuestos

**Objetivo:** Comparar «Contexto A» y «contexto B sin conclusión automática» dentro de intención de vincularse, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un contexto social y otro negociado rodean la misma conversación.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de intención de vincularse, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Contexto A» y en B «contexto B sin conclusión automática» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un contexto social y otro negociado rodean la misma conversación» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Contexto A` / `contexto B sin conclusión automática`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Contexto A / contexto B sin conclusión automática debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0467.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0468 · Intención de vincularse — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Intención de vincularse» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un contexto social y otro negociado rodean la misma conversación.

**Composición:** Escena principal de intención de vincularse con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un contexto social y otro negociado rodean la misma conversación.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Contexto A» de «contexto B sin conclusión automática».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Contexto A` / `contexto B sin conclusión automática`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para intención de vincularse, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0468.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0469 · Capacidad de las partes — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Capacidad de las partes» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Tarjetas de parte despliegan atributos relevantes aportados.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de capacidad de las partes en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: tarjetas de parte despliegan atributos relevantes aportados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Datos completos` / `capacidad pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Tarjetas de parte despliegan atributos relevantes aportados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0469.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0470 · Capacidad de las partes — Mecanismo o relación explicada

**Objetivo:** Descomponer «Capacidad de las partes» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Tarjetas de parte despliegan atributos relevantes aportados.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: tarjetas de parte despliegan atributos relevantes aportados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en capacidad de las partes.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Datos completos` / `capacidad pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Tarjetas de parte despliegan atributos relevantes aportados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0470.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0471 · Capacidad de las partes — Comparación de dos supuestos

**Objetivo:** Comparar «Datos completos» y «capacidad pendiente de verificar» dentro de capacidad de las partes, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Tarjetas de parte despliegan atributos relevantes aportados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de capacidad de las partes, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Datos completos» y en B «capacidad pendiente de verificar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «tarjetas de parte despliegan atributos relevantes aportados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Datos completos` / `capacidad pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Datos completos / capacidad pendiente de verificar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0471.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0472 · Capacidad de las partes — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Capacidad de las partes» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Tarjetas de parte despliegan atributos relevantes aportados.

**Composición:** Escena principal de capacidad de las partes con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: tarjetas de parte despliegan atributos relevantes aportados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Datos completos» de «capacidad pendiente de verificar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Datos completos` / `capacidad pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para capacidad de las partes, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0472.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0473 · Formalidades de celebración — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Formalidades de celebración» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un documento se conecta con los pasos exigidos en el supuesto dado.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de formalidades de celebración en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un documento se conecta con los pasos exigidos en el supuesto dado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Formalidad aportada` / `formalidad pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un documento se conecta con los pasos exigidos en el supuesto dado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0473.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0474 · Formalidades de celebración — Mecanismo o relación explicada

**Objetivo:** Descomponer «Formalidades de celebración» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un documento se conecta con los pasos exigidos en el supuesto dado.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un documento se conecta con los pasos exigidos en el supuesto dado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en formalidades de celebración.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Formalidad aportada` / `formalidad pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un documento se conecta con los pasos exigidos en el supuesto dado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0474.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0475 · Formalidades de celebración — Comparación de dos supuestos

**Objetivo:** Comparar «Formalidad aportada» y «formalidad pendiente» dentro de formalidades de celebración, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un documento se conecta con los pasos exigidos en el supuesto dado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de formalidades de celebración, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Formalidad aportada» y en B «formalidad pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un documento se conecta con los pasos exigidos en el supuesto dado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Formalidad aportada` / `formalidad pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Formalidad aportada / formalidad pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0475.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0476 · Formalidades de celebración — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Formalidades de celebración» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un documento se conecta con los pasos exigidos en el supuesto dado.

**Composición:** Escena principal de formalidades de celebración con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un documento se conecta con los pasos exigidos en el supuesto dado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Formalidad aportada» de «formalidad pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Formalidad aportada` / `formalidad pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para formalidades de celebración, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0476.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0477 · Aceptación digital — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Aceptación digital» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una pantalla muestra términos antes de registrar una acción del usuario.

**Composición:** Escenario abierto: partes como ancla, oferta como interlocutor u objeto secundario y mensajes como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de aceptación digital en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una pantalla muestra términos antes de registrar una acción del usuario.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `offer, responses, terms, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción informada` / `presentación insuficiente por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una pantalla muestra términos antes de registrar una acción del usuario. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0477.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0478 · Aceptación digital — Mecanismo o relación explicada

**Objetivo:** Descomponer «Aceptación digital» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una pantalla muestra términos antes de registrar una acción del usuario.

**Composición:** Composición espacial con partes, mensajes y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una pantalla muestra términos antes de registrar una acción del usuario.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en aceptación digital.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `offer, responses, terms, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción informada` / `presentación insuficiente por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una pantalla muestra términos antes de registrar una acción del usuario» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0478.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0479 · Aceptación digital — Comparación de dos supuestos

**Objetivo:** Comparar «Acción informada» y «presentación insuficiente por examinar» dentro de aceptación digital, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una pantalla muestra términos antes de registrar una acción del usuario.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de aceptación digital, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acción informada» y en B «presentación insuficiente por examinar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una pantalla muestra términos antes de registrar una acción del usuario» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `offer, responses, terms, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción informada` / `presentación insuficiente por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acción informada / presentación insuficiente por examinar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0479.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0480 · Aceptación digital — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Aceptación digital» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una pantalla muestra términos antes de registrar una acción del usuario.

**Composición:** Escena principal de aceptación digital con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una pantalla muestra términos antes de registrar una acción del usuario.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acción informada» de «presentación insuficiente por examinar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `offer, responses, terms, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acción informada` / `presentación insuficiente por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para aceptación digital, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/contract-formation/LAW-0480.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
