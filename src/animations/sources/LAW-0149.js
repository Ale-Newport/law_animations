/**
 * LAW-0149 — Remisión entre artículos · story
 *
 * Storyboard (top-down reading desk; brief beats in brackets):
 *  [0.00–0.15] rest: the open bound volume ("Text 1 (fictional)") with its two
 *              pages, each carrying the index tab of a user-supplied division;
 *              the articles are printed with their editable references. A page
 *              flag lies in the outer margin of the referring provision, its
 *              tip on the printed cross-reference phrase (the cue). The
 *              reader's hand comes in from the desk edge and the cue is ringed
 *              as it is read; the fingers close on the flag.
 *  [0.15–0.42] the hand peels the flag off and carries it along the supplied
 *              path: up the outer margin, along the clear lane above the pages
 *              (never over the text) and down the other margin, where it is
 *              pressed on at the heading of the referenced article. A dashed
 *              trail with a small arrowhead stays behind (direction of the
 *              supplied reference, not causation).
 *  [0.42–0.73] direct reference: the referenced article is ringed, the hand
 *              lets go and withdraws. Chain of references (path of 3–4 stops):
 *              at each stop the flag slides from the heading to that article's
 *              own cue, the cue is ringed, and the flag hops again; each hop
 *              gets a numbered badge. The last stop is ringed.
 *  [0.73–1.00] hold: the key card (path kind, legend of the supplied labels,
 *              "path as supplied · no conclusion drawn"), the state supplied
 *              by the author and the editorial pins. Nothing states what the
 *              referenced article says or that it applies.
 * finalState 'landed' follows the whole supplied path; 'first-stop' stops at
 * the first referenced article. actionProgress freezes the action part-way.
 * @module animations/sources/LAW-0149
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  sourcesFields, pathField, RA_STRINGS, CONTENT_EN, cleanPath, pathKind, pxScale, volumeArt, ringArt, cueOutline,
  flagArt, flagPose, flagBox, hopRoute, trailArt, hopBadge, keyCard, noteCard, letterPin, badgeSpot, overlaps, flagInk, flagColor, ringColor,
} from './kits/remision-entre-articulos.js';

const ID = 'LAW-0149';
const DURATION = 6000;
const FINAL = ['landed', 'first-stop'];
const TARGETS = ['referenced', 'provision', 'hierarchy'];
// editorial notes are lettered squares; circled numbers are reserved for the hop order
const LETTERS = ['a', 'b'];

const sceneSchema = {
  ...sourcesFields,
  path: pathField,
  ...storyFields({
    marker: str('Legend label of the page flag (the marker)', 40),
    path: str('Legend label of the hop trail', 50),
  }, TARGETS, FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Legend label of the reader (the hand)';
sceneSchema.actorLabels.properties.b.description = 'Legend label of the ring drawn around the referenced text';

const defaultParams = {
  ...CONTENT_EN,
  actorLabels: {a: 'Reader', b: 'Referenced text'},
  objectLabels: {marker: 'Page flag (marker)', path: 'Hop followed (as supplied)'},
  actionProgress: 1,
  annotations: [{target: 'referenced', text: 'Where the marker lands'}],
  finalState: 'landed',
};

/** Per-shape stage: book orientation, arm entry and arm offset (shoulder = hand + off). */
const GEO = {
  landscape: {orient: 'h', entry: 'bottom', off: {x: 170, y: 800}, arm: {upper: 420, lower: 400, width: 56, handScale: 1.3}, bend: 1, bulge: 90},
  square: {orient: 'v', entry: 'bottom', off: {x: 150, y: 860}, arm: {upper: 440, lower: 420, width: 56, handScale: 1.3}, bend: 1, bulge: 60},
  portrait: {orient: 'v', entry: 'right', off: {x: 640, y: 170}, arm: {upper: 330, lower: 310, width: 54, handScale: 1.3}, bend: -1, bulge: 100},
};

