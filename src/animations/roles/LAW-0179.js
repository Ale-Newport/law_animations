/**
 * LAW-0179 — Representación de una parte · contrast
 *
 * Two complete, identical office scenes (same client, representative, clerk,
 * table, form, counter; same clock). Exactly one supplied fact differs: WHO
 * performs the act at the counter.
 *  - A · own action: nobody is linked; the client picks the form up, walks to
 *    the counter and hands it over themself.
 *  - B · represented action: the client pulls the ribbon clip from the badge
 *    reel and passes it to the representative, who clips it on (the supplied
 *    link); the client hands over the form; the representative turns, walks
 *    to the counter (ribbon paying out) and hands it over.
 * Action clock c = (u − 0.17) / 0.6 in both scenes.
 *  0.00–0.17  base: identical rest state in A and B (neutral A/B badges only).
 *  0.17–0.40  change: the scenario labels and the changed fact appear; in A the
 *             client takes the form, in B the clip is passed and clipped on.
 *  0.40–0.77  parallel: A's client and B's representative walk to their
 *             counters and hand the form over, speaking.
 *  0.77–1.00  guide: a ring marks the person at each counter and a bracket
 *             joins them (the changed detail); the link tag, the shared facts
 *             and a neutral note (no winner, no outcome, no validity).
 * Shared text (cast, form, counter, shared facts, key) is drawn once in a strip.
 * @module animations/roles/LAW-0179
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {contrastFields} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {wchip} from './kits/mediation-labels.js';
import {
  REP_DEFAULTS, REP_STRINGS, ST, actorsField, rolesField, docPropsFields, relationshipItem,
  linkOf, captionOf, looksOf, repStage, choreo, bubble, keyChip, hit, wordSafe, FLAT, farPt,
} from './kits/representacion-de-una-parte.js';

const ID = 'LAW-0179';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const C0 = 0.17, C1 = 0.77;
const W = {labels: [0.17, 0.22], changed: [0.2, 0.26], tags: [0.77, 0.82], rings: [0.77, 0.83], bracket: [0.8, 0.87], guideLabel: [0.84, 0.89], neutral: [0.86, 0.92]};
const SIZE = {landscape: 25, portrait: 21, square: 30};
/** compact stage: the empty upper wall is cropped */
const TOP = -500;
/** 1:1 depth composition of each scene (as LAW-0177's 9:16) */
const DEPTH = {k: 0.8, fx: 88, fy: -440};
const DEPTH_W = 950;
/** depth composition: stage top (the empty wall above the clerk's head is cropped) */
const DEPTH_TOP = -850;

const STRINGS = {
  en: {...REP_STRINGS.en, sameFacts: 'Same in A and B', changedFact: 'Changed fact'},
  es: {...REP_STRINGS.es, sameFacts: 'Igual en A y B', changedFact: 'Hecho cambiado'},
};

const sceneSchema = {
  actors: actorsField,
  roles: rolesField,
  relationships: list('The supplied link between the representative and the client, drawn in scene B as the ribbon (empty = no link drawn)', relationshipItem, 0, 1),
  props: obj('Props (identical in both scenes; the form and the counter are named once in the shared strip)', {
    ...docPropsFields,
    speech: obj('What the person at the counter says in each scene', {a: str('Speech in scene A (own action)', 48), b: str('Speech in scene B (represented action)', 48)}),
  }),
  ...contrastFields(),
};

