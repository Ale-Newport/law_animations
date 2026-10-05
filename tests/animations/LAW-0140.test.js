// LAW-0140 — Ámbito material · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is
// localized (one tag, one card) and seeking back restores the previous datum.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/sources/LAW-0140.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
const OTHERS = "JSON.stringify(s.othersHolders) === JSON.stringify(['bin1','bin2'])";
// supplied data whose target bin is already occupied (four activities, the third re-sorted into the Transport bin)
const OCCUPIED = {activities: [{label: 'Bicycle rental', subject: 'Transport'}, {label: 'Roof repair', subject: 'Housing'}, {label: 'Street concert', subject: 'Culture'}, {label: 'Seed exchange', subject: 'Farming'}], focusTarget: 'activity-3'};
// a square caption-safe box (the 1:1 composition) and a tall one (the 9:16 composition) inside the 16:9 test frame
const SQUARE = {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}};
const TALL = {safeArea: {top: 0.02, bottom: 0.02, left: 0.36, right: 0.36}};
const WINDOW = 's.windowHasWholeCard && s.wholeTexts && Math.hypot(s.lensSourceCenter.x - s.focusCenter.x, s.lensSourceCenter.y - s.focusCenter.y) < 1';
const COMPOSED = 's.lensOpen === 1 && s.contextScale <= 0.6 && s.insetClearOfContext';
const FANNED = 's.residents.length > 0 && s.residentsClear && s.markerClearOfTag';

