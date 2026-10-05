/**
 * LAW-0025 — Traducción paralela · story
 *
 * Storyboard (top-down translation desk, 6 s):
 *  0.00–0.15  rest: the source page (left) and its translation (right) lie on
 *             an open sage folder with a wide gutter; segment badges are
 *             neutral, the key term is highlighted on the source page. The
 *             translator's hand rests holding the pen; the reviewer's stamp
 *             rests at the top edge.
 *  0.15–0.42  the pen travels into the gutter and draws the first guides: an
 *             S-curve from source segment N to translated segment N. When a
 *             guide lands, brackets grow along both segments (different
 *             heights on each page), both badges take the pair colour and the
 *             segments tint.
 *  0.42–0.73  the last guide is drawn; the pen marks the term: it underlines
 *             the equivalent ("translation available") or writes a "?" in the
 *             dashed box that retains the source term ("term without confirmed
 *             equivalent", dashed bracket). The pen returns to rest; the
 *             reviewer carries the stamp to the translation header and presses
 *             it.
 *  0.73–1.00  hold: every guide, bracket, tint and the stamp stay; the
 *             supplied state is labelled (descriptive only, no legal effect).
 * The pen tip is computed from the solved hand and is the end of the ink
 * while drawing; the stamp follows the reviewer's solved hand.
 * @module animations/documents/LAW-0025
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {translationFields, TP_STRINGS, translationDesk, deskLayout, DESK, routedCallout, stateChip} from './kits/traduccion-paralela.js';

const ID = 'LAW-0025';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action windows: the pen plan (guides + term mark + return) and the stamp. */
const W = {pen: [0.15, 0.66], stamp: [0.62, 0.8], tag: [0.8, 0.86], note: [0.8, 0.9]};
const ACTION_END = 0.8;

const sceneSchema = {
  ...translationFields,
  ...storyFields({
    folder: str('Label printed on the folder tab', 40),
    stamp: str('Text of the reviewer stamp pressed on the translation header', 22),
  }, ['guide', 'term', 'stamp'], ['aligned', 'term-unconfirmed']),
};
sceneSchema.finalState = {...sceneSchema.finalState, description: 'State supplied for the final hold: "aligned" (every guide drawn, the equivalent of the term is available and underlined) or "term-unconfirmed" (every guide drawn, the term keeps a dashed box with a question mark). No legal conclusion is inferred.'};

const defaultParams = {
  documentId: 'TR-208',
  documentTitle: 'Carta de entrega',
  targetTitle: 'Delivery letter',
  languages: {source: 'ES', target: 'EN'},
  clauses: [
    'El proveedor entrega veinte cajas el día 3.',
    'La carga se deja en la lonja del puerto.',
    'Cada parte guarda una copia de esta carta.',
  ],
  translations: [
    'The supplier delivers twenty boxes on day 3.',
    'The load is left at the port fish-market hall.',
    'Each party keeps a copy of this letter.',
  ],
  term: {segment: 1, source: 'lonja', target: 'fish-market hall'},
  signers: [{name: 'Lena Ortiz', role: 'Translator'}, {name: 'Tomás Rivera', role: 'Reviewer'}],
  redactions: [],
  actorLabels: {a: 'Translator', b: 'Reviewer'},
  objectLabels: {folder: 'Translation file', stamp: 'ALIGNED'},
  actionProgress: 1,
  annotations: [{target: 'guide', text: 'Each guide joins equivalent segments'}],
  finalState: 'aligned',
};

const KEY = {landscape: 'landscape', square: 'square', portrait: 'portrait'};

/**
 * Desk + editorial layer for one shape. `extraTop` grows a band at the top of
 * the desk; `k` scales the editorial note sizes. Returns whether the note
 * stack ends above the folder tab.
 */
