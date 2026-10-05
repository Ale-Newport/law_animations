/**
 * LAW-0005 — Sellado de copia · story
 *
 * Storyboard (top-down registry desk, 6 s default):
 *  0.00–0.15  rest: signed original (A's hand on it), photocopy, ink pad,
 *             stamp on its rest, pen, B's open file. IDs printed on both sheets.
 *  0.15–0.42  B's left hand steadies the copy; B's right hand lifts the stamp,
 *             dips it into the pad, carries it raised (larger, shadow offset)
 *             over a dashed landing target and lowers it onto the copy.
 *  0.42–0.73  contact → the ink mark exists under the stamp face; the stamp
 *             lifts and returns to its rest, revealing the localized mark
 *             (a short ring pulse draws the eye). With finalState "filed" B
 *             slides the marked copy onto B's file and A draws the original
 *             back. Cause (contact) always precedes the visible effect.
 *  0.73–1.00  hold: supplied final state, one editorial callout, no legal
 *             conclusion.
 * finalState: filed | marked-on-desk | unmarked (stamp hovers, no contact).
 * @module animations/documents/LAW-0005
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {documentsFields, storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {stampingDesk, balancedWidth, boxBlocked, DESK} from './kits/sellado-de-copia.js';

const ID = 'LAW-0005';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows. */
const W = {
  reach: [0.15, 0.2], steady: [0.16, 0.23], ink: [0.2, 0.28], carry: [0.28, 0.35], descend: [0.35, 0.42],
  press: [0.42, 0.46], lift: [0.46, 0.5], hover: [0.35, 0.47], back: [0.5, 0.58], release: [0.58, 0.62],
  file: [0.59, 0.68], fileRelease: [0.68, 0.76], deskRelease: [0.58, 0.64], retrieve: [0.6, 0.71], note: [0.77, 0.87],
};
const ACTION_END = 0.76;

const STRINGS = {
  en: {filed: 'Marked copy filed', marked: 'Marked copy', unmarked: 'Copy without mark'},
  es: {filed: 'Copia marcada archivada', marked: 'Copia marcada', unmarked: 'Copia sin marca'},
};

const sceneSchema = {
  ...documentsFields,
  ...storyFields({
    stamp: str('Legend of the stamp impression (descriptive, e.g. COPY)', 24),
    folder: str('Label on the receiving file folder', 40),
  }, ['mark', 'copy', 'original', 'folder'], ['filed', 'marked-on-desk', 'unmarked']),
};

