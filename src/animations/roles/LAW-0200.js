/**
 * LAW-0200 — Reunión de equipo jurídico · inspect
 *
 * Storyboard (context = the state produced by the story: three team members
 * behind the table, every task card on the cork board carrying the name
 * magnet of the person below it):
 *  0.00–0.20  context: the whole meeting scene at rest; the inspected card
 *             shows the supplied old value (its assignee's name beside the
 *             magnet, or its task wording).
 *  0.22–0.34  isolate: a lens grows out of the inspected card (a real enlarged
 *             copy, ≥ 1.5×) over the neighbouring cards, which it covers wholly
 *             (never below the card row; the scene stays full width at rest and
 *             hold in every ratio); guides join lens and card; the scene is
 *             dimmed. The lens window is opaque from its first frame; scene texts
 *             fade out before the moving rim would cut them.
 *  0.37–0.42  the old value is struck in grey inside the lens (every line).
 *  0.44–0.60  the datum changes IN THE SCENE and the lens shows it live (the
 *             lens content is a real copy: the card, the owner's arm, hand and
 *             magnet, posed identically every frame). Assignee change: the
 *             owner reaches up, takes the magnet out of the ring and brings it
 *             back to the chest; the name leaves the card and the supplied
 *             "no assignee" text appears. Wording change: the card turns over
 *             to the new wording. The new value then stays still (≥ 400 ms).
 *  0.74–1.00  return: the lens closes onto the identical card; a neutral Δ
 *             marker on the card, a "Changed" chip with a leader to it and the
 *             struck "was:" chip right above the card; the neutral key. Seeking
 *             back restores the old datum exactly. No validity, responsibility
 *             or outcome is inferred.
 * @module animations/roles/LAW-0200
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {clamp, ease, lerp, r, seg} from '../../core/time.js';
import {str, num, list, obj, oneOf, party} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {
  TEAM_IDS, TASK_IDS, TEAM_DEFAULTS, TASKS_EN, KIT_STRINGS, linkItem, rolesField, captionOf, looksOf, resolveLanes,
  layoutStage, buildStage, stageNodes, poseStage, measureCards, taskCard, slotCentreLocal, magnetArt, fitClean, wchip,
  overlaps, overHeads, boxHitsCircle, frontPerson, thumbCap, keyChip,
} from './kits/reunion-de-equipo.js';
import {shade} from '../../primitives/paper.js';

const M0 = L => L.cardM;
/** Ring colour of an owner (as the stage draws it). */
const shade0 = hex => shade(hex, -0.2);

const ID = 'LAW-0200';
const DURATION = 8000;
const W = {open: [0.22, 0.34], strike: [0.37, 0.42], reach: [0.44, 0.49], carry: [0.49, 0.6], flip: [0.46, 0.56], close: [0.74, 0.8], marker: [0.8, 0.84], notes: [0.8, 0.86], key: [0.8, 0.85]};

const STRINGS = {en: {...KIT_STRINGS.en, was: 'was'}, es: {...KIT_STRINGS.es, was: 'antes'}};

