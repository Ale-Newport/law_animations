/**
 * "Preguntas de contraste" kit (LAW-0293..0296, hearings-04): the generic,
 * fictional hearing room of ./interrogatorio-directo.js (witness box with its
 * turn tray, questioner beside the counter, turn rail along the top wall),
 * imported READ-ONLY, with this motif's own content and one addition.
 *
 * The concrete action — "two answers line up and one difference is
 * highlighted": a PREVIOUS answer (as supplied: a written record, here an
 * exhibit) is laid on the tray by the questioner and the CURRENT answer is
 * given by the witness; both slide onto the rail and stand side by side; then
 * the one textual difference supplied by the author is marked, with the SAME
 * neutral highlight, in both cards.
 *
 * ● previous answer and ◆ current answer are supplied sources of equal weight.
 * The highlight only marks a textual difference between two supplied answers,
 * as supplied: no inconsistency, contradiction, credibility, impeachment,
 * error, weight or outcome is shown or inferred; neither answer is marked as
 * wrong (no red, no strike-as-correction, no warning).
 * @module animations/hearings/kits/preguntas-contraste
 */
import {h, g} from '../../../core/svg.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {measure} from '../../../core/text.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {itRowNode} from './interrogatorio-directo.js';
import {textAt} from './apertura-audiencia.js';

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const pcFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one asks, one answers from the witness box, the others sit at the shared table. No rank, role rules or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 4),
  questioner: int('Index in `speakers` of the participant who puts the questions and lays out the previous answer (generic)', 0, 3),
  witness: int('Index in `speakers` of the participant in the witness box who gives the current answer (generic)', 0, 3),
  statements: list('Turns on the rail: a question, a PREVIOUS answer (as supplied, from a written record) or the CURRENT answer (given now). Nothing is assessed', obj('Turn', {
    kind: oneOf('question, previous (previous answer, ●) or current (current answer, ◆) — supplied sources only, never an assessment', ['question', 'previous', 'current']),
    text: str('Text of the turn (fictional)', 60),
    exhibit: int('Optional: index in `exhibits` the turn comes from or refers to (as supplied)', 0, 1),
  }, ['kind', 'text']), 2, 5),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 0, 2),
  sequence: list('Order in which the turns reach the rail (indices in `statements`): a sequence as configured (illustrative), not a rule. Turns left out follow in list order', int('Index in `statements`', 0, 4), 1, 5),
  difference: obj('The one textual difference supplied by the author: the words that differ, as they appear in the previous and in the current answer (marked the same way in both; nothing is concluded from it)', {
    previous: str('Words as they appear in the previous answer', 40),
    current: str('Words as they appear in the current answer', 40),
  }, ['previous', 'current']),
  states: obj('Captions of the two supplied sources of an answer', {
    previous: str('Caption of ● (previous answer, as supplied)', 50),
    current: str('Caption of ◆ (current answer, as supplied)', 50),
  }, ['previous', 'current']),
  labels: obj('Editable captions', {
    question: str('Caption of a question', 50),
    difference: str('Caption of the highlight (keep it a textual difference, as supplied)', 90),
    sequence: str('Caption of the order of the turns (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['question', 'difference', 'sequence', 'key']),
};

export const PC_EN = {
  hearing: {room: 'Hearing room 4 (fictional)'},
  speakers: [{label: 'Questioner (fictional)'}, {label: 'Witness (fictional)'}, {label: 'Participant C'}],
  questioner: 0,
  witness: 1,
  statements: [
    {kind: 'question', text: 'What colour was the van?'},
    {kind: 'previous', text: 'The van was grey', exhibit: 0},
    {kind: 'current', text: 'The van was white'},
  ],
  exhibits: ['Exhibit 1: earlier written answer'],
  sequence: [0, 1, 2],
  difference: {previous: 'grey', current: 'white'},
  states: {previous: 'Previous answer (as supplied)', current: 'Current answer (as supplied)'},
  labels: {question: 'Question (as supplied)', difference: 'Words that differ (as supplied)', sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const PC_ES = {
  hearing: {room: 'Sala de audiencias 4 (ficticia)'},
  speakers: [{label: 'Persona que pregunta (ficticia)'}, {label: 'Testigo (ficticio)'}, {label: 'Participante C'}],
  questioner: 0,
  witness: 1,
  statements: [
    {kind: 'question', text: '¿De qué color era la furgoneta?'},
    {kind: 'previous', text: 'La furgoneta era gris', exhibit: 0},
    {kind: 'current', text: 'La furgoneta era blanca'},
  ],
  exhibits: ['Prueba 1: respuesta escrita anterior'],
  sequence: [0, 1, 2],
  difference: {previous: 'gris', current: 'blanca'},
  states: {previous: 'Respuesta previa (según lo aportado)', current: 'Respuesta actual (según lo aportado)'},
  labels: {question: 'Pregunta (según lo aportado)', difference: 'Palabras que difieren (según lo aportado)', sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/**
 * Resolved params in the shape of the hearings-03 room kit (resolveIt): the previous answer is laid out by the
 * questioner (its slip lies with the question slips: a record, as supplied) and shows ●; the current answer is given
 * by the witness and shows ◆; a question shows the neutral "?" cue.
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolvePc(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const questioner = P.questioner < n ? P.questioner : 0;
  let witness = P.witness < n ? P.witness : 1;
  if (witness === questioner) witness = (questioner + 1) % n;
  const listeners = speakers.map(s => s.index).filter(i => i !== questioner && i !== witness);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const items = (P.statements || []).map((s, i) => {
    const source = s.kind === 'previous' ? 'previous' : s.kind === 'current' ? 'current' : null;
    const ex = exhibits.length && s.exhibit !== undefined && s.exhibit !== null ? Math.min(exhibits.length - 1, s.exhibit) : null;
    // (room kit: "question" = the slip lies with the questioner; the cue follows the form: open ●, bounded ◆, plain ?)
    return {i, kind: source === 'current' ? 'answer' : 'question', source, text: s.text, form: source === 'previous' ? 'open' : source === 'current' ? 'bounded' : 'plain', exhibit: ex, by: source === 'current' ? witness : questioner};
  });
  const order = [];
  for (const q of P.sequence || []) if (q < items.length && !order.includes(q)) order.push(q);
  for (let i = 0; i < items.length; i++) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  const prev = items.find(it => it.source === 'previous');
  const cur = items.find(it => it.source === 'current');
  return {n, speakers, questioner, witness, listeners, items, order, rank, exhibits, prevI: prev ? prev.i : null, curI: cur ? cur.i : null};
}

/** Legend rows of the sources present (● / ◆ first, equal weight), the question cue and the highlight. */
export function pcRows(R, P, prefix = 'lg') {
  const rows = [];
  if (R.items.some(it => it.source === 'previous')) rows.push({kind: 'legend', glyphKind: 'started', text: P.states.previous, name: `${prefix}-previous`});
  if (R.items.some(it => it.source === 'current')) rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.current, name: `${prefix}-current`});
  if (R.items.some(it => it.source === null)) rows.push({kind: 'legend', glyphKind: 'qplain', text: P.labels.question, name: `${prefix}-qplain`});
  return rows;
}

/**
 * Boxes (template units, at the card's final place) of the supplied words inside a card's text: one box per line the
 * words occupy. Null when the words are not found (the preset is then inconsistent; tests check it).
 * @param {any} G room geometry (cards carry their fitted text)
 * @param {number} i item index
 * @param {string} words
 */
export function spanBoxes(G, i, words) {
  const m = G.cards[i], s = G.slots[i];
  if (!m || !m.fit || !words) return null;
  const fit = m.fit;
  // (glued non-breaking spaces depend on the context: matched with plain spaces; offsets are unchanged)
  const plain = t => t.replace(/\u00a0/g, ' ');
  const want = plain(words);
  const lines = fit.lines;
  const joined = plain(lines.join(' '));
  const at = joined.indexOf(want);
  if (at < 0) return null;
  const end = at + want.length;
  const tx = s.x + m.padX + m.glyphW, ty = s.y + m.padY;
  const out = [];
  let off = 0;
  lines.forEach((ln, li) => {
    const a = Math.max(at, off), b = Math.min(end, off + ln.length);
    if (b > a) {
      const x0 = measure(ln.slice(0, a - off), fit.size, fit.weight, 'sans');
      const w = measure(ln.slice(a - off, b - off), fit.size, fit.weight, 'sans');
      out.push({x: tx + x0 - fit.size * 0.18, y: ty + li * fit.lineHeight - fit.size * 0.08, w: w + fit.size * 0.36, h: fit.size * 1.12});
    }
    off += ln.length + 1;
  });
  return out.length ? out : null;
}

/**
 * The highlight of the supplied differing words in one card: the same neutral band in every card (a light fill under
 * the words and a rounded outline), drawn in the room's coordinates and moving with the card.
 * @param {any} ctx
 * @param {string} name
 * @param {Array<any>|null} boxes spanBoxes()
 * @param {number} k room scale (for a constant on-screen stroke)
 */
export function highlightNode(ctx, name, boxes, k) {
  if (!boxes) return null;
  const th = ctx.theme;
  return g({name, opacity: 0, transform: 'translate(0 0)'}, boxes.map((b, bi) => g(null,
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2.6, 8)), fill: th.accent3, 'fill-opacity': 0.2, stroke: 'none'}),
    h('path', {name: `${name}-band${bi}`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2.6, 8)), fill: 'none', stroke: th.accent3, 'stroke-width': r(3.2 / k, 2)}))));
}

