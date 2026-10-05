# Prompt maestro para Claude Code

Activa `/law-animation-library start` y trabaja en este proyecto para construir una biblioteca local de **2.000 animaciones JavaScript/SVG de temática jurídica ya implementadas, guardadas, personalizables y listas para reutilizar**.

## 1. Objetivo exacto

No quiero crear ningún vídeo ahora. No quiero un generador que pueda producir animaciones más adelante, una lista de ideas, una galería vacía, un conjunto de iconos estáticos, 2.000 archivos de scaffolding ni un catálogo de JSON sin escenas ejecutables. Quiero que programes y guardes las animaciones mismas.

Cuando seleccione un ID, su módulo debe existir en el proyecto y poder reproducirse cambiando parámetros, sin volver a pedir código a un LLM. Puedes compartir geometría, personajes, funciones matemáticas, motores de layout y primitivas; lo que no puedes hacer es reducir toda la biblioteca a una plantilla que cambia de título.

El kit contiene las instrucciones y los briefs, no las 2.000 animaciones acabadas. Todos los estados iniciales son `planned`. Tu trabajo comienza en ese punto.

## 2. Lee los recursos adecuados

Lee `CLAUDE.md`, las dos skills locales, `production/SESSION_HANDOFF.md` y:

- `docs/RUNTIME_CONTRACT.md`.
- `docs/VISUAL_STANDARD.md`.
- `docs/LEGAL_CONTENT_POLICY.md`.
- `docs/PRODUCTION_WORKFLOW.md`.
- `docs/ACCEPTANCE.md`.

Después examina `briefs/index.json` y ejecuta:

```bash
node scripts/catalog.mjs stats
node scripts/catalog.mjs audit
node scripts/catalog.mjs pilot
```

No leas el catálogo completo de 2.000 fichas de una vez. `briefs/catalog.jsonl` contiene cada encargo, y `scripts/catalog.mjs` permite seleccionar los que necesitas. Las versiones Markdown completas son copias para consulta humana; cargar todo el archivo consumiría contexto innecesariamente.

## 3. Las 2.000 animaciones están especificadas

El catálogo contiene **50 categorías × 10 motivos × 4 composiciones distintas = 2.000 IDs**. Es una biblioteca de 500 motivos jurídicos con cuatro tratamientos funcionales, no 2.000 doctrinas distintas ni 2.000 simples variaciones de color.

Para cada motivo debes materializar:

**Story:** una microescena concreta en la que personajes, documentos u objetos realizan la acción del brief.

**Mechanism:** una composición diferente que descompone la operación o relación, mostrando sus piezas, conexiones, transformaciones o recorrido. No conviertas todos los mecanismos en tres cajas y flechas.

**Contrast:** dos situaciones completas emparejadas; cambia un hecho concreto y deja constantes los demás. El cambio debe verse en la geometría, la interacción o la secuencia, no únicamente en el texto.

**Inspect:** parte de un contexto, amplía un detalle real, sustituye un dato y muestra el cambio local antes de volver al contexto. No basta con hacer zoom al título.

Cada ID tiene objetivo, acción, composición, cuatro fases, campos editables, tres presets requeridos, una condición de diferenciación y una prueba específica. Respétalos. No cambies IDs ni elimines encargos difíciles para alcanzar el número más rápido. Las variaciones de estilo, tamaño, color, idioma o preset no cuentan como nuevas animaciones.

## 4. Stack y arquitectura

Usa un núcleo **JavaScript ESM + SVG vectorial original**, con tipos JSDoc, parámetros validados y dependencias mínimas. El núcleo no debe depender de React, de la galería, de Vite, de un servidor de IA ni de Remotion. Puedes usar Vite para desarrollar la galería local y herramientas de prueba locales.

Si una parte se escribe en TypeScript, el resultado debe publicar módulos `.js` reales y probados. No acepto únicamente `.tsx` que no puedan integrarse sin reconstruir toda la aplicación.

La API pública queda definida en `docs/RUNTIME_CONTRACT.md`: cada definición tiene ID, metadatos, parámetros, schema y `create(container, options)`. Cada instancia proporciona `ready`, `seek(timeMs)`, `renderFrame(frame, {fps})`, `setParams(patch)`, `resize`, `getState` y `destroy`.

El tiempo lo controla quien inserta la animación. Un mismo instante y los mismos parámetros deben producir el mismo estado, tanto al avanzar como al retroceder o solicitar fotogramas en orden aleatorio. No uses un reloj interno independiente, transiciones CSS activas ni aleatoriedad global. El reproductor de la galería puede usar requestAnimationFrame; las escenas no deben depender de él.

