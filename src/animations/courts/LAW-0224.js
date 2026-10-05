/**
 * LAW-0224 — Organización de turnos · inspect
 *
 * Storyboard (the context is the state produced by the story: the plan of the
 * generic hearing room inside its building, everyone seated; one participant
 * holds the turn signal with their lamp lit; on the table in front of the
 * inspected participant lies a small record card with the supplied value of
 * their turn, e.g. "Turn: pending (waiting, as supplied)"):
 *  0.00–0.20  build: the plan fills its area beside a panel (building, names,
 *             key, context caption); the card is readable.
 *  0.20–0.45  isolate: a frame settles on the detail — the holder and the
 *             inspected participant, their lamps, the token and the card; the
 *             panel steps aside (fully faded before the lens appears), the plan
 *             shrinks a little towards its far side and a lens opens in the
 *             freed space with a REAL enlarged copy of the same coordinates
 *             (≥ 1.5× the context; its enlarged content fades in from 40 %
 *             open, so no empty outline stays on screen).
 *  0.45–0.75  substitute ONE datum: the old value is struck through, lifts
 *             and docks under the card as a grey "was: …" chip; the new value
 *             appears and stays still. Only the dependent state follows: for a
 *             turn-state substitution the holder pushes the token to the
 *             inspected participant, who catches it, the holder's lamp goes
 *             out and the inspected participant's lamp lights after the token
 *             arrives; for a wording substitution nothing moves.
 *  0.75–1.00  return: the enlarged copy fades out first, the lens closes, the
 *             plan grows back, the panel returns and a neutral changed-datum
 *             marker (Δ) sits on the card; the panel repeats the marker. Seeking
 *             back restores the old datum exactly. Nothing about validity,
 *             order, procedure or consequence is inferred.
 * @module animations/courts/LAW-0224
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  turnFields, TURN_EN, TURN_STRINGS, resolveTurns, planHops, turnAt, seatedPose, turnPerson, turnArt, lampFrame, tokenNode,
  seatChipNode, fitPlan, measureStack, drawStack, fitG, textAt, widestWord, seatPose, lampAt, restAt, toWorld, pxPerUnit, R2, T, PERSON_RAD,
} from './kits/organizacion-de-turnos.js';

const ID = 'LAW-0224';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.2, 0.23], panelOut: [0.2, 0.23], shrink: [0.21, 0.25], open: [0.23, 0.27],
  strike: [0.46, 0.5], dock: [0.51, 0.55], newIn: [0.555, 0.585], pass: [0.59, 0.68],
  close: [0.73, 0.745], ctxBack: [0.7405, 0.7465], grow: [0.745, 0.772], panelIn: [0.747, 0.772], marker: [0.8, 0.84],
};
const TARGETS = ['turnState', 'wording'];
const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = '#1f2328';

const STRINGS = {en: {...TURN_STRINGS.en}, es: {...TURN_STRINGS.es}};

const sceneSchema = {
  ...turnFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied turn state of the inspected participant (the signal then passes to them) or only the wording on the card (nothing moves)', TARGETS),
  beforeValue: str('Value on the card before the substitution (as supplied)', 60),
  afterValue: str('Value on the card after the substitution (the alternative datum, as supplied)', 60),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context it is taken from', 1.5, 4),
    placement: oneOf('Where the lens sits', ['auto']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
  }),
};

const defaultParams = {
  ...TURN_EN,
  routes: [0, 2],
  focusTarget: 'turnState',
  beforeValue: 'Turn: pending (waiting, as supplied)',
  afterValue: 'Turn: active (as supplied)',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'The supplied turns at one table, one datum inspected', marker: 'One supplied datum changed'},
};

const ov = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

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
    const H = seq[0], X = seq[1];
    const moves = p.focusTarget === 'turnState';
    const shape = ctx.view.shape;
    const GAP = 26 / px;
    const cols = Math.max(2, ...seats.map(s => Number(s.slot.slice(-1))));
    const wasText = `${ctx.t.was}: ${p.beforeValue}`;
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const panelItems = [
      ...(showAll ? [{type: 'text', text: p.contextLabels.context, weight: 600, name: 'ctx-caption'}] : []),
      ...(showKey ? [
        {type: 'legend', kind: 'active', text: p.labels.active, weight: 600, name: 'legend-active', group: 'state'},
        {type: 'legend', kind: 'pending', text: p.labels.pending, weight: 600, name: 'legend-pending', group: 'state'},
        {type: 'legend', kind: 'marker', text: p.contextLabels.marker, name: 'marker-note'},
        {type: 'key', text: p.labels.key, name: 'key'},
      ] : []),
    ];
    const vw = shape === 'landscape' ? 1920 : 1080; // frame width at 1080p

    const arrangements = F => {
      const out = [];
      const minB = Math.min(150 / px, D.h * 0.2);
      if (shape !== 'portrait') {
        for (const cf of shape === 'square' ? [0.3, 0.36, 0.42] : [0.24, 0.28, 0.32]) {
          const pw = Math.max(250 / px, D.w * cf);
          const m = measureStack(ctx, [...nameItems, ...panelItems], pw, F);
          const bh = Math.min(D.h - m.height - m.gap, pw * 0.9, D.h * 0.42);
          if (m.truncated || bh < minB) continue;
          const bw = Math.min(pw, bh / 0.9);
          out.push({kind: 'column', side: 'right', box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - bw) / 2, y: 0, w: bw, h: bh},
            parts: [{m, x: D.w - pw, y: bh + m.gap + (D.h - bh - m.gap - m.height) * 0.3}]});
        }
      }
      if (shape !== 'landscape') {
        for (const bf of [0.3, 0.36]) {
          const bw = D.w * bf, tw = D.w - bw - GAP;
          const mn = measureStack(ctx, nameItems, bw, F);
          const mt = measureStack(ctx, panelItems, tw, F);
          if (mn.truncated || mt.truncated) continue;
          const bh = Math.min(bw * 0.9, Math.max(minB, mt.height - (mn.height ? mn.height + mn.gap : 0)));
          const bandH = Math.max(bh + (mn.height ? mn.gap + mn.height : 0), mt.height);
          if (bandH > D.h * 0.45) continue;
          const top = shape === 'portrait';
          const y0 = top ? 0 : D.h - bandH;
          out.push({kind: 'band', side: top ? 'top' : 'bottom', box: {x: 0, y: top ? bandH + GAP : 0, w: D.w, h: D.h - bandH - GAP}, bld: {x: 0, y: y0, w: bw, h: bh},
            parts: [...(mn.height ? [{m: mn, x: 0, y: y0 + bh + mn.gap}] : []), {m: mt, x: bw + GAP, y: y0 + (bandH - mt.height) / 2}]});
        }
      }
      return out;
    };

    /** The card (record of the inspected participant's turn) at text size F for a plan scale k. */
    const cardFits = (F, k, S) => {
      const cw = Math.min(Math.max(S * k * 0.95, 236 / px), 380 / px, S * k * 1.8);
      const o = {maxWidth: cw - F * 1.2, size: F, minSize: F, maxLines: 3};
      const fB = fitG(p.beforeValue, {...o, weight: 600});
      const fA = fitG(p.afterValue, {...o, weight: 600});
      const fW = fitG(wasText, {...o, weight: 500});
      const bad = [fB, fA, fW].some(f => f.truncated || f.lines.some(l => l.trim().length <= 2))
        || [p.beforeValue, p.afterValue, wasText].some(t => widestWord(ctx, t, F, 600) > cw - F * 1.2);
      const padY = F * 0.4;
      const cardH = Math.max(fB.height, fA.height) + padY * 2;
      const wasH = fW.height + padY * 2;
      return {cw, fB, fA, fW, padY, cardH, wasH, wasW: fW.width + F * 1.2, bad};
    };

    const compose = (F, pick) => {
      let ta = 300, pl = null, cd = null;
      for (let it = 0; it < 3; it++) {
        pl = fitPlan(ctx, seats, pick.box, 'h', F, {showKey, cols, ta, spacings: [240, 280, 320, 360]});
        if (!pl) return null;
        cd = showKey ? cardFits(F, pl.k, pl.G.S) : null;
        if (cd && cd.bad) return null;
        const need = cd ? 128 - 48 + (cd.cardH + 8 / px + cd.wasH) / pl.k + 160 : 300;
        if (Math.abs(need - ta) < 4) break;
        ta = Math.max(190, need);
      }
      const {G, k, toD} = pl;
      const sX = G.seats[seats[X].slot], sH = G.seats[seats[H].slot];
      const Px = toD(sX);
      const inward = -sX.out.y; // +1: the table is below the person
      let card = null, was = null;
      if (cd) {
        const edge = Px.y + inward * 128 * k;
        // the card lies in front of the inspected participant, shifted away from the holder so that it never reaches
        // under the holder's lamp (a crop of the inspected participant alone can then leave the holder out whole)
        const hx = toD(G.seats[seats[H].slot]).x, lhx = toD(lampAt(G, seats[H].slot)).x;
        const sameRow = G.seats[seats[H].slot].row === sX.row;
        const hEdge = hx < Px.x ? Math.max(hx + 60 * k, lhx + 50 * k) + 6 / px : Math.min(hx - 60 * k, lhx - 50 * k) - 6 / px;
        let cx = Px.x;
        if (sameRow) cx = hx < Px.x ? Math.max(cx, hEdge + Math.max(cd.cw, cd.wasW) / 2) : Math.min(cx, hEdge - Math.max(cd.cw, cd.wasW) / 2);
        card = {x: cx - cd.cw / 2, y: inward > 0 ? edge : edge - cd.cardH, w: cd.cw, h: cd.cardH};
        const wy = inward > 0 ? card.y + card.h + 8 / px : card.y - 8 / px - cd.wasH;
        was = {x: cx - cd.wasW / 2, y: wy, w: cd.wasW, h: cd.wasH};
      }
      // the crop: both people, their lamps, the token's path and the card with its docked value (the seat chips stay
      // outside it whole: they sit beyond the people, in the label band)
      const cropFor = ids => {
      const boxes = [];
      for (const si of ids) {
        const P = toD(G.seats[seats[si].slot]);
        boxes.push({x: P.x - 60 * k, y: P.y - 60 * k, w: 120 * k, h: 120 * k});
        const lp = toD(lampAt(G, seats[si].slot));
        boxes.push({x: lp.x - 50 * k, y: lp.y - 50 * k, w: 100 * k, h: 100 * k});
      }
      if (card) boxes.push(card, was);
      const x0 = Math.min(...boxes.map(b => b.x)) - 14 / px, y0 = Math.min(...boxes.map(b => b.y)) - 14 / px;
      const x1 = Math.max(...boxes.map(b => b.x + b.w)) + 14 / px, y1 = Math.max(...boxes.map(b => b.y + b.h)) + 14 / px;
      let crop = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
      // never cut a chip: the crop stops short of any chip it would touch
      for (const c of pl.chips.filter(Boolean)) {
        if (!ov(crop, c.box, 2)) continue;
        if (c.box.y + c.box.h <= Px.y) { const top = c.box.y + c.box.h + 4 / px; crop = {...crop, h: crop.y + crop.h - top, y: top}; }
        else if (c.box.y >= Px.y) { crop = {...crop, h: c.box.y - 4 / px - crop.y}; }
      }
      // a wide, low crop (no card) grows into the table so the lens is not a thin strip
      if (crop.h < crop.w * 0.72) {
        // (never as far as the opposite row: its lamps start about ta − 40 from the inspected person)
        const reach = Px.y + inward * (G.ta - 50) * k;
        const room = inward > 0 ? reach - (crop.y + crop.h) : crop.y - reach;
        const dh = Math.max(0, Math.min(crop.w * 0.72 - crop.h, room));
        crop = inward > 0 ? {...crop, h: crop.h + dh} : {...crop, y: crop.y - dh, h: crop.h + dh};
      }
      // the inspected participant alone: a near-square crop that reaches towards the holder (the token arrives from there)
      if (ids.length === 1 && crop.w < crop.h * 0.9) {
        const dw = crop.h * 0.9 - crop.w;
        const towards = toD(G.seats[seats[H].slot]).x < Px.x ? -1 : 1;
        crop = towards < 0 ? {...crop, x: crop.x - dw, w: crop.w + dw} : {...crop, w: crop.w + dw};
      }
      if (ids.length === 1) {
        const towards = toD(G.seats[seats[H].slot]).x < Px.x ? -1 : 1;
        // never cut the holder's lamp or person: the crop stops short of them
        const lh = toD(lampAt(G, seats[H].slot)), ph = toD(G.seats[seats[H].slot]);
        const qx0 = Math.min(lh.x - 50 * k, ph.x - 60 * k), qx1 = Math.max(lh.x + 50 * k, ph.x + 60 * k);
        for (const q of [{x: qx0, w: qx1 - qx0}]) {
          if (q.x < crop.x + crop.w && crop.x < q.x + q.w) {
            const cut = towards < 0 ? {...crop, x: q.x + q.w + 4 / px, w: crop.x + crop.w - q.x - q.w - 4 / px} : {...crop, w: q.x - 4 / px - crop.x};
            const keeps = !card || [card, was].every(b => b.x >= cut.x && b.x + b.w <= cut.x + cut.w);
            // cutting would split the card: take the holder's part in whole instead
            crop = keeps ? cut : towards < 0 ? {...crop, x: Math.min(crop.x, q.x - 4 / px), w: crop.x + crop.w - Math.min(crop.x, q.x - 4 / px)} : {...crop, w: Math.max(crop.x + crop.w, q.x + q.w + 4 / px) - crop.x};
          }
        }
      }
      // a crop too small for a readable lens grows away from the holder and into the table (never to the opposite row)
      const minS = 240 / px;
      if (crop.w < minS) {
        const towards = toD(G.seats[seats[H].slot]).x < Px.x ? -1 : 1;
        crop = towards < 0 || ids.length > 1 ? {...crop, w: minS} : {...crop, x: crop.x + crop.w - minS, w: minS};
      }
      if (crop.h < minS) {
        const reach = Px.y + inward * (G.ta - 50) * k;
        const room = inward > 0 ? reach - (crop.y + crop.h) : crop.y - reach;
        const dh = Math.max(0, Math.min(minS - crop.h, room));
        crop = inward > 0 ? {...crop, h: crop.h + dh} : {...crop, y: crop.y - dh, h: crop.h + dh};
      }
      return crop;
      };
      const planRect = {x: pl.ox, y: pl.oy, w: G.W * k, h: G.H * k};
      // lens: the plan shrinks towards its far side; the lens takes the panel's area plus the freed space
      const side = pick.side;
      const pivot = side === 'right' ? {x: planRect.x, y: planRect.y + planRect.h / 2} : side === 'top' ? {x: planRect.x + planRect.w / 2, y: planRect.y + planRect.h} : {x: planRect.x + planRect.w / 2, y: planRect.y};
      const personPx = PERSON_RAD * 2 * k * px;
      const lensFor = crop => {
      let best = null;
      for (let st = 0.95; st >= 0.55 - 1e-9; st -= 0.025) {
        const S0 = {x: pivot.x + (planRect.x - pivot.x) * st, y: pivot.y + (planRect.y - pivot.y) * st, w: planRect.w * st, h: planRect.h * st};
        const region = side === 'right' ? {x: S0.x + S0.w + GAP, y: 0, w: D.w - S0.x - S0.w - GAP, h: D.h}
          : side === 'top' ? {x: 0, y: 0, w: D.w, h: S0.y - GAP} : {x: 0, y: S0.y + S0.h + GAP, w: D.w, h: D.h - S0.y - S0.h - GAP};
        if (region.w < 60 / px || region.h < 60 / px) continue;
        // magnification against the context AT REST (scale 1), capped by the supplied zoom
        const Z = Math.min((region.w - 16 / px) / crop.w, (region.h - 16 / px) / crop.h, p.detailGeometry.zoom);
        const dest = {w: crop.w * Z, h: crop.h * Z};
        dest.x = region.x + (region.w - dest.w) / 2;
        dest.y = region.y + (region.h - dest.h) / 2;
        const rel = Z / st;
        const lensShort = Math.min(dest.w, dest.h) * px / 1080;
        const ctxW = S0.w * px / vw;
        const textOk = !showKey || F * px * st >= 16.5;
        const ok = Z >= 1.5 && lensShort >= 0.35 && ctxW >= 0.45 && personPx * st >= 46;
        const L = {st, S0, region, Z, dest, rel, lensShort, ctxW, ok, pivot};
        if (!best || (L.ok && !best.ok) || (L.ok && best.ok && L.lensShort > best.lensShort + 0.02) || (!L.ok && !best.ok && L.Z > best.Z)) best = L;
        if (best.ok && st < best.st - 0.1) break;
      }
      return best;
      };
      let crop = null, best = null;
      for (const ids of [[H, X], [X]]) {
        const c0 = cropFor(ids);
        const b0 = lensFor(c0);
        if (b0 && (!best || (b0.ok && !best.ok))) { best = b0; crop = c0; }
        if (best && best.ok) break;
      }
      if (!best) return null;
      return {F, pick, pl, cd, card, was, crop, planRect, lens: best, personPx};
    };

    const Fmin = 16.6 / px;
    const LOG = [];
    let A = null;
    const good = c => c.lens.ok && c.personPx >= 61.5;
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      const Fe = showKey ? F : Fmin;
      for (const pick of arrangements(Fe)) {
        const c = compose(Fe, pick);
        LOG.push(c ? `${(Fe * px).toFixed(1)}:${pick.kind}:k${c.pl.k.toFixed(2)}:st${c.lens.st.toFixed(2)}:z${c.lens.rel.toFixed(2)}:ls${c.lens.lensShort.toFixed(2)}:${c.lens.ok}` : `${(Fe * px).toFixed(1)}:${pick.kind}:null`);
        if (!c) continue;
        if (!A || (good(c) && !good(A)) || (good(c) === good(A) && c.pl.k > A.pl.k * 1.03)) A = c;
      }
      if ((A && good(A)) || !showKey) break;
    }
    const problems = [];
    if (!A) {
      problems.push('layout');
      const pick = {kind: 'column', side: 'right', box: {x: 0, y: 0, w: D.w * 0.7, h: D.h}, bld: {x: D.w * 0.76, y: 0, w: D.w * 0.2, h: D.h * 0.3}, parts: []};
      A = compose(Fmin, pick);
    }
    if (!A.lens.ok) problems.push('lens');
    const {F, pick, pl, cd, card, was, crop, lens} = A;
    const {G, k} = pl;
    const nums = new Map([[H, 1], [X, 2]]);
    const lampR = clamp(F * 0.95 / k, 22, 36);
    const mk = pre => ({
      art: turnArt(ctx, G, {prefix: `${pre}-rm`, seats, nums: null, lampR, numSize: F / k}),
      people: seats.map((s, i) => turnPerson(ctx, `${pre}-p${i}`, s.look)),
    });
    const copies = {cx: mk('cx'), lz: mk('lz')};
    const hops = planHops(G, seats, [H, X], {a: W.pass[0], b: W.pass[1]});
    const panel = pick.parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => it.name === 'marker-note'}));
    const building = buildingElevation(ctx, {name: 'bld', ...pick.bld, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}});
    // guides: from the frame's corners facing the lens to the lens corners, drawn only when clear of heads and chips
    const wt = q => ({x: lens.pivot.x + (q.x - lens.pivot.x) * lens.st, y: lens.pivot.y + (q.y - lens.pivot.y) * lens.st});
    const cS = {...wt(crop), w: crop.w * lens.st, h: crop.h * lens.st};
    const d = lens.dest;
    const pairs = pick.side === 'right'
      ? [[{x: cS.x + cS.w, y: cS.y}, {x: d.x, y: d.y}], [{x: cS.x + cS.w, y: cS.y + cS.h}, {x: d.x, y: d.y + d.h}]]
      : pick.side === 'top' ? [[{x: cS.x, y: cS.y}, {x: d.x, y: d.y + d.h}], [{x: cS.x + cS.w, y: cS.y}, {x: d.x + d.w, y: d.y + d.h}]]
        : [[{x: cS.x, y: cS.y + cS.h}, {x: d.x, y: d.y}], [{x: cS.x + cS.w, y: cS.y + cS.h}, {x: d.x + d.w, y: d.y}]];
    const obst = [
      ...seats.map(s => { const P = wt(pl.toD(G.seats[s.slot])); const rr = 55 * k * lens.st; return {x: P.x - rr, y: P.y - rr, w: 2 * rr, h: 2 * rr}; }),
      ...pl.chips.filter(Boolean).map(c => ({...wt(c.box), w: c.box.w * lens.st, h: c.box.h * lens.st})),
    ];
    const clear = ([a, b]) => { for (let j = 1; j < 30; j++) { const q = {x: a.x + (b.x - a.x) * j / 30, y: a.y + (b.y - a.y) * j / 30}; if (obst.some(o => q.x > o.x - 4 && q.x < o.x + o.w + 4 && q.y > o.y - 4 && q.y < o.y + o.h + 4)) return false; } return true; };
    const guides = pairs.map(pr => ({a: pr[0], b: pr[1], on: clear(pr)}));
    return {F, px, k, G, pl, cd, card, was, crop, lens, seats, H, X, moves, copies, hops, panel, building, guides, lampR, problems, log: LOG,
      arrangement: pick.kind, side: pick.side, showKey, panelBox: pick.side === 'right' ? {x: pick.bld.x, y: 0, w: D.w - pick.bld.x, h: D.h} : null};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const content = pre => {
      const c = L.copies[pre];
      const pl = L.pl;
      const cardNode = L.card ? g({name: `${pre}-card`},
        h('path', {d: roundRectPath(L.card.x + 3, L.card.y + 5, L.card.w, L.card.h, 10), fill: th.shadow}),
        h('path', {d: roundRectPath(L.card.x, L.card.y, L.card.w, L.card.h, 10), fill: th.card, stroke: INK, 'stroke-width': 2.2}),
        g({name: `${pre}-old`}, textAt(L.cd.fB, L.card.x + L.card.w / 2, L.card.y + L.cd.padY + (L.card.h - 2 * L.cd.padY - L.cd.fB.height) / 2, th.fg, {anchor: 'middle'}),
          L.cd.fB.lines.map((ln, i) => h('line', {name: `${pre}-st${i}`, x1: 0, y1: r(L.card.y + L.cd.padY + (L.card.h - 2 * L.cd.padY - L.cd.fB.height) / 2 + L.cd.fB.lineHeight * i + L.cd.fB.size * 0.55), x2: 0, y2: r(L.card.y + L.cd.padY + (L.card.h - 2 * L.cd.padY - L.cd.fB.height) / 2 + L.cd.fB.lineHeight * i + L.cd.fB.size * 0.55), stroke: INK, 'stroke-width': 2.4}))),
        g({name: `${pre}-new`, opacity: 0}, textAt(L.cd.fA, L.card.x + L.card.w / 2, L.card.y + L.cd.padY + (L.card.h - 2 * L.cd.padY - L.cd.fA.height) / 2, th.fg, {anchor: 'middle'})),
        g({name: `${pre}-was`, opacity: 0},
          h('path', {d: roundRectPath(L.was.x, L.was.y, L.was.w, L.was.h, Math.min(L.was.h / 2, 14)), fill: th.paperShade || '#ece6da', stroke: th.inkSoft, 'stroke-width': 2}),
          textAt(L.cd.fW, L.was.x + L.was.w / 2, L.was.y + L.cd.padY, th.fgSoft, {anchor: 'middle'}),
          L.cd.fW.lines.map((ln, i) => h('line', {x1: r(L.was.x + L.was.w / 2 - ctx.measure(ln, L.cd.fW.size, L.cd.fW.weight, 'sans') / 2), y1: r(L.was.y + L.cd.padY + L.cd.fW.lineHeight * i + L.cd.fW.size * 0.55), x2: r(L.was.x + L.was.w / 2 + ctx.measure(ln, L.cd.fW.size, L.cd.fW.weight, 'sans') / 2), y2: r(L.was.y + L.cd.padY + L.cd.fW.lineHeight * i + L.cd.fW.size * 0.55), stroke: th.fgSoft, 'stroke-width': 2}))),
      ) : null;
      const numNodes = L.showKey ? [L.H, L.X].map((si, j) => {
        const q = pl.toD(lampAt(L.G, L.seats[si].slot));
        return h('text', {x: r(q.x), y: r(q.y + L.F * 0.36), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(L.F, 2), 'font-weight': 700, fill: INK}, String(j + 1));
      }) : [];
      return g({name: `${pre}-content`},
        g({name: `${pre}-plan`, transform: T(pl.ox, pl.oy, 0, L.k)},
          c.art.room, c.art.lamps, c.art.chairs,
          g({name: `${pre}-token`}, tokenNode(ctx, {name: `${pre}-token-body`, s: 42})),
          c.people.map(pp => pp.node),
          c.art.badges),
        g({name: `${pre}-texts`}, numNodes, pl.chips.map((ch, i) => (ch ? seatChipNode(ctx, ch, {name: `${pre}-lab${i}`, owner: `${pre}-p${i}`}) : null)), cardNode),
      );
    };
    const d = L.lens.dest;
    const marker = L.card ? changedMarker(ctx, {name: 'cx-marker', x: L.card.x + L.card.w - 4, y: L.card.y + 4, radius: Math.max(16, L.F * 0.8), opacity: 0}) : null;
    return g(null,
      g({name: 'panel'}, L.building.node, L.panel.map(q => q.node)),
      g({name: 'world'},
        content('cx'),
        marker,
        h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': r(5 / L.lens.st, 2), opacity: 0})),
      L.guides.map((q, i) => h('line', {name: `guide${i}`, x1: r(q.a.x), y1: r(q.a.y), x2: r(q.b.x), y2: r(q.b.y), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0})),
      g({name: 'lz', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 16}))),
        h('rect', {name: 'lz-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 16, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lz-copy', transform: `${T(d.x - L.crop.x * L.lens.Z, d.y - L.crop.y * L.lens.Z)} scale(${r(L.lens.Z, 4)})`}, content('lz'))),
        h('rect', {name: 'lz-border', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 16, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const F = L.F;
    // dependent state: the pass (turn-state substitution only)
    const ua = L.moves ? u : Math.min(u, W.pass[0] - 0.001);
    const st = turnAt(L.G, L.seats, [L.H, L.X], L.hops, ua);
    for (const pre of ['cx', 'lz']) {
      L.seats.forEach((s, i) => {
        Object.assign(nodes, seatedPose(L.copies[pre].people[i], seatPose(L.G, s.slot), st.hands[i]));
        Object.assign(nodes, lampFrame(`${pre}-rm-lamp${i}`, st.lamps[i], false));
      });
      nodes[`${pre}-token`] = {transform: T(st.token.x, st.token.y)};
    }
    // the plan shrinks while the lens is open and grows back after it has closed
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.lens.st, sh);
    nodes.world = {transform: scaleAbout(L.lens.pivot.x, L.lens.pivot.y, r(sc, 4))};
    // context texts leave while the shrunk plan would carry them under 16 px (the lens holds their enlarged copy). Their
    // opacity follows the rendered size, so they stay until the plan reaches ~16 px on the way down and return as soon
    // as it is back above it on the way up (courts-06 round 2: hand-over gaps <= ~200 ms in these layouts too)
    const s16 = 16.2 / (L.F * L.px);
    const small = L.lens.st < s16;
    const txt = !small ? 1 : clamp((sc - s16) / 0.02);
    nodes['cx-texts'] = {opacity: r(txt, 3)};
    const frameP = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.03));
    nodes['src-frame'] = {opacity: r(frameP, 3)};
    // panel: fully faded before the lens appears; back only after the lens has gone
    nodes.panel = {opacity: r(u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn), 3)};
    // lens: grows at its destination; its content fades in from 40 % open and, on closing, fades out first
    const openP = ease.inOutCubic(seg(u, ...W.open));
    const closeP = ease.inOutCubic(seg(u, ...W.close));
    const lensOp = u < 0.5 ? (openP > 0 ? 1 : 0) : (closeP < 1 ? 1 : 0);
    const ls = u < 0.5 ? 0.6 + 0.4 * openP : 1 - 0.4 * closeP;
    const d = L.lens.dest;
    const lc = {x: d.x + d.w / 2, y: d.y + d.h / 2};
    nodes.lz = {opacity: lensOp, transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    // the enlarged copy fades in as the lens grows (from 30 % open, so no empty outline stays > 200 ms)
    // (mirrored on closing: it fades out as the lens shrinks, gone before the lens outline is)
    const copyOp = u < 0.5 ? clamp((openP - 0.3) / 0.5) : 1 - clamp((closeP - 0.3) / 0.5);
    nodes['lz-copy'] = {opacity: r(copyOp, 3)};
    const guideOp = Math.min(copyOp, lensOp);
    const ctxDatum = u < 0.5 ? 1 - clamp((openP - 0.1) / 0.2) : seg(u, ...W.ctxBack);
    // guides end on the lens rim as it grows or shrinks
    L.guides.forEach((q, i) => { nodes[`guide${i}`] = {opacity: q.on ? r(guideOp, 3) : 0, x2: r(lc.x + (q.b.x - lc.x) * ls), y2: r(lc.y + (q.b.y - lc.y) * ls)}; });
    // the card: strike, dock the old value as "was", new value (in both copies)
    const strike = seg(u, ...W.strike), dock = seg(u, ...W.dock), newIn = seg(u, ...W.newIn);
    if (L.card) {
      for (const pre of ['cx', 'lz']) {
        L.cd.fB.lines.forEach((ln, i) => {
          const lw = ctx.measure(ln, L.cd.fB.size, L.cd.fB.weight, 'sans') + 6;
          const x1 = L.card.x + L.card.w / 2 - lw / 2;
          nodes[`${pre}-st${i}`] = {x1: r(x1), x2: r(x1 + lw * strike)};
        });
        // one copy of the changed datum at a time: the context card's texts leave before the lens copy appears and
        // come back only after it has gone
        const own = pre === 'lz' ? 1 : ctxDatum;
        nodes[`${pre}-old`] = {opacity: r((1 - dock) * own, 3), transform: T(0, -F * 0.6 * dock)};
        nodes[`${pre}-was`] = {opacity: r(dock * own, 3)};
        nodes[`${pre}-new`] = {opacity: r(newIn * own, 3)};
      }
      // context texts while the plan is small: kept (>= 16 px by construction)
      const markerP = seg(u, ...W.marker);
      nodes['cx-marker'] = {opacity: r(markerP, 3)};
      if (L.panel.some(q => q.name === 'marker-note')) nodes['marker-note'] = {opacity: r(markerP, 3)};
    }
    L.pl.chips.forEach((c, i) => { if (c) { nodes[`cx-lab${i}`] = {opacity: 1}; nodes[`lz-lab${i}`] = {opacity: 1}; } });
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    // clearance checks (design units, current transforms)
    const wt = q => ({x: L.lens.pivot.x + (q.x - L.lens.pivot.x) * sc, y: L.lens.pivot.y + (q.y - L.lens.pivot.y) * sc});
    const lensRect = {x: lc.x - d.w * ls / 2, y: lc.y - d.h * ls / 2, w: d.w * ls, h: d.h * ls};
    const rr = 55 * L.k * sc;
    const people = L.seats.map(s => wt(L.pl.toD(L.G.seats[s.slot])));
    const cropNow = {...wt(L.crop), w: L.crop.w * sc, h: L.crop.h * sc};
    const planNow = {...wt({x: L.pl.ox, y: L.pl.oy}), w: L.G.W * L.k * sc, h: L.G.H * L.k * sc};
    const open = lensOp && copyOp > 0.5;
    return {
      nodes,
      semantic: {
        beat,
        datum,
        strike: r(strike, 3),
        oldDocked: r(dock, 3),
        newShown: r(newIn, 3),
        lensOpen: r(open ? 1 : 0, 3),
        lensScale: r(ls, 3),
        zoom: r(L.lens.Z, 3),
        zoomShrunk: r(L.lens.rel, 3),
        contextScale: r(sc, 3),
        lensShort: r(L.lens.lensShort, 3),
        ctxW: r(L.lens.ctxW, 3),
        holder: st.holder === null ? null : L.seats[st.holder].label,
        focus: L.seats[L.X].label,
        focusLamp: r(st.lamps[L.X], 3),
        holderLamp: r(st.lamps[L.H], 3),
        token: R2(wt(L.pl.toD(st.token))),
        moves: L.moves,
        markerShown: r(seg(u, ...W.marker), 3),
        lensClearOfPeople: !lensOp || people.every(q => !ov(lensRect, {x: q.x - rr, y: q.y - rr, w: 2 * rr, h: 2 * rr})),
        lensClearOfSource: !lensOp || !ov(lensRect, cropNow),
        lensClearOfPlan: !lensOp || !ov(lensRect, planNow),
        stackInCrop: !L.card || [L.card, L.was].every(b => b.x >= L.crop.x && b.y >= L.crop.y && b.x + b.w <= L.crop.x + L.crop.w && b.y + b.h <= L.crop.y + L.crop.h),
        allReached: st.reached,
        textPx: r(F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        problems: L.problems,
        arrangement: L.arrangement,
        log: L.log,
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
    slug: 'courts-06-inspect',
    title: 'Turn organisation — inspecting one participant’s supplied turn and substituting it',
    titleEs: 'Organización de turnos — Detalle ampliado y sustitución de dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Organización de turnos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The plan of a generic hearing room: one participant holds the turn signal with their lamp lit; a record card on the table shows the supplied turn value of the next participant. A frame isolates the holder, the inspected participant, their lamps, the token and the card; a lens opens beside the shrunk plan with a real enlarged copy. One datum is substituted (e.g. "pending" → "active"): the old value is struck and docked as "was", the new value appears and only the dependent state follows — the token is passed to the inspected participant and their lamp lights after it arrives. The lens closes onto the updated context with a neutral changed-datum marker. No order, validity or consequence is inferred.',
    tags: ['inspect', 'lens', 'turns', 'turn signal', 'active turn', 'pending turn', 'substitution', 'changed datum', 'hearing room', 'top-down people'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/organizacion-de-turnos.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
