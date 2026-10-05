# 46. Entorno, actividades y permisos

40 animaciones; IDs LAW-1801–LAW-1840. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1801 · Solicitud de permiso de actividad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Solicitud de permiso de actividad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un proyecto conecta planos e informes con una petición.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de solicitud de permiso de actividad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un proyecto conecta planos e informes con una petición.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto presentado` / `permiso documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un proyecto conecta planos e informes con una petición. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1801.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1802 · Solicitud de permiso de actividad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Solicitud de permiso de actividad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un proyecto conecta planos e informes con una petición.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un proyecto conecta planos e informes con una petición.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en solicitud de permiso de actividad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto presentado` / `permiso documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un proyecto conecta planos e informes con una petición» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1802.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1803 · Solicitud de permiso de actividad — Comparación de dos supuestos

**Objetivo:** Comparar «Proyecto presentado» y «permiso documentado» dentro de solicitud de permiso de actividad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un proyecto conecta planos e informes con una petición.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de solicitud de permiso de actividad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Proyecto presentado» y en B «permiso documentado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un proyecto conecta planos e informes con una petición» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto presentado` / `permiso documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Proyecto presentado / permiso documentado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1803.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1804 · Solicitud de permiso de actividad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Solicitud de permiso de actividad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un proyecto conecta planos e informes con una petición.

**Composición:** Escena principal de solicitud de permiso de actividad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un proyecto conecta planos e informes con una petición.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Proyecto presentado» de «permiso documentado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Proyecto presentado` / `permiso documentado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para solicitud de permiso de actividad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1804.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1805 · Condiciones de autorización — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Condiciones de autorización» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una instalación despliega condiciones suministradas.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de condiciones de autorización en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una instalación despliega condiciones suministradas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Condición declarada` / `cumplimiento por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una instalación despliega condiciones suministradas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1805.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1806 · Condiciones de autorización — Mecanismo o relación explicada

**Objetivo:** Descomponer «Condiciones de autorización» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una instalación despliega condiciones suministradas.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una instalación despliega condiciones suministradas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en condiciones de autorización.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Condición declarada` / `cumplimiento por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una instalación despliega condiciones suministradas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1806.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1807 · Condiciones de autorización — Comparación de dos supuestos

**Objetivo:** Comparar «Condición declarada» y «cumplimiento por comprobar» dentro de condiciones de autorización, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una instalación despliega condiciones suministradas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de condiciones de autorización, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Condición declarada» y en B «cumplimiento por comprobar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una instalación despliega condiciones suministradas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Condición declarada` / `cumplimiento por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Condición declarada / cumplimiento por comprobar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1807.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1808 · Condiciones de autorización — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Condiciones de autorización» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una instalación despliega condiciones suministradas.

**Composición:** Escena principal de condiciones de autorización con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una instalación despliega condiciones suministradas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Condición declarada» de «cumplimiento por comprobar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Condición declarada` / `cumplimiento por comprobar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para condiciones de autorización, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1808.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1809 · Medición ambiental — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Medición ambiental» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Sensores ficticios generan registros asociados a lugar y hora.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de medición ambiental en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: sensores ficticios generan registros asociados a lugar y hora.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Medición observada` / `referencia aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Sensores ficticios generan registros asociados a lugar y hora. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1809.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1810 · Medición ambiental — Mecanismo o relación explicada

**Objetivo:** Descomponer «Medición ambiental» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Sensores ficticios generan registros asociados a lugar y hora.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: sensores ficticios generan registros asociados a lugar y hora.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en medición ambiental.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Medición observada` / `referencia aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Sensores ficticios generan registros asociados a lugar y hora» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1810.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1811 · Medición ambiental — Comparación de dos supuestos

