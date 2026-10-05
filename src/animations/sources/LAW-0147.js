/**
 * LAW-0147 — Delegación normativa · contrast
 *
 * Storyboard — two complete records desks run on one clock (brief beats).
 * Everything the two scenes share is drawn ONCE, large, under the pair: the
 * shared facts, both texts (id, title, provision and simulated wording with
 * the linked phrases marked), the editable hierarchy board and the
 * attributed reading. On the desks the texts are drawn quietly (their
 * wording as bars), so the one legible difference — the tag — stays large.
 *  [0.00–0.17] base: both desks are identical — the bound volume, the
 *              instrument, the gold link cord threaded beside its basis
 *              clause with a blank tag, the binder clip resting on the desk.
 *  [0.17–0.40] change: the ONE changed fact is written on each tag — A
 *              "authorization supplied" (solid band), B "authorization to be
 *              checked" (dashed border, pencil) — and the scenario plates take
 *              their lane colours; the clerk's hand takes each clip.
 *  [0.40–0.77] parallel: the same hand carries each clip across to the
 *              enabling page. Only the supplied state changes the sequence
 *              and the geometry: in A the clip is clamped on the page edge,
 *              the cord runs nearly taut and the passage is highlighted; in B
 *              the clip is laid open on the desk beside the page (not
 *              fastened), the cord stays slack and the passage only gets a
 *              dashed pencil outline.
 *  [0.77–1.00] guide: rings mark the two clip spots — the only difference —
 *              and a guide row joins the lettered badges A and B through the
 *              changed-fact label; a neutral note says both states are
 *              supplied and no conclusion is drawn. No winner, score,
 *              validity or legal consequence is shown.
 * @module animations/sources/LAW-0147
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {FONTS} from '../../core/text.js';
import {contrastFields, obj, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {
  linkDesk, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, LINK_STATES, motifColors, stateLabel,
  levelBoard, passageBlock, fitWords, textOrBars, boxesOverlap, wordSafe,
} from './kits/delegacion-normativa.js';

const ID = 'LAW-0147';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  shared: [0.02, 0.08], lane: [0.17, 0.23], flip: [0.19, 0.27], grab: [0.28, 0.4],
  carry: [0.4, 0.58], place: [0.58, 0.63], hlArt: [0.61, 0.68], back: [0.63, 0.75],
  rings: [0.77, 0.81], guide: [0.79, 0.85], note: [0.84, 0.9],
};

const sceneSchema = {
  ...sourcesFields,
  ...contrastFields(),
  states: obj('Link state supplied by the author for each scene (the only changed fact; never inferred)', {
    a: oneOf('Supplied state of scene A', LINK_STATES),
    b: oneOf('Supplied state of scene B', LINK_STATES),
  }, ['a', 'b']),
};

const defaultParams = {
  ...SOURCES_DEFAULTS,
  scenarioA: {label: 'Authorization supplied', caption: 'The link is supplied with the example'},
  scenarioB: {label: 'Authorization to be checked', caption: 'The same link, marked to be checked'},
  changedFact: 'Changed fact: only the supplied link state',
  sharedFacts: ['Same instrument and basis clause', 'Same Text 1 and Art. 12 wording', 'Same hierarchy as supplied'],
  comparisonLabels: {guide: 'Only difference', neutral: 'Both link states are supplied with the example; no conclusion is drawn about the instrument.'},
  states: {a: 'authorization-supplied', b: 'authorization-to-be-checked'},
};

const ARR = {landscape: {row: true, panel: 'panelH'}, portrait: {row: false, panel: 'panelH'}, square: {row: true, panel: 'panelS'}};
const GAP = 40;

/** Scenario header above each desk: lane badge, supplied label, caption. */
function scenarioHeader(ctx, {name, letter, label, caption, x, y, w, size, lane}) {
  const th = ctx.theme;
  const R = size * 0.9;
  const tw = w - R * 2 - 24;
  const lf = ctx.show('key') ? fitWords(ctx, label, {maxWidth: tw, size: size * 1.1, minSize: size, maxLines: 2, weight: 800}) : null;
  // the caption follows the label on the same line when both fit, otherwise it goes below
  const lw = lf ? ctx.measure(lf.lines[lf.lines.length - 1], lf.size, lf.weight, lf.family) : 0;
  const inlineW = tw - lw - 24;
  let cf = caption && ctx.show('all') ? fitWords(ctx, caption, {maxWidth: inlineW, size, minSize: size, maxLines: 1, weight: 500}) : null;
  const inline = Boolean(cf && lf && lf.lines.length === 1 && !cf.truncated && ctx.measure(caption, size, 500, 'sans') <= inlineW);
  if (!inline && caption && ctx.show('all')) cf = fitWords(ctx, caption, {maxWidth: tw, size, minSize: size * 0.95, maxLines: 3, weight: 500});
  const textH = inline ? Math.max(lf.height, cf.height) : (lf ? lf.height : 0) + (cf ? cf.height + 8 : 0);
  const hh = Math.max(R * 2, textH) + 12;
  const cy = y + hh / 2;
  const tx = x + R * 2 + 18;
  const node = g({name},
    h('circle', {cx: x + R, cy, r: R, fill: th.inkSoft, stroke: th.ink, 'stroke-width': 2.5}),
    g({name: `${name}-lane`, opacity: 0},
      h('circle', {cx: x + R, cy, r: R, fill: lane.soft, stroke: th.ink, 'stroke-width': 2.5}),
      h('circle', {cx: x + R, cy, r: r(R * 0.8), fill: 'none', stroke: lane.color, 'stroke-width': r(R * 0.24, 2)})),
    ctx.show('key') ? h('text', {name: `${name}-letter`, x: r(x + R), y: r(cy + R * 0.4), 'text-anchor': 'middle', 'font-size': r(R * 1.15), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, letter) : null,
    lf ? textBlock(lf, {x: tx, y: cy - textH / 2, fill: th.fg}) : null,
    cf ? textBlock(cf, inline ? {x: tx + lw + 24, y: cy - textH / 2 + (lf.size - cf.size) * 0.8, fill: th.fgSoft} : {x: tx, y: cy - textH / 2 + (lf ? lf.height + 8 : 0), fill: th.fgSoft}) : null);
  return {node, h: hh, fits: [lf, cf].filter(Boolean)};
}

/** Shared plate: the facts both scenes share, printed once (texts with their linked phrases marked). */
function sharedPlate(ctx, {name, w, size, cols, p, t, colors, noReading = false}) {
  const th = ctx.theme;
  const key = ctx.show('key'), all = ctx.show('all');
  const pad = size * 0.7, gapC = size * 1.1;
  const nodes = [], fits = [], passes = [];
  // cols 3: shared facts + reading | Text 1 | Instrument; cols 2: facts on top, texts side by side,
  // reading below; cols 1: everything stacked
  const three = cols === 3;
  const colW = three ? (w - pad * 2 - gapC * 2) / 3 : cols === 2 ? (w - pad * 2 - gapC) / 2 : w - pad * 2;
  const factsW = three ? colW : w - pad * 2;
  let y = pad;
  const headFit = fitWords(ctx, `${t.sameFacts} · A = B`, {maxWidth: factsW, size, minSize: size, maxLines: 2, weight: 800});
  nodes.push(textOrBars(ctx, headFit, key, {x: pad, y, fill: th.fg}));
  fits.push(headFit);
  y += headFit.height + size * 0.4;
  if (p.sharedFacts.length) {
    const ff = fitWords(ctx, p.sharedFacts.join(' · '), {maxWidth: factsW, size, minSize: size, maxLines: 8, weight: 500});
    nodes.push(textOrBars(ctx, ff, all, {x: pad, y, fill: th.fgSoft}));
    fits.push(ff);
    y += ff.height + size * 0.6;
  }
  const reading = () => {
    if (!p.interpretations.length || noReading) return 0;
    const it = p.interpretations[0];
    const rf = fitWords(ctx, `${t.readingProposed} — ${it.by}: “${it.text}”`, {maxWidth: factsW, size, minSize: size, maxLines: 8, weight: 500, family: 'serif'});
    return rf;
  };
  let factsBottom = y;
  if (three) {
    const rf = reading();
    if (rf) { nodes.push(textOrBars(ctx, rf, all, {x: pad, y, fill: th.fg, italic: true})); fits.push(rf); factsBottom = y + rf.height; }
  }
  const top = three ? pad : y;
  let bottom = three ? factsBottom : y;
  [0, 1].forEach(i => {
    const src = p.sources[i], pas = p.passages[i];
    const ci = three ? i + 1 : cols === 2 ? i : 0;
    const x = pad + ci * (colW + gapC) + 14;
    let yy = cols === 1 && i ? bottom + size * 0.7 : top;
    const y0 = yy;
    const cw = colW - 14;
    const tf = fitWords(ctx, `${src.id} · ${src.title}`, {maxWidth: cw, size, minSize: size, maxLines: 4, weight: 800});
    nodes.push(textOrBars(ctx, tf, key, {x, y: yy, fill: th.ink}));
    yy += tf.height + size * 0.35;
    const pf = fitWords(ctx, i ? src.provision : `§ ${src.provision}`, {maxWidth: cw, size, minSize: size, maxLines: 2, weight: 700, family: 'serif'});
    nodes.push(textOrBars(ctx, pf, all, {x, y: yy, fill: th.ink}));
    yy += pf.height + size * 0.35;
    const pass = passageBlock(ctx, {prefix: `${name}-t${i}`, text: pas.text, phrase: pas.phrase, w: cw, size, family: 'serif', maxPre: 7, maxPost: 7, slotLines: 5});
    nodes.push(g({transform: T(x, yy)}, pass.node));
    passes.push(pass);
    fits.push(tf, pf, pass.phFit);
    yy += pass.h;
    nodes.push(h('rect', {x: x - 14, y: y0, width: 6, height: yy - y0, rx: 3, fill: colors[i]}));
    bottom = Math.max(bottom, yy);
  });
  if (!three) {
    const rf = reading();
    if (rf) { nodes.push(textOrBars(ctx, rf, all, {x: pad, y: bottom + size * 0.7, fill: th.fg, italic: true})); fits.push(rf); bottom += size * 0.7 + rf.height; }
  }
  const hh = bottom + pad;
  const node = g({name},
    h('path', {d: roundRectPath(6, 8, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    nodes);
  return {node, w, h: hh, fits, minSize: Math.min(...fits.map(f => f.size)), truncated: fits.some(f => f.truncated),
    frame: () => Object.assign({}, ...passes.map(q => q.frame({hl: 1})))};
}

const scene = {
  sizes: {landscape: [1690, 800], square: [950, 800], portrait: [950, 1420]},
  layout(ctx0) {
    // whole-word wrapping (no word split across lines; punctuation stays with its word)
    const ctx = wordSafe(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitT(ctx);
    const C = motifColors(ctx);
    const {row, panel} = ARR[ctx.view.shape];
    const LANE = {a: {color: th.accent3, soft: th.accent3Soft}, b: {color: th.accent4, soft: th.accent4Soft}};
    const tagWord = st => (st === 'authorization-to-be-checked' ? t.tagToCheck : t.tagSupplied);
    const mkStages = tagSize => ['a', 'b'].map(k => linkDesk(ctx, {
      prefix: `p${k}`, layout: panel, content: p, state: p.states[k], clerk: true, reader: false, board: false, note: false, chips: null,
      seedKey: 'dn-contrast',
      // both lanes solve the tag position for BOTH supplied states, so their base scenes are identical
      state2: p.states[k === 'a' ? 'b' : 'a'],
      // the tag carries a short state word (the scenario headers carry the full supplied labels); the other
      // lane's word is measured too, so both tags have the same size and hang the same way
      tagText: tagWord(p.states[k]),
      tagText2: tagWord(p.states[k === 'a' ? 'b' : 'a']),
      tagSize,
    }));
    // the tag words are generic captions: they never outgrow the footer's supplied text, so the desks are
    // re-solved with a smaller tag when the footer text had to step down
    const run = tagSize => {
    const stages = mkStages(tagSize);
    const PW = stages[0].W, PH = Math.max(stages[0].H, stages[1].H);
    const size0 = {landscape: 28, square: 30, portrait: 28}[ctx.view.shape];
    const fitK = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
    // px at 1080p in the canonical frame of this shape (the safe box is 88 % of the frame width)
    const pxK = fitK * {landscape: 1920, square: 1080, portrait: 1080}[ctx.view.shape] / (ctx.view.content.w / 0.88);
    const fracOf = sc => PW * sc * fitK / (ctx.view.content.w / 0.88);
    const solve = size => {
      // headers above the desks
      const headers = ['a', 'b'].map((k, i) => scenarioHeader(ctx, {name: `head-${k}`, letter: k.toUpperCase(), label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, x: 0, y: 0, w: PW, size, lane: LANE[k]}));
      const HH = Math.max(...headers.map(q => q.h)) + 14;
      const gapL = ctx.view.shape === 'square' ? 24 : GAP;
      const lanesW = row ? PW * 2 + gapL : PW;
      const lanesH = row ? HH + PH : (HH + PH) * 2 + GAP;
      const panels = [0, 1].map(i => (row ? {x: i * (PW + gapL), y: HH} : {x: 0, y: i * (HH + PH + GAP) + HH}));
      // footer: shared plate (+ board beside it, or stacked), then the guide row and the neutral note
      // modes: 'side' = board beside the plate; 'below' = board centred under it; 'row2' = board under the
      // plate on the left with the guide and the neutral note beside it (compact, for square frames)
      const compose = (bw, cols, mode, inline) => {
        const side = mode === 'side', row2 = mode === 'row2';
        if (row2 && inline) return null;
        const bWide = side ? Math.min(620, bw * (bw < 1700 ? 0.35 : 0.3)) : row2 ? Math.min(620, bw * 0.4) : Math.min(bw, 720);
        const board = levelBoard(ctx, {prefix: 'shared-board', w: bWide, hier: p.hierarchy, ids: p.sources.map(q => q.id), colors: C.src, header: `${t.hierarchy} · A = B`, size: size * 1.12, fitRows: true, stackTokens: true});
        const plate = sharedPlate(ctx, {name: 'shared-plate', w: side ? bw - board.w - 30 : bw, size, cols, p, t, colors: C.src, noReading: row2});
        const footTop = lanesH + 18;
        const plateAt = {x: 0, y: footTop};
        const boardAt = side ? {x: plate.w + 30, y: footTop} : row2 ? {x: 0, y: footTop + plate.h + 18} : {x: (bw - board.w) / 2, y: footTop + plate.h + 20};
        const fBottom = side ? footTop + Math.max(plate.h, board.h) : boardAt.y + board.h;
        // guide: [guide word] (A) — changed-fact label — (B), then the neutral note (inline, below, or beside the board)
        const R = size * 0.95;
        const gx0 = row2 ? board.w + 30 : 0;
        const gAvail = row2 ? bw - gx0 : inline ? bw * 0.56 : bw;
        const gy = row2 ? boardAt.y : fBottom + 16;
        const gw = ctx.show('all') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, anchor: 'start', maxWidth: 260, size, minSize: size, maxLines: 2, weight: 600}) : null;
        const labelMax = Math.min(820, gAvail - R * 4 - 90 - (gw ? gw.box.w + 16 : 0));
        if (labelMax < 200) return null;
        const probe = ctx.show('key') ? chip(ctx, p.changedFact, {x: 0, y: 0, anchor: 'start', maxWidth: labelMax, size, minSize: size, maxLines: 4, weight: 700}) : null;
        if (probe && probe.fit.truncated) return null;
        const gh = Math.max(R * 2, probe ? probe.box.h : 0, gw ? gw.box.h : 0);
        const lineY = gy + gh / 2;
        const rowW = (gw ? gw.box.w + 16 : 0) + R * 2 + 36 + (probe ? probe.box.w : 120) + 36 + R * 2;
        const x0 = inline || row2 ? gx0 : (bw - rowW) / 2;
        const guideTxt = gw ? chip(ctx, p.comparisonLabels.guide, {x: x0, y: lineY - gw.box.h / 2, anchor: 'start', maxWidth: 260, size, minSize: size, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-word', weight: 600}) : null;
        const aCx = x0 + (gw ? gw.box.w + 16 : 0) + R;
        const labX = aCx + R + 36;
        const gl = probe ? chip(ctx, p.changedFact, {x: labX, y: lineY - probe.box.h / 2, anchor: 'start', maxWidth: labelMax, size, minSize: size, maxLines: 4, fill: th.accentSoft, stroke: th.accent, name: 'guide-label', weight: 700}) : null;
        const bCx = labX + (probe ? probe.box.w : 120) + 36 + R;
        const noteX = inline ? bCx + R + 40 : row2 ? gx0 : 0;
        const noteW = inline ? bw - noteX : row2 ? gAvail : Math.min(1300, bw);
        if (inline && noteW < 360) return null;
        const note = ctx.show('all') ? chip(ctx, p.comparisonLabels.neutral, {x: inline || row2 ? noteX : bw / 2, y: inline ? gy : gy + gh + 18, anchor: inline || row2 ? 'start' : 'middle', maxWidth: noteW, size, minSize: size, maxLines: 5, fill: th.card, name: 'neutral-note', weight: 500}) : null;
        if (note && note.fit.truncated) return null;
        // (row2) the attributed reading moves out of the plate, under the note beside the board
        let reading = null;
        if (row2 && p.interpretations.length) {
          const it = p.interpretations[0];
          const ry = note ? note.box.y + note.box.h + 16 : gy + gh + 18;
          reading = ctx.show('all') ? chip(ctx, `${t.readingProposed} — ${it.by}: “${it.text}”`, {x: gx0, y: ry, anchor: 'start', maxWidth: gAvail, size, minSize: size, maxLines: 7, fill: th.card, stroke: th.inkSoft, name: 'shared-reading', weight: 500, family: 'serif'}) : null;
          if (reading && reading.fit.truncated) return null;
        }
        const bh = Math.max(note ? note.box.y + note.box.h : 0, reading ? reading.box.y + reading.box.h : 0, gy + gh, fBottom) + 10;
        return {mode, cols, inline, bw, bh, plate, board, plateAt, boardAt, lineY, aCx, bCx, R, gl, guideTxt, note, reading, s: Math.min(ctx.design.w / bw, ctx.design.h / bh)};
      };
      let best = null;
      for (let k = 0; k <= 8; k++) {
        for (const cols of [3, 2, 1]) {
          for (const mode of ['side', 'below', 'row2']) {
            for (const inline of [true, false]) {
              const c = compose(lanesW * (1 + 0.08 * k), cols, mode, inline);
              if (c && !c.plate.truncated && !c.board.truncated && (!best || c.s > best.s + 1e-3)) best = c;
            }
          }
        }
      }
      if (!best) {
        for (let k = 0; k <= 8 && !best; k++) for (const cols of [3, 2, 1]) for (const mode of ['below', 'side']) {
          const c = compose(lanesW * (1 + 0.08 * k), cols, mode, false);
          if (c && (!best || c.s > best.s)) best = c;
        }
      }

      return {size, headers, HH, lanesW, lanesH, panels, best};
    };
    // long wording: the shared footer text may step down (never below ~16 px at 1080p) so the desks keep
    // their share of the frame (>= 40 % side by side, full width stacked)
    const target = row ? 0.4 : 0.72;
    // the largest footer size whose layout keeps both the desks' share and readable (>= ~16.2 px) text
    let SOL = null, fallback = null;
    for (let sz = size0; sz >= size0 * 0.7; sz *= 0.97) {
      const c = solve(sz);
      const px = sz * c.best.s * pxK, fr = fracOf(c.best.s);
      if (fr >= target && px >= 16.6) { SOL = c; break; }
      // no size meets both: keep the desks' share first, then the largest text
      const score = fr >= target ? 1 + px : Math.min(fr / target, px / 16.6);
      if (!fallback || score > fallback.score) fallback = {score, c};
    }
    if (!SOL) SOL = fallback.c;
    return {stages, PW, PH, SOL};
    };
    let RUN = run(undefined);
    if (RUN.stages[0].tag.textSize > RUN.SOL.size) RUN = run(RUN.SOL.size);
    const {stages, PW, PH, SOL} = RUN;
    const {size, headers, HH, lanesW, lanesH, panels, best} = SOL;
    const {bw, bh, s} = best;
    const lx = (bw - lanesW) / 2;
    const panelsAt = panels.map(q => ({x: q.x + lx, y: q.y}));
    // the rings around each lane's clip spots (the differing detail)
    const ringOf = (st, i) => {
      const b1 = st.clipBoxFor('authorization-supplied'), b2 = st.clipBoxFor('authorization-to-be-checked');
      const x0 = Math.min(b1.x, b2.x) - 12, y0 = Math.min(b1.y, b2.y) - 12;
      const x1 = Math.max(b1.x + b1.w, b2.x + b2.w) + 12, y1 = Math.max(b1.y + b1.h, b2.y + b2.h) + 12;
      return {x: panelsAt[i].x + x0, y: panelsAt[i].y + y0, w: x1 - x0, h: y1 - y0};
    };
    const rings = stages.map(ringOf);
    const CAN = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
    const fit = Math.min(CAN[0] * 0.88 / ctx.design.w, CAN[1] * 0.74 / ctx.design.h);
    const deskFrac = PW * s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) / (ctx.view.content.w / 0.88);
    const tagPx = Math.min(...stages.map(st => st.tag.textSize)) * s * fit;
    return {size, stages, headers, HH, PW, PH, panelsAt, best, bw, bh, s, ox: (ctx.design.w - bw * s) / 2, oy: (ctx.design.h - bh * s) / 2, LANE, rings, row,
      deskFrac: r(deskFrac, 3), tagPx: r(tagPx, 2), platePx: r(best.plate.minSize * s * fit, 2), footerWhole: !best.plate.truncated && !best.board.truncated};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const B = L.best;
    const lanes = L.stages.map((st, i) => g({transform: T(L.panelsAt[i].x, L.panelsAt[i].y)}, st.node));
    const heads = L.headers.map((hd, i) => g({transform: T(L.panelsAt[i].x, L.panelsAt[i].y - L.HH)}, hd.node));
    const rings = L.rings.map((q, i) => h('path', {name: `ring-${i}`, d: roundRectPath(q.x, q.y, q.w, q.h, 14), fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': '12 7', opacity: 0}));
    const badge = (k, cx) => g(null,
      h('circle', {cx: r(cx), cy: r(B.lineY), r: B.R, fill: L.LANE[k].soft, stroke: th.ink, 'stroke-width': 2.5}),
      h('circle', {cx: r(cx), cy: r(B.lineY), r: r(B.R * 0.8), fill: 'none', stroke: L.LANE[k].color, 'stroke-width': r(B.R * 0.24, 2)}),
      ctx.show('key') ? h('text', {x: r(cx), y: r(B.lineY + B.R * 0.4), 'text-anchor': 'middle', 'font-size': r(B.R * 1.1), 'font-weight': 800, 'font-family': FONTS.sans, fill: th.ink}, k.toUpperCase()) : null);
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      lanes, heads, rings,
      g({name: 'shared-plate-g', transform: T(B.plateAt.x, B.plateAt.y), opacity: 0}, B.plate.node),
      g({name: 'shared-board-g', transform: T(B.boardAt.x, B.boardAt.y), opacity: 0}, B.board.node),
      g({name: 'guide', opacity: 0},
        h('path', {d: `M${r(B.aCx + B.R)} ${r(B.lineY)}H${r(B.bCx - B.R)}`, stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '10 8', fill: 'none'}),
        badge('a', B.aCx), badge('b', B.bCx), B.gl && B.gl.node, B.guideTxt && B.guideTxt.node),
      B.note && B.note.node,
      B.reading ? g({name: 'shared-reading-g', opacity: 0}, B.reading.node) : null);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const v = {};
    for (const k of ['flip', 'grab', 'carry', 'place', 'hlArt', 'back']) v[k] = seg(u, ...W[k]);
    const sems = L.stages.map(st => {
      const posed = st.pose(v);
      Object.assign(nodes, posed.nodes);
      return posed.semantic;
    });
    nodes['shared-plate-g'] = {opacity: r(seg(u, ...W.shared), 3)};
    nodes['shared-board-g'] = {opacity: r(seg(u, ...W.shared), 3)};
    if (L.best.reading) nodes['shared-reading-g'] = {opacity: r(seg(u, ...W.shared), 3)};
    Object.assign(nodes, L.best.plate.frame());
    const laneIn = r(seg(u, ...W.lane), 3);
    for (const k of ['a', 'b']) {
      nodes[`head-${k}-lane`] = {opacity: laneIn};
      if (ctx.show('key')) nodes[`head-${k}-letter`] = {fill: laneIn >= 0.5 ? ctx.theme.ink : '#fff'};
    }
    const ringP = seg(u, ...W.rings);
    L.rings.forEach((_, i) => { nodes[`ring-${i}`] = {opacity: r(ringP, 3)}; });
    const gp = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gp, 3)};
    const np = seg(u, ...W.note);
    if (L.best.note) nodes['neutral-note'] = {opacity: r(np, 3)};
    const [a, b] = sems;
    // what is visible in each scene (panel-local), for the "identical before the change" rule
    const look = s2 => ({clip: s2.clip, clipOpen: s2.clipOpen, cordEnd: s2.cordEnd, tag: s2.tag, tagFlip: s2.tagFlip, hlArt: s2.hlArt, pencil: s2.pencilArt, hand: s2.handC, hlRef: s2.hlRef});
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const p = ctx.params;
    return {
      nodes,
      semantic: {
        beat, a, b,
        lookA: look(a), lookB: look(b),
        clipA: a.clip, clipB: b.clip, handA: a.handC, handB: b.handC, gripA: a.clipGrip, gripB: b.clipGrip, tagA: a.tag, tagB: b.tag,
        statesSupplied: {...p.states},
        changedFact: 'link-state',
        stateWritten: v.flip >= 1,
        guideShown: gp >= 1,
        finalShown: gp >= 1 && ringP >= 1 && (!L.best.note || np >= 1),
        laneBadges: {a: L.LANE.a.color, b: L.LANE.b.color, alarm: ctx.theme.accent},
        deskFrac: L.deskFrac,
        arrangement: L.row ? 'row' : 'column',
        tagPx: L.tagPx,
        platePx: L.platePx,
        footerWhole: L.footerWhole && !(L.best.gl && L.best.gl.fit && L.best.gl.fit.truncated),
        allReached: a.allReached && b.allReached,
        tagClear: a.tagClear && b.tagClear,
        stage: {W: r(L.bw, 1), H: r(L.bh, 1), s: r(L.s, 3)},
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
    slug: 'sources-07-contrast',
    title: 'Delegated rule-making — authorization supplied vs to be checked',
    titleEs: 'Delegación normativa — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Delegación normativa',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical records desks; only the supplied link state written on the cord\'s tag differs. The same hand carries each clip to the enabling page: in A (authorization supplied) it is clamped on the page and the passage highlighted; in B (authorization to be checked) it is laid open beside the page, the cord stays slack and the passage gets only a pencil outline. Rings and a guide link the changed detail; everything shared is printed once below; a neutral note says both states are supplied and no conclusion is drawn.',
    tags: ['delegated rule-making', 'authorization supplied', 'authorization to be checked', 'paired comparison', 'changed fact', 'link cord', 'clip', 'book', 'instrument', 'editable hierarchy', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/delegacion-normativa.js', 'src/animations/sources/kits/conflicto-entre-textos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...KIT_STRINGS.en, sameFacts: 'Same in A and B'}, es: {...KIT_STRINGS.es, sameFacts: 'Igual en A y B'}},
  scene,
});
