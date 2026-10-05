/**
 * LAW-0112 — Premisa oculta · inspect
 *
 * Storyboard (the walk as full-size context; while it is inspected it shrinks
 * to a context thumbnail and a rectangular reading magnifier lifts ONE card
 * out; the old datum leaves the lens as a paper slip that is kept and becomes
 * the changed-datum tag):
 *  0.00–0.20 build       The state produced by the story is built: fact and
 *                        conclusion are pulled apart and the gap between them
 *                        reveals the intermediate card, with the status
 *                        SUPPLIED for before (default: left unstated — pencil
 *                        card, hinges folded; stated — printed card, hinges
 *                        latched). A context caption names it.
 *  0.20–0.45 isolate     The context shrinks to a thumbnail under the caption.
 *                        A reading magnifier is laid on the focus card (with its
 *                        joints) at scale 1 — a real copy exactly over its
 *                        source coordinates — then lifted into the free space
 *                        below, enlarging the card while the rest dims.
 *  0.45–0.75 substitute  Inside the lens the supplied datum (the focus card's
 *                        text) is replaced: the old value is picked up as a
 *                        paper slip, pulled out under the lens and struck
 *                        through (it stays in view); the supplied new value
 *                        appears in the card (lens and context at once; old out
 *                        first, then new in). Only then the dependent part
 *                        changes to the status SUPPLIED for after: the card's
 *                        look (pencil ↔ printed), the two hinges (folded ↔
 *                        latched) and its level in the pocket. Nothing else
 *                        moves.
 *  0.75–1.00 return      The lens is set back; the struck slip travels with it
 *                        into its "changed datum — before" tag under the
 *                        thumbnail; a pin and leader join the tag to the
 *                        changed card, and the context grows back to full size
 *                        with the supplied issue, assumption and the key "as
 *                        supplied · no conclusion drawn". Seeking back restores
 *                        the old value and status exactly.
 * Every shape keeps the walk horizontal (three cards side by side), so the lens
 * can enlarge one card; tall boxes stack the notes under the tag.
 * Legal content: fictional, jurisdiction unspecified; the new datum and the
 * status after it are supplied by the author; nothing is inferred.
 * @module animations/reasoning/LAW-0112
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {oneOf, inspectFields} from '../../schemas/fields.js';
import {textBlock, chip} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {lens} from '../../frameworks/lens.js';
import {balancedWidth} from '../causation/kits/place.js';
import {barMagnifierArt, barMagnifierFrame, BAR_HANDLE} from './kits/hecho-y-regla.js';
import {
  poFields, premiseStatusField, PREMISE_STATUSES, PO_STRINGS, DEFAULT_CONTENT, walkGeometry, cardArt, boardArt, recessShade, hingeArt,
  bodyText, bodyTop, keyChip, unitsPer1080px, poColors, bars, stripNames, markChip,
} from './kits/premisa-oculta.js';

const ID = 'LAW-0112';
const DURATION = 9000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  // isolate: the lens is laid on the card at full size, then lifts to its destination in the SAME window in which the
  // context shrinks to its thumbnail (one synchronised move: the frame never holds only a small thumbnail)
  caption: [0.01, 0.08], open: [0.03, 0.14], latch: [0.13, 0.18], settle: [0.17, 0.19], shrink: [0.19, 0.31],
  openL: [0.19, 0.31], dim: [0.29, 0.34],
  detach: [0.46, 0.5], drop: [0.5, 0.57], ctxOut: [0.5, 0.555], strike: [0.57, 0.62], newIn: [0.575, 0.64], dep: [0.645, 0.73],
  notesIn: [0, 0.04], notesOut: [0.23, 0.29], notesBack: [0.83, 0.86],
  // return: the lens closes onto its card in the same window in which the context grows back (mirror of isolate);
  // the slip reaches its tag at 0.83, then the notes come back; everything settles by ~0.86
  close: [0.745, 0.815], grow: [0.745, 0.815], undim: [0.745, 0.765], away: [0.815, 0.83], toTag: [0.785, 0.83],
  tag: [0.81, 0.83], lead: [0.81, 0.835], pin: [0.835, 0.85],
};
const K_OUT = 0.78;
const M = 30;
const P2 = q => ({x: r(q.x), y: r(q.y)});
const tmap = (Tc, q) => ({x: Tc.x + Tc.k * q.x, y: Tc.y + Tc.k * q.y});
const tstr = Tc => `translate(${r(Tc.x)} ${r(Tc.y)}) scale(${r(Tc.k, 5)})`;
const WHICH = {premise: 'premise', fact: 'fact', conclusion: 'conclusion'};

const EXTRA = {
  en: {before: 'before', contextDefault: 'Context: the gap between fact and conclusion, opened', markerDefault: 'Changed datum (as supplied)'},
  es: {before: 'antes', contextDefault: 'Contexto: el hueco entre hecho y conclusión, abierto', markerDefault: 'Dato cambiado (según lo aportado)'},
};
const STRINGS = {en: {...PO_STRINGS.en, ...EXTRA.en}, es: {...PO_STRINGS.es, ...EXTRA.es}};

const insp = inspectFields(['premise', 'fact', 'conclusion']);
const sceneSchema = {
  ...poFields,
  ...insp,
  premiseStatus: {...premiseStatusField, description: `BEFORE the substitution — ${premiseStatusField.description}`},
  afterStatus: oneOf('Status of the intermediate premise AFTER the substitution, as supplied by the author (the card’s look, its hinges and its level change to it); never inferred from the new text', PREMISE_STATUSES),
  focusTarget: oneOf('Which card’s text is enlarged and substituted: the intermediate premise, the fact or the conclusion', ['premise', 'fact', 'conclusion']),
  detailGeometry: {
    ...insp.detailGeometry,
    properties: {
      zoom: insp.detailGeometry.properties.zoom,
      placement: oneOf('Where the lens opens: below the context (auto and bottom are the same here — the old value drops out beneath the lens)', ['auto', 'bottom']),
    },
  },
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  premiseStatus: 'unstated',
  afterStatus: 'stated',
  focusTarget: 'premise',
  beforeValue: 'Whoever holds the shed key locked the shed last',
  afterValue: 'Only the person with the key can lock the shed',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Context: the gap between fact and conclusion, opened', marker: 'Changed datum (as supplied)'},
};

const SHAPES = {
  // wide boxes: the thumbnail goes to the top-left corner and the lens uses the frame beside it (supplied zoom)
  landscape: {size: 58, maxW: 1560, thumb: 0.44, thumbMax: 0.62, capTie: 0.5, notesBelow: false, maxLines: 6, corner: true},
  square: {size: 60, maxW: Infinity, thumb: 0.44, thumbMax: 0.62, notesBelow: false, maxLines: 7, corner: true},
  // tall boxes: the walk runs top → bottom (full-width cards, as in the story scene); the pin sits in the left margin
  portrait: {axis: 'y', size: 56, maxW: Infinity, thumb: 0.3, thumbMax: 0.36, notesBelow: true, maxLines: 6},
};

/** The two cone lines joining a source rectangle and the lens window (as frameworks/lens.js draws them). */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}

