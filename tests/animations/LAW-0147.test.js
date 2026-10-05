// LAW-0147 — Delegación normativa · contrast. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: both scenes exist, exactly the indicated fact changes (the supplied link
// state written on the tag, and with it the clip's placement and the cord's slack), and no legal
// consequence is invented (the states are supplied; nothing says valid, binding or ultra vires).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {wordBreakSuite} from './delegacion-normativa-words.js';

const SHAPES = {row: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0147').map(pr => [pr.name, pr.params]), ['labels-hidden', {textVisibility: 'none'}]];
const each = (times, fn, label, skip = []) => variants.filter(([n]) => !skip.includes(n)).flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}, t=${at})`,
}))));

contractSuite('LAW-0147', {
  continuity: ['clipA', 'clipB', 'handA', 'handB', 'tagA', 'tagB'],
  attach: [
    // each clip rides its clerk's hand from the pick-up until the hand lets go (press <= 5 units)
    {from: 0.401, to: 0.629, a: 'handA', b: 'gripA', tol: 6},
    {from: 0.401, to: 0.629, a: 'handB', b: 'gripB', tol: 6},
  ],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.stateWritten && s.a.tagFlip === 0', label: 'base: the two scenes are identical and both tags are blank'},
    {at: 0.3, fn: "s.stateWritten && s.a.tagFlip === 1 && s.b.tagFlip === 1 && s.a.clipHolder === 'desk' && JSON.stringify(s.a.clip) === JSON.stringify(s.b.clip)", label: 'change: the one changed fact is written on the tags before anything moves'},
    {at: 0.5, fn: "s.a.clipHolder === 'hand' && s.b.clipHolder === 'hand' && s.a.hlArt === 0 && s.b.pencilArt === 0", label: 'parallel: the same hand carries both clips; no mark on the passage yet'},
    {at: 1, fn: "s.a.clipFastened && !s.b.clipFastened && s.b.clipOffPage && s.a.hlArt === 1 && s.b.pencilArt === 1 && s.b.hlArt === 0 && s.guideShown && s.finalShown", label: 'hold: A clamped on the page (passage highlighted); B laid open beside it (pencil outline); guide and note shown'},
    {at: 1, params: {states: {a: 'authorization-supplied', b: 'authorization-supplied'}}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'geometry follows the SUPPLIED states: equal states give equal scenes (nothing invented)'},
    {at: 1, params: {states: {a: 'authorization-to-be-checked', b: 'authorization-supplied'}}, fn: '!s.a.clipFastened && s.b.clipFastened', label: 'reversed states reverse the geometry'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.clipFastened && !s.b.clipFastened && s.guideShown', label: 'the contrast plays identically with labels hidden'},
    {at: 1, fn: "s.changedFact === 'link-state' && s.allReached", label: 'exactly one fact (the supplied link state) differs; every hand target reachable'},
    ...each([0.9], 's.finalShown && s.beat === "guide"', 'final beat complete by t=0.9'),
    ...each([1], 's.laneBadges.a !== s.laneBadges.alarm && s.laneBadges.b !== s.laneBadges.alarm && s.laneBadges.a !== s.laneBadges.b', 'A/B badges in lane colours, not the alarm accent'),
    ...each([1], 's.tagClear && s.footerWhole', 'tags hang clear of the texts and clips; shared footer whole'),
    // AUTHORING 18: each desk >= 40 % of the frame width side by side (16:9, 1:1); stacked (9:16) each desk
    // spans the frame (>= 70 % of the width, the rest is the side margins at the text floor)
    ...each([1], "s.arrangement === 'column' ? s.deskFrac >= 0.7 : s.deskFrac >= 0.4", 'desks are substantial scenes'),
  ],
});

identicalBeforeChange('LAW-0147', 0.17);

const CONTENT = 'return [...p.sources.map(s => `${s.id} · ${s.title}`), `§ ${p.sources[0].provision}`, ...p.passages.map(x => x.text.slice(0, Math.max(8, x.text.toLowerCase().indexOf(x.phrase.toLowerCase()))).trim()), ...p.hierarchy.levels, p.scenarioA.label, p.scenarioB.label, p.changedFact];';
suppliedTextSuite('LAW-0147', {
  fields: 'return [...p.sources.flatMap(s => [s.id, s.title, s.provision]), ...p.passages.map(x => x.phrase), ...p.hierarchy.levels, p.hierarchy.caption, ...p.interpretations.flatMap(i => [i.by, i.text]), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  // (specific strings: a provision such as "Art. 12" also occurs inside other captions)
  content: CONTENT,
  // generic captions: scenario captions, the shared-plate and board headers, the tags' state words, the guide
  // word and the neutral note
  captions: 'const es = p.locale === "es"; return [p.scenarioA.caption, p.scenarioB.caption, es ? "Igual en A y B" : "Same in A and B", es ? "Jerarquía editable" : "Editable hierarchy", es ? "Facilitada" : "Given", es ? "A comprobar" : "To check", p.comparisonLabels.guide, p.comparisonLabels.neutral];',
});

wordBreakSuite('LAW-0147', {extra: ['Same in A and B', 'Igual en A y B']});
