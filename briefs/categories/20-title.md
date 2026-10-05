# 20. Propiedad y titularidad

40 animaciones; IDs LAW-0761–LAW-0800. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-0761 · Cadena de titularidad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cadena de titularidad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un bien mantiene su identidad mientras cambian documentos asociados.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cadena de titularidad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un bien mantiene su identidad mientras cambian documentos asociados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cadena completa` / `transmisión no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un bien mantiene su identidad mientras cambian documentos asociados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0761.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0762 · Cadena de titularidad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cadena de titularidad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un bien mantiene su identidad mientras cambian documentos asociados.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un bien mantiene su identidad mientras cambian documentos asociados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cadena de titularidad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cadena completa` / `transmisión no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un bien mantiene su identidad mientras cambian documentos asociados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0762.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0763 · Cadena de titularidad — Comparación de dos supuestos

**Objetivo:** Comparar «Cadena completa» y «transmisión no documentada» dentro de cadena de titularidad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un bien mantiene su identidad mientras cambian documentos asociados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cadena de titularidad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Cadena completa» y en B «transmisión no documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un bien mantiene su identidad mientras cambian documentos asociados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cadena completa` / `transmisión no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Cadena completa / transmisión no documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0763.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0764 · Cadena de titularidad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cadena de titularidad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un bien mantiene su identidad mientras cambian documentos asociados.

**Composición:** Escena principal de cadena de titularidad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un bien mantiene su identidad mientras cambian documentos asociados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Cadena completa» de «transmisión no documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cadena completa` / `transmisión no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cadena de titularidad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0764.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0765 · Posesión y titularidad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Posesión y titularidad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un objeto se conecta por separado con poseedor y titular declarado.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de posesión y titularidad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un objeto se conecta por separado con poseedor y titular declarado.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control físico` / `título documental`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un objeto se conecta por separado con poseedor y titular declarado. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0765.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0766 · Posesión y titularidad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Posesión y titularidad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un objeto se conecta por separado con poseedor y titular declarado.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un objeto se conecta por separado con poseedor y titular declarado.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en posesión y titularidad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control físico` / `título documental`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un objeto se conecta por separado con poseedor y titular declarado» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0766.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0767 · Posesión y titularidad — Comparación de dos supuestos

**Objetivo:** Comparar «Control físico» y «título documental» dentro de posesión y titularidad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un objeto se conecta por separado con poseedor y titular declarado.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de posesión y titularidad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Control físico» y en B «título documental» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un objeto se conecta por separado con poseedor y titular declarado» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control físico` / `título documental`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Control físico / título documental debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0767.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0768 · Posesión y titularidad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Posesión y titularidad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un objeto se conecta por separado con poseedor y titular declarado.

**Composición:** Escena principal de posesión y titularidad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un objeto se conecta por separado con poseedor y titular declarado.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Control físico» de «título documental».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control físico` / `título documental`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para posesión y titularidad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0768.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0769 · Transmisión de bien — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Transmisión de bien» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un bien y su documento recorren rutas paralelas entre partes.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de transmisión de bien en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un bien y su documento recorren rutas paralelas entre partes.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entrega material` / `transmisión jurídica por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un bien y su documento recorren rutas paralelas entre partes. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0769.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0770 · Transmisión de bien — Mecanismo o relación explicada

**Objetivo:** Descomponer «Transmisión de bien» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un bien y su documento recorren rutas paralelas entre partes.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un bien y su documento recorren rutas paralelas entre partes.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en transmisión de bien.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entrega material` / `transmisión jurídica por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un bien y su documento recorren rutas paralelas entre partes» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0770.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0771 · Transmisión de bien — Comparación de dos supuestos

**Objetivo:** Comparar «Entrega material» y «transmisión jurídica por verificar» dentro de transmisión de bien, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un bien y su documento recorren rutas paralelas entre partes.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de transmisión de bien, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Entrega material» y en B «transmisión jurídica por verificar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un bien y su documento recorren rutas paralelas entre partes» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entrega material` / `transmisión jurídica por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Entrega material / transmisión jurídica por verificar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0771.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0772 · Transmisión de bien — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Transmisión de bien» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un bien y su documento recorren rutas paralelas entre partes.

**Composición:** Escena principal de transmisión de bien con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un bien y su documento recorren rutas paralelas entre partes.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Entrega material» de «transmisión jurídica por verificar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entrega material` / `transmisión jurídica por verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para transmisión de bien, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0772.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0773 · Inscripción registral — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Inscripción registral» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un documento se enlaza con una entrada de registro genérico.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de inscripción registral en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un documento se enlaza con una entrada de registro genérico.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato inscrito` / `documentación no registrada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un documento se enlaza con una entrada de registro genérico. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0773.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0774 · Inscripción registral — Mecanismo o relación explicada

