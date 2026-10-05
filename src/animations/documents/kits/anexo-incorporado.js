/**
 * Kit for the "Anexo incorporado" motif (LAW-0021..0024).
 *
 * Objects (original vector artwork, top-down):
 *  - the CONTRACT: a sheet with numbered clause rows and a ruled right margin.
 *    The clause the annex belongs to carries a hand-written cross-reference
 *    ("see Annex 1") written by the pen at the end of its heading;
 *  - the ANNEX: a smaller, tinted schedule sheet (header band with its id, a
 *    small table, a perforated binding strip) with an INDEX TAB on its left
 *    edge. The tab has an eyelet. When the annex is joined, the tab lies on
 *    the contract margin exactly at the height of the linked clause;
 *  - a POCKET FOLDER that holds the annex at rest (the annex slides out of the
 *    pocket), a PEN and a round SEAL (stamp) that can press a joint seal across
 *    the seam between the two sheets.
 *
 * Story choreography solved here (each entry owns its own timeline):
 *  B's hand reaches the annex in the folder, slides it out of the pocket,
 *  carries it toward the contract and releases it; the annex GLIDES the last
 *  stretch (free, decelerating) and settles either on the margin with its tab
 *  at the clause ("linked") or beside the contract with a gap ("separate").
 *  A's hand writes the cross-reference with the pen, draws the link loop from
 *  the reference to the tab eyelet (linked only), lays the pen down, takes the
 *  seal and presses it across the seam (linked) or on the annex alone
 *  (separate), then returns it.
 *
 * Attachment rules (asserted by the tests through semantics):
 *  - while B slides/carries the annex, B's solved hand IS the annex grip point;
 *  - the pen tip is derived from A's SOLVED hand while held; once laid down it
 *    rests at its rest spot; while writing/linking the tip is the ink path end;
 *  - the seal follows A's solved hand and marks only on contact;
 *  - every IK target is inside arm reach (`allReached`).
 * @module animations/documents/kits/anexo-incorporado
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, polyline, catmullRom, roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {pen as penTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, int, obj} from '../../../schemas/fields.js';

/* ---- colours ------------------------------------------------------------ */
export const ANNEX_PAPER = '#e7f0f4';
export const ANNEX_LINE = '#aebfcb';
export const INK_BLUE = '#1d3f8f';
export const FOLDER = '#d6b36f';

/* ---- motif strings (merged into ctx.t) ---------------------------------- */
export const ANNEX_STRINGS = {
  en: {linked: 'Linked to the clause', separate: 'Kept separate', annex: 'Annex', clause: 'Clause', reference: 'Reference', link: 'Link', annexId: 'Annex id', joined: 'Joined at the margin', apart: 'Laid apart'},
  es: {linked: 'Enlazado a la cláusula', separate: 'Separado', annex: 'Anexo', clause: 'Cláusula', reference: 'Remisión', link: 'Vínculo', annexId: 'Identificador del anexo', joined: 'Unido en el margen', apart: 'Colocado aparte'},
};

/* ---- motif field set (documents category + annex-specific fields) ------ */
export const annexFields = {
  linkedClause: int('Zero-based index of the clause the annex is connected to (clamped to the clause list)', 0, 4),
  annex: obj('The annex sheet', {
    label: str('Identifier printed on the annex header band and used by the cross-reference', 30),
    title: str('Annex title printed under the header band (wraps to two lines, then shrinks)', 80),
  }),
  reference: str('Cross-reference written at the end of the linked clause (e.g. "see Annex 1")', 40),
};

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis (design units). A enters from the TOP edge (pen + seal);
 * B enters from the right edge (horizontal, square) or the bottom (vertical)
 * and moves the annex.
 */
const GEO = {
  horizontal: {
    doc: [490, 530], dw: 480, dh: 640, annexK: 0.72,
    folder: [1348, 625], fw: 410, fh: 470, inFolder: [0, -35], restRot: -4,
    slide: [-10, -170], release: [215, -20], carryBow: -70,
    sepGap: 52, sepRot: 3, sepDy: 26, minTop: 225, maxBottom: 875,
    shoulderA: [570, -40], restA: [440, 40], penRest: [340, 196], penAngle: -125, stampRest: [520, 158],
    shoulderB: [1690, 570], restB: [1538, 760], gripB: [0.4, -0.12],
    arm: {upper: 355, lower: 335},
    chipA: {x: 606, y: 14, anchor: 'start', maxWidth: 470}, chipB: {x: 1576, y: 888, anchor: 'end', maxWidth: 620, bottom: true},
    tag: {x: 1576, y: 14, anchor: 'end', maxWidth: 490}, annot: {y: 84, minX: 590, maxX: 1580, maxWidth: 560, rows: 1, maxBottom: 205},
  },
  square: {
    doc: [370, 552], dw: 440, dh: 600, annexK: 0.66,
    folder: [960, 932], fw: 380, fh: 290, inFolder: [0, -58], restRot: -4,
    slide: [-10, -150], release: [170, 60], carryBow: -60,
    sepGap: 56, sepRot: 3.5, sepDy: 22, minTop: 262, maxBottom: 782,
    shoulderA: [470, -40], restA: [300, -86], penRest: [250, 206], penAngle: -125, stampRest: [410, 168],
    shoulderB: [1300, 760], restB: [1110, 640], gripB: [0.4, -0.1],
    arm: {upper: 355, lower: 335},
    chipA: {x: 196, y: 14, anchor: 'start', maxWidth: 476}, chipB: {x: 1176, y: 1092, anchor: 'end', maxWidth: 560, bottom: true},
    tag: {x: 1176, y: 14, anchor: 'end', maxWidth: 450}, annot: {y: 78, minX: 470, maxX: 1180, maxWidth: 520, rows: 2, maxBottom: 246},
  },
  vertical: {
    doc: [292, 572], dw: 430, dh: 610, annexK: 0.7,
    folder: [560, 1140], fw: 420, fh: 400, inFolder: [0, -70], restRot: -4,
    slide: [-10, -170], release: [40, 210], carryBow: 50,
    sepGap: 44, sepRot: 3, sepDy: 22, minTop: 275, maxBottom: 905,
    shoulderA: [330, -40], restA: [210, -86], penRest: [262, 258], penAngle: -150, stampRest: [352, 214],
    // B reaches up from the bottom-right corner and pinches the EXPOSED part of
    // the annex (above the pocket lip), so the arm stays clear of the pocket label
    shoulderB: [830, 1490], restB: [812, 1280], gripB: [0.3, -0.14],
    arm: {upper: 368, lower: 348},
    chipA: {x: 24, y: 14, anchor: 'start', maxWidth: 520}, chipB: {x: 640, y: 1390, anchor: 'end', maxWidth: 600, bottom: true},
    tag: {below: true, maxWidth: 560}, annot: {y: 14, minX: 414, maxX: 886, maxWidth: 460, rows: 3, maxBottom: 262},
  },
};

/* ======================================================================== */
/*  Contract sheet                                                           */
/* ======================================================================== */

/**
 * Contract sheet. Local origin = top-left. The cross-reference ink is NOT drawn
 * here (the stage draws it above the annex so the pen can write it); this
 * returns the geometry of the reference slot of each `refRows` clause.
 * @param {any} ctx
 * `textScale` (>1) enlarges the clause headings and the written reference
 * (paired views, where each desk is drawn small and those are the shared facts).
 * `sigFrac` (default 0.12) is the height fraction of the signature zone (a
 * smaller value draws compact signature lines); `rowKeep` (default 2.9, in
 * heading sizes) is the height the other rows keep when `rowMin` enlarges one.
 * @param {{prefix:string, w:number, h:number, docId:string, title:string, clauses:string[], redactions?:number[], refRows?:number[], refTexts?:string[], showText?:boolean, textScale?:number, rowMin?:{index:number, h:number}, sigFrac?:number, rowKeep?:number}} o
 */
