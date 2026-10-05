/**
 * LAW-0248 — Preparación de demanda · inspect
 *
 * Storyboard (context = the state produced by the story: Party A at the
 * drafting frame, every configured piece in its section of the written filing).
 * The context fills the frame at full size at rest and at the hold. While the
 * lens is open at least 0.45 of the frame always shows context:
 *  - tall frames: the lens opens over the dimmed context where it covers little
 *    (the texts under the window step out while it is open);
 *  - wide frames ("aside") and square frames ("stack" or "aside"): the context
 *    steps back — its texts step out first, then it shrinks (0.31–0.40) to
 *    >= 0.47 of the frame width, into a band at the top or the left part — and
 *    the lens opens large in the freed room, flush away from the person, never
 *    over a face; the context grows back 0.62–0.675 before the lens closes.
 * (Layout choice is automatic: the first arrangement whose lens is real — short
 * side >= 0.35 of the frame, >= 1.5× — and whose context share holds.)
 *  0.00–0.20  context: the stage, the name chip, the key and the single
 *             editorial caption.
 *  0.20–0.32  the context dims and a lens grows in the free room (stepped back:
 *             0.25–0.37, the context moving 0.31–0.40): a
 *             REAL second copy of the stage at the same coordinates, cropped to
 *             the inspected section of the filing (its heading, its slot and the
 *             piece in it, whole fields only), enlarged ≥ 1.5× against the
 *             context at rest (raised so the window's smaller side reaches ~42 %
 *             of the frame's short side). The copy's text and the datum card's
 *             old value arrive WITH the window (legible from ~40 % open), in step
 *             with the context copy of the datum (the piece's printed text) going
 *             blank; dotted guides join the section to the window.
 *  0.44–0.66  the old value on the datum card is struck (grey), then only the
 *             dependent geometry changes in the lens — the piece lifts out of
 *             its slot and fades, and the neutral empty slot shows — and the new
 *             value appears and stays still (≥ 400 ms).
 *  0.66–0.72  the card text and the copy leave, the lens closes, the context
 *             brightens; its piece's text comes back in step.
 *  0.74–1.00  back in context the same change is applied (0.74–0.80); a Δ
 *             changed-datum marker at the section and a note (marker label,
 *             struck before value, after value) appear 0.82–0.88 and stay.
 *             Seeking back before 0.48 restores the old datum exactly. An empty
 *             section is only pending in the configured example: no defect,
 *             deadline, admissibility or consequence is stated.
 * @module animations/civil-claim/LAW-0248
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, oneOf, num} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  PD_DEFAULTS, PD_STRINGS, partiesField, documentsField, sectionsField, datesField, stagesField, labelProps,
  partyCaption, sectionHeading, looksOf, gchip, keyChip, hit, fitG, pxPerUnit, solveStage, buildStage, stageChoreo, localizeDefaults,
} from './kits/preparacion-demanda.js';

const ID = 'LAW-0248';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_BASE = {
  caption: [0.02, 0.08], open: [0.2, 0.32], strike: [0.44, 0.49], geo: [0.48, 0.58], newText: [0.555, 0.585],
  textOut: [0.66, 0.68], close: [0.675, 0.72], ctxGeo: [0.74, 0.8], marker: [0.82, 0.88],
  // (in step with the lens: the context copy of the datum goes blank as the copy becomes legible, u ≈ 0.244–0.256,
  // and comes back as the lens copy leaves)
  hideOut: [0.244, 0.2555], hideIn: [0.683, 0.692],
};
/**
 * Stacked square layout (the context steps back): the context shrinks into a full-width band at the top while the lens
 * opens large under it (aside: the context steps into the left part, the lens opens beside it), and grows back before
 * the lens closes. Its texts step out first (they never render under 16 px) and come back as the lens copy leaves, so
 * the datum is always legible in exactly one place.
 */
// (the window becomes visible with its copy at u ≈ 0.305: the context text steps out just before, 0.296–0.303, and the
// context moves only then, 0.31–0.40 — no context text is ever drawn under 16 px)
const W_STACK = {...W_BASE, open: [0.25, 0.37], hideOut: [0.296, 0.303], camOut: [0.303, 0.35], camBack: [0.646, 0.672], textOut: [0.652, 0.662], close: [0.664, 0.705], hideIn: [0.672, 0.679]};
// (aside: coming back, the context first grows in place — its left edge kept, so the window never covers more of it —
// and slides back to its own place only once the window has closed)
const W_ASIDE = {...W_STACK, slideOut: [0.305, 0.345], camOut: [0.335, 0.4], camBack: [0.61, 0.668], slideBack: [0.68, 0.72]};
/** how far the context dims in place while the lens is open */
const DIM = 0.55;
const BASE_PX = 19.8, MIN_PX = 16.3;
const FOCUS = ['section1', 'section2', 'section3'];

