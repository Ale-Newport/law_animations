/**
 * LAW-0131 — Conflicto entre textos · contrast
 *
 * Storyboard — two complete reading desks run on one clock (brief beats).
 * Everything the two scenes share is drawn ONCE, large, under the pair: the
 * editable hierarchy board and a shared-wording plate (the shared facts, each
 * text's id, title, provision and simulated wording, Text 2's phrase shown as
 * the slot “[ A | B ]”). On the desks the shared wording is drawn quietly and
 * only the differing phrase slot is legible, so key text stays large in every
 * ratio. The board and plate stay on screen through the hold.
 *  [0.00–0.17] base: both desks are identical — the same open book (Text 1)
 *              and the same article (Text 2) resting askew; in both articles
 *              the phrase slot is still empty (dashed outline).
 *  [0.17–0.40] change: the ONE changed fact is written into each slot (word
 *              by word) — wording A in scene A, wording B in scene B — and
 *              the slot is ringed; the assistant's hand takes each article.
 *  [0.40–0.77] parallel: the same hand slides each article to the book and
 *              both phrases are highlighted. Only the supplied state differs
 *              in consequence: A ("compatible application") docks flush and
 *              the hand joins the texts with a paper clip over a calm double
 *              rule; B ("conflict flagged") meets, is held back to a gap, a
 *              jagged zone is drawn and a pennant pin is set on the seam.
 *              (Other supplied states: plain band, no marker.)
 *  [0.77–1.00] guide: lettered rings mark the two phrase slots — the only
 *              fact that differs — and a guide row joins the lettered badges
 *              A and B through the changed-fact label, with a neutral note.
 *              Rings, guide and note are complete by 0.90 and held to the end.
 *              The A/B letter badges (desk plates, rings, guide) use lane
 *              colours (tinted disc, coloured ring, ink letter); only the ring
 *              and guide around the one differing phrase keep the highlight
 *              accent, and B's supplied "conflict flagged" pennant stays red.
 *              No winner, score or legal consequence is shown; both states
 *              are supplied with the example.
 * @module animations/sources/LAW-0131
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, r} from '../../core/time.js';
import {contrastFields, obj, oneOf, str} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {FONTS} from '../../core/text.js';
import {conflictDesk, DESK, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, zoneMode, ZONE_STATES, hierarchyBoard, motifColors, boxesOverlap, passageBlock, fitWords, textOrBars} from './kits/conflicto-entre-textos.js';

const ID = 'LAW-0131';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  shared: [0.02, 0.08], caption: [0.17, 0.23],
  write: [0.19, 0.33], ghostOut: [0.18, 0.21], ringPulse: [0.3, 0.4], grab: [0.3, 0.4],
  slide: [0.4, 0.55], recoil: [0.55, 0.61], hl: [0.47, 0.58], zone: [0.58, 0.66],
  release: [0.6, 0.62], fetch: [0.62, 0.665], carry: [0.665, 0.705], place: [0.705, 0.725], back: [0.725, 0.78],
  releaseAway: [0.6, 0.72],
  // the guide and the neutral note are complete by u = 0.9 (≥ 700 ms of full hold at 7.5 s)
  rings: [0.77, 0.81], guide: [0.79, 0.85], note: [0.84, 0.9],
};
const MARKER = {'conflict-flagged': 'flag', 'compatible-application': 'clip', 'tension-highlighted': 'none'};
/** Final gap per supplied state (docked, held apart, plain); `contact` precedes a recoil. */
const GAPS = {'compatible-application': {gap: 12}, 'conflict-flagged': {gap: 54, contact: 8}, 'tension-highlighted': {gap: 36}};

const sceneSchema = {
  ...sourcesFields,
  ...contrastFields(),
  phrases: obj('The changed fact: wording written into the Text 2 phrase slot in each scene (fictional)', {
    a: str('Wording in scene A', 60),
    b: str('Wording in scene B', 60),
  }, ['a', 'b']),
  states: obj('State supplied by the author for each scene (never inferred from the wording)', {
    a: oneOf('Supplied state of scene A', ZONE_STATES),
    b: oneOf('Supplied state of scene B', ZONE_STATES),
  }, ['a', 'b']),
};

