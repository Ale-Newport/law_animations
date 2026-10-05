/**
 * LAW-0064 — Fuente primaria y comentario · inspect
 *
 * Storyboard (the state produced by the story: a commentator's card pinned in
 * the margin column, tied by a thread to a bracketed passage of the source):
 *  0.00–0.20  build: the reading board with the source page; the card slides
 *             into the margin column, is pinned, and its thread is tied to the
 *             bracketed passage. A small library bookcase keeps the context.
 *  0.20–0.45  isolate: a lens lifts a REAL copy of the link (same coordinates
 *             as the context: bracket, thread, the card's pinpoint tab, or its
 *             attribution band / date line) into an enlarged window and dims
 *             the board; the old datum is named.
 *  0.45–0.75  substitute: inside the lens one datum changes (default: the
 *             pinpoint ¶2 → ¶3). Only its dependents follow: the thread's pin is
 *             pulled and re-pinned at the other passage, the bracket moves, the
 *             old bracket stays as a dashed trace; the old value is struck but
 *             kept visible in the annotation.
 *  0.75–1.00  return: the lens folds back; the context now shows the new datum
 *             and a "datum changed" marker. Seeking back restores the old datum.
 * The source text itself never changes; no reading is endorsed.
 * @module animations/research/LAW-0064
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {
  fpcContentFields, FPC_DEFAULTS, FPC_STRINGS, fpcColors, linkedPassage, pinLabel,
  sourcePage, noteCard, corkBoard, bookcase, pushPin, threadD, placeFirst, ringCands, segmentHitsBox,
} from './kits/fuente-primaria-y-comentario.js';

const ID = 'LAW-0064';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  caption: [0.02, 0.1], slide: [0.03, 0.12], pin: [0.12, 0.15], thread: [0.14, 0.2],
  open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53], change: [0.5, 0.68], after: [0.62, 0.7],
  close: [0.76, 0.87], fadeLens: [0.76, 0.785], paper: [0.785, 0.8], collapse: [0.8, 0.87], ctxUpdate: [0.8, 0.87], marker: [0.87, 0.94],
};
const TARGETS = ['pinpoint', 'commentator', 'date'];
const SAG = 12;

const STRINGS = {
  en: {pinpoint: 'Pinpoint', commentator: 'Attributed to', date: 'Date of the note', marker: 'Datum changed'},
  es: {pinpoint: 'Referencia', commentator: 'Atribuida a', date: 'Fecha de la nota', marker: 'Dato cambiado'},
};

const sceneSchema = {
  ...fpcContentFields,
  focusTarget: oneOf('Datum of the side note that is enlarged and substituted: the pinpoint it links to, the commentator it is attributed to, or its date', TARGETS),
  beforeValue: str('Value shown before the substitution (for the pinpoint: the tab label, e.g. ¶2)', 60),
  afterValue: str('Value shown after the substitution (the alternative datum)', 60),
  detailGeometry: obj('Lens geometry and dependent geometry', {
    zoom: num('Magnification of the lens', 1.5, 4),
    placement: oneOf('Kept for compatibility: the lens always opens over the free library side of the layout so it never covers text of the context', ['auto', 'left', 'right', 'top', 'bottom']),
    afterPassage: int('Pinpoint only: the passage number (1-based) the after value links to; the thread and bracket move there', 1, 4),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...FPC_DEFAULTS,
  focusTarget: 'pinpoint',
  beforeValue: '¶2',
  afterValue: '¶3',
  detailGeometry: {zoom: 2.2, placement: 'auto', afterPassage: 3},
  contextLabels: {context: 'Side note pinned beside art. 7, tied to its passage', marker: 'Datum changed'},
};

/** Context stage per layout shape (stage units). */
const STAGES = {
  // the library side (bookcase, no text) is the free zone where the lens opens, so the enlarged
  // copy never covers text of the context; it is wide (tall in 9:16) enough for a squarer lens that
  // also shows the passage lines next to the brackets. The page is only as tall as its passages
  // need, so neighbouring passages (and the lens around them) stay compact
  landscape: {
    stage: {w: 1600, h: 900}, caption: {x: 20, y: 8, w: 1560},
    shelf: {x: 24, y: 84, w: 596, h: 796, rows: 4},
    zone: {x: 10, y: 70, w: 628, h: 824},
    board: {x: 656, y: 110, w: 934, h: 720},
    page: {x: 688, y: 146, w: 444, h: 620, text: 22, title: 26},
    gutter: 1192, note: {x: 1258, w: 304, h: 330, text: 23},
    chip: 28,
  },
  square: {
    stage: {w: 1240, h: 1060}, caption: {x: 20, y: 8, w: 1200},
    shelf: {x: 20, y: 70, w: 480, h: 976, rows: 5},
    zone: {x: 8, y: 60, w: 510, h: 994},
    board: {x: 528, y: 150, w: 702, h: 800},
    page: {x: 556, y: 186, w: 356, h: 700, text: 21, title: 25},
    gutter: 946, note: {x: 1004, w: 208, h: 330, text: 21},
    chip: 28,
  },
  portrait: {
    stage: {w: 920, h: 1460}, caption: {x: 20, y: 8, w: 880},
    shelf: {x: 26, y: 70, w: 868, h: 640, rows: 3},
    zone: {x: 12, y: 60, w: 896, h: 662},
    board: {x: 20, y: 740, w: 880, h: 690},
    page: {x: 50, y: 776, w: 470, h: 600, text: 22, title: 26},
    gutter: 560, note: {x: 630, w: 252, h: 330, text: 22},
    chip: 28,
  },
};

