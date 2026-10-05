/**
 * Reusable JSON-schema field builders for scene parameters. Every field has a
 * description, bounded lengths and safe defaults are provided by each entry.
 * Arrays always REPLACE on setParams (never merge element-wise).
 * @module schemas/fields
 */

export const str = (description, maxLength = 80, extra = {}) => ({type: 'string', maxLength, description, ...extra});
export const optStr = (description, maxLength = 80) => ({type: ['string', 'null'], maxLength, description});
export const num = (description, minimum, maximum, extra = {}) => ({type: 'number', minimum, maximum, description, ...extra});
export const int = (description, minimum, maximum) => ({type: 'integer', minimum, maximum, description});
export const bool = description => ({type: 'boolean', description});
export const oneOf = (description, values) => ({type: 'string', enum: values, description});
export const list = (description, items, minItems, maxItems) => ({type: 'array', items, minItems, maxItems, description: `${description} (array replaces the previous value)`});
export const obj = (description, properties, required = []) => ({type: 'object', additionalProperties: false, properties, required, description});

/** A person / party reference used across categories. */
export const party = obj('A fictional person or party', {
  name: str('Display name (fictional by default)', 60),
  role: str('Descriptive role label (not a legal finding)', 60),
  appearance: obj('Optional appearance overrides; defaults derive from the seed', {
    skin: int('Skin tone index 0–5', 0, 5),
    hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
    hairColor: int('Hair colour index 0–6', 0, 6),
    outfit: int('Outfit colour index 0–7', 0, 7),
    glasses: bool('Wears glasses'),
  }),
}, ['name']);

/** Annotation callout attached to a named scene target. */
export const annotation = targets => obj('Editorial annotation shown during the hold', {
  target: oneOf('Scene element the annotation points at', targets),
  text: str('Annotation text', 90),
}, ['target', 'text']);

/* ---- category: documents ---------------------------------------------- */
export const documentsFields = {
  documentId: str('Identifier printed on the document (fictional)', 32),
  documentTitle: str('Document title printed on the sheet (wraps to two lines, then shrinks within a bound, then ellipsis with full text kept accessible)', 120),
  clauses: list('Clause headings shown on the document', str('Clause heading', 90), 1, 5),
  signers: list('Signer (first) and receiving party (second)', party, 2, 2),
  redactions: list('Zero-based clause indices covered by redaction bars', int('Clause index', 0, 4), 0, 5),
};

/* ---- treatment: story ------------------------------------------------- */
export const storyFields = (objectLabelProps, annotationTargets, finalStates) => ({
  actorLabels: obj('Role captions shown next to each actor', {a: str('Caption for actor A', 50), b: str('Caption for actor B', 50)}),
  objectLabels: obj('Labels printed on props', objectLabelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(annotationTargets), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no legal conclusion is inferred)', finalStates),
});

/* ---- treatment: mechanism --------------------------------------------- */
export const RELATION_KINDS = ['relation', 'communication', 'sequence', 'causal'];
export const mechanismFields = (elementIds) => ({
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', elementIds),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, elementIds.length),
  relationships: list('Explicit relationships between components; kind controls line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', elementIds),
    to: oneOf('Target component id', elementIds),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', elementIds),
  relationLabels: obj('Override the caption used for each relation kind', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', elementIds), 2, 8),
});

/* ---- treatment: contrast ---------------------------------------------- */
export const contrastFields = () => ({
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
});

/* ---- treatment: inspect ----------------------------------------------- */
export const inspectFields = (targets) => ({
  focusTarget: oneOf('Detail that is enlarged and substituted', targets),
  beforeValue: str('Value shown before the substitution', 90),
  afterValue: str('Value shown after the substitution (the alternative datum)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
});
