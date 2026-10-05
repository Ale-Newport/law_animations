/**
 * LAW-0050 — Historial de una norma · mechanism
 *
 * Storyboard (exploded view, not a row of boxes):
 *  0.00–0.18  separate: the version plates of the provision lift apart along
 *             a vertical TIME axis (oldest at the bottom); the search box,
 *             library shelf, consolidated file, date flag and research card
 *             appear around the stack.
 *  0.18–0.43  relate: only the supplied relationships are drawn, each styled
 *             by kind (plain relation = no arrow; causal only if supplied),
 *             anchored to real edges — plate connectors end on the plate's
 *             rhombus edge; where the version labels stand between the stack
 *             and the date column (landscape), the date link ends on the
 *             marked version's label, which a lead line joins to its plate.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order; each
 *             component pulses as it is reached and the focus component
 *             enlarges. When the tracer runs from the layers to the date,
 *             the date plane cuts the stack and the layer the author marks
 *             for the date is outlined; later plates become ghosts.
 *  0.75–1.00  gather: origin (search / library / file), transformation
 *             (layers + date plane) and state (selected / later) stay visible.
 * @module animations/research/LAW-0050
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, connector, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {bookshelf, isoPlate, rhombusAnchor, searchBar, consolidatedFile, researchCard, versionColor, SANS} from './kits/historial-de-una-norma.js';
import {historialFields, HISTORIAL_DEFAULTS, HISTORIAL_STRINGS, selectedIndex} from './kits/historial-fields.js';

const ID = 'LAW-0050';
const DURATION = 7000;
const IDS = ['search', 'library', 'document', 'layers', 'date', 'card'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const sceneSchema = {
  ...historialFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...HISTORIAL_DEFAULTS,
  elements: [
    {id: 'search', label: 'Search box'},
    {id: 'library', label: 'Library shelf'},
    {id: 'document', label: 'Consolidated file'},
    {id: 'layers', label: 'Temporal layers (one per version)'},
    {id: 'date', label: 'Selected date'},
    {id: 'card', label: 'Research card'},
  ],
  relationships: [
    {from: 'search', to: 'library', kind: 'communication', label: 'looks up'},
    {from: 'library', to: 'document', kind: 'relation', label: 'holds'},
    {from: 'document', to: 'layers', kind: 'relation', label: 'kept as versions'},
    {from: 'date', to: 'layers', kind: 'sequence', label: 'marks one layer'},
    {from: 'card', to: 'date', kind: 'relation', label: 'records'},
  ],
  focusElement: 'layers',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['search', 'library', 'document', 'layers', 'date', 'card'],
};

/** Components of the origin chain (left / top) and of the date column (right). */
const LEFT_IDS = new Set(['search', 'library', 'document']);
const RIGHT_IDS = new Set(['date', 'card']);
/** The research card art is drawn narrower and scaled up so its lines read at the flag's size. */
const CARD_K = 1.12;

/**
 * Hand-placed component geometry per shape (design units). Each design space
 * has the proportions of its caption-safe box. The origin chain (search box →
 * library shelf → consolidated file) is spaced so every connector has real
 * length and its caption can sit BESIDE it; the date flag and the research
 * card share a column right of the stack, with a free gap for the date link's
 * caption. `text` scales label sizes where the design scale is lowest.
 *  - landscape: origin chain as a left column, plate labels right of the stack;
 *  - square / portrait: origin chain across the top (file right above the
 *    stack), plate labels left of the stack, date column right of it.
 */
