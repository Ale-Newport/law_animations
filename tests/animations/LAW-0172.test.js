// LAW-0172 — Declaración de testigo · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens copy IS the inspected card
// at the context's coordinates, and its source region holds the passage), the change is local (only
// that card's stated source and its dependent state; the other cards and the row stay fixed), and
// seeking back to earlier times restores the previous datum exactly.
// Windows: lens opens 0.22–0.36 · strike 0.46–0.52 · old value turns away 0.535–0.555 and leaves the lens as a
// struck "was:" chip 0.555–0.60 (parked beside the window) · new value turns in 0.60–0.63 · the chip docks under the
// context card 0.69–0.72 ·
// context card turns over 0.665–0.715 and the old value docks under it 0.69–0.72 (lens still open) ·
// lens closes 0.725–0.785 onto an identical card · marker 0.80–0.84 · label 0.81–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0172';

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.contextSourceType === 'observed' && !s.markerVisible", label: 'context: the lined-up cards with the old datum, no marker'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensSourceType === 'observed' && s.sourceContainsPassage && s.lensClearOfSource", label: 'isolate: the lens opens on the unchanged source passage, away from it'},
    {at: 0.4, fn: 'JSON.stringify(s.lensCopyAt) === JSON.stringify(s.contextCardAt) && s.zoom >= 1.2', label: 'the lens copy uses the inspected card’s own context coordinates (real enlarged copy)'},
    {at: 0.55, fn: "s.datum === 'changing' && s.strike === 1 && s.contextDatum === 'before' && s.contextSourceType === 'observed'", label: 'substitute: the old value is struck inside the lens only; context untouched'},
    {at: 0.655, fn: "s.datum === 'after' && s.lensSourceType === 'received' && s.oldValueShown === 1 && s.contextSourceType === 'observed'", label: 'the lens holds the new value; the old value stays readable (a struck chip beside the lens); context still old'},
    {at: 0.705, fn: "s.lensOpen === 1 && s.datum === 'after' && s.contextDatum === 'changing'", label: 'while the lens is still open the context card turns over to the new value'},
    {at: 0.722, fn: "s.lensOpen === 1 && s.contextDatum === 'after' && s.contextSourceType === s.lensSourceType && s.oldDockedInContext === 1", label: 'before the lens closes, context and lens show the same card (no value closes over a different one)'},
    {at: 0.79, fn: "s.lensOpen === 0 && s.contextDatum === 'after'", label: 'the lens has closed onto the updated card'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextSourceType === 'received' && s.oldDockedInContext === 1 && s.markerVisible", label: 'return: the context card shows the new source, the struck old value docked under it, marker shown'},
    {at: 1, fn: "s.otherCardsInRail && s.cardsFixed === '[2,1,0]' && s.allReached && s.layoutFits", label: 'the change is local: every card stays in its slot; layout fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.strike === 0 && s.lensSourceType === 'observed'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'wording', beforeValue: 'Two people carried boxes inside', afterValue: 'Two people carried crates inside'}, fn: "s.contextDatum === 'after' && s.contextSourceType === 'observed' && s.focusTarget === 'wording'", label: 'wording substitution: the statement changes, the stated source does not'},
    {at: 1, params: {focusCard: 2, beforeValue: 'information received (as stated)', afterValue: 'direct observation (as stated)'}, fn: "s.focusCard === 2 && s.contextSourceType === 'observed' && s.markerVisible", label: 'the inspected card is configurable (received → observed)'},
    {at: 0.555, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.datum === 'changing' && s.contextDatum === 'before'", label: 'labels hidden: the same isolation and substitution'},
  ],
});

