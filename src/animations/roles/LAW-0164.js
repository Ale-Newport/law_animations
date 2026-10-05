/**
 * LAW-0164 — Entrevista a cliente · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.18] context: the state produced by the exchange — the client at
 *              the table with the account still in the speech bubble; the
 *              interviewer holds the notes board: the question asked, a note
 *              line (label + the detail as first given, e.g. "the same week")
 *              and a day strip with the pen loop over the supplied days.
 *  [0.18–0.37] isolate: the context dims and a lens grows out of the note
 *              line + strip — a real enlarged copy drawn at the same
 *              coordinates as the board.
 *  [0.37–0.64] substitute (inside the lens only): the old value is struck
 *              through and stays readable (traceable); the supplied
 *              alternative value is written on the line below; only the
 *              dependent geometry changes — the old loop becomes a faint
 *              ghost and a ring is drawn around the supplied day(s).
 *  [0.64–0.80] return: the lens closes back onto its source (0.64–0.72) and,
 *              overlapping the close, the same update happens on the board
 *              in the context (strike from 0.68, new line) and
 *              the interviewer's pen redraws the new ring from the SOLVED
 *              hand; a neutral Δ marker and its label mark the changed
 *              datum. The main action is complete by 0.80; 0.80–1.00 is the hold.
 * Seeking back to any earlier time restores the old datum exactly. Nothing
 * is assessed: no validity, credibility, responsibility or outcome.
 * @module animations/roles/LAW-0164
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {runTrack} from './kits/mediation-table.js';
import {
  interviewFields, INTERVIEW_DEFAULTS, KIT_STRINGS, captionOf, measureBoard, questionBoard, interviewStage, talkBubble,
  keyChip, fitWords, wchip, overlaps, freeSpot, gridCands, segHits,
} from './kits/entrevista-a-cliente.js';

const ID = 'LAW-0164';
const DURATION = 8000;
const BEATS = {context: [0, 0.18], isolate: [0.18, 0.37], substitute: [0.37, 0.64], back: [0.64, 1]};
// the context update overlaps the lens close so the main action is complete by u = 0.8 (hold 0.8–1)
const W = {
  open: [0.18, 0.34],
  lStrike: [0.37, 0.42], lOld: [0.42, 0.46], lNew: [0.44, 0.52], lGhost: [0.5, 0.54], lRing: [0.52, 0.59],
  close: [0.64, 0.72],
  cStrike: [0.68, 0.71], cOld: [0.7, 0.72], cNew: [0.7, 0.74],
  penTo: [0.65, 0.7], cRing: [0.7, 0.75], cGhost: [0.72, 0.75], penBack: [0.75, 0.8], lean: [0.65, 0.7], unlean: [0.75, 0.8],
  marker: [0.74, 0.77], markLabel: [0.74, 0.78],
};
const LEAN_B = 12;
// the interviewer holds the board by the lower half of its right edge, away from her face
const BOARD_GAP = 96;
const GRIP_FRAC = 0.64;
// the lens copy is invisible until its window is this far (design units) clear of the source
const LENS_CLEAR = 10;
// the lens window is translucent while its open progress is below 0.25 (lens.js: opacity = 4p); the copy is
// shown only on the OPAQUE card (which hides whatever it covers) or once the window is clear of the source,
// so the note is never seen twice in one place. It fades in over COPY_FADE of open progress.
const WIN_OPAQUE = 0.25;
const COPY_FADE = 0.12;
const copyVisible = (open, pClear) => clamp((open - Math.min(WIN_OPAQUE, pClear)) / COPY_FADE);
const OLD_TRACE = 0.6;

const STRINGS = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const spanF = d => obj(d, {from: int('First day', 1, 7), to: int('Last day', 1, 7)}, ['from', 'to']);

const sceneSchema = {
  ...interviewFields,
  props: obj('Context content (supplied text)', {
    account: str('The client’s account shown in the speech bubble', 170),
    question: str('The question printed on the interviewer’s notes board', 90),
    detailLabel: str('Label of the note line whose value is substituted', 40),
  }),
  focusTarget: oneOf('Detail that is enlarged and substituted: the note line (its value and the dependent strip mark)', ['detail']),
  beforeValue: str('Value of the note line before the substitution (as first given)', 90),
  afterValue: str('Value after the substitution (the alternative datum supplied by the preset)', 90),
  detailGeometry: obj('Lens and dependent geometry', {
    zoom: num('Maximum magnification of the lens', 1.5, 4),
    placement: oneOf('Where the lens sits relative to its source', ['auto', 'left', 'right', 'top', 'bottom']),
    days: int('Cells of the day strip', 3, 7),
    beforeSpan: spanF('Strip cells marked for the value before the substitution'),
    afterSpan: spanF('Strip cells marked for the value after the substitution'),
  }),
  contextLabels: obj('Labels of the context view', {context: str('Caption of the context view', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...INTERVIEW_DEFAULTS,
  props: {
    account: 'The parcel arrived damaged and I emailed the seller the same week.',
    question: 'When did you email the seller?',
    detailLabel: 'Email sent',
  },
  focusTarget: 'detail',
  beforeValue: 'the same week',
  afterValue: 'day 3',
  detailGeometry: {zoom: 2.6, placement: 'auto', days: 7, beforeSpan: {from: 1, to: 7}, afterSpan: {from: 3, to: 3}},
  contextLabels: {context: 'Interview notes after the exchange', marker: 'Changed datum (as supplied)'},
};

const CFG = {
  landscape: {size: 24, bw: 330, crop: 60, kMax: 1.9, kMin: 1.0, regionW: 1},
  square: {size: 22, bw: 300, crop: 60, kMax: 1.5, kMin: 0.8, regionW: 1},
  portrait: {size: 30, bw: 360, crop: 156, floor: true, kMax: 1.9, kMin: 1.0, regionW: 1},
};

/** Note-line content (board-local): label, old value (strikable), new value (revealed), optional Δ marker. */
function slotContent(ctx, pfx, SL, showText, withMarker) {
  const th = ctx.theme;
  const parts = [];
  const bars = (f, x, y, color, w) => f.lines.map((ln, j) => h('rect', {x: r(x), y: r(y + j * f.lineHeight + f.size * 0.2), width: r(Math.min(w, ctx.measure(ln || 'xxxx', f.size, f.weight, f.family))), height: r(f.size * 0.62), rx: r(f.size * 0.3), fill: color}));
  if (showText) parts.push(textBlock(SL.label, {x: SL.x, y: SL.yLabel, fill: th.inkSoft}));
  else parts.push(...bars(SL.label, SL.x, SL.yLabel, th.paperLine, SL.w));
  // old value + strike lines (one per text line, drawn in sequence)
  const strikes = SL.old.lines.map((ln, i) => {
    const lw = ctx.measure(ln || 'xxxx', SL.old.size, SL.old.weight, SL.old.family) + 8;
    const y = SL.yOld + i * SL.old.lineHeight + SL.old.size * 0.55;
    return {name: `${pfx}-st${i}`, len: lw, node: h('line', {name: `${pfx}-st${i}`, x1: r(SL.x - 4), x2: r(SL.x - 4 + lw), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw)} ${r(lw + 10)}`, 'stroke-dashoffset': r(lw), opacity: 0})};
  });
  parts.push(g({name: `${pfx}-old`}, showText ? textBlock(SL.old, {x: SL.x, y: SL.yOld, fill: th.ink}) : bars(SL.old, SL.x, SL.yOld, th.inkSoft, SL.w)));
  parts.push(...strikes.map(q => q.node));
  // new value: fades in as a whole (a clip wipe would show sliced glyphs)
  parts.push(g({name: `${pfx}-new`, opacity: 0}, showText ? textBlock(SL.neu, {x: SL.x, y: SL.yNew, fill: th.accent2}) : bars(SL.neu, SL.x, SL.yNew, th.accent2, SL.w)));
  let mk = null;
  if (withMarker) {
    mk = {x: SL.x + Math.min(SL.w - SL.markR, SL.neu.width + SL.markR + 12), y: SL.yNew + SL.neu.size * 0.55, r: SL.markR};
    parts.push(changedMarker(ctx, {name: `${pfx}-mk`, x: mk.x, y: mk.y, radius: SL.markR, opacity: 0}));
    if (SL.mkLab) parts.push(g({name: `${pfx}-mklab`, opacity: 0}, textBlock(SL.mkLab, {x: SL.x, y: SL.yMk, fill: th.accent2})));
  }
  return {
    node: g(null, parts), mk,
    /** @param {{strike:number, old:number, reveal:number, marker?:number, markLabel?:number}} s */
    frame(s) {
      const out = {};
      const n = strikes.length;
      strikes.forEach((q, i) => {
        const pp = clamp(s.strike * n - i);
        out[q.name] = {'stroke-dashoffset': r(q.len * (1 - pp)), opacity: pp > 0 ? 1 : 0};
      });
      out[`${pfx}-old`] = {opacity: r(s.old, 3)};
      out[`${pfx}-new`] = {opacity: r(clamp(s.reveal), 3)};
      if (withMarker) out[`${pfx}-mk`] = {opacity: r(clamp(s.marker || 0), 3)};
      if (withMarker && SL.mkLab) out[`${pfx}-mklab`] = {opacity: r(clamp(s.markLabel || 0), 3)};
      return out;
    },
  };
}

function tryLayout(ctx, S, k, va = 0.5) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const dg = p.detailGeometry;
  const problems = [];
  const minS = Math.max(17, S * 0.86);

  // --- the note line (slot) and the board
  const bw = C.bw;
  const pad0 = Math.max(10, S * 0.62);
  const markR = S * 0.62;
  const sw = bw - pad0 * 2;
  const label = fitWords(`${p.props.detailLabel}:`, {maxWidth: sw, size: S * 0.92, minSize: Math.min(S * 0.92, minS), maxLines: 2, weight: 700});
  const old = fitWords(p.beforeValue, {maxWidth: sw - 8, size: S, minSize: minS, maxLines: 3, weight: 600});
  const neu = fitWords(p.afterValue, {maxWidth: sw - markR * 2 - 16, size: S, minSize: minS, maxLines: 3, weight: 700});
  // the changed-datum label is written on the board, directly under the changed value (shown with the key)
  const mkLab = showKey ? fitWords(p.contextLabels.marker, {maxWidth: sw, size: S, minSize: minS, maxLines: 3, weight: 600}) : null;
  if (label.truncated || old.truncated || neu.truncated || (mkLab && mkLab.truncated)) problems.push('slot-truncated');
  const lg = S * 0.3;
  const slotH = label.height + lg + old.height + lg + Math.max(neu.height, markR * 2) + (mkLab ? lg * 0.6 + mkLab.height : 0);
  const stripW = Math.min(sw, 118 * k);
  const M = measureBoard(ctx, {w: bw, title: p.props.question, questions: [], size: S, minSize: minS, maxLines: 3, titleLines: 3, slotH, slotFirst: true, strip: {days: dg.days, w: stripW, cell: Math.min((stripW / dg.days) * 1.15, S * 1.6)}});
  if (M.truncated) problems.push('title-truncated');
  const SL = {x: M.slot.x, w: M.slot.w, yLabel: M.slot.y, yOld: M.slot.y + label.height + lg, label, old, neu, markR};
  SL.yNew = SL.yOld + old.height + lg;
  SL.mkLab = mkLab;
  SL.yMk = SL.yNew + Math.max(neu.height, markR * 2) + lg * 0.6;

  // --- staging: interviewer's board gap BOARD_GAP, client clearance 108
  const X = BOARD_GAP + bw / k + 108;
  const stageW = (X + 132) * k;
  const regionW = D.w * C.regionW;
  if (stageW > regionW - 10) problems.push('too-wide');
  const pad = S * 0.7;
  // account bubble over the client (and over the board top)
  const bubW = Math.min(regionW - 20, stageW + 20);
  const main = fitWords(p.props.account, {maxWidth: bubW - pad * 2, size: S, minSize: minS, maxLines: 4, weight: 600});
  if (main.truncated) problems.push('account-truncated');
  const h1 = pad * 2 + main.height;
  const boardTopLocal = -50 - (M.h + M.pad * 1.8) / k;
  const bubbleLocal = Math.min(-250, boardTopLocal - 16 / k);
  const bodyH = h1 + (C.crop - bubbleLocal) * k;
  // portrait: the lens goes under the scene; reserve at least 40 % of the height for it
  const availH = D.h - 16;
  if (bodyH > availH) problems.push('too-tall');
  if (problems.length) return {ok: false, problems};
  const x0 = (D.w - stageW) / 2;
  // vertical placement: centred first; off-centre only when that leaves room for a larger lens
  const y0 = 8 + (D.h - 16 - bodyH) * va;
  const A = {x: x0 + 66 * k, y: y0 + h1 - bubbleLocal * k};

  const slotCtx = slotContent(ctx, 'cs', SL, showAll, true);
  const marks = {before: dg.beforeSpan, after: dg.afterSpan};
  const st = interviewStage(ctx, {prefix: 'st', k, A, X, crop: C.crop, floor: C.floor, actors: p.actors, board: M, boardText: showAll, boardOpts: {title: p.props.question, questions: [], marks, gripFrac: GRIP_FRAC}, boardGap: BOARD_GAP, boardExtra: slotCtx.node, gesture: {x: 90, y: -86}});
  const bp = st.boardAt({});
  const bubX = (D.w - bubW) / 2;
  // the tail ends just in front of the client's mouth, clear of the face
  const tip = st.tipA;
  const bubBottom = A.y + bubbleLocal * k;
  const bub = talkBubble(ctx, {name: 'acc', x: bubX, w: bubW, bottom: bubBottom, tip, tailBaseX: tip.x + 8 * k, pad, main, extra: null, showText: showAll, stroke: '#3b4450'});
  const tailClear = st.tipClear(tip, 'a');
  if (!tailClear) problems.push('tail-face');
  const tailBox = {x: Math.min(tip.x, tip.x + 8 * k) - 34, y: bubBottom, w: 8 * k + 68, h: tip.y - bubBottom};
  const boardFull = {x: st.boardBox.x - M.pad, y: st.boardBox.y - M.pad * 1.8, w: M.w + M.pad * 2, h: M.h + M.pad * 2.8};
  if (overlaps(bub.box, boardFull, 4)) problems.push('bubble-board');
  if (segHits({x: tip.x + 8 * k, y: bubBottom}, tip, boardFull)) problems.push('tail-board');

  // --- lens: source = note line + strip on the board (world), destination by placement
  const srcL = {x: M.pad * 0.3, y: M.slot.y - M.pad * 0.5, w: M.w - M.pad * 0.6, h: M.strip.y + M.strip.h - M.slot.y + M.pad * 1.1};
  const sTL = bp.toWorld({x: srcL.x, y: srcL.y});
  const source = {x: sTL.x, y: sTL.y, w: srcL.w, h: srcL.h};
  const zMax = dg.zoom;
  const cand = [];
  const m = 26;
  const region = (name, x, y, w, hh) => {
    if (w <= 0 || hh <= 0) return;
    const z = Math.min(w / source.w, hh / source.h, zMax);
    const dw = source.w * z, dh = source.h * z;
    // centre on the source's axis, clamped into the region
    const cx = clamp(source.x + source.w / 2, x + dw / 2, x + w - dw / 2);
    const cy = clamp(source.y + source.h / 2, y + dh / 2, y + hh - dh / 2);
    cand.push({name, z, dest: {x: cx - dw / 2, y: cy - dh / 2, w: dw, h: dh}});
  };
  const B = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
  region('right', source.x + source.w + m, B.y, B.x + B.w - (source.x + source.w + m), B.h);
  region('left', B.x, B.y, source.x - m - B.x, B.h);
  region('top', B.x, B.y, B.w, source.y - m - B.y);
  region('bottom', B.x, source.y + source.h + m, B.w, B.y + B.h - (source.y + source.h + m));
  // largest zoom wins; ties prefer right, bottom, left, top
  const pref = {right: 0, bottom: 1, left: 2, top: 3};
  cand.sort((a, b) => (b.z - a.z) || (pref[a.name] - pref[b.name]));
  const pick = dg.placement === 'auto' ? cand[0] : cand.find(c => c.name === dg.placement) || cand[0];
  if (!pick || pick.z < 1.45) { problems.push('lens-small'); return {ok: false, problems}; }
  const dest = pick.dest;
  // lens copy: a second board at the SAME coordinates as the context board
  // the copy's texts carry a zero-width mark: the open lens deliberately overprints the dimmed context
  const zw = f => ({...f, lines: f.lines.map(l => `\u200B${l}`)});
  const SLz = {...SL, label: zw(SL.label), old: zw(SL.old), neu: zw(SL.neu), mkLab: null};
  const Mz = {...M, title: {...M.title, fit: zw(M.title.fit)}};
  const slotLens = slotContent(ctx, 'ls', SLz, showAll, false);
  const bdLens = questionBoard(ctx, 'lbd', Mz, {showText: showAll, questions: [], title: p.props.question, marks});
  const lensContent = g({transform: bp.transform}, g({transform: T(-M.w, -M.h)}, bdLens.node, slotLens.node));
  // the dimming covers the context scene (not the empty margins)
  const ctxBox = {x: Math.min(bub.box.x, x0) - 10, y: bub.box.y - 10, w: Math.max(bub.box.x + bub.box.w, x0 + stageW) - Math.min(bub.box.x, x0) + 20, h: st.table.yBottom - bub.box.y + 20};
  const lz = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: ctxBox, color: th.accent});
  // the window (plus its drop shadow) must be clear of the source before the copy shows at all: find the
  // largest open progress at which it still touches the source; the copy fades in / out above it
  const winAt = q => ({x: lerp(source.x, dest.x, q), y: lerp(source.y, dest.y, q), w: lerp(source.w, dest.w, q) + 8, h: lerp(source.h, dest.h, q) + 12});
  let lo = 0, hi = 1;
  if (overlaps(winAt(1), source, LENS_CLEAR)) problems.push('lens-on-source');
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (overlaps(winAt(mid), source, LENS_CLEAR)) lo = mid; else hi = mid; }
  const pClear = hi;

  // --- pen: redraw the new ring in the context during the return
  const ringW = q => bp.toWorld(st.bd.markPolys.after.at(q));
  const track = [
    {a: W.penTo[0], b: W.penTo[1], to: ringW(0), ease: ease.inOutSine},
    {a: W.cRing[0], b: W.cRing[1], at: u => ringW(ease.inOutSine(seg(u, ...W.cRing)))},
    {a: W.penBack[0], b: W.penBack[1], to: st.rest.nibB, ease: ease.inOutSine},
  ];
  let reach = true, gripFace = st.pose({a: {}, b: {}}).semantic.gripFaceB;
  for (let q = 0; q <= 1.0001; q += 0.1) {
    const ps = st.pose({a: {}, b: {nib: ringW(q), lean: LEAN_B}}).semantic;
    reach = reach && ps.reach.b;
    gripFace = Math.min(gripFace, ps.gripFaceB);
  }
  if (!reach) problems.push('reach');
  // the board-holding hand stays clear of the interviewer's face (≥ 58 person units), also while she leans in
  if (gripFace < 62) problems.push('grip-face');

  // --- chips: names on the panel; caption, key and the marker label in free space
  const T0 = st.table;
  const chips = [];
  if (showKey) {
    const half = (T0.x1 - T0.x0) / 2 - 26 * k;
    const cy = T0.panelTop + 10 * k;
    const mk = (id, x, anchor, n) => wchip(ctx, captionOf(p, id), {x, y: cy, anchor, maxWidth: half, size: S, minSize: minS, maxLines: n, name: `chip-${id}`});
    let a = mk('client', T0.x0 + 20 * k, 'start', 1), b = mk('interviewer', T0.x1 - 20 * k, 'end', 1);
    if (a.fit.truncated || b.fit.truncated) { a = mk('client', T0.x0 + 20 * k, 'start', 3); b = mk('interviewer', T0.x1 - 20 * k, 'end', 3); }
    if (a.fit.truncated || b.fit.truncated || overlaps(a.box, b.box, 8) || Math.max(a.box.y + a.box.h, b.box.y + b.box.h) > T0.panelBottom - 2) problems.push('chips');
    chips.push(a, b);
  }
  const cMin = Math.min(M.minSize, label.size, old.size, neu.size, main.size, ...(mkLab ? [mkLab.size] : []), ...chips.map(c => c.fit.size));
  const capS = Math.max(Math.min(17, cMin), Math.min(S * 0.92, cMin));
  const tableBand = {x: T0.x0, y: T0.yFar, w: T0.x1 - T0.x0, h: T0.panelTop + 6 * k - T0.yFar};
  const obstacles = [bub.box, tailBox, boardFull, st.personBox('a'), st.personBox('b'), ...st.chairBoxes(), tableBand, ...chips.map(c => c.box)];
  // below the panel (full-body staging) the legs and floor are art, not free space
  if (C.floor) obstacles.push({x: T0.x0 - 60 * k, y: T0.panelBottom, w: T0.x1 - T0.x0 + 120 * k, h: T0.yBottom - T0.panelBottom});
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const cands = gridCands(bounds, 12);
  let caption = null, key = null, keyGap = null, keyAnchored = false;
  if (showKey) {
    const kProbe = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2});
    // anchored to the board: nearest free spot to the board's lower edge; the tabletop is allowed but not
    // the hands, the pen's path, the faces, the bubble or its tail
    const hb = q => ({x: q.x - 34 * k, y: q.y - 34 * k, w: 68 * k, h: 68 * k});
    const handBoxes = [];
    for (const nib of [st.rest.nibB, ...[0, 0.25, 0.5, 0.75, 1].map(ringW)]) {
      const ps = st.pose({a: {}, b: {nib, lean: nib === st.rest.nibB ? 0 : LEAN_B}}).semantic;
      handBoxes.push(hb(ps.handA), hb(ps.farA), hb(ps.handB), hb(ps.gripB), hb(ps.pen));
    }
    const keyObst = obstacles.filter(o => o !== tableBand).concat(handBoxes);
    const bb = {x: boardFull.x + boardFull.w / 2, y: boardFull.y + boardFull.h};
    const gapBoard = b => Math.hypot(Math.max(boardFull.x - b.x - b.w, 0, b.x - boardFull.x - boardFull.w), Math.max(boardFull.y - b.y - b.h, 0, b.y - boardFull.y - boardFull.h));
    const ks = freeSpot(cands, kProbe.box.w, kProbe.box.h, keyObst, bounds, 8, b => gapBoard(b) * 3 + Math.abs(b.x + b.w / 2 - bb.x) * 0.3 + Math.abs(b.y - bb.y) * 0.1);
    if (ks) {
      key = keyChip(ctx, ctx.t.key, {x: ks.x, y: ks.y, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2, name: 'key'});
      obstacles.push(key.box);
      keyGap = r(gapBoard(key.box), 1);
      // anchored: against the board's outline, or in the board's column on the table's front panel or
      // right under the table (full-body staging)
      const kb = key.box;
      const inColumn = kb.x < boardFull.x + boardFull.w && kb.x + kb.w > boardFull.x;
      const onPanel = kb.y >= T0.panelTop - 1 && kb.y + kb.h <= T0.panelBottom + 1;
      const underTable = kb.y >= T0.yBottom - 1 && kb.y - T0.yBottom <= 40;
      keyAnchored = keyGap <= 40 || (inColumn && (onPanel || underTable));
    } else problems.push('key');
  }
  if (showKey && !keyAnchored) problems.push('key-detached');
  if (showAll) {
    const cp = wchip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2, weight: 700, fill: th.paperShade});
    // just above the account bubble (the top of the context), centred on the scene
    const cs = freeSpot(cands, cp.box.w, cp.box.h, obstacles, bounds, 12, b => Math.abs(b.y + b.h - (bub.box.y - 14)) * 2 + Math.abs(b.x + b.w / 2 - D.w / 2) * 0.5);
    if (cs) { caption = wchip(ctx, p.contextLabels.context, {x: cs.x, y: cs.y, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2, weight: 700, fill: th.paperShade, name: 'caption'}); obstacles.push(caption.box); } else problems.push('caption');
  }
  if (problems.length) return {ok: false, problems};
  const vBot = bp.toWorld({x: SL.x, y: SL.yNew + neu.height}), lTop = bp.toWorld({x: SL.x, y: SL.yMk});
  const markGap = mkLab ? r(Math.hypot(lTop.x - vBot.x, lTop.y - vBot.y), 1) : null;
  return {ok: true, problems, S, k, tailClear, st, bp, bub, lz, source, dest, zoom: pick.z, placement: pick.name, slotCtx, slotLens, bdLens, SL, M, track, chips, caption, key, capS, markGap, pClear, keyGap, keyAnchored};
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    for (let S = C.size; S >= 17; S -= 1) {
      for (let k = C.kMax; k >= C.kMin - 1e-6; k -= 0.05) {
        for (const va of [0.5, 0.25, 0.75, 0, 1]) {
          const L = tryLayout(ctx, S, k, va);
          if (L.ok) return {...L, tries};
          if (tries.length < 40) tries.push(`${S}/${r(k)}/${va}:${L.problems.join('+')}`);
        }
      }
    }
    throw new Error(`${ID}: no layout fits (${tries.slice(-3).join(' | ')})`);
  },
  build(ctx, L) {
    return g(null,
      L.st.node,
      L.chips.map(c => c.node),
      L.bub.node,
      L.caption && L.caption.node,
      L.key && L.key.node,
      L.lz.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const x = w => seg(u, w[0], w[1]);
    const nodes = {};
    // lens open / close
    const open = ease.inOutCubic(x(W.open)) * (1 - ease.inOutCubic(x(W.close)));
    Object.assign(nodes, L.lz.frame(open, open));
    // no double image: while the lens window is translucent (collapsing onto / growing out of its source) it
    // is a blank card; the enlarged copy appears only on the opaque card, which covers the note beneath it
    const copyVis = copyVisible(open, L.pClear);
    nodes['lens-content'] = {...nodes['lens-content'], opacity: r(copyVis, 3)};
    // inside the lens: the substitution
    const lStrike = x(W.lStrike), lOld = lerp(1, OLD_TRACE, x(W.lOld)), lNew = ease.inOutSine(x(W.lNew));
    const lGhost = lerp(1, 0.3, x(W.lGhost)), lRing = ease.inOutSine(x(W.lRing));
    Object.assign(nodes, L.slotLens.frame({strike: lStrike, old: lOld, reveal: lNew}));
    Object.assign(nodes, L.bdLens.frame({marks: {before: {p: 1, opacity: lGhost}, after: {p: lRing}}}));
    // context: untouched until the lens has closed
    const cStrike = x(W.cStrike), cOld = lerp(1, OLD_TRACE, x(W.cOld)), cNew = ease.inOutSine(x(W.cNew));
    const cRing = ease.inOutSine(x(W.cRing)), cGhost = lerp(1, 0.3, x(W.cGhost));
    const marker = x(W.marker);
    Object.assign(nodes, L.slotCtx.frame({strike: cStrike, old: cOld, reveal: cNew, marker, markLabel: x(W.markLabel)}));
    const nib = runTrack(u, L.st.rest.nibB, L.track);
    const leanB = LEAN_B * ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean)));
    const posed = L.st.pose({
      a: {},
      b: {nib, lean: leanB, tilt: lerp(-3, 8, ease.inOutSine(x(W.lean)) * (1 - ease.inOutSine(x(W.unlean))))},
      board: {},
      boardState: {marks: {before: {p: 1, opacity: cGhost}, after: {p: cRing}}},
    });
    Object.assign(nodes, posed.nodes);
    Object.assign(nodes, L.bub.frame(1, 1, 0, 0, reduced));
    const sem = posed.semantic;
    const lensDatum = u < W.lStrike[0] ? 'before' : lRing >= 1 && lNew >= 1 ? 'after' : 'changing';
    const ctxDatum = cStrike === 0 && cNew === 0 && cRing === 0 ? 'before' : cNew >= 1 && cRing >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const inRing = u >= W.cRing[0] && u <= W.cRing[1];
    // the lens copy maps the source rectangle onto the destination exactly (same coordinates, uniform zoom)
    const zx = L.dest.w / L.source.w, zy = L.dest.h / L.source.h;
    return {
      nodes,
      semantic: {
        ...sem,
        tickTarget: inRing ? {x: r(nib.x), y: r(nib.y)} : null,
        beat,
        lensOpen: r(open, 3),
        lensCopyVisible: r(copyVisible(open, L.pClear), 3), pClear: r(L.pClear, 3),
        keyGap: L.keyGap, keyAnchored: L.keyAnchored,
        datum: lensDatum,
        contextDatum: ctxDatum,
        lensCopyMatches: Math.abs(zx - zy) < 1e-6 && L.zoom >= 1.45,
        zoom: r(L.zoom, 2), placement: L.placement,
        lens: {strike: r(lStrike, 3), old: r(lOld, 3), reveal: r(lNew, 3), ghost: r(lGhost, 3), ring: r(lRing, 3)},
        context: {strike: r(cStrike, 3), old: r(cOld, 3), reveal: r(cNew, 3), ghost: r(cGhost, 3), ring: r(cRing, 3)},
        oldTraceable: cOld >= 0.5 && lOld >= 0.5,
        markerShown: r(marker, 3),
        spans: {before: p.detailGeometry.beforeSpan, after: p.detailGeometry.afterSpan},
        values: {before: p.beforeValue, after: p.afterValue},
        labelsFit: L.ok, textSize: L.S, scale: r(L.k, 2),
        tailClear: L.tailClear,
        // world gap between the changed value and its label (null when the key is hidden)
        markNoteGap: L.markGap,
        markNoteShown: L.SL.mkLab ? r(x(W.markLabel), 3) : 0,
        mainActionEnd: W.penBack[1],
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
    slug: 'roles-01-inspect',
    title: 'Client interview — inspecting and substituting a noted detail',
    titleEs: 'Entrevista a cliente — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Entrevista a cliente',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the interview table after the exchange, with the account in the bubble and the interviewer’s notes board (question, a note line, a day strip with a pen loop). A lens copies the note line and strip at the same coordinates; the old value is struck but kept readable, the supplied alternative is written below and only the dependent strip mark changes (loop → ring). Back in context the pen redraws the ring and a neutral Δ marks the changed datum. Seeking back restores the old datum.',
    tags: ['client interview', 'inspect', 'lens', 'note', 'day strip', 'substitution', 'changed datum', 'pen', 'speech bubble'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/entrevista-a-cliente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/mediation-table.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/markers.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
