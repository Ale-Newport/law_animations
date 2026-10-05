/**
 * LAW-0172 — Declaración de testigo · inspect
 *
 * Storyboard (the story's end state is the context: the witness holding the
 * written statement, the clerk behind the table, the labelled fact cards lined
 * up in the rail beside the witness):
 *  0.00–0.20  build: the context settles (a slight pull-back) and a caption
 *             names it.
 *  0.20–0.45  isolate: a lens rises from one card's source passage — the
 *             stated source tag with its glyph and underline — and enlarges a
 *             real copy of it (same coordinates as the card) in free space;
 *             the rest of the context dims.
 *  0.45–0.75  substitute ONE datum inside the lens: the old value is struck
 *             through, turns away and leaves the lens as a struck "was: …"
 *             chip parked beside the window (still readable); then the
 *             supplied new value turns in, and only the dependent state follows (the glyph, the source-coloured
 *             underline and, for information received, the "from: …" line).
 *             Then (0.665–0.72, lens still open) the context card itself
 *             turns over to the new value and the "was: …" chip travels to its
 *             dock under it — the same state the lens shows.
 *  0.72–1.00  return: the opaque lens window slides back and closes onto an
 *             identical card (never a value drawn over a different one); a
 *             neutral changed-datum marker (Δ) above the card and a label that
 *             repeats the Δ mark the change. The lens never covers the witness.
 *             No validity, credibility, weight or outcome is inferred.
 * Seeking back to any earlier time restores the old datum exactly.
 * @module animations/roles/LAW-0172
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, int, list, obj, oneOf, party} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {
  witnessFields, WITNESS_DEFAULTS, WITNESS_STRINGS, captionOf, tagOf, fitCards, factCard, cardContent,
  stageGeometry, witnessStage, recountScript, sourceGlyph, sourceColor, CARD_W_Z, fitWords, wchip, keyLayout,
} from './kits/declaracion-de-testigo.js';

const ID = 'LAW-0172';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  settle: [0, 0.14], caption: [0.04, 0.12], captionOut: [0.2, 0.24], captionIn: [0.8, 0.85],
  open: [0.22, 0.36], strike: [0.46, 0.52], oldOut: [0.535, 0.555], lift: [0.555, 0.6], newIn: [0.6, 0.63],
  ctxOldOut: [0.665, 0.69], ctxNewIn: [0.69, 0.715], ctxDock: [0.69, 0.72], close: [0.725, 0.785], marker: [0.8, 0.84], label: [0.81, 0.85],
};

const STRINGS = {
  en: {...WITNESS_STRINGS.en, was: 'was'},
  es: {...WITNESS_STRINGS.es, was: 'antes'},
};

const TARGETS = ['source', 'wording'];
const sceneSchema = {
  ...witnessFields,
  actors: list('The witness and the clerk (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (never a finding about credibility or reliability)', {
    witness: str('Role caption for the person giving the statement', 40),
    clerk: str('Role caption for the person writing the cards', 40),
  }),
  objectLabels: obj('Labels printed on props', {document: str('Title printed on the statement sheet the witness holds', 40)}),
  focusCard: int('Which card (0-based, in the stated order) is inspected', 0, 2),
  focusTarget: oneOf('Detail that is enlarged and substituted: source = the stated source tag of the card; wording = the card’s written statement', TARGETS),
  beforeValue: str('Value shown before the substitution (source: the tag label; wording: the statement on the card)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum)', 90),
  afterVia: str('Source substitution to information received: from whom, as stated (empty = not stated)', 40),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens', 1.2, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...WITNESS_DEFAULTS,
  actors: WITNESS_DEFAULTS.actors.slice(0, 2),
  roles: {witness: WITNESS_DEFAULTS.roles.witness, clerk: WITNESS_DEFAULTS.roles.clerk},
  objectLabels: {document: 'Witness statement'},
  focusCard: 1,
  focusTarget: 'source',
  beforeValue: 'direct observation (as stated)',
  afterValue: 'information received (as stated)',
  afterVia: 'the caretaker',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'The statement cards as lined up', marker: 'Changed: the stated source of one card'},
};

function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}
const inside = (a, b) => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5;
const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 960], portrait: [1000, 1455]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const mode = ctx.view.shape === 'portrait' ? 'stack' : 'row';
    const px = pxPerUnit(ctx);
    const F0 = 22.5 / px, Fmin = 16.3 / px;
    const facts = p.props.facts;
    const n = facts.length;
    const fi = Math.min(p.focusCard, n - 1);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const isSource = p.focusTarget === 'source';
    const fBefore = facts[fi];
    // before / after state of the inspected card (source: the tag and its dependents; wording: the text)
    const srcBefore = fBefore.source;
    const srcAfter = isSource ? (srcBefore === 'observed' ? 'received' : 'observed') : srcBefore;
    const viaOf = (src, via) => (src === 'received' && via ? `${ctx.t.from}: ${via}` : '');
    const before = {text: isSource ? fBefore.text : p.beforeValue, tag: isSource ? p.beforeValue : tagOf(p, srcBefore), fromText: isSource ? viaOf(srcBefore, fBefore.via) : viaOf(srcBefore, fBefore.via)};
    const after = {text: isSource ? fBefore.text : p.afterValue, tag: isSource ? p.afterValue : tagOf(p, srcBefore), fromText: isSource ? viaOf(srcAfter, p.afterVia) : viaOf(srcBefore, fBefore.via)};
    const items = facts.map((f, i) => (i === fi ? before : {text: f.text, tag: tagOf(p, f.source), fromText: viaOf(f.source, f.via)}));
    // the marker label uses the column above the witness; the context caption goes on the
    // table front (between the key and the plate) when it fits there
    const noteTexts = [p.contextLabels.marker].filter(Boolean);

    let best = null;
    // first pass: the lens must be able to show the changed tag with its whole "from" block ≥ 1.5× in the
    // free space under the row (wider, lower cards if needed); second pass without that demand
    search:
    for (const pass of [0, 1])
    for (let z = mode === 'row' ? 1.6 : 1.2; z >= 0.7 - 1e-9; z -= 0.03)
    for (const wk of pass === 0 && mode === 'row' ? [1, 1.15, 1.3, 1.5, 1.7] : [1]) {
      const cardW = CARD_W_Z * wk * z;
      // one height for every card, including the inspected card's after-state
      const cf = fitCards(ctx, {w: cardW, items: [...items, after], size: F0, minSize: Fmin});
      const F = cf.size;
      const kEst = mode === 'row' ? 1.4 * z : 1.9 * z;
      let docW = 88 * kEst;
      let docFit = null;
      if (showAll) {
        for (let tries = 0; tries < 8; tries++) {
          docFit = fitWords(p.objectLabels.document, {maxWidth: docW * 0.8, size: F, minSize: F, maxLines: 4, weight: 800});
          const wide = Math.max(0, ...String(p.objectLabels.document).split(/\s+/).map(w => ctx.measure(w, F, 800, 'sans')));
          if (!docFit.truncated && wide <= docW * 0.8) break;
          docW *= 1.1;
        }
      }
      const doc = {w: docW, h: Math.max(docW * 1.3, docFit ? docFit.height + docW * 0.62 : 0)};
      const chipH = showKey ? F * 1.18 * 2 + F * 0.76 + 4 : 8;
      const keyProbe = showKey ? keyLayout(ctx, p, {w: D.w * 0.5, size: F}) : null;
      const geo = bubbleH => stageGeometry({mode, W: D.w, H: D.h, z, n, cardW, cardH: cf.H, doc, bubbleH, chipH, keyH: keyProbe ? keyProbe.h : 0});
      let G = geo(F * 3);
      let need = F * 2;
      if (showKey && G.bubble.w > 60) {
        // does the context caption fit on the table front between the key and the plate?
        let capInCol = mode !== 'row';
        if (mode === 'row' && p.contextLabels.context) {
          const pw = (G.tableR - 45 * z) - (G.tableL + 45 * z);
          const plateW = wchip(ctx, captionOf(p, 'clerk'), {x: 0, y: 0, maxWidth: Math.min(440 * z, pw * 0.42), size: F, minSize: F, maxLines: 3}).box.w;
          const keyW = keyLayout(ctx, p, {w: pw - plateW - 20, size: F}).w;
          const mid = pw - plateW - keyW - 60;
          const pr = mid > 140 ? wchip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: mid, size: F, minSize: F, maxLines: 3}) : null;
          capInCol = !pr || pr.fit.truncated || pr.box.h > (G.panelBottom - G.panelTop) - 28 * z;
          if (capInCol && showAll) {
            // else on the floor line, right of the witness's name chip
            const cwW = wchip(ctx, captionOf(p, 'witness'), {x: 0, y: 0, maxWidth: Math.max(300, G.rowL - 24, D.w * 0.45), size: F, minSize: F, maxLines: 2}).box.w;
            const room = G.tableR - (Math.max(16, G.hip.x + 16 * G.kW - cwW / 2) + cwW + 30);
            const fl = room > 160 ? wchip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: room, size: F, minSize: F, maxLines: 2}) : null;
            if (fl && !fl.fit.truncated && fl.box.h <= chipH) capInCol = false;
          }
        }
        const texts = capInCol && p.contextLabels.context ? [p.contextLabels.context, ...noteTexts] : noteTexts;
        need = texts.reduce((a, t) => a + wchip(ctx, t, {x: 0, y: 0, maxWidth: G.bubble.w, size: F, minSize: F, maxLines: 5}).box.h + 16, 0);
      }
      G = geo(need);
      // the docked old value must fit on the tabletop under the card
      // the docked old value sits on the tabletop under the card (it may reach the table edge)
      const lostVia0 = isSource && srcAfter !== 'received' && srcBefore === 'received' && fBefore.via ? ` · ${ctx.t.from}: ${fBefore.via}` : '';
      const oldChip = wchip(ctx, `${ctx.t.was}: ${p.beforeValue}${lostVia0}`, {x: 0, y: 0, maxWidth: cardW * 1.3, size: F, minSize: F, maxLines: 4});
      const oldRoom = 150 * z;
      const tagFromH = c => {
        const ls = c.lines.filter(q => (isSource ? q.kind === 'tag' || q.kind === 'glyph' || q.kind === 'via' : q.kind === 'text'));
        return Math.max(...ls.map(q => q.top + q.h)) - Math.min(...ls.map(q => q.top)) + 24;
      };
      const lensRoom = mode !== 'row' || (D.h - 8) - (G.railY + 8) >= 1.62 * Math.max(tagFromH(cf.contents[fi]), tagFromH(cf.contents[n]));
      const fits = G.overflowX <= 0 && G.overflowY <= 0 && cf.ok && oldChip.box.h <= oldRoom && !oldChip.fit.truncated && (pass === 1 || lensRoom);
      const miss = Math.max(G.overflowX, G.overflowY, 0) + (cf.ok ? 0 : 1e4) + Math.max(0, oldChip.box.h - oldRoom) + (oldChip.fit.truncated ? 1e3 : 0);
      if (pass === 1 && (!best || fits || miss < best.miss)) best = {z, cf, F, G, doc, docFit, fits, miss};
      if (fits) { best = {z, cf, F, G, doc, docFit, fits, miss}; break search; }
    }
    let {cf, F, G, docFit} = best;
    if (mode === 'row' && best.fits && G.overflowY < -2) {
      G = stageGeometry({mode, W: D.w, H: D.h, z: G.z, n, cardW: G.cardW, cardH: G.cardH, doc: best.doc, bubbleH: G.bubble.h, chipH: G.chipH, top: 16 - G.overflowY / 2});
    }
    const z = G.z;
    const stage = witnessStage(ctx, {
      prefix: 'st', G, actors: p.actors, docTitle: p.objectLabels.document, docFit, bubbles: false, quotes: [],
      cards: facts.map((f, i) => ({content: cf.contents[i], source: i === fi ? srcBefore : f.source})),
    });
    const script = recountScript(stage, {plan: 'all'});
    const extras = [];
    const textBoxes = [];
    const labelBoxes = [];
    let keyBox = null;
    let chipWBox = null;

    // ---- plate, key, witness chip (as in the story's hold)
    const panel = {x: G.tableL + 45 * z, y: G.panelTop + 16 * z, x1: G.tableR - 45 * z, y1: G.panelBottom - 12 * z};
    let plate = null;
    if (showKey) {
      const capC = captionOf(p, 'clerk');
      const plateW = Math.min(440 * z, (panel.x1 - panel.x) * 0.42);
      const pr = wchip(ctx, capC, {x: 0, y: 0, anchor: 'middle', maxWidth: plateW, size: F, minSize: F, maxLines: 3});
      plate = wchip(ctx, capC, {x: Math.min(G.cx, panel.x1 - pr.box.w / 2), y: panel.y1 - pr.box.h, anchor: 'middle', maxWidth: plateW, size: F, minSize: F, maxLines: 3, fill: '#f7f1e3', name: 'chipC'});
      extras.push(plate.node);
      labelBoxes.push({name: 'chipC', box: plate.box});
      const region = mode === 'row' ? {x: panel.x, y: panel.y, w: plate.box.x - 20 - panel.x, h: panel.y1 - panel.y} : G.key;
      const key = keyLayout(ctx, p, {w: region.w, size: F});
      const ky = region.y + (mode === 'row' ? Math.max(0, (region.h - key.h) / 2) : 0);
      extras.push(key.build(region.x, ky));
      keyBox = {x: region.x, y: ky, w: key.w, h: key.h};
      labelBoxes.push({name: 'key', box: keyBox});
      const capW = captionOf(p, 'witness');
      const maxW = mode === 'row' ? Math.max(300, G.rowL - 24, D.w * 0.45) : D.w * 0.8;
      const probe = wchip(ctx, capW, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size: F, minSize: F, maxLines: 2});
      const x = Math.max(16 + probe.box.w / 2, Math.min(G.hip.x + 16 * G.kW, D.w - 16 - probe.box.w / 2));
      const cw = wchip(ctx, capW, {x, y: G.floor + 6, anchor: 'middle', maxWidth: maxW, size: F, minSize: F, maxLines: 2, name: 'chipW'});
      chipWBox = cw.box;
      extras.push(cw.node);
      labelBoxes.push({name: 'chipW', box: cw.box});
    }
    if (showAll) textBoxes.push(G.docBox);

    // ---- the inspected card: its box, its tag passage and the docked old value
    const w = G.cardW, H = G.cardH;
    const cardBox = {x: G.R.right - (n - 1 - fi) * w - w, y: G.rowTop, w, h: H};
    const otherCards = facts.map((_, i) => ({x: G.R.right - (n - 1 - i) * w - w, y: G.rowTop, w, h: H})).filter((_, i) => i !== fi);
    textBoxes.push(...otherCards);
    const cB = cf.contents[fi], cA = cf.contents[n];
    const passage = c => {
      const ls = c.lines.filter(q => (isSource ? q.kind === 'tag' || q.kind === 'glyph' || q.kind === 'via' : q.kind === 'text'));
      return {x: cardBox.x + Math.min(...ls.map(q => q.x)) - 6, y: cardBox.y + Math.min(...ls.map(q => q.top)) - 8, x1: cardBox.x + Math.max(...ls.map(q => q.x + q.w)) + 6, y1: cardBox.y + Math.max(...ls.map(q => q.top + q.h)) + 8};
    };
    const pb = passage(cB), pa = passage(cA);
    // the old value stays traceable, including an origin that the new value drops
    const lostVia = isSource && srcAfter !== 'received' && srcBefore === 'received' && fBefore.via ? ` · ${ctx.t.from}: ${fBefore.via}` : '';
    const oldLabel = `${ctx.t.was}: ${p.beforeValue}${lostVia}`;
    // centred under the card, but never over the clerk's arm (it hangs from the shoulder at cx − 60z);
    // as wide as the tabletop allows, so it stays short (a low lens source → a larger zoom)
    const armLeft = G.cx - 82 * z;
    const chipOpts = {anchor: 'middle', maxWidth: Math.max(w, Math.min(w * 2.4, Math.min(D.w - 8, armLeft) - 16 - Math.max(8, G.docBox.x + G.docBox.w + 8))), size: F, minSize: F, maxLines: 4, fill: th.paperShade, stroke: th.inkFaint, color: th.inkSoft, weight: 500};
    const probe0 = wchip(ctx, oldLabel, {...chipOpts, x: 0, y: 0});
    const chipX0 = mode === 'row' ? Math.max(8, G.docBox.x + G.docBox.w + 8) : 8;
    const chipCx = clamp(cardBox.x + w / 2, chipX0 + probe0.box.w / 2, Math.max(chipX0 + probe0.box.w / 2, Math.min(D.w - 8, armLeft) - probe0.box.w / 2));
    const oldChipAt = y => wchip(ctx, oldLabel, {...chipOpts, x: chipCx, y});
    const oldProbe = oldChipAt(0);
    const dockY = G.railY + 4 * z;
    const oldBox = {...oldProbe.box, y: dockY};
    // source region of the lens: the passage (before and after) and the underline — low, so the
    // lens can enlarge it; the old value leaves the lens as a chip and docks under the card
    const bandBottom = cardBox.y + Math.max(cB.band.y + cB.band.h, cA.band.y + cA.band.h);
    // the changed datum's row only (glyph + tag, before and after): a tighter crop when the full
    // passage cannot be enlarged at least 1.5× in the free space
    const rowOf = c => {
      const ls = c.lines.filter(q => (isSource ? q.kind === 'tag' || q.kind === 'glyph' : q.kind === 'text'));
      return {x: cardBox.x + Math.min(...ls.map(q => q.x)) - 6, y: cardBox.y + Math.min(...ls.map(q => q.top)) - 8, x1: cardBox.x + Math.max(...ls.map(q => q.x + q.w)) + 6, y1: cardBox.y + Math.max(...ls.map(q => q.top + q.h)) + 8};
    };
    const rb = rowOf(cB), ra = rowOf(cA);
    // every crop stays on the inspected card (the lens guides start on that card, never on a neighbour)
    const asBox = q => { const x0 = Math.max(q.x, cardBox.x + 1), x1 = Math.min(q.x1, cardBox.x + w - 1); return {x: x0, y: q.y, w: x1 - x0, h: q.y1 - q.y}; };
    const sources = [
      {crop: 'passage', box: asBox({x: cardBox.x - 12, y: Math.min(pb.y, pa.y) - 6, x1: cardBox.x + w + 12, y1: Math.max(pb.y1, pa.y1, bandBottom) + 10}), holds: [pb, pa]},
      {crop: 'passage-tight', box: asBox({x: Math.min(pb.x, pa.x) - 6, y: Math.min(pb.y, pa.y) - 6, x1: Math.max(pb.x1, pa.x1) + 6, y1: Math.max(pb.y1, pa.y1, bandBottom) + 8}), holds: [pb, pa]},
      // the tag and the complete "from" block (the passage without the underline band)
      {crop: 'tag+from', box: asBox({x: Math.min(pb.x, pa.x) - 4, y: Math.min(pb.y, pa.y) - 4, x1: Math.max(pb.x1, pa.x1) + 4, y1: Math.max(pb.y1, pa.y1) + 4}), holds: [pb, pa]},
      {crop: 'row', box: asBox({x: Math.min(rb.x, ra.x) - 6, y: Math.min(rb.y, ra.y) - 6, x1: Math.max(rb.x1, ra.x1) + 6, y1: Math.max(rb.y1, ra.y1) + 6}), holds: [rb, ra]},
    ];

    // ---- lens destination: the free region that gives the largest window and
    //      never half-covers a text (a text is either clear of it or fully under it)
    const regions = mode === 'row'
      ? [
        // the table front and the floor strip under it (the key, plate and name chips there fade while it is open)
        {x: G.tableL, y: G.sy + 14 * z, x1: D.w - 16, y1: D.h - 8},
        // the whole table in front of the row (tabletop and front), right of the witness's sheet
        {x: Math.max(G.tableL, G.docBox.x + G.docBox.w + 10), y: G.railY + 8, x1: D.w - 16, y1: D.h - 8},
        {x: G.tableL, y: G.sy + 14 * z, x1: G.tableR, y1: G.floor - 4},
        {x: 16, y: 16, x1: D.w - 16, y1: G.rowTop - 12},
        // right of the row, below the clerk's head and shoulders (never over a person)
        {x: G.R.right + 10, y: G.railY + 8, x1: D.w - 16, y1: D.h - 8},
      ]
      : [
        // beside the witness's head, above her sheet
        {x: G.headW.x + G.headW.r + 12, y: G.floorT + 8, x1: D.w - 16, y1: G.docBox.y - 8},
        // right of her sheet (the key there fades while the lens is open)
        {x: G.docBox.x + G.docBox.w + 12, y: G.floorT + 8, x1: D.w - 16, y1: D.h - 16},
        {x: G.bubble.x - 8, y: G.bubble.y, x1: D.w - 16, y1: G.docBox.y + G.docBox.h + 10},
      ];
    const zoomMax = p.detailGeometry.zoom;
    const kW = G.kW;
    const wx0 = G.hip.x - 70 * kW, wy0 = G.headW.y - G.headW.r - 6;
    // her body and head (the sheet she holds is a text box: fully under the lens or clear of it)
    const wx1 = mode === 'row' ? Math.max(G.docBox.x + G.docBox.w, G.hip.x + 120 * kW) : Math.max(G.headW.x + G.headW.r + 8, G.hip.x + 50 * kW);
    // head, torso and the sheet on row frames (the lens may pass over her shins)
    const witnessBox = {x: wx0, y: wy0, w: wx1 - wx0, h: (mode === 'row' ? G.seatY + 20 * kW : G.floor) - wy0};
    // the clerk's head and body above the table (chair included)
    const clerkBox = {x: G.cx - 110 * z, y: G.med.y - 150 * z, w: 220 * z, h: G.yFar - (G.med.y - 150 * z)};
    const findDest = source => {
      let dest = null, zoom = 0;
      for (const rg of regions) {
        const rw = rg.x1 - rg.x, rh = rg.y1 - rg.y;
        const k = Math.min(zoomMax, rw / source.w, rh / source.h);
        if (k <= zoom || k < 1.15) continue;
        const dw = source.w * k, dh = source.h * k;
        const prefX = p.detailGeometry.placement === 'left' ? rg.x : p.detailGeometry.placement === 'right' ? rg.x1 - dw : clamp(source.x + source.w / 2 - dw / 2, rg.x, rg.x1 - dw);
        const d = {x: prefX, y: rg.y + (rh - dh) / 2, w: dw, h: dh};
        if (overlaps(d, source, 4)) continue;
        // never cover a person: the witness (she stays in view) or the clerk's head and body
        if (overlaps(d, witnessBox, 0) || overlaps(d, clerkBox, 0)) continue;
        // never half-cover a card or the witness's sheet (labels under it fade while it is open)
        if (textBoxes.some(b => overlaps(d, b, 0) && !inside(b, d))) continue;
        dest = d;
        zoom = k;
      }
      return {dest, zoom};
    };
    // the widest crop that still enlarges ≥ 1.5× (else the one that enlarges most)
    let pick = null;
    for (const sc of sources) {
      const f = findDest(sc.box);
      if (!f.dest) continue;
      const cand = {...sc, ...f};
      if (!pick || cand.zoom > pick.zoom) pick = cand;
      if (f.zoom >= Math.min(1.5, zoomMax)) { pick = cand; break; }
    }
    const source = pick ? pick.box : sources[0].box;
    let dest = pick ? pick.dest : null, zoom = pick ? pick.zoom : 0;
    const lensCrop = pick ? pick.crop : 'passage';
    const lensHolds = pick ? pick.holds : [pb, pa];
    if (!dest) {
      // fallback: largest window over the lower half, clear of the source
      const k = Math.max(1.15, Math.min(zoomMax, (D.w - 32) / source.w, (D.h * 0.4) / source.h));
      dest = {x: D.w / 2 - source.w * k / 2, y: D.h - 16 - source.h * k, w: source.w * k, h: source.h * k};
      zoom = k;
    }
    // labels the lens window would (partly) cover fade out while it is open
    const hideUnderLens = labelBoxes.filter(q => overlaps(dest, q.box, 4)).map(q => q.name);

    // ---- lens content: a real copy of the card in the SAME coordinates
    const cardSrc = [facts[fi].source];
    // lens copies leave out any line the lens rim would cut (a line is either wholly in the window or not drawn)
    const rimSafe = c => {
      const S = source;
      const cut = ln => {
        // the rendered glyph box (ascenders/descenders reach past the layout line box)
        const b = {x: cardBox.x + ln.textX - 3, y: cardBox.y + ln.top - c.s * 0.35, w: ln.textW + 6, h: ln.h + c.s * 0.7};
        const over = b.x < S.x + S.w && b.x + b.w > S.x && b.y < S.y + S.h && b.y + b.h > S.y;
        const inside = b.x >= S.x && b.x + b.w <= S.x + S.w && b.y >= S.y && b.y + b.h <= S.y + S.h;
        return over && !inside;
      };
      // a supplied field (statement, source tag, "from" line) is wholly in the lens copy or wholly left out:
      // if the rim would cut any of its lines, all of its lines are left out
      const S2 = source;
      const inWin = ln => {
        const b = {x: cardBox.x + ln.textX - 3, y: cardBox.y + ln.top - c.s * 0.35, w: ln.textW + 6, h: ln.h + c.s * 0.7};
        return b.x >= S2.x && b.x + b.w <= S2.x + S2.w && b.y >= S2.y && b.y + b.h <= S2.y + S2.h;
      };
      const kinds = ['text', 'tag', 'via'];
      // left out: a field that would show in the window but not wholly (a line cut by the rim, or some of its
      // lines inside the window and others outside it)
      const cutKind = Object.fromEntries(kinds.map(k => {
        const ls = c.lines.filter(ln => ln.kind === k);
        const seen = ls.some(ln => cut(ln) || inWin(ln));
        return [k, seen && !ls.every(inWin)];
      }));
      const drop = {text: new Set(), tag: new Set(), via: new Set()};
      const idx = {text: 0, tag: 0, via: 0};
      const lines = c.lines.filter(ln => {
        if (!(ln.kind in idx)) return true;
        const i = idx[ln.kind]++;
        if (cutKind[ln.kind]) { drop[ln.kind].add(i); return false; }
        return true;
      });
      // fields shown in the window (wholly), for the semantic audit
      const shownFields = kinds.filter(k => !cutKind[k] && c.lines.some(ln => ln.kind === k && inWin(ln)));
      // a no-break space keeps the line's slot (an empty tspan would drop its line advance)
      const blank = (f, set) => (f && set.size ? {...f, lines: f.lines.map((t, i) => (set.has(i) ? '\u00a0' : t))} : f);
      return {content: {...c, lines, fF: blank(c.fF, drop.text), fT: blank(c.fT, drop.tag), fV: blank(c.fV, drop.via)}, dropped: drop.text.size + drop.tag.size + drop.via.size, tagCut: cutKind.tag, shownFields};
    };
    const safeB = rimSafe(cB), safeA = rimSafe(cA);
    const lzBefore = factCard(ctx, {name: 'lz-before', content: safeB.content, H, source: srcBefore, showText: showAll, still: true});
    const lzAfter = factCard(ctx, {name: 'lz-after', content: safeA.content, H, source: srcAfter, showText: showAll, still: true});
    const strikeLines = passageLines(cB, isSource).map((q, j) => h('line', {name: `lz-strike${j}`, x1: r(cardBox.x + q.x0), x2: r(cardBox.x + q.x0), y1: r(cardBox.y + q.y), y2: r(cardBox.y + q.y), stroke: th.ink, 'stroke-width': Math.max(3, F * 0.12), 'stroke-linecap': 'round', opacity: 0}));
    const strikeSpec = passageLines(cB, isSource).map(q => ({x0: cardBox.x + q.x0, x1: cardBox.x + q.x1}));
    const oldNode = (name, strike) => {
      const c = oldChipAt(dockY);
      const f = c.fit;
      // strike each line of the old value (not the "was:" word), one segment per line
      const ls = f.lines.map((ln, j) => {
        const lw = ctx.measure(ln, f.size, f.weight, 'sans');
        const x0 = c.box.cx - lw / 2;
        const y = c.box.y + (c.box.h - f.height) / 2 + j * f.lineHeight + f.size * 0.45;
        const skip = j === 0 ? ctx.measure(`${ctx.t.was}: `, f.size, f.weight, 'sans') : 0;
        return h('line', {x1: r(x0 + skip), x2: r(x0 + lw), y1: r(y), y2: r(y), stroke: th.ink, 'stroke-width': 2.2, opacity: strike ? 0.85 : 0});
      });
      if (!showAll) {
        // labels hidden: the same chip with a struck grey bar (no text)
        const b = c.box;
        return g({name, opacity: 0},
          h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: r(Math.min(12, b.h / 2)), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.5}),
          h('rect', {x: r(b.x + b.w * 0.18), y: r(b.cy - F * 0.2), width: r(b.w * 0.64), height: r(F * 0.4), rx: r(F * 0.2), fill: th.inkFaint}),
          h('line', {x1: r(b.x + b.w * 0.14), x2: r(b.x + b.w * 0.86), y1: r(b.cy), y2: r(b.cy), stroke: th.ink, 'stroke-width': 2.2, opacity: 0.85}));
      }
      return g({name, opacity: 0}, c.node, ls);
    };
    const content = g(null,
      h('rect', {x: r(source.x), y: r(source.y), width: r(source.w), height: r(source.h), fill: th.woodTop}),
      h('rect', {x: r(source.x), y: r(G.yFar), width: r(source.w), height: r(Math.max(0, source.y + source.h - G.yFar)), fill: th.woodTop}),
      g({transform: T(cardBox.x, cardBox.y)}, lzBefore.node, lzAfter.node),
      strikeLines);
    const lz = lens(ctx, {name: 'lz', source, dest, content, frame: {x: 0, y: 0, w: D.w, h: D.h}, color: th.accent2});

    // ---- context overlays for the inspected card after the return
    const cxAfter = factCard(ctx, {name: 'cx-after', content: cA, H, source: srcAfter, showText: showAll, still: true});
    const cxDock = oldNode('cx-dock', true);
    // the old value as it leaves the lens: a chip drawn above the lens layer, parked beside the
    // window, that then travels to its dock under the card (where cx-dock takes over)
    const mvDock = oldNode('mv-dock', true);
    // parked beside the lens window where it covers no context text (cards, sheet, visible chips) and not the witness
    const visibleLabels = labelBoxes.filter(q => !hideUnderLens.includes(q.name)).map(q => q.box);
    const avoid = [...facts.map((_, i) => ({x: G.R.right - (n - 1 - i) * w - w, y: G.rowTop, w, h: H})), G.docBox, ...visibleLabels, witnessBox, dest];
    let sSide = clamp(zoom * 0.8, 1, 1.6);
    const sideAt = (() => {
      for (const sc of [sSide, 1]) {
        const ow = oldBox.w * sc, oh = oldBox.h * sc;
        const cands = [];
        for (const cy of [dest.y + dest.h - oh / 2, dest.y + dest.h / 2, dest.y + oh / 2]) {
          cands.push({x: dest.x + dest.w + 14 + ow / 2, y: cy}, {x: dest.x - 14 - ow / 2, y: cy});
        }
        for (const cx of [dest.x + dest.w / 2, dest.x + ow / 2, dest.x + dest.w - ow / 2]) {
          cands.push({x: cx, y: dest.y - 14 - oh / 2}, {x: cx, y: dest.y + dest.h + 14 + oh / 2});
        }
        for (const c of cands) {
          const b = {x: c.x - ow / 2, y: c.y - oh / 2, w: ow, h: oh};
          if (b.x < 8 || b.y < 8 || b.x + b.w > D.w - 8 || b.y + b.h > D.h - 8) continue;
          if (avoid.some(q => overlaps(b, q, 4))) continue;
          sSide = sc;
          return c;
        }
      }
      // else the clear spot nearest to the lens anywhere in the frame (the dimmed table, the floor…)
      sSide = 1;
      const ow = oldBox.w, oh = oldBox.h;
      let bestC = null, bestD = Infinity;
      for (let y = 8 + oh / 2; y <= D.h - 8 - oh / 2; y += 12) {
        for (let x = 8 + ow / 2; x <= D.w - 8 - ow / 2; x += 12) {
          const b = {x: x - ow / 2, y: y - oh / 2, w: ow, h: oh};
          if (avoid.some(q => overlaps(b, q, 4))) continue;
          const d = Math.hypot(x - (dest.x + dest.w / 2), y - (dest.y + dest.h / 2));
          if (d < bestD) { bestD = d; bestC = {x, y}; }
        }
      }
      return bestC || {x: dest.x + dest.w / 2, y: dest.y + dest.h - oh / 2 - 8};
    })();
    const pcx = (pb.x + pb.x1) / 2, pcy = (pb.y + pb.y1) / 2;
    const liftFrom = {x: dest.x + (pcx - source.x) * zoom, y: dest.y + (pcy - source.y) * zoom};
    const mR = Math.max(16, F * 0.8);
    const markerAt = {x: cardBox.x + w / 2, y: Math.max(mR + 4, cardBox.y - mR * 0.35)};
    const marker = changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0});

    // ---- notes in the free column: context caption, marker label (with a leader to the marker)
    const free = G.free;
    const notes = [];
    let captionNode = null;
    let notesFit = true;
    if (showKey && p.contextLabels.context) {
      const opts = {anchor: 'middle', size: F, minSize: F, fill: th.card, stroke: th.inkSoft, name: 'ctx-caption', weight: 600};
      let c = null;
      if (mode === 'row' && keyBox && plate) {
        const x0 = keyBox.x + keyBox.w + 24, x1 = plate.box.x - 16;
        if (x1 - x0 > 140) {
          const pr = wchip(ctx, p.contextLabels.context, {...opts, x: 0, y: 0, maxWidth: x1 - x0, maxLines: 3});
          if (!pr.fit.truncated && pr.box.h <= panel.y1 - panel.y) c = wchip(ctx, p.contextLabels.context, {...opts, x: (x0 + x1) / 2, y: panel.y + (panel.y1 - panel.y - pr.box.h) / 2, maxWidth: x1 - x0, maxLines: 3});
        }
      }
      if (!c && mode === 'row' && chipWBox) {
        const x0 = chipWBox.x + chipWBox.w + 30, x1 = G.tableR;
        if (x1 - x0 > 160) {
          const t2 = wchip(ctx, p.contextLabels.context, {...opts, anchor: 'end', x: x1, y: G.floor + 6, maxWidth: x1 - x0, maxLines: 2});
          if (!t2.fit.truncated && t2.box.y + t2.box.h <= D.h - 2) c = t2;
        }
      }
      if (!c) {
        c = wchip(ctx, p.contextLabels.context, {...opts, x: free.x + free.w / 2, y: free.y + 2, maxWidth: free.w, maxLines: 5});
        c.inColumn = true;
      }
      captionNode = c;
      if (c.fit.truncated) notesFit = false;
    }
    let label = null;
    if (showKey && p.contextLabels.marker) {
      const top = captionNode && captionNode.inColumn ? captionNode.box.y + captionNode.box.h + 14 : free.y;
      {
        // no leader across the scene (it would run along the card tops): the label repeats the Δ marker
        const mr = mR * 0.9;
        const c = wchip(ctx, p.contextLabels.marker, {x: free.x + 2 * mr + 12, y: top, anchor: 'start', maxWidth: free.w - 2 * mr - 12, size: F, minSize: F, maxLines: 5, name: 'cx-label-chip'});
        if (c.fit.truncated || c.box.y + c.box.h > free.y + free.h + 4) notesFit = false;
        label = {
          node: g({name: 'cx-label', opacity: 0}, changedMarker(ctx, {x: free.x + mr, y: c.box.cy, radius: mr}), c.node),
          frame: q => ({'cx-label': {opacity: r(q, 3)}}),
          box: c.box,
        };
      }
    }
    return {
      stage, script, extras, G, F, px, n, fi, cardBox, source, dest, zoom, lz, lzBefore, lzAfter, strikeSpec, cxAfter, cxDock, mvDock, sideAt, sSide, liftFrom, marker, markerAt, captionNode, label,
      clerkBox, srcBefore, srcAfter, isSource, passageB: pb, lensCrop, lensHolds, rimDropped: safeB.dropped + safeA.dropped, lensFields: {before: safeB.shownFields, after: safeA.shownFields}, changedFieldWhole: !safeB.tagCut && !safeA.tagCut, fits: best.fits && notesFit, otherCards, oldBox, hideUnderLens, witnessBox, mR,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({name: 'ctx', transform: ''},
      g({name: 'world'},
        L.stage.node,
        L.extras,
        g({transform: T(L.cardBox.x, L.cardBox.y)}, L.cxAfter.node),
        L.cxDock,
        L.marker,
        L.captionNode && L.captionNode.node,
        L.label && L.label.node),
      // opaque window of the lens: context text fully under it is hidden from the viewer
      h('rect', {name: 'occ', 'data-occludes': '1', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), fill: 'none', opacity: 0}),
      L.lz.node,
      L.mvDock);
  },
  frame(ctx, L, u, timeMs) {
    const nodes = {};
    // context: the story's end state (all cards lined up), static
    const posed = L.stage.pose(L.script(L.n, timeMs, ctx.reduced));
    Object.assign(nodes, posed.nodes);
    const D = ctx.design;
    const settle = 1 + 0.035 * (1 - ease.inOutCubic(seg(u, ...W.settle)));
    nodes.world = {transform: scaleAbout(D.w / 2, D.h / 2, settle)};
    // lens
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.lz.frame(open, open));
    // the window is opaque while it moves (never a translucent copy drifting over other cards);
    // it only vanishes when it lies on its source, where the context shows the same card
    nodes['lz-win'] = {opacity: open > 0.02 ? 1 : 0};
    nodes.occ = {opacity: open >= 0.5 ? 1 : 0};
    const lensShown = seg(u, W.open[0] - 0.02, W.open[0]) * (1 - seg(u, W.close[1], W.close[1] + 0.02));
    L.hideUnderLens.forEach(nm => { nodes[nm] = {opacity: r(1 - lensShown, 3)}; });
    // substitution inside the lens
    const strike = ease.inOutSine(seg(u, ...W.strike));
    const oldOut = seg(u, ...W.oldOut);
    const newIn = seg(u, ...W.newIn);
    // the card turns over (never two values drawn over each other, never an empty slot)
    const w = L.cardBox.w, H = L.cardBox.h;
    const flip = k => ({opacity: 1, transform: scaleAbout(w / 2, H / 2, r(Math.max(0.03, k), 3), 1)});
    nodes['lz-before'] = oldOut >= 1 ? {...flip(0), opacity: 0} : flip(1 - ease.inCubic(oldOut));
    L.strikeSpec.forEach((q, j) => { nodes[`lz-strike${j}`] = {x2: r(lerp(q.x0, q.x1, strike)), opacity: strike > 0 && oldOut <= 0 ? 1 : 0}; });
    nodes['lz-after'] = oldOut >= 1 ? flip(ease.outCubic(newIn)) : {...flip(0), opacity: 0};
    // the old value leaves the lens (lift), waits beside it, then docks under the context card
    // (then it leaves its parking spot and reappears in its dock under the card — never crossing context text)
    const lift = ease.inOutSine(seg(u, ...W.lift));
    const ob = L.oldBox, ocx = ob.x + ob.w / 2, ocy = ob.y + ob.h / 2;
    const at = {x: lerp(L.liftFrom.x, L.sideAt.x, lift), y: lerp(L.liftFrom.y, L.sideAt.y, lift), s: lerp(L.zoom, L.sSide, lift)};
    const mvShown = u >= W.lift[0] ? Math.min(1, seg(u, W.lift[0], W.lift[0] + 0.012)) * (1 - seg(u, W.ctxDock[0], W.ctxDock[0] + 0.012)) : 0;
    nodes['mv-dock'] = {opacity: r(mvShown, 3), transform: `${T(r(at.x - ocx), r(at.y - ocy))} ${scaleAbout(ocx, ocy, r(at.s, 4))}`};
    // return: context card takes the new value; the old value docks under it; marker
    const ctxOld = seg(u, ...W.ctxOldOut);
    const ctxNew = seg(u, ...W.ctxNewIn);
    const rc = nodes[`st-rcard${L.fi}`];
    nodes[`st-rcard${L.fi}`] = ctxOld >= 1 ? {...rc, opacity: 0} : {...rc, transform: `${rc.transform} ${scaleAbout(w / 2, H / 2, r(Math.max(0.02, 1 - ease.inCubic(ctxOld)), 3), 1)}`};
    nodes['cx-after'] = ctxOld >= 1 ? flip(ease.outCubic(ctxNew)) : {...flip(0), opacity: 0};
    const cdock = seg(u, W.ctxDock[0] + 0.014, W.ctxDock[1]);
    nodes['cx-dock'] = {opacity: r(cdock, 3)};
    const mk = seg(u, ...W.marker);
    nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.captionNode) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption) * (1 - seg(u, ...W.captionOut)) + seg(u, ...W.captionIn), 3)};
    if (L.label) Object.assign(nodes, L.label.frame(seg(u, ...W.label)));
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const contextDatum = ctxNew >= 1 ? 'after' : ctxOld > 0 ? 'changing' : 'before';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const s = posed.semantic;
    const pb = L.passageB;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        datum,
        contextDatum,
        lensSource: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        lensDest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        // the lens copy is the card at the context's own coordinates, and its source holds the passage
        lensCopyAt: {x: r(L.cardBox.x), y: r(L.cardBox.y)},
        contextCardAt: s.card0 ? posed.cardPos.map(c => ({x: r(c.x), y: r(c.y)}))[L.fi] : null,
        // the lens source holds the changed datum (the whole passage, or on tight frames its row)
        sourceContainsPassage: L.lensHolds.every(q => q.x >= L.source.x - 0.5 && q.y >= L.source.y - 0.5 && q.x1 <= L.source.x + L.source.w + 0.5 && q.y1 <= L.source.y + L.source.h + 0.5),
        lensCrop: L.lensCrop,
        // lines left out of the lens copy because the rim would cut them (never the changed datum's row)
        rimDropped: L.rimDropped,
        // supplied fields wholly shown in the lens copy (before / after); the changed field is never cut
        lensFields: L.lensFields,
        changedFieldWhole: L.changedFieldWhole,
        lensClearOfSource: !overlaps(L.dest, L.source, 0),
        // the lens never covers the witness; the marker never sits on the clerk's head;
        // the docked old value never lies on the clerk's arm
        lensClearOfWitness: !overlaps(L.dest, L.witnessBox, 0),
        // the lens covers no head or body (witness, clerk) and its guides start on the inspected card
        lensClearOfPeople: !overlaps(L.dest, L.witnessBox, 0) && !overlaps(L.dest, L.clerkBox, 0),
        guidesOnCard: L.source.x >= L.cardBox.x - 0.5 && L.source.x + L.source.w <= L.cardBox.x + L.cardBox.w + 0.5 && L.source.y >= L.cardBox.y - 0.5 && L.source.y + L.source.h <= L.cardBox.y + L.cardBox.h + 0.5,
        markerClearOfHead: Math.hypot(L.markerAt.x - L.G.med.x, L.markerAt.y - (L.G.med.y - 92 * L.G.z)) > 44 * L.G.z + L.mR,
        dockClearOfArms: !posed.arms.some(a => [[a.a, a.e], [a.e, a.h]].some(([p0, q0]) => Array.from({length: 13}, (_, j) => ({x: lerp(p0.x, q0.x, j / 12), y: lerp(p0.y, q0.y, j / 12)}))
          .some(q => q.x > L.oldBox.x - 13 * L.G.z && q.x < L.oldBox.x + L.oldBox.w + 13 * L.G.z && q.y > L.oldBox.y - 13 * L.G.z && q.y < L.oldBox.y + L.oldBox.h + 13 * L.G.z))),
        zoom: r(L.zoom, 2),
        lensSourceType: newIn >= 1 ? L.srcAfter : oldOut >= 1 ? null : L.srcBefore,
        contextSourceType: ctxNew >= 1 ? L.srcAfter : ctxOld > 0 ? null : L.srcBefore,
        strike: r(strike, 3),
        oldValueShown: r(Math.max(1 - oldOut, mvShown, cdock), 3),
        oldDockedInContext: r(cdock, 3),
        markerVisible: mk >= 1,
        focusCard: L.fi,
        focusTarget: ctx.params.focusTarget,
        otherCardsInRail: s.cardAt.every(a => a === 'rail'),
        cardsFixed: JSON.stringify(s.slots),
        allReached: s.allReached,
        layoutFits: L.fits,
        textPx: r(L.F * L.px, 1),
      },
    };
  },
};

/** Lines of the inspected passage (card-local), with their strike geometry. */
function passageLines(c, isSource) {
  return c.lines.filter(q => (isSource ? q.kind === 'tag' || q.kind === 'via' : q.kind === 'text'))
    .map(q => ({x0: q.textX - 4, x1: q.textX + q.textW + 4, y: q.top + q.h * 0.52}));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-03-inspect',
    title: 'Witness statement — inspecting one card’s stated source and substituting it',
    titleEs: 'Declaración de testigo — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Declaración de testigo',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The lined-up fact cards beside the witness are the context. A lens enlarges a real copy of one card’s source passage (tag, glyph, underline); the supplied old value is struck through and docked under the card, the new value is written in and only its dependent state follows (glyph, underline colour, "from" line). Back in context a neutral Δ marker marks the changed card. Seeking back restores the old value; nothing about credibility or outcome is inferred.',
    tags: ['witness', 'statement', 'inspect', 'lens', 'fact card', 'stated source', 'as stated', 'changed marker', 'traceable'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/declaracion-de-testigo.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
