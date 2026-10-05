/**
 * LAW-0246 — Preparación de demanda · mechanism
 *
 * Spatial decomposition (not a row of boxes): Party A's portrait above the case
 * file; the case file is a tall folder holding the three supplied pieces
 * (facts, requests, documents — as configured), each piece level with its own
 * section of the written filing beside it; the calendar sits above the filing's
 * header and Party B's portrait beside (or under) the filing. Connectors are
 * anchored to the real edges of the elements; each is drawn only for a
 * supplied relationship, in its supplied kind (a plain relation has no arrow;
 * an arrow appears only for a supplied sequence — captioned "Sequence as
 * configured (illustrative)" — or a supplied causal link).
 *  0.00–0.18  the elements separate from a gathered cluster to their places.
 *  0.18–0.43  the supplied relationships are drawn one by one, with their labels.
 *  0.43–0.75  a tracer follows the supplied traversal order along the connectors
 *             (hidden on a hop between components with no connector; it never
 *             crosses a label, a heading or a face); the focus element grows to
 *             1.12× while the tracer is on it — every label is laid out clear of
 *             that grown size. Links other than the built-in pairs are routed as
 *             orthogonal paths around every element, caption and label.
 *  0.75–1.00  the mechanism holds: every section shows its state as supplied —
 *             "piece in place" where a piece is linked to it, "to complete"
 *             (a neutral empty slot) where none is — and the key. No section is
 *             required, no deadline, court or consequence is stated.
 * @module animations/civil-claim/LAW-0246
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {shade} from '../../primitives/paper.js';
import {
  PD_DEFAULTS, PD_STRINGS, partiesField, documentsField, sectionsField, datesField, labelProps,
  partyCaption, partyLine, sectionHeading, looksOf, gchip, keyChip, hit, fitG, pxPerUnit, localizeDefaults,
} from './kits/preparacion-demanda.js';

const ID = 'LAW-0246';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const TRACE = [0.45, 0.74];
const STATES_W = [0.75, 0.81];
// (how far the components start pulled toward the centre: a short, visible gathering that keeps the frame filled)
const GATHER = 0.06;
// (the focus element grows to 1.12× while the tracer is on it; the relation labels are laid out clear of that size)
const FOCUS_K = 0.12;
const FOCUS_GROUP = {filing: 'filing', caseFile: 'caseFile', facts: 'caseFile', requests: 'caseFile', documents: 'caseFile', calendar: 'calendar', partyA: 'partyA', partyB: 'partyB'};
const BASE_PX = 19.8, MIN_PX = 16.3;
const IDS = ['partyA', 'caseFile', 'facts', 'requests', 'documents', 'filing', 'calendar', 'partyB'];
const ITEMS = ['facts', 'requests', 'documents'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  sections: sectionsField,
  dates: datesField,
  labels: obj('Labels printed on the props', labelProps),
  states: obj('Section states shown at the hold (descriptive only)', {
    inPlace: str('State of a section whose piece is linked to it (as supplied)', 40),
    pending: str('State of a section with no linked piece in this configured example (not a defect)', 40),
  }, ['inPlace', 'pending']),
  elements: list('Component labels (ids are fixed; labels are editable)', obj('Component', {id: oneOf('Component id', IDS), label: str('Visible label', 50)}, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships (kind controls the line: a plain relation has no arrow; sequence / causal only when supplied). A piece → filing link fills that piece’s section. Links between other components than the built-in pairs (piece–filing, case file–filing, Party A–case file, calendar–filing, filing–Party B) are routed as orthogonal paths with one or two bends around every element, caption and label (a lane opens above the top band); when no clear path exists the link is drawn straight and reported in semantic.routeProblems (the layout then counts as not fitted)', obj('Relationship', {
    from: oneOf('Source component id', IDS), to: oneOf('Target component id', IDS), kind: oneOf('relation | communication | sequence | causal', KINDS), label: str('Label on the connector (empty: the kind’s caption)', 40),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind when a relationship has no label', {relation: str('Plain relation', 40), communication: str('Communication', 40), sequence: str('Sequence', 40), causal: str('Supplied causal link', 40)}),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  parties: PD_DEFAULTS.parties,
  documents: PD_DEFAULTS.documents,
  sections: PD_DEFAULTS.sections,
  dates: PD_DEFAULTS.dates,
  labels: PD_DEFAULTS.labels,
  states: {inPlace: 'Piece in place (as supplied)', pending: 'To complete (as supplied)'},
  elements: [{id: 'caseFile', label: 'Case file'}, {id: 'filing', label: 'Written filing'}, {id: 'calendar', label: 'Calendar'}],
  relationships: [
    {from: 'partyA', to: 'caseFile', kind: 'relation', label: 'works from'},
    {from: 'facts', to: 'filing', kind: 'relation', label: 'assembled into'},
    {from: 'requests', to: 'filing', kind: 'relation', label: 'assembled into'},
    {from: 'documents', to: 'filing', kind: 'relation', label: 'assembled into'},
    {from: 'calendar', to: 'filing', kind: 'relation', label: 'dates'},
    {from: 'filing', to: 'partyB', kind: 'relation', label: 'names'},
  ],
  focusElement: 'filing',
  relationLabels: {relation: 'related (as supplied)', communication: 'communicates (as supplied)', sequence: 'then (as configured)', causal: 'causes (as supplied)'},
  traversalOrder: ['partyA', 'caseFile', 'facts', 'requests', 'documents', 'filing', 'partyB'],
};

// Spanish defaults (the baseline-es preset's values): shown when only `locale: "es"` is set
const DEFAULTS_ES = {
  "parties": [
    {
      "name": "Parte A",
      "role": "Prepara el escrito"
    },
    {
      "name": "Parte B",
      "role": "Nombrada en el escrito"
    }
  ],
  "documents": {
    "caseFile": {
      "ref": "EXP-0520",
      "title": "Expediente · reclamación ficticia"
    },
    "filing": {
      "ref": "Borrador E-0520/1",
      "title": "Demanda · borrador ficticio"
    }
  },
  "sections": [
    {
      "heading": "Hechos",
      "item": "El paquete ficticio llegó dañado el día 2"
    },
    {
      "heading": "Peticiones",
      "item": "Sustituir el paquete ficticio"
    },
    {
      "heading": "Documentos",
      "item": "Albarán D-17 (ficticio)"
    }
  ],
  "dates": {
    "filing": "Fecha: día 6 (según lo aportado)",
    "calendar": "Día 6"
  },
  "labels": {
    "calendar": "Día de redacción"
  },
  "states": {
    "inPlace": "Pieza en su sitio",
    "pending": "Por completar"
  },
  "elements": [
    {
      "id": "caseFile",
      "label": "Expediente"
    },
    {
      "id": "filing",
      "label": "Escrito"
    },
    {
      "id": "calendar",
      "label": "Calendario"
    }
  ],
  "relationships": [
    {
      "from": "partyA",
      "to": "caseFile",
      "kind": "relation",
      "label": "trabaja con"
    },
    {
      "from": "facts",
      "to": "filing",
      "kind": "relation",
      "label": "se incorpora a"
    },
    {
      "from": "requests",
      "to": "filing",
      "kind": "relation",
      "label": "se incorpora a"
    },
    {
      "from": "documents",
      "to": "filing",
      "kind": "relation",
      "label": "se incorpora a"
    },
    {
      "from": "calendar",
      "to": "filing",
      "kind": "relation",
      "label": "fecha"
    },
    {
      "from": "filing",
      "to": "partyB",
      "kind": "relation",
      "label": "nombra a"
    }
  ],
  "relationLabels": {
    "relation": "relacionado (según lo aportado)",
    "communication": "comunica (según lo aportado)",
    "sequence": "después (según lo configurado)",
    "causal": "causa (según lo aportado)"
  }
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const pxPer = pxPerUnit(ctx);
    const tsBase = BASE_PX / pxPer, tsMin = MIN_PX / pxPer;
    let best = null;
    // (the largest text that fits: the diagram grows to fill the frame; long text may step down to the floor)
    const sizes = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1].map(k => k * tsBase);
    for (let t = tsBase; t >= tsMin - 1e-6; t -= (tsBase - tsMin) / 4) sizes.push(t);
    // (at each size the roomy composition first, then a tight one — narrower corridors, the key beside Party B —
    // before the text steps down)
    outer: for (const t of sizes) {
      for (const tight of [0, 1, 2, 3]) for (const oneLine of tight ? [false, true] : [false]) {
        let L = compose(ctx, t, pxPer, 0, tight, oneLine);
        if (L.fitted && L.slack > t) {
          // (spare height: taller rows, larger portraits and roomier corridors, so the diagram fills the frame)
          for (const k of [0.92, 0.6, 0.3]) {
            const L2 = compose(ctx, t, pxPer, L.slack * k, tight, oneLine);
            if (L2.fitted) { L = L2; break; }
          }
        }
        // (when nothing fits fully, the largest size that fits the frame with every label clear — only a configured
        // link the router could not clear flagged — is kept; then any that fits the frame)
        if (!best || rankOf(L) > rankOf(best)) best = L;
        if (L.fitted) break outer;
      }
    }
    return best;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** True when a fit keeps every word whole (no word broken across lines) and no wrapped line holds only 1–2 characters. */
