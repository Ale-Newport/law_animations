/**
 * LAW-0253 — Comunicación a la contraparte · story
 *
 * Storyboard (side view of one office wall; Party A seated at the left with the case file in her out-tray, Party B
 * seated at the right with an empty in-tray; the notification ROUTE — a wall track through the supplied stops —
 * rises above A's tray, runs across the wall and comes down above B's tray; a calendar with one cell per leg hangs
 * folded between the risers; the action clock c runs from u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the file (supplied reference and title) stands in A's tray; the carrier waits at the foot of A's
 *             riser; the stops' names, the route caption, the parties and the key are readable.
 *  0.15–0.42  Party A reaches the file and lifts it into the carrier's clip (hand on the file's top edge); the carrier
 *             takes it up the riser to the first stop (its lamp lights, neutral; leg 1's calendar cell unfolds with
 *             its supplied date).
 *  0.42–0.73  the file runs on through the remaining stops and down to B's tray; each leg's cell unfolds as the leg
 *             completes; Party B takes the file from the clip and sets it in the tray.
 *  0.73–1.00  hold: the tags (leaves A · in B's tray) and the supplied final state: documented (● chip) or
 *             questioned in this example (◆ chip and a dashed outline — the disputed marker — around the supplied
 *             leg). No valid method, deadline, "deemed" service or effect is stated.
 * @module animations/civil-claim/LAW-0253
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, int, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  CC_DEFAULTS, CC_STRINGS, partiesField, documentsField, stagesField, datesField, objectLabelProps,
  partyCaption, looksOf, routeStage, cueChip, placeNear, tagNode, hit, SIZES, pxPerUnit, PK,
  localizeDefaults, CC_COMMON_ES,
} from './kits/comunicacion-contraparte.js';

const ID = 'LAW-0253';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAGS = {sent: [0.29, 0.33], delivered: [0.79, 0.83], outcome: [0.83, 0.87], notes: [0.88, 0.92], marker: [0.82, 0.86]};
const TARGETS = ['file', 'route', 'calendar'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party A', 60), b: str('Caption for Party B', 60)}),
  objectLabels: obj('Labels printed on the props and tags', objectLabelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: the communication is documented, or it is questioned in this configured example. No validity, deadline or effect is inferred', ['documented', 'questioned']),
  questionedLeg: int('Zero-based leg that is questioned (only drawn when the final state is "questioned")', 0, 3),
};

const defaultParams = {
  parties: CC_DEFAULTS.parties,
  documents: CC_DEFAULTS.documents,
  stages: CC_DEFAULTS.stages,
  dates: CC_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: CC_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'calendar', text: 'Each leg’s cell opens as that leg is completed'}],
  finalState: 'documented',
  questionedLeg: 2,
};

/** Calendar columns per frame shape. */
const CAL_COLS = {landscape: 9, square: 9, portrait: 1};