**Objetivo:** Comparar «Medición observada» y «referencia aportada» dentro de medición ambiental, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Sensores ficticios generan registros asociados a lugar y hora.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de medición ambiental, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Medición observada» y en B «referencia aportada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «sensores ficticios generan registros asociados a lugar y hora» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Medición observada` / `referencia aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Medición observada / referencia aportada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1811.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1812 · Medición ambiental — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Medición ambiental» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Sensores ficticios generan registros asociados a lugar y hora.

**Composición:** Escena principal de medición ambiental con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: sensores ficticios generan registros asociados a lugar y hora.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Medición observada» de «referencia aportada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Medición observada` / `referencia aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para medición ambiental, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1812.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1813 · Evaluación de impactos — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Evaluación de impactos» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Actividades se conectan con efectos documentados sin puntuar políticas.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de evaluación de impactos en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: actividades se conectan con efectos documentados sin puntuar políticas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Efecto A aportado` / `efecto B aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Actividades se conectan con efectos documentados sin puntuar políticas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1813.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1814 · Evaluación de impactos — Mecanismo o relación explicada

**Objetivo:** Descomponer «Evaluación de impactos» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Actividades se conectan con efectos documentados sin puntuar políticas.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: actividades se conectan con efectos documentados sin puntuar políticas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en evaluación de impactos.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Efecto A aportado` / `efecto B aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Actividades se conectan con efectos documentados sin puntuar políticas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1814.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1815 · Evaluación de impactos — Comparación de dos supuestos

**Objetivo:** Comparar «Efecto A aportado» y «efecto B aportado» dentro de evaluación de impactos, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Actividades se conectan con efectos documentados sin puntuar políticas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de evaluación de impactos, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Efecto A aportado» y en B «efecto B aportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «actividades se conectan con efectos documentados sin puntuar políticas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Efecto A aportado` / `efecto B aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Efecto A aportado / efecto B aportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1815.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1816 · Evaluación de impactos — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Evaluación de impactos» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Actividades se conectan con efectos documentados sin puntuar políticas.

**Composición:** Escena principal de evaluación de impactos con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: actividades se conectan con efectos documentados sin puntuar políticas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Efecto A aportado» de «efecto B aportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Efecto A aportado` / `efecto B aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para evaluación de impactos, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1816.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1817 · Alternativas de proyecto — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Alternativas de proyecto» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos diseños se comparan por rasgos expresamente suministrados.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de alternativas de proyecto en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos diseños se comparan por rasgos expresamente suministrados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Diseño A` / `diseño B sin ganador`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos diseños se comparan por rasgos expresamente suministrados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1817.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1818 · Alternativas de proyecto — Mecanismo o relación explicada

**Objetivo:** Descomponer «Alternativas de proyecto» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos diseños se comparan por rasgos expresamente suministrados.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos diseños se comparan por rasgos expresamente suministrados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en alternativas de proyecto.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Diseño A` / `diseño B sin ganador`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos diseños se comparan por rasgos expresamente suministrados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1818.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1819 · Alternativas de proyecto — Comparación de dos supuestos

**Objetivo:** Comparar «Diseño A» y «diseño B sin ganador» dentro de alternativas de proyecto, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos diseños se comparan por rasgos expresamente suministrados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de alternativas de proyecto, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Diseño A» y en B «diseño B sin ganador» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos diseños se comparan por rasgos expresamente suministrados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Diseño A` / `diseño B sin ganador`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Diseño A / diseño B sin ganador debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1819.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1820 · Alternativas de proyecto — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Alternativas de proyecto» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos diseños se comparan por rasgos expresamente suministrados.

**Composición:** Escena principal de alternativas de proyecto con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos diseños se comparan por rasgos expresamente suministrados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Diseño A» de «diseño B sin ganador».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Diseño A` / `diseño B sin ganador`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para alternativas de proyecto, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1820.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1821 · Alegaciones sobre un proyecto — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Alegaciones sobre un proyecto» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Comentarios se vinculan con apartados del expediente.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de alegaciones sobre un proyecto en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: comentarios se vinculan con apartados del expediente.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Observación presentada` / `respuesta documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Comentarios se vinculan con apartados del expediente. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1821.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1822 · Alegaciones sobre un proyecto — Mecanismo o relación explicada

