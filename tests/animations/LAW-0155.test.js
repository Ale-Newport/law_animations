// LAW-0155 — Interpretaciones concurrentes · contrast. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: both scenes exist, exactly the indicated fact changes
// (which words each reading highlights), and no legal consequence is invented.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const CHANGE = 0.17;

contractSuite('LAW-0155', {
  continuity: ['handA', 'handB', 'filmA', 'filmB', 'penA', 'penB'],
  attach: [
    // each overlay rides its hand by the pull tab: laid on the passage, then slid into the tray
    {from: 0.161, to: 0.259, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.161, to: 0.259, a: 'handB', b: 'gripB', tol: 1.5},
    {from: 0.491, to: 0.629, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.491, to: 0.629, a: 'handB', b: 'gripB', tol: 1.5},
    // the highlighter rides the hand from its rest, through the sweep, back to its rest
    {from: 0.291, to: 0.449, a: "handA", b: "penA", tol: 1.5},
    {from: 0.291, to: 0.449, a: "handB", b: "penB", tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.tint === 0 && s.lookA.band === 0', label: 'base: the two desks are identical and neutral'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.band === 0 && s.b.band === 0', label: 'no difference is shown before the change beat'},
    {at: 0.3, fn: 'JSON.stringify(s.lookA.film) === JSON.stringify(s.lookB.film) && s.a.band === 0 && s.lookA.trace === 1', label: 'both overlays are laid on the same passage and traced before anything is highlighted'},
    {at: 0.35, fn: 's.a.band > 0 && s.b.band > 0 && JSON.stringify(s.tipA) !== JSON.stringify(s.tipB)', label: 'change: each highlighter follows a different path (the changed fact alters the gesture)'},
    {at: 0.4, fn: 's.a.band === 1 && s.b.band === 1 && s.spansDiffer && JSON.stringify(s.a.bandShape) !== JSON.stringify(s.b.bandShape) && s.focusFound[0] && s.focusFound[1]', label: 'the two readings highlight different spans of the same passage'},
    {at: 0.66, fn: "s.a.holder === 'tray' && s.b.holder === 'tray' && s.a.band === 1 && s.b.band === 1", label: 'parallel: both overlays slid into their trays, patterns kept'},
    {at: 1, fn: "s.guideShown && s.noteShown && s.keyShown && s.cardsEqual && s.sameGeometry && s.changedFact === 'focus' && s.allReached", label: 'guide: rings and guide on the one changed fact, neutral note, equal cards, identical desks'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.band === 1 && s.b.band === 1 && s.spansDiffer && s.guideShown', label: 'the contrast plays identically with labels hidden'},
    {at: 1, params: {interpretations: [{label: 'Interpretation A', source: 1, text: 'Same focus, reading A', focus: 'the minutes'}, {label: 'Interpretation B', source: 2, text: 'Same focus, reading B', focus: 'the minutes'}]}, fn: '!s.spansDiffer && JSON.stringify(s.a.bandShape) === JSON.stringify(s.b.bandShape)', label: 'geometry follows the SUPPLIED focus only: equal focus gives equal strokes'},
    {at: 1, fn: 's.laneBadges.a !== s.laneBadges.alarm && s.laneBadges.b !== s.laneBadges.alarm && s.laneBadges.a !== s.laneBadges.b', label: 'A/B badges in lane colours, not the alarm accent'},
  ],
});

ratioChecks('LAW-0155', 'layout fits, footer clear, desks large', [
  {at: [0, 0.5, 1], fn: 's.fits && s.footerClear', label: 'every block inside the desk, footer notes clear of the desks and strip'},
  {at: [1], fn: '!s.row || s.laneFrac >= 0.4', label: 'side by side, each desk takes >= 40 % of the width'},
  // review fix: the acting objects (light pad + slip, tray + overlay) fill the desks from the start;
  // the reading card is laid on the pad, so no empty card slot waits until u 0.64
  {at: [0, 0.3, 0.6, 1], fn: 's.deskFill >= 0.55 && s.cardOnPad', label: 'the pad and the tray fill >= 55 % of each desk below its header; the card lands on the pad'},
  // review fix: the highlighted words are printed as real text on each desk's overlay from the change beat on
  {at: [0.32, 0.4, 0.6, 1], tv: ['all'], fn: 's.focusPrinted && s.focusPx >= 16', label: 'the focus words are printed on both overlays at >= 16 px (1080p)'},
  // round 2 (1): the traced words never sit on a placeholder bar at the same place (no struck-through look)
  {at: [0.255, 0.27, 0.28, 0.3, 0.32, 0.35, 0.38, 0.4, 0.45], dom: `[0, 1].every(k => svg.querySelector('[data-node="slipfocus' + k + '"]').getAttribute('opacity') === '0')`, label: 'rendered: while the overlay lies on the slip, the slip bars under the highlighted words are gone'},
  {at: [0, 0.1, 0.17, 0.2], dom: `[0, 1].every(k => ['slipfocus', 'sliprest'].every(n => ['1', null].includes(svg.querySelector('[data-node="' + n + k + '"]').getAttribute('opacity'))))`, label: 'rendered: before the overlay lands the slip is complete (identical desks)'},
  // round 3: generic — sampled densely over the whole clip, no visible text (line by line) lands on a
  // visible placeholder bar (effective opacity >= 0.3) unless an opaque body lies between them
  {at: [...Array.from({length: 51}, (_, i) => i / 50), ...Array.from({length: 18}, (_, i) => 0.555 + i * 0.01)], dom: `(() => {
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const cut = (a, b) => ({left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom)});
    const some = b => b.right - b.left > 0.5 && b.bottom - b.top > 0.5;
    // the part of an element's box that its ancestors' clip paths let through (screen px)
    const clipOf = el => {
      let box = null;
      for (let e = el.parentElement; e && e.tagName !== 'svg'; e = e.parentElement) {
        const m = /url\\(#(.+)\\)/.exec(e.getAttribute('clip-path') || '');
        const c = m && svg.querySelector('#' + CSS.escape(m[1]));
        if (!c) continue;
        const ctm = e.getScreenCTM();
        const parts = [...c.children].map(ch => {
          const bb = ch.getBBox();
          const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(ctm));
          return {left: Math.min(...pts.map(q => q.x)), right: Math.max(...pts.map(q => q.x)), top: Math.min(...pts.map(q => q.y)), bottom: Math.max(...pts.map(q => q.y))};
        });
        const u = parts.length ? parts.reduce((a, b) => ({left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom)})) : {left: 0, right: 0, top: 0, bottom: 0};
        box = box ? cut(box, u) : u;
      }
      return box;
    };
    const R = e => { const b = e.getBoundingClientRect(); const c = clipOf(e); return c ? cut(b, c) : b; };
    const bars = [...svg.querySelectorAll('[data-bar]')].filter(b => eff(b) >= 0.3).map(b => ({b, r: R(b)})).filter(q => some(q.r));
    if (!bars.length) return true;
    const lines = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05).flatMap(t => {
      const ts = [...t.querySelectorAll('tspan')];
      return (ts.length ? ts : [t]).filter(q => q.textContent.replace(/\u200B/g, '').trim().length).map(q => ({t: q, r: R(q)}));
    }).filter(q => some(q.r));
    let shapes = null;
    const opaqueBetween = (bar, txt, box) => {
      shapes = shapes || [...svg.querySelectorAll('path, rect, circle')].filter(sh => !sh.hasAttribute('data-bar') && !sh.closest('clipPath, defs')
        && sh.getAttribute('fill') && sh.getAttribute('fill') !== 'none' && parseFloat(sh.getAttribute('fill-opacity') ?? '1') >= 0.99 && eff(sh) >= 0.99).map(sh => ({sh, r: sh.getBoundingClientRect()}));
      return shapes.some(({sh, r}) => (bar.compareDocumentPosition(sh) & Node.DOCUMENT_POSITION_FOLLOWING) && (sh.compareDocumentPosition(txt) & Node.DOCUMENT_POSITION_FOLLOWING)
        && r.left <= box.left && r.right >= box.right && r.top <= box.top && r.bottom >= box.bottom);
    };
    return lines.every(L => bars.every(B => {
      const box = cut(L.r, B.r);
      if (!some(box)) return true;
      return opaqueBetween(B.b, L.t, box);
    }));
  })()`, label: 'rendered, dense u 0..1: no visible text line lands on a visible placeholder bar unless an opaque body covers the bar'},
  // round 2 (2): equal A/B treatment of the cards — same header line counts, same card height
  {at: [1], tv: ['all'], dom: `(() => {
    const cards = [0, 1].map(k => svg.querySelector('[data-node="card' + k + '"]'));
    const sig = c => [...c.querySelectorAll('text')].slice(0, 3).map(t => [t.querySelectorAll('tspan').length || 1, t.getAttribute('font-size')].join('@')).join('|');
    const hh = c => c.getBBox().height;
    return sig(cards[0]) === sig(cards[1]) && Math.abs(hh(cards[0]) - hh(cards[1])) < 0.5;
  })()`, label: 'rendered: both cards have the same header line counts and sizes and the same height'},
  // round 2 (3): at the hold no text box crosses an outline, a lettered disc, a Δ marker or an overlay tab
  {at: [1], dom: `(() => {
    const R = e => e.getBoundingClientRect();
    const inter = (a, b, p = 0) => a.left < b.right + p && a.right > b.left - p && a.top < b.bottom + p && a.bottom > b.top - p;
    const within = (a, b) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
    const own = (t, sel) => Boolean(t.closest(sel));
    const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && t.textContent.replace(/\u200B/g, '').trim().length);
    return [0, 1].every(k => {
      const ringEl = svg.querySelector('[data-node="ring' + k + '-path"]');
      const ring = R(ringEl);
      // the outline's stroke band, in screen px (the slot may be scaled)
      const sw = parseFloat(ringEl.getAttribute('stroke-width')) * ringEl.getScreenCTM().a + 1;
      const inner = {left: ring.left + sw, right: ring.right - sw, top: ring.top + sw, bottom: ring.bottom - sw};
      const disc = svg.querySelector('[data-node="ringdisc' + k + '"]'), mark = svg.querySelector('[data-node="ringmark' + k + '"]');
      const tabs = [0, 1].map(j => svg.querySelector('[data-node="ov' + j + '-tab"]'));
      return texts.every(t => {
        const b = R(t);
        // (the lettered disc sits on the outline's corner by design: its own letter is exempt)
        if (!own(t, '[data-node^="ringdisc"]') && inter(b, ring) && !within(b, inner) && !within(ring, b)) return false;
        if (!own(t, '[data-node="ringdisc' + k + '"]') && inter(b, R(disc))) return false;
        if (inter(b, R(mark))) return false;
        return tabs.every(tb => own(t, '[data-node="' + tb.getAttribute('data-node') + '"]') || !inter(b, R(tb)));
      });
    });
  })()`, label: 'rendered: no text crosses the outlines or touches the discs, the Δ markers or the tabs'},
  {at: [0.32, 0.5, 0.7, 1], tv: ['all'], dom: `[0, 1].every(k => {
    const txt = [...svg.querySelectorAll('[data-node="film' + k + '"] text')].filter(t => t.textContent.replace(/\u200B/g, '').trim().length > 1);
    if (!txt.length) return false;
    const vb = svg.viewBox.baseVal, root = svg.getScreenCTM().a;
    return txt.every(t => visible(t) && parseFloat(t.getAttribute('font-size')) * (t.getScreenCTM().a / root) * 1080 / Math.min(vb.width, vb.height) >= 16);
  })`, label: 'rendered: each overlay carries its highlighted words as visible text >= 16 px at 1080p'},
]);

identicalBeforeChange('LAW-0155', CHANGE);

suppliedTextSuite('LAW-0155', {
  fields: `const src = i => p.sources[Math.min(p.sources.length - 1, p.interpretations[i].source)].title;
    return [p.passages.ref, p.passages.text, ...p.interpretations.flatMap(x => [x.label, x.text, x.focus]), src(0), src(1),
      p.sources[0].title, ...p.sources.map(s => s.id), ...p.hierarchy.levels, p.hierarchy.caption,
      p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.neutral]`,
  captions: `return p.locale === 'es' ? ['Propuesta (según lo aportado)', 'Jerarquía editable'] : ['Proposed (as supplied)', 'Editable hierarchy']`,
});
