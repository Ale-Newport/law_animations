/**
 * "Objeción procesal" kit (LAW-0297..0300, hearings-05): the generic, fictional
 * hearing room of ./interrogatorio-directo.js (witness box with its turn tray,
 * questioner beside the counter, turn rail along the top wall), imported
 * READ-ONLY, with this motif's own content and choreography.
 *
 * The concrete action — "a signal pauses a question and opens an editable
 * reason card": the questioner sets a question on the tray; as its slip slides
 * up the guide, a seated participant raises a SIGNAL paddle and the question
 * PAUSES part-way (a neutral pause mark beside it); an editable REASON card
 * (● intervention raised, as supplied) leaves the paddle, travels to the rail
 * and opens; then another seated participant — the responding body, generic,
 * seated at the same table on the same kind of chair — supplies a RESPONSE card
 * (◆ response as supplied, illustrative) that travels to the rail and opens.
 * The question stays paused: nothing follows from the response.
 *
 * ● intervention raised and ◆ response supplied are supplied states of equal
 * weight. No grounds, rule or category of objection is shown (only the author's
 * editable text, as supplied), no ruling outcome (no sustained / overruled /
 * granted / denied / admitted / excluded state), no winner and no hierarchy.
 * @module animations/hearings/kits/objecion-procesal
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {stateGlyph, toWorld, reachRecords} from './hearings-art.js';
import {itStageAt, itRowNode, itObstacles, SLIP} from './interrogatorio-directo.js';
import {PERSON} from '../../courts/kits/courts-art.js';
import {textAt} from './apertura-audiencia.js';

const INK = '#1f2328';

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const opFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one asks, one answers from the witness box, one raises the intervention and one supplies the response; the last two sit at the same shared table on the same chairs. No rank, role rules, hierarchy or speaking order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 4, 4),
  questioner: int('Index in `speakers` of the participant who puts the question (generic)', 0, 3),
  witness: int('Index in `speakers` of the participant in the witness box (generic)', 0, 3),
  raiser: int('Index in `speakers` of the participant who raises the signal and the intervention (generic)', 0, 3),
  responder: int('Index in `speakers` of the participant who supplies the response (a generic responding body; no hierarchy)', 0, 3),
  statements: list('Cards: the question that is paused, the intervention raised (its reason, editable, as supplied) and the response supplied (editable, as supplied). Nothing is ruled or assessed', obj('Card', {
    kind: oneOf('question, intervention (●, the reason card) or response (◆, the response card) — supplied states only', ['question', 'intervention', 'response']),
    text: str('Text of the card (fictional, as supplied)', 60),
    exhibit: int('Optional: index in `exhibits` the card refers to (as supplied)', 0, 1),
  }, ['kind', 'text']), 2, 3),
  exhibits: list('Exhibits on the low cabinet by the wall, each with its supplied tag', str('Exhibit tag (fictional)', 50), 0, 2),
  sequence: list('Order of the cards along the rail (indices in `statements`): a sequence as configured (illustrative), not a rule', int('Index in `statements`', 0, 2), 1, 3),
  states: obj('Captions of the two supplied states', {
    intervention: str('Caption of ● (intervention raised, as supplied)', 50),
    response: str('Caption of ◆ (response supplied, as supplied)', 50),
  }, ['intervention', 'response']),
  labels: obj('Editable captions', {
    paused: str('Caption of the pause mark, shown with the supplied question (the question waits; nothing follows from it)', 60),
    signal: str('Caption of the signal paddle', 50),
    sequence: str('Caption of the order of the cards (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['paused', 'signal', 'sequence', 'key']),
};

export const OP_EN = {
  hearing: {room: 'Hearing room 5 (fictional)'},
  speakers: [{label: 'Questioner (fictional)'}, {label: 'Witness (fictional)'}, {label: 'Participant C'}, {label: 'Participant D'}],
  questioner: 0,
  witness: 1,
  raiser: 2,
  responder: 3,
  statements: [
    {kind: 'question', text: 'Did you speak to the driver?'},
    {kind: 'intervention', text: 'Reason card: text as supplied', exhibit: 0},
    {kind: 'response', text: 'Response card: text as supplied'},
  ],
  exhibits: ['Exhibit 1: call log'],
  sequence: [1, 2, 0],
  states: {intervention: 'Intervention raised (as supplied)', response: 'Response as supplied (illustrative)'},
  labels: {paused: 'Question paused (as supplied)', signal: 'Signal raised (as supplied)', sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const OP_ES = {
  hearing: {room: 'Sala de audiencias 5 (ficticia)'},
  speakers: [{label: 'Persona que pregunta (ficticia)'}, {label: 'Testigo (ficticio)'}, {label: 'Participante C'}, {label: 'Participante D'}],
  questioner: 0,
  witness: 1,
  raiser: 2,
  responder: 3,
  statements: [
    {kind: 'question', text: '¿Habló usted con el conductor?'},
    {kind: 'intervention', text: 'Tarjeta de motivo: texto según lo aportado', exhibit: 0},
    {kind: 'response', text: 'Tarjeta de respuesta: texto según lo aportado'},
  ],
  exhibits: ['Prueba 1: registro de llamadas'],
  sequence: [1, 2, 0],
  states: {intervention: 'Intervención planteada (según lo aportado)', response: 'Respuesta según lo aportado (ilustrativa)'},
  labels: {paused: 'Pregunta en pausa (según lo aportado)', signal: 'Señal levantada (según lo aportado)', sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];

/**
 * Resolved params in the shape of the hearings-03 room kit: the question (slip with the questioner, neutral "?"), the
 * intervention (● reason card) and the response (◆ response card). The raiser and the responder sit at the shared
 * table (two seats at its ends).
 * @param {any} ctx
 * @param {any} P localised params
 */
