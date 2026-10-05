/**
 * LAW-0445 — Aceptación y contrapropuesta · story
 *
 * Storyboard (open stage: Party A left, a standing term board in the middle,
 * Party B right; the offer sheet is clipped on the board's upper half, the
 * reply sheet waits on a rail below it with one empty slot per term):
 *  0.00–0.15  rest: the offer's supplied terms are printed pieces; a copy set
 *             of identical pieces lies on them, clipped to a spine with one
 *             latch per piece and a pull handle. B holds a different piece,
 *             face-down, at the chest. B looks at the offer.
 *  0.15–0.42  action (one-piece-substituted): B's far hand opens the latch of
 *             the supplied piece, takes the handle and slides the copy set
 *             down into the reply's slots — the released piece stays behind on
 *             the offer, the others arrive in the reply. (same-terms: no latch
 *             is opened and every piece arrives.)
 *  0.40–0.73  B's near hand swings the held piece up, turning it face-up on
 *             the way, and pushes it into the empty slot; both hands go back.
 *             A reaches for the reply's pull tab and draws the reply back
 *             along the rail (the response is carried back to A).
 *  0.73–1.00  hold: the reply as supplied (every piece, or one different
 *             piece marked with the neutral Δ), actor chips, editorial notes
 *             and the "as supplied · no conclusion drawn" key. Nothing says
 *             whether the reply is an acceptance or a counter-offer, or
 *             whether any contract exists.
 * Every moving prop is placed from a SOLVED hand while held; the copy set,
 * the piece and the reply never jump.
 * @module animations/contract-formation/LAW-0445
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  motifFields, responseItem, DEFAULT_CONTENT, KIT_STRINGS, resolveResponse, solveStage, buildStage,
  chipW, fitW, overlaps, insideBox, unionBox, callout, segHitsBox, stageTextBoxes, peopleBoxes, legendChip,
} from './kits/aceptacion-contrapropuesta.js';

const ID = 'LAW-0445';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W_SUB = {
  lookB: [0.06, 0.14], latchReach: [0.15, 0.21], latchPress: [0.21, 0.25], toLever: [0.25, 0.31], insert: [0.23, 0.37],
  nearBack: [0.38, 0.46], leverPress: [0.37, 0.41], slide: [0.41, 0.55], farBack: [0.43, 0.51], pullReach: [0.54, 0.6], pull: [0.6, 0.71],
};
const W_SAME = {
  lookB: [0.06, 0.14], toLever: [0.15, 0.22], leverPress: [0.22, 0.26], slide: [0.26, 0.41], farBack: [0.28, 0.37], pullReach: [0.42, 0.48], pull: [0.48, 0.62],
};
const HOLD = {tags: [0.74, 0.79], marker: [0.75, 0.79], notes: [0.77, 0.83], key: [0.77, 0.82]};
const ACTION_END = 0.72;

const STRINGS = {
  en: {...KIT_STRINGS.en, sameTerms: 'The reply carries every supplied piece', substituted: 'A different piece in the reply (as supplied)', stays: 'Piece left on the offer'},
  es: {...KIT_STRINGS.es, sameTerms: 'La respuesta lleva todas las piezas aportadas', substituted: 'Una pieza distinta en la respuesta (según lo aportado)', stays: 'Pieza que queda en la oferta'},
};

const sceneSchema = {
  ...motifFields,
  responses: list('The response as supplied (the story uses the first one)', responseItem, 1, 2),
  actorLabels: obj('Role captions shown under each party (empty = the party\'s role)', {a: str('Caption for Party A (sends the offer)', 50), b: str('Caption for Party B (answers)', 50)}),
  objectLabels: obj('Labels printed on props', {reply: str('Tag printed on the reply sheet', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['offer', 'reply', 'piece']), 0, 2),
  finalState: oneOf('State supplied for the final hold: returned (A has drawn the reply back) or on-board (the reply is composed but still on the board). No legal effect is inferred', ['returned', 'on-board']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  responses: [{reference: 'RE-2041', mode: 'one-piece-substituted', termIndex: 1, value: 'Day 14'}],
  actorLabels: {a: '', b: ''},
  objectLabels: {reply: 'Reply'},
  actionProgress: 1,
  annotations: [{target: 'piece', text: 'Only this piece differs from the offer'}],
  finalState: 'returned',
};

/** px at 1080p for one design unit. */
function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const range = (a, b, step) => { const out = []; for (let v = a; v >= b - 1e-9; v -= step) out.push(Math.round(v * 1000) / 1000); return out; };