export function contractSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix: P} = o;
  const showText = o.showText !== false;
  const pad = w * 0.085;
  const marginR = w * 0.17;
  const inner = w - pad - marginR;
  const fold = w * 0.1;
  const refRows = o.refRows || [];
  const parts = [];
  parts.push(h('path', {d: roundRectPath(7, 10, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  // ruled margin (where the annex tab lands)
  const ruleX = w - marginR + 10;
  parts.push(h('line', {x1: ruleX, x2: ruleX, y1: fold + 10, y2: hh - 16, stroke: '#d9a79a', 'stroke-width': 2, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round'}));

  let y = pad * 0.8;
  const idSize = Math.max(14, w * 0.04);
  if (o.docId && showText) {
    const f = ctx.fit(o.docId, {maxWidth: inner - 10, size: idSize, minSize: 11, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f, {x: pad, y, fill: th.inkSoft, name: `${P}-id`}));
  } else parts.push(h('rect', {x: pad, y: y + 2, width: inner * 0.3, height: idSize * 0.55, rx: 3, fill: th.paperLine}));
  y += idSize * 1.7;
  const titleSize = Math.max(18, w * 0.062);
  let titleRight = pad + inner * 0.72;
  if (o.title && showText) {
    const f = ctx.fit(o.title, {maxWidth: inner, size: titleSize, minSize: titleSize * 0.7, maxLines: 2, weight: 700, family: 'serif'});
    titleRight = pad + f.width;
    parts.push(textBlock(f, {x: pad, y, fill: th.ink, name: `${P}-title`}));
    y += f.height + titleSize * 0.45;
  } else {
    parts.push(h('rect', {x: pad, y, width: inner * 0.72, height: titleSize * 0.7, rx: 4, fill: th.ink, opacity: 0.8}));
    y += titleSize * 1.2;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += titleSize * 0.42;

  const sigFrac = o.sigFrac ?? 0.12;
  const sigZone = Math.max(sigFrac < 0.12 ? 28 : 0, hh * sigFrac);
  const rowKeep = o.rowKeep ?? 2.9;
  const clauses = (o.clauses && o.clauses.length ? o.clauses : ['', '', '']).slice(0, 5);
  const n = clauses.length;
  const area = hh - sigZone - y;
  const ts = o.textScale || 1;
  const headSize = clamp(w * 0.047 * ts, 14, 26 * ts);
  // row heights: equal by default; `rowMin` gives one row (the linked clause,
  // lifted out as a strip in the mechanism view) at least the requested height,
  // the other rows keep room for a two-line heading
  const heights = clauses.map(() => area / n);
  const rowMin = o.rowMin && o.rowMin.index < n && n > 1 ? o.rowMin : null;
  if (rowMin) {
    const keep = Math.min(area / n, headSize * rowKeep);
    const big = Math.min(Math.max(area / n, rowMin.h), area - (n - 1) * keep);
    heights.forEach((_, i) => { heights[i] = i === rowMin.index ? big : (area - big) / (n - 1); });
  }
  const tops = heights.map((_, i) => y + heights.slice(0, i).reduce((a, b) => a + b, 0));
  const refSize = headSize * (ts > 1 ? 1.1 : 1.18);
  // the written reference ends a little before the ruled margin so the link
  // loop drawn from its end to the tab eyelet has visible length
  const refGap = w * 0.07;
  const refFitsFor = (maxWidth, lines) => (o.refTexts || []).map(t => {
    const one = ctx.fit(t, {maxWidth, size: refSize, minSize: refSize * 0.8, maxLines: 1, weight: 600, family: 'serif'});
    if (!one.truncated || lines < 2) return one;
    const two = ctx.fit(t, {maxWidth, size: refSize, minSize: refSize * 0.7, maxLines: 2, weight: 600, family: 'serif'});
    return two.truncated && lines > 2 ? ctx.fit(t, {maxWidth, size: refSize, minSize: refSize * 0.62, maxLines: 3, weight: 600, family: 'serif'}) : two;
  });
  // side layout: reference slot on the heading's first line, at its right end
  const sideFits = refFitsFor(inner * 0.42, 2);
  const sideW = sideFits.length ? Math.max(...sideFits.map(f => f.width)) + 8 : inner * 0.3;
  // stacked layout: reference written on its own line under the heading
  const stackFits = refFitsFor(inner - refGap - 8, 2);
  const stackW = stackFits.length ? Math.max(...stackFits.map(f => f.width)) + 8 : inner * 0.4;
  const barH = Math.max(5, w * 0.017);
  const rows = [];
  const hl = [];
  const text = [];
  const refLayout = {};
  let overflow = false;
  clauses.forEach((c, i) => {
    const top = tops[i];
    const each = heights[i];
    const isRef = refRows.includes(i);
    hl.push(h('rect', {name: `${P}-hl-${i}`, x: pad - 10, y: top - 7, width: w - pad + 6, height: headSize * 1.55, rx: 7, fill: th.highlight, opacity: 0}));
    let used = headSize * 1.3;
    let headMax = inner;
    let f = null;
    const head = `${i + 1}. ${c}`;
    if (isRef) {
      // keep the key clause heading whole: beside the reference when it fits in
      // two lines without shrinking much, otherwise the reference drops below it
      const sideMax = inner - refGap - sideW - 14;
      const side = c && showText ? ctx.fit(head, {maxWidth: sideMax, size: headSize, minSize: headSize * 0.84, maxLines: 2, weight: 600}) : null;
      const sideOk = !side || (!side.truncated && sideFits.every(q => !q.truncated && q.lines.length <= 2));
      if (sideOk) {
        headMax = sideMax;
        f = side;
        refLayout[i] = {mode: 'side', fits: sideFits, w: sideW, x: pad + inner - refGap - sideW, y: top - refSize * 0.12};
        const refH = sideFits.length ? sideFits[0].lineHeight * (Math.max(...sideFits.map(q => q.lines.length)) - 1) + sideFits[0].size * 1.25 : refSize;
        used = Math.max(f ? f.height : headSize, refH) + headSize * 0.5;
      } else {
        f = c && showText ? ctx.fit(head, {maxWidth: inner, size: headSize, minSize: Math.max(11, headSize * 0.8), maxLines: 3, weight: 600}) : null;
        const hH = f ? f.height : headSize * 1.2;
        const gap = headSize * 0.5;
        const ry = top + hH + gap;
        refLayout[i] = {mode: 'stack', fits: stackFits, w: stackW, x: pad, y: ry - refSize * 0.12};
        const nl = stackFits.length ? Math.max(...stackFits.map(q => q.lines.length)) : 1;
        used = hH + gap + (stackFits.length ? stackFits[0].lineHeight * (nl - 1) + stackFits[0].size * 1.3 : refSize) + headSize * 0.3;
      }
      if (f) {
        text.push(textBlock(f, {x: pad, y: top, fill: th.ink, name: `${P}-clause-${i}`}));
        if (refLayout[i].mode === 'side') used = Math.max(used, f.height + headSize * 0.5);
      }
    } else if (c && showText) {
      f = ctx.fit(head, {maxWidth: headMax, size: headSize, minSize: Math.max(11, headSize * 0.72), maxLines: each > headSize * (rowMin ? Math.min(2.75, rowKeep - 0.1) : 3.1) ? 2 : 1, weight: 600});
      text.push(textBlock(f, {x: pad, y: top, fill: th.ink, name: `${P}-clause-${i}`}));
      used = f.height + headSize * 0.5;
    }
    if (!f) {
      const bw = isRef && refLayout[i].mode === 'side' ? inner - refGap - sideW - 14 : headMax;
      text.push(h('rect', {x: pad, y: top + 2, width: r(bw * (0.5 + ctx.rng(`${P}-hb`, i) * 0.3)), height: headSize * 0.6, rx: 3, fill: th.ink, opacity: 0.55}));
    }
    if (isRef && used > each - 2) overflow = true;
    // body lines (none when the heading and reference already fill the row)
    const bars = Math.max(0, Math.min(3, Math.floor((each - used - barH) / (barH * 2.3))));
    for (let b = 0; b < bars; b++) {
      const lw = inner * (b === bars - 1 ? 0.45 + ctx.rng(`${P}-l`, i * 7 + b) * 0.3 : 0.84 + ctx.rng(`${P}-l`, i * 7 + b) * 0.16);
      text.push(h('rect', {x: pad, y: top + used + b * barH * 2.3, width: r(lw), height: barH, rx: barH / 2, fill: th.paperLine}));
    }
    rows.push({i, top, mid: top + headSize * 0.55, h: each, headSize});
  });
  const redactions = (o.redactions || []).filter(i => i < n).map(i => {
    const row = rows[i];
    return h('rect', {x: pad - 4, y: row.top + headSize * 1.2, width: inner + 8, height: Math.min(row.h - headSize * 1.6, 44), rx: 4, fill: th.ink});
  });
  // signature zone (decorative; compact when the zone is small)
  const compactSig = sigFrac < 0.12;
  const sy = compactSig ? hh - Math.max(8, sigZone * 0.28) : hh - pad * 0.95;
  const crossY = compactSig ? sy - Math.min(24, sigZone * 0.62) : sy - 24;
  const sw = inner * 0.44;
  const sig = [0, 1].map(k => g(null,
    h('line', {x1: pad + k * (sw + inner * 0.1), x2: pad + k * (sw + inner * 0.1) + sw, y1: r(sy), y2: r(sy), stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(pad + k * (sw + inner * 0.1))} ${r(crossY)}l9 9m0 -9l-9 9`, stroke: th.inkSoft, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round'})));

  const ref = {};
  for (const k of refRows) {
    if (k >= n) continue;
    const Lr = refLayout[k];
    const fits = Lr.fits;
    const nl = fits.length ? Math.max(...fits.map(f => f.lines.length)) : 1;
    const f0 = fits[0];
    ref[k] = {x: Lr.x, y: Lr.y, w: Lr.w, mode: Lr.mode, fits, h: (f0 ? f0.lineHeight * (nl - 1) + f0.size : refSize) * 1.15, size: f0 ? f0.size : refSize, lineHeight: f0 ? f0.lineHeight : refSize * 1.18, lines: nl};
  }
  // enlarged text that no longer fits its row steps back toward normal size
  if (overflow && ts > 1) return contractSheet(ctx, {...o, textScale: Math.max(1, ts - 0.15)});
  const node = g({name: P}, parts, hl, text, redactions, sig);
  return {node, w, h: hh, pad, inner, marginR, ruleX, rows, ref, headSize, n, titleRight};
}

/* ======================================================================== */
/*  Annex sheet                                                              */
/* ======================================================================== */

/**
 * Annex sheet. Local origin = CENTRE (so it can be posed). The index tab
 * protrudes from the left edge; `tabY` is measured from the sheet's TOP.
 * Named nodes: `${prefix}` (pose), `${prefix}-shadow` (lift),
 * `${prefix}-label-v0/v1` (header label variants, when labels are shown).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, tabY:number, labels:string[], title:string, showText?:boolean}} o
 */
export function annexSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix: P} = o;
  const showText = o.showText !== false;
  const x0 = -w / 2, y0 = -hh / 2;
  const band = hh * 0.13;
  const tabW = w * 0.14, tabH = Math.max(56, hh * 0.13);
  const ty = y0 + o.tabY;
  const eyeR = tabH * 0.2;
  const eyelet = {x: x0 - tabW * 0.46, y: ty};
  const tabColor = th.accent2;
  const parts = [];
  // index tab (behind the sheet, protruding left)
  parts.push(h('path', {d: `M${r(x0 + 12)} ${r(ty - tabH / 2)}H${r(x0 - tabW + 12)}Q${r(x0 - tabW)} ${r(ty - tabH / 2)} ${r(x0 - tabW)} ${r(ty - tabH / 2 + 12)}V${r(ty + tabH / 2 - 12)}Q${r(x0 - tabW)} ${r(ty + tabH / 2)} ${r(x0 - tabW + 12)} ${r(ty + tabH / 2)}H${r(x0 + 12)}Z`, fill: tabColor, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('circle', {cx: r(eyelet.x), cy: r(eyelet.y), r: r(eyeR + 4), fill: '#c9ced4', stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('circle', {cx: r(eyelet.x), cy: r(eyelet.y), r: r(eyeR - 1), fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
  // sheet
  parts.push(h('path', {d: roundRectPath(x0, y0, w, hh, 6), fill: ANNEX_PAPER, stroke: th.ink, 'stroke-width': th.stroke}));
  // header band
  parts.push(h('path', {d: `M${r(x0 + 6)} ${r(y0)}H${r(x0 + w - 6)}Q${r(x0 + w)} ${r(y0)} ${r(x0 + w)} ${r(y0 + 6)}V${r(y0 + band)}H${r(x0)}V${r(y0 + 6)}Q${r(x0)} ${r(y0)} ${r(x0 + 6)} ${r(y0)}Z`, fill: tabColor, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  const labelNodes = [];
  if (showText) {
    (o.labels || []).forEach((lab, i) => {
      const f = ctx.fit(lab, {maxWidth: w * 0.8, size: band * 0.52, minSize: band * 0.26, maxLines: 1, weight: 800});
      labelNodes.push(textBlock(f, {x: x0 + w * 0.12, y: y0 + (band - f.size) / 2, fill: '#ffffff', letterSpacing: 1, name: `${P}-label-v${i}`, opacity: i ? 0 : undefined}));
    });
  } else parts.push(h('rect', {x: x0 + w * 0.12, y: y0 + band * 0.36, width: w * 0.36, height: band * 0.3, rx: 3, fill: '#ffffff', opacity: 0.9}));
  // title
  let yy = y0 + band + hh * 0.04;
  const tSize = Math.max(15, w * 0.058);
  if (o.title && showText) {
    const f = ctx.fit(o.title, {maxWidth: w * 0.78, size: tSize, minSize: tSize * 0.72, maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: x0 + w * 0.12, y: yy, fill: th.ink, name: `${P}-title`}));
    yy += f.height + tSize * 0.5;
  } else {
    parts.push(h('rect', {x: x0 + w * 0.12, y: yy, width: w * 0.55, height: tSize * 0.62, rx: 3, fill: th.ink, opacity: 0.7}));
    yy += tSize * 1.2;
  }
  // schedule table
  const tx = x0 + w * 0.12, tw = w * 0.8;
  const rowsN = 5;
  const th0 = yy, rowH = Math.min((y0 + hh - hh * 0.06 - th0) / rowsN, hh * 0.1);
  const cols = [0, 0.34, 0.68, 1];
  parts.push(h('rect', {x: tx, y: th0, width: tw, height: rowH, fill: shade(ANNEX_PAPER, -0.07)}));
  for (let i = 0; i <= rowsN; i++) parts.push(h('line', {x1: tx, x2: tx + tw, y1: r(th0 + i * rowH), y2: r(th0 + i * rowH), stroke: ANNEX_LINE, 'stroke-width': i === 0 || i === rowsN ? 2.2 : 1.6}));
  for (const c of cols) parts.push(h('line', {x1: r(tx + tw * c), x2: r(tx + tw * c), y1: th0, y2: r(th0 + rowsN * rowH), stroke: ANNEX_LINE, 'stroke-width': 1.6}));
  for (let i = 0; i < rowsN; i++) {
    for (let c = 0; c < 3; c++) {
      const cw = tw * (cols[c + 1] - cols[c]);
      const bw = cw * (0.35 + ctx.rng(`${P}-cell`, i * 3 + c) * 0.45);
      parts.push(h('rect', {x: r(tx + tw * cols[c] + 8), y: r(th0 + i * rowH + rowH * 0.38), width: r(bw), height: r(Math.max(4, rowH * 0.24)), rx: 2, fill: i === 0 ? th.inkSoft : ANNEX_LINE}));
    }
  }
  // perforated binding strip
  const perf = [];
  for (let py = y0 + band + 14; py < y0 + hh - 12; py += 26) perf.push(h('circle', {cx: r(x0 + w * 0.05), cy: r(py), r: 3.2, fill: shade(ANNEX_PAPER, -0.18)}));
  const shadowNode = h('path', {name: `${P}-shadow`, d: roundRectPath(x0 - tabW, y0, w + tabW, hh, 8), fill: th.shadow});
  const node = g({name: P}, shadowNode, parts, perf, labelNodes);
  return {node, w, h: hh, tabW, tabH, eyelet, eyeR, tabY: o.tabY, band, titleBottom: th0 - y0};
}

/* ======================================================================== */
/*  Folder, seal, handwriting                                                */
/* ======================================================================== */

/**
 * Open folder with a front pocket, seen from above. Local origin = top-left.
 * Returns the back (drawn under the annex) and the pocket (drawn over it).
 */
export function pocketFolder(ctx, {prefix, w, h: hh, label, showText, bigPlate = false, plateBand = null}) {
  const th = ctx.theme;
  const c = FOLDER;
  const tabW = w * 0.36;
  const pocketTop = hh * 0.5;
  const back = g({name: `${prefix}-back`},
    h('path', {d: roundRectPath(8, 12, w, hh, 10), fill: th.shadow}),
    h('path', {d: `M0 ${r(hh * 0.06)}Q0 0 10 0H${r(tabW)}L${r(tabW + 22)} 22H${w - 10}Q${w} 22 ${w} 32V${hh - 10}Q${w} ${hh} ${w - 10} ${hh}H10Q0 ${hh} 0 ${hh - 10}Z`, fill: c, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: 14, y: 36, width: w - 28, height: hh - 50, rx: 8, fill: '#000', opacity: 0.07}),
  );
  let labelNode = null;
  // bigPlate: a wide plate filling most of the pocket front (diagram views,
  // where the folder label is the element's name and must stay readable).
  // `plateBand` (folder-local y range) keeps the plate in the part of the
  // pocket front that no name chip covers; the plate then widens instead.
  let plate = bigPlate
    ? {x: w * 0.07, y: pocketTop + (hh - pocketTop) * 0.2, w: w * 0.86, h: (hh - pocketTop) * 0.64}
    : {x: w * 0.2, y: pocketTop + (hh - pocketTop) * 0.2, w: w * 0.6, h: Math.max(40, (hh - pocketTop) * 0.3)};
  let banded = false;
  if (plateBand && label && showText && plate.y + plate.h > plateBand.y1) {
    const y0 = Math.max(pocketTop + 16, plateBand.y0 ?? 0);
    plate = {x: w * 0.05, y: y0, w: w * 0.9, h: Math.max(34, plateBand.y1 - y0)};
    banded = plate.h < 60;
  }
  if (label && showText) {
    // one line when it fits at a readable size, otherwise two balanced lines
    let f = ctx.fit(label, {maxWidth: plate.w - 20, size: Math.min(30, plate.h * 0.5), minSize: 21, maxLines: 1, weight: 700});
    if (f.truncated && !banded) f = ctx.fit(label, {maxWidth: plate.w - 20, size: Math.min(bigPlate ? 28 : 26, plate.h * (bigPlate ? 0.42 : 0.38)), minSize: bigPlate ? 20 : 15, maxLines: 2, weight: 700});
    // a short (banded) plate keeps one line, as large as its width allows
    if (f.truncated && banded) f = ctx.fit(label, {maxWidth: plate.w - 16, size: Math.min(26, plate.h * 0.62), minSize: 12, maxLines: 1, weight: 700});
    labelNode = textBlock(f, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - f.height) / 2, anchor: 'middle', fill: th.ink, name: `${prefix}-label`});
  } else {
    // no label to print (labels hidden or none supplied): the plate carries
    // two ruled placeholder lines instead of reading as a blank sticker
    const lw = plate.w * 0.62;
    labelNode = g(null,
      h('rect', {x: r(plate.x + (plate.w - lw) / 2), y: r(plate.y + plate.h * 0.3), width: r(lw), height: r(Math.max(4, plate.h * 0.14)), rx: 2, fill: th.inkSoft, opacity: 0.55}),
      h('rect', {x: r(plate.x + (plate.w - lw * 0.6) / 2), y: r(plate.y + plate.h * 0.58), width: r(lw * 0.6), height: r(Math.max(4, plate.h * 0.12)), rx: 2, fill: th.paperLine}));
  }
  const pocket = g({name: `${prefix}-pocket`},
    h('path', {d: `M0 ${r(pocketTop + 14)}Q${r(w * 0.5)} ${r(pocketTop - 12)} ${w} ${r(pocketTop + 14)}V${hh - 10}Q${w} ${hh} ${w - 10} ${hh}H10Q0 ${hh} 0 ${hh - 10}Z`, fill: shade(c, -0.07), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M16 ${r(pocketTop + 22)}Q${r(w * 0.5)} ${r(pocketTop - 2)} ${w - 16} ${r(pocketTop + 22)}`, fill: 'none', stroke: shade(c, -0.25), 'stroke-width': 2}),
    h('rect', {x: plate.x, y: plate.y, width: plate.w, height: plate.h, rx: 6, fill: '#fbf7ee', stroke: th.ink, 'stroke-width': 1.6}),
    labelNode,
  );
  return {back, pocket, w, h: hh, pocketTop};
}

/** Round seal tool seen from above. Local origin = centre of the base. */
export function sealTool(ctx, {name, radius = 46, color}) {
  const th = ctx.theme;
  const R = radius;
  const c = color || th.accent;
  return g({name},
    h('ellipse', {name: `${name}-shadow`, cx: 9, cy: 12, rx: R * 1.02, ry: R * 0.96, fill: th.shadow}),
    h('circle', {r: R, fill: c, stroke: th.ink, 'stroke-width': th.stroke}),
    h('circle', {r: R * 0.8, fill: 'none', stroke: shade(c, -0.25), 'stroke-width': 2}),
    h('circle', {cx: 0, cy: -2, r: R * 0.46, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('circle', {cx: -R * 0.14, cy: -R * 0.16, r: R * 0.15, fill: '#fff', opacity: 0.35}),
  );
}

/** Round seal impression (ink). Local origin = centre. */
export function sealImpression(ctx, {name, text, radius = 44, color, showText = true}) {
  const c = color || ctx.theme.accent;
  const R = radius;
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ticks.push(`M${r(Math.cos(a) * R * 0.78)} ${r(Math.sin(a) * R * 0.78)}L${r(Math.cos(a) * R * 0.9)} ${r(Math.sin(a) * R * 0.9)}`);
  }
  let inner;
  if (showText && text) {
    const f = ctx.fit(text, {maxWidth: R * 1.3, size: R * 0.34, minSize: 9, maxLines: 1, weight: 800});
    inner = textBlock(f, {x: 0, y: -f.size / 2, anchor: 'middle', fill: c});
  } else {
    inner = h('path', {d: `M0 ${r(-R * 0.34)}L${r(R * 0.1)} ${r(-R * 0.1)}L${r(R * 0.34)} ${r(-R * 0.08)}L${r(R * 0.15)} ${r(R * 0.08)}L${r(R * 0.21)} ${r(R * 0.32)}L0 ${r(R * 0.19)}L${r(-R * 0.21)} ${r(R * 0.32)}L${r(-R * 0.15)} ${r(R * 0.08)}L${r(-R * 0.34)} ${r(-R * 0.08)}L${r(-R * 0.1)} ${r(-R * 0.1)}Z`, fill: c});
  }
  return g({name, opacity: 0, transform: 'rotate(-12)'},
    h('circle', {r: R, fill: 'none', stroke: c, 'stroke-width': 4}),
    h('circle', {r: R * 0.66, fill: 'none', stroke: c, 'stroke-width': 1.8}),
    h('path', {d: ticks.join(''), stroke: c, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    inner,
  );
}

/** Handwriting-like wave along a baseline (x monotonic). */
export function writingPath(x0, x1, baseline, size) {
  const n = Math.max(4, Math.round((x1 - x0) / (size * 0.62)));
  const pts = [{x: x0, y: baseline - size * 0.15}];
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push({x: x - (x1 - x0) / n * 0.5, y: baseline - size * (i % 3 === 0 ? 0.62 : 0.4)});
    pts.push({x, y: baseline - size * 0.04});
  }
  const sm = catmullRom(pts, 6);
  // enforce monotonic x so the reveal edge never goes back
  let mx = -Infinity;
  for (const p of sm) { mx = Math.max(mx, p.x); p.x = mx; }
  return polyline(sm);
}

/**
 * Link: a hand-drawn swoop from the reference end that dips under the
 * reference line, rises into the bottom of the eyelet and ties a loop around
 * it (bottom → right → top → left → bottom), so it never reads as an underline.
 */
export function linkPath(from, eye, eyeR) {
  const R = eyeR + 10;
  const entry = {x: eye.x, y: eye.y + R * 0.92};
  const dx = Math.max(10, entry.x - from.x);
  // a reference written under the heading already sits below the eyelet: a
  // shallow dip is enough (and stays clear of the signature zone)
  const dip = from.y > entry.y + 4 ? 12 : clamp(dx * 0.32, 18, 38);
  const low = Math.max(from.y, entry.y) + dip;
  const pts = [
    from,
    {x: from.x + dx * 0.22, y: from.y + (low - from.y) * 0.7},
    {x: from.x + dx * 0.55, y: low},
    {x: entry.x - R * 0.85, y: entry.y + dip * 0.35},
    entry,
  ];
  const sm = catmullRom(pts, 10);
  const loop = [];
  for (let i = 1; i <= 44; i++) {
    const a = Math.PI / 2 - (i / 44) * Math.PI * 2.1;
    loop.push({x: eye.x + Math.cos(a) * R, y: eye.y + Math.sin(a) * R * 0.92});
  }
  return polyline([...sm, ...loop]);
}

/**
 * Enlarged clause strip (the linked clause lifted out of the contract, for
 * the mechanism view). Local origin = CENTRE. The clause number + heading run
 * across the full width (up to three lines); the reference row underneath
 * holds the reference slot (dashed until written) and, at its right end, the
 * PORT eyelet; a short inner ink line joins the slot to the port (lit once
 * joined).
 * The strip is `h` tall, or taller up to `maxH` when that lets the heading and
 * the reference use a larger type size (`maxH` is the height the strip may
 * have when it returns into its row of the contract): the text size is chosen
 * as the largest that keeps the heading on <= 3 lines and the reference on <= 2
 * lines inside that height, so the rejoined clause stays readable.
 * Named nodes: `${prefix}` (pose), `${prefix}-ref-clip` (reveal rect),
 * `${prefix}-slot` (dashed placeholder), `${prefix}-port-on` (lit port),
 * `${prefix}-inner` (slot → port ink, dash-drawn).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, maxH?:number, number:number, heading:string, reference:string, showText?:boolean}} o
 */
export function clauseStrip(ctx, o) {
  const th = ctx.theme;
  const {w, prefix: P} = o;
  const minH = o.h;
  const maxH = Math.max(minH, o.maxH || minH);
  const showText = o.showText !== false;
  const x0 = -w / 2;
  const pad = w * 0.055;
  const portR = Math.min(26, minH * 0.13);
  const portX = x0 + w - pad * 0.5 - portR - 4;
  const headX = x0 + pad;
  const headW = w - pad * 2;
  const slotW = portX - portR - 34 - headX;
  const topPad = 12, gap = 9, botPad = 10, slotPad = 10;
  const head = `${o.number}. ${o.heading}`;
  /** Layout at heading size F and reference size Fr (null when a text does not fit its line limit). */
  const layoutAt = (F, Fr = F, force = false) => {
    let fH = null, fR = null;
    if (showText && o.heading) {
      fH = ctx.fit(head, {maxWidth: headW, size: F, minSize: F, maxLines: 2, weight: 600});
      if (fH.truncated) fH = ctx.fit(head, {maxWidth: headW, size: F, minSize: force ? F * 0.8 : F, maxLines: 3, weight: 600});
      if (fH.truncated && !force) return null;
    }
    if (showText) {
      fR = ctx.fit(o.reference, {maxWidth: slotW - 16, size: Fr * 1.04, minSize: Fr * 1.04, maxLines: 1, weight: 600, family: 'serif'});
      if (fR.truncated) fR = ctx.fit(o.reference, {maxWidth: slotW - 16, size: Fr, minSize: force ? Fr * 0.8 : Fr, maxLines: 2, weight: 600, family: 'serif'});
      if (fR.truncated && !force) return null;
    }
    const headH = fH ? fH.height : F;
    const slotH = Math.max(F * 1.25, (fR ? fR.height : F) + slotPad);
    return {F, fH, fR, headH, slotH, need: topPad + headH + gap + slotH + botPad};
  };
  let Lz = null;
  for (let F = 34; F >= 16 && !Lz; F -= 1) {
    const t = layoutAt(F);
    if (t && t.need <= maxH) Lz = t;
  }
  if (!Lz) Lz = layoutAt(16, 16, true);
  // the reference (the part that changes) takes any height left, up to 15% larger
  for (let Fr = Math.floor(Lz.F * 1.15); Fr > Lz.F; Fr -= 1) {
    const t = layoutAt(Lz.F, Fr);
    if (t && t.need <= maxH) { Lz = t; break; }
  }
  const hh = Math.min(maxH, Math.max(minH, Lz.need));
  const y0 = -hh / 2;
  // the text block is centred in the strip's height
  const top = y0 + topPad + Math.max(0, (hh - Lz.need) / 2);
  const size = Lz.F;
  const headH = Lz.headH;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 8), fill: th.shadow}));
  // torn/cut paper strip
  const tear = [];
  for (let i = 0; i <= 10; i++) tear.push(`${r(x0 + (i % 2 ? 7 : 0))} ${r(y0 + (hh * i) / 10)}`);
  parts.push(h('path', {d: `M${r(x0)} ${r(y0)}H${r(x0 + w - 8)}Q${r(x0 + w)} ${r(y0)} ${r(x0 + w)} ${r(y0 + 8)}V${r(y0 + hh - 8)}Q${r(x0 + w)} ${r(y0 + hh)} ${r(x0 + w - 8)} ${r(y0 + hh)}H${r(x0)}L${tear.reverse().join('L')}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  // heading (full width: the port sits on the reference row below)
  if (Lz.fH) {
    parts.push(h('rect', {name: `${P}-hl`, x: headX - 10, y: top - 6, width: Math.min(headW, Lz.fH.width) + 20, height: headH + 12, rx: 8, fill: th.highlight, opacity: 0.85}));
    parts.push(textBlock(Lz.fH, {x: headX, y: top, fill: th.ink}));
  } else {
    parts.push(h('rect', {name: `${P}-hl`, x: headX - 10, y: top - 6, width: headW * 0.7 + 20, height: headH + 12, rx: 8, fill: th.highlight, opacity: 0.85}));
    parts.push(h('rect', {x: headX, y: top + size * 0.15, width: headW * 0.65, height: size * 0.62, rx: 3, fill: th.ink, opacity: 0.6}));
  }
  // reference row: the slot on the left, the port at the right end
  const slot = {x: headX, y: top + headH + gap, w: slotW, h: Lz.slotH};
  const port = {x: portX, y: slot.y + slot.h / 2};
  parts.push(h('path', {name: `${P}-slot`, d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 8), fill: 'none', stroke: INK_BLUE, 'stroke-width': 2.4, 'stroke-dasharray': '7 6'}));
  const clipId = `${P}-refclip`;
  let written;
  if (Lz.fR) {
    written = textBlock(Lz.fR, {x: slot.x + 8, y: slot.y + (slot.h - Lz.fR.height) / 2 - 2, fill: INK_BLUE, italic: true});
  } else {
    const wv = writingPath(slot.x + 10, slot.x + slot.w * 0.8, slot.y + slot.h * 0.7, slot.h * 0.8);
    written = h('path', {d: wv.d(1), fill: 'none', stroke: INK_BLUE, 'stroke-width': 3, 'stroke-linecap': 'round'});
  }
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${P}-ref-clip`, x: r(slot.x), y: r(slot.y - 6), width: 0, height: r(slot.h + 12)}))));
  parts.push(g({'clip-path': ctx.ref(clipId)}, written, h('path', {d: `M${r(slot.x + 6)} ${r(slot.y + slot.h + 2)}H${r(slot.x + slot.w - 6)}`, stroke: INK_BLUE, 'stroke-width': 3, 'stroke-linecap': 'round'})));
  // inner ink from the slot end to the port (drawn when joined)
  const a = {x: slot.x + slot.w + 4, y: port.y};
  const b = {x: port.x - portR - 3, y: port.y};
  const innerLen = Math.max(4, b.x - a.x) + 4;
  parts.push(h('path', {name: `${P}-inner`, d: `M${r(a.x)} ${r(a.y)}H${r(b.x)}`, fill: 'none', stroke: INK_BLUE, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(innerLen)} ${r(innerLen + 10)}`, 'stroke-dashoffset': r(innerLen)}));
  // port eyelet at the right end of the reference row
  parts.push(h('circle', {cx: r(port.x), cy: r(port.y), r: r(portR + 5), fill: '#c9ced4', stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('circle', {cx: r(port.x), cy: r(port.y), r: r(portR), fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}));
  parts.push(h('circle', {name: `${P}-port-on`, cx: r(port.x), cy: r(port.y), r: r(portR - 3), fill: INK_BLUE, opacity: 0}));
  const node = g({name: P}, g({name: `${P}-body`}, parts));
  return {node, w, h: hh, port, portR, slot, innerLen, size};
}

/**
 * Place editorial callouts in a free band: each chip sits above its target
 * (so its leader drops onto it), chips never overlap and never straddle an
 * earlier leader; a second row is used when the band allows it, otherwise
 * the chips share the row width.
 * @param {any} ctx
 * @param {Array<{name:string, text:string, target:{x:number,y:number}}>} items
 * @param {{y:number, minX:number, maxX:number, maxWidth:number, rows?:number, maxBottom?:number}} A
 */
export function placeCallouts(ctx, items, A, calloutFn) {
  const size = 30;
  const out = [];
  const leaders = [];
  const rows = A.rows || 1;
  const share = rows === 1 && items.length > 1 ? (A.maxX - A.minX - 18 * (items.length - 1)) / items.length : A.maxWidth;
  const maxW0 = Math.min(A.maxWidth, share);
  const y0 = A.avoid && A.avoid.x < A.maxX && A.avoid.x + A.avoid.w > A.minX ? Math.max(A.y, A.avoid.y + A.avoid.h + 10) : A.y;
  let row = {y: y0, minX: A.minX, bottom: y0, index: 0};
  const opts = mw => ({maxWidth: mw - size * 1.2, size, minSize: size * 0.75, maxLines: 3, weight: 600});
  for (const it of items) {
    // balanced wrap: the narrowest box that keeps the same line count and size
    // (no orphan word on the last line)
    let maxW = maxW0;
    const f0 = ctx.fit(it.text, opts(maxW0));
    if (f0.lines.length > 1 && !f0.truncated) {
      let lo = size * 3, hi = maxW0;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        const t = ctx.fit(it.text, opts(mid));
        if (t.truncated || t.lines.length > f0.lines.length || t.size < f0.size - 0.01) lo = mid; else hi = mid;
      }
      maxW = Math.ceil(hi) + 2;
    }
    const f = ctx.fit(it.text, opts(maxW));
    const w = f.width + size * 1.2;
    const hgt = f.height + size * 0.76;
    if (row.minX + w > A.maxX + 0.5 && row.index + 1 < rows) row = {y: row.bottom + 10, minX: A.minX, bottom: row.bottom + 10, index: row.index + 1};
    let cx = clamp(it.target.x, row.minX + w / 2, A.maxX - w / 2);
    for (const lx of leaders) {
      if (lx > cx - w / 2 - 12 && lx < cx + w / 2 + 12 && row.index > 0) cx = clamp(lx + 14 + w / 2, row.minX + w / 2, A.maxX - w / 2);
    }
    const c = calloutFn({name: it.name, text: it.text, chipAt: {x: cx, y: row.y}, target: it.target, maxWidth: maxW, size, maxLines: 3});
    out.push(c);
    leaders.push(clamp(it.target.x, c.box.x, c.box.x + c.box.w));
    row.minX = c.box.x + c.box.w + 18;
    row.bottom = Math.max(row.bottom, row.y + hgt);
  }
  return out;
}

/* ======================================================================== */
/*  Stage                                                                    */
/* ======================================================================== */

/**
 * The annex desk stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{docId:string,title:string,clauses:string[],redactions:number[]}} o.doc
 * @param {{labels:string[], title:string}} o.annex  labels[0] is shown; labels[1] (optional) is a substitute
 * @param {string[]} o.refTexts   reference text variants (first shown)
 * @param {number} o.clause       linked clause index
 * @param {number} [o.altClause]  alternative clause (inspect re-targeting)
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.actors  [A (pen, seal), B (annex)]
 * @param {string} o.folderLabel
 * @param {string} o.sealLabel
 * @param {boolean} [o.chips=true]
 * @param {string} [o.seedKey]
 * @param {number} [o.textScale]  enlarge clause headings + reference (paired views)
 * @param {number} [o.rowMinFrac] minimum height of the linked clause row, as a fraction of the sheet height
 */
export function annexDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const showText = ctx.show('all');
  const dw = G.dw, dh = G.dh;
  const docTL = {x: G.doc[0] - dw / 2, y: G.doc[1] - dh / 2};
  const nClauses = Math.max(1, Math.min(5, o.doc.clauses.length));
  const k1 = Math.min(o.clause, nClauses - 1);
  const k2 = o.altClause === undefined || o.altClause === null ? null : Math.min(o.altClause, nClauses - 1);
  const refRows = k2 === null || k2 === k1 ? [k1] : [k1, k2];

  // --- contract
  // `rowMinFrac`: the linked clause row gets at least this fraction of the sheet
  // height (room for an enlarged heading + reference in paired views)
  const rowMin = o.rowMinFrac && refRows.length === 1 ? {index: k1, h: dh * o.rowMinFrac} : undefined;
  const contract = contractSheet(ctx, {prefix: `${P}-doc`, w: dw, h: dh, docId: o.doc.docId, title: o.doc.title, clauses: o.doc.clauses, redactions: o.doc.redactions, refRows, refTexts: o.refTexts, showText, textScale: o.textScale, rowMin});
  const cw = (q) => ({x: docTL.x + q.x, y: docTL.y + q.y});
  const rowMid = k => docTL.y + contract.rows[k].mid;

  // --- annex geometry
  const aw = Math.round(dw * G.annexK), ah = Math.round(dh * G.annexK);
  const overlap = 12;
  const pref = ah * 0.3;
  const tabHalf = Math.max(56, ah * 0.13) / 2;
  let lo = tabHalf + 16, hi = ah - tabHalf - 16;
  for (const k of refRows) {
    lo = Math.max(lo, rowMid(k) - (G.maxBottom - ah));
    hi = Math.min(hi, rowMid(k) - G.minTop);
  }
  const tabY = hi < lo ? hi : clamp(pref, lo, hi);
  const annex = annexSheet(ctx, {prefix: `${P}-annex`, w: aw, h: ah, tabY, labels: o.annex.labels, title: o.annex.title, showText});
  const seamX = docTL.x + dw - overlap / 2;
  const dockPose = k => ({x: docTL.x + dw - overlap + aw / 2, y: rowMid(k) - tabY + ah / 2, rot: 0});
  const dock1 = dockPose(k1);
  const dock2 = k2 === null ? dock1 : dockPose(k2);
  /** Vertical extent (world) of the annex sheet + tab for a pose. */
  const yExtent = pose => {
    const a = rad(pose.rot || 0);
    const pts = [[-aw / 2, -ah / 2], [aw / 2, -ah / 2], [aw / 2, ah / 2], [-aw / 2, ah / 2], [-aw / 2 - annex.tabW, -ah / 2 + tabY - tabHalf], [-aw / 2 - annex.tabW, -ah / 2 + tabY + tabHalf]];
    const ys = pts.map(([x, y]) => pose.y + x * Math.sin(a) + y * Math.cos(a));
    return {top: Math.min(...ys), bottom: Math.max(...ys)};
  };
  // separate: beside the contract with a gap, kept fully inside the desk window
  const sepPose = {x: docTL.x + dw + G.sepGap + aw / 2, y: dock1.y + G.sepDy, rot: G.sepRot};
  {
    const e = yExtent(sepPose);
    if (e.bottom > G.maxBottom) sepPose.y -= e.bottom - G.maxBottom;
    const e2 = yExtent(sepPose);
    if (e2.top < G.minTop - 40) sepPose.y += G.minTop - 40 - e2.top;
  }

  /** Outline path (sheet + tab), local to the annex centre, for marks and ghosts. */
  const annexOutline = (() => {
    const tw = annex.tabW, tH = annex.tabH, ty = -ah / 2 + tabY;
    return `M${r(-aw / 2)} ${r(-ah / 2)}H${r(aw / 2)}V${r(ah / 2)}H${r(-aw / 2)}V${r(ty + tH / 2)}H${r(-aw / 2 - tw)}V${r(ty - tH / 2)}H${r(-aw / 2)}Z`;
  })();

  // --- folder (the pocket front exists twice: over the annex while it is
  //     inside the pocket, under it once it has been pulled clear of the lip)
  const fTL = {x: G.folder[0] - G.fw / 2, y: G.folder[1] - G.fh / 2};
  const chipSize = 30;
  const mkChip = (who, c, name) => {
    if (o.chips === false || !ctx.show('key')) return null;
    const text = who.role ? `${who.name} · ${who.role}` : who.name;
    const opts = {x: c.x, y: c.y, anchor: c.anchor, maxWidth: c.maxWidth, size: chipSize, minSize: 20, maxLines: 3, name};
    const first = chip(ctx, text, opts);
    // bottom-anchored chips grow upward so a second line never leaves the stage
    return c.bottom ? chip(ctx, text, {...opts, y: c.y - first.box.h}) : first;
  };
  const chipA = mkChip(o.actors[0], G.chipA, `${P}-chipA`);
  const chipB = mkChip(o.actors[1], G.chipB, `${P}-chipB`);
  // a name chip that covers the lower part of the pocket front: the label
  // plate moves into the uncovered band above it
  const plateBand = chipB && chipB.box.x < fTL.x + G.fw && chipB.box.x + chipB.box.w > fTL.x && chipB.box.y < fTL.y + G.fh
    ? {y1: chipB.box.y - fTL.y - 8} : null;
  const folder = pocketFolder(ctx, {prefix: `${P}-folder`, w: G.fw, h: G.fh, label: o.folderLabel, showText, plateBand});
  const folderFront = pocketFolder(ctx, {prefix: `${P}-folderF`, w: G.fw, h: G.fh, label: o.folderLabel, showText, plateBand});
  const restPose = {x: G.folder[0] + G.inFolder[0], y: G.folder[1] + G.inFolder[1], rot: G.restRot};
  // the slide pulls the sheet straight up until its lowest corner clears the
  // pocket lip; only then does the lateral carry start
  const lipY = fTL.y + folder.pocketTop + 1;
  const outRot = G.restRot * 0.5;
  const outProbe = {x: restPose.x + G.slide[0], y: 0, rot: outRot};
  const outPose = {...outProbe, y: Math.min(restPose.y + G.slide[1], lipY - 18 - yExtent(outProbe).bottom)};

  // --- seal spots: linked = across the seam next to the tab; separate = on the annex alone
  const sealR = 44;
  const sealOff = tabHalf + sealR + 18;
  const shoulderA0 = {x: G.shoulderA[0], y: G.shoulderA[1]};
  const reachA0 = G.arm.upper + G.arm.lower + 24 * 1.3 * (50 / 46);
  const sealY = k => {
    const m = rowMid(k);
    const top = dockPose(k).y - ah / 2;
    const below = m + sealOff, above = m - sealOff;
    const fits = y => y - sealR > Math.max(top + ah * 0.13, docTL.y) + 8 && y + sealR < Math.min(top + ah, docTL.y + dh) - 8;
    const reachable = y => Math.hypot(seamX - shoulderA0.x, y - shoulderA0.y) < reachA0 - 20;
    const order = [below, above];
    return order.find(y => fits(y) && reachable(y)) ?? order.find(reachable) ?? order.find(fits) ?? order[0];
  };
  const sealSpotLinked = {x: seamX, y: sealY(k1)};
  // separate: on the annex alone, kept below its header band and title
  const sealLocalSep = {x: -aw / 2 + sealR + 30, y: clamp(sealY(k1) - dock1.y, -ah / 2 + ah * 0.31 + sealR + 6, ah / 2 - sealR - 14)};
  {
    // pulled up toward A (never onto the header band) when out of reach
    const a = rad(sepPose.rot);
    const world = q => ({x: sepPose.x + q.x * Math.cos(a) - q.y * Math.sin(a), y: sepPose.y + q.x * Math.sin(a) + q.y * Math.cos(a)});
    const minY = -ah / 2 + annex.titleBottom + sealR + 2;
    for (let i = 0; i < 60 && sealLocalSep.y > minY; i++) {
      const wq = world(sealLocalSep);
      if (Math.hypot(wq.x - shoulderA0.x, wq.y - shoulderA0.y) < reachA0 - 20) break;
      sealLocalSep.y = Math.max(minY, sealLocalSep.y - 10);
    }
  }

  // --- ink: reference text written at the end of the clause heading (one or
  //     two lines), then the link loop from its end to the tab eyelet
  const ink = [];
  const inkRows = {};
  for (const k of refRows) {
    const b = contract.ref[k];
    const f0 = b.fits[0];
    const x0 = docTL.x + b.x;
    const textY = docTL.y + b.y + b.size * 0.1;
    const lineTexts = f0 && showText ? f0.lines : [''];
    const lines = lineTexts.map((ln, i) => {
      const lw = showText && f0 ? ctx.measure(ln, f0.size, 600, 'serif') + 4 : b.w - 8;
      return {x0, x1: x0 + Math.max(24, lw), base: textY + b.size * 0.8 + i * b.lineHeight};
    });
    // one handwriting pass per line; the hop between lines is lifted (not inked)
    const waves = lines.map(l => writingPath(l.x0, l.x1, l.base, b.size));
    const pts = [];
    const spans = [];
    let acc = 0;
    waves.forEach((wv, i) => {
      if (i > 0) acc += Math.hypot(wv.pts[0].x - pts[pts.length - 1].x, wv.pts[0].y - pts[pts.length - 1].y);
      const start = acc;
      wv.pts.forEach((q, j) => { if (j > 0) acc += Math.hypot(q.x - wv.pts[j - 1].x, q.y - wv.pts[j - 1].y); pts.push(q); });
      spans.push({start, end: acc});
    });
    const wpath = polyline(pts);
    const total = wpath.total || 1;
    spans.forEach(sp => { sp.a = sp.start / total; sp.b = sp.end / total; });
    const last = lines[lines.length - 1];
    const ulY = last.base + 7;
    const uls = lines.map((l, i) => h('path', {name: `${P}-ul-${k}-${i}`, d: `M${r(l.x0)} ${r(l.base + 7)}H${r(l.x1)}`, stroke: INK_BLUE, 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': `${r(l.x1 - l.x0)} ${r(l.x1 - l.x0 + 10)}`, 'stroke-dashoffset': r(l.x1 - l.x0)}));
    const clipId = `${P}-refclip-${k}`;
    const texts = showText ? b.fits.map((f, i) => textBlock(f, {x: x0 + 2, y: textY, fill: INK_BLUE, italic: true, name: `${P}-ref-${k}-v${i}`, opacity: i ? 0 : undefined})) : [];
    const scribs = !showText ? waves.map((wv, i) => h('path', {name: `${P}-scrib-${k}-${i}`, d: wv.d(1), fill: 'none', stroke: INK_BLUE, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(wv.total)} ${r(wv.total + 10)}`, 'stroke-dashoffset': r(wv.total)})) : [];
    const eyeW = {x: dockPose(k).x + annex.eyelet.x, y: dockPose(k).y + annex.eyelet.y};
    const lpath = linkPath({x: last.x1 + 4, y: ulY}, eyeW, annex.eyeR);
    const link = h('path', {name: `${P}-link-${k}`, d: lpath.d(1), fill: 'none', stroke: INK_BLUE, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(lpath.total)} ${r(lpath.total + 10)}`, 'stroke-dashoffset': r(lpath.total)});
    const nRects = Math.max(b.lines, lines.length);
    const rects = [];
    for (let i = 0; i < nRects; i++) rects.push(h('rect', {name: `${clipId}-r${i}`, x: r(x0 - 4), y: r(textY - 8 + i * b.lineHeight), width: 0, height: r(b.lineHeight + (i === nRects - 1 ? 14 : 0))}));
    ink.push(g({name: `${P}-ink-${k}`},
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, rects)),
      texts.length ? g({'clip-path': ctx.ref(clipId)}, texts) : null,
      scribs, uls, link));
    inkRows[k] = {x0, x1: Math.max(...lines.map(l => l.x1)), lines, spans, waves, nRects, full: b.w + 30, base: last.base, ulY, wpath, lpath, eye: eyeW, box: {x: x0, y: textY, w: b.w, h: b.h}};
  }

  // --- seal
  const seal = sealTool(ctx, {name: `${P}-seal`, radius: sealR, color: th.accent});
  const stampRest = {x: G.stampRest[0], y: G.stampRest[1]};
  const impression = sealImpression(ctx, {name: `${P}-impr`, text: o.sealLabel, radius: sealR - 2, color: th.accent, showText});

  // --- pen
  const penProp = penTool(ctx, {name: `${P}-pen`, length: 210, body: th.accent2});
  const penAngle = G.penAngle;
  const penDir = {x: Math.cos(rad(penAngle)), y: Math.sin(rad(penAngle))};
  const penRest = {x: G.penRest[0], y: G.penRest[1]};

  // --- actors
  const lookA = actorLook(ctx, o.actors[0], 0);
  const lookB = actorLook(ctx, o.actors[1], 1);
  const armSpec = {upper: G.arm.upper, lower: G.arm.lower, width: 50, handScale: 1.3};
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec});
  const armB = topArm(ctx, {name: `${P}-armB`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...armSpec});
  const shoulderA = {x: G.shoulderA[0], y: G.shoulderA[1]};
  const shoulderB = {x: G.shoulderB[0], y: G.shoulderB[1]};
  const restA = {x: G.restA[0], y: G.restA[1]};
  const restB = {x: G.restB[0], y: G.restB[1]};
  const gripB = {x: aw * G.gripB[0], y: ah * G.gripB[1]};

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: o.seedKey || 'annex-desk'});

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      g({transform: T(fTL.x, fTL.y)}, folder.back),
      g({transform: T(fTL.x, fTL.y)}, folder.pocket),
      g({transform: T(docTL.x, docTL.y)}, contract.node),
      // optional layer between the contract and the annex (target outlines,
      // ghosts): a node, or a function of the solved annex geometry
      typeof o.under === 'function' ? o.under({aw, ah, annex, dock1, dock2, sepPose, outline: annexOutline}) : o.under || null,
      annex.node,
      g({transform: T(fTL.x, fTL.y)}, folderFront.pocket),
      ink,
      impression,
      penProp.node,
      seal,
      armB.arm, armB.palm, armB.thumb,
      armA.arm, armA.palm, armA.thumb,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  /**
   * Lean model: the (off-desk) shoulder slides along the actor's body axis
   * (straight back from their desk edge) so that the arm stays comfortably
   * extended: no sharp elbows when the hand is near the edge, a slight lean-in
   * for far targets. The result is a pure function of the hand position.
   */
  const leanShoulder = (base, hand, reach, axisDir) => {
    const w = {x: hand.x - base.x, y: hand.y - base.y};
    const d = Math.hypot(w.x, w.y);
    const D = clamp(d, reach * 0.93, reach * 0.97);
    const wa = w.x * axisDir.x + w.y * axisDir.y;
    const disc = wa * wa - d * d + D * D;
    const sv = clamp(disc >= 0 ? wa + Math.sqrt(disc) : wa, -40, 420);
    return {x: base.x + axisDir.x * sv, y: base.y + axisDir.y * sv};
  };
  const rotAt = (pose, local) => {
    const a = rad(pose.rot || 0);
    return {x: pose.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: pose.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
  };
  const lerpPose = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerp(a.rot, b.rot, t)});
  const penGrip = (tip, lift = 0) => ({x: tip.x + penDir.x * penProp.grip - 4 * lift, y: tip.y + penDir.y * penProp.grip - 12 * lift});

  /** Release point: offset from the target toward the folder, pulled back until B's grip is in reach. */
  function releaseFor(target) {
    let rel = {x: target.x + G.release[0], y: target.y + G.release[1], rot: target.rot - (ctx.reduced ? 0 : 2.5)};
    for (let i = 0; i < 80; i++) {
      const gp = rotAt(rel, gripB);
      if (Math.hypot(gp.x - shoulderB.x, gp.y - shoulderB.y) <= armB.reach - 30) break;
      const dx = outPose.x - rel.x, dy = outPose.y - rel.y;
      const L = Math.hypot(dx, dy) || 1;
      rel = {x: rel.x + (dx / L) * 10, y: rel.y + (dy / L) * 10, rot: rel.rot};
    }
    return rel;
  }

  /**
   * Target pose of the annex (after the glide). `join` moves separate → dock,
   * `shift` moves dock(k1) → dock(k2). Both default to 0.
   */
  function targetPose(linked, s) {
    const dock = k2 === null ? dock1 : lerpPose(dock1, dock2, ease.inOutCubic(clamp(s.shift || 0)));
    if (linked) return dock;
    return lerpPose(sepPose, dock, ease.inOutCubic(clamp(s.join || 0)));
  }

  /**
   * Pose the stage from action values in [0,1].
   * @param {{reachB?:number, slideOut?:number, carry?:number, glide?:number, retreatB?:number, highlight?:number,
   *          penLift?:number, write?:number, link?:number, penBack?:number, toStamp?:number, stamp?:number, retreatA?:number,
   *          linked?:boolean, join?:number, shift?:number, refVariant?:number, labelVariant?:number, linkRow?:'k1'|'k2'}} s
   */
  function pose(s) {
    const v = key => clamp(s[key] || 0);
    const linked = s.linked !== undefined ? s.linked : o.linked !== false;
    const nodes = {};
    const reduced = ctx.reduced;

    // --- annex
    const target = targetPose(linked, s);
    // the release point is the same whatever the final placement (the carry is
    // identical; only the free glide ends at a different spot)
    const release = releaseFor(targetPose(true, s));
    let A, lift, holder;
    if (v('glide') > 0) {
      const e = ease.outCubic(v('glide'));
      A = lerpPose(release, target, e);
      lift = 1 - ease.inOutSine(v('glide'));
      holder = v('glide') >= 1 ? (linked ? 'docked' : 'separate') : 'gliding';
    } else if (v('carry') > 0) {
      const e = ease.inOutCubic(v('carry'));
      const mid = {x: (outPose.x + release.x) / 2, y: (outPose.y + release.y) / 2};
      const dx = release.x - outPose.x, dy = release.y - outPose.y;
      const L = Math.hypot(dx, dy) || 1;
      const ctl = {x: mid.x - (dy / L) * G.carryBow, y: mid.y + (dx / L) * G.carryBow};
      const q = {x: (1 - e) * (1 - e) * outPose.x + 2 * (1 - e) * e * ctl.x + e * e * release.x, y: (1 - e) * (1 - e) * outPose.y + 2 * (1 - e) * e * ctl.y + e * e * release.y};
      A = {x: q.x, y: q.y, rot: lerp(outPose.rot, release.rot, e)};
      lift = lerp(0.55, 1, ease.outQuad(v('carry')));
      holder = 'B-carrying';
    } else if (v('slideOut') > 0) {
      A = lerpPose(restPose, outPose, ease.inOutCubic(v('slideOut')));
      lift = 0.55 * v('slideOut');
      holder = 'B-sliding';
    } else {
      A = {...restPose};
      lift = 0;
      holder = 'folder';
    }
    if (holder === 'docked' || holder === 'separate') A = {...target};
    if (holder === 'separate' && (s.join || 0) > 0) holder = s.join >= 1 ? 'docked' : 'joining';
    const k = reduced ? 1 : 1 + 0.03 * lift;
    nodes[`${P}-annex`] = {transform: T(A.x, A.y, A.rot, k)};
    // pocket front over the sheet only while it is (partly) inside the pocket
    const inPocket = holder === 'folder' || holder === 'B-sliding';
    nodes[`${P}-folderF-pocket`] = {opacity: inPocket ? 1 : 0};
    nodes[`${P}-folder-pocket`] = {opacity: inPocket ? 0 : 1};
    nodes[`${P}-annex-shadow`] = {transform: T(8 + 16 * lift, 10 + 20 * lift), opacity: r(1 - 0.35 * lift, 3)};
    const eyeWorld = rotAt(A, annex.eyelet);

    // --- hand B: reach, slide, carry, release, retreat
    const gripW = rotAt(A, gripB);
    let handB;
    if (v('retreatB') > 0) handB = mix(rotAt(release, gripB), restB, ease.inOutCubic(v('retreatB')));
    else if (v('glide') > 0) handB = rotAt(release, gripB);
    else if (v('carry') > 0 || v('slideOut') > 0) handB = gripW;
    else handB = mix(restB, rotAt(restPose, gripB), ease.inOutCubic(v('reachB')));
    const solvedB = armB.pose(leanShoulder(shoulderB, handB, armB.reach, axis === 'vertical' ? {x: 0, y: 1} : {x: 1, y: 0}), handB, axis === 'vertical' ? -1 : 1);
    Object.assign(nodes, solvedB.nodes);

    // --- clause highlight (the linked row lights when the tab lands)
    for (let i = 0; i < contract.n; i++) nodes[`${P}-doc-hl-${i}`] = {opacity: 0};
    const hlRow = s.linkRow === 'k2' && k2 !== null ? k2 : k1;
    nodes[`${P}-doc-hl-${hlRow}`] = {opacity: r(0.85 * v('highlight'), 3)};

    // --- pen: approach, write the reference, link loop, lay down
    const row = s.linkRow === 'k2' && k2 !== null ? inkRows[k2] : inkRows[k1];
    const wStart = row.wpath.at(0);
    const wEnd = row.wpath.at(1);
    const lEnd = row.lpath.at(1);
    const endTip = linked && v('link') > 0 ? lEnd : wEnd;
    let tip = null, penLift = 0, touching = false;
    let handA;
    const stampPhase = v('toStamp') > 0 || v('stamp') > 0 || v('retreatA') > 0;
    if (s.penAtRest) {
      // ink shown as already written (inspect views): the pen lies at rest and
      // A's hand stays at its rest spot
      tip = {...penRest};
      handA = {...restA};
    } else if (!stampPhase) {
      if (v('penBack') > 0) {
        tip = mix(endTip, penRest, ease.inOutCubic(v('penBack')));
        penLift = Math.sin(Math.PI * v('penBack'));
      } else if (linked && v('link') > 0) {
        tip = row.lpath.at(ease.inOutSine(v('link')));
        touching = v('link') < 1;
      } else if (v('write') > 0) {
        tip = row.wpath.at(ease.inOutSine(v('write')));
        touching = true;
      } else if (v('penLift') > 0) {
        tip = mix(penRest, wStart, ease.inOutCubic(v('penLift')));
        penLift = Math.sin(Math.PI * v('penLift'));
      } else tip = {...penRest};
      handA = v('reachA') < 1 && v('penLift') === 0 && v('write') === 0
        ? mix(restA, penGrip(penRest), ease.inOutSine(v('reachA')))
        : penGrip(tip, reduced ? 0 : penLift);
    }
    // --- seal: pick up, carry to the spot, press, lift, return, then the hand withdraws
    const spot = linked ? sealSpotLinked : rotAt(target, sealLocalSep);
    let press = 0, stampPos = stampRest, carried = 0;
    if (stampPhase) {
      if (v('retreatA') > 0) handA = mix(stampRest, restA, ease.inOutSine(v('retreatA')));
      else if (v('stamp') > 0) {
        const st = v('stamp');
        const go = seg(st, 0, 0.35), down = seg(st, 0.35, 0.47), up = seg(st, 0.47, 0.58), back = seg(st, 0.58, 1);
        handA = back > 0 ? mix(spot, stampRest, ease.inOutSine(back)) : mix(stampRest, spot, ease.inOutSine(go));
        press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
        carried = st < 1 ? 1 - press : 0;
      } else handA = mix(penGrip(penRest), stampRest, ease.inOutSine(v('toStamp')));
    }
    const solvedA = armA.pose(leanShoulder(shoulderA, handA, armA.reach, {x: 0, y: -1}), handA, G.bendA ?? 1);
    Object.assign(nodes, solvedA.nodes);
    const penHeld = !s.penAtRest && !stampPhase && v('penBack') < 1 && (v('reachA') >= 1 || v('penLift') > 0 || v('write') > 0);
    const penTip = penHeld
      ? {x: solvedA.hand.x - penDir.x * penProp.grip + 4 * (reduced ? 0 : penLift), y: solvedA.hand.y - penDir.y * penProp.grip + 12 * (reduced ? 0 : penLift)}
      : {...penRest};
    nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, penAngle)};
    const sealHeld = v('stamp') > 0 && v('stamp') < 1 && !(v('retreatA') > 0);
    if (sealHeld) stampPos = solvedA.hand;
    nodes[`${P}-seal`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * carried * (reduced ? 0 : 1)) * (1 - 0.08 * press))};
    nodes[`${P}-seal-shadow`] = {opacity: r(1 - press * 0.85, 3)};
    const sealed = v('stamp') >= 0.47;
    nodes[`${P}-impr`] = {transform: T(spot.x, spot.y, -12), opacity: sealed ? 0.92 : 0};

    // --- ink progress per row
    const linkDrawn = {};
    for (const kk of refRows) {
      const rr = inkRows[kk];
      const active = rr === row;
      const wp = active ? ease.inOutSine(v('write')) : clamp(s[`write_${kk}`] || 0);
      const lp = active && linked ? ease.inOutSine(v('link')) : clamp(s[`link_${kk}`] || 0);
      const tipP = rr.wpath.at(wp);
      rr.lines.forEach((l, i) => {
        const sp = rr.spans[i];
        const lf = wp >= sp.b ? 1 : wp > sp.a ? clamp((tipP.x - l.x0) / Math.max(1, l.x1 - l.x0)) : 0;
        nodes[`${P}-ul-${kk}-${i}`] = {'stroke-dashoffset': r((l.x1 - l.x0) * (1 - lf)), opacity: lf > 0 ? 1 : 0};
        if (!showText) nodes[`${P}-scrib-${kk}-${i}`] = {'stroke-dashoffset': r(rr.waves[i].total * (1 - lf)), opacity: lf > 0 ? 1 : 0};
      });
      for (let i = 0; i < rr.nRects; i++) {
        const sp = rr.spans[i];
        const l = rr.lines[i];
        const width = wp >= 1 || (sp && wp >= sp.b) ? rr.full : sp && wp > sp.a ? Math.max(0, tipP.x - l.x0 + 8) : 0;
        nodes[`${P}-refclip-${kk}-r${i}`] = {width: r(width)};
      }
      linkDrawn[kk] = r(lp, 3);
      nodes[`${P}-link-${kk}`] = {'stroke-dashoffset': r(rr.lpath.total * (1 - lp)), opacity: r(s[`linkFade_${kk}`] !== undefined ? s[`linkFade_${kk}`] : (lp > 0 ? 1 : 0), 3)};
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        annexCenter: P2(A),
        annexRotation: r(A.rot),
        annexHolder: holder,
        annexLift: r(lift, 3),
        annexGrip: P2(gripW),
        pocketOverAnnex: inPocket,
        annexBottom: r(yExtent(A).bottom),
        pocketLip: r(lipY),
        annexInWindow: yExtent(A).top >= 0 && yExtent(A).bottom <= H,
        heldGrip: P2(penHeld ? {x: penTip.x + penDir.x * penProp.grip - 4 * (reduced ? 0 : penLift), y: penTip.y + penDir.y * penProp.grip - 12 * (reduced ? 0 : penLift)} : solvedA.hand),
        handB: P2(solvedB.hand),
        handA: P2(solvedA.hand),
        penTip: P2(penTip),
        penHeld,
        penTouching: touching,
        writeProgress: r(v('write'), 3),
        linkProgress: Math.max(0, ...Object.values(linkDrawn)),
        links: linkDrawn,
        eyelet: P2(eyeWorld),
        linkEnd: P2(lEnd),
        inkTip: P2(linked && v('link') > 0 ? row.lpath.at(ease.inOutSine(v('link'))) : row.wpath.at(ease.inOutSine(v('write')))),
        stampTool: P2(stampPos),
        stampSpot: P2(spot),
        stampPressed: press > 0.5,
        sealApplied: sealed,
        sealAcrossSeam: sealed && linked,
        highlight: r(v('highlight'), 3),
        reach: {A: solvedA.reached, B: solvedB.reached},
        allReached: solvedA.reached && solvedB.reached,
      },
    };
  }

  return {
    node, pose, W, H, axis, hints: {tag: G.tag, annot: {...G.annot, avoid: chipA && chipA.box}, chipA: chipA && chipA.box, chipB: chipB && chipB.box},
    contract, annex, annexOutline, docTL, dw, dh, aw, ah, overlap, seamX,
    dock1, dock2, sepPose, restPose, k1, k2, refRows, inkRows,
    sealSpotLinked, sealLocalSep, sealR, stampRest, penRest,
    rowMid,
    /** contract-local → stage coordinates */
    docPoint: q => cw(q),
    /** annex-local (centre origin) → stage coordinates for a given pose */
    annexPoint: (poseQ, local) => rotAt(poseQ, local),
    targetPose,
  };
}
