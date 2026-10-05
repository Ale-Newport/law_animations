// Rendered-DOM checks shared by the four "Interpretación lingüística" tests (LAW-0181..0184).
// Each export is the SOURCE of a DOM expression for ratioChecks({dom}) (evaluated with `svg`).

// No bubble body, language tab or card/chip covers a head or face. Heads = the rigs' head groups
// (hair and ears included). Speech-bubble TAILS are exempt (they end beside a mouth; their clearance is
// asserted from the layout), and so are content-notice labels. Screen boxes, 1 px tolerance.
export const NO_CARD_ON_FACE = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e !== svg; e = e.parentNode) { if (e.getAttribute && e.getAttribute('display') === 'none') return 0; const a = e.getAttribute && e.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const R = e => e.getBoundingClientRect();
  const inter = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const heads = [...svg.querySelectorAll('[data-node$="-head"]')].filter(e => /-(A|B|I)-head$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(R);
  if (!heads.length) return false;
  const cards = [...svg.querySelectorAll('[data-body], [data-card], [data-node$="-tab"], [data-node^="chip-"], [data-node="link"], [data-node="key"], [data-node="state-tag"], [data-node$="-chip"], [data-node="caption"], [data-node="guide-chip"], [data-node="neutral"]')]
    .filter(e => eff(e) > 0.05 && !e.closest('[data-layer="content-notice"]') && !e.closest('[data-node="lens-win"]'));
  return cards.every(c => { const b = R(c); return b.width < 1 || heads.every(hb => !inter(b, hb)); });
})()`;

// A relation label owns its connector: for every label group [data-rel-label="<conn>"], the nearest
// connector path ([data-conn]) to the label box is the one it names, within 40 px at 1080p, and every
// other connector is at least 8 px further.
export const LABEL_OWNS_CONNECTOR = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const conns = {};
  for (const path of svg.querySelectorAll('[data-conn]')) {
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[path.getAttribute('data-conn')] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-rel-label]')];
  if (!labels.length) return false;
  for (const lab of labels) {
    const id = lab.getAttribute('data-rel-label');
    const rs = [...lab.querySelectorAll('path,rect,text')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    if (!rs.length || !conns[id]) return false;
    const b = {l: Math.min(...rs.map(r => r.left)), t: Math.min(...rs.map(r => r.top)), r: Math.max(...rs.map(r => r.right)), b: Math.max(...rs.map(r => r.bottom))};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / k;
    const own = dist(conns[id]);
    if (own > 40) return false;
    for (const [j, pts] of Object.entries(conns)) if (j !== id && dist(pts) < own + 8) return false;
  }
  return true;
})()`;

// Lens helpers (pattern of LAW-0164's rendered double-image check, written for this motif's lens):
// effective opacity up the tree, and the screen rectangle of a clip-path's <rect> in the user space of
// the element that references it.
const LENS_UTIL = `
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
`;