export function resolveOp(ctx, P) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  // four distinct roles (fall back to the first free index when the supplied ones collide)
  const used = [];
  const take = (want, dflt) => { let v = want < n && !used.includes(want) ? want : dflt; while (used.includes(v)) v = (v + 1) % n; used.push(v); return v; };
  const questioner = take(P.questioner ?? 0, 0);
  const witness = take(P.witness ?? 1, 1);
  const raiser = take(P.raiser ?? 2, 2);
  const responder = take(P.responder ?? 3, 3);
  const listeners = [raiser, responder].filter(i => i < n);
  const exhibits = (P.exhibits || []).slice(0, 2);
  const items = (P.statements || []).map((s, i) => {
    const kind = s.kind === 'intervention' ? 'intervention' : s.kind === 'response' ? 'response' : 'question';
    const ex = exhibits.length && s.exhibit !== undefined && s.exhibit !== null ? Math.min(exhibits.length - 1, s.exhibit) : null;
    // (room kit: the cue follows the form — open ●, bounded ◆, plain "?"; a question's slip lies with the questioner)
    return {i, op: kind, kind: kind === 'question' ? 'question' : 'answer', text: s.text, form: kind === 'intervention' ? 'open' : kind === 'response' ? 'bounded' : 'plain', exhibit: ex, by: kind === 'question' ? questioner : kind === 'intervention' ? raiser : responder};
  });
  const order = [];
  for (const q of P.sequence || []) if (q < items.length && !order.includes(q)) order.push(q);
  for (let i = 0; i < items.length; i++) if (!order.includes(i)) order.push(i);
  const rank = items.map(it => order.indexOf(it.i));
  const find = k => { const it = items.find(q => q.op === k); return it ? it.i : null; };
  return {n, speakers, questioner, witness, raiser, responder, listeners, items, order, rank, exhibits, qI: find('question'), intI: find('intervention'), resI: find('response')};
}

