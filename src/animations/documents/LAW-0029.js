/**
 * LAW-0029 — Cadena de versiones · story
 *
 * Storyboard (top-down desk microscene):
 *  0.00–0.15  rest: loose copies lie shuffled on the desk (each header shows
 *             its editable identifier and one pip per position), an empty
 *             file on the right, the reviewer’s tab pad and pen in reach.
 *  0.15–0.54  the clerk’s hand picks the copies oldest first and slides each
 *             onto the file; every newer copy lands on top, offset so the
 *             older header bands stay visible — the copies form a chain.
 *  0.47–0.80  the reviewer takes an index tab from the pad, presses it onto
 *             the header band of the selected copy (the tab protrudes from
 *             the chain) and lets go; the other hand picks up the pen, ticks
 *             the tab, lays the pen back down and withdraws.
 *  0.80–1.00  hold: ordered chain + tab; a descriptive tag names the tabbed
 *             copy and optional callouts point at the selected / previous
 *             copy / file (all in by 0.87). No legal effect is stated.
 * Hands carry props at solved grip points; the copy under the hand never
 * detaches; the tab is released only after it is pressed on.
 * @module animations/documents/LAW-0029
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {documentsFields, storyFields, str} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {versionDesk, versionFields, versionIndex, tightChip, elbowCallout, STAGE, TAB_COLOR} from './kits/cadena-de-versiones.js';
import {shade} from '../../primitives/paper.js';

const ID = 'LAW-0029';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). Ordering starts the action; the tab and tick complete it. */
const W = {
  order: [0.15, 0.54], homeA: [0.54, 0.61],
  tabReach: [0.47, 0.54], tabCarry: [0.54, 0.605], tabPress: [0.605, 0.63], tabRelease: [0.63, 0.675],
  penReach: [0.615, 0.655], penApproach: [0.655, 0.685], penWrite: [0.685, 0.725], penReturn: [0.725, 0.76], penWithdraw: [0.76, 0.795],
  note: [0.8, 0.87],
};
const ACTION_END = 0.795;

const STRINGS = {
  en: {ordered: 'Ordered — no tab yet'},
  es: {ordered: 'Ordenadas — sin pestaña'},
};

const sceneSchema = {
  ...documentsFields,
  ...versionFields,
  ...storyFields({
    folder: str('Label printed on the file tab', 40),
    tab: str('Name of the index tab, shown in the final tag with the tabbed version id', 40),
  }, ['selected', 'previous', 'chain', 'folder'], ['tab-applied', 'ordered-only']),
};