const wholeWords = (fit, text) => fit.lines.slice(1).every(l => l.trim().length > 2) && fit.lines.join(' ').replace(/\u00a0/g, ' ').split(/\s+/).filter(Boolean).join(' ') === String(text).replace(/\u00a0/g, ' ').split(/\s+/).filter(Boolean).join(' ');
const unionBox = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y}; };
const rankOf = L => (L.fitted ? 4 : L.geomOk && L.labelsClear && !L.truncated.length && !L.splitWords.length ? 3 : L.geomOk ? 2 : 1);
const labelOf = (p, id, fallback) => (p.elements.find(e => e.id === id) || {}).label || fallback;

function compose(ctx, ts, pxPer, extra = 0, tight = 0, oneLine = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const linked = ITEMS.map(id => p.relationships.some(q => (q.from === id && q.to === 'filing') || (q.to === id && q.from === 'filing')));
  // ---- sizes
  const R = (tight ? Math.max((tight > 2 ? 40.4 : 42) / pxPer, ts * 2.1) : Math.max(60 / pxPer / 2 + 8, ts * 2.6)) + Math.min(ts * 2.2, extra * 0.12);  // portrait badge radius (tight: >= 84 px across at 1080p; tight 3: >= 82 px)
  // (tight: as narrow as the piece → filing labels allow at two lines each, never under 7.4 or over 11 text heights)
  const hRels = p.relationships.filter(q => ITEMS.some(it => (q.from === it && q.to === 'filing') || (q.to === it && q.from === 'filing')));
  const fgId = FOCUS_GROUP[p.focusElement];
  const twoLineW = () => {
    // (oneLine: the corridor as wide as the piece → section labels need on ONE line — shorter rows, narrower columns)
    for (let wv = ts * 7.4; wv <= ts * (oneLine ? 12 : 11) + 1e-6; wv += ts * 0.2) {
      // (the focus element, when it is the case file or the filing, grows into this corridor while the tracer is on it)
      const grow = fgId === 'filing' || fgId === 'caseFile' ? (FOCUS_K / 2) * (D.w - 16 - wv - (shape === 'landscape' ? R * 2 + ts * 10.2 : 0)) / 2 + 10 : 0;
      if (!showAll || hRels.every(q => { const c = gchip(ctx, (q.label || p.relationLabels[q.kind]), {x: 0, y: 0, anchor: 'start', maxWidth: wv - ts * 0.6, size: ts, minSize: ts, maxLines: oneLine ? 1 : 2, weight: 600}); return !c.fit.truncated && wholeWords(c.fit, (q.label || p.relationLabels[q.kind])) && Math.max(c.box.w, c.fit.width + ts * 0.9) + 12 + grow <= wv; })) return wv;
    }
    return ts * (oneLine ? 12 : 11);
  };
  const gapW = tight ? twoLineW() : shape === 'portrait' ? ts * 7.4 : ts * 9;  // the corridor between the case file and the filing (connector labels)
  // (vertical corridors — portrait → case file, calendar → filing, filing → Party B — hold a two-line label beside the line)
  // (each vertical corridor is at least as tall as the label beside its line, plus the tab / label above the body)
  const pairIs = (q, a, b) => (q.from === a && q.to === b) || (q.from === b && q.to === a);
  const vLabH = pairs => Math.max(0, ...p.relationships.filter(q => pairs.some(([a, b]) => pairIs(q, a, b))).map(q => showAll ? gchip(ctx, (q.label || p.relationLabels[q.kind]), {x: 0, y: 0, anchor: 'start', maxWidth: vMW, size: ts, minSize: ts, maxLines: 4, weight: 600}).box.h : 0));
  const gapV0 = [ts * 4.2, ts * 3.2, ts * 2.2, ts * 2.2][tight];
  // (tight 3, the last step before the text shrinks: slimmer margins in the headers, calendar and corridors)
  const t3 = tight > 2, cm = t3 ? 9 : 14, hg = t3 ? ts * 0.2 : ts * 0.35;
  const sideW = shape === 'landscape' ? R * 2 + ts * 9 : 0;
  const colW = (D.w - 16 - gapW - sideW - (sideW ? ts * 1.2 : 0)) / 2;
  const pad = ts * 0.5;
  const vMW = Math.max(ts * 5, Math.min(colW * 0.75, ts * 14));
  const cardW = colW - ts * 1.2;
  const itemFits = p.sections.map(s => fitG(s.item, {maxWidth: cardW - 2 * pad, size: ts, minSize: ts, maxLines: 8, weight: 600}));
  const headFits = p.sections.map((s, i) => fitG(sectionHeading(p, i), {maxWidth: cardW - 2 * pad, size: ts, minSize: ts, maxLines: 3, weight: 700}));
  const stFits = p.sections.map((s, i) => fitG(linked[i] ? p.states.inPlace : p.states.pending, {maxWidth: colW - ts * 1.6, size: ts, minSize: ts, maxLines: 3, weight: 600}));
  const rowGap = (t3 ? ts * 0.12 : tight > 1 ? ts * 0.35 : ts * 0.6) + extra * 0.03;
  // (rows are tall enough that a piece → section label sits beside its own connector and every neighbouring row's
  // connector stays >= 20.5 px further away: label height + twice the label offset + that margin)
  const growC = fgId === 'filing' || fgId === 'caseFile' ? (FOCUS_K / 2) * colW + 10 : 0;
  // (the lowest label a row connector can take: the widths the placement tries, within the corridor beside the grown
  // focus element)
  const rowLabH = showAll ? Math.max(0, ...hRels.map(q => {
    const text = q.label || p.relationLabels[q.kind], mw = Math.max(ts * 5, Math.min(gapW + ts * 0.5, ts * 10));
    let hMin = Infinity;
    for (const k of [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5]) for (const lines of [2, 3, 4]) {
      const c = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: Math.max(ts * 4, mw * k), size: ts, minSize: ts, maxLines: lines, weight: 600});
      if (!c.fit.truncated && wholeWords(c.fit, text) && c.box.w + growC + 8 <= gapW) hMin = Math.min(hMin, c.box.h);
    }
    return Number.isFinite(hMin) ? hMin : 0;
  })) : 0;
  const rowMin = rowLabH ? rowLabH + 2 * (ts * 0.4 + 2) + 20.5 / pxPer + 6 - rowGap : 0;
  const rowH = p.sections.map((s, i) => extra * 0.16 + Math.max(rowMin, headFits[i].height + itemFits[i].height + pad * 2 + ts * 0.3, headFits[i].height + stFits[i].height + ts * 1.6 + pad * 2));
  // case file header (tab + title plate) and filing header (ref, title, parties, date)
  const cfLab = fitG(labelOf(p, 'caseFile', 'Case file'), {maxWidth: colW - ts, size: ts, minSize: ts, maxLines: 2, weight: 700});
  const cfRef = fitG(p.documents.caseFile.ref, {maxWidth: colW - R - ts * 1.8, size: ts, minSize: ts, maxLines: 2, weight: 700, family: 'mono'});
  // (the folder's tab widens leftwards to hold its reference, never past Party A's connector)
  const tabK = clamp(1 - (cfRef.width + ts * 0.8) / colW, (R + ts) / colW, 0.45);
  const cfTitle = fitG(p.documents.caseFile.title, {maxWidth: colW - ts * 1.2, size: ts, minSize: ts, maxLines: 4, weight: 700, family: 'serif'});
  const fRef = fitG(p.documents.filing.ref, {maxWidth: colW - ts * 1.2, size: ts, minSize: ts, maxLines: 2, weight: 600, family: 'mono'});
  const fTitle = fitG(p.documents.filing.title, {maxWidth: colW - ts * 1.2, size: ts, minSize: ts, maxLines: 4, weight: 700, family: 'serif'});
  const fParties = fitG(partyLine(p), {maxWidth: colW - ts * 1.2, size: ts, minSize: ts, maxLines: 4, weight: 600});
  const fDate = fitG(p.dates.filing, {maxWidth: colW - ts * 1.2, size: ts, minSize: ts, maxLines: 3, weight: 500});
  const cfHead = ts * 0.5 + cfTitle.height + ts * 0.8 + cfLab.height + ts * 0.7;
  // (the header rule sits 0.3 text heights above the first section, 0.2 below the date line)
  const fHead = fRef.height + fTitle.height + fParties.height + fDate.height + ts * 0.5 + hg * 3 + Math.max(0, ts * 0.32 - hg) + ts * 0.5;
  const head = Math.max(cfHead, fHead);
  const bodyH = head + rowH.reduce((a, b) => a + b, 0) + rowGap * 3;
  const growY = FOCUS_K / 2 * bodyH + 4;
  const gapBot = shape === 'landscape' ? 0 : Math.max(gapV0, vLabH([['filing', 'partyB']]) + cm + (fgId === 'filing' ? growY + 10 : 0)) + extra * 0.08;
  // top band: Party A's portrait (left) and the calendar (right); its name chip beside it
  const capA = showKey ? gchip(ctx, partyCaption(p, 0), {x: 0, y: 0, anchor: 'start', maxWidth: colW - R * 2 - ts, size: ts, minSize: ts, maxLines: 6}) : null;
  const calLab = fitG(labelOf(p, 'calendar', 'Calendar'), {maxWidth: ts * 8, size: ts, minSize: ts, maxLines: 2, weight: 700});
  // (tight: the calendar may widen into the filing column beside its label)
  const calMax = tight ? Math.max(ts * 10, Math.min(ts * 14, colW - calLab.width - ts * 1.7)) : ts * 10;
  const calT = fitG(p.labels.calendar, {maxWidth: calMax, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const calD = fitG(p.dates.calendar, {maxWidth: calMax, size: ts, minSize: ts, maxLines: 3, weight: 700});
  const calW = Math.max(ts * 5, calT.width, calD.width) + ts * 1.2;
  // (the filing's label stops short of the calendar's connector, which drops to the filing's top edge)
  const fLab = fitG(labelOf(p, 'filing', 'Written filing'), {maxWidth: Math.max(ts * 4, Math.min(colW - ts, colW - calW / 2 - ts * 1.5)), size: ts, minSize: ts, maxLines: 3, weight: 700});
  const gapTop = Math.max(gapV0, vLabH([['partyA', 'caseFile']]) + (fgId === 'caseFile' ? growY + (cfRef.height + ts * 0.6) * (1 + FOCUS_K) : cfRef.height + ts * 0.6) + cm, vLabH([['calendar', 'filing']]) + (fgId === 'filing' ? growY + (showKey ? (fLab.height + ts * 0.5) * (1 + FOCUS_K) : 0) : (showKey ? fLab.height + ts * 0.5 : 0)) + cm) + extra * 0.08;
  const calPad = t3 ? 0.6 : 1;
  const calH = calT.height + calD.height + ts * 1.9 * calPad;
  // (tight: the calendar's label sits to its left instead of above it)
  const calSide = tight > 0;
  // (a configured link outside the built-in layout gets a free lane above the top band for the router)
  const isCanon = q => [[q.from, q.to], [q.to, q.from]].some(([m, n]) => (ITEMS.includes(m) && n === 'filing') || (m === 'caseFile' && n === 'filing') || (m === 'partyA' && n === 'caseFile') || (m === 'calendar' && n === 'filing') || (m === 'filing' && n === 'partyB'));
  const laneTop = p.relationships.some(q => q.from !== q.to && !isCanon(q)) ? ts * (t3 ? 1.15 : 1.4) : 0;
  const topH = laneTop + Math.max(R * 2, capA ? capA.box.h : 0, calH + (showKey && !calSide ? calLab.height + ts * 0.5 : 0)) + (t3 ? 0 : ts * 0.3) + gapTop;
  const keyP = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: D.w * 0.5, size: ts}) : null;
  // (tight, not landscape: the key sits in Party B's band, left of the portrait, instead of its own row)
  const keyBeside = Boolean(tight && keyP && shape !== 'landscape');
  const seqCap = showAll && p.relationships.some(q => q.kind === 'sequence') ? ctx.t.sequence : null;
  const kB = keyBeside ? keyChip(ctx, {x: 0, y: 0, maxWidth: colW, size: ts}) : null;
  const sB = keyBeside && seqCap ? gchip(ctx, seqCap, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: ts, minSize: ts, maxLines: 3}) : null;
  // Party B's caption: under the portrait in the landscape side column (centred where the frame allows); otherwise left of it, as wide as the band allows
  // (clear of the filing at its grown size when the filing is the focus element)
  const growXf = fgId === 'filing' ? (FOCUS_K / 2) * colW + 10 : 0;
  const capBMax = shape === 'landscape' ? sideW + ts * 1.2 - growXf - 4 : colW * 2 + gapW - R * 2 - ts - (kB ? Math.max(kB.box.w, sB ? sB.box.w : 0) + ts : 0);
  const capB = showKey ? gchip(ctx, partyCaption(p, 1), {x: 0, y: 0, anchor: 'start', maxWidth: capBMax, size: ts, minSize: ts, maxLines: 8}) : null;
  const bandH = shape === 'landscape' ? 0 : Math.max(R * 2, capB ? capB.box.h : 0, kB ? kB.box.h + (sB ? sB.box.h + ts * 0.4 : 0) : 0);
  // (the key row keeps clear of the case file or filing at its grown size)
  const botH = (keyP && !keyBeside ? keyP.box.h + ts * 0.6 + (fgId === 'filing' || fgId === 'caseFile' ? growY : 0) : 0) + (shape !== 'landscape' ? bandH + gapBot : 0);
  const totalH = topH + bodyH + botH;
  const fitted = totalH <= D.h - (t3 ? 4 : 12) && colW >= ts * 7;
  const slack = D.h - (t3 ? 4 : 12) - totalH;
  const sy = Math.max(2, (D.h - totalH) / 2);
  // ---- geometry
  const x0 = 8;
  const cfBox = {x: x0, y: sy + topH, w: colW, h: bodyH};
  const flBox = {x: x0 + colW + gapW, y: sy + topH, w: colW, h: bodyH};
  const rows = [];
  let y = sy + topH + head;
  for (let i = 0; i < 3; i++) {
    rows.push({y, h: rowH[i]});
    y += rowH[i] + rowGap;
  }
  const card = i => ({x: cfBox.x + ts * 0.6, y: rows[i].y, w: cardW, h: rowH[i]});
  const section = i => ({x: flBox.x + ts * 0.5, y: rows[i].y, w: colW - ts, h: rowH[i]});
  const aC = {x: x0 + R, y: sy + topH - gapTop - R};
  const calBox = {x: flBox.x + colW - calW - ts * 0.5, y: sy + topH - gapTop - calH, w: calW, h: calH};
  const bandTop = sy + topH + bodyH + gapBot;
  const bC = shape === 'landscape' ? {x: flBox.x + colW + ts * 9 + R, y: flBox.y + bodyH / 2} : {x: flBox.x + colW - R - ts * 0.5, y: bandTop + R};
  const boxes = {
    partyA: {x: aC.x - R, y: aC.y - R, w: 2 * R, h: 2 * R, circle: aC},
    partyB: {x: bC.x - R, y: bC.y - R, w: 2 * R, h: 2 * R, circle: bC},
    caseFile: cfBox, filing: flBox, calendar: calBox,
    facts: card(0), requests: card(1), documents: card(2),
  };
  // where a connector attaches to an element (a piece → filing link lands on that piece's own section)
  const anchorFor = (id, other) => {
    const b = boxes[id], o = boxes[other];
    // (level with the middle of the section's slot, below its heading)
    if (id === 'filing' && ITEMS.includes(other)) { const k = ITEMS.indexOf(other), s = section(k), hh = headFits[k].height + ts * 0.3; return {x: s.x, y: s.y + hh + (s.h - hh) / 2, side: 'l'}; }
    // (level with its section's slot: a horizontal connector)
    if (ITEMS.includes(id) && other === 'filing') { const k = ITEMS.indexOf(id), s = section(k), hh = headFits[k].height + ts * 0.3; return {x: b.x + b.w, y: s.y + hh + (s.h - hh) / 2, side: 'r'}; }
    // (the case file and the filing link at header level, clear of the three piece rows)
    if (id === 'caseFile' && other === 'filing') return {x: cfBox.x + cfBox.w, y: cfBox.y + head * 0.5};
    if (id === 'filing' && other === 'caseFile') return {x: flBox.x, y: flBox.y + head * 0.5};
    // (the portrait above the case file, the calendar above the filing, Party B under the filing: straight vertical links)
    const vert = (id === 'partyA' && other === 'caseFile') || (id === 'caseFile' && other === 'partyA') || (id === 'calendar' && other === 'filing') || (id === 'filing' && other === 'calendar')
      || (shape !== 'landscape' && ((id === 'partyB' && other === 'filing') || (id === 'filing' && other === 'partyB')));
    if (vert) {
      const src = ['partyA', 'calendar', 'partyB'].includes(id) ? b : o;
      const xline = src.circle ? src.circle.x : src.x + src.w / 2;
      const top = b.y + b.h / 2 < o.y + o.h / 2;
      if (b.circle) return {x: xline, y: top ? b.circle.y + R + 4 : b.circle.y - R - 4};
      return {x: xline, y: top ? b.y + b.h : b.y};
    }
    if (shape === 'landscape' && ((id === 'partyB' && other === 'filing') || (id === 'filing' && other === 'partyB'))) {
      return id === 'partyB' ? {x: bC.x - R - 4, y: bC.y} : {x: flBox.x + flBox.w, y: bC.y};
    }
    if (b.circle) {
      const c = b.circle, oc = {x: o.x + o.w / 2, y: o.y + o.h / 2};
      const a = Math.atan2(oc.y - c.y, oc.x - c.x);
      return {x: c.x + Math.cos(a) * (R + 4), y: c.y + Math.sin(a) * (R + 4)};
    }
    const oc = o.circle ? o.circle : {x: o.x + o.w / 2, y: o.y + o.h / 2};
    // the facing edge's midpoint (clamped to the other element's centre where they overlap on that axis)
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const dx = oc.x - cx, dy = oc.y - cy;
    if (Math.abs(dx) / b.w > Math.abs(dy) / b.h) return {x: dx > 0 ? b.x + b.w : b.x, y: clamp(oc.y, b.y + 12, b.y + b.h - 12)};
    return {x: clamp(oc.x, b.x + 12, b.x + b.w - 12), y: dy > 0 ? b.y + b.h : b.y};
  };
  // ---- connectors and their labels
  const occupied = [{...cfBox, y: cfBox.y - cfRef.height - ts * 0.6, h: cfBox.h + cfRef.height + ts * 0.6}, {...flBox, y: flBox.y - (showKey ? fLab.height + ts * 0.5 : 0), h: flBox.h + (showKey ? fLab.height + ts * 0.5 : 0)}, (showKey && calSide ? {x: calBox.x - calLab.width - ts * 0.6, y: Math.min(calBox.y, calBox.y + (calBox.h - calLab.height) / 2), w: calBox.w + calLab.width + ts * 0.6, h: Math.max(calBox.h, calLab.height)} : {...calBox, y: calBox.y - (showKey ? calLab.height + ts * 0.5 : 0), h: calBox.h + (showKey ? calLab.height + ts * 0.5 : 0)}), boxes.partyA, boxes.partyB];
  if (capA) occupied.push({x: aC.x + R + ts * 0.5, y: aC.y - capA.box.h / 2, w: capA.box.w, h: capA.box.h});
  const capBBox = capB ? (shape === 'landscape' ? {x: Math.max(flBox.x + flBox.w + growXf + 4, Math.min(bC.x - capB.box.w / 2, D.w - 8 - capB.box.w)), y: bC.y + R + ts * 0.4, w: capB.box.w, h: capB.box.h} : {x: bC.x - R - ts * 0.5 - capB.box.w, y: bandTop, w: capB.box.w, h: capB.box.h}) : null;
  if (capBBox) occupied.push(capBBox);
  // (the focus element at its grown size — the labels keep clear of it while it is enlarged)
  const groupBox = {
    caseFile: {x: cfBox.x, y: cfBox.y - cfRef.height - ts * 0.6, w: cfBox.w, h: cfBox.h + cfRef.height + ts * 0.6},
    filing: {x: flBox.x, y: flBox.y - (showKey ? fLab.height + ts * 0.5 : 0), w: flBox.w, h: flBox.h + (showKey ? fLab.height + ts * 0.5 : 0)},
    calendar: occupied[2], partyA: boxes.partyA, partyB: boxes.partyB,
  };
  const centreOf = {caseFile: cfBox, filing: flBox, calendar: calBox, partyA: boxes.partyA, partyB: boxes.partyB};
  if (fgId && groupBox[fgId]) {
    const gb = groupBox[fgId], cb0 = centreOf[fgId];
    const cx = cb0.x + cb0.w / 2, cy = cb0.y + cb0.h / 2, k = 1 + FOCUS_K;
    // (its drawn shadow sits 7–8 units right of and below it: the grown box keeps that margin on those sides)
    occupied.push({x: cx + (gb.x - cx) * k - 2, y: cy + (gb.y - cy) * k - 2, w: gb.w * k + 2 + 8 * k + 2, h: gb.h * k + 2 + 9 * k + 2, id: fgId});
  }
  const conns = [];
  const labels = [];
  const labelBoxes = [];
  // ---- the router for links outside the built-in layout (e.g. Party A → calendar): orthogonal paths with short stubs
  // out of the elements' sides and one or two bends, clear of every element, caption and piece; the shortest clear one
  const canonical = (x, y) => [[x, y], [y, x]].some(([m, n]) => (ITEMS.includes(m) && n === 'filing') || (m === 'caseFile' && n === 'filing') || (m === 'partyA' && n === 'caseFile') || (m === 'calendar' && n === 'filing') || (m === 'filing' && n === 'partyB'));
  const inBox = (q, z, pad) => q.x > z.x - pad && q.x < z.x + z.w + pad && q.y > z.y - pad && q.y < z.y + z.h + pad;
  const segHits = (a, b, z, pad) => {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (ts * 0.4)));
    for (let k = 0; k <= n; k++) if (inBox({x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n}, z, pad)) return true;
    return false;
  };
  const cardBoxes = ITEMS.map(id => ({id, ...boxes[id]}));
  const obstacles = [...occupied.map((z, k) => ({...z, id: z.id || ['caseFile', 'filing', 'calendar', 'partyA', 'partyB'][k] || 'cap'})), ...cardBoxes];
  const sidesOf = id => {
    const b = boxes[id];
    if (b.circle) return [[0, -1], [0, 1], [-1, 0], [1, 0]].map(d => ({x: b.circle.x + d[0] * (R + 4), y: b.circle.y + d[1] * (R + 4), d}));
    if (ITEMS.includes(id)) return [{x: b.x + b.w, y: b.y + b.h / 2, d: [1, 0]}];
    const out = [];
    // (4 units outside the edge, like the portraits' anchors: the end never touches text just inside the element)
    for (const f of [0.5, 0.3, 0.7]) out.push({x: b.x + b.w * f, y: b.y - 4, d: [0, -1]}, {x: b.x + b.w * f, y: b.y + b.h + 4, d: [0, 1]}, {x: b.x - 4, y: b.y + b.h * f, d: [-1, 0]}, {x: b.x + b.w + 4, y: b.y + b.h * f, d: [1, 0]});
    return out;
  };
  const ownIds = id => (ITEMS.includes(id) ? [id, 'caseFile'] : [id]);
  const polyLen = pts => pts.slice(1).reduce((acc, q, k) => acc + Math.hypot(q.x - pts[k].x, q.y - pts[k].y), 0);
  const routeFor = (from, to) => {
    let best = null;
    const st = ts * 0.8;
    for (const sa of sidesOf(from)) for (const sb of sidesOf(to)) {
      const A1 = {x: sa.x + sa.d[0] * st, y: sa.y + sa.d[1] * st}, B1 = {x: sb.x + sb.d[0] * st, y: sb.y + sb.d[1] * st};
      const mx = (A1.x + B1.x) / 2, my = (A1.y + B1.y) / 2;
      const shapes = [[], [{x: B1.x, y: A1.y}], [{x: A1.x, y: B1.y}], [{x: mx, y: A1.y}, {x: mx, y: B1.y}], [{x: A1.x, y: my}, {x: B1.x, y: my}]];
      for (const mid of shapes) {
        const pts = [sa, A1, ...mid, B1, sb].filter((q, k, arr) => k === 0 || Math.hypot(q.x - arr[k - 1].x, q.y - arr[k - 1].y) > 0.5);
        if (pts.some(q => q.x < 4 || q.y < 4 || q.x > D.w - 4 || q.y > D.h - 4)) continue;
        let clear = true;
        for (let k = 1; k < pts.length && clear; k++) {
          const first = k === 1, last = k === pts.length - 1;
          for (const z of obstacles) {
            if ((first && ownIds(from).includes(z.id)) || (last && ownIds(to).includes(z.id))) continue;
            if (segHits(pts[k - 1], pts[k], z, first || last ? 0 : 6)) { clear = false; break; }
          }
        }
        if (!clear) continue;
        const cost = polyLen(pts) + (pts.length - 2) * ts * 1.5;
        if (!best || cost < best.cost) best = {pts, cost};
      }
    }
    return best && best.pts;
  };
  const routed = [];
  // (the built-in links first, with their labels; then the configured extra links are routed around those labels)
  p.relationships.forEach((rel, i) => {
    if (!boxes[rel.from] || !boxes[rel.to] || rel.from === rel.to || !canonical(rel.from, rel.to)) return;
    const pts = [anchorFor(rel.from, rel.to), anchorFor(rel.to, rel.from)];
    conns.push({i, rel, a: pts[0], b: pts[1], pts, len: polyLen(pts), arrow: rel.kind === 'sequence' || rel.kind === 'causal'});
  });
  // the longest straight stretch of a connector (its label sits beside it) and the distance from a point to a connector
  const longest = c => { let bi = 1, bl = -1; for (let k = 1; k < c.pts.length; k++) { const l = Math.hypot(c.pts[k].x - c.pts[k - 1].x, c.pts[k].y - c.pts[k - 1].y); if (l > bl) { bl = l; bi = k; } } return [c.pts[bi - 1], c.pts[bi]]; };
  const boxDist = (z, c) => {
    let m = Infinity;
    for (let k = 1; k < c.pts.length; k++) {
      const a2 = c.pts[k - 1], b2 = c.pts[k], n = Math.max(2, Math.ceil(Math.hypot(b2.x - a2.x, b2.y - a2.y) / (ts * 0.25)));
      for (let j = 0; j <= n; j++) { const q = {x: a2.x + (b2.x - a2.x) * j / n, y: a2.y + (b2.y - a2.y) * j / n}; m = Math.min(m, Math.hypot(Math.max(z.x - q.x, 0, q.x - z.x - z.w), Math.max(z.y - q.y, 0, q.y - z.y - z.h))); }
    }
    return m;
  };
  const distTo = (q, c) => Math.min(...c.pts.slice(1).map((b2, k) => { const a2 = c.pts[k]; const vx = b2.x - a2.x, vy = b2.y - a2.y; const tt = clamp(((q.x - a2.x) * vx + (q.y - a2.y) * vy) / (vx * vx + vy * vy || 1)); return Math.hypot(a2.x + vx * tt - q.x, a2.y + vy * tt - q.y); }));
  // labels: beside the middle of their own connector, clear of the elements, of the other connectors and of earlier labels
  const placeLabel = c => {
    if (!showAll) return;
    const text = (c.rel.label || p.relationLabels[c.rel.kind]);
    const [sa, sb] = longest(c);
    const mx = (sa.x + sb.x) / 2, my = (sa.y + sb.y) / 2;
    const dx = sb.x - sa.x, dy = sb.y - sa.y, L0 = Math.hypot(dx, dy) || 1;
    const nx = -dy / L0, ny = dx / L0;
    // (a vertical corridor's label may run wide — one or two lines — so the corridor stays short)
    const mw = Math.abs(dx) < 1 ? vMW : Math.max(ts * 5, Math.min(Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) - ts * 0.6 : ts * 9, ts * 10));
    let best = null;
    // (positions from the middle outwards in fine steps, so a label finds the free stretch of a short corridor)
    // (steps of at most 1.5 units along the stretch, so a label also finds a narrow free window of a short corridor)
    const TS = [0.5];
    const nStep = Math.max(18, Math.ceil(L0 * 0.45 / 1.5));
    for (let k = 1; k <= nStep; k++) TS.push(0.5 - k * 0.45 / nStep, 0.5 + k * 0.45 / nStep);
    // (each line count also at narrower widths, so a label can wrap to fit a narrow corridor)
    const probes = [];
    for (const k of [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5]) for (const lines of [2, 3, 4]) {
      const probe = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: Math.max(ts * 4, mw * k), size: ts, minSize: ts, maxLines: lines, fill: th.card, stroke: th.fgSoft, weight: 600});
      if (!probe.fit.truncated && wholeWords(probe.fit, text) && !probes.some(q => Math.abs(q.probe.box.w - probe.box.w) < 1 && Math.abs(q.probe.box.h - probe.box.h) < 1)) probes.push({lines, mwk: Math.max(ts * 4, mw * k), probe});
    }
    search: for (const t of TS) for (const sgn of [-1, 1]) for (const {lines, mwk, probe} of probes) {
      const w = probe.box.w, hh = probe.box.h;
      const px = sa.x + dx * t, py = sa.y + dy * t;
      // the chip's nearest edge 0.4 text heights from the line, on the normal's side (the tracer passes beside it)
      const off = ts * 0.4 + 2 + Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2;
      const bx = px + nx * sgn * off - w / 2, by = py + ny * sgn * off - hh / 2;
      const box = {x: bx, y: by, w, h: hh};
      if (box.x < 4 || box.y < 4 || box.x + w > D.w - 4 || box.y + hh > D.h - 4) continue;
      if (occupied.some(o2 => hit(box, o2, 4)) || labelBoxes.some(o2 => hit(box, o2, 6))) continue;
      // nearer its own connector than any other
      const ctr = {x: bx + w / 2, y: by + hh / 2};
      // (edge distances, as a viewer reads them: every other connector at least 20.5 px — at 1080p — further than its own)
      const ownD = boxDist(box, c);
      if (conns.some(o2 => o2 !== c && boxDist(box, o2) < ownD + 20.5 / pxPer)) continue;
      // (and never over another connector)
      if (conns.some(o2 => o2 !== c && o2.pts.slice(1).some((q2, k2) => segHits(o2.pts[k2], q2, box, 2)))) continue;
      best = {box, lines, mwk};
      break search;
    }
    if (!best) {
      const probe = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: ts, minSize: ts, maxLines: 4});
      best = {box: {x: mx - probe.box.w / 2, y: my - probe.box.h - 6, w: probe.box.w, h: probe.box.h}, lines: 4, forced: true};
    }
    const chip = gchip(ctx, text, {x: best.box.x, y: best.box.y, anchor: 'start', maxWidth: best.mwk ?? mw, size: ts, minSize: ts, maxLines: best.lines, fill: th.card, stroke: kindColor(th, c.rel.kind), color: th.ink, weight: 600, name: `rl${c.i}-chip`});
    labels.push({c, chip, forced: Boolean(best.forced)});
    labelBoxes.push(chip.box);
  };
  for (const c of conns) placeLabel(c);
  p.relationships.forEach((rel, i) => {
    if (!boxes[rel.from] || !boxes[rel.to] || rel.from === rel.to || canonical(rel.from, rel.to)) return;
    // (routed around the elements, captions and the labels already placed)
    // (kept far enough from every placed label that the label stays clearly nearer its own line: >= 20.5 px more)
    const lm = ts * 0.45 + 4 + 20.5 / pxPer;
    for (const [k, z] of labelBoxes.entries()) if (!obstacles.some(o2 => o2.id === `lab${k}`)) obstacles.push({x: z.x - lm, y: z.y - lm, w: z.w + 2 * lm, h: z.h + 2 * lm, id: `lab${k}`});
    let pts = routeFor(rel.from, rel.to);
    if (pts) routed.push(i); else pts = [anchorFor(rel.from, rel.to), anchorFor(rel.to, rel.from)];
    const c = {i, rel, a: pts[0], b: pts[pts.length - 1], pts, len: polyLen(pts), arrow: rel.kind === 'sequence' || rel.kind === 'causal'};
    conns.push(c);
    placeLabel(c);
  });
  conns.sort((x, y) => x.i - y.i);
  // the key; a "sequence as configured" caption when any supplied link is a sequence
  let key = null, seq = null;
  if (keyBeside) {
    // (in Party B's band, under the case file column: the key level with the portrait's foot, the sequence caption above it)
    const kP = keyChip(ctx, {x: 0, y: 0, maxWidth: colW, size: ts});
    key = keyChip(ctx, {x: x0, y: bandTop + bandH - kP.box.h, anchor: 'start', maxWidth: colW, size: ts});
    if (seqCap) {
      const sP = gchip(ctx, seqCap, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: ts, minSize: ts, maxLines: 3});
      seq = gchip(ctx, seqCap, {x: x0, y: key.box.y - sP.box.h - ts * 0.4, anchor: 'start', maxWidth: colW, size: ts, minSize: ts, maxLines: 3, fill: th.card, stroke: th.fg, color: th.ink, weight: 600, name: 'seq-cap'});
    }
  } else {
    key = keyP ? keyChip(ctx, {x: 8, y: D.h - 8 - keyP.box.h, anchor: 'start', maxWidth: D.w * 0.5, size: ts}) : null;
    seq = seqCap ? gchip(ctx, seqCap, {x: key ? key.box.x + key.box.w + ts * 0.6 : 8, y: D.h - 8 - keyP.box.h, anchor: 'start', maxWidth: D.w * 0.45, size: ts, minSize: ts, maxLines: 2, fill: th.card, stroke: th.fg, color: th.ink, weight: 600, name: 'seq-cap'}) : null;
  }
  const truncated = [...itemFits, ...headFits, ...stFits, cfLab, cfRef, cfTitle, fLab, fRef, fTitle, fParties, fDate, calT, calD, calLab, capA && capA.fit, capB && capB.fit, key && key.fit, seq && seq.fit, ...labels.map(q => q.chip.fit)].filter(f => f && f.truncated).map(f => f.full);
  const clashes = [];
  const allLabels = [...labelBoxes, key && key.box, seq && seq.box].filter(Boolean);
  allLabels.forEach((b, i) => allLabels.forEach((c2, j) => { if (j > i && hit(b, c2, 2)) clashes.push(`${i}/${j}`); }));
  // (a composition whose labels cannot all sit beside their own connectors, or whose text is cut, does not count as fitted)
  const labelsClear = clashes.length === 0 && labels.every(q => !q.forced);
  // (every connector — built-in or routed — runs clear of the elements, captions, labels and key it does not join; a
  // configured link the router cannot clear is kept straight and reported here as a problem)
  const textBoxes = [...labels.map(q => ({...q.chip.box, id: `rl${q.c.i}`})), key && {...key.box, id: 'key'}, seq && {...seq.box, id: 'seq'}].filter(Boolean);
  const routeProblems = conns.filter(c => c.pts.slice(1).some((q, k) => {
    const first = k === 0, last = k === c.pts.length - 2;
    return obstacles.some(z => !String(z.id).startsWith('lab') && !((first && ownIds(c.rel.from).includes(z.id)) || (last && ownIds(c.rel.to).includes(z.id))) && segHits(c.pts[k], q, z, 0))
      || textBoxes.some(z => z.id !== `rl${c.i}` && segHits(c.pts[k], q, z, 0));
  })).map(c => `${c.rel.from}→${c.rel.to}`);
  const splitWords = [...itemFits, ...headFits, ...stFits, cfLab, cfRef, cfTitle, fLab, fRef, fTitle, fParties, fDate, calT, calD, calLab, capA && capA.fit, capB && capB.fit, key && key.fit, seq && seq.fit, ...labels.map(q => q.chip.fit)].filter(f => f && !f.truncated && !wholeWords(f, f.full)).map(f => f.full);
  // (the opening gathers the groups toward the centre only as far as no two of them — captions included — touch)
  const gGroups = [[cfBox, groupBox.caseFile], [flBox, groupBox.filing], [calBox, groupBox.calendar], [boxes.partyA, capA ? unionBox(boxes.partyA, occupied[5]) : boxes.partyA], [boxes.partyB, capBBox ? unionBox(boxes.partyB, capBBox) : boxes.partyB]];
  const gather = {x: D.w / 2, y: D.h / 2};
  let gatherK = 0;
  for (const k of [GATHER, 0.045, 0.03, 0.015]) {
    const moved = gGroups.map(([c0, b0]) => { const dx = (gather.x - (c0.x + c0.w / 2)) * k, dy = (gather.y - (c0.y + c0.h / 2)) * k; return {x: b0.x + dx, y: b0.y + dy, w: b0.w, h: b0.h}; });
    if (moved.every((m1, i1) => moved.every((m2, i2) => i2 <= i1 || !hit(m1, m2, 6)))) { gatherK = k; break; }
  }
  const inside = b => !b || (b.x >= 1 && b.y >= 1 && b.x + b.w <= D.w - 1 && b.y + b.h <= D.h - 1);
  const fittedAll = fitted && labelsClear && routeProblems.length === 0 && truncated.length === 0 && splitWords.length === 0 && inside(capBBox) && inside(key && key.box) && inside(seq && seq.box);
  return {
    ts, tabK, fitted: fittedAll, geomOk: fitted && inside(capBBox) && inside(key && key.box) && inside(seq && seq.box), slack, calSide, hg, calPad, R, gapW, colW, cardW, pad, looks, linked, itemFits, headFits, stFits, cfLab, cfRef, cfTitle, fLab, fRef, fTitle, fParties, fDate, calT, calD, calLab,
    boxes, rows, card, section, aC, bC, bandTop, capBBox, calBox, cfBox, flBox, capA, capB, conns, labels, key, seq, sy, topH, bodyH, head, shape,
    truncated, splitWords, labelsClear, routeProblems, routed, clashes, textPx: r(ts * pxPer, 2), pxPer,
    gather, gatherK,
  };
}

