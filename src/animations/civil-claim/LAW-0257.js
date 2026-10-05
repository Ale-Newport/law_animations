/**
 * LAW-0257 — Contestación estructurada · story
 *
 * Storyboard (side view of an office wall: Party A, who filed the initial claim, seated at a low desk with the claim
 * tray and the response tray; the case file on a shelf and the calendar on the wall above; a pin board carrying the
 * initial claim's numbered allegations (top sheet) and Party B's structured response (bottom sheet); Party B
 * standing at the right of the board; the action clock c runs from u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: both sheets pinned, every row readable (supplied allegations, supplied sections); no link yet;
 *             names, the state key (● admitted · ◆ disputed) and the "as supplied · no conclusion drawn" key.
 *  0.15–0.42  Party B takes the first section's thread at its pin and carries it along its own lane to the
 *             allegation it answers, then the second (hand on the thread's end throughout: SOLVED hand positions).
 *  0.42–0.73  the remaining sections are linked; each link shows its supplied state only once it is pinned —
 *             ● solid line (admitted) or ◆ dashed line (disputed), equal weight — and the calendar marks the
 *             supplied response day.
 *  0.73–1.00  hold: the linked board, the "each section linked" tag, the editorial callout and the keys. No effect of
 *             admitting or disputing, burden, consequence or outcome is shown.
 * finalState sets the supplied state of the first section (admitted / disputed); the other sections keep theirs.
 * @module animations/civil-claim/LAW-0257
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  CE_DEFAULTS, CE_DEFAULTS_ES, CE_COMMON_ES, CE_STRINGS, partiesField, documentsField, datesField, stagesField, propLabelProps,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, solveBoard, placeBoard, choreo, sectionsOf, stateKeyText, localizeDefaults,
} from './kits/contestacion-estructurada.js';
import {glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0257';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAG = [0.9, 0.96];
const NOTES = [0.8, 0.86];
/** base text size (design units) per layout: every text ≥ 19.5 px at 1080p in the baseline presets */
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const S_MIN = {landscape: 0.55, square: 0.45, portrait: 0.45};
const TARGETS = ['claim', 'response', 'calendar'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party B (writes the response)', 60), b: str('Caption for Party A (filed the claim)', 60)}),
  objectLabels: obj('Labels printed on the props', propLabelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the first section (descriptive only; no effect is inferred)', ['admitted', 'disputed']),
};

const defaultParams = {
  parties: CE_DEFAULTS.parties,
  documents: CE_DEFAULTS.documents,
  stages: CE_DEFAULTS.stages,
  dates: CE_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: CE_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'response', text: 'Each section is linked to the allegation it answers'}],
  finalState: 'admitted',
};
/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...CE_COMMON_ES,
  objectLabels: CE_DEFAULTS_ES.labels,
  annotations: [{target: 'response', text: 'Cada apartado se vincula a la alegación que contesta'}],
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const shape = ctx.view.shape;
    // (a stage whose printed text had to step down is not taken while another layout keeps it at full size: the supplied
    // text is never smaller than the generic keys)
    const ok = L => L.fitted && !L.truncated.length && L.m >= 1;
    // (score: the people's size; a stepped-down text counts for less, so supplied text keeps its full size when it can;
    // a wider stage wins a near tie)
    const score = L => (ok(L) ? L.headPx * (L.m < 1 ? 0.8 : 1) * (1 + 0.1 * Math.min(L.frameW, 0.9)) : -1);
    const best = Ls => Ls.reduce((a, b) => (score(b) > score(a) ? b : a));
    // (wider sheets wrap long supplied rows less: the sheet width is chosen for the larger people)
    const L0 = best({landscape: [14, 18, 22, 26], portrait: [14, 18], square: [16, 22]}[shape].map(k => compose(ctx, false, k)));
    // (the text column is a fallback: only when the stage with its printed texts fails a floor)
    if (ok(L0) && L0.headPx >= 52 && L0.m >= 1) return L0;
    // (a column that overflows the frame is tried wider: its texts wrap less)
    const Lcs = {landscape: [12, 20], portrait: [9, 14], square: [12, 20]}[shape].map(k => {
      let Lc = compose(ctx, true, k);
      for (const cK of shape === 'landscape' ? [0.32, 0.4] : [0.36, 0.42]) { if (Lc.fitted || Lc.stacked) break; Lc = compose(ctx, true, k, cK); }
      return Lc;
    });
    const Lc = best(Lcs);
    // (the column only when it keeps larger people, or when the stage with its texts does not fit)
    if (!ok(L0)) return ok(Lc) ? Lc : L0;
    return score(Lc) > score(L0) * 1.08 ? Lc : L0;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** The sections drawn: the supplied ones, the first one's state set by finalState. */
