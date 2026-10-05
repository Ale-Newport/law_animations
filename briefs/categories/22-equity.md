# 22. Trusts y estructuras fiduciarias

40 animaciones; IDs LAW-0841–LAW-0880. Diez motivos, cuatro composiciones distintas por motivo. Estado inicial: planned.

Las descripciones son encargos visuales, no reglas jurídicas. Aplicar docs/LEGAL_CONTENT_POLICY.md y docs/RUNTIME_CONTRACT.md.
## LAW-0841 · Roles de un trust — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Roles de un trust» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de roles de un trust en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control de gestión` / `beneficio identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0841.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0842 · Roles de un trust — Mecanismo o relación explicada

**Objetivo:** Descomponer «Roles de un trust» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en roles de un trust.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control de gestión` / `beneficio identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0842.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0843 · Roles de un trust — Comparación de dos supuestos

**Objetivo:** Comparar «Control de gestión» y «beneficio identificado» dentro de roles de un trust, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de roles de un trust, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Control de gestión» y en B «beneficio identificado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control de gestión` / `beneficio identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Control de gestión / beneficio identificado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0843.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0844 · Roles de un trust — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Roles de un trust» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.

**Composición:** Escena principal de roles de un trust con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un patrimonio conecta con tres funciones etiquetadas sin equivalencia universal.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Control de gestión» de «beneficio identificado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Control de gestión` / `beneficio identificado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para roles de un trust, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0844.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0845 · Separación patrimonial — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Separación patrimonial» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Dos conjuntos de activos se delimitan sin mezclarse visualmente.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de separación patrimonial en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: dos conjuntos de activos se delimitan sin mezclarse visualmente.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio propio` / `patrimonio administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Dos conjuntos de activos se delimitan sin mezclarse visualmente. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0845.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0846 · Separación patrimonial — Mecanismo o relación explicada

**Objetivo:** Descomponer «Separación patrimonial» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Dos conjuntos de activos se delimitan sin mezclarse visualmente.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: dos conjuntos de activos se delimitan sin mezclarse visualmente.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en separación patrimonial.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio propio` / `patrimonio administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Dos conjuntos de activos se delimitan sin mezclarse visualmente» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0846.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0847 · Separación patrimonial — Comparación de dos supuestos

**Objetivo:** Comparar «Patrimonio propio» y «patrimonio administrado» dentro de separación patrimonial, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Dos conjuntos de activos se delimitan sin mezclarse visualmente.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de separación patrimonial, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Patrimonio propio» y en B «patrimonio administrado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «dos conjuntos de activos se delimitan sin mezclarse visualmente» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio propio` / `patrimonio administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Patrimonio propio / patrimonio administrado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0847.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0848 · Separación patrimonial — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Separación patrimonial» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Dos conjuntos de activos se delimitan sin mezclarse visualmente.

**Composición:** Escena principal de separación patrimonial con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: dos conjuntos de activos se delimitan sin mezclarse visualmente.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Patrimonio propio» de «patrimonio administrado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Patrimonio propio` / `patrimonio administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para separación patrimonial, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0848.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0849 · Transferencia al patrimonio — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Transferencia al patrimonio» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un activo entra en un conjunto bajo instrucciones aportadas.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de transferencia al patrimonio en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un activo entra en un conjunto bajo instrucciones aportadas.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Activo transferido` / `intención no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un activo entra en un conjunto bajo instrucciones aportadas. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0849.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0850 · Transferencia al patrimonio — Mecanismo o relación explicada

**Objetivo:** Descomponer «Transferencia al patrimonio» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un activo entra en un conjunto bajo instrucciones aportadas.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un activo entra en un conjunto bajo instrucciones aportadas.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en transferencia al patrimonio.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Activo transferido` / `intención no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un activo entra en un conjunto bajo instrucciones aportadas» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0850.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0851 · Transferencia al patrimonio — Comparación de dos supuestos

**Objetivo:** Comparar «Activo transferido» y «intención no documentada» dentro de transferencia al patrimonio, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un activo entra en un conjunto bajo instrucciones aportadas.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de transferencia al patrimonio, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Activo transferido» y en B «intención no documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un activo entra en un conjunto bajo instrucciones aportadas» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Activo transferido` / `intención no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Activo transferido / intención no documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0851.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0852 · Transferencia al patrimonio — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Transferencia al patrimonio» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un activo entra en un conjunto bajo instrucciones aportadas.

