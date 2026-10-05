/**
 * LAW-0330 — Solicitud de autorización · mechanism
 *
 * Storyboard (an exploded view of "a petition passes to a prior-examination
 * tray": its pieces are pulled apart and laid out on the page, not in a room; the
 * stations are abstract, fictional and of the SAME size on ONE row; each has a
 * neutral two-slot tray, the last stop's being the prior-examination tray (a
 * plain tab marks it); the petition is a placeholder sheet; the supplied
 * decision, when supplied, a placeholder sheet whose content is never shown):
 *  0.00–0.18  separate: the pieces start close together — each station's plate
 *             with its tray just under it, the path's numbered steps just under
 *             the trays, the petition in its column and the state piece beside
 *             (or under) the path, both a little smaller — and are pulled apart:
 *             the trays drop from their plates, the steps from the trays, the
 *             petition and the state piece grow to full size.
 *  0.18–0.43  only the supplied relationships are drawn, in their kind's style (a
 *             plain relation has end dots and no arrowhead; causal only when
 *             supplied); every link of one relationship in the same window.
 *  0.43–0.75  a tracer follows the supplied traversal along the drawn links — and,
 *             on the path, along every numbered step in the supplied order to the
 *             prior-examination tray; the element it reaches enlarges a little,
 *             the focus element most.
 *  0.75–1.00  gather: everything stays visible (the pieces, the links and the
 *             supplied state: ● authorization requested — the petition alone — or
 *             ◆ decision supplied — the decision's placeholder sheet in the
 *             prior-examination tray's other slot; equal weight); the key "as
 *             supplied · no conclusion drawn". No criterion, threshold, time
 *             limit, rank or outcome is drawn.
 * @module animations/review/LAW-0330
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, cubic, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {pxPerUnit, R2, textAt, centreShiftY, FONT} from '../hearings/kits/apertura-audiencia.js';
import {stateGlyph} from '../hearings/kits/hearings-art.js';
import {saFields, SA_EN, SA_ES, localisedSa, resolveSa, searchSa, saRowNode, fitSa, hasLoneWord, untangleDepths, placeClearDiscs, docArt, decArt, examTab, stateIcon, statusDisc, linkColor, LINE, LETTERS, INK} from './kits/solicitud-autorizacion.js';

const ID = 'LAW-0330';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {spread: [0.03, 0.15], relate: [0.18, 0.41], trace: [0.45, 0.72]};
const IDS = ['document', 'bodies', 'trays', 'route', 'state'];
const LINKS = ['document-bodies', 'bodies-trays', 'trays-route', 'state-route'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const OWN_EN = {
  suppliedState: 'a',
  elements: [
    {id: 'document', label: 'Placeholder sheet'},
    {id: 'bodies', label: 'Stations (fictional, all the same size)'},
    {id: 'trays', label: 'Two-slot tray of each station (neutral)'},
    {id: 'route', label: 'Configured path: the numbered steps'},
    {id: 'state', label: 'Supplied state of the tray (as supplied)'},
  ],
  relationships: [
    {link: 'document-bodies', kind: 'relation'},
    {link: 'bodies-trays', kind: 'relation'},
    {link: 'trays-route', kind: 'relation'},
    {link: 'state-route', kind: 'relation'},
  ],
  focusElement: 'trays',
  relationLabels: {relation: 'Linked as configured (as supplied)', communication: 'Passed on as supplied', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['document', 'bodies', 'trays', 'route'],
};
const OWN_ES = {
  suppliedState: 'a',
  elements: [
    {id: 'document', label: 'Hoja provisional'},
    {id: 'bodies', label: 'Puestos (ficticios, todos del mismo tamaño)'},
    {id: 'trays', label: 'Bandeja de dos huecos de cada puesto (neutra)'},
    {id: 'route', label: 'Recorrido configurado: los pasos numerados'},
    {id: 'state', label: 'Estado aportado de la bandeja (según lo aportado)'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'trays',
  relationLabels: {relation: 'Vínculo configurado (según lo aportado)', communication: 'Transmitido según lo aportado', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (según lo aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...SA_EN, ...OWN_EN};
const ES = {...SA_ES, ...OWN_ES};

const sceneSchema = {
  ...saFields,
  suppliedState: oneOf('The supplied state shown on the state piece: a (● authorization requested — the petition alone) or b (◆ decision supplied — the decision\'s placeholder sheet, content never shown, lies in the prior-examination tray\'s other slot); equal weight', ['a', 'b']),
  elements: list('Labels of the pieces (listed in the panel beside each piece\'s glyph); ids are fixed by the scene, labels are editable', obj('Element', {
    id: oneOf('Element id', IDS),
    label: str('Visible label', 60),
  }, ['id', 'label']), 2, 5),
  relationships: list('Explicit relationships between pieces; the kind sets the line (a plain relation has end dots and no arrowhead; causal only when supplied). A link not listed is not drawn', obj('Relationship', {
    link: oneOf('Which two pieces it links: the petition and the first station of the path, each station and its tray, the trays and the steps that start or end there, the state and the path', LINKS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
  }, ['link', 'kind']), 1, 4),
  focusElement: oneOf('Element enlarged most when the tracer reaches it', IDS),
  relationLabels: obj('Caption of each relation kind (listed in the panel beside the line style)', {
    relation: str('Caption for plain relations', 60),
    communication: str('Caption for communications', 60),
    sequence: str('Caption for sequence links (keep "as configured")', 60),
    causal: str('Caption for supplied causal links', 60),
  }),
  traversalOrder: list('Order in which the tracer visits the pieces; it moves along a drawn link between two consecutive pieces (and along every step of the route), and starts afresh where no link joins them', oneOf('Element id', IDS), 2, 6),
};

const defaultParams = {...EN};

/** The point at arc length s of a polyline (and the polyline's own total). */
const ptsLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; };

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedSa(ctx, EN, ES);
    const R = resolveSa(ctx, P);
    const px = pxPerUnit(ctx);
    const showKey = ctx.show('key');
    const side = P.suppliedState === 'b' ? 'b' : 'a';
    const seen = new Set();
    const elements = (P.elements || []).filter(e => IDS.includes(e.id) && !seen.has(e.id) && seen.add(e.id));
    const label = id => (elements.find(e => e.id === id) || {}).label ?? null;
    const lseen = new Set();
    const rels = (P.relationships || []).filter(q => LINKS.includes(q.link) && !lseen.has(q.link) && lseen.add(q.link));
    const relOf = l => rels.find(q => q.link === l) || null;
    const kindsUsed = [...new Set(rels.map(q => q.kind))];
    const GLY = {document: 'doc', bodies: 'station', trays: 'tray', route: 'step', state: 'sign'};
    const rowsFor = names => {
      const rows = [];
      if (!showKey) return rows;
      rows.push({kind: 'heading', text: P.labels.route, name: 'route-name'});
      // (the sheet's row carries the decision's name; the route's row the caption of its numbering)
      for (const e of elements) rows.push({kind: 'legend', glyphKind: GLY[e.id], text: e.id === 'document' ? `${e.label} · ${P.decisions.title}` : e.id === 'route' ? `${e.label} · ${P.labels.sequence}` : e.label, name: `el-${e.id}`});
      if (!elements.some(e => e.id === 'document')) rows.push({kind: 'text', text: P.decisions.title, name: 'doc-title'});
      if (side === 'b') rows.push({kind: 'legend', glyphKind: 'dec', text: P.decisions.supplied, name: 'lg-dec'});
      rows.push({kind: 'legend', glyphKind: 'exam', text: P.labels.exam, name: 'lg-exam'});
      if (names === 'letters') R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
      rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-a'});
      rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-b'});
      for (const kd of kindsUsed) rows.push({kind: 'legend', glyphKind: `kind-${kd}`, text: P.relationLabels[kd] || kd, name: `cap-${kd}`});
      if (!elements.some(e => e.id === 'route')) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
      return rows;
    };
    // ---- the exploded diagram in a box (design units), at unit scale s: every piece's place, assembled and exploded
    const diagramAt = (box, F, s, names, gapK = 1, docTop = box.w / box.h < 1.25, vk = 1) => {
      // (docTop: the sheet stands above the row of bodies instead of beside it, the state piece under the route)
      const problems = [];
      let nameFits = null;
      if (showKey && names !== 'letters') {
        let pick = null;
        for (const q of [5.5, 6.5, 7.5, 8.5, 9.5, 11, 12.5, 14]) {
          const fits = R.bodies.map(b => fitSa(b.label, {maxWidth: F * q, size: F, minSize: F, maxLines: 6, weight: 600}));
          if (fits.some(f => f.truncated)) continue;
          if (fits.every(f => f.lines.length <= 3 && !hasLoneWord(f))) { pick = fits; break; }
        }
        if (!pick) problems.push('name-text');
        nameFits = pick;
      }
      const letter = showKey && names === 'letters' ? F : 0;
      const n = R.n;
      let TW = 96 * s;
      const TH = 70 * s;
      const nameH = nameFits ? Math.max(...nameFits.map(f => f.height)) : letter ? letter * 1.3 : 26 * s;
      const nameW = nameFits ? Math.max(...nameFits.map(f => f.width)) : 0;
      const pad = Math.max(12 * s, nameFits ? F * 0.4 : 0);
      const SW = Math.max(TW + 34 * s, nameW * 1.04 + 2 * pad, letter ? letter * 2 + 30 : 0);
      // (each tray as wide as its plate allows: the pieces read at a glance)
      TW = Math.max(TW, SW - 40 * s);
      const SH = Math.max(nameH + 2 * pad, 64 * s);
      const gapX = 56 * s * gapK;
      const DW = 116 * s, DH = 150 * s;
      const colW = docTop ? 0 : DW + 70 * s;
      const rowW = n * SW + (n - 1) * gapX;
      const chan = 34 * s;
      const docH0 = docTop ? DH + 24 * s : 0;
      // (vk: the explosion opened further in height — the gaps and the steps' depth — when the box has spare height)
      const gap1 = 30 * s * vk, gap2 = 40 * s * vk, gap3 = 40 * s * vk;
      const signW = 132 * s, signH = 110 * s;
      // horizontal: the sheet's column, then the row of bodies
      const totalW = docTop ? Math.max(rowW, DW) : colW + rowW + gapX * 0.8 + signW;
      const x0 = box.x + Math.max(0, (box.w - totalW) / 2);
      const rowX = x0 + colW;
      const yPl = box.y + docH0 + chan;
      const plates = R.bodies.map((_, i) => ({x: rowX + i * (SW + gapX), y: yPl, w: SW, h: SH}));
      const trays = plates.map(p => ({x: p.x + (SW - TW) / 2, y: p.y + p.h + gap1, w: TW, h: TH}));
      const yP = trays[0].y + TH + gap2;
      // the route: one cubic per step, between ports on the trays' lower edges (nested like brackets — see the kit)
      const pairs = [];
      for (let j = 0; j + 1 < R.steps.length; j++) pairs.push([R.steps[j], R.steps[j + 1]]);
      const atSt = plates.map(() => []);
      pairs.forEach(([p, q], j) => { atSt[p].push({j, end: 'P', other: plates[q].x}); atSt[q].push({j, end: 'Q', other: plates[p].x}); });
      const port = pairs.map(() => ({P: null, Q: null}));
      atSt.forEach((list0, i) => {
        const cx = plates[i].x + SW / 2;
        const left = list0.filter(e0 => e0.other < plates[i].x).sort((a, b) => b.other - a.other);
        const right = list0.filter(e0 => e0.other >= plates[i].x).sort((a, b) => b.other - a.other);
        const sorted = [...left, ...right];
        const m = sorted.length;
        sorted.forEach((e0, k) => { const f = m === 1 ? (e0.other < plates[i].x ? -0.55 : 0.55) : lerp(-1, 1, k / (m - 1)); port[e0.j][e0.end] = {x: cx + f * TW * 0.36, y: yP}; });
      });
      const arcs = [];
      // (item 16, round 2: the route untangled — widest step outermost, each overlapping or crossing step below the
      // narrower one by a disc and its clearance — and each step's disc on its own line, >= 16 px (1080p) clear of the
      // other steps' lines and discs; see the kit's untangleDepths / placeClearDiscs)
      const DR = Math.max(F * 0.92, 20 * s);
      const clear = (ctx.view.shape === 'square' ? 20 : 18) / px;
      const spans = pairs.map(([p, q], j) => { const A = port[j].P, B = port[j].Q; return {j, lo: Math.min(A.x, B.x), hi: Math.max(A.x, B.x)}; });
      const dOf = untangleDepths(spans, {base: a0 => (40 * s + (a0.hi - a0.lo) * 0.24) * Math.sqrt(vk), DR, clear, lineW: 7});
      pairs.forEach(([p, q], j) => {
        const A = port[j].P, B = port[j].Q;
        const {lo, hi} = spans[j];
        const d = dOf.get(spans[j]);
        const c1 = {x: A.x, y: yP + d}, c2 = {x: B.x, y: yP + d};
        const pts = [];
        for (let i = 0; i <= 80; i++) pts.push(cubic(A, c1, c2, B, i / 80));
        arcs.push({j, from: p, to: q, P: A, Q: B, c1, c2, d, lo, hi, stack: 0, pts, deep: yP + 0.75 * d});
      });
      const discs = placeClearDiscs(arcs, {DR, clear, lineW: 7, yP});
      if (discs.some(d0 => d0.clash)) problems.push('disc-clash');
      const deepest = arcs.reduce((a, b) => (b.deep > a.deep ? b : a), arcs[0]);
      const yBot = Math.max(...arcs.map(a => a.deep), ...discs.map(d => d.y + DR));
      // the state piece: under the route on tall boxes; beside it, right of the row, on wide ones. Its link reaches the
      // outermost (deepest) step from below, beside that step's disc
      const dj = arcs.indexOf(deepest);
      const tqL = discs[dj].tq <= 0.5 ? Math.min(0.85, discs[dj].tq + 0.22) : Math.max(0.15, discs[dj].tq - 0.22);
      const hook = cubic(deepest.P, deepest.c1, deepest.c2, deepest.Q, tqL);
      const sign = docTop ? {x: clamp(hook.x - signW / 2, rowX, rowX + rowW - signW), y: yBot + gap3, w: signW, h: signH}
        : {x: rowX + rowW + gapX * 0.8, y: Math.max(trays[0].y + TH + 10 * s, yBot - signH * 0.55), w: signW, h: signH};
      const linkY = docTop ? null : Math.max(yBot + 14 * s, sign.y + signH * 0.5);
      // the sheet: in its column, level with the plates and trays
      const doc = docTop ? {x: rowX, y: box.y + 4, w: DW, h: DH} : {x: x0 + (colW - 70 * s - DW) / 2 + 10 * s, y: yPl + (trays[0].y + TH - yPl - DH) / 2, w: DW, h: DH};
      if (!docTop) doc.y = Math.max(doc.y, yPl);
      const totalH = Math.max(sign.y + sign.h, yBot + (linkY !== null ? linkY - yBot + 10 : 0)) - box.y + 6;
      if (totalW > box.w + 0.5) problems.push('diagram-width');
      if (totalH > box.h + 0.5) problems.push('diagram-height');
      return {vk, gapK, hook, linkY, docTop, s, F, nameFits, letter, TW, TH, SW, SH, gapX, DW, DH, plates, trays, yP, arcs, discs, DR, sign, doc, deepest, gap1, gap2, gap3, chan, rowX, rowW, x0, totalW, totalH, problems, pad, box};
    };
    // the largest unit scale that fits the box
    const compose = (box, F, scale, names) => {
      // (both arrangements — the sheet beside the row or above it — and the larger pieces win)
      let best = null;
      for (const top of [false, true]) {
        for (const gk of R.n <= 2 ? [1, 1.6, 2.3, 3.2, 4.4, 6] : [1, 1.3, 1.6, 2.3]) {
          let lo = 0.5, hi = 2.6, b0 = diagramAt(box, F, lo, names, gk, top);
          for (let it = 0; it < 12; it++) {
            const mid = (lo + hi) / 2;
            const D0 = diagramAt(box, F, mid, names, gk, top);
            if (D0.problems.some(q => q === 'diagram-width' || q === 'diagram-height')) hi = mid; else { lo = mid; b0 = D0; }
          }
          // (spare height opens the explosion further)
          if (!b0.problems.length) {
            let vlo = 1, vhi = R.n <= 2 ? 3.6 : 2.4;
            for (let it = 0; it < 8; it++) { const vm = (vlo + vhi) / 2; const D1 = diagramAt(box, F, b0.s, names, gk, top, vm); if (D1.problems.length) vhi = vm; else { vlo = vm; } }
            if (vlo > 1.01) { const D1 = diagramAt(box, F, b0.s, names, gk, top, vlo); if (!D1.problems.length) b0 = D1; }
          }
          // (fewer problems first; then the larger pieces — but within 12 % of each other, the arrangement that covers more
          // of the box)
          const cover = d0 => d0.totalW * d0.totalH;
          const better = !best || b0.problems.length < best.problems.length || (b0.problems.length === best.problems.length && (b0.s > best.s * 1.12 || (b0.s > best.s * 0.88 && cover(b0) > cover(best) * 1.05) || (b0.s > best.s + 1e-6 && cover(b0) >= cover(best) * 0.95)));
          // (item 18: off portrait the diagram spans >= 0.42 of the frame width — a sheet stacked over a deep route must
          // not shrink it into a narrow column)
          if (ctx.view.shape !== 'portrait' && b0.totalW < 0.42 * ctx.design.w && !b0.problems.includes('diagram-narrow')) b0.problems.push('diagram-narrow');
          if (better) best = b0;
          if (!b0.problems.includes('disc-clash') && R.n > 2 && ctx.view.shape !== 'portrait') break;
        }
      }
      // (the pieces dominate: below this unit scale the composition is refused)
      if (best.s < 0.75) best.problems.push('pieces-small');
      return {k: 1, problems: [...best.problems], D: best, planRect: {x: best.x0, y: box.y, w: best.totalW, h: best.totalH}};
    };
    const opts = names => ({sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, colFracs: [0.25, 0.3, 0.35, 0.39], bandCols: [2, 3], sidePanels: [[0.44, 2]], bandMax: ctx.view.shape === 'square' ? 0.56 : 0.45, scales: [1], targetPx: 0, compose: (box, F, scale) => compose(box, F, scale, names), scoreOf: C => C.D.s * 300});
    const good = b => !b.problems.length && b.F * px >= 19.5 - 1e-6;
    // (names on the plates, or letters on the plates and the names in the panel: the one with the larger pieces, among
    // those that keep the text floor)
    let names = R.n >= 4 && showKey ? 'letters' : 'room';
    let best = searchSa(ctx, rowsFor(names), opts(names));
    if (showKey && names === 'room') {
      const b2 = searchSa(ctx, rowsFor('letters'), opts('letters'));
      // (names on the plates are preferred while their pieces stay within 80 % of the letters' size)
      const sc = (b, nm) => (good(b) ? 1000 : 0) - 100 * b.problems.length + b.C.D.s * 300 * (nm === 'room' ? 1.25 : 1) + b.F * px * 3;
      if (sc(b2, 'letters') > sc(best, 'room')) { best = b2; names = 'letters'; }
    }
    const {F, lay} = best;
    const D = best.C.D;
    const problems = [...best.problems];
    // ---- links (design units): each relationship's lines, as drawn at the exploded places
    const plateTop = i => ({x: D.plates[i].x + D.SW / 2, y: D.plates[i].y});
    const links = [];
    const add = (l, key, pts) => { const rel = relOf(l); if (rel) links.push({l, key, kind: rel.kind, pts}); };
    {
      const first = R.steps[0];
      const pt = plateTop(first);
      const yc = D.plates[0].y - D.chan * 0.5;
      if (D.docTop) {
        // (the sheet stands above the row: its link leaves its lower edge, down into the channel over the plates)
        const dB = {x: D.doc.x + D.DW / 2, y: D.doc.y + D.DH};
        add('document-bodies', 'db', Math.abs(dB.x - pt.x) < 1 ? [dB, pt] : [dB, {x: dB.x, y: yc}, {x: pt.x, y: yc}, pt]);
      } else {
        const dTop = {x: D.doc.x + D.DW / 2, y: D.doc.y};
        add('document-bodies', 'db', [dTop, {x: dTop.x, y: yc}, {x: pt.x, y: yc}, pt]);
      }
      R.bodies.forEach((_, i) => add('bodies-trays', `bt${i}`, [{x: D.plates[i].x + D.SW / 2, y: D.plates[i].y + D.SH}, {x: D.trays[i].x + D.TW / 2, y: D.trays[i].y}]));
      D.arcs.forEach(a => {
        add('trays-route', `tr${a.j}p`, [{x: a.P.x, y: D.trays[a.from].y + D.TH}, {x: a.P.x, y: a.P.y}]);
        add('trays-route', `tr${a.j}q`, [{x: a.Q.x, y: D.trays[a.to].y + D.TH}, {x: a.Q.x, y: a.Q.y}]);
      });
      const hk = D.hook;
      if (D.docTop) add('state-route', 'sr', [{x: D.sign.x + D.sign.w / 2, y: D.sign.y}, {x: D.sign.x + D.sign.w / 2, y: D.sign.y - D.gap3 * 0.5}, {x: hk.x, y: D.sign.y - D.gap3 * 0.5}, {x: hk.x, y: hk.y + 4}]);
      else add('state-route', 'sr', [{x: D.sign.x, y: D.linkY}, {x: hk.x, y: D.linkY}, {x: hk.x, y: hk.y + 4}]);
    }
    // relationship windows: one per relationship, in the order supplied (every line of one relationship together)
    const RW = rels.map((_, i) => { const L0 = W.relate[1] - W.relate[0]; const w0 = L0 / Math.max(1, rels.length); return [W.relate[0] + i * w0, W.relate[0] + i * w0 + w0 * 0.85]; });
    links.forEach(lk => { lk.win = RW[rels.findIndex(q => q.link === lk.l)]; lk.total = ptsLen(lk.pts); });
    // ---- the tracer's path (design units): the supplied traversal, along the drawn links (and, on the route, along every
    // step in the supplied order); where no link joins two consecutive pieces it starts afresh at the next piece
    const order = (P.traversalOrder || []).filter(id => IDS.includes(id));
    const hasL = l => links.some(lk => lk.l === l);
    const legs = [];
    const arcChain = () => {
      const pts = [];
      const marks = [];
      D.arcs.forEach((a, j) => {
        if (j) { const prevQ = D.arcs[j - 1].Q; const ty = D.trays[a.from].y + D.TH; pts.push({x: prevQ.x, y: ty}, {x: a.P.x, y: ty}); }
        marks.push(pts.length ? ptsLen([...pts, a.pts[0]]) : 0);
        pts.push(...a.pts);
      });
      pts.marks = marks;
      return pts;
    };
    for (let i = 0; i + 1 < order.length; i++) {
      const a = order[i], b = order[i + 1];
      const pair = [a, b].sort().join('-');
      let pts = null;
      const first = R.steps[0];
      const db = links.find(lk => lk.key === 'db');
      if (pair === 'bodies-document' && db) pts = a === 'document' ? db.pts : [...db.pts].reverse();
      else if (pair === 'bodies-trays' && hasL('bodies-trays')) { const lk = links.find(q => q.key === `bt${first}`); pts = a === 'bodies' ? lk.pts : [...lk.pts].reverse(); }
      else if (pair === 'route-trays' && hasL('trays-route')) { const lk = links.find(q => q.key === 'tr0p'); pts = a === 'trays' ? lk.pts : [...lk.pts].reverse(); }
      else if (pair === 'route-state' && hasL('state-route')) { const lk = links.find(q => q.key === 'sr'); pts = a === 'state' ? lk.pts : [...lk.pts].reverse(); }
      legs.push({a, b, pts});
      if (b === 'route' && i + 1 === order.length - 1) { const ch = arcChain(); legs.push({a: 'route', b: 'route', pts: ch, marks: ch.marks, along: true}); }
    }
    if (order.length === 1 && order[0] === 'route') { const ch = arcChain(); legs.push({a: 'route', b: 'route', pts: ch, marks: ch.marks, along: true}); }
    // (consecutive legs join: where one ends away from the next one's start the tracer goes round, beside the piece
    // between them — never across a plate's text)
    let prevEnd = null;
    for (const q of legs) {
      if (!q.pts) { prevEnd = null; continue; }
      const st = q.pts[0];
      if (prevEnd && Math.hypot(prevEnd.x - st.x, prevEnd.y - st.y) > 1) {
        const hitP = D.plates.find(p => Math.min(prevEnd.y, st.y) <= p.y + p.h && Math.max(prevEnd.y, st.y) >= p.y && Math.min(prevEnd.x, st.x) <= p.x + p.w && Math.max(prevEnd.x, st.x) >= p.x);
        const via = hitP ? [{x: prevEnd.x, y: hitP.y - 20}, {x: hitP.x - 20, y: hitP.y - 20}, {x: hitP.x - 20, y: hitP.y + hitP.h + 16}, {x: st.x, y: hitP.y + hitP.h + 16}] : [];
        const add0 = ptsLen([prevEnd, ...via, q.pts[0]]);
        if (q.marks) q.marks = q.marks.map(m0 => m0 + add0);
        q.pts = [prevEnd, ...via, ...q.pts];
      }
      prevEnd = q.pts[q.pts.length - 1];
    }
    // (the tracer never runs over a plate: a point on a plate's edge is lifted just off it, above or below)
    for (const q of legs) if (q.pts) {
      const m0 = q.marks;
      q.pts = q.pts.map(p => {
        const pl = D.plates.find(b => p.x >= b.x - 1 && p.x <= b.x + b.w + 1 && p.y >= b.y - 1 && p.y <= b.y + b.h + 1);
        if (!pl) return p;
        return {x: p.x, y: p.y < pl.y + pl.h / 2 ? pl.y - 18 : pl.y + pl.h + 18};
      });
      if (m0) q.marks = m0;
    }
    const lens = legs.map(q => (q.pts ? ptsLen(q.pts) : 0));
    const totalL = lens.reduce((x, y) => x + y, 0) || 1;
    // (each leg's share of the trace window follows its length; a leg without a link takes a short fixed share)
    const TWn = W.trace[1] - W.trace[0];
    const jumpT = 0.012;
    const nJ = legs.filter(q => !q.pts).length;
    let t0 = W.trace[0];
    legs.forEach((q, i) => { const dt = q.pts ? (TWn - nJ * jumpT) * (lens[i] / totalL) : jumpT; q.win = [t0, t0 + dt]; t0 += dt; });
    const anchors = {
      document: {x: D.doc.x + D.DW / 2, y: D.doc.y + D.DH / 2}, bodies: plateTop(R.steps[0]), trays: {x: D.trays[R.steps[0]].x + D.TW / 2, y: D.trays[R.steps[0]].y + D.TH / 2},
      route: D.arcs[0].P, state: {x: D.sign.x + D.sign.w / 2, y: D.sign.y + D.sign.h / 2},
    };
    const dyC = centreShiftY(ctx.design, [{x: D.x0, y: D.box.y, w: D.totalW, h: D.totalH}, best.panelBox]);
    return {P, R, F, px, D, lay, links, rels, legs, anchors, order, problems, showKey, side, names, label, kindsUsed, dyC, elements};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {D, R} = L;
    const c = {plate: '#eef1f4', tray: '#dfe4e9'};
    const panel = L.lay ? L.lay.rows.map(m => saRowNode(ctx, m, {name: m.name})) : [];
    const kids = [];
    // links under the pieces
    for (const lk of L.links) {
      const col = linkColor(th, lk.kind);
      const d = polyline(lk.pts).d(1);
      const end = lk.pts[lk.pts.length - 1], st = lk.pts[0];
      const ends = lk.kind === 'relation' ? [h('circle', {cx: r(st.x), cy: r(st.y), r: 5, fill: col}), h('circle', {cx: r(end.x), cy: r(end.y), r: 5, fill: col})]
        : lk.kind === 'communication' ? [h('circle', {cx: r(st.x), cy: r(st.y), r: 5, fill: col}), h('circle', {cx: r(end.x), cy: r(end.y), r: 6, fill: th.card, stroke: col, 'stroke-width': 2.4})]
          : lk.kind === 'sequence' ? [h('rect', {x: r(st.x - 5), y: r(st.y - 5), width: 10, height: 10, fill: col}), h('rect', {x: r(end.x - 5), y: r(end.y - 5), width: 10, height: 10, fill: col})]
            : (() => { const p = lk.pts[lk.pts.length - 2]; const a = Math.atan2(end.y - p.y, end.x - p.x); const q = (dx, dy) => `${r(end.x + Math.cos(a) * dx - Math.sin(a) * dy)} ${r(end.y + Math.sin(a) * dx + Math.cos(a) * dy)}`; return [h('circle', {cx: r(st.x), cy: r(st.y), r: 5, fill: col}), h('path', {d: `M${q(2, 0)}L${q(-12, -7)}L${q(-12, 7)}Z`, fill: col})]; })();
      kids.push(g({name: `conn-${lk.key}`, 'data-kind': lk.kind, opacity: 0},
        h('path', {name: `conn-${lk.key}-line`, 'data-draw': 1, d, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(lk.total)} ${r(lk.total + 10)}`, 'stroke-dashoffset': r(lk.total)}),
        g({name: `conn-${lk.key}-end`, opacity: 0}, ends)));
    }
    // the route's steps (pieces): a pale band under the line, the solid line (one style for both states), the numbered disc
    const steps = [];
    D.arcs.forEach((a, j) => {
      const dd = `M${r(a.P.x)} ${r(a.P.y)}C${r(a.c1.x)} ${r(a.c1.y)} ${r(a.c2.x)} ${r(a.c2.y)} ${r(a.Q.x)} ${r(a.Q.y)}`;
      const line = h('path', {name: `rm-rt${j}`, 'data-from': String(a.from), 'data-to': String(a.to), d: dd, fill: 'none', stroke: LINE.color, 'stroke-width': 7, 'stroke-linecap': 'round'});
      const disc = D.discs[j];
      steps.push(g({name: `rm-stepw${j}`, transform: 'translate(0 0)'},
        h('path', {d: dd, fill: 'none', stroke: c.tray, 'stroke-width': 22, 'stroke-linecap': 'round'}),
        line,
        g({name: `rm-step${j}`},
          h('circle', {name: `rm-step${j}-disc`, cx: r(disc.x), cy: r(disc.y), r: r(D.DR), fill: '#ffffff', stroke: LINE.color, 'stroke-width': 3}),
          L.showKey ? h('text', {name: `rm-step${j}-n`, x: r(disc.x), y: r(disc.y + L.F * 0.36), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(j + 1))
            : [...Array(Math.min(j + 1, 5))].map((_, i, arr) => h('circle', {cx: r(disc.x - (arr.length - 1) * D.DR * 0.2 + i * D.DR * 0.4), cy: r(disc.y), r: r(D.DR * 0.15), fill: LINE.color})))));
    });
    kids.push(g({name: 'rm-route'}, steps));
    // (two slots in every tray; the last stop's tray — the prior-examination tray — carries a plain tab and, with ◆
    // decision supplied, the decision's placeholder sheet in its left slot: content never shown)
    D.trays.forEach((t, i) => kids.push(g({name: `rm-tray${i}`, transform: 'translate(0 0) scale(1)'},
      h('path', {d: roundRectPath(t.x + 3, t.y + 5, t.w, t.h, 7), fill: th.shadow}),
      i === R.exam ? examTab(t, `rm-exam`) : null,
      h('path', {name: `rm-tray${i}-body`, d: roundRectPath(t.x, t.y, t.w, t.h, 7), fill: c.tray, stroke: '#5b6470', 'stroke-width': 2.2}),
      h('path', {d: `M${r(t.x + 8)} ${r(t.y + 9)}H${r(t.x + t.w - 8)}`, stroke: '#c3cad1', 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(t.x + t.w / 2)} ${r(t.y + 14)}V${r(t.y + t.h - 8)}`, stroke: '#aab3bc', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
      i === R.exam && L.side === 'b' ? g({name: 'rm-dec', transform: T(t.x + t.w / 4, t.y + t.h / 2 + 3)}, decArt(ctx, Math.min(t.w / 2 - 14, (t.h - 16) * 0.76), t.h - 16, {noShadow: true}),
        statusDisc(ctx, {name: 'rm-dec-pin-b', kind: 'b', cx: Math.min(t.w / 2 - 14, (t.h - 16) * 0.76) / 2 - 11, cy: (t.h - 16) / 2 - 11, R: 9})) : null)));
    // the sheet (enlarged out of its tray): over the trays, under the plates — it never lies over a plate's name
    kids.push(g({name: 'rm-doc', transform: 'translate(0 0) scale(1)'}, g({transform: T(D.doc.x + D.DW / 2, D.doc.y + D.DH / 2)}, g({name: 'rm-doc-k'}, docArt(ctx, D.DW, D.DH)))));
    // the plates (bodies) and the trays — equal size, one row
    D.plates.forEach((p, i) => {
      const fit = D.nameFits ? D.nameFits[i] : null;
      kids.push(g({name: `rm-st${i}`, transform: 'translate(0 0) scale(1)'},
        h('path', {d: roundRectPath(p.x + 4, p.y + 6, p.w, p.h, 10), fill: th.shadow}),
        h('path', {name: `rm-st${i}-plate`, d: roundRectPath(p.x, p.y, p.w, p.h, 10), fill: c.plate, stroke: INK, 'stroke-width': 2.4}),
        fit ? g({name: `rm-st${i}-text`}, textAt(fit, p.x + (p.w - fit.width) / 2, p.y + D.pad, INK))
          : D.letter ? g({name: `rm-st${i}-lt`}, h('circle', {cx: r(p.x + p.w / 2), cy: r(p.y + p.h / 2), r: r(D.letter * 0.8), fill: '#ffffff', stroke: INK, 'stroke-width': 2}),
            h('text', {x: r(p.x + p.w / 2), y: r(p.y + p.h / 2 + D.letter * 0.35), 'font-family': FONT, 'font-size': r(D.letter, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, LETTERS[i]))
            : h('path', {d: `M${r(p.x + 20)} ${r(p.y + p.h * 0.4)}H${r(p.x + p.w - 20)}M${r(p.x + 20)} ${r(p.y + p.h * 0.62)}H${r(p.x + p.w * 0.62)}`, stroke: '#c9c2b4', 'stroke-width': 3.4, 'stroke-linecap': 'round'})));
    });
    // the state piece: the supplied state's glyph on its disc over a short route icon
    const S = D.sign;
    const sR = Math.min(S.h * 0.3, S.w * 0.24);
    kids.push(g({name: 'rm-sign', transform: 'translate(0 0) scale(1)'},
      h('path', {d: roundRectPath(S.x + 4, S.y + 6, S.w, S.h, 10), fill: th.shadow}),
      h('path', {name: 'rm-sign-body', d: roundRectPath(S.x, S.y, S.w, S.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
      statusDisc(ctx, {name: `rm-sign-${L.side}-d`, kind: L.side, cx: S.x + S.w / 2, cy: S.y + 12 + sR, R: sR}),
      stateIcon({x: S.x + 16, y: S.y + 12 + sR * 2 + (S.h - 24 - sR * 2) / 2 + 4, w: S.w - 32, kind: L.side})));
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'diagram'}, kids),
      h('circle', {name: 'tracer', r: 12, fill: th.accent3, stroke: '#ffffff', 'stroke-width': 3, opacity: 0}),
      g({name: 'panel'}, panel));
  },
  frame(ctx, L, u) {
    const {D, R} = L;
    const nodes = {};
    const sp = ease.inOutCubic(seg(u, ...W.spread));
    // separation: every piece from its assembled place (0) to its exploded place (1)
    // (assembled: the pieces close together — each gap shorter by a fixed amount, never more than 60 % of it —, the sheet
    // and the state piece smaller; they move apart over the separate beat)
    const c1 = Math.min(D.gap1 * 0.6, 26 * D.s), c2 = Math.min(D.gap2 * 0.6, 34 * D.s), c3 = Math.min(D.gap3 * 0.6, 34 * D.s);
    const cl = 1 - sp;
    const dyT = -c1 * cl, dyR = -(c1 + c2) * cl, dyS = D.docTop ? -(c1 + c2 + c3) * cl : -(c1 + c2) * cl;
    // the tracer and the focus: which piece the tracer is on
    let tr = null, on = null, onStep = null;
    for (const q of L.legs) {
      if (u < q.win[0]) continue;
      const k = clamp((u - q.win[0]) / Math.max(1e-9, q.win[1] - q.win[0]));
      if (u <= q.win[1]) {
        if (q.pts) {
          const pl = polyline(q.pts);
          const ke = ease.inOutSine(k);
          const p = pl.at(ke);
          tr = {x: p.x, y: p.y};
          if (q.marks) { const sL = ke * pl.total; onStep = 0; q.marks.forEach((m0, j) => { if (sL >= m0 - 1e-6) onStep = j; }); }
        }
        on = k < 0.5 && !q.along ? q.a : q.b;
      }
    }
    if (u > W.trace[1] || u < W.trace[0]) { tr = null; on = null; onStep = null; }
    const grow = id => {
      if (on !== id) return 1;
      return id === L.P.focusElement ? 1.1 : 1.04;
    };
    // the bodies: equal plates; the focus scales each about its own lower edge's middle (all alike)
    const gb = grow('bodies');
    D.plates.forEach((p, i) => {
      const cx = p.x + p.w / 2, cy = p.y + p.h;
      nodes[`rm-st${i}`] = {transform: `translate(${r(cx * (1 - gb), 3)} ${r(cy * (1 - gb), 3)}) scale(${r(gb, 4)})`};
    });
    const gt = grow('trays');
    D.trays.forEach((t, i) => {
      const cx = t.x + t.w / 2, cy = t.y;
      nodes[`rm-tray${i}`] = {transform: `translate(${r(cx * (1 - gt), 3)} ${r(cy * (1 - gt) + dyT, 3)}) scale(${r(gt, 4)})`};
    });
    const gr = grow('route');
    D.arcs.forEach((a, j) => {
      const d0 = D.discs[j];
      nodes[`rm-stepw${j}`] = {transform: `translate(0 ${r(dyR, 3)})`};
      nodes[`rm-step${j}`] = {transform: `translate(${r(d0.x * (1 - gr), 3)} ${r(d0.y * (1 - gr), 3)}) scale(${r(gr, 4)})`};
    });
    const gs = grow('state');
    const S = D.sign;
    const sk = lerp(0.85, 1, sp) * gs;
    {
      const cx = D.docTop ? S.x + S.w / 2 : S.x, cy = D.docTop ? S.y : D.linkY;
      nodes['rm-sign'] = {transform: `translate(${r(cx * (1 - sk), 3)} ${r(cy * (1 - sk) + dyS, 3)}) scale(${r(sk, 4)})`};
    }
    // the sheet: from inside the first tray (small) to its column (full size)
    const gd = grow('document');
    const dc = {x: D.doc.x + D.DW / 2, y: D.doc.y + D.DH / 2};
    const dk = lerp(0.85, 1, sp) * gd;
    const pos = {x: dc.x, y: dc.y};
    // (the focus scales the sheet about the middle of its upper edge, where its link lands)
    const fy = gd !== 1 ? (D.docTop ? -1 : 1) * (D.DH / 2) * (gd - 1) : 0;
    nodes['rm-doc'] = {transform: `translate(${r(pos.x - dc.x * dk, 3)} ${r(pos.y + fy - dc.y * dk, 3)}) scale(${r(dk, 4)})`};
    // links: drawn in their relationship's window (draw-on), once the pieces are apart
    const drawn = [];
    for (const lk of L.links) {
      const q = seg(u, ...lk.win);
      drawn.push(q);
      nodes[`conn-${lk.key}`] = {opacity: q > 0 ? 1 : 0};
      nodes[`conn-${lk.key}-line`] = {'stroke-dashoffset': r(lk.total * (1 - q))};
      nodes[`conn-${lk.key}-end`] = {opacity: q >= 1 ? 1 : 0};
    }
    // (a step's number fades while the tracer passes over its disc: the tracer never covers a text)
    if (L.showKey) D.discs.forEach((d0, j) => {
      const dd = tr ? Math.hypot(tr.x - d0.x, tr.y - (d0.y + dyR)) : 1e9;
      nodes[`rm-step${j}-n`] = {opacity: r(clamp((dd - D.DR - 16) / 14), 3)};
    });
    nodes.tracer = tr ? {cx: r(tr.x), cy: r(tr.y), opacity: 1} : {cx: r(L.anchors.document.x), cy: r(L.anchors.document.y), opacity: 0};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const kinds = L.links.map(lk => lk.kind);
    return {
      nodes,
      semantic: {
        beat,
        spread: r(sp, 3),
        drawn: drawn.map(q => r(q, 3)),
        links: L.links.map(lk => lk.key),
        kinds,
        tracer: tr ? R2(tr) : null,
        on,
        onStep,
        focus: L.P.focusElement,
        focusScale: r(on === L.P.focusElement ? (on ? 1.1 : 1) : 1, 3),
        order: L.order,
        side: L.side,
        steps: R.steps,
        unit: r(D.s, 3),
        vk: r(D.vk, 3),
        docTop: D.docTop,
        names: L.names,
        plates: D.plates.map(p => ({x: r(p.x), y: r(p.y), w: r(p.w), h: r(p.h)})),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
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
    slug: 'review-03-mechanism',
    title: 'Authorization request — an exploded view: the petition, the stations, their two-slot trays (the last stop\'s being the prior-examination tray), the numbered steps and the supplied state, with the links supplied between them',
    titleEs: 'Solicitud de autorización — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Solicitud de autorización',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded view of a petition passing to a prior-examination tray along a path configured between abstract stations: the pieces start close together — each station\'s plate (all the same size, on one row) with its neutral two-slot tray, the numbered steps under the trays, the placeholder petition in its column and the state piece beside the path — and are pulled apart. Only the supplied relationships are drawn, each in its kind\'s style (a plain relation has end dots and no arrowhead; causal only when supplied). A tracer follows the supplied traversal along the drawn links and along every numbered step to the prior-examination tray; the piece it reaches enlarges, the focus most. The state piece shows the supplied state with equal weight: ● authorization requested, or ◆ decision supplied (the decision\'s placeholder sheet, content never shown, in the tray\'s other slot). Illustrative; no criterion, threshold, time limit, rank or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'authorization request', 'mechanism', 'exploded view', 'relationships', 'tracer', 'prior-examination tray', 'abstract stations', 'equal size', 'numbered steps', 'as supplied', 'no hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