Guarda una entrada JS por ID con su escena y timeline completos. Una escena declarativa compilada a JS es válida si queda totalmente materializada y no necesita generar contenido después. Guarda también todas sus dependencias locales, recursos, presets y documentación. Copiar un archivo que depende de rutas temporales externas no cuenta como exportación independiente.

No añadas ahora un motor de vídeo, un codificador, TTS, voz, lip-sync, música, sincronización de narración ni servicios de pago. Tampoco necesito backend, login, Supabase, vector database ni API de embeddings para la galería.

## 5. Calidad visual

Prioriza la calidad de las animaciones sobre una interfaz espectacular. No quiero miles de iconos que entran con fade-in ni pantallas de texto disfrazadas de motion graphics.

Dibuja objetos vectoriales con capas limpias: documentos, manos estilizadas, personajes, carpetas, mesas, edificios genéricos, registros, calendarios, mercancías, pantallas, parcelas abstractas, activos y conectores. Usa los recursos adecuados para cada escena; no pongas una balanza o un martillo en todas.

Las manos deben permanecer unidas a los brazos. Los objetos deben seguir los puntos de agarre y cambiar de portador en una posición coherente. Las flechas deben terminar donde corresponde. Los documentos no pueden atravesar mesas ni desaparecer sin intención. Evita desplazamientos que solo muevan toda la composición sin explicar nada.

El fondo debe ser transparente o neutro, con espacio libre y márgenes configurables para futuros captions. La animación principal debe ser grande y legible. No uses imágenes generadas por IA, fotos de stock como sustituto de las escenas, vídeos descargados, SVG con bitmaps incrustados o recursos remotos.

Establece primero un estilo editorial vectorial pulido. Después añade los estilos compatibles descritos en VISUAL_STANDARD; no multipliques contadores por cada paleta. No prometas realismo fotográfico ni estilos complejos que no hayas implementado y probado.

El movimiento debe tener preparación, acción principal, asentamiento discreto y pausa de lectura. Reproducir en bucle en la galería está permitido como replay; no afirmes que es un loop seamless cuando tiene un salto. No hagas que una historia jurídica vaya hacia atrás para cerrar artificialmente un loop.

## 6. Personalización y formatos

Cada animación debe permitir editar sus textos, nombres, personas, roles, objetos, relaciones, fechas, importes, elementos, pasos, estado final y parámetros específicos pertinentes sin tocar su lógica interna.

Expón también duración, semilla, idioma, tema, paleta, fondo, dimensiones, safe areas, movimiento reducido y visibilidad de etiquetas. Los campos deben tener descripciones, valores por defecto seguros y validación clara. Los arrays se deben sustituir de manera predecible; no mezcles listas silenciosamente.

Soporta 16:9, 9:16 y 1:1 mediante composición adaptada. En una comparación, coloca las escenas una junto a otra o una encima de otra según el espacio. No reduzcas simplemente todo el diseño horizontal hasta hacerlo ilegible en vertical. Prueba etiquetas largas y versiones en inglés/español.

Cada ID necesita al menos tres presets guardados: uno ficticio ilustrativo, otro con un cambio sustantivo y otro de estrés con textos largos. Son presets del mismo ID, no animaciones adicionales.

## 7. Galería local de inspección

Construye una galería sencilla, local y funcional para buscar por ID, título, categoría, motivo y etiquetas. Debe filtrar estados de producción, mostrar si un elemento está pendiente o listo y abrir la animación grande bajo demanda.

Incluye play/pause/replay, scrubbing temporal exacto, avance por frame, selector de formato, fondo, tema y preset, controles de parámetros y acceso a código/metadatos. Guarda presets personales localmente. Usa miniaturas estáticas en listados y carga perezosa de módulos; no montes 2.000 animaciones simultáneamente.

No incluyas botones para producir MP4, WebM, MOV, GIF o vídeos completos. Se permiten capturas SVG/PNG y hojas de contacto para comprobar la biblioteca.

## 8. Contenido jurídico

No he elegido una jurisdicción única para toda la biblioteca. No asumas que escribir en inglés convierte el contenido en derecho de Inglaterra y Gales, ni que las figuras de distintos sistemas son intercambiables.

Los ejemplos iniciales deben ser ficticios, neutrales y rotulados como ilustrativos, con `jurisdiction: "unspecified"` y `legalStatus: "illustrative-unverified"`. Una entrega puede mostrarse como enviada o recibida sin declarar que por ello nació un contrato válido. Una reclamación puede mostrarse sin declarar que el reclamante tiene razón.

