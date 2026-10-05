// LAW-0002 — Firma de documento · mechanism. Contract battery + ID-specific checks.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0002', {
  continuity: ['tracer', 'signatureLayer'],
  semantic: [
    {at: 0, fn: 's.signatureProgress === 0 && !s.tracerVisible', label: 'starts with an empty signature layer and no tracer'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.45, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible', label: 'all relations drawn before the tracer runs'},
    {at: 0.44, fn: 's.signatureProgress === 0', label: 'the signature layer only changes when the tracer passes the pen'},
    {at: 1, fn: 's.signatureProgress === 1 && s.delivered && !s.tracerVisible', label: 'ends signed and delivered with the tracer gone'},
    {at: 0.6, params: {traversalOrder: ['recipient', 'folder', 'document']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['recipient','folder','document'])", label: 'tracer follows the supplied traversal order'},
  ],
});
