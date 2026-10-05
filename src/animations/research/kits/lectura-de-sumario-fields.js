/**
 * Parameter field set for the "Lectura de sumario" motif (LAW-0057..0060).
 * src/schemas/fields.js has no research-category set yet, so the motif keeps
 * its own here (candidate for promotion when a second research motif needs
 * the same fields). Every value is fictional and illustrative; the scene never
 * decides what a decision holds.
 * @module animations/research/kits/lectura-de-sumario-fields
 */
import {str, int, obj, oneOf, list, party} from '../../../schemas/fields.js';

/** Paragraphs shown on the unfolded decision text (two per folded panel). */
export const PARAGRAPHS = 4;

/** Content shared by the four treatments (query, sources, citations, dates, texts). */
export const sumarioContentFields = {
  query: str('Search terms shown in the search box (fictional example)', 60),
  sources: obj('Source labels', {
    library: str('Label of the library shelf / collection', 50),
    volume: str('Label of the volume that holds the decision', 30),
    database: str('Title of the search box', 40),
  }),
  citations: obj('Fictional citation data', {
    decision: str('Identifier of the fictional decision (never a real citation)', 32),
    paragraph: int(`Paragraph the summary points to (1–${PARAGRAPHS}); it decides how far the text unfolds`, 1, PARAGRAPHS),
  }),
  dates: obj('Relative, fictional dates', {
    decision: str('Date printed on the decision and on its summary card', 24),
  }),
  summaryText: str('Text of the summary (sumario) printed on the index card — descriptive, no holding', 110),
  passageText: str('Text of the passage the summary points to (fictional, descriptive)', 140),
};

/** Final states the author may supply to the story (no legal conclusion). */
export const STORY_STATES = ['passage-linked', 'passage-located'];

export const storyFields = {
  researcher: party,
  actorLabels: obj('Role caption shown next to the researcher', {reader: str('Caption for the researcher', 50)}),
  objectLabels: obj('Labels printed on props', {
    card: str('Header printed on the summary card', 24),
    decision: str('Caption of the unfolded decision text', 40),
  }),
  actionProgress: {type: 'number', minimum: 0, maximum: 1, description: 'How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)'},
  annotations: list('Editorial callouts shown in the final hold', obj('Editorial annotation shown during the hold', {
    target: oneOf('Scene element the annotation points at', ['summary', 'passage', 'search', 'library']),
    text: str('Annotation text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold (descriptive only)', STORY_STATES),
};

/** Component ids of the mechanism (LAW-0058). */
export const MECH_IDS = ['search', 'card', 'passage', 'document', 'library'];

/** Built-in strings (user content is never translated). */
export const SUMARIO_STRINGS = {
  en: {
    summary: 'Summary', decisionText: 'Decision text', passage: 'Passage', search: 'Search',
    linked: 'Summary linked to its passage', located: 'Passage located', pointsTo: 'points to',
    pointer: 'Points to', date: 'Date', citation: 'Decision', restFolded: 'Rest of the decision stays folded',
    reads: 'Reads', readingSummary: 'Reading the summary', readingText: 'Reading the decision text',
  },
  es: {
    summary: 'Sumario', decisionText: 'Texto de la resolución', passage: 'Pasaje', search: 'Buscar',
    linked: 'Sumario enlazado a su pasaje', located: 'Pasaje localizado', pointsTo: 'remite a',
    pointer: 'Remite a', date: 'Fecha', citation: 'Resolución', restFolded: 'El resto de la resolución sigue plegado',
    reads: 'Lee', readingSummary: 'Lectura del sumario', readingText: 'Lectura del texto de la resolución',
  },
};