// No double image: no two VISIBLE copies of the same text overlap on screen, except where the opaque
// lens card (lens-bg at full opacity) hides the context copy beneath it.
export const NO_DOUBLE = `(() => {${LENS_UTIL}
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\u200B/g, '').replace(/\\s+/g, ' ').trim();
    if (!txt || eff(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  const bg = svg.querySelector('[data-node="lens-bg"]');
  const occ = bg && eff(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="lens-win"]'));
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

// No text cut by the lens rim: every visible text inside the lens copy is either wholly inside the
// window (1 px tolerance) or wholly outside it.
export const NO_RIM_CUT = `(() => {${LENS_UTIL}
  const content = svg.querySelector('[data-node="lens-content"]');
  if (!content || eff(content) <= 0.05) return true;
  for (const t of content.querySelectorAll('text')) {
    if (eff(t) <= 0.05 || !(t.textContent || '').replace(/\\u200B/g, '').trim()) continue;
    const r = t.getBoundingClientRect();
    const c = clipOf(t);
    if (!c) continue;
    const x = cut(r, c);
    const overlap = x.right - x.left > 1 && x.bottom - x.top > 1;
    const inside = r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
    if (overlap && !inside) return false;
  }
  return true;
})()`;

// Screen px at 1080p per screen px (the frame's short side is 1080 at 1080p).
// (screen CTM, not the element box: the root may be letterboxed inside its slot)
const PX = `const vb = svg.viewBox.baseVal; const ctmA = svg.getScreenCTM().a; const px = (1 / ctmA) * 1080 / Math.min(vb.width, vb.height);`;

// Smallest head height (the rigs' head groups: hair and ears included) in px at 1080p.
export const MIN_HEAD_PX = `(() => { ${PX}
  const hs = [...svg.querySelectorAll('[data-node$="-head"]')].filter(e => /-(A|B|I)-head$/.test(e.getAttribute('data-node')));
  return hs.length ? Math.min(...hs.map(e => e.getBoundingClientRect().height * px)) : 0; })()`;

// Frame shape of the rendered root: 'landscape' | 'portrait' | 'square'.
export const FRAME = `(() => { const vb = svg.viewBox.baseVal; const r = vb.width / vb.height; return r > 1.2 ? 'landscape' : r < 0.83 ? 'portrait' : 'square'; })()`;

// Each scene group ([data-node="scenea"/"sceneb"]) is at least `rowMin` of the frame width when the two
// sit side by side, and at least `colMin` when stacked (one above the other).
export const sceneShare = (rowMin, colMin) => `(() => {
  const a = svg.querySelector('[data-node="scenea"]'), b = svg.querySelector('[data-node="sceneb"]');
  if (!a || !b) return false;
  const W = svg.viewBox.baseVal.width * svg.getScreenCTM().a, ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const stacked = rb.top >= ra.top + ra.height * 0.5;
  return Math.min(ra.width, rb.width) / W >= (stacked ? ${colMin} : ${rowMin});
})()`;

// The interpreter's name chip sits right under her: its top at most `maxGap` px (1080p) below her lowest
// visible part (her arms on the table) and horizontally under her head.
export const chipNearInterpreter = maxGap => `(() => { ${PX}
  const c = svg.querySelector('[data-node="bchip-interpreter"]'), arms = svg.querySelector('[data-node="sb-I-arms"]'), head = svg.querySelector('[data-node="sb-I-head"]');
  if (!c || !arms || !head) return false;
  const rc = c.getBoundingClientRect(), ra = arms.getBoundingClientRect(), rh = head.getBoundingClientRect();
  const hx = (rh.left + rh.right) / 2;
  return (rc.top - ra.bottom) * px <= ${maxGap} && rc.top >= ra.bottom - 1 && hx > rc.left && hx < rc.right;
})()`;

// The guide line runs through free space: no point of it (away from the changed-spot outlines it starts
// on and the guide label it passes through) comes within 10 px (1080p) of a card, chip, relation label or
// strip note — so it neither crosses one nor runs along its border.
export const GUIDE_CLEAR = `(() => { ${PX}
  const g = svg.querySelector('[data-node="guide"]');
  if (!g) return false;
  const grow = (r, d) => ({l: r.left - d, t: r.top - d, r: r.right + d, b: r.bottom + d});
  const inR = (q, r) => q.x >= r.l && q.x <= r.r && q.y >= r.t && q.y <= r.b;
  const d10 = 10 / px;
  const rings = [...svg.querySelectorAll('[data-node="ringa"], [data-node="ringb"]')].map(e => grow(e.getBoundingClientRect(), 0));
  // (the guide leaves each outline from its edge: points within 12 px of an outline are its start; a chip or
  // label inside an outline is what the outline marks)
  const skip = [...rings.map(r => grow({left: r.l, top: r.t, right: r.r, bottom: r.b}, 12 / px)), ...[...svg.querySelectorAll('[data-node="guide-chip"]')].map(e => grow(e.getBoundingClientRect(), 4 / px))];
  const within = (r, o) => r.left >= o.l - 1 && r.right <= o.r + 1 && r.top >= o.t - 1 && r.bottom <= o.b + 1;
  const boxes = [...svg.querySelectorAll('[data-node]')].filter(e => /chip-|rlab\\d|^shared$|^changed$|^neutral$|^key$|^hdr[ab]$/.test(e.getAttribute('data-node')))
    .map(e => e.getBoundingClientRect()).filter(r => r.width > 1 && !rings.some(o => within(r, o))).map(r => grow(r, d10));
  const m = g.getScreenCTM(), L = g.getTotalLength();
  for (let j = 0; j <= 400; j++) {
    const q = g.getPointAtLength((L * j) / 400).matrixTransform(m);
    if (skip.some(r => inR(q, r))) continue;
    if (boxes.some(r => inR(q, r))) return false;
  }
  return true;
})()`;

// ---- LAW-0184 lens (modelled on LAW-0172's rendered lens checks) ----

// Visible heads and upper bodies (the interpreter's body only above the tabletop, where it is drawn).
const PEOPLE = `
  const R = e => e.getBoundingClientRect();
  const inter = (a, b, m = 1) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > m && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > m;
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const top = q('st-top') ? R(q('st-top')).top : Infinity;
  const people = ['st-A-head', 'st-B-head', 'st-I-head', 'st-A-upper', 'st-B-upper', 'st-I-arms'].map(q).filter(Boolean).map(R);
  const ib = q('st-I-body'); if (ib) { const r = R(ib); people.push({left: r.left, right: r.right, top: r.top, bottom: Math.min(r.bottom, top)}); }