**Composición:** Escena principal de transferencia al patrimonio con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un activo entra en un conjunto bajo instrucciones aportadas.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Activo transferido» de «intención no documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Activo transferido` / `intención no documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para transferencia al patrimonio, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0852.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0853 · Distribución a beneficiario — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Distribución a beneficiario» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un activo sale siguiendo una instrucción explícita del ejemplo.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de distribución a beneficiario en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un activo sale siguiendo una instrucción explícita del ejemplo.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Distribución indicada` / `decisión pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un activo sale siguiendo una instrucción explícita del ejemplo. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0853.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0854 · Distribución a beneficiario — Mecanismo o relación explicada

**Objetivo:** Descomponer «Distribución a beneficiario» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un activo sale siguiendo una instrucción explícita del ejemplo.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un activo sale siguiendo una instrucción explícita del ejemplo.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en distribución a beneficiario.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Distribución indicada` / `decisión pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un activo sale siguiendo una instrucción explícita del ejemplo» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0854.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0855 · Distribución a beneficiario — Comparación de dos supuestos

**Objetivo:** Comparar «Distribución indicada» y «decisión pendiente» dentro de distribución a beneficiario, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un activo sale siguiendo una instrucción explícita del ejemplo.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de distribución a beneficiario, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Distribución indicada» y en B «decisión pendiente» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un activo sale siguiendo una instrucción explícita del ejemplo» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Distribución indicada` / `decisión pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Distribución indicada / decisión pendiente debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0855.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0856 · Distribución a beneficiario — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Distribución a beneficiario» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un activo sale siguiendo una instrucción explícita del ejemplo.