const sceneSchema = {
  actors: list('The three fictional team members, left to right (a, b, c)', party, 3, 3),
  roles: rolesField,
  relationships: list('Supplied links in the context: who has put their name magnet on which task card', linkItem, 1, 3),
  props: obj('Supplied content', {
    tasks: list('Task labels on the three cards (fictional, neutral)', str('Task label', 90), 3, 3),
    focusCard: oneOf('Whose card is inspected (the card above person a, b or c)', TEAM_IDS),
    document: str('Label on the case-file folder', 60),
  }, ['tasks', 'focusCard', 'document']),
  focusTarget: oneOf('Datum that is enlarged and substituted: the assignee shown on the card, or the task wording', ['assignee', 'task']),
  beforeValue: str('Value shown before the substitution (assignee: the name shown beside the magnet; task: the card wording)', 90),
  afterValue: str('Value shown after the substitution (assignee: text of the now empty slot; task: the new wording)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (≥ 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Board title / context caption', 80), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  actors: TEAM_DEFAULTS.actors,
  roles: TEAM_DEFAULTS.roles,
  relationships: TEAM_DEFAULTS.relationships,
  props: {tasks: TASKS_EN, focusCard: 'c', document: 'Case file (fictional)'},
  focusTarget: 'assignee',
  beforeValue: 'Lena Park',
  afterValue: 'No assignee (as supplied)',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Case file 24-017 · task board (fictional)', marker: 'Changed: who is linked to this card'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 950], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const DW = ctx.design.w, DH = ctx.design.h;
    const upx = unitPx(ctx);
    const showAll = ctx.show('all');
    const looks = looksOf(ctx, p.actors);
    const {laneTask, linked} = resolveLanes(TEAM_IDS, TASK_IDS, p.relationships);
    const fi = TEAM_IDS.indexOf(p.props.focusCard);
    const asg = p.focusTarget === 'assignee';
    const people = TEAM_IDS.map((id, i) => ({id, look: looks[i], name: asg && i === fi ? p.beforeValue : p.actors[i].name, caption: captionOf(p, id)}));
    const lanes = TEAM_IDS.map((id, i) => ({label: !asg && i === fi ? p.beforeValue : p.props.tasks[TASK_IDS.indexOf(laneTask[id])], owner: linked[id] || (asg && i === fi) ? i : null, task: laneTask[id]}));
    // the lens lies 'over' the neighbouring cards, covering them wholly, never below the card row
    const outerSide = fi === 0 ? -1 : fi === 2 ? 1 : 0;
    // placements tried in order; 'side' (a free column on the card's outer side) only exists for an outer card
    // wide frames keep the scene full width at rest and hold: the lens lies over the scene (never a side column)
    const placements = p.detailGeometry.placement === 'right' && outerSide ? ['side'] : outerSide && shape !== 'landscape' ? ['over', 'side'] : ['over'];
    // the "Changed" and "was:" chips take their own rows right above the card (a side margin is no longer used)
    const margin = 0;
    const extras = [
      ...(ctx.show('key') ? [{name: 'key', text: ctx.t.key, kind: 'key'}] : []),
      ...(showAll && !margin ? [{name: 'mlabel', text: p.contextLabels.marker, kind: 'note', lane: fi, align: fi === 0 ? 'left' : 'right'}, {name: 'was', text: `${ctx.t.was}: ${p.beforeValue}`, kind: 'note', lane: fi, align: fi === 0 ? 'right' : 'left'}] : []),
    ];
    const stageOpts = {docOnBoard: shape === 'portrait', legs: shape === 'portrait', folderFront: true, chestRestY: 72,
      spacingK: shape === 'portrait' ? 222 : undefined, hold: {x: 50, y: 56}, restX: 28, release: [{x: 104, y: -104}, {x: 66, y: 30}], lift: {c1: {x: 92, y: -20}}};
    let best = null;
    for (const px of [{F: 22, min: 19.6}, {F: 20, min: 16}]) {
      for (const [placement, frac] of placements.flatMap(pl => (pl === 'side' ? [0.3, 0.34, 0.38] : shape === 'landscape' ? [640, 620, 600, 580, 560, 520] : [560]).map(fr => [pl, fr]))) {
        const sideDir = outerSide || 1;
        const box = placement === 'side' ? {x: sideDir < 0 ? DW * frac : 0, y: 0, w: DW * (1 - frac), h: DH} : {x: outerSide < 0 ? DW * margin : 0, y: 0, w: DW * (1 - margin), h: DH};
        const L = layoutStage(ctx, {prefix: 'st', box, unitPx: upx, people, lanes, openText: asg ? p.afterValue : null, title: p.contextLabels.context, doc: p.props.document, px, extras, kMax: 1.7, sMax: placement === 'side' ? 420 : frac /* 'over': the widest spacing whose lens still fits above the card row */, cardMax: 470, ...stageOpts});
        const G = L.G;
        const card = G.card(fi);
        const Mk = L.cardM;
        // crop: the whole card, or (when the frame is too short for its enlargement) only the isolated detail —
        // the assignee row, or the task wording — each field wholly in or wholly out
        const rowTop = card.y + Mk.h - Mk.bm - Mk.rowH - Mk.pad * 0.45;
        const crops = [
          {x: card.x - 8, y: card.y - 8, w: card.w + 16, h: card.h + 8 + Math.min(8, 4 * G.k)},
          asg ? {x: card.x - 8, y: rowTop, w: card.w + 16, h: card.y + card.h + Math.min(8, 4 * G.k) - rowTop}
            : {x: card.x - 8, y: card.y - 8, w: card.w + 16, h: Mk.band + Mk.pad * 0.9 + Mk.textH + Math.min(8, Mk.pad * 0.3) + 8},
        ];
        for (const src0 of crops) {
        let src = src0;
        let dest, z;
        const bottomMax = G.cardBottom + Math.min(4, 6 * G.k);
        if (placement === 'side') {
          const col = sideDir > 0 ? {x: box.x + box.w, w: DW - box.w} : {x: 0, w: box.x};
          z = Math.min(p.detailGeometry.zoom, (col.w - 30) / src.w, (Math.min(DH - 10, bottomMax) - 10) / src.h);
          dest = {w: src.w * z, h: src.h * z};
          dest.x = col.x + (col.w - dest.w) / 2;
          dest.y = clamp(src.y + src.h / 2 - dest.h / 2, 10, Math.min(DH - 10, bottomMax) - dest.h);
        } else {
          // snap the lens to wholly cover the neighbour cards on one side (both of them for an outer card)
          const dir = outerSide ? -outerSide : (fi + 1 < G.n ? 1 : -1);
          const nb = G.xs.map((_, i) => i).filter(i => (dir < 0 ? i < fi : i > fi));
          const far = G.card(dir < 0 ? nb[0] : nb[nb.length - 1]);
          const x0 = dir < 0 ? far.x - 8 : card.x + card.w + 14;
          const x1 = dir < 0 ? card.x - 14 : far.x + far.w + 8;
          // the lens spans exactly the neighbours' cards (so each is wholly under it); its scale follows from that
          z = Math.min(4, (x1 - x0) / src.w);
          // a detail crop too short to span the neighbours' height grows upward (blank board above the card)
          const need = (card.h + 14) / z - src.h;
          if (need > 0) src = {...src, y: src.y - need, h: src.h + need};
          dest = {w: src.w * z, h: src.h * z};
          dest.x = dir < 0 ? x1 - dest.w : x0;
          // bottom on the card row; a short lens (a detail crop) still reaches over the neighbours' top edges
          dest.y = Math.min(bottomMax - dest.h, card.y - 6);
        }
        const heads = G.xs.map((_, i) => G.zones(i)).flat();
        // the window must stay off every head along its whole opening path (not only where it ends)
        const lensClear = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].every(t => { const R = {x: lerp(src.x, dest.x, t), y: lerp(src.y, dest.y, t), w: lerp(src.w, dest.w, t), h: lerp(src.h, dest.h, t)}; return !heads.some(zc => boxHitsCircle(R, zc, zc.r)); });
        // neighbour cards wholly inside the lens or wholly outside it
        const neighboursWhole = G.xs.every((_, i) => { if (i === fi) return true; const c = G.card(i); const inside = c.x >= dest.x - 1 && c.x + c.w <= dest.x + dest.w + 1 && c.y >= dest.y - 1 && c.y + c.h <= dest.y + dest.h + 1; const apart = c.x > dest.x + dest.w || c.x + c.w < dest.x || c.y > dest.y + dest.h || c.y + c.h < dest.y; return inside || apart; });
        const cones = coneSegs(src, dest);
        const textBoxes = [...G.xs.map((_, i) => (i === fi ? null : G.card(i))).filter(Boolean).map(c => ({x: c.x + M0(L).pad, y: c.y + M0(L).band, w: c.w - 2 * M0(L).pad, h: c.h - M0(L).band - M0(L).bm})), ...Object.values(L.header).filter(it => it.lane === undefined && !['key', 'title', 'doc'].includes(it.name)).map(it => it.box)]  // the key shows only after the lens closes; title/doc text fade as the rim approaches
          .filter(bx => !(bx.x >= dest.x - 1 && bx.y >= dest.y - 1 && bx.x + bx.w <= dest.x + dest.w + 1 && bx.y + bx.h <= dest.y + dest.h + 1));
        const outside = sg => { const q = []; for (let i = 1; i < 40; i++) { const t = i / 40; const pt = {x: sg[0].x + (sg[1].x - sg[0].x) * t, y: sg[0].y + (sg[1].y - sg[0].y) * t}; if (!(pt.x > dest.x && pt.x < dest.x + dest.w && pt.y > dest.y && pt.y < dest.y + dest.h)) q.push(pt); } return q; };
        const guidesClear = cones.every(sg => outside(sg).every(pt => !textBoxes.some(bx => pt.x > bx.x && pt.x < bx.x + bx.w && pt.y > bx.y && pt.y < bx.y + bx.h)) && !heads.some(zc => segCircle(sg, zc)));
        const ok = L.fits && z >= 1.5 && lensClear && guidesClear && neighboursWhole && dest.y >= 6;
        const cand = {L, src, dest, zoom: z, ok, lensClear, guidesClear, neighboursWhole, placement, frac, px};
        if (!best || (ok && !best.ok) || (!ok && !best.ok && z > best.zoom)) best = cand;
        if (ok) break;
        }
        if (best.ok) break;
      }
      if (best.ok) break;
    }
    const {L, src, dest} = best;
    const S = buildStage(ctx, L);
    const G = L.G;
    const card = G.card(fi);
    const M = L.cardM;
    const side = G.sides[fi];
    const ownerCol = looks[fi].outfit;
    // ---- context: the after-card for a wording change (turns over in place)
    let afterM = M;
    if (!asg) afterM = measureCards(ctx, [p.afterValue], {w: M.w, F: M.size, minF: M.size, R: M.R, rowTexts: [M.rows[fi] ? M.rows[fi].full : null], openText: null, show: showAll, slotOff: M.slotOff, maxLines: 5, bottom: M.bm});
    const afterCard = pre => taskCard(ctx, {name: `${pre}a`, M: {...afterM, h: M.h, textH: afterM.textH}, fit: afterM.fits[0], row: afterM.rows[0], side, show: showAll, owner: ownerCol});
    const ctxAfter = !asg ? g({name: 'cx-after', transform: T(card.x, card.y), opacity: 0}, afterCard('cx')) : null;
    // ---- lens copy: a REAL copy (card, owner's arm + hand + thumb, magnet), posed from the context every frame
    const copyCard = taskCard(ctx, {name: 'lzc', M, fit: M.fits[fi], row: M.rows[fi], side, show: showAll, owner: shade0(ownerCol)});
    const copyAfter = !asg ? g({name: 'lzcx-after', transform: T(card.x, card.y), opacity: 0}, afterCard('lzcx')) : null;
    const copyPerson = frontPerson(ctx, {name: 'lzp', look: looks[fi], legs: stageOpts.legs && shape === 'portrait'});
    const copyMag = magnetArt(ctx, {name: 'lzm', look: looks[fi], R: G.R});
    const copyThumb = thumbCap(ctx, {name: 'lzth', look: looks[fi]});
    // strike lines over each line of the old value (lens only: an annotation of the change)
    const oldFit = asg ? M.rows[fi] : M.fits[fi];
    const strikeSpec = [];
    if (showAll && oldFit) {
      const tx = asg ? (M.stacked ? M.w / 2 : side > 0 ? M.pad + M.rowW / 2 : M.w - M.pad - M.rowW / 2) : M.w / 2;
      const y0 = asg ? (M.stacked ? M.h - M.bm - M.rowH + M.rowTextH / 2 : M.h - M.bm - M.rowH / 2) - oldFit.height / 2 : M.band + M.pad * 0.9 + (M.textH - oldFit.lines.length * oldFit.size * 1.18) / 2;
      oldFit.lines.forEach((ln, j) => {
        const lw = ctx.measure(ln, oldFit.size, oldFit.weight, 'sans');
        strikeSpec.push({x0: tx - lw / 2, x1: tx + lw / 2, y: y0 + j * oldFit.lineHeight + oldFit.size * 0.48});
      });
    }
    const strikes = g({name: 'lz-strikes'}, strikeSpec.map((q, j) => h('line', {name: `lz-strike${j}`, x1: r(q.x0), x2: r(q.x0), y1: r(q.y), y2: r(q.y), stroke: th.inkSoft, 'stroke-width': Math.max(3, M.size * 0.12), 'stroke-linecap': 'round', opacity: 0})));
    const copy = g({name: 'lz-copy'},
      h('rect', {x: r(src.x), y: r(src.y), width: r(src.w), height: r(src.h), fill: '#cfa77a'}),
      g({transform: T(card.x, card.y)}, copyCard, strikes),
      copyAfter,
      g({display: 'none'}, copyPerson.body),
      copyPerson.arms, copyMag, copyThumb);
    const frameBox = {x: L.board.x - 16, y: Math.min(L.board.y, dest.y) - 16, w: L.board.w + 32, h: L.bottom - Math.min(L.board.y, dest.y) + 24};
    if (best.placement === 'side') { frameBox.x = Math.min(frameBox.x, dest.x - 16); frameBox.w = Math.max(L.board.x + L.board.w, dest.x + dest.w) + 16 - frameBox.x; }
    const lz = lens(ctx, {name: 'lz', source: src, dest, content: copy, frame: frameBox, color: th.accent2});
    const markOcclude = n => { if (n && n.attrs && n.attrs.name === 'lz-win') n.attrs['data-occludes'] = 1; (n.children || []).forEach(c => typeof c === 'object' && markOcclude(c)); };
    markOcclude(lz.node);
    // ---- marker, "Changed" chip (leader to the Δ) and struck "was:" chip (leader to the card), key
    const mR = Math.max(16, L.F * 0.8);
    // Δ on the card's outer top corner (away from the neighbouring cards)
    const markerAt = markerAt0(card, fi);
    const marker = changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0});
    const notes = [];
    let hm = L.header.mlabel, hw = L.header.was;
    if (margin && showAll) {
      // margin placement beside the inspected card
      const mx0 = outerSide > 0 ? L.board.x + L.board.w + 22 : 12, mx1 = outerSide > 0 ? DW - 12 : L.board.x - 22;
      const mw = mx1 - mx0;
      const F = L.F;
      const probeM = wchip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: mw, size: F, minSize: L.minF, maxLines: 4, fill: th.card});
      const probeW = wchip(ctx, `${ctx.t.was}: ${p.beforeValue}`, {x: 0, y: 0, maxWidth: mw, size: F, minSize: L.minF, maxLines: 4, fill: th.card});
      const yM = Math.max(8, markerAt0(card, fi).y - probeM.box.h / 2);
      const yW = yM + probeM.box.h + 14;
      const xAt = w => (outerSide > 0 ? mx0 : mx1 - w);
      hm = {text: p.contextLabels.marker, maxW: mw, size: probeM.fit.size, box: {x: xAt(probeM.box.w), y: yM, w: probeM.box.w, h: probeM.box.h}, side: true};
      hw = {text: `${ctx.t.was}: ${p.beforeValue}`, maxW: mw, size: probeW.fit.size, box: {x: xAt(probeW.box.w), y: yW, w: probeW.box.w, h: probeW.box.h}, side: true};
    }
    if (hm) {
      const c = wchip(ctx, hm.text, {x: hm.box.x, y: hm.box.y, maxWidth: hm.maxW, size: hm.size, minSize: hm.size, maxLines: 3, fill: th.card, stroke: th.accent2, name: 'mlabel-chip'});
      const lead = hm.side
        ? {x1: outerSide > 0 ? c.box.x : c.box.x + c.box.w, y1: clamp(markerAt.y, c.box.y + 10, c.box.y + c.box.h - 10), x2: markerAt.x + (outerSide > 0 ? mR : -mR), y2: markerAt.y}
        : {x1: clamp(markerAt.x, c.box.x + 14, c.box.x + c.box.w - 14), y1: c.box.y + c.box.h, x2: markerAt.x, y2: markerAt.y - mR};
      notes.push(g({name: 'mlabel', opacity: 0}, h('line', {x1: r(lead.x1), y1: r(lead.y1), x2: r(lead.x2), y2: r(lead.y2), stroke: th.accent2, 'stroke-width': 2.5}), c.node));
    }
    if (hw) {
      const c = wchip(ctx, hw.text, {x: hw.box.x, y: hw.box.y, maxWidth: hw.maxW, size: hw.size, minSize: hw.size, maxLines: 3, fill: th.card, stroke: th.inkSoft, name: 'was-chip'});
      const f = c.fit;
      const skip = ctx.measure(`${ctx.t.was}: `, f.size, f.weight, 'sans');
      const lines = f.lines.map((ln, j) => {
        const lw = ctx.measure(ln, f.size, f.weight, 'sans');
        const x0 = c.box.cx - lw / 2 + (j === 0 ? skip : 0);
        const y = c.box.y + (c.box.h - f.height) / 2 + j * f.lineHeight + f.size * 0.48;
        return h('line', {x1: r(x0), x2: r(c.box.cx + lw / 2), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': 2.4});
      });
      const lx = clamp(card.x + card.w / 2 + (fi === 0 ? card.w * 0.2 : -card.w * 0.2), c.box.x + 14, c.box.x + c.box.w - 14);
      const wy = clamp(c.box.y + c.box.h / 2, card.y + 20, card.y + card.h - 20);
      const lead = hw.side
        ? {x1: outerSide > 0 ? c.box.x : c.box.x + c.box.w, y1: clamp(wy, c.box.y + 8, c.box.y + c.box.h - 8), x2: outerSide > 0 ? card.x + card.w + 2 : card.x - 2, y2: wy}
        : {x1: lx, y1: c.box.y + c.box.h, x2: lx, y2: card.y + 2};
      notes.push(g({name: 'was', opacity: 0}, h('line', {x1: r(lead.x1), y1: r(lead.y1), x2: r(lead.x2), y2: r(lead.y2), stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-dasharray': '5 4'}), c.node, lines));
    }
    let key = null;
    if (L.header.key) {
      const kb = L.header.key;
      key = g({name: 'keyg', opacity: 0}, keyChip(ctx, kb.text, {x: kb.box.x, y: kb.box.y, maxWidth: kb.maxW, size: kb.size, minSize: kb.size, maxLines: 2, name: 'key-chip'}).node);
    }
    // context texts that the lens window may partly cover (faded as the rim approaches)
    const fades = [];
    if (showAll) {
      G.xs.forEach((_, i) => {
        if (i === fi) return;
        const c = G.card(i);
        fades.push({names: [`st-card${i}-text`], box: {x: c.x, y: c.y + M.band, w: c.w, h: M.pad * 0.9 + M.textH}});
        const rowBox = {x: c.x, y: c.y + M.h - M.bm - M.rowH, w: c.w, h: M.rowH};
        fades.push({names: [M.rows[i] ? `st-card${i}-owner` : null, M.open ? `st-card${i}-open` : null].filter(Boolean), box: rowBox});
      });
      if (L.header.title) fades.push({names: ['st-title-text'], box: L.header.title.box});
      if (L.header.doc) fades.push({names: ['st-doc-text'], box: L.header.doc.box});
    }
    G.xs.forEach((_, i) => {
      if (i === fi) return;
      const c = G.card(i);
      const under = c.x < dest.x + dest.w && c.x + c.w > dest.x && c.y < dest.y + dest.h && c.y + c.h > dest.y;
      if (under) fades.push({names: [`st-card${i}`, `st-m${i}`], box: {x: c.x, y: c.y - 6, w: c.w, h: c.h + 6}});
    });
    // the inspected card's own texts in the scene: while the rim slides across one it fades (the lens shows it whole)
    const cutFades = [];
    if (showAll) {
      const cb = {x: card.x, y: card.y + M.band, w: card.w, h: M.pad * 0.9 + M.textH};
      const rb = {x: card.x, y: card.y + M.h - M.bm - M.rowH, w: card.w, h: M.rowH};
      cutFades.push({names: [M.fits[fi] ? `st-card${fi}-text` : null, !asg && afterM.fits && afterM.fits[0] ? 'cxa-text' : null].filter(Boolean), box: cb});
      cutFades.push({names: [M.rows[fi] ? `st-card${fi}-owner` : null, M.open ? `st-card${fi}-open` : null, !asg && afterM.rows[0] ? 'cxa-owner' : null].filter(Boolean), box: rb});
    }
    return {L, S, G, fi, asg, src, dest, zoom: best.zoom, cutFades, lz, ctxAfter, marker, markerAt, mR, notes, key, strikeSpec, ok: best.ok, lensClear: best.lensClear, guidesClear: best.guidesClear, neighboursWhole: best.neighboursWhole, upx, placement: best.placement, card, fades, hasOwner: Boolean(showAll && M.rows[fi]), hasOwnerA: Boolean(showAll && !asg && afterM.rows[0]), hasOpen: Boolean(showAll && M.open), hasText: Boolean(showAll && M.fits[fi]), hasTextA: Boolean(showAll && afterM.fits && afterM.fits[0])};
  },
  build(ctx, L) {
    return g(null, stageNodes(L.S, {behindPeople: L.ctxAfter}), L.marker, L.notes, L.key, L.lz.node);
  },
  frame(ctx, L, u) {
    const G = L.G;
    const fi = L.fi;
    const open = ease.inOutCubic(seg(u, W.open[0], W.open[1])) * (1 - ease.inOutCubic(seg(u, W.close[0], W.close[1])));
    const st = TEAM_IDS.map((id, i) => ({q: null, done: L.L.o.lanes[i].owner !== null, look: 0, tilt: 0}));
    let datum = 'before';
    if (L.asg) {
      // the owner reaches up to the slot (release path run backwards), takes the magnet out and brings it back to the chest
      const reach = seg(u, W.reach[0], W.reach[1]), carry = seg(u, W.carry[0], W.carry[1]);
      if (u >= W.carry[1]) { st[fi] = {q: null, done: false}; datum = 'after'; }
      else if (u > W.reach[0]) {
        st[fi] = {q: reach < 1 ? 1 - 0.28 * ease.inOutSine(reach) : 0.72 * (1 - ease.inOutSine(carry)), done: false};
        datum = 'changing';
      }
      if (u > W.reach[0] && u < W.carry[1] + 0.05) st.forEach((s, i) => { if (i !== fi) { const lk = clamp((G.xs[fi] - G.xs[i]) / (G.S * 0.9), -1, 1); s.look = r(lk, 3); s.tilt = r(lk * 6, 2); } });
    }
    const posed = poseStage(L.L, L.S, st);
    const nodes = posed.nodes;
    if (!L.asg) {
      // wording change: the card turns over in place (before → after)
      const f = seg(u, W.flip[0], W.flip[1]);
      const c = L.card;
      const s1 = f < 0.5 ? 1 - ease.inCubic(f * 2) : 0, s2 = f >= 0.5 ? ease.outCubic((f - 0.5) * 2) : 0;
      // only the wording turns over about its own centre line; the card, its ring and its name row stay put
      // (so the wording never leaves a wording-only lens crop, and nothing else moves)
      const cm = L.L.cardM, ty = cm.band + cm.pad * 0.9 + cm.textH / 2;
      nodes[`st-card${fi}`] = {opacity: f < 0.5 ? 1 : 0};
      if (L.hasText) nodes[`st-card${fi}-text`] = {transform: scaleAbout(c.w / 2, ty, 1, Math.max(0.001, s1)), opacity: s1 > 0.02 ? 1 : 0};
      nodes['cx-after'] = {opacity: f >= 0.5 ? 1 : 0};
      if (L.hasTextA) nodes['cxa-text'] = {transform: scaleAbout(c.w / 2, ty, 1, Math.max(0.001, s2)), opacity: s2 > 0.02 ? 1 : 0};
      nodes['cxa-solid'] = {opacity: 1};
      nodes['cxa-dash'] = {opacity: 0};
      if (L.hasOwnerA) nodes['cxa-owner'] = {opacity: 1};
      datum = f <= 0 ? 'before' : f >= 1 ? 'after' : 'changing';
    }
    // ---- the lens copy mirrors the context exactly (same attribute values, copy node names)
    const P = `st-p${fi}-`;
    for (const [k, v] of Object.entries({...nodes})) {
      if (k.startsWith(P)) nodes[`lzp-${k.slice(P.length)}`] = v;
      else if (k === `st-p${fi}`) nodes.lzp = v;
      else if (k === `st-m${fi}`) nodes.lzm = v;
      else if (k === `st-th${fi}`) nodes.lzth = v;
      else if (k.startsWith(`st-card${fi}-`)) nodes[`lzc-${k.slice(`st-card${fi}-`.length)}`] = v;
      else if (k === `st-card${fi}`) nodes.lzc = v;
      else if (k === 'cx-after') nodes['lzcx-after'] = v;
      else if (k.startsWith('cxa-')) nodes[`lzcxa-${k.slice(4)}`] = v;
    }
    // strike (lens annotation) over the old value; it leaves together with the old value
    const strike = seg(u, W.strike[0], W.strike[1]);
    const oldVis = L.asg ? (L.hasOwner ? Number(nodes[`st-card${fi}-owner`].opacity) : 1) : (Number((nodes[`st-card${fi}-text`] || {opacity: 1}).opacity) * Number(nodes[`st-card${fi}`].opacity));
    L.strikeSpec.forEach((q, j) => { nodes[`lz-strike${j}`] = {x2: r(lerp(q.x0, q.x1, strike)), opacity: strike > 0 ? r(oldVis, 3) : 0}; });
    nodes['lz-strikes'] = {transform: L.asg || !L.hasText ? '' : nodes[`st-card${fi}-text`].transform};
    // ---- lens window (opaque from its first frame: no double image, never blank)
    Object.assign(nodes, L.lz.frame(open, open));
    nodes['lz-win'] = {opacity: open > 0.001 ? 1 : 0};
    const S0 = L.src, D0 = L.dest;
    const R = {x: lerp(S0.x, D0.x, open), y: lerp(S0.y, D0.y, open), w: lerp(S0.w, D0.w, open), h: lerp(S0.h, D0.h, open)};
    // context texts fade out as the rim approaches, so the rim never cuts a word
    const sep = (a, b) => Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), a.y - (b.y + b.h), b.y - (a.y + a.h));
    for (const fd of L.fades) {
      // fades from full at the start of the opening to nothing where the rim first touches the box (no jump)
      const s0 = sep(S0, fd.box);
      const f = open > 0.001 ? clamp(sep(R, fd.box) / (s0 > 1 ? Math.min(40, s0) : 40)) : 1;
      for (const n of fd.names) { const base = nodes[n] && nodes[n].opacity !== undefined ? Number(nodes[n].opacity) : 1; nodes[n] = {...(nodes[n] || {}), opacity: r(base * f, 3)}; }
    }
    const inset = (a, b) => Math.min(b.x - a.x, a.x + a.w - b.x - b.w, b.y - a.y, a.y + a.h - b.y - b.h);
    for (const fd of L.cutFades) {
      // wholly inside the window (covered) or wholly outside: unchanged; straddling the rim: faded out
      const f = open > 0.001 ? clamp(Math.max(inset(R, fd.box), sep(R, fd.box)) / 10) : 1;
      for (const n of fd.names) { const base = nodes[n] && nodes[n].opacity !== undefined ? Number(nodes[n].opacity) : 1; nodes[n] = {...(nodes[n] || {}), opacity: r(base * f, 3)}; }
    }
    const markerIn = seg(u, W.marker[0], W.marker[1]);
    nodes['cx-marker'] = {opacity: r(markerIn, 3)};
    const notesIn = seg(u, W.notes[0], W.notes[1]);
    for (const n of L.notes) nodes[n.attrs.name] = {opacity: r(notesIn, 3)};
    if (L.key) nodes.keyg = {opacity: r(seg(u, W.key[0], W.key[1]), 3)};
    const sem = posed.sem;
    const heads = G.xs.map((_, i) => G.zones(i)).flat();
    const lensBox = open > 0.001 ? R : null;
    return {
      nodes,
      semantic: {
        lensOpen: r(open, 3),
        datum,
        contextDatum: datum,
        lensMirrorsContext: true,
        focusTarget: ctx.params.focusTarget,
        focusCard: ctx.params.props.focusCard,
        zoom: r(L.zoom, 3),
        lensCopyAt: {x: r(L.card.x), y: r(L.card.y)},
        contextCardAt: {x: r(G.card(fi).x), y: r(G.card(fi).y)},
        strike: r(strike, 3),
        oldShown: L.notes.length ? r(notesIn, 3) : null,
        lensClearOfHeads: !lensBox || !heads.some(zc => boxHitsCircle(lensBox, zc, zc.r)),
        guidesClear: L.guidesClear,
        neighboursWhole: L.neighboursWhole,
        markerVisible: markerIn >= 1,
        markerClearOfHeads: !heads.some(zc => Math.hypot(L.markerAt.x - zc.x, L.markerAt.y - zc.y) < zc.r + L.mR),
        markerClearOfHands: sem.hands.concat(sem.freeHands).every(hd => Math.hypot(hd.x - L.markerAt.x, hd.y - L.markerAt.y) > L.mR + 20 * G.k),
        magnetAt: sem.at[fi],
        filled: sem.at.map(a => (a === 'card' ? 1 : 0)),
        magFocus: sem.mags[fi],
        handFocus: sem.hands[fi],
        gripFocus: sem.grips[fi],
        armGap: sem.armGap,
        magArmGap: sem.magArmGap,
        allReached: sem.allReached,
        overHeads: overHeads(G, sem.mags, G.xs.map((_, i) => G.card(i))),
        labelsFit: L.ok,
        headPx: r(88 * G.k * L.upx, 1),
        placement: L.placement,
      },
    };
  },
};

function shadeColor(hex) { return hex; }

/** Δ position: the inspected card's outer top corner. */
function markerAt0(card, fi) { return {x: card.x + (fi === 0 ? 6 : card.w - 6), y: card.y + 2}; }

/** Named context text nodes whose box the lens destination partly (not wholly) covers. */
function partialTexts(ctx, L, fi, dest) {
  if (!ctx.show('all')) return [];
  const G = L.G, M = L.cardM;
  const out = [];
  const inter = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  G.xs.forEach((_, i) => {
    if (i === fi) return;
    const c = G.card(i);
    const text = {x: c.x, y: c.y + M.band, w: c.w, h: M.pad * 0.9 + M.textH};
    const row = {x: c.x, y: c.y + M.h - M.bm - M.rowH, w: c.w, h: M.rowH};
    if (inter(text, dest)) out.push(`st-card${i}-text`);
    if (inter(row, dest)) { if (M.rows[i]) out.push(`st-card${i}-owner`); if (M.open) out.push(`st-card${i}-open`); }
  });
  const hb = L.header.title;
  if (hb && inter(hb.box, dest)) out.push('st-title-text');
  return out;
}

/** The two guide lines of a lens (same rule as frameworks/lens.js). */
function coneSegs(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [[{x: sx, y: S.y}, {x: rx, y: R.y}], [{x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}]];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [[{x: S.x, y: sy}, {x: R.x, y: ry}], [{x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}]];
}
function segHits([a, b], box) {
  for (let i = 1; i < 40; i++) {
    const x = a.x + ((b.x - a.x) * i) / 40, y = a.y + ((b.y - a.y) * i) / 40;
    if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) return true;
  }
  return false;
}
function segCircle([a, b], c) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(a.x + dx * t - c.x, a.y + dy * t - c.y) < c.r;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-10-inspect',
    title: 'Legal team meeting — inspecting one task card and substituting its assignee',
    titleEs: 'Reunión de equipo jurídico — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Reunión de equipo jurídico',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The meeting scene after every task card received a name magnet. A lens enlarges one card; its assignee (or its wording) is struck and replaced by the supplied alternative. For an assignee change the magnet leaves the ring and the owner takes it back to the chest in the context, so the card keeps an empty, dashed slot. The lens closes onto the identical card; a Δ marker and the struck old value stay. Nothing is concluded.',
    tags: ['team meeting', 'task board', 'assignee', 'lens', 'substitution', 'changed marker', 'name magnet'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/reunion-de-equipo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
