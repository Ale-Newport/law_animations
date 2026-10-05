/**
 * LAW-0318 — Lectura de resolución · mechanism
 *
 * Storyboard (an exploded view of the generic hearing room: the pieces that take
 * part when the document separates into its editable sections are pulled OUT of
 * the room and laid apart in a band above it; the relationships supplied between
 * them are drawn with their kind and named on the plan; a tracer runs through
 * them; the document carries ONLY supplied placeholder text):
 *  0.00–0.18  separate: the room as the story leaves it (the two section cards on
 *             the reading board, the numbered paragraphs on the table). The two
 *             cards leave the board through the top wall to the band, card A to
 *             one side and card B, mirrored, to the other; the paragraphs lift off
 *             the table to an enlarged row of their own between them. The reader
 *             stays at the lectern, the room keeps its fixtures (board, empty
 *             table, wall clock). Each piece gets its label ON the plan, beside
 *             its piece; where the floor beside it is taken (a crowded 1:1 frame)
 *             a leader runs from the label to the piece.
 *  0.18–0.43  only the explicit relationships are drawn, each in its kind's style
 *             (a plain relation has end dots and no arrowhead — "placed in the
 *             section (as supplied)" —, a communication a hollow end — "read out
 *             by the reader (as supplied)"; a causal arrowhead only when
 *             supplied); the caption of each kind stands on the plan, its frame
 *             clear of every other label (a caption on the room's floor away from
 *             its lines gets a leader to the nearest one). A
 *             relationship and its mirror on the other side share one window: A
 *             and B at the same pace.
 *  0.43–0.75  a tracer runs along the relationships in the supplied traversal
 *             order — a second one along its mirror, at the same time; each piece
 *             it reaches enlarges a little, the focus element most.
 *  0.75–1.00  gather: everything stays visible (the room of origin, the pieces,
 *             their labels, the lines); the same neutral frame round both cards;
 *             the key "as supplied · no conclusion drawn". Nothing is decided,
 *             granted or found; neither section is preferred.
 * @module animations/hearings/LAW-0318
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {measure} from '../../core/text.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {localised, pxPerUnit, R2, placeLabels, centreShiftY, overlaps, textAt, FONT} from './kits/apertura-audiencia.js';
import {toWorld} from './kits/hearings-art.js';
import {PERSON} from '../courts/kits/courts-art.js';
import {
  lrFields, LR_EN, LR_ES, resolveLr, lrRows, lrRowNode, lrRoom, composeLr, searchLr, linkColor, personBox, SIDES,
  lrObstacles, fitLr, hasLoneWord, measureRowG, EX, EXH,
} from './kits/lectura-resolucion.js';

const ID = 'LAW-0318';
const CLOCK_END = 0.94;
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {spread: [0.03, 0.15], labels: [0.155, 0.19], relate: [0.18, 0.41], trace: [0.45, 0.72], frames: [0.77, 0.82]};
const IDS = ['room', 'reader', 'section-a', 'section-b', 'paragraphs', 'clock'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const INK = '#1f2328';
/** Scale of the exhibits once they are out of the room (the row then reads beside the cards). */
const EXK = 1.5;

