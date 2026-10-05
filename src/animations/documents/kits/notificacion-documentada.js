/**
 * Kit for the "Notificación documentada" motif (LAW-0033..0036).
 *
 * Original vector props (all local origins documented per prop):
 *  - letterTray      desk letter tray seen from above, with a front lip that
 *                    carries a label plate and an OUT/IN pictogram (the
 *                    pictogram keeps the trays distinguishable with labels off).
 *  - noticeEnvelope  window envelope; the enclosed notice's reference, title,
 *                    first heading and addressee show through the window.
 *  - ackCard         tear-off acknowledgment card (perforated edge, paper clip,
 *                    header band, reference rows, date box and a "received by"
 *                    signature line). Its signature stroke and date-stamp
 *                    impression are children of the card, so they travel with it.
 *  - recordFolder    the sender's open record file (tabbed folder).
 *  - partition       top-down wall between the two offices with a service
 *                    hatch (sill) the envelope and the card pass through.
 *
 * Stage solver (`notificationStage`): the sender's office (party A) and the
 * recipient's office (party B) separated by the wall. Party A carries the
 * envelope from the OUT tray to the hatch where party B takes it (both hands
 * hold it at the shared hand-off point), B lays it in the IN tray, signs the
 * attached acknowledgment card with a pen (other hand), date-stamps it, tears
 * it off and passes it back through the hatch; A files it in the folder.
 *
 * The kit only owns geometry and a pose solver (action values → node props).
 * Each entry owns its own timeline, layout and semantics.
 *
 * Attachment rules (asserted by tests through the returned semantics):
 *  - while carried, the envelope/card grip point coincides with the solved
 *    palm centre of the holding hand; at the hand-off both grips are held;
 *  - the pen tip is placed from B2's solved hand; while writing, the tip is on
 *    the card's signature stroke;
 *  - the stamp tool follows B1's solved hand and marks the date box on contact;
 *  - every IK target is inside arm reach (`allReached`).
 * @module animations/documents/kits/notificacion-documentada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, roundRectPath} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {pen, stampTool, shade, signatureMark} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, oneOf, obj} from '../../../schemas/fields.js';

const INK = '#1f2328';
export const ENV = {w: 360, h: 224};
export const CARD = {w: 176, h: 128};
export const TRAY = {w: 424, h: 300};
export const FOLDER = {w: 336, h: 256};
const ENVELOPE_FILL = '#f4ead4';
const CARD_FILL = '#e4efd9';
const FOLDER_FILL = '#dcbc7d';

/** Scene-specific built-in strings shared by the four entries. */
export const NOTICE_STRINGS = {
  en: {
    to: 'To', doc: 'Ref.', date: 'Date', receivedBy: 'Received by',
    stRecordFiled: 'Delivered · record filed', stSignedKept: 'Delivered · acknowledgment kept', stNoRecord: 'Delivered · no record made',
    delivered: 'Delivered', filed: 'Filed', noRecord: 'No record', sent: 'Sent',
  },
  es: {
    to: 'Para', doc: 'Ref.', date: 'Fecha', receivedBy: 'Recibido por',
    stRecordFiled: 'Entregada · registro archivado', stSignedKept: 'Entregada · acuse conservado', stNoRecord: 'Entregada · sin registro',
    delivered: 'Entregada', filed: 'Archivado', noRecord: 'Sin registro', sent: 'Enviada',
  },
};

/** Object-label fields used by the category entries (printed on the props). */
export const noticeObjectLabels = obj('Labels printed on the props', {
  outTray: str('Label plate of the sender’s tray', 24),
  inTray: str('Label plate of the recipient’s tray', 24),
  folder: str('Label on the sender’s record folder', 40),
  card: str('Header printed on the acknowledgment card', 40),
  stamp: str('Word printed by the date stamp', 20),
});
export const receiptDateField = str('Relative date printed by the date stamp (fictional, e.g. “Day 3”)', 24);
export const noticeFinalStates = ['record-filed', 'signed-kept', 'delivered-no-record'];
export const finalStateField = oneOf('State supplied by the author for the final hold (descriptive only; no legal effect is inferred)', noticeFinalStates);

const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------------ */
/* Props                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Small tray pictogram: an open box with an arrow leaving (out) or entering (in).
 * Local origin = centre; size ≈ 1 unit = s.
 */
