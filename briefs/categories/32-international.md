# 32. Relaciones jurídicas internacionales

40 animaciones; IDs LAW-1241–LAW-1280. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-1241 · Negociación de tratado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Negociación de tratado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Entidades abstractas intercambian versiones de un instrumento.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de negociación de tratado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: entidades abstractas intercambian versiones de un instrumento.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Borrador inicial` / `texto acordado suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Entidades abstractas intercambian versiones de un instrumento. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1241.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1242 · Negociación de tratado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Negociación de tratado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Entidades abstractas intercambian versiones de un instrumento.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: entidades abstractas intercambian versiones de un instrumento.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en negociación de tratado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Borrador inicial` / `texto acordado suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Entidades abstractas intercambian versiones de un instrumento» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1242.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1243 · Negociación de tratado — Comparación de dos supuestos

**Objetivo:** Comparar «Borrador inicial» y «texto acordado suministrado» dentro de negociación de tratado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Entidades abstractas intercambian versiones de un instrumento.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de negociación de tratado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Borrador inicial» y en B «texto acordado suministrado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «entidades abstractas intercambian versiones de un instrumento» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Borrador inicial` / `texto acordado suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Borrador inicial / texto acordado suministrado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1243.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1244 · Negociación de tratado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Negociación de tratado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Entidades abstractas intercambian versiones de un instrumento.

**Composición:** Escena principal de negociación de tratado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: entidades abstractas intercambian versiones de un instrumento.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Borrador inicial» de «texto acordado suministrado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Borrador inicial` / `texto acordado suministrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para negociación de tratado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1244.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1245 · Firma y ratificación — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Firma y ratificación» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos actos distintos se representan en carriles separados.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de firma y ratificación en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos actos distintos se representan en carriles separados.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Firma documentada` / `ratificación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos actos distintos se representan en carriles separados. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1245.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1246 · Firma y ratificación — Mecanismo o relación explicada

**Objetivo:** Descomponer «Firma y ratificación» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos actos distintos se representan en carriles separados.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos actos distintos se representan en carriles separados.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en firma y ratificación.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Firma documentada` / `ratificación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos actos distintos se representan en carriles separados» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1246.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1247 · Firma y ratificación — Comparación de dos supuestos

**Objetivo:** Comparar «Firma documentada» y «ratificación documentada» dentro de firma y ratificación, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos actos distintos se representan en carriles separados.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de firma y ratificación, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Firma documentada» y en B «ratificación documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos actos distintos se representan en carriles separados» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Firma documentada` / `ratificación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Firma documentada / ratificación documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1247.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1248 · Firma y ratificación — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Firma y ratificación» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos actos distintos se representan en carriles separados.

**Composición:** Escena principal de firma y ratificación con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos actos distintos se representan en carriles separados.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Firma documentada» de «ratificación documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Firma documentada` / `ratificación documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para firma y ratificación, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1248.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1249 · Reserva declarada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Reserva declarada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una entidad adjunta una nota a un apartado del instrumento.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de reserva declarada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una entidad adjunta una nota a un apartado del instrumento.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Obligación general descrita` / `reserva aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una entidad adjunta una nota a un apartado del instrumento. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1249.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1250 · Reserva declarada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Reserva declarada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una entidad adjunta una nota a un apartado del instrumento.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una entidad adjunta una nota a un apartado del instrumento.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en reserva declarada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Obligación general descrita` / `reserva aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una entidad adjunta una nota a un apartado del instrumento» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1250.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1251 · Reserva declarada — Comparación de dos supuestos

**Objetivo:** Comparar «Obligación general descrita» y «reserva aportada» dentro de reserva declarada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una entidad adjunta una nota a un apartado del instrumento.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de reserva declarada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Obligación general descrita» y en B «reserva aportada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una entidad adjunta una nota a un apartado del instrumento» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Obligación general descrita` / `reserva aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Obligación general descrita / reserva aportada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1251.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1252 · Reserva declarada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Reserva declarada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una entidad adjunta una nota a un apartado del instrumento.

