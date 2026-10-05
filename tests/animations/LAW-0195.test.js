// LAW-0195 — Consulta de expediente por auxiliar · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (where the requested piece sits
// when it is looked up — geometry and sequence: B's hand passes the empty slot and takes the piece from another
// slot), and no legal consequence is invented (both scenes end with the piece back in its own slot; no winner,
// score or alarm glyph).
// Windows (LAW-0195.js W): roll-top 0.17–0.33 (hand to the handle 0.17–0.20, roll up 0.20–0.28, hand back) ·
// headers 0.20–0.26 · outlines 0.30–0.36 (they step aside while the pieces are out, 0.488–0.754) · along the tabs
// 0.43–0.49 · pinch 0.49–0.50 · swing out 0.50–0.51 · carry sideways and down 0.51–0.56 · hand-off 0.56–0.567 ·
// lay 0.567–0.597 · read 0.60–0.64 · stand up 0.645–0.675 · hand-off back 0.675–0.682 · carry back 0.682–0.73 ·
// swing into the slot 0.73–0.742 · release 0.742–0.768 (B's dashed path found → own slot 0.742–0.768) ·
// guide 0.78–0.84 · neutral note 0.80–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0195';

contractSuite(ID, {
  continuity: ['handLA', 'handRA', 'handLB', 'handRB', 'pieceA', 'pieceB'],
  attach: [
    // the roll-top handle rides the solved left hand while it is pushed up
    {from: 0.201, to: 0.279, a: 'handLA', b: 'handleA', tol: 1.5},
    {from: 0.201, to: 0.279, a: 'handLB', b: 'handleB', tol: 1.5},
    // the piece hangs from the solved left hand by its tab, then rides the right hand by its edge, then the left again
    {from: 0.501, to: 0.566, a: 'handLA', b: 'gripLA', tol: 1.5},
    {from: 0.501, to: 0.566, a: 'handLB', b: 'gripLB', tol: 1.5},
    {from: 0.561, to: 0.681, a: 'handRA', b: 'gripRA', tol: 1.5},
    {from: 0.561, to: 0.681, a: 'handRB', b: 'gripRB', tol: 1.5},
    {from: 0.683, to: 0.741, a: 'handLA', b: 'gripLA', tol: 1.5},
    {from: 0.683, to: 0.741, a: 'handLB', b: 'gripLB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.contents === 'covered' && s.lookA.header === 0", label: 'base: two identical complete scenes, roll-tops closed, no label yet'},
    {at: 0.3, fn: "s.coverA === 1 && s.coverB === 1 && s.slotOfTargetA === s.target && s.slotOfTargetB === s.foundB && s.slotsB[s.target] === null && s.foundB !== s.target", label: 'change: A shows the piece in its own slot; B (as supplied) an empty slot and the piece in another slot'},
    {at: 0.46, fn: "s.phaseA === 'run' && s.phaseB === 'run' && s.touchedB > s.touchedA", label: 'parallel: both hands run down the tabs; B passes the empty slot and goes further (same time)'},
    {at: 0.52, fn: "s.holderA === 'l' && s.holderB === 'l'", label: 'both lift the piece out at the same moment'},
    {at: 0.62, fn: "s.phaseA === 'read' && s.phaseB === 'read'", label: 'both read the piece on the desk'},
    {at: 0.77, fn: "s.slotOfTargetA === s.target && s.slotOfTargetB === s.target && s.slotsA.every(x => x !== null) && s.slotsB.every(x => x !== null)", label: 'main action complete: both pieces back in their own numbered slot'},
    {at: 0.7, fn: 's.guideProgress === 0', label: 'no guide before the end'},
    {at: 1, fn: 's.guideProgress === 1 && s.noteShown === 1 && s.ringShown === 1 && s.sameGeometry && s.allReached && s.layoutFits', label: 'guide joins the two outlines; neutral note; identical geometry; layout fits'},
    {at: 0.3, params: {textVisibility: 'none'}, fn: "s.slotsB[s.target] === null && s.slotOfTargetA === s.target", label: 'labels hidden: the difference reads as geometry (an empty slot in B)'},
    {at: 0.05, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'labels hidden: nothing differs before the change'},
    {at: 0.3, params: {scenarioB: {label: 'Same slot', caption: '', foundAt: 3}}, fn: "s.slotOfTargetB === s.target && JSON.stringify(s.slotsA) === JSON.stringify(s.slotsB)", label: 'the difference follows the SUPPLIED position only'},
  ],
});

ratioChecks(ID, 'scene share, faces, reach', [
  // coordinator decision 2026-09-26: ~40% benchmark, 0.38 accepted for side-by-side 16:9 (see SESSION_HANDOFF);
  // stacked scenes ≥ 0.71 of the width (accepted stacked contrasts reach ≈ 0.71+)
  {at: [1], fn: "(s.column ? s.sceneShare >= 0.71 : s.sceneShare >= (s.shape === 'landscape' ? 0.38 : 0.4)) && s.layoutFits", label: 'each drawn scene ≥ 0.4 of the width side by side (0.38 in 16:9), ≥ 0.71 stacked; layout fits'},
  {at: times(0.17, 0.8, 0.01), fn: 's.faceClear && s.allReached', label: 'no piece over a face; every hand on its target'},
  // review round 1: out and back each carried piece covers no other compartment (no wrong-slot reading)
  {at: times(0.49, 0.77, 0.004), fn: 's.foreignSlots.every(k => k === 0)', label: 'the carried pieces never cover another compartment’s strip band'},
  // review round 1: with labels hidden the hold still shows the difference (B's path from where it was found)
  {at: [1], fn: 's.trailB === 1', label: 'the hold keeps B’s path from the supplied compartment to its own slot'},
]);

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.roles.assistant, p.roles.requester, ...p.props.pieces.map(q => q.title), p.props.request, p.props.fileLabel, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, ...p.relationships.map(r => r.label)]',
  content: 'return [...p.actors.map(a => a.name), ...p.props.pieces.map(q => q.title), p.scenarioA.label, p.scenarioB.label, p.changedFact]',
  captions: 'return ["as supplied", "según lo aportado"]',
});

