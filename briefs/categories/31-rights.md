# 31. Estructuras de análisis de derechos

40 animaciones; IDs LAW-1201–LAW-1240. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1201 · Derecho y ámbito protegido — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Derecho y ámbito protegido» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un contorno delimita intereses descritos por una fuente aportada.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de derecho y ámbito protegido en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un contorno delimita intereses descritos por una fuente aportada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés incluido según datos` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un contorno delimita intereses descritos por una fuente aportada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1201.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1202 · Derecho y ámbito protegido — Mecanismo o relación explicada

**Objetivo:** Descomponer «Derecho y ámbito protegido» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un contorno delimita intereses descritos por una fuente aportada.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un contorno delimita intereses descritos por una fuente aportada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en derecho y ámbito protegido.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés incluido según datos` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un contorno delimita intereses descritos por una fuente aportada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1202.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1203 · Derecho y ámbito protegido — Comparación de dos supuestos

**Objetivo:** Comparar «Interés incluido según datos» y «alcance discutido» dentro de derecho y ámbito protegido, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un contorno delimita intereses descritos por una fuente aportada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de derecho y ámbito protegido, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Interés incluido según datos» y en B «alcance discutido» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un contorno delimita intereses descritos por una fuente aportada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés incluido según datos` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Interés incluido según datos / alcance discutido debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1203.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1204 · Derecho y ámbito protegido — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Derecho y ámbito protegido» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un contorno delimita intereses descritos por una fuente aportada.

**Composición:** Escena principal de derecho y ámbito protegido con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un contorno delimita intereses descritos por una fuente aportada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Interés incluido según datos» de «alcance discutido».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés incluido según datos` / `alcance discutido`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para derecho y ámbito protegido, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1204.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1205 · Interferencia alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Interferencia alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una actuación cruza el ámbito que el supuesto identifica.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de interferencia alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una actuación cruza el ámbito que el supuesto identifica.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ejercicio descrito` / `interferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una actuación cruza el ámbito que el supuesto identifica. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1205.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1206 · Interferencia alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Interferencia alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una actuación cruza el ámbito que el supuesto identifica.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una actuación cruza el ámbito que el supuesto identifica.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en interferencia alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ejercicio descrito` / `interferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una actuación cruza el ámbito que el supuesto identifica» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1206.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1207 · Interferencia alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Ejercicio descrito» y «interferencia alegada» dentro de interferencia alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una actuación cruza el ámbito que el supuesto identifica.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de interferencia alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Ejercicio descrito» y en B «interferencia alegada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una actuación cruza el ámbito que el supuesto identifica» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ejercicio descrito` / `interferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Ejercicio descrito / interferencia alegada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1207.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1208 · Interferencia alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Interferencia alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una actuación cruza el ámbito que el supuesto identifica.

**Composición:** Escena principal de interferencia alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una actuación cruza el ámbito que el supuesto identifica.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Ejercicio descrito» de «interferencia alegada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Ejercicio descrito` / `interferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para interferencia alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1208.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1209 · Base jurídica de una actuación — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Base jurídica de una actuación» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una medida conecta con la disposición invocada.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de base jurídica de una actuación en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una medida conecta con la disposición invocada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Base identificada` / `base pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una medida conecta con la disposición invocada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1209.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1210 · Base jurídica de una actuación — Mecanismo o relación explicada

**Objetivo:** Descomponer «Base jurídica de una actuación» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una medida conecta con la disposición invocada.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una medida conecta con la disposición invocada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en base jurídica de una actuación.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Base identificada` / `base pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una medida conecta con la disposición invocada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1210.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1211 · Base jurídica de una actuación — Comparación de dos supuestos

**Objetivo:** Comparar «Base identificada» y «base pendiente de verificar» dentro de base jurídica de una actuación, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una medida conecta con la disposición invocada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de base jurídica de una actuación, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Base identificada» y en B «base pendiente de verificar» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una medida conecta con la disposición invocada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Base identificada` / `base pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Base identificada / base pendiente de verificar debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1211.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1212 · Base jurídica de una actuación — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Base jurídica de una actuación» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una medida conecta con la disposición invocada.

