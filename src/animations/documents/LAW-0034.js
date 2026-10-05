/**
 * LAW-0034 — Notificación documentada · mechanism
 *
 * Storyboard (exploded circuit, not a row of boxes): a dashed divider stands
 * for the wall between the two offices. The sender side holds the sender,
 * the OUT tray and the record folder; the recipient side holds the IN tray
 * and the recipient; the objects that CROSS the wall (envelope, enclosed
 * notice, acknowledgment card) sit on the divider. The components form a
 * loop: sender → OUT tray → envelope → IN tray → recipient → acknowledgment
 * → folder → sender, with the notice enclosed in the envelope.
 *  0.00–0.18  separate: the assembled envelope (notice inside, card clipped)
 *             lifts out of the OUT tray; the notice slides out of it and the
 *             card unclips — each to its own place on the divider.
 *  0.18–0.43  draw only the supplied relationships, styled by kind (plain
 *             relation = no arrow; causal only when supplied).
 *  0.43–0.78  a tracer follows the traversal order (passing under the labels);
 *             the focus element grows as it passes. State changes happen where
 *             the tracer is: a copy of the envelope travels along the
 *             'delivered' connector into the IN tray, the pen signs the card
 *             while the tracer runs recipient → card, the tracer dwells on the
 *             card while the date stamp marks it, then the signed and stamped
 *             copy travels along 'returned' into the folder.
 *  0.78–1.00  gather: descriptive states (delivered / signed / filed) stay
 *             visible; the legend names each connector kind.
 * @module animations/documents/LAW-0034
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {documentsFields, mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {paperDocument, pen, stampTool, shade} from '../../primitives/paper.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {letterTray, noticeEnvelope, ackCard, recordFolder, wordSafeSize, ENV, CARD, TRAY, FOLDER, NOTICE_STRINGS, noticeObjectLabels, receiptDateField, atPose} from './kits/notificacion-documentada.js';

const ID = 'LAW-0034';
const DURATION = 7000;
const IDS = ['sender', 'outTray', 'document', 'envelope', 'inTray', 'recipient', 'acknowledgment', 'folder'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.78], gather: [0.78, 1]};
/** Tracer run [T0, T1] with a dwell of DWELL at the acknowledgment card (where it is date-stamped). */
const TRACE = {T0: 0.44, T1: 0.77, DWELL: 0.05};
const SANS = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const sceneSchema = {
  ...documentsFields,
  ...mechanismFields(IDS),
  objectLabels: noticeObjectLabels,
  receiptDate: receiptDateField,
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'NTF-207',
  documentTitle: 'Notice of Meeting',
  clauses: ['Date and place of the meeting', 'Documents enclosed', 'Contact for questions'],
  signers: [{name: 'Alex Moreno', role: 'Sender'}, {name: 'Sam Okafor', role: 'Recipient'}],
  redactions: [],
  elements: [
    {id: 'sender', label: 'Sender (Party A)'},
    {id: 'outTray', label: 'OUT tray'},
    {id: 'document', label: 'Notice'},
    {id: 'envelope', label: 'Envelope'},
    {id: 'inTray', label: 'IN tray'},
    {id: 'recipient', label: 'Recipient (Party B)'},
    {id: 'acknowledgment', label: 'Acknowledgment card'},
    {id: 'folder', label: 'Sender’s notice file'},
  ],
  relationships: [
    {from: 'sender', to: 'outTray', kind: 'relation', label: 'places'},
    {from: 'document', to: 'envelope', kind: 'relation', label: 'enclosed in'},
    {from: 'outTray', to: 'envelope', kind: 'sequence', label: 'dispatched'},
    {from: 'envelope', to: 'inTray', kind: 'communication', label: 'delivered'},
    {from: 'inTray', to: 'recipient', kind: 'relation', label: 'received by'},
    {from: 'recipient', to: 'acknowledgment', kind: 'sequence', label: 'signs and dates'},
    {from: 'acknowledgment', to: 'folder', kind: 'communication', label: 'returned'},
    {from: 'folder', to: 'sender', kind: 'relation', label: 'kept by'},
  ],
  focusElement: 'acknowledgment',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['sender', 'outTray', 'envelope', 'inTray', 'recipient', 'acknowledgment', 'folder'],
  objectLabels: {outTray: 'OUT', inTray: 'IN', folder: 'Notice file', card: 'Acknowledgment', stamp: 'RECEIVED'},
  receiptDate: 'Day 3',
};

/**
 * Hand-placed component centres per shape (design units). Landscape: a
 * horizontal loop around a vertical divider (sender left, recipient right).
 * Square / portrait: a vertical loop around a horizontal divider — the
 * sender's office above (sender, OUT tray, record folder), the three crossing
 * objects on the divider (envelope, enclosed notice, acknowledgment card) and
 * the recipient's office below (IN tray, recipient, pen and date stamp).
 * `tools` is where the pen and stamp rest; `font` sizes captions and relation
 * labels so they stay legible at 1080p. `capOrders` lists further caption
 * placement orders to try (the cheapest layout wins): in portrait the record
 * file stands right above the card, and whichever caption is placed first
 * decides whether the other can avoid stacking with it.
 */
const PLACES = {
  // design spaces carry the proportions of each frame's caption-safe box, so the extra room
  // spreads the components (longer connectors, free space for captions) at no loss of scale
  // the pen and stamp rest well right of the card, so the card's caption can sit beside the card
  // itself (below it there is no room above the legend, and to its left stands the folder)
  landscape: {size: [2300, 1005], div: {o: 'v', at: 1150}, sender: [170, 540], outTray: [560, 250], envelope: [1150, 185], inTray: [1740, 250], recipient: [2130, 540], document: [1150, 560], acknowledgment: [1150, 842], folder: [620, 790], tools: [1830, 872], stampFirst: true, legend: [1880, 982],
    k: {tray: 0.72, env: 0.95, doc: 0.56, card: 1.4, folder: 0.92, badge: 98}, font: {cap: 30, chip: 27, chipMax: 300, capMax: 380}},
  square: {size: [1420, 1100], div: {o: 'h', at: 580}, sender: [710, 132], outTray: [265, 262], folder: [1150, 262], envelope: [250, 580], document: [710, 580], acknowledgment: [1170, 580], inTray: [265, 898], recipient: [710, 922], tools: [1150, 905], legend: [770, 1080],
    k: {tray: 0.62, env: 0.82, doc: 0.52, card: 1.2, folder: 0.7, badge: 84}, font: {cap: 32, chip: 29, chipMax: 290, capMax: 320}},
  portrait: {size: [1200, 1720], div: {o: 'h', at: 820}, sender: [600, 140], outTray: [230, 470], folder: [975, 470], envelope: [215, 820], document: [600, 820], acknowledgment: [1010, 820], inTray: [230, 1172], recipient: [600, 1462], tools: [990, 1290], legend: [600, 1692], capOrders: [['sender', 'acknowledgment', 'folder']],
    k: {tray: 0.62, env: 0.8, doc: 0.5, card: 1.2, folder: 0.66, badge: 92}, font: {cap: 28, chip: 27, chipMax: 290, capMax: 300}},
};

