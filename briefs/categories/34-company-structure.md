# 34. Estructuras societarias

40 animaciones; IDs LAW-1321–LAW-1360. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1321 · Constitución de sociedad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Constitución de sociedad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Documentos y aportaciones se agrupan alrededor de una entidad nueva.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de constitución de sociedad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: documentos y aportaciones se agrupan alrededor de una entidad nueva.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto societario` / `registro documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Documentos y aportaciones se agrupan alrededor de una entidad nueva. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1321.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1322 · Constitución de sociedad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Constitución de sociedad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Documentos y aportaciones se agrupan alrededor de una entidad nueva.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: documentos y aportaciones se agrupan alrededor de una entidad nueva.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en constitución de sociedad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto societario` / `registro documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Documentos y aportaciones se agrupan alrededor de una entidad nueva» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1322.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1323 · Constitución de sociedad — Comparación de dos supuestos

**Objetivo:** Comparar «Proyecto societario» y «registro documentado» dentro de constitución de sociedad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Documentos y aportaciones se agrupan alrededor de una entidad nueva.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de constitución de sociedad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Proyecto societario» y en B «registro documentado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «documentos y aportaciones se agrupan alrededor de una entidad nueva» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto societario` / `registro documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Proyecto societario / registro documentado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1323.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1324 · Constitución de sociedad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Constitución de sociedad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Documentos y aportaciones se agrupan alrededor de una entidad nueva.

**Composición:** Escena principal de constitución de sociedad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: documentos y aportaciones se agrupan alrededor de una entidad nueva.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Proyecto societario» de «registro documentado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto societario` / `registro documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para constitución de sociedad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1324.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1325 · Personalidad separada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Personalidad separada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Activos de socios y sociedad quedan en conjuntos diferenciados.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de personalidad separada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: activos de socios y sociedad quedan en conjuntos diferenciados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio del socio` / `patrimonio social`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Activos de socios y sociedad quedan en conjuntos diferenciados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1325.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1326 · Personalidad separada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Personalidad separada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Activos de socios y sociedad quedan en conjuntos diferenciados.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: activos de socios y sociedad quedan en conjuntos diferenciados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en personalidad separada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio del socio` / `patrimonio social`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Activos de socios y sociedad quedan en conjuntos diferenciados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1326.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1327 · Personalidad separada — Comparación de dos supuestos

**Objetivo:** Comparar «Patrimonio del socio» y «patrimonio social» dentro de personalidad separada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Activos de socios y sociedad quedan en conjuntos diferenciados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de personalidad separada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Patrimonio del socio» y en B «patrimonio social» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «activos de socios y sociedad quedan en conjuntos diferenciados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio del socio` / `patrimonio social`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Patrimonio del socio / patrimonio social debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1327.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1328 · Personalidad separada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Personalidad separada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Activos de socios y sociedad quedan en conjuntos diferenciados.

**Composición:** Escena principal de personalidad separada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: activos de socios y sociedad quedan en conjuntos diferenciados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Patrimonio del socio» de «patrimonio social».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio del socio` / `patrimonio social`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para personalidad separada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1328.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1329 · Aportación de capital — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Aportación de capital» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dinero o bienes entran en una entidad vinculados a participaciones.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de aportación de capital en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dinero o bienes entran en una entidad vinculados a participaciones.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aportación comprometida` / `aportación realizada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dinero o bienes entran en una entidad vinculados a participaciones. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1329.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1330 · Aportación de capital — Mecanismo o relación explicada

**Objetivo:** Descomponer «Aportación de capital» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dinero o bienes entran en una entidad vinculados a participaciones.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dinero o bienes entran en una entidad vinculados a participaciones.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en aportación de capital.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aportación comprometida` / `aportación realizada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dinero o bienes entran en una entidad vinculados a participaciones» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1330.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1331 · Aportación de capital — Comparación de dos supuestos

**Objetivo:** Comparar «Aportación comprometida» y «aportación realizada» dentro de aportación de capital, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dinero o bienes entran en una entidad vinculados a participaciones.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de aportación de capital, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Aportación comprometida» y en B «aportación realizada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dinero o bienes entran en una entidad vinculados a participaciones» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aportación comprometida` / `aportación realizada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Aportación comprometida / aportación realizada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1331.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1332 · Aportación de capital — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Aportación de capital» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dinero o bienes entran en una entidad vinculados a participaciones.

**Composición:** Escena principal de aportación de capital con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dinero o bienes entran en una entidad vinculados a participaciones.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Aportación comprometida» de «aportación realizada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Aportación comprometida` / `aportación realizada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para aportación de capital, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1332.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1333 · Participaciones sociales — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Participaciones sociales» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un conjunto se divide en cuotas suministradas sin presumir derechos.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de participaciones sociales en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un conjunto se divide en cuotas suministradas sin presumir derechos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Participación A` / `participación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un conjunto se divide en cuotas suministradas sin presumir derechos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1333.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1334 · Participaciones sociales — Mecanismo o relación explicada

