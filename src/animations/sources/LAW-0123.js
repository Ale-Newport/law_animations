/**
 * LAW-0123 — Texto y contexto · contrast
 *
 * Storyboard: two complete reading desks run on one clock, side by side on
 * wide and square frames and stacked full width on tall ones. Each desk has
 * the author's rack (the editable hierarchy), the open book with the article
 * on its right page, a hand magnifier and the reader's arm. On the desks the
 * key word's line is real text and the rest of the article is drawn as prop
 * lines; the identical supplied wording (article, ordering, sources) is
 * printed ONCE, readable, on a compact shared strip under the pair (as the
 * accepted LAW-0083 / LAW-0131 do). Each lane's reading is a callout card.
 *  [0.00–0.17] base: both desks identical at rest; each reader takes the
 *              magnifier. Shared facts are listed with the guide area.
 *  [0.17–0.40] change: the ONE changed fact — the reading scope — is made
 *              visible in place: A rings only the key word, B frames the whole
 *              article. Both magnifiers travel to the same word, same timing.
 *  [0.40–0.77] parallel: both lenses rise and enlarge the word. A keeps the
 *              lens raised on the word (read on its own). B lowers it, sweeps
 *              the other occurrences of the same word, lays it down and ties
 *              the book to its row on the author's rack (read in context).
 *              Each lane shows its attributed reading card.
 *  [0.77–1.00] guide: a comparison guide joins the lanes with the changed
 *              fact; a neutral note says no reading is marked correct.
 * No score, winner or legal consequence is drawn.
 * @module animations/sources/LAW-0123
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {measure} from '../../core/text.js';
import {deskStage, STAGE, sourcesFields, TC_DEFAULTS, TC_STRINGS, kitStrings, readingCard, drawRect, articleLayout, articleArt} from './kits/texto-y-contexto.js';

const ID = 'LAW-0123';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  grab: [0.03, 0.12], shared: [0.06, 0.14], scope: [0.18, 0.26], carry: [0.27, 0.38], lift: [0.41, 0.5],
  lower: [0.52, 0.57], sweep: [0.57, 0.66], back: [0.66, 0.72], release: [0.72, 0.76],
  ringA: [0.18, 0.27], rail: [0.6, 0.68], ribbon: [0.68, 0.75],
  cardA: [0.52, 0.6], cardB: [0.7, 0.77], sharedOut: [0.74, 0.78], guide: [0.79, 0.88], note: [0.87, 0.95],
};

const STRINGS = {
  en: {...TC_STRINGS.en, sameInAB: 'Same in A and B', bookRead: 'book on the desks'},
  es: {...TC_STRINGS.es, sameInAB: 'Igual en A y B', bookRead: 'libro en las mesas'},
};

const sceneSchema = {...sourcesFields, ...contrastFields()};

const defaultParams = {
  ...TC_DEFAULTS,
  scenarioA: {label: 'Isolated reading', caption: 'The key word is read on its own'},
  scenarioB: {label: 'Contextual reading', caption: 'The key word is read within the whole article'},
  changedFact: 'reading scope: the word alone / the whole article',
  sharedFacts: ['Same article and key word', 'Same book and rack order', 'Same magnifier and timing'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'Two readings shown side by side; neither is marked correct'},
};

/** Lane arrangement per shape: desk axis, side by side or stacked. */
const LANES = {
  landscape: {axis: 'laneWide', side: true, gap: 20},
  portrait: {axis: 'laneTall', side: false},
  // square: side by side as in 16:9, on taller desks (the frame has the height)
  square: {axis: 'laneSquare', side: true, gap: 16, guideBelow: true},
};

/** Book right edge, rest point and slide of the kit's lane desks (desk units). */
const LANE_DESK = {
  laneWide: {W: 920, H: 440, bookR: 756, lupa: [835, 300], angle: 25, slide: 20},
  laneTall: {W: 1000, H: 440, bookR: 832, lupa: [908, 290], angle: 25, slide: 20},
  laneSquare: {W: 920, H: 560, bookR: 756, lupa: [835, 380], angle: 25, slide: 20},
};
/** Grip distance of the kit magnifier from its lens centre (lupaArt). */
const gripOf = R => R * 1.96 + 0.3 * Math.max(8, 0.17 * R);
/** Lens radius for a key word of size Cd: the raised word (≥ ×1.9) fits the glass. */
const lensFor = (p, Cd, lift = 1.9) => {
  const kw = measure(String(p.passages.word || ''), Cd, 400, 'serif');
  return Math.max(58, Math.min(150, (Math.hypot(kw + 6, Cd) / 2) * (lift + 0.2) / (0.92 * 1.42) + 8));
};
/** Minimum raised magnification per shape (1:1 desks render at half size). */
const LIFT = {landscape: 1.9, portrait: 1.9, square: 1.6};
/** Rest point that keeps the parked magnifier off the book and the hand inside the desk. */
function restFor(D, R) {
  const a = (D.angle * Math.PI) / 180;
  const reach = gripOf(R) + D.slide;
  // (the hand, reach·cos(angle) right of the lens, stays inside the right edge)
  const x = Math.min(D.W - 30 - Math.cos(a) * reach, Math.max(D.bookR + R + 8, D.lupa[0]));
  const y = Math.max(R + 10, Math.min(D.lupa[1], D.H - 46 - Math.sin(a) * reach));
  return {x, y};
}

/** Minimum rendered text size (px at 1080p) for every supplied text. */
const MIN_PX = 16.8;

/**
 * Compose the scene for text size C (design units) and desk scale f. The two
 * desks are prebuilt in desk units (`stages`) and drawn scaled by f.
 */