// Reviewer fixes in every preset × ratio × labels shown / hidden: the closing lens always lands on a card
// that shows the same value; the lens never covers the witness; the Δ marker is off the clerk's head; the
// docked old value is off the clerk's arm.
ratioChecks(ID, 'close sequencing, lens off the witness, marker and dock placement', [
  {at: times(0.725, 0.79, 0.005), fn: "s.contextDatum === 'after' && (s.lensOpen === 0 || s.lensSourceType === s.contextSourceType)", label: 'closing lens and context show the same value'},
  {at: [0.3, 0.5, 0.65], fn: 's.lensClearOfWitness', label: 'the lens window never covers the witness'},
  // round 2: the lens is a real enlargement everywhere (lens scale / context scale ≥ 1.5; on tight frames the
  // lens crops to the changed datum's row), and its source still holds that datum
  {at: [0.4, 0.5, 0.6], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1 && s.sourceContainsPassage', label: 'lens scale / context scale ≥ 1.5 and the source holds the changed datum'},
  // round 5: with labels shown AND hidden the lens never covers a head or body (witness or clerk), and its guides
  // start on the inspected card (the source crop never reaches a neighbouring card)
  {at: [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75], fn: 's.lensClearOfPeople && s.guidesOnCard', label: 'the lens covers no person and its guides start on the inspected card'},
  {at: [0.4, 0.62], fn: "s.changedFieldWhole && s.lensFields.before.includes('tag') && s.lensFields.after.includes('tag')", label: 'the changed field (source tag) is wholly inside the lens, before and after'},
  {at: [1], fn: 's.markerClearOfHead && s.dockClearOfArms && s.markerVisible && s.oldDockedInContext === 1', label: 'hold: Δ marker off the clerk’s head, old value docked clear of the clerk’s arm'},
]);

suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.roles.witness, p.roles.clerk, ...p.props.facts.map(f => f.text), ...p.props.facts.map(f => f.via), p.props.sourceLabels.observed, p.props.sourceLabels.received, p.objectLabels.document, p.beforeValue, p.afterValue, p.afterVia, p.contextLabels.context, p.contextLabels.marker]',
  content: 'return [...p.actors.map(a => a.name), ...p.props.facts.map(f => f.text), p.beforeValue, p.afterValue]',
  captions: 'return ["as supplied", "según lo aportado"]',
});

// Round 3/4 (rendered, dense): the lens copy never shows a line cut by the lens rim, and each supplied field
// (statement, source tag, "from" line) is wholly in the lens or wholly left out — never partly shown — at every
// sampled u of the lens phase, in every preset × ratio × labels shown/hidden. The changed field (the tag) is
// always wholly inside (semantic check).
test.describe('LAW-0172 lens rim (rendered)', () => {
  test('LAW-0172: no lens-copy text box crosses the lens rim (u 0.22–0.79, every preset × ratio × labels)', async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0172')];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0172');
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
            let texts = 0;
            for (let u = 0.22; u <= 0.79 + 1e-9; u += 0.01) {
              x.seek(u * x.durationMs);
              const win = node('lz-win'), border = node('lz-border');
              if (!win || !shown(win)) continue;
              const inv = svg.getScreenCTM().inverse();
              const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
              const bm = border.getScreenCTM();
              const c0 = new DOMPoint(+border.getAttribute('x'), +border.getAttribute('y')).matrixTransform(bm);
              const c1 = new DOMPoint(+border.getAttribute('x') + +border.getAttribute('width'), +border.getAttribute('y') + +border.getAttribute('height')).matrixTransform(bm);
              const W0 = toRoot(c0.x, c0.y), W1 = toRoot(c1.x, c1.y);
              for (const t of node('lz-content').querySelectorAll('text')) {
                if (!shown(t)) continue;
                // a supplied field (one text block) is wholly in the lens copy or wholly left out
                const spans = [...t.querySelectorAll('tspan')];
                const rootBox = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {p0, p1, w: b.width, h: b.height}; };
                const full = spans.filter(ts => (ts.textContent || '').trim());
                const vis = full.filter(ts => { const {p0, p1, w: bw, h: bh} = rootBox(ts); return bw >= 0.5 && bh >= 0.5 && p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y; });
                if (vis.length && (vis.length !== full.length || full.length !== spans.length)) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: field "${(t.textContent || '').trim().slice(0, 30)}" is only partly in the lens (${vis.length} of ${spans.length} lines)`);
                if (!(t.textContent || '').trim()) continue;
                for (const ts of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) {
                  if (!(ts.textContent || '').trim()) continue;
                  const b = ts.getBoundingClientRect();
                  if (b.width < 0.5 || b.height < 0.5) continue;
                  const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom);
                  texts++;
                  const over = p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y;
                  const inside = p0.x >= W0.x - 1 && p1.x <= W1.x + 1 && p0.y >= W0.y - 1 && p1.y <= W1.y + 1;
                  if (over && !inside) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: lens copy line "${ts.textContent.slice(0, 30)}" is cut by the rim`);
                }
              }
            }
            if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (test would be vacuous)`);
            x.destroy?.();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