/** Collision helpers (boxes are {x,y,w,h} in design units). */
const hits = (b, q, pad = 0) => b.x < q.x + q.w + pad && b.x + b.w + pad > q.x && b.y < q.y + q.h + pad && b.y + b.h + pad > q.y;
const grow = (b, k) => ({x: b.x - (b.w * (k - 1)) / 2, y: b.y - (b.h * (k - 1)) / 2, w: b.w * k, h: b.h * k});
/** Candidate top-left corners for a {w,h} label around box b, in preference order. */
function around(b, w, hh, gap = 12) {
  const cx = b.x + b.w / 2 - w / 2, cy = b.y + b.h / 2 - hh / 2;
  return [
    {x: cx, y: b.y + b.h + gap}, {x: cx - w * 0.2, y: b.y + b.h + gap}, {x: cx + w * 0.2, y: b.y + b.h + gap}, {x: cx, y: b.y - gap - hh},
    {x: b.x + b.w + gap, y: cy}, {x: b.x - gap - w, y: cy},
    // beside the element, flush with its bottom / top edge (a tall two-line caption next to a card)
    {x: b.x + b.w + gap, y: b.y + b.h - hh}, {x: b.x - gap - w, y: b.y + b.h - hh},
    {x: b.x + b.w + gap, y: b.y}, {x: b.x - gap - w, y: b.y},
    {x: b.x + b.w - w * 0.25, y: b.y + b.h + gap}, {x: b.x - w * 0.75, y: b.y + b.h + gap},
    {x: b.x + b.w - w * 0.25, y: b.y - gap - hh}, {x: b.x - w * 0.75, y: b.y - gap - hh},
    {x: b.x + b.w + gap, y: b.y - hh * 0.5}, {x: b.x - gap - w, y: b.y - hh * 0.5},
    {x: b.x + b.w + gap, y: b.y + b.h - hh * 0.5}, {x: b.x - gap - w, y: b.y + b.h - hh * 0.5},
  ];
}
/**
 * Further caption spots (tried after `around`): slid along each side of box b, nearest to the
 * centred spot first, always keeping part of the label alongside the element (a gutter between
 * a connector and a neighbour often lies a little off-centre).
 */
