/**
 * LAW-0080 — Trazabilidad de una cita · inspect
 *
 * Storyboard:
 *  0.00–0.20  build: the library bay in the state the trail produced — the
 *             catalogue query that found the treatise with its result lit, the
 *             note on its lectern, the treatise open on its cradle, the
 *             original leaning against its archive box, the card pinned to the
 *             counter — while the brass chain is laid note → treatise → entry.
 *             A context caption shows during this beat only; the lens period
 *             keeps a single editorial annotation (before → after chips).
 *  0.20–0.45  isolate: a lens lifts a REAL copy of the detail that tells access
 *             to the original apart from an indirect citation: the numbered
 *             entries of the original where the chain's clasp hooks on (same
 *             coordinates as the context). The cited entry is named.
 *  0.45–0.75  substitute: one datum changes — the entry the treatise cites
 *             (before → after). Inside the lens only the dependent geometry
 *             moves: the clasp, its eyelet and the highlight slide to the new
 *             entry; the old hook stays as a dashed ghost ring and its number is
 *             struck through, so the before value remains traceable.
 *  0.75–1.00  return: the lens folds back onto its source; the context chain
 *             now ends on the new entry and a "datum changed" marker stays.
 * focusTarget "pinpoint": the substituted datum is the page the note cites;
 * the note's footnote text swaps and the first chain's clasp moves from the
 * passage on p. <before> to the passage on p. <after> of the open treatise.
 * Seeking back before the substitution restores the old datum exactly. No
 * accuracy, validity or outcome is inferred.
 * @module animations/research/LAW-0080
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r, clamp, lerp} from '../../core/time.js';
import {mix, roundRectPath} from '../../core/geometry.js';
import {str, obj, num, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {
  trailFields, TRAIL_DEFAULTS, KIT_STRINGS, trailBay, bayPlacement, labelPlacer, entrySlot,
  sourceFolio, treatiseBook, chainRope, chainRoute, innerText,
} from './kits/trazabilidad-de-una-cita.js';

const ID = 'LAW-0080';
const DURATION = 8000;
const TARGETS = ['entry', 'pinpoint'];
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  chain1: [0.03, 0.1], chain2: [0.08, 0.16], ctxCaption: [0.03, 0.1], ctxCaptionOut: [0.19, 0.23], open: [0.22, 0.38], before: [0.36, 0.44],
  strike: [0.47, 0.53], move: [0.5, 0.62], backGrow: [0.595, 0.62], after: [0.62, 0.69], arrow: [0.63, 0.69],
  close: [0.76, 0.86], ctxUpdate: [0.845, 0.9], marker: [0.9, 0.96],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, entryLabel: 'Entry of the source cited by the treatise', pageLabel: 'Page of the treatise cited by the note', entryShort: 'entry'},
  es: {...KIT_STRINGS.es, entryLabel: 'Asiento del documento de origen citado por el tratado', pageLabel: 'Página del tratado citada por la nota', entryShort: 'asiento'},
};

const sceneSchema = {
  ...trailFields,
  focusTarget: oneOf('Datum that is enlarged and substituted: entry = the entry of the source document the treatise cites (the second chain’s clasp moves to it); pinpoint = the page of the treatise the note cites (the note’s text swaps and the first chain’s clasp moves to the passage on that page)', TARGETS),
  beforeValue: str('Value before the substitution (entry: "1"–"4"; pinpoint: the page as printed, e.g. "p. 88")', 30),
  afterValue: str('Value after the substitution (entry: "1"–"4"; pinpoint: the page printed on the facing page, e.g. "p. 89")', 30),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens', 1.5, 4), placement: oneOf('Where the lens opens: auto or away from the detail (left/right/top/bottom)', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 120), marker: str('Label of the changed-datum marker', 50)}),
};

const defaultParams = {
  ...TRAIL_DEFAULTS,
  // the treatise's own footnote number differs from both entry values, so after the swap no
  // highlighted "3" in the treatise can be read as the old entry
  citations: {...TRAIL_DEFAULTS.citations, innerNote: '7'},
  focusTarget: 'entry',
  beforeValue: '3',
  afterValue: '2',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'The trail as traced: note → treatise → original', marker: 'Datum changed'},
};

/** Entry slots of the before/after values (never the same slot). */
function entrySlots(before, after) {
  const b = entrySlot(before);
  let a = entrySlot(after);
  if (a === b) a = (b + 3) % 4;
  const numeric = /^[1-4]$/.test(String(before).trim()) && /^[1-4]$/.test(String(after).trim());
  const labels = numeric ? ['1', '2', '3', '4'] : ['', '', '', ''];
  if (!numeric) { labels[b] = String(before); labels[a] = String(after); }
  return {b, a, labels};
}

