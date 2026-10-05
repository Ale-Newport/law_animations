// LAW-0109 — Premisa oculta · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of movement, anchoring of objects (the cards ride the hands on their pull tabs,
// the magnifier rides the hand that holds it, the hinge leaves stay on their hinge line) and the transformation
// (a gap opens between fact and conclusion and reveals the intermediate card) is recognisable with labels hidden.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {motifDomChecks} from './premisa-oculta-checks.js';

const ID = 'LAW-0109';
const stated = presetsFor(ID).find(p => p.name === 'contrast-or-alternative').params;

contractSuite(ID, {
  continuity: ['fact', 'conclusion', 'handL', 'handR', 'lupa', 'leafTipF', 'leafTipC'],
  attach: [
    // both hands hold the pull tabs from the start of the pull until they let go (the cards follow the hands)
    {from: 0.151, to: 0.418, a: 'handL', b: 'gripF', tol: 0.6},
    {from: 0.151, to: 0.418, a: 'handR', b: 'gripC', tol: 0.6},
    // the right hand holds the magnifier's handle while it is lifted, held over the card and put back
    {from: 0.531, to: 0.694, a: 'handR', b: 'lupaGrip', tol: 0.6},
  ],
  semantic: [
    {at: 0, fn: 's.premiseHidden && s.gap === 0 && s.revealed === 0 && s.hingesFolded && s.lupaAtRest && !s.handsOnTabs', label: 'rest: fact and conclusion abut; the intermediate card is fully covered (nothing revealed early)'},
    {at: 0.14, fn: 's.premiseHidden && s.pull === 0', label: 'rest: the hands reach the tabs before anything moves'},
    {at: 0.14, params: {textVisibility: 'none'}, fn: 's.premiseHidden && s.revealed === 0', label: 'labels hidden: nothing of the card is visible before the pull'},
    {at: 0.28, fn: 's.handsOnTabs && s.pull > 0 && s.pull < 1 && s.revealed > 0 && s.revealed < 1 && s.hingesFolded', label: 'action: the hands pull the cards apart; the gap reveals the card part-way'},
    {at: 0.42, fn: 's.pull === 1 && s.revealed === 1 && s.gap > 0', label: 'action: the gap is fully open and the whole card is revealed'},
    {at: 0.44, fn: '!s.latchedBeforeOpen && s.hingesFolded', label: 'the hinges do not move before the gap is open'},
    {at: 0.62, fn: "s.premiseLook === 'unstated' && s.hingesFolded && s.recessed === 1 && s.lupaHeld && s.lupaOverPremise", label: 'unstated (default): hinges stay folded, the card stays in its pocket; the magnifier is held over it'},
    {at: 0.62, params: stated, fn: "s.premiseLook === 'stated' && s.latched && s.recessed === 0 && s.lupaOverPremise", label: 'stated: both hinge leaves latch onto the card and it lifts flush'},
    {at: 0.5, params: stated, fn: 's.kF > -1 && s.kC < s.kF', label: 'stated: the fact-side hinge swings first, the conclusion-side hinge after'},
    {at: 0.3, params: stated, fn: '!s.latchedBeforeOpen && s.hingesFolded', label: 'stated: no hinge moves while the cards are still being pulled'},
    {at: 1, fn: 's.lupaAtRest && s.lupaParkedClear && !s.lupaHeld && s.handL.y > s.fact.y && s.handR.y > s.conclusion.y', label: 'hold: the magnifier is back on its free spot (off every card, note and chip); hands back at rest'},
    {at: 1, fn: "s.keyShown && s.notesShown && s.keyText.includes('left unstated') && s.keyText.includes('no conclusion drawn') && s.notes.some(n => n.includes('Who else could open the shed')) && s.notes.some(n => n.includes('single key'))", label: 'hold: key (left unstated · as supplied · no conclusion drawn), issue and assumption are drawn'},
    {at: 1, params: stated, fn: "s.keyText.includes('stated in the argument') && s.latched", label: 'stated: the key says the premise is stated, as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.revealed === 1 && s.hingesFolded && s.recessed === 1 && s.lupaAtRest', label: 'labels hidden: the same reveal and final state'},
    {at: 1, params: {actionProgress: 0.2}, fn: 's.actionCapped && s.pull > 0 && s.pull < 1 && s.revealed < 1', label: 'actionProgress freezes the pull part-way'},
    {at: 1, fn: 's.whoClear', label: 'the analyst chip is clear of both arms, the magnifier and the walk'},
    {at: 1, fn: 's.bodyPx1080 >= 20 && s.notePx1080 >= 20 && s.kindPx1080 >= 16 && s.kindPx1080 <= s.bodyPx1080', label: 'baseline 16:9: card text >= 20 px, notes >= 20 px, kind labels >= 16 px and never above the card text'},
  ],
});

