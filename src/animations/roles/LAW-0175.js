/**
 * LAW-0175 — Intervención de perito · contrast
 *
 * Storyboard: two complete workbench scenes (side by side on wide boxes,
 * stacked on tall/square boxes), each with the same specialist, object,
 * magnifier, tag and report board. The pages hold two slots: "data examined"
 * and "opinion, scope as stated". Shared text (people, object, report title,
 * shared facts, the changed fact, the neutral note and the key) is drawn once
 * in a strip.
 *  0.00–0.17  identical base: both scenes at rest, both pages with empty slots.
 *  0.17–0.40  the change, localised: in A a ruler frame outlines the DATA slot
 *             (scenario A "data examined"); in B the dashed scope fence closes
 *             around the OPINION slot (scenario B "opinion, scope as stated").
 *             Scenario labels appear with the change.
 *  0.40–0.77  in parallel, the same action: examine the object with the
 *             magnifier, lay it down, carry the tag to the board and pin it
 *             (identical geometry). Only then a printed link runs from the tag
 *             to the outlined slot — the data slot in A, the fenced opinion in B
 *             — and that slot fills with the supplied text; the other slot stays
 *             empty (the relation changes, not only text or colour).
 *  0.77–1.00  a comparison guide brackets the changed slot in each scene and
 *             joins them; neutral note and key. No winner, score or outcome; the
 *             opinion is never marked correct, decisive or accepted.
 * @module animations/roles/LAW-0175
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {roundRectPath} from '../../core/geometry.js';
import {peritoFields, PERITO_DEFAULTS, PERITO_STRINGS, LAB, labGeometry, labStage, specialistCaption, fitW, textOrBars, pageTextBlocks, overlaps, ACT} from './kits/intervencion-de-perito.js';

const ID = 'LAW-0175';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0.17, 0.24], changedFact: [0.18, 0.25], mark: [0.2, 0.32],
  act: [0.4, 0.7], link: [0.68, 0.72], rows: [0.7, 0.75], op: [0.7, 0.74], sc: [0.72, 0.77],
  guide: [0.77, 0.84], guideChip: [0.8, 0.85], notes: [0.82, 0.88],
};
const clockOf = u => clamp((u - W.act[0]) / (W.act[1] - W.act[0]));
const SLOTS = ['data', 'opinion'];

const sceneSchema = {
  ...peritoFields,
  relationships: list('The report slot the tag is linked to in each scenario (the only difference between A and B)', obj('Link from the object to a report slot in one scenario', {
    scenario: oneOf('Scenario', ['a', 'b']),
    from: oneOf('Source (the examined object)', ['object']),
    to: oneOf('Report slot', SLOTS),
  }, ['scenario', 'from', 'to']), 2, 2),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  ...PERITO_DEFAULTS,
  relationships: [{scenario: 'a', from: 'object', to: 'data'}, {scenario: 'b', from: 'object', to: 'opinion'}],
  scenarioA: {label: 'Data examined', caption: 'The tag links item 7 to a measured value'},
  scenarioB: {label: 'Opinion, scope as stated', caption: 'The tag links item 7 to a bounded opinion'},
  changedFact: 'Only change: the slot of the report the tag is linked to',
  sharedFacts: ['Same magnifier and bench', 'Same report page'],
  comparisonLabels: {guide: 'Only this slot differs', neutral: 'Neither slot is ranked, accepted or rejected'},
};

/** Scenario header: coloured letter badge + label (bold) + caption — stacked, or side by side
 * (label column, then caption column) when that is shorter. */
