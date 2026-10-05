/**
 * LAW-0014 — Redacción comparada · mechanism
 *
 * Storyboard (exploded comparator, 7 s):
 *  0.00–0.18  separate: the two versions start stacked in the middle and
 *             slide apart — ORIGINAL to the left, REVISED to the right —
 *             uncovering the ROW LADDER between them (one rung per clause
 *             row, numbered at both ends); the change register, pen and
 *             folder come in.
 *  0.18–0.43  relate: only the supplied relationships are drawn, anchored to
 *             element edges and styled by kind (plain relation = no arrow;
 *             sequence / communication arrows; causal only when supplied).
 *  0.43–0.75  trace: a tracer follows the supplied traversal order; each
 *             element it passes is ringed by a halo and the focus element
 *             enlarges (a focused sheet only slightly). When it
 *             passes the ladder, rungs of rows that differ turn to ink and
 *             the modified words light up on both sheets; when it reaches
 *             the change register, each before/after word pair is linked.
 *  0.75–1.00  gather: origin (original), transformation (the linked pairs)
 *             and state (rows marked "changed" or "=") stay visible.
 * No legal effect of the changes is stated.
 * @module animations/documents/LAW-0014
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {pen as penTool, shade} from '../../primitives/paper.js';
import {iconBadge} from '../../primitives/badges.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath} from '../../core/geometry.js';
import {FONTS} from '../../core/text.js';
import {comparedFields, buildDiff, alignedLayout, sheetNode, tabGeometry, versionStyle, COMPARE_STRINGS} from './kits/redaccion-comparada.js';

const ID = 'LAW-0014';
const DURATION = 7000;
const IDS = ['original', 'alignment', 'revised', 'change', 'pen', 'folder'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const sceneSchema = {
  ...comparedFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'DOC-212',
  documentTitle: 'Printing Services Agreement',
  clauses: [
    'The Provider will deliver the printed brochures to the main office.',
    'Each delivery is recorded on the shared order sheet.',
    'Either party may contact the other by letter.',
  ],
  edits: [
    {clause: 0, from: 'printed', to: 'digital'},
    {clause: 0, from: 'main', to: 'branch'},
    {clause: 2, from: 'letter', to: 'email'},
  ],
  signers: [{name: 'Lena Ortiz', role: 'Party A'}, {name: 'Kofi Mensah', role: 'Party B'}],
  redactions: [],
  elements: [
    {id: 'original', label: 'Original text (A)'},
    {id: 'alignment', label: 'Rows aligned by clause'},
    {id: 'revised', label: 'Revised text (B)'},
    {id: 'change', label: 'Modified words'},
    {id: 'pen', label: 'Drafter’s pen'},
    {id: 'folder', label: 'Drafting file'},
  ],
  relationships: [
    {from: 'original', to: 'alignment', kind: 'relation', label: 'by row'},
    {from: 'alignment', to: 'revised', kind: 'relation', label: 'by row'},
    {from: 'alignment', to: 'change', kind: 'relation', label: 'same row, other words'},
    {from: 'pen', to: 'revised', kind: 'sequence', label: 'writes the revision'},
    {from: 'folder', to: 'original', kind: 'relation', label: 'keeps'},
    {from: 'folder', to: 'revised', kind: 'relation', label: 'keeps'},
  ],
  focusElement: 'change',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['original', 'alignment', 'change', 'alignment', 'revised'],
};

/**
 * Hand-placed geometry per shape (centres, design units): the change register
 * sits above the ladder, the folder below it. On wide and square boxes the pen
 * badge sits above the revised text, placed so that its arrow lands on the
 * middle of that sheet's version tab (never under it); on tall boxes it sits
 * below the revised text and its arrow enters the sheet's bottom edge.
 */