/** Stage + editorial layer for one attempt; `ok` when every label found a clear place. */
function compose(ctx, p, o) {
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {upx, R, px} = o;
  const F = Math.min(px.chip, px.docs[px.docs.length - 1].min + 0.4) / upx; // editorial text never larger than the smallest content text
  const captions = [0, 1].map(i => { const lab = i ? p.actorLabels.b : p.actorLabels.a; const role = lab || p.parties[i].role; return role ? `${p.parties[i].name} · ${role}` : p.parties[i].name; });
  // ---- editorial items
  const legendItems = [];
  if (ctx.show('all')) legendItems.push({kind: R.substituted ? 'legend' : 'result', text: R.substituted ? ctx.t.substituted : ctx.t.sameTerms});
  const notesAll = ctx.show('all') ? p.annotations.map((a, i) => ({...a, name: `note${i}`})) : [];
  // a note about the different piece joins the Δ legend (the same Δ sits on the piece): no leader needed
  if (R.substituted) {
    const dnotes = notesAll.filter(n => n.target === 'piece');
    // a supplied note about the piece replaces the generic Δ line (both explain the same Δ)
    if (dnotes.length && legendItems.length && legendItems[0].kind === 'legend') legendItems.shift();
    dnotes.forEach(n => legendItems.push({kind: 'dnote', name: n.name, text: n.text}));
  }
  if (ctx.show('key')) legendItems.push({kind: 'key', text: ctx.t.key});
  const offerNotes = notesAll.filter(n => n.target === 'offer');
  const lowNotes = notesAll.filter(n => n.target !== 'offer' && !(R.substituted && n.target === 'piece'));
  const side = o.plan === 'side';
  const corners = o.plan === 'corners';
  const rowPlan = o.plan === 'row';   // legend chips side by side in the chip row, between the actor chips   // legend in a column right of B (wide frames) or in the top band
  const legendW = side ? Math.min(o.legendW ?? 460, DW * (shape === 'landscape' ? 0.24 : 0.3)) : Math.min(DW * 0.9, 760);
  const makeLegendW = (wMax, x = 0, y = 0) => {
    let yy = y;
    return legendItems.map(it => {
      const c = it.kind === 'legend' || it.kind === 'dnote'
        ? legendChip(ctx, it.text, {x, y: yy, maxWidth: wMax, size: F, name: it.name || 'legend', maxLines: 6})
        : chipW(ctx, it.text, {x, y: yy, maxWidth: wMax, size: F, maxLines: 5, weight: 600, fill: th.card, stroke: it.kind === 'key' ? th.inkSoft : th.ink, name: it.kind, opacity: 0});
      yy += c.box.h + 10;
      return {kind: it.kind, name: it.name || it.kind, c};
    });
  };
  let legendWOverride = null;
  const makeLegend = (x, y) => {
    let yy = y;
    return legendItems.map(it => {
      const c = it.kind === 'legend' || it.kind === 'dnote'
        ? legendChip(ctx, it.text, {x, y: yy, maxWidth: legendW, size: F, name: it.name || 'legend'})
        : chipW(ctx, it.text, {x, y: yy, maxWidth: legendW, size: F, maxLines: 3, weight: 600, fill: th.card, stroke: it.kind === 'key' ? th.inkSoft : th.ink, name: it.kind, opacity: 0});
      yy += c.box.h + 10;
      return {kind: it.kind, name: it.name || it.kind, c};
    });
  };
  const probe = makeLegend(0, 0);
  const legendH = probe.length ? probe[probe.length - 1].c.box.y + probe[probe.length - 1].c.box.h : 0;
  let legendWid = probe.length ? Math.max(...probe.map(q => q.c.box.w)) : 0;
  const noteW = shape === 'landscape' ? Math.min(560, DW * 0.3) : Math.min(DW * 0.62, 620);
  const noteProbe = offerNotes.map(n => callout(ctx, {name: n.name, text: n.text, x: 0, y: 0, target: {x: 0, y: 200}, maxWidth: noteW, size: F, maxLines: 3}));
  const offerBandH = noteProbe.length ? Math.max(...noteProbe.map(n => n.box.h)) + 34 : 0;
  const bandH = (side || corners || rowPlan ? 0 : (legendH ? legendH + 14 : 0)) + (o.offerBand ? offerBandH : 0);
  // row plan: every legend chip gets an equal share of the free middle of the chip row
  const rowW = DW * 0.56, rowN = legendItems.length || 1;
  const rowMade = rowPlan ? makeLegendW((rowW - (rowN - 1) * 12) / rowN) : [];
  const rowH = rowMade.length ? Math.max(...rowMade.map(q => q.c.box.h)) + 10 : 0;
  const top = Math.max(o.top, bandH ? bandH + 8 : 0);
  const box = {x: 8, y: top, w: DW - 16, h: DH - top - 8};
  const sBox = side && legendH ? {...box, w: box.w - legendWid - 24} : box;
  const sKs = corners ? o.ks.filter(k => k <= o.kCap + 1e-9) : o.ks;
  const keyOf = k0 => `${Math.round(sBox.x)}|${Math.round(sBox.y)}|${Math.round(sBox.w)}|${Math.round(sBox.h)}|${k0}|${px.chip}|${rowPlan ? 1 : 0}|${Math.round(rowH)}`;
  const memoKey = keyOf(sKs[0]);
  // a capped search gives the uncapped answer when that answer is already within the cap (or fails everywhere)
  const unc = o.solveMemo && o.solveMemo.get(keyOf(o.ks[0]));
  if (o.solveMemo && !o.solveMemo.has(memoKey) && unc !== undefined && (!unc || !unc.ok || unc.k <= sKs[0] + 1e-9)) o.solveMemo.set(memoKey, unc);
  const hit = o.solveMemo && o.solveMemo.has(memoKey);
  // a deterministic cap on fresh stage searches per layout (each search is costly)
  if (!hit && o.budget) { if (o.budget.n <= 0) return {G: null, why: ['budget'], ok: false}; o.budget.n--; }
  const G = hit ? o.solveMemo.get(memoKey) : solveStage(ctx, {
    box: sBox,
    upx, terms: p.terms, offer: p.offer, parties: p.parties, response: R, latch: R.substituted, replyTag: p.objectLabels.reply,
    captions, chipPx: px.chip, chipMax: rowPlan ? DW * 0.25 : Math.min(DW * 0.46, 30 * px.chip / upx), chipLines: rowPlan ? 5 : 2, minRowH: rowH, pullBack: true,
    variants: shape === 'portrait' ? [true, false] : [false, true],
    pxTries: px.docs, ks: sKs,
    tws: [5, 6, 7, 8.5, 10, 12, 14, 17, 20, 24, 28, 34], sideTws: [11, 13, 15, 16, 18.5], cache: o.cache, steps: shape === 'landscape' ? [0, 0.14, 0.28, 0.42] : [0, 0.14, 0.28, 0.42, 0.56],
    lws: [0, 4.5, 5.5, 6.5, 8, 10, 12, 15],
    hws: [7.5, 9, 11, 13, 15.5],
    align: shape === 'landscape' ? 'left' : 'center', stats: o.stats,
    sides: [null, 'reply-left'],   // offer and reply side by side when the stacked board is out of B's reach
    sideCompact: true,             // side by side: the sheets print their references; title and parties on a plate along the board's top
    plateText: `${p.offer.title} · ${ctx.t.from}: ${p.parties[0].name} · ${ctx.t.to}: ${p.parties[1].name}`,
  });
  if (o.solveMemo) o.solveMemo.set(memoKey, G);
  if (!G) return {G: null, why: ['nostage'], ok: false};
  if (o.stageOnly) return {G, why: [...G.why], ok: false, legend: [], notes: [], marker: null};
  const returned = p.finalState === 'returned';
  const dx = returned ? -G.pull : 0;
  const why = [...G.why];
  const texts = ctx.show('all') ? stageTextBoxes(G, dx) : [];
  const people = peopleBoxes(G);
  const heads = [G.headA, G.headB];
  const boardBox = {x: G.board.x + Math.min(0, dx) - G.pullTab, y: G.board.y, w: G.board.w - Math.min(0, dx) + G.pullTab, h: G.railY + 12 - G.board.y};
  const placed = [...(G.chipBoxes || [])];
  const bounds = {x: 4, y: 2, w: DW - 8, h: DH - 4};
  const clearBox = b => insideBox(b, bounds) && ![...people, boardBox, ...placed].some(q => overlaps(b, q, 8));
  const faceBoxes = heads.map(b => ({x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12}));
  const leadClear = (lead, box) => {
    const len = Math.hypot(lead.x2 - lead.x1, lead.y2 - lead.y1);
    // the whole callout (chip + leader) keeps its bounding box off both faces
    const all = box ? unionBox([box, {x: Math.min(lead.x1, lead.x2), y: Math.min(lead.y1, lead.y2), w: Math.abs(lead.x2 - lead.x1), h: Math.abs(lead.y2 - lead.y1)}]) : null;
    return len < 240 && !texts.some(b => segHitsBox(lead, b, -2)) && !faceBoxes.some(b => segHitsBox(lead, b, 0) || (all && overlaps(all, b, 0))) && !placed.some(b => segHitsBox(lead, b, -2));
  };
  // ---- legend group: right column (16:9) or the top band (its top)
  const legend = [];
  if (legendItems.length) {
    let x, y;
    if (rowPlan) {
      const cb = G.chipBoxes || [{x: 8, w: 0}, {x: DW - 8}];
      const x0r = cb[0].x + cb[0].w + 12, x1r = cb[1].x - 12;
      legendWOverride = (x1r - x0r - (rowN - 1) * 12) / rowN;
      const m = makeLegendW(legendWOverride);
      let xx = x0r;
      for (const q of m) {
        const it = legendItems.find(z => (z.name || z.kind) === q.name);
        const c = q.kind === 'legend' || q.kind === 'dnote'
          ? legendChip(ctx, it.text, {x: xx, y: G.floorY + 12, maxWidth: legendWOverride, size: F, name: q.name, maxLines: 6})
          : chipW(ctx, it.text, {x: xx, y: G.floorY + 12, maxWidth: legendWOverride, size: F, maxLines: 5, weight: 600, fill: th.card, stroke: q.kind === 'key' ? th.inkSoft : th.ink, name: q.kind, opacity: 0});
        legend.push({kind: q.kind, name: q.name, c});
        xx += c.box.w + 12;
      }
      if (legend.some(q => q.c.fit.bad) || xx - 12 > x1r + 1 || !legend.every(q => insideBox(q.c.box, bounds) && ![...placed].some(z => overlaps(q.c.box, z, 6)))) why.push('legend:row');
      legend.forEach(q => placed.push(q.c.box));
    } else if (corners) {
      // above the heads: the corner right of the board (above B), else left of it (above A)
      const rgs = [{x: G.board.x + G.board.w + 8, y: 4, w: DW - 4 - (G.board.x + G.board.w + 8), h: G.headB.y - 12},
        {x: 4, y: 4, w: G.board.x - 4 - 8, h: G.headA.y - 12}];
      const fits = q => { if (q.w < 160 || q.h <= 0) return false; const m = makeLegendW(q.w); const b = unionBox(m.map(z => z.c.box)); return !m.some(z => z.c.fit.bad) && b.h <= q.h; };
      const rg = rgs.find(fits) || rgs.find(q => q.w >= 160 && q.h > 0) || rgs[0];
      const narrow = makeLegendW(rg.w);
      legendWid = Math.max(...narrow.map(q => q.c.box.w));
      x = rg.x + (rg.w - legendWid) / 2;
      y = rg.y;
      legendWOverride = rg.w;
    } else if (side) {
      const colX0 = G.B.x + 56 * G.k + 20;
      x = Math.max(colX0, DW - 8 - legendWid - Math.max(0, (DW - 8 - colX0 - legendWid) / 2));
      y = G.floorY - legendH;
    } else {
      x = (DW - legendWid) / 2;
      y = Math.max(4, Math.min(top - bandH - 4, G.board.y - 16 - legendH - (offerNotes.length && o.offerBand ? offerBandH : 0)));
    }
    const lw2 = legendWOverride ?? legendW;
    const made = rowPlan ? [] : makeLegendW(lw2);
    let yy = y;
    for (const m of made) {
      const it = legendItems.find(q => (q.name || q.kind) === m.name);
      const cx = x + (legendWid - m.c.box.w) / 2;
      const c = m.kind === 'legend' || m.kind === 'dnote'
        ? legendChip(ctx, it.text, {x: cx, y: yy, maxWidth: lw2, size: F, name: m.name, maxLines: 6})
        : chipW(ctx, it.text, {x: cx, y: yy, maxWidth: lw2, size: F, maxLines: 5, weight: 600, fill: th.card, stroke: m.kind === 'key' ? th.inkSoft : th.ink, name: m.kind, opacity: 0});
      legend.push({kind: m.kind, name: m.name, c});
      yy += c.box.h + 10;
    }
    if (!rowPlan && (legend.some(q => q.c.fit.bad) || !legend.every(q => clearBox(q.c.box)))) {
      const lb = unionBox(legend.map(q => q.c.box));
      const hit = [...people.map((q, i) => ['person' + i, q]), ['board', boardBox], ...placed.map((q, i) => ['placed' + i, q])].filter(([, q]) => legend.some(l => overlaps(l.c.box, q, 8))).map(([n, q]) => `${n}@${Math.round(q.x)},${Math.round(q.y)},${Math.round(q.w)}x${Math.round(q.h)}`);
      why.push(`legend[${o.plan}:${Math.round(lb.x)},${Math.round(lb.y)},${Math.round(lb.w)}x${Math.round(lb.h)} bad=${legend.filter(q => q.c.fit.bad).length} k=${G.k} in=${legend.every(q => insideBox(q.c.box, bounds))} hit=${hit.join('/')}]`);
    }
    if (!rowPlan) legend.forEach(q => placed.push(q.c.box));
  }
  // ---- notes on the offer: right above the board (leader down to its top edge), or in the side column
  // with a leader over B's head to the offer's top edge, or above A's head
  const notes = [];
  offerNotes.forEach((n, j) => {
    let got = null;
    const ty = G.plateH ? G.board.y + 8 : G.Oy - 1;   // side by side: the offer's title plate on the board's top
    const tries = [];
    const xs = [0.3, 0.7, 0.15, 0.85, 0.5].map(f => G.x0 + G.sw * f).filter(x => Math.abs(x - (G.x0 + G.sw / 2)) > G.sw * 0.1);
    for (const tx of xs) for (const anchor of ['middle', 'start', 'end']) tries.push({x: tx, y: G.board.y - 26 - noteProbe[j].box.h, anchor, target: {x: tx, y: ty}});
    const sideX = G.B.x + 56 * G.k + 16;
    for (const dy of [0, 40, 80]) tries.push({x: sideX, y: Math.max(4, G.board.y - 10 + dy), anchor: 'start', target: {x: G.x0 + G.sw - 30, y: ty}});
    for (const dy of [0, 40]) tries.push({x: G.x0 - 20, y: Math.max(4, G.board.y - 10 + dy), anchor: 'end', target: {x: G.x0 + 30, y: ty}});
    const fails = {};
    for (const t of tries) {
      const c = callout(ctx, {name: n.name, text: n.text, x: t.x, y: t.y, anchor: t.anchor, target: t.target, maxWidth: noteW, size: F, maxLines: 3});
      if (!c.fit.bad && clearBox(c.box) && leadClear(c.lead, c.box)) { got = c; break; }
      const key = c.fit.bad ? 'fit' : !insideBox(c.box, bounds) ? 'out' : !clearBox(c.box) ? 'hit' : 'lead';
      fails[key] = (fails[key] || 0) + 1;
    }
    if (!got) { why.push(`note:${n.name}:${JSON.stringify(fails)}`); return; }
    placed.push(got.box);
    notes.push(got);
  });
  // ---- notes on the reply / the piece: under the board, leader up to the reply's lower edge
  const rdx = G.rdx || 0;   // side by side: the reply sheet's offset from the offer
  const colMid = G.xSp - SHEET_SPW / 2 - G.tw / 2 + dx + rdx;
  const under = {x: G.A.x + 50 * G.k, y: G.railY + 18, w: (G.B.x - 50 * G.k) - (G.A.x + 50 * G.k), h: G.floorY - G.railY - 24};
  lowNotes.forEach(n => {
    const tgt = {x: clamp(colMid, G.x0 + rdx + dx + 30, G.x0 + rdx + dx + G.sw - 30), y: G.Ry + G.shR + 1};
    let got = null;
    const cands = [];
    for (const dy of [0, 30, 60, 90]) for (const ox of [0, -120, 120, -240, 240, -360]) cands.push({x: tgt.x + ox, y: under.y + dy});
    for (const c0 of cands) {
      const c = callout(ctx, {name: n.name, text: n.text, x: c0.x, y: c0.y, anchor: 'middle', target: tgt, maxWidth: Math.min(noteW, under.w), size: F, maxLines: 3});
      if (c.fit.bad || c.box.y + c.box.h > G.floorY - 4 || c.box.x < under.x - 60 || c.box.x + c.box.w > under.x + under.w + 60) continue;
      if (clearBox(c.box) && leadClear(c.lead, c.box)) { got = c; break; }
    }
    if (!got) { why.push(`note:${n.name}`); return; }
    placed.push(got.box);
    notes.push(got);
  });
  // Δ marker on the different piece (its top-left corner, over the coloured tab)
  let marker = null;
  if (R.substituted) {
    const mx = G.xSp - SHEET_SPW / 2 - G.tw + 3 + dx + rdx, my = G.Ry + G.rowYR(R.k) - G.th / 2 + 3;
    marker = {x: mx, y: my, r: Math.max(14, F * 0.62), node: changedMarker(ctx, {name: 'marker', x: mx, y: my, radius: Math.max(14, F * 0.62), opacity: 0})};
  }
  const extent = unionBox([G.extent, ...placed]);
  return {G, why, legend, notes, marker, extent, ok: why.length === 0, dx, top};
}

