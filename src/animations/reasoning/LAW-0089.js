/**
 * LAW-0089 — Distinción de casos · story
 *
 * Storyboard (top-down view of a cork pin board; one analyst's hand):
 *  0.00–0.15 rest   Two case cards are pinned edge to edge: situation A and
 *                   situation B. Each fact is a round token with a pictogram at
 *                   the card's inner edge, so the two tokens of a row face each
 *                   other across the seam; where a fact is missing the card has
 *                   an empty socket. A rule card (text as supplied) hangs a
 *                   bulldog clip on a string. The analyst's hand holds a
 *                   magnifier over the empty clip.
 *  0.15–0.42 action The magnifier slides along the seam, bottom row to top
 *                   (the arm comes from below, so rows still to be compared
 *                   stay uncovered). Its glass shows a REAL enlarged copy of
 *                   the board. Where both tokens coincide a chain link snaps
 *                   across the seam; at the distinguishing row the link breaks
 *                   and the empty socket is ringed.
 *  0.42–0.73        The magnifier returns to that row, centres on the token,
 *                   presses and lifts it out (the token rides in the glass),
 *                   carries it to the rule's clip and drops it there; the
 *                   jaws close and the card keeps a dashed ghost of the token.
 *  0.73–1.00 hold   The hand withdraws. The extracted fact hangs from the rule
 *                   on its string, the absent socket stays ringed, a status
 *                   tag reads "Distinguishing fact · as supplied" (or
 *                   "Difference disputed", dashed string), a pending issue
 *                   note and the author's callouts appear.
 *  No distinguishing fact supplied (all facts in both): every row links, the
 *  clip stays empty and the tag says so.
 *  Layouts: 16:9 cards left, rule + clip in a right column, arm from below;
 *  1:1 and 9:16 rule + clip in a top band above the cards, arm from the
 *  lower right.
 * Legal content: fictional facts, illustrative rule text as supplied,
 * jurisdiction unspecified. The scene never states that the rule applies or
 * not; it only isolates the supplied difference.
 * @module animations/reasoning/LAW-0089
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, rotateAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, oneOf, list, obj, annotation} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {fitDesign} from '../../core/layout.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChipAny, placeChip, calloutChip, stateTag, leaderPoly} from '../causation/kits/place.js';
import {
  reasoningFields, DC_STRINGS, resolveFacts, dcColors, corkBoard, corkCopy, pairGeometry, pairPaper, pairTokens, pairFrame,
  ruleCard, bulldogClip, factToken, stickyNote, lensRig, entryAngle, entryShoulder, elbowCallout,
} from './kits/distincion-de-casos.js';

const ID = 'LAW-0089';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  labels: [0, 0.09], enter: [0.07, 0.17], scan: [0.17, 0.39], back: [0.39, 0.47], press: [0.47, 0.5],
  capture: 0.5, carry: [0.5, 0.635], drop: [0.635, 0.665], release: 0.665, close: [0.665, 0.7], leave: [0.7, 0.785],
  ghost: [0.5, 0.56], dash: [0.745, 0.77], tag: [0.78, 0.84], issue: [0.82, 0.88], notes: [0.85, 0.93], dispute: [0.78, 0.84], grow: [0.79, 0.86],
};
const ZOOM = 1.3;
const DEG = Math.PI / 180;

const SHAPES = {
  // note = tags / callouts / issue body; absent, head, foot = factors for the "Absent in …" tag,
  // the issue note's heading and the assumption footnote (the square design is scaled down most
  // at 1080×1080, so its sizes are larger in design units)
  landscape: {mode: 'col', psi: 72, text: 28, label: 29, rule: 26, note: 24, absent: 0.95, head: 0.95, foot: 0.92, ruleHead: 0.84},
  square: {mode: 'band', psi: 58, text: 29, label: 30, rule: 29, note: 31, absent: 1, head: 0.95, foot: 0.95, ruleHead: 0.98},
  portrait: {mode: 'band', psi: 58, text: 27, label: 28, rule: 26, note: 23, absent: 0.95, head: 0.88, foot: 0.88, ruleHead: 0.8},
};

const TARGETS = ['fact', 'absent', 'rule', 'caseA', 'caseB'];
const sceneSchema = {
  ...reasoningFields,
  actorLabels: obj('Caption for the analyst whose hand holds the magnifier', {a: str('Caption (descriptive role, not a finding)', 60)}),
  objectLabels: obj('Labels printed on the objects', {
    caseA: str('Label on card A (situation A)', 60),
    caseB: str('Label on card B (situation B)', 60),
    rule: str('Heading printed on the rule card (empty = built-in "Rule · as supplied")', 50),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: the distinguishing fact hangs from the rule as supplied, or the difference is marked as disputed (never decided)', ['fact-extracted', 'difference-disputed']),
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
  assumptions: ['Fictional facts; the other facts are treated as equal'],
  actorLabels: {a: 'Analyst (fictional)'},
  objectLabels: {caseA: 'Earlier case (fictional)', caseB: 'New case (fictional)', rule: ''},
  actionProgress: 1,
  annotations: [{target: 'fact', text: 'Recorded only in the earlier case'}],
  finalState: 'fact-extracted',
};


const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const F = resolveFacts(p.facts);
    const C = dcColors(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const col = SH.mode === 'col';

    const board = corkBoard(ctx, {prefix: 'bd', x: 8, y: 8, w: D.w - 16, h: D.h - 16, frame: 20, seedKey: 'cork'});
    const I = board.inner;
    const bounds = {x: I.x + 8, y: I.y + 8, w: I.w - 16, h: I.h - 16};
    const ruleHead = p.objectLabels.rule || t.ruleHead;
    const labels = {a: p.objectLabels.caseA, b: p.objectLabels.caseB};
    // an author's note on the empty socket sits in that row under its "Absent in …" tag: when the
    // row is too short for both, that row alone is made taller (the other rows share the rest)
    const absentNote = showAll && F.diff >= 0 ? p.annotations.find(a => a.target === 'absent') : null;
    const pairFor = R => {
      const base = {...R, facts: F, labels, textSize: SH.text, labelSize: SH.label, maxRowH: 170};
      const g0 = pairGeometry(ctx, base);
      if (!absentNote || !showKey) return g0;
      const oth = F.side === 'a' ? 'b' : 'a';
      const tagP = stateTag(ctx, `${t.absentIn} ${oth.toUpperCase()}`, {x: 0, y: 0, size: SH.note * SH.absent, maxWidth: g0.zoneW + 20});
      const noteP = chip(ctx, absentNote.text, {x: 0, y: 0, maxWidth: g0.zoneW, size: SH.note * 0.9, maxLines: 3});
      const extra = 8 + tagP.box.h + 8 + noteP.box.h + 10 - g0.rowH;
      // the other rows give up the extra height, so the tall row gains extra·n/(n−1) over the base
      const n0 = F.n;
      return extra > 0 && n0 > 1 ? pairGeometry(ctx, {...base, tallRow: {row: F.diff, extra: (extra + 6) * n0 / (n0 - 1)}}) : g0;
    };
    const lensR = geo0 => Math.round((geo0.sx + geo0.R * 0.55) * ZOOM + 12);
    const TAG_H = SH.note * 1.75;

    // --- the rule column (16:9: right column; 1:1 and 9:16: right half of a top band)
    const colW = col ? clamp(I.w * 0.32, 400, 560) : clamp(I.w * 0.56, 420, 640);
    const colX = I.x + I.w - colW - 22;
    const rule = ruleCard(ctx, {prefix: 'rule', x: colX, y: I.y + 24, w: colW, rules: p.rules, head: ruleHead, headScale: SH.ruleHead, size: SH.rule, maxLines: 3});
    const ruleBottom = rule.box.y + rule.box.h;
    const clipYFor = (R, Rl) => Math.max(ruleBottom + Rl + 10, rule.eyelet.y + 70 + R * 1.96);
    // left column of the band (issue note + footnote), measured first
    const leftX = I.x + 26, leftW = colX - 30 - leftX;
    const noteW = col ? Math.min(colW, 460) : leftW;
    const probeIssue = showAll && p.issues.length ? stickyNote(ctx, {name: 'probe', x: 0, y: 0, w: noteW, head: t.issue, text: p.issues[0], size: SH.note, headScale: SH.head}) : null;
    const footText = p.assumptions.length ? `${t.assumption}: ${p.assumptions[0]}` : null;
    const footW = col ? colW : leftW;
    const probeFoot = showAll && footText ? chip(ctx, footText, {x: 0, y: 0, maxWidth: footW, size: SH.note * SH.foot, maxLines: 3, weight: 500}) : null;

    let geo, cardsR, clipC, Rl, bandFact = null;
    if (col) {
      cardsR = {x: I.x + 26, y: I.y + 18, w: colX - 44 - (I.x + 26), h: I.h - 36};
      geo = pairFor(cardsR);
      Rl = lensR(geo);
      clipC = {x: rule.eyelet.x, y: clipYFor(geo.R, Rl)};
    } else {
      // 1:1 / 9:16: a callout on the clipped fact sits level with the token, left of it, with a
      // short straight leader; the clip hangs low enough for the chip to clear the band's notes
      const leftBottom = I.y + 26 + (probeIssue ? probeIssue.box.h + 18 : 0) + (probeFoot ? probeFoot.box.h : 0);
      const fIdx = showAll && F.diff >= 0 ? p.annotations.findIndex(a => a.target === 'fact') : -1;
      if (fIdx >= 0) {
        const w = Math.min(560, rule.eyelet.x - 46 * 1.18 - 48 - leftX);
        for (const ml of [1, 2, 3]) {
          const pr = chip(ctx, p.annotations[fIdx].text, {x: 0, y: 0, maxWidth: w, size: SH.note, maxLines: ml});
          if (!pr.fit.truncated && pr.fit.size >= SH.note * 0.92) { bandFact = {mode: 'beside', idx: fIdx, ml, w, bh: pr.box.h}; break; }
        }
      }
      const floorY = bandFact ? Math.max(leftBottom, ruleBottom) + 14 + bandFact.bh / 2 : -Infinity;
      // the cards fill the space under the band; iterate for the token size (the clip hangs a token of that size)
      let R = 40, RlG = 112;
      for (let it = 0; it < 4; it++) {
        const cy = Math.max(clipYFor(R, RlG), floorY);
        const tagY = Math.max(cy + R * 1.18 + 14, bandFact ? cy + bandFact.bh / 2 + 10 : -Infinity);
        const bandBottom = Math.max(cy + R * 1.42 + 16, tagY + TAG_H, leftBottom);
        const top = bandBottom + 22;
        cardsR = {x: I.x + 24, y: top, w: I.w - 48, h: I.y + I.h - 16 - top};
        geo = pairFor(cardsR);
        R = geo.R;
        RlG = lensR(geo);
      }
      Rl = RlG;
      clipC = {x: rule.eyelet.x, y: Math.max(clipYFor(geo.R, Rl), floorY)};
    }
    const tokR = geo.R;
    // 16:9: an editorial callout on the clipped fact sits beside the token, left of the string —
    // level with it (2–3 lines), or, for a long text, above-left of it with the clip hanging lower
    // on its string to make room. Either way its leader is short and straight.
    let factPlan = bandFact ? {...bandFact, hi: clipC.x - tokR * 1.18 - 48} : null;
    const factIdx = col && showAll && F.diff >= 0 ? p.annotations.findIndex(a => a.target === 'fact') : -1;
    if (factIdx >= 0) {
      const txt = p.annotations[factIdx].text;
      const gR = tokR * 1.18;
      const lo = colX - 30;
      const probeAt = (w, ml) => chip(ctx, txt, {x: 0, y: 0, maxWidth: w, size: SH.note, maxLines: ml});
      const wL = clipC.x - gR - 48 - lo;
      for (const ml of [2, 3]) {
        const pr = wL >= 150 ? probeAt(wL, ml) : null;
        if (pr && !pr.fit.truncated && pr.fit.size >= SH.note * 0.92 && pr.box.h / 2 <= gR + 6) { factPlan = {mode: 'beside', idx: factIdx, ml, w: wL, hi: lo + wL}; break; }
      }
      if (!factPlan) {
        const wA = clipC.x - tokR * 0.8 - 12 - lo;
        for (const ml of [3, 4, 5]) {
          const pr = probeAt(wA, ml);
          if (!pr.fit.truncated && (pr.fit.size >= SH.note * 0.92 || ml === 5)) { factPlan = {mode: 'above', idx: factIdx, ml, w: wA, hi: lo + wA, h: pr.box.h}; break; }
        }
        if (factPlan) clipC = {x: clipC.x, y: Math.max(clipC.y, ruleBottom + 14 + factPlan.h + tokR * 0.5 + 14)};
      }
    }

    // --- clip on its string (hangs from the rule card's eyelet)
    const diff = F.diff;
    const side = F.side;
    const diffRow = diff >= 0 ? geo.rows[diff] : null;
    const rim = side === 'b' ? C.b : C.a;
    const clipArt = prefix => {
      const cl = bulldogClip(ctx, {name: `${prefix}-clip`, R: tokR});
      const tok = diffRow ? factToken(ctx, {name: `${prefix}-ctok`, R: tokR, icon: diffRow.icon, rim, opacity: 0}) : null;
      const top = {x: clipC.x, y: clipC.y + cl.loopTop.y};
      return {cl, node: g({name: `${prefix}-clipg`},
        h('line', {name: `${prefix}-str`, x1: r(rule.eyelet.x), y1: r(rule.eyelet.y), x2: r(top.x), y2: r(top.y), stroke: '#5b4a3a', 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
        h('line', {name: `${prefix}-strd`, x1: r(rule.eyelet.x), y1: r(rule.eyelet.y), x2: r(top.x), y2: r(top.y), stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round', opacity: 0}),
        g({name: `${prefix}-swing`},
          g({transform: T(clipC.x, clipC.y)}, tok ? g({name: `${prefix}-ctokg`}, tok) : null, cl.body)))};
    };
    const mainClip = clipArt('m');

    // --- magnified copy of the board (cork, cards with bars, tokens, rule card with bars, clip)
    const zoomContent = g(null,
      corkCopy(ctx, board, 'cork'),
      pairPaper(ctx, geo, {prefix: 'z', bars: true}),
      pairTokens(ctx, geo, 'z', {diff, side}),
      ruleCard(ctx, {prefix: 'zrule', x: rule.box.x, y: rule.box.y, w: rule.box.w, rules: p.rules, head: ruleHead, headScale: SH.ruleHead, size: SH.rule, maxLines: 3, bars: true}).node,
      clipArt('z').node,
    );
    const look = actorLook(ctx, null, 0);
    // the arm is one limb reaching in from beyond the visible frame: the shoulder sits outside the
    // whole canvas (design units), so the sleeve runs over the board's frame to the picture edge
    const fit = fitDesign(ctx.view, D.w, D.h);
    const canvas = {x: -fit.ox / fit.scale, y: -fit.oy / fit.scale, w: ctx.view.width / fit.scale, h: ctx.view.height / fit.scale};

    // --- lens path (scan bottom → top along the seam)
    const psi = SH.psi * DEG;
    const n = geo.rows.length;
    const order = geo.rows.map((_, i) => n - 1 - i);
    const step = (W.scan[1] - W.scan[0]) / n;
    const arrive = order.map((_, j) => W.scan[0] + j * step);
    const seamAt = i => ({x: geo.seam, y: geo.rows[i].cy});
    const tokenPt = diffRow ? {x: diffRow[side].x, y: diffRow[side].y} : null;
    // carry: a bezier bowing up, away from the cards
    const carryCtrl = tokenPt ? {x: (tokenPt.x + clipC.x) / 2, y: Math.min(tokenPt.y, clipC.y) - (col ? 70 : 30)} : null;

    const grip = Rl + 150;
    const exitAng = (col ? 80 : 12) * DEG;
    // arm length: long enough that on every frame of the lens path the shoulder can sit beyond the
    // picture edge (checked by sampling the path; grown until every sample passes)
    const Lp = {I, col, canvas, clipC, seamAt, order, arrive, step, tokenPt, carryCtrl, n, geo, diff, exitAng, Rl};
    const mkRig = len => lensRig(ctx, {name: 'mag', look, R: Rl, zoom: ZOOM, grip, armWidth: 46, upper: Math.round(len * 0.53), lower: Math.round(len * 0.47), content: zoomContent, held: diffRow ? {icon: diffRow.icon, rim, R: tokR} : null});
    let armLen = 610, rig = mkRig(armLen);
    for (let it = 0; it < 10; it++) {
      let ok = true;
      for (let k = 0; k <= 160 && ok; k++) {
        const {target, lift} = lensPath(Lp, k / 160, false);
        // the shoulder distance stays on its constant floor (86 % of the reach) — the arm then never
        // nears full extension, where the forearm angle (and so the hand) would swing abruptly
        const ps = rig.pose(target, {psi: psiAt(Lp, target), win: canvas, lift, focus: 1});
        ok = ps.reached && ps.shoulder.d <= rig.reach * 0.86 + 0.5;
      }
      if (ok) break;
      armLen = Math.round(armLen * 1.12);
      rig = mkRig(armLen);
    }

    // --- obstacles for the hold annotations
    const placed = [];
    const tokenBoxes = geo.rows.flatMap(row => ['a', 'b'].map(sd => ({x: row[sd].x - tokR - 4, y: row[sd].y - tokR - 4, w: tokR * 2 + 8, h: tokR * 2 + 8})));
    const cardBoxes = [geo.cardA, geo.cardB].map(c => ({x: c.x - 4, y: c.y - 4, w: c.w + 8, h: c.h + 8}));
    const grownR = tokR * 1.18;
    const clipBox = {x: clipC.x - tokR * 1.3, y: ruleBottom, w: tokR * 2.6, h: clipC.y + grownR + 4 - ruleBottom};
    const fixed = [rule.box, clipBox, ...cardBoxes];

    // status tag, centred under the clipped token
    let tag = null;
    const tagText = diff < 0 ? t.noDiff : p.finalState === 'difference-disputed' ? t.disputedDiff : t.distinguishing;
    if (showKey) {
      const maxW = col ? colW : Math.min(I.w - 48, 640);
      const probe = stateTag(ctx, tagText, {x: 0, y: 0, size: SH.note, maxWidth: maxW});
      const cx = clamp(clipC.x, I.x + 12 + probe.box.w / 2, I.x + I.w - 12 - probe.box.w / 2);
      tag = stateTag(ctx, tagText, {x: cx, y: Math.max(clipC.y + grownR + 14, factPlan && factPlan.mode === 'beside' && !col ? clipC.y + factPlan.bh / 2 + 10 : -Infinity), anchor: 'middle', size: SH.note, maxWidth: maxW, name: 'tag', color: diff < 0 ? th.inkSoft : p.finalState === 'difference-disputed' ? th.accent : C.a, opacity: 0});
      placed.push(tag.box);
    }
    // absent tag beside the empty socket ("Absent in B")
    let absentTag = null;
    if (showKey && diffRow) {
      const other = side === 'a' ? 'b' : 'a';
      const cell = diffRow[other];
      const text = `${t.absentIn} ${other.toUpperCase()}`;
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: SH.note * SH.absent, maxWidth: geo.zoneW + 20});
      const x = other === 'b' ? cell.zone.x : cell.zone.x + geo.zoneW - probe.box.w;
      // with a callout on the empty socket, the tag moves to the top of the row and the callout sits under it
      const withNote = showAll && p.annotations.some(a => a.target === 'absent');
      const ty = withNote ? diffRow.cy - diffRow.h / 2 + 8 : diffRow.cy - probe.box.h / 2;
      absentTag = stateTag(ctx, text, {x, y: ty, size: SH.note * SH.absent, maxWidth: geo.zoneW + 20, name: 'absent-tag', color: th.accent, opacity: 0});
    }
    // issue note (pending) and assumption footnote
    let issue = null, foot = null;
    // 16:9: callouts on the clipped fact or on the rule stack in the column under the tag; their
    // leaders run out to the gutter between the cards and the column, up, and in to the target
    const stacked = [];
    let colY = (tag ? tag.box.y + tag.box.h : clipC.y + grownR) + 22;
    const factNote = (a, i) => {
      if (!factPlan || factPlan.idx !== i) return null;
      const gR = grownR;
      const pr = chip(ctx, a.text, {x: 0, y: 0, maxWidth: factPlan.w, size: SH.note, maxLines: factPlan.ml});
      const bw = pr.box.w, bh = pr.box.h;
      const x0 = factPlan.hi - bw;
      const y0 = factPlan.mode === 'beside' ? clipC.y - bh / 2 : Math.max(ruleBottom + 14, clipC.y - tokR * 0.5 - 14 - bh);
      return elbowCallout(ctx, {name: `note${i}`, text: a.text, x: x0, y: y0, maxWidth: factPlan.w, maxLines: factPlan.ml, size: SH.note,
        route: b => {
          if (factPlan.mode === 'beside') return [{x: b.x + b.w, y: clipC.y}, {x: clipC.x - gR - 4, y: clipC.y}];
          const st = {x: b.x + b.w - Math.min(30, b.w / 4), y: b.y + b.h};
          const ang = Math.atan2(st.y - clipC.y, st.x - clipC.x);
          return [st, {x: clipC.x + Math.cos(ang) * (gR + 4), y: clipC.y + Math.sin(ang) * (gR + 4)}];
        }});
    };
    if (col && showAll) {
      const gutterX = colX - 22;
      p.annotations.forEach((a, i) => {
        if (a.target === 'fact') {
          const c = factNote(a, i);
          if (c) { stacked[i] = c; placed.push(c.box); return; }
        }
        if (a.target !== 'fact' && a.target !== 'rule') return;
        const end = a.target === 'fact' ? {x: clipC.x - grownR - 3, y: clipC.y} : {x: colX - 1, y: rule.box.y + rule.box.h * 0.55};
        const c = elbowCallout(ctx, {name: `note${i}`, text: a.text, x: colX + 18, y: colY, maxWidth: colW - 18, maxLines: 3, size: SH.note,
          route: b => [{x: b.x, y: b.y + b.h / 2}, {x: gutterX, y: b.y + b.h / 2}, {x: gutterX, y: end.y}, end]});
        stacked[i] = c;
        placed.push(c.box);
        colY = c.box.y + c.box.h + 16;
      });
    }
    if (col) {
      let y = colY + 6;
      if (probeIssue) {
        issue = stickyNote(ctx, {name: 'issue', x: colX + (colW - noteW) / 2, y, w: noteW, head: t.issue, text: p.issues[0], size: SH.note, headScale: SH.head, rot: -1.5});
        placed.push(issue.box);
      }
      if (probeFoot) foot = chip(ctx, footText, {x: colX + colW / 2 - probeFoot.box.w / 2, y: I.y + I.h - 16 - probeFoot.box.h, maxWidth: footW, size: SH.note * SH.foot, maxLines: 3, weight: 500, fill: th.card, stroke: th.inkFaint, name: 'foot'});
    } else {
      let y = I.y + 26;
      if (probeIssue) {
        issue = stickyNote(ctx, {name: 'issue', x: leftX, y, w: noteW, head: t.issue, text: p.issues[0], size: SH.note, headScale: SH.head, rot: -1.5});
        placed.push(issue.box);
        y = issue.box.y + issue.box.h + 18;
      }
      if (probeFoot) foot = chip(ctx, footText, {x: leftX, y, maxWidth: footW, size: SH.note * SH.foot, maxLines: 3, weight: 500, fill: th.card, stroke: th.inkFaint, name: 'foot'});
    }
    if (foot) placed.push(foot.box);
    // actor label beside the arm where it crosses the frame at rest, clear of everything else
    const rest = rig.pose(clipC, {psi: psiAt({I, col}, clipC), win: canvas, lift: 0.35, focus: 1});
    // where the resting arm crosses the cork's edge
    rest.cross = entryShoulder(rest.hand, psiAt({I, col}, clipC), I, 0, 0).cross;
    let who = null;
    if (showAll && p.actorLabels.a) {
      const probe = chip(ctx, p.actorLabels.a, {x: 0, y: 0, maxWidth: 360, size: SH.note * 0.9, maxLines: 1});
      const cross = {x: clamp(rest.cross.x, I.x, I.x + I.w), y: clamp(rest.cross.y, I.y, I.y + I.h)};
      // the resting arm and handle (lens → hand → frame crossing) are obstacles too
      const armPts = [];
      for (const [a0, b0] of [[rest.lens, rest.hand], [rest.hand, cross]]) {
        for (let i = 0; i <= 8; i++) armPts.push({x: lerp(a0.x, b0.x, i / 8), y: lerp(a0.y, b0.y, i / 8)});
      }
      const armBoxes = armPts.map(q => ({x: q.x - 34, y: q.y - 34, w: 68, h: 68}));
      // only what is on the board at rest counts (tags, callouts and the issue note come in the hold,
      // after this label has gone; the 16:9 footnote too)
      const obst = [...fixed, !col && foot ? foot.box : null, ...armBoxes, {x: clipC.x - Rl - 8, y: clipC.y - Rl - 8, w: 2 * Rl + 16, h: 2 * Rl + 16}].filter(Boolean);
      const opts = {bounds, noLeader: true, order: ['left', 'leftHigh', 'leftLow', 'above', 'aboveL', 'below', 'belowL'], gaps: [24, 50, 90, 140, 200, 270, 340]};
      // by the frame crossing first (one, two, then three lines); else beside the magnifier the
      // hand holds, with a short leader to its rim
      const lensT = {x: rest.lens.x, y: rest.lens.y, r: Rl * 1.05};
      let res = null, fmt = null;
      for (const [target, o2] of [[cross, {obstacles: obst, ...opts}], [lensT, {obstacles: obst.slice(0, -1), bounds, noLeader: true, order: ['left', 'leftHigh', 'leftLow', 'below', 'belowL', 'above'], gaps: [22, 44, 70, 100]}]]) {
        for (const f of [{maxWidth: 360, maxLines: 1}, {maxWidth: 250, maxLines: 2}, {maxWidth: 200, maxLines: 3}]) {
          const pr = chip(ctx, p.actorLabels.a, {x: 0, y: 0, ...f, size: SH.note * 0.9});
          if (pr.fit.truncated) continue;
          res = placeChip({w: pr.box.w, h: pr.box.h}, target, o2);
          if (res) { fmt = f; if (target === lensT) res.lead = lensT; break; }
        }
        if (res) break;
      }
      if (res) {
        who = chip(ctx, p.actorLabels.a, {x: res.x, y: res.y, anchor: 'middle', ...fmt, size: SH.note * 0.9, name: 'who', fill: th.card});
        if (res.lead) {
          const b = who.box;
          const a0 = {x: clamp(res.lead.x, b.x, b.x + b.w), y: clamp(res.lead.y, b.y, b.y + b.h)};
          const ang = Math.atan2(a0.y - res.lead.y, a0.x - res.lead.x);
          const e = {x: res.lead.x + Math.cos(ang) * (res.lead.r + 4), y: res.lead.y + Math.sin(ang) * (res.lead.r + 4)};
          who.node = g(null, h('line', {x1: r(a0.x), y1: r(a0.y), x2: r(e.x), y2: r(e.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-linecap': 'round'}), h('circle', {cx: r(e.x), cy: r(e.y), r: 5, fill: th.ink}), who.node);
        }
      }
    }
    // editorial callouts
    const leads = [];
    const other = side === 'a' ? 'b' : 'a';
    const targets = {
      fact: {pt: {x: clipC.x, y: clipC.y, r: grownR}, own: [clipBox]},
      absent: diffRow ? {pt: {x: diffRow[other].x, y: diffRow[other].y, r: tokR}, own: [cardBoxes[other === 'a' ? 0 : 1]]} : {pt: {x: geo.seam, y: geo.rows[0].cy}, own: cardBoxes},
      rule: {pt: {x: rule.box.x + 8, y: rule.box.y + rule.box.h * 0.6}, own: [rule.box]},
      caseA: {pt: {x: geo.cardA.x + geo.cardA.w * 0.5, y: geo.cardA.y + 8}, own: [cardBoxes[0]]},
      caseB: {pt: {x: geo.cardB.x + geo.cardB.w * 0.5, y: geo.cardB.y + 8}, own: [cardBoxes[1]]},
    };
    const cardText = geo.rows.flatMap(row => ['a', 'b'].filter(sd => row[sd].fit && showKey).map(sd => ({x: row[sd].zone.x - 4, y: row.cy - row[sd].fit.height / 2 - 4, w: row[sd].fit.width + 8, h: row[sd].fit.height + 8})));
    const notes = showAll ? p.annotations.map((a, i) => {
      if (stacked[i]) return stacked[i];
      if (a.target === 'fact' && !col) {
        const c = factNote(a, i);
        if (c) { placed.push(c.box); return c; }
      }
      const tg = targets[a.target];
      if (a.target === 'absent' && diffRow && absentTag) {
        // in the empty row, under the "Absent in …" tag (the leader reaches the socket)
        const cell = diffRow[other];
        const size = SH.note * 0.9;
        const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: geo.zoneW, size, maxLines: 3});
        const y = absentTag.box.y + absentTag.box.h + 8;
        if (y + probe.box.h <= diffRow.cy + diffRow.h / 2 - 2 && !probe.fit.truncated) {
          const cx = other === 'b' ? cell.zone.x + probe.box.w / 2 : cell.zone.x + geo.zoneW - probe.box.w / 2;
          const c = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y}, target: {x: cell.x + (other === 'b' ? tokR : -tokR) * 0.96, y: Math.min(cell.y + tokR * 0.5, y + probe.box.h / 2)}, maxWidth: geo.zoneW, maxLines: 3, size, color: th.ink});
          placed.push(c.box);
          leads.push(leaderPoly(c.box, {x: cell.x, y: cell.y}));
          return c;
        }
      }
      const mw = col ? Math.min(colW, 440) : Math.min(I.w * 0.5, 440);
      const size = SH.note;
      const fits = [[mw, 2], [mw * 0.75, 3], [mw * 0.6, 3]].map(([wd, ml]) => ({wd, ml, box: chip(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size, maxLines: ml}).box}));
      // chips may sit on a card's blank paper only when they point into that card
      const obst = [...fixed.filter(b => !(cardBoxes.includes(b) && tg.own.includes(b))), ...placed, ...leads, ...tokenBoxes, ...cardText, geo.headText.a, geo.headText.b, absentTag && absentTag.box, who && who.box].filter(Boolean);
      const po = {obstacles: obst, bounds, own: tg.own, gaps: [20, 34, 60, 95, 135, 180, 240]};
      const res = placeChipAny(fits.map(f => f.box), tg.pt, po) || {...placeChip(fits[1].box, tg.pt, {...po, leastBad: true}), k: 1};
      const f = fits[res.k];
      const c = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size, color: th.ink});
      placed.push(c.box);
      leads.push(leaderPoly(c.box, res.end));
      return c;
    }) : [];

    return {canvas, board, I, col, geo, rule, mainClip, clipC, tokR, Rl, rig, psi, exitAng, order, arrive, step, seamAt, tokenPt, carryCtrl, diff, side, diffRow, tag, absentTag, issue, foot, who, notes, n, rest};
  },
  build(ctx, L) {
    return g(null,
      L.board.surface,
      g({'clip-path': L.board.clip},
        L.rule.node,
        L.mainClip.node,
        pairPaper(ctx, L.geo, {prefix: 'm'}),
        pairTokens(ctx, L.geo, 'm', {diff: L.diff, side: L.side}),
        L.absentTag && L.absentTag.node,
        L.tag && L.tag.node,
        L.issue && L.issue.node,
        L.foot && g({name: 'footg', opacity: 0}, L.foot.node),
        L.rig.shadow,
      ),
      // the analyst's arm reaches over the board from beyond the picture edge: drawn above the
      // frame and not clipped by the cork, so the sleeve runs on to the edge of the frame
      L.rig.arm,
      L.rig.palm,
      L.rig.handle,
      L.rig.thumb,
      L.rig.lens,
      L.notes.map(nn => nn.node),
      L.who && g({name: 'whog', opacity: 0}, L.who.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const done = p.actionProgress >= 1;
    // a capped action freezes part-way; a complete one runs on (the hand withdraws during the hold)
    const a = done ? u : Math.min(u, capU);
    const hasDiff = L.diff >= 0;
    const nodes = {};

    // --- lens target and lift over time
    const {target, lift} = lensPath(L, a, reduced);
    const focus = 1 - clamp((lift - 0.4) / 0.4);
    const captured = hasDiff && a >= W.capture;
    const released = hasDiff && a >= W.release;
    const held = captured && !released;
    const posed = L.rig.pose(target, {psi: psiAt(L, target), win: L.canvas, lift, focus, held: held ? 1 : 0});
    Object.assign(nodes, posed.nodes);

    // --- links / broken link / absent ring (snap as the lens reaches each row)
    const links = L.geo.rows.map((_, i) => {
      const j = L.order.indexOf(i);
      return ease.outCubic(seg(a, L.arrive[j] + L.step * 0.08, L.arrive[j] + L.step * 0.42));
    });
    const absentHi = hasDiff ? links[L.diff] : 0;
    const ghost = seg(a, ...W.ghost);
    const st = {links, absentHi, taken: captured, ghost};
    Object.assign(nodes, pairFrame(L.geo, 'm', st, {diff: L.diff, side: L.side}), pairFrame(L.geo, 'z', st, {diff: L.diff, side: L.side}));

    // --- clip: token appears at the release, jaws close, a small swing (not when reduced)
    const close = ease.inOutCubic(seg(a, ...W.close));
    const open = hasDiff ? 1 - close : 1;
    const swingT = a - W.close[1];
    const swing = hasDiff && !reduced && swingT > 0 ? 3.2 * Math.exp(-swingT * 22) * Math.sin(swingT * 55) : 0;
    const eye = L.rule.eyelet;
    const grow = hasDiff && done ? ease.inOutCubic(seg(u, ...W.grow)) : 0;
    const clipPose = prefix => {
      nodes[`${prefix}-clip-body`] = {transform: T(0, -L.tokR * 0.26 * open)};
      nodes[`${prefix}-swing`] = {transform: swing ? rotateAbout(eye.x, eye.y, swing) : ''};
      if (L.diffRow) nodes[`${prefix}-ctok`] = {opacity: released ? 1 : 0};
      if (L.diffRow) nodes[`${prefix}-ctokg`] = {transform: grow > 0 ? `scale(${r(1 + 0.18 * grow, 4)})` : ''};
      const disputed = p.finalState === 'difference-disputed' && hasDiff && done ? seg(u, ...W.dispute) : 0;
      nodes[`${prefix}-str`] = {opacity: r(1 - disputed, 3)};
      nodes[`${prefix}-strd`] = {opacity: r(disputed, 3)};
    };
    clipPose('m');
    clipPose('z');
    const clipTok = rotPt({x: L.clipC.x, y: L.clipC.y}, eye, swing);

    // --- labels, tags, notes
    if (L.absentTag) {
      // the dashed placeholder leaves before the tag arrives in the same place (no cross-fade)
      nodes['absent-tag'] = {opacity: r(done ? seg(u, ...W.tag) : 0, 3)};
      nodes[`m-dash-${L.side === 'a' ? 'b' : 'a'}${L.diff}`] = {opacity: r(done ? 1 - seg(u, ...W.dash) : 1, 3)};
    }
    if (L.tag) nodes.tag = {opacity: r(done ? seg(u, ...W.tag) : 0, 3)};
    if (L.issue) nodes.issue = {opacity: r(done ? seg(u, ...W.issue) : 0, 3)};
    // 16:9: the footnote sits where the arm passes, so it joins the other notes in the hold
    if (L.foot) nodes.footg = {opacity: r(L.col ? seg(u, ...W.notes) : seg(u, 0.04, 0.12), 3)};
    // the actor label names the arm while it rests by the clip; it fades while the arm travels
    // across the board (so it never sits on the moving arm) and when the hand leaves
    if (L.who) nodes.whog = {opacity: r(seg(u, 0, 0.08) * (1 - seg(a, W.enter[0], W.enter[0] + 0.04)), 3)};
    L.notes.forEach(nn => Object.assign(nodes, nn.frame(done ? seg(u, ...W.notes) : 0)));

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    let token = null;
    if (hasDiff) token = !captured ? L.tokenPt : held ? posed.lens : clipTok;
    const scanned = L.order.filter((_, j) => a >= L.arrive[j] + L.step * 0.08).length;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const semantic = {
      actorLabel: Boolean(L.who),
      beat,
      finalState: p.finalState,
      diffRow: L.diff,
      diffSide: L.side,
      scanned,
      links: links.map(v => r(v, 3)),
      absentMarked: r(absentHi, 3),
      tokenHolder: !hasDiff ? 'none' : !captured ? 'card' : held ? 'lens' : 'clip',
      clipClosed: r(close, 3),
      ghost: r(captured ? ghost : 0, 3),
      lens: P2(posed.lens),
      hand: P2(posed.hand),
      lift: r(lift, 3),
      wrist: r(posed.wrist, 1),
      lensOnBoard: posed.lens.x + L.Rl > L.I.x && posed.lens.x - L.Rl < L.I.x + L.I.w && posed.lens.y + L.Rl > L.I.y && posed.lens.y - L.Rl < L.I.y + L.I.h,
      allReached: posed.reached,
      reach: {hand: posed.reached},
      stringStyle: p.finalState === 'difference-disputed' && hasDiff && done && u >= W.dispute[1] ? 'disputed' : 'plain',
      tagShown: Boolean(L.tag) && done && u >= W.tag[1],
      actionCapped: p.actionProgress < 1 && u > capU,
    };
    if (token) semantic.token = P2(token);
    if (hasDiff) semantic.clipTok = P2(clipTok);
    return {nodes, semantic};
  },
};

/** Rotate a point about a pivot by `deg` degrees. */
function rotPt(pnt, c, deg) {
  if (!deg) return pnt;
  const a = deg * DEG;
  const dx = pnt.x - c.x, dy = pnt.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}