const PLACES = {
  landscape: {
    size: [1800, 860], text: 1,
    search: {x: 30, y: 16, w: 500},
    library: {x: 30, y: 188, w: 320, h: 216},
    document: {x: 50, y: 506, w: 262, h: 200},
    axisCap: 'right',
    stack: {cx: 905, bottom: 722, top: 108, a: 232, b: 103, t: 16, gapMax: 175},
    labels: {side: 'right', x: 1156, w: 232},
    column: {x: 1558, w: 232, top: 14},
    chips: {search: ['right', 'belowR', 'below'], library: ['right', 'belowR', 'below'], document: ['below', 'right', 'belowR']},
    legendY: 838,
  },
  square: {
    size: [1300, 1110], text: 1.08,
    search: {x: 24, y: 16, w: 560},
    library: {x: 24, y: 196, w: 300, h: 222},
    document: {x: 684, y: 206, w: 236, h: 184},
    stack: {cx: 626, bottom: 930, top: 510, a: 205, b: 90, t: 14, gapMax: 175},
    labels: {side: 'left', x: 16, w: 340},
    column: {x: 1040, w: 246, top: 14},
    chips: {search: ['belowR', 'right', 'below'], library: ['below', 'belowL', 'belowR'], document: ['right', 'above', 'below', 'belowR']},
    legendY: 1082,
  },
  portrait: {
    size: [1200, 1720], text: 1,
    search: {x: 30, y: 18, w: 1140},
    library: {x: 30, y: 206, w: 360, h: 260},
    document: {x: 650, y: 206, w: 270, h: 236},
    stack: {cx: 575, bottom: 1440, top: 660, a: 205, b: 96, t: 16, gapMax: 210},
    labels: {side: 'left', x: 16, w: 300},
    column: {x: 952, w: 232, top: 520},
    chips: {search: ['belowR', 'belowL', 'below'], library: ['below', 'belowL', 'belowR'], document: ['right', 'below', 'belowR']},
    legendY: 1690,
  },
};

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const TS = Pl.text;
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const n = p.versions.length;
    const sel = selectedIndex(p);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const bounds = {x: 6, y: 6, w: S.w - 12, h: Pl.legendY - 26};

    // --- search / library / document
    const sb = searchBar(ctx, {...Pl.search, query: p.query});
    const lib = bookshelf(ctx, {prefix: 'lib', ...Pl.library, rows: 3, slotRow: -1, slotW: 50, slotH: 100, sign: p.sources[0]});
    const libBox = lib.box;
    const doc = consolidatedFile(ctx, {...Pl.document, n, label: p.citations[0]});

    // --- stack geometry (centred in its band when the plate gap is capped)
    const St = Pl.stack;
    const span = St.bottom - St.top - 2 * St.b - St.t;
    const gap = Math.min(St.gapMax, span / Math.max(1, n - 1));
    const shift = n > 1 ? (span - gap * (n - 1)) / 2 : span / 2;
    const plateY = i => St.bottom - shift - St.b - St.t - i * gap; // centre of top face of plate i
    const plates = p.versions.map((v, i) => isoPlate(ctx, {prefix: `pl${i}`, a: St.a, b: St.b, t: St.t, color: versionColor(ctx, i), index: i}));
    const dateY = sel < n - 1 ? plateY(sel) - gap / 2 : plateY(sel) - Math.min(gap / 2, 90);
    const axisTop = plateY(n - 1) - St.b - 56;
    const axisBottom = plateY(0) + St.b + St.t + 36;
    const stackBox = {x: St.cx - St.a, y: plateY(n - 1) - St.b, w: St.a * 2, h: plateY(0) + St.b + St.t - (plateY(n - 1) - St.b)};
    const pa = St.a * 1.14, pb = St.b * 1.14;
    const plane = g({name: 'plane', opacity: 0, transform: T(St.cx, dateY)},
      h('path', {d: `M0 ${-pb}L${pa} 0L0 ${pb}L${-pa} 0Z`, fill: th.accentSoft, 'fill-opacity': 0.2, stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '14 9'}));
    const axisCap = showAll ? ctx.fit(t.timeAxis, {maxWidth: 200, size: 26 * TS, maxLines: 1, weight: 600}) : null;
    const axis = g({name: 'axis'},
      h('line', {x1: St.cx, x2: St.cx, y1: axisBottom, y2: axisTop, stroke: th.fg, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('path', {d: `M${St.cx} ${axisTop - 18}l-12 22h24z`, fill: th.fg}),
      axisCap ? textBlock(axisCap, {x: Pl.axisCap === 'right' ? St.cx + 18 : St.cx - 18, y: axisTop - 12, anchor: Pl.axisCap === 'right' ? 'start' : 'end', fill: th.fgSoft, italic: true}) : null);
    const axisCapBox = axisCap ? {x: Pl.axisCap === 'right' ? St.cx + 18 : St.cx - 18 - axisCap.width, y: axisTop - 12, w: axisCap.width, h: axisCap.height} : null;

    // plates are rhombi: test boxes against the real shapes (and the time axis)
    const hitsStack = b => {
      const pad = 8;
      const q = {x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2};
      if (q.x < St.cx && q.x + q.w > St.cx && q.y < axisBottom && q.y + q.h > axisTop - 30) return true;
      const samples = [];
      for (let ix = 0; ix <= 6; ix++) for (let iy = 0; iy <= 3; iy++) samples.push({x: q.x + (q.w * ix) / 6, y: q.y + (q.h * iy) / 3});
      for (let i = 0; i < n; i++) {
        const cy = plateY(i) + St.t / 2, bb = St.b + St.t / 2;
        if (samples.some(pt => Math.abs(pt.x - St.cx) / St.a + Math.abs(pt.y - cy) / bb <= 1)) return true;
        const verts = [{x: St.cx, y: cy - bb}, {x: St.cx + St.a, y: cy}, {x: St.cx, y: cy + bb}, {x: St.cx - St.a, y: cy}];
        if (verts.some(v => v.x >= q.x && v.x <= q.x + q.w && v.y >= q.y && v.y <= q.y + q.h)) return true;
      }
      return false;
    };
    const area = (a, b, m = 0) => {
      const w = Math.min(a.x + a.w, b.x + b.w + m) - Math.max(a.x, b.x - m);
      const hh = Math.min(a.y + a.h, b.y + b.h + m) - Math.max(a.y, b.y - m);
      return w > 0 && hh > 0 ? w * hh : 0;
    };
    const inBounds = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    const inBox = (pt, b, m) => pt.x > b.x - m && pt.x < b.x + b.w + m && pt.y > b.y - m && pt.y < b.y + b.h + m;
    /** first clear candidate in preference order; otherwise the one with the least overlap */
    const placeBest = (text, cands, opts, obst, dots = []) => {
      let best = null;
      for (let k = 0; k < cands.length; k++) {
        const c = cands[k];
        const ch = chip(ctx, text, {...opts, ...c});
        const b = ch.box;
        let pen = inBounds(b) ? 0 : 1e6;
        for (const q of obst) pen += area(b, q, 8) * 4;
        if (hitsStack(b)) pen += 5000;
        pen += dots.filter(d => inBox(d, b, 8)).length * 400;
        pen += (c.cost ?? k * 30);
        if (!best || pen < best.pen) best = {ch, pen};
      }
      return best.ch;
    };

    // plate labels (version label + start date), beside each plate; 3 lines rather than an ellipsis
    const L = Pl.labels;
    // two-part chip: the version label, then its start date on its own line (each wraps rather than truncates)
    const plateChip = (i, y) => {
      const v = p.versions[i];
      const size = 26 * TS, padX = size * 0.6, padY = size * 0.38;
      const lf = ctx.fit(v.label, {maxWidth: L.w - padX * 2, size, minSize: 19, maxLines: 2, weight: 700});
      const df = ctx.fit(v.from, {maxWidth: L.w - padX * 2, size: size * 0.88, minSize: 17, maxLines: 2, weight: 500});
      const w = Math.max(lf.width, df.width) + padX * 2, hh = lf.height + 10 + df.height + padY * 2;
      const x = L.side === 'right' ? L.x : L.x + L.w - w;
      const node = g({name: `plab${i}-chip`},
        h('path', {d: roundPath({x, y, w, h: hh}, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: versionColor(ctx, i), 'stroke-width': 2.5}),
        textBlock(lf, {x: x + w / 2, y: y + padY, anchor: 'middle', fill: th.ink}),
        textBlock(df, {x: x + w / 2, y: y + padY + lf.height + 10, anchor: 'middle', fill: th.inkSoft}));
      return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}};
    };
    const plateLabels = p.versions.map((v, i) => {
      if (!showKey) return null;
      const c = plateChip(i, 0);
      return {c, y: plateY(i) - c.box.h / 2};
    });
    // keep the label column in order and without overlaps (push apart, then clamp)
    const order = plateLabels.map((x, i) => i).filter(i => plateLabels[i]).sort((a, b) => plateLabels[b].y - plateLabels[a].y);
    for (let k = 1; k < order.length; k++) {
      const up = plateLabels[order[k - 1]], cur = plateLabels[order[k]];
      if (cur.y + cur.c.box.h + 10 > up.y) cur.y = up.y - cur.c.box.h - 10;
    }
    const plateLab = plateLabels.map((x, i) => {
      if (!x) return null;
      const c = plateChip(i, x.y);
      const lx = L.side === 'right' ? St.cx + St.a + 6 : St.cx - St.a - 6;
      const edgeX = L.side === 'right' ? c.box.x : c.box.x + c.box.w;
      const lead = h('line', {x1: lx, y1: plateY(i), x2: edgeX, y2: c.box.cy, stroke: versionColor(ctx, i), 'stroke-width': 3});
      const sel2 = h('path', {name: `plab${i}-sel`, d: roundPath(c.box, 8), fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
      const later = h('path', {name: `plab${i}-later`, d: roundPath(c.box, 8), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '9 6', opacity: 0});
      return {node: g({name: `plab${i}`}, lead, c.node, sel2, later), box: c.box};
    });

    // --- date flag (element "date") at the plane height; the date wraps rather than truncates
    const F = Pl.column;
    const dateTextFit = showKey ? (() => {
      const one = ctx.fit(p.dates.selected, {maxWidth: F.w - 36, size: 32 * TS, minSize: 24, maxLines: 1, weight: 800});
      return one.truncated ? ctx.fit(p.dates.selected, {maxWidth: F.w - 36, size: 30 * TS, minSize: 21, maxLines: 2, weight: 800}) : one;
    })() : null;
    const dateLabFit = showAll && label('date') ? ctx.fit(label('date'), {maxWidth: F.w - 36, size: 22 * TS, minSize: 17, maxLines: 3, weight: 600}) : null;
    const flagH = 30 + (dateLabFit ? dateLabFit.height + 8 : 0) + (dateTextFit ? dateTextFit.height : 24);
    const flagBox = {x: F.x, y: Math.max(F.top, Math.min(Pl.legendY - 40 - flagH, dateY - flagH / 2)), w: F.w, h: flagH};
    // --- research card (element "card"): below the flag; at the top of the column when it
    // is linked to the origin chain (its link then runs above everything, never behind the flag)
    const cardArt = researchCard(ctx, {prefix: 'card-art', w: F.w / CARD_K, h: 150, header: label('card') || t.cardHeader, citation: p.citations[0], citLines: 4, dateLabel: t.selectedDate, date: p.dates.selected, clip: false});
    const cardH = cardArt.h * CARD_K;
    const cardLinksLeft = p.relationships.some(rl => (rl.from === 'card' && LEFT_IDS.has(rl.to)) || (rl.to === 'card' && LEFT_IDS.has(rl.from)));
    // above the flag, the card keeps a gap tall enough for the card → flag caption beside its link
    const gapAbove = Math.max(90, Math.min(150, flagBox.y - F.top - cardH));
    const yBelow = flagBox.y + flagBox.h + 100, yAbove = flagBox.y - gapAbove - cardH;
    const fitsBelow = yBelow + cardH <= Pl.legendY - 36, fitsAbove = yAbove >= F.top;
    let cardY;
    if (cardLinksLeft) {
      cardY = F.top;
      // the flag keeps clear of the card (its link then leaves from the flag's upper part)
      if (flagBox.y < cardY + cardH + 28) flagBox.y = cardY + cardH + 28;
    } else cardY = fitsBelow ? yBelow : fitsAbove ? yAbove : Math.max(F.top, Pl.legendY - 36 - cardH);
    const cardBox = {x: F.x, y: cardY, w: F.w, h: cardH};
    const cardNode = g({name: 'el-card', transform: T(cardBox.x, cardBox.y)},
      g({name: 'el-card-body'}, g({transform: `scale(${CARD_K}) translate(0 ${r(-cardArt.top)})`}, cardArt.node)));
    const flag = g({name: 'el-date'}, g({name: 'el-date-body'},
      h('path', {d: roundPath({x: flagBox.x + 6, y: flagBox.y + 8, w: F.w, h: flagH}, 12), fill: th.shadow}),
      h('path', {d: roundPath(flagBox, 12), fill: th.card, stroke: th.accent, 'stroke-width': 4}),
      h('rect', {x: flagBox.x, y: flagBox.y + 10, width: 10, height: flagH - 20, rx: 4, fill: th.accent}),
      dateLabFit ? textBlock(dateLabFit, {x: flagBox.x + 24, y: flagBox.y + 14, fill: th.ink}) : null,
      dateTextFit ? textBlock(dateTextFit, {x: flagBox.x + 24, y: flagBox.y + 16 + (dateLabFit ? dateLabFit.height + 8 : 0), fill: th.accent}) : h('rect', {x: flagBox.x + 24, y: flagBox.y + flagH / 2 - 9, width: F.w * 0.5, height: 18, rx: 5, fill: th.accent})));


    // --- element geometry for anchoring
    const layersEl = {
      box: stackBox,
      anchor: (toward, relTo) => {
        if (relTo === 'date') {
          // land on the selected plate's corner that faces the flag (never occluded by the plate above)
          const side = toward.x >= St.cx ? 1 : -1;
          return {x: St.cx + side * (St.a + 10), y: plateY(sel)};
        }
        return rhombusAnchor({x: St.cx, y: plateY(nearestPlate(toward.y))}, St.a, St.b, toward, 10);
      },
      center: {x: St.cx, y: (plateY(0) + plateY(n - 1)) / 2},
    };
    function nearestPlate(y) {
      let best = 0;
      for (let i = 0; i < n; i++) if (Math.abs(plateY(i) - y) < Math.abs(plateY(best) - y)) best = i;
      return best;
    }
    const els = {
      search: {box: sb.box},
      library: {box: libBox},
      document: {box: doc.box},
      layers: layersEl,
      date: {box: flagBox},
      card: {box: cardBox},
    };
    const onAnyPlate = (pt, pad) => {
      for (let k = 0; k < n; k++) {
        if (Math.abs(pt.x - St.cx) / (St.a + pad) + Math.abs(pt.y - plateY(k) - St.t / 2) / (St.b + St.t / 2 + pad * 0.5) <= 1) return true;
      }
      return false;
    };
    const centerOf = id => els[id].center || {x: els[id].box.x + els[id].box.w / 2, y: els[id].box.y + els[id].box.h / 2};
    const anchorOf = (id, toward, other, pad) => (els[id].anchor ? els[id].anchor(toward, other) : edgeAnchor(els[id].box, toward, pad));
    const endPad = (rel, id) => (rel.to === id && rel.kind !== 'relation' ? 14 : 8);

    // --- connectors (only the supplied relationships)
    // free vertical gap left of the date column (the date link's caption lives there)
    const gapX0 = L.side === 'right' ? L.x + L.w : St.cx + St.a + 10;
    const gapX1 = F.x;
    // when the version labels stand between the stack and the date column (landscape), the date
    // link ends on the marked version's label (joined to its plate by the label's lead line)
    // instead of running behind that label into the plate's corner
    const selLab = L.side === 'right' ? plateLab[sel] : null;
    let dateChipEnd = null;
    const built = p.relationships.map((rel, i) => {
      const name = `rel-c${i}`, kind = rel.kind, color = kindColor(ctx, rel.kind);
      const dateLink = (rel.from === 'date' && rel.to === 'layers') || (rel.from === 'layers' && rel.to === 'date');
      if (dateLink) {
        // from the flag's left edge at the plane height into the marked plate's corner (or its label)
        const flagEnd = {x: flagBox.x - endPad(rel, 'date'), y: Math.max(flagBox.y + 12, Math.min(flagBox.y + flagBox.h - 12, dateY))};
        const corner = selLab
          ? {x: selLab.box.x + selLab.box.w + endPad(rel, 'layers'), y: selLab.box.cy}
          : {x: St.cx + St.a + 10, y: plateY(sel)};
        if (selLab) dateChipEnd = corner;
        const mx = (corner.x + flagEnd.x) / 2;
        const cf = {x: mx, y: flagEnd.y}, cc = {x: mx, y: corner.y};
        const fromDate = rel.from === 'date';
        return {rel, dateLink, c: connector(ctx, {name, kind, color, from: fromDate ? flagEnd : corner, to: fromDate ? corner : flagEnd, c1: fromDate ? cf : cc, c2: fromDate ? cc : cf})};
      }
      const cross = (RIGHT_IDS.has(rel.from) && LEFT_IDS.has(rel.to)) || (RIGHT_IDS.has(rel.to) && LEFT_IDS.has(rel.from));
      if (cross) {
        // date column ↔ origin chain: runs ABOVE the stack and the plate labels (never behind the flag)
        const rId = RIGHT_IDS.has(rel.from) ? rel.from : rel.to, lId = rId === rel.from ? rel.to : rel.from;
        const rb = els[rId].box, lb = els[lId].box;
        let pr, pl, c1, c2;
        if (shape === 'portrait' && lId === 'search') {
          // straight up the free right margin into the underside of the full-width search bar
          const x = rb.x + rb.w - 28;
          pr = {x, y: rb.y - endPad(rel, rId)}; pl = {x, y: lb.y + lb.h + endPad(rel, lId)};
          c1 = {x, y: lerp(pr.y, pl.y, 0.33)}; c2 = {x, y: lerp(pr.y, pl.y, 0.66)};
        } else {
          pr = {x: rb.x - endPad(rel, rId), y: rb.y + Math.min(rb.h / 2, 18)};
          pl = {x: lb.x + lb.w + endPad(rel, lId), y: lb.y + Math.min(lb.h / 2, 18)};
          c1 = {x: lerp(pr.x, pl.x, 0.4), y: pr.y}; c2 = {x: lerp(pr.x, pl.x, 0.6), y: pl.y};
        }
        const fwd = rel.from === rId;
        return {rel, cross: true, c: connector(ctx, {name, kind, color, from: fwd ? pr : pl, to: fwd ? pl : pr, c1: fwd ? c1 : c2, c2: fwd ? c2 : c1})};
      }
      const toward = centerOf(rel.to), from0 = centerOf(rel.from);
      const from = anchorOf(rel.from, toward, rel.to, 8);
      const to = anchorOf(rel.to, from0, rel.from, endPad(rel, rel.to));
      // choose the bend whose curve hits the fewest plates / unrelated components / chips and never leaves the frame
      const base = rel.kind === 'communication' ? -0.16 : 0.08;
      const others = [...Object.entries(els).filter(([id]) => id !== rel.from && id !== rel.to && id !== 'layers').map(([, e]) => e.box), ...plateLab.filter(Boolean).map(x => x.box)];
      let best = null;
      for (const bend of [0, base, -base, 0.25, -0.25, 0.4, -0.4]) {
        const cand = connector(ctx, {name, from, to, kind, bend, color});
        let score = Math.abs(bend) * 2;
        for (let q = 2; q <= 38; q++) {
          const pt = cand.at(q / 40);
          if (pt.x < 10 || pt.y < 10 || pt.x > S.w - 10 || pt.y > Pl.legendY - 30) score += 100;
          const touchesLayers = rel.from === 'layers' || rel.to === 'layers';
          if (!touchesLayers ? onAnyPlate(pt, 6) : (q > 5 && q < 35 && onAnyPlate(pt, -6))) score += 3;
          if (others.some(b => inBox(pt, b, 4))) score += 2;
        }
        if (!best || score < best.score) best = {cand, score};
      }
      return {rel, dateLink, c: best.cand};
    });

    // --- element name chips, next to their own element (first clear side);
    // connectors are laid first: a chip must never sit on a link
    const linkDots = built.flatMap(x => Array.from({length: 31}, (_, k) => x.c.at(k / 30)));
    const objBoxes = [sb.box, libBox, doc.box, flagBox, cardBox, ...(axisCapBox ? [axisCapBox] : []), ...plateLab.filter(Boolean).map(x => x.box)];
    const nameChips = [];
    const elChip = (id, box, prefer) => {
      if (!showKey || !label(id)) return null;
      const size = 28 * TS;
      const mw = Math.max(box.w, 300);
      const probe = chip(ctx, label(id), {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, maxLines: 2});
      const hh = probe.box.h;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      const all = {
        below: {x: cx, y: box.y + box.h + 12, anchor: 'middle'},
        belowL: {x: box.x, y: box.y + box.h + 12, anchor: 'start'},
        belowR: {x: box.x + box.w, y: box.y + box.h + 12, anchor: 'end'},
        right: {x: box.x + box.w + 16, y: cy - hh / 2, anchor: 'start'},
        left: {x: box.x - 16, y: cy - hh / 2, anchor: 'end'},
        above: {x: cx, y: box.y - hh - 8, anchor: 'middle'},
      };
      // each side is tried at full width, then as a narrower two- or three-line chip (keeps it off nearby links)
      const narrow = 330 * TS;
      const cands = [...prefer.map((k, i) => ({...all[k], cost: i * 30})), ...(mw > narrow ? prefer.map((k, i) => {
        const pr = chip(ctx, label(id), {x: 0, y: 0, anchor: 'middle', maxWidth: narrow, size, maxLines: 3});
        const c0 = {...all[k], maxWidth: narrow, maxLines: 3, cost: 60 + i * 30};
        if (k === 'right' || k === 'left') c0.y = Math.max(bounds.y + 2, cy - pr.box.h / 2);
        if (k === 'above') c0.y = box.y - pr.box.h - 8;
        return c0;
      }) : [])];
      const obst = [...objBoxes.filter(q => q !== box), ...nameChips];
      const c = placeBest(label(id), cands, {maxWidth: mw, size, maxLines: 2, name: `lab-${id}`}, obst, linkDots);
      nameChips.push(c.box);
      return c;
    };
    const labSearch = elChip('search', sb.box, Pl.chips.search);
    const labLib = elChip('library', libBox, Pl.chips.library);
    const labDoc = elChip('document', doc.box, Pl.chips.document);
    const layMax = Math.min(St.a * 2, 440);
    const layProbe = showKey && label('layers') ? chip(ctx, label('layers'), {x: 0, y: 0, anchor: 'end', maxWidth: layMax, size: 28 * TS, maxLines: 3}) : null;
    const labLayers = layProbe ? placeBest(label('layers'), [
      {x: St.cx - 26, y: plateY(0) + St.b + St.t + 6, anchor: 'end'},
      {x: St.cx + 26, y: plateY(0) + St.b + St.t + 6, anchor: 'start'},
      {x: St.cx - St.a * 0.55, y: plateY(0) + St.b * 0.5 + St.t - layProbe.box.h / 2 + 30, anchor: 'end'},
      {x: St.cx + St.a * 0.55, y: plateY(0) + St.b * 0.5 + St.t - layProbe.box.h / 2 + 30, anchor: 'start'},
      {x: St.cx - St.a - 16, y: plateY(0) - layProbe.box.h / 2, anchor: 'end'},
    ], {maxWidth: layMax, size: 28 * TS, maxLines: 3, name: 'lab-layers'}, [...objBoxes, ...nameChips], linkDots) : null;
    if (labLayers) nameChips.push(labLayers.box);

    // --- relation captions: beside their own connector (never covering most of it, never over
    // its ends, a component, a chip, a plate or another link); the date link's caption sits on
    // the link in the free gap left of the date column
    const chipBoxes = [...nameChips, ...plateLab.filter(Boolean).map(x => x.box)];
    const ends = built.flatMap(x => [x.c.from, x.c.to]);
    const dotsOf = built.map(x => Array.from({length: 25}, (_, k) => x.c.at(k / 24)));
    const placed = [];
    const placeCaption = ({rel, c, dateLink}, i) => {
      let lab = null, leader = null;
      if (showAll) {
        const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
        const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len, py = dx / len;
        const cands = [];
        if (dateLink && dateChipEnd) {
          // the link is short (label → flag): its caption sits just above (or below) it in the gap
          // between the version labels and the date column, never on the link itself
          const x0 = Math.min(c.from.x, c.to.x) + 4, x1 = Math.max(c.from.x, c.to.x) - 4;
          const along = Array.from({length: 41}, (_, q) => c.at(q / 40));
          const yTop = Math.min(...along.map(pt => pt.y)), yBot = Math.max(...along.map(pt => pt.y));
          const base = c.at(0.5);
          // full size on two or three lines first; shrink only when it still does not fit
          for (const [sz, lines, minSize] of [[25 * TS, 2, 23 * TS], [25 * TS, 3, 23 * TS], [22 * TS, 3, undefined]]) {
            const mw = Math.max(120, x1 - x0);
            const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: sz, minSize, maxLines: lines, weight: 600});
            const cx = Math.max(x0 + probe.box.w / 2, Math.min(x1 - probe.box.w / 2, base.x));
            // leader foot: the point of the link right under (or over) the caption's centre
            const foot = along.reduce((a, b) => (Math.abs(b.x - cx) < Math.abs(a.x - cx) ? b : a));
            cands.push({x: cx, y: yTop - 12 - probe.box.h, size: sz, minSize, maxLines: lines, maxWidth: mw, cost: 0, base: foot});
            cands.push({x: cx, y: yBot + 12, size: sz, minSize, maxLines: lines, maxWidth: mw, cost: 40, base: foot});
          }
        } else if (dateLink) {
          // arrowhead at the flag end stays visible: the caption keeps clear of it
          const arrowAtFlag = rel.to === 'date' && rel.kind !== 'relation';
          const g1 = gapX1 - (arrowAtFlag ? 34 : 12), g0 = gapX0 + 8;
          const gx = (g0 + g1) / 2;
          let bt = 0.5, bd = 1e9;
          for (let q = 0; q <= 60; q++) { const pt = c.at(q / 60); const d = Math.abs(pt.x - gx) + (pt.x < g0 || pt.x > g1 ? 1000 : 0); if (d < bd) { bd = d; bt = q / 60; } }
          const base = c.at(bt);
          for (const [sz, lines] of [[25 * TS, 2], [22 * TS, 3]]) cands.push({x: gx, y: base.y, size: sz, maxLines: lines, maxWidth: Math.max(100, g1 - g0), cost: 0, base, centre: true});
        }
        const bases = [c.mid, c.at(0.35), c.at(0.65)];
        for (const [sz, lines, mw, extra] of [[25 * TS, 2, 260 * TS, 0], [22 * TS, 3, 190 * TS, 150]]) {
          bases.forEach((base, bi) => {
            for (let d = 0; d <= 380; d += 20) {
              for (const sg of d ? [-1, 1] : [1]) cands.push({x: base.x + px * d * sg, y: base.y - sz * 0.95 + py * d * sg, size: sz, maxLines: lines, maxWidth: mw, cost: extra + d * 1.2 + bi * 25, base});
            }
          });
          // right beside a steep link (level with it, just clear of the stroke): keeps the caption
          // next to its own link where the perpendicular offsets run into the stack or a component
          if (Math.abs(dy) > Math.abs(dx) * 0.6) {
            const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: sz, maxLines: lines, weight: 600});
            [c.at(0.2), c.at(0.3), c.at(0.4), c.at(0.6), c.at(0.7), c.at(0.8)].forEach((base, bi) => {
              for (const sg of [1, -1]) {
                for (const gap of [16, 36]) cands.push({x: base.x + sg * (probe.box.w / 2 + gap), y: base.y - probe.box.h / 2, size: sz, maxLines: lines, maxWidth: mw, cost: extra + 30 + gap + bi * 6, base});
              }
            });
          }
        }
        let best = null;
        for (const cd of cands) {
          const opts = {anchor: 'middle', maxWidth: cd.maxWidth, size: cd.size, minSize: cd.minSize, maxLines: cd.maxLines, fill: th.card, stroke: kindColor(ctx, rel.kind), name: `rel-l${i}`, weight: 600};
          let ch = chip(ctx, text, {...opts, x: cd.x, y: cd.y});
          if (cd.centre) ch = chip(ctx, text, {...opts, x: cd.x, y: cd.y - ch.box.h / 2});
          const b = ch.box;
          let pen = inBounds(b) ? 0 : 1e6;
          if (ch.fit.truncated) pen += 800;
          for (const q of [sb.box, libBox, doc.box, flagBox, cardBox, ...chipBoxes, ...placed, ...(axisCapBox ? [axisCapBox] : [])]) pen += area(b, q, 8) * 4;
          if (hitsStack(b)) pen += 5000;
          // no connector end under a caption (the date link's own ends only need to stay just outside it)
          if (ends.some(e => inBox(e, b, 12) && !(cd.centre && (e === c.from || e === c.to) && !inBox(e, b, 3)))) pen += 3000;
          // a caption must not hide its own link: at most about a third of it may pass under the chip
          if (!cd.centre) {
            const own = dotsOf[i].slice(1, -1);
            const cov = own.filter(d => inBox(d, b, 3)).length / own.length;
            if (cov > 0.34) pen += 3000 * (cov - 0.34);
          }
          dotsOf.forEach((ds, j) => { if (j !== i) pen += ds.filter(d => inBox(d, b, 6)).length * 300; });
          pen += cd.cost;
          if (!best || pen < best.pen) best = {pen, ch, cd};
          if (pen === 0) break;
        }
        lab = best.ch;
        const bx = best.cd.base;
        const ex = Math.max(lab.box.x, Math.min(bx.x, lab.box.x + lab.box.w)), ey = Math.max(lab.box.y, Math.min(bx.y, lab.box.y + lab.box.h));
        // short dotted leader only when the caption does not touch its link
        if (Math.hypot(ex - bx.x, ey - bx.y) > 16) leader = {x1: bx.x, y1: bx.y, x2: ex, y2: ey};
        placed.push(lab.box);
      }
      return {rel, c, lab, leader};
    };
    const conns = built.map((x, i) => placeCaption(x, i));
    const relNode = g({name: 'rel'}, conns.map(x => x.c.node));
    const relLabels = g({name: 'rel-labels'}, conns.map((x, i) => x.lab && g({name: `rel-lg${i}`, opacity: 0},
      x.leader ? h('line', {...x.leader, stroke: kindColor(ctx, x.rel.kind), 'stroke-width': 2.5, 'stroke-dasharray': '3 5'}) : null,
      x.leader ? h('circle', {cx: x.leader.x1, cy: x.leader.y1, r: 4, fill: kindColor(ctx, x.rel.kind)}) : null,
      x.lab.node)));

    // --- tracer route through the supplied order: along the drawn links, and around the
    // outline of a component between two of its links (never across its text)
    const around = (id, a, b) => {
      if (id === 'layers') return aroundLayers(a, b);
      if (!els[id]) return [];
      return aroundBox(els[id].box, a, b);
    };
    // through the stack: along the outline of the plate a link lands on to its right vertex, down/up the
    // right side to the marked plate's corner and, when the date link ends on the marked label, along
    // that label's lead line and round the label (never across the plates' faces or the label's text)
    const hub = {x: St.cx + St.a + 10, y: plateY(sel)};
    const toHub = pt => {
      if (dateChipEnd && Math.hypot(pt.x - dateChipEnd.x, pt.y - dateChipEnd.y) < 2) {
        const q = selLab.box;
        return [...aroundBox(q, pt, {x: q.x - 10, y: q.cy}), hub];
      }
      let k = 0, bestD = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(Math.abs(pt.x - St.cx) / (St.a + 10) + Math.abs(pt.y - plateY(i)) / (St.b + 5) - 1);
        if (d < bestD) { bestD = d; k = i; }
      }
      const yk = plateY(k);
      const right = {x: St.cx + St.a + 10, y: yk};
      const via = pt.x >= St.cx - 1 ? [] : [{x: St.cx, y: pt.y <= yk ? yk - St.b - 5 : yk + St.b + 5}];
      return [pt, ...via, right, hub];
    };
    function aroundLayers(a, b) {
      return [...toHub(a), ...toHub(b).reverse()];
    }
    function aroundBox(q, a, b) {
      const m = 10;
      const R = {x: q.x - m, y: q.y - m, w: q.w + 2 * m, h: q.h + 2 * m};
      const P = 2 * (R.w + R.h);
      const sOf = pt => {
        const cx = Math.max(R.x, Math.min(R.x + R.w, pt.x)), cy = Math.max(R.y, Math.min(R.y + R.h, pt.y));
        const dl = Math.abs(cx - R.x), dr = Math.abs(cx - R.x - R.w), dt = Math.abs(cy - R.y), db = Math.abs(cy - R.y - R.h);
        const mn = Math.min(dl, dr, dt, db);
        if (mn === dt) return cx - R.x;
        if (mn === dr) return R.w + (cy - R.y);
        if (mn === db) return R.w + R.h + (R.x + R.w - cx);
        return 2 * R.w + R.h + (R.y + R.h - cy);
      };
      const at = sv => {
        let v = ((sv % P) + P) % P;
        if (v <= R.w) return {x: R.x + v, y: R.y};
        v -= R.w; if (v <= R.h) return {x: R.x + R.w, y: R.y + v};
        v -= R.h; if (v <= R.w) return {x: R.x + R.w - v, y: R.y + R.h};
        v -= R.w; return {x: R.x, y: R.y + R.h - v};
      };
      const s0 = sOf(a), s1 = sOf(b);
      let d = s1 - s0;
      if (d > P / 2) d -= P;
      if (d < -P / 2) d += P;
      const out = [];
      const steps = Math.max(2, Math.ceil(Math.abs(d) / 20));
      for (let k = 0; k <= steps; k++) out.push(at(s0 + (d * k) / steps));
      return [a, ...out, b];
    }
    const pts = [];
    const visits = [];
    const orderT = p.traversalOrder.filter(id => els[id]);
    let cur = null;
    orderT.forEach((id, k) => {
      if (k === 0) { visits.push({id, idx: 0}); return; }
      const prev = orderT[k - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      let seq;
      if (link) {
        const fwd = link.rel.from === prev;
        seq = Array.from({length: 31}, (_, q) => link.c.at(fwd ? q / 30 : 1 - q / 30));
      } else {
        seq = [anchorOf(prev, centerOf(id), id, 8), anchorOf(id, centerOf(prev), prev, 8)];
      }
      if (cur) pts.push(...around(prev, cur, seq[0]));
      pts.push(...seq);
      cur = seq[seq.length - 1];
      visits.push({id, idx: pts.length - 1});
    });
    if (!pts.length) pts.push(orderT.length ? centerOf(orderT[0]) : {x: St.cx, y: St.bottom});
    const poly = polyline(pts.length > 1 ? pts : [pts[0], pts[0]]);
    const cum = [0];
    for (let q = 1; q < pts.length; q++) cum.push(cum[q - 1] + Math.hypot(pts[q].x - pts[q - 1].x, pts[q].y - pts[q - 1].y));
    const total = cum[cum.length - 1] || 1;
    const visitT = {};
    visits.forEach(v => { if (visitT[v.id] === undefined) visitT[v.id] = cum[Math.min(v.idx, cum.length - 1)] / total; });

    // --- focus emphasis: a ring around the focus component that stays once the tracer reaches it
    const focusId = p.focusElement;
    const ringPath = (() => {
      if (focusId === 'layers') {
        const m = 18, top = plateY(n - 1) - St.b - m, bot = plateY(0) + St.b + St.t + m;
        return `M${r(St.cx)} ${r(top)}L${r(St.cx + St.a + m * 1.6)} ${r(plateY(n - 1))}V${r(plateY(0) + St.t)}L${r(St.cx)} ${r(bot)}L${r(St.cx - St.a - m * 1.6)} ${r(plateY(0) + St.t)}V${r(plateY(n - 1))}Z`;
      }
      const e = els[focusId];
      return e ? roundPath({x: e.box.x - 14, y: e.box.y - 14, w: e.box.w + 28, h: e.box.h + 28}, 18) : null;
    })();
    const focusRing = ringPath ? g({name: 'focus-ring', opacity: 0},
      h('path', {d: ringPath, fill: 'none', stroke: th.accent3Soft, 'stroke-width': 16, 'stroke-linejoin': 'round', opacity: 0.9}),
      h('path', {d: ringPath, fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linejoin': 'round'})) : null;
    // the tracer is sized for this design (the shared marker would be ~12 px here)
    const tracerNode = g({name: 'tracer', opacity: 0},
      h('circle', {r: 30 * TS, fill: th.accent, opacity: 0.22}),
      h('circle', {r: 15 * TS, fill: th.accent, stroke: th.paper, 'stroke-width': 4}));

    // --- legend (kinds actually used)
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = showAll ? legendNode(ctx, kinds, p.relationLabels, {x: S.w / 2, y: Pl.legendY}, 28 * TS) : null;

    // --- end-state pills on the plates themselves (descriptive only)
    const pills = p.versions.map((_, i) => {
      if (!showKey || i < sel) return null;
      const txt = i === sel ? t.selectedLayer : t.later;
      const f = ctx.fit(txt, {maxWidth: St.a * 1.55, size: 24 * TS, minSize: 18, maxLines: 1, weight: 700});
      const w = f.width + 34, hh = f.size + 18;
      const x = St.cx - w / 2, y = plateY(i) + St.b * 0.18 - hh / 2;
      const col = i === sel ? th.accent : th.inkSoft;
      return g({name: `pill${i}`, opacity: 0},
        h('path', {d: roundPath({x, y, w, h: hh}, hh / 2), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': i === sel ? null : '8 6'}),
        textBlock(f, {x: St.cx, y: y + 9, anchor: 'middle', fill: col}));
    });

    const labelChips = [labLib, labDoc, labSearch, labLayers];
    return {cardPivot: {x: cardBox.w / 2, y: cardBox.h / 2}, S, s, ox, oy, sb, lib, doc, plates, plateY, plane, axis, plateLabels: plateLab, flag, flagBox, cardNode, cardBox, conns, relNode, relLabels, poly, visitT, visits,
      legend, labelChips, pills, St, gap, n, sel, dateY, stackBox, order: orderT, focusRing, tracerNode, focusId,
      dateChipBox: dateChipEnd ? selLab.box : null};
  },
  build(ctx, L) {
    const stackParts = [L.axis];
    L.plates.forEach((pl, i) => {
      stackParts.push(g({name: `plate${i}`, transform: T(L.St.cx, L.plateY(i))}, pl.node));
      if (i === L.sel) stackParts.push(L.plane);
    });
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.relNode,
      g({name: 'el-search'}, g({name: 'el-search-body'}, L.sb.node)),
      g({name: 'el-library'}, g({name: 'el-library-body'}, L.lib.node)),
      g({name: 'el-document'}, g({name: 'el-document-body'}, L.doc.node)),
      g({name: 'el-layers'}, g({name: 'el-layers-body'}, stackParts)),
      L.focusRing,
      L.plateLabels.map(x => x && x.node),
      L.flag,
      L.cardNode,
      L.labelChips.map(c => c && c.node),
      L.relLabels,
      L.pills,
      L.tracerNode,
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: components appear, plates lift apart along the time axis
    const appear = seg(u, 0, 0.1);
    const lift = ease.inOutCubic(seg(u, 0.03, 0.17));
    const compactGap = 18;
    const gapNow = lerp(compactGap, L.gap, lift);
    const baseY = L.plateY(0);
    L.plates.forEach((_, i) => { nodes[`plate${i}`] = {transform: T(L.St.cx, baseY - i * gapNow)}; });
    for (const id of ['search', 'library', 'document', 'date', 'card']) nodes[`el-${id}`] = {opacity: r(appear, 3)};
    nodes.axis = {opacity: r(seg(u, 0.08, 0.16), 3)};
    L.plateLabels.forEach((x, i) => { if (x) nodes[`plab${i}`] = {opacity: r(seg(u, 0.14 + i * 0.01, 0.2 + i * 0.01), 3)}; });
    // 2) relations drawn one by one
    const nRel = L.conns.length;
    const drawn = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / nRel, 0.18 + ((i + 1) * 0.25) / nRel));
    L.conns.forEach((x, i) => {
      const pr = drawn(i);
      Object.assign(nodes, x.c.frame(pr, pr > 0 ? 1 : 0));
      if (x.lab) nodes[`rel-lg${i}`] = {opacity: r(clamp((pr - 0.55) / 0.45), 3)};
    });
    // 3) tracer along the traversal order; components pulse, focus enlarges
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.77;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    const pivots = {
      search: {x: L.sb.box.x + L.sb.box.w / 2, y: L.sb.box.y + L.sb.box.h / 2},
      library: {x: L.lib.box.x + L.lib.box.w / 2, y: L.lib.box.y + L.lib.box.h / 2},
      document: {x: L.doc.box.x + L.doc.box.w / 2, y: L.doc.box.y + L.doc.box.h / 2},
      layers: {x: L.St.cx, y: (L.plateY(0) + L.plateY(L.n - 1)) / 2},
      date: {x: L.flagBox.x + L.flagBox.w / 2, y: L.flagBox.y + L.flagBox.h / 2},
      card: {x: L.cardBox.x + L.cardBox.w / 2, y: L.cardBox.y + L.cardBox.h / 2},
    };
    const scales = {};
    for (const id of IDS) {
      const focus = id === p.focusElement ? 0.12 : 0.05;
      const k = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      scales[id] = k;
      if (id === 'card') {
        nodes['el-card-body'] = {transform: scaleAbout(L.cardPivot.x, L.cardPivot.y, k)};
      } else {
        nodes[`el-${id}-body`] = {transform: scaleAbout(pivots[id].x, pivots[id].y, k)};
      }
    }
    // focus ring: appears when the tracer reaches the focus component and stays to the end
    if (L.focusRing) {
      const vf = L.visitT[L.focusId];
      const ringP = vf !== undefined ? (u >= 0.77 ? 1 : tracerOn ? clamp((tt - vf + 0.03) / 0.06) : 0) : seg(u, 0.76, 0.82);
      nodes['focus-ring'] = {opacity: r(ringP, 3)};
    }
    // the part that changes: the date plane cuts the stack and the layer marked
    // for the date is outlined when the tracer runs layers → date (or, if the
    // order never links them, during the gather beat)
    const vl = L.visitT.layers, vd = L.visitT.date;
    let selP;
    if (vl !== undefined && vd !== undefined && vd > vl) selP = tracerOn || u >= 0.77 ? (u >= 0.74 ? 1 : seg(tt, vl, vd)) : 0;
    else selP = seg(u, 0.76, 0.84);
    const e = ease.inOutCubic(selP);
    nodes.plane = {opacity: r(clamp(e * 1.5), 3), transform: `${T(L.St.cx, L.dateY)} scale(${r(lerp(0.6, 1, e), 4)} ${r(lerp(0.6, 1, e), 4)})`};
    for (let i = 0; i < L.n; i++) {
      const later = i > L.sel;
      nodes[`pl${i}-hl`] = {opacity: r(i === L.sel ? e : 0, 3)};
      nodes[`pl${i}-paper`] = {opacity: r(later ? 1 - 0.78 * e : 1, 3)};
      nodes[`pl${i}-ghost`] = {opacity: r(later ? e : 0, 3)};
      if (L.plateLabels[i]) {
        nodes[`plab${i}-sel`] = {opacity: r(i === L.sel ? e : 0, 3)};
        nodes[`plab${i}-later`] = {opacity: r(later ? e : 0, 3)};
      }
    }
    // 4) gather: descriptive state pills on the plates (after the change is complete)
    const pillP = r(seg(u, 0.78, 0.86) * (selP >= 1 ? 1 : 0), 3);
    L.pills.forEach((pl, i) => { if (pl) nodes[`pill${i}`] = {opacity: pillP}; });
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const conn = L.conns.map(x => ({from: {x: r(x.c.from.x), y: r(x.c.from.y)}, to: {x: r(x.c.to.x), y: r(x.c.to.y)}, kind: x.rel.kind, arrow: LINK_STYLES[x.rel.kind].arrow}));
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        relationsDrawn: L.conns.map((_, i) => r(drawn(i), 3)),
        visitOrder: L.visits.map(v => v.id),
        plateGap: r(gapNow, 2),
        plateTop: {x: r(L.St.cx), y: r(baseY - (L.n - 1) * gapNow)},
        selectProgress: r(selP, 3),
        selected: selP > 0 ? L.sel : null,
        laterLayers: selP > 0 ? Array.from({length: L.n}, (_, i) => i).filter(i => i > L.sel) : [],
        focusScale: r(scales[p.focusElement] || 1, 3),
        connectors: conn,
        connectorsLand: L.conns.map(x => landsOn(x, L)),
      },
    };
  },
};

