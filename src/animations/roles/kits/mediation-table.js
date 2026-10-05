/**
 * Mediation table stage for the "Mediación entre partes" motif (LAW-0185..0188).
 *
 * Side view of a meeting table seen slightly from above: Party A sits at the
 * left end facing right, Party B at the right end facing left (personRig,
 * seated), and the mediator sits behind the table facing the viewer
 * (frontMediator). The table's front panel covers the parties' legs; the
 * tabletop covers the mediator's lower torso while the mediator's arms rest
 * on it. On the table: an agenda clipboard (flattened, lying down) and a
 * wooden turn token.
 *
 * Layers (back → front): floor shadow · mediator chair/torso/head · tabletop ·
 * agenda · token · mediator arms (+pen) · Party A · Party B · table edge,
 * panel and legs · speech bubbles · chips.
 *
 * The kit owns geometry, the pose solver (pose input → node props) and a
 * turn-taking script (clock → pose input). Entries own timing windows,
 * layout of editorial labels and semantics.
 *
 * Attachment rules (asserted by entry tests through semantics):
 *  - while the mediator slides the token, the token is placed from the
 *    SOLVED hand (token = hand − grip offset);
 *  - a party's hand resting on the token sits exactly on its grip point;
 *  - the pen never leaves the mediator's hand; while ticking, its nib follows
 *    the tick stroke on the agenda exactly;
 *  - every IK target is within reach (`allReached`).
 * @module animations/roles/kits/mediation-table
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath} from '../../../core/geometry.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {wchip, overlaps as boxesOverlap} from './mediation-labels.js';
import {turnToken, agendaClipboard, speechBubble, frontMediator} from './mediation-props.js';

/**
 * Stage configurations (design units). `sy` = y of the table's near edge,
 * `sep` = distance from the table centre to each party's hip, `z` = zoom.
 */
export const MED_STAGES = {
  landscape: {W: 1600, H: 900, cx: 800, sy: 540, sep: 410, z: 1.19, bubbles: 'side', bubbleH: 160},
  square: {W: 1200, H: 1100, cx: 600, sy: 690, sep: 330, z: 1.3, bubbles: 'side', bubbleH: 165},
  portrait: {W: 900, H: 1400, cx: 450, sy: 846, sep: 262, z: 1.22, bubbles: 'top', crowd: 'narrow'},
};

/**
 * Hand/token spots for narrow tables (`crowd: 'narrow'`): the token rests
 * nearer the table's front edge, the parties rest their hands further back
 * on the table (behind the token, never on it) and the mediator rests both
 * hands further in on the agenda, so the pen held in one of them does not
 * cross the token lying at a party's place. Units: design units / z,
 * x measured from the table centre (spots, mediator) or from the party's hip.
 */
const NARROW = {spotX: 148, spotY: 34, restMX: 82, restMY: 42, near: {x: 106, y: 72}, far: {x: 86, y: 86}};

const AGENDA_FLAT = 0.42;
const TOKEN_FLAT = 0.45;

/** Pure geometry for a stage configuration. */
export function medGeometry(cfg) {
  const z = cfg.z;
  const {cx, sy} = cfg;
  const k = 1.4 * z;
  const sep = cfg.sep * z;
  const nearHalf = (cfg.sep - 50) * z;
  const farHalf = nearHalf - 40 * z;
  const seatY = sy + 30 * z;
  const narrow = cfg.crowd === 'narrow';
  // token spots stay well inside the tabletop on narrow (portrait) tables
  const spotOff = (narrow ? NARROW.spotX : Math.min(160, cfg.sep - 108)) * z;
  const spotY = (narrow ? NARROW.spotY : 50) * z;
  // the pen held in a resting hand points up-outward: rest far enough in that it
  // clears a token lying at the party's spot
  const rmx = (narrow ? NARROW.restMX : 88) * z, rmy = (narrow ? NARROW.restMY : 34) * z;
  const G = {
    z, k, cx, sy, sep, nearHalf, farHalf, seatY,
    W: cfg.W, H: cfg.H,
    yNear: sy, yFar: sy - 120 * z, edge: 16 * z,
    panelBottom: sy + 206 * z, floorY: sy + 240 * z,
    hipA: {x: cx - sep, y: seatY}, hipB: {x: cx + sep, y: seatY},
    med: {x: cx, y: sy - 222 * z, scale: z},
    agenda: {cx, cy: sy - 77 * z, w: 240 * z, h: 170 * z, f: AGENDA_FLAT},
    token: {r: 36 * z, home: {x: cx, y: sy - 31 * z}, spotA: {x: cx - spotOff, y: sy - spotY}, spotB: {x: cx + spotOff, y: sy - spotY}},
    // hands rest in front of the agenda's lower corners, forearms clear of its title
    restM: {l: {x: cx - rmx, y: sy - rmy}, r: {x: cx + rmx, y: sy - rmy}},
    raiseM: {l: {x: cx - 140 * z, y: sy - 238 * z}, r: {x: cx + 140 * z, y: sy - 238 * z}},
    calmM: {l: {x: cx - 112 * z, y: sy - 262 * z}, r: {x: cx + 112 * z, y: sy - 262 * z}},
  };
  // party hands: rest on the table; speaking gestures above it
  // parties' resting hands stay clear of a token lying at their spot
  const rnx = Math.min(128, cfg.sep - spotOff / z - 58);
  const rn = narrow ? NARROW.near : {x: rnx, y: 44};
  const rf = narrow ? NARROW.far : {x: rnx - 20, y: 62};
  const side = (id, dir) => ({
    restNear: {x: cx + dir * (-sep + rn.x * z), y: sy - rn.y * z},
    restFar: {x: cx + dir * (-sep + rf.x * z), y: sy - rf.y * z},
    gesture: {x: cx + dir * (-sep + 150 * z), y: sy - 118 * z},
  });
  G.handsA = side('a', 1);
  G.handsB = side('b', -1);
  // world positions of the parties' heads/mouths (rig local anchors × k)
  const head = (hip, dir) => ({x: hip.x + dir * 5 * k, y: hip.y - 176 * k});
  const mouth = (hip, dir) => ({x: hip.x + dir * 35 * k, y: hip.y - 156 * k});
  G.headA = head(G.hipA, 1);
  G.headB = head(G.hipB, -1);
  G.mouthA = mouth(G.hipA, 1);
  G.mouthB = mouth(G.hipB, -1);
  G.headR = 36 * k;
  G.medHeadTop = G.med.y - 150 * z;
  return G;
}

