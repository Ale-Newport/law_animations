/**
 * LAW-0091 — Distinción de casos · contrast
 *
 * Storyboard (two complete, identical pin boards; no hands — the magnifier is
 * an instrument that moves over each board in lockstep):
 *  0.00–0.17 base      Two identical boards. On each, two case strips lie
 *                      across a horizontal seam — the earlier case above, the
 *                      new case below, one COLUMN per supplied fact; the two
 *                      pictogram tokens of a column face each other across the
 *                      seam. A rule card (text as supplied) hangs an empty
 *                      bulldog clip on a string; the magnifier rests over the
 *                      clip. One cell of the new strip is covered by a pinned
 *                      paper flap in BOTH boards, so nothing differs yet. A
 *                      shared legend below names the facts once.
 *  0.17–0.40 change    The same cell is ringed on both boards and the flaps
 *                      peel back: in A the cell is an EMPTY socket (the fact is
 *                      recorded only in the earlier case → a distinguishing
 *                      fact is present); in B the same token sits there (the
 *                      fact is recorded in both → no distinguishing fact).
 *                      That is the only difference (tags "Not recorded" /
 *                      "Recorded" while it is introduced).
 *  0.40–0.77 parallel  Both magnifiers leave the clip at the same instant and
 *                      slide along the seam column by column, frame for frame
 *                      identical; a chain link snaps across every matching
 *                      column. At the changed column A's link breaks, B's
 *                      closes. A: the magnifier returns to that column, presses
 *                      onto the token, lifts it (it rides in the glass),
 *                      carries it to the clip and drops it; the jaws close.
 *                      B: the magnifier goes to the clip, which stays empty and
 *                      open. Both magnifiers then settle over the changed
 *                      column, their glass showing it enlarged.
 *  0.77–1.00 guide     Status tags under the clips (A "Distinguishing fact ·
 *                      as supplied", B "No distinguishing fact"), a comparison
 *                      guide joining the two magnified columns with the
 *                      changed-fact label, and a neutral note. No winner, score
 *                      or outcome; the rule is never applied.
 * Layouts: 16:9 and 1:1 boards side by side (the guide runs under both
 * boards); 9:16 boards stacked (the guide runs straight down from lens A to
 * lens B; the scenario headers and the strip labels step aside from its
 * column).
 * Legal content: fictional facts, illustrative rule text as supplied,
 * jurisdiction unspecified; the comparison invents no legal consequence.
 * @module animations/reasoning/LAW-0091
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {stateTag} from '../causation/kits/place.js';
import {
  reasoningFields, DC_STRINGS, resolveFacts, dcColors, corkBoard, boardFrame, corkCopy, stripGeometry, stripPaper, pairTokens, pairFrame,
  ruleCard, factToken, coverFlap, freeLens, hangingClip, pushPin, wrapTag,
} from './kits/distincion-de-casos.js';

const ID = 'LAW-0091';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  legend: [0.02, 0.12], ring: [0.18, 0.24], peel: [0.22, 0.32], changeTag: [0.3, 0.35], changeTagOut: [0.395, 0.425], changeLine: [0.3, 0.38],
  depart: [0.4, 0.44], scan: [0.44, 0.6],
  back: [0.6, 0.635], press: [0.635, 0.65], capture: 0.65, carry: [0.65, 0.705], drop: [0.705, 0.72], release: 0.72, close: [0.72, 0.74],
  toClip: [0.6, 0.655], settle: [0.745, 0.785],
  tags: [0.78, 0.84], guide: [0.8, 0.9], note: [0.88, 0.95], foot: [0.9, 0.96],
};
const ZOOM = 1.3;
const P2 = q => ({x: r(q.x), y: r(q.y)});

const STRINGS = {
  en: {...DC_STRINGS.en, recorded: 'Recorded', noDiffShort: 'No distinguishing fact', keptEqual: 'Kept equal', earlierCase: 'Earlier case', newCase: 'New case'},
  es: {...DC_STRINGS.es, recorded: 'Consta', noDiffShort: 'Sin hecho diferenciador', keptEqual: 'Igual en ambos', earlierCase: 'Caso anterior', newCase: 'Caso nuevo'},
};

const sceneSchema = {
  ...reasoningFields,
  ...contrastFields(),
};

const defaultParams = {
  facts: [
    {text: 'Buyer signed the order form', icon: 'document', in: 'both'},
    {text: 'Goods delivered on day 3', icon: 'box', in: 'both'},
    {text: 'Seller sent a written warning', icon: 'letter', in: 'a'},
    {text: 'Price paid in cash', icon: 'coin', in: 'both'},
  ],
  rules: ['Rule R (illustrative), as stated in the earlier case'],
  issues: ['Does the warning matter for rule R?'],
  assumptions: ['Fictional facts; everything else is kept equal'],
  scenarioA: {label: 'Distinguishing fact present', caption: 'The new case does not record the warning'},
  scenarioB: {label: 'Distinguishing fact absent', caption: 'The new case records the same warning'},
  changedFact: 'Only change: whether the new case records the written warning',
  sharedFacts: ['Same facts and order', 'Same rule text', 'Same magnifier path'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Two variants of one fictional example — no outcome is shown'},
};

const SHAPES = {
  landscape: {arr: 'row', label: 32, cap: 24, strip: 25, rule: 24, legend: 25, note: 24, tag: 22, lane: 60, maxR: 58},
  square: {arr: 'row', label: 32, cap: 25, strip: 26, rule: 25, legend: 27, note: 27, tag: 25, lane: 54, maxR: 50},
  portrait: {arr: 'column', label: 31, cap: 21, strip: 24, rule: 23, legend: 24, note: 22, tag: 21, lane: 0, maxR: 50},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1000], portrait: [900, 1440]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const C = dcColors(ctx);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const rowArr = SH.arr === 'row';
    const M = 22;

    // --- facts in the two scenarios: A as supplied, B with the distinguishing fact recorded in both
    const F = resolveFacts(p.facts);
    const k = F.diff;
    const has = k >= 0;
    const FB = has ? {...F, rows: F.rows.map(q => (q.i === k ? {...q, inA: true, inB: true} : q)), diff: -1, side: null} : F;
    const present = has ? F.side : null;
    const absent = has ? (present === 'a' ? 'b' : 'a') : null;

    // --- bottom block (legend, changed-fact line, neutral note, footnotes), measured for the full width
    const bw = D.w - 2 * M;
    // the shared block gives way to the boards: its type shrinks (within a bound) when long texts make it tall
    let bottom;
    for (const sc of [1, 0.92, 0.85]) {
      bottom = bottomBlock(ctx, {F, k, width: bw, SH, rowArr, t, showKey, showAll, scale: sc});
      if (bottom.h <= D.h * (rowArr ? 0.2 : 0.22)) break;
    }

    // --- panel geometry
    // stacked boards: the guide's label sits in the gap between board A and header B
    const guideProbe = has && showKey && p.comparisonLabels.guide ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: 360, size: SH.note, maxLines: 2}) : null;
    const gapP = rowArr ? 44 : Math.max(26, guideProbe ? guideProbe.box.h + 24 : 26);
    const panelW = rowArr ? (D.w - 2 * M - gapP) / 2 : D.w - 2 * M;
    // stacked boards are wide: the strips' width (hence the guide's column) depends on the width only
    const innerW0 = panelW - 32;
    const rcW0 = clamp(innerW0 * 0.31, 240, 400);
    const stripsX0 = 16 + 16, stripsW0 = innerW0 - rcW0 - 12 - 26 - 16;
    const guideX0 = has ? stripsX0 + (stripsW0 / F.n) * (k + 0.5) : null;
    const headerSpan = i => {
      if (rowArr || guideX0 === null) return {x: 0, w: panelW};
      const left = {x: 0, w: guideX0 - 30};
      const right = {x: guideX0 + 30, w: panelW - (guideX0 + 30)};
      return left.w >= right.w ? left : right;
    };
    const hdrProbe = [p.scenarioA, p.scenarioB].map((s, i) => header(ctx, {name: 'probe', letter: 'A', label: s.label, caption: s.caption, x: 0, w: headerSpan(i).w, y: 0, color: C.a, SH}));
    const headH = Math.max(...hdrProbe.map(q => q.h)) + 12;
    const laneH = rowArr && has ? SH.lane : 0;
    const boardH = rowArr
      ? D.h - M - headH - laneH - bottom.h - 12 - M
      : (D.h - 2 * M - 2 * headH - gapP - bottom.h - 12) / 2;
    const panels = [0, 1].map(i => rowArr
      ? {x: M + i * (panelW + gapP), hy: M, by: M + headH}
      : {x: M, hy: M + i * (headH + boardH + gapP), by: M + headH + i * (headH + boardH + gapP)});

    // --- board interior (panel-local; identical for both boards)
    const board0 = corkBoard(ctx, {prefix: 'probe', x: 0, y: 0, w: panelW, h: boardH, frame: 16, seedKey: 'cork'});
    const I = board0.inner;
    const wide = I.w / I.h >= 1.35;
    const labels = {a: t.earlierCase, b: t.newCase};
    const tagH = SH.tag * 1.75;
    // the transient change tags sit on the strip band at the changed column: band labels keep clear of them
    const tagHalf = showKey && has ? Math.max(...[t.notRecorded, t.recorded].map(x => stateTag(ctx, x, {x: 0, y: 0, size: SH.tag, maxWidth: 400}).box.w)) / 2 + 14 : 0;
    let stripsR, rcW, rule, ruleOpts, clipC, geoA, geoB, R, guideLocalX, pin = null, side = null;
    const makeStrips = region => {
      // column x of the changed fact first, so the strip labels can step aside from the guide
      guideLocalX = has ? region.x + (region.w / F.n) * (k + 0.5) : null;
      // the guide leaves lens A downward through the new strip's band (and, stacked, enters board B
      // through the earlier strip's band); the change tags sit on the band of the strip missing the fact
      const avoid = {a: [], b: []};
      if (has) {
        avoid.b.push({x: guideLocalX, half: 26});
        if (!rowArr) avoid.a.push({x: guideLocalX, half: 26});
        avoid[absent].push({x: guideLocalX, half: tagHalf});
      }
      const so = {...region, labels, labelSize: SH.strip, avoid, maxR: SH.maxR};
      geoA = stripGeometry(ctx, {...so, facts: F});
      geoB = stripGeometry(ctx, {...so, facts: FB});
      R = geoA.R;
    };
    if (wide) {
      // strips on the left, rule card + hanging clip in a right column. The rule text shrinks (never
      // below a bound), and the column widens a little, until card, string, clip and the final
      // status tag (up to two lines) fit the column untruncated
      const stTexts = !has ? [t.noDiff] : [t.distinguishing, t.noDiffShort];
      let chosen = null, fallback = null;
      const base = rowArr ? 0.31 : 0.36;
      for (const frac of [base, base + 0.06, base + 0.12, base + 0.18]) {
        const cw = clamp(I.w * frac, 240, rowArr ? 400 : 470);
        const rcX = I.x + I.w - cw - 12;
        const reg = {x: I.x + 16, y: I.y + 10, w: rcX - 26 - (I.x + 16), h: I.h - 20};
        makeStrips(reg);
        const stH = showKey ? Math.max(...stTexts.map(x => wrapTag(ctx, x, {x: 0, y: 0, size: SH.tag, maxWidth: cw + 16}).box.h)) : tagH;
        for (const [k0, maxLines] of [[1, 3], [1, 4], [0.9, 4], [0.82, 4], [0.82, 5], [0.75, 5], [0.72, 6], [0.75, 3]]) {
          const opts = {x: rcX, y: I.y + 12, w: cw, rules: p.rules, head: t.ruleHead, headScale: 0.95, size: SH.rule * k0, maxLines};
          const rc = ruleCard(ctx, {prefix: 'probe', ...opts});
          const cc = {x: rc.eyelet.x, y: rc.eyelet.y + 34 + R * 1.96};
          const fits = cc.y + R * 1.2 + 12 + stH <= I.y + I.h - 8;
          const cand = {opts, rc, cc, cw, reg};
          if (fits && !fallback) fallback = cand;
          if (fits && !rc.fits.some(f => f.truncated)) { chosen = cand; break; }
        }
        if (chosen) break;
      }
      chosen = chosen || fallback;
      if (!chosen) {
        const cw = clamp(I.w * base, 240, 400);
        const rcX = I.x + I.w - cw - 12;
        const opts = {x: rcX, y: I.y + 12, w: cw, rules: p.rules, head: t.ruleHead, headScale: 0.95, size: SH.rule * 0.75, maxLines: 2};
        const reg = {x: I.x + 16, y: I.y + 10, w: rcX - 26 - (I.x + 16), h: I.h - 20};
        makeStrips(reg);
        const rc = ruleCard(ctx, {prefix: 'probe', ...opts});
        chosen = {opts, rc, cc: {x: rc.eyelet.x, y: rc.eyelet.y + 34 + R * 1.96}, cw, reg};
      }
      rcW = chosen.cw;
      stripsR = chosen.reg;
      makeStrips(stripsR);
      ({opts: ruleOpts, rc: rule, cc: clipC} = chosen);
    } else {
      // tall board: rule card top left; a string runs from its side eyelet over a push pin and
      // the clip hangs from the pin beside the card; the strips span the width below both
      rcW = clamp(I.w * 0.56, 250, 440);
      let fallback = null;
      for (const [k0, maxLines] of [[1, 3], [1, 4], [0.9, 4], [0.82, 5]]) {
        const opts = {x: I.x + 12, y: I.y + 12, w: rcW, rules: p.rules, head: t.ruleHead, headScale: 0.95, size: SH.rule * k0, maxLines, eyelet: false};
        const rc = ruleCard(ctx, {prefix: 'probe', ...opts});
        fallback = {opts, rc};
        if (!rc.fits.some(f => f.truncated)) break;
      }
      ({opts: ruleOpts, rc: rule} = fallback);
      const eye = {x: rule.box.x + rule.box.w - 16, y: rule.box.y + 46};
      pin = {x: (rule.box.x + rule.box.w + I.x + I.w) / 2, y: eye.y - 10};
      side = {eye, pin};
      let Rg = 40;
      const stTexts = !has ? [t.noDiff] : [t.distinguishing, t.noDiffShort];
      const stH = showKey ? Math.max(...stTexts.map(x => wrapTag(ctx, x, {x: 0, y: 0, size: SH.tag, maxWidth: rcW}).box.h)) : tagH;
      for (let it = 0; it < 4; it++) {
        const cy = pin.y + 30 + Rg * 1.96;
        const top = Math.max(rule.box.y + rule.box.h + 16, cy + Rg * 1.22 + 10 + stH + 12);
        stripsR = {x: I.x + 14, y: top, w: I.w - 28, h: I.y + I.h - 6 - top};
        makeStrips(stripsR);
        Rg = R;
      }
      clipC = {x: pin.x, y: pin.y + 30 + R * 1.96};
    }
    const colW = stripsR.w / F.n;

    // --- magnifier (free instrument) and its path points (panel-local)
    const Rl = Math.round(R * 2.1);
    const colPt = i => ({x: geoA.rows[i].cx, y: geoA.seamY});
    const tokPt = has ? {x: geoA.rows[k][present].x, y: geoA.rows[k][present].y} : null;
    const handleDeg = 60;
    // tall boards: above the strips the handle turns up and out (under the frame), over the strips it points down
    const handleAt = y => (wide ? handleDeg : lerp(-38, handleDeg, ease.inOutSine(clamp((y - (stripsR.y + geoA.box.y - stripsR.y - Rl * 1.1)) / (Rl * 1.1)))));

    const cell = has ? {x: geoA.rows[k][absent].x, y: geoA.rows[k][absent].y} : null;

    // --- per-scenario art (built once per board: main + magnified copy)
    const rimP = present === 'b' ? C.b : C.a;
    const iconK = has ? F.rows[k].icon : null;
    const clipFor = prefix => hangingClip(ctx, {prefix, eyelet: pin || rule.eyelet, c: clipC, R, icon: iconK, rim: rimP});
    // tall boards: the string's first run, from the card's side eyelet over the pin
    const sideString = () => side ? g(null,
      h('path', {d: `M${r(side.eye.x)} ${r(side.eye.y)}Q${r((side.eye.x + side.pin.x) / 2)} ${r(side.pin.y - 12)} ${r(side.pin.x)} ${r(side.pin.y)}`, fill: 'none', stroke: '#5b4a3a', 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(side.eye.x), cy: r(side.eye.y), r: 6.5, fill: C.metalLight, stroke: '#1f2328', 'stroke-width': 2}),
      pushPin(side.pin.x, side.pin.y, C.pinB, 9)) : null;
    const scenes = ['a', 'b'].map((sc, i) => {
      const geo = sc === 'a' ? geoA : geoB;
      const facts = sc === 'a' ? F : FB;
      const P = `${sc}`;
      const board = corkBoard(ctx, {prefix: `bd${sc}`, x: 0, y: 0, w: panelW, h: boardH, frame: 16, seedKey: 'cork'});
      const ruleM = ruleCard(ctx, {prefix: `rule${sc}`, ...ruleOpts});
      const ruleZ = ruleCard(ctx, {prefix: `zrule${sc}`, ...ruleOpts, bars: true});
      if (side) { ruleM.node = g(null, ruleM.node, sideString()); ruleZ.node = g(null, ruleZ.node, sideString()); }
      const clipM = clipFor(`m${P}`);
      const clipZ = clipFor(`z${P}`);
      const zoomContent = g(null,
        corkCopy(ctx, board, 'cork'),
        ruleZ.node,
        clipZ.node,
        stripPaper(ctx, geo, {prefix: `zs${P}`, bars: true}),
        pairTokens(ctx, geo, `z${P}`, {diff: facts.diff, side: facts.side}),
        has ? ringNode(ctx, `zring${P}`, cell, R) : null,
      );
      const lens = freeLens(ctx, {name: `lens${P}`, R: Rl, zoom: ZOOM, content: zoomContent, handleDeg, handleLen: Rl * 1.05, held: sc === 'a' && has ? {icon: iconK, rim: rimP, R} : null});
      const flap = has ? coverFlap(ctx, {name: `flap${P}`, R}) : null;
      return {sc, geo, facts, board, frame: boardFrame(ctx, board, `bd${sc}`), ruleM, clipM, clipZ, lens, flap, panel: panels[i]};
    });

    // --- change marks (ring around the covered cell; transient tags while the change is introduced)
    const changeTags = has && showKey ? ['a', 'b'].map(sc => {
      const text = sc === 'a' ? t.notRecorded : t.recorded;
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: SH.tag, maxWidth: colW * 2});
      const band = absent === 'b' ? geoA.bandY.b : geoA.bandY.a;
      // over the strip's outer band at the changed column (the band label steps aside from this column)
      const y = band + (geoA.bandH - probe.box.h) / 2;
      const cx = clamp(cell.x, stripsR.x + probe.box.w / 2, stripsR.x + stripsR.w - probe.box.w / 2);
      return stateTag(ctx, text, {x: cx, y, anchor: 'middle', size: SH.tag, maxWidth: colW * 2, name: `ctag${sc}`, color: sc === 'a' ? th.accent : C.b, opacity: 0});
    }) : [];

    // --- status tags under the clips (final hold)
    const statusTags = showKey ? ['a', 'b'].map(sc => {
      const text = !has ? t.noDiff : sc === 'a' ? t.distinguishing : t.noDiffShort;
      const maxW = rcW + (wide ? 16 : 0);
      // wraps to two lines rather than cutting the "as supplied" qualifier
      const probe = wrapTag(ctx, text, {x: 0, y: 0, size: SH.tag, maxWidth: maxW});
      const cx = clamp(clipC.x, I.x + 10 + probe.box.w / 2, I.x + I.w - 10 - probe.box.w / 2);
      // never below the board's inner edge (the frame would cut it)
      const ty = Math.min(clipC.y + R * 1.22 + 10, I.y + I.h - 6 - probe.box.h);
      return wrapTag(ctx, text, {x: cx, y: ty, anchor: 'middle', size: SH.tag, maxWidth: maxW, name: `stag${sc}`, color: !has || sc === 'b' ? th.inkSoft : C.a, opacity: 0});
    }) : [];

    // --- guide joining the two magnified columns (lens rims) and its label
    let guide = null;
    const guideLabel = p.comparisonLabels.guide;
    if (has) {
      const gx = i => panels[i].x + guideLocalX;
      const seamW = i => panels[i].by + geoA.seamY;
      const labW = rowArr ? Math.max(200, gapP + 260) : 360;
      const lab = showKey && guideLabel ? chip(ctx, guideLabel, {x: 0, y: 0, maxWidth: labW, size: SH.note, maxLines: 2}) : null;
      let pts, chipAt;
      if (rowArr) {
        const laneY = panels[0].by + boardH + laneH / 2;
        pts = [{x: gx(0), y: seamW(0) + Rl + 4}, {x: gx(0), y: laneY}, {x: gx(1), y: laneY}, {x: gx(1), y: seamW(1) + Rl + 4}];
        chipAt = lab ? {x: (panels[0].x + panelW + panels[1].x) / 2, y: laneY - lab.box.h / 2} : null;
      } else {
        pts = [{x: gx(0), y: seamW(0) + Rl + 4}, {x: gx(1), y: seamW(1) - Rl - 4}];
        chipAt = lab ? {x: gx(0), y: panels[0].by + boardH + (gapP - lab.box.h) / 2} : null;
      }
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      const chipNode = lab ? chip(ctx, guideLabel, {x: clamp(chipAt.x, M + lab.box.w / 2, D.w - M - lab.box.w / 2), y: chipAt.y, anchor: 'middle', maxWidth: labW, size: SH.note, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip', weight: 700}) : null;
      guide = {pts, len, chip: chipNode, d: pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('')};
    }

    // --- scenario headers (stacked boards: they step aside from the guide's column)
    const headers = [p.scenarioA, p.scenarioB].map((s, i) => {
      const sp = headerSpan(i);
      return header(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', label: s.label, caption: s.caption, x: panels[i].x + sp.x, w: sp.w, y: panels[i].hy, color: i ? th.accent : C.a, SH});
    });

    // --- place the bottom block
    const bottomY = rowArr ? panels[0].by + boardH + laneH + 12 : panels[1].by + boardH + 12;

    // --- paths
    const scanStep = (W.scan[1] - W.scan[0]) / F.n;
    return {F, FB, k, has, present, absent, R, Rl, panels, panelW, boardH, headH, I, geoA, geoB, rule, clipC, colPt, tokPt, cell, scenes, changeTags, statusTags, guide, headers,
      bottom, bottomY, M, scanStep, rowArr, stripsR, guideLocalX, wide, handleAt};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = dcColors(ctx);
    const panelsNodes = L.scenes.map((S, i) => {
      const P = S.sc;
      const ring = L.has ? ringNode(ctx, `ring${P}`, L.cell, L.R) : null;
      return g({name: `panel${P}`, transform: T(S.panel.x, S.panel.by)},
        S.board.surface,
        g({'clip-path': S.board.clip},
          S.ruleM.node,
          S.clipM.node,
          stripPaper(ctx, S.geo, {prefix: `ms${P}`}),
          pairTokens(ctx, S.geo, `m${P}`, {diff: S.facts.diff, side: S.facts.side}),
          ring,
          L.has ? g({transform: T(L.cell.x, L.cell.y)}, S.flap.node) : null,
          L.changeTags[i] && L.changeTags[i].node,
          L.statusTags[i] && L.statusTags[i].node,
          S.lens.shadow,
        ),
        // the magnifier may reach past the cork: its handle passes under the frame
        g({'clip-path': S.frame.clip}, S.lens.node),
        S.frame.node,
      );
    });
    return g(null,
      L.headers.map((hd, i) => g({name: `hdr${i}`}, hd.node)),
      panelsNodes,
      L.guide ? g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: L.guide.d, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.len)} ${r(L.guide.len + 8)}`, 'stroke-dashoffset': r(L.guide.len)}),
        h('circle', {name: 'guide-dotA', cx: r(L.guide.pts[0].x), cy: r(L.guide.pts[0].y), r: 6, fill: th.accent, opacity: 0}),
        h('circle', {name: 'guide-dotB', cx: r(L.guide.pts[L.guide.pts.length - 1].x), cy: r(L.guide.pts[L.guide.pts.length - 1].y), r: 6, fill: th.accent, opacity: 0}),
        L.guide.chip && g({name: 'guide-chipg', opacity: 0}, L.guide.chip.node)) : null,
      g({transform: T(L.M, L.bottomY)}, L.bottom.node),
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    const has = L.has;

    // --- change beat: ring, flap peel, transient tags
    const ring = s('ring');
    const peel = ease.inOutCubic(s('peel'));
    for (const S of L.scenes) {
      const P = S.sc;
      if (has) {
        Object.assign(nodes, S.flap.frame(peel));
        // A keeps its dashed ring around the empty socket; B's ring leaves once the scan starts
        const ro = r(P === 'a' ? ring : ring * (1 - seg(u, 0.4, 0.44)), 3);
        nodes[`ring${P}`] = {opacity: ro};
        nodes[`zring${P}`] = {opacity: ro};
      }
    }
    L.changeTags.forEach((tg, i) => { nodes[`ctag${'ab'[i]}`] = {opacity: r(s('changeTag') * (1 - s('changeTagOut')), 3)}; });

    // --- lens paths
    const posA = lensPath(L, u, 'a', reduced);
    const posB = lensPath(L, u, 'b', reduced);
    const capturedA = has && u >= W.capture;
    const releasedA = has && u >= W.release;
    const heldA = capturedA && !releasedA;
    const focus = lift => 1 - clamp((lift - 0.4) / 0.4);
    Object.assign(nodes,
      L.scenes[0].lens.pose(posA.target, {lift: posA.lift, focus: focus(posA.lift), held: heldA ? 1 : 0, deg: L.handleAt(posA.target.y)}),
      L.scenes[1].lens.pose(posB.target, {lift: posB.lift, focus: focus(posB.lift), deg: L.handleAt(posB.target.y)}));

    // --- links snap as each lens reaches a column (identical timing on both boards)
    const links = L.F.rows.map((_, i) => ease.outCubic(seg(u, W.scan[0] + i * L.scanStep + L.scanStep * 0.06, W.scan[0] + i * L.scanStep + L.scanStep * 0.4)));
    const ghost = seg(u, W.capture, W.capture + 0.05);
    const stA = {links, absentHi: has ? links[L.k] : 0, taken: capturedA, ghost};
    const stB = {links, absentHi: 0, taken: false, ghost: 0};
    Object.assign(nodes,
      pairFrame(L.geoA, 'ma', stA, {diff: L.F.diff, side: L.F.side}), pairFrame(L.geoA, 'za', stA, {diff: L.F.diff, side: L.F.side}),
      pairFrame(L.geoB, 'mb', stB, {diff: -1, side: null}), pairFrame(L.geoB, 'zb', stB, {diff: -1, side: null}));

    // --- clips: A receives the token and closes; B stays open and empty
    const close = has ? ease.inOutCubic(s('close')) : 0;
    const swingT = u - W.close[1];
    const swing = has && !reduced && swingT > 0 ? 3 * Math.exp(-swingT * 22) * Math.sin(swingT * 55) : 0;
    const clipStateA = {open: 1 - close, tokenOn: releasedA, swing};
    const clipStateB = {open: 1, tokenOn: false, swing: 0};
    Object.assign(nodes, L.scenes[0].clipM.frame(clipStateA), L.scenes[0].clipZ.frame(clipStateA), L.scenes[1].clipM.frame(clipStateB), L.scenes[1].clipZ.frame(clipStateB));

    // --- guide, tags, bottom block
    const tags = s('tags');
    L.statusTags.forEach((_, i) => { nodes[`stag${'ab'[i]}`] = {opacity: r(tags, 3)}; });
    const gp = ease.inOutSine(s('guide'));
    if (L.guide) {
      nodes.guide = {opacity: gp > 0 ? 1 : 0};
      nodes['guide-line'] = {'stroke-dashoffset': r(L.guide.len * (1 - gp))};
      nodes['guide-dotA'] = {opacity: gp > 0 ? 1 : 0};
      nodes['guide-dotB'] = {opacity: gp >= 0.98 ? 1 : 0};
      if (L.guide.chip) nodes['guide-chipg'] = {opacity: r(clamp((gp - 0.5) / 0.4), 3)};
    }
    Object.assign(nodes, L.bottom.frame(u));

    // --- semantics
    const cellsOf = (facts, sc) => facts.rows.map(q => {
      if (has && q.i === L.k && peel < 1) return 'covered';
      return q.inA && q.inB ? 'both' : q.inA ? 'earlier-only' : 'new-only';
    });
    const cellsA = cellsOf(L.F, 'a');
    const cellsB = cellsOf(L.FB, 'b');
    const world = (i, q) => ({x: L.panels[i].x + q.x, y: L.panels[i].by + q.y});
    let tokenA = null;
    if (has) tokenA = !capturedA ? world(0, L.tokPt) : heldA ? world(0, posA.target) : world(0, rotPt(L.clipC, L.rule.eyelet, swing));
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const semantic = {
      beat,
      changedRow: L.k,
      peel: r(peel, 3),
      cellsA, cellsB,
      differingCells: cellsA.filter((c, i) => c !== cellsB[i]).length,
      links: links.map(v => r(v, 3)),
      linkKindA: L.F.rows.map(q => (q.inA && q.inB ? 'closed' : 'broken')),
      linkKindB: L.FB.rows.map(q => (q.inA && q.inB ? 'closed' : 'broken')),
      lensLocalA: P2(posA.target), lensLocalB: P2(posB.target),
      lensA: P2(world(0, posA.target)), lensB: P2(world(1, posB.target)),
      holderA: !has ? 'none' : !capturedA ? 'card' : heldA ? 'lens' : 'clip',
      holderB: 'none',
      clipA: releasedA ? 'holds-fact' : 'empty', clipB: 'empty',
      clipClosedA: r(close, 3),
      guide: r(gp, 3),
      tagsShown: tags >= 1,
      outcome: null,
      winner: null,
      layoutInfo: {boardH: r(L.boardH), headH: r(L.headH), bottomH: r(L.bottom.h), R: r(L.R), wide: L.wide},
    };
    if (tokenA) semantic.tokenA = P2(tokenA);
    return {nodes, semantic};
  },
};

/** Dashed accent ring around the changed cell. */
function ringNode(ctx, name, c, R) {
  return g({name, opacity: 0, transform: T(c.x, c.y)},
    h('circle', {r: r(R * 1.22), fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 4, 'stroke-dasharray': '10 7'}));
}