/**
 * Lens centre target and lift (0 = pressed on the board, 1 = carried high)
 * as a pure function of action time.
 */
function lensPath(L, a, reduced) {
  const E = ease.inOutSine;
  const hover = 0.35;
  const exitPt = offBoard(L);
  const n = L.n;
  const lastRow = L.order[n - 1];
  if (a < W.enter[0]) return {target: L.clipC, lift: hover};
  if (a < W.scan[0]) {
    // from the clip down to the seam at the first row to compare
    const k = E(seg(a, W.enter[0], W.enter[1]));
    const p0 = L.clipC, p1 = L.seamAt(L.order[0]);
    const mid = {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2};
    return {target: bez(p0, mid, p1, k), lift: hover + 0.25 * Math.sin(Math.PI * k)};
  }
  if (a < W.scan[1]) {
    // row by row: dwell (first half of each slot) then glide to the next row
    const j = Math.min(n - 1, Math.floor((a - W.scan[0]) / L.step));
    const local = (a - L.arrive[j]) / L.step;
    const here = L.seamAt(L.order[j]);
    if (j === n - 1 || local < 0.5) return {target: here, lift: hover};
    const next = L.seamAt(L.order[j + 1]);
    const k = E(seg(local, 0.5, 1));
    return {target: {x: here.x, y: lerp(here.y, next.y, k)}, lift: hover};
  }
  if (L.diff < 0) {
    // nothing to extract: back over the clip, then out of the frame
    if (a < W.leave[0]) {
      const k = E(seg(a, W.scan[1], W.carry[1]));
      return {target: bez(L.seamAt(lastRow), {x: (L.geo.seam + L.clipC.x) / 2, y: Math.min(L.seamAt(lastRow).y, L.clipC.y)}, L.clipC, k), lift: hover + 0.3 * Math.sin(Math.PI * k)};
    }
    const k = E(seg(a, ...W.leave));
    return {target: mixPt(L.clipC, exitPt, k), lift: hover + 0.3 * k};
  }
  const tok = L.tokenPt;
  const rowSeam = L.seamAt(L.diff);
  if (a < W.back[1]) {
    // back along the seam to the distinguishing row, then over onto its token
    const k = seg(a, ...W.back);
    const from = L.seamAt(lastRow);
    if (k < 0.6) {
      const kk = E(k / 0.6);
      return {target: {x: from.x, y: lerp(from.y, rowSeam.y, kk)}, lift: hover};
    }
    const kk = E((k - 0.6) / 0.4);
    return {target: mixPt(rowSeam, tok, kk), lift: hover};
  }
  if (a < W.capture) return {target: tok, lift: hover * (1 - E(seg(a, ...W.press)))};
  if (a < W.carry[1]) {
    const k = E(seg(a, ...W.carry));
    const lift = reduced ? Math.min(1, k * 3) * (k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2 * 0.4) : Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.4 + clamp(k * 4) * 0.6 * (1 - clamp((k - 0.75) / 0.25) * 0.5);
    return {target: bez(tok, L.carryCtrl, L.clipC, k), lift: clamp(lift)};
  }
  if (a < W.release) return {target: L.clipC, lift: 0.7 * (1 - E(seg(a, ...W.drop)))};
  if (a < W.leave[0]) return {target: L.clipC, lift: 0.1 * E(seg(a, W.release, W.leave[0]))};
  const k = E(seg(a, ...W.leave));
  return {target: mixPt(L.clipC, exitPt, k), lift: 0.1 + 0.4 * k};
}

