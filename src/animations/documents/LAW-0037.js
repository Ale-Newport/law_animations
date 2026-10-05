/**
 * LAW-0037 — Custodia del original · story
 *
 * Storyboard (top-down records desk; custodian A at the bottom edge, reader B
 * at the right edge — top edge on tall frames):
 *  0.00–0.15  rest: the signed ORIGINAL (warm paper, blue ink, red rosette)
 *             lies under its grey working COPY (toner edge, copy mark); the
 *             archive box stands open with its lid folded back; B's working
 *             file, pen and A's seal stamp wait on the desk.
 *  0.15–0.42  A's right hand slides the copy off the stack toward B; while it
 *             glides into B's catching hand, the same hand lifts the original
 *             and carries it over the open box.
 *  0.42–0.73  the original sinks inside the box walls and is released; A's
 *             left hand folds the lid over it; A stamps the custody seal on
 *             the closed lid. Meanwhile B pulls the copy onto the working
 *             file and writes notes on it (tick, underline, loop) — the
 *             original is never written on.
 *  0.73–1.00  hold: box closed/sealed as supplied by `finalState`, the copy
 *             with its notes on B's file; descriptive tags and callouts only.
 * @module animations/documents/LAW-0037
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {custodyDesk, custodyDocFields, custodyObjectLabels, CUSTODY_STRINGS, STAGE} from './kits/custodia-del-original.js';

const ID = 'LAW-0037';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). */
const W = {
  toCopy: [0.07, 0.15], push: [0.15, 0.23], glide: [0.23, 0.33], reach: [0.17, 0.31], pull: [0.33, 0.43], releaseB1: [0.43, 0.49],
  toOrig: [0.23, 0.28], carry: [0.28, 0.4], sink: [0.4, 0.47], withdraw: [0.41, 0.5],
  toLid: [0.4, 0.47], close: [0.48, 0.58], leaveLid: [0.58, 0.66],
  stampFetch: [0.52, 0.58], stamp: [0.58, 0.8], stampLeave: [0.8, 0.86],
  toPen: [0.36, 0.5], write: [0.51, 0.68], putPen: [0.68, 0.81],
  note: [0.85, 0.93],
};
const ACTION_END = 0.86;

const sceneSchema = {
  ...custodyDocFields,
  ...storyFields({}, ['box', 'seal', 'copy', 'notes'], ['sealed', 'closed', 'open']),
  objectLabels: custodyObjectLabels,
};
sceneSchema.finalState = {...sceneSchema.finalState, description: 'Box state supplied for the final hold: sealed (lid closed + seal stamped), closed (lid closed, no seal) or open (original inside, lid left open). The copy circulates in every case; no legal effect is inferred.'};

