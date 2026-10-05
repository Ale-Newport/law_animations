/**
 * Parameter fields, defaults and built-in strings for the "Historial de una
 * norma" motif (LAW-0049..0052). The research category has no shared field
 * set in src/schemas/fields.js yet, so this local set is built only from the
 * shared builders (query / sources / citations / dates from the briefs, plus
 * the versions that form the temporal layers).
 *
 * Content rules encoded here:
 *  - the provision, its versions, dates and wording are fictional and
 *    illustrative (simulated text, jurisdiction unspecified);
 *  - `selectedVersion` is SUPPLIED by the author: the scene never computes
 *    which version applies on a date, it only shows the layer the author marks
 *    for the selected date and the layers that come later;
 *  - no validity, effect or outcome is inferred from the selection.
 * @module animations/research/kits/historial-fields
 */
import {str, int, list, obj, party} from '../../../schemas/fields.js';

/** One temporal layer (version) of the fictional provision. */
export const versionField = obj('One version of the fictional provision (one temporal layer), oldest first', {
  label: str('Version label printed on the layer header, e.g. "Version 2"', 30),
  from: str('Start date printed on the layer (free text, fictional)', 40),
  text: str('Short wording excerpt shown as the highlighted passage (simulated text)', 90),
}, ['label', 'from']);

/** Category fields for research, specialised for this motif. */
export const historialFields = {
  query: str('Text typed into the search box (fictional reference)', 80),
  sources: list('Source names; the first is the library section sign, all are listed in the mechanism (fictional)', str('Source name', 60), 1, 4),
  citations: list('Citation(s) of the fictional provision; the first is printed on the volume, the search result and the research card', str('Citation', 90), 1, 3),
  dates: obj('Dates used by the scene (free text, fictional)', {
    selected: str('The date the researcher selects; it is written on the research card', 30),
  }, ['selected']),
  versions: list('Versions of the provision, oldest first; each is one temporal layer', versionField, 2, 4),
  selectedVersion: int('Index (0 = oldest) of the layer the author marks for the selected date. Supplied, never computed: the scene does not decide which version applies.', 0, 3),
};

/** Optional researcher (story / contrast / inspect stations). */
export const researcherField = {
  researcher: party,
};

/** Default category values (English, fictional, illustrative). */
export const HISTORIAL_DEFAULTS = {
  query: 'Example Act art. 12',
  sources: ['Consolidated texts', 'Official journal (fictional)', 'Commentaries'],
  citations: ['Example Act (fictional), art. 12'],
  dates: {selected: '14 Jun 2021'},
  versions: [
    {label: 'Version 1', from: 'from 1 Mar 2016', text: 'The form is filed on paper.'},
    {label: 'Version 2', from: 'from 15 Sep 2019', text: 'The form is filed on paper or online.'},
    {label: 'Version 3', from: 'from 1 Jan 2023', text: 'The form is filed online.'},
  ],
  selectedVersion: 1,
};

/** Spanish counterparts for presets. */
export const HISTORIAL_DEFAULTS_ES = {
  query: 'Ley de ejemplo art. 12',
  sources: ['Textos consolidados', 'Diario oficial (ficticio)', 'Comentarios'],
  citations: ['Ley de ejemplo (ficticia), art. 12'],
  dates: {selected: '14 jun 2021'},
  versions: [
    {label: 'Versión 1', from: 'desde 1 mar 2016', text: 'El formulario se presenta en papel.'},
    {label: 'Versión 2', from: 'desde 15 sep 2019', text: 'El formulario se presenta en papel o en línea.'},
    {label: 'Versión 3', from: 'desde 1 ene 2023', text: 'El formulario se presenta en línea.'},
  ],
  selectedVersion: 1,
};

/** Built-in scene strings (user content is never translated). */
export const HISTORIAL_STRINGS = {
  en: {
    selectedDate: 'Selected date',
    later: 'Later version',
    earlier: 'Earlier',
    selectedLayer: 'Layer marked for the date',
    versionsCount: 'versions',
    searchHeader: 'Catalogue search',
    date: 'Date',
    located: 'Located',
    cardHeader: 'Research card',
    volume: 'Consolidated file',
    passage: 'Passage',
    timeAxis: 'time',
  },
  es: {
    selectedDate: 'Fecha seleccionada',
    later: 'Versión posterior',
    earlier: 'Anterior',
    selectedLayer: 'Capa marcada para la fecha',
    versionsCount: 'versiones',
    searchHeader: 'Buscador del catálogo',
    date: 'Fecha',
    located: 'Localizado',
    cardHeader: 'Ficha de consulta',
    volume: 'Archivo consolidado',
    passage: 'Pasaje',
    timeAxis: 'tiempo',
  },
};

/**
 * Normalised selection: clamps the supplied index to the available layers.
 * @param {{versions:any[], selectedVersion:number}} p
 */
export function selectedIndex(p) {
  return Math.max(0, Math.min(p.versions.length - 1, p.selectedVersion ?? 0));
}