// Rendered checks at the hold for every preset × real 16:9 / 9:16 / 1:1 frame (labels shown and hidden):
// every supplied editable field is drawn as text (AUTHORING item 14), no text is ellipsised, supplied/key text is
// >= 16 px at 1080p (>= 20 px in the baseline presets) and never smaller than the generic captions (kind labels),
// and the parked magnifier touches no card, note or chip.
test(`${ID}: supplied fields drawn, readable, not truncated; parked magnifier clear (presets × ratios × labels)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const rows = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
        if (n.getAttribute && n.getAttribute('display') === 'none') return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        for (const tv of ['all', 'none']) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          x.seek(x.durationMs);
          const st = x.getState({bounds: false});
          const p = st.params;
          const svg = x.element;
          const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown);
          const txt = t => [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
          const hay = texts.map(t => norm(txt(t))).join('|');
          const px = t => {
            const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
            return parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          };
          const role = t => (t.closest('[data-role]') ? t.closest('[data-role]').getAttribute('data-role') : 'none');
          const content = texts.filter(t => role(t) === 'content').map(px);
          const caption = texts.filter(t => role(t) === 'caption').map(px);
          const fields = tv === 'all' ? [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, p.analyst.name, p.actorLabels.a, p.objectLabels.fact, p.objectLabels.premise, p.objectLabels.conclusion, ...p.annotations.map(a => a.text)] : [];
          out.push({
            preset: pr.name, ratio, tv,
            missing: fields.filter(f => f && !hay.includes(norm(f))),
            truncated: texts.filter(t => t.querySelector('title') || txt(t).includes('…')).map(t => txt(t).slice(0, 40)),
            unroled: texts.filter(t => role(t) === 'none').map(t => txt(t).slice(0, 30)),
            note: tv === 'none' || hay.includes(norm('no conclusion drawn')) || hay.includes(norm('sin conclusión')),
            minContent: content.length ? Math.min(...content) : null,
            maxCaption: caption.length ? Math.max(...caption) : 0,
            visibleTexts: texts.length,
            parkedClear: st.semantic.lupaParkedClear,
          });
          x.destroy();
          el.remove();
        }
      }
    }
    return out;
  }, [ID, presets]);
  for (const r of rows) {
    const tag = `${r.preset} ${r.ratio} labels=${r.tv}`;
    expect.soft(r.missing, `${tag}: supplied fields not drawn at the hold`).toEqual([]);
    expect.soft(r.truncated, `${tag}: ellipsised text at the hold`).toEqual([]);
    expect.soft(r.unroled, `${tag}: text without a content/caption role`).toEqual([]);
    expect.soft(r.note, `${tag}: "as supplied · no conclusion drawn" key at the hold`).toBe(true);
    expect.soft(r.parkedClear, `${tag}: parked magnifier clear of cards, notes and chips`).toBe(true);
    if (r.tv === 'none') expect.soft(r.visibleTexts, `${tag}: no visible text with labels hidden`).toBe(0);
    if (r.tv === 'all') {
      const floor = /baseline|default/.test(r.preset) ? 20 : 16;
      expect.soft(r.minContent, `${tag}: supplied/key text >= ${floor} px at 1080p`).toBeGreaterThanOrEqual(floor);
      expect.soft(r.minContent + 0.5, `${tag}: supplied/key text never smaller than the generic captions`).toBeGreaterThanOrEqual(r.maxCaption);
    }
  }
});

// Shared rendered-text audit (tests/harness/supplied-text.js) at the hold, and the motif DOM checks.
suppliedTextSuite(ID, {
  fields: 'return [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, p.analyst.name, p.actorLabels.a, p.objectLabels.fact, p.objectLabels.premise, p.objectLabels.conclusion, ...p.annotations.map(a => a.text)]',
  content: 'return [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, p.actorLabels.a, ...p.annotations.map(a => a.text)]',
  captions: 'return [p.objectLabels.fact, p.objectLabels.premise, p.objectLabels.conclusion].map(s => s.toUpperCase())',
});
motifDomChecks(ID, {at: [0.35, 0.7, 1], clearOfText: []});