const STRINGS = {
  en: {...PD_STRINGS.en, before: 'Before', after: 'After'},
  es: {...PD_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  sections: sectionsField,
  stages: stagesField,
  dates: datesField,
  labels: obj('Labels printed on the props', labelProps),
  focusTarget: oneOf('Section of the filing that is enlarged; its datum changes from "piece supplied" to "section still to complete" (as supplied)', FOCUS),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context at rest (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits: beside the context (right), above it (top) or over the dimmed context (over)', ['auto', 'right', 'top', 'over'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: PD_DEFAULTS.parties,
  documents: PD_DEFAULTS.documents,
  sections: PD_DEFAULTS.sections,
  stages: PD_DEFAULTS.stages,
  dates: PD_DEFAULTS.dates,
  labels: PD_DEFAULTS.labels,
  focusTarget: 'section3',
  beforeValue: 'Delivery note D-17 supplied',
  afterValue: 'Section to complete (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'The filing as assembled', marker: 'Datum changed'},
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
      "title": "Demanda · borrador ficticio"
    }
  },
  "sections": [
    {
      "heading": "Hechos",
      "item": "El paquete ficticio llegó dañado el día 2"
    },
    {
      "heading": "Peticiones",
      "item": "Sustituir el paquete ficticio"
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
  "labels": {
    "calendar": "Día de redacción"
  },
  "beforeValue": "Albarán D-17 aportado",
  "afterValue": "Apartado por completar",
  "contextLabels": {
    "context": "El escrito montado",
    "marker": "Dato cambiado"
  }
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    return compose(ctx);
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

function compose(ctx) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const pxPer = pxPerUnit(ctx);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const k = FOCUS.indexOf(p.focusTarget);
  const looks = looksOf(ctx, p);
  const tsBase = BASE_PX / pxPer, tsMin = MIN_PX / pxPer;
  const tsList = [];
  for (let t = tsBase; t >= tsMin - 1e-6; t -= (tsBase - tsMin) / 4) tsList.push(t);
  // (auto: over the dimmed full-size context first — the context fills the frame at rest and at the hold, as in the
  // story; beside or above it only when no real lens fits over it)
  const places = p.detailGeometry.placement === 'auto' ? ['over', ...(shape === 'portrait' ? ['top'] : shape === 'square' ? ['aside', 'stack', 'right', 'top'] : ['aside', 'right'])] : [p.detailGeometry.placement, 'over'];
  // frame short side in design units
  const S = Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  let best = null;
  const attempts = [];
  const solCache = new Map();
  // (text size first, then placement, then the card width: wide cards keep the stage short, narrow ones keep the
  // lens crop compact — the first combination where both the stage and a real lens fit wins)
  outer: for (const ts of tsList) for (const place of places) for (const cropLevel of [0, 1, 2]) for (let cwk = ['over', 'stack', 'aside'].includes(place) ? 24 : 16; cwk >= 5.5 - 1e-6; cwk -= 1.5) {
    const L = composeAt(ctx, {ts, k, looks, place, S, pxPer, showKey, showAll, cw: cwk * ts, cropLevel, solCache});
    attempts.push(`${r(ts * pxPer, 1)}px cw${cwk} ${L.why.join(' ')}`);
    L.attempts = attempts;
    if (L.skip) continue;
    if (!best || (L.ok && !best.ok)) best = L;
    if (L.ok) break outer;
  }
  if (!best) best = composeAt(ctx, {ts: tsList[tsList.length - 1], k, looks, place: places[0], S, pxPer, showKey, showAll, cw: 5.5 * tsList[tsList.length - 1], cropLevel: 0, solCache, force: true});
  Object.assign(best, best.finish());
  return best;
}

function composeAt(ctx, o) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const {ts, k, place, S, showKey, showAll} = o;
  const small = ts;
  // ---- bands: the key and the name chip under the counter; the caption at the top of the lens room
  const cap0 = partyCaption(p, 0);
  const side = place === 'right';
  // (stack: the context steps back into a band at the top; aside: into the left part, the lens opening beside it)
  const aside = place === 'aside';
  const stack = place === 'stack' || aside;
  const over = place === 'over' || stack;
  const ctxW = side ? Math.round((D.w - 16) * (ctx.view.shape === 'square' ? 0.6 : 0.6)) : D.w - 16;
  const over0 = over;
  const chipProbe = showKey ? gchip(ctx, cap0, {x: 0, y: 0, anchor: 'middle', maxWidth: ctxW * (over0 ? 0.32 : 0.5), size: ts, minSize: ts, maxLines: 5}) : null;
  const keyProbe = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: ctxW * (over0 ? 0.32 : 0.46), size: ts}) : null;
  // (over: the caption shares the band under the counter with the name chip and the key)
  const capProbe = over && showAll && p.contextLabels.context ? gchip(ctx, p.contextLabels.context, {x: 0, y: 0, anchor: 'middle', maxWidth: ctxW * 0.3, size: ts, minSize: ts, maxLines: 5}) : null;
  const noteProbe = over && showKey ? noteBlock(ctx, p, {x: 0, y: 0, w: ctxW, small, flow: true}) : null;
  const band = (showKey ? Math.max(chipProbe.box.h, keyProbe.box.h, capProbe ? capProbe.box.h : 0) + 12 : 6) + (noteProbe ? noteProbe.box.h + 10 : 0);
  // (stacked: the lens room is tall enough for a window whose short side is >= 0.36 of the frame's short side)
  const roomH0 = side || over ? 0 : Math.round(Math.max((D.h - 16) * 0.44, 0.365 * S + 40));
  const ctxH = D.h - 16 - roomH0 - band;
  // (one stage solve per text size, card width and box: the placements and crop levels that share them reuse it)
  const solKey = `${ts}|${o.cw}|${Math.round(ctxW)}|${Math.round(ctxH)}|${over}`;
  const sol = o.solCache.get(solKey) || solveStage(ctx, {
    p, availW: ctxW, availH: ctxH, tsList: [ts], trayK: 0.6, trayKs: [0.6, 0.8, 1], modes: over ? ['calTop', 'calRight'] : ['calTop'], showText: showAll,
    PKs: [3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8, 1.6], xTKs: [74, 86, 98], cwRange: [o.cw, o.cw], headMinUnits: 52 / o.pxPer, headMaxUnits: 170 / o.pxPer,
    // (full-frame context in wide and square frames: its drawn content spans >= 0.74 of the FRAME width at rest)
    ...(over && ctx.view.shape !== 'portrait' ? {minContentW: 0.745 * ctx.view.width / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h)} : {}),
  });
  o.solCache.set(solKey, sol);
  // (a context that does not fit rules this attempt out before any lens work — unless it is the forced fallback)
  if (!sol.fitted && !o.force) return {skip: true, ok: false, why: ['fit false']};
  const G = sol.G;
  const E = G.ext;
  const ox = 8 + (ctxW - E.w) / 2 - E.x;
  const oy = D.h - 8 - band - G.panelH;
  const M = q => ({x: ox + q.x, y: oy + q.y});
  const Mb = b => ({x: ox + b.x, y: oy + b.y, w: b.w, h: b.h});
  const ctxBox = {x: 8, y: oy + E.y, w: ctxW, h: E.h};
  // (stacked: the camera that steps the context back — the drawn content scaled into a full-width band at the top,
  // >= 0.47 of the FRAME width)
  const FwD0 = ctx.view.width / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const cpb0 = Mb({x: E.x, y: E.y, w: E.w, h: E.h});
  // (the whole stage — wall and counter included — stays inside the frame while it is stepped back)
  const full0 = {x: cpb0.x - ts * 0.5, y: 8, w: cpb0.w + ts, h: oy + G.panelH - 8};
  const cam = stack ? (() => {
    const s0 = Math.min(0.9, (0.47 * FwD0) / cpb0.w);
    const fitIn = (t, a, len, lo, hi) => clamp(t, lo - s0 * a, hi - s0 * (a + len));
    if (aside) {
      const tx = fitIn(8 - s0 * cpb0.x, full0.x, full0.w, 4, D.w - 4), ty = fitIn((D.h - s0 * cpb0.h) / 2 - s0 * cpb0.y, full0.y, full0.h, 4, D.h - 4);
      return {s: s0, tx, ty, sideR: tx + s0 * (cpb0.x + cpb0.w)};
    }
    const tx = fitIn((D.w - s0 * cpb0.w) / 2 - s0 * cpb0.x, full0.x, full0.w, 4, D.w - 4), ty = fitIn(8 - s0 * cpb0.y, full0.y, full0.h, 4, D.h - 4);
    // (the window may overlap the band's lowest quarter — the counter under the stepped-back context, which shows no text
    // then — but never its person's head)
    const bandT = ty + s0 * cpb0.y, bandB = ty + s0 * (cpb0.y + cpb0.h);
    const headB = ty + s0 * (oy + G.headTop + G.headR * 2 + 20);
    return {s: s0, tx, ty, bandB, roomTop: Math.max(headB + 12, bandB - 0.25 * (bandB - bandT)) + 8};
  })() : null;
  // ---- the inspected section: its heading, its slot and the piece in it (whole fields only)
  const rw = G.rows[k];
  // (the crop: the section alone first; when no real lens fits, it takes in a neighbouring section too — whole
  // fields only — so the window is less of a strip)
  const cropOf = (a, b) => Mb({x: G.xS - 0.3 * ts, y: G.rows[a].top - 0.32 * ts, w: G.SW + 0.6 * ts, h: G.rows[b].slot.y + G.rows[b].slot.h + 0.12 * ts - (G.rows[a].top - 0.32 * ts)});
  const crops = [[k, k, 0], [k - 1, k, 1], [k, k + 1, 1], [k - 1, k + 1, 2], [k - 2, k, 2], [k, k + 2, 2]].filter(([a, b, lv]) => a >= 0 && b <= 2 && lv <= o.cropLevel).map(([a, b]) => cropOf(a, b));
  let src = crops[0];
  // ---- the lens room (never over the context)
  const headB0 = Mb({x: G.headC.x - G.headR - 14, y: G.headTop - 10, w: G.headR * 2 + 48, h: G.headR * 2 + 24});
  const chooseLens = src => {
    let rooms;
    const bandTop = oy + G.panelH;
    if (stack) rooms = [aside ? {x: cam.sideR + 16, y: 8, w: D.w - 8 - (cam.sideR + 16), h: D.h - 16} : {x: 8, y: cam.roomTop, w: D.w - 16, h: D.h - 8 - cam.roomTop}];
    else if (side) rooms = [{x: 8 + ctxW + 16, y: 8, w: D.w - 8 - (8 + ctxW + 16), h: D.h - 16 - band}];
    else if (!over) rooms = [{x: 8, y: 8, w: D.w - 16, h: Math.max(0, ctxBox.y - 16)}];
    else {
      // over the dimmed context (square frames: the context needs the full width): free rooms clear of the face and of
      // the inspected section first; failing those, a window centred on the section itself (opaque from its first
      // visible frame, so no double image). Context texts under the window are hidden while it is open.
      const hx = headB0.x + headB0.w + 8;
      const fr = ox + G.frameR + 14;
      rooms = [
        // (the free wall right of the frame, clear of every context text, first)
        {x: fr, y: 4, w: D.w - 8 - fr, h: bandTop - 8},
        {x: hx, y: 4, w: D.w - 8 - hx, h: src.y - 12 - 4},
        {x: hx, y: src.y + src.h + 12, w: D.w - 8 - hx, h: bandTop - 4 - (src.y + src.h + 12)},
        {x: hx, y: 4, w: src.x - 12 - hx, h: bandTop - 8},
        {x: 8, y: headB0.y + headB0.h + 8, w: src.x - 30 - 8, h: bandTop - 8 - (headB0.y + headB0.h + 8)},
        {x: hx, y: 4, w: D.w - 8 - hx, h: bandTop - 8, onSource: true},
      ].filter(q => q.w > 0 && q.h > 0);
    }
    // the single editorial caption at the top of the room (over: in the band under the counter)
    const capChip = showAll && p.contextLabels.context ? (over
      ? gchip(ctx, p.contextLabels.context, {x: 8 + ctxW / 2, y: oy + G.panelH + 6, anchor: 'middle', maxWidth: ctxW * 0.3, size: small, minSize: small, maxLines: 5, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: 'ctx-cap'})
      : gchip(ctx, p.contextLabels.context, {x: rooms[0].x, y: rooms[0].y, anchor: 'start', maxWidth: rooms[0].w, size: small, minSize: small, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: 'ctx-cap'})) : null;
    // ---- window: the enlarged copy plus the datum card (beside or under it), as large as the room allows
    const layFor = (lensRoom, beside) => {
      const cardW0 = beside ? Math.max(small * 8, Math.min(lensRoom.w * 0.42, small * 13)) : lensRoom.w - 24;
      const fitV = t => fitG(t, {maxWidth: cardW0 - small * 1.4, size: small, minSize: small, maxLines: 6, weight: 700});
      const vOld = fitV(p.beforeValue), vNew = fitV(p.afterValue);
      const cardH = showKey ? vOld.height + vNew.height + small * 2.2 : 0;
      const cardW = showKey ? Math.max(vOld.width, vNew.width) + small * 1.4 : 0;
      const avW = lensRoom.w - 16 - (beside ? cardW + 14 : 0);
      const avH = lensRoom.h - 16 - (beside ? 0 : cardH + (showKey ? 12 : 0));
      const zFit = Math.max(0, Math.min(avW / src.w, avH / src.h));
      const winFor = z => (beside ? {w: src.w * z + cardW + 30, h: Math.max(src.h * z, cardH) + 16} : {w: Math.max(src.w * z, cardW) + 16, h: src.h * z + (showKey ? cardH + 20 : 16)});
      let z = p.detailGeometry.zoom;
      while (z < 6 && Math.min(winFor(z).w, winFor(z).h) < 0.42 * S) z += 0.05;
      z = Math.min(zFit, z);
      // (stacked: the window, flush right, stays right of the full-size person's head — it opens before the context has
      // stepped back; the camera lifts the context before moving it sideways, so the head never passes under it)
      if (stack && !aside) { const maxW = lensRoom.x + lensRoom.w - (headB0.x + headB0.w + 12); while (z > 0.5 && winFor(z).w > maxW) z -= 0.02; }
      const wn = winFor(z);
      return {beside, vOld, vNew, cardH, cardW, z, wn, short: Math.min(wn.w, wn.h), lensRoom};
    };
    const good = q => q.z >= 1.5 && q.short >= 0.35 * S;
    const byRoom = rooms.map(rm0 => {
      const lensRoom = over ? rm0 : {x: rm0.x, y: rm0.y + (capChip ? capChip.box.h + ts * 0.6 : 0), w: rm0.w, h: rm0.h - (capChip ? capChip.box.h + ts * 0.6 : 0)};
      const ls = [layFor(lensRoom, false), layFor(lensRoom, true)];
      return ls.reduce((a, b2) => ((good(b2) && !good(a)) || (good(b2) === good(a) && b2.short > a.short + 1) ? b2 : a));
    });
    // (the first room, in order of preference, that holds a real lens; else the one with the largest lens)
    const lay = byRoom.find(good) || byRoom.reduce((a, b2) => (b2.short > a.short ? b2 : a));
    const lensRoom = lay.lensRoom;
    const onSource = Boolean(rooms[byRoom.indexOf(lay)] && rooms[byRoom.indexOf(lay)].onSource);

    return {rooms, lay, lensRoom, onSource, capChip};
  };
  let pick = null;
  for (const c of crops) {
    const q = chooseLens(c);
    if (!pick) pick = {...q, src: c};
    if (q.lay.z >= 1.5 && q.lay.short >= 0.35 * S) { pick = {...q, src: c}; break; }
  }
  src = pick.src;
  const {lay, lensRoom, onSource, capChip} = pick;
  const zoom = lay.z;
  const win = {w: lay.wn.w, h: lay.wn.h};
  // (placed in the room as close to the inspected section as it can be)
  win.x = clamp(src.x + src.w / 2 - win.w / 2, lensRoom.x, lensRoom.x + lensRoom.w - win.w);
  win.y = clamp(src.y + src.h / 2 - win.h / 2, lensRoom.y, lensRoom.y + lensRoom.h - win.h);
  // (stacked: flush right, away from the person — the window never lies over the face, not even while the context is
  // still stepping back from full size)
  if (stack && !aside) win.x = lensRoom.x + lensRoom.w - win.w;
  if (over && !stack && !onSource) {
    // (over the context: the spot in the room that covers the fewest context texts, then the nearest to the section)
    const tb = [0, 1, 2].flatMap(i => [Mb({x: G.xT + G.tp + G.D, y: G.rows[i].runner - G.CH, w: G.CW, h: G.CH}), Mb({x: G.xS, y: G.rows[i].top, w: G.SW, h: G.headH})])
      .concat([Mb({x: G.xS, y: G.sheetTop, w: G.SW, h: G.rows[0].top - G.sheetTop}), Mb({x: G.bx0, y: G.tabTop, w: G.bx1 - G.bx0, h: G.plateY + G.plateH - G.tabTop}), Mb({x: G.cal.x, y: G.cal.y, w: G.cal.w, h: G.cal.h})]);
    let bestP = null;
    const nx = 12, ny = 12;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      const x = lensRoom.x + (lensRoom.w - win.w) * i / nx, y = lensRoom.y + (lensRoom.h - win.h) * j / ny;
      const wb = {x: x - 8, y: y - 8, w: win.w + 16, h: win.h + 16};
      const cost = tb.filter(b => hit(b, wb, 0)).length * 1e4 + Math.hypot(x + win.w / 2 - (src.x + src.w / 2), y + win.h / 2 - (src.y + src.h / 2));
      if (!bestP || cost < bestP.cost) bestP = {x, y, cost};
    }
    win.x = bestP.x; win.y = bestP.y;
  }
  const cont = {w: src.w * zoom, h: src.h * zoom};
  const R = lay.beside ? {x: win.x + 8, y: win.y + (win.h - cont.h) / 2, w: cont.w, h: cont.h} : {x: win.x + (win.w - cont.w) / 2, y: win.y + 8, w: cont.w, h: cont.h};
  const card = lay.beside ? {x: R.x + R.w + 14, y: win.y + (win.h - lay.cardH) / 2, w: win.x + win.w - 8 - (R.x + R.w + 14), h: lay.cardH} : {x: win.x + 8, y: R.y + R.h + 10, w: win.w - 16, h: lay.cardH};
  const lensShort = Math.min(win.w, win.h) / S;
  // ---- the context left in view while the lens is open, as a share of the FRAME (width; for a stacked lens the larger
  // of width and height): the part of the context's drawn content the window does not cover
  const FwD = ctx.view.width / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const FhD = ctx.view.height / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const cpb = Mb({x: E.x, y: E.y, w: E.w, h: E.h});
  const ovX = Math.max(0, Math.min(cpb.x + cpb.w, win.x + win.w) - Math.max(cpb.x, win.x));
  const ovY = Math.max(0, Math.min(cpb.y + cpb.h, win.y + win.h) - Math.max(cpb.y, win.y));
  const ctxShare = stack ? cam.s * cpb.w / FwD : over
    ? Math.max((cpb.w - (ovY > cpb.h * 0.35 ? ovX : 0)) / FwD, (cpb.h - (ovX > cpb.w * 0.35 ? ovY : 0)) / FhD)
    : Math.max(cpb.w / FwD, cpb.h / FhD);
  // ---- context labels
  const chips = [];
  let key = null;
  if (showKey) {
    const cx = clamp(ox, 8 + chipProbe.box.w / 2, 8 + ctxW - chipProbe.box.w / 2);
    chips.push(over ? gchip(ctx, cap0, {x: 8, y: oy + G.panelH + 6, anchor: 'start', maxWidth: ctxW * 0.32, size: ts, minSize: ts, maxLines: 5, name: 'chip-a'})
      : gchip(ctx, cap0, {x: cx, y: oy + G.panelH + 6, anchor: 'middle', maxWidth: ctxW * 0.5, size: ts, minSize: ts, maxLines: 5, name: 'chip-a'}));
    key = keyChip(ctx, {x: 8 + ctxW, y: oy + G.panelH + 6, anchor: 'end', maxWidth: ctxW * (over ? 0.32 : 0.46), size: ts});
  }
  // ---- the hold's note (Δ marker label, struck before value, after value) in the lens room once the lens has closed
  const note = over && showKey ? noteBlock(ctx, p, {x: 8, y: D.h - 8 - noteProbe.box.h, w: ctxW, small, flow: true})
    : showKey ? noteBlock(ctx, p, {x: lensRoom.x, y: lensRoom.y, w: Math.min(lensRoom.w, ts * 20), small, flow: false}) : null;
  if (note && !over) {
    const nx = lensRoom.x + Math.max(0, (lensRoom.w - note.box.w) / 2), ny = clamp(src.y + src.h / 2 - note.box.h / 2, lensRoom.y, lensRoom.y + lensRoom.h - note.box.h);
    Object.assign(note, noteBlock(ctx, p, {x: nx, y: ny, w: Math.min(lensRoom.w, ts * 20), small, flow: false}));
  }
  // Δ marker on the section in context (top-right corner of its slot, on the sheet margin)
  const markerR = small * 0.62;
  const mk = M({x: rw.slot.x + rw.slot.w - markerR * 0.2, y: rw.slot.y + markerR * 0.2});
  // ---- guides from the section to the window
  const facing = side ? 'x' : 'y';
  const cones = facing === 'x'
    ? [[{x: src.x + src.w, y: src.y + 6}, {x: win.x, y: R.y + 6}], [{x: src.x + src.w, y: src.y + src.h - 6}, {x: win.x, y: R.y + R.h - 6}]]
    : [[{x: src.x + 6, y: src.y}, {x: R.x + 6, y: win.y + win.h}], [{x: src.x + src.w - 6, y: src.y}, {x: R.x + R.w - 6, y: win.y + win.h}]];
  // (the guides are drawn only when they cross no context text and no face)
  {
    const tb = [0, 1, 2].flatMap(i => [Mb({x: G.xT + G.tp + G.D, y: G.rows[i].runner - G.CH, w: G.CW, h: G.CH}), Mb({x: G.xS, y: G.rows[i].top, w: G.SW, h: G.headH})])
      .concat([Mb({x: G.xS, y: G.sheetTop, w: G.SW, h: G.rows[0].top - G.sheetTop}), Mb({x: G.bx0, y: G.tabTop, w: G.bx1 - G.bx0, h: G.plateY + G.plateH - G.tabTop}), Mb({x: G.cal.x, y: G.cal.y, w: G.cal.w, h: G.cal.h}), headB0])
      .filter(b => !(b.x >= src.x - 1 && b.y >= src.y - 1 && b.x + b.w <= src.x + src.w + 1 && b.y + b.h <= src.y + src.h + 1));
    const inB = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
    var conesClear = !stack && cones.every(([a2, b2]) => { for (let i = 2; i < 38; i++) { const q = {x: a2.x + (b2.x - a2.x) * i / 40, y: a2.y + (b2.y - a2.y) * i / 40}; if (tb.some(z => inB(q, z))) return false; } return true; });
  }
  // ---- checks
  const headBox = Mb({x: G.headC.x - G.headR - 8, y: G.headTop - 6, w: G.headR * 2 + 36, h: G.headR * 2 + 16});
  const labelBoxes = [...chips.map(c => c.box), key && key.box, capChip && capChip.box].filter(Boolean);
  const winBox = {x: win.x, y: win.y, w: win.w, h: win.h};
  const ctxPropsBox = Mb({x: E.x, y: E.y, w: E.w, h: E.h});
  const truncated = [...G.itemFits, ...G.headFits, ...(G.hf ? Object.values(G.hf) : []), G.cfTitle, G.cfRef, G.calTitle, G.calDay, lay.vOld, lay.vNew, ...(note ? note.fits : []), ...chips.map(c => c.fit), key && key.fit, capChip && capChip.fit].filter(f => f && f.truncated).map(f => f.full);
  const okd = (sol.diag || []).filter(q => q.includes('reach true face true')).map(q => q.match(/w (\d+)\/(\d+) h (\d+)\/(\d+)/)).filter(Boolean).filter(m => +m[1] <= +m[2]).map(m => +m[3]);
  const why = [`fit ${sol.fitted} hmin ${okd.length ? Math.min(...okd) : '-'}/${r(ctxH)}`, `zoom ${r(zoom, 2)}`, `short ${r(lensShort, 3)}`, `win ${r(lay.wn.w)}x${r(lay.wn.h)} room ${r(lensRoom.w)}x${r(lensRoom.h)}`, `place ${place}`, `ctx ${r(ctxShare, 3)}`];
  const restShare = cpb.w / FwD;
  // (over / stack / aside: at rest and at the hold the full-size context spans >= 0.73 of the frame width — tall frames
  // >= 0.71)
  const ok = sol.fitted && zoom >= 1.5 && lensShort >= 0.35 && ctxShare >= 0.47 && (!over || restShare >= (ctx.view.shape === 'portrait' ? 0.71 : 0.73)) && lay.wn.w <= lensRoom.w + 0.5 && lay.wn.h <= lensRoom.h + 0.5 && (!note || over || note.box.y + note.box.h <= lensRoom.y + lensRoom.h + 0.5);
  // (the two stage drawings and the text bookkeeping are made only for the chosen composition)
  const finish = () => {
    const lz = buildStage(ctx, G, {prefix: 'lz', looks: o.looks, supplied: [true, true, true], wallX0: E.x, wallX1: E.x + E.w});
    // (stepped back: the room's wall spans the drawn content only, so the whole context moves as one piece)
    const stage = buildStage(ctx, G, {prefix: 'st', looks: o.looks, supplied: [true, true, true], wallX0: stack ? E.x - ts * 0.5 : 8 - ox, wallX1: stack ? E.x + E.w + ts * 0.5 : D.w - 8 - ox, wallTop: 8 - oy});
    // (the texts of the lens copy are named so they can arrive with the window; the context's datum text — the piece's
    // printed text — is named so it can go blank while the lens holds the datum)
    const lzTexts = nameTexts(lz.node, 'lz-tx');
    const owners = {__own: {}};
    nameTexts(stage.node, 'st-tx', owners);
    const ownName = owners.__own;
    delete owners.__own;
    const datumTexts = Object.entries(owners).filter(([, own]) => own === `st-c${k}`).map(([n]) => n);
    // (over the context: every context text whose own box the open window would cover is hidden while it is open)
    const lensHide = [];
    if (over) {
      const Wx = {x: win.x - 8, y: win.y - 8, w: win.w + 16, h: win.h + 16};
      const boxOf = nm => {
        const m = /^st-(?:c(\d)-text|head(\d))$/.exec(nm || '');
        if (m && m[1] !== undefined) { const i = +m[1]; return Mb({x: G.xT + G.tp + G.D, y: G.rows[i].runner - G.CH, w: G.CW, h: G.CH}); }
        if (m && m[2] !== undefined) { const i = +m[2]; return Mb({x: G.xS, y: G.rows[i].top, w: G.SW, h: G.headH}); }
        if (/^st-h(ref|title|parties|date)$/.test(nm || '')) return Mb({x: G.xS, y: G.sheetTop, w: G.SW, h: G.rows[0].top - G.sheetTop});
        if (/^st-cf-/.test(nm || '')) return Mb({x: G.bx0, y: G.tabTop, w: G.bx1 - G.bx0, h: G.plateY + G.plateH - G.tabTop});
        if (/^st-cal-/.test(nm || '')) return Mb({x: G.cal.x, y: G.cal.y, w: G.cal.w, h: G.cal.h});
        return null;
      };
      // (stacked: the stepped-back context shows no text at all while it is small)
      for (const n of Object.keys(owners)) { const b = boxOf(ownName[n]); if (stack || !b || hit(b, Wx, 0)) lensHide.push(n); }
    }
    return {lz, stage, lzTexts, datumTexts, lensHide};
  };
  return {
    finish, over, onSource, conesClear, diag: sol.diag, why,
    ok, ctxShare, cam, stack, aside, cpbX: cpb.x, ts, k, G, ox, oy, src, win, R, card, cont, zoom, lay, lensShort, S, lensRoom, capChip, chips, key, note, markerAt: mk, markerR, cones,
    ctxBox, headBox, labelBoxes, winBox, ctxPropsBox, truncated, place,
    labelsClear: labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1))),
    textPx: r(ts * o.pxPer, 2), fitted: sol.fitted,
  };
}