/** Legend rows: ● / ◆ (equal weight), the signal and the pause mark with the supplied question. */
export function opRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  if (R.intI !== null) rows.push({kind: 'legend', glyphKind: 'started', text: P.states.intervention, name: `${prefix}-intervention`});
  // (no ◆ row when the supplied final state shows no response card)
  if (R.resI !== null && !o.noResponse) rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.response, name: `${prefix}-response`});
  if (R.intI !== null) rows.push({kind: 'legend', glyphKind: 'signal', text: P.labels.signal, name: `${prefix}-signal`});
  // (the question's card never opens: its supplied text is drawn here, with the pause mark's own glyph)
  if (R.qI !== null) rows.push({kind: 'legend', glyphKind: 'pause', text: o.quote === false ? P.labels.paused : `${P.labels.paused}: “${R.items[R.qI].text}”`, name: `${prefix}-paused`});
  return rows;
}

/** The signal paddle (a round sign on a short handle, the ● cue on it) and the pause mark (two short bars). */
export function opProps(ctx, P0) {
  const paddle = g({name: `${P0}-signal`, opacity: 0, transform: 'translate(0 0)'},
    h('path', {d: 'M0 0V22', stroke: '#8a6a3f', 'stroke-width': 6, 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: -14, r: 17, fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
    stateGlyph(ctx, {name: `${P0}-signal-g`, kind: 'dot', cx: 0, cy: -14, s: 7.5}));
  const pause = g({name: `${P0}-pause`, opacity: 0, transform: 'translate(0 0)'},
    h('circle', {cx: 0, cy: 0, r: 15, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: 'M-4.5 -7V7M4.5 -7V7', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  return {node: g(null, paddle, pause), paddle, pause};
}

/** Panel glyphs of this motif (signal paddle, pause mark), else the room kit's rows. */
export function opRowNode(ctx, m, o = {}) {
  if (m.kind === 'legend' && (m.glyphKind === 'signal' || m.glyphKind === 'pause')) {
    const th = ctx.theme;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    const s = m.glyph / 44;
    const glyph = m.glyphKind === 'signal'
      ? g({transform: `${T(gx, gy + 4 * s)} scale(${r(s * 0.85, 3)})`},
        h('path', {d: 'M0 0V22', stroke: '#8a6a3f', 'stroke-width': 6, 'stroke-linecap': 'round'}),
        h('circle', {cx: 0, cy: -14, r: 17, fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
        stateGlyph(ctx, {kind: 'dot', cx: 0, cy: -14, s: 7.5, fill: th.dark ? th.fg : INK}))
      : g({transform: `${T(gx, gy)} scale(${r(s * 1.1, 3)})`},
        h('circle', {cx: 0, cy: 0, r: 15, fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
        h('path', {d: 'M-4.5 -7V7M4.5 -7V7', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round'}));
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return itRowNode(ctx, m, o);
}

/**
 * The route each supplied card takes (design units; computed once at layout, so seeking is exact): from where it starts,
 * onto the table's centre line, along it to a clear column, up the column to the floor lane under the rail, along the
 * lane and up into its place. The column is the nearest one (to the slot) that keeps the card clear of the equipment,
 * the people (the giver's own head and shoulders included) and the given label boxes `avoid` (design units).
 * @param {any} G
 * @param {any} R resolveOp()
 * @param {{x:number,y:number,w:number,h:number}[]} [avoid]
 * @param {{yms?:number[], cols?:number[]}} [hints] heights and columns tried first (e.g. from opCorridors)
 */
export function opPaths(G, R, avoid = [], hints = {}) {
  const lane = G.yF + 12 + SLIP.h / 2;
  const px = SLIP.w / 2 + 6, py = SLIP.h / 2 + 6;
  const boxes = [...itObstacles(G).slice(1), ...avoid];
  const people = R.speakers.map(sp => ({i: sp.index, ...(sp.index === R.questioner ? G.qHome : G.seats[sp.index])}));
  // every leg is horizontal or vertical: a leg is tested exactly against each inflated box (open intervals) and each
  // person's circle; the count is the number of obstacles a route touches (memoised per leg)
  const memo = new Map();
  const legHits = (a, b, mover, from, last) => {
    let x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    // (the last leg rises into the slot through the rail's own edge: only its part below the lane counts)
    if (last) { y0 = Math.max(y0, lane + 1); if (y0 > y1) return 0; }
    const key = `${r(x0, 2)},${r(y0, 2)},${r(x1, 2)},${r(y1, 2)},${mover}`;
    if (memo.has(key)) return memo.get(key);
    let n = 0;
    for (const bx of boxes) if (x1 > bx.x - px && x0 < bx.x + bx.w + px && y1 > bx.y - py && y0 < bx.y + bx.h + py) n++;
    for (const pp of people) {
      const d = Math.hypot(pp.x - clamp(pp.x, x0, x1), pp.y - clamp(pp.y, y0, y1));
      // (the giver's own figure: the card leaves from the hand in front, so only its head and shoulders count)
      if (d < (pp.i !== mover ? PERSON.half : PERSON.half * 0.6) + Math.max(px, py)) n++;
    }
    memo.set(key, n);
    return n;
  };
  // (`cap`: stop counting once a route is no better than the best so far)
  const hits = (pts, mover, cap = Infinity) => {
    let n = 0;
    for (let k = 1; k < pts.length && n < cap; k++) n += legHits(pts[k - 1], pts[k], mover, pts[0], k === pts.length - 1);
    return n;
  };
  // families of routes, tried in order (the first: along the table's centre line and the lane right under the rail);
  // within a family the column nearest the slot first
  const route = (i, from, mover) => {
    const slot = G.slots[i];
    const to = {x: slot.cx, y: slot.bottom - SLIP.h / 2};
    const cy = G.C ? G.C.y : from.y;
    const cols = [...(hints.cols || []), slot.cx, from.x];
    for (let d = 8; d <= G.W; d += 8) cols.push(slot.cx - d, slot.cx + d);
    const Bt = G.B || 0;
    const yms = [cy, from.y, from.y - 30, from.y - 60, cy - Bt - 30, cy - Bt - 70, cy - Bt - 110, cy + Bt + 40, cy + Bt + 80, ...(hints.yms || [])];
    const lanes = [lane, lane - 6, lane + 30, lane + 60, lane + 90];
    let best = null;
    search: for (const ln of lanes) for (const ym of yms) {
      if (ym < ln) continue;
      for (const col of cols) {
        if (col < 20 || col > G.W - 20) continue;
        const pts = [from, {x: from.x, y: ym}, {x: col, y: ym}, {x: col, y: ln}, {x: slot.cx, y: ln}, to];
        const n = hits(pts, mover, best ? best.n : Infinity);
        if (!best || n < best.n) best = {n, pts, col};
        if (n === 0) break search;
      }
    }
    return {pts: best.pts, clear: best.n === 0};
  };
  const out = {};
  if (R.intI !== null) { const sp = G.seats[R.raiser]; out[R.intI] = route(R.intI, toWorld({x: sp.x, y: sp.y, deg: sp.deg, seated: 1}, {x: 30, y: -80}), R.raiser); }
  if (R.resI !== null) { const sp = G.seats[R.responder]; out[R.resI] = route(R.resI, toWorld({x: sp.x, y: sp.y, deg: sp.deg, seated: 1}, {x: 26, y: -70}), R.responder); }
  return out;
}

/**
 * Floor kept free for the supplied cards' routes (design units), for a layout that places captions, labels or badges
 * itself (the mechanism): it passes `boxes` to its placement as obstacles and `hints` to opTiming, so opPaths finds the
 * reserved route.
 *  - mode 'up' (default): from each giver's hand straight up to the lane under the rail, then along it to the place;
 *  - mode 'route': the route opPaths takes with only people and equipment in the way;
 *  - mode 'wall': from the hand up to just above the seated heads, across to the nearer side wall, up along the wall
 *    and along the lane to the place (the floor in the middle stays free for labels).
 * @param {any} G
 * @param {any} R resolveOp()
 * @param {{mode?:'up'|'route'|'wall'}} [o]
 */
export function opCorridors(G, R, o = {}) {
  const lane = G.yF + 12 + SLIP.h / 2;
  const hx = SLIP.w / 2 + 8, hy = SLIP.h / 2 + 8;
  const boxes = [];
  const givers = [[R.intI, R.raiser, {x: 30, y: -80}], [R.resI, R.responder, {x: 26, y: -70}]].filter(([i, who]) => i !== null && G.seats[who]);
  const froms = givers.map(([, who, off]) => { const sp = G.seats[who]; return toWorld({x: sp.x, y: sp.y, deg: sp.deg, seated: 1}, off); });
  const hseg = (x0, x1, y) => boxes.push({x: Math.min(x0, x1) - hx, y: y - hy, w: Math.abs(x1 - x0) + 2 * hx, h: 2 * hy});
  const vseg = (x, y0, y1) => boxes.push({x: x - hx, y: Math.min(y0, y1) - hy, w: 2 * hx, h: Math.abs(y1 - y0) + 2 * hy});
  if (o.mode === 'route' && givers.length) {
    // the route the planner takes when only people and equipment are in the way, reserved leg by leg
    const paths = opPaths(G, R, []);
    const yms = [], cols = [];
    for (const [i] of givers) {
      const q = paths[i];
      if (!q) continue;
      const pts = q.pts;
      for (let k = 1; k < pts.length - 1; k++) {
        const a = pts[k - 1], b = pts[k];
        if (Math.abs(a.x - b.x) < 0.01) vseg(a.x, a.y, b.y); else hseg(a.x, b.x, a.y);
      }
      yms.push(pts[1].y); cols.push(pts[2].x);
    }
    return {boxes, hints: {yms, cols}};
  }
  if (o.mode === 'wall' && givers.length) {
    const seated = R.listeners.map(i => G.seats[i]).filter(Boolean);
    const top = Math.min(...seated.map(q => q.y - PERSON.half), G.C ? G.C.y - G.B : Infinity, ...froms.map(f => f.y));
    const ym = top - hy - 4;
    const gx = seated.reduce((acc, q) => acc + q.x, 0) / Math.max(1, seated.length);
    const col = gx < G.W / 2 ? hx + 4 : G.W - hx - 4;
    givers.forEach(([i], j) => { const f = froms[j]; vseg(f.x, f.y, ym); hseg(f.x, col, ym); });
    vseg(col, ym, lane);
    for (const [i] of givers) hseg(col, G.slots[i].cx, lane);
    return {boxes, hints: {yms: [ym], cols: [col]}};
  }
  givers.forEach(([i], j) => { const f = froms[j]; vseg(f.x, f.y, lane); hseg(f.x, G.slots[i].cx, lane); });
  return {boxes, hints: {yms: [], cols: froms.map(f => f.x)}};
}

/**
 * Timing (u) of the motif's choreography inside [t0, t1]: the question (hands, from the room kit's schedule) with its
 * pause, the signal, the reason card and the response card.
 * @param {any} G
 * @param {any} R resolveOp()
 * @param {any} S itSchedule() of the question alone
 * @param {number} t1 end of the action
 * @param {{noResponse?:boolean, avoid?:any[], cardsFrom?:number, hints?:any}} [o]
 */
export function opTiming(G, R, S, t1, o = {}) {
  const q = R.qI !== null ? S.items[R.qI] : null;
  // the question's slip pauses 40 % of the way up the guide; the signal is up just before
  const pauseU = q ? lerp(q.slide[0], q.slide[1], 0.4) : S.t0;
  const sig = [pauseU - 0.035, pauseU - 0.005];
  // (`cardsFrom`: the cards may wait for a later moment, e.g. a tracer reaching the participants)
  const a = Math.max(pauseU + 0.02, o.cardsFrom || 0);
  const rest = Math.max(0.12, t1 - a);
  const respond = R.resI !== null && !o.noResponse;
  const span = respond ? rest / 2 : rest;
  const int = R.intI !== null ? {travel: [a, a + span * 0.5], open: [a + span * 0.5, a + span * 0.7], text: [a + span * 0.7, a + span * 0.85]} : null;
  const b = a + span;
  const res = respond ? {reach: [b, b + span * 0.15], travel: [b + span * 0.1, b + span * 0.55], open: [b + span * 0.55, b + span * 0.75], text: [b + span * 0.75, b + span * 0.9]} : null;
  return {pauseU, sig, sigDown: int ? [int.open[0], int.open[0] + 0.03] : [t1, t1 + 0.03], int, res, paths: opPaths(G, R, o.avoid || [], o.hints || {})};
}

/**
 * The stage at u: the room kit's question choreography (hands) with the pause, the raiser's signal, and the reason and
 * response cards travelling to their places on the rail and opening.
 * @param {any} G
 * @param {any} R resolveOp()
 * @param {any} S itSchedule() of the question alone (R with order [qI])
 * @param {any} TM opTiming()
 * @param {number} u
 * @param {{noHands?:boolean, waitFrom?:number}} [o]
 */
export function opStageAt(G, R, S, TM, u, o = {}) {
  const e = ease.inOutCubic;
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const Rq = {...R, order: R.qI !== null ? [R.qI] : []};
  const st = itStageAt(G, Rq, S, u, {noHands: o.noHands});
  const slips = [], cards = [], states = [];
  // the question: its slip freezes 40 % of the way up the guide once the signal is up; its card never opens
  let paused = 0;
  if (R.qI !== null) {
    const i = R.qI;
    const sl = st.slips[i];
    // (itStageAt would open the question's card after the slide; here it never opens, the slip simply stays put)
    if (u >= TM.pauseU) {
      const yP = lerp(G.tray.cy, G.slots[i].bottom - SLIP.h / 2, e(0.4));
      slips[i] = {x: G.tray.cx, y: yP, deg: 0, opacity: 1};
      states[i] = 'paused';
      paused = 1;
    } else { slips[i] = sl; states[i] = st.states[i]; }
    cards[i] = {open: 0, text: 0, shown: 0, dx: 0};
  }
  const seatOf = i => G.seats[i];
  // the raiser lifts the signal paddle (right hand up in front) and lowers it once the reason card opens
  const rSeat = seatOf(R.raiser);
  const rPose = {x: rSeat.x, y: rSeat.y, deg: rSeat.deg, seated: 1};
  const upT = toWorld(rPose, {x: 30, y: -66});
  const sigK = R.intI !== null ? e(pos(u, ...TM.sig)) * (1 - e(pos(u, ...TM.sigDown))) : 0;
  const reachRaiser = sigK > 0 ? {target: upT, k: sigK} : null;
  const hand = reachRaiser ? reachRecords({name: '_'}, rPose, upT, {k: sigK}).hand : null;
  // a card travels from where it starts, straight to the floor in front of the rail, along it and up into its place
  const travel = (i, q) => {
    const pts = TM.paths[i].pts;
    const L = pts.slice(1).reduce((acc, p, k) => acc + Math.hypot(p.x - pts[k].x, p.y - pts[k].y), 0);
    let d = q * L;
    for (let k = 1; k < pts.length; k++) {
      const seg = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
      if (d <= seg || k === pts.length - 1) { const t = seg ? clamp(d / seg) : 1; return {x: lerp(pts[k - 1].x, pts[k].x, t), y: lerp(pts[k - 1].y, pts[k].y, t), deg: 0, opacity: 1}; }
      d -= seg;
    }
    return {...pts[pts.length - 1], deg: 0, opacity: 1};
  };
  // the reason card: from the paddle (as it opens), to its place on the rail
  if (R.intI !== null) {
    const i = R.intI;
    const tm = TM.int;
    const q = e(pos(u, ...tm.travel));
    const open = e(pos(u, ...tm.open)), text = pos(u, ...tm.text);
    if (u < tm.travel[0]) { slips[i] = null; states[i] = 'none'; } else if (open <= 0) { slips[i] = travel(i, q); states[i] = q < 1 ? 'travelling' : 'placed'; } else { slips[i] = null; states[i] = open < 1 ? 'unfolding' : 'open'; }
    cards[i] = {open, text, shown: open > 0 ? 1 : 0, dx: 0};
  }
  // the response card: the responder reaches forward, the card travels from that hand to its place on the rail
  let reachResponder = null;
  if (R.resI !== null) {
    const i = R.resI;
    const tm = TM.res;
    if (!tm) { slips[i] = null; states[i] = 'none'; cards[i] = {open: 0, text: 0, shown: 0, dx: 0}; } else {
      const sp = seatOf(R.responder);
      const pPose = {x: sp.x, y: sp.y, deg: sp.deg, seated: 1};
      const fT = toWorld(pPose, {x: 26, y: -70});
      const kR = e(pos(u, ...tm.reach)) * (1 - e(pos(u, tm.travel[0] + 0.02, tm.travel[0] + 0.05)));
      if (kR > 0) reachResponder = {target: fT, k: kR};
      const q = e(pos(u, ...tm.travel));
      const open = e(pos(u, ...tm.open)), text = pos(u, ...tm.text);
      // (`waitFrom`, contrast: the response slip lies in front of the responder from that moment until it travels)
      if (u < tm.travel[0]) { const w = o.waitFrom !== undefined && u >= o.waitFrom; slips[i] = w ? travel(i, 0) : null; states[i] = w ? 'waiting' : 'none'; } else if (open <= 0) { slips[i] = travel(i, q); states[i] = q < 1 ? 'travelling' : 'placed'; } else { slips[i] = null; states[i] = open < 1 ? 'unfolding' : 'open'; }
      cards[i] = {open, text, shown: open > 0 ? 1 : 0, dx: 0};
    }
  }
  return {...st, slips, cards, states, paused, sigK, signalAt: hand, reachRaiser, reachResponder, rPose};
}

/** Extra frame records for the motif: the raiser's and the responder's reaches, the paddle and the pause mark. */
export function opFrame(G, R, stg, P0) {
  const nodes = {};
  let reached = true;
  const put = (i, rc) => {
    if (!rc) return;
    const s = G.seats[i];
    const pose = {x: s.x, y: s.y, deg: s.deg, seated: 1};
    const rr = reachRecords({name: `${P0}-p${i}`}, pose, rc.target, {k: rc.k});
    Object.assign(nodes, rr.nodes);
    if (!rr.reached && rc.k > 0) reached = false;
    return rr.hand;
  };
  const hand = put(R.raiser, stg.reachRaiser);
  put(R.responder, stg.reachResponder);
  nodes[`${P0}-signal`] = hand && stg.sigK > 0.02 ? {opacity: r(Math.min(1, stg.sigK * 3), 3), transform: T(hand.x, hand.y, G.seats[R.raiser].deg)} : {opacity: 0, transform: 'translate(0 0)'};
  if (R.qI !== null) {
    const yP = lerp(G.tray.cy, G.slots[R.qI].bottom - SLIP.h / 2, ease.inOutCubic(0.4));
    // (on the guide just above the paused slip: clear of the questioner and of the witness box)
    nodes[`${P0}-pause`] = {opacity: r(stg.paused, 3), transform: T(G.tray.cx, Math.max(G.yF + 2, yP - SLIP.h / 2 - 19))};
  }
  return {nodes, reached};
}
