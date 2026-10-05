// LAW-0101 — Condiciones alternativas · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (capsules, hands, magnifier head — no teleport at 60 fps in
// every ratio), anchoring of objects (each capsule stays in its clerk's hand until the bell's mouth;
// IK targets reachable) and the transformation readable with labels hidden (the same capsules travel
// the same tubes and land in the same tray without any text).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const ID = 'LAW-0101';
const disputedA = {facts: [{label: 'Invitation note signed by member J. Park on Day 3', status: 'disputed'}, {label: 'Partner-club card no. 0417 shown at the door', status: 'supplied'}]};
const pendingB = {facts: [{label: 'Invitation note signed by member J. Park on Day 3', status: 'supplied'}, {label: 'Partner-club card no. 0417 shown at the door', status: 'pending'}]};

contractSuite(ID, {
  continuity: ['capA', 'capB', 'handA', 'handB', 'lupa'],
  // the capsule rides the clerk's hand (hand = capsule centre) from rest until the bell's mouth
  attach: [
    {from: 0, to: 0.3, a: 'capA', b: 'handA', tol: 1.5},
    {from: 0, to: 0.35, a: 'capB', b: 'handB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.capState.A === 'in-hand' && s.capState.B === 'in-hand' && s.lid.A === 0 && s.lid.B === 0 && s.ball === 0 && s.inTray.length === 0 && !s.pointReached && s.lupaSwing === 0", label: 'rest: both capsules in hand, lids shut, ball centred, tray empty, magnifier parked'},
    {at: 0.14, fn: "s.travel.A === 0 && s.travel.B === 0 && s.capState.A === 'in-hand' && s.ball === 0", label: 'rest: nothing moves before the action beat'},
    {at: 0.27, fn: "s.lid.A > 0 && s.capState.A === 'entering' && s.capState.B === 'in-hand'", label: 'action: A is handed in first (lid open), B still in hand — the routes act independently'},
    {at: 0.33, fn: "s.capState.A === 'in-tube' && s.capState.B === 'entering'", label: 'action: A travels its tube while B is handed in at its own inlet'},
    {at: 0.46, fn: "s.ball > 0.9 && s.capState.B === 'in-tube' && s.inTray.length === 0", label: 'complete: A pushes the shuttle ball against the B seat before anything lands (cause before effect)'},
    {at: 0.55, fn: "s.inTray.includes('A') && s.pointReached && !s.inTray.includes('B')", label: 'complete: A lands in the tray and the point of analysis lights; B is still travelling'},
    {at: 0.62, fn: "s.inTray.length === 2 && s.ball < -0.9 && s.lupaSwing < 1", label: 'complete: B arrives at the SAME tray by its own route (ball now against the A seat)'},
    {at: 0.72, fn: 's.lupaOverTray && s.lupaClear', label: 'the magnifier swings over the tray, clear of every card, plate and label'},
    {at: 1, fn: "s.inTray.length === 2 && s.capState.A === 'in-tray' && s.capState.B === 'in-tray' && s.lupaOverTray && s.lupaClear && s.allReached", label: 'hold: both capsules rest in the one tray under the magnifier'},
    {at: 1, fn: "s.notes.issues === 1 && s.notes.foot && s.notes.key && s.notes.footHasAssumptions", label: 'the issue, the assumptions and the "as supplied · no conclusion drawn" key are drawn'},
    {at: 1, params: {issues: [], assumptions: []}, fn: 's.notes.issues === 0 && s.notes.key', label: 'without issues or assumptions the key is still drawn'},
    {at: 1, fn: 's.text.contentPx >= 20 && s.text.keyPx >= 18 && s.text.captionPx >= 16 && s.text.contentPx >= s.text.keyPx && s.text.keyPx >= s.text.captionPx && s.text.truncated.length === 0 && s.text.badCallouts === 0', label: 'baseline text: content ≥ 20 px, key ≥ 18 px, captions ≥ 16 px and never larger than content'},
    // supplied statuses drive the physical behaviour (never inferred)
    {at: 1, params: disputedA, fn: "s.capState.A === 'stopped-at-gate' && JSON.stringify(s.inTray) === JSON.stringify(['B']) && s.pointReached", label: 'A supplied as disputed: its capsule is stopped at the gate; B alone reaches the tray'},
    {at: 0.46, params: disputedA, fn: 's.ball === 0', label: 'a stopped capsule never moves the shuttle ball'},
    {at: 1, params: pendingB, fn: "s.capB === null && s.capState.B === 'none' && JSON.stringify(s.inTray) === JSON.stringify(['A']) && s.ball > 0.9", label: 'B supplied as pending: nothing is sent on B; A alone reaches the tray'},
    {at: 1, params: {finalState: 'awaiting-dispatch'}, fn: "s.capState.A === 'in-hand' && s.capState.B === 'in-hand' && !s.pointReached && s.lupaSwing === 0 && s.lid.A === 0", label: 'awaiting-dispatch: the capsules stay in hand; nothing reaches the tray'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.inTray.length === 0 && (s.capState.A === 'in-tube' || s.capState.A === 'entering')", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.inTray.length === 2 && s.lupaOverTray && s.ball < -0.9", label: 'labels hidden: the same capsules travel the same tubes into the same tray'},
    {at: 0.46, params: {textVisibility: 'none'}, fn: "s.ball > 0.9 && s.capState.B === 'in-tube'", label: 'labels hidden: the same sequence mid-action'},
  ],
});

/** In-page: render presets × ratios and collect visible text with its rendered px at 1080p. */
async function collect(page, id, variants, at = 1) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page.evaluate(async ([id, variants, at]) => {
    const def = await window.__lib.load(id);
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
        if (n.getAttribute && n.getAttribute('display') === 'none') return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const rows = [];
    let n = 0;
    for (const v of variants) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `fields-${n++}`, params: v.params});
        await x.ready;
        x.seek(x.durationMs * at);
        const svg = x.element;
        const root = svg.getScreenCTM().inverse();
        const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown).map(t => {
          const m = root.multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          const named = t.closest('[data-node]');
          const txt = [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
          return {node: named ? named.getAttribute('data-node') : '', text: txt, px: Math.round(px * 10) / 10, truncated: Boolean(t.querySelector('title'))};
        });
        const p = x.getState({bounds: false}).params;
        rows.push({name: v.name, ratio, texts, params: p, semantic: x.getState({bounds: false}).semantic});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, [id, variants, at]);
}

