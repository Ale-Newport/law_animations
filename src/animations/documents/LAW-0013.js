/**
 * LAW-0013 — Redacción comparada · story
 *
 * Storyboard (top-down review desk, 6 s):
 *  0.00–0.15  rest: an open folder holds the filed ORIGINAL text (left panel);
 *             the drafting party (arm from the top edge) holds the REVISED
 *             text lifted above the right panel; the reviewer's hands wait at
 *             the bottom edge with a red pen and a stamp.
 *  0.15–0.42  the drafter lays the revised sheet into the right panel — it
 *             descends, straightens and settles so its clause rows line up
 *             with the original's (row bands appear across both sheets); the
 *             drafter lets go and the reviewer's pen approaches.
 *  0.42–0.73  for each modified wording the pen loops the words in the
 *             original, carries a leader through the line gap and across the
 *             gutter, and loops the replacement words in the revised text
 *             (highlights appear as each loop closes); the pen is laid down.
 *  0.73–1.00  the reviewer stamps the pair across the gutter (final state
 *             "compared", done by 0.83), then the state tag and editorial
 *             notes appear and the labelled final state holds from 0.88.
 * The final state is supplied (compared / linked / aligned); nothing about
 * validity or legal effect is shown.
 * @module animations/documents/LAW-0013
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {comparedFields, compareDesk, buildDiff, COMPARE_STRINGS, STAGE} from './kits/redaccion-comparada.js';

const ID = 'LAW-0013';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action windows inside the beats. */
const W = {
  place: [0.15, 0.32], release: [0.32, 0.4], bands: [0.29, 0.39],
  pen: [0.31, 0.72], withdraw: [0.72, 0.76], stamp: [0.7, 0.83], note: [0.83, 0.88],
};
/** The action (placement → links → stamp) ends here, so the labelled final state holds from 0.88. */
const ACTION_END = 0.83;

const sceneSchema = {
  ...comparedFields,
  ...storyFields({
    original: str('Tab label of the original version (A)', 40),
    revised: str('Tab label of the revised version (B)', 40),
    folder: str('Label on the folder tab', 40),
    stamp: str('Text of the comparison stamp pressed across both versions', 24),
  }, ['original', 'revised', 'link'], ['compared', 'linked', 'aligned']),
};

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
  actorLabels: {a: 'Drafting party', b: 'Reviewer'},
  objectLabels: {original: 'Original text', revised: 'Revised text', folder: 'Drafting file', stamp: 'COMPARED'},
  actionProgress: 1,
  annotations: [{target: 'link', text: 'Each line joins a modified word to its replacement'}],
  finalState: 'compared',
};

