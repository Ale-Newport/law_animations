/**
 * LAW-0159 — Regla transitoria · contrast
 *
 * Storyboard (two complete band desks, A and B; reader B's hand in each):
 *  0.00–0.17  base: both lanes show the same scene — version 1 and version 2
 *             bound at the ends of the band, the post planted at the supplied
 *             milestone with its tag, the lane marked before / after, the
 *             timeline ruler, one case card waiting at the left end of the
 *             card row with a BLANK day chip, a date stamp and reader B's hand.
 *             Everything the lanes share (hierarchy, the versions' titles,
 *             the printed passage, the attributed reading, the shared facts)
 *             is drawn once, in the shared strip.
 *  0.17–0.40  change: in both lanes B takes the stamp and presses it on the
 *             card's day chip — A receives "Day 14", B "Day 26" (the only
 *             supplied datum that differs); the scenario labels appear.
 *  0.40–0.77  parallel: with identical timing B slides the card to its
 *             supplied day and its pin drops into the ruler: in A the card
 *             stops left of the post, in B it travels further, past the post.
 *             Only then does each strip show its position: "before" / "after
 *             the supplied milestone".
 *  0.77–1.00  guide: both cards are ringed and joined by a comparison bracket
 *             labelled with the changed fact; a neutral note says positions
 *             are as supplied and no conclusion is drawn on which version
 *             applies. No winner, score or outcome.
 * @module animations/sources/LAW-0159
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath, cubic} from '../../core/geometry.js';
import {contrastFields, obj, str, int, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {stampTool} from '../../primitives/paper.js';
import {readingNote, fitWords} from './kits/ambito-temporal.js';
import {
  transitionFields, RT_STRINGS, RT_DEFAULTS, rtData, bandDesk, sizeStageW, levelRack, noteChip, noteChipSize, badFit, sideColors, CASE_ICONS,
} from './kits/regla-transitoria.js';

const ID = 'LAW-0159';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {
  toStamp: [0.14, 0.2], stampUp: [0.2, 0.25], press: [0.25, 0.29], stampBack: [0.29, 0.34], toCard: [0.34, 0.4],
  labels: [0.21, 0.27], slide: [0.44, 0.62], pin: [0.62, 0.67], strip: [0.67, 0.72], bBack: [0.7, 0.78],
  guide: [0.79, 0.87], guideChip: [0.85, 0.9], neutral: [0.87, 0.92],
};
const KEY_PX = 20.6;

const {cases: _omit, ...laneFields} = transitionFields;
const sceneSchema = {
  ...laneFields,
  changedCase: obj('The one case whose supplied day differs between A and B (fictional)', {
    label: str('Short description of the case (fictional)', 60),
    icon: oneOf('Icon printed on the case card', CASE_ICONS),
    dayA: int('Supplied day of the case in scenario A (same unit as the ruler)', -99, 1000),
    dayB: int('Supplied day of the case in scenario B (same unit as the ruler)', -99, 1000),
  }, ['label', 'dayA', 'dayB']),
  ...contrastFields(),
};

const {cases: _c, ...BASE} = RT_DEFAULTS;
const defaultParams = {
  ...BASE,
  changedCase: {label: 'Case 2 · goods delivered', icon: 'parcel', dayA: 14, dayB: 26},
  scenarioA: {label: 'Earlier case', caption: 'Day before the milestone'},
  scenarioB: {label: 'Later case', caption: 'Day after the milestone'},
  changedFact: 'only the day of Case 2 differs',
  sharedFacts: ['Same versions, band and milestone', 'Same gestures and timing'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Positions as supplied · no conclusion drawn on which version applies'},
};

const STRINGS = {
  en: {...RT_STRINGS.en, same: 'Same in A and B'},
  es: {...RT_STRINGS.es, same: 'Igual en A y B'},
};

const ARR = {landscape: 'row', square: 'row', portrait: 'column'};
const STAGE_W = {landscape: 1960, square: 1180, portrait: 900};

/** Shared "same in A and B" card: title + text blocks. Local origin = top-left. */
function sharedCard(ctx, o) {
  const th = ctx.theme;
  const {w, K} = o;
  const pad = K * 0.7;
  const fits = [];
  const blocks = [];
  let y = pad;
  const colW = o.cols === 2 ? (w - pad * 3) / 2 : w - pad * 2;
  let x0 = pad;
  const add2 = (text, style) => {
    const f = fitWords(ctx, text, {maxWidth: colW - (style.bullet ? K : 0), size: K, minSize: K, floorSize: K, maxLines: 8, weight: style.weight ?? 500, family: style.family ?? 'sans'});
    fits.push(f);
    blocks.push({f, y, x: x0, style});
    y += f.height + K * (style.after ?? 0.35);
  };
  add2(o.title, {weight: 800, after: 0.5});
  add2(o.versions, {weight: 700, family: 'serif'});
  add2(o.ref, {weight: 800});
  if (o.text) add2(o.text, {weight: 400, family: 'serif', italic: true});
  let y1 = y;
  if (o.cols === 2) { y = pad + (blocks[0].f.height + K * 0.5); x0 = pad * 2 + colW; }
  for (const f of o.facts) add2(f, {bullet: true, weight: 500});
  const hh = Math.max(y, y1) - K * 0.35 + pad;
  const node = g({name: o.name, transform: T(o.x, o.y)},
    h('path', {d: roundRectPath(6, 9, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 12), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(0, 0, 12, hh, 6), fill: th.inkSoft, opacity: 0.35}),
    blocks.map(b => [
      b.style.bullet ? h('circle', {cx: b.x + K * 0.3, cy: b.y + K * 0.55, r: K * 0.17, fill: th.inkSoft}) : null,
      ctx.show('key') ? textBlock(b.f, {x: b.x + (b.style.bullet ? K : 0), y: b.y, fill: b.style.weight === 400 ? th.inkSoft : th.ink, italic: b.style.italic})
        : h('rect', {x: b.x + (b.style.bullet ? K : 0), y: b.y + b.f.size * 0.25, width: Math.min(b.f.width, w - pad * 2) * 0.85, height: b.f.size * 0.45, rx: 4, fill: th.paperLine}),
    ]),
  );
  return {node, w, h: hh, fits};
}