/** The hold's note: Δ marker with its label, the struck before value and the after value (stacked). */
function noteBlock(ctx, p, o) {
  const th = ctx.theme;
  const {small} = o;
  const showAll = ctx.show('all');
  const Rr = small * 0.62;
  const nw = o.w, gap = 12;
  const labFit = showAll && p.contextLabels.marker ? fitG(p.contextLabels.marker, {maxWidth: nw - 2 * Rr - 10 - small * 1.2, size: small, minSize: small, maxLines: 3, weight: 700}) : null;
  const befFit = fitG(`${ctx.t.before}: ${p.beforeValue}`, {maxWidth: nw - small * 1.4, size: small, minSize: small, maxLines: 6, weight: 600});
  const aftFit = fitG(`${ctx.t.after}: ${p.afterValue}`, {maxWidth: nw - small * 1.4, size: small, minSize: small, maxLines: 6, weight: 700});
  // (o.flow: the three items side by side in one row, each a third of the width)
  // (o.flow: the three items side by side in one row, their widths in proportion to their texts)
  const fl = o.flow;
  const tB = `${ctx.t.before}: ${p.beforeValue}`, tA = `${ctx.t.after}: ${p.afterValue}`;
  const labNeed = labFit ? ctx.measure(p.contextLabels.marker, small, 700, 'sans') + 2 * Rr + 10 + small * 1.4 : 2 * Rr + 10;
  const labW = Math.min(labNeed, (nw - 2 * gap) * 0.34);
  const restW = nw - 2 * gap - labW;
  const befW = Math.max(small * 6, restW * tB.length / (tB.length + tA.length)), aftW = restW - befW;
  const cw3 = [labW, befW, aftW];
  const labFit2 = fl && labFit ? fitG(p.contextLabels.marker, {maxWidth: labW - 2 * Rr - 10 - small * 1.2, size: small, minSize: small, maxLines: 4, weight: 700}) : labFit;
  const befFit2 = fl ? fitG(tB, {maxWidth: befW - small * 1.4, size: small, minSize: small, maxLines: 8, weight: 600}) : befFit;
  const aftFit2 = fl ? fitG(tA, {maxWidth: aftW - small * 1.4, size: small, minSize: small, maxLines: 8, weight: 700}) : aftFit;
  return noteBlockAt(ctx, p, o, {Rr, gap, cw3, labFit: labFit2, befFit: befFit2, aftFit: aftFit2});
}

