/**
 * LAW-0139 — Ámbito material · contrast
 *
 * Storyboard (two identical filter stations; brief beats in brackets):
 *  [0.00–0.17] base: the shared source — the fictional Text 1 open on the
 *              Level 1 shelf of its stand, with the article listing the
 *              subjects — is drawn once; under it two complete, identical
 *              filter stations ("Situation A" / "Situation B", same neutral
 *              badges): the same keyed gates and bins, the same activity card
 *              (its name printed on the card) waiting on the rail with an
 *              empty tag slot.
 *  [0.17–0.40] change: in A the supplied tag of a LISTED subject is clipped
 *              onto the card; in B the supplied tag of a subject the list does
 *              not classify. A frame closes round the whole tag chip. Only
 *              then do the headers take the supplied state titles.
 *  [0.40–0.77] parallel: the same release, the same speed. In A the gate
 *              keyed with the same mark opens and the card drops into that
 *              bin; in B no gate opens for its mark, the card runs on to the
 *              end of the rail and drops into the side bin (different path).
 *  [0.77–1.00] guide: a copy of each tag chip lifts out of its card into the
 *              comparison tray, where a guide joins the two (the changed
 *              detail); a neutral note: no winner, score or legal consequence.
 * The magnifier of the motif is not drawn here: nothing in this comparison is
 * read through it (the chips are enlarged by the tray instead).
 * @module animations/sources/LAW-0139
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {fitDesign, designSize} from '../../core/layout.js';
import {contrastFields, str, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {roundRectPath} from '../../core/geometry.js';
import {
  sourcesFields, CONTENT_EN, KIT_STRINGS, kitStrings, resolveScope, fitWords, NEUTRAL, tint,
  binArt, railArt, railGeo, keyPlate, markDisc,
} from './kits/ambito-material.js';

const ID = 'LAW-0139';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  changeChip: [0.18, 0.24], stamp: [0.22, 0.32], frame: [0.27, 0.34], headOut: [0.34, 0.37], headIn: [0.37, 0.4],
  release: 0.44, slide: [0.45, 0.62], shared: [0.55, 0.59], sharedOut: [0.74, 0.77],
  fly: [0.79, 0.87], guide: [0.86, 0.92], guideChip: [0.89, 0.93], note: [0.92, 0.97],
};

const STRINGS = {
  en: {situation: 'Situation'},
  es: {situation: 'Situación'},
};

const sceneSchema = {
  ...sourcesFields,
  activity: obj('The activity card shared by both stations (fictional); only its subject tag differs', {
    label: str('Activity label printed on the card', 40),
  }, ['label']),
  ...contrastFields(),
};
sceneSchema.scenarioA.properties.subject = str('Subject tag supplied for the card in scenario A (compared verbatim with the listed subjects)', 32);
sceneSchema.scenarioB.properties.subject = str('Subject tag supplied for the card in scenario B (compared verbatim with the listed subjects)', 32);
sceneSchema.scenarioA.required = ['label', 'subject'];
sceneSchema.scenarioB.required = ['label', 'subject'];

const defaultParams = {
  sources: CONTENT_EN.sources.slice(0, 1),
  hierarchy: {levels: ['Level 1 (user-supplied)'], placement: [0]},
  passages: [{ref: 'Text 1 · Art. 2 (fictional)', heading: 'Material scope (simulated wording)', subjects: ['Transport', 'Housing']}],
  interpretations: [],
  activity: {label: 'Street concert'},
  scenarioA: {label: 'Subject included', caption: 'The card carries a tag listed in Art. 2', subject: 'Transport'},
  scenarioB: {label: 'Subject not classified', caption: 'The card carries a tag the list does not classify', subject: 'Culture'},
  changedFact: 'Only the subject tag on the card differs',
  sharedFacts: ['Same text and article', 'Same filter keys', 'Same card and release'],
  comparisonLabels: {guide: 'Changed fact: subject tag', neutral: 'Two situations side by side — no outcome or consequence is stated'},
};

/**
 * Block arrangement per shape. `src`: where the shared source (book + article)
 * sits; the two stations are side by side on wide boxes and stacked otherwise.
 */
const ARRANGE = {
  landscape: {arrangement: 'row', src: 'top', PW: 880, PH: 380, header: 100, gap: 50, srcH: 236, tray: 'row'},
  portrait: {arrangement: 'column', src: 'top', PW: 880, PH: 380, header: 100, gap: 34, srcH: 270, tray: 'row'},
  square: {arrangement: 'column', src: 'left', PW: 880, PH: 360, header: 100, gap: 18, srcW: 400, tray: 'column'},
};

/**
 * Scenario header (same look as frameworks/paired scenarioHeader: letter badge, label, optional caption),
 * with a little more room between the label and its caption so their text boxes never touch.
 */
function scenarioHead(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  const parts = [
    h('circle', {cx: o.x + badgeR, cy: o.y + o.h * 0.42, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: o.x + badgeR, y: o.y + o.h * 0.42 + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  ];
  if (ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: o.w - badgeR * 2 - 24, size, minSize: size * 0.7, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 - f.size * 0.66, fill: th.fg}));
  }
  if (o.caption && ctx.show('all')) {
    const f2 = ctx.fit(o.caption, {maxWidth: o.w - badgeR * 2 - 24, size: size * 0.62, minSize: 16, maxLines: 1, weight: 500});
    parts.push(textBlock(f2, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 + size * 0.68, fill: th.fgSoft}));
  }
  return g({name: o.name}, parts);
}

/* ------------------------------------------------------------------ */
/* The activity card of this comparison (name on the card body)        */
/* ------------------------------------------------------------------ */

const CARD_W = 200;
const SRC_W_DENSE = 360;
const CARD_PAPER = '#fffdf8';

/** Chip geometry inside the strip of a card of width w (local origin = card centre). */
const chipRect = CL => ({x: -CL.W / 2 + 8, y: -CL.H / 2 + 7, w: CL.W - 16, h: CL.stripH - 14});
const textW = w => w - 44;

/**
 * Tag chip (mark disc + subject text) drawn in a rect; local coordinates.
 * Used on the card and, as a real copy, in the comparison tray.
 */
function tagChip(ctx, {tag, fit, x, y, w, h: hh, name, textName, showText}) {
  const th = ctx.theme;
  const blank = tag.mark === 'blank';
  const parts = [h('path', {d: roundRectPath(x, y, w, hh, Math.min(14, hh / 2)), fill: th.card, stroke: blank ? NEUTRAL : tag.color, 'stroke-width': 2.4, 'stroke-dasharray': blank ? '6 4' : null})];
  if (showText && fit) {
    const R = 12;
    parts.push(markDisc(ctx, {shape: tag.mark, color: tag.color, R, transform: T(x + 8 + R, y + hh / 2)}));
    const tx0 = x + 14 + 2 * R, tw = x + w - 6 - tx0;
    parts.push(textBlock(fit, {x: tx0 + tw / 2, y: y + (hh - fit.height) / 2, anchor: 'middle', fill: blank ? th.inkSoft : th.ink, name: textName}));
  } else {
    parts.push(markDisc(ctx, {shape: tag.mark, color: tag.color, R: Math.min(17, hh / 2 - 4), transform: T(x + w / 2, y + hh / 2)}));
  }
  return g({name}, parts);
}

/**
 * The card: a paper card with a tinted strip holding the tag chip and the
 * activity name printed below it. The blank strip and the supplied strip are
 * separate groups (the tag is clipped on at the change beat).
 */