/** Spanish defaults: with locale es, every field still at its English default is shown in Spanish. */
const DEFAULTS_ES = {...CC_COMMON_ES, annotations: [{target: 'calendar', text: 'La casilla de cada tramo se abre al completarse ese tramo'}]};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    let best = null, pick = null;
    const log = [];
    // (stage builds are pure in their options: layouts that differ only in their notes reuse them)
    const cache = new Map();
    const hasNotes = (ctx.params.annotations || []).length > 0 && ctx.show('all');
    const consider = L => {
      log.push(`${L.T}/${L.arrangement}:${L.problems.join('+')}`);
      L.log = log;
      const sc = L.problems.length * 100 - L.s * 10 - L.T;
      if (!best || sc < best.sc) best = {L, sc};
      // (among clean layouts with text >= 19.8 px, the one with the largest people; then the larger text)
      if (!L.problems.length && (!pick || (L.T >= 19.8 - 1e-6 && L.headPx > pick.headPx + 0.5) || (pick.T < 19.8 - 1e-6 && L.T > pick.T))) pick = L;
      return !L.problems.length;
    };
    for (const T0 of SIZES.filter(v => v >= 19.8 - 1e-6 || [18.9, 17.1, 16.6].includes(v))) {
      for (const cols of ctx.view.shape === 'portrait' ? [1, 2] : [CAL_COLS[ctx.view.shape], 2]) {
        for (const flat of [true, false]) {
          // (notes stand in the top band; when that is not clean they are tried in free space near their targets)
          if (!consider(compose(ctx, T0, {cols, flat, freeNotes: false, cache})) && hasNotes) {
            const Lf = compose(ctx, T0, {cols, flat, freeNotes: true, cache});
            if (!consider(Lf)) {
              // (the notes that found no free space go back to the band; the others stay free)
              const failed = Lf.problems.filter(q => /^place-note\d/.test(q)).map(q => +q.slice(10));
              if (failed.length && failed.length < (ctx.params.annotations || []).length) consider(compose(ctx, T0, {cols, flat, freeNotes: true, bandNotes: failed, cache}));
            }
          }
        }
      }
      if (pick && T0 < 19.8 + 1e-6) break;
    }
    return pick || best.L;
  },
  build(ctx, L) {
    return g(null,
      g({name: 'stage', transform: `${T(L.ox, L.oy)} scale(${r(L.s, 5)})`}, L.st.node),
      L.chips.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const cap = clamp(p.actionProgress ?? 1, 0, 1);
    const c = Math.min(cap, clamp((u - C0) / (C1 - C0), 0, 1));
    const capped = cap < 1 && (u - C0) / (C1 - C0) > cap;
    const qm = !capped && c >= 1 ? seg(u, ...TAGS.marker) : 0;
    const F = L.st.frame(c, {marker: qm});
    const nodes = {...F.nodes};
    const done = c >= 1;
    const show = (name, w) => { nodes[name] = {opacity: r(w, 3)}; };
    for (const ch of L.chips) {
      const w = ch.when === 'rest' ? 1
        : ch.when === 'sent' ? (c >= L.st.WIN.travel[0] ? seg(u, ...TAGS.sent) : 0)
          : ch.when === 'delivered' ? (done ? seg(u, ...TAGS.delivered) : 0)
            : ch.when === 'outcome' ? (done ? seg(u, ...TAGS.outcome) : 0)
              : ch.when === 'notes' ? (done ? seg(u, ...TAGS.notes) : 0) : 1;
      show(ch.name, w);
    }
    const M = q => ({x: r(L.ox + q.x * L.s, 2), y: r(L.oy + q.y * L.s, 2)});
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const s = F.s;
    return {
      nodes,
      semantic: {
        beat,
        clock: r(c, 4),
        docAt: s.docAt,
        holder: s.holder,
        legsDone: s.legsDone,
        legs: L.st.geo.N + 1,
        lamps: s.lamps,
        handA: M(s.handA), handB: M(s.handB), file: M(s.file), carrier: M(s.carrier), grip: M(s.fileGrip),
        allReached: s.allReached,
        plan: L.plan,
        markerShown: r(L.plan === 'questioned' ? qm : 0, 3),
        badgeShown: r(qm, 3),
        questionedLeg: L.st.geo.qLeg,
        actionCapped: capped,
        tags: Object.fromEntries(L.chips.map(ch => [ch.key, nodes[ch.name] ? nodes[ch.name].opacity : 0])),
        problems: L.problems,
        textPx: r(L.T, 1),
        headPx: r(L.headPx, 1),
        scale: r(L.s, 4),
        arrangement: L.arrangement,
        log: L.log,
      },
    };
  },
};

