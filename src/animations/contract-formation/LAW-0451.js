/**
 * LAW-0451 — Retirada de propuesta · contrast
 *
 * Storyboard (two complete, identical stages — the story's two parties, their
 * pigeonhole racks, the proposal card ● and the withdrawal card ◆ — side by
 * side on wide frames, one above the other on tall ones; the same text size,
 * the same figure size, the same sending moments):
 *  0.00–0.17  base: both scenes are the same situation: A's outgoing rack holds
 *             the proposal and the withdrawal message (face up, readable), B's
 *             incoming rack is empty. Nothing differs.
 *  0.17–0.40  change (from 0.24): the scenario labels appear — A «Withdrawal
 *             communicated», B «Time sequence to be examined» — and each strip
 *             "Sequence as supplied (illustrative)" lays out its empty slots:
 *             in A the two receipts are supplied one after the other (two
 *             slots); in B they are supplied with one position (one slot inside
 *             a dashed bracket "order to be examined"). That is the one changed
 *             fact: the supplied order of the two receipts.
 *  0.40–0.77  parallel action: in both scenes A sends the proposal and then the
 *             withdrawal at the same moments; the routes cross; in A the cards
 *             land one after the other in the supplied order, in B both land
 *             together at the bracketed slot (their order is not depicted).
 *  0.77–1.00  guide: the receipt slots of both strips are outlined and tagged
 *             with the same Δ marker as the guide chip below; the changed fact,
 *             the shared facts, the neutral note and the key. No winner, no
 *             score, no effect of the withdrawal, no "in time", no revocation.
 * @module animations/contract-formation/LAW-0451
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  motifFields, sequenceItem, DEFAULT_CONTENT, KIT_STRINGS, INK, DEFAULT_PX, layoutScene, buildScene, poseScene,
  fitW, chipW, overlaps, insideBox, unionBox, stationsOf, glyph,
  localizeScene,
} from './kits/retirada-propuesta.js';

const ID = 'LAW-0451';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
/** First moment the two scenes differ. */
const CHANGE = 0.24;
/** The events of both scenes run over [EV0, …] with the same pitch (the same sending moments). */
const EV0 = 0.44, EV1 = 0.72;
const W = {headers: [0.24, 0.3], strip: [0.26, 0.33], bracket: [0.32, 0.38], shrink: [0.77, 0.8], rings: [0.79, 0.84], guide: [0.81, 0.86], key: [0.83, 0.88]};

const STRINGS = {
  en: {...KIT_STRINGS.en, partiesT: 'Left: {a} · right: {b}', same: 'Same in both scenes', bothP: 'On both proposal cards', bothW: 'On both withdrawal messages'},
  es: {...KIT_STRINGS.es, partiesT: 'Izquierda: {a} · derecha: {b}', same: 'Igual en ambas escenas', bothP: 'En ambas propuestas', bothW: 'En ambas retiradas'},
};

const scenario = (which, lab) => obj(`Scenario ${which}`, {
  label: str(`Short label for scenario ${which}`, 50),
  caption: str('One-line description', 90),
  sequence: list(`The journeys as supplied in scenario ${which} (2–4 events, in the order shown; events with one position are shown together, order to be examined). Only ${lab} should differ from the other scenario`, sequenceItem, 2, 4),
}, ['label', 'sequence']);

const sceneSchema = {
  ...motifFields,
  sequence: undefined,
  scenarioA: scenario('A', 'the changed fact'),
  scenarioB: scenario('B', 'the changed fact'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};
delete sceneSchema.sequence;

const SENT = DEFAULT_CONTENT.sequence.slice(0, 2);
const defaultParams = {
  parties: DEFAULT_CONTENT.parties,
  offer: DEFAULT_CONTENT.offer,
  terms: DEFAULT_CONTENT.terms,
  responses: DEFAULT_CONTENT.responses,
  scenarioA: {
    label: 'Withdrawal communicated',
    caption: 'Receipts supplied in order',
    sequence: DEFAULT_CONTENT.sequence,
  },
  scenarioB: {
    label: 'Time sequence to be examined',
    caption: 'Receipts supplied without an order',
    sequence: [...SENT, {event: 'withdrawal-received', time: 'Day 2 (fictional)', position: 3}, {event: 'proposal-received', time: 'Day 2 (fictional)', position: 3}],
  },
  changedFact: 'Only the order of the receipts differs',
  sharedFacts: ['Same messages, parties and sending times'],
  comparisonLabels: {guide: 'Receipts: in order (A) · to be examined (B)', neutral: ''},
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  "parties": [
    {
      "name": "Nadia Park",
      "role": "Parte A"
    },
    {
      "name": "Tomás Ribeiro",
      "role": "Parte B"
    }
  ],
  "offer": {
    "reference": "OF-2041",
    "title": "Propuesta de suministro"
  },
  "terms": [
    {
      "key": "item",
      "label": "Artículo",
      "value": "Sillas de roble"
    },
    {
      "key": "quantity",
      "label": "Cantidad",
      "value": "40"
    }
  ],
  "responses": [
    {
      "reference": "RT-2041",
      "text": "Retirada de la propuesta OF-2041"
    }
  ],
  "scenarioA": {
    "label": "Retirada comunicada",
    "caption": "Recepciones en orden",
    "sequence": [
      {
        "event": "proposal-sent",
        "time": "Día 1, 09:00 (ficticio)"
      },
      {
        "event": "withdrawal-sent",
        "time": "Día 1, 11:00 (ficticio)"
      },
      {
        "event": "withdrawal-received",
        "time": "Día 2, 10:00 (ficticio)"
      },
      {
        "event": "proposal-received",
        "time": "Día 2, 16:00 (ficticio)"
      }
    ]
  },
  "scenarioB": {
    "label": "Secuencia temporal por examinar",
    "caption": "Recepciones sin orden",
    "sequence": [
      {
        "event": "proposal-sent",
        "time": "Día 1, 09:00 (ficticio)"
      },
      {
        "event": "withdrawal-sent",
        "time": "Día 1, 11:00 (ficticio)"
      },
      {
        "event": "withdrawal-received",
        "time": "Día 2 (ficticio)",
        "position": 3
      },
      {
        "event": "proposal-received",
        "time": "Día 2 (ficticio)",
        "position": 3
      }
    ]
  },
  "changedFact": "Solo cambia el orden de las recepciones",
  "sharedFacts": [
    "Mismos mensajes, partes y envíos"
  ],
  "comparisonLabels": {
    "guide": "Recepciones: en orden (A) · por examinar (B)",
    "neutral": ""
  }
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** Δ marker (ink disc, white triangle): the same mark on both outlined slots and on the guide chip. */
function deltaMark(ctx, {name, x, y, R, opacity}) {
  const s = R * 0.46;
  return g({name, opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: INK, stroke: ctx.theme.paper, 'stroke-width': r(Math.max(2.5, R * 0.18))}),
    h('path', {d: `M${r(x)} ${r(y - s)}l${r(s)} ${r(s * 1.7)}h${r(-2 * s)}z`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(2.5, R * 0.18)), 'stroke-linejoin': 'round'}));
}

