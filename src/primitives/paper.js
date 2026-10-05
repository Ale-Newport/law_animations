/**
 * Paper-family vector props: document sheet, handwritten signature stroke,
 * pen, folder, rubber stamp + impression, envelope. All original geometry.
 * Coordinates are in design units; each prop documents its local origin.
 * @module primitives/paper
 */
import {h, g} from '../core/svg.js';
import {catmullRom, polyline, roundRectPath} from '../core/geometry.js';
import {textBlock} from './annotate.js';
import {r} from '../core/time.js';
import {T} from '../core/transform.js';

/**
 * Deterministic cursive-like signature polyline inside a box.
 * @param {string} name signer name (drives rhythm, not text rendering)
 * @param {(key:string, i?:number)=>number} rng seeded rng
 * @param {{x:number,y:number,w:number,h:number}} box baseline at y+h*0.72
 */
export function signatureStroke(name, rng, box) {
  const clean = String(name || 'A').replace(/\s+/g, '');
  const n = Math.min(7, Math.max(3, Math.round(clean.length * 0.6)));
  const hgt = box.h;
  const base = box.y + hgt * 0.68;
  const top = box.y + hgt * 0.02;
  const x0 = box.x;
  const capW = box.w * 0.2;
  const key = clean.slice(0, 12);
  const R = (k, i) => rng(`sig-${k}-${key}`, i);
  // Capital initial: tall entry stroke with an open loop.
  const pts = [
    {x: x0 + capW * 0.05, y: base + hgt * 0.02},
    {x: x0 + capW * 0.35, y: top + hgt * 0.05},
    {x: x0 + capW * 0.62, y: top + hgt * 0.02},
    {x: x0 + capW * 0.7, y: top + hgt * 0.22},
    {x: x0 + capW * 0.3, y: base - hgt * 0.32},
    {x: x0 + capW * 0.12, y: base - hgt * 0.22},
    {x: x0 + capW * 0.55, y: base - hgt * 0.34},
    {x: x0 + capW * 0.95, y: base - hgt * 0.02},
  ];
  // Lower-case run: humps, loops, an ascender and a descender chosen per name.
  const span = box.w * 0.62;
  const step = span / n;
  const kinds = ['hump', 'loop', 'hump', 'ascender', 'dip', 'hump', 'loop'];
  for (let i = 0; i < n; i++) {
    const sx = x0 + capW + i * step;
    const kind = i === 0 ? 'hump' : kinds[(i + Math.floor(R('k', i) * 7)) % kinds.length];
    const amp = 0.8 + R('a', i) * 0.4;
    if (kind === 'hump') {
      pts.push({x: sx + step * 0.3, y: base - hgt * 0.3 * amp});
      pts.push({x: sx + step * 0.62, y: base - hgt * 0.02});
    } else if (kind === 'loop') {
      pts.push({x: sx + step * 0.45, y: base - hgt * 0.42 * amp});
      pts.push({x: sx + step * 0.2, y: base - hgt * 0.3 * amp});
      pts.push({x: sx + step * 0.7, y: base - hgt * 0.01});
    } else if (kind === 'ascender') {
      pts.push({x: sx + step * 0.4, y: top + hgt * 0.12});
      pts.push({x: sx + step * 0.18, y: base - hgt * 0.45});
      pts.push({x: sx + step * 0.66, y: base});
    } else {
      pts.push({x: sx + step * 0.35, y: base - hgt * 0.24 * amp});
      pts.push({x: sx + step * 0.5, y: base + hgt * 0.26});
      pts.push({x: sx + step * 0.26, y: base + hgt * 0.2});
      pts.push({x: sx + step * 0.72, y: base - hgt * 0.06});
    }
  }
  // Closing flourish that returns underneath the mark.
  const endX = x0 + capW + span;
  pts.push({x: endX + box.w * 0.08, y: base - hgt * 0.2});
  pts.push({x: endX + box.w * 0.14, y: base - hgt * 0.08});
  pts.push({x: x0 + box.w * 0.62, y: base + hgt * 0.2});
  pts.push({x: x0 + box.w * 0.18, y: base + hgt * 0.17});
  return polyline(catmullRom(pts, 9));
}

/**
 * Paper document. Local origin = top-left of the sheet.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, docId?:string, title?:string, clauses?:string[], signerLabel?:string, signerName?:string, signatureName?:boolean, dogEar?:boolean, showText?:boolean, lineSeed?:string, accent?:string}} o
 */
