/**
 * LAW-0088 — Analogía de casos · inspect
 *
 * Storyboard (a registered tracing overlay on a light table, no hands):
 *  0.00–0.20 build       The state produced by the action: case B's tracing
 *                        sheet lies registered on case A's pegs. Shared
 *                        features coincide (overprinted ink, "="), differing
 *                        variants stand side by side ("≠"), a feature only one
 *                        case has keeps a dashed "single" glyph. The rule card
 *                        (text as supplied) threads each feature it names and
 *                        its caption says, as supplied, whether that feature
 *                        reads as a relevant similarity or difference.
 *  0.20–0.45 isolate     The focus feature's slot pair is outlined and a lens
 *                        — a real second copy of the overlay drawn at the SAME
 *                        coordinates — lifts it out of the dimmed context into
 *                        the free space (cone lines keep it tied to its
 *                        source). The single editorial note appears beside the
 *                        lens: case B's value before the substitution.
 *  0.45–0.75 substitute  Only case B's value of that feature is replaced
 *                        (beforeValue → afterValue). Inside the lens only its
 *                        local geometry changes: the old label lifts away, the
 *                        badge folds, B's print slides to where the new value
 *                        belongs — onto A's print when the supplied texts are
 *                        identical (they overprint, "="), or beside it when
 *                        they differ ("≠") — and a dashed footprint keeps the
 *                        old position traceable. The note strikes the old value
 *                        through (still readable) and adds the new one.
 *  0.75–1.00 return      The lens closes back onto its source while the context
 *                        print makes the same short move; the rule card's
 *                        caption for that feature changes if its reading
 *                        changed, and a "datum changed" marker stays on the
 *                        slot, joined to the note. Every other feature stays
 *                        untouched. Seeking back restores the old datum exactly.
 * Wide boxes: light table left, rule card / lens / note in the right column.
 * Tall boxes: rule card on top, light table, lens and note below. Square:
 * light table top-left, rule card and note top-right, lens across the bottom.
 * Legal content: fictional, jurisdiction unspecified; values, relevance and
 * rule text are supplied by the author — the scene never decides that a rule
 * applies, that the cases are alike in law, or any outcome.
 * @module animations/reasoning/LAW-0088
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, int, oneOf, obj} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {
  analogyFields, ANALOGY_STRINGS, resolveAnalogy, inks, sheetGeometry, badgeSpot, featureRing, relBadge, glyphOf, ruleCard, lightTable,
  overlayNodes, overlayFrame, pictogram, printNode, allTexts, planLanes, laneWire, changeMarker, boxGap,
} from './kits/analogia-de-casos.js';

const ID = 'LAW-0088';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  head: [0, 0.07], reveal: [0.03, 0.14], threads: [0.08, 0.16], caps: [0.14, 0.19],
  src: [0.2, 0.25], open: [0.23, 0.4], before: [0.13, 0.2],
  lensSub: [0.47, 0.72], strike: [0.47, 0.53], after: [0.65, 0.72],
  // the context slot takes the new datum (in the undimmed source hole) while
  // the lens still shows it, THEN the lens fades out as it shrinks onto it
  close: [0.83, 0.9], ctxSub: [0.75, 0.83], noteMove: [0.88, 0.93], capOut: [0.89, 0.915], capIn: [0.915, 0.95], marker: [0.92, 0.96], leader: [0.94, 0.98],
};
/** Stages of one substitution, as fractions of its local progress q. */
const Q = {labOut: [0, 0.22], mergeOut: [0.08, 0.24], badgeOut: [0.1, 0.28], move: [0.24, 0.7], ghost: [0.3, 0.6], mergeIn: [0.64, 0.86], badgeIn: [0.72, 0.96], labIn: [0.72, 0.96]};
const M = 26;
const LP = 30;

const sceneSchema = {
  ...analogyFields,
  focusTarget: oneOf('Datum enlarged and substituted: the new case’s (B) value of the focus feature', ['newCaseValue']),
  focusFeature: int('Feature (index in `facts`) whose slot the lens enlarges', 0, 4),
  beforeValue: str('Case B’s value of the focus feature before the substitution (replaces facts[focusFeature].b; empty = absent from case B)', 64),
  afterValue: str('Case B’s value after the substitution (text identical to case A’s = the two prints coincide)', 64),
  detailGeometry: obj('Lens geometry', {zoom: num('Maximum magnification of the lens (reduced when the free space is smaller)', 1.5, 4)}),
  contextLabels: obj('Labels of the context view', {
    context: str('Context caption (empty = built-in wording)', 80),
    marker: str('Label of the changed-datum marker (empty = built-in wording)', 40),
  }),
};

const defaultParams = {
  cases: {a: {name: 'Case Harbour', note: 'earlier case · fictional'}, b: {name: 'Case Linden', note: 'new case · fictional'}},
  facts: [
    {icon: 'ladder', a: 'Ladder lent by a neighbour', b: 'Ladder lent by a neighbour', relevant: true},
    {icon: 'note', a: 'Loan noted on a slip', b: 'Loan noted on a slip', relevant: false},
    {icon: 'calendar', a: 'Return date agreed', b: 'No return date agreed', relevant: true},
    {icon: 'rain', a: 'Left outside in the rain', b: '', relevant: false},
  ],
  rules: [{name: 'Rule R (illustrative)', text: '“Where an item is lent and a return date is agreed, …”'}],
  issues: ['Is Case Linden alike in the features Rule R names?'],
  assumptions: ['Facts taken as each account supplies them'],
  focusTarget: 'newCaseValue',
  focusFeature: 2,
  beforeValue: 'No return date agreed',
  afterValue: 'Return date agreed',
  detailGeometry: {zoom: 2.4},
  contextLabels: {context: '', marker: ''},
};

/** Caption of a rule socket for a feature kind (descriptive, as supplied). */
function capFor(t, kind) {
  if (kind === 'shared') return `${t.relevantSimilarity} · ${t.asSupplied}`;
  if (kind === 'differs' || kind === 'only-a' || kind === 'only-b') return `${t.relevantDifference} · ${t.asSupplied}`;
  return null;
}
const capKey = kind => (kind === 'shared' ? 'similarity' : kind === 'none' ? null : 'difference');

/** Pictogram case B prints for the focus feature in a state. */
const iconOfK = (F, kind) => (kind === 'shared' ? F.icon : F.iconB);

/** Where case B prints the focus feature for a kind ('L' | 'R' | null). */
const spotB = kind => (kind === 'shared' ? 'L' : kind === 'differs' || kind === 'only-b' ? 'R' : null);

/**
 * Layout of the scene; `capCap` caps every generic caption (design units).
 * @param {any} ctx
 * @param {number} capCap
 */