const W0 = {enter: [0.03, 0.125], read0: [0.07, 0.125], hopsStart: 0.165, key: [0.02, 0.1], kind: [0.74, 0.79], status: [0.77, 0.82], notes: [0.8, 0.86], interp: [0.82, 0.87]};
const hopsEndFor = n => (n <= 1 ? 0.42 : n === 2 ? 0.62 : 0.68);

/** Per-hop windows (pure). */
function schedule(n) {
  const he = hopsEndFor(n);
  const span = (he - W0.hopsStart) / n;
  const hops = [];
  for (let k = 0; k < n; k++) {
    const a0 = W0.hopsStart + k * span;
    const readEnd = a0 + (k ? 0.26 * span : 0);
    hops.push({
      a0, b0: a0 + span,
      read: k ? [a0, a0 + 0.14 * span] : W0.read0,
      slide: k ? [a0 + 0.08 * span, readEnd] : null,
      lift: [readEnd, readEnd + 0.1 * span],
      fly: [readEnd + 0.1 * span, a0 + 0.9 * span],
      press: [a0 + 0.9 * span, a0 + span],
    });
  }
  return {hops, he, ring: [he, he + 0.07], release: [he + 0.015, he + 0.045], withdraw: [he + 0.045, he + 0.14]};
}

const scene = {
  sizes: {landscape: [1840, 800], square: [1108, 860], portrait: [1000, 1430]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const G = GEO[shape];
    const W = ctx.design.w, H = ctx.design.h;
    const k = pxScale(ctx);
    const D = v => v / k;
    const px = {head: D(23), cue: D(22), tab: D(20.5), run: D(20.5), min: D(16.5)};
    const size0 = D(20.5), min = D(16.5);
    const path = cleanPath(p.path, p.passages.length);
    const stops = p.finalState === 'first-stop' ? path.slice(0, 2) : path;
    const kind = pathKind(path);
    const look = actorLook(ctx, null, 0);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const stateText = p.finalState === 'first-stop' ? t.firstStop : t.landed;

    // ---- panel (key card, state, notes, attributed reading)
    const buildPanel = (x0, y0, w, flow, cap = Infinity, size = size0) => {
      const cs = Math.min(size * 0.98, cap);
      const items = [];
      let y = y0;
      const key = showKey ? keyCard(ctx, {
        name: 'key', x: x0, y, w, size, min, flow, look, opacity: 0, noteSize: cap,
        rows: [{icon: 'hand', text: p.actorLabels.a}, {icon: 'flag', text: p.objectLabels.marker}, {icon: 'trail', text: p.objectLabels.path}, {icon: 'ring', text: p.actorLabels.b}],
        note: t.keyNote,
      }) : null;
      if (key) { items.push(key); y += key.box.h + 16; }
      // path kind + state + notes flow in rows (shown at the hold)
      const flowItems = [];
      if (showKey) {
        const kindText = kind === 'chain' ? t.chain : t.direct;
        const kOpt = (x, yy, name) => ({x, y: yy, maxWidth: w, size: cs, minSize: Math.min(min, cs), maxLines: 2, fill: flagColor(ctx), stroke: th.ink, color: th.ink, weight: 700, name});
        const kc = chip(ctx, kindText, kOpt(0, 0));
        flowItems.push({kind: 'kind', w: kc.box.w, h: kc.box.h, make: (x, yy) => chip(ctx, kindText, kOpt(x, yy, 'kind'))});
        const st = chip(ctx, stateText, {x: 0, y: 0, maxWidth: w, size: cs, minSize: Math.min(min, cs), maxLines: 2, fill: th.card, stroke: ringColor(ctx), color: th.ink, weight: 700});
        flowItems.push({kind: 'status', w: st.box.w, h: st.box.h, make: (x, yy) => chip(ctx, stateText, {x, y: yy, maxWidth: w, size: cs, minSize: Math.min(min, cs), maxLines: 2, fill: th.card, stroke: ringColor(ctx), color: th.ink, weight: 700, name: 'status'})});
      }
      if (showAll) {
        p.annotations.forEach((a, i) => {
          const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: w - size * 2.2, size, minSize: min, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 600});
          flowItems.push({kind: 'note', i, w: probe.box.w + size * 2.2, h: probe.box.h, make: (x, yy) => {
            const c = chip(ctx, a.text, {x: x + size * 2.2, y: yy, maxWidth: w - size * 2.2, size, minSize: min, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 600, name: `note${i}-chip`});
            const pin = letterPin(ctx, {name: `note${i}-num`, x: x + size * 0.95, y: yy + c.box.h / 2, letter: LETTERS[i], size: size * 0.95});
            return {node: g({name: `note${i}`, opacity: 0}, pin, c.node), box: {x, y: yy, w: c.box.w + size * 2.2, h: c.box.h}};
          }});
        });
      }
      let cx = x0, lineH = 0;
      const placed = [];
      for (const it of flowItems) {
        if (!flow || (cx > x0 && cx + it.w > x0 + w)) {
          if (placed.length) { y += lineH + 12; }
          cx = x0;
          lineH = 0;
        }
        const made = it.make(cx, y);
        placed.push({...it, made});
        cx += it.w + 18;
        lineH = Math.max(lineH, it.h);
      }
      if (placed.length) y += lineH + 16;
      let interp = null;
      if (showAll && p.interpretations.length) {
        const ip = p.interpretations[0];
        interp = noteCard(ctx, {name: 'interp', x: x0, y, w, size: size * 0.98, min, title: `${ip.by} · ${t.attributed}`, body: ip.text, accent: th.inkSoft, opacity: 0});
        y += interp.box.h + 12;
      }
      return {key, placed, interp, h: y - y0};
    };

    // ---- stage geometry per shape (built-in captions are capped at the size the articles end up with)
    let book, panel, vol;
    const volAt = bk => volumeArt(ctx, {prefix: 'vol', ...bk, orient: G.orient, articles: p.passages.map((a, i) => ({i, ...a})), levels: p.hierarchy.levels, title: p.sources[0].title, px, seedKey: 'ra-book', grow: 1.3});
    const contentMin = v => v.minText;
    if (shape !== 'portrait' && !showKey) {
      // labels hidden: no key panel, so the book takes the desk (centred, leaving the outer lane for the flag)
      book = shape === 'landscape' ? {x: 150, y: 28, w: W - 300, h: H - 28 - 18} : {x: 96, y: 22, w: W - 236, h: H - 44};
      vol = volAt(book);
      panel = buildPanel(0, 0, 100, false);
    } else if (shape !== 'portrait') {
      const x0 = shape === 'landscape' ? 1422 : 738;
      book = shape === 'landscape' ? {x: 60, y: 28, w: 1220, h: H - 28 - 18} : {x: 24, y: 22, w: 556, h: H - 44};
      vol = volAt(book);
      for (const f of [1, 0.95, 0.9, 0.85, 0.8]) {
        panel = buildPanel(x0, 30, W - x0 - 22, false, contentMin(vol), size0 * f);
        if (panel.h <= H - 50) break;
      }
    } else {
      const probe = buildPanel(30, 0, W - 60, true);
      let top = H - 18 - probe.h;
      book = {x: 30, y: 26, w: W - 170, h: top - 26 - 14};
      vol = volAt(book);
      panel = buildPanel(30, top, W - 60, true, contentMin(vol));
      if (panel.h < probe.h - 1) {
        top = H - 18 - panel.h;
        book = {...book, h: top - 26 - 14};
        vol = volAt(book);
        panel = buildPanel(30, top, W - 60, true, contentMin(vol));
      }
    }
    const B = vol.blocks;
    const spotOf = (i, which) => (which === 'cue' && B[i].cueSpot ? B[i].cueSpot : B[i].headSpot);
    const sxOf = s => (s.side === 'right' ? 1 : -1);
    // hops along the supplied stops
    const hops = [];
    for (let j = 0; j < stops.length - 1; j++) {
      const S = spotOf(stops[j], 'cue');
      const E = spotOf(stops[j + 1], 'head');
      const route = hopRoute(S, E, {lane: vol.lane, laneGap: shape === 'square' ? 58 : shape === 'portrait' ? 40 : 44});
      const trail = trailArt(ctx, {name: `trail${j}`, route, from: S, to: E});
      hops.push({S, E, route, trail, cross: S.side !== E.side});
    }
    const last = B[stops[stops.length - 1]];
    const ring = ringArt(ctx, {name: 'ring', box: last.box, color: ringColor(ctx)});
    const outlines = stops.slice(0, -1).map((i, j) => (B[i].pill ? {i, j, node: cueOutline(ctx, {name: `cue${j}`, pill: B[i].pill, color: flagInk(ctx)})} : null)).filter(Boolean);
    // hop badges sit BESIDE their trail (never on it), clear of text and of every flag place
    const badgeSize = Math.min(size0 * 0.95, contentMin(vol));
    const flagBoxes = stops.flatMap(i => [flagBox(spotOf(i, 'head')), ...(B[i].cueSpot ? [flagBox(B[i].cueSpot)] : [])]);
    const textBoxes = [...vol.text, ...vol.tabs.filter(tb => tb.text).map(tb => tb.text)];
    const bBounds = !showKey || shape === 'portrait' ? {x: 0, y: 0, w: W, h: H} : shape === 'landscape' ? {x: 0, y: 0, w: 1410, h: H} : {x: 0, y: 0, w: 730, h: H};
    const badgeAt = hops.map(hp => badgeSpot(hp.trail, {R: badgeSize * 0.8 + 2, obstacles: [...textBoxes, ...flagBoxes], bounds: bBounds}));
    const badges = hops.length > 1 ? hops.map((hp, j) => hopBadge(ctx, {name: `badge${j}`, x: badgeAt[j].x, y: badgeAt[j].y, n: j + 1, size: badgeSize})) : [];
    const {flag, shadow} = flagArt(ctx, {name: 'flag'});
    const arm = topArm(ctx, {name: 'arm', skin: look.skin, sleeve: look.outfit, handed: 'right', ...G.arm});
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: W, h: H, radius: 26, mat: false});
    // annotation pins on their targets (inner margin: no text under them)
    const pinAt = target => {
      if (target === 'hierarchy') {
        const tb = vol.tabs[last.page].box;
        const leftHalf = tb.x + tb.w / 2 < vol.pages[last.page].x + vol.pages[last.page].w / 2;
        return {x: leftHalf ? tb.x + tb.w + 24 : tb.x - 24, y: tb.y + tb.h / 2};
      }
      const blk = target === 'provision' ? B[stops[0]] : last;
      return {x: blk.side === 'right' ? blk.box.x - 20 : blk.box.x + blk.box.w + 20, y: blk.box.y + 20};
    };
    const pins = showAll ? p.annotations.map((a, i) => ({...pinAt(a.target), i})) : [];
    const pinNodes = pins.map(q => letterPin(ctx, {name: `pin${q.i}`, x: q.x, y: q.y, letter: LETTERS[q.i], size: Math.min(size0 * 0.95, contentMin(vol))}));
    // checks: the parked flag and the trails stay clear of printed text
    const texts = [...vol.text, ...vol.tabs.filter(tb => tb.text).map(tb => tb.text)];
    const endSpot = hops.length ? hops[hops.length - 1].E : spotOf(stops[0], 'cue');
    const flagClear = !texts.some(b => overlaps(flagBox(endSpot), b, 2));
    const trailTextHits = hops.reduce((n, hp) => n + hp.trail.poly.pts.filter(q => texts.some(b => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h)).length, 0);
    const entryOf = s => (G.entry === 'bottom' ? {x: s.x + 150, y: H + 240} : {x: W + 260, y: s.y + 90});
    return {badgeAt, W, H, G, vol, hops, ring, outlines, badges, flag, shadow, arm, desk, panel, pinNodes, pins, stops, path, kind, sxOf, spotOf, entryOf, flagClear, trailTextHits, look};
  },
  build(ctx, L) {
    const P = L.panel;
    return g(null,
      L.desk.surface,
      g({'clip-path': L.desk.clip},
        L.vol.node,
        L.outlines.map(o => o.node),
        L.ring.node,
        L.hops.map(hp => hp.trail.node),
        L.badges,
        L.pinNodes,
        L.shadow,
        L.arm.arm,
        L.arm.palm,
        L.flag,
        L.arm.thumb,
      ),
      L.desk.frame,
      P.key && P.key.node,
      P.placed.map(it => it.made.node),
      P.interp && P.interp.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const n = L.hops.length;
    const S = schedule(n);
    const endU = S.withdraw[1];
    const capU = lerp(W0.enter[0], endU, p.actionProgress);
    const a = Math.min(u, capU);
    const nodes = {};
    // ---- flag state
    const origin = L.spotOf(L.stops[0], 'cue');
    let pos = {x: origin.x, y: origin.y};
    let sx = L.sxOf(origin);
    let lift = 0;
    let flagAt = L.stops[0];
    let hopsDone = 0;
    const trailP = L.hops.map(() => 0);
    for (let j = 0; j < n; j++) {
      const hw = S.hops[j];
      const hp = L.hops[j];
      if (a < hw.a0) break;
      if (hw.slide && a >= hw.slide[0]) {
        // slide from the heading (where it landed) to this article's own cue
        const from = L.spotOf(L.stops[j], 'head');
        const q = ease.inOutCubic(seg(a, ...hw.slide));
        pos = {x: lerp(from.x, hp.S.x, q), y: lerp(from.y, hp.S.y, q)};
      }
      if (a >= hw.lift[0]) {
        const f = ease.inOutCubic(seg(a, ...hw.fly));
        const pt = hp.route.at(f);
        pos = {x: pt.x, y: pt.y};
        lift = seg(a, ...hw.lift) * (1 - seg(a, ...hw.press)) * (1 + 0.35 * Math.sin(Math.PI * f));
        const sA = L.sxOf(hp.S), sB = L.sxOf(hp.E);
        sx = sA === sB ? sA : lerp(sA, sB, ease.inOutSine(seg(f, 0.3, 0.7)));
        if (Math.abs(sx) < 0.04) sx = 0.04 * Math.sign(sB);
        const tr = hp.trail;
        trailP[j] = clamp((f - tr.t0) / (tr.t1 - tr.t0));
        flagAt = f >= 1 && a >= hw.press[1] ? L.stops[j + 1] : null;
        if (a >= hw.press[1]) hopsDone = j + 1;
      }
    }
    if (flagAt === null && hopsDone > 0 && a >= S.hops[hopsDone - 1].press[1]) flagAt = L.stops[hopsDone];
    Object.assign(nodes, flagPose('flag', {x: pos.x, y: pos.y, sx, lift: clamp(lift, 0, 1.4)}));
    // ---- hand
    const released = a >= S.release[0];
    const entry = L.entryOf(origin);
    let handT;
    if (a < W0.enter[1]) {
      const q = ease.inOutCubic(seg(a, ...W0.enter));
      handT = {x: lerp(entry.x, origin.x, q), y: lerp(entry.y, origin.y, q) - Math.sin(Math.PI * q) * 30};
    } else if (!released || a < S.withdraw[0]) handT = {...pos};
    else {
      const endS = L.hops.length ? L.hops[n - 1].E : origin;
      const exit = L.entryOf(endS);
      const q = ease.inOutCubic(seg(a, ...S.withdraw));
      handT = {x: lerp(endS.x, exit.x, q), y: lerp(endS.y, exit.y, q)};
    }
    const shoulder = {x: handT.x + L.G.off.x, y: handT.y + L.G.off.y};
    const solved = L.arm.pose(shoulder, handT, L.G.bend);
    Object.assign(nodes, solved.nodes);
    const held = a >= W0.enter[1] && !released;
    // ---- marks
    L.outlines.forEach(o => {
      const w = o.j === 0 ? W0.read0 : S.hops[o.j].read;
      nodes[`cue${o.j}`] = {opacity: r(seg(a, ...w), 3)};
    });
    L.hops.forEach((hp, j) => Object.assign(nodes, hp.trail.frame(trailP[j])));
    L.badges.forEach((b, j) => { nodes[`badge${j}`] = {opacity: r(seg(a, S.hops[j].press[0], S.hops[j].press[1] + 0.02), 3)}; });
    const ringP = hopsDone === n && n > 0 ? seg(a, ...S.ring) : 0;
    Object.assign(nodes, L.ring.frame(ringP));
    // ---- hold: panel, notes, pins (only once the action is complete)
    const done = p.actionProgress >= 1;
    const keyP = seg(u, ...W0.key);
    if (L.panel.key) nodes.key = {opacity: r(keyP, 3)};
    let statusShown = 0, notesShown = 0, kindShown = 0;
    L.panel.placed.forEach(it => {
      if (it.kind === 'kind') {
        kindShown = done ? seg(u, ...W0.kind) : 0;
        nodes.kind = {opacity: r(kindShown, 3)};
      } else if (it.kind === 'status') {
        const q = done ? seg(u, ...W0.status) : 0;
        nodes.status = {opacity: r(q, 3)};
        statusShown = q;
      } else {
        const q = done ? seg(u, ...W0.notes) : 0;
        nodes[`note${it.i}`] = {opacity: r(q, 3)};
        nodes[`note${it.i}-num`] = {opacity: 1};
        nodes[`pin${it.i}`] = {opacity: r(q, 3)};
        notesShown = q;
      }
    });
    if (L.panel.interp) nodes.interp = {opacity: r(done ? seg(u, ...W0.interp) : 0, 3)};
    const beat = u < 0.15 ? 'rest' : u < 0.42 ? 'action' : u < 0.73 ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        beat,
        hand: {x: r(solved.hand.x), y: r(solved.hand.y)},
        flag: {x: r(pos.x), y: r(pos.y)},
        holder: held ? 'hand' : 'page',
        flagAt,
        hopsDone,
        hops: n,
        stops: L.stops,
        path: L.path,
        kind: L.kind,
        lift: r(lift, 3),
        trails: trailP.map(v => r(v, 3)),
        ring: r(ringP, 3),
        handInFrame: solved.hand.x > -40 && solved.hand.x < L.W + 40 && solved.hand.y > -40 && solved.hand.y < L.H + 40,
        allReached: solved.reached,
        shoulderOut: shoulder.x < -20 || shoulder.x > L.W + 20 || shoulder.y < -20 || shoulder.y > L.H + 20,
        keyShown: r(keyP, 3),
        kindShown: r(kindShown, 3),
        statusShown: r(statusShown, 3),
        notesShown: r(notesShown, 3),
        flagClear: L.flagClear,
        trailTextHits: L.trailTextHits,
        bookCover: r(L.vol.bbox.w / L.W, 3),
        trailLengths: L.hops.map(hp => r(hp.trail.total, 1)),
        badgesClear: L.badgeAt.every(b => b.clear),
        noteMarkers: 'letters',
        volumeOverflow: L.vol.overflow,
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'sources-08-story',
    title: 'Cross-reference between articles — the page flag hops to the referenced text',
    titleEs: 'Remisión entre artículos — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Remisión entre artículos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: the reader peels a page flag off the cross-reference phrase printed in a fictional article and carries it, along the supplied path only, round the page text to the heading of the article it refers to; a chain of references repeats the hop from each stop\'s own phrase. Index tabs carry the user-supplied divisions. The path is shown as supplied; no conclusion is drawn.',
    tags: ['cross-reference', 'remisión', 'article', 'book', 'page flag', 'bookmark', 'editable hierarchy', 'chain of references', 'direct reference', 'hand'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/remision-entre-articulos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RA_STRINGS,
  scene,
});
