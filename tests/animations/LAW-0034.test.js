// LAW-0034 — Notificación documentada · mechanism. Contract battery + ID-specific checks.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/documents/LAW-0034.presets.json', import.meta.url), 'utf8')).presets;
const preset = name => presets.find(x => x.name === name).params;
// a caption-safe box narrow enough to select the portrait layout inside the 1920×1080 semantic frame
const PORTRAIT = {safeArea: {left: 0.35, right: 0.35, top: 0.06, bottom: 0.06}};
// captions of different elements never stack in a column or run together on one line (the record
// file's caption right above the card's read as one two-part label) and keep a clear gap
const CAPTIONS_APART = 's.captionsLinedUp === 0 && s.captionGap >= 28';

contractSuite('LAW-0034', {
  allowTextOverlap: ['RECEIVED', 'RECIBIDO', 'Day', 'Día'], // the date stamp intentionally overprints the card's reference rows
  continuity: ['tracer', 'envelope', 'card', 'document', 'penTip', 'stampTool', 'envelopeCopy', 'cardCopy'],
  attach: [
    // whenever the recipient's pen is on the card (the window depends on the route length per ratio),
    // its tip rides the card's signature stroke; penContact is only defined during that contact
    {from: 0.43, to: 0.76, a: 'penContact', b: 'strokePoint', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.signature === 0 && !s.delivered && !s.filed', label: 'starts assembled: nothing delivered, signed or filed'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 1, fn: 's.connectorsLanded.every(Boolean)', label: 'every connector starts and ends on the edge of its own element'},
    {at: 0, fn: "!s.relationKinds.includes('causal') && s.relationKinds.includes('relation')", label: 'default relationships are relation / sequence / communication — no causal arrow unless supplied'},
    {at: 0.5, fn: 's.signature === 0 && !s.delivered', label: 'states change only when the tracer reaches them (cause precedes effect)'},
    {at: 0.64, fn: 's.delivered && s.penOnCard && s.signature > 0 && s.signature < 1 && !s.filed', label: 'the card is signed after delivery and before filing'},
    {at: 1, fn: 's.signature === 1 && s.stamped && s.delivered && s.filed && !s.tracerVisible', label: 'gather: delivered, signed, stamped and filed; tracer gone'},
    {at: 0.3, fn: 's.envelopeCopy === undefined && s.cardCopy === undefined', label: 'no delivered / filed copy exists before the tracer carries it'},
    {at: 1, fn: 'Math.abs(s.envelopeCopy.x - s.tracer.x) + Math.abs(s.envelopeCopy.y - s.tracer.y) > 0 && s.cardCopy !== undefined', label: 'the delivered envelope and the filed card copy travelled and stay in place'},
    {at: 0.3, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['sender','outTray','envelope','inTray','recipient','acknowledgment','folder'])", label: 'visit order is the supplied traversal order at any seek time'},
    {at: 0.3, fn: 's.labelsThinned === 0', label: 'labels are only thinned while an object passes under them, never at rest'},
    {at: 1, fn: 's.labelsThinned === 0', label: 'no label stays thinned in the held final state'},
    {at: 0.6, params: {traversalOrder: ['folder', 'acknowledgment', 'recipient']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','acknowledgment','recipient'])", label: 'tracer follows a supplied traversal order'},
    {at: 1, fn: CAPTIONS_APART, label: 'landscape: element captions stay apart (no stacked or run-on pair)'},
    {at: 1, params: PORTRAIT, fn: CAPTIONS_APART, label: 'portrait: element captions stay apart (no stacked or run-on pair)'},
    {at: 1, params: {...preset('baseline-es'), ...PORTRAIT}, fn: CAPTIONS_APART, label: 'portrait, Spanish: the record file and the card keep separate captions'},
    {at: 1, params: {...preset('contrast-or-alternative'), ...PORTRAIT}, fn: CAPTIONS_APART, label: 'portrait, alternative: the record file and the card keep separate captions'},
  ],
});
