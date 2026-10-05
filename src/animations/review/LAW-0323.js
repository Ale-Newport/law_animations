/**
 * LAW-0323 — Identificación de motivo · contrast
 *
 * Storyboard (two complete copies of the same generic examination room seen
 * from above — the same party with the same magnifier resting on the same
 * table, the same numbered placeholder apartados, the same label board with its
 * two empty places and the same wall calendar — side by side on wide frames, one
 * above the other on tall ones; the shared facts are drawn once, in one panel;
 * the decision carries ONLY supplied placeholder text):
 *  0.00–0.17  base: both rooms identical; both boards empty; nobody moves.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same moment: in A the label card A (●, "Factual discrepancy" by
 *             default) settles on A's place on the board, in B the label card B
 *             (◆, "Legal question raised") on B's place — a different card, glyph
 *             and place, its glyph drawn large. Each header names its scenario.
 *  0.40–0.77  the same action runs in both rooms, at the same pace: the party
 *             takes the magnifier and walks along the table with it; the lens
 *             stops over the SAME supplied apartados in both rooms and the same
 *             neutral frame settles; the magnifier is laid back; then a line runs
 *             from the room's card to the located apartados (as supplied).
 *  0.77–1.00  a guide links the card in A with the card in B through the free
 *             channel above the rooms; neutral note and key. Neither label is
 *             stronger, neither says the apartado is wrong; no outcome.
 * @module animations/review/LAW-0323
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {polyline} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {pxPerUnit, layoutRows, R2, textAt, placeLabels, FONT} from '../hearings/kits/apertura-audiencia.js';
import {stateGlyph} from '../hearings/kits/hearings-art.js';
import {imFields, IM_EN, IM_ES, localisedIm, resolveIm, imRows, imRowNode, imRoom, imTiming, imDrawAt, imScan, locatedOf, composeIm, measureRowIm, fitIm} from './kits/identificacion-motivo.js';

const ID = 'LAW-0323';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {card: [0.2, 0.3], tags: [0.2, 0.26], fact: [0.22, 0.28], reach: [0.4, 0.44], lift: [0.44, 0.465], scan: [0.465, 0.66], put: [0.66, 0.68], release: [0.68, 0.71], links: [0.69, 0.76], guide: [0.78, 0.85], guideRow: [0.8, 0.84]};
const SCAN = {reach: W.reach, lift: W.lift, scan: W.scan, put: W.put, release: W.release};

const OWN_EN = {
  routes: {located: [2]},
  locatedCaption: 'Located section (as supplied)',
  scenarioA: {label: 'Label attached'},
  scenarioB: {label: 'Label attached'},
  changedFact: 'Only the label the party attaches to the same located section differs',
  sharedFacts: [],
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'Neither label is stronger; nothing is evaluated'},
};
const OWN_ES = {
  routes: {located: [2]},
  locatedCaption: 'Apartado localizado (según lo aportado)',
  scenarioA: {label: 'Etiqueta aportada'},
  scenarioB: {label: 'Etiqueta aportada'},
  changedFact: 'Solo cambia la etiqueta que la parte asigna al mismo apartado localizado',
  sharedFacts: [],
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Ninguna etiqueta pesa más; no se evalúa nada'},
};
const EN = {...IM_EN, ...OWN_EN};
const ES = {...IM_ES, ...OWN_ES};

const {routes: _routes, ...sharedFields} = imFields;
const sceneSchema = {
  ...sharedFields,
  routes: obj('The apartados the magnifier locates — the SAME in both rooms (indices in `decisions.sections`, as supplied); in A the line runs to them from label A, in B from label B', {
    located: list('Apartados located in both rooms (as supplied)', int('Index in `decisions.sections`', 0, 3), 1, 3),
  }, ['located']),
  locatedCaption: str('Caption of the neutral frame of a located apartado (the same in both rooms)', 70),
  scenarioA: obj('Scenario A: label A (●) settles on its place and is linked to the located apartados; its header reads "<label>: <text of label A>", with an optional caption', {label: str('Name of scenario A (as supplied)', 50), caption: str('Optional one-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: label B (◆) settles on its place and is linked to the located apartados; its header reads "<label>: <text of label B>", with an optional caption', {label: str('Name of scenario B (as supplied)', 50), caption: str('Optional one-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 130),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 80), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the two label cards', 70), neutral: str('Neutral note (nothing follows from the difference)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedIm(ctx, EN, ES);
    // (the same apartados are located in both rooms: in A they are linked to label A, in B to label B)
    const loc = (P.routes && P.routes.located) || [0];
    P.links = {a: loc, b: loc};
    const R = resolveIm(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // ---- shared panel rows (drawn once); each room's header names its scenario and the heading of the section laid
    // out in it; the rooms carry no text
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      rows.push(...imRows(R, P, 'lg'));
      rows.push({kind: 'legend', glyphKind: 'located', text: P.locatedCaption, name: 'lg-located'});
    }
    if (showAll) {
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      P.sharedFacts.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'same', text: tx, name: `shared${i}`}));
    }
    if (showKey) rows.push({kind: 'text', bold: true, text: P.changedFact, name: 'changed-fact'});
    if (showAll) rows.push({kind: 'legend', glyphKind: 'guide', text: P.comparisonLabels.guide, name: 'guide-row'});
    if (showAll) rows.push({kind: 'text', text: P.comparisonLabels.neutral, name: 'neutral'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const gap = 30;
    const frameHD = ctx.view.height / fitDesign(ctx.view, D.w, D.h).scale;
    const frameWD = ctx.view.width / fitDesign(ctx.view, D.w, D.h).scale;
    // ---- headers (A / B): lane disc + the side's glyph + label (and caption), at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      const fits = ['scenarioA', 'scenarioB'].map((k, j) => fitIm(`${P[k].label}: ${R.args[j ? 'b' : 'a'].text}${P[k].caption ? ` · ${P[k].caption}` : ''}`, {maxWidth: Math.max(80, w - disc * 2 - F * 1.6), size: F, minSize: F, maxLines: 4, weight: 500}));
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale) => {
      const chan = 28, side = arr === 'row' ? 0 : 40;
      const rgap = arr === 'row' && shape === 'square' ? 2 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      // (the rooms carry no text: their cards show placeholder bars; the apartados keep their numbers, keyed to the panel)
      // (the sheets spaced so that the magnifier at rest lies clear of the located frames on either side of its gap)
      const C = composeIm(ctx, P, R, box, F, {scale, chips: false, text: false, numbers: showKey, walk: true, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}, exStep: 146, lupaDx: -2, plateH: 80});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      // (item 18: side by side, each room keeps >= 0.40 of the frame's width — the text goes to a band below the rooms)
      if (arr === 'row' && shape === 'landscape' && C.planRect.w / frameWD < 0.4) problems.push('room-narrow');
      const G = C.G;
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      // number badges beside each participant (keyed to the shared panel), placed in A and copied to B
      const badgeR = F * 0.78;
      let badges = [];
      if (showKey) {
        // (the walking party's badge first — it travels with the party, so its whole sweep must stay clear —; then the
        // others' badges keep off the lane the party and its badge sweep)
        const item = sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: C.toD(G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: G.seats[sp.index].angle, maxGap: 48, gaps: [4, 8, 12, 16, 24, 34, 48]});
        const anchors = R.speakers.map(sp => C.toD(G.seats[sp.index]));
        const me = R.speakers.find(sp => sp.index === R.reader);
        const r0 = placeLabels([item(me)], {bounds: C.bounds, circles: C.people, boxes: C.equip, anchors});
        for (const f of r0.fails) problems.push(`badge-${f}`);
        const d0 = (G.walk.min - G.Cx) * C.k, d1 = (G.walk.max - G.Cx) * C.k;
        const pc = C.people[R.reader];
        const lane = [{x: pc.x + d0 - pc.rad - 20 * C.k, y: pc.y - pc.rad, w: d1 - d0 + 2 * pc.rad + 40 * C.k, h: 2 * pc.rad}];
        const bb = r0.labels[0] && r0.labels[0].box;
        if (bb) {
          const sw = {x: bb.x + d0, y: bb.y, w: bb.w + d1 - d0, h: bb.h};
          lane.push(sw);
          const hit = (a, c, pad = 4) => a.x < c.x + c.w + pad && c.x < a.x + a.w + pad && a.y < c.y + c.h + pad && c.y < a.y + a.h + pad;
          if (sw.x < C.bounds.x || sw.x + sw.w > C.bounds.x + C.bounds.w || C.equip.some(q => hit(sw, q))) problems.push('badge-walk');
          if (R.speakers.some(sp => sp.index !== R.reader && (() => { const c = C.people[sp.index]; return hit(sw, {x: c.x - c.rad, y: c.y - c.rad, w: 2 * c.rad, h: 2 * c.rad}); })())) problems.push('badge-walk-person');
        }
        const others = R.speakers.filter(sp => sp.index !== R.reader);
        const r1 = placeLabels(others.map(item), {bounds: C.bounds, circles: C.people, boxes: [...C.equip, ...lane], anchors, placed: bb ? [bb] : []});
        for (const f of r1.fails) problems.push(`badge-${f}`);
        badges = [r0.labels[0], ...r1.labels].filter(Boolean);
      }
      return {C, problems, hd, box, shift, roomsW, roomH, chan, side, badges, badgeR, arr, area};
    };
    const arrangements = [];
    if (shape === 'landscape') {
      for (const cf of [0.22, 0.26, 0.3]) arrangements.push({arr: 'row', panel: 'column', cf});
      for (const cols of [3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
    } else if (shape === 'portrait') {
      for (const cols of [2, 3]) arrangements.push({arr: 'col', panel: 'band', cols});
    } else {
      for (const cols of [2, 3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
      for (const cf of [0.3, 0.36, 0.42]) arrangements.push({arr: 'col', panel: 'column', cf});
    }
    let best = null;
    const log = [];
    // standing people floors: >= 60 px; 1:1 contrast >= 55 px for every preset (composed to 57 for margin). Only when
    // no 1:1 composition reaches it (the long-labels stress load) does the stress floor of 45 px apply.
    const floors = shape === 'square' ? [[57, 19.5], [55.3, 19.5], [55.3, 0], [45, 0]] : [[61, 0]];
    const lay = (ms, box, F, cols) => { const L = layoutRows(ms, box, F, cols, 28); if (ms.some(m => m.lone)) L.ok = false; return L; };
    for (const [minPerson, minText] of floors) {
      if (best && !best.problems.length) break;
      best = null;
      for (const force of [false, true]) {
        if (best) break;
        for (const Fpx of (force ? [16.4] : [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4])) {
          const F = Fpx / px;
          let good = false;
          for (const A of arrangements) {
            let L0 = null, area = {x: 0, y: 0, w: D.w, h: D.h};
            const extra = [];
            if (rows.length) {
              if (A.panel === 'column') {
                const pw = D.w * A.cf;
                const ms = rows.map(rw => measureRowIm(rw, F, pw));
                const probe = lay(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1);
                if (!probe.ok || probe.usedH > D.h) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: D.w - pw, y: Math.max(0, (D.h - probe.usedH) / 2), w: pw, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, 1, 28);
                area = {x: 0, y: 0, w: D.w - pw - gap, h: D.h};
              } else {
                const colW = (D.w - 28 * (A.cols - 1)) / A.cols;
                const ms = rows.map(rw => measureRowIm(rw, F, colW));
                const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, A.cols);
                if (!probe.ok || probe.usedH > D.h * (shape === 'square' ? 0.53 : 0.45)) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, A.cols, 28);
                area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
              }
            }
            for (const scale of [1, 1.15, 1.3]) {
              const cc = compose(area, A.arr, F, scale);
              const personPx = 100 * cc.C.k * px;
              cc.problems.push(...extra);
              if (personPx < minPerson) cc.problems.push('people-small');
              if (Fpx < minText) cc.problems.push('text-below-baseline');
              const score = -1000 * cc.problems.length + (Fpx >= 19.5 ? 500 : 0) + (personPx >= 55 ? 450 : 0) + Math.min(personPx, 110) + 3 * Fpx;
              log.push(`${Fpx} ${A.arr}/${A.panel}${A.cf || A.cols} s${scale} ${personPx.toFixed(2)} ${cc.problems.join('+')}`);
              const cand = {...cc, F, lay: L0, score, personPx, A};
              if (!best || score > best.score) best = cand;
              if (!cc.problems.length && personPx >= 70 && Fpx >= 19.5) good = true;
              if (!cc.problems.length) break;
            }
          }
          if (good) break;
        }
      }
    }
    const {C, F, hd, shift, badges, badgeR, arr} = best;
    const G = C.G;
    const problems = [...best.problems];
    // the same time in both rooms; in A section A is laid out and linked, in B section B
    const nMax = Math.max(R.links.a.length, R.links.b.length);
    const TM = imTiming(W.links[0], W.links[1], nMax, {together: true});
    const located = locatedOf(G);
    const roomA = imRoom(ctx, G, {prefix: 'ra', R, Ft: null, numFt: G.numFt, sides: ['a'], cardsIn: true, bigGlyph: true, located});
    const roomB = imRoom(ctx, G, {prefix: 'rb', R, Ft: null, numFt: G.numFt, sides: ['b'], cardsIn: true, bigGlyph: true, located});
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      return {letter, x: plan.x + sx, y: plan.y - best.chan - hd.h + sy, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from the top edge of card A in room A up into the channel above room A, along it, and down onto the top
    // edge of card B in room B; stacked, it runs down the right margin between the two rooms
    const cA = C.toD({x: G.card.a.x + G.card.a.w * 0.5, y: G.board.y});
    const cB = C.toD({x: G.card.b.x + G.card.b.w * 0.5, y: G.board.y});
    const gy = plan.y - best.chan / 2;
    let pts;
    if (arr === 'row') pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cB.x + shift.x, y: gy}, {x: cB.x + shift.x, y: cB.y}];
    else {
      const cx = plan.x + plan.w + best.side / 2;
      pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: cB.x, y: gy + shift.y}, {x: cB.x, y: cB.y + shift.y}];
    }
    const guide = polyline(pts);
    return {P, R, F, px, C, G, TM, located, lay: best.lay, headers, roomA, roomB, shift, badges, badgeR, arr, guide, pts, log, problems, personPx: best.personPx, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => imRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const badgeNode = (b, name, dx, dy) => g({name},
      h('circle', {cx: r(b.box.x + b.box.w / 2 + dx), cy: r(b.box.y + b.box.h / 2 + dy), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
      h('text', {x: r(b.box.x + b.box.w / 2 + dx), y: r(b.box.y + b.box.h / 2 + dy + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)));
    const lanes = [th.accent2, th.accent4];
    return g(null,
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node),
      // (each badge in a wrapper that travels with its participant: only the walking party's moves)
      L.badges.map(b => [g({name: `bwA${b.key.slice(1)}`, transform: 'translate(0 0)'}, badgeNode(b, `bA${b.key.slice(1)}`, 0, 0)), g({name: `bwB${b.key.slice(1)}`, transform: 'translate(0 0)'}, badgeNode(b, `bB${b.key.slice(1)}`, L.shift.x, L.shift.y))]),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        h('text', {x: r(hd.x + hd.disc), y: r(hd.y + hd.disc + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, hd.letter),
        // the scenario (its side's glyph + label) arrives with the introduced difference
        g({name: `hdr${hd.letter}-state`, opacity: 0},
          stateGlyph(ctx, {name: `hdr${hd.letter}-cue`, kind: j ? 'diamond' : 'dot', cx: hd.x + hd.disc * 2 + L.F * 0.55, cy: hd.y + hd.disc, s: L.F * 0.3, fill: th.dark ? th.fg : '#1f2328'}),
          textAt(hd.fit, hd.x + hd.disc * 2 + L.F * 1.1, hd.y + Math.max(0, hd.disc - hd.fit.height / 2), th.fg)))),
      h('path', {name: 'guide', 'data-draw': 1, d: L.guide.d(1), fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 10)}`, 'stroke-dashoffset': r(L.guide.total), opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const e = ease.inOutCubic;
    const tags = seg(u, ...W.tags);
    // introduce: in each room its own label card settles on its place on the board (the same moment, the same pace)
    const cardIn = e(seg(u, ...W.card));
    // the same action in both rooms: the magnifier carried along the table, the same apartados located, then the line
    const sc = imScan(G, L.located, SCAN, u, {sweep: false});
    const sA = imDrawAt(G, L.TM, u, {sides: ['a']});
    const sB = imDrawAt(G, L.TM, u, {sides: ['b']});
    const cf = s => ({x: G.card[s].x + G.card[s].w / 2, y: G.card[s].y + G.card[s].h / 2});
    const common = {reach: sc.reach, lupa: sc.lens, readerX: sc.readerX, loc: sc.loc};
    const fa = L.roomA.frame({...common, draw: sA.draw, cardIn: {a: cardIn, b: 0}, cardFrom: cf('a')});
    const fb = L.roomB.frame({...common, draw: sB.draw, cardIn: {a: 0, b: cardIn}, cardFrom: cf('b')});
    Object.assign(nodes, fa.nodes, fb.nodes);
    const dx = (sc.readerX - G.Cx) * C.k;
    L.badges.forEach(b => { const i = +b.key.slice(1); const t = `translate(${r(i === R.reader ? dx : 0, 2)} 0)`; nodes[`bwA${i}`] = {transform: t}; nodes[`bwB${i}`] = {transform: t}; });
    L.headers.forEach(hd => { nodes[`hdr${hd.letter}-state`] = {opacity: r(tags, 3)}; });
    const guideP = seg(u, ...W.guide);
    nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    // (the shared facts: everybody's place, the party's walk, the magnifier's path, the located frames and the apartados;
    // the contrasted item is which label card settles and is linked)
    const people = R.speakers.map(sp => R2(C.toD(G.seats[sp.index])));
    const look = () => JSON.stringify({p: people, x: r(sc.readerX, 2), l: R2(C.toD(sc.lens)), ls: r(sc.lens.s, 3), loc: L.located.map(i => r(sc.loc[i] ?? 0, 3)), ex: G.exhibits.map(q => R2(C.toD({x: q.cx, y: q.cy})))});
    const handOf = (fr, s, sh) => { const q = fr.hands[R.reader]; if (!q) return null; const d = C.toD(q); return R2({x: d.x + sh.x, y: d.y + sh.y}); };
    return {
      nodes,
      semantic: {
        beat,
        lookA: look(),
        lookB: look(),
        tags: r(tags, 3),
        cardA: r(cardIn, 3),
        cardB: r(cardIn, 3),
        cardState: cardIn <= 0 ? 'none' : cardIn < 1 ? 'coming' : 'placed',
        lupaPhase: sc.phase,
        carry: r(sc.carry, 3),
        reaching: r(sc.k, 3),
        located: L.located,
        locK: L.located.map(i => r(sc.loc[i] ?? 0, 3)),
        lupa: R2(C.toD(sc.lens)),
        party: R2(C.toD({x: sc.readerX, y: G.seats[R.reader].y})),
        drawA: sA.draw.a.map(q => r(q, 3)),
        drawB: sB.draw.b.map(q => r(q, 3)),
        offA: sA.draw.b.map(q => r(q, 3)),
        offB: sB.draw.a.map(q => r(q, 3)),
        linkStateA: sA.state,
        linkStateB: sB.state,
        linksA: G.links.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        guide: r(guideP, 3),
        handA: handOf(fa, 'a', {x: 0, y: 0}),
        handB: handOf(fb, 'b', L.shift),
        allReached: fa.reached && fb.reached,
        reader: R.reader,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        arrangement: L.arr,
        order: R.order.join('>'),
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
    slug: 'review-01-contrast',
    title: 'Identifying a ground — the same located section labelled a factual discrepancy or a legal question raised, in two identical rooms',
    titleEs: 'Identificación de motivo — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Identificación de motivo',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic examination rooms: the same party with the same magnifier at the same table, the same numbered placeholder sections and the same empty label board. At the same moment the one supplied difference is introduced: in A the label card "Factual discrepancy" (●) settles on its place on the board, in B the card "Legal question raised" (◆) on its own place — neutral labels supplied by the party, of equal weight, their glyph drawn large. The same action then runs in both rooms at the same pace: the party carries the magnifier along the table, the lens stops over the same supplied section and the same neutral frame settles, the magnifier is laid back, and a line runs from the room\'s card to that section. A guide links the two cards. Illustrative; the decision carries only placeholder text; neither label is stronger, no section is said to be wrong and no outcome is drawn.',
    tags: ['review', 'challenge as supplied', 'magnifier', 'contrast', 'two rooms', 'factual discrepancy', 'legal question raised', 'placeholder text', 'as supplied', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/identificacion-motivo.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