function header(ctx, {name, letter, label, caption, x, y, w, S, color}) {
  const th = ctx.theme;
  const R = S * 0.95;
  const tw = w - R * 2 - S * 0.6;
  const tx = x + R * 2 + S * 0.6;
  // stacked
  const lab = fitW(label, {maxWidth: tw, size: S * 1.05, minSize: S * 1.05, maxLines: 2, weight: 700});
  const cap = caption ? fitW(caption, {maxWidth: tw, size: S, minSize: S, maxLines: 2, weight: 500}) : null;
  let layout = {lab, cap, lx: tx, ly: y, cx: tx, cy: y + lab.height + S * 0.25, h: Math.max(R * 2, lab.height + (cap ? cap.height + S * 0.25 : 0))};
  // side by side: label (≤ 45 % of the text width), a gap, then the caption
  if (cap) {
    const lw = Math.min(tw * 0.45, lab.width + 2);
    const lab2 = fitW(label, {maxWidth: tw * 0.45, size: S * 1.05, minSize: S * 1.05, maxLines: 3, weight: 700});
    const cw = tw - Math.min(tw * 0.45, lab2.width) - S;
    const cap2 = fitW(caption, {maxWidth: cw, size: S, minSize: S, maxLines: 3, weight: 500});
    const h2 = Math.max(R * 2, lab2.height, cap2.height);
    void lw;
    if (!lab2.truncated && !cap2.truncated && h2 < layout.h - 1) layout = {lab: lab2, cap: cap2, lx: tx, ly: y, cx: tx + Math.min(tw * 0.45, lab2.width) + S, cy: y + (lab2.size - S) * 0.8, h: h2};
  }
  const node = g(null,
    h('circle', {cx: r(x + R), cy: r(y + R), r: r(R), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: r(x + R), y: r(y + R + S * 0.38), 'text-anchor': 'middle', 'font-size': r(S * 1.05), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter) : null,
    ctx.show('key') ? g({name: `${name}-txt`, opacity: 0},
      textOrBars(ctx, layout.lab, {x: layout.lx, y: layout.ly, fill: th.fg, show: true}),
      layout.cap ? textOrBars(ctx, layout.cap, {x: layout.cx, y: layout.cy, fill: th.fgSoft, show: true}) : null) : null);
  const boxes = ctx.show('key') ? [{x: layout.lx, y: layout.ly, w: layout.lab.width, h: layout.lab.height}, layout.cap && {x: layout.cx, y: layout.cy, w: layout.cap.width, h: layout.cap.height}].filter(Boolean) : [];
  return {node, h: layout.h, fits: [layout.lab, layout.cap].filter(Boolean), boxes, truncated: layout.lab.truncated || Boolean(layout.cap && layout.cap.truncated)};
}

/** Header height for a width (probe). */
function headerH(ctx, p, w, S) {
  return Math.max(header(ctx, {name: 'p', letter: 'A', label: p.scenarioA.label, caption: p.scenarioA.caption, x: 0, y: 0, w, S, color: '#000'}).h,
    header(ctx, {name: 'p', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: 0, y: 0, w, S, color: '#000'}).h);
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const W0 = ctx.design.w, H0 = ctx.design.h;
    const showAll = ctx.show('all');
    const row = shape === 'landscape';
    const base = LAB.landscape;
    // text sizes per shape (design units; ≥ ~19.5 px baseline, ≥ 16 px floor at 1080p)
    const TS = {landscape: {S: 25, Smin: 20}, square: {S: 29.6, Smin: 24.2}, portrait: {S: 22, Smin: 16.8}}[shape];
    const m = 14;
    const target = sc => (p.relationships.find(x => x.scenario === sc && x.from === 'object') || {to: sc === 'a' ? 'data' : 'opinion'}).to;
    const targets = {a: target('a'), b: target('b')};
    const look = actorLook(ctx, p.actors[0], 0);

    // ---- shared strip (drawn once): changed fact · same in both · neutral note · key
    const sharedList = [specialistCaption(p), p.props.object, p.props.report.title, ...p.sharedFacts].filter(Boolean);
    const stripOf = (S, w, gutter = 0, firstMinH = 0, at = 0) => {
      const lines = [
        {key: 'changed', text: p.changedFact, weight: 700, fill: th.fg},
        {key: 'same', text: `${ctx.t.sameFacts}: ${sharedList.join(' · ')}`, weight: 500, fill: th.fg},
        {key: 'neutral', text: [p.comparisonLabels.neutral, ctx.t.key].filter(Boolean).join(' · '), weight: 600, fill: th.fgSoft},
      ].filter(l => l.text && (ctx.show('key') || false));
      let y = 0;
      const gi = at < 0 ? lines.length - 1 : at;
      let gy = 0;
      const fits = lines.map((l, i) => {
        const lw = i === gi ? w - gutter : w;
        const f = fitW(l.text, {maxWidth: lw, size: S, minSize: S, maxLines: 5, weight: l.weight});
        const out = {...l, f, y, cx: i === gi ? -gutter / 2 : 0};
        if (i === gi) gy = y;
        y += Math.max(f.height, i === gi ? firstMinH : 0) + S * 0.3;
        return out;
      });
      return {fits, h: y, gy, truncated: fits.some(x => x.f.truncated)};
    };

    // ---- panels: find the largest text size whose pages, strip and guide band fit. Stacked scenes
    // give the specialist and the bench most of the width (the page takes ~60 %), side-by-side
    // scenes are each ~half the frame
    const gFitOf = (S, maxW) => (ctx.show('key') && p.comparisonLabels.guide ? fitW(p.comparisonLabels.guide, {maxWidth: maxW || (row ? Math.min(560, W0 * 0.34) : W0 * 0.8), size: S, minSize: S, maxLines: maxW ? 4 : 2, weight: 700}) : null);
    // narrow tag (wraps to more lines rather than covering the object), never narrower than a word
    const tagW = S => {
      for (let w = S * 3.2; w < S * 8; w += S * 0.4) {
        const f = fitW(p.props.tag, {maxWidth: w, size: S, minSize: S, maxLines: 4, weight: 700});
        if (!f.truncated) return w;
      }
      return S * 8;
    };
    const build1 = (S, final, frac = 0.42, inHeader = false, kFix = 0) => {
      // stacked: the guide label may sit at the right end of B's header row, or at the right end
      // of the strip's first line ('strip', the label width that keeps the strip lowest); otherwise
      // it gets a band between the scenes
      const inStrip = inHeader === 'strip';
      let gF = gFitOf(S), strip = stripOf(S, W0 - 2 * m);
      if (inStrip && gF) {
        const opts = [0.5, 0.42, 0.34, 0.27].flatMap(f => {
          const gf = gFitOf(S, W0 * f);
          return [0, -1].map(at => ({gf, st: stripOf(S, W0 - 2 * m, gf.width + S * 2.2, gf.height + S * 0.7, at)}));
        }).filter(o2 => !o2.gf.truncated).sort((a2, b2) => a2.st.h - b2.st.h);
        if (opts.length) ({gf: gF, st: strip} = opts[0]);
      }
      const gBand = inHeader ? 18 : gF ? gF.height + S * 0.7 + 20 : 24;
      const panelW = row ? (W0 - 3 * m - 30) / 2 : W0 - 2 * m;
      const hh = headerH(ctx, p, panelW, S);
      const hGap = inStrip ? 6 : 10;
      const panelH = row ? H0 - 2 * m - strip.h - hh - 10 - gBand : (H0 - 2 * m - strip.h - 2 * hh - 2 * hGap - gBand) / 2;
      const k = kFix || clamp(panelH / (row ? 540 : 470), 0.62, 1.1);
      // stacked: the board starts at ~40 % of the panel width (bench and specialist take the rest)
      const laneEst = Math.max(S * 2.6, fitW(p.props.tag, {maxWidth: tagW(S), size: S, minSize: S, maxLines: 5, weight: 700}).width + S * 1.2) + S * 1.2;
      const benchL = row ? 190 : Math.max(190, (panelW * frac - 10 + laneEst / 2 - 196 * k) / k);
      // the tag is pinned a little further out (with a deeper lean to reach it) to clear the object
      const cfg = {...base, k, benchL, pinDX: 196, pinDY: 336, lean: 18, S, Smax: S, Smin: S};
      const mk = (x0, top) => labGeometry(ctx, {W: panelW, H: panelH, x0, top, cfg, report: p.props.report, tagText: p.props.tag, keyText: null, show: showAll, kind: p.props.objectKind,
        sections: {figure: false, title: false}, margin: 10, compact: true, floorGap: 10, pinAtSlots: true, objX: 68, tagMaxW: tagW(S)});
      const x0A = m, x0B = row ? m + panelW + 30 + m : m;
      const topA = m + hh + hGap;
      const topB = row ? topA : topA + panelH + gBand + hh + hGap;
      const GA = mk(x0A, topA);
      if (!final && (GA.PL.overflow || strip.truncated || (gF && gF.truncated))) return null;
      const GB = mk(x0B, topB);
      return {S, strip, gF, gBand, hGap, inHeader, panelW, panelH, hh, k, GA, GB, x0A, x0B, topA, topB, overflow: Boolean(final)};
    };
    // stacked: the widest share for the bench and the specialist (board starting at 42 %, 36 %,
    // 30 % … of the panel) that keeps the text at its full size; else the one with the largest text
    // the guide label fits in B's header row when the header text leaves room for it
    const headerRoom = (S, panelW) => {
      const gF = gFitOf(S);
      if (!gF) return true;
      const hb = header(ctx, {name: 'p', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: 0, y: 0, w: panelW, S, color: '#000'});
      const right = Math.max(S * 2, ...hb.boxes.map(b => b.x + b.w));
      return right + S * 1.2 + gF.width + S * 1.1 + S * 1.4 <= panelW;
    };
    let chosen = null;
    for (const frac of row ? [0.42] : [0.42, 0.36, 0.3]) {
      let c = null;
      for (let S = TS.S; S >= TS.Smin - 1e-6 && !c; S -= 0.5) {
        c = build1(S, false, frac, false) || (!row && headerRoom(S, W0 - 2 * m) ? build1(S, false, frac, true) : null);
      }
      if (c && (!chosen || c.S > chosen.S + 0.01)) chosen = c;
      if (chosen && chosen.S >= TS.S - 0.01) break;
    }
    // long texts in small boxes: the guide label joins the strip (one row, no band between scenes)
    // last resort for very long texts: the page takes a wider share of the panel (people stay at size)
    for (const frac of row ? [] : [0.42, 0.36, 0.3, 0.24, 0.18]) {
      if (chosen) break;
      for (let S = TS.S; S >= TS.Smin - 1e-6 && !chosen; S -= 0.2) chosen = build1(S, false, frac, 'strip');
    }
    if (!chosen) chosen = build1(TS.Smin, true);
    const {S, strip, panelW, panelH, hh, GA, GB} = chosen;
    // each scene pins the tag beside ITS OWN target slot (different heights when the slots differ)
    GA.pin = GA.pinFor(targets.a);
    GB.pin = GB.pinFor(targets.b);
    const stA = labStage(ctx, {prefix: 'A', G: GA, look, kind: p.props.objectKind, show: showAll, tagText: p.props.tag, slotFrames: true});
    const stB = labStage(ctx, {prefix: 'B', G: GB, look, kind: p.props.objectKind, show: showAll, tagText: p.props.tag, slotFrames: true});
    const colA = th.accent2, colB = th.accent3;
    const hdA = header(ctx, {name: 'hdA', letter: 'A', label: p.scenarioA.label, caption: p.scenarioA.caption, x: chosen.x0A, y: chosen.topA - hh - (chosen.hGap ?? 10), w: panelW, S, color: colA});
    const hdB = header(ctx, {name: 'hdB', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: chosen.x0B, y: chosen.topB - hh - (chosen.hGap ?? 10), w: panelW, S, color: colB});

    // ---- per-scene target slot and the printed link from the pinned tag to it
    const slotBox = (G, to) => {
      const PL = G.PL;
      const bx = to === 'data' ? PL.dataBox : PL.opBox;
      return {x: G.page.x + bx.x, y: G.page.y + bx.y, w: bx.w, h: bx.h};
    };
    const scenes = {a: {G: GA, st: stA, to: targets.a, color: colA}, b: {G: GB, st: stB, to: targets.b, color: colB}};
    const sceneNodes = [];
    for (const [key, sc] of Object.entries(scenes)) {
      const G = sc.G, PL = G.PL;
      const box = slotBox(G, sc.to);
      sc.box = box;
      const a = {x: G.pin.x + sc.st.tag.w / 2 + 3, y: G.pin.y + sc.st.tag.h * 0.35};
      const tgt = sc.to === 'data' ? {x: box.x - 2, y: clamp(a.y, box.y + S * 0.6, box.y + box.h - S * 0.6)}
        : {x: G.page.x + PL.opBox.x - S * 0.7, y: G.page.y + PL.opBox.y + Math.min(PL.opBox.h * 0.4, S * 2.2) + S * 0.1};
      const midX = (a.x + tgt.x) / 2;
      const d = `M${r(a.x)} ${r(a.y)}C${r(midX)} ${r(a.y)} ${r(midX)} ${r(tgt.y)} ${r(tgt.x)} ${r(tgt.y)}`;
      sc.link = {a, tgt};
      sceneNodes.push(g(null,
        h('path', {name: `${key}-link`, d, fill: 'none', stroke: '#1f2328', 'stroke-width': Math.max(2.5, S * 0.1), 'stroke-dasharray': '7 6', opacity: 0}),
        h('circle', {name: `${key}-linkdot`, cx: r(tgt.x), cy: r(tgt.y), r: r(S * 0.22), fill: '#1f2328', opacity: 0})));
    }

    // ---- comparison guide: a bracket beside each changed slot, joined by ONE route that runs only
    // through free space (the gap between the scenes, a band above the strip / between the scenes,
    // and the frame's right margin), drawn above the scenes with a white halo
    const brk = G2 => {
      const box = G2.box;
      const x = G2.G.page.x + G2.G.page.w + S * 0.45;
      return {d: `M${r(x - S * 0.4)} ${r(box.y)}H${r(x)}V${r(box.y + box.h)}H${r(x - S * 0.4)}`, x, y: box.y + box.h / 2};
    };
    const bA = brk(scenes.a), bB = brk(scenes.b);
    const stripTop = H0 - m - strip.h;
    const xR = W0 - 7;
    const bandY = row ? chosen.topA + panelH + chosen.gBand / 2 : chosen.topA + panelH + chosen.gBand / 2;
    const gx = row ? (chosen.x0A + panelW + chosen.x0B) / 2 : xR;
    const inStrip = chosen.inHeader === 'strip';
    const routePts = row
      ? [{x: bA.x, y: bA.y}, {x: gx, y: bA.y}, {x: gx, y: bandY}, {x: xR, y: bandY}, {x: xR, y: bB.y}, {x: bB.x, y: bB.y}]
      : inStrip
        ? [{x: bA.x, y: bA.y}, {x: xR, y: bA.y}, {x: xR, y: stripTop + strip.gy + 2}]
        : [{x: bA.x, y: bA.y}, {x: xR, y: bA.y}, {x: xR, y: bB.y}, {x: bB.x, y: bB.y}];
    // strip mode: the route runs down the right margin to the label; B's bracket joins it with a branch
    const branch = inStrip ? [{x: bB.x, y: bB.y}, {x: xR, y: bB.y}] : null;
    const pathOf = pts => pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    const route = pathOf(routePts) + (branch ? pathOf(branch) : '');
    const guideCol = th.accent;
    let guideChip = null;
    if (chosen.gF) {
      const f = chosen.gF;
      const pw = f.width + S * 1.1, ph = f.height + S * 0.7;
      const cx = row ? (gx + xR) / 2 : inStrip ? W0 - 4 - pw / 2 : xR - S * 0.6 - pw / 2;
      const cy = inStrip ? stripTop + strip.gy + ph / 2 : chosen.inHeader ? chosen.topB - 10 - hh / 2 : bandY;
      const bx = {x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph};
      guideChip = {box: bx, node: g({name: 'gchip', opacity: 0},
        h('path', {d: roundRectPath(bx.x, bx.y, bx.w, bx.h, S * 0.4), fill: '#fff', stroke: guideCol, 'stroke-width': 2.5}),
        textOrBars(ctx, f, {x: cx, y: bx.y + S * 0.35, anchor: 'middle', fill: th.ink, show: true}))};
    }
    const gw = Math.max(3.5, S * 0.13);
    const guide = g({name: 'guide', opacity: 0},
      h('path', {d: route, fill: 'none', stroke: '#fff', 'stroke-width': gw + 6, 'stroke-linejoin': 'round', opacity: 0.9}),
      h('path', {name: 'guide-bA', d: bA.d, fill: 'none', stroke: guideCol, 'stroke-width': Math.max(4, S * 0.16), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {name: 'guide-bB', d: bB.d, fill: 'none', stroke: guideCol, 'stroke-width': Math.max(4, S * 0.16), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {name: 'guide-route', d: route, fill: 'none', stroke: guideCol, 'stroke-width': gw, 'stroke-linejoin': 'round'}));
    const guideMask = h('defs', null, h('mask', {id: ctx.id('guide-m'), maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: r(W0), height: r(H0)},
      h('path', {name: 'guide-mask', d: route, fill: 'none', stroke: '#fff', 'stroke-width': 40, pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}),
      h('path', {d: `${bA.d}${bB.d}`, fill: 'none', stroke: '#fff', 'stroke-width': 30})));
    // guide checks: the route (between its brackets) meets no scene element, header text or strip,
    // and the chip covers no text
    const sceneBoxes = [scenes.a, scenes.b].flatMap(sc => {
      const G = sc.G, k2 = G.k;
      return [G.board, {x: G.benchX0, y: G.benchTopY - 30 * k2, w: G.benchX1 - G.benchX0, h: G.floorY - G.benchTopY + 30 * k2}, {x: G.px - 60 * k2, y: G.floorY - 420 * k2, w: 120 * k2, h: 420 * k2}];
    });
    const stripBoxes = strip.fits.map(l => ({x: W0 / 2 + l.cx - l.f.width / 2, y: stripTop + l.y, w: l.f.width, h: l.f.height}));
    const textBoxes = [...[hdA, hdB].flatMap(hd => hd.boxes), ...(inStrip ? stripBoxes : [{x: m, y: stripTop, w: W0 - 2 * m, h: strip.h}])];
    const samples = [];
    const segs = [];
    for (let i = 1; i < routePts.length; i++) segs.push([routePts[i - 1], routePts[i], i === 1, i === routePts.length - 1]);
    if (branch) segs.push([branch[0], branch[1], true, false]);
    for (const [A, B, first, last] of segs) {
      const n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y) / 8);
      for (let k2 = 0; k2 <= n; k2++) samples.push({x: A.x + (B.x - A.x) * k2 / n, y: A.y + (B.y - A.y) * k2 / n, first, last});
    }
    const inBox = (q, bb) => q.x > bb.x + 1 && q.x < bb.x + bb.w - 1 && q.y > bb.y + 1 && q.y < bb.y + bb.h - 1;
    const guideClear = samples.every(q => ![...sceneBoxes, ...textBoxes].some(bb => inBox(q, bb)) || ((q.first || q.last) && [scenes.a.G.board, scenes.b.G.board].some(bb => inBox(q, bb))));
    const pageTexts = [...pageTextBlocks(GA), ...pageTextBlocks(GB)];
    const guideChipClear = !guideChip || ![...pageTexts, ...textBoxes, ...sceneBoxes].some(bb => overlaps(guideChip.box, bb, 0));

    // ---- strip nodes
    const stripNodes = strip.fits.map(l => g({name: `strip-${l.key}`, opacity: l.key === 'same' ? 1 : 0},
      textOrBars(ctx, l.f, {x: W0 / 2 + l.cx, y: stripTop + l.y, anchor: 'middle', fill: l.fill, show: true})));

    return {S, strip, stripTop, stA, stB, GA, GB, hdA, hdB, scenes, sceneNodes, guide, guideMask, guideChip, stripNodes, targets, row, overflow: Boolean(chosen.overflow), panelW, panelH, W0, H0, guideClear, guideChipClear};
  },
  build(ctx, L) {
    return g(null,
      L.hdA.node, L.hdB.node,
      g({name: 'sceneA'}, L.stA.node), g({name: 'sceneB'}, L.stB.node),
      L.sceneNodes,
      L.guideMask, g({mask: ctx.ref('guide-m')}, L.guide),
      L.guideChip && L.guideChip.node,
      L.stripNodes);
  },
  frame(ctx, L, u) {
    const c = clockOf(u);
    const mark = ease.inOutCubic(seg(u, ...W.mark));
    const link = seg(u, ...W.link);
    const nodes = {};
    const looks = {};
    for (const [key, sc] of Object.entries(L.scenes)) {
      const isData = sc.to === 'data';
      const pageState = {
        rows: sc.G.PL.rows.map((_, i) => (isData ? seg(u, W.rows[0] + 0.012 * i, W.rows[1] + 0.012 * i) : 0)),
        fence: isData ? 0 : mark, dframe: isData ? mark : 0, op: isData ? 0 : seg(u, ...W.op), sc: isData ? 0 : seg(u, ...W.sc),
      };
      const posed = sc.st.pose({c, pageState});
      Object.assign(nodes, posed.nodes);
      nodes[`${key}-link`] = {opacity: r(link, 3), 'stroke-dashoffset': 0};
      nodes[`${key}-linkdot`] = {opacity: link >= 1 ? 1 : 0};
      const s = posed.semantic;
      sc.sem = s;
      looks[key] = {
        slot: mark > 0 ? sc.to : null, mark: r(mark, 3), frameFill: sc.to === 'data' ? r(0.55 * mark, 3) : 0, fenceFill: sc.to === 'data' ? 0 : r(0.55 * mark, 3), link: r(link, 3),
        mag: s.magHolder, lens: s.lensOn, tag: s.tagHolder, pinned: s.pinned,
        hand: {x: Math.round(s.hand.x - sc.G.x0), y: Math.round(s.hand.y - sc.G.top)},
        rows: pageState.rows.map(v => r(v, 3)), op: r(pageState.op, 3), sc: r(pageState.sc, 3), fence: r(pageState.fence, 3),
      };
    }
    // headers, guide, strip
    const heads = seg(u, ...W.heads);
    if (ctx.show('key')) {
      nodes['hdA-txt'] = {opacity: r(heads, 3)};
      nodes['hdB-txt'] = {opacity: r(heads, 3)};
    }
    const gp = seg(u, ...W.guide);
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-mask'] = {'stroke-dashoffset': r(100 * (1 - gp), 2)};
    if (L.guideChip) nodes.gchip = {opacity: r(seg(u, ...W.guideChip), 3)};
    for (const l of L.strip.fits) {
      if (l.key === 'changed') nodes[`strip-${l.key}`] = {opacity: r(seg(u, ...W.changedFact), 3)};
      if (l.key === 'neutral') nodes[`strip-${l.key}`] = {opacity: r(seg(u, ...W.notes), 3)};
    }
    // strip the .user-irrelevant hand coordinates from the look comparison (both scenes share geometry)
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const A = L.scenes.a.sem, B = L.scenes.b.sem;
    return {
      nodes,
      semantic: {
        beat,
        scenes: 2,
        lookA: looks.a, lookB: looks.b,
        targets: L.targets,
        differing: ['slot'].filter(k => L.targets.a !== L.targets.b),
        handA: {x: A.hand.x, y: A.hand.y}, handB: {x: B.hand.x, y: B.hand.y},
        magA: A.magGrip, magB: B.magGrip, tagA: A.tagEye, tagB: B.tagEye, pinA: A.pinPt, pinB: B.pinPt,
        allReached: A.reached && B.reached, handsOnBench: A.handsOnBench && B.handsOnBench,
        guide: r(gp, 3), guideChip: L.guideChip ? r(seg(u, ...W.guideChip), 3) : 0,
        notes: r(seg(u, ...W.notes), 3),
        arrangement: L.row ? 'row' : 'column',
        panelW: r(L.panelW / L.W0, 3), panelH: r(L.panelH / L.H0, 3),
        overflow: L.overflow, S: L.S, guideClear: L.guideClear, guideChipClear: L.guideChipClear,
        personFrac: r(410 * L.GA.k / L.H0, 3), pageShare: r(L.GA.board.w / L.panelW, 3), pinDy: Math.round(Math.abs(L.GA.pin.y - L.GA.top - (L.GB.pin.y - L.GB.top))),
        gearHidden: [L.GA, L.GB].some(G => { const tb = {x: G.pin.x - L.scenes.a.st.tag.w / 2, y: G.pin.y, w: L.scenes.a.st.tag.w, h: L.scenes.a.st.tag.h}; const ob = {x: G.obj.x - G.obj.R, y: G.obj.y - G.obj.R, w: G.obj.R * 2, h: G.obj.R * 2}; const ix = Math.max(0, Math.min(tb.x + tb.w, ob.x + ob.w) - Math.max(tb.x, ob.x)), iy = Math.max(0, Math.min(tb.y + tb.h, ob.y + ob.h) - Math.max(tb.y, ob.y)); return ix * iy > 0.3 * ob.w * ob.h; }),
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
    slug: 'roles-04-contrast',
    title: 'Specialist intervention — the tag linked to examined data or to a bounded opinion',
    titleEs: 'Intervención de perito — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Intervención de perito',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical workbench scenes: the same specialist examines the same object and pins the same tag to the same report page. Only one fact changes: in A the tag is linked to the data slot (outlined, then filled with the supplied measurements); in B to the opinion slot (closed by a dashed scope fence, then filled with the supplied opinion and scope). A guide joins the changed slots; neutral note; no winner or outcome.',
    tags: ['specialist', 'expert', 'report', 'data examined', 'opinion scope', 'comparison', 'tag string', 'person', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/intervencion-de-perito.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PERITO_STRINGS,
  scene,
});