**Composición:** Escena principal de reserva declarada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una entidad adjunta una nota a un apartado del instrumento.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Obligación general descrita» de «reserva aportada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Obligación general descrita` / `reserva aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para reserva declarada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1252.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1253 · Entrada en vigor pactada — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Entrada en vigor pactada» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Hitos suministrados activan una franja temporal del instrumento.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de entrada en vigor pactada en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: hitos suministrados activan una franja temporal del instrumento.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hito pendiente` / `condición cumplida según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Hitos suministrados activan una franja temporal del instrumento. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1253.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1254 · Entrada en vigor pactada — Mecanismo o relación explicada

**Objetivo:** Descomponer «Entrada en vigor pactada» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Hitos suministrados activan una franja temporal del instrumento.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: hitos suministrados activan una franja temporal del instrumento.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en entrada en vigor pactada.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hito pendiente` / `condición cumplida según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Hitos suministrados activan una franja temporal del instrumento» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1254.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1255 · Entrada en vigor pactada — Comparación de dos supuestos

**Objetivo:** Comparar «Hito pendiente» y «condición cumplida según datos» dentro de entrada en vigor pactada, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Hitos suministrados activan una franja temporal del instrumento.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de entrada en vigor pactada, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Hito pendiente» y en B «condición cumplida según datos» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «hitos suministrados activan una franja temporal del instrumento» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hito pendiente` / `condición cumplida según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Hito pendiente / condición cumplida según datos debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1255.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1256 · Entrada en vigor pactada — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Entrada en vigor pactada» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Hitos suministrados activan una franja temporal del instrumento.

**Composición:** Escena principal de entrada en vigor pactada con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: hitos suministrados activan una franja temporal del instrumento.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Hito pendiente» de «condición cumplida según datos».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Hito pendiente` / `condición cumplida según datos`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para entrada en vigor pactada, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1256.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1257 · Incumplimiento internacional alegado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Incumplimiento internacional alegado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un compromiso se compara con una conducta documentada.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de incumplimiento internacional alegado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un compromiso se compara con una conducta documentada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromiso invocado` / `actuación alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un compromiso se compara con una conducta documentada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1257.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1258 · Incumplimiento internacional alegado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Incumplimiento internacional alegado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un compromiso se compara con una conducta documentada.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un compromiso se compara con una conducta documentada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en incumplimiento internacional alegado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromiso invocado` / `actuación alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un compromiso se compara con una conducta documentada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1258.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1259 · Incumplimiento internacional alegado — Comparación de dos supuestos

**Objetivo:** Comparar «Compromiso invocado» y «actuación alegada» dentro de incumplimiento internacional alegado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un compromiso se compara con una conducta documentada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de incumplimiento internacional alegado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Compromiso invocado» y en B «actuación alegada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un compromiso se compara con una conducta documentada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromiso invocado` / `actuación alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Compromiso invocado / actuación alegada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1259.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1260 · Incumplimiento internacional alegado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Incumplimiento internacional alegado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un compromiso se compara con una conducta documentada.

**Composición:** Escena principal de incumplimiento internacional alegado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un compromiso se compara con una conducta documentada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Compromiso invocado» de «actuación alegada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Compromiso invocado` / `actuación alegada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para incumplimiento internacional alegado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1260.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1261 · Atribución de conducta — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Atribución de conducta» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un acto se conecta con una entidad mediante vínculos por analizar.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de atribución de conducta en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un acto se conecta con una entidad mediante vínculos por analizar.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto observado` / `atribución propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un acto se conecta con una entidad mediante vínculos por analizar. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1261.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1262 · Atribución de conducta — Mecanismo o relación explicada

**Objetivo:** Descomponer «Atribución de conducta» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un acto se conecta con una entidad mediante vínculos por analizar.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un acto se conecta con una entidad mediante vínculos por analizar.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en atribución de conducta.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto observado` / `atribución propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un acto se conecta con una entidad mediante vínculos por analizar» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1262.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1263 · Atribución de conducta — Comparación de dos supuestos

**Objetivo:** Comparar «Acto observado» y «atribución propuesta» dentro de atribución de conducta, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un acto se conecta con una entidad mediante vínculos por analizar.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de atribución de conducta, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acto observado» y en B «atribución propuesta» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un acto se conecta con una entidad mediante vínculos por analizar» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto observado` / `atribución propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acto observado / atribución propuesta debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1263.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1264 · Atribución de conducta — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Atribución de conducta» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un acto se conecta con una entidad mediante vínculos por analizar.

**Composición:** Escena principal de atribución de conducta con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un acto se conecta con una entidad mediante vínculos por analizar.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acto observado» de «atribución propuesta».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto observado` / `atribución propuesta`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para atribución de conducta, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1264.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1265 · Foro de controversia — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Foro de controversia» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una controversia se dirige hacia un foro según base aportada.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de foro de controversia en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una controversia se dirige hacia un foro según base aportada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Foro propuesto` / `competencia no verificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una controversia se dirige hacia un foro según base aportada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1265.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1266 · Foro de controversia — Mecanismo o relación explicada

