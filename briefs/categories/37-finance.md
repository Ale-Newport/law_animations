# 37. Financiación y garantías

40 animaciones; IDs LAW-1441–LAW-1480. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1441 · Préstamo y devolución — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Préstamo y devolución» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un desembolso se separa de las cuotas configuradas de devolución.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de préstamo y devolución en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un desembolso se separa de las cuotas configuradas de devolución.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Desembolso realizado` / `pagos pendientes`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un desembolso se separa de las cuotas configuradas de devolución. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1441.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1442 · Préstamo y devolución — Mecanismo o relación explicada

**Objetivo:** Descomponer «Préstamo y devolución» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un desembolso se separa de las cuotas configuradas de devolución.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un desembolso se separa de las cuotas configuradas de devolución.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en préstamo y devolución.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Desembolso realizado` / `pagos pendientes`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un desembolso se separa de las cuotas configuradas de devolución» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1442.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1443 · Préstamo y devolución — Comparación de dos supuestos

**Objetivo:** Comparar «Desembolso realizado» y «pagos pendientes» dentro de préstamo y devolución, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un desembolso se separa de las cuotas configuradas de devolución.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de préstamo y devolución, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Desembolso realizado» y en B «pagos pendientes» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un desembolso se separa de las cuotas configuradas de devolución» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Desembolso realizado` / `pagos pendientes`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Desembolso realizado / pagos pendientes debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1443.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1444 · Préstamo y devolución — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Préstamo y devolución» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un desembolso se separa de las cuotas configuradas de devolución.

**Composición:** Escena principal de préstamo y devolución con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un desembolso se separa de las cuotas configuradas de devolución.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Desembolso realizado» de «pagos pendientes».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Desembolso realizado` / `pagos pendientes`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para préstamo y devolución, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1444.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1445 · Interés ilustrativo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Interés ilustrativo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Principal y coste se muestran separados usando datos hipotéticos etiquetados.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de interés ilustrativo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: principal y coste se muestran separados usando datos hipotéticos etiquetados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Capital entregado` / `coste aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Principal y coste se muestran separados usando datos hipotéticos etiquetados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1445.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1446 · Interés ilustrativo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Interés ilustrativo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Principal y coste se muestran separados usando datos hipotéticos etiquetados.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: principal y coste se muestran separados usando datos hipotéticos etiquetados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en interés ilustrativo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Capital entregado` / `coste aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Principal y coste se muestran separados usando datos hipotéticos etiquetados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1446.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1447 · Interés ilustrativo — Comparación de dos supuestos

**Objetivo:** Comparar «Capital entregado» y «coste aportado» dentro de interés ilustrativo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Principal y coste se muestran separados usando datos hipotéticos etiquetados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de interés ilustrativo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Capital entregado» y en B «coste aportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «principal y coste se muestran separados usando datos hipotéticos etiquetados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Capital entregado` / `coste aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Capital entregado / coste aportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1447.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1448 · Interés ilustrativo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Interés ilustrativo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Principal y coste se muestran separados usando datos hipotéticos etiquetados.

**Composición:** Escena principal de interés ilustrativo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: principal y coste se muestran separados usando datos hipotéticos etiquetados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Capital entregado» de «coste aportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Capital entregado` / `coste aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para interés ilustrativo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1448.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1449 · Garantía sobre activo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Garantía sobre activo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un activo se conecta con una obligación sin mover su posesión por defecto.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de garantía sobre activo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un activo se conecta con una obligación sin mover su posesión por defecto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bien identificado` / `obligación garantizada declarada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un activo se conecta con una obligación sin mover su posesión por defecto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1449.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1450 · Garantía sobre activo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Garantía sobre activo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un activo se conecta con una obligación sin mover su posesión por defecto.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un activo se conecta con una obligación sin mover su posesión por defecto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en garantía sobre activo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bien identificado` / `obligación garantizada declarada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un activo se conecta con una obligación sin mover su posesión por defecto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1450.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1451 · Garantía sobre activo — Comparación de dos supuestos

**Objetivo:** Comparar «Bien identificado» y «obligación garantizada declarada» dentro de garantía sobre activo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un activo se conecta con una obligación sin mover su posesión por defecto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de garantía sobre activo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Bien identificado» y en B «obligación garantizada declarada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un activo se conecta con una obligación sin mover su posesión por defecto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bien identificado` / `obligación garantizada declarada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Bien identificado / obligación garantizada declarada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1451.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1452 · Garantía sobre activo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Garantía sobre activo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un activo se conecta con una obligación sin mover su posesión por defecto.