function noteBlockAt(ctx, p, o, q) {
  const th = ctx.theme;
  const {small} = o;
  const {Rr, gap, cw3, labFit, befFit, aftFit} = q;
  const nw = o.w;
  const li = {h: Math.max(2 * Rr, labFit ? labFit.height + small * 0.8 : 0)};
  const bi = {w: befFit.width + small * 1.4, h: befFit.height + small * 1.0};
  const ai = {w: aftFit.width + small * 1.4, h: aftFit.height + small * 1.0};
  const ox = o.x, oy = o.y;
  const befBox = o.flow ? {x: ox + cw3[0] + gap, y: oy, w: bi.w, h: bi.h} : {x: ox, y: oy + li.h + gap, w: bi.w, h: bi.h};
  const aftBox = o.flow ? {x: ox + cw3[0] + cw3[1] + 2 * gap, y: oy, w: ai.w, h: ai.h} : {x: ox, y: befBox.y + bi.h + gap, w: ai.w, h: ai.h};
  const gy = oy + li.h / 2;
  const lab = labFit ? gchip(ctx, p.contextLabels.marker, {x: ox + 2 * Rr + 10, y: oy + (li.h - (labFit.height + small * 0.8)) / 2, anchor: 'start', maxWidth: (o.flow ? cw3[0] : nw) - 2 * Rr - 10, size: small, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent2, color: th.accent2, weight: 700, name: 'nb-label'}) : null;
  const strikeLines = befFit.lines.map((ln, k) => {
    const lw = ctx.measure(ln, befFit.size, 600, 'sans');
    const yy = befBox.y + small * 0.5 + k * befFit.lineHeight + befFit.size * 0.42;
    return h('line', {x1: r(befBox.x + small * 0.7 - 3), x2: r(befBox.x + small * 0.7 + lw + 3), y1: r(yy), y2: r(yy), stroke: th.inkSoft, 'stroke-width': 2.5});
  });
  return {
    node: g({name: 'note', opacity: 0},
      changedMarker(ctx, {x: ox + Rr, y: gy, radius: Rr}),
      lab && lab.node,
      g({name: 'nb-before'},
        h('path', {d: roundRectPath(befBox.x, befBox.y, befBox.w, befBox.h, 10), fill: th.card, stroke: th.inkFaint, 'stroke-width': 2}),
        textBlock(befFit, {x: befBox.x + small * 0.7, y: befBox.y + small * 0.5, fill: th.inkSoft}), strikeLines),
      g({name: 'nb-after'},
        h('path', {d: roundRectPath(aftBox.x, aftBox.y, aftBox.w, aftBox.h, 10), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
        textBlock(aftFit, {x: aftBox.x + small * 0.7, y: aftBox.y + small * 0.5, fill: th.ink}))),
    box: o.flow ? {x: ox, y: oy, w: aftBox.x + ai.w - ox, h: Math.max(li.h, bi.h, ai.h)} : {x: ox, y: oy, w: Math.max(2 * Rr + 10 + (lab ? lab.box.w : 0), bi.w, ai.w), h: aftBox.y + ai.h - oy},
    fits: [lab && lab.fit, befFit, aftFit].filter(Boolean),
  };
}

/** Wrap every <text> vnode of a tree in a named group; returns the names (owners: name → nearest named ancestor). */
function nameTexts(node, prefix, owners) {
  const names = [];
  const nameOf = n => (n && n.attrs && (n.attrs.name || n.attrs['data-node'])) || null;
  const walk = (n, owner) => {
    if (!n || typeof n !== 'object' || !n.children) return;
    const own = nameOf(n) || owner;
    n.children = n.children.map(c => {
      if (c && typeof c === 'object' && c.tag === 'text') {
        const name = `${prefix}${names.length}`;
        names.push(name);
        if (owners) owners[name] = own;
        if (owners && owners.__own) owners.__own[name] = c.attrs && c.attrs.name;
        return g({name}, c);
      }
      walk(c, own);
      return c;
    });
  };
  walk(node, null);
  return names;
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const {R, win, card, src} = L;
  const small = L.ts;
  // (the texts of the lens copy are named so they can arrive with the window; the context's datum text — the piece's
  // printed text — is named so it can go blank while the lens holds the datum)
  const strike = L.lay.vOld.lines.map((ln, k) => {
    const lw = ctx.measure(ln, L.lay.vOld.size, 700, 'sans');
    const y = card.y + small * 0.6 + k * L.lay.vOld.lineHeight + L.lay.vOld.size * 0.42;
    return h('line', {x1: r(card.x + small * 0.7 - 3), x2: r(card.x + small * 0.7 + lw + 3), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': 3});
  });
  const newY = card.y + small * 0.6 + L.lay.vOld.height + small * 0.8;
  const clipId = ctx.id('lens-clip');
  return g(null,
    g({name: 'ctx-stage', transform: T(L.ox, L.oy)}, L.stage.node),
    L.chips.map(c => c.node),
    L.key && L.key.node,
    L.capChip && g({name: 'ctx-capg', opacity: 0}, L.capChip.node),
    h('path', {name: 'lens-src', d: roundRectPath(src.x, src.y, src.w, src.h, 8), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
    L.cones.map((c, i) => h('line', {name: `lens-cone${i}`, x1: r(c[0].x), y1: r(c[0].y), x2: r(c[1].x), y2: r(c[1].y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
    h('defs', null, h('clipPath', {id: clipId}, h('rect', {name: 'lens-cliprect', x: R.x, y: R.y, width: R.w, height: R.h, rx: 12}))),
    g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
      h('rect', {name: 'lens-shadow', x: win.x + 8, y: win.y + 12, width: win.w, height: win.h, rx: 22, fill: th.shadow}),
      h('rect', {name: 'lens-bg', x: win.x, y: win.y, width: win.w, height: win.h, rx: 22, fill: th.paper}),
      g({'clip-path': `url(#${clipId})`}, g({name: 'lens-content'}, g({name: 'lens-zoom'}, g({transform: T(L.ox, L.oy)}, L.lz.node)))),
      L.card.h ? g({name: 'lens-card'},
        h('path', {d: roundRectPath(card.x, card.y, card.w, card.h, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
        g({name: 'val-old', opacity: 0}, textBlock(L.lay.vOld, {x: card.x + small * 0.7, y: card.y + small * 0.6, fill: th.ink, name: 'val-old-t'}), g({name: 'val-strike', opacity: 0}, strike)),
        g({name: 'val-new', opacity: 0}, textBlock(L.lay.vNew, {x: card.x + small * 0.7, y: newY, fill: th.ink}))) : null,
      h('rect', {name: 'lens-border', x: win.x, y: win.y, width: win.w, height: win.h, rx: 22, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
    ),
    L.note && L.note.node,
    changedMarker(ctx, {name: 'ctx-marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markerR, opacity: 0}),
  );
}

/** Apply the datum (0 = piece in its slot, 1 = the piece lifted out and gone, the neutral empty slot shows). */
function applyDatum(L, nodes, P, d) {
  const G = L.G, rw = G.rows[L.k];
  const e = ease.inOutCubic(d);
  const lift = Math.min(G.sg * 0.9, 0.2 * L.ts) * clamp(e * 1.6);
  // (it fades while it rises a few units: it never crosses the lens rim while visible)
  nodes[`${P}-card${L.k}`] = {transform: T(G.xT + G.tp + G.D, rw.runner - lift), opacity: r(clamp(1 - e * 1.6), 3)};
}

function frameScene(ctx, L, u) {
  const W_ = L.aside ? W_ASIDE : L.stack ? W_STACK : W_BASE;
  const G = L.G;
  const sup = [true, true, true];
  const v = stageChoreo(1, G, sup);
  const pc = L.stage.pose(v);
  const pl = L.lz.pose(v);
  const nodes = {...pc.nodes, ...pl.nodes};
  const dLens = seg(u, ...W_.geo);
  const dCtx = seg(u, ...W_.ctxGeo);
  applyDatum(L, nodes, 'st', dCtx);
  applyDatum(L, nodes, 'lz', dLens);
  // every stage card writes its opacity every frame (render independent of seek history)
  [0, 1, 2].forEach(i => { if (i !== L.k) { nodes[`st-card${i}`].opacity = 1; nodes[`lz-card${i}`].opacity = 1; } });
  if (L.capChip) nodes['ctx-capg'] = {opacity: r(seg(u, ...W_.caption) * (L.stack ? 1 - seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn)) : 1), 3)};
  // lens window
  const open = ease.inOutCubic(seg(u, ...W_.open));
  const close = ease.inOutCubic(seg(u, ...W_.close));
  const p = u < W_.close[0] ? open : 1 - close;
  const copyIn = clamp((open - 0.4) / 0.1);
  const copyOut = 1 - seg(u, W_.close[0], W_.close[0] + 0.006);
  const copy = u < W_.close[0] ? copyIn : copyOut;
  const winOp = copy;
  // the context dims in place with the window
  const dimOp = r(1 - DIM * copy, 3);
  // (stacked: the camera steps the context back into the top band while the lens is open, then brings it back)
  const camQ = L.stack ? ease.inOutCubic(seg(u, ...W_.camOut)) * (1 - ease.inOutCubic(seg(u, ...W_.camBack))) : 0;
  // (vertical move and scale lead, the sideways move lags: stepping back the context rises first; coming back it first
  // moves sideways, then down — aside: it slides back last, after growing in place)
  let qY = 1 - (1 - camQ) ** 3;
  let qX = camQ ** 3;
  if (L.aside) {
    // (aside: the context first slides to its place on the left at full size, then shrinks there — its left edge kept —
    // so the window, right of that place, never covers more of it; coming back it grows in place and slides last)
    qY = camQ;
    const sNow = 1 + (L.cam.s - 1) * qY;
    const leftStep = L.cam.tx + L.cam.s * L.cpbX;
    const slide = ease.inOutCubic(seg(u, ...W_.slideOut)) * (1 - ease.inOutCubic(seg(u, ...W_.slideBack)));
    const left = L.cpbX + (leftStep - L.cpbX) * slide;
    qX = L.cam.tx ? (left - sNow * L.cpbX) / L.cam.tx : 0;
  }
  const camS = L.stack ? 1 + (L.cam.s - 1) * qY : 1;
  // (a design-space box as the camera shows it now)
  const camB = b => (L.stack ? {x: L.cam.tx * qX + camS * b.x, y: L.cam.ty * qY + camS * b.y, w: b.w * camS, h: b.h * camS} : b);
  nodes['ctx-stage'] = {opacity: dimOp, transform: L.stack ? `${T(r(L.cam.tx * qX, 2), r(L.cam.ty * qY, 2))} scale(${r(camS, 5)}) ${T(L.ox, L.oy)}` : T(L.ox, L.oy)};
  const labOp = r((1 - 0.35 * copy) * (L.stack ? 1 - seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn)) : 1), 3);
  L.chips.forEach((c, i) => { nodes[`chip-${i ? 'b' : 'a'}`] = {opacity: labOp}; });
  if (L.stack && L.key) nodes.key = {opacity: labOp};
  // the changed datum is shown in ONE place at a time: the context piece's printed text goes blank in step with the
  // lens copy becoming legible and comes back as it leaves
  const hideP = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  for (const n of [...L.datumTexts, ...L.lensHide]) nodes[n] = {opacity: r(1 - hideP, 3)};
  const {R, win, src} = L;
  const f = 0.35 + 0.65 * p;
  const cx = win.x + win.w / 2, cy = win.y + win.h / 2;
  const W2 = {x: cx - (win.w * f) / 2, y: cy - (win.h * f) / 2, w: win.w * f, h: win.h * f};
  const Rr = {x: cx + (R.x - cx) * f, y: cy + (R.y - cy) * f, w: R.w * f, h: R.h * f};
  const kz = Rr.w / src.w;
  const Rc = {...Rr};

  // (the copy's printed text arrives with the window; hidden while it would render under 16 px)
  const copyTextPx = L.textPx * kz;
  const lzTx = r(clamp((copyTextPx - 16.1) / 0.6), 3);
  for (const n of L.lzTexts) nodes[n] = {opacity: lzTx};
  const vis = p > 0.001 && winOp > 0.001;
  nodes['lens-win'] = {opacity: r(vis ? winOp : 0, 3)};
  nodes['lens-shadow'] = {x: r(W2.x + 8), y: r(W2.y + 12), width: r(W2.w), height: r(W2.h)};
  nodes['lens-bg'] = {x: r(W2.x), y: r(W2.y), width: r(W2.w), height: r(W2.h)};
  nodes['lens-border'] = {x: r(W2.x), y: r(W2.y), width: r(W2.w), height: r(W2.h)};
  nodes['lens-cliprect'] = {x: r(Rc.x), y: r(Rc.y), width: r(Rc.w), height: r(Rc.h)};
  nodes['lens-zoom'] = {transform: `${T(Rr.x - src.x * kz, Rr.y - src.y * kz)} scale(${r(kz, 5)})`};
  // (the source highlight rides with the context: same camera as the stepped-back stage)
  nodes['lens-src'] = {opacity: vis ? r(winOp, 3) : 0, transform: L.stack ? `${T(r(L.cam.tx * qX, 2), r(L.cam.ty * qY, 2))} scale(${r(camS, 5)})` : ''};
  const coneOp = vis && p >= 0.999 && !L.onSource && L.conesClear ? r(winOp, 3) : 0;
  L.cones.forEach((c, i) => { nodes[`lens-cone${i}`] = {opacity: coneOp}; });
  const textOut = 1 - seg(u, ...W_.textOut);
  // (the datum card is drawn only once the window has grown to its full size, and leaves as it starts to close: it is
  // never outside the rim; the enlarged copy is clipped to the growing window)
  const cardOp = clamp((p - 0.998) / 0.002);
  if (L.card.h) nodes['lens-card'] = {opacity: r(cardOp, 3)};
  const oldP = copy * textOut * cardOp;
  const strikeP = seg(u, ...W_.strike);
  const newP = seg(u, ...W_.newText) * textOut;
  if (L.card.h) {
    nodes['val-old'] = {opacity: r(oldP, 3)};
    nodes['val-old-t'] = {fill: strikeP > 0.5 ? ctx.theme.inkSoft : ctx.theme.ink};
    nodes['val-strike'] = {opacity: r(strikeP, 3)};
    nodes['val-new'] = {opacity: r(newP, 3)};
  }
  const mk = seg(u, ...W_.marker);
  nodes['ctx-marker'] = {opacity: r(mk, 3)};
  if (L.note) nodes.note = {opacity: r(mk, 3)};
  const datum = dLens <= 0 ? 'before' : dLens >= 1 ? 'after' : 'changing';
  const ctxDatum = dCtx <= 0 ? 'before' : dCtx >= 1 ? 'after' : 'changing';
  const lensOn = vis && winOp > 0.05;
  const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
  const inside = (a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
  return {
    nodes,
    semantic: {
      beat, lensOpen: r(p, 3), copy: r(copy, 3), bareCard: lensOn && copy < 0.5,
      datum, contextDatum: ctxDatum, focusTarget: ctx.params.focusTarget, focusSection: L.k,
      zoom: r(L.zoom, 3), oldShown: r(oldP, 3), strike: r(strikeP, 3), newShown: r(newP, 3), markerShown: r(mk, 3), noteShown: r(mk, 3),
      pieceInSlotCtx: dCtx < 1, pieceInSlotLens: dLens < 1, contextDatumTextShown: r(1 - hideP, 3),
      lensShort: r(L.lensShort, 3), contextDim: dimOp, contextScale: r(camS, 3),
      lensClearOfFaces: !lensOn || !hit(W2, camB(L.headBox), 0), lensOverContext: hit(L.winBox, L.ctxPropsBox, 0),
      sourceInContext: inside(L.src, L.ctxPropsBox), cardInWindow: !L.card.h || inside(L.card, L.win),
      guidesOnSource: L.cones.every(c => c[0].x >= L.src.x - 1 && c[0].x <= L.src.x + L.src.w + 1 && c[0].y >= L.src.y - 1 && c[0].y <= L.src.y + L.src.h + 1),
      markerClearOfFaces: !hit({x: L.markerAt.x - L.markerR, y: L.markerAt.y - L.markerR, w: 2 * L.markerR, h: 2 * L.markerR}, L.headBox, 2),
      ctxShare: r(L.ctxShare, 3), placement: L.place, allReached: pc.reached, fitted: L.ok, labelsClear: L.labelsClear, truncated: L.truncated, textPx: L.textPx, PK: r(G.PK, 2),
      labelsOffFaces: L.labelBoxes.every(b => !hit(b, L.headBox, 0)),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-02-inspect',
    title: 'Preparing a claim — inspecting one section of the filing: piece supplied becomes section to complete',
    titleEs: 'Preparación de demanda — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Preparación de demanda',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The drafting frame after assembly: every configured piece is in its section of the written filing. A lens opens beside the context on one section (its heading, slot and piece, enlarged ≥ 1.5×); one supplied datum is substituted — the piece supplied becomes the section still to complete (as supplied): the old value is struck, the piece lifts out and fades and the neutral empty slot shows, the new value appears. Back in context the same change is applied, with a Δ marker and a before/after note. No defect, deadline, admissibility or consequence is stated.',
    tags: ['claim preparation', 'inspect', 'lens', 'written filing', 'section', 'datum substitution', 'before', 'after'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/preparacion-demanda.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/markers.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