const sectionsFor = p => sectionsOf(p).map((s, i) => (i === 0 ? {...s, state: p.finalState} : s));

function compose(ctx, col, lwK, colK) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const sp = {...p, labels: p.objectLabels};
  const secs = sectionsFor(p);
  const small = B * 0.96;
  // ---- text column (fallback): right side (beside the callouts), or stacked above the stage on tall frames
  const stacked = col && (shape === 'portrait');
  const colW = stacked ? D.w - 16 : col ? Math.round(D.w * (colK ?? (shape === 'landscape' ? 0.26 : 0.32))) : 0;
  const colX = stacked ? 8 : D.w - 8 - colW;
  const bandW = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  // (the texts the compact props no longer print: the sheets, the case file, the trays and the calendar)
  const colTexts = col && showAll ? [p.documents.claim.title, ...p.documents.claim.allegations.map((t, i) => `${i + 1}  ${t}`), p.documents.response.title, ...secs.map((s, i) => `§${i + 1}  ${s.label}`), `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, `${p.objectLabels.claimTray}  ·  ${p.objectLabels.responseTray}`, `${p.objectLabels.calendar}: ${p.dates.window.join(' · ')}`] : [];
  // ---- top band (the state key, the "as supplied" key, the numbered callouts) and the column, at text step f: long
  // column texts step down — never under ~16.4 px — until the column fits the frame; the keys and the callouts step
  // with them (supplied text is never smaller than the generic key)
  let key, stKey, notes, bandY, keyBandY, colChips, colY;
  for (const f of [1, 0.92, 0.84, 0.76, 0.7].filter(f2 => f2 === 1 || (col && small * f2 * pxPer >= 16.4))) {
    const keySize = Math.max(small * f, 16.2 / pxPer);
    key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
    stKey = showKey ? gchip(ctx, stateKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
    bandY = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
    keyBandY = bandY;
    notes = [];
    if (showAll) {
      for (const [i, a] of p.annotations.entries()) {
        const c = gchip(ctx, `${i + 1}  ${a.text}`, {x: 8, y: bandY, anchor: 'start', maxWidth: bandW, size: small * f, minSize: small * f, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
        notes.push({i, a, c});
        bandY = c.box.y + c.box.h + 8;
      }
    }
    colChips = [];
    colY = stacked ? bandY : keyBandY;
    for (const [i, t] of colTexts.entries()) {
      const c = gchip(ctx, t, {x: colX, y: colY, anchor: 'start', maxWidth: colW, size: small * f, minSize: small * f, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: `coltx${i}`});
      colChips.push(c);
      colY = c.box.y + c.box.h + 6;
    }
    if (colY <= D.h - 8 || stacked) break;
  }
  const colReserve = stacked ? colY - bandY + 6 : 0;
  const colFits = colY <= D.h - 8;
  // ---- name chips band
  const capOf = i => (i === 0 ? p.actorLabels.a : p.actorLabels.b) || partyCaption(p, i);
  const availW0 = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  // (a name chip is never narrower than its longest word: long hyphenated names stay whole)
  const longWord = Math.max(...[0, 1].flatMap(i => glue(capOf(i)).split(' ')).map(w => ctx.measure(w, small, 600, 'sans')));
  const chipMax = Math.min(availW0 * 0.5, Math.max(availW0 * 0.46, longWord + small * 1.6));
  const probe = showKey ? [0, 1].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  const top0 = bandY + colReserve;
  // (tall and square frames: the board hangs on the wall above the desk, Party A seated under it)
  const tuck = shape !== 'landscape';
  const sol = solveBoard(ctx, {B, availW: availW0, availH: D.h - top0 - chipBand - 8, sMin: S_MIN[shape], fillH: true,
    opts: {prefix: 'st', p: sp, looks, showText: showAll, markIdx: p.dates.responseDay, compact: col || !showAll, tuck, sections: secs, lwK: lwK ?? (shape === 'portrait' ? 9 : shape === 'square' ? 16 : 12)}});
  const stage = sol.stage, s = sol.s, m = sol.m;
  const E = stage.ext;
  const PL = placeBoard(sol, {x0: 8, top0, availW: availW0, bottom: D.h - 4, chipBand});
  const {ox, oy, M} = PL.board;
  const bxm = PL.boxes, G = stage.G;
  const occupied = [bxm.personA, bxm.personB, bxm.board, bxm.file, bxm.cal, ...bxm.trays, bxm.desk];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  notes.forEach(n => occupied.push(n.c.box));
  occupied.push(...colChips.map(c => c.box));
  // ---- name chips under each party
  const chips = [];
  if (showKey) {
    const xs = [M({x: G.xB, y: 0}).x, PL.desk.M({x: 0, y: 0}).x];
    const ys = [PL.floorB, PL.floorA];
    [0, 1].forEach(i => {
      const w = probe[i].box.w;
      const cx = clamp(xs[i], 8 + w / 2, 8 + availW0 - w / 2);
      const c = gchip(ctx, capOf(i), {x: cx, y: ys[i] + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8, name: `chip-${i ? 'a' : 'b'}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the "each section linked" tag beside the channel, and the callouts' numbered markers beside their targets
  // (the pointer's sweep — between the channel's outer edge and Party B, from the board's top to the floor — is kept
  // free of tags: the pointer and its tip never pass over one)
  if (G.wayX !== null && G.wayX !== undefined) {
    const p0 = M({x: G.wayX - G.ts * 0.6, y: G.boardTop}), p1 = M({x: G.shoulderB.x, y: 0});
    occupied.push({x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y});
  }
  const tags = {};
  const pxTag = small;
  if (showKey) {
    const ch = bxm.channel;
    const bd = bxm.board;
    // (beside the channel; else just outside the board — above it, under it or at its sides)
    const anchors = [{x: ch.x + ch.w / 2, y: ch.y + 4}, {x: ch.x + ch.w / 2, y: ch.y + ch.h - 4}, {x: ch.x + 4, y: ch.y + 4},
      {x: ch.x + ch.w / 2, y: bd.y - 6}, {x: ch.x + ch.w / 2, y: bd.y + bd.h + 6}, {x: bd.x - 6, y: bd.y + bd.h / 2}, {x: bd.x + bd.w + 6, y: bd.y + bd.h / 2}];
    let t = null, tA = null;
    for (const anchor of anchors) {
      const c2 = placeTag(ctx, {name: 'tag-linked', text: p.stages.linked, anchor, occupied, bounds: {x: 6, y: 6, w: D.w - 12, h: D.h - 12}, maxWidth: Math.min(440, D.w * 0.45), size: pxTag, color: th.inkSoft, maxLead: 38 / pxPer, narrow: true});
      if (!t || (c2.clear && !t.clear)) { t = c2; tA = anchor; }
      if (c2.clear) break;
    }
    occupied.push(t.box);
    // (its leader and anchor dot too: the callouts' markers keep off them)
    const lx0 = Math.min(t.box.x, tA.x - 6), ly0 = Math.min(t.box.y, tA.y - 6);
    occupied.push({x: lx0, y: ly0, w: Math.max(t.box.x + t.box.w, tA.x + 6) - lx0, h: Math.max(t.box.y + t.box.h, tA.y + 6) - ly0});
    tags['tag-linked'] = t;
  }
  const markR = small * 0.62;
  const targetBox = {claim: bxm.claim, response: bxm.response, calendar: bxm.cal};
  const labelish = [...chips.map(c => c.box), ...Object.values(tags).map(t => t.box), ...colChips.map(c => c.box), ...notes.map(n => n.c.box)];
  const marks = notes.map(n => {
    const b = targetBox[n.a.target];
    const bd = bxm.board;
    // (beside the target first; then just outside the board, level with the target — never over a sheet's printed rows)
    const spots = [[b.x - markR - 4, b.y + markR], [b.x + markR, b.y - markR - 4], [b.x - markR - 4, b.y + b.h / 2], [b.x + b.w / 2, b.y - markR - 4], [b.x - markR - 4, b.y + b.h - markR], [b.x + markR, b.y + b.h + markR + 4], [b.x + b.w / 2, b.y + b.h + markR + 4],
      [bd.x - markR - 6, b.y + markR], [bd.x - markR - 6, b.y + b.h / 2], [bd.x + bd.w + markR + 6, b.y + markR], [bd.x + bd.w / 2, bd.y - markR - 6], [bd.x + bd.w / 2, bd.y + bd.h + markR + 6]];
    // (the first free spot; else the one touching the fewest boxes, never a label: labels count double)
    const sheets = [bxm.claim, bxm.response];
    const cost = ([x2, y2]) => { const mb = {x: x2 - markR, y: y2 - markR, w: 2 * markR, h: 2 * markR}; return occupied.filter(z => hit(mb, z, 2)).length + labelish.filter(z => hit(mb, z, 2)).length + 3 * sheets.filter(z => hit(mb, z, 2)).length + (mb.x < 4 || mb.y < 4 || mb.x + mb.w > D.w - 4 || mb.y + mb.h > D.h - 4 ? 9 : 0); };
    const [x, y] = spots.reduce((a2, b2) => (cost(b2) < cost(a2) ? b2 : a2));
    occupied.push({x: x - markR, y: y - markR, w: 2 * markR, h: 2 * markR});
    return {x, y};
  });
  const labelBoxes = [...chips.map(c => c.box), ...Object.values(tags).map(t => t.box), key && key.box, stKey && stKey.box, ...notes.map(n => n.c.box), ...colChips.map(c => c.box)].filter(Boolean);
  const truncated = [...stage.fits, ...colChips.map(c => c.fit), ...chips.map(c => c.fit), key && key.fit, stKey && stKey.fit, ...Object.values(tags).map(t => t.fit), ...notes.map(n => n.c.fit)].filter(f => f && f.truncated).map(f => f.full);
  const faces = [bxm.headA, bxm.headB].filter(f => f.w > 0);
  return {PL, desk: sol.desk, col, stacked, colChips, chips, key, stKey, notes, marks, markR, tags, stage, s, m, ox, oy, M, labelBoxes, truncated, faces,
    fitted: sol.fitted && colFits, headPx: bxm.headB.w * pxPer * 0.85, frameW: E.w * s * Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) / ctx.view.width,
    labelsClear: labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1))), textPx: r(G.ts * s, 2), share: {w: r(E.w * s / D.w, 3), h: r(E.h * s / D.h, 3)}, small};
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  return g(null,
    g({transform: `${T(L.ox, L.oy)} scale(${r(L.s, 5)})`}, L.stage.node),
    L.desk ? g({transform: `${T(L.PL.desk.ox, L.PL.desk.oy)} scale(${r(L.s, 5)})`}, L.desk.node) : null,
    L.chips.map(c => c.node),
    Object.values(L.tags).map(t => t.node),
    L.notes.map((n, k) => g({name: `note${n.i}`, opacity: 0},
      n.c.node,
      h('circle', {cx: r(L.marks[k].x), cy: r(L.marks[k].y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(L.marks[k].x), y: r(L.marks[k].y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(n.i + 1)))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
    L.colChips.map(c => c.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const cRaw = (u - C0) / (C1 - C0);
  const c = clamp(cRaw, 0, p.actionProgress);
  const G = L.stage.G;
  const v = choreo(c, G);
  const posed = L.stage.pose(v);
  const nodes = posed.nodes;
  // (two levels: the desk level carries the calendar's mark and Party A)
  if (L.desk) Object.assign(nodes, L.desk.pose(v).nodes);
  const done = p.actionProgress >= 1;
  const tagP = done ? seg(c, ...TAG) : 0;
  if (L.tags['tag-linked']) nodes['tag-linked'] = {opacity: r(tagP, 3)};
  const noteP = done ? seg(u, ...NOTES) : 0;
  L.notes.forEach(n => { nodes[`note${n.i}`] = {opacity: r(noteP, 3)}; });
  const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
  const S = L.s;
  const W2 = q => (q ? {x: r(L.ox + q.x * S), y: r(L.oy + q.y * S)} : null);
  const sem = posed.semantic;
  const act = v.active >= 0 ? G.links[v.active] : null;
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phase: v.phase, active: v.active, linked: v.linked, drawn: v.drawn.map(t => r(t, 3)), badges: v.badge.map(t => r(t, 3)),
      states: G.links.map(l => l.state), refers: G.links.map(l => l.refers), finalState: p.finalState,
      hand: W2(sem.hand), grip: W2(sem.grip), tip: W2(sem.tip), threadEnd: act && v.phase === 'carry' ? W2(act.poly.at(v.drawn[v.active])) : null,
      markP: sem.markP, tags: {linked: r(tagP, 3)}, notes: r(noteP, 3), allReached: sem.allReached,
      actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
      textColumn: Boolean(L.col), labelsClear: L.labelsClear, truncated: L.truncated, textPx: L.textPx, share: L.share, scale: r(L.s, 3), textMul: r(L.m, 2), headPx: r(L.headPx, 1),
      faces: L.faces.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-05-story',
    title: 'Structured response — each section is linked by a thread to the allegation it answers',
    titleEs: 'Contestación estructurada — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Contestación estructurada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of an office wall. The initial claim’s numbered allegations and Party B’s structured response are pinned on a board; Party A, who filed the claim, sits at a desk with the claim and response trays. Party B carries each section’s thread along its own lane and pins it to the allegation it answers; each link then shows the supplied state — ● admitted (solid) or ◆ disputed (dashed), equal weight — and the calendar marks the supplied response day. No effect of admitting or disputing, burden, consequence or outcome is shown.',
    tags: ['structured response', 'allegations', 'sections', 'links', 'admitted fact', 'disputed fact', 'pin board', 'calendar', 'case file', 'trays'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/contestacion-estructurada.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CE_STRINGS,
  scene,
});
