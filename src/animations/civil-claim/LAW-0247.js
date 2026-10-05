/**
 * LAW-0247 — Preparación de demanda · contrast
 *
 * Storyboard (two complete, identical drafting stages — the same Party A, case
 * file with three trays and written filing — side by side on wide frames,
 * stacked on tall ones; the shared supplied texts are printed ONCE in a shared
 * strip or column (LAW-0135 / LAW-0243 precedent), the props carry the section
 * numbers and filler lines):
 *  0.00–0.17  base: both scenes identical; every tray is still covered by its
 *             flap; no scenario label yet.
 *  0.17–0.40  change beat: the A / B headers (● A, ◆ B, equal size) and the
 *             changed-fact chip appear; the flaps fold down in both scenes at
 *             the same time: in A every tray holds its piece, in B the
 *             configured section's tray is EMPTY (a neutral empty tray — not
 *             a defect: that piece is simply not supplied in example B).
 *  0.40–0.77  parallel action: in both scenes Party A pushes the supplied
 *             pieces one by one and they slide into their sections; in B the
 *             hand skips the empty tray, so B's section keeps its neutral
 *             empty slot (the sequence changes, not only a colour or a text).
 *  0.77–1.00  guide: an outline around the changed section in each scene,
 *             each with its tag (A: the supplied piece, B: "section to
 *             complete, as supplied"), joined by a dotted guide to the supplied
 *             guide label; the neutral note and the key. No winner, score,
 *             admissibility, deadline or consequence is shown.
 * @module animations/civil-claim/LAW-0247
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  PD_DEFAULTS, PD_STRINGS, partiesField, documentsField, sectionsField, datesField, stagesField, labelProps,
  partyCaption, sectionHeading, looksOf, gchip, keyChip, hit, fitG, pxPerUnit, solveStage, buildStage, stageChoreo, FIRST_REACH, localizeDefaults,
} from './kits/preparacion-demanda.js';

const ID = 'LAW-0247';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ = {headers: [0.17, 0.24], changed: [0.2, 0.27], flaps: [0.27, 0.36], tags: [0.78, 0.84], guide: [0.8, 0.86], note: [0.83, 0.89]};
const C0 = 0.4, C1 = 0.77;
const BASE_PX = 19.8, MIN_PX = 16.3;

const STRINGS = {
  en: {...PD_STRINGS.en, same: 'Same in A and B', changed: 'Changed fact'},
  es: {...PD_STRINGS.es, same: 'Igual en A y B', changed: 'Dato que cambia'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  sections: sectionsField,
  stages: stagesField,
  dates: datesField,
  labels: obj('Labels printed on the props', labelProps),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description of B', 90)}, ['label']),
  changedSection: int('Zero-based index of the only section that differs: its piece is supplied in A and not (yet) in B', 0, 2),
  changedFact: str('The single fact that differs between A and B (as supplied)', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed section', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  parties: PD_DEFAULTS.parties,
  documents: PD_DEFAULTS.documents,
  sections: PD_DEFAULTS.sections,
  stages: PD_DEFAULTS.stages,
  dates: PD_DEFAULTS.dates,
  labels: PD_DEFAULTS.labels,
  scenarioA: {label: 'Filing complete', caption: 'Every piece is supplied (as supplied)'},
  scenarioB: {label: 'Section to complete', caption: 'Documents piece not supplied yet'},
  changedSection: 2,
  changedFact: 'Only whether the documents piece is supplied differs',
  sharedFacts: ['Same party, case file, draft and day in A and B'],
  comparisonLabels: {guide: 'Only this section differs', neutral: 'Two configured examples side by side; no conclusion is drawn'},
};

// Spanish defaults (the baseline-es preset's values): shown when only `locale: "es"` is set
const DEFAULTS_ES = {
  "parties": [
    {
      "name": "Parte A",
      "role": "Prepara el escrito"
    },
    {
      "name": "Parte B",
      "role": "Nombrada en el escrito"
    }
  ],
  "documents": {
    "caseFile": {
      "ref": "EXP-0520",
      "title": "Expediente · reclamación ficticia"
    },
    "filing": {
      "ref": "Borrador E-0520/1",
      "title": "Escrito de demanda · borrador ficticio"
    }
  },
  "sections": [
    {
      "heading": "Hechos",
      "item": "El paquete ficticio llegó dañado el día 2"
    },
    {
      "heading": "Peticiones",
      "item": "Sustituir el paquete ficticio (según lo aportado)"
    },
    {
      "heading": "Documentos",
      "item": "Albarán D-17 (ficticio)"
    }
  ],
  "dates": {
    "filing": "Fecha: día 6 (según lo aportado)",
    "calendar": "Día 6"
  },
  "stages": {
    "filled": "Todos los apartados rellenos (según lo aportado)",
    "pending": "Apartado por completar (según lo aportado)"
  },
  "labels": {
    "calendar": "Día de redacción"
  },
  "scenarioA": {
    "label": "Escrito completo",
    "caption": "Todas las piezas están aportadas"
  },
  "scenarioB": {
    "label": "Apartado por completar",
    "caption": "Documentos aún sin aportar"
  },
  "changedFact": "Solo cambia si la pieza de documentos está aportada",
  "sharedFacts": [
    "Misma parte, expediente, borrador y día en A y B"
  ],
  "comparisonLabels": {
    "guide": "Solo difiere este apartado",
    "neutral": "Dos ejemplos configurados, uno junto a otro; no se extrae ninguna conclusión"
  }
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    return compose(ctx);
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

const LANE = th => [th.accent2, th.accent4];

/** Flow chips into rows inside width w (returns positions). */
function flow(items, x0, y0, w, gap) {
  let x = x0, y = y0, rowH = 0;
  const out = [];
  for (const it of items) {
    if (x > x0 && x + it.w > x0 + w) { x = x0; y += rowH + gap; rowH = 0; }
    out.push({...it, x, y});
    x += it.w + gap; rowH = Math.max(rowH, it.h);
  }
  return {items: out, h: out.length ? y + rowH - y0 : 0};
}