**Objetivo:** Descomponer «Inscripción registral» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un documento se enlaza con una entrada de registro genérico.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un documento se enlaza con una entrada de registro genérico.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en inscripción registral.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato inscrito` / `documentación no registrada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un documento se enlaza con una entrada de registro genérico» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0774.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0775 · Inscripción registral — Comparación de dos supuestos

**Objetivo:** Comparar «Dato inscrito» y «documentación no registrada» dentro de inscripción registral, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un documento se enlaza con una entrada de registro genérico.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de inscripción registral, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Dato inscrito» y en B «documentación no registrada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un documento se enlaza con una entrada de registro genérico» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato inscrito` / `documentación no registrada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Dato inscrito / documentación no registrada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0775.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0776 · Inscripción registral — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Inscripción registral» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un documento se enlaza con una entrada de registro genérico.

**Composición:** Escena principal de inscripción registral con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un documento se enlaza con una entrada de registro genérico.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Dato inscrito» de «documentación no registrada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Dato inscrito` / `documentación no registrada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para inscripción registral, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0776.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0777 · Copropiedad — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Copropiedad» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un único bien se conecta con varias participaciones configuradas.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de copropiedad en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un único bien se conecta con varias participaciones configuradas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso compartido` / `participación individual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un único bien se conecta con varias participaciones configuradas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0777.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0778 · Copropiedad — Mecanismo o relación explicada

**Objetivo:** Descomponer «Copropiedad» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un único bien se conecta con varias participaciones configuradas.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un único bien se conecta con varias participaciones configuradas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en copropiedad.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso compartido` / `participación individual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un único bien se conecta con varias participaciones configuradas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0778.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0779 · Copropiedad — Comparación de dos supuestos

**Objetivo:** Comparar «Uso compartido» y «participación individual» dentro de copropiedad, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un único bien se conecta con varias participaciones configuradas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de copropiedad, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Uso compartido» y en B «participación individual» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un único bien se conecta con varias participaciones configuradas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso compartido` / `participación individual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Uso compartido / participación individual debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0779.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0780 · Copropiedad — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Copropiedad» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un único bien se conecta con varias participaciones configuradas.

**Composición:** Escena principal de copropiedad con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un único bien se conecta con varias participaciones configuradas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Uso compartido» de «participación individual».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Uso compartido` / `participación individual`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para copropiedad, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0780.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0781 · Límite de parcela — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Límite de parcela» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Líneas de dos planos se superponen para mostrar diferencias.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de límite de parcela en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: líneas de dos planos se superponen para mostrar diferencias.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Límite de plano A` / `límite de plano B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Líneas de dos planos se superponen para mostrar diferencias. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0781.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0782 · Límite de parcela — Mecanismo o relación explicada

**Objetivo:** Descomponer «Límite de parcela» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Líneas de dos planos se superponen para mostrar diferencias.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: líneas de dos planos se superponen para mostrar diferencias.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en límite de parcela.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Límite de plano A` / `límite de plano B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Líneas de dos planos se superponen para mostrar diferencias» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0782.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0783 · Límite de parcela — Comparación de dos supuestos

**Objetivo:** Comparar «Límite de plano A» y «límite de plano B» dentro de límite de parcela, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Líneas de dos planos se superponen para mostrar diferencias.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de límite de parcela, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Límite de plano A» y en B «límite de plano B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «líneas de dos planos se superponen para mostrar diferencias» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Límite de plano A` / `límite de plano B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Límite de plano A / límite de plano B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0783.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0784 · Límite de parcela — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Límite de parcela» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Líneas de dos planos se superponen para mostrar diferencias.

**Composición:** Escena principal de límite de parcela con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: líneas de dos planos se superponen para mostrar diferencias.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Límite de plano A» de «límite de plano B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Límite de plano A` / `límite de plano B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para límite de parcela, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0784.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0785 · Bien encontrado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Bien encontrado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un objeto hallado se vincula con hallador y posible titular.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de bien encontrado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un objeto hallado se vincula con hallador y posible titular.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hallazgo documentado` / `titularidad sin resolver`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un objeto hallado se vincula con hallador y posible titular. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0785.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0786 · Bien encontrado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Bien encontrado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un objeto hallado se vincula con hallador y posible titular.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un objeto hallado se vincula con hallador y posible titular.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en bien encontrado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hallazgo documentado` / `titularidad sin resolver`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un objeto hallado se vincula con hallador y posible titular» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0786.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0787 · Bien encontrado — Comparación de dos supuestos

**Objetivo:** Comparar «Hallazgo documentado» y «titularidad sin resolver» dentro de bien encontrado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un objeto hallado se vincula con hallador y posible titular.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de bien encontrado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Hallazgo documentado» y en B «titularidad sin resolver» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un objeto hallado se vincula con hallador y posible titular» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hallazgo documentado` / `titularidad sin resolver`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Hallazgo documentado / titularidad sin resolver debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0787.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0788 · Bien encontrado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Bien encontrado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un objeto hallado se vincula con hallador y posible titular.

