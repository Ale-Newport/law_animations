/**
 * LAW-0167 — Consulta entre profesionales · contrast
 *
 * Storyboard — two complete consultation tables run on one clock (brief beats).
 * Everything the two scenes share is drawn ONCE in a compact strip under the pair
 * (one short item per row, balanced columns): document, passages, both people
 * (colour swatch = flag colour), the other professional's note, shared facts, the
 * marks and the neutral note. On the two pages the clause refs are real text at
 * their rows (the passage text is in the strip). The acting scenes stay large
 * (≥ 40 % of the width side by side, full width when stacked). The changing
 * professional's bubble sits above the scene or beside it — it never covers a
 * head, a face or a page. The layout is the same with labels shown or hidden.
 *  [0.00–0.17] base: both scenes are identical — the same two professionals at
 *              the same table and page; the professional who does NOT change
 *              picks a flag from the pad and presses it on the shared passage,
 *              identically in A and B.
 *  [0.17–0.40] change: the scenario labels appear; only the changing
 *              professional's bubble opens, with the supplied note of each
 *              scenario (A: the coinciding note; B: the open question), and a
 *              dashed outline marks where that flag will go (A: level with the
 *              other flag; B: on another passage).
 *  [0.40–0.77] parallel: the same hand picks the same flag in both scenes and
 *              presses it — A: level with the other flag, and the highlighter
 *              band grows from both flags until the halves meet (same point
 *              noted); B: on the other passage, it gets an open ring and a
 *              dashed empty outline appears opposite (open question). Only the
 *              flag's target row, and so the arm path and the marks, differ.
 *  [0.77–1.00] guide: lettered rings mark the one differing flag in each scene
 *              and a guide row joins badge A and badge B through the
 *              changed-fact label, with a neutral note. Complete by u = 0.90.
 * No winner, score or legal consequence; both states are supplied.
 * @module animations/roles/LAW-0167
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {clamp, r, seg} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  consultFields, CONSULT_DEFAULTS, sideSpan, KIT_STRINGS, resolvePoints, roleOf, pxUnit, fitWords, wchip,
  docLayout, stageGeometry, consultStage, placementScript, fitBubble, noteBubble, emptySlot, glyphSame, glyphOpen,
} from './kits/consulta-entre-profesionales.js';

const ID = 'LAW-0167';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  plate: [0, 0.06], other: [0.02, 0.155], labels: [0.17, 0.23],
  bubbleOpen: [0.19, 0.25], bubbleRow: [0.23, 0.31], target: [0.27, 0.35], targetOut: [0.6, 0.64],
  changer: [0.42, 0.64], band: [0.65, 0.73], ring: [0.65, 0.71], slot: [0.67, 0.75],
  rings: [0.77, 0.81], guide: [0.79, 0.85], neutral: [0.84, 0.9],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, sharedAB: 'Same in A and B', people: 'People', document: 'Document', facts: 'Shared facts'},
  es: {...KIT_STRINGS.es, sharedAB: 'Igual en A y B', people: 'Personas', document: 'Documento', facts: 'Hechos comunes'},
};

const sceneSchema = {
  ...consultFields,
  ...contrastFields(),
};
sceneSchema.changedFact = {...sceneSchema.changedFact, description: 'The single fact that differs: where the flag of the professional who raises the open question (props.open.by) goes — level with the other flag on the shared passage (A) or alone on the open passage (B)'};

const defaultParams = {
  ...CONSULT_DEFAULTS,
  scenarioA: {label: 'Matching reading', caption: 'B’s flag goes level with A’s on Cl. 2'},
  scenarioB: {label: 'Open question', caption: 'B’s flag goes alone on Cl. 3'},
  changedFact: 'Where B places the flag: beside A’s, or alone on another clause',
  sharedFacts: ['Same draft and clauses', 'Same two professionals', 'A’s flag on Cl. 2 in both'],
  comparisonLabels: {guide: 'Only this flag differs', neutral: 'Both states are supplied with the example; neither reading is shown to be right.'},
};

/**
 * Shared strip, drawn once for A and B: a compact list — one short item per row (document,
 * each passage, each person, the other professional's note, each shared fact, the marks, the
 * key and the neutral note), packed into balanced columns. Largest size (size → minSize) that
 * fits maxH; nothing is dropped or cut.
 */
