/**
 * LAW-0245 — Preparación de demanda · story
 *
 * Storyboard (side view: Party A stands behind a counter, facing right; on the
 * counter a drafting frame holds a column of three trays and, level with each
 * tray, a section of the written filing; the case file stands on the counter
 * or on a wall shelf and a wall calendar shows the supplied day; the action
 * clock c runs from u = 0.15 to u = 0.73):
 *  0.00–0.15  rest: the three supplied pieces (facts, requests, documents — as
 *             configured) stand in their trays; the filing's three sections
 *             are neutral empty slots; names, labels and the key are readable.
 *  0.15–0.42  Party A's hand reaches the bottom piece's edge, pushes it and lets
 *             go: it slides along its runner into its own section; then the
 *             middle one (bottom row first, so the arm — elbow below the
 *             shoulder → hand line — never lies over a piece still in its tray).
 *  0.42–0.73  the top piece follows (finalState "all-sections-filled"); with
 *             finalState "section-pending" the configured pending section has
 *             no piece in its tray and simply stays an empty slot. The hand
 *             returns to the counter (props follow SOLVED hand positions; the
 *             hand pushes each card's edge; no part of the arm covers text).
 *  0.73–1.00  hold: the state tag ("All sections filled" / "Section to
 *             complete", as supplied), the editorial callouts and the
 *             "as supplied · no conclusion drawn" key. Nothing states which
 *             sections a filing needs, a time limit, fee, court or outcome.
 * @module animations/civil-claim/LAW-0245
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {noteCallout} from '../roles/kits/mediation-labels.js';
import {placeTag} from './kits/requerimiento-previo.js';
import {
  PD_DEFAULTS, PD_STRINGS, partyLine, partiesField, documentsField, sectionsField, datesField, stagesField, labelProps, pendingField,
  partyCaption, looksOf, gchip, keyChip, hit, pxPerUnit, solveStage, buildStage, stageChoreo, slotTimes, FIRST_REACH, localizeDefaults,
} from './kits/preparacion-demanda.js';

const ID = 'LAW-0245';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.73;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAG_W = [0.74, 0.8];
const NOTES = [0.78, 0.84];
const TARGETS = ['filing', 'trays', 'caseFile', 'calendar'];
/** design-space text sizes (px at 1080p): baseline ≥ 19.5 (19.8 with a margin); long text may step down to 16.3 */
const BASE_PX = 19.8, MIN_PX = 16.3;

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  sections: sectionsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions (empty = "● name · role")', {a: str('Caption for Party A', 60), b: str('Caption for Party B (printed on the filing’s party line only)', 60)}),
  objectLabels: obj('Labels printed on the props', labelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: every configured section receives its piece, or one configured section stays empty (pendingSection). No legal effect is inferred', ['all-sections-filled', 'section-pending']),
  pendingSection: pendingField,
};

const defaultParams = {
  parties: PD_DEFAULTS.parties,
  documents: PD_DEFAULTS.documents,
  sections: PD_DEFAULTS.sections,
  stages: PD_DEFAULTS.stages,
  dates: PD_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: PD_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'filing', text: 'Each piece slides into its own section'}],
  finalState: 'all-sections-filled',
  pendingSection: 2,
};