function kindColor(th, kind) {
  return kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.fg : kind === 'causal' ? th.accent3 : th.fgSoft;
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const p = ctx.params;
  const INK = '#1f2328';
  const {ts} = L;
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const txt = (fit, x, y, o = {}) => (showAll ? textBlock(fit, {x, y, fill: o.fill ?? INK, anchor: o.anchor, name: o.name})
    : h('rect', {'data-bar': 1, x: r(o.anchor === 'middle' ? x - fit.width * 0.35 : x), y: r(y + ts * 0.3), width: r(Math.max(ts * 2, fit.width * 0.7)), height: r(ts * 0.42), rx: r(ts * 0.2), fill: th.paperLine}));
  // ---- the case file with its three pieces
  const cf = L.cfBox;
  const cfc = '#c9a15e';
  const cfNode = g({name: 'el-caseFile'},
    h('path', {d: roundRectPath(cf.x + 7, cf.y + 8, cf.w, cf.h, 12), fill: th.shadow}),
    h('path', {d: `M${r(cf.x + cf.w * L.tabK)} ${r(cf.y + 4)}V${r(cf.y - L.cfRef.height - ts * 0.5 + 8)}Q${r(cf.x + cf.w * L.tabK)} ${r(cf.y - L.cfRef.height - ts * 0.5)} ${r(cf.x + cf.w * L.tabK + 8)} ${r(cf.y - L.cfRef.height - ts * 0.5)}H${r(cf.x + cf.w - 8)}Q${r(cf.x + cf.w)} ${r(cf.y - L.cfRef.height - ts * 0.5)} ${r(cf.x + cf.w)} ${r(cf.y - L.cfRef.height - ts * 0.5 + 8)}V${r(cf.y + 4)}Z`, fill: shade(cfc, 0.1), stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(cf.x, cf.y, cf.w, cf.h, 12), fill: cfc, stroke: INK, 'stroke-width': 2.6}),
    txt(L.cfRef, cf.x + cf.w * L.tabK + ts * 0.4, cf.y - L.cfRef.height - ts * 0.25, {name: 'el-caseFile-ref'}),
    h('path', {d: roundRectPath(cf.x + ts * 0.6, cf.y + ts * 0.5, cf.w - ts * 1.2, L.cfTitle.height + ts * 0.5, 7), fill: th.paper, stroke: INK, 'stroke-width': 2}),
    txt(L.cfTitle, cf.x + ts * 0.85, cf.y + ts * 0.75, {name: 'el-caseFile-title'}),
    // the component's own label, printed on the folder under its plate
    txt(L.cfLab, cf.x + ts * 0.7, cf.y + ts * 1.3 + L.cfTitle.height + ts * 0.3, {name: 'el-caseFile-lab'}),
  );
  const cards = [0, 1, 2].map(i => {
    const b = L.card(i);
    const tint = ['#e7dcc4', '#dfe3d2', '#d9e2ea'][i];
    return g({name: `el-${ITEMS[i]}`},
      h('path', {d: roundRectPath(b.x + 4, b.y + 5, b.w, b.h, 8), fill: th.shadow}),
      h('path', {name: `el-${ITEMS[i]}-in`, d: roundRectPath(b.x, b.y, b.w, b.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(b.x + 8)} ${r(b.y)}H${r(b.x + b.w - 8)}Q${r(b.x + b.w)} ${r(b.y)} ${r(b.x + b.w)} ${r(b.y + 8)}V${r(b.y + L.headFits[i].height + L.pad)}H${r(b.x)}V${r(b.y + 8)}Q${r(b.x)} ${r(b.y)} ${r(b.x + 8)} ${r(b.y)}Z`, fill: tint, stroke: INK, 'stroke-width': 2}),
      txt(L.headFits[i], b.x + L.pad, b.y + L.pad * 0.5, {name: `el-${ITEMS[i]}-head`}),
      txt(L.itemFits[i], b.x + L.pad, b.y + L.headFits[i].height + L.pad * 1.4, {name: `el-${ITEMS[i]}-item`}),
    );
  });
  // ---- the written filing with its sections
  const fl = L.flBox;
  let yy = fl.y + ts * 0.5;
  const fParts = [
    h('path', {d: roundRectPath(fl.x + 7, fl.y + 8, fl.w, fl.h, 6), fill: th.shadow}),
    h('path', {name: 'el-filing-in', d: roundRectPath(fl.x, fl.y, fl.w, fl.h, 6), fill: th.paper, stroke: INK, 'stroke-width': 2.6}),
  ];
  for (const [fit, fill, nm] of [[L.fRef, th.inkSoft, 'ref'], [L.fTitle, INK, 'title'], [L.fParties, INK, 'parties'], [L.fDate, th.inkSoft, 'date']]) {
    fParts.push(txt(fit, fl.x + ts * 0.6, yy, {fill, name: `el-filing-${nm}`}));
    // (the ● / ◆ glyphs stand taller than the text: a little more room under the parties line)
    yy += fit.height + L.hg + (nm === 'parties' ? Math.max(0, ts * 0.32 - L.hg) : 0);
  }
  fParts.push(h('rect', {x: r(fl.x + ts * 0.6), y: r(L.rows[0].y - ts * 0.3 - 1.5), width: r(fl.w - ts * 1.2), height: 3, fill: th.accent2}));
  const secNodes = [0, 1, 2].map(i => {
    const s = L.section(i);
    const hh = L.headFits[i].height;
    return g({name: `el-sec${i}`},
      txt(L.headFits[i], s.x + ts * 0.1, s.y, {name: `el-sec${i}-head`}),
      h('path', {name: `el-sec${i}-slot`, d: roundRectPath(s.x, s.y + hh + ts * 0.3, s.w, s.h - hh - ts * 0.3, 7), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-dasharray': L.linked[i] ? null : '8 7'}),
      // the state as supplied (filled: a solid neutral chip with the piece's tint; pending: the neutral empty slot)
      g({name: `el-sec${i}-state`, opacity: 0},
        L.linked[i] ? h('path', {d: roundRectPath(s.x + 6, s.y + hh + ts * 0.3 + 6, s.w - 12, s.h - hh - ts * 0.3 - 12, 6), fill: ['#e7dcc4', '#dfe3d2', '#d9e2ea'][i], stroke: INK, 'stroke-width': 1.6}) : null,
        txt(L.stFits[i], s.x + ts * 0.6, s.y + hh + ts * 0.3 + (s.h - hh - ts * 0.3 - L.stFits[i].height) / 2, {fill: INK, name: `el-sec${i}-st`})),
    );
  });
  // the component's own label above the sheet
  if (showKey) fParts.push(txt(L.fLab, fl.x + ts * 0.2, fl.y - L.fLab.height - ts * 0.4, {fill: th.fg, name: 'el-filing-lab'}));
  const flNode = g({name: 'el-filing'}, fParts, secNodes);
  // ---- calendar, portraits
  const cb = L.calBox;
  const calNode = g({name: 'el-calendar'},
    showKey ? (L.calSide ? txt(L.calLab, cb.x - ts * 0.5, cb.y + (cb.h - L.calLab.height) / 2, {anchor: 'end', fill: th.fg, name: 'el-calendar-lab'}) : txt(L.calLab, cb.x + cb.w / 2, cb.y - L.calLab.height - ts * 0.4, {anchor: 'middle', fill: th.fg, name: 'el-calendar-lab'})) : null,
    h('path', {d: roundRectPath(cb.x + 5, cb.y + 6, cb.w, cb.h, 8), fill: th.shadow}),
    h('path', {name: 'el-calendar-in', d: roundRectPath(cb.x, cb.y, cb.w, cb.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(cb.x, cb.y, cb.w, L.calT.height + ts * 0.7 * L.calPad, 8), fill: th.accent2, stroke: INK, 'stroke-width': 2.4}),
    showAll ? textBlock(L.calT, {x: cb.x + cb.w / 2, y: cb.y + ts * 0.35, anchor: 'middle', fill: '#fff', name: 'el-calendar-title'}) : null,
    txt(L.calD, cb.x + cb.w / 2, cb.y + L.calT.height + ts * 1.1 * L.calPad, {anchor: 'middle', name: 'el-calendar-day'}),
  );
  const badgeA = personBadge(ctx, {name: 'pa-badge', x: L.aC.x, y: L.aC.y, radius: L.R, look: L.looks.a});
  const badgeB = personBadge(ctx, {name: 'pb-badge', x: L.bC.x, y: L.bC.y, radius: L.R, look: L.looks.b});
  const capA = L.capA ? gchip(ctx, partyCaption(p, 0), {x: L.aC.x + L.R + ts * 0.5, y: L.aC.y - L.capA.box.h / 2, anchor: 'start', maxWidth: L.colW - L.R * 2 - ts, size: ts, minSize: ts, maxLines: 6, name: 'chip-a'}) : null;
  const capB = L.capB ? (L.shape === 'landscape'
    ? gchip(ctx, partyCaption(p, 1), {x: L.capBBox.x, y: L.capBBox.y, anchor: 'start', maxWidth: L.capB.box.w + 1, size: ts, minSize: ts, maxLines: 8, name: 'chip-b'})
    : gchip(ctx, partyCaption(p, 1), {x: L.bC.x - L.R - ts * 0.5, y: L.bandTop, anchor: 'end', maxWidth: L.capB.box.w + 1, size: ts, minSize: ts, maxLines: 8, name: 'chip-b'})) : null;
  // ---- connectors (solid; an arrowhead only on a supplied sequence or causal link)
  const connNodes = L.conns.map(c => {
    const col = kindColor(th, c.rel.kind);
    const pb = c.pts[c.pts.length - 2];
    const ang = Math.atan2(c.b.y - pb.y, c.b.x - pb.x) * 180 / Math.PI;
    return g({name: `rel-c${c.i}`, opacity: 0},
      h('path', {name: `rel-c${c.i}-line`, d: `M${c.pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`, stroke: col, 'stroke-width': c.rel.kind === 'causal' ? 5 : 3.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(c.len)} ${r(c.len + 10)}`, 'stroke-dashoffset': r(c.len)}),
      h('circle', {name: `rel-c${c.i}-dA`, cx: r(c.a.x), cy: r(c.a.y), r: 5, fill: col, opacity: 0}),
      c.arrow ? h('path', {name: `rel-c${c.i}-head`, d: 'M0 0L-16 -9L-12 0L-16 9Z', fill: col, transform: T(c.b.x, c.b.y, ang), opacity: 0}) : h('circle', {name: `rel-c${c.i}-dB`, cx: r(c.b.x), cy: r(c.b.y), r: 5, fill: col, opacity: 0}));
  });
  const labelNodes = L.labels.map(q => g({name: `rl${q.c.i}`, opacity: 0}, q.chip.node));
  return g(null,
    g({name: 'el-caseFile-g'}, cfNode, cards),
    g({name: 'el-filing-g'}, flNode),
    g({name: 'el-calendar-g'}, calNode),
    g({name: 'el-pa-g'}, badgeA.node, capA && capA.node),
    g({name: 'el-pb-g'}, badgeB.node, capB && capB.node),
    connNodes,
    labelNodes,
    g({name: 'tracer', opacity: 0}, h('circle', {r: ts * 0.36, fill: th.accent2, opacity: 0.25}), h('circle', {r: ts * 0.24, fill: th.accent2, stroke: th.paper, 'stroke-width': 3})),
    L.key && L.key.node,
    L.seq && L.seq.node,
  );
}

/**
 * Tracer route through the supplied order. The tracer travels only along connectors (outside the elements, beside —
 * never over — their labels); between two consecutive components with no connector it is hidden for a short hop and
 * reappears at the next component's connector end. It starts at the first connector's end, not on a portrait.
 * @returns {{pts:{x:number,y:number}[], vis:boolean[], cum:number[], total:number, visits:{id:string,t:number}[]}}
 */
function route(L, order) {
  const ts = L.ts;
  const connOf = (x, y) => L.conns.find(q => (q.rel.from === x && q.rel.to === y) || (q.rel.from === y && q.rel.to === x));
  // (the tracer stops short of the elements' edges — its halo never reaches the text just inside them)
  const trim = pts => {
    const d = ts * 0.75, out = pts.map(q => ({x: q.x, y: q.y}));
    const pull = (i, j) => { const a = out[i], b = pts[j]; const L0 = Math.hypot(b.x - a.x, b.y - a.y); const k = Math.min(d, L0 * 0.45) / (L0 || 1); out[i] = {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k}; };
    pull(0, 1); pull(out.length - 1, out.length - 2);
    return out;
  };
  // the point of component id where the tracer stands: its end of the connector toward `toward` (or any connector)
  const standAt = (id, toward) => {
    const c = (toward && connOf(id, toward)) || L.conns.find(q => q.rel.from === id || q.rel.to === id);
    if (c) { const tp = trim(c.pts); return c.rel.from === id ? tp[0] : tp[tp.length - 1]; }
    const b = L.boxes[id];
    return b.circle ? {x: b.circle.x, y: b.circle.y - L.R - 4} : {x: b.x + b.w / 2, y: b.y};
  };
  const ids = order.filter(id => L.boxes[id]);
  const pts = [], vis = [], visits = [];
  ids.forEach((id, i) => {
    if (i === 0) { pts.push(standAt(id, ids[1])); vis.push(false); visits.push({id, idx: 0}); return; }
    const prev = ids[i - 1];
    const c = connOf(prev, id);
    if (c) {
      const tp = trim(c.pts);
      const path = c.rel.from === prev ? tp : [...tp].reverse();
      const cur = pts[pts.length - 1];
      if (Math.hypot(cur.x - path[0].x, cur.y - path[0].y) > 1) { pts.push(path[0]); vis.push(false); }
      for (const q of path.slice(1)) { pts.push(q); vis.push(true); }
    } else {
      pts.push(standAt(id, ids[i + 1])); vis.push(false);
    }
    visits.push({id, idx: pts.length - 1});
  });
  // (a hidden hop takes a short, fixed share of the trace; the visible stretches run at one speed)
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + (vis[i] ? Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) : ts * 3));
  const total = cum[cum.length - 1] || 1;
  return {pts, vis, cum, total, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
}