**Composición:** Escena principal de base jurídica de una actuación con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una medida conecta con la disposición invocada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Base identificada» de «base pendiente de verificar».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Base identificada` / `base pendiente de verificar`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para base jurídica de una actuación, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1212.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1213 · Finalidad declarada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Finalidad declarada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una medida se enlaza con la finalidad que declara su autor.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de finalidad declarada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una medida se enlaza con la finalidad que declara su autor.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Finalidad declarada` / `efecto observado aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una medida se enlaza con la finalidad que declara su autor. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1213.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1214 · Finalidad declarada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Finalidad declarada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una medida se enlaza con la finalidad que declara su autor.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una medida se enlaza con la finalidad que declara su autor.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en finalidad declarada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Finalidad declarada` / `efecto observado aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una medida se enlaza con la finalidad que declara su autor» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1214.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1215 · Finalidad declarada — Comparación de dos supuestos

**Objetivo:** Comparar «Finalidad declarada» y «efecto observado aportado» dentro de finalidad declarada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una medida se enlaza con la finalidad que declara su autor.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de finalidad declarada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Finalidad declarada» y en B «efecto observado aportado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una medida se enlaza con la finalidad que declara su autor» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Finalidad declarada` / `efecto observado aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Finalidad declarada / efecto observado aportado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1215.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1216 · Finalidad declarada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Finalidad declarada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una medida se enlaza con la finalidad que declara su autor.

**Composición:** Escena principal de finalidad declarada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una medida se enlaza con la finalidad que declara su autor.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Finalidad declarada» de «efecto observado aportado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Finalidad declarada` / `efecto observado aportado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para finalidad declarada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1216.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1217 · Idoneidad como cuestión — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Idoneidad como cuestión» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una medida y su objetivo se conectan mediante evidencia suministrada.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de idoneidad como cuestión en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una medida y su objetivo se conectan mediante evidencia suministrada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación apoyada` / `cuestión abierta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una medida y su objetivo se conectan mediante evidencia suministrada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1217.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1218 · Idoneidad como cuestión — Mecanismo o relación explicada

**Objetivo:** Descomponer «Idoneidad como cuestión» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una medida y su objetivo se conectan mediante evidencia suministrada.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una medida y su objetivo se conectan mediante evidencia suministrada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en idoneidad como cuestión.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación apoyada` / `cuestión abierta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una medida y su objetivo se conectan mediante evidencia suministrada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1218.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1219 · Idoneidad como cuestión — Comparación de dos supuestos

**Objetivo:** Comparar «Relación apoyada» y «cuestión abierta» dentro de idoneidad como cuestión, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una medida y su objetivo se conectan mediante evidencia suministrada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de idoneidad como cuestión, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Relación apoyada» y en B «cuestión abierta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una medida y su objetivo se conectan mediante evidencia suministrada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación apoyada` / `cuestión abierta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Relación apoyada / cuestión abierta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1219.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1220 · Idoneidad como cuestión — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Idoneidad como cuestión» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una medida y su objetivo se conectan mediante evidencia suministrada.

**Composición:** Escena principal de idoneidad como cuestión con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una medida y su objetivo se conectan mediante evidencia suministrada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Relación apoyada» de «cuestión abierta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Relación apoyada` / `cuestión abierta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para idoneidad como cuestión, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1220.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1221 · Alternativas de actuación — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Alternativas de actuación» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varias medidas se muestran con efectos documentados sin clasificarlas.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de alternativas de actuación en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varias medidas se muestran con efectos documentados sin clasificarlas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Alternativa A` / `alternativa B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varias medidas se muestran con efectos documentados sin clasificarlas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1221.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1222 · Alternativas de actuación — Mecanismo o relación explicada

**Objetivo:** Descomponer «Alternativas de actuación» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varias medidas se muestran con efectos documentados sin clasificarlas.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varias medidas se muestran con efectos documentados sin clasificarlas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en alternativas de actuación.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Alternativa A` / `alternativa B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varias medidas se muestran con efectos documentados sin clasificarlas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1222.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1223 · Alternativas de actuación — Comparación de dos supuestos

**Objetivo:** Comparar «Alternativa A» y «alternativa B» dentro de alternativas de actuación, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varias medidas se muestran con efectos documentados sin clasificarlas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de alternativas de actuación, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Alternativa A» y en B «alternativa B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varias medidas se muestran con efectos documentados sin clasificarlas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Alternativa A` / `alternativa B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Alternativa A / alternativa B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1223.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1224 · Alternativas de actuación — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Alternativas de actuación» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varias medidas se muestran con efectos documentados sin clasificarlas.

**Composición:** Escena principal de alternativas de actuación con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varias medidas se muestran con efectos documentados sin clasificarlas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Alternativa A» de «alternativa B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Alternativa A` / `alternativa B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para alternativas de actuación, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1224.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1225 · Equilibrio de intereses — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Equilibrio de intereses» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos grupos de intereses se presentan sin inclinar una balanza como veredicto.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de equilibrio de intereses en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos grupos de intereses se presentan sin inclinar una balanza como veredicto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés de A` / `interés de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos grupos de intereses se presentan sin inclinar una balanza como veredicto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1225.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1226 · Equilibrio de intereses — Mecanismo o relación explicada

**Objetivo:** Descomponer «Equilibrio de intereses» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos grupos de intereses se presentan sin inclinar una balanza como veredicto.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos grupos de intereses se presentan sin inclinar una balanza como veredicto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en equilibrio de intereses.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés de A` / `interés de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos grupos de intereses se presentan sin inclinar una balanza como veredicto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1226.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1227 · Equilibrio de intereses — Comparación de dos supuestos

**Objetivo:** Comparar «Interés de A» y «interés de B» dentro de equilibrio de intereses, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos grupos de intereses se presentan sin inclinar una balanza como veredicto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de equilibrio de intereses, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Interés de A» y en B «interés de B» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos grupos de intereses se presentan sin inclinar una balanza como veredicto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés de A` / `interés de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Interés de A / interés de B debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1227.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1228 · Equilibrio de intereses — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Equilibrio de intereses» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos grupos de intereses se presentan sin inclinar una balanza como veredicto.

**Composición:** Escena principal de equilibrio de intereses con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos grupos de intereses se presentan sin inclinar una balanza como veredicto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Interés de A» de «interés de B».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés de A` / `interés de B`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para equilibrio de intereses, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1228.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1229 · Trato diferenciado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Trato diferenciado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos situaciones se alinean resaltando el criterio de distinción.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de trato diferenciado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos situaciones se alinean resaltando el criterio de distinción.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situaciones comparadas` / `diferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos situaciones se alinean resaltando el criterio de distinción. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1229.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1230 · Trato diferenciado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Trato diferenciado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos situaciones se alinean resaltando el criterio de distinción.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos situaciones se alinean resaltando el criterio de distinción.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en trato diferenciado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situaciones comparadas` / `diferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos situaciones se alinean resaltando el criterio de distinción» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1230.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1231 · Trato diferenciado — Comparación de dos supuestos

