/**
 * LAW-0092 — Distinción de casos · inspect
 *
 * Storyboard (the pin board after the magnifier has done its work; a bar
 * magnifier lifts one row out to examine it):
 *  0.00–0.20 context   The state produced by the story is built: the two case
 *                      cards pinned edge to edge, one pictogram token per fact
 *                      facing its twin across the seam; chain links snap
 *                      across every matching row, the distinguishing row keeps
 *                      a broken link; the extracted fact hangs in the clip
 *                      under the rule card (text as supplied), its card keeps a
 *                      dashed ghost, and the other card's entry for that row
 *                      reads the supplied BEFORE value (e.g. "Not recorded").
 *  0.20–0.45 isolate   A dashed outline rings that row; a rectangular reading
 *                      magnifier lifts off exactly there (zoom 1 = a real copy
 *                      at the same coordinates) and travels to the free side,
 *                      growing to the supplied zoom; cone lines keep it tied to
 *                      its source; the rest of the board dims.
 *  0.45–0.75 substitute ONE datum changes, in the board and therefore in the
 *                      enlarged copy: the before value rises, shrinks and is
 *                      struck through (it stays readable above the entry); the
 *                      after value appears under it. Only its dependants
 *                      update — absent entry: a token is pressed into the
 *                      empty socket, the broken link closes and the tag under
 *                      the clip changes to "Recorded in both · as supplied";
 *                      present entry: the ghost's and the clipped token's
 *                      pictogram change, the link stays broken.
 *  0.75–1.00 return    The magnifier shrinks back onto its source and leaves;
 *                      the board undims; a changed-datum pin (and its label)
 *                      stays on the entry, the struck before value stays
 *                      traceable. Seeking back restores the before value
 *                      exactly. No validity, responsibility or outcome.
 * Layouts: 16:9 board on the left, magnifier destination on the right; 1:1
 * and 9:16 board on top, destination below (placement is editable).
 * Legal content: fictional facts, illustrative rule text as supplied,
 * jurisdiction unspecified.
 * @module animations/reasoning/LAW-0092
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, oneOf, num, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {placeChip, stateTag} from '../causation/kits/place.js';
import {
  reasoningFields, DC_STRINGS, ICONS, resolveFacts, dcColors, corkBoard, corkCopy, pairGeometry, pairPaper, pairTokens, pairFrame,
  ruleCard, hangingClip, factToken, ghostRing, linkMark, stickyNote, pushPin, barLens,
} from './kits/distincion-de-casos.js';

const ID = 'LAW-0092';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  caption: [0, 0.08], build: [0.02, 0.13], extracted: [0.07, 0.13], tag: [0.11, 0.17], notes: [0.12, 0.19],
  ring: [0.19, 0.24], open: [0.23, 0.34],
  lift: [0.46, 0.53], strike: [0.51, 0.56], swapIn: [0.55, 0.62], link: [0.59, 0.65], after: [0.6, 0.67], depOut: [0.64, 0.67], depIn: [0.67, 0.71],
  close: [0.76, 0.87], marker: [0.85, 0.93],
};

const STRINGS = {
  en: {...DC_STRINGS.en, earlierCase: 'Earlier case', newCase: 'New case', recordedBoth: 'Recorded in both · as supplied', before: 'before'},
  es: {...DC_STRINGS.es, earlierCase: 'Caso anterior', newCase: 'Caso nuevo', recordedBoth: 'Consta en ambos · según lo aportado', before: 'antes'},
};

const TARGETS = ['absent-entry', 'present-entry'];
const sceneSchema = {
  ...reasoningFields,
  focusTarget: oneOf('Entry of the distinguishing row that is enlarged and substituted: the entry of the case that lacks the fact (absent-entry) or of the case that records it (present-entry)', TARGETS),
  beforeValue: str('Value of that entry before the substitution (shown struck through afterwards, never deleted)', 90),
  afterValue: str('Value of that entry after the substitution (the alternative datum supplied by the author)', 90),
  afterIcon: oneOf('Pictogram of the entry after the substitution (absent-entry: the token pressed into the socket; present-entry: the new pictogram)', ICONS),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Magnification of the reading magnifier at its destination (reduced if the free side is smaller)', 1.5, 4),
    placement: oneOf('Where the magnifier travels: auto (right on wide boxes, below on tall and square boxes), left, right, top or bottom', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption above the board', 90),
    marker: str('Label of the changed-datum pin that stays after the return', 40),
  }),
};

const defaultParams = {
  facts: [
    {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
    {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
    {text: 'Seller sent a written warning', icon: 'letter', in: 'a'},
    {text: 'Price paid in cash', icon: 'coin', in: 'both'},
  ],
  rules: ['Rule R (illustrative), as stated in the earlier case'],
  issues: ['Does the warning matter for rule R?'],
  assumptions: ['Fictional facts; the other facts are treated as equal'],
  focusTarget: 'absent-entry',
  beforeValue: 'Not recorded',
  afterValue: 'Written warning recorded',
  afterIcon: 'letter',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Context: the comparison after the differing fact was lifted out', marker: 'Changed datum'},
};

const SHAPES = {
  landscape: {text: 25, label: 26, rule: 24, note: 24, tag: 22, cap: 22, maxRowH: 170},
  square: {text: 28, label: 29, rule: 26, note: 27, tag: 25, cap: 25, maxRowH: 160},
  portrait: {text: 26, label: 27, rule: 24, note: 24, tag: 22, cap: 23, maxRowH: 190},
};

const P2 = q => ({x: r(q.x), y: r(q.y)});

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1000], portrait: [900, 1440]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const shape = ctx.view.shape;
    const SH = SHAPES[shape];
    const C = dcColors(ctx);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const M = 22;

    // --- facts, target entry
    const F = resolveFacts(p.facts);
    const has = F.diff >= 0;
    const k = has ? F.diff : Math.floor((F.n - 1) / 2);
    const present = has ? F.side : 'b';
    const absent = has ? (present === 'a' ? 'b' : 'a') : null;
    const mode = has && p.focusTarget === 'absent-entry' ? 'absent' : 'present';
    const ts = mode === 'absent' ? absent : present;

    // --- regions: caption and the board (the magnifier floats over the dimmed board, clear of its source row)
    const capFit = showAll && p.contextLabels.context ? ctx.fit(p.contextLabels.context, {maxWidth: D.w - 2 * M, size: SH.cap, minSize: SH.cap * 0.8, maxLines: 2, weight: 600}) : null;
    const top = M + (capFit ? capFit.height + 14 : 0);
    const boardBox = {x: M, y: top, w: D.w - 2 * M, h: D.h - top - M};
    const board = corkBoard(ctx, {prefix: 'bd', ...boardBox, frame: 18, seedKey: 'cork'});
    const I = board.inner;
    const col = I.w / I.h >= 1.5;
    const tagH = SH.tag * 1.75;
    const labels = {a: t.earlierCase, b: t.newCase};
    const pairFor = R0 => pairGeometry(ctx, {...R0, facts: F, labels, textSize: SH.text, labelSize: SH.label, maxRowH: SH.maxRowH});

    // --- rule card + clip (column on wide boards, a band over the cards otherwise), cards
    let rule, ruleOpts, clipC, geo, cardsR;
    if (col) {
      const colW = clamp(I.w * 0.3, 300, 460);
      const colX = I.x + I.w - colW - 18;
      cardsR = {x: I.x + 20, y: I.y + 16, w: colX - 30 - (I.x + 20), h: I.h - 32};
      geo = pairFor(cardsR);
      for (const [k0, maxLines] of [[1, 3], [1, 4], [0.88, 4], [0.8, 5]]) {
        ruleOpts = {x: colX, y: I.y + 20, w: colW, rules: p.rules, head: t.ruleHead, headScale: 0.95, size: SH.rule * k0, maxLines};
        rule = ruleCard(ctx, {prefix: 'probe', ...ruleOpts});
        if (!rule.fits.some(f => f.truncated)) break;
      }
      clipC = {x: rule.eyelet.x, y: rule.eyelet.y + 40 + geo.R * 1.96};
    } else {
      const rw = clamp(I.w * 0.55, 340, 600);
      for (const [k0, maxLines] of [[1, 2], [1, 3], [0.9, 3], [0.82, 4]]) {
        ruleOpts = {x: I.x + I.w - rw - 18, y: I.y + 18, w: rw, rules: p.rules, head: t.ruleHead, headScale: 0.95, size: SH.rule * k0, maxLines};
        rule = ruleCard(ctx, {prefix: 'probe', ...ruleOpts});
        if (!rule.fits.some(f => f.truncated)) break;
      }
      let R0 = 40;
      for (let it = 0; it < 4; it++) {
        const cy = rule.eyelet.y + 34 + R0 * 1.96;
        const y0 = cy + R0 * 1.22 + 10 + tagH + 16;
        cardsR = {x: I.x + 18, y: y0, w: I.w - 36, h: I.y + I.h - 12 - y0};
        geo = pairFor(cardsR);
        R0 = geo.R;
      }
      clipC = {x: rule.eyelet.x, y: rule.eyelet.y + 34 + geo.R * 1.96};
    }
    const R = geo.R;
    const row = geo.rows[k];
    const cellT = row[ts];
    cellT.skipText = true;
    const other = ts === 'a' ? 'b' : 'a';
    const rimOf = side => (side === 'a' ? C.a : C.b);
    const iconBefore = row.icon;
    const iconAfter = p.afterIcon || row.icon;

    // --- the substituted entry: before value (lifts, shrinks, struck) and after value under it
    const zone = cellT.zone;
    const bFit = ctx.fit(p.beforeValue, {maxWidth: zone.w, size: SH.text, minSize: SH.text * 0.8, maxLines: 2, weight: 500});
    const SMALL = 0.78;
    // the after value must stay whole: two lines, then smaller type, then a third line
    let aFit = null;
    for (const [sc, lines] of [[1, 2], [0.9, 2], [0.82, 2], [0.82, 3], [0.74, 3]]) {
      const f = ctx.fit(p.afterValue, {maxWidth: zone.w, size: SH.text * sc, minSize: SH.text * sc * 0.9, maxLines: lines, weight: 700});
      if (!aFit || !f.truncated) aFit = f;
      if (!f.truncated && bFit.height * SMALL + 8 + f.height <= zone.h) break;
    }
    // the changed-datum label rides on the first line, right of the struck before value
    const mkSize = SH.note;
    const mkRoom = zone.w - Math.min(zone.w, bFit.width) * SMALL - 14;
    let mkChip = null;
    if (showKey && p.contextLabels.marker) {
      const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: Math.max(60, mkRoom), size: mkSize, minSize: mkSize * 0.8, maxLines: 1, weight: 700});
      if (mkRoom >= 90 && !probe.fit.truncated) mkChip = probe;
    }
    const line1 = Math.max(bFit.height * SMALL, mkChip ? mkChip.box.h : 0);
    const stackH = line1 + 8 + aFit.height;
    const yS = row.cy - stackH / 2 + (line1 - bFit.height * SMALL) / 2;
    const entry = {
      zone,
      x: zone.x,
      y0: row.cy - bFit.height / 2,
      yS,
      yA: row.cy - stackH / 2 + line1 + 8,
      bFit, aFit, SMALL, italic: mode === 'absent',
      strikeW: bFit.lines.map(ln => Math.min(zone.w, ctx.measure(ln, bFit.size, 500, 'sans')) + 6),
    };

    // --- source region of the row and the magnifier's destination (uniform zoom)
    const xs = [row.a.x - R - 12, row.b.x + R + 12, zone.x - 8, zone.x + Math.max(bFit.width, aFit.width) + 12];
    const S = {x: Math.min(...xs), y: row.cy - geo.rowH / 2 + 3, w: 0, h: geo.rowH - 6};
    S.w = Math.max(...xs) - S.x;
    // --- while inspecting, the board shrinks to a context miniature and the magnifier takes the main area
    const zWant = p.detailGeometry.zoom;
    const pl0 = p.detailGeometry.placement;
    const pl = pl0 === 'auto' ? 'bottom' : pl0;
    const vertical = pl === 'top' || pl === 'bottom';
    const avail = {x: M, y: top, w: D.w - 2 * M, h: D.h - top - M};
    const gapM = 40;
    let z = Math.min(zWant, (avail.w - 30) / S.w, (vertical ? avail.h * 0.55 : avail.h - 30) / S.h);
    if (!vertical) z = Math.min(z, (avail.w * 0.6) / S.w);
    const Dw = S.w * z, Dh = S.h * z;
    // the miniature: the whole board, scaled into the space the magnifier leaves
    const mini = vertical
      ? Math.min(0.6, (avail.h - Dh - gapM) / boardBox.h, avail.w / boardBox.w)
      : Math.min(0.6, (avail.w - Dw - gapM) / boardBox.w, avail.h / boardBox.h);
    const mw = boardBox.w * mini, mh = boardBox.h * mini;
    let miniPos, dest;
    if (vertical) {
      const blockH = mh + gapM + Dh;
      const y0 = avail.y + (avail.h - blockH) / 2;
      miniPos = {x: avail.x + (avail.w - mw) / 2, y: pl === 'bottom' ? y0 : y0 + Dh + gapM};
      dest = {x: avail.x + (avail.w - Dw) / 2, y: pl === 'bottom' ? y0 + mh + gapM : y0, w: Dw, h: Dh};
    } else {
      const blockW = mw + gapM + Dw;
      const x0 = avail.x + (avail.w - blockW) / 2;
      miniPos = {x: pl === 'right' ? x0 : x0 + Dw + gapM, y: avail.y + (avail.h - mh) / 2};
      dest = {x: pl === 'right' ? x0 + mw + gapM : x0, y: avail.y + (avail.h - Dh) / 2, w: Dw, h: Dh};
    }
    const zFit = z;
    const Sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};

    // --- board art (main + magnified copy share the builders)
    const clipFor = prefix => hangingClip(ctx, {prefix, eyelet: rule.eyelet, c: clipC, R, icon: has ? iconBefore : null, rim: rimOf(present)});
    const tagFor = (prefix, text, color, name) => {
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: SH.tag, maxWidth: I.w - 40});
      const cx = clamp(clipC.x, I.x + 12 + probe.box.w / 2, I.x + I.w - 12 - probe.box.w / 2);
      return stateTag(ctx, text, {x: cx, y: clipC.y + R * 1.22 + 10, anchor: 'middle', size: SH.tag, maxWidth: I.w - 40, name: `${prefix}${name}`, color, opacity: 0});
    };
    const art = prefix => {
      const clip = clipFor(prefix);
      const extra = [];
      // present entry: a second clipped token and a second ghost carry the after pictogram
      if (has && mode === 'present') {
        extra.push(g({transform: T(clipC.x, clipC.y)}, factToken(ctx, {name: `${prefix}-ctok2`, R, icon: iconAfter, rim: rimOf(present), opacity: 0})));
      }
      const tags = showKey && has ? [
        tagFor(prefix, t.distinguishing, C.a, '-tag1'),
        mode === 'absent' ? tagFor(prefix, t.recordedBoth, th.inkSoft, '-tag2') : null,
      ].filter(Boolean) : [];
      const cellLayer = [];
      if (has && mode === 'present') cellLayer.push(g({transform: T(cellT.x, cellT.y)}, ghostRing(ctx, {name: `${prefix}-ghost2`, R, icon: iconAfter, rim: rimOf(present)})));
      // the link the substitution closes (absent entry)
      if (has && mode === 'absent') cellLayer.push(g({transform: T(geo.seam, row.cy)}, g({name: `${prefix}-lkxw`}, linkMark(ctx, {name: `${prefix}-lkx`, s: Math.max(18, R * 0.6)}))));
      return {
        rule: ruleCard(ctx, {prefix: `${prefix}rule`, ...ruleOpts}).node,
        clip,
        clipNode: g(null, clip.node, extra),
        paper: pairPaper(ctx, geo, {prefix}),
        tokens: pairTokens(ctx, geo, prefix, {diff: has ? k : -1, side: has ? present : null, extraToken: has && mode === 'absent' ? {side: ts, row: k, icon: iconAfter} : null}),
        cellLayer,
        entry: entryNode(ctx, prefix, entry),
        tags,
      };
    };
    const main = art('m');
    const copy = art('z');
    const zoomContent = g(null, corkCopy(ctx, board, 'cork'), copy.rule, copy.clipNode, copy.paper, copy.tokens, copy.cellLayer, copy.entry, copy.tags.map(x => x.node));
    const lensObj = barLens(ctx, {name: 'lens', source: S, dest, content: zoomContent, dim: {x: board.outer.x, y: board.outer.y, w: board.outer.w, h: board.outer.h}});

    // --- changed-datum pin (graphic, stays with labels hidden) and its label
    const pinPt = {x: cellT.x + (ts === 'b' ? 1 : -1) * R * 0.72, y: cellT.y - R * 0.72};
    const obstacles = [rule.box, {x: clipC.x - R * 1.3, y: rule.box.y + rule.box.h, w: R * 2.6, h: clipC.y + R * 1.3 - rule.box.y - rule.box.h}, ...main.tags.map(x => x.box),
      ...geo.rows.flatMap(q => ['a', 'b'].map(sd => ({x: q[sd].x - R - 4, y: q[sd].y - R - 4, w: 2 * R + 8, h: 2 * R + 8}))),
      ...geo.rows.flatMap(q => ['a', 'b'].filter(sd => q[sd].fit && !q[sd].skipText && showKey).map(sd => ({x: q[sd].zone.x - 4, y: q.cy - q[sd].fit.height / 2 - 4, w: q[sd].fit.width + 8, h: q[sd].fit.height + 8}))),
      {x: entry.x - 4, y: entry.yS - 4, w: Math.max(bFit.width * SMALL, aFit.width) + 8, h: stackH + 8}, geo.headText.a, geo.headText.b];
    let marker = null;
    if (mkChip) {
      const mx = zone.x + Math.min(zone.w, bFit.width) * SMALL + 14;
      const my = row.cy - stackH / 2 + (line1 - mkChip.box.h) / 2;
      const c = chip(ctx, p.contextLabels.marker, {x: mx, y: my, maxWidth: Math.max(60, mkRoom), size: mkSize, minSize: mkSize * 0.8, maxLines: 1, weight: 700, fill: th.card, stroke: th.accent, color: th.accent});
      marker = {node: g({name: 'marker', opacity: 0}, c.node), box: c.box, frame: q => ({marker: {opacity: r(q, 3)}})};
    }

    // --- issue / assumption notes (all labels), in free board space
    const notes = [];
    if (showAll) {
      const spaces = col
        ? [{x: rule.box.x, y: clipC.y + R * 1.22 + 10 + tagH + 18, w: rule.box.w, h: I.y + I.h - 12 - (clipC.y + R * 1.22 + 10 + tagH + 18)}]
        : [{x: I.x + 20, y: I.y + 18, w: rule.box.x - 24 - (I.x + 20), h: cardsR.y - 14 - (I.y + 18)}];
      const sp = spaces[0];
      let y = sp.y;
      if (p.issues.length && sp.w > 180) {
        const n = stickyNote(ctx, {name: 'issue', x: sp.x + 4, y: y + 6, w: Math.min(sp.w - 8, 420), head: t.issue, text: p.issues[0], size: SH.note, headScale: 0.95, rot: -1.2});
        if (n.box.y + n.box.h <= sp.y + sp.h) { notes.push(n); y = n.box.y + n.box.h + 10; }
      }
      if (p.assumptions.length && sp.w > 180) {
        const c = chip(ctx, `${t.assumption}: ${p.assumptions[0]}`, {x: sp.x, y, maxWidth: Math.min(sp.w, 440), size: SH.note * 0.92, maxLines: 3, weight: 500, fill: th.card, stroke: th.inkFaint, name: 'foot'});
        if (c.box.y + c.box.h <= sp.y + sp.h) notes.push({node: g({name: 'footg', opacity: 0}, c.node), box: c.box, foot: true});
      }
    }

    // no room beside the struck value: the label goes to the nearest free spot of the board, with a leader to the pin's flag
    if (!marker && showKey && p.contextLabels.marker) {
      const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: 300, size: SH.note, maxLines: 1, weight: 700});
      const flag = {x: pinPt.x, y: pinPt.y - 26, r: 10};
      const res = placeChip({w: probe.box.w, h: probe.box.h}, flag, {obstacles: [...obstacles, ...notes.map(nt => nt.box)], bounds: {x: I.x + 8, y: I.y + 8, w: I.w - 16, h: I.h - 16},
        order: ['aboveR', 'aboveL', 'above', 'rightHigh', 'leftHigh', 'belowR', 'belowL'], gaps: [24, 44, 70, 100, 140, 190]});
      if (res) marker = chipWithLeader(ctx, {name: 'marker', text: p.contextLabels.marker, chipAt: {x: res.x, y: res.y}, target: {x: pinPt.x, y: pinPt.y + 4}, size: SH.note, color: th.accent});
    }

    return {F, has, k, present, absent, mode, ts, other, R, geo, row, cellT, board, rule, clipC, main, copy, lensObj, S, dest, zFit, entry, pinPt, marker, notes, capFit, M, iconBefore, iconAfter, boardBox, mini, miniPos};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = dcColors(ctx);
    const main = L.main;
    return g(null,
      L.capFit ? g({name: 'caption', opacity: 0}, textBlock(L.capFit, {x: L.M, y: L.M, fill: th.fg, name: 'caption-t'})) : null,
      g({name: 'ctx'},
        L.board.surface,
        g({'clip-path': L.board.clip},
          main.rule,
          main.clipNode,
          main.paper,
          main.tokens,
          main.cellLayer,
          main.entry,
          main.tags.map(x => x.node),
          L.notes.map(n => n.node),
          // changed-datum pin (graphic marker; the label rides next to the struck value)
          g({name: 'pin', opacity: 0, transform: T(L.pinPt.x, L.pinPt.y)},
            h('path', {d: 'M0 0L0 -34', stroke: '#1f2328', 'stroke-width': 3, 'stroke-linecap': 'round'}),
            h('path', {d: 'M1 -34L30 -26L1 -17Z', fill: th.accent, stroke: '#1f2328', 'stroke-width': 2, 'stroke-linejoin': 'round'}),
            pushPin(0, 0, C.pinA, 8)),
          L.marker && L.marker.node,
        )),
      L.lensObj.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    const has = L.has;
    const absentMode = L.mode === 'absent';

    // --- context build: links snap row by row, the extracted fact and its tag appear
    const n = L.F.n;
    const links = L.F.rows.map((_, i) => ease.outCubic(seg(u, W.build[0] + (i / n) * (W.build[1] - W.build[0]) * 0.7, W.build[0] + ((i + 1) / n) * (W.build[1] - W.build[0]))));
    const extracted = s('extracted');
    const st = {links, absentHi: has ? links[L.k] : 0, taken: has, ghost: extracted};
    for (const P of ['m', 'z']) Object.assign(nodes, pairFrame(L.geo, P, st, {diff: has ? L.k : -1, side: has ? L.present : null}));
    if (L.capFit) nodes.caption = {opacity: r(s('caption'), 3)};

    // --- substitution
    const lift = ease.inOutCubic(s('lift'));
    const strike = s('strike');
    const swapIn = s('swapIn');
    const linkK = ease.outCubic(s('link'));
    const after = s('after');
    const depOut = s('depOut'), depIn = s('depIn');
    for (const P of ['m', 'z']) {
      const clipState = {open: 0, tokenOn: has && extracted > 0, swing: 0};
      Object.assign(nodes, (P === 'm' ? L.main : L.copy).clip.frame(clipState));
      if (has) nodes[`${P}-ctok`] = {opacity: r(absentMode ? extracted : extracted * (1 - swapIn), 3)};
      Object.assign(nodes, entryFrame(P, L.entry, {lift, strike, after}));
      if (has && absentMode) {
        // a token is pressed into the empty socket, the broken link gives way to a closed one
        const drop = ease.outCubic(swapIn);
        nodes[`${P}-x${L.ts}${L.k}`] = {opacity: r(clamp(swapIn * 2.5), 3), transform: swapIn > 0 && swapIn < 1 ? `scale(${r(1.3 - 0.3 * drop, 4)})` : ''};
        nodes[`${P}-h${L.ts}${L.k}`] = {opacity: r(links[L.k] * (1 - swapIn), 3)};
        nodes[`${P}-bk${L.k}`] = {opacity: r(clamp(links[L.k] * 2.5) * (1 - clamp(linkK * 2)), 3)};
        nodes[`${P}-lkx`] = {opacity: r(clamp((linkK - 0.3) / 0.4), 3)};
        nodes[`${P}-lkxw`] = {transform: linkK > 0.3 && linkK < 1 ? `scale(${r(0.6 + 0.4 * clamp((linkK - 0.3) / 0.7), 4)})` : ''};
        if (ctx.show('key')) {
          nodes[`${P}-tag1`] = {opacity: r(s('tag') * (1 - depOut), 3), transform: depOut > 0 ? T(0, -14 * depOut) : ''};
          nodes[`${P}-tag2`] = {opacity: r(depIn, 3), transform: depIn > 0 && depIn < 1 ? T(0, 10 * (1 - depIn)) : ''};
        }
      } else if (has) {
        // present entry: the ghost's and the clipped token's pictogram change; the link stays broken
        nodes[`${P}-ghost`] = {opacity: r(extracted * (1 - swapIn), 3)};
        nodes[`${P}-ghost2`] = {opacity: r(swapIn, 3)};
        nodes[`${P}-ctok2`] = {opacity: r(swapIn, 3)};
        if (ctx.show('key')) nodes[`${P}-tag1`] = {opacity: r(s('tag'), 3)};
      }
    }

    // --- the magnifier: ring, lift-off, travel, return; the board shrinks to a miniature meanwhile
    const open = ease.inOutCubic(s('open'));
    const close = ease.inOutCubic(s('close'));
    const pOpen = u < W.close[0] ? open : 1 - close;
    const m = lerp(1, L.mini, pOpen);
    const B = L.boardBox;
    const pos = {x: lerp(B.x, L.miniPos.x, pOpen), y: lerp(B.y, L.miniPos.y, pOpen)};
    const world = q => ({x: pos.x + (q.x - B.x) * m, y: pos.y + (q.y - B.y) * m});
    nodes.ctx = {transform: pOpen > 0 ? `translate(${r(pos.x)} ${r(pos.y)}) scale(${r(m, 4)}) translate(${r(-B.x)} ${r(-B.y)})` : ''};
    const s0 = world({x: L.S.x, y: L.S.y});
    const src = {x: s0.x, y: s0.y, w: L.S.w * m, h: L.S.h * m};
    const bo = L.board.outer;
    const b0 = world({x: bo.x, y: bo.y});
    const dimRect = {x: b0.x, y: b0.y, w: bo.w * m, h: bo.h * m};
    const ring = s('ring');
    const lf = L.lensObj.frame(pOpen, pOpen, src, dimRect);
    Object.assign(nodes, lf.nodes);
    // the source outline shows from the ring beat until the magnifier is back
    nodes['lens-src'].opacity = r(u < W.close[1] ? ring : 0, 3);

    // --- notes, marker
    L.notes.forEach(nt => { nodes[nt.foot ? 'footg' : 'issue'] = {opacity: r(s('notes'), 3)}; });
    const mk = s('marker');
    nodes.pin = {opacity: r(mk, 3), transform: mk > 0 && mk < 1 ? `${T(L.pinPt.x, L.pinPt.y - 18 * (1 - ease.outCubic(mk)))}` : T(L.pinPt.x, L.pinPt.y)};
    if (L.marker) Object.assign(nodes, L.marker.frame(mk));

    // --- semantics
    const R = lf.rect;
    const k = lf.zoom;
    const Sc = {x: L.S.x + L.S.w / 2, y: L.S.y + L.S.h / 2};
    const mapped = {x: R.x - L.S.x * k + Sc.x * k, y: R.y - L.S.y * k + Sc.y * k};
    const lensC = {x: R.x + R.w / 2, y: R.y + R.h / 2};
    const datum = lift <= 0 ? 'before' : after >= 1 ? 'after' : 'swapping';
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const semantic = {
      beat,
      target: L.mode === 'absent' ? 'absent-entry' : 'present-entry',
      row: L.k,
      targetSide: L.ts,
      lensOpen: r(pOpen, 3),
      zoom: r(k, 3),
      zoomVsMiniature: r(k / m, 3),
      zoomAtDest: r(L.zFit, 3),
      lensC: P2(lensC),
      sourceCentre: P2(Sc),
      copyErr: r(Math.hypot(mapped.x - lensC.x, mapped.y - lensC.y), 3),
      dim: r(pOpen, 3),
      mini: r(m, 4),
      srcErr: r(Math.hypot(R.x - src.x, R.y - src.y) + Math.abs(R.w - src.w), 3),
      datum,
      beforeShown: true,
      beforeStruck: r(strike, 3),
      afterShown: r(after, 3),
      entryValue: after >= 1 ? 'after' : 'before',
      tokenInSocket: absentMode && has ? swapIn >= 1 : null,
      icon: !has ? L.iconBefore : absentMode ? (swapIn >= 1 ? L.iconAfter : null) : (swapIn >= 1 ? L.iconAfter : L.iconBefore),
      link: !has ? 'closed' : absentMode && linkK >= 1 ? 'closed' : 'broken',
      clipTag: !has ? 'none' : absentMode && depIn >= 1 ? 'recorded-both' : 'distinguishing',
      markerShown: mk >= 1,
      links: links.map(v => r(v, 3)),
      outcome: null,
    };
    return {nodes, semantic};
  },
};

/** The substituted entry: before value (lifts, shrinks, struck through) and after value. */
function entryNode(ctx, P, E) {
  const th = ctx.theme;
  const strikes = E.bFit.lines.map((ln, j) => {
    const w = E.strikeW[j];
    const y = j * E.bFit.lineHeight + E.bFit.size * 0.52;
    return h('line', {name: `${P}-strike${j}`, x1: r(E.x - 3), x2: r(E.x - 3 + w), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(w)} ${r(w + 12)}`, 'stroke-dashoffset': r(w)});
  });
  // with labels hidden both values become text bars (the substitution still reads: struck bar, new bar)
  const bars = (fit, fill) => fit.lines.map((ln, j) => h('rect', {x: r(E.x), y: r(j * fit.lineHeight + fit.size * 0.2), width: r(Math.min(E.zone.w, ctx.measure(ln, fit.size, fit.weight, 'sans'))), height: r(fit.size * 0.55), rx: r(fit.size * 0.27), fill}));
  const show = ctx.show('key');
  return g({name: `${P}-entry`},
    g({name: `${P}-before`, transform: `translate(0 ${r(E.y0)})`},
      show ? textBlock(E.bFit, {x: E.x, y: 0, fill: th.inkSoft, italic: E.italic, name: `${P}-before-t`}) : bars(E.bFit, '#d6d0c4'),
      strikes),
    g({name: `${P}-after`, opacity: 0, transform: `translate(0 ${r(E.yA)})`},
      show ? textBlock(E.aFit, {x: E.x, y: 0, fill: '#1f2328', name: `${P}-after-t`}) : bars(E.aFit, '#8a8272')),
  );
}

/** Frame record of the substituted entry. */
function entryFrame(P, E, s) {
  const y = lerp(E.y0, E.yS, s.lift);
  const sc = lerp(1, E.SMALL, s.lift);
  const out = {
    [`${P}-before`]: {transform: `translate(${r(E.x)} ${r(y)}) scale(${r(sc, 4)}) translate(${r(-E.x)} 0)`, opacity: r(1 - 0.35 * s.lift, 3)},
    [`${P}-after`]: {opacity: r(s.after, 3), transform: `translate(0 ${r(E.yA + 12 * (1 - s.after))})`},
  };
  E.strikeW.forEach((w, j) => { out[`${P}-strike${j}`] = {'stroke-dashoffset': r((1 - s.strike) * w)}; });
  return out;
}

/** Chip + leader to a point (the changed-datum label). */
function chipWithLeader(ctx, o) {
  const c = chip(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: 'middle', maxWidth: 300, size: o.size, maxLines: 1, fill: ctx.theme.card, stroke: o.color, color: o.color, name: `${o.name}-chip`, weight: 700});
  const b = c.box;
  const from = {x: clamp(o.target.x, b.x + 8, b.x + b.w - 8), y: o.target.y > b.y + b.h ? b.y + b.h : b.y};
  const len = Math.hypot(o.target.x - from.x, o.target.y - from.y);
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(o.target.x), y2: r(o.target.y - 30), stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '6 5'}),
    c.node);
  const frame = p => ({[o.name]: {opacity: r(p, 3)}});
  return {node, frame, box: b, len};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-03-inspect',
    title: 'Distinguishing cases — inspect the differing row and change one entry',
    titleEs: 'Distinción de casos — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Distinción de casos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The pin board after the distinguishing fact was lifted into the rule\'s clip. A rectangular reading magnifier lifts off the distinguishing row (a real copy at the same coordinates), travels to the free side and enlarges it; one supplied entry changes (before value struck through, after value under it) and only its dependants update — a token pressed into the socket and the link closing, or the pictogram of the fact. It returns to context with a changed-datum pin.',
    tags: ['reasoning', 'distinguishing', 'cases', 'inspect', 'magnifier', 'substitution', 'before', 'after', 'facts', 'rule', 'pin board'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/distincion-de-casos.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