function sharedStrip(ctx, {name, w, maxH, size, minSize, cols, items}) {
  const th = ctx.theme;
  minSize = Math.min(minSize, size);
  let best = null;
  // column widths: equal, or weighted toward the columns whose items wrap (the order of the items is
  // kept); the lowest strip wins, equal widths on a tie
  const weightSets = [];
  {
    const W = [1, 0.8, 1.25, 1.5];
    const rec = (acc) => { if (acc.length === cols) { weightSets.push(acc); return; } for (const x of W) rec([...acc, x]); };
    rec([]);
  }
  for (let sz = size; sz >= minSize - 1e-6; sz -= Math.max(0.5, size * 0.04)) {
    const pad = sz * 0.6, gapC = sz * 1.1;
    const avail = w - pad * 2 - gapC * (cols - 1);
    const cache = new Map();
    const blockAt = (it, colW) => {
      const key = `${items.indexOf(it)}@${Math.round(colW)}`;
      if (!cache.has(key)) {
        const ind = it.glyph ? sz * 4.6 : it.swatch ? sz * 1.8 : 0;
        const f = fitWords(it.text, {maxWidth: colW - ind, size: sz, minSize: sz, maxLines: 4, weight: it.weight ?? 500});
        cache.set(key, {it, f, ind, h: f.height + sz * 0.38, cut: f.truncated});
      }
      return cache.get(key);
    };
    const pack = (H, widths) => {
      const out = [];
      let col = [], hh = 0;
      for (const it of items) {
        let bl = blockAt(it, widths[out.length] ?? widths[cols - 1]);
        if (col.length && hh + bl.h > H) { out.push(col); col = []; hh = 0; bl = blockAt(it, widths[out.length] ?? widths[cols - 1]); }
        col.push(bl);
        hh += bl.h;
      }
      if (col.length) out.push(col);
      return out;
    };
    let pick = null;
    for (const ws of weightSets) {
      const tot = ws.reduce((a2, x) => a2 + x, 0);
      const widths = ws.map(x => (avail * x) / tot);
      let lo = 0, hi = items.reduce((a2, it) => a2 + blockAt(it, Math.min(...widths)).h, 0) + 1;
      if (pack(hi, widths).length > cols) continue;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (pack(mid, widths).length <= cols) hi = mid; else lo = mid; }
      const columns = pack(hi, widths);
      const colH = Math.max(...columns.map(c => c.reduce((a2, x) => a2 + x.h, 0)));
      const cut = columns.some(c => c.some(x => x.cut));
      if (!pick || (cut ? 1 : 0) < (pick.cut ? 1 : 0) || ((cut ? 1 : 0) === (pick.cut ? 1 : 0) && colH < pick.colH - 0.5)) pick = {widths, columns, colH, cut};
    }
    const hh = pad * 2 + pick.colH - sz * 0.38;
    best = {sz, pad, gapC, widths: pick.widths, columns: pick.columns, h: hh, cut: pick.cut, ok: !pick.cut && hh <= maxH};
    if (best.ok) break;
  }
  const {sz, pad, gapC, widths, columns} = best;
  const parts = [h('path', {d: roundRectPath(0, 0, w, best.h, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2})];
  columns.forEach((col, ci) => {
    const x = pad + widths.slice(0, ci).reduce((a2, cw) => a2 + cw + gapC, 0);
    let y = pad;
    for (const bl of col) {
      const it = bl.it;
      const cy = y + sz * 0.55;
      if (it.glyph === 'same') parts.push(glyphSame(ctx, {x: x + sz * 2.1, y: cy, sz, colors: it.colors}));
      else if (it.glyph === 'open') parts.push(glyphOpen(ctx, {x: x + sz * 2.1, y: cy, sz, color: it.color}));
      else if (it.swatch) parts.push(h('path', {d: roundRectPath(x, cy - sz * 0.4, sz * 1.3, sz * 0.8, sz * 0.2), fill: it.swatch, stroke: th.ink, 'stroke-width': 1.8}));
      parts.push(textBlock(bl.f, {x: x + bl.ind, y, fill: it.color2 ?? th.ink}));
      y += bl.h;
    }
  });
  return {node: g({name}, parts), h: best.h, ok: best.ok, cut: best.cut, size: sz};
}

/**
 * One composition: 'row' (scenes side by side, plate under them), 'column' (stacked, plate under)
 * or 'side' (square frames: scenes stacked on the left, the plate as a tall column on the right).
 */