/** Scenario header: letter disc (the same ink for both), label, caption (wrapped, never cut). */
function measureHeader(ctx, {F, FL, w, letter, label, caption}) {
  const R = FL * 0.85;
  const out = {R, letter: null, label: null, caption: null, h: R * 2 + 4, bad: false};
  if (ctx.show('key')) {
    out.letter = fitW(letter, {maxWidth: R * 2, size: FL, maxLines: 1, weight: 800});
    out.label = fitW(label, {maxWidth: w - R * 2 - F * 0.8, size: FL, maxLines: 2, weight: 800});
    let hh = out.label.height;
    if (caption && ctx.show('all')) {
      out.caption = fitW(caption, {maxWidth: w - R * 2 - F * 0.8, size: F, maxLines: 3, weight: 500});
      hh += out.label.size * 0.45 + out.caption.height;
    }
    out.h = Math.max(out.h, hh + 4);
    out.bad = out.letter.bad || out.label.bad || Boolean(out.caption && out.caption.bad);
  }
  return out;
}

function headerArt(ctx, M, {name, x, y}) {
  const th = ctx.theme;
  // (labels hidden: no letter disc — a disc without its letter says nothing)
  const parts = ctx.show('key') ? [h('circle', {cx: r(x + M.R), cy: r(y + M.R + 2), r: r(M.R), fill: th.fg, stroke: INK, 'stroke-width': 2.4})] : [];
  if (M.letter) parts.push(textBlock(M.letter, {x: x + M.R, y: y + M.R + 2 - M.letter.size * 0.45, anchor: 'middle', fill: '#ffffff'}));
  const tx = x + M.R * 2 + M.R * 0.6;
  if (M.label) parts.push(textBlock(M.label, {x: tx, y, fill: th.fg}));
  if (M.caption) parts.push(textBlock(M.caption, {x: tx, y: y + M.label.height + M.label.size * 0.45, fill: th.fgSoft}));
  return g({name, opacity: 0}, parts);
}

/** Footer chips (guide, changed fact, shared facts, card texts when the cards are compact, neutral note, key). */
function footerItems(ctx, p, mode) {
  const t = ctx.t;
  const items = [];
  if (ctx.show('all')) {
    items.push({name: 'guide', text: p.comparisonLabels.guide, weight: 700, mark: true});
    if (p.changedFact) items.push({name: 'changed', text: p.changedFact, weight: 600});
    // (one shared fact stands on its own; several are listed under "same in both scenes")
    if (p.sharedFacts.length) items.push({name: 'shared', text: p.sharedFacts.length === 1 ? p.sharedFacts[0] : `${t.same}: ${p.sharedFacts.join(' · ')}`, weight: 500});
    const who = q => q.name;
    items.push({name: 'parties', text: t.partiesT.replace('{a}', who(p.parties[0])).replace('{b}', who(p.parties[1])), weight: 600});
    if (mode === 'token') items.push({name: 'cardP', text: `${t.proposal} ${p.offer.reference}: ${[p.offer.title, ...p.terms.map(q => `${q.label}: ${q.value}`)].join(' · ')}`, weight: 500});
    else if (mode !== 'full') items.push({name: 'cardP', text: `${t.bothP}: ${[p.offer.title, ...p.terms.map(q => `${q.label}: ${q.value}`)].join(' · ')}`, weight: 500});
    if (mode === 'token') items.push({name: 'cardW', text: `${t.withdrawal} ${p.responses[0].reference}: ${p.responses[0].text}`, weight: 500});
    else if (mode === 'head') items.push({name: 'cardW', text: `${t.bothW}: ${p.responses[0].text}`, weight: 500});
    // (an empty neutral note is left out: the key already says that no conclusion is drawn)
    if (p.comparisonLabels.neutral) items.push({name: 'neutral', text: p.comparisonLabels.neutral, weight: 500});
  }
  if (ctx.show('key')) items.push({name: 'key', text: t.key, weight: 600, label: true});
  return items;
}

