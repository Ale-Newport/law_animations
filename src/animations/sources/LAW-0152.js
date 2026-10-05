/**
 * LAW-0152 — Remisión entre artículos · inspect
 *
 * Storyboard (top-down reading desk; brief beats in brackets):
 *  [0.00–0.20] context: the open volume in the state produced by the action —
 *              the page flag sits on the heading of the referenced article
 *              (Art. 9), the dashed trail runs from Art. 4's printed phrase
 *              round the page text to it, and Art. 9 is ringed. The side panel
 *              carries the context caption and the key.
 *  [0.20–0.45] isolate: the desk shrinks into a miniature and a magnifying
 *              window grows out of Art. 4's printed phrase — a real enlarged
 *              copy of that row, taken at its source coordinates (sight lines
 *              tie the window to the miniature).
 *  [0.45–0.75] substitute: inside the window the old phrase is struck and
 *              lifted out as a slip, which travels to the "before" row of the
 *              change card (kept traceable); only then is the supplied new
 *              phrase inked in. The dependent geometry updates, as supplied:
 *              the old trail and ring fade to ghosts, the flag hops on to the
 *              newly referenced article (Art. 12), a new trail is drawn from
 *              the same phrase, and Art. 12 is ringed.
 *  [0.75–1.00] return: the window closes back onto the phrase, the desk grows
 *              back to full size and a Δ marker stays beside the changed
 *              phrase; the change card shows the struck old value, the new
 *              value and "as supplied · no conclusion drawn". Seeking back
 *              restores the old phrase, flag, trail and ring exactly.
 * The scene never states what either article says or that it applies.
 * @module animations/sources/LAW-0152
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, int} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {deskWindow} from '../../primitives/desk.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  sourcesFields, pathField, RA_STRINGS, CONTENT_EN, cleanPath, pxScale, volumeArt, ringArt, flagArt, flagPose, flagBox, hopRoute, trailArt,
  cuePill, fitWords, overlaps, ringColor, flagInk, noteCard,
} from './kits/remision-entre-articulos.js';

const ID = 'LAW-0152';
const DURATION = 8000;

const sceneSchema = {
  ...sourcesFields,
  path: {...pathField, description: 'The supplied reference path BEFORE the change. The phrase of its last referring article is the focus: it prints beforeValue (its passages[i].cue is replaced by beforeValue / afterValue). ' + pathField.description},
  afterTarget: int('Index of the article the new phrase (afterValue) refers to, as supplied: the last hop is re-routed to it. Nothing is inferred from the wording', 0, 3),
  ...inspectFields(['reference-phrase']),
};

const defaultParams = {
  ...CONTENT_EN,
  path: [0, 2],
  afterTarget: 3,
  focusTarget: 'reference-phrase',
  beforeValue: 'as set out in Art. 9',
  afterValue: 'as set out in Art. 12',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'State after the marker jumped (as supplied)', marker: 'Datum changed'},
};

// the window opens WHILE the desk shrinks and closes WHILE it grows back (never a lone thumbnail);
// after the substitution the window pans to the two articles so the hop is seen enlarged
const B = {
  trail: [0.03, 0.13], ring: [0.1, 0.16],
  shrink: [0.2, 0.36], open: [0.19, 0.3],
  strike: [0.37, 0.41], lift: [0.42, 0.49], ink: [0.49, 0.54],
  // the new phrase is held, whole and enlarged, for 0.54–0.60 (480 ms at the default length)
  pan: [0.6, 0.66], ghost: [0.66, 0.69], hop: [0.665, 0.74], ringNew: [0.73, 0.77],
  close: [0.8, 0.9], grow: [0.78, 0.87], marker: [0.88, 0.92], note: [0.88, 0.92],
};

const scene = {
  sizes: {landscape: [1840, 800], square: [1108, 860], portrait: [1000, 1430]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const W = ctx.design.w, H = ctx.design.h;
    const k = pxScale(ctx);
    const D = v => v / k;
    const px = {head: D(23), cue: D(22), tab: D(20.5), run: D(20.5), min: D(16.5)};
    const size = D(20.5), min = D(16.5);
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const n = p.passages.length;
    const path = cleanPath(p.path, n);
    const focusIdx = path[path.length - 2];
    const oldTarget = path[path.length - 1];
    const newTarget = clamp(p.afterTarget, 0, n - 1) === focusIdx ? oldTarget : clamp(p.afterTarget, 0, n - 1);
    const orient = shape === 'portrait' ? 'v' : 'h';
    const longer = p.afterValue.length > p.beforeValue.length ? p.afterValue : p.beforeValue;
    const articles = p.passages.map((a, i) => ({i, ref: a.ref, cue: i === focusIdx ? longer : a.cue, level: a.level}));

    // ---- side panel (fixed size, never scaled): caption, change card, key note
    const buildPanel = (x0, y0, w, cap = Infinity) => {
      let captionBox = null;
      const parts = [];
      let y = y0;
      let caption = null;
      let capFit = null;
      const capBelow = shape !== 'landscape';
      if (showAll) {
        capFit = fitWords(ctx, p.contextLabels.context, {maxWidth: w, size: Math.min(size, cap), minSize: Math.min(min, cap), maxLines: 3, weight: 600});
        if (!capBelow) {
          caption = textBlock(capFit, {x: x0, y, fill: th.fg, name: 'caption'});
          captionBox = {x: x0, y, w: capFit.width, h: capFit.height};
          y += capFit.height + 18;
        }
      }
      const card = {x: x0, y, w};
      let cy = y + 18;
      const inner = w - 36;
      const rows = {};
      const cparts = [];
      if (showKey) {
        const mf = fitWords(ctx, p.contextLabels.marker, {maxWidth: inner - 50, size: Math.min(size * 1.02, cap), minSize: Math.min(min, cap), maxLines: 2, weight: 700});
        rows.marker = {x: x0 + 18 + 20, y: cy + mf.height / 2};
        cparts.push(textBlock(mf, {x: x0 + 18 + 50, y: cy, fill: th.ink, name: 'card-marker'}));
        cy += Math.max(mf.height, 40) + 12;
        const lab = (txt, yy) => {
          const f = fitWords(ctx, txt, {maxWidth: inner, size: Math.min(size * 0.9, cap), minSize: Math.min(min, cap), maxLines: 1, weight: 600});
          cparts.push(textBlock(f, {x: x0 + 18, y: yy, fill: th.inkSoft}));
          return f.height + 6;
        };
        cy += lab(t.before, cy);
        rows.before = {x: x0 + 18, y: cy};
        cy += 0; // the slip's own height is added by the entry (it lands here)
        rows.beforeGap = cy;
      }
      return {parts, caption, card, rows, y, cparts, cy, w, x0, inner, capFit, capBelow, get captionBox() { return captionBox; }, set captionBox(v) { captionBox = v; }};
    };

    const compose = bookH => {
      // ---- stage (context) geometry per shape
      let book, panelBox, thumb, lensArea;
      const ZW = '\u200B';
      if (shape === 'landscape') {
        book = {x: 40, y: 24, w: 1250, h: H - 48};
        panelBox = {x: 1446, y: 30, w: W - 1446 - 22};
        thumb = {x: 30, y: 16, s: 0.42};
        lensArea = {x: 30, y: 16, w: 1380, h: H - 32};
      } else if (shape === 'square') {
        book = {x: 44, y: 22, w: W - 200, h: bookH};
        panelBox = {x: 40, y: 22 + bookH + 26, w: showAll && p.interpretations.length ? (W - 80) * 0.58 : W - 80};
        thumb = {x: 20, y: 16, s: 0.34};
        lensArea = {x: 20, y: 16, w: W - 36, h: bookH + 8};
      } else {
        book = {x: 40, y: 24, w: W - 170, h: bookH};
        panelBox = {x: 40, y: 24 + bookH + 30, w: W - 80};
        thumb = {x: (W - (book.w + 150) * 0.44) / 2 + 15, y: 16, s: 0.44};
        lensArea = {x: 30, y: 16, w: W - 60, h: bookH + 8};
      }
      const buildStage = X => {
        const mk = X === 'L' ? v => (v ? ZW + v : v) : v => v;
        return volumeArt(ctx, {prefix: `${X}vol`, ...book, orient, articles: articles.map(a => ({...a, ref: mk(a.ref), cue: mk(a.cue)})), levels: p.hierarchy.levels.map(mk), title: mk(p.sources[0].title), px, seedKey: 'ra-inspect', pillNodes: true, grow: 1.25});
      };
      const vol = buildStage('C');
      const volL = buildStage('L');
      const Bk = vol.blocks;
      const pillBox = Bk[focusIdx].pill;
      const spot = (i, which) => (which === 'cue' && Bk[i].cueSpot ? Bk[i].cueSpot : Bk[i].headSpot);
      const start = spot(focusIdx, 'cue');
      const oldEnd = spot(oldTarget, 'head');
      const newEnd = spot(newTarget, 'head');
      const earlier = [];
      for (let j = 0; j < path.length - 2; j++) earlier.push({S: spot(path[j], 'cue'), E: spot(path[j + 1], 'head')});
      // the old (ghosted) and the new trail run in lanes of their own, so both stay readable at the hold
      const laneOld = vol.lane == null ? null : vol.lane + 8;
      const laneNew = vol.lane == null ? null : vol.lane - 10;
      const routeOld = hopRoute(start, oldEnd, {lane: laneOld, laneGap: 22});
      const routeMove = hopRoute(oldEnd, newEnd, {lane: laneNew, laneGap: 22});
      const routeNew = hopRoute(start, newEnd, {lane: laneNew, laneGap: 62});
      const cap = vol.minText;
      const panel = buildPanel(panelBox.x, panelBox.y, panelBox.w, cap);

      // pills: old value (with strike) and new value, both fitted to the focus pill box
      const pillFit = txt => (showKey ? fitWords(ctx, txt, {maxWidth: pillBox.w - 26, size: vol.px.cue, minSize: Math.min(px.min, vol.px.cue), maxLines: 3, weight: 600}) : null);
      const oldFit = pillFit(p.beforeValue);
      const newFit = pillFit(p.afterValue);
      const pillOf = (f, txt) => {
        const w = f ? f.width + 26 : Math.min(pillBox.w, 60 + txt.length * vol.px.cue * 0.34);
        const hh = f ? f.height + 14 : pillBox.h;
        const side = Bk[focusIdx].side;
        return {x: side === 'right' ? pillBox.x + pillBox.w - w : pillBox.x, y: pillBox.y + (pillBox.h - hh) / 2, w, h: hh, fit: f};
      };
      const oldPill = pillOf(oldFit, p.beforeValue);
      // one strike line per printed line of the old phrase (continuous dash reveal across lines)
      const strikeD = (pl, x0, y0) => {
        if (!pl.fit) return `M${r(x0 + 8)} ${r(y0 + pl.h / 2)}h${r(pl.w - 16)}`;
        return pl.fit.lines.map((ln, i) => {
          const lw = ctx.measure(ln, pl.fit.size, pl.fit.weight, pl.fit.family);
          const ly = y0 + 7 + i * pl.fit.lineHeight + pl.fit.size * 0.52;
          return `M${r(x0 + pl.w / 2 - lw / 2 - 4)} ${r(ly)}h${r(lw + 8)}`;
        }).join('');
      };
      const strikeTotal = oldPill.fit ? oldPill.fit.lines.reduce((m, ln) => m + ctx.measure(ln, oldPill.fit.size, oldPill.fit.weight, oldPill.fit.family) + 8, 0) : oldPill.w - 16;
      const newPill = pillOf(newFit, p.afterValue);

      const stageNodes = X => {
        const V = X === 'C' ? vol : volL;
        const pills = V.pills.filter(q => q.i !== focusIdx && p.passages[q.i].cue).map(q => cuePill(ctx, {pill: q.pill}));
        const trails = earlier.map((e, j) => trailArt(ctx, {name: `${X}trE${j}`, route: hopRoute(e.S, e.E, {lane: vol.lane, bulge: 90}), from: e.S, to: e.E}));
        const trOld = trailArt(ctx, {name: `${X}trOld`, route: routeOld, from: start, to: oldEnd});
        const trNew = trailArt(ctx, {name: `${X}trNew`, route: routeNew, from: start, to: newEnd});
        const ringOld = ringArt(ctx, {name: `${X}ringOld`, box: Bk[oldTarget].box, color: ringColor(ctx)});
        const ringNew = ringArt(ctx, {name: `${X}ringNew`, box: Bk[newTarget].box, color: ringColor(ctx)});
        const {flag, shadow} = flagArt(ctx, {name: `${X}flag`});
          const mkPill = (pl, txt) => (X === 'L' && pl.fit ? {...pl, fit: {...pl.fit, lines: pl.fit.lines.map(l => ZW + l)}} : pl);
        const oldNode = g({name: `${X}old`},
          cuePill(ctx, {pill: mkPill(oldPill)}),
          h('path', {name: `${X}strike`, d: strikeD(oldPill, oldPill.x, oldPill.y), stroke: th.ink, 'stroke-width': 3, 'stroke-dasharray': `${r(strikeTotal)} ${r(strikeTotal + 4)}`, 'stroke-dashoffset': r(strikeTotal)}));
        const newNode = cuePill(ctx, {pill: mkPill(newPill), name: `${X}new`, opacity: 0});
        const marker = changedMarker(ctx, {name: `${X}delta`, x: Math.max(oldPill.x + oldPill.w, newPill.x + newPill.w) + 26, y: pillBox.y - 4, radius: 17, opacity: 0});
        return {node: g(null, V.node, pills, oldNode, newNode, ringOld.node, ringNew.node, trails.map(q => q.node), trOld.node, trNew.node, shadow, flag, marker), trails, trOld, trNew, ringOld, ringNew};
      };
      const deskC = deskWindow(ctx, {prefix: 'deskC', x: book.x - 30, y: book.y - 14, w: book.w + 150, h: book.h + 28, radius: 24, seedKey: 'ra-idesk'});
      const deskL = deskWindow(ctx, {prefix: 'deskL', x: book.x - 30, y: book.y - 14, w: book.w + 150, h: book.h + 28, radius: 24, seedKey: 'ra-idesk'});
      const C = stageNodes('C');
      const Ls = stageNodes('L');

      // lens source (stage coords): the focus phrase row with some page around it
      // the whole focus article (heading, phrase and simulated wording), with a margin of page around it
      const fb = Bk[focusIdx].box;
      // crop under the phrase, above the next printed line (never cutting a line of text)
      const pillBottom = pillBox.y + pillBox.h;
      const nextTop = Math.min(Infinity, ...vol.text.filter(b => b.y > pillBottom - 1 && b.x < fb.x + fb.w && b.x + b.w > fb.x).map(b => b.y));
      const S = {x: fb.x - 16, y: fb.y - 12, w: fb.w + 32, h: Math.min(pillBottom + 22, nextTop - 6) - (fb.y - 12)};
      // the window sits beside or under the miniature, whichever magnifies more
      const tw = (book.w + 150) * thumb.s, tH = (book.h + 28) * thumb.s;
      const cands = [
        {x: thumb.x + tw + 30, y: lensArea.y, w: lensArea.x + lensArea.w - (thumb.x + tw + 30), h: lensArea.h},
        {x: lensArea.x, y: thumb.y + tH + 30, w: lensArea.w, h: lensArea.y + lensArea.h - (thumb.y + tH + 30)},
      ].filter(c => c.w > 100 && c.h > 80);
      // the region the window pans to for the hop: both articles and both flag places
      const uni = [Bk[oldTarget].box, Bk[newTarget].box, flagBox(oldEnd), flagBox(newEnd)].reduce((a, b) => ({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), r: Math.max(a.r, b.x + b.w), b: Math.max(a.b, b.y + b.h)}), {x: Infinity, y: Infinity, r: -Infinity, b: -Infinity});
      const SH0 = {x: uni.x - 20, y: uni.y - 20, w: uni.r - uni.x + 40, h: uni.b - uni.y + 40};
      // ONE window (fixed size and place) shows the phrase, then pans its content to the hop: its shape is
      // chosen between the two regions' aspects so both read large; the area that serves both best wins
      const plan = c => {
        let best = null;
        for (let k = 0; k <= 1.0001; k += 0.125) {
          const asp = Math.exp(lerp(Math.log(S.w / S.h), Math.log(SH0.w / SH0.h), k));
          let ww = c.w, hh = ww / asp;
          if (hh > c.h) { hh = c.h; ww = hh * asp; }
          const fitIn = (R0, asp2) => (R0.w / R0.h < asp2 ? {w: R0.h * asp2, h: R0.h} : {w: R0.w, h: R0.w / asp2});
          const zS = Math.min(p.detailGeometry.zoom, ww / fitIn(S, asp).w);
          const zH = ww / fitIn(SH0, asp).w;
          const score = Math.min(zS, zH * 1.6);
          if (!best || score > best.score) best = {score, ww: Math.min(ww, fitIn(S, asp).w * zS), asp, zS, zH};
        }
        return best;
      };
      const plans = cands.map(c => ({c, pl: plan(c)})).sort((a1, a2) => a2.pl.score - a1.pl.score);
      const area = plans[0].c;
      const PL = plans[0].pl;
      const dest = {w: PL.ww, h: PL.ww / PL.asp};
      const pl = p.detailGeometry.placement;
      dest.x = pl === 'left' ? area.x : pl === 'right' ? area.x + area.w - dest.w : area.x + (area.w - dest.w) / 2;
      dest.y = pl === 'top' ? area.y : pl === 'bottom' ? area.y + area.h - dest.h : area.y + (area.h - dest.h) / 2;
      // content regions (the window shows each one whole, centred, with paper margins — never a cut line)
      const SH = SH0;
      const zoom = Math.min(dest.w / S.w, dest.h / S.h);
      const zoomH = Math.min(dest.w / SH.w, dest.h / SH.h);
      const destHop = dest;

      // the struck slip (world coords): the old phrase lifted out of the window into the card
      const slipH = oldPill.h;
      let slip = null;
      let cardH = 0;
      let interpCard = null;
      if (showKey) {
        const sf = oldFit;
        const slipNode = g({name: 'slip', opacity: 0},
          h('path', {d: roundRectPath(0, 0, oldPill.w, oldPill.h, Math.min(12, oldPill.h / 2)), fill: '#fbe7a6', stroke: '#b69a4e', 'stroke-width': 1.6}),
          textBlock(sf, {x: oldPill.w / 2, y: 7, anchor: 'middle', fill: th.inkSoft}),
          h('path', {d: strikeD(oldPill, 0, 0), stroke: th.ink, 'stroke-width': 3}));
        // final slip scale: fits the card width
        const sEnd = Math.min(1, (panel.inner) / oldPill.w);
        slip = {node: slipNode, end: {x: panel.rows.before.x, y: panel.rows.before.y}, sEnd};
        let cy = panel.rows.before.y + slipH * sEnd + 14;
        const af = fitWords(ctx, t.after, {maxWidth: panel.inner, size: Math.min(size * 0.9, cap), minSize: Math.min(min, cap), maxLines: 1, weight: 600});
        panel.cparts.push(textBlock(af, {x: panel.x0 + 18, y: cy, fill: th.inkSoft}));
        cy += af.height + 6;
        const nf = fitWords(ctx, p.afterValue, {maxWidth: panel.inner - 26, size: Math.min(size, cap), minSize: Math.min(min, cap), maxLines: 3, weight: 600});
        panel.cparts.push(g({name: 'card-after', opacity: 0}, h('path', {d: roundRectPath(panel.x0 + 18, cy, nf.width + 26, nf.height + 14, 12), fill: '#fbe7a6', stroke: '#b69a4e', 'stroke-width': 1.6}), textBlock(nf, {x: panel.x0 + 18 + 13, y: cy + 7, fill: th.ink})));
        cy += nf.height + 14 + 14;
        const kf = fitWords(ctx, t.keyNote, {maxWidth: panel.inner, size: Math.min(size * 0.95, cap), minSize: Math.min(min, cap), maxLines: 2, weight: 500});
        panel.cparts.push(textBlock(kf, {x: panel.x0 + 18, y: cy, fill: th.inkSoft, italic: true, name: 'card-key'}));
        cy += kf.height + 18;
        cardH = cy - panel.card.y;
        let belowY = panel.card.y + cardH + 14;
        if (panel.capBelow && panel.capFit) {
          panel.caption = textBlock(panel.capFit, {x: panel.x0, y: belowY, fill: th.fg, name: 'caption'});
          panel.captionBox = {x: panel.x0, y: belowY, w: panel.capFit.width, h: panel.capFit.height};
          belowY += panel.capFit.height + 14;
        }
        if (showAll && p.interpretations.length) {
          const ip = p.interpretations[0];
          const beside = shape === 'square';
          interpCard = noteCard(ctx, {name: 'interp', x: beside ? panel.x0 + panel.w + 20 : panel.x0, y: beside ? panel.card.y : belowY, w: beside ? W - 40 - (panel.x0 + panel.w + 20) : panel.w, size: Math.min(size * 0.95, cap), min: Math.min(min, cap), title: `${ip.by} · ${t.attributed}`, body: ip.text, opacity: 0});
        }
      }
      // labels hidden: a text-free pictogram keeps the old value traceable (struck old slip → new phrase, Δ)
      let picto = null;
      if (!showKey) {
        const px0 = panelBox.x, py0 = panelBox.y, pw = 150, ph = 40;
        const pillArt = (x, y, struck) => g(null,
          h('path', {d: roundRectPath(x, y, pw, ph, 14), fill: '#fbe7a6', stroke: '#b69a4e', 'stroke-width': 1.6}),
          h('rect', {x: x + 18, y: y + ph / 2 - 5, width: pw - 36, height: 10, rx: 5, fill: '#b69a4e'}),
          struck ? h('path', {d: `M${x + 10} ${y + ph / 2}h${pw - 20}`, stroke: th.ink, 'stroke-width': 3}) : null);
        picto = {
          node: g({name: 'picto', opacity: 0},
            h('path', {d: roundRectPath(px0 + 5, py0 + 7, 470, 100, 14), fill: th.shadow}),
            h('path', {d: roundRectPath(px0, py0, 470, 100, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
            h('path', {d: roundRectPath(px0 + 20, py0 + 30, pw, ph, 14), fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 5'}),
            h('path', {d: `M${px0 + 186} ${py0 + 50}h52`, stroke: th.ink, 'stroke-width': 3.5}),
            h('path', {d: `M${px0 + 248} ${py0 + 50}l-14 -8v16z`, fill: th.ink}),
            g({name: 'picto-new', opacity: 0}, pillArt(px0 + 258, py0 + 30, false)),
            changedMarker(ctx, {x: px0 + 438, y: py0 + 50, radius: 17})),
          slot: {x: px0 + 20, y: py0 + 30},
        };
        const sEnd = pw / oldPill.w;
        const slipNode = g({name: 'slip', opacity: 0},
          h('path', {d: roundRectPath(0, 0, oldPill.w, oldPill.h, Math.min(12, oldPill.h / 2)), fill: '#fbe7a6', stroke: '#b69a4e', 'stroke-width': 1.6}),
          h('rect', {x: 12, y: oldPill.h / 2 - 5, width: Math.max(10, oldPill.w - 24), height: 10, rx: 5, fill: '#b69a4e'}),
          h('path', {d: `M8 ${oldPill.h / 2}h${oldPill.w - 16}`, stroke: th.ink, 'stroke-width': 3}));
        slip = {node: slipNode, end: picto.slot, sEnd, sEndY: ph / oldPill.h};
      }
      const cardNode = showKey ? g({name: 'card', opacity: 0},
        h('path', {d: roundRectPath(panel.card.x + 5, panel.card.y + 7, panel.w, cardH, 14), fill: th.shadow}),
        h('path', {d: roundRectPath(panel.card.x, panel.card.y, panel.w, cardH, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
        changedMarker(ctx, {x: panel.rows.marker.x, y: panel.rows.marker.y, radius: 17}),
        panel.cparts) : null;
      return {destHop, zoomH, picto, SH, interpCard, strikeTotal, book, panelBox, thumb, lensArea, vol, volL, Bk, pillBox, start, oldEnd, newEnd, earlier, routeOld, routeMove, routeNew, cap, panel, oldFit, oldPill, newPill, deskC, deskL, C, Ls, S, zoom, dest, slip, cardH, cardNode};
    };
    const nominal = shape === 'landscape' ? H - 48 : shape === 'square' ? 560 : 900;
    let R0 = compose(nominal);
    const panelBottom = R => Math.max(R.panel.card.y + R.cardH, R.interpCard ? R.interpCard.box.y + R.interpCard.box.h : 0, R.panel.captionBox ? R.panel.captionBox.y + R.panel.captionBox.h : 0);
    if (shape !== 'landscape' && ctx.show('key')) {
      // the book takes whatever height the panel leaves (both directions), then the panel is rebuilt under it
      const slack = (H - 10) - panelBottom(R0);
      if (Math.abs(slack) > 4) R0 = compose(clamp(nominal + slack, nominal * 0.6, nominal * 1.25));
      if (panelBottom(R0) > H - 8) R0 = compose(Math.max(nominal * 0.6, R0.book.h - (panelBottom(R0) - (H - 8)) - 4));
    }
    const {destHop, zoomH, picto, SH, interpCard, strikeTotal, book, thumb, lensArea, vol, Bk, pillBox, start, oldEnd, newEnd, earlier, routeOld, routeMove, routeNew, panel, oldPill, newPill, deskC, deskL, C, Ls, S, zoom, dest, slip, cardH, cardNode} = R0;
    // checks: parked flag / trails clear of text; card inside the design
    const texts = [...vol.text, ...vol.tabs.filter(tb => tb.text).map(tb => tb.text)];
    const flagClear = !texts.some(b => overlaps(flagBox(newEnd), b, 2)) && !texts.some(b => overlaps(flagBox(oldEnd), b, 2));
    const trailTextHits = [C.trOld, C.trNew].reduce((m, tr) => m + tr.poly.pts.filter(q => texts.some(b => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h)).length, 0);
    const cardInside = !showKey || (Math.max(panel.card.y + cardH, interpCard ? interpCard.box.y + interpCard.box.h : 0, panel.captionBox ? panel.captionBox.y + panel.captionBox.h : 0) <= H + 1);
    return {W, H, book, thumb, lensArea, S, dest, zoom, vol, C, L: Ls, deskC, deskL, panel, cardNode, cardH, slip, oldPill, newPill, pillBox,
      start, oldEnd, newEnd, routeOld, routeMove, routeNew, focusIdx, oldTarget, newTarget, path, flagClear, trailTextHits, cardInside, earlier, strikeTotal, interpCard, SH, picto, destHop, zoomH, shape, captionBox: panel.captionBox, trailsApart: (() => { const P = C.trNew.poly.pts, O = C.trOld.poly.pts; const mid = P.slice(Math.floor(P.length * 0.3), Math.ceil(P.length * 0.7)); return Math.min(...mid.map(q => Math.min(...O.map(o => Math.hypot(o.x - q.x, o.y - q.y))))); })()};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const lensClip = 'lensclip';
    return g(null,
      g({name: 'ctx'}, L.deskC.surface, g({'clip-path': L.deskC.clip}, L.C.node), L.deskC.frame,
        h('rect', {name: 'dim', x: L.book.x - 30, y: L.book.y - 14, width: L.book.w + 150, height: L.book.h + 28, rx: 24, fill: th.dark ? '#000' : '#1f2328', opacity: 0})),
      h('path', {name: 'lens-src', fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      h('line', {name: 'coneA', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id(lensClip)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      g({name: 'lens', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'lens-bg', rx: 22, fill: th.paper}),
        g({'clip-path': ctx.ref(lensClip)}, g({name: 'lens-content'}, L.deskL.surface, L.L.node)),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent2, 'stroke-width': 6})),
      L.panel.caption,
      L.cardNode,
      L.picto && L.picto.node,
      L.interpCard && L.interpCard.node,
      L.slip && L.slip.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // ---- the state (identical in the context and in the lens copy)
    const trailP = seg(u, ...B.trail);
    const ringOldP = seg(u, ...B.ring);
    const ghost = seg(u, ...B.ghost);
    const hopF = ease.inOutCubic(seg(u, ...B.hop));
    const ringNewP = seg(u, ...B.ringNew);
    const strikeP = seg(u, ...B.strike);
    const lifted = u >= B.lift[0];
    const inkP = seg(u, ...B.ink);
    const markerP = seg(u, ...B.marker);
    let fpos, lift = 0;
    if (u < B.hop[0]) fpos = L.oldEnd;
    else {
      const pt = L.routeMove.at(hopF);
      fpos = {x: pt.x, y: pt.y};
      lift = Math.sin(Math.PI * seg(u, ...B.hop)) * 1.1;
    }
    const newTrailP = clamp((hopF - L.C.trNew.t0) / (L.C.trNew.t1 - L.C.trNew.t0));
    for (const X of ['C', 'L']) {
      const St = L[X === 'C' ? 'C' : 'L'];
      St.trails.forEach(tr => Object.assign(nodes, tr.frame(trailP)));
      Object.assign(nodes, St.trOld.frame(trailP));
      nodes[`${X}trOld`].opacity = trailP > 0 ? r(1 - 0.72 * ghost, 3) : 0;
      Object.assign(nodes, St.trNew.frame(u >= B.hop[0] ? newTrailP : 0));
      Object.assign(nodes, St.ringOld.frame(ringOldP));
      if (ringOldP > 0) nodes[`${X}ringOld`].opacity = r(1 - 0.75 * ghost, 3);
      Object.assign(nodes, St.ringNew.frame(ringNewP));
      Object.assign(nodes, flagPose(`${X}flag`, {x: fpos.x, y: fpos.y, sx: L.newEnd.side === 'right' ? 1 : -1, lift}));
      nodes[`${X}strike`] = {'stroke-dashoffset': r(L.strikeTotal * (1 - strikeP))};
      nodes[`${X}old`] = {opacity: lifted ? 0 : 1};
      nodes[`${X}new`] = {opacity: r(inkP, 3)};
      nodes[`${X}delta`] = {opacity: r(markerP, 3)};
    }
    // ---- context scale (miniature while inspecting)
    const shrink = ease.inOutCubic(seg(u, ...B.shrink)) * (1 - ease.inOutCubic(seg(u, ...B.grow)));
    const cs = lerp(1, L.thumb.s, shrink);
    const ox = shrink ? lerp(0, L.thumb.x - (L.book.x - 30) * L.thumb.s, shrink) : 0;
    const oy = shrink ? lerp(0, L.thumb.y - (L.book.y - 14) * L.thumb.s, shrink) : 0;
    nodes.ctx = {transform: T(ox, oy, 0, cs)};
    const world = q => ({x: ox + q.x * cs, y: oy + q.y * cs});
    // one window, fixed in size and place: after the new phrase has been held, its CONTENT pans from the phrase
    // to the two articles of the hop (the copy is shown whole, centred, with paper margins)
    const pan = ease.inOutCubic(seg(u, ...B.pan));
    const Sc = {x: lerp(L.S.x, L.SH.x, pan), y: lerp(L.S.y, L.SH.y, pan), w: lerp(L.S.w, L.SH.w, pan), h: lerp(L.S.h, L.SH.h, pan)};
    const Sw = {...world(Sc), w: Sc.w * cs, h: Sc.h * cs};
    // ---- lens window: grows from the phrase in the miniature to its destination, and back
    const open = ease.inOutCubic(seg(u, ...B.open)) * (1 - ease.inOutCubic(seg(u, ...B.close)));
    const D = L.dest;
    const R = {x: lerp(Sw.x, D.x, open), y: lerp(Sw.y, D.y, open), w: lerp(Sw.w, D.w, open), h: lerp(Sw.h, D.h, open)};
    const kz = Math.min(R.w / Sc.w, R.h / Sc.h);
    const cx0 = R.x + (R.w - Sc.w * kz) / 2, cy0 = R.y + (R.h - Sc.h * kz) / 2;
    const contentRect = {x: r(cx0), y: r(cy0), width: r(Sc.w * kz), height: r(Sc.h * kz)};
    const vis = open > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    // opaque from the first frame: at open≈0 the window coincides with its source, so nothing doubles
    nodes.lens = {opacity: vis ? 1 : 0};
    nodes['lens-cliprect'] = contentRect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(cx0 - Sc.x * kz, cy0 - Sc.y * kz)} scale(${r(kz, 4)})`};
    nodes['lens-src'] = {d: roundRectPath(Sw.x, Sw.y, Sw.w, Sw.h, 8), opacity: vis ? 1 : 0};
    const below = D.y >= Sw.y + Sw.h - 1;
    const [a1, a2, b1, b2] = below
      ? [{x: Sw.x, y: Sw.y + Sw.h}, {x: R.x, y: R.y}, {x: Sw.x + Sw.w, y: Sw.y + Sw.h}, {x: R.x + R.w, y: R.y}]
      : [{x: Sw.x + Sw.w, y: Sw.y}, {x: R.x, y: R.y}, {x: Sw.x + Sw.w, y: Sw.y + Sw.h}, {x: R.x, y: R.y + R.h}];
    const coneOn = open > 0.05 && open < 0.999 || (open >= 0.999);
    nodes.coneA = {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: coneOn && vis ? 1 : 0};
    nodes.coneB = {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: coneOn && vis ? 1 : 0};
    nodes.dim = {opacity: r(0.2 * shrink, 3)};
    // ---- panel: caption and change card
    if (L.panel.caption) nodes.caption = {opacity: r(seg(u, 0.02, 0.08), 3)};
    // the change card appears once the old phrase is struck (not before)
    const cardP = seg(u, B.strike[1], B.strike[1] + 0.015);
    if (L.cardNode) nodes.card = {opacity: r(cardP, 3)};
    if (L.interpCard) nodes.interp = {opacity: r(seg(u, ...B.note), 3)};
    if (L.cardNode) nodes['card-after'] = {opacity: r(seg(u, B.ink[0], B.ink[1] + 0.02), 3)};
    if (L.picto) {
      nodes.picto = {opacity: r(cardP, 3)};
      nodes['picto-new'] = {opacity: r(seg(u, B.ink[0], B.ink[1] + 0.02), 3)};
    }
    // ---- slip: leaves the window at the old phrase's place and lands in the card's "before" row
    let slipAt = null;
    let slipBox = null;
    if (L.slip) {
      const q = ease.inOutCubic(seg(u, ...B.lift));
      const from = {x: cx0 + (L.oldPill.x - Sc.x) * kz, y: cy0 + (L.oldPill.y - Sc.y) * kz};
      const fromK = kz;
      const to = L.slip.end;
      const sk = lerp(fromK, L.slip.sEnd, q);
      const skY = lerp(fromK, L.slip.sEndY ?? L.slip.sEnd, q);
      // wide stages (caption above the card): across first, then up into the card from below; other stages
      // (caption below the card): straight into the card from above — the slip never crosses the caption
      const pos = L.shape === 'landscape'
        ? {x: lerp(from.x, to.x, ease.inOutSine(seg(q, 0, 0.6))), y: lerp(from.y, to.y, ease.inOutSine(seg(q, 0.4, 1)))}
        : {x: lerp(from.x, to.x, q), y: lerp(from.y, to.y, q) - Math.sin(Math.PI * q) * 30};
      nodes.slip = {opacity: lifted ? 1 : 0, transform: `${T(pos.x, pos.y)} scale(${r(sk, 4)} ${r(skY, 4)})`};
      slipAt = {x: r(pos.x), y: r(pos.y)};
      slipBox = lifted ? {x: pos.x, y: pos.y, w: L.oldPill.w * sk, h: L.oldPill.h * skY} : null;
    }
    const datum = u < B.lift[0] ? 'before' : u < B.ink[1] ? 'changing' : 'after';
    const beat = u < 0.2 ? 'context' : u < 0.45 ? 'isolate' : u < 0.75 ? 'substitute' : 'return';
    const srcC = {x: r(Sw.x + Sw.w / 2, 1), y: r(Sw.y + Sw.h / 2, 1)};
    const pillW = world({x: L.pillBox.x + L.pillBox.w / 2, y: L.pillBox.y + L.pillBox.h / 2});
    return {
      nodes,
      semantic: {
        beat,
        datum,
        shown: u < B.lift[0] ? 'before' : inkP >= 1 ? 'after' : 'none',
        oldStruck: r(strikeP, 3),
        slipLanded: seg(u, ...B.lift) >= 1,
        flag: {x: r(fpos.x), y: r(fpos.y)},
        flagAt: u < B.hop[0] ? L.oldTarget : hopF >= 1 ? L.newTarget : null,
        trails: {old: r(trailP, 3), oldGhost: r(ghost, 3), new: r(u >= B.hop[0] ? newTrailP : 0, 3)},
        rings: {old: r(ringOldP * (1 - 0.75 * ghost), 3), new: r(ringNewP, 3)},
        contextScale: r(cs, 3),
        lensOpen: r(open, 3),
        lensZoom: r(L.zoom, 3),
        lens: {x: r(R.x + R.w / 2), y: r(R.y + R.h / 2)},
        lensSourceCenter: srcC,
        focusCenter: {x: r(pillW.x, 1), y: r(pillW.y, 1)},
        lensRect: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
        panP: r(pan, 3),
        phraseWhole: (() => { const np = L.newPill; return np.x >= Sc.x - 0.5 && np.x + np.w <= Sc.x + Sc.w + 0.5 && np.y >= Sc.y - 0.5 && np.y + np.h <= Sc.y + Sc.h + 0.5; })(),
        slipClearOfCaption: !slipBox || !L.captionBox || !overlaps(slipBox, L.captionBox, 0),
        cardShown: L.cardNode ? r(cardP, 3) : 0,
        oldStruckNow: r(strikeP, 3),
        trailsApart: r(L.trailsApart, 1),
        hopVsThumb: r((open > 0.99 ? kz : 0) / L.thumb.s, 3),
        lensShowsHop: (() => { const inR = q => q.x >= Sc.x - 1 && q.x <= Sc.x + Sc.w + 1 && q.y >= Sc.y - 1 && q.y <= Sc.y + Sc.h + 1; return open > 0.99 && inR(L.oldEnd) && inR(L.newEnd); })(),
        hopZoom: r(open > 0.99 ? kz : 0, 3),
        blankFrame: open < 0.35 && cs < 0.8,
        traceable: seg(u, ...B.lift) >= 1 && (L.cardNode ? seg(u, B.strike[0] - 0.02, B.strike[0] + 0.02) >= 1 : L.picto ? true : false),
        sourceHoldsPhrase: (() => { const a = world(L.pillBox); const w2 = L.pillBox.w * cs, h2 = L.pillBox.h * cs; return a.x >= Sw.x - 0.5 && a.y >= Sw.y - 0.5 && a.x + w2 <= Sw.x + Sw.w + 0.5 && a.y + h2 <= Sw.y + Sw.h + 0.5; })(),
        markerShown: r(markerP, 3),
        slip: slipAt,
        focusIdx: L.focusIdx,
        oldTarget: L.oldTarget,
        newTarget: L.newTarget,
        flagClear: L.flagClear,
        trailTextHits: L.trailTextHits,
        cardInside: L.cardInside,
        volumeOverflow: L.vol.overflow,
        insetClear: !overlaps(D, {x: L.thumb.x, y: L.thumb.y, w: (L.book.w + 150) * L.thumb.s, h: (L.book.h + 28) * L.thumb.s}, 0),
        deskInside: L.book.x - 30 >= 0 && L.book.x + L.book.w + 120 <= L.W + 0.5 && L.book.y + L.book.h + 14 <= L.H + 0.5,
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
    slug: 'sources-08-inspect',
    title: 'Cross-reference between articles — inspect and replace the printed phrase',
    titleEs: 'Remisión entre artículos — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Remisión entre artículos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The desk shrinks to a miniature while a window enlarges the cross-reference phrase printed in a fictional article. The old phrase is struck and lifted into a change card; the supplied new phrase is inked in and only the dependent geometry updates: the old trail and ring become ghosts, the flag hops to the newly referenced article and a new trail is drawn. The desk returns with a Δ marker; nothing is concluded.',
    tags: ['cross-reference', 'remisión', 'inspect', 'magnifier', 'lupa', 'datum change', 'page flag', 'article', 'book'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/remision-entre-articulos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RA_STRINGS,
  scene,
});
