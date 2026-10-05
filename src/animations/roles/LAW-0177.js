/**
 * LAW-0177 — Representación de una parte · story
 *
 * Storyboard (side view of a small office: waiting side on the left, service
 * counter with a seated clerk on the right; the action clock c runs from
 * u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the client (Party A) and the representative stand at a
 *             small round table; the form stands in a letter stand on the
 *             table; a badge reel is pinned on the client's chest and a lanyard
 *             badge hangs on the representative. The clerk waits behind the
 *             counter. Names, the form and the counter sign are readable.
 *  0.15–0.42  the link (only when a link is supplied): the client pulls the
 *             ribbon clip out of the reel and passes it over the table; the
 *             representative takes it at the same point and clips it to the
 *             badge — the ribbon now joins them. The client lifts the form and
 *             the representative takes its other edge.
 *  0.42–0.73  the representative turns round with the form, walks to the
 *             counter (the ribbon stays taut, paying out from the reel), holds
 *             the form out and speaks (speech bubble); the clerk puts a hand on
 *             it and it is let go into the tray.
 *             Own action (performer = client): no clip is passed; the client
 *             picks the form up, walks to the counter and hands it over.
 *  0.73–1.00  hold: the supplied final state (received in the tray, or still
 *             presented), a tag naming who performed the act (own /
 *             represented action, as supplied), the link label on the ribbon
 *             and the "as supplied · no conclusion drawn" key. Nothing states
 *             that the representation is valid, sufficient or binding.
 * @module animations/roles/LAW-0177
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {noteCallout, placeClear} from './kits/mediation-labels.js';
import {
  REP_DEFAULTS, REP_STRINGS, ST, actorsField, rolesField, docPropsFields, relationshipItem,
  linkOf, captionOf, looksOf, repStage, choreo, bubble, keyChip, actionTag, FLAT, farPt, wordSafe, hit, numberedNote,
} from './kits/representacion-de-una-parte.js';
import {wchip} from './kits/mediation-labels.js';

const ID = 'LAW-0177';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** action clock: c = (u − 0.15) / 0.65 (c = 1 at u = 0.80) */
const C0 = 0.15, C1 = 0.8;
const TAGS = [0.8, 0.85];
const NOTES = [0.82, 0.9];
/** base text size (design units) per layout so key text is ≥ 19.5 px at 1080p */
const SIZE = {landscape: 25, portrait: 21, square: 30};
const CHIP_MAX = {landscape: 420, portrait: 330, square: 440};
const TARGETS = ['ribbon', 'form', 'counter'];
/** 9:16 depth layout: the counter side stands further back (raised, 0.62×). */
const DEPTH = {k: 0.8, fx: 88, fy: -440};
const DEPTH_W = 950;
/** 16:9: the counter side is moved further right (a longer walk fills the wide frame). */
const WIDE = {k: 1, fx: 170, fy: 0};