**Objetivo:** Descomponer «Participaciones sociales» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un conjunto se divide en cuotas suministradas sin presumir derechos.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un conjunto se divide en cuotas suministradas sin presumir derechos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en participaciones sociales.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Participación A` / `participación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un conjunto se divide en cuotas suministradas sin presumir derechos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1334.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1335 · Participaciones sociales — Comparación de dos supuestos

**Objetivo:** Comparar «Participación A» y «participación B» dentro de participaciones sociales, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un conjunto se divide en cuotas suministradas sin presumir derechos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de participaciones sociales, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Participación A» y en B «participación B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un conjunto se divide en cuotas suministradas sin presumir derechos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Participación A` / `participación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Participación A / participación B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1335.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1336 · Participaciones sociales — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Participaciones sociales» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un conjunto se divide en cuotas suministradas sin presumir derechos.

**Composición:** Escena principal de participaciones sociales con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un conjunto se divide en cuotas suministradas sin presumir derechos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Participación A» de «participación B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Participación A` / `participación B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para participaciones sociales, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1336.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1337 · Transmisión de participación — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Transmisión de participación» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una cuota pasa entre titulares conservando su referencia.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de transmisión de participación en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una cuota pasa entre titulares conservando su referencia.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular anterior` / `titular posterior declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una cuota pasa entre titulares conservando su referencia. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1337.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1338 · Transmisión de participación — Mecanismo o relación explicada

**Objetivo:** Descomponer «Transmisión de participación» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una cuota pasa entre titulares conservando su referencia.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una cuota pasa entre titulares conservando su referencia.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en transmisión de participación.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular anterior` / `titular posterior declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una cuota pasa entre titulares conservando su referencia» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1338.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1339 · Transmisión de participación — Comparación de dos supuestos

**Objetivo:** Comparar «Titular anterior» y «titular posterior declarado» dentro de transmisión de participación, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una cuota pasa entre titulares conservando su referencia.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de transmisión de participación, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Titular anterior» y en B «titular posterior declarado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una cuota pasa entre titulares conservando su referencia» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular anterior` / `titular posterior declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Titular anterior / titular posterior declarado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1339.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1340 · Transmisión de participación — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Transmisión de participación» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una cuota pasa entre titulares conservando su referencia.

**Composición:** Escena principal de transmisión de participación con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una cuota pasa entre titulares conservando su referencia.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Titular anterior» de «titular posterior declarado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular anterior` / `titular posterior declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para transmisión de participación, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1340.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1341 · Grupo de sociedades — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Grupo de sociedades» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Entidades se conectan mediante vínculos de control etiquetados.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de grupo de sociedades en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: entidades se conectan mediante vínculos de control etiquetados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vínculo societario` / `relación comercial`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Entidades se conectan mediante vínculos de control etiquetados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1341.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1342 · Grupo de sociedades — Mecanismo o relación explicada

**Objetivo:** Descomponer «Grupo de sociedades» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Entidades se conectan mediante vínculos de control etiquetados.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: entidades se conectan mediante vínculos de control etiquetados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en grupo de sociedades.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vínculo societario` / `relación comercial`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Entidades se conectan mediante vínculos de control etiquetados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1342.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1343 · Grupo de sociedades — Comparación de dos supuestos

**Objetivo:** Comparar «Vínculo societario» y «relación comercial» dentro de grupo de sociedades, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Entidades se conectan mediante vínculos de control etiquetados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de grupo de sociedades, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Vínculo societario» y en B «relación comercial» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «entidades se conectan mediante vínculos de control etiquetados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vínculo societario` / `relación comercial`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Vínculo societario / relación comercial debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1343.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1344 · Grupo de sociedades — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Grupo de sociedades» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Entidades se conectan mediante vínculos de control etiquetados.

**Composición:** Escena principal de grupo de sociedades con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: entidades se conectan mediante vínculos de control etiquetados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Vínculo societario» de «relación comercial».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Vínculo societario` / `relación comercial`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para grupo de sociedades, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1344.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1345 · Sucursal y filial — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Sucursal y filial» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos formas de presencia se dibujan conforme a definiciones aportadas.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de sucursal y filial en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos formas de presencia se dibujan conforme a definiciones aportadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estructura A` / `estructura B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos formas de presencia se dibujan conforme a definiciones aportadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1345.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1346 · Sucursal y filial — Mecanismo o relación explicada

**Objetivo:** Descomponer «Sucursal y filial» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos formas de presencia se dibujan conforme a definiciones aportadas.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos formas de presencia se dibujan conforme a definiciones aportadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en sucursal y filial.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estructura A` / `estructura B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos formas de presencia se dibujan conforme a definiciones aportadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1346.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1347 · Sucursal y filial — Comparación de dos supuestos

**Objetivo:** Comparar «Estructura A» y «estructura B» dentro de sucursal y filial, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos formas de presencia se dibujan conforme a definiciones aportadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de sucursal y filial, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Estructura A» y en B «estructura B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos formas de presencia se dibujan conforme a definiciones aportadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estructura A` / `estructura B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Estructura A / estructura B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1347.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1348 · Sucursal y filial — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Sucursal y filial» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos formas de presencia se dibujan conforme a definiciones aportadas.

