// LAW-0110 — Premisa oculta · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its own part (checked while the parts separate, while the focus part is
// enlarged and while the mechanism gathers), the order does not change when seeking, and a relation is never drawn
// as causation by default (plain relations carry no arrowhead; causal only when supplied).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {motifDomChecks} from './premisa-oculta-checks.js';

const ID = 'LAW-0110';
const alt = presetsFor(ID).find(p => p.name === 'contrast-or-alternative').params;
// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const RATIOS = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const endChecks = Object.entries(RATIOS).flatMap(([shape, sa]) => [0.3, 0.6, 0.79, 1].map(at => ({
  at, params: sa, fn: 's.linkEnds.every(Boolean)', label: `every drawn link ends on the edges of its own two parts (${shape}, t=${at})`,
})));

contractSuite(ID, {
  continuity: ['fact', 'conclusion', 'rule', 'hingeA', 'hingeB', 'tracer', 'lupa'],
  semantic: [
    {at: 0, fn: 's.ruleHiddenUnderSeam && s.explode === 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.hingeK.every(k => k === -1)', label: 'closed: fact and conclusion abut over the hidden card, hinges folded, nothing drawn'},
    {at: 0.18, fn: "s.explode === 1 && s.hingesInTray && s.ruleLevel === 'beneath' && s.relationsDrawn.every(p => p === 0)", label: 'separate: the card is in the layer beneath the gap and the hinges lie flat in the tray before any link is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'links are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.43, fn: 's.relationsDrawn.every(p => p === 1) && s.linkEnds.every(Boolean) && s.linkLengths.every(v => v > 40)', label: 'all supplied links drawn, each on its parts’ edges, with a readable length'},
    {at: 1, fn: "s.causalCount === 0 && JSON.stringify(s.linkKinds) === JSON.stringify(['sequence', 'relation', 'relation', 'relation', 'relation']) && JSON.stringify(s.arrowheads) === JSON.stringify([true, false, false, false, false])", label: 'relations carry no arrowhead and nothing is causal by default (only the supplied sequence has one)'},
    {at: 1, params: {relationships: [{from: 'fact', to: 'rule', kind: 'causal'}, {from: 'lupa', to: 'rule', kind: 'relation'}]}, fn: 's.causalCount === 1 && s.arrowheads[0] === true && s.arrowheads[1] === false && s.linkEnds.every(Boolean)', label: 'a causal style appears only when the author supplies it'},
    {at: 0.6, fn: "s.visited.length >= 2 && JSON.stringify(s.visited) === JSON.stringify(s.visitOrder.slice(0, s.visited.length))", label: 'the tracer visits the parts in the supplied order'},
    {at: 0.52, fn: 's.tracerVisible && !s.tracerInsidePart', label: 'the tracer shows while it runs along a wire'},
    // reviewer round 1: the tracer never crosses card text visibly — it fades out while inside a part
    ...[0.46, 0.48, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72].flatMap(at => [{}, {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}].map(sa => ({at, params: sa, fn: '!(s.tracerVisible && s.tracerInsidePart)', label: `the tracer is not visible over a part's text @${at}`}))),
    // reviewer round 1: every caption at the hold keeps a visible tie (its wire, or a leader to the part it names)
    ...['', 'contrast-or-alternative', 'long-labels-stress', 'baseline-es'].flatMap(pr => [{}, {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}].map(sa => ({at: 1, params: {...(pr ? presetsFor(ID).find(x => x.name === pr).params : {}), ...sa}, fn: 's.labelsTied.every(Boolean)', label: `hold captions tied to a visible wire or leader (${pr || 'default'}, ${JSON.stringify(sa)})`}))),
    {at: 1, fn: 's.labelsLying.some(Boolean) && s.labelsTied.every(Boolean)', label: 'the collapsed hinge link (hinge folded back on the fact card) keeps its caption with a leader'},
    {at: 0.55, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['fact', 'connector', 'rule', 'conclusion'])", label: 'seek-stable traversal order (default)'},
    {at: 0.6, params: {traversalOrder: ['conclusion', 'rule', 'fact']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['conclusion', 'rule', 'fact'])", label: 'the tracer follows a different supplied order'},
    {at: 0.6, params: {traversalOrder: ['conclusion', 'rule', 'fact']}, fn: 's.visited[0] === "conclusion"', label: 'the first visited part follows the supplied order'},
    {at: 0.578, fn: "s.focus === 'rule' && Math.abs(s.u - s.focusU) < 0.01 && s.focusScale > 1.15 && s.lupaOverFocus && s.visited.includes('rule')", label: 'the focus part enlarges while the tracer arrives on it; the magnifier is over it'},
    {at: 0.5, fn: 's.focusScale === 1 && !s.lupaOverFocus', label: 'before the tracer reaches the focus part nothing is enlarged'},
    {at: 0.555, params: {focusElement: 'fact'}, fn: "s.focus === 'fact'", label: 'the focus part is configurable'},
    {at: 0.79, fn: 's.gather > 0 && s.gather < 1 && s.linkEnds.every(Boolean)', label: 'links stay attached while the mechanism gathers'},
    {at: 1, fn: "s.gather === 1 && s.ruleLevel === 'beneath' && s.foldedHome && !s.latched && !s.tracerVisible && s.focusScale === 1", label: 'unstated (default): the card stays beneath the empty gap and both hinges fold back home'},
    {at: 1, params: alt, fn: "s.ruleLevel === 'walk' && s.latched && s.hingeK.every(k => k === 1)", label: 'stated: the card rises into the gap and both hinges latch it into the walk'},
    {at: 0.6, params: alt, fn: "s.ruleLevel === 'beneath' && !s.latched", label: 'stated: nothing rises or latches before the gather beat'},
    {at: 1, fn: "s.labelsShown && s.labelsGathered.every(Boolean) && s.keyShown && s.notesShown && s.keyText.includes('no conclusion drawn') && s.outcome === null", label: 'hold: every link labelled on its own wire, key (as supplied · no conclusion drawn), issue and assumption'},
    {at: 0.35, fn: 's.labelsExploded.every(Boolean)', label: 'exploded captions are placed clear of parts, other wires and captions (16:9)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.ruleLevel === 'beneath' && s.foldedHome && s.relationsDrawn.every(p => p === 1)", label: 'labels hidden: the same mechanism and states'},
    {at: 1, fn: 's.bodyPx1080 >= 20 && s.notePx1080 >= 20 && s.kindPx1080 >= 16', label: 'baseline 16:9: card text >= 20 px, captions >= 20 px, kind labels >= 16 px'},
    ...endChecks,
  ],
});

// Rendered checks at the hold for every preset × real 16:9 / 9:16 / 1:1 frame (labels shown and hidden).
test(`${ID}: supplied fields drawn, readable, not truncated (presets × ratios × labels)`, async ({page}) => {
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
          const kinds = [...new Set(p.relationships.map(r => r.kind))];
          const fields = tv === 'all' ? [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...p.relationships.filter(r => r.from !== r.to).map(r => r.label || p.relationLabels[r.kind]), ...kinds.map(k => p.relationLabels[k])] : [];
          out.push({
            preset: pr.name, ratio, tv,
            missing: fields.filter(f => f && !hay.includes(norm(f))),
            truncated: texts.filter(t => t.querySelector('title') || txt(t).includes('…')).map(t => txt(t).slice(0, 40)),
            unroled: texts.filter(t => role(t) === 'none').map(t => txt(t).slice(0, 30)),
            note: tv === 'none' || hay.includes(norm('no conclusion drawn')) || hay.includes(norm('sin conclusión')),
            minContent: content.length ? Math.min(...content) : null,
            maxCaption: caption.length ? Math.max(...caption) : 0,
            visibleTexts: texts.length,
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
  fields: 'return [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...p.relationships.filter(r => r.from !== r.to).map(r => r.label || p.relationLabels[r.kind]), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])]',
  content: 'return [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, ...p.relationships.filter(r => r.from !== r.to).map(r => r.label || p.relationLabels[r.kind])]',
  captions: `return p.elements.filter(e => e.id !== 'lupa').map(e => e.label.toUpperCase())`,
});
motifDomChecks(ID, {at: [0.35, 0.6, 1]});