export function trayGlyph(kind, s, color) {
  const box = `M${r(-s * 0.5)} ${r(-s * 0.05)}V${r(s * 0.45)}H${r(s * 0.5)}V${r(-s * 0.05)}`;
  const arrow = kind === 'out'
    ? `M0 ${r(s * 0.28)}V${r(-s * 0.5)}M${r(-s * 0.22)} ${r(-s * 0.28)}L0 ${r(-s * 0.5)}L${r(s * 0.22)} ${r(-s * 0.28)}`
    : `M0 ${r(-s * 0.55)}V${r(s * 0.22)}M${r(-s * 0.22)} 0L0 ${r(s * 0.22)}L${r(s * 0.22)} 0`;
  return g(null,
    h('path', {d: box, fill: 'none', stroke: color, 'stroke-width': s * 0.13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d: arrow, fill: 'none', stroke: color, 'stroke-width': s * 0.13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
}

/**
 * Letter tray from above. Local origin = centre. `front` is the side of the
 * owner (the lip with the label plate).
 * @param {any} ctx
 * @param {{name?:string, w?:number, h?:number, front:'top'|'bottom', kind:'out'|'in', label?:string, color?:string, plate?:string}} o
 */
export function letterTray(ctx, o) {
  const th = ctx.theme;
  const w = o.w ?? TRAY.w, hh = o.h ?? TRAY.h;
  const rim = 20, lip = 46;
  const rimC = o.color ?? '#56636d';
  const floorC = '#d5dade';
  const x0 = -w / 2, y0 = -hh / 2;
  const top = o.front === 'top';
  // inner floor (the lip side is thicker)
  const fy0 = top ? y0 + lip : y0 + rim;
  const fh = hh - rim - lip;
  const far = top ? fy0 + fh - 18 : fy0; // far inner wall shading band
  const plateW = Math.min(w * 0.62, 250), plateH = lip - 14;
  const lipY = top ? y0 + 7 : y0 + hh - lip + 7;
  const plateX = -plateW / 2;
  const glyphS = plateH * 0.7;
  const showText = ctx.show('key') && o.label;
  let labelNode = null;
  if (showText) {
    // text area: from a clear gap after the pictogram to the plate's right padding;
    // the letter spacing is part of the rendered width, so it is reserved in the fit
    const spacing = 1;
    const areaX = plateX + 10 + glyphS + 16, areaW = plateX + plateW - 12 - areaX;
    const chars = [...String(o.label)].length;
    const f = ctx.fit(o.label, {maxWidth: areaW - spacing * chars, size: 26, minSize: 14, maxLines: 1, weight: 800});
    labelNode = textBlock(f, {x: areaX + areaW / 2, y: lipY + (plateH - f.size) / 2 + 1, anchor: 'middle', fill: INK, letterSpacing: spacing});
  }
  return g({name: o.name},
    h('path', {d: roundRectPath(x0 + 8, y0 + 12, w, hh, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 18), fill: rimC, stroke: INK, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(x0 + rim, fy0, w - rim * 2, fh, 10), fill: floorC, stroke: shade(rimC, -0.35), 'stroke-width': 1.5}),
    h('rect', {x: x0 + rim + 2, y: far, width: w - rim * 2 - 4, height: 18, rx: 6, fill: '#000', opacity: 0.13}),
    // side ribs of the floor
    h('path', {d: `M${r(x0 + rim + 30)} ${r(fy0 + 26)}V${r(fy0 + fh - 26)}M${r(-x0 - rim - 30)} ${r(fy0 + 26)}V${r(fy0 + fh - 26)}`, stroke: shade(floorC, -0.12), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    // label plate on the lip
    h('rect', {x: plateX, y: lipY, width: plateW, height: plateH, rx: 6, fill: o.plate ?? '#fbf6ea', stroke: INK, 'stroke-width': 2}),
    g({transform: T(plateX + 10 + glyphS / 2, lipY + plateH / 2 + 1)}, trayGlyph(o.kind, glyphS, INK)),
    labelNode,
  );
}

/**
 * Window envelope (face up). Local origin = centre.
 * @param {any} ctx
 * @param {{prefix:string, w?:number, h?:number, docId:string, title:string, clause?:string, redactFirst?:boolean, addressee:string, toLabel:string, showText?:boolean}} o
 */
export function noticeEnvelope(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w ?? ENV.w, hh = o.h ?? ENV.h;
  const showText = o.showText !== false;
  const x0 = -w / 2, y0 = -hh / 2;
  const win = {x: x0 + 16, y: y0 + 34, w: w * 0.5, h: hh * 0.64};
  const pad = 11;
  const inner = win.w - pad * 2;
  const parts = [];
  let y = win.y + 9;
  if (showText) {
    const f1 = ctx.fit(o.docId, {maxWidth: inner, size: 14, minSize: 10, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f1, {x: win.x + pad, y, fill: th.inkSoft}));
    y += f1.size + 11;
    let f2 = ctx.fit(o.title, {maxWidth: inner, size: 19, minSize: 14, maxLines: 1, weight: 700, family: 'serif'});
    if (f2.truncated) f2 = ctx.fit(o.title, {maxWidth: inner, size: 17, minSize: 12, maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f2, {x: win.x + pad, y, fill: INK}));
    y += f2.height + 12;
    const f4 = ctx.fit(`${o.toLabel}: ${o.addressee}`, {maxWidth: inner, size: 14, minSize: 10, maxLines: 1, weight: 600});
    const toY = win.y + win.h - f4.size - 10;
    if (o.clause && y + 12 < toY - 10) {
      const f3 = ctx.fit(o.clause, {maxWidth: inner, size: 12, minSize: 9, maxLines: 1, weight: 500});
      parts.push(o.redactFirst
        ? h('rect', {x: win.x + pad, y: y - 1, width: Math.max(40, f3.width), height: f3.size + 3, rx: 2, fill: INK})
        : textBlock(f3, {x: win.x + pad, y, fill: th.inkSoft}));
    }
    parts.push(textBlock(f4, {x: win.x + pad, y: toY, fill: INK}));
  } else {
    parts.push(h('rect', {x: win.x + pad, y, width: inner * 0.35, height: 8, rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {x: win.x + pad, y: y + 18, width: inner * 0.8, height: 13, rx: 4, fill: INK, opacity: 0.75}));
    parts.push(h('rect', {x: win.x + pad, y: y + 42, width: inner * 0.62, height: 7, rx: 3, fill: o.redactFirst ? INK : th.paperLine}));
    parts.push(h('rect', {x: win.x + pad, y: win.y + win.h - 22, width: inner * 0.55, height: 9, rx: 3, fill: INK, opacity: 0.6}));
  }
  const post = {x: x0 + w - 78, y: y0 + 22, w: 54, h: 62};
  const node = g({name: P},
    h('path', {name: `${P}-shadow`, d: roundRectPath(x0 + 6, y0 + 9, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 8), fill: ENVELOPE_FILL, stroke: INK, 'stroke-width': th.stroke}),
    // back-flap fold seen through the paper
    h('path', {d: `M${x0 + 6} ${y0 + 8}L${r(x0 + w * 0.5)} ${r(y0 + hh * 0.42)}L${x0 + w - 6} ${y0 + 8}`, fill: 'none', stroke: shade(ENVELOPE_FILL, -0.12), 'stroke-width': 2}),
    // window (the enclosed notice shows through)
    h('path', {d: roundRectPath(win.x, win.y, win.w, win.h, 8), fill: th.paper, stroke: shade(ENVELOPE_FILL, -0.3), 'stroke-width': 2}),
    parts,
    // postage square with cancellation waves
    h('rect', {x: post.x, y: post.y, width: post.w, height: post.h, rx: 3, fill: th.accent2Soft, stroke: INK, 'stroke-width': 1.8, 'stroke-dasharray': '4 3'}),
    h('circle', {cx: post.x + post.w / 2, cy: post.y + post.h / 2, r: 14, fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
    h('path', {d: `M${post.x - 34} ${post.y + 20}q8 -6 16 0t16 0M${post.x - 34} ${post.y + 34}q8 -6 16 0t16 0M${post.x - 34} ${post.y + 48}q8 -6 16 0t16 0`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2}),
  );
  return {node, w, h: hh};
}

/**
 * Acknowledgment card. Local origin = centre. The signature stroke and the
 * date-stamp impression are children so they move with the card.
 * @param {any} ctx
 * @param {{prefix:string, w?:number, h?:number, title:string, docRef:string, addressee:string, signer:string, labels:{doc:string,to:string,receivedBy:string}, stampWord:string, date:string, showText?:boolean, signatureColor?:string, sigName?:string}} o
 */
export function ackCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w ?? CARD.w, hh = o.h ?? CARD.h;
  const showText = o.showText !== false;
  const x0 = -w / 2, y0 = -hh / 2;
  const pad = 14;
  let fH = null;
  if (showText) {
    fH = ctx.fit(o.title.toUpperCase(), {maxWidth: w - pad * 2, size: 14, minSize: 11, maxLines: 1, weight: 800});
    if (fH.truncated) fH = ctx.fit(o.title.toUpperCase(), {maxWidth: w - pad * 2, size: 11, minSize: 8.5, maxLines: 2, weight: 800, leading: 1.05});
  }
  const headH = fH && fH.lines.length > 1 ? hh * 0.3 : hh * 0.24;
  const green = th.accent4;
  const parts = [];
  // rows
  const rowY1 = y0 + headH + 9;
  const rowY2 = rowY1 + (headH > hh * 0.25 ? 23 : 27);
  // date box: the right third of the card; when the addressee has to wrap it becomes a
  // narrower box tucked into the top-right corner so the wrapped lines stay clear of the
  // stamp impression (checked below against the measured addressee width)
  const dateWide = {x: x0 + w - pad - w * 0.33, y: y0 + headH + 8, w: w * 0.33, h: hh * 0.44};
  const dateNarrow = {x: x0 + w - 10 - w * 0.28, y: y0 + headH + 6, w: w * 0.28, h: hh * 0.36};
  // printed rows end before the (slightly rotated) date impression begins
  const colW = Math.min(w * 0.5, dateWide.x - 8 - (x0 + pad));
  let wrapped = false; // addressee row wrapped → narrow date box
  let rowBottom = rowY2 + 11; // lowest printed pixel of the addressee row (the signature stays below it)
  if (showText) {
    parts.push(textBlock(fH, {x: x0 + pad, y: y0 + (headH - fH.height) / 2, fill: '#fff', letterSpacing: 0.4}));
    const f1 = ctx.fit(`${o.labels.doc} ${o.docRef}`, {maxWidth: colW, size: 13, minSize: 9, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f1, {x: x0 + pad, y: rowY1, fill: INK}));
    // the addressee row keeps its meaning: one line if it fits, else up to three smaller
    // lines in the column left of the (narrow) date box
    const wide = dateNarrow.x - 6 - (x0 + pad);
    const toFit = (text, weight) => {
      const one = ctx.fit(text, {maxWidth: colW, size: 13, minSize: 9, maxLines: 1, weight});
      if (!one.truncated) return one;
      // wrapped: start at a size where the longest word fits, so no word is split
      let k = 8;
      const words = String(text).split(/\s+/).filter(Boolean);
      const longest = Math.max(...words.map(wd => ctx.measure(wd, 8, weight, 'sans')));
      // ...and an initial or other one- or two-letter word ('O.') shares its line with the
      // next word, so it is never left alone on a line
      const pairs = words.slice(0, -1).map((wd, i) => (wd.length <= 2 ? ctx.measure(`${wd} ${words[i + 1]}`, 8, weight, 'sans') : 0));
      const need = Math.max(longest, ...pairs);
      if (need > wide) k = Math.max(5, 8 * wide / need);
      return ctx.fit(text, {maxWidth: wide, size: k, minSize: 5, maxLines: 3, weight, leading: 1.02});
    };
    const f2 = toFit(`${o.labels.to}: ${o.addressee}`, 600);
    wrapped = f2.lines.length > 1;
    rowBottom = rowY2 + f2.height + 1;
    parts.push(textBlock(f2, {x: x0 + pad, y: rowY2, fill: INK, name: o.alt ? `${P}-to0` : undefined}));
    if (o.alt && o.alt.to !== undefined) {
      const f2b = toFit(`${o.labels.to}: ${o.alt.to}`, 700);
      wrapped = wrapped || f2b.lines.length > 1;
      rowBottom = Math.max(rowBottom, rowY2 + f2b.height + 1);
      parts.push(textBlock(f2b, {x: x0 + pad, y: rowY2, fill: th.accent2, name: `${P}-to1`, opacity: 0}));
    }
    const f3 = ctx.fit(o.labels.receivedBy, {maxWidth: w * 0.7, size: 11, minSize: 8, maxLines: 1, weight: 500});
    parts.push(textBlock(f3, {x: x0 + pad, y: y0 + hh - 17, fill: th.inkSoft}));
  } else {
    parts.push(h('rect', {x: x0 + pad, y: y0 + headH / 2 - 4, width: w * 0.55, height: 8, rx: 3, fill: '#fff', opacity: 0.85}));
    parts.push(h('rect', {x: x0 + pad, y: rowY1 + 3, width: colW * 0.7, height: 7, rx: 3, fill: INK, opacity: 0.6}));
    parts.push(h('rect', {x: x0 + pad, y: rowY2 + 3, width: colW * 0.85, height: 7, rx: 3, fill: INK, opacity: 0.6}));
  }
  const sigLineY = y0 + hh - 22;
  // the handwritten stroke fills the band between the addressee row and the signature
  // line, so it never crosses a printed datum
  const sigTop = rowBottom + 4;
  const sigBox = {x: x0 + pad + 6, y: sigTop, w: w * (wrapped ? 0.56 : 0.62), h: Math.max(12, sigLineY + 3 - sigTop)};
  const dateBox = wrapped ? dateNarrow : dateWide;
  const dateSpot = {x: dateBox.x + dateBox.w / 2, y: dateBox.y + dateBox.h / 2};
  const sig = signatureMark(ctx, {name: `${P}-sig`, signer: o.sigName ?? o.signer, box: sigBox, color: o.signatureColor ?? '#1d3f8f', width: 3});
  const impr = dateImpression(ctx, {name: `${P}-impr`, word: o.stampWord, date: o.date, altDate: o.alt ? o.alt.date : undefined, w: wrapped ? dateBox.w : dateBox.w + 4, showText});
  const node = g({name: P},
    h('path', {name: `${P}-shadow`, d: roundRectPath(x0 + 5, y0 + 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 6), fill: CARD_FILL, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${x0} ${y0 + 6}Q${x0} ${y0} ${x0 + 6} ${y0}H${x0 + w - 6}Q${x0 + w} ${y0} ${x0 + w} ${y0 + 6}V${y0 + headH}H${x0}Z`, fill: green, stroke: INK, 'stroke-width': 2.2}),
    // perforated tear-off edge
    h('line', {x1: x0 + 7, y1: y0 + headH + 4, x2: x0 + 7, y2: y0 + hh - 4, stroke: shade(CARD_FILL, -0.35), 'stroke-width': 2, 'stroke-dasharray': '3 4'}),
    // the handwritten stroke sits under the printed rows so a wrapped addressee stays readable
    sig.node,
    parts,
    h('rect', {x: dateBox.x, y: dateBox.y, width: dateBox.w, height: dateBox.h, rx: 4, fill: 'none', stroke: shade(CARD_FILL, -0.4), 'stroke-width': 1.6, 'stroke-dasharray': '5 4'}),
    h('line', {x1: x0 + pad, x2: x0 + pad + w * 0.66, y1: sigLineY, y2: sigLineY, stroke: INK, 'stroke-width': 1.8}),
    // the "sign here" cross sits just on the line, below the addressee row
    h('path', {d: `M${x0 + pad} ${r(Math.max(sigLineY - 16, Math.min(sigLineY - 9, rowBottom + 2)))}l8 8m0 -8l-8 8`, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-linecap': 'round'}),
    g({transform: T(dateSpot.x, dateSpot.y)}, impr),
    // paper clip over the bottom edge (clear of the rows, the date box and the signature line)
    h('path', {d: `M${r(x0 + w * 0.86)} ${r(y0 + hh - 20)}V${r(y0 + hh + 12)}Q${r(x0 + w * 0.86)} ${r(y0 + hh + 20)} ${r(x0 + w * 0.86 + 8)} ${r(y0 + hh + 20)}Q${r(x0 + w * 0.86 + 16)} ${r(y0 + hh + 20)} ${r(x0 + w * 0.86 + 16)} ${r(y0 + hh + 12)}V${r(y0 + hh - 26)}Q${r(x0 + w * 0.86 + 16)} ${r(y0 + hh - 32)} ${r(x0 + w * 0.86 + 11)} ${r(y0 + hh - 32)}Q${r(x0 + w * 0.86 + 5)} ${r(y0 + hh - 32)} ${r(x0 + w * 0.86 + 5)} ${r(y0 + hh - 26)}V${r(y0 + hh + 6)}`, fill: 'none', stroke: '#8b949c', 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
  );
  return {node, sig, sigBox, dateBox, dateSpot, w, h: hh};
}

/**
 * Date-stamp impression (two lines: word + relative date). Local origin = centre.
 */
export function dateImpression(ctx, {name, word, date, altDate, w = 90, color, showText = true, rotate = -8}) {
  const c = color ?? ctx.theme.accent;
  const hh = w * 0.62;
  const kids = [
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 7, fill: 'none', stroke: c, 'stroke-width': 3}),
    h('line', {x1: -w / 2 + 6, x2: w / 2 - 6, y1: 0, y2: 0, stroke: c, 'stroke-width': 1.4}),
  ];
  if (showText) {
    // start at the largest size that fits on one line (fitText never shrinks below 8
    // on its own, and a narrow impression needs smaller type than that)
    const sizeFor = (text, k, weight, family) => Math.max(4, Math.min(k, k * (w - 12) / Math.max(1, ctx.measure(String(text), k, weight, family))));
    const f1 = ctx.fit(word, {maxWidth: w - 12, size: sizeFor(word, hh * 0.3, 800, 'sans'), minSize: 4, maxLines: 1, weight: 800});
    const f2 = ctx.fit(date, {maxWidth: w - 12, size: sizeFor(date, hh * 0.32, 700, 'mono'), minSize: 4, maxLines: 1, weight: 700, family: 'mono'});
    kids.push(textBlock(f1, {x: 0, y: -hh / 2 + (hh / 2 - f1.size) / 2 + 1, anchor: 'middle', fill: c, letterSpacing: 0.5}));
    kids.push(textBlock(f2, {x: 0, y: (hh / 2 - f2.size) / 2 + 1, anchor: 'middle', fill: c, name: altDate !== undefined ? `${name}-date0` : undefined}));
    if (altDate !== undefined) {
      const f3 = ctx.fit(altDate, {maxWidth: w - 12, size: sizeFor(altDate, hh * 0.32, 700, 'mono'), minSize: 4, maxLines: 1, weight: 700, family: 'mono'});
      kids.push(textBlock(f3, {x: 0, y: (hh / 2 - f3.size) / 2 + 1, anchor: 'middle', fill: ctx.theme.accent2, name: `${name}-date1`, opacity: 0}));
    }
  } else {
    kids.push(h('path', {d: `M${r(-w * 0.3)} ${r(-hh * 0.25)}H${r(w * 0.3)}M${r(-w * 0.22)} ${r(hh * 0.25)}H${r(w * 0.22)}`, stroke: c, 'stroke-width': hh * 0.14, 'stroke-linecap': 'round'}));
  }
  return g({name, opacity: 0, transform: T(0, 0, rotate)}, kids);
}

/**
 * Sender's record folder (open, seen from above). Local origin = centre.
 * @param {any} ctx
 * @param {{name?:string, w?:number, h?:number, label?:string}} o
 */
export function recordFolder(ctx, o) {
  const th = ctx.theme;
  const fw = o.w ?? FOLDER.w, fh = o.h ?? FOLDER.h;
  const x0 = -fw / 2, y0 = -fh / 2;
  let label = null;
  let tabW = fw * 0.44;
  if (o.label && ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: fw * 0.9 - 36, size: 22, minSize: 13, maxLines: 1, weight: 700});
    tabW = Math.max(tabW, f.width + 36);
    label = textBlock(f, {x: x0 + 16, y: y0 + (26 - f.size) / 2 + 2, fill: INK});
  }
  return g({name: o.name},
    h('path', {d: roundRectPath(x0 + 8, y0 + 20, fw, fh - 8, 12), fill: th.shadow}),
    h('path', {d: `M${x0} ${y0 + 12}Q${x0} ${y0} ${x0 + 10} ${y0}H${r(x0 + tabW)}L${r(x0 + tabW + 20)} ${y0 + 26}H${x0 + fw - 10}Q${x0 + fw} ${y0 + 26} ${x0 + fw} ${y0 + 36}V${y0 + fh - 10}Q${x0 + fw} ${y0 + fh} ${x0 + fw - 10} ${y0 + fh}H${x0 + 10}Q${x0} ${y0 + fh} ${x0} ${y0 + fh - 10}Z`, fill: FOLDER_FILL, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    // earlier records already in the file (plain sheets, no text)
    h('rect', {x: x0 + 26, y: y0 + 44, width: fw - 58, height: fh - 66, rx: 4, fill: '#f3eee3', stroke: shade(FOLDER_FILL, -0.35), 'stroke-width': 1.5, transform: `rotate(2 ${r(x0 + fw / 2)} ${r(y0 + fh / 2)})`}),
    h('rect', {x: x0 + 20, y: y0 + 40, width: fw - 58, height: fh - 66, rx: 4, fill: '#f8f4ea', stroke: shade(FOLDER_FILL, -0.35), 'stroke-width': 1.5}),
    [0, 1, 2, 3].map(i => h('rect', {x: x0 + 40, y: y0 + 70 + i * 34, width: (fw - 110) * (i === 3 ? 0.5 : 0.9), height: 8, rx: 4, fill: th.paperLine})),
    label,
  );
}

/* ------------------------------------------------------------------------ */
/* Stage                                                                     */
/* ------------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1860, h: 880}, square: {w: 1200, h: 1140}, vertical: {w: 940, h: 1300}};

/**
 * Geometry per axis. `v` wall (landscape): the sender's office is on the
 * left, the recipient's on the right; the envelope crosses left → right.
 * `h` wall (square / portrait): the sender is below, the recipient above.
 */
export const GEO = {
  horizontal: {
    wall: {orient: 'v', at: 930, t: 46, open: [238, 628]},
    outTray: {x: 630, y: 384}, inTray: {x: 1340, y: 352},
    envOut: {x: 630, y: 384, rot: -2}, envHand: {x: 930, y: 420, rot: 0}, envIn: {x: 1340, y: 352, rot: 2},
    gripA: {x: -104, y: 84}, gripB: {x: 104, y: -84},
    cardLocal: {x: 88, y: 30, rot: 1},
    cardHand: {x: 930, y: 452, rot: 0}, cardGripA: {x: -70, y: 46}, cardGripB: {x: 70, y: -46},
    // the record folder sits high enough that a wrapped sender chip below it never covers it
    folder: {x: 236, y: 566}, cardFolder: {x: 250, y: 582, rot: -2},
    shoulderA: {x: 700, y: 1040}, restA: {x: 800, y: 790}, waitA: {x: 790, y: 640},
    // B1's elbow bends towards the recipient's office (bend +1), so the arm never
    // passes over the wall; it rests beside the date stamp, clear of the IN tray
    shoulderB1: {x: 1150, y: -160}, restB1: {x: 1100, y: 190},
    shoulderB2: {x: 1600, y: -160}, penRest: {x: 1600, y: 500}, penAngle: -18,
    stampRest: {x: 1050, y: 110},
    arm: {upper: 350, lower: 336, width: 50, handScale: 1.3},
    bend: {A: 1, B1: 1, B2: 1},
    trayFront: {out: 'bottom', in: 'top'},
    // maxH: the tallest a wrapped chip may grow before it would cover the folder / IN tray
    chipA: {x: 660, bottom: 862, anchor: 'end', w: 600, maxH: 150}, chipB: {x: 1206, y: 20, anchor: 'start', w: 420, maxH: 166},
  },
  square: {
    wall: {orient: 'h', at: 540, t: 46, open: [330, 870]},
    outTray: {x: 330, y: 790}, inTray: {x: 840, y: 310},
    envOut: {x: 330, y: 790, rot: -2}, envHand: {x: 600, y: 540, rot: 0}, envIn: {x: 840, y: 310, rot: 2},
    gripA: {x: 100, y: 86}, gripB: {x: -100, y: -86},
    cardLocal: {x: 88, y: 30, rot: 1},
    cardHand: {x: 600, y: 548, rot: 0}, cardGripA: {x: 40, y: 56}, cardGripB: {x: -40, y: -56},
    folder: {x: 930, y: 838}, cardFolder: {x: 946, y: 852, rot: -2},
    shoulderA: {x: 720, y: 1270}, restA: {x: 700, y: 1030}, waitA: {x: 660, y: 880},
    // B1's elbow bends away from the IN tray (bend -1); the pen rests below the
    // tray's right corner, angled so it stays inside the stage
    shoulderB1: {x: 520, y: -170}, restB1: {x: 380, y: 300},
    shoulderB2: {x: 1010, y: -170}, penRest: {x: 1015, y: 505}, penAngle: -35,
    stampRest: {x: 540, y: 150},
    arm: {upper: 350, lower: 336, width: 50, handScale: 1.3},
    bend: {A: 1, B1: -1, B2: 1},
    trayFront: {out: 'bottom', in: 'top'},
    chipA: {x: 40, bottom: 1122, anchor: 'start', w: 560, maxH: 166}, chipB: {x: 1160, y: 22, anchor: 'end', w: 560, maxH: 124},
  },
  vertical: {
    wall: {orient: 'h', at: 650, t: 46, open: [190, 750]},
    outTray: {x: 330, y: 930}, inTray: {x: 580, y: 335},
    envOut: {x: 330, y: 930, rot: -2}, envHand: {x: 470, y: 650, rot: 0}, envIn: {x: 580, y: 335, rot: 2},
    gripA: {x: 96, y: 86}, gripB: {x: -96, y: -86},
    cardLocal: {x: 88, y: 30, rot: 1},
    cardHand: {x: 470, y: 658, rot: 0}, cardGripA: {x: 30, y: 56}, cardGripB: {x: -30, y: -56},
    folder: {x: 712, y: 1082}, cardFolder: {x: 726, y: 1096, rot: -2},
    shoulderA: {x: 520, y: 1450}, restA: {x: 500, y: 1240}, waitA: {x: 540, y: 1000},
    // B1's elbow bends away from the IN tray (bend -1) and rests left of it;
    // the pen rests below the tray's right corner, inside the stage
    shoulderB1: {x: 420, y: -150}, restB1: {x: 200, y: 470},
    shoulderB2: {x: 800, y: -150}, penRest: {x: 760, y: 575}, penAngle: -35,
    stampRest: {x: 290, y: 170},
    arm: {upper: 390, lower: 376, width: 52, handScale: 1.3},
    bend: {A: 1, B1: -1, B2: 1},
    trayFront: {out: 'bottom', in: 'top'},
    chipA: {x: 30, bottom: 1282, anchor: 'start', w: 460, maxH: 186}, chipB: {x: 910, y: 22, anchor: 'end', w: 560, maxH: 146},
  },
};

/**
 * Largest chip font size (≤ size, ≥ minSize) at which every single word fits
 * the chip's text width, so wrapping never has to split a word.
 */
export function wordSafeSize(ctx, text, chipWidth, size, minSize = size * 0.7, weight = 600) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let s = size;
  const widest = k => Math.max(0, ...words.map(w => ctx.measure(w, k, weight, 'sans')));
  while (s > minSize && widest(s) > chipWidth - s * 1.2 - 2) s -= 0.5;
  return s;
}

/** A chip whose bottom edge sits at `o.bottom` (it grows upwards when it wraps). */
export function bottomChip(ctx, text, o) {
  const probe = chip(ctx, text, {...o, y: 0});
  return chip(ctx, text, {...o, y: o.bottom - probe.box.h});
}

/**
 * Find a free spot for a box of size {w,h}: scans a grid inside `region`,
 * keeps boxes clear of every obstacle (with `pad`), and returns the top-left
 * of the candidate nearest to `near` (distance from the box edge, preferring
 * at least `gap` so a leader line stays visible). Returns null when nothing fits.
 * @param {{w:number,h:number}} size
 * @param {{region:{x:number,y:number,w:number,h:number}, obstacles:Array<{x:number,y:number,w:number,h:number}>, near:{x:number,y:number}, gap?:number, pad?:number, step?:number, bias?:(b:any)=>number}} o
 */
export function placeFree(size, o) {
  const pad = o.pad ?? 10, gap = o.gap ?? 40, step = o.step ?? 12;
  const R = o.region;
  const hit = b => o.obstacles.some(q => b.x < q.x + q.w + pad && b.x + b.w + pad > q.x && b.y < q.y + q.h + pad && b.y + b.h + pad > q.y);
  let best = null;
  for (let y = R.y; y + size.h <= R.y + R.h; y += step) {
    for (let x = R.x; x + size.w <= R.x + R.w; x += step) {
      const b = {x, y, w: size.w, h: size.h};
      if (hit(b)) continue;
      const dx = Math.max(b.x - o.near.x, 0, o.near.x - (b.x + b.w));
      const dy = Math.max(b.y - o.near.y, 0, o.near.y - (b.y + b.h));
      const d = Math.hypot(dx, dy);
      const score = Math.abs(d - gap) + (d < gap ? gap : 0) + (o.bias ? o.bias(b) : 0);
      if (!best || score < best.score) best = {x, y, score};
    }
  }
  return best && {x: best.x, y: best.y};
}

/** rotate a local point by a pose and translate */
export function atPose(pose, local) {
  const a = rad(pose.rot || 0);
  const k = pose.k ?? 1;
  return {x: pose.x + (local.x * Math.cos(a) - local.y * Math.sin(a)) * k, y: pose.y + (local.x * Math.sin(a) + local.y * Math.cos(a)) * k};
}
const ez = ease.inOutSine;
const composePose = (parent, local) => ({...atPose(parent, local), rot: (parent.rot || 0) + (local.rot || 0), k: parent.k ?? 1});

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix            unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{docId:string, title:string, clauses:string[], redactions:number[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.parties  sender, recipient
 * @param {{outTray:string, inTray:string, folder:string, card:string, stamp:string}} o.labels
 * @param {string} o.date              relative receipt date printed by the stamp
 * @param {'envelope'|'folder'} [o.cardStart='envelope']  where the blank card starts
 * @param {boolean} [o.chips=true]
 * @param {number} [o.chipSize]        actor chip font size (larger when the stage is shown small, e.g. paired panels)
 * @param {string} [o.sigName]          name driving the signature stroke (defaults to the recipient)
 * @param {{to?:string, date?:string}} [o.alt]  alternative card values (inspect substitution); nodes `${prefix}-card-to0/1`, `${prefix}-card-impr-date0/1`
 */
export function notificationStage(ctx, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const showText = ctx.show('all');
  const vwall = G.wall.orient === 'v';
  const sender = o.parties[0], recipient = o.parties[1];

  // ---- desk surfaces (two offices) and the partition with its hatch
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, mat: false, seedKey: `${axis}-notice-desk`});
  const wallA = vwall ? G.wall.at - G.wall.t / 2 : G.wall.at - G.wall.t / 2;
  const wallB = wallA + G.wall.t;
  const deskB = vwall ? {x: wallB, y: 0, w: W - wallB, h: H} : {x: 0, y: 0, w: W, h: wallA};
  const deskA = vwall ? {x: 0, y: 0, w: wallA, h: H} : {x: 0, y: wallB, w: W, h: H - wallB};
  const tintB = '#9fb0b2';
  const surfaces = g(null,
    h('rect', {x: deskB.x, y: deskB.y, width: deskB.w, height: deskB.h, fill: tintB, opacity: 0.55}),
    h('path', {d: roundRectPath(deskA.x + (vwall ? 34 : 40), deskA.y + (vwall ? 40 : 30), deskA.w - (vwall ? 64 : 80), deskA.h - (vwall ? 80 : 60), 22), fill: shade(th.woodTop, -0.05), opacity: 0.55}),
    h('path', {d: roundRectPath(deskB.x + (vwall ? 30 : 40), deskB.y + (vwall ? 40 : 30), deskB.w - (vwall ? 64 : 80), deskB.h - (vwall ? 80 : 60), 22), fill: shade(tintB, -0.06), opacity: 0.4}),
  );
  const wallNode = partition(ctx, {prefix: P, vwall, W, H, at: G.wall.at, t: G.wall.t, open: G.wall.open});

  // ---- props
  const outTray = letterTray(ctx, {name: `${P}-outtray`, front: G.trayFront.out, kind: 'out', label: o.labels.outTray, plate: th.accent3Soft});
  const inTray = letterTray(ctx, {name: `${P}-intray`, front: G.trayFront.in, kind: 'in', label: o.labels.inTray, plate: th.accent2Soft});
  const folder = recordFolder(ctx, {name: `${P}-folder`, label: o.labels.folder});
  const env = noticeEnvelope(ctx, {
    prefix: `${P}-env`, docId: o.doc.docId, title: o.doc.title, clause: (o.doc.clauses || [])[0],
    redactFirst: (o.doc.redactions || []).includes(0), addressee: recipient.name, toLabel: t.to, showText,
  });
  const card = ackCard(ctx, {
    prefix: `${P}-card`, title: o.labels.card, docRef: o.doc.docId, addressee: recipient.name, signer: recipient.name, sigName: o.sigName,
    labels: {doc: t.doc, to: t.to, receivedBy: t.receivedBy}, stampWord: o.labels.stamp, date: o.date, showText, alt: o.alt,
  });
  const penProp = pen(ctx, {name: `${P}-pen`, length: 190, body: th.accent2});
  const penDir = {x: Math.cos(rad(G.penAngle)), y: Math.sin(rad(G.penAngle))};
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: 84, color: th.accent});

  // ---- arms
  const lookA = actorLook(ctx, sender, 0);
  const lookB = actorLook(ctx, recipient, 1);
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...G.arm});
  const armB1 = topArm(ctx, {name: `${P}-armB1`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...G.arm});
  const armB2 = topArm(ctx, {name: `${P}-armB2`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...G.arm});

  // ---- actor chips (inside the stage, at the edge each actor sits behind)
  const chipSize = o.chipSize ?? (axis === 'horizontal' ? 30 : 32);
  const cap = p => (p.role ? `${p.name} · ${p.role}` : p.name);
  // a long name/role steps down in size and up to four lines before anything is cut, at a
  // size where every word fits whole (no split words, no ellipsis)
  // and never taller than the room above / below it (`maxH`, so it does not cover a prop)
  const chipFit = (text, c) => {
    for (const k of [1, 0.9, 0.8, 0.72, 0.64, 0.56]) {
      for (const lines of [3, 4]) {
        const size = wordSafeSize(ctx, text, c.w, chipSize * k, chipSize * k * 0.85);
        const pr = chip(ctx, text, {x: 0, y: 0, maxWidth: c.w, size, minSize: size * 0.9, maxLines: lines});
        if (!pr.fit.truncated && pr.box.h <= c.maxH) return {size, minSize: size * 0.9, maxLines: lines};
      }
    }
    const size = wordSafeSize(ctx, text, c.w, chipSize * 0.56, chipSize * 0.45);
    return {size, minSize: size * 0.9, maxLines: 5};
  };
  // chip A grows upwards from the bottom edge, chip B downwards from the top edge
  const chipA = o.chips !== false && ctx.show('key') ? bottomChip(ctx, cap(sender), {...G.chipA, maxWidth: G.chipA.w, ...chipFit(cap(sender), G.chipA), name: `${P}-chipA`}) : null;
  const chipB = o.chips !== false && ctx.show('key') ? chip(ctx, cap(recipient), {...G.chipB, maxWidth: G.chipB.w, ...chipFit(cap(recipient), G.chipB), name: `${P}-chipB`}) : null;

  const trayAt = q => T(q.x, q.y);
  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      surfaces,
      wallNode,
      g({transform: trayAt(G.outTray)}, outTray),
      g({transform: trayAt(G.inTray)}, inTray),
      g({transform: trayAt(G.folder)}, folder),
      env.node,
      card.node,
      penProp.node,
      stampNode,
      armA.arm, armA.palm, armA.thumb,
      armB2.arm, armB2.palm, armB2.thumb,
      armB1.arm, armB1.palm, armB1.thumb,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  const envOut = {...G.envOut, k: 1};
  const envIn = {...G.envIn, k: 1};
  const envHand = {...G.envHand, k: 1};
  const slotOut = composePose(envOut, G.cardLocal);
  const slotIn = composePose(envIn, G.cardLocal);
  const cardHand = {...G.cardHand, k: 1};
  const cardFolder = {...G.cardFolder, k: 1};
  const lift = 0.05;
  const liftedK = ctx.reduced ? 1 : 1 + lift;
  const envHandLifted = {...envHand, k: liftedK};
  const cardHandLifted = {...cardHand, k: liftedK};
  const penGrip = tp => ({x: tp.x + penDir.x * penProp.grip, y: tp.y + penDir.y * penProp.grip});
  const sigStartLocal = card.sig.tipAt(0), sigEndLocal = card.sig.tipAt(1);
  const mixPose = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), rot: lerp(a.rot || 0, b.rot || 0, k), k: 1});

  /**
   * Pose the stage from action values (each in [0,1]).
   * Sender A: fetch/attach/backA (card from folder onto the envelope, contrast
   * only), reachA, carryA, retreatA, settleA (no card comes back), reachA2,
   * cardIn, retreatA2.
   * Recipient B1: reachB, carryB, releaseB (no record), toStamp, stampGo,
   * stampBack, settleB (card kept), toCard, cardOut, retreatB.
   * Recipient B2 (pen): penTo, write, penBack.
   * @param {Record<string, number>} s
   */
  function pose(s) {
    const v = k => s[k] ?? 0;
    const nodes = {};
    const reduced = ctx.reduced;
    const liftK = q => (reduced ? 1 : 1 + lift * q);

    // ---------------- envelope
    let envPose, envHolder, envLift = 0;
    if (v('carryB') > 0) {
      const k = ez(v('carryB'));
      envPose = mixPose(envHand, envIn, k);
      envLift = 1 - ease.inOutSine(seg(v('carryB'), 0.7, 1));
      envHolder = v('carryB') >= 1 ? 'in-tray' : 'B';
    } else if (v('carryA') > 0) {
      const k = ez(v('carryA'));
      envPose = mixPose(envOut, envHand, k);
      envLift = ease.inOutSine(seg(v('carryA'), 0, 0.25));
      envHolder = v('reachB') >= 1 && v('carryA') >= 1 ? 'A+B' : 'A';
    } else {
      envPose = {...envOut};
      envHolder = 'out-tray';
    }
    envPose.k = liftK(envLift);
    nodes[`${P}-env`] = {transform: T(envPose.x, envPose.y, envPose.rot, envPose.k)};
    nodes[`${P}-env-shadow`] = {transform: `translate(${r(envLift * 8)} ${r(envLift * 12)})`};

    // ---------------- acknowledgment card
    const cardAttached = o.cardStart === 'folder' ? v('attach') >= 1 : true;
    let cardPose, cardHolder, cardLift = 0;
    if (v('cardIn') > 0) {
      const k = ez(v('cardIn'));
      cardPose = mixPose(cardHand, cardFolder, k);
      cardLift = 1 - ease.inOutSine(seg(v('cardIn'), 0.7, 1));
      cardHolder = v('cardIn') >= 1 ? 'folder' : 'A';
    } else if (v('cardOut') > 0) {
      const k = ez(v('cardOut'));
      cardPose = mixPose(slotIn, cardHand, k);
      cardLift = ease.inOutSine(seg(v('cardOut'), 0, 0.25));
      cardHolder = v('cardOut') >= 1 && v('reachA2') >= 1 ? 'A+B' : 'B';
    } else if (o.cardStart === 'folder' && !cardAttached) {
      if (v('attach') > 0) {
        const k = ez(v('attach'));
        cardPose = mixPose(cardFolder, slotOut, k);
        cardLift = Math.sin(Math.PI * v('attach'));
        cardHolder = 'A';
      } else {
        cardPose = {...cardFolder};
        cardHolder = 'folder';
      }
    } else {
      cardPose = composePose(envPose, G.cardLocal);
      cardHolder = 'envelope';
    }
    const cardK = cardHolder === 'envelope' ? envPose.k : liftK(cardLift);
    nodes[`${P}-card`] = {transform: T(cardPose.x, cardPose.y, cardPose.rot, cardK)};
    nodes[`${P}-card-shadow`] = {transform: `translate(${r(cardLift * 6)} ${r(cardLift * 9)})`};
    const cardW = local => atPose({...cardPose, k: cardK}, local);

    // ---------------- sender A
    const gripEnvA = q => atPose(q, G.gripA);
    const gripCardA = q => atPose(q, G.cardGripA);
    let handA;
    if (v('retreatA2') > 0) handA = mix(gripCardA(cardFolder), G.restA, ez(v('retreatA2')));
    else if (v('cardIn') > 0) handA = gripCardA({...cardPose, k: cardK});
    else if (v('reachA2') > 0) handA = mix(G.waitA, gripCardA(cardHandLifted), ez(v('reachA2')));
    else if (v('settleA') > 0) handA = mix(G.waitA, G.restA, ez(v('settleA')));
    else if (v('retreatA') > 0) handA = mix(gripEnvA(envHandLifted), G.waitA, ez(v('retreatA')));
    else if (v('carryA') > 0) handA = gripEnvA(envPose);
    else if (v('reachA') > 0) handA = mix(G.restA, gripEnvA(envOut), ez(v('reachA')));
    else if (v('backA') > 0) handA = mix(gripCardA(slotOut), G.restA, ez(v('backA')));
    else if (v('attach') > 0) handA = gripCardA({...cardPose, k: cardK});
    else if (v('fetch') > 0) handA = mix(G.restA, gripCardA(cardFolder), ez(v('fetch')));
    else handA = G.restA;
    const solvedA = armA.pose(G.shoulderA, handA, G.bend.A);
    Object.assign(nodes, solvedA.nodes);

    // ---------------- recipient B1 (receives, stamps, returns the card)
    const gripEnvB = q => atPose(q, G.gripB);
    const gripCardB = q => atPose(q, G.cardGripB);
    const dateSpotIn = atPose(slotIn, card.dateSpot);
    let handB1;
    let stampPos = G.stampRest;
    let press = 0;
    let stampHeld = false;
    if (v('retreatB') > 0) handB1 = mix(gripCardB(cardHandLifted), G.restB1, ez(v('retreatB')));
    else if (v('cardOut') > 0) handB1 = gripCardB({...cardPose, k: cardK});
    else if (v('toCard') > 0) handB1 = mix(G.stampRest, gripCardB(slotIn), ez(v('toCard')));
    else if (v('settleB') > 0) handB1 = mix(G.stampRest, G.restB1, ez(v('settleB')));
    else if (v('stampBack') > 0) {
      handB1 = mix(dateSpotIn, G.stampRest, ez(v('stampBack')));
      stampHeld = v('stampBack') < 1;
    } else if (v('stampGo') > 0) {
      const go = seg(v('stampGo'), 0, 0.62), down = seg(v('stampGo'), 0.62, 0.82), up = seg(v('stampGo'), 0.82, 1);
      handB1 = mix(G.stampRest, dateSpotIn, ez(go));
      press = down > 0 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
      stampHeld = true;
    } else if (v('toStamp') > 0) handB1 = mix(gripEnvB(envIn), G.stampRest, ez(v('toStamp')));
    else if (v('releaseB') > 0) handB1 = mix(gripEnvB(envIn), G.restB1, ez(v('releaseB')));
    else if (v('carryB') > 0) handB1 = gripEnvB(envPose);
    else if (v('reachB') > 0) handB1 = mix(G.restB1, gripEnvB(envHandLifted), ez(v('reachB')));
    else handB1 = G.restB1;
    const solvedB1 = armB1.pose(G.shoulderB1, handB1, G.bend.B1);
    Object.assign(nodes, solvedB1.nodes);
    if (stampHeld) stampPos = solvedB1.hand;
    const stampCarried = stampHeld ? 1 - press : 0;
    nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, reduced ? 1 - 0.06 * press : (1 + 0.08 * stampCarried) * (1 - 0.06 * press))};
    nodes[`${P}-stamp-shadow`] = {opacity: r(1 - press * 0.85, 3)};
    const stamped = v('stampGo') >= 0.8 || v('stampBack') > 0 || v('toCard') > 0 || v('cardOut') > 0 || v('cardIn') > 0;
    nodes[`${P}-card-impr`] = {opacity: stamped ? 0.92 : 0};

    // ---------------- recipient B2 (pen)
    const restTip = G.penRest;
    const sigStart = cardW(sigStartLocal), sigEnd = cardW(sigEndLocal);
    let tip;
    const writing = v('write') > 0 && v('write') < 1;
    if (v('penBack') > 0) tip = mix(sigEnd, restTip, ez(v('penBack')));
    else if (v('write') > 0) tip = cardW(card.sig.tipAt(ease.inOutSine(v('write'))));
    else tip = mix(restTip, sigStart, ez(v('penTo')));
    // lifted while travelling to / from the line, touching at both ends of the stroke
    const hover = v('penBack') > 0 ? Math.sin(Math.PI * v('penBack')) : v('write') > 0 ? 0 : Math.sin(Math.PI * v('penTo'));
    const handB2 = penGrip({x: tip.x - hover * 6, y: tip.y - hover * 14});
    const solvedB2 = armB2.pose(G.shoulderB2, handB2, G.bend.B2);
    Object.assign(nodes, solvedB2.nodes);
    const penTip = {x: solvedB2.hand.x - penDir.x * penProp.grip, y: solvedB2.hand.y - penDir.y * penProp.grip};
    nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, G.penAngle)};
    Object.assign(nodes, card.sig.frame(ease.inOutSine(clamp(v('write')))));

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        envelope: P2(envPose),
        envelopeHolder: envHolder,
        card: P2(cardPose),
        cardHolder,
        handA: P2(solvedA.hand),
        handB1: P2(solvedB1.hand),
        handB2: P2(solvedB2.hand),
        envGripA: P2(gripEnvA(envPose)),
        envGripB: P2(gripEnvB(envPose)),
        cardGripA: P2(gripCardA({...cardPose, k: cardK})),
        cardGripB: P2(gripCardB({...cardPose, k: cardK})),
        penTip: P2(penTip),
        strokePoint: P2(cardW(card.sig.tipAt(ease.inOutSine(clamp(v('write')))))),
        penTouching: writing,
        signature: r(clamp(v('write')), 3),
        stampTool: P2(stampPos),
        stampSpot: P2(dateSpotIn),
        stampPressed: press > 0.5,
        stamped,
        cardFiled: v('cardIn') >= 1,
        reach: {A: solvedA.reached, B1: solvedB1.reached, B2: solvedB2.reached},
        allReached: solvedA.reached && solvedB1.reached && solvedB2.reached,
      },
    };
  }

  /**
   * Boxes (stage units) that annotations must keep clear of for a solved pose:
   * the three arms (sampled along the upper arm and forearm) and hands, the
   * trays, folder, stamp, pen, the wall band and the actor chips.
   * @param {{nodes:Record<string, any>, semantic:any}} posed  result of `pose()`
   */
  function obstacles(posed) {
    const out = [];
    const halfArm = G.arm.width / 2 + 6;
    for (const k of ['A', 'B1', 'B2']) {
      for (const part of ['upper', 'lower']) {
        const q = posed.nodes[`${P}-arm${k}-${part}`];
        const L = Math.hypot(q.x2 - q.x1, q.y2 - q.y1);
        const n = Math.max(2, Math.ceil(L / 30));
        for (let i = 0; i <= n; i++) {
          const x = q.x1 + (q.x2 - q.x1) * (i / n), y = q.y1 + (q.y2 - q.y1) * (i / n);
          if (x > -halfArm && y > -halfArm && x < W + halfArm && y < H + halfArm) out.push({x: x - halfArm, y: y - halfArm, w: halfArm * 2, h: halfArm * 2});
        }
      }
      const hd = posed.semantic[`hand${k}`];
      out.push({x: hd.x - 52, y: hd.y - 52, w: 104, h: 104});
    }
    const rect = (c, w, hh, pad = 0) => ({x: c.x - w / 2 - pad, y: c.y - hh / 2 - pad, w: w + pad * 2, h: hh + pad * 2});
    out.push(rect(G.outTray, TRAY.w, TRAY.h, 4), rect(G.inTray, TRAY.w, TRAY.h, 4), rect(G.folder, FOLDER.w, FOLDER.h + 30, 4));
    const sp = posed.semantic.stampTool;
    out.push(rect(sp, 104, 90, 6));
    const tip = posed.semantic.penTip;
    for (let i = 0; i <= 6; i++) {
      const x = tip.x + penDir.x * penProp.grip * 2.8 * (i / 6), y = tip.y + penDir.y * penProp.grip * 2.8 * (i / 6);
      out.push({x: x - 16, y: y - 16, w: 32, h: 32});
    }
    const wb = vwall ? {x: wallA - 20, y: 0, w: wallB - wallA + 40, h: H} : {x: 0, y: wallA - 20, w: W, h: wallB - wallA + 40};
    out.push(wb);
    if (chipA) out.push(chipA.box);
    if (chipB) out.push(chipB.box);
    return out;
  }

  return {
    node, pose, obstacles, W, H, axis, G, card, env,
    chipBoxes: {A: chipA ? chipA.box : null, B: chipB ? chipB.box : null},
    /** stage coordinates of a card-local point with the card at rest in the folder / on the envelope in the IN tray */
    cardPoint: (where, local) => atPose(where === 'folder' ? cardFolder : where === 'out' ? slotOut : slotIn, local),
    envPoint: (where, local) => atPose(where === 'out' ? envOut : envIn, local),
    folderCenter: G.folder, outTray: G.outTray, inTray: G.inTray,
    wall: {vwall, a: wallA, b: wallB, open: G.wall.open},
    deskA, deskB,
    cardFolder, slotIn, slotOut,
  };
}

/**
 * Wall between the offices (floor-plan hatching) with a service hatch: a
 * counter sill wider than the wall, bounded by two jamb posts.
 */
function partition(ctx, {prefix, vwall, W, H, at, t, open}) {
  const th = ctx.theme;
  const wallC = '#8f887c';
  const a = at - t / 2;
  const patId = `${prefix}-wall-hatch`;
  const segs = vwall
    ? [{x: a, y: -10, w: t, h: open[0] + 10}, {x: a, y: open[1], w: t, h: H - open[1] + 10}]
    : [{x: -10, y: a, w: open[0] + 10, h: t}, {x: open[1], y: a, w: W - open[1] + 10, h: t}];
  const over = 16;
  const sill = vwall ? {x: a - over, y: open[0], w: t + over * 2, h: open[1] - open[0]} : {x: open[0], y: a - over, w: open[1] - open[0], h: t + over * 2};
  const counter = shade(th.woodTop, 0.25);
  const defs = h('defs', null, h('pattern', {id: ctx.id(patId), patternUnits: 'userSpaceOnUse', width: 16, height: 16, patternTransform: 'rotate(45)'},
    h('rect', {x: 0, y: 0, width: 16, height: 16, fill: wallC}),
    h('line', {x1: 0, y1: 0, x2: 0, y2: 16, stroke: shade(wallC, -0.28), 'stroke-width': 3})));
  const hatch = [
    h('rect', {x: sill.x + 6, y: sill.y + 9, width: sill.w, height: sill.h, rx: 8, fill: th.shadow}),
    h('rect', {x: sill.x, y: sill.y, width: sill.w, height: sill.h, rx: 8, fill: counter, stroke: INK, 'stroke-width': 2.5}),
    vwall
      ? h('path', {d: `M${sill.x + 10} ${sill.y + 14}V${sill.y + sill.h - 14}M${sill.x + sill.w - 10} ${sill.y + 14}V${sill.y + sill.h - 14}`, stroke: shade(counter, -0.14), 'stroke-width': 2, 'stroke-linecap': 'round'})
      : h('path', {d: `M${sill.x + 14} ${sill.y + 10}H${sill.x + sill.w - 14}M${sill.x + 14} ${sill.y + sill.h - 10}H${sill.x + sill.w - 14}`, stroke: shade(counter, -0.14), 'stroke-width': 2, 'stroke-linecap': 'round'}),
  ];
  const walls = segs.map(q => g(null,
    h('rect', {x: q.x + 7, y: q.y + 10, width: q.w, height: q.h, fill: th.shadow}),
    h('rect', {x: q.x, y: q.y, width: q.w, height: q.h, fill: ctx.ref(patId), stroke: INK, 'stroke-width': th.stroke}),
  ));
  // jamb posts at the hatch edges
  const post = (x, y, w, hh) => h('rect', {x, y, width: w, height: hh, rx: 5, fill: shade(wallC, -0.3), stroke: INK, 'stroke-width': 2.5});
  const caps = vwall
    ? [post(a - 8, open[0] - 16, t + 16, 22), post(a - 8, open[1] - 6, t + 16, 22)]
    : [post(open[0] - 16, a - 8, 22, t + 16), post(open[1] - 6, a - 8, 22, t + 16)];
  return g(null, defs, hatch, walls, caps);
}

export {SANS};