function composeDesk(ctx, key, extraTop, k) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const G = DESK[key];
  const unconfirmed = p.finalState === 'term-unconfirmed';
  const L = deskLayout(ctx, key, p);
  const wide = key === 'landscape';
  const portrait = key === 'portrait';
  const gx0 = G.spread[0] + L.pageW + G.gutter / 2;
  const guideHalf = Math.min(G.gutter * 2.4, 460) / 2;
  const hasGuideNote = ctx.show('all') && p.annotations.some(a => a.target === 'guide');
  const stage = translationDesk(ctx, {
    extraTop,
    chipBMinX: wide && hasGuideNote ? gx0 + guideHalf + 24 : 0,
    // portrait: the reviewer chip heads the editorial stack at the top-left, clear of the reviewer's arm
    chipBAt: portrait ? {x: 20, y: 18, anchor: 'start', maxWidth: G.W * 0.7} : undefined,
    // landscape: the folder tab stays left of the guide note over the gutter
    folderTabMax: wide && hasGuideNote ? gx0 - guideHalf - 16 : undefined,
    prefix: 'stage', key, p, L,
    slotVariants: [unconfirmed ? {key: 'un', kind: 'unc'} : {key: 'av', kind: 'avail', text: p.term.target}],
    plans: [[...Array.from({length: L.n}, (_, i) => `link${i}`), unconfirmed ? 'q' : 'ul']],
    dashedTarget: unconfirmed,
    stampLabel: p.objectLabels.stamp, folderLabel: p.objectLabels.folder, actorLabels: p.actorLabels,
  });

  // --- editorial layer: state chip + annotations in text-free zones.
  // Leaders run through text-free lanes only: the gutter (guide), the outer
  // padding of the translated page (term) and the header margin (stamp).
  const gutterX = stage.srcTL.x + L.pageW + G.gutter / 2;
  const tgtRight = stage.tgtTL.x + L.pageW;
  const lane = tgtRight - L.pad * 0.45;
  // key sizes: >= ~20 px at 1080p in every ratio (square scale is ~0.6)
  const noteSize = (wide ? 31 : portrait ? 28 : 40) * k;
  const sp = stage.stampSpot;
  const sb = stage.slotBox;
  const targetX = a => (a.target === 'term' ? lane : a.target === 'stamp' ? sp.x : gutterX);
  const anns = ctx.show('all') ? p.annotations.map((a, i) => ({...a, i})).filter(a => (a.target !== 'guide' || stage.links.length) && (a.target !== 'term' || sb)) : [];
  const stateLines = [t.aligned, unconfirmed ? t.unconfirmed : t.available];
  const stateColor = unconfirmed ? th.accent : th.accent4;
  let tag = null;
  const notes = [];
  if (wide) {
    // right zone: state chip, then stamp / term notes whose leaders go left
    const zone = {x: tgtRight + 60, y: 250, w: stage.W - tgtRight - 80, bottom: 790};
    let zy = zone.y;
    if (ctx.show('key')) {
      tag = stateChip(ctx, stateLines, {x: zone.x, y: zy, size: noteSize, maxWidth: zone.w, name: 'state-tag', color: stateColor});
      zy += tag.box.h + 22;
    }
    anns.sort((a, b) => (a.target === 'stamp' ? -1 : b.target === 'stamp' ? 1 : 0)).forEach(a => {
      const name = `note${a.i}`;
      if (a.target === 'guide') {
        // top band of the desk, fully between the desk frame and the folder
        const top = stage.links[0].geo.poly.at(0.5);
        const mk = y => routedCallout(ctx, {name, text: a.text, chipAt: {x: gutterX, y}, anchor: 'middle', maxWidth: guideHalf * 2, size: noteSize * 0.9, maxLines: 2,
          color: stage.links[0].color, route: b => [{x: gutterX, y: b.y + b.h}, {x: gutterX, y: top.y - 10}]});
        const probe = mk(0);
        notes.push(mk(Math.max(26, Math.min(40, stage.srcTL.y - 34 - 8 - probe.box.h))));
      } else if (a.target === 'term') {
        const gapY = sb.y + sb.h + L.s * 0.16;
        const c = routedCallout(ctx, {name, text: a.text, chipAt: {x: zone.x, y: Math.max(zy, Math.min(zone.bottom - 130, sb.y - 20))}, anchor: 'start', maxWidth: zone.w, size: noteSize * 0.9, maxLines: 3,
          route: b => [{x: b.x, y: b.y + b.h / 2}, {x: lane, y: b.y + b.h / 2}, {x: lane, y: gapY}, {x: sb.x + sb.w - 6, y: gapY}, {x: sb.x + sb.w - 6, y: sb.y + sb.h + 1}]});
        zy = c.box.y + c.box.h + 18;
        notes.push(c);
      } else {
        const c = routedCallout(ctx, {name, text: a.text, chipAt: {x: zone.x, y: zy}, anchor: 'start', maxWidth: zone.w, size: noteSize * 0.9, maxLines: 3,
          route: b => [{x: b.x, y: b.y + b.h / 2}, {x: sp.x + L.stamp.w / 2 + 8, y: b.y + b.h / 2}, {x: sp.x + L.stamp.w / 2 + 8, y: sp.y}]});
        zy = c.box.y + c.box.h + 18;
        notes.push(c);
      }
    });
    return {stage, tag, notes, fits: true, extraTop};
  }
  // top-left stack above the folder tab; each leader runs right above the
  // folder, then straight down its lane. Ordered by target x (far → near)
  // so no two leaders cross.
  const zoneX = 20;
  const zoneBottom = stage.folderTop - 10;
  const chipB = stage.chipB;
  let zy = portrait && chipB ? chipB.box.y + chipB.box.h + 14 : 20;
  // square: the stack keeps clear of the reviewer chip on its right
  const colMax = portrait || !chipB ? G.W * 0.62 : chipB.box.x - 34 - zoneX;
  if (ctx.show('key')) {
    tag = stateChip(ctx, stateLines, {x: zoneX, y: zy, size: noteSize, maxWidth: Math.min(colMax, 600), name: 'state-tag', color: stateColor});
    zy += tag.box.h + 12;
  }
  anns.slice().sort((a, b) => targetX(b) - targetX(a)).forEach(a => {
    const name = `note${a.i}`;
    const tx = targetX(a);
    const maxW = Math.min(tx - zoneX - 50, colMax);
    const color = a.target === 'guide' ? stage.links[0].color : undefined;
    const c = routedCallout(ctx, {name, text: a.text, chipAt: {x: zoneX, y: zy}, anchor: 'start', maxWidth: maxW, size: noteSize * 0.9, maxLines: 3, color,
      route: b => {
        const my = b.y + b.h / 2;
        if (a.target === 'guide') return [{x: b.x + b.w, y: my}, {x: gutterX, y: my}, {x: gutterX, y: stage.links[0].geo.poly.at(0.5).y - 10}];
        if (a.target === 'stamp') return [{x: b.x + b.w, y: my}, {x: sp.x, y: my}, {x: sp.x, y: sp.y - L.stamp.h / 2 - 6}];
        const gapY = sb.y + sb.h + L.s * 0.16;
        return [{x: b.x + b.w, y: my}, {x: lane, y: my}, {x: lane, y: gapY}, {x: sb.x + sb.w - 6, y: gapY}, {x: sb.x + sb.w - 6, y: sb.y + sb.h + 1}];
      }});
    zy = c.box.y + c.box.h + 12;
    notes.push(c);
  });
  const bottom = zy - 12;
  return {stage, tag, notes, bottom, zoneBottom, fits: bottom <= zoneBottom, extraTop};
}

