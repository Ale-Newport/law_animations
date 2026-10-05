/**
 * LAW-0148 — Delegación normativa · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the records desk in the state produced by the action —
 *              the instrument's reference phrase and the enabling passage are
 *              marked, the link cord runs from the eyelet beside the basis
 *              clause to the enabling page, where the binder clip is clamped
 *              (supplied BEFORE state), and the tag on the cord is turned to
 *              its written face (the before value). Context caption on.
 *  [0.20–0.45] isolate: a source frame settles on the link point (clip, tag
 *              and the end of the cord). The whole desk shrinks into a corner
 *              miniature (the context thumbnail) while a detail window grows
 *              out of the source frame; the window is a REAL enlarged copy of
 *              the same stage coordinates, tied to the thumbnail by cone lines.
 *  [0.45–0.75] substitute: in the detail the tag's value lifts out and the
 *              supplied alternative rises in; a struck-through "before" trace
 *              stays under the window. Only the dependent geometry follows the
 *              SUPPLIED after-state: for "authorization to be checked" the
 *              clip's jaws open and it slides off the page edge onto the desk,
 *              the cord goes slack and the highlight on the enabling passage
 *              gives way to a dashed pencil outline. Nothing is inferred.
 *  [0.75–1.00] return: the window collapses back into the source frame and
 *              the desk returns to full size; a neutral changed-datum marker
 *              (white Δ on the blue disc) and its note keep the change
 *              traceable. Seeking back restores the old datum exactly.
 * @module animations/sources/LAW-0148
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, obj, oneOf} from '../../schemas/fields.js';
import {chip, callout} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {linkDesk, placeFree, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, LINK_STATES, boxesOverlap, cloneForLens, namesIn, mirror, wordSafe} from './kits/delegacion-normativa.js';

const ID = 'LAW-0148';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  hl: [0.02, 0.1], flip: [0.05, 0.13], caption: [0.03, 0.1],
  src: [0.2, 0.24], shrink: [0.22, 0.38], open: [0.25, 0.41],
  swap: [0.47, 0.6], trace: [0.5, 0.56], geo: [0.52, 0.66],
  close: [0.76, 0.86], grow: [0.76, 0.88], traceOut: [0.76, 0.8], mark: [0.86, 0.92], key: [0.84, 0.9],
};

const sceneSchema = {
  ...sourcesFields,
  ...inspectFields(['link-tag']),
  states: obj('Link states supplied by the author before and after the substitution (they drive the clip; never inferred from the tag wording)', {
    before: oneOf('Supplied state before the substitution', LINK_STATES),
    after: oneOf('Supplied state after the substitution', LINK_STATES),
  }, ['before', 'after']),
};
sceneSchema.focusTarget.description = 'Detail that is enlarged and substituted: the link point (clip, tag and cord end on the enabling page)';
sceneSchema.beforeValue.description = 'Value written on the link tag before the substitution';
sceneSchema.afterValue.description = 'Value written on the link tag after the substitution (the alternative datum)';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  focusTarget: 'link-tag',
  beforeValue: 'Authorization supplied',
  afterValue: 'Authorization to be checked',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Context: the link as supplied', marker: 'Changed datum'},
  states: {before: 'authorization-supplied', after: 'authorization-to-be-checked'},
};

const LAYOUT = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const union = bs => {
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0};
};

const scene = {
  sizes: {landscape: [1690, 800], square: [950, 800], portrait: [950, 1420]},
  layout(ctx0) {
    // whole-word wrapping (no word split across lines; punctuation stays with its word)
    const ctx = wordSafe(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitT(ctx);
    const layout = LAYOUT[ctx.view.shape];
    // The desk is solved for a few hang settings of the tag (a shorter string and a tighter cord lift the
    // tag and leave room beside it); the first where the changed-datum note sits right next to its
    // marker (touching it, or on a short leader that crosses nothing) is kept
    const DESK_TRIES = layout === 'vertical'
      // (tall frames: the magnifier stays on the desk, parked smaller in the corner)
      ? [{lupa: {x: 858, y: 1352, R: 36, angle: 180}}, {lupa: {x: 858, y: 1352, R: 36, angle: 180}, tagString: 20, cordK: 1.02, cordAdd: 14}, {lupa: {x: 858, y: 1352, R: 36, angle: 180}, tagString: 12, cordK: 1.0, cordAdd: 6}]
      : [{}, {tagString: 20, cordK: 1.02, cordAdd: 14}, {tagString: 12, cordK: 1.0, cordAdd: 6},
        // (wide and square frames, last resort: a deeper desk gives the tag room below it)
        ...(layout === 'horizontal' ? [{tagString: 20, cordK: 1.02, cordAdd: 14, deskH: 940}, {tagString: 12, cordK: 1.0, cordAdd: 6, deskH: 1000}] : []),
        ...(layout === 'square' ? [{tagString: 20, cordK: 1.02, cordAdd: 14, offDir: {x: 0.75, y: 0.66}}, {tagString: 12, cordK: 1.0, cordAdd: 6, offDir: {x: 0.9, y: 0.44}}, {_f: 1.1}, {_f: 1.1, tagString: 20, cordK: 1.02, cordAdd: 14}, {tagString: 12, cordK: 1.0, cordAdd: 6, deskH: 900}] : [])];
    const solveWith = geoOver => {
      const parkLens = true;
      const mkSt = textFloor => linkDesk(ctx, {
        prefix: 'ctx', layout, content: p, state: p.states.before, state2: p.states.after,
        tagText: p.beforeValue, tagText2: p.afterValue, clerk: false, reader: false, lupaParked: parkLens, chips: null, seedKey: 'dn-inspect',
        reserveTop: layout === 'square' ? 72 : layout === 'vertical' ? 64 : 0, textFloor, geo: geoOver, deskH: geoOver.deskH, _f: geoOver._f,
      });
      // small print (ids, board, card) never under ~16.4 px at 1080p: the floor follows the stage scale
      const CAN0 = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
      const pxOf = q => Math.min(CAN0[0] * 0.88 / ctx.design.w, CAN0[1] * 0.74 / ctx.design.h) * Math.min(ctx.design.w / q.W, ctx.design.h / q.H);
      let st = mkSt(0), TF = 0;
      for (let k = 0; k < 2; k++) { TF = 16.4 / pxOf(st); st = mkSt(TF); }
      // the context thumbnail: the same desk drawn with its wording as bars (words would be unreadably
      // small at thumbnail size); it takes over from the full desk half-way through the shrink
      const quietCtx = {...ctx, show: () => false};
      const thumbSt = linkDesk(quietCtx, {
        prefix: 'thb', layout, content: p, state: p.states.before, state2: p.states.after,
        tagText: p.beforeValue, tagText2: p.afterValue, clerk: false, reader: false, lupaParked: parkLens, chips: null, seedKey: 'dn-inspect',
        reserveTop: layout === 'square' ? 72 : layout === 'vertical' ? 64 : 0, textFloor: TF, geo: geoOver, deskH: geoOver.deskH, _f: geoOver._f,
      });
      const SW = st.W, SH = st.H;
      const size = st.G.size;
      // --- source frame: the link point (clip on the page edge, the tag, the end of the cord) in both states
      const tagBoxes = [st.tagBoxFor(p.states.before), st.tagBoxFor(p.states.after)];
      const clipBoxes = [st.clipBoxFor(p.states.before), st.clipBoxFor(p.states.after)];
      const core = union([...tagBoxes, ...clipBoxes]);
      const pad = 12;
      let S = {x: core.x - pad, y: core.y - pad, w: core.w + pad * 2, h: core.h + pad * 2};
      // the frame stops short of the text columns (no word is ever cut at the window's rim)
      const bk = st.bookC, bt = st.book.textBox, ins = st.instAt;
      const pb = st.book.provBox, ip = st.inst.provBox, it = st.inst.textBox;
      const cols = [
        {x: bk.x + bt.x - 8, y: bk.y + Math.min(pb.y, bt.y) - 2, w: bt.w + 16, h: bt.y + bt.h - Math.min(pb.y, bt.y) + 4},
        {x: bk.x + st.book.titleBox.x - 2, y: bk.y + st.book.titleBox.y - 2, w: st.book.titleBox.w + 4, h: st.book.titleBox.h + 4},
        {x: ins.x + it.x - 8, y: ins.y + Math.min(ip.y, it.y) - 2, w: it.w + 16, h: it.y + it.h - Math.min(ip.y, it.y) + 4},
        {x: ins.x, y: ins.y - 40, w: st.inst.w, h: st.inst.titleFit.height + 60},
        st.boardBox, st.noteBox,
      ].filter(Boolean);
      for (const c of cols) {
        if (!boxesOverlap(S, c, 0)) continue;
        const opts = [
          {x: Math.max(S.x, c.x + c.w + 2), y: S.y, r: S.x + S.w, b: S.y + S.h},
          {x: S.x, y: S.y, r: Math.min(S.x + S.w, c.x - 2), b: S.y + S.h},
          {x: S.x, y: Math.max(S.y, c.y + c.h + 2), r: S.x + S.w, b: S.y + S.h},
          {x: S.x, y: S.y, r: S.x + S.w, b: Math.min(S.y + S.h, c.y - 2)},
        ].map(q => ({x: q.x, y: q.y, w: q.r - q.x, h: q.b - q.y}))
          .filter(q => q.x <= core.x + 0.5 && q.y <= core.y + 0.5 && q.x + q.w >= core.x + core.w - 0.5 && q.y + q.h >= core.y + core.h - 0.5);
        if (opts.length) S = opts.sort((a, b) => b.w * b.h - a.w * a.h)[0];
      }
      // --- context thumbnail corner and detail window (same aspect as the source frame)
      // the context stays as LARGE as the window allows (never a small corner thumbnail on a blank page):
      // wide frames put it on the left, square and tall frames on top; it steps down only as far as the window
      // needs to show the isolated link point (clip, cord end, tag) at >= 1.6x its size in the hold scene
      const tcProbe = chip(ctx, `${t.before}: ${p.beforeValue}`, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(S.w * 1.6, 520), size: st.G.size, minSize: st.G.size * 0.9, maxLines: 2, weight: 600});
      const traceBand = tcProbe.box.h + 30;
      // (stacked frames may set the trace beside the window instead of under it, when the sides have room)
      const tcSide = chip(ctx, `${t.before}: ${p.beforeValue}`, {x: 0, y: 0, anchor: 'start', maxWidth: 300, size: st.G.size, minSize: st.G.size * 0.9, maxLines: 4, weight: 600});
      const roomFor = (k, tall, side = false) => {
        const TW = SW * k, TH = SH * k;
        const thumb = tall ? {x: (SW - TW) / 2, y: 14} : {x: 14, y: (SH - TH) / 2};
        const free = tall ? {x: 20, y: 14 + TH + 40, w: SW - 40, h: SH - TH - 14 - 40 - 20} : {x: 14 + TW + 40, y: 20, w: SW - TW - 14 - 40 - 20, h: SH - 40};
        // (a band under the window is kept for the struck-through "before" trace)
        const zoom = Math.min(p.detailGeometry.zoom, free.w / S.w, (free.h - (side ? 0 : traceBand)) / S.h);
        const sideOk = !side || (tall && (free.w - S.w * zoom) / 2 >= tcSide.box.w + 24 && S.h * zoom >= tcSide.box.h);
        return {k, TW, TH, thumb, free, tall, side, zoom: sideOk ? zoom : 0};
      };
      const planFor = (tall, side = false) => {
        let q = null;
        for (let k = tall ? 0.6 : 0.56; k >= 0.3; k -= 0.01) {
          q = roomFor(k, tall, side);
          if (q.zoom >= Math.min(1.6, p.detailGeometry.zoom)) break;
        }
        // context and window together: how much of the stage they make use of
        q.score = 3 * q.TW * q.TH + S.w * S.h * q.zoom * q.zoom;
        return q;
      };
      // wide frames: context left, window right; square and tall frames: context above the window
      const R0 = layout === 'horizontal' ? planFor(false) : [planFor(true), planFor(true, true)].filter(q => q.zoom >= Math.min(1.6, p.detailGeometry.zoom) - 1e-6).sort((a2, b2) => b2.k - a2.k)[0] || planFor(true);
      const {k: kThumb, thumb, free, zoom} = R0;
      const DW = S.w * zoom, DH = S.h * zoom;
      const pl = p.detailGeometry.placement;
      const dx = pl === 'left' ? free.x : pl === 'right' ? free.x + free.w - DW : free.x + (free.w - DW) / 2;
      const band = R0.side ? 0 : traceBand;
      const dy = pl === 'top' ? free.y : pl === 'bottom' ? free.y + free.h - band - DH : free.y + (free.h - band - DH) / 2;
      const D = {x: dx, y: dy, w: DW, h: DH};
      // --- detail copy (same coordinates, no ids) and its names for mirroring
      // (the book and the sheet come from the quiet desk, as in the context thumbnail: their wording is
      // drawn as bars, so no letter is cut at the window's rim; tag, clip and cord are the real ones)
      const src0 = st.lensSource(), srcQ = thumbSt.lensSource();
      const src = g(null, srcQ.children[0], srcQ.children[1], ...src0.children.slice(2));
      // the window shows the link point: the book's and the sheet's wording is left out of the copy (a
      // letter cut at the window's rim would read as a stray fragment); tag, clip and cord stay
      const dropTexts = (n, inDoc = false) => {
        if (!n || typeof n !== 'object') return n;
        const nm = (n.attrs && n.attrs.name) || '';
        const doc = inDoc || /-(bookg|instg)$/.test(nm);
        if (doc && n.tag === 'text') return null;
        return {...n, children: n.children.map(c => dropTexts(c, doc)).filter(c => c !== null)};
      };
      const detail = dropTexts(cloneForLens(src, 'dz-'));
      const detNames = namesIn(detail).map(n => n.replace(/^dz-/, ''));
      // --- context caption and key (free desk space), traces and changed-datum note
      // the cord in both poses, as a chain of small boxes (notes and markers never sit on it)
      const cordOf = stt => {
        const poly = st.cordFor(stt).poly;
        return Array.from({length: 33}, (_, i) => { const q = poly.at(i / 32); return {x: q.x - 8, y: q.y - 8, w: 16, h: 16}; });
      };
      const cordBoxes = [...cordOf(p.states.before), ...cordOf(p.states.after)];
      const lensBoxes = parkLens ? st.lensFp.boxes : [];
      const fixed = [st.bookBox, st.instBox, st.boardBox, st.noteBox, ...lensBoxes].filter(Boolean);
      const obstacles = [...fixed, ...tagBoxes, ...clipBoxes, ...cordBoxes];
      // the marker and its note appear after the substitution: only the after pose of tag, clip and cord is in the way
      const afterCord = cordOf(p.states.after);
      const markObs = [...fixed, tagBoxes[1], clipBoxes[1], ...afterCord];
      const bounds = {x: 14, y: 10, w: SW - 28, h: SH - 20};
      const mkChip = (text, name, q, weight = 600) => chip(ctx, text, {x: q.chipAt.x, y: q.chipAt.y, anchor: 'start', maxWidth: q.maxWidth, size, minSize: size * 0.9, maxLines: 3, fill: th.card, name, weight});
      // changed-datum marker beside the tag (after pose) and its note with a leader
      const tagA = tagBoxes[1];
      const markR = 20;
      // the Δ marker is pinned ON the changed tag, on one of its corners (the string hangs from the middle;
      // the "to be checked" pencil sits top right, so that corner comes last)
      const markCands = [
        {x: tagA.x, y: tagA.y}, {x: tagA.x, y: tagA.y + tagA.h}, {x: tagA.x + tagA.w, y: tagA.y + tagA.h}, {x: tagA.x + tagA.w, y: tagA.y},
        // (on the top edge, either side of the string)
        {x: tagA.x + tagA.w * 0.22, y: tagA.y}, {x: tagA.x + tagA.w * 0.78, y: tagA.y},
      ];
      const boxOfMark = q => ({x: q.x - markR - 4, y: q.y - markR - 4, w: markR * 2 + 8, h: markR * 2 + 8});
      const freeSpots = markCands.filter(q => !markObs.some(b => b !== tagA && boxesOverlap(boxOfMark(q), b, 2)));
      const spots = freeSpots.length ? freeSpots : [markCands[0]];
      const text = `${p.contextLabels.marker} · ${t.before}: ${p.beforeValue}`;
      const makeFor = (tg, sz = size) => q => {
        const c = callout(ctx, {name: 'mark-note', text, chipAt: q.chipAt, anchor: q.anchor, target: tg, maxWidth: q.maxWidth, size: sz, maxLines: 6});
        // (a width that would force the words smaller than the other captions counts as not fitting)
        const f = ctx.fit(text, {maxWidth: q.maxWidth - sz * 1.2, size: sz, minSize: sz * 0.75, maxLines: 6, weight: 600});
        c.fit = {...f, truncated: f.truncated || f.size < sz * 0.99};
        return c;
      };
      const WIDTHS = [600, 520, 440, 380, 340, 320, 300, 280, 260, 240, 210, 180];
      const inB = q => q.x >= bounds.x && q.y >= bounds.y && q.x + q.w <= bounds.x + bounds.w && q.y + q.h <= bounds.y + bounds.h;
      // a note with a leader reaching the marker's lower, upper, right or left edge along a clear route
      // (`crossCord`: the thin leader may pass over the cord, never over another object)
      const withLeader = (m, crossCord = false) => {
        const mb = boxOfMark(m);
        for (const tg of [{x: m.x, y: m.y + markR}, {x: m.x, y: m.y - markR}, {x: m.x + markR, y: m.y}, {x: m.x - markR, y: m.y}]) {
          const note = placeFree(ctx, {text, target: tg, targetBox: mb, obstacles: [...markObs, mb], leaderMayCross: crossCord ? afterCord : null, bounds, widths: WIDTHS, size, make: makeFor(tg)});
          if (note) return {note, tgt: tg};
        }
        return null;
      };
      // no clear route for a leader: the note sits against the marker, touching its ring
      const touching = m => {
        const tgt = {x: m.x, y: m.y + markR};
        let best = null;
        // a tight corner may take the note a step smaller (it is a caption; the supplied value keeps its size)
        for (const sz of [size, size * 0.95]) {
        for (const mw of WIDTHS) {
          const probe = makeFor(tgt, sz)({chipAt: {x: 0, y: 0}, anchor: 'start', maxWidth: mw});
          if (probe.fit.truncated) continue;
          const cw = probe.box.w, ch = probe.box.h, e = markR - 1.5;
          const cands = [];
          for (let d = 12; d <= ch - 12; d += 6) {
            cands.push({x: m.x + e, y: m.y - d, off: Math.abs(d - ch / 2)}, {x: m.x - e - cw, y: m.y - d, off: Math.abs(d - ch / 2)});
          }
          for (let d = 12; d <= cw - 12; d += 8) {
            cands.push({x: m.x - d, y: m.y + e, off: 20 + Math.abs(d - cw / 2)}, {x: m.x - d, y: m.y - e - ch, off: 20 + Math.abs(d - cw / 2)});
          }
          for (const q of cands) {
            const box = {x: q.x, y: q.y, w: cw, h: ch};
            if (!inB(box) || markObs.some(o => o && boxesOverlap(box, o, 6))) continue;
            if (!best || q.off < best.off) best = {...q, mw, sz};
          }
          if (best) break;
        }
        if (best) break;
        }
        return best ? {note: makeFor(tgt, best.sz)({chipAt: {x: best.x, y: best.y}, anchor: 'start', maxWidth: best.mw}), tgt} : null;
      };
      // (a leader is short: at most ~120 px at 1080p, from the note's edge to the marker)
      const pxU = Math.min(CAN0[0] * 0.88 / ctx.design.w, CAN0[1] * 0.74 / ctx.design.h) * Math.min(ctx.design.w / SW, ctx.design.h / SH);
      const maxLead = 124 / pxU;
      const leadLen = (b, tg) => {
        const fx = Math.max(b.x, Math.min(tg.x, b.x + b.w)), fy = Math.max(b.y, Math.min(tg.y, b.y + b.h));
        return Math.hypot(fx - tg.x, fy - tg.y);
      };
      let pick = null;
      if (ctx.show('key')) {
        // touching the marker first, then a short clear leader
        for (const m of spots) { const q = touching(m); if (q) { pick = {m, ...q, loose: true}; break; } }
        if (!pick) for (const m of spots) { const q = withLeader(m); if (q && leadLen(q.note.box, q.tgt) <= maxLead) { pick = {m, ...q, loose: false}; break; } }
        if (!pick) for (const m of spots) { const q = withLeader(m); if (q) { pick = {m, ...q, loose: false, long: true}; break; } }
        if (!pick) for (const m of spots) { const q = withLeader(m, true); if (q) { pick = {m, ...q, loose: false, crossCord: true}; break; } }
        if (!pick) {
          const m = spots[0], tgt = {x: m.x, y: m.y + markR};
          pick = {m, tgt, loose: true, note: placeFree(ctx, {text, target: tgt, obstacles: [...markObs, boxOfMark(m)], bounds, widths: WIDTHS, size, make: makeFor(tgt), noLeader: true})};
        }
      }
      const markAt = pick ? pick.m : spots[0];
      const markBox = boxOfMark(markAt);
      obstacles.push(markBox);
      const markNote = pick ? pick.note : null, markNoteLoose = Boolean(pick && pick.loose);
      if (markNote) {
        obstacles.push(markNote.box);
        // the leader's own strip, so the key and caption never sit on it
        const b = markNote.box, tg = pick.tgt;
        const fx = Math.max(b.x, Math.min(tg.x, b.x + b.w)), fy = Math.max(b.y, Math.min(tg.y, b.y + b.h));
        obstacles.push({x: Math.min(fx, tg.x) - 4, y: Math.min(fy, tg.y) - 4, w: Math.abs(fx - tg.x) + 8, h: Math.abs(fy - tg.y) + 8});
      }
      let caption = null, key = null;
      if (ctx.show('all')) {
        caption = placeFree(ctx, {target: {x: st.bookBox.x, y: st.bookBox.y}, obstacles, bounds, widths: [460, 380, 320, 260], size, noLeader: true, goodEnough: 1e9, make: q => mkChip(p.contextLabels.context, 'ctx-caption', q, 700)});
        if (caption) obstacles.push(caption.box);
      }
      if (ctx.show('key')) {
        key = placeFree(ctx, {target: {x: st.bookBox.x, y: st.bookBox.y + st.bookBox.h}, obstacles, bounds, widths: [420, 340, 280], size, noLeader: true, goodEnough: 1e9, make: q => mkChip(t.keyNote, 'key-note', q)});
        if (key) obstacles.push(key.box);
      }
      // struck-through "before" trace under (or above) the detail window
      let trace = null;
      if (ctx.show('key')) {
        const text = `${t.before}: ${p.beforeValue}`;
        const tc = chip(ctx, text, {x: D.x + D.w / 2, y: 0, anchor: 'middle', maxWidth: Math.min(D.w, 520), size, minSize: size * 0.9, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'trace', weight: 600});
        const below = D.y + D.h + 16 + tc.box.h <= SH - 8;
        const ty = below ? D.y + D.h + 16 : D.y - 16 - tc.box.h;
        const t2 = R0.side
          ? chip(ctx, text, {x: D.x + D.w + 18, y: D.y + D.h - tcSide.box.h, anchor: 'start', maxWidth: 300, size, minSize: size * 0.9, maxLines: 4, fill: th.card, stroke: th.inkSoft, name: 'trace', weight: 600})
          : chip(ctx, text, {x: D.x + D.w / 2, y: ty, anchor: 'middle', maxWidth: Math.min(D.w, 520), size, minSize: size * 0.9, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'trace', weight: 600});
        const f = t2.fit;
        const lines = f.lines.map((line, i) => {
          const lw = ctx.measure(line, f.size, f.weight, f.family);
          const ly = t2.box.y + (t2.box.h - f.height) / 2 + i * f.lineHeight + f.size * 0.52;
          return h('line', {x1: r(t2.box.cx - lw / 2 - 4), x2: r(t2.box.cx + lw / 2 + 4), y1: r(ly), y2: r(ly), stroke: th.ink, 'stroke-width': 2.4});
        });
        trace = {node: g({name: 'trace-g', opacity: 0}, t2.node, lines), box: t2.box};
      }
      const CAN = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
      const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
      const px = Math.min(CAN[0] * 0.88 / ctx.design.w, CAN[1] * 0.74 / ctx.design.h) * s;
      const clearOf = (b, list) => list.filter(Boolean).every(q => !boxesOverlap(b, q, 2));
      return {
        st, thumbSt, S, D, zoom, kThumb, thumb, detail, detNames, caption, key, markAt, markR, markNote, trace, layout,
        s, ox: (ctx.design.w - SW * s) / 2, oy: (ctx.design.h - SH * s) / 2, px,
        tagClear: st.G.tagClear,
        markNoteLoose, geoOver,
        // the note sits right next to its marker: touching it, or on a short leader crossing nothing
        noteOk: !ctx.show('key') || Boolean(pick && !pick.long && !pick.crossCord && (pick.loose || leadLen(pick.note.box, pick.tgt) <= maxLead + 0.5)),
        markLeadPx: pick && !pick.loose ? r(leadLen(pick.note.box, pick.tgt) * pxU, 1) : 0,
        // the marker is pinned on the changed tag (its centre on the tag's outline)
        markOnTag: markAt.x >= tagA.x - 1 && markAt.x <= tagA.x + tagA.w + 1 && markAt.y >= tagA.y - 1 && markAt.y <= tagA.y + tagA.h + 1,
        ctxScale: r(kThumb, 3),
        // the note is set at the captions' size (never a smaller fallback print)
        markNoteFull: !markNote || !markNote.fit || markNote.fit.size >= size * 0.94,
        markLeaderClear: !markNote || !markNoteLoose,
        // a leaderless note touches the marker's ring
        markNoteTouches: !markNote || !markNoteLoose || (() => {
          const b = markNote.box;
          const dx = Math.max(b.x - markAt.x, 0, markAt.x - (b.x + b.w)), dy = Math.max(b.y - markAt.y, 0, markAt.y - (b.y + b.h));
          return Math.hypot(dx, dy) <= markR + 0.5;
        })(),
        // caption and key are up from the start (both poses); the note only after the substitution
        holdClear: [caption, key].filter(Boolean).every(c => clearOf(c.box, [st.bookBox, st.instBox, st.boardBox, st.noteBox, ...tagBoxes, ...clipBoxes, ...cordBoxes, ...lensBoxes]))
          && (!markNote || clearOf(markNote.box, markObs)),
      };
    };
    // with labels hidden the desk keeps exactly the geometry of the labelled version (same hang, same window)
    if (!ctx.show('all') || !ctx.show('key')) return solveWith(scene.layout({...ctx0, show: () => true}).geoOver);
    let first = null;
    for (const geoOver of DESK_TRIES) {
      const L = solveWith(geoOver);
      if (L.noteOk) return L;
      first = first || L;
    }
    return first;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {S, st} = L;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      g({name: 'thumbg', opacity: 0}, L.thumbSt.node),
      g({name: 'ctxg'},
        st.node,
        L.caption && L.caption.node,
        L.key && L.key.node,
        g({name: 'mark', opacity: 0}, changedMarker(ctx, {x: L.markAt.x, y: L.markAt.y, radius: L.markR})),
        L.markNote && L.markNote.node,
      ),
      h('path', {name: 'det-src', d: roundRectPath(S.x, S.y, S.w, S.h, 12), fill: 'none', stroke: th.accent2, 'stroke-width': 5, opacity: 0}),
      h('line', {name: 'det-coneA', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'det-coneB', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id('det-clip')}, h('rect', {name: 'det-cliprect', rx: 18}))),
      g({name: 'det', opacity: 0},
        h('rect', {name: 'det-shadow', rx: 18, fill: th.shadow}),
        h('rect', {name: 'det-bg', rx: 18, fill: th.woodTop}),
        g({'clip-path': ctx.ref('det-clip')}, g({name: 'det-content'}, L.detail)),
        h('rect', {name: 'det-border', rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
      ),
      L.trace && L.trace.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {S, D} = L;
    const geo = ease.inOutCubic(seg(u, ...W.geo));
    const posed = L.st.pose({placed: true, stateMix: geo, hlRef: seg(u, ...W.hl), hlArt: seg(u, ...W.hl), flip: seg(u, ...W.flip), swap: seg(u, ...W.swap)});
    const nodes = posed.nodes;
    // context shrink into the corner thumbnail and back
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const kc = lerp(1, L.kThumb, sh);
    const oc = {x: L.thumb.x * sh, y: L.thumb.y * sh};
    const ctxT = sh > 0 ? `${T(oc.x, oc.y)} scale(${r(kc, 4)})` : '';
    const small = sh > 0.5;
    nodes.ctxg = {transform: ctxT, opacity: small ? 0 : 1};
    nodes.thumbg = {transform: ctxT, opacity: small ? 1 : 0};
    Object.assign(nodes, L.thumbSt.pose({placed: true, stateMix: geo, hlRef: seg(u, ...W.hl), hlArt: seg(u, ...W.hl), flip: seg(u, ...W.flip), swap: seg(u, ...W.swap)}).nodes);
    Object.assign(nodes, mirror(nodes, L.detNames, 'dz-'));
    const St = {x: oc.x + S.x * kc, y: oc.y + S.y * kc, w: S.w * kc, h: S.h * kc};
    const op = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const R = {x: lerp(St.x, D.x, op), y: lerp(St.y, D.y, op), w: lerp(St.w, D.w, op), h: lerp(St.h, D.h, op)};
    const k = R.w / S.w;
    const on = op > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes['det-cliprect'] = rect;
    nodes['det-bg'] = rect;
    nodes['det-border'] = rect;
    nodes['det-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['det-content'] = {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`};
    // the window card fades in and out BLANK: its copy is shown only while the card is fully opaque, so
    // there are never two visible, overlapping copies of the same wording (no ghosted double image)
    const cardOp = on ? Math.min(1, op * 4) : 0;
    nodes.det = {opacity: r(cardOp, 3)};
    nodes['det-content'].opacity = cardOp >= 1 ? 1 : 0;
    const srcOn = seg(u, ...W.src) * (1 - seg(u, 0.86, 0.9));
    nodes['det-src'] = {opacity: r(srcOn, 3), d: roundRectPath(r(St.x), r(St.y), r(St.w), r(St.h), 12 * kc)};
    // cone lines from the thumbnail's source frame to the window
    const horizontal = Math.abs(R.x + R.w / 2 - (St.x + St.w / 2)) >= Math.abs(R.y + R.h / 2 - (St.y + St.h / 2));
    let a1, a2, b1, b2;
    if (horizontal) {
      const sx = R.x > St.x ? St.x + St.w : St.x, rx = R.x > St.x ? R.x : R.x + R.w;
      [a1, a2, b1, b2] = [{x: sx, y: St.y}, {x: rx, y: R.y}, {x: sx, y: St.y + St.h}, {x: rx, y: R.y + R.h}];
    } else {
      const sy = R.y > St.y ? St.y + St.h : St.y, ry = R.y > St.y ? R.y : R.y + R.h;
      [a1, a2, b1, b2] = [{x: St.x, y: sy}, {x: R.x, y: ry}, {x: St.x + St.w, y: sy}, {x: R.x + R.w, y: ry}];
    }
    const coneOn = op > 0.05 ? 1 : 0;
    nodes['det-coneA'] = {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: coneOn};
    nodes['det-coneB'] = {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: coneOn};
    // before trace (visible while the window is open after the swap)
    const traceP = seg(u, ...W.trace) * (1 - seg(u, ...W.traceOut));
    if (L.trace) nodes['trace-g'] = {opacity: r(traceP, 3)};
    if (L.caption) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption) * (1 - sh), 3)};
    const keyP = seg(u, ...W.key);
    if (L.key) nodes['key-note'] = {opacity: r(keyP * (1 - sh), 3)};
    const markP = seg(u, ...W.mark);
    nodes.mark = {opacity: r(markP, 3)};
    if (L.markNote) {
      Object.assign(nodes, L.markNote.frame(markP));
      // no clear route for a leader: the note stays close to the marker without one (never a line across text)
      if (L.markNoteLoose) { nodes['mark-note-lead'] = {opacity: 0}; nodes['mark-note-dot'] = {opacity: 0}; }
    }
    const sem = posed.semantic;
    const swap = seg(u, ...W.swap);
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    // the window content maps the source frame onto the window exactly (same coordinates, uniform scale)
    const mapped = {x: R.x + (S.x - S.x) * k, y: R.y, w: S.w * k, h: S.h * k};
    return {
      nodes,
      semantic: {
        beat,
        clipFastened: sem.clipFastened, clipOffPage: sem.clipOffPage, clipOpen: sem.clipOpen, hlArt: sem.hlArt, pencilArt: sem.pencilArt,
        datum: swap >= 1 ? p.afterValue : p.beforeValue,
        swap: r(swap, 3),
        tagFlip: sem.tagFlip,
        lensOpen: r(op, 3),
        contextScale: r(kc, 4),
        magnification: r(D.w / S.w, 3),
        lensMapsSource: on && Math.abs(mapped.w - R.w) < 0.5 && Math.abs(mapped.h - R.h) < 0.5,
        sourceOnStage: {x: r(St.x), y: r(St.y)},
        detail: {x: r(R.x), y: r(R.y)},
        traceShown: traceP >= 1,
        markerShown: markP >= 1,
        keyShown: keyP >= 1 && sh === 0,
        statesSupplied: {...p.states},
        focusTarget: p.focusTarget,
        holdClear: L.holdClear,
        markLeaderClear: L.markLeaderClear,
        markNoteTouches: L.markNoteTouches,
        markNoteLoose: L.markNoteLoose,
        markOnTag: L.markOnTag,
        ctxScale: L.ctxScale,
        markNoteFull: L.markNoteFull,
        noteOk: L.noteOk,
        markLeadPx: L.markLeadPx,
        thumbSame: L.thumbSt.W === L.st.W && L.thumbSt.H === L.st.H,
        tagClear: L.tagClear,
        stage: {W: L.st.W, H: L.st.H, s: r(L.s, 3)},
        allReached: true,
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
    slug: 'sources-07-inspect',
    title: 'Delegated rule-making — inspect the link tag and substitute its value',
    titleEs: 'Delegación normativa — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Delegación normativa',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The records desk after the link was made: the cord from a fictional instrument\'s basis clause is clipped to the enabling page (Text 1 · Art. 12) and its tag reads the supplied value. The desk shrinks to a corner thumbnail while a detail window (a real enlarged copy) opens on the link point; the tag value is substituted and only the dependent geometry follows the supplied after-state (the clip opens and is laid beside the page for "to be checked"). A struck-through trace keeps the old value; back in context a neutral Δ marker notes the changed datum. No validity is stated.',
    tags: ['delegated rule-making', 'inspect', 'detail', 'substitution', 'changed datum', 'link', 'tag', 'clip', 'book', 'instrument', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/delegacion-normativa.js', 'src/animations/sources/kits/conflicto-entre-textos.js', 'src/primitives/markers.js', 'src/primitives/annotate.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
