/**
 * LAW-0207 — Jerarquía judicial editable · contrast
 *
 * Storyboard (two complete copies of the same podium scene: side by side on
 * wide and square frames, sharing one level ruler in the middle; one above
 * the other on tall frames, each with its own ruler. The same generic
 * buildings, room plans, seated people, labels and supplied links in both):
 *  0.00–0.17  base: the two scenes are identical flat rows of buildings on
 *             podiums. Only the neutral A / B badges tell them apart.
 *  0.17–0.24  the supplied levels draw on (the same ruler for both).
 *  0.24–0.40  the change, localized and explicit: over ONE body (the supplied
 *             focus body) a dashed outline marks where the supplied
 *             configuration places it — on «Nivel de origen» in A, on the
 *             «nivel de revisión configurado» in B. Then the scenario labels
 *             and captions appear. Nothing else differs.
 *  0.42–0.70  in parallel and with the same timing, the podiums rise step by
 *             step to their supplied levels; the focus body rises to the level
 *             of its scenario, so its building, its links and the lanes of
 *             those links differ (geometry, not only text or colour).
 *  0.70–0.76  the same supplied links draw in both scenes.
 *  0.77–1.00  a dashed outline surrounds the focus body in both scenes and a
 *             bracket joins the two outlines to one chip naming the changed
 *             fact; shared facts, the neutral note ("no winner, no outcome")
 *             and the key stay visible. Neither placement is marked as right
 *             or better; nothing says that a review happens or succeeds.
 * @module animations/courts/LAW-0207
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {
  hierFields, HIER_STRINGS, resolveHier, podiumGeometry, podiumScene, pxPerUnit, lookFor, fitG, fitOk, cardH, labelCard, textAt, measureInfo, drawInfo, R2,
} from './kits/jerarquia-editable.js';

const ID = 'LAW-0207';
const DURATION = 7500;
const W = {ruler: [0.17, 0.24], marker: [0.24, 0.33], header: [0.33, 0.4], rise: [0.42, 0.7], links: [0.7, 0.76], guide: [0.77, 0.83], notes: [0.8, 0.86]};

const scenario = (d, lv) => obj(d, {
  label: str('Short label of the scenario', 40),
  caption: str('One-line description of the scenario', 60),
  level: int('Level (1-based) at which the supplied configuration places the focus body in this scenario', 1, 3),
}, ['label', 'level']);

const sceneSchema = {
  ...hierFields({maxBodies: 4, maxLevels: 3, labelMax: 40, levelMax: 36, maxSeats: 1, keyMax: 70}),
  focusBody: int('Index of the body whose placement differs (its own `level` is replaced by the scenario level)', 0, 3),
  scenarioA: scenario('Scenario A (origin level)'),
  scenarioB: scenario('Scenario B (configured review level)'),
  changedFact: str('The single fact that differs between A and B', 80),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 44), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label on the guide joining the changed detail', 50),
    neutral: str('Neutral note (no winner, no outcome)', 70),
  }),
};

const defaultParams = {
  courts: {
    levels: [{name: 'Origin level (as configured)'}, {name: 'Level 2 (as configured)'}, {name: 'Configured review level'}],
    bodies: [
      {label: 'Origin body A (fictional)', level: 1},
      {label: 'Body X (fictional)', level: 1},
      {label: 'Review body (as configured)', level: 3},
    ],
  },
  routes: [{from: 0, to: 1, kind: 'relation'}, {from: 1, to: 2, kind: 'relation'}],
  seats: 1,
  labels: {note: 'Hierarchy as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
  people: [],
  focusBody: 1,
  scenarioA: {label: 'Origin level', caption: 'Body X placed on the origin level', level: 1},
  scenarioB: {label: 'Configured review level', caption: 'Body X placed on the configured review level', level: 3},
  changedFact: 'Only the supplied level of body X differs',
  sharedFacts: ['Same levels, bodies and links', 'Same rooms and people'],
  comparisonLabels: {guide: 'Only this placement differs', neutral: 'Both as supplied · no winner, no outcome'},
};

function levelAt(u, level, N, reduced) {
  const [a, b] = W.rise;
  const span = (b - a) / N;
  let lv = 0;
  for (let s = 1; s <= level; s++) {
    const t = seg(u, a + (s - 1) * span, a + s * span - span * 0.12);
    lv += reduced ? ease.inOutQuad(t) : ease.inOutCubic(t);
  }
  return lv;
}

/** Header: lane badge (letter) + scenario label + caption. */
function measureHeader(ctx, sc, w, F) {
  const bad = F * 1.05;
  const tw = w - bad * 2 - F * 0.6;
  const lab = fitG(sc.label, {maxWidth: tw, size: F * 1.1, minSize: F, maxLines: 2, weight: 700});
  const cap = sc.caption ? fitG(sc.caption, {maxWidth: tw, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  const ok = fitOk(lab) && (!cap || fitOk(cap));
  const hh = Math.max(bad * 2, lab.height + (cap ? F * 0.3 + cap.height : 0));
  return {ok, lab, cap, bad, h: hh, w: bad * 2 + F * 0.6 + Math.max(lab.width, cap ? cap.width : 0)};
}

function drawHeader(ctx, m, x, y, color, letter, name, showKey, showAll) {
  const th = ctx.theme;
  const cx = x + m.bad, cy = y + m.bad;
  const tx = x + m.bad * 2 + m.bad * 0.55;
  return {
    badge: g({name: `${name}-badge`},
      h('circle', {cx: r(cx), cy: r(cy), r: r(m.bad), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
      showKey ? h('text', {x: r(cx), y: r(cy + m.bad * 0.38), 'text-anchor': 'middle', 'font-size': r(m.bad * 1.05), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter) : null),
    text: showKey ? g({name: `${name}-text`, opacity: 0},
      textAt(m.lab, tx, y, th.fg),
      m.cap && showAll ? textAt(m.cap, tx, y + m.lab.height + m.lab.size * 0.3, th.fgSoft) : null) : null,
  };
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const base = resolveHier(p);
    const fi = Math.min(p.focusBody, base.M - 1);
    const lvA = Math.min(base.N, p.scenarioA.level), lvB = Math.min(base.N, p.scenarioB.level);
    const withLevel = lv => ({...base, bodies: base.bodies.map((b, i) => (i === fi ? {...b, level: lv} : b))});
    const RA = withLevel(lvA), RB = withLevel(lvB);
    const levelsMax = i => (i === fi ? Math.max(lvA, lvB) : base.bodies[i].level);
    const colors = [th.accent2, th.accent4];
    const shape = ctx.view.shape;
    const row = shape !== 'portrait';
    const gap = 30 / px;
    const tries = [];
    const facts = showAll ? p.sharedFacts.map(f => ({type: 'text', text: `• ${f}`, weight: 500})) : [];
    // the bodies are the same in A and B: their labels are drawn once, keyed by the badge number on each podium
    const bodyKey = showKey ? base.bodies.map((b, i) => ({type: 'text', text: `${i + 1} · ${b.label}`, weight: 600})) : [];
    const notes = [];
    if (showAll) notes.push({type: 'text', text: p.comparisonLabels.neutral, weight: 500});
    if (showKey) notes.push({type: 'key', text: p.labels.key});
    for (let F = 21.5 / px; F >= 16.6 / px - 1e-6; F -= (F * px > 20.2 ? 0.8 : 0.4) / px) {
      for (const mode of row ? (shape === 'square' ? ['row', 'col'] : ['row']) : ['col']) if (mode === 'row') {
        for (const numbered of [false, true]) for (const cf of (numbered ? [0.09, 0.11] : [0.13, 0.15, 0.17]).filter(q => (D.w * (1 - q) - gap * 2) / 2 >= 0.405 * D.w)) {
          const cw = D.w * cf;
          const sw = (D.w - cw - gap * 2) / 2;
          const hA = measureHeader(ctx, p.scenarioA, sw, F), hB = measureHeader(ctx, p.scenarioB, sw, F);
          if (showKey && (!hA.ok || !hB.ok)) continue;
          const HH = showKey ? Math.max(hA.h, hB.h) + 14 / px : measureHeader(ctx, {label: 'A'}, sw, F).bad * 2 + 14 / px;
          // strip: [levels key +] facts | guide chip + changed fact | neutral note + key
          const colW = (D.w - gap * 2) / 3;
          const levelKey = numbered && showKey ? base.levels.map((l, i) => ({type: 'text', text: `${i + 1} · ${l.name}`, weight: 600})) : [];
          // balance the strip groups over the three columns (the middle one starts under the guide chip)
          const groups = [{its: levelKey, early: true}, {its: bodyKey, early: true}, ...facts.map(f => ({its: [f]})), ...notes.map(nn => ({its: [nn]}))]
            .filter(gr => gr.its.length).map(gr => ({m: measureInfo(gr.its, colW, F), early: !!gr.early}));
          if (groups.some(gr => !gr.m)) continue;
          // the guide chip sits in the centre column under the shared ruler; the changed fact joins the strip
          const guideFit = showAll ? fitG(p.comparisonLabels.guide, {maxWidth: colW - F, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
          const factFit = null;
          if (showAll && !fitOk(guideFit)) continue;
          const factGroup = showAll ? measureInfo([{type: 'text', text: p.changedFact, weight: 600}], colW, F) : null;
          if (showAll && !factGroup) continue;
          const allGroups = factGroup ? [{m: factGroup, early: false}, ...groups] : groups;
          const bracket = 18 / px;
          // the guide chip heads the middle column of the strip, under the bracket
          const cols3 = [0, 1, 2].map(ci => ({h: bracket + 20 / px + (ci === 1 && guideFit ? cardH(guideFit, F) + F * 0.4 : 0), gs: []}));
          // largest groups first (balanced columns); early keys keep their order among themselves
          for (const gr of allGroups.slice().sort((a, b) => b.m.height - a.m.height)) {
            const tgt = cols3.reduce((a, c2) => (c2.h < a.h ? c2 : a), cols3[0]);
            tgt.gs.push({gr: gr.m, early: gr.early, y: tgt.h});
            tgt.h += gr.m.height + F * 0.3;
          }
          const strip = Math.max(...cols3.map(c2 => c2.h)) + 10 / px;
          // shared ruler plates in the centre column (full names, or level numbers keyed in the strip)
          const plateFits = showKey ? base.levels.map((l, i) => fitG(numbered ? String(i + 1) : l.name, {maxWidth: cw - 12 / px - F * 0.84, size: F, minSize: F, maxLines: 3, weight: numbered ? 800 : 600})) : [];
          if (plateFits.some(f => !fitOk(f))) continue;
          const plateH = plateFits.length ? (numbered ? F * 1.56 : Math.max(...plateFits.map(f => cardH(f, F)))) : 0;
          const titleFit = showKey ? fitG(p.labels.note, {maxWidth: (numbered ? cw * 1.6 : cw) - 8 / px, size: F, minSize: F, maxLines: 5, weight: 600}) : null;
          if (titleFit && !fitOk(titleFit)) continue;
          const sh = D.h - HH - strip;
          const ext = {plateH, minRise: 0};
          const bA = {x: 0, y: HH, w: sw, h: sh}, bB = {x: sw + gap * 2 + cw, y: HH, w: sw, h: sh};
          const gA = podiumGeometry(ctx, {box: bA, R: RA, F, px, showKey, externalRuler: ext, levelsMax, minRatio: 0.4, minRisePx: 36, badgeLabels: true, minK: 0.35});
          const gB = podiumGeometry(ctx, {box: bB, R: RB, F, px, showKey, externalRuler: ext, levelsMax, minRatio: 0.4, minRisePx: 36, badgeLabels: true, minK: 0.35});
          if (!gA || !gB) continue;
          // the title must fit above the top plate, the guide chip under the lowest plate
          if (titleFit && gA.lineY(base.N) - plateH / 2 - 10 / px - titleFit.height < HH) continue;
          tries.push({F, row: true, numbered, gA, gB, HH, hA, hB, sw, cw, gap, strip, cols3, guideFit, factFit, plateFits, plateH, titleFit, colW, bracket});
        }
      } else {
        for (const numbered of [false, true]) {
          const sw = D.w;
          const hA = measureHeader(ctx, p.scenarioA, sw * 0.62, F), hB = measureHeader(ctx, p.scenarioB, sw * 0.62, F);
          if (showKey && (!hA.ok || !hB.ok)) continue;
          const HH = showKey ? Math.max(hA.h, hB.h) + 12 / px : hA.bad * 2 + 12 / px;
          const colW = (D.w - gap) / 2;
          // numbered: the gutters carry level numbers; the level names are keyed once in the strip, from the start
          const levelKey = numbered && showKey ? base.levels.map((l, i) => ({type: 'text', text: `${i + 1} · ${l.name}`, weight: 600})) : [];
          const mKey = bodyKey.length || levelKey.length ? measureInfo([...levelKey, ...bodyKey], colW, F) : {items: [], height: 0, gap: 0, w: colW};
          if (!mKey) continue;
          const mFacts = measureInfo([...facts, ...(showAll ? [{type: 'text', text: p.changedFact, weight: 500}] : [])], colW, F) || null;
          const mNotes = notes.length ? measureInfo(notes, colW, F) : {items: [], height: 0, gap: 0, w: colW};
          if ((facts.length && !mFacts) || !mNotes) continue;
          const guideFit = showAll ? fitG(p.comparisonLabels.guide, {maxWidth: D.w * 0.5, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
          if (showAll && !fitOk(guideFit)) continue;
          const mid = (guideFit ? cardH(guideFit, F) : 0) + 40 / px;
          // balance: key on the left; facts under it or beside the notes, whichever is lower
          const left = mKey.height, right = mNotes.height, fh = mFacts && mFacts.items.length ? mFacts.height + F * 0.5 : 0;
          const factsLeft = left <= right;
          const strip = Math.max(left + (factsLeft ? fh : 0), right + (factsLeft ? 0 : fh)) + 16 / px;
          const sh = (D.h - strip - mid - HH * 2) / 2;
          const bA = {x: 0, y: HH, w: sw, h: sh}, bB = {x: 0, y: HH + sh + mid + HH, w: sw, h: sh};
          const Rn = R => (numbered ? {...R, levels: R.levels.map((l, i) => ({name: String(i + 1)}))} : R);
          const common = {F, px, showKey, levelsMax, badgeLabels: true, minK: 0.35, minRatio: 0.4, minRisePx: 36};
          const gA = podiumGeometry(ctx, {...common, box: bA, R: Rn(RA), title: showKey ? p.labels.note : null, gutterFracs: numbered ? [0.14, 0.18] : undefined});
          if (!gA) continue;
          const gB = podiumGeometry(ctx, {...common, box: bB, R: Rn(RB), title: null, gutterFracs: [gA.gw / D.w]});
          if (!gB || Math.abs(gB.k - gA.k) > 1e-6) continue;
          tries.push({F, row: false, numbered, Rn, gA, gB, HH, hA, hB, sw, strip, mid, mKey, mFacts, mNotes, guideFit, colW, factsLeft});
        }
      }
    }
    let fallback = false;
    if (!tries.length) {
      fallback = true;
      const sw = row ? D.w / 2 - 20 : D.w;
      const sh = row ? D.h : D.h / 2 - 20;
      const Fm = 16.6 / px;
      const gA = podiumGeometry(ctx, {box: {x: 0, y: 0, w: sw, h: sh}, R: RA, F: Fm, px, showKey: false, levelsMax, minK: 0.3, minRatio: 0.35});
      const gB = podiumGeometry(ctx, {box: row ? {x: D.w - sw, y: 0, w: sw, h: sh} : {x: 0, y: D.h - sh, w: sw, h: sh}, R: RB, F: Fm, px, showKey: false, levelsMax, minK: 0.3, minRatio: 0.35});
      tries.push({F: Fm, row, gA, gB, HH: 0, fallback: true});
    }
    // baseline size first (>= 19.5 px), side by side when possible, full level names over numbered plates, then the largest text
    
    const big = t => (t.F * px >= 19.5 ? 1 : 0);
    tries.sort((a, b) => big(b) - big(a) || (b.row ? 1 : 0) - (a.row ? 1 : 0) || (a.numbered ? 1 : 0) - (b.numbered ? 1 : 0) || Math.min(b.gA.k, b.gB.k) - Math.min(a.gA.k, a.gB.k) || b.F - a.F);
    const L = tries[0];
    const F = L.F;
    const {gA, gB} = L;
    const looks = (i, j) => lookFor(ctx, p, i, j);
    const sceneOpts = geo => (L.row && !L.fallback
      ? {plates: false, rule: false, lineX0: geo === gA ? gA.box.x + gA.box.w + L.gap : gB.box.x - L.gap, lineX1: geo === gA ? gA.box.x : gB.box.x + gB.box.w}
      : {});
    const RsA = L.Rn ? L.Rn(RA) : RA, RsB = L.Rn ? L.Rn(RB) : RB;
    const sA = podiumScene(ctx, gA, {prefix: 'A-', R: RsA, F, showKey, looks, bands: true, badgeLabels: true, ...sceneOpts(gA)});
    const sB = podiumScene(ctx, gB, {prefix: 'B-', R: RsB, F, showKey, looks, bands: true, badgeLabels: true, ...sceneOpts(gB)});

    // headers
    const heads = [];
    if (!L.fallback) {
      if (L.row) {
        heads.push(drawHeader(ctx, L.hA, gA.box.x, 0, colors[0], 'A', 'hdrA', showKey, showAll));
        heads.push(drawHeader(ctx, L.hB, gB.box.x, 0, colors[1], 'B', 'hdrB', showKey, showAll));
      } else {
        const fx = gA.cols[fi].cx;
        const right = fx < D.w / 2;
        const hx = m => (right ? D.w - m.w : 0);
        heads.push(drawHeader(ctx, L.hA, hx(L.hA), 0, colors[0], 'A', 'hdrA', showKey, showAll));
        heads.push(drawHeader(ctx, L.hB, hx(L.hB), gB.box.y - L.HH, colors[1], 'B', 'hdrB', showKey, showAll));
      }
    }
    // shared ruler (row): title + plates in the centre column
    const centre = [];
    let centreRule = null;
    if (L.row && !L.fallback) {
      const cx0 = gA.box.x + gA.box.w + L.gap, cx1 = cx0 + L.cw;
      const mx = (cx0 + cx1) / 2;
      centreRule = h('path', {name: 'c-rule', d: `M${r(mx)} ${r(gA.G)}V${r(gA.lineY(base.N) - 14)}`, stroke: '#5d6873', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0});
      if (showKey) {
        base.levels.forEach((l, i) => {
          const f = L.plateFits[i];
          if (L.numbered) {
            const rr = F * 0.78;
            centre.push(g({name: `c-plate${i}`}, h('circle', {cx: r(mx), cy: r(gA.lineY(i + 1)), r: r(rr), fill: th.card, stroke: '#5d6873', 'stroke-width': 2.5}), textAt(f, mx, gA.lineY(i + 1) - f.size * 0.5, th.ink, {anchor: 'middle'})));
          } else centre.push(labelCard(ctx, f, {x: mx, y: gA.lineY(i + 1) - cardH(f, F) / 2, anchor: 'middle', size: F, fill: th.card, stroke: '#5d6873', name: `c-plate${i}`}).node);
        });
        const tf = L.titleFit;
        centre.push(g({name: 'c-title', opacity: 0}, textAt(tf, mx, gA.lineY(base.N) - L.plateH / 2 - 10 / px - tf.height, th.fg, {anchor: 'middle'})));
      }
    }
    // focus: target outline (where the scenario places it) and guide outline
    const focusGeo = (geo, lv) => {
      const col = geo.cols[fi];
      const top = geo.lineY(lv);
      return {x: col.cx - geo.bw / 2, y: top - 3 - geo.bh, w: geo.bw, h: geo.bh + 3, col, top};
    };
    const tA = focusGeo(gA, lvA), tB = focusGeo(gB, lvB);
    const target = (t, color, name) => g({name, opacity: 0},
      h('path', {d: roundRectPath(t.x - 4, t.y - 4, t.w + 8, t.h + 8, 8), fill: color, 'fill-opacity': 0.1, stroke: color, 'stroke-width': 4, 'stroke-dasharray': '12 8'}));
    const targets = [target(tA, colors[0], 'tgtA'), target(tB, colors[1], 'tgtB')];
    const outline = (geo, t, name) => {
      const x0 = t.col.x - 5, x1 = t.col.x + t.col.w + 5;
      return g({name, opacity: 0}, h('path', {d: roundRectPath(x0, t.y - 10, x1 - x0, geo.G + 5 - (t.y - 10), 12), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '14 9'}));
    };
    const outlines = [outline(gA, tA, 'gdA'), outline(gB, tB, 'gdB')];
    // guide bracket + chip + changed fact, and strip texts
    const guide = [];
    const strip = [];
    const early = [];
    if (!L.fallback) {
      if (L.row) {
        const yb = gA.G + 5 + L.bracket;
        const mx = gA.box.x + gA.box.w + L.gap + L.cw / 2;
        const ax = tA.col.cx, bx = tB.col.cx;
        if (L.guideFit) {
          const c = labelCard(ctx, L.guideFit, {x: mx, y: yb + 10 / px, anchor: 'middle', size: F, fill: th.card, stroke: th.accent, strokeWidth: 3, name: 'guide-card'});
          guide.push(c.node);
        }
        guide.push(h('path', {name: 'guide-lead', d: `M${r(ax)} ${r(gA.G + 5)}V${r(yb)}H${r(bx)}V${r(gB.G + 5)}M${r(mx)} ${r(yb)}V${r(yb + 10 / px)}`, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': '10 7'}));
        const y0 = gA.G + 5;
        let gi = 0;
        L.cols3.forEach((c3, ci) => {
          const x = ci === 0 ? 0 : ci === 1 ? D.w / 2 - L.colW / 2 : D.w - L.colW;
          for (const it of c3.gs) (it.early ? early : strip).push(...drawInfo(ctx, it.gr, x, y0 + it.y, F, `s${gi++}-`).nodes.map(n => n.node));
        });
      } else {
        const ax = tA.col.cx;
        const y0 = gA.G + 5;
        const y1 = tB.y - 12;
        const chipY = y0 + 20 / px;
        let cbox = {x: ax, y: chipY, w: 0, h: 0};
        if (L.guideFit) {
          const cxc = Math.max(L.guideFit.width / 2 + F, Math.min(D.w - L.guideFit.width / 2 - F, ax));
          const c = labelCard(ctx, L.guideFit, {x: cxc, y: chipY, anchor: 'middle', size: F, fill: th.card, stroke: th.accent, strokeWidth: 3, name: 'guide-card'});
          guide.push(c.node);
          cbox = c.box;
        }
        // the guide detours around header B when the header spans the focus column
        const hb = L.hB && showKey ? {x: (fx => (fx < D.w / 2 ? D.w - L.hB.w : 0))(ax), y: gB.box.y - L.HH, w: L.hB.w, h: L.HH} : null;
        let down = `M${r(ax)} ${r(cbox.y + cbox.h)}V${r(y1)}`;
        if (hb && ax > hb.x - 12 && ax < hb.x + hb.w + 12) {
          const xa = hb.x - 18 > 12 ? hb.x - 18 : hb.x + hb.w + 18;
          down = `M${r(ax)} ${r(cbox.y + cbox.h)}V${r(Math.max(cbox.y + cbox.h + 4, hb.y - 14))}H${r(xa)}V${r(hb.y + hb.h + 10)}H${r(ax)}V${r(y1)}`;
        }
        guide.push(h('path', {name: 'guide-lead', d: `M${r(ax)} ${r(y0)}V${r(cbox.y)}${down}`, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': '10 7'}));
        const sy = D.h - L.strip + 16 / px;
        if (L.mKey.items.length) early.push(...drawInfo(ctx, L.mKey, 0, sy, F, 'sk-').nodes.map(n => n.node));
        if (L.mFacts && L.mFacts.items.length) strip.push(...drawInfo(ctx, L.mFacts, L.factsLeft ? 0 : D.w - L.colW, sy + (L.factsLeft ? (L.mKey.items.length ? L.mKey.height + F * 0.5 : 0) : L.mNotes.height + F * 0.5), F, 's0-').nodes.map(n => n.node));
        if (L.mNotes.items.length) strip.push(...drawInfo(ctx, L.mNotes, D.w - L.colW, sy, F, 's1-').nodes.map(n => n.node));
      }
    }
    if (!L.row && !L.fallback && gA.titleFit) {
      const tf = gA.titleFit;
      centre.push(g({name: 'c-title', opacity: 0}, textAt(tf, gA.box.x, gA.titleY, th.fg)));
    }
    const panelShare = L.row ? gA.box.w / D.w : gA.box.w / D.w;
    return {F, px, base, fi, lvA, lvB, RA, RB, gA, gB, sA, sB, heads, centre, centreRule, targets, outlines, guide, strip, early, row: L.row, fallback, panelShare, tA, tB};
  },
  build(ctx, L) {
    return g(null,
      g({name: 'A-panel'}, L.sA.node),
      g({name: 'B-panel'}, L.sB.node),
      L.centreRule,
      g({name: 'centre'}, L.centre),
      L.targets,
      L.outlines,
      L.heads.map(hd => [hd.badge, hd.text]),
      g({name: 'guide', opacity: 0}, L.guide),
      g({name: 'strip', opacity: 0}, L.strip),
      g({name: 'strip-early'}, L.early),
    );
  },
  frame(ctx, L, u) {
    const {base, fi, RA, RB} = L;
    const lvOf = (R) => R.bodies.map(b => levelAt(u, b.level, base.N, ctx.reduced));
    const levA = lvOf(RA), levB = lvOf(RB);
    const rulerP = seg(u, ...W.ruler);
    const nL = base.links.length;
    const linkP = base.links.map((l, i) => seg(u, W.links[0] + (i * (W.links[1] - W.links[0])) / Math.max(1, nL), W.links[0] + ((i + 1) * (W.links[1] - W.links[0])) / Math.max(1, nL)));
    const fA = L.sA.frame(levA, {ruler: rulerP, links: linkP, scaffold: 1});
    const fB = L.sB.frame(levB, {ruler: rulerP, links: linkP, scaffold: 1});
    const nodes = {...fA.nodes, ...fB.nodes};
    const markerP = seg(u, ...W.marker);
    // the target outline fades once the building stands in it
    const arrive = seg(u, W.rise[1] - 0.03, W.rise[1] + 0.01);
    nodes.tgtA = {opacity: r(markerP * (1 - arrive), 3)};
    nodes.tgtB = {opacity: r(markerP * (1 - arrive), 3)};
    const headerP = seg(u, ...W.header);
    L.heads.forEach((hd, i) => { if (hd.text) nodes[`hdr${i ? 'B' : 'A'}-text`] = {opacity: r(headerP, 3)}; });
    const guideP = seg(u, ...W.guide);
    nodes.gdA = {opacity: r(guideP, 3)};
    nodes.gdB = {opacity: r(guideP, 3)};
    nodes.guide = {opacity: r(guideP, 3)};
    const noteP = seg(u, ...W.notes);
    nodes.strip = {opacity: r(noteP, 3)};
    // the shared ruler (names or numbers keyed from the start) is part of the scaffold, identical in A and B
    if (L.centreRule) nodes['c-rule'] = {opacity: 1};
    if (L.centre.length) {
      if (L.row) base.levels.forEach((l, i) => { nodes[`c-plate${i}`] = {opacity: 1}; });
      nodes['c-title'] = {opacity: 1};
    }
    const rel = (paths, geo) => paths.map(q => q.pts.map(z => `${r(z.x - geo.box.x, 1)},${r(z.y - geo.box.y, 1)}`).join(' '));
    const look = (lev, t, links) => ({
      levels: lev.map((v, i) => (i === fi ? null : r(v, 3))),
      focus: r(lev[fi], 3),
      target: r(markerP * (1 - arrive), 3),
      targetLevel: markerP > 0 ? t : null,
      header: r(headerP, 3),
      outline: r(guideP, 3),
      links,
    });
    const lookA = look(levA, L.lvA, rel(fA.paths, L.gA));
    const lookB = look(levB, L.lvB, rel(fB.paths, L.gB));
    // before the change beat both scenes show exactly the same state
    const semantic = {
      scenes: 2,
      lookA, lookB,
      A: {levels: levA.map(v => r(v, 3)), roofs: fA.roofs.map(R2)},
      B: {levels: levB.map(v => r(v, 3)), roofs: fB.roofs.map(R2)},
      focusBody: fi,
      levelA: L.lvA, levelB: L.lvB,
      marker: r(markerP, 3),
      header: r(headerP, 3),
      guideShown: r(guideP, 3),
      noteShown: r(noteP, 3),
      linksDrawn: linkP.map(v => r(v, 3)),
      linkKinds: base.links.map(l => l.kind),
      row: L.row,
      fallback: L.fallback,
      panelShare: r(L.panelShare, 3),
      textPx: r(L.F * L.px, 1),
      kA: r(L.gA.k, 3), kB: r(L.gB.k, 3),
      allReached: true,
    };
    fA.roofs.forEach((q, i) => { semantic[`Aroof${i}`] = R2(q); });
    fB.roofs.forEach((q, i) => { semantic[`Broof${i}`] = R2(q); });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-02-contrast',
    title: 'Editable hierarchy — the same scene with one body placed on two supplied levels',
    titleEs: 'Jerarquía judicial editable — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Jerarquía judicial editable',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical podium scenes of generic fictional buildings. The only supplied difference is the level at which the configuration places one body: the origin level in A, the configured review level in B. The podiums rise in parallel; the focus body, its links and their lanes differ, and a guide joins the two placements. No winner, no outcome, and no claim that any review happens.',
    tags: ['hierarchy', 'contrast', 'origin level', 'configured review level', 'generic buildings', 'podium', 'room plan', 'links', 'as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/jerarquia-editable.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HIER_STRINGS,
  scene,
});