No inventes jurisprudencia, citas, plazos, porcentajes de prueba, orden de recursos, tipos fiscales, cuotas sucesorias, prioridades de crédito, culpabilidad o resultados. Cuando una escena necesite una regla real, debe proceder de una fuente primaria identificada y una jurisdicción concreta; si no está verificada, conserva la condición de ilustrativa y editable.

Separa hechos, alegaciones, inferencias, argumentos y decisiones. En instituciones o políticas públicas, representa procesos y posiciones atribuidas sin recomendar opciones, puntuarlas ni declarar ganadores. La aceptación técnica/visual de una animación no significa revisión jurídica de su contenido.

## 9. Producción con controles de calidad

Empieza por los 16 IDs de `briefs/pilot.json`: son cuatro motivos con sus cuatro composiciones. Deben servir como referencia de calidad de documentos, interacciones humanas, comunicaciones contractuales y relaciones causales. Implementa, reproduce, inspecciona y corrige esas escenas antes de escalar.

El piloto NO es el objetivo final. Cuando esté correcto, continúa con los restantes IDs mediante los 100 lotes de 20 de `briefs/batches/`. Puedes trabajar internamente en grupos menores, pero no te detengas voluntariamente tras un prototipo si puedes seguir implementando.

Para cada motivo: lee las cuatro fichas, diseña sus escenas, implementa, personaliza, prueba, inspecciona y corrige. No generes primero miles de stubs ni dejes toda la revisión para el final. Si dispones de subagentes, asigna carpetas distintas y evita escrituras simultáneas sobre core, registro y progreso; no hagas que dependamos de una función experimental de paralelización.

Mantén `production/progress.json` con los estados reales `planned`, `in_progress`, `implemented`, `automated_pass`, `visual_reviewed`, `accepted` y `blocked`. No modifiques el estado de los briefs originales para simular ejecución. Conserva hashes y evidencia por ID.

## 10. Pruebas y aceptación

Aplica `/law-animation-qa` antes de aceptar cada ID. Usa pruebas locales Playwright para escala y el MCP para inspección interactiva cuando resulte útil. Inspeccionar el árbol de accesibilidad no equivale a ver la ilustración SVG.

Prueba tiempos iniciales, intermedios y finales; seek ordenado, inverso y aleatorio; actualización de parámetros; los tres formatos; presets; dos instancias simultáneas; cleanup; identificadores SVG únicos; entradas inválidas y ausencia de recursos remotos.

Genera y EXAMINA hojas de contacto con fotogramas relevantes. Revisa en movimiento los nuevos mecanismos, personajes y escenas con incidencias. No marques revisión visual porque existe un PNG en disco. Registra qué capturas y reproducciones fueron realmente vistas, con viewport, tema y preset. No actualices snapshots para ocultar fallos.

Comprueba que cada motivo tenga cuatro composiciones distintas. Rechaza clones con título cambiado. No inventes resultados de tests, rendimiento ni revisiones jurídicas. Una modificación compartida invalida la evidencia afectada hasta volver a comprobarla.

Cada ID aceptado debe tener entrada JS funcional, metadatos, presets, schema, pruebas, dependencias locales y evidencia actual. La utilidad incluida `catalog.mjs audit` solo hace comprobaciones estructurales: no sustituye estas pruebas.

## 11. Sesiones y entrega

Trabaja sobre archivos reales. Inspecciona antes de modificar, conserva mis cambios y no sobrescribas otra aplicación. No hagas push, no cambies el autor de los commits y no añadas Co-authored-by. No accedas a cuentas, perfiles del navegador ni archivos personales ajenos al proyecto.

Crea y documenta los comandos de desarrollo, tests, validación y empaquetado cuando los implementes. No digas que existen comandos de una aplicación que todavía no has creado.

Tras cada tramo comprobado, actualiza `production/SESSION_HANDOFF.md` indicando IDs terminados, cantidades implementadas/probadas/revisadas/aceptadas, errores, rutas de evidencia y próxima acción. Si se termina el contexto o aparece un límite real, guarda el estado y deja el resto pendiente; no prometas trabajo futuro sin ejecución ni declares completas las 2.000 por haber escrito el catálogo.

El resultado final es una biblioteca que puedo conservar, inspeccionar y reutilizar con módulos JS concretos, más sus recursos y documentación. Su utilización posterior no debe requerir Claude ni ningún generador. La integración en vídeos se hará después.

**Empieza ahora inspeccionando el kit y construyendo el núcleo mínimo y las animaciones reales del piloto; después continúa por lotes con el catálogo. No te limites a devolver un plan.**