// Spanish defaults (the baseline-es preset's values): shown when only `locale: "es"` is set
const DEFAULTS_ES = {
  "parties": [
    {
      "name": "Parte A",
      "role": "Prepara el escrito"
    },
    {
      "name": "Parte B",
      "role": "Nombrada en el escrito"
    }
  ],
  "documents": {
    "caseFile": {
      "ref": "EXP-0520",
      "title": "Expediente · reclamación ficticia"
    },
    "filing": {
      "ref": "Borrador E-0520/1",
      "title": "Escrito de demanda · borrador ficticio"
    }
  },
  "sections": [
    {
      "heading": "Hechos",
      "item": "El paquete ficticio llegó dañado el día 2"
    },
    {
      "heading": "Peticiones",
      "item": "Sustituir el paquete ficticio (según lo aportado)"
    },
    {
      "heading": "Documentos",
      "item": "Albarán D-17 (ficticio)"
    }
  ],
  "dates": {
    "filing": "Fecha: día 6 (según lo aportado)",
    "calendar": "Día 6"
  },
  "stages": {
    "filled": "Todos los apartados rellenos (según lo aportado)",
    "pending": "Apartado por completar (según lo aportado)"
  },
  "objectLabels": {
    "calendar": "Día de redacción"
  },
  "annotations": [
    {
      "target": "filing",
      "text": "Cada pieza se desliza a su propio apartado"
    }
  ]
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    let L = compose(ctx, 0, false);
    // FALLBACK (LAW-0179/0191 precedent): only when the stage with its printed texts does not fit at >= 16 px, the long
    // supplied texts move to a right-hand text column and the props keep their shapes, numbers and filler lines
    if (!L.stageFitted) {
      // (the column's own height also limits the text size: step down until both the stage and the column fit)
      for (let k = 0; k < 5; k++) {
        const Lc = compose(ctx, 0, true, k);
        if (Lc.stageFitted) { L = Lc; break; }
      }
    }
    if (!L.notesClear) {
      // callouts that find no clear spot beside their targets go into a numbered band above the scene
      // (with the band the stage and the column have less height: the text may step down again)
      let L2 = null;
      for (let k = L.tsFrom; k < 5; k++) {
        L2 = compose(ctx, L.noteBandNeed, L.col, k);
        if (L2.fitted) break;
      }
      if (L2.fitted || !L.fitted) L = L2;
    }
    L.stage = buildStage(ctx, L.G, {prefix: 'st', looks: L.looks, supplied: L.supplied, wallX0: -L.ox + 2, wallX1: (L.col ? ctx.design.w - 8 - Math.round(ctx.design.w * 0.3) - 10 : ctx.design.w - 2) - L.ox, wallTop: -L.oy + 4 + L.noteBand});
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

const stageParams = p => ({...p, labels: p.objectLabels});
const suppliedOf = p => [0, 1, 2].map(i => p.finalState !== 'section-pending' || i !== p.pendingSection);

function compose(ctx, noteBand, col, tsFrom = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const pxPer = pxPerUnit(ctx);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const sp = stageParams(p);
  const supplied = suppliedOf(p);
  const looks = looksOf(ctx, p);
  const tsBase = BASE_PX / pxPer, tsMin = MIN_PX / pxPer;
  const tsList = [];
  for (let t = tsBase; t >= tsMin - 1e-6; t -= (tsBase - tsMin) / 4) tsList.push(t);
  tsList.splice(0, Math.min(tsFrom, tsList.length - 1));
  const cap0 = (p.actorLabels.a || partyCaption(p, 0));
  // chips under the counter: the name chip (left) and the key (right) share one band
  const stageW0 = D.w - 16 - (col ? Math.round(D.w * 0.3) + 20 : 0);
  const chipProbe = ts => (showKey ? gchip(ctx, cap0, {x: 0, y: 0, anchor: 'middle', maxWidth: stageW0 * 0.5, size: ts, minSize: ts, maxLines: 6}) : null);
  const keyProbe = ts => (showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: stageW0 * 0.44, size: ts}) : null);
  const bandOf = ts => { const a = chipProbe(ts), b = keyProbe(ts); return a ? Math.max(a.box.h, b.box.h) + 14 : 8; };
  const modes = {landscape: ['calTop', 'calRight'], square: ['calTop', 'calRight'], portrait: ['calTop']}[shape];
  const pending = p.finalState === 'section-pending';
  // room for the state tag: above the frame (all filled) or right of the frame beside the pending section
  const tagText = pending ? p.stages.pending : p.stages.filled;
  const tagProbe = ts => gchip(ctx, tagText, {x: 0, y: 0, anchor: 'start', maxWidth: pending ? ts * (shape === 'portrait' ? 6.5 : 9) : Math.min(D.w * 0.5, ts * 20), size: ts, minSize: ts, maxLines: 6});
  const reserve = ts => (!showKey ? {} : pending ? {reserveRight: tagProbe(ts).box.w} : {reserveTop: tagProbe(ts).box.h});
  const colW = col ? Math.round(D.w * 0.3) : 0;
  const stageW = D.w - 16 - (col ? colW + 20 : 0);
  // (the text column's own height limits the text size: only sizes at which the whole column fits are tried)
  const colItems = col && showAll ? [`${p.documents.filing.ref} · ${p.documents.filing.title}`, partyLine(p), `${p.dates.filing} · ${p.objectLabels.calendar}: ${p.dates.calendar}`, `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`,
    ...p.sections.map((q, i) => (supplied[i] ? `${i + 1} · ${q.heading}: ${q.item}` : `${i + 1} · ${q.heading}`))] : [];
  const colH = t => colItems.reduce((y, it, i) => y + gchip(ctx, it, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: t, minSize: t, maxLines: 8, weight: i === 0 ? 700 : 600}).box.h + 8, 8 + noteBand);
  if (colItems.length) {
    const k = tsList.findIndex(t => colH(t) <= D.h - 8);
    if (k > 0) tsList.splice(0, k);
  }
  const sol = solveStage(ctx, {
    p: sp, availW: stageW, availH: D.h - 12 - noteBand, tsList, modes, showText: showAll, compact: col,
    // (tall frames: larger text is weighed too — the frame's width, not the text floor, limits the stage there)
    tsUp: shape === 'portrait' ? [1.3, 1.2, 1.1].map(k => k * tsBase) : [],
    // (tall frames: the whole figure stands at a drafting stand — two-level staging fills the height)
    fulls: shape === 'portrait' ? [true, false] : [false],
    PKs: [3.4, 3.2, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8, 1.6], xTKs: col ? [74, 92, 110, 128] : [74, 82, 92], cwRange: (col ? [5, 14] : [8, 24]).map(k => k * tsBase), headMinUnits: 60 / pxPer, headMaxUnits: (shape === 'portrait' ? 240 : 170) / pxPer,
    extraH: G => bandOf(G.ts), reserve,
    // (a full-width scene keeps >= 0.72 of the FRAME width; beside the text column >= 0.56 — coordinator thresholds
    // 0.71 / 0.55 with a small margin for the extent’s outer padding)
    minContentW: (col ? 0.556 : 0.745) * ctx.view.width / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h),
  });
  const G = sol.G, ts = G.ts;
  const band = bandOf(ts);
  const E = G.ext;
  const ox = (stageW + 16 - E.w) / 2 - E.x;
  const oy = D.h - 8 - band - G.panelH;   // counter top
  const M = q => ({x: ox + q.x, y: oy + q.y});
  const Mb = b => ({x: ox + b.x, y: oy + b.y, w: b.w, h: b.h});
  const bounds = {x: 6, y: 6 + noteBand, w: stageW + 4, h: D.h - 12 - noteBand};
  // ---- the text column (fallback only): every long supplied text the compact props do not print
  const colChips = [];
  let colFits = true;
  if (col && showAll) {
    const colX = D.w - 8 - colW;
    const items = colItems;
    let y = 8 + noteBand;
    items.forEach((t, i) => {
      const c = gchip(ctx, t, {x: colX, y, anchor: 'start', maxWidth: colW, size: G.ts, minSize: G.ts, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: i === 0 ? 700 : 600, name: `coltx${i}`});
      colChips.push(c);
      y += c.box.h + 8;
    });
    colFits = y <= D.h - 8;
  }

  // ---- occupied boxes (design units): every drawn prop, the person, the chips
  const sheetB = Mb({x: G.xS, y: G.sheetTop - ts * 0.6, w: G.SW + 8, h: G.sheetBottom - G.sheetTop + ts * 0.6});
  const traysB = Mb({x: G.bx0 - 6, y: G.tabTop - 6, w: G.bx1 - G.bx0 + 12, h: -G.tabTop + 6});
  const frameB = Mb({x: G.postL - 10, y: G.frameTop - 6, w: G.frameR - G.postL + 20, h: -G.frameTop + 6});
  const headB = Mb({x: G.headC.x - G.headR - 10, y: G.headTop - 6, w: G.headR * 2 + 40, h: G.headR * 2 + 20});
  const personB = Mb({x: G.personX0, y: G.headTop - 6, w: G.personX1 - G.personX0 + 20, h: -G.headTop + 6});
  const calB = Mb({x: G.cal.x - 4, y: G.cal.y - ts * 0.6, w: G.cal.w + 14, h: G.cal.h + ts * 0.6 + 12});
  // (beside the text column the room — wall and counter — ends where the column begins: no chip sits on the counter)
  const counterB = {x: 0, y: oy - 14, w: col ? D.w - 8 - colW - 10 : D.w, h: G.panelH + 14};
  // the arm's working space (reach and push paths) left of the trays
  const armB = Mb({x: G.grips[0].x - 30, y: Math.min(...G.grips.map(q => q.y)) - 40, w: G.xT - G.grips[0].x + 30 + G.PUSH, h: Math.max(...G.grips.map(q => q.y)) - Math.min(...G.grips.map(q => q.y)) + 80});
  const occupied = [sheetB, traysB, frameB, headB, personB, calB, counterB, armB].filter(Boolean);
  const labelBoxes = [];
  let chip = null, key = null;
  if (showKey) {
    const c0 = chipProbe(ts);
    const cx = clamp(ox, 8 + c0.box.w / 2, D.w - 8 - c0.box.w / 2);
    chip = gchip(ctx, cap0, {x: cx, y: oy + G.panelH + 6, anchor: 'middle', maxWidth: stageW * 0.5, size: ts, minSize: ts, maxLines: 6, name: 'chip-a'});
    key = keyChip(ctx, {x: stageW + 8, y: oy + G.panelH + 6, anchor: 'end', maxWidth: stageW * 0.44, size: ts});
    if (hit(key.box, chip.box, 8)) key = keyChip(ctx, {x: 8, y: oy + G.panelH + 6, anchor: 'start', maxWidth: D.w * 0.4, size: ts});
    occupied.push(chip.box, key.box);
    labelBoxes.push({...chip.box, id: 'chip'}, {...key.box, id: 'key'});
  }

  // ---- the state tag: at the filing's side (all filled) or beside the pending slot
  const tags = {};
  if (showKey) {
    const rows = G.rows;
    const R = (k, fx) => M({x: G.xS + G.SW * fx, y: rows[k].slot.y + rows[k].slot.h * 0.5});
    const anchors = pending
      ? [M({x: G.frameR + 2, y: rows[p.pendingSection].slot.y + rows[p.pendingSection].slot.h * 0.5}), M({x: G.frameR + 2, y: rows[p.pendingSection].slot.y + 10}), M({x: G.frameR + 2, y: rows[p.pendingSection].slot.y + rows[p.pendingSection].slot.h - 10})]
      : [M({x: G.xS + G.SW * 0.5, y: G.frameTop - 6}), M({x: G.xS + G.SW * 0.25, y: G.frameTop - 6}), M({x: G.xS + G.SW * 0.75, y: G.frameTop - 6}), R(0, 1)];
    let best = null;
    for (const a of anchors) {
      const t = placeTag(ctx, {name: 'tag-final', text: tagText, anchor: a, occupied, bounds, maxWidth: pending ? ts * (shape === 'portrait' ? 6.5 : 9) : Math.min(D.w * 0.5, ts * 20), size: ts, color: ctx.theme.accent2, maxLead: 38 / pxPer, narrow: true});
      if (!best || (t.clear && !best.clear)) best = t;
      if (t.clear) break;
    }
    tags['tag-final'] = best;
    occupied.push(best.box);
    labelBoxes.push({...best.box, id: 'tag-final'});
  }

  // ---- editorial callouts: in free space beside their targets (a numbered band above the scene otherwise)
  const notes = [];
  let notesClear = true, noteBandNeed = 0;
  if (showAll && p.annotations.length) {
    // (each target offers a few points on its own element; the first with a clear callout wins)
    const tgts = {
      filing: [M({x: G.xS + G.SW * 0.3, y: G.sheetTop + 4}), M({x: G.xS + 3, y: G.sheetTop + Math.min(G.headerH * 0.5, (G.tabTop - G.sheetTop) * 0.5)}), M({x: G.xS + G.SW - 4, y: G.sheetTop + G.headerH * 0.5}), M({x: G.xS + G.SW * 0.7, y: G.sheetTop + 4})],
      trays: [M({x: G.bx0 + 2, y: G.rows[1].mid}), M({x: G.bx0 + 2, y: G.rows[0].mid})],
      caseFile: [M({x: G.bx1 - G.tabW * 0.5 - ts * 0.3, y: G.tabTop + 2}), M({x: G.bx0 + 2, y: G.plateY + G.plateH / 2})],
      calendar: [M({x: G.cal.x + G.cal.w * 0.5, y: G.cal.y + 2}), M({x: G.cal.x + 2, y: G.cal.y + G.cal.h / 2})],
    };
    const faceZone = {x: headB.x - ts, y: headB.y - ts, w: headB.w + 2 * ts, h: headB.h + 2 * ts};
    for (const [i, a] of p.annotations.entries()) {
      let t = tgts[a.target][0];
      if (noteBand) {
        const y = i === 0 ? 8 : notes[i - 1].box.y + notes[i - 1].box.h + 8;
        const n = gchip(ctx, `${i + 1}  ${a.text}`, {x: 8, y, anchor: 'start', maxWidth: D.w - 16, size: ts, minSize: ts, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
        const R0 = ts * 0.62;
        // the number marks its target from the nearest free spot beside it (never over a prop, a label or a head)
        let mk = null;
        for (const t1 of tgts[a.target]) for (let d = R0 + 6; d <= R0 + 36 / pxPer && !mk; d += R0 * 0.35) {
          for (let a = 0; a < 16; a++) {
            const ang = -Math.PI / 2 + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * Math.PI / 8;
            const c = {x: t1.x + Math.cos(ang) * d, y: t1.y + Math.sin(ang) * d};
            const b = {x: c.x - R0 - 3, y: c.y - R0 - 3, w: 2 * R0 + 6, h: 2 * R0 + 6};
            if (b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h) continue;
            if (occupied.some(o2 => hit(b, o2, 2)) || labelBoxes.some(o2 => hit(b, o2, 2)) || n.box && hit(b, n.box, 2)) continue;
            mk = c; t = t1; break;
          }
          if (mk) break;
        }
        if (!mk) {
          // no free spot beside the target: the band note names its target in words instead (no marker)
          const nn = gchip(ctx, `${ctx.t[`t_${a.target}`]}: ${a.text}`, {x: 8, y: n.box.y, anchor: 'start', maxWidth: D.w - 16, size: ts, minSize: ts, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
          notes.push({node: g({name: `note${i}`, opacity: 0}, nn.node), box: nn.box, fit: nn.fit, frame: q => ({[`note${i}`]: {opacity: r(q, 3)}})});
          labelBoxes.push({...nn.box, id: `note${i}`});
          continue;
        }
        occupied.push({x: mk.x - R0, y: mk.y - R0, w: 2 * R0, h: 2 * R0});
        const lead = Math.hypot(mk.x - t.x, mk.y - t.y) > R0 + 4;
        const node = g({name: `note${i}`, opacity: 0},
          n.node,
          lead ? h('path', {d: `M${r(mk.x + (t.x - mk.x) * R0 / Math.hypot(mk.x - t.x, mk.y - t.y))} ${r(mk.y + (t.y - mk.y) * R0 / Math.hypot(mk.x - t.x, mk.y - t.y))}L${r(t.x)} ${r(t.y)}`, stroke: th.ink, 'stroke-width': 2.5}) : null,
          h('circle', {cx: r(t.x), cy: r(t.y), r: 4.5, fill: th.ink}),
          h('circle', {cx: r(mk.x), cy: r(mk.y), r: r(R0), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
          h('text', {x: r(mk.x), y: r(mk.y + ts * 0.34), 'text-anchor': 'middle', 'font-size': r(ts, 2), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(i + 1)));
        notes.push({node, box: n.box, fit: n.fit, frame: q => ({[`note${i}`]: {opacity: r(q, 3)}})});
        labelBoxes.push({...n.box, id: `note${i}`});
        continue;
      }
      let found = null;
      for (const t0 of tgts[a.target]) for (const [mw, ml] of [[Math.min(520, D.w * 0.46), 3], [Math.min(380, D.w * 0.38), 4], [Math.min(300, D.w * 0.32), 5]]) {
        if (found) break;
        t = t0;
        const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'middle', target: t, maxWidth: mw, size: ts, minSize: ts, maxLines: ml});
        if (probe.fit.truncated) continue;
        const pw = probe.box.w, ph = probe.box.h;
        const cands = [];
        for (let dy = -700; dy <= 420; dy += 20) for (let dx = -700; dx <= 700; dx += 30) cands.push({x: t.x + dx, y: t.y + dy});
        cands.sort((q1, q2) => Math.hypot(q1.x - t.x, q1.y - t.y) - Math.hypot(q2.x - t.x, q2.y - t.y));
        for (const q of cands) {
          const box = {x: q.x - pw / 2, y: q.y, w: pw, h: ph};
          const d = Math.hypot(box.x + pw / 2 - t.x, (t.y < box.y ? box.y : t.y > box.y + ph ? box.y + ph : t.y) - t.y);
          if (d < 30 || d > 520) continue;
          if (box.x < bounds.x || box.y < bounds.y || box.x + pw > bounds.x + bounds.w || box.y + ph > bounds.y + bounds.h) continue;
          if (occupied.some(o2 => hit(box, o2, 8)) || hit(box, faceZone, 0)) continue;
          // the leader (chip edge → target) crosses no occupied box other than the target's own
          const from = {x: clamp(t.x, box.x + 12, box.x + pw - 12), y: t.y > box.y + ph ? box.y + ph : t.y < box.y ? box.y : box.y + ph / 2};
          const inB = (pt, z) => pt.x > z.x + 1 && pt.x < z.x + z.w - 1 && pt.y > z.y + 1 && pt.y < z.y + z.h - 1;
          const blocked = occupied.filter(z => !inB(t, z) && !(t.x >= z.x - 2 && t.x <= z.x + z.w + 2 && t.y >= z.y - 2 && t.y <= z.y + z.h + 2)).some(z => Array.from({length: 19}, (_, j) => (j + 1) / 20).some(k => inB({x: from.x + (t.x - from.x) * k, y: from.y + (t.y - from.y) * k}, z)));
          if (blocked) continue;
          found = {q, mw, ml, t};
          break;
        }
      }
      if (!found) { notesClear = false; continue; }
      const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: found.q, anchor: 'middle', target: found.t, maxWidth: found.mw, size: ts, minSize: ts, maxLines: found.ml});
      occupied.push(n.box);
      labelBoxes.push({...n.box, id: `note${i}`});
      notes.push(n);
    }
    if (!notesClear) {
      const hs = p.annotations.map((a, i) => gchip(ctx, `${i + 1}  ${a.text}`, {x: 0, y: 0, anchor: 'start', maxWidth: D.w - 16, size: ts, minSize: ts, maxLines: 4}).box.h);
      noteBandNeed = hs.reduce((a, b) => a + b + 8, 8) + 4;
    }
  }
  const clashes = [];
  labelBoxes.forEach((b, i) => labelBoxes.forEach((c, j) => { if (j > i && hit(b, c, 2)) clashes.push(`${b.id}/${c.id}`); }));
  const truncated = [...colChips.map(c => c.fit), ...(G.compact ? [] : [...G.itemFits, ...G.headFits]), ...(G.hf ? Object.values(G.hf) : []), G.cfTitle, G.cfRef, G.calTitle, G.calDay, chip && chip.fit, key && key.fit, ...Object.values(tags).map(t => t.fit), ...notes.map(n => n.fit)]
    .filter(f => f && f.truncated).map(f => f.full);
  return {
    diag: sol.diag, col, tsFrom, colChips, stageFitted: sol.fitted && colFits, G, ts, ox, oy, M, supplied, looks, chip, key, tags, notes, notesClear, noteBandNeed, noteBand, fitted: sol.fitted && colFits && (notesClear || Boolean(noteBand)),
    labelsClear: clashes.length === 0, clashes, truncated, labelBoxes, headBox: headB, pxPer,
    textPx: r(ts * pxPer, 2), wall: {x0: -ox + 0, x1: D.w - ox, top: -oy + 0},
  };
}

function buildScene(ctx, L) {
  return g(null,
    g({name: 'st-root', transform: T(L.ox, L.oy)}, L.stage.node),
    L.chip && L.chip.node,
    L.key && L.key.node,
    Object.values(L.tags).map(t => t.node),
    L.notes.map(n => n.node),
    L.colChips.map(c => c.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const G = L.G;
  const cRaw = (u - C0) / (C1 - C0);
  const c = clamp(cRaw, FIRST_REACH, p.actionProgress);
  const v = stageChoreo(c, G, L.supplied);
  const posed = L.stage.pose(v);
  const nodes = posed.nodes;
  const done = p.actionProgress >= 1;
  const tagP = done ? seg(u, ...TAG_W) : 0;
  if (L.tags['tag-final']) nodes['tag-final'] = {opacity: r(tagP, 3)};
  const noteP = done ? seg(u, ...NOTES) : 0;
  L.notes.forEach(n => {
    const f = n.frame(noteP);
    // (each leader and its target dot appear with their chip, never before it)
    const chipKey = Object.keys(f).find(k => k.endsWith('-chip'));
    if (chipKey) {
      const base = chipKey.slice(0, -5), chipO = f[chipKey].opacity;
      if (f[`${base}-lead`]) f[`${base}-lead`] = {...f[`${base}-lead`], opacity: r(chipO, 3)};
      if (f[`${base}-dot`]) f[`${base}-dot`] = {opacity: f[`${base}-dot`].opacity ? r(chipO, 3) : 0};
    }
    Object.assign(nodes, f);
  });
  const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
  const W = q => ({x: r(L.ox + q.x), y: r(L.oy + q.y)});
  const grips = [0, 1, 2].map(k => W({x: G.grips[k].x + v.dx[k], y: G.grips[k].y}));
  const filled = v.landed.filter(Boolean).length;
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), finalState: p.finalState, supplied: L.supplied,
      handA: W(posed.hands.near), head: W(posed.head), lean: r(v.lean, 2),
      card0: W(v.cardEdge[0]), card1: W(v.cardEdge[1]), card2: W(v.cardEdge[2]),
      grip0: grips[0], grip1: grips[1], grip2: grips[2],
      pushing: v.pushing, landed: v.landed, filled, sectionsEmpty: 3 - filled,
      tag: r(tagP, 3), notes: r(noteP, 3),
      allReached: posed.reached,
      actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
      fitted: L.fitted, stageFitted: L.stageFitted, notesClear: L.notesClear, noteBand: L.noteBand, labelsClear: L.labelsClear, clashes: L.clashes, truncated: L.truncated, textPx: L.textPx, textColumn: L.col,
      PK: r(G.PK, 2), cardW: r(G.CW, 1), mode: G.mode,
      labelsOffHead: L.labelBoxes.every(b => !hit(b, L.headBox, 0)),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-02-story',
    title: 'Preparing a claim — facts, requests and documents slide into the sections of a written filing',
    titleEs: 'Preparación de demanda — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Preparación de demanda',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view: Party A stands at a drafting frame on a counter. Three trays hold the supplied pieces (facts, requests, documents — as configured); level with each tray a section of the written filing waits as a neutral empty slot. Party A pushes each piece by its edge and it slides along its runner into its section. With finalState "section-pending" the configured section has no piece and stays empty (a neutral slot, not a defect). The case file and a wall calendar with the supplied day complete the room. Nothing states which sections a filing needs, any time limit, fee, court or consequence.',
    tags: ['claim preparation', 'written filing', 'facts', 'requests', 'documents', 'trays', 'sections', 'case file', 'calendar', 'party A'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/preparacion-demanda.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PD_STRINGS,
  scene,
});
