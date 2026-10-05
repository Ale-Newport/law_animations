/**
 * LAW-0078 — Trazabilidad de una cita · mechanism
 *
 * Storyboard (exploded citation staircase — not a row of boxes):
 *  0.00–0.18  separate: the three works start side by side in a compact
 *             cluster and fan out down a diagonal staircase — citing article (note)
 *             top-left, open intermediate reference in the middle, original
 *             folio bottom-right — while the catalogue screen, a library shelf
 *             (with the empty slot the book came from) and the trail card take
 *             their places around them.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one after the
 *             other, each styled by kind. A citation link of kind "sequence" is
 *             a brass chain hooked from the exact footnote eyelet of one work to
 *             the passage eyelet of the next; plain relations ("locates",
 *             "holds", "records") are thin lines with end dots and no arrow.
 *             Nothing is drawn as causal unless the author supplies it.
 *  0.43–0.75  trace: a brass ring follows `traversalOrder` along the drawn
 *             links (reading across a work from its cited passage to its own
 *             footnote); each element swells while it is visited (the focus
 *             element more), eyelets pulse and the card records each stop.
 *  0.75–1.00  gather: everything stays anchored; each work shows its state
 *             (note → page, page → folio, folio · entry). Descriptive only.
 * Layout: hand-placed per shape (diagonal in 16:9 and 1:1, zig-zag column in
 * 9:16, where each chain hooks the next eyelet from outside the cited page).
 * Plain relations end on the elements' current edges (re-anchored every frame
 * while an element swells) and keep clear of the other elements and the legend;
 * each caption sits on its own link, or beside it (with a short leader) when the
 * link is too short to carry it; name chips touch their element (or, when no edge
 * is free, keep a short leader to it); the note's chip sits beside the page at its
 * footnote, with a leader to the footnote.
 * @module animations/research/LAW-0078
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, roundRectPath} from '../../core/geometry.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, connector, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  trailFields, TRAIL_DEFAULTS, KIT_STRINGS, noteText, innerText, entrySlot, entryLabelsFor, cardRows,
  articlePage, treatiseBook, sourceFolio, archiveBox, catalogueScreen, bookcase, trailCard,
  chainRope, chainRoute, pulse, labelPlacer, BRASS,
} from './kits/trazabilidad-de-una-cita.js';

const ID = 'LAW-0078';
const DURATION = 7000;
const IDS = ['note', 'intermediate', 'source', 'search', 'library', 'card'];
const DOCS = ['note', 'intermediate', 'source'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.02, 0.16], extras: [0.08, 0.18], names: [0.12, 0.2], relate: [0.19, 0.42], trace: [0.44, 0.74], states: [0.77, 0.86], legend: [0.2, 0.26], tracerOut: [0.74, 0.78]};
const AMP = {focus: 0.1, other: 0.05};
/** Scale of the works in the starting cluster. */
const CLUSTER_K = 0.62;

const STRINGS = {
  en: {...KIT_STRINGS.en, cites: 'cites', sequence: 'sequence', relation: 'relation', communication: 'communication', causal: 'causal (supplied)'},
  es: {...KIT_STRINGS.es, cites: 'cita', sequence: 'secuencia', relation: 'relación', communication: 'comunicación', causal: 'causal (aportada)'},
};