const PLACES = {
  landscape: {size: [2000, 1000], sheet: [470, 540], body: [26, 16], tab: 23, original: [300, 612], revised: [1700, 612], ladder: 300, card: [1000, 24, 760], pen: {r: 62, y: 70}, folder: [1000, 880, 280, 104, 'right'], ladderLabel: 'inside', legend: [300, 972]},
  square: {size: [1500, 1180], sheet: [430, 620], body: [25, 15], tab: 24, original: [245, 668], revised: [1255, 668], ladder: 250, card: [750, 22, 600], pen: {r: 62, y: 70}, folder: [750, 1060, 260, 100, 'right'], ladderLabel: 'inside', legend: [245, 1150]},
  portrait: {size: [960, 1460], sheet: [276, 600], body: [20, 13], tab: 18, original: [158, 720], revised: [802, 720], ladder: 120, card: [480, 22, 740], pen: {r: 62, x: 826, y: 1318, side: 'left'}, folder: [480, 1160, 340, 110, 'left'], ladderLabel: 'below', legend: [480, 1430]},
};

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const showKey = ctx.show('key');
    const diff = buildDiff(p.clauses, p.edits, p.redactions);

    // --- the two versions (row-aligned)
    const [sw, sh] = Pl.sheet;
    const L = alignedLayout(ctx, {w: sw, h: sh, rows: diff.rows, size: Pl.body[0], minSize: Pl.body[1], docId: p.documentId, title: p.documentTitle, footer: 0.07});
    const tokA = L.place.map(q => q.A);
    const tokB = L.place.map(q => q.B);
    const oc = {x: Pl.original[0], y: Pl.original[1]};
    const rc = {x: Pl.revised[0], y: Pl.revised[1]};
    const stackC = {x: (oc.x + rc.x) / 2, y: oc.y};
    const sheetEl = (id, tokens, side, c) => {
      // the version tab (element label) sticks out above the sheet's top-left
      // edge; long labels get two lines rather than an ellipsis
      const sn = sheetNode(ctx, L, {prefix: `sh-${id}`, tokens, side, tab: label(id), tabSize: Pl.tab, tabLines: 2, tabMax: 0.8, showText: showKey, showKey});
      const tg = tabGeometry(ctx, L, label(id), Pl.tab, 2, 0.8);
      const x0 = c.x - sw / 2, y0 = c.y - sh / 2;
      const tabBox = {x: x0 + tg.box.x, y: y0 + tg.box.y, w: tg.box.w, h: tg.box.h};
      return {
        node: g({name: `el-${id}`, transform: T(c.x, c.y)}, g({name: `el-${id}-body`}, g({transform: T(-sw / 2, -sh / 2)}, sn.node))),
        box: {x: x0, y: y0, w: sw, h: sh},
        // the sheet with its tab: connectors that reach the top of the sheet land on the tab
        full: {x: x0, y: tabBox.y, w: sw, h: sh + tabBox.h},
        tabBox, hl: sn.hl,
      };
    };
    const orig = sheetEl('original', tokA, 'A', oc);
    const rev = sheetEl('revised', tokB, 'B', rc);

    // --- row ladder between the sheets: one rung per clause row, at the row's height
    const rowY = L.rows.map(row => oc.y - sh / 2 + row.top + row.h / 2);
    const ladderW = Pl.ladder;
    const lx0 = stackC.x - ladderW / 2, lx1 = stackC.x + ladderW / 2;
    const inside = Pl.ladderLabel === 'inside';
    const headFit = showKey && inside ? ctx.fit(label('alignment'), {maxWidth: Pl.ladder - 28, size: 24, minSize: 17, maxLines: 2, weight: 700}) : null;
    const headH = inside ? (headFit ? headFit.height + 22 : 14) : 0;
    const ly0 = oc.y - sh / 2 + L.rows[0].top - L.size * 0.9 - headH;
    const ly1 = oc.y - sh / 2 + L.rows[L.rows.length - 1].top + L.rows[L.rows.length - 1].h + L.size * 0.9;
    const changedRow = L.rows.map((row, ci) => diff.rows[ci].changes.length > 0 && !row.redacted);
    const nr = Math.max(12, L.size * 0.62);
    const rungs = L.rows.map((row, ci) => {
      const y = rowY[ci];
      const col = ci % 2 ? th.accent2Soft : th.accent3Soft;
      return g({name: `rung-${ci}`},
        h('rect', {x: r(lx0 + 4), y: r(y - row.h / 2 - 4), width: r(ladderW - 8), height: r(row.h + 8), rx: 10, fill: col, opacity: 0.55}),
        h('line', {name: `rung-${ci}-line`, x1: r(lx0 + nr * 2 + 6), x2: r(lx1 - nr * 2 - 6), y1: r(y), y2: r(y), stroke: th.fgSoft, 'stroke-width': 3, 'stroke-linecap': 'round'}),
        h('line', {name: `rung-${ci}-ink`, x1: r(lx0 + nr * 2 + 6), x2: r(lx1 - nr * 2 - 6), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 4.5, 'stroke-linecap': 'round', opacity: 0}),
        [lx0 + nr + 4, lx1 - nr - 4].map(x => g(null,
          h('circle', {cx: r(x), cy: r(y), r: r(nr), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
          showKey ? h('text', {x: r(x), y: r(y + nr * 0.38), 'text-anchor': 'middle', 'font-size': r(nr * 1.05), 'font-weight': 700, 'font-family': FONTS.sans, fill: th.ink}, String(ci + 1)) : null)),
        // state glyph in the middle of the rung: diamond = words differ, "=" = same wording, bar = withheld
        row.redacted
          ? h('rect', {name: `rung-${ci}-mark`, x: r(stackC.x - nr * 1.3), y: r(y - nr * 0.5), width: r(nr * 2.6), height: r(nr), rx: 3, fill: th.ink, opacity: 0})
          : changedRow[ci]
          ? h('path', {name: `rung-${ci}-mark`, d: `M${r(stackC.x)} ${r(y - nr)}l${r(nr)} ${r(nr)}l${r(-nr)} ${r(nr)}l${r(-nr)} ${r(-nr)}Z`, fill: th.accent, stroke: th.ink, 'stroke-width': 2, opacity: 0})
          : h('g', {name: `rung-${ci}-mark`, opacity: 0},
            h('rect', {x: r(stackC.x - nr), y: r(y - nr * 0.9), width: r(nr * 2), height: r(nr * 1.8), rx: 5, fill: th.card, stroke: th.fgSoft, 'stroke-width': 2}),
            h('path', {d: `M${r(stackC.x - nr * 0.55)} ${r(y - nr * 0.28)}h${r(nr * 1.1)}M${r(stackC.x - nr * 0.55)} ${r(y + nr * 0.28)}h${r(nr * 1.1)}`, stroke: th.fgSoft, 'stroke-width': 3, 'stroke-linecap': 'round'})),
      );
    });
    const ladderBox = {x: lx0, y: ly0, w: ladderW, h: ly1 - ly0};
    const ladderNode = g({name: 'el-alignment'}, g({name: 'el-alignment-body'},
      h('path', {d: roundRectPath(lx0, ly0, ladderW, ly1 - ly0, 16), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
      headFit ? textBlock(headFit, {x: stackC.x, y: ly0 + 11, anchor: 'middle', fill: th.ink}) : null,
      headH ? h('line', {x1: r(lx0 + 12), x2: r(lx1 - 12), y1: r(ly0 + headH - 2), y2: r(ly0 + headH - 2), stroke: th.paperLine, 'stroke-width': 2}) : null,
      h('line', {x1: r(lx0 + nr + 4), x2: r(lx0 + nr + 4), y1: r(ly0 + headH + 12), y2: r(ly1 - 14), stroke: th.paperLine, 'stroke-width': 3}),
      h('line', {x1: r(lx1 - nr - 4), x2: r(lx1 - nr - 4), y1: r(ly0 + headH + 12), y2: r(ly1 - 14), stroke: th.paperLine, 'stroke-width': 3}),
      rungs));
    // (kept about as narrow as the ladder so the connectors to the folder pass beside it)
    const ladderLabel = showKey && !inside ? chip(ctx, label('alignment'), {x: stackC.x, y: ly1 + 12, anchor: 'middle', maxWidth: shape === 'portrait' ? 250 : 330, size: 26, maxLines: 3, name: 'lab-alignment'}) : null;
    const ladderFoot = ladderLabel ? ladderLabel.box.y + ladderLabel.box.h : ly1;

    // --- change register: one row per linked pair (row badge | before | after), linked in the trace beat.
    // The card is sized to its content and centred, so pairs, row badges and
    // the header read as one compact table.
    const [cx, cTop, cwMax] = Pl.card;
    const pairs = diff.order;
    const maxCardH = ly0 - cTop - (shape === 'portrait' ? 120 : 100);
    let tileSize = shape === 'portrait' ? 30 : 32;
    let cardHead, pairFits, pairH, ch, gapRow;
    const tileMax = ts => (cwMax - ts * 5.4) / 2;
    const measureCard = ts => {
      cardHead = ts * 1.5;
      gapRow = ts * 0.42;
      const fitT = text => ctx.fit(text || ' ', {maxWidth: tileMax(ts) - ts * 0.6, size: ts, minSize: ts * 0.8, maxLines: 2, weight: 400, family: 'serif', leading: 1.05});
      pairFits = pairs.map(i => ({a: fitT(diff.changes[i].from), b: fitT(diff.changes[i].to)}));
      pairH = pairFits.map(f => Math.max(ts * 1.44, f.a.height + ts * 0.44, f.b.height + ts * 0.44) + gapRow);
      ch = cardHead + (pairs.length ? pairH.reduce((a, b) => a + b, 0) : ts * 1.7) + ts * 0.3;
    };
    measureCard(tileSize);
    while (ch > maxCardH && tileSize > 20) measureCard(tileSize -= 1);
    const tileW = (f, gap) => (gap ? tileSize * 1.4 : f.width + tileSize * 0.6);
    const maxA = Math.max(tileSize * 1.4, ...pairFits.map((f, k) => tileW(f.a, !diff.changes[pairs[k]].from)));
    const maxB = Math.max(tileSize * 1.4, ...pairFits.map((f, k) => tileW(f.b, !diff.changes[pairs[k]].to)));
    const numR = tileSize * 0.42;
    const linkW = tileSize * 2.2;
    const contentW = numR * 2 + tileSize * 0.5 + maxA + linkW + maxB;
    const tagW = showKey && pairs.length ? ctx.measure(t.linked, 22, 700, 'sans') + 50 : 0;
    const regHeadFit = showKey ? ctx.fit(label('change'), {maxWidth: cwMax - 44 - tagW, size: tileSize * 0.78, minSize: 16, maxLines: 1, weight: 700}) : null;
    const headW = (regHeadFit ? regHeadFit.width : 0) + tagW + 70;
    const cw = Math.min(cwMax, Math.max(contentW + tileSize * 1.6, headW, cwMax * 0.46));
    const cx0 = cx - cw / 2;
    const numX = cx - contentW / 2 + numR;
    const ax = numX + numR + tileSize * 0.5 + maxA;
    const bx = ax + linkW;
    const cy = cTop + ch / 2;
    const cardParts = [
      h('path', {d: roundRectPath(cx0 + 6, cTop + 9, cw, ch, 18), fill: th.shadow}),
      h('path', {d: roundRectPath(cx0, cTop, cw, ch, 18), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
    ];
    if (regHeadFit) cardParts.push(textBlock(regHeadFit, {x: cx0 + 22, y: cTop + tileSize * 0.4, fill: th.ink}));
    cardParts.push(h('line', {x1: r(cx0 + 14), x2: r(cx0 + cw - 14), y1: r(cTop + cardHead - 4), y2: r(cTop + cardHead - 4), stroke: th.paperLine, 'stroke-width': 2}));
    const pairLinks = [];
    let py = cTop + cardHead + gapRow * 0.5;
    pairs.forEach((i, k) => {
      const c = diff.changes[i];
      const y = py + (pairH[k] - gapRow) / 2;
      py += pairH[k];
      const th2 = pairH[k] - gapRow;
      const tile = (text, side, x, anchor, gap) => {
        const st = versionStyle(ctx, side);
        const f = side === 'A' ? pairFits[k].a : pairFits[k].b;
        const w = tileW(f, gap);
        const x0 = anchor === 'end' ? x - w : x;
        const parts = [h('rect', {x: r(x0), y: r(y - th2 / 2), width: r(w), height: r(th2), rx: 8, fill: st.fill, stroke: st.line, 'stroke-width': 2})];
        if (gap) parts.push(h('path', {d: `M${r(x0 + w / 2 - tileSize * 0.3)} ${r(y + tileSize * 0.3)}L${r(x0 + w / 2)} ${r(y - tileSize * 0.3)}L${r(x0 + w / 2 + tileSize * 0.3)} ${r(y + tileSize * 0.3)}`, fill: 'none', stroke: st.line, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
        else if (showKey) {
          const ty = y - f.height / 2 + f.size * 0.06;
          parts.push(textBlock(f, {x: x0 + w / 2, y: ty, anchor: 'middle', fill: th.ink}));
          if (side === 'A') f.lines.forEach((ln, j) => {
            const lw = ctx.measure(ln, f.size, 400, 'serif');
            const ly = ty + j * f.lineHeight + f.size * 0.6;
            parts.push(h('line', {x1: r(x0 + w / 2 - lw / 2 - 3), x2: r(x0 + w / 2 + lw / 2 + 3), y1: r(ly), y2: r(ly), stroke: st.line, 'stroke-width': 2.5}));
          });
        } else parts.push(h('rect', {x: r(x0 + tileSize * 0.3), y: r(y - tileSize * 0.2), width: r(Math.max(10, w - tileSize * 0.6)), height: r(tileSize * 0.4), rx: 4, fill: shade(th.paperLine, -0.14)}));
        return {node: g(null, parts), x0, w};
      };
      const ta = tile(c.from, 'A', ax, 'end', !c.from);
      const tb = tile(c.to, 'B', bx, 'start', !c.to);
      // clause-row badge right beside the pair (same numbering as the sheets and the ladder)
      const num = h('g', null,
        h('circle', {cx: r(numX), cy: r(y), r: r(numR), fill: th.card, stroke: th.fgSoft, 'stroke-width': 2}),
        showKey ? h('text', {x: r(numX), y: r(y + tileSize * 0.17), 'text-anchor': 'middle', 'font-size': r(tileSize * 0.5), 'font-weight': 700, 'font-family': FONTS.sans, fill: th.inkSoft}, String(c.clause + 1)) : null);
      const len = bx - ax;
      pairLinks.push({k, total: len});
      cardParts.push(num, ta.node, tb.node,
        h('path', {name: `pair-${k}`, d: `M${r(ax + 2)} ${r(y)}C${r(ax + len * 0.35)} ${r(y - tileSize * 0.45)} ${r(bx - len * 0.35)} ${r(y + tileSize * 0.45)} ${r(bx - 2)} ${r(y)}`, fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len * 1.2)} ${r(len * 1.2 + 10)}`, 'stroke-dashoffset': r(len * 1.2)}));
    });
    if (!pairs.length && showKey) cardParts.push(textBlock(ctx.fit(t.unchanged, {maxWidth: cw - 40, size: tileSize * 0.8, maxLines: 1, weight: 500}), {x: cx, y: cTop + cardHead + tileSize * 0.3, anchor: 'middle', fill: th.inkSoft}));
    const cardBox = {x: cx0, y: cTop, w: cw, h: ch};
    const cardNode = g({name: 'el-change'}, g({name: 'el-change-body'}, cardParts));

    // --- pen: above the revised text, placed so that its arrow lands on the
    // middle of that sheet's version tab (on tall boxes: below the sheet)
    const penIcon = penTool(ctx, {name: 'pen-icon', length: 130, body: th.accent}).node;
    const penR = Pl.pen.r;
    const penY = Pl.pen.y;
    let penX = Pl.pen.x;
    if (penX === undefined) {
      const F = rev.full;
      const fcx0 = F.x + F.w / 2, fcy0 = F.y + F.h / 2;
      const tabC = rev.tabBox.x + rev.tabBox.w / 2;
      // edge anchor on the top side (arrow pad 14): x = c.x + (pen.x − c.x)·(h/2 + 14)/(c.y − pen.y)
      penX = fcx0 + (tabC - fcx0) * (fcy0 - penY) / (F.h / 2 + 14);
      penX = clamp(penX, cx + cw / 2 + penR + 30, S.w - penR - 10);
    }
    const penB = iconBadge(ctx, {name: 'el-pen', x: penX, y: penY, radius: penR, icon: g({transform: T(-42, 36, -48)}, penIcon)});
    const roomRight = S.w - penX - penR - 24;
    const penSide = Pl.pen.side || (roomRight >= 190 ? 'right' : 'left');
    const [fcx, fcy0, fw, fh, fside] = Pl.folder;
    const flab = showKey ? chip(ctx, label('folder'), fside === 'right'
      ? {x: fw / 2 + 12, y: -22, anchor: 'start', maxWidth: 300, size: 26, maxLines: 2}
      : fside === 'left'
      ? {x: -fw / 2 - 12, y: -22, anchor: 'end', maxWidth: Math.min(300, fcx - fw / 2 - 24), size: 26, maxLines: 3}
      : {x: 0, y: fh / 2 + 10, anchor: 'middle', maxWidth: 330, size: 26, maxLines: 2}) : null;
    const below = fside === 'below' ? (flab ? flab.box.h + 12 : 0) : 0;
    // keep the folder clear of the ladder, however many clause rows there are
    const fcy = Math.min(Math.max(fcy0, ladderFoot + 28 + fh / 2), S.h - fh / 2 - below - 8);
    let penLabel = !showKey ? null : penSide === 'right'
      ? chip(ctx, label('pen'), {x: penX + penR + 14, y: penY - 22, anchor: 'start', maxWidth: roomRight, size: 26, maxLines: 3, name: 'lab-pen'})
      : chip(ctx, label('pen'), {x: penX - penR - 14, y: penY - 22, anchor: 'end',
        maxWidth: Math.min(300, penX - penR - 26 - (penY < cTop + ch + 40 ? cx + cw / 2 : 0)), size: 26, maxLines: 3, name: 'lab-pen'});
    // a pen label beside a pen below the sheets keeps clear of the folder's label above it
    if (penLabel && flab && penY > fcy) {
      const fb = fcy + flab.box.y + flab.box.h;
      const lb = penLabel.box;
      if (lb.x < fcx + flab.box.x + flab.box.w + 8 && lb.x + lb.w > fcx + flab.box.x - 8 && lb.y < fb + 10) {
        penLabel = chip(ctx, label('pen'), {x: penX - penR - 14, y: Math.min(fb + 10, S.h - 70 - lb.h), anchor: 'end', maxWidth: lb.w + 2, size: 26, maxLines: 3, name: 'lab-pen'});
      }
    }
    const fcol = '#d8b878';
    const folderNode = g({name: 'el-folder', transform: T(fcx, fcy)}, g({name: 'el-folder-body'},
      h('path', {d: `M${-fw / 2} ${-fh / 2 + 10}Q${-fw / 2} ${-fh / 2} ${-fw / 2 + 10} ${-fh / 2}H${r(-fw / 2 + fw * 0.38)}L${r(-fw / 2 + fw * 0.38 + 18)} ${-fh / 2 + 18}H${fw / 2 - 10}Q${fw / 2} ${-fh / 2 + 18} ${fw / 2} ${-fh / 2 + 28}V${fh / 2 - 10}Q${fw / 2} ${fh / 2} ${fw / 2 - 10} ${fh / 2}H${-fw / 2 + 10}Q${-fw / 2} ${fh / 2} ${-fw / 2} ${fh / 2 - 10}Z`, fill: fcol, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      // the two versions filed inside (A sheet back, B sheet front), revealed when the folder keeps them
      h('rect', {name: 'folder-a', x: r(-fw * 0.34), y: r(-fh * 0.42), width: r(fw * 0.42), height: r(fh * 0.7), rx: 3, fill: th.paper, stroke: versionStyle(ctx, 'A').tab, 'stroke-width': 3, transform: 'rotate(-4)', opacity: 0}),
      h('rect', {name: 'folder-b', x: r(-fw * 0.06), y: r(-fh * 0.4), width: r(fw * 0.42), height: r(fh * 0.7), rx: 3, fill: th.paper, stroke: versionStyle(ctx, 'B').tab, 'stroke-width': 3, transform: 'rotate(3)', opacity: 0}),
      h('path', {d: roundRectPath(-fw / 2, -fh / 2 + 46, fw, fh - 46, 10), fill: shade(fcol, -0.06), stroke: th.ink, 'stroke-width': th.stroke})),
      flab && flab.node);
    const folderBox = {x: fcx - fw / 2, y: fcy - fh / 2, w: fw, h: fh};

    // --- relation graph (anchored to real edges; plain relations carry no arrow).
    // A sheet is anchored with its tab, so a connector reaching the top of a
    // sheet lands on the tab instead of ending hidden under it; should one
    // land beside the tab, that sheet falls back to its plain edges.
    const flabBox = flab && {x: fcx + flab.box.x, y: fcy + flab.box.y, w: flab.box.w, h: flab.box.h};
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1], maxX: S.w}, shape === 'portrait' ? 24 : 26) : null;
    // the graph draws connectors only; this scene places the relation labels itself
    const gctx = {...ctx, show: (level = 'all') => (level === 'all' ? false : ctx.show(level))};
    const sheetEls = {original: orig, revised: rev};
    const buildGraph = plain => {
      const elements = {
        original: {box: plain.original ? orig.box : orig.full},
        revised: {box: plain.revised ? rev.box : rev.full},
        alignment: {box: ladderBox},
        change: {box: cardBox},
        pen: {circle: penB.circle},
        folder: {box: folderBox},
      };
      return {elements, graph: relationGraph(gctx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, bend: () => 0.08})};
    };
    let {elements, graph} = buildGraph({});
    const besideTab = id => graph.conns.some(x => [[x.rel.from, x.c.from], [x.rel.to, x.c.to]].some(([eid, q]) => {
      const e = sheetEls[eid];
      if (eid !== id || !e) return false;
      return q.y < e.box.y - 1 && (q.x < e.tabBox.x + 6 || q.x > e.tabBox.x + e.tabBox.w - 6);
    }));
    const plain = {original: besideTab('original'), revised: besideTab('revised')};
    if (plain.original || plain.revised) ({elements, graph} = buildGraph(plain));
    const obstacles = [orig.full, rev.full, ladderBox, cardBox, penB.box, folderBox, ladderLabel && ladderLabel.box, penLabel && penLabel.box, flabBox, legend && legend.box].filter(Boolean);
    const relLabels = ctx.show('all') ? placeRelationLabels(ctx, graph, {relationLabels: p.relationLabels, size: shape === 'portrait' ? 23 : 26, max: shape === 'portrait' ? 230 : shape === 'square' ? 240 : 270, obstacles, bounds: {x: 0, y: 0, w: S.w, h: S.h}}) : [];
    const route = graph.route(p.traversalOrder);
    const visits = route.visits;
    const firstVisit = id => { const v = visits.find(q => q.id === id); return v ? v.t : null; };

    const tagLinked = showKey && pairs.length ? statusTag(ctx, t.linked, {x: cx0 + cw - 14, y: cTop + (cardHead - 38.5) / 2 - 2, anchor: 'end', size: 22, name: 'tag-linked', color: th.accent, opacity: 0}) : null;

    // endpoint audit for semantics: every connector starts/ends on its element's edge
    const anchors = graph.conns.map(x => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, start: {x: r(x.c.from.x), y: r(x.c.from.y)}, end: {x: r(x.c.to.x), y: r(x.c.to.y)},
      onFrom: onEdge(elements[x.rel.from], x.c.from), onTo: onEdge(elements[x.rel.to], x.c.to)}));

    // visit halos: a ring around each element while the tracer passes it
    const haloPad = 12;
    const halo = (id, b) => h('path', {name: `halo-${id}`, d: roundRectPath(b.x - haloPad, b.y - haloPad, b.w + haloPad * 2, b.h + haloPad * 2, 20), fill: 'none', stroke: th.accent2, 'stroke-width': 6, opacity: 0});
    const halos = g(null,
      halo('original', orig.box), halo('revised', rev.box), halo('alignment', ladderBox), halo('change', cardBox), halo('folder', folderBox),
      h('circle', {name: 'halo-pen', cx: r(penX), cy: r(penY), r: penR + haloPad, fill: 'none', stroke: th.accent2, 'stroke-width': 6, opacity: 0}));

    return {S, s, ox, oy, L, orig, rev, oc, rc, stackC, sw, sh, ladderNode, ladderLabel, cardNode, penLabel, pairLinks, penB, folderNode, graph, route, visits, firstVisit, legend, tagLinked, anchors, changedRow, pairs, diff, relLabels, halos,
      centers: {original: oc, revised: rc, alignment: {x: stackC.x, y: (ly0 + ly1) / 2}, change: {x: cx, y: cy}, pen: {x: penX, y: penY}, folder: {x: fcx, y: fcy}}};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.halos,
      L.graph.node,
      L.ladderNode, L.ladderLabel && L.ladderLabel.node,
      L.folderNode, L.penB.node, L.penLabel && L.penLabel.node, L.cardNode,
      L.orig.node, L.rev.node,
      L.relLabels.map(x => x.node),
      L.tagLinked && L.tagLinked.node,
      L.graph.tracerNode('tracer'),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: stacked versions slide apart; other components come in
    const split = ease.inOutCubic(seg(u, 0.03, 0.16));
    const po = {x: lerp(L.stackC.x - 18, L.oc.x, split), y: lerp(L.stackC.y - 12, L.oc.y, split)};
    const pr = {x: lerp(L.stackC.x + 18, L.rc.x, split), y: lerp(L.stackC.y + 12, L.rc.y, split)};
    const appear = r(seg(u, 0.08, 0.17), 3);
    for (const id of ['alignment', 'change', 'pen', 'folder']) nodes[`el-${id}`] = {opacity: appear};
    if (L.ladderLabel) nodes['lab-alignment'] = {opacity: appear};
    if (L.penLabel) nodes['lab-pen'] = {opacity: appear};
    // 2) relations drawn one by one
    const n = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / n, 0.18 + ((i + 1) * 0.25) / n));
    Object.assign(nodes, L.graph.frame(relP));
    // 3) tracer
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.77;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      if (!tracerOn) return 0;
      let best = 0;
      for (const v of L.visits) if (v.id === id) best = Math.max(best, clamp(1 - Math.abs(tt - v.t) / 0.08));
      return best;
    };
    for (const id of ['original', 'revised', 'alignment', 'change', 'pen', 'folder']) {
      const pv = ease.inOutSine(pulse(id));
      // every element the tracer passes gets a halo; only the focus element
      // enlarges (a sheet barely, so its tab stays clear of the labels above it)
      const sheet = id === 'original' || id === 'revised';
      const amp = id === p.focusElement ? (sheet ? 0.02 : 0.1) : 0;
      const k = 1 + (reduced ? amp * 0.5 : amp) * pv;
      const c = L.centers[id];
      // sheets, pen and folder pivot on their own origin (centre); ladder and register are drawn in scene coordinates
      nodes[`el-${id}-body`] = {transform: sheet || id === 'pen' || id === 'folder' ? scaleAbout(0, 0, k) : scaleAbout(c.x, c.y, k)};
      nodes[`halo-${id}`] = {opacity: r(pv, 3)};
    }
    L.relLabels.forEach((x, i) => { nodes[`rl-${i}`] = {opacity: r(clamp((relP(i) - 0.55) / 0.45), 3)}; });
    nodes['el-original'] = {transform: T(po.x, po.y)};
    nodes['el-revised'] = {transform: T(pr.x, pr.y)};
    // the part that changes: rows that differ turn to ink and the modified words light up
    // when the tracer passes the ladder; word pairs are linked when it reaches the register
    const reachT = id => {
      const v = L.firstVisit(id);
      if (v === null) return u >= 0.75 ? 1 : 0; // not on the route: revealed in the gather beat
      return u >= 0.74 ? 1 : tracerOn && tt >= v ? 1 : 0;
    };
    const lit = reachT('alignment');
    const linkedAt = L.firstVisit('change');
    const pairP = linkedAt === null ? seg(u, 0.75, 0.82) : (u >= 0.74 ? 1 : tracerOn ? clamp((tt - linkedAt) / 0.07) : 0);
    L.changedRow.forEach((ch, ci) => {
      nodes[`rung-${ci}-ink`] = {opacity: ch ? lit : 0};
      nodes[`rung-${ci}-mark`] = {opacity: lit};
    });
    for (const i of L.orig.hl) nodes[`sh-original-hl-${i}`] = {opacity: lit};
    for (const i of L.rev.hl) nodes[`sh-revised-hl-${i}`] = {opacity: lit};
    L.pairLinks.forEach(pl => { nodes[`pair-${pl.k}`] = {'stroke-dashoffset': r(pl.total * 1.2 * (1 - ease.inOutSine(clamp(pairP * 1.15 - pl.k * 0.05))))}; });
    // folder keeps both versions once its relations are drawn
    const keeps = L.graph.conns.map((x, i) => ({x, p: relP(i)})).filter(q => q.x.rel.from === 'folder' || q.x.rel.to === 'folder');
    const keepOf = id => keeps.some(q => (q.x.rel.from === id || q.x.rel.to === id) && q.p >= 1) ? 1 : 0;
    nodes['folder-a'] = {opacity: keepOf('original')};
    nodes['folder-b'] = {opacity: keepOf('revised')};
    const tagP = seg(u, 0.8, 0.88);
    if (L.tagLinked) nodes['tag-linked'] = {opacity: r(tagP * (pairP >= 1 ? 1 : 0), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        originalSheet: {x: r(po.x), y: r(po.y)},
        revisedSheet: {x: r(pr.x), y: r(pr.y)},
        separated: split >= 1,
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        visitOrder: L.visits.map(v => v.id),
        anchors: L.anchors,
        arrowKinds: L.anchors.map(a => a.kind),
        rowsLit: Boolean(lit),
        changedRows: L.changedRow.map((c, i) => (c ? i : -1)).filter(i => i >= 0),
        pairsLinked: r(pairP, 3),
        pairs: L.pairs.length,
        unmatchedEdits: L.diff.unmatched,
      },
    };
  },
};

/** Does point q lie on the (padded) edge of an element box/circle? */
function onEdge(e, q) {
  if (e.circle) {
    const d = Math.hypot(q.x - e.circle.x, q.y - e.circle.y);
    return d >= e.circle.r - 1 && d <= e.circle.r + 16;
  }
  const b = e.box;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  const outside = Math.hypot(dx, dy);
  const inside = q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
  return !inside && outside <= 16;
}

function legendNode(ctx, kinds, labels, at, size) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = 50;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = Math.max(16, Math.min(at.x - total / 2, at.maxX - 16 - total));
  const box = {x, y: at.y - size * 0.75, w: total, h: size * 1.35};
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': FONTS.sans, fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend'}, parts), box};
}

/**
 * Relation labels, placed by this scene (the graph draws the connectors).
 * Each label tries the middle of its own connector, then points along it
 * pushed sideways, then narrower (three- or four-line) or slightly smaller chips,
 * until it is clear of every element, label, other connector and of its own
 * connector's ends (arrowhead / end dots). A label pushed off its connector
 * keeps a dotted leader to it.
 * @param {any} ctx
 * @param {any} graph relationGraph result
 * @param {{relationLabels:Record<string,string>, size:number, max:number, obstacles:any[], bounds:{x:number,y:number,w:number,h:number}}} o
 */
function placeRelationLabels(ctx, graph, o) {
  const th = ctx.theme;
  const placed = [];
  const samples = graph.conns.map(x => Array.from({length: 41}, (_, k) => x.c.at(k / 40)));
  const hit = (b, q, pad) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
  const over = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  const B = o.bounds;
  const tiers = [
    {size: o.size, maxWidth: o.max, maxLines: 2},
    {size: o.size, maxWidth: o.max * 0.66, maxLines: 3},
    {size: o.size * 0.86, maxWidth: o.max * 0.8, maxLines: 3},
    // for narrow gaps (e.g. between a tall-box sheet and the ladder): a slim column of words
    {size: o.size * 0.86, maxWidth: o.max * 0.5, maxLines: 4},
  ];
  const bands = [[0, 22, 44, 66, 88], [112, 140, 170, 200, 240, 280, 330, 380]];
  const ts = [0.5, 0.4, 0.6, 0.3, 0.7];
  return graph.conns.map((x, i) => {
    const text = x.rel.label || o.relationLabels[x.rel.kind] || x.rel.kind;
    const color = kindColor(ctx, x.rel.kind);
    const c = x.c;
    const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const perp = {x: -dy / len, y: dx / len};
    const arrow = x.rel.kind !== 'relation';
    const dims = tiers.map(tr => {
      const probe = chip(ctx, text, {...tr, x: 0, y: 0, anchor: 'middle', weight: 600});
      return {tr, w: probe.box.w, h: probe.box.h};
    });
    const clear = b => {
      if (b.x < B.x || b.y < B.y || b.x + b.w > B.x + B.w || b.y + b.h > B.y + B.h) return false;
      if (o.obstacles.some(q => over(b, q, 4)) || placed.some(q => over(b, q, 8))) return false;
      if (hit(b, c.to, arrow ? 24 : 7) || hit(b, c.from, 7)) return false;
      // an arrow keeps a readable shaft: its label may cover only the middle 40 %
      if (arrow && samples[i].some((q, k) => (k < 12 || k > 28) && hit(b, q, 4))) return false;
      return samples.every((pts, j) => j === i || !pts.some(q => hit(b, q, 5)));
    };
    let found = null;
    search: for (const band of bands) {
      for (const dm of dims) {
        for (const d of band) {
          for (const tt of ts) {
            for (const sg of d ? [1, -1] : [1]) {
              const a = c.at(tt);
              const b = {x: a.x + perp.x * d * sg - dm.w / 2, y: a.y + perp.y * d * sg - dm.h / 2, w: dm.w, h: dm.h};
              if (clear(b)) { found = {b, dm, a}; break search; }
            }
          }
        }
      }
    }
    if (!found) {
      const dm = dims[dims.length - 1];
      const a = c.at(0.5);
      found = {b: {x: a.x - dm.w / 2, y: a.y - dm.h / 2, w: dm.w, h: dm.h}, dm, a};
    }
    placed.push(found.b);
    const {b, dm, a} = found;
    const ch = chip(ctx, text, {...dm.tr, x: b.x + b.w / 2, y: b.y, anchor: 'middle', fill: th.card, stroke: color, weight: 600});
    // dotted leader from the connector to the nearest point of a label pushed off it
    const q = {x: clamp(a.x, b.x, b.x + b.w), y: clamp(a.y, b.y, b.y + b.h)};
    const lead = Math.hypot(q.x - a.x, q.y - a.y) > 10
      ? h('line', {x1: r(a.x), y1: r(a.y), x2: r(q.x), y2: r(q.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'})
      : null;
    return {node: g({name: `rl-${i}`, opacity: 0}, lead, ch.node), box: b};
  });
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-04-mechanism',
    title: 'Compared drafting — rows, words and links explained',
    titleEs: 'Redacción comparada — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Redacción comparada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded comparator: the original and revised texts slide apart from one stack, a numbered row ladder shows which clause rows correspond, a register lists the modified word pairs, and the drafter’s pen and the file are related by edge-anchored connectors styled by kind. A tracer follows the supplied order; rows that differ turn to ink, the modified words light up on both sheets and each pair is linked.',
    tags: ['comparison', 'versions', 'alignment', 'rows', 'mechanism', 'relations', 'tracer', 'document'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/redaccion-comparada.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: COMPARE_STRINGS,
  scene,
});
