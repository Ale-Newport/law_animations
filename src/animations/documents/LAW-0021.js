/**
 * LAW-0021 — Anexo incorporado · story
 *
 * Storyboard (top-down desk microscene; the annex physically travels to the
 * contract and joins it at one clause):
 *  0.00–0.15  rest: contract (anchor) with numbered clauses and a ruled right
 *             margin; the annex (tinted schedule sheet with an index tab) sits
 *             in the pocket of the folder; A holds the pen, the seal rests.
 *  0.15–0.42  B reaches into the folder, slides the annex out of the pocket and
 *             carries it toward the contract, then releases it: the annex
 *             glides the last stretch on its own.
 *  0.42–0.73  the annex settles on the margin with its tab at the linked clause
 *             (the clause row lights up only when the tab lands); A writes the
 *             cross-reference at the end of the clause, draws the link loop to
 *             the tab eyelet, lays the pen down, takes the seal and presses a
 *             joint seal across the seam.
 *  0.73–1.00  hold: the supplied final state (linked / separate) with one
 *             descriptive tag; no legal effect is stated.
 * With finalState "separate" the annex glides to a spot beside the contract
 * (a visible gap), no link loop is drawn and the seal lands on the annex alone.
 * @module animations/documents/LAW-0021
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, lerp, clamp} from '../../core/time.js';
import {documentsFields, storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {annexDesk, annexFields, placeCallouts, ANNEX_STRINGS, STAGE} from './kits/anexo-incorporado.js';

const ID = 'LAW-0021';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows. */
const W = {
  reachB: [0.15, 0.21], slideOut: [0.21, 0.27], carry: [0.27, 0.38], glide: [0.38, 0.46], retreatB: [0.41, 0.53],
  highlight: [0.44, 0.5],
  reachA: [0.36, 0.42], penLift: [0.42, 0.475], write: [0.475, 0.55], link: [0.55, 0.605], penBack: [0.605, 0.65],
  toStamp: [0.65, 0.68], stamp: [0.68, 0.79], retreatA: [0.79, 0.845],
  tag: [0.8, 0.85], note: [0.82, 0.9],
};
const ACTION_END = 0.845;

const STRINGS = {
  en: {...ANNEX_STRINGS.en, linkedTo: 'Annex linked to clause {n}', keptApart: 'Annex kept separate'},
  es: {...ANNEX_STRINGS.es, linkedTo: 'Anexo enlazado a la cláusula {n}', keptApart: 'Anexo separado'},
};

const sceneSchema = {
  ...documentsFields,
  ...annexFields,
  ...storyFields({
    folder: str('Label printed on the folder pocket that holds the annex', 40),
    seal: str('Text inside the round seal impression', 20),
  }, ['annex', 'clause', 'link', 'seal', 'folder'], ['linked', 'separate']),
};

const defaultParams = {
  documentId: 'CTR-208',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties and purpose', 'Delivery of the goods', 'Price (hypothetical)'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  linkedClause: 1,
  annex: {label: 'ANNEX 1', title: 'Delivery schedule'},
  reference: 'see Annex 1',
  actorLabels: {a: 'Drafting party', b: 'Counterparty'},
  objectLabels: {folder: 'Annexes', seal: 'CTR-208'},
  actionProgress: 1,
  // neutral with respect to finalState: the reference is written in both states
  annotations: [{target: 'clause', text: 'Clause 2 refers to Annex 1'}],
  finalState: 'linked',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const linked = p.finalState === 'linked';
    const actors = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const stage = annexDesk(ctx, {
      prefix: 'stage', axis, linked,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      annex: {labels: [p.annex.label], title: p.annex.title},
      refTexts: [p.reference], clause: p.linkedClause,
      actors, folderLabel: p.objectLabels.folder, sealLabel: p.objectLabels.seal,
    });
    const k = stage.k1;
    const target = linked ? stage.dock1 : stage.sepPose;
    const ink = stage.inkRows[k];
    const sealSpot = linked ? stage.sealSpotLinked : stage.annexPoint(target, stage.sealLocalSep);
    // linked: the link is pointed at on its rising stroke, just left of the tab,
    // so the leader drops through the empty contract margin and never runs down
    // the seam (where the joint seal is pressed) or across the document title
    const linkTarget = (() => {
      const tabLeft = stage.docTL.x + stage.dw - stage.overlap - stage.annex.tabW;
      const right = Math.min(stage.seamX - stage.sealR - 10, tabLeft - 3);
      const left = Math.max(ink.x1 + 16, stage.docTL.x + stage.contract.titleRight + 12);
      // midway between the ruled margin and the tab
      const tx = clamp((stage.docTL.x + stage.contract.ruleX + tabLeft) / 2, left, Math.max(left, right));
      const pts = ink.lpath.pts;
      let q = pts[pts.length - 1];
      for (let i = 1; i < pts.length; i++) if (pts[i].x >= tx && pts[i - 1].x < tx) { q = pts[i]; break; }
      return {x: q.x, y: q.y - 2};
    })();
    const targets = {
      annex: stage.annexPoint(target, {x: stage.aw * 0.18, y: -stage.ah / 2 + 4}),
      // the right end of the written reference: the leader then drops through the
      // clause rows' right side, clear of the document title
      // (moved right of the document title when the title is wider, so the
      // leader never crosses it)
      clause: {x: Math.max(ink.x1 - 6, stage.docTL.x + stage.contract.titleRight + 14), y: ink.box.y - 10},
      link: linked ? linkTarget : {x: ink.x1, y: ink.box.y + 6},
      seal: {x: sealSpot.x, y: sealSpot.y - stage.sealR},
      folder: {x: stage.restPose.x, y: stage.restPose.y},
    };
    const Hn = stage.hints;
    const tagText = linked ? ctx.t.linkedTo.replace('{n}', String(k + 1)) : ctx.t.keptApart;
    // portrait: the tag sits under the annex (the top band is taken by chips)
    const tagAt = Hn.tag.below
      ? {x: clamp(target.x, 290, st.w - 290), y: Math.min(target.y + stage.ah / 2 + 18, (Hn.chipB ? Hn.chipB.y : st.h) - 70), anchor: 'middle'}
      : Hn.tag;
    const tag = ctx.show('key') ? statusTag(ctx, tagText, {x: tagAt.x, y: tagAt.y, anchor: tagAt.anchor, size: 30, maxWidth: Hn.tag.maxWidth - 76, name: 'state-tag', color: linked ? ctx.theme.accent2 : ctx.theme.inkSoft}) : null;
    const notes = ctx.show('all')
      ? placeCallouts(ctx, p.annotations.map((a, i) => ({name: `note${i}`, text: a.text, target: targets[a.target]})), Hn.annot, c => callout(ctx, c))
      : [];
    return {stage, s, ox, oy, notes, tag, linked};
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
    const linked = L.linked;
    const v = {linked};
    for (const [key, w] of Object.entries(W)) v[key] = seg(a, ...w);
    if (!linked) {
      v.link = 0;
      v.highlight = 0;
    }
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? seg(u, ...W.tag) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-06-story',
    title: 'Annex incorporated — desk microscene',
    titleEs: 'Anexo incorporado — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Anexo incorporado',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: party B slides the annex out of a folder pocket and sends it gliding onto the contract margin, where its index tab lands at the linked clause; party A writes the cross-reference, draws the link loop to the tab eyelet and presses a joint seal across the seam. The final state (linked or kept separate) is supplied by the author.',
    tags: ['annex', 'contract', 'clause', 'cross-reference', 'folder', 'seal', 'pen', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/anexo-incorporado.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
