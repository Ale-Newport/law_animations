# Visual standard

## Purpose and composition
The animation itself is the product. The gallery should not look more finished than the actual scenes. Prefer meaningful large artwork and clear visual relationships. Keep a neutral white, beige, grey or black background, a restrained texture/gradient, or true transparency. Use empty space and configurable caption-safe areas. Do not fill the entire frame with a stock photograph, a background video, an AI-generated picture or a screenshot of a document.

Objects must be drawn as intentional layered vector artwork. A document can have a folded edge, lines, highlighted clauses, tabs and a signature. A courtroom scene needs coherent desks, positions, sight lines and participant silhouettes. Not every subject needs a gavel, scales or courthouse. Avoid implying that a symbolic prop is used by a specific real legal system.

There should be enough detail to look designed, but not so much tiny detail that it disappears in a mobile clip. Labels complement the action; they must not substitute for it. Avoid hundreds of unrelated scenes that all look like three rounded cards sliding in.

## Four distinct storyboards per motif
1. **Story:** a concrete action with actors, objects, documents and intentional spatial continuity.
2. **Mechanism:** a decomposed spatial relationship, path, layered document, transfer or inspectable mechanism. Choose a layout appropriate to the motif; not always a flowchart.
3. **Contrast:** paired complete scenes whose one changed fact creates a clear visual difference. The comparison is not a legal verdict or political ranking.
4. **Inspect:** a local detail is enlarged, a parameter is replaced, and the local consequence is shown before returning to context.

It is acceptable to share an asset or solver across these scenes; it is not acceptable to share the exact timeline and layout and change only the title. Implement a motif's four IDs together when that makes review more efficient.

## Visual families
Develop the primitives needed by real briefs rather than spending the entire session building an abstract engine. Useful families include:
- Document handling, signing, redaction, stamp, fold, annex, version comparison and clause magnification.
- Human/role interactions, document handoff, turn-taking, seated/standing discussion and remote participation.
- Spatial processes, branching routes, dependencies, parallel lanes and event timelines.
- Paired scenes, before/after, counterfactual replay, detail lenses and layered context.
- Territorial abstract regions, registers, inventories, organization graphs and traced transfers.
- Amount/asset flows, partitions and reconciliations using supplied hypothetical values only.

Do not describe code-generated vectors as photographic or anatomically realistic. Use stylized characters that remain coherent. Hands may be simplified but must stay attached; props must follow local hand transforms, layer correctly and never teleport between holders. Support varied ages, appearances, clothing and orientations without attaching demographic traits to guilt, trustworthiness or legal roles. Avoid gore or sensational imagery.

## Themes
Establish one polished default theme first: `editorial-flat`, clean vector forms, consistent outlines, restrained depth and legible typography. After the pilot succeeds, support `outline`, `paper-cut` and `whiteboard` where the motif benefits. Themes are render treatments, not more animation IDs. No promise of 3D, anime or photorealism as a superficial style toggle; complex new art styles need their own assets and QA.

Keep fonts and assets local. Do not load Google Fonts, icon CDNs or image services at runtime. Use original vector assets or locally packaged resources with verified usable licences. Record actual third-party notices, not an invented blanket MIT licence.

## Motion
Use meaningful anticipation, a main action, small natural settle, then a readable hold. Do not spring every object or bounce legal labels constantly. Use easing consistently. Keep connected objects aligned. In a transfer, the receiving hand and object must occupy the same place at handoff. Keep camera movements subtle and avoid motion that makes document text unreadable.

Use different motion behavior for paper, people, lines and numeric data. Draw a route when revealing a relationship; move along it only when the scene means transfer or sequence. Never turn an association into implied causation merely by animating an arrow.

## Validation on actual output
Inspect at 1920×1080, 1080×1920 and 1080×1080. Also inspect the gallery preview at a mobile viewing size. Test English and Spanish labels, a long person/entity name and optional labels off. Bounded text reflow must keep meaning and a usable scene.

A theme is supported only when tested. No blank fallback scenes and no substitution of thumbnails during full preview. Non-selected gallery cards should use stills; animate only the selected item or a very small visible subset.
