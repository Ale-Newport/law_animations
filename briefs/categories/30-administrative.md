# 30. Actuación y revisión administrativa

40 animaciones; IDs LAW-1161–LAW-1200. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1161 · Solicitud administrativa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Solicitud administrativa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una persona entrega documentación y recibe referencia de expediente.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de solicitud administrativa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una persona entrega documentación y recibe referencia de expediente.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Solicitud registrada` / `documentación pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una persona entrega documentación y recibe referencia de expediente. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1161.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1162 · Solicitud administrativa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Solicitud administrativa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una persona entrega documentación y recibe referencia de expediente.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una persona entrega documentación y recibe referencia de expediente.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en solicitud administrativa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Solicitud registrada` / `documentación pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una persona entrega documentación y recibe referencia de expediente» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1162.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1163 · Solicitud administrativa — Comparación de dos supuestos

**Objetivo:** Comparar «Solicitud registrada» y «documentación pendiente» dentro de solicitud administrativa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una persona entrega documentación y recibe referencia de expediente.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de solicitud administrativa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Solicitud registrada» y en B «documentación pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una persona entrega documentación y recibe referencia de expediente» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Solicitud registrada` / `documentación pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Solicitud registrada / documentación pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1163.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1164 · Solicitud administrativa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Solicitud administrativa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una persona entrega documentación y recibe referencia de expediente.

**Composición:** Escena principal de solicitud administrativa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una persona entrega documentación y recibe referencia de expediente.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Solicitud registrada» de «documentación pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Solicitud registrada` / `documentación pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para solicitud administrativa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1164.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1165 · Requerimiento de información — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Requerimiento de información» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un órgano señala campos y la respuesta los completa.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de requerimiento de información en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un órgano señala campos y la respuesta los completa.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato aportado` / `dato pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un órgano señala campos y la respuesta los completa. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1165.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1166 · Requerimiento de información — Mecanismo o relación explicada

**Objetivo:** Descomponer «Requerimiento de información» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un órgano señala campos y la respuesta los completa.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un órgano señala campos y la respuesta los completa.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en requerimiento de información.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato aportado` / `dato pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un órgano señala campos y la respuesta los completa» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1166.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1167 · Requerimiento de información — Comparación de dos supuestos

**Objetivo:** Comparar «Dato aportado» y «dato pendiente» dentro de requerimiento de información, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un órgano señala campos y la respuesta los completa.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de requerimiento de información, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Dato aportado» y en B «dato pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un órgano señala campos y la respuesta los completa» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato aportado` / `dato pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Dato aportado / dato pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1167.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1168 · Requerimiento de información — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Requerimiento de información» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un órgano señala campos y la respuesta los completa.

**Composición:** Escena principal de requerimiento de información con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un órgano señala campos y la respuesta los completa.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Dato aportado» de «dato pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato aportado` / `dato pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para requerimiento de información, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1168.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1169 · Audiencia de persona interesada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Audiencia de persona interesada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una propuesta abre espacio para alegaciones vinculadas.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de audiencia de persona interesada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una propuesta abre espacio para alegaciones vinculadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta inicial` / `observaciones presentadas`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una propuesta abre espacio para alegaciones vinculadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1169.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1170 · Audiencia de persona interesada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Audiencia de persona interesada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una propuesta abre espacio para alegaciones vinculadas.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una propuesta abre espacio para alegaciones vinculadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en audiencia de persona interesada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta inicial` / `observaciones presentadas`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una propuesta abre espacio para alegaciones vinculadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1170.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1171 · Audiencia de persona interesada — Comparación de dos supuestos