**Composición:** Escena principal de garantía sobre activo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un activo se conecta con una obligación sin mover su posesión por defecto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Bien identificado» de «obligación garantizada declarada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bien identificado` / `obligación garantizada declarada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para garantía sobre activo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1452.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1453 · Garantía personal — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Garantía personal» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una tercera persona se conecta a una promesa de garantía.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de garantía personal en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una tercera persona se conecta a una promesa de garantía.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Deudor principal` / `garante según documento`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una tercera persona se conecta a una promesa de garantía. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1453.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1454 · Garantía personal — Mecanismo o relación explicada

**Objetivo:** Descomponer «Garantía personal» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una tercera persona se conecta a una promesa de garantía.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una tercera persona se conecta a una promesa de garantía.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en garantía personal.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Deudor principal` / `garante según documento`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una tercera persona se conecta a una promesa de garantía» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1454.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1455 · Garantía personal — Comparación de dos supuestos

**Objetivo:** Comparar «Deudor principal» y «garante según documento» dentro de garantía personal, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una tercera persona se conecta a una promesa de garantía.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de garantía personal, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Deudor principal» y en B «garante según documento» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una tercera persona se conecta a una promesa de garantía» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Deudor principal` / `garante según documento`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Deudor principal / garante según documento debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1455.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1456 · Garantía personal — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Garantía personal» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una tercera persona se conecta a una promesa de garantía.

**Composición:** Escena principal de garantía personal con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una tercera persona se conecta a una promesa de garantía.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Deudor principal» de «garante según documento».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Deudor principal` / `garante según documento`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para garantía personal, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1456.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1457 · Rango de garantías — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Rango de garantías» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varias garantías se ordenan solo con prioridad suministrada.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de rango de garantías en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varias garantías se ordenan solo con prioridad suministrada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prioridad aportada` / `rango por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varias garantías se ordenan solo con prioridad suministrada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1457.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1458 · Rango de garantías — Mecanismo o relación explicada

**Objetivo:** Descomponer «Rango de garantías» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varias garantías se ordenan solo con prioridad suministrada.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varias garantías se ordenan solo con prioridad suministrada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en rango de garantías.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prioridad aportada` / `rango por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varias garantías se ordenan solo con prioridad suministrada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1458.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1459 · Rango de garantías — Comparación de dos supuestos

**Objetivo:** Comparar «Prioridad aportada» y «rango por verificar» dentro de rango de garantías, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varias garantías se ordenan solo con prioridad suministrada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de rango de garantías, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Prioridad aportada» y en B «rango por verificar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varias garantías se ordenan solo con prioridad suministrada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prioridad aportada` / `rango por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Prioridad aportada / rango por verificar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1459.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1460 · Rango de garantías — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Rango de garantías» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varias garantías se ordenan solo con prioridad suministrada.

**Composición:** Escena principal de rango de garantías con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varias garantías se ordenan solo con prioridad suministrada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Prioridad aportada» de «rango por verificar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Prioridad aportada` / `rango por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para rango de garantías, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1460.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1461 · Cesión de crédito — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cesión de crédito» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un crédito cambia de titular dejando visible al deudor.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cesión de crédito en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un crédito cambia de titular dejando visible al deudor.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acreedor anterior` / `acreedor notificado según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un crédito cambia de titular dejando visible al deudor. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1461.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1462 · Cesión de crédito — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cesión de crédito» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un crédito cambia de titular dejando visible al deudor.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un crédito cambia de titular dejando visible al deudor.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cesión de crédito.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acreedor anterior` / `acreedor notificado según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un crédito cambia de titular dejando visible al deudor» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1462.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1463 · Cesión de crédito — Comparación de dos supuestos

**Objetivo:** Comparar «Acreedor anterior» y «acreedor notificado según datos» dentro de cesión de crédito, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un crédito cambia de titular dejando visible al deudor.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cesión de crédito, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acreedor anterior» y en B «acreedor notificado según datos» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un crédito cambia de titular dejando visible al deudor» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acreedor anterior` / `acreedor notificado según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acreedor anterior / acreedor notificado según datos debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1463.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1464 · Cesión de crédito — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cesión de crédito» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un crédito cambia de titular dejando visible al deudor.

**Composición:** Escena principal de cesión de crédito con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un crédito cambia de titular dejando visible al deudor.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acreedor anterior» de «acreedor notificado según datos».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acreedor anterior` / `acreedor notificado según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cesión de crédito, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1464.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1465 · Compensación alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Compensación alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos flujos opuestos se comparan sin extinguirlos automáticamente.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de compensación alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos flujos opuestos se comparan sin extinguirlos automáticamente.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Crédito de A` / `crédito de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos flujos opuestos se comparan sin extinguirlos automáticamente. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1465.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1466 · Compensación alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Compensación alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos flujos opuestos se comparan sin extinguirlos automáticamente.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos flujos opuestos se comparan sin extinguirlos automáticamente.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en compensación alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Crédito de A` / `crédito de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos flujos opuestos se comparan sin extinguirlos automáticamente» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1466.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1467 · Compensación alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Crédito de A» y «crédito de B» dentro de compensación alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos flujos opuestos se comparan sin extinguirlos automáticamente.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de compensación alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Crédito de A» y en B «crédito de B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos flujos opuestos se comparan sin extinguirlos automáticamente» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Crédito de A` / `crédito de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Crédito de A / crédito de B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1467.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1468 · Compensación alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Compensación alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos flujos opuestos se comparan sin extinguirlos automáticamente.