const sceneSchema = {
  actors: actorsField,
  roles: rolesField,
  relationships: list('The supplied link between the representative and the client, drawn as the ribbon that joins them (empty = no link is drawn)', relationshipItem, 0, 1),
  performer: oneOf('Who performs the act at the counter, as supplied: the representative (represented action) or the client themself (own action)', ['representative', 'client']),
  props: obj('Props', {...docPropsFields, speech: str('What the person at the counter says (speech bubble; empty = abstract lines)', 60)}),
  actorLabels: obj('Chip captions under each person (empty = "name · role")', {
    client: str('Caption for the client', 60), representative: str('Caption for the representative', 60), clerk: str('Caption for the clerk', 60),
  }),
  objectLabels: obj('Tag naming who performs the act (shown in the hold for the supplied performer)', {
    ownAction: str('Tag when the client acts themself', 50), representedAction: str('Tag when the representative acts', 50),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: the form was received (rests in the counter tray) or is still being presented. No legal effect is inferred', ['received', 'presented']),
};

const defaultParams = {
  actors: REP_DEFAULTS.actors,
  roles: REP_DEFAULTS.roles,
  relationships: [REP_DEFAULTS.link],
  performer: 'representative',
  props: {...REP_DEFAULTS.docProps, speech: 'I am here for Alex Moreno'},
  actorLabels: {client: '', representative: '', clerk: ''},
  objectLabels: {ownAction: 'Own action', representedAction: 'Represented action'},
  actionProgress: 1,
  annotations: [{target: 'ribbon', text: 'The ribbon shows the supplied link'}],
  finalState: 'received',
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    // first pass: callouts in free space inside the scene; if one cannot be placed clear of
    // the figures and labels, a callout band is reserved above the scene (the scene shrinks)
    const L = compose(ctx, 0);
    if (L.notesClear) return L;
    // cap the band so the scene keeps at least 92 % of its size (the form's text must still fit)
    // the band holds the numbered notes (two columns on wide/square boxes)
    const cols = ctx.params.annotations.length > 1 && ctx.view.shape !== 'portrait' ? 2 : 1;
    const r1 = cols > 1 ? Math.max(...L.noteHeights) + 16 : L.need;
    return compose(ctx, r1);
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

function compose(ctx, reserve) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const B = SIZE[shape];
    const plan = p.performer === 'client' ? 'own' : 'represented';
    const link = linkOf(p.relationships);
    const linked = Boolean(link);
    const perfKey = plan === 'own' ? 'client' : 'rep';
    const looks = looksOf(ctx, p);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const cap = id => p.actorLabels[id] || captionOf(p, id);
    const chipMax = CHIP_MAX[shape];
    const mkChip = (id, x, y, name) => wchip(ctx, cap(id), {x, y, anchor: 'middle', maxWidth: chipMax, size: B, minSize: B * 0.8, maxLines: 3, name});
    // 9:16: the counter stands at the back of the room (depth layout); otherwise a flat side view
    const far = shape === 'portrait' ? DEPTH : shape === 'landscape' ? WIDE : FLAT;
    const stageW = shape === 'portrait' ? DEPTH_W : ST.W + far.fx;
    const stageTop = far === FLAT ? ST.top : far.fy + (ST.top + 40) * far.k - 20;
    const stageTopY = stageTop;
    const stageH = -stageTop;
    const F = q => farPt(far, q);
    const standP = F({x: ST.standX, y: 0});
    const clerkP = F({x: ST.clerkX - 20, y: 0});
    const startP = {client: {x: ST.clientX, y: 0, k: 1}, rep: {x: ST.repX0, y: 0, k: 1}, clerk: {...clerkP, k: far.k}};
    const finalP = {
      client: plan === 'own' ? {...standP, k: far.k} : startP.client,
      rep: plan === 'represented' ? {...standP, k: far.k} : startP.rep,
      clerk: startP.clerk,
    };

    // ---- key chip and chip rows (measured first; they size the stage)
    const keyMax = shape === 'landscape' ? 300 : D.w - 16;
    const probeKey = showKey ? keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: keyMax, size: B * 0.8, maxLines: 2}) : null;
    const probe = showKey ? {client: mkChip('client', 0, 0), rep: mkChip('representative', 0, 0), clerk: mkChip('clerk', 0, 0)} : null;
    // depth layout (9:16): the performer walks up into the room, so the name tags stay in a band under
    // the front floor and a live leader ties each one to its person (tags never cross each other or the
    // carried form); flat layouts: tags ride under each person's feet
    const staticChips = far !== FLAT;
    const flowChips = () => {
      const out = {}, gap = 14;
      let x = 8, row = 0, rowTop = 0, rowH = 0;
      for (const key of ['client', 'rep', 'clerk']) {
        const w = probe[key].box.w, hh = probe[key].box.h;
        if (x > 8 && x + w > D.w - 8) { row++; rowTop += rowH + 10; x = 8; rowH = 0; }
        out[key] = {x, dy: rowTop, w, h: hh};
        x += w + gap;
        rowH = Math.max(rowH, hh);
      }
      return {slots: out, h: rowTop + rowH};
    };
    const rowsFor = sc => {
      // chips move with their person; two chips share a row only if their swept ranges never meet
      const rows = {}, band = [], rowH = [0, 0, 0];
      if (!probe) return {rows, rowH, nearBand: 4};
      if (staticChips) return {rows, rowH, nearBand: flowChips().h + 30};
      for (const key of ['client', 'rep', 'clerk']) {
        const half = probe[key].box.w / 2 + 12;
        const sw = {x0: Math.min(startP[key].x, finalP[key].x) * sc - half, x1: Math.max(startP[key].x, finalP[key].x) * sc + half};
        let row = key === 'rep' ? 1 : 0;
        while (band[row] && band[row].some(q => !(sw.x1 < q.x0 || q.x1 < sw.x0))) row++;
        (band[row] = band[row] || []).push(sw);
        rows[key] = row;
        rowH[row] = Math.max(rowH[row], probe[key].box.h);
      }
      // rows under the front floor: every chip that starts there (the clerk's may sit at the back)
      const near = ['client', 'rep', ...(far === FLAT ? ['clerk'] : [])];
      const used = [0, 1, 2].filter(i => near.some(k => rows[k] === i));
      const nearBand = used.length ? Math.max(...used.map(i => rowH.slice(0, i + 1).reduce((a, b) => a + (b ? b + 8 : 0), 0))) + 12 : 4;
      return {rows, rowH, nearBand};
    };
    let fs = rowsFor(1);
    // a reserved callout band always starts below the key
    let topBand = (shape === 'landscape' && !reserve ? 0 : (probeKey ? probeKey.box.h + 16 : 0)) + reserve;
    const bandY0 = topBand - reserve + 8;
    const scaleFor = () => Math.min((D.w - 16) / stageW, (D.h - fs.nearBand - 6 - topBand) / stageH);
    let s = scaleFor();
    fs = rowsFor(s);
    s = scaleFor();
    // wide boxes: the key goes in the side margin when it fits there, else on a top band
    if (shape === 'landscape' && probeKey && (D.w - stageW * s) / 2 < probeKey.box.w + 16) {
      topBand = probeKey.box.h + 12 + reserve;
      s = scaleFor();
    }
    fs = rowsFor(s);
    const ox = (D.w - stageW * s) / 2;
    const oy = D.h - fs.nearBand - 2; // front floor line in design units
    const M = q => ({x: ox + q.x * s, y: oy + q.y * s});
    const Mbox = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
    const Fbox = b => Mbox({x: far.fx + b.x * far.k, y: far.fy + b.y * far.k, w: b.w * far.k, h: b.h * far.k});

    const stage = repStage(ctx, {
      prefix: 'st', looks, plan, linked, far, width: stageW, doc: {title: p.props.document, id: p.props.documentId},
      // the form's text is sized for where it ends (at the back in the depth layout)
      docSize: B / (s * far.k), docMin: (B * 0.8) / (s * far.k), idMin: (B * 0.75) / (s * far.k), sign: p.props.counterSign, signSize: B / s, showText: showAll, ribbonColor: th.accent3,
    });
    const stop = p.finalState === 'presented' ? 'presented' : 'received';
    const end = stage.pose(choreo(plan, 1, {linked, stop, far}));

    // ---- chips: under each person's feet, translated per frame with them (flat), or static with a
    //      live leader to the person (depth)
    const chips = {};
    const chipFinal = [];
    const leaders = {};
    if (probe && staticChips) {
      const fl = flowChips();
      for (const [key, id] of [['client', 'client'], ['rep', 'representative'], ['clerk', 'clerk']]) {
        const sl = fl.slots[key];
        const chip = wchip(ctx, cap(id), {x: sl.x, y: oy + 26 + sl.dy, anchor: 'start', maxWidth: chipMax, size: B, minSize: B * 0.8, maxLines: 3, name: `chip-${key}`});
        chips[key] = {chip, p0: startP[key], static: true};
        chipFinal.push(chip.box);
        leaders[key] = {from: {x: chip.box.x + chip.box.w / 2, y: chip.box.y}};
      }
    } else if (probe) {
      const rowOff = [0];
      for (let i = 1; i < 3; i++) rowOff[i] = rowOff[i - 1] + (fs.rowH[i - 1] ? fs.rowH[i - 1] + 8 : 0);
      for (const [key, id] of [['client', 'client'], ['rep', 'representative'], ['clerk', 'clerk']]) {
        const w = probe[key].box.w;
        const a = M(startP[key]), z = M(finalP[key]);
        const shift = Math.max(0, 8 + w / 2 - Math.min(a.x, z.x)) - Math.max(0, Math.max(a.x, z.x) + w / 2 + 8 - D.w);
        const chip = mkChip(id, a.x + shift, a.y + 12 + rowOff[fs.rows[key]], `chip-${key}`);
        chips[key] = {chip, p0: startP[key]};
        chipFinal.push({x: chip.box.x + z.x - a.x, y: chip.box.y + z.y - a.y, w: chip.box.w, h: chip.box.h});
      }
    }

    // ---- occupied boxes at the hold (design units)
    const fig = q => Mbox({x: q.x - 62 * q.k, y: q.y - 420 * q.k, w: 124 * q.k, h: 420 * q.k});
    const occupied = [
      fig(finalP.client), fig(finalP.rep), Fbox({x: ST.clerkX - 45, y: -400, w: 125, h: 400}),
      Fbox({x: ST.counter.x0 - 8, y: ST.counter.top, w: ST.counter.x1 - ST.counter.x0 + 16, h: -ST.counter.top}),
      Mbox({x: ST.table.x - 64, y: ST.table.top - 12, w: 128, h: -ST.table.top + 12}),
      Fbox(stage.sign.box),
      ...chipFinal,
    ];
    if (far.k === 1) occupied.push({...Mbox({x: ST.clientX + 104, y: -566, w: 242, h: 162}), decor: true}); // window art
    const labelBoxes = () => occupied.filter(b => b.label);
    for (const c of chipFinal) c.label = true;
    const sheetC = end.semantic.sheet;
    const ks = end.semantic.sheetScale;
    const sheetBox = Mbox({x: sheetC.x - (ST.sheet.w / 2 + 6) * ks, y: sheetC.y - (ST.sheet.h / 2 + 6) * ks, w: (ST.sheet.w + 12) * ks, h: (ST.sheet.h + 12) * ks});
    sheetBox.label = true;
    occupied.push(sheetBox);
    const bounds = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};

    // key: top-left (side margin on wide boxes), else top-right
    let key = null;
    if (probeKey) {
      const cands = [[8, 8, 'start'], [D.w - 8, 8, 'end']].map(([x, y, anchor]) => keyChip(ctx, ctx.t.key, {x, y, anchor, maxWidth: keyMax, size: B * 0.8, maxLines: 2, name: 'key'}));
      key = placeClear(cands, occupied, bounds, 6);
      key.box.label = true;
    occupied.push(key.box);
    }

    // speech bubble above the performer's head, on the side away from the counter sign
    const mouth = M(end.mouth[perfKey]);
    const head = M(end.tops[perfKey]);
    const kP = finalP[perfKey === 'rep' ? 'rep' : 'client'].k;
    const bub = bubble(ctx, {name: 'bubble', text: p.props.speech, size: B, minSize: B * 0.8, maxLines: 3,
      x: mouth.x + 26 * s * kP, anchor: 'end', bottom: head.y - 16 * s * kP, tip: {x: mouth.x - 4 * s * kP, y: mouth.y - 6 * s * kP},
      maxWidth: Math.min(shape === 'portrait' ? D.w * 0.62 : 560, mouth.x + 26 * s * kP - 12)});
    bub.box.label = true;
    occupied.push(bub.box);

    // tags: who performed the act (above the bubble) and the final state (above the form)
    let tagAct = null, tagState = null, ribbonTag = null;
    if (showKey) {
      const perfColor = plan === 'own' ? th.accent4 : th.accent2;
      const actText = plan === 'own' ? p.objectLabels.ownAction : p.objectLabels.representedAction;
      const mk = (x, y, anchor) => actionTag(ctx, actText, {x, y, anchor, maxWidth: shape === 'portrait' ? D.w * 0.7 : 480, size: B, color: perfColor, name: 'tag-act'});
      const b0 = bub.box;
      const t0 = mk(0, 0, 'middle');
      tagAct = placeClear([
        mk(b0.x + b0.w / 2, b0.y - t0.box.h - 10, 'middle'), mk(b0.x, b0.y - t0.box.h - 10, 'start'), mk(b0.x + b0.w, b0.y - t0.box.h - 10, 'end'),
        mk(b0.x - 12, b0.y, 'end'), mk(b0.x + b0.w / 2, b0.y - t0.box.h - 60, 'middle'),
      ], occupied, bounds, 6);
      tagAct.box.label = true;
    occupied.push(tagAct.box);
      const stText = stop === 'presented' ? ctx.t.presented : ctx.t.received;
      const tipS = {x: sheetBox.x + sheetBox.w / 2, y: sheetBox.y + 6 * s};
      const mks = (x, y, anchor, mw) => wchip(ctx, stText, {x, y, anchor, maxWidth: mw ?? (shape === 'portrait' ? D.w * 0.6 : 420), size: B * 0.8, minSize: B * 0.8, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.accent4, weight: 700, name: 'tag-state'});
      const s0 = mks(0, 0, 'middle');
      const above = sheetBox.y - s0.box.h - 14;
      const cBox = Fbox({x: ST.counter.x0 + 4, y: ST.counter.top + 30, w: ST.counter.x1 - ST.counter.x0 - 8, h: 10});
      tagState = placeClear([
        ...[0, -40, -80, 40, -120, -160].map(dx => mks(tipS.x + dx * s, above, 'middle')),
        mks(cBox.x + cBox.w / 2, cBox.y, 'middle', cBox.w),
        mks(tipS.x, sheetBox.y + sheetBox.h + 10, 'middle'),
        mks(D.w - 8, above - 40, 'end'),
      ].filter(q => !q.fit.truncated && wordSafe(q.fit)), occupied.filter(q => q !== occupied[3]), bounds, 6);
      tagState.box.label = true;
    occupied.push(tagState.box);
      {
        const b = tagState.box;
        const top = {x: clamp(b.x + b.w / 2, sheetBox.x + 10, sheetBox.x + sheetBox.w - 10), y: b.y + b.h < sheetBox.y ? sheetBox.y + 4 : b.y > sheetBox.y + sheetBox.h ? sheetBox.y + sheetBox.h - 4 : b.y + b.h / 2};
        const from = {x: clamp(top.x, b.x + 12, b.x + b.w - 12), y: top.y < b.y ? b.y : top.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2};
        tagState.lead = Math.hypot(top.x - from.x, top.y - from.y) > 6
          ? h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(top.x)} ${r(top.y)}`, stroke: th.accent4, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null;
      }
      // the supplied link: a tag hung on the ribbon (only when a link is supplied)
      if (linked && link.label) {
        const mid = M(end.ribbonMid);
        const mkr = (x, y, mw) => wchip(ctx, link.label, {x, y, anchor: 'middle', maxWidth: mw, size: B, minSize: B * 0.8, maxLines: 3, fill: th.card, stroke: th.accent3, color: th.ink, weight: 600, name: 'tag-link-chip'});
        const cands = [];
        const widths = (shape === 'landscape' ? [560, 420, 320, 260] : [D.w * 0.62, D.w * 0.46, D.w * 0.34, D.w * 0.27]).filter(w => w >= B * 7);
        for (let dy = 30; dy <= 380; dy += 16) {
          for (const mw of widths) {
            const r0 = mkr(0, 0, mw);
            if (r0.fit.truncated) continue;
            for (const dx of [0, -20, 20, -40, 40, -70, 70, -110, 110, -160, 160]) cands.push(mkr(mid.x + dx * s, mid.y - dy * s - r0.box.h, mw));
          }
        }
        for (let dy = 30; dy <= 200; dy += 16) for (const dx of [0, -60, 60]) cands.push(mkr(mid.x + dx * s, mid.y + dy * s, widths[0]));
        const best = placeClear(cands, occupied, bounds, 6);
        best.box.label = true;
        occupied.push(best.box);
        const b = best.box;
        const from = {x: clamp(mid.x, b.x + 16, b.x + b.w - 16), y: mid.y < b.y ? b.y : b.y + b.h};
        ribbonTag = {node: g({name: 'tag-link', opacity: 0},
          h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(mid.x)} ${r(mid.y)}`, stroke: th.accent3, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}),
          h('circle', {cx: r(mid.x), cy: r(mid.y), r: 6, fill: th.accent3, stroke: th.ink, 'stroke-width': 2}),
          best.node), box: b};
      }
    }

    // editorial callouts in free space; leaders reach the real target without crossing a label or figure
    const notes = [];
    let notesClear = true;
    let need = 12;
    if (showAll) {
      const tgt = {
        ribbon: linked ? M(end.ribbonMid) : M(end.semantic.reel),
        form: {x: sheetBox.x + sheetBox.w / 2, y: sheetBox.y + 8 * s},
        counter: M(F({x: (ST.counter.x0 + ST.counter.x1) / 2, y: -110})),
      };
      const inBox = (q, b) => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2;
      const leaderClear = (bx, t) => {
        const from = {x: clamp(t.x, bx.x + 12, bx.x + bx.w - 12), y: t.y > bx.y + bx.h ? bx.y + bx.h : t.y < bx.y ? bx.y : bx.y + bx.h / 2};
        if (from.y === bx.y + bx.h / 2) from.x = t.x > bx.x + bx.w / 2 ? bx.x + bx.w : bx.x;
        const obs = occupied.filter(o2 => !inBox(t, o2));
        for (let i = 1; i < 16; i++) {
          const q = {x: from.x + (t.x - from.x) * i / 16, y: from.y + (t.y - from.y) * i / 16};
          if (obs.some(o2 => inBox(q, o2))) return false;
        }
        return Math.hypot(t.x - from.x, t.y - from.y) < (shape === 'portrait' ? 520 : 420);
      };
      for (const [i, a] of p.annotations.entries()) {
        const t = tgt[a.target];
        const mw = shape === 'landscape' ? 440 : D.w * 0.62;
        const cands = [];
        for (let dy = -560; dy <= 560; dy += 26) for (let dx = -720; dx <= 720; dx += 48) cands.push({x: t.x + dx, y: t.y + dy});
        cands.sort((q1, q2) => Math.hypot(q1.x - t.x, q1.y - t.y) - Math.hypot(q2.x - t.x, q2.y - t.y));
        const built = [];
        for (const q of cands) {
          const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: q, anchor: 'middle', target: t, maxWidth: mw, size: B, minSize: B * 0.8, maxLines: 3});
          if (Math.hypot(n.box.x + n.box.w / 2 - t.x, n.box.y + n.box.h / 2 - t.y) < 50) continue;
          if (!leaderClear(n.box, t)) continue;
          built.push(n);
          if (built.length > 700) break;
        }
        let best;
        if (reserve > 0) {
          // band mode: numbered notes side by side in the reserved band; a matching number marks the target
          const cols = p.annotations.length > 1 && shape !== 'portrait' ? 2 : 1;
          const colW = (D.w - 16 - (cols - 1) * 12) / cols;
          const col = cols > 1 ? i : 0;
          const prevBottom = cols > 1 || i === 0 ? bandY0 : notes[i - 1].box.y + notes[i - 1].box.h + 10;
          best = numberedNote(ctx, {name: `note${i}`, text: a.text, n: i + 1, x: 8 + col * (colW + 12), y: prevBottom, maxWidth: colW, size: B * 0.9, minSize: B * 0.8, maxLines: 3, target: t});
        } else {
          best = placeClear(built.length ? built : [noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: D.w / 2, y: 8}, anchor: 'middle', target: t, maxWidth: mw, size: B, minSize: B * 0.8, maxLines: 3})], occupied, bounds, 8);
        }
        const clear = reserve > 0 || (built.length > 0 && !occupied.some(o2 => hit(best.box, o2, 6)));
        best.box.label = true;
        if (!clear) notesClear = false;
        need += best.box.h + 12;
        occupied.push(best.box);
        notes.push(best);
      }
    }

    const truncated = [bub.fit, ...Object.values(chips).map(c => c.chip.fit), key && key.fit, tagAct && tagAct.fit, tagState && tagState.fit, stage.sheet.fitTitle, stage.sheet.fitId, stage.sign.fit, ...notes.map(n => n.fit)]
      .filter(f => f && (f.truncated || f.overflow)).map(f => f.full);
    return {stage, s, ox, oy, M, far, chips, leaders, key, bub, tagAct, tagState, ribbonTag, notes, notesClear: notesClear || reserve > 0, need, reserve, noteHeights: notes.map(n => n.box.h * 1.25), plan, linked, stop, perfKey, rows: fs.rows, truncated};
}

