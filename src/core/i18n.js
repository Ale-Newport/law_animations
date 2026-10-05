/**
 * Built-in UI strings. User-supplied content is never translated.
 * @module core/i18n
 */

const STRINGS = {
  en: {
    illustrative: 'Illustrative example',
    fictional: 'fictional',
    jurisdictionUnspecified: 'jurisdiction unspecified',
    jurisdiction: 'jurisdiction',
    scenarioA: 'Scenario A',
    scenarioB: 'Scenario B',
    changedFact: 'Changed fact',
    sameFacts: 'Same facts',
    before: 'Before',
    after: 'After',
    changed: 'Changed',
    detail: 'Detail',
    context: 'Context',
    relation: 'relation',
    communication: 'communication',
    sequence: 'sequence',
    causal: 'causal (as supplied)',
    alleged: 'alleged',
    disputed: 'disputed',
    sent: 'Sent',
    received: 'Received',
    pending: 'Pending',
    signed: 'Signed',
    unsigned: 'Unsigned',
    step: 'Step',
    speaking: 'speaking',
    waiting: 'waiting',
    turn: 'Turn',
    loss: 'Loss (as described)',
    noOutcome: 'No outcome shown',
  },
  es: {
    illustrative: 'Ejemplo ilustrativo',
    fictional: 'ficticio',
    jurisdictionUnspecified: 'jurisdicción no especificada',
    jurisdiction: 'jurisdicción',
    scenarioA: 'Supuesto A',
    scenarioB: 'Supuesto B',
    changedFact: 'Hecho cambiado',
    sameFacts: 'Mismos hechos',
    before: 'Antes',
    after: 'Después',
    changed: 'Cambiado',
    detail: 'Detalle',
    context: 'Contexto',
    relation: 'relación',
    communication: 'comunicación',
    sequence: 'secuencia',
    causal: 'causal (según lo aportado)',
    alleged: 'alegado',
    disputed: 'discutido',
    sent: 'Enviada',
    received: 'Recibida',
    pending: 'Pendiente',
    signed: 'Firmado',
    unsigned: 'Sin firmar',
    step: 'Paso',
    speaking: 'habla',
    waiting: 'espera',
    turn: 'Turno',
    loss: 'Pérdida (según se describe)',
    noOutcome: 'Sin desenlace',
  },
};

/**
 * @param {'en'|'es'} locale
 * @param {Record<string, Record<string,string>>} [extra] scene-specific strings
 */
export function strings(locale, extra) {
  const base = STRINGS[locale] || STRINGS.en;
  const add = extra ? extra[locale] || extra.en || {} : {};
  return {...base, ...add};
}