const scene = {
  sizes: {landscape: [DESK.landscape.W, DESK.landscape.H], square: [DESK.square.W, DESK.square.H], portrait: [DESK.portrait.W, DESK.portrait.H]},
  layout(ctx) {
    const p = ctx.params;
    const key = KEY[ctx.view.shape];
    const wide = key === 'landscape';
    let res = composeDesk(ctx, key, 0, 1);
    if (!wide && !res.fits) {
      // bounded reflow: shrink the notes a little, then let the desk grow a
      // top band (the whole scene scales down a bit) rather than overlap
      for (const k of [0.95, 0.9]) {
        res = composeDesk(ctx, key, 0, k);
        if (res.fits) break;
      }
      if (!res.fits) res = composeDesk(ctx, key, Math.min(300, Math.ceil(res.bottom - res.zoneBottom + 6)), 0.9);
    }
    const {stage} = res;
    const s = Math.min(ctx.design.w / stage.W, ctx.design.h / stage.H);
    const ox = (ctx.design.w - stage.W * s) / 2;
    const oy = (ctx.design.h - stage.H * s) / 2;
    return {stage, L: stage.L, s, ox, oy, tag: res.tag, notes: res.notes, unconfirmed: p.finalState === 'term-unconfirmed', extraTop: res.extraTop};
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
    const posed = L.stage.pose({
      pen: [seg(a, ...W.pen)],
      stamp: seg(a, ...W.stamp),
      slot: L.unconfirmed ? {un: 1} : {av: 1},
    });
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp(seg(u, ...W.tag)) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        pairs: L.L.n,
        termSlot: L.unconfirmed ? 'unconfirmed' : 'available',
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
    slug: 'documents-07-story',
    title: 'Parallel translation — linking equivalent segments at the desk',
    titleEs: 'Traducción paralela — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Traducción paralela',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: a source page and its translation lie on an open folder; the translator draws a guide across the gutter for each pair of equivalent segments (brackets grow to each segment\'s own length), then underlines the available equivalent of a key term or marks it with a question mark; the reviewer stamps the translation header.',
    tags: ['translation', 'parallel text', 'segments', 'guides', 'alignment', 'term', 'pen', 'folder', 'stamp', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/traduccion-paralela.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TP_STRINGS,
  scene,
});
