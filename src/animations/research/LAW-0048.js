/**
 * LAW-0048 — Cita localizada · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the library nook in the state the reference produced —
 *              parts at their places, the volume open on the board, the
 *              pinpointed paragraph highlighted and tagged "¶ 3"; a caption
 *              names the context. Paragraph tags are pinned to the right end
 *              of their paragraph but sit beside the page (as in LAW-0045), so
 *              the highlighted lines stay visible whatever the tag's length.
 *  [0.20–0.45] isolate: a lens lifts a real enlarged copy of the pinpointed
 *              passage (the same page drawn again at the same coordinates,
 *              with its paragraph tag) out of the scene, which dims; the
 *              before-value appears as the single editorial annotation, whose
 *              paper plate encloses its label and both values. In square
 *              frames where long tags would leave the lens weakly magnified,
 *              it takes the free area under the annotation and the tags above
 *              the spread (bookcase and left page, above the card).
 *  [0.45–0.75] substitute: inside the lens the pinpoint is replaced — the old
 *              value lifts out (and is struck through in the annotation, so
 *              it stays traceable), the new value drops in, and the tag and
 *              highlight slide to the paragraph it designates. With no new
 *              paragraph (row 0) the tag leaves and the highlight retracts:
 *              the reference becomes incomplete.
 *  [0.75–1.00] return: as the lens starts back, the context's old tag lifts
 *              out and its highlight retracts (never beside the lens's new
 *              ones); the opaque lens closes exactly onto its source, the new
 *              tag and highlight appear under it, it fades away, then the
 *              index card takes the new value and a "changed" marker appears,
 *              its callout on the free board beside the book with a short
 *              leader. A context label the flying lens starts to cover fades
 *              out rather than showing a fragment. Seeking back restores the
 *              old datum exactly. No validity or outcome is inferred.
 * @module animations/research/LAW-0048
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {inspectFields, obj, int, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {libraryStage, STAGE, researchFields, citationParts, KIT_STRINGS, segToken, cloneNamed, renameFrame, bookRig} from './kits/cita-localizada.js';

const ID = 'LAW-0048';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.02, 0.1], sweep: [0.05, 0.16], open: [0.22, 0.42], before: [0.36, 0.44],
  strike: [0.47, 0.53], swap: [0.5, 0.58], move: [0.58, 0.7], after: [0.64, 0.71],
  // return: the lens closes exactly onto its source (opaque), the context
  // under it takes the new state while covered, then the lens fades away;
  // only after that do the card and the marker change
  close: [0.75, 0.84], land: [0.84, 0.87], ctxUpdate: [0.87, 0.92], marker: [0.91, 0.97],
  // as the lens starts back, the context's old pinpoint marks (tag lifts out,
  // highlight retracts) leave the page, so they never sit beside the lens's
  // new ones; the new marks appear under the landed lens
  withdraw: [0.75, 0.79],
};

const {pinpointRow: _unusedRow, ...researchBase} = researchFields;
const sceneSchema = {
  ...researchBase,
  ...inspectFields(['paragraph']),
  pinpointRows: obj('Which paragraph of the drawn page each value designates (0 = no paragraph: the reference becomes incomplete)', {
    before: int('Paragraph designated by the before value (1 = first on the page)', 1, 5),
    after: int('Paragraph designated by the after value (0 = none)', 0, 5),
  }, ['before', 'after']),
};
sceneSchema.query = {...sceneSchema.query, description: 'The reference as written on the index card up to the inspected pinpoint (fictional); the pinpoint itself is the before/after value'};
sceneSchema.detailGeometry.properties.zoom.description = 'Wanted magnification of the lens (reduced when the free area is smaller)';
sceneSchema.detailGeometry.properties.placement.description = "Where the lens sits: 'top' over the search panel when the lens still magnifies the detail there; otherwise (and for every other value) over the bookcase";

const defaultParams = {
  query: 'Casebook of Examples, 4, 112,',
  sources: ['Journal of Sample Studies', 'Casebook of Examples', 'Practice Notes'],
  citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: '¶ 3'}],
  dates: ['Noted on day 12', 'Edition of day 3'],
  focusTarget: 'paragraph',
  beforeValue: '¶ 3',
  afterValue: '¶ 5',
  pinpointRows: {before: 3, after: 5},
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'The located passage on the reading board', marker: 'Datum changed'},
};

const STRINGS = {
  en: {paragraphPin: 'Paragraph pinpoint'},
  es: {paragraphPin: 'Referencia de párrafo'},
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const CAP = 64; // caption strip above the stage (design units)
const CALLOUT_PAD = 0.45; // side padding of the changed-datum callout (× its text size)
const LIFT = 12; // lift-out / drop-in offset of the paragraph tags inside the lens (stage units)

/** Free area (stage coordinates) where the lens may sit, per axis and placement. */
function lensSpace(axis, placement, st) {
  const left = {horizontal: {x: 40, y: 60, w: 560, h: 780}, square: {x: 36, y: 250, w: 452, h: 800}, vertical: {x: 36, y: 222, w: 650, h: 600}};
  const top = {horizontal: {x: 620, y: 34, w: 950, h: 330}, square: {x: 36, y: 26, w: 1128, h: 380}, vertical: {x: 36, y: 26, w: 928, h: 560}};
  if (placement === 'top') return top[axis];
  return left[axis];
}