/** Scenario header: coloured letter badge, label and caption (wrapped, never shrunk). */
function scenarioTab(ctx, o) {
  const th = ctx.theme;
  const {K} = o;
  const R = K * 0.95;
  const lf = fitWords(ctx, o.label, {maxWidth: o.w - R * 2 - K * 0.8, size: K * 1.08, minSize: K * 1.08, floorSize: K * 1.08, maxLines: 3, weight: 800});
  const cf = o.caption ? fitWords(ctx, o.caption, {maxWidth: o.w - R * 2 - K * 0.8, size: K, minSize: K, floorSize: K, maxLines: 4, weight: 500}) : null;
  // label and caption on one line when both fit
  const inline = cf && lf.lines.length === 1 && cf.lines.length === 1 && lf.width + K * 1.2 + cf.width <= o.w - R * 2 - K * 0.8;
  const hh = inline ? R * 2 : Math.max(R * 2, lf.height + (cf ? cf.height + K * 0.3 : 0));
  const capX = inline ? R * 2 + K * 0.6 + lf.width + K * 1.2 : R * 2 + K * 0.6;
  const capY = inline ? (R * 2 - K) / 2 + K * 0.05 : lf.height + K * 0.3;
  const labY = inline ? (R * 2 - lf.size) / 2 : 0;
  const node = g({name: o.name, transform: T(o.x, o.y)},
    h('circle', {cx: R, cy: R, r: R, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: R, y: R + K * 0.36, 'text-anchor': 'middle', 'font-size': r(K), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
    g({name: `${o.name}-words`, opacity: 0},
      ctx.show('key') ? textBlock(lf, {x: R * 2 + K * 0.6, y: labY, fill: th.ink}) : null,
      cf && ctx.show('all') ? textBlock(cf, {x: capX, y: capY, fill: th.inkSoft}) : null),
  );
  return {node, h: hh, fits: [lf, cf].filter(Boolean)};
}

function buildStage(ctx, p, W, K, arr) {
  const th = ctx.theme;
  const t = ctx.t;
  const m = 16;
  const cap = K * 0.92;
  const gutter = arr === 'row' ? 0 : K * 2.4;
  const sideW = arr === 'side' ? Math.round(W * 0.3) : 0;
  const gapX = K * 1.0;
  const laneW = arr === 'row' ? (W - gapX) / 2 : W - gutter - (sideW ? sideW + K * 0.8 : 0);
  const cc = p.changedCase;
  const laneP = day => ({...p, cases: [{label: cc.label, day, icon: cc.icon}]});
  const dA = rtData(laneP(cc.dayA)), dB = rtData(laneP(cc.dayB));
  const dayW = Math.max(...[dA, dB].map(d0 => ctx.measure(d0.dayText(d0.cases[0].day), K, 800, 'sans'))) + K * 0.9;
  const colors = [th.accent3, th.accent2];
  const lane = (prefix, d) => bandDesk(ctx, {
    prefix, mode: 'square', W: laneW, K, p: laneP(d.cases[0].day), d,
    rack: false, note: false, holder: false, deck: true, tray: false, arms: true, armA: false, bare: true,
    deckCards: [0], dayW, blankDay: [0], calloutTexts: [], cwMax: laneW * 0.72, bookW: Math.max(K * 3.5, Math.min(190, laneW * 0.1)), tagMax: K * 17, bareRibbon: 0.6, slotGap: 0.9, zoneMin: 0, laneH: 1.45, rulerH: 2.2,
    restB: q => ({x: q.m + q.cw + K * 7.2, y: q.slotBottom + K * 1.15}), bottomPad: K * 1.65,
  });
  const A = lane('A', dA), B = lane('B', dB);
  // scenario headers: a row above each lane, full lane width (the badge shows from the start, words at the change)
  const tabs = [p.scenarioA, p.scenarioB].map((sc, i) => scenarioTab(ctx, {name: `hd${i}`, K, w: laneW - 16, x: 0, y: 0, label: sc.label, caption: sc.caption, color: colors[i], letter: i ? 'B' : 'A'}));
  const headH = Math.max(...tabs.map(q => q.h)) + K * 0.35;
  const laneH = Math.max(A.H, B.H);
  const hpA = {x: 8, y: -headH}, hpB = {x: 8, y: -headH};
  const narrowHead = false;
  // lane origins
  const oA = {x: 0, y: headH};
  const oB = arr === 'row' ? {x: laneW + gapX, y: headH} : {x: 0, y: headH + laneH + K * 1.2 + headH};
  let y = oB.y + laneH;
  // guide bracket, guide chip and neutral note
  const guideTxt = `${p.comparisonLabels.guide}: ${p.changedFact}`;
  const fits = [...A.brokenList.map(x => ({full: x, truncated: true, lines: []})), ...B.brokenList.map(x => ({full: x, truncated: true, lines: []}))];
  const chipMax = arr === 'side' ? sideW : arr === 'row' ? W * 0.44 : W;
  const gS = noteChipSize(ctx, guideTxt, {size: K, maxWidth: chipMax, weight: 700});
  const nS = noteChipSize(ctx, p.comparisonLabels.neutral, {size: cap, maxWidth: chipMax});
  let guideBox, neutralBox, bracketY = null;
  const parts = {};
  if (arr === 'row') {
    // the guide chip sits on the bracket's horizontal run; the neutral note joins the shared row
    const nS1 = noteChipSize(ctx, p.comparisonLabels.neutral, {size: cap, maxWidth: W - 32 - gS.w - K * 1.5});
    const inlineNeutral = !nS1.truncated && nS1.w >= K * 12;
    const rowH = Math.max(gS.h, inlineNeutral ? nS1.h : 0);
    bracketY = y + K * 0.6 + rowH / 2;
    const tot = gS.w + (inlineNeutral ? nS1.w + K : 0);
    guideBox = {x: W / 2 - tot / 2, y: bracketY - gS.h / 2, w: gS.w, h: gS.h};
    if (inlineNeutral) neutralBox = {x: guideBox.x + gS.w + K, y: bracketY - nS1.h / 2, w: nS1.w, h: nS1.h};
    y = bracketY + rowH / 2 + K * 0.6;
  } else if (arr === 'column') {
    guideBox = {x: m, y: y + K * 0.8, w: gS.w, h: gS.h};
    neutralBox = gS.w + nS.w + K <= W - 2 * m ? {x: m + gS.w + K, y: guideBox.y, w: nS.w, h: nS.h} : {x: m, y: guideBox.y + gS.h + K * 0.5, w: nS.w, h: nS.h};
    y = Math.max(guideBox.y + gS.h, neutralBox.y + nS.h) + K * 0.9;
  }
  // shared content, drawn once: hierarchy rack · same-in-A-and-B card · attributed reading
  const d0 = dA;
  const sharedArgs = {K, title: t.same, versions: d0.versions.map(v => v.label).join(' · '), ref: d0.passage.ref, text: d0.passage.text, facts: p.sharedFacts};
  let rack, card, note, sharedBottom;
  const withNote = d0.readings.length > 0;
  if (arr === 'side') {
    const sx = laneW + gutter + K * 0.8;
    rack = levelRack(ctx, {name: 'sh-rack', x: sx, y: m, w: sideW, K, levels: d0.levels, versions: d0.versions});
    card = sharedCard(ctx, {...sharedArgs, name: 'sh-card', x: sx, y: m + rack.h + K * 0.6, w: sideW});
    let yy = m + rack.h + K * 0.6 + card.h + K * 0.6;
    note = withNote ? readingNote(ctx, {w: sideW, head: t.readingProposed, by: `${t.byWord} ${d0.readings[0].by}`, text: d0.readings[0].text, size: K, bySize: K, textSize: K}) : null;
    parts.noteAt = {x: sx, y: yy};
    if (note) yy += note.h + K * 0.8;
    guideBox = {x: sx, y: yy, w: gS.w, h: gS.h};
    neutralBox = {x: sx, y: yy + gS.h + K * 0.6, w: nS.w, h: nS.h};
    sharedBottom = neutralBox.y + nS.h;
  } else {
    const inner = W;
    if (arr === 'row') {
      // balance the shared row: try a few width splits, keep the lowest row
      let best = null;
      for (const [fr, fn] of [[0.2, 0.22], [0.2, 0.26], [0.24, 0.24], [0.18, 0.2], [0.22, 0.3]]) {
        const rw = Math.round(Math.max(inner * fr, K * 15.5)), nw = Math.round(Math.max(inner * fn, K * 12));
        const cw2 = Math.max(K * 10, inner - rw - nw - 2 * K);
        const rk = levelRack(ctx, {name: 'sh-rack', x: 0, y, w: rw, K, levels: d0.levels, versions: d0.versions});
        const nt = withNote ? readingNote(ctx, {w: nw, head: t.readingProposed, by: `${t.byWord} ${d0.readings[0].by}`, text: d0.readings[0].text, size: K, bySize: K, textSize: K}) : null;
        const ns = noteChipSize(ctx, p.comparisonLabels.neutral, {size: cap, maxWidth: rw});
        for (const cols of [2, 1]) {
          const cd = sharedCard(ctx, {...sharedArgs, name: 'sh-card', x: rw + K, y, w: cw2, cols});
          if (cd.fits.some(badFit)) continue;
          const hh = Math.max(rk.h + (neutralBox ? 0 : K * 0.6 + ns.h), cd.h, nt ? nt.h : 0);
          if (!ns.truncated && (!best || hh < best.hh)) best = {rk, nt, cd, hh, nw, rw, ns};
        }
      }
      if (!best) {
        const rw = Math.round(Math.max(inner * 0.24, K * 15.5)), nw = Math.round(Math.max(inner * 0.24, K * 12));
        const rk = levelRack(ctx, {name: 'sh-rack', x: 0, y, w: rw, K, levels: d0.levels, versions: d0.versions});
        const nt = withNote ? readingNote(ctx, {w: nw, head: t.readingProposed, by: `${t.byWord} ${d0.readings[0].by}`, text: d0.readings[0].text, size: K, bySize: K, textSize: K}) : null;
        const cd = sharedCard(ctx, {...sharedArgs, name: 'sh-card', x: rw + K, y, w: Math.max(K * 10, inner - rw - nw - 2 * K), cols: 2});
        const ns = noteChipSize(ctx, p.comparisonLabels.neutral, {size: cap, maxWidth: rw});
        best = {rk, nt, cd, nw, rw, ns, hh: Math.max(rk.h + K * 0.6 + ns.h, cd.h, nt ? nt.h : 0)};
      }
      rack = best.rk; note = best.nt; card = best.cd;
      if (!neutralBox) neutralBox = {x: 0, y: y + best.rk.h + K * 0.6, w: best.ns.w, h: best.ns.h};
      parts.noteAt = {x: W - best.nw, y};
      parts.noteW = best.nw;
      sharedBottom = y + best.hh;
    } else {
      const rackW = Math.round(Math.max(inner * 0.44, K * 15.5));
      const noteW = Math.round(Math.max(inner * 0.52, K * 12));
      rack = levelRack(ctx, {name: 'sh-rack', x: 0, y, w: rackW, K, levels: d0.levels, versions: d0.versions});
      note = withNote ? readingNote(ctx, {w: noteW, head: t.readingProposed, by: `${t.byWord} ${d0.readings[0].by}`, text: d0.readings[0].text, size: K, bySize: K, textSize: K}) : null;
      parts.noteAt = {x: W - noteW, y};
      parts.noteW = noteW;
      const row1 = y + Math.max(rack.h, note ? note.h : 0);
      card = sharedCard(ctx, {...sharedArgs, name: 'sh-card', x: 0, y: row1 + K * 0.6, w: inner, cols: 2});
      sharedBottom = row1 + K * 0.6 + card.h;
    }
  }
  fits.push(...rack.fits, ...card.fits, ...tabs.flatMap(q => q.fits));
  if (withNote) fits.push(fitWords(ctx, d0.readings[0].text, {maxWidth: (arr === 'side' ? sideW : parts.noteW) - 32, size: K, minSize: K * 0.97, floorSize: 17, maxLines: 6}));
  const H = Math.max(sharedBottom, oB.y + laneH) + m;
  const broken = fits.filter(badFit).length + (narrowHead ? 1 : 0);
  return {W, H, K, broken, brokenList: [...fits.filter(badFit).map(f => f.full), ...(narrowHead ? ['header'] : [])], A, B, oA, oB, laneW, laneH, tabs, hpA, hpB, rack, card, note, parts, guideBox, neutralBox, bracketY, arr, gutter, cap, guideTxt, dA, dB};
}

const scene = {
  sizes: {landscape: [1960, 900], square: [1180, 1000], portrait: [900, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const arr = ARR[ctx.view.shape];
    const sized = sizeStageW(ctx, (W, K) => buildStage(ctx, p, W, K, arr), (arr === 'column' ? [1] : [0.78, 0.86, 0.94, 1, 1.12, 1.25]).map(f => STAGE_W[ctx.view.shape] * f), KEY_PX);
    const S = sized.desk;
    const th = ctx.theme;
    // rings around each lane's card at its slot + the comparison bracket
    const ring = (desk, o) => {
      const s = desk.slots[0];
      return {x: o.x + s.x - 10, y: o.y + s.y - 10, w: s.w + 20, h: s.h + 20};
    };
    const rA = ring(S.A, S.oA), rB = ring(S.B, S.oB);
    let bracket;
    if (S.arr === 'row') {
      const yb = S.bracketY;
      bracket = `M${r(rA.x + rA.w / 2)} ${r(rA.y + rA.h)}V${r(yb)}H${r(rB.x + rB.w / 2)}V${r(rB.y + rB.h)}`;
    } else {
      const xg = S.laneW + S.gutter * 0.55;
      bracket = `M${r(rA.x + rA.w)} ${r(rA.y + rA.h / 2)}H${r(xg)}V${r(rB.y + rB.h / 2)}H${r(rB.x + rB.w)}`;
    }
    const guide = noteChip(ctx, S.guideTxt, {name: 'guide', x: S.guideBox.x, y: S.guideBox.y, size: S.K, maxWidth: S.guideBox.w + 1, color: th.accent, weight: 700, opacity: 0});
    const neutral = noteChip(ctx, p.comparisonLabels.neutral, {name: 'neutral', x: S.neutralBox.x, y: S.neutralBox.y, size: S.cap, maxWidth: S.neutralBox.w + 1, color: th.inkSoft, dashed: true, opacity: 0});
    // stamp park spot (right of the deck, in the strip under the card row) — identical in both lanes
    const park = {x: 16 + S.A.cw + S.K * 3.4, y: S.A.slotBottom + S.K * 0.85};
    return {S, fit: sized.fit, sized, rA, rB, bracket, guide, neutral, park};
  },
  build(ctx, L) {
    const S = L.S;
    const th = ctx.theme;
    const stamp = (name) => stampTool(ctx, {name, size: S.K * 2.1, color: th.accent4});
    const laneNode = (desk, o, hp, tab, key) => g({transform: T(o.x, o.y)},
      desk.node,
      g({transform: T(hp.x, hp.y)}, tab.node),
      g({name: `${key}-stampW`}, stamp(`${key}-stamp`)),
    );
    return g({transform: T(L.fit.ox, L.fit.oy, 0, L.fit.s)},
      laneNode(S.A, S.oA, S.hpA, S.tabs[0], 'A'),
      laneNode(S.B, S.oB, S.hpB, S.tabs[1], 'B'),
      h('path', {name: 'ringA', d: roundRectPath(L.rA.x, L.rA.y, L.rA.w, L.rA.h, 16), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}),
      h('path', {name: 'ringB', d: roundRectPath(L.rB.x, L.rB.y, L.rB.w, L.rB.h, 16), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}),
      h('path', {name: 'bracket', d: L.bracket, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', opacity: 0}),
      S.rack.node,
      S.card.node,
      S.note ? g({transform: T(S.parts.noteAt.x, S.parts.noteAt.y)}, S.note.node) : null,
      L.guide.node,
      L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const S = L.S;
    const K = S.K;
    const nodes = {};
    const look = {};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    for (const [key, desk] of [['A', S.A], ['B', S.B]]) {
      // stamp: parked → lifted over the card's day chip → pressed → parked again
      const deck = desk.deckPos(0);
      const chip = {x: deck.x + desk.cw - K * 1.9, y: deck.y + K * 1.5};
      const park = L.park;
      let sp = park, sk = 1, sh = 1;
      if (u >= W_.stampUp[0] && u < W_.stampBack[1]) {
        if (u < W_.stampUp[1]) {
          const e = ease.inOutSine(seg(u, ...W_.stampUp));
          sp = cubic(park, {x: park.x, y: park.y - K * 3}, {x: chip.x, y: chip.y - K * 2}, chip, e);
          sk = 1 + 0.08 * Math.sin(Math.PI * e);
        } else if (u < W_.press[1]) {
          sp = chip;
          sk = 1 - 0.08 * Math.sin(Math.PI * seg(u, ...W_.press));
        } else {
          const e = ease.inOutSine(seg(u, ...W_.stampBack));
          sp = cubic(chip, {x: chip.x, y: chip.y - K * 2}, {x: park.x, y: park.y - K * 3}, park, e);
          sk = 1 + 0.08 * Math.sin(Math.PI * e);
        }
        sh = sk;
      }
      nodes[`${key}-stampW`] = {transform: T(sp.x, sp.y, 0, sk)};
      nodes[`${key}-stamp-shadow`] = {transform: T(8 + 60 * (sh - 1), 12 + 80 * (sh - 1))};
      const stamped = u >= lerp(W_.press[0], W_.press[1], 0.5);
      // hand: rest → stamp → (holds it) → deck card → slide → back to rest
      const rest = desk.restB;
      const stampGrip = q => ({x: q.x, y: q.y + K * 0.4});
      const cardGrip = desk.deckGrip(0);
      let bHand;
      if (u < W_.toStamp[0]) bHand = {kind: 'rest'};
      else if (u < W_.stampUp[0]) bHand = {kind: 'to', from: rest, to: stampGrip(park), e: seg(u, ...W_.toStamp)};
      else if (u < W_.stampBack[1]) bHand = {kind: 'to', from: stampGrip(sp), to: stampGrip(sp), e: 1};
      else if (u < W_.toCard[1]) bHand = {kind: 'to', from: stampGrip(park), to: cardGrip, e: seg(u, ...W_.toCard)};
      else if (u < W_.pin[1]) bHand = {kind: 'card', card: 0};
      else bHand = {kind: 'to', from: desk.slotGrip(0), to: rest, e: seg(u, ...W_.bBack)};
      const slide = seg(u, ...W_.slide);
      const cardState = slide <= 0 ? 'deck' : slide >= 1 ? 'slot' : 'moving';
      const posed = desk.pose({band: 1, postState: 'planted', zones: 1, cards: [{state: cardState, slide, pin: seg(u, ...W_.pin), strip: seg(u, ...W_.strip)}], bHand});
      Object.assign(nodes, posed.nodes);
      // blank chip until the stamp presses, then the day
      nodes[`${key}-c0-blank`] = {opacity: stamped ? 0 : 1};
      nodes[`${key}-c0-day`] = {opacity: stamped ? 1 : 0};
      nodes[`hd${key === 'A' ? 0 : 1}-words`] = {opacity: r(seg(u, ...W_.labels), 3)};
      const s = posed.semantic;
      const rel = q => q && {x: r(q.x), y: r(q.y)};
      look[`${key}grip`] = P2(stampGrip(sp));
      look[key] = {card: rel(s.cards[0]), hand: rel(s.handB), stamp: P2(sp), stamped, pin: r(seg(u, ...W_.pin), 3), strip: r(seg(u, ...W_.strip), 3), labels: r(seg(u, ...W_.labels), 3)};
      look[`${key}sem`] = s;
    }
    const gP = seg(u, ...W_.guide);
    nodes.ringA = {opacity: r(gP, 3)};
    nodes.ringB = {opacity: r(gP, 3)};
    nodes.bracket = {opacity: r(seg(u, W_.guide[0] + 0.03, W_.guide[1]), 3)};
    nodes.guide = {opacity: r(seg(u, ...W_.guideChip), 3)};
    nodes.neutral = {opacity: r(seg(u, ...W_.neutral), 3)};
    const sideA = S.dA.cases[0].side, sideB = S.dB.cases[0].side;
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const mXA = S.A.postXs[0], mXB = S.B.postXs[0];
    const lookA = {card: look.A.card, hand: look.A.hand, stamp: look.A.stamp, stamped: look.A.stamped, pin: look.A.pin, strip: look.A.strip, labels: look.A.labels};
    const lookB = {card: look.B.card, hand: look.B.hand, stamp: look.B.stamp, stamped: look.B.stamped, pin: look.B.pin, strip: look.B.strip, labels: look.B.labels};
    return {nodes, semantic: {
      beat, scenes: 2, lookA, lookB,
      handA: look.Asem.handB, handB: look.Bsem.handB, cardA: look.Asem.cards[0], cardB: look.Bsem.cards[0],
      cardGripA: look.Asem.cardGrips[0], cardGripB: look.Bsem.cardGrips[0], stampA: look.A.stamp, stampB: look.B.stamp, stampGripA: look.Agrip, stampGripB: look.Bgrip,
      allReached: look.Asem.allReached && look.Bsem.allReached,
      sides: {A: look.A.strip >= 1 ? sideA : 'neutral', B: look.B.strip >= 1 ? sideB : 'neutral'}, expected: {A: sideA, B: sideB},
      cardLeftOfPost: {A: S.A.slotCx[0] < mXA, B: S.B.slotCx[0] < mXB},
      slideLen: {A: r(S.A.slotCx[0] - (S.A.deckPos(0).x + S.A.cw / 2)), B: r(S.B.slotCx[0] - (S.B.deckPos(0).x + S.B.cw / 2))},
      sameScene: mXA === mXB && S.A.laneTop === S.B.laneTop && S.A.W === S.B.W && S.A.deckPos(0).x === S.B.deckPos(0).x,
      differsOnly: ['caseDay'],
      guide: r(gP, 3), neutral: r(seg(u, ...W_.neutral), 3),
      textPx: r(L.sized.px, 2), broken: S.brokenList,
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-10-contrast',
    title: 'Transitional rule — a case before vs after the supplied milestone',
    titleEs: 'Regla transitoria — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Regla transitoria',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical band desks: the same two fictional versions, band, milestone post and timeline. Only the day stamped on one case card differs; with the same gestures the card is slid to its supplied day and stops before the post in A and after it in B. A bracket joins the two cards; a neutral note says no conclusion is drawn on which version applies.',
    tags: ['sources', 'transitional rule', 'contrast', 'versions', 'milestone', 'timeline', 'stamp', 'cases', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/regla-transitoria.js', 'src/animations/sources/kits/ambito-temporal.js', 'src/primitives/paper.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