function layoutWith(ctx, capCap) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const I = inks(th);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  // text hierarchy bookkeeping: author content vs generic captions (px-scaled
  // design units); F16 = 16 px at 1080p, the floor for any author text
  const contentSizes = [];
  const captionSizes = [];
  const capSz = v => Math.min(v, capCap);
  const k = Math.min(p.focusFeature, p.facts.length - 1);
  const facts0 = p.facts.map((f, i) => (i === k ? {...f, b: p.beforeValue} : f));
  const facts1 = p.facts.map((f, i) => (i === k ? {...f, b: p.afterValue} : f));
  const R0 = resolveAnalogy(facts0, {pairs: [k]});
  const R1 = resolveAnalogy(facts1, {pairs: [k]});
  const F0 = R0.features[k], F1 = R1.features[k];
  const kind0 = F0.kind, kind1 = F1.kind;

  // design units that render as 20 px on a 1080-px frame side (key text floor)
  const fitD = fitDesign(ctx.view, D.w, D.h);
  const PX = 20 * Math.min(ctx.view.width, ctx.view.height) / (1080 * fitD.scale);
  const F16 = PX * 0.82;
  // the whole frame in design units (the lens dims all of it, not a panel)
  const canvas = {x: -fitD.ox / fitD.scale, y: -fitD.oy / fitD.scale, w: ctx.view.width / fitD.scale, h: ctx.view.height / fitD.scale};
  // landscape and square boxes (the square's safe box is wide too) put the
  // light table on the left; portrait stacks card, light table and note
  const wide = shape === 'landscape' || shape === 'square';

  // --- header: context caption + issue / assumption (text on the background)
  const swL = shape === 'square' ? clamp((D.w - 2 * M) * 0.53 - 2 * LP, 560, 780) : clamp((D.w - 2 * M) * 0.5 - 2 * LP, 620, 1000);
  const headW = wide ? swL + 2 * LP : D.w - 2 * M;
  const head = [];
  let headH = 0;
  if (showAll) {
    const ctxText = p.contextLabels.context || t.overlayContext;
    const supplied = Boolean(p.contextLabels.context);
    const hs = supplied ? Math.max(27, PX * 1.2) : capSz(Math.max(27, PX * 1.2));
    const f1 = ctx.fit(ctxText, {maxWidth: headW, size: hs, minSize: Math.min(hs, Math.max(F16, PX)), maxLines: 3, weight: 700});
    (supplied ? contentSizes : captionSizes).push(f1.size);
    head.push({fit: f1, y: 0, fill: th.fg});
    headH = f1.height + 8;
    const extra = [];
    if (p.issues.length) extra.push(`${t.issue}: ${p.issues[0]}`);
    if (p.assumptions.length) extra.push(...p.assumptions.map(a => `${t.assumption}: ${a}`));
    if (extra.length) {
      // (every supplied issue and assumption, whole: more lines, never cut)
      const f2 = ctx.fit(extra.join(' · '), {maxWidth: headW, size: Math.max(22, PX), minSize: F16, maxLines: 8, weight: 500});
      contentSizes.push(f2.size);
      head.push({fit: f2, y: headH, fill: th.fgSoft});
      headH += f2.height + 8;
    }
    headH += 14;
  }

  // --- rule card: one socket per relevant feature; captions as supplied
  const rule = p.rules[0];
  const relevant = R0.features.filter(F => F.relevant && (F.kind !== 'none' || F.i === k));
  const capOf = F => (F.i === k ? null : capFor(t, F.kind));
  const capText0 = F => (F.i === k ? capFor(t, kind0) : capOf(F));
  const capText1 = F => (F.i === k ? capFor(t, kind1) : capOf(F));
  const longest = F => {
    const a = capText0(F) || '', b = capText1(F) || '';
    return ctx.measure(a, 20, 700, 'sans') >= ctx.measure(b, 20, 700, 'sans') ? a : b;
  };
  const cardSize = Math.max(23, PX * 1.12);
  const mkCard = (w, sockets, align, size0) => {
    let c = null;
    for (const size of [size0, size0 * 0.9, size0 * 0.82].map(v => Math.max(v, F16 / 0.9))) {
      c = ruleCard(ctx, {prefix: 'rule', w, name: rule.name || t.ruleCard, text: rule.text, sockets: sockets.map(F => ({icon: F.icon, f: F.i})), captioned: sockets.map(F => F.i), captionTexts: sockets.map(longest), size, textMin: F16, maxLines: 6, socketR: 28, socketsAlign: align});
      if (c.h <= (shape === 'portrait' ? 250 : 300)) break;
    }
    return c;
  };

  // --- stage plan per shape. Wide: light table left (half the width), rule
  // card top-right, note bottom-right. Tall and square: rule card on top,
  // the light table across the full width, the note along the bottom. The
  // lens opens OVER the dimmed context, away from its source, so no area is
  // left empty for it outside the isolate / substitute beats.
  let lt, sw, sh, colX, colW, cardPos, cardW, align;
  const nT = relevant.length;
  const turnRoom = 30 + nT * 36;
  if (wide) {
    sw = swL;
    colX = M + sw + 2 * LP + 44;
    colW = D.w - M - colX;
    cardW = Math.min(colW, 900);
    align = 'left';
    cardPos = {x: colX, y: M + 36};
  } else {
    // (room right of the light table for the two thread lanes)
    sw = D.w - 2 * M - 2 * LP - 44;
    cardW = D.w - 2 * M;
    align = 'right';
    cardPos = {x: M, y: M + headH + 36};
  }
  // single editorial note: B's value before → after (+ the marker label beside / above it)
  const noteW0 = wide ? Math.min(colW, 760) : shape === 'square' ? Math.min(D.w - 2 * M - 380, 900) : Math.min(D.w - 2 * M, 820);
  const note = buildNote(ctx, {w: noteW0, before: F0.b, after: F1.b, kind0, kind1, I, size: Math.max(25, PX * 1.05), minSize: F16, icons: {before: F0.b ? iconOfK(F0, kind0) : null, after: F1.b ? iconOfK(F1, kind1) : null}});
  const noteW = note.w;
  const markerText = p.contextLabels.marker || t.datumChanged;
  const mkS = p.contextLabels.marker ? Math.max(21, PX) : capSz(Math.max(21, PX));
  const mkF = showKey && markerText ? ctx.fit(markerText, {maxWidth: Math.max(160, noteW - 80), size: mkS, minSize: Math.min(mkS, F16), maxLines: 2, weight: 700}) : null;
  if (mkF) (p.contextLabels.marker ? contentSizes : captionSizes).push(mkF.size);
  if (note.sizes) contentSizes.push(...note.sizes);
  const mkH = mkF ? mkF.height + 16 : 0;
  const mkW0 = mkF ? mkF.width + 64 : 0;
  // tall: marker label above the note; square: beside it (to its left)
  const mkSide = shape === 'square' && mkF && D.w - 2 * M - noteW - mkW0 - 16 >= 0;
  const noteBand = wide ? 0 : note.h + (mkF && !mkSide ? mkH + 8 : 0) + 22;
  // provisional card (feature order) to know its height
  let card = mkCard(cardW, relevant, align, cardSize);
  if (wide) {
    const top = M + headH;
    sh = Math.max(380, D.h - M - top - 2 * LP);
    lt = {x: M, y: top, w: sw + 2 * LP, h: sh + 2 * LP};
  } else {
    const ltY = cardPos.y + card.h + turnRoom + 12;
    sh = Math.max(300, D.h - M - ltY - 2 * LP - noteBand);
    lt = {x: M, y: ltY, w: sw + 2 * LP, h: sh + 2 * LP};
  }
  const mkGeoAt = (hh, floor) => sheetGeometry(ctx, {
    w: sw, h: hh, units: R0.units, texts: allTexts(R0, [p.afterValue]),
    names: {a: p.cases.a.name, b: p.cases.b.name, na: p.cases.a.note, nb: p.cases.b.note},
    nameSize: Math.min(30, Math.max(sw * 0.042, PX)), nameMin: F16, nameLines: 4,
    noteSize: Math.max(Math.min(30, Math.max(sw * 0.042, PX)) * 0.72, Math.min(Math.min(30, Math.max(sw * 0.042, PX)), PX * 1.02)), noteMin: F16, noteLines: 2,
    size: Math.max(24, PX * 1.05), minSize: floor, maxLines: 3, showLabels: showKey, showNames: showKey, cols: [2, 3, 4], wordSafe: true,
    // the features the rule names sit at the right end of their row: their
    // threads enter from the sheet's right edge without running along the row
    rowEnd: {side: 'right', first: [k, ...relevant.map(F => F.i).filter(i => i !== k)]},
  });
  // facts first at the 19-px floor; towards 16 px (up to 4 lines) only when
  // they would otherwise be cut
  const mkGeo = hh => {
    const g1 = mkGeoAt(hh, Math.max(F16, PX * 0.95));
    return g1.truncated ? mkGeoAt(hh, F16) : g1;
  };
  const geo = mkGeo(sh);
  if (showKey) {
    contentSizes.push(geo.labelSize);
    if (geo.names) ['a', 'b', 'na', 'nb'].forEach(k2 => { if (geo.names[k2]) contentSizes.push(geo.names[k2].size); });
  }
  const aAt = {x: lt.x + LP, y: lt.y + LP};
  const W2 = q => ({x: aAt.x + q.x, y: aAt.y + q.y});
  const u = geo.unitCells[k];

  // --- rule threads: socket → turn → a lane beside the sheet → the ring.
  // A feature at the right end of its row is entered from the side at the
  // ring's mid-height; otherwise along its ground line. The socket order,
  // lane order and exit side (down from the card, or out of the sockets'
  // side when the sockets are stacked) are chosen so that the two threads
  // neither cross nor run as a close pair nor pass through the other socket.
  const ringOf = F => featureRing(geo, F.i, geo.unitCells[F.i] && geo.unitCells[F.i].pair ? 'differs' : F.kind);
  const targets = relevant.filter(F => geo.unitCells[F.i]).map(F => {
    const cu = geo.unitCells[F.i];
    const ring = ringOf(F);
    const side = cu.last;
    // not at the end of its row: the thread runs in the free band ABOVE the
    // row (under the header rule / the previous row's labels) and drops onto
    // the ring's top, never along the row under other features
    const band = cu.row === 0 ? geo.headerTop + geo.header + 4 : geo.rows[cu.row].y + 4;
    return {key: String(F.i), F, ring, side, gy: side ? aAt.y + ring.y + ring.h / 2 : aAt.y + Math.min(band, ring.y - 8), ringX: aAt.x + ring.x + ring.w - 2, topX: aAt.x + ring.x + ring.w / 2, topY: aAt.y + ring.y};
  });
  const seen = {};
  targets.forEach(tg => { const n = seen[r(tg.gy)] || 0; seen[r(tg.gy)] = n + 1; tg.gy += n * 12; });
  const sheetRight = aAt.x + sw;
  const cardBottom0 = cardPos.y + card.h;
  const laneXs = [sheetRight + 12, sheetRight + LP + 30];
  const turnStep = 36;
  const perms = targets.length === 2 ? [[0, 1], [1, 0]] : [[0]];
  const sampleL = pts => {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a0 = pts[i - 1], b0 = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b0.x - a0.x, b0.y - a0.y) / 6));
      for (let q = 0; q <= n; q++) out.push({x: a0.x + (b0.x - a0.x) * q / n, y: a0.y + (b0.y - a0.y) * q / n});
    }
    return out;
  };
  const gapOf = (P1, P2) => {
    const A1 = sampleL(P1), B1 = sampleL(P2);
    let m = Infinity;
    for (const q of A1) for (const q2 of B1) m = Math.min(m, Math.hypot(q.x - q2.x, q.y - q2.y));
    return m;
  };
  let bestT = null;
  for (const sockP of perms) {
    const orderT = sockP.map(i => targets[i]);
    const c = mkCard(cardW, orderT.map(tg => tg.F), align, cardSize);
    const stacked = c.sockets.length > 1 && Math.abs(c.sockets[0].x - c.sockets[1].x) < 1;
    for (const exitSide of stacked && wide ? [true, false] : [false]) {
      for (const laneP of perms) {
        for (const turnP of perms) {
          const routes = orderT.map((tg, i) => {
            const s0 = {x: cardPos.x + c.sockets[i].x, y: cardPos.y + c.sockets[i].y, r: c.sockets[i].r};
            const lane = laneXs[laneP[i]];
            const tail = tg.side ? [{x: lane, y: tg.gy}, {x: tg.ringX + 2, y: tg.gy}] : [{x: lane, y: tg.gy}, {x: tg.topX, y: tg.gy}, {x: tg.topX, y: tg.topY}];
            if (exitSide) return [{x: s0.x - s0.r - 1, y: s0.y}, {x: lane, y: s0.y}, ...tail];
            const turnY = cardBottom0 + 18 + turnP[i] * turnStep;
            return [{x: s0.x, y: s0.y + s0.r + 1}, {x: s0.x, y: turnY}, {x: lane, y: turnY}, ...tail];
          });
          let cost = routes.reduce((acc, pts) => acc + pts.slice(1).reduce((s2, q, j) => s2 + Math.hypot(q.x - pts[j].x, q.y - pts[j].y), 0), 0);
          let gap = Infinity;
          if (routes.length === 2) gap = gapOf(routes[0], routes[1]);
          // passing another socket counts as a near miss
          routes.forEach((pts, i) => c.sockets.forEach((so, j) => {
            if (j === i) return;
            gap = Math.min(gap, gapOf(pts, [{x: cardPos.x + so.x, y: cardPos.y + so.y}, {x: cardPos.x + so.x, y: cardPos.y + so.y}]) - so.r);
          }));
          if (gap < 30) cost += 1e5 + (30 - gap) * 100;
          if (!bestT || cost < bestT.cost) bestT = {cost, routes, card: c, orderT, gap};
        }
      }
    }
  }
  card = bestT.card;
  if (card.titleFit) contentSizes.push(card.titleFit.size);
  if (card.textFit) contentSizes.push(card.textFit.size);
  const ordered = bestT.orderT;
  const threads = ordered.map((tg, i) => ({key: tg.key, f: tg.F.i, si: i, pts: bestT.routes[i], c: laneWire(ctx, {name: `th${tg.F.i}`, pts: bestT.routes[i], color: th.ink, radius: 14})}));
  const threadMinGap = bestT.gap;
  // semantics: a thread passing through another feature's pictogram, label or socket
  const picBoxes = geo.cells.map(c => ({f: c.f, x: aAt.x + c.x + 10, y: aAt.y + c.pc.y - c.ps / 2, w: c.w - 20, h: c.label.y + 18 - (c.pc.y - c.ps / 2)}));
  const threadHits = threads.reduce((n, tr) => n + (sampleL(tr.pts).slice(2, -2).some(q => picBoxes.some(b => b.f !== tr.f && q.x > b.x + 3 && q.x < b.x + b.w - 3 && q.y > b.y + 3 && q.y < b.y + b.h - 3)
    || card.sockets.some((so, j) => j !== tr.si && Math.hypot(q.x - cardPos.x - so.x, q.y - cardPos.y - so.y) < so.r - 2)) ? 1 : 0), 0);
  const turnBottom = cardBottom0 + turnRoom;
  const rings = targets.map(tg => {
    const b = tg.ring;
    const len = 2 * (b.w + b.h);
    const d = roundRectPath(b.x, b.y, b.w, b.h, 16);
    return {f: tg.F.i, len, d, node: h('path', {name: `ring${tg.F.i}`, d, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-dasharray': `${r(len)} ${r(len + 20)}`, 'stroke-dashoffset': r(len), opacity: 0})};
  });

  // --- rule captions (the focus caption has a before and an after version)
  const captions = [];
  if (showKey) {
    ordered.forEach((tg, i) => {
      const slot = card.captionSlots[i];
      if (!slot) return;
      const s = card.sockets[i];
      const mk = (text, name) => {
        if (!text) return null;
        const cs = capSz(card.capSize);
        const f = ctx.fit(text, {maxWidth: slot.w, size: cs, minSize: Math.min(cs, F16), maxLines: 3, weight: 700});
        captionSizes.push(f.size);
        const x = align === 'right' ? cardPos.x + slot.x + slot.w : cardPos.x + slot.x;
        return {name, y: cardPos.y + s.y - f.height / 2, box: {x: align === 'right' ? x - f.width : x, y: cardPos.y + s.y - f.height / 2, w: f.width, h: f.height}, node: g({name, opacity: 0}, textBlock(f, {x, y: cardPos.y + s.y - f.height / 2, anchor: align === 'right' ? 'end' : 'start', fill: th.ink}))};
      };
      const F = tg.F;
      if (F.i === k) {
        captions.push({f: F.i, when: 'before', c: mk(capText0(F), `cap${F.i}b`)});
        if (capKey(kind1) !== capKey(kind0)) captions.push({f: F.i, when: 'after', c: mk(capText1(F), `cap${F.i}a`)});
        else if (captions.length) captions[captions.length - 1].when = 'always';
      } else captions.push({f: F.i, when: 'always', c: mk(capOf(F), `cap${F.i}`)});
    });
  }

  // --- light table, context overlay (focus feature drawn separately)
  const ltN = lightTable(ctx, {prefix: 'lt', ...lt, pegs: geo.holes.map(W2), cable: 'none'});
  const ov = overlayNodes(ctx, {prefix: 'cx', geo, R: R0, I, skip: [k]});
  const zv = overlayNodes(ctx, {prefix: 'lz', geo, R: R0, I, skip: [k]});

  // --- focus feature parts (sheet-local), shared by context and lens copies
  const iconOf = (F, kind) => (kind === 'shared' ? F.icon : F.iconB);
  const cellKey = key => (key ? u[key] : null);
  const sp0 = cellKey(spotB(kind0)), sp1 = cellKey(spotB(kind1));
  const labAt = (cell, text, dy = 0) => {
    if (!cell || !text || !showKey) return null;
    const fit = geo.fitLabel(text);
    return {fit, box: {x: cell.label.x - fit.width / 2, y: cell.label.y + dy, w: fit.width, h: fit.height}, node: textBlock(fit, {x: cell.label.x, y: cell.label.y, anchor: 'middle', fill: th.ink})};
  };
  const bKind = kind => kind === 'differs' || kind === 'only-b';
  const focusParts = P => {
    const aPr = F0.a ? printNode(ctx, geo, {name: `${P}A`, cell: u.L, icon: F0.icon, text: F0.a, ink: I.a.ink, soft: I.a.soft}) : null;
    const twoIcons = iconOf(F0, kind0) !== iconOf(F1, kind1);
    const ps = (sp0 || sp1 || u.L).ps;
    const bPic = sp0 || sp1 ? {
      shadow: h('ellipse', {name: `${P}Bsh`, cx: 0, cy: 0, rx: r(ps * 0.42), ry: 6, fill: I.b.ink, opacity: 0.18}),
      pic: g({name: `${P}B`},
        g({name: `${P}Bi0`}, pictogram(iconOf(F0, kind0), {s: ps, ink: I.b.ink, soft: I.b.soft})),
        twoIcons ? g({name: `${P}Bi1`, opacity: 0}, pictogram(iconOf(F1, kind1), {s: ps, ink: I.b.ink, soft: I.b.soft})) : null),
      twoIcons,
    } : null;
    const merged = (kind, name) => (kind === 'shared' ? g({name, opacity: 0}, printNode(ctx, geo, {name: `${name}p`, cell: u.L, icon: F0.icon, text: '', ink: I.m.ink, soft: I.m.soft, showText: false}).node) : null);
    const lab0 = bKind(kind0) ? labAt(sp0, F0.b) : null;
    const lab1 = bKind(kind1) ? labAt(sp1, F1.b) : null;
    const bs0 = badgeSpot(geo, k, kind0), bs1 = badgeSpot(geo, k, kind1);
    const bd = (kind, sp, name) => (kind === 'none' ? null : relBadge(ctx, {name, kind: glyphOf(kind), x: sp.x, y: sp.y, rad: kind === 'shared' ? 15 : 18, color: kind === 'shared' ? I.m.ink : th.ink, opacity: 0}));
    const changedSpot = sp0 && (sp0 !== sp1 || F0.b !== F1.b);
    const ghost = changedSpot && P === 'fz' ? h('path', {name: `${P}ghost`, d: roundRectPath(sp0.pc.x - sp0.ps / 2 - 8, sp0.pc.y - sp0.ps / 2 - 8, sp0.ps + 16, sp0.ps + 16, 14), fill: 'none', stroke: I.b.ink, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0}) : null;
    return {aPr, bPic, lab0, lab1, bs0, bs1, ghost, m0: merged(kind0, `${P}M0`), m1: merged(kind1, `${P}M1`), g0: bd(kind0, bs0, `${P}G0`), g1: bd(kind1, bs1, `${P}G1`)};
  };
  const buildFocus = P => {
    const fp = focusParts(P);
    fp.node = g(null,
      fp.aPr && fp.aPr.node,
      fp.ghost,
      fp.bPic && fp.bPic.shadow,
      fp.bPic && fp.bPic.pic,
      fp.m0, fp.m1,
      fp.lab0 && g({name: `${P}L0`}, fp.lab0.node),
      fp.lab1 && g({name: `${P}L1`, opacity: 0}, fp.lab1.node),
      fp.g0, fp.g1,
    );
    return fp;
  };
  const fc = buildFocus('fc');
  const fz = buildFocus('fz');

  // --- the lens: source = the focus slot pair; dest = the free area
  const labH = showKey ? Math.max(0, ...[F0.a, F0.b, F1.b].filter(Boolean).map(tx => geo.fitLabel(tx).height)) : 0;
  const cellText = c => {
    const F = R0.features[c.f];
    if (!showKey || !F) return 0;
    const txs = [F.a, F.b].filter(Boolean);
    return txs.length ? Math.max(...txs.map(tx => geo.fitLabel(tx).height)) : 0;
  };
  const rowAbove = geo.cells.filter(c => c.groundY < u.L.groundY - 1).reduce((m, c) => Math.max(m, c.label.y + cellText(c)), geo.bodyTop - 6);
  const srcTop = Math.max(u.L.pc.y - u.L.ps / 2 - 30, rowAbove + 6);
  const srcBot = u.L.label.y + labH + 12;
  const src = {x: aAt.x + u.L.x + 4, y: aAt.y + srcTop, w: u.R.x + u.R.w - u.L.x - 8, h: srcBot - srcTop};
  const mkW = mkW0;
  let notePos, holdArea = null;
  let mkPos = null;
  if (wide) notePos = {x: colX + colW - noteW, y: D.h - M - note.h};
  else if (shape === 'square') notePos = {x: D.w - M - noteW, y: D.h - M - note.h};
  else notePos = {x: (D.w - noteW) / 2, y: D.h - M - note.h};
  // the note and its marker label (tall: above it; otherwise beside it when there is room)
  const noteZone = wide
    ? {x: colX, y: notePos.y - (mkF ? mkH + 8 : 0), w: colW, h: D.h - M - notePos.y + (mkF ? mkH + 8 : 0)}
    : {x: M, y: notePos.y - (mkF && !mkSide ? mkH + 8 : 0), w: D.w - 2 * M, h: D.h - M - notePos.y + (mkF && !mkSide ? mkH + 8 : 0)};
  // --- lens dest: over the dimmed context, in the region around the source
  // (right, below, above or left of it) that allows the largest
  // magnification, clear of the source and of the note
  const gapL = 26;
  const scx = src.x + src.w / 2, scy = src.y + src.h / 2;
  const inter = (a1, b1) => a1.x < b1.x + b1.w && a1.x + a1.w > b1.x && a1.y < b1.y + b1.h && a1.y + a1.h > b1.y;
  const regions = [
    {key: 'right', x: src.x + src.w + gapL, y: M, w: D.w - M - (src.x + src.w + gapL), h: D.h - 2 * M},
    {key: 'below', x: M, y: src.y + src.h + gapL, w: D.w - 2 * M, h: D.h - M - (src.y + src.h + gapL)},
    {key: 'above', x: M, y: M, w: D.w - 2 * M, h: src.y - gapL - M},
    {key: 'left', x: M, y: M, w: src.x - gapL - M, h: D.h - 2 * M},
  ].flatMap(rg => {
    if (rg.w <= 0 || rg.h <= 0) return [];
    if (!inter(rg, noteZone)) return [rg];
    // trim the note away: either cut the region's bottom or its right side
    const out = [];
    if (noteZone.y - gapL > rg.y) out.push({...rg, h: noteZone.y - gapL - rg.y});
    if (noteZone.x - gapL > rg.x) out.push({...rg, w: noteZone.x - gapL - rg.x});
    return out;
  });
  const zOf = rg => Math.min(p.detailGeometry.zoom, rg.w / src.w, rg.h / src.h);
  let area = null;
  for (const rg of regions) if (!area || zOf(rg) > zOf(area) + 0.02) area = rg;
  if (!area) area = {key: 'below', x: M, y: src.y + src.h + gapL, w: D.w - 2 * M, h: src.h};
  const z = Math.max(1, zOf(area));
  const dw = src.w * z, dh = src.h * z;
  const dest = {
    x: area.key === 'right' ? area.x : area.key === 'left' ? area.x + area.w - dw : clamp(scx - dw / 2, area.x, area.x + area.w - dw),
    y: area.key === 'below' ? area.y : area.key === 'above' ? area.y + area.h - dh : clamp(scy - dh / 2, area.y, area.y + area.h - dh),
    w: dw, h: dh,
  };
  if (area.key === 'right') dest.x = area.x + Math.max(0, Math.min(60, (area.w - dw) / 2));
  const content = g(null,
    g({transform: T(aAt.x, aAt.y)},
      h('rect', {x: -8, y: -8, width: sw + 16, height: sh + 16, fill: '#fcf8ea'}),
      zv.sheetA, zv.sheetB, zv.overlay, fz.node,
      rings.map(rg => h('path', {d: rg.d, fill: 'none', stroke: th.ink, 'stroke-width': 3.5}))),
    threads.map(tr => h('path', {d: tr.c.d, fill: 'none', stroke: th.ink, 'stroke-width': 3.2, 'stroke-linejoin': 'round'})));
  const Ln = lens(ctx, {name: 'lens', source: src, dest, content, frame: canvas, color: th.accent3});
  // context texts the opaque lens window covers while it is open (they are
  // hidden while covered, so no text is ever drawn under the window's text)
  const coverTexts = [];
  const addCT = (name, box) => { if (box && box.w > 0 && box.h > 0) coverTexts.push({name, box}); };
  const Wb = b => ({x: aAt.x + b.x, y: aAt.y + b.y, w: b.w, h: b.h});
  head.forEach((hd, i) => addCT(i === 0 ? 'headCtx' : 'headIssue', {x: M, y: M + hd.y, w: hd.fit.width, h: hd.fit.height}));
  if (card.titleFit) addCT('rule-title', {x: cardPos.x + 24, y: cardPos.y + 26, w: card.titleFit.width, h: card.titleFit.height});
  if (card.textFit && card.titleFit) addCT('rule-text', {x: cardPos.x + 24, y: cardPos.y + 26 + card.titleFit.height + 12, w: card.textFit.width, h: card.textFit.height});
  captions.forEach(c => { if (c.c) addCT(c.c.name, c.c.box); });
  [...ov.aNodes.map(n => ['pa', n]), ...ov.bNodes.map(n => ['pb', n]), ...ov.through.map(n => ['ot', n])].forEach(([pfx, n]) => { if (n.labBox) addCT(`cx${pfx}${n.f}-lab`, Wb(n.labBox)); });
  if (geo.names) {
    for (const [key, sb, nf, tf] of [['A', ov.sA, geo.names.a, geo.names.na], ['B', ov.sB, geo.names.b, geo.names.nb]]) {
      addCT(`cx${key}-name`, Wb({x: sb.nameX, y: geo.headerTop, w: nf.width, h: nf.height}));
      if (tf) addCT(`cx${key}-note`, Wb({x: sb.nameX, y: geo.headerTop + nf.height + 6, w: tf.width, h: tf.height}));
    }
    addCT('cxotName', Wb({x: ov.sA.nameX, y: geo.headerTop, w: Math.max(geo.names.a.width, geo.names.na ? geo.names.na.width : 0), h: geo.names.a.height + (geo.names.na ? geo.names.na.height + 6 : 0)}));
  }
  if (showKey) {
    for (const [key, sb] of [['A', ov.sA], ['B', ov.sB]]) addCT(`cx${key}-letter`, Wb({x: sb.badge.x - sb.badge.r, y: sb.badge.y - sb.badge.r, w: 2 * sb.badge.r, h: 2 * sb.badge.r}));
    addCT('cxotBadge', Wb({x: ov.sA.badge.x - ov.sA.badge.r, y: ov.sA.badge.y - ov.sA.badge.r, w: 2 * ov.sA.badge.r, h: 2 * ov.sA.badge.r}));
  }
  if (fc.aPr && fc.aPr.labBox) addCT('fcA-lab', Wb(fc.aPr.labBox));
  if (fc.lab0) addCT('fcL0', Wb(fc.lab0.box));
  if (fc.lab1) addCT('fcL1', Wb(fc.lab1.box));
  // wide boxes: once the lens has closed, the note (with its marker label)
  // rises into the free middle of the right column, larger, next to the
  // context it annotates; tall / square boxes keep it on the bottom band
  let noteHold = {x: notePos.x, y: notePos.y, s: 1};
  if (wide) {
    holdArea = {x: colX, y: turnBottom + 24, w: colW, h: D.h - M - (turnBottom + 24)};
    const needSide = mkF ? mkW + 16 : 0;
    const sideFits = mkF && holdArea.w - needSide >= noteW;
    const sN = clamp(Math.min(1.3, (holdArea.w - 20 - (sideFits ? needSide : 0)) / noteW, (holdArea.h - (sideFits ? 0 : mkH) - 30) / note.h), 1, 1.3);
    noteHold = {x: holdArea.x + (holdArea.w - noteW * sN) / 2, y: holdArea.y + (holdArea.h - note.h * sN + (sideFits ? 0 : mkH + 10)) / 2, s: sN};
    if (sideFits) noteHold.x = clamp(noteHold.x, holdArea.x + needSide, holdArea.x + holdArea.w - noteW * sN);
    if (mkF) {
      const sideX = noteHold.x - mkW - 16;
      mkPos = sideFits && sideX >= holdArea.x - 1 ? {x: sideX, y: noteHold.y + (note.h * sN - mkH) / 2, side: true} : {x: noteHold.x + (noteW * sN - mkW) / 2, y: noteHold.y - mkH - 10, side: false};
    }
  } else if (mkF) {
    mkPos = mkSide ? {x: notePos.x - mkW - 16, y: notePos.y + (note.h - mkH) / 2, side: true} : {x: notePos.x + (noteW - mkW) / 2, y: notePos.y - mkH - 8, side: false};
  }

  // --- changed-datum marker: a free corner of the slot ring (clear of prints and labels)
  // (the dashed slot outline encloses the slot's labels too, so no label
  // spills past it and the marker never lands on one)
  const ringK = (() => {
    const rk = featureRing(geo, k, 'differs');
    const boxes = [rk];
    [[u.L, F0.a], [sp1, bKind(kind1) ? F1.b : '']].forEach(([c, tx]) => {
      if (!c || !tx || !showKey) return;
      const f = geo.fitLabel(tx);
      boxes.push({x: c.label.x - f.width / 2 - 6, y: rk.y, w: f.width + 12, h: c.label.y + f.height + 4 - rk.y});
    });
    const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
    return {x: x0, y: y0, w: Math.max(...boxes.map(b => b.x + b.w)) - x0, h: Math.max(...boxes.map(b => b.y + b.h)) - y0};
  })();
  const occupied = [];
  geo.cells.forEach(c => {
    if (c.f === k) return;
    occupied.push({x: c.pc.x - c.ps / 2, y: c.pc.y - c.ps / 2, w: c.ps, h: c.ps});
    occupied.push({x: c.label.x - c.label.w / 2, y: c.label.y, w: c.label.w, h: cellText(c) || labH || 20});
  });
  // the focus feature's own labels (both states) and the thread ends stay visible
  // (only what is visible in the final hold, when the marker appears)
  [[u.L, F0.a], [sp1, bKind(kind1) ? F1.b : '']].forEach(([c, tx]) => {
    if (!c || !tx || !showKey) return;
    const f = geo.fitLabel(tx);
    occupied.push({x: c.label.x - f.width / 2, y: c.label.y, w: f.width, h: f.height});
  });
  // the leader also keeps off the focus slot's own prints (final state)
  const focusPics = [u.L, sp1].filter(Boolean).map(c => ({x: c.pc.x - c.ps / 2, y: c.pc.y - c.ps / 2, w: c.ps, h: c.ps}));
  // (a wide margin: the leader never runs just under or beside a label)
  const occW = [...occupied, ...focusPics].map(o => ({x: aAt.x + o.x - 12, y: aAt.y + o.y - 12, w: o.w + 24, h: o.h + 34}));
  // the threads' runs over and beside the sheet stay clear of the marker
  threads.forEach(tr => sampleL(tr.pts).forEach((q, i) => { if (i % 3 === 0) occupied.push({x: q.x - aAt.x - 6, y: q.y - aAt.y - 6, w: 12, h: 12}); }));
  const tgt = mkPos ? (mkPos.side ? {x: mkPos.x, y: mkPos.y + mkH / 2} : {x: mkPos.x + mkW / 2, y: mkPos.y}) : {x: noteHold.x + noteW * noteHold.s / 2, y: noteHold.y};
  const noteC = {x: tgt.x - aAt.x, y: tgt.y - aAt.y};
  const rx0 = ringK.x - 8, ry0 = ringK.y - 8, rw = ringK.w + 16, rh = ringK.h + 16;
  const corners = [
    {x: rx0 + rw, y: ry0 + rh / 2}, {x: rx0 + rw, y: ry0}, {x: rx0, y: ry0}, {x: rx0 + rw, y: ry0 + rh},
    {x: rx0, y: ry0 + rh}, {x: rx0, y: ry0 + rh / 2}, {x: rx0 + rw / 2, y: ry0},
  ].map((c, i) => ({...c, d: Math.hypot(c.x - noteC.x, c.y - noteC.y) + i * 40}));
  const mR = 17;
  const free = c => !occupied.some(o => boxGap(o, {x: c.x - mR, y: c.y - mR, w: 2 * mR, h: 2 * mR}) < 4) && c.x - mR > 4 && c.x + mR < sw - 4 && c.y - mR > geo.bodyTop - 10 && c.y + mR < sh - 4;
  // marker + leader: the nearest free corner whose leader (straight, or one
  // elbow) reaches the note's marker label without crossing a print or label
  // (the note itself, at its hold position, is an obstacle too)
  occW.push({x: noteHold.x - 4, y: noteHold.y - 4, w: noteW * noteHold.s + 8, h: note.h * noteHold.s + 8});
  const clean = pts => pts.every((q, i) => i === 0 || !occW.some(o => segHitsBox(pts[i - 1], q, o)));
  // a free band along the sheet's bottom edge, under the last labels
  const lastLab = geo.cells.filter(c => c.groundY >= u.L.groundY - 1).reduce((m, c) => Math.max(m, c.label.y + (cellText(c) || labH || 20)), u.L.groundY);
  const bandY = Math.min(sh - 9, lastLab + 14);
  const band = bandY < sh - 3 && bandY > lastLab + 6 ? aAt.y + bandY : null;
  const chip = mkPos ? {x: mkPos.x, y: mkPos.y, w: mkW, h: mkH} : {x: noteHold.x, y: noteHold.y, w: noteW * noteHold.s, h: note.h * noteHold.s};
  const routesFor = c => {
    const cw = W2(c);
    const left = {x: chip.x, y: chip.y + chip.h / 2};
    const top = {x: clamp(cw.x, chip.x + 24, chip.x + chip.w - 24), y: chip.y};
    const out = [];
    if (chip.x > lt.x + lt.w + 16) {
      out.push([cw, left], [cw, {x: cw.x, y: left.y}, left]);
      if (band !== null) {
        const xr = (lt.x + lt.w + chip.x) / 2;
        out.push([cw, {x: cw.x, y: band}, {x: xr, y: band}, {x: xr, y: left.y}, left]);
      }
    }
    out.push([cw, top], [cw, {x: top.x, y: cw.y}, top]);
    // down beside the slot, across just above the chip, then into its top
    if (top.y - 18 > cw.y + mR + 8) {
      out.push([cw, {x: cw.x, y: top.y - 18}, {x: top.x, y: top.y - 18}, top]);
      // out to the light table's frame first, down it, then across above the chip
      for (const fx of [aAt.x + sw + LP * 0.55, aAt.x - LP * 0.55]) out.push([cw, {x: fx, y: cw.y}, {x: fx, y: top.y - 18}, {x: top.x, y: top.y - 18}, top]);
    }
    if (band !== null && top.y > band) out.push([cw, {x: cw.x, y: band}, {x: top.x, y: band}, top]);
    return out.filter(pts => pts.length === 2 || Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) > mR + 8);
  };
  const ok = corners.filter(free).sort((a, b) => a.d - b.d);
  let pick = null;
  for (const c of ok) {
    const rt = routesFor(c).find(clean);
    if (rt) { pick = {c, pts: rt}; break; }
  }
  // no clean route: no leader; the chip (same icon) reads as the marker's legend
  if (!pick) pick = {c: ok[0] || corners[0], pts: null};
  const markerW = W2(pick.c);
  const marker = changeMarker(ctx, {name: 'marker', x: markerW.x, y: markerW.y, rad: mR, color: th.accent3, opacity: 0});
  const ringMark = h('path', {name: 'ringMark', d: roundRectPath(aAt.x + ringK.x - 8, aAt.y + ringK.y - 8, ringK.w + 16, ringK.h + 16, 20), fill: 'none', stroke: th.accent3, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0});
  let leaderD = null;
  if (pick.pts) {
    const lp = pick.pts.slice();
    const l0 = Math.hypot(lp[1].x - lp[0].x, lp[1].y - lp[0].y) || 1;
    lp[0] = {x: lp[0].x + ((lp[1].x - lp[0].x) / l0) * (mR + 3), y: lp[0].y + ((lp[1].y - lp[0].y) / l0) * (mR + 3)};
    leaderD = lp.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  }
  const leaderClean = Boolean(pick.pts);

  return {
    R0, R1, k, kind0, kind1, F0, F1, geo, I, sw, sh, lt, aAt, ltN, ov, zv, fc, fz, sp0, sp1, src, dest, z, Ln, head, headW,
    coverTexts, threadMinGap, threadHits, card, cardPos, threads, captions, rings, note, notePos, noteHold, noteW, mkF, mkH, mkW, mkPos, marker, markerW, ringMark, leaderD, leaderClean, ringK,
    contentMin: Math.min(...contentSizes), captionMax: Math.max(0, ...captionSizes),
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  // Two passes: when a generic caption (context headline, rule captions,
  // marker label) would be larger than the smallest author-supplied text,
  // the layout is redone with the captions capped at that size.
  layout(ctx) {
    const L1 = layoutWith(ctx, Infinity);
    if (!(L1.captionMax > L1.contentMin + 0.01)) return L1;
    return layoutWith(ctx, L1.contentMin);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {aAt} = L;
    const headNodes = L.head.map((hd, i) => textBlock(hd.fit, {x: M, y: M + hd.y, fill: hd.fill, name: i === 0 ? 'headCtx' : 'headIssue'}));
    const noteNode = g({name: 'note', opacity: 0, transform: T(L.notePos.x, L.notePos.y)}, L.note.node);
    const mkNode = L.mkF ? g({name: 'mkLabel', opacity: 0},
      h('path', {d: roundRectPath(L.mkPos.x, L.mkPos.y, L.mkW, L.mkH, L.mkH / 2), fill: '#fff4d6', stroke: th.ink, 'stroke-width': 2}),
      changeMarker(ctx, {x: L.mkPos.x + 24, y: L.mkPos.y + L.mkH / 2, rad: 12, color: th.accent3}),
      textBlock(L.mkF, {x: L.mkPos.x + 46, y: L.mkPos.y + L.mkH / 2 - L.mkF.height / 2, fill: th.ink})) : null;
    return g(null,
      g({name: 'head', opacity: 0}, headNodes),
      L.ltN.node,
      g({transform: T(aAt.x, aAt.y)}, L.ov.sheetA, L.ov.sheetB, L.ov.overlay, L.fc.node, L.rings.map(rg => rg.node)),
      L.ltN.pegs,
      L.ringMark,
      g({transform: T(L.cardPos.x, L.cardPos.y)}, L.card.node),
      L.threads.map(tr => tr.c.node),
      L.captions.map(c => c.c && c.c.node),
      L.Ln.node,
      noteNode,
      L.leaderD && h('path', {name: 'leader', d: L.leaderD, fill: 'none', stroke: th.ink, 'stroke-width': 2.5, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round', opacity: 0}),
      L.marker,
      mkNode,
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    nodes.head = {opacity: r(seg(u, ...W.head), 3)};

    // --- context overlay revealed (B already registered on A's pegs)
    const q = seg(u, ...W.reveal);
    const bBox = {x: L.aAt.x, y: L.aAt.y, w: L.sw, h: L.sh};
    const ovC = overlayFrame(ctx, L.ov, {P: 'cx', geo: L.geo, aOrigin: L.aAt, bBox, landed: true, q, reduced});
    Object.assign(nodes, ovC.nodes);
    const ovZ = overlayFrame(ctx, L.zv, {P: 'lz', geo: L.geo, aOrigin: L.aAt, bBox, landed: true, q: 1, reduced: true});
    Object.assign(nodes, ovZ.nodes);

    // --- focus feature: context and lens copies
    const reveal0 = seg(u, W.reveal[0] + 0.03, W.reveal[1]);
    const qL = seg(u, ...W.lensSub);
    const qC = seg(u, ...W.ctxSub);
    const fzS = focusFrame(L, L.fz, 'fz', qL, 1, reduced, nodes, true);
    const fcS = focusFrame(L, L.fc, 'fc', qC, reveal0, reduced, nodes, false);

    // --- rule card threads and captions
    const threadP = L.threads.map((tr, i) => {
      const s0 = W.threads[0] + i * 0.012;
      const v = ease.inOutCubic(seg(u, s0, W.threads[1]));
      Object.assign(nodes, tr.c.frame(v));
      const rg = L.rings.find(x => x.f === tr.f);
      if (rg) {
        const rv = seg(u, W.threads[1] - 0.03, W.threads[1] + 0.03);
        nodes[`ring${rg.f}`] = {opacity: rv > 0 ? 1 : 0, 'stroke-dashoffset': r(rg.len * (1 - rv))};
      }
      return r(v, 3);
    });
    const capP = seg(u, ...W.caps);
    const capOut = seg(u, ...W.capOut), capIn = seg(u, ...W.capIn);
    let focusCaption = null;
    L.captions.forEach(c => {
      if (!c.c) return;
      let o = capP, dy = 0;
      if (c.when === 'before') { o = capP * (1 - capOut); dy = -12 * capOut; if (o > 0.5) focusCaption = 'before'; }
      if (c.when === 'after') { o = capIn; dy = 10 * (1 - capIn); if (o > 0.5) focusCaption = 'after'; }
      if (c.when === 'always' && c.f === L.k && o > 0.5) focusCaption = 'unchanged';
      nodes[c.c.name] = {opacity: r(o, 3), transform: dy ? T(0, dy) : ''};
    });

    // --- lens: source outline → open → hold → close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = u < W.close[0] ? open : 1 - close;
    Object.assign(nodes, L.Ln.frame(lp, lp));
    if (u >= W.close[0]) {
      const fo = r(clamp(1 - close * 3), 3);
      nodes['lens-win'] = {...nodes['lens-win'], opacity: fo};
      nodes['lens-coneA'] = {...nodes['lens-coneA'], opacity: fo};
      nodes['lens-coneB'] = {...nodes['lens-coneB'], opacity: fo};
      nodes['lens-src'] = {...nodes['lens-src'], opacity: fo};
    }
    // context texts under the (opaque) lens window are hidden while covered
    const winOp = u >= W.close[0] ? clamp(1 - close * 3) : 1;
    const Rw = lp > 0.001 && winOp > 0.3 ? {x: lerp(L.src.x, L.dest.x, lp), y: lerp(L.src.y, L.dest.y, lp), w: lerp(L.src.w, L.dest.w, lp), h: lerp(L.src.h, L.dest.h, lp)} : null;
    L.coverTexts.forEach(ct => {
      const b = ct.box;
      const ia = Rw ? Math.max(0, Math.min(b.x + b.w, Rw.x + Rw.w) - Math.max(b.x, Rw.x)) * Math.max(0, Math.min(b.y + b.h, Rw.y + Rw.h) - Math.max(b.y, Rw.y)) : 0;
      if (ia > 0.06 * b.w * b.h) nodes[ct.name] = {...(nodes[ct.name] || {}), opacity: 0};
      else if (!nodes[ct.name]) nodes[ct.name] = {opacity: 1};
    });
    const srcOn = seg(u, ...W.src);
    if (u < W.open[0]) nodes['lens-src'] = {opacity: r(srcOn, 3)};

    // --- note: before value → struck → after value (stays with the marker)
    const noteOn = seg(u, ...W.before);
    const nm = ease.inOutCubic(seg(u, ...W.noteMove));
    const nh = L.noteHold;
    const nx = lerp(L.notePos.x, nh.x, nm), ny = lerp(L.notePos.y + (reduced ? 0 : 14 * (1 - noteOn)), nh.y, nm);
    nodes.note = {opacity: r(noteOn, 3), transform: T(nx, ny, 0, lerp(1, nh.s, nm))};
    const strike = seg(u, ...W.strike);
    L.note.strikes.forEach((s, i) => { nodes[s.name] = {x2: r(s.x1 + (s.x2 - s.x1) * clamp(strike * L.note.strikes.length - i)), opacity: strike > 0 ? 1 : 0}; });
    const aft = seg(u, ...W.after);
    nodes['note-after'] = {opacity: r(aft, 3), transform: T(0, reduced ? 0 : 10 * (1 - aft))};

    // --- return: marker, ring, leader, marker label
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3), transform: T(L.markerW.x, L.markerW.y, 0, reduced ? 1 : 0.5 + 0.5 * ease.outBack(mk))};
    nodes.ringMark = {opacity: r(mk, 3)};
    const ld = seg(u, ...W.leader);
    if (L.leaderD) nodes.leader = {opacity: r(ld, 3)};
    if (L.mkF) nodes.mkLabel = {opacity: r(mk, 3)};

    const P2 = pt => ({x: r(pt.x), y: r(pt.y)});
    const inside = (pt, b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h;
    const u0 = L.geo.unitCells[L.k];
    const others = L.R0.features.filter(F => F.i !== L.k);
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      focusFeature: L.k,
      focusTarget: ctx.params.focusTarget,
      kindBefore: L.kind0,
      kindAfter: L.kind1,
      lensOpen: r(lp, 3),
      lensZoom: r(L.z, 3),
      contextDim: r(lp, 3),
      datum: qL <= 0 ? 'before' : qL >= 1 ? 'after' : 'changing',
      lensKind: fzS.kind,
      lensValue: r(qL, 3),
      contextKind: fcS.kind,
      contextDatum: qC <= 0 ? 'before' : qC >= 1 ? 'after' : 'changing',
      contextValue: r(qC, 3),
      contextText: qC >= 1 ? L.F1.b : L.F0.b,
      bLens: P2(fzS.b),
      bContext: P2(fcS.b),
      sourceContainsFocus: inside({x: L.aAt.x + u0.L.pc.x, y: L.aAt.y + u0.L.pc.y}, L.src) && inside({x: L.aAt.x + u0.R.pc.x, y: L.aAt.y + u0.R.pc.y}, L.src),
      lensSourceDest: [P2({x: L.src.x, y: L.src.y}), P2({x: L.dest.x, y: L.dest.y})],
      destClearOfSource: L.dest.y >= L.src.y + L.src.h || L.dest.x >= L.src.x + L.src.w || L.dest.y + L.dest.h <= L.src.y || L.dest.x + L.dest.w <= L.src.x,
      otherKinds: others.map(F => F.kind),
      otherKindsAfter: L.R1.features.filter(F => F.i !== L.k).map(F => F.kind),
      badgesShown: ovC.badgesShown,
      ghost: fzS.ghost,
      noteShown: r(noteOn, 3),
      noteAt: P2({x: nx, y: ny}),
      struck: r(strike, 3),
      afterShown: r(aft, 3),
      focusCaption,
      threads: threadP,
      threadKinds: L.threads.map(() => 'relation'),
      threadArrows: L.threads.map(() => false),
      threadLands: L.threads.map(tr => r(ringEdgeDist(L, tr.f, tr.c.to), 2)),
      threadMinGap: L.threads.length === 2 ? r(L.threadMinGap, 1) : null,
      threadHits: L.threadHits,
      marker: r(mk, 3),
      leader: L.leaderD ? r(ld, 3) : null,
      leaderClean: L.leaderClean,
      outcome: null,
    };
    return {nodes, semantic};
  },
};

/** Does segment a→b cross the axis-aligned box? (Liang–Barsky clip) */
function segHitsBox(a, b, box) {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const pq = [[-dx, a.x - box.x], [dx, box.x + box.w - a.x], [-dy, a.y - box.y], [dy, box.y + box.h - a.y]];
  for (const [pp, qq] of pq) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

/** Distance of a world point from the edge of the ring of feature f. */
function ringEdgeDist(L, f, q) {
  const cu = L.geo.unitCells[f];
  const rg = featureRing(L.geo, f, cu.pair ? 'differs' : L.R0.features[f].kind);
  const b = {x: L.aAt.x + rg.x, y: L.aAt.y + rg.y, w: rg.w, h: rg.h};
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  const out = Math.hypot(dx, dy);
  return out > 0 ? out : Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y);
}

/** Right edge (sheet-local x) of the ring a thread lands on. */
function ringRight(L, f) {
  const cu = L.geo.unitCells[f];
  const ring = featureRing(L.geo, f, cu.pair ? 'differs' : L.R0.features[f].kind);
  return ring.x + ring.w + 2;
}

/**
 * Frame of one copy of the focus feature for local substitution progress q:
 * the old label lifts away, the merged overprint/badge fold, B's print slides
 * from its old spot to its new one (lifted slightly), the new overprint,
 * badge and label arrive. `appear` fades the overprint and badge in (build beat).
 */
function focusFrame(L, fp, P, q, appear, reduced, nodes, withGhost) {
  const {sp0, sp1} = L;
  const labOut = seg(q, ...Q.labOut), mOut = seg(q, ...Q.mergeOut), bOut = seg(q, ...Q.badgeOut);
  const mv = ease.inOutCubic(seg(q, ...Q.move));
  const mIn = seg(q, ...Q.mergeIn), bIn = seg(q, ...Q.badgeIn), lIn = seg(q, ...Q.labIn), gh = seg(q, ...Q.ghost);
  let b = {x: 0, y: 0};
  if (fp.bPic) {
    const a = sp0 || sp1, z = sp1 || sp0;
    const lift = reduced ? 0 : Math.sin(Math.PI * mv) * a.ps * 0.22;
    b = {x: lerp(a.pc.x, z.pc.x, mv), y: lerp(a.pc.y, z.pc.y, mv) - lift};
    let op = 1;
    if (!sp0) op *= mv;
    if (!sp1) op *= 1 - mv;
    // landing on A's print: B's own ink gives way to the merged overprint (no
    // half-faded double print)
    if (fp.m1) op *= 1 - mIn;
    nodes[`${P}B`] = {transform: T(b.x, b.y, 0, reduced ? 1 : 1 + 0.06 * Math.sin(Math.PI * mv)), opacity: r(op, 3)};
    nodes[`${P}Bsh`] = {cx: r(b.x), cy: r(lerp(a.groundY, z.groundY, mv) + 1), opacity: r(0.18 * op, 3)};
    if (fp.bPic.twoIcons) {
      nodes[`${P}Bi0`] = {opacity: r(1 - mv, 3)};
      nodes[`${P}Bi1`] = {opacity: r(mv, 3)};
    }
    b = {x: L.aAt.x + b.x, y: L.aAt.y + b.y};
  }
  if (fp.m0) nodes[`${P}M0`] = {opacity: r(appear * (1 - mOut), 3)};
  if (fp.m1) nodes[`${P}M1`] = {opacity: r(appear * mIn, 3)};
  if (fp.lab0) nodes[`${P}L0`] = {opacity: r(1 - labOut, 3)};
  if (fp.lab1) nodes[`${P}L1`] = {opacity: r(lIn, 3), transform: T(0, reduced ? 0 : 10 * (1 - lIn))};
  if (fp.g0) nodes[`${P}G0`] = {opacity: r(appear * (1 - bOut), 3), transform: T(fp.bs0.x, fp.bs0.y, 0, reduced ? 1 : 1 - 0.5 * bOut)};
  if (fp.g1) nodes[`${P}G1`] = {opacity: r(appear * bIn, 3), transform: T(fp.bs1.x, fp.bs1.y, 0, reduced ? 1 : 0.6 + 0.4 * ease.outBack(bIn))};
  if (withGhost && fp.ghost) nodes[`${P}ghost`] = {opacity: r(0.85 * gh, 3)};
  const kind = q >= 0.5 ? L.kind1 : L.kind0;
  return {b, kind, ghost: Boolean(withGhost && fp.ghost && gh >= 1)};
}

/**
 * The single editorial note: "B · <before>" (struck through line by line at
 * the substitution) then "→ <after>". Each row starts with the comparison
 * glyph of that state (drawn, no text) so it still reads with labels hidden;
 * with labels hidden the values are shown as case B's pictogram of each state
 * (the old one struck through) instead of text. Local origin = top-left.
 */
function buildNote(ctx, {w: w0, before, after, kind0, kind1, I, size = 25, minSize = 18, icons = {}}) {
  const th = ctx.theme;
  const showKey = ctx.show('key');
  const pad = 14;
  const gl = 22;
  const empty = '—';
  const picS = 58;
  // labels hidden: a compact note (glyphs + pictograms only)
  const w = showKey ? w0 : Math.min(w0, 2 * pad + 14 + 2 * (24 + 8 + 2 * gl + 10 + picS + 12));
  const row = !showKey || w >= 600;
  // before part: [B disc][glyph] text; after part: [arrow][glyph] text
  const lead0 = 24 + 8 + 2 * gl + 10;
  const lead1 = 26 + 2 * gl + 10;
  const arrowGap = 14;
  const tw0 = row ? (w - 2 * pad - arrowGap) / 2 - lead0 : w - 2 * pad - lead0;
  const tw1 = row ? (w - 2 * pad - arrowGap) / 2 - lead1 : w - 2 * pad - lead1;
  const f0 = showKey ? ctx.fit(before || empty, {maxWidth: tw0, size, minSize, maxLines: 2, weight: 600}) : null;
  const f1 = showKey ? ctx.fit(after || empty, {maxWidth: tw1, size, minSize, maxLines: 2, weight: 700}) : null;
  const rowH = f => Math.max(2 * gl + 10, f ? f.height + 16 : picS + 12);
  const h0 = rowH(f0), h1 = rowH(f1);
  const bandH = row ? Math.max(h0, h1) : 0;
  const hh = row ? 2 * pad + bandH : 2 * pad + h0 + 10 + h1;
  const x0 = pad, y0 = pad;
  const x1 = row ? pad + (w - 2 * pad + arrowGap) / 2 : pad;
  const y1 = row ? pad : pad + h0 + 10;
  const H0 = row ? bandH : h0, H1 = row ? bandH : h1;
  const c0 = y0 + H0 / 2, c1 = y1 + H1 / 2;
  const tx0 = x0 + lead0, tx1 = x1 + lead1;
  const strikes = [];
  if (f0) {
    f0.lines.forEach((line, i) => {
      const lw = ctx.measure(line, f0.size, 600, 'sans');
      const ly = c0 - f0.height / 2 + i * f0.lineHeight + f0.size * 0.5;
      strikes.push({name: `note-strike${i}`, x1: tx0 - 3, x2: tx0 + lw + 3, y: ly});
    });
  } else strikes.push({name: 'note-strike0', x1: tx0 - 4, x2: tx0 + picS + 4, y: c0});
  // pictogram of case B's value in a state (dashed empty slot when B has none)
  const pic = (icon, x, y, ink) => (icon
    ? g({transform: T(x, y)}, pictogram(icon, {s: picS, ink, soft: ink === I.b.ink ? I.b.soft : '#ffffff'}))
    : h('circle', {cx: r(x), cy: r(y), r: picS * 0.42, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '5 4'}));
  const bDisc = (x, y) => g(null,
    h('circle', {cx: r(x), cy: r(y), r: 12, fill: I.b.ink, stroke: th.ink, 'stroke-width': 1.8}),
    h('rect', {x: r(x - 5), y: r(y - 6), width: 10, height: 12, rx: 1.5, fill: '#ffffff', opacity: 0.85}));
  const arrow = (x, y) => h('path', {d: `M${r(x - 12)} ${r(y)}H${r(x + 8)}M${r(x + 1)} ${r(y - 8)}L${r(x + 10)} ${r(y)}L${r(x + 1)} ${r(y + 8)}`, fill: 'none', stroke: th.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const glyph = (kind, x, y) => (kind === 'none' ? h('circle', {cx: r(x), cy: r(y), r: gl - 4, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-dasharray': '4 4'}) : relBadge(ctx, {kind: glyphOf(kind), x, y, rad: gl - 2, color: kind === 'shared' ? I.m.ink : th.ink}));
  const node = g(null,
    h('path', {d: roundRectPath(5, 8, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
    bDisc(x0 + 12, c0),
    glyph(kind0, x0 + 32 + gl, c0),
    f0 ? textBlock(f0, {x: tx0, y: c0 - f0.height / 2, fill: I.b.ink}) : pic(icons.before, tx0 + picS / 2, c0, I.b.ink),
    strikes.map(s => h('line', {name: s.name, x1: r(s.x1), y1: r(s.y), x2: r(s.x1), y2: r(s.y), stroke: th.ink, 'stroke-width': f0 ? 2.8 : 4, opacity: 0})),
    g({name: 'note-after', opacity: 0},
      row ? h('line', {x1: r(x1 - arrowGap / 2 - 2), x2: r(x1 - arrowGap / 2 - 2), y1: pad, y2: r(hh - pad), stroke: th.paperLine, 'stroke-width': 1.5})
        : h('line', {x1: pad, x2: w - pad, y1: r(y1 - 5), y2: r(y1 - 5), stroke: th.paperLine, 'stroke-width': 1.5}),
      arrow(x1 + 12, c1),
      glyph(kind1, x1 + 26 + gl, c1),
      f1 ? textBlock(f1, {x: tx1, y: c1 - f1.height / 2, fill: th.ink}) : pic(icons.after, tx1 + picS / 2, c1, I.b.ink)),
  );
  return {node, w, h: hh, strikes, sizes: [f0, f1].filter(Boolean).map(f => f.size)};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-02-inspect',
    title: 'Case analogy — inspect one slot and change the new case’s value',
    titleEs: 'Analogía de casos — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Analogía de casos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The registered tracing overlay of two fictional cases is the context; a lens (a real copy at the same coordinates) lifts out the slot of one feature, replaces the new case’s value (before → after) so its print slides onto the earlier case’s print (identical text: they coincide, “=”) or beside it (“≠”), keeps the old value traceable (struck-through note, dashed footprint) and returns to the context with a changed-datum marker; the rule card’s caption follows the supplied texts, no conclusion drawn.',
    tags: ['reasoning', 'analogy', 'cases', 'inspect', 'lens', 'tracing paper', 'overlay', 'before-after', 'substitution', 'similarity', 'difference'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/analogia-de-casos.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: ANALOGY_STRINGS,
  scene,
});