const sceneSchema = {
  ...trailFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships = {
  ...sceneSchema.relationships,
  description: 'Explicit relationships between components. A "sequence" link between two works is drawn as the citation chain from the citing footnote to the cited passage; "relation" is a plain line without arrow; "causal" only when supplied (array replaces the previous value)',
  items: {...sceneSchema.relationships.items, properties: {...sceneSchema.relationships.items.properties, label: str('Caption for this relationship (defaults to the caption of its kind)', 40)}},
};

const defaultParams = {
  ...TRAIL_DEFAULTS,
  elements: [
    {id: 'note', label: 'Note in the article'},
    {id: 'intermediate', label: 'Intermediate reference'},
    {id: 'source', label: 'Source document'},
    {id: 'search', label: 'Catalogue search'},
    {id: 'library', label: 'Library shelf'},
    {id: 'card', label: 'Citation-trail card'},
  ],
  relationships: [
    {from: 'note', to: 'intermediate', kind: 'sequence', label: 'cites'},
    {from: 'intermediate', to: 'source', kind: 'sequence', label: 'cites'},
    {from: 'search', to: 'library', kind: 'relation', label: 'locates the shelf'},
    {from: 'library', to: 'intermediate', kind: 'relation', label: 'holds'},
    {from: 'card', to: 'note', kind: 'relation', label: 'records'},
  ],
  focusElement: 'intermediate',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['note', 'intermediate', 'source'],
};

/**
 * Hand-placed geometry per shape (design units). Boxes are final element
 * boxes; `pile` is where the works start stacked; `legend` the legend origin.
 */
const PLACES = {
  landscape: {
    size: [2110, 1000],
    note: {x: 60, y: 40, w: 360, h: 470},
    intermediate: {x: 700, y: 450, w: 560, h: 380},
    source: {x: 1690, y: 470, w: 330, h: 440},
    search: {x: 1450, y: 50, w: 600, h: 220},
    library: {x: 720, y: 40, w: 380, h: 220},
    card: {x: 60, y: 690, w: 540, h: 280},
    pile: {x: 1000, y: 560}, legend: {x: 1850, y: 968}, book: {cw: 262, hB: 364},
  },
  square: {
    size: [1380, 1160],
    note: {x: 50, y: 270, w: 300, h: 390},
    // (the gap under the note, between its "records" link and the book, holds the first
    // chain's caption)
    intermediate: {x: 500, y: 500, w: 420, h: 290},
    source: {x: 1080, y: 610, w: 270, h: 360},
    search: {x: 40, y: 36, w: 480, h: 180},
    library: {x: 800, y: 36, w: 400, h: 230},
    card: {x: 50, y: 830, w: 470, h: 250}, cardGrow: 'down',
    pile: {x: 690, y: 620}, legend: {x: 950, y: 1122}, book: {cw: 196, hB: 274},
  },
  portrait: {
    // zig-zag column: each chain leaves its footnote downward and hooks the next eyelet from
    // the left, outside the cited page (never down a page's margin or over its heading)
    size: [1040, 1560],
    note: {x: 40, y: 236, w: 290, h: 370},
    intermediate: {x: 370, y: 700, w: 380, h: 270},
    source: {x: 776, y: 1056, w: 240, h: 300},
    search: {x: 50, y: 36, w: 940, h: 150},
    // the shelf hangs well below the terminal (a readable "locates" link between them)
    library: {x: 660, y: 372, w: 320, h: 196},
    card: {x: 30, y: 1130, w: 520, h: 300}, cardGrow: 'down',
    pile: {x: 560, y: 780}, legend: {x: 770, y: 1532}, book: {cw: 178, hB: 252},
    chainOpts: (a, b) => ({c1: {x: a.x - 20, y: a.y + 110}, c2: {x: b.x - 130, y: b.y + 6}}),
  },
};

/** Route of a citation chain between two ports (per shape; hanging sag by default). */
const chainPath = (Pl, a, b) => chainRoute(a, b, Pl.chainOpts ? Pl.chainOpts(a, b) : {sag: 30});

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const present = new Set(p.elements.map(e => e.id));
    const entry = entrySlot(p.citations.entry);

    // ---- element art in local coordinates (top-left origin), plus ports
    const E = {};
    const mk = (id, box, content, ports = {}) => { E[id] = {id, box, w: box.w, h: box.h, content, ports}; };
    {
      const b = Pl.note;
      const a = articlePage(ctx, {prefix: 'm-art', w: b.w, h: b.h, journal: p.sources.article, date: p.dates.article, noteNumber: p.citations.noteNumber, note: noteText(p), showText: showAll});
      mk('note', b, a.node, {out: a.hook, eye: 'm-art-eye', foot: a.footBox});
    }
    {
      const b = Pl.intermediate;
      const B = Pl.book;
      const bk = treatiseBook(ctx, {prefix: 'm-book', t: 30, hB: B.hB, cw: B.cw, title: p.sources.intermediate, edition: p.dates.intermediate, pageL: p.citations.pinpoint, pageR: '', innerNote: p.citations.innerNote, foot: innerText(p), showText: showAll});
      const hx = b.w / 2, hy = b.h / 2;
      mk('intermediate', b, g({transform: T(hx, hy)}, bk.node), {in: {x: hx + bk.hookIn.x, y: hy + bk.hookIn.y}, out: {x: hx + bk.hookOut.x, y: hy + bk.hookOut.y}, eyeIn: 'm-book-eyeIn', eyeOut: 'm-book-eyeOut', book: bk});
    }
    {
      const b = Pl.source;
      const f = sourceFolio(ctx, {prefix: 'm-fol', w: b.w, h: b.h * 0.86, title: p.sources.source, folio: p.citations.folio, date: p.dates.source, entry, entryLabels: entryLabelsFor(p.citations.entry), showText: showAll});
      const box = archiveBox(ctx, {prefix: 'm-abox', w: b.w * 0.9, h: b.h * 0.2, label: '', showText: false});
      // the original stands just out of its (small) archive box
      mk('source', b, g(null, g({transform: T(b.w / 2, b.h)}, box.back), g({transform: T(0, 0)}, f.node), g({transform: T(b.w / 2, b.h)}, box.front)), {in: f.hookAt(entry), eye: 'm-fol-eye'});
    }
    {
      const b = Pl.search;
      const sc = catalogueScreen(ctx, {prefix: 'm-scr', x: 0, y: 0, w: b.w, h: b.h, title: t.search, query: p.query, result: p.sources.intermediate, mark: p.citations.shelfMark, showText: showAll});
      mk('search', b, sc.node, {scr: sc});
    }
    {
      const b = Pl.library;
      const bc = bookcase(ctx, {prefix: 'm-case', x: 0, y: 0, w: b.w, h: b.h, rows: 2, targetRow: 1, targetX: b.w * 0.72, bookT: 20, bookH: 80, mark: p.citations.shelfMark, showText: showAll, seedKey: 'm-case'});
      mk('library', b, bc.node);
    }
    {
      // the element box is the card's real size (it grows for three-line titles, upward so its
      // bottom stays in place): connectors and the name chip anchor on the card itself
      const b = Pl.card;
      const c = trailCard(ctx, {prefix: 'm-card', w: b.w, h: b.h, title: t.card, mark: p.citations.shelfMark, rows: cardRows(p, t), showText: showAll});
      const cb = {x: b.x, y: Pl.cardGrow === 'down' ? b.y : b.y + b.h - c.h, w: c.w, h: c.h};
      mk('card', cb, g({transform: T(c.w / 2, c.h / 2)}, c.node));
    }

    // ---- relationships: chains for sequence links between works, connectors otherwise
    const maxAmp = AMP.focus;
    const inflate = (b, k) => ({x: b.x - (b.w * k) / 2, y: b.y - (b.h * k) / 2, w: b.w * (1 + k), h: b.h * (1 + k)});
    const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    // plain relations end on each element's own edge (pad 2), facing the other element
    const relEnds = (ba, bb) => ({from: edgeAnchor(ba, center(bb), 2), to: edgeAnchor(bb, center(ba), 2)});
    const worldPort = (id, q, k = 1) => {
      const b = E[id].box;
      return {x: b.x + b.w / 2 + (q.x - b.w / 2) * k, y: b.y + b.h / 2 + (q.y - b.h / 2) * k};
    };
    const relsIn = p.relationships.filter(rel => present.has(rel.from) && present.has(rel.to) && rel.from !== rel.to);
    // legend (bottom): the kinds actually used; plain relations keep clear of it too
    const kinds = [...new Set(relsIn.map(rel => rel.kind))];
    const legend = showAll && kinds.length ? legendNode(ctx, kinds, p.relationLabels, Pl.legend, shape === 'landscape' ? 24 : 26) : null;
    const legendKeep = legend ? {x: legend.box.x - 10, y: legend.box.y - 16, w: legend.box.w + 20, h: legend.box.h + 26} : null;
    const rels = relsIn.map((rel, i) => {
      const A = E[rel.from], Bq = E[rel.to];
      const chainLink = rel.kind === 'sequence' && A.ports.out && Bq.ports.in;
      const out = {rel, i, chainLink};
      if (chainLink) {
        out.chain = chainRope(ctx, {name: `m-ch${i}`, width: 10});
        const a0 = worldPort(rel.from, A.ports.out), b0 = worldPort(rel.to, Bq.ports.in);
        out.route0 = chainPath(Pl, a0, b0);
        out.from = a0;
        out.to = b0;
      } else {
        // ends sit on the element's own edge (at rest; re-anchored every frame while it swells)
        const {from, to} = relEnds(A.box, Bq.box);
        // pick the gentlest bend whose curve does not pass through another element
        const others = Object.values(E).filter(e => e.id !== rel.from && e.id !== rel.to).map(e => inflate(e.box, maxAmp));
        if (legendKeep) others.push(legendKeep);
        const crossings = c => {
          let n = 0;
          for (let q = 0.06; q < 0.95; q += 0.04) {
            const pt = c.at(q);
            if (others.some(b => pt.x > b.x - 6 && pt.x < b.x + b.w + 6 && pt.y > b.y - 6 && pt.y < b.y + b.h + 6)) n++;
          }
          return n;
        };
        // the gentlest bend that crosses nothing (else the one that crosses least)
        let conn = null, best = Infinity;
        for (const bend of [0.12, -0.12, 0.25, -0.25, 0.4, -0.4]) {
          const c = connector(ctx, {name: `m-c${i}`, from, to, kind: rel.kind, bend, color: kindColor(ctx, rel.kind)});
          const n = crossings(c);
          if (n < best) { best = n; conn = c; out.bend = bend; }
          if (n === 0) break;
        }
        out.conn = conn;
        out.from = from;
        out.to = to;
      }
      return out;
    });

    // ---- labels: element names, relation captions, state chips, legend
    const bounds = {x: 0, y: 0, w: S.w, h: S.h};
    const placer = labelPlacer(bounds, {margin: 8});
    // element boxes are solid: no label covers them and no caption leader crosses them
    const elObs = {};
    for (const id of IDS) if (present.has(id)) { elObs[id] = {...inflate(E[id].box, maxAmp), solid: true}; placer.addObstacle(elObs[id]); }
    const baseObs = placer.obstacles.length;
    // link samples: obstacles for every label except the link's own caption (which sits on it)
    const linkObs = rels.map(x => {
      const out = [];
      for (let k = 0; k <= 24; k++) {
        const q = x.chain ? x.route0.at(k / 24) : x.conn.at(k / 24);
        out.push({x: q.x - 12, y: q.y - 12, w: 24, h: 24});
      }
      return out;
    });
    for (const lo of linkObs) for (const b of lo) placer.addObstacle(b);
    const chipSize = shape === 'landscape' ? 26 : 28;
    if (legend) placer.addLabel(legend.box);
    // element name chips (key) + state chips (appear in the gather beat)
    const states = {
      note: `${t.note} ${p.citations.noteNumber} · ${t.cites} ${p.citations.pinpoint}`,
      intermediate: `${p.citations.pinpoint} · ${t.cites} ${p.citations.folio}`,
      source: `${p.citations.folio} · ${t.entry} ${p.citations.entry}`,
    };
    const names = [];
    if (showKey) {
      // the props with the fewest free edges are named first (the note, named at its footnote,
      // right after the terminal)
      for (const id of ['search', 'note', 'library', 'card', 'intermediate', 'source']) {
        if (!present.has(id)) continue;
        const b = inflate(E[id].box, maxAmp);
        const text = label(id);
        const st = DOCS.includes(id) ? states[id] : null;
        const color = id === 'intermediate' ? '#8a5a1f' : id === 'source' ? th.accent4 : id === 'note' ? th.accent2 : th.ink;
        const make = (c, lead = null) => nameChip(ctx, {name: `name-${id}`, text, state: st, x: c.x, y: c.y, anchor: c.anchor, size: shape === 'portrait' ? 25 : chipSize, maxWidth: shape === 'portrait' ? 250 : 380, maxLines: shape === 'portrait' ? 3 : 2, color, lead});
        const hh = make({x: 0, y: 0, anchor: 'middle'}).box.h;
        // candidates touch the element's own free edges (slid along each edge); the least
        // crowded one wins — a name chip never drifts away from its element
        const cands = [
          {x: b.x + b.w / 2, y: b.y + b.h + 6, anchor: 'middle'},
          {x: b.x + b.w / 2, y: b.y - 6 - hh, anchor: 'middle'},
          {x: b.x + 6, y: b.y + b.h + 6, anchor: 'start'},
          {x: b.x + b.w - 6, y: b.y + b.h + 6, anchor: 'end'},
          {x: b.x + 6, y: b.y - 6 - hh, anchor: 'start'},
          {x: b.x + b.w - 6, y: b.y - 6 - hh, anchor: 'end'},
        ];
        for (const f of [0.02, 0.3, 0.55, 1]) {
          const yy = b.y + (b.h - hh) * Math.min(1, f);
          cands.push({x: b.x + b.w + 10, y: yy, anchor: 'start'}, {x: b.x - 10, y: yy, anchor: 'end'});
        }
        const crowded = q => [...placer.obstacles, ...placer.labels].some(o2 => o2.x < q.x + q.w && o2.x + o2.w > q.x && o2.y < q.y + q.h && o2.y + o2.h > q.y);
        let res;
        if (id === 'note' && E.note.ports.foot) {
          // the note is named at its footnote: the chip sits beside the page, level with (or just
          // above) the footnote, and a short leader points at the footnote's top edge (clear of
          // the eyelet where the chain starts); its own page is not an obstacle for that leader
          const fb = E.note.ports.foot;
          const tgt = worldPort('note', {x: fb.x + fb.w - 30, y: fb.y + 2});
          const leadTo = bx => {
            const e = {x: clamp(tgt.x, bx.x, bx.x + bx.w), y: clamp(tgt.y, bx.y, bx.y + bx.h)};
            return Math.hypot(e.x - tgt.x, e.y - tgt.y) > 12 ? {x1: e.x, y1: e.y, x2: tgt.x, y2: tgt.y} : null;
          };
          const makeN = c => {
            const q = make(c);
            const ld = leadTo(q.box);
            return ld ? {...make(c, ld), lead: ld} : q;
          };
          const nc = [];
          for (let k = -2; k <= 14; k++) {
            const yy = tgt.y - hh * 0.6 - k * 24;
            if (yy < b.y - hh * 0.5) break;
            nc.push({x: b.x + b.w + 10, y: yy, anchor: 'start'}, {x: b.x - 10, y: yy, anchor: 'end'});
          }
          elObs.note.solid = false;
          // the first spot beside the page that only grazes a neighbour's margin (no overlap, no
          // crossing) is taken; otherwise the least crowded spot near the footnote
          res = null;
          for (const c of nc) {
            const q = makeN(c);
            if (placer.scoreOf(q) < 400) { res = q; break; }
          }
          if (!res) res = placer.place([...nc, ...cands], makeN, tgt, {register: false, maxDist: 320, step: 24});
          elObs.note.solid = true;
          names.push({id, ...res});
          placer.addLabel(res.box);
          continue;
        }
        res = placer.place(cands, make, null, {register: false});
        if (crowded(res.box)) {
          // no free edge: the chip moves to the nearest free spot and a short leader ties it to
          // its element's edge (it never covers another prop or label)
          const c0 = {x: b.x + b.w / 2, y: b.y + b.h / 2};
          const far = placer.place(cands, make, c0, {register: false, maxDist: Math.max(b.w, b.h) * 0.5 + 220, step: 20});
          if (!crowded(far.box)) {
            const fb = far.box;
            const e = {x: clamp(fb.x + fb.w / 2, b.x, b.x + b.w), y: clamp(fb.y + fb.h / 2, b.y, b.y + b.h)};
            const f = {x: clamp(e.x, fb.x, fb.x + fb.w), y: clamp(e.y, fb.y, fb.y + fb.h)};
            res = Math.hypot(e.x - f.x, e.y - f.y) > 12 ? make({x: fb.x, y: fb.y, anchor: 'start'}, {x1: f.x, y1: f.y, x2: e.x, y2: e.y}) : far;
          }
        }
        placer.addLabel(res.box);
        names.push({id, ...res});
      }
    }
    const relLabels = [];
    if (showAll) {
      placer.obstacles.length = baseObs;
      rels.forEach((x, ri) => {
        // every other link is an obstacle; the caption itself may sit on its own link
        for (const [j, lo] of linkObs.entries()) if (j !== ri) for (const b of lo) placer.addObstacle(b);
        const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
        const at = q => (x.chain ? x.route0.at(q) : x.conn.at(q));
        const mid = at(0.5);
        const stroke = x.chain ? BRASS.dark : kindColor(ctx, x.rel.kind);
        // (a narrower, three-line caption is tried where the two-line one finds no clear spot)
        const variant = (mw, lines, minK = 0.9) => c => chip(ctx, text, {x: c.x, y: c.y, anchor: c.anchor, maxWidth: mw, size: chipSize * 0.9, minSize: lines > 2 ? chipSize * minK : undefined, maxLines: lines, fill: th.card, stroke, color: th.ink, weight: 600});
        const linkLen = x.chain ? x.route0.total : x.conn.total;
        let besideAdded = false;
        // candidates for one caption size: on the link (midpoint first, then along it), then
        // pushed off along its normal
        const candsFor = (probe, forceBeside = false) => {
          const cands = [];
          for (const tq of [0.5, 0.42, 0.58, 0.34, 0.66]) {
            const q = at(tq);
            cands.push({x: q.x, y: q.y - probe.h / 2, anchor: 'middle'});
          }
          for (const tq of [0.5, 0.38, 0.62]) {
            const q = at(tq), q2 = at(Math.min(1, tq + 0.02));
            const dx = q2.x - q.x, dy = q2.y - q.y, ln = Math.hypot(dx, dy) || 1;
            const nx = -dy / ln, ny = dx / ln;
            for (const d of [1, 1.6]) {
              for (const sg of [1, -1]) {
                const off = d * (Math.abs(nx) * probe.w / 2 + Math.abs(ny) * probe.h / 2 + 14);
                cands.push({x: q.x + nx * off * sg, y: q.y + ny * off * sg - probe.h / 2, anchor: 'middle'});
              }
            }
          }
          // a short link would disappear under a caption sitting on it: the caption then sits
          // beside it (clear of the link itself), never over its ends
          const ext = (() => {
            const q0 = at(0.4), q1 = at(0.6);
            const dx = Math.abs(q1.x - q0.x), dy = Math.abs(q1.y - q0.y), ln = Math.hypot(dx, dy) || 1;
            return (dx / ln) * probe.w + (dy / ln) * probe.h;
          })();
          // (a caption never sits on a link that is short for the two-line caption)
          const beside = forceBeside || linkLen < ext + 160;
          if (beside) {
            // the link itself (with a margin) is an obstacle; more offsets along its normal
            if (!besideAdded) for (let k = 0; k <= 30; k++) { const q = at(k / 30); placer.addObstacle({x: q.x - 16, y: q.y - 16, w: 32, h: 32}); }
            besideAdded = true;
            cands.splice(0, 5);
            for (const tq of [0.3, 0.7, 0.45, 0.55]) {
              const q = at(tq), q2 = at(Math.min(1, tq + 0.02));
              const dx = q2.x - q.x, dy = q2.y - q.y, ln = Math.hypot(dx, dy) || 1;
              const nx = -dy / ln, ny = dx / ln;
              for (const d of [1.15, 1.4, 2]) for (const sg of [1, -1]) {
                const off = d * (Math.abs(nx) * probe.w / 2 + Math.abs(ny) * probe.h / 2 + 14);
                cands.push({x: q.x + nx * off * sg, y: q.y + ny * off * sg - probe.h / 2, anchor: 'middle'});
              }
            }
          }
          // (for the search of a clear spot only) the same offset points with the caption hung
          // to their left or right, and further out along the normal
          const extra = [];
          for (const tq of [0.5, 0.38, 0.62, 0.3, 0.7]) {
            const q = at(tq), q2 = at(Math.min(1, tq + 0.02));
            const dx = q2.x - q.x, dy = q2.y - q.y, ln = Math.hypot(dx, dy) || 1;
            const nx = -dy / ln, ny = dx / ln;
            for (const d of [1.15, 1.6, 2.2]) for (const sg of [1, -1]) {
              const off = d * (Math.abs(nx) * probe.w / 2 + Math.abs(ny) * probe.h / 2 + 14);
              for (const anchor of ['end', 'start']) extra.push({x: q.x + nx * off * sg, y: q.y + ny * off * sg - probe.h / 2, anchor});
            }
          }
          return {cands, extra, beside};
        };
        // a caption that does not sit on its link gets a short dashed leader to its nearest point
        const leadOf = bx => {
          let best = null, bd = Infinity;
          for (let k = 0; k <= 40; k++) {
            const q = at(0.1 + 0.8 * k / 40);
            const ex = clamp(q.x, bx.x, bx.x + bx.w), ey = clamp(q.y, bx.y, bx.y + bx.h);
            const d = Math.hypot(q.x - ex, q.y - ey);
            if (d < bd) { bd = d; best = {q, e: {x: ex, y: ey}}; }
          }
          return bd > 14 ? {x1: best.e.x, y1: best.e.y, x2: best.q.x, y2: best.q.y} : null;
        };
        // clear = inside the scene, over no element, other link or label (its own link only where
        // it sits on it), and a leader that crosses no element or label
        const hit = (o2, b) => o2.x < b.x + b.w && o2.x + o2.w > b.x && o2.y < b.y + b.h && o2.y + o2.h > b.y;
        // (ownMargin false: the margin kept around a short link of its own is not checked)
        const clear = (q, ownMargin = true) => {
          const b = q.box;
          if (b.x < 8 || b.y < 8 || b.x + b.w > S.w - 8 || b.y + b.h > S.h - 8) return false;
          const obs = ownMargin ? placer.obstacles : placer.obstacles.slice(0, nObs);
          if ([...obs, ...placer.labels].some(o2 => hit(o2, b))) return false;
          if (!q.lead) return true;
          for (let k = 1; k < 16; k++) {
            const pt = {x: lerp(q.lead.x1, q.lead.x2, k / 16) - 1, y: lerp(q.lead.y1, q.lead.y2, k / 16) - 1, w: 2, h: 2};
            if (placer.labels.some(o2 => hit(o2, pt))) return false;
            // (the leader may end on its link where the link lies over an element's margin)
            if (Math.hypot(pt.x - q.lead.x2, pt.y - q.lead.y2) > 26 && placer.obstacles.some(o2 => o2.solid && hit(o2, pt))) return false;
          }
          return true;
        };
        const nObs = placer.obstacles.length;
        // (candsFor adds the link itself as an obstacle when the caption must sit beside it)
        const variantOf = (mw, lines, forceBeside = false, minK = 0.9) => {
          placer.obstacles.length = nObs;
          besideAdded = false;
          const chipOf = variant(mw, lines, minK);
          const pr = chipOf({x: 0, y: 0, anchor: 'middle'});
          const make = c => {
            const cc = chipOf(c);
            return {box: cc.box, node: cc.node, lead: leadOf(cc.box)};
          };
          return {ok: !(lines > 2 && pr.fit.truncated), make, ...candsFor(pr.box, forceBeside)};
        };
        // the two-line caption at the least crowded spot near its link; where that spot still
        // covers an element, another link or a label, the first clear candidate of the two-line
        // caption, else of a narrower three-line one, takes its place
        const v0 = variantOf(260, 2);
        const first = placer.place(v0.cands, v0.make, mid, {maxDist: 160, step: v0.beside ? 16 : 30, register: false});
        let res = clear(first, false) ? first : null;
        // (the last, narrowest one may set its words a little smaller: wider fonts)
        for (const [mw, lines, minK] of res ? [] : [[260, 2, 0.9], [200, 3, 0.9], [176, 3, 0.8]]) {
          const vr = variantOf(mw, lines, v0.beside, minK);
          if (!vr.ok) continue;
          for (const c of [...vr.cands, ...vr.extra]) {
            const q = vr.make(c);
            if (clear(q)) { res = q; break; }
          }
          if (res) break;
        }
        if (!res) res = first;
        placer.addLabel(res.box);
        const bx = res.box;
        const lead = res.lead;
        relLabels.push({i: x.i, box: bx, lead, node: g({name: `rl${x.i}`, opacity: 0},
          lead ? h('line', {x1: r(lead.x1), y1: r(lead.y1), x2: r(lead.x2), y2: r(lead.y2), stroke, 'stroke-width': 2.2, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
          lead ? h('circle', {cx: r(lead.x2), cy: r(lead.y2), r: 4, fill: stroke}) : null,
          res.node)});
        placer.obstacles.length = baseObs;
      });
    }

    // ---- tracer route through the supplied order (on drawn links; straight hop otherwise)
    const order = p.traversalOrder.filter(id => present.has(id));
    const legs = [];
    for (let k = 1; k < order.length; k++) {
      const a = order[k - 1], b = order[k];
      const link = rels.find(x => (x.rel.from === a && x.rel.to === b) || (x.rel.from === b && x.rel.to === a));
      if (link) {
        const fwd = link.rel.from === a;
        const poly = link.chain ? link.route0 : null;
        const len = link.chain ? link.route0.total : link.conn.total;
        const p0 = link.chain ? poly.at(fwd ? 0 : 1) : link.conn.at(fwd ? 0 : 1);
        const p1 = link.chain ? poly.at(fwd ? 1 : 0) : link.conn.at(fwd ? 1 : 0);
        legs.push({a, b, link, fwd, len, p0, p1});
      } else {
        const pa = center(E[a].box), pb = center(E[b].box);
        legs.push({a, b, link: null, fwd: true, len: Math.hypot(pb.x - pa.x, pb.y - pa.y), p0: pa, p1: pb});
      }
    }
    // where a leg arrives at one port of a work and the next leaves from another (e.g. the
    // quoted passage → its own footnote), the ring reads across the page: a "through" leg
    const segs = [];
    legs.forEach((lg, k) => {
      if (k > 0) {
        const prev = legs[k - 1];
        const gap = Math.hypot(lg.p0.x - prev.p1.x, lg.p0.y - prev.p1.y);
        if (gap > 1) segs.push({a: lg.a, b: lg.a, link: null, through: true, fwd: true, len: gap, pa: prev.p1, pb: lg.p0});
      }
      segs.push(lg);
    });
    const total = segs.reduce((acc, x) => acc + x.len, 0) || 1;
    let acc = 0;
    const visits = [{id: order[0], t: 0, tEnd: 0}];
    for (const sg of segs) {
      acc += sg.len;
      if (sg.through) visits[visits.length - 1].tEnd = acc / total;
      else visits.push({id: sg.b, t: acc / total, tEnd: acc / total});
    }

    // compact starting cluster: the works side by side at CLUSTER_K, centred on the pile point
    const cw = DOCS.filter(id => present.has(id)).map(id => E[id].w * CLUSTER_K);
    const gapC = 14;
    let cx = Pl.pile.x - (cw.reduce((a2, b2) => a2 + b2, 0) + gapC * (cw.length - 1)) / 2;
    const cluster = {};
    for (const id of DOCS.filter(q => present.has(q))) {
      const w = E[id].w * CLUSTER_K;
      cluster[id] = {x: cx + w / 2, y: Pl.pile.y};
      cx += w + gapC;
    }
    return {S, s, ox, oy, E, rels, names, relLabels, legend, segs, total, visits, order, Pl, present, entry, cluster, relEnds};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const elNodes = IDS.filter(id => L.present.has(id)).map(id => {
      const e = L.E[id];
      return g({name: `el-${id}`, opacity: 0}, g({transform: T(-e.w / 2, -e.h / 2)}, e.content));
    });
    // draw order: shelf + search + card, then the works (pile: note on top), then links and labels
    const order = ['library', 'search', 'card', 'source', 'intermediate', 'note'];
    const byId = Object.fromEntries(IDS.filter(id => L.present.has(id)).map((id, k) => [id, elNodes[k]]));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      order.filter(id => byId[id]).map(id => byId[id]),
      L.rels.map(x => (x.chain ? x.chain.node : x.conn.node)),
      L.rels.filter(x => x.chain).map(x => x.chain.clasp),
      h('g', {name: 'tracer', opacity: 0},
        h('circle', {r: 34, fill: BRASS.light, opacity: 0.35}),
        h('circle', {r: 18, fill: 'none', stroke: BRASS.dark, 'stroke-width': 10}),
        h('circle', {r: 18, fill: 'none', stroke: BRASS.mid, 'stroke-width': 5}),
        h('path', {d: 'M-10 -12A16 16 0 0 1 10 -13', fill: 'none', stroke: BRASS.light, 'stroke-width': 3, 'stroke-linecap': 'round'})),
      L.relLabels.map(x => x.node),
      L.names.map(x => x.node),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sep = ease.inOutCubic(seg(u, ...W.sep));
    const extras = ease.outCubic(seg(u, ...W.extras));
    const trace = seg(u, ...W.trace);
    const reduced = ctx.reduced;
    // swell while the tracer visits an element (the focus element more)
    const visitBump = id => {
      let b = 0;
      for (const v of L.visits) {
        if (v.id !== id) continue;
        const d = trace < v.t ? v.t - trace : trace > v.tEnd ? trace - v.tEnd : 0;
        b = Math.max(b, trace > 0 && trace < 1.0001 && u < W.trace[1] + 0.02 ? clamp(1 - d / 0.12) : 0);
      }
      return ease.inOutSine(b);
    };
    const kOf = id => 1 + (id === p.focusElement ? AMP.focus : AMP.other) * (reduced ? 0.5 : 1) * visitBump(id);
    const centers = {};
    const scales = {};
    for (const id of IDS) {
      if (!L.present.has(id)) continue;
      const b = L.E[id].box;
      const fin = {x: b.x + b.w / 2, y: b.y + b.h / 2};
      let c = fin, k0 = 1, op = 1;
      if (DOCS.includes(id)) {
        // start as a compact cluster (side by side, never overlapping) and fan out down the staircase
        const c0 = L.cluster[id];
        c = {x: lerp(c0.x, fin.x, sep), y: lerp(c0.y, fin.y, sep)};
        k0 = lerp(CLUSTER_K, 1, sep);
      } else {
        op = extras;
        c = {x: fin.x, y: fin.y + 30 * (1 - extras)};
      }
      const k = k0 * kOf(id);
      centers[id] = c;
      scales[id] = k;
      nodes[`el-${id}`] = {transform: T(c.x, c.y, 0, k), opacity: r(op, 3)};
    }
    const port = (id, q) => {
      const e = L.E[id];
      return {x: centers[id].x + (q.x - e.w / 2) * scales[id], y: centers[id].y + (q.y - e.h / 2) * scales[id]};
    };
    const curBox = id => {
      const e = L.E[id], k = scales[id], c = centers[id];
      return {x: c.x - (e.w * k) / 2, y: c.y - (e.h * k) / 2, w: e.w * k, h: e.h * k};
    };
    // relationships draw one after the other
    const n = L.rels.length;
    const drawnOf = k => (n ? clamp((seg(u, ...W.relate) * n) - k) : 0);
    const relationsDrawn = [];
    const ends = [];
    const routes = {};
    L.rels.forEach((x, k) => {
      const pr = ease.inOutSine(drawnOf(k));
      relationsDrawn.push(r(pr, 3));
      if (x.chain) {
        const a = port(x.rel.from, L.E[x.rel.from].ports.out);
        const b = port(x.rel.to, L.E[x.rel.to].ports.in);
        const route = chainPath(L.Pl, a, b);
        routes[k] = route;
        const f = x.chain.frame(route, pr);
        Object.assign(nodes, f.nodes);
        if (pr >= 1) ends.push({kind: 'chain', ok: Math.hypot(f.tip.x - b.x, f.tip.y - b.y) < 1 && Math.hypot(route.at(0).x - a.x, route.at(0).y - a.y) < 1});
      } else {
        // re-anchored on both elements' CURRENT boxes (they swell while visited): the end dots
        // always sit on the element edges
        const ba = curBox(x.rel.from), bb = curBox(x.rel.to);
        const {from, to} = L.relEnds(ba, bb);
        const cn = connector(ctx, {name: `m-c${x.i}`, from, to, kind: x.rel.kind, bend: x.bend, color: kindColor(ctx, x.rel.kind)});
        const f = cn.frame(pr, pr > 0 ? 1 : 0);
        const d = `M${r(from.x)} ${r(from.y)}C${r(cn.c1.x)} ${r(cn.c1.y)} ${r(cn.c2.x)} ${r(cn.c2.y)} ${r(to.x)} ${r(to.y)}`;
        const st = LINK_STYLES[x.rel.kind] || LINK_STYLES.relation;
        const dash = {'stroke-dasharray': `${r(cn.total)} ${r(cn.total + 10)}`};
        if (st.dash) {
          f[`m-c${x.i}-masker`] = {...f[`m-c${x.i}-masker`], d, ...dash};
          f[`m-c${x.i}-line`] = {d};
        } else f[`m-c${x.i}-line`] = {...f[`m-c${x.i}-line`], d, ...dash};
        if (st.arrow) {
          const end = cn.at(1);
          f[`m-c${x.i}-head`] = {...f[`m-c${x.i}-head`], transform: T(end.x, end.y, (end.a * 180) / Math.PI)};
        }
        if (st.endDots) {
          f[`m-c${x.i}-dotA`] = {...f[`m-c${x.i}-dotA`], cx: r(from.x), cy: r(from.y)};
          f[`m-c${x.i}-dotB`] = {...f[`m-c${x.i}-dotB`], cx: r(to.x), cy: r(to.y)};
        }
        Object.assign(nodes, f);
        if (pr >= 1) {
          // each end lies on its element's current edge (within 3 units)
          const onEdge = (pt, b) => {
            const inX = pt.x >= b.x - 3 && pt.x <= b.x + b.w + 3, inY = pt.y >= b.y - 3 && pt.y <= b.y + b.h + 3;
            const onV = Math.min(Math.abs(pt.x - b.x), Math.abs(pt.x - b.x - b.w)) <= 3 && inY;
            const onH = Math.min(Math.abs(pt.y - b.y), Math.abs(pt.y - b.y - b.h)) <= 3 && inX;
            return onV || onH;
          };
          ends.push({kind: x.rel.kind, ok: onEdge(from, ba) && onEdge(to, bb)});
        }
      }
      const rl = L.relLabels.find(q => q.i === x.i);
      if (rl) nodes[`rl${x.i}`] = {opacity: r(clamp((pr - 0.6) / 0.4), 3)};
    });
    // tracer
    let tracerPt = null;
    let tracerOnLink = true;
    const tracerOn = trace > 0 && u < W.tracerOut[1];
    if (L.segs.length) {
      let dist0 = trace * L.total;
      let sg = L.segs[L.segs.length - 1], local = 1;
      for (const x of L.segs) {
        if (dist0 <= x.len) { sg = x; local = x.len ? dist0 / x.len : 1; break; }
        dist0 -= x.len;
      }
      const tt = sg.fwd ? local : 1 - local;
      if (sg.link && sg.link.chain) {
        const k = L.rels.indexOf(sg.link);
        const route = routes[k] || sg.link.route0;
        tracerPt = route.at(tt);
        // the ring rides ON the drawn chain (nearest sample of the drawn route)
        tracerOnLink = route.pts.some(q => Math.hypot(q.x - tracerPt.x, q.y - tracerPt.y) < 20);
      } else if (sg.link) {
        tracerPt = sg.link.conn.at(tt);
      } else if (sg.through) {
        // across the work, from the arrival port to the departure port (they follow the swell)
        const e = L.E[sg.a];
        const toLocal = q => ({x: (q.x - (e.box.x + e.w / 2)) + e.w / 2, y: (q.y - (e.box.y + e.h / 2)) + e.h / 2});
        const pa = port(sg.a, toLocal(sg.pa)), pb = port(sg.a, toLocal(sg.pb));
        tracerPt = {x: lerp(pa.x, pb.x, local), y: lerp(pa.y, pb.y, local)};
      } else {
        const pa = centers[sg.a], pb = centers[sg.b];
        tracerPt = {x: lerp(pa.x, pb.x, local), y: lerp(pa.y, pb.y, local)};
      }
      const fade = 1 - seg(u, ...W.tracerOut);
      nodes.tracer = {transform: T(tracerPt.x, tracerPt.y), opacity: tracerOn ? r(Math.min(1, trace * 20) * fade, 3) : 0};
    } else nodes.tracer = {opacity: 0};
    // visits: order so far, eyelet pulses, card rows
    const visited = L.visits.filter(v => trace > 0 && trace >= v.t - 1e-6).map(v => v.id);
    const firstVisit = id => { const v = L.visits.find(q => q.id === id); return v ? v.t : null; };
    const pulseAt = (name, id) => {
      const t0 = firstVisit(id);
      if (t0 === null) return;
      Object.assign(nodes, pulse(name, trace > 0 ? clamp((trace - t0) / 0.1) : 0));
    };
    if (L.E.note) pulseAt('m-art-eye', 'note');
    if (L.E.intermediate) { pulseAt('m-book-eyeIn', 'intermediate'); }
    if (L.E.source) pulseAt('m-fol-eye', 'source');
    // a card row is recorded as the ring arrives at its work
    const rows = DOCS.map(id => {
      const t0 = firstVisit(id);
      return t0 === null || trace <= 0 ? 0 : r(clamp((trace - t0 + 0.05) / 0.05), 3);
    });
    if (L.E.card) {
      rows.forEach((q, i) => {
        nodes[`m-card-row${i}`] = {opacity: r(0.35 + 0.65 * q, 3)};
        nodes[`m-card-row${i}-on`] = {opacity: r(q, 3)};
        nodes[`m-card-row${i}-dash`] = {opacity: 0};
      });
    }
    // the book stays open; its footnote and the folio entry light when visited
    if (L.E.intermediate) {
      Object.assign(nodes, L.E.intermediate.ports.book.frame({x: 0, y: 0, k: 1, turn: 1, open: 1, shadow: 0.5}));
      delete nodes['m-book'];
      nodes['m-book-foot-hl'] = {opacity: r(0.9 * (firstVisit('intermediate') !== null && trace > 0 ? clamp((trace - firstVisit('intermediate')) / 0.08) : 0), 3)};
    }
    if (L.E.source) nodes['m-fol-hl'] = {opacity: r(0.9 * (firstVisit('source') !== null && trace > 0 ? clamp((trace - firstVisit('source')) / 0.08) : 0), 3)};
    if (L.E.note) nodes['m-art-foot-hl'] = {opacity: r(0.9 * (firstVisit('note') !== null && trace > 0 ? clamp((trace - firstVisit('note')) / 0.08 + 0.3) : 0), 3)};
    if (L.E.search) {
      nodes['m-scr-qclip'] = {width: r(L.E.search.ports.scr.qW * extras + 4)};
      nodes['m-scr-caret'] = {opacity: 0};
      nodes['m-scr-hl'] = {opacity: r(seg(u, 0.16, 0.2), 3)};
    }
    if (L.E.library) nodes['m-case-plate-glow'] = {opacity: r(0.8 * seg(u, 0.2, 0.26) * (1 - seg(u, 0.4, 0.46)), 3)};
    // labels
    const nameOp = r(seg(u, ...W.names), 3);
    const stOp = r(seg(u, ...W.states), 3);
    L.names.forEach(x => {
      nodes[`name-${x.id}`] = {opacity: nameOp};
      if (x.stateNode) nodes[`name-${x.id}-state`] = {opacity: stOp};
    });
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sep, 3),
        relationsDrawn,
        relationKinds: L.rels.map(x => x.rel.kind),
        chainLinks: L.rels.filter(x => x.chain).map(x => `${x.rel.from}>${x.rel.to}`),
        anchoredEnds: ends.length === L.rels.length && ends.every(e => e.ok),
        arrowsOnRelations: L.rels.some(x => !x.chain && x.rel.kind === 'relation' && LINK_STYLES.relation.arrow),
        tracer: P2(tracerPt),
        tracerVisible: tracerOn,
        visitOrder: visited,
        cardRows: rows,
        focusScale: r(scales[p.focusElement] ?? 1, 3),
        statesShown: stOp,
        centers: Object.fromEntries(Object.entries(centers).map(([k, v]) => [k, P2(v)])),
        noteC: P2(centers.note), intC: P2(centers.intermediate), srcC: P2(centers.source),
        tracerOnLink,
        visitTimes: L.visits.map(v => ({id: v.id, u: r(W.trace[0] + (W.trace[1] - W.trace[0]) * v.t, 4), uEnd: r(W.trace[0] + (W.trace[1] - W.trace[0]) * v.tEnd, 4)})),
      },
    };
  },
};

