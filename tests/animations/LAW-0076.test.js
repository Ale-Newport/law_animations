// LAW-0076 — Matriz de autoridades · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is local, and
// seeking back to earlier times restores exactly the previous datum.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0076', {
  continuity: ['contextPin', 'lensPin'],
  semantic: [
    {at: 0.19, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextPlace === 'col0' && s.contextNote === 0", label: 'build: the context shows the supplied state (row 1 pinned in S1)'},
    {at: 0.42, fn: "s.lensOpen === 1 && s.datum === 'before' && s.lensPlace === 'col0' && s.thumb === 1", label: 'isolate: the lens is open on the unchanged row; the context is kept as a thumbnail'},
    {at: 0.42, fn: 's.sourceContainsFocus', label: 'the lens source region contains the card edge, the old cell and the new place (same coordinates)'},
    {at: 0.58, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.contextPlace === 'col0'", label: 'substitute: the datum changes inside the lens only'},
    {at: 0.72, fn: "s.lensPlace === 'card' && s.contextPlace === 'col0' && s.contextNote === 0", label: 'lens: the pin is back on its card; the context (thumbnail) is still unchanged'},
    {at: 0.45, fn: "s.cardInLens && s.headsInLens && s.lensTiles.columns === 1 && s.zoom >= 1.85", label: 'the lens shows the whole proposition card, the cited column head and the cell (empty columns collapsed), enlarged'},
    {at: 0.45, params: {afterValue: 'S3 · p. 2'}, fn: "s.cardInLens && s.headsInLens && s.lensTiles.columns === 2", label: 're-link: the lens keeps the card + old column and the new column; the column between is collapsed'},
    {at: 0.56, params: {afterValue: 'S3 · p. 2'}, fn: "s.lensPlace === 'moving' && s.lensPinScreen.x > s.lensRect.x && s.lensPinScreen.x < s.lensRect.x + s.lensRect.w", label: 're-link: the pin stays visible inside the lens while it crosses the collapsed column'},
    {at: 1, fn: "s.lensOpen === 0 && s.thumb === 0 && s.contextDatum === 'after' && s.contextPlace === 'card' && s.contextNote === 1 && s.ghost === 1 && s.markerShown", label: 'return: full-size context shows the new datum, a ghost where the old one was and the marker'},
    {at: 1, fn: 's.otherLinks === 2', label: 'the change is local: the other supplied links are untouched'},
    {at: 0.3, fn: "s.contextPlace === 'col0' && s.datum === 'before' && s.contextNote === 0 && s.ghost === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {afterValue: 'S3 · p. 2'}, fn: "s.contextPlace === 'col2' && s.afterPlace === 'col2' && s.contextFlagText === 'p. 2' && s.contextNote === 0", label: 'source substitution to another supplied source: the pin moves to its column'},
    {at: 0.3, params: {afterValue: 'S3 · p. 2'}, fn: "s.contextPlace === 'col0' && s.contextFlagText === 'p. 1'", label: 'seeking back after a re-link restores the old column and pinpoint'},
    {at: 1, params: {focusTarget: 'pinpoint', beforeValue: 'p. 1', afterValue: 'p. 4'}, fn: "s.contextPlace === 'col0' && s.contextFlagText === 'p. 4' && s.ghost === 0", label: 'pinpoint substitution: only the flag text changes, the pin stays'},
    {at: 1, params: {focusRow: 2, afterValue: 'S2'}, fn: "s.beforePlace === 'card' && s.contextPlace === 'col1' && s.contextNote === 0", label: 'a pending row re-linked to a supplied source: the note leaves, the pin runs to the column'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.lensOpen >= 0 && s.lensPlace === 'card'", label: 'labels hidden: the same substitution happens'},
  ],
});