/** Rotate a point about a pivot by `deg` degrees. */
function rotPt(pnt, c, deg) {
  if (!deg) return pnt;
  const a = (deg * Math.PI) / 180;
  const dx = pnt.x - c.x, dy = pnt.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}

const mixPt = (p0, p1, k) => ({x: lerp(p0.x, p1.x, k), y: lerp(p0.y, p1.y, k)});
const bez = (p0, c, p1, k) => ({x: (1 - k) * (1 - k) * p0.x + 2 * (1 - k) * k * c.x + k * k * p1.x, y: (1 - k) * (1 - k) * p0.y + 2 * (1 - k) * k * c.y + k * k * p1.y});

/**
 * Lens centre (panel-local) and lift as a pure function of time. Both boards
 * share the path until the scan ends; then A extracts, B checks the clip.
 */
function lensPath(L, u, sc, reduced) {
  const E = ease.inOutSine;
  const hover = 0.35;
  const n = L.F.n;
  const clipC = L.clipC;
  const col = L.colPt;
  if (u < W.depart[0]) return {target: clipC, lift: hover};
  if (u < W.depart[1]) {
    const k = E(seg(u, ...W.depart));
    const p1 = col(0);
    return {target: bez(clipC, {x: (clipC.x + p1.x) / 2, y: Math.min(clipC.y, p1.y) - 40}, p1, k), lift: hover + 0.2 * Math.sin(Math.PI * k)};
  }
  if (u < W.scan[1]) {
    const j = Math.min(n - 1, Math.floor((u - W.scan[0]) / L.scanStep));
    const local = (u - W.scan[0] - j * L.scanStep) / L.scanStep;
    const here = col(j);
    if (j === n - 1 || local < 0.55) return {target: here, lift: hover};
    const next = col(j + 1);
    return {target: mixPt(here, next, E(seg(local, 0.55, 1))), lift: hover};
  }
  const last = col(n - 1);
  const settleTo = L.has ? col(L.k) : col(Math.floor((n - 1) / 2));
  const settle = (from, fromLift) => {
    const k = E(seg(u, ...W.settle));
    return {target: bez(from, {x: (from.x + settleTo.x) / 2, y: Math.min(from.y, settleTo.y) - 50}, settleTo, k), lift: lerp(fromLift, hover, k) + 0.25 * Math.sin(Math.PI * k)};
  };
  if (sc === 'b' || !L.has) {
    // B: along to the clip, hover over it (it stays empty), then over the changed column
    if (u < W.toClip[1]) {
      const k = E(seg(u, ...W.toClip));
      return {target: bez(last, {x: (last.x + clipC.x) / 2, y: Math.min(last.y, clipC.y) - 40}, clipC, k), lift: hover + 0.15 * Math.sin(Math.PI * k)};
    }
    if (u < W.settle[0]) return {target: clipC, lift: hover * (1 - 0.6 * Math.sin(Math.PI * seg(u, W.toClip[1], W.close[1])))};
    return settle(clipC, hover);
  }
  // A: back to the changed column, onto the token, press, lift, carry to the clip, drop, settle
  const tok = L.tokPt;
  const rowSeam = col(L.k);
  if (u < W.back[1]) {
    const k = seg(u, ...W.back);
    if (k < 0.6) return {target: mixPt(last, rowSeam, E(k / 0.6)), lift: hover};
    return {target: mixPt(rowSeam, tok, E((k - 0.6) / 0.4)), lift: hover};
  }
  if (u < W.capture) return {target: tok, lift: hover * (1 - E(seg(u, ...W.press)))};
  if (u < W.carry[1]) {
    const k = E(seg(u, ...W.carry));
    const lift = reduced ? Math.min(1, k * 3) * (1 - 0.4 * clamp((k - 0.8) / 0.2)) : clamp(Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.4 + clamp(k * 4) * 0.6 * (1 - clamp((k - 0.75) / 0.25) * 0.5));
    return {target: bez(tok, {x: (tok.x + clipC.x) / 2, y: Math.min(tok.y, clipC.y) - 60}, clipC, k), lift};
  }
  if (u < W.release) return {target: clipC, lift: 0.7 * (1 - E(seg(u, ...W.drop)))};
  if (u < W.settle[0]) return {target: clipC, lift: 0.1 * E(seg(u, W.release, W.settle[0]))};
  return settle(clipC, 0.1);
}