/** Arm entry direction: from below in 16:9, from the nearer of the right/bottom edges otherwise. */
function psiAt(L, pt) {
  return L.col ? entryAngle(pt, L.I, {right: 60, bottom: 80, soft: 200}) : entryAngle(pt, L.I, {right: 22, bottom: 76, soft: 140});
}

/** A point outside the visible canvas (lens fully past the picture edge) toward the arm's side. */
function offBoard(L) {
  const c = L.clipC;
  const I = L.canvas;
  // 16:9 leaves downwards (the arm comes from below); tall boxes leave to the right
  const ang = L.exitAng;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let t = Infinity;
  if (dx > 1e-6) t = Math.min(t, (I.x + I.w - c.x) / dx);
  if (dy > 1e-6) t = Math.min(t, (I.y + I.h - c.y) / dy);
  const d = t + L.Rl + 30;
  return {x: c.x + dx * d, y: c.y + dy * d};
}

const mixPt = (p0, p1, k) => ({x: lerp(p0.x, p1.x, k), y: lerp(p0.y, p1.y, k)});
const bez = (p0, c, p1, k) => ({x: (1 - k) * (1 - k) * p0.x + 2 * (1 - k) * k * c.x + k * k * p1.x, y: (1 - k) * (1 - k) * p0.y + 2 * (1 - k) * k * c.y + k * k * p1.y});

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-03-story',
    title: 'Distinguishing cases — a magnifier lifts out the differing fact',
    titleEs: 'Distinción de casos — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Distinción de casos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down pin board: two case cards pinned edge to edge, one pictogram token per fact facing its twin across the seam. An analyst slides a magnifier (its glass shows a real enlarged copy) along the seam; matching rows snap a chain link, the row with a missing fact breaks. The magnifier lifts that fact out and drops it into a clip hanging from the rule card (text as supplied). No ruling on the rule is shown.',
    tags: ['reasoning', 'distinguishing', 'cases', 'magnifier', 'facts', 'rule', 'difference', 'present', 'absent', 'pin board', 'hand'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/distincion-de-casos.js', 'src/animations/causation/kits/place.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: DC_STRINGS,
  scene,
});