**Composición:** Escena principal de distribución a beneficiario con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un activo sale siguiendo una instrucción explícita del ejemplo.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Distribución indicada» de «decisión pendiente».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Distribución indicada` / `decisión pendiente`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para distribución a beneficiario, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0856.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0857 · Facultad discrecional — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Facultad discrecional» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Varias rutas permanecen abiertas hasta recibir una elección suministrada.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de facultad discrecional en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: varias rutas permanecen abiertas hasta recibir una elección suministrada.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Facultad disponible` / `elección documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Varias rutas permanecen abiertas hasta recibir una elección suministrada. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0857.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0858 · Facultad discrecional — Mecanismo o relación explicada

**Objetivo:** Descomponer «Facultad discrecional» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Varias rutas permanecen abiertas hasta recibir una elección suministrada.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: varias rutas permanecen abiertas hasta recibir una elección suministrada.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en facultad discrecional.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Facultad disponible` / `elección documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Varias rutas permanecen abiertas hasta recibir una elección suministrada» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0858.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0859 · Facultad discrecional — Comparación de dos supuestos

**Objetivo:** Comparar «Facultad disponible» y «elección documentada» dentro de facultad discrecional, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Varias rutas permanecen abiertas hasta recibir una elección suministrada.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de facultad discrecional, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Facultad disponible» y en B «elección documentada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «varias rutas permanecen abiertas hasta recibir una elección suministrada» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Facultad disponible` / `elección documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Facultad disponible / elección documentada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0859.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0860 · Facultad discrecional — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Facultad discrecional» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Varias rutas permanecen abiertas hasta recibir una elección suministrada.

**Composición:** Escena principal de facultad discrecional con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: varias rutas permanecen abiertas hasta recibir una elección suministrada.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Facultad disponible» de «elección documentada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Facultad disponible` / `elección documentada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para facultad discrecional, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0860.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0861 · Deber fiduciario ilustrativo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Deber fiduciario ilustrativo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un gestor conecta una actuación con un deber descrito en el supuesto.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de deber fiduciario ilustrativo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un gestor conecta una actuación con un deber descrito en el supuesto.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación explicada` / `conflicto alegado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un gestor conecta una actuación con un deber descrito en el supuesto. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0861.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0862 · Deber fiduciario ilustrativo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Deber fiduciario ilustrativo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un gestor conecta una actuación con un deber descrito en el supuesto.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un gestor conecta una actuación con un deber descrito en el supuesto.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en deber fiduciario ilustrativo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación explicada` / `conflicto alegado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un gestor conecta una actuación con un deber descrito en el supuesto» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0862.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0863 · Deber fiduciario ilustrativo — Comparación de dos supuestos

**Objetivo:** Comparar «Actuación explicada» y «conflicto alegado» dentro de deber fiduciario ilustrativo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un gestor conecta una actuación con un deber descrito en el supuesto.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de deber fiduciario ilustrativo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Actuación explicada» y en B «conflicto alegado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un gestor conecta una actuación con un deber descrito en el supuesto» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación explicada` / `conflicto alegado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Actuación explicada / conflicto alegado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0863.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0864 · Deber fiduciario ilustrativo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Deber fiduciario ilustrativo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un gestor conecta una actuación con un deber descrito en el supuesto.

**Composición:** Escena principal de deber fiduciario ilustrativo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un gestor conecta una actuación con un deber descrito en el supuesto.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Actuación explicada» de «conflicto alegado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Actuación explicada` / `conflicto alegado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para deber fiduciario ilustrativo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0864.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0865 · Conflicto de intereses fiduciario — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Conflicto de intereses fiduciario» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un gestor se conecta a dos intereses que deben distinguirse.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de conflicto de intereses fiduciario en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un gestor se conecta a dos intereses que deben distinguirse.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés propio` / `interés administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un gestor se conecta a dos intereses que deben distinguirse. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0865.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0866 · Conflicto de intereses fiduciario — Mecanismo o relación explicada

**Objetivo:** Descomponer «Conflicto de intereses fiduciario» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un gestor se conecta a dos intereses que deben distinguirse.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un gestor se conecta a dos intereses que deben distinguirse.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en conflicto de intereses fiduciario.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés propio` / `interés administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un gestor se conecta a dos intereses que deben distinguirse» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0866.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0867 · Conflicto de intereses fiduciario — Comparación de dos supuestos

**Objetivo:** Comparar «Interés propio» y «interés administrado» dentro de conflicto de intereses fiduciario, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un gestor se conecta a dos intereses que deben distinguirse.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de conflicto de intereses fiduciario, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Interés propio» y en B «interés administrado» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un gestor se conecta a dos intereses que deben distinguirse» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés propio` / `interés administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Interés propio / interés administrado debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0867.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0868 · Conflicto de intereses fiduciario — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Conflicto de intereses fiduciario» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un gestor se conecta a dos intereses que deben distinguirse.

**Composición:** Escena principal de conflicto de intereses fiduciario con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un gestor se conecta a dos intereses que deben distinguirse.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Interés propio» de «interés administrado».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Interés propio` / `interés administrado`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para conflicto de intereses fiduciario, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0868.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0869 · Rastreo de activo — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Rastreo de activo» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Un activo cambia de forma manteniendo etiquetas de procedencia.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de rastreo de activo en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: un activo cambia de forma manteniendo etiquetas de procedencia.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Transformación trazable` / `ruta documental rota`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Un activo cambia de forma manteniendo etiquetas de procedencia. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0869.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0870 · Rastreo de activo — Mecanismo o relación explicada

**Objetivo:** Descomponer «Rastreo de activo» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Un activo cambia de forma manteniendo etiquetas de procedencia.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: un activo cambia de forma manteniendo etiquetas de procedencia.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en rastreo de activo.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Transformación trazable` / `ruta documental rota`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Un activo cambia de forma manteniendo etiquetas de procedencia» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0870.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0871 · Rastreo de activo — Comparación de dos supuestos

**Objetivo:** Comparar «Transformación trazable» y «ruta documental rota» dentro de rastreo de activo, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Un activo cambia de forma manteniendo etiquetas de procedencia.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de rastreo de activo, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Transformación trazable» y en B «ruta documental rota» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «un activo cambia de forma manteniendo etiquetas de procedencia» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Transformación trazable` / `ruta documental rota`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Transformación trazable / ruta documental rota debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0871.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0872 · Rastreo de activo — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Rastreo de activo» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Un activo cambia de forma manteniendo etiquetas de procedencia.

**Composición:** Escena principal de rastreo de activo con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: un activo cambia de forma manteniendo etiquetas de procedencia.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Transformación trazable» de «ruta documental rota».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Transformación trazable` / `ruta documental rota`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para rastreo de activo, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0872.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0873 · Rendición de cuentas — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Rendición de cuentas» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Movimientos se agrupan en un estado de gestión enlazado con recibos.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de rendición de cuentas en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: movimientos se agrupan en un estado de gestión enlazado con recibos.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Movimiento respaldado` / `partida sin soporte`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Movimientos se agrupan en un estado de gestión enlazado con recibos. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0873.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0874 · Rendición de cuentas — Mecanismo o relación explicada

**Objetivo:** Descomponer «Rendición de cuentas» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Movimientos se agrupan en un estado de gestión enlazado con recibos.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: movimientos se agrupan en un estado de gestión enlazado con recibos.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en rendición de cuentas.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Movimiento respaldado` / `partida sin soporte`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Movimientos se agrupan en un estado de gestión enlazado con recibos» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0874.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0875 · Rendición de cuentas — Comparación de dos supuestos

