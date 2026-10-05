// LAW-0063 — Fuente primaria y comentario · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (what the side
// note carries: the source's own words vs the commentator's interpretation), and no legal
// consequence is invented to complete the contrast.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0063', {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.a && s.b && s.samePassage && !s.a.pinned && !s.b.pinned && s.a.marked === 0 && s.b.marked === 0 && s.beat === 'base'", label: 'two complete scenes with an identical base (nothing marked or placed yet)'},
    {at: 0.3, fn: "s.a.marked > 0 && s.b.marked > 0 && s.a.marked === s.b.marked && s.footer === 'changed-fact'", label: 'the change is introduced in parallel and named'},
    {at: 0.55, fn: "s.a.side === 'strip' && s.a.sideOrigin === 'source page' && s.b.side === 'card' && s.b.sideOrigin === 'commentary shelf'", label: 'A’s note comes from the page (copied words); B’s from the commentary shelf'},
    {at: 0.55, fn: 's.a.at.y !== s.b.at.y || s.a.at.x !== s.b.at.x', label: 'the changed fact alters geometry and path, not only text'},
    {at: 0.62, fn: 's.a.landed && s.b.landed && s.a.clearOfPage && s.b.clearOfPage', label: 'both side notes land beside the page, clear of its text'},
    {at: 0.76, fn: 's.a.pinned && s.b.pinned && s.a.tied && s.b.tied', label: 'both are pinned and tied to the same passage'},
    {at: 1, fn: "s.guideProgress === 1 && s.footer === 'neutral'", label: 'closing guide drawn; neutral note (no winner or outcome)'},
    {at: 1, fn: 's.tagGuideGap >= 20', label: 'the closing guide keeps clear of the side-note tags'},
    {at: 1, params: {citations: {passage: 3}}, fn: 's.a.passage === 3 && s.b.passage === 3 && s.samePassage', label: 'the linked passage stays identical in both scenes'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.a.tied && s.b.tied && s.guideProgress > 0', label: 'the contrast reads with labels hidden'},
  ],
});
