/**
 * Checking gate for the contrast of "Comprobación de jurisdicción" (LAW-0071).
 *
 * One complete panel, front view: a library bookcase whose bottom shelf runs
 * out as a ledge to a checking gate. The gate is a lock box (showing the key
 * set by the research card, tied to it by a cord) with a hinged flap that
 * blocks the ledge. Before the gate the ledge has a trapdoor over an "≠ key"
 * bin; beyond it a landing with an "= key" pocket. The same document leaves
 * the library, receives the stamp of the jurisdiction it declares, slides to
 * the gate and presents its seal to the lock:
 *  - same as the key  → the flap swings up, the document passes to the
 *    landing and its reference is written on the card;
 *  - different        → the flap stays down, the trapdoor drops and the
 *    document slides into the bin; the card stays unchanged.
 * Everything else in the two panels is identical.
 * @module animations/research/kits/comprobacion-de-jurisdiccion-gate
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {sourceSheet, indexCard, bookcase, emblem, relGlyph, jurColor, rulePlate, plateSize} from './comprobacion-de-jurisdiccion.js';

const DEG = Math.PI / 180;

/** Rotate point p about c by deg. */
function rot(p, c, deg) {
  const a = deg * DEG;
  const dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}

/**
 * Geometry of a panel of size W×H (panel-local units). `beside`: a short, wide
 * panel whose research card hangs to the right of the lock box (above the
 * landing) instead of above it, so the panel needs less height.
 */
export function gateGeometry(W, H, o = {}) {
  const tall = W / H < 0.95;
  const beside = Boolean(o.beside) && !tall;
  const dw = clamp(Math.min(W * 0.2, H * 0.25), 100, 176);
  const dh = dw * 1.32;
  const cardTop = 16;
  const gateX = beside ? W * 0.56 : W * 0.62;
  const lockH = 58;
  let cardX, cardW, cardH, ledgeY;
  if (beside) {
    cardX = gateX + 66;
    cardW = W - 12 - cardX;
    cardH = Math.min(cardW * 0.52, H * 0.2);
    // the card only has to clear the document standing on the landing below it
    ledgeY = Math.max(cardTop + Math.max(cardH + 10, lockH + 16) + dh, H * 0.58);
  } else {
    cardW = tall ? W * 0.62 : W - gateX - 50;
    cardX = tall ? W - 12 - cardW : gateX + 36;
    cardH = Math.min(cardW * 0.52, H * (tall ? 0.26 : 0.21));
    ledgeY = Math.max(cardTop + cardH + 10 + lockH + 16 + dh, H * (tall ? 0.58 : 0.5));
  }
  const lockBottom = ledgeY - dh - 16;
  const lock = {x: gateX - 64, y: lockBottom - lockH, w: 118, h: lockH};
  const side = 14;
  const book = {x: 12, w: dw + 2 * side + 22};
  // the bookcase stands left of the card in every layout: it can rise to the top and keep a row of books
  book.y = Math.max(16, ledgeY - dh - 24 - Math.max(120, (ledgeY - dh - 24) * 0.6));
  book.h = ledgeY + 26 - book.y;
  const trap = {x0: gateX - dw - 34, x1: gateX - 6};
  const bin = {x: trap.x0 - 16, y: ledgeY + 32, w: trap.x1 - trap.x0 + 40, h: Math.min(H - 12 - ledgeY - 32, dh * (tall ? 0.95 : 0.82))};
  const landing = {x0: gateX + 30, x1: W - 12};
  return {W, H, tall, beside, dw, dh, gateX, ledgeY, lock, lockBottom, book, trap, bin, landing, card: {x: cardX, y: cardTop, w: cardW, h: cardH}};
}

/**
 * Build one panel.
 * @param {any} ctx
 * @param {{prefix:string, W:number, H:number, doc:any, declared:{key:string,name:string}, relevant:{key:string,name:string}, query:string, lineText:string}} o
 */
