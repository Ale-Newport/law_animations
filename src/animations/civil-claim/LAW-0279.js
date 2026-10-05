/**
 * LAW-0279 — Ordenación de cuestiones · contrast
 *
 * Storyboard (two complete copies of the same room — side by side on wide and square boxes, stacked on tall ones; each
 * has Party A beside her tray with the third issue card and the push bar, the case file open on its easel as a sorting
 * board (● agreed and ◆ open columns, Subject A and Subject B rows, Issue 1 and Issue 2 in the Subject A row), the
 * calendar and Party B; every supplied text that is the same in A and B is printed once in a shared strip; A is marked
 * with a solid ● badge, B with a solid ◆ badge of equal size and weight):
 *  0.00–0.17  base: two identical rooms at rest — the third card in its tray, its glyph spot blank, no frame drawn.
 *  0.17–0.40  the scenario headers appear and the changed-fact chip names the one fact that differs; the third card's
 *             supplied state appears on it — in A ● agreed issue, in B ◆ open issue — a localized, explicit change, the
 *             same glyph size and stroke in both.
 *  0.40–0.77  in parallel: in both rooms Party A pushes the card with the bar into the Subject B row; in A it stops in
 *             the nearer (●) column, in B it glides on into the farther (◆) column — only the contrasted circumstance
 *             changes the geometry. The subject frames come in both rooms alike.
 *  0.77–1.00  a numbered marker ① sits on each inset (the tray and the Subject B row drawn large: the card in the ●
 *             cell in A, in the ◆ cell in B) and the guide chip ① names the difference; the neutral note and the "as
 *             supplied · no conclusion drawn" key. "Agreed" only means the supplied list marks the issue as agreed
 *             between the parties; nothing is decided or proven; no winner, score, procedure, effect or outcome.
 * @module animations/civil-claim/LAW-0279
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {
  OC_DEFAULTS, OC_DEFAULTS_ES, OC_COMMON_ES, OC_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf2, gchip, keyChip, hit, hasLone, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, stateGlyph,
} from './kits/ordenacion-cuestiones.js';

const ID = 'LAW-0279';
const DURATION = 7500;
const C0 = 0.4, C1 = 0.77;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], appear: [0.24, 0.32], changed: [0.28, 0.36], group: [0.71, 0.765], guide: [0.775, 0.83], note: [0.8, 0.86]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** how much of the people scale the compact sheets follow */
const BOARD_K = {landscape: 0.75, portrait: 0.75, square: 0.75};
/** blank card height on the rooms' compact props (in their text size): taller cards, a larger changed fact */
const ROW_K = {landscape: 9, portrait: 9, square: 9};
/** the Subject A row's blank cards (context, shorter: the changed row is the Subject B row) */
const ROW_K0 = {landscape: 3, portrait: 3, square: 3};
const LW_K = {landscape: 5, portrait: 5, square: 5};
/** the spacing of the room (people units): square rooms stand the tray and Party B a little closer */
const GAPS = {landscape: {trayGap: 62, aGap: 56}, portrait: {trayGap: 62, aGap: 56}, square: {trayGap: 30, aGap: 40, trayPad: 12}};
/** the head floor (model px at 1080p; the rendered head box must stay >= 60 off 1:1 and >= 55 at 1:1 in the non-stress
 * presets, as accepted LAW-0271/0275 — review r1) with a margin: below it the supplied text steps down */
const HEAD_FLOOR = {landscape: 61, portrait: 61, square: 55.5};
/** at the baseline text floor (~19.5 px) the people may stay under HEAD_FLOOR only above this (model px; the rendered
 * head box must stay >= 45 px under long-labels-stress — kept with a margin of ~2 px rendered, review r1) */
// (square: no early stop — review r2: with the header band sized for a 3-line header the contrast preset's people fell to
// 51 px at the 19.6 px text; its text floor is 16 px, so the text steps on down until the people reach HEAD_FLOOR. The
// baseline presets reach their floor at full text size and are unaffected)
const STRESS_HEAD = {landscape: 47.5, portrait: 47.5, square: 1e9};
/** the rendered head over the head box's width */
const HEAD_K = 0.86;
/** half-width (people units) round Party A and Party B that the tightened walls always hold, with a margin */
const PEOPLE_MARGIN = 72;