contractSuite('LAW-0140', {
  continuity: ['lens', 'focusCard'],
  continuityLimit: 110,
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.datum === 'before' && s.contextDatum === 'before' && s.focusHolder === 'side' && " + OTHERS, label: 'context: the sorted state with the supplied datum (tag Culture in the side bin), full size'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.lensDatum === 'before' && s.focusHolder === 'side'", label: 'the detail window isolates the unchanged card'},
    {at: 0.4, fn: 'Math.abs(s.lensZoom - 3.8) < 0.01 && ' + WINDOW, label: 'the window is a real copy taken at the source coordinates of the card, at the supplied zoom'},
    {at: 0.6, fn: "s.lensDatum === 'changing' && s.contextDatum === 'before' && s.focusHolder === 'side'", label: 'the substitution happens inside the detail window only'},
    {at: 1, fn: "s.contextDatum === 'after' && s.focusHolder === 'bin0' && s.markerShown === 1 && s.statusUn === 0 && " + OTHERS, label: 'return: only that card is re-sorted by its new tag; marker kept; the dependent state updates'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.focusHolder === 'side' && s.markerShown === 0", label: 'seeking back restores the previous datum and place exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusHolder === 'side' && s.contextDatum === 'after' && JSON.stringify(s.othersHolders) === JSON.stringify(['bin0','bin2'])", label: 'inverse substitution: a listed tag replaced by an unlisted one moves only that card to the side bin'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.focusHolder === 'bin0' && s.contextDatum === 'after'", label: 'labels hidden: the same localized change is visible'},
    // defect class: enlargement attached to the wrong object / two magnifiers — the window grows
    // out of the card itself and its sight lines land on the card's frame in the miniature
    {at: 0.3, fn: 'Math.hypot(s.lensSourceCenter.x - s.focusCenter.x, s.lensSourceCenter.y - s.focusCenter.y) < 1 && s.magnifiers === 1', label: 'the window opens from the focus card (no second magnifier)'},
    {at: 1, fn: 'Math.hypot(s.lensSourceCenter.x - s.focusCenter.x, s.lensSourceCenter.y - s.focusCenter.y) < 1', label: 'hold: the window still follows the card to its new place'},
    // defect class: meaning truncated in the enlargement — the whole chip and the whole name
    {at: 0.4, params: P('contrast-or-alternative'), fn: WINDOW, label: 'alternative: the whole card is in the window'},
    {at: 0.4, params: P('long-labels-stress'), fn: WINDOW, label: 'long labels: the whole chip and name are in the window, uncut'},
    {at: 0.4, params: P('baseline-es'), fn: WINDOW, label: 'Spanish: the whole chip and name are in the window, uncut'},
    // defect class: too close to the story — own composition: context miniature + large detail window
    {at: 0.4, fn: COMPOSED + ' && s.insetPx >= 600 && s.tagPxInWindow >= 40', label: '16:9: a context miniature beside a large detail window (≥600 px, tag ≥40 px)'},
    {at: 0.6, params: SQUARE, fn: COMPOSED, label: 'square box: miniature and window do not overlap'},
    {at: 0.6, params: TALL, fn: COMPOSED, label: 'tall box: miniature and window do not overlap'},
    {at: 1, fn: 's.contextScale < 1 && s.insetClearOfContext', label: 'the hold is not the story layout: the context stays framed beside the window'},
    {at: 1, params: SQUARE, fn: 's.insetClearOfContext', label: 'square box hold: window clear of the context'},
    {at: 1, params: TALL, fn: 's.insetClearOfContext', label: 'tall box hold: window clear of the context'},
    {at: 0.4, fn: 's.sightLines > 0 && s.windowBadge === 0', label: 'while inspecting, sight lines join the window to the card'},
    {at: 1, fn: 's.sightLines === 0 && s.windowBadge === 1 && s.markerShown === 1', label: 'hold: no line crosses the context; matching badges tie the window to the re-sorted card'},
    {at: 0.45, params: {...P('long-labels-stress'), ...SQUARE}, fn: COMPOSED, label: 'long labels, square box: the window stays clear of the miniature and its caption'},
    {at: 1, params: {...P('long-labels-stress'), ...TALL}, fn: 's.insetClearOfContext', label: 'long labels, tall box hold: the window stays clear of the miniature and its caption'},
    // defect class: arriving card hiding a resident card; marker over the chip
    {at: 1, fn: 's.residents.length === 0 && s.markerClearOfTag', label: 'hold: the re-sorted card has a bin of its own (no card or name covered); the marker is off the chip'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.residents.length === 0 && s.markerClearOfTag', label: 'alternative hold: its own slot in the side bin'},
    {at: 1, params: P('long-labels-stress'), fn: 's.residents.length === 0 && s.markerClearOfTag', label: 'long labels hold: its own slot'},
    {at: 1, params: P('baseline-es'), fn: 's.residents.length === 0 && s.markerClearOfTag', label: 'Spanish hold: its own slot'},
    {at: 1, params: OCCUPIED, fn: FANNED, label: 'supplied data with an occupied bin: the resident is lifted so its number and tag stay in view (its name is covered)'},
    // round 2 (independent review): neutral change glyph; tags inside their chips; the new state in words;
    // caption never under the growing window; the window not smaller than the miniature on square boxes
    {at: 1, fn: "s.markerGlyph !== 'tick' && s.markerShown === 1", label: 'the changed-datum marker is a neutral Δ glyph (no tick)'},
    {at: 1, params: P('long-labels-stress'), fn: 's.tagsInChips', label: 'long labels: every tag text fits inside its chip with padding'},
    {at: 1, params: P('baseline-es'), fn: 's.tagsInChips', label: 'Spanish: every tag text fits inside its chip'},
    {at: 1, fn: "s.stateShown === 1 && /Subject included/.test(s.stateText) && /as supplied/.test(s.stateText)", label: 'the new dependent state is written in the note (as supplied)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.stateShown === 1 && /Subject not classified/.test(s.stateText)", label: 'alternative: the note says the card is now not classified (as supplied)'},
    {at: 0.6, fn: 's.stateShown === 0', label: 'the new state is written only once the card is re-sorted'},
    ...[0.29, 0.31, 0.33, 0.4, 0.79].map(at => ({at, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: 's.captionClear', label: `1:1 alternative: caption not under the window @${at}`})),
    ...[0.29, 0.31, 0.33, 0.4, 0.79].map(at => ({at, params: {...P('long-labels-stress'), ...TALL}, fn: 's.captionClear', label: `9:16 long labels: caption not under the window @${at}`})),
    {at: 0.6, params: {...P('long-labels-stress'), ...SQUARE}, fn: 's.windowShare >= s.contextShare * 0.9', label: '1:1 long labels: the detail window is not smaller than the miniature'},
    // defect class: key text shrunk (AUTHORING item 17) — the inspected card reads at ≥16 px in the window
    {at: 0.6, fn: 's.tagPxInWindow >= 16', label: '16:9: the inspected tag reads ≥16 px in the window'},
    {at: 0.6, params: {...P('long-labels-stress'), ...SQUARE}, fn: 's.tagPxInWindow >= 16', label: 'long labels, square box: the inspected tag reads ≥16 px in the window'},
    {at: 1, params: {...P('long-labels-stress'), ...TALL}, fn: 's.tagPxInWindow >= 16', label: 'long labels, tall box hold: the inspected tag reads ≥16 px in the window'},
  ],
});
