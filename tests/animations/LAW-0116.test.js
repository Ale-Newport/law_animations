// LAW-0116 — Hecho contrafactual · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens starts as a
// scale-1 copy exactly on the porch region of the context and shows the parcel
// where the context has it), the change is localised (one datum, then only the
// flag and parcel move) and seeking back restores exactly the old datum.
// Review round 2: the context shrinks only part-way (never a thumbnail) WHILE the lens opens, and grows
// back while it closes, so no frame is near-empty; the panels stay readable (no whole-frame dim; in tall
// boxes they slide down and back); the lens is large in 9:16; the Δ tag is short and sits outside the
// scene; the Δ marker stays clear of the parcel, flag, old spot and figurine; timing per AUTHORING item 19.
// Review round 3: the marker is the neutral white Δ on the accent2 disc (never the alarm accent); the tag
// leader never crosses the diorama floor or plinth.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

const BEFORE = 'on the porch bench';
const AFTER = 'on the window sill';

contractSuite('LAW-0116', {
  continuity: ['parcel', 'parcelInLens', 'flag'],
  semantic: [
    {at: 0.1, fn: `s.contextFull && !s.lensVisible && s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.spotNow === 'bench' && s.panelsVisible`, label: 'build: full context, the old datum, parcel on the base spot'},
    {at: 0.22, fn: 's.lensVisible && s.lensAtSource && Math.abs(s.lensRect.x - s.sourceRect.x) < 3 && Math.abs(s.lensRect.w - s.sourceRect.w) < 5 && Math.hypot(s.parcelInLens.x - s.parcel.x, s.parcelInLens.y - s.parcel.y) < 3', label: 'isolate: the lens starts exactly on the porch region of the context and shows the parcel where the context has it (source coordinates kept)'},
    {at: 0.27, fn: 's.lensVisible && s.contextScale < 1 && s.contextScale > 0.45 && Math.hypot(s.parcelInLens.x - s.parcel.x, s.parcelInLens.y - s.parcel.y) > 5', label: 'isolate: the lens opens WHILE the context shrinks (overlapping beats, no empty frame)'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.contextInspect && s.lensScale > 2 && s.datum === 'before' && s.geometryMoved === 0 && s.spotNow === 'bench'", label: 'isolate: the region is enlarged; nothing has changed yet'},
    {at: 0.44, fn: "s.oldStruck && s.datum === 'before' && s.geometryMoved === 0", label: 'substitute: the old value is struck first (kept visible)'},
    {at: 0.51, fn: `s.datum === 'after' && s.datumValue === ${JSON.stringify(AFTER)} && s.oldValueShownIn === 'slip' && s.geometryMoved === 0`, label: 'substitute: the supplied new value appears; the geometry has not moved yet (datum first, dependent state after)'},
    {at: 0.58, fn: '!s.movedBeforeText && s.geometryMoved > 0 && s.geometryMoved < 1 && s.ghostVisible', label: 'substitute: only then the flag and parcel move; a ghost keeps the old spot'},
    {at: 0.655, fn: "s.spotNow === 'sill' && s.lensOpen === 1", label: 'substitute: the parcel rests on the new spot inside the open lens'},
    {at: 0.8, fn: 's.contextFull && !s.lensVisible', label: 'timing: the main action (lens back, context full) is done by u 0.8'},
    {at: 1, fn: '(1 - s.complete) * 8000 >= 300 && s.complete <= 0.9', label: 'timing: everything complete by u 0.9 and fully visible for ≥ 300 ms'},
    {at: 1, fn: "s.contextFull && !s.lensVisible && s.markerVisible && s.tagVisible && s.datum === 'after' && s.oldStruck && s.oldValueShownIn === 'card' && s.spotNow === 'sill' && s.ghostVisible", label: 'return: full context with the Δ marker, tag and struck old value; the change is kept'},
    {at: 1, fn: "s.notesVisible && s.notes.some(n => n.includes('window sill ever agreed')) && s.notes.some(n => n.includes('Everything else')) && s.notes.some(n => n.includes('no conclusion drawn')) && s.relation.kind === 'relation' && s.relation.condition === 1", label: 'return: issue, assumption, key and the supplied relation are drawn'},
    {at: 1, fn: "s.outcome === 'not-supplied' && s.winner === null", label: 'no outcome is inferred'},
    {at: 0.35, fn: `s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.spotNow === 'bench' && !s.oldStruck && !s.ghostVisible`, label: 'seeking back (after the end) restores exactly the old datum and spot'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.contextInspect && s.lensOpen === 1 && s.geometryMoved > 0 && s.ghostVisible', label: 'labels hidden: the same lens, substitution and move happen'},
    {at: 1, params: {circumstance: {label: 'Where the box is left', before: 'box', after: 'bench', condition: 1}, beforeValue: 'in the wall parcel box', afterValue: 'on the bench below it'}, fn: "s.spotNow === 'bench' && s.datumValue === 'on the bench below it'", label: 'another supplied substitution: the geometry follows the supplied spots'},
    {at: 0.4, params: {detailGeometry: {zoom: 2.8, placement: 'right'}}, fn: 's.lensOpen === 1 && s.zoomEff > 2.1', label: 'the supplied zoom is honoured (bounded by the frame)'},
  ],
});

suppliedTextSuite('LAW-0116', {
  fields: 'return [p.facts.title, ...p.facts.events, p.rules.title, ...p.rules.conditions, ...p.issues, ...p.assumptions, p.circumstance.label, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];',
  content: 'return [...p.facts.events, ...p.rules.conditions, ...p.issues, ...p.assumptions, p.beforeValue, p.afterValue];',
  captions: 'return [p.contextLabels.context];',
});

// Real-ratio audit (every preset × 16:9/9:16/1:1 × labels shown/hidden), sampled over the whole run:
//  - no near-empty frame (context + open lens + panels cover ≥ 30 % of the frame) and the context never
//    shrinks below ~45 % of its full size;
//  - the open lens stays inside the frame and never covers a panel; in 9:16 it spans ≥ 70 % of the width;
//  - at the hold the Δ tag sits outside the diorama and the Δ marker stays clear of the new spot (parcel +
//    flag), the old spot (ghost) and the figurine.
test('LAW-0116: no near-empty frames, readable panels, lens size, tag and marker placement (all presets × ratios × labels)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0116')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0116');
    const hit = (a, b) => a.x < b.x + b.w - 1 && a.x + a.w - 1 > b.x && a.y < b.y + b.h - 1 && a.y + a.h - 1 > b.y;
    const bad = [];
    let minShare = 1;
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      n++;
      const tag = `${pr.name} ${tv} ${ratio}`;
      for (let i = 0; i <= 50; i++) {
        const u = i / 50;
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        minShare = Math.min(minShare, s.visibleShare);
        if (s.visibleShare < 0.3) bad.push(`${tag} u${u}: near-empty frame (${s.visibleShare})`);
        if (s.contextScale < 0.44) bad.push(`${tag} u${u}: context shrinks to ${s.contextScale}`);
        const L = s.lensRect;
        if (s.lensVisible && (L.x < -1 || L.y < -1 || L.x + L.w > s.design.w + 1 || L.y + L.h > s.design.h + 1)) bad.push(`${tag} u${u}: lens outside the frame`);
        if (s.lensOpen > 0.5 && s.panelBoxes.some(b => hit(L, b))) bad.push(`${tag} u${u}: the lens covers a panel`);
        if (i === 20 && ratio === '9:16' && s.dest.w < 0.7 * s.design.w) bad.push(`${tag}: 9:16 lens only ${s.dest.w / s.design.w} of the width`);
      }
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      if (s.tagBox && hit(s.tagBox, s.diorama)) bad.push(`${tag}: the Δ tag covers the scene`);
      if (s.markerVisible && [...s.keyBoxes, s.figBox].some(b => hit(s.markerBox, b))) bad.push(`${tag}: the Δ marker overlaps a key element`);
      // review round 3: the marker is the neutral changed-datum marker (white Δ on the accent2 disc), not an alarm
      const disc = x.element.querySelector('[data-node="marker"] circle');
      const fillC = disc && disc.getAttribute('fill');
      if (s.markerVisible && (fillC !== s.markerColors.expected || fillC === s.markerColors.alarm || fillC === s.markerColors.laneB)) bad.push(`${tag}: marker disc fill ${fillC}`);
      const tri = x.element.querySelector('[data-node="marker"] path');
      if (s.markerVisible && (!tri || tri.getAttribute('stroke') !== '#fff')) bad.push(`${tag}: marker glyph is not the white Δ`);
      // review round 3: the tag leader never crosses the diorama floor or plinth
      if (s.tagLead) {
        const F = s.floorBand;
        for (let k = 0; k <= 40; k++) {
          const px = s.tagLead.x1 + (s.tagLead.x2 - s.tagLead.x1) * k / 40, py = s.tagLead.y1 + (s.tagLead.y2 - s.tagLead.y1) * k / 40;
          if (px > F.x && px < F.x + F.w && py > F.y && py < F.y + F.h) { bad.push(`${tag}: the tag leader crosses the floor/plinth`); break; }
        }
      }
      x.destroy();
      el.remove();
    }
    return {bad, n, minShare};
  }, presets);
  console.log('min visible share', out.minShare);
  expect(out.n).toBe(30);
  expect(out.bad).toEqual([]);
});