const defaultParams = {
  documentId: 'DOC-311',
  documentTitle: 'Supply Agreement',
  clauses: ['Scope of supply', 'Prices (hypothetical)', 'Delivery schedule'],
  signers: [{name: 'Lena Ortiz', role: 'Clerk'}, {name: 'Kofi Mensah', role: 'Reviewer'}],
  redactions: [],
  versions: [
    {id: 'v1', date: 'Day 2'},
    {id: 'v2', date: 'Day 5'},
    {id: 'v3', date: 'Day 9'},
    {id: 'v4', date: 'Day 12'},
  ],
  selectedVersion: 'v4',
  actorLabels: {a: 'Clerk', b: 'Reviewer'},
  objectLabels: {folder: 'Version file', tab: 'Selected version'},
  actionProgress: 1,
  annotations: [{target: 'previous', text: 'Previous version stays in the chain'}],
  finalState: 'tab-applied',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [STAGE.horizontal.w, STAGE.horizontal.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.vertical.w, STAGE.vertical.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const people = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const selected = versionIndex(p.versions, p.selectedVersion);
    const tabbed = p.finalState === 'tab-applied';
    const stage = versionDesk(ctx, {
      prefix: 'stage', axis, versions: p.versions, selected,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      people, folderLabel: p.objectLabels.folder, withTab: true,
    });
    const G = stage.G;
    const vertical = axis === 'vertical';

    // --- final tag: beside the protruding tab when it fits on one line;
    // otherwise directly under the tab, next to the tabbed copy itself (the
    // strip right of the tab is narrow in the square and portrait stages).
    // Never above the tab, where it would sit beside the previous copy's band.
    let tag = null;
    if (ctx.show('key')) {
      const text = tabbed ? `${p.objectLabels.tab} · ${p.versions[selected].id}` : ctx.t.ordered;
      const size = axis === 'square' ? 31 : vertical ? 28 : 28;
      const oneLine = c => c.fit.lines.length === 1 && !c.fit.truncated && c.fit.size >= size * 0.86;
      if (tabbed) {
        const tip = stage.tabTip(selected);
        const att = stage.tabAttach(selected);
        const x = tip.x + 14;
        const opts = {x, maxWidth: st.w - x - 16, size, maxLines: 3, fill: th.card, stroke: shade(TAB_COLOR, -0.35), name: 'state-tag', weight: 700};
        const probe = tightChip(ctx, text, {...opts, y: 0});
        // under the tab: clear of the right edges of any later copies below it
        const x2 = att.x + Math.max(0, p.versions.length - 1 - selected) * G.step.dx + 10;
        const opts2 = {...opts, x: x2, maxWidth: st.w - x2 - 16};
        const probe2 = tightChip(ctx, text, {...opts2, y: 0});
        if (!oneLine(probe) && oneLine(probe2)) tag = tightChip(ctx, text, {...opts2, y: att.y + G.tab.h / 2 + 12});
        else tag = tightChip(ctx, text, {...opts, y: tip.y - probe.box.h / 2});
      } else {
        // beside the newest copy's band, where a tab would otherwise protrude
        const bb = stage.bandBox(p.versions.length - 1);
        const x = bb.x + bb.w + 18;
        const opts = {x, maxWidth: st.w - x - 16, size, maxLines: 3, fill: th.card, name: 'state-tag', weight: 700};
        const probe = tightChip(ctx, text, {...opts, y: 0});
        tag = tightChip(ctx, text, {...opts, y: bb.y + bb.h / 2 - probe.box.h / 2});
      }
    }

    // --- editorial callouts in the desk area freed by the pile, left of the chain
    const targets = {
      selected: tabbed ? stage.bandBox(selected) : null,
      previous: selected > 0 ? stage.bandBox(selected - 1) : null,
      chain: (() => {
        const cb = stage.chainBox;
        return {x: cb.x, y: cb.y + cb.h * 0.55, w: 0, h: 0};
      })(),
      // the file's labelled tab (top-left of the file, clear of the clerk's hand)
      folder: {x: G.folder.x + 10, y: G.folder.y - 17, w: 0, h: 0},
    };
    const notes = [];
    if (ctx.show('all')) {
      const cb = stage.chainBox;
      const list = p.annotations.map((a, i) => ({a, i, box: targets[a.target]})).filter(x => x.box);
      if (!vertical) {
        // chips left of the chain at their target's height; straight leaders
        const right = cb.x - 64;
        const maxW = right - 36;
        let lastBottom = -Infinity;
        // stacked top-down in the order of their targets, so leaders never cross
        const tgtY = box => box.y + (box.h ? box.h / 2 : 0);
        for (const {a, i, box} of list.slice().sort((m, n) => tgtY(m.box) - tgtY(n.box))) {
          const tgt = {x: box.x + (box.w ? 8 : 4), y: box.y + (box.h ? box.h / 2 : 0)};
          const probe = tightChip(ctx, a.text, {x: right, y: 0, anchor: 'end', maxWidth: maxW, size: 30, maxLines: 3});
          let y = Math.max(tgt.y - probe.box.h / 2, lastBottom + 14);
          y = Math.min(y, st.h - 24 - probe.box.h);
          const c = elbowCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: right, y}, anchor: 'end', via: [], target: tgt, maxWidth: maxW, size: 30, maxLines: 3});
          lastBottom = c.box.y + c.box.h;
          notes.push(c);
        }
      } else {
        // portrait: chips in the desk area freed by the pile (top). Leaders
        // leave each chip's left edge, run down the gutter between the file
        // edge and the chain, then in to the band. The top chip serves the
        // deepest target on the outermost gutter, so leaders never cross.
        const gutter0 = (G.folder.x + cb.x) / 2;
        const x0 = cb.x + 6;
        const maxW = G.penRest.x - 40 - x0;
        const items = list.map(x => ({...x, tgt: {x: x.box.x + (x.box.w ? 8 : 4), y: x.box.y + (x.box.h ? x.box.h / 2 : 0)}}))
          .sort((m, n) => n.tgt.y - m.tgt.y);
        const probes = items.map(it => tightChip(ctx, it.a.text, {x: x0, y: 0, maxWidth: maxW, size: 28, maxLines: 3}));
        let y = G.folder.y - 110 - probes.reduce((acc, pb) => acc + pb.box.h + 18, -18);
        items.forEach((it, j) => {
          const gx = gutter0 - 6 * (items.length - 1) + 12 * j;
          const mid = y + probes[j].box.h / 2;
          const c = elbowCallout(ctx, {name: `note${it.i}`, text: it.a.text, chipAt: {x: x0, y}, via: [{x: gx, y: mid}, {x: gx, y: it.tgt.y}], target: it.tgt, maxWidth: maxW, size: 28, maxLines: 3});
          y += probes[j].box.h + 18;
          notes.push(c);
        });
      }
    }
    return {stage, s, ox, oy, tag, notes, tabbed, selected};
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
    const on = w => (L.tabbed ? seg(a, ...w) : 0);
    const posed = L.stage.pose({
      order: seg(a, ...W.order),
      homeA: seg(a, ...W.homeA),
      tabReach: on(W.tabReach), tabCarry: on(W.tabCarry), tabPress: on(W.tabPress), tabRelease: on(W.tabRelease),
      penReach: on(W.penReach), penApproach: on(W.penApproach), penWrite: on(W.penWrite), penReturn: on(W.penReturn), penWithdraw: on(W.penWithdraw),
    });
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        selected: p.versions[L.selected].id,
        chainOrder: posed.semantic.order.map(k => p.versions[k].id),
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
    slug: 'documents-08-story',
    title: 'Version chain — filing copies and tabbing the selected one',
    titleEs: 'Cadena de versiones — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Cadena de versiones',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: a clerk files shuffled copies oldest first into a shingled chain on a version file; a reviewer presses an index tab onto the header band of the selected copy and ticks it with a pen. The final state is supplied by the author (tab applied or ordered only).',
    tags: ['versions', 'version chain', 'copies', 'index tab', 'folder', 'pen', 'ordering', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/cadena-de-versiones.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
