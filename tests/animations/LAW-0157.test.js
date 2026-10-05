// LAW-0157 — Regla transitoria · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (hands, roll, post, cards at 60 fps), object anchoring (the roll, the
// post and each card follow the hand that holds them), and the transformation reads with labels hidden
// (band laid, post planted, cards pinned left / right of the post, side strips by colour + pattern).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

const ID = 'LAW-0157';

contractSuite(ID, {
  continuity: ['handA', 'handB', 'roll', 'post', 'card0', 'card1', 'card2'],
  attach: [
    // A holds the roll for the whole pull and the post from lift-off to planting
    {from: 0.157, to: 0.29, a: 'handA', b: 'rollGrip', tol: 1.5},
    {from: 0.382, to: 0.478, a: 'handA', b: 'postGrip', tol: 1.5},
    // B holds each card from the grip to the pin (deal order: latest slot first → case 3, 2, 1)
    {from: 0.245, to: 0.344, a: 'handB', b: 'cardGrip2', tol: 1.5},
    {from: 0.432, to: 0.531, a: 'handB', b: 'cardGrip1', tol: 1.5},
    {from: 0.619, to: 0.718, a: 'handB', b: 'cardGrip0', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.bandProgress === 0 && s.postState === 'parked' && s.cardHolder.every(x => x === 'tray') && s.sides.every(x => x === 'neutral')", label: 'rest: band rolled up, post in its holder, cards in the tray, nothing placed'},
    {at: 0.22, fn: "s.aHolds === 'roll' && s.bandProgress > 0 && s.bandProgress < 1", label: 'A pulls the band from version 1 towards version 2'},
    {at: 0.3, fn: "s.cardHolder[2] === 'B' && s.sides.every(x => x === 'neutral')", label: 'B slides the first card; no side is shown before the post is planted'},
    {at: 0.42, fn: "s.postState === 'carried' && s.aHolds === 'post' && s.bandProgress === 1", label: 'A carries the post after the band is laid'},
    {at: 0.5, fn: "s.postState === 'planted' && s.postOnMilestone === true", label: 'the post stands at the supplied milestone'},
    {at: 0.49, fn: "s.sides[0] === 'neutral'", label: 'a card still in the tray shows no side (cause before effect)'},
    {at: 1, fn: "JSON.stringify(s.sides) === JSON.stringify(s.expectedSides) && JSON.stringify(s.expectedSides) === JSON.stringify(['before','before','after'])", label: 'final: Day 9 and Day 16 before, Day 29 after the supplied Day 20 (position only)'},
    {at: 1, fn: "JSON.stringify(s.cardsLeftOfPost) === JSON.stringify([true, true, false])", label: 'cards before the milestone lie left of the post, the card after it lies right of it'},
    {at: 1, fn: 's.notesShown === 1 && s.handOnStuff.A === 0 && s.handOnStuff.B === 0', label: 'hold: key and state shown; resting hands clear of cards, tag, notes, reading note and rack'},
    {at: 0, fn: 's.handOnStuff.A === 0 && s.handOnStuff.B === 0', label: 'rest: both hands clear of the reading note, the rack, the tag and the tray cards'},
    {at: 1, params: {cases: [{label: 'Early', day: 4}, {label: 'On the day', day: 20}, {label: 'Late', day: 31}]}, fn: "JSON.stringify(s.sides) === JSON.stringify(['before','on','after'])", label: 'a case on the milestone day is shown on the milestone, on neither side'},
    {at: 1, params: {milestone: {day: 30, label: 'supplied milestone'}}, fn: "JSON.stringify(s.sides) === JSON.stringify(['before','before','before'])", label: 'moving the supplied milestone changes only the positions compared'},
    {at: 1, params: {finalState: 'milestone-set'}, fn: "s.postState === 'planted' && s.cardHolder.every(x => x === 'tray') && s.sides.every(x => x === 'neutral')", label: 'milestone-set: post planted, cases not placed'},
    {at: 1, params: {finalState: 'band-laid'}, fn: "s.postState === 'parked' && s.bandProgress === 1 && s.cardHolder.every(x => x === 'tray')", label: 'band-laid: only the band is laid'},
    {at: 1, params: {actionProgress: 0.5}, fn: 's.actionCapped && s.bandProgress === 1 && s.cardHolder.some(x => x === "tray")', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.sides) === JSON.stringify(['before','before','after']) && s.postState === 'planted'", label: 'labels hidden: the same physical result (pattern + side of the post)'},
  ],
});

// Rendered text audit (shared harness): every supplied field drawn un-truncated at the hold; supplied text
// >= 16 px (>= 19.5 px baseline) and never smaller than the generic captions; the no-conclusion key.
suppliedTextSuite(ID, {
  fields: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, ...p.cases.map(c => c.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.tray, ...p.annotations.map(a => a.text)]',
  content: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, ...p.cases.map(c => c.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.tray]',
  captions: 'return [p.locale === "es" ? "Posiciones según lo aportado" : "Positions as supplied", ...p.annotations.map(a => a.text)]',
});

// Review items 8 / 12: at the hold in every preset × ratio (labels on and off) the resting hands lie on no card,
// tag or note; every card lies on its own side of the post (before → left, after → right).
test(`${ID}: resting hands clear; cards on their own side of the post (all presets × ratios × labels)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const rows = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `rh-${rows.length}`, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const bad = [];
      if (s.handOnStuff.A || s.handOnStuff.B) bad.push(`hands on stuff ${JSON.stringify(s.handOnStuff)}`);
      if (s.sidesKept) s.expectedSides.forEach((side, i) => {
        if (side === 'before' && s.cardsLeftOfPost[i] !== true) bad.push(`card ${i} (before) not left of the post`);
        if (side === 'after' && s.cardsLeftOfPost[i] !== false) bad.push(`card ${i} (after) not right of the post`);
      });
      if (!s.allReached) bad.push('unreached');
      // reader chips are drawn above the arms: an arm reaching past never covers its own name
      for (const k of ['A', 'B']) {
        const chip = x.element.querySelector(`[data-node="dk-chip${k}"]`), arm = x.element.querySelector(`[data-node="dk-arm${k}"]`);
        if (chip && arm && !(arm.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING)) bad.push(`chip ${k} drawn under its arm`);
      }
      rows.push({preset: pr.name, tv, w, h, bad});
      x.destroy();
      el.remove();
    }
    return rows;
  }, [ID, presets]);
  expect(out.filter(r => r.bad.length), JSON.stringify(out.filter(r => r.bad.length))).toEqual([]);
});

// Review round 2: a RESTING arm (sleeve, cuff, hand, thumb) covers no text drawn beneath it — the rack, the
// reading note (heading included), the tag, the cards, the tray label — in every preset × ratio.
// Rest frames: both readers at the start, reader A after handing over the post, both at the hold.
test(`${ID}: resting arms cover no text (rack, reading note, tag, cards, tray) — all presets × ratios`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const rows = [];
    const covered = (root, k) => {
      const parts = [...root.querySelectorAll(`[data-node^="dk-arm${k}-"]`)];
      if (!parts.length) return [];
      const arm = parts[0];
      const shapes = parts.flatMap(e => (e.tagName === 'g' ? [...e.querySelectorAll('path, ellipse, circle, rect')] : [e]));
      const hits = [];
      for (const t of root.querySelectorAll('text')) {
        // only text drawn BEFORE the arm can lie beneath it
        if (!(t.compareDocumentPosition(arm) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (!t.textContent.trim()) continue;
        let op = 1;
        for (let e = t; e && e !== root; e = e.parentElement) op *= Number(e.getAttribute('opacity') ?? 1);
        if (op < 0.05) continue;
        const b = t.getBBox();
        const m = t.getCTM();
        let hit = 0, n = 0;
        for (let i = 0; i <= 6; i++) for (let j = 0; j <= 2; j++) {
          const pt = new DOMPoint(b.x + (b.width * i) / 6, b.y + b.height * (0.2 + 0.3 * j)).matrixTransform(m);
          n++;
          if (shapes.some(sh => {
            const lp = pt.matrixTransform(sh.getCTM().inverse());
            const q = sh.ownerSVGElement.createSVGPoint(); q.x = lp.x; q.y = lp.y;
            return (sh.tagName !== 'line' && sh.getAttribute('fill') !== 'none' && sh.isPointInFill(q)) || (sh.getAttribute('stroke') && sh.getAttribute('stroke') !== 'none' && sh.isPointInStroke(q));
          })) hit++;
        }
        if (hit) hits.push(`"${t.textContent.slice(0, 30)}" ${hit}/${n}`);
      }
      return hits;
    };
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `ra-${rows.length}`, params: pr.params});
      await x.ready;
      const bad = [];
      for (const [u, who] of [[0, ['A', 'B']], [0.02, ['A', 'B']], [0.7, ['A']], [0.9, ['A', 'B']], [1, ['A', 'B']]]) {
        x.seek(u * x.durationMs);
        for (const k of who) {
          const hits = covered(x.element, k);
          if (hits.length) bad.push(`u=${u} arm ${k}: ${hits.join('; ')}`);
        }
      }
      rows.push({preset: pr.name, w, h, bad});
      x.destroy();
      el.remove();
    }
    return rows;
  }, [ID, presets]);
  expect(out.filter(r => r.bad.length), JSON.stringify(out.filter(r => r.bad.length), null, 1)).toEqual([]);
});