function slides(b, w, hh, gap = 12) {
  const cx = b.x + b.w / 2 - w / 2, cy = b.y + b.h / 2 - hh / 2;
  const out = [];
  const maxX = b.w / 2 + w / 2 - 24, maxY = b.h / 2 + hh / 2 - 12;
  // at each offset: below (either way) before above, then the sides
  for (let d = 16; d <= Math.max(maxX, maxY); d += 16) {
    if (d <= maxX) {
      for (const s of [-1, 1]) out.push({x: cx + s * d, y: b.y + b.h + gap});
      for (const s of [-1, 1]) out.push({x: cx + s * d, y: b.y - gap - hh});
    }
    if (d <= maxY) for (const s of [-1, 1]) out.push({x: b.x + b.w + gap, y: cy + s * d}, {x: b.x - gap - w, y: cy + s * d});
  }
  return out;
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const K = Pl.k;
    const F = Pl.font;
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const at = id => ({x: Pl[id][0], y: Pl[id][1]});
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const hasEl = id => p.elements.some(e => e.id === id);
    const keyOn = ctx.show('key');
    const showText = ctx.show('all');

    // ---- components (each drawn around its own centre; body group scales for focus)
    const trayW = TRAY.w * K.tray, trayH = TRAY.h * K.tray;
    const envW = ENV.w * K.env, envH = ENV.h * K.env;
    const docW = 300 * K.doc, docH = 390 * K.doc;
    const cardW = CARD.w * K.card, cardH = CARD.h * K.card;
    const fW = FOLDER.w * K.folder, fH = FOLDER.h * K.folder;
    const boxAt = (id, w, hh) => ({x: at(id).x - w / 2, y: at(id).y - hh / 2, w, h: hh});
    const boxes = {
      outTray: boxAt('outTray', trayW, trayH), inTray: boxAt('inTray', trayW, trayH),
      envelope: boxAt('envelope', envW, envH), document: boxAt('document', docW, docH),
      acknowledgment: boxAt('acknowledgment', cardW, cardH), folder: boxAt('folder', fW, fH + 12),
    };
    const lookA = actorLook(ctx, p.signers[0], 0);
    const lookB = actorLook(ctx, p.signers[1], 1);
    const R = K.badge;
    // badges without their built-in label: captions are placed below with collision checks
    const sender = personBadge(ctx, {name: 'el-sender', x: at('sender').x, y: at('sender').y, radius: R, look: lookA});
    const recipient = personBadge(ctx, {name: 'el-recipient', x: at('recipient').x, y: at('recipient').y, radius: R, look: lookB});
    boxes.sender = sender.box;
    boxes.recipient = recipient.box;

    const outTray = letterTray(ctx, {front: 'bottom', kind: 'out', label: p.objectLabels.outTray, plate: th.accent3Soft});
    const inTray = letterTray(ctx, {front: 'top', kind: 'in', label: p.objectLabels.inTray, plate: th.accent2Soft});
    const env = noticeEnvelope(ctx, {prefix: 'm-env', docId: p.documentId, title: p.documentTitle, clause: p.clauses[0], redactFirst: p.redactions.includes(0), addressee: p.signers[1].name, toLabel: t.to, showText});
    const inEnv = noticeEnvelope(ctx, {prefix: 'm-inenv', docId: p.documentId, title: p.documentTitle, clause: p.clauses[0], redactFirst: p.redactions.includes(0), addressee: p.signers[1].name, toLabel: t.to, showText: false});
    const doc = paperDocument(ctx, {prefix: 'm-doc', w: 300, h: 390, docId: p.documentId, title: p.documentTitle, clauses: p.clauses, signerLabel: '', showText, lineSeed: 'notice-doc'});
    const redact = (p.redactions || []).filter(i => i < doc.clauseBoxes.length).map(i => {
      const b = doc.clauseBoxes[i];
      return h('rect', {x: b.x - 3, y: b.y - 2, width: b.w + 6, height: Math.min(b.h - 4, 40), rx: 3, fill: th.ink});
    });
    const card = ackCard(ctx, {prefix: 'm-card', title: p.objectLabels.card, docRef: p.documentId, addressee: p.signers[1].name, signer: p.signers[1].name,
      labels: {doc: t.doc, to: t.to, receivedBy: t.receivedBy}, stampWord: p.objectLabels.stamp, date: p.receiptDate, showText});
    const folderCopy = ackCard(ctx, {prefix: 'm-fcopy', title: p.objectLabels.card, docRef: p.documentId, addressee: p.signers[1].name, signer: p.signers[1].name,
      labels: {doc: t.doc, to: t.to, receivedBy: t.receivedBy}, stampWord: p.objectLabels.stamp, date: p.receiptDate, showText: false});
    const folder = recordFolder(ctx, {label: p.objectLabels.folder});

    const elements = {
      sender: {circle: sender.circle}, recipient: {circle: recipient.circle},
      outTray: {box: boxes.outTray}, inTray: {box: boxes.inTray}, envelope: {box: boxes.envelope},
      document: {box: boxes.document}, acknowledgment: {box: boxes.acknowledgment}, folder: {box: boxes.folder},
    };

    // ---- fixed furniture: pen + stamp resting place and the legend
    const toolsAt = at('tools');
    // resting places of the pen and the date stamp; in landscape the stamp rests nearer the card
    // (its quick press-and-return trip stays short) and the pen beyond it
    const stampFirst = !!Pl.stampFirst;
    const penRest = stampFirst ? {x: toolsAt.x + 80, y: toolsAt.y + 40, a: -30} : {x: toolsAt.x - 90, y: toolsAt.y + 40, a: -30};
    const stampRest = stampFirst ? {x: toolsAt.x - 60, y: toolsAt.y + 26} : {x: toolsAt.x + 130, y: toolsAt.y + 26};
    const toolsBox = stampFirst ? {x: stampRest.x - 52, y: toolsAt.y - 58, w: penRest.x + 160 - (stampRest.x - 52), h: 130} : {x: toolsAt.x - 100, y: toolsAt.y - 58, w: 280, h: 130};
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = showText ? legendNode(ctx, kinds, p.relationLabels, at('legend')) : null;
    // bottom of the two offices (the tinted zones end just above the legend)
    const stageBottom = legend ? legend.box.y - 14 : S.h - 20;
    // every component box, the focus element at its enlarged size (it grows while the tracer passes)
    const focusK = 1.24;
    const compBoxes = Object.entries(boxes).map(([id, b]) => (id === p.focusElement ? grow(b, focusK) : grow(b, 1.08)));
    const fixed = [toolsBox, ...compBoxes, ...(legend ? [legend.box] : [])];

    const onDivider = id => ['envelope', 'document', 'acknowledgment'].includes(id);
    // ---- pass 1: connector geometry (edge-anchored), then keep every label off every line
    // long relation captions use a slightly smaller chip so they can sit beside short connectors
    const longest = Math.max(0, ...p.relationships.map(x => (x.label || p.relationLabels[x.kind] || x.kind).length));
    const graphOpts = {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: longest > 16 ? F.chip * 0.84 : F.chip, chipMax: F.chipMax,
      separateLabels: true, bounds: {x: 8, y: 8, w: S.w - 16, h: S.h - 16},
      // a link between two objects sitting on the divider arcs off it, so it never reads as part of the wall
      bend: rel => (onDivider(rel.from) && onDivider(rel.to) ? 0.32 : rel.kind === 'communication' ? 0.16 : 0.06)};
    const probe = relationGraph(ctx, {...graphOpts, obstacles: fixed});
    const lineBoxes = [];
    for (const x of probe.conns) {
      const n = Math.max(6, Math.ceil(x.c.total / 18));
      for (let i = 0; i <= n; i++) {
        const q = x.c.at(i / n);
        lineBoxes.push({x: q.x - 11, y: q.y - 11, w: 22, h: 22});
      }
    }

    // ---- element captions: below by default, otherwise the first free side
    // (clear of components, lines, the tools, the legend and other captions)
    const placed = [];
    const blocked = (b, extra = []) => b.x < 6 || b.y < 6 || b.x + b.w > S.w - 6 || b.y + b.h > S.h - 6
      || [...fixed, ...lineBoxes, ...placed, ...extra].some(q => hits(b, q, 6));
    const grownOf = id => (id === p.focusElement ? grow(boxes[id], focusK) : grow(boxes[id], 1.08));
    // area of b within `pad` of any obstacle; labels already placed can ask for a wider clearance
    const overlapArea = (b, placedPad = 6) => [...fixed, ...lineBoxes, ...placed].reduce((a, q, i, all) => {
      const pd = i >= all.length - placed.length ? placedPad : 6;
      const w = Math.min(b.x + b.w, q.x + q.w + pd) - Math.max(b.x, q.x - pd), hh = Math.min(b.y + b.h, q.y + q.h + pd) - Math.max(b.y, q.y - pd);
      return a + (w > 0 && hh > 0 ? w * hh : 0);
    }, 0) + (b.x < 6 || b.x + b.w > S.w - 6 || b.y < 6 || b.y + b.h > S.h - 6 ? 1e7 : 0);
    // gap between two boxes (0 when they touch or overlap)
    const gapTo = (bx, q) => Math.hypot(Math.max(0, q.x - (bx.x + bx.w), bx.x - (q.x + q.w)), Math.max(0, q.y - (bx.y + bx.h), bx.y - (q.y + q.h)));
    // captions of different elements keep a clear gap (about 20 px at 1080p) and never line up
    // closely enough to read as one two-part label: stacked in a column (e.g. the record file's
    // caption right above the card's) or run together on one line
    const CAP_GAP = 28;
    const linesUpWith = (bx, q) => {
      const xOver = Math.min(bx.x + bx.w, q.x + q.w) - Math.max(bx.x, q.x);
      const yOver = Math.min(bx.y + bx.h, q.y + q.h) - Math.max(bx.y, q.y);
      const gp = gapTo(bx, q);
      return (xOver > 0 && gp < 64) || (yOver > 0 && gp < 40);
    };
    // a label must read as belonging to its own element: it is ambiguous when another component
    // stands about as close to it. Measured against the elements as they are drawn at rest (the
    // focus element's temporary enlargement would otherwise make a spot nearer a neighbour look
    // like it belongs to the focus element)
    const ambiguousFor = (id, bx) => {
      const own = gapTo(bx, boxes[id]);
      return Object.keys(boxes).some(k => k !== id && gapTo(bx, boxes[k]) < own * 1.5 + 14);
    };
    // cost of the labels placed so far in a trial (overlaps, ambiguous spots, reduced sizes, tags
    // crowding another element's caption), to compare caption placement orders
    let trialCost = 0;
    const capOf = id => {
      if (!keyOn || !hasEl(id)) return null;
      const b = grownOf(id);
      // an ambiguous spot (e.g. under the folder, left of the card, between the OUT tray and the
      // envelope) is only used when no unambiguous free spot exists at any label size
      // (only element captions are placed at this point, so `placed` holds the other captions)
      const ambiguous = bx => ambiguousFor(id, bx) || placed.some(q => linesUpWith(bx, q));
      // full size first; long labels step down in size / width before any overlap is accepted
      // (the first steps stay close to full size: key captions keep about 20 px at 1080p)
      const variants = [[F.cap, F.capMax, 2], [F.cap * 0.92, F.capMax, 2], [F.cap * 0.86, F.capMax, 2], [F.cap * 0.78, F.capMax, 2], [F.cap * 0.88, F.capMax * 0.8, 3], [F.cap * 0.78, F.capMax * 0.75, 3]];
      // the caption's chip for one size variant (null when it would be truncated or orphaned)
      const shapeOf = vi => {
        const [size0, mw, lines] = variants[vi];
        const size = wordSafeSize(ctx, label(id), mw, size0, 18);
        const pr0 = chip(ctx, label(id), {x: 0, y: 0, anchor: 'start', maxWidth: mw, size, maxLines: lines});
        if (pr0.fit.truncated) return null;
        // no orphan: a wrapped caption whose last line is a stub ('A)') tries the next size first
        const last = pr0.fit.lines[pr0.fit.lines.length - 1] || '';
        if (pr0.fit.lines.length > 1 && last.length <= 3 && size0 !== variants[variants.length - 1][0]) return null;
        // balanced lines: the narrowest box that keeps the same line count and size
        let mwB = mw;
        if (pr0.fit.lines.length > 1) {
          let lo = mw * 0.4, hi = mw;
          const whole = String(label(id)).replace(/\s+/g, ' ').trim();
          for (let k = 0; k < 10; k++) {
            const mid = (lo + hi) / 2;
            const q = chip(ctx, label(id), {x: 0, y: 0, anchor: 'start', maxWidth: mid, size, maxLines: lines});
            // same line count and size, and no word split across lines
            if (!q.fit.truncated && q.fit.lines.length === pr0.fit.lines.length && q.fit.size === pr0.fit.size && q.fit.lines.join(' ') === whole) hi = mid;
            else lo = mid;
          }
          mwB = Math.min(mw, Math.ceil(hi) + 2);
        }
        const make = (x, y) => chip(ctx, label(id), {x, y, anchor: 'start', maxWidth: mwB, size, maxLines: lines, name: `lab-${id}`});
        return {make, pr: make(0, 0)};
      };
      const shapes = variants.map((_, vi) => shapeOf(vi));
      // search order: the usual spots around the element at full and near-full size, then spots
      // slid along its sides at those sizes (so a key caption keeps a legible size), and only then
      // the smaller / narrower variants anywhere
      const stages = [[0, around], [1, around], [0, slides], [1, slides],
        ...[2, 3, 4, 5].map(vi => [vi, (bb, w, hh, gap) => [...around(bb, w, hh, gap), ...slides(bb, w, hh, gap)]])];
      let best = null;
      for (const [vi, cands] of stages) {
        const sh = shapes[vi];
        if (!sh) continue;
        for (const c of cands(b, sh.pr.box.w, sh.pr.box.h, 12)) {
          const bx = {x: c.x, y: c.y, w: sh.pr.box.w, h: sh.pr.box.h};
          const area = overlapArea(bx, CAP_GAP);
          const score = area > 0 ? 1e6 + area : ambiguous(bx) ? 1 : 0;
          if (!best || score < best.score) best = {score, make: sh.make, c, vi};
          if (score === 0) break;
        }
        // an unambiguous free spot ends the search; an ambiguous free spot at a larger size is
        // kept as the fallback while smaller sizes are tried
        if (best && best.score === 0) break;
      }
      trialCost += (best.score >= 1e6 ? best.score : best.score * 2000) + best.vi * 150;
      const c = best.make(best.c.x, best.c.y);
      placed.push(c.box);
      return c;
    };
    let caps = {};

    // ---- descriptive end-state tags beside their element. They appear in the gather beat, once
    // the tracer has passed and every component is back at its rest size, so they are placed
    // against the components as drawn at rest (the focus element's enlargement is over by then)
    const restOf = id => grow(boxes[id], 1.03);
    const restFixed = [toolsBox, ...Object.keys(boxes).map(restOf), ...(legend ? [legend.box] : [])];
    const blockedRest = b => b.x < 6 || b.y < 6 || b.x + b.w > S.w - 6 || b.y + b.h > S.h - 6
      || [...restFixed, ...lineBoxes, ...placed].some(q => hits(b, q, 6));
    const tagOf = (name, text, id, color) => {
      if (!keyOn) return null;
      const pr = statusTag(ctx, text, {x: 0, y: 0, size: 26, maxWidth: 300, name});
      const b = restOf(id);
      const cands = [
        {x: b.x + b.w - pr.box.w * 0.7, y: b.y - 12 - pr.box.h}, {x: b.x - pr.box.w * 0.3, y: b.y - 12 - pr.box.h},
        {x: b.x + b.w + 12, y: b.y}, {x: b.x - 12 - pr.box.w, y: b.y},
        {x: b.x + b.w + 12, y: b.y + b.h - pr.box.h}, {x: b.x - 12 - pr.box.w, y: b.y + b.h - pr.box.h},
        {x: b.x + b.w - pr.box.w * 0.7, y: b.y + b.h + 12}, {x: b.x - pr.box.w * 0.3, y: b.y + b.h + 12},
        ...around(b, pr.box.w, pr.box.h, 60),
      ];
      // among the free candidates, the one standing clearest of every OTHER component (so a
      // tag never reads as belonging to a neighbour); otherwise the one that covers least
      // (other elements' captions count too: a status word right beside a neighbour's name reads
      // as that neighbour's status)
      const others = [...Object.keys(boxes).filter(k => k !== id).map(restOf),
        ...Object.entries(caps).filter(([k, c]) => c && k !== id).map(([, c]) => c.box)];
      const free =cands.map((c, n) => ({c, n, bx: {x: c.x, y: c.y, w: pr.box.w, h: pr.box.h}})).filter(x => !blockedRest(x.bx));
      // it stays on the stage (a tag hanging below the offices loses points by its overhang) and it
      // must stand clearly closer to its own element than to any other (else it names the neighbour)
      const pick = free.length
        ? free.map(x => {
          const near = Math.min(...others.map(q => gapTo(x.bx, q)));
          const ambiguous = ambiguousFor(id, x.bx);
          return {c: x.c, near, ambiguous, score: Math.min(90, near) - x.n * 2 - Math.max(0, x.bx.y + x.bx.h - stageBottom) - (ambiguous ? 400 : 0)};
        }).sort((x, y) => y.score - x.score)[0]
        : null;
      const spot = pick ? pick.c : cands.map(c => ({c, a: overlapArea({x: c.x, y: c.y, w: pr.box.w, h: pr.box.h})})).sort((x, y) => x.a - y.a)[0].c;
      trialCost += pick ? Math.max(0, 40 - pick.near) * 30 + (pick.ambiguous ? 2000 : 0) : 1e5;
      const tg = statusTag(ctx, text, {x: spot.x, y: spot.y, size: 26, maxWidth: 300, name, color, opacity: 0});
      placed.push(tg.box);
      return tg;
    };
    // captions and tags for one caption placement order (the order decides who gets a contested
    // spot, e.g. the gap between the record file and the card in portrait)
    const placeLabels = order => {
      placed.length = 0;
      trialCost = 0;
      const byId = Object.fromEntries(order.map(id => [id, capOf(id)]));
      caps = Object.fromEntries(IDS.map(id => [id, byId[id]]));
      const tg = {
        inTray: tagOf('tag-in', t.delivered, 'inTray', th.accent2),
        card: tagOf('tag-card', ctx.t.signed, 'acknowledgment', th.accent4),
        folder: tagOf('tag-folder', t.filed, 'folder', th.accent4),
      };
      return {caps, tags: tg, cost: trialCost, snapshot: [...placed]};
    };
    // the natural order first; a shape may list other orders to try (the cheapest layout wins, the
    // natural order on a tie)
    const orders = [IDS, ...(Pl.capOrders || []).map(first => [...first, ...IDS.filter(id => !first.includes(id))])];
    const chosen = orders.map(placeLabels).reduce((a, b) => (b.cost < a.cost ? b : a));
    placed.length = 0;
    placed.push(...chosen.snapshot);
    caps = chosen.caps;
    const tags = chosen.tags;
    // for the semantic record: the smallest gap between captions of different elements and the
    // number of caption pairs that line up closely enough to read as one label
    const capList = Object.values(caps).filter(Boolean).map(c => c.box);
    let captionGap = null, captionsLinedUp = 0;
    capList.forEach((a, i) => capList.slice(i + 1).forEach(q => {
      const gp = gapTo(a, q);
      captionGap = captionGap === null ? gp : Math.min(captionGap, gp);
      if (linesUpWith(a, q)) captionsLinedUp++;
    }));

    // ---- relation labels beside their own connector (never on a line, a component, a caption or a
    // tag): searched along the middle of the connector on both sides, as close to the line as the
    // free space allows; a short leader joins the label to its line when it cannot sit right next to it
    const graph = probe;
    const route = graph.route(p.traversalOrder);
    // every connector must start and end on the edge of its own element (not in empty space)
    const onEdge = (e, q) => {
      if (e.circle) {
        const d = Math.hypot(q.x - e.circle.x, q.y - e.circle.y);
        return d >= e.circle.r - 1 && d <= e.circle.r + 18;
      }
      const b = e.box;
      const inside = (m) => q.x >= b.x - m && q.x <= b.x + b.w + m && q.y >= b.y - m && q.y <= b.y + b.h + m;
      return inside(18) && !inside(-1);
    };
    const landed = graph.conns.map(x => onEdge(elements[x.rel.from], x.c.from) && onEdge(elements[x.rel.to], x.c.to));
    // a relation label also keeps clear of the captions, tags and other relation labels (right
    // beside an element's caption it would read as part of it: 'kept by' + 'Sender's notice file')
    const REL_GAP = 20;
    const capBoxes = Object.values(caps).filter(Boolean).map(c => c.box);
    const relLinesUp = (bx, q) => {
      const xOver = Math.min(bx.x + bx.w, q.x + q.w) - Math.max(bx.x, q.x);
      const yOver = Math.min(bx.y + bx.h, q.y + q.h) - Math.max(bx.y, q.y);
      const gp = gapTo(bx, q);
      return (xOver > 0 && gp < 48) || (yOver > 0 && gp < 32);
    };
    const relLabels = graph.conns.map((x, i) => {
      if (!showText) return null;
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const color = kindColor(ctx, x.rel.kind);
      const size0 = graphOpts.chipSize;
      let best = null;
      // full width first; crowded layouts also try narrower, taller chips that fit a gutter
      // a smaller / narrower chip right beside its line beats a full-size one on a long leader
      const variants = [[size0, 2, 1], [size0 * 0.9, 2, 1], [size0 * 0.9, 3, 0.7], [size0 * 0.82, 3, 1], [size0 * 0.82, 3, 0.62]];
      for (const [vi, [size, lines, wk]] of variants.entries()) {
        const mk = (cx, cy) => chip(ctx, text, {x: cx, y: cy, anchor: 'middle', maxWidth: F.chipMax * wk, size, maxLines: lines, fill: th.card, stroke: color, name: `rel-l${i}`, weight: 600});
        const pr = mk(0, 0);
        if (pr.fit.truncated) continue;
        const bw = pr.box.w, bh = pr.box.h;
        for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const q = x.c.at(tt);
          const a = x.c.at(Math.max(0, tt - 0.03)), b2 = x.c.at(Math.min(1, tt + 0.03));
          const len = Math.hypot(b2.x - a.x, b2.y - a.y) || 1;
          const nx = -(b2.y - a.y) / len, ny = (b2.x - a.x) / len;
          const base = Math.abs(nx) * bw / 2 + Math.abs(ny) * bh / 2 + 14;
          for (let d = base; d <= base + 340; d += 12) {
            for (const sg of [1, -1]) {
              const cx = q.x + nx * d * sg, cy = q.y + ny * d * sg;
              const box = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
              // the dotted leader (line point → nearest label edge) must not cross another label
              const nb = {x: Math.max(box.x, Math.min(q.x, box.x + box.w)), y: Math.max(box.y, Math.min(q.y, box.y + box.h))};
              const lg = Math.hypot(nb.x - q.x, nb.y - q.y);
              let cross = 0;
              if (lg > 22) {
                for (let k = 1; k < 8; k++) {
                  const px = q.x + (nb.x - q.x) * (k / 8), py = q.y + (nb.y - q.y) * (k / 8);
                  if (placed.some(o => px > o.x && px < o.x + o.w && py > o.y && py < o.y + o.h)) cross++;
                }
              }
              // and it stays on the stage (above the legend), not hanging below the offices
              const below = Math.max(0, box.y + box.h - stageBottom) * bw;
              const area = overlapArea(box, REL_GAP) + cross * 4000 + below;
              // lined up with an element's caption (stacked right above / below it, or run on beside
              // it) the two would read as one label, so a spot a little further out is preferred
              const stacked = capBoxes.some(q => relLinesUp(box, q)) ? 160 : 0;
              const score = area * 10 + (d - base) + Math.abs(tt - 0.5) * 240 + vi * 36 + stacked;
              if (!best || score < best.score) best = {score, area, mk, cx, cy, q, box, far: d - base};
            }
          }
        }
        if (best && best.area === 0 && best.far <= 96) break;
      }
      const lab = best.mk(best.cx, best.cy - best.box.h / 2);
      placed.push(lab.box);
      // leader from the line to the nearest point of the label, only when the gap is visible
      const nb = {x: Math.max(lab.box.x, Math.min(best.q.x, lab.box.x + lab.box.w)), y: Math.max(lab.box.y, Math.min(best.q.y, lab.box.y + lab.box.h))};
      const gap = Math.hypot(nb.x - best.q.x, nb.y - best.q.y);
      const leader = gap > 22 ? h('line', {x1: r(best.q.x), y1: r(best.q.y), x2: r(nb.x), y2: r(nb.y), stroke: color, 'stroke-width': 2.2, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null;
      return {lab, node: g({name: `rel-lg${i}`, opacity: 0}, leader, lab.node)};
    });
    const relLabelsNode = g({name: 'rel-labels'}, relLabels.filter(Boolean).map(x => x.node));
    // a relation label never hides a line, a component, a caption or a tag
    const others = (i) => placed.filter(q => q !== (relLabels[i] && relLabels[i].lab.box));
    const labelsClear = relLabels.map((x, i) => !x || ![...fixed, ...lineBoxes, ...others(i)].some(q => hits(x.lab.box, q, 0)));
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // ---- the two offices: tinted zones either side of the divider (the wall)
    const dv = Pl.div;
    const legendTop = stageBottom;
    const zoneA = dv.o === 'v' ? {x: 12, y: 12, w: dv.at - 22, h: legendTop - 12} : {x: 12, y: 12, w: S.w - 24, h: dv.at - 22};
    const zoneB = dv.o === 'v' ? {x: dv.at + 10, y: 12, w: S.w - dv.at - 22, h: legendTop - 12} : {x: 12, y: dv.at + 10, w: S.w - 24, h: legendTop - dv.at - 10};
    const zone = (z, fill) => h('path', {d: roundRectPath(z.x, z.y, z.w, z.h, 34), fill, opacity: th.dark ? 0.16 : 0.3});
    const divider = g(null,
      zone(zoneA, shade(th.woodTop, 0.25)), zone(zoneB, '#b9c6c8'),
      dv.o === 'v'
        ? h('line', {x1: dv.at, x2: dv.at, y1: 24, y2: legendTop, stroke: th.fgSoft, 'stroke-width': 4, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round', opacity: 0.75})
        : h('line', {y1: dv.at, y2: dv.at, x1: 24, x2: S.w - 24, stroke: th.fgSoft, 'stroke-width': 4, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round', opacity: 0.75}));

    // tools: pen and date stamp resting beside the card (recipient side)
    const penP = pen(ctx, {name: 'm-pen', length: 170, body: th.accent2});
    const stampN = stampTool(ctx, {name: 'm-stamp', size: 74, color: th.accent});

    // captions and relation labels a travelling copy may pass under (they thin out while it does)
    const passable = [
      ...Object.entries(caps).filter(([, c]) => c).map(([id, c]) => ({name: `lab-${id}`, box: c.box})),
      ...relLabels.map((x, i) => (x ? {name: `rel-lg${i}`, box: x.lab.box} : null)).filter(Boolean),
    ];
    return {captionGap, captionsLinedUp, landed, labelsClear, relLabelsNode, passable, S, s, ox, oy, Pl, K, at, boxes, sender, recipient, outTray, inTray, env, inEnv, doc, redact, card, folderCopy, folder, caps, graph, route, visitT, divider, penP, stampN, penRest, stampRest, tags, legend: legend && legend.node,
      centers: Object.fromEntries(IDS.map(id => [id, at(id)]))};
  },
  build(ctx, L) {
    const K = L.K;
    const at = L.at;
    const place = (id, k, kids) => g({name: `el-${id}`, transform: T(at(id).x, at(id).y)}, g({name: `el-${id}-body`}, g({transform: `scale(${k})`}, kids)));
    const docNode = g({transform: T(-150, -195)}, L.doc.node, L.redact);
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.divider,
      L.graph.node,
      place('outTray', K.tray, L.outTray),
      place('inTray', K.tray, L.inTray),
      place('folder', K.folder, L.folder),
      L.sender.node, L.recipient.node,
      // crossing objects: notice (under the envelope), envelope, card
      g({name: 'el-document'}, g({name: 'el-document-body'}, g({transform: `scale(${K.doc})`}, docNode))),
      g({name: 'el-envelope'}, g({name: 'el-envelope-body'}, L.env.node)),
      g({name: 'el-acknowledgment'}, g({name: 'el-acknowledgment-body'}, L.card.node)),
      L.penP.node, L.stampN,
      // copies that travel along their connector with the tracer: the delivered envelope into
      // the IN tray, the signed card into the sender's file (nothing pops in on its own)
      g({name: 'in-env', opacity: 0}, L.inEnv.node),
      g({name: 'folder-copy', opacity: 0}, L.folderCopy.node),
      // the tracer passes under captions and relation labels, never over their text
      L.graph.tracerNode('tracer'),
      Object.values(L.caps).filter(Boolean).map(c => c.node),
      L.relLabelsNode,
      Object.values(L.tags).filter(Boolean).map(x => x.node),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const K = L.K;
    const reduced = ctx.reduced;
    const c = L.centers;
    // ---- 1) separate: envelope lifts out of the OUT tray; notice slides out; card unclips
    const appear = seg(u, 0, 0.08);
    for (const id of ['sender', 'recipient', 'outTray', 'inTray', 'folder']) nodes[`el-${id}`] = {opacity: r(appear, 3)};
    // captions of the fixed components appear with them; those of the crossing objects
    // only once each object has reached its own place
    const capIn = seg(u, 0.15, 0.2);
    for (const [id, cap] of Object.entries(L.caps)) {
      if (cap) nodes[`lab-${id}`] = {opacity: r(['envelope', 'document', 'acknowledgment'].includes(id) ? capIn : appear, 3)};
    }
    const lift = ease.inOutSine(seg(u, 0.02, 0.1));
    const apart = ease.inOutSine(seg(u, 0.08, 0.17));
    const envStart = {x: c.outTray.x, y: c.outTray.y, k: K.tray * 1.0};
    const envPose = {x: lerp(envStart.x, c.envelope.x, lift), y: lerp(envStart.y, c.envelope.y, lift), k: lerp(envStart.k, K.env, lift)};
    nodes['el-envelope'] = {transform: T(envPose.x, envPose.y, 0, envPose.k)};
    const docFrom = {x: envPose.x - 40 * envPose.k, y: envPose.y};
    const docPos = {x: lerp(docFrom.x, c.document.x, apart), y: lerp(docFrom.y, c.document.y, apart)};
    nodes['el-document'] = {transform: T(docPos.x, docPos.y, 0, lerp(0.55, 1, apart)), opacity: r(clamp(apart * 4), 3)};
    const cardOn = atPose({x: envPose.x, y: envPose.y, rot: 0, k: envPose.k}, {x: 88, y: 30});
    const cardPos = {x: lerp(cardOn.x, c.acknowledgment.x, apart), y: lerp(cardOn.y, c.acknowledgment.y, apart), k: lerp(envPose.k, K.card, apart), rot: lerp(3, 0, apart)};
    nodes['el-acknowledgment'] = {transform: T(cardPos.x, cardPos.y, cardPos.rot, cardPos.k)};

    // ---- 2) relations drawn one by one
    const n = p.relationships.length;
    const drawn = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / n, 0.18 + ((i + 1) * 0.25) / n));
    const graphNodes = L.graph.frame(drawn);
    // a relation's end dot fades in with its line instead of showing on the first frame of the
    // draw (when the stroke is still a stub hidden under the dot, the dot would sit there alone)
    p.relationships.forEach((_, i) => {
      const k = `rel-c${i}-dotA`;
      if (graphNodes[k]) graphNodes[k] = {opacity: r(clamp((drawn(i) - 0.03) / 0.12), 3)};
    });
    Object.assign(nodes, graphNodes);

    // ---- 3) tracer and focus
    // the tracer eases to a stop on the acknowledgment card, dwells while the card is
    // date-stamped, then carries on (u ↔ route fraction, both ways)
    const {T0, T1, DWELL} = TRACE;
    const dw = L.visitT.acknowledgment !== undefined && L.visitT.acknowledgment > 0 && L.visitT.acknowledgment < 1 ? L.visitT.acknowledgment : undefined;
    const uA = dw === undefined ? T1 : T0 + (T1 - T0 - DWELL) * dw;
    const ttAt = x => {
      if (dw === undefined) return ease.inOutSine(seg(x, T0, T1));
      if (x <= uA) return dw * ease.inOutSine(seg(x, T0, uA));
      if (x <= uA + DWELL) return dw;
      return dw + (1 - dw) * ease.inOutSine(seg(x, uA + DWELL, T1));
    };
    const inv = (v, a, b) => a + (b - a) * Math.acos(clamp(1 - 2 * v, -1, 1)) / Math.PI;
    const uOf = v => (dw === undefined ? inv(v, T0, T1) : v <= dw ? inv(v / dw, T0, uA) : inv((v - dw) / (1 - dw), uA + DWELL, T1));
    const tt = ttAt(u);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < T1 + 0.03;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    const kOf = id => 1 + (reduced ? (id === p.focusElement ? 0.1 : 0.035) : (id === p.focusElement ? 0.2 : 0.07)) * ease.inOutSine(pulse(id));
    for (const id of IDS) nodes[`el-${id}-body`] = {transform: scaleAbout(0, 0, kOf(id))};
    // state changes, placed where the tracer is (after the trace they stay)
    const reached = id => L.visitT[id] !== undefined && (u >= T1 || (tracerOn && tt >= L.visitT[id]));
    const delivered = reached('inTray');
    // a copy travels along the connector (or the tracer's hop) while the tracer runs from
    // `fromId` to `toId`; progress 0 → 1 is tied to the tracer, so it lands with it
    const travel = (fromId, toId) => {
      const vt = L.visitT[toId];
      if (vt === undefined) return {pr: 0};
      const vf = L.visitT[fromId];
      const t0 = vf !== undefined && vf < vt ? vf : Math.max(0, vt - 0.08);
      const pr = u < T0 ? 0 : u >= T1 ? 1 : clamp((tt - t0) / Math.max(1e-6, vt - t0));
      const conn = L.graph.conns.find(x => (x.rel.from === fromId && x.rel.to === toId) || (x.rel.from === toId && x.rel.to === fromId));
      let bow = {x: 0, y: 0};
      if (conn) {
        const fw = conn.rel.from === fromId;
        const q = conn.c.at(fw ? pr : 1 - pr);
        bow = {x: q.x - lerp(conn.c.from.x, conn.c.to.x, fw ? pr : 1 - pr), y: q.y - lerp(conn.c.from.y, conn.c.to.y, fw ? pr : 1 - pr)};
      }
      return {pr, bow};
    };
    const mv = (a, b, t, bow) => ({x: lerp(a.x, b.x, t) + bow.x, y: lerp(a.y, b.y, t) + bow.y, rot: lerp(a.rot, b.rot, t), k: lerp(a.k, b.k, t)});
    const tv1 = travel('envelope', 'inTray');
    let envCopy = null;
    if (tv1.pr > 0) {
      envCopy = mv({x: c.envelope.x, y: c.envelope.y, rot: 0, k: K.env * kOf('envelope')}, {x: c.inTray.x, y: c.inTray.y, rot: 2, k: K.tray * kOf('inTray')}, tv1.pr, tv1.bow);
      nodes['in-env'] = {transform: T(envCopy.x, envCopy.y, envCopy.rot, envCopy.k), opacity: r(clamp(tv1.pr * 6), 3)};
    } else nodes['in-env'] = {transform: 'translate(0 0)', opacity: 0}; // neutral (as in build()): the DOM never depends on seek order
    // the recipient's pen signs while the tracer runs recipient → acknowledgment; the date
    // stamp marks the card while the tracer dwells on it, so the card leaves signed and
    // stamped (time windows with a minimum length: the tools never jump)
    const vr = L.visitT.recipient, va = L.visitT.acknowledgment;
    let penGo = 0, sign = 0, stampP = 0;
    if (va !== undefined) {
      const a0 = vr !== undefined && vr < va ? vr : Math.max(0, va - 0.1);
      const uE = uOf(va);
      const uS = Math.min(uOf(a0), uE - 0.03);
      penGo = seg(u, uS - 0.05, uS);
      sign = seg(u, uS, uE);
      stampP = seg(u, uE - 0.005, uE + 0.07);
    }
    const signP = ease.inOutSine(sign);
    Object.assign(nodes, L.card.sig.frame(signP));
    const cardPose = {x: cardPos.x, y: cardPos.y, rot: 0, k: K.card};
    const cardW = local => atPose(cardPose, local);
    const rest = {x: L.penRest.x, y: L.penRest.y};
    // the pen returns to its rest while the stamp works (a longer trip in landscape, so unhurried)
    const penBack = seg(stampP, 0, 0.6);
    let tip;
    if (penGo < 1) tip = lerpP(rest, cardW(L.card.sig.tipAt(0)), ease.inOutSine(penGo));
    else if (sign < 1) tip = cardW(L.card.sig.tipAt(signP));
    else tip = lerpP(cardW(L.card.sig.tipAt(1)), rest, ease.inOutSine(penBack));
    nodes['m-pen'] = {transform: T(tip.x, tip.y, L.penRest.a)};
    const spot = cardW(L.card.dateSpot);
    const go = seg(stampP, 0.1, 0.45), down = seg(stampP, 0.45, 0.58), up = seg(stampP, 0.58, 1);
    const sPos = up > 0 ? lerpP(spot, L.stampRest, ease.inOutSine(up)) : lerpP(L.stampRest, spot, ease.inOutSine(go));
    const press = down > 0 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
    nodes['m-stamp'] = {transform: T(sPos.x, sPos.y, 0, 1 - 0.07 * press)};
    nodes['m-stamp-shadow'] = {opacity: r(1 - press * 0.85, 3)};
    const stamped = stampP >= 0.52;
    nodes['m-card-impr'] = {opacity: stamped ? 0.92 : 0};
    const filed = reached('folder');
    // the copy filed in the sender's file carries the card's signature and date impression
    const tv2 = travel('acknowledgment', 'folder');
    let cardCopy = null;
    if (tv2.pr > 0) {
      const kf = kOf('folder');
      cardCopy = mv({x: cardPos.x, y: cardPos.y, rot: 0, k: K.card * kOf('acknowledgment')},
        {x: c.folder.x + 18 * K.folder * kf, y: c.folder.y + 16 * K.folder * kf, rot: -3, k: K.card * 0.62 * kf}, tv2.pr, tv2.bow);
      nodes['folder-copy'] = {transform: T(cardCopy.x, cardCopy.y, cardCopy.rot, cardCopy.k), opacity: r(clamp(tv2.pr * 6), 3)};
    } else nodes['folder-copy'] = {transform: 'translate(0 0)', opacity: 0}; // neutral (as in build()): the DOM never depends on seek order
    Object.assign(nodes, L.folderCopy.sig.frame(signP));
    nodes['m-fcopy-impr'] = {opacity: stamped ? 0.92 : 0};
    // a copy in transit (or the pen / stamp on its way to the card and back) passes under
    // captions and relation labels: those it covers thin out smoothly while it is under them
    // (never at rest: the weight is 0 at both ends of each trip)
    const moving = pr => (pr > 0 && pr < 1 ? clamp(Math.min(pr, 1 - pr) * 12) : 0);
    const passing = [];
    const around0 = (pose, w, hh) => ({x: pose.x - (w * pose.k) / 2, y: pose.y - (hh * pose.k) / 2, w: w * pose.k, h: hh * pose.k});
    if (envCopy) passing.push({cb: around0(envCopy, ENV.w, ENV.h), wgt: moving(tv1.pr)});
    if (cardCopy) passing.push({cb: around0(cardCopy, CARD.w, CARD.h), wgt: moving(tv2.pr)});
    // pen: tip at `tip`, barrel up-right along the rest angle; stamp block around its centre
    const pa = (L.penRest.a * Math.PI) / 180, pl = 170;
    const pe = {x: tip.x + Math.cos(pa) * pl, y: tip.y + Math.sin(pa) * pl};
    passing.push({cb: {x: Math.min(tip.x, pe.x) - 8, y: Math.min(tip.y, pe.y) - 8, w: Math.abs(pe.x - tip.x) + 16, h: Math.abs(pe.y - tip.y) + 16}, wgt: Math.max(moving(penGo), moving(penBack))});
    passing.push({cb: {x: sPos.x - 41, y: sPos.y - 31, w: 82, h: 62}, wgt: Math.max(moving(go), moving(up))});
    let thinned = 0;
    for (const m of passing) {
      const wgt = m.wgt;
      if (wgt <= 0) continue;
      const cb = m.cb;
      for (const lb of L.passable) {
        const b = lb.box;
        const depth = Math.min(cb.x + cb.w - b.x, b.x + b.w - cb.x, cb.y + cb.h - b.y, b.y + b.h - cb.y);
        if (depth <= 0 || !nodes[lb.name]) continue;
        const f = 1 - 0.75 * wgt * clamp(depth / 36);
        nodes[lb.name] = {...nodes[lb.name], opacity: r((nodes[lb.name].opacity ?? 1) * f, 3)};
        thinned++;
      }
    }
    // ---- 4) gather: descriptive states
    const tagP = seg(u, 0.8, 0.88);
    if (L.tags.inTray) nodes['tag-in'] = {opacity: r(tagP * (delivered ? 1 : 0), 3)};
    if (L.tags.card) nodes['tag-card'] = {opacity: r(tagP * (sign >= 1 ? 1 : 0), 3)};
    if (L.tags.folder) nodes['tag-folder'] = {opacity: r(tagP * (filed ? 1 : 0), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        tracer: P2(tpos),
        tracerVisible: tracerOn,
        envelope: P2(envPose),
        card: P2(cardPos),
        document: P2(docPos),
        penTip: P2(tip),
        penContact: penGo >= 1 && sign < 1 ? P2(tip) : undefined,
        stampTool: P2(sPos),
        signature: r(signP, 3),
        strokePoint: P2(cardW(L.card.sig.tipAt(signP))),
        penOnCard: penGo >= 1 && sign < 1,
        stamped,
        delivered,
        filed,
        envelopeCopy: envCopy ? P2(envCopy) : undefined,
        cardCopy: cardCopy ? P2(cardCopy) : undefined,
        labelsThinned: thinned,
        relationsDrawn: p.relationships.map((_, i) => r(drawn(i), 3)),
        relationKinds: p.relationships.map(x => x.kind),
        connectorsLanded: L.landed,
        labelsClear: L.labelsClear,
        captionGap: L.captionGap === null ? null : r(L.captionGap),
        captionsLinedUp: L.captionsLinedUp,
        visitOrder: L.route.visits.map(v => v.id),
      },
    };
  },
};

function lerpP(a, b, k) {
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
}

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 28;
  const gap = 50;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': SANS, fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend'}, parts), box: {x: at.x - total / 2 - 8, y: at.y - size * 0.7, w: total + 16, h: size * 1.4}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-09-mechanism',
    title: 'Documented notice — the delivery-and-record loop',
    titleEs: 'Notificación documentada — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Notificación documentada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded loop across a divider standing for the wall between two offices: the envelope lifts out of the OUT tray, the notice slides out of it and the acknowledgment card unclips. Edge-anchored connectors styled by kind link sender, trays, envelope, recipient, card and record folder; a tracer follows the supplied order while the IN tray receives the envelope, the card is signed and date-stamped and a copy is filed.',
    tags: ['notice', 'mechanism', 'loop', 'relations', 'tracer', 'envelope', 'acknowledgment', 'record'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/notificacion-documentada.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: NOTICE_STRINGS,
  scene,
});
