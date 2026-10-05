/**
 * LAW-0511 — Ley y foro pactados · contrast
 *
 * Storyboard (two identical boards; side by side on wide boxes, one above the other on tall ones):
 *  0.00–0.17  base: each board — badge "A" / "B" — shows the same two plaques on top ("Law X (fictional)", "Forum Y
 *             (fictional)") and the same contract card below with two separate clause bands ("Clause 14 · Choice of law",
 *             "Clause 15 · Choice of forum"). On each band stands its own signpost, its board resting level (pointing
 *             outward). A loupe waits beside each card. Both boards are identical.
 *  0.17–0.35  the one changed fact: which clause is examined. The loupe moves onto that band and the band lights — A: the
 *             choice-of-law clause, B: the choice-of-forum clause (default).
 *  0.35–0.70  in each board only the examined clause's signpost swings up to its own plaque and a sight line is drawn to
 *             it (same pace in both boards); the other signpost stays level and untouched.
 *  0.70–1.00  hold: a guide rings the examined clause band in both boards; the note "Only the clause examined differs;
 *             the other clause stays at rest" and the key "As supplied · no conclusion drawn".
 * No conflict-of-laws or jurisdiction doctrine, no real places or courts, no validity, effect, priority or outcome, no
 * preference between the boards (same size, weight and timing); neither clause decides the other.
 * @module animations/contract-terms/LAW-0511
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, KINDS, contractField, clausesField, destinationsField, localizeScene, unitPx, fitG, chipG, txt,
  glyphDisc, plaque, plaqueTop, stackedPlaqueH, loupe, loupeBox, laneColor, laneSoft, letterBadge, sightLine, sightFrame, toDeg,
} from './kits/ley-y-foro.js';

const ID = 'LAW-0511';
const DURATION = 6500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.35], consequence: [0.35, 0.7], hold: [0.7, 1]};
const W = {loupe: [0.18, 0.27], band: [0.26, 0.32], swing: [0.36, 0.5], line: [0.49, 0.62], rim: [0.61, 0.66], back: [0.6, 0.69], guide: [0.7, 0.75], note: [0.73, 0.78], key: [0.75, 0.8], ann: [0.77, 0.82]};
const STRINGS = {
  en: {...KIT_STRINGS.en, only: 'Only the clause examined differs; the other clause stays at rest'},
  es: {...KIT_STRINGS.es, only: 'Solo difiere la cláusula examinada; la otra queda en reposo'},
};

const sceneSchema = {
  contract: contractField,
  clauses: clausesField,
  destinations: destinationsField,
  examinedA: oneOf('The clause examined in scenario A (law or forum)', KINDS),
  examinedB: oneOf('The clause examined in scenario B (law or forum)', KINDS),
  scenarioLabels: obj('Scenario captions', {a: str('Caption of scenario A', 48), b: str('Caption of scenario B', 48)}, ['a', 'b']),
  annotations: list('Editorial callouts shown in the final hold', annotation(['a', 'b']), 0, 2),
};
const defaultParams = {...CONTENT, examinedA: 'law', examinedB: 'forum', scenarioLabels: {a: 'A · Choice of law', b: 'B · Choice of forum'}, annotations: []};
const defaultParamsEs = {...CONTENT_ES, scenarioLabels: {a: 'A · Elección de ley', b: 'B · Elección de foro'}};

const isStress = p => [p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum, p.scenarioLabels.a, p.scenarioLabels.b].some(t => t.length > 38) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const side = ctx.view.shape !== 'portrait';
  const rowsB = ctx.view.shape === 'square';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14, gapS = 36;
  const notes = [];
  if (show) notes.push({name: 'only', kind: 'note0', text: ctx.t.only});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const gap = 12;
  const cols = notes.length > 1 && side ? Math.min(notes.length, ctx.view.shape === 'landscape' ? 3 : 2) : 1;
  const cw = (D.w - pad * 2 - gap * (cols - 1)) / cols;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'note0' ? ctx.theme.accentSoft : '#ffffff'});
  const rowsN = Math.ceil(notes.length / cols);
  const sizes = notes.map(q => chipOf(q, 0, 0, cw).box.h);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const avail = {x: pad, y: pad + 6, w: D.w - pad * 2, h: D.h - pad * 2 - 6 - (nh ? nh + 20 : 0)};
  const sc = side
    ? [{x: avail.x, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}, {x: avail.x + (avail.w + gapS) / 2, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}]
    : [{x: avail.x, y: avail.y, w: avail.w, h: (avail.h - gapS) / 2}, {x: avail.x, y: avail.y + (avail.h + gapS) / 2, w: avail.w, h: (avail.h - gapS) / 2}];
  const S = sc[0];
  const badgeR = Math.max(F * 0.95, 20);
  const capFits = ['a', 'b'].map(k => fitG(p.scenarioLabels[k], {maxWidth: S.w - badgeR * 2 - 24, size: F, minSize: minF, maxLines: 1, weight: 800}));
  const headH = badgeR * 2 + 12;
  const discR = clamp(F * 1.0, 18, 26);
  const pR = discR * 1.6;
  const pw = (S.w - 28) / 2;
  const pFits = KINDS.map(k => fitG(p.destinations[k], {maxWidth: pw - 32, size: F, minSize: F, maxLines: 3, weight: 800}));
  const ph = stackedPlaqueH(pR, pFits[0].height > pFits[1].height ? pFits[0] : pFits[1]);
  const top = plaqueTop(pw);
  const plY = headH + top + 6;
  const plq = KINDS.map((k, i) => ({kind: k, x: i * (pw + 28), y: plY, w: pw, h: ph, fit: pFits[i]}));
  // contract card at the bottom: head + two bands side by side
  const bw = rowsB ? S.w - 36 : (S.w - 36 - 16) / 2;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: S.w - 40, size: F, minSize: minF, maxLines: stress ? 2 : 1, weight: 800});
  const bFits = KINDS.map(k => fitG(p.clauses[k], {maxWidth: bw - 24 - discR * 2 - 12 - 10, size: F, minSize: F, maxLines: 3, weight: 700}));
  const bandH = Math.max(bFits[0].height, bFits[1].height, discR * 2) + 30;
  const cardH = head.height + 26 + (rowsB ? 2 * bandH + 12 : bandH) + 22;
  const card = {x: 0, y: S.h - cardH - 4, w: S.w, h: cardH};
  const bands = KINDS.map((k, i) => (rowsB
    ? {kind: k, x: 18, y: card.y + head.height + 26 + i * (bandH + 12), w: bw, h: bandH, fit: bFits[i]}
    : {kind: k, x: 18 + i * (bw + 16), y: card.y + head.height + 26, w: bw, h: bandH, fit: bFits[i]}));
  // signposts: post from the band top up to the pivot; board rests level pointing outward
  const pivY = plY + ph + (card.y - (plY + ph)) * 0.62;
  const postX = i => (rowsB ? plq[i].x + plq[i].w / 2 : bands[i].x + bands[i].w / 2);
  const postLen = card.y - pivY;
  const boardL = Math.max(40, Math.min(clamp(S.w * 0.26, 90, 220), (pivY - plY - ph) * 0.8, pivY - plY - ph - 44));
  if (postLen < 70) why.push('post');
  const posts = bands.map((b, i) => {
    const piv = {x: postX(i), y: pivY};
    const P = plq[i];
    const port = {x: P.x + P.w / 2, y: P.y + P.h + 8};
    const restA = i === 0 ? 180 : 0;
    const ta = toDeg(piv, port);
    let delta = ta - restA; while (delta > 180) delta -= 360; while (delta <= -180) delta += 360;
    const rad = (ta * Math.PI) / 180;
    const lineA = {x: piv.x + Math.cos(rad) * (boardL + 6), y: piv.y + Math.sin(rad) * (boardL + 6)};
    return {kind: b.kind, piv, port, restA, delta, lineA};
  });
  if (posts.some(q => Math.hypot(q.port.x - q.lineA.x, q.port.y - q.lineA.y) < 24)) why.push('line-short');
  const LR = clamp(discR * 2.2, 40, 66);
  const loupeRest = {x: S.w / 2 - LR * 0.5, y: pivY + (card.y - pivY) * 0.15};
  const reads = bands.map(b => ({x: b.x + 24 + discR, y: b.y + bandH / 2}));
  if ([...capFits, ...pFits, head, ...bFits].some(f => f.bad)) why.push('text');
  if (card.y < plY + ph + 140) why.push('board-small');
  let notesPl = null;
  if (notes.length) {
    let ny = D.h - pad - nh;
    notesPl = [];
    for (let k = 0; k < rowsN; k++) {
      let rh = 0;
      notes.slice(k * cols, k * cols + cols).forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny, cw); if (c.bad) why.push('note-text'); rh = Math.max(rh, c.box.h); notesPl.push({q, c}); });
      ny += rh + gap;
    }
  }
  return {ok: !why.length, why, rowsB, F, minF, side, sc, badgeR, capFits, headH, discR, pR, plq, top, head, card, bands, posts, boardL, LR, loupeRest, reads, notesPl};
}

const examined = (p, w) => (w === 'a' ? p.examinedA : p.examinedB);

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [25, 23, 21.5, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const board = (k, P) => {
      const S = L.sc[k];
      const C = L.card;
      return g({transform: T(S.x, S.y)},
        letterBadge(ctx, P, L.badgeR, L.badgeR + 2, L.badgeR),
        show ? txt(L.capFits[k], {x: L.badgeR * 2 + 14, y: L.badgeR + 2 - L.capFits[k].height / 2, fill: th.fg}) : null,
        L.plq.map((q, i) => g({transform: T(q.x, q.y)},
          plaque(ctx, {kind: q.kind, w: q.w, h: q.h, fit: q.fit, showText: show, discR: L.pR, stack: true}),
          h('path', {name: `${P}-rim${i}`, d: roundRectPath(-8, -8, q.w + 16, q.h + 16, 14), fill: 'none', stroke: laneColor(ctx, q.kind), 'stroke-width': 5, opacity: 0}))),
        L.posts.map((q, i) => sightLine(ctx, `${P}-line${i}`, q.lineA, q.port, laneColor(ctx, q.kind))),
        // signposts
        L.posts.map((q, i) => {
          const b = L.bands[i];
          const bt = Math.max(22, L.boardL * 0.36);
          return g(null,
            h('rect', {x: r(q.piv.x - 9), y: r(q.piv.y), width: 18, height: r(L.card.y - q.piv.y + 6), rx: 4, fill: '#8a6a45', stroke: INK, 'stroke-width': 2}),
            g({name: `${P}-sign${i}`, transform: `${T(q.piv.x, q.piv.y)} rotate(${q.restA})`},
              h('path', {d: `M-14 ${r(-bt / 2)}H${r(L.boardL - bt * 0.6)}L${r(L.boardL)} 0L${r(L.boardL - bt * 0.6)} ${r(bt / 2)}H-14Z`, fill: laneSoft(ctx, q.kind), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
              h('path', {d: `M0 ${r(-bt * 0.18)}H${r(L.boardL - bt * 0.9)}M0 ${r(bt * 0.18)}H${r(L.boardL * 0.6)}`, stroke: laneColor(ctx, q.kind), 'stroke-width': 3, 'stroke-linecap': 'round'})),
            h('circle', {cx: r(q.piv.x), cy: r(q.piv.y), r: 11, fill: '#3b4148', stroke: INK, 'stroke-width': 1.6}),
          );
        }),
        // contract card
        h('rect', {x: r(C.x + 8), y: r(C.y + 10), width: r(C.w), height: r(C.h), rx: 12, fill: th.shadow}),
        h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 12), fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.6}),
        h('path', {d: roundRectPath(C.x + 2, C.y + 2, C.w - 4, L.head.height + 16, 10), fill: th.accent4Soft}),
        show ? txt(L.head, {x: C.x + 18, y: C.y + 10, fill: INK}) : h('path', {d: `M${r(C.x + 18)} ${r(C.y + 10 + L.head.height / 2)}h${r(C.w * 0.4)}`, stroke: '#9fb08f', 'stroke-width': 10, 'stroke-linecap': 'round'}),
        L.posts.map(q => h('path', {d: roundRectPath(q.piv.x - 16, C.y - 7, 32, 14, 5), fill: laneColor(ctx, q.kind), stroke: INK, 'stroke-width': 2})),
        L.bands.map(b => g(null,
          h('path', {name: `${P}-band-${b.kind}`, d: roundRectPath(b.x - 5, b.y - 5, b.w + 10, b.h + 10, 12), fill: laneSoft(ctx, b.kind), stroke: laneColor(ctx, b.kind), 'stroke-width': 3, opacity: 0}),
          h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 9), fill: '#ffffff', stroke: '#cfc4ae', 'stroke-width': 2}),
          h('rect', {x: r(b.x), y: r(b.y), width: 8, height: r(b.h), rx: 4, fill: laneColor(ctx, b.kind)}),
          glyphDisc(ctx, b.kind, b.x + 22 + L.discR, b.y + b.h / 2, L.discR),
          show ? txt(b.fit, {x: b.x + 22 + L.discR * 2 + 12, y: b.y + (b.h - b.fit.height) / 2, fill: INK}) : h('path', {d: `M${r(b.x + 30 + L.discR * 2)} ${r(b.y + b.h / 2)}h${r(b.w * 0.45)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
        )),
        h('path', {name: `${P}-guide`, d: roundRectPath(-12, -12, 1, 1, 1), fill: 'none', stroke: th.accent, 'stroke-width': 4.5, opacity: 0}),
        g({name: `${P}-loupe`, transform: T(L.loupeRest.x, L.loupeRest.y)}, loupe(ctx, `${P}-loupe-art`, L.LR)),
      );
    };
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'}, board(0, 'a'), board(1, 'b'), notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const look = {};
    const lq = ease.inOutCubic(seg(u, ...W.loupe)), sq = ease.inOutCubic(seg(u, ...W.swing)), lnq = ease.inOutSine(seg(u, ...W.line));
    ['a', 'b'].forEach(P => {
      const ex = examined(p, P);
      const ei = KINDS.indexOf(ex);
      const rd = L.reads[ei];
      const bq = ease.inOutCubic(seg(u, ...W.back));
      const lq2 = lq * (1 - bq);
      const lp = {x: lerp(L.loupeRest.x, rd.x, lq2), y: lerp(L.loupeRest.y, rd.y, lq2) - Math.sin(lq2 * Math.PI) * 24};
      nodes[`${P}-loupe`] = {transform: T(r(lp.x, 2), r(lp.y, 2))};
      const angs = [];
      L.posts.forEach((q, i) => {
        const on = i === ei;
        const a = q.restA + (on ? q.delta * sq : 0);
        angs.push(r(a, 1));
        nodes[`${P}-sign${i}`] = {transform: `${T(q.piv.x, q.piv.y)} rotate(${r(a, 2)})`};
        Object.assign(nodes, sightFrame(`${P}-line${i}`, q.lineA, q.port, on ? lnq : 0));
        nodes[`${P}-rim${i}`] = {opacity: r(on ? seg(u, ...W.rim) : 0, 3)};
        nodes[`${P}-band-${q.kind}`] = {opacity: r(on ? seg(u, ...W.band) : 0, 3)};
      });
      const b = L.bands[ei];
      nodes[`${P}-guide`] = {d: roundRectPath(b.x - 12, b.y - 12, b.w + 24, b.h + 24, 16), opacity: r(seg(u, ...W.guide), 3)};
      const S = L.sc[P === 'a' ? 0 : 1];
      look[P] = {loupe: {x: r(lp.x), y: r(lp.y)}, loupeW: {x: r(S.x + lp.x), y: r(S.y + lp.y)}, angs, line: on2(lnq), ex};
    });
    function on2(v) { return r(v, 3); }
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.consequence[1] ? 'consequence' : 'hold';
    const before = u < W.loupe[0];
    const lk = P => (before ? JSON.stringify({loupe: look[P].loupe, angs: look[P].angs, line: look[P].line}) : 'changed');
    const bx = s => ({x: r(s.x), y: r(s.y), w: r(s.w), h: r(s.h)});
    return {
      nodes,
      semantic: {
        beat, lookA: lk('a'), lookB: lk('b'), examinedA: p.examinedA, examinedB: p.examinedB,
        loupeA: look.a.loupeW, loupeB: look.b.loupeW, anglesA: look.a.angs, anglesB: look.b.angs,
        restAngles: L.posts.map(q => q.restA), swing: r(sq, 3), line: r(lnq, 3),
        movedA: look.a.angs.map((a, i) => a !== L.posts[i].restA), movedB: look.b.angs.map((a, i) => a !== L.posts[i].restA),
        guideShown: r(seg(u, ...W.guide), 3), keyShown: r(keyO, 3), side: L.side,
        sceneA: bx(L.sc[0]), sceneB: bx(L.sc[1]),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};
void loupeBox;

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-08-contrast',
    title: 'Agreed law and forum, without doctrine — two identical boards; only the clause examined differs, so in A the law signpost swings to its plaque and in B the forum signpost does',
    titleEs: 'Ley y foro pactados — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Ley y foro pactados',
    treatment: 'contrast',
    family: 'paired-scenes',
    description: 'Two complete, identical boards: two plaques on top ("Law X (fictional)", "Forum Y (fictional)") and the contract card below with two separate clause bands, each carrying its own signpost. One fact differs: which clause is examined (A: choice of law, B: choice of forum). In each board the loupe moves onto that band and only its signpost swings up to its own plaque, with a sight line; the other signpost stays level. A guide rings the examined band in both boards; neutral note; key "As supplied · no conclusion drawn". No doctrine, no outcome, no preference.',
    tags: ['choice of law', 'choice of forum', 'contrast', 'signposts', 'plaques', 'equal weight', 'separate clauses'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/ley-y-foro.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
