// Rendered (DOM) checks shared by the four "Atención en registro" tests (LAW-0189..0192).
// Each export is the source of an expression for ratioChecks({dom}) — evaluated in the page with
// `svg` (the rendered root), `visible(el)` and `u`. Screen boxes come from getBoundingClientRect and
// are converted to 1080p px with the root's screen scale where a length limit applies.

/** Effective opacity (product up the tree) and small box helpers, inlined into every check. */
const HELPERS = `
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const R = e => e.getBoundingClientRect();
  const inter = (a, b, p = 0) => a.left < b.right + p && a.right > b.left - p && a.top < b.bottom + p && a.bottom > b.top - p;
  const vb = svg.viewBox.baseVal;
  const px = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
`;

/**
 * No card, chip, bubble or held prop covers a face: the face = the head group's box shrunk by 18 %
 * (hair and ears excluded); cards = every visible element matching `sel`.
 * @param {string[]} faces head node names
 * @param {string} sel CSS selector of the card-like elements
 */
export const facesClear = (faces, sel) => `(() => {${HELPERS}
  const shrink = (b, f) => ({left: b.left + b.width * f, right: b.right - b.width * f, top: b.top + b.height * f, bottom: b.bottom - b.height * f});
  const fs = ${JSON.stringify(faces)}.map(n => svg.querySelector('[data-node="' + n + '"]')).filter(e => e && eff(e) > 0.05).map(e => shrink(R(e), 0.18));
  if (!fs.length) return false;
  const cards = [...svg.querySelectorAll(${JSON.stringify(sel)})].filter(e => eff(e) > 0.05 && R(e).width > 0);
  return cards.every(c => fs.every(f => !inter(R(c), f)));
})()`;

/**
 * Each relation label (group `labelPrefix<i>`) is nearest to its OWN connector path
 * (`linePrefix<i>-line`): within 40 px at 1080p and at least 8 px closer than any other connector.
 */
export const labelsOwnConnectors = (labelPrefix, linePrefix) => `(() => {${HELPERS}
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="${linePrefix}"][data-node$="-line"]')) {
    const m0 = path.getAttribute('data-node').match(/^${linePrefix}(\\d+)-line$/);
    if (!m0) continue;
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[+m0[1]] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node^="${labelPrefix}"]')].filter(e => new RegExp('^${labelPrefix}\\\\d+$').test(e.getAttribute('data-node')) && eff(e) > 0.05);
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').slice(${labelPrefix.length});
    const rs = [...lab.querySelectorAll('path,rect,text')].map(e => R(e)).filter(r => r.width > 0);
    if (!rs.length || !conns[i]) return false;
    const b = {l: Math.min(...rs.map(r => r.left)), t: Math.min(...rs.map(r => r.top)), r: Math.max(...rs.map(r => r.right)), b: Math.max(...rs.map(r => r.bottom))};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / px;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
  }
  return true;
})()`;

/**
 * Every visible callout leader (`<prefix><i>-lead`) is short (≤ maxPx at 1080p) and passes through no
 * text other than its own chip's and through none of the listed obstacle nodes (faces, chips, cards).
 */
export const leadersClear = (prefix, obstacleSel, maxPx = 170) => `(() => {${HELPERS}
  const leads = [...svg.querySelectorAll('[data-node^="${prefix}"][data-node$="-lead"]')].filter(e => eff(e.parentElement) > 0.05);
  for (const lead of leads) {
    const own = lead.parentElement;
    const m = lead.getScreenCTM();
    const A = new DOMPoint(+lead.getAttribute('x1'), +lead.getAttribute('y1')).matrixTransform(m);
    const B = new DOMPoint(+lead.getAttribute('x2'), +lead.getAttribute('y2')).matrixTransform(m);
    const len = Math.hypot(B.x - A.x, B.y - A.y) / px;
    if (len > ${maxPx}) return false;
    // the last 14 px end on the target (the dot sits on the object's edge)
    const n = 40, stop = Math.max(0, 1 - (14 * px) / Math.max(1, len * px));
    const pts = Array.from({length: n}, (_, i) => ({x: A.x + (B.x - A.x) * stop * (i + 0.5) / n, y: A.y + (B.y - A.y) * stop * (i + 0.5) / n}));
    const obst = [...svg.querySelectorAll('text'), ...svg.querySelectorAll(${JSON.stringify(obstacleSel)})]
      .filter(e => !own.contains(e) && !e.closest('[data-layer="content-notice"]') && eff(e) > 0.05);
    for (const e of obst) {
      const b = R(e);
      if (b.width < 1 || b.height < 1) continue;
      if (pts.some(q => q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1)) return false;
    }
  }
  return true;
})()`;