**Objetivo:** Comparar «Propuesta inicial» y «observaciones presentadas» dentro de audiencia de persona interesada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una propuesta abre espacio para alegaciones vinculadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de audiencia de persona interesada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Propuesta inicial» y en B «observaciones presentadas» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una propuesta abre espacio para alegaciones vinculadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta inicial` / `observaciones presentadas`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Propuesta inicial / observaciones presentadas debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1171.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1172 · Audiencia de persona interesada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Audiencia de persona interesada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una propuesta abre espacio para alegaciones vinculadas.

**Composición:** Escena principal de audiencia de persona interesada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una propuesta abre espacio para alegaciones vinculadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Propuesta inicial» de «observaciones presentadas».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Propuesta inicial` / `observaciones presentadas`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para audiencia de persona interesada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1172.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1173 · Motivación de resolución — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Motivación de resolución» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Apartados de una decisión conectan hechos y razones declaradas.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de motivación de resolución en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: apartados de una decisión conectan hechos y razones declaradas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Razón explícita` / `fundamento no identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Apartados de una decisión conectan hechos y razones declaradas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1173.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1174 · Motivación de resolución — Mecanismo o relación explicada

**Objetivo:** Descomponer «Motivación de resolución» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Apartados de una decisión conectan hechos y razones declaradas.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: apartados de una decisión conectan hechos y razones declaradas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en motivación de resolución.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Razón explícita` / `fundamento no identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Apartados de una decisión conectan hechos y razones declaradas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1174.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1175 · Motivación de resolución — Comparación de dos supuestos

**Objetivo:** Comparar «Razón explícita» y «fundamento no identificado» dentro de motivación de resolución, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Apartados de una decisión conectan hechos y razones declaradas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de motivación de resolución, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Razón explícita» y en B «fundamento no identificado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «apartados de una decisión conectan hechos y razones declaradas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Razón explícita` / `fundamento no identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Razón explícita / fundamento no identificado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1175.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1176 · Motivación de resolución — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Motivación de resolución» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Apartados de una decisión conectan hechos y razones declaradas.

**Composición:** Escena principal de motivación de resolución con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: apartados de una decisión conectan hechos y razones declaradas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Razón explícita» de «fundamento no identificado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Razón explícita` / `fundamento no identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para motivación de resolución, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1176.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1177 · Ámbito de potestad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ámbito de potestad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una actuación se coloca dentro del marco normativo suministrado.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ámbito de potestad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una actuación se coloca dentro del marco normativo suministrado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación incluida` / `límite por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una actuación se coloca dentro del marco normativo suministrado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1177.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1178 · Ámbito de potestad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ámbito de potestad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una actuación se coloca dentro del marco normativo suministrado.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una actuación se coloca dentro del marco normativo suministrado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ámbito de potestad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación incluida` / `límite por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una actuación se coloca dentro del marco normativo suministrado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1178.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1179 · Ámbito de potestad — Comparación de dos supuestos

**Objetivo:** Comparar «Actuación incluida» y «límite por examinar» dentro de ámbito de potestad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una actuación se coloca dentro del marco normativo suministrado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ámbito de potestad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Actuación incluida» y en B «límite por examinar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una actuación se coloca dentro del marco normativo suministrado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación incluida` / `límite por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Actuación incluida / límite por examinar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1179.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1180 · Ámbito de potestad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ámbito de potestad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una actuación se coloca dentro del marco normativo suministrado.

**Composición:** Escena principal de ámbito de potestad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una actuación se coloca dentro del marco normativo suministrado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Actuación incluida» de «límite por examinar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación incluida` / `límite por examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ámbito de potestad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1180.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1181 · Discrecionalidad y límites — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Discrecionalidad y límites» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varias opciones permanecen dentro de un contorno de restricciones dadas.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de discrecionalidad y límites en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varias opciones permanecen dentro de un contorno de restricciones dadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Opción A` / `opción B sin elegir ganadora`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varias opciones permanecen dentro de un contorno de restricciones dadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1181.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1182 · Discrecionalidad y límites — Mecanismo o relación explicada

**Objetivo:** Descomponer «Discrecionalidad y límites» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varias opciones permanecen dentro de un contorno de restricciones dadas.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varias opciones permanecen dentro de un contorno de restricciones dadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en discrecionalidad y límites.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Opción A` / `opción B sin elegir ganadora`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varias opciones permanecen dentro de un contorno de restricciones dadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1182.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1183 · Discrecionalidad y límites — Comparación de dos supuestos

