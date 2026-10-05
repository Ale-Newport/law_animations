# Kit de skills para una biblioteca de animaciones jurídicas JS

## Qué contiene y qué no

**Contiene:** dos skills propias instalables en Claude Code, contrato de API, normas visuales/jurídicas, prompt maestro en español, 2.000 briefs individuales, catálogo en JSONL/Markdown, 100 lotes de 20 IDs y utilidades locales de consulta/validación.

**No contiene todavía:** las 2.000 animaciones programadas, un motor de animación terminado o vídeos. Claude Code debe implementar los módulos siguiendo este paquete. El estado inicial correcto es 0 implementadas y 2.000 planificadas.

El alcance es **500 motivos jurídicos × cuatro composiciones distintas = 2.000 animaciones objetivo**. No son 2.000 doctrinas distintas. No cuentan colores, formatos o presets como animaciones nuevas.

## Instalación en Mac

Descarga `law-animation-kit.zip` y extrae la carpeta completa. Debes conservar también la carpeta oculta `.claude`; extraer el ZIP la conserva.

Desde Terminal, para un proyecto nuevo:

```bash
mkdir -p ~/Developer
unzip -n ~/Downloads/law-animation-kit.zip -d ~/Developer
cd ~/Developer/law-animation-kit
node scripts/check-kit.mjs
node scripts/catalog.mjs stats
```

Si Safari ya descomprimió la descarga, mueve la carpeta `law-animation-kit` completa a `~/Developer/` y ejecuta los tres últimos comandos desde ella. No copies únicamente SKILL.md: las instrucciones dependen del catálogo y los documentos del kit.

Se requiere Node/npm para las utilidades e instalaciones indicadas, y Claude Code instalado y autenticado. Usa una versión de Node compatible con las dependencias que Claude seleccione. El kit no instala ni modifica herramientas globales por su cuenta.

### Skills principales

Ya quedan en su ubicación de proyecto al extraer el kit:

```text
.claude/skills/law-animation-library/SKILL.md
.claude/skills/law-animation-qa/SKILL.md
```

No hace falta publicarlas ni subirlas a Claude web. Abre Claude Code desde esta carpeta. Son skills propias de este encargo, no skills oficiales de Anthropic.

### Skill externa recomendada

La skill oficial `frontend-design` de Anthropic ayuda con el diseño de la galería y la dirección visual, pero no contiene animaciones jurídicas:

```bash
npx skills add anthropics/skills --skill frontend-design --agent claude-code --copy
```

Revisa la fuente y los permisos que presente el instalador. Se instala en el proyecto; no se necesita instalar todas las skills del repositorio.

### Herramienta de inspección: Playwright MCP

```bash
claude mcp add --transport stdio --scope project playwright -- npx -y @playwright/mcp@latest
```

Registra un servidor local de herramientas de navegador; no es una skill ni una biblioteca de animaciones. Al iniciar Claude Code, revisa/aprueba la configuración del proyecto y comprueba el estado con `/mcp`. Registrar el servidor no demuestra que el navegador esté instalado: Claude debe comprobar que puede abrir la galería y preparar los componentes que falten.

Para pruebas masivas, el proyecto usará también scripts Playwright locales. El MCP sirve para dirigir inspecciones y diagnosticar problemas. No actives acceso a perfiles personales o sitios ajenos al proyecto.

### Remotion: opcional, no necesario en esta fase

La biblioteca solicitada usa JS/SVG independiente. No necesitas instalar un renderizador de vídeo ahora. Para disponer más adelante de guía de integración con Remotion:

```bash
npx skills add remotion-dev/skills --skill remotion-best-practices --agent claude-code --copy
```

Instalar una skill no instala el motor Remotion ni obliga a usarlo. No uses comandos de creación/renderizado de vídeo para esta tarea. Revisa por separado las condiciones/licencia de las dependencias que elijas al integrar vídeo en el futuro.

## Cómo empezar

```bash
cd ~/Developer/law-animation-kit
claude
```

En Claude Code ejecuta:

