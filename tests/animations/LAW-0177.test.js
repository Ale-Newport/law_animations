// LAW-0177 — Representación de una parte · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (clip, form and hands
// share points at every hand-off) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65. Represented plan windows (c → u):
//   clip in the client's hand 0.11–0.20 → 0.2215–0.28; in the representative's 0.20–0.29 → 0.28–0.3385;
//   on the badge from 0.29 → 0.3385; form held by the client 0.34–0.41 → 0.371–0.4165;
//   representative on the right edge 0.40–0.46 → 0.41–0.449; turn 0.46–0.54; on the left edge
//   after the turn 0.54–0.86 → 0.501–0.709; clerk's hand on the right edge 0.85–0.90 → 0.7025–0.735.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const P = name => presetsFor('LAW-0177').find(q => q.name === name).params;
const OWN = P('contrast-or-alternative');
const near = (a, b) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) < 1.5`;

contractSuite('LAW-0177', {
  continuity: ['handC', 'handR', 'handK', 'sheet', 'clip', 'badge', 'reel'],
  continuityLimit: 60,
  attach: [
    {from: 0.223, to: 0.279, a: 'clip', b: 'handC', tol: 1.5},
    {from: 0.281, to: 0.337, a: 'clip', b: 'handR', tol: 1.5},
    {from: 0.34, to: 1, a: 'clip', b: 'badge', tol: 1.5},
    {from: 0.372, to: 0.416, a: 'handC', b: 'edgeL', tol: 1.5},
    {from: 0.411, to: 0.448, a: 'handR', b: 'edgeR', tol: 1.5},
    {from: 0.502, to: 0.708, a: 'handR', b: 'edgeL', tol: 1.5},
    {from: 0.704, to: 0.734, a: 'handK', b: 'edgeR', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.docAt === 'stand' && s.sheetUnfold === 0.1 && s.clipAt === 'reel' && !s.linked && s.bubble === 0 && s.tags === 0", label: 'rest: the form lies on the table, the clip sits on the reel, nobody is linked'},
    {at: 0.25, fn: `s.clipAt === 'client' && s.docAt === 'stand' && ${near('clip', 'handC')}`, label: 'the client pulls the clip out of the reel (the form waits on the table)'},
    {at: 0.2795, fn: `${near('handC', 'handR')} && ${near('clip', 'handC')}`, label: 'hand-off of the clip at a shared point: both hands meet on it'},
    {at: 0.36, fn: "s.linked && s.clipAt === 'badge' && s.docAt === 'stand'", label: 'the link is made before the form moves'},
    {at: 0.415, fn: `${near('handC', 'edgeL')} && ${near('handR', 'edgeR')} && s.sheetUnfold === 1`, label: 'hand-off of the form: both hands hold the same sheet (one edge each)'},
    {at: 0.44, fn: "s.docAt === 'rep' && s.repFacing === -1 && s.linked", label: 'the representative holds the form, still facing the client'},
    {at: 0.505, fn: "s.docAt === 'rep' && s.repFacing === 1", label: 'the representative has turned round with the form'},
    {at: 0.6, fn: "s.docAt === 'rep' && s.repX > 420 && s.repX < 800 && s.linked", label: 'walking to the counter; the ribbon stays attached'},
    {at: 0.72, fn: "s.docAt === 'tray' && s.bubble === 1", label: 'the form is let go into the counter tray while the representative speaks'},
    {at: 1, fn: "s.docAt === 'tray' && s.linked && s.repX === 810 && s.clientX === 110 && s.tags === 1 && s.allReached && s.truncated.length === 0", label: 'hold: received in the tray; the client stayed; the link is still drawn; tags shown'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.docAt === 'tray' && s.linked && s.repX === 810", label: 'labels hidden: the same action is visible (ribbon, walk, form in the tray)'},
    {at: 1, params: {finalState: 'presented'}, fn: "s.docAt === 'rep' && s.repX === 810", label: 'supplied state "presented": the form stays in the representative’s hand'},
    {at: 1, params: OWN, fn: "s.plan === 'own' && s.clientX === 810 && s.docAt === 'client' && s.clipAt === 'reel' && !s.linked && s.repX === 400", label: 'own action (no link supplied): the client walks up and holds the form out; nobody is clipped'},
    {at: 0.45, params: OWN, fn: "s.docAt === 'client' && s.clientX > 110 && s.repX === 400", label: 'own action: the client carries the form themself'},
    {at: 1, params: {relationships: []}, fn: "!s.linked && s.clipAt === 'reel' && s.docAt === 'tray' && s.repX === 810", label: 'no link supplied: nothing is clipped, even when the representative performs'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.docAt === 'stand' && s.tags === 0", label: 'actionProgress freezes the action part-way'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: no supplied text is cut`})),
  ],
});