/** Flow the footer chips in centred rows across width w, from y0. */
function flowFooter(ctx, items, {F, FL, x0, y0, w, lines = 3}) {
  const th = ctx.theme;
  const markR = F * 0.62;
  const chips = items.map(it => {
    const markW = it.mark ? markR * 2 + F * 0.4 : 0;
    const maxW = Math.min(w * 0.94, 40 * F) - markW;
    const c = chipW(ctx, it.text, {x: 0, y: 0, maxWidth: maxW, size: it.label ? FL : F, maxLines: lines, weight: it.weight, stroke: th.inkSoft});
    return {it, c, w: c.box.w + markW, markW, maxW, lines};
  });
  const rows = [];
  let cur = [], cw = 0;
  for (const q of chips) {
    if (cur.length && cw + F * 0.8 + q.w > w) { rows.push(cur); cur = []; cw = 0; }
    cw += (cur.length ? F * 0.8 : 0) + q.w;
    cur.push(q);
  }
  if (cur.length) rows.push(cur);
  let y = y0;
  const placed = [];
  for (const row of rows) {
    const rw = row.reduce((s0, q) => s0 + q.w, 0) + F * 0.8 * (row.length - 1);
    let x = x0 + (w - rw) / 2;
    const rh = Math.max(...row.map(q => q.c.box.h));
    for (const q of row) { placed.push({...q, x, y: y + (rh - q.c.box.h) / 2}); x += q.w + F * 0.8; }
    y += rh + F * 0.3;
  }
  const flow = {h: rows.length ? y - y0 - F * 0.3 : 0, placed, bad: chips.some(q => q.c.fit.bad), markR};
  // two columns (wide boxes): each chip in the shorter column, wrapped to the column width; kept when lower
  if (w >= 36 * F && items.length > 2) {
    const cw2 = (w - F) / 2;
    const col = [0, 0];
    const placed2 = [];
    let bad2 = false;
    for (const it of items) {
      const markW = it.mark ? markR * 2 + F * 0.4 : 0;
      const maxW = cw2 - markW;
      const c = chipW(ctx, it.text, {x: 0, y: 0, maxWidth: maxW, size: it.label ? FL : F, maxLines: 6, weight: it.weight, stroke: th.inkSoft});
      if (c.fit.bad) bad2 = true;
      const k = col[0] <= col[1] ? 0 : 1;
      const cx = x0 + k * (cw2 + F) + (cw2 - c.box.w - markW) / 2;
      placed2.push({it, c, w: c.box.w + markW, markW, maxW, lines: 6, x: cx, y: y0 + col[k]});
      col[k] += c.box.h + F * 0.3;
    }
    const h2 = Math.max(...col) - F * 0.3;
    if (!bad2 && (flow.bad || h2 < flow.h - F * 0.5)) return {h: h2, placed: placed2, bad: false, markR};
  }
  return flow;
}

/** Per-scene windows: the same pitch in both scenes, so the sending moments are the same. */
function evWindows(p) {
  const nA = stationsOf(p.scenarioA.sequence).stations.length, nB = stationsOf(p.scenarioB.sequence).stations.length;
  const pitch = (EV1 - EV0) / Math.max(1, Math.max(nA, nB) - 1);
  return [[EV0, EV0 + pitch * Math.max(0, nA - 1)], [EV0, EV0 + pitch * Math.max(0, nB - 1)]];
}

/**
 * The comparison table: one row per event (A's listed order), one column per scenario. Each cell: the event's
 * position in that scenario's supplied order (a numbered disc) and its fictional time label. Events supplied with one
 * position in a scenario share one number there, inside a dashed bracket "order to be examined". The rows are shared
 * labels (●/◆ and the event), so the comparison reads across. Returns null when it does not fit the width.
 */
function measureTable(ctx, p, {F, FL, w, force, tight}) {
  const show = ctx.show('all');
  const seqs = [p.scenarioA.sequence, p.scenarioB.sequence];
  const sts = seqs.map(q => stationsOf(q).stations);
  const rows = [];
  for (const st of [...sts[0], ...sts[1]]) for (const ev of st.events) if (!rows.includes(ev.event)) rows.push(ev.event);
  const where = sts.map(st => {
    const m = {};
    st.forEach((s0, i) => s0.events.forEach((ev, j) => { m[ev.event] = {i, j, n: i + 1, grouped: s0.grouped, time: ev.time}; }));
    return m;
  });
  const R = F * 0.52, nR = F * 0.62;
  const disc = FL * 0.85;
  // (a tight table also tries narrow time columns: a label on up to three lines)
  for (const [vF, tF] of [[11, 13], [10, 11], [9, 10], [8, 9], [7.5, 7.5], ...(tight ? [[8, 6.5], [8, 6]] : []), [7, 7]]) {
    const verbs = rows.map(e => (show ? fitW(ctx.t[e], {maxWidth: vF * F - R * 2 - F * 0.5, size: F, maxLines: 2, weight: 700}) : null));
    // (a tight table lets a time label take three lines)
    const times = where.map(m => rows.map(e => (show && m[e] ? fitW(m[e].time, {maxWidth: tF * F - F * 0.9, size: F, maxLines: tight ? 3 : 2, weight: 600}) : null)));
    const nums = where.map(m => rows.map(e => (ctx.show('key') && m[e] ? fitW(String(m[e].n), {maxWidth: nR * 2, size: F, maxLines: 1, weight: 800}) : null)));
    const last = vF === 7;
    if ([...verbs, ...times.flat(), ...nums.flat()].some(f => f && f.bad) && !(force && last)) continue;
    const tag = show && where[1] && sts.some(st => st.some(q => q.grouped)) ? fitW(ctx.t.toExamine, {maxWidth: tF * F, size: F, maxLines: 2, weight: 700}) : null;
    if (tag && tag.bad && !(force && last)) continue;
    let verbW = Math.max(F * 4, ...verbs.map(f => (f ? f.width : 0))) + R * 2 + F * 0.5;
    let cellW = nR * 2 + F * 0.4 + Math.max(F * 3, ...times.flat().map(f => (f ? f.width + F * 0.9 : 0)));
    // (labels hidden or key only: no text sets the widths — the table spans the width it is given, like the stages)
    if (!show && !tight) { verbW = Math.max(verbW, w * 0.16); cellW = Math.max(cellW, (w * 0.97 - verbW - F * 2.4 - (F * 0.62 * 2 + F * 0.6)) / 2); }
    // (tight: the Δ mark sits above the ring instead of beside it, and the columns are closer)
    const markW = tight ? 0 : F * 0.62 * 2 + F * 0.6;
    const colGap = tight ? F * 0.6 : F * 1.2;
    const tw = verbW + colGap + cellW + colGap + cellW + markW;
    if (tw > w && !(force && last)) continue;
    const rowH = rows.map((e, k) => Math.max(nR * 2 * (show ? 1 : 1.35), verbs[k] ? verbs[k].height : R * 2, ...times.map(t => (t[k] ? t[k].height + F * 0.45 : 0))));
    const headH = disc * 2 + F * 0.3;
    const title = show ? fitW(ctx.t.seqTitle, {maxWidth: tw - markW, size: F, maxLines: 2, weight: 700}) : null;
    if (title && title.bad && !(force && last)) continue;
    const rowGap = F * 0.45;
    // room under a bracketed block for its legend
    const legendH = tag ? tag.height + F * 0.75 : F * 0.3;
    const extra = rows.map(e => (where.some(m => m[e] && m[e].grouped && rows.filter(x => m[x] && m[x].grouped && m[x].i === m[e].i).slice(-1)[0] === e) ? legendH : 0));
    const bodyH = rowH.reduce((a, q) => a + q, 0) + rowGap * (rows.length - 1) + extra.reduce((a, q) => a + q, 0);
    return {rows, where, sts, verbs, times, nums, tag, verbW, cellW, colGap, markW, w: tw, rowH, rowGap, extra, headH, title, R, nR, disc, bodyH, titleH: title ? title.height + F * 0.4 : 0, h: 0};
  }
  return null;
}