/** Whether a connector's two ends sit on the edges of their own elements. */
function landsOn(x, L) {
  const onBox = (b, q, pad) => {
    const inX = q.x >= b.x - pad - 1 && q.x <= b.x + b.w + pad + 1;
    const inY = q.y >= b.y - pad - 1 && q.y <= b.y + b.h + pad + 1;
    const nearEdge = Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h)) <= pad + 1.5;
    return inX && inY && nearEdge;
  };
  const onPlate = q => {
    for (let i = 0; i < L.n; i++) {
      const d = Math.abs(q.x - L.St.cx) / (L.St.a + 10) + Math.abs(q.y - L.plateY(i)) / (L.St.b + 5);
      if (Math.abs(d - 1) < 0.03) return true;
    }
    return false;
  };
  const boxOf = id => ({search: L.sb.box, library: L.lib.box, document: L.doc.box, date: L.flagBox, card: L.cardBox}[id]);
  // the date link may end on the marked version's label (joined to its plate by a lead line)
  const dateLink = [x.rel.from, x.rel.to].sort().join() === 'date,layers';
  const check = (id, q, pad) => (id === 'layers' ? onPlate(q) || (dateLink && !!L.dateChipBox && onBox(L.dateChipBox, q, pad)) : onBox(boxOf(id), q, pad));
  return check(x.rel.from, x.c.from, 8) && check(x.rel.to, x.c.to, x.rel.kind === 'relation' ? 8 : 14);
}

