// LAW-0082 — Hecho y regla · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the traversal order does
// not change with seeking, and a relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

const SEQ = {
  relationships: [
    {from: 'fact', to: 'connector', kind: 'sequence', label: '1 · pushes'},
    {from: 'connector', to: 'rule', kind: 'sequence', label: '2 · meets'},
  ],
};
const CAUSAL = {relationships: [{from: 'fact', to: 'connector', kind: 'causal'}, {from: 'connector', to: 'rule', kind: 'relation'}]};
const ORDER = "JSON.stringify(s.visitOrder) === JSON.stringify(['fact', 'connector', 'rule'])";

contractSuite('LAW-0082', {
  continuity: ['card', 'plate', 'lupa', 'tracer', 'tip0', 'tip1', 'tip2'],
  semantic: [
    {at: 0, fn: 's.assembled && s.exploded === 0 && s.travel.every(v => v === 0) && s.links.every(l => l.drawn === 0)', label: 'start: the docked assembly, every bolt retracted in the card, no link drawn'},
    {at: 0.18, fn: 's.exploded === 1 && s.boltsInTray.every(v => v) && s.links.every(l => l.drawn === 0)', label: 'separate: card and plate apart, every bolt out of its channel and in the connector tray; links not yet drawn'},
    {at: 0.43, fn: 's.links.every(l => l.drawn === 1) && s.linksLanded && !s.causalDrawn && !s.arrowsOnRelations', label: 'relate: only the supplied links, each ending on its element; plain relations without arrowheads'},
    {at: 0.43, fn: 'JSON.stringify(s.links.map(l => l.segments)) === JSON.stringify([3, 3, 1])', label: 'fact↔connector and connector↔rule are drawn for every row; the magnifier link is one line'},
    {at: 0.3, fn: `${ORDER} && !s.tracerVisible`, label: 'traversal order is the supplied one (fixed before the tracer starts)'},
    {at: 0.592, fn: `s.tracerVisible && s.tracerAt === 'connector' && s.focusScale > 1.08 && ${ORDER}`, label: 'trace: the tracer reaches the connector and the focus bolt enlarges; order unchanged after seeking'},
    {at: 0.7, fn: "s.tracerAt === 'connector' && s.focusScale < 1.03 && s.lupaOnFocusBolt", label: 'the enlargement ends once the tracer has passed; the magnifier now sits on the focus bolt'},
    {at: 0.745, fn: "s.visited.join() === 'fact,connector,rule' && s.boltsInTray.every(v => v) && s.linksLanded", label: 'the tracer visits every component in order; bolts still in the tray, links still landed'},
    {at: 0.8, fn: 's.linksLanded && s.fcWiresVisible && s.trayVisible && s.boltsInTray.every(v => v) && s.apart', label: 'gather starts: the parts stay apart, the tray and every wire stay visible and attached'},
    {at: 0.86, fn: 's.linksLanded && s.fcWiresVisible && s.trayVisible && !s.boltsInTray[0] && s.apart', label: 'gather: a bolt is lifted from the tray onto its row with its wire still attached'},
    {at: 1, fn: "s.apart && s.trayVisible && s.fcWiresVisible && s.linksLanded && s.seated[0] && s.seated[1] && !s.seated[2] && s.stoppedShort[2] && s.lupaAtJoint && s.keyVisible && s.wireLabelsVisible && s.wireLabels === 3 && JSON.stringify(s.statuses) === JSON.stringify(['as-supplied', 'as-supplied', 'disputed'])", label: 'final hold: exploded parts diagram (card and plate apart, emptied tray kept); bolts at their SUPPLIED stops (two seat, the disputed one stops short) with their wires; every connection labelled; magnifier on that joint; key visible'},
    {at: 0.3, fn: `${ORDER} && s.links[0].drawn === 1`, label: 'seeking back after the end restores the relate state (same order, first link drawn)'},
    {at: 0.5, params: SEQ, fn: "s.links.every(l => l.kind === 'sequence' && l.arrow) && !s.causalDrawn && s.linksLanded", label: 'supplied sequence links get arrowheads, still no causal arrow'},
    {at: 0.5, params: CAUSAL, fn: "s.causalDrawn && s.links[0].kind === 'causal' && s.links[1].kind === 'relation' && !s.links[1].arrow", label: 'a causal arrow appears only where the author supplies causal'},
    {at: 0.6, params: {traversalOrder: ['rule', 'connector', 'fact'], focusElement: 'rule'}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['rule', 'connector', 'fact']) && s.visited[0] === 'rule'", label: 'a supplied traversal order is followed as given'},
    {at: 1, params: {relationships: [{from: 'fact', to: 'fact', kind: 'relation'}, {from: 'connector', to: 'rule', kind: 'relation'}, {from: 'rule', to: 'connector', kind: 'sequence'}]}, fn: 's.links.length === 1 && s.links[0].kind === "relation"', label: 'self-links and duplicate pairs are ignored (first supplied wins)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.seated[0] && s.seated[1] && s.stoppedShort[2] && s.apart && s.trayVisible && s.fcWiresVisible', label: 'labels hidden: the same mechanism and states'},
    {at: 1, params: {textVisibility: 'all', facts: {title: 'F', attributes: [{text: 'a', status: 'as-supplied'}, {text: 'b', status: 'pending'}, {text: 'c', status: 'as-supplied'}, {text: 'd', status: 'disputed'}]}, rules: {title: 'R', conditions: ['A', 'B', 'C', 'D']}, issues: []}, fn: 's.travel.length === 4 && s.seated[0] && !s.seated[1] && s.travel[1] === 0 && s.boltsInTray[1] && s.seated[2] && s.stoppedShort[3] && s.focusRow === 3', label: 'four rows: a pending bolt stays in the tray, the others go to their supplied stops'},
  ],
});
