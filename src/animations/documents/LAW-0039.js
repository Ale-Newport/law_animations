/**
 * LAW-0039 — Custodia del original · contrast
 *
 * Storyboard: two complete, identical custody desks (same document, box,
 * reader, pen and stamp; side by side on wide frames, stacked on tall ones).
 *  0.00–0.17  base: in both scenes one plain signed sheet lies in front of
 *             the custodian; the box is open, the reader's file is empty.
 *  0.17–0.40  change: the custodian stamps the sheet with the SAME motion and
 *             the SAME neutral stamp in both scenes; only the ink mark that
 *             appears on contact differs — A: "ORIGINAL" (red ink), B: "COPY"
 *             (blue ink). This is the single changed fact.
 *  0.40–0.77  parallel action adapted only to that fact: in A the sheet is
 *             carried into the archive box and sinks inside its walls; in B
 *             it slides to the reader, who pulls it onto the working file and
 *             writes notes on it. Timings and positions are shared.
 *  0.77–1.00  guide: rings around the two marks, the mark words echoed in
 *             large type beside them, and an orthogonal guide (through the
 *             gap between the panels, never across either scene's props) with
 *             its chip join the changed detail; a neutral note states no outcome.
 * @module animations/documents/LAW-0039
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields, str, obj} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {custodyDesk, custodyDocFields, pairHeader, elbowGuide, CUSTODY_STRINGS, STAGE} from './kits/custodia-del-original.js';

const ID = 'LAW-0039';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  stampFetch: [0.17, 0.23], stamp: [0.23, 0.36], stampLeave: [0.36, 0.41],
  // A: into the box
  carry: [0.41, 0.53], sink: [0.53, 0.59], withdrawA: [0.54, 0.63],
  // B: to the reader
  push: [0.41, 0.47], glide: [0.47, 0.55], reach: [0.43, 0.545], pull: [0.55, 0.63], releaseB1: [0.63, 0.68], withdrawB: [0.48, 0.57],
  toPen: [0.565, 0.635], write: [0.635, 0.71], putPen: [0.71, 0.79],
  changeChip: [0.2, 0.28], guide: [0.78, 0.9], note: [0.9, 0.95],
};
/** Actor chip size per stage axis (stage units). */
const CHIP_SIZE = {square: 44, vertical: 38, horizontal: 44};

const sceneSchema = {
  ...custodyDocFields,
  ...contrastFields(),
  marks: obj('Status marks stamped on the sheet — the single changed fact', {
    a: str('Mark stamped in scenario A (the sheet then goes into the box)', 32),
    b: str('Mark stamped in scenario B (the sheet then goes to the reader)', 32),
  }),
  objectLabels: obj('Labels printed on props (identical in both scenes)', {
    box: str('Label card on the archive box lid', 64),
    folder: str('Label on the reader’s working file', 40),
  }),
};

const defaultParams = {
  documentId: 'DOC-214',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties', 'Goods (hypothetical)', 'Delivery terms'],
  signers: [{name: 'Alex Moreno', role: 'Custodian'}, {name: 'Sam Okafor', role: 'Reader'}],
  redactions: [],
  scenarioA: {label: 'Original kept', caption: 'The sheet marked ORIGINAL goes into the box'},
  scenarioB: {label: 'Working copy', caption: 'The sheet marked COPY goes to the reader'},
  changedFact: 'Only the mark stamped on the sheet differs',
  sharedFacts: ['Same document', 'Same desk, box and reader', 'Same stamp motion'],
  comparisonLabels: {guide: 'Changed fact: the mark on the sheet', neutral: 'Two situations shown side by side — no outcome is stated'},
  marks: {a: 'ORIGINAL', b: 'COPY'},
  objectLabels: {box: 'Box 07 · Originals', folder: 'Working file'},
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};