function compose(ctx, arrangement, floorPx, plateFloorPx = floorPx, tight = false) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const U = pxUnit(ctx);
    const shape = ctx.view.shape;
    const pts = resolvePoints(p.props);
    const changer = pts.by;
    const other = changer === 'a' ? 'b' : 'a';
    const ci = changer === 'a' ? 0 : 1, oi = 1 - ci;
    // tight: every text starts at its floor (no larger preferred size), so the scenes keep the 19.6 px
    // floor where the preferred 21 px would not fit (long translations in the square frame)
    const S = tight ? U(floorPx) : U(floorPx > 17 ? 21 : 17.4), Smin = U(floorPx);
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const problems = [];
    const cap = i => {
      const id = i === 0 ? 'a' : 'b';
      const role = roleOf(p, id);
      return role ? `${p.actors[i].name} · ${role}` : p.actors[i].name;
    };

    // --- shared plate (drawn once)
    const d = p.props.document;
    // colours from the same seeded looks the stages use (flag colour = outfit)
    const colorOf = id => actorLook(ctx, p.actors[id === 'a' ? 0 : 1], id === 'a' ? 0 : 1).outfit;
    const otherNote = other === 'a' ? p.props.same.noteA : p.props.same.noteB;
    const oi2 = other === 'a' ? 0 : 1;
    const items = [
      {text: `${t.sharedAB}`, weight: 800},
      {text: `${d.reference} · ${d.title}`, weight: 700},
      ...d.passages.map(q => ({text: `${q.ref}  ${q.text}`})),
      {text: cap(0), swatch: colorOf('a')},
      {text: cap(1), swatch: colorOf('b')},
      {text: `“${otherNote}”`, swatch: colorOf(other), weight: 600},
      ...p.sharedFacts.map(f => ({text: `· ${f}`})),
      {text: `${t.samePoint} · ${t.asSupplied}`, glyph: 'same', colors: [colorOf('a'), colorOf('b')]},
      {text: `${t.openQuestion} · ${t.asSupplied}`, glyph: 'open', color: colorOf(changer)},
      {text: t.noConclusion, color2: th.inkSoft},
      {text: p.comparisonLabels.neutral, color2: th.inkSoft},
    ];
    const areaW = D.w - 16;
    const plateW = D.w - 16;
    let plate = null;
    {
      // the shorter of two column counts (never with cut text)
      const baseCols = shape === 'landscape' ? 5 : shape === 'square' ? 3 : 2;
      const opts2 = [baseCols, baseCols + 1].map(c => sharedStrip(ctx, {name: 'plate', w: plateW, maxH: D.h * (shape === 'landscape' ? 0.22 : 0.3), size: Math.min(S, U(plateFloorPx > 17 ? 21 : 18.5)), minSize: U(plateFloorPx), cols: c, items}));
      plate = opts2.filter(x => !x.cut).sort((x, y) => x.h - y.h)[0] || opts2[0];
      // the strip height is a preference (the scenes take what is left); cut text is a defect
      if (plate.cut) problems.push('plate-cut');
    }
    // labels hidden: the strip, guide row and header texts are not drawn, so they take no height and
    // the same solver gives the scenes the whole box (larger figures, same arrangement)
    const keyShown = showKey;
    // labels hidden, scenes side by side (square and landscape frames): a close-up of each scene (the chair backs may be cropped at the
    // panel edge; heads, backs and hands stay inside), set on a wall panel that fills the height, with
    // the bubble just above the heads
    const closeUp = !keyShown && arrangement === 'row';
    const cropOf = k => (closeUp ? 2 * (36 * k + 6) : 0);
    const plateH = plate && keyShown ? plate.h : 0;
    const side = false;

    // --- guide row + neutral note (under the scenes, above the plate)
    const guideText = `${p.comparisonLabels.guide}: ${p.changedFact}`;
    const badgeR = S * 0.95;
    const guideMax = Math.min(areaW - badgeR * 6 - 40, 1100);
    const guideChip = wchip(ctx, guideText, {x: 8 + areaW / 2, y: 0, anchor: 'middle', maxWidth: guideMax, size: S, minSize: Smin, maxLines: side ? 5 : 3, fill: th.accentSoft, stroke: th.accent, weight: 600});
    const neutralChip = null; // the neutral note is printed in the shared plate (legend column)
    const guideH = !keyShown ? 0 : (guideChip ? guideChip.box.h + (tight ? 8 : 12) : 0) + (neutralChip ? neutralChip.box.h + 10 : 0);

    // --- panels (header height from the fitted scenario labels, up to two lines each)
    const panelW0 = arrangement === 'row' ? (D.w - 16 - 36) / 2 : areaW;
    const capGap = tight ? S * 0.22 : S * 0.4;
    const hdrFit = sco => {
      const lw = panelW0 - S * 0.95 * 2 - 20;
      const lf = fitWords(sco.label, {maxWidth: lw, size: S * 1.05, minSize: Smin, maxLines: 2, weight: 700});
      const cf = sco.caption ? fitWords(sco.caption, {maxWidth: lw, size: S, minSize: Smin, maxLines: 2, weight: 500}) : null;
      return {lf, cf, h: lf.height + (cf ? cf.height + capGap : 0) + (tight ? 4 : 8)};
    };
    const hdrFits = [hdrFit(p.scenarioA), hdrFit(p.scenarioB)];
    const headerH = keyShown ? Math.max(S * 2.1, ...hdrFits.map(x => x.h)) : S * 2.1;
    const gap = closeUp ? 16 : keyShown ? 36 : 64;
    const areaY = 8, areaH = D.h - 8 - (plateH ? plateH + 10 : 0) - guideH - 8;
    const panels = arrangement === 'row'
      ? [0, 1].map(i => ({x: 8 + i * ((D.w - 16 + gap) / 2), y: areaY, w: (D.w - 16 - gap) / 2, h: areaH}))
      : [0, 1].map(i => ({x: 8, y: areaY + i * ((areaH + gap) / 2), w: areaW, h: (areaH - gap) / 2}));

    // --- the changing professional's bubble per scene (sized once, shared geometry)
    const noteOf = key => (key === 'A' ? (changer === 'a' ? p.props.same.noteA : p.props.same.noteB) : p.props.open.note);
    const P0 = panels[0];
    // Stage proportions (rig units × k), a low stand so the scene is wider than tall: stage width =
    // page + 2·(172k + 16s + 6); height ≈ 402k + 10 (one-line page header ≈ 82k + passage rows from
    // 170k above the hips down to the table, 150k below the hips).
    const sideW = k => 2 * (sideSpan(k, k / 1.2) + 6);
    const Sb = S;
    const fitB = (maxW, maxH) => ['A', 'B'].map(key => fitBubble(ctx, [{text: noteOf(key)}], {maxW, maxH, size: Sb, minSize: Smin, maxLines: 4}));
    // Stage size for a rig scale k: the page stands on the low table, its clause refs are real text
    // (bottom-aligned rows, flagged rows within reach), the header above them; heads at 212k.
    const refSz = U(floorPx > 17 ? 20 : 16.8);
    const dims = (k, tallHdr = 0) => {
      const docW = Math.max(60, arrangement === 'column' ? P0.w - sideW(k) - 8 : Math.min(420 * k, P0.w + (closeUp ? cropOf(k) - 4 : 0) - sideW(k)));
      const dl = docLayout(ctx, {w: docW, s: k / 1.2, size: refSz, minSize: refSz, reference: d.reference, title: d.title, passages: d.passages, rowsH: 5000, mode: 'refs', titleLines: 1, spread: false, minDocH: tallHdr ? 5000 + tallHdr : 0});
      const C = dl.rowsUsed + dl.headerH + 12 * k;
      const top = Math.max(C, 212 * k);
      // the highest flagged row must stay within reach (≤ 226k above the hip)
      const reach = [pts.same, pts.open].every(row => dl.rowsUsed - dl.rows[row].anchor <= 226 * k);
      const minDocW = dl.chipW + 2 * dl.marg + refSz;
      // hB: the height a bubble above the scene must clear (the drawn hair rises ~14k above the rig's head top)
      return {docW, dl, top, h: top + 150 * k + 12, hB: Math.max(C, 226 * k) + 150 * k + 12, w: docW + sideW(k), ok: dl.fits && reach && docW >= minDocW};
    };
    // Bubble modes (largest figures win): 'top' = above the whole scene; 'beside' = in the free strip
    // beside the scene on the changing professional's side. A bubble never covers a head, a face or the page.
    const cands = [];
    for (const mode of ['top', 'beside']) {
      for (let k1 = 1.4; k1 >= 0.3; k1 -= 0.02) {
        const dm = dims(k1);
        if (!dm.ok || dm.w - cropOf(k1) > P0.w - 4) continue;
        let f;
        if (mode === 'top') {
          f = fitB(P0.w * (closeUp ? 0.62 : arrangement === 'row' ? 0.98 : 0.6), P0.h * 0.3);
          const bh = Math.max(...f.map(x => x.h));
          if (!f.every(x => x.ok) || headerH + (tight ? 4 : 6) + bh + (tight ? 8 : 16) + dm.hB > P0.h) continue;
        } else {
          const regW = P0.w - dm.w - 16;
          if (regW < S * 8) continue;
          f = fitB(regW, P0.h - headerH - 10 - (212 * k1 + 150 * k1 + 12) * 0.35);
          if (!f.every(x => x.ok) || headerH + 10 + dm.h > P0.h) continue;
        }
        cands.push({mode, k: k1, f, dm});
        break;
      }
    }
    if (!cands.length) {
      const dd = k0 => { const dm = dims(k0); return `k${k0}:docW${Math.round(dm.docW)} fits${dm.dl.fits} rows${Math.round(dm.dl.rowsUsed)} hdr${Math.round(dm.dl.headerH)} h${Math.round(dm.h)} w${Math.round(dm.w)} ok${dm.ok}`; };
      problems.push(`stage[P${Math.round(P0.w)}x${Math.round(P0.h)} head${Math.round(headerH)} ${dd(0.9)} ${dd(0.7)} ${dd(0.5)}]`);
      const kk = 0.4, dm = dims(kk);
      cands.push({mode: 'top', k: kk, f: fitB(P0.w * 0.6, P0.h * 0.3), dm});
    }
    cands.sort((x, y) => y.k - x.k);
    const pick = cands[0];
    const mode = pick.mode;
    const k = pick.k;
    const bubFits = pick.f;
    bubFits.forEach(f => { if (!f.ok) problems.push('bubble'); });
    const bubH = Math.max(...bubFits.map(f => f.h));
    // close-up: a taller page on its stand takes the height left over (at most +90 units, so the bubble
    // above it stays just over the heads)
    if (closeUp) {
      const extra = Math.min(90, P0.h - headerH - 12 - (bubH + 12 + pick.dm.hB) - 16);
      if (extra > 8) { const dm2 = dims(k, pick.dm.dl.headerH + extra); if (dm2.ok) pick.dm = dm2; }
    }
    const s = k / 1.2;
    const docW = pick.dm.docW;
    const stageW = () => pick.dm.w;
    // close-up: bubble + scene centred together under the header badge (short tails, no empty band)
    const hipY = P0.h - (closeUp ? 18 : 10) - 150 * k;
    // close-up: the bubble sits just above the scene (short tail)
    const blockTop = closeUp ? hipY - (pick.dm.hB - 150 * k - 12) - 12 - bubH : 0;
    // 'beside': the scene moves away from the changing professional's side; the bubble takes the strip
    const shift = mode === 'beside' ? (changer === 'b' ? -1 : 1) * (P0.w - stageW()) / 2 + (changer === 'b' ? 4 : -4) : 0;
    const makeStage = (key, i) => {
      const P = panels[i];
      const G = stageGeometry({cx: P.x + P.w / 2 + shift, docW, hipY: P.y + hipY, k, s});
      const doc = pick.dm.dl;
      G.rowsTop = G.rowsBottom - doc.rowsUsed; // rows bottom-aligned on the page, header above
      const row = key === 'A' ? pts.same : pts.open;
      const flags = [
        {id: 'other', who: other, row: pts.same},
        {id: 'chg', who: changer, row, ring: key === 'B'},
      ];
      const stage = consultStage(ctx, {prefix: key, G, actors: p.actors, doc, document: d, flags, bandRow: key === 'A' ? pts.same : null, slot: key === 'B' ? {row: pts.open, side: other} : null, showText: false, showRefs: showKey});
      // where the flag will go (dashed outline on the changing professional's margin), shown in the change beat
      const tq = G.grip(changer, stage.rowY(row));
      const target = g({transform: `${T(tq.x, tq.y)} scale(${changer === 'a' ? 1 : -1} 1)`}, emptySlot(ctx, {name: `${key}-target`, s, color: th.accent}));
      const script = placementScript(stage, [
        {flag: 'other', who: other, row: pts.same, w: W.other},
        {flag: 'chg', who: changer, row, w: W.changer},
      ], key === 'A' ? {band: W.band} : {ring: W.ring, slot: W.slot});
      // bubble over the changing professional's head
      const f = bubFits[i];
      const head = G.head(changer);
      let box;
      if (mode === 'beside') {
        const bx = changer === 'b' ? P.x + P.w - 4 - f.w : P.x + 4;
        box = {x: bx, y: Math.max(P.y + headerH + 4, Math.min(G.headTop - 24 * k - f.h, P.y + headerH + 4 + (bubH - f.h))), w: f.w, h: f.h};
      } else {
        // above the scene, over the changing professional's head (the tail drops straight to it)
        const bx = clamp(head.x - (changer === 'a' ? f.w * 0.25 : f.w * 0.75), P.x + 4, P.x + P.w - 4 - f.w);
        box = {x: bx, y: P.y + (closeUp ? blockTop : headerH + 4) + (bubH - f.h), w: f.w, h: f.h};
      }
      const sceneTop = Math.min(stage.docTop, G.headTop - 14 * k);
      const overPage = box.x < G.x1 && box.x + box.w > G.x0 && box.y + box.h > stage.docTop - 4;
      if (overPage || (mode === 'top' && box.y + box.h > sceneTop - 6)) problems.push('bubble-covers');
      if (box.y < P.y + headerH - 1) problems.push('bubble-top');
      const bub = noteBubble(ctx, {name: `${key}-bub`, box, tail: {x: head.x + (changer === 'a' ? 12 : -12) * k, y: G.headTop - 30 * k}, fit: f, rows: [{color: stage.color(changer), ring: key === 'B'}], show: showKey, stroke: stage.color(changer)});
      // guide ring: a rounded rectangle around the one differing flag with clearance on every side,
      // and its lettered badge on the first spot clear of every flag, hand and face (hold pose)
      const ringLetter = U(20.5); // letters ≥ 20 px
      const pad = Math.max(8, 9 * s);
      const dir = changer === 'a' ? 1 : -1;
      const fx0 = dir > 0 ? tq.x - 35 * s : tq.x - 46 * s, fx1 = dir > 0 ? tq.x + 46 * s : tq.x + 35 * s;
      const ring = {x: fx0 - pad, y: tq.y - 13 * s - pad, w: fx1 - fx0 + 2 * pad, h: 26 * s + 2 * pad + 4 * s};
      const hold = stage.pose(script(1));
      const bR = ringLetter * 0.8;
      const flagBoxOf = (who, rowIdx) => { const q = G.grip(who, stage.rowY(rowIdx)); return who === 'a' ? {x: q.x - 35 * s, y: q.y - 13 * s, w: 81 * s, h: 30 * s} : {x: q.x - 46 * s, y: q.y - 13 * s, w: 81 * s, h: 30 * s}; };
      const handBox = q => ({x: q.x - 18 * k, y: q.y - 18 * k, w: 36 * k, h: 36 * k});
      const blockers = [flagBoxOf(other, pts.same), flagBoxOf(changer, row),
        ...['a', 'b'].flatMap(id => [handBox(hold.hands[id]), handBox(hold.far[id])]),
        ...['a', 'b'].map(id => { const hd = G.head(id); return {x: hd.x - 48 * k, y: hd.y - 50 * k, w: 96 * k, h: 100 * k}; })];
      const cands = [
        {x: ring.x + ring.w / 2, y: ring.y - bR - 5}, {x: ring.x + ring.w / 2, y: ring.y + ring.h + bR + 5},
        {x: ring.x + (dir > 0 ? ring.w + bR + 5 : -bR - 5), y: ring.y + ring.h / 2},
        {x: ring.x + (dir > 0 ? -bR - 5 : ring.w + bR + 5), y: ring.y - bR - 5},
        {x: ring.x + (dir > 0 ? -bR - 5 : ring.w + bR + 5), y: ring.y + ring.h + bR + 5},
      ];
      const bb = c => ({x: c.x - bR, y: c.y - bR, w: 2 * bR, h: 2 * bR});
      const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      let bc = cands.find(c => !blockers.some(b => hit(bb(c), b)));
      if (!bc) { bc = cands[0]; problems.push('ring-badge'); }
      blockers.slice(2).forEach((b, bi) => { if (hit(ring, b)) problems.push(`ring${bi}`); });
      const ringNode = g({name: `${key}-ring`, opacity: 0},
        h('path', {name: `${key}-ringrect`, d: roundRectPath(ring.x, ring.y, ring.w, ring.h, Math.min(ring.h / 2, 16)), fill: 'none', stroke: th.accent, 'stroke-width': 4}),
        g({name: `${key}-ringbadge`},
          h('circle', {cx: r(bc.x), cy: r(bc.y), r: r(bR), fill: i === 0 ? th.accent2Soft : th.accent3Soft, stroke: th.ink, 'stroke-width': 2}),
          showKey ? h('text', {x: r(bc.x), y: r(bc.y + ringLetter * 0.36), 'text-anchor': 'middle', 'font-size': r(ringLetter), 'font-weight': 800, fill: th.ink, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif"}, key) : null));
      // close-up: the wall panel behind the scene (its edge crops the chair backs), from just above the bubble to the floor
      const wallY = Math.max(P.y, P.y + blockTop - 120); // same top for both scenes
      const wall = closeUp ? {x: P.x, y: wallY, w: P.w, h: G.floor + 14 - wallY, rail: G.headTop - 40 * k} : null;
      return {key, P, G, stage, script, bub, target, ringNode, tq, flagRow: row, wall};
    };
    const scenes = [makeStage('A', 0), makeStage('B', 1)];
    const sw = stageW(k) / D.w;
    if (arrangement === 'row' ? sw < 0.4 : sw < 0.9) problems.push('narrow');
    // stacked scenes: the figures stay large (the page is never a thin strip between tiny people)
    if (arrangement === 'column' && k < 0.62) problems.push('small-figures');
    const ext = sc => {
      const b = sc.bub.box, G = sc.G;
      return (Math.max(G.right, b.x + b.w) - Math.min(G.left, b.x)) / D.w;
    };
    const sceneExtent = Math.min(...scenes.map(ext));
    if (scenes[0].stage.docTop < P0.y + headerH + (mode === 'top' ? bubH + 6 : -2)) problems.push('stage-top');

    // --- scenario headers (letter badge + label + caption), lane colours
    const headers = scenes.map((sc, i) => {
      // close-up: the letter badge sits in the wall's top corner
      const P = sc.wall ? {...sc.P, y: sc.wall.y + 4} : sc.P;
      const sco = i === 0 ? p.scenarioA : p.scenarioB;
      const col = i === 0 ? th.accent2Soft : th.accent3Soft;
      const parts = [
        h('circle', {cx: r(P.x + badgeR + 2), cy: r(P.y + badgeR + 4), r: r(badgeR), fill: col, stroke: th.ink, 'stroke-width': 2.5}),
      ];
      if (showKey) {
        parts.push(h('text', {x: r(P.x + badgeR + 2), y: r(P.y + badgeR + 4 + badgeR * 0.42), 'text-anchor': 'middle', 'font-size': r(badgeR * 1.2), 'font-weight': 800, fill: th.ink, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif"}, sc.key));
        const {lf, cf} = hdrFits[i];
        if (lf.truncated || (cf && cf.truncated)) problems.push('header');
        parts.push(g({name: `hdr${i}-txt`, opacity: 0},
          textBlock(lf, {x: P.x + badgeR * 2 + 14, y: P.y + 2, fill: th.fg}),
          cf && showAll ? textBlock(cf, {x: P.x + badgeR * 2 + 14, y: P.y + 2 + lf.height + capGap, fill: th.fgSoft}) : null));
      }
      return g({name: `hdr${i}`}, parts);
    });

    // --- guide row: badge A — changed fact — badge B, and the neutral note
    const gy = areaY + areaH + 10;
    let guide = null;
    if (guideChip && showKey) {
      const gc = wchip(ctx, guideText, {x: 8 + areaW / 2, y: gy, anchor: 'middle', maxWidth: guideMax, size: guideChip.fit.size, minSize: guideChip.fit.size, maxLines: side ? 5 : 3, fill: th.accentSoft, stroke: th.accent, weight: 600, name: 'guide-chip'});
      if (gc.fit.truncated) problems.push('guide');
      const b = gc.box;
      const bxA = b.x - badgeR * 2.2, bxB = b.x + b.w + badgeR * 2.2;
      const cyG = b.y + b.h / 2;
      const badge = (x, key, fill) => g(null,
        h('circle', {cx: r(x), cy: r(cyG), r: r(badgeR), fill, stroke: th.ink, 'stroke-width': 2.5}),
        h('text', {x: r(x), y: r(cyG + badgeR * 0.42), 'text-anchor': 'middle', 'font-size': r(badgeR * 1.2), 'font-weight': 800, fill: th.ink, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif"}, key));
      guide = g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: `M${r(bxA + badgeR)} ${r(cyG)}H${r(b.x)}M${r(b.x + b.w)} ${r(cyG)}H${r(bxB - badgeR)}`, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
        badge(bxA, 'A', th.accent2Soft), badge(bxB, 'B', th.accent3Soft), gc.node);
    }
    const neutral = null;
    const plateY = side ? Math.max(8, (D.h - (plate ? plate.h : 0)) / 2) : D.h - 8 - plateH;
    const plateX = side ? areaW + 24 : 8;
    if (plate && side && plate.h > D.h - 16) problems.push('plate-side');

    return {badgeR, scenes, headers, plate: showKey ? plate : null, plateY, plateX, guide, neutral, arrangement, problems, labelsFit: problems.length === 0, changer, other, pts, floorPx: plateFloorPx < floorPx ? `${floorPx}/strip ${plateFloorPx}` : floorPx, stageW: stageW(k) / D.w, sceneExtent, panelW: P0.w / D.w, k, mode, dbg: `P${Math.round(P0.w)}x${Math.round(P0.h)} hdr${Math.round(headerH)} bub${Math.round(bubH)} plate${Math.round(plate ? plate.h : 0)} guide${Math.round(guideH)}`};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 920], portrait: [900, 1400]},
  layout(ctx) {
    const shape = ctx.view.shape;
    const tries = shape === 'portrait' ? ['column'] : ['row'];
    const pass = (floorPx, plateFloor, tight) => tries.map(a => compose(ctx, a, floorPx, plateFloor, tight)).sort((x, y) => (x.problems.length - y.problems.length) || (y.stageW - x.stageW));
    // 1) everything >= 19.6 px; 2) the scenes' text >= 19.6 px, only the shared strip may shrink
    // toward 16.6 px; 3) everything >= 16.6 px
    const full0 = pass(19.6, 19.6);
    const full = full0[0].labelsFit ? full0 : pass(19.6, 19.6, true);
    const mid = full[0].labelsFit ? full : pass(19.6, 16.6);
    const hi = mid, lo = pass(16.6, 16.6);
    const okHi = hi[0].labelsFit, okLo = lo[0].labelsFit;
    // the lower floor only when the 19.6 px pass cannot fit (text size is never traded for stage size)
    let all = okHi ? hi : okLo ? lo : hi.concat(lo);
    if (!okHi) all = all.map(x => ({...x, hiProblems: hi[0].problems.join('+') + ' ' + hi[0].dbg}));
    const tried = all.map(x => `${x.arrangement}:${x.problems.join('+')}:${x.stageW.toFixed(2)}:${x.mode}:k${x.k.toFixed(2)}:${x.dbg}`);
    all.sort((x, y) => (x.problems.length - y.problems.length) || (y.stageW - x.stageW));
    const L = {...all[0], tried, fullProblems: full[0].labelsFit ? '' : full[0].problems.join('+') + ' ' + full[0].dbg};
    // Labels hidden: the strip, guide and header texts are not drawn, so the same composition is
    // scaled and centred to fill the caption-safe box (one layout family, no empty band).
    L.fill = null;
    if (!ctx.show('key')) {
      const D = ctx.design;
      const boxes = [];
      for (const sc of L.scenes) {
        const G = sc.G;
        boxes.push({x: G.left, y: Math.min(sc.stage.docTop, G.headTop) - 6, w: G.right - G.left, h: G.floor + 8 - (Math.min(sc.stage.docTop, G.headTop) - 6)});
        boxes.push(sc.bub.box);
        boxes.push({x: sc.P.x, y: sc.P.y, w: L.badgeR * 2 + 6, h: L.badgeR * 2 + 8});
        if (sc.wall) boxes.push(sc.wall);
      }
      const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
      const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
      const k = Math.min((D.w - 16) / (x1 - x0), (D.h - 16) / (y1 - y0));
      L.fill = {k, x: (D.w - (x1 - x0) * k) / 2 - x0 * k, y: (D.h - (y1 - y0) * k) / 2 - y0 * k};
    }
    return L;
  },
  build(ctx, L) {
    const wallsFirst = Boolean(L.scenes[0].wall);
    return g({transform: L.fill ? `${T(L.fill.x, L.fill.y)} scale(${r(L.fill.k, 5)})` : undefined},
      wallsFirst ? null : L.headers,
      L.scenes.map((sc, i) => {
        const w = sc.wall;
        if (!w) return g(null, sc.stage.node, sc.target, sc.bub.node, sc.ringNode);
        const th = ctx.theme, cid = `wall${i}`;
        return g(null,
          h('defs', null, h('clipPath', {id: ctx.id(cid)}, h('rect', {x: r(w.x), y: r(w.y), width: r(w.w), height: r(w.h), rx: 18}))),
          h('path', {name: `${sc.key}-wall`, d: roundRectPath(w.x, w.y, w.w, w.h, 18), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2}),
          h('path', {d: `M${r(w.x + 2)} ${r(w.rail)}H${r(w.x + w.w - 2)}`, stroke: th.inkSoft, 'stroke-width': 3, opacity: 0.45}),
          h('path', {d: `M${r(w.x + 2)} ${r(sc.G.floor - 4)}H${r(w.x + w.w - 2)}V${r(w.y + w.h - 18)}Q${r(w.x + w.w - 2)} ${r(w.y + w.h - 2)} ${r(w.x + w.w - 18)} ${r(w.y + w.h - 2)}H${r(w.x + 18)}Q${r(w.x + 2)} ${r(w.y + w.h - 2)} ${r(w.x + 2)} ${r(w.y + w.h - 18)}Z`, fill: th.paper, opacity: 0.8}),
          g({'clip-path': ctx.ref(cid)}, sc.stage.node), sc.target, sc.bub.node, sc.ringNode);
      }),
      wallsFirst ? L.headers : null,
      L.guide,
      L.neutral && L.neutral.node,
      L.plate && g({name: 'plate-g', transform: T(L.plateX, L.plateY)}, L.plate.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const looks = [];
    let allReached = true;
    const P2 = (q, P) => ({x: r(q.x - P.x), y: r(q.y - P.y)});
    for (const sc of L.scenes) {
      const st = sc.script(u);
      const posed = sc.stage.pose(st);
      Object.assign(nodes, posed.nodes);
      allReached = allReached && posed.reached;
      const bubOpen = seg(u, ...W.bubbleOpen);
      Object.assign(nodes, sc.bub.frame(bubOpen, [seg(u, ...W.bubbleRow)]));
      const targetOp = seg(u, ...W.target) * (1 - seg(u, ...W.targetOut));
      nodes[`${sc.key}-target`] = {opacity: r(targetOp, 3)};
      nodes[`${sc.key}-ring`] = {opacity: r(seg(u, ...W.rings), 3)};
      const rowOfY = y => {
        for (let i = 0; i < L.pts.n; i++) if (Math.abs(sc.stage.rowY(i) - y) < 1) return i;
        return -1;
      };
      const where = id => (st.flags[id].at === 'placed' ? rowOfY(posed.flagPos[id].y) : st.flags[id].at);
      looks.push({
        other: P2(posed.flagPos.other, sc.P), chg: P2(posed.flagPos.chg, sc.P),
        atOther: where('other'), atChg: where('chg'),
        holdOther: st.holder.other, holdChg: st.holder.chg,
        hand: P2(posed.hands[L.changer], sc.P),
        band: r(st.marks.band, 3), ring: r(st.marks.ring, 3), slot: r(st.marks.slot, 3),
        bubble: r(bubOpen, 3), target: r(targetOp, 3),
      });
      sc.lastHands = posed.hands;
    }
    L.headers.forEach((_, i) => { if (ctx.show('key')) nodes[`hdr${i}-txt`] = {opacity: r(seg(u, ...W.labels), 3)}; });
    if (L.guide) nodes.guide = {opacity: r(seg(u, ...W.guide), 3)};
    if (L.neutral) nodes.neutral = {opacity: r(seg(u, ...W.neutral), 3)};
    if (L.plate) nodes['plate-g'] = {opacity: r(seg(u, ...W.plate), 3)};
    const [a, b] = looks;
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const w = (sc, id) => ({x: r(sc.lastHands[id].x), y: r(sc.lastHands[id].y)});
    const A = L.scenes[0], B = L.scenes[1];
    return {
      nodes,
      semantic: {
        beat, scenes: 2, arrangement: L.arrangement, changer: L.changer,
        a, b, lookA: a, lookB: b,
        handChgA: w(A, L.changer), handChgB: w(B, L.changer),
        flagChgA: {x: r(a.chg.x + A.P.x), y: r(a.chg.y + A.P.y)}, flagChgB: {x: r(b.chg.x + B.P.x), y: r(b.chg.y + B.P.y)},
        handOtherA: w(A, L.other), flagOtherA: {x: r(a.other.x + A.P.x), y: r(a.other.y + A.P.y)},
        guide: L.guide ? r(seg(u, ...W.guide), 3) : 0,
        neutralShown: L.neutral ? r(seg(u, ...W.neutral), 3) : 0,
        samePassage: L.pts.same, openPassage: L.pts.open,
        floorPx: L.floorPx, hiProblems: L.hiProblems, fullProblems: L.fullProblems, figureK: r(L.k, 3), stageW: r(L.stageW, 3), sceneExtent: r(L.sceneExtent, 3), bubbleMode: L.mode,
        labelsFit: L.labelsFit, problems: L.problems, tried: L.tried,
        allReached,
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
    slug: 'roles-02-contrast',
    title: 'Consultation between professionals — matching reading vs open question',
    titleEs: 'Consulta entre profesionales — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta entre profesionales',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical consultation tables. In both, one professional flags the same passage. Then the other professional places their flag: in A level with the first flag (a highlighter band joins them: same point noted); in B alone on another passage with an open ring and an empty outline opposite (open question). The document, people, shared note and facts are drawn once in a plate; a guide joins the one differing flag through the supplied changed fact. No winner or conclusion.',
    tags: ['consultation', 'professionals', 'comparison', 'margin flags', 'shared document', 'open question', 'same point', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-entre-profesionales.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
