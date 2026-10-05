// LAW-0173 — Intervención de perito · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (hand, magnifier grip, lens, tag eyelet), object anchoring
// (the magnifier and the tag ride the SOLVED hand; the pinned tag stays on its pin) and a
// transformation that is recognisable with the labels hidden (checked on semantic state).
// Clock mapping (LAW-0173.js): c = (u − 0.15)/0.27 · 0.56 up to u 0.42, then 0.56 + (u − 0.42)/0.24 · 0.44.
// Kit windows (c → u): magnifier held 0.10–0.56 → 0.198–0.42; tag held 0.64–0.90 → 0.464–0.606;
// pin placed at c 0.88 → u 0.5945; figure drawn 0.60–0.68, rows from 0.64, fence 0.70–0.755,
// opinion 0.725–0.77, scope 0.745–0.79, key 0.77–0.81, notes 0.79–0.86.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0173').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));

contractSuite('LAW-0173', {
  continuity: ['hand', 'magGrip', 'lens', 'tagEye'],
  continuityLimit: 60,
  attach: [
    // the magnifier is held by the solved hand from the pick-up to the moment it is laid down again
    {from: 0.2, to: 0.418, a: 'magGrip', b: 'hand', tol: 1},
    // the tag's eyelet rides the solved hand while carried and pushed onto the pin
    {from: 0.466, to: 0.604, a: 'tagEye', b: 'hand', tol: 1},
    // afterwards it stays on the pin
    {from: 0.608, to: 1, a: 'tagEye', b: 'pinPt', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.magHolder === 'bench' && s.tagHolder === 'bench' && s.lensOn === 0 && s.fig === 0 && s.rows.every(v => v === 0) && s.fence === 0 && s.opinion === 0", label: 'rest: magnifier and tag on the bench, report sections empty'},
    {at: 0.3, fn: "s.magHolder === 'hand' && s.lensOn === 1 && s.tagHolder === 'bench' && s.fig === 0", label: 'action: the lens is held over the object; nothing is linked yet'},
    {at: 0.45, fn: "s.magHolder === 'bench' && s.tagHolder === 'bench' && s.fig === 0", label: 'the magnifier is laid down before the tag is taken'},
    {at: 0.55, fn: "s.tagHolder === 'hand' && !s.pinned && s.fig === 0 && s.rows.every(v => v === 0)", label: 'the tag travels in the hand; the report is still empty (cause first)'},
    {at: 0.598, fn: 's.pinned && s.fig === 0', label: 'the pin is in before the figure starts'},
    {at: 0.69, fn: 's.fig === 1 && s.rows[0] > 0 && s.fence === 0 && s.opinion === 0', label: 'figure first, then the data rows; the opinion block is still closed'},
    {at: 0.8, fn: 's.fig === 1 && s.rows.every(v => v === 1) && s.fence === 1 && s.opinion === 1 && s.scope === 1', label: 'main action complete by u 0.8'},
    {at: 1, fn: "s.allReached && s.pinned && s.tagHolder === 'pinned' && s.magHolder === 'bench' && s.fig === 1 && s.rows.every(v => v === 1) && s.fence === 1 && s.opinion === 1 && s.scope === 1 && s.key === 1", label: 'hold: object ↔ tag ↔ Fig. 1 linked; data and opinion as supplied; key shown'},
    {at: 1, fn: "JSON.stringify(s.linked) === JSON.stringify(['figure','data'])", label: 'relationships: the object is linked to the figure and the data (as supplied)'},
    {at: 1, params: {relationships: [{from: 'object', to: 'opinion'}]}, fn: "JSON.stringify(s.linked) === JSON.stringify(['opinion'])", label: 'another supplied link marks the opinion block instead'},
    {at: 1, params: {finalState: 'data-only'}, fn: "s.finalState === 'data-only' && s.rows.every(v => v === 1) && s.scope === 0", label: 'supplied state: data only (no opinion supplied, no scope shown)'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.magHolder === 'hand' && !s.pinned && s.fig === 0", label: 'actionProgress freezes the action part-way (nothing linked)'},
    {at: 0.61, params: {textVisibility: 'none'}, fn: "s.pinned && s.tagHolder === 'pinned'", label: 'labels hidden: the same pinned tag'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.fig === 1 && s.fence === 1 && s.rows.every(v => v === 1)', label: 'labels hidden: figure, filled rows and the closed scope fence still read'},
    {at: 0.3, params: {props: {objectKind: 'jar'}}, fn: "s.magHolder === 'hand' && s.lensOn === 1", label: 'the sample jar is examined with the same hand and lens'},
    // AUTHORING item 12: the parked magnifier rests clear of every label; all labels are placed uncut
    ...each([1], 's.magParkClear && s.notesFit && s.chipsFit && s.allReached', 'parked magnifier clear of labels; notes and chips fit'),
    // continuity of the reach across every ratio / preset (hands never stretch off their props)
    ...each([0.2, 0.3, 0.46, 0.55, 0.6], 's.allReached', 'every IK target within reach'),
  ],
});

suppliedTextSuite('LAW-0173', {
  fields: "const R = p.props.report; const dataOnly = p.finalState === 'data-only'; return [p.actors[0].name, p.actorLabels.specialist || p.roles.specialist, p.props.object, p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements, R.opinionHeading, dataOnly ? null : R.opinion, dataOnly ? null : R.scope, p.objectLabels.tool, ...p.annotations.map(a => a.text)];",
  content: "const R = p.props.report; return [p.props.tag, R.title, R.figure, R.dataHeading, ...R.measurements, R.opinionHeading, R.opinion, R.scope];",
  captions: 'return [p.objectLabels.tool, ...p.annotations.map(a => a.text)];',
});

// Review round 1 fixes, checked in every preset × real ratio × labels shown/hidden
ratioChecks('LAW-0173', 'review round 1: resting hands, attached name chip, leaders clear of the page text', [
  // resting arms: both hands flat on the bench at rest and back there in the hold (never across the torso)
  {at: [0, 0.1, 0.8, 1], fn: 's.handsOnBench', label: 'hands rest on the bench top (rest pose)'},
  // the specialist's name chip always has a leader to the person
  {at: [1], fn: 's.nameLeader', label: 'name chip attached to the specialist by a leader'},
  // no leader (chips and notes) crosses a text block of the page (the key included) or the person
  {at: [1], fn: 's.leadersClear && s.notesFit && s.chipsFit', label: 'leaders clear of page text and of the person; labels placed uncut'},
  // review round 1 (standing rule): no supplied text is drawn over its placeholder dashes mid-transition
  {at: times(0.55, 0.9, 0.005), dom: `[...svg.querySelectorAll('[data-node]')].filter(e => /-ph-(row\\d+|op)$|^d-ph\\d+$|^op-ph$/.test(e.dataset.node)).every(ph => { const n = ph.dataset.node; const tn = n.replace('-ph-row', '-row').replace(/-ph-op$/, '-op').replace(/^d-ph/, 'd-row').replace(/^op-ph$/, 'op-text'); const t = svg.querySelector('[data-node="' + tn + '"]'); const o = e => Number(e.getAttribute('opacity') ?? 1); return !t || o(ph) === 0 || o(t) === 0; })`, label: 'placeholder leaves before its text arrives', presets: ['baseline-illustrative', 'long-labels-stress'], tv: ['all']},
]);