const scene = {
  sizes: {landscape: [2470, 1400], square: [1870, 1700], portrait: [1710, 2390]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE[axis];
    const header = 150;
    const footer = 140;
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: arrangement === 'column' ? 170 : 70});
    // stacked panels get a right margin that carries the comparison guide
    const margin = arrangement === 'column' ? 110 : 0;
    const bw = geo.w + margin, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: []};
    const labels = {box: p.objectLabels.box, folder: p.objectLabels.folder, seal: '', copyMark: ''};
    const colors = [th.accent, th.accent2];
    const capB = sg => (sg.role ? `${sg.name} · ${sg.role}` : sg.name);
    const twoLineB = ctx.show('key') && ctx.fit(capB(p.signers[1]), {maxWidth: 860 - CHIP_SIZE.vertical * 1.2, size: CHIP_SIZE.vertical, minSize: CHIP_SIZE.vertical * 0.85, maxLines: 1, weight: 600}).truncated;
    const stages = ['a', 'b'].map((k, i) => custodyDesk(ctx, {
      prefix: `s${k}`, axis, mode: i ? 'copy' : 'original', doc, parties: p.signers, labels,
      stageMark: i ? p.marks.b : p.marks.a, stageMarkColor: colors[i], seedKey: 'contrast',
      // paired panels are drawn smaller than a single desk: larger name chips
      chipSize: CHIP_SIZE[axis],
      // square frames: B's chip spans the top band; when it needs two lines
      // the file's tab label keeps to one line so the two never meet
      chipB: axis === 'vertical' ? {x: 450, anchor: 'middle', maxW: 860, y: 6} : undefined,
      folderLabelLines: axis === 'vertical' && twoLineB ? 1 : 2,
    }));
    const headers = geo.panels.map((pn, i) => pairHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, h: header - 16, color: colors[i],
    }));
    // Where each mark ends: A's sheet inside the box, B's sheet on the working file.
    const markAt = (st, i) => {
      const sh = i ? st.copySheet : st.origSheet;
      const q = st.sheetPoint(i ? 'copy' : 'orig', i ? 'folder' : 'box', sh.idSpot);
      return {x: geo.panels[i].x + q.x, y: geo.panels[i].y + q.y};
    };
    const marks = stages.map(markAt);
    // rings hug the (large) body marks; A's sheet is a little smaller in the box
    const ringRx = stages[0].origSheet.markW * 0.6, ringRy = ringRx * 0.56;
    // One orthogonal guide from ring A to ring B that never crosses either
    // scene's props. Row: out of ring A across the desk space A leaves empty,
    // through the gap between the panels, then into ring B from the left
    // (above B's box, below B's reader); column: down into the band between
    // the panels, along the right margin, into ring B from the side.
    let guide, chipT;
    if (arrangement === 'row') {
      const gx = geo.panels[0].x + stageSize.w + (geo.panels[1].x - geo.panels[0].x - stageSize.w) / 2;
      const a0 = {x: marks[0].x + ringRx + 6, y: marks[0].y};
      const b1 = {x: marks[1].x - ringRx - 6, y: marks[1].y};
      guide = elbowGuide(ctx, {name: 'guide', pts: [a0, {x: gx, y: a0.y}, {x: gx, y: b1.y}, b1], color: th.fg, radius: 30});
      // the chip sits on the first leg, centred in A's free desk area
      chipT = ((gx - a0.x) * 0.5) / guide.total;
    } else {
      // down from ring A into the band between the panels, along the right
      // margin (clear of B's header and chips), then into ring B from the side
      const gapTop = geo.panels[0].y + stageSize.h, bandY = gapTop + (geo.panels[1].headerY - gapTop) / 2;
      const mx = geo.w + margin * 0.55;
      const a0 = {x: marks[0].x, y: marks[0].y + ringRy + 6};
      const b1 = {x: marks[1].x + ringRx + 6, y: marks[1].y};
      guide = elbowGuide(ctx, {name: 'guide', pts: [a0, {x: a0.x, y: bandY}, {x: mx, y: bandY}, {x: mx, y: b1.y}, b1], color: th.fg, radius: 30});
      chipT = ((bandY - a0.y) + (mx - a0.x) * 0.5) / guide.total;
    }
    const at = guide.at(chipT);
    let guideChip = null;
    if (ctx.show('key')) {
      // row: the chip must stay on the first leg, between ring A and the gap
      const rowRoom = arrangement === 'row' ? Math.max(260, guide.at(chipT * 2).x - marks[0].x - ringRx - 60) : 640;
      const mk = y => chip(ctx, p.comparisonLabels.guide, {x: at.x, y, anchor: 'middle', maxWidth: Math.min(arrangement === 'row' ? 460 : 640, rowRoom), size: 36, maxLines: 2, fill: th.card, stroke: th.ink, name: 'guide-chip'});
      guideChip = mk(0);
      // column: centred in the band between the panels (clear of B's header)
      const gapTop = geo.panels[0].y + stageSize.h, gapH = geo.panels[1].headerY - gapTop;
      guideChip = mk(arrangement === 'row' ? at.y - guideChip.box.h / 2 : gapTop + (gapH - guideChip.box.h) / 2);
    }
    // The changed fact, echoed in large type beside each ring at the guide
    // beat (the stamped word on the sheet itself is small at paired scale):
    // A above its box, B below its file (left of it on stacked panels, where
    // the guide enters the ring from the right).
    const echoes = ctx.show('key') ? [0, 1].map(i => {
      const st = stages[i], pn = geo.panels[i];
      const text = i ? p.marks.b : p.marks.a;
      const o = {size: 48, minSize: 38, maxWidth: 560, maxLines: 2, fill: i ? th.accent2Soft : th.accentSoft, stroke: colors[i], color: colors[i], weight: 800, name: `echo-${i}`};
      const probe = chip(ctx, text, {...o, x: 0, y: 0});
      if (!i) return chip(ctx, text, {...o, x: marks[0].x, y: pn.y + st.boxBox.y - 16 - probe.box.h, anchor: 'middle'});
      const fb = st.folderBox;
      return axis === 'horizontal'
        ? chip(ctx, text, {...o, x: pn.x + fb.x - 20, y: marks[1].y - probe.box.h / 2, anchor: 'end'})
        : chip(ctx, text, {...o, x: marks[1].x, y: pn.y + fb.y + fb.h + 16, anchor: 'middle'});
    }) : [];
    const footY = geo.h + 22;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.9, size: 44, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'neutral-note'}) : null;
    return {geo, stages, headers, marks, ringRx, ringRy, guide, guideChip, echoes, changeChip, shared, neutral, s, ox, oy, arrangement, bw, bh};
  },
  build(ctx, L) {
    const ring = i => h('ellipse', {name: `ring-${i}`, cx: L.marks[i].x, cy: L.marks[i].y, rx: L.ringRx, ry: L.ringRy, fill: 'none', stroke: i ? ctx.theme.accent2 : ctx.theme.accent, 'stroke-width': 6, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      L.guide.node,
      ring(0), ring(1),
      L.echoes.map(e => e.node),
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const S = k => seg(u, ...W[k]);
    const common = {stampFetch: S('stampFetch'), stamp: S('stamp'), stampLeave: S('stampLeave')};
    const a = L.stages[0].pose({...common, carry: S('carry'), sink: S('sink'), withdraw: S('withdrawA')});
    const b = L.stages[1].pose({...common, push: S('push'), glide: S('glide'), reach: S('reach'), pull: S('pull'), releaseB1: S('releaseB1'), withdraw: S('withdrawB'), toPen: S('toPen'), write: S('write'), putPen: S('putPen')});
    const nodes = {...a.nodes, ...b.nodes};
    const gp = S('guide');
    Object.assign(nodes, L.guide.frame(clamp(gp * 1.5), gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: r(clamp(gp * 3), 3)};
    nodes['ring-1'] = {opacity: r(clamp(gp * 3), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.45) * 2.5), 3)};
    L.echoes.forEach((e, i) => { nodes[`echo-${i}`] = {opacity: r(clamp((gp - 0.1) * 3), 3)}; });
    const cp = S('changeChip');
    const noteP = S('note');
    // the three footer notes share one spot: each fades out completely before
    // the next fades in (no double exposure)
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.04)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.56) / 0.05) * (1 - clamp((u - W.note[0] + 0.025) / 0.025)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const A = a.semantic, B = b.semantic;
    return {
      nodes,
      semantic: {
        beat,
        arrangement: L.arrangement,
        a: {holder: A.originalHolder, marked: A.stampApplied, notes: 0, lidClosed: A.lidClosed, stamp: A.stampTool, sheet: A.originalCenter},
        b: {holder: B.copyHolder, marked: B.stampApplied, notes: B.notesProgress, lidClosed: B.lidClosed, stamp: B.stampTool, sheet: B.copyCenter},
        markTexts: [ctx.params.marks.a, ctx.params.marks.b],
        sheetA: A.originalCenter,
        sheetB: B.copyCenter,
        stampA: A.stampTool,
        stampB: B.stampTool,
        handA2a: A.handA2,
        handA2b: B.handA2,
        handB1b: B.handB1,
        penB: B.penTip,
        gripA: A.gripOrigA2,
        gripB: B.gripCopyA2,
        gripB1: B.gripCopyB1,
        noteTipB: B.noteTip,
        stampSpotA: A.stampSpot,
        stampSpotB: B.stampSpot,
        reach: {a: A.allReached, b: B.allReached},
        allReached: A.allReached && B.allReached,
        guideProgress: r(gp, 3),
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
    slug: 'documents-10-contrast',
    title: 'Custody of the original — kept original vs working copy',
    titleEs: 'Custodia del original — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Custodia del original',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical custody desks run in parallel. The custodian stamps the same sheet with the same motion; only the mark differs (ORIGINAL in A, COPY in B), and the sheet then follows a different route: into the archive box in A, to the reader who annotates it in B. A closing guide joins the two marks without stating any outcome.',
    tags: ['custody', 'original', 'working copy', 'comparison', 'archive box', 'stamp', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/custodia-del-original.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CUSTODY_STRINGS,
  scene,
});