/** Panel row node: the highlight swatch, else the room kit's rows. */
export function pcRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && m.glyphKind === 'diffmark') {
    const th = ctx.theme;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    const w = m.glyph * 0.86, hh = m.glyph * 0.5;
    const glyph = g(null,
      h('path', {d: roundRectPath(gx - w / 2, gy - hh / 2, w, hh, hh / 2.6), fill: th.accent3, 'fill-opacity': 0.2}),
      h('path', {d: roundRectPath(gx - w / 2, gy - hh / 2, w, hh, hh / 2.6), fill: 'none', stroke: th.accent3, 'stroke-width': 3}));
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return itRowNode(ctx, m, o);
}

/**
 * Boxes (design units) of the supplied words inside a laid-out panel row (legend layout: glyph, then the text).
 * @param {any} m a laid-out row (x, y, h, glyph, fit)
 * @param {string} words
 */
export function rowSpanBoxes(m, words) {
  if (!m || !m.fit || !words) return null;
  const fit = m.fit;
  const plain = t => t.replace(/\u00a0/g, ' ');
  const joined = plain(fit.lines.join(' '));
  const at = joined.indexOf(plain(words));
  if (at < 0) return null;
  const end = at + words.length;
  const tx = m.x + m.glyph + fit.size * 0.6, ty = m.y + Math.max(0, (m.h - fit.height) / 2);
  const out = [];
  let off = 0;
  fit.lines.forEach((ln, li) => {
    const a = Math.max(at, off), b = Math.min(end, off + ln.length);
    if (b > a) {
      const x0 = measure(ln.slice(0, a - off), fit.size, fit.weight, 'sans');
      const w = measure(ln.slice(a - off, b - off), fit.size, fit.weight, 'sans');
      out.push({x: tx + x0 - fit.size * 0.18, y: ty + li * fit.lineHeight - fit.size * 0.08, w: w + fit.size * 0.36, h: fit.size * 1.12});
    }
    off += ln.length + 1;
  });
  return out.length ? out : null;
}
