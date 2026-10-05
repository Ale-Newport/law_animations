/**
 * LAW-0198 — Reunión de equipo jurídico · mechanism
 *
 * Storyboard (a map of the operation, not a row of boxes: the case-file board
 * with its three task cards on top, the three team members as portrait
 * badges under their lanes, the case file feeding the board from the side,
 * person a's question as a speech bubble between the badges):
 *  0.00–0.18  separate: the badges slide down out of the board, the case file
 *             slides out to its side; every card slot is dashed and empty.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to element edges and styled by kind: a person → task
 *             relation is a plain line with end dots (never an arrow) from the
 *             badge rim to the card's assignee ring; the case file → board
 *             sequence is an arrow. Each label sits beside its own connector.
 *  0.43–0.75  trace: a small name magnet (the tracer, with the person's face)
 *             follows the supplied traversalOrder along the connectors; when it
 *             reaches a card it stays in that card's slot and the person's name
 *             appears on the card; the focus element enlarges as it passes.
 *  0.75–1.00  gather: everything stays visible — origin (case file), the links,
 *             the filled and the empty slots — with the neutral key.
 * No duty, deadline or consequence of an unassigned task is stated.
 * @module animations/roles/LAW-0198
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {kindColor} from '../../frameworks/graph.js';
import {polyline} from '../../core/geometry.js';
import {
  KIT_STRINGS, TEAM_DEFAULTS, TASKS_EN, rolesField, looksOf, roleOf, measureCards, taskCard, slotCentreLocal,
  corkBoard, titlePlate, magnetArt, speechBubble, fitClean, wchip, keyChip, overlaps,
} from './kits/reunion-de-equipo.js';

const ID = 'LAW-0198';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.42], trace: [0.45, 0.72]};
const EL = ['file', 'board', 'a', 'b', 'c', 't1', 't2', 't3'];
const PEOPLE = ['a', 'b', 'c'];
const TASKS = ['t1', 't2', 't3'];
/** The tracer magnet is a smaller copy of the name magnet, so labels can sit close beside the connectors. */
const TRACER_K = 0.5;