const defaultParams = {
  documentId: 'DOC-214',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties', 'Goods (hypothetical)', 'Delivery terms'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  actorLabels: {a: 'Custodian', b: 'Reader'},
  objectLabels: {box: 'Box 07 · Originals', seal: 'SEALED', copyMark: 'COPY', folder: 'Working file'},
  actionProgress: 1,
  annotations: [
    {target: 'box', text: 'Original kept in the box'},
    {target: 'copy', text: 'Working copy with the reader’s notes'},
  ],
  finalState: 'sealed',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/**
 * Free desk zones at the hold (stage units), per axis. Callouts about the box
 * go to the box zone, callouts about the copy to the copy zone; callouts in
 * the same zone stack downward. `copyTag` places the "in circulation" tag.
 */
const ZONES = {
  horizontal: {box: {x: 830, y: 330, anchor: 'middle', maxW: 500, follow: true}, copy: {x: 830, y: 330, anchor: 'middle', maxW: 500, follow: true}, shared: true, copyTag: 'above'},
  square: {box: {x: 500, y: 640, anchor: 'start', maxW: 420}, copy: {x: 650, y: 270, anchor: 'end', maxW: 440}, copyTag: 'below'},
  vertical: {box: {x: 462, y: 880, anchor: 'start', maxW: 410}, copy: {x: 862, y: 568, anchor: 'end', maxW: 500}, copyTag: 'band'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const parties = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const stage = custodyDesk(ctx, {
      prefix: 'stage', axis, mode: 'both',
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      parties, labels: p.objectLabels,
    });
    const G = stage.G;
    const cs = stage.copySheet;
    const bb = stage.boxBox;
    // Callout targets at the hold (all on edges that face the free area).
    const targets = {
      box: axis === 'horizontal' ? {x: bb.x + bb.w - 4, y: bb.y + bb.h * 0.36} : {x: bb.x + bb.w - 4, y: bb.y + bb.h * 0.2},
      seal: {x: stage.sealWorld.x + stage.box.LW * 0.25 + 4, y: stage.sealWorld.y},
      copy: axis === 'vertical' ? stage.copyPoint({x: cs.w * 0.72, y: cs.h - 4}) : axis === 'square' ? stage.copyPoint({x: 4, y: cs.h * 0.3}) : stage.copyPoint({x: 6, y: cs.h * 0.62}),
      notes: stage.copyPoint({x: cs.clauseBoxes[Math.min(1, cs.clauseBoxes.length - 1)].x + 4, y: cs.clauseBoxes[Math.min(1, cs.clauseBoxes.length - 1)].y + cs.headSize}),
    };
    const show = ctx.show('all');
    const Z = ZONES[axis];
    // State tags (descriptive): the box state above the box; "in circulation"
    // next to the reader's file, in a spot no leader crosses.
    const boxState = p.finalState === 'sealed' ? t.sealed : p.finalState === 'closed' ? t.closed : t.open;
    const fb = stage.folderBox;
    const tags = [];
    if (ctx.show('key')) {
      const tagSize = axis === 'horizontal' ? 30 : 32;
      tags.push(statusTag(ctx, boxState, {x: bb.x + bb.w / 2, y: bb.y - tagSize * 2.5, anchor: 'middle', size: tagSize, maxWidth: bb.w + 60, name: 'tag-box', color: ctx.theme.accent4, opacity: 0}));
      const at = Z.copyTag === 'above' ? {x: fb.x + fb.w / 2, y: fb.y - tagSize * 2.5, anchor: 'middle'}
        : Z.copyTag === 'below' ? {x: fb.x + fb.w / 2, y: fb.y + fb.h + 16, anchor: 'middle'}
          : {x: 40, y: Z.copy.y + 84, anchor: 'start'};
      tags.push(statusTag(ctx, t.circulating, {...at, size: tagSize, maxWidth: Z.copyTag === 'band' ? 300 : fb.w + 80, name: 'tag-copy', color: ctx.theme.accent2, opacity: 0}));
    }
    // Callouts in the desk areas vacated by the two sheets; short leaders.
    // Callouts sharing a zone stack in the vertical order of their targets,
    // so no leader crosses a neighbouring chip.
    const cursor = {box: Z.box.y, copy: Z.shared ? Z.box.y : Z.copy.y};
    const zoneOf = target => (target === 'box' || target === 'seal' ? 'box' : 'copy');
    const order = p.annotations.map((a, i) => i).sort((i, j) => targets[p.annotations[i].target].y - targets[p.annotations[j].target].y || i - j);
    const notes = [];
    if (show) for (const i of order) {
      const a = p.annotations[i];
      const tgt = targets[a.target];
      const zk = zoneOf(a.target);
      const key = Z.shared ? 'box' : zk;
      const zone = Z[zk];
      const want = zone.follow ? Math.max(cursor[key], Math.min(st.h - 190, tgt.y - 30)) : cursor[key];
      const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: zone.x, y: want}, anchor: zone.anchor, target: tgt, maxWidth: zone.maxW, size: 30, maxLines: 2});
      cursor[key] = c.box.y + c.box.h + 24;
      notes[i] = c;
    }
    return {stage, s, ox, oy, notes, tags};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tags.map(x => x.node),
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const closes = p.finalState !== 'open';
    const seals = p.finalState === 'sealed';
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {};
    for (const k of ['toCopy', 'push', 'glide', 'reach', 'pull', 'releaseB1', 'toOrig', 'carry', 'sink', 'withdraw', 'toPen', 'write', 'putPen']) v[k] = seg(a, ...W[k]);
    for (const k of ['toLid', 'close', 'leaveLid']) v[k] = on(closes, W[k]);
    for (const k of ['stampFetch', 'stamp', 'stampLeave']) v[k] = on(seals, W[k]);
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tags[0]) nodes['tag-box'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    if (L.tags[1]) nodes['tag-copy'] = {opacity: done ? clamp((u - W.note[0] - 0.03) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {nodes, semantic: {...sem, beat, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-10-story',
    title: 'Custody of the original — boxed original, circulating copy',
    titleEs: 'Custodia del original — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Custodia del original',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down records desk: the custodian slides the working copy to the reader and, while it travels, lowers the signed original into an archive box, folds the lid over it and stamps a custody seal; the reader writes notes on the copy only. The final box state (sealed, closed or open) is supplied by the author.',
    tags: ['custody', 'original', 'copy', 'archive box', 'seal', 'working copy', 'desk', 'hands', 'handoff'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/custodia-del-original.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CUSTODY_STRINGS,
  scene,
});