function compose(ctx, C, f, stages, colFrac, artFrac = 0.58, hdrFrac = 0.42, guideBelow = undefined, axis = undefined) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
  const shape = ctx.view.shape;
  const cfg = {...LANES[shape], ...(colFrac ? {column: colFrac} : {}), ...(guideBelow !== undefined ? {guideBelow} : {}), ...(axis ? {axis} : {})};
  const st = STAGE[cfg.axis];
  const colA = th.accent3, colB = th.accent2;
  const DW = st.w * f, DH = st.h * f;
  const Wd = cfg.side ? DW * 2 + cfg.gap : cfg.column ? Math.round(DW / (1 - cfg.column)) : DW;

  // --- lane header: badge + label + caption, at the content size ----------
  const header = (L, scen, color, x, y, w) => {
    const br = C * 0.95;
    const pad0 = 0;
    const inner = [h('circle', {cx: r(x + br), cy: r(y + br), r: r(br), fill: color, stroke: th.ink, 'stroke-width': 2.5})];
    if (ctx.show('key')) inner.push(h('text', {x: r(x + br), y: r(y + br + C * 0.4), 'text-anchor': 'middle', 'font-size': r(C * 1.1), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, L));
    let hh = br * 2;
    if (ctx.show('key')) {
      const tx = x + br * 2 + 12, tw = w - br * 2 - 14;
      const lf = ctx.fit(scen.label, {maxWidth: tw, size: C, minSize: C, maxLines: 3, weight: 700});
      inner.push(textBlock(lf, {x: tx, y: y + 2, fill: th.fg}));
      let yy = y + 2 + lf.height;
      if (scen.caption && ctx.show('all')) {
        const cf = ctx.fit(scen.caption, {maxWidth: tw, size: C, minSize: C, maxLines: 4, weight: 500});
        inner.push(textBlock(cf, {x: tx, y: yy + C * 0.3, fill: th.fgSoft}));
        yy += C * 0.3 + cf.height;
      }
      hh = Math.max(hh, yy - y);
    }
    return {node: g({name: `hdr${L}`}, inner), h: hh + pad0, box: {x, y, w, h: hh}};
  };
  const cardFor = (L, x, y, w, noTitle = false) => readingCard(ctx, {
    noTitle,
    name: `card${L}`, x, y, w, kind: L === 'A' ? 'isolated' : 'contextual', title: L === 'A' ? p.scenarioA.label : p.scenarioB.label,
    text: p.interpretations[L === 'A' ? 'isolated' : 'contextual'].text, by: p.interpretations[L === 'A' ? 'isolated' : 'contextual'].by, proposedBy: t.proposedBy,
    // the reading and its credit print at the content size (the kit sets them at 0.95 × size)
    color: L === 'A' ? colA : colB, soft: L === 'A' ? th.accent3Soft : th.accent2Soft, size: C / 0.95, maxLines: 4, textMin: 1, bySize: 0.95, byMin: 0.95, byLines: 3,
  });

  // --- the two lanes -----------------------------------------------------------
  const lanes = [];
  let y = 0;
  if (cfg.side) {
    const hA = header('A', p.scenarioA, colA, 0, 0, DW);
    const hB = header('B', p.scenarioB, colB, DW + cfg.gap, 0, DW);
    const deskY = Math.max(hA.h, hB.h) + 8;
    const cardY = deskY + DH + 8;
    lanes.push({L: 'A', hdr: hA, x: 0, y: deskY, card: cardFor('A', 0, cardY, DW)});
    lanes.push({L: 'B', hdr: hB, x: DW + cfg.gap, y: deskY, card: cardFor('B', DW + cfg.gap, cardY, DW)});
    y = Math.max(...lanes.map(l => l.card.box.y + l.card.h)) + 14;
  } else if (cfg.column) {
    const cx = DW + cfg.gap, cw = Wd - cx;
    for (const L of ['A', 'B']) {
      const hd = header(L, L === 'A' ? p.scenarioA : p.scenarioB, L === 'A' ? colA : colB, cx, y, cw);
      // the card hangs right under the lane header that names it (no repeated title)
      const card = cardFor(L, cx, y + hd.h + 8, cw, true);
      const colH = hd.h + 8 + card.h;
      const laneH = Math.max(DH, colH);
      lanes.push({L, hdr: hd, x: 0, y: y + (laneH - DH) / 2, card});
      y += laneH + 22;
    }
  } else {
    // stacked: a header row (scenario header left, reading card right) over a
    // full-width desk
    const hw = Math.round(Wd * hdrFrac);
    for (const L of ['A', 'B']) {
      const hd = header(L, L === 'A' ? p.scenarioA : p.scenarioB, L === 'A' ? colA : colB, 0, y, hw - 14);
      const card = cardFor(L, hw, y, Wd - hw);
      const rowH = Math.max(hd.h, card.h);
      const deskY = y + rowH + 10;
      lanes.push({L, hdr: hd, x: 0, y: deskY, card});
      y = deskY + DH + 22;
    }
  }
  lanes.forEach((ln, i) => { ln.stage = stages[i]; });
  // B's highlighted rack row: its level name as real text on that drawer's own
  // white plate, just above the slot (drawn in desk units inside lane B, at the
  // content size). A long name grows the plate upward over the drawers above —
  // never down over the slot or the ribbon that enters it from the side.
  let lvlB = null;
  const B0 = lanes[1].stage;
  if (ctx.show('all') && B0.slot && B0.rack.slotRow >= 0) {
    const lv = p.hierarchy.levels[clamp(p.sources[0].level, 0, p.hierarchy.levels.length - 1)];
    const row = B0.rack.rows[B0.rack.slotRow];
    const pl = row.plate;
    const S = C / f;
    // on the plate; a long name may also span the book's left page (filler
    // lines only) — always above the slot, clear of the ribbon at its side
    const room = B0.slot.y - 5 - (B0.rack.box.y + 6);
    let lf = null, bw0 = pl.w;
    for (const wv of [pl.w, B0.pg.left.x + B0.pg.left.w - 12 - pl.x]) {
      lf = ctx.fit(lv, {maxWidth: wv - 14, size: S, minSize: S, maxLines: 10, weight: 700});
      bw0 = Math.min(wv, lf.width + 20);
      const words = String(lv).split(/\s+/);
      const whole = !lf.truncated && lf.lines.every(ln => ln.split(' ').every(wd => !wd || words.includes(wd)));
      if (whole && lf.height + 12 <= room) break;
    }
    bw0 = Math.max(bw0, pl.w);
    const hh = lf.height + 12;
    const bottom = Math.max(pl.y + pl.h, Math.min(B0.slot.y - 5, pl.y + hh));
    const top = Math.max(B0.rack.box.y + 6, bottom - hh);
    const box = {x: pl.x, y: top, w: bw0, h: Math.max(bottom - top, hh)};
    lvlB = {
      box, fit: lf,
      node: g({name: 'lvlB', opacity: 0},
        h('path', {d: roundRectPath(box.x + 3, box.y + 4, box.w, box.h, 6), fill: ctx.theme.shadow}),
        h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 6), fill: th.paper, stroke: colB, 'stroke-width': 2.5}),
        textBlock(lf, {x: box.x + box.w / 2, y: box.y + (box.h - lf.height) / 2, anchor: 'middle', fill: th.ink})),
    };
  }

  // --- shared strip: the identical supplied wording, printed once ---------
  // (the guide sits beside the strip when the lanes are side by side)
  const gside = cfg.side && !cfg.guideBelow;
  const guideW = gside ? Math.min(560, Wd * 0.32) : 0;
  const stripW = gside ? Wd - guideW - 24 : Wd;
  const P = p.passages;
  const pad = 16;
  // the strip's title is a tab on its top border (no row of its own)
  const titleF = ctx.show('key') ? ctx.fit(t.sameInAB, {maxWidth: stripW - pad * 2, size: C, minSize: C, maxLines: 1, weight: 700}) : null;
  const tabH0 = titleF ? titleF.height + 10 : 0;
  if (titleF) y += tabH0;
  const artW = Math.round((stripW - pad * 3) * artFrac);
  const hierW = stripW - pad * 3 - artW;
  const top0 = y + pad;
  const AL = articleLayout(ctx, {x: pad, y: top0, w: artW, h: 4000, heading: P.heading, lines: P.lines, word: P.word, wordPassage: P.wordPassage ?? 0, size: C, headLines: 4, headMin: C});
  const art = articleArt(ctx, AL, {prefix: 'sart', numScale: 1});
  const hierX = pad * 2 + artW;
  let hy = top0;
  const hier = [];
  if (ctx.show('all')) {
    if (p.hierarchy.caption) {
      const cf = ctx.fit(p.hierarchy.caption, {maxWidth: hierW, size: C, minSize: C, maxLines: 4, weight: 700});
      hier.push(textBlock(cf, {x: hierX, y: hy, fill: th.ink}));
      hy += cf.height + C * 0.3;
    }
    p.hierarchy.levels.forEach((lv, li) => {
      const here = p.sources.map((s0, i) => ({...s0, i})).filter(s0 => clamp(s0.level, 0, p.hierarchy.levels.length - 1) === li);
      const names = here.map(s0 => (s0.i === 0 ? `${s0.name} · ${s0.title} (${t.bookRead})` : s0.name)).join(' · ');
      const lf = ctx.fit(names ? `${lv}: ${names}` : lv, {maxWidth: hierW - 18, size: C, minSize: C, maxLines: 6, weight: 500});
      hier.push(h('rect', {x: r(hierX), y: r(hy + 3), width: 7, height: r(lf.height - 6), rx: 3, fill: shade(th.wood, -0.1)}));
      hier.push(textBlock(lf, {x: hierX + 16, y: hy, fill: th.ink}));
      hy += lf.height + C * 0.25;
    });
  }
  const stripBottom = Math.max(AL.box.y + AL.box.h, hy) + pad;
  const stripBox = {x: 0, y, w: stripW, h: stripBottom - y};
  const tabW = titleF ? titleF.width + 24 : 0, tabH = titleF ? titleF.height + 10 : 0;
  const strip = g({name: 'strip'},
    h('path', {d: roundRectPath(0, y, stripW, stripBox.h, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
    // the title tab stands on the strip's top border
    titleF ? h('path', {d: `M${r(pad)} ${r(y + 1)}V${r(y - tabH + 8)}Q${r(pad)} ${r(y - tabH)} ${r(pad + 8)} ${r(y - tabH)}H${r(pad + tabW - 8)}Q${r(pad + tabW)} ${r(y - tabH)} ${r(pad + tabW)} ${r(y - tabH + 8)}V${r(y + 1)}`, fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}) : null,
    titleF ? textBlock(titleF, {x: pad + 12, y: y - tabH + 5, fill: th.fgSoft}) : null,
    art.hl, art.rest, art.key, hier);

  // --- guide: shared facts (early), then the guide and the neutral note -----
  const gx0 = gside ? stripW + 24 : 0;
  const gw = gside ? guideW : Wd;
  const gy0 = gside ? y : stripBottom + 18;
  const gxA = gx0 + 26, gxB = gx0 + gw - 26;
  const shared = [];
  let sfBottom = gy0;
  // 1:1: the shared facts fill the card row under the desks until the cards
  // arrive (no blank band), when they fit its height
  let sharedEarly = false;
  if (ctx.show('all') && p.sharedFacts.length && cfg.guideBelow !== undefined && cfg.side) {
    const band = {y: lanes[0].card.box.y, h: Math.max(lanes[0].card.h, lanes[1].card.h)};
    let sx = 0, sy = band.y, rowH = 0;
    const tmp = [];
    p.sharedFacts.forEach((fct, i) => {
      const pr = chip(ctx, fct, {x: 0, y: 0, maxWidth: Wd, size: C, minSize: C, maxLines: 3, weight: 500});
      if (sx > 0 && sx + pr.box.w > Wd) { sx = 0; sy += rowH + 8; rowH = 0; }
      tmp.push(chip(ctx, fct, {x: sx, y: sy, maxWidth: Wd, size: C, minSize: C, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 500, name: `sf${i}`}));
      sx += pr.box.w + 10;
      rowH = Math.max(rowH, pr.box.h);
    });
    if (sy + rowH <= band.y + band.h) { shared.push(...tmp); sharedEarly = true; }
  }
  if (!sharedEarly && ctx.show('all') && p.sharedFacts.length) {
    let sx = gx0, sy = gy0, rowH = 0;
    p.sharedFacts.forEach((fct, i) => {
      const pr = chip(ctx, fct, {x: 0, y: 0, maxWidth: gw, size: C, minSize: C, maxLines: 3, weight: 500});
      if (sx > gx0 && sx + pr.box.w > gx0 + gw) { sx = gx0; sy += rowH + 8; rowH = 0; }
      const c = chip(ctx, fct, {x: sx, y: sy, maxWidth: gw, size: C, minSize: C, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 500, name: `sf${i}`});
      shared.push(c);
      sx += c.box.w + 10;
      rowH = Math.max(rowH, c.box.h);
    });
    sfBottom = sy + rowH;
  }
  const glyph = (L, x, yy, color) => {
    const s2 = 40;
    const icon = L === 'A'
      ? g(null, h('circle', {cx: 0, cy: 0, r: s2 * 0.5, fill: th.card, stroke: color, 'stroke-width': 4}), h('rect', {x: -s2 * 0.26, y: -s2 * 0.08, width: s2 * 0.52, height: s2 * 0.16, rx: 3, fill: shade(color, -0.3)}))
      : g(null, h('path', {d: roundRectPath(-s2 * 0.42, -s2 * 0.5, s2 * 0.84, s2, 5), fill: th.card, stroke: color, 'stroke-width': 4}),
        [-0.28, -0.1, 0.08, 0.26].map((q, j) => h('rect', {x: -s2 * 0.28, y: s2 * q, width: s2 * (j === 1 ? 0.24 : 0.56), height: s2 * 0.08, rx: 1.5, fill: j === 1 ? shade(color, -0.3) : th.paperLine})));
    return {node: g({name: `gl${L}`, transform: T(x, yy), opacity: 0}, icon), x, y: yy};
  };
  let guideChip = null;
  const guideText = p.changedFact ? `${p.comparisonLabels.guide} — ${p.changedFact}` : p.comparisonLabels.guide;
  const chipW = Math.min(gxB - gxA - 90, 900);
  if (ctx.show('key')) guideChip = chip(ctx, guideText, {x: (gxA + gxB) / 2, y: gy0, anchor: 'middle', maxWidth: chipW, size: C, minSize: C, maxLines: 12, fill: th.card, stroke: th.ink, name: 'guideChip', weight: 600});
  const ay = guideChip ? guideChip.box.y + guideChip.box.h / 2 : gy0 + 24;
  const glA = glyph('A', gxA, ay, colA);
  const glB = glyph('B', gxB, ay, colB);
  const gl = {x1: gxA + 26, x2: gxB - 26, y: ay};
  let note = null;
  if (ctx.show('all')) {
    const ny = (guideChip ? guideChip.box.y + guideChip.box.h : gy0 + 48) + 10;
    note = chip(ctx, p.comparisonLabels.neutral, {x: gx0 + gw / 2, y: ny, anchor: 'middle', maxWidth: gw, size: C, minSize: C, maxLines: 10, fill: th.card, name: 'note', weight: 500});
  }
  const guideBottom = Math.max(note ? note.box.y + note.box.h : ay + 30, sfBottom);
  const Hd = Math.max(stripBottom, guideBottom) + 6;
  const s = Math.min(ctx.design.w / Wd, ctx.design.h / Hd);
  const ox = (ctx.design.w - Wd * s) / 2;
  const oy = (ctx.design.h - Hd * s) / 2;
  const k = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
  // share: the lane (desk + its attached header/card column) over the frame width
  return {sharedEarly, lvlB, s, ox, oy, Wd, Hd, C, f, k, px: C * s * k, share: ((cfg.side ? DW : Wd) * s * k) / ctx.view.width, deskShare: (DW * s * k) / ctx.view.width, st, cfg, lanes, strip, stripBox, AL, shared, glA, glB, gl, guideChip, note};
}

/** Build the two identical desks (desk units) with the key line at size Cd. */
function desks(ctx, Cd, axis) {
  const cfg = {...LANES[ctx.view.shape], ...(axis ? {axis} : {})};
  const p = ctx.params;
  const lift = LIFT[ctx.view.shape];
  const lensR = lensFor(p, Cd, lift);
  // the article stays in the band where a raised (×1.42) or sweeping lens remains on the desk
  const D = LANE_DESK[cfg.axis];
  const rim = lensR * 1.42 + Math.max(8, lensR * 0.17) * 0.8 + 6;
  const artBand = [rim, D.H - (lensR * 1.08 + Math.max(8, lensR * 0.17) * 0.8 + 6)];
  // the rack is wide enough for the longest level word on a drawer plate at
  // the label size (Cd ≥ the label's size), so no word is ever broken
  const longest = Math.max(...p.hierarchy.levels.flatMap(lv => String(lv).split(/\s+/)).map(wd => measure(wd, Cd, 700, 'sans')), 0);
  // (capped: a longer label spans the plate and the book's left page instead)
  const rackW = Math.min(230, Math.ceil(longest + 14 + 20 + 28 + 10));
  const o = {params: p, size: Cd, compact: true, pageText: false, rackBars: true, axis: cfg.axis, lensR, restAt: restFor(D, lensR), artBand, rackW, ribbonSide: 'right', minLift: lift};
  // the parked magnifier rests in free desk space: clear of the rack, of the
  // article frame and its rail (and of the book when there is room), with its
  // handle and the resting hand inside the desk
  // a parking bay right of the book, wide enough for the laid-down lens
  // (handle pointing down to the resting hand)
  o.bookRight = D.W - Math.ceil(2 * (lensR * 1.1 + 8) + 20);
  const probe = deskStage(ctx, {prefix: 'A', ...o});
  const rest = freeRest(probe, D);
  if (rest) { o.restAt = {x: rest.x, y: rest.y}; o.restAngle = rest.angle; }
  return [rest ? deskStage(ctx, {prefix: 'A', ...o}) : probe, deskStage(ctx, {prefix: 'B', ...o})];
}

/**
 * Largest desks whose text still renders at ≥ MIN_PX: for each desk scale f
 * (largest first) find the smallest text size C that reaches MIN_PX; keep the
 * candidate with the largest desk share. The desk's key line is sized so it
 * renders at MIN_PX too.
 */
/** Solver decisions by params + view (numbers only; nodes are rebuilt per instance). */
const DECISIONS = new Map();

function solve(ctx) {
  // (only what the layout depends on: timing, seed, palette or background never change it)
  const p = ctx.params;
  const key = JSON.stringify([p.passages, p.sources, p.hierarchy, p.interpretations, p.scenarioA, p.scenarioB, p.changedFact, p.sharedFacts, p.comparisonLabels, p.locale, p.textVisibility,
    ctx.view.width, ctx.view.height, ctx.view.content]);
  const hit = DECISIONS.get(key);
  if (hit) return finish(ctx, hit);
  const d = decide(ctx);
  if (DECISIONS.size > 200) DECISIONS.delete(DECISIONS.keys().next().value);
  DECISIONS.set(key, d);
  return finish(ctx, d);
}

/** Rest point for the magnifier in free desk space (desk units), or null. */
function freeRest(S, D) {
  for (const ang of [D.angle, 40, 55, 70, 80, 88]) {
    const r0 = freeRestAt(S, D, ang);
    if (r0) return {...r0, angle: ang};
  }
  return null;
}
function freeRestAt(S, D, ang) {
  const R = S.lupa.R * 1.1 + 8;
  const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const reach = S.lupa.grip + D.slide;
  const grow = (b, p0) => ({x: b.x - p0, y: b.y - p0, w: b.w + 2 * p0, h: b.h + 2 * p0});
  const frame = grow(S.aBox, 8), rack = grow(S.rack.box, 6), book = grow(S.bookBox, 4);
  const circHits = (c, b) => { const dx = Math.max(b.x - c.x, 0, c.x - (b.x + b.w)), dy = Math.max(b.y - c.y, 0, c.y - (b.y + b.h)); return Math.hypot(dx, dy) < R; };
  const segHits = (p1, p2, b) => { for (let i = 0; i <= 12; i++) { const q = {x: p1.x + (p2.x - p1.x) * i / 12, y: p1.y + (p2.y - p1.y) * i / 12}; if (q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h) return true; } return false; };
  for (const avoidBook of [true]) {
    let best = null;
    for (let y = R + 6; y <= S.H - R - 6; y += 6) {
      for (let x = S.W - R - 6; x >= R + 6; x -= 6) {
        const c = {x, y}, hand = {x: x + ca * reach, y: y + sa * reach};
        if (hand.x < 30 || hand.x > S.W - 30 || hand.y < 30 || hand.y > S.H - 30) continue;
        if (circHits(c, frame) || circHits(c, rack) || (avoidBook && circHits(c, book))) continue;
        const grip0 = {x: x + ca * R, y: y + sa * R};
        if (segHits(grip0, hand, frame) || segHits(grip0, hand, rack)) continue;
        // the resting forearm (hand → shoulder) must not lie over the article either
        if (segHits(hand, S.shoulder, frame) || segHits(hand, S.shoulder, book)) continue;
        const score = x - Math.abs(y - D.lupa[1]) * 0.3;
        if (!best || score > best.score) best = {x, y, score};
      }
    }
    if (best) return {x: best.x, y: best.y};
  }
  return null;
}

/** Lens rim (with its outline) around the lens centre, for a pose semantic. */
const lensRim = (S, sem) => S.lupa.R * sem.lensScale + Math.max(8, S.lupa.R * 0.17) * 0.8;
/** Whether the lens circle lies wholly inside the desk. */
const lensIn = (S, sem) => {
  const R = lensRim(S, sem), c = sem.lens;
  return c.x - R >= 4 && c.x + R <= S.W - 4 && c.y - R >= 4 && c.y + R <= S.H - 4;
};

/** Build the final layout for a solver decision. */
function finish(ctx, best) {
  const cfg = LANES[ctx.view.shape];
  // the desks' key line renders at ≥ MIN_PX and, when headers are shown, at the
  // content size (never smaller than headers) — capped so the raised lens
  // (sized for that word) still fits the desk height
  const axis0 = best.axis || cfg.axis;
  const Hdesk = LANE_DESK[axis0].H;
  const Cmin = Math.ceil((MIN_PX / (best.f * best.s * best.k)) * 1.01);
  let Cd = Math.max(Cmin, ctx.show('key') ? Math.ceil((best.C / best.f) * 1.01) : Cmin);
  const fits = c => { const R = lensFor(ctx.params, c, LIFT[ctx.view.shape]); return 2 * (R * 1.42 + Math.max(8, R * 0.17)) + 24 <= Hdesk; };
  while (Cd > Cmin && !fits(Cd)) Cd--;
  const stages = desks(ctx, Math.max(20, Cd), best.axis);
  const st = STAGE[best.axis || cfg.axis];
  const L = compose(ctx, best.C, best.f, stages, best.cf, best.af, best.hf, best.gb, best.axis);
  const k0 = stages[0].key;
  L.scopeA = drawRect('scopeA', {x: k0.x - 10, y: k0.y - 8, w: k0.w + 20, h: k0.h + 16}, 10, ctx.theme.accent3, 5);
  L.Cd = Cd;
  L.stW = st.w;
  return L;
}

function decideOne(ctx, gb, axis) {
  const cmp = (C, f, st, cf, af = 0.58, hf = 0.42) => compose(ctx, C, f, st, cf, af, hf, gb, axis);
  const cfg = {...LANES[ctx.view.shape], ...(axis ? {axis} : {})};
  const k = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
  const dw = ctx.design.w, dh = ctx.design.h;
  const base = desks(ctx, 24, axis);
  // the layout height is close to linear in the text size (Hd ≈ a + b·C), and
  // the width depends on f only: two compositions per f give the text size
  // that renders at a target px; one more verifies it
  const solveFor = (af, hf = 0.42) => {
    const cands = [];
    const cols = cfg.column ? [cfg.column, 0.48] : [null];
    for (const cf of cols) {
      for (const f of [1.7, 1.45, 1.2, 1.0, 0.8, 0.6]) {
        const L1 = cmp(24, f, base, cf, af, hf);
        const L2 = cmp(40, f, base, cf, af, hf);
        const b = (L2.Hd - L1.Hd) / 16, a = L1.Hd - 24 * b;
        cands.push({cf, f, a, b, Wd: L1.Wd, fitW: L1.share / Math.min(dw / L1.Wd, dh / L1.Hd), pxMax: b > 0 ? (k * dh) / b : Infinity});
      }
    }
    const need = (c, target) => {
      const tp = target / k;
      const Cw = (target * c.Wd) / (k * dw);
      const Ch = dh - c.b * tp > 0 ? (c.a * tp) / (dh - c.b * tp) : Infinity;
      return Math.max(Cw, Ch);
    };
    let out = null;
    for (const target of [MIN_PX, 16.5, 16.1]) {
      const ok = cands.filter(c => c.pxMax > target * 1.02 && Number.isFinite(need(c, target)));
      const est = c => c.fitW * Math.min(dw / c.Wd, dh / (c.a + c.b * need(c, target)));
      ok.sort((x, y) => est(y) - est(x));
      for (const c of ok.slice(0, 3)) {
        let C = Math.min(90, Math.ceil(need(c, target)));
        let L = cmp(C, c.f, base, c.cf, af, hf);
        for (let i = 0; i < 3 && L.px < target && C < 90; i++) { C = Math.min(90, Math.ceil(C * (target / L.px) * 1.01)); L = cmp(C, c.f, base, c.cf, af, hf); }
        if (L.px < target) continue;
        if (!out || L.share > out.share + 1e-4) out = {...L, cf: c.cf, af, hf, a: c.a, b: c.b};
      }
      if (out) break;
    }
    return out;
  };
  let best = solveFor(0.58, 0.42);
  // dense text sets: try other strip / header-row splits only when needed
  const want = cfg.side ? 0.415 : 0.82;
  if (!best || best.share < want) {
    const hfs = !cfg.side && !cfg.column ? [0.42, 0.34, 0.5] : [0.42];
    const alts = [];
    for (const af of [0.58, 0.5, 0.66]) for (const hf of hfs) if (!(af === 0.58 && hf === 0.42)) alts.push([af, hf]);
    for (const [af, hf] of alts) {
      const alt = solveFor(af, hf);
      if (alt && (!best || alt.share > best.share + 0.002 || (alt.share > best.share - 0.002 && alt.px > best.px))) best = alt;
    }
  }
  // direct refinement (the linear model can misrank): for each desk scale,
  // step the text size up from its width-bound lower bound to MIN_PX
  if (!cfg.column) {
    const af = best ? best.af : 0.58, hf = best ? best.hf : 0.42;
    for (const f of [1.7, 1.45, 1.2, 1.0]) {
      const W0 = cmp(24, f, base, null, af, hf).Wd;
      let C = Math.max(16, Math.floor((MIN_PX * W0) / (k * dw)));
      for (let i = 0; i < 12; i++, C++) {
        const L = cmp(C, f, base, null, af, hf);
        if (best && L.share < best.share - 1e-4) break;
        if (L.px >= MIN_PX) {
          if (!best || L.share > best.share + 1e-4 || best.px < MIN_PX) best = {...L, cf: null, af, hf};
          break;
        }
      }
    }
  }
  // a dense text set (px is then not monotone in C: lanes switch from
  // desk-bound to column-bound): a bounded scan with wider card columns
  if (!best) {
    const cols = cfg.column ? [0.48, 0.56, 0.6] : [null];
    for (const cf of cols) {
      for (const f of cfg.column ? [0.9, 1.0, 1.1] : [1.0, 1.2, 1.45]) {
        for (const C of [36, 40, 44, 48, 52]) {
          const L = cmp(C, f, base, cf, 0.58);
          if (L.px < 16.1) continue;
          if (!best || L.px > best.px + 0.3 || (L.px > best.px - 0.3 && L.share > best.share)) best = {...L, cf, af: 0.58, hf: 0.42, b: 0};
        }
      }
    }
  }
  if (!best) best = {...cmp(24, 1, base), cf: undefined, af: 0.58, hf: 0.42};
  return {C: best.C, f: best.f, s: best.s, k: best.k, px: best.px, share: best.share, cf: best.cf, af: best.af, hf: best.hf, gb, axis};
}

/** Try the guide under the strip (when the lanes allow it) and beside it; keep the larger desks at ≥ 16 px. */
function decide(ctx) {
  const cfg = LANES[ctx.view.shape];
  if (!cfg.guideBelow) return decideOne(ctx, undefined);
  // 1:1: the tall lane desk first; the shorter one when a dense text set needs the height
  const ok = d => d.px >= 16.05;
  let best = null;
  for (const axis of [cfg.axis, 'laneWide']) {
    for (const gb of [true, false]) {
      const d = decideOne(ctx, gb, axis);
      if (!best || (ok(d) && !ok(best)) || (ok(d) === ok(best) && (ok(d) ? d.share > best.share + 0.005 : d.px > best.px))) best = d;
    }
    if (ok(best) && best.share >= 0.42) break;
  }
  return best;
}

const strip = (name) => name.replace(/^[AB]-/, 'X-');

/** Samples of lane B's ribbon (design units) that lie under a label or card. */
function ribbonCovered(L) {
  const B = L.lanes[1], rb = B.stage.ribbon;
  if (!rb) return 0;
  const toD = q => ({x: B.x + q.x * L.f, y: B.y + q.y * L.f});
  const boxes = [L.lvlB && {x: B.x + L.lvlB.box.x * L.f, y: B.y + L.lvlB.box.y * L.f, w: L.lvlB.box.w * L.f, h: L.lvlB.box.h * L.f},
    ...L.lanes.flatMap(l => [l.card.box, l.hdr.box]), L.guideChip && L.guideChip.box, L.note && L.note.box, L.stripBox, ...L.shared.map(c => c.box)].filter(Boolean);
  let n = 0;
  for (let i = 1; i < 60; i++) {
    const q = toD(rb.at(i / 60));
    if (boxes.some(b => q.x > b.x + 1 && q.x < b.x + b.w - 1 && q.y > b.y + 1 && q.y < b.y + b.h - 1)) n++;
  }
  return n;
}

const scene = {
  sizes: {landscape: [1900, 900], square: [1240, 1060], portrait: [1000, 1660]},
  layout(ctx) {
    return solve(ctx);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const len = Math.max(1, L.gl.x2 - L.gl.x1);
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.lanes.map(ln => g(null,
        g({transform: T(ln.x, ln.y, 0, L.f)}, ln.stage.node, ln.L === 'A' ? L.scopeA.node : null, ln.L === 'B' && L.lvlB ? L.lvlB.node : null),
        ln.hdr.node,
        ln.card.node)),
      L.strip,
      L.shared.map(c => g({name: `${c.node.attrs.name}-w`, opacity: 0}, c.node)),
      h('line', {name: 'guideLine', x1: L.gl.x1, x2: L.gl.x2, y1: L.gl.y, y2: L.gl.y, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
      L.glA.node, L.glB.node,
      L.guideChip && g({name: 'guideChipW', opacity: 0}, L.guideChip.node),
      L.note && g({name: 'noteW', opacity: 0}, L.note.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const w = name => seg(u, ...W[name]);
    const common = {grab: w('grab'), carry: w('carry'), lift: w('lift')};
    const lift = w('lift');
    // A: the lens stays raised on the word to the end
    const aDim = lift * (1 - 0.6 * seg(u, W.cardA[1], W.cardA[1] + 0.06));
    const vA = {...common, lower: 0, back: 0, release: 0, dim: aDim, isolate: lift, hlKey: 0.35 + 0.65 * seg(u, 0.3, 0.36)};
    // B: same until the lift; then lowered, swept over the other occurrences, laid down
    const lower = w('lower');
    const vB = {...common, lower, sweep: w('sweep'), back: w('back'), release: w('release'), dim: lift * (1 - lower), isolate: lift * (1 - lower),
      ringA: w('ringA'), rail: w('rail'), hlOthers: w('sweep'), ribbon: w('ribbon'), hlKey: 0.35 + 0.65 * seg(u, 0.3, 0.36)};
    const [A, B] = L.lanes;
    const sa = A.stage.pose(vA);
    const sb = B.stage.pose(vB);
    Object.assign(nodes, sa.nodes, sb.nodes);
    // A's scope ring: shown in the change beat, handed over to the lens when it arrives
    Object.assign(nodes, L.scopeA.frame(w('scope')));
    nodes.scopeA.opacity = r(clamp(w('scope') * 3) * (1 - seg(u, 0.35, 0.38)), 3);
    // B's row label arrives with the ribbon that ties the book to that row
    if (L.lvlB) nodes.lvlB = {opacity: r(seg(u, W.ribbon[0] + 0.03, W.ribbon[1]), 3)};
    const cA = w('cardA'), cB = w('cardB');
    nodes.cardA = {opacity: r(clamp(cA * 1.6), 3), transform: T(A.card.box.x, A.card.box.y + (1 - cA) * 12)};
    nodes.cardB = {opacity: r(clamp(cB * 1.6), 3), transform: T(B.card.box.x, B.card.box.y + (1 - cB) * 12)};
    // shared strip: the key word and its other occurrences highlighted, always
    L.AL.occ.forEach((q, i) => { nodes[`sart-h${i}`] = {opacity: q.key ? 1 : 0.9}; });
    const sIn = w('shared'), sOut = L.sharedEarly ? seg(u, 0.47, 0.51) : w('sharedOut');
    L.shared.forEach(c => { nodes[`${c.node.attrs.name}-w`] = {opacity: r(sIn * (1 - sOut), 3)}; });
    const gp = w('guide');
    const len = Math.max(1, L.gl.x2 - L.gl.x1);
    nodes.guideLine = {'stroke-dashoffset': r(len * (1 - gp))};
    nodes.glA = {opacity: r(clamp(gp * 4), 3)};
    nodes.glB = {opacity: r(clamp(gp * 4), 3)};
    if (L.guideChip) nodes.guideChipW = {opacity: r(seg(u, W.guide[0] + 0.04, W.guide[1]), 3)};
    if (L.note) nodes.noteW = {opacity: r(w('note'), 3)};

    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const panelPt = (S, q) => P2({x: S.x + q.x * L.f, y: S.y + q.y * L.f});
    const ctxOf = v => ({article: (v.ringA ?? 0) >= 1, occurrences: (v.rail ?? 0) >= 1, rack: (v.ribbon ?? 0) >= 1});
    // both desks render identical nodes (names aside) until the change beat
    const norm = nd => JSON.stringify(Object.fromEntries(Object.entries(nd).map(([k, v]) => [strip(k), v]).sort((a, b) => (a[0] < b[0] ? -1 : 1))));
    // share of the frame width taken by each desk (pixels / frame width)
    const share = r(L.share, 3);
    // the key word, magnified under A's raised lens, lies wholly inside the glass
    const ka = sa.semantic;
    const glassR = A.stage.lupa.glassR * ka.lensScale;
    // (the word's full width and its x-height band, ±0.3 of the text size, around the centre line)
    const kwIn = Math.hypot((A.stage.key.w / 2 + 3) * ka.magnification, (A.stage.AL.size * 0.3) * ka.magnification) <= glassR;
    const gcBox = L.guideChip && L.guideChip.box, nBox = L.note && L.note.box;
    return {
      nodes,
      semantic: {
        beat,
        handA: panelPt(A, sa.semantic.hand), lensA: panelPt(A, sa.semantic.lens), gripA: panelPt(A, sa.semantic.lensGrip),
        handB: panelPt(B, sb.semantic.hand), lensB: panelPt(B, sb.semantic.lens), gripB: panelPt(B, sb.semantic.lensGrip),
        A: {scope: 'word', held: sa.semantic.lensHeld, onWord: sa.semantic.lensOnWord, magnification: sa.semantic.magnification, isolated: vA.isolate > 0.5, context: ctxOf(vA), card: cA >= 1},
        B: {scope: 'article', held: sb.semantic.lensHeld, onWord: sb.semantic.lensOnWord, magnification: sb.semantic.magnification, isolated: vB.isolate > 0.5, context: ctxOf(vB), card: cB >= 1},
        scopeMarks: {A: w('scope') > 0 && u < 0.36, B: w('ringA') >= 1},
        sameSetup: JSON.stringify(A.stage.key) === JSON.stringify(B.stage.key) && JSON.stringify(A.stage.slot) === JSON.stringify(B.stage.slot) && A.stage.others.length === B.stage.others.length,
        identicalDesks: norm(sa.nodes) === norm(sb.nodes),
        occurrences: B.stage.others.length,
        changedFact: ctx.params.changedFact,
        guide: gp >= 1,
        sharedFactsShown: sIn >= 1 && sOut === 0,
        allReached: sa.semantic.allReached && sb.semantic.allReached,
        sceneShare: {A: share, B: share, desk: r(L.deskShare, 3), arrangement: L.cfg.side ? 'side' : 'stacked'},
        keyInsideLensA: !ka.lensOnWord || ka.magnification < 1.7 || kwIn,
        ribbonHits: B.stage.ribbonHits,
        guideNoteClear: !(gcBox && nBox) || gcBox.y + gcBox.h + 4 <= nBox.y,
        // each reader's hand stays inside its desk frame (never cut at the edge)
        handsInside: [sa, sb].every((q, i) => {
          const S = L.lanes[i].stage, hd = q.semantic.hand;
          return hd.x >= 26 && hd.x <= S.W - 26 && hd.y >= 26 && hd.y <= S.H - 26;
        }),
        rowLabel: Boolean(L.lvlB) || !ctx.show('all'),
        // the magnifier laid down in lane B rests clear of the article frame and its rail
        parkedClear: (() => { const S = L.lanes[1].stage, sem = sb.semantic; if (!(vB.release >= 1)) return true; const R = S.lupa.R + 6, b = S.aBox; const dx = Math.max(b.x - sem.lens.x, 0, sem.lens.x - (b.x + b.w)), dy = Math.max(b.y - sem.lens.y, 0, sem.lens.y - (b.y + b.h)); return Math.hypot(dx, dy) >= R; })(),
        // no label (row plate, cards, headers, guide, note, strip) lies on B's ribbon
        ribbonCovered: ribbonCovered(L),
        // the lens holds the supplied key word itself (it was found on the desk page)
        keyWordOnDesk: L.lanes.every(l => l.stage.AL.found && !l.stage.AL.key.synthetic),
        rowLabelFits: !L.lvlB || L.lvlB.fit.height + 10 <= L.lvlB.box.h,
        rowLabelWhole: !L.lvlB || (!L.lvlB.fit.truncated && L.lvlB.fit.lines.every(ln => ln.split(' ').every(wd => !wd || ctx.params.hierarchy.levels.join(' ').split(/\s+/).includes(wd)))),
        // each lens (raised, sweeping, resting) lies wholly inside its desk frame
        lensesInside: lensIn(L.lanes[0].stage, sa.semantic) && lensIn(L.lanes[1].stage, sb.semantic),

        layout: {C: L.C, Cd: L.Cd, f: L.f, px: r(L.px, 2), s: r(L.s, 3), Wd: r(L.Wd), Hd: r(L.Hd), stripY: r(L.stripBox.y), stripH: r(L.stripBox.h), lanes: L.lanes.map(l => [r(l.hdr.h), r(l.card.h)]), dw: r(ctx.design.w), dh: r(ctx.design.h)},
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
    slug: 'sources-01-contrast',
    title: 'Text and context — isolated vs contextual reading',
    titleEs: 'Texto y contexto — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Texto y contexto',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete reading desks (same book, article, rack, magnifier and timing), side by side on wide frames and stacked on square and tall ones. Only the reading scope differs: in A the lens stays raised on the key word; in B it is lowered, swept over the other occurrences of the word and laid down, and the book is tied to its row on the author’s rack. The identical supplied wording is printed once on a shared strip; each lane shows its attributed reading; a guide joins the lanes; no reading is marked correct.',
    tags: ['text', 'context', 'comparison', 'isolated reading', 'contextual reading', 'magnifier', 'book', 'article', 'editable hierarchy', 'paired'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/texto-y-contexto.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
