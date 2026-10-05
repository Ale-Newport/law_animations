/**
 * LAW-0222 — Organización de turnos · mechanism
 *
 * Storyboard (the passing of a turn signal is taken apart into its parts, laid
 * out around one table piece — not a row of boxes; the generic building with
 * its hearing room stands in the panel as the anchor):
 *  0.00–0.18  separate: two participants sit at the two ends of a table piece —
 *             the one who holds the signal (the first in the supplied sequence)
 *             and the next one as configured — each with a party badge (● / ◆,
 *             equal weight) and their label. The two turn lamps lift off the
 *             table and settle below it as their own part; the sequence card
 *             (the supplied order, "sequence as configured (illustrative)")
 *             settles above; the token stays under the holder's hand.
 *  0.18–0.43  relate: ONLY the supplied relationships are drawn, one by one,
 *             anchored to the edges of their two parts and styled by kind (a
 *             plain relation = solid line with end dots, never an arrow; a
 *             sequence link = solid line with an arrowhead and the caption
 *             "sequence as configured"; causal only when supplied).
 *  0.43–0.75  trace: a tracer marker follows the supplied traversal order
 *             along the relations; the element in focus (default: the signal)
 *             enlarges while the tracer is on it. When the tracer runs along
 *             the relation from the signal to the next person, the token is
 *             pushed across the table and caught (the same hand-off as the
 *             story); when it reaches the lamps, the holder's lamp goes out and
 *             the receiver's lamp lights (cause before effect).
 *  0.75–1.00  gather: origin (the first holder, lamp 1), transformation (the
 *             drawn relations) and state (the receiver holding the token, lamp
 *             2 lit) stay visible with the state tag and the key "as supplied ·
 *             no conclusion drawn". No required order, no time per turn, no
 *             consequence.
 * @module animations/courts/LAW-0222
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {edgeAnchor, circleAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {buildingElevation, planTable, planChair} from './kits/courts-art.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  turnFields, TURN_EN, TURN_STRINGS, resolveTurns, planHops, turnAt, seatedPose, turnPerson, lampNode, lampFrame, tokenNode, partyGlyph,
  measureStack, drawStack, fitG, textAt, widestWord, toWorld, LOCAL, GEO, pxPerUnit, R2, T, PERSON_RAD,
} from './kits/organizacion-de-turnos.js';

const ID = 'LAW-0222';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.03, 0.16], relate: [0.19, 0.42], trace: [0.44, 0.74], tag: [0.76, 0.82]};
const IDS = ['room', 'sequence', 'holder', 'signal', 'receiver', 'lamps'];
const dxOf = axis => (axis === 'v' ? 780 : 600); // template distance between the two participants
const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const STRINGS = {
  en: {...TURN_STRINGS.en, state: 'State: {name} holds the signal (as supplied)'},
  es: {...TURN_STRINGS.es, state: 'Estado: {name} tiene la señal (según lo aportado)'},
};

const sceneSchema = {
  ...turnFields,
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between components; kind controls the line style (a plain relation never has an arrow; causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  ...TURN_EN,
  elements: [
    {id: 'room', label: 'Hearing room (fictional)'},
    {id: 'sequence', label: 'Sequence as configured (illustrative)'},
    {id: 'holder', label: 'Holds the signal first'},
    {id: 'signal', label: 'Turn signal (token)'},
    {id: 'receiver', label: 'Next as configured'},
    {id: 'lamps', label: 'Turn lamps: active / pending'},
  ],
  relationships: [
    {from: 'sequence', to: 'holder', kind: 'sequence'},
    {from: 'sequence', to: 'receiver', kind: 'sequence'},
    {from: 'signal', to: 'receiver', kind: 'relation'},
  ],
  focusElement: 'signal',
  relationLabels: {relation: 'Relation (as supplied)', communication: 'Communication', sequence: 'Sequence as configured (illustrative)', causal: 'Causal (as supplied)'},
  traversalOrder: ['sequence', 'holder', 'signal', 'receiver', 'lamps'],
};

const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const {seats, seq} = resolveTurns(ctx, p);
    const pair = [seats[seq[0]], seats[seq[1]]];
    const label = id => ((p.elements || []).find(e => e.id === id) || {}).label || '';
    const shape = ctx.view.shape;
    const GAP = 26 / px;
    // the two participants of the first pass, in template units (holder at the left facing right)
    const hs = [{slot: 'holder', party: pair[0].party}, {slot: 'receiver', party: pair[1].party}];
    /** Canonical (u along holder → receiver, v across) → template for a diagram axis. */
    const geomOf = (axis, cardGap = 70, lampV = 205) => {
      const DX = dxOf(axis);
      const M = (u, v) => (axis === 'h' ? {x: u, y: v} : {x: v, y: u});
      const G = {
        axis, M,
        seats: {
          holder: {slot: 'holder', ...M(0, 0), deg: axis === 'h' ? 90 : 180, row: -1, col: 0, out: axis === 'h' ? {x: -1, y: 0} : {x: 0, y: -1}},
          receiver: {slot: 'receiver', ...M(DX, 0), deg: axis === 'h' ? -90 : 0, row: 1, col: 0, out: axis === 'h' ? {x: 1, y: 0} : {x: 0, y: 1}},
        },
        tray: M(DX / 2, 0), DX, cardGap, lampV,
      };
      G.lampT = [toWorld(G.seats.holder, LOCAL.lamp.x, LOCAL.lamp.y), toWorld(G.seats.receiver, LOCAL.lamp.x, LOCAL.lamp.y)];
      G.lampDockT = [M(DX / 2 - 62, lampV), M(DX / 2 + 62, lampV)];
      return G;
    };
    const stateText = ctx.t.state.replace('{name}', pair[1].label).replace('{n}', '2');
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const panelItems = [
      ...(showAll ? [{type: 'text', text: label('room'), weight: 600, name: 'el-room'}] : []),
      ...(showAll && label('signal') ? [{type: 'legend', kind: 'signal', text: label('signal'), name: 'el-signal-text'}] : []),
      ...(showAll && label('lamps') ? [{type: 'text', text: label('lamps'), weight: 600, name: 'el-lamps-text', group: 'state'}] : []),
      ...(showKey ? [
        {type: 'legend', kind: 'active', text: p.labels.active, weight: 600, name: 'legend-active', group: 'state'},
        {type: 'legend', kind: 'pending', text: p.labels.pending, weight: 600, name: 'legend-pending', group: 'state'},
      ] : []),
      ...(showAll ? [
        {type: 'legend', kind: 'circle', text: p.labels.circle, name: 'legend-circle', group: 'party'},
        {type: 'legend', kind: 'diamond', text: p.labels.diamond, name: 'legend-diamond', group: 'party'},
      ] : []),
      ...(showKey ? [{type: 'chip', text: stateText, stroke: th.inkSoft, weight: 700, name: 'state-tag'}, {type: 'key', text: p.labels.key, name: 'key'}] : []),
    ];

    /** Sequence card (design units) at text size F and width w. */
    const card = (F, w) => {
      const title = fitG(label('sequence') || p.labels.sequence, {maxWidth: w - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 700});
      const rows = seq.map((si, j) => {
        const fit = fitG(`${j + 1}  ${seats[si].label}`, {maxWidth: w - F * 1.2 - F * 1.6, size: F, minSize: F, maxLines: 2, weight: 500});
        return {fit, si, j};
      });
      const bad = title.truncated || rows.some(q => q.fit.truncated) || widestWord(ctx, label('sequence'), F, 700) > w - F * 1.2
        || seq.some(si => widestWord(ctx, seats[si].label, F, 500) > w - F * 2.8);
      const padY = F * 0.5;
      const hh = padY * 2 + title.height + F * 0.35 + rows.reduce((a, q) => a + q.fit.height + F * 0.32, 0);
      return {title, rows, w, h: hh, padY, bad};
    };

    /** The whole composition at text size F in the diagram box (axis 'h': holder left; 'v': holder on top). */
    const compose = (F, box, axis, allowIn = true) => {
      let G = geomOf(axis);
      const DX = G.DX;
      const cw = axis === 'h' ? Math.min(box.w * 0.62, 520 / px) : Math.min(box.w * 0.42, 400 / px);
      const gR = 16 / px;
      const cd = showKey ? card(F, cw) : {glyphOnly: true, R: gR, w: seq.length * 2 * gR + (seq.length - 1) * gR * 1.6 + 2 * gR, h: 2 * gR + 2 * gR * 0.8, bad: false};
      if (cd && cd.bad) return null;
      // participant chips (label + element caption) beside each person
      const chipsFor = k => (!showKey ? [] : pair.map((s, i) => {
        const w = Math.min(260 / px, D.w * 0.3);
        const f1 = fitG(s.label, {maxWidth: w - F * 1.1, size: F, minSize: F, maxLines: 4, weight: 600});
        const cap = showAll ? label(i ? 'receiver' : 'holder') : '';
        const f2 = cap ? fitG(cap, {maxWidth: w - F * 1.1, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
        const bad = f1.truncated || (f2 && f2.truncated) || widestWord(ctx, s.label, F, 600) > w - F * 1.1 || (cap && widestWord(ctx, cap, F, 500) > w - F * 1.1)
          || f1.lines.some(ln => ln.trim().length <= 2) || (f2 && f2.lines.some(ln => ln.trim().length <= 2));
        const cwid = Math.max(f1.width, f2 ? f2.width : 0) + F * 1.1;
        const chh = F * 0.7 + f1.height + (f2 ? F * 0.38 + f2.height : 0);
        return {f1, f2, w: cwid, h: chh, bad};
      }));
      // canonical extents (template): u along, v across; chips sit on the +v side of each person, pushed outward
      // along u until they clear the table
      const extents = (k, chips) => {
        const along = axis === 'h' ? chips.map(c => c.w / k) : chips.map(c => c.h / k);
        const across = axis === 'h' ? chips.map(c => c.h / k) : chips.map(c => c.w / k);
        const cardAcross = cd ? (axis === 'h' ? cd.h : cd.w) / k : 40;
        const cardAlong = cd ? (axis === 'h' ? cd.w : cd.h) / k : 40;
        // (table across) the chips run inward from each person, under the table ends, when both fit side by side
        const inward = allowIn && axis === 'h' && chips.length === 2 && along[0] + along[1] + 30 <= DX + 120;
        const u0 = Math.min(-75, inward ? -60 : -(along[0] || 0) / 2, DX / 2 - cardAlong / 2);
        const u1 = Math.max(DX + 75, inward ? DX + 60 : DX + (along[1] || 0) / 2, DX / 2 + cardAlong / 2);
        const v0 = -(95 + G.cardGap + cardAcross);
        const v1 = Math.max(G.lampV + 50, 107 + Math.max(0, ...across) + 6);
        return {u0, u1, v0, v1, inward};
      };
      let k = 1, chips = null, ex = null;
      // the lamps' dock sits below the chips' band
      const lampVFor = (k, chips) => {
        const inward = allowIn && axis === 'h' && chips.length === 2 && (chips[0].w + chips[1].w) / k + 30 <= dxOf(axis) + 120;
        return inward ? Math.max(205, 107 + Math.max(...chips.map(c => c.h / k)) + 62) : 205;
      };
      for (let it = 0; it < 5; it++) {
        chips = chipsFor(k);
        if (chips.some(c => c.bad)) return null;
        G = geomOf(axis, 70, lampVFor(k, chips));
        ex = extents(k, chips);
        const [wT, hT] = axis === 'h' ? [ex.u1 - ex.u0, ex.v1 - ex.v0] : [ex.v1 - ex.v0, ex.u1 - ex.u0];
        const k2 = Math.min(box.w / wT, box.h / hT);
        if (Math.abs(k2 - k) < 0.002) { k = k2; break; }
        k = k2;
      }
      chips = chipsFor(k);
      if (chips.some(c => c.bad)) return null;
      G = geomOf(axis, 70, lampVFor(k, chips));
      ex = extents(k, chips);
      // spare height (table across): the card and the lamps move apart from the table to fill the box
      if (axis === 'h') {
        const slack = box.h / k - (ex.v1 - ex.v0);
        if (slack > 20) {
          const e = Math.min(slack - 10, 260) / 2;
          G = geomOf(axis, 70 + e, lampVFor(k, chips) + e);
          ex = extents(k, chips);
        }
      }
      const lo = G.M(ex.u0, ex.v0), hi = G.M(ex.u1, ex.v1);
      const ox = box.x + (box.w - (hi.x - lo.x) * k) / 2 - lo.x * k;
      const oy = box.y + (box.h - (hi.y - lo.y) * k) / 2 - lo.y * k;
      const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
      return {F, k, ox, oy, toD, cd, chips, G, axis, inward: ex.inward};
    };

    const twoCols = (items, w, F, n = 2) => {
      let best = null;
      const N = items.length;
      const rec = (start, left, acc) => {
        if (left === 1) {
          const ms = [...acc, [start, N]].map(([a, b]) => measureStack(ctx, items.slice(a, b), w, F));
          if (ms.some(m => m.truncated)) return;
          const hh = Math.max(...ms.map(m => m.height));
          if (!best || hh < best.h) best = {h: hh, cols: ms};
          return;
        }
        for (let c = start; c <= N; c++) {
          if (c > 0 && c < N && items[c - 1].group && items[c - 1].group === items[c].group) continue;
          rec(c, left - 1, [...acc, [start, c]]);
        }
      };
      rec(0, n, []);
      return best;
    };
    const arrangements = F => {
      const out = [];
      const minB = Math.min(150 / px, D.h * 0.2);
      // a wide panel: the building above two text columns
      for (const cf of shape === 'landscape' ? [0.34, 0.4] : shape === 'square' ? [0.4, 0.44, 0.5] : []) {
        const pw = D.w * cf;
        const tc = twoCols([...nameItems, ...panelItems], (pw - GAP) / 2, F);
        if (!tc) continue;
        const bh = Math.min(D.h - tc.h - GAP, pw * 0.5, D.h * 0.4);
        if (bh < minB) continue;
        const bw = Math.min(pw, bh / 0.9);
        for (const axis of shape === 'square' ? ['h', 'v'] : ['h']) {
          out.push({kind: 'wide', axis, box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - bw) / 2, y: 0, w: bw, h: bh},
            parts: [{m: tc.cols[0], x: D.w - pw, y: bh + GAP}, {m: tc.cols[1], x: D.w - pw + (pw + GAP) / 2, y: bh + GAP}]});
        }
      }
      if (shape !== 'portrait') {
        for (const cf of shape === 'square' ? [0.32, 0.36, 0.42] : [0.24, 0.28]) {
          const pw = Math.max(250 / px, D.w * cf);
          const m = measureStack(ctx, [...nameItems, ...panelItems], pw, F);
          const bh = Math.min(D.h - m.height - m.gap, pw * 0.9, D.h * 0.4);
          if (m.truncated || bh < minB) continue;
          const bw = Math.min(pw, bh / 0.9);
          for (const axis of shape === 'square' ? ['h', 'v'] : ['h']) {
            out.push({kind: 'column', axis, box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - bw) / 2, y: 0, w: bw, h: bh},
              parts: [{m, x: D.w - pw, y: bh + m.gap + (D.h - bh - m.gap - m.height) * 0.3}]});
          }
        }
      }
      if (shape !== 'landscape') {
        for (const bf of [0.3, 0.36]) {
          const bw = D.w * bf, tw = D.w - bw - GAP;
          // the building with its two name chips beside it (not under it), then the texts in one to three columns
          const aw = Math.min(bw * 0.42, 130 / px);
          const mn = measureStack(ctx, nameItems, bw - aw - 12 / px, F);
          const one = measureStack(ctx, panelItems, tw, F);
          const opts = [one.truncated ? null : {height: one.height, cols: [one], truncated: false}];
          for (const n of shape === 'square' ? [2, 3] : [2]) { const c = twoCols(panelItems, (tw - GAP * (n - 1)) / n, F, n); if (c) opts.push({height: c.h, cols: c.cols, truncated: false}); }
          const mt = opts.filter(Boolean).sort((a, b) => a.height - b.height)[0] || {truncated: true};
          if (mn.truncated || mt.truncated) continue;
          const bh = aw * 0.95;
          const bandH = Math.max(bh, mn.height, mt.height);
          if (bandH > D.h * 0.45) continue;
          const top = shape === 'portrait';
          const y0 = top ? 0 : D.h - bandH;
          for (const axis of ['h', 'v']) {
            out.push({kind: 'band', axis, box: {x: 0, y: top ? bandH + GAP : 0, w: D.w, h: D.h - bandH - GAP}, bld: {x: 0, y: y0 + (bandH - bh) / 2, w: aw, h: bh},
              parts: [...(mn.height ? [{m: mn, x: aw + 12 / px, y: y0 + (bandH - mn.height) / 2}] : []), ...mt.cols.map((m, j) => ({m, x: bw + GAP + j * ((tw - GAP * (mt.cols.length - 1)) / mt.cols.length + GAP), y: y0 + (bandH - m.height) / 2}))]});
          }
        }
      }
      return out;
    };

    const finish = A => {
      const {F, k, toD, cd, chips, pick, G, axis} = A;
      const problems = [...(A.problems || [])];
      const M = G.M;
      const DX = G.DX;
      // ---- element geometry (design units)
      const rad = PERSON_RAD * k;
      const hC = toD(M(0, 0)), rC = toD(M(DX, 0));
      const tokenRest = toD(toWorld(G.seats.holder, LOCAL.rest.x, LOCAL.rest.y));
      const lampDock = G.lampDockT.map(toD);
      const lampT = G.lampT;
      const lampR = clamp(F * 0.95 / k, 22, 36) * k;
      const cAnchor = toD(M(DX / 2, -(95 + G.cardGap)));
      const cardBox = cd
        ? (axis === 'h' ? {x: cAnchor.x - cd.w / 2, y: cAnchor.y - cd.h, w: cd.w, h: cd.h} : {x: cAnchor.x - cd.w, y: cAnchor.y - cd.h / 2, w: cd.w, h: cd.h})
        : (axis === 'h' ? {x: cAnchor.x - 40, y: cAnchor.y - 40, w: 80, h: 40} : {x: cAnchor.x - 80, y: cAnchor.y - 20, w: 80, h: 40});
      const lb0 = {x: Math.min(lampDock[0].x, lampDock[1].x), y: Math.min(lampDock[0].y, lampDock[1].y)}, lb1 = {x: Math.max(lampDock[0].x, lampDock[1].x), y: Math.max(lampDock[0].y, lampDock[1].y)};
      const els = {
        holder: {circle: {x: hC.x, y: hC.y, r: rad * 1.05}},
        receiver: {circle: {x: rC.x, y: rC.y, r: rad * 1.05}},
        signal: {circle: {x: tokenRest.x, y: tokenRest.y, r: 26 * k}},
        lamps: {box: {x: lb0.x - lampR - 12 * k, y: lb0.y - lampR - 12 * k, w: lb1.x - lb0.x + 2 * lampR + 24 * k, h: lb1.y - lb0.y + 2 * lampR + 24 * k}},
        sequence: {box: cardBox},
        room: {box: {...pick.bld}},
      };
      const ctr = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
      const anc = (e, toward, pad) => (e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad));
      // participant chips on the +v side of each person, pushed outward along u until they clear the table
      // participant chips on the +v side of each person, beyond the table edge, centred on the person
      const chipBoxes = chips.map((c, i) => {
        const P = i ? rC : hC;
        const edge = toD(M(i ? DX : 0, 107));
        if (axis === 'h' && A.inward) return {x: i ? P.x + 60 * k - c.w : P.x - 60 * k, y: edge.y, w: c.w, h: c.h};
        return axis === 'h' ? {x: P.x - c.w / 2, y: edge.y, w: c.w, h: c.h} : {x: edge.x, y: P.y - c.h / 2, w: c.w, h: c.h};
      });
      const tbA = toD(M(48, -95)), tbB = toD(M(DX - 48, 95));
      const tableBox = {x: Math.min(tbA.x, tbB.x), y: Math.min(tbA.y, tbB.y), w: Math.abs(tbB.x - tbA.x), h: Math.abs(tbB.y - tbA.y)};
      // ---- connectors (only the supplied relationships), anchored to the edges of their parts
      const rels = (p.relationships || []).filter(q => els[q.from] && els[q.to] && q.from !== q.to);
      const conns = rels.map((rel, i) => {
        const A0 = els[rel.from], B0 = els[rel.to];
        // along the table the relation from the signal runs straight (the token glides on it)
        const straight = (rel.from === 'signal' && rel.to === 'receiver') || (rel.from === 'receiver' && rel.to === 'signal');
        const from = anc(A0, ctr(B0), 6), to = anc(B0, ctr(A0), rel.kind === 'relation' ? 6 : 12);
        const c = connector(ctx, {name: `rel${i}`, from, to, kind: rel.kind, bend: straight ? 0 : (i % 2 ? -0.12 : 0.12), color: kindColor(ctx, rel.kind)});
        return {rel, c};
      });
      // relation captions: beside each connector, clear of every part, chip and other caption
      const obstacles = [...Object.values(els).map(e => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box)), ...chipBoxes, (() => { const q = toD(toWorld(G.seats.receiver, LOCAL.rest.x, LOCAL.rest.y)); return {x: q.x - 26 * k, y: q.y - 26 * k, w: 52 * k, h: 52 * k}; })()];
      const placed = [];
    // the token's path along the table (it glides there): a band as wide as the token
    const rest0 = toD(toWorld(G.seats.holder, LOCAL.rest.x, LOCAL.rest.y)), rest1 = toD(toWorld(G.seats.receiver, LOCAL.rest.x, LOCAL.rest.y));
    obstacles.push({x: Math.min(rest0.x, rest1.x) - 30 * k, y: Math.min(rest0.y, rest1.y) - 30 * k, w: Math.abs(rest1.x - rest0.x) + 60 * k, h: Math.abs(rest1.y - rest0.y) + 60 * k});
      const capW = Math.min(300 / px, D.w * 0.3);
      // links of the same kind leaving the same part share one caption (e.g. the two sequence links from the card)
      const sharedWith = conns.map((x, i) => conns.findIndex((y, j) => j < i && y.rel.kind === x.rel.kind && y.rel.from === x.rel.from));
      const labs = showAll ? conns.map((x, i) => {
        if (sharedWith[i] !== -1) return {shared: sharedWith[i]};
        const text = p.relationLabels[x.rel.kind] || x.rel.kind;
        const fit = fitG(text, {maxWidth: capW - F * 1.1, size: F, minSize: F, maxLines: 2, weight: 600});
        const w = fit.width + F * 1.1, hh = fit.height + F * 0.6;
        let best = null;
        // the caption sits on its own connector (the chip interrupts the line) or just beside it, clear of every
        // part, chip, caption, the token's path and every other connector
        const others = conns.filter((o2, j) => j !== i).flatMap(o2 => Array.from({length: 30}, (_, s2) => o2.c.at(s2 / 29)));
        const B0 = pick.box;
        const cands = [];
        for (const d of [0, 22, -22, 44, -44, 70, -70, 100, -100, 140, -140, 180, -180, 230, -230]) for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78]) cands.push([t, d]);
        for (const [t, d] of cands) {
          const m = x.c.at(t);
          const dx = x.c.to.x - x.c.from.x, dy = x.c.to.y - x.c.from.y, L2 = Math.hypot(dx, dy) || 1;
          const c0 = {x: m.x - (dy / L2) * d, y: m.y + (dx / L2) * d};
          const b = {x: c0.x - w / 2, y: c0.y - hh / 2, w, h: hh};
          if (b.x < B0.x + 2 || b.y < B0.y + 2 || b.x + w > B0.x + B0.w - 2 || b.y + hh > B0.y + B0.h - 2) continue;
          const ob = [...obstacles, ...placed].findIndex(q => overlap(b, q, 6));
          if (ob >= 0) continue;
          if (others.some(q => q.x > b.x - 6 && q.x < b.x + w + 6 && q.y > b.y - 6 && q.y < b.y + hh + 6)) continue;
          // a caption away from its line gets a short leader; the leader crosses no part or chip
          if (Math.abs(d) > 30) {
            const q = {x: clamp(m.x, b.x + 6, b.x + w - 6), y: clamp(m.y, b.y, b.y + hh)};
            let hit = false;
            for (let j2 = 2; j2 < 12 && !hit; j2++) {
              const z = {x: m.x + (q.x - m.x) * j2 / 12, y: m.y + (q.y - m.y) * j2 / 12};
              hit = [...obstacles.slice(0, -1), ...placed].some(o3 => z.x > o3.x && z.x < o3.x + o3.w && z.y > o3.y && z.y < o3.y + o3.h);
            }
            if (hit) continue;
          }
          best = {box: b, fit, m, d: Math.abs(d), sib: -1};
          break;
        }
        if (best) placed.push(best.box);
        return best;
      }) : [];
      if (labs.some(q => !q)) problems.push('captions:' + labs.map((q, i) => q ? '' : i).join(''));
      // ---- hop (the token passes from holder to receiver) and the tracer route
      const people = pair.map((s, i) => turnPerson(ctx, `p${i}`, s.look));
      const order = (p.traversalOrder || []).filter(id => els[id]);
      const pts = [];
      const visits = [];
      order.forEach((id, i) => {
        const e = els[id];
        const nxt = els[order[i + 1]] || els[order[i - 1]];
        if (i === 0) { pts.push(e.box && nxt ? anc(e, ctr(nxt), 10) : ctr(e)); visits.push({id, idx: 0}); return; }
        const prev = order[i - 1];
        const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
        if (link) {
          const fwd = link.rel.from === prev;
          for (let s = 0; s <= 30; s++) pts.push(link.c.at(fwd ? s / 30 : 1 - s / 30));
        } else {
          pts.push(anc(els[prev], ctr(e), 4), anc(e, ctr(els[prev]), 4));
        }
        if (!e.box) pts.push(ctr(e));
        visits.push({id, idx: pts.length - 1});
      });
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const total = cum[cum.length - 1] || 1;
      const route = {poly: polyline(pts.length > 1 ? pts : [pts[0] || {x: 0, y: 0}, pts[0] || {x: 1, y: 0}]), visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
      // the pass happens while the tracer runs from the signal to the receiver (or, when the order has no such leg,
      // in the middle of the trace)
      const vt = id => (route.visits.find(v => v.id === id) || {}).t;
      const tS = vt('signal'), tR = vt('receiver');
      const tr0 = lerp(W.trace[0], W.trace[1], tS !== undefined && tR !== undefined && tR > tS ? tS : 0.35);
      const tr1 = lerp(W.trace[0], W.trace[1], tS !== undefined && tR !== undefined && tR > tS ? tR : 0.7);
      const hops = planHops(G, hs, [0, 1], {a: tr0 - (tr1 - tr0) * 0.08, b: tr1 + (tr1 - tr0) * 0.25});
      const tL = vt('lamps');
      const lampU = lerp(W.trace[0], W.trace[1], tL !== undefined ? tL : 1);
      const panel = pick.parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => it.name === 'state-tag'}));
      const building = buildingElevation(ctx, {name: 'bld', x: pick.bld.x, y: pick.bld.y, w: pick.bld.w, h: pick.bld.h, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}});
      return {F, px, k, toD, G, M, axis, hs, pair, seq, seats, cd, cardBox, chips, chipBoxes, els, conns, labs, people, route, hops, lampU, lampT, lampDock, lampR, panel, building, tableBox,
        bldBox: {...pick.bld}, problems, log: LOG, arrangement: `${pick.kind}-${axis}`, labelOf: label, hasState: panel.some(q => q.name === 'state-tag'), focus: p.focusElement};
    };
    const Fmin = 16.6 / px;
    const LOG = [];
    let best = null;
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      const Fe = showKey ? F : Fmin;
      const cands = [];
      for (const pick of arrangements(Fe)) {
        for (const allowIn of pick.axis === 'h' ? [true, false] : [true]) {
        const c = compose(Fe, pick.box, pick.axis, allowIn);
        LOG.push(c ? `${(Fe * px).toFixed(1)}:${pick.kind}${pick.axis}:k${c.k.toFixed(2)}` : `${(Fe * px).toFixed(1)}:${pick.kind}${pick.axis}:null`);
        if (c) cands.push({...c, pick});
        }
      }
      const sc = c => c.k * (shape !== 'landscape' && c.axis === 'v' ? 1.3 : 1);
      cands.sort((x, y) => sc(y) - sc(x));
      for (const c of cands) {
        const res = finish(c);
        const ok = !res.problems.length && c.k * PERSON_RAD * 2 * px >= 61.5;
        // among working compositions a slightly smaller text (never under 19.5 px, at most 2.4 px less) wins when its
        // mechanism is clearly larger (square frames: the text panel otherwise crowds the mechanism)
        if (!best || (ok && !best.ok) || (ok && best.ok && c.k > best.k * 1.05) || (ok === best.ok && !ok && res.problems.length < best.res.problems.length)) best = {res, ok, k: c.k, F: Fe};
        if (ok) break;
      }
      if (!showKey) break;
      if (best && best.ok && (shape !== 'square' || Fe - 0.8 / px < Math.max(19.5 / px, best.F - 2.4 / px) - 1e-6)) break;
    }
    if (!best) {
      const pick = {kind: 'column', axis: 'h', box: {x: 0, y: 0, w: D.w * 0.74, h: D.h}, bld: {x: D.w * 0.78, y: 0, w: D.w * 0.2, h: D.h * 0.3}, parts: []};
      const c = compose(Fmin, pick.box, 'h') || {F: Fmin, k: 0.5, ox: 0, oy: D.h / 2, toD: q => ({x: q.x * 0.5, y: D.h / 2 + q.y * 0.5}), cd: null, chips: [], G: geomOf('h'), axis: 'h'};
      best = {res: finish({...c, pick, problems: ['layout']}), ok: false};
    }
    best.res.log = LOG;
    return best.res;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const DX = L.G.DX;
    const {k} = L;
    const tc = L.M(DX / 2, 0);
    const plan = g({name: 'plan', transform: T(L.toD({x: 0, y: 0}).x, L.toD({x: 0, y: 0}).y, 0, k)},
      planTable(ctx, {name: 'table', cx: tc.x, cy: tc.y, w: DX - 96, h: 190, deg: L.axis === 'h' ? 0 : 90, seedKey: 'mtbl'}),
      L.hs.map((s, i) => {
        const pose = L.G.seats[s.slot];
        const c0 = toWorld(pose, 0, 16);
        return planChair(ctx, {name: `chair${i}`, cx: c0.x, cy: c0.y, deg: pose.deg, s: 64});
      }),
      L.people.map(pp => pp.node),
      L.hs.map((s, i) => { const q = toWorld(L.G.seats[s.slot], LOCAL.badge.x, LOCAL.badge.y); return partyGlyph(ctx, s.party, {x: q.x, y: q.y, R: 17, name: `badge${i}`}); }),
    );
    // lamps and token in design units (they move between the table and their docks)
    const lamps = [0, 1].map(i => g({name: `lampw${i}`}, lampNode(ctx, {name: `lamp${i}`, x: 0, y: 0, R: L.lampR, num: ctx.show('key') ? i + 1 : null, fontSize: L.F})));
    const token = g({name: 'token'}, g({name: 'token-scale'}, g({transform: `scale(${r(L.k, 4)})`}, tokenNode(ctx, {name: 'token-body', s: 42}))));
    // labels hidden: the sequence card shows the supplied order as party glyphs with small solid chevrons (no text)
    const glyphCard = L.cd && L.cd.glyphOnly ? g({name: 'card', opacity: 0},
      h('path', {d: roundRectPath(L.cardBox.x, L.cardBox.y, L.cardBox.w, L.cardBox.h, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
      L.seq.map((si, j) => {
        const R = L.cd.R;
        const cx = L.cardBox.x + R * 2 + j * R * 3.6, cy = L.cardBox.y + L.cardBox.h / 2;
        return g(null, partyGlyph(ctx, L.seats[si].party, {x: cx, y: cy, R}),
          j < L.seq.length - 1 ? h('path', {d: `M${r(cx + R * 1.35)} ${r(cy - R * 0.45)}L${r(cx + R * 1.85)} ${r(cy)}L${r(cx + R * 1.35)} ${r(cy + R * 0.45)}Z`, fill: th.ink}) : null);
      })) : null;
    const card = L.cd && !L.cd.glyphOnly ? g({name: 'card', opacity: 0},
      h('path', {d: roundRectPath(L.cardBox.x, L.cardBox.y, L.cardBox.w, L.cardBox.h, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
      textAt(L.cd.title, L.cardBox.x + L.F * 0.6, L.cardBox.y + L.cd.padY, th.fg, {name: 'card-title'}),
      (() => {
        let yy = L.cardBox.y + L.cd.padY + L.cd.title.height + L.F * 0.35;
        return L.cd.rows.map(row => {
          const node = g(null,
            partyGlyph(ctx, L.seats[row.si].party, {x: L.cardBox.x + L.F * 0.6 + L.F * 0.55, y: yy + L.F * 0.55, R: L.F * 0.5}),
            textAt(row.fit, L.cardBox.x + L.F * 0.6 + L.F * 1.6, yy, th.fg));
          yy += row.fit.height + L.F * 0.32;
          return node;
        });
      })()) : null;
    const chipNodes = L.chips.map((c, i) => {
      const b = L.chipBoxes[i];
      return g({name: `lab${i}`, 'data-owner': `p${i}`},
        h('path', {name: `lab${i}-body`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, L.F * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
        h('text', {name: `lab${i}-text`, x: r(b.x + b.w / 2), y: r(b.y + L.F * 0.35 + c.f1.size * 0.8), 'font-family': SANS, 'font-size': r(c.f1.size, 2), 'font-weight': 600, 'text-anchor': 'middle', fill: th.ink},
          c.f1.lines.map((ln, j) => h('tspan', {x: r(b.x + b.w / 2), dy: j === 0 ? 0 : r(c.f1.lineHeight, 2)}, ln))),
        c.f2 ? h('text', {name: `lab${i}-cap`, x: r(b.x + b.w / 2), y: r(b.y + L.F * 0.35 + c.f1.height + L.F * 0.38 + c.f2.size * 0.8), 'font-family': SANS, 'font-size': r(c.f2.size, 2), 'font-weight': 500, 'text-anchor': 'middle', fill: th.fgSoft},
          c.f2.lines.map((ln, j) => h('tspan', {x: r(b.x + b.w / 2), dy: j === 0 ? 0 : r(c.f2.lineHeight, 2)}, ln))) : null);
    });
    const lead = (lb, m, col) => {
      const q = {x: clamp(m.x, lb.box.x + 6, lb.box.x + lb.box.w - 6), y: clamp(m.y, lb.box.y, lb.box.y + lb.box.h)};
      return Math.hypot(q.x - m.x, q.y - m.y) > 10 ? h('line', {x1: r(m.x), y1: r(m.y), x2: r(q.x), y2: r(q.y), stroke: col, 'stroke-width': 2}) : null;
    };
    const caps = L.labs.map((lb, i) => lb && !('shared' in lb) && g({name: `cap${i}`, opacity: 0},
      lead(lb, lb.m, kindColor(ctx, L.conns[i].rel.kind)),
      lb.sib >= 0 ? lead(lb, L.conns[lb.sib].c.at(0.3), kindColor(ctx, L.conns[i].rel.kind)) : null,
      h('path', {d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, L.F * 0.7)), fill: th.card, stroke: kindColor(ctx, L.conns[i].rel.kind), 'stroke-width': 2}),
      textAt(lb.fit, lb.box.x + L.F * 0.55, lb.box.y + L.F * 0.3, th.fg)));
    return g(null,
      L.building.node,
      plan,
      L.conns.map(x => x.c.node),
      tracer(ctx, 'tracer', th.accent2),
      caps,
      lamps,
      token,
      card || glyphCard,
      chipNodes,
      L.panel.map(q => q.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const DX = L.G.DX;
    const sep = ease.inOutCubic(seg(u, ...W.sep));
    // lamps lift off the table to their dock below it
    const st = turnAt(L.G, L.hs, [0, 1], L.hops, u);
    const lampsNow = [0, 1].map(i => {
      const a = L.toD(L.lampT[i]), b = L.lampDock[i];
      return {x: lerp(a.x, b.x, sep), y: lerp(a.y, b.y, sep)};
    });
    // the lamps follow the token (cause before effect): the holder's lamp goes out once the token has left the
    // hand, the receiver's lamp lights only after it has arrived — never two lit at once
    const lampsState = st.lamps;
    // the tracer and the focus element (whichever part is in focus enlarges while the tracer is on it)
    const tp = seg(u, ...W.trace);
    const tq = L.route.poly.at(tp);
    // the tracer rests on the last part for a moment (so a part visited last still enlarges under it)
    const onTrace = u >= W.trace[0] && u <= W.trace[1] + 0.055;
    nodes.tracer = {opacity: onTrace ? 1 : 0, transform: T(tq.x, tq.y)};
    const visit = L.route.visits.find(v => v.id === L.focus);
    const fT = visit ? clamp(lerp(W.trace[0], W.trace[1], visit.t), W.trace[0] + 0.05, W.trace[1] + 0.005) : -1;
    const grow = visit && onTrace ? Math.max(0, 1 - Math.abs(u - fT) / 0.05) : 0;
    const fs = 1 + 0.35 * ease.inOutSine(clamp(grow));
    const fsOf = id => (L.focus === id ? fs : 1);
    const lc = {x: (lampsNow[0].x + lampsNow[1].x) / 2, y: (lampsNow[0].y + lampsNow[1].y) / 2};
    [0, 1].forEach(i => {
      const f = fsOf('lamps');
      nodes[`lampw${i}`] = {transform: T(lc.x + (lampsNow[i].x - lc.x) * f, lc.y + (lampsNow[i].y - lc.y) * f, 0, r(f, 4))};
      Object.assign(nodes, lampFrame(`lamp${i}`, lampsState[i], false));
    });
    L.hs.forEach((s, i) => Object.assign(nodes, seatedPose(L.people[i], L.G.seats[s.slot], st.hands[i], fsOf(i ? 'receiver' : 'holder'))));
    const tk = L.toD(st.token);
    nodes.token = {transform: T(tk.x, tk.y)};
    nodes['token-scale'] = {transform: `scale(${r(fsOf('signal'), 4)})`};
    const bb = L.bldBox;
    nodes.bld = {transform: scaleAbout(bb.x + bb.w / 2, bb.y + bb.h / 2, r(fsOf('room'), 4))};
    // connectors draw one by one; captions after their line
    const n = L.conns.length;
    L.conns.forEach((x, i) => {
      const a = W.relate[0] + (i * (W.relate[1] - W.relate[0])) / Math.max(1, n);
      const pr = seg(u, a, a + (W.relate[1] - W.relate[0]) / Math.max(1, n) * 0.8);
      Object.assign(nodes, x.c.frame(pr, pr > 0 ? 1 : 0));
      if (L.labs[i] && !('shared' in L.labs[i])) nodes[`cap${i}`] = {opacity: r(seg(u, a + 0.03, a + 0.06), 3)};
    });
    if (L.cd) nodes.card = {opacity: r(sep, 3), transform: `${T(0, (1 - sep) * -30)} ${scaleAbout(L.cardBox.x + L.cardBox.w / 2, L.cardBox.y + L.cardBox.h / 2, r(fsOf('sequence'), 4))}`};
    if (L.hasState) nodes['state-tag'] = {opacity: r(seg(u, ...W.tag), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    // each connector ends on its own element (distance of the end points to the element edges, design units)
    const edgeDist = (e, q) => (e.circle ? Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r) : Math.max(0, Math.max(e.box.x - q.x, q.x - e.box.x - e.box.w, e.box.y - q.y, q.y - e.box.y - e.box.h)));
    const visited = L.route.visits.filter(v => u >= lerp(W.trace[0], W.trace[1], v.t)).map(v => v.id);
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sep, 3),
        token: R2(tk),
        holder: st.holder === null ? null : L.pair[st.holder].label,
        receiver: L.pair[1].label,
        lamps: lampsState.map(v => r(v, 3)),
        tracer: R2(tq),
        tracerOn: onTrace,
        visited,
        focusScale: r(fs, 3),
        lit: lampsState.filter(v => v > 0.5).length,
        focus: L.focus,
        kinds: L.conns.map(x => x.rel.kind),
        arrows: L.conns.filter(x => x.rel.kind !== 'relation').length,
        connectorsLanded: L.conns.every(x => edgeDist(L.els[x.rel.from], x.c.from) <= 16 && edgeDist(L.els[x.rel.to], x.c.to) <= 16),
        drawn: L.conns.map((x, i) => r(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / Math.max(1, L.conns.length), W.relate[0] + ((i + 0.8) * (W.relate[1] - W.relate[0])) / Math.max(1, L.conns.length)), 3)),
        allReached: st.reached,
        textPx: r(L.F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        problems: L.problems,
        arrangement: L.arrangement,
        log: L.log,
        p0: R2(L.toD(L.M(0, 0))),
        p1: R2(L.toD(L.M(DX, 0))),
        axis: L.axis,
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
    slug: 'courts-06-mechanism',
    title: 'Turn organisation — the parts of passing a turn signal and how they relate',
    titleEs: 'Organización de turnos — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Organización de turnos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The passing of a turn signal is taken apart around one table piece: the participant holding the signal and the next one as configured (party badges ● / ◆ of equal weight), the token, the two turn lamps lifted off the table and the sequence card ("sequence as configured, illustrative"), with the generic building as anchor. Only the supplied relationships are drawn, anchored to their parts and styled by kind (plain relations never have arrows); a tracer follows the supplied order, the focus element enlarges, the token is passed by hand and the receiver’s lamp lights after it arrives. No required order, time per turn or consequence is stated.',
    tags: ['mechanism', 'turns', 'turn signal', 'sequence as configured', 'relations by kind', 'tracer', 'active turn', 'pending turn', 'hand-off', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/organizacion-de-turnos.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