function contrastCard(ctx, {P, CL, label, blank, tag}) {
  const th = ctx.theme;
  const {W: w, H: hh, stripH} = CL;
  const x0 = -w / 2, y0 = -hh / 2;
  const showText = ctx.show('key');
  const cr = chipRect(CL);
  const strip = (tg, fit, name, opacity) => {
    const soft = tg.mark === 'blank' ? '#f1f2f3' : tg.listedIdx >= 0 ? tint(tg.color, 0.8) : '#e6e8eb';
    return g({name, opacity},
      h('path', {d: `M${r(x0 + 1.5)} ${r(y0 + stripH)}V${r(y0 + 12)}Q${r(x0 + 1.5)} ${r(y0 + 1.5)} ${r(x0 + 12)} ${r(y0 + 1.5)}H${r(x0 + w - 12)}Q${r(x0 + w - 1.5)} ${r(y0 + 1.5)} ${r(x0 + w - 1.5)} ${r(y0 + 12)}V${r(y0 + stripH)}Z`, fill: soft}),
      tagChip(ctx, {tag: tg, fit, ...cr, showText, textName: `${name}-t`}));
  };
  const parts = [
    h('path', {d: roundRectPath(x0 + 4, y0 + 7, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 12), fill: CARD_PAPER, stroke: th.ink, 'stroke-width': 2.6}),
    strip(blank.tag, blank.fit, `${P}-card-tag`, undefined),
    strip(tag.tag, tag.fit, `${P}-card-tagB`, 0),
    h('path', {d: `M${r(x0 + 1)} ${r(y0 + stripH)}H${r(x0 + w - 1)}`, stroke: th.ink, 'stroke-width': 1.6, opacity: 0.55}),
  ];
  const labelY = y0 + stripH + 12;
  if (showText) parts.push(textBlock(label, {x: 0, y: labelY, anchor: 'middle', fill: th.ink, name: `${P}-card-label`}));
  else [0.8, 0.56].forEach((f, i) => parts.push(h('rect', {x: r(-(w - 30) * f / 2), y: r(labelY + 4 + i * 18), width: r((w - 30) * f), height: 9, rx: 4.5, fill: th.paperLine})));
  return {
    node: g({name: `${P}-card`}, parts),
    texts: showText ? {tag: blank.fit ? `${P}-card-tag-t` : null, tagB: tag.fit ? `${P}-card-tagB-t` : null, label: `${P}-card-label`} : null,
    labelBox: {x: -label.width / 2, y: labelY, w: label.width, h: label.height},
    chip: cr,
  };
}

/** Frame round the whole chip (card-local), riding the card. */
function chipFrame(ctx, {name, CL, dashed}) {
  const c = chipRect(CL);
  const pad = 4.5;
  return {
    node: h('path', {name, d: roundRectPath(c.x - pad, c.y - pad, c.w + pad * 2, c.h + pad * 2, Math.min(17, c.h / 2 + pad)), fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 4, 'stroke-dasharray': dashed ? '9 6' : null, opacity: 0}),
    box: {x: c.x - pad - 2, y: c.y - pad - 2, w: c.w + pad * 2 + 4, h: c.h + pad * 2 + 4},
  };
}

/* ------------------------------------------------------------------ */
/* Shared source (drawn once): stand with the open book + the article  */
/* ------------------------------------------------------------------ */