**Objetivo:** Comparar «Situaciones comparadas» y «diferencia alegada» dentro de trato diferenciado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos situaciones se alinean resaltando el criterio de distinción.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de trato diferenciado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Situaciones comparadas» y en B «diferencia alegada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos situaciones se alinean resaltando el criterio de distinción» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situaciones comparadas` / `diferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Situaciones comparadas / diferencia alegada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1231.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1232 · Trato diferenciado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Trato diferenciado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos situaciones se alinean resaltando el criterio de distinción.

**Composición:** Escena principal de trato diferenciado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos situaciones se alinean resaltando el criterio de distinción.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Situaciones comparadas» de «diferencia alegada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situaciones comparadas` / `diferencia alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para trato diferenciado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1232.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1233 · Ajuste de accesibilidad solicitado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Ajuste de accesibilidad solicitado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una barrera se conecta con una adaptación propuesta.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de ajuste de accesibilidad solicitado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una barrera se conecta con una adaptación propuesta.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entorno actual` / `adaptación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una barrera se conecta con una adaptación propuesta. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1233.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1234 · Ajuste de accesibilidad solicitado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Ajuste de accesibilidad solicitado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una barrera se conecta con una adaptación propuesta.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una barrera se conecta con una adaptación propuesta.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en ajuste de accesibilidad solicitado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entorno actual` / `adaptación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una barrera se conecta con una adaptación propuesta» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1234.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1235 · Ajuste de accesibilidad solicitado — Comparación de dos supuestos

**Objetivo:** Comparar «Entorno actual» y «adaptación descrita» dentro de ajuste de accesibilidad solicitado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una barrera se conecta con una adaptación propuesta.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de ajuste de accesibilidad solicitado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Entorno actual» y en B «adaptación descrita» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una barrera se conecta con una adaptación propuesta» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entorno actual` / `adaptación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Entorno actual / adaptación descrita debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1235.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1236 · Ajuste de accesibilidad solicitado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Ajuste de accesibilidad solicitado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una barrera se conecta con una adaptación propuesta.

**Composición:** Escena principal de ajuste de accesibilidad solicitado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una barrera se conecta con una adaptación propuesta.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Entorno actual» de «adaptación descrita».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Entorno actual` / `adaptación descrita`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para ajuste de accesibilidad solicitado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1236.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1237 · Obligación positiva alegada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Obligación positiva alegada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una omisión se conecta con la medida que se solicita.

**Composición:** Escenario abierto: persona abstracta como ancla, ámbito como interlocutor u objeto secundario y razones como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de obligación positiva alegada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una omisión se conecta con la medida que se solicita.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `rights, interferences, aims, alternatives, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situación descrita` / `actuación pedida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una omisión se conecta con la medida que se solicita. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1237.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1238 · Obligación positiva alegada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Obligación positiva alegada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una omisión se conecta con la medida que se solicita.

**Composición:** Composición espacial con persona abstracta, razones y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una omisión se conecta con la medida que se solicita.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en obligación positiva alegada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `rights, interferences, aims, alternatives, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situación descrita` / `actuación pedida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una omisión se conecta con la medida que se solicita» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1238.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1239 · Obligación positiva alegada — Comparación de dos supuestos

**Objetivo:** Comparar «Situación descrita» y «actuación pedida» dentro de obligación positiva alegada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una omisión se conecta con la medida que se solicita.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de obligación positiva alegada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Situación descrita» y en B «actuación pedida» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una omisión se conecta con la medida que se solicita» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `rights, interferences, aims, alternatives, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situación descrita` / `actuación pedida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Situación descrita / actuación pedida debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1239.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1240 · Obligación positiva alegada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Obligación positiva alegada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una omisión se conecta con la medida que se solicita.

**Composición:** Escena principal de obligación positiva alegada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una omisión se conecta con la medida que se solicita.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Situación descrita» de «actuación pedida».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `rights, interferences, aims, alternatives, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Situación descrita` / `actuación pedida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para obligación positiva alegada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/rights/LAW-1240.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