const defaultParams = {
  ...SOURCES_DEFAULTS,
  scenarioA: {label: 'Compatible application', caption: 'Wording A of the Art. 9 phrase'},
  scenarioB: {label: 'Conflict flagged', caption: 'Wording B of the Art. 9 phrase'},
  changedFact: 'Changed fact: only the Art. 9 phrase',
  sharedFacts: ['Same Text 1 and Art. 4 wording', 'Same hierarchy as supplied', 'Same desk and hands'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Both states are supplied with the example; neither text is shown to prevail.'},
  phrases: {a: 'also announced orally', b: 'announced orally only'},
  states: {a: 'compatible-application', b: 'conflict-flagged'},
};

// quiet lanes: side by side on wide and square boxes (two square lanes), stacked on tall ones
const ARR = {landscape: {arrangement: 'row', panel: 'qhPanel'}, portrait: {arrangement: 'column', panel: 'qhPanel'}, square: {arrangement: 'row', panel: 'qsPanel'}};
const GAP = 40;

/**
 * Scenario plate drawn ON each desk (letter badge, supplied label, caption),
 * so the two desks can use the whole frame instead of sharing it with
 * header strips. Sizes shrink (bounded) until the plate fits `maxH`.
 */
function scenarioPlate(ctx, {name, letter, label, caption, x, y, w, maxH, bottom, color, lane, size, content}) {
  const th = ctx.theme;
  // header capped at 1.2× the key text; the caption is never larger than the key text
  let lz = Math.min(size, content * 1.2), cz = Math.min(lz * 0.78, content);
  let lf, cf, hh, R;
  const pad = 16;
  for (let k = 0; k < 12; k++) {
    R = lz * 0.72;
    const tw = w - pad * 2 - R * 2 - 14;
    lf = ctx.show('key') ? ctx.fit(label, {maxWidth: tw, size: lz, minSize: lz * 0.8, maxLines: 3, weight: 800}) : null;
    cf = caption && ctx.show('all') ? ctx.fit(caption, {maxWidth: tw, size: cz, minSize: cz * 0.85, maxLines: 3, weight: 500}) : null;
    hh = pad * 2 + Math.max(R * 2, (lf ? lf.height : 0) + (cf ? cf.height + 14 : 0));
    if ((hh <= maxH && !(lf && lf.truncated) && !(cf && cf.truncated)) || lz < content || cz < content * 0.95) break;
    lz *= 0.94;
    cz *= 0.94;
  }
  // labels hidden: the plate shrinks to its letter badge
  if (!lf && !cf) w = pad * 2 + R * 2;
  const y0 = bottom ? y - hh : y;
  const tx = x + pad + R * 2 + 14;
  const textH = (lf ? lf.height : 0) + (cf ? cf.height + 14 : 0);
  const ty = y0 + (hh - textH) / 2;
  const node = g({name},
    h('path', {d: roundRectPath(x + 5, y0 + 7, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y0, w, hh, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    // the letter disc is the same neutral grey in A and B until the scenario beat, then its lane colour
    // fades in over it (`<name>-lane`, driven by the caption beat)
    h('circle', {cx: x + pad + R, cy: y0 + hh / 2, r: R, fill: color, stroke: th.ink, 'stroke-width': 2.5}),
    lane ? g({name: `${name}-lane`, opacity: 0},
      h('circle', {cx: x + pad + R, cy: y0 + hh / 2, r: R, fill: lane.soft, stroke: th.ink, 'stroke-width': 2.5}),
      h('circle', {cx: x + pad + R, cy: y0 + hh / 2, r: r(R * 0.8), fill: 'none', stroke: lane.color, 'stroke-width': r(R * 0.24, 2)})) : null,
    ctx.show('key') ? h('text', {name: `${name}-letter`, x: r(x + pad + R), y: r(y0 + hh / 2 + R * 0.42), 'text-anchor': 'middle', 'font-size': r(R * 1.2), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, letter) : null,
    lf ? textBlock(lf, {x: tx, y: ty, fill: th.fg}) : null,
    cf ? textBlock(cf, {x: tx, y: ty + (lf ? lf.height + 14 : 0), fill: th.fgSoft}) : null);
  return {node, box: {x, y: y0, w, h: hh}, fits: [lf, cf].filter(Boolean)};
}

/**
 * Shared-wording plate: everything the two scenes have in common is printed ONCE, large —
 * the shared facts, then each text's id, title, provision reference and simulated wording
 * (Text 1's tension phrase highlighted; Text 2's phrase is the slot that differs, shown as
 * “[ A | B ]”). `cols` 2 = texts side by side, 1 = stacked.
 */
function sharedPlate(ctx, {name, w, size, cols, p, t, colors}) {
  const th = ctx.theme;
  const key = ctx.show('key'), all = ctx.show('all');
  const pad = size * 0.75, gapC = size * 1.2;
  const nodes = [], fits = [], passes = [];
  let y = pad;
  const headFit = fitWords(ctx, `${t.sameFacts} · A = B`, {maxWidth: w - pad * 2, size: size * 1.02, minSize: size, maxLines: 2, weight: 800});
  nodes.push(textOrBars(ctx, headFit, key, {x: pad, y, fill: th.fg}));
  fits.push(headFit);
  y += headFit.height + size * 0.45;
  if (p.sharedFacts.length) {
    const ff = fitWords(ctx, p.sharedFacts.join(' · '), {maxWidth: w - pad * 2, size, minSize: size, maxLines: 5, weight: 500});
    nodes.push(textOrBars(ctx, ff, all, {x: pad, y, fill: th.fgSoft}));
    fits.push(ff);
    y += ff.height + size * 0.7;
  }
  const colW = cols === 2 ? (w - pad * 2 - gapC) / 2 : w - pad * 2;
  const top = y;
  let bottom = y;
  [0, 1].forEach(i => {
    const src = p.sources[i], pas = p.passages[i];
    const x = pad + (cols === 2 ? i * (colW + gapC) : 0) + 14;
    let yy = cols === 2 ? top : (i ? bottom + size * 0.8 : top);
    const y0 = yy;
    const cw = colW - 14;
    const tf = fitWords(ctx, `${src.id} · ${src.title}`, {maxWidth: cw, size, minSize: size, maxLines: 3, weight: 800});
    nodes.push(textOrBars(ctx, tf, key, {x, y: yy, fill: th.ink}));
    yy += tf.height + size * 0.45;
    const pf = fitWords(ctx, `§ ${src.provision}`, {maxWidth: cw, size, minSize: size, maxLines: 2, weight: 700, family: 'serif'});
    nodes.push(textOrBars(ctx, pf, all, {x, y: yy, fill: th.ink}));
    yy += pf.height + size * 0.4;
    const pass = passageBlock(ctx, {prefix: `${name}-t${i}`, text: pas.text, phrase: pas.tension, w: cw, size, family: 'serif', maxPre: 6, maxPost: 5, slotText: i ? '[ A | B ]' : null, inlineAfter: !i});
    nodes.push(g({transform: T(x, yy)}, pass.node));
    passes.push(pass);
    fits.push(tf, pf, pass.phFit);
    yy += pass.h;
    // coloured edge = which text (same colours as the tabs on the desks)
    nodes.push(h('rect', {x: x - 14, y: y0, width: 6, height: yy - y0, rx: 3, fill: colors[i]}));
    bottom = Math.max(bottom, yy);
  });
  const hh = bottom + pad;
  const node = g({name},
    h('path', {d: roundRectPath(6, 8, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    nodes);
  return {node, w, h: hh, fits, minSize: Math.min(...fits.map(f => f.size)), truncated: fits.some(f => f.truncated),
    frame: () => Object.assign({}, ...passes.map(q => q.frame({hl: 1})))};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1120], portrait: [1000, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitT(ctx);
    const C = motifColors(ctx);
    const {arrangement, panel} = ARR[ctx.view.shape];
    const PW = DESK[panel].W;
    const row = arrangement === 'row';
    const slotAlso = [p.phrases.a, p.phrases.b];
    // lane colours for the A/B letter badges (AUTHORING "Legal content": scenario badges use their lane
    // colours, not the alarm red; the Text 1/Text 2 colours stay with the texts): tinted disc, coloured
    // inner ring, ink letter
    const LANE = {a: {color: th.accent3, soft: th.accent3Soft}, b: {color: th.accent4, soft: th.accent4Soft}};
    // the hierarchy is a SHARED fact: it is drawn once, large, under the pair (not twice, tiny, on each desk)
    const buildStages = (deskH, extra = {}) => ['a', 'b'].map(k => {
      const state = p.states[k];
      const gp = GAPS[state];
      return conflictDesk(ctx, {
        prefix: `p${k}`, layout: panel, content: p, hierarchyLabel: t.hierarchy,
        phraseB: p.phrases[k], slotAlsoB: slotAlso, ringB: {letter: k.toUpperCase(), badge: LANE[k]},
        marker: MARKER[state], zoneMode: zoneMode(state), gap: gp.gap, contactGap: gp.contact ?? gp.gap,
        reader: false, lens: false, parkedLens: false, note: false, board: false, chips: null, seedKey: 'cet-contrast',
        // the wording both scenes share is printed ONCE (shared plate below); on the desks only the
        // differing phrase slot stays legible
        quietTexts: true, deskH, ...extra,
      });
    });
    let stages = buildStages(undefined);
    // the shared hierarchy board and the shared-wording plate, both drawn once for A and B
    const FB = {
      qhPanel: {w: 700, size: 30, ts: 0.9, plate: {size: 25, cols: 2}},
      qsPanel: {w: 470, size: 33, ts: 0.74, plate: {size: 28, cols: 2}},
      column: {w: PW, size: 30, ts: 0.78, plate: {size: 26, cols: 2}, stack: true},
    }[row ? panel : 'column'];
    // footer text scale: 1 unless a slightly smaller footer lets the desks reach ~40 % of a wide frame
    let fz = 1, fs = 30;
    const whole = c => !c || !c.fit || !c.fit.truncated;
    // with labels hidden the guide keeps two ring markers (no text) joined by the dashed line
    const ringMark = (x, y, anchor) => {
      const R = 20;
      const cx = anchor === 'start' ? x + R : anchor === 'end' ? x - R : x;
      return {node: g(null, h('circle', {cx, cy: y + R, r: R, fill: th.card, stroke: th.accent, 'stroke-width': 5}), h('circle', {cx, cy: y + R, r: 7, fill: th.accent})), box: {x: cx - R, y, w: R * 2, h: R * 2, cx, cy: y + R}, fit: null};
    };
    const chipFor = (k, x, y, anchor, mw) => (ctx.show('key')
      ? chip(ctx, `${k.toUpperCase()} · “${p.phrases[k]}”`, {x, y, anchor, maxWidth: mw, size: fs, minSize: fs * 0.9, maxLines: 3, fill: th.card, stroke: th.accent, name: `guide-${k}`, weight: 700})
      : ringMark(x, y, anchor));
    const labelFor = (x, y, mw) => (ctx.show('key') ? chip(ctx, p.changedFact, {x, y, anchor: 'middle', maxWidth: mw, size: fs, minSize: fs * 0.9, maxLines: 3, fill: th.accentSoft, stroke: th.accent, name: 'guide-label'}) : null);
    // guide: the lettered slot of each lane — A and B, whose wording is legible on the desks — joined
    // through the changed-fact label (one row: badge — label — badge)
    const badge = (k, cx, cy) => {
      const R = fs * 0.95;
      return {node: g({name: `guide-${k}`},
        h('circle', {cx, cy, r: R, fill: LANE[k].soft, stroke: th.ink, 'stroke-width': 2.5}),
        h('circle', {cx, cy, r: r(R * 0.8), fill: 'none', stroke: LANE[k].color, 'stroke-width': r(R * 0.24, 2)}),
        ctx.show('key') ? h('text', {x: r(cx), y: r(cy + R * 0.4), 'text-anchor': 'middle', 'font-size': r(R * 1.1), 'font-weight': 800, 'font-family': FONTS.sans, fill: th.ink}, k.toUpperCase()) : null),
      box: {x: cx - R, y: cy - R, w: R * 2, h: R * 2, cx, cy}, fit: null};
    };
    // the neutral note wraps into balanced lines (no single word left alone on the last line): the
    // narrowest width that keeps the same line count and text size is used
    const note = (text, x, y, mw, name, lines = 4) => {
      const mk = w => chip(ctx, text, {x, y, anchor: 'middle', maxWidth: w, size: fs - 2, minSize: (fs - 2) * 0.9, maxLines: lines, fill: th.card, name, weight: 500});
      const first = mk(mw);
      const n = first.fit.lines.length;
      if (n < 2 || first.fit.truncated) return first;
      let lo = mw * 0.4, hi = mw;
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2, c = mk(mid);
        if (c.fit.lines.length === n && !c.fit.truncated && c.fit.size >= first.fit.size - 0.01) hi = mid; else lo = mid;
      }
      return mk(hi);
    };
    // desk height fitted to its contents: the scenario plate sits just under the texts (no empty
    // band of wood), so the desks scale larger in the frame (AUTHORING 18)
    const fitDesk = (st, W, extra = {}) => {
      let H = DESK[panel].H, w = st[0].plate.w;
      const s0 = st[0], g0 = s0.plate;
      if (g0.y === 'bottom') {
        const texts = Math.max(s0.artFinal.y + s0.art.h, s0.artRest.y + s0.art.h + 14, s0.bookC.y + s0.book.outer.y + s0.book.outer.h);
        // the plate may run the desk's full width when the pin cup sits above it (fewer lines)
        const cupR = s0.G.cupR ?? 44;
        if (s0.cupC.y + cupR * 0.8 + 10 < texts + 26) w = W - g0.x * 2;
        const lk = Math.min(s0.G.slotSize ?? s0.G.size, FB.plate.size);
        const ph = Math.max(...['A', 'B'].map((L1, i) => scenarioPlate(ctx, {name: 'probe', letter: L1, label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
          x: 0, y: 0, w, maxH: s0.G.plateMaxH ?? 150, bottom: false, color: th.inkSoft, size: 38, content: lk}).box.h));
        const fitH = Math.ceil(texts + 26 + ph + 16);
        if (fitH < H || extra.deskW) { H = Math.min(H, fitH); st = buildStages(H, extra); }
      }
      return {stages: st, PH: H, plW: w};
    };
    const fd = fitDesk(stages, PW);
    let PH = fd.PH, plW = fd.plW;
    stages = fd.stages;
    const st0 = stages[0];
    const pl = st0.plate;
    const plateY = pl.y === 'bottom' ? PH - 16 : pl.y;
    const plateMaxH = pl.y === 'bottom' ? (st0.G.plateMaxH ?? 150) : Math.min(260, PH - 34 - pl.y);
    const laneKey = Math.min(st0.G.slotSize ?? st0.G.size, FB.plate.size);
    const lanesW = row ? PW * 2 + GAP : PW;
    const pairH = row ? PH : PH * 2 + GAP;
    const footTop = pairH + (row ? 20 : 28);
    // board candidates: wider boards keep level labels on one line (shorter board)
    const boardsFor = z => [1, 1.25, 1.5].map(k => hierarchyBoard(ctx, {prefix: 'shared-board', w: Math.round(FB.w * k * z), hier: p.hierarchy, ids: p.sources.map(x => x.id), colors: C.src, header: `${t.hierarchy} · ${t.sharedAB}`, size: FB.size * z, tokScale: FB.ts, fitRows: true}));
    let boards = boardsFor(1);
    /**
     * Compose the scene at a total width `bw` (≥ the lanes' width, lanes centred). A wider
     * composition gives the shared plate more room (fewer lines): when the frame is
     * height-bound this costs nothing, so the best-scaling width is chosen below.
     */
    const compose = (bw, inline = false) => {
      const lx = (bw - lanesW) / 2;
      const panels = [0, 1].map(i => (row ? {x: lx + i * (PW + GAP), y: 0} : {x: lx, y: i * (PH + GAP)}));
      // scenario plates on the desks (same spot in both scenes)
      const plates = panels.map((pn, i) => scenarioPlate(ctx, {
        name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
        x: pn.x + pl.x, y: pn.y + plateY, w: plW, maxH: plateMaxH, bottom: pl.y === 'bottom', color: th.inkSoft, lane: LANE[i ? 'b' : 'a'], size: 38, content: laneKey,
      }));
      // board and plate side by side when there is room, else stacked (plate above); the board width
      // that gives the lowest footer is used
      let board, shPlate, stack;
      for (const bd of boards) {
        if (bd !== boards[0] && bw - bd.w - 40 < 600) continue;
        // a board whose level labels had to shrink is only a fallback
        if (bd.labelTextSize < FB.size * 0.88 && boards.some(q => q !== bd && q.labelTextSize >= FB.size * 0.88 && bw - q.w - 40 >= 600)) continue;
        const st = Boolean(FB.stack) && bw - bd.w - 40 < 760;
        const sp = sharedPlate(ctx, {name: 'shared-plate', w: st ? bw : bw - bd.w - 40, size: FB.plate.size * fz, cols: FB.plate.cols, p, t, colors: C.src});
        const hgt = st ? sp.h + 24 + bd.h : Math.max(sp.h, bd.h);
        if (!board || hgt < (stack ? shPlate.h + 24 + board.h : Math.max(shPlate.h, board.h)) - 1) { board = bd; shPlate = sp; stack = st; }
      }
      const plateAt = stack ? {x: 0, y: footTop} : {x: board.w + 40, y: footTop};
      const boardAt = stack ? {x: (bw - board.w) / 2, y: footTop + shPlate.h + 24} : {x: 0, y: footTop};
      const p1Bottom = Math.max(boardAt.y + board.h, plateAt.y + shPlate.h);
      // guide: the lettered slot of each lane — A and B, whose wording is legible on the desks —
      // joined through the changed-fact label (one row: badge — label — badge); it sits under the
      // shared board and plate, which stay on screen through the hold
      const R = fs * 0.95;
      let aCx = row ? panels[0].x + stages[0].phB.x + stages[0].phB.w / 2 : R + 4;
      let bCx = row ? panels[1].x + stages[1].phB.x + stages[1].phB.w / 2 : bw - R - 4;
      let room = Math.max(200, bCx - aCx - R * 2 - 60);
      let probe = labelFor(0, 0, room);
      // a long label gets the whole row (badges at its ends) rather than a third line
      if (probe && probe.fit.lines.length > 2) {
        aCx = R + 4; bCx = bw - R - 4; room = Math.min(1500, bCx - aCx - R * 2 - 60);
        probe = labelFor(0, 0, room);
      }
      // `inline`: one footer row — the guide (A — changed-fact label — B) on the left and the neutral
      // note beside it — used when it lets the desks scale larger (wide frames, AUTHORING 18)
      let noteProbe = null;
      if (inline) {
        const lw = Math.min(760, bw * 0.42);
        probe = labelFor(0, 0, lw);
        const gw = (probe ? probe.box.w : 120) + R * 4 + 48;
        aCx = R + 4; bCx = gw - R - 4; room = lw;
        noteProbe = ctx.show('all') ? note(p.comparisonLabels.neutral, 0, 0, bw - gw - 40, 'neutral-note', 2) : null;
        // only when neither the label nor the note has to shrink or cut
        if (noteProbe && (noteProbe.fit.truncated || noteProbe.fit.size < fs - 2 - 0.01)) return null;
        if (probe && (probe.fit.truncated || probe.fit.size < fs - 0.01)) return null;
      }
      const h2 = Math.max(R * 2, probe ? probe.box.h : 0, noteProbe ? noteProbe.box.h : 0);
      const gTop = p1Bottom + (inline ? 22 : 26);
      const lineY = gTop + h2 / 2;
      const guideA = badge('a', aCx, lineY), guideB = badge('b', bCx, lineY);
      const guideL = probe ? labelFor((aCx + bCx) / 2, lineY - probe.box.h / 2, room) : null;
      const guideLine = `M${r(aCx + R)} ${r(lineY)}H${r(bCx - R)}`;
      const guideBottom = gTop + h2;
      const neutral = !ctx.show('all') ? null
        : inline ? note(p.comparisonLabels.neutral, (bCx + R + 40 + bw) / 2, lineY - noteProbe.box.h / 2, bw - (bCx + R) - 40, 'neutral-note', 2)
        : note(p.comparisonLabels.neutral, bw / 2, guideBottom + 18, Math.min(bw * 0.95, 1500), 'neutral-note');
      const bh = Math.max(p1Bottom, neutral ? neutral.box.y + neutral.box.h : guideBottom) + 10;
      return {bw, bh, s: Math.min(ctx.design.w / bw, ctx.design.h / bh), board, panels, plates, shPlate, plateAt, boardAt, p1Bottom, guideA, guideB, guideL, guideLine, neutral};
    };
    // design units → pixels in the canonical 1080p frame of this shape (default caption-safe box),
    // for the key-label size check
    const CAN = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
    const fit = Math.min(CAN[0] * 0.88 / ctx.design.w, CAN[1] * 0.74 / ctx.design.h);
    const lanePh = stages.map(st => st.art.pass.phFit.size);
    const keyOf = c => Math.min(c.shPlate.minSize, ...lanePh, ...[c.guideA, c.guideB, c.guideL, c.neutral].filter(q => q && q.fit).map(q => q.fit.size));
    // share of the frame width one desk takes (frame with the default 6 % side margins)
    const deskFracOf = (sc, pw = PW) => pw * sc * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) / (ctx.view.content.w / 0.88);
    const solve = () => {
      let b = compose(lanesW);
      for (let k = 0; k <= 10; k++) {
        for (const inline of k ? [false, true] : [true]) {
          const c = compose(lanesW * (1 + 0.08 * k), inline);
          if (c && c.s > b.s + 1e-3) b = c;
        }
      }
      return b;
    };
    let best = solve();
    // side by side: if the desks stay under ~40 % of the frame width, try a slightly smaller footer
    // (key text stays ≥ 16 px at 1080p)
    if (row && deskFracOf(best.s) < 0.405) {
      for (const z of [0.94, 0.88]) {
        fz = z; fs = 30 * z; boards = boardsFor(z);
        const c = solve();
        if (keyOf(c) * c.s * fit < 16.2) break;
        if (c.s > best.s + 1e-3) best = c;
        if (deskFracOf(c.s) >= 0.405) break;
      }
    }
    /**
     * Square frames, alternative: the two desks STACKED on the left and the shared footer (plate,
     * board, guide, note) as one column of width `fw` on the right. Used when it gives the desks a
     * larger share of the frame width than the side-by-side row (only when the row leaves the desks
     * under ~40 % of the width, e.g. long labels), with key text ≥ 16 px.
     */
    const composeSide = (fw, cols, S) => {
      const panels = [0, 1].map(i => ({x: 0, y: i * (S.PH + GAP)}));
      const plates = panels.map((pn, i) => scenarioPlate(ctx, {
        name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
        x: pn.x + pl.x, y: pn.y + S.PH - 16, w: S.plW, maxH: plateMaxH, bottom: true, color: th.inkSoft, lane: LANE[i ? 'b' : 'a'], size: 38, content: laneKey,
      }));
      const x0 = S.W + 44;
      const shPlate = sharedPlate(ctx, {name: 'shared-plate', w: fw, size: FB.plate.size * fz, cols, p, t, colors: C.src});
      const board = hierarchyBoard(ctx, {prefix: 'shared-board', w: Math.round(fw), hier: p.hierarchy, ids: p.sources.map(x => x.id), colors: C.src, header: `${t.hierarchy} · ${t.sharedAB}`, size: FB.size * fz, tokScale: FB.ts, fitRows: true});
      const R = fs * 0.95;
      const colH0 = shPlate.h + 24 + board.h;
      const room = fw - R * 4 - 40;
      const probe = labelFor(0, 0, room);
      const h2 = Math.max(R * 2, probe ? probe.box.h : 0);
      const noteProbe = ctx.show('all') ? note(p.comparisonLabels.neutral, 0, 0, fw, 'neutral-note') : null;
      const colH = colH0 + 24 + h2 + (noteProbe ? 16 + noteProbe.box.h : 0);
      const pairH2 = S.PH * 2 + GAP;
      const y0 = Math.max(0, (pairH2 - colH) / 2);
      const plateAt = {x: x0, y: y0};
      const boardAt = {x: x0 + (fw - board.w) / 2, y: y0 + shPlate.h + 24};
      const gTop = y0 + colH0 + 24, lineY = gTop + h2 / 2;
      const aCx = x0 + R + 4, bCx = x0 + fw - R - 4;
      const guideA = badge('a', aCx, lineY), guideB = badge('b', bCx, lineY);
      const guideL = probe ? labelFor((aCx + bCx) / 2, lineY - probe.box.h / 2, room) : null;
      const guideLine = `M${r(aCx + R)} ${r(lineY)}H${r(bCx - R)}`;
      const neutral = noteProbe ? note(p.comparisonLabels.neutral, x0 + fw / 2, gTop + h2 + 16, fw, 'neutral-note') : null;
      const bw = x0 + fw, bh = Math.max(pairH2, y0 + colH) + 10;
      return {side: S, bw, bh, s: Math.min(ctx.design.w / bw, ctx.design.h / bh), board, panels, plates, shPlate, plateAt, boardAt, p1Bottom: gTop, guideA, guideB, guideL, guideLine, neutral};
    };
    if (ctx.view.shape === 'square' && pl.y === 'bottom' && deskFracOf(best.s) < 0.405) {
      // stacked desks can be wider (the pin cup moves into a strip right of the article, the scenario
      // plate runs the full width)
      const SW = PW + 120, extra = {deskW: SW, cupAt: {x: PW + 60, y: 230}};
      const sd = fitDesk(buildStages(undefined, extra), SW, extra);
      const S = {W: SW, PH: sd.PH, plW: sd.plW, stages: sd.stages};
      const wholeC = c => !c.board.truncated && !c.shPlate.truncated && [c.guideA, c.guideB, c.guideL, c.neutral].every(whole)
        && c.plates.every(q => q.fits.every(f => !f.truncated));
      for (const z of [1, 0.94]) {
        fz = z; fs = 30 * z;
        for (const cols of [1, 2]) {
          for (let fw = 520; fw <= 940; fw += 60) {
            const c = composeSide(fw, cols, S);
            if (!wholeC(c) || keyOf(c) * c.s * fit < 16.2) continue;
            if (deskFracOf(c.s, S.W) > deskFracOf(best.s, best.side ? best.side.W : PW) + 0.005) best = c;
          }
        }
      }
    }
    const {bw, bh, s, board, panels, plates, shPlate, plateAt, boardAt, guideA, guideB, guideL, guideLine, neutral} = best;
    if (best.side) { stages = best.side.stages; PH = best.side.PH; }
    const deskW = best.side ? best.side.W : PW;
    const ox = (ctx.design.w - bw * s) / 2;
    const oy = (ctx.design.h - bh * s) / 2;
    const guideBoxes = [guideA, guideB, guideL].filter(Boolean).map(c => c.box);
    // hold: the neutral note sits below the guide; base: the shared note sits beside the board
    const footBoxes = [{x: plateAt.x, y: plateAt.y, w: shPlate.w, h: shPlate.h}, {x: boardAt.x, y: boardAt.y, w: board.w, h: board.h}, ...guideBoxes, ...(neutral ? [neutral.box] : [])];
    const footerClear = footBoxes.every((b1, i) => footBoxes.every((b2, j) => j <= i || !boxesOverlap(b1, b2, 2)));
    const footerWhole = [guideA, guideB, guideL, neutral].every(whole) && !board.truncated && !shPlate.truncated && plates.every(q => q.fits.every(f => !f.truncated));
    // key text on screen (design units): shared wording, the lanes' differing phrase, guide chips;
    // captions: the scenario plates' captions (never larger than the key text)
    const keyUnits = keyOf(best);
    const capUnits = Math.max(0, ...plates.map(q => (q.fits[1] ? q.fits[1].size : 0)));
    const fin = v => (Number.isFinite(v) ? r(v, 2) : 0);
    const platesClear = plates.every((q, i) => {
      const st = stages[i], pn = panels[i];
      const bookB = {x: pn.x + st.bookC.x + st.book.outer.x, y: pn.y + st.bookC.y + st.book.outer.y, w: st.book.outer.w, h: st.book.outer.h};
      const artB = {x: pn.x + st.artFinal.x, y: pn.y + st.artFinal.y, w: st.art.w, h: st.art.h};
      return !boxesOverlap(q.box, bookB, 4) && !boxesOverlap(q.box, artB, 4);
    });
    return {LANE, geo: {panels}, stages, headers: plates.map(q => q.node), guideA, guideB, guideL, guideLine, neutral, board, boardAt, s, ox, oy, bw, bh, arrangement: best.side ? 'side' : arrangement, panel,
      boardPx: r(board.minTextSize * s * fit, 2), boardLabelPx: r(board.labelTextSize * s * fit, 2), footerClear, footerWhole,
      deskFrac: r(deskFracOf(s, deskW), 3), shPlate, plateAt, platesClear, keyPx: fin(keyUnits * s * fit), captionPx: fin(capUnits * s * fit), platePx: fin(Math.min(...plates.flatMap(q => q.fits.map(f => f.size))) * s * fit)};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const panels = L.stages.map((st, i) => {
      const pn = L.geo.panels[i];
      return g({transform: T(pn.x, pn.y)}, st.node);
    });
    const guideLine = L.guideA && L.guideB ? h('path', {name: 'guide-line', d: L.guideLine, stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '10 8', fill: 'none', opacity: 0}) : null;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      panels,
      L.headers,
      g({name: 'shared-board-g', transform: T(L.boardAt.x, L.boardAt.y)}, L.board.node),
      g({name: 'shared-plate-g', transform: T(L.plateAt.x, L.plateAt.y)}, L.shPlate.node),
      guideLine,
      g({name: 'guide-chips', opacity: 0}, L.guideA.node, L.guideB.node, L.guideL && L.guideL.node),
      L.neutral && L.neutral.node);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sems = L.stages.map((st, i) => {
      const state = i ? p.states.b : p.states.a;
      const hasMarker = MARKER[state] !== 'none';
      const posed = st.pose({
        ghostB: 1 - seg(u, ...W.ghostOut),
        writeB: seg(u, ...W.write),
        grab: seg(u, ...W.grab),
        slide: seg(u, ...W.slide),
        recoil: seg(u, ...W.recoil),
        hl: seg(u, ...W.hl),
        zone: seg(u, ...W.zone),
        release: hasMarker ? seg(u, ...W.release) : seg(u, ...W.releaseAway),
        fetch: hasMarker ? seg(u, ...W.fetch) : 0,
        carry: hasMarker ? seg(u, ...W.carry) : 0,
        place: hasMarker ? seg(u, ...W.place) : 0,
        back: hasMarker ? seg(u, ...W.back) : 0,
        glow: [0, 0],
        // ring: short pulse when the wording is written, then held from the guide beat
        ringB: Math.max(Math.sin(Math.PI * seg(u, ...W.ringPulse)) * 0.9, seg(u, ...W.rings)),
      });
      Object.assign(nodes, posed.nodes);
      return posed.semantic;
    });
    // the shared board leaves the footer to the guide (shared facts first, the changed fact last)
    nodes['shared-board-g'] = {opacity: r(seg(u, ...W.shared), 3)};
    nodes['shared-plate-g'] = {opacity: r(seg(u, ...W.shared), 3)};
    Object.assign(nodes, L.shPlate.frame());
    const laneIn = r(seg(u, ...W.caption), 3);
    for (const i of [0, 1]) {
      nodes[`head-${i}-lane`] = {opacity: laneIn};
      if (ctx.show('key')) nodes[`head-${i}-letter`] = {fill: laneIn >= 0.5 ? ctx.theme.ink : '#fff'};
    }
    const gp = seg(u, ...W.guide);
    nodes['guide-chips'] = {opacity: r(gp, 3)};
    if (L.guideA && L.guideB) nodes['guide-line'] = {opacity: gp >= 1 ? 1 : 0};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(seg(u, ...W.note), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const [a, b] = sems;
    return {
      nodes,
      semantic: {
        beat,
        a, b,
        articleA: a.article, articleB: b.article, handAA: a.handA, handAB: b.handA, markerA: a.marker, markerB: b.marker,
        gripAA: a.articleGrip, gripAB: b.articleGrip, mGripA: a.markerGrip, mGripB: b.markerGrip,
        written: r(seg(u, ...W.write), 3),
        statesSupplied: {a: p.states.a, b: p.states.b},
        changedFact: 'phrase',
        guideShown: gp >= 1,
        // final beat complete (rings, guide, neutral note): everything is fully visible from here on
        finalShown: gp >= 1 && seg(u, ...W.rings) >= 1 && (!L.neutral || seg(u, ...W.note) >= 1),
        // A/B letter badges in their lane colours, never the alarm accent (AUTHORING "Legal content")
        laneBadges: {a: L.LANE.a.color, b: L.LANE.b.color, alarm: ctx.theme.accent},
        guideText: Boolean(L.guideL),
        boardShared: true,
        boardShown: seg(u, ...W.shared) >= 1,
        boardPx: L.boardPx,
        boardLabelPx: L.boardLabelPx,
        boardRowsFit: L.board.rowsFit,
        // the pin cup keeps clear of the article sheet (at rest and after the slide)
        cupClear: L.stages.every(st => {
          const R = st.G.cupR ?? 44, cup = {x: st.cupC.x - R * 1.25, y: st.cupC.y - R * 0.8, w: R * 2.5 + 7, h: R * 1.6 + 10};
          return [st.artFinal, st.artRest].every(q => !boxesOverlap(cup, {x: q.x - 12, y: q.y - 12, w: st.art.w + 24, h: st.art.h + 24}, 0));
        }),
        // the assistant's hand (its drawn fist) stays off the book's printed anchor heading ("§ Art. 4")
        handOffAnchor: L.stages.every((st, i) => {
          const hd = sems[i].handA, pb = st.book.provBox;
          if (!hd || !pb) return true;
          const bx = {x: st.bookC.x + pb.x, y: st.bookC.y + pb.y, w: pb.w, h: pb.h}, rr = (st.G.arm.width ?? 48) * 0.95; // the drawn fist, not just the grip point
          const nx = Math.max(bx.x, Math.min(hd.x, bx.x + bx.w)), ny = Math.max(bx.y, Math.min(hd.y, bx.y + bx.h));
          return Math.hypot(nx - hd.x, ny - hd.y) >= rr;
        }),
        keyPx: L.keyPx,
        captionPx: L.captionPx,
        platePx: L.platePx,
        // the legible phrase slot (and the bars around it) stays inside each article page
        slotInside: L.stages.every(st => st.art.passOrigin.y + st.art.pass.h <= st.art.h - st.art.pad * 0.5),
        // the scenario plates keep clear of the texts on their desk
        platesClear: L.platesClear,
        sharedPlateShown: seg(u, ...W.shared) >= 1,
        footerClear: L.footerClear,
        footerWhole: L.footerWhole,
        arrangement: L.arrangement,
        // share of the frame width each desk takes, for a frame with the default 6 % side margins
        // (AUTHORING 18: ≥ ~0.40 side by side)
        deskFrac: L.deskFrac,
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
    slug: 'sources-03-contrast',
    title: 'Conflict between texts — compatible application vs conflict flagged',
    titleEs: 'Conflicto entre textos — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Conflicto entre textos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading desks; only the wording written into the article\'s phrase slot differs. The same hand slides each article to the book and highlights both phrases; scene A (supplied: compatible application) docks flush and is clipped over a calm rule, scene B (supplied: conflict flagged) is held apart, a jagged zone is drawn and a pennant pin is set. Rings and a footer guide link the changed wording; the neutral note states that both states are supplied and no text is shown to prevail.',
    tags: ['conflict between texts', 'compatible application', 'conflict flagged', 'paired comparison', 'changed fact', 'book', 'article', 'editable hierarchy', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/conflicto-entre-textos.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...KIT_STRINGS.en, sharedAB: 'same in A and B'}, es: {...KIT_STRINGS.es, sharedAB: 'igual en A y B'}},
  scene,
});