/**
 * One card listing several shared texts (each fitted on its own lines, thin rules between them): the shared strip
 * costs one padding per card instead of one per text.
 */
function stackCard(ctx, texts, o) {
  const th = ctx.theme;
  const {ts, w} = o;
  const px = ts * 0.55, py = ts * 0.4, gap = ts * 0.45;
  const fits = texts.map(t => fitG(t.text, {maxWidth: w - 2 * px, size: ts, minSize: ts, maxLines: 16, weight: t.weight ?? 600, balance: false}));
  const hh = fits.reduce((a, f) => a + f.height, 0) + gap * (fits.length - 1) + 2 * py;
  const cw = Math.min(w, Math.max(...fits.map(f => f.width)) + 2 * px);
  return {
    box: {w: cw, h: hh}, fit: null, fits,
    build(x, y) {
      let yy = y + py;
      const parts = [h('path', {d: roundRectPath(x, y, cw, hh, Math.min(ts * 0.7, 14)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2})];
      fits.forEach((f, i) => {
        if (i) parts.push(h('path', {d: `M${r(x + px)} ${r(yy - gap / 2)}H${r(x + cw - px)}`, stroke: th.paperLine, 'stroke-width': 2}));
        parts.push(textBlock(f, {x: x + px, y: yy, fill: texts[i].color ?? th.ink}));
        yy += f.height + gap;
      });
      return {node: g({name: o.name}, parts), box: {x, y, w: cw, h: hh}, fits};
    },
  };
}

/** Split the shared texts into n groups of consecutive items with balanced total length. */
function stripGroups(texts, n) {
  if (!texts.length) return [];
  const total = texts.reduce((a, t) => a + t.text.length + 40, 0);
  const out = [[]];
  let acc = 0;
  for (const t of texts) {
    if (acc >= (total * out.length) / n && out.length < n && out[out.length - 1].length) out.push([]);
    out[out.length - 1].push(t);
    acc += t.text.length + 40;
  }
  return out;
}

/** Masonry: items into ncols equal columns (each to the shortest column; the first ncols items fill the top row). */
function masonry(items, ncols, cw, gap) {
  const hs = new Array(ncols).fill(0);
  const out = items.map((it, i) => {
    const c = i < ncols ? i : hs.indexOf(Math.min(...hs));
    const q = {...it, x: c * (cw + gap), y: hs[c]};
    hs[c] += it.h + gap;
    return q;
  });
  return {items: out, h: Math.max(0, ...hs) - (items.length ? gap : 0)};
}

/** Scenario header card: letter disc (lane colour, ● / ◆ glyph), label and caption; both headers get equal heights. */
function headerCard(ctx, o) {
  const th = ctx.theme;
  const {ts, w} = o;
  const R = ts * 0.78;
  const tw = w - R * 2 - ts * 1.2;
  const lab = fitG(`${o.glyph}\u00a0${o.letter} · ${o.label}`, {maxWidth: tw, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const cap = o.caption ? fitG(o.caption, {maxWidth: tw, size: ts, minSize: ts, maxLines: 4, weight: 600}) : null;
  return {lab, cap, R, tw, hIn: lab.height + (cap ? cap.height + ts * 0.4 : 0)};
}

function compose(ctx) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const pxPer = pxPerUnit(ctx);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const sp = p;
  const k = p.changedSection;
  const tsBase = BASE_PX / pxPer, tsMin = MIN_PX / pxPer;
  const tsList = [];
  for (let t = tsBase; t >= tsMin - 1e-6; t -= (tsBase - tsMin) / 4) tsList.push(t);
  const arrs = shape === 'landscape' ? ['row'] : shape === 'portrait' ? ['column'] : ['row', 'column', 'side'];
  let best = null;
  // (labels hidden in a square frame: the text strip is gone, so the arrangement whose two scenes are drawn largest wins)
  const byArea = !showKey && shape === 'square';
  const area = L => L.G.ext.w * L.G.ext.h;
  for (const arr of arrs) {
    const L = composeAt(ctx, arr, tsList, tsBase, pxPer);
    if (!best || (L.fitted && !best.fitted) || (L.fitted === best.fitted && L.ts > best.ts + 0.01) || (byArea && L.fitted && best.fitted && Math.abs(L.ts - best.ts) < 0.01 && area(L) > area(best) * 1.02)) best = L;
    if (!byArea && L.fitted && L.ts >= tsBase - 0.01) break;
  }
  return best;
}

function composeAt(ctx, arr, tsList, tsBase, pxPer) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const k = p.changedSection;
  const looks = looksOf(ctx, p);
  const lane = LANE(th);
  let out = null;
  outer: for (const ts of tsList) for (const tc of [true, false]) {
    const gap = arr === 'row' ? ts * 1.6 : ts * 0.9;
    const colW = arr === 'side' ? Math.round(D.w * 0.36) : 0;
    const sceneW = arr === 'row' ? (D.w - 16 - gap) / 2 : D.w - 16 - (arr === 'side' ? colW + 20 : 0);
    // ---- texts printed once (shared strip / column)
    const shared = [
      `${p.documents.filing.ref} · ${p.documents.filing.title} · ${p.dates.filing} · ${p.labels.calendar}: ${p.dates.calendar}`,
      `${partyCaption(p, 0)} · ${partyCaption(p, 1)}`,
      `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`,
      // (compact pieces: the unchanged sections' pieces are listed here; text pieces print them themselves)
      ...(tc ? [] : p.sections.map((q, i) => (i === k ? null : `${sectionHeading(p, i).replace(/\u00a0/g, ' ')}: ${q.item}`)).filter(Boolean)),
      ...p.sharedFacts,
    ];
    const stripW = arr === 'side' ? colW : D.w - 16;
    // (the bottom area is a masonry of equal columns: chips go to the shortest column)
    // (the bottom masonry is tried with 2 to 4 columns: the lowest one wins)
    const buildBottom = ncols => {
      const mcw = arr === 'side' ? colW : (stripW - (ncols - 1) * ts * 0.45) / ncols;
      const chipOf = (text, o2 = {}) => gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: o2.mw ?? mcw, size: ts, minSize: ts, maxLines: 8, fill: th.card, stroke: o2.stroke ?? th.inkSoft, color: th.ink, weight: o2.weight ?? 600, name: o2.name});
      const sameHead = `${ctx.t.same}:`;
      const stripTexts = showAll ? shared.map((t, i) => ({text: i ? t : `${sameHead} ${t}`, weight: i ? 600 : 700})) : [];
      const changedText = showAll ? `${ctx.t.changed}: ${p.changedFact}` : null;
      // ---- headers (equal heights)
      const hw = arr === 'side' ? sceneW : sceneW;
      const hA = headerCard(ctx, {ts, w: hw, glyph: '●', letter: 'A', label: p.scenarioA.label, caption: showAll ? p.scenarioA.caption : ''});
      const hB = headerCard(ctx, {ts, w: hw, glyph: '◆', letter: 'B', label: p.scenarioB.label, caption: showAll ? p.scenarioB.caption : ''});
      const headH = showKey ? Math.max(hA.hIn, hB.hIn, hA.R * 2) + ts * 0.5 : 0;
      // ---- tags (A: the supplied piece; B: the pending caption) and the guide label
      const tagA = `${sectionHeading(p, k).replace(/\u00a0/g, ' ')}: ${p.sections[k].item}`;
      const tagB = p.stages.pending;
      const tagMw = arr === 'row' ? mcw : arr === 'side' ? colW : sceneW * 0.62;
      const probeTag = t => (showKey ? chipOf(t, {mw: tagMw, stroke: th.accent2, weight: 700}) : null);
      const pA = probeTag(tagA), pB = probeTag(tagB), pG = showKey ? chipOf(p.comparisonLabels.guide, {mw: tagMw, stroke: th.accent2, weight: 700}) : null;
      const rowFlow = showKey && arr === 'row' ? flow([pA.box, pG.box, pB.box].map(b => ({w: b.w, h: b.h})), 0, 0, D.w - 16, ts * 1.2).h : 0;
      // (row: the two tags and the guide label lead the bottom flow; column: a tag row under each scene)
      const tagRowH = !showKey || arr !== 'column' ? 0 : Math.max(pA.box.h, pB.box.h, pG.box.h) + ts * 0.9;
      // bottom area: strip (flowed), changed-fact chip, neutral note, key
      const noteP = showAll ? chipOf(p.comparisonLabels.neutral, {weight: 600}) : null;
      const keyP = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: mcw, size: ts}) : null;
      const bottomItems = [...(showKey && arr === 'row' ? [{c: pA, name: 'tagA'}, {c: pG, name: 'guideL'}, {c: pB, name: 'tagB'}] : []), ...(changedText ? [{c: chipOf(changedText, {stroke: th.accent2, weight: 700, name: 'changed-chip'}), name: 'changed'}] : []), ...(arr === 'side' ? stripTexts.map((q, i) => ({c: chipOf(q.text, {weight: q.weight, name: `strip${i}-chip`}), name: `strip${i}`})) : stripGroups(stripTexts, ncols).map((grp, i) => ({c: stackCard(ctx, grp, {ts, w: mcw, name: `strip${i}-chip`}), name: `strip${i}`}))), ...(arr === 'side' ? [...(noteP ? [{c: noteP, name: 'neutral'}] : []), ...(keyP ? [{c: keyP, name: 'key'}] : [])]
        // (the neutral note and the key share one card)
        : showAll ? [{c: stackCard(ctx, [{text: p.comparisonLabels.neutral}, {text: `◦ ${ctx.t.key}`, color: th.inkSoft}], {ts, w: mcw, name: 'neutral-chip'}), name: 'neutral'}]
          : showKey ? [{c: keyP, name: 'key'}] : [])];
      const fl = arr === 'side' ? flow(bottomItems.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), 0, 0, stripW, ts * 0.45) : masonry(bottomItems.map(q => ({name: q.name, w: q.c.box.w, h: q.c.box.h})), ncols, mcw, ts * 0.45);
  return {ncols, mcw, chipOf, stripTexts, changedText, hA, hB, headH, tagA, tagB, tagMw, pA, pB, pG, tagRowH, noteP, keyP, bottomItems, fl};
    };
    const cands = arr === 'side' ? [1] : [2, 3, 4, 5, 6].filter(n => (stripW - (n - 1) * ts * 0.45) / n >= ts * 8);
    const bb = cands.map(buildBottom).reduce((x, y) => (y.fl.h < x.fl.h - 0.5 ? y : x));
    const {ncols, mcw, chipOf, stripTexts, changedText, hA, hB, headH, tagA, tagB, tagMw, pA, pB, pG, tagRowH, noteP, keyP, bottomItems, fl} = bb;
    const bottomH = arr === 'side' ? 0 : fl.h + ts * (arr === 'row' && showKey ? 0.95 : 0.5);
    // ---- scene box
    const sceneH = arr === 'row' ? D.h - 16 - headH - tagRowH - bottomH : (D.h - 16 - bottomH - 2 * (headH + tagRowH) - gap) / 2;
    const sol = solveStage(ctx, {
      p: {...p, labels: p.labels}, availW: sceneW, availH: sceneH, tsList: [ts], modes: ['calTop', 'calRight'], showText: showAll, compact: true, textCards: tc, flaps: true,
      PKs: [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2], xTKs: [74, 86, 98, 110, 122, 134, 146], cwRange: [4 * ts, 12 * ts], headMinUnits: (ts >= tsBase - 0.01 ? 55 : 45) / pxPer, headMaxUnits: 150 / pxPer,
    });
    const fitted = sol.fitted;
    out = {arr, ts, gap, colW, sceneW, sceneH, sol, headH, tagRowH, bottomH, hA, hB, pA, pB, pG, tagA, tagB, tagMw, fl, bottomItems, stripW, fitted};
    if (sol.fitted) break outer;
  }
  return finish(ctx, out, looks, lane, pxPer);
}

