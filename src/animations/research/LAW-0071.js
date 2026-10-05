/**
 * LAW-0071 — Comprobación de jurisdicción · contrast
 *
 * Storyboard (two complete, identical checking gates; exactly one fact
 * differs — the jurisdiction the SAME document declares):
 *  0.00–0.17  base: in both panels the same source document stands face-out
 *             in the library's bottom compartment with an EMPTY declaration
 *             (dashed seal and strip); the research card (same key) is tied
 *             to the gate's lock box; flap down, trapdoor closed.
 *  0.17–0.40  change: the declaration is introduced in place — the blank
 *             fades, a ring pulses on the seal and the declared jurisdiction
 *             appears: in A the one marked on the card, in B another one. The
 *             changed fact is named in the footer.
 *  0.40–0.77  parallel action: both documents slide to the gate and present
 *             their seal; the lock reads it ("=" / "≠"). A: the flap swings
 *             up, the document passes onto the "= key" landing and its
 *             reference is written on the card. B: the flap stays down, the
 *             trapdoor drops and the document slides into the "≠ key" bin;
 *             the card keeps its empty line.
 *  0.77–1.00  guide: rings mark both declarations and a guide joins them
 *             (around the panels, never across an object); shared facts and a
 *             neutral note — no winner, score or legal consequence.
 * Side by side on wide boxes, stacked on tall (the guide then runs in a lane
 * outside the panels); 1:1 uses tall side-by-side panels.
 * Legal content: fictional; the gate compares two supplied labels only.
 * @module animations/research/LAW-0071
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields, oneOf, int} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {stateTag, balancedWidth} from '../causation/kits/place.js';
import {jurFields, JUR_DEFAULTS, JUR_STRINGS, JUR_KEYS, resolveJur, jurColor, hyCtx} from './kits/comprobacion-de-jurisdiccion.js';
import {gatePanel} from './kits/comprobacion-de-jurisdiccion-gate.js';

const ID = 'LAW-0071';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  reveal: [0.2, 0.33], changeChip: [0.21, 0.29], changeOut: [0.46, 0.5],
  slide: [0.41, 0.52], read: [0.52, 0.57],
  open: [0.565, 0.6], pass: [0.595, 0.67], close: [0.67, 0.71], write: [0.665, 0.73],
  drop: [0.575, 0.626], fall: [0.627, 0.7], closeB: [0.7, 0.745],
  tags: [0.72, 0.77], guide: [0.78, 0.9], rings: [0.78, 0.82],
  sharedIn: [0.52, 0.56], sharedOut: [0.76, 0.785], guideChip: [0.8, 0.86], note: [0.875, 0.93],
};

const sceneSchema = {
  ...jurFields,
  ...contrastFields(),
  documentIndex: int('Index (0 = first) of the source document used in both scenes', 0, 5),
  declaredA: oneOf('Key of the jurisdiction the document declares in scenario A', JUR_KEYS),
  declaredB: oneOf('Key of the jurisdiction the same document declares in scenario B (the only changed fact)', JUR_KEYS),
};

const defaultParams = {
  ...JUR_DEFAULTS,
  documentIndex: 0,
  declaredA: 'j1',
  declaredB: 'j2',
  scenarioA: {label: 'Relevant jurisdiction', caption: 'The document declares Northvale, the jurisdiction marked on the card'},
  scenarioB: {label: 'Other jurisdiction', caption: 'The same document declares Eastmere instead'},
  changedFact: 'Only one fact differs: the jurisdiction the document declares',
  sharedFacts: ['Same document', 'Same research card', 'Same gate'],
  comparisonLabels: {guide: 'Changed fact: the declared jurisdiction', neutral: 'Two situations side by side — no legal effect or conclusion is stated'},
};

/** Panel stage per shape (panel-local units). */
const STAGES = {
  landscape: {arrangement: 'row', w: 900, h: 640},
  square: {arrangement: 'row', w: 640, h: 780},
  // short, wide panels (card beside the gate) so the stacked pair spans the width
  portrait: {arrangement: 'column', w: 900, h: 440, beside: true, capOneLine: true},
};
const LANE = 72;

/** Elbow guide with rounded corners (plain relation style: end dots, no arrow). */
function laneGuide(ctx, name, pts, rad, color) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (la || 1)) * rr, y: b.y + ((a.y - b.y) / (la || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (lc || 1)) * rr, y: b.y + ((c.y - b.y) / (lc || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1, p2);
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  samples.push(last);
  let total = 0;
  for (let i = 1; i < samples.length; i++) total += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  total *= 1.02;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: pts[0].x, cy: pts[0].y, r: 6, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: last.x, cy: last.y, r: 6, fill: color, opacity: 0}));
  const frame = (p, op = 1) => ({
    [name]: {opacity: op},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame};
}