**Objetivo:** Comparar «Movimiento respaldado» y «partida sin soporte» dentro de rendición de cuentas, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Movimientos se agrupan en un estado de gestión enlazado con recibos.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de rendición de cuentas, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Movimiento respaldado» y en B «partida sin soporte» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «movimientos se agrupan en un estado de gestión enlazado con recibos» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Movimiento respaldado` / `partida sin soporte`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Movimiento respaldado / partida sin soporte debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0875.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0876 · Rendición de cuentas — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Rendición de cuentas» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Movimientos se agrupan en un estado de gestión enlazado con recibos.

**Composición:** Escena principal de rendición de cuentas con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: movimientos se agrupan en un estado de gestión enlazado con recibos.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Movimiento respaldado» de «partida sin soporte».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Movimiento respaldado` / `partida sin soporte`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para rendición de cuentas, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0876.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.

## LAW-0877 · Remedio equitativo solicitado — Microescena con objetos y actores

**Objetivo:** Hacer visible la acción de «Remedio equitativo solicitado» mediante una microescena concreta, no mediante una tarjeta con texto.

**Acción específica:** Una petición se vincula con un bien o conducta concreta.

**Composición:** Escenario abierto: patrimonio como ancla, roles como interlocutor u objeto secundario y cuentas como soporte. Mantener posiciones reconocibles.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.15: Presentar los elementos originales de remedio equitativo solicitado en reposo, con identificadores editables.
- 0.15–0.42: Iniciar la acción material: una petición se vincula con un bien o conducta concreta.
- 0.42–0.73: Completar el desplazamiento o transformación manteniendo unidos etiquetas, objetos y manos; la causa precede al efecto visible.
- 0.73–1.00: Mantener el estado final de la acción para su lectura; mostrar solo el estado suministrado, sin emitir un fallo jurídico.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, actorLabels, objectLabels, actionProgress, annotations, finalState`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Petición presentada` / `decisión todavía no aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La coreografía de objetos y actores debe realizar físicamente: Una petición se vincula con un bien o conducta concreta. Rechazar un simple fade del título.

**Prueba específica:** Comprobar continuidad del movimiento, anclajes de objetos y que la transformación sea reconocible con las etiquetas ocultas.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0877.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 6 s, editable.

## LAW-0878 · Remedio equitativo solicitado — Mecanismo o relación explicada

**Objetivo:** Descomponer «Remedio equitativo solicitado» en sus elementos y conexiones; explicar qué parte cambia y qué información la conecta con otra.

**Acción específica:** Una petición se vincula con un bien o conducta concreta.

**Composición:** Composición espacial con patrimonio, cuentas y conectores anclados a sus bordes. No usar la misma fila de cajas para todos los motivos.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.18: Separar los elementos de esta acción: una petición se vincula con un bien o conducta concreta.
- 0.18–0.43: Trazar únicamente las relaciones explícitas del supuesto; usar flechas causales solo cuando el dato aportado declare causalidad.
- 0.43–0.75: Mover un marcador de seguimiento por las relaciones mientras se amplía el elemento que interviene en remedio equitativo solicitado.
- 0.75–1.00: Reunir el mecanismo y mantener visibles origen, transformación y estado. Rotular las conexiones como relación, comunicación o secuencia según corresponda.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, elements, relationships, focusElement, relationLabels, traversalOrder`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Petición presentada` / `decisión todavía no aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe descomponer la operación «Una petición se vincula con un bien o conducta concreta» en geometría explicativa. No reutilizar la microescena story con cámara distinta.