**Composición:** Escena principal de sucursal y filial con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos formas de presencia se dibujan conforme a definiciones aportadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Estructura A» de «estructura B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estructura A` / `estructura B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para sucursal y filial, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1348.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1349 · Titularidad real declarada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Titularidad real declarada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Capas de entidades se despliegan hasta personas según datos suministrados.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de titularidad real declarada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: capas de entidades se despliegan hasta personas según datos suministrados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular formal` / `control declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Capas de entidades se despliegan hasta personas según datos suministrados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1349.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1350 · Titularidad real declarada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Titularidad real declarada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Capas de entidades se despliegan hasta personas según datos suministrados.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: capas de entidades se despliegan hasta personas según datos suministrados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en titularidad real declarada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular formal` / `control declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Capas de entidades se despliegan hasta personas según datos suministrados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1350.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1351 · Titularidad real declarada — Comparación de dos supuestos

**Objetivo:** Comparar «Titular formal» y «control declarado» dentro de titularidad real declarada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Capas de entidades se despliegan hasta personas según datos suministrados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de titularidad real declarada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Titular formal» y en B «control declarado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «capas de entidades se despliegan hasta personas según datos suministrados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular formal` / `control declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Titular formal / control declarado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1351.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1352 · Titularidad real declarada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Titularidad real declarada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Capas de entidades se despliegan hasta personas según datos suministrados.

**Composición:** Escena principal de titularidad real declarada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: capas de entidades se despliegan hasta personas según datos suministrados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Titular formal» de «control declarado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Titular formal` / `control declarado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para titularidad real declarada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1352.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1353 · Estatutos y acuerdos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Estatutos y acuerdos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un documento estructural se compara con acuerdos complementarios.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de estatutos y acuerdos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un documento estructural se compara con acuerdos complementarios.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Regla estatutaria` / `pacto aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un documento estructural se compara con acuerdos complementarios. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1353.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1354 · Estatutos y acuerdos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Estatutos y acuerdos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un documento estructural se compara con acuerdos complementarios.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un documento estructural se compara con acuerdos complementarios.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en estatutos y acuerdos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Regla estatutaria` / `pacto aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un documento estructural se compara con acuerdos complementarios» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1354.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1355 · Estatutos y acuerdos — Comparación de dos supuestos

**Objetivo:** Comparar «Regla estatutaria» y «pacto aportado» dentro de estatutos y acuerdos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un documento estructural se compara con acuerdos complementarios.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de estatutos y acuerdos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Regla estatutaria» y en B «pacto aportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un documento estructural se compara con acuerdos complementarios» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Regla estatutaria` / `pacto aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Regla estatutaria / pacto aportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1355.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1356 · Estatutos y acuerdos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Estatutos y acuerdos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un documento estructural se compara con acuerdos complementarios.

**Composición:** Escena principal de estatutos y acuerdos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un documento estructural se compara con acuerdos complementarios.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Regla estatutaria» de «pacto aportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Regla estatutaria` / `pacto aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para estatutos y acuerdos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1356.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1357 · Cambio de estructura — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cambio de estructura» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos organigramas preservan la trazabilidad de activos y vínculos.

**Composición:** Escenario abierto: sociedad como ancla, socios como interlocutor u objeto secundario y activos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cambio de estructura en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos organigramas preservan la trazabilidad de activos y vínculos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, shareholders, interests, contributions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Organización inicial` / `reorganización propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos organigramas preservan la trazabilidad de activos y vínculos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1357.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1358 · Cambio de estructura — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cambio de estructura» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos organigramas preservan la trazabilidad de activos y vínculos.

**Composición:** Composición espacial con sociedad, activos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos organigramas preservan la trazabilidad de activos y vínculos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cambio de estructura.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, shareholders, interests, contributions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Organización inicial` / `reorganización propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos organigramas preservan la trazabilidad de activos y vínculos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1358.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1359 · Cambio de estructura — Comparación de dos supuestos

**Objetivo:** Comparar «Organización inicial» y «reorganización propuesta» dentro de cambio de estructura, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos organigramas preservan la trazabilidad de activos y vínculos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cambio de estructura, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Organización inicial» y en B «reorganización propuesta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos organigramas preservan la trazabilidad de activos y vínculos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, shareholders, interests, contributions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Organización inicial` / `reorganización propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Organización inicial / reorganización propuesta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1359.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1360 · Cambio de estructura — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cambio de estructura» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos organigramas preservan la trazabilidad de activos y vínculos.

**Composición:** Escena principal de cambio de estructura con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos organigramas preservan la trazabilidad de activos y vínculos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Organización inicial» de «reorganización propuesta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, shareholders, interests, contributions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Organización inicial` / `reorganización propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cambio de estructura, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/company-structure/LAW-1360.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