const defaultParams = {
  documentId: 'DOC-218',
  documentTitle: 'Lease Agreement',
  clauses: ['Premises', 'Rent (hypothetical)', 'Duration and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  actorLabels: {a: 'Presenting party', b: 'Receiving clerk'},
  objectLabels: {stamp: 'COPY', folder: 'Party B file'},
  actionProgress: 1,
  annotations: [{target: 'mark', text: 'Mark placed on the copy only'}],
  finalState: 'filed',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = DESK[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const signers = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const stage = stampingDesk(ctx, {
      prefix: 'stage', axis,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      signers, stampLabel: p.objectLabels.stamp, folderLabel: p.objectLabels.folder,
    });
    const filed = p.finalState === 'filed';
    const marks = p.finalState !== 'unmarked';
    const where = filed ? 'filed' : 'home';
    const {dw, dh, sw, markLocal} = stage;
    const hor = axis !== 'vertical';
    const targets = {
      // filed: the notes sit left of the file, so the leader meets the mark's left
      // edge; on the desk the notes sit above the copy, so it comes down the right
      // margin to the mark's right edge instead of crossing the title
      mark: filed ? stage.copyPoint(where, {x: markLocal.x - sw * 0.56, y: markLocal.y + 6}) : stage.copyPoint(where, {x: markLocal.x + sw * 0.5 + 10, y: markLocal.y - 4}),
      // an unmarked copy is pointed at its empty stamping spot (kept outlined in the hold)
      copy: p.finalState === 'unmarked' ? stage.copyPoint(where, {x: markLocal.x + sw * 0.5 + 12, y: markLocal.y}) : stage.copyPoint(where, {x: dw * 0.2, y: dh * 0.02}),
      // the original is pointed at its outer edge (right edge beside the desk's free
      // middle, top edge when stacked), never through its heading lines
      original: stage.origPoint(filed ? 'back' : 'home', hor ? {x: dw, y: dh * 0.3} : {x: dw * 0.55, y: 0}),
      folder: {x: stage.folderC.x - stage.fw * 0.42, y: stage.folderC.y + stage.fh * 0.5},
    };
    const stateText = p.finalState === 'unmarked' ? ctx.t.unmarked : filed ? ctx.t.filed : ctx.t.marked;
    const tagColor = p.finalState === 'unmarked' ? ctx.theme.inkSoft : ctx.theme.accent4;
    /** tag + callouts stacked on a common centre line from `top` down */
    const stack = (cx, top, noteW) => {
      const tag = ctx.show('key') ? statusTag(ctx, stateText, {x: cx, y: top, anchor: 'middle', size: 30, maxWidth: noteW, name: 'state-tag', color: tagColor}) : null;
      const notes = [];
      let nextY = tag ? tag.box.y + tag.box.h + 14 : top;
      p.annotations.forEach((a, i) => {
        if (!ctx.show('all')) return;
        const mw = balancedWidth(ctx, a.text, noteW, 30, 3);
        const n = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y: nextY}, target: targets[a.target], maxWidth: mw, size: 30, maxLines: 3});
        nextY = n.box.y + n.box.h + 14;
        notes.push(n);
      });
      return {tag, notes, boxes: [tag && tag.box, ...notes.map(n => n.box)].filter(Boolean)};
    };
    let placed = null;
    if (filed) {
      // Filed: the copy's old place in the middle of the desk is free at the end.
      const free = stage.copyHome;
      const noteW = hor ? Math.min(560, stage.copyFiled.x - stage.origBack.x - dw - 40) : Math.min(st.w * 0.6, 2 * (free.x - 30));
      const tagY = hor ? free.y - dh * 0.36 : free.y - 90;
      const tag = ctx.show('key') ? statusTag(ctx, stateText, {x: free.x, y: tagY, anchor: 'middle', size: 30, maxWidth: noteW, name: 'state-tag', color: tagColor}) : null;
      const notes = [];
      let nextY = tag ? tag.box.y + tag.box.h + 22 : hor ? 170 : free.y + 20;
      p.annotations.forEach((a, i) => {
        if (!ctx.show('all')) return;
        const tgt = targets[a.target];
        const want = hor ? Math.min(st.h - 190, tgt.y + 40) : free.y + 20;
        const mw = balancedWidth(ctx, a.text, noteW, 30, 3);
        const chipAt = {x: free.x, y: Math.max(want, nextY)};
        let n = callout(ctx, {name: `note${i}`, text: a.text, chipAt, target: tgt, maxWidth: mw, size: 30, maxLines: 3});
        if (a.target === 'original' && hor) {
          // meet the original's right edge level with the chip: the leader runs
          // straight across and never under a chip stacked above it
          const top = stage.origBack.y - dh / 2;
          const local = Math.min(dh * 0.85, Math.max(dh * 0.12, n.box.cy - top));
          n = callout(ctx, {name: `note${i}`, text: a.text, chipAt, target: stage.origPoint('back', {x: dw, y: local}), maxWidth: mw, size: 30, maxLines: 3});
        }
        nextY = n.box.y + n.box.h + 18;
        notes.push(n);
      });
      placed = {tag, notes};
    } else if (ctx.show('key')) {
      // Not filed: the copy stays on the desk and the file stays empty. The notes
      // take the free desk area nearest to the copy's stamping spot (above the
      // sheets, clear of the props, hands, arms and actor chips), never the file.
      const occ = stage.occupied({reach: 1, steady: 1, ink: 1, carry: 1, descend: marks ? 1 : 0, press: marks ? 1 : 0, lift: marks ? 1 : 0, hover: marks ? 0 : 1, back: 1, release: 1, steadyRelease: 1});
      const bounds = {x: 22, y: 22, w: st.w - 44, h: st.h - 44};
      const spot = stage.copyPoint('home', markLocal);
      const prefer = {x: spot.x, y: stage.copyHome.y - dh / 2 - 90};
      const noteW = Math.min(hor ? 560 : 440, st.w * 0.5);
      const probe = stack(0, 0, noteW);
      const sw0 = Math.max(...probe.boxes.map(b => b.x + b.w)) - Math.min(...probe.boxes.map(b => b.x));
      const sh0 = Math.max(...probe.boxes.map(b => b.y + b.h));
      let best = null;
      for (let top = bounds.y; top + sh0 <= bounds.y + bounds.h; top += 6) {
        for (let cx = bounds.x + sw0 / 2; cx + sw0 / 2 <= bounds.x + bounds.w; cx += 10) {
          const d = Math.hypot(cx - prefer.x, top + sh0 / 2 - prefer.y);
          if (best && d >= best.d) continue;
          const ok = probe.boxes.every(b => !boxBlocked(occ, {...b, x: b.x + cx, y: b.y + top}, 8, bounds));
          if (ok) best = {cx, top, d};
        }
      }
      if (best) placed = stack(best.cx, best.top, noteW);
    }
    if (!placed) {
      // last resort (very long notes): the free middle of the empty file
      const free = hor ? {x: stage.folderC.x, y: stage.folderC.y} : {x: stage.folderC.x + 40, y: stage.folderC.y};
      const noteW = hor ? stage.fw * 0.96 : Math.min(st.w * 0.6, 2 * (free.x - 30));
      placed = stack(free.x, hor ? free.y - dh * 0.36 : free.y - 90, noteW);
    }
    return {stage, s, ox, oy, notes: placed.notes, tag: placed.tag};
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
    const marks = p.finalState !== 'unmarked';
    const filed = p.finalState === 'filed';
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {
      reach: seg(a, ...W.reach),
      steady: seg(a, ...W.steady),
      ink: seg(a, ...W.ink),
      carry: seg(a, ...W.carry),
      descend: on(marks, W.descend),
      press: on(marks, W.press),
      lift: on(marks, W.lift),
      hover: on(!marks, W.hover),
      back: seg(a, ...W.back),
      release: seg(a, ...W.release),
      file: on(filed, W.file),
      steadyRelease: filed ? seg(a, ...W.fileRelease) : seg(a, ...W.deskRelease),
      retrieve: on(filed, W.retrieve),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    // unmarked: the empty landing spot stays faintly outlined for the held state
    if (!marks && done) nodes['stage-target'] = {opacity: Math.max(posed.nodes['stage-target'].opacity, Math.round(0.6 * noteP * 1000) / 1000)};
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
    slug: 'documents-02-story',
    title: 'Copy stamping — registry desk microscene',
    titleEs: 'Sellado de copia — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Sellado de copia',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down registry desk: the clerk steadies a photocopy, inks a rubber stamp, carries it raised over a landing target and lowers it onto the copy; the ink mark appears exactly under the stamp face. The marked copy can be filed while the presenting party draws the original back. Final state is supplied (filed, marked-on-desk or unmarked).',
    tags: ['stamp', 'copy', 'ink pad', 'mark', 'original', 'folder', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/sellado-de-copia.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