/** Positions of the table's parts (x0,y0 = the table's top-left; titleH may have grown for the top chips). */
function tableGeom(TB, F, x0, y0) {
  const colX = [x0 + TB.verbW + TB.colGap, x0 + TB.verbW + TB.colGap * 2 + TB.cellW];
  const headY = y0 + TB.titleH;
  let y = headY + TB.headH;
  const rowY = TB.rows.map((e, k) => { const yy = y; y += TB.rowH[k] + TB.rowGap + TB.extra[k]; return yy; });
  const cell = (c, k) => ({x: colX[c], y: rowY[k] - F * 0.15, w: TB.cellW, h: TB.rowH[k] + F * 0.3});
  return {colX, headY, rowY, cell, bottom: y - TB.rowGap};
}

/** The table's art: row labels, per-scenario cells named like a strip's stations (poseScene fades them in). */
function tableArt(ctx, TB, T0, F) {
  const th = ctx.theme;
  const nodes = [];
  const rowsArt = [];
  TB.rows.forEach((e, k) => {
    const y = T0.rowY[k];
    const kids = [glyph(ctx, e.startsWith('proposal') ? 'proposal' : 'withdrawal', T0.colX[0] - TB.colGap - TB.verbW + TB.R, y + TB.R * 1.1, TB.R)];
    if (TB.verbs[k]) kids.push(textBlock(TB.verbs[k], {x: T0.colX[0] - TB.colGap - TB.verbW + TB.R * 2 + F * 0.35, y, fill: th.fg}));
    rowsArt.push(...kids);
  });
  nodes.push(g({name: 'tbl-rows', opacity: 0}, rowsArt));
  const strips = [];
  ['a', 'b'].forEach((P, c) => {
    const m = TB.where[c];
    const st = TB.sts[c];
    const x = T0.colX[c];
    const stations = st.map((s0, i) => {
      const ks = s0.events.map(ev => TB.rows.indexOf(ev.event));
      const boxes = ks.map(k => T0.cell(c, k));
      const ub = unionBox(boxes);
      const kids = [h('path', {name: `${P}-seq-ph${i}`, d: roundRectPath(ub.x - F * 0.2, ub.y, ub.w + F * 0.4, ub.h, 10), fill: th.card, 'fill-opacity': 0.55, stroke: th.inkFaint, 'stroke-width': 1.6})];
      const evNodes = s0.events.map((ev, j) => {
        const k = ks[j];
        const y = T0.rowY[k];
        // (labels hidden: the step shows the message's own ●/◆ glyph instead of a numbered disc)
        const parts = ctx.show('key') ? [h('circle', {cx: r(x + TB.nR), cy: r(y + TB.nR), r: r(TB.nR), fill: th.fg, stroke: INK, 'stroke-width': 2})] : [glyph(ctx, ev.msg, x + TB.nR, y + TB.nR, TB.nR * 0.8)];
        if (TB.nums[c][k]) parts.push(textBlock(TB.nums[c][k], {x: x + TB.nR, y: y + TB.nR - TB.nums[c][k].size * 0.45, anchor: 'middle', fill: '#ffffff'}));
        const tf = TB.times[c][k];
        if (tf) {
          const tw = tf.width + F * 0.9, tH = tf.height + F * 0.45;
          const tx = x + TB.nR * 2 + F * 0.4;
          parts.push(h('path', {d: roundRectPath(tx, y - F * 0.05, tw, tH, Math.min(tH / 2, F * 0.6)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}));
          parts.push(textBlock(tf, {x: tx + tw / 2, y: y + F * 0.18, anchor: 'middle', fill: INK}));
        }
        kids.push(g({name: `${P}-seq-s${i}-e${j}`, opacity: 0}, parts));
        return {box: T0.cell(c, k)};
      });
      if (s0.grouped) {
        // dashed bracket = "to be examined" (the only dashed element), its legend on the lower edge
        const lh0 = TB.tag ? TB.tag.height + F * 0.4 : 0;
        const bb = {x: ub.x - F * 0.35, y: ub.y - F * 0.1, w: ub.w + F * 0.7, h: ub.h + F * 0.2 + lh0 / 2};
        kids.push(h('path', {name: `${P}-seq-s${i}-br`, d: roundRectPath(bb.x, bb.y, bb.w, bb.h, 12), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '9 7', opacity: 0}));
        if (TB.tag) {
          const lw = TB.tag.width + F * 0.9, lh = TB.tag.height + F * 0.4;
          const lx = bb.x + bb.w / 2 - lw / 2, ly = bb.y + bb.h - lh / 2;
          kids.push(g({name: `${P}-seq-s${i}-tag`, opacity: 0},
            h('path', {d: roundRectPath(lx, ly, lw, lh, Math.min(lh / 2, F * 0.6)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
            textBlock(TB.tag, {x: lx + lw / 2, y: ly + F * 0.2, anchor: 'middle', fill: th.fg})));
        }
      }
      nodes.push(g({name: `${P}-seq-s${i}`}, kids));
      return {evNodes, box: ub};
    });
    strips.push({stations, titleBox: null, node: null});
    void m;
  });
  return {node: g({name: 'tbl'}, nodes), strips};
}

/** Receipt rows (events "received") across both columns, as one box. */
function receiptRows(TB, T0) {
  const ks = TB.rows.map((e, k) => (e.endsWith('received') ? k : -1)).filter(k => k >= 0);
  if (!ks.length) return null;
  // (with the room kept under the last receipt row for a bracket's legend)
  const u0 = unionBox(ks.flatMap(k => [T0.cell(0, k), T0.cell(1, k)]));
  const last = Math.max(...ks);
  return {...u0, h: u0.h + TB.extra[last] * 0.85};
}

function compose(ctx, px, arr, mode, o = {}) {
  const p = ctx.params;
  const D = ctx.design;
  const upx = unitPx(ctx);
  const F = px.F / upx, FL = px.L / upx;
  const why = [];
  const box = {x: 6, y: 4, w: D.w - 12, h: D.h - 8};
  // (a right-hand text column: the stacked stages sit closer, so the figures get the height)
  const gap = arr === 'colR' ? F * 0.6 : F * 1.1;
  const pad = F * 0.5;
  // 'row': the two stages side by side · 'stack': one above the other; the table and the footer below them
  // 'colR' (square frames): the two stages stacked in a left column, the table and the notes in a right-hand column
  const colR = arr === 'colR';
  const leftW = colR ? box.w * (o.c ?? 0.46) : 0;
  const colW = colR ? box.w - leftW - gap : 0;
  const panelW = arr === 'row' ? (box.w - gap) / 2 : colR ? leftW : box.w;
  const hd = [0, 1].map(i => measureHeader(ctx, {F, FL, w: panelW - pad * 2, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption}));
  if (hd.some(x => x.bad)) { if (!o.force) return null; why.push('fit'); }
  const hh = Math.max(hd[0].h, hd[1].h);
  // (o.tw: the table's share of the width — a narrower table leaves room for the footer beside it)
  const TB = measureTable(ctx, p, {F, FL, w: colR ? colW - pad * 2 : (box.w - pad * 2) * (o.tw ?? 1), force: o.force, tight: colR});
  if (!TB) return null;
  // the footer beside the table when there is room (wide frames), else under it; side by side with the footer
  // under the table (square frames) the stages collapse at the guide (see below), so the footer then always carries
  // the cards' printed texts (they leave the frame with the stages)
  const besideW = box.w - TB.w - pad * 2 - gap;
  // (nothing to put beside the table — labels hidden or key only, the key on the table's title row — : no column)
  const beside = !colR && besideW >= 16 * F && ctx.show('all');
  if ((o.tw ?? 1) < 1 && !beside && !colR) return null;
  const collapse = !beside && arr === 'row' && Boolean(o.collapse);
  // the guide chip (Δ) and the key go on the table's title row, right-aligned, when they fit
  const all = footerItems(ctx, p, collapse ? 'token' : mode);
  const th = ctx.theme;
  const markR = F * 0.62;
  const titleW = TB.title ? TB.title.width + F * 1.5 : 0;
  let room = TB.w - TB.markW - titleW;
  const top = [];
  for (const it of all.filter(q => q.name === 'guide' || q.name === 'key')) {
    const mw = it.mark ? markR * 2 + F * 0.4 : 0;
    if (room - mw < 6 * F) continue;
    const c = chipW(ctx, it.text, {x: 0, y: 0, maxWidth: room - mw, size: it.label ? FL : F, maxLines: 2, weight: it.weight, stroke: th.inkSoft});
    if (c.fit.bad) continue;
    top.push({it, c, w: c.box.w + mw, markW: mw, maxW: room - mw, lines: 2});
    room -= c.box.w + mw + F;
  }
  if (top.length) TB.titleH = Math.max(TB.title ? TB.title.height : 0, ...top.map(q => q.c.box.h)) + F * 0.4;
  TB.h = TB.titleH + TB.headH + TB.bodyH;
  const items = all.filter(it => !top.some(q => q.it === it));
  // (no notes to set beside the table — labels hidden or key only —: the right-hand column would stand half empty)
  if (colR && !items.length && !o.force) return null;
  const fw = beside ? besideW : colR ? colW : box.w;
  const foot = flowFooter(ctx, items, {F, FL, x0: 0, y0: 0, w: fw, lines: beside || colR ? 6 : 5});
  if (foot.bad) { if (!o.force) return null; why.push('fit'); }
  const tableH = TB.h + pad * 1.4;
  const bottomH = colR ? 0 : beside ? Math.max(tableH, foot.h + F * 0.6) : tableH + (foot.h ? foot.h + F * 1.2 : 0);
  if (colR && tableH + (foot.h ? foot.h + F * 0.7 : 0) > box.h + 1) { if (!o.force) return null; why.push('column'); }
  // collapse: during the action the stages also take the footer's room; at the guide they shrink (token cards:
  // nothing in them is text) or, when they would shrink under 0.45, fade out (their end state stays in the table),
  // the table moves up and the footer comes in
  const stagesH0 = box.h - bottomH - gap;
  const stagesH = collapse ? box.h - tableH - gap : stagesH0;
  const panelH = arr === 'row' ? stagesH : colR ? (box.h - gap) / 2 : (stagesH - gap) / 2;
  const padB = arr === 'colR' ? pad * 1.6 : pad * 2.4;
  const sceneBox = {x: 0, y: 0, w: panelW - pad * 2, h: panelH - hh - padB};
  if (sceneBox.h < 150 || sceneBox.w < 200) { if (!o.force) return null; why.push('small'); sceneBox.h = Math.max(sceneBox.h, 150); sceneBox.w = Math.max(sceneBox.w, 200); }
  const aspect = sceneBox.w / sceneBox.h;
  const shape = aspect > 1.3 ? 'landscape' : aspect < 0.8 ? 'portrait' : 'square';
  // the parties are the same in both scenes: named once, in the footer (the scenes show them)
  const captions = [null, null];
  const [evA, evB] = evWindows(p);
  const common = {box: sceneBox, shape, upx, headTarget: 0, finalState: null, annotations: [], showFinal: false, captions,
    plates: null, keyNote: false, pxSets: [px], cardModes: [mode], noStrip: true, colFs: [11],
    innerFs: {full: [18, 15, 13, 11], title: [15, 13, 11, 9.5], head: [18, 13, 11, 9.5, 8.5, 7.5], token: [3]}[mode], kMin: 0.5,
    arrs: shape === 'portrait' ? [{arr: 'stack', strip: 'mid', cols: 1}] : [{arr: 'row', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'mid', cols: 1}]};
  const LA = layoutScene(ctx, p, {...common, prefix: 'a-', sequence: p.scenarioA.sequence, ev: evA});
  if (!LA || (LA.why.includes('nofit') && !o.force)) return null;
  const LB = layoutScene(ctx, p, {...common, prefix: 'b-', sequence: p.scenarioB.sequence, ev: evB, fixed: LA.fixed});
  why.push(...LA.why.map(w => `A:${w}`), ...LB.why.map(w => `B:${w}`));
  // both stages share one geometry (racks, parties, slots, routes)
  const same = ['A', 'B', 'rackA', 'rackB', 'cardAt'].every(k => JSON.stringify(LA.G[k]) === JSON.stringify(LB.G[k])) && LA.G.cw === LB.G.cw && LA.G.ch === LB.G.ch;
  if (!same) why.push('geometry');
  // panels (header + stage), then the table (and the footer)
  const origin = arr === 'row'
    ? [{x: box.x, y: box.y}, {x: box.x + panelW + gap, y: box.y}]
    : [{x: box.x, y: box.y}, {x: box.x, y: box.y + panelH + gap}];
  const panels = origin.map(o0 => ({x: o0.x, y: o0.y, w: panelW, h: panelH}));
  const sceneAt = origin.map(o0 => ({x: o0.x + pad, y: o0.y + (arr === 'colR' ? pad * 0.9 : pad * 1.4) + hh}));
  const tY = colR ? box.y : box.y + stagesH + gap;
  // at the hold (shrink): the stage scale, the panels' height and the table's lift
  const sH = collapse ? Math.min(1, (stagesH0 - hh - pad * 2.4) / sceneBox.h) : 1;
  const shrink = collapse && mode === 'token' && sH >= 0.45;
  const fade = collapse && !shrink;
  if (fade && stagesH0 < hh + pad * 2) why.push('collapse');
  const lift = collapse ? stagesH - stagesH0 : 0;
  const cx0 = box.x + leftW + gap;
  const tx0 = colR ? cx0 + (colW - TB.w) / 2 : beside ? box.x + pad : box.x + (box.w - TB.w) / 2;
  const tray2 = colR ? {x: cx0, y: tY, w: colW, h: tableH} : beside ? {x: box.x, y: tY, w: TB.w + pad * 2, h: bottomH} : {x: box.x, y: tY, w: box.w, h: tableH};
  const T0 = tableGeom(TB, F, tx0, tY + pad * 0.7 + (beside ? (bottomH - tableH) / 2 : 0));
  const titleAt = TB.title ? {x: tx0, y: T0.headY - TB.titleH + (TB.titleH - F * 0.4 - TB.title.height) / 2} : null;
  // top chips right-aligned at the table's right edge (before the Δ column), guide rightmost
  let xr = tx0 + TB.w - TB.markW;
  for (const q of top) { q.x = xr - q.w; q.y = T0.headY - TB.titleH; xr = q.x - F; }
  const discs = [0, 1].map(c => ({x: T0.colX[c] + TB.nR, y: T0.headY + TB.disc}));
  // the guide ring: the receipt rows in both columns, with the Δ mark right of it
  const rr = receiptRows(TB, T0);
  let ring = null;
  if (rr) {
    const b = {x: rr.x - F * 0.5, y: rr.y - F * 0.2, w: rr.w + F * 1.0, h: rr.h + F * 0.4};
    const R = markR;
    // (a tight table has no Δ column: the ring alone links the rows to the Δ guide chip)
    ring = {b, mk: TB.markW ? {x: b.x + b.w + R + F * 0.15, y: b.y + b.h / 2} : null, R};
    if (ring.mk && !insideBox({x: ring.mk.x - R, y: ring.mk.y - R, w: R * 2, h: R * 2}, box)) why.push('mark');
  }
  const fx0 = colR ? cx0 : beside ? box.x + TB.w + pad * 2 + gap : box.x;
  const footY = colR ? tY + tableH + F * 0.55 + Math.max(0, (box.h - tableH - F * 0.7 - foot.h) / 2) : beside ? tY + (bottomH - foot.h) / 2 : tY - lift + tableH + F * 0.9;
  const footer = flowFooter(ctx, items, {F, FL, x0: fx0, y0: footY, w: fw, lines: beside || colR ? 6 : 5});
  if (footer.placed.length && footY + footer.h > box.y + box.h + 1) why.push('footer');
  const tray = footer.placed.length ? (colR ? {x: cx0, y: tY + tableH + F * 0.3, w: colW, h: box.y + box.h - (tY + tableH + F * 0.3)} : beside ? {x: fx0 - F * 0.3, y: tY, w: box.x + box.w - fx0 + F * 0.3, h: bottomH} : {x: box.x, y: footY - F * 0.3, w: box.w, h: footer.h + F * 0.6}) : null;
  // people at every moment: the stage's head, and at the hold the shrunk (or faded) one
  const headAct = 88 * LA.G.k * upx;
  const headMin = collapse ? (shrink ? headAct * sH : 0) : headAct;
  const L = {headMin, shrink, fade, collapse, sH, lift, sceneBox, titleAt, top, markR, F, FL, px, arr, mode, panelW, panelH, panels, tray, tray2, TB, T0, discs, sceneAt, hd, hh, pad, footer, LA, LB, ring, why, ok: why.length === 0,
    head: 88 * LA.G.k * upx, k: LA.G.k, upx, box};
  const art = tableArt(ctx, TB, T0, F);
  L.tableNode = art.node;
  LA.strip = art.strips[0];
  LB.strip = art.strips[1];
  return L;
}

const SEARCH = new Map();

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const key = JSON.stringify([ctx.params, ctx.view.width, ctx.view.height, ctx.show('all'), ctx.show('key')]);
    if (SEARCH.has(key)) {
      const s0 = SEARCH.get(key);
      return compose(ctx, s0.px, s0.arr, s0.mode, {...s0.variant, force: s0.force});
    }
    const shape = ctx.view.shape;
    // arrangements and their variants: the footer under the table or beside a narrower table; (square) the stages
    // in a left column with the table and notes in a right-hand column; last, stages that collapse at the guide
    const base = [{tw: 1}, {tw: 0.66}, {tw: 0.58}];
    // (1:1: the stacked-column stage share of 0.37–0.41 beside the text column is an accepted, documented limit — coordinator ruling "CF CONTRAST 1:1 STAGE SHARE" in production/SESSION_HANDOFF.md: the text and people floors win)
    const plan = shape === 'landscape' ? base.map(v => ['row', v])
      : [...base.map(v => ['row', v]), ...base.map(v => ['stack', v]), ...(shape === 'square' ? [0.4, 0.42, 0.425, 0.43, 0.435, 0.44, 0.47, 0.5, 0.53].map(c => ['colR', {c}]) : []), ['row', {tw: 1, collapse: true}]];
    // people floors (rendered head ≥ 55 px at rest, build and hold; ≥ 45 px at the least) come before the fuller
    // cards; the text floor (19.6 px) before the people's second floor
    const MODES = ['full', 'title', 'head', 'token'];
    const floorPx = DEFAULT_PX.filter(q => q.F >= 19.6), lowPx = DEFAULT_PX.filter(q => q.F < 19.6);
    const cands = [];
    // (at or above the text floor: the fullest cards first; below it: the largest text first)
    const run = (pxs, need, textFirst) => {
      const order = textFirst ? pxs.flatMap(px => MODES.map(mode => [mode, px])) : MODES.flatMap(mode => pxs.map(px => [mode, px]));
      for (const [mode, px] of order) {
        {
          for (const [arr, v] of plan) {
            {
              const c = compose(ctx, px, arr, mode, v);
              if (!c || !c.ok) continue;
              c.variant = v;
              cands.push(c);
              if (c.headMin >= need) return c;
            }
          }
        }
      }
      return null;
    };
    // (the drawn head is 0.978 of the model's 88·k: 56.5 model px draw ≥ 55 px)
    let best = run(floorPx, 56.5) || run(lowPx, 56.5, true) || run(floorPx, 46.5) || run(lowPx, 46.5, true);
    // (no layout reaches 55 px: the largest heads found at the largest text, flagged by the rendered head test)
    if (!best && cands.length) best = cands.slice().sort((a, b) => b.headMin - a.headMin || b.px.F - a.px.F)[0];
    // (nothing fits: the smallest text with token cards, flagged — never throws)
    if (!best) for (const [arr, v] of plan) { const c = compose(ctx, DEFAULT_PX[DEFAULT_PX.length - 1], arr, 'token', {...v, force: true}); if (c && !best) best = {...c, variant: v}; }
    if (!best) throw new Error(`${ID}: no layout`);
    SEARCH.set(key, {px: best.px, arr: best.arr, mode: best.mode, variant: best.variant || {}, force: !best.ok});
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const nodes = [];
    L.panels.forEach((pn, i) => {
      nodes.push(h('path', {name: `panel${i}`, d: roundRectPath(pn.x, pn.y, pn.w, pn.h, 18), fill: th.card, 'fill-opacity': 0.35, stroke: th.inkFaint, 'stroke-width': 2}));
    });
    // (shrink: the footer's tray comes in with the guide, where the stages were)
    if (L.tray) nodes.push(h('path', {name: 'tray', d: roundRectPath(L.tray.x, L.tray.y, L.tray.w, L.tray.h, 16), fill: th.card, 'fill-opacity': 0.35, stroke: th.inkFaint, 'stroke-width': 2, opacity: L.collapse ? 0 : undefined}));
    L.panels.forEach((pn, i) => nodes.push(headerArt(ctx, L.hd[i], {name: `hdr${i}`, x: pn.x + L.pad, y: pn.y + L.pad})));
    [L.LA, L.LB].forEach((S, i) => nodes.push(g({name: `at${i}`, transform: T(L.sceneAt[i].x, L.sceneAt[i].y)}, buildScene(ctx, S))));
    // the table (moves up with the shrink): tray, title, the scenario discs over the columns, rows, cells, ring, chips
    const tbl = [h('path', {name: 'tray2', d: roundRectPath(L.tray2.x, L.tray2.y, L.tray2.w, L.tray2.h, 16), fill: th.card, 'fill-opacity': 0.35, stroke: th.inkFaint, 'stroke-width': 2})];
    if (L.titleAt) tbl.push(g({name: 'tbl-title', opacity: 0}, textBlock(L.TB.title, {x: L.titleAt.x, y: L.titleAt.y, fill: th.fg})));
    L.discs.forEach((d, i) => {
      const parts = ctx.show('key') ? [h('circle', {cx: r(d.x), cy: r(d.y), r: r(L.TB.disc), fill: th.fg, stroke: INK, 'stroke-width': 2.4})] : [];
      if (ctx.show('key')) {
        const f = fitW(i ? 'B' : 'A', {maxWidth: L.TB.disc * 2, size: L.FL, maxLines: 1, weight: 800});
        parts.push(textBlock(f, {x: d.x, y: d.y - f.size * 0.45, anchor: 'middle', fill: '#ffffff'}));
      }
      tbl.push(g({name: `row${i}`, opacity: 0}, parts));
    });
    tbl.push(L.tableNode);
    if (L.ring) {
      tbl.push(h('path', {name: 'ring', d: roundRectPath(L.ring.b.x, L.ring.b.y, L.ring.b.w, L.ring.b.h, 14), fill: 'none', stroke: INK, 'stroke-width': 3.5, opacity: 0}));
      if (L.ring.mk) tbl.push(deltaMark(ctx, {name: 'mark', x: L.ring.mk.x, y: L.ring.mk.y, R: L.ring.R, opacity: 0}));
    }
    const chipOf = q => {
      const chip = chipW(ctx, q.it.text, {x: q.x + q.markW, y: q.y, maxWidth: q.maxW, size: q.it.label ? L.FL : L.F, maxLines: q.lines, weight: q.it.weight, stroke: th.inkSoft});
      return g({name: `f-${q.it.name}`, opacity: 0}, q.it.mark ? deltaMark(ctx, {x: q.x + L.markR, y: q.y + q.c.box.h / 2, R: L.markR}) : null, chip.node);
    };
    for (const q of L.top) tbl.push(chipOf(q));
    nodes.push(g({name: 'tblmove'}, tbl));
    for (const q of L.footer.placed) nodes.push(chipOf(q));
    return g({name: 'contrast'}, nodes);
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    const nodes = {};
    const looks = [];
    let reached = true;
    const sems = [];
    const stripOp = r(s('strip'), 3);
    [L.LA, L.LB].forEach((S, i) => {
      const P = S.P;
      const posed = poseScene(ctx, S, u, {hold: {u, done: true}});
      Object.assign(nodes, posed.nodes);
      // the table rows (title and empty slots) come in with the change; B's bracket "order to be examined" right after
      S.strip.stations.forEach((_, j) => { nodes[`${P}seq-ph${j}`] = {opacity: stripOp}; });
      S.stations.forEach((st, j) => {
        if (!st.grouped) return;
        nodes[`${P}seq-s${j}-br`] = {opacity: r(s('bracket'), 3)};
        if (ctx.show('all')) nodes[`${P}seq-s${j}-tag`] = {opacity: r(s('bracket'), 3)};
      });
      nodes[`row${i}`] = {opacity: stripOp};
      reached = reached && posed.sem.allReached;
      sems.push(posed.sem);
      // what a viewer sees of this scene's stage (scene coordinates): identical in A and B until the change
      looks.push({cardP: posed.sem.cardP, cardW: posed.sem.cardW, whereP: posed.sem.whereP, whereW: posed.sem.whereW, handA: posed.sem.handA, handB: posed.sem.handB,
        header: r(s('headers'), 3), row: stripOp, bracket: S.stations.some(st => st.grouped) ? r(s('bracket'), 3) : 0, slots: stripOp > 0 ? S.stations.length : 0,
        stations: posed.sem.stationsShown});
    });
    if (L.titleAt) nodes['tbl-title'] = {opacity: stripOp};
    nodes['tbl-rows'] = {opacity: stripOp};
    if (L.collapse) {
      // the stages shrink (uniformly, about their panel's top centre) or fade out, and the table moves up; the
      // footer's tray comes in
      // (fade: the stages are gone before the table starts to move)
      const e = ease.inOutCubic(L.shrink ? s('shrink') : clamp((s('shrink') - 0.5) * 2));
      const k = L.shrink ? 1 + (L.sH - 1) * e : 1;
      const cut = L.shrink ? L.sceneBox.h * (1 - k) : (L.panels[0].h - L.hh - L.pad * 2) * e;
      L.panels.forEach((pn, i) => {
        nodes[`at${i}`] = L.shrink ? {transform: T(L.sceneAt[i].x + L.sceneBox.w * (1 - k) / 2, L.sceneAt[i].y, 0, k)} : {opacity: r(1 - clamp(s('shrink') * 2), 3)};
        nodes[`panel${i}`] = {d: roundRectPath(pn.x, pn.y, pn.w, pn.h - cut, 18)};
      });
      nodes.tblmove = {transform: T(0, -L.lift * e)};
      if (L.tray) nodes.tray = {opacity: r(s('guide'), 3)};
    }
    nodes.hdr0 = {opacity: r(s('headers'), 3)};
    nodes.hdr1 = {opacity: r(s('headers'), 3)};
    if (L.ring) { nodes.ring = {opacity: r(s('rings'), 3)}; if (L.ring.mk) nodes.mark = {opacity: r(s('rings'), 3)}; }
    for (const q of [...L.top, ...L.footer.placed]) nodes[`f-${q.it.name}`] = {opacity: r(q.it.name === 'key' ? s('key') : s('guide'), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const [a, b] = sems;
    return {
      nodes,
      semantic: {
        beat,
        lookA: looks[0], lookB: looks[1],
        a: {whereP: a.whereP, whereW: a.whereW, order: a.order, grouped: a.grouped, stationsShown: a.stationsShown},
        b: {whereP: b.whereP, whereW: b.whereW, order: b.order, grouped: b.grouped, stationsShown: b.stationsShown},
        cardPA: a.cardP, cardWA: a.cardW, cardPB: b.cardP, cardWB: b.cardW, handAA: a.handA, handBA: a.handB, handAB: b.handA, handBB: b.handB,
        allReached: reached,
        guide: r(s('guide'), 3),
        headers: r(s('headers'), 3),
        arrangement: L.arr === 'row' ? 'row' : L.arr === 'colR' ? 'colR' : 'column',
        panelFrac: r(L.panelW / ctx.design.w, 3),
        cardMode: L.mode,
        layoutOk: L.ok,
        why: L.why.join(','),
        textPx: r(L.F * L.upx, 2),
        headPx: r(L.head, 1),
        headHoldPx: r(L.headMin, 1),
        flightGap: r(Math.min(L.LA.sepMin, L.LB.sepMin), 1),
        sameGeometry: !L.why.includes('geometry'),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-03-contrast',
    title: 'Withdrawal of a proposal — two supplied sequences side by side',
    titleEs: 'Retirada de propuesta — Comparación de dos supuestos',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Retirada de propuesta',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical stages (two parties, pigeonhole racks, the proposal card ● and the withdrawal card ◆). Only the supplied order of the two receipts differs: in A «Withdrawal communicated» they are supplied one after the other; in B «Time sequence to be examined» they are supplied with one position, shown together in a dashed bracket "order to be examined". Both scenes send the messages at the same moments; a Δ guide links the two receipt slots. No winner and no effect of the order is stated.',
    tags: ['proposal', 'offer', 'withdrawal', 'message', 'crossing', 'sequence', 'comparison', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/retirada-propuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