```text
/law-animation-library start

Lee prompts/MASTER_PROMPT.md y ejecútalo. Lee los briefs por lotes usando scripts/catalog.mjs. Quiero módulos JS reales guardados, no vídeos ni solo un generador. Empieza por briefs/pilot.json para fijar la calidad y continúa con los lotes restantes.
```

También puedes copiar el contenido entero de `prompts/MASTER_PROMPT.md` en la sesión. No pegues el archivo combinado de 2.000 fichas en un solo mensaje.

Para continuar en otra sesión:

```text
/law-animation-library continue
```

La reanudación usa `production/SESSION_HANDOFF.md` y el progreso persistente. La skill no elude límites de contexto/uso, no garantiza una sola sesión y no ejecuta un trabajo indefinido sin intervención. La biblioteca final debe funcionar sin Claude; la fase de desarrollo con Claude Code utiliza sus propias condiciones y consumo.

## Archivos importantes

| Archivo | Uso |
|---|---|
| `prompts/MASTER_PROMPT.md` | Prompt detallado de construcción. |
| `prompts/PROMPT_COMPLETO_2000.md` | Prompt maestro más las 2.000 fichas, para archivo/consulta. |
| `briefs/catalog.jsonl` | Una especificación estructurada por ID. |
| `briefs/categories/` | Fichas legibles separadas en 50 categorías. |
| `briefs/batches/` | 100 listas de 20 IDs. |
| `briefs/pilot.json` | 16 IDs iniciales para establecer calidad. |
| `docs/RUNTIME_CONTRACT.md` | API JS para tiempo, parámetros e integración posterior. |
| `docs/ACCEPTANCE.md` | Pruebas y requisitos para contar un elemento como terminado. |
| `production/progress.json` | Estados reales de producción; inicialmente planned. |
| `production/SESSION_HANDOFF.md` | Punto de reanudación entre sesiones. |
| `docs/SOURCES.md` | Referencias oficiales verificadas para las herramientas. |

## Consultar el catálogo

```bash
node scripts/catalog.mjs show LAW-0441
node scripts/catalog.mjs batch B023
node scripts/catalog.mjs next --limit 20
node scripts/catalog.mjs stats
node scripts/catalog.mjs audit
```

Las utilidades son de solo lectura. No generan código, no aceptan animaciones y no sustituyen las pruebas visuales. `audit --require-complete` fallará intencionadamente mientras falten animaciones aceptadas.

## Categorías e IDs

Cada categoría tiene 10 motivos × cuatro composiciones = 40 fichas.