`;

// The lens window (while visible) covers no head and no body.
export const LENS_OFF_PEOPLE = `(() => {${LENS_UTIL}${PEOPLE}
  const win = q('lens-win'), bg = q('lens-bg');
  if (!win || eff(win) <= 0.05) return true;
  const w = R(bg);
  return people.every(p => !inter(w, p));
})()`;

// The two cone lines (while shown) cross no head and no visible context text (their ends inside the
// source outline and the window excepted).
export const CONES_CLEAR = `(() => {${LENS_UTIL}${PEOPLE}
  const src = q('lens-src'), bg = q('lens-bg');
  const cones = ['lens-coneA', 'lens-coneB'].map(q).filter(c => c && eff(c) > 0.05);
  if (!cones.length) return true;
  const S = R(src), W = R(bg);
  const inR = (p, r, m = 2) => p.x >= r.left - m && p.x <= r.right + m && p.y >= r.top - m && p.y <= r.bottom + m;
  const heads = ['st-A-head', 'st-B-head', 'st-I-head'].map(q).filter(Boolean).map(R);
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(R);
  for (const c of cones) {
    const m = c.getScreenCTM();
    const a = new DOMPoint(+c.getAttribute('x1'), +c.getAttribute('y1')).matrixTransform(m), b = new DOMPoint(+c.getAttribute('x2'), +c.getAttribute('y2')).matrixTransform(m);
    for (let j = 0; j <= 60; j++) {
      const p = {x: a.x + (b.x - a.x) * j / 60, y: a.y + (b.y - a.y) * j / 60};
      if (inR(p, S) || inR(p, W)) continue;
      if (heads.some(r => inR(p, r, 0)) || texts.some(r => inR(p, r, 0))) return false;
    }
  }
  return true;
})()`;

// Nothing in the lens copy is cut by its rim: every visible text line, outline and glyph of the copy is
// wholly inside the window (1 px tolerance) — fields are wholly in, never partly.
export const COPY_WHOLE = `(() => {${LENS_UTIL}
  const content = svg.querySelector('[data-node="lens-content"]');
  if (!content || eff(content) <= 0.05) return true;
  const c = clipOf(content.querySelector('text, path') || content);
  if (!c) return true;
  const els = [...content.querySelectorAll('tspan, path, circle, rect, line, polygon')].filter(e => eff(e) > 0.05);
  for (const e of els) {
    if (e.tagName === 'tspan' && !(e.textContent || '').replace(/\\u200B/g, '').trim()) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 0.5 && r.height < 0.5) continue;
    if (!(r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1)) return false;
  }
  return true;
})()`;

// The open window never covers part of a context text: each visible context text is wholly under the
// window or wholly clear of it.
export const NO_HALF_COVER = `(() => {${LENS_UTIL}
  const win = svg.querySelector('[data-node="lens-win"]'), bg = svg.querySelector('[data-node="lens-bg"]');
  if (!win || eff(win) < 0.5) return true;
  const w = bg.getBoundingClientRect();
  // (the inspected detail itself — inside the source outline — is what the window grows out of)
  const sr = svg.querySelector('[data-node="lens-src"]').getBoundingClientRect();
  for (const t of svg.querySelectorAll('text')) {
    if (t.closest('[data-node="lens-win"]') || t.closest('[data-layer="content-notice"]') || eff(t) <= 0.3 || !(t.textContent || '').trim()) continue;
    const r = t.getBoundingClientRect();
    if (r.left >= sr.left - 2 && r.right <= sr.right + 2 && r.top >= sr.top - 2 && r.bottom <= sr.bottom + 2) continue;
    const ov = Math.min(r.right, w.right) - Math.max(r.left, w.left) > 1 && Math.min(r.bottom, w.bottom) - Math.max(r.top, w.top) > 1;
    const inside = r.left >= w.left - 1 && r.right <= w.right + 1 && r.top >= w.top - 1 && r.bottom <= w.bottom + 1;
    if (ov && !inside) return false;
  }
  return true;
})()`;

// The strike crosses EVERY line of the (wrapped) old value through that line's middle: one strike per
// line, each within the middle half of its line's height and spanning at least 90 % of its width.
export const strikeEveryLine = prefix => `(() => {
  const txt = svg.querySelector('[data-node="${prefix}-old-txt"]');
  if (!txt) return true;
  const lines = [...txt.querySelectorAll('tspan')].filter(t => (t.textContent || '').replace(/\\u200B/g, '').trim()).map(t => t.getBoundingClientRect());
  const L = lines.length ? lines : [txt.getBoundingClientRect()];
  const strikes = [...svg.querySelectorAll('[data-node^="${prefix}-strike"]')].map(s => s.getBoundingClientRect());
  if (strikes.length < L.length) return false;
  return L.every(l => strikes.some(s => { const cy = (s.top + s.bottom) / 2; return cy >= l.top + l.height * 0.25 && cy <= l.bottom - l.height * 0.25 && Math.min(s.right, l.right) - Math.max(s.left, l.left) >= l.width * 0.9; }));
})()`;
