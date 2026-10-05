/**
 * LAW-0178 — Representación de una parte · mechanism
 *
 * Storyboard (a zig-zag map of the operation, not a row of boxes: the form at
 * the origin, the client, the representative raised above them, the counter
 * below on the far side):
 *  0.00–0.18  separate: the four components (form card, client, representative,
 *             clerk behind a counter) slide out of one cluster to their places;
 *             their labels appear once they have arrived.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind (relation = plain
 *             line with end dots, never an arrow; communication = dashed arrow;
 *             sequence = arrow; causal only when supplied). A relation between
 *             the representative and the client is drawn as the ribbon of the
 *             motif (reel on the client, clip on the representative).
 *  0.43–0.75  trace: a small copy of the form (the tracer) follows the supplied
 *             traversalOrder along the connectors; the focus element enlarges
 *             while the tracer passes it.
 *  0.75–1.00  gather: everything stays visible — origin (form card), the link,
 *             who carried the form, where it ends (state tag "as supplied"), a
 *             legend naming the connector kinds and the neutral key.
 * No validity, sufficiency or effect of the representation is stated.
 * @module animations/roles/LAW-0178
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {textBlock, LINK_STYLES, connector} from '../../primitives/annotate.js';
import {edgeAnchor, circleAnchor, polyline} from '../../core/geometry.js';
import {personBadge} from '../../primitives/badges.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {fitWords, wchip, placeClear} from './kits/mediation-labels.js';
import {REP_DEFAULTS, REP_STRINGS, actorsField, rolesField, docPropsFields, looksOf, keyChip, hit, wordSafe} from './kits/representacion-de-una-parte.js';

const ID = 'LAW-0178';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], labels: [0.12, 0.2], relate: [0.2, 0.42], trace: [0.45, 0.7], park: [0.7, 0.76], legend: [0.75, 0.82], state: [0.76, 0.83]};
const SIZE = {landscape: 25, portrait: 21, square: 30};
const EL = ['form', 'client', 'representative', 'clerk'];
const ACTOR = {client: 0, representative: 1, clerk: 2};

const STRINGS = {
  en: {...REP_STRINGS.en, atCounter: 'Ends here (as supplied)', kinds: 'Connections'},
  es: {...REP_STRINGS.es, atCounter: 'Termina aquí (según lo aportado)', kinds: 'Conexiones'},
};

const relationship = obj('A supplied relationship between two components', {
  from: oneOf('Source component', EL),
  to: oneOf('Target component', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn on the connector (as supplied)', 60),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  actors: actorsField,
  roles: rolesField,
  props: obj('Props: the form card (origin of the act) and the counter', {...docPropsFields}),
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {id: oneOf('Component id', EL), label: str('Visible label', 50)}, ['id', 'label']), 2, 4),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied). A relation between the representative and the client is drawn as the ribbon', relationship, 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind in the legend (and on unlabelled connectors)', {
    relation: str('Caption for plain relations', 40), communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40), causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer (a copy of the form) visits the components', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  actors: REP_DEFAULTS.actors,
  roles: REP_DEFAULTS.roles,
  props: {...REP_DEFAULTS.docProps},
  elements: [
    {id: 'form', label: 'The act: the form'},
    {id: 'client', label: 'Party A (client)'},
    {id: 'representative', label: 'Representative'},
    {id: 'clerk', label: 'Counter'},
  ],
  relationships: [
    {from: 'client', to: 'form', kind: 'relation', label: 'Party A’s form'},
    {from: 'representative', to: 'client', kind: 'relation', label: 'acts on behalf of (as supplied)'},
    {from: 'representative', to: 'clerk', kind: 'communication', label: 'hands the form over'},
  ],
  focusElement: 'representative',
  relationLabels: {relation: 'relation (no direction)', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['form', 'client', 'representative', 'clerk'],
};

/** Component positions (fractions of the design space) per layout shape. */
const POS = {
  landscape: {form: [0.1, 0.22], client: [0.28, 0.6], representative: [0.53, 0.25], clerk: [0.82, 0.58]},
  square: {form: [0.14, 0.17], client: [0.2, 0.6], representative: [0.52, 0.25], clerk: [0.82, 0.62]},
  portrait: {form: [0.26, 0.09], client: [0.26, 0.33], representative: [0.7, 0.52], clerk: [0.3, 0.76]},
};
/** Second arrangement tried when dense labels cannot sit beside their connectors in the first one:
 *  the client moves away from under the form so the form–client link runs diagonally. */