export function gatePanel(ctx, o) {
  const th = ctx.theme;
  const G = gateGeometry(o.W, o.H, {beside: o.beside});
  const P = o.prefix;
  const {dw, dh, gateX, ledgeY, lock, trap, bin, landing} = G;
  const same = o.declared.key === o.relevant.key;

  // --- library bookcase (its bottom shelf is the ledge)
  const crown = Math.max(18, G.book.h * 0.035), plinthH = Math.max(16, G.book.h * 0.03), plankH = Math.max(8, G.book.h * 0.014);
  const openH = ledgeY - (G.book.y + G.book.h - plinthH - 2) + (G.book.h - plinthH - 2) - (ledgeY - G.book.y) + dh + 18;
  const booksH = G.book.h - crown - plinthH - plankH - 4 - openH;
  const bc = bookcase(ctx, {prefix: `${P}-lib`, w: G.book.w, h: G.book.h, rows: booksH > 40 ? [{kind: 'books', h: booksH}, {kind: 'open', h: openH}] : [{kind: 'open', h: openH + booksH}], seedKey: 'jur-gate-lib'});
  const back = [];
  back.push(g({transform: T(G.book.x, G.book.y)}, bc.node));
  // ledge from the bookcase to the trapdoor, and the landing beyond the gate
  const plank = (x0, x1) => h('path', {d: roundRectPath(x0, ledgeY, x1 - x0, 14, 3), fill: shade(th.wood, 0.05), stroke: th.ink, 'stroke-width': 2});
  back.push(plank(G.book.x + 6, trap.x0 - 2));
  back.push(plank(landing.x0 - 22, landing.x1));
  // bracket under the ledge + bin
  // gate post (behind the documents) holding the lock box
  back.push(h('rect', {x: gateX + 16, y: lock.y + 20, width: 18, height: ledgeY - lock.y - 6, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2}));
  // bin behind part
  back.push(h('path', {d: roundRectPath(bin.x, bin.y, bin.w, bin.h, 10), fill: shade(th.wood, -0.3), stroke: th.ink, 'stroke-width': 2}));

  // --- research card (top right) with its cord to the lock box
  const lines = [o.lineText];
  // a thumbnail of the listed document is pinned to the card when its reference is written:
  // the one visible consequence that differs between the panels, readable without labels
  const thumbH = Math.min(G.card.h * 0.66, 76);
  const thumbW = thumbH * 0.76;
  const card = indexCard(ctx, {prefix: `${P}-card`, w: G.card.w, h: G.card.h, query: o.query, jur: o.relevant, lines, compact: true, reserveRight: thumbW + 12});
  const lineSlot = card.slots[0];
  const pinAt = {x: G.card.w - thumbW - G.card.w * 0.05, y: Math.max(card.headY + 5, Math.min(G.card.h - thumbH - 5, (lineSlot ? lineSlot.y + lineSlot.h / 2 : G.card.h * 0.6) - thumbH / 2))};
  const pin = g({name: `${P}-pin`, opacity: 0, transform: T(pinAt.x, pinAt.y)},
    h('path', {d: roundRectPath(3, 4, thumbW, thumbH, 3), fill: th.shadow}),
    h('path', {d: `M0 0H${r(thumbW * 0.74)}L${r(thumbW)} ${r(thumbW * 0.26)}V${r(thumbH)}H0Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    emblem(ctx, {key: o.declared.key, s: thumbW * 0.42, x: thumbW * 0.36, y: thumbH * 0.3}),
    [0.58, 0.72, 0.86].map((f, k) => h('rect', {x: thumbW * 0.14, y: thumbH * f, width: thumbW * (k === 2 ? 0.45 : 0.7), height: Math.max(3, thumbH * 0.05), rx: 1.5, fill: th.paperLine})),
    h('circle', {cx: thumbW * 0.5, cy: 1, r: Math.max(4.5, thumbW * 0.1), fill: '#c8553d', stroke: th.ink, 'stroke-width': 1.6}),
  );
  const cardNode = g({transform: T(G.card.x, G.card.y)}, card.node,
    // empty line placeholder (dashed) that the written reference covers
    lineSlot ? h('rect', {name: `${P}-slot`, x: lineSlot.x, y: lineSlot.y, width: lineSlot.w, height: lineSlot.h, rx: 3, fill: 'none', stroke: th.inkFaint, 'stroke-width': 1.5, 'stroke-dasharray': '5 4'}) : null,
    // the place the thumbnail will take (dashed, so both cards start identical)
    h('path', {d: roundRectPath(pinAt.x, pinAt.y, thumbW, thumbH, 3), fill: 'none', stroke: th.inkFaint, 'stroke-width': 1.5, 'stroke-dasharray': '5 4'}),
    pin);
  const hole = {x: G.card.x + card.hole.x, y: G.card.y + card.hole.y};
  const cordEnd = {x: lock.x + lock.w - 8, y: lock.y + 12};
  const cord = h('path', {d: `M${r(hole.x)} ${r(hole.y)}C${r(hole.x)} ${r(hole.y + 40)} ${r(cordEnd.x + 40)} ${r(cordEnd.y - 30)} ${r(cordEnd.x)} ${r(cordEnd.y)}`, fill: 'none', stroke: th.accent3, 'stroke-width': 3.5, 'stroke-linecap': 'round'});

  // --- lock box with key window and comparison window
  const keyC = {x: lock.x + 30, y: lock.y + lock.h / 2};
  const cmpC = {x: lock.x + lock.w - 34, y: lock.y + lock.h / 2};
  const lockNode = g(null,
    h('path', {d: roundRectPath(lock.x, lock.y, lock.w, lock.h, 12), fill: '#e9edf1', stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {cx: keyC.x, cy: keyC.y, r: 20, fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
    emblem(ctx, {key: o.relevant.key, s: 26, x: keyC.x, y: keyC.y, stroke: '#ffffff'}),
    h('path', {d: roundRectPath(cmpC.x - 24, cmpC.y - 17, 48, 34, 8), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
    g({name: `${P}-glyph`, opacity: 0}, relGlyph(ctx, {same, x: cmpC.x, y: cmpC.y, s: 24, color: same ? '#ffffff' : '#ffd166'})),
    h('path', {d: roundRectPath(gateX - 12, lock.y + lock.h - 6, 24, 12, 4), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
  );
  const pivot = {x: gateX, y: lock.y + lock.h};
  const flapLen = ledgeY - pivot.y - 2;
  const flap = g({name: `${P}-flap`, transform: `rotate(0 ${r(pivot.x)} ${r(pivot.y)})`},
    h('path', {d: roundRectPath(pivot.x - 7, pivot.y, 14, flapLen, 5), fill: th.accent3, stroke: th.ink, 'stroke-width': 2.2}),
    [0.25, 0.5, 0.75].map(f => h('line', {x1: pivot.x - 6, x2: pivot.x + 6, y1: pivot.y + flapLen * f - 6, y2: pivot.y + flapLen * f + 6, stroke: th.ink, 'stroke-width': 3, opacity: 0.55})),
    h('circle', {cx: pivot.x, cy: pivot.y + 4, r: 5, fill: th.metalDark}),
  );
  // reading beam from the lock box to the seal
  const seal0 = {x: gateX - 10 - dw + (dw - dw * 0.085 - dw * 0.125), y: ledgeY - dh + dw * 0.085 + dw * 0.125};
  const beam = h('path', {name: `${P}-beam`, d: `M${r(lock.x + 18)} ${r(lock.y + lock.h)}L${r(lock.x + 46)} ${r(lock.y + lock.h)}L${r(seal0.x + 24)} ${r(seal0.y + 10)}L${r(seal0.x - 24)} ${r(seal0.y + 10)}Z`, fill: '#ffe58a', opacity: 0});

  // --- trapdoor (hinged at its left end)
  const hinge = {x: trap.x0, y: ledgeY};
  const trapNode = g({name: `${P}-trap`},
    h('path', {d: roundRectPath(trap.x0, ledgeY, trap.x1 - trap.x0, 14, 3), fill: shade(th.wood, -0.05), stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: hinge.x + 5, cy: hinge.y + 7, r: 4.5, fill: th.metalDark}),
  );

  // --- bin front and landing pocket (text-free plates)
  const ps = plateSize(36);
  const binFront = g(null,
    h('path', {d: `M${r(bin.x - 6)} ${r(bin.y + bin.h * 0.42)}H${r(bin.x + bin.w + 6)}V${r(bin.y + bin.h - 8)}Q${r(bin.x + bin.w + 6)} ${r(bin.y + bin.h + 4)} ${r(bin.x + bin.w - 6)} ${r(bin.y + bin.h + 4)}H${r(bin.x + 6)}Q${r(bin.x - 6)} ${r(bin.y + bin.h + 4)} ${r(bin.x - 6)} ${r(bin.y + bin.h - 8)}Z`, fill: shade(th.wood, 0.2), stroke: th.ink, 'stroke-width': 2.5}),
    rulePlate(ctx, {name: `${P}-binplate`, same: false, key: o.relevant.key, s: 36, x: bin.x + bin.w / 2, y: bin.y + bin.h * 0.42 + (bin.h * 0.58 - ps.h) / 2, strap: false}),
  );
  const pocket = {x: landing.x0 + 6, w: dw + 44};
  pocket.x = Math.min(pocket.x, landing.x1 - pocket.w);
  const pocketTop = ledgeY - dh * 0.42;
  const pocketBack = h('path', {d: roundRectPath(pocket.x, ledgeY - dh * 0.6, pocket.w, dh * 0.6, 8), fill: shade(th.accent2Soft, -0.05), stroke: th.ink, 'stroke-width': 2});
  const pocketFront = g(null,
    h('path', {d: `M${r(pocket.x)} ${r(pocketTop)}H${r(pocket.x + pocket.w)}V${r(ledgeY)}H${r(pocket.x)}Z`, fill: jurColor(ctx, o.relevant.key).soft, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    rulePlate(ctx, {name: `${P}-pocketplate`, same: true, key: o.relevant.key, s: 36, x: pocket.x + pocket.w / 2, y: pocketTop + (dh * 0.42 - ps.h) / 2, strap: false}),
  );

  // --- the document (same in both panels until the stamp)
  const sheet = sourceSheet(ctx, {prefix: `${P}-doc`, w: dw, h: dh, doc: o.doc, jur: o.declared, detail: 'full', blank: true});
  const docNode = g({name: `${P}-docpos`}, g({name: `${P}-docstamp`}, sheet.node));
  // pulse ring that introduces the declaration on the sheet (localized change)
  const reveal = g({name: `${P}-reveal`, opacity: 0},
    h('circle', {name: `${P}-reveal-ring`, r: 10, fill: 'none', stroke: jurColor(ctx, o.declared.key).c, 'stroke-width': 5}));

  // --- key positions
  const x0 = G.book.x + 20; // face-out in the bookcase's open bottom compartment
  const xOut = x0;
  const xGate = gateX - 10 - dw; // presenting the seal to the lock (right edge at the flap)
  const xLand = pocket.x + 22;
  const top = ledgeY - dh;
  const sealLocal = {x: sheet.sealC.x, y: sheet.sealC.y};
  const stripLocal = sheet.strip;
  // final pose in the bin: leaning back a little, bottom on the bin floor
  const binFinal = {x: bin.x + (bin.w - dw) / 2, y: bin.y + bin.h - 8 - dh, deg: -6};

  /**
   * @param {{reveal:number, slide:number, read:number, open:number, pass:number, close:number, write:number, drop:number, fall:number}} v
   */
  function pose(v) {
    const nodes = {};
    const x = lerp(x0, xGate, v.slide);
    let tf = `translate(${r(x)} ${r(top)})`;
    let holder = v.slide <= 0 ? 'library' : v.slide < 1 ? 'sliding' : 'gate';
    let docAngle = 0;
    let flapDeg = 0;
    let trapDeg = 0;
    let center = {x: x + dw / 2, y: top + dh / 2};
    if (same) {
      flapDeg = -78 * ease.inOutCubic(v.open) * (1 - ease.inOutCubic(v.close));
      if (v.pass > 0) {
        const px = lerp(xGate, xLand, ease.inOutCubic(v.pass));
        tf = `translate(${r(px)} ${r(top)})`;
        center = {x: px + dw / 2, y: top + dh / 2};
        holder = v.pass < 1 ? 'passing' : 'landing';
      }
    } else {
      // trapdoor drops; the document rides on it, then slides off into the bin
      trapDeg = 52 * ease.inCubic(clamp(v.drop)) * (1 - ease.inOutCubic(clamp(v.close)));
      const ride = Math.min(trapDeg, 30);
      if (v.drop > 0 && v.fall <= 0) {
        tf = `rotate(${r(ride)} ${r(hinge.x)} ${r(hinge.y)}) translate(${r(xGate)} ${r(top)})`;
        center = rot({x: xGate + dw / 2, y: top + dh / 2}, hinge, ride);
        docAngle = ride;
        holder = 'trapdoor';
      }
      if (v.fall > 0) {
        const f = ease.inOutCubic(v.fall);
        // start: document as it rode the trapdoor at 30°, end: resting in the bin
        const c0 = rot({x: xGate + dw / 2, y: top + dh / 2}, hinge, 30);
        const c1 = {x: binFinal.x + dw / 2, y: binFinal.y + dh / 2};
        const cx = lerp(c0.x, c1.x, f);
        const cy = lerp(c0.y, c1.y, ease.inQuad(f) * 0.7 + f * 0.3);
        const ang = lerp(30, binFinal.deg, f);
        tf = `translate(${r(cx)} ${r(cy)}) rotate(${r(ang)}) translate(${r(-dw / 2)} ${r(-dh / 2)})`;
        center = {x: cx, y: cy};
        docAngle = ang;
        holder = v.fall < 1 ? 'falling' : 'bin';
      }
    }
    nodes[`${P}-docpos`] = {transform: tf};
    nodes[`${P}-flap`] = {transform: `rotate(${r(flapDeg)} ${r(pivot.x)} ${r(pivot.y)})`};
    nodes[`${P}-trap`] = {transform: `rotate(${r(trapDeg)} ${r(hinge.x)} ${r(hinge.y)})`};
    nodes[`${P}-beam`] = {opacity: r(0.55 * Math.sin(Math.PI * clamp(v.read)), 3)};
    nodes[`${P}-glyph`] = {opacity: r(clamp(v.read * 2.5) * (1 - clamp(v.pass * 3 + v.fall * 3)), 3)};
    // declaration introduced in place: the blank fades out, a ring pulses, the declaration appears
    const blankOut = clamp(v.reveal / 0.35);
    const printed = clamp((v.reveal - 0.35) / 0.35);
    const ringP = clamp((v.reveal - 0.25) / 0.75);
    const sealW = {x: x0 + sealLocal.x, y: top + sealLocal.y};
    nodes[`${P}-reveal`] = {transform: T(sealW.x, sealW.y), opacity: ringP > 0 && ringP < 1 ? r(1 - ringP, 3) : 0};
    nodes[`${P}-reveal-ring`] = {r: r(dw * 0.13 + dw * 0.35 * ease.outCubic(ringP), 2)};
    nodes[`${P}-doc-blank`] = {opacity: r(1 - blankOut, 3)};
    nodes[`${P}-doc-decl`] = {opacity: r(printed, 3)};
    // the reference is written on the card only when the document reaches the landing
    nodes[`${P}-card-line0`] = {opacity: r(v.write, 3)};
    nodes[`${P}-pin`] = {opacity: r(clamp(v.write * 2), 3), transform: T(pinAt.x, pinAt.y - 16 * (1 - ease.outCubic(v.write)))};
    nodes[`${P}-slot`] = {opacity: r(1 - v.write, 3)};
    // seal position in panel coordinates (for the comparison guide)
    let sealPt;
    if (holder === 'falling' || holder === 'bin') {
      const a = docAngle * DEG;
      const lx = sealLocal.x - dw / 2, ly = sealLocal.y - dh / 2;
      sealPt = {x: center.x + lx * Math.cos(a) - ly * Math.sin(a), y: center.y + lx * Math.sin(a) + ly * Math.cos(a)};
    } else if (holder === 'trapdoor') {
      sealPt = rot({x: xGate + sealLocal.x, y: top + sealLocal.y}, hinge, docAngle);
    } else {
      const bx = holder === 'passing' || holder === 'landing' ? center.x - dw / 2 : x;
      sealPt = {x: bx + sealLocal.x, y: top + sealLocal.y};
    }
    return {
      nodes,
      semantic: {holder, center: {x: r(center.x), y: r(center.y)}, seal: {x: r(sealPt.x), y: r(sealPt.y)}, flap: r(flapDeg, 2), trap: r(trapDeg, 2), printed: r(printed, 3), written: r(v.write, 3), pinned: r(clamp(v.write * 2), 3), pinSize: {w: r(thumbW), h: r(thumbH)}, docAngle: r(docAngle, 2),
        foot: same ? null : trapFoot(), trapPoint: same ? null : trapPointAt()},
    };
    // point of the document's bottom-left corner and the matching trapdoor point (attachment check)
    function trapFoot() {
      if (holder !== 'trapdoor') return null;
      const q = rot({x: xGate + 4, y: ledgeY}, hinge, docAngle);
      return {x: r(q.x), y: r(q.y)};
    }
    function trapPointAt() {
      if (holder !== 'trapdoor') return null;
      const q = rot({x: xGate + 4, y: ledgeY}, hinge, trapDeg);
      return {x: r(q.x), y: r(q.y)};
    }
  }

  return {
    G, same, sheet, stripLocal,
    layers: {
      back: g(null, back, cord, pocketBack),
      doc: docNode,
      front: g(null, trapNode, binFront, pocketFront, flap, lockNode, beam, cardNode, reveal),
    },
    pose,
    binFinal,
    anchors: {xOut, xGate, xLand, top, hinge, pocket, lock},
  };
}