**Objetivo:** Descomponer «Alegaciones sobre un proyecto» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Comentarios se vinculan con apartados del expediente.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: comentarios se vinculan con apartados del expediente.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en alegaciones sobre un proyecto.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Observación presentada` / `respuesta documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Comentarios se vinculan con apartados del expediente» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1822.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1823 · Alegaciones sobre un proyecto — Comparación de dos supuestos

**Objetivo:** Comparar «Observación presentada» y «respuesta documentada» dentro de alegaciones sobre un proyecto, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Comentarios se vinculan con apartados del expediente.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de alegaciones sobre un proyecto, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Observación presentada» y en B «respuesta documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «comentarios se vinculan con apartados del expediente» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Observación presentada` / `respuesta documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Observación presentada / respuesta documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1823.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1824 · Alegaciones sobre un proyecto — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Alegaciones sobre un proyecto» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Comentarios se vinculan con apartados del expediente.

**Composición:** Escena principal de alegaciones sobre un proyecto con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: comentarios se vinculan con apartados del expediente.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Observación presentada» de «respuesta documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Observación presentada` / `respuesta documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para alegaciones sobre un proyecto, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1824.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1825 · Uso planificado del suelo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Uso planificado del suelo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Zonas geométricas muestran usos según un plano suministrado.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de uso planificado del suelo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: zonas geométricas muestran usos según un plano suministrado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso descrito` / `cambio solicitado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Zonas geométricas muestran usos según un plano suministrado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1825.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1826 · Uso planificado del suelo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Uso planificado del suelo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Zonas geométricas muestran usos según un plano suministrado.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: zonas geométricas muestran usos según un plano suministrado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en uso planificado del suelo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso descrito` / `cambio solicitado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Zonas geométricas muestran usos según un plano suministrado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1826.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1827 · Uso planificado del suelo — Comparación de dos supuestos

**Objetivo:** Comparar «Uso descrito» y «cambio solicitado» dentro de uso planificado del suelo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Zonas geométricas muestran usos según un plano suministrado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de uso planificado del suelo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Uso descrito» y en B «cambio solicitado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «zonas geométricas muestran usos según un plano suministrado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso descrito` / `cambio solicitado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Uso descrito / cambio solicitado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1827.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1828 · Uso planificado del suelo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Uso planificado del suelo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Zonas geométricas muestran usos según un plano suministrado.

**Composición:** Escena principal de uso planificado del suelo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: zonas geométricas muestran usos según un plano suministrado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Uso descrito» de «cambio solicitado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso descrito` / `cambio solicitado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para uso planificado del suelo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1828.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1829 · Incidencia de vertido abstracta — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Incidencia de vertido abstracta» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un flujo esquemático señala origen, trayecto y observaciones.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de incidencia de vertido abstracta en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un flujo esquemático señala origen, trayecto y observaciones.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Flujo contenido` / `incidente reportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un flujo esquemático señala origen, trayecto y observaciones. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1829.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1830 · Incidencia de vertido abstracta — Mecanismo o relación explicada

**Objetivo:** Descomponer «Incidencia de vertido abstracta» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un flujo esquemático señala origen, trayecto y observaciones.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un flujo esquemático señala origen, trayecto y observaciones.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en incidencia de vertido abstracta.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Flujo contenido` / `incidente reportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un flujo esquemático señala origen, trayecto y observaciones» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1830.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1831 · Incidencia de vertido abstracta — Comparación de dos supuestos