export function paperDocument(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix} = o;
  const pad = w * 0.09;
  const fold = o.dogEar === false ? 0 : w * 0.11;
  const idSize = Math.max(14, w * 0.043);
  const titleSize = Math.max(18, w * 0.068);
  const showText = o.showText !== false;
  const inner = w - pad * 2;
  const parts = [];

  // shadow + sheet + fold
  parts.push(h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - fold)}L${w} ${r(fold)}V${hh - 4}Q${w} ${hh} ${w - 4} ${hh}H4Q0 ${hh} 0 ${hh - 4}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  if (fold) parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));

  let y = pad * 0.9;
  // document id row
  const idText = o.docId || '';
  let idFit = null;
  if (idText && showText) {
    idFit = ctx.fit(idText, {maxWidth: inner - fold * 0.6, size: idSize, minSize: 12, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(idFit, {x: pad, y, fill: th.inkSoft, name: `${prefix}-id`}));
  } else {
    parts.push(h('rect', {x: pad, y: y + 2, width: inner * 0.3, height: idSize * 0.55, rx: 3, fill: th.paperLine}));
  }
  y += idSize * 1.55;
  // title
  let titleFit = null;
  if (o.title && showText) {
    titleFit = ctx.fit(o.title, {maxWidth: inner, size: titleSize, minSize: Math.max(14, titleSize * 0.7), maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(titleFit, {x: pad, y, fill: th.ink, name: `${prefix}-title`}));
    y += titleFit.height + titleSize * 0.55;
  } else {
    parts.push(h('rect', {x: pad, y, width: inner * 0.7, height: titleSize * 0.7, rx: 4, fill: th.ink, opacity: 0.8}));
    y += titleSize * 1.3;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += titleSize * 0.5;

  // clauses: heading text + text bars
  const sigZone = hh * 0.25;
  const clauseArea = hh - sigZone - y - pad * 0.3;
  const clauses = (o.clauses && o.clauses.length ? o.clauses : ['', '', '']).slice(0, 5);
  const each = clauseArea / clauses.length;
  const barH = Math.max(5, w * 0.018);
  const clauseBoxes = [];
  clauses.forEach((text, i) => {
    const cy = y + i * each;
    const headSize = Math.max(13, w * 0.04);
    let used = 0;
    if (text && showText) {
      const f = ctx.fit(`${i + 1}. ${text}`, {maxWidth: inner, size: headSize, minSize: 11, maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: pad, y: cy, fill: th.ink, name: `${prefix}-clause-${i}`}));
      used = headSize * 1.45;
    }
    const bars = Math.max(1, Math.floor((each - used - barH) / (barH * 2.3)));
    for (let b = 0; b < Math.min(bars, 3); b++) {
      const lw = inner * (b === Math.min(bars, 3) - 1 ? 0.45 + ctx.rng(`${o.lineSeed || prefix}-l`, i * 7 + b) * 0.3 : 0.82 + ctx.rng(`${o.lineSeed || prefix}-l`, i * 7 + b) * 0.18);
      parts.push(h('rect', {x: pad, y: cy + used + b * barH * 2.3, width: r(lw), height: barH, rx: barH / 2, fill: th.paperLine}));
    }
    clauseBoxes.push({x: pad, y: cy, w: inner, h: each});
  });

  // signature block
  const sigY = hh - pad * 1.25;
  const sigX1 = pad;
  const sigX2 = pad + inner * 0.62;
  parts.push(h('line', {x1: sigX1, x2: sigX2, y1: sigY, y2: sigY, stroke: th.ink, 'stroke-width': 2.2}));
  parts.push(h('path', {d: `M${sigX1} ${sigY - 26}l10 10m0 -10l-10 10`, stroke: th.inkSoft, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round'}));
  let signerFit = null;
  if (o.signerLabel && showText) {
    signerFit = ctx.fit(o.signerLabel, {maxWidth: inner * 0.62, size: Math.max(12, w * 0.036), minSize: 10, maxLines: 1, weight: 500});
    parts.push(textBlock(signerFit, {x: sigX1, y: sigY + 8, fill: th.inkSoft, name: `${prefix}-signer`}));
  }
  const sigBox = {x: sigX1 + 20, y: sigY - hh * 0.14, w: sigX2 - sigX1 - 4, h: hh * 0.16};
  const stampSpot = {x: pad + inner * 0.82, y: sigY - hh * 0.06};

  const node = g({name: prefix}, ...parts);
  return {
    node,
    w, h: hh,
    sigLine: {x1: sigX1, x2: sigX2, y: sigY},
    sigBox,
    stampSpot,
    clauseBoxes,
    titleFit,
    grip: {left: {x: 0, y: hh * 0.55}, right: {x: w, y: hh * 0.55}, top: {x: w * 0.5, y: 0}, bottom: {x: w * 0.5, y: hh}},
  };
}

/**
 * Signature mark as an animatable stroke inside a document's local coords.
 * @returns {{node:any, poly:any, frame:(p:number)=>Record<string,any>, tipAt:(p:number)=>{x:number,y:number}}}
 */
export function signatureMark(ctx, {name, signer, box, color, width = 3.2}) {
  const poly = signatureStroke(signer, ctx.rng, box);
  const total = poly.total;
  const node = h('path', {name, d: poly.d(1), fill: 'none', stroke: color || '#1c3f8c', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)});
  return {
    node,
    poly,
    frame: p => ({[name]: {'stroke-dashoffset': r(total * (1 - p)), opacity: p > 0 ? 1 : 0}}),
    tipAt: p => poly.at(p),
  };
}

/**
 * Pen. Local origin = nib tip; body extends along +x. Rotate the group to
 * set the writing angle. Grip point is at `grip` along +x.
 */
export function pen(ctx, {name, length = 170, body, cap}) {
  const th = ctx.theme;
  const L = length;
  const bw = L * 0.085;
  const bodyC = body || th.accent2;
  const capC = cap || th.ink;
  return {
    grip: L * 0.36,
    node: g({name},
      h('path', {d: `M${r(L * 0.2)} ${r(-bw / 2 + 6)}L${r(L)} ${r(-bw / 2 + 6)}`, stroke: th.shadow, 'stroke-width': bw, 'stroke-linecap': 'round', opacity: 0.8}),
      // nib
      h('path', {d: `M0 0L${r(L * 0.13)} ${r(-bw * 0.42)}L${r(L * 0.16)} ${r(-bw * 0.42)}L${r(L * 0.16)} ${r(bw * 0.42)}L${r(L * 0.13)} ${r(bw * 0.42)}Z`, fill: '#c9ced4', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('line', {x1: 2, y1: 0, x2: L * 0.1, y2: 0, stroke: th.ink, 'stroke-width': 1.4}),
      // grip section
      h('rect', {x: L * 0.15, y: -bw / 2, width: L * 0.22, height: bw, rx: bw * 0.3, fill: capC, stroke: th.ink, 'stroke-width': 2}),
      // barrel
      h('rect', {x: L * 0.35, y: -bw / 2, width: L * 0.6, height: bw, rx: bw / 2, fill: bodyC, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: L * 0.4, y: -bw / 2 + 3, width: L * 0.5, height: bw * 0.22, rx: 2, fill: '#ffffff', opacity: 0.35}),
      // band and clip
      h('rect', {x: L * 0.62, y: -bw / 2, width: L * 0.05, height: bw, fill: th.accent3, stroke: th.ink, 'stroke-width': 1.6}),
      h('path', {d: `M${r(L * 0.64)} ${r(-bw / 2)}H${r(L * 0.93)}Q${r(L * 0.96)} ${r(-bw / 2)} ${r(L * 0.96)} ${r(-bw / 2 + 4)}`, fill: 'none', stroke: '#c9ced4', 'stroke-width': 4, 'stroke-linecap': 'round'}),
    ),
  };
}

/**
 * Top-down folder. Local origin = top-left of the back cover.
 * The front flap is a separate named node hinged on the left spine so the
 * scene can open/close it with scaleX (1 = closed over contents).
 */
export function folder(ctx, {prefix, w, h: hh, color, label}) {
  const th = ctx.theme;
  const c = color || '#d9b877';
  const tabW = w * 0.34;
  const back = g({name: `${prefix}-back`},
    h('path', {d: roundRectPath(8, 12, w, hh, 10), fill: th.shadow}),
    h('path', {d: `M0 ${hh * 0.06}Q0 0 10 0H${r(tabW)}L${r(tabW + 22)} 22H${w - 10}Q${w} 22 ${w} 32V${hh - 10}Q${w} ${hh} ${w - 10} ${hh}H10Q0 ${hh} 0 ${hh - 10}Z`, fill: c, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: 14, y: 36, width: w - 28, height: hh - 50, rx: 8, fill: '#000', opacity: 0.06}),
  );
  let labelNode = null;
  if (label) {
    const f = ctx.fit(label, {maxWidth: w * 0.6, size: Math.max(14, w * 0.055), minSize: 11, maxLines: 1, weight: 700});
    labelNode = textBlock(f, {x: w * 0.5, y: hh * 0.45, anchor: 'middle', fill: th.ink});
  }
  const front = g({name: `${prefix}-front`},
    h('path', {d: roundRectPath(0, 22, w, hh - 22, 10), fill: shade(c, -0.06), stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: w * 0.3, y: hh * 0.38, width: w * 0.4, height: hh * 0.2, rx: 6, fill: '#fff', opacity: 0.85, stroke: th.ink, 'stroke-width': 1.5}),
    labelNode,
  );
  return {back, front, w, h: hh};
}

/**
 * Rubber stamp seen from above (knob + base). Local origin = centre of base.
 */
export function stampTool(ctx, {name, size = 90, color}) {
  const th = ctx.theme;
  const s = size;
  return g({name},
    h('ellipse', {name: `${name}-shadow`, cx: 8, cy: 12, rx: s * 0.62, ry: s * 0.5, fill: th.shadow}),
    h('rect', {x: -s * 0.55, y: -s * 0.42, width: s * 1.1, height: s * 0.84, rx: 10, fill: color || th.accent, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: -s * 0.55, y: s * 0.24, width: s * 1.1, height: s * 0.18, rx: 6, fill: '#000', opacity: 0.15}),
    h('circle', {cx: 0, cy: -s * 0.06, r: s * 0.3, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('circle', {cx: -s * 0.08, cy: -s * 0.14, r: s * 0.1, fill: '#fff', opacity: 0.35}),
  );
}

/**
 * Stamp impression (ink mark). Local origin = centre.
 */
export function stampImpression(ctx, {name, text, w = 190, color, rotate = -8, showText = true}) {
  const c = color || ctx.theme.accent;
  const hh = w * 0.36;
  const f = ctx.fit(text, {maxWidth: w * 0.84, size: w * 0.15, minSize: 10, maxLines: 1, weight: 800});
  return g({name, opacity: 0, transform: T(0, 0, rotate)},
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 8, fill: 'none', stroke: c, 'stroke-width': 4}),
    h('rect', {x: -w / 2 + 7, y: -hh / 2 + 7, width: w - 14, height: hh - 14, rx: 5, fill: 'none', stroke: c, 'stroke-width': 1.8}),
    showText
      ? textBlock(f, {x: 0, y: -f.size / 2, anchor: 'middle', fill: c, letterSpacing: 2})
      : h('path', {d: `M${r(-w * 0.3)} 0H${r(w * 0.3)}M${r(-w * 0.2)} ${r(hh * 0.18)}H${r(w * 0.2)}`, stroke: c, 'stroke-width': hh * 0.12, 'stroke-linecap': 'round'}),
  );
}

/**
 * Envelope. Local origin = centre. `flap` node rotates open (scaleY).
 */
export function envelope(ctx, {prefix, w = 150, color}) {
  const th = ctx.theme;
  const hh = w * 0.64;
  const c = color || '#f4ead6';
  return {
    w, h: hh,
    node: g({name: prefix},
      h('rect', {x: -w / 2 + 6, y: -hh / 2 + 9, width: w, height: hh, rx: 8, fill: th.shadow}),
      h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 8, fill: c, stroke: th.ink, 'stroke-width': th.stroke}),
      h('path', {d: `M${-w / 2 + 4} ${hh / 2 - 4}L0 ${hh * 0.05}L${w / 2 - 4} ${hh / 2 - 4}`, fill: 'none', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      g({name: `${prefix}-flap`},
        h('path', {d: `M${-w / 2} ${-hh / 2 + 4}L0 ${hh * 0.12}L${w / 2} ${-hh / 2 + 4}Z`, fill: shade(c, -0.07), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      ),
      h('circle', {cx: 0, cy: hh * 0.08, r: w * 0.07, fill: th.accent, stroke: th.ink, 'stroke-width': 1.6}),
    ),
  };
}

/** Lighten (+) or darken (−) a #rrggbb colour. */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const rr = f((n >> 16) & 255), gg = f((n >> 8) & 255), bb = f(n & 255);
  return `#${((1 << 24) | (rr << 16) | (gg << 8) | bb).toString(16).slice(1)}`;
}