const STRINGS = {
  en: {...OC_STRINGS.en, same: 'Same in A and B', changedFact: 'Changed fact'},
  es: {...OC_STRINGS.es, same: 'Igual en A y B', changedFact: 'Hecho cambiado'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  ...contrastFields(),
};

const defaultParams = {
  parties: OC_DEFAULTS.parties,
  documents: OC_DEFAULTS.documents,
  stages: OC_DEFAULTS.stages,
  dates: OC_DEFAULTS.dates,
  scenarioA: {label: 'Issue 3 agreed (as supplied)'},
  scenarioB: {label: 'Issue 3 open (as supplied)'},
  changedFact: 'The state of Issue 3 in the supplied list: agreed or open',
  sharedFacts: ['Same parties, case file, subjects and calendar'],
  comparisonLabels: {guide: 'Only the state of Issue 3 and its column differ', neutral: 'No conclusion is drawn'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...OC_COMMON_ES,
  scenarioA: {label: 'Cuestión 3 acordada (aportada)'},
  scenarioB: {label: 'Cuestión 3 por resolver (aportada)'},
  changedFact: 'El estado de la cuestión 3 en la lista aportada: acordada o por resolver',
  sharedFacts: ['Mismas partes, expediente, asuntos y calendario'],
  comparisonLabels: {guide: 'Solo cambian el estado de la cuestión 3 y su columna', neutral: 'Sin conclusión'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const B = SIZE[ctx.view.shape];
    const floorK = 16.4 / pxPer / (B * 0.96);
    // each arrangement and people scale at each text size; the largest people among the layouts that fit win (the
    // supplied text steps down only when no layout keeps the figures at their floors)
    const arrs = {landscape: ['row', 'rowK'], portrait: ['column'], square: ctx.show('all') ? ['row'] : ['row', 'column']}[ctx.view.shape];
    // (the people never push the text below the baseline floor, ~19.5 px: below it the text steps down only when the
    // supplied texts do not fit)
    const k19 = 19.6 / pxPer / (B * 0.96);
    const ks = [...new Set([1, 0.96, 0.92, 0.85, Math.max(k19, floorK), floorK].filter(k2 => k2 >= floorK - 1e-9))].sort((a2, b2) => b2 - a2);
    let L = null;
    // (the best people scale found per arrangement at the previous text size: smaller text never needs smaller people,
    // so the search at the next size starts there and climbs)
    const lastPk = {};
    for (const k of ks) {
      for (const arr of arrs) {
        const take = q => {
          // (labels hidden: among the arrangements that fill the frame, the larger figures; otherwise the larger figures)
          const better = ctx.show('key') || q.fillOk === L?.fillOk ? q.headPx > L?.headPx : q.fillOk;
          if (!L || (q.ok && !L.ok) || (q.ok === L.ok && better)) L = q;
        };
        // (people scales are tried largest first: the first that fits is this arrangement's best — then two halvings
        // of the step above it find a slightly larger scale that still fits)
        const PKS = [10, 9, 8, 7.25, 6.5, 6, 5.5, 5, 4.5, 4, 3.6, 3.2, 2.8, 2.4, 2.1, 1.8, 1.5, 1.25, 1];
        const kk = Math.max(k, floorK);
        let lo = null, hi = null;
        const q0 = lastPk[arr] ? compose(ctx, kk, arr, lastPk[arr]) : null;
        if (q0 && q0.ok) {
          take(q0);
          lo = lastPk[arr];
          for (const pk of PKS.filter(x => x > lo).reverse()) { const q = compose(ctx, kk, arr, pk); if (q.ok) { take(q); lo = pk; } else { hi = pk; break; } }
        } else {
          let prev = null;
          for (const pk of PKS) {
            const q = compose(ctx, kk, arr, pk);
            take(q);
            if (q.ok) { lo = pk; hi = prev; break; }
            prev = pk;
          }
        }
        for (let i = 0; i < 2 && lo && hi; i++) { const mid = (lo + hi) / 2; const q2 = compose(ctx, kk, arr, mid); if (q2.ok) { take(q2); lo = mid; } else hi = mid; }
        if (lo) lastPk[arr] = lo;
      }
      // (at the baseline text floor the people may stay under their floor only when they are still above the stress
      // floor; otherwise long texts step down further)
      if (L.ok && (L.headPx >= HEAD_FLOOR[ctx.view.shape] || (k <= k19 + 1e-6 && L.headPx >= STRESS_HEAD[ctx.view.shape]))) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** Scenario badge: A a solid circle (●), B a solid diamond (◆) of equal weight. */
function badge(ctx, k, cx, cy, R, name) {
  return stateGlyph(ctx, {name, kind: k ? 'additional' : 'initial', x: cx, y: cy, R});
}

/**
 * flow chips left to right, wrapping rows, inside width w starting at (x, y); a block (bw × bh) at the top left is kept
 * free (the rows beside it start after it)
 */
function flow(items, x, y, w, gap, bw = 0, bh = 0) {
  const out = [];
  let cy = y, rowH = 0;
  const rest = [];
  if (bw) {
    const xs = x + bw + gap;
    let cx = xs;
    for (const it of items) {
      if (it.w > x + w - xs) { rest.push(it); continue; }
      if (cx > xs && cx + it.w > x + w) {
        if (cy + rowH + gap + it.h > y + bh + 0.5) { rest.push(it); continue; }
        cy += rowH + gap; rowH = 0; cx = xs;
      }
      if (cy + it.h > y + bh + 0.5 && out.length) { rest.push(it); continue; }
      out.push({...it, x: cx, y: cy});
      cx += it.w + gap;
      rowH = Math.max(rowH, it.h);
    }
    cy = y + bh + gap; rowH = 0;
  } else rest.push(...items);
  let cx = x;
  let first = true;
  for (const it of rest) {
    if (!first && cx + it.w > x + w) { cy += rowH + gap; rowH = 0; cx = x; }
    out.push({...it, x: cx, y: cy});
    cx += it.w + gap;
    rowH = Math.max(rowH, it.h);
    first = false;
  }
  out.sort((a2, b2) => items.findIndex(q => q.name === a2.name) - items.findIndex(q => q.name === b2.name));
  return {items: out, h: Math.max(bh, rest.length ? cy + rowH - y : (bw ? bh : 0))};
}

/**
 * Spanish: no capital after a colon — a supplied text printed after "Hecho cambiado:" / "Igual en A y B:" that opens
 * with a capitalised article or ordinary determiner is lower-cased there (only the words in LOWER_ES: a name, an
 * acronym or any other word stays as supplied). Other locales: as supplied.
 */
const LOWER_ES = /^(El|La|Los|Las|Lo|Un|Una|Unos|Unas|Mismo|Misma|Mismos|Mismas|Solo|Sólo|Igual|Ambos|Ambas)(?=[\s,])/u;
function afterColon(p, text) {
  return p.locale === 'es' ? String(text).replace(LOWER_ES, w => w.toLocaleLowerCase('es')) : text;
}

function compose(ctx, sizeK, arr, peopleK = 1) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf2(ctx, p);
  // (the props' labels are not fields of this item: the locale's defaults)
  const sp = {...p, labels: (p.locale === 'es' ? OC_DEFAULTS_ES : OC_DEFAULTS).labels};
  // arr: 'row' (side by side, strip under), 'column' (stacked, strip under), 'side' (stacked, strip in a right column)
  // ('rowK': side by side with both keys in the shared strip — the top band left to the scenario headers, review r2)
  const row = arr === 'row' || arr === 'rowK';
  // ('side38': the same with a wider right column, for long shared texts)
  const side = arr.startsWith('side');
  const colW = side ? Math.round(D.w * (arr === 'side38' ? 0.38 : 0.3)) : 0;
  // ---- top band: the claim key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  // (the configuration key only when the scenario headers do not already name both configurations with their glyphs;
  // without it the "as supplied" key joins the shared strip and the rooms take the top band)
  const keyNeeded = p.scenarioA.label !== p.stages.agreed || p.scenarioB.label !== p.stages.open;
  // (square: both keys always join the shared strip — the rooms take the whole top band)
  const keysInStrip = shape === 'square' || !keyNeeded || arr === 'rowK';
  const key = showKey && !keysInStrip ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey && keyNeeded && !keysInStrip ? gchip(ctx, configKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const y = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (key || stKey ? 10 : 0);
  // ---- shared strip: what is the same in A and B printed once — the shared facts, the case file and the cards (each
  // its own label) — then the changed-fact chip, the guide chip and the neutral note
  const d = p.documents;
  const stripTexts = showAll ? [
    // (the shared facts, the case file, the parties with their roles, the subjects and the issue cards in one chip —
    // the third card without a state glyph: its state is the one fact that differs)
    {name: 'cf', text: `${p.sharedFacts.length ? `${t.same}: ${afterColon(p, p.sharedFacts.join(' · '))} — ` : ''}${d.caseFile.ref} · ${d.caseFile.title} — ${[0, 1].map(i => partyCaption(p, i)).join(' · ')} — ${d.subjects.a}: ● ${d.issues[0]} · ◆ ${d.issues[1]} — ${d.subjects.b}: ${d.issues[2]}`, weight: 600},
  ] : [];
  const changedText = showAll ? `${t.changedFact}: ${afterColon(p, p.changedFact)}` : null;
  const guideText = showAll && p.comparisonLabels.guide ? `1  ${p.comparisonLabels.guide}` : null;
  const noteText = showAll && p.comparisonLabels.neutral ? p.comparisonLabels.neutral : null;
  const stripW = side ? colW : D.w - 16;
  const mk = (name, text, weight = 600, stroke = th.inkSoft) => {
    const c = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 10, fill: th.card, stroke, color: th.ink, weight});
    return {name, text, weight, stroke, w: c.box.w, h: c.box.h};
  };
  const items = [...(showKey && keysInStrip ? [mk('key', `◦ ${t.key}`, 600)] : []), ...(showKey && keysInStrip && keyNeeded ? [mk('state-key', configKeyText(p), 700)] : []), ...stripTexts.map(q => mk(q.name, q.text, q.weight)), ...(changedText ? [mk('changed', changedText, 700, th.ink)] : []), ...(guideText ? [mk('guide', guideText, 700, th.ink)] : []), ...(noteText ? [mk('note', noteText, 600)] : [])];
  // ---- the two insets (A, B) at the head of the strip: the tray and the Subject B row drawn large — A: the card (●)
  // slides into the ● cell; B: the card (◆) slides into the ◆ cell; card glyphs >= 25 px across at 1080p — so the one
  // difference reads at every size, labels shown or hidden
  const Rg = Math.max(12.5 / pxPer, small * 0.45);
  const nF = 3;
  // (at least two rows of strip chips tall: the chips beside the insets fill two rows, not one)
  const oneRowH = showAll ? mk('probe', 'x').h : 0;
  const insW = Rg * 12.8, insH = Math.max(Rg * (nF * 1.05 + (nF - 1) * 0.65 + 1.6), oneRowH * 2 + 9);
  const twoIn = 2 * insW + 12 <= stripW;
  const blkW = twoIn ? 2 * insW + 12 : insW, blkH = twoIn ? insH : 2 * insH + 12;
  const fl0 = flow(items, 0, 0, stripW, 8, blkW, blkH);
  const stripH = side ? 0 : fl0.h + 10;
  // ---- scenario headers (one per scene)
  // (a scenario's caption, when supplied, follows its label in its own header — above its own room)
  const hdrText = k => { const sc = k ? p.scenarioB : p.scenarioA; return sc.caption ? `${sc.label} — ${sc.caption}` : sc.label; };
  const R = small * 0.5;
  // (the name chips under each room print the names; the roles are in the shared strip, printed once)
  const capOf = i => p.parties[i].name;
  const IDX = [0, 1];
  const sceneW = row ? (D.w - 16 - 24) / 2 : D.w - 16 - (side ? colW + 20 : 0);
  // (the headers are probed with the options they are drawn with — width, weight — so the band reserved above both rooms
  // holds the taller header whole; review r2: probed at weight 600 and a wider box, a 2–3-line header ran into room A)
  const hdrOpt = {anchor: 'start', maxWidth: sceneW - R * 3.2, size: small, minSize: small, maxLines: 4, weight: 700};
  let hdrProbe = showKey ? [0, 1].map(k => gchip(ctx, hdrText(k), {x: 0, y: 0, ...hdrOpt})) : [];
  // (both headers alike: when one wraps, both wrap on the same number of lines at the same, narrowest width that holds
  // both — no one-line header beside a two-line one)
  if (hdrProbe.length) {
    const nL = c => (c.fit.lines || []).length || 1;
    const n = Math.max(...hdrProbe.map(nL));
    const at = w => [0, 1].map(k => gchip(ctx, hdrText(k), {x: 0, y: 0, ...hdrOpt, maxWidth: w}));
    const fits = cs => cs.every(c => nL(c) <= n && !c.fit.truncated && !hasLone(c.fit));
    if (n > 1 && hdrProbe.some(c => nL(c) < n)) {
      let lo = hdrOpt.maxWidth * 0.4, hi = hdrOpt.maxWidth;
      for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (fits(at(mid))) hi = mid; else lo = mid; }
      const cs = at(hi);
      if (fits(cs) && cs.every(c => nL(c) === n)) { hdrOpt.maxWidth = hi; hdrProbe = cs; }
    }
  }
  // (each header keeps >= 8 px at 1080p — with a margin — clear of its room's wall and of every prop on it)
  const hdrGap = Math.max(8, 8.6 / pxPer);
  const hdrH = hdrProbe.length ? Math.max(...hdrProbe.map(c => c.box.h)) + hdrGap : 0;
  // (two name chips under each room, side by side: the widest that leaves no one-word line and still fits the room)
  const chipAt = mw => IDX.map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: small, minSize: small, maxLines: 6}));
  let chipMax = (sceneW - 20) / 2, probe = showKey ? chipAt(chipMax) : [], twoRows = false;
  if (showKey) {
    let found = false;
    for (const f of [0.5, 0.46, 0.42, 0.38]) {
      const mw = sceneW * f, pr = chipAt(mw);
      if (pr.reduce((a2, c) => a2 + c.box.w, 0) + 20 <= sceneW && !pr.some(c => hasLone(c.fit) || c.fit.truncated)) { chipMax = mw; probe = pr; found = true; break; }
    }
    // (long captions: each chip takes its own row, as wide as the room — Party B's above Party A's)
    if (!found) { twoRows = true; chipMax = sceneW - 10; probe = chipAt(chipMax); }
  }
  const chipBand = !probe.length ? 6 : twoRows ? probe[0].box.h + probe[1].box.h + 18 : Math.max(...probe.map(c => c.box.h)) + 12;
  const top0 = y;
  const bottom = D.h - 8 - stripH;
  const sceneH = row ? bottom - top0 - hdrH - chipBand : (bottom - top0 - 2 * (hdrH + chipBand) - 12) / 2;
  // ---- the two scenes: compact rooms (texts are in the strip); one solve, one scale (the same geometry in A and B)
  // (the wall ends just past the people: a narrower room, so the people are larger)
  const tightX = -Math.round((shape === 'square' ? 64 : 46) * 1.3 * peopleK);
  // (the calendar hangs high on the wall above the tray and the board: a narrower room, larger people; the wall still
  // holds the people — their arms and hair never reach past it)
  const opts = k => ({prefix: k ? 'sb' : 'sa', p: sp, looks, showText: false, compact: true, wallExtraL: tightX, wallExtraX: tightX, peopleMargin: PEOPLE_MARGIN, lwK: LW_K[shape], rowK: ROW_K[shape], rowK0: ROW_K0[shape], peopleK, compactTs: 20 * Math.max(1, peopleK * BOARD_K[shape]), calHigh: row && shape !== 'square', ...GAPS[shape]});
  const sol = sceneH > 40 ? solveStage(ctx, {B, availW: sceneW, availH: sceneH, opts: opts(1), fillH: true, scMin: 0.1}) : solveStage(ctx, {B, availW: sceneW, availH: 40, opts: opts(1), scMin: 0.1});
  // (the wall runs out to both sides of the scene box: the two rooms fill their boxes)
  const spareX = sol.fitted ? Math.max(0, sceneW / sol.s - sol.stage.ext.w - 2) / 2 : 0;
  const stB = spareX > 1 ? deskStage(ctx, {...opts(1), ts: sol.ts, wallExtra: sol.stage.wallExtra, wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)}) : sol.stage;
  const stA = deskStage(ctx, {...opts(0), ts: sol.ts, wallExtra: stB.wallExtra, ...(spareX > 1 ? {wallExtraX: tightX + Math.round(spareX), wallExtraL: tightX + Math.round(spareX)} : {})});
  const x0s = row ? [8, 8 + sceneW + 24] : [8, 8];
  const tops = row ? [top0 + hdrH, top0 + hdrH] : [top0 + hdrH, top0 + hdrH + sceneH + chipBand + 12 + hdrH];
  const PLs = [0, 1].map(k => placeStage({...sol, stage: k ? stB : stA}, {x0: x0s[k], top0: tops[k], availW: sceneW, bottom: tops[k] + sceneH, chipBand: 0}));
  const stages = [stA, stB];
  const occupied = [];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // headers: just above each scene's wall
  const headers = showKey ? [0, 1].map(k => {
    const PL = PLs[k];
    const E = stages[k].ext;
    const wallTop = PL.oy + E.y * PL.s;
    const xL = x0s[k];
    // (both headers stand on the same line above their rooms, top-aligned, drawn alike)
    const c = gchip(ctx, hdrText(k), {...hdrOpt, x: xL + R * 2.8, y: Math.max(top0, wallTop - hdrH), fill: th.card, stroke: th.ink, color: th.ink, name: `hdr${k}-chip`});
    occupied.push(c.box);
    return {c, bx: xL + R * 1.3, by: c.box.y + c.box.h / 2};
  }) : [];
  // name chips under each scene's floor (pushed apart when they would touch)
  const chips = [];
  if (showKey) {
    [0, 1].forEach(k => {
      const PL = PLs[k];
      const G = stages[k].G;
      const sx0 = x0s[k];
      const px = [PL.M({x: G.xA, y: 0}).x, PL.M({x: G.xB, y: 0}).x];
      const ws = probe.map(c => c.box.w);
      const xs = twoRows ? px.map((x, i) => clamp(x, sx0 + ws[i] / 2, sx0 + sceneW - ws[i] / 2)) : packChips(px, ws, sx0, sx0 + sceneW);
      const rowY = i => (twoRows && i === 0 ? probe[1].box.h + 6 : 0);
      IDX.forEach(i => {
        const c = gchip(ctx, capOf(i), {x: xs[i], y: PL.floor + 8 + rowY(i), anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${k ? 'b' : 'a'}${i}`});
        chips.push(c);
        occupied.push(c.box);
      });
    });
  }
  // the strip, placed under the scenes (or in the right column)
  const stripX = side ? D.w - 8 - colW : 8, stripY = side ? top0 : D.h - 8 - (stripH - 10);
  const fl = flow(items, stripX, stripY, stripW, 8, blkW, blkH);
  const insets = [0, 1].map(k => (twoIn ? {x: stripX + k * (insW + 12), y: stripY, w: insW, h: insH, R: Rg} : {x: stripX, y: stripY + k * (insH + 12), w: insW, h: insH, R: Rg}));
  const strip = fl.items.map(it => ({...it, c: gchip(ctx, it.text, {x: it.x, y: it.y, anchor: 'start', maxWidth: stripW, size: small, minSize: small, maxLines: 10, fill: th.card, stroke: it.stroke, color: th.ink, weight: it.weight, name: `strip-${it.name}`})}));
  // the guide markers ① at each inset's top right corner (over the lane, never over a sheet)
  const markR = small * 0.62;
  const markers = insets.map(b => ({x: b.x + b.w - markR - 4, y: b.y + markR + 4}));
  const boxes = PLs.map(PL => PL.boxes);
  const faces = boxes.flatMap(b => [b.headA, b.headB]).filter(f => f.w > 0);
  const labelBoxes = [...chips.map(c => c.box), ...headers.map(q => q.c.box), ...strip.map(q => q.c.box), key && key.box, stKey && stKey.box].filter(Boolean);
  const truncated = [...chips.map(c => c.fit), ...headers.map(q => q.c.fit), ...strip.map(q => q.c.fit), key && key.fit, stKey && stKey.fit].filter(f => f && f.truncated).map(f => f.full);
  // (labels never touch each other, the insets or the scenes' people)
  const insetBoxes = insets.map(b => ({x: b.x, y: b.y, w: b.w, h: b.h}));
  const people = boxes.flatMap(b => [b.personA, b.personB]);
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))
    && labelBoxes.every(b => insetBoxes.every(z => !hit(b, z, 1)) && people.every(z => !hit(b, z, 0)));
  const figPx = Math.min(...boxes.map(b => b.personB.h)) * pxPer;
  const headPx = Math.min(...boxes.flatMap(b => [b.headA.w, b.headB.w])) * HEAD_K * pxPer;
  const sceneShare = {w: r(stB.ext.w * sol.s / D.w, 3), h: r(stB.ext.h * sol.s / D.h, 3)};
  // (the changed fact in each room — the third card in its cell of the Subject B row: the ● cell in A, the ◆ cell in B —
  // rendered size, px at 1080p; the smaller of the two)
  // (w: the Subject B row's two cells, between which the card's place differs; h: the card itself)
  const rowB = b => b.cells[1].x + b.cells[1].w - b.cells[0].x;
  const changePx = {w: r(Math.min(rowB(boxes[0]), rowB(boxes[1])) * pxPer, 1), h: r(Math.min(boxes[0].cells[0].h, boxes[1].cells[1].h) * pxPer, 1)};
  return {insets, PLs, stages, headers, chips, strip, markers, markR, key, stKey, faces, labelBoxes, truncated, labelsClear, figPx, headPx, sceneShare, changePx, small, R, row,
    ok: sol.fitted && !truncated.length && labelsClear && (!side || fl.h + top0 <= D.h - 8) && fl.h + stripY <= D.h - 4 && sceneH > 40, arr, peopleK, sizeK, showAll,
    // (the drawn block of both scenes, as a share of the design box: for the labels-hidden choice)
    fillOk: (stB.ext.w * sol.s * (row ? 2 : 1)) / D.w >= 0.8 && ((stB.ext.h - 30) * sol.s * (row ? 1 : 2)) / D.h >= 0.5, s: sol.s, textPx: r(sol.stage.G.ts * sol.s, 2)};
}

/** The inset geometry (shared by the drawing and the frame): the tray lane · the board piece with its two column
 * glyphs and the two cells of the Subject B row. */
function insetGeo(b) {
  const R = b.R;
  const SW = R * 3.2, FH = R * 2.6, hdH = R * 2.2;
  const laneX = b.x + R * 0.4;
  const boardX = laneX + SW + R * 0.35;
  const colX = [boardX + R * 0.35, boardX + R * 0.35 + SW + R * 0.4];
  const boardW = colX[1] + SW + R * 0.35 - boardX;
  const y0 = b.y + (b.h - (hdH + FH)) / 2 + hdH;
  return {R, SW, FH, hdH, laneX, boardX, boardW, colX, y0};
}

/**
 * Centres for name chips of widths ws under the people at xs, inside [lo, hi]: each as near its person as it can be,
 * in the people's order, never touching another (10 units apart).
 */
function packChips(xs, ws, lo, hi) {
  const order = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
  const c = xs.map((x, i) => clamp(x, lo + ws[i] / 2, hi - ws[i] / 2));
  for (let k = 1; k < order.length; k++) { const i = order[k], j = order[k - 1]; c[i] = Math.max(c[i], c[j] + ws[j] / 2 + 10 + ws[i] / 2); }
  for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; c[i] = Math.min(c[i], k === order.length - 1 ? hi - ws[i] / 2 : c[order[k + 1]] - ws[order[k + 1]] / 2 - 10 - ws[i] / 2); }
  return c;
}

/**
 * One inset: the tray lane and the Subject B row of scene k drawn large — the two cells under their column glyphs (●
 * agreed, ◆ open: the same size and stroke), the third card in the lane with its state glyph (A ●, B ◆) once the
 * change is shown; it slides into the cell of its state (A the ● cell, B the ◆ cell).
 */
function inset(ctx, b, k) {
  const th = ctx.theme;
  const ink = '#1f2328';
  const I = insetGeo(b);
  const {R, SW, FH} = I;
  const card = (x, y) => g(null,
    h('path', {d: roundRectPath(x, y, SW, FH, 4), fill: '#f0d58c', stroke: ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x + SW * 0.08, y + FH * 0.14, SW * 0.84, FH * 0.72, 3), fill: th.paper, stroke: ink, 'stroke-width': 1.2}));
  return g({name: `inset${k}`},
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: '#efe3c8', stroke: ink, 'stroke-width': 2.5}),
    // the tray lane (left, level with the cells) and the board piece with the two cells (right)
    h('path', {d: roundRectPath(I.laneX - R * 0.2, I.y0 - R * 0.35, SW + R * 0.4, FH + R * 0.7, 6), fill: '#dfe7ec', stroke: ink, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(I.boardX, I.y0 - I.hdH - R * 0.1, I.boardW, I.hdH + FH + R * 0.45, 8), fill: '#c9a15e', stroke: ink, 'stroke-width': 2}),
    I.colX.map(x => h('path', {d: roundRectPath(x - 2, I.y0 - 2, SW + 4, FH + 4, 4), fill: '#d9cfb8', stroke: ink, 'stroke-width': 1.2})),
    I.colX.map((x, j) => stateGlyph(ctx, {name: `inset${k}-h${j}`, kind: j ? 'additional' : 'initial', x: x + SW / 2, y: I.y0 - I.hdH / 2, R: R * 0.62})),
    g({name: `inset${k}-c`}, card(I.laneX, I.y0),
      stateGlyph(ctx, {name: `inset${k}-gl`, kind: k ? 'additional' : 'initial', x: I.laneX + SW / 2, y: I.y0 + FH / 2, R, opacity: 0})),
  );
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const font = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";
  return g(null,
    L.stages.map((st, k) => g({transform: `${T(L.PLs[k].ox, L.PLs[k].oy)} scale(${r(L.s, 5)})`}, st.node)),
    L.chips.map(c => c.node),
    L.headers.map((q, k) => g({name: `hdr${k}`, opacity: 0}, badge(ctx, k, q.bx, q.by, L.R, `hdr${k}-mk`), q.c.node)),
    L.strip.map(q => (['changed', 'guide', 'note'].includes(q.name) ? g({name: `strip-${q.name}-g`, opacity: 0}, q.c.node) : q.c.node)),
    L.insets.map((b, k) => inset(ctx, b, k)),
    L.showAll && L.markers.map((m, k) => g({name: `mark${k}`, opacity: 0},
      h('circle', {cx: r(m.x), cy: r(m.y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(m.x), y: r(m.y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': font, fill: th.ink}, '1'))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
  );
}

function frameScene(ctx, L, u) {
  const c = clamp((u - C0) / (C1 - C0), 0, 1);
  const nodes = {};
  // (both rooms: Party A pushes the third card into the Subject B row — A into the ● cell, B on into the ◆ cell)
  const vs = L.stages.map((st, k) => choreo(c, st.G, k ? 'open' : 'agreed'));
  const hdrP = seg(u, ...W_.headers);
  const appP = seg(u, ...W_.appear);
  const chP = seg(u, ...W_.changed);
  const guideP = seg(u, ...W_.guide);
  const noteP = seg(u, ...W_.note);
  const grP = seg(u, ...W_.group);
  // the localized change: the third card's supplied state appears on it — A ● agreed, B ◆ open; the subject frames come
  // alike in both rooms once both cards are in their cells
  const posed = L.stages.map((st, k) => st.pose({...vs[k], aP: k ? 0 : appP, oP: k ? appP : 0, groupP: grP}));
  posed.forEach(pz => Object.assign(nodes, pz.nodes));
  [0, 1].forEach(k => {
    if (L.headers[k]) nodes[`hdr${k}`] = {opacity: r(hdrP, 3)};
    if (L.showAll) nodes[`mark${k}`] = {opacity: r(guideP, 3)};
  });
  // the insets follow their scenes: the card slides from the tray lane into the cell of its state; its glyph appears
  // with the change
  const progs = L.stages.map((st, k) => { const tr = st.G.travelOf[k ? 'open' : 'agreed']; return tr > 0 ? clamp(vs[k].sheetD / tr) : 0; });
  [0, 1].forEach(k => {
    const I = insetGeo(L.insets[k]);
    nodes[`inset${k}-c`] = {transform: T(r((I.colX[k] - I.laneX) * progs[k], 2), 0)};
    nodes[`inset${k}-gl`] = {opacity: r(appP, 3)};
  });
  if (L.strip.some(q => q.name === 'changed')) nodes['strip-changed-g'] = {opacity: r(chP, 3)};
  if (L.strip.some(q => q.name === 'guide')) nodes['strip-guide-g'] = {opacity: r(guideP, 3)};
  if (L.strip.some(q => q.name === 'note')) nodes['strip-note-g'] = {opacity: r(noteP, 3)};
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  const M = k => q => (q ? {x: r(L.PLs[k].M(q).x), y: r(L.PLs[k].M(q).y)} : null);
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phaseA: vs[0].phase, phaseB: vs[1].phase, travelA: r(vs[0].sheetD, 2), travelB: r(vs[1].sheetD, 2), slottedA: vs[0].slotted, slottedB: vs[1].slotted,
      // the one difference: the third card's supplied state — A ● agreed (it stops in the ● cell), B ◆ open (it glides on
      // into the ◆ cell); before the change beat neither glyph is shown and nothing has moved — the two rooms are identical
      lookA: {agreed: posed[0].semantic.aP, open: posed[0].semantic.oP, travel: r(vs[0].sheetD, 2)}, lookB: {agreed: posed[1].semantic.aP, open: posed[1].semantic.oP, travel: r(vs[1].sheetD, 2)},
      cellA: vs[0].slotted ? 'agreed' : null, cellB: vs[1].slotted ? 'open' : null, groupP: r(grP, 3),
      configShown: r(appP, 3), insetProgress: [r(progs[0], 3), r(progs[1], 3)], cards: 3,
      handSA: M(0)(posed[0].semantic.hand), handSB: M(1)(posed[1].semantic.hand), gripSB: M(1)(posed[1].semantic.grip), gripSA: M(0)(posed[0].semantic.grip), allReached: posed.every(pz => pz.semantic.allReached), markPB: posed[1].semantic.markP, markPA: posed[0].semantic.markP,
      headers: r(hdrP, 3), changedShown: r(chP, 3), guide: r(guideP, 3), note: r(noteP, 3),
      truncated: L.truncated, labelsClear: L.labelsClear, figPx: r(L.figPx, 1), headPx: r(L.headPx, 1), textPx: L.textPx, sceneShare: L.sceneShare, changePx: L.changePx, arrangement: L.arr, peopleK: L.peopleK, textK: r(L.sizeK, 3),
      faces: L.faces.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-10-contrast',
    title: 'Ordering of issues (illustrative) — the same room with Issue 3 supplied as agreed (A) or as open (B)',
    titleEs: 'Ordenación de cuestiones — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Ordenación de cuestiones',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete copies of the same room — Party A beside her tray with the third issue card and the push bar, the case file open on its easel as a sorting board (● agreed and ◆ open columns, Subject A and Subject B rows, Issue 1 and Issue 2 in the Subject A row), the calendar and Party B — side by side (stacked on tall frames). The shared texts are printed once. Only one fact differs: the third card’s supplied state — in A ● agreed issue, so it stops in the nearer column; in B ◆ open issue, so it glides on into the farther column. The subject frames come alike in both rooms. Insets draw the tray and the Subject B row large, and a numbered marker and a guide chip name the difference. “Agreed” only means the supplied list marks the issue as agreed between the parties; nothing is decided or proven; no winner, procedure, effect or outcome is shown.',
    tags: ['ordering of issues', 'agreed issue', 'open issue', 'contrast', 'paired scenarios', 'case file', 'sorting board', 'tray', 'calendar', 'issue cards'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/ordenacion-cuestiones.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