const SHEET_SPW = 12;
/** Layout choices already searched (keyed by every input of the search). */
const CHOICE = new Map();

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const DH = ctx.design.h;
    const upx = unitPx(ctx);
    const R = resolveResponse(p, p.responses[0]);
    const mid = {F: 21, FL: 19.8, min: 19.6}, small = {F: 19, FL: 17, min: 16.5};
    const first = shape === 'portrait' ? [{F: 36, FL: 30, min: 28}, {F: 32, FL: 27, min: 25}, {F: 29, FL: 24.5, min: 23}, {F: 26, FL: 22.5, min: 21.5}] : shape === 'landscape' ? [{F: 25, FL: 21.5, min: 20.5}, {F: 23, FL: 20.5, min: 20}] : [{F: 24, FL: 21, min: 20.5}, {F: 22.5, FL: 20.5, min: 20}];
    const tiny = {F: 17.5, FL: 16.5, min: 16.2}, floor16 = {F: 16.6, FL: 16.1, min: 16.05};
    const pxSets = [{docs: first, chip: shape === 'portrait' ? 23 : 21.5}, {docs: [mid], chip: 19.6}, {docs: [small], chip: 17}, {docs: [tiny], chip: 16.2}, {docs: [floor16], chip: 16.05}];
    const tops = shape === 'portrait' ? [DH * 0.06, DH * 0.12] : shape === 'square' ? [6, DH * 0.08] : [6, DH * 0.06];
    const kMax = shape === 'portrait' ? 2.6 : 2.2;
    let best = null;
    const stats = {};
    const rank = C => (C.ok ? 3 : C.G && C.G.ok ? 2 : C.G ? 1 : 0);
    const hasOfferNote = ctx.show('all') && p.annotations.some(a => a.target === 'offer');
    const cornerPlans = [...[2.2, 1.9, 1.7, 1.5, 1.3, 1.1].map(c => ['corners', c]), ['row', 0]];
    const plans = (shape === 'landscape' ? [['side', 460], ['side', 330], ['band', 0], ...cornerPlans] : [['band', 0], ...cornerPlans]).flatMap(pl => (hasOfferNote ? [[...pl, true], [...pl, false]] : [[...pl, false]]));
    const cache = new Map();
    const solveMemo = new Map();
    const budget = {n: 0};
    // the search result depends only on the inputs: later instances with the same inputs re-use the choice
    const choiceKey = JSON.stringify([p, ctx.view.width, ctx.view.height, ctx.show('all'), ctx.show('key'), ctx.params.locale]);
    const known = CHOICE.get(choiceKey);
    if (known) {
      const C = compose(ctx, known.stageOnly ? {...p, annotations: []} : p, {...known.args, upx, R, px: pxSets[known.pxI], cache, solveMemo, ks: range(kMax, 0.85, 0.05), stats});
      const S = buildStage(ctx, C.G, {prefix: 'st'});
      return {...C, S, R, upx};
    }
    let bestArgs = null;
    for (const px of pxSets) {
      budget.n = 16;   // fresh stage searches per text size
      // quick feasibility: without any editorial zone the stage itself must fit at this text size
      const probeC = compose(ctx, {...p, annotations: []}, {upx, R, px, top: 6, plan: 'corners', kCap: 9, cache, solveMemo, budget, ks: range(kMax, 0.85, 0.05), stats, stageOnly: true});
      if (!probeC.G || !probeC.G.ok) { if (!best && probeC.G) { best = probeC; bestArgs = {pxI: pxSets.indexOf(px), stageOnly: true, args: {top: 6, plan: 'corners', kCap: 9, stageOnly: true}}; } continue; }
      for (const [top, [plan, legendW, offerBand]] of tops.flatMap(t => plans.map(pl => [t, pl]))) {
        const C = compose(ctx, p, {upx, R, px, top, plan, legendW: plan === 'side' ? legendW : undefined, kCap: plan === 'corners' ? legendW : 9, offerBand, cache, solveMemo, budget, ks: range(kMax, 0.85, 0.05), stats});
        C.stats = stats;
        if (!C.G) continue;
        if (!best || rank(C) > rank(best) || (rank(C) === rank(best) && (C.ok ? C.G.k > best.G.k + 1e-6 : C.why.length < best.why.length))) { best = C; bestArgs = {pxI: pxSets.indexOf(px), stageOnly: false, args: {top, plan, legendW: plan === 'side' ? legendW : undefined, kCap: plan === 'corners' ? legendW : 9, offerBand}}; }
        if (C.ok && C.G.k >= probeC.G.k - 1e-6) break; // as large as the stage alone allows
      }
      if (best && best.ok) break;
    }
    if (bestArgs) CHOICE.set(choiceKey, bestArgs);
    const S = buildStage(ctx, best.G, {prefix: 'st'});
    return {...best, S, R, upx};
  },
  build(ctx, L) {
    return g(null, L.S.node, L.marker && L.marker.node, L.legend.map(q => q.c.node), L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const W = L.R.substituted ? W_SUB : W_SAME;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const s = w => (W[w] ? seg(a, ...W[w]) : 0);
    const returned = p.finalState === 'returned';
    const v = {
      latchReach: s('latchReach'), latchPress: s('latchPress'), toLever: s('toLever'), leverPress: s('leverPress'), slide: s('slide'), farBack: s('farBack'),
      insert: s('insert'), nearBack: s('nearBack'), pullReach: returned ? s('pullReach') : 0, pull: returned ? s('pull') : 0,
      headB: lerp(0, 8, s('lookB')), headA: returned ? lerp(0, 6, s('pullReach')) : 0,
    };
    const posed = L.S.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const fade = w => (done ? r(seg(u, ...HOLD[w]), 3) : 0);
    if (L.marker) nodes.marker = {opacity: fade('marker')};
    for (const q of L.legend) nodes[q.name] = {opacity: fade(q.kind === 'key' ? 'key' : q.kind === 'dnote' ? 'notes' : 'tags')};
    L.notes.forEach(n => Object.assign(nodes, n.frame(done ? seg(u, ...HOLD.notes) : 0)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.sem, beat, k: r(L.G.k, 3), headPx: r(88 * L.G.k * L.upx, 1), layoutOk: L.ok, why: L.why.join(',')}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-02-story',
    title: 'Acceptance and counter-offer — a reply keeps the offer\'s pieces or swaps one',
    titleEs: 'Aceptación y contrapropuesta — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Aceptación y contrapropuesta',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties at a term board. The offer\'s supplied terms are printed pieces with an identical copy set clipped on top. Party B slides the copy set down into the reply sheet; with a supplied substitution, B first opens one latch so that piece stays on the offer and then slots a different piece (held face-down until then) into the empty slot. Party A draws the reply back along the rail. Only the physical match or substitution is shown; no acceptance, counter-offer or contract is stated.',
    tags: ['offer', 'reply', 'response', 'terms', 'pieces', 'copy', 'substitution', 'handoff', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/aceptacion-contrapropuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