| Nº | Categoría | IDs | Fichas |
|---|---|---|---:|
| 01 | Documentos e instrumentos | LAW-0001–LAW-0040 | 40 |
| 02 | Investigación jurídica | LAW-0041–LAW-0080 | 40 |
| 03 | Razonamiento jurídico | LAW-0081–LAW-0120 | 40 |
| 04 | Fuentes e interpretación | LAW-0121–LAW-0160 | 40 |
| 05 | Personas y funciones jurídicas | LAW-0161–LAW-0200 | 40 |
| 06 | Órganos y espacios judiciales | LAW-0201–LAW-0240 | 40 |
| 07 | Inicio de reclamaciones civiles | LAW-0241–LAW-0280 | 40 |
| 08 | Audiencias y desarrollo del juicio | LAW-0281–LAW-0320 | 40 |
| 09 | Impugnaciones y revisión | LAW-0321–LAW-0360 | 40 |
| 10 | Recogida y custodia de pruebas | LAW-0361–LAW-0400 | 40 |
| 11 | Análisis y presentación de pruebas | LAW-0401–LAW-0440 | 40 |
| 12 | Formación del contrato | LAW-0441–LAW-0480 | 40 |
| 13 | Contenido y cláusulas | LAW-0481–LAW-0520 | 40 |
| 14 | Consentimiento y controversias de formación | LAW-0521–LAW-0560 | 40 |
| 15 | Cumplimiento contractual | LAW-0561–LAW-0600 | 40 |
| 16 | Respuestas y remedios contractuales | LAW-0601–LAW-0640 | 40 |
| 17 | Deber y conducta en responsabilidad civil | LAW-0641–LAW-0680 | 40 |
| 18 | Causalidad y daño | LAW-0681–LAW-0720 | 40 |
| 19 | Supuestos de responsabilidad civil | LAW-0721–LAW-0760 | 40 |
| 20 | Propiedad y titularidad | LAW-0761–LAW-0800 | 40 |
| 21 | Uso de bienes y suelo | LAW-0801–LAW-0840 | 40 |
| 22 | Trusts y estructuras fiduciarias | LAW-0841–LAW-0880 | 40 |
| 23 | Sucesiones y administración patrimonial | LAW-0881–LAW-0920 | 40 |
| 24 | Relaciones familiares y cuidado | LAW-0921–LAW-0960 | 40 |
| 25 | Elementos de infracciones penales | LAW-0961–LAW-1000 | 40 |
| 26 | Defensas y cuestiones exculpatorias | LAW-1001–LAW-1040 | 40 |
| 27 | Procedimiento penal | LAW-1041–LAW-1080 | 40 |
| 28 | Decisiones penales y ejecución | LAW-1081–LAW-1120 | 40 |
| 29 | Estructuras e instituciones públicas | LAW-1121–LAW-1160 | 40 |
| 30 | Actuación y revisión administrativa | LAW-1161–LAW-1200 | 40 |
| 31 | Estructuras de análisis de derechos | LAW-1201–LAW-1240 | 40 |
| 32 | Relaciones jurídicas internacionales | LAW-1241–LAW-1280 | 40 |
| 33 | Relaciones privadas transfronterizas | LAW-1281–LAW-1320 | 40 |
| 34 | Estructuras societarias | LAW-1321–LAW-1360 | 40 |
| 35 | Gestión y gobierno societario | LAW-1361–LAW-1400 | 40 |
| 36 | Operaciones mercantiles | LAW-1401–LAW-1440 | 40 |
| 37 | Financiación y garantías | LAW-1441–LAW-1480 | 40 |
| 38 | Insolvencia y reorganización | LAW-1481–LAW-1520 | 40 |
| 39 | Relaciones de trabajo | LAW-1521–LAW-1560 | 40 |
| 40 | Incidencias laborales | LAW-1561–LAW-1600 | 40 |
| 41 | Relaciones de consumo | LAW-1601–LAW-1640 | 40 |
| 42 | Autoría y uso de obras | LAW-1641–LAW-1680 | 40 |
| 43 | Marcas e invenciones | LAW-1681–LAW-1720 | 40 |
| 44 | Datos personales y privacidad | LAW-1721–LAW-1760 | 40 |
| 45 | Plataformas y sistemas digitales | LAW-1761–LAW-1800 | 40 |
| 46 | Entorno, actividades y permisos | LAW-1801–LAW-1840 | 40 |
| 47 | Obligaciones tributarias y aduanas | LAW-1841–LAW-1880 | 40 |
| 48 | Negociación y resolución alternativa | LAW-1881–LAW-1920 | 40 |
| 49 | Ética y gestión profesional | LAW-1921–LAW-1960 | 40 |
| 50 | Estudio y explicación de law | LAW-1961–LAW-2000 | 40 |

## Nota sobre el contenido jurídico

Las fichas son instrucciones de diseño, no asesoramiento ni reglas verificadas de una jurisdicción. Por defecto se usarán ejemplos ficticios y estados descriptivos. El contenido jurídico real deberá tener jurisdicción, fuente y revisión separados de la aceptación técnica.

## Qué debe entregar Claude finalmente

Una biblioteca materializada en JS con recursos locales, API controlable por tiempo, presets, metadatos, galería, pruebas y evidencia. Cada ID debe cargar su escena concreta sin regeneración con IA. Los módulos pueden compartir primitivas, pero el paquete debe conservar todas las dependencias necesarias para reutilizarlos.