/** Default bubble boxes for a stage (side: above-inside of each head; top: above, beside the mediator). */
export function bubbleBoxes(G, mode, cfg) {
  const z = G.z;
  const tipA = {x: G.mouthA.x + 30 * z, y: G.mouthA.y - 6 * z};
  const tipB = {x: G.mouthB.x - 30 * z, y: G.mouthB.y - 6 * z};
  const headTop = G.headA.y - G.headR;
  if (mode === 'top') {
    // beside the mediator's head, above each party
    const w = (G.W - 60 * z) / 2 - 70 * z;
    const hh = 230 * z;
    const y = headTop - 40 * z - hh;
    return {a: {box: {x: 30 * z, y, w, h: hh}, tail: tipA}, b: {box: {x: G.W - 30 * z - w, y, w, h: hh}, tail: tipB}};
  }
  const hh = (cfg && cfg.bubbleH ? cfg.bubbleH : 215) * z;
  const w = Math.min(330 * z, G.sep - 80 * z);
  const y = headTop - 22 * z - hh;
  const xa = Math.max(20 * z, tipA.x + 40 * z - w * 0.55);
  return {
    a: {box: {x: Math.min(xa, G.cx - 130 * z - w), y, w, h: hh}, tail: tipA},
    b: {box: {x: Math.max(G.W - xa - w, G.cx + 130 * z), y, w, h: hh}, tail: tipB},
  };
}

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix               unique node-name prefix
 * @param {object} o.cfg                  one of MED_STAGES (or a custom config)
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.actors  [A, B, mediator]
 * @param {{a:string,b:string,mediator:string}} o.captions  chip captions (role text)
 * @param {{agendaTitle:string, agendaItems:string[], speech?:{a?:string,b?:string}}} o.props
 * @param {['a','b']|['b','a']} o.order   speaking order
 * @param {'side'|'top'} [o.bubbles]
 * @param {boolean} [o.chips=true]
 * @param {'panel'|'floor'} [o.plateAt='panel']  where the mediator's name plate goes
 * @param {number[]} [o.slots]            relative slot lengths of the two turns (agenda bars)
 */
