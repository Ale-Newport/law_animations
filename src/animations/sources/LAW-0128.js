/**
 * LAW-0128 — Definición legislativa · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.18] build: the desk in the state the action produced — the article
 *              extract (reference, level, heading and clause, the term marked on
 *              its own line) and the definitions page of ANOTHER section (its
 *              reference, level, heading and entries, the hierarchy's index flags
 *              down its edge, the definitions' level flag marked), a cord pinned
 *              from the term to the entry that lists it. The magnifier lies parked
 *              in a free corner. A caption names the context; a pulse runs along
 *              the cord.
 *  [0.18–0.42] isolate: a rectangular inset window (no handle: the desk's
 *              magnifier stays the only magnifier) fades in, in free space, with a
 *              REAL enlarged copy of the term's line and pin A; a frame on the source
 *              and a leader tie it to its place; both terms are always whole inside it.
 *              One editorial annotation shows the term as used.
 *  [0.42–0.66] substitute: inside the inset the old term lifts out (and is struck
 *              through in the annotation, so it stays traceable), then the
 *              alternative term drops in; its highlight and pin A re-fit.
 *  [0.66–0.84] return (then a ~1.3 s hold of the complete state): the inset closes where it stands (it never travels across
 *              the documents); the context word cross-fades old → new (the term has
 *              its own line, so no other word moves); only the dependent connection
 *              moves — pin A to the new word's end and pin B to the entry that lists
 *              the new term (or back to the term when no entry lists it: the cord
 *              then has no far end) — and a "datum changed" marker stays: a badge in
 *              the extract's margin beside the term, its label's leader kept apart
 *              from the cord. The magnifier lies wholly on the desk. Seeking back
 *              restores the old datum exactly. Nothing about validity or outcome is
 *              inferred.
 * Every supplied text (references, level names, headings, the clause, the entries
 * and the old entry's wording) is drawn as text at >= 16.5 px on a 1080p frame;
 * the documents are sized to it (wide frames: side by side; tall frames: stacked).
 * @module animations/sources/LAW-0128
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, roundRectPath} from '../../core/geometry.js';
import {inspectFields, obj, int} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {deskWindow} from '../../primitives/desk.js';
import {sourcesFields, kitStrings, KIT_STRINGS, articleDoc, readablePage, levelFlags, rectLens, magnifier, pinPair, pinHead, linkColor, levelIndex, levelColor, fullFit, pageMarks, PIN_R, overlaps} from './kits/definicion-legislativa.js';

const ID = 'LAW-0128';
const DURATION = 8000;
// (review round 4: the return ends by u 0.80 and the marker is complete by u 0.84; the complete
// final state then holds ~1.3 s at the default duration)
const BEATS = {build: [0, 0.18], isolate: [0.18, 0.42], substitute: [0.42, 0.66], return: [0.66, 1]};
const W = {
  caption: [0.02, 0.1], pulse: [0.06, 0.17],
  open: [0.2, 0.36], ann: [0.3, 0.38],
  strike: [0.44, 0.49], liftOld: [0.45, 0.52], dropNew: [0.52, 0.59], annAfter: [0.56, 0.62],
  close: [0.66, 0.71], fade: [0.71, 0.75], update: [0.75, 0.8], marker: [0.79, 0.84],
};
const SWAP_AT = 0.73; // the context word cross-fades during W.fade; the datum counts as changed from its midpoint

const {interpretations: _unusedInterpretations, ...fieldsNoReadings} = sourcesFields;
const sceneSchema = {
  ...fieldsNoReadings,
  ...inspectFields(['term']),
  entryRows: obj('Row of the definitions page (1–3) that lists each value; 0 = no entry lists the new term (the cord then keeps no far end)', {
    before: int('Row listing the before term (1–3)', 1, 3),
    after: int('Row listing the after term (0 = none, 1–3)', 0, 3),
  }, ['before', 'after']),
};
sceneSchema.beforeValue.description = 'The term as used in the article before the substitution (the entry at entryRows.before lists it)';
sceneSchema.afterValue.description = 'The alternative term substituted in the article (listed at entryRows.after, or by no entry when 0)';
sceneSchema.detailGeometry.properties.zoom.description = 'Wanted magnification of the inset (bounded by the free space it opens in)';
sceneSchema.detailGeometry.properties.placement.description = "Where the inset opens: 'auto'/'left' in the free space under the article extract; 'top' above the documents when there is room; other values fall back to 'auto'";

const defaultParams = {
  sources: ['Text 1 (fictional)'],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'],
  passages: [
    {ref: 'Text 1 · Art. 7 (fictional)', heading: 'Keeping of items', text: 'The holder keeps each listed item in the register (simulated wording).', term: 'listed item', level: 3},
    {ref: 'Text 1 · Art. 2 (fictional)', heading: 'Definitions', text: 'means an object entered in the annex (simulated wording).', term: 'listed item', level: 2},
  ],
  focusTarget: 'term',
  beforeValue: 'listed item',
  afterValue: 'register',
  entryRows: {before: 2, after: 3},
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Context: the term pinned to its definition in another section', marker: 'Datum changed'},
};

const STRINGS = {
  en: {termUsed: 'Term used in the article', noEntryState: 'No entry lists this term (as supplied)'},
  es: {termUsed: 'Término usado en el artículo', noEntryState: 'Ninguna entrada recoge este término (según lo aportado)'},
};

const CAP = 70;

const scene = {
  sizes: {landscape: [1600, 900 + CAP], square: [1300, 1100 + CAP], portrait: [1000, 1400 + CAP]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const D = ctx.design;
    const V = ctx.view;
    // design units → px on a 1080p frame: every supplied text is set at >= 16.5 px there
    const k0 = Math.min(V.content.w / D.w, V.content.h / D.h) * (1080 / Math.min(V.width, V.height));
    const floor = 16.5 / k0;
    const tall = ctx.view.shape === 'portrait';
    const pa = p.passages[0], pd = p.passages[1];
    const aL = levelIndex(p, pa), dL = levelIndex(p, pd);
    const bRow = p.entryRows.before - 1, aRow = p.entryRows.after - 1;
    const rows = [0, 1, 2].map(i => (i === bRow ? {term: p.beforeValue, text: pd.text} : i === aRow ? {term: p.afterValue, text: null} : {term: null, text: null}));
    // ---- desk and its inner area
    const m = 16, dpad = 34;
    const desk = deskWindow(ctx, {prefix: 'desk', x: m, y: CAP + 4, w: D.w - 2 * m, h: D.h - CAP - 4 - m, radius: 28, seedKey: 'def-desk-0128'});
    const inner = {x: m + dpad, y: CAP + 4 + dpad, w: D.w - 2 * (m + dpad), h: D.h - CAP - 4 - m - 2 * dpad};
    const gapC = tall ? 90 : 150; // the cord's lane between the documents
    // The documents are laid out at text size S (>= the floor); the largest S (up to 1.6x the
    // floor) whose layout fits the desk is used, so the documents fill the frame.
    const plan = S => {
      const lw = Math.max(0, ...p.hierarchy.flatMap(l => String(l).split(/\s+/)).map(wd => ctx.measure(wd, S, 700, 'sans')));
      const flagW = Math.max(tall ? 220 : 240, lw + 50);
      let docW, pageW;
      if (tall) { docW = inner.w; pageW = inner.w - flagW - 16; } else { docW = Math.min(700, (inner.w - gapC - flagW - 16) / 2); pageW = docW; }
      const sheetOpts = {w: docW, S, ref: pa.ref, heading: pa.heading, levelLabel: p.hierarchy[aL], levelColor: levelColor(ctx, aL), text: pa.text, term: p.beforeValue, altTerm: p.afterValue};
      const pageOpts = {w: pageW, S, ref: pd.ref, heading: pd.heading, levelLabel: p.hierarchy[dL], levelColor: levelColor(ctx, dL), rows};
      const sh = articleDoc(ctx, {prefix: 'sheet', ...sheetOpts});
      const pg = readablePage(ctx, {prefix: 'page', ...pageOpts});
      const fl = levelFlags(ctx, {prefix: 'flags', levels: p.hierarchy, w: flagW, S, top: S * 1.2});
      const top = inner.y + S * 2.4;
      let sheetBox, pageBox;
      if (tall) {
        sheetBox = {x: inner.x, y: top, w: docW, h: sh.h};
        const ph = Math.max(pg.h, fl.h);
        pageBox = {x: inner.x, y: sheetBox.y + sheetBox.h + gapC, w: pageW, h: ph};
      } else {
        const ph = Math.max(sh.h, pg.h, fl.h);
        sheetBox = {x: inner.x, y: top, w: docW, h: ph};
        pageBox = {x: inner.x + docW + gapC, y: top, w: pageW, h: ph};
      }
      const r2y = Math.max(sheetBox.y + sheetBox.h, pageBox.y + pageBox.h) + 30;
      const row2 = {x: inner.x, y: r2y, w: inner.w, h: inner.y + inner.h - r2y};
      // row 2 must hold the inset (the term's slot enlarged >= 1.3x) and the annotation plate
      const slotH = sh.slot.h + 12;
      const annNeed = S * 1.15 * 2 * 1.9 + S * 1.2 + 90;
      const need = tall ? slotH * 1.3 + 26 + annNeed : Math.max(slotH * 1.3, annNeed);
      return {S, flagW, docW, pageW, sheetOpts, pageOpts, sheetBox, pageBox, row2, fits: row2.h >= need};
    };
    let G = plan(Math.max(floor, 18));
    for (let k = 1.6; k > 1.001; k -= 0.05) {
      const g2 = plan(Math.max(floor, 18) * k);
      if (g2.fits) { G = g2; break; }
    }
    const {S, flagW, docW, pageW, sheetOpts, pageOpts, sheetBox, pageBox, row2} = G;
    const sheet = articleDoc(ctx, {prefix: 'sheet', ...sheetOpts, minH: sheetBox.h});
    const page = readablePage(ctx, {prefix: 'page', ...pageOpts, minH: pageBox.h});
    const flags = levelFlags(ctx, {prefix: 'flags', levels: p.hierarchy, w: flagW, S, top: S * 1.2});
    const flagsAt = {x: pageBox.x + pageW, y: pageBox.y};
    // captions above the two documents (built-in, no larger than the content)
    const capOpts = {size: S, minSize: S, maxLines: 1, weight: 700, fill: th.card};
    const capExtract = ctx.show('key') ? chip(ctx, t.extract, {...capOpts, x: sheetBox.x + 8, y: sheetBox.y - S * 2.1, anchor: 'start', maxWidth: docW}) : null;
    const capHier = ctx.show('key') ? chip(ctx, t.hierarchy, {...capOpts, x: flagsAt.x + flagW, y: pageBox.y - S * 2.1, anchor: 'end', maxWidth: flagW + pageW * 0.6}) : null;
    // world helpers
    const inS = q => ({x: sheetBox.x + q.x, y: sheetBox.y + q.y});
    const inP = q => ({x: pageBox.x + q.x, y: pageBox.y + q.y});
    const pinA1 = inS(sheet.pinPt), pinA2 = inS(sheet.pinPt2);
    const entryPin = i => inP(page.pinPt(i));
    const rowBox = i => { const b = page.rowBoxes[i]; return {x: pageBox.x + b.x, y: pageBox.y + b.y, w: b.w, h: b.h}; };
    // ---- the inset: source = the term's slot with pin A (both terms whole inside it)
    const slot = sheet.slot;
    const srcL = {x: slot.x - 6, y: slot.y - 6, w: slot.w + 16 + PIN_R + 18, h: slot.h + 12};
    const src = {x: sheetBox.x + srcL.x, y: sheetBox.y + srcL.y, w: srcL.w, h: srcL.h};
    // annotation plate: "Term used in the article: [before] → [after]"
    const annSize = Math.max(S * 1.15, 26);
    let ann = null, annW = 0, annH = 0;
    const annParts = () => {
      const title = ctx.show('all') ? fullFit(ctx, t.termUsed, {maxWidth: 1e9, size: S, weight: 700}) : null;
      const cB = chip(ctx, p.beforeValue, {x: 0, y: 0, anchor: 'start', maxWidth: 640, size: annSize, minSize: annSize, maxLines: 3, weight: 700, family: 'serif', fill: th.highlight, name: 'ann-before'});
      const cA = chip(ctx, p.afterValue, {x: 0, y: 0, anchor: 'start', maxWidth: 640, size: annSize, minSize: annSize, maxLines: 3, weight: 700, family: 'serif', fill: th.highlight, name: 'ann-after'});
      return {title, cB, cA};
    };
    // ---- row 2: the inset opens on the left (under the extract), the annotation plate on the right;
    // the parked magnifier lies in the desk's free bottom-right corner
    const lensR = 58;
    const MAG_ANGLE = -24;
    const mag = magnifier(ctx, {prefix: 'mag', R: lensR, content: g(null), bg: th.woodTop, bgBox: {x: -D.w, y: -D.h, w: D.w * 3, h: D.h * 3}});
    // the parked magnifier lies wholly inside the desk's inner area: rim and handle (review round 3)
    const mA = (MAG_ANGLE * Math.PI) / 180;
    const hwM = lensR * 0.2;
    const magExt = {l: lensR + 11, r: Math.max(lensR + 11, Math.cos(mA) * mag.reach + hwM + 4), t: Math.max(lensR + 11, -Math.sin(mA) * mag.reach + hwM + 4), b: lensR + 11 + 14};
    const magSpot = {x: inner.x + inner.w - magExt.r - 6, y: inner.y + inner.h - magExt.b - 4};
    const magBox = {x: magSpot.x - magExt.l, y: magSpot.y - magExt.t, w: magExt.l + magExt.r, h: magExt.t + magExt.b};
    const zoomWant = p.detailGeometry.zoom;
    const insetMax = {w: tall ? inner.w * 0.62 : Math.max(src.w * 1.2, docW + gapC * 0.5), h: row2.h};
    let zoom = Math.max(1.2, Math.min(zoomWant, insetMax.w / src.w, (row2.h - 10) / src.h));
    let dest = {x: row2.x, y: row2.y, w: src.w * zoom, h: src.h * zoom};
    if (p.detailGeometry.placement === 'top' && tall) {
      const top = {x: inner.x + (inner.w - src.w * zoom) / 2, y: inner.y - 10, w: src.w * zoom, h: src.h * zoom};
      if (top.y + top.h < sheetBox.y - 50) dest = top;
    }
    // annotation plate beside the inset (right part of row 2), clear of the parked magnifier
    const ap = annParts();
    if (ctx.show('key')) {
      const annX0 = tall ? row2.x : Math.max(dest.x + dest.w + 40, pageBox.x);
      const annMaxW = magBox.x - 30 - annX0;
      // (the plate's title wraps rather than push the plate under the parked magnifier)
      if (ap.title && ap.title.width > annMaxW - 40) ap.title = fullFit(ctx, t.termUsed, {maxWidth: annMaxW - 40, size: S, weight: 700});
      const arrowW = 46;
      const rowW = ap.cB.box.w + arrowW + ap.cA.box.w;
      const stack = rowW > annMaxW - 40;
      annW = stack ? Math.max(ap.cB.box.w, ap.cA.box.w, ap.title ? ap.title.width : 0) + 40 : Math.max(rowW, ap.title ? ap.title.width : 0) + 40;
      const tH = ap.title ? ap.title.height + 14 : 0;
      annH = tH + (stack ? ap.cB.box.h + 44 + ap.cA.box.h : Math.max(ap.cB.box.h, ap.cA.box.h)) + 36;
      const px = tall ? row2.x : annX0, py = tall ? dest.y + dest.h + 26 : row2.y;
      const bx = px + 20, by = py + 18 + tH;
      const ax = stack ? px + 20 : bx + ap.cB.box.w + arrowW;
      const ay = stack ? by + ap.cB.box.h + 44 : by;
      const arrowD = stack
        ? `M${r(bx + ap.cB.box.w / 2)} ${r(by + ap.cB.box.h + 8)}v26m-9 -10l9 10l9 -10`
        : `M${r(bx + ap.cB.box.w + 8)} ${r(by + ap.cB.box.h / 2)}h${arrowW - 16}m-10 -9l10 9l-10 9`;
      ann = {
        box: {x: px, y: py, w: annW, h: annH},
        node: g({name: 'ann', opacity: 0},
          h('path', {d: `M${r(px + 6)} ${r(py + 9)}h${r(annW)}v${r(annH)}h${r(-annW)}Z`, fill: th.shadow}),
          h('rect', {x: px, y: py, width: annW, height: annH, rx: 12, fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}),
          ap.title ? textBlock(ap.title, {x: px + 20, y: py + 16, fill: th.inkSoft}) : null,
          g({name: 'ann-b', transform: T(bx, by)}, ap.cB.node),
          h('line', {name: 'ann-strike', x1: r(bx + 6), y1: r(by + ap.cB.box.h / 2), x2: r(bx + 6), y2: r(by + ap.cB.box.h / 2), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
          h('path', {name: 'ann-arrow', d: arrowD, fill: 'none', stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
          g({name: 'ann-a', transform: T(ax, ay), opacity: 0}, ap.cA.node),
        ),
        strikeX: bx + ap.cB.box.w - 6,
      };
    }
    // the inset's content: the extract drawn again (term slot only) and a copy of pin A
    const copy = articleDoc(ctx, {prefix: 'lz', ...sheetOpts, copy: true, minH: sheetBox.h});
    const content = g(null,
      h('rect', {x: -D.w, y: -D.h, width: D.w * 3, height: D.h * 3, fill: th.woodTop}),
      g({transform: T(sheetBox.x, sheetBox.y)}, copy.node),
      pinHead(ctx, 'lz-pin'));
    const lens = rectLens(ctx, {name: 'lens', source: src, dest, content, bg: th.paper, color: th.accent});
    // leader: from the source box out of the extract's right side (the cord column), then to the inset
    // (it runs down the extract's left margin / the desk's left edge: it crosses no text)
    const scy = src.y + src.h / 2;
    const leaderPts = tall
      ? [{x: src.x, y: scy}, {x: inner.x - 17, y: scy}, {x: inner.x - 17, y: dest.y + dest.h / 2}, {x: dest.x - 6, y: dest.y + dest.h / 2}]
      : [{x: src.x, y: scy}, {x: sheetBox.x + 12, y: scy}, {x: sheetBox.x + 12, y: dest.y - 8}];
    // context caption (top strip)
    const cap = ctx.show('all') && p.contextLabels.context ? caption(ctx, p.contextLabels.context, {x: D.w / 2, y: (CAP - 30) / 2, anchor: 'middle', maxWidth: D.w - 60, size: Math.max(28, S), maxLines: 2, weight: 600, fill: th.fg, name: 'ctx-cap'}) : null;
    // changed-datum marker: a badge at the term's top-left corner and a chip above the extract,
    // its leader running down the extract's left margin to the term (it crosses no text)
    const tb2 = sheet.termBox2;
    // (review round 3: the badge sat on the line above the term; it now lies in the extract's left
    // margin, centred on the term's line, clear of every word)
    // (a narrow margin: the badge straddles the extract's edge onto the desk rather than shrink)
    const badgeR = 15;
    const badgeAt = inS({x: Math.min(tb2.x / 2 - 1, tb2.x - badgeR - 5), y: tb2.y + tb2.h / 2});
    const badge = g({name: 'badge', opacity: 0, transform: T(badgeAt.x, badgeAt.y, 0, badgeR / 17)},
      // (neutral "changed" marker, as in the accepted inspect scenes: a white Δ on the accent2 disc)
      h('circle', {r: 17, fill: th.accent2, stroke: th.paper, 'stroke-width': 3}),
      h('path', {d: 'M0 -8L8 6H-8Z', fill: 'none', stroke: '#fff', 'stroke-width': 2.8, 'stroke-linejoin': 'round'}));
    let marker = null, leaderPath = null;
    if (ctx.show('all') && p.contextLabels.marker) {
      // the chip lies under the extract, where the inset stood (it has gone by then); its leader
      // runs up the extract's left margin to the term's line (it crosses no text)
      const mOpts = {x: sheetBox.x + 2, anchor: 'start', maxWidth: Math.max(docW, dest.w) - 16, size: S, minSize: S, maxLines: 3, weight: 700, fill: th.card, stroke: th.accent2, color: th.ink, name: 'marker-chip'};
      const mc = chip(ctx, p.contextLabels.marker, {...mOpts, y: row2.y + 10});
      // wide/square: straight up the extract's left margin to the badge (the cord leaves to the right);
      // tall: the cord runs down the page's left margin, so the leader takes the desk's own margin,
      // left of every document, and turns in along the term's line (review round 3)
      const my = mc.box.y + mc.box.h / 2;
      const deskLane = inner.x - dpad / 2;
      const d = tall
        ? `M${r(mc.box.x)} ${r(my)}H${r(deskLane)}V${r(badgeAt.y)}H${r(badgeAt.x - badgeR - 3)}`
        : `M${r(badgeAt.x)} ${r(mc.box.y)}V${r(badgeAt.y + badgeR + 3)}`;
      leaderPath = tall
        ? [{x: mc.box.x, y: my}, {x: deskLane, y: my}, {x: deskLane, y: badgeAt.y}, {x: badgeAt.x - badgeR - 3, y: badgeAt.y}]
        : [{x: badgeAt.x, y: mc.box.y}, {x: badgeAt.x, y: badgeAt.y + badgeR + 3}];
      marker = {node: g({name: 'marker', opacity: 0}, h('path', {d, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '8 6'}), mc.node), box: mc.box};
    }
    // no entry for the new term: a descriptive tag lies over a filler row of the page
    const freeRow = [0, 1, 2].find(i => i !== bRow && i !== aRow) ?? 0;
    const fr = rowBox(freeRow);
    const noEntryTag = aRow < 0 && ctx.show('key') ? chip(ctx, t.noEntryState, {x: fr.x + fr.w / 2, y: fr.y + 4, anchor: 'middle', maxWidth: fr.w, size: S, minSize: S, maxLines: 3, name: 'noentry', weight: 600}) : null;
    // the cord is routed through free space: along the term's own line to the lane between the
    // documents, then to the entry's pin in the page's left margin (it crosses no text)
    const laneX = sheetBox.x + docW + gapC / 2;
    const laneY = sheetBox.y + sheetBox.h + gapC / 2;
    const rightX = sheetBox.x + docW - 14;
    const cordPts = (a, b) => (tall
      ? [a, {x: rightX, y: a.y}, {x: rightX, y: laneY}, {x: b.x, y: laneY}, b]
      : [a, {x: laneX, y: a.y}, {x: laneX, y: b.y}, b]);
    const pins = pinPair(ctx, {prefix: 'pins', cordPath: (a, b) => cordPts(a, b).map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('')});
    const alongCord = (a, b, k) => {
      const pts = cordPts(a, b);
      const lens2 = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
      let d = k * lens2.reduce((x, y) => x + y, 0);
      for (let i = 0; i < lens2.length; i++) {
        if (d <= lens2[i] || i === lens2.length - 1) return mix(pts[i], pts[i + 1], lens2[i] ? Math.min(1, d / lens2[i]) : 0);
        d -= lens2[i];
      }
      return b;
    };
    const cS = {x: src.x + src.w / 2, y: src.y + src.h / 2};
    const lensWordsWhole = [sheet.termBox, sheet.termBox2].every(b => b.x >= srcL.x && b.y >= srcL.y && b.x + b.w <= srcL.x + srcL.w && b.y + b.h <= srcL.y + srcL.h);
    // the parked magnifier (and its handle) keeps clear of the documents, the plate and the inset
    // the changed-datum leader never runs alongside the (final) cord: the smallest gap between
    // parallel, overlapping runs of the two paths (design units; Infinity when none)
    const finalCord = cordPts(pinA2, aRow >= 0 ? entryPin(aRow) : pinA2);
    const parGap = (A, B) => {
      let best = Infinity;
      for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) {
        const a0 = A[i - 1], a1 = A[i], b0 = B[j - 1], b1 = B[j];
        const av = Math.abs(a0.x - a1.x) < 0.5, bv = Math.abs(b0.x - b1.x) < 0.5;
        const ah = Math.abs(a0.y - a1.y) < 0.5, bh = Math.abs(b0.y - b1.y) < 0.5;
        if (av && bv) {
          const ov = Math.min(Math.max(a0.y, a1.y), Math.max(b0.y, b1.y)) - Math.max(Math.min(a0.y, a1.y), Math.min(b0.y, b1.y));
          if (ov > 20) best = Math.min(best, Math.abs(a0.x - b0.x));
        } else if (ah && bh) {
          const ov = Math.min(Math.max(a0.x, a1.x), Math.max(b0.x, b1.x)) - Math.max(Math.min(a0.x, a1.x), Math.min(b0.x, b1.x));
          if (ov > 20) best = Math.min(best, Math.abs(a0.y - b0.y));
        }
      }
      return best;
    };
    const leaderCordGap = leaderPath && aRow >= 0 ? parGap(leaderPath, finalCord) : Infinity;
    const deskRect = {x: m, y: CAP + 4, w: D.w - 2 * m, h: D.h - CAP - 4 - m};
    const magInside = magBox.x >= deskRect.x + dpad * 0.3 && magBox.y >= deskRect.y + dpad * 0.3 && magBox.x + magBox.w <= deskRect.x + deskRect.w - dpad * 0.3 && magBox.y + magBox.h <= deskRect.y + deskRect.h - dpad * 0.3;
    const magClear = ![sheetBox, pageBox, {x: flagsAt.x, y: flagsAt.y, w: flagW, h: flags.h}, ann && ann.box, dest].filter(Boolean).some(b => overlaps(magBox, b, 4));
    return {alongCord, desk, sheet, page, flags, flagsAt, flagW, sheetBox, pageBox, capExtract, capHier, pinA1, pinA2, entryPin, rowBox, src, dest, lens, zoom: dest.w / src.w, ann, leaderPts, cap, badge, marker, noEntryTag, mag, magSpot, magAngle: MAG_ANGLE, magInside, leaderCordGap, k0, pins, cS, bRow, aRow, dL, lensWordsWhole, magClear, row2};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.cap && g({name: 'cap-g', opacity: 0}, L.cap.node),
      L.desk.surface,
      g({'clip-path': L.desk.clip},
        g({transform: T(L.sheetBox.x, L.sheetBox.y)}, L.sheet.node),
        g({transform: T(L.flagsAt.x, L.flagsAt.y)}, L.flags.node),
        g({transform: T(L.pageBox.x, L.pageBox.y)}, L.page.node),
        L.capExtract && L.capExtract.node,
        L.capHier && L.capHier.node,
        L.noEntryTag && g({name: 'noentry-g', opacity: 0}, L.noEntryTag.node),
        L.pins.node,
        h('circle', {name: 'pulse', r: 14, fill: linkColor(ctx), opacity: 0}),
        L.badge,
        L.mag.node,
        L.ann && L.ann.node,
        h('path', {name: 'lens-leader', d: L.leaderPts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0}),
        L.lens.node,
        L.marker && L.marker.node,
      ),
      L.desk.frame,
    );
  },
  frame(ctx, L, u) {
    const E = ease.inOutCubic;
    const w = key => seg(u, ...W[key]);
    const nodes = {};
    const swapped = u >= SWAP_AT;
    const upd = E(w('update'));
    const bRow = L.bRow, aRow = L.aRow;
    const rowHl = i => (i === bRow ? 1 - (swapped ? upd : 0) : i === aRow ? (swapped ? upd : 0) : 0);
    Object.assign(nodes, pageMarks('page', 3, rowHl));
    nodes[`flags-flag${L.dL}-ring`] = {opacity: 1};
    // context word and its marks (the new word appears only once the inset covers the spot)
    // (review round 3: the inset no longer flies back over the page; it closes where it stands and the
    // context word cross-fades in place, old → new)
    const xf = E(w('fade'));
    nodes['sheet-termtext'] = {opacity: r(1 - xf, 3)};
    nodes['sheet-termtext2'] = {opacity: r(xf, 3)};
    nodes['sheet-termhl'] = {opacity: r(1 - xf, 3)};
    nodes['sheet-termhl2'] = {opacity: r(xf, 3)};
    nodes['sheet-termring'] = {opacity: r(1 - xf, 3)};
    nodes['sheet-termring2'] = {opacity: r(xf, 3)};
    // dependent connection: pin A to the new word's end; pin B to the entry listing it (or back to pin A)
    const pinA = mix(L.pinA1, L.pinA2, swapped ? upd : 0);
    const dockOld = L.entryPin(bRow);
    const dockNew = aRow >= 0 ? L.entryPin(aRow) : L.pinA2;
    const pinB = swapped ? mix(dockOld, dockNew, upd) : dockOld;
    const retract = aRow < 0 && swapped && upd >= 1;
    Object.assign(nodes, L.pins.frame({a: pinA, b: pinB, aScale: 0.92, bScale: 0.92, coil: 0, cord: retract ? 0 : 1}));
    if (retract) nodes['pins-b'] = {transform: T(pinB.x, pinB.y, 0, 0.92), opacity: 0};
    else nodes['pins-b'] = {...nodes['pins-b'], opacity: 1};
    // build: a pulse runs along the cord (term → definition)
    const pu = w('pulse');
    const pp = L.alongCord(L.pinA1, dockOld, pu);
    nodes.pulse = {transform: T(pp.x, pp.y), opacity: pu > 0 && pu < 1 ? 0.8 : 0};
    if (L.cap) nodes['cap-g'] = {opacity: r(w('caption'), 3)};
    // the parked magnifier (a prop at rest, in its free corner)
    Object.assign(nodes, L.mag.frame({x: L.magSpot.x, y: L.magSpot.y, angle: L.magAngle, zoom: 1}));
    // inset: fades in at its place (its leader ties it to the source frame), holds, then fades out
    // where it stands — it never travels across the documents (review round 3)
    const open = E(w('open'));
    const close = E(w('close'));
    const lp = open;
    Object.assign(nodes, L.lens.frame(1));
    const winOn = lp > 0.001 && close < 1;
    nodes['lens-win'] = {opacity: winOn ? r(lp * (1 - close), 3) : 0};
    nodes['lens-src'] = {opacity: winOn ? r(Math.min(1, lp * 2) * (1 - close), 3) : 0};
    nodes['lens-leader'] = {opacity: r(clamp(lp * 1.4 - 0.4) * (1 - close), 3)};
    // inside the inset: the old word lifts out, then the new word drops in
    const lift = E(w('liftOld')), drop = E(w('dropNew'));
    nodes['lz-termtext'] = {transform: T(0, -26 * lift), opacity: r(1 - lift, 3)};
    nodes['lz-termhl'] = {opacity: r(1 - lift, 3)};
    nodes['lz-termring'] = {opacity: r(1 - lift, 3)};
    nodes['lz-termtext2'] = {transform: T(0, -26 * (1 - drop)), opacity: r(drop, 3)};
    nodes['lz-termhl2'] = {opacity: r(drop, 3)};
    nodes['lz-termring2'] = {opacity: r(drop, 3)};
    const pinIn = mix(L.pinA1, L.pinA2, drop);
    nodes['lz-pin'] = {transform: T(pinIn.x, pinIn.y, 0, 0.92)};
    // annotation: before value, struck through at the substitution; after value; stays with the marker
    if (L.ann) {
      nodes.ann = {opacity: r(w('ann'), 3)};
      const sk = E(w('strike'));
      nodes['ann-strike'] = {x2: r(lerp(L.ann.box.x + 26, L.ann.strikeX, sk)), opacity: sk > 0 ? 1 : 0};
      nodes['ann-b'] = {opacity: r(1 - 0.45 * sk, 3)};
      const aa = w('annAfter');
      nodes['ann-a'] = {opacity: r(aa, 3)};
      nodes['ann-arrow'] = {opacity: r(aa, 3)};
    }
    const mk = w('marker');
    nodes.badge = {opacity: r(mk, 3)};
    if (L.marker) nodes.marker = {opacity: r(mk, 3)};
    if (L.noEntryTag) nodes['noentry-g'] = {opacity: r(aRow < 0 ? mk : 0, 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const inLens = L.lens.map(L.cS, 1);
    const at = L.lens.at(1);
    return {nodes, semantic: {
      beat,
      datum: swapped ? 'after' : 'before',
      contextValue: swapped ? ctx.params.afterValue : ctx.params.beforeValue,
      lensValue: drop >= 1 ? 'after' : lift < 1 ? 'before' : 'none',
      lensOpen: r(lp, 3),
      lensVisible: nodes['lens-win'].opacity > 0,
      lensZoom: r(L.zoom, 3),
      sourceCentre: P2(L.cS),
      sourceRect: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
      sourceInLens: P2(inLens),
      lensCentre: P2({x: at.x + at.w / 2, y: at.y + at.h / 2}),
      oldStruck: L.ann ? w('strike') >= 1 : null,
      pinA: P2(pinA),
      pinB: P2(pinB),
      linkedRow: swapped && upd >= 1 ? (aRow >= 0 ? aRow + 1 : 0) : bRow + 1,
      cordShown: !retract,
      marker: r(mk, 3),
      rowHl: [0, 1, 2].map(i => r(rowHl(i), 3)),
      allReached: true,
      lensInset: true,
      lensWordsWhole: L.lensWordsWhole,
      annInsideDesk: L.ann ? L.ann.box.y + L.ann.box.h <= L.row2.y + L.row2.h + 30 : true,
      magnifierClear: L.magClear,
      magnifierInside: L.magInside,
      leaderCordGapPx: Number.isFinite(L.leaderCordGap) ? r(L.leaderCordGap * L.k0, 1) : null,
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-02-inspect',
    title: 'Legislative definition — inspect the term and swap it',
    titleEs: 'Definición legislativa — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Definición legislativa',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The desk after the term was pinned to its definition in another section. A rectangular inset window lifts a real enlarged copy of the term and its pin; the term is replaced by an alternative value (the old one struck through, still readable); back in context only the dependent connection moves — the cord re-pins to the entry that lists the new term, or keeps no far end when none does — and a changed-datum marker stays. Seeking back restores the old datum.',
    tags: ['definition', 'defined term', 'inspect', 'magnifier', 'lens', 'substitution', 'cord', 'entry'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/definicion-legislativa.js', 'src/primitives/annotate.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