/**
 * No visible text line lands on a visible placeholder bar ([data-bar], effective opacity ≥ 0.3)
 * unless an opaque body drawn between them covers the bar (the LAW-0155 pattern).
 */
export const NO_TEXT_ON_BARS = `(() => {${HELPERS}
  const cut = (a, b) => ({left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom)});
  const some = b => b.right - b.left > 0.5 && b.bottom - b.top > 0.5;
  const clipOf = el => {
    let box = null;
    for (let e = el.parentElement; e && e.tagName !== 'svg'; e = e.parentElement) {
      const mm = /url\\(#(.+)\\)/.exec(e.getAttribute('clip-path') || '');
      const c = mm && svg.querySelector('#' + CSS.escape(mm[1]));
      if (!c) continue;
      const ctm = e.getScreenCTM();
      const parts = [...c.children].map(ch => { const bb = ch.getBBox(); const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(ctm)); return {left: Math.min(...pts.map(q => q.x)), right: Math.max(...pts.map(q => q.x)), top: Math.min(...pts.map(q => q.y)), bottom: Math.max(...pts.map(q => q.y))}; });
      const un = parts.length ? parts.reduce((a, b) => ({left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom)})) : {left: 0, right: 0, top: 0, bottom: 0};
      box = box ? cut(box, un) : un;
    }
    return box;
  };
  const RC = e => { const b = R(e); const c = clipOf(e); return c ? cut(b, c) : b; };
  const bars = [...svg.querySelectorAll('[data-bar]')].filter(b => eff(b) >= 0.3).map(b => ({b, r: RC(b)})).filter(q => some(q.r));
  if (!bars.length) return true;
  const lines = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05).flatMap(t => {
    const ts = [...t.querySelectorAll('tspan')];
    return (ts.length ? ts : [t]).filter(q => q.textContent.replace(/\\u200B/g, '').trim().length).map(q => ({t: q, r: RC(q)}));
  }).filter(q => some(q.r));
  let shapes = null;
  const opaqueBetween = (bar, txt, box) => {
    shapes = shapes || [...svg.querySelectorAll('path, rect, circle')].filter(sh => !sh.hasAttribute('data-bar') && !sh.closest('clipPath, defs')
      && sh.getAttribute('fill') && sh.getAttribute('fill') !== 'none' && parseFloat(sh.getAttribute('fill-opacity') ?? '1') >= 0.99 && eff(sh) >= 0.99).map(sh => ({sh, r: sh.getBoundingClientRect()}));
    return shapes.some(({sh, r}) => (bar.compareDocumentPosition(sh) & Node.DOCUMENT_POSITION_FOLLOWING) && (sh.compareDocumentPosition(txt) & Node.DOCUMENT_POSITION_FOLLOWING)
      && r.left <= box.left && r.right >= box.right && r.top <= box.top && r.bottom >= box.bottom);
  };
  return lines.every(L => bars.every(B => { const box = cut(L.r, B.r); return !some(box) || opaqueBetween(B.b, L.t, box); }));
})()`;

/**
 * No two VISIBLE copies of the same text overlap (the LAW-0164 pattern): text under the opaque lens
 * card (`bgNode`, effective opacity ≥ 0.99) is hidden; boxes are cut to clip-path rects; the lens copy's
 * zero-width marks are ignored so copy and source compare equal.
 */
export const noDoubleImage = (bgNode, winNode) => `(() => {${HELPERS}
  const effC = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\u200B/g, '').replace(/\\s+/g, ' ').trim();
    if (!txt || effC(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  const bg = svg.querySelector('[data-node="${bgNode}"]');
  const occ = bg && effC(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="${winNode}"]'));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.txt !== b.txt) continue;
    const x = cut(a.r, b.r);
    if (!(x.right - x.left > 2 && x.bottom - x.top > 2)) continue;
    const hidden = occ && inWin(a.el) !== inWin(b.el) && x.left >= occ.left && x.right <= occ.right && x.top >= occ.top && x.bottom <= occ.bottom;
    if (!hidden) return false;
  }
  return true;
})()`;

/** Evenly spaced times from a to b (inclusive), rounded. */
export const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);