/** Two-part chip: element name, and a state line that appears later below it. */
function nameChip(ctx, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = size * 0.6, padY = size * 0.36;
  const nf = ctx.fit(o.text, {maxWidth: o.maxWidth - padX * 2, size, minSize: size * 0.78, maxLines: o.maxLines ?? 2, weight: 700});
  const sf = o.state ? ctx.fit(o.state, {maxWidth: o.maxWidth - padX * 2, size: size * 0.82, minSize: size * 0.66, maxLines: 2, weight: 600}) : null;
  const w1 = nf.width + padX * 2;
  const h1 = nf.height + padY * 2;
  const w2 = sf ? sf.width + padX * 2 : 0;
  const h2 = sf ? sf.height + padY * 1.6 : 0;
  const w = Math.max(w1, w2);
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const cx = x + w / 2;
  const main = g({name: o.name, opacity: 0},
    // optional dashed leader to the element's edge (when the chip could not touch it)
    o.lead ? h('line', {x1: r(o.lead.x1), y1: r(o.lead.y1), x2: r(o.lead.x2), y2: r(o.lead.y2), stroke: o.color, 'stroke-width': 2.2, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
    o.lead ? h('circle', {cx: r(o.lead.x2), cy: r(o.lead.y2), r: 4.5, fill: o.color}) : null,
    h('path', {d: roundRectPath(cx - w1 / 2, y, w1, h1, Math.min(h1 / 2, size * 0.7)), fill: th.card, stroke: o.color, 'stroke-width': 2.4}),
    textBlockC(nf, cx, y + padY, o.color),
  );
  const stateNode = sf ? g({name: `${o.name}-state`, opacity: 0},
    h('path', {d: roundRectPath(cx - w2 / 2, y + h1 + 4, w2, h2, 10), fill: th.dark ? '#2b3036' : '#f6f1e4', stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '5 4'}),
    textBlockC(sf, cx, y + h1 + 4 + padY * 0.8, th.dark ? th.fg : th.ink),
  ) : null;
  return {node: g(null, main, stateNode), stateNode, box: {x, y, w, h: h1 + (sf ? h2 + 4 : 0)}};
}

function textBlockC(fit, x, y, fill) {
  return h('text', {x, y: y + fit.size * 0.8, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'text-anchor': 'middle', fill},
    fit.truncated ? h('title', null, fit.full) : null,
    fit.lines.map((line, i) => h('tspan', {x, dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, line)));
}

/** Legend of the relation kinds in use (sequence = chain, others = connector styles). */
function legendNode(ctx, kinds, labels, at, size) {
  const th = ctx.theme;
  const items = kinds.map(k => {
    const text = labels[k] || k;
    const f = ctx.fit(text, {maxWidth: 260, size, minSize: size * 0.8, maxLines: 1, weight: 600});
    return {k, f, w: 70 + 12 + f.width};
  });
  const gap = 40;
  const total = items.reduce((a, it) => a + it.w, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const y = at.y;
  const parts = [];
  for (const it of items) {
    if (it.k === 'sequence') {
      // a short chain sample
      for (let j = 0; j < 4; j++) {
        parts.push(h('rect', {x: x + j * 17, y: y - 5, width: 14, height: 10, rx: 5, fill: 'none', stroke: BRASS.dark, 'stroke-width': 3.2}));
      }
      parts.push(h('path', {d: `M${r(x + 64)} ${r(y - 6)}l8 6l-8 6`, fill: 'none', stroke: BRASS.dark, 'stroke-width': 3, 'stroke-linecap': 'round'}));
    } else {
      const st = LINK_STYLES[it.k];
      const c = kindColor(ctx, it.k);
      parts.push(h('line', {x1: x, x2: x + 66, y1: y, y2: y, stroke: c, 'stroke-width': st.width, 'stroke-dasharray': st.dash || null, 'stroke-linecap': 'round'}));
      if (st.endDots) parts.push(h('circle', {cx: x, cy: y, r: st.width * 1.6, fill: c}), h('circle', {cx: x + 66, cy: y, r: st.width * 1.6, fill: c}));
      if (st.arrow) parts.push(h('path', {d: `M${r(x + 66)} ${y}l-12 -7l3 7l-3 7z`, fill: c}));
    }
    parts.push(h('text', {x: x + 82, y: y + it.f.size * 0.34, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", 'font-size': r(it.f.size, 2), 'font-weight': 600, fill: th.fgSoft}, it.f.lines[0]));
    x += it.w + gap;
  }
  const bx = at.x - total / 2 - 16;
  return {node: g({name: 'legend', opacity: 0}, parts), box: {x: bx, y: y - size, w: total + 32, h: size * 2}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-10-mechanism',
    title: 'Citation traceability — anatomy of a citation trail',
    titleEs: 'Trazabilidad de una cita — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Trazabilidad de una cita',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded citation staircase: the citing article, the open intermediate reference and the original folio fan out of a compact cluster; each supplied "sequence" link is a brass chain hooked from a footnote eyelet to the cited passage, while plain relations (search locates the shelf, the shelf holds the book, the card records) are arrowless lines. A ring traces the supplied order; visited works swell and the card records each stop. Descriptive states only.',
    tags: ['citation', 'traceability', 'mechanism', 'footnote', 'intermediate reference', 'source document', 'chain', 'relation', 'sequence', 'tracer', 'library', 'catalogue search', 'index card'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/trazabilidad-de-una-cita.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