**Objetivo:** Comparar «Flujo contenido» y «incidente reportado» dentro de incidencia de vertido abstracta, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un flujo esquemático señala origen, trayecto y observaciones.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de incidencia de vertido abstracta, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Flujo contenido» y en B «incidente reportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un flujo esquemático señala origen, trayecto y observaciones» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Flujo contenido` / `incidente reportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Flujo contenido / incidente reportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1831.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1832 · Incidencia de vertido abstracta — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Incidencia de vertido abstracta» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un flujo esquemático señala origen, trayecto y observaciones.

**Composición:** Escena principal de incidencia de vertido abstracta con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un flujo esquemático señala origen, trayecto y observaciones.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Flujo contenido» de «incidente reportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Flujo contenido` / `incidente reportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para incidencia de vertido abstracta, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1832.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1833 · Restauración de espacio — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Restauración de espacio» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un área se transforma siguiendo medidas de un plan aportado.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de restauración de espacio en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un área se transforma siguiendo medidas de un plan aportado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estado documentado` / `objetivo de restauración`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un área se transforma siguiendo medidas de un plan aportado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1833.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1834 · Restauración de espacio — Mecanismo o relación explicada

**Objetivo:** Descomponer «Restauración de espacio» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un área se transforma siguiendo medidas de un plan aportado.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un área se transforma siguiendo medidas de un plan aportado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en restauración de espacio.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estado documentado` / `objetivo de restauración`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un área se transforma siguiendo medidas de un plan aportado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1834.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1835 · Restauración de espacio — Comparación de dos supuestos

**Objetivo:** Comparar «Estado documentado» y «objetivo de restauración» dentro de restauración de espacio, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un área se transforma siguiendo medidas de un plan aportado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de restauración de espacio, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Estado documentado» y en B «objetivo de restauración» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un área se transforma siguiendo medidas de un plan aportado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estado documentado` / `objetivo de restauración`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Estado documentado / objetivo de restauración debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1835.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1836 · Restauración de espacio — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Restauración de espacio» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un área se transforma siguiendo medidas de un plan aportado.

**Composición:** Escena principal de restauración de espacio con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un área se transforma siguiendo medidas de un plan aportado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Estado documentado» de «objetivo de restauración».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Estado documentado` / `objetivo de restauración`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para restauración de espacio, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1836.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1837 · Seguimiento de autorización — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Seguimiento de autorización» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Registros periódicos conectan condiciones y comprobaciones.

**Composición:** Escenario abierto: instalación como ancla, terreno como interlocutor u objeto secundario y informe como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de seguimiento de autorización en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: registros periódicos conectan condiciones y comprobaciones.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `activities, permits, observations, conditions, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control realizado` / `control pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Registros periódicos conectan condiciones y comprobaciones. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1837.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1838 · Seguimiento de autorización — Mecanismo o relación explicada

**Objetivo:** Descomponer «Seguimiento de autorización» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Registros periódicos conectan condiciones y comprobaciones.

**Composición:** Composición espacial con instalación, informe y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: registros periódicos conectan condiciones y comprobaciones.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en seguimiento de autorización.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `activities, permits, observations, conditions, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control realizado` / `control pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Registros periódicos conectan condiciones y comprobaciones» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1838.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1839 · Seguimiento de autorización — Comparación de dos supuestos

**Objetivo:** Comparar «Control realizado» y «control pendiente» dentro de seguimiento de autorización, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Registros periódicos conectan condiciones y comprobaciones.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de seguimiento de autorización, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Control realizado» y en B «control pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «registros periódicos conectan condiciones y comprobaciones» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `activities, permits, observations, conditions, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control realizado` / `control pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Control realizado / control pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1839.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1840 · Seguimiento de autorización — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Seguimiento de autorización» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Registros periódicos conectan condiciones y comprobaciones.

**Composición:** Escena principal de seguimiento de autorización con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: registros periódicos conectan condiciones y comprobaciones.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Control realizado» de «control pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `activities, permits, observations, conditions, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control realizado` / `control pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para seguimiento de autorización, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/environment/LAW-1840.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