function roundPath(b, rad) {
  const rr = Math.min(rad, b.w / 2, b.h / 2);
  return `M${r(b.x + rr)} ${r(b.y)}H${r(b.x + b.w - rr)}Q${r(b.x + b.w)} ${r(b.y)} ${r(b.x + b.w)} ${r(b.y + rr)}V${r(b.y + b.h - rr)}Q${r(b.x + b.w)} ${r(b.y + b.h)} ${r(b.x + b.w - rr)} ${r(b.y + b.h)}H${r(b.x + rr)}Q${r(b.x)} ${r(b.y + b.h)} ${r(b.x)} ${r(b.y + b.h - rr)}V${r(b.y + rr)}Q${r(b.x)} ${r(b.y)} ${r(b.x + rr)} ${r(b.y)}Z`;
}

function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

function legendNode(ctx, kinds, labels, at, size = 28) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = 50;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': SANS, fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return g({name: 'legend'}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-03-mechanism',
    title: 'History of a provision — exploded temporal layers',
    titleEs: 'Historial de una norma — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Historial de una norma',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded isometric stack: the versions of a fictional provision separate along a vertical time axis; search box, library shelf, consolidated file, date flag and research card are linked by edge-anchored connectors styled by kind; a tracer follows the traversal order and, on its way from the layers to the date, the date plane cuts the stack, outlines the layer the author marks and turns later layers into ghosts.',
    tags: ['legal research', 'versions', 'timeline', 'mechanism', 'exploded view', 'relations', 'tracer', 'layers'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/historial-de-una-norma.js', 'src/animations/research/kits/historial-fields.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HISTORIAL_STRINGS,
  scene,
});