const defaultParams = {
  actors: REP_DEFAULTS.actors,
  roles: REP_DEFAULTS.roles,
  relationships: [REP_DEFAULTS.link],
  props: {...REP_DEFAULTS.docProps, speech: {a: 'My own form', b: 'I am here for Alex Moreno'}},
  scenarioA: {label: 'Own action', caption: 'Party A hands the form over personally'},
  scenarioB: {label: 'Represented action', caption: 'The representative hands it over for Party A'},
  changedFact: 'Who performs the act at the counter (as supplied)',
  sharedFacts: ['Same form, same counter, same people'],
  comparisonLabels: {guide: 'Only the person at the counter differs', neutral: 'Two situations side by side; no outcome and no validity is stated'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    // the supplied link label hangs from B's ribbon; if the scene has no clear spot for it (dense text,
    // small scenes), it goes into the shared strip with a matching lane-coloured marker on the ribbon
    const L0 = scene.compose(ctx, false);
    return L0.linkClear ? L0 : scene.compose(ctx, true);
  },
  compose(ctx, linkInStrip) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const B = SIZE[shape];
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const link = linkOf(p.relationships);
    const linked = Boolean(link);
    const looks = looksOf(ctx, p);
    let arrangement = shape === 'portrait' ? 'column' : 'row';
    const gap = arrangement === 'row' ? 44 : 20;
    // width of the scene column when the scenes are stacked (the whole width, or what a side strip leaves)
    let colW = D.w - 16, sideW = 0;
    const laneA = th.accent2, laneB = th.accent3;
    const small = B * 0.8;

    // ---- headers (letter badge + label + caption), fitted to the scene width
    // HB: size of the header and guide text (B; the small size only when the text is too dense)
    let HB = B;
    const labO = (color, name) => ({anchor: 'start', size: HB, minSize: small, maxLines: 2, fill: th.card, stroke: color, color: th.ink, weight: 700, name: `${name}-lab`});
    const capO = name => ({anchor: 'start', size: HB, minSize: small, maxLines: 3, fill: 'none', stroke: 'none', color: th.fgSoft, weight: 500, padY: 2, name: `${name}-cap`});
    // A and B headers get equal weight: the same text size and the same number of lines for the label
    // and for the caption (the shorter one wraps at a narrower width), so both cards are equally tall
    const headerSpec = w => {
      const R = B * 0.95, full = w - R * 2 - 12;
      const spec = [{}, {}];
      const pair = (texts, mk, key) => {
        if (texts.some(t => !t)) return;
        const probe = (t, wd, sz) => wchip(ctx, t, {...mk, x: 0, y: 0, maxWidth: wd, size: sz ?? mk.size}).fit;
        const f0 = texts.map(t => probe(t, full));
        const size = Math.min(...f0.map(q => q.size));
        const fs = texts.map(t => probe(t, full, size));
        const n = Math.max(...fs.map(q => q.lines.length));
        texts.forEach((t, i) => {
          let wd = full;
          if (fs[i].lines.length < n) {
            for (let k = 0.97; k >= 0.3; k -= 0.03) {
              const q = probe(t, full * k, size);
              if (q.truncated || !wordSafe(q)) break;
              if (q.lines.length === n) { wd = full * k; break; }
              if (q.lines.length > n) break;
            }
          }
          spec[i][key] = {w: wd, size};
        });
      };
      if (showKey) pair([p.scenarioA.label, p.scenarioB.label], labO('', 'x'), 'lab');
      if (showAll) pair([p.scenarioA.caption, p.scenarioB.caption], capO('x'), 'cap');
      return spec;
    };
    const header = (letter, sc, color, x, y, w, name, sp = {}) => {
      const R = B * 0.95;
      const lab = showKey ? wchip(ctx, sc.label, {...labO(color, name), x: x + R * 2 + 12, y, maxWidth: sp.lab?.w ?? w - R * 2 - 12, size: sp.lab?.size ?? HB}) : null;
      const capY = lab ? lab.box.y + lab.box.h + 6 : y;
      const cap = showAll && sc.caption ? wchip(ctx, sc.caption, {...capO(name), x: x + R * 2 + 12, y: capY, maxWidth: sp.cap?.w ?? w - R * 2 - 12, size: sp.cap?.size ?? HB}) : null;
      const hh = Math.max(R * 2, (cap ? cap.box.y + cap.box.h : lab ? lab.box.y + lab.box.h : y + R * 2) - y);
      const badge = g({name: `${name}-badge`},
        h('circle', {cx: x + R, cy: y + R, r: R, fill: color, stroke: th.ink, 'stroke-width': 2.5}),
        showKey ? h('text', {x: x + R, y: y + R + B * 0.36, 'text-anchor': 'middle', 'font-size': B, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter) : null);
      return {badge, lab, cap, h: hh, fits: (!lab || (!lab.fit.truncated && wordSafe(lab.fit))) && (!cap || (!cap.fit.truncated && wordSafe(cap.fit)))};
    };

    // ---- shared strip: cast, same facts (form, counter, supplied facts), changed fact, key, neutral note
    const strip = (x0, y0, w, SZ = B) => {
      const items = [];
      let x = x0, y = y0, rowH = 0;
      const place = (make, gapX = 12) => {
        let it = make(x, y);
        if (x > x0 && it.box.x + it.box.w > x0 + w) { x = x0; y += rowH + 10; rowH = 0; it = make(x, y); }
        items.push(it);
        x = it.box.x + it.box.w + gapX;
        rowH = Math.max(rowH, it.box.h);
        return it;
      };
      const newRow = () => { if (x > x0) { x = x0; y += rowH + 12; rowH = 0; } };
      const out = {cast: [], facts: [], changed: null, key: null, neutral: null};
      if (showKey) {
        const R0 = SZ * 0.95, third = (w - 2 * 22) / 3 - R0 * 2 - 6;
        const oneRow = ['client', 'representative', 'clerk'].every(id => { const q = wchip(ctx, captionOf(p, id), {x: 0, y: 0, anchor: 'start', maxWidth: third, size: SZ, minSize: SZ, maxLines: 2}).fit; return !q.truncated && wordSafe(q); });
        const castW = oneRow ? third : Math.min(w, 560) - R0 * 2 - 6;
        for (const [i, id] of ['client', 'representative', 'clerk'].entries()) {
          const look = [looks.client, looks.representative, looks.clerk][i];
          out.cast.push(place((px, py) => {
            const R = SZ * 0.95;
            const c = wchip(ctx, captionOf(p, id), {x: px + R * 2 + 6, y: py, anchor: 'start', maxWidth: castW, size: SZ, minSize: small, maxLines: 3, name: `cast-${id}`});
            const cy = c.box.y + c.box.h / 2;
            const pb = personBadge(ctx, {name: `castb-${id}`, x: px + R, y: cy, radius: R, look});
            return {node: g(null, pb.node, c.node), box: {x: px, y: py, w: c.box.x + c.box.w - px, h: Math.max(c.box.h, R * 2)}, fit: c.fit};
          }, 22));
        }
      }
      const keyMk = (px, py) => keyChip(ctx, ctx.t.key, {x: px, y: py, maxWidth: w, size: small, maxLines: 2, name: 'key'});
      const tryKey = force => { if (showKey && !out.key && (force || x + keyMk(0, 0).box.w <= x0 + w)) out.key = place(keyMk); };
      if (showAll) {
        newRow();
        const facts = [`${p.props.document} · ${p.props.documentId}`, p.props.counterSign, ...p.sharedFacts].filter(Boolean);
        out.factsHead = place((px, py) => wchip(ctx, ctx.t.sameFacts, {x: px, y: py, anchor: 'start', maxWidth: w, size: small, minSize: small, maxLines: 1, fill: 'none', stroke: 'none', color: th.fgSoft, weight: 700, padX: 4, name: 'facts-head'}), 4);
        facts.forEach((f, i) => out.facts.push(place((px, py) => wchip(ctx, f, {x: px, y: py, anchor: 'start', maxWidth: w, size: SZ, minSize: small, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: `fact${i}`}))));
        newRow();
        out.changed = place((px, py) => wchip(ctx, `${ctx.t.changedFact}: ${p.changedFact}`, {x: px, y: py, anchor: 'start', maxWidth: w, size: SZ, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent, color: th.ink, weight: 700, name: 'changed'}));
        tryKey(false);
        if (linkInStrip && linked && link.label) {
          out.linkStrip = place((px, py) => {
            const RR = SZ * 0.45;
            const c = wchip(ctx, link.label, {x: px + RR * 2 + 8, y: py, anchor: 'start', maxWidth: w - RR * 2 - 8, size: SZ, minSize: small, maxLines: 3, fill: th.card, stroke: laneB, color: th.ink, weight: 600, name: 'link-strip-chip'});
            return {node: g({name: 'link-strip', opacity: 0}, h('circle', {cx: r(px + RR), cy: r(c.box.y + c.box.h / 2), r: r(RR), fill: laneB, stroke: th.ink, 'stroke-width': 2}), c.node), box: {x: px, y: py, w: c.box.x + c.box.w - px, h: c.box.h}, fit: c.fit};
          });
        }
      }
      tryKey(!(showAll && p.comparisonLabels.neutral));
      if (showAll && p.comparisonLabels.neutral) {
        newRow();
        out.neutral = place((px, py) => wchip(ctx, p.comparisonLabels.neutral, {x: px, y: py, anchor: 'start', maxWidth: w, size: SZ, minSize: small, maxLines: 3, fill: th.card, stroke: th.ink, color: th.ink, weight: 500, name: 'neutral'}));
      }
      tryKey(true);
      const bottom = items.length ? Math.max(...items.map(it => it.box.y + it.box.h)) : y0;
      return {...out, items, h: bottom - y0, SZ};
    };

    // ---- geometry: headers take half the frame (row) or its width (column), whatever the scene scale;
    // the two scenes get what the headers, guide band and strip leave. 1:1 uses the depth composition of
    // each scene (counter at the back, taller) when it still keeps each scene ≥ 42 % of the width.
    // the guide label sits on the bracket's line, so the guide band is just the label's height
    const guideHOf = () => {
      const gp = showAll && p.comparisonLabels.guide ? wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: arrangement === 'row' ? (D.w - 16) * 0.5 : colW, size: HB, minSize: small, maxLines: 2, weight: 700}) : null;
      return gp ? gp.box.h + 12 : 16;
    };
    let guideH = guideHOf();
    let hdrW = arrangement === 'row' ? (D.w - 16 - gap) / 2 : colW;
    let hSpec = headerSpec(hdrW);
    let hdrA = header('A', p.scenarioA, laneA, 0, 0, hdrW, 'hA', hSpec[0]);
    let hdrB = header('B', p.scenarioB, laneB, 0, 0, hdrW, 'hB', hSpec[1]);
    const geo = {hdrH: Math.max(hdrA.h, hdrB.h) + 10};
    let st = strip(8, 0, D.w - 16);
    const fitFor = f => {
      // stacked scenes crop a little more of the empty wall above the heads
      const tY = f === FLAT ? (arrangement === 'column' ? TOP + 45 : TOP) : DEPTH_TOP;
      const sw = f === FLAT ? ST.W : DEPTH_W, sh = -tY + 14;
      const sc = arrangement === 'row'
        ? Math.min((D.w - 16 - gap) / (2 * sw), (D.h - 12 - geo.hdrH - guideH - st.h - 14) / sh)
        : Math.min(colW / sw, (D.h - 12 - 2 * geo.hdrH - gap - guideH - (sideW ? 0 : st.h + 10)) / (2 * sh));
      return {far: f, topY: tY, SW: sw, SH: sh, s: sc, frac: (sw * sc) / D.w};
    };
    // the composition (flat side view or depth) that gives the largest scenes wins, as long as each
    // scene keeps >= 42 % of the width side by side (full width when stacked); dense text first drops
    // the shared strip to the minimum size
    const minFrac = arrangement === 'row' ? 0.4 : 0.9; // "each scene >= ~40 % of the width"
    const area = q => q.s * q.s * q.SW * q.SH;
    const choose = () => {
      const opts = [fitFor(FLAT), ...(arrangement === 'row' ? [fitFor(DEPTH)] : [])];
      const okOpts = opts.filter(q => q.frac >= minFrac);
      return (okOpts.length ? okOpts : opts).reduce((a, b) => (area(b) > area(a) ? b : a));
    };
    let pick = choose();
    const shareOk = q => arrangement !== 'row' || (q.s * q.SH) / D.h >= 0.42;
    if (pick.frac < minFrac || !shareOk(pick)) {
      const st2 = strip(8, 0, D.w - 16, small);
      const keep = st;
      st = st2;
      const p2 = choose();
      // the smaller strip is only used when it is what makes the scenes large enough
      if (p2.frac >= minFrac && shareOk(p2) && area(p2) > area(pick)) pick = p2;
      else if (p2.frac < minFrac || !shareOk(p2)) {
        // still too dense: every text block (headers, guide, strip) at the small size, which is still
        // >= the 16 px floor; the composition with the largest scenes wins
        HB = small;
        guideH = guideHOf();
        hSpec = headerSpec(hdrW);
        hdrA = header('A', p.scenarioA, laneA, 0, 0, hdrW, 'hA', hSpec[0]);
        hdrB = header('B', p.scenarioB, laneB, 0, 0, hdrW, 'hB', hSpec[1]);
        geo.hdrH = Math.max(hdrA.h, hdrB.h) + 10;
        pick = choose();
        geo.dense = true;
      } else st = keep;
    }
    // 1:1 with text too dense for the scenes side by side: the shared strip moves to a right-hand column
    // (smallest width that holds it) and the two scenes stack in the rest, as LAW-0143 does at 1:1; used
    // only when it gives each scene a larger picture than the dense row, with each scene >= 40 % of the width
    if (shape === 'square' && (pick.frac < minFrac || !shareOk(pick))) {
      const rowPick = pick, rowArea = area(pick);
      for (let cw = 440; cw <= 820; cw += 20) {
        const st2 = strip(0, 0, cw, small);
        if (st2.h > D.h - 12 || st2.items.some(it => it.fit && (it.fit.truncated || !wordSafe(it.fit)))) continue;
        const keep = {arrangement, colW, sideW, hdrW, hSpec, hdrA, hdrB, hdrH: geo.hdrH, guideH, st};
        arrangement = 'column'; sideW = cw; colW = D.w - 16 - cw - 24; hdrW = colW; st = st2;
        guideH = guideHOf();
        hSpec = headerSpec(hdrW);
        hdrA = header('A', p.scenarioA, laneA, 0, 0, hdrW, 'hA', hSpec[0]);
        hdrB = header('B', p.scenarioB, laneB, 0, 0, hdrW, 'hB', hSpec[1]);
        geo.hdrH = Math.max(hdrA.h, hdrB.h) + 10;
        const q = fitFor(FLAT);
        if (area(q) > rowArea && q.frac >= 0.4) { pick = q; geo.sideStrip = cw; }
        else { ({arrangement, colW, sideW, hdrW, hSpec, hdrA, hdrB, guideH, st} = keep); geo.hdrH = keep.hdrH; pick = rowPick; }
        break;
      }
    }
    const {far, topY, SW, SH, s} = pick;
    const stageW = SW * s, stageH = SH * s;
    const panels = [];
    if (arrangement === 'row') {
      const half = (D.w - 16 - gap) / 2;
      const total = geo.hdrH + stageH + guideH + st.h + 14;
      const y0 = Math.max(6, (D.h - total) / 2);
      for (let i = 0; i < 2; i++) panels.push({x: 8 + i * (half + gap) + (half - stageW) / 2, hx: 8 + i * (half + gap), hy: y0, y: y0 + geo.hdrH});
      geo.guideY = y0 + geo.hdrH + stageH + 4;
      geo.stripY = geo.guideY + guideH + 10;
    } else {
      const x0 = 8 + (colW - stageW) / 2;
      const total = 2 * (geo.hdrH + stageH) + gap + guideH + (sideW ? 0 : st.h + 10);
      const y0 = Math.max(6, (D.h - total) / 2);
      panels.push({x: x0, hx: 8, hy: y0, y: y0 + geo.hdrH});
      panels.push({x: x0, hx: 8, hy: y0 + geo.hdrH + stageH + gap, y: y0 + 2 * geo.hdrH + stageH + gap});
      geo.guideY = panels[1].y + stageH + 4;
      geo.stripY = geo.guideY + guideH + 10;
    }
    // floor line of each panel (stage origin); stage content spans TOP..14
    const floorY = i => panels[i].y + (-topY) * s;
    const Mi = (i, q) => ({x: panels[i].x + q.x * s, y: floorY(i) + q.y * s});
    hdrA = header('A', p.scenarioA, laneA, panels[0].hx, panels[0].hy, hdrW, 'hA', hSpec[0]);
    hdrB = header('B', p.scenarioB, laneB, panels[1].hx, panels[1].hy, hdrW, 'hB', hSpec[1]);
    st = sideW ? strip(D.w - 8 - sideW, Math.max(6, (D.h - st.h) / 2), sideW, st.SZ) : strip(8, geo.stripY, D.w - 16, st.SZ);

    const mkStage = (prefix, plan, lk) => repStage(ctx, {
      prefix, looks, plan, linked: lk, doc: {title: p.props.document, id: p.props.documentId}, docSize: 20, docMin: 16,
      sign: p.props.counterSign, signSize: 20, showText: showAll, docText: false, signText: false, top: far === FLAT ? topY : DEPTH_TOP, ribbonColor: laneB, far, width: SW,
    });
    const stA = mkStage('a', 'own', false);
    const stB = mkStage('b', 'represented', linked);
    const endA = stA.pose(choreo('own', 1, {linked: false, far}));
    const endB = stB.pose(choreo('represented', 1, {linked, far}));

    // ---- bubbles above/left of each performer's head; link tag under B's ribbon
    const occupied = [...[0, 1].map(i => ({x: panels[i].x, y: panels[i].hy, w: stageW, h: geo.hdrH - 6}))];
    const stageBox = i => ({x: panels[i].x, y: panels[i].y + 2, w: stageW, h: stageH});
    const inside = (b, q) => b.x >= q.x && b.y >= q.y && b.x + b.w <= q.x + q.w && b.y + b.h <= q.y + q.h;
    const bub = (i, end, key, text, name, avoid, SZ = B) => {
      const kP = far.k;
      const mouth = Mi(i, end.mouth[key]);
      const head = Mi(i, end.tops[key]);
      const hc = Mi(i, end.heads[key]);
      const mw = stageW * 0.46;
      const wide = stageW * 0.72;
      const cands = [
        // above the head, tail down to the top of the head
        bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 3, x: hc.x, anchor: 'middle', bottom: head.y - 6 * s * kP, tip: {x: hc.x - 4, y: head.y + 4 * s * kP}, maxWidth: mw}),
        bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 3, x: hc.x + 20 * s, anchor: 'end', bottom: head.y - 6 * s * kP, tip: {x: hc.x - 4, y: head.y + 4 * s * kP}, maxWidth: mw}),
        // above the head, reaching toward the counter side (over the wall / sign, clear of a link label behind)
        bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 3, x: hc.x - 30 * s * kP, anchor: 'start', bottom: head.y - 6 * s * kP, tip: {x: hc.x + 4, y: head.y + 4 * s * kP}, maxWidth: mw}),
        bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 2, x: hc.x - 30 * s * kP, anchor: 'start', bottom: head.y - 6 * s * kP, tip: {x: hc.x + 4, y: head.y + 4 * s * kP}, maxWidth: wide}),
        // beside the head: behind it, or in front of it over the (decorative) form in the tray
        bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 2, x: hc.x + 20 * s, anchor: 'end', bottom: head.y - 6 * s * kP, tip: {x: hc.x - 4, y: head.y + 4 * s * kP}, maxWidth: wide}),
        ...[20, 50, -10, 90, 150, 210].flatMap(dy => [
          bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 3, x: hc.x - 50 * s * kP, anchor: 'end', bottom: hc.y + dy * s * kP, tip: {x: hc.x - 36 * s * kP, y: hc.y}, maxWidth: mw}),
          bubble(ctx, {name, text, size: SZ, minSize: small, maxLines: 3, x: hc.x + 50 * s * kP, anchor: 'start', bottom: hc.y + dy * s * kP, tip: {x: hc.x + 40 * s * kP, y: mouth.y}, maxWidth: mw}),
        ]),
      ];
      const room = {x: panels[i].x, y: panels[i].hy, w: stageW, h: stageH + geo.hdrH};
      const ok = cands.filter(b => inside(b.box, room) && !avoid.some(q => hit(b.box, q, 6)));
      if (ok[0]) return ok[0];
      if (SZ > small) return bub(i, end, key, text, name, avoid, small);
      return cands.reduce((best, b) => {
        const cost = avoid.reduce((a, q) => a + (hit(b.box, q, 6) ? 1 : 0), 0) + (inside(b.box, stageBox(i)) ? 0 : 0.5);
        return !best || cost < best.cost ? {b, cost} : best;
      }, null).b;
    };
    // people who do not speak (their heads and bodies) must stay visible
    const figBox = (i, x, k = 1, yb = 0) => {
      // the whole body of a person who does not speak (head to feet)
      const q = Mi(i, {x: x - 55 * k, y: yb - 425 * k});
      return {x: q.x, y: q.y, w: 110 * k * s, h: 425 * k * s};
    };
    const tableBox = i => { const q = Mi(i, {x: ST.table.x - ST.table.w / 2 - 6, y: ST.table.top - 8}); return {x: q.x, y: q.y, w: (ST.table.w + 12) * s, h: (-ST.table.top + 8) * s}; };
    const perfBox = (i, key) => {
      const sp = farPt(far, {x: ST.standX, y: 0});
      return figBox(i, sp.x, far.k, sp.y);
    };
    const clerkHead = i => { const q = Mi(i, farPt(far, {x: ST.clerkX - 45, y: ST.clerkHip - 230})); return {x: q.x, y: q.y, w: 100 * far.k * s, h: 110 * far.k * s}; };
    const hdrBox = i => ({x: panels[i].hx, y: panels[i].hy, w: hdrW, h: geo.hdrH - 8});
    const avoidA = [figBox(0, ST.repX0), clerkHead(0), hdrBox(0)];
    const avoidB = [figBox(1, ST.clientX), clerkHead(1), hdrBox(1)];
    // the ribbon itself (quadratic through its drawn midpoint): B's bubble never sits on it
    const ribbonObs = [];
    if (linked && endB.semantic.linked) {
      const a0 = Mi(1, endB.semantic.reel), b0 = Mi(1, endB.semantic.clip), m0 = Mi(1, endB.ribbonMid);
      const c0 = {x: 2 * m0.x - (a0.x + b0.x) / 2, y: 2 * m0.y - (a0.y + b0.y) / 2};
      for (let i = 1; i < 12; i++) {
        const t = i / 12, u1 = 1 - t;
        const q = {x: u1 * u1 * a0.x + 2 * t * u1 * c0.x + t * t * b0.x, y: u1 * u1 * a0.y + 2 * t * u1 * c0.y + t * t * b0.y};
        ribbonObs.push({x: q.x - 9, y: q.y - 9, w: 18, h: 18});
      }
    }
    const linkAvoid = [figBox(1, ST.clientX), perfBox(1), tableBox(1), clerkHead(1), hdrBox(1)];
    let linkTag = null, linkClear = true;
    if (linked && link.label && showKey && linkInStrip) {
      // the label is in the shared strip; a matching marker sits on B's ribbon
      const mid = Mi(1, endB.ribbonMid);
      const RR = small * 0.45;
      linkTag = {node: g({name: 'link-tag', opacity: 0}, h('circle', {cx: r(mid.x), cy: r(mid.y), r: r(RR), fill: laneB, stroke: th.ink, 'stroke-width': 2.5})), box: {x: mid.x - RR, y: mid.y - RR, w: RR * 2, h: RR * 2}, fit: null};
    } else if (linked && link.label && showKey) {
      const mid = Mi(1, endB.ribbonMid);
      // the tag hangs from the ribbon in free space: above it (between the two heads) or below it,
      // never over the people, the table or the counter
      const cands = [];
      for (const f of [0.5, 0.62, 0.74, 0.4]) {
        const mw = stageW * f;
        for (const dy of [30, 60, 100, -30, -70, -110]) {
          for (const dx of [0, -40, 40, -80]) {
            const probe = wchip(ctx, link.label, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: B, minSize: small, maxLines: 3});
            if (probe.fit.truncated || !wordSafe(probe.fit)) continue;
            const lx = clamp(mid.x + dx * s, panels[1].x + probe.box.w / 2 + 4, panels[1].x + stageW - probe.box.w / 2 - 4);
            const ly = dy < 0 ? mid.y + dy * s - probe.box.h : mid.y + dy * s;
            cands.push(wchip(ctx, link.label, {x: lx, y: ly, anchor: 'middle', maxWidth: mw, size: B, minSize: small, maxLines: 3, fill: th.card, stroke: laneB, color: th.ink, weight: 600, name: 'link-chip'}));
          }
        }
      }
      const room = {x: panels[1].x, y: panels[1].y, w: stageW, h: stageH};
      const c = cands.find(q => q.box.x >= room.x && q.box.y >= room.y && q.box.x + q.box.w <= room.x + room.w && q.box.y + q.box.h <= room.y + room.h && !linkAvoid.some(o => hit(q.box, o, 4)));
      // no clear spot in the scene: the second pass puts the label in the shared strip
      linkClear = Boolean(c);
      if (c) {
      const b = c.box;
      linkTag = {node: g({name: 'link-tag', opacity: 0},
        h('path', {d: `M${r(clamp(mid.x, b.x + 14, b.x + b.w - 14))} ${r(mid.y < b.y ? b.y : b.y + b.h)}L${r(mid.x)} ${r(mid.y)}`, stroke: laneB, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}),
        h('circle', {cx: r(mid.x), cy: r(mid.y), r: 6, fill: laneB, stroke: th.ink, 'stroke-width': 2}), c.node), box: b, fit: c.fit};
      }
    }
    // B's bubble also keeps clear of the link label (with a gap, so the two callouts never touch), its pin,
    // its leader and the ribbon itself (the ribbon's middle is where the label anchors)
    const linkObs = [...ribbonObs];
    if (linked && endB.semantic.linked) {
      const m0 = Mi(1, endB.ribbonMid);
      linkObs.push({x: m0.x - 14, y: m0.y - 14, w: 28, h: 28});
      if (linkTag) {
        const lb = linkTag.box;
        linkObs.push({x: lb.x - 12, y: lb.y - 12, w: lb.w + 24, h: lb.h + 24});
        const lx = clamp(m0.x, lb.x + 14, lb.x + lb.w - 14), ly = m0.y < lb.y ? lb.y : lb.y + lb.h;
        for (let i = 1; i < 8; i++) linkObs.push({x: lx + ((m0.x - lx) * i) / 8 - 5, y: ly + ((m0.y - ly) * i) / 8 - 5, w: 10, h: 10});
      }
    }
    const avoidBL = [...linkObs, ...avoidB];
    const bubA = bub(0, endA, 'client', p.props.speech.a, 'bubA', avoidA);
    const bubB = bub(1, endB, 'rep', p.props.speech.b, 'bubB', avoidBL);
    const bubVsLink = !linkObs.some(o => hit(bubB.box, o, 0));
    const bubbleClear = !avoidA.some(o => hit(bubA.box, o, 0)) && !avoidBL.some(o => hit(bubB.box, o, 0));

    // ---- guide: rings round the person at each counter, joined by a bracket below the scenes
    const standP = farPt(far, {x: ST.standX, y: 0});
    const ringOf = i => {
      const k = far.k;
      const q = {x: standP.x - 78 * k, y: standP.y - 440 * k, w: 156 * k, h: 452 * k};
      return {x: panels[i].x + q.x * s, y: floorY(i) + q.y * s, w: q.w * s, h: q.h * s};
    };
    const rA = ringOf(0), rB = ringOf(1);
    const rings = [rA, rB].map((q, i) => h('path', {name: `ring${i}`, d: roundRectPath(q.x, q.y, q.w, q.h, 22 * s), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0}));
    let bracketD;
    const gy = geo.guideY + guideH / 2;
    if (arrangement === 'row') {
      const ax = rA.x + rA.w / 2, bx = rB.x + rB.w / 2;
      bracketD = `M${r(ax)} ${r(rA.y + rA.h)}V${r(gy)}H${r(bx)}V${r(rB.y + rB.h)}`;
    } else {
      const ex = Math.min(8 + colW, panels[0].x + stageW + 2);
      bracketD = `M${r(rA.x + rA.w)} ${r(rA.y + rA.h * 0.5)}H${r(ex)}V${r(rB.y + rB.h * 0.5)}H${r(rB.x + rB.w)}`;
    }
    const ex0 = Math.min(8 + colW, panels[0].x + stageW + 2);
    const bLen = arrangement === 'row'
      ? Math.abs(rB.x - rA.x) + Math.abs(gy - rA.y - rA.h) + Math.abs(gy - rB.y - rB.h)
      : (ex0 - rA.x - rA.w) + Math.abs(rB.y - rA.y) + (ex0 - rB.x - rB.w);
    const bracket = h('path', {name: 'bracket', d: bracketD, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': `${r(bLen)} ${r(bLen + 10)}`, 'stroke-dashoffset': r(bLen), opacity: 0});
    let guideLabel = null;
    if (showAll && p.comparisonLabels.guide) {
      const gx = arrangement === 'row' ? (rA.x + rA.w / 2 + rB.x + rB.w / 2) / 2 : D.w / 2;
      guideLabel = wchip(ctx, p.comparisonLabels.guide, {x: gx, y: geo.guideY + 6, anchor: 'middle', maxWidth: arrangement === 'row' ? Math.max(Math.abs(rB.x - rA.x) - 40, (D.w - 16) * 0.5) : D.w - 16, size: HB, minSize: small, maxLines: 2, fill: th.card, stroke: th.accent, color: th.ink, weight: 700, name: 'guide-label'});
      if (arrangement === 'column') {
        // tall boxes: the label sits in the band under scene B, the bracket runs along the right edge
        guideLabel = wchip(ctx, p.comparisonLabels.guide, {x: 8 + colW, y: geo.guideY + 2, anchor: 'end', maxWidth: colW, size: HB, minSize: small, maxLines: 2, fill: th.card, stroke: th.accent, color: th.ink, weight: 700, name: 'guide-label'});
      }
    }

    const fits = [hdrA.lab, hdrA.cap, hdrB.lab, hdrB.cap, bubA, bubB, linkTag, guideLabel, ...st.items].filter(Boolean).map(x => x.fit).filter(Boolean);
    const truncated = fits.filter(f => f.truncated || !wordSafe(f)).map(f => f.full);
    return {bubVsLink, sideStrip: geo.sideStrip || 0, dense: Boolean(geo.dense), hdrH0: geo.hdrH, guideH0: guideH, s, topY, far, bLen, bubbleClear, linkClear, arrangement, panels, stageW, stageH, Mi, stA, stB, hdrA, hdrB, st, bubA, bubB, linkTag, rings, bracket, guideLabel, linked, truncated};
  },
  build(ctx, L) {
    const stageG = (st, i) => g({transform: T(L.panels[i].x, L.panels[i].y + (-L.topY) * L.s, 0, L.s)}, st.node);
    const hdr = (hd, name) => g({name}, hd.badge, hd.lab && g({name: `${name}-labg`, opacity: 0}, hd.lab.node), hd.cap && g({name: `${name}-capg`, opacity: 0}, hd.cap.node));
    const st = L.st;
    return g(null,
      stageG(L.stA, 0), stageG(L.stB, 1),
      hdr(L.hdrA, 'hdrA'), hdr(L.hdrB, 'hdrB'),
      L.rings, L.bracket,
      L.bubA.node, L.bubB.node,
      L.linkTag && L.linkTag.node,
      L.guideLabel && g({name: 'guide-label-g', opacity: 0}, L.guideLabel.node),
      st.cast.map(c => c.node), st.factsHead && st.factsHead.node, st.facts.map(f => f.node),
      st.changed && g({name: 'changed-g', opacity: 0}, st.changed.node),
      st.linkStrip && st.linkStrip.node,
      st.key && st.key.node,
      st.neutral && g({name: 'neutral-g', opacity: 0}, st.neutral.node),
    );
  },
  frame(ctx, L, u) {
    const c = clamp((u - C0) / (C1 - C0));
    const vA = choreo('own', c, {linked: false, reduced: ctx.reduced, far: L.far});
    const vB = choreo('represented', c, {linked: L.linked, reduced: ctx.reduced, far: L.far});
    const pA = L.stA.pose(vA), pB = L.stB.pose(vB);
    const nodes = {...pA.nodes, ...pB.nodes};
    const sg = w => r(seg(u, ...W[w]), 3);
    for (const hd of ['hdrA', 'hdrB']) {
      const H = hd === 'hdrA' ? L.hdrA : L.hdrB;
      if (H.lab) nodes[`${hd}-labg`] = {opacity: sg('labels')};
      if (H.cap) nodes[`${hd}-capg`] = {opacity: sg('labels')};
    }
    if (L.st.changed) nodes['changed-g'] = {opacity: sg('changed')};
    const bubOn = () => r(clamp((c - 0.76) / 0.04), 3);
    nodes.bubA = {opacity: bubOn()};
    nodes.bubB = {opacity: bubOn()};
    if (L.linkTag) nodes['link-tag'] = {opacity: sg('tags')};
    if (L.st.linkStrip) nodes['link-strip'] = {opacity: sg('tags')};
    nodes.ring0 = {opacity: sg('rings')};
    nodes.ring1 = {opacity: sg('rings')};
    const bp = seg(u, ...W.bracket);
    nodes.bracket = {opacity: bp > 0 ? 1 : 0, 'stroke-dashoffset': r(L.bLen * (1 - bp), 1)};
    if (L.guideLabel) nodes['guide-label-g'] = {opacity: sg('guideLabel')};
    if (L.st.neutral) nodes['neutral-g'] = {opacity: sg('neutral')};
    const look = (sem, v) => ({
      hands: [sem.handC, sem.handR, sem.handK], sheet: sem.sheet, sheetScale: sem.sheetScale, sheetUnfold: sem.sheetUnfold, docAt: sem.docAt,
      clip: sem.clip, clipAt: sem.clipAt, linked: sem.linked, clientX: sem.clientX, repX: sem.repX, facing: sem.repFacing,
      label: u >= W.labels[0] ? 1 : 0, mouth: [v.client.mouth, v.rep.mouth],
    });
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const performer = (sem, key) => (key === 'client' ? sem.clientX : sem.repX);
    return {
      nodes,
      semantic: {
        beat,
        clock: r(c, 4),
        scenes: 2,
        arrangement: L.sideStrip ? 'column-strip' : L.arrangement,
        stageFraction: r(L.stageW / ctx.design.w, 3),
        sceneShareH: r(L.stageH / ctx.design.h, 3),
        denseText: L.dense,
        textBands: {header: r(L.hdrH0 || 0), strip: r(L.st.h), guide: r(L.guideH0 || 0), design: [r(ctx.design.w), r(ctx.design.h)]},
        composition: L.far.k === 1 ? 'flat' : 'depth',
        bubbleClear: L.bubbleClear,
        bubbleClearOfLink: L.bubVsLink,
        linkClear: L.linkClear,
        linkInStrip: Boolean(L.st.linkStrip),
        lookA: look(pA.semantic, vA),
        lookB: look(pB.semantic, vB),
        a: {...pA.semantic, performerX: performer(pA.semantic, 'client')},
        b: {...pB.semantic, performerX: performer(pB.semantic, 'rep')},
        // top-level tracked points (continuity / attachment checks)
        sheetA: pA.semantic.sheet, sheetB: pB.semantic.sheet, handCA: pA.semantic.handC, edgeLA: pA.semantic.edgeL,
        handCB: pB.semantic.handC, handRB: pB.semantic.handR, edgeLB: pB.semantic.edgeL, edgeRB: pB.semantic.edgeR, clipB: pB.semantic.clip, badgeB: pB.semantic.badge,
        handKA: pA.semantic.handK, handKB: pB.semantic.handK, edgeRA: pA.semantic.edgeR,
        changedShown: L.st.changed ? sg('changed') : 0,
        guide: r(bp, 3),
        neutralShown: L.st.neutral ? sg('neutral') : 0,
        allReached: pA.semantic.allReached && pB.semantic.allReached,
        truncated: L.truncated,
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
    slug: 'roles-05-contrast',
    title: 'Representing a party — own action vs represented action',
    titleEs: 'Representación de una parte — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Representación de una parte',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical office scenes on the same clock. In A (own action) the client picks the form up and hands it over at the counter; in B (represented action) the client clips a ribbon to the representative (the supplied link), hands over the form, and the representative walks to the counter and hands it over. Rings and a bracket mark the person at each counter; shared facts and a neutral note; no winner, outcome or validity.',
    tags: ['representation', 'own action', 'represented action', 'comparison', 'ribbon', 'link', 'counter', 'form', 'walk', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/representacion-de-una-parte.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/badges.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
