/**
 * Metadata helper so every entry carries the same serializable fields.
 * Legal content defaults are illustrative and unverified by design.
 * @module core/meta
 */

export const SCHEMA_VERSION = 1;

/**
 * @param {object} m
 * @param {string} m.id
 * @param {string} m.slug
 * @param {string} m.title          English display title
 * @param {string} m.titleEs        Spanish display title (from the brief)
 * @param {string} m.category
 * @param {string} m.categoryName
 * @param {string} m.motif
 * @param {'story'|'mechanism'|'contrast'|'inspect'} m.treatment
 * @param {string} m.family
 * @param {string} m.description
 * @param {string[]} m.tags
 * @param {number} m.defaultDurationMs
 * @param {string[]} m.assets        shared modules/primitives this entry composes
 */
export function makeMetadata(m) {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    titleEs: m.titleEs,
    category: m.category,
    categoryName: m.categoryName,
    motif: m.motif,
    treatment: m.treatment,
    family: m.family,
    description: m.description,
    tags: m.tags,
    durations: {defaultMs: m.defaultDurationMs, minMs: 1000, maxMs: 60000, designedFor: [2000, 6000, 12000]},
    sizes: ['16:9', '9:16', '1:1'],
    compatibility: {
      runtime: 'javascript-esm-svg',
      requiresDom: 'create() only; importing is DOM-free',
      themes: ['editorial-flat'],
      locales: ['en', 'es'],
      palettes: ['editorial', 'slate', 'warm', 'mono'],
      backgrounds: ['transparent', 'paper', 'white', 'light-grey', 'charcoal', '#rrggbb'],
    },
    content: {
      jurisdiction: 'unspecified',
      legalStatus: 'illustrative-unverified',
      asOfDate: null,
      sources: [],
      fictionalExample: true,
      note: 'Visual illustration only. It does not state the law of any jurisdiction or decide validity, responsibility or outcomes.',
    },
    schemaVersion: SCHEMA_VERSION,
    assets: m.assets,
    license: 'Original vector artwork and code created for this project; no third-party assets.',
  };
}