**Composición:** Escena principal de bien encontrado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un objeto hallado se vincula con hallador y posible titular.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Hallazgo documentado» de «titularidad sin resolver».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hallazgo documentado` / `titularidad sin resolver`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para bien encontrado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0788.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0789 · Bien mezclado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Bien mezclado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un recipiente recibe bienes identificados y conserva sus procedencias.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de bien mezclado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un recipiente recibe bienes identificados y conserva sus procedencias.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bienes separables` / `mezcla descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un recipiente recibe bienes identificados y conserva sus procedencias. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0789.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0790 · Bien mezclado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Bien mezclado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un recipiente recibe bienes identificados y conserva sus procedencias.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un recipiente recibe bienes identificados y conserva sus procedencias.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en bien mezclado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bienes separables` / `mezcla descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un recipiente recibe bienes identificados y conserva sus procedencias» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0790.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0791 · Bien mezclado — Comparación de dos supuestos

**Objetivo:** Comparar «Bienes separables» y «mezcla descrita» dentro de bien mezclado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un recipiente recibe bienes identificados y conserva sus procedencias.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de bien mezclado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Bienes separables» y en B «mezcla descrita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un recipiente recibe bienes identificados y conserva sus procedencias» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bienes separables` / `mezcla descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Bienes separables / mezcla descrita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0791.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0792 · Bien mezclado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Bien mezclado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un recipiente recibe bienes identificados y conserva sus procedencias.

**Composición:** Escena principal de bien mezclado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un recipiente recibe bienes identificados y conserva sus procedencias.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Bienes separables» de «mezcla descrita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Bienes separables` / `mezcla descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para bien mezclado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0792.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0793 · Bien incorporado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Bien incorporado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un objeto se integra visualmente en otro manteniendo una etiqueta.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de bien incorporado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un objeto se integra visualmente en otro manteniendo una etiqueta.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Objeto separado` / `incorporación material`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un objeto se integra visualmente en otro manteniendo una etiqueta. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0793.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0794 · Bien incorporado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Bien incorporado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un objeto se integra visualmente en otro manteniendo una etiqueta.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un objeto se integra visualmente en otro manteniendo una etiqueta.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en bien incorporado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Objeto separado` / `incorporación material`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un objeto se integra visualmente en otro manteniendo una etiqueta» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0794.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0795 · Bien incorporado — Comparación de dos supuestos

**Objetivo:** Comparar «Objeto separado» y «incorporación material» dentro de bien incorporado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un objeto se integra visualmente en otro manteniendo una etiqueta.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de bien incorporado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Objeto separado» y en B «incorporación material» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un objeto se integra visualmente en otro manteniendo una etiqueta» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Objeto separado` / `incorporación material`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Objeto separado / incorporación material debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0795.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0796 · Bien incorporado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Bien incorporado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un objeto se integra visualmente en otro manteniendo una etiqueta.

**Composición:** Escena principal de bien incorporado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un objeto se integra visualmente en otro manteniendo una etiqueta.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Objeto separado» de «incorporación material».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Objeto separado` / `incorporación material`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para bien incorporado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0796.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0797 · Prioridad de intereses — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Prioridad de intereses» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varios intereses se ordenan solo según la prioridad suministrada.

**Composición:** Escenario abierto: bien como ancla, título como interlocutor u objeto secundario y registro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de prioridad de intereses en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varios intereses se ordenan solo según la prioridad suministrada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `assets, owners, documents, interests, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Orden aportado` / `prioridad controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varios intereses se ordenan solo según la prioridad suministrada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0797.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0798 · Prioridad de intereses — Mecanismo o relación explicada

**Objetivo:** Descomponer «Prioridad de intereses» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varios intereses se ordenan solo según la prioridad suministrada.

**Composición:** Composición espacial con bien, registro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varios intereses se ordenan solo según la prioridad suministrada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en prioridad de intereses.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `assets, owners, documents, interests, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Orden aportado` / `prioridad controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varios intereses se ordenan solo según la prioridad suministrada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0798.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0799 · Prioridad de intereses — Comparación de dos supuestos

**Objetivo:** Comparar «Orden aportado» y «prioridad controvertida» dentro de prioridad de intereses, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varios intereses se ordenan solo según la prioridad suministrada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de prioridad de intereses, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Orden aportado» y en B «prioridad controvertida» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varios intereses se ordenan solo según la prioridad suministrada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `assets, owners, documents, interests, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Orden aportado` / `prioridad controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Orden aportado / prioridad controvertida debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0799.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0800 · Prioridad de intereses — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Prioridad de intereses» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varios intereses se ordenan solo según la prioridad suministrada.

**Composición:** Escena principal de prioridad de intereses con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varios intereses se ordenan solo según la prioridad suministrada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Orden aportado» de «prioridad controvertida».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `assets, owners, documents, interests, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Orden aportado` / `prioridad controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para prioridad de intereses, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión.

**Archivo a implementar:** `src/animations/title/LAW-0800.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