const POS_ALT = {
  landscape: {form: [0.08, 0.2], client: [0.3, 0.64], representative: [0.55, 0.22], clerk: [0.84, 0.6]},
  square: {form: [0.12, 0.15], client: [0.34, 0.66], representative: [0.6, 0.22], clerk: [0.86, 0.64]},
  portrait: {form: [0.24, 0.08], client: [0.5, 0.3], representative: [0.74, 0.52], clerk: [0.3, 0.76]},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const B = SIZE[shape];
    const small = B * 0.8;
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const looks = looksOf(ctx, p);
    const labelOf = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const present = new Set(EL.filter(id => p.elements.some(e => e.id === id) || p.relationships.some(q => q.from === id || q.to === id) || p.traversalOrder.includes(id)));
    const R0 = shape === 'portrait' ? 108 : shape === 'square' ? 118 : 112;
    const cluster = {x: D.w * 0.5, y: D.h * 0.48};

    const rels0 = p.relationships.filter(q => q.from !== q.to);
    const solveAll = numbered => {
    const fixed = [];
    // cast strip (names and roles drawn once): mini bust + "name · role"
    const castItems = [];
    if (showAll) {
      const RR = B * 0.95;
      let x = 8, y = 0;
      const rowsC = [[]];
      for (const id of ['client', 'representative', 'clerk']) {
        const a = p.actors[ACTOR[id]];
        const role = (p.roles && p.roles[id]) || a.role;
        const probe = wchip(ctx, role ? `${a.name} · ${role}` : a.name, {x: 0, y: 0, anchor: 'start', maxWidth: Math.min(D.w - 16, 560) - RR * 2 - 6, size: B, minSize: small, maxLines: 3});
        const w = RR * 2 + 6 + probe.box.w;
        if (x + w > D.w - 8 && rowsC[rowsC.length - 1].length) { rowsC.push([]); x = 8; }
        rowsC[rowsC.length - 1].push({id, a, role, x, w, h: Math.max(probe.box.h, RR * 2)});
        x += w + 18;
      }
      let top = D.h - 8;
      const rowTops = [];
      for (let ri = rowsC.length - 1; ri >= 0; ri--) { const rh = Math.max(...rowsC[ri].map(q => q.h)); top -= rh; rowTops[ri] = top; top -= 10; }
      rowsC.forEach((row, ri) => row.forEach(q => {
        const c = wchip(ctx, q.role ? `${q.a.name} · ${q.role}` : q.a.name, {x: q.x + RR * 2 + 6, y: rowTops[ri], anchor: 'start', maxWidth: Math.min(D.w - 16, 560) - RR * 2 - 6, size: B, minSize: small, maxLines: 3, name: `cast-${q.id}`});
        const pb = personBadge(ctx, {name: `castb-${q.id}`, x: q.x + RR, y: c.box.y + c.box.h / 2, radius: RR, look: [looks.client, looks.representative, looks.clerk][ACTOR[q.id]]});
        castItems.push({node: g(null, pb.node, c.node), box: {x: q.x, y: rowTops[ri], w: q.w, h: q.h}, fit: c.fit});
      }));
      for (const it of castItems) fixed.push(it.box);
    }
    let castTop = castItems.length ? Math.min(...castItems.map(i => i.box.y)) - 12 : D.h - 8;
    // dense maps: each relation label is listed once here with its number; a matching number disc
    // marks the connector (no label chip can then collide with portraits or other labels)
    const numItems = [];
    if (numbered && showAll) {
      const rr = small * 0.78;
      const rowsN = [[]];
      let x = 8;
      rels0.forEach((q, i) => {
        const text = q.label || p.relationLabels[q.kind] || q.kind;
        const probe = wchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: Math.min(D.w - 16, 620) - rr * 2 - 8, size: small, minSize: small, maxLines: 3});
        const w = rr * 2 + 8 + probe.box.w;
        if (x + w > D.w - 8 && rowsN[rowsN.length - 1].length) { rowsN.push([]); x = 8; }
        rowsN[rowsN.length - 1].push({i, text, x, w, h: probe.box.h});
        x += w + 16;
      });
      let top = castTop;
      const tops = [];
      for (let ri = rowsN.length - 1; ri >= 0; ri--) { const rh = Math.max(...rowsN[ri].map(q => q.h)); top -= rh; tops[ri] = top; top -= 10; }
      rowsN.forEach((row, ri) => row.forEach(q => {
        const c = wchip(ctx, q.text, {x: q.x + rr * 2 + 8, y: tops[ri], anchor: 'start', maxWidth: Math.min(D.w - 16, 620) - rr * 2 - 8, size: small, minSize: small, maxLines: 3, fill: th.card, stroke: kindColor(ctx, rels0[q.i].kind), color: th.ink, weight: 600, name: `rnum-chip${q.i}`});
        const disc = g(null, h('circle', {cx: r(q.x + rr), cy: r(c.box.y + c.box.h / 2), r: r(rr), fill: th.ink}), h('text', {x: r(q.x + rr), y: r(c.box.y + c.box.h / 2 + small * 0.36), 'text-anchor': 'middle', 'font-size': r(small, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, String(q.i + 1)));
        numItems.push({i: q.i, node: g({name: `rnum-${q.i}`, opacity: 0}, disc, c.node), box: {x: q.x, y: tops[ri], w: q.w, h: q.h}, fit: c.fit});
      }));
      for (const it of numItems) fixed.push(it.box);
      castTop = Math.min(castTop, ...numItems.map(i => i.box.y)) - 12;
    }
    // ---- key and legend (bottom band), then relationships with labels clear of everything
    const kinds = [...new Set(p.relationships.map(q => q.kind))];
    const legendItems = [];
    let key = null;
    const legY = castTop;
    if (showKey) {
      key = keyChip(ctx, ctx.t.key, {x: D.w - 8, y: 0, anchor: 'end', maxWidth: D.w * 0.4, size: small, maxLines: 2, name: 'key'});
      key = keyChip(ctx, ctx.t.key, {x: D.w - 8, y: legY - key.box.h, anchor: 'end', maxWidth: D.w * 0.4, size: small, maxLines: 2, name: 'key'});
      fixed.push(key.box);
    }
    if (showAll) {
      const right = key ? key.box.x - 12 : D.w - 8;
      const meas = kinds.map(k => ({k, f: fitWords(p.relationLabels[k] || k, {maxWidth: D.w * 0.3, size: B, minSize: small, maxLines: 2, weight: 500})}));
      const rows = [[]];
      let x = 8;
      for (const m of meas) {
        const w = 70 + m.f.width + 18;
        if (x + w > right && rows[rows.length - 1].length) { rows.push([]); x = 8; }
        rows[rows.length - 1].push({...m, x, w});
        x += w + 20;
      }
      let bottom = legY;
      for (let ri = rows.length - 1; ri >= 0; ri--) {
        const rh = Math.max(...rows[ri].map(m => m.f.height));
        const rowY = bottom - rh;
        for (const m of rows[ri]) {
          const st = LINK_STYLES[m.k];
          const col = kindColor(ctx, m.k);
          const y0 = rowY + m.f.height / 2;
          const x0 = m.x;
          legendItems.push({node: g(null,
            h('path', {d: `M${x0} ${y0}H${x0 + 56}`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}),
            st.arrow ? h('path', {d: `M${x0 + 60} ${y0}l-14 -8l4 8l-4 8Z`, fill: col}) : null,
            st.endDots ? [h('circle', {cx: x0, cy: y0, r: 5, fill: col}), h('circle', {cx: x0 + 56, cy: y0, r: 5, fill: col})] : null,
            textBlock(m.f, {x: x0 + 70, y: rowY, fill: th.fg})), box: {x: x0, y: rowY, w: m.w, h: m.f.height}, fit: m.f});
        }
        bottom = rowY - 10;
      }
      for (const it of legendItems) fixed.push(it.box);
    }
    const legendTop = Math.min(key ? key.box.y : D.h, ...legendItems.map(it => it.box.y));

    let posSet = POS;
    const buildComps = (yk, R, lp = {}, a0 = 0, xk = 1, b0 = 0) => {
      const comps = {};
      const occupied = [...fixed];
      const P = id => ({x: b0 + posSet[shape][id][0] * D.w * xk, y: a0 + posSet[shape][id][1] * yk});
      // ---- components (built at their final places; a transform slides them out of the cluster)
      const maxW = shape === 'portrait' ? D.w * 0.42 : shape === 'square' ? D.w * 0.3 : D.w * 0.2;
    const labelBlock = (id, cx, top, maxW) => {
        const parts = [];
        let y = top;
        const lab = labelOf(id);
        let fits = [];
        let bx = {x: cx, w: 0};
        if (lab && showKey) {
          const c = wchip(ctx, lab, {x: cx, y, anchor: 'middle', maxWidth: maxW, size: B, minSize: small, maxLines: 2, fill: th.card, stroke: th.ink, color: th.ink, weight: 700, name: `lab-${id}`});
          parts.push(c.node); fits.push(c.fit); y = c.box.y + c.box.h + 4;
          bx = {x: c.box.x, w: c.box.w};
        }
        // the block is exactly as wide as its chip (a wider box would block connectors that do not touch it)
        return {node: g({name: `labels-${id}`, opacity: 0}, parts), box: {x: bx.x, y: top, w: bx.w, h: y - top}, fits};
      };
        for (const id of EL) {
        if (!present.has(id)) continue;
        const c = P(id);
        if (id === 'form') {
          // the form card: title + reference printed on it
          const fw = shape === 'portrait' ? 300 : shape === 'square' ? 330 : 310;
          const tf = fitWords(p.props.document, {maxWidth: fw - 28, size: B, minSize: small, maxLines: 4, weight: 700});
          const idf = fitWords(p.props.documentId, {maxWidth: fw - 28, size: B, minSize: small, maxLines: 2, weight: 600});
          const fh = 34 + idf.height + 8 + tf.height + 44;
          const x = c.x - fw / 2, y = c.y - fh / 2;
          const body = g(null,
            h('path', {d: `M${x + 6} ${y + 8}h${fw}v${fh}h${-fw}Z`, fill: th.shadow}),
            h('path', {d: `M${x} ${y}H${x + fw - 26}L${x + fw} ${y + 26}V${y + fh}H${x}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
            h('path', {d: `M${x + fw - 26} ${y}V${y + 26}H${x + fw}`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}),
            h('rect', {x: x + 14, y: y + 14, width: fw - 60, height: 9, rx: 3, fill: th.accent}),
            showAll ? g({name: 'ctext-form', opacity: 0}, textBlock(idf, {x: x + 14, y: y + 32, fill: th.inkSoft}), textBlock(tf, {x: x + 14, y: y + 32 + idf.height + 8, fill: th.ink}))
              : [h('rect', {x: x + 14, y: y + 34, width: fw * 0.4, height: 8, rx: 3, fill: th.paperLine}), [0, 1, 2].map(i => h('rect', {x: x + 14, y: y + 56 + i * 20, width: fw * (0.7 - i * 0.15), height: 10, rx: 4, fill: th.paperLine}))],
            [0, 1].map(i => h('rect', {x: x + 14, y: y + fh - 34 + i * 13, width: fw * (0.6 - i * 0.2), height: 5, rx: 2.5, fill: th.paperLine})));
          const box = {x, y, w: fw, h: fh};
          // the form's label sits below the card, or beside / above it when a relation label needs that room
          let labels = labelBlock(id, c.x, y + fh + 12, maxW);
          if (lp.form === 'right') labels = labelBlock(id, x + fw + 14 + labels.box.w / 2, y, maxW);
          if (lp.form === 'above') labels = labelBlock(id, c.x, y - labels.box.h - 12, maxW);
          if (lp.form === 'left') labels = labelBlock(id, x - 14 - labels.box.w / 2, y, maxW);
          comps[id] = {id, c, box, node: g({name: `comp-${id}`}, g({name: `body-${id}`}, body), labels.node), labels, fits: [tf, idf, ...labels.fits]};
        } else {
          const pb = personBadge(ctx, {name: `badge-${id}`, x: c.x, y: c.y, radius: R, look: [looks.client, looks.representative, looks.clerk][ACTOR[id]]});
          let extra = null;
          if (id === 'clerk') {
            // the clerk sits behind a counter: a counter slab across the lower badge
            const cw = R * 2.5;
            extra = g(null,
              h('rect', {x: c.x - cw / 2, y: c.y + R * 0.42, width: cw, height: R * 0.62, rx: 6, fill: th.wood, stroke: th.ink, 'stroke-width': 2.5}),
              h('rect', {x: c.x - cw / 2 - 8, y: c.y + R * 0.34, width: cw + 16, height: 14, rx: 5, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}));
          }
          let sign = null;
          if (id === 'clerk' && p.props.counterSign) {
            // the counter sign hangs above the clerk (text only when labels are shown)
            const sc = showAll
              ? wchip(ctx, p.props.counterSign, {x: c.x, y: 0, anchor: 'middle', maxWidth: maxW, size: B, minSize: small, maxLines: 2, fill: th.accent2, stroke: th.ink, color: '#fff', weight: 700})
              : null;
            const sh = sc ? sc.box.h : 34;
            const sy = c.y - R - 18 - sh;
            const sgn = showAll ? wchip(ctx, p.props.counterSign, {x: c.x, y: sy, anchor: 'middle', maxWidth: maxW, size: B, minSize: small, maxLines: 2, fill: th.accent2, stroke: th.ink, color: '#fff', weight: 700}) : null;
            sign = {node: g(null, h('path', {d: `M${c.x - 30} ${sy + sh}L${c.x - 20} ${c.y - R + 4}M${c.x + 30} ${sy + sh}L${c.x + 20} ${c.y - R + 4}`, stroke: th.metalDark, 'stroke-width': 3}),
              sgn ? g({name: 'ctext-sign', opacity: 0}, sgn.node) : h('rect', {x: c.x - 70, y: sy, width: 140, height: 34, rx: 8, fill: th.accent2, stroke: th.ink, 'stroke-width': 2.4})), box: sgn ? sgn.box : {x: c.x - 70, y: sy, w: 140, h: 34}, fit: sgn && sgn.fit};
          }
          if (id === 'client') {
            // badge reel on the client (origin of the ribbon)
            extra = g({name: 'reel-mark'}, h('circle', {cx: c.x + R * 0.5, cy: c.y + R * 0.48, r: 12, fill: th.accent3, stroke: th.ink, 'stroke-width': 2.2}), h('circle', {cx: c.x + R * 0.5, cy: c.y + R * 0.48, r: 4, fill: th.ink}));
          }
          // the label sits below the portrait, or beside / above it when a connector needs that room
          const top = c.y + R + (id === 'clerk' ? R * 0.1 : 0) + 12;
          let labels = labelBlock(id, c.x, top, maxW);
          const lw = labels.box.w, lh = labels.box.h;
          if (lp[id] === 'above') labels = labelBlock(id, c.x, c.y - R - 12 - lh, maxW);
          if (lp[id] === 'right') labels = labelBlock(id, c.x + R + 12 + lw / 2, c.y + R * 0.35, maxW);
          if (lp[id] === 'left') labels = labelBlock(id, c.x - R - 12 - lw / 2, c.y + R * 0.35, maxW);
          const box = {x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R};
          comps[id] = {id, c, box, circle: {x: c.x, y: c.y, r: R}, node: g({name: `comp-${id}`}, sign && sign.node, g({name: `body-${id}`}, pb.node, extra), labels.node), labels, fits: [...labels.fits, sign && sign.fit].filter(Boolean), sign};
        }
        occupied.push(comps[id].box, comps[id].labels.box);
        if (comps[id].sign) occupied.push(comps[id].sign.box);
      }


      return {comps, occupied};
    };
    // fit the map vertically between the top edge and the legend (it shrinks or stretches, so the map
    // fills the frame with labels shown or hidden), then place the relation labels; if a label would
    // cover a portrait or another label, try the other label arrangement and smaller badges
    const extent = cs => {
      const bs = Object.values(cs).flatMap(c => [c.box, c.labels.box, c.sign && c.sign.box].filter(Boolean)).filter(b => b.h > 0);
      return {top: Math.min(...bs.map(b => b.y)), low: Math.max(...bs.map(b => b.y + b.h)), left: Math.min(...bs.map(b => b.x)), right: Math.max(...bs.map(b => b.x + b.w))};
    };
    const fitVertical = (R, lp) => {
      let yk = D.h, a0 = 0, xk = 1, b0 = 0, built = buildComps(yk, R, lp, a0, xk, b0);
      const target = legendTop - 12;
      for (let i = 0; i < 14; i++) {
        const ex = extent(built.comps);
        const okY = Math.abs(ex.top - 12) < 3 && Math.abs(ex.low - target) < 4;
        const okX = showAll || (Math.abs(ex.left - 12) < 3 && Math.abs(ex.right - (D.w - 12)) < 4);
        if (okY && okX) break;
        a0 -= ex.top - 12;
        yk = clamp(yk * clamp((target - 12) / Math.max(1, ex.low - ex.top), 0.8, 1.35), D.h * 0.5, D.h * 3);
        if (!showAll) {
          // labels hidden: the map also spreads across the width
          b0 -= ex.left - 12;
          xk = clamp(xk * clamp((D.w - 24) / Math.max(1, ex.right - ex.left), 0.85, 1.25), 0.8, 1.6);
        }
        built = buildComps(yk, R, lp, a0, xk, b0);
      }
      return {yk, a0, built};
    };
    const attempt = (R, lp) => {
      const {built: {comps, occupied}} = fitVertical(R, lp);
      const elements = {};
      for (const id of Object.keys(comps)) elements[id] = comps[id].circle ? {circle: comps[id].circle} : {box: comps[id].box};
      const rels = p.relationships.filter(q => elements[q.from] && elements[q.to] && q.from !== q.to);
      // pass 1 gives the connector geometry; pass 2 keeps every label off every connector (the
      // tracer runs along them and must never pass under a label)
      const along = gr => gr.conns.flatMap(x => [0.02, 0.07, 0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 0.93, 0.98].map(t => { const q = x.c.at(t); return {x: q.x - 14, y: q.y - 14, w: 28, h: 28}; }));
      let lineObs = [];
      const mkGraph0 = (size, cm = 1) => relationGraph(ctx, {
        name: 'rg', elements, relationships: rels, relationLabels: p.relationLabels, chipSize: size, chipMax: (shape === 'portrait' ? D.w * 0.46 : shape === 'square' ? D.w * 0.3 : D.w * 0.22) * (size < B ? 1.25 : 1) * cm,
        obstacles: occupied.filter(b => !Object.values(comps).some(c => c.box === b)).concat(legendItems.map(i => i.box), lineObs),
        bounds: {x: 6, y: 6, w: D.w - 12, h: legendTop - 14}, separateLabels: true,
        bend: q => (q.kind === 'relation' ? 0.1 : 0.16),
      });
      // ---- connector routing: no connector through a portrait or the form (other than its own ends), no end or
      // arrowhead under the sign or a label, distinct attachment points on a shared element, and no two
      // connectors running close and parallel. Connectors that break a rule are re-attached (other points on
      // the element's edge) and re-bent until they pass.
      const upx = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * (1080 / Math.min(ctx.view.width, ctx.view.height));
      const elCenter = id => { const e = elements[id]; return e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2}; };
      const elInside = (id, q, pad = 0) => { const e = elements[id]; return e.circle ? Math.hypot(q.x - e.circle.x, q.y - e.circle.y) < e.circle.r + pad : q.x > e.box.x - pad && q.x < e.box.x + e.box.w + pad && q.y > e.box.y - pad && q.y < e.box.y + e.box.h + pad; };
      const anchorAt = (id, ang, pad) => {
        const e = elements[id], c = elCenter(id), toward = {x: c.x + Math.cos(ang) * 1000, y: c.y + Math.sin(ang) * 1000};
        return e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad);
      };
      const textObs = Object.values(comps).flatMap(c => [c.sign && c.sign.box, c.labels.box.h > 0 ? c.labels.box : null]).filter(Boolean);
      const polyOf = c => Array.from({length: 61}, (_, k) => c.at(k / 60));
      const inB = (q, b, pad) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
      const connBad = (x, pts) => {
        const ids = Object.keys(elements);
        // through another element (portrait / form); its own elements only at its ends
        for (let k = 3; k <= 57; k++) {
          const q = pts[k];
          if (ids.some(id => id !== x.rel.from && id !== x.rel.to && elInside(id, q, 4 / upx))) return 'through';
          if (k > 8 && k < 52 && (elInside(x.rel.from, q, -2) || elInside(x.rel.to, q, -2))) return 'own';
        }
        // ends (and the arrowhead) clear of the sign and every label
        for (const k of [0, 1, 2, 3, 57, 58, 59, 60]) if (textObs.some(b => inB(pts[k], b, 10 / upx))) return 'end';
        return null;
      };
      const pairBad = (x, px, y, py) => {
        const shared = [x.rel.from, x.rel.to].filter(id => id === y.rel.from || id === y.rel.to);
        const endsX = {[x.rel.from]: px[0], [x.rel.to]: px[60]}, endsY = {[y.rel.from]: py[0], [y.rel.to]: py[60]};
        for (const id of shared) if (Math.hypot(endsX[id].x - endsY[id].x, endsX[id].y - endsY[id].y) < 22 / upx) return 'attach';
        const near = shared.flatMap(id => [endsX[id]]);
        const step = px.slice(1).reduce((a, q, k) => a + Math.hypot(q.x - px[k].x, q.y - px[k].y), 0) / 60;
        let run = 0, best = 0;
        for (const q of px) {
          const close = !near.some(e => Math.hypot(q.x - e.x, q.y - e.y) < 40 / upx) && py.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 / upx);
          run = close ? run + step : 0;
          best = Math.max(best, run);
        }
        return best > 110 / upx ? 'parallel' : null;
      };
      const allOk = conns => {
        const P = conns.map(x => polyOf(x.c));
        return conns.every((x, i) => !connBad(x, P[i]) && conns.every((y, j) => j <= i || !pairBad(x, P[i], y, P[j])));
      };
      const reroute = gr => {
        const conns = gr.conns.slice();
        if (allOk(conns)) return {...gr, routesOk: true};
        const mk = (x, i, fo, to, bend) => {
          const a = elCenter(x.rel.from), b = elCenter(x.rel.to);
          const dir = Math.atan2(b.y - a.y, b.x - a.x);
          const from = anchorAt(x.rel.from, dir + fo, 8), toP = anchorAt(x.rel.to, dir + Math.PI + to, x.rel.kind === 'relation' ? 8 : 14);
          return connector(ctx, {name: `rg-c${i}`, from, to: toP, kind: x.rel.kind, bend, color: kindColor(ctx, x.rel.kind)});
        };
        const offs = [0, -0.35, 0.35, -0.6, 0.6, -0.9, 0.9, -1.2, 1.2];
        const bends = [0.12, -0.12, 0.22, -0.22, 0.32, -0.32, 0.42, -0.42];
        const cands = [];
        for (const fo of offs) for (const to of offs) for (const bd of bends) cands.push([fo, to, bd, Math.abs(fo) + Math.abs(to) + Math.abs(bd) * 1.5]);
        cands.sort((a, b) => a[3] - b[3]);
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < conns.length; i++) {
            const P = conns.map(x => polyOf(x.c));
            const badI = connBad(conns[i], P[i]) || conns.some((y, j) => j !== i && pairBad(conns[i], P[i], y, P[j]));
            if (!badI) continue;
            for (const [fo, to, bd] of cands) {
              const c = mk(conns[i], i, fo, to, bd);
              const xi = {...conns[i], c}, pi = polyOf(c);
              if (connBad(xi, pi)) continue;
              if (conns.some((y, j) => j !== i && pairBad(xi, pi, y, P[j]))) continue;
              conns[i] = xi;
              break;
            }
          }
          if (allOk(conns)) break;
        }
        return {...gr, conns, routesOk: allOk(conns)};
      };
      const mkGraph = (size, cm = 1) => reroute(mkGraph0(size, cm));
      // node / frame / route rebuilt from the (possibly re-routed) connectors
      const finalizeGraph = gr => {
        const conns = gr.conns;
        const node = g({name: 'rg'}, conns.map(x => x.c.node));
        const frame = progressOf => {
          const out = {};
          conns.forEach((x, i) => { const pr = progressOf(i); Object.assign(out, x.c.frame(pr, pr > 0 ? 1 : 0)); if (x.lab) out[`rg-lg${i}`] = {opacity: Math.min(1, Math.max(0, (pr - 0.55) / 0.45))}; });
          return out;
        };
        const route = order => {
          const pts = [], visits = [];
          const push = q => pts.push({x: q.x, y: q.y});
          for (let k = 0; k < order.length; k++) {
            const id = order[k];
            if (!elements[id]) continue;
            if (k === 0) { push(elCenter(id)); visits.push({id, idx: 0}); continue; }
            const prev = order[k - 1];
            const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
            if (link) {
              const fw = link.rel.from === prev;
              push(fw ? link.c.from : link.c.to);
              for (let m = 1; m <= 30; m++) push(link.c.at(fw ? m / 30 : 1 - m / 30));
            } else if (elements[prev]) {
              const a = elCenter(prev), b = elCenter(id);
              push(anchorAt(prev, Math.atan2(b.y - a.y, b.x - a.x), 8));
              push(anchorAt(id, Math.atan2(a.y - b.y, a.x - b.x), 8));
            }
            push(elCenter(id));
            visits.push({id, idx: pts.length - 1});
          }
          const poly = polyline(pts);
          const cum = [0];
          for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
          const total = cum[cum.length - 1] || 1;
          return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
        };
        return {...gr, node, frame, route};
      };
      // relation labels at the base size; in dense maps they drop to the minimum size (still >= 16 px)
      const obst = occupied.filter(b => !Object.values(comps).some(c => c.box === b));
      const graphOk = gr => gr.conns.every(x => !x.lab || (!x.lab.fit.truncated && x.lab.fit.size >= small - 0.01
        && !obst.some(o => hit(x.lab.box, o, 0)) && !Object.values(comps).some(c => hit(x.lab.box, c.box, 0))
        && !gr.conns.some(y => y !== x && y.lab && hit(x.lab.box, y.lab.box, 0))));
      lineObs = along(mkGraph(B));
      const offLines = gr => gr.conns.every(x => !x.lab || !lineObs.some(o => hit(x.lab.box, o, 0)));
      const bounds = {x: 6, y: 6, w: D.w - 12, h: legendTop - 14};
      // design units → px at 1080p (the rendered check measures label-to-connector distances in px)
      const pxU = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * (1080 / Math.min(ctx.view.width, ctx.view.height));
      const NEAR = 34 / pxU, SEP = 10 / pxU; // own connector within ~34 px; any other connector >= 10 px further
      const connPts = gr => gr.conns.map(x => Array.from({length: 101}, (_, k) => x.c.at(k / 100)));
      const boxDist = (b, pts) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
      const nearOf = (gr, pts) => gr.conns.map((x, i) => {
        if (!x.lab) return true;
        const own = boxDist(x.lab.box, pts[i]);
        return own <= NEAR && pts.every((q, j) => j === i || boxDist(x.lab.box, q) >= own + SEP);
      });
      const nearOk = gr => nearOf(gr, connPts(gr)).every(Boolean);
      // every relation label beside its OWN connector: kept where the framework put it when it is already
      // close and clear, otherwise placed along its connector (both sides, a short gap, a short leader that
      // crosses no other connector or text)
      const relabel = (gr, size) => {
        const pts = connPts(gr);
        const ok0 = nearOf(gr, pts);
        const placed = [];
        const textBoxes = Object.values(comps).flatMap(c => [c.box, c.labels.box.h > 0 ? c.labels.box : null]).filter(Boolean);
        const blocked = b => b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h
          || lineObs.some(o => hit(b, o, 0)) || obst.some(o => hit(b, o, 0)) || textBoxes.some(o => hit(b, o, 4))
          || placed.some(q => hit(b, q, 8));
        const leaderClear = (a, e, i) => {
          const n = 12;
          for (let k = 1; k < n; k++) {
            const q = {x: a.x + ((e.x - a.x) * k) / n, y: a.y + ((e.y - a.y) * k) / n};
            if (pts.some((ps, j) => j !== i && ps.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 8))) return false;
            if ([...placed, ...textBoxes].some(o => q.x > o.x && q.x < o.x + o.w && q.y > o.y && q.y < o.y + o.h)) return false;
          }
          return true;
        };
        const order = gr.conns.map((x, i) => i).sort((a, b) => (ok0[b] ? 1 : 0) - (ok0[a] ? 1 : 0));
        const out = gr.conns.slice();
        for (const i of order) {
          const x = gr.conns[i];
          if (!x.lab) continue;
          // the leader always runs from the NEAREST point of the own connector to the chip (short, perpendicular)
          // (the label faces the middle part of its connector, never an end where another connector starts)
          const leadFor = b => {
            let q = pts[i][0], dq = Infinity, kq = 0;
            pts[i].forEach((z, k) => { const d = Math.hypot(Math.max(b.x - z.x, 0, z.x - b.x - b.w), Math.max(b.y - z.y, 0, z.y - b.y - b.h)); if (d < dq) { dq = d; q = z; kq = k; } });
            return {q, e: {x: clamp(q.x, b.x, b.x + b.w), y: clamp(q.y, b.y, b.y + b.h)}, mid: kq >= 20 && kq <= 80};
          };
          const text = x.lab.fit.full;
          const col = kindColor(ctx, x.rel.kind);
          let best = null;
          if (ok0[i] && !blocked(x.lab.box)) {
            const l0 = leadFor(x.lab.box);
            if (l0.mid && leaderClear(l0.q, l0.e, i)) best = {c: x.lab, ...l0};
          }
          if (!best) search: for (const mw of [D.w * 0.3, D.w * 0.22, D.w * 0.16, D.w * 0.12]) {
            const probe = wchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, minSize: small, maxLines: 3});
            if (probe.fit.truncated || !wordSafe(probe.fit)) continue;
            const {w, h: hh} = probe.box;
            for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
              const q = x.c.at(t), qa = x.c.at(Math.max(0, t - 0.02)), qb = x.c.at(Math.min(1, t + 0.02));
              const tl = Math.hypot(qb.x - qa.x, qb.y - qa.y) || 1;
              const nx = -(qb.y - qa.y) / tl, ny = (qb.x - qa.x) / tl;
              // across the connector (both sides), then straight left / right / above / below the point
              for (const [dx, dy] of [[nx, ny], [-nx, -ny], [1, 0], [-1, 0], [0, -1], [0, 1]]) {
                for (const gap of [16, 22, 28]) {
                  const ext = Math.abs(dx) * w / 2 + Math.abs(dy) * hh / 2;
                  const cx = q.x + dx * (gap + ext), cy = q.y + dy * (gap + ext);
                  const c = wchip(ctx, text, {x: cx, y: cy - hh / 2, anchor: 'middle', maxWidth: mw, size, minSize: small, maxLines: 3, fill: th.card, stroke: col, weight: 600, name: `rg-l${i}`});
                  const b = c.box;
                  const own = boxDist(b, pts[i]);
                  if (own > NEAR || blocked(b) || !pts.every((ps, j) => j === i || boxDist(b, ps) >= own + SEP)) continue;
                  const l1 = leadFor(b);
                  if (!l1.mid || !leaderClear(l1.q, l1.e, i)) continue;
                  best = {c, ...l1};
                  break search;
                }
              }
            }
          }
          if (!best) { placed.push(x.lab.box); continue; }
          placed.push(best.c.box);
          const lead = Math.hypot(best.e.x - best.q.x, best.e.y - best.q.y) > 6 ? {x1: r(best.q.x), y1: r(best.q.y), x2: r(best.e.x), y2: r(best.e.y)} : null;
          out[i] = {...x, lab: best.c, leader: lead};
        }
        const conns = out;
        const labelsNode = g({name: 'rg-labels'}, conns.map((x, i) => x.lab && g({name: `rg-lg${i}`, opacity: 0},
          x.leader ? h('line', {...x.leader, stroke: kindColor(ctx, x.rel.kind), 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
          x.lab.node)));
        return {...gr, conns, labelsNode};
      };
      // every relation label sits beside its own connector: base size first, then narrower (more lines)
      // and the minimum size, before anything else is changed
      // every relation label beside its own connector (base size first, then the minimum size)
      let graph = null;
      for (const size of [B, small]) {
        const g3 = relabel(mkGraph(size), size);
        if (graphOk(g3) && offLines(g3) && nearOk(g3)) { graph = g3; break; }
      }
      const labelsNear = Boolean(graph);
      if (!graph) graph = relabel(mkGraph(B), B);
      const lbl = numbered ? graph.conns.map(x => ({x: x.c.mid.x - small, y: x.c.mid.y - small, w: small * 2, h: small * 2})) : graph.conns.filter(x => x.lab).map(x => x.lab.box);
      // final state tag next to the last visited component, clear of labels and portraits
      let stateTag = null, stateClear = true;
      const lastId = p.traversalOrder.filter(id => elements[id]).slice(-1)[0];
      if (showKey && lastId) {
        const lc = comps[lastId];
        const bx = lc.box, lb = lc.labels.box;
        const cands = [];
        const mk = (x, y, an) => wchip(ctx, ctx.t.atCounter, {x, y, anchor: an, maxWidth: D.w * 0.3, size: small, minSize: small, maxLines: 2, fill: th.card, stroke: th.accent4, color: th.accent4, weight: 700, name: 'state-tag'});
        for (const [x, y, an] of [[bx.x + bx.w + 14, bx.y + bx.h * 0.4, 'start'], [bx.x - 14, bx.y + bx.h * 0.55, 'end'], [lb.x + lb.w / 2, lb.y + lb.h + 8, 'middle'], [bx.x + bx.w / 2, bx.y - 70, 'middle'], [bx.x + bx.w + 14, bx.y - 30, 'start'], [bx.x - 14, bx.y - 30, 'end']]) cands.push(mk(x, y, an));
        for (let dy = -160; dy <= 200; dy += 30) for (const dx of [-1, 1]) cands.push(mk(bx.x + bx.w / 2 + dx * (bx.w / 2 + 14), bx.y + bx.h / 2 + dy, dx < 0 ? 'end' : 'start'));
        // the end tag never sits on a connector (the dashed hand-over line) or on a label's leader
        const lineBoxes = connPts(graph).flatMap(ps => ps.filter((q, k) => k % 2 === 0).map(q => ({x: q.x - 7, y: q.y - 7, w: 14, h: 14})));
        const leadBoxes = graph.conns.filter(x => x.leader).flatMap(x => Array.from({length: 9}, (_, k) => ({x: x.leader.x1 + ((x.leader.x2 - x.leader.x1) * (k + 1)) / 10 - 5, y: x.leader.y1 + ((x.leader.y2 - x.leader.y1) * (k + 1)) / 10 - 5, w: 10, h: 10})));
        const obsT = [...occupied, ...lbl, ...Object.values(comps).map(c => c.box), ...(numbered ? [] : [...lineBoxes, ...leadBoxes])];
        stateTag = placeClear(cands.filter(c => !c.fit.truncated), obsT, {x: 6, y: 6, w: D.w - 12, h: legendTop - 10}, 6) || cands[0];
        stateClear = !obsT.some(o => hit(stateTag.box, o, 2));
      }
      const fl = comps.form && comps.form.labels.box;
      // no connector (the tracer's path) may run through a component's label block
      const pathBoxes = along(graph);
      const crossed = Object.values(comps).filter(c => c.labels.box.h > 0 && pathBoxes.some(o => hit(o, c.labels.box, -6))).map(c => c.id);
      // a component label moved beside or above must still stay clear of other components
      const crowded = Object.values(comps).filter(c => c.labels.box.h > 0 && (hit(c.labels.box, c.box, -2) || c.labels.box.x < 6 || c.labels.box.y < 6 || c.labels.box.x + c.labels.box.w > D.w - 6 || Object.values(comps).some(d => d !== c && (hit(c.labels.box, d.box, 4) || (d.labels.box.h > 0 && hit(c.labels.box, d.labels.box, 4)))))).map(c => c.id);
      const labelsOffPaths = !crossed.length && !crowded.length;
      // numbered discs at the connector midpoints must stay clear of portraits and labels
      const discR = small * 0.78 + 4;
      const discBoxes = numbered ? graph.conns.map(x => ({x: x.c.mid.x - discR, y: x.c.mid.y - discR, w: discR * 2, h: discR * 2})) : [];
      const discsClear = discBoxes.every((d, i) => !Object.values(comps).some(c => hit(d, c.box, 2) || hit(d, c.labels.box, 2)) && !discBoxes.some((e, j) => j !== i && hit(d, e, 2)));
      const labelsPlaced = numbered ? discsClear : graphOk(graph) && offLines(graph) && labelsNear;
      const ok = labelsPlaced && labelsOffPaths && stateClear && (!fl || !graph.conns.some(x => x.lab && hit(x.lab.box, fl, 0)));
      graph = finalizeGraph(graph);
      return {comps, occupied, elements, rels, graph, stateTag, ok: ok && graph.routesOk !== false, R, discBoxes, crossed: [...new Set([...crossed, ...crowded])], why: [graphOk(graph), offLines(graph), labelsOffPaths, stateClear, JSON.stringify(lp)].join('/')};
    };
    let map = null;
    const tried = [];
    const CYCLE = ['below', 'right', 'above', 'left'];
    search: for (const [ps, rf] of [POS, POS_ALT].flatMap(ps => [1, 0.9, 0.8, 0.72, 0.64, 0.56].map(f => [ps, f]))) {
      posSet = ps;
      const lp = {};
      for (let it = 0; it < 7; it++) {
        const m = attempt(R0 * rf, lp);
        m.ps = ps;
        tried.push(`${ps === POS ? '' : 'alt '}${rf}:${m.why}`);
        if (!map) map = m;
        if (m.ok) { map = m; break search; }
        if (!m.crossed.length) break;
        for (const id of m.crossed) {
          let next = CYCLE[(CYCLE.indexOf(lp[id] || 'below') + 1) % CYCLE.length];
          if (id === 'clerk' && next === 'above') next = 'left'; // the counter sign hangs above the clerk
          lp[id] = next;
        }
      }
    }
    posSet = map.ps;
    return {castItems, key, legendItems, legendTop, map, tried, numItems};
    };
    let S = solveAll(false);
    // if no arrangement places every relation label clear, the numbered form is used (always legible)
    if (!S.map.ok && showAll) S = solveAll(true);
    const numbered = S.numItems.length > 0;
    const {castItems, key, legendItems, legendTop, tried, numItems} = S;
    const {comps, occupied, elements, rels, graph, stateTag, R} = S.map;
    // the ribbon: a relation between the representative and the client is drawn as the motif's ribbon
    const ribbonIdx = rels.findIndex(q => q.kind !== 'causal' && ((q.from === 'representative' && q.to === 'client') || (q.from === 'client' && q.to === 'representative')));
    let ribbon = null;
    if (ribbonIdx >= 0) {
      const cc = graph.conns[ribbonIdx].c;
      const d = `M${r(cc.from.x)} ${r(cc.from.y)}C${r(cc.c1.x)} ${r(cc.c1.y)} ${r(cc.c2.x)} ${r(cc.c2.y)} ${r(cc.to.x)} ${r(cc.to.y)}`;
      const len = cc.total;
      ribbon = {len, node: g({name: 'ribbon', opacity: 0},
        h('path', {name: 'ribbon-o', d, fill: 'none', stroke: th.ink, 'stroke-width': 15, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
        h('path', {name: 'ribbon-b', d, fill: 'none', stroke: th.accent3, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}))};
    }
    const route = graph.route(p.traversalOrder.filter(id => elements[id]));
    // the tracer (a small form) is parked beside the last component, never over a face
    const lastC = comps[p.traversalOrder.filter(id => elements[id]).slice(-1)[0]];
    const park = lastC.circle
      ? {x: lastC.c.x + lastC.circle.r * (lastC.id === 'clerk' ? 1.05 : 0.95), y: lastC.c.y + lastC.circle.r * (lastC.id === 'clerk' ? 0.3 : 0.7)}
      : {x: lastC.box.x + lastC.box.w + 30, y: lastC.box.y + lastC.box.h * 0.6};
    const faces = Object.values(comps).filter(c => c.circle).map(c => ({x: c.c.x, y: c.c.y - c.circle.r * 0.15, r: c.circle.r * 0.5}));
    const labelBoxesAll = [...(numbered ? [] : graph.conns.filter(x => x.lab).map(x => x.lab.box)), ...Object.values(comps).map(c => c.labels.box), ...(stateTag ? [stateTag.box] : [])];

    // connector end gaps (each connector must end at its element edge)
    const edgeGap = (id, pt) => {
      const e = elements[id];
      if (e.circle) return Math.abs(Math.hypot(pt.x - e.circle.x, pt.y - e.circle.y) - e.circle.r);
      const b = e.box;
      const dx = Math.max(b.x - pt.x, 0, pt.x - (b.x + b.w)), dy = Math.max(b.y - pt.y, 0, pt.y - (b.y + b.h));
      return Math.hypot(dx, dy);
    };
    const connectorGaps = graph.conns.map(x => Math.max(edgeGap(x.rel.from, x.c.from), edgeGap(x.rel.to, x.c.to)));
    const labelBoxes = numbered ? [] : graph.conns.filter(x => x.lab).map(x => x.lab.box);
    const discs = numbered ? graph.conns.map((x, i) => ({i, x: x.c.mid.x, y: x.c.mid.y})) : [];
    const labelsClear = labelBoxes.every((b, i) => !labelBoxes.some((o, j) => j !== i && hit(b, o, 0)) && !Object.values(comps).some(c => hit(b, c.box, 0)));
    const fits = [...Object.values(comps).flatMap(c => c.fits), ...legendItems.map(i => i.fit), ...castItems.map(i => i.fit), ...numItems.map(i => i.fit), key && key.fit, stateTag && stateTag.fit, ...(numbered ? [] : graph.conns.filter(x => x.lab).map(x => x.lab.fit))].filter(Boolean);
    const truncated = fits.filter(f => f.truncated || !wordSafe(f)).map(f => f.full);
    return {tried, numbered, numItems, discs, castItems, comps, cluster, graph, rels, ribbon, ribbonIdx, route, park, faces, labelBoxesAll, stateTag, legendItems, key, connectorGaps, labelsClear, stateClear: !stateTag || ![...labelBoxes, ...Object.values(comps).map(c => c.box)].some(b => hit(stateTag.box, b, 0)), truncated, R};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const tracer = g({name: 'tracer', opacity: 0},
      h('circle', {r: 26, fill: th.accent, opacity: 0.18}),
      h('path', {d: 'M-13 -17H7L14 -10V17H-13Z', fill: th.paper, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('rect', {x: -8, y: -10, width: 14, height: 4, rx: 2, fill: th.accent}),
      h('rect', {x: -8, y: -1, width: 16, height: 3, rx: 1.5, fill: th.paperLine}),
      h('rect', {x: -8, y: 6, width: 12, height: 3, rx: 1.5, fill: th.paperLine}));
    return g(null,
      L.ribbon && L.ribbon.node,
      L.graph.node,
      Object.values(L.comps).map(c => c.node),
      L.graph.labelsNode,
      L.discs.map(d => g({name: `rdisc-${d.i}`, opacity: 0},
        h('circle', {cx: r(d.x), cy: r(d.y), r: r(SIZE[ctx.view.shape] * 0.8 * 0.78), fill: th.ink, stroke: th.card, 'stroke-width': 3}),
        ctx.show('all') ? h('text', {x: r(d.x), y: r(d.y + SIZE[ctx.view.shape] * 0.8 * 0.36), 'text-anchor': 'middle', 'font-size': r(SIZE[ctx.view.shape] * 0.8, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, String(d.i + 1)) : null)),
      L.numItems.map(i => i.node),
      tracer,
      L.stateTag && g({name: 'state-g', opacity: 0}, L.stateTag.node),
      g({name: 'legend', opacity: 0}, L.legendItems.map(i => i.node)),
      L.key && L.key.node,
      L.castItems.map(i => i.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    const labs = r(seg(u, ...W.labels), 3);
    // trace progress and the tracer point along the supplied traversal order
    const tr = seg(u, ...W.trace);
    const trE = ease.inOutSine(tr);
    const pe = L.route.poly.at(trE);
    const pk = ease.inOutCubic(seg(u, ...W.park));
    const pt = {x: lerp(pe.x, L.park.x, pk), y: lerp(pe.y, L.park.y, pk)};
    let focusScale = 1;
    const focus = L.comps[p.focusElement];
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    if (focus && fv) {
      // enlarge while the tracer approaches, passes and leaves the focus element (route fraction)
      const near = tr > 0 && tr < 1 ? clamp(1 - Math.abs(trE - fv.t) / 0.16) : 0;
      focusScale = 1 + 0.18 * ease.inOutSine(near);
    }
    if (ctx.show('all')) {
      if (L.comps.form) nodes['ctext-form'] = {opacity: labs};
      if (L.comps.clerk && L.comps.clerk.sign && L.comps.clerk.sign.fit) nodes['ctext-sign'] = {opacity: labs};
    }
    for (const c of Object.values(L.comps)) {
      const dx = (L.cluster.x - c.c.x) * (1 - slide), dy = (L.cluster.y - c.c.y) * (1 - slide);
      nodes[`comp-${c.id}`] = {transform: T(dx, dy)};
      nodes[`labels-${c.id}`] = {opacity: labs};
      nodes[`body-${c.id}`] = {transform: c.id === p.focusElement && focusScale !== 1 ? scaleAbout(c.c.x, c.c.y, focusScale) : ''};
    }
    // relationships drawn one by one
    const n = Math.max(1, L.rels.length);
    const [a0, a1] = W.relate;
    const progressOf = i => ease.inOutCubic(seg(u, a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n));
    Object.assign(nodes, L.graph.frame(progressOf));
    if (L.numbered) {
      // numbered form: the label chips on the map stay hidden; discs and the numbered list appear as each link is drawn
      L.graph.conns.forEach((x, i) => { if (x.lab) nodes[`rg-lg${i}`] = {opacity: 0}; });
      for (const d of L.discs) nodes[`rdisc-${d.i}`] = {opacity: progressOf(d.i) >= 0.98 ? 1 : 0};
      for (const it of L.numItems) nodes[`rnum-${it.i}`] = {opacity: r(clamp((progressOf(it.i) - 0.55) / 0.45), 3)};
    }
    if (L.ribbon) {
      const rp = progressOf(L.ribbonIdx);
      nodes.ribbon = {opacity: rp > 0 ? 1 : 0};
      nodes['ribbon-o'] = {'stroke-dashoffset': r(L.ribbon.len * (1 - rp))};
      nodes['ribbon-b'] = {'stroke-dashoffset': r(L.ribbon.len * (1 - rp))};
    }
    nodes.tracer = {opacity: tr > 0 ? 1 : 0, transform: T(pt.x, pt.y)};
    const visited = tr > 0 ? L.route.visits.filter(v => trE >= v.t - 1e-6).map(v => v.id) : [];
    if (L.stateTag) nodes['state-g'] = {opacity: r(seg(u, ...W.state), 3)};
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const drawn = L.rels.map((q, i) => r(progressOf(i), 3));
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(pt.x), y: r(pt.y)},
        tracerVisible: tr > 0,
        tracerParked: pk === 1,
        tracerOnFace: tr > 0 && L.faces.some(f => Math.hypot(pt.x - f.x, pt.y - f.y) < f.r + 20),
        tracerOnLabel: tr > 0 && L.labelBoxesAll.some(b => pt.x > b.x - 6 && pt.x < b.x + b.w + 6 && pt.y > b.y - 6 && pt.y < b.y + b.h + 6),
        stateClear: L.stateClear,
        numberedLabels: L.numbered,
        visitOrder: visited,
        relationsDrawn: drawn,
        focusScale: r(focusScale, 3),
        slide: r(slide, 3),
        arrows: L.rels.map((q, i) => ({kind: q.kind, arrow: Boolean(LINK_STYLES[q.kind].arrow), drawn: drawn[i]})),
        connectorGaps: L.connectorGaps.map(v => r(v, 1)),
        labelsClear: L.labelsClear,
        ribbon: L.ribbon ? drawn[L.ribbonIdx] : null,
        stateShown: L.stateTag ? r(seg(u, ...W.state), 3) : 0,
        truncated: L.truncated,
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
    slug: 'roles-05-mechanism',
    title: 'Representing a party — the link and the route of the act',
    titleEs: 'Representación de una parte — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Representación de una parte',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A zig-zag map of the operation: the form card (origin), the client, the representative and the clerk behind a counter slide apart; only the supplied relationships are drawn, by kind (a representative–client relation becomes the ribbon; plain relations have no arrow); a copy of the form traces the supplied order while the focus element enlarges; legend, end state and neutral key. No validity or effect is stated.',
    tags: ['representation', 'mechanism', 'relationships', 'ribbon', 'link', 'tracer', 'traversal order', 'counter', 'form', 'legend'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/representacion-de-una-parte.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