**Objetivo:** Descomponer «Foro de controversia» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una controversia se dirige hacia un foro según base aportada.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una controversia se dirige hacia un foro según base aportada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en foro de controversia.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Foro propuesto` / `competencia no verificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una controversia se dirige hacia un foro según base aportada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1266.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1267 · Foro de controversia — Comparación de dos supuestos

**Objetivo:** Comparar «Foro propuesto» y «competencia no verificada» dentro de foro de controversia, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una controversia se dirige hacia un foro según base aportada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de foro de controversia, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Foro propuesto» y en B «competencia no verificada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una controversia se dirige hacia un foro según base aportada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Foro propuesto` / `competencia no verificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Foro propuesto / competencia no verificada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1267.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1268 · Foro de controversia — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Foro de controversia» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una controversia se dirige hacia un foro según base aportada.

**Composición:** Escena principal de foro de controversia con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una controversia se dirige hacia un foro según base aportada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Foro propuesto» de «competencia no verificada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Foro propuesto` / `competencia no verificada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para foro de controversia, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1268.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1269 · Inmunidad como cuestión — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Inmunidad como cuestión» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un sujeto y una pretensión se separan mediante una etiqueta de análisis.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de inmunidad como cuestión en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un sujeto y una pretensión se separan mediante una etiqueta de análisis.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pretensión formulada` / `inmunidad invocada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un sujeto y una pretensión se separan mediante una etiqueta de análisis. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1269.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1270 · Inmunidad como cuestión — Mecanismo o relación explicada

**Objetivo:** Descomponer «Inmunidad como cuestión» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un sujeto y una pretensión se separan mediante una etiqueta de análisis.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un sujeto y una pretensión se separan mediante una etiqueta de análisis.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en inmunidad como cuestión.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pretensión formulada` / `inmunidad invocada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un sujeto y una pretensión se separan mediante una etiqueta de análisis» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1270.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1271 · Inmunidad como cuestión — Comparación de dos supuestos

**Objetivo:** Comparar «Pretensión formulada» y «inmunidad invocada» dentro de inmunidad como cuestión, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un sujeto y una pretensión se separan mediante una etiqueta de análisis.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de inmunidad como cuestión, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Pretensión formulada» y en B «inmunidad invocada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un sujeto y una pretensión se separan mediante una etiqueta de análisis» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pretensión formulada` / `inmunidad invocada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Pretensión formulada / inmunidad invocada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1271.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1272 · Inmunidad como cuestión — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Inmunidad como cuestión» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un sujeto y una pretensión se separan mediante una etiqueta de análisis.