const OWN_EN = {
  elements: [
    {id: 'reader', label: 'Reader at the lectern'},
    {id: 'section-a', label: 'Card of section A'},
    {id: 'paragraphs', label: 'Paragraphs from the table'},
    {id: 'section-b', label: 'Card of section B'},
  ],
  relationships: [
    {from: 'reader', to: 'section-a', kind: 'communication'},
    {from: 'reader', to: 'section-b', kind: 'communication'},
    {from: 'section-a', to: 'paragraphs', kind: 'relation'},
    {from: 'section-b', to: 'paragraphs', kind: 'relation'},
  ],
  focusElement: 'paragraphs',
  relationLabels: {relation: 'Paragraph placed in the section (as supplied)', communication: 'Read out by the reader (as supplied)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['reader', 'section-a', 'paragraphs'],
};
const OWN_ES = {
  elements: [
    {id: 'reader', label: 'Persona que lee, en el atril'},
    {id: 'section-a', label: 'Tarjeta del bloque A'},
    {id: 'paragraphs', label: 'Apartados de la mesa'},
    {id: 'section-b', label: 'Tarjeta del bloque B'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'paragraphs',
  relationLabels: {relation: 'Apartado situado en el bloque (según lo aportado)', communication: 'Leído por la persona lectora (según lo aportado)', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (según lo aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  elements: list('Labels of the pieces of the mechanism (drawn on the plan beside each piece); ids are fixed by the scene, labels are editable', obj('Element', {
    id: oneOf('Element id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, 7),
  relationships: list('Explicit relationships between pieces; the kind sets the line (a plain relation has no arrowhead; causal only when supplied). Between a section card and the paragraphs the line runs to every paragraph placed in that section', obj('Relationship', {
    from: oneOf('Source element', IDS),
    to: oneOf('Target element', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Element enlarged most when the tracer reaches it', IDS),
  relationLabels: obj('Caption of each relation kind (drawn on the plan between the lines it names)', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links (keep "as configured")', 60),
    causal: str('Caption for supplied causal links', 50),
  }),
  traversalOrder: list('Order in which the tracer visits the elements (consecutive elements should be related); its mirror on the other side is traced at the same time', oneOf('Element id', IDS), 2, 8),
};

const defaultParams = {...EN};

const mirrorId = id => (id.endsWith('-a') ? id.slice(0, -1) + 'b' : id.endsWith('-b') ? id.slice(0, -1) + 'a' : id);
const relSide = rel => sideOf(rel.from) || sideOf(rel.to);
const sideOf = id => (id.endsWith('-a') ? 'a' : id.endsWith('-b') ? 'b' : null);
const isBundle = rel => {
  const pair = [rel.from, rel.to];
  return pair.includes('paragraphs') && pair.some(id => id.startsWith('section-'));
};
const isComm = rel => {
  const pair = [rel.from, rel.to];
  return pair.includes('reader') && pair.some(id => id.startsWith('section-'));
};

/**
 * Route of the reader's line to a section card (design units): sideways from the side of the lectern (left for the
 * left-hand card, right for the right-hand one — mirrored), up just outside the board's edge and out of the room, then
 * along under the card to its outer port; vertical last leg.
 */
function commRoute(tm, front, port) {
  const X = tm.leftS ? Math.min(tm.edgeX, port.x) : Math.max(tm.edgeX, port.x);
  const raw = [front, {x: X, y: front.y}, {x: X, y: tm.yh}, {x: port.x, y: tm.yh}, port];
  const pts = [raw[0]];
  for (const q of raw.slice(1)) if (Math.hypot(q.x - pts[pts.length - 1].x, q.y - pts[pts.length - 1].y) > 1) pts.push(q);
  return pts;
}

/** Edge point of box b towards point q. */
function edgeToward(b, q) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const dx = q.x - cx, dy = q.y - cy;
  if (!dx && !dy) return {x: cx, y: b.y};
  const t = Math.min(dx ? (b.w / 2) / Math.abs(dx) : Infinity, dy ? (b.h / 2) / Math.abs(dy) : Infinity);
  return {x: cx + dx * t, y: cy + dy * t};
}
const segDist = (p, q, c) => {
  const vx = q.x - p.x, vy = q.y - p.y, L2 = vx * vx + vy * vy || 1;
  const t = clamp(((c.x - p.x) * vx + (c.y - p.y) * vy) / L2);
  return Math.hypot(p.x + vx * t - c.x, p.y + vy * t - c.y);
};
const segHitsBox = (p, q, b, pad = 0) => {
  if (Math.max(p.x, q.x) < b.x - pad || Math.min(p.x, q.x) > b.x + b.w + pad || Math.max(p.y, q.y) < b.y - pad || Math.min(p.y, q.y) > b.y + b.h + pad) return false;
  for (let i = 0; i <= 40; i++) { const x = lerp(p.x, q.x, i / 40), y = lerp(p.y, q.y, i / 40); if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true; }
  return false;
};
const inside = (b, o, pad = 0) => b.x >= o.x + pad && b.y >= o.y + pad && b.x + b.w <= o.x + o.w - pad && b.y + b.h <= o.y + o.h - pad;
const boxDist = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));
const gapBox = (a, b) => Math.hypot(Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w)), Math.max(0, b.y - (a.y + a.h), a.y - (b.y + b.h)));
/** True when a wrapped text has a stub line: a line under half the widest (the last under 0.3) — "Paragraph placed / in the / section (as supplied)". */
const ragged = f => {
  if (!f || f.lines.length < 2) return false;
  const ws = f.lines.map(ln => measure(String(ln).replace(/\u00a0/g, ' '), f.size, f.weight ?? 500, 'sans'));
  const mx = Math.max(...ws);
  return ws.some((wv, i) => wv < (i === ws.length - 1 ? 0.3 : 0.5) * mx);
};
/** Caption frame (design): the drawn frame is the box itself; the row sits 8 / 6 units inside it. */
const CAP_PX = 16, CAP_PY = 12;
/** A label or caption further than this (px at 1080p) from its own target gets a leader that ends on the target. */
const LEAD_PX = 22;
const capPad = m => ({...m, w: m.w + CAP_PX, h: m.h + CAP_PY, inner: m});

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveLr(ctx, P);
    const th = ctx.theme;
    const px = pxPerUnit(ctx);
    const showKey = ctx.show('key');
    const seen = new Set();
    const elements = (P.elements || []).filter(e => IDS.includes(e.id) && !seen.has(e.id) && seen.add(e.id));
    const present = new Set(elements.map(e => e.id));
    const label = id => (elements.find(e => e.id === id) || {}).label ?? null;
    const rels = (P.relationships || []).filter(q => q.from !== q.to && present.has(q.from) && present.has(q.to));
    // the per-exhibit lines of a side exist when its section card is related to the paragraphs
    const bundle = {};
    for (const rel of rels) if (isBundle(rel)) { const s = sideOf(rel.from) || sideOf(rel.to); if (!bundle[s]) bundle[s] = rel; }
    const linkStyle = {};
    for (const s of SIDES) if (bundle[s]) linkStyle[s] = {color: linkColor(th, bundle[s].kind), width: bundle[s].kind === 'causal' ? 5.5 : 4.5};
    const kindsUsed = [...new Set(rels.map(q => q.kind))];
    const sq = ctx.view.shape === 'square';
    // ---- panel rows (the pieces and the relation kinds are named on the plan, not here)
    // (fixtures in the panel: only when the plan has no free floor for the labels of the room and its wall clock —
    // a crowded 1:1 stress frame — are those two fixtures named in the panel instead; every other piece and every
    // relation kind is always named on the plan)
    let inPanel = new Set();
    // (a 1:1 frame first tries the room with a narrow floor between the board and the table; a crowded one retries with
    // the wider floor the other shapes use)
    let bigGap = false;
    const rowsFor = () => {
      const rows = [];
      if (showKey) {
        rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
        R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
        // (the section headings are listed here: the exploded cards show only their glyph and placeholder bars)
        rows.push({kind: 'legend', glyphKind: 'secA', text: R.args.a.text, name: 'lg-sec-a'});
        rows.push({kind: 'legend', glyphKind: 'secB', text: R.args.b.text, name: 'lg-sec-b'});
        rows.push(...lrRows(R, P, 'lg'));
        for (const id of ['reader', 'room', 'clock']) if (inPanel.has(id)) rows.push({kind: 'legend', glyphKind: id === 'reader' ? 'person' : id, text: label(id), name: `el-${id}`});
        rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
        rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      }
      return rows;
    };
    let rows = rowsFor();
    // chip variants of a label (design units): whole words, no one-word line, never truncated
    const chipVs = (text, F, maxW, weight = 700) => {
      const padX = F * 0.5, padY = F * 0.3;
      const out = [];
      for (const q of [1.3, 1, 0.82, 0.68, 0.56, 0.46]) {
        const fit = fitLr(text, {maxWidth: maxW * q - padX * 2, size: F, minSize: F, maxLines: 4, weight});
        if (fit.truncated || hasLoneWord(fit)) continue;
        if (out.some(v => v.fit.lines.length === fit.lines.length)) continue;
        out.push({fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY});
      }
      return out;
    };
    // ---- one composition: the room in the lower part of the box, the exploded band above it
    const memo = new Map();
    const compose = (box, F, bandF) => {
      const key = `${r(box.x)},${r(box.y)},${r(box.w)},${r(box.h)},${r(F, 3)},${bandF},${[...inPanel].join()},${bigGap}`;
      if (memo.has(key)) return memo.get(key);
      const problems = [];
      const bandH = box.h * bandF;
      const roomBox = {x: box.x, y: box.y + bandH, w: box.w, h: box.h - bandH};
      // (the floor between the board and the table holds the communication caption: the gap is sized for its two-line
      // variant once the room's scale is known)
      const commText = rels.some(isComm) && showKey ? P.relationLabels[rels.find(isComm).kind] : null;
      const roomAt = gap => composeLr(ctx, P, R, roomBox, F, {scale: 1, chips: false, text: showKey, numbers: showKey, align: {x: 0.5, y: 0}, linkGap: gap, cardText: false});
      let C = roomAt(84);
      if (commText && bigGap) {
        const capH = Math.min(...[12, 15, 18].map(q => measureRowG({kind: 'legend', text: commText, glyphKind: 'kind-communication'}, F, F * q)).filter(v => !v.fit.truncated).map(v => v.h), 1e9);
        const need = (capH + CAP_PY + 24) / C.k;
        if (need > 84 && capH < 1e9) C = roomAt(Math.min(need, 260));
      }
      problems.push(...C.problems.filter(p => p !== 'link-over-person' && p !== 'link-over-lectern'));
      const G = C.G, k = C.k;
      // (the wall clock hangs low on the left wall here: the reader's lines leave the lectern sideways and rise beside the
      // board)
      G.clock = {...G.clock, cy: G.H - 54};
      const toD = C.toD, bD = C.bD;
      const Ft = F / k;
      const t = 18;
      // band extent (template units, the room's frame)
      const bx0 = (box.x - C.ox) / k + 6 / k, bx1 = (box.x + box.w - C.ox) / k - 6 / k;
      const yTop = (box.y - C.oy) / k + 4 / k;
      const Cx = G.W / 2;
      const cw = G.card.a.w, ch = G.card.a.h;
      const nEx = R.exhibits.length;
      // (out of the room the exhibits are drawn larger — EXK — so the row reads beside the cards)
      const exS = EX.s * EXK;
      const step = EX.step * EXK;
      const rowW = (nEx - 1) * step + exS;
      // labels in the band (design sizes)
      const cardLab = {};
      let cardLabH = 0;
      if (showKey) for (const s of SIDES) {
        const id = `section-${s}`;
        if (!present.has(id)) continue;
        const vs = chipVs(label(id), F, Math.max(cw * k, F * 11));
        if (!vs.length) { problems.push(`label-${id}`); continue; }
        cardLab[s] = vs;
      }
      // (the two card labels take the same number of lines: equal weight)
      const pickPair = () => {
        const a = cardLab.a || [], b = cardLab.b || [];
        if (!a.length && !b.length) return {};
        if (!a.length || !b.length) return {a: a[0], b: b[0]};
        for (const va of a) { const vb = b.find(v => v.fit.lines.length === va.fit.lines.length); if (vb) return {a: va, b: vb}; }
        return {a: a[0], b: b[0]};
      };
      const cl = pickPair();
      for (const s of SIDES) if (cl[s]) cardLabH = Math.max(cardLabH, cl[s].h);
      const evVs = showKey && present.has('paragraphs') ? chipVs(label('paragraphs'), F, Math.max(rowW * k, F * 12)) : [];
      if (showKey && present.has('paragraphs') && !evVs.length) problems.push('label-paragraphs');
      // relation captions: one per kind, on the plan
      // (each variant measured with its frame; cleanly wrapped only: no one-word line, no stub line)
      const capVs = {};
      if (showKey) for (const kd of kindsUsed) {
        const m = measureRowG({kind: 'legend', text: P.relationLabels[kd] || kd, glyphKind: `kind-${kd}`}, F, F * 15);
        const seenL = new Set();
        capVs[kd] = [10, 12, 13.5, 15, 16.5, 18, 21].map(q => measureRowG({kind: 'legend', text: P.relationLabels[kd] || kd, glyphKind: `kind-${kd}`}, F, F * q))
          .filter(v => !v.fit.truncated && !hasLoneWord(v.fit) && !ragged(v.fit) && !seenL.has(v.fit.lines.join('|')) && seenL.add(v.fit.lines.join('|'))).map(capPad);
        if (!capVs[kd].length) capVs[kd] = [capPad(m)];
      }
      const bundleKind = SIDES.map(s => bundle[s] && bundle[s].kind).find(Boolean) || null;
      const commRels = rels.filter(isComm);
      const commKind = commRels.length ? commRels[0].kind : null;
      // ---- vertical stack of the band (template units)
      // (the exhibits' number discs keep their size: frame() counter-scales them under the enlarged exhibit)
      const numH = showKey ? Ft * 1.75 + 8 : 0;
      const exH = exS * EXH;
      const yCard = yTop + (cardLabH ? cardLabH / k + 8 / k : 4 / k);
      // the relation caption between the cards when there is room for it, else under the exhibits
      const bandCap = bundleKind && capVs[bundleKind] ? capVs[bundleKind] : null;
      const gapNeed = bandCap ? Math.min(...bandCap.map(v => v.w)) / k + 2 * 26 / k : 0;
      const halfMax = Math.min(Cx - bx0, bx1 - Cx) - cw / 2;
      // (the reader's line to a card leaves the side of the lectern, rises just outside the board to the outer part of
      // the card's lower edge: the card's outer port stands outside the board's edge)
      let commHs = 0;
      if (commRels.length) for (const s of SIDES) {
        const leftS = s === G.left;
        const portX = leftS ? G.board.x - 26 : G.board.x + G.board.w + 26;
        commHs = Math.max(commHs, leftS ? Cx - portX - 0.34 * cw : portX - Cx - 0.34 * cw);
      }
      const halfWant = Math.max(rowW / 2 + 60 + cw / 2, G.W / 2 - cw / 2 + 10, cw / 2 + gapNeed / 2, commHs);
      const hs = Math.min(halfMax, halfWant);
      if (hs < cw / 2 + 30) problems.push('band-width');
      let capBand = null;
      if (bandCap) {
        // (between the cards only when its frame keeps >= 8 px (rendered) clear of both cards, their neutral frames and
        // their label chips — measured on the chips' frames, which may be wider than the cards)
        const clear = 9 / Math.max(px, 0.05) + 1;
        const xsOf = s2 => {
          const cxD = toD({x: Cx + (s2 === G.left ? -hs : hs), y: 0}).x;
          const xs = [[cxD - (cw / 2 + 8) * k - 3, cxD + (cw / 2 + 8) * k + 3]];
          if (cl[s2]) { const x0 = clamp(cxD - cl[s2].w / 2, box.x, box.x + box.w - cl[s2].w); xs.push([x0, x0 + cl[s2].w]); }
          return xs;
        };
        const lim = {l: Math.max(...xsOf(G.left).map(q => q[1])) + clear, r: Math.min(...xsOf(G.left === 'a' ? 'b' : 'a').map(q => q[0])) - clear};
        const cD = toD({x: Cx, y: 0}).x;
        const fits = bandCap.filter(v => cD - v.w / 2 >= lim.l && cD + v.w / 2 <= lim.r && v.h / k <= ch + cardLabH / k - 10 / k);
        capBand = fits.length ? fits[0] : null;
      }
      const yRoomTop = -t;
      const lgMin = Math.max(44, (sq ? 30 : 56) / (px * k));
      const sideX = s => (s === G.left ? Cx - hs : Cx + hs);
      // two stacks under the exhibits: the paragraphs label (and, when it found no room between the cards, the relation
      // caption) under the row, or the label beside the row
      const commV = !sq && commKind && capVs[commKind] ? [...capVs[commKind]].sort((p0, q0) => p0.h - q0.h)[0] : null;
      const tryStack = mode => {
        const evLab = evVs[0] || null;
        const capU = bandCap && !capBand ? bandCap[0] : null;
        // (off 1:1 the communication caption stands here too, centred between the two lines it names, which rise on both
        // sides of the band)
        const under = mode === 'under' ? [evLab, capU, commV].filter(Boolean) : mode === 'beside' ? [capU, commV].filter(Boolean) : [commV].filter(Boolean);
        // (the items under the row stand side by side when they fit between the rising lines, else one under the other)
        const pairW = under.reduce((acc, v) => acc + v.w, 0) + 24 * Math.max(1, under.length - 1);
        const pair = under.length >= 2 && pairW <= (2 * hs + 0.68 * cw) * k - 40;
        const underH = pair ? Math.max(...under.map(v => v.h)) / k + 10 / k : under.reduce((acc, v) => acc + v.h / k + 10 / k, 0);
        let lg = yRoomTop - 16 / k - underH - numH - exH - (yCard + ch);
        let shift = 0;
        const okH = lg >= lgMin;
        if (lg > 190) { shift = lg - 190; lg = 190; }
        const cardY = yCard + shift;
        const cards = {};
        for (const s of SIDES) cards[s] = {x: sideX(s) - cw / 2, y: cardY, w: cw, h: ch};
        const exTop = cardY + ch + lg;
        const exhibits = R.exhibits.map((_, i) => ({cx: Cx - rowW / 2 + exS / 2 + i * step, cy: exTop + exS * EXH / 2, s: exS}));
        return {mode, under, pair, pairW, okH, lg, cardY, cards, exTop, exhibits, evLab};
      };
      let st = tryStack('under');
      if (!st.okH && evVs.length) { const s2 = tryStack('beside'); if (s2.okH) st = s2; }
      if (!st.okH && evVs.length && bandCap && !capBand) { const s2 = tryStack('split'); if (s2.okH) st = s2; }
      if (!st.okH) problems.push('band-height');
      const {cards, exTop, exhibits, cardY} = st;
      // exploded link ends: the kit's port rule (inner part of the card's lower edge, in the order of the exhibits; each side
      // on its own half of an exhibit, just above its upper edge) on the exploded, enlarged pieces
      const linksOf = side => {
        const card = cards[side];
        const leftSide = side === G.left;
        const sorted = [...R.links[side]].sort((p0, q0) => exhibits[p0].cx - exhibits[q0].cx);
        const n = sorted.length;
        const f0 = leftSide ? 0.42 : 0.12, f1 = leftSide ? 0.88 : 0.58;
        return sorted.map((ex, j) => {
          const f = n === 1 ? (f0 + f1) / 2 : lerp(f0, f1, j / (n - 1));
          const e = exhibits[ex];
          const dx = (leftSide ? -1 : 1) * exS * 0.17;
          return {ex, from: {x: card.x + card.w * f, y: card.y + card.h}, to: {x: e.cx + dx, y: e.cy - exS * EXH / 2 - 8.5 - 3}};
        });
      };
      const links = {a: linksOf('a'), b: linksOf('b')};
      // offsets from the room positions (spread 0) to the exploded ones (spread 1)
      const offs = {card: {}, ex: []};
      for (const s of SIDES) offs.card[s] = {x: cards[s].x - G.card[s].x, y: cards[s].y - G.card[s].y};
      exhibits.forEach((e, i) => { offs.ex[i] = {x: e.cx - G.exhibits[i].cx, y: e.cy - G.exhibits[i].cy}; });
      const numBottom = exTop + exH + numH;
      const labels = [];
      for (const s of SIDES) if (cl[s]) {
        const v = cl[s];
        // (over its card; a label wider than the card keeps inside the box, still over the card)
        const cxD = toD({x: sideX(s), y: 0}).x;
        const x0 = clamp(cxD - v.w / 2, box.x, box.x + box.w - v.w);
        const bx = {x: x0, y: toD({x: 0, y: cardY}).y - 8 - v.h, w: v.w, h: v.h};
        labels.push({key: `el-section-${s}`, id: `section-${s}`, box: bx, v});
      }
      let uy = toD({x: 0, y: numBottom}).y + 10;
      const capBoxes = {};
      let ux = toD({x: Cx, y: 0}).x - st.pairW / 2;
      for (const v of st.under) {
        const bx = st.pair ? {x: ux, y: uy, w: v.w, h: v.h} : {x: toD({x: Cx, y: 0}).x - v.w / 2, y: uy, w: v.w, h: v.h};
        if (v === st.evLab) labels.push({key: 'el-paragraphs', id: 'paragraphs', box: bx, v});
        else if (v === commV) capBoxes[commKind] = {box: bx, m: v};
        else capBoxes[bundleKind] = {box: bx, m: v};
        if (st.pair) ux += v.w + 24; else uy += v.h + 10;
      }
      // the reader's line to a card (design): see commRoute
      const commOf = s => {
        const sp = G.seats[R.reader];
        const leftS = s === G.left;
        // (it leaves the side of the lectern facing its card's side of the room)
        const front = toWorld({x: sp.x, y: sp.y, deg: sp.deg}, {x: leftS ? -34 : 34, y: -80});
        const cb = G.card[s];
        const port = {x: cb.x + cb.w * (s === G.left ? 0.16 : 0.84), y: cb.y + cb.h};
        const edgeX = toD({x: leftS ? G.board.x - 26 : G.board.x + G.board.w + 26, y: 0}).x;
        const cbY = toD({x: 0, y: cards[s].y + cards[s].h}).y;
        const yh = cbY + Math.min(30, Math.max(16, (toD({x: 0, y: -t}).y - cbY) * 0.4));
        const tm = {side: s, front, port, edgeX, yh, leftS, yb: toD({x: 0, y: G.board.y + G.board.h + 16}).y};
        const pa = toD(front), pe = toD({x: port.x + offs.card[s].x, y: port.y + offs.card[s].y}), pb = {x: pe.x, y: pe.y + 9};
        return {tm, pts: commRoute(tm, pa, pb)};
      };
      if (st.mode !== 'under') {
        // (beside the row, at its height: on whichever side no line crosses — the paragraphs label first, then, in 'split',
        // the relation caption on the other side)
        const exSegs = SIDES.flatMap(s2 => (bundle[s2] ? links[s2].map(lk => [toD(lk.from), toD(lk.to)]) : []));
        if (commRels.length) for (const s2 of SIDES) { const q = commOf(s2).pts; q.slice(1).forEach((p1, i) => exSegs.push([q[i], p1])); }
        const rowD = bD({x: Cx - rowW / 2, y: exTop, w: rowW, h: exH + numH});
        const taken = [];
        const beside = vs => {
          for (const v of vs) for (const dir of [-1, 1]) for (const fy of [0.5, 0, 1]) {
            const bx = {x: dir < 0 ? rowD.x - 14 - v.w : rowD.x + rowD.w + 14, y: rowD.y + (rowD.h - v.h) * fy, w: v.w, h: v.h};
            if (exSegs.some(([p0, q0]) => segHitsBox(p0, q0, bx, 6)) || !inside(bx, box, 0) || taken.some(q => overlaps(bx, q, 10))) continue;
            taken.push(bx);
            return {bx, v};
          }
          return null;
        };
        const got = beside(evVs);
        if (got) labels.push({key: 'el-paragraphs', id: 'paragraphs', box: got.bx, v: got.v});
        else problems.push('label-paragraphs');
        if (st.mode === 'split') {
          const gc = beside(bandCap);
          if (gc) capBoxes[bundleKind] = {box: gc.bx, m: gc.v};
          else problems.push(`cap-${bundleKind}`);
        }
      }
      if (capBand) {
        const yb = toD({x: 0, y: cardY + ch}).y;
        capBoxes[bundleKind] = {box: {x: toD({x: Cx, y: 0}).x - capBand.w / 2, y: yb - 10 - capBand.h, w: capBand.w, h: capBand.h}, m: capBand};
      }
      for (const L0 of [...labels.map(q => q.box), ...Object.values(capBoxes).map(q => q.box)]) if (!inside(L0, box, -0.5)) problems.push('band-out');
      // element boxes (design, exploded)
      const readerBox = () => {
        const pb = personBox(G.seats[R.reader]), l = G.lectern;
        const x0 = Math.min(pb.x, l.cx - 34), y0 = Math.min(pb.y, l.cy - 34), x1 = Math.max(pb.x + pb.w, l.cx + 34), y1 = Math.max(pb.y + pb.h, l.cy + 34);
        return bD({x: x0, y: y0, w: x1 - x0, h: y1 - y0});
      };
      const exRow = {x: Cx - rowW / 2, y: exTop, w: rowW, h: exH + numH};
      const boxes = {
        room: C.planRect,
        reader: readerBox(),
        'section-a': bD(cards.a), 'section-b': bD(cards.b),
        paragraphs: bD(exRow),
        clock: bD({x: G.clock.cx - G.clock.R, y: G.clock.cy - G.clock.R, w: 2 * G.clock.R, h: 2 * G.clock.R}),
      };
      // ---- generic connectors (design units): the reader to a card runs from the side of the lectern up to the
      // outer part of the exploded card's lower edge (the exhibit lines leave from the inner part); other pairs edge to edge
      const conns = [];
      for (const rel of rels) {
        if (isBundle(rel)) continue;
        let a, b, tmpl = null;
        if (isComm(rel)) {
          // (the route: sideways from the lectern's front to just outside the board, up out of the room, then — when the
          // card's port is further in — along under the card to it)
          const s = relSide(rel);
          const co = commOf(s);
          tmpl = {...co.tm, partyFirst: rel.from === 'reader'};
          const pts = co.pts;
          const pa = pts[0], pb = pts[pts.length - 1];
          [a, b] = tmpl.partyFirst ? [pa, pb] : [pb, pa];
          conns.push({rel, a, b, tmpl, pts: tmpl.partyFirst ? pts : [...pts].reverse(), i: rels.indexOf(rel)});
          continue;
        } else {
          const A = boxes[rel.from], B = boxes[rel.to];
          if (rel.to === 'room' || rel.from === 'room') {
            const other = rel.to === 'room' ? A : B;
            const rm = C.planRect;
            const c = {x: other.x + other.w / 2, y: other.y + other.h / 2};
            const opts = [{x: rm.x, y: c.y}, {x: rm.x + rm.w, y: c.y}, {x: c.x, y: rm.y}, {x: c.x, y: rm.y + rm.h}].sort((p, q) => Math.hypot(p.x - c.x, p.y - c.y) - Math.hypot(q.x - c.x, q.y - c.y));
            const wallPt = opts[0];
            const e = edgeToward(other, wallPt);
            [a, b] = rel.to === 'room' ? [e, wallPt] : [wallPt, e];
          } else {
            a = edgeToward(A, {x: B.x + B.w / 2, y: B.y + B.h / 2});
            b = edgeToward(B, {x: A.x + A.w / 2, y: A.y + A.h / 2});
          }
        }
        conns.push({rel, a, b, tmpl, pts: [a, b], i: rels.indexOf(rel)});
      }
      const segsOf = c => c.pts.slice(1).map((q, i) => [c.pts[i], q]);
      const cHits = (c, bx, pad) => segsOf(c).some(([p, q]) => segHitsBox(p, q, bx, pad));
      const cDist = (c, q) => Math.min(...segsOf(c).map(([p0, p1]) => segDist(p0, p1, q)));
      // all drawn line segments (design): connectors and exhibit links
      const segs = conns.flatMap(segsOf);
      for (const s of SIDES) if (bundle[s]) for (const lk of links[s]) segs.push([toD(lk.from), toD(lk.to)]);
      const lineHits = (bx, pad = 6) => segs.some(([p, q]) => segHitsBox(p, q, bx, pad));
      // a line never crosses a person other than the reader (its own), a card, the paragraph row or a band label it does not belong to
      const own = rel => new Set([rel.from, rel.to].includes('reader') ? [R.reader] : []);
      for (const c of conns) {
        const mine = own(c.rel);
        if (C.people.some((q, pi) => !mine.has(pi) && cDist(c, q) < q.rad + 4)) problems.push(`link-over-person-${c.i}`);
        for (const id of ['section-a', 'section-b', 'paragraphs']) if (![c.rel.from, c.rel.to].includes(id) && cHits(c, boxes[id], 2)) problems.push(`link-over-${id}-${c.i}`);
        const bd = bD(G.board);
        if (cHits(c, bd, 2)) problems.push(`link-over-board-${c.i}`);
        if (c.tmpl) {
          // (the reader's line keeps off the table, the clock and the door)
          // (its own lectern — the last obstacle — excepted: the line leaves the lectern's side)
          const fix = lrObstacles(G).slice(1, -1);
          for (const q of fix) if (cHits(c, bD(q), 0)) problems.push(`link-over-fixture-${c.i}`);
        }
        if (Math.hypot(c.b.x - c.a.x, c.b.y - c.a.y) < 30 / px) problems.push(`link-short-${c.i}`);
      }
      for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) {
        const p = conns[i], q = conns[j];
        if (cDist(p, q.a) < 16 && cDist(p, q.b) < 16) problems.push(`links-parallel-${i}-${j}`);
      }
      for (const s of SIDES) if (bundle[s]) for (const lk of links[s]) {
        const p = toD(lk.from), q = toD(lk.to);
        if (Math.hypot(q.x - p.x, q.y - p.y) < 40 / px) problems.push('exlink-short');
        if (C.people.some(pp => segDist(p, q, pp) < pp.rad + 4)) problems.push('exlink-over-person');
        const other = s === 'a' ? 'b' : 'a';
        if (segHitsBox(p, q, boxes[`section-${other}`], 2)) problems.push('exlink-over-card');
      }
      for (const L0 of labels) if (lineHits(L0.box, 4)) problems.push(`line-over-${L0.key}`);
      for (const [kd, cb] of Object.entries(capBoxes)) if (lineHits(cb.box, 4)) problems.push(`line-over-cap-${kd}`);
      // ---- labels and captions inside the room: beside their own piece, off every line, person and fixture
      const roomObs = [...lrObstacles(G)].map(bD);
      const people = C.people;
      const placed = [...labels.map(q => q.box), ...Object.values(capBoxes).map(q => q.box)];
      const tableObs = bD({x: G.table.x - 8, y: G.table.y - 8, w: G.table.w + 16, h: G.table.h + 16});
      const free = (bx, o = {}) => {
        if (!inside(bx, C.bounds, 2)) return false;
        if (roomObs.some(q => overlaps(bx, q, 6) && !(o.onTable && q.x === tableObs.x && q.y === tableObs.y))) return false;
        if (placed.some(q => overlaps(bx, q, 10))) return false;
        if (people.some(q => boxDist(bx, q) < q.rad + 4)) return false;
        if (lineHits(bx, o.linePad ?? 10)) return false;
        return true;
      };
      // element labels in the room: the reader, the clock, the room itself
      let tableMode = false;
      const placeEls = tableFirst => {
      if (showKey) for (const id of ['reader', 'clock', 'room']) {
        if (!present.has(id) || inPanel.has(id)) continue;
        const vs = chipVs(label(id), F, F * 12);
        const b = boxes[id];
        let best = null;
        // (labels first — tableFirst —: the reader's label takes its nearest free place beside the lectern and the reader,
        // floor or empty table — the paragraphs have left the table before any label shows —, before the captions; when a
        // caption then finds no place, the captions go first and the reader's label tries the floor, then the table)
        for (const pass of id === 'reader' ? (tableFirst ? [true] : [false, true]) : [false]) for (const v of vs) {
          if (best) break;
          tableMode = pass;
          const inner = C.bounds;
          const reach = 150 / Math.max(px, 0.5);
          const cands = [];
          if (id === 'room') {
            for (let x = inner.x + 4; x <= inner.x + inner.w - v.w - 4; x += 10) cands.push({x, y: inner.y + inner.h - v.h - 4}, {x, y: inner.y + 4});
            for (let y = inner.y + 4; y <= inner.y + inner.h - v.h - 4; y += 10) cands.push({x: inner.x + 4, y}, {x: inner.x + inner.w - v.w - 4, y});
          } else {
            for (let y = Math.max(inner.y + 4, b.y - reach - v.h); y <= Math.min(inner.y + inner.h - v.h - 4, b.y + b.h + reach); y += 12) for (let x = Math.max(inner.x + 4, b.x - reach - v.w); x <= Math.min(inner.x + inner.w - v.w - 4, b.x + b.w + reach); x += 12) cands.push({x, y});
          }
          for (const cd of cands) {
            const {x, y} = cd;
            const bx = {x, y, w: v.w, h: v.h};
            const dWall = Math.min(x - inner.x, inner.x + inner.w - x - v.w, y - inner.y, inner.y + inner.h - y - v.h);
            const dOwn = id === 'room' ? dWall : gapBox(bx, b);
            if (dOwn > (id === 'room' ? 30 : reach)) continue;
            // (the reader's label may lie on the empty table — the paragraphs have left it before any label shows — when
            // the floor beside the reader is taken: a crowded 1:1 stress frame)
            const onTable = id === 'reader' && tableMode;
            if (!free(bx, {onTable})) continue;
            if (id !== 'room') {
              const others = ['reader', 'clock'].filter(k2 => k2 !== id && boxes[k2]);
              if (others.some(k2 => gapBox(bx, boxes[k2]) < dOwn + 16 / px)) continue;
              // (and nearer its own person than any other participant)
              if (R.speakers.some(sp => (id !== 'reader' || sp.index !== R.reader) && gapBox(bx, bD(personBox(G.seats[sp.index]))) < dOwn + 16 / px)) continue;
            }
            const cost = dOwn + (id === 'room' ? 0 : Math.abs(bx.y + bx.h / 2 - (b.y + b.h / 2)) * 0.1);
            if (!best || cost < best.cost) best = {box: bx, v, cost};
          }
        }
        tableMode = false;
        if (!best) { problems.push(`label-${id}`); continue; }
        placed.push(best.box);
        labels.push({key: `el-${id}`, id, box: best.box, v: best.v});
      }
      };
      const placeComm = () => {
      // the communication caption: centred on the room's axis between the two mirrored lines it names, under the board
      if (showKey && commKind && capVs[commKind] && !capBoxes[commKind]) {
        let got = null;
        const bd = bD(G.board), tb = bD(G.table);
        // (first in the band, under the exhibits and their labels, centred between the two rising lines it names)
        {
          const yLow = Math.max(toD({x: 0, y: numBottom}).y, ...placed.filter(q => q.y < C.planRect.y).map(q => q.y + q.h)) + 10;
          const xs = conns.filter(c => c.tmpl).map(c => c.pts.map(q => q.x)).flat();
          const xl = Math.min(...xs), xr = Math.max(...xs);
          for (const v of capVs[commKind]) {
            const bx = {x: toD({x: Cx, y: 0}).x - v.w / 2, y: yLow, w: v.w, h: v.h};
            if (bx.y + bx.h > C.planRect.y - 8 || bx.x < xl + 10 || bx.x + bx.w > xr - 10) continue;
            if (lineHits(bx, 8) || placed.some(q => overlaps(bx, q, 10))) continue;
            got = {box: bx, m: v};
            break;
          }
        }
        if (!got) for (const v of capVs[commKind]) {
          for (let y = bd.y + bd.h + 10; y + v.h <= tb.y - 8 && !got; y += 6) {
            const bx = {x: toD({x: Cx, y: 0}).x - v.w / 2, y, w: v.w, h: v.h};
            if (free(bx, {linePad: 8})) got = {box: bx, m: v};
          }
          if (got) break;
        }
        // (else anywhere on the free floor between the two lines it names, nearest the room's axis under the board)
        if (!got) {
          const inner = C.bounds;
          const xs = conns.filter(c => c.tmpl).map(c => c.pts.map(q => q.x)).flat();
          const xl = Math.min(...xs), xr = Math.max(...xs);
          let best = null;
          for (const v of capVs[commKind]) {
            for (let y = inner.y + 4; y <= inner.y + inner.h - v.h - 4; y += 8) for (let x = Math.max(inner.x + 4, xl + 8); x <= Math.min(inner.x + inner.w - v.w - 4, xr - 8 - v.w); x += 8) {
              const bx = {x, y, w: v.w, h: v.h};
              if (!free(bx, {linePad: 8})) continue;
              // (nearest the lines it names, then the room's axis)
              const dLine = Math.min(...conns.filter(c => c.tmpl).map(c => Math.min(...segsOf(c).map(([p0, q0]) => segDist(p0, q0, {x: x + v.w / 2, y: y + v.h / 2})))));
              const cost = dLine * 2 + Math.abs(x + v.w / 2 - toD({x: Cx, y: 0}).x) * 0.3;
              if (!best || cost < best.cost) best = {box: bx, m: v, cost};
            }
            if (best) break;
          }
          if (best) got = best;
        }
        // (last: on the empty table, on the room's axis between the two lines — the exhibits have left it before
        // the caption shows)
        if (!got) for (const v of capVs[commKind]) {
          const tb2 = bD(G.table);
          for (const fy of [0.5, 0.3, 0.7]) {
            const bx = {x: toD({x: Cx, y: 0}).x - v.w / 2, y: tb2.y + (tb2.h - v.h) * fy, w: v.w, h: v.h};
            if (free(bx, {linePad: 8, onTable: true})) { got = {box: bx, m: v}; break; }
          }
          // (or across the table's upper edge, from just under the board down: the reader's label may hold the lower
          // part of the table, beside the lectern)
          const y0 = bd.y + bd.h + 8;
          for (let y = y0; !got && y <= tb2.y + tb2.h - v.h; y += 6) for (const dx of [0, -30, 30, -60, 60]) {
            const bx = {x: toD({x: Cx, y: 0}).x - v.w / 2 + dx, y, w: v.w, h: v.h};
            if (free(bx, {linePad: 8, onTable: true})) { got = {box: bx, m: v}; break; }
          }
          if (got) break;
        }
        if (!got) problems.push(`cap-${commKind}`);
        else { capBoxes[commKind] = got; placed.push(got.box); }
      }
      };
      const placeOther = () => {
      // any other kind (a supplied causal or sequence link between two pieces): beside its first line
      for (const kd of kindsUsed) {
        if (!showKey || capBoxes[kd] || kd === commKind || kd === bundleKind) continue;
        const c = conns.find(q => q.rel.kind === kd);
        if (!c) { problems.push(`cap-${kd}`); continue; }
        let best = null;
        for (const v of capVs[kd]) {
          for (const f of [0.5, 0.35, 0.65, 0.2, 0.8]) for (const side of [1, -1]) for (const off of [10, 24, 40]) {
            const L0 = Math.hypot(c.b.x - c.a.x, c.b.y - c.a.y) || 1;
            const nx = -(c.b.y - c.a.y) / L0, ny = (c.b.x - c.a.x) / L0;
            const ext = Math.abs(nx) * v.w / 2 + Math.abs(ny) * v.h / 2;
            const mx = lerp(c.a.x, c.b.x, f) + nx * side * (off + ext), my = lerp(c.a.y, c.b.y, f) + ny * side * (off + ext);
            const bx = {x: mx - v.w / 2, y: my - v.h / 2, w: v.w, h: v.h};
            if (!inside(bx, box, 0) || placed.some(q => overlaps(bx, q, 10)) || people.some(q => boxDist(bx, q) < q.rad + 4)) continue;
            if (overlaps(bx, C.planRect, 0) && !free(bx, {linePad: 4})) continue;
            if (segs.some(([p, q]) => !(p === c.a && q === c.b) && segHitsBox(p, q, bx, 4)) || segHitsBox(c.a, c.b, bx, 4)) continue;
            const cost = Math.abs(f - 0.5) * 20 + off;
            if (!best || cost < best.cost) best = {box: bx, m: v, cost};
          }
          if (best) break;
        }
        if (!best) problems.push(`cap-${kd}`);
        else { capBoxes[kd] = best; placed.push(best.box); }
      }
      };
      {
        const snap = {placed: placed.length, labels: labels.length, caps: {...capBoxes}, probs: problems.length};
        placeEls(true); placeComm(); placeOther();
        if (problems.slice(snap.probs).some(q => /^(cap|label)-/.test(q))) {
          placed.length = snap.placed; labels.length = snap.labels; problems.length = snap.probs;
          for (const kk of Object.keys(capBoxes)) delete capBoxes[kk];
          Object.assign(capBoxes, snap.caps);
          placeComm(); placeOther(); placeEls(false);
        }
      }
      // ---- every label and caption on the room's floor stands by its own target; when the free floor beside it is taken
      // (a crowded 1:1 frame) a leader runs from its frame to the target's edge (design units). (The communication
      // caption in the band, off 1:1, stands centred between the two mirrored lines it names, as accepted.)
      const near = {};
      {
        const toBox = (bx, pt) => ({x: clamp(pt.x, bx.x, bx.x + bx.w), y: clamp(pt.y, bx.y, bx.y + bx.h)});
        // (the nearest target point whose leader crosses no other label, caption, person or fixture; else the nearest)
        const allBoxes = [...labels.map(q => q.box), ...Object.values(capBoxes).map(q => q.box)];
        // (a leader prefers the floor: its run over the table counts double)
        const tbl = bD({x: G.table.x - 10, y: G.table.y - 10, w: G.table.w + 20, h: G.table.h + 20});
        const overTable = (a0, b0) => { let n = 0; for (let i = 0; i < 24; i++) { const x0 = lerp(a0.x, b0.x, (i + 0.5) / 24), y0 = lerp(a0.y, b0.y, (i + 0.5) / 24); if (x0 > tbl.x && x0 < tbl.x + tbl.w && y0 > tbl.y && y0 < tbl.y + tbl.h) n++; } return (n / 24) * Math.hypot(b0.x - a0.x, b0.y - a0.y); };
        const viaPts = (bx, pts, ownPerson) => {
          const cand = pts.map(pt => { const q = toBox(bx, pt); const gap = Math.hypot(q.x - pt.x, q.y - pt.y); return {gap, a: q, b: pt, cost: gap + overTable(q, pt)}; }).sort((p0, q0) => p0.cost - q0.cost);
          const clearOf = c => allBoxes.every(o => o === bx || !segHitsBox(c.a, c.b, o, 3))
            && people.every((pp, pi) => pi === ownPerson || segDist(c.a, c.b, pp) > pp.rad + 2)
            && roomObs.slice(0, 1).every(o => !segHitsBox(c.a, c.b, o, 0) || overlaps(bx, o, 0));
          const ok = cand.find(clearOf);
          return ok ? {...ok, clear: true} : cand[0] ? {...cand[0], clear: false} : null;
        };
        const rectPts = rc => { const out = []; for (let i = 0; i <= 12; i++) { out.push({x: lerp(rc.x, rc.x + rc.w, i / 12), y: rc.y}, {x: lerp(rc.x, rc.x + rc.w, i / 12), y: rc.y + rc.h}); out.push({x: rc.x, y: lerp(rc.y, rc.y + rc.h, i / 12)}, {x: rc.x + rc.w, y: lerp(rc.y, rc.y + rc.h, i / 12)}); } return out; };
        const circPts = (c, rad) => Array.from({length: 48}, (_, i) => ({x: c.x + rad * Math.cos((i / 48) * 2 * Math.PI), y: c.y + rad * Math.sin((i / 48) * 2 * Math.PI)}));
        const segPts = ss => ss.flatMap(([p0, q0]) => { const n = Math.max(2, Math.ceil(Math.hypot(q0.x - p0.x, q0.y - p0.y) / 4)); return Array.from({length: n + 1}, (_, i) => ({x: lerp(p0.x, q0.x, i / n), y: lerp(p0.y, q0.y, i / n)})); });
        const l = G.lectern;
        const targets = {
          'el-reader': () => [...rectPts(bD({x: l.cx - 29, y: l.cy - 0.35 * 58, w: 58, h: 0.7 * 58})), ...circPts(C.people[R.reader], C.rad)],
          'el-clock': () => circPts(toD({x: G.clock.cx, y: G.clock.cy}), G.clock.R * k),
          [`cap-${commKind}`]: () => segPts(conns.filter(c => c.tmpl).flatMap(segsOf)),
        };
        const items = [...labels.filter(q => targets[q.key]).map(q => ({key: q.key, box: q.box, rec: q})), ...(commKind && capBoxes[commKind] && conns.some(c => c.tmpl) && overlaps(capBoxes[commKind].box, C.planRect, 0) ? [{key: `cap-${commKind}`, box: capBoxes[commKind].box, rec: capBoxes[commKind]}] : [])];
        for (const it of items) {
          const v = viaPts(it.box, targets[it.key](), it.key === 'el-reader' ? R.reader : -1);
          if (!v) continue;
          const gapPx = v.gap * px;
          near[it.key] = {gapPx: r(gapPx, 1), leader: gapPx > LEAD_PX};
          if (gapPx > LEAD_PX) {
            it.rec.leader = {a: v.a, b: v.b};
            // (a leader that would run under another label, a person or the board is no leader: the composition fails)
            if (!v.clear) problems.push(`leader-blocked-${it.key}`);
          }
        }
      }
      // participant number badges (keyed to the panel), off every line and label
      const badgeR = F * 0.78;
      let badges = [];
      if (showKey) {
        const leadSegs = [...labels, ...Object.values(capBoxes)].filter(q => q.leader).map(q => [q.leader.a, q.leader.b]);
        const lineBoxes = [...segs, ...leadSegs].flatMap(([p, q]) => Array.from({length: 17}, (_, i) => ({x: lerp(p.x, q.x, i / 16) - 4, y: lerp(p.y, q.y, i / 16) - 4, w: 8, h: 8})));
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: toD(G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: people, boxes: [...roomObs, ...lineBoxes, ...placed], anchors: R.speakers.map(sp => toD(G.seats[sp.index]))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
      }
      const out = {C, G, k, problems, bandH, cards, exhibits, links, offs, boxes, conns, labels, capBoxes, badges, badgeR, near, planBox: {x: box.x, y: Math.min(C.planRect.y, ...labels.map(q => q.box.y), toD({x: 0, y: cardY}).y), w: box.w, h: 0}};
      out.planBox.h = C.planRect.y + C.planRect.h - out.planBox.y;
      memo.set(key, out);
      return out;
    };
    const floor1 = ctx.view.shape === 'square' ? 55.5 : 61;
    // the search: the largest text size at which some panel arrangement and band share composes (every share is tried
    // at each size — validity is not monotonic in the size here); then the best of those by people size
    const SIZES = [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4];
    // (a 1:1 frame composes with the panel at the right only: a panel band under the plan leaves the people too small)
    const SCALES = sq ? [0.42, 0.48, 0.54] : [0.36, 0.42, 0.48, 0.54];
    // (sizes in the order tried: 19.5 px first; when it composes, the larger ones from the largest down; else the smaller
    // ones from the largest down — the first that composes wins)
    const run = minPersonPx => {
      let first = null;
      const logs = [];
      const at = (Fpx) => searchLr(ctx, rows, {
        sizes: [Fpx], minF: Fpx, minPersonPx,
        colFracs: sq ? [0.25, 0.3, 0.35, 0.39, 0.44] : [0.25, 0.3, 0.35], bandCols: sq ? [3, 4] : [2, 3], sidePanels: sq ? [[0.46, 2]] : [[0.4, 2], [0.46, 2]], scales: SCALES, targetPx: 1e9,
        compose: (box, F, bandF) => {
          const c = compose(box, F, bandF);
          return {k: c.C.k, problems: c.problems, x: c};
        },
      });
      const pivot = SIZES.includes(19.5) ? 19.5 : SIZES[0];
      const r0 = at(pivot);
      logs.push(...(r0.log || []));
      const order = !r0.problems.length ? SIZES.filter(v => v > pivot) : SIZES.filter(v => v < pivot);
      if (!r0.problems.length) {
        // (every size from 19.5 px up is weighed: larger people first — up to 90 px —, then the larger text)
        const val = q => Math.min(q.personPx, 90) + 3 * q.F * px;
        let bestR = r0;
        for (const Fpx of order) {
          const res = at(Fpx);
          logs.push(...(res.log || []));
          if (!res.problems.length && val(res) > val(bestR)) bestR = res;
        }
        bestR.log = logs;
        return bestR;
      }
      first = r0;
      for (const Fpx of order) {
        const res = at(Fpx);
        logs.push(...(res.log || []));
        if (!first) first = res;
        if (!res.problems.length) { res.log = logs; return res; }
      }
      first.log = logs;
      return first;
    };
    const runAll = () => {
      let b0 = run(floor1);
      if (b0.problems.length && ctx.view.shape === 'square') {
        const b2 = run(45);
        if (b2.problems.length <= b0.problems.length) b0 = b2;
      }
      return b0;
    };
    let best = runAll();
    if (best.problems.length && ctx.view.shape === 'square') {
      bigGap = true;
      const b2 = runAll();
      if (b2.problems.length < best.problems.length) best = b2; else bigGap = false;
    }
    // (the crowded 1:1 stress frame only: the fixtures' labels, then the reader's label, move to the panel)
    for (const set of [['room', 'clock'], ['room', 'clock', 'reader']]) {
      const fx = set.filter(id => present.has(id));
      if (!best.problems.length || ctx.view.shape !== 'square' || !fx.length) break;
      const keep = inPanel;
      inPanel = new Set(fx);
      rows = rowsFor();
      const b2 = runAll();
      if (b2.problems.length < best.problems.length) best = b2;
      else { inPanel = keep; rows = rowsFor(); }
    }
    const X = best.C.x;
    const {F, lay} = best;
    const C = X.C, G = X.G;
    const problems = [...best.problems];
    // the room as in the story; the cards and exhibits are moved out by frame(); the exhibit links are drawn by the kit
    // and placed on the exploded pieces by frame()
    const room = lrRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, cardFits: G.cardFits, sides: SIDES.filter(s => bundle[s]), linkStyle});
    // relationship windows: a relationship and its mirror on the other side share one window (A and B at the same pace)
    const slots = [];
    const placedR = new Set();
    rels.forEach((rel, i) => {
      if (placedR.has(i)) return;
      const j = rels.findIndex((q, jj) => jj !== i && !placedR.has(jj) && q.kind === rel.kind && q.from === mirrorId(rel.from) && q.to === mirrorId(rel.to) && (q.from !== rel.from || q.to !== rel.to));
      const slot = [i];
      placedR.add(i);
      if (j >= 0) { slot.push(j); placedR.add(j); }
      slots.push(slot);
    });
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, slots.length);
    const relWin = [];
    slots.forEach((slot, si) => slot.forEach(i => { relWin[i] = [W.relate[0] + si * span, W.relate[0] + (si + 0.82) * span]; }));
    // a kind's caption appears with the first relationship of that kind
    const capWin = {};
    rels.forEach((rel, i) => { const w0 = relWin[i]; if (w0 && (!capWin[rel.kind] || w0[0] < capWin[rel.kind][0])) capWin[rel.kind] = [w0[0], w0[0] + (w0[1] - w0[0]) * 0.4]; });
    // the tracer route(s): the supplied traversal and its mirror on the other side, at the same time (design units)
    const legOf = (a, b) => {
      const rel = rels.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
      if (!rel) return null;
      if (isBundle(rel)) {
        const s = sideOf(a) || sideOf(b);
        const lk = X.links[s][0];
        if (!lk) return null;
        const pts = [C.toD(lk.from), C.toD(lk.to)];
        return a.startsWith('section-') ? pts : pts.reverse();
      }
      const c = X.conns.find(q => q.rel === rel);
      if (!c) return null;
      return c.rel.from === a ? [...c.pts] : [...c.pts].reverse();
    };
    const trav = (P.traversalOrder || []).filter(id => present.has(id));
    const routes = [];
    const mk = order => {
      const legs = [];
      for (let i = 1; i < order.length; i++) {
        const pts = legOf(order[i - 1], order[i]);
        if (!pts) return {legs, missing: `${order[i - 1]}-${order[i]}`};
        // (the tracer rides the line but stops short of each element's edge: it never covers a card's text)
        const n = pts.length;
        const p0 = pts[0], p1 = pts[1], pm = pts[n - 2], pn = pts[n - 1];
        const L0 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1, Ln = Math.hypot(pn.x - pm.x, pn.y - pm.y) || 1;
        const c0 = Math.min(16, L0 * 0.3), cn = Math.min(16, Ln * 0.3);
        const q0 = {x: p0.x + ((p1.x - p0.x) / L0) * c0, y: p0.y + ((p1.y - p0.y) / L0) * c0};
        const q1 = {x: pn.x - ((pn.x - pm.x) / Ln) * cn, y: pn.y - ((pn.y - pm.y) / Ln) * cn};
        const qs = [q0, ...pts.slice(1, n - 1), q1];
        legs.push({a: order[i - 1], b: order[i], pts: qs, poly: polyline(qs)});
      }
      return {legs};
    };
    const main = mk(trav);
    if (main.missing) problems.push(`traversal-${main.missing}`);
    routes.push({order: trav, legs: main.legs});
    const mirror = trav.map(mirrorId);
    if (mirror.join() !== trav.join() && mirror.every(id => present.has(id))) {
      const m2 = mk(mirror);
      if (!m2.missing) routes.push({order: mirror, legs: m2.legs});
    }
    const dyC = centreShiftY(ctx.design, [X.planBox, best.panelBox, ...(X.badges || []).map(q => q.box)]);
    return {P, R, F, px, C, G, X, room, lay, rows, inPanel: [...inPanel], rels, conns: X.conns, relWin, capWin, routes, trav, bundle, linkStyle, elements, present, problems, personPx: best.personPx, showKey, dyC, log: best.log};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C, X} = L;
    const panel = L.lay ? L.lay.rows.map(m => lrRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    // the same neutral frame (stroke, colour, opacity) round both exploded cards
    const frame = (name, q) => h('path', {name, opacity: 0, d: roundRectPath(q.x - 8, q.y - 8, q.w + 16, q.h + 16, 11), fill: 'none', stroke: th.accent3, 'stroke-width': r(5.5 / C.k, 2)});
    const conns = L.conns.map(c => {
      const cc = linkColor(th, c.rel.kind);
      const kind = c.rel.kind;
      return g({name: `conn${c.i}`, opacity: 0, 'data-from': c.rel.from, 'data-to': c.rel.to, 'data-kind': kind},
        h('path', {name: `conn${c.i}-line`, d: `M${r(c.a.x)} ${r(c.a.y)}L${r(c.a.x)} ${r(c.a.y)}`, fill: 'none', stroke: cc, 'stroke-width': kind === 'causal' ? 5 : 4, 'stroke-linecap': 'round'}),
        h('circle', {name: `conn${c.i}-s`, cx: r(c.a.x), cy: r(c.a.y), r: 6, fill: cc}),
        g({name: `conn${c.i}-end`, opacity: 0, transform: 'translate(0 0) rotate(0)'},
          kind === 'relation' ? h('circle', {r: 6, fill: cc})
            : kind === 'communication' ? h('circle', {r: 7, fill: th.card, stroke: cc, 'stroke-width': 3})
              : kind === 'sequence' ? h('rect', {x: -6, y: -6, width: 12, height: 12, fill: cc})
                : h('path', {d: 'M0 0L-18 -9L-18 9Z', fill: cc})));
    });
    // (a leader: from the label's frame to its target's edge, ending in a small dot on the target)
    const leaderNode = (name, ld) => (ld ? g({name: `${name}-leader`, 'data-to': `${r(ld.b.x)},${r(ld.b.y)}`},
      h('path', {d: `M${r(ld.a.x)} ${r(ld.a.y)}L${r(ld.b.x)} ${r(ld.b.y)}`, stroke: '#5b6470', 'stroke-width': 2.2, 'stroke-linecap': 'round', fill: 'none'}),
      h('circle', {cx: r(ld.b.x), cy: r(ld.b.y), r: 4, fill: '#5b6470'})) : null);
    const chipNode = (name, bx, v, ld) => g({name, opacity: 0},
      leaderNode(name, ld),
      h('path', {name: `${name}-body`, d: roundRectPath(bx.x, bx.y, bx.w, bx.h, 7), fill: '#ffffff', stroke: '#5b6470', 'stroke-width': 1.6}),
      textAt(v.fit, bx.x + v.padX, bx.y + v.padY, INK));
    const capNode = (kd, cb) => {
      const m = {...(cb.m.inner || cb.m), x: cb.box.x + CAP_PX / 2, y: cb.box.y + CAP_PY / 2};
      const bg = h('path', {name: `cap-${kd}-body`, d: roundRectPath(cb.box.x, cb.box.y, cb.box.w, cb.box.h, 7), fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 1.4});
      return g({name: `cap-${kd}`, opacity: 0}, leaderNode(`cap-${kd}`, cb.leader), bg, lrRowNode(ctx, m, {name: `cap-${kd}-row`}));
    };
    const capsB = Object.entries(X.capBoxes).map(([kd, cb]) => capNode(kd, cb));
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, frame('fr-a', X.cards.a), frame('fr-b', X.cards.b)),
      conns,
      g({name: 'el-labels'}, X.labels.map(q => chipNode(q.key, q.box, q.v, q.leader))),
      g({name: 'captions'}, capsB),
      (X.badges || []).map(b => g({name: b.key},
        h('circle', {cx: r(b.box.x + b.box.w / 2), cy: r(b.box.y + b.box.h / 2), r: r(X.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
        h('text', {x: r(b.box.x + b.box.w / 2), y: r(b.box.y + b.box.h / 2 + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)))),
      L.routes.map((_, ri) => h('circle', {name: `tracer${ri}`, r: 11, fill: th.accent3, stroke: '#ffffff', 'stroke-width': 3, opacity: 0})),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C, X} = L;
    const nodes = {};
    const spread = ease.inOutCubic(seg(u, ...W.spread));
    const relP = L.rels.map((_, i) => (L.relWin[i] ? seg(u, ...L.relWin[i]) : 0));
    const draw = {a: [], b: []};
    for (const s of SIDES) {
      const rel = L.bundle[s];
      const p = rel ? relP[L.rels.indexOf(rel)] : 0;
      G.links[s].forEach((_, j) => { draw[s][j] = p; });
    }
    // the tracer(s): one leg after the other, the same legs' timing on both routes
    const nLegs = Math.max(1, ...L.routes.map(rt => rt.legs.length));
    const legSpan = (W.trace[1] - W.trace[0]) / nLegs;
    const visitU = {};
    const tracers = L.routes.map(rt => {
      let at = null;
      rt.legs.forEach((leg, j) => {
        const a0 = W.trace[0] + j * legSpan, a1 = a0 + legSpan * 0.8;
        if (visitU[leg.b] === undefined || a1 < visitU[leg.b]) visitU[leg.b] = a1;
        if (j === 0 && (visitU[leg.a] === undefined || a0 < visitU[leg.a])) visitU[leg.a] = a0;
        if (u >= a0 && u < a1) { const p = leg.poly.at(ease.inOutSine(seg(u, a0, a1))); at = {x: p.x, y: p.y}; }
      });
      return at;
    });
    const pulse = id => { const v = visitU[id]; if (v === undefined) return 1; return 1 + (id === L.P.focusElement ? 0.12 : 0.06) * Math.sin(Math.PI * seg(u, v - 0.02, v + 0.05)); };
    const cardScale = {a: pulse('section-a'), b: pulse('section-b')};
    const exPulse = pulse('paragraphs');
    const exScale = lerp(1, EXK, spread) * exPulse;
    const personScale = {};
    personScale[R.reader] = pulse('reader');
    const fr = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), draw, cardScale: {a: 1, b: 1}, tableScale: 1, personScale});
    Object.assign(nodes, fr.nodes);
    // the exploded pieces: each card from its place on the board to the band (scaled about the middle of its lower
    // edge), each exhibit from the table to its slot in the row (scaled about its centre)
    const cardAt = (s, p) => {
      const cb = G.card[s], o = X.offs.card[s], sc = cardScale[s];
      const c0 = {x: cb.x + cb.w / 2, y: cb.y + cb.h};
      return {x: c0.x + o.x * spread + sc * (p.x - c0.x), y: c0.y + o.y * spread + sc * (p.y - c0.y)};
    };
    const exAt = (i, p) => {
      const e = G.exhibits[i], o = X.offs.ex[i];
      return {x: e.cx + o.x * spread + exScale * (p.x - e.cx), y: e.cy + o.y * spread + exScale * (p.y - e.cy)};
    };
    for (const s of SIDES) {
      const cb = G.card[s], o = X.offs.card[s], sc = cardScale[s];
      const c0 = {x: cb.x + cb.w / 2, y: cb.y + cb.h};
      nodes[`rm-card-${s}`] = {...(nodes[`rm-card-${s}`] || {}), transform: `translate(${r(o.x * spread + c0.x * (1 - sc), 3)} ${r(o.y * spread + c0.y * (1 - sc), 3)}) scale(${r(sc, 4)})`};
    }
    G.exhibits.forEach((e, i) => {
      const o = X.offs.ex[i];
      nodes[`rm-ex${i}`] = {transform: `translate(${r(o.x * spread + e.cx * (1 - exScale), 3)} ${r(o.y * spread + e.cy * (1 - exScale), 3)}) scale(${r(exScale, 4)})`};
      if (G.Ft) {
        // (the number disc keeps its size and stays just under the enlarged exhibit: a counter-scale about its centre)
        const nF = G.Ft, numY = e.cy + e.s * EXH / 2 + 6 + nF * 0.85;
        const want = e.cy + exScale * e.s * EXH / 2 + 6 + nF * 0.85;
        const cy2 = e.cy + (want - e.cy) / exScale;
        nodes[`rm-exnum${i}`] = {...(nodes[`rm-exnum${i}`] || {}), transform: `translate(${r(e.cx - e.cx / exScale, 3)} ${r(cy2 - numY / exScale, 3)}) scale(${r(1 / exScale, 4)})`};
      }
    });
    // the exhibit links on the exploded pieces (template units: they are drawn inside the plan); the exploded link ends
    // are mapped back to the pieces' rest frame and then through their current transform
    const tips = {a: [], b: []};
    for (const s of SIDES) {
      if (!L.bundle[s]) continue;
      X.links[s].forEach((lk, j) => {
        const cb = G.card[s], oc = X.offs.card[s];
        const from = cardAt(s, {x: lk.from.x - oc.x, y: lk.from.y - oc.y});
        const e0 = G.exhibits[lk.ex], e1 = X.exhibits[lk.ex];
        const to = exAt(lk.ex, {x: e0.cx + (lk.to.x - e1.cx) / EXK, y: e0.cy + (lk.to.y - e1.cy) / EXK});
        void cb;
        const q = clamp(draw[s][j] ?? 0);
        const e = ease.inOutSine(q);
        const tip = {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e)};
        tips[s][j] = tip;
        nodes[`rm-link-${s}${j}`] = {opacity: q > 0 ? 1 : 0, d: `M${r(from.x)} ${r(from.y)}L${r(tip.x)} ${r(tip.y)}`, 'data-ex': String(lk.ex), 'data-full': q >= 1 ? 1 : 0};
        nodes[`rm-link-${s}${j}-s`] = {opacity: q > 0 ? 1 : 0, cx: r(from.x), cy: r(from.y)};
        const runL = Math.hypot(tip.x - from.x, tip.y - from.y);
        nodes[`rm-link-${s}${j}-m`] = {opacity: r(q > 0 ? clamp((runL - 8.5 - 10) / 14) : 0, 3), transform: `translate(${r(tip.x)} ${r(tip.y)})`};
      });
    }
    // the generic connectors follow their ends (the reader's line ends on its card wherever the card is drawn)
    L.conns.forEach(c => {
      const p = relP[c.i];
      let pts = c.pts;
      if (c.tmpl) {
        // (the hollow end hangs just under the card's lower edge, touching it: never over the card's text; the line
        // leaves the lectern sideways and rises straight to it)
        const port0 = C.toD(cardAt(c.tmpl.side, c.tmpl.port));
        const port = {x: port0.x, y: port0.y + 9};
        const front = C.toD(c.tmpl.front);
        const q = commRoute(c.tmpl, front, port);
        pts = c.tmpl.partyFirst ? q : q.reverse();
      }
      const a = pts[0], b = pts[pts.length - 1], bm = pts[pts.length - 2];
      const e = ease.inOutSine(p);
      const poly = polyline(pts);
      const tipP = poly.at(e);
      const done = pts.filter((_, j) => j > 0 && j < pts.length - 1 && poly.total * e >= pts.slice(1, j + 1).reduce((acc, q2, jj) => acc + Math.hypot(q2.x - pts[jj].x, q2.y - pts[jj].y), 0));
      const ang = (Math.atan2(b.y - bm.y, b.x - bm.x) * 180) / Math.PI;
      nodes[`conn${c.i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`conn${c.i}-line`] = {d: [a, ...done, tipP].map((q2, j) => `${j ? 'L' : 'M'}${r(q2.x)} ${r(q2.y)}`).join('')};
      nodes[`conn${c.i}-s`] = {cx: r(a.x), cy: r(a.y)};
      const back = c.tmpl || c.rel.kind === 'causal' ? 0 : 7.5;
      const L0 = Math.hypot(b.x - bm.x, b.y - bm.y) || 1;
      const ex = {x: b.x - ((b.x - bm.x) / L0) * back, y: b.y - ((b.y - bm.y) / L0) * back};
      nodes[`conn${c.i}-end`] = {opacity: r(seg(p, 0.85, 1), 3), transform: `translate(${r(ex.x)} ${r(ex.y)}) rotate(${r(ang, 2)})`};
    });
    L.routes.forEach((_, ri) => { const t = tracers[ri]; nodes[`tracer${ri}`] = t ? {cx: r(t.x), cy: r(t.y), opacity: 1} : {cx: 0, cy: 0, opacity: 0}; });
    // labels on the plan: once the pieces have separated; each kind's caption with its first relationship
    const labOp = r(seg(u, ...W.labels), 3);
    for (const q of X.labels) nodes[q.key] = {opacity: labOp};
    for (const kd of Object.keys(X.capBoxes)) nodes[`cap-${kd}`] = {opacity: r(L.capWin[kd] ? seg(u, ...L.capWin[kd]) : 0, 3)};
    const allDrawn = relP.every(q => q >= 1);
    const frOp = allDrawn ? seg(u, ...W.frames) : 0;
    nodes['fr-a'] = {opacity: r(frOp, 3)};
    nodes['fr-b'] = {opacity: r(frOp, 3)};
    (X.badges || []).forEach(b => { nodes[b.key] = {opacity: 1}; });
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const state = s => (!draw[s].length || !L.bundle[s] ? 'none' : draw[s].every(q => q >= 1) ? 'linked' : draw[s].some(q => q > 0) ? 'linking' : 'none');
    const cA = C.toD(cardAt('a', {x: G.card.a.x, y: G.card.a.y})), cB = C.toD(cardAt('b', {x: G.card.b.x, y: G.card.b.y}));
    return {
      nodes,
      semantic: {
        beat,
        spread: r(spread, 3),
        drawn: relP.map(q => r(q, 3)),
        kinds: L.rels.map(q => q.kind),
        drawA: draw.a.map(q => r(q, 3)),
        drawB: draw.b.map(q => r(q, 3)),
        linkStateA: state('a'),
        linkStateB: state('b'),
        linksA: G.links.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        tracer: tracers[0] ? R2(tracers[0]) : null,
        tracer2: tracers[1] ? R2(tracers[1]) : null,
        routes: L.routes.length,
        focus: L.P.focusElement,
        focusScale: r(L.P.focusElement === 'paragraphs' ? exPulse : L.P.focusElement.startsWith('section-') ? cardScale[sideOf(L.P.focusElement)] : L.P.focusElement === 'reader' ? personScale[R.reader] : 1, 3),
        cardScale: {a: r(cardScale.a, 3), b: r(cardScale.b, 3)},
        frames: r(frOp, 3),
        labels: labOp,
        captions: Object.keys(X.capBoxes),
        // (each floor label's gap to its own target, px at 1080p, and whether a leader runs to it)
        labelGaps: X.near,
        onPlan: X.labels.map(q => q.id),
        trav: L.trav.join('>'),
        cardA: R2(cA),
        cardB: R2(cB),
        // (the exploded pieces: both cards and the exhibit row outside the room, above its top wall)
        outOfRoom: r(spread, 3) >= 1 ? ['a', 'b'].every(s => C.toD(cardAt(s, {x: 0, y: G.card[s].y + G.card[s].h})).y < C.planRect.y) && G.exhibits.every((e, i) => C.toD(exAt(i, {x: e.cx, y: e.cy + e.s * EXH / 2})).y < C.planRect.y) : false,
        boardLeft: G.left,
        reader: R.reader,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        allReached: fr.reached,
        tips: {a: tips.a.map(R2), b: tips.b.map(R2)},
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
    slug: 'hearings-10-mechanism',
    title: 'Reading of a document — the pieces of its separation into sections and paragraphs, and their relationships',
    titleEs: 'Lectura de resolución — Mecanismo o relación explicada',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Lectura de resolución',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of a generic hearing room after the reading: the two section cards (headings and neutral placeholder bars only) leave the board through the top wall to a band above the room, card A to one side and card B, mirrored, to the other, and the numbered placeholder paragraphs lift off the table to a row between them; the reader stays at the lectern. Each piece is labelled on the plan. Only the supplied relationships are drawn, with their kind captioned on the plan (the reader reads out each section; each section is linked to every paragraph placed in it, as supplied); a relationship and its mirror on the other side are drawn together. A tracer follows the supplied traversal and a second one its mirror, at the same time; the element reached enlarges, the focus most. Both cards get the same neutral frame. Illustrative; no decision content, nothing is decided and neither section is preferred.',
    tags: ['hearing', 'reading', 'document', 'mechanism', 'exploded view', 'relationships', 'tracer', 'sections', 'paragraphs', 'placeholder text', 'as supplied', 'equal weight', 'labels on the plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/lectura-resolucion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