/**
 * Scenario header: coloured letter badge, label and caption (fitted).
 * With labels hidden only the coloured badge remains (A = first, B = second).
 */
function header(ctx, o) {
  const th = ctx.theme;
  const SH = o.SH;
  const br = SH.label * 0.74;
  const tx = o.x + br * 2 + 14;
  const tw = Math.max(80, o.w - br * 2 - 14);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const lf = ctx.fit(o.label, {maxWidth: tw, size: SH.label, minSize: SH.label * 0.75, maxLines: 2, weight: 700});
  const cf = o.caption && showAll ? ctx.fit(o.caption, {maxWidth: tw, size: SH.cap, minSize: SH.cap * 0.82, maxLines: 2, weight: 500}) : null;
  const capGap = SH.label * 0.3 + 4;
  const textH = (showKey ? lf.height : 0) + (cf ? capGap + cf.height : 0);
  const hh = Math.max(br * 2, textH);
  const cy = o.y + hh / 2;
  const parts = [
    h('circle', {cx: r(o.x + br), cy: r(o.y + br), r: r(br), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    showKey ? h('text', {x: r(o.x + br), y: r(o.y + br + SH.label * 0.36), 'text-anchor': 'middle', 'font-size': r(SH.label), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, o.letter) : null,
  ];
  if (showKey) parts.push(textBlock(lf, {x: r(tx), y: r(o.y), fill: th.fg, name: `${o.name}-label`}));
  if (cf) parts.push(textBlock(cf, {x: r(tx), y: r(o.y + (showKey ? lf.height + capGap : 0)), fill: th.fgSoft, name: `${o.name}-cap`}));
  void cy;
  return {node: g({name: o.name}, parts), h: hh, box: {x: o.x, y: o.y, w: showKey ? br * 2 + 14 + Math.max(lf.width, cf ? cf.width : 0) : br * 2, h: hh}};
}

/**
 * Shared block under the boards: the fact legend (pictogram + text, the
 * changed fact ringed), the changed-fact line, the neutral note with the
 * kept-equal list, and the issue / assumption footnotes.
 */
function bottomBlock(ctx, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const p = ctx.params;
  const SH = Object.fromEntries(Object.entries(o.SH).map(([key, v]) => [key, typeof v === 'number' && ['legend', 'note'].includes(key) ? v * (o.scale ?? 1) : v]));
  const parts = [];
  const names = {};
  let y = 0;
  const W0 = o.width;
  if (o.showKey) {
    const cols = o.rowArr ? Math.min(o.F.n, 4) : o.F.n > 3 ? 2 : Math.min(o.F.n, 3);
    const cw = W0 / cols;
    const tr = SH.legend * 0.78;
    const items = o.F.rows.map((q, i) => {
      const fit = ctx.fit(q.text, {maxWidth: cw - tr * 2 - 26, size: SH.legend, minSize: SH.legend * 0.78, maxLines: 3, weight: 500});
      return {q, i, fit, h: Math.max(tr * 2, fit.height)};
    });
    const rowsN = Math.ceil(items.length / cols);
    const leg = [];
    for (let rr = 0; rr < rowsN; rr++) {
      const rowItems = items.slice(rr * cols, rr * cols + cols);
      const rh = Math.max(...rowItems.map(it => it.h));
      rowItems.forEach((it, j) => {
        const x = j * cw;
        const cy = y + rh / 2;
        const changed = it.i === o.k;
        leg.push(g({transform: T(x + tr + 4, cy)}, factToken(ctx, {R: tr, icon: it.q.icon, rim: '#9aa4ad', shadow: false})));
        if (changed) leg.push(h('circle', {name: 'legend-ring', cx: r(x + tr + 4), cy: r(cy), r: r(tr + 7), fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '7 5', opacity: 0}));
        leg.push(textBlock(it.fit, {x: r(x + tr * 2 + 18), y: r(cy - it.fit.height / 2), fill: th.fg}));
      });
      y += rh + 10;
    }
    parts.push(g({name: 'legend', opacity: 0}, leg));
    names.legend = true;
    if (o.k >= 0 && p.changedFact) {
      const f = ctx.fit(p.changedFact, {maxWidth: W0 - 60, size: SH.note, minSize: SH.note * 0.85, maxLines: 2, weight: 600});
      parts.push(g({name: 'changed-line', opacity: 0},
        h('circle', {cx: 14, cy: r(y + f.height / 2), r: 11, fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '6 4'}),
        textBlock(f, {x: 36, y: r(y), fill: th.accent})));
      names.changed = true;
      y += f.height + 10;
    }
  }
  if (o.showAll) {
    const noteText = [p.comparisonLabels.neutral, p.sharedFacts.length ? `${o.t.keptEqual}: ${p.sharedFacts.join(' · ')}` : null].filter(Boolean);
    if (noteText.length) {
      const f = ctx.fit(noteText.join('  —  '), {maxWidth: W0 - 40, size: SH.note, minSize: SH.note * 0.85, maxLines: 2, weight: 500});
      const w = f.width + 36, hh = f.height + 16;
      parts.push(g({name: 'note', opacity: 0},
        h('rect', {x: r((W0 - w) / 2), y: r(y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, 18)), fill: th.card, stroke: th.inkFaint, 'stroke-width': 2}),
        textBlock(f, {x: r(W0 / 2), y: r(y + 8), anchor: 'middle', fill: th.ink})));
      names.note = true;
      y += hh + 8;
    }
    const foot = [];
    if (p.issues.length) foot.push(`${o.t.issue}: ${p.issues[0]}`);
    if (p.assumptions.length) foot.push(`${o.t.assumption}: ${p.assumptions[0]}`);
    if (foot.length) {
      const f = ctx.fit(foot.join('   |   '), {maxWidth: W0 - 20, size: SH.note * 0.92, minSize: SH.note * 0.8, maxLines: 2, weight: 500});
      parts.push(g({name: 'foot', opacity: 0}, textBlock(f, {x: r(W0 / 2), y: r(y), anchor: 'middle', fill: th.fgSoft})));
      names.foot = true;
      y += f.height + 4;
    }
  }
  const frame = u => {
    const out = {};
    if (names.legend) out.legend = {opacity: r(seg(u, ...W.legend), 3)};
    if (names.legend && o.k >= 0) out['legend-ring'] = {opacity: r(seg(u, ...W.changeLine), 3)};
    if (names.changed) out['changed-line'] = {opacity: r(seg(u, ...W.changeLine), 3)};
    if (names.note) out.note = {opacity: r(seg(u, ...W.note), 3)};
    if (names.foot) out.foot = {opacity: r(seg(u, ...W.foot), 3)};
    return out;
  };
  void C;
  return {node: g({name: 'bottom'}, parts), h: y, frame};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-03-contrast',
    title: 'Distinguishing cases — distinguishing fact present vs absent',
    titleEs: 'Distinción de casos — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Distinción de casos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical pin boards: an earlier-case strip above a new-case strip, one pictogram token per fact facing its twin across the seam, a rule card with an empty clip. One covered cell peels open: an empty socket in A, the same token in B. Magnifiers scan both boards in lockstep; A lifts the unmatched fact into the clip, B finds every column linked and the clip stays empty. A guide joins the two magnified columns; neutral note, no outcome.',
    tags: ['reasoning', 'distinguishing', 'cases', 'contrast', 'magnifier', 'facts', 'rule', 'present', 'absent', 'pin board', 'paired'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/distincion-de-casos.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