**Composición:** Escena principal de inmunidad como cuestión con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un sujeto y una pretensión se separan mediante una etiqueta de análisis.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Pretensión formulada» de «inmunidad invocada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Pretensión formulada` / `inmunidad invocada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para inmunidad como cuestión, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1272.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1273 · Reconocimiento entre entidades — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Reconocimiento entre entidades» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos entidades se conectan con actos documentados de reconocimiento.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de reconocimiento entre entidades en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos entidades se conectan con actos documentados de reconocimiento.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto aportado` / `relación no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos entidades se conectan con actos documentados de reconocimiento. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1273.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1274 · Reconocimiento entre entidades — Mecanismo o relación explicada

**Objetivo:** Descomponer «Reconocimiento entre entidades» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos entidades se conectan con actos documentados de reconocimiento.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos entidades se conectan con actos documentados de reconocimiento.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en reconocimiento entre entidades.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto aportado` / `relación no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos entidades se conectan con actos documentados de reconocimiento» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1274.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1275 · Reconocimiento entre entidades — Comparación de dos supuestos

**Objetivo:** Comparar «Acto aportado» y «relación no documentada» dentro de reconocimiento entre entidades, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos entidades se conectan con actos documentados de reconocimiento.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de reconocimiento entre entidades, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Acto aportado» y en B «relación no documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos entidades se conectan con actos documentados de reconocimiento» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto aportado` / `relación no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Acto aportado / relación no documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1275.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1276 · Reconocimiento entre entidades — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Reconocimiento entre entidades» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos entidades se conectan con actos documentados de reconocimiento.

**Composición:** Escena principal de reconocimiento entre entidades con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos entidades se conectan con actos documentados de reconocimiento.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Acto aportado» de «relación no documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Acto aportado` / `relación no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para reconocimiento entre entidades, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1276.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-1277 · Cumplimiento de compromiso — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Cumplimiento de compromiso» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Informes y actuaciones se alinean con obligaciones suministradas.

**Composición:** Escenario abierto: Estados abstractos como ancla, tratado como interlocutor u objeto secundario y foro como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de cumplimiento de compromiso en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: informes y actuaciones se alinean con obligaciones suministradas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `entities, instruments, commitments, forums, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cumplimiento reportado` / `cuestión controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Informes y actuaciones se alinean con obligaciones suministradas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1277.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-1278 · Cumplimiento de compromiso — Mecanismo o relación explicada

**Objetivo:** Descomponer «Cumplimiento de compromiso» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Informes y actuaciones se alinean con obligaciones suministradas.

**Composición:** Composición espacial con Estados abstractos, foro y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: informes y actuaciones se alinean con obligaciones suministradas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en cumplimiento de compromiso.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `entities, instruments, commitments, forums, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cumplimiento reportado` / `cuestión controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Informes y actuaciones se alinean con obligaciones suministradas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1278.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-1279 · Cumplimiento de compromiso — Comparación de dos supuestos

**Objetivo:** Comparar «Cumplimiento reportado» y «cuestión controvertida» dentro de cumplimiento de compromiso, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Informes y actuaciones se alinean con obligaciones suministradas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de cumplimiento de compromiso, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Cumplimiento reportado» y en B «cuestión controvertida» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «informes y actuaciones se alinean con obligaciones suministradas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `entities, instruments, commitments, forums, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cumplimiento reportado` / `cuestión controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Cumplimiento reportado / cuestión controvertida debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1279.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-1280 · Cumplimiento de compromiso — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Cumplimiento de compromiso» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Informes y actuaciones se alinean con obligaciones suministradas.

**Composición:** Escena principal de cumplimiento de compromiso con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: informes y actuaciones se alinean con obligaciones suministradas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Cumplimiento reportado» de «cuestión controvertida».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `entities, instruments, commitments, forums, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Cumplimiento reportado` / `cuestión controvertida`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para cumplimiento de compromiso, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Mantener instituciones y medidas abstractas; atribuir posiciones y finalidades a sus fuentes; no recomendar, puntuar ni declarar ganadora ninguna opción política.

**Archivo a implementar:** `src/animations/international/LAW-1280.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
