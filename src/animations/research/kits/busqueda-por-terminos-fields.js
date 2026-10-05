/**
 * Parameter fields and fictional defaults for the "Búsqueda por términos"
 * motif (LAW-0041..0044). Built only from the shared builders in
 * schemas/fields.js. This is a local field set for the research category
 * (query / sources / citations / dates); it can be promoted to
 * schemas/fields.js when another research motif needs it.
 *
 * Conventions shared by the four entries:
 *  - query.terms[i] gets colour i (accent, accent2, accent4) everywhere;
 *  - matching is computed from the supplied text (never hardcoded): exact =
 *    the literal term as a whole word/phrase; contextual = the term OR one of
 *    the related wordings the author supplied for it;
 *  - a passage shows at most one match (exact wins over contextual, then the
 *    first term in query order).
 * @module animations/research/kits/busqueda-por-terminos-fields
 */
import {str, list, obj, oneOf, bool} from '../../../schemas/fields.js';

const term = obj('A query term', {
  text: str('Word or short phrase typed into the search box', 24),
  related: list('Related wording that only a contextual search links (supplied by the author; illustrative)', str('Related word or phrase', 24), 0, 3),
}, ['text']);

/** Category fields (research): query, sources, citations, dates. */
export const researchFields = {
  query: obj('Search query typed into the search box', {
    terms: list('Query terms (1–3). Each term keeps its own colour and travels to the passages that contain it', term, 1, 3),
    mode: oneOf('Matching mode: exact = only the literal words; contextual = the words plus the related wording supplied for each term', ['exact', 'contextual']),
    placeholder: str('Placeholder shown in the empty search box', 40),
  }, ['terms']),
  sources: list('Source documents kept in the library (fictional). Each one is an open volume on its own shelf', obj('Source document', {
    id: str('Volume identifier printed on the volume and on its shelf plate', 14),
    title: str('Title printed on the left page', 60),
    passages: list('Passages printed on the right page (simulated text)', str('Passage text', 80), 2, 3),
  }, ['id', 'title', 'passages']), 2, 3),
  citations: obj('How found passages are written on the index card (fictional references only)', {
    pinpoint: str('Marker placed before the passage number, e.g. ¶ or p.', 6),
    withDate: bool('Append the source date to each citation line'),
  }),
  dates: list('Date printed on each source, same order as sources (relative or fictional)', str('Date label', 24), 0, 3),
};

/** Fictional, illustrative defaults shared by the four entries (English). */
export const RESEARCH_DEFAULTS = {
  query: {
    terms: [
      {text: 'notice', related: ['notified', 'informed']},
      {text: 'delivery', related: ['shipment', 'delivered']},
    ],
    mode: 'exact',
    placeholder: 'Search the library…',
  },
  sources: [
    {id: 'VOL-12', title: 'Supply file: correspondence', passages: ['Party A sent written notice on Day 3.', 'The delivery schedule was attached.', 'Both parties kept a copy.']},
    {id: 'VOL-20', title: 'Meeting minutes', passages: ['Party B was notified by email.', 'The next meeting was set for Day 9.', 'A shipment was delayed in transit.']},
    {id: 'VOL-31', title: 'Warehouse log', passages: ['Pallets were counted and labelled.', 'Delivery confirmed at the loading dock.', 'Notice board updated by staff.']},
  ],
  citations: {pinpoint: '¶', withDate: false},
  dates: ['Day 4', 'Day 10', 'Day 12'],
};

/** Spanish counterparts for presets (fictional, illustrative). */
export const RESEARCH_DEFAULTS_ES = {
  query: {
    terms: [
      {text: 'aviso', related: ['notificada', 'informada']},
      {text: 'entrega', related: ['envío', 'entregado']},
    ],
    mode: 'exact',
    placeholder: 'Buscar en la biblioteca…',
  },
  sources: [
    {id: 'VOL-12', title: 'Expediente de suministro: cartas', passages: ['La parte A envió un aviso escrito el día 3.', 'Se adjuntó el calendario de entrega.', 'Ambas partes guardaron una copia.']},
    {id: 'VOL-20', title: 'Actas de reunión', passages: ['La parte B fue notificada por correo.', 'La próxima reunión quedó para el día 9.', 'Un envío se retrasó en el transporte.']},
    {id: 'VOL-31', title: 'Registro del almacén', passages: ['Se contaron y rotularon los palés.', 'Entrega confirmada en el muelle de carga.', 'El tablón de aviso fue actualizado.']},
  ],
  citations: {pinpoint: '¶', withDate: false},
  dates: ['Día 4', 'Día 10', 'Día 12'],
};