function compose(ctx, s, relax = false, capPx = 20.5, S0 = null) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = S0 || SHAPES[ctx.view.shape];
  const u = unitsPer1080px(ctx);
  const show = ctx.show('key');
  const showAll = ctx.show('all');
  const which = WHICH[p.focusTarget] || 'premise';
  const fallback = which === 'premise' ? p.rules : which === 'fact' ? p.facts : p.conclusion;
  const beforeText = p.beforeValue || fallback;
  const afterText = p.afterValue || beforeText;
  const texts = {fact: p.facts, premise: p.rules, conclusion: p.conclusion};
  texts[which] = beforeText;
  const statusBefore = p.premiseStatus;
  const statusAfter = p.afterStatus;
  const ns = Math.min(s, Math.max(Math.min(21 * u, s), 16.5 * u));
  // the context caption never reads larger than the (thumbnail) card text it names
  // (the thumbnail below is kept large enough that its card text is never smaller than this caption)

  // no pull tabs here (no hands move the cards): the cards take the whole width
  const tl = 0;
  const X = (S.axis || 'x') === 'x';
  const bp = s * 0.62;
  // axis y: a left margin holds the changed-datum pin and its leader (beside the board, never on a card)
  const pinRoom = X ? 0 : 24 + 0.6 * s;
  const x0 = X ? 0 : M + pinRoom + bp;
  const CW = X ? Math.min(D.w - 2 * M - 16, S.maxW) : Math.min(D.w - M - bp - x0, S.maxW);
  const J = Math.max(10, s * 0.42);
  const cw = (CW - 2 * J) / 3;
  const xL = X ? (D.w - CW) / 2 : x0;
  const geoAt = y => walkGeometry(ctx, {
    axis: X ? 'x' : 'y', x: xL, y, s, u, show, ...(X ? {cw} : {width: CW}), maxLines: S.maxLines, J, tabs: false,
    kinds: {fact: t.factKind, premise: t.premiseKind, conclusion: t.conclusionKind}, texts,
    alt: {which, text: afterText},
  });
  const probe = geoAt(0);
  // context caption: ~20.5 px, but never larger than the thumbnail's card text (the thumbnail keeps a scale that
  // makes its smallest card text at least the caption size; text-dense sets let the caption go down to ~16.5 px)
  const cardMin = Math.min(...probe.bodySizes);
  // (capPx: the caption's floor in px at 1080p — 20.5 first; 16.5 only when nothing fits with it)
  const capSize = Math.min(ns, 20.5 * u, Math.max(capPx * u, cardMin * (S.capTie ?? S.thumbMax ?? 0.6)));
  const ktMin = Math.max(S.thumb, (capSize / cardMin) * 1.01);
  const capH = showAll ? capSize * 2.1 : 14;
  const B0 = probe.boxes[which];
  const col0 = probe.cols[which];
  const fitB = probe.fits[which].body;
  const fitA = probe.altFit;
  const tw = fitB ? fitB.width : col0.w * 0.8;
  const th0 = fitB ? fitB.height : s * 2.2;
  const pad = s * 0.34;
  const slipW = tw + 2 * pad, slipH = th0 + 1.6 * pad;
  // changed-datum tag under the full-size context (the slip ends inside it)
  const ts = X ? Math.max(ns, s * 0.62) : Math.max(ns, s * 0.5);
  const k3 = clamp(fitB && show ? (ts * 1.1) / fitB.size : 0.9, 0.55, 1.3);
  const tp = ts * 0.55;
  const headTxt = `${p.contextLabels.marker || t.markerDefault} — ${t.before}:`;
  const headW = Math.max(CW * 0.34, slipW * k3);
  const head = showAll ? ctx.fit(headTxt, {maxWidth: headW, size: ts, minSize: ts, maxLines: 3, weight: 700}) : null;
  const headH = head ? head.height + ts * 0.3 : ts * 0.9;
  const tagW = Math.max(head ? head.width : 0, slipW * k3) + 2 * tp;
  const tagH = tp + headH + slipH * k3 + tp;
  const tagGap = s * 1.3;
  // notes: issues, assumptions, key (full views only)
  const noteTexts = !showAll ? [] : [
    ...p.issues.map(q => ({kind: 'issue', text: `${t.issue}: ${q}`})),
    ...p.assumptions.map(a => ({kind: 'assumed', text: `${t.assumed}: ${a}`})),
  ];
  const nGap = s * 0.8;
  const tagX0 = !X ? xL - bp - 0.55 * s - 24
    : xL + (which === 'fact' ? 0 : which === 'conclusion' ? CW - tagW : Math.max(0, B0.x + B0.w / 2 - xL - tagW / 2));
  // beside the tag: on whichever side has more room (the tag sits under the changed card); stacked under it when
  // the box is tall or the side room is narrow
  const leftAvail = tagX0 - xL - nGap, rightAvail = CW - (tagX0 - xL + tagW) - nGap;
  const notesSide = leftAvail > rightAvail ? 'left' : 'right';
  const below = S.notesBelow || Math.max(leftAvail, rightAvail) < 480;
  const notesW = below ? CW : Math.max(0, Math.max(leftAvail, rightAvail));
  const noteChip = (it, w) => {
    const bw = balancedWidth(ctx, it.text, {maxWidth: w, size: ns, minSize: ns, maxLines: 5});
    return {...chip(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size: ns, minSize: ns, maxLines: 5}), bw};
  };
  const keyC = show ? keyChip(ctx, statusBefore === statusAfter ? statusAfter : 'both', {x: 0, y: 0, size: ns, maxWidth: notesW, maxLines: 3}) : null;
  const noteChips = noteTexts.map(nt => ({...nt, c: noteChip(nt, notesW)}));
  const notesH = noteChips.reduce((a, c) => a + c.c.box.h + 8, 0) + (keyC ? keyC.box.h + 8 : 0);
  const notesOk = notesW >= 220 && noteChips.every(c => !c.c.fit.truncated) && !(keyC && keyC.fit.truncated);
  const stackH = probe.bbox.h + tagGap + (below ? tagH + (notesH ? 12 + notesH : 0) : Math.max(tagH, notesH));
  const room = D.h - M - (M + capH);
  const top0 = M + capH + Math.max(0, (room - stackH) / 2) + (probe.boxes.fact.y - probe.bbox.y);
  const geo = geoAt(top0);
  const B = geo.boxes[which];
  // thumbnail view: the context shrinks about the top centre; the lens band opens under it
  const gapL = s * 1.1, gapS = s * 0.45;
  const maxDW = D.w - 2 * M - BAR_HANDLE;
  const srcL = X ? {x: B.x - J - 6, y: B.y - 6, w: B.w + 2 * J + 12, h: B.h + 12} : {x: B.x - 6, y: B.y - J - 6, w: B.w + 12, h: B.h + 2 * J + 12};
  const inspectAt = (kt, shift, corner) => {
    if (corner) {
      // thumbnail in the top-left corner; the lens and the slip band beside it, centred in the free area
      const Tt = {x: M - kt * (geo.bbox.x - 4), y: M + capH + shift - kt * (geo.bbox.y - 4), k: kt};
      const s0 = tmap(Tt, srcL);
      const src = {x: s0.x, y: s0.y, w: srcL.w * kt, h: srcL.h * kt};
      const thumbRight = M + kt * (geo.bbox.w + 8);
      const thumbBottom = tmap(Tt, {x: 0, y: geo.bbox.y + geo.bbox.h}).y;
      const availW = D.w - M - BAR_HANDLE - (thumbRight + gapL);
      const availH = D.h - M - (M + capH) - gapS;
      const z = Math.max(1, Math.min(p.detailGeometry.zoom, availW / src.w, availH / (src.h + slipH * kt * K_OUT)));
      const bandH = src.h * z + gapS + slipH * kt * z * K_OUT;
      const destY = M + capH + Math.max(0, (availH - bandH) / 2);
      return {kt, Tt, src, thumbBottom, z, bandH, destY, destX: thumbRight + gapL + Math.max(0, (availW - src.w * z) / 2), free: 0};
    }
    const Tt = {x: D.w / 2 - kt * (geo.bbox.x + geo.bbox.w / 2), y: M + capH + shift - kt * (geo.bbox.y - 4), k: kt};
    const s0 = tmap(Tt, srcL);
    const src = {x: s0.x, y: s0.y, w: srcL.w * kt, h: srcL.h * kt};
    const thumbBottom = tmap(Tt, {x: 0, y: geo.bbox.y + geo.bbox.h}).y;
    const availH = D.h - M - (thumbBottom + gapL) - gapS;
    const z = Math.max(1, Math.min(p.detailGeometry.zoom, maxDW / src.w, availH / (src.h + slipH * kt * K_OUT)));
    const bandH = src.h * z + gapS + slipH * kt * z * K_OUT;
    const destY = thumbBottom + gapL;
    return {kt, Tt, src, thumbBottom, z, bandH, destY, free: D.h - M - (destY + bandH)};
  };
  // 'side': thumbnail on top (centred), the lens below it and the old value's slip pulled out to the lens's left
  // (the room under a wide thumbnail is used in full; no band is kept empty under the lens)
  const sideAt = kt => {
    const Tt = {x: D.w / 2 - kt * (geo.bbox.x + geo.bbox.w / 2), y: M + capH - kt * (geo.bbox.y - 4), k: kt};
    const s0 = tmap(Tt, srcL);
    const src = {x: s0.x, y: s0.y, w: srcL.w * kt, h: srcL.h * kt};
    const thumbBottom = tmap(Tt, {x: 0, y: geo.bbox.y + geo.bbox.h}).y;
    const availH = D.h - M - (thumbBottom + gapL);
    const zH = availH / src.h;
    const zW = (D.w - 2 * M - BAR_HANDLE - gapL) / (src.w + slipW * kt * K_OUT);
    const z = Math.max(1, Math.min(p.detailGeometry.zoom, zH, zW));
    const slipWk = slipW * kt * z * K_OUT;
    const fitsSlip = slipH * kt * z * K_OUT <= src.h * z;
    const rowW = slipWk + gapL + src.w * z + BAR_HANDLE;
    const destX = (D.w - rowW) / 2 + slipWk + gapL;
    return {kt, Tt, src, thumbBottom, z: fitsSlip ? z : 1, destY: thumbBottom + gapL, destX, slipWk, side: true, free: availH - src.h * z};
  };
  const pickSide = () => {
    let I = sideAt(ktMin);
    for (let kt = Math.max(S.thumbMax, ktMin); kt > ktMin + 1e-6; kt -= 0.02) {
      const Jn = sideAt(kt);
      if (Jn.z >= I.z - 1e-6) { I = Jn; break; }
    }
    return {...I, corner: false};
  };
  const pick = corner => {
    let I = inspectAt(ktMin, 0, corner);
    // the largest thumbnail that still lets the lens reach the best zoom
    for (let kt = Math.max(S.thumbMax, ktMin); kt > ktMin + 1e-6; kt -= 0.02) {
      const Jn = inspectAt(kt, 0, corner);
      if (Jn.z >= I.z - 1e-6 && (corner || Jn.free >= 0)) { I = Jn; break; }
    }
    if (!corner) I = inspectAt(I.kt, Math.max(0, I.free / 2), false);
    return {...I, corner};
  };
  // the inspection group (thumbnail, lens + handle, slip band) is scaled up and centred in the room under the
  // caption, so it never sits in the top half only; the zoom (lens ÷ source) is unchanged by this
  const roomW = D.w - 2 * M, roomH = D.h - M - (M + capH);
  const place = I => {
    const handleLeft = !I.corner && !I.side && which === 'fact' && X;
    const dw = I.src.w * I.z;
    const dest = I.corner || I.side
      ? {x: I.destX, y: I.destY, w: dw, h: I.src.h * I.z}
      : handleLeft
        ? {x: clamp((D.w - dw + BAR_HANDLE) / 2, M + BAR_HANDLE, D.w - M - dw), y: I.destY, w: dw, h: I.src.h * I.z}
        : {x: clamp((D.w - dw - BAR_HANDLE) / 2, M, D.w - M - BAR_HANDLE - dw), y: I.destY, w: dw, h: I.src.h * I.z};
    const kt0 = I.kt, Tt0 = I.Tt;
    const thumb = {x: Tt0.x + kt0 * (geo.bbox.x - 14), y: Tt0.y + kt0 * (geo.bbox.y - 14), w: kt0 * (geo.bbox.w + 28), h: kt0 * (geo.bbox.h + 28)};
    const slipBandH = gapS + slipH * kt0 * I.z * K_OUT;
    const lensBox = I.side
      ? {x: dest.x - gapL - I.slipWk, y: dest.y, w: I.slipWk + gapL + dest.w + BAR_HANDLE, h: dest.h}
      : {x: dest.x - (handleLeft ? BAR_HANDLE : 0), y: dest.y, w: dest.w + BAR_HANDLE, h: dest.h + slipBandH};
    const uni = (A, Bx) => {
      const x = Math.min(A.x, Bx.x), y = Math.min(A.y, Bx.y);
      return {x, y, w: Math.max(A.x + A.w, Bx.x + Bx.w) - x, h: Math.max(A.y + A.h, Bx.y + Bx.h) - y};
    };
    const U = uni(thumb, lensBox);
    const f = clamp(Math.min(roomW / U.w, roomH / U.h), 1, 1.8);
    const X0 = M + (roomW - f * U.w) / 2, Y0 = M + capH + (roomH - f * U.h) / 2;
    const mp = q => ({x: X0 + f * (q.x - U.x), y: Y0 + f * (q.y - U.y)});
    const o = mp(Tt0);
    const s1 = mp(I.src), d1 = mp(dest);
    // fill while no slip is out yet (thumbnail + lens only), as a fraction of the room (both axes)
    const U0 = uni(thumb, I.side ? {x: dest.x, y: dest.y, w: dest.w + BAR_HANDLE, h: dest.h} : {...lensBox, h: dest.h});
    // (and with the slip out, which widens or deepens the group)
    const fill0 = Math.min(1, (f * U0.w) / roomW) * Math.min(1, (f * U0.h) / roomH);
    const fill1 = Math.min(1, (f * U.w) / roomW) * Math.min(1, (f * U.h) / roomH);
    // score: the weaker axis before the slip is out (a group that fills the width but only the top half scores low)
    const fill = Math.min(Math.min(1, (f * U0.w) / roomW), Math.min(1, (f * U0.h) / roomH)) + 0.1 * fill1;
    return {
      ...I, handleLeft, fill, f,
      Tt: {x: o.x, y: o.y, k: kt0 * f}, kt: kt0 * f,
      src: {x: s1.x, y: s1.y, w: I.src.w * f, h: I.src.h * f},
      dest: {x: d1.x, y: d1.y, w: dest.w * f, h: dest.h * f},
    };
  };
  // both arrangements (thumbnail in the corner with the lens beside it / thumbnail on top with the lens below);
  // among those reaching the supplied zoom, the one that fills the frame best
  const cands = [pick(false), ...(S.corner ? [pick(true)] : []), ...(X ? [pickSide()] : [])].map(place);
  const zBest = Math.max(...cands.map(c => c.z));
  const okZ = cands.filter(c => c.z >= Math.min(p.detailGeometry.zoom, zBest) - 1e-6);
  // (the 'side' arrangement first whenever it reaches the zoom: it keeps the lower half of wide frames in use)
  const sideOk = okZ.find(c => c.side);
  const I = sideOk || okZ.reduce((a, c) => (c.fill > a.fill + 1e-6 ? c : a));
  const {corner, handleLeft, z, kt, Tt, src} = I;
  const slipSide = !!I.side;
  const destF = I.dest;
  const truncated = geo.truncated || (head && head.truncated);
  return {
    s, u, ns, X, slipSide, arrangement: I.side ? 'side' : I.corner ? 'corner' : 'below', which, beforeText, afterText, statusBefore, statusAfter, geo, B, srcL, src, dest: destF, z, kt, Tt, capSize, capH, handleLeft,
    fitB: geo.fits[which].body, fitA: geo.altFit, tx: B.x + geo.cols[which].x, ty: bodyTop(geo, which), colW: geo.cols[which].w, pad, slipW, slipH, gapS, tl,
    tag: {ts, k3, tp, head, headH, w: tagW, h: tagH, gap: tagGap, x0: tagX0},
    notes: {below, w: notesW, items: noteChips, keyC, h: notesH, nGap, side: notesSide},
    // relax (text-dense sets only, after the strict pass failed): the full view may be drawn a little smaller than
    // the walk's design scale, never so small that its notes go under ~17 px at 1080p
    kFullMin: relax ? Math.min(1, (17 * u) / ns) : 1,
    fits: z >= p.detailGeometry.zoom - 1e-6 && destF.x + destF.w <= D.w - M + 0.5 && stackH * (relax ? Math.min(1, (17 * u) / ns) : 1) <= room + 0.5 && !truncated && (notesOk || s < 18),
    budget: {stackH: r(stackH), room: r(room), z: r(z, 3), truncated: !!truncated, notesOk, kt: r(kt, 3), corner, fill: r(I.fill, 3), fills: cands.map(c => [c.side ? 'side' : c.corner ? 'corner' : 'below', r(c.z, 2), r(c.fill, 3)])},
  };
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const geo = L.geo;
  const col = poColors(ctx);
  const which = L.which;
  const show = ctx.show('key');
  const lookB = L.statusBefore, lookA = L.statusAfter;
  const isP = which === 'premise';
  // --- the replaced text (before / after) as text or as bars
  const styleOf = st => (isP ? st : null);
  const beforeNode = (name, opacity) => bodyText(ctx, geo, which, L.fitB, {name, opacity, look: styleOf(lookB), textless: !show});
  const afterNode = (name, opacity) => (L.fitA ? bodyText(ctx, geo, which, L.fitA, {name, opacity, look: styleOf(lookA), textless: !show}) : g({name, opacity}));
  // --- context (local coordinates; the group is scaled into the thumbnail and back)
  const brd = boardArt(ctx, geo, {seedKey: 'po-board'});
  const hF = hingeArt(ctx, geo, 'fact', {name: 'hF'});
  const hC = hingeArt(ctx, geo, 'conclusion', {name: 'hC'});
  L.hF = hF; L.hC = hC;
  const prm = (look, prefix) => cardArt(ctx, geo, 'premise', {look, skipBody: isP, prefix});
  const cl = geo.closed;
  L.ctxNodes = g(null,
    brd.base, brd.pocket,
    h('defs', null, h('clipPath', {id: ctx.id('gapclip')}, h('rect', {name: 'gapclip-r', x: 0, y: 0, width: 0, height: 0}))),
    g({'clip-path': ctx.ref('gapclip')}, g({name: 'prm-lift'},
      g({name: 'prmB'}, prm(lookB, 'cpB')), g({name: 'prmA', opacity: 0}, prm(lookA, 'cpA')), recessShade(ctx, geo, 'recess'),
      isP ? g(null, beforeNode('c-before', 1), afterNode('c-after', 0)) : null)),
    g({name: 'fact', transform: T(cl.fact.dx, cl.fact.dy)}, cardArt(ctx, geo, 'fact', {skipBody: which === 'fact', prefix: 'cf'}), which === 'fact' ? g(null, beforeNode('c-before', 1), afterNode('c-after', 0)) : null, hF.fixed, hF.leaf, hF.knuckle),
    g({name: 'conc', transform: T(cl.conclusion.dx, cl.conclusion.dy)}, cardArt(ctx, geo, 'conclusion', {skipBody: which === 'conclusion', prefix: 'cc'}), which === 'conclusion' ? g(null, beforeNode('c-before', 1), afterNode('c-after', 0)) : null, hC.fixed, hC.leaf, hC.knuckle));
  const isF = which === 'fact', isC = which === 'conclusion';
  L.ctxTextNodes = {
    fact: ['cf-kind', ...(isF ? [] : ['cf-body'])],
    conclusion: ['cc-kind', ...(isC ? [] : ['cc-body'])],
    premise: ['cpB-kind', 'cpA-kind', ...(isP ? [] : ['cpB-body', 'cpA-body'])],
  };
  if (!ctx.show('key')) L.ctxTextNodes = null;
  // --- lens copy: the OPEN walk, text-free except the replaced text, with its own look/hinge nodes (z-)
  const zhF = hingeArt(ctx, geo, 'fact', {name: 'zhF'});
  const zhC = hingeArt(ctx, geo, 'conclusion', {name: 'zhC'});
  L.zhF = zhF; L.zhC = zhC;
  const zb = boardArt(ctx, geo, {seedKey: 'po-board'});
  const zprm = look => cardArt(ctx, geo, 'premise', {look, textless: true, kindText: true, skipBody: isP});
  const copy = g({transform: tstr(L.Tt)},
    zb.base, zb.pocket,
    g({name: 'z-lift'}, g({name: 'zprmB'}, zprm(lookB)), g({name: 'zprmA', opacity: 0}, zprm(lookA)), g({name: 'zrecess'}, stripNames(recessShade(ctx, geo, 'x')))),
    cardArt(ctx, geo, 'fact', {textless: true, kindText: true, tab: false, skipBody: which === 'fact'}), zhF.fixed, zhF.leaf, zhF.knuckle,
    cardArt(ctx, geo, 'conclusion', {textless: true, kindText: true, tab: false, skipBody: which === 'conclusion'}), zhC.fixed, zhC.leaf, zhC.knuckle,
    beforeNode('z-before', 1), afterNode('z-after', 0));
  const b0 = tmap(L.Tt, {x: geo.bbox.x - 14, y: geo.bbox.y - 14});
  const ctxBox = {x: b0.x, y: b0.y, w: (geo.bbox.w + 28) * L.kt, h: (geo.bbox.h + 28) * L.kt};
  L.lens = lens(ctx, {name: 'lz', source: L.src, dest: L.dest, content: copy, frame: ctxBox, radius: 16, color: th.accent2});
  L.bar = barMagnifierArt(ctx, 'bar');
  // --- the old value on a paper slip (local text coordinates, placed per frame)
  const strikes = [];
  if (show && L.fitB) {
    L.fitB.lines.forEach((line, k) => {
      const lw = ctx.measure(line, L.fitB.size, L.fitB.weight, L.fitB.family);
      strikes.push({x1: L.tx - 4, y: L.ty + k * L.fitB.lineHeight + L.fitB.size * 0.52, w: lw + 8});
    });
  } else {
    const n = L.fitB ? L.fitB.lines.length : 2;
    for (let k = 0; k < n; k++) strikes.push({x1: L.tx - 4, y: L.ty + k * L.s * 1.2 + L.s * 0.45, w: L.colW * 0.8 + 8});
  }
  L.strikes = strikes;
  const sl = {x: L.tx - L.pad, y: L.ty - L.pad * 0.8, w: L.slipW, h: L.slipH};
  L.slipNode = g({name: 'slip', opacity: 0},
    h('path', {name: 'slip-shadow', d: roundRectPath(sl.x + 4, sl.y + 6, sl.w, sl.h, 8), fill: th.shadow, opacity: 0}),
    h('path', {name: 'slip-paper', d: roundRectPath(sl.x, sl.y, sl.w, sl.h, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: 0}),
    stripNames(beforeNode(undefined, 1)),
    strikes.map((st, k) => h('line', {name: `slip-strike${k}`, x1: r(st.x1), y1: r(st.y), x2: r(st.x1), y2: r(st.y), stroke: th.inkSoft, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0})));
  // the same struck slip drawn UNDER the lens for the return: the closing (opaque) lens passes in front of it,
  // never garbling its text with the card text in the lens
  L.slipUnder = g({name: 'slipU', opacity: 0},
    h('path', {name: 'slipU-shadow', d: roundRectPath(sl.x + 4, sl.y + 6, sl.w, sl.h, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(sl.x, sl.y, sl.w, sl.h, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 4'}),
    stripNames(beforeNode(undefined, 1)),
    strikes.map(st => h('line', {x1: r(st.x1), y1: r(st.y), x2: r(st.x1 + st.w), y2: r(st.y), stroke: th.inkSoft, 'stroke-width': 3.2, 'stroke-linecap': 'round'})));
  const z = L.z, kt = L.kt;
  const q = tmap(L.Tt, {x: L.tx, y: L.ty});
  const inPose = {x: L.dest.x + (q.x - L.src.x) * z, y: L.dest.y + (q.y - L.src.y) * z, k: kt * z};
  const kOut = kt * z * K_OUT;
  const outX = clamp(inPose.x, M + L.pad * kOut, D.w - M - (sl.w - L.pad) * kOut);
  // pulled out of the lens: downwards (below it) or, in the 'side' arrangement, sideways to its left
  const outPose = L.slipSide
    ? {x: L.dest.x - L.s * 1.1 * 0.6 - (sl.w - L.pad) * kOut, y: L.dest.y + (L.dest.h - sl.h * kOut) / 2 + L.pad * 0.8 * kOut, k: kOut}
    : {x: outX, y: L.dest.y + L.dest.h + L.gapS + L.pad * 0.8 * kOut, k: kOut};
  // --- tag under the context, pin on the changed card's lower edge, leader
  const T3 = L.tag;
  const B = L.B;
  const tagY = geo.bbox.y + geo.bbox.h + T3.gap;
  const tagX = T3.x0;
  L.tagBox = {x: tagX, y: tagY, w: T3.w, h: T3.h};
  const tagPoseL = {x: tagX + T3.tp + L.pad * T3.k3, y: tagY + T3.tp + T3.headH + L.pad * 0.8 * T3.k3, k: T3.k3};
  L.poses = {inPose, outPose, tagPoseL};
  // the pin: its needle grips the card's lower edge, its head sits below the board (never on the card's text)
  // (axis y: the needle grips the card's left edge, the head sits in the left margin beside the board)
  const pinAt = L.X ? {x: B.x + B.w * 0.5, y: B.y + B.h} : {x: B.x, y: B.y + B.h * 0.5};
  const pin = L.X ? {x: pinAt.x + L.s * 0.55, y: geo.board.y + geo.board.h + L.s * 0.75} : {x: geo.board.x - L.s * 0.55, y: pinAt.y + L.s * 0.35};
  const legX = clamp(pin.x, tagX + 24, tagX + T3.w - 24);
  const lead = L.X ? [{x: legX, y: tagY}, {x: legX, y: pin.y}, {x: pin.x, y: pin.y}] : [{x: pin.x, y: tagY}, {x: pin.x, y: pin.y}];
  L.pinAt = pinAt;
  L.leadLen = lead.reduce((a, pt, i) => a + (i ? Math.hypot(pt.x - lead[i - 1].x, pt.y - lead[i - 1].y) : 0), 0);
  L.pin = pin;
  L.pinNode = g({name: 'pin', opacity: 0},
    h('path', {name: 'pin-lead', d: lead.map((pt, i) => `${i ? 'L' : 'M'}${r(pt.x)} ${r(pt.y)}`).join(''), fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': `${r(L.leadLen)} ${r(L.leadLen + 6)}`, 'stroke-dashoffset': r(L.leadLen), 'stroke-linejoin': 'round'}),
    g({name: 'pin-head', transform: T(pin.x, pin.y)},
      h('line', {x1: 0, y1: 0, x2: r(pinAt.x - pin.x), y2: r(pinAt.y - pin.y), stroke: th.ink, 'stroke-width': 3.4, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(pinAt.x - pin.x), cy: r(pinAt.y - pin.y), r: 5, fill: th.ink}),
      h('circle', {name: 'pin-disc', cx: 0, cy: 0, r: r(L.s * 0.4), fill: th.accent2, stroke: th.ink, 'stroke-width': 2.2}),
      // Δ = changed datum (a neutral glyph, never a tick, cross or alarm colour)
      h('path', {d: `M0 ${r(-L.s * 0.2)}L${r(L.s * 0.19)} ${r(L.s * 0.14)}L${r(-L.s * 0.19)} ${r(L.s * 0.14)}Z`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linejoin': 'round'})));
  // --- notes (full views): beside the tag, or under it in tall boxes
  {
    const NT = L.notes;
    const x0n = NT.below ? geo.boxes.fact.x : NT.side === 'left' ? geo.boxes.fact.x : tagX + T3.w + NT.nGap;
    let ny = NT.below ? tagY + T3.h + 12 : tagY;
    const parts = [];
    NT.items.forEach((it, i) => {
      const cc = chip(ctx, it.text, {x: x0n, y: ny, maxWidth: it.c.bw, size: L.ns, minSize: L.ns, maxLines: it.c.fit.lines.length, fill: th.card, stroke: it.kind === 'issue' ? shade(col.premise, -0.2) : th.inkFaint, weight: 600});
      parts.push(g({'data-role': 'content'}, markChip(cc.node)));
      ny += cc.box.h + 8;
    });
    L.key = NT.keyC ? keyChip(ctx, L.statusBefore === L.statusAfter ? L.statusAfter : 'both', {x: x0n, y: ny, size: L.ns, maxWidth: NT.w, maxLines: 3, name: 'key'}) : null;
    if (L.key) ny += L.key.box.h + 8;
    L.notesBottom = ny;
    L.notesBox = {x: x0n, y: NT.below ? tagY + T3.h + 12 : tagY, w: NT.w, h: ny - (NT.below ? tagY + T3.h + 12 : tagY)};
    L.notesNode = parts.length || L.key ? g({name: 'notes', opacity: 0}, parts, L.key && L.key.node) : null;
    if (L.key) L.key.node.attrs.opacity = 1;
  }
  L.tagNode = g({name: 'tag', opacity: 0, 'data-chip': '1'},
    h('path', {d: roundRectPath(tagX + 5, tagY + 7, T3.w, T3.h, 12), fill: th.shadow}),
    h('path', {name: 'tag-frame', d: roundRectPath(tagX, tagY, T3.w, T3.h, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.6}),
    T3.head
      ? g({'data-role': 'content'}, textBlock(T3.head, {x: tagX + T3.tp, y: tagY + T3.tp, fill: th.ink}))
      : h('rect', {x: r(tagX + T3.tp), y: r(tagY + T3.tp + 4), width: r(Math.min(T3.w - 2 * T3.tp, T3.ts * 5)), height: r(T3.ts * 0.5), rx: r(T3.ts * 0.25), fill: th.paperLine}));
  // --- full views
  {
    const top = M + L.capH, bw = D.w - 2 * M, bh = D.h - M - top;
    const fitBox = (x0, x1, y0, y1, kMax) => {
      const kF = clamp(Math.min(bw / (x1 - x0), bh / (y1 - y0)), L.kFullMin, kMax);
      return {x: M + (bw - kF * (x1 - x0)) / 2 - kF * x0, y: top + (bh - kF * (y1 - y0)) / 2 - kF * y0, k: kF};
    };
    const gx0 = Math.min(geo.bbox.x, tagX, L.notesBox.x) - 10, gx1 = Math.max(geo.bbox.x + geo.bbox.w, tagX + T3.w, L.notesBox.x + L.notesBox.w) + 10;
    L.Tf = fitBox(gx0, gx1, geo.bbox.y - 10, Math.max(tagY + T3.h, L.notesBottom) + 10, 1.45);
    // build view: the notes sit directly under the walk (no tag yet)
    L.notesShiftBuild = (geo.bbox.y + geo.bbox.h + 20) - L.notesBox.y;
    const nx0 = L.notesNode ? Math.min(geo.bbox.x, L.notesBox.x) : geo.bbox.x, nx1 = L.notesNode ? Math.max(geo.bbox.x + geo.bbox.w, L.notesBox.x + L.notesBox.w) : geo.bbox.x + geo.bbox.w;
    L.Tf0 = fitBox(nx0 - 16, nx1 + 16, geo.bbox.y - 16, (L.notesNode ? L.notesBottom + L.notesShiftBuild : geo.bbox.y + geo.bbox.h) + 16, 1.6);
  }
  // --- caption
  L.caption = null;
  if (ctx.show('all')) {
    const txt = p.contextLabels.context || t.contextDefault;
    // never larger than the notes of the full views (which may be drawn slightly smaller in text-dense tall sets)
    const cs = Math.min(L.capSize, L.ns * L.Tf.k);
    const ft = ctx.fit(txt, {maxWidth: D.w - 2 * M, size: cs, minSize: cs, maxLines: 2, weight: 600});
    L.caption = g({name: 'caption', opacity: 0, 'data-role': 'content'}, textBlock(ft, {x: M, y: M + (L.capH - ft.height) / 2 - 4, fill: th.fgSoft}));
  }
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    // strict pass: the largest text size at which everything fits at its design scale; if none reaches the supplied
    // zoom, a relaxed pass lets the full views shrink slightly (text-dense sets in tall boxes)
    const search = (relax, capPx, S0) => {
      let s = (S0 || SHAPES[ctx.view.shape]).size;
      let L = compose(ctx, s, relax, capPx, S0);
      const tried = [];
      let steps = 0;
      for (let it = 0; it < 30 && !L.fits; it++) {
        tried.push({s: r(s), ...L.budget});
        s *= 0.95;
        L = compose(ctx, s, relax, capPx, S0);
        steps++;
      }
      if (L.fits && steps) {
        let lo = s, hi = s / 0.95;
        for (let k = 0; k < 6; k++) {
          const mid = (lo + hi) / 2;
          const Lm = compose(ctx, mid, relax, capPx, S0);
          if (Lm.fits) { lo = mid; L = Lm; } else hi = mid;
        }
      }
      L.budget = {...L.budget, relax, capPx, tried: tried.slice(0, 6)};
      return L;
    };
    // a ~20.5 px context caption (and a thumbnail whose card text is at least that) first; then smaller captions
    const best = S0 => {
      let L = null;
      for (const capPx of [20.5, 16.5]) {
        for (const relax of [false, true]) {
          const Lt = search(relax, capPx, S0);
          if (Lt.fits) { L = Lt; break; }
          if (!L) L = Lt;
        }
        if (L.fits) break;
      }
      return L;
    };
    const L = best(null);
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      L.caption,
      g({name: 'ctx'}, L.ctxNodes, L.pinNode, L.notesNode, L.tagNode),
      L.slipUnder,
      L.lens.node,
      L.bar,
      L.slipNode,
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const th = ctx.theme;
    const geo = L.geo;
    const nodes = {};
    // --- context view: full size → thumbnail while inspecting → full size again
    const shrink = ease.inOutCubic(seg(u, ...W.shrink));
    const grow = ease.inOutCubic(seg(u, ...W.grow));
    const kc = shrink * (1 - grow);
    const TF = grow > 0 ? L.Tf : L.Tf0;
    const Tc = {x: lerp(TF.x, L.Tt.x, kc), y: lerp(TF.y, L.Tt.y, kc), k: lerp(TF.k, L.Tt.k, kc)};
    nodes.ctx = {transform: tstr(Tc)};
    // --- build: the gap opens and reveals the card in its status BEFORE
    const pr = ease.inOutCubic(seg(u, ...W.open));
    const oF = {dx: geo.closed.fact.dx * (1 - pr), dy: geo.closed.fact.dy * (1 - pr)};
    const oC = {dx: geo.closed.conclusion.dx * (1 - pr), dy: geo.closed.conclusion.dy * (1 - pr)};
    nodes.fact = {transform: T(oF.dx, oF.dy)};
    nodes.conc = {transform: T(oC.dx, oC.dy)};
    if (geo.X) {
      const fR = geo.boxes.fact.x + geo.boxes.fact.w + oF.dx, cLx = geo.boxes.conclusion.x + oC.dx;
      nodes['gapclip-r'] = {x: r(fR), y: r(geo.board.y - 40), width: r(Math.max(0, cLx - fR)), height: r(geo.board.h + 80)};
    } else {
      const fB = geo.boxes.fact.y + geo.boxes.fact.h + oF.dy, cT = geo.boxes.conclusion.y + oC.dy;
      nodes['gapclip-r'] = {x: r(geo.board.x - 40), y: r(fB), width: r(geo.board.w + 80), height: r(Math.max(0, cT - fB))};
    }
    const kOf = st => (st === 'stated' ? 1 : -1);
    const latch = ease.inOutCubic(seg(u, ...W.latch));
    const dep = seg(u, ...W.dep);
    const depE = reduced ? ease.outCubic(dep) : ease.inOutCubic(dep);
    const kBefore = lerp(-1, kOf(L.statusBefore), latch);
    const k = dep > 0 ? lerp(kOf(L.statusBefore), kOf(L.statusAfter), depE) : kBefore;
    Object.assign(nodes, L.hF.frame(k), L.hC.frame(k), L.zhF.frame(k), L.zhC.frame(k));
    // look: one clean swap when the dependent change starts (no blend of pencil and print)
    const look = dep > 0 ? 1 : 0;
    nodes.prmB = {opacity: 1 - look};
    nodes.prmA = {opacity: look};
    nodes.zprmB = {opacity: 1 - look};
    nodes.zprmA = {opacity: look};
    const lvl = st => (st === 'stated' ? 1 : 0);
    const liftBefore = lvl(L.statusBefore) * latch;
    const lift = dep > 0 ? lerp(lvl(L.statusBefore), lvl(L.statusAfter), depE) : liftBefore;
    nodes.recess = {opacity: r(1 - lift, 3)};
    nodes.zrecess = {opacity: r(1 - lift, 3)};
    nodes['prm-lift'] = {transform: `translate(${r(-2 * lift)} ${r(-3 * lift)})`};
    nodes['z-lift'] = {transform: `translate(${r(-2 * lift)} ${r(-3 * lift)})`};
    // --- texts: the context swaps cleanly (old out, then new in); in the lens the old value leaves as a slip
    const detached = u >= W.detach[0];
    const ctxOut = seg(u, ...W.ctxOut);
    const newIn = ease.inOutSine(seg(u, ...W.newIn));
    nodes['c-before'] = {opacity: r(1 - ctxOut, 3)};
    nodes['c-after'] = {opacity: r(newIn, 3)};
    nodes['z-before'] = {opacity: detached ? 0 : 1};
    nodes['z-after'] = {opacity: r(newIn, 3)};
    // --- lens: laid on the card (scale 1), lifted to its destination, set back, removed
    const settle = seg(u, ...W.settle);
    const open = ease.inOutCubic(seg(u, ...W.openL));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pOpen = open * (1 - close);
    const dim = seg(u, ...W.dim) * (1 - seg(u, ...W.undim));
    const lf = L.lens.frame(pOpen, dim);
    const away = seg(u, ...W.away);
    const vis = u < W.settle[0] ? 0 : settle * (1 - away);
    // the lens follows its card while the context is still shrinking / already growing: its source is the card's
    // CURRENT place (scale 1 there), so the lens can open during the shrink and close during the growth
    const srcNow = {x: Tc.x + Tc.k * L.srcL.x, y: Tc.y + Tc.k * L.srcL.y, w: L.srcL.w * Tc.k, h: L.srcL.h * Tc.k};
    const S = srcNow, Dd = L.dest;
    const R = {x: lerp(S.x, Dd.x, pOpen), y: lerp(S.y, Dd.y, pOpen), w: lerp(S.w, Dd.w, pOpen), h: lerp(S.h, Dd.h, pOpen)};
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const kx = R.w / L.srcL.w, ky = R.h / L.srcL.h;
    lf['lz-cliprect'] = rect;
    lf['lz-bg'] = rect;
    lf['lz-border'] = rect;
    lf['lz-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    lf['lz-content'] = {transform: `translate(${r(R.x - (L.Tt.x / L.kt + L.srcL.x) * kx)} ${r(R.y - (L.Tt.y / L.kt + L.srcL.y) * ky)}) scale(${r(kx / L.kt, 5)} ${r(ky / L.kt, 5)})`};
    const thumbNow = kc >= 0.999;
    const cone = coneCorners(S, R);
    const coneOn = vis > 0 && pOpen > 0.05;
    lf['lz-coneA'] = {x1: r(cone[0].x), y1: r(cone[0].y), x2: r(cone[1].x), y2: r(cone[1].y), opacity: coneOn ? r(vis, 3) : 0};
    lf['lz-coneB'] = {x1: r(cone[2].x), y1: r(cone[2].y), x2: r(cone[3].x), y2: r(cone[3].y), opacity: coneOn ? r(vis, 3) : 0};
    lf['lz-win'] = {opacity: r(vis, 3)};
    // the source outline and the dimming hole belong to the thumbnail's resting place
    lf['lz-src'] = {opacity: pOpen > 0.01 && vis > 0 && thumbNow ? 1 : 0};
    if (lf['lz-dim']) lf['lz-dim'] = {opacity: thumbNow ? lf['lz-dim'].opacity : 0};
    Object.assign(nodes, lf);
    // while the opaque lens lies over (or lifts off) its own card, the card's context text waits (no doubled words)
    const lensOverCard = vis > 0 && pOpen > 0.001 && R.x < S.x + S.w && S.x < R.x + R.w && R.y < S.y + S.h && S.y < R.y + R.h;
    if (lensOverCard) { nodes['c-before'].opacity = 0; nodes['c-after'].opacity = 0; }
    // the opaque lens window hides whatever context text it passes over (its own copy shows instead)
    if (L.ctxTextNodes) {
      for (const [card, names] of Object.entries(L.ctxTextNodes)) {
        const bx = geo.boxes[card];
        const q0 = tmap(Tc, {x: bx.x + (card === 'fact' ? oF.dx : card === 'conclusion' ? oC.dx : 0), y: bx.y + (card === 'fact' ? oF.dy : card === 'conclusion' ? oC.dy : 0)});
        const cb = {x: q0.x, y: q0.y, w: bx.w * Tc.k, h: bx.h * Tc.k};
        const ix = Math.min(R.x + R.w, cb.x + cb.w) - Math.max(R.x, cb.x), iy = Math.min(R.y + R.h, cb.y + cb.h) - Math.max(R.y, cb.y);
        // hidden only when the window covers most of the card; a partly covered neighbour is simply occluded by the
        // opaque window (its words cut at the rim, as under a real magnifier) instead of turning into a blank card
        const under = vis > 0 && pOpen > 0.001 && card !== L.which && ix > 0 && iy > 0 && ix * iy > 0.6 * cb.w * cb.h;
        for (const nm of names) nodes[nm] = {opacity: under ? 0 : 1};
      }
    }
    Object.assign(nodes, barMagnifierFrame('bar', R, vis, L.handleLeft ? 'left' : 'right'));
    // the handle only shows once the lens has lifted off its card (it never lies across a neighbour's text)
    const handleOp = r(clamp((pOpen - 0.55) / 0.3), 3);
    for (const k of ['bar-knob', 'bar-ferrule']) nodes[k] = {...nodes[k], opacity: handleOp};
    nodes['bar-ridge'] = {...nodes['bar-ridge'], opacity: r(0.2 * handleOp, 3)};
    // --- the slip: picked up in the lens, pulled down out of it, struck, then carried into the tag
    const det = ease.outCubic(seg(u, ...W.detach));
    const drop = ease.inOutCubic(seg(u, ...W.drop));
    const toTag = ease.inOutCubic(seg(u, ...W.toTag));
    const strike = ease.inOutSine(seg(u, ...W.strike));
    const {inPose, outPose, tagPoseL} = L.poses;
    const tagW = {...tmap(Tc, tagPoseL), k: Tc.k * tagPoseL.k};
    let pose;
    if (toTag > 0) pose = {x: lerp(outPose.x, tagW.x, toTag), y: lerp(outPose.y, tagW.y, toTag), k: lerp(outPose.k, tagW.k, toTag)};
    else pose = {x: lerp(inPose.x, outPose.x, drop), y: lerp(inPose.y, outPose.y, drop), k: lerp(inPose.k, outPose.k, drop) * (1 + 0.04 * det * (1 - drop))};
    const slipT = `translate(${r(pose.x)} ${r(pose.y)}) scale(${r(pose.k, 4)}) translate(${r(-L.tx)} ${r(-L.ty)})`;
    // from the moment the lens starts closing, the slip is the copy under the lens
    const under = u >= W.close[0];
    nodes.slip = {opacity: detached && !under ? 1 : 0, transform: slipT};
    nodes.slipU = {opacity: under ? 1 : 0, transform: slipT};
    nodes['slipU-shadow'] = {opacity: r(1 - toTag, 3)};
    nodes['slip-paper'] = {opacity: r(det, 3)};
    nodes['slip-shadow'] = {opacity: r(det * (1 - toTag), 3)};
    L.strikes.forEach((st, i) => { nodes[`slip-strike${i}`] = {x2: r(st.x1 + st.w * strike), opacity: strike > 0 ? 1 : 0}; });
    // --- changed-datum marker
    const pinP = ease.outCubic(seg(u, ...W.pin));
    nodes.pin = {opacity: seg(u, ...W.lead) > 0 || pinP > 0 ? 1 : 0};
    nodes['pin-head'] = {transform: `${T(L.pin.x, L.pin.y)} scale(${r(pinP > 0 ? 0.4 + 0.6 * pinP : 0, 3)})`};
    nodes['pin-lead'] = {'stroke-dashoffset': r(L.leadLen * (1 - seg(u, ...W.lead)))};
    nodes.tag = {opacity: r(seg(u, ...W.tag), 3)};
    if (L.caption) nodes.caption = {opacity: r(seg(u, ...W.caption), 3)};
    // notes: in the full views only (build, then the hold); in the build view they sit right under the walk
    const notesOp = seg(u, ...W.notesIn) * (1 - seg(u, ...W.notesOut)) + seg(u, ...W.notesBack);
    if (L.notesNode) nodes.notes = {opacity: r(notesOp, 3), transform: grow > 0 ? 'translate(0 0)' : T(0, L.notesShiftBuild)};

    // --- semantics
    const datum = newIn > 0 ? (newIn >= 1 ? 'after' : 'switching') : ctxOut > 0 ? 'switching' : 'before';
    const statusNow = dep >= 1 ? L.statusAfter : L.statusBefore;
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      textSize: r(L.s, 2),
      wordSplit: !!L.geo.wordSplit,
      focusTarget: L.which,
      gapOpen: r(pr, 3),
      contextScale: r(Tc.k, 4),
      contextThumb: kc >= 1,
      contextFull: kc === 0,
      datum,
      datumValue: datum === 'after' ? L.afterText : datum === 'before' ? L.beforeText : null,
      oldValueShownIn: detached ? (toTag >= 1 ? 'tag' : 'slip') : ctxOut < 1 ? 'card' : 'none',
      slipVisible: detached,
      slipStruck: strike >= 1,
      slipInTag: toTag >= 1,
      slip: P2(pose),
      slipHome: P2(inPose),
      tagSlot: P2(tagW),
      statusBefore: L.statusBefore,
      statusAfter: L.statusAfter,
      premiseStatus: statusNow,
      premiseLook: look ? L.statusAfter : L.statusBefore,
      hingeK: r(k, 3),
      lift: r(lift, 3),
      dependentChanged: dep >= 1,
      lensOpen: r(pOpen, 3),
      lensOverCard,
      cardTextHiddenUnderLens: lensOverCard && nodes['c-after'].opacity === 0 && nodes['c-before'].opacity === 0,
      lensVisible: vis > 0.01,
      lensScale: r(R.w / S.w, 4),
      lensRect: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
      sceneFill: (() => {
        // union of what is on screen: the context (full or thumbnail, with its notes/tag in the full views), the lens
        // and its handle, the slip — relative to the room under the caption
        const bx = geo.bbox;
        const boxes = [{x: Tc.x + Tc.k * bx.x, y: Tc.y + Tc.k * bx.y, w: bx.w * Tc.k, h: bx.h * Tc.k}];
        if (L.notesNode && notesOp > 0.5) boxes.push({x: Tc.x + Tc.k * L.notesBox.x, y: Tc.y + Tc.k * (L.notesBox.y + (grow > 0 ? 0 : L.notesShiftBuild)), w: L.notesBox.w * Tc.k, h: L.notesBox.h * Tc.k});
        if (seg(u, ...W.tag) > 0.5) boxes.push({x: Tc.x + Tc.k * L.tagBox.x, y: Tc.y + Tc.k * L.tagBox.y, w: L.tagBox.w * Tc.k, h: L.tagBox.h * Tc.k});
        if (vis > 0.5) boxes.push({x: R.x, y: R.y, w: R.w + (handleOp > 0.5 ? BAR_HANDLE : 0), h: R.h});
        if (detached) boxes.push({x: pose.x - L.pad * pose.k, y: pose.y - L.pad * 0.8 * pose.k, w: L.slipW * pose.k, h: L.slipH * pose.k});
        const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
        const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
        const roomW = ctx.design.w - 2 * M, roomH = ctx.design.h - M - (M + L.capH);
        return {w: r(Math.min(1, (x1 - x0) / roomW), 3), h: r(Math.min(1, (y1 - y0) / roomH), 3)};
      })(),
      markerColors: [th.accent2, th.inkSoft],
      alarmColor: th.accent,
      sourceOnCard: (() => { const q = tmap(Tc, {x: L.srcL.x, y: L.srcL.y}); return Math.abs(q.x - S.x) < 0.5 && Math.abs(q.y - S.y) < 0.5 && Math.abs(L.srcL.w * Tc.k - S.w) < 0.5; })(),
      lensAtSource: Math.abs(R.x - S.x) < 0.5 && Math.abs(R.y - S.y) < 0.5 && Math.abs(R.w - S.w) < 0.5,
      lens: P2({x: R.x + R.w / 2, y: R.y + R.h / 2}),
      dim: r(dim, 3),
      zoom: r(L.z, 3),
      tagOpacity: r(seg(u, ...W.tag), 3),
      leaderDrawn: r(seg(u, ...W.lead), 3),
      pinVisible: pinP >= 1,
      markerVisible: seg(u, ...W.tag) >= 1,
      notesVisible: !!L.notesNode && notesOp >= 1,
      notes: [...L.notes.items.map(it => it.text), L.key ? L.key.text : null].filter(Boolean),
      fact: P2({x: geo.boxes.fact.x + geo.boxes.fact.w / 2 + oF.dx, y: geo.boxes.fact.y + oF.dy}),
      bodyPx1080: r(Math.min(...geo.bodySizes) / L.u, 2),
      notePx1080: r(L.ns / L.u, 2),
      arrangement: L.arrangement,
      slipUnderLens: under,
      slipOutOfLens: (() => {
        const sb = {x: pose.x - L.pad * pose.k, y: pose.y - L.pad * 0.8 * pose.k, w: L.slipW * pose.k, h: L.slipH * pose.k};
        return !(sb.x < R.x + R.w && R.x < sb.x + sb.w && sb.y < R.y + R.h && R.y < sb.y + sb.h);
      })(),
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-08-inspect',
    title: 'Hidden premise — a reading magnifier lifts the revealed card out and its datum is replaced',
    titleEs: 'Premisa oculta — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Premisa oculta',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: fact and conclusion pulled apart, the gap revealing the intermediate card in its supplied status. A rectangular reading magnifier is laid on one card (a real copy at the same coordinates) and lifted out enlarged. The old text leaves the lens as a paper slip and is struck through (kept in view); the supplied new text takes its place and only then the card’s dependent state changes to the status supplied for after (pencil ↔ printed, hinges folded ↔ latched). The lens is set back and the struck slip becomes a changed-datum tag pinned to the card. No conclusion is drawn.',
    tags: ['reasoning', 'hidden premise', 'enthymeme', 'inspect', 'magnifier', 'substitution', 'before-after', 'hinge', 'stated', 'unstated'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/premisa-oculta.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