export function mediationStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const cfg = o.cfg;
  const G = medGeometry(cfg);
  const z = G.z;
  const showAll = ctx.show('all');
  const looks = [0, 1, 2].map(i => actorLook(ctx, o.actors[i], i));
  const [F, S] = o.order;
  const penSide = S === 'b' ? 'r' : 'l';

  // --- characters
  const rigA = personRig(ctx, {name: `${P}-A`, look: looks[0], pose: 'seated'});
  const rigB = personRig(ctx, {name: `${P}-B`, look: looks[1], pose: 'seated'});
  const med = frontMediator(ctx, {name: `${P}-M`, look: looks[2], penSide});

  // --- table
  const {cx, yNear, yFar, nearHalf, farHalf, edge} = G;
  const topPath = `M${r(cx - farHalf)} ${r(yFar)}H${r(cx + farHalf)}L${r(cx + nearHalf)} ${r(yNear)}H${r(cx - nearHalf)}Z`;
  const clipTop = `${P}-topclip`;
  const grain = [];
  for (let i = 0; i < 5; i++) {
    const gy = yFar + ((i + 0.6) / 5.4) * (yNear - yFar);
    const wob = (4 + ctx.rng(`${P}-grain`, i) * 6) * z;
    grain.push(h('path', {d: `M${r(cx - nearHalf)} ${r(gy)}C${r(cx - nearHalf * 0.3)} ${r(gy - wob)} ${r(cx + nearHalf * 0.3)} ${r(gy + wob)} ${r(cx + nearHalf)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.6}));
  }
  const tabletop = g({name: `${P}-top`},
    h('defs', null, h('clipPath', {id: ctx.id(clipTop)}, h('path', {d: topPath}))),
    h('path', {d: topPath, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    g({'clip-path': ctx.ref(clipTop)}, grain,
      h('path', {d: `M${r(cx - farHalf)} ${r(yFar + 5 * z)}H${r(cx + farHalf)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.35})),
  );
  const legW = 30 * z;
  const panelTop = yNear + edge;
  const tableFront = g({name: `${P}-front`},
    h('path', {d: roundRectPath(cx - nearHalf, yNear, nearHalf * 2, edge, 3 * z), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(cx - nearHalf + legW * 0.6), y: r(panelTop), width: r(nearHalf * 2 - legW * 1.2), height: r(G.panelBottom - panelTop), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(cx - nearHalf + legW * 1.4, panelTop + 16 * z, nearHalf * 2 - legW * 2.8, G.panelBottom - panelTop - 34 * z, 8 * z), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(cx - nearHalf), y: r(panelTop - 1), width: r(legW), height: r(G.floorY - panelTop + 1), rx: 4 * z, fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(cx + nearHalf - legW), y: r(panelTop - 1), width: r(legW), height: r(G.floorY - panelTop + 1), rx: 4 * z, fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
  );
  const floorShadow = h('ellipse', {cx, cy: G.floorY + 2 * z, rx: r(nearHalf + G.sep * 0.55), ry: r(18 * z), fill: th.shadow});

  // --- agenda clipboard (drawn in its own frame, flattened onto the table)
  const Ag = G.agenda;
  const markers = [0, 1].map(i => {
    const id = o.order[i];
    return {color: looks[id === 'a' ? 0 : 1].outfit, letter: id === 'a' ? 'A' : 'B'};
  });
  const agenda = agendaClipboard(ctx, {prefix: `${P}-ag`, w: Ag.w, h: Ag.h, title: o.props.agendaTitle, items: o.props.agendaItems, markers, showText: showAll, slots: o.slots});
  const agOrigin = {x: Ag.cx - Ag.w / 2, y: Ag.cy - (Ag.h * Ag.f) / 2};
  const agendaNode = g({name: `${P}-agenda`, transform: `${T(agOrigin.x, agOrigin.y)} scale(1 ${Ag.f})`}, agenda.node);
  /** agenda-local → stage point */
  const agWorld = q => ({x: agOrigin.x + q.x, y: agOrigin.y + q.y * Ag.f});

  // --- token
  const tokenNode = turnToken(ctx, {name: `${P}-token`, radius: G.token.r, flat: TOKEN_FLAT});

  // --- bubbles
  const bb = bubbleBoxes(G, o.bubbles || cfg.bubbles, cfg);
  const speech = o.props.speech || {};
  const bubA = speechBubble(ctx, {name: `${P}-bubA`, box: bb.a.box, tail: bb.a.tail, text: speech.a, showText: showAll, stroke: shade(looks[0].outfit, -0.3)});
  const bubB = speechBubble(ctx, {name: `${P}-bubB`, box: bb.b.box, tail: bb.b.tail, text: speech.b, showText: showAll, stroke: shade(looks[1].outfit, -0.3)});

  // --- chips
  const chips = [];
  const plateAt = o.plateAt || 'panel';
  /** false when the chips could not be laid out without overlapping or leaving the stage */
  let chipsOK = true;
  if (o.chips !== false && ctx.show('key')) {
    const size = 28 * z;
    const cap = (i, id) => (o.captions[id] ? `${o.actors[i].name} · ${o.captions[id]}` : o.actors[i].name);
    // free design space beside/below the stage that chips may use (stage units)
    const mx = o.marginX ?? 0;
    const maxSide = Math.max(Math.min(G.sep * 1.3, G.W / 2 - 16 * z), G.W / 2 + mx - 16 * z);
    const lines = G.W < 1000 ? 4 : 2;
    const bottom = o.bottom ?? G.H - 6;
    const lo = -mx + 6 * z, hi = G.W + mx - 6 * z;
    // The mediator's name plate: low on the front panel (callouts use the band
    // above it), straddling the panel's lower edge between the legs ('low') or
    // centred on the floor line under the table ('floor') when the panel is
    // needed for long callouts. One line (bounded shrink) unless that would
    // truncate; then two smaller lines (three on narrow stages).
    const plateMax = plateAt === 'floor' ? Math.min(G.W - 24 * z, nearHalf * 2 + 60 * z) : plateAt === 'low' ? nearHalf * 2 - legW * 2.6 : nearHalf * 2 - legW * 3.6;
    const plateOpts = (n, y, name) => ({x: cx, y, anchor: 'middle', maxWidth: plateMax, size: n > 1 ? size * 0.86 : size, minSize: n > 1 ? size * 0.68 : size * 0.72, maxLines: n, fill: '#f7f1e3', name});
    let plateN = 1;
    let plate = wchip(ctx, cap(2, 'mediator'), plateOpts(1, 0));
    if (plate.fit.truncated) { plateN = 2; plate = wchip(ctx, cap(2, 'mediator'), plateOpts(2, 0)); }
    if (plate.fit.truncated && G.W < 1000) { plateN = 3; plate = wchip(ctx, cap(2, 'mediator'), plateOpts(3, 0)); }
    const plateY = plateAt === 'floor' ? G.floorY + 8 * z
      : plateAt === 'low' ? Math.min(G.panelBottom - plate.box.h * 0.45, G.floorY - plate.box.h - 4 * z)
        : G.panelBottom - 12 * z - plate.box.h;
    const pm = wchip(ctx, cap(2, 'mediator'), plateOpts(plateN, plateY, `${P}-chipM`));

    // Party chips, centred under each party (shifted inward only as far as
    // needed to stay inside the frame): one line at a common size when both
    // fit with a bounded shrink, else balanced wrapped lines; the size shrinks
    // (bounded) until both fit above `bottom`.
    const texts = [cap(0, 'a'), cap(1, 'b')];
    const xs = [G.hipA.x, G.hipB.x];
    const names = [`${P}-chipA`, `${P}-chipB`];
    const sideAt = (i, y, sz, n, minS) => {
      const opt = {y, anchor: 'middle', maxWidth: maxSide, size: sz, minSize: minS, maxLines: n, name: names[i]};
      const c0 = wchip(ctx, texts[i], {...opt, x: xs[i]});
      const dx = c0.box.x < lo ? lo - c0.box.x : c0.box.x + c0.box.w > hi ? hi - (c0.box.x + c0.box.w) : 0;
      return dx ? wchip(ctx, texts[i], {...opt, x: xs[i] + dx}) : c0;
    };
    const pairAt = (y, sz) => {
      const one = [0, 1].map(i => sideAt(i, y, sz, 1, sz * 0.8));
      if (one.every(c => !c.fit.truncated)) {
        const s1 = Math.min(...one.map(c => c.fit.size));
        return [0, 1].map(i => sideAt(i, y, s1, 1, s1));
      }
      const multi = [0, 1].map(i => sideAt(i, y, sz, lines, sz * 0.8));
      const s2 = Math.min(...multi.map(c => c.fit.size));
      return [0, 1].map(i => sideAt(i, y, s2, lines, s2 * 0.9));
    };
    const clear = pair => pair.every(c => !c.fit.truncated && !boxesOverlap(c.box, pm.box, 6 * z));
    /** largest pair at row y (rising at most 24z) that fits above `bottom` and clears the plate */
    const fitRow = y => {
      let best = null;
      for (let sz = size; sz >= size * 0.62 - 1e-6; sz -= size * 0.05) {
        let pair = pairAt(y, sz);
        const over = Math.max(...pair.map(c => c.box.y + c.box.h)) - bottom;
        if (over > 0 && over <= 24 * z) pair = pairAt(y - over, sz);
        best = pair;
        if (Math.max(...pair.map(c => c.box.y + c.box.h)) <= bottom + 0.5 && clear(pair)) return {pair, ok: true};
      }
      return {pair: best, ok: false};
    };
    const yChip = G.floorY + 8 * z;
    let row = fitRow(yChip);
    if (!row.ok && plateAt === 'floor') row = fitRow(pm.box.y + pm.box.h + 10 * z);
    if (!row.ok && plateAt !== 'floor') {
      // last resort for the panel plate: tall chips rise (the plate is on the panel, clear of them)
      const pair = pairAt(yChip, size * 0.62);
      const up = Math.max(0, Math.max(...pair.map(c => c.box.y + c.box.h)) - bottom);
      row = {pair: up ? pairAt(yChip - up, size * 0.62) : pair, ok: plateAt === 'panel'};
      if (!clear(row.pair)) row.ok = false;
    }
    chipsOK = row.ok;
    chips.push(row.pair[0], row.pair[1], pm);
  }

  const node = g({name: P},
    floorShadow,
    med.body,
    tabletop,
    agendaNode,
    tokenNode,
    med.arms,
    rigA.node,
    rigB.node,
    tableFront,
    bubA.node,
    bubB.node,
    chips.map(c => c.node),
  );

  const gripM = (tok, side) => ({x: tok.x + (side === 'l' ? -9 : 9) * z, y: tok.y - 7 * z});
  const gripP = (tok, id) => ({x: tok.x + (id === 'a' ? -13 : 13) * z, y: tok.y - 5 * z});
  const spot = id => (id === 'a' ? G.token.spotA : id === 'b' ? G.token.spotB : G.token.home);

  /**
   * Pose the stage.
   * @param {object} s
   * @param {{left:{x:number,y:number}, right:{x:number,y:number}, look:number, tilt:number, mouth:number}} s.med
   * @param {{x:number,y:number}} s.token        resting/scripted token position
   * @param {'l'|'r'|'a'|'b'|null} s.tokenHold  who holds the token (mediator hand or party)
   * @param {{near:{x:number,y:number}, far:{x:number,y:number}, mouth:number, lean:number}} s.a
   * @param {{near:{x:number,y:number}, far:{x:number,y:number}, mouth:number, lean:number}} s.b
   * @param {{a:{open:number,words:number}, b:{open:number,words:number}}} s.bubbles
   * @param {number[]} s.ticks  tick progress per agenda row
   * @param {number[]} s.hl     highlight per agenda row
   * @param {{x:number,y:number}|null} [s.tickTarget] nib target while ticking
   */
  function pose(s) {
    const nodes = {};
    const mf = med.frame({x: G.med.x, y: G.med.y, scale: G.med.scale, left: s.med.left, right: s.med.right, look: s.med.look, tilt: s.med.tilt, mouth: s.med.mouth, open: s.med.open});
    Object.assign(nodes, mf.nodes);
    let tok = s.token;
    if (s.tokenHold === 'l' || s.tokenHold === 'r') {
      const hnd = mf.hands[s.tokenHold];
      const off = gripM({x: 0, y: 0}, s.tokenHold);
      tok = {x: hnd.x - off.x, y: hnd.y - off.y};
    }
    nodes[`${P}-token`] = {transform: T(tok.x, tok.y)};
    const pa = rigA.frame({x: G.hipA.x, y: G.hipA.y, facing: 1, scale: G.k, lean: s.a.lean, mouth: s.a.mouth, headTilt: s.a.tilt || 0, near: s.a.near, far: s.a.far});
    const pb = rigB.frame({x: G.hipB.x, y: G.hipB.y, facing: -1, scale: G.k, lean: s.b.lean, mouth: s.b.mouth, headTilt: s.b.tilt || 0, near: s.b.near, far: s.b.far});
    Object.assign(nodes, pa.nodes, pb.nodes);
    Object.assign(nodes, bubA.frame(s.bubbles.a.open, s.bubbles.a.words, ctx.reduced));
    Object.assign(nodes, bubB.frame(s.bubbles.b.open, s.bubbles.b.words, ctx.reduced));
    Object.assign(nodes, agenda.frame(s.ticks, s.hl));
    if (s.markers) Object.assign(nodes, s.markers);
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const near = (q, id) => Math.hypot(q.x - spot(id).x, q.y - spot(id).y) < 1;
    const tokenAt = near(tok, 'a') ? 'a' : near(tok, 'b') ? 'b' : near(tok, 'home') ? 'home' : 'moving';
    return {
      nodes,
      semantic: {
        token: P2(tok),
        tokenAt,
        tokenHold: s.tokenHold || null,
        medL: P2(mf.hands.l),
        medR: P2(mf.hands.r),
        elbowL: P2(mf.elbows.l),
        elbowR: P2(mf.elbows.r),
        // natural front-view arms: elbows never rise above the shoulder line
        elbowsLow: mf.elbows.l.y > G.med.y + 14 * z && mf.elbows.r.y > G.med.y + 14 * z,
        gripL: P2(gripM(tok, 'l')),
        gripR: P2(gripM(tok, 'r')),
        pen: P2(mf.pen),
        tickTarget: s.tickTarget ? P2(s.tickTarget) : null,
        handA: P2(pa.hands.near),
        handB: P2(pb.hands.near),
        gripA: P2(gripP(tok, 'a')),
        gripB: P2(gripP(tok, 'b')),
        bubbleA: r(s.bubbles.a.open, 3),
        bubbleB: r(s.bubbles.b.open, 3),
        speakingA: s.a.mouthOn || false,
        speakingB: s.b.mouthOn || false,
        ticks: s.ticks.map(v => r(clamp(v), 3)),
        reach: {med: mf.reached, a: pa.reached, b: pb.reached},
        allReached: mf.reached && pa.reached && pb.reached,
      },
    };
  }

  return {
    node, pose, G, cfg, agenda, agWorld, agOrigin, bubA, bubB, looks, penSide,
    order: o.order, F, S, gripM, gripP, spot, med, chips,
    /** top of the front panel's free band (above the mediator's name plate) */
    panelFreeY: panelTop + 8 * z,
    /** bottom of that free band */
    panelFreeBottom: chips[2] && plateAt !== 'floor' ? chips[2].box.y - 8 * z : G.panelBottom - 10 * z,
    chipsOK,
    /** lowest y used by the name chips (stage units) */
    chipsBottom: chips.length ? Math.max(...chips.map(c => c.box.y + c.box.h)) : G.floorY,
    plateAt,
    /** world point of the agenda tick stroke of row i at p */
    tickWorld: (i, p) => agWorld(agenda.tickAt(i, p)),
    /** approximate world box of the agenda board (for lenses / callouts) */
    agendaBox: {x: Ag.cx - Ag.w * 0.55, y: agOrigin.y - Ag.h * 0.1 * Ag.f, w: Ag.w * 1.1, h: Ag.h * 1.17 * Ag.f},
  };
}

/* ------------------------------------------------------------------ script */

/**
 * Piecewise track: holds `start`, then each segment moves from the previous
 * end to `to` (or follows `at(c)`) inside [a, b]. Segments must be sorted.
 * @param {number} c
 * @param {{x:number,y:number}} start
 * @param {Array<{a:number,b:number,to?:{x:number,y:number}, at?:(c:number)=>{x:number,y:number}, ease?:(t:number)=>number}>} segs
 */
export function runTrack(c, start, segs) {
  let p = start;
  for (const s of segs) {
    if (c < s.a) return p;
    if (s.at) {
      if (c <= s.b) return s.at(c);
      p = s.at(s.b);
      continue;
    }
    const e = (s.ease || ease.inOutCubic)(clamp((c - s.a) / (s.b - s.a)));
    if (c <= s.b) return mix(p, s.to, e);
    p = s.to;
  }
  return p;
}

/** Ordered-turns windows on the action clock c (1 = S has started speaking). */
export const TURN_WINDOWS = {
  lookF: [0, 0.07],
  m1: {reach: [0.02, 0.1], slide: [0.1, 0.24], back: [0.24, 0.32]},
  fOn: [0.24, 0.31], fOff: [0.47, 0.53],
  fBubble: {open: [0.27, 0.33], words: [0.31, 0.45], close: [0.5, 0.56]}, fMouth: [0.3, 0.47],
  gesture: [0.41, 0.5],
  m2: {reach: [0.53, 0.6], slide: [0.6, 0.72], back: [0.72, 0.8]},
  tick1: {approach: [0.44, 0.52], draw: [0.52, 0.58], toHandoff: [0.6, 0.72]},
  lookS: [0.66, 0.74],
  m3: {slide: [0.72, 0.84], back: [0.84, 0.92]},
  sOn: [0.84, 0.9],
  sBubble: {open: [0.86, 0.92], words: [0.9, 1.06]}, sMouth: [0.9, 1.12],
  hl0: [0.26, 0.3, 0.56, 0.6], hl1: [0.84, 0.88],
  // 'both' plan: S's turn closes and the second row is ticked
  sOff: [1.08, 1.14], sClose: [1.1, 1.16],
  tick2: {approach: [1.1, 1.16], draw: [1.16, 1.22], back: [1.22, 1.3]}, lookEnd: [1.2, 1.28], hl1off: [1.2, 1.25],
  // 'simultaneous' plan
  sim: {aOpen: [0.2, 0.26], bOpen: [0.24, 0.3], words: [0.26, 0.9], mouth: [0.24, 1.12], calm: [0.36, 0.46], calmDown: [1.02, 1.12]},
  // 'swap' plan (inspect context return): F's turn → token passes to S.
  // Compact: the entry plays it in a short window after the camera has
  // returned, so the pause gesture is brief and most of the clock goes to the
  // two slides (F's hand pulls the token to the centre, S's hand carries it on).
  swap: {gesture: [0, 0.12], fOff: [0, 0.12], fClose: [0.02, 0.14], reach: [0.12, 0.24], slide: [0.24, 0.46], toHandoff: [0.1, 0.46], back: [0.46, 0.6], slide2: [0.46, 0.68], back2: [0.68, 0.82], sOn: [0.68, 0.8], sOpen: [0.72, 0.86], words: [0.78, 0.97], look: [0.35, 0.5], sMouthEnd: [0.93, 1]},
};

/**
 * Turn-taking script for one stage.
 * @param {ReturnType<typeof mediationStage>} st
 * @param {'second'|'first'|'both'|'simultaneous'|'swap'} plan
 *   second: F speaks, token passes to S who keeps the floor;
 *   first: F keeps the floor; both: S's turn also closes, both rows ticked;
 *   simultaneous: no token passes, both speak at once while the mediator
 *   raises both open hands; swap: starts with F speaking (token at F) and
 *   passes the token to S (used for the inspect context return).
 * @param {{ticks?:boolean}} [opt]
 * @returns {(c:number, timeMs:number, reduced:boolean) => object} pose input
 */
export function turnScript(st, plan, opt = {}) {
  const G = st.G;
  const z = G.z;
  const W = TURN_WINDOWS;
  const F = st.F, S = st.S;
  const hF = F === 'a' ? 'l' : 'r';
  const hS = hF === 'l' ? 'r' : 'l';
  const home = G.token.home;
  const spotF = st.spot(F), spotS = st.spot(S);
  const lookF = F === 'a' ? -1 : 1;
  const lookS = -lookF;
  const penOff = st.med.penOffset(G.med.scale);
  const withTicks = opt.ticks !== false;
  const rows = st.agenda.rows.length;
  const handsOf = id => (id === 'a' ? G.handsA : G.handsB);

  // token track
  const tokenSegs = [];
  if (plan === 'second' || plan === 'both') {
    tokenSegs.push({a: W.m1.slide[0], b: W.m1.slide[1], to: spotF});
    tokenSegs.push({a: W.m2.slide[0], b: W.m2.slide[1], to: home});
    tokenSegs.push({a: W.m3.slide[0], b: W.m3.slide[1], to: spotS});
  } else if (plan === 'first') {
    tokenSegs.push({a: W.m1.slide[0], b: W.m1.slide[1], to: spotF});
  } else if (plan === 'swap') {
    tokenSegs.push({a: W.swap.slide[0], b: W.swap.slide[1], to: home});
    tokenSegs.push({a: W.swap.slide2[0], b: W.swap.slide2[1], to: spotS});
  }
  const tokenStart = plan === 'swap' ? spotF : home;
  const tokenAt = c => runTrack(c, tokenStart, tokenSegs);
  const grip = side => c => st.gripM(tokenAt(c), side);
  const tickAt = (row, w) => c => {
    const q = st.tickWorld(row, ease.inOutSine(seg(c, w[0], w[1])));
    return {x: q.x + penOff.x, y: q.y + penOff.y};
  };
  const tickStart = row => {
    const q = st.tickWorld(row, 0);
    return {x: q.x + penOff.x, y: q.y + penOff.y - 14 * z};
  };

  // mediator hand tracks
  const restF = G.restM[hF], restS = G.restM[hS];
  const segsF = [], segsS = [];
  if (plan === 'second' || plan === 'both' || plan === 'first') {
    segsF.push({a: W.m1.reach[0], b: W.m1.reach[1], to: st.gripM(home, hF)});
    segsF.push({a: W.m1.slide[0], b: W.m1.slide[1], at: grip(hF)});
    segsF.push({a: W.m1.back[0], b: W.m1.back[1], to: restF});
  }
  if (plan === 'second' || plan === 'both') {
    segsF.push({a: W.gesture[0], b: W.gesture[1], to: G.raiseM[hF]});
    segsF.push({a: W.m2.reach[0], b: W.m2.reach[1], to: st.gripM(spotF, hF)});
    segsF.push({a: W.m2.slide[0], b: W.m2.slide[1], at: grip(hF)});
    segsF.push({a: W.m2.back[0], b: W.m2.back[1], to: restF});
    if (withTicks) {
      segsS.push({a: W.tick1.approach[0], b: W.tick1.approach[1], to: tickStart(0)});
      segsS.push({a: W.tick1.approach[1], b: W.tick1.draw[0], to: tickAt(0, W.tick1.draw)(W.tick1.draw[0])});
      segsS.push({a: W.tick1.draw[0], b: W.tick1.draw[1], at: tickAt(0, W.tick1.draw)});
    }
    segsS.push({a: W.tick1.toHandoff[0], b: W.tick1.toHandoff[1], to: st.gripM(home, hS)});
    segsS.push({a: W.m3.slide[0], b: W.m3.slide[1], at: grip(hS)});
    segsS.push({a: W.m3.back[0], b: W.m3.back[1], to: restS});
    if (plan === 'both' && withTicks) {
      segsS.push({a: W.tick2.approach[0], b: W.tick2.approach[1], to: tickStart(1)});
      segsS.push({a: W.tick2.approach[1], b: W.tick2.draw[0], to: tickAt(1, W.tick2.draw)(W.tick2.draw[0])});
      segsS.push({a: W.tick2.draw[0], b: W.tick2.draw[1], at: tickAt(1, W.tick2.draw)});
      segsS.push({a: W.tick2.back[0], b: W.tick2.back[1], to: restS});
    }
  } else if (plan === 'simultaneous') {
    segsF.push({a: W.sim.calm[0], b: W.sim.calm[1], to: G.calmM[hF]});
    segsF.push({a: W.sim.calmDown[0], b: W.sim.calmDown[1], to: restF});
    segsS.push({a: W.sim.calm[0] + 0.02, b: W.sim.calm[1] + 0.02, to: G.calmM[hS]});
    segsS.push({a: W.sim.calmDown[0], b: W.sim.calmDown[1], to: restS});
  } else if (plan === 'swap') {
    const sw = W.swap;
    // a short, low "pause" gesture (the swap clock is compact: a full raise
    // would make the hand jump between frames)
    segsF.push({a: sw.gesture[0], b: sw.gesture[1], to: mix(restF, G.raiseM[hF], 0.5)});
    segsF.push({a: sw.reach[0], b: sw.reach[1], to: st.gripM(spotF, hF)});
    segsF.push({a: sw.slide[0], b: sw.slide[1], at: grip(hF)});
    segsF.push({a: sw.back[0], b: sw.back[1], to: restF});
    segsS.push({a: sw.toHandoff[0], b: sw.toHandoff[1], to: st.gripM(home, hS)});
    segsS.push({a: sw.slide2[0], b: sw.slide2[1], at: grip(hS)});
    segsS.push({a: sw.back2[0], b: sw.back2[1], to: restS});
  }

  return (c, timeMs, reduced) => {
    const tok = tokenAt(c);
    const handF = runTrack(c, restF, segsF);
    const handS = runTrack(c, restS, segsS);
    // who holds the token
    let hold = null;
    const inW = w => c >= w[0] && c <= w[1];
    if (plan === 'second' || plan === 'both' || plan === 'first') {
      if (inW(W.m1.slide)) hold = hF;
    }
    if (plan === 'second' || plan === 'both') {
      if (inW(W.m2.slide)) hold = hF;
      if (c > W.m3.slide[0] && c <= W.m3.slide[1]) hold = hS;
    }
    if (plan === 'swap') {
      if (inW(W.swap.slide)) hold = hF;
      if (c > W.swap.slide2[0] && c <= W.swap.slide2[1]) hold = hS;
    }
    let tickTarget = null;
    if (withTicks && (plan === 'second' || plan === 'both') && inW(W.tick1.draw)) tickTarget = st.tickWorld(0, ease.inOutSine(seg(c, ...W.tick1.draw)));
    if (withTicks && plan === 'both' && inW(W.tick2.draw)) tickTarget = st.tickWorld(1, ease.inOutSine(seg(c, ...W.tick2.draw)));

    // party poses
    const party = id => {
      const isF = id === F;
      const hd = handsOf(id);
      const out = {near: hd.restNear, far: hd.restFar, mouth: 0, lean: 0, tilt: 0, mouthOn: false};
      let talk = 0;
      let onTok = 0;
      if (plan === 'simultaneous') {
        talk = seg(c, W.sim.mouth[0], W.sim.mouth[0] + 0.04) * (1 - seg(c, W.sim.mouth[1] - 0.04, W.sim.mouth[1]));
        const up = ease.inOutSine(seg(c, W.sim.aOpen[0] + (isF ? 0 : 0.03), W.sim.aOpen[1] + 0.04)) * (1 - ease.inOutSine(seg(c, 1.0, 1.1)));
        const wav = reduced ? 0 : Math.sin(timeMs * 0.0062 + (isF ? 0 : 1.7));
        const g0 = hd.gesture;
        out.near = mix(hd.restNear, {x: g0.x, y: g0.y + wav * 16 * z}, up);
        out.lean = 6 * up;
      } else if (plan === 'swap') {
        const sw = W.swap;
        if (isF) {
          talk = 1 - seg(c, sw.fOff[0], sw.fOff[1]);
          onTok = 1 - ease.inOutCubic(seg(c, sw.fOff[0], sw.fOff[1]));
        } else {
          // mouth stops just before the end so the final hold is still
          talk = seg(c, sw.sOpen[0], sw.sOpen[1]) * (1 - seg(c, ...sw.sMouthEnd));
          onTok = ease.inOutCubic(seg(c, sw.sOn[0], sw.sOn[1]));
        }
      } else {
        if (isF) {
          talk = seg(c, W.fMouth[0], W.fMouth[0] + 0.03) * (plan === 'first' ? 1 : 1 - seg(c, W.fMouth[1] - 0.03, W.fMouth[1]));
          onTok = ease.inOutCubic(seg(c, ...W.fOn)) * (plan === 'first' ? 1 : 1 - ease.inOutCubic(seg(c, ...W.fOff)));
        } else if (plan !== 'first') {
          talk = seg(c, W.sMouth[0], W.sMouth[0] + 0.03) * (1 - seg(c, W.sMouth[1] - 0.03, W.sMouth[1]));
          onTok = ease.inOutCubic(seg(c, ...W.sOn)) * (plan === 'both' ? 1 - ease.inOutCubic(seg(c, ...W.sOff)) : 1);
        }
        out.lean = 4 * talk;
      }
      if (onTok > 0) {
        out.near = mix(hd.restNear, st.gripP(tok, id), onTok);
        // lean in to reach the token lying on the table
        out.lean = Math.max(out.lean, 6 * Math.min(1, onTok * 1.5));
      }
      out.onToken = onTok >= 1;
      const flap = reduced ? 0.55 : 0.25 + 0.55 * Math.abs(Math.sin(timeMs * 0.0145 + (id === 'a' ? 0 : 0.9)));
      out.mouth = talk * flap;
      out.mouthOn = talk > 0.5;
      return out;
    };
    const pa = party('a');
    const pb = party('b');

    // bubbles
    const bub = {a: {open: 0, words: 0}, b: {open: 0, words: 0}};
    const setB = (id, open, words) => { bub[id] = {open: clamp(open), words: clamp(words)}; };
    if (plan === 'simultaneous') {
      // both bubbles stay open through the hold (both interventions shown at once)
      setB(F, seg(c, ...W.sim.aOpen), seg(c, ...W.sim.words));
      setB(S, seg(c, ...W.sim.bOpen), seg(c, W.sim.words[0] + 0.03, W.sim.words[1]));
    } else if (plan === 'swap') {
      const sw = W.swap;
      setB(F, 1 - seg(c, ...sw.fClose), 1);
      setB(S, seg(c, ...sw.sOpen), seg(c, ...sw.words));
    } else {
      const fClose = plan === 'first' ? 0 : seg(c, ...W.fBubble.close);
      setB(F, seg(c, ...W.fBubble.open) * (1 - fClose), seg(c, W.fBubble.words[0], plan === 'first' ? 0.8 : W.fBubble.words[1]));
      if (plan !== 'first') setB(S, seg(c, ...W.sBubble.open) * (plan === 'both' ? 1 - seg(c, ...W.sClose) : 1), seg(c, ...W.sBubble.words));
    }

    // agenda
    const ticks = new Array(rows).fill(0);
    const hl = new Array(rows).fill(0);
    if (plan === 'second' || plan === 'both') {
      if (withTicks) ticks[0] = ease.inOutSine(seg(c, ...W.tick1.draw));
      if (plan === 'both' && withTicks) ticks[1] = ease.inOutSine(seg(c, ...W.tick2.draw));
      hl[0] = seg(c, W.hl0[0], W.hl0[1]) * (1 - seg(c, W.hl0[2], W.hl0[3]));
      hl[1] = seg(c, ...W.hl1) * (plan === 'both' ? 1 - seg(c, ...W.hl1off) : 1);
    } else if (plan === 'first') {
      hl[0] = seg(c, W.hl0[0], W.hl0[1]);
    } else if (plan === 'swap') {
      hl[0] = 1;
    }

    // mediator look / mouth
    let look = 0;
    if (plan === 'simultaneous') {
      look = lookF * ease.inOutSine(seg(c, 0.2, 0.26)) + (lookS - lookF) * ease.inOutSine(seg(c, 0.28, 0.34)) - lookS * ease.inOutSine(seg(c, 0.36, 0.44));
    } else if (plan === 'swap') {
      look = lerp(lookF, lookS, ease.inOutSine(seg(c, ...W.swap.look)));
    } else {
      look = lookF * ease.inOutSine(seg(c, ...W.lookF));
      if (plan !== 'first') look = lerp(look, lookS, ease.inOutSine(seg(c, ...W.lookS)));
      if (plan === 'both') look = lerp(look, 0, ease.inOutSine(seg(c, ...W.lookEnd)));
    }
    let medMouth = 0;
    const speakW = plan === 'simultaneous' ? [W.sim.calm[0], W.sim.calm[1] + 0.06] : plan === 'swap' ? W.swap.gesture : W.gesture;
    if (plan !== 'first' && c >= speakW[0] && c <= speakW[1]) medMouth = 0.35 * Math.sin(Math.PI * seg(c, ...speakW));

    // open palms while gesturing (end of a turn / calming simultaneous speech)
    let openF = 0, openS = 0;
    if (plan === 'second' || plan === 'both') openF = seg(c, W.gesture[0] + 0.01, W.gesture[0] + 0.03) * (1 - seg(c, W.m2.reach[0], W.m2.reach[0] + 0.02));
    if (plan === 'swap') openF = seg(c, 0.01, 0.03) * (1 - seg(c, W.swap.reach[0], W.swap.reach[0] + 0.02));
    if (plan === 'simultaneous') {
      openF = seg(c, W.sim.calm[0] + 0.01, W.sim.calm[0] + 0.03) * (1 - seg(c, W.sim.calmDown[0] + 0.06, W.sim.calmDown[0] + 0.08));
      openS = seg(c, W.sim.calm[0] + 0.03, W.sim.calm[0] + 0.05) * (1 - seg(c, W.sim.calmDown[0] + 0.06, W.sim.calmDown[0] + 0.08));
    }
    const open = {[hF]: openF, [hS]: openS};
    return {
      med: {left: hF === 'l' ? handF : handS, right: hF === 'r' ? handF : handS, look, tilt: look * 4, mouth: medMouth, open},
      token: tok,
      tokenHold: hold || (pa.onToken ? 'a' : pb.onToken ? 'b' : null),
      a: pa, b: pb,
      bubbles: bub,
      ticks, hl, tickTarget,
    };
  };
}