// Rendered (every preset × ratio): the relation caption beside its own link (≤ 40 px); the link and the guide cross
// no text other than their own chips; A and B headers have the same size and line counts.
test.describe(`${ID} rendered checks`, () => {
  test(`${ID}: caption beside its link; links cross no text; equal headers`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const svg = x.element;
          const k = 1080 / Math.min(w, h) / svg.getScreenCTM().a;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          const R = e => e.getBoundingClientRect();
          const tag = `${pr.name} ${ratio}`;
          const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
          const sample = path => { const L = path.getTotalLength(), m = path.getScreenCTM(); return Array.from({length: 120}, (_, i) => path.getPointAtLength(L * i / 119).matrixTransform(m)); };
          const line = svg.querySelector('[data-node="rel-line"]');
          const lab = svg.querySelector('[data-node="rel-label"]');
          if (line && lab) {
            const pts = sample(line);
            const b = R(lab);
            const d = Math.min(...pts.map(q => Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom)))) * k;
            if (d > 40) out.push(`${tag}: link caption ${d.toFixed(1)} px from its line`);
            for (const t of texts) {
              if (lab.contains(t)) continue;
              const tb = R(t);
              if (pts.slice(4, -4).some(q => q.x > tb.left && q.x < tb.right && q.y > tb.top && q.y < tb.bottom)) out.push(`${tag}: link crosses "${t.textContent.slice(0, 24)}"`);
            }
          }
          const guide = svg.querySelector('[data-node="guide-line"]');
          const gchip = svg.querySelector('[data-node="guide-chip"]');
          if (guide) {
            const pts = sample(guide);
            for (const t of texts) {
              if (gchip && gchip.contains(t)) continue;
              const tb = R(t);
              if (pts.some(q => q.x > tb.left - 2 && q.x < tb.right + 2 && q.y > tb.top - 2 && q.y < tb.bottom + 2)) out.push(`${tag}: guide crosses "${t.textContent.slice(0, 24)}"`);
            }
            if (gchip) {
              const b = R(gchip);
              const d = Math.min(...pts.map(q => Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom)))) * k;
              if (d > 40) out.push(`${tag}: guide chip ${d.toFixed(1)} px from its line`);
            }
          }
          const hd = [0, 1].map(i => svg.querySelector(`[data-node="hdr${i}"]`));
          const sig = e => [...e.querySelectorAll('text')].map(t => `${t.querySelectorAll('tspan').length}@${t.getAttribute('font-size')}`).join('|');
          if (hd[0] && sig(hd[0]).split('|').length !== sig(hd[1]).split('|').length) out.push(`${tag}: headers differ ${sig(hd[0])} vs ${sig(hd[1])}`);
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