function sourceBlock(ctx, {p, S, w, KF, CF, dir}) {
  // The shared source, drawn by this entry so that its text is sized to the card text and never shrinks:
  // the article's reference, heading and subject rows (the filter keys) at KF — the card text size — and
  // the supplied context (book title and note, hierarchy level) at CF. Every text wraps; the book, the
  // rack and the slip grow to hold it (nothing is cut, nothing leaves its page).
  const th = ctx.theme;
  const showKey = ctx.show('key');
  const fitT = (text, width, size, weight = 700, lines = 6, family = 'sans') => fitWords(ctx, text, {maxWidth: width, size, minSize: size, maxLines: lines, weight, family});
  const parts = [];
  /* --- rack (editable hierarchy: one shelf, its level plate) with the closed book standing on it */
  const rackW = dir === 'row' ? Math.min(460, Math.max(330, w * 0.4)) : w;
  const bookW = rackW - 56;
  const labW = bookW - 58;
  const title = showKey ? fitT(p.sources[0].title, labW - 20, CF, 700, 6, 'serif') : null;
  const note = showKey && p.sources[0].note && ctx.show('all') ? fitT(p.sources[0].note, labW - 20, CF, 500, 4) : null;
  const labH = (title ? title.height : 44) + (note ? note.height + 12 : 0) + 28;
  const bookH = labH + 64;
  const bx = 28, by = 16;
  const shelfY = by + bookH + 4;
  const level = p.hierarchy.levels[0];
  const lev = showKey && level !== undefined ? fitT(level, rackW - 86, CF, 700, 4) : null;
  const plateW = lev ? lev.width + 46 : 130, plateH = lev ? lev.height + 16 : 30;
  const plateY = shelfY + 10;
  const rackH = plateY + plateH + 12;
  parts.push(h('path', {d: roundRectPath(6, 8, rackW, rackH, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, rackW, rackH, 10), fill: '#e9dcc4', stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('path', {d: roundRectPath(12, 10, rackW - 24, shelfY - 10, 6), fill: '#e1d2b6', opacity: 0.8}));
  // the book: cover facing, spine band, cover label holding the title and the note
  const COVER = '#2f4a6b';
  parts.push(h('path', {d: roundRectPath(bx + 6, by + 8, bookW, bookH, 8), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(bx, by, bookW, bookH, 8), fill: COVER, stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('rect', {x: bx, y: by, width: 18, height: bookH, rx: 6, fill: shade(COVER, -0.25)}));
  const lx = bx + 32, ly = by + 16;
  parts.push(h('path', {d: roundRectPath(lx, ly, labW, labH, 6), fill: '#f4ecd8', stroke: shade(COVER, -0.35), 'stroke-width': 1.6}));
  if (title) parts.push(textBlock(title, {x: lx + 10, y: ly + 14, fill: th.ink}));
  else parts.push(h('rect', {x: lx + 12, y: ly + 16, width: labW - 40, height: 14, rx: 6, fill: th.ink, opacity: 0.6}));
  if (note) parts.push(textBlock(note, {x: lx + 10, y: ly + 14 + title.height + 12, fill: th.inkSoft, italic: true}));
  parts.push(h('path', {d: `M${lx + 8} ${r(by + bookH - 26)}H${bx + bookW - 14}M${lx + 8} ${r(by + bookH - 16)}H${bx + bookW - 24}`, stroke: '#e6c77a', 'stroke-width': 3, 'stroke-linecap': 'round'}));
  // shelf plank and the level plate on its front
  parts.push(h('path', {d: roundRectPath(-6, shelfY, rackW + 12, 30, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}));
  const px0 = rackW / 2 - plateW / 2;
  parts.push(h('path', {d: roundRectPath(px0, plateY, plateW, plateH, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
  parts.push(h('circle', {cx: px0 + 11, cy: plateY + plateH / 2, r: 3.2, fill: '#6c4f1a'}), h('circle', {cx: px0 + plateW - 11, cy: plateY + plateH / 2, r: 3.2, fill: '#6c4f1a'}));
  if (lev) parts.push(textBlock(lev, {x: rackW / 2, y: plateY + 8, anchor: 'middle', fill: '#3d2c0c'}));
  else parts.push(h('circle', {cx: rackW / 2, cy: plateY + plateH / 2, r: 4.5, fill: '#6c4f1a'}));
  /* --- the article slip: reference, heading, one keyed row per listed subject */
  const artW = dir === 'row' ? Math.min(620, Math.max(360, w - rackW - 30)) : w;
  const pad = 18;
  const ref = showKey ? fitT(S.passage.ref, artW - pad * 2, KF, 700, 4) : null;
  const heading = showKey ? fitT(S.passage.heading, artW - pad * 2, KF, 600, 4, 'serif') : null;
  const R = Math.max(14, KF * 0.62);
  const rows = S.listed.map(ls => (showKey ? fitT(ls.name, artW - pad * 2 - R * 2 - 16, KF, 700, 4) : null));
  const headH = (ref ? ref.height : 16) + 22;
  let y = headH + 12;
  const headingY = y;
  y += (heading ? heading.height : 16) + 12;
  const ruleY = y;
  y += 8;
  const rowY = rows.map(f => { const rh = Math.max(R * 2 + 12, (f ? f.height : 16) + 16); const y0 = y; y += rh; return {y0, rh}; });
  const artH = y + 10;
  const tab = {w: 104, h: 30};
  const ax = dir === 'row' ? rackW + 30 : 0, ay = (dir === 'row' ? 0 : rackH + 20) + tab.h;
  const ap = [];
  const head = th.accent2Soft;
  ap.push(h('path', {d: roundRectPath(6, 9, artW, artH, 12), fill: th.shadow}));
  ap.push(h('path', {d: `M22 2V${-tab.h + 10}Q22 ${-tab.h} 32 ${-tab.h}H${22 + tab.w - 10}Q${22 + tab.w} ${-tab.h} ${22 + tab.w} ${-tab.h + 10}V2Z`, fill: head, stroke: th.ink, 'stroke-width': 2.2}));
  ap.push(h('path', {d: roundRectPath(0, 0, artW, artH, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}));
  ap.push(h('path', {d: `M1.2 ${headH}V12Q1.2 1.2 12 1.2H${artW - 12}Q${artW - 1.2} 1.2 ${artW - 1.2} 12V${headH}Z`, fill: head}));
  ap.push(h('path', {d: `M0 ${headH}H${artW}`, stroke: th.ink, 'stroke-width': 1.6}));
  if (ref) ap.push(textBlock(ref, {x: pad, y: 11, fill: th.ink}));
  else ap.push(h('rect', {x: pad, y: headH / 2 - 6, width: artW * 0.5, height: 12, rx: 6, fill: shade(head, -0.3)}));
  if (heading) ap.push(textBlock(heading, {x: pad, y: headingY, fill: th.inkSoft, italic: true}));
  else ap.push(h('rect', {x: pad, y: headingY + 2, width: artW * 0.6, height: 11, rx: 5, fill: th.paperLine}));
  ap.push(h('path', {d: `M${pad} ${r(ruleY)}H${artW - pad}`, stroke: th.paperLine, 'stroke-width': 2}));
  S.listed.forEach((ls, j) => {
    const {y0, rh} = rowY[j];
    if (j) ap.push(h('path', {d: `M${pad + R * 2 + 10} ${r(y0)}H${artW - pad}`, stroke: th.paperLine, 'stroke-width': 1.2, 'stroke-dasharray': '3 5'}));
    ap.push(markDisc(ctx, {shape: ls.mark, color: ls.color, R, transform: T(pad + R, y0 + rh / 2)}));
    if (rows[j]) ap.push(textBlock(rows[j], {x: pad + R * 2 + 14, y: y0 + (rh - rows[j].height) / 2, fill: th.ink}));
    else ap.push(h('rect', {x: pad + R * 2 + 14, y: y0 + rh / 2 - 6, width: (artW - 120) * (0.7 - j * 0.1), height: 12, rx: 6, fill: th.paperLine}));
  });
  const node = g({name: 'src'}, parts, g({transform: T(ax, ay)}, ap));
  const used = dir === 'row' ? ax + artW : w;
  const hTot = dir === 'row' ? Math.max(rackH, ay + artH) : ay + artH;
  // text boxes (block-local, before the block offset): the book note must stay on the cover label
  const noteBox = note ? {x: lx + 10, y: ly + 14 + title.height + 12, w: note.width, h: note.height} : null;
  const labelBox = {x: lx, y: ly, w: labW, h: labH};
  return {node, used, h: hTot, rackBox: {x: 0, y: 0, w: rackW, h: rackH}, artBox: {x: ax, y: ay - tab.h, w: artW, h: artH + tab.h}, noteBox, labelBox,
    fits: {title, note, lev, ref, heading, rows}};
}

/* ------------------------------------------------------------------ */
/* One filter station (rail band), local 0..PW × 0..PH                 */
/* ------------------------------------------------------------------ */

/** Card scale allowed by the station width: start zone + one pitch per gate + side bin. */
const stationScale = (PW, nG, cardW) => Math.min(1, (PW - 12 - 12 - 22 * nG - 22 - 6) / ((nG + 2) * cardW));

function station(ctx, o) {
  const th = ctx.theme;
  const {P, PW, PH, S, CL, fits, cardTag} = o;
  const showKey = ctx.show('key');
  const nG = S.listed.length;
  const m = 6;
  // widths follow the card: start zone, one pitch per gate, side bin; the
  // station height (chosen by the layout) normally leaves the width as the limit
  const sW = stationScale(PW, nG, CL.W);
  const namesFor = sc => S.listed.map(ls => (showKey ? fitWords(ctx, ls.name, {maxWidth: CL.W * sc + 18 - 8 - 56, size: o.plateSize, minSize: o.plateSize, maxLines: 5, weight: 700}) : null));
  const plateH = fits => Math.max(50, ...fits.filter(Boolean).map(f => f.height + 14));
  const s = Math.min(sW, (PH - 84 - plateH(namesFor(sW))) / (2 * CL.H));
  const cw = CL.W * s, chh = CL.H * s;
  const startW = cw + 12, pitch = cw + 22, sideW = cw + 22;
  const railX0 = m, railX1 = PW - m - sideW - 6;
  const railY0 = m + chh + 2;
  const RG = railGeo({x: railX0, y: railY0}, {x: railX1, y: railY0 + 16});
  const gates = S.listed.map((_, j) => ({j, cx: railX0 + startW + pitch * (j + 0.5), w: pitch - 8}));
  const rail = railArt(ctx, {prefix: `${P}-rail`, geo: RG, gates});
  const bw = cw + 18;
  const nameFits = namesFor(s);
  const pH = plateH(nameFits);
  const plates = gates.map((gt, j) => keyPlate(ctx, {name: `${P}-plate${j}`, x: gt.cx - bw / 2 + 4, y: RG.y(gt.cx) + 30, w: bw - 8, h: pH, fit: nameFits[j], color: S.listed[j].color}));
  // the keys already sit in their sockets (the filter is set in both stations)
  const keys = S.listed.map((ls, j) => markDisc(ctx, {shape: ls.mark, color: ls.color, R: 16, transform: T(plates[j].socket.x, plates[j].socket.y)}));
  const binBottom = PH - 10;
  const bins = gates.map((gt, j) => {
    const top = RG.y(gt.cx) + 40;
    return binArt(ctx, {prefix: `${P}-bin${j}`, x: gt.cx - bw / 2, y: top, w: bw, h: binBottom - top});
  });
  const sideTop = RG.y(railX1) + 58;
  const side = binArt(ctx, {prefix: `${P}-side`, x: PW - m - sideW, y: sideTop, w: sideW, h: binBottom - sideTop, side: true});
  // the card: blank slot at first, the supplied tag is clipped on at the change beat
  const card = contrastCard(ctx, {P, CL, label: fits.label, blank: {tag: fits.blankTag, fit: fits.blank}, tag: {tag: cardTag, fit: fits.tag}});
  const frame = chipFrame(ctx, {name: `${P}-frame`, CL, dashed: cardTag.listedIdx < 0});
  const aRad = Math.atan(RG.slope);
  const onRail = x => ({x: x + Math.sin(aRad) * chh / 2, y: RG.y(x) - Math.cos(aRad) * chh / 2, rot: RG.angle});
  const container = cardTag.listedIdx >= 0 ? cardTag.listedIdx : 'side';
  const box = container === 'side' ? side.box : bins[container].box;
  const rest = {x: box.x + box.w / 2, y: box.y + box.h - 12 - chh / 2, rot: -1};
  const startX = railX0 + 10 + cw / 2;
  const targetX = container === 'side' ? railX1 + 12 : gates[container].cx;
  const maxDist = railX1 + 12 - startX;
  const reach = Math.abs(targetX - startX) / Math.max(1, maxDist);
  const node = g({name: P},
    bins.map(b => b.back), side.back,
    rail.leaves, rail.stat,
    g({name: `${P}-cards`}, card.node),
    bins.map(b => b.front), side.front,
    // the frame round the chip reads in front of the bin glass, behind the key plates
    frame.node,
    plates.map(q => q.node), keys,
  );
  function pose(v) {
    const nodes = {};
    // tag clipped on: the empty slot lifts out, the supplied tag drops in (no double exposure)
    const sw = clamp(v.stamp);
    const out = clamp(sw * 2), inn = clamp(sw * 2 - 1);
    nodes[`${P}-card-tag`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
    nodes[`${P}-card-tagB`] = {opacity: r(inn, 3), transform: `translate(0 ${r(-26 * (1 - inn))})`};
    let ps, holder, gate = 0;
    // one common motion along the rail for both stations: the card stops where its path ends
    const tt = clamp(ease.inOutSine(v.slide) / Math.max(1e-6, reach));
    if (tt >= 1 && v.fall > 0) {
      const f = v.fall;
      const from = onRail(targetX);
      if (container === 'side') {
        const tip = Math.sin(clamp(f * 1.4) * Math.PI / 2);
        ps = {x: lerp(from.x, rest.x, ease.outQuad(f)), y: lerp(from.y, rest.y, f * f), rot: lerp(from.rot, rest.rot, f) + 26 * tip * (1 - f)};
      } else {
        ps = {x: lerp(from.x, rest.x, f), y: lerp(from.y, rest.y, f * f), rot: lerp(from.rot, rest.rot, f)};
        gate = 1;
      }
      holder = f >= 1 ? (container === 'side' ? 'side' : `bin${container}`) : 'falling';
    } else {
      ps = onRail(startX + (targetX - startX) * tt);
      holder = v.slide > 0 ? 'rail' : 'start';
      if (container !== 'side') gate = seg(tt, 0.86, 1);
    }
    const close = container !== 'side' && v.fall >= 1 ? seg(v.after, 0, 1) : 0;
    gates.forEach((gt, j) => {
      const op = container !== 'side' && j === container ? ease.inOutSine(clamp(gate * (1 - close))) : 0;
      nodes[`${P}-rail-g${j}-L`] = {transform: T(gt.cx - gt.w / 2, RG.y(gt.cx - gt.w / 2), RG.angle + op * 80)};
      nodes[`${P}-rail-g${j}-R`] = {transform: T(gt.cx + gt.w / 2, RG.y(gt.cx + gt.w / 2), RG.angle - op * 80)};
    });
    const cardT = T(ps.x, ps.y, ps.rot, s);
    nodes[`${P}-card`] = {transform: cardT};
    // the frame round the chip closes in (from slightly larger) and then rides the card
    const fr = clamp(v.frame);
    nodes[`${P}-frame`] = {transform: `${cardT} scale(${r(1 + 0.12 * (1 - ease.outCubic(fr)), 4)})`, opacity: r(fr, 3)};
    S.listed.forEach((_, j) => { nodes[`${P}-plate${j}-name`] = {opacity: 1}; });
    // the card's texts hide only while they pass behind the (opaque) key plate
    const tx = card.texts;
    if (tx) {
      const top = ps.y - chh / 2, stripB = top + CL.stripH * s, labB = ps.y + chh / 2;
      let hideStrip = false, hideLabel = false;
      if (holder === 'falling' && container !== 'side') {
        const pb = plates[container].box;
        hideStrip = stripB > pb.y && top < pb.y + pb.h;
        hideLabel = labB > pb.y && stripB < pb.y + pb.h;
      }
      if (tx.tag) nodes[tx.tag] = {opacity: hideStrip ? 0 : 1};
      if (tx.tagB) nodes[tx.tagB] = {opacity: hideStrip ? 0 : 1};
      nodes[tx.label] = {opacity: hideLabel ? 0 : 1};
    }
    return {nodes, card: ps, holder, gateOpen: container !== 'side' && gate * (1 - close) > 0.001 && holder !== 'start'};
  }
  const pt = (ps, q) => {
    const a = (ps.rot * Math.PI) / 180;
    return {x: ps.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * s, y: ps.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * s};
  };
  const chipC = {x: card.chip.x + card.chip.w / 2, y: card.chip.y + card.chip.h / 2};
  return {
    node, pose, rest, container, card, frame, s, chh, cw, plates, bins, side, RG, startX, targetX, reach, nameFits,
    arriveAt: Math.acos(1 - 2 * Math.min(1, reach)) / Math.PI,
    pt, chipC, restChip: pt(rest, chipC),
    boxes: [...plates.map(q => q.box), ...bins.map(b => b.box), side.box],
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * Text-dense variant of a station without a waiting lane (used only where the rail station cannot keep
 * the card text at ~16 px, e.g. long labels on a square box): one row of glass compartments under the
 * keyed plates, with a track along their floor. The card waits in a holder at the left end of the track,
 * slides along it through the compartments, and the stop pin keyed with the same mark as its tag rises
 * and catches it in that compartment. A tag that matches no key runs on to the end compartment ("not
 * classified"). Same objects, same keys, same card; only the height of the lane is saved.
 */
function trackStation(ctx, o) {
  const th = ctx.theme;
  const {P, PW, S, CL, fits, cardTag} = o;
  const showKey = ctx.show('key');
  const nG = S.listed.length;
  const m = 6;
  const s = Math.min(1, (PW - 2 * m - 12 - 22 * (nG + 1) - 6) / ((nG + 2) * CL.W));
  const cw = CL.W * s, chh = CL.H * s;
  const startW = cw + 12, cellW = cw + 22;
  const bw = cellW - 4;
  const nameFits = S.listed.map(ls => (showKey ? fitWords(ctx, ls.name, {maxWidth: bw - 8 - 56, size: o.plateSize, minSize: o.plateSize, maxLines: 5, weight: 700}) : null));
  const pH = Math.max(50, ...nameFits.filter(Boolean).map(f => f.height + 14));
  const rowTop = pH + 14, rowH = chh + 34;
  const floorY = rowTop + rowH - 12;
  const PH = floorY + 26;
  const x0 = m, xStartEnd = m + startW + 6;
  const cellX = j => xStartEnd + cellW * j;
  const xEnd = cellX(nG + 1);
  // walls: one before each compartment (the first closes the start holder) and the fixed end wall
  const wallX = [...Array.from({length: nG + 1}, (_, k) => cellX(k)), xEnd];
  const wallW = 8;
  const back = g(null,
    h('path', {d: roundRectPath(x0 + 5, rowTop + 7, xEnd - x0, rowH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, rowTop, xEnd - x0, rowH, 10), fill: '#d9e3e8', stroke: th.ink, 'stroke-width': 2.2}),
    // the start holder is an open bay (lighter, dashed)
    h('path', {d: roundRectPath(x0 + 4, rowTop + 4, startW - 2, rowH - 8, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '7 6'}),
    // the side compartment ("not classified") keeps the dashed ring of the side bin
    h('circle', {cx: r(cellX(nG) + cellW / 2), cy: r(rowTop + 16), r: 7, fill: th.card, stroke: NEUTRAL, 'stroke-width': 2, 'stroke-dasharray': '3 2.5'}));
  const plates = S.listed.map((ls, j) => keyPlate(ctx, {name: `${P}-plate${j}`, x: cellX(j) + 6, y: 0, w: bw - 8, h: pH, fit: nameFits[j], color: ls.color}));
  const keys = S.listed.map((ls, j) => markDisc(ctx, {shape: ls.mark, color: ls.color, R: 16, transform: T(plates[j].socket.x, plates[j].socket.y)}));
  const hangers = S.listed.map((_, j) => h('path', {d: `M${r(cellX(j) + cellW / 2)} ${r(pH)}V${r(rowTop)}`, stroke: th.metalDark, 'stroke-width': 3}));
  const track = g(null,
    h('path', {d: roundRectPath(x0, floorY, xEnd - x0, 14, 5), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${x0 + 4} ${floorY + 5}H${xEnd - 4}`, stroke: '#ffffff', 'stroke-width': 3, opacity: 0.3}));
  // the walls retract up into the top frame while the card passes (it never passes through a wall)
  const wallTop = rowTop + 10, wallBot = floorY;
  const walls = wallX.map((x, k) => h('path', {name: `${P}-wall${k}`, d: roundRectPath(x - wallW / 2, wallTop, wallW, wallBot - wallTop, 3), fill: shade(th.woodDark, 0.1), stroke: th.ink, 'stroke-width': 1.6}));
  const frameTop = h('path', {d: roundRectPath(x0 - 4, rowTop - 2, xEnd - x0 + 8, 16, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2});
  const glass = h('path', {d: roundRectPath(x0 + startW + 6, rowTop + 12, xEnd - x0 - startW - 8, rowH - 26, 6), fill: 'rgba(255,255,255,0.22)'});
  const pinH = 46;
  const pins = S.listed.map((ls, j) => g({name: `${P}-pin${j}`},
    h('path', {d: roundRectPath(cellX(j) + cellW - 16, floorY - pinH, 10, pinH, 4), fill: th.metal, stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {cx: r(cellX(j) + cellW - 11), cy: r(floorY - pinH + 9), r: 6, fill: ls.color, stroke: th.ink, 'stroke-width': 1.4})));
  const card = contrastCard(ctx, {P, CL, label: fits.label, blank: {tag: fits.blankTag, fit: fits.blank}, tag: {tag: cardTag, fit: fits.tag}});
  const frame = chipFrame(ctx, {name: `${P}-frame`, CL, dashed: cardTag.listedIdx < 0});
  const container = cardTag.listedIdx >= 0 ? cardTag.listedIdx : 'side';
  const ci = container === 'side' ? nG : container;
  const cardY = floorY - chh / 2 - 2;
  const startX = x0 + startW / 2 + 2;
  const centerOf = k => cellX(k) + (cellW - 8) / 2;
  const targetX = centerOf(ci), endX = centerOf(nG);
  const reach = Math.abs(targetX - startX) / Math.max(1, endX - startX);
  const rest = {x: targetX, y: cardY, rot: 0};
  const node = g({name: P},
    hangers, back, pins, track,
    g({name: `${P}-cards`}, card.node),
    glass, walls, frameTop,
    frame.node,
    plates.map(q => q.node), keys,
  );
  function pose(v) {
    const nodes = {};
    const sw = clamp(v.stamp);
    const out = clamp(sw * 2), inn = clamp(sw * 2 - 1);
    nodes[`${P}-card-tag`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
    nodes[`${P}-card-tagB`] = {opacity: r(inn, 3), transform: `translate(0 ${r(-26 * (1 - inn))})`};
    // one common motion along the track for both stations: the card stops where its pin catches it
    const tt = clamp(ease.inOutSine(v.slide) / Math.max(1e-6, reach));
    const settle = v.fall > 0 ? Math.sin(clamp(v.fall) * Math.PI) * 5 : 0;
    const ps = {x: startX + (targetX - startX) * tt, y: cardY - settle, rot: 0};
    const holder = v.fall >= 1 ? (container === 'side' ? 'side' : `bin${container}`) : v.slide > 0 ? 'rail' : 'start';
    S.listed.forEach((_, j) => {
      const up = j === container ? seg(tt, 0.55, 0.9) : 0;
      nodes[`${P}-pin${j}`] = {transform: `translate(0 ${r((1 - ease.outCubic(up)) * (pinH - 4))})`, opacity: up > 0 ? 1 : 0};
      nodes[`${P}-plate${j}-name`] = {opacity: 1};
    });
    // only the walls the card has to pass lift: each is fully up just before the card's leading edge reaches
    // it (never before the card moves) and drops once its trailing edge is past; the entry wall of the
    // compartment where the pin stops the card closes during the last units of the approach
    const left = ps.x - cw / 2, right = ps.x + cw / 2;
    const startRight = startX + cw / 2, restLeft = targetX - cw / 2;
    const openW = wallX.map((x, k) => {
      if (k > ci) return 0;
      const touch = x - wallW / 2 - 0.5;
      const from = Math.max(touch - 30, startRight);
      const approach = clamp((right - from) / Math.max(0.5, touch - from));
      const span = k === ci ? Math.max(0.5, restLeft - (x + wallW / 2) - 0.5) : 30;
      const passed = clamp((left - (x + wallW / 2)) / span);
      return Math.min(approach, 1 - passed);
    });
    const wallF = openW.map(o => 1 - 0.98 * ease.inOutSine(o));
    wallX.forEach((x, k) => {
      nodes[`${P}-wall${k}`] = {transform: `translate(0 ${r(wallTop)}) scale(1 ${r(wallF[k], 4)}) translate(0 ${r(-wallTop)})`};
    });
    const cardT = T(ps.x, ps.y, ps.rot, s);
    nodes[`${P}-card`] = {transform: cardT};
    const fr = clamp(v.frame);
    nodes[`${P}-frame`] = {transform: `${cardT} scale(${r(1 + 0.12 * (1 - ease.outCubic(fr)), 4)})`, opacity: r(fr, 3)};
    const tx = card.texts;
    if (tx) {
      if (tx.tag) nodes[tx.tag] = {opacity: 1};
      if (tx.tagB) nodes[tx.tagB] = {opacity: 1};
      nodes[tx.label] = {opacity: 1};
    }
    // a wall is "crossing" the card when its lowered part overlaps the card's area
    const cardTop = ps.y - chh / 2;
    const wallCrossing = wallX.some((x, k) => {
      const bottom = wallTop + (wallBot - wallTop) * wallF[k];
      return x + wallW / 2 > left + 1 && x - wallW / 2 < right - 1 && bottom > cardTop + 1;
    });
    return {nodes, card: ps, holder, gateOpen: false, wallCrossing, wallsClosed: wallF.every(f => f > 0.999)};
  }
  const pt = (ps, q) => {
    const a = (ps.rot * Math.PI) / 180;
    return {x: ps.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * s, y: ps.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * s};
  };
  const chipC = {x: card.chip.x + card.chip.w / 2, y: card.chip.y + card.chip.h / 2};
  return {
    node, pose, rest, container, card, frame, s, chh, cw, plates, PH, startX, targetX, reach, kind: 'track', holderRight: xStartEnd, rowTop,
    arriveAt: Math.acos(1 - 2 * Math.min(1, reach)) / Math.PI,
    pt, chipC, restChip: pt(rest, chipC), nameFits, startChip: pt({x: startX, y: cardY, rot: 0}, chipC),
  };
}

const inside = (a, b) => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5;
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function composeLayout(ctx, forceTrack) {
    const p = ctx.params;
    const th = ctx.theme;
    let A = ARRANGE[ctx.view.shape];
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const showKey = ctx.show('key');
    const scopes = ['A', 'B'].map(k => resolveScope(ctx, {...p, activities: [{label: p.activity.label, subject: p[`scenario${k}`].subject}]}));
    const tags = scopes.map(S => S.acts[0]);
    // one card geometry for both stations (identical except the tag text)
    const cardFits = (W0, minF = 21, lines = 4) => {
      const tagFit = tx => fitWords(ctx, tx || t.noSubject, {maxWidth: textW(W0 - 16), size: 25, minSize: minF, maxLines: lines, weight: 700});
      const fitsTag = tags.map(tg => (showKey ? tagFit(tg.subject) : null));
      const blankFit = showKey ? tagFit('') : null;
      const labelFit = fitWords(ctx, p.activity.label, {maxWidth: W0 - 24, size: 24, minSize: minF, maxLines: lines, weight: 700});
      const stripH = Math.max(56, ...[...fitsTag, blankFit].filter(Boolean).map(f => f.height + 28));
      const labelH = showKey ? Math.max(30, labelFit.height) : 44;
      return {fitsTag, blankFit, labelFit, CL: {W: W0, H: r(stripH + 12 + labelH + 16, 1), stripH}};
    };
    const nG0 = scopes[0].listed.length;
    let cf = cardFits(CARD_W);
    // text-dense cards (long labels): stacked stations are height-bound with width to spare, so the card
    // (and its station) is made wider — its text wraps to fewer lines and the card gets shorter
    const dense = cf.CL.H > 180;
    // square box where the rail stations cannot keep ~16 px (dense text or three+ gates): the track
    // variant without a waiting lane, width-bound, with card text never below 22 design units
    const track = Boolean(forceTrack);
    if (track && ctx.view.shape === 'square') {
      const SRC = 340, ref = 950 * 22 / 16.2;
      const W2 = Math.max(150, Math.min(CARD_W, Math.floor((ref - SRC - 30 - 36 - 22 * (nG0 + 1)) / (nG0 + 2))));
      cf = cardFits(W2, 22, 6);
      // header tall enough that its caption stays legible (≈0.62 × 35 ≈ 22, never above the 22 card text)
      A = {...A, srcW: 400, header: 100, gap: 22, PW: 12 + (W2 + 12) + 6 + (nG0 + 1) * (W2 + 22) + 6};
    } else if (track) {
      cf = cardFits(CARD_W, 22, 6);
      A = {...A, PW: 12 + (CARD_W + 12) + 6 + (nG0 + 1) * (CARD_W + 22) + 6};
    } else if (dense && A.arrangement === 'column') {
      const W1 = ctx.view.shape === 'square' ? 290 : 250;
      cf = cardFits(W1);
      A = {...A, PW: (nG0 + 2) * W1 + 52 + 22 * nG0, srcW: A.srcW ? SRC_W_DENSE : A.srcW};
    }
    const {fitsTag, blankFit, labelFit, CL} = cf;
    const cardW = CL.W;
    // the headers, notes and captions give way before the card text does: no generic note or header
    // caption is drawn larger than the card text (AUTHORING item 17)
    const cardText = Math.min(...[...fitsTag, labelFit].filter(Boolean).map(f => f.size)) * (track ? 1 : stationScale(A.PW, nG0, cardW));
    if (dense && !track) A = {...A, header: Math.min(A.header, Math.floor(cardText / 0.62 / 0.4) + 12), gap: Math.min(A.gap, 24), srcH: A.srcH ? 300 : A.srcH};
    const noteSize = dense || track ? Math.min(24, cardText) : 24;
    // the shared source: its keys (article reference, heading, subject rows) at the card text size, the
    // supplied context (book title and note, hierarchy level) at 0.9 of it — never smaller
    const KF = cardText, CF = cardText * 0.9;
    const blankTag = {subject: '', key: '', listedIdx: -1, state: 'unclassified', mark: 'blank', color: NEUTRAL};
    // the station grows taller for a tall card (long labels) so the card keeps its width
    const nG = scopes[0].listed.length;
    const sW = stationScale(A.PW, nG, cardW);
    const names = scopes[0].listed.map(ls => (showKey ? fitWords(ctx, ls.name, {maxWidth: cardW * sW + 18 - 8 - 56, size: KF, minSize: KF, maxLines: 5, weight: 700}) : null));
    const pHn = Math.max(50, ...names.filter(Boolean).map(f => f.height + 14));
    let PH = Math.max(A.PH, Math.ceil(2 * CL.H * sW + 84 + pHn));
    const stations = scopes.map((S, i) => (track ? trackStation : station)(ctx, {P: i ? 'b' : 'a', PW: A.PW, PH, S, CL, cardTag: tags[i], plateSize: KF, fits: {label: labelFit, blank: blankFit, blankTag, tag: fitsTag[i]}}));
    if (track) PH = stations[0].PH;

    /* --- block geometry ------------------------------------------- */
    let src, panels, heads, bw, foot;
    if (A.src === 'top') {
      const srcW = A.arrangement === 'row' ? A.PW * 2 + A.gap : A.PW;
      src = sourceBlock(ctx, {p, S: scopes[0], w: A.arrangement === 'row' ? Math.min(1060, srcW - 600) : srcW, KF, CF, dir: 'row'});
      src.x = (srcW - src.used) / 2;
      src.y = 0;
      const y0 = src.h + 18;
      if (A.arrangement === 'row') {
        // wide box: the notes and the comparison tray share the top band with the source;
        // the stations are placed below the taller of the two (after the footer is laid out)
        bw = srcW;
        src.x = 0;
        foot = {x: src.used + 40, y: 4, w: bw - src.used - 40};
      } else {
        bw = A.PW;
        heads = [0, 1].map(i => ({x: 0, y: y0 + i * (A.header + PH + A.gap)}));
        panels = heads.map(q => ({x: 0, y: q.y + A.header}));
        foot = {x: 0, y: panels[1].y + PH + 20, w: bw};
      }
    } else {
      src = sourceBlock(ctx, {p, S: scopes[0], w: A.srcW, KF, CF, dir: 'column'});
      src.x = 0;
      src.y = 0;
      const x0 = A.srcW + 30;
      bw = x0 + A.PW;
      heads = [0, 1].map(i => ({x: x0, y: i * (A.header + PH + A.gap)}));
      panels = heads.map(q => ({x: x0, y: q.y + A.header}));
      foot = {x: 0, y: src.h + 26, w: A.srcW};
    }

    /* --- headers: neutral until the tag change, then the supplied states */
    const neutralColor = th.dark ? '#9aa1a9' : '#6b7280';
    const colors = [th.accent4, NEUTRAL];
    // square track stations: the comparison tray lands in the (then empty) start holders, so the headers
    // leave the start column free for the guide that joins the two chips
    const holders = track && ctx.view.shape === 'square';
    const hShift = holders ? stations[0].holderRight + 14 : 0;
    if (holders) heads = heads.map(q => ({...q, x: q.x + hShift}));
    const headerW = A.PW - hShift;

    /* --- footer: change chip / shared note / comparison tray / neutral note */
    const fs = 1;
    const cx = foot.x + foot.w / 2;
    const changeChip = showKey ? chip(ctx, p.changedFact, {x: cx, y: foot.y, anchor: 'middle', maxWidth: foot.w * 0.96, size: dense ? noteSize : 28 * fs, minSize: Math.min(18, noteSize), maxLines: 3, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? chip(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: cx, y: foot.y, anchor: 'middle', maxWidth: foot.w * 0.96, size: noteSize, minSize: Math.min(17, noteSize), maxLines: 4, fill: th.card, weight: 500, name: 'shared-note'}) : null;
    // tray: a real copy of each chip, enlarged (same fits, same art)
    const cr = chipRect(CL);
    const badgeR = 22;
    const gap = 34;
    const slotW = badgeR * 2 + 10;
    // row tray: [A badge][A chip] — guide label — [B badge][B chip]; column tray: stacked
    const kT = holders ? stations[0].s : A.tray === 'row' ? Math.min(1.25, (foot.w - 2 * slotW - 2 * gap - 250) / (2 * cr.w)) : Math.min(track ? 1.1 : dense ? 1.9 : 1.25, (foot.w - slotW - 10) / cr.w);
    const cwT = cr.w * kT, chT = cr.h * kT;
    const trayCopies = [0, 1].map(i => g({name: `tray-${i}`, opacity: 0},
      g({transform: T(-cr.x - cr.w / 2, -cr.y - cr.h / 2)}, tagChip(ctx, {tag: tags[i], fit: fitsTag[i], ...cr, showText: showKey, textName: `tray-${i}-t`}))));
    const guideMax = holders ? stations[0].holderRight + 4 : A.tray === 'row' ? Math.min(360, foot.w - 2 * (slotW + cwT) - 2 * gap - 6) : foot.w - 30;
    const guideLabelFit = showKey ? fitWords(ctx, p.comparisonLabels.guide, {maxWidth: guideMax - 34, size: noteSize, minSize: Math.min(17, noteSize), maxLines: 3, weight: 700}) : null;
    const gW = guideLabelFit ? guideLabelFit.width + 34 : 0, gH = guideLabelFit ? guideLabelFit.height + 20 : 0;
    let slots, guideLine, guideBox;
    if (holders) {
      slots = [0, 1].map(i => ({x: panels[i].x + stations[i].startChip.x, y: panels[i].y + stations[i].startChip.y}));
      guideLine = {x1: slots[0].x, y1: slots[0].y + chT / 2 + 4, x2: slots[1].x, y2: slots[1].y - chT / 2 - 4};
      const gapMid = (panels[0].y + PH + panels[1].y + stations[1].rowTop - A.header) / 2 + A.header / 2;
      guideBox = {x: Math.max(panels[0].x - 10, slots[0].x - gW / 2), y: gapMid - gH / 2, w: gW, h: gH};
    } else if (A.tray === 'row') {
      const total = 2 * (slotW + cwT) + 2 * gap + Math.max(gW, 80);
      const x0 = cx - total / 2;
      const yc = foot.y + Math.max(chT, gH) / 2 + 4;
      slots = [{x: x0 + slotW + cwT / 2, y: yc}, {x: x0 + total - cwT / 2, y: yc}];
      guideLine = {x1: slots[0].x + cwT / 2 + 4, y1: yc, x2: slots[1].x - cwT / 2 - slotW - 4, y2: yc};
      const mid = (guideLine.x1 + guideLine.x2) / 2;
      guideBox = {x: mid - gW / 2, y: yc - gH / 2, w: gW, h: gH};
    } else {
      const x = cx - (slotW + cwT) / 2 + slotW + cwT / 2;
      const y0 = foot.y + 8;
      slots = [{x, y: y0 + chT / 2}, {x, y: y0 + chT + 40 + gH + 40 + chT / 2}];
      guideLine = {x1: x, y1: slots[0].y + chT / 2 + 4, x2: x, y2: slots[1].y - chT / 2 - 4};
      guideBox = {x: cx - gW / 2, y: (guideLine.y1 + guideLine.y2) / 2 - gH / 2, w: gW, h: gH};
    }
    const badges = holders
      ? slots.map(q => ({x: q.x - cwT / 2 + badgeR + 6, y: q.y + chT / 2 + badgeR + 14}))
      : slots.map(q => ({x: q.x - cwT / 2 - 10 - badgeR, y: q.y}));
    const trayBottom = holders ? foot.y : Math.max(slots[1].y + chT / 2, guideBox.y + guideBox.h);
    // with the tray in the holders, the neutral note takes the notes' place (they are shown one after another)
    const noteY = holders ? foot.y : trayBottom + 22;
    const neutral = ctx.show('all') ? chip(ctx, p.comparisonLabels.neutral, {x: cx, y: noteY, anchor: 'middle', maxWidth: foot.w * 0.96, size: noteSize, minSize: Math.min(17, noteSize), maxLines: 3, fill: th.card, weight: 500, name: 'neutral-note'}) : null;
    if (!panels) {
      const y0 = Math.max(src.h, neutral ? neutral.box.y + neutral.box.h : trayBottom) + 18;
      heads = [0, 1].map(i => ({x: i * (A.PW + A.gap), y: y0}));
      panels = [0, 1].map(i => ({x: i * (A.PW + A.gap), y: y0 + A.header}));
    }
    const headN = [0, 1].map(i => scenarioHead(ctx, {name: `hn-${i}`, letter: i ? 'B' : 'A', label: `${t.situation} ${i ? 'B' : 'A'}`, x: heads[i].x, y: heads[i].y + 6, w: headerW, h: A.header - 12, color: neutralColor}));
    const headS = [0, 1].map(i => scenarioHead(ctx, {name: `hs-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, x: heads[i].x, y: heads[i].y + 6, w: headerW, h: A.header - 12, color: colors[i]}));
    const bh = Math.max(panels[1].y + PH, neutral ? neutral.box.y + neutral.box.h : trayBottom) + 6;

    /* --- fit the block ------------------------------------------------ */
    const s0 = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s0) / 2, oy = (ctx.design.h - bh * s0) / 2;
    const pxPerUnit = fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * s0;
    // the same composition in the reference frame of its shape (1920×1080, 1080×1920 or 1080×1080 with the
    // default caption-safe box and notice), so sizes can be checked at 1080p whatever box the test uses
    const refBox = {landscape: [1689.6, 737.6], portrait: [950.4, 1359.2], square: [950.4, 737.6]}[ctx.view.shape];
    const [rdw, rdh] = designSize({shape: ctx.view.shape, content: {w: refBox[0], h: refBox[1]}}, scene.sizes);
    const px1080 = Math.min(refBox[0] / rdw, refBox[1] / rdh) * Math.min(rdw / bw, rdh / bh);
    const refMin = f => (f ? f.size * stations[0].s * px1080 : null);
    const refTag = fitsTag[0] ? Math.min(...fitsTag.map(refMin)) : null, refLabel = showKey ? refMin(labelFit) : null;
    return {refTag, refLabel, track, A, PH, t, s0, ox, oy, bw, bh, src, panels, heads, headN, headS, stations, scopes, tags, CL, fitsTag, labelFit, changeChip, shared, neutral,
      trayCopies, slots, kT, cwT, chT, guideLine, guideBox, guideLabelFit, badges, badgeR, colors, neutralColor, pxPerUnit, px1080, foot, dense, noteSize, cardText};
}


const scene = {
  sizes: {landscape: [1810, 900], square: [1290, 990], portrait: [880, 1530]},
  layout(ctx) {
    // when the rail stations cannot keep the card text (and with it the source keys, sized to it) at ~16 px
    // at 1080p, the stations are recomposed without the waiting lane (track variant) — as LAW-0083 switches
    // layout for dense text
    const L = composeLayout(ctx, false);
    const ok = q => Math.min(q.refTag ?? 99, q.refLabel ?? 99);
    if (ok(L) >= 16) return L;
    const L2 = composeLayout(ctx, true);
    return ok(L2) > ok(L) ? L2 : L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const gl = L.guideLine;
    const len = Math.hypot(gl.x2 - gl.x1, gl.y2 - gl.y1);
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      g({transform: T(L.src.x, L.src.y)}, L.src.node),
      L.headN.map((hd, i) => g({name: `hn-g${i}`}, hd)),
      L.headS.map((hd, i) => g({name: `hs-g${i}`, opacity: 0}, hd)),
      L.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, h('path', {d: roundRectPath(-8, -6, L.A.PW + 16, L.PH + 12, 14), fill: th.dark ? 'rgba(255,255,255,0.04)' : 'rgba(31,35,40,0.035)'}), L.stations[i].node)),
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      // comparison tray: guide line, letter badges, the chip copies, the guide label
      h('path', {name: 'guide-line', d: `M${r(gl.x1)} ${r(gl.y1)}L${r(gl.x2)} ${r(gl.y2)}`, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len), fill: 'none'}),
      L.badges.map((b, i) => g({name: `tray-badge-${i}`, opacity: 0},
        h('circle', {cx: r(b.x), cy: r(b.y), r: L.badgeR, fill: L.colors[i], stroke: th.ink, 'stroke-width': 2.4}),
        ctx.show('key') ? h('text', {x: r(b.x), y: r(b.y + 9), 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A') : null)),
      L.guideLabelFit && g({name: 'guide-chip', opacity: 0},
        h('path', {d: roundRectPath(L.guideBox.x, L.guideBox.y, L.guideBox.w, L.guideBox.h, Math.min(18, L.guideBox.h / 2)), fill: th.card, stroke: th.accent, 'stroke-width': 2.4}),
        textBlock(L.guideLabelFit, {x: L.guideBox.x + L.guideBox.w / 2, y: L.guideBox.y + 10, anchor: 'middle', fill: th.ink})),
      L.trayCopies,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const stamp = seg(u, ...W.stamp);
    const frameP = seg(u, ...W.frame);
    const release = u >= W.release;
    const slide = seg(u, ...W.slide);
    const res = L.stations.map(st => {
      const tEnd = lerp(W.slide[0], W.slide[1], st.arriveAt);
      const fall = seg(u, tEnd, tEnd + 0.03 * (st.container === 'side' ? 1.3 : 1));
      const after = seg(u, tEnd + 0.04, tEnd + 0.08);
      return st.pose({stamp, frame: frameP, slide: release ? slide : 0, fall, after});
    });
    res.forEach(q => Object.assign(nodes, q.nodes));
    // headers: neutral labels until the tag is on the card; then the supplied state titles
    const hOut = seg(u, ...W.headOut), hIn = seg(u, ...W.headIn);
    [0, 1].forEach(i => {
      nodes[`hn-g${i}`] = {opacity: r(1 - hOut, 3), transform: `translate(0 ${r(-8 * hOut)})`};
      nodes[`hs-g${i}`] = {opacity: r(hIn, 3), transform: `translate(0 ${r(8 * (1 - hIn))})`};
    });
    // footer notes hand over strictly in sequence (one at a time in the same place)
    if (L.changeChip) nodes['change-chip'] = {opacity: r(seg(u, ...W.changeChip) * (1 - seg(u, 0.5, 0.53)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, ...W.shared) * (1 - seg(u, ...W.sharedOut)), 3)};
    // tray: each chip copy lifts out of its card and flies to its slot
    const fly = ease.inOutCubic(seg(u, ...W.fly));
    const trayPos = [];
    [0, 1].forEach(i => {
      const st = L.stations[i], pn = L.panels[i];
      const from = st.pt(res[i].card, st.chipC);
      const a = {x: pn.x + from.x, y: pn.y + from.y};
      const b = L.slots[i];
      const lift = Math.sin(fly * Math.PI) * 50;
      const q = {x: lerp(a.x, b.x, fly), y: lerp(a.y, b.y, fly) - lift};
      const sc = lerp(st.s, L.kT, fly);
      nodes[`tray-${i}`] = {transform: T(q.x, q.y, lerp(res[i].card.rot, 0, fly), sc), opacity: u >= W.fly[0] ? 1 : 0};
      nodes[`tray-badge-${i}`] = {opacity: r(seg(u, W.fly[1] - 0.02, W.fly[1] + 0.02), 3)};
      trayPos.push(q);
    });
    const gp = seg(u, ...W.guide);
    const gl = L.guideLine;
    const len = Math.hypot(gl.x2 - gl.x1, gl.y2 - gl.y1);
    nodes['guide-line'] = {'stroke-dashoffset': r(len * (1 - ease.inOutSine(gp)))};
    if (L.guideLabelFit) nodes['guide-chip'] = {opacity: r(seg(u, ...W.guideChip), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(seg(u, ...W.note), 3)};

    /* --- semantics -------------------------------------------------- */
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const side = (q, i) => {
      const st = L.stations[i];
      const lb = st.card.labelBox;
      const card = {x: -L.CL.W / 2, y: -L.CL.H / 2, w: L.CL.W, h: L.CL.H};
      return {
        holder: q.holder, card: P2(q.card), gateOpen: q.gateOpen, tagShown: r(stamp, 3), tag: L.tags[i].subject, state: L.tags[i].state,
        // the name is printed on the card body (card-local), so it travels with the card
        labelOnCard: inside(lb, card),
        // the frame closes round the WHOLE chip (outside its text), never over it
        frameAroundChip: inside(st.card.chip, st.frame.box) && !hit(st.frame.box, lb),
        frameShown: r(frameP, 3),
        // the chip copy in the tray is a real copy of this card's chip
        tray: P2(trayPos[i]),
      };
    };
    const a = side(res[0], 0), b = side(res[1], 1);
    const cardPx = r(L.stations[0].cw * L.pxPerUnit, 1);
    const tagPx = L.fitsTag[0] ? r(Math.min(...L.fitsTag.map(f => f.size)) * L.stations[0].s * L.pxPerUnit, 1) : null;
    const labelPx = ctx.show('key') ? r(L.labelFit.size * L.stations[0].s * L.pxPerUnit, 1) : null;
    const trayPx = L.fitsTag[0] ? r(Math.min(...L.fitsTag.map(f => f.size)) * L.kT * L.pxPerUnit, 1) : null;
    return {
      nodes,
      semantic: {
        beat, a, b,
        cardA: P2({x: L.panels[0].x + res[0].card.x, y: L.panels[0].y + res[0].card.y}),
        cardB: P2({x: L.panels[1].x + res[1].card.x, y: L.panels[1].y + res[1].card.y}),
        samePanels: JSON.stringify(L.scopes[0].listed.map(q => q.name)) === JSON.stringify(L.scopes[1].listed.map(q => q.name)),
        sameCard: L.stations[0].s === L.stations[1].s && L.stations[0].cw === L.stations[1].cw,
        // headers: the supplied state titles (and their colours) appear only after the tag change
        statesShown: r(hIn, 3),
        neutralHeaders: r(1 - hOut, 3),
        headerColors: hIn > 0 ? L.colors : [L.neutralColor, L.neutralColor],
        guideProgress: r(gp, 3),
        trayLanded: fly >= 1,
        arrangement: L.A.arrangement,
        stationKind: L.stations[0].kind || 'rail',
        // the shared source at 1080p: keys (reference, heading, subject rows) and supplied context (title, note, level)
        srcKeyPx: (() => { const f = L.src.fits; const v = [f.ref, f.heading, ...f.rows].filter(Boolean).map(q => q.size * L.px1080); return v.length ? r(Math.min(...v), 1) : null; })(),
        srcCtxPx: (() => { const f = L.src.fits; const v = [f.title, f.note, f.lev].filter(Boolean).map(q => q.size * L.px1080); return v.length ? r(Math.min(...v), 1) : null; })(),
        platePx: (() => { const v = (L.stations[0].nameFits || []).filter(Boolean).map(q => q.size * L.px1080); return v.length ? r(Math.min(...v), 1) : null; })(),
        srcTruncated: Object.values(L.src.fits).flat().filter(f => f && f.truncated).length,
        noteInPage: !L.src.noteBox || (L.src.noteBox.x >= L.src.labelBox.x && L.src.noteBox.y >= L.src.labelBox.y && L.src.noteBox.x + L.src.noteBox.w <= L.src.labelBox.x + L.src.labelBox.w + 0.5 && L.src.noteBox.y + L.src.noteBox.h <= L.src.labelBox.y + L.src.labelBox.h + 0.5),
        wallCrossing: res.some(q => q.wallCrossing),
        wallsClosed: res.every(q => q.wallsClosed !== false),
        sourceDrawnOnce: true,
        props: ['book', 'article', 'hierarchy', 'filter', 'card'],
        // sizes in output pixels at this render size
        cardPx, tagPx, labelPx, trayPx,
        // the same sizes at 1080p in the reference frame of this shape
        ref: {tag: L.fitsTag[0] ? r(Math.min(...L.fitsTag.map(f => f.size)) * L.stations[0].s * L.px1080, 1) : null, label: r(L.labelFit.size * L.stations[0].s * L.px1080, 1), tray: L.fitsTag[0] ? r(Math.min(...L.fitsTag.map(f => f.size)) * L.kT * L.px1080, 1) : null},
        // no generic note or header is drawn larger than the card text (text-dense layouts)
        dense: L.dense, notesNotLarger: !L.dense || (L.noteSize <= L.cardText + 0.01 && Math.min(54, (L.A.header - 12) * 0.4) * 0.62 <= L.cardText + 0.01),
        // author texts that had to be cut with an ellipsis (meaning lost)
        truncated: [...L.fitsTag, L.labelFit, L.guideLabelFit, L.changeChip && L.changeChip.fit, L.shared && L.shared.fit, L.neutral && L.neutral.fit].filter(f => f && f.truncated).map(f => f.full),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.1.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-05-contrast',
    title: 'Material scope — listed tag vs unclassified tag',
    titleEs: 'Ámbito material — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito material',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'One shared fictional source (the text on its shelf and the article listing the subjects) above two identical filter stations with the same keyed gates and the same named activity card. Only the subject tag clipped onto the card differs: in A it matches a listed subject and its gate opens into that bin; in B no gate opens and the card runs on into the side bin. The state titles appear only after the tag change; at the end a copy of each chip lifts into a comparison tray joined by a guide, with no winner or legal consequence.',
    tags: ['material scope', 'comparison', 'subject tag', 'filter', 'listed', 'not classified', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-material.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...KIT_STRINGS.en, ...STRINGS.en}, es: {...KIT_STRINGS.es, ...STRINGS.es}},
  scene,
});