suppliedTextSuite('LAW-0177', {
  fields: "const own = p.performer === 'client'; const link = (p.relationships || [])[0]; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, link && link.label, p.props.document, p.props.documentId, p.props.counterSign, p.props.speech, own ? p.objectLabels.ownAction : p.objectLabels.representedAction, ...p.annotations.map(a => a.text)];",
  content: "const own = p.performer === 'client'; const link = (p.relationships || [])[0]; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, link && link.label, p.props.document, p.props.documentId, p.props.counterSign, p.props.speech, own ? p.objectLabels.ownAction : p.objectLabels.representedAction, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Received at the counter', 'Presented at the counter', 'Recibido en ventanilla', 'Presentado en ventanilla'];",
});

// review round 2: 9:16 name tags stay attached and clear (no tag over another tag or over the carried
// form at any time), the ribbon clip stays visible in front of the representative after the turn, and
// the form never covers the client's face while it is handed over
const LABELS = "['chipg-client', 'chipg-rep', 'chipg-clerk', 'tag-link', 'tag-act-g', 'tag-state-g', 'note0-chip', 'note1-chip', 'note2-chip', 'key']";
const bb = "(n => { const e = svg.querySelector('[data-node=\"' + n + '\"]'); if (!e || !visible(e) || +getComputedStyle(e).opacity < 0.05) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? r : null; })";
const inter = '((a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)))';
ratioChecks('LAW-0177', 'tags clear of each other and of the carried form; clip visible; form off the face', [
  {at: [0.3, 0.4, 0.45, 0.5, 0.53, 0.56, 0.6, 0.65, 0.7, 0.8, 1], dom: `(() => { const B = ${bb}, I = ${inter}; const bs = ${LABELS}.map(B).filter(Boolean); for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (I(bs[i], bs[j]) > 2) return false; return true; })()`, label: 'labels never overlap each other (tags stay in their rows)'},
  {at: [0.4, 0.45, 0.5, 0.53, 0.56, 0.6, 0.65, 0.7], dom: `(() => { const B = ${bb}, I = ${inter}; const sh = B('st-sheet-body'); if (!sh) return true; return ${LABELS}.map(B).filter(Boolean).every(r => I(r, sh) <= 2); })()`, label: 'the carried form never covers a label'},
  {at: [0.55, 0.7, 1], presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: "(() => { const c = svg.querySelector('[data-node=\"st-clip\"]'), rp = svg.querySelector('[data-node=\"st-rp\"]'); return c && rp && visible(c) && Boolean(rp.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); })()", label: 'after the turn the ribbon clip is drawn in front of the representative (visible)'},
  {at: [0.38, 0.41, 0.43, 0.45, 0.47, 0.5], presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: `(() => { const B = ${bb}, I = ${inter}; const hd = B('st-cl-head'), sh = B('st-sheet-body'); if (!hd || !sh) return true; return I(hd, sh) / (hd.width * hd.height) < 0.15; })()`, label: 'the form never covers the client’s face during the hand-over'},
]);
