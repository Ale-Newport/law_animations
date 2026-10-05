// LAW-0145 — Delegación normativa · story. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: continuity of motion (hands, clip, lens, tag), object anchoring (the clip
// rides the clerk's hand, the lens rides the reader's hand, the tag rides the cord, the cord keeps
// its length) and a transformation that stays recognizable with the labels hidden.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {wordBreakSuite} from './delegacion-normativa-words.js';

// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const SHAPES = {horizontal: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, vertical: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0145').map(pr => [pr.name, pr.params]), ['labels-hidden', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([layout, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn: `s.layout === '${layout}' && (${fn})`, label: `${label} (${name}, ${layout}, t=${at})`,
}))));

contractSuite('LAW-0145', {
  continuity: ['clip', 'handC', 'handR', 'lens', 'tag'],
  attach: [
    // the clip rides the clerk's hand from the pick-up until the hand lets go (press ≤ 5 units)
    {from: 0.401, to: 0.659, a: 'handC', b: 'clipGrip', tol: 6},
    // the lens rides the reader's hand from pick-up until it is put back
    {from: 0.161, to: 0.429, a: 'handR', b: 'lensGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.clipHolder === 'desk' && !s.clipFastened && s.tagFlip === 0 && s.hlRef === 0 && s.hlArt === 0 && s.lensHolder === 'desk'", label: 'rest: clip and blank tag on the desk, nothing highlighted, lens at rest'},
    {at: 0.3, fn: "s.lensHolder === 'hand' && s.lensOverRef && s.lensShowsCopy && s.clipHolder === 'desk'", label: 'the reader holds the lens over the basis clause; its glass shows an enlarged copy'},
    {at: 0.34, fn: "s.hlRef === 1 && s.hlArt === 0 && !s.clipFastened", label: 'the reference phrase is highlighted before the cord is carried'},
    {at: 0.5, fn: "s.clipHolder === 'hand' && !s.clipFastened && s.hlArt === 0 && s.tagFlip === 0", label: 'the clip is carried by the hand; no state is shown yet (cause precedes effect)'},
    ...[0, 0.3, 0.45, 0.5, 0.55, 0.62, 0.7, 1].map(at => ({at, fn: 'Math.abs(s.cordLen - s.cordTarget) < 3', label: `the cord keeps its length @${at}`})),
    {at: 1, fn: "s.clipFastened && s.clipOpen === 0 && s.hlArt === 1 && s.stateShown && s.keyShown && s.lensHolder === 'desk' && s.clipHolder === 'desk' && s.finalState === 'authorization-supplied'", label: 'hold: supplied "authorization supplied" — clip clamped on the enabling page, passage highlighted, tag written, key shown'},
    {at: 1, params: {finalState: 'authorization-to-be-checked'}, fn: "!s.clipFastened && s.clipOffPage && s.clipOpen === 1 && s.hlArt === 0 && s.pencilArt === 1 && s.stateShown && s.cordBulge > 0", label: 'supplied "to be checked": clip laid open beside the page, slack cord, pencil outline only'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.clipFastened && s.hlArt === 1 && s.stateShown", label: 'the transformation completes identically with labels hidden'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && !s.clipFastened && s.tagFlip === 0 && s.hlArt === 0", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [1, 0], caption: 'Order as supplied'}}, fn: "s.finalState === 'authorization-supplied' && s.clipFastened", label: 'swapping the supplied hierarchy does not change the supplied state (the ordering is never applied)'},
    // AUTHORING 12 / 1 / 8: the parked lens lies inside the desk and clear of the objects; chips keep every
    // word; the key and notes sit clear of the objects; the tag stays on the desk
    ...each([0, 1], 's.lensParkedInDesk && s.lensParkedClear && s.keyChipsWhole', 'parked lens inside the desk and clear; key chips whole'),
    ...each([1], 's.notesClear && s.keyClear && s.tagInside', 'key and notes clear of the objects; tag on the desk'),
    ...each([1], 's.allReached', 'every hand target reachable'),
    // review: the carried clip stays in view (held by its wire loop, its body clear of the fist)
    ...[0.45, 0.5, 0.55].map(at => ({at, fn: 'Math.hypot(s.clip.x - s.handC.x, s.clip.y - s.handC.y) >= 24', label: `the carried clip body stays beside the fist, not inside it @${at}`})),
    // review: a note's leader ends on its own target (the link note points at the clip) and keeps clear of the key
    ...each([1], 's.noteLeaders.every(n => n.endInTarget && n.keyGap >= 12)', 'note leaders end on their targets and keep clear of the key chip'),
  ],
  // the lens shows a real magnified copy (text copies marked with a zero-width space overprint the originals)
  allowTextOverlap: ['​'],
});

const PIECES = 'const sp = (t, ph) => { const i = t.toLowerCase().indexOf(ph.toLowerCase()); return (i < 0 ? [t, ph] : [t.slice(0, i), t.slice(i, i + ph.length), t.slice(i + ph.length)]).map(x => x.trim()).filter(x => x.length > 1); };';
suppliedTextSuite('LAW-0145', {
  fields: `${PIECES} return [...p.sources.flatMap(s => [s.id, s.title, s.provision]), ...p.passages.flatMap(x => sp(x.text, x.phrase)), ...p.hierarchy.levels, p.hierarchy.caption, ...p.interpretations.flatMap(i => [i.by, i.text]), p.actorLabels.a, p.actorLabels.b, p.objectLabels.hierarchy, ...p.annotations.map(a => a.text)];`,
  content: `${PIECES} return [...p.sources.flatMap(s => [s.title, s.provision]), ...p.passages.flatMap(x => sp(x.text, x.phrase)), ...p.hierarchy.levels, ...p.interpretations.flatMap(i => [i.text])];`,
  // generic captions: kit key / headers / state labels, legend entries, annotations and supplied captions
  // review: small print (ids, attribution, board header) is >= 16 px in every preset and ratio
  minAny: 16,
  captions: 'const es = p.locale === "es"; const K = [es ? "Según lo aportado · sin conclusión" : "As supplied · no conclusion drawn", es ? "Lectura propuesta" : "Reading proposed", es ? "Jerarquía editable" : "Editable hierarchy", es ? "Habilitación aportada" : "Authorization supplied", es ? "Habilitación por comprobar" : "Authorization to be checked"]; return [...K, p.actorLabels.a, p.actorLabels.b, p.objectLabels.hierarchy, p.hierarchy.caption, ...p.annotations.map(a => a.text)];',
});

wordBreakSuite('LAW-0145');
