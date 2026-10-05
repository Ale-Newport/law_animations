/**
 * LAW-0170 — Declaración de testigo · mechanism
 *
 * Storyboard (a plan of the two channels into a statement — not the story's
 * table scene and not a row of boxes):
 *  0.00–0.18  separate: the parts spread out from a cluster around the
 *             witness — "what happened" (a neutral gate-and-van pictogram) and
 *             the person the witness says they heard from on the left, the
 *             witness in the middle, the clerk to the right and an empty fact
 *             rail with one slot per supplied fact on the far right.
 *  0.18–0.43  only the supplied relationships are drawn, one by one, each in
 *             its kind's style: a plain relation (no arrowhead, e.g. "seen, as
 *             stated"), communications (dashed arrows, "told, as stated",
 *             "recounts"), a sequence (solid arrow, "writes each fact…").
 *             Nothing is drawn as causal unless a causal link is supplied.
 *  0.43–0.75  a tracer follows the supplied traversal order along those
 *             links. Leaving a channel it carries a small fact token marked
 *             with the stated source glyph; when it reaches the rail the
 *             token becomes that fact's labelled card. The focus element
 *             (default: the witness) enlarges while the tracer passes it.
 *  0.75–1.00  gather: tracer gone; origin (channels), transformation (the
 *             witness's statement → written cards) and state (each card with
 *             its source "as stated") stay visible, with a legend of the
 *             connection kinds the supplied links actually use (no causal
 *             sample unless a causal link is supplied) and the key "as
 *             supplied · no conclusion drawn". Captions sit beside their
 *             connectors, which are long enough to read as lines of their
 *             own. No credibility, reliability or weight is shown.
 * @module animations/roles/LAW-0170
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {LINK_STYLES, tracer} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  factField, WITNESS_DEFAULTS, WITNESS_STRINGS, captionOf, tagOf, fromOf, fitCards, factCard,
  sourceGlyph, sourceColor, sourceInk, eventIcon, fitWords, wchip,
} from './kits/declaracion-de-testigo.js';

const ID = 'LAW-0170';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const TRACE = [0.45, 0.74];
const ELEMENTS = ['event', 'informant', 'witness', 'clerk', 'cards'];

const STRINGS = {
  en: {...WITNESS_STRINGS.en, slot: 'fact'},
  es: {...WITNESS_STRINGS.es, slot: 'hecho'},
};

const relationship = obj('An explicit relationship between two parts of the plan', {
  from: oneOf('Source part', ELEMENTS),
  to: oneOf('Target part', ELEMENTS),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Caption on the connector (empty = the kind caption)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  actors: list('The witness, the clerk and the person the witness says they heard from, in this order (fictional people)', party, 3, 3),
  roles: obj('Descriptive role captions (never a finding about credibility or reliability)', {
    witness: str('Role caption for the person giving the statement', 40),
    clerk: str('Role caption for the person writing the cards', 40),
    informant: str('Role caption for the person the witness says they heard from', 40),
  }),
  relationships: list('Explicit relationships between the parts; the kind sets the line style (causal only when supplied)', relationship, 1, 6),
  props: obj('Supplied statement content', {
    facts: list('Facts the witness states, in order; each becomes one labelled card in the rail', factField, 1, 3),
    sourceLabels: obj('Label printed on each card for the stated source type', {
      observed: str('Label for a direct observation (keep “as stated”)', 48),
      received: str('Label for information received (keep “as stated”)', 48),
    }),
  }),
  elements: list('Labels of the two non-person parts (the people are labelled by name and role)', obj('Part', {
    id: oneOf('Part id', ['event', 'cards']),
    label: str('Visible label', 50),
  }, ['id', 'label']), 1, 2),
  focusElement: oneOf('Part enlarged while the tracer passes', ELEMENTS),
  relationLabels: obj('Caption used for each relation kind (legend, and connectors without their own caption)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits the parts; each arrival at the fact rail delivers the next fact card', oneOf('Part id', ELEMENTS), 2, 12),
};

const defaultParams = {
  actors: WITNESS_DEFAULTS.actors,
  roles: WITNESS_DEFAULTS.roles,
  relationships: [
    {from: 'event', to: 'witness', kind: 'relation', label: 'seen, as stated'},
    {from: 'informant', to: 'witness', kind: 'communication', label: 'told, as stated'},
    {from: 'witness', to: 'clerk', kind: 'communication', label: 'recounts'},
    {from: 'clerk', to: 'cards', kind: 'sequence', label: 'writes each fact'},
  ],
  props: {
    facts: [
      {text: 'A blue van parked by the north gate', source: 'observed', via: ''},
      {text: 'The van left before midnight', source: 'received', via: 'a neighbour'},
    ],
    sourceLabels: WITNESS_DEFAULTS.props.sourceLabels,
  },
  elements: [{id: 'event', label: 'What happened (as described)'}, {id: 'cards', label: 'Fact rail'}],
  focusElement: 'witness',
  relationLabels: {relation: 'plain relation', communication: 'communication', sequence: 'sequence of steps', causal: 'causal (as supplied)'},
  traversalOrder: ['event', 'witness', 'clerk', 'cards', 'informant', 'witness', 'clerk', 'cards'],
};

function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** Positions (fractions of the plan area) per shape. */
const PLAN = {
  landscape: {event: [0.1, 0.2, 0.105], informant: [0.1, 0.74, 0.095], witness: [0.36, 0.44, 0.14], clerk: [0.585, 0.44, 0.105], cards: {x: 0.7, y: 0.02, x1: 1, y1: 1}, cardsCol: true},
  square: {event: [0.13, 0.17, 0.095], informant: [0.13, 0.71, 0.09], witness: [0.4, 0.3, 0.12], clerk: [0.4, 0.8, 0.095], cards: {x: 0.6, y: 0.02, x1: 1, y1: 1}, cardsCol: true},
  portrait: {event: [0.22, 0.1, 0.1], informant: [0.78, 0.1, 0.095], witness: [0.5, 0.34, 0.13], clerk: [0.5, 0.56, 0.1], cards: {x: 0, y: 0.7, x1: 1, y1: 1}, cardsCol: false},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 960], portrait: [1000, 1455]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const shape = ctx.view.shape;
    const px = pxPerUnit(ctx);
    const F0 = 22.5 / px, Fmin = 16.3 / px;
    const m = 16;
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const facts = p.props.facts;
    const n = facts.length;
    const label = id => ((p.elements.find(e => e.id === id) || {}).label || '');

    // legend (bottom band): relation kinds with line samples, source glyphs, note
    const legend = legendLayout(ctx, p, {w: D.w - 2 * m, size: F0});
    const legendH = showKey ? legend.h : 0;
    const A = {x: m, y: m, w: D.w - 2 * m, h: D.h - 2 * m - legendH - (showKey ? 18 : 0)};

    const arrange = col => {
      // fact rail: one slot per fact — a column at the right (wide / square frames)
      // or a row along the bottom of the plan (tall frames); sized to its cards
      const pad = 14, gap = 12;
      const headH = showKey ? F0 * 1.9 : 0;
      const railW = col ? Math.min(Math.max(A.w * (shape === 'square' ? 0.4 : 0.27), 360), 560) : A.w;
      const cardW = col ? railW - 2 * pad : (railW - 2 * pad - gap * (n - 1)) / n;
      const maxH = col ? (A.h - headH - 2 * pad - gap * (n - 1)) / n : A.h * 0.36;
      const items = facts.map(f => ({text: f.text, tag: tagOf(p, f.source), fromText: fromOf(ctx, f)}));
      const cf = fitCards(ctx, {w: cardW, items, size: F0, minSize: Fmin, maxH});
      const F = Math.min(F0, cf.size);
      const railH = headH + 2 * pad + (col ? n * cf.H + (n - 1) * gap : cf.H);
      const railBox = col
        ? {x: A.x + A.w - railW, y: A.y + Math.max(0, (A.h - railH) / 2), w: railW, h: railH}
        : {x: A.x, y: A.y + A.h - railH, w: railW, h: railH};
      const inner = {x: railBox.x + pad, y: railBox.y + headH + pad};
      const slots = facts.map((f, i) => (col
        ? {x: inner.x, y: inner.y + i * (cf.H + gap), w: cardW, h: cf.H}
        : {x: inner.x + i * (cardW + gap), y: inner.y, w: cardW, h: cf.H}));
      const cards = facts.map((f, i) => factCard(ctx, {name: `card${i}`, content: cf.contents[i], H: cf.H, source: f.source, showText: showAll, still: true}));
      const railHead = showKey && label('cards') ? wchip(ctx, label('cards'), {x: railBox.x + railBox.w / 2, y: railBox.y + 6, anchor: 'middle', maxWidth: railBox.w - 20, size: F, minSize: F, maxLines: 1, name: 'rail-head', fill: '#f7f1e3'}) : null;

      // the plan area left of (or above) the rail; parts placed in it, each with
      // its name chip underneath inside the area
      const P = col ? {x: A.x, y: A.y, w: A.w - railW - 50, h: A.h} : {x: A.x, y: A.y, w: A.w, h: A.h - railH - 40};
      const chipH = showKey ? F * 1.18 * 2 + F * 0.76 + 14 : 0;
      const FR = shape === 'landscape'
        ? {event: [0.11, 0.22], informant: [0.11, 0.72], witness: [0.42, 0.4], clerk: [0.8, 0.4], r: [0.1, 0.19]}
        : shape === 'square' && col
          ? {event: [0.13, 0.12], informant: [0.13, 0.72], witness: [0.46, 0.36], clerk: [0.8, 0.7], r: [0.12, 0.12]}
          : shape === 'square'
          ? {event: [0.09, 0.14], informant: [0.09, 0.78], witness: [0.45, 0.46], clerk: [0.86, 0.3], r: [0.09, 0.16]}
          : {event: [0.22, 0.1], informant: [0.78, 0.18], witness: [0.5, 0.44], clerk: [0.5, 0.8], r: [0.13, 0.1]};
      const Rb0 = Math.min(P.w * FR.r[0], P.h * FR.r[1]);
      const railHeadBox = railHead ? railHead.box : null;
      const legendBox = showKey ? {x: D.w / 2 - legend.w / 2, y: D.h - 16 - legend.h, w: legend.w, h: legend.h} : null;
      const bounds = {x: m, y: m, w: D.w - 2 * m, h: A.h};
      const circleBox = e => ({x: e.x - e.R, y: e.y - e.R, w: 2 * e.R, h: 2 * e.R});
      // plan at badge scale k: parts, name chips, connectors and their captions;
      // the largest k whose chips and captions clear every part, chip and link wins
      const plan = k => {
        const E = {};
        for (const id of ['event', 'informant', 'witness', 'clerk']) {
          const R = Rb0 * k * (id === 'witness' ? 1.25 : id === 'informant' ? 0.92 : 1);
          const x = P.x + P.w * FR[id][0];
          const y = Math.min(P.y + P.h * FR[id][1], P.y + P.h - chipH - R - 6);
          E[id] = {x: Math.max(P.x + R, Math.min(P.x + P.w - R, x)), y: Math.max(P.y + R + 4, y), R};
        }
        const elements = {
          event: {circle: {x: E.event.x, y: E.event.y, r: E.event.R}},
          informant: {circle: {x: E.informant.x, y: E.informant.y, r: E.informant.R}},
          witness: {circle: {x: E.witness.x, y: E.witness.y, r: E.witness.R}},
          clerk: {circle: {x: E.clerk.x, y: E.clerk.y, r: E.clerk.R}},
          cards: {box: railBox},
        };
        // connectors only (captions are placed below, never shrunk)
        const rg = relationGraph({...ctx, show: () => false}, {
          name: 'rg', elements, relationships: p.relationships, relationLabels: p.relationLabels,
          bend: rel => (rel.to === 'cards' || rel.from === 'cards' ? 0.05 : 0.14),
        });
        const linkBoxes = rg.conns.map(c => Array.from({length: 17}, (_, j) => c.c.at(j / 16)).map(q => ({x: q.x - 3, y: q.y - 3, w: 6, h: 6})));
        const allLinks = linkBoxes.flat();
        // every connector must read as a line of its own (long enough for its caption to sit beside it)
        const linkLen = c => Array.from({length: 16}, (_, j) => Math.hypot(c.c.at((j + 1) / 16).x - c.c.at(j / 16).x, c.c.at((j + 1) / 16).y - c.c.at(j / 16).y)).reduce((a, b) => a + b, 0);
        const minLink = Math.max(90, F * 5);
        const shortLinks = rg.conns.filter(c => linkLen(c) < minLink).length;
        // name chips: under the badge, else beside or above it, whichever clears the links and parts
        const chips = {};
        const placedChips = [];
        const chipOf = (id, text) => {
          if (!showKey || !text) return null;
          const e = E[id];
          // widest box needed so the caption is never cut (up to half the plan width)
          let maxW = Math.max(e.R * 2.6, Math.min(P.w * (shape === 'portrait' ? 0.46 : 0.3), 440));
          while (maxW < P.w * 0.55 && wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: F, minSize: F, maxLines: 4}).fit.truncated) maxW *= 1.15;
          const make = (x, y, anchor) => wchip(ctx, text, {x, y, anchor, maxWidth: maxW, size: F, minSize: F, maxLines: 4, name: `${id}-chip`});
          const probe = make(0, 0, 'middle');
          const clampX = c => (c.box.x < m ? m - c.box.x : c.box.x + c.box.w > D.w - m ? D.w - m - (c.box.x + c.box.w) : 0);
          const cands = [];
          const below = make(e.x, e.y + e.R + 10, 'middle');
          const dx = clampX(below);
          cands.push(dx ? make(e.x + dx, e.y + e.R + 10, 'middle') : below);
          cands.push(make(e.x + e.R + 12, e.y + e.R * 0.35, 'start'));
          cands.push(make(e.x - e.R - 12, e.y + e.R * 0.35, 'end'));
          cands.push(make(e.x, e.y - e.R - 10 - probe.box.h, 'middle'));
          cands.push(make(e.x + e.R * 0.7, e.y + e.R + 10, 'start'));
          cands.push(make(e.x - e.R * 0.7, e.y + e.R + 10, 'end'));
          cands.push(make(e.x + e.R + 12, e.y - e.R - 4, 'start'));
          cands.push(make(e.x - e.R - 12, e.y - e.R - 4, 'end'));
          cands.push(make(e.x + e.R + 12, e.y - probe.box.h / 2, 'start'));
          cands.push(make(e.x - e.R - 12, e.y - probe.box.h / 2, 'end'));
          for (const k2 of [1, 2]) {
            const b2 = make(e.x, e.y + e.R + 10 + k2 * (probe.box.h + 10), 'middle');
            const d2 = clampX(b2);
            cands.push(d2 ? make(e.x + d2, e.y + e.R + 10 + k2 * (probe.box.h + 10), 'middle') : b2);
          }
          const others = [...Object.entries(E).filter(([k2]) => k2 !== id).map(([, q]) => circleBox(q)), railBox, ...placedChips];
          let best = null, bestA = Infinity;
          for (const c of cands) {
            const b = c.box;
            const inside = b.x >= m - 1 && b.x + b.w <= D.w - m + 1 && b.y >= m && b.y + b.h <= bounds.y + bounds.h;
            const hits = others.filter(q => overlaps(b, q, 4)).length * 3 + allLinks.filter(q => overlaps(b, q, 2)).length + (inside ? 0 : 100) + (c.fit.truncated ? 1000 : 0);
            if (hits < bestA) { best = c; bestA = hits; }
            if (!hits) break;
          }
          placedChips.push(best.box);
          return best;
        };
        chips.witness = chipOf('witness', captionOf(p, 'witness'));
        chips.clerk = chipOf('clerk', captionOf(p, 'clerk'));
        chips.event = chipOf('event', label('event'));
        chips.informant = chipOf('informant', captionOf(p, 'informant'));
        const partBoxes = [...Object.values(E).map(circleBox), railBox];
        const chipBoxes = Object.values(chips).filter(Boolean).map(c => c.box);
        const cut = Object.values(chips).filter(c => c && c.fit.truncated).length;
        let clash = cut * 10 + shortLinks * 4;
        const clashBox = (b, list, pad = 4) => list.filter(q => overlaps(b, q, pad)).length;
        chipBoxes.forEach((b, i) => { clash += clashBox(b, chipBoxes.slice(i + 1)); clash += clashBox(b, partBoxes, 2); clash += allLinks.some(q => overlaps(b, q, 0)) ? 1 : 0; if (b.y + b.h > bounds.y + bounds.h + 1) clash++; });
        // points along every connector (a caption must not sit on another link)
        const labels = [];
        rg.conns.forEach((c, i) => {
          if (!showAll) return;
          const text = c.rel.label || p.relationLabels[c.rel.kind] || c.rel.kind;
          const color = kindColor(ctx, c.rel.kind);
          const make = (x, y) => wchip(ctx, text, {x, y, anchor: 'middle', maxWidth: Math.min(shape === 'portrait' ? A.w * 0.46 : P.w * 0.3, 360), size: F, minSize: F, maxLines: 4, fill: ctx.theme.card, stroke: color, name: `rl${i}`, weight: 600});
          const probe = make(0, 0);
          const cands = [];
          for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88]) {
            const q = c.c.at(t);
            const a = Math.atan2(Math.sin(q.a), Math.cos(q.a));
            const nx = -Math.sin(a), ny = Math.cos(a);
            // beside the link, never on it (a caption must not hide its own connector)
            for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7]) {
              const off = d * (probe.box.h * 0.5 + 18) + Math.sign(d) * (Math.abs(d) > 1 ? probe.box.w * 0.25 * Math.abs(nx) : 0);
              const x = q.x + nx * off, y = q.y + ny * off;
              cands.push({x, y, t, q, box: {x: x - probe.box.w / 2, y: y - probe.box.h / 2, w: probe.box.w, h: probe.box.h}});
            }
          }
          const others = linkBoxes.filter((_, j) => j !== i).flat();
          const ownPts = Array.from({length: 33}, (_, j) => c.c.at(j / 32));
          const ownHit = b => ownPts.some(q => q.x > b.x - 3 && q.x < b.x + b.w + 3 && q.y > b.y - 3 && q.y < b.y + b.h + 3);
          // boxes a caption or its leader must keep clear of: parts, name chips, earlier captions
          const solid = [...partBoxes, ...chipBoxes, ...labels.map(l => l.box), ...(railHeadBox ? [railHeadBox] : [])];
          const earlierLeads = labels.filter(l => l.lead).flatMap(l => Array.from({length: 13}, (_, j) => ({x: lerp(l.lead.x1, l.lead.x2, j / 12), y: lerp(l.lead.y1, l.lead.y2, j / 12)})));
          const occupied = [...solid, ...others];
          const leadOf = cd => {
            const b = cd.box;
            const ex = clamp(cd.q.x, b.x, b.x + b.w), ey = clamp(cd.q.y, b.y, b.y + b.h);
            return {x1: cd.q.x, y1: cd.q.y, x2: ex, y2: ey};
          };
          let best = null, bestA = Infinity;
          for (const cd of cands) {
            const inside = cd.box.x >= bounds.x && cd.box.y >= bounds.y && cd.box.x + cd.box.w <= bounds.x + bounds.w && cd.box.y + cd.box.h <= bounds.y + bounds.h;
            const ld = leadOf(cd);
            const lpts = Array.from({length: 17}, (_, j) => ({x: lerp(ld.x1, ld.x2, (j + 0.5) / 17), y: lerp(ld.y1, ld.y2, (j + 0.5) / 17)}));
            // the leader crosses no part, chip or other caption, and no earlier leader passes under the caption
            const leadHits = solid.filter(o => lpts.some(q => q.x > o.x - 2 && q.x < o.x + o.w + 2 && q.y > o.y - 2 && q.y < o.y + o.h + 2)).length;
            const underHits = earlierLeads.some(q => q.x > cd.box.x - 3 && q.x < cd.box.x + cd.box.w + 3 && q.y > cd.box.y - 3 && q.y < cd.box.y + cd.box.h + 3) ? 1 : 0;
            const hits = occupied.filter(o => overlaps(cd.box, o, 4)).length + (inside ? 0 : 50) + (ownHit(cd.box) ? 20 : 0) + leadHits * 3 + underHits * 3;
            if (hits < bestA) { best = cd; bestA = hits; }
            if (!hits) break;
          }
          if (bestA > 0) {
            // nothing clear right beside the link: the nearest clear spot in the plan, joined by a leader
            // that crosses nothing (from the link's middle part)
            const pw = probe.box.w, ph = probe.box.h;
            let bestD = Infinity;
            for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) {
              const q = c.c.at(t);
              for (let y = bounds.y + ph / 2; y <= bounds.y + bounds.h - ph / 2; y += 10) {
                for (let x = bounds.x + pw / 2; x <= bounds.x + bounds.w - pw / 2; x += 10) {
                  const d = Math.hypot(x - q.x, y - q.y);
                  if (d >= bestD || d > 320) continue;
                  const cd = {x, y, t, q, box: {x: x - pw / 2, y: y - ph / 2, w: pw, h: ph}};
                  if (occupied.some(o => overlaps(cd.box, o, 4)) || ownHit(cd.box)) continue;
                  const ld = leadOf(cd);
                  const lpts = Array.from({length: 17}, (_, j) => ({x: lerp(ld.x1, ld.x2, (j + 0.5) / 17), y: lerp(ld.y1, ld.y2, (j + 0.5) / 17)}));
                  if (solid.some(o => lpts.some(qq => qq.x > o.x - 2 && qq.x < o.x + o.w + 2 && qq.y > o.y - 2 && qq.y < o.y + o.h + 2))) continue;
                  if (earlierLeads.some(qq => qq.x > cd.box.x - 3 && qq.x < cd.box.x + cd.box.w + 3 && qq.y > cd.box.y - 3 && qq.y < cd.box.y + cd.box.h + 3)) continue;
                  bestD = d; best = cd; bestA = 0;
                }
              }
            }
          }
          clash += bestA;
          const lab = make(best.x, best.y - probe.box.h / 2);
          const ld = leadOf({...best, box: lab.box});
          labels.push({box: lab.box, node: lab.node, lead: {...ld, color}, i});
        });
        const linkCover = rg.conns.map((c, i) => {
          const pts = Array.from({length: 33}, (_, j) => c.c.at(j / 32));
          const lb = labels.filter(l => l.i === i).map(l => l.box).concat(labels.filter(l => l.i !== i).map(l => l.box), chipBoxes);
          return pts.filter(q => lb.some(b => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h)).length / pts.length;
        });
        return {E, chips, rg, labels, clash, k, linkCover, linkLens: rg.conns.map(linkLen), minLink};
      };
      let pl = null;
      for (const k of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.45]) {
        const cand = plan(k);
        if (!pl || cand.clash < pl.clash) pl = cand;
        if (!cand.clash) break;
      }

      return {col, railBox, slots, cards, railHead, cf, F, pl, P};
    };
    const tries = (shape === 'square' ? [false, true] : [shape === 'landscape']).map(arrange);
    const pick = tries.reduce((a, b) => (b.pl.clash < a.pl.clash ? b : a));
    const {railBox, slots, cards, railHead, cf, F, pl} = pick;
    if (F < F0) Object.assign(legend, legendLayout(ctx, p, {w: D.w - 2 * m, size: F}));
    const {E, chips, rg, labels} = pl;
    const route = rg.route(p.traversalOrder);
    // deliveries: each arrival at the rail turns the carried token into the next card
    const deliveries = [];
    let lastSource = null;
    route.visits.forEach(v => {
      if (v.id === 'event' || v.id === 'informant') lastSource = v;
      if (v.id === 'cards' && deliveries.length < n) deliveries.push({t: v.t, from: lastSource ? lastSource.t : null});
    });

    // badges
    const looks = [0, 1, 2].map(i => actorLook(ctx, p.actors[i], i));
    const badge = (id, look) => personBadge(ctx, {name: `${id}-b`, x: 0, y: 0, radius: E[id].R, look});
    const nodes = {
      event: g({name: 'event-b'}, eventIcon(ctx, {R: E.event.R})),
      informant: badge('informant', looks[2]).node,
      witness: badge('witness', looks[0]).node,
      clerk: badge('clerk', looks[1]).node,
    };
    // the witness's speech glyph, the clerk's pen glyph (small neutral props on the badges)
    const deco = {
      witness: g(null, h('path', {d: roundRectPath(E.witness.R * 0.5, -E.witness.R * 1.02, E.witness.R * 0.62, E.witness.R * 0.42, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
        [0, 1, 2].map(i => h('circle', {cx: r(E.witness.R * (0.66 + i * 0.15)), cy: r(-E.witness.R * 0.81), r: r(E.witness.R * 0.04), fill: th.inkSoft}))),
      clerk: g(null, h('rect', {x: r(E.clerk.R * 0.55), y: r(-E.clerk.R * 0.9), width: r(E.clerk.R * 0.5), height: r(E.clerk.R * 0.62), rx: 6, fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}),
        [0, 1, 2].map(i => h('rect', {x: r(E.clerk.R * 0.62), y: r(-E.clerk.R * (0.78 - i * 0.16)), width: r(E.clerk.R * 0.34), height: r(E.clerk.R * 0.05), rx: 2, fill: th.paperLine}))),
    };

    // token carried by the tracer (glyph + source stripe; no text)
    const tokens = facts.map((f, i) => g({name: `token${i}`, opacity: 0},
      h('path', {d: roundRectPath(-30, -22, 60, 44, 8), fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}),
      h('rect', {x: -24, y: 13, width: 48, height: 5, rx: 2.5, fill: sourceColor(ctx, f.source)}),
      sourceGlyph(ctx, f.source, {x: 0, y: -2, size: 13})));

    const clash = pl.clash;
    return {E, chips, rg, labels, route, deliveries, nodes, deco, cards, slots, railBox, railHead, legend, legendH, A, tokens, F, n, cf, pxs: px, shape, clash, planScale: pl.k, linkCover: pl.linkCover, linkLens: pl.linkLens, minLink: pl.minLink};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const parts = [];
    // fact rail
    const rb = L.railBox;
    parts.push(g({name: 'rail', opacity: 0},
      h('path', {d: roundRectPath(rb.x + 5, rb.y + 7, rb.w, rb.h, 16), fill: th.shadow}),
      h('path', {d: roundRectPath(rb.x, rb.y, rb.w, rb.h, 16), fill: '#e8dcc6', stroke: th.ink, 'stroke-width': 2.6}),
      L.slots.map(s => h('path', {d: roundRectPath(s.x, s.y, s.w, s.h, 9), fill: 'none', stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 7'})),
      L.railHead && L.railHead.node));
    parts.push(L.rg.node);
    for (const id of ['event', 'informant', 'witness', 'clerk']) {
      const e = L.E[id];
      parts.push(g({name: `${id}-grp`, transform: T(e.x, e.y)}, g({name: `${id}-s`}, L.nodes[id], L.deco[id] || null)));
    }
    L.cards.forEach((c, i) => parts.push(g({name: `slot${i}`, transform: T(L.slots[i].x, L.slots[i].y)}, c.node)));
    for (const c of Object.values(L.chips)) if (c) parts.push(g({name: `${c.node.attrs.name}-w`, opacity: 0}, c.node));
    L.labels.forEach(l => parts.push(g({name: `rlg${l.i}`, opacity: 0},
      l.lead ? h('line', {x1: r(l.lead.x1), y1: r(l.lead.y1), x2: r(l.lead.x2), y2: r(l.lead.y2), stroke: l.lead.color, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
      h('circle', {cx: r(l.lead ? l.lead.x1 : l.box.cx), cy: r(l.lead ? l.lead.y1 : l.box.cy), r: l.lead ? 4 : 0, fill: l.lead ? l.lead.color : 'none'}),
      l.node)));
    L.tokens.forEach(t => parts.push(t));
    parts.push(tracer(ctx, 'tracer', th.accent4));
    if (L.legendH) parts.push(g({name: 'legend', opacity: 0}, L.legend.build(ctx.design.w / 2 - L.legend.w / 2, ctx.design.h - 16 - L.legend.h)));
    return g(null, parts);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const spread = ease.inOutCubic(seg(u, 0.02, 0.15));
    const W = L.E.witness;
    // separate: parts spread out from a cluster around the witness
    const visitsU = L.route.visits.map(v => ({id: v.id, u: lerp(TRACE[0], TRACE[1], v.t)}));
    let focusScale = 1;
    for (const id of ['event', 'informant', 'witness', 'clerk']) {
      const e = L.E[id];
      const x = lerp(W.x + (e.x - W.x) * 0.25, e.x, spread), y = lerp(W.y + (e.y - W.y) * 0.25, e.y, spread);
      let k = lerp(0.72, 1, spread);
      if (id === p.focusElement) {
        const bump = Math.max(0, ...visitsU.filter(v => v.id === id).map(v => 1 - Math.min(1, Math.abs(u - v.u) / 0.045)));
        const f = 1 + 0.18 * ease.inOutSine(bump);
        k *= f;
        focusScale = f;
      }
      nodes[`${id}-grp`] = {transform: T(x, y, 0, k)};
      nodes[`${id}-s`] = {opacity: 1};
    }
    const labelsIn = seg(u, 0.13, 0.18);
    for (const c of Object.values(L.chips)) if (c) nodes[`${c.node.attrs.name}-w`] = {opacity: r(labelsIn, 3)};
    nodes.rail = {opacity: r(seg(u, 0.05, 0.14), 3)};
    if (L.legendH) nodes.legend = {opacity: r(seg(u, 0.13, 0.2), 3)};
    // relations drawn one by one
    const nr = p.relationships.length;
    const span = (BEATS.relate[1] - BEATS.relate[0]) / nr;
    const drawn = p.relationships.map((_, i) => seg(u, BEATS.relate[0] + i * span, BEATS.relate[0] + (i + 1) * span - 0.004));
    Object.assign(nodes, L.rg.frame(i => drawn[i]));
    L.labels.forEach(l => { nodes[`rlg${l.i}`] = {opacity: r(clamp((drawn[l.i] - 0.55) / 0.45), 3)}; });
    // tracer along the supplied traversal order
    const tt = seg(u, ...TRACE);
    const tracerOn = u >= TRACE[0] && u <= TRACE[1] + 0.02;
    const tp = L.route.poly.at(tt);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tracerOn ? r(Math.min(seg(u, TRACE[0], TRACE[0] + 0.01), 1 - seg(u, TRACE[1], TRACE[1] + 0.02)), 3) : 0};
    // tokens ride the tracer from their channel to the rail; cards appear on delivery
    let token = null;
    const shown = L.cards.map(() => 0);
    L.deliveries.forEach((d, i) => {
      const from = d.from ?? 0;
      const on = tt > from && tt < d.t;
      nodes[`token${i}`] = {transform: T(tp.x, tp.y - 30), opacity: on ? 1 : 0};
      if (on) token = {i, x: r(tp.x), y: r(tp.y - 30), source: p.props.facts[i].source};
      const uD = lerp(TRACE[0], TRACE[1], d.t);
      shown[i] = seg(u, uD, uD + 0.03);
    });
    for (let i = L.deliveries.length; i < L.cards.length; i++) nodes[`token${i}`] = {opacity: 0};
    L.cards.forEach((c, i) => {
      const s = L.slots[i];
      const k = shown[i];
      nodes[`slot${i}`] = {transform: `${T(s.x, s.y)} ${scaleAbout(s.w / 2, s.h / 2, lerp(0.85, 1, ease.outCubic(k)))}`};
      nodes[`card${i}`] = {opacity: r(k, 3)};
    });
    const visitOrder = visitsU.filter(v => v.u <= u + 1e-9).map(v => v.id);
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    // every connector starts and ends at (the padded edge of) its own part
    const edgeGap = (id, q) => {
      const e = L.rg.conns && null;
      const el = id === 'cards' ? null : L.E[id];
      if (!el) {
        const b = L.railBox;
        const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
        return Math.hypot(dx, dy);
      }
      return Math.abs(Math.hypot(q.x - el.x, q.y - el.y) - el.R);
    };
    const gaps = L.rg.conns.map(c => Math.max(edgeGap(c.rel.from, c.c.from), edgeGap(c.rel.to, c.c.to)));
    return {
      nodes,
      semantic: {
        beat,
        spread: r(spread, 3),
        relationsDrawn: drawn.map(d => r(d, 3)),
        tracerVisible: nodes.tracer.opacity > 0,
        tracer: {x: r(tp.x), y: r(tp.y)},
        visitOrder,
        visitPlan: L.route.visits.map(v => v.id),
        token,
        cardsShown: shown.map(v => r(v, 3)),
        deliveries: L.deliveries.length,
        focus: p.focusElement,
        focusScale: r(focusScale, 3),
        focusVisitsU: visitsU.filter(v => v.id === p.focusElement).map(v => r(v.u, 3)),
        arrows: L.rg.conns.map(c => ({kind: c.rel.kind, arrow: LINK_STYLES[c.rel.kind].arrow})),
        causalCount: p.relationships.filter(q => q.kind === 'causal').length,
        connectorGaps: gaps.map(v => r(v, 1)),
        labelClashes: L.clash,
        // share of each connector hidden under captions / chips, its length, and the minimum length
        linkCover: L.linkCover.map(v => r(v, 3)),
        linkLens: L.linkLens.map(v => r(v)),
        minLink: r(L.minLink),
        legendKinds: ['relation', 'communication', 'sequence', 'causal'].filter(k => ctx.params.relationships.some(q => q.kind === k)),
        sources: p.props.facts.map(f => f.source),
        textPx: r(L.F * L.pxs, 1),
      },
    };
  },
};

/**
 * Legend: one sample line per relation kind with its caption, the two source
 * glyphs with their supplied labels, and the note "as supplied · no
 * conclusion drawn". Laid out as a wrapped flow of items.
 */
function legendLayout(ctx, p, o) {
  const th = ctx.theme;
  const s = o.size;
  const items = [];
  const SAMPLE = s * 2.6;
  // only the connection kinds the supplied relationships actually use (no causal sample unless supplied)
  for (const kind of ['relation', 'communication', 'sequence', 'causal'].filter(k => p.relationships.some(q => q.kind === k))) {
    const f = fitWords(p.relationLabels[kind], {maxWidth: Math.min(o.w * 0.4, s * 16), size: s, minSize: s, maxLines: 2, weight: 600});
    items.push({kind, f, w: SAMPLE + s * 0.5 + f.width, h: f.height});
  }
  for (const src of ['observed', 'received']) {
    const f = fitWords(tagOf(p, src), {maxWidth: Math.min(o.w * 0.6, s * 22), size: s, minSize: s, maxLines: 2, weight: 700});
    items.push({src, f, w: s * 1.2 + s * 0.45 + f.width, h: f.height});
  }
  const nf = fitWords(ctx.t.keyNote, {maxWidth: o.w - s, size: s, minSize: s, maxLines: 2, weight: 600});
  items.push({note: true, f: nf, w: nf.width + s * 0.8, h: nf.height + s * 0.4});
  // flow
  const gapX = s * 1.4, gapY = s * 0.5;
  const rows = [];
  let row = {items: [], w: 0, h: 0};
  for (const it of items) {
    if (row.items.length && row.w + gapX + it.w > o.w) { rows.push(row); row = {items: [], w: 0, h: 0}; }
    row.w += (row.items.length ? gapX : 0) + it.w;
    row.h = Math.max(row.h, it.h);
    row.items.push(it);
  }
  rows.push(row);
  const hgt = rows.reduce((a, q) => a + q.h, 0) + gapY * (rows.length - 1);
  const w = Math.max(...rows.map(q => q.w));
  return {
    h: hgt, w,
    build(x0, y0) {
      const parts = [];
      let y = y0;
      for (const q of rows) {
        let x = x0 + (w - q.w) / 2;
        for (const it of q.items) {
          const cy = y + q.h / 2;
          if (it.kind) {
            const st = LINK_STYLES[it.kind];
            const col = kindColor(ctx, it.kind);
            parts.push(h('line', {x1: r(x), x2: r(x + SAMPLE - (st.arrow ? 10 : 0)), y1: r(cy), y2: r(cy), stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}));
            if (st.arrow) parts.push(h('path', {d: `M${r(x + SAMPLE)} ${r(cy)}l-14 -8l4 8l-4 8z`, fill: col}));
            if (st.endDots) parts.push(h('circle', {cx: r(x), cy: r(cy), r: 4.5, fill: col}), h('circle', {cx: r(x + SAMPLE), cy: r(cy), r: 4.5, fill: col}));
            parts.push(textAt(it.f, x + SAMPLE + s * 0.5, cy - it.f.height / 2, th.fg));
          } else if (it.src) {
            parts.push(sourceGlyph(ctx, it.src, {x: x + s * 0.6, y: cy, size: s * 0.6}));
            parts.push(textAt(it.f, x + s * 1.65, cy - it.f.height / 2, sourceInk(ctx, it.src)));
          } else {
            parts.push(h('rect', {x: r(x), y: r(cy - it.h / 2), width: r(it.w), height: r(it.h), rx: r(s * 0.35), fill: '#f7f1e3', stroke: th.ink, 'stroke-width': 2}));
            parts.push(textAt(it.f, x + s * 0.4, cy - it.f.height / 2, th.ink));
          }
          x += it.w + gapX;
        }
        y += q.h + gapY;
      }
      return g(null, parts);
    },
  };
}

function textAt(f, x, y, fill) {
  return h('text', {x: r(x), y: r(y + f.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(f.size, 2), 'font-weight': f.weight, fill},
    f.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, line)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-03-mechanism',
    title: 'Witness statement — two stated channels into the statement, traced to labelled cards',
    titleEs: 'Declaración de testigo — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Declaración de testigo',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A plan of how a witness statement is put together: what happened and the person the witness says they heard from connect to the witness by the supplied links (a plain relation "seen, as stated", a communication "told, as stated"); the witness recounts to the clerk, who writes each fact into a rail. A tracer follows the supplied order and carries a source-marked token that becomes each labelled card. Only supplied links are drawn; nothing is causal unless supplied; no credibility or weight is shown.',
    tags: ['witness', 'statement', 'mechanism', 'source channels', 'direct observation', 'information received', 'as stated', 'tracer', 'fact cards'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/declaracion-de-testigo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