**Objetivo:** Comparar «Opción A» y «opción B sin elegir ganadora» dentro de discrecionalidad y límites, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varias opciones permanecen dentro de un contorno de restricciones dadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de discrecionalidad y límites, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Opción A» y en B «opción B sin elegir ganadora» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varias opciones permanecen dentro de un contorno de restricciones dadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Opción A` / `opción B sin elegir ganadora`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Opción A / opción B sin elegir ganadora debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1183.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1184 · Discrecionalidad y límites — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Discrecionalidad y límites» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varias opciones permanecen dentro de un contorno de restricciones dadas.

**Composición:** Escena principal de discrecionalidad y límites con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varias opciones permanecen dentro de un contorno de restricciones dadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Opción A» de «opción B sin elegir ganadora».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Opción A` / `opción B sin elegir ganadora`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para discrecionalidad y límites, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1184.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1185 · Confianza y práctica previa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Confianza y práctica previa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una comunicación anterior se compara con una actuación posterior.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de confianza y práctica previa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una comunicación anterior se compara con una actuación posterior.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Expectativa alegada` / `decisión comunicada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una comunicación anterior se compara con una actuación posterior. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1185.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1186 · Confianza y práctica previa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Confianza y práctica previa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una comunicación anterior se compara con una actuación posterior.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una comunicación anterior se compara con una actuación posterior.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en confianza y práctica previa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Expectativa alegada` / `decisión comunicada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una comunicación anterior se compara con una actuación posterior» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1186.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1187 · Confianza y práctica previa — Comparación de dos supuestos

**Objetivo:** Comparar «Expectativa alegada» y «decisión comunicada» dentro de confianza y práctica previa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una comunicación anterior se compara con una actuación posterior.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de confianza y práctica previa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Expectativa alegada» y en B «decisión comunicada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una comunicación anterior se compara con una actuación posterior» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Expectativa alegada` / `decisión comunicada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Expectativa alegada / decisión comunicada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1187.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1188 · Confianza y práctica previa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Confianza y práctica previa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una comunicación anterior se compara con una actuación posterior.

**Composición:** Escena principal de confianza y práctica previa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una comunicación anterior se compara con una actuación posterior.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Expectativa alegada» de «decisión comunicada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Expectativa alegada` / `decisión comunicada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para confianza y práctica previa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1188.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1189 · Imparcialidad procedimental — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Imparcialidad procedimental» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Relaciones entre decisor y participantes se hacen visibles.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de imparcialidad procedimental en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: relaciones entre decisor y participantes se hacen visibles.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación revelada` / `vínculo pendiente de examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Relaciones entre decisor y participantes se hacen visibles. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1189.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1190 · Imparcialidad procedimental — Mecanismo o relación explicada

**Objetivo:** Descomponer «Imparcialidad procedimental» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Relaciones entre decisor y participantes se hacen visibles.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: relaciones entre decisor y participantes se hacen visibles.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en imparcialidad procedimental.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación revelada` / `vínculo pendiente de examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Relaciones entre decisor y participantes se hacen visibles» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1190.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1191 · Imparcialidad procedimental — Comparación de dos supuestos

**Objetivo:** Comparar «Relación revelada» y «vínculo pendiente de examinar» dentro de imparcialidad procedimental, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Relaciones entre decisor y participantes se hacen visibles.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de imparcialidad procedimental, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Relación revelada» y en B «vínculo pendiente de examinar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «relaciones entre decisor y participantes se hacen visibles» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación revelada` / `vínculo pendiente de examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Relación revelada / vínculo pendiente de examinar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1191.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1192 · Imparcialidad procedimental — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Imparcialidad procedimental» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Relaciones entre decisor y participantes se hacen visibles.