const STRINGS = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const relationship = obj('A supplied relationship between two components', {
  from: oneOf('Source component', EL),
  to: oneOf('Target component', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 60),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  actors: list('The three fictional team members (a, b, c)', party, 3, 3),
  roles: rolesField,
  props: obj('Supplied content', {
    tasks: list('Task labels on the three cards (t1, t2, t3; fictional, neutral)', str('Task label', 90), 3, 3),
    openSlot: str('Text shown in an empty assignee slot', 40),
    speech: str('What person a asks (speech bubble beside their badge)', 90),
  }, ['tasks', 'openSlot', 'speech']),
  elements: list('Component labels; ids are fixed by the scene, labels are editable (file = the case file, board = the task board title)', obj('Component', {id: oneOf('Component id', ['file', 'board']), label: str('Visible label', 80)}, ['id', 'label']), 2, 2),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied). A person → task relation is drawn from the badge to that card’s assignee slot', relationship, 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind (on connectors without their own label)', {
    relation: str('Caption for plain relations', 40), communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40), causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits the components', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  actors: TEAM_DEFAULTS.actors,
  roles: TEAM_DEFAULTS.roles,
  props: {tasks: TASKS_EN, openSlot: 'No assignee', speech: 'Who takes which task?'},
  elements: [{id: 'file', label: 'Case file 24-017 (fictional)'}, {id: 'board', label: 'Task board (fictional)'}],
  relationships: [
    {from: 'file', to: 'board', kind: 'sequence', label: 'tasks listed from the file'},
    {from: 'a', to: 't1', kind: 'relation', label: ''},
    {from: 'b', to: 't2', kind: 'relation', label: ''},
    {from: 'c', to: 't3', kind: 'relation', label: ''},
  ],
  focusElement: 'b',
  relationLabels: {relation: 'name magnet on the card', communication: 'asks', sequence: 'listed from', causal: 'causes (as supplied)'},
  traversalOrder: ['file', 'board', 'a', 't1', 'b', 't2', 'c', 't3'],
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label || '';

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 950], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const DW = ctx.design.w, DH = ctx.design.h;
    const upx = unitPx(ctx);
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    const looks = looksOf(ctx, p.actors);
    const fileSide = shape === 'landscape' ? 'left' : 'top';
    // lanes: person i ↔ the task linked to them (by a supplied relation), unlinked tasks fill the rest
    const laneTask = {};
    const used = new Set();
    for (const rel of p.relationships) {
      if (PEOPLE.includes(rel.from) && TASKS.includes(rel.to) && !laneTask[rel.from] && !used.has(rel.to)) { laneTask[rel.from] = rel.to; used.add(rel.to); }
    }
    const free = TASKS.filter(t => !used.has(t));
    for (const id of PEOPLE) if (!laneTask[id]) laneTask[id] = free.shift();
    let best = null;
    // Person badges keep at least RB_FLOOR (the baseline size class of the ratio): long text first steps down
    // to 16 px; only if nothing fits even then do the badges shrink further.
    const RB_FLOOR = {landscape: 104, portrait: 64, square: 44}[shape];
    const passes = [{F: 22, min: 19.6}, {F: 20, min: 16}, {F: 17, min: 16}];
    // bubble placement: in the link band above the badges (tall frames), or between badges a and b
    const bandModes = shape === 'portrait' ? [true] : [false];
    const run = floor => {
      for (const px of passes) {
        const F = px.F / upx, minF = px.min / upx;
        for (let Rb = 150; Rb >= floor; Rb -= 4) {
          for (const band of bandModes) {
            const L = tryLayout(F, minF, Rb, band);
            if (L.fits) return L;
            if (!best || L.over < best.over) best = L;
          }
        }
      }
      return null;
    };
    best = run(RB_FLOOR) || run(26) || best;
    best.conns = makeConns(ctx, best, p);
    best.route = buildRoute(best, p);
    const keyAt = L0 => (L0.fileSide === 'top' ? {x: L0.board.x + L0.board.w, y: L0.y0 + 10, anchor: 'end'} : {x: DW / 2, y: L0.y0 + L0.H - 10 - L0.keyH + 4, anchor: 'middle'});
    best.keyAt = keyAt(best);
    const kc = showKey ? keyChip(ctx, ctx.t.key, {...best.keyAt, maxWidth: 700, size: Math.max(best.minF, Math.min(best.F * 0.92, best.cardM.size)), minSize: best.minF, maxLines: 2, name: 'key'}) : null;
    best.keyBox = kc && kc.box;
    return best;

    function tryLayout(F, minF, Rb, bubBand) {
      let bad = false;
      const k = Rb / 64;                             // badge radius ↔ magnet scale
      const R = 30 * k;                              // magnet radius (as on the stage)
      // tracer radius: half a magnet; with the tall-frame large badges it stays small so labels hug their links
      const trR = bubBand ? Math.min(R * TRACER_K, 22) : R * TRACER_K;
      // --- file element (a case-file sheet with its label)
      const fileFit = showAll ? fitClean(labelOf(p, 'file'), {maxWidth: 260, size: F, minSize: minF, maxLines: 3, weight: 700}) : null;
      const fileW = Math.max(150, (fileFit ? fileFit.width : 120) + F * 1.4);
      const fileH = (fileFit ? fileFit.height : F * 2) + F * 1.4 + 34;
      // --- board columns
      const relText0 = rel => rel.label || p.relationLabels[rel.kind] || rel.kind;
      const seqI = p.relationships.findIndex(rel => (rel.from === 'file' && rel.to === 'board') || (rel.from === 'board' && rel.to === 'file'));
      const seqFit = seqI >= 0 && showAll ? fitClean(relText0(p.relationships[seqI]), {maxWidth: 250, size: Math.max(F * 0.92, minF), minSize: minF, maxLines: 4, weight: 600}) : null;
      bad = bad || Boolean(seqFit && seqFit.bad);
      const arrowLen = fileSide === 'left' ? Math.max(110, seqFit ? seqFit.width + F * 1.1 + 36 : 0) : Math.max(72, seqFit ? seqFit.height + F * 0.8 + 22 : 0);
      const leftCol = fileSide === 'left' ? fileW + arrowLen + 10 : 0;
      const boardW = DW - leftCol - 20;
      const colW = Math.min(520, (boardW - 56) / 3);
      const CW = colW - 22;
      const rowTexts = PEOPLE.map((id, i) => p.actors[i].name);
      const labels = PEOPLE.map(id => p.props.tasks[TASKS.indexOf(laneTask[id])]);
      const cardM = measureCards(ctx, labels, {w: CW, F, minF, R, rowTexts, openText: p.props.openSlot, show: showAll, slotOff: 0, maxLines: 5, bottom: 10, keepSize: true});
      bad = bad || cardM.bad;
      const titleFit = showAll ? fitClean(labelOf(p, 'board'), {maxWidth: Math.min(boardW - 80, 700) - F * 2.6, size: F, minSize: minF, maxLines: 2, weight: 700}) : null;
      bad = bad || Boolean(titleFit && titleFit.bad);
      const headerH = titleFit ? titleFit.height + F * 0.9 : F * 1.9;
      const boardH = 25 + headerH + 14 + cardM.h + 24;
      // --- connector labels (beside each connector)
      const labMax = Math.min(colW - 2 * trR - 44, colW / 2 + 16 - (trR + 10));
      const relText = rel => rel.label || p.relationLabels[rel.kind] || rel.kind;
      const labFits = p.relationships.map((rel, i) => (!showAll ? null : i === seqI ? seqFit : fitClean(relText(rel), {maxWidth: labMax - F * 1.1, size: Math.max(F * 0.92, minF), minSize: minF, maxLines: 5, weight: 600})));
      const personLabH = Math.max(0, ...p.relationships.map((rel, i) => (PEOPLE.includes(rel.from) && TASKS.includes(rel.to) && labFits[i] ? labFits[i].height + F * 0.7 : 0)));
      bad = bad || labFits.some(f => f && f.bad);
      let connLen = Math.max(110, personLabH + 36);

      // --- badges + name chips
      const chipFits = showKey ? PEOPLE.map((id, i) => fitClean(`${p.actors[i].name} · ${roleOf(p, id)}`, {maxWidth: colW - 24 - F * 1.2, size: F, minSize: minF, maxLines: 4, weight: 600})) : [];
      bad = bad || chipFits.some(f => f.bad);
      const chipH = chipFits.length ? Math.max(...chipFits.map(f => f.height)) + F * 0.76 : 0;
      // --- speech bubble between badge a and badge b
      // tall frames: the bubble sits in the link band just above the badge row (right of a's link), so it
      // never limits the badge size; otherwise it sits between badges a and b
      const bubW = bubBand ? colW - trR - 30 : colW - 2 * Rb - 30;
      const bubFit = showAll && p.props.speech ? fitClean(p.props.speech, {maxWidth: bubW - F * 1.1, size: F, minSize: minF, maxLines: 7, weight: 600}) : null;
      const bubH = bubFit ? bubFit.height + F * 1.2 : F * 2.6;
      // the bubble stays within the badge row (never over the name chips below)
      bad = bad || Boolean(bubFit && bubFit.bad) || bubW < (showAll ? 110 : 64) || (!bubBand && bubH > 2 * Rb - 10);
      bad = bad || 2.12 * Rb > colW - 12;   // neighbouring badges keep a clear gap, also while one is enlarged (×1.12)
      if (bubBand) connLen = Math.max(connLen, personLabH + 24 + bubH + 28 + Rb * 0.12);
      const keyH = showKey && fileSide === 'left' ? F * 2.1 : 0;   // with the file on top, the key sits beside it
      // --- vertical stack
      const fileRow = fileSide === 'top' ? fileH + arrowLen : 0;
      const badgeRowH = 2 * Rb;
      const H0 = 10 + fileRow + boardH + connLen + badgeRowH + 10 + chipH + 16 + keyH + 10;
      // tall frames: spare height lengthens the person → card links (the map fills the box)
      connLen += Math.max(0, Math.min((DH - H0 - 20) * 0.8, 320));
      const H = 10 + fileRow + boardH + connLen + badgeRowH + 10 + chipH + 16 + keyH + 10;
      const Wt = leftCol + 3 * colW + 56;
      const over = Math.max(0, H - DH) + Math.max(0, Wt - DW);
      const y0 = (DH - Math.min(H, DH)) / 2;
      const bx = (DW - Wt) / 2 + leftCol;
      const board = {x: bx, y: y0 + 10 + fileRow, w: 3 * colW + 56, h: boardH};
      const colX = i => board.x + 28 + colW * (i + 0.5);
      const cards = PEOPLE.map((id, i) => ({x: colX(i) - CW / 2, y: board.y + 25 + headerH + 14, w: CW, h: cardM.h}));
      const slots = cards.map(c => { const sc = slotCentreLocal(cardM, 1); return {x: c.x + sc.x, y: c.y + sc.y}; });
      const badgeY = board.y + boardH + connLen + Rb;
      const badges = PEOPLE.map((id, i) => ({x: slots[i].x, y: badgeY, r: Rb}));
      const ba = badges[0], bb = badges[1];
      const bubBox = bubBand
        ? {x: ba.x + trR + 14, y: badgeY - Rb * 1.12 - 12 - bubH, w: bb.x - ba.x - trR - 28, h: bubH}
        : {x: ba.x + Rb + 15, y: badgeY - bubH / 2, w: bb.x - ba.x - 2 * Rb - 30, h: bubH};
      const bubTip = bubBand ? {x: ba.x + Rb * 0.6, y: badgeY - Rb * 0.86} : {x: ba.x + Rb * 0.92, y: badgeY + Rb * 0.36};
      // in the band mode the person → card labels sit in the upper part of the band, above the bubble
      const labCy = bubBand ? (board.y + boardH + (bubBox.y - 12)) / 2 : null;
      const file = fileSide === 'left'
        ? {x: board.x - arrowLen - fileW, y: board.y + boardH * 0.5 - fileH / 2, w: fileW, h: fileH}
        : {x: board.x + 30, y: y0 + 10, w: fileW, h: fileH};
      const why = [cardM.bad && 'card', titleFit && titleFit.bad && 'title', labFits.some(f => f && f.bad) && 'lab', chipFits.some(f => f.bad) && 'chip', bubFit && bubFit.bad && 'bub', bubW < (showAll ? 110 : 64) && 'bubW', seqFit && seqFit.bad && 'seq'].filter(Boolean);
      return {why, fits: over <= 0.5 && !bad, over: over + (bad ? 1e4 : 0), F, minF, Rb, k, R, CW, colW, cardM, titleFit, headerH, board, cards, slots, badges, file, fileFit, labFits, relText, chipFits, chipH, bubFit, bubW, bubH, trR, bubBox, bubTip, bubBand, labCy, connLen, keyH, fileSide, y0, H, laneTask, looks, upx};
    }
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const showAll = ctx.show('all');
    const nodes = [];
    // board + title + cards
    const board = corkBoard(ctx, {name: 'board-cork', ...L.board});
    const title = titlePlate(ctx, {name: 'board-title', x: L.board.x + 28, y: L.board.y + 25, maxW: (L.titleFit ? L.titleFit.width + L.F * 2.6 : L.F * 9) + 2, text: labelOf(p, 'board'), F: L.titleFit ? L.titleFit.size : L.F, minF: L.titleFit ? L.titleFit.size : L.F, show: showAll});
    const cards = PEOPLE.map((id, i) => g({transform: T(L.cards[i].x, L.cards[i].y)}, taskCard(ctx, {name: `card${i}`, M: L.cardM, fit: L.cardM.fits[i], row: L.cardM.rows[i], side: 1, show: showAll, owner: L.looks[i].outfit})));
    // file sheet
    const f = L.file;
    const fileNode = g({name: 'file'},
      g({name: 'body-file'},
        h('path', {d: `M${r(f.x + 6)} ${r(f.y + 10)}h${r(f.w)}v${r(f.h)}h${r(-f.w)}Z`, fill: th.shadow}),
        h('path', {d: `M${r(f.x)} ${r(f.y + 16)}h${r(f.w * 0.36)}l10 -16h${r(f.w * 0.3)}l10 16h${r(f.w * 0.34 - 20)}v${r(f.h - 16)}h${r(-f.w)}Z`, fill: '#e3c27d', stroke: th.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
        h('rect', {x: r(f.x + 12), y: r(f.y + 26), width: r(f.w - 24), height: r(f.h - 38), rx: 6, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}),
        showAll && L.fileFit ? textBlock(L.fileFit, {x: r(f.x + f.w / 2), y: r(f.y + 26 + (f.h - 38 - L.fileFit.height) / 2), anchor: 'middle', fill: th.ink, name: 'file-text'})
          : [0, 1, 2].map(j => h('rect', {x: r(f.x + 26), y: r(f.y + 44 + j * 20), width: r((f.w - 52) * (j === 2 ? 0.6 : 1)), height: 6, rx: 3, fill: th.paperLine, 'data-bar': 1}))));
    // badges + name chips
    // each badge carries its own name chip (they travel together during the separation)
    const chips = L.chipFits.map((fit, i) => wchip(ctx, fit.full, {x: L.badges[i].x, y: L.badges[i].y + L.badges[i].r + 10, anchor: 'middle', maxWidth: L.colW - 24, size: fit.size, minSize: fit.size, maxLines: 4, fill: '#f7f1e3', name: `name-${i}`}).node);
    const badges = PEOPLE.map((id, i) => {
      const b = L.badges[i];
      const pb = personBadge(ctx, {name: `pb-${id}`, x: 0, y: 0, radius: b.r, look: L.looks[i], ring: L.looks[i].outfit});
      return g({name: `badge-${id}`}, g({name: `body-${id}`, transform: T(b.x, b.y)}, pb.node), chips[i]);
    });
    // speech bubble between badge a and badge b, tail to a's rim
    const bubble = speechBubble(ctx, {name: 'bubble', box: L.bubBox, tip: L.bubTip, fit: L.bubFit, stroke: th.ink, show: showAll});
    // tracer: a small copy of a name magnet (face of the person it belongs to) or a plain dot
    const tracers = PEOPLE.map((id, i) => g({name: `tr-${id}`, opacity: 0}, magnetArt(ctx, {name: `trm-${id}`, look: L.looks[i], R: L.trR})));
    const dot = g({name: 'tracer', opacity: 0}, h('circle', {r: 17, fill: th.accent, opacity: 0.22}), h('circle', {r: 9, fill: th.accent, stroke: th.paper, 'stroke-width': 3}));
    // magnets that stay in the slots once delivered
    const slotMags = PEOPLE.map((id, i) => g({name: `sm-${id}`, opacity: 0, transform: T(L.slots[i].x, L.slots[i].y)}, magnetArt(ctx, {name: `smm-${id}`, look: L.looks[i], R: L.R})));
    const conns = L.conns;
    const key = ctx.show('key') ? keyChip(ctx, ctx.t.key, {...L.keyAt, maxWidth: 700, size: Math.max(L.minF, Math.min(L.F * 0.92, L.cardM.size)), minSize: L.minF, maxLines: 2, name: 'key'}) : null;
    return g(null,
      g({name: 'el-board'}, board.node, title.node, cards),
      fileNode,
      conns.filter(Boolean).map(x => x.c.node),
      badges,
      slotMags,
      conns.filter(x => x && x.lab).map((x, i) => g({name: `rg-lg${p.relationships.indexOf(x.rel)}`, opacity: 0}, x.lab.node)),
      bubble.node,
      tracers, dot,
      key && g({name: 'keyg', opacity: 0}, key.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    // separate: badges slide down out of the board, the file slides out to its side
    const sl = ease.inOutCubic(seg(u, W.slide[0], W.slide[1]));
    PEOPLE.forEach((id, i) => {
      const b = L.badges[i];
      const dy = (1 - sl) * -(L.connLen + b.r * 0.6);
      nodes[`badge-${id}`] = {transform: T(0, dy)};
    });
    const fdx = L.fileSide === 'left' ? (1 - sl) * 90 : 0, fdy = L.fileSide === 'top' ? (1 - sl) * 70 : 0;
    // relate: supplied connectors drawn one by one
    const conns = L.conns;
    const drawn = conns.map(() => 0);
    const valid = conns.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
    valid.forEach((ci, j) => {
      const a = W.relate[0] + ((W.relate[1] - W.relate[0]) * j) / valid.length;
      const b = a + (W.relate[1] - W.relate[0]) / valid.length * 0.9;
      drawn[ci] = r(ease.inOutSine(seg(u, a, b)), 3);
    });
    conns.forEach((x, i) => {
      if (!x) return;
      Object.assign(nodes, x.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (x.lab) nodes[`rg-lg${i}`] = {opacity: r(clamp((drawn[i] - 0.6) / 0.4), 3)};
    });
    // trace along the supplied order
    const route = L.route;
    const tp = seg(u, W.trace[0], W.trace[1]);
    const segs = route.segs;
    const nSeg = Math.max(1, segs.length);
    const visited = [];
    let tracer = null, tracerOwner = null;
    const delivered = new Set();
    segs.forEach((sgm, j) => {
      const a = j / nSeg, b = (j + 1) / nSeg;
      if (tp >= a && route.order[j] && !visited.includes(`${j}`)) visited.push(`${j}`);
      if (tp >= b && sgm.deliver) delivered.add(sgm.deliver);
      if (tp > a && tp < b && sgm.path) {
        const q = ease.inOutSine((tp - a) / (b - a));
        const pt = sgm.path.at(sgm.reverse ? 1 - q : q);
        tracer = {x: pt.x, y: pt.y};
        tracerOwner = sgm.owner;
      }
    });
    const visitOrder = [];
    route.visits.forEach(v => { if (tp > 0 && tp >= v.t - 1e-9) visitOrder.push(v.id); });
    nodes.tracer = {opacity: tracer && !tracerOwner ? 1 : 0, transform: tracer && !tracerOwner ? T(tracer.x, tracer.y) : T(0, 0)};
    PEOPLE.forEach((id, i) => {
      const on = tracer && tracerOwner === id;
      nodes[`tr-${id}`] = {opacity: on ? 1 : 0, transform: on ? T(tracer.x, tracer.y) : T(L.badges[i].x, L.badges[i].y)};
      const del = delivered.has(id);
      nodes[`sm-${id}`] = {opacity: del ? 1 : 0};
      nodes[`card${i}-dash`] = {opacity: del ? 0 : 1};
      nodes[`card${i}-solid`] = {opacity: del ? 1 : 0};
      if (ctx.show('all')) {
        if (L.cardM.open) nodes[`card${i}-open`] = {opacity: del || (tracer && tracerOwner === id && tracer.y < L.slots[i].y + L.connLen * 0.5) ? 0 : 1};
        nodes[`card${i}-owner`] = {opacity: del ? 1 : 0};
      }
    });
    // focus element enlarges while the tracer passes it
    const fv = route.visits.find(v => v.id === p.focusElement);
    const focusK = fv ? 1 + 0.12 * Math.max(0, 1 - Math.abs(tp - fv.t) / 0.08) * (tp > 0 && tp < 1 ? 1 : 0) : 1;
    const fc = centerOf(L, p.focusElement);
    nodes.file = {transform: `${T(fdx, fdy)}${p.focusElement === 'file' ? ' ' + scaleAbout(fc.x, fc.y, focusK) : ''}`};
    PEOPLE.forEach((id, i) => {
      const b = L.badges[i];
      nodes[`body-${id}`] = {transform: `${T(b.x, b.y)}${p.focusElement === id ? ` scale(${r(focusK, 4)})` : ''}`};
    });
    nodes['el-board'] = {transform: ['board', 't1', 't2', 't3'].includes(p.focusElement) ? scaleAbout(fc.x, fc.y, focusK) : ''};
    // speech bubble (a's question) opens once the badges are in place
    const bub = seg(u, 0.14, 0.2);
    Object.assign(nodes, bubbleFrame(bub));
    if (L.keyBox) nodes.keyg = {opacity: r(seg(u, 0.75, 0.8), 3)};
    const drawnOf = x => drawn[conns.indexOf(x)];
    const trR = tracerOwner ? L.trR : 17;
    const gaps = conns.filter(Boolean).map(x => r(x.ends.gap, 1));
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        slide: r(sl, 3),
        relationsDrawn: drawn,
        tracerVisible: Boolean(tracer),
        tracer: tracer ? {x: r(tracer.x), y: r(tracer.y)} : null,
        visitOrder,
        delivered: PEOPLE.filter(id => delivered.has(id)),
        filled: PEOPLE.map(id => (delivered.has(id) ? 1 : 0)),
        connectorGaps: gaps,
        arrows: conns.filter(Boolean).map(x => ({kind: x.rel.kind, arrow: ['communication', 'sequence', 'causal'].includes(x.rel.kind)})),
        causalCount: conns.filter(x => x && x.rel.kind === 'causal').length,
        focus: p.focusElement,
        focusScale: r(focusK, 3),
        bubble: r(bub, 3),
        labelsFit: L.fits,
        headPx: r(L.Rb * 0.6 * 2 * L.upx, 1),
        labelsClear: labelsClear(L),
        tracerOnLabel: Boolean(tracer) && (L.conns || []).some(x => x && x.lab && tracer.x > x.lab.box.x - trR && tracer.x < x.lab.box.x + x.lab.box.w + trR && tracer.y > x.lab.box.y - trR && tracer.y < x.lab.box.y + x.lab.box.h + trR && drawnOf(x) > 0),
        tracerOnFace: Boolean(tracer) && !tracerOwner && L.badges.some(b => Math.hypot(tracer.x - b.x, tracer.y - b.y) < b.r * 0.7),
      },
    };

    function bubbleFrame(o) {
      const s = 0.55 + 0.45 * ease.outCubic(clamp(o));
      const tip = L.bubTip;
      return {bubble: {opacity: o > 0.01 ? Math.min(1, o * 2.5) : 0}, 'bubble-s': {transform: o >= 1 ? '' : `translate(${r(tip.x)} ${r(tip.y)}) scale(${r(s, 4)}) translate(${r(-tip.x)} ${r(-tip.y)})`}};
    }
  },
};


/** Connectors and their labels (pure; built once per layout). */
function makeConns(ctx, L, p) {
  const th = ctx.theme;
  const showAll = ctx.show('all');
    // connectors (+ labels beside them)
  const conns = p.relationships.map((rel, i) => {
    const ends = endpoints(L, rel);
    if (!ends) return null;
    const c = connector(ctx, {name: `rg-c${i}`, from: ends.from, to: ends.to, kind: rel.kind, bend: 0, color: kindColor(ctx, rel.kind)});
    let lab = null;
    if (showAll && L.labFits[i]) {
      const fit = L.labFits[i];
      const mid = c.mid;
      const vertical = Math.abs(ends.to.x - ends.from.x) < Math.abs(ends.to.y - ends.from.y);
      const off = PEOPLE.includes(rel.from) || PEOPLE.includes(rel.to) ? L.trR + 10 : 24;
    const person = PEOPLE.includes(rel.from) || PEOPLE.includes(rel.to);
    const x = vertical ? (person ? mid.x - off : mid.x + off) : mid.x;
      const y = vertical ? (person && L.labCy !== null ? L.labCy : mid.y) - (fit.height + L.F * 0.5) / 2 : Math.min(ends.from.y, ends.to.y) - (fit.height + fit.size * 0.76) - 22;
      lab = wchip(ctx, fit.full, {x, y, anchor: vertical ? (person ? 'end' : 'start') : 'middle', maxWidth: fit.width + fit.size * 1.2 + 2, size: fit.size, minSize: fit.size, maxLines: 4, fill: th.card, stroke: kindColor(ctx, rel.kind), name: `rg-l${i}`});
    }
    return {rel, c, lab, ends};
  });
  return conns;
}

/** Centre of a component (final positions). */
function centerOf(L, id) {
  const pi = PEOPLE.indexOf(id);
  if (pi >= 0) return {x: L.badges[pi].x, y: L.badges[pi].y};
  const ti = TASKS.indexOf(id);
  if (ti >= 0) { const lane = PEOPLE.findIndex(pid => L.laneTask[pid] === id); return {x: L.slots[lane].x, y: L.slots[lane].y}; }
  if (id === 'file') return {x: L.file.x + L.file.w / 2, y: L.file.y + L.file.h / 2};
  return {x: L.board.x + L.board.w / 2, y: L.board.y + L.board.h / 2};
}

/** Connector endpoints on real edges; gap = distance from the end to its element edge. */
function endpoints(L, rel) {
  const pi = id => PEOPLE.indexOf(id);
  const laneOf = t => PEOPLE.findIndex(pid => L.laneTask[pid] === t);
  const person = id => pi(id) >= 0;
  const task = id => TASKS.includes(id);
  if (person(rel.from) && task(rel.to) || person(rel.to) && task(rel.from)) {
    const pid = person(rel.from) ? rel.from : rel.to;
    const tid = task(rel.to) ? rel.to : rel.from;
    const b = L.badges[pi(pid)];
    const s = L.slots[laneOf(tid)];
    const ring = L.cardM.ring;
    const pa = {x: b.x + (s.x - b.x) * 0, y: b.y - b.r - 6};
    const pb = {x: s.x, y: s.y + ring + 8};
    const [from, to] = person(rel.from) ? [pa, pb] : [pb, pa];
    return {from, to, gap: 8};
  }
  if ((rel.from === 'file' && rel.to === 'board') || (rel.from === 'board' && rel.to === 'file')) {
    const f = L.file, B = L.board;
    let pa, pb;
    if (L.fileSide === 'left') { pa = {x: f.x + f.w + 8, y: f.y + f.h / 2}; pb = {x: B.x - 12, y: f.y + f.h / 2}; }
    else { pa = {x: f.x + f.w / 2, y: f.y + f.h + 8}; pb = {x: f.x + f.w / 2, y: B.y - 12}; }
    const [from, to] = rel.from === 'file' ? [pa, pb] : [pb, pa];
    return {from, to, gap: 12};
  }
  return null; // other combinations are not drawn by this map
}

/** Tracer route along the supplied order: along connectors, hidden hops otherwise. */
function buildRoute(L, p) {
  const order = p.traversalOrder;
  const segs = [];
  const visits = [{id: order[0], t: 0}];
  const nPairs = Math.max(1, order.length - 1);
  for (let j = 0; j + 1 < order.length; j++) {
    const A = order[j], B = order[j + 1];
    const ci = L.conns.findIndex(x => x && ((x.rel.from === A && x.rel.to === B) || (x.rel.from === B && x.rel.to === A)));
    const x = ci >= 0 ? L.conns[ci] : null;
    let path = null, reverse = false, owner = null, deliver = null;
    if (x) {
      path = polyline([x.ends.from, x.ends.to]);
      reverse = x.rel.from !== A;
      const pid = PEOPLE.includes(A) ? A : PEOPLE.includes(B) ? B : null;
      if (pid && (TASKS.includes(A) || TASKS.includes(B))) { owner = pid; if (TASKS.includes(B)) deliver = pid; }
    }
    segs.push({path, reverse, owner, deliver});
    visits.push({id: B, t: (j + 1) / nPairs});
  }
  return {segs, visits, order};
}

/** Relation labels clear of each other, of the badges, cards' text areas and the bubble. */
function labelsClear(L) {
  const labs = (L.conns || []).filter(x => x && x.lab).map(x => x.lab.box);
  const obst = [...L.badges.map(b => ({x: b.x - b.r, y: b.y - b.r, w: 2 * b.r, h: 2 * b.r})), ...L.cards, {x: L.file.x, y: L.file.y, w: L.file.w, h: L.file.h}];
  for (let i = 0; i < labs.length; i++) {
    if (obst.some(o => overlaps(labs[i], o, 4))) return false;
    for (let j = i + 1; j < labs.length; j++) if (overlaps(labs[i], labs[j], 4)) return false;
  }
  return true;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-10-mechanism',
    title: 'Legal team meeting — who is linked to which task card, as a map',
    titleEs: 'Reunión de equipo jurídico — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Reunión de equipo jurídico',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A map of the team meeting: the case file feeds the task board (sequence arrow); each team member’s portrait badge is joined to the assignee slot of one task card by a plain relation line (no arrow). A small name magnet travels the supplied order and stays in the slot it reaches; a card without a supplied link keeps an empty slot. Nothing is concluded.',
    tags: ['team meeting', 'task board', 'assignment', 'relation map', 'tracer', 'case file', 'speech bubble'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/reunion-de-equipo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