/** The reading board with its page, card and thread, drawn once per copy (context / lens). */
function boardCopy(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const p = ctx.params;
  const {prefix: P, G, showAll} = o;
  const pg = G.page;
  const page = sourcePage(ctx, {prefix: `${P}-src`, w: pg.w, h: pg.h, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: pg.text, titleSize: pg.title, seedKey: 'fpc-i-src'});
  const board = corkBoard(ctx, {prefix: `${P}-board`, ...G.board, gutterX: G.gutter, seedKey: 'fpc-i-cork'});
  const pinOf = i => ({x: pg.x + page.passages[i].pin.x, y: pg.y + page.passages[i].pin.y});
  const note = noteCard(ctx, {
    prefix: `${P}-card`, w: G.note.w, h: G.note.h, header: o.header0, text: p.sources.commentaryText,
    footer: o.footer0, pinpoint: o.tab0, showText: showAll, textSize: G.note.text, tabY: o.tabY,
    alt: {pinpoint: o.tab1, header: o.header1, footer: o.footer1},
  });
  // dashed trace of the old bracket (keeps the previous link traceable)
  const pb = page.passages[o.li0];
  const ghost = h('path', {name: `${P}-ghost`, d: `M${r(pg.x + pb.box.x + pb.box.w + 6)} ${r(pg.y + pb.box.y)}H${r(pg.x + pb.pin.x)}V${r(pg.y + pb.box.y + pb.box.h)}H${r(pg.x + pb.box.x + pb.box.w + 6)}`, fill: 'none', stroke: C.link, 'stroke-width': 3, 'stroke-dasharray': '6 6', opacity: 0});
  // numbered flags at the top end of the brackets (which passage the thread is tied to)
  const flag = (i, name) => {
    const b = page.passages[i];
    const x = pg.x + pg.w + 6, y = pg.y + b.box.y - 2;
    if (!showAll) return g({name, opacity: 0}, h('rect', {x, y, width: 26, height: 20, rx: 5, fill: C.link}));
    const f = ctx.fit(pinLabel(i), {maxWidth: 70, size: 20, minSize: 14, maxLines: 1, weight: 800, family: 'serif'});
    return g({name, opacity: 0},
      h('path', {d: roundRectPath(x, y, f.width + 14, f.size + 8, 6), fill: C.link}),
      textBlock(f, {x: x + 7, y: y + 4, fill: '#fff'}));
  };
  const flags = o.li1 !== o.li0 ? [flag(o.li0, `${P}-flag0`), flag(o.li1, `${P}-flag1`)] : [flag(o.li0, `${P}-flag0`)];
  const node = g(null,
    board.node,
    g({transform: T(pg.x, pg.y)}, page.node),
    ghost,
    flags,
    h('path', {name: `${P}-thread`, d: threadD(pinOf(o.li0), pinOf(o.li0), 0), fill: 'none', stroke: C.link, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}),
    g({name: `${P}-srcpinT`, transform: T(pinOf(o.li0).x, pinOf(o.li0).y)}, pushPin(ctx, {name: `${P}-srcpin`, opacity: 0, radius: 11})),
    g({name: `${P}-cardT`}, note.node),
  );
  return {node, page, note, pinOf, board};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1240, 1060], portrait: [920, 1460]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = fpcColors(ctx);
    const shape = ctx.view.shape;
    const G = STAGES[shape];
    const D = ctx.design;
    const s = Math.min(D.w / G.stage.w, D.h / G.stage.h);
    const ox = (D.w - G.stage.w * s) / 2;
    const oy = (D.h - G.stage.h * s) / 2;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const target = p.focusTarget;
    const n = p.sources.passages.length;
    const li0 = linkedPassage(p, n);
    const li1 = target === 'pinpoint' ? clamp((p.detailGeometry.afterPassage || li0 + 1) - 1, 0, n - 1) : li0;
    const tab0 = target === 'pinpoint' ? p.beforeValue : pinLabel(li0);
    const tab1 = target === 'pinpoint' ? p.afterValue : pinLabel(li0);
    const header0 = target === 'commentator' ? p.beforeValue : p.sources.commentator;
    const header1 = target === 'commentator' ? p.afterValue : p.sources.commentator;
    const foot = d => `${p.citations.commentary} · ${d}`;
    const footer0 = foot(target === 'date' ? p.beforeValue : p.dates.commentary);
    const footer1 = foot(target === 'date' ? p.afterValue : p.dates.commentary);

    // card position: tab level with the (before) passage; the card never moves afterwards
    const pgProbe = sourcePage(ctx, {prefix: 'probe', w: G.page.w, h: G.page.h, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: G.page.text, titleSize: G.page.title});
    const pasY0 = G.page.y + pgProbe.passages[li0].pin.y;
    const noteY = clamp(pasY0 - G.note.h * 0.36, G.board.y + 50, G.board.y + G.board.h - G.note.h - 90);
    const cardProbe = noteCard(ctx, {prefix: 'probe-c', w: G.note.w, h: G.note.h, header: '', text: '', pinpoint: tab0, showText: showAll});
    const tabY = clamp(pasY0 - noteY, cardProbe.bandH + cardProbe.tab.h / 2 + 4, G.note.h - cardProbe.tab.h / 2 - 8);
    const common = {G, showAll, li0, li1, tab0, tab1, header0, header1, footer0, footer1, tabY};
    const ctxCopy = boardCopy(ctx, {...common, prefix: 'ctx'});
    const lensCopy = boardCopy(ctx, {...common, prefix: 'lns'});
    const note = ctxCopy.note;
    const noteAt = {x: G.note.x, y: noteY};
    const port = {x: noteAt.x + note.port.x, y: noteAt.y + note.port.y};
    const pin0 = ctxCopy.pinOf(li0), pin1 = ctxCopy.pinOf(li1);

    const kinds = ['source', 'commentary', 'mixed', 'source', 'commentary'];
    const shelf = bookcase(ctx, {prefix: 'lib', x: G.shelf.x, y: G.shelf.y, w: G.shelf.w, h: G.shelf.h,
      rows: Array.from({length: G.shelf.rows}, (_, i) => ({kind: kinds[i % kinds.length], feature: i === 1 ? 3 : undefined, tab: i === 1})), seedKey: 'fpc-i-lib'});

    const Z = G.zone;
    const SW = G.stage.w, SH = G.stage.h;
    const zoom = p.detailGeometry.zoom;

    // --- editorial annotation: before → after (old value struck, still visible). Side by side when
    // both fit on one line within the free zone, otherwise stacked (before over after), so neither
    // value wraps; measured first so the lens leaves room for it
    const label = t[target];
    const beforeText = `${label}: ${p.beforeValue}`, afterText = `${label}: ${p.afterValue}`;
    const annChip = (name, text, x, y, anchor, mw, fill, stroke, color, lines = 1, minK = 0.86) => chip(ctx, text, {x, y, anchor, maxWidth: mw, size: G.chip, minSize: G.chip * minK, maxLines: lines, fill, stroke, color, name, weight: 700});
    const ARW = 30;
    const zc = Z.x + Z.w / 2;
    const oneB = annChip('p', beforeText, 0, 0, 'start', Z.w, th.card, th.ink, th.ink);
    const oneA = annChip('p', afterText, 0, 0, 'start', Z.w, th.card, th.ink, th.ink);
    const sideBySide = !oneB.fit.truncated && !oneA.fit.truncated && oneB.box.w <= Z.w / 2 - ARW - 8 && oneA.box.w <= Z.w / 2 - ARW - 8;
    // stacked: one line each (a little smaller if needed) before two lines
    const stackLines = [beforeText, afterText].some(tx => annChip('p', tx, 0, 0, 'start', Z.w - 16, th.card, th.ink, th.ink, 1, 0.72).fit.truncated) ? 2 : 1;
    const stackK = stackLines === 1 ? 0.72 : 0.86;
    const probeH = Math.max(annChip('p', beforeText, 0, 0, 'start', Z.w - 16, th.card, th.ink, th.ink, stackLines, stackK).box.h, annChip('p', afterText, 0, 0, 'start', Z.w - 16, th.card, th.ink, th.ink, stackLines, stackK).box.h);
    const annGap = 22;
    const annH = !showKey ? 40 : sideBySide ? probeH + annGap + 12 : probeH * 2 + 40 + annGap + 12;

    // --- lens source region: the datum and its dependents, in context coordinates
    let source;
    const pad = 22;
    if (target === 'pinpoint') {
      const pb0 = ctxCopy.page.passages[li0], pb1 = ctxCopy.page.passages[li1];
      // both brackets with their flags, and the card's tab
      const y0 = Math.min(G.page.y + pb0.box.y, G.page.y + pb1.box.y, noteAt.y + note.tab.y) - pad - 6;
      const y1 = Math.max(G.page.y + pb0.box.y + pb0.box.h, G.page.y + pb1.box.y + pb1.box.h, noteAt.y + note.tab.y + note.tab.h) + pad;
      // to the card's edge (tab included); leftwards as far as the zoom allows: the passage lines
      // next to the brackets (their ¶ numbers too when the whole column fits), at least the margin
      const x1 = noteAt.x + 8;
      const zWant = Math.max(1.2, Math.min(zoom, (Z.h - annH) / (y1 - y0)));
      const x0 = clamp(x1 - Z.w / zWant, G.page.x + 6, G.page.x + G.page.w - ctxCopy.page.padR - 4);
      source = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    } else if (target === 'commentator') {
      // the attribution band only (and the rule under it): the header, not the empty card body or the pin
      source = {x: noteAt.x - 12, y: noteAt.y - 14, w: G.note.w - 50 + 12, h: note.bandH + 30};
    } else {
      const fb = note.footBox;
      source = {x: noteAt.x - 12, y: noteAt.y + fb.y - 16, w: G.note.w + 24, h: fb.h + 30};
    }
    // --- lens destination: largest free placement in the library zone (context stays visible, dimmed)
    const M = 16;
    const ratio = source.h / source.w;
    const fitIn = (bx, by, bw, bh) => {
      const w = Math.min(bw, source.w * zoom, bh / ratio);
      return {x: bx + (bw - w) / 2, y: by + (bh - w * ratio) / 2, w, h: w * ratio};
    };
    let dest = fitIn(Z.x, Z.y, Z.w, Z.h - annH);
    if (dest.w < 60) dest = fitIn(M, 70, source.x - 60 - M, SH - 70 - annH - M);
    // where the lens crops the page's text column, the cut line ends fade into the page (a vignette
    // inside the lens only), so the crop reads as "the passage continues to the left"
    const textRight = G.page.x + G.page.w - ctxCopy.page.padR;
    const fadeW = target === 'pinpoint' && source.x > G.page.x + ctxCopy.page.padL && source.x < textRight ? Math.min(80, source.w * 0.24, textRight - source.x) : 0;
    const fadeId = 'lns-fade';
    const lensFade = fadeW > 0 ? g(null,
      h('defs', null, h('linearGradient', {id: ctx.id(fadeId), x1: 0, x2: 1, y1: 0, y2: 0},
        h('stop', {offset: 0, 'stop-color': th.paper, 'stop-opacity': 1}),
        h('stop', {offset: 1, 'stop-color': th.paper, 'stop-opacity': 0}))),
      h('rect', {x: r(source.x), y: r(Math.max(source.y, G.page.y + 2)), width: r(fadeW), height: r(Math.min(source.y + source.h, G.page.y + G.page.h - 2) - Math.max(source.y, G.page.y + 2)), fill: ctx.ref(fadeId)})) : null;
    const lensContent = g({name: 'lns-root'}, lensCopy.node, lensFade);
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: {x: 0, y: 0, w: SW, h: SH}, color: C.link});

    const annY = dest.y + dest.h + annGap;
    const cx = clamp(dest.x + dest.w / 2, Z.x + 8, Z.x + Z.w - 8);
    let beforeChip = null, afterChip = null, arrowD = null, arrowY = annY;
    if (showKey) {
      if (sideBySide) {
        beforeChip = annChip('ann-before', beforeText, cx - ARW, annY, 'end', Z.w / 2, th.card, th.ink, th.ink);
        afterChip = annChip('ann-after', afterText, cx + ARW, annY, 'start', Z.w / 2, th.accent2Soft, th.accent2, th.ink);
        arrowY = annY + beforeChip.box.h / 2;
        arrowD = `M${r(cx - 14)} ${r(arrowY)}h24m-10 -9l10 9l-10 9`;
      } else {
        beforeChip = annChip('ann-before', beforeText, cx, annY, 'middle', Z.w - 16, th.card, th.ink, th.ink, stackLines, stackK);
        const ay = annY + beforeChip.box.h + 40;
        afterChip = annChip('ann-after', afterText, cx, ay, 'middle', Z.w - 16, th.accent2Soft, th.accent2, th.ink, stackLines, stackK);
        arrowY = annY + beforeChip.box.h + 20;
        arrowD = `M${r(cx)} ${r(arrowY - 14)}v24m-9 -10l9 10l9 -10`;
      }
    }
    let strikes = [];
    if (beforeChip) {
      const f = beforeChip.fit;
      const padY = (beforeChip.box.h - f.height) / 2;
      strikes = f.lines.map((line, i) => {
        const lw = ctx.measure(line, f.size, f.weight, f.family);
        const y = beforeChip.box.y + padY + f.size * 0.8 - f.size * 0.3 + i * f.lineHeight;
        return {len: lw + 8, node: h('line', {name: `ann-strike-${i}`, x1: r(beforeChip.box.cx - lw / 2 - 4), x2: r(beforeChip.box.cx + lw / 2 + 4), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 18)}`, 'stroke-dashoffset': r(lw + 8)})};
      });
    }
    const ctxCap = showAll && p.contextLabels.context
      ? chip(ctx, `${t.context}: ${p.contextLabels.context}`, {x: G.caption.x, y: G.caption.y, maxWidth: G.caption.w, size: G.chip - 2, minSize: (G.chip - 2) * 0.8, maxLines: 1, fill: th.card, stroke: th.inkSoft, weight: 600, name: 'ctx-caption'})
      : null;

    // --- changed-datum marker beside the datum in the context, never on it: above the card's tab
    // (below it when the thread now rises), or on the cork just outside the card's band / footer;
    // its chip sits on free cork with a leader that stays outside the card
    const tabBox = {x: noteAt.x + note.tab.x, y: noteAt.y + note.tab.y, w: note.tab.w, h: note.tab.h};
    const up = li1 < li0;
    const MR = 18;
    const flagR = G.page.x + G.page.w + 50;
    const mk = target === 'pinpoint' ? {x: clamp(tabBox.x + tabBox.w * 0.55, flagR + MR + 4, noteAt.x - MR - 2), y: up ? tabBox.y + tabBox.h + 36 : tabBox.y - 36}
      : target === 'commentator' ? {x: noteAt.x + 34, y: noteAt.y - 26}
        : {x: noteAt.x + 34, y: noteAt.y + G.note.h + 26};
    let markChip = null;
    if (showKey) {
      const text = p.contextLabels.marker || t.marker;
      const pgR = G.page.x + G.page.w;
      const textCol = {x: G.page.x, y: G.page.y, w: G.page.w - ctxCopy.page.padR + 8, h: G.page.h};
      const cardBox = {x: noteAt.x, y: noteAt.y, w: G.note.w, h: G.note.h};
      // the page's right margin with its brackets and ¶ flags, the tab, the marker itself
      const margin = {x: pgR - ctxCopy.page.padR, y: G.page.y, w: ctxCopy.page.padR + 52, h: G.page.h};
      const mkBox = {x: mk.x - MR, y: mk.y - MR, w: MR * 2, h: MR * 2};
      const obst = [cardBox, textCol, margin, tabBox, mkBox, {x: G.page.x, y: G.page.y, w: G.page.w, h: G.page.h}];
      const threadPts = Array.from({length: 21}, (_, k) => ({x: lerp(pin1.x, port.x, k / 20), y: lerp(pin1.y, port.y, k / 20)}));
      const board = {x: G.board.x + 20, y: G.board.y + 20, w: G.board.w - 40, h: G.board.h - 40};
      const mkc = c => {
        const res = chip(ctx, text, {x: c.x, y: c.y, anchor: c.a, maxWidth: c.mw ?? 300, size: G.chip - 4, minSize: (G.chip - 4) * 0.8, maxLines: 2, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700});
        return {...res, box: res.box};
      };
      const settleC = c => (c.v === 'above' ? {...c, y: c.y - mkc({...c, y: 0}).box.h} : c.v === 'mid' ? {...c, y: c.y - mkc({...c, y: 0}).box.h / 2} : c);
      const leadOf = b => ({a: {x: clamp(mk.x, b.x, b.x + b.w), y: clamp(mk.y, b.y, b.y + b.h)}, b: mk});
      const cands = ringCands(mkBox, {rings: 8, step: 22, gap: 10}).map(c => settleC({...c, mw: 300}))
        .filter(c => { const L = leadOf(mkc(c).box); return !segmentHitsBox(L.a, L.b, cardBox, 2) && !segmentHitsBox(L.a, L.b, tabBox, 2) && !segmentHitsBox(L.a, L.b, textCol, 2); });
      markChip = placeFirst(cands.length ? cands : [{x: mk.x, y: mk.y - MR - 8, a: 'middle', v: 'above'}].map(settleC), mkc, {obstacles: obst, points: threadPts, bounds: board, pad: 6, pointPad: 12});
    }
    const mb = markChip ? markChip.box : null;
    const markLead = mb ? (() => {
      const ex = clamp(mk.x, mb.x, mb.x + mb.w), ey = clamp(mk.y, mb.y, mb.y + mb.h);
      return Math.hypot(ex - mk.x, ey - mk.y) > MR + 2 ? h('line', {x1: r(ex), y1: r(ey), x2: r(mk.x), y2: r(mk.y), stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'}) : null;
    })() : null;
    const marker = g({name: 'marker', opacity: 0},
      markLead,
      h('circle', {cx: r(mk.x), cy: r(mk.y), r: MR, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node);

    return {
      // the changed-datum marker keeps clear of the card, its tab, the page and its margin (brackets, ¶ flags)
      markerClear: (() => {
        const mkBox = {x: mk.x - MR, y: mk.y - MR, w: MR * 2, h: MR * 2};
        const ov = (a2, b2) => a2.x < b2.x + b2.w && a2.x + a2.w > b2.x && a2.y < b2.y + b2.h && a2.y + a2.h > b2.y;
        const pgBox = {x: G.page.x, y: G.page.y, w: G.page.w + 50, h: G.page.h};
        return ![{x: noteAt.x, y: noteAt.y, w: G.note.w, h: G.note.h}, tabBox, pgBox].some(q => ov(mkBox, q));
      })(),
      annLines: [beforeChip, afterChip].filter(Boolean).map(c => c.fit.lines.length),
      G, s, ox, oy, ctxCopy, lensCopy, shelf, L2, source, dest, beforeChip, afterChip, strikes, arrowY, arrowD, ctxCap, marker, mk,
      noteAt, port, pin0, pin1, li0, li1, target, tabY,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.ctxCap && L.ctxCap.node,
      L.shelf.node,
      L.shelf.extra && L.shelf.extra.node,
      g({name: 'ctx-root'}, L.ctxCopy.node),
      L.marker,
      L.L2.node,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, g(null, L.strikes.map(x => x.node)),
        h('path', {name: 'ann-arrow', d: L.arrowD, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const S = w => seg(u, ...W[w]);
    const E = w => ease.inOutCubic(S(w));
    const showAll = ctx.show('all');
    const C = fpcColors(ctx);
    // substitution progress: inside the lens first, then in the context on return
    const change = ease.inOutSine(S('change'));
    const ctxUpd = ease.inOutCubic(S('ctxUpdate'));
    const pose = (P, copy, pr) => {
      // card slides in and is pinned (build); the thread is tied
      const sl = E('slide');
      nodes[`${P}-cardT`] = {transform: T(L.noteAt.x + 140 * (1 - sl), L.noteAt.y), opacity: r(clamp(sl * 1.5), 3)};
      nodes[`${P}-card-pin`] = {opacity: S('pin') > 0 ? 1 : 0};
      nodes[`${P}-card-pinT`] = {transform: `${T(copy.note.pinAt.x, copy.note.pinAt.y)} scale(${r(lerp(1.6, 1, ease.outCubic(S('pin'))), 3)})`};
      const tie = E('thread');
      nodes[`${P}-card-knot`] = {opacity: tie > 0 ? 1 : 0};
      // dependent geometry of the pinpoint: the source pin is pulled and re-pinned at the other passage
      const pinT = L.target === 'pinpoint' ? pr : 0;
      const lift = Math.sin(Math.PI * pinT) * 26;
      const pinAt = {x: lerp(L.pin0.x, L.pin1.x, pinT) + lift * 0.6, y: lerp(L.pin0.y, L.pin1.y, pinT)};
      const end = {x: lerp(pinAt.x, L.port.x, tie), y: lerp(pinAt.y, L.port.y, tie)};
      nodes[`${P}-thread`] = {d: threadD(pinAt, end, SAG * tie), opacity: tie > 0 ? 1 : 0};
      nodes[`${P}-srcpin`] = {opacity: tie > 0 ? 1 : 0};
      nodes[`${P}-srcpinT`] = {transform: T(pinAt.x, pinAt.y)};
      // brackets and highlights (the passage the note points to)
      const pas0 = copy.page.passages[L.li0], pas1 = copy.page.passages[L.li1];
      const moved = L.target === 'pinpoint' && L.li1 !== L.li0;
      const b0 = tie * (moved ? 1 - clamp(pr * 2) : 1);
      nodes[`${P}-src-br-${L.li0}`] = {'stroke-dashoffset': r(pas0.brLen * (1 - b0))};
      nodes[`${P}-src-hl-${L.li0}`] = {opacity: r(clamp(sl) * (moved ? 1 - pr : 1), 3)};
      nodes[`${P}-flag0`] = {opacity: r(tie * (moved ? 1 - 0.55 * clamp(pr * 2) : 1), 3)};
      if (moved) nodes[`${P}-flag1`] = {opacity: r(clamp(pr * 2 - 1), 3)};
      if (moved) {
        nodes[`${P}-src-br-${L.li1}`] = {'stroke-dashoffset': r(pas1.brLen * (1 - clamp(pr * 2 - 1)))};
        nodes[`${P}-src-hl-${L.li1}`] = {opacity: r(pr, 3)};
        nodes[`${P}-ghost`] = {opacity: r(0.8 * clamp(pr * 2), 3)};
      }
      // the datum itself: old value lifts away before the new one drops in (never double-printed)
      if (showAll) {
        const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
        const key = L.target === 'pinpoint' ? 'pp' : L.target === 'commentator' ? 'hd' : 'ft';
        nodes[`${P}-card-${key}0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`};
        nodes[`${P}-card-${key}1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`};
      }
      return {pinAt, end};
    };
    const lensState = pose('lns', L.lensCopy, change);
    const ctxState = pose('ctx', L.ctxCopy, ctxUpd);
    // lens open / close
    const open = E('open');
    const fadeC = S('fadeLens');
    const close = E('collapse');
    const lp = open * (1 - close);
    if (fadeC <= 0) {
      Object.assign(nodes, L.L2.frame(open, open));
      // the window frame flies out from the source; the enlarged copy shows only once it is in place
      // (so the copy never slides across other text of the board)
      const shown = r(clamp((open - 0.94) / 0.06), 3);
      nodes['lens-content'] = {...nodes['lens-content'], opacity: shown};
      // in flight only the frame travels (transparent), so it never hides the page underneath
      nodes['lens-bg'] = {...nodes['lens-bg'], opacity: shown};
      nodes['lens-shadow'] = {...nodes['lens-shadow'], opacity: shown};
    } else {
      // return, the opening in reverse: the enlarged copy first fades into the lens's own opaque paper
      // (never translucent over the shelf), then the empty frame folds back into its source rectangle
      // while the dim lifts
      Object.assign(nodes, L.L2.frame(1 - close, 1 - close));
      // then the empty paper clears (the dimmed shelf shows through the frame) before the frame moves
      const paper = r(1 - S('paper'), 3);
      nodes['lens-content'] = {...nodes['lens-content'], opacity: r(1 - fadeC, 3)};
      nodes['lens-bg'] = {...nodes['lens-bg'], opacity: paper};
      nodes['lens-shadow'] = {...nodes['lens-shadow'], opacity: paper};
    }
    // annotation
    if (L.beforeChip) {
      nodes.ann = {opacity: u >= W.before[0] && u < W.close[1] ? r(Math.min(S('before'), 1 - seg(u, W.close[0], W.close[0] + 0.035)), 3) : 0};
      nodes['ann-before'] = {opacity: r(1 - 0.45 * S('strike'), 3)};
      const sp = S('strike');
      const nS = L.strikes.length;
      L.strikes.forEach((x, i) => { nodes[`ann-strike-${i}`] = {'stroke-dashoffset': r(x.len * (1 - clamp(sp * nS - i)))}; });
      nodes['ann-arrow'] = {opacity: S('after') > 0 ? 1 : 0};
      nodes['ann-after'] = {opacity: r(S('after'), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(S('caption'), 3)};
    nodes.marker = {opacity: r(S('marker'), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = change <= 0 ? 'before' : change >= 1 ? 'after' : 'changing';
    const cur = (pr) => (L.target === 'pinpoint' ? (pr >= 1 ? L.li1 + 1 : L.li0 + 1) : L.li0 + 1);
    const toD = q => ({x: r(L.ox + q.x * L.s), y: r(L.oy + q.y * L.s)});
    const p = ctx.params;
    const valueAt = pr => (pr >= 1 ? p.afterValue : pr <= 0 ? p.beforeValue : 'changing');
    return {
      nodes,
      semantic: {
        beat,
        focusTarget: L.target,
        lensOpen: r(lp, 3),
        datum,
        lensValue: valueAt(change),
        contextValue: valueAt(ctxUpd),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        lensLinkedPassage: cur(change),
        contextLinkedPassage: cur(ctxUpd),
        contextPin: toD(ctxState.pinAt),
        lensPin: toD(lensState.pinAt),
        threadTied: S('thread') >= 1,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        sourceHoldsPort: L.port.x >= L.source.x && L.port.x <= L.source.x + L.source.w && L.port.y >= L.source.y && L.port.y <= L.source.y + L.source.h,
        cardFixed: true,
        markerShown: r(S('marker'), 3),
        markerClear: L.markerClear,
        annLines: L.annLines,
        // opacity of the enlarged copy inside the lens (it fades into the lens paper before the frame folds back)
        lensContent: fadeC > 0 ? r(1 - fadeC, 3) : r(clamp((open - 0.94) / 0.06), 3),
        zoom: r(L.dest.w / L.source.w, 2),
        lensMatchesContextAtOpen: true,
        colorsUnchanged: C.src !== C.com,
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
    slug: 'research-06-inspect',
    title: 'Primary source and commentary — inspect and change the side note’s pinpoint',
    titleEs: 'Fuente primaria y comentario — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Fuente primaria y comentario',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Reading board with a commentator’s card tied to a bracketed passage. A lens lifts a real copy of the link (bracket, thread, pinpoint tab) and substitutes one datum — by default the pinpoint ¶2 → ¶3, so the thread’s pin is re-pinned at the other passage and the old bracket stays as a dashed trace — or the attribution or date of the note. Returns to the context with a changed-datum marker; the source text never changes.',
    tags: ['research', 'primary source', 'commentary', 'pinpoint', 'inspect', 'lens', 'before-after', 'substitution', 'thread'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/fuente-primaria-y-comentario.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...FPC_STRINGS.en, ...STRINGS.en}, es: {...FPC_STRINGS.es, ...STRINGS.es}},
  scene,
});
