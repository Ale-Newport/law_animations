// LAW-0442 — Oferta comunicada · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element, the visiting order does not
// change with seeking, and a plain relation is never drawn as causation by default.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0442', {
  continuity: ['tracer', 'packet'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && Object.values(s.checkpoints).every(v => !v) && s.tilesOut === 0', label: 'starts with nothing related or traced'},
    {at: 0.18, fn: 's.tilesOut === 1 && s.relationsDrawn.every(p => p === 0)', label: 'terms are separated out of the body before relations are drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && !s.checkpoints.sent', label: 'all relations drawn before the tracer runs'},
    {at: 0.5, fn: 's.anchoredEnds', label: 'every connector starts and ends on the edge of its own element'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal')", label: 'no causal link unless supplied (plain relation has no arrow)'},
    {at: 0.62, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['offeror','offer','terms','offer','message','offeree'])", label: 'tracer visits in the supplied traversal order'},
    {at: 0.95, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['offeror','offer','terms','offer','message','offeree'])", label: 'visiting order is the same after seeking elsewhere'},
    {at: 1, fn: "JSON.stringify(s.checkpointOrder) === JSON.stringify(['composed','sent','inTransit','received']) && Object.values(s.checkpoints).every(v => v)", label: 'checkpoints light composed → sent → in transit → received'},
    {at: 1, fn: '!s.tracerVisible && s.delivered && s.receivedCopy === 1', label: 'ends with the same terms shown at the offeree and the tracer gone'},
    {at: 0.6, params: {traversalOrder: ['offeree', 'message', 'offer']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['offeree','message','offer'])", label: 'tracer follows a supplied traversal order'},
    {at: 0.66, fn: 's.packet !== null && Math.hypot(s.packet.x - s.tracer.x, s.packet.y - s.tracer.y) < 0.5', label: 'the sealed mailer rides ON the channel with the tracer'},
    {at: 1, fn: 's.checkpointsClear', label: 'checkpoint captions hang clear of elements, captions and the band the mailer sweeps'},
  ],
});