/** Height of the editorial band above the desk (notes + state tag). */
const BAND = {landscape: 0, square: 0, portrait: 0};

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const st = STAGE[shape];
    const band = BAND[shape];
    const s = Math.min(ctx.design.w / st.w, (ctx.design.h - band) / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = band + (ctx.design.h - band - st.h * s) / 2;
    const diff = buildDiff(p.clauses, p.edits, p.redactions);
    const stamped = p.finalState === 'compared';
    const stage = compareDesk(ctx, {
      prefix: 'stage', shape, diff, incoming: 'B',
      doc: {docId: p.documentId, title: p.documentTitle},
      labels: {filed: p.objectLabels.original || ctx.t.original, incoming: p.objectLabels.revised || ctx.t.revised, folder: p.objectLabels.folder, stamp: p.objectLabels.stamp},
      signers: p.signers, actorLabels: p.actorLabels, withStamp: stamped,
    });
    // Editorial notes live in the free desk band above the folder; each
    // leader drops onto its target (tab of a version, or the first link where
    // it crosses the gutter) without crossing text.
    const firstLink = stage.marks.find(m => m.kind === 'link');
    // version notes land on the top edge of their sheet, right of the folder's
    // label tab (so the leader never crosses that label) and left of the dog-ear
    const [fx, , fw] = st.folder;
    const folderTabEnd = fx + fw * 0.06 + Math.min(fw * 0.3, 300);
    const edgeX = clamp(folderTabEnd + 18 - stage.aTL.x, stage.sw * 0.55, stage.sw - stage.L.fold - 14);
    const edgePt = side => stage.sheetPoint(side, {x: edgeX, y: 0});
    const targets = {
      original: edgePt('A'),
      revised: edgePt('B'),
      link: firstLink ? firstLink.gutterMid : {x: stage.gx, y: stage.aTL.y + 40},
    };
    // Notes sit in the free band above the folder (below the state tag and the
    // drafter's caption) — or in the empty upper half of the portrait desk,
    // where two notes about the two sheets stand side by side, each over its
    // own sheet, and any other set is stacked by measured height.
    const notes = [];
    const port = shape === 'portrait';
    const tagH = 28 * 1.75;
    let tagY = port ? 250 : 22;
    if (ctx.show('all')) {
      const size = port ? 30 : 28;
      const slots = {original: stage.aTL.x + stage.sw * 0.5, revised: stage.bTL.x + stage.sw * 0.5, link: stage.gx};
      const n = p.annotations.length;
      const bySheet = n === 2 && p.annotations[0].target !== p.annotations[1].target && p.annotations.every(a => a.target !== 'link');
      const make = (a, i, x, y, maxW, maxLines) => callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x, y}, target: targets[a.target], maxWidth: maxW, size, maxLines});
      if (port) {
        // free band: below the state tag, above the folder's label tab
        const bottom = st.folder[1] - 34 - 14;
        const topMin = (stage.chipBoxes.a ? stage.chipBoxes.a.y + stage.chipBoxes.a.h : 22) + 16;
        if (bySheet) {
          const maxW = (st.w - 56) / 2;
          const xs = p.annotations.map(a => clamp(slots[a.target], maxW / 2 + 16, st.w - maxW / 2 - 16));
          const hs = p.annotations.map((a, i) => make(a, i, xs[i], 0, maxW, 3).box.h);
          p.annotations.forEach((a, i) => notes.push(make(a, i, xs[i], bottom - Math.max(...hs), maxW, 3)));
          tagY = Math.max(topMin, Math.min(250, bottom - Math.max(...hs) - 16 - tagH));
        } else {
          const maxW = st.w * 0.9;
          const hs = p.annotations.map((a, i) => make(a, i, st.w / 2, 0, maxW, 2).box.h);
          const total = hs.reduce((q, v) => q + v, 0) + 14 * Math.max(0, n - 1);
          tagY = Math.max(topMin, Math.min(250, bottom - total - 16 - tagH));
          let y = Math.max(tagY + tagH + 16, Math.min(330, bottom - total));
          p.annotations.forEach((a, i) => {
            notes.push(make(a, i, st.w / 2, y, maxW, 2));
            y += hs[i] + 14;
          });
        }
      } else {
        const maxW = st.w * 0.46;
        let y = 80;
        p.annotations.forEach((a, i) => {
          const x = clamp(slots[a.target], maxW / 2 + 16, st.w - maxW / 2 - 16);
          const note = make(a, i, x, n === 1 || bySheet ? 92 : y, maxW, 2);
          notes.push(note);
          y += note.box.h + 10;
        });
      }
    }
    const t = ctx.t;
    const stateText = p.finalState === 'compared' ? t.compared : p.finalState === 'linked' ? t.linked : t.aligned;
    const tagAt = port ? {x: st.w / 2, y: tagY, anchor: 'middle'} : {x: 34, y: tagY, anchor: 'start'};
    const tag = ctx.show('key') ? statusTag(ctx, stateText, {...tagAt, size: 28, name: 'state-tag', color: p.finalState === 'aligned' ? th.inkSoft : th.accent4, opacity: 0}) : null;
    return {stage, s, ox, oy, notes, tag, diff, stamped};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const links = p.finalState !== 'aligned';
    const v = {
      place: seg(a, ...W.place),
      release: seg(a, ...W.release),
      bands: seg(a, ...W.bands),
      pen: links ? seg(a, ...W.pen) : 0,
      withdraw: links ? seg(a, ...W.withdraw) : 0,
      stamp: L.stamped ? seg(a, ...W.stamp) : 0,
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: r(done ? clamp((u - W.note[0]) / 0.05) : 0, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        changes: L.diff.order.length,
        unmatchedEdits: L.diff.unmatched,
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'documents-04-story',
    title: 'Compared drafting — linking the modified words',
    titleEs: 'Redacción comparada — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Redacción comparada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down review desk: the drafting party lays the revised text beside the filed original so their clause rows align; the reviewer’s pen loops each modified word in the original, carries a leader across the gutter and loops its replacement; the pair is then stamped as compared. Final state supplied by the author (compared, linked or aligned).',
    tags: ['comparison', 'redline', 'versions', 'wording', 'document', 'pen', 'folder', 'stamp', 'hands', 'desk'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/redaccion-comparada.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: COMPARE_STRINGS,
  scene,
});