const shape1 = ctx => ctx.view.shape;

function finish(ctx, o, looks, lane, pxPer) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const k = p.changedSection;
  const {arr, ts, gap, sceneW, headH, tagRowH, bottomH} = o;
  const G = o.sol.G;
  const E = G.ext;
  // ---- panels: each scene box (design units) and the stage origin inside it
  const panels = [0, 1].map(i => {
    const px = arr === 'row' ? 8 + i * (sceneW + gap) : 8;
    const py = arr === 'row' ? 8 + headH : 8 + headH + i * (headH + E.h + tagRowH + gap);
    const ox = px + (sceneW - E.w) / 2 - E.x;
    const oy = py + (-E.y);   // counter top
    return {px, py, w: sceneW, h: E.h, ox, oy, hy: py - headH};
  });
  if (arr === 'row') {
    // both scenes bottom-aligned on one baseline under the headers
    panels.forEach(pn => { pn.oy = 8 + headH + (o.sceneH - E.h) + (-E.y); pn.py = pn.oy + E.y; });
  }
  const M = (pn, q) => ({x: pn.ox + q.x, y: pn.oy + q.y});
  const Mb = (pn, b) => ({x: pn.ox + b.x, y: pn.oy + b.y, w: b.w, h: b.h});
  const stages = [0, 1].map(i => buildStage(ctx, G, {prefix: i ? 'sb' : 'sa', looks, supplied: [0, 1, 2].map(j => i === 0 || j !== k), flaps: true, wallX0: panels[i].px - panels[i].ox, wallX1: panels[i].px + sceneW - panels[i].ox}));

  // ---- headers
  const headers = [];
  if (showKey) {
    [o.hA, o.hB].forEach((hc, i) => {
      const pn = panels[i];
      const x = pn.px, y = arr === 'row' ? 8 : pn.py - headH, w = sceneW, hh = headH - ts * 0.2;
      const cy = y + hh / 2;
      const node = g({name: `hdr${i}`, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, 12), fill: th.card, stroke: lane[i], 'stroke-width': 3}),
        h('circle', {cx: r(x + ts * 0.5 + hc.R), cy: r(cy), r: r(hc.R), fill: lane[i], stroke: th.ink, 'stroke-width': 2.5}),
        h('text', {x: r(x + ts * 0.5 + hc.R), y: r(cy + ts * 0.36), 'text-anchor': 'middle', 'font-size': r(ts * 1.05, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A'),
        textBlock(hc.lab, {x: x + ts * 0.9 + hc.R * 2, y: cy - hc.hIn / 2, fill: th.ink, name: `hdr${i}-lab`}),
        hc.cap ? textBlock(hc.cap, {x: x + ts * 0.9 + hc.R * 2, y: cy - hc.hIn / 2 + hc.lab.height + ts * 0.4, fill: th.inkSoft, name: `hdr${i}-cap`}) : null);
      headers.push({node, box: {x, y, w, h: hh}});
    });
  }
  // ---- the changed section's outline in each scene, its tag and the guide
  const outl = panels.map(pn => { const s = G.rows[k].slot; const b = Mb(pn, s); return {x: b.x - 7, y: b.y - 7, w: b.w + 14, h: b.h + 14}; });
  const gutX = panels.map(pn => M(pn, {x: G.frameR + ts * 0.55, y: 0}).x);
  const tags = [], segs = [];
  let guide = null;
  let labelBoxes = [...headers.map(q => q.box)];
  // bottom area (strip, changed fact, note, key)
  const bottomY = arr === 'side' ? 0 : D.h - 8 - o.fl.h;
  const colX = D.w - 8 - o.colW;
  const bottom = [];
  if (arr !== 'side') {
    o.fl.items.forEach((it, i) => {
      const src = o.bottomItems[i];
      if (['tagA', 'tagB', 'guideL'].includes(src.name)) return;
      const c = src.c.build ? src.c.build(8 + it.x, bottomY + it.y) : src.name === 'key' ? keyChip(ctx, {x: 8 + it.x, y: bottomY + it.y, anchor: 'start', maxWidth: src.c.box.w + 1, size: ts})
        : gchip(ctx, src.c.fit.full, {x: 8 + it.x, y: bottomY + it.y, anchor: 'start', maxWidth: src.c.box.w + 1, size: ts, minSize: ts, maxLines: 8, fill: th.card, stroke: src.name === 'changed' ? th.accent2 : th.inkSoft, color: th.ink, weight: src.name === 'changed' || src.name === 'strip0' ? 700 : 600, name: `${src.name}-chip`});
      bottom.push({name: src.name, c});
    });
  }
  let colY = 8;
  const colPut = (name, text, o2 = {}) => {
    const c = name === 'key' ? keyChip(ctx, {x: colX, y: colY, anchor: 'start', maxWidth: o.colW, size: ts})
      : gchip(ctx, text, {x: colX, y: colY, anchor: 'start', maxWidth: o.colW, size: ts, minSize: ts, maxLines: 8, fill: th.card, stroke: o2.stroke ?? th.inkSoft, color: th.ink, weight: o2.weight ?? 600, name: `${name}-chip`});
    colY = c.box.y + c.box.h + ts * 0.4;
    return c;
  };
  if (showKey) {
    const mkTag = (name, text, x, y, anchorX) => gchip(ctx, text, {x, y, anchor: anchorX, maxWidth: o.tagMw, size: ts, minSize: ts, maxLines: 8, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: `${name}-chip`});
    if (arr === 'row') {
      // the two tags and the guide label lead the bottom flow; each outline's leader runs right to its gutter, down
      // to a lane above the bottom area, across and down into its own tag
      const at = n => o.fl.items[o.bottomItems.findIndex(q => q.name === n)];
      const tA = mkTag('tagA', o.tagA, 8 + at('tagA').x, bottomY + at('tagA').y, 'start');
      const tB = mkTag('tagB', o.tagB, 8 + at('tagB').x, bottomY + at('tagB').y, 'start');
      const gl = gchip(ctx, p.comparisonLabels.guide, {x: 8 + at('guideL').x, y: bottomY + at('guideL').y, anchor: 'start', maxWidth: o.tagMw, size: ts, minSize: ts, maxLines: 6, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'guide-chip'});
      tags.push(tA, tB);
      const lanes = [bottomY - ts * 0.65, bottomY - ts * 0.3];
      [tA, tB].forEach((t, i) => {
        const oo = outl[i], tb = t.box, cx = tb.x + tb.w * (i ? 0.7 : 0.3);
        segs.push(`M${r(oo.x + oo.w)} ${r(oo.y + oo.h / 2)}H${r(gutX[i])}V${r(lanes[i])}H${r(cx)}V${r(tb.y)}`);
      });
      if (at('guideL').y === at('tagA').y) segs.push(`M${r(tA.box.x + tA.box.w)} ${r(tA.box.y + tA.box.h / 2)}H${r(gl.box.x)}`);
      if (at('guideL').y === at('tagB').y) segs.push(`M${r(gl.box.x + gl.box.w)} ${r(gl.box.y + gl.box.h / 2)}H${r(tB.box.x)}`);
      guide = gl;
    } else if (arr === 'column') {
      panels.forEach((pn, i) => {
        const ty = pn.oy + G.panelH + ts * 0.45;
        const t = mkTag(i ? 'tagB' : 'tagA', i ? o.tagB : o.tagA, clamp(gutX[i], 8 + (i ? o.pB : o.pA).box.w / 2, D.w - 8 - (i ? o.pB : o.pA).box.w / 2), ty, 'middle');
        tags.push(t);
        segs.push(`M${r(outl[i].x + outl[i].w)} ${r(outl[i].y + outl[i].h / 2)}H${r(gutX[i])}V${r(t.box.y)}`);
      });
      // the guide label sits left in A's tag row; a dotted line joins A's tag down the right margin to B's outline leader
      const ty = tags[0].box.y;
      const gl = gchip(ctx, p.comparisonLabels.guide, {x: 8, y: ty, anchor: 'start', maxWidth: Math.max(ts * 6, tags[0].box.x - 8 - ts * 0.8), size: ts, minSize: ts, maxLines: 6, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'guide-chip'});
      const mx = D.w - 6;
      segs.push(`M${r(gl.box.x + gl.box.w)} ${r(ty + gl.box.h / 2)}H${r(tags[0].box.x)}`);
      segs.push(`M${r(tags[0].box.x + tags[0].box.w)} ${r(ty + tags[0].box.h / 2)}H${r(mx)}V${r(outl[1].y + outl[1].h / 2)}H${r(gutX[1] + 0.5)}`);
      guide = gl;
    } else {
      // side: the column holds the tags level with their outlines, the guide label between them, then the shared texts
      const tA = mkTag('tagA', o.tagA, colX, 0, 'start');
      const tB = mkTag('tagB', o.tagB, colX, 0, 'start');
      const yA = clamp(outl[0].y + outl[0].h / 2 - tA.box.h / 2, 8, D.h);
      const tA2 = mkTag('tagA', o.tagA, colX, yA, 'start');
      colY = tA2.box.y + tA2.box.h + ts * 0.5;
      const gl = colPut('guide', p.comparisonLabels.guide, {stroke: th.accent2, weight: 700});
      const yB = Math.max(colY, outl[1].y + outl[1].h / 2 - tB.box.h / 2);
      const tB2 = mkTag('tagB', o.tagB, colX, yB, 'start');
      tags.push(tA2, tB2);
      colY = tB2.box.y + tB2.box.h + ts * 0.5;
      const gxc = colX - ts * 0.5;
      [tA2, tB2].forEach((t, i) => segs.push(`M${r(outl[i].x + outl[i].w)} ${r(outl[i].y + outl[i].h / 2)}H${r(gxc)}V${r(t.box.y + t.box.h / 2)}H${r(t.box.x)}`));
      segs.push(`M${r(gl.box.x)} ${r(gl.box.y + gl.box.h / 2)}H${r(gxc)}`);
      guide = gl;
    }
  }
  if (arr === 'side') {
    // the column's remaining texts under the tags (or from the top when a tag leaves room above)
    const texts = o.bottomItems.filter(q => q.name !== 'key');
    const startY = colY;
    colY = showKey ? startY : 8;
    for (const q of texts) bottom.push({name: q.name, c: colPut(q.name, q.c.fit.full, {stroke: q.name === 'changed' ? th.accent2 : th.inkSoft, weight: q.name === 'changed' || q.name === 'strip0' ? 700 : 600})});
    if (showKey) bottom.push({name: 'key', c: colPut('key')});
  }
  const colFits = arr !== 'side' || colY <= D.h - 8 + ts * 0.4;
  labelBoxes = [...labelBoxes, ...tags.map(t => t.box), ...(guide ? [guide.box] : []), ...bottom.map(q => q.c.box)];
  const clashes = [];
  labelBoxes.forEach((b, i) => labelBoxes.forEach((c, j) => { if (j > i && hit(b, c, 2)) clashes.push(`${i}/${j}`); }));
  const heads = panels.map(pn => Mb(pn, {x: G.headC.x - G.headR - 8, y: G.headTop - 6, w: G.headR * 2 + 36, h: G.headR * 2 + 16}));
  const truncated = [...bottom.flatMap(q => (q.c.fits ? q.c.fits : [q.c.fit])), ...(G.cc ? [] : [...G.itemFits, ...G.headFits]), ...tags.map(t => t.fit), guide && guide.fit, o.hA.lab, o.hB.lab, o.hA.cap, o.hB.cap, G.calTitle, G.calDay].filter(f => f && f.truncated).map(f => f.full);
  return {
    arr, ts, G, panels, stages, headers, outl, tags, segs, guide, bottom, looks, k, colFits,
    fitted: o.sol.fitted && colFits, labelsClear: clashes.length === 0, clashes, truncated, heads,
    textPx: r(ts * pxPer, 2), sceneShare: r(sceneW * pxPer / 1080 * Math.min(ctx.view.width, ctx.view.height) / ctx.view.width, 3),
  };
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  return g(null,
    L.stages.map((st, i) => g({name: i ? 'sb-root' : 'sa-root', transform: T(L.panels[i].ox, L.panels[i].oy)}, st.node)),
    L.headers.map(q => q.node),
    g({name: 'guide', opacity: 0},
      L.outl.map(o => h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 12), fill: 'none', stroke: th.accent2, 'stroke-width': 4})),
      L.segs.map(d => h('path', {d, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round'})),
      L.guide && L.guide.node),
    L.tags.map((t, i) => g({name: i ? 'tagB' : 'tagA', opacity: 0}, t.node)),
    L.bottom.map(q => g({name: `bt-${q.name}`, opacity: 0}, q.c.node)),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const G = L.G;
  const c = clamp((u - C0) / (C1 - C0), FIRST_REACH, 1);
  const flap = seg(u, ...W_.flaps);
  const sup = [[true, true, true], [0, 1, 2].map(j => j !== L.k)];
  // (both scenes push the shared pieces bottom row first, then the changed piece last: the scenes act alike until the
  // one configured difference)
  const ORDER = [...[2, 1, 0].filter(j => j !== L.k), L.k];
  const nodes = {};
  const sem = [0, 1].map(i => {
    const v = {...stageChoreo(c, G, sup[i], ORDER), flap};
    const posed = L.stages[i].pose(v);
    Object.assign(nodes, posed.nodes);
    const W = q => ({x: r(L.panels[i].ox + q.x), y: r(L.panels[i].oy + q.y)});
    return {
      hand: W(posed.hands.near), head: W(posed.head), reached: posed.reached,
      cards: v.dx.map((d, j) => (sup[i][j] ? r(d, 2) : null)), landed: v.landed, filled: v.landed.filter(Boolean).length,
      grip: [0, 1, 2].map(j => W({x: G.grips[j].x + v.dx[j], y: G.grips[j].y})), pushing: v.pushing,
      card: [0, 1, 2].map(j => W({x: G.xT + G.tp + v.dx[j], y: G.rows[j].mid})),
    };
  });
  const hp = seg(u, ...W_.headers);
  L.headers.forEach((q, i) => { nodes[`hdr${i}`] = {opacity: r(hp, 3)}; });
  const tagP = seg(u, ...W_.tags);
  L.tags.forEach((t, i) => { nodes[i ? 'tagB' : 'tagA'] = {opacity: r(tagP, 3)}; });
  const guideP = seg(u, ...W_.guide);
  nodes.guide = {opacity: r(guideP, 3)};
  const noteP = seg(u, ...W_.note);
  const changedP = seg(u, ...W_.changed);
  const stripP = 1;
  L.bottom.forEach(q => { nodes[`bt-${q.name}`] = {opacity: r(q.name === 'neutral' ? noteP : q.name === 'changed' ? changedP : stripP, 3)}; });
  const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
  // what the viewer sees in each scene (compared before the change beat): flaps, card positions, hand
  const look = i => ({flap: r(flap, 3), cardsVisible: flap > 0.02 ? sup[i] : [false, false, false], dx: sem[i].cards.map(d => (flap > 0.02 ? d : 0)), hand: {x: r(sem[i].hand.x - L.panels[i].ox, 1), y: r(sem[i].hand.y - L.panels[i].oy, 1)}});
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), scenes: 2, arrangement: L.arr, changedSection: L.k,
      headers: r(hp, 3), changedShown: r(changedP, 3), flap: r(flap, 3), tags: r(tagP, 3), guide: r(guideP, 3), neutralShown: r(noteP, 3),
      a: {filled: sem[0].filled, landed: sem[0].landed, pushing: sem[0].pushing}, b: {filled: sem[1].filled, landed: sem[1].landed, pushing: sem[1].pushing},
      lookA: look(0), lookB: look(1),
      handA_A: sem[0].hand, handA_B: sem[1].hand, cardA0: sem[0].card[0], cardA1: sem[0].card[1], cardA2: sem[0].card[2], cardB0: sem[1].card[0], cardB1: sem[1].card[1], cardB2: sem[1].card[2],
      gripA0: sem[0].grip[0], gripA1: sem[0].grip[1], gripA2: sem[0].grip[2], gripB0: sem[1].grip[0], gripB1: sem[1].grip[1],
      allReached: sem[0].reached && sem[1].reached,
      fitted: L.fitted, labelsClear: L.labelsClear, clashes: L.clashes, truncated: L.truncated, textPx: L.textPx, PK: r(G.PK, 2),
      labelsOffFaces: L.heads.every(hd => !L.tags.some(t => hit(t.box, hd, 0)) && !L.headers.some(q => hit(q.box, hd, 0)) && !L.bottom.some(q => hit(q.c.box, hd, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-02-contrast',
    title: 'Preparing a claim — a complete filing and a filing with one section to complete, side by side',
    titleEs: 'Preparación de demanda — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Preparación de demanda',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical drafting stages: Party A, a case file with three covered trays and a written filing with three sections. At the change beat the tray flaps fold down: in A every tray holds its supplied piece; in B the configured section’s tray is empty (not supplied in that example). Party A pushes the supplied pieces into their sections in both scenes; in B that section keeps its neutral empty slot. A guide outlines the changed section in both scenes; equal-weight tags, a neutral note and the key. No winner, score, admissibility, deadline or consequence.',
    tags: ['claim preparation', 'written filing', 'comparison', 'section to complete', 'trays', 'case file', 'party A'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/preparacion-demanda.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