function buildScene(ctx, L) {
    return g(null,
      g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node),
      Object.entries(L.leaders).map(([k, q]) => h('line', {name: `chiplead-${k}`, x1: r(q.from.x), y1: r(q.from.y), x2: r(q.from.x), y2: r(q.from.y), stroke: ctx.theme.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round'})),
      Object.entries(L.chips).map(([k, c]) => g({name: `chipg-${k}`}, c.chip.node)),
      L.ribbonTag && L.ribbonTag.node,
      L.bub.node,
      L.tagAct && g({name: 'tag-act-g', opacity: 0}, L.tagAct.node),
      L.tagState && g({name: 'tag-state-g', opacity: 0}, L.tagState.lead, L.tagState.node),
      L.notes.map(n => n.node),
      L.key && L.key.node,
    );
}

function frameScene(ctx, L, u) {
    const p = ctx.params;
    const cRaw = (u - C0) / (C1 - C0);
    const c = clamp(cRaw, 0, p.actionProgress);
    const v = choreo(L.plan, c, {linked: L.linked, stop: L.stop, reduced: ctx.reduced, far: L.far});
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const at = {client: v.client, rep: v.rep};
    const feet = {};
    for (const k of Object.keys(L.chips)) {
      const q = at[k] || L.chips[k].p0;
      const p0 = L.chips[k].p0;
      if (L.chips[k].static) {
        // the leader ends at the person's feet wherever they are
        const f = L.M({x: q.x, y: (q.y ?? 0) - 6});
        feet[k] = {x: r(f.x), y: r(f.y)};
        nodes[`chiplead-${k}`] = {x2: r(f.x), y2: r(f.y)};
      } else nodes[`chipg-${k}`] = {transform: T((q.x - p0.x) * L.s, ((q.y ?? 0) - p0.y) * L.s)};
    }
    const done = p.actionProgress >= 1;
    const bubbleOn = clamp((c - 0.76) / 0.04);
    nodes.bubble = {opacity: r(bubbleOn, 3)};
    const tagP = done ? seg(u, ...TAGS) : 0;
    if (L.tagAct) nodes['tag-act-g'] = {opacity: r(tagP, 3)};
    if (L.tagState) nodes['tag-state-g'] = {opacity: r(tagP, 3)};
    if (L.ribbonTag) nodes['tag-link'] = {opacity: r(tagP, 3)};
    const noteP = done ? seg(u, ...NOTES) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        clock: r(c, 4),
        plan: L.plan,
        performer: p.performer,
        linkSupplied: L.linked,
        finalState: p.finalState,
        bubble: r(bubbleOn, 3),
        tags: r(tagP, 3),
        actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
        chipRows: L.rows,
        staticChips: Object.values(L.chips).some(c => c.static),
        leaderFeet: feet,
        truncated: L.truncated,
      },
    };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-05-story',
    title: 'Representing a party — a ribbon joins the client to the person acting for them',
    titleEs: 'Representación de una parte — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Representación de una parte',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a small office. The client pulls the ribbon clip from a badge reel and passes it over a table to the representative, who clips it to a lanyard badge; the client hands over the form; the representative turns, walks to the counter with the ribbon paying out behind and hands the form over while speaking. With the client as performer (own action) the client walks up and hands it over. The link and the performer are supplied data; no validity or effect is shown.',
    tags: ['representation', 'representative', 'client', 'ribbon', 'link', 'counter', 'form', 'walk', 'hand-over', 'speech bubble', 'own action', 'represented action'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/representacion-de-una-parte.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: REP_STRINGS,
  scene,
});