**Composición:** Escena principal de imparcialidad procedimental con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: relaciones entre decisor y participantes se hacen visibles.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Relación revelada» de «vínculo pendiente de examinar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación revelada` / `vínculo pendiente de examinar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para imparcialidad procedimental, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1192.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1193 · Impugnación administrativa — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Impugnación administrativa» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una decisión se conecta con motivos y documentos de una petición.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de impugnación administrativa en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una decisión se conecta con motivos y documentos de una petición.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto cuestionado` / `fundamento de la impugnación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una decisión se conecta con motivos y documentos de una petición. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1193.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1194 · Impugnación administrativa — Mecanismo o relación explicada

**Objetivo:** Descomponer «Impugnación administrativa» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una decisión se conecta con motivos y documentos de una petición.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una decisión se conecta con motivos y documentos de una petición.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en impugnación administrativa.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto cuestionado` / `fundamento de la impugnación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una decisión se conecta con motivos y documentos de una petición» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1194.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1195 · Impugnación administrativa — Comparación de dos supuestos

**Objetivo:** Comparar «Acto cuestionado» y «fundamento de la impugnación» dentro de impugnación administrativa, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una decisión se conecta con motivos y documentos de una petición.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de impugnación administrativa, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acto cuestionado» y en B «fundamento de la impugnación» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una decisión se conecta con motivos y documentos de una petición» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto cuestionado` / `fundamento de la impugnación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acto cuestionado / fundamento de la impugnación debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1195.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1196 · Impugnación administrativa — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Impugnación administrativa» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una decisión se conecta con motivos y documentos de una petición.

**Composición:** Escena principal de impugnación administrativa con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una decisión se conecta con motivos y documentos de una petición.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acto cuestionado» de «fundamento de la impugnación».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto cuestionado` / `fundamento de la impugnación`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para impugnación administrativa, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1196.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1197 · Cumplimiento de resolución revisora — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cumplimiento de resolución revisora» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Instrucciones de una decisión se enlazan con nuevas actuaciones.

**Composición:** Escenario abierto: solicitud como ancla, expediente como interlocutor u objeto secundario y órgano como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cumplimiento de resolución revisora en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: instrucciones de una decisión se enlazan con nuevas actuaciones.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `applications, powers, reasons, grounds, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Instrucción suministrada` / `actuación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Instrucciones de una decisión se enlazan con nuevas actuaciones. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1197.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1198 · Cumplimiento de resolución revisora — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cumplimiento de resolución revisora» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Instrucciones de una decisión se enlazan con nuevas actuaciones.

**Composición:** Composición espacial con solicitud, órgano y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: instrucciones de una decisión se enlazan con nuevas actuaciones.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cumplimiento de resolución revisora.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `applications, powers, reasons, grounds, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Instrucción suministrada` / `actuación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Instrucciones de una decisión se enlazan con nuevas actuaciones» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1198.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1199 · Cumplimiento de resolución revisora — Comparación de dos supuestos

**Objetivo:** Comparar «Instrucción suministrada» y «actuación documentada» dentro de cumplimiento de resolución revisora, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Instrucciones de una decisión se enlazan con nuevas actuaciones.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cumplimiento de resolución revisora, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Instrucción suministrada» y en B «actuación documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «instrucciones de una decisión se enlazan con nuevas actuaciones» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `applications, powers, reasons, grounds, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Instrucción suministrada` / `actuación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Instrucción suministrada / actuación documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1199.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1200 · Cumplimiento de resolución revisora — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cumplimiento de resolución revisora» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Instrucciones de una decisión se enlazan con nuevas actuaciones.

**Composición:** Escena principal de cumplimiento de resolución revisora con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: instrucciones de una decisión se enlazan con nuevas actuaciones.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Instrucción suministrada» de «actuación documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `applications, powers, reasons, grounds, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Instrucción suministrada` / `actuación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cumplimiento de resolución revisora, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/administrative/LAW-1200.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