const norm = s => String(s).toLowerCase().replace(/\s+/g, '');

// AUTHORING item 14: every supplied editable text field is drawn and readable at the final hold, never
// ellipsised — in every preset × real 16:9, 9:16 and 1:1 frame; plus the "as supplied · no conclusion" key.
test(`${ID}: every supplied field is drawn as text at the hold (presets × ratios), nothing truncated`, async ({page}) => {
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const rows = await collect(page, ID, presets);
  for (const r of rows) {
    const p = r.params;
    const hay = r.texts.map(t => norm(t.text)).join('|');
    const fields = [
      p.rules.name, ...p.rules.conditions, ...p.facts.map(f => f.label), ...p.issues, ...p.assumptions,
      ...p.clerks.map(c => c.name), p.actorLabels.a, p.actorLabels.b, p.objectLabels.connector, p.objectLabels.lupa, p.objectLabels.rule,
      ...p.annotations.map(a => a.text),
    ];
    const missing = fields.filter(f => f && !hay.includes(norm(f)));
    expect.soft(missing, `${r.name} ${r.ratio}: supplied fields not visible at the hold`).toEqual([]);
    expect.soft(r.texts.filter(t => t.truncated || t.text.includes('…')).map(t => t.text), `${r.name} ${r.ratio}: truncated text`).toEqual([]);
    const key = p.locale === 'es' ? 'según lo aportado · sin conclusión' : 'as supplied · no conclusion drawn';
    expect.soft(hay.includes(norm(key)), `${r.name} ${r.ratio}: "${key}" key drawn`).toBe(true);
  }
});

// AUTHORING items 10 and 17: key / supplied text ≥ 16 px at 1080p in every preset × ratio (≥ 20 px for the
// content in the baseline presets), never smaller than the generic captions (clerk chips, object labels).
test(`${ID}: text sizes — content ≥ 16 px (≥ 20 px baseline), never smaller than captions`, async ({page}) => {
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID), {name: 'labels-key', params: {textVisibility: 'key'}}];
  const rows = await collect(page, ID, presets);
  const isContent = n => /^(plate[AB]|card[AB]|rule-panel)-body$/.test(n);
  const isCaption = n => /^(who[AB]|lbl-)/.test(n);
  for (const r of rows) {
    const content = r.texts.filter(t => isContent(t.node));
    const captions = r.texts.filter(t => isCaption(t.node));
    const all = r.texts;
    expect.soft(content.length, `${r.name} ${r.ratio}: content texts found`).toBeGreaterThan(3);
    const minContent = Math.min(...content.map(t => t.px));
    const maxCaption = captions.length ? Math.max(...captions.map(t => t.px)) : 0;
    const floor = /baseline|default|labels-key/.test(r.name) ? 19.9 : 15.9;
    expect.soft(minContent, `${r.name} ${r.ratio}: smallest content text (px at 1080p)`).toBeGreaterThanOrEqual(floor);
    expect.soft(Math.min(...all.map(t => t.px)), `${r.name} ${r.ratio}: smallest visible text (px at 1080p)`).toBeGreaterThanOrEqual(15.9);
    expect.soft(minContent + 0.05, `${r.name} ${r.ratio}: content never smaller than captions`).toBeGreaterThanOrEqual(maxCaption);
  }
});

// AUTHORING item 12: the magnifier never parks on content; the clerks' capsules never pass through a card.
test(`${ID}: magnifier clear of cards and labels at the hold, all presets × ratios, labels on and off`, async ({page}) => {
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const variants = presets.flatMap(pr => [pr, {name: `${pr.name}-hidden`, params: {...pr.params, textVisibility: 'none'}}]);
  const rows = await collect(page, ID, variants);
  for (const r of rows) {
    expect.soft(r.semantic.lupaClear, `${r.name} ${r.ratio}: magnifier clear at the hold`).toBe(true);
    expect.soft(r.semantic.allReached, `${r.name} ${r.ratio}: IK reach`).toBe(true);
  }
});