/** Header metrics for a panel of width w (same proportions as the shared scenario header). */
function headerSizes(ctx, w) {
  const size = Math.min(54, 128 * 0.4);
  const badgeR = size * 0.78;
  return {size, badgeR, cy: 128 * 0.42, labW: w - badgeR * 2 - 24};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx0) {
    const ctx = hyCtx(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const M = resolveJur(p);
    const St = STAGES[ctx.view.shape];
    const doc = M.docs[Math.min(p.documentIndex, M.docs.length - 1)];
    const jA = {key: p.declaredA, name: M.jurOf(p.declaredA).name};
    const jB = {key: p.declaredB, name: M.jurOf(p.declaredB).name};
    const lineText = [doc.id, doc.citation].filter(Boolean).join(' · ');

    // headers: badge + label (one line, or two before any ellipsis) + caption (one to three
    // lines before any ellipsis); both panels share the tallest header
    const HS = headerSizes(ctx, St.w);
    const capSize = 28;
    const capW = St.w - 120;
    // stacked panels: a one-line caption (slightly smaller) keeps the headers short, unless it would be cut
    const capFit = text => {
      if (St.capOneLine) {
        const one = ctx.fit(text, {maxWidth: capW, size: capSize, minSize: 22, maxLines: 1, weight: 500});
        if (!one.truncated) return one;
      }
      const two = ctx.fit(text, {maxWidth: capW, size: capSize, minSize: 22, maxLines: 2, weight: 500});
      return two.truncated ? ctx.fit(text, {maxWidth: capW, size: capSize, minSize: 22, maxLines: 3, weight: 500}) : two;
    };
    const labFit = text => {
      const one = ctx.fit(text, {maxWidth: HS.labW, size: HS.size, minSize: HS.size * 0.7, maxLines: 1, weight: 700});
      if (!one.truncated) return one;
      const two = ctx.fit(text, {maxWidth: HS.labW, size: HS.size * 0.8, minSize: HS.size * 0.56, maxLines: 2, weight: 700});
      return two.truncated ? one : two;
    };
    const scen = [p.scenarioA, p.scenarioB];
    const caps = scen.map(sc => (sc.caption && ctx.show('all') ? capFit(sc.caption) : null));
    const labs = scen.map(sc => (sc.label && ctx.show('key') ? labFit(sc.label) : null));
    // header-local layout: badge centre, label block (centred on the badge when one line), caption
    const labTop = f => (f.lines.length > 1 ? HS.cy - f.height / 2 : HS.cy - f.size * 0.62);
    const capTopRel = Math.max(HS.cy + 36.9, ...labs.map(f => (f ? labTop(f) + f.height + 12 : 0)));
    const capH = Math.max(capSize, ...caps.map(f => (f ? f.height : 0)));
    const header = Math.round(6 + capTopRel + capH + 22);
    const geo = pairedGeometry(ctx, {stage: {w: St.w, h: St.h}, arrangement: St.arrangement, header, gap: St.arrangement === 'column' ? 54 : 70});
    const row = St.arrangement === 'row';

    const panels = [0, 1].map(i => gatePanel(ctx, {prefix: i ? 'pb' : 'pa', W: St.w, H: St.h, beside: St.beside, doc, declared: i ? jB : jA, relevant: M.relevant, query: p.query, lineText}));
    const colors = [jurColor(ctx, jA.key).c, jurColor(ctx, jB.key).c];
    const headers = geo.panels.map((pn, i) => {
      const top = pn.headerY + 6;
      const bx = pn.x + HS.badgeR, by = top + HS.cy;
      // the badge names the panel: its letter, or (labels hidden) one / two pips — never an empty disc
      const mark = ctx.show('key')
        ? h('text', {x: bx, y: by + HS.size * 0.36, 'text-anchor': 'middle', 'font-size': HS.size, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A')
        : g(null, (i ? [-1, 1] : [0]).map(k => h('circle', {cx: bx + k * HS.badgeR * 0.34, cy: by, r: HS.badgeR * 0.2, fill: '#fff'})));
      const f = labs[i];
      const c = caps[i];
      const tx = pn.x + HS.badgeR * 2 + 18;
      return g({name: `head-${i}`},
        h('circle', {cx: bx, cy: by, r: HS.badgeR, fill: th.inkSoft, stroke: th.ink, 'stroke-width': 2.5}),
        mark,
        f ? textBlock(f, {x: tx, y: top + labTop(f), fill: th.fg}) : null,
        c ? textBlock(c, {x: pn.x + HS.size * 0.78 * 2 + 18, y: top + capTopRel, fill: th.fgSoft}) : null);
    });
    const backdrops = geo.panels.map((pn, i) => h('path', {d: roundRectPath(pn.x - 6, pn.y - 6, pn.w + 12, pn.h + 12, 24), fill: th.dark ? '#2c3036' : (i ? '#eef0f3' : '#f3f0ea'), stroke: th.dark ? '#454b53' : '#d9d4c8', 'stroke-width': 2.5}));

    // final seal positions (block coordinates) → rings + guide
    const G0 = panels[0].G;
    const finals = panels.map((P, i) => {
      const sem = P.pose(fullPose(1, P.same)).semantic;
      const pn = geo.panels[i];
      return {x: pn.x + sem.seal.x, y: pn.y + sem.seal.y};
    });
    const ringR = G0.dw * 0.24;
    // the guide must stay visible when a mono palette meets a dark background
    const accent = th.dark && p.palette === 'mono' ? th.fg : th.accent;
    const rings = finals.map((q, i) => h('circle', {name: `ring-${i}`, cx: q.x, cy: q.y, r: ringR, fill: 'none', stroke: accent, 'stroke-width': 5, opacity: 0}));
    // guide route: around the panels, never across an object
    const A = finals[0], B = finals[1];
    const pa = geo.panels[0], pb = geo.panels[1];
    const exitA = {x: A.x + ringR, y: A.y};
    const entryYB = pb.y + G0.ledgeY + 44;
    let pts;
    if (row) {
      const laneX = pa.x + pa.w + 35;
      pts = [exitA, {x: laneX, y: A.y}, {x: laneX, y: entryYB}, {x: B.x - ringR * 0.6, y: entryYB}, {x: B.x - ringR * 0.6, y: B.y + ringR * 0.8}];
    } else {
      const laneX = pa.x + pa.w + LANE / 2;
      pts = [exitA, {x: laneX, y: A.y}, {x: laneX, y: entryYB}, {x: B.x + ringR * 0.6, y: entryYB}, {x: B.x + ringR * 0.6, y: B.y + ringR * 0.8}];
    }
    const guide = laneGuide(ctx, 'guide', pts, 26, accent);

    // status tags under each landing (descriptive states only)
    const tagText = [ctx.t.listed, ctx.t.setAside];
    const tags = panels.map((P, i) => {
      if (!ctx.show('key')) return null;
      const pn = geo.panels[i];
      const G = P.G;
      const cx = pn.x + (G.landing.x0 + G.landing.x1) / 2;
      const y = pn.y + G.ledgeY + 70;
      const t = stateTag(ctx, tagText[i], {x: cx, y, anchor: 'middle', size: 28, maxWidth: G.landing.x1 - G.landing.x0 + 60, name: `tag-${i}`, color: i ? th.inkSoft : jurColor(ctx, M.relevant.key).c});
      // B: short leader from the tag to the bin it describes
      const lead = i ? h('path', {d: `M${r(t.box.x - 4)} ${r(t.box.cy)}H${r(pn.x + G.bin.x + G.bin.w + 10)}`, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '6 6'}) : null;
      return {node: g({name: `tagg-${i}`, opacity: 0}, lead, t.node), box: t.box};
    });

    // footer: row 1 = changed fact → shared facts → guide label; row 2 = neutral note
    const fw = geo.w + (row ? 0 : LANE);
    const footSize = 32;
    // footer chips wrap into balanced lines (no orphan word on a second line)
    const bal = (text, size, weight) => balancedWidth(ctx, text, {maxWidth: fw * 0.94, size, maxLines: 2, weight});
    const change = ctx.show('key') ? chip(ctx, p.changedFact, {x: fw / 2, y: 0, anchor: 'middle', maxWidth: bal(p.changedFact, footSize, 600), size: footSize, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const sharedText = `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, sharedText, {x: fw / 2, y: 0, maxWidth: bal(sharedText, footSize, 500), size: footSize, name: 'shared-note'}) : null;
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: fw / 2, y: 0, anchor: 'middle', maxWidth: bal(p.comparisonLabels.guide, footSize, 600), size: footSize, maxLines: 2, fill: th.card, stroke: accent, name: 'guide-chip'}) : null;
    const row1H = Math.max(...[change, shared, guideChip].filter(Boolean).map(c => c.box.h), 0);
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: fw / 2, y: 0, maxWidth: bal(p.comparisonLabels.neutral, footSize - 2, 500), size: footSize - 2, name: 'neutral-note'}) : null;
    const footer = 22 + row1H + (neutral ? 14 + neutral.box.h : 0) + 8;
    const bw = fw, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const footY = geo.h + 22;
    const place = (c, y) => c && g({transform: T(0, y)}, c.node);
    const textWhole = {
      headers: !labs.some(f => f && f.truncated) && !caps.some(f => f && f.truncated),
      declarations: !panels.some(P => P.sheet.nameCut),
    };
    return {M, geo, panels, headers, textWhole, backdrops, rings, guide, tags, change, shared, guideChip, neutral, footY, row1H, s, ox, oy, row, place, finals, jA, jB, doc};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.backdrops,
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.panels[i].layers.back, L.panels[i].layers.doc, L.panels[i].layers.front)),
      L.rings,
      L.tags.map(t => t && t.node),
      L.guide.node,
      L.place(L.change, L.footY), L.place(L.shared, L.footY), L.place(L.guideChip, L.footY),
      L.neutral && g({transform: T(0, L.footY + L.row1H + 14)}, L.neutral.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sem = L.panels.map((P, i) => {
      const posed = P.pose(poseAt(u, P.same));
      Object.assign(nodes, posed.nodes);
      return posed.semantic;
    });
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    const ringP = r(seg(u, ...W.rings), 3);
    nodes['ring-0'] = {opacity: ringP};
    nodes['ring-1'] = {opacity: ringP};
    L.tags.forEach((t, i) => { if (t) nodes[`tagg-${i}`] = {opacity: r(seg(u, ...W.tags), 3)}; });
    if (L.change) nodes['change-chip'] = {opacity: r(seg(u, ...W.changeChip) * (1 - seg(u, ...W.changeOut)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.sharedIn) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(seg(u, ...W.guideChip), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(seg(u, ...W.note), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const [a, b] = sem;
    return {
      nodes,
      semantic: {
        beat,
        a: {holder: a.holder, printed: a.printed, written: a.written, pinned: a.pinned, flap: a.flap, trap: a.trap},
        b: {holder: b.holder, printed: b.printed, written: b.written, pinned: b.pinned, flap: b.flap, trap: b.trap},
        pinSize: a.pinSize,
        aDoc: a.center, bDoc: b.center, aSeal: a.seal, bSeal: b.seal,
        bFoot: b.foot, bTrapPoint: b.trapPoint,
        declared: {a: L.jA.key, b: L.jB.key},
        relevantKey: L.M.relevant.key,
        sameDocument: true,
        guideProgress: r(gp, 3),
        arrangement: L.row ? 'row' : 'column',
        headersWhole: L.textWhole.headers,
        declarationsWhole: L.textWhole.declarations,
      },
    };
  },
};

/** Per-panel progress record at time u (same windows in both panels). */
function poseAt(u, same) {
  const s = w => seg(u, ...W[w]);
  return {
    reveal: s('reveal'), slide: ease.inOutCubic(s('slide')), read: s('read'),
    open: same ? s('open') : 0, pass: same ? s('pass') : 0, close: same ? s('close') : s('closeB'), write: same ? s('write') : 0,
    drop: same ? 0 : s('drop'), fall: same ? 0 : s('fall'),
  };
}
function fullPose(u, same) { return poseAt(u, same); }

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-08-contrast',
    title: 'Jurisdiction check — same document, two declarations',
    titleEs: 'Comprobación de jurisdicción — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Comprobación de jurisdicción',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical checking gates run in parallel with the same document, card and gate. Only the jurisdiction the document declares differs: in A it is the one marked on the card, so the flap opens, the document passes to the "= key" landing and its reference is written on the card; in B it is another one, so the flap stays down and the trapdoor sets the document aside into the "≠ key" bin. A guide joins the two declarations; no winner or legal consequence is stated.',
    tags: ['jurisdiction', 'comparison', 'gate', 'declared jurisdiction', 'research card', 'library', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/comprobacion-de-jurisdiccion.js', 'src/animations/research/kits/comprobacion-de-jurisdiccion-gate.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: JUR_STRINGS,
  scene,
});