**Composición:** Escena principal de compensación alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos flujos opuestos se comparan sin extinguirlos automáticamente.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Crédito de A» de «crédito de B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Crédito de A` / `crédito de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para compensación alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1468.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1469 · Condición financiera pactada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Condición financiera pactada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un indicador cruza una referencia contractual editable.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de condición financiera pactada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un indicador cruza una referencia contractual editable.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato reportado` / `condición pactada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un indicador cruza una referencia contractual editable. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1469.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1470 · Condición financiera pactada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Condición financiera pactada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un indicador cruza una referencia contractual editable.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un indicador cruza una referencia contractual editable.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en condición financiera pactada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato reportado` / `condición pactada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un indicador cruza una referencia contractual editable» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1470.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1471 · Condición financiera pactada — Comparación de dos supuestos

**Objetivo:** Comparar «Dato reportado» y «condición pactada» dentro de condición financiera pactada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un indicador cruza una referencia contractual editable.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de condición financiera pactada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Dato reportado» y en B «condición pactada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un indicador cruza una referencia contractual editable» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato reportado` / `condición pactada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Dato reportado / condición pactada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1471.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1472 · Condición financiera pactada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Condición financiera pactada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un indicador cruza una referencia contractual editable.

**Composición:** Escena principal de condición financiera pactada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un indicador cruza una referencia contractual editable.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Dato reportado» de «condición pactada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato reportado` / `condición pactada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para condición financiera pactada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1472.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1473 · Ejecución de garantía solicitada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ejecución de garantía solicitada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una reclamación se vincula con activo y procedimiento aportados.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ejecución de garantía solicitada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una reclamación se vincula con activo y procedimiento aportados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía constituida según datos` / `ejecución solicitada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una reclamación se vincula con activo y procedimiento aportados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1473.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1474 · Ejecución de garantía solicitada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ejecución de garantía solicitada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una reclamación se vincula con activo y procedimiento aportados.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una reclamación se vincula con activo y procedimiento aportados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ejecución de garantía solicitada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía constituida según datos` / `ejecución solicitada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una reclamación se vincula con activo y procedimiento aportados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1474.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1475 · Ejecución de garantía solicitada — Comparación de dos supuestos

**Objetivo:** Comparar «Garantía constituida según datos» y «ejecución solicitada» dentro de ejecución de garantía solicitada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una reclamación se vincula con activo y procedimiento aportados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ejecución de garantía solicitada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Garantía constituida según datos» y en B «ejecución solicitada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una reclamación se vincula con activo y procedimiento aportados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía constituida según datos` / `ejecución solicitada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Garantía constituida según datos / ejecución solicitada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1475.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1476 · Ejecución de garantía solicitada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ejecución de garantía solicitada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una reclamación se vincula con activo y procedimiento aportados.

**Composición:** Escena principal de ejecución de garantía solicitada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una reclamación se vincula con activo y procedimiento aportados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Garantía constituida según datos» de «ejecución solicitada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía constituida según datos` / `ejecución solicitada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ejecución de garantía solicitada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1476.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1477 · Liberación de garantía — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Liberación de garantía» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un vínculo se retira únicamente tras un documento suministrado.

**Composición:** Escenario abierto: prestamista como ancla, activo como interlocutor u objeto secundario y pagos como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de liberación de garantía en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un vínculo se retira únicamente tras un documento suministrado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `principal, schedules, collateral, parties, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía registrada` / `liberación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un vínculo se retira únicamente tras un documento suministrado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1477.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1478 · Liberación de garantía — Mecanismo o relación explicada

**Objetivo:** Descomponer «Liberación de garantía» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un vínculo se retira únicamente tras un documento suministrado.

**Composición:** Composición espacial con prestamista, pagos y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un vínculo se retira únicamente tras un documento suministrado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en liberación de garantía.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `principal, schedules, collateral, parties, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía registrada` / `liberación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un vínculo se retira únicamente tras un documento suministrado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1478.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1479 · Liberación de garantía — Comparación de dos supuestos

**Objetivo:** Comparar «Garantía registrada» y «liberación documentada» dentro de liberación de garantía, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un vínculo se retira únicamente tras un documento suministrado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de liberación de garantía, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Garantía registrada» y en B «liberación documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un vínculo se retira únicamente tras un documento suministrado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `principal, schedules, collateral, parties, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía registrada` / `liberación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Garantía registrada / liberación documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1479.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1480 · Liberación de garantía — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Liberación de garantía» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un vínculo se retira únicamente tras un documento suministrado.

**Composición:** Escena principal de liberación de garantía con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un vínculo se retira únicamente tras un documento suministrado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Garantía registrada» de «liberación documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `principal, schedules, collateral, parties, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Garantía registrada` / `liberación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para liberación de garantía, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/finance/LAW-1480.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