const scene = {
  sizes: {landscape: [1600, 900 + CAP], square: [1300, 1100 + CAP], portrait: [1000, 1400 + CAP]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = {...KIT_STRINGS.en, ...(KIT_STRINGS[p.locale] || {}), ...ctx.t};
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const k = Math.min(D.w / st.w, (D.h - CAP) / st.h);
    const sx = (D.w - st.w * k) / 2, sy = CAP + ((D.h - CAP) - st.h * k) / 2;
    const before = p.pinpointRows.before, after = p.pinpointRows.after;
    // the stage shows the reference with the before value as its pinpoint
    const cit = {...p.citations[0], paragraph: p.beforeValue};
    const parts = citationParts(p, cit);
    // the paragraph tags are pinned to the right end of their paragraph but sit
    // BESIDE the page (on the board, overlapping only the page's outer margin,
    // as in LAW-0045), so the highlighted lines stay visible past them whatever
    // the tag's length; the lens source takes the tags in whole
    const stageOpts = {prefix: 'st', axis, params: {...p, citations: [cit, ...p.citations.slice(1)], pinpointRow: before, actorLabels: {a: ''}}, parts, chips: false, trails: false, cardTilt: false,
      avoidRows: [],
      cardRef: p.query, cardAppend: {text: p.beforeValue, mode: 'text', key: 'paragraph', alt: after > 0 ? p.afterValue : ''}, stripText: `${p.query} ${p.beforeValue}`};
    const probe = libraryStage(ctx, stageOpts);
    const tokB = probe.tokens[3];
    const pageX0 = probe.hinge.x, pageX1 = probe.hinge.x + probe.pageW, pageW = probe.pageW;
    const dockFor = (row, tk) => probe.paraDockAt(row, tk.w);
    // the after value's tag (context and lens copies) sized like the stage's tags
    const mkAfter = name => segToken(ctx, {name, key: 'paragraph', text: p.afterValue, size: tokB.size, maxWidth: Math.max(tokB.alloc, tokB.w * 1.6), maxLines: 3, minRatio: 0.9});
    const afterTok = mkAfter('ctx-after');
    const dockB = dockFor(before, tokB);
    const dockA = after > 0 ? dockFor(after, afterTok) : dockB;
    const boxAt = (d, tk) => ({x: d.x - tk.w / 2, y: d.y - tk.h / 2, w: tk.w, h: tk.h});
    const tagBoxesS = [boxAt(dockB, tokB), after > 0 ? boxAt(dockA, afterTok) : null].filter(Boolean);

    // lens source (stage units): the pinpointed rows of the right page and their
    // whole tags, with room for a tag's lift-out / drop-in; it starts far enough
    // left to keep a good part of the highlighted lines beside the tags
    const rows = after > 0 ? [before, after] : [before];
    const r0 = Math.min(...rows), r1 = Math.max(...rows);
    const top = probe.paraBox(r1 === r0 && r0 > 1 ? r0 - 1 : r0);
    const bot = probe.paraBox(r1 === r0 && r1 < 5 ? r1 + 1 : r1);
    const TM = 14; // (≥ the lens copy's lift-out / drop-in offset, LIFT)
    const tagL = Math.min(...tagBoxesS.map(b => b.x));
    const srcX1 = Math.min(st.w - 4, Math.max(...tagBoxesS.map(b => b.x + b.w)) + 12);
    // (never above the spread's top edge: the page tag above it is not in the copy)
    const srcY0 = Math.max(probe.spreadTop - 4, Math.min(top.y - 14, ...tagBoxesS.map(b => b.y - TM)));
    const srcY1 = Math.min(st.h - 4, Math.max(bot.y + bot.h + 14, ...tagBoxesS.map(b => b.y + b.h + TM)));
    const toDesign = q => ({x: sx + q.x * k, y: sy + q.y * k});
    const srcAt = x0 => ({x: x0, y: srcY0, w: srcX1 - x0, h: srcY1 - srcY0});
    const baseX0 = pageX0 + pageW * 0.05;
    const minVis = pageW * 0.42; // page width left visible beside the tags in the lens
    const srcX0s = [...new Set([baseX0, pageX0 + pageW * 0.25, tagL - minVis].map(x => Math.max(baseX0, Math.min(x, tagL - minVis))))].sort((a, b) => a - b);

    // card: its usual rest place unless a paragraph tag or the lens source
    // would touch it; then the higher place (a little smaller and pushed to the
    // board's top edge when a tag at the first row still reaches it). Tags must
    // stay clear of it; a card still inside the source is copied into the lens.
    const G = probe.G;
    const cardBoxAt = c => { const w = G.card.w * c.k, hh = G.card.h * c.k; return {x: c.x - w / 2, y: c.y - hh / 2, w, h: hh}; };
    const grow = (b, m) => ({x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2});
    const areaOf = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const narrowSrc = srcAt(srcX0s[srcX0s.length - 1]);
    const cardScore = c => {
      const b = grow(cardBoxAt(c), 12);
      return tagBoxesS.reduce((sum, t) => sum + areaOf(b, t), 0) * 10 + areaOf(b, narrowSrc);
    };
    const asRest = a => ({x: a[0], y: a[1], rot: 0, k: a[3] ?? 1});
    const cands = [{...asRest(G.card.rest), dflt: true}];
    if (!G.card.ledge && G.card.restHigh) {
      const hi = asRest(G.card.restHigh);
      cands.push(hi);
      const kf = 0.85;
      const top = probe.boardBox.y0 + 8;
      cands.push({x: hi.x + (G.card.w * (hi.k - kf)) / 2, y: top + (G.card.h * kf) / 2, rot: 0, k: kf});
    }
    const cardAt = cands.reduce((a, b) => (cardScore(b) < cardScore(a) - 1e-6 ? b : a));
    const stage = cardAt.dflt ? probe : libraryStage(ctx, {...stageOpts, cardRest: {x: cardAt.x, y: cardAt.y, rot: cardAt.rot, k: cardAt.k}});
    const annTop = stage.tRow !== 0; // keep the docked source tag uncovered
    // single editorial annotation (sizes; placed once the lens space is known)
    const label = STRINGS[p.locale] ? STRINGS[p.locale].paragraphPin : STRINGS.en.paragraphPin;
    const annSize = 34 * Math.max(1, k * 1.1);
    const pad = annSize * 1.2;
    const oneLine = text => ctx.measure(text, annSize, 600, 'sans') + pad;
    const sideFits = w => oneLine(p.beforeValue) + oneLine(p.afterValue) + 80 <= w - 20;
    // tall frames: when the two values only fit side by side across the free
    // wall right of the bookcase, the annotation spans it (one row of chips
    // instead of a stack), so its plate ends above the top shelf's label and
    // the resting card
    let annWide = null;
    if (axis === 'vertical' && annTop && p.detailGeometry.placement !== 'top') {
      const sp = lensSpace(axis, p.detailGeometry.placement, st);
      const spD = toDesign(sp);
      const wideW = sx + (st.w - 16) * k - spD.x;
      if (!sideFits(sp.w * k) && sideFits(wideW)) {
        const labH = ctx.show('key') ? caption(ctx, label, {x: 0, y: 0, maxWidth: wideW - 40, size: annSize * 0.8, maxLines: 1, weight: 700}).box.h + 10 : 0;
        const chipH = chip(ctx, `${p.beforeValue} ${p.afterValue}`, {x: 0, y: 0, maxWidth: wideW, size: annSize, maxLines: 1}).box.h;
        const plateH = 12 + labH + chipH + 12;
        const shelfTop = Math.min(...stage.bc.plates.map(pl => sy + pl.y * k));
        const cardTop = sy + stage.cardRestBox.y * k;
        if (spD.y + 8 + plateH + 8 < Math.min(shelfTop, cardTop)) annWide = {x: spD.x, w: wideW, h: plateH};
      }
    }
    const annH = annWide ? annWide.h + 30 : 150 * Math.max(1, k * 1.1) * (ctx.measure(`${p.beforeValue} ${p.afterValue}`, 34, 600, 'sans') + 180 > 540 ? 1.7 : 1);
    // the single editorial annotation laid out at a place (design units):
    // label, then before → after (the old value stays, struck); side by side
    // when both values fit on a line each, otherwise stacked (before above,
    // after below); sizes never break a word. Its paper plate encloses the
    // label and BOTH chips (reviewer round 6: a long after value, wider than
    // the before value and the label, stuck out of the plate's left edge) and
    // wholly covers any shelf label it would half cover.
    const wordSize = (text, maxW) => {
      const longest = Math.max(...String(text).split(/\s+/).map(wd => ctx.measure(wd, 1, 600, 'sans')));
      return Math.max(annSize * 0.6, Math.min(annSize, (maxW - pad) / Math.max(1e-6, longest)));
    };
    const layoutAnn = (annX, annY, annW, named) => {
      const nm = n => (named ? n : undefined);
      const annLabel = ctx.show('key') ? caption(ctx, label, {x: annX, y: annY + 12, anchor: 'middle', maxWidth: annW - 40, size: annSize * 0.8, maxLines: 1, weight: 700, name: nm('ann-label'), fill: th.ink}) : null;
      const chipY = annY + 12 + (annLabel ? annLabel.box.h + 10 : 0);
      const side = sideFits(annW);
      let beforeChip = null, afterChip = null, arrowY = 0, arrowX = annX;
      if (ctx.show('key')) {
        if (side) {
          // the pair (before → after) is centred on the annotation as a whole
          const wb = oneLine(p.beforeValue), wa = oneLine(p.afterValue);
          arrowX = annX - (wb + 52 + wa) / 2 + wb + 26;
          beforeChip = chip(ctx, p.beforeValue, {x: arrowX - 26, y: chipY, anchor: 'end', maxWidth: wb + 4, size: annSize, maxLines: 1, fill: th.card, name: nm('ann-before')});
          afterChip = chip(ctx, p.afterValue, {x: arrowX + 26, y: chipY, anchor: 'start', maxWidth: wa + 4, size: annSize, maxLines: 1, fill: th.accentSoft, stroke: th.accent, name: nm('ann-after')});
          arrowY = chipY + beforeChip.box.h / 2;
        } else {
          const mw = annW - 40;
          beforeChip = chip(ctx, p.beforeValue, {x: annX, y: chipY, anchor: 'middle', maxWidth: mw, size: wordSize(p.beforeValue, mw), maxLines: 2, fill: th.card, name: nm('ann-before')});
          arrowY = beforeChip.box.y + beforeChip.box.h + 16;
          afterChip = chip(ctx, p.afterValue, {x: annX, y: arrowY + 16, anchor: 'middle', maxWidth: mw, size: wordSize(p.afterValue, mw), maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: nm('ann-after')});
        }
      }
      // a paper plate behind the annotation keeps it legible over the scene
      let plate = null;
      if (beforeChip) {
        const items = [beforeChip.box, afterChip.box, annLabel && annLabel.box].filter(Boolean);
        const x0 = Math.min(...items.map(b => b.x)) - 18;
        const x1 = Math.max(...items.map(b => b.x + b.w)) + 18;
        const y1 = Math.max(...items.map(b => b.y + b.h)) + 12;
        plate = {x: x0, y: annY, w: x1 - x0, h: y1 - annY};
        // a shelf label half under the plate would read as a collision: cover it fully
        for (const pl of stage.bc.plates) {
          const pb = {x: sx + pl.x * k, y: sy + pl.y * k, w: pl.w * k, h: pl.h * k};
          const hit = pb.x < plate.x + plate.w && pb.x + pb.w > plate.x && pb.y < plate.y + plate.h && pb.y + pb.h > plate.y;
          if (hit) {
            const nx0 = Math.min(plate.x, pb.x - 6), ny1 = Math.max(plate.y + plate.h, pb.y + pb.h + 6);
            const nx1 = Math.max(plate.x + plate.w, pb.x + pb.w + 6);
            plate = {x: nx0, y: plate.y, w: nx1 - nx0, h: ny1 - plate.y};
          }
        }
      }
      return {annLabel, beforeChip, afterChip, arrowY, arrowX, vertical: !side, annPlateBox: plate};
    };
    // keep the lens above the tags that ride over the spread (tall layouts)
    const tagsTop = sy + (stage.spread.y - 8 - Math.max(stage.tokens[1].h, stage.tokens[2].h) - 10) * k;
    const tagsX0 = sx + (stage.volBoard.x - stage.tokens[1].w / 2 - 10) * k;
    const tagsX1 = sx + (stage.docks.page.x + stage.tokens[2].w / 2 + 10) * k;
    const fitLens = (sp, source) => {
      const ratio = source.h / source.w;
      const spD = toDesign(sp);
      // (a space BELOW the annotation and the tags above the spread is used whole)
      const space = sp.below ? {x: spD.x, y: spD.y, w: sp.w * k, h: sp.h * k} : {x: spD.x, y: spD.y + (annTop ? annH : 0), w: sp.w * k, h: sp.h * k - annH};
      const overlapsTags = !sp.below && space.x < tagsX1 && space.x + space.w > tagsX0;
      if (overlapsTags && space.y + space.h > tagsTop) space.h = Math.max(120, tagsTop - space.y);
      let dw = Math.min(space.w, source.w * p.detailGeometry.zoom);
      if (dw * ratio > space.h) dw = space.h / ratio;
      return {space0: sp, sp0: spD, source, dest: {x: space.x + (space.w - dw) / 2, y: space.y + (space.h - dw * ratio) / 2, w: dw, h: dw * ratio}};
    };
    const spacesFor = placement => {
      const spaces = [lensSpace(axis, placement, st)];
      if (axis === 'square' && placement !== 'top') {
        // square: the lens may also cover the left page (never the source) up to
        // the tags above the spread, staying above the resting card; the space
        // that gives the larger magnification is used
        const b = spaces[0];
        const x1 = stage.volBoard.x - stage.tokens[1].w / 2 - 24;
        const y1 = stage.cardRestBox.y - 10;
        spaces.push({x: b.x, y: b.y, w: Math.max(b.w, x1 - b.x), h: Math.min(b.h, y1 - b.y)});
      }
      return spaces;
    };
    // the widest source (most of the page) that still gets most of the wanted
    // magnification; otherwise the one that magnifies most
    const want = 0.85 * Math.min(p.detailGeometry.zoom, 2.2);
    // (a space may depend on the source: a function of it in stage units)
    const fitIn = spaces => {
      const fits = srcX0s.map(x0 => {
        const s = srcAt(x0);
        const d = toDesign(s);
        const source = {x: d.x, y: d.y, w: s.w * k, h: s.h * k};
        const f = spaces.map(sp => fitLens(typeof sp === 'function' ? sp(s) : sp, source)).reduce((a, b) => (b.dest.w > a.dest.w + 1 ? b : a));
        return {...f, zoom: f.dest.w / source.w};
      });
      return fits.find(f => f.zoom >= want) || fits.reduce((a, b) => (b.zoom > a.zoom + 1e-6 ? b : a));
    };
    let fitted = fitIn(spacesFor(p.detailGeometry.placement));
    // a 'top' lens that would not magnify the detail (too little room under
    // the annotation) gives way to the default place over the bookcase
    if (p.detailGeometry.placement === 'top' && fitted.zoom < 1.25) {
      const alt = fitIn(spacesFor('auto'));
      if (alt.zoom > fitted.zoom) fitted = alt;
    }
    // where the annotation goes for a fitted lens (design units)
    const annPlace = f => ({
      x: annWide ? annWide.x + annWide.w / 2 : f.sp0.x + f.space0.w * k / 2,
      y: annTop ? f.sp0.y + 8 : f.dest.y + f.dest.h + 18,
      w: annWide ? annWide.w : f.space0.w * k,
    });
    // square frames (reviewer round 6, minor): when neither place magnifies the
    // detail enough (long tags make the source wide, long values stack the
    // annotation), the lens may use the free area BELOW the annotation's plate
    // and the tags above the spread, across the bookcase and the left page up
    // to the source, above the resting card. The annotation keeps its place.
    if (axis === 'square' && annTop && p.detailGeometry.placement !== 'top' && fitted.zoom < want) {
      const a0 = fitted.space0;
      const pl = annPlace(fitted);
      const plate = layoutAnn(pl.x, pl.y, pl.w, false).annPlateBox;
      const annBot = plate ? (plate.y + plate.h - sy) / k : a0.y;
      const tagsBot = Math.max(stage.volBoard.y + stage.tokens[1].h / 2, stage.docks.page.y + stage.tokens[2].h / 2);
      const y0 = Math.max(annBot, tagsBot) + 16;
      const y1 = stage.cardRestBox.y - 10;
      if (y1 - y0 > 160) {
        const below = s => ({x: a0.x, y: y0, w: Math.max(40, s.x - 24 - a0.x), h: y1 - y0, below: true});
        const alt = fitIn([below]);
        if (alt.zoom > fitted.zoom + 0.05) fitted = {...alt, space0: a0, sp0: fitted.sp0};
      }
    }
    const {dest, source} = fitted;

    // lens content: the same book and tags drawn again in the same coordinates
    const bc = stage.bc;
    const book2 = bookRig(ctx, {prefix: 'lb', t: bc.bookT, hB: bc.bookH, cw: bc.bookW, volume: parts[1].text, source: cit.source, page: parts[2].text, date: p.dates[1] || '', seedKey: 'cita-book'});
    const tokCopy = cloneNamed(tokB.node, 'lens-');
    const afterLens = mkAfter('lens-after');
    // the resting card, when part of it lies in the source, is copied too
    const srcS = {x: (source.x - sx) / k, y: (source.y - sy) / k, w: source.w / k, h: source.h / k};
    const cardCopy = areaOf(cardBoxAt(cardAt), srcS) > 0 ? cloneNamed(stage.card.node, 'lens-') : null;
    const cardCopyNames = [];
    const collect = n => { if (!n || typeof n !== 'object') return; if (n.attrs && n.attrs.name) cardCopyNames.push(n.attrs.name); (n.children || []).forEach(collect); };
    collect(cardCopy);
    // (wall and board are copied too, so the enlarged region is a real copy)
    const lensContent = g({transform: T(sx, sy, 0, k)}, h('path', {d: stage.wallPath, fill: '#ece5d6'}), cloneNamed(stage.boardNode, 'lens-'), book2.node, cardCopy, tokCopy, after > 0 ? afterLens.node : null);
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // single editorial annotation: label, then before → after (the old value stays, struck)
    const annAt = annPlace(fitted);
    const {annLabel, beforeChip, afterChip, arrowY, arrowX, vertical, annPlateBox} = layoutAnn(annAt.x, annAt.y, annAt.w, true);
    const annPlate = annPlateBox ? h('path', {name: 'ann-plate', d: roundRectPath(annPlateBox.x, annPlateBox.y, annPlateBox.w, annPlateBox.h, 14), fill: th.paper, stroke: th.ink, 'stroke-width': 2}) : null;
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: sx + 8, y: 8, maxWidth: st.w * k - 16, size: 34, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // changed-datum marker: pinned to the tag that now carries the datum, or
    // (no new paragraph) to the paragraph the pinpoint used to designate, which
    // gets a dashed outline; a neutral "changed" glyph (swap arrows, not a
    // check). Its callout lies wholly on the reading board, outside the open
    // book (pages, printed headers), the card and the tags, as near the disc
    // as possible, joined to it by a short leader that leaves the page at once.
    const hi = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const oldPara = stage.paraBox(before);
    const MR = 20;
    // the disc sits OUTSIDE the new tag, on a measured corner (its centre
    // beyond the tag's edges), so it never covers the substituted value: the
    // top-right corner first, else the bottom-right one; of these places, the
    // first clear of the resting card (and inside the stage) whose callout
    // finds room on the board
    const Rs = MR / k;
    const tagTR = {x: dockA.x + afterTok.w / 2, y: dockA.y - afterTok.h / 2};
    const tagBot = dockA.y + afterTok.h / 2;
    const cardB = stage.cardRestBox;
    const offCard = q => q.x + Rs < cardB.x || q.x - Rs > cardB.x + cardB.w || q.y + Rs < cardB.y || q.y - Rs > cardB.y + cardB.h;
    // (the disc stays wholly inside the stage: a tag near its right border takes it further left)
    const inStage = q => q.x + Rs <= stage.W - 6 && q.y - Rs >= 6 && q.y + Rs <= stage.H - 6;
    const CORNER = [[0.55, 0.55], [0.15, 0.85], [-0.4, 1], [-1, 1.05], [-1.6, 1.05]];
    const corners = [...CORNER.map(([ax, ay]) => ({x: tagTR.x + ax * Rs, y: tagTR.y - ay * Rs})), ...CORNER.map(([ax, ay]) => ({x: tagTR.x + ax * Rs, y: tagBot + ay * Rs}))];
    const discCands = after > 0
      ? (() => { const ok = corners.filter(q => offCard(q) && inStage(q)); return ok.length ? ok : [corners.find(inStage) || corners[0]]; })()
      : [{x: pageX1 - 10, y: oldPara.y + 2}];
    let mkS = discCands[0];
    let mk = toDesign(mkS);
    let markChip = null;
    let markLeader = null;
    // where the callout went (stage units) and whether it met every placement rule
    let markPlace = null;
    // the open book (both pages, their printed headers and outline) with a margin
    const bookBox = {x: stage.spread.x - 14, y: stage.spread.y - 14, w: stage.spread.w + 28, h: stage.spread.h + 28};
    if (ctx.show('key')) {
      const text = p.contextLabels.marker;
      // (the old paragraph tag has left the page before the callout appears)
      const tagBoxes = [
        after > 0 ? {x: dockA.x - afterTok.w / 2, y: dockA.y - afterTok.h / 2, w: afterTok.w, h: afterTok.h} : null,
        {x: stage.docks.page.x - stage.tokens[2].w / 2, y: stage.docks.page.y - stage.tokens[2].h / 2, w: stage.tokens[2].w, h: stage.tokens[2].h},
        {x: stage.volBoard.x - stage.tokens[1].w / 2, y: stage.volBoard.y - stage.tokens[1].h / 2, w: stage.tokens[1].w, h: stage.tokens[1].h},
      ].filter(Boolean).map(b => ({x: b.x - 10, y: b.y - 10, w: b.w + 20, h: b.h + 20}));
      const Rd = MR / k;
      // the annotation plate (drawn in design units) stays on screen until the end
      const annS = annPlateBox ? {x: (annPlateBox.x - sx) / k - 8, y: (annPlateBox.y - sy) / k - 8, w: annPlateBox.w / k + 16, h: annPlateBox.h / k + 16} : null;
      const obstacles0 = [
        ...tagBoxes,
        stage.cardRestBox,
        bookBox,
        {x: stage.panel.box.x, y: stage.panel.box.y, w: stage.panel.box.w, h: stage.panel.box.h + 10},
        {x: stage.bc.box.x, y: stage.bc.box.y, w: stage.bc.box.w + 10, h: stage.bc.box.h},
        annS,
      ].filter(Boolean);
      // the callout lies wholly on the reading board's top face (slanted sides,
      // dark front lip excluded), outside the book, the card and the tags
      const B = stage.boardBox;
      const bInset = (B.x1 - B.x0) * 0.03;
      const slope = y => 1 - clamp((y - B.y0) / (B.y1 - B.y0));
      const edgeL = y => B.x0 + bInset * slope(y), edgeR = y => B.x1 - bInset * slope(y);
      const M = 12, lipTop = B.y1 - 22;
      const onBoard = b => b.y >= B.y0 + M && b.y + b.h <= lipTop - 8 && b.x >= edgeL(b.y) + M && b.x + b.w <= edgeR(b.y) - M;
      // candidate shapes: one to three lines, never breaking a word, at a
      // size that stays readable (smaller sizes only when nothing else fits)
      const words = String(text).split(/\s+/).filter(Boolean);
      const shapes = [];
      const seen = new Set();
      for (const size of [28, 26, 24]) {
        const longest = Math.max(1, ...words.map(wd => ctx.measure(wd, size, 600, 'sans')));
        for (const mw of [380, 320, 270, 230, 200, 175, 155, 140, 128]) {
          if (longest + size * CALLOUT_PAD * 2 + 2 > mw) continue;
          const pr = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size, minSize: size, maxLines: 3, padX: size * CALLOUT_PAD});
          if (pr.fit.truncated) continue;
          const key = `${size}|${pr.fit.lines.length}|${Math.round(pr.box.w)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          shapes.push({size, mw, lines: pr.fit.lines.length, w: pr.box.w / k, h: pr.box.h / k});
        }
      }
      // the leader (from the disc's rim to the callout's nearest point) must
      // not cross a tag or the card, and leaves the book at once (the disc
      // sits on the page's right margin: only its first stretch may be on it)
      const inside = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
      const blocks = [...tagBoxes.map(b => ({x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16})), stage.cardRestBox];
      const exitBook = Rd + 26;
      const searchFrom = at0 => {
        const discBox = {x: at0.x - Rd - 8, y: at0.y - Rd - 8, w: Rd * 2 + 16, h: Rd * 2 + 16};
        const obstacles = [...obstacles0, discBox];
        const leaderOf = (b, bound = Infinity) => {
          const q = {x: clamp(at0.x, b.x, b.x + b.w), y: clamp(at0.y, b.y, b.y + b.h)};
          const d = Math.hypot(q.x - at0.x, q.y - at0.y);
          if (d >= bound) return {d, ok: false};
          if (d <= Rd + 4) return {d, ok: true};
          const ux = (q.x - at0.x) / d, uy = (q.y - at0.y) / d;
          for (let i = 0; i <= 16; i++) {
            const sl = Rd + 2 + (d - Rd - 2) * (i / 16);
            const q2 = {x: at0.x + ux * sl, y: at0.y + uy * sl};
            if (blocks.some(o => inside(q2, o)) || (sl > exitBook && inside(q2, stage.spread))) return {d, ok: false};
          }
          return {d, ok: true};
        };
        let found = null;
        const step = 8;
        for (const sh of shapes) {
          const penalty = (28 - sh.size) * 14 + (sh.lines - 1) * 14;
          for (let y = B.y0 + M; y + sh.h <= lipTop - 8; y += step) {
            for (let x = edgeL(y) + M; x + sh.w <= edgeR(y) - M; x += step) {
              const b = {x, y, w: sh.w, h: sh.h};
              if (obstacles.some(o => hi(b, o))) continue;
              const ld = leaderOf(b, found ? found.score - penalty : Infinity);
              if (!ld.ok) continue;
              const score = ld.d + penalty;
              if (!found || score < found.score) found = {score, sh, b, d: ld.d};
            }
          }
        }
        return found && onBoard(found.b) ? found : null;
      };
      let best = null;
      for (const q of discCands) {
        best = searchFrom(q);
        if (best) { mkS = q; break; }
      }
      mk = toDesign(mkS);
      let shape, at;
      if (best) {
        shape = best.sh;
        at = toDesign(best.b);
        markPlace = {...best.b, leader: best.d, size: shape.size, lines: shape.lines, ok: true};
      } else {
        // (nothing free on the board: nearest place in the stage clear of the tags and the card)
        shape = {size: 28, mw: 320};
        const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: 320, size: 28, maxLines: 2});
        const cw = probe.box.w / k, chh = probe.box.h / k;
        const bounds = {x: 16, y: 16, w: stage.W - 32, h: stage.H - 32};
        const cands = [];
        for (const dy of [0, -1, 1, -2, 2, -3, 3]) for (const dx of [Rd + 14, -Rd - 14 - cw]) cands.push({x: mkS.x + dx, y: mkS.y - chh / 2 + dy * chh * 0.6});
        const fb = cands.find(c => c.x >= bounds.x && c.y >= bounds.y && c.x + cw <= bounds.x + bounds.w && c.y + chh <= bounds.y + bounds.h && !tagBoxes.some(o => hi({...c, w: cw, h: chh}, o))) || {x: clamp(mkS.x - cw / 2, bounds.x, bounds.x + bounds.w - cw), y: Math.max(bounds.y, mkS.y - Rd - 14 - chh)};
        at = toDesign(fb);
        markPlace = {...fb, w: cw, h: chh, ok: false};
      }
      markChip = chip(ctx, text, {x: at.x, y: at.y, anchor: 'start', maxWidth: shape.mw, size: shape.size, minSize: shape.size, maxLines: shape.lines ?? 2, padX: shape.lines ? shape.size * CALLOUT_PAD : undefined, fill: th.card, stroke: th.accent, name: 'mark-chip'});
      // leader from the marker to the nearest point of the label
      const b = markChip.box;
      const q = {x: Math.max(b.x, Math.min(mk.x, b.x + b.w)), y: Math.max(b.y, Math.min(mk.y, b.y + b.h))};
      const d = Math.hypot(q.x - mk.x, q.y - mk.y);
      if (d > MR + 4) {
        const ux = (q.x - mk.x) / d, uy = (q.y - mk.y) / d;
        markLeader = h('line', {x1: r(mk.x + ux * MR), y1: r(mk.y + uy * MR), x2: r(q.x), y2: r(q.y), stroke: th.accent, 'stroke-width': 3});
      }
    }
    // the paragraph that lost its pinpoint keeps a dashed outline (no tag, no highlight)
    const lostD = after > 0 ? null : (() => { const a = toDesign(oldPara); return {x: a.x - 4, y: a.y - 4, w: oldPara.w * k + 8, h: oldPara.h * k + 8}; })();
    const swapGlyph = (x, y, R) => {
      const a = R * 0.5, hh = R * 0.26, t = R * 0.2;
      return h('path', {d: `M${r(x - a)} ${r(y - hh)}H${r(x + a)}m${r(-t)} ${r(-t)}l${r(t)} ${r(t)}l${r(-t)} ${r(t)}M${r(x + a)} ${r(y + hh)}H${r(x - a)}m${r(t)} ${r(-t)}l${r(-t)} ${r(t)}l${r(t)} ${r(t)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    };
    const marker = g({name: 'marker', opacity: 0},
      lostD ? h('path', {d: roundRectPath(lostD.x, lostD.y, lostD.w, lostD.h, 6), fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '9 7'}) : null,
      markLeader,
      h('circle', {cx: mk.x, cy: mk.y, r: MR, fill: th.accent, stroke: th.paper, 'stroke-width': 4}),
      swapGlyph(mk.x, mk.y, MR),
      markChip && markChip.node);
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 10, x2: beforeChip.box.x + beforeChip.box.w - 10, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;

    // context labels that the open lens window covers: hidden while it is open
    // (they are occluded anyway; this keeps no text under the lens)
    const dBox = q => { const a = toDesign(q); return {x: a.x, y: a.y, w: q.w * k, h: q.h * k}; };
    const srcTok = stage.tokens[0];
    const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
    const coverables = [
      {name: 'st-tok-source', box: dBox({x: stage.docks.source.x - srcTok.w / 2, y: stage.docks.source.y - srcTok.h / 2, w: srcTok.w, h: srcTok.h})},
      ...stage.bc.plates.map((pl, i) => ({name: `st-case-plate${i}-text`, box: dBox(pl), text: pl.hasText})).filter(c => c.text !== false),
    ];
    // only labels entirely under the lens window are hidden (nothing visibly vanishes)
    const covered = coverables.filter(c => inside(c.box, dest)).map(c => c.name);
    // labels under the (opaque) annotation plate are hidden while it is shown
    const annBox = annPlate ? {x: annPlateBox.x, y: annPlateBox.y, w: annPlateBox.w, h: annPlateBox.h} : null;
    const underAnn = annBox ? coverables.filter(c => inside(c.box, annBox)).map(c => c.name) : [];
    // the marker disc keeps clear of the new tag's text (text box inset by the tag's padding)
    const markerClearOfTag = after > 0 ? (() => {
      // (segToken: text ends 0.6·size before the right edge, starts ≥ 0.35·size below the top)
      const px = tokB.size * 0.6, py = tokB.size * 0.35;
      const tb = {x: sx + (dockA.x - afterTok.w / 2 + px) * k, y: sy + (dockA.y - afterTok.h / 2 + py) * k, w: (afterTok.w - px * 2) * k, h: (afterTok.h - py * 2) * k};
      const dx = Math.max(tb.x - mk.x, 0, mk.x - (tb.x + tb.w)), dy = Math.max(tb.y - mk.y, 0, mk.y - (tb.y + tb.h));
      return Math.hypot(dx, dy) > MR + 2;
    })() : true;
    // the callout's placement facts (stage units), checked by the tests
    const markLabel = markPlace ? (() => {
      const b = markPlace;
      const clear = [bookBox, stage.cardRestBox].every(o => !hi(b, o));
      return {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h), leader: r(b.leader ?? 0), size: b.size ?? 28, ok: b.ok && clear};
    })() : null;
    // context labels the lens window can partly cover while it flies or stays
    // open (page and volume tags above the spread, the source tag and the shelf
    // plates on the bookcase; design units)
    const tagAt = (tk, at) => ({name: tk.node.attrs.name, box: dBox({x: at.x - tk.w / 2, y: at.y - tk.h / 2, w: tk.w, h: tk.h})});
    const flyTags = [
      // (the context's own paragraph tag lies in the source: only while the lens flies)
      {...tagAt(tokB, dockB), flightOnly: true},
      tagAt(stage.tokens[2], stage.docks.page),
      tagAt(stage.tokens[1], stage.volBoard),
      tagAt(stage.tokens[0], stage.docks.source),
      ...stage.bc.plates.map((pl, i) => ({name: `st-case-plate${i}-text`, box: dBox(pl), text: pl.hasText})).filter(c => c.text !== false),
    ];
    return {cardCopyNames, flyTags, markLabel, markerClearOfTag, covered, underAnn, stage, k, sx, sy, before, after, dockB, dockA, tokB, afterTok, afterLens, book2, source, dest, L2, annLabel, annPlate, beforeChip, afterChip, arrowY, arrowX, vertical, ctxCap, marker, strike};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node, L.after > 0 ? L.afterTok.node : null),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann'},
        L.annPlate,
        L.annLabel && L.annLabel.node,
        L.beforeChip.node, L.strike,
        h('path', {d: L.vertical ? `M${r(L.arrowX)} ${r(L.arrowY - 12)}v22m-9 -10l9 10l9 -10` : `M${r(L.arrowX - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const {before, after} = L;
    const all = {source: 1, volume: 1, page: 1, paragraph: 1};
    // context state: the located passage; the highlight sweeps in. The new
    // state (tag and highlight at the new paragraph) is taken only once the
    // closed lens lies exactly on its source, i.e. while it is covered.
    const sweep = seg(u, ...W.sweep);
    const landed = u >= W.land[0];
    const withdraw = seg(u, ...W.withdraw);
    const hlCtx = landed ? {hlFrom: before, hlTo: after, hlMove: 1} : withdraw > 0 ? {hlFrom: before, hlTo: 0, hlMove: withdraw} : {hlFrom: 0, hlTo: before, hlMove: sweep};
    const posed = L.stage.pose({present: 1, strip: 1, split: 1, cardDown: 1, release: 1, fly: all, reach: 1, pull: 1, carry: 1, toEdge: 1, open: 1, retreat: 1, hl: 1, ...hlCtx});
    Object.assign(nodes, posed.nodes);
    const lift = ease.inOutCubic(withdraw);
    nodes['st-tok-paragraph'] = {transform: T(L.dockB.x, L.dockB.y - 16 * lift), opacity: landed ? 0 : r(1 - lift, 3)};
    if (after > 0) nodes['ctx-after'] = {transform: T(L.dockA.x, L.dockA.y), opacity: landed ? 1 : 0};
    // index card (outside the lens): the pinpoint written on it is swapped after the lens has gone
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const liftOut = clamp(ctxUpd * 2), dropIn = clamp(ctxUpd * 2 - 1);
    nodes['st-card-add'] = {opacity: r(1 - liftOut, 3), transform: `translate(0 ${r(-10 * liftOut)})`};
    nodes['st-card-add-alt'] = {opacity: r(dropIn, 3), transform: `translate(0 ${r(10 * (1 - dropIn))})`};
    // the lens's copy of the card (when the card reaches into the source) mirrors it
    for (const n of L.cardCopyNames) { const src = nodes[n.slice(5)]; if (src) nodes[n] = src; }

    // lens open / close; closing it stays opaque until it lies exactly on its
    // source, then it fades out over an identical context (no double image)
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    const landP = seg(u, ...W.land);
    const closing = u >= W.close[0] && u < W.land[1];
    Object.assign(nodes, L.L2.frame(closing ? Math.max(lp, 1e-4) : lp, lp));
    if (closing) {
      const op = r(u < W.land[0] ? 1 : 1 - landP, 3);
      nodes['lens-win'] = {opacity: op};
      nodes['lens-src'] = {opacity: op};
    } else nodes['lens-win'] = {opacity: lp > 0.001 ? 1 : 0}; // opening: opaque from its first frame (it starts as an exact copy), no ghost
    // a context label the (opaque) window starts to cover is faded out at
    // once, so the lens never leaves a fragment of it ('12' of 'p. 112'); it
    // returns as the window moves off it
    const pw = closing ? Math.max(lp, 1e-4) : lp;
    const S = L.source, Dt = L.dest;
    const win = {x: lerp(S.x, Dt.x, pw), y: lerp(S.y, Dt.y, pw), w: lerp(S.w, Dt.w, pw), h: lerp(S.h, Dt.h, pw)};
    const winOn = nodes['lens-win'].opacity > 0;
    let tagsUnderLens = 0;
    const flying = lp > 1e-3 && lp < 0.999;
    for (const o of L.flyTags) {
      if (o.flightOnly && (!flying || landed)) continue;
      const b = o.box;
      const ix = Math.max(0, Math.min(win.x + win.w, b.x + b.w) - Math.max(win.x, b.x));
      const iy = Math.max(0, Math.min(win.y + win.h, b.y + b.h) - Math.max(win.y, b.y));
      const covered = winOn ? (ix * iy) / (b.w * b.h) : 0;
      const keep = 1 - clamp(covered / 0.12);
      if (keep < 1) tagsUnderLens++;
      const base = nodes[o.name] || {};
      nodes[o.name] = {...base, opacity: r((base.opacity ?? 1) * keep, 3)};
    }
    // every covered node gets an explicit opacity on every frame (seek-safe)
    const annOn = u >= W.before[0];
    new Set([...L.covered, ...L.underAnn]).forEach(name => {
      const prev = nodes[name] || {};
      const hide = (L.covered.includes(name) && lp > 0.3) || (L.underAnn.includes(name) && annOn);
      nodes[name] = {...prev, opacity: hide ? 0 : (prev.opacity ?? 1)};
    });
    // lens content: same book; its tag swaps and slides with the highlight
    const swap = seg(u, ...W.swap), move = ease.inOutCubic(seg(u, ...W.move));
    const lensHl = after > 0 ? {hlFrom: before, hlTo: after, hlMove: move} : {hlFrom: before, hlTo: 0, hlMove: ease.inOutCubic(swap)};
    const ob = L.stage.onBoard;
    Object.assign(nodes, renameFrame(L.book2.frame({x: ob.x, y: ob.y, k: ob.k, turn: 1, open: 1, ...lensHl}), ''));
    const out = clamp(swap * 2), inn = clamp(swap * 2 - 1);
    nodes['lens-st-tok-paragraph'] = {transform: T(L.dockB.x, L.dockB.y - LIFT * out), opacity: r(1 - out, 3)};
    if (after > 0) {
      // the new tag keeps its own right-aligned x on the page (never past the page edge)
      const at = {x: L.dockA.x, y: lerp(L.dockB.y, L.dockA.y, move)};
      nodes['lens-after'] = {transform: T(at.x, at.y + LIFT * (1 - inn)), opacity: r(inn, 3)};
    }
    // annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.swap[0] ? 'before' : u >= W.move[1] ? 'after' : 'changing';
    const ctxRow = landed ? after : before;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        contextDatum: ctxUpd >= 1 ? 'after' : landed ? 'changing' : 'before',
        // the pinpoint marks (tag, highlight) the context page shows
        contextMarks: landed ? 'after' : withdraw >= 1 ? 'withdrawn' : withdraw > 0 ? 'withdrawing' : 'before',
        tagsUnderLens,
        lensWindow: r(closing ? (u < W.land[0] ? 1 : 1 - landP) : lp > 0.001 ? 1 : 0, 3),
        lensOnSource: closing && lp < 1e-3,
        contextRow: ctxRow,
        lensRow: move >= 1 ? after : swap > 0 ? -1 : before,
        contextTag: {x: r(landed ? L.dockA.x : L.dockB.x), y: r(landed ? L.dockA.y : L.dockB.y)},
        highlight: r(posed.semantic.highlight, 3),
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        focusTarget: 'paragraph',
        markerClearOfTag: L.markerClearOfTag,
        markLabel: L.markLabel,
        allReached: posed.semantic.allReached,
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
    slug: 'research-02-inspect',
    title: 'Located citation — inspect the paragraph pinpoint',
    titleEs: 'Cita localizada — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Cita localizada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens lifts a real enlarged copy of the pinpointed passage out of the library scene, replaces the paragraph pinpoint (old value struck but kept visible), slides the tag and highlight to the paragraph the new value designates — or removes them when no paragraph is given — and returns to the context with the new value on the card and a changed-datum marker.',
    tags: ['citation', 'pinpoint', 'inspect', 'lens', 'paragraph', 'highlight', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/cita-localizada.js', 'src/frameworks/lens.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