const scene = {
  sizes: {landscape: [1900, 900], square: [1380, 1160], portrait: [1040, 1560]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const pl = bayPlacement(shape);
    const [bw, bh] = pl.size;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    const target = p.focusTarget;
    const isEntry = target === 'entry';
    const slots = entrySlots(p.beforeValue, p.afterValue);
    // the context shows the BEFORE datum
    const pCtx = isEntry
      ? {...p, citations: {...p.citations, entry: String(p.beforeValue)}}
      : {...p, citations: {...p.citations, pinpoint: String(p.beforeValue)}};
    const noteAlt = isEntry ? null : `${p.sources.intermediate}, ${p.afterValue}`;
    const stage = trailBay(ctx, {
      prefix: 'ctx', pl, p: pCtx, t, finalMode: 'source', arms: false, bookOpen: true, folioFront: true,
      entryAlt: isEntry ? slots.a : undefined, entryLabels: isEntry ? slots.labels : undefined,
      pinAlt: !isEntry, pageR: isEntry ? '' : String(p.afterValue), noteAlt,
    });
    // the catalogue search shows the query that found the treatise (typed, result lit)
    const at = (v = {}) => stage.pose({type: 1, result: 1, chain1: 1, chain2: 1, rows: [1, 1, 1], entryHl: 1, innerHl: 0, ...v}).semantic;
    const s0 = at();
    const s1 = at({entryMove: 1, pinMove: 1});

    // ---- source region (context coordinates) and a real copy of it for the lens
    const B = pl.book;
    const fp = stage.standPose;
    const F = pl.folio;
    let region;
    let lensContent;
    let lensParts = {};
    if (isEntry) {
      const ents = stage.folio.entries;
      // the entries involved (old and new), with half an entry of context and the eyelet margin
      const lo = Math.min(slots.b, slots.a), hi = Math.max(slots.b, slots.a);
      const each = ents[1].box.y - ents[0].box.y;
      const top = ents[lo].box.y - each * 0.45, bottom = ents[hi].box.y + ents[hi].box.h + each * 0.35;
      region = {x: fp.x - 34 * fp.k, y: fp.y + top * fp.k, w: F.w * fp.k + 44 * fp.k, h: (bottom - top) * fp.k};
      // a second, real folio at the same pose + its own chain end
      const copy = sourceFolio(ctx, {prefix: 'lz-fol', w: F.w, h: F.h, title: pCtx.sources.source, folio: pCtx.citations.folio, date: pCtx.dates.source, entry: slots.b, entryLabels: slots.labels, showText: showAll});
      const lzChain = chainRope(ctx, {name: 'lz-ch2', width: pl.chainW ?? 10});
      const oldHook = copy.hookAt(slots.b);
      const numPt = copy.entries[slots.b].labelPt;
      const newNum = copy.entries[slots.a].labelPt;
      const ghost = g({name: 'lz-ghost', opacity: 0},
        h('circle', {cx: oldHook.x, cy: oldHook.y, r: 15, fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '5 4'}));
      const strike = h('line', {name: 'lz-strike', x1: r(numPt.x - 16), x2: r(numPt.x + 16), y1: r(copy.entries[slots.b].box.y + copy.entries[slots.b].box.h * 0.3), y2: r(copy.entries[slots.b].box.y + copy.entries[slots.b].box.h * 0.3 - 4), stroke: th.accent, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0});
      const ring = h('circle', {name: 'lz-newnum', cx: r(newNum.x), cy: r(copy.entries[slots.a].box.y + copy.entries[slots.a].box.h * 0.28), r: 14, fill: 'none', stroke: th.accent2, 'stroke-width': 3, opacity: 0});
      lensContent = g(null,
        h('rect', {x: region.x - 400, y: region.y - 400, width: region.w + 800, height: region.h + 800, fill: th.dark ? '#34383e' : '#efe7d8'}),
        g({name: 'lz-folpose', transform: T(fp.x, fp.y, 0, fp.k)}, copy.node, g({transform: ''}, ghost, strike, ring)),
        lzChain.node, lzChain.clasp,
      );
      lensParts = {copy, lzChain};
    } else {
      const bk = stage.book;
      const cs = stage.onCradle;
      const k = cs.k;
      const top = bk.headY - 8, bottom = bk.bodyTop + bk.lh * 5.4;
      // the left page (old passage) and the inner half of the right page (new passage)
      region = {x: cs.x - B.cw * k - 34 * k, y: cs.y + top * k, w: (B.cw * 1.62 + 34) * k, h: (bottom - top) * k};
      const copy = treatiseBook(ctx, {prefix: 'lz-book', t: B.t, hB: B.hB, cw: B.cw, title: p.sources.intermediate, edition: p.dates.intermediate, pageL: String(p.beforeValue), pageR: String(p.afterValue), innerNote: p.citations.innerNote, foot: innerText(p), showText: showAll});
      const lzChain = chainRope(ctx, {name: 'lz-ch1', width: pl.chainW ?? 10});
      const old = copy.hookIn;
      const ghost = g({name: 'lz-ghost', opacity: 0}, h('circle', {cx: old.x, cy: old.y, r: 15, fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '5 4'}));
      lensContent = g(null,
        h('rect', {x: region.x - 400, y: region.y - 400, width: region.w + 800, height: region.h + 800, fill: th.dark ? '#34383e' : '#efe7d8'}),
        g({transform: T(cs.x, cs.y, 0, k)}, copy.node, ghost),
        lzChain.node, lzChain.clasp,
      );
      lensParts = {copy, lzChain};
    }

    // ---- labels: before → after chips beside the lens, context caption, changed marker
    const box = pl.box;
    const placer = labelPlacer(box, {margin: 12});
    placer.addObstacle({x: region.x - 10, y: region.y - 10, w: region.w + 20, h: region.h + 20});
    // key props of the context stay uncovered
    placer.addObstacle({x: pl.page.x - 6, y: pl.page.y - 6, w: pl.page.w + 12, h: pl.page.h + 12});
    placer.addObstacle({x: pl.cradle.x - B.cw * pl.bookK - 8, y: pl.cradle.y - (B.hB / 2) * pl.bookK - 8, w: B.cw * 2 * pl.bookK + 16, h: B.hB * pl.bookK + 16});
    placer.addObstacle({x: fp.x - 8, y: fp.y - 30, w: F.w * fp.k + 16, h: F.h * fp.k + 38});
    placer.addObstacle(stage.cardBox);
    placer.addObstacle({...pl.screen, y: pl.screen.y - 30, h: pl.screen.h + 30});
    placer.addObstacle({x: stage.caseG.plate.x - 6, y: stage.caseG.plate.y - 6, w: stage.caseG.plate.w + 12, h: stage.caseG.plate.h + 12});
    for (const hk of [[s0.noteHook, s0.inHook, pl.route1], [s0.outHook, s0.folioHook, pl.route2]]) {
      const rt = chainRoute(hk[0], hk[1], hk[2](hk[0], hk[1]));
      for (let i = 0; i <= 24; i++) { const q = rt.at(i / 24); placer.addObstacle({x: q.x - 12, y: q.y - 12, w: 24, h: 24}); }
    }
    let ctxCap = null;
    if (showAll && p.contextLabels.context) {
      ctxCap = placer.place([
        {x: box.x + box.w - 24, y: box.y + 22, anchor: 'end'},
        {x: box.x + box.w / 2, y: box.y + 22, anchor: 'middle'},
      ], c => chip(ctx, `${t.context}: ${p.contextLabels.context}`, {x: c.x, y: c.y, anchor: c.anchor, maxWidth: Math.min(760, box.w * 0.62), size: 26, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'ctx-caption', weight: 600}), {x: box.x + box.w - 200, y: box.y + 40}, {maxDist: 900});
    }
    // ---- lens destination: the largest free placement away from the detail
    const zoom = p.detailGeometry.zoom;
    const capH = 24;
    const ratio = region.h / region.w;
    const dests = {
      left: () => {
        const w = Math.min(region.w * zoom, region.x - box.x - 60, (box.h - capH - 60) / ratio);
        return {x: Math.max(box.x + 30, region.x - 50 - w), y: box.y + capH, w, h: w * ratio};
      },
      right: () => {
        const w = Math.min(region.w * zoom, box.x + box.w - (region.x + region.w) - 60, (box.h - capH - 60) / ratio);
        return {x: region.x + region.w + 50, y: box.y + capH, w, h: w * ratio};
      },
      top: () => {
        const w = Math.min(region.w * zoom, box.w - 60, (region.y - box.y - capH - 40) / ratio);
        return {x: clamp(region.x + region.w / 2 - w / 2, box.x + 30, box.x + box.w - 30 - w), y: box.y + capH, w, h: w * ratio};
      },
      bottom: () => {
        const w = Math.min(region.w * zoom, box.w - 60, (box.y + box.h - (region.y + region.h) - 60) / ratio);
        return {x: clamp(region.x + region.w / 2 - w / 2, box.x + 30, box.x + box.w - 30 - w), y: region.y + region.h + 40, w, h: w * ratio};
      },
    };
    // props that carry text: the lens window never opens over them (their text would sit under it)
    const textProps = [
      {x: pl.screen.x - 10, y: pl.screen.y - 34, w: pl.screen.w + 20, h: pl.screen.h + 44},
      {x: pl.page.x - 10, y: pl.page.y - 10, w: pl.page.w + 20, h: pl.page.h + 20},
      {x: pl.cradle.x - B.cw * pl.bookK - 10, y: pl.cradle.y - (B.hB / 2) * pl.bookK - 10, w: B.cw * 2 * pl.bookK + 20, h: B.hB * pl.bookK + 20},
      {x: fp.x - 10, y: fp.y - 34, w: F.w * fp.k + 20, h: F.h * fp.k + 44},
      {...stage.cardBox, x: stage.cardBox.x - 10, y: stage.cardBox.y - 10, w: stage.cardBox.w + 20, h: stage.cardBox.h + 20},
      {x: stage.caseG.plate.x - 10, y: stage.caseG.plate.y - 10, w: stage.caseG.plate.w + 20, h: stage.caseG.plate.h + 20},
      {x: pl.archive.x - pl.archive.w / 2 - 10, y: pl.archive.y - pl.archive.h - 20, w: pl.archive.w + 20, h: pl.archive.h + 30},
    ];
    const clearOf = d => !textProps.some(o2 => o2.x < d.x + d.w && o2.x + o2.w > d.x && o2.y < d.y + d.h && o2.y + o2.h > d.y);
    const searchDest = () => {
      // largest window (up to the requested zoom) that fits the bay and avoids text-bearing props
      const wMax = region.w * zoom;
      for (let w = wMax; w >= region.w * 1.4; w -= region.w * 0.06) {
        const hh = w * ratio;
        let best = null, bd = Infinity;
        for (let y = box.y + capH; y + hh <= box.y + box.h - 16; y += 16) {
          for (let x = box.x + 16; x + w <= box.x + box.w - 16; x += 16) {
            const d = {x, y, w, h: hh};
            if (!clearOf(d)) continue;
            // near the detail, preferably above it (the chips then hang below the window)
            const dd = Math.hypot(x + w / 2 - (region.x + region.w / 2), y + hh / 2 - (region.y + region.h / 2)) + (y + hh > region.y ? 260 : 0);
            if (dd < bd) { bd = dd; best = d; }
          }
        }
        if (best) return {...best, mode: 'free'};
      }
      return null;
    };
    let dest = null;
    if (p.detailGeometry.placement !== 'auto') {
      const d = dests[p.detailGeometry.placement]();
      if (d.w >= region.w * 1.4) dest = {...d, mode: p.detailGeometry.placement};
    }
    if (!dest) dest = searchDest();
    if (!dest) {
      for (const key of ['left', 'top', 'right', 'bottom']) {
        const d = dests[key]();
        if (d.w >= region.w * 1.4 && (!dest || d.w > dest.w)) dest = {...d, mode: key};
      }
    }
    if (!dest) dest = {...dests.left(), mode: 'left'};
    const L2 = lens(ctx, {name: 'lens', source: region, dest, content: lensContent, frame: {x: -4000, y: -4000, w: bw + 8000, h: bh + 8000}, color: th.accent});
    placer.addObstacle(dest);

    const labelText = isEntry ? t.entryLabel : t.pageLabel;
    const fmtV = v => (isEntry ? `${t.entryShort} ${v}` : String(v));
    let ann = null;
    if (showKey) {
      const mk = (which, x, y, anchor, mw) => valueChip(ctx, {label: labelText, value: fmtV(which === 'before' ? p.beforeValue : p.afterValue), x, y, anchor, maxWidth: mw,
        fill: which === 'before' ? th.card : th.accent2Soft, stroke: which === 'before' ? th.ink : th.accent2, valueColor: which === 'before' ? th.ink : th.accent2, name: `ann-${which}`});
      const inside = q => q && q.box.x >= box.x + 10 && q.box.y >= box.y + 10 && q.box.x + q.box.w <= box.x + box.w - 10 && q.box.y + q.box.h <= box.y + box.h - 10;
      const areaIn = (o2, q) => {
        const w2 = Math.min(o2.x + o2.w, q.box.x + q.box.w) - Math.max(o2.x, q.box.x);
        const h2 = Math.min(o2.y + o2.h, q.box.y + q.box.h) - Math.max(o2.y, q.box.y);
        return w2 > 0 && h2 > 0 ? w2 * h2 : 0;
      };
      const lensPad = {x: dest.x - 16, y: dest.y - 16, w: dest.w + 32, h: dest.h + 32};
      const regPad = {x: region.x - 12, y: region.y - 12, w: region.w + 24, h: region.h + 24};
      const score = q => {
        if (!q || !inside(q)) return Infinity;
        let c = 0;
        for (const o2 of textProps) c += 10 * areaIn(o2, q);
        for (const o2 of placer.obstacles) c += areaIn(o2, q);
        c += 1e4 * (areaIn(lensPad, q) + areaIn(regPad, q));
        const d = Math.hypot(q.box.x + q.box.w / 2 - (dest.x + dest.w / 2), q.box.y + q.box.h / 2 - (dest.y + dest.h / 2));
        return c + d * 3;
      };
      const mw = 330;
      const b0 = mk('before', 0, 0, 'start', mw), a0 = mk('after', 0, 0, 'start', mw);
      const rowW = b0.box.w + 60 + a0.box.w, rowH = Math.max(b0.box.h, a0.box.h);
      const stW = Math.max(b0.box.w, a0.box.w), stH = b0.box.h + 46 + a0.box.h;
      const atMode = (mode, x, y) => {
        if (mode === 'row') {
          const b = mk('before', x, y, 'start', mw), a = mk('after', x + b0.box.w + 60, y, 'start', mw);
          const cy = b.valueLines[0].cy;
          return {b, a, arrow: `M${r(x + b0.box.w + 13)} ${r(cy)}h32m-10 -9l10 9l-10 9`, box: {x, y, w: rowW, h: rowH}};
        }
        const b = mk('before', x, y, 'start', mw), a = mk('after', x, y + b0.box.h + 46, 'start', mw);
        const ax = x + 36;
        return {b, a, arrow: `M${r(ax)} ${r(y + b0.box.h + 7)}V${r(y + b0.box.h + 39)}m-9 -10l9 10l9 -10`, box: {x, y, w: stW, h: stH}};
      };
      let best = null, bs = Infinity;
      for (const mode of ['row', 'stack']) {
        const w = mode === 'row' ? rowW : stW, hh = mode === 'row' ? rowH : stH;
        for (let y = box.y + 14; y + hh <= box.y + box.h - 14; y += 18) {
          for (let x = box.x + 14; x + w <= box.x + box.w - 14; x += 18) {
            const probe = {box: {x, y, w, h: hh}};
            const sc = score(probe);
            if (sc < bs) { bs = sc; best = {mode, x, y}; }
          }
        }
      }
      ann = best ? atMode(best.mode, best.x, best.y) : null;
      if (ann) placer.addLabel(ann.box);
    }
    // changed-datum marker beside the moved hook (context)
    const hookAfter = isEntry ? s1.folioHook : s1.inHook;
    let marker = null;
    {
      // label on top, "old → new" on its own line (the values are never wrapped apart)
      const mkChip = c => {
        const cc = valueChip(ctx, {label: p.contextLabels.marker, value: `${fmtV(p.beforeValue)} → ${fmtV(p.afterValue)}`, x: c.x, y: c.y, anchor: c.anchor, maxWidth: 440, fill: th.card, stroke: th.accent2, valueColor: th.ink, name: 'marker-chip', small: true});
        const b = cc.box;
        const from = {x: clamp(hookAfter.x, b.x + 12, b.x + b.w - 12), y: hookAfter.y < b.y ? b.y : b.y + b.h};
        return {node: cc.node, box: b, lead: {x1: from.x, y1: from.y, x2: hookAfter.x, y2: hookAfter.y}};
      };
      const mc = showKey ? placer.place([
        {x: hookAfter.x - 40, y: hookAfter.y - 150, anchor: 'end'},
        {x: hookAfter.x - 40, y: hookAfter.y + 80, anchor: 'end'},
        {x: hookAfter.x, y: hookAfter.y - 150, anchor: 'middle'},
      ], mkChip, hookAfter, {maxDist: 320}) : null;
      marker = g({name: 'marker', opacity: 0},
        mc ? h('line', {x1: r(mc.lead.x1), y1: r(mc.lead.y1), x2: r(mc.lead.x2), y2: r(mc.lead.y2), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round'}) : null,
        h('circle', {cx: r(hookAfter.x), cy: r(hookAfter.y), r: 20, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
        mc ? mc.node : null);
    }
    return {pl, s, ox, oy, stage, region, dest, L2, ann, ctxCap, marker, isEntry, slots, lensParts, s0, s1, fp};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.ctxCap && L.ctxCap.node,
      L.marker,
      L.L2.node,
      L.ann && g({name: 'ann', opacity: 0},
        // opaque backing: the struck "before" chip and the incoming "after" chip never let the
        // context (e.g. book spines) show through while they fade
        h('path', {name: 'ann-back', d: roundRectPath(L.ann.b.box.x - 12, L.ann.b.box.y - 12, L.ann.b.box.w + 24, L.ann.b.box.h + 24, 20), fill: th.dark ? '#2b3036' : '#f6f1e4', stroke: th.inkSoft, 'stroke-width': 1.6, opacity: 0}),
        L.ann.b.node,
        L.ann.b.valueLines.map((ln, i) => h('line', {name: `ann-strike-${i}`, x1: r(ln.x - 6), x2: r(ln.x + ln.w + 6), y1: r(ln.cy), y2: r(ln.cy), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0})),
        h('path', {name: 'ann-arrow', d: L.ann.arrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.ann.a.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const s = w => seg(u, ...W[w]);
    const ctxUpd = s('ctxUpdate');
    const v = {type: 1, result: 1, chain1: s('chain1'), chain2: s('chain2'), rows: [1, 1, 1], entryHl: L.isEntry ? s('chain2') : 0, innerHl: 0, noteHl: 0,
      entryMove: L.isEntry ? ctxUpd : 0, pinMove: L.isEntry ? 0 : ctxUpd};
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const sem = posed.semantic;
    // note text swap (pinpoint): old text leaves before the new one arrives
    if (!L.isEntry && ctx.show('all')) {
      const out = clamp(ctxUpd / 0.5), inn = clamp((ctxUpd - 0.5) / 0.5);
      nodes['ctx-art-foot'] = {opacity: r(1 - out, 3), transform: out > 0 && out < 1 ? T(0, -6 * out) : ''};
      nodes['ctx-art-foot-b'] = {opacity: r(inn, 3), transform: inn > 0 && inn < 1 ? T(0, 6 * (1 - inn)) : ''};
    }
    // lens
    const open = ease.inOutCubic(s('open'));
    const close = ease.inOutCubic(s('close'));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // substitution inside the lens: hook, eyelet and highlight move; the old hook stays as a ghost
    const mv = ease.inOutCubic(s('move'));
    const strikeP = s('strike');
    if (L.isEntry) {
      const cp = L.lensParts.copy;
      const hb = cp.hookAt(L.slots.b), ha = cp.hookAt(L.slots.a);
      const hookLocal = mix(hb, ha, mv);
      const fp = L.fp;
      const hookW = {x: fp.x + hookLocal.x * fp.k, y: fp.y + hookLocal.y * fp.k};
      const route = chainRoute(sem.outHook, hookW, L.pl.route2(sem.outHook, hookW));
      Object.assign(nodes, L.lensParts.lzChain.frame(route, 1).nodes);
      nodes['lz-fol-eyeG'] = {transform: mv > 0 ? T(0, ha.y - hb.y) : ''};
      nodes['lz-fol-eyeG'].transform = mv > 0 ? T(0, (ha.y - hb.y) * mv) : '';
      const a0 = cp.entries[L.slots.b].box, a1 = cp.entries[L.slots.a].box;
      nodes['lz-fol-hl-move'] = {transform: mv > 0 ? T(0, (a1.y - a0.y) * mv) : ''};
      nodes['lz-fol-hl'] = {opacity: 0.9};
      nodes['lz-ghost'] = {opacity: r(Math.min(1, mv * 3) * (strikeP > 0 ? 1 : 0), 3)};
      nodes['lz-strike'] = {opacity: strikeP > 0 ? 1 : 0, 'stroke-dasharray': '40 60', 'stroke-dashoffset': r(40 * (1 - strikeP))};
      nodes['lz-newnum'] = {opacity: r(s('after'), 3)};
    } else {
      const cp = L.lensParts.copy;
      const cs = L.stage.onCradle;
      const hookLocal = mix(cp.hookIn, cp.hookInR, mv);
      const hookW = {x: cs.x + hookLocal.x * cs.k, y: cs.y + hookLocal.y * cs.k};
      const route = chainRoute(sem.noteHook, hookW, L.pl.route1(sem.noteHook, hookW));
      Object.assign(nodes, L.lensParts.lzChain.frame(route, 1).nodes);
      Object.assign(nodes, cp.frame({x: 0, y: 0, k: 1, turn: 1, open: 1, shadow: 0.5}));
      delete nodes['lz-book'];
      nodes['lz-book-eyeIn'] = {transform: mv > 0 ? T((cp.hookInR.x - cp.hookIn.x) * mv, (cp.hookInR.y - cp.hookIn.y) * mv) : ''};
      nodes['lz-ghost'] = {opacity: r(Math.min(1, mv * 3) * (strikeP > 0 ? 1 : 0), 3)};
    }
    // annotation chips (single editorial annotation; leaves before the lens folds back)
    if (L.ann) {
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - seg(u, 0.73, 0.765), 3) : 0};
      // the backing holds the "before" chip, then opens (just before the new value fades in)
      // to make room for the "after" chip: nothing behind ever shows through a fading chip
      const gb = ease.inOutCubic(s('backGrow'));
      const b0 = L.ann.b.box, b1 = L.ann.box;
      const bx = lerp(b0.x, b1.x, gb), by = lerp(b0.y, b1.y, gb), bw = lerp(b0.w, b1.w, gb), bh = lerp(b0.h, b1.h, gb);
      nodes['ann-back'] = {opacity: r(s('before'), 3), d: roundRectPath(r(bx - 12), r(by - 12), r(bw + 24), r(bh + 24), 20)};
      nodes['ann-before'] = {opacity: r(s('before') * (1 - 0.45 * strikeP), 3)};
      L.ann.b.valueLines.forEach((ln, i) => {
        const len = ln.w + 12;
        nodes[`ann-strike-${i}`] = {opacity: strikeP > 0 ? 1 : 0, 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len * (1 - strikeP))};
      });
      nodes['ann-arrow'] = {opacity: r(s('arrow'), 3)};
      nodes['ann-after'] = {opacity: r(s('after'), 3)};
    }
    // the context caption belongs to the build beat; the lens period has a single annotation
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(s('ctxCaption') * (1 - s('ctxCaptionOut')), 3)};
    nodes.marker = {opacity: r(s('marker'), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.move[0] ? 'before' : u >= W.move[1] ? 'after' : 'changing';
    const ctxDatum = ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before';
    const valueOf = d => (d === 'after' ? p.afterValue : d === 'before' ? p.beforeValue : 'changing');
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    const hookNow = L.isEntry ? sem.folioHook : sem.inHook;
    const claspNow = L.isEntry ? sem.clasp2 : sem.clasp1;
    const reg = L.region;
    const within = q => q.x >= reg.x - 1 && q.x <= reg.x + reg.w + 1 && q.y >= reg.y - 1 && q.y <= reg.y + reg.h + 1;
    const hb = L.isEntry ? L.s0.folioHook : L.s0.inHook, ha = L.isEntry ? L.s1.folioHook : L.s1.inHook;
    return {
      nodes,
      semantic: {
        beat,
        focusTarget: p.focusTarget,
        lensOpen: r(lp, 3),
        datum,
        lensValue: valueOf(datum),
        contextDatum: ctxDatum,
        contextValue: valueOf(ctxDatum),
        contextHook: P2(hookNow),
        clasp: P2(claspNow),
        chainOnHook: Math.hypot(claspNow.x - hookNow.x, claspNow.y - hookNow.y) < 1.5 || (L.isEntry ? sem.chain2 < 1 : sem.chain1 < 1),
        beforeHook: P2(hb), afterHook: P2(ha),
        sourceContainsHooks: within(hb) && within(ha),
        source: {x: r(reg.x), y: r(reg.y), w: r(reg.w), h: r(reg.h)},
        lensZoom: r(L.dest.w / reg.w, 3),
        otherHookStill: L.isEntry ? JSON.stringify(sem.inHook) === JSON.stringify(L.s0.inHook) : JSON.stringify(sem.folioHook) === JSON.stringify(L.s0.folioHook),
        chain1: sem.chain1, chain2: sem.chain2,
        allReached: true,
      },
    };
  },
};

/** Before/after chip: label on top, value on its own bold line; returns the value line boxes. */
function valueChip(ctx, o) {
  const th = ctx.theme;
  const ls = o.small ? 21 : 23, vs = o.small ? 27 : 34;
  const padX = ls * 0.72, padY = ls * 0.44, gap = ls * 0.5;
  const inner = o.maxWidth - padX * 2;
  const lf = ctx.fit(o.label, {maxWidth: inner, size: ls, minSize: 19, maxLines: 3, weight: 600});
  const vf = ctx.fit(o.value, {maxWidth: inner, size: vs, minSize: 22, maxLines: 2, weight: 700});
  const w = Math.max(lf.width, vf.width) + padX * 2;
  const hh = padY + lf.height + gap + vf.height + padY;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const cx = x + w / 2;
  const vy = o.y + padY + lf.height + gap;
  const valueLines = vf.lines.map((line, i) => {
    const lw = ctx.measure(line, vf.size, 700, 'sans');
    return {x: cx - lw / 2, w: lw, cy: vy + i * vf.lineHeight + vf.size * 0.47};
  });
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, o.y, w, hh, 16), fill: o.fill, stroke: o.stroke, 'stroke-width': 2}),
    textBlock(lf, {x: cx, y: o.y + padY, anchor: 'middle', fill: th.inkSoft}),
    textBlock(vf, {x: cx, y: vy, anchor: 'middle', fill: o.valueColor}));
  return {node, box: {x, y: o.y, w, h: hh, cx, cy: o.y + hh / 2}, valueLines};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-10-inspect',
    title: 'Citation traceability — inspect and change the cited entry',
    titleEs: 'Trazabilidad de una cita — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Trazabilidad de una cita',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the traced trail (note → open treatise → original leaning on its box). A lens lifts a real copy of the original’s numbered entries where the chain hooks on; the cited entry is substituted (before → after): the clasp, eyelet and highlight move, the old hook remains as a dashed ghost with its number struck through. The lens returns and the context chain ends on the new entry with a changed marker. Alternative target: the page the note cites.',
    tags: ['citation', 'traceability', 'inspect', 'lens', 'before-after', 'substitution', 'entry', 'pinpoint', 'chain', 'original'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/trazabilidad-de-una-cita.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