/** Tracer position at trace fraction tt, and whether it is on a visible stretch. */
function tracerAt(rt, tt) {
  const d = tt * rt.total;
  for (let i = 1; i < rt.pts.length; i++) {
    if (d <= rt.cum[i] + 1e-9) {
      const f = rt.cum[i] > rt.cum[i - 1] ? (d - rt.cum[i - 1]) / (rt.cum[i] - rt.cum[i - 1]) : 1;
      const a = rt.pts[i - 1], b = rt.pts[i];
      return {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), visible: rt.vis[i] || f >= 1};
    }
  }
  const q = rt.pts[rt.pts.length - 1] || {x: 0, y: 0};
  return {x: q.x, y: q.y, visible: true};
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const nodes = {};
  // separate: every element group slides from the gathered cluster to its place (translation only: text never shrinks)
  const sep = ease.inOutCubic(seg(u, 0.02, 0.16));
  const groups = {'el-caseFile-g': L.cfBox, 'el-filing-g': L.flBox, 'el-calendar-g': L.calBox, 'el-pa-g': L.boxes.partyA, 'el-pb-g': L.boxes.partyB};
  for (const [n, b] of Object.entries(groups)) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    nodes[n] = {transform: T((L.gather.x - cx) * L.gatherK * (1 - sep), (L.gather.y - cy) * L.gatherK * (1 - sep))};
  }
  // tracer
  const rt = route(L, p.traversalOrder);
  const tt = seg(u, ...TRACE);
  const on = u >= TRACE[0] && u <= TRACE[1] + 0.005;
  const pos = tracerAt(rt, tt);
  // (hidden on a hop between components with no connector; visible along connectors and on arrival)
  const shown = on && (pos.visible || tt >= 1);
  nodes.tracer = {opacity: shown ? 1 : 0, transform: T(pos.x, pos.y)};
  const visited = rt.visits.filter(v => u >= TRACE[0] && tt >= v.t - 1e-6).map(v => v.id);
  // focus: the focus element enlarges while the tracer is on it (scale >= 1: text only grows)
  const fv = rt.visits.find(v => v.id === p.focusElement);
  let focusScale = 1;
  if (fv && on) {
    const d = Math.abs(tt - fv.t);
    focusScale = 1 + FOCUS_K * clamp(1 - d / 0.12);
  }
  const fg = {filing: 'el-filing-g', caseFile: 'el-caseFile-g', calendar: 'el-calendar-g', partyA: 'el-pa-g', partyB: 'el-pb-g', facts: 'el-caseFile-g', requests: 'el-caseFile-g', documents: 'el-caseFile-g'}[p.focusElement];
  if (fg) {
    const b = groups[fg];
    nodes[fg] = {transform: `${nodes[fg].transform} ${scaleAbout(b.x + b.w / 2, b.y + b.h / 2, r(focusScale, 4))}`};
  }
  // (every connector end on the enlarged element moves out with its grown edge — along its own line, so no line runs
  // over the grown element's text)
  const fgId = FOCUS_GROUP[p.focusElement];
  const fb = fg ? groups[fg] : null;
  const grow = (pt, nb) => {
    if (!fb || focusScale <= 1) return pt;
    const cx = fb.x + fb.w / 2, cy = fb.y + fb.h / 2;
    const dx = pt.x - nb.x, dy = pt.y - nb.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const x2 = cx + (pt.x - cx) * focusScale, k = dx ? (x2 - nb.x) / dx : 1;
      return {x: x2, y: nb.y + dy * k};
    }
    const y2 = cy + (pt.y - cy) * focusScale, k = dy ? (y2 - nb.y) / dy : 1;
    return {x: nb.x + dx * k, y: y2};
  };
  // relationships drawn one by one
  const n = L.conns.length;
  const drawn = L.conns.map((c, k) => seg(u, 0.19 + (k / n) * 0.22, 0.19 + ((k + 1) / n) * 0.22 - 0.01));
  L.conns.forEach((c, k) => {
    const q = drawn[k];
    const pts = c.pts.map(pt => ({...pt}));
    if (FOCUS_GROUP[c.rel.from] === fgId) pts[0] = grow(pts[0], pts[1]);
    if (FOCUS_GROUP[c.rel.to] === fgId) pts[pts.length - 1] = grow(pts[pts.length - 1], pts[pts.length - 2]);
    const a = pts[0], b = pts[pts.length - 1], pb = pts[pts.length - 2];
    nodes[`rel-c${c.i}`] = {opacity: q > 0 ? 1 : 0};
    nodes[`rel-c${c.i}-line`] = {d: `M${pts.map(pt => `${r(pt.x)} ${r(pt.y)}`).join('L')}`, 'stroke-dasharray': q >= 1 ? 'none' : `${r(c.len)} ${r(c.len + 10)}`, 'stroke-dashoffset': r(c.len * (1 - q))};
    nodes[`rel-c${c.i}-dA`] = {opacity: q > 0 ? 1 : 0, cx: r(a.x), cy: r(a.y)};
    if (c.arrow) nodes[`rel-c${c.i}-head`] = {opacity: q >= 0.985 ? 1 : 0, transform: T(b.x, b.y, Math.atan2(b.y - pb.y, b.x - pb.x) * 180 / Math.PI)};
    else nodes[`rel-c${c.i}-dB`] = {opacity: q >= 0.985 ? 1 : 0, cx: r(b.x), cy: r(b.y)};
  });
  L.labels.forEach(q => { const k = L.conns.indexOf(q.c); nodes[`rl${q.c.i}`] = {opacity: r(clamp((drawn[k] - 0.55) / 0.45), 3)}; });
  // section states at the hold
  const st = seg(u, ...STATES_W);
  [0, 1, 2].forEach(i => { nodes[`el-sec${i}-state`] = {opacity: r(st, 3)}; });
  const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
  const W = q => ({x: r(q.x), y: r(q.y)});
  return {
    nodes,
    semantic: {
      beat, separated: r(sep, 3), relationsDrawn: drawn.map(q => r(q, 3)), tracerVisible: on, tracer: W(pos), visitOrder: visited,
      focusScale: r(focusScale, 3), stateShown: r(st, 3), linked: L.linked,
      kinds: L.conns.map(c => c.rel.kind), arrows: L.conns.map(c => ({kind: c.rel.kind, arrow: c.arrow})),
      fitted: L.fitted, splitWords: L.splitWords, labelsClear: L.labelsClear, routeProblems: L.routeProblems, routedLinks: L.routed.length, clashes: L.clashes, truncated: L.truncated, textPx: L.textPx,
      sequenceCaption: Boolean(L.seq),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-02-mechanism',
    title: 'Preparing a claim — how the case file’s pieces map onto the sections of a written filing',
    titleEs: 'Preparación de demanda — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Preparación de demanda',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial diagram: Party A above the case file, whose three supplied pieces (facts, requests, documents — as configured) sit level with the three sections of the written filing beside it; the calendar above the filing and Party B beside it. The supplied relationships are drawn one by one (plain relations without arrows; an arrow only for a supplied sequence, captioned "sequence as configured (illustrative)", or a supplied causal link), a tracer follows the supplied order and the focus element enlarges. At the hold each section shows its state as supplied: piece in place, or to complete (a neutral empty slot). No section is required and no deadline, court or consequence is stated.',
    tags: ['claim preparation', 'mechanism', 'written filing', 'sections', 'case file', 'relationships', 'party A', 'party B', 'calendar'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/preparacion-demanda.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/badges.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PD_STRINGS,
  scene,
});
