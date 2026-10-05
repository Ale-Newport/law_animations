/**
 * Signing-desk stage for the "Firma de documento" motif (LAW-0001..0004).
 * A top-down desk inside a clipped window. Party A signs with a pen, lays the
 * pen down and slides the document across; it glides into party B's waiting
 * hand; B pulls it onto B's folder; B's other hand carries a stamp over and
 * presses a receipt mark.
 *
 * The kit only owns geometry and a pose solver (action values → node props).
 * Each entry owns its own timeline, layout and semantics.
 *
 * Attachment rules enforced here (and asserted by tests through semantics):
 *  - the pen is positioned from the SOLVED hand while held; once laid down it
 *    stays at the exact spot where the hand released it;
 *  - while A pushes / B pulls, the solved hand coincides with the document's
 *    grip point; every IK target is inside arm reach (`reach.*` = true);
 *  - the stamp is positioned from B's solved left hand and marks on contact.
 * @module animations/documents/kits/signing-desk
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, dist} from '../../../core/geometry.js';
import {paperDocument, signatureMark, pen, stampTool, stampImpression, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

/** Geometry per axis. Positions are fractions of the stage unless noted. */
const GEO = {
  horizontal: {dh: 620, docA: [0.29, 0.47], docB: [0.7, 0.47], push: 190, catchX: 0.615,
    shoulderA: [0.275, 1.27], shoulderB1: [1.11, 0.2], shoulderB2: [1.11, 0.8],
    restB1: [-110, 0.16], stampRest: [-125, 0.84], stampLocal: [0.73, 0.6], penRest: [-0.62, 0.3], penAngle: 62},
  square: {dh: 560, docA: [0.3, 0.5], docB: [0.705, 0.5], push: 130, catchX: 0.6,
    shoulderA: [0.3, 1.18], shoulderB1: [1.15, 0.2], shoulderB2: [1.15, 0.72],
    restB1: [-100, 0.15], stampRest: [-115, 0.78], stampLocal: [0.73, 0.6], penRest: [-0.62, 0.3], penAngle: 62},
  vertical: {dh: 540, docA: [0.5, 0.71], docB: [0.5, 0.29], push: 110, catchY: 0.44,
    shoulderA: [0.55, 1.16], shoulderB1: [0.18, -0.15], shoulderB2: [0.8, -0.15],
    restB1: [0.16, 110], stampRest: [-150, 130], stampLocal: [0.7, 0.2], penRest: [-0.66, 0.1], penAngle: 58},
};

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix           unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {{docId:string,title:string,clauses:string[],redactions:number[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.signers
 * @param {string} o.stampLabel
 * @param {string} o.folderLabel
 * @param {boolean} [o.chips=true]     actor chips inside the stage
 * @param {boolean} [o.withStamp=true]
 */
export function signingDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const hor = axis !== 'vertical';
  const {w: W, h: H} = STAGE[axis];
  const showText = ctx.show('all');
  const fracX = f => (f < 0 ? W + f : W * f);

  const dh = G.dh;
  const dw = Math.round(dh * 0.76);
  const docA = {x: W * G.docA[0], y: H * G.docA[1]};
  const docB = {x: W * G.docB[0], y: H * G.docB[1]};
  const docPushEnd = hor ? {x: docA.x + G.push, y: docA.y} : {x: docA.x, y: docA.y - G.push};
  const docCatch = hor ? {x: W * G.catchX, y: docA.y} : {x: docA.x, y: H * G.catchY};
  const fw = dw * 1.2, fh = dh * 1.1;
  const folderC = {x: docB.x + 8, y: docB.y + 16};

  const lookA = actorLook(ctx, o.signers[0], 0);
  const lookB = actorLook(ctx, o.signers[1], 1);

  const armSpec = axis === 'square' ? {upper: 330, lower: 310, width: 50, handScale: 1.3} : {upper: 310, lower: 290, width: 50, handScale: 1.3};
  const armA = topArm(ctx, {name: `${P}-armA`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec});
  const armB1 = topArm(ctx, {name: `${P}-armB1`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'right', ...armSpec});
  const armB2 = topArm(ctx, {name: `${P}-armB2`, skin: lookB.skin, sleeve: lookB.outfit, handed: 'left', ...armSpec});
  const shoulderA = {x: W * G.shoulderA[0], y: H * G.shoulderA[1]};
  const shoulderB1 = {x: W * G.shoulderB1[0], y: H * G.shoulderB1[1]};
  const shoulderB2 = {x: W * G.shoulderB2[0], y: H * G.shoulderB2[1]};

  // Document
  const doc = paperDocument(ctx, {
    prefix: `${P}-doc`, w: dw, h: dh, docId: o.doc.docId, title: o.doc.title, clauses: o.doc.clauses,
    signerLabel: showText && o.printedName !== false ? o.signers[0].name : '', showText, lineSeed: 'signing-doc',
  });
  const sig = signatureMark(ctx, {name: `${P}-sig`, signer: o.signers[0].name, box: doc.sigBox, color: '#1d3f8f', width: 4});
  const stampSpotLocal = {x: dw * G.stampLocal[0], y: dh * G.stampLocal[1]};
  const impression = stampImpression(ctx, {name: `${P}-impr`, text: o.stampLabel, w: dw * 0.44, rotate: -10, color: th.accent, showText});
  const redactions = (o.doc.redactions || []).filter(i => i < doc.clauseBoxes.length).map(i => {
    const b = doc.clauseBoxes[i];
    return h('rect', {x: b.x - 4, y: b.y - 2, width: b.w + 8, height: Math.min(b.h - 6, 64), rx: 4, fill: th.ink});
  });
  const docNode = g({name: `${P}-docg`},
    g({transform: T(-dw / 2, -dh / 2)}, doc.node, redactions, sig.node,
      g({transform: T(stampSpotLocal.x, stampSpotLocal.y)}, impression)),
  );

  // Pen (origin at nib); the barrel points back toward the writer's hand.
  const penAngle = G.penAngle;
  const penProp = pen(ctx, {name: `${P}-pen`, length: 210, body: th.accent2});
  const penDir = {x: Math.cos(rad(penAngle)), y: Math.sin(rad(penAngle))};

  // Stamp tool
  const stampRest = {x: fracX(G.stampRest[0]), y: G.stampRest[1] > 1.5 ? G.stampRest[1] : H * G.stampRest[1]};
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: 100, color: th.accent});

  // Folder (open, supports the received document) with a few sheets inside
  const folderColor = '#dcbc7d';
  const folderNode = g({transform: T(folderC.x - fw / 2, folderC.y - fh / 2)},
    h('path', {d: `M10 ${r(fh * 0.06 + 12)}V${r(fh + 12)}H${r(fw + 10)}V34H${r(fw * 0.4 + 32)}L${r(fw * 0.4 + 10)} 12H20Q10 12 10 22Z`, fill: th.shadow}),
    h('path', {d: `M0 ${r(fh * 0.06)}Q0 0 10 0H${r(fw * 0.4)}L${r(fw * 0.4 + 22)} 22H${r(fw - 10)}Q${r(fw)} 22 ${r(fw)} 32V${r(fh - 10)}Q${r(fw)} ${r(fh)} ${r(fw - 10)} ${r(fh)}H10Q0 ${r(fh)} 0 ${r(fh - 10)}Z`, fill: folderColor, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: fw * 0.1 + 10, y: fh * 0.08 + 6, width: dw * 0.96, height: dh * 0.96, rx: 4, fill: '#f3eee3', stroke: shade(folderColor, -0.35), 'stroke-width': 1.5, transform: 'rotate(2.5)'}),
    h('rect', {x: fw * 0.1 - 4, y: fh * 0.08 + 2, width: dw * 0.96, height: dh * 0.96, rx: 4, fill: '#f7f3ea', stroke: shade(folderColor, -0.35), 'stroke-width': 1.5, transform: 'rotate(-1.5)'}),
    h('path', {d: `M14 ${r(fh - 9)}H${r(fw - 14)}`, stroke: shade(folderColor, -0.2), 'stroke-width': 3}),
    showText && o.folderLabel ? folderLabel(ctx, o.folderLabel, fw, fh) : null,
  );

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30});

  // Actor chips near where each actor sits; kept clear of the action paths.
  const chipSize = hor ? 30 : 32;
  const chipA = o.chips !== false && ctx.show('key')
    ? chip(ctx, actorCaption(o.signers[0]), hor
      ? {x: shoulderA.x + 90, y: H - 30 - chipSize * 1.8, maxWidth: W * 0.4, size: chipSize, maxLines: 1, name: `${P}-chipA`}
      : {x: W - 30, y: H - 30 - chipSize * 1.8, anchor: 'end', maxWidth: W * 0.5, size: chipSize, maxLines: 1, name: `${P}-chipA`})
    : null;
  const chipB = o.chips !== false && ctx.show('key')
    ? chip(ctx, actorCaption(o.signers[1]), hor
      ? {x: docB.x - fw * 0.2, y: 26, anchor: 'end', maxWidth: W * 0.4, size: chipSize, maxLines: 1, name: `${P}-chipB`}
      : {x: W * 0.36, y: 26, maxWidth: W * 0.5, size: chipSize, maxLines: 1, name: `${P}-chipB`})
    : null;

  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      folderNode,
      docNode,
      penProp.node,
      armA.arm, armA.palm, armA.thumb,
      armB1.arm, armB1.palm, armB1.thumb,
      o.withStamp !== false ? [stampNode, armB2.arm, armB2.palm, armB2.thumb] : null,
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  const sigStart = sig.tipAt(0);
  const restTip = {x: docA.x + dw * G.penRest[0], y: docA.y + dh * G.penRest[1]};
  const restB1 = hor ? {x: fracX(G.restB1[0]), y: H * G.restB1[1]} : {x: W * G.restB1[0], y: G.restB1[1]};
  // B grips the edge that faces B; A pushes from the lower part of the sheet.
  const gripB = hor ? {x: dw / 2 - 20, y: -dh * 0.2} : {x: -dw * 0.2, y: -dh / 2 + 20};
  const gripA = hor ? {x: -dw * 0.18, y: dh * 0.26} : {x: dw * 0.12, y: dh * 0.36};
  const restA = hor ? {x: shoulderA.x - 40, y: H - 80} : {x: shoulderA.x + 110, y: H - 90};

  const rotAt = (pose, local) => {
    const a = rad(pose.rot);
    return {x: pose.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: pose.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
  };
  /** world point of a doc-local (top-left origin) point, given doc pose */
  const docWorld = (pose, local) => rotAt(pose, {x: local.x - dw / 2, y: local.y - dh / 2});
  const atA = {x: docA.x, y: docA.y, rot: 0};

  /**
   * Pose the stage from action values, each in [0,1].
   * @param {{approach:number, write:number, putDown:number, toDoc:number, push:number, glide:number, reach:number, pull:number, release:number, stamp:number, hover?:number}} s
   */
  function pose(s) {
    const nodes = {};
    const reduced = ctx.reduced;

    // --- document path: A → push (hand-carried) → glide (free, decelerating) → pull (B hand) → B
    let docPos;
    if (s.pull > 0) docPos = mix(docCatch, docB, ease.inOutCubic(s.pull));
    else if (s.glide > 0) docPos = mix(docPushEnd, docCatch, ease.outCubic(s.glide));
    else docPos = mix(docA, docPushEnd, ease.inQuad(s.push));
    const poseAt = q => ({...q, rot: reduced ? 0 : Math.sin(Math.PI * clamp(dist(docA, q) / Math.max(1, dist(docA, docB)))) * (hor ? -2.5 : 2.5)});
    const docPose = poseAt(docPos);
    nodes[`${P}-docg`] = {transform: T(docPose.x, docPose.y, docPose.rot)};
    const holder = s.pull >= 1 ? 'B' : s.pull > 0 ? 'B-pulling' : s.glide > 0 ? 'gliding' : s.push > 0 ? 'A-pushing' : 'A';

    // --- arm A: approach, write, lay the pen down, move to the sheet, push, retreat
    const sigWorldStart = docWorld(atA, sigStart);
    const sigWorldEnd = docWorld(atA, sig.tipAt(1));
    const signed = s.write >= 1;
    let tip = null; // pen tip while held
    let handA;
    const touching = s.write > 0 && s.write < 1;
    const penGrip = t => ({x: t.x + penDir.x * penProp.grip, y: t.y + penDir.y * penProp.grip});
    if (s.push > 0 || s.glide > 0 || s.pull > 0 || s.toDoc >= 1) {
      // hand on the sheet (push) then retreat to rest after release
      const pushHand = rotAt(s.glide > 0 || s.pull > 0 ? {...docPushEnd, rot: 0} : docPose, gripA);
      const back = s.glide > 0 || s.pull > 0 ? ease.inOutCubic(clamp((s.glide * 0.6) + s.pull)) : 0;
      handA = mix(pushHand, restA, back);
    } else if (s.toDoc > 0) {
      handA = mix(penGrip(restTip), rotAt(atA, gripA), ease.inOutCubic(s.toDoc));
    } else if ((s.withdraw ?? 0) > 0 && s.putDown >= 1) {
      // no transfer: after laying the pen down, A's empty hand withdraws to rest
      handA = mix(penGrip(restTip), restA, ease.inOutCubic(s.withdraw));
    } else if (s.putDown > 0) {
      tip = mix(signed ? sigWorldEnd : sigWorldStart, restTip, ease.inOutCubic(s.putDown));
    } else if (s.write > 0) {
      tip = docWorld(atA, sig.tipAt(ease.inOutSine(s.write)));
    } else {
      tip = mix(restTip, sigWorldStart, ease.inOutCubic(s.approach));
      if (s.hover && !reduced) tip = {x: tip.x + Math.sin(s.hover * Math.PI * 2) * 12, y: tip.y};
    }
    const lifted = !touching && s.putDown < 1 && s.toDoc === 0;
    if (tip) handA = penGrip({x: tip.x - (lifted ? 6 : 0), y: tip.y - (lifted ? 14 : 0)});
    const solvedA = armA.pose(shoulderA, handA, -1);
    Object.assign(nodes, solvedA.nodes);
    const penHeld = s.putDown < 1;
    const penTip = penHeld && tip
      ? {x: solvedA.hand.x - penDir.x * penProp.grip, y: solvedA.hand.y - penDir.y * penProp.grip}
      : {x: restTip.x, y: restTip.y};
    nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, penAngle)};

    // --- signature stroke
    Object.assign(nodes, sig.frame(ease.inOutSine(clamp(s.write))));

    // --- arm B1: reach to the catch grip, receive, pull, release
    const catchGrip = rotAt(poseAt(docCatch), gripB);
    let handB1;
    if (s.release > 0) handB1 = mix(rotAt(docPose, gripB), restB1, ease.inOutCubic(s.release));
    else if (s.pull > 0) handB1 = rotAt(docPose, gripB);
    else handB1 = mix(restB1, catchGrip, ease.inOutCubic(s.reach));
    const solvedB1 = armB1.pose(shoulderB1, handB1, 1);
    Object.assign(nodes, solvedB1.nodes);

    // --- stamp: carried over the spot, pressed, lifted, returned
    let press = 0;
    let stampPos = stampRest;
    let solvedB2 = null;
    const spot = docWorld(docPose, stampSpotLocal);
    if (o.withStamp !== false) {
      const st = s.stamp;
      const go = seg(st, 0, 0.35), down = seg(st, 0.35, 0.47), up = seg(st, 0.47, 0.58), back = seg(st, 0.58, 1);
      const target = back > 0 ? mix(spot, stampRest, ease.inOutCubic(back)) : mix(stampRest, spot, ease.inOutCubic(go));
      press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
      const carried = st > 0 && st < 1 ? 1 - press : 0;
      solvedB2 = armB2.pose(shoulderB2, target, -1);
      stampPos = solvedB2.hand; // the stamp follows the solved hand (never detached)
      nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * carried) * (1 - 0.08 * press))};
      nodes[`${P}-stamp-shadow`] = {opacity: 1 - press * 0.85};
      Object.assign(nodes, solvedB2.nodes);
      nodes[`${P}-impr`] = {opacity: st >= 0.47 ? 0.9 : 0};
    }

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        penTip: P2(penTip),
        penHeld: penHeld && Boolean(tip),
        penTouching: touching,
        signatureProgress: r(clamp(s.write), 3),
        documentCenter: P2(docPose),
        documentRotation: r(docPose.rot),
        documentHolder: holder,
        handA: P2(solvedA.hand),
        docGripA: P2(rotAt(docPose, gripA)),
        handB1: P2(solvedB1.hand),
        docGripB: P2(rotAt(docPose, gripB)),
        stampTool: P2(stampPos),
        stampSpot: P2(spot),
        reach: {A: solvedA.reached, B1: solvedB1.reached, B2: solvedB2 ? solvedB2.reached : true},
        allReached: solvedA.reached && solvedB1.reached && (!solvedB2 || solvedB2.reached),
        stampPressed: press > 0.5,
        stampApplied: o.withStamp !== false && s.stamp >= 0.47,
      },
    };
  }

  return {
    node,
    pose,
    W, H, axis,
    doc, dw, dh, docA, docB, fw, fh, folderC,
    sig,
    /** doc-local → stage coordinates for a doc resting at A or B */
    docPoint: (where, local) => docWorld(where === 'B' ? {x: docB.x, y: docB.y, rot: 0} : atA, local),
    stampSpotLocal,
  };
}

function actorCaption(p) {
  return p.role ? `${p.name} · ${p.role}` : p.name;
}

function folderLabel(ctx, label, fw, fh) {
  const f = ctx.fit(label, {maxWidth: fw * 0.8, size: 22, minSize: 14, maxLines: 1, weight: 700});
  return h('text', {x: 18, y: fh - 16, 'font-size': r(f.size), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: ctx.theme.ink}, f.lines[0]);
}