/** One composition at text size T0 (px at 1080p). */
function compose(ctx, T0, A) {
  const p = ctx.params;
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const F = T0 / px; // chip text size (design units)
  const looks = looksOf(ctx, p);
  const plan = p.finalState === 'questioned' ? 'questioned' : 'documented';
  const problems = [];
  const bounds = {x: 4, y: 4, w: D.w - 8, h: D.h - 8};
  // ---- the bottom band: party chips under each party and, between them (or on a second row), the supplied final
  // state; the key sits in the band's row too when there is room, else in a top corner
  const chipW = Math.min(D.w * 0.46, F * 16);
  const pc = [0, 1].map(i => cueChip(ctx, {name: `tag-party${i ? 'B' : 'A'}-chip`, text: partyCaption(p, i, p.actorLabels && (i ? p.actorLabels.b : p.actorLabels.a)), size: F, maxWidth: chipW, maxLines: 5}));
  const gap = F * 0.8;
  const outText = plan === 'questioned' ? p.objectLabels.questioned : p.objectLabels.documented;
  const oc = cueChip(ctx, {name: 'tag-outcome-chip', text: outText, size: F, maxWidth: Math.min(D.w * 0.5, F * 18), maxLines: 3, cue: plan});
  const key = cueChip(ctx, {name: 'key', text: `◦ ${ctx.t.key}`, size: F, maxWidth: Math.min(D.w * 0.5, F * 18), maxLines: 2, stroke: ctx.theme.inkSoft, weight: 600});
  for (const c of [...pc, oc, key]) if (c.fit.truncated) problems.push('chip-trunc');
  let rows = [];
  if (showAll) {
    const row1 = pc[0].w + pc[1].w + oc.w + 2 * gap <= bounds.w;
    rows = row1 ? [Math.max(pc[0].h, pc[1].h, oc.h)] : [Math.max(pc[0].h, pc[1].h), oc.h];
  }
  const band = rows.length ? rows.reduce((a2, b2) => a2 + b2, 0) + gap * rows.length : 0;
  // the top band: the key, the route's caption and the case file's reference and title (from the start), then the
  // editorial notes (hold), packed in rows; chips are also tried narrower (taller) when that packs fewer rows
  const mkTop = wf => {
    const notes = showAll ? (p.annotations || []).map((a2, i) => cueChip(ctx, {name: `note${i}-chip`, text: a2.text, size: F, maxWidth: Math.min(D.w * 0.46, F * 17 * wf), maxLines: 5, stroke: ctx.theme.ink, weight: 600})) : [];
    // (the case file's reference and title are printed once, here: the folder itself carries filler lines)
    const fileChip = showAll ? cueChip(ctx, {name: 'tag-file-chip', text: `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, size: F, maxWidth: Math.min(D.w * 0.5, F * 20 * wf), maxLines: 4}) : null;
    // (the route's caption — the order shown is only the configured one)
    const routeChip = showAll ? cueChip(ctx, {name: 'tag-route-chip', text: p.objectLabels.route, size: F, maxWidth: Math.min(D.w * 0.5, F * 20 * wf), maxLines: 4, stroke: ctx.theme.accent2}) : null;
    const items = [...(showKey ? [key] : []), ...(routeChip ? [routeChip] : []), ...(fileChip ? [fileChip] : []), ...notes.filter((_, i) => !A.freeNotes || (A.bandNotes || []).includes(i))];
    const rows0 = [];
    for (const it of items) {
      const row = rows0[rows0.length - 1];
      if (row && row.w + gap + it.w <= bounds.w) { row.items.push(it); row.w += gap + it.w; row.h = Math.max(row.h, it.h); }
      else rows0.push({items: [it], w: it.w, h: it.h});
    }
    const trunc = items.some(c => c.fit.truncated);
    return {notes, fileChip, routeChip, rows: rows0, trunc, height: rows0.reduce((a2, b2) => a2 + b2.h + gap * 0.6, 0)};
  };
  const tops = [1, 0.72, 0.55].map(mkTop).filter(q => !q.trunc);
  const top = tops.length ? tops.reduce((a2, b2) => (b2.height < a2.height - 0.5 ? b2 : a2)) : mkTop(1);
  if (top.trunc) problems.push('top-trunc');
  const {notes, fileChip, routeChip} = top;
  const topRows = top.rows;
  const keyTop = topRows.reduce((a2, b2) => a2 + b2.h + gap * 0.6, 0);
  const region = {x: 8, y: 8 + keyTop, w: D.w - 16, h: D.h - 16 - band - keyTop};
  const build0 = (s, RY) => routeStage(ctx, {P: 'st', p, looks, ts: T0 / (px * s), showText: showAll, W: Math.max(200, region.w / s - 180), RY, calCols: A.cols, plan, qLeg: p.questionedLeg, caption: null, fileText: false, flat: A.flat});
  const build = (s, RY) => {
    if (!A.cache) return build0(s, RY);
    // (a flat track ignores RY)
    const key = `${T0}|${A.cols}|${A.flat}|${s.toFixed(4)}|${A.flat ? 0 : RY.toFixed(3)}|${region.w.toFixed(3)}`;
    if (!A.cache.has(key)) A.cache.set(key, build0(s, RY));
    return A.cache.get(key);
  };
  // the largest stage scale that fits the region with a clean stage: coarse scan down, then refine upward
  const tryS = sc => {
    let st0 = build(sc, -700);
    const stack = st0.geo.RY - st0.ext.y; // from the wall top down to the track: the track rises to fill the height
    st0 = build(sc, 16 - region.h / sc + stack);
    const fits = st0.ext.w * sc <= region.w + 0.5 && st0.ext.h * sc <= region.h + 0.5;
    return {st: st0, s: sc, fits, clean: fits && !st0.problems.length};
  };
  let pick = null, bad = null;
  // (no stage is shorter than ~560 units — seated people, desks and the track above them)
  for (let sc = Math.min(1.6, Math.round(region.h / 560 * 10) / 10); sc >= 0.3; sc -= 0.1) {
    const t = tryS(sc);
    if (t.clean) { pick = t; break; }
    if (t.fits && !bad) bad = t;
  }
  if (pick) for (let sc = pick.s + 0.08; sc > pick.s + 1e-6; sc -= 0.02) { const t = tryS(sc); if (t.clean) { pick = t; break; } }
  if (!pick) pick = {...(bad || tryS(0.3)), bad: true};
  const {st, s} = pick;
  if (pick.bad) problems.push(...(st.problems.length ? st.problems : ['stage-fit']));
  // (the stage fills the region's height: a short flat stage in a tall frame is not accepted)
  if (st.ext.h * s < region.h * 0.8) problems.push('thin');
  // place the stage: centred horizontally, standing on the band
  const ox = region.x + (region.w - st.ext.w * s) / 2 - st.ext.x * s;
  const oy = region.y + region.h - (st.ext.y + st.ext.h) * s;
  const M = b => ({x: ox + b.x * s, y: oy + b.y * s, w: (b.w ?? 0) * s, h: (b.h ?? 0) * s});
  // (the rendered head box's smaller side is ~101–103 stage units)
  const headPx = 101 * s * px;
  if (headPx < 52.4) problems.push('small-people');
  const stageBox = M(st.ext);
  const occupied = [...st.props.map(M), ...st.heads.map(M), ...st.bodies.map(M), ...st.texts.map(M)];
  const chips = [];
  const put = (key2, name, chip, b, when) => { occupied.push(b); chips.push({key: key2, name, when, box: b, node: g({name}, chip.node(b.x, b.y))}); };
  if (showAll) {
    const y0 = stageBox.y + stageBox.h + gap * 0.3;
    const xa = clamp(M({x: 0, y: 0}).x - pc[0].w / 2, bounds.x, bounds.x + bounds.w - pc[0].w);
    const xb = clamp(M({x: st.geo.xB, y: 0}).x - pc[1].w / 2, bounds.x, bounds.x + bounds.w - pc[1].w);
    put('partyA', 'tag-partyA', pc[0], {x: xa, y: y0, w: pc[0].w, h: pc[0].h}, 'rest');
    put('partyB', 'tag-partyB', pc[1], {x: xb, y: y0, w: pc[1].w, h: pc[1].h}, 'rest');
    const oy2 = rows.length === 1 ? y0 : y0 + rows[0] + gap;
    let ox2 = (xa + pc[0].w + xb) / 2 - oc.w / 2;
    if (rows.length > 1) ox2 = bounds.x + (bounds.w - oc.w) / 2;
    const ob = {x: clamp(ox2, bounds.x, bounds.x + bounds.w - oc.w), y: oy2, w: oc.w, h: oc.h};
    if (rows.length === 1 && (hit(ob, chips[0].box, 4) || hit(ob, chips[1].box, 4))) problems.push('band-overlap');
    if (ob.y + ob.h > bounds.y + bounds.h + 0.5) problems.push('band-fit');
    put('outcome', 'tag-outcome', oc, ob, 'outcome');
  }
  {
    let y = bounds.y;
    for (const row of topRows) {
      let x = bounds.x + 4;
      for (const it of row.items) {
        const isKey = it === key, isFile = it === fileChip, isRoute = it === routeChip;
        const i = notes.indexOf(it);
        const b = {x, y, w: it.w, h: it.h};
        put(isKey ? 'key' : isFile ? 'file' : isRoute ? 'route' : `note${i}`, isKey ? 'key-wrap' : isFile ? 'tag-file' : isRoute ? 'tag-route' : `note${i}`, it, b, isKey || isFile || isRoute ? 'rest' : 'notes');
        x += it.w + gap;
      }
      y += row.h + gap * 0.6;
    }
  }
  // (free notes: each note stands in free space near its target — the wall or the bands' spare room — with a leader)
  if (A.freeNotes) {
    notes.forEach((chip, i) => {
      if ((A.bandNotes || []).includes(i)) return;
      const a2 = p.annotations[i];
      const anc = a2.target === 'file' ? st.anchors.file : a2.target === 'route' ? st.anchors.route : st.anchors.calendar;
      const A2 = M(anc);
      const at = placeNear({w: chip.w, h: chip.h, A: A2, bounds, occupied, maxLead: 260});
      if (!at || !at.clear) problems.push(`place-note${i}`);
      const b = at ? at.b : {x: A2.x, y: A2.y, w: chip.w, h: chip.h};
      occupied.push(b);
      chips.push({key: `note${i}`, name: `note${i}`, when: 'notes', box: b, node: tagNode(ctx, {name: `note${i}`, chip, at: b, A: A2, color: ctx.theme.ink})});
    });
  }
  return {T: T0, F, s, ox, oy, st, chips, problems, plan, headPx, arrangement: `${A.flat ? 'flat' : 'raised'}${A.freeNotes ? '+notes' + (A.bandNotes ? A.bandNotes.join('') : '') : ''}/cols${A.cols}/s${r(s, 3)}/W${r(st.geo.xB, 0)}/RY${r(st.geo.RY, 0)}/rows${rows.length}`};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-04-story',
    title: 'Communication to the other party — a case file travels along a supplied notification route',
    titleEs: 'Comunicación a la contraparte — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Comunicación a la contraparte',
    treatment: 'story',
    family: 'staged-scene',
    description: 'In a fictional office, Party A lifts the case file from her out-tray into the carrier of a wall track; the file travels along the supplied, editable route through its stops and comes down into Party B’s in-tray, and each leg’s calendar cell opens with its supplied date. The hold shows the supplied state: documented (●) or questioned in this example (◆, with a dashed disputed marker on the supplied leg). The order is only the configured one; nothing states a valid method, a deadline or an effect.',
    tags: ['office', 'case file', 'route', 'notification', 'calendar', 'tray', 'parties', 'documented', 'questioned', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/comunicacion-contraparte.js', 'src/primitives/person.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