**Prueba específica:** Verificar que cada conector termine en su elemento, que el orden no cambie al hacer seek y que relación no se represente como causalidad por defecto.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0878.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7 s, editable.

## LAW-0879 · Remedio equitativo solicitado — Comparación de dos supuestos

**Objetivo:** Comparar «Petición presentada» y «decisión todavía no aportada» dentro de remedio equitativo solicitado, manteniendo constantes todos los demás datos del ejemplo.

**Acción específica:** Una petición se vincula con un bien o conducta concreta.

**Composición:** Dos escenarios completos emparejados; lado a lado en horizontal y uno sobre otro en vertical. Mantener escala, tiempos y elementos comunes equivalentes.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.17: Duplicar una situación base con los objetos propios de remedio equitativo solicitado, no dos tarjetas de título.
- 0.17–0.40: Introducir en A «Petición presentada» y en B «decisión todavía no aportada» mediante un cambio visual localizado y explícito.
- 0.40–0.77: Ejecutar en paralelo la acción «una petición se vincula con un bien o conducta concreta» adaptando solo la circunstancia contrastada.
- 0.77–1.00: Unir el detalle que cambió mediante una guía comparativa. Presentar A y B sin ganador, puntuación ni conclusión automática.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, scenarioA, scenarioB, changedFact, sharedFacts, comparisonLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Petición presentada` / `decisión todavía no aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** La diferencia Petición presentada / decisión todavía no aportada debe cambiar objetos, relaciones o secuencia, no solo el texto o el color.

**Prueba específica:** Verificar que las dos escenas existen, que se modifica exactamente el hecho indicado y que no se inventa una consecuencia jurídica para completar el contraste.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0879.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 7.5 s, editable.

## LAW-0880 · Remedio equitativo solicitado — Inspección y cambio de un dato

**Objetivo:** Examinar el detalle decisivo de «Remedio equitativo solicitado» y mostrar qué cambia visualmente al sustituir un dato suministrado.

**Acción específica:** Una petición se vincula con un bien o conducta concreta.

**Composición:** Escena principal de remedio equitativo solicitado con una ampliación real de un elemento; conservar una miniatura de contexto y una única anotación editorial.

**Storyboard** — porcentajes de la duración, no segundos fijos:
- 0.00–0.20: Construir una vista del estado producido por: una petición se vincula con un bien o conducta concreta.
- 0.20–0.45: Aislar y ampliar el objeto, pasaje, registro o vínculo que permite distinguir «Petición presentada» de «decisión todavía no aportada».
- 0.45–0.75: Sustituir un solo dato por el valor alternativo del preset y actualizar únicamente su geometría, conexión o estado dependiente. Mantener trazabilidad del antes.
- 0.75–1.00: Volver al contexto y conservar un marcador de dato cambiado. La animación no deduce validez, responsabilidad ni desenlace no suministrado.

**Parámetros particulares:** `settlor, trustee, beneficiaries, assets, focusTarget, beforeValue, afterValue, detailGeometry, contextLabels`.

**Controles comunes:** duración, seed, idioma, estilo, paleta, fondo transparente/neutro, ratio, safe area, reduced motion, visibilidad del texto y jurisdicción.

**Preset base:** supuesto ficticio claramente rotulado; **preset alternativo:** `Petición presentada` / `decisión todavía no aportada`; **preset estrés:** etiquetas largas sin cambiar significado. Los presets no cuentan como animaciones adicionales.

**Diferencia obligatoria:** Debe existir un detalle ampliado y una sustitución antes/después relevante para remedio equitativo solicitado, no un zoom genérico de una tarjeta.

**Prueba específica:** Comprobar que el detalle conserva coordenadas de origen, que el cambio está localizado y que volver a tiempos anteriores restaura exactamente el dato anterior.

**Contexto jurídico:** Brief visual ilustrativo, no afirmación de derecho vigente. Jurisdicción no especificada. No inferir reglas, plazos, cuotas, culpabilidad, validez ni resultados. Los datos reales requieren fuente primaria y revisión. Conservar las etiquetas de origen doctrinal: no tratar trusts, consideration, defensas o IRAC como figuras universales o equivalentes exactas entre sistemas.

**Archivo a implementar:** `src/animations/equity/LAW-0880.js`; metadatos, presets y prueba en las rutas del JSONL. Duración orientativa: 8 s, editable.
