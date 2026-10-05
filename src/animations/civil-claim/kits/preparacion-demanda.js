/**
 * Motif kit for "Preparación de demanda" (LAW-0245..0248): fields, fictional
 * defaults, the drafting stage and its pose solver. Each entry owns its own
 * timeline, layout, labels and semantics. The shared civil-claim art
 * (civil-claim-art.js) and the pilot kit's label helpers
 * (requerimiento-previo.js) are imported READ-ONLY; nothing here changes them.
 *
 * The stage (side view, stage units = design units, the counter top at y = 0):
 *   Party A stands behind a counter (upper body shown; the counter's front panel
 *   hides the hips) facing right. On the counter stands a drafting frame: at its
 *   left a column of three trays (bandejas), at its right the written filing
 *   (escrito) clipped to the frame, with a header (title, reference, the parties
 *   ● / ◆, the date line) and three section rows; each tray is level with its
 *   section and a runner joins them. The case file (expediente) stands on the
 *   counter at the right end (wide frames) or on a wall shelf above (tall
 *   frames); a wall calendar shows the supplied day.
 *
 * Action (clock c ∈ [0,1], `stageChoreo`): Party A's near hand reaches the left
 *   edge of each supplied card in turn, pushes it (hand on the edge) and lets
 *   go; the card slides along its runner into its section of the filing.
 *   A section whose piece is not supplied in the configured example keeps its
 *   neutral empty slot (a dashed outline: dashes only because it is genuinely
 *   pending). Nothing here states which sections a filing needs, any time
 *   limit, fee, court, admissibility or consequence: the sections, their pieces
 *   and every date are supplied data drawn as supplied.
 * @module animations/civil-claim/kits/preparacion-demanda
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {fitG, backWall} from './civil-claim-art.js';
import {gchip, keyChip, hit} from './requerimiento-previo.js';

export {fitG, gchip, keyChip, hit};

const INK = '#1f2328';
const NB = '\u00a0';

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (prepares the filing) and Party B (the other party named in it), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) the pieces belong to', {ref: str('Reference on the file tab', 30), title: str('Title on the file plate', 60)}, ['ref', 'title']),
  filing: obj('The written filing being assembled', {ref: str('Reference printed on the filing', 30), title: str('Title printed on the filing', 70)}, ['ref', 'title']),
}, ['caseFile', 'filing']);
export const sectionsField = list('The filing’s sections as configured in this fictional example (nothing states which sections a filing needs): the heading printed on the filing and the text of the supplied piece that goes into it', obj('Section', {
  heading: str('Section heading printed on the filing', 36),
  item: str('Text on the supplied piece (card) for this section; not drawn while the section is pending', 90),
}, ['heading', 'item']), 3, 3);
export const datesField = obj('Dates, supplied placeholders only (nothing is inferred from them)', {
  filing: str('Date line printed on the filing', 50),
  calendar: str('Day shown on the wall calendar', 24),
}, ['filing', 'calendar']);
export const stagesField = obj('State captions (descriptive only; no conclusion)', {
  filled: str('Tag when every configured section holds its piece', 60),
  pending: str('Tag at a section that is still empty in this configured example (not a defect, rejection or penalty)', 60),
}, ['filled', 'pending']);
export const labelProps = {calendar: str('Caption on the wall calendar’s hanger bar', 40)};
export const pendingField = int('Zero-based index of the section left empty in this configured example (used when a section is pending)', 0, 2);

export const PD_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Prepares the filing'}, {name: 'Party B', role: 'Named in the filing'}],
  documents: {
    caseFile: {ref: 'CF-0520', title: 'Case file · fictional claim'},
    filing: {ref: 'Draft F-0520/1', title: 'Written claim · fictional draft'},
  },
  sections: [
    {heading: 'Facts', item: 'The fictional parcel arrived damaged on Day 2'},
    {heading: 'Requests', item: 'Replace the fictional parcel (as supplied)'},
    {heading: 'Documents', item: 'Delivery note D-17 (fictional)'},
  ],
  dates: {filing: 'Dated: Day 6 (as supplied)', calendar: 'Day 6'},
  stages: {filled: 'All sections filled (as supplied)', pending: 'Section to complete (as supplied)'},
  labels: {calendar: 'Drafting day'},
};
export const PD_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Prepara el escrito'}, {name: 'Parte B', role: 'Nombrada en el escrito'}],
  documents: {
    caseFile: {ref: 'EXP-0520', title: 'Expediente · reclamación ficticia'},
    filing: {ref: 'Borrador E-0520/1', title: 'Escrito de demanda · borrador ficticio'},
  },
  sections: [
    {heading: 'Hechos', item: 'El paquete ficticio llegó dañado el día 2'},
    {heading: 'Peticiones', item: 'Sustituir el paquete ficticio (según lo aportado)'},
    {heading: 'Documentos', item: 'Albarán D-17 (ficticio)'},
  ],
  dates: {filing: 'Fecha: día 6 (según lo aportado)', calendar: 'Día 6'},
  stages: {filled: 'Todos los apartados rellenos (según lo aportado)', pending: 'Apartado por completar (según lo aportado)'},
  labels: {calendar: 'Día de redacción'},
};

/**
 * With locale "es", every field still at its English default is shown with its Spanish default instead (a field the
 * user has set is kept as supplied). Returns new params; other locales are returned unchanged.
 * @param {any} params merged params
 * @param {any} en the module's English defaults
 * @param {any} es the module's Spanish defaults (same shape, any subset of fields)
 */
export function localizeDefaults(params, en, es) {
  if (!params || params.locale !== 'es') return params;
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const walk = (p, e, s2) => {
    if (s2 === undefined) return p;
    if (same(p, e)) return JSON.parse(JSON.stringify(s2));
    if (Array.isArray(p) && Array.isArray(e) && Array.isArray(s2) && p.length === e.length) return p.map((v, i) => walk(v, e[i], s2[i]));
    if (p && e && s2 && typeof p === 'object' && typeof e === 'object' && !Array.isArray(p)) {
      const out = {...p};
      for (const k of Object.keys(s2)) if (k in p && k in e) out[k] = walk(p[k], e[k], s2[k]);
      return out;
    }
    return p;
  };
  return walk(params, en, es);
}

export const PD_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)', t_filing: 'Filing', t_trays: 'Trays', t_caseFile: 'Case file', t_calendar: 'Calendar'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado', sequence: 'Secuencia según lo configurado (ilustrativa)', t_filing: 'Escrito', t_trays: 'Bandejas', t_caseFile: 'Expediente', t_calendar: 'Calendario'},
};

/** "● Party A · ◆ Party B": the two parties told apart by solid glyphs (never by dashes or weight). */
export function partyLine(p) {
  return `●${NB}${p.parties[0].name} · ◆${NB}${p.parties[1].name}`;
}
/** Name chip text for party i ("● Party A · Prepares the filing"). */
export function partyCaption(p, i) {
  const a = p.parties[i];
  return `${i ? '◆' : '●'}${NB}${a.name}${a.role ? ` · ${a.role}` : ''}`;
}
export function sectionHeading(p, i) {
  return `${i + 1}${NB}·${NB}${p.sections[i].heading}`;
}
export function looksOf(ctx, p) {
  return {a: actorLook(ctx, p.parties[0], 0), b: actorLook(ctx, p.parties[1], 1)};
}

/** px at 1080p per design unit for the current view. */
export function pxPerUnit(ctx) {
  return Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

/* ======================================================================== */
/* Art                                                                       */
/* ======================================================================== */

/** Neutral filler bars used on props when text is hidden (or on compact props). */
export function bars(x, y, w, n, lh, th, key, rng) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 && n > 1 ? w * (0.45 + rng(`${key}-b`, i) * 0.3) : w * (0.8 + rng(`${key}-b`, i) * 0.2);
    out.push(h('rect', {'data-bar': 1, x: r(x), y: r(y + i * lh), width: r(lw), height: r(lh * 0.36), rx: r(lh * 0.18), fill: th.paperLine}));
  }
  return out;
}

/**
 * A supplied piece (card). Local origin = bottom-left corner. The bottom `mb` of
 * the card is blank (a tray's lip may cover it).
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, ts:number, fit:any, showText:boolean, idx:number, compact?:boolean, band:number, pad:number}} o
 */
export function itemCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: ch, ts, band, pad} = o;
  const top = -ch;
  const tint = ['#e7dcc4', '#dfe3d2', '#d9e2ea'][o.idx % 3];
  const parts = [
    h('path', {d: roundRectPath(5, top + 6, w, ch, 7), fill: th.shadow}),
    h('path', {d: roundRectPath(0, top, w, ch, 7), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M7 ${r(top)}H${r(w - 7)}Q${r(w)} ${r(top)} ${r(w)} ${r(top + 7)}V${r(top + band)}H0V${r(top + 7)}Q0 ${r(top)} 7 ${r(top)}Z`, fill: tint, stroke: INK, 'stroke-width': 2}),
  ];
  const tx = pad, ty = top + band + pad * 0.8;
  if (o.compact) {
    // compact piece: a number disc and filler lines (its supplied text is printed once elsewhere)
    const R = ts * 0.62;
    parts.push(h('circle', {cx: r(tx + R), cy: r(ty + R), r: r(R), fill: tint, stroke: INK, 'stroke-width': 2}));
    if (o.showText) parts.push(h('text', {x: r(tx + R), y: r(ty + R + ts * 0.34), 'text-anchor': 'middle', 'font-size': r(ts, 2), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: INK, name: `${o.name}-num`}, String(o.idx + 1)));
    parts.push(...bars(tx + R * 2 + ts * 0.4, ty + ts * 0.15, w - pad * 2 - R * 2 - ts * 0.4, 2, ts * 0.8, th, `${o.name}-cb`, ctx.rng));
  } else if (o.showText) parts.push(textBlock(o.fit, {x: tx, y: ty, fill: INK, name: `${o.name}-text`}));
  else parts.push(...bars(tx, ty + ts * 0.25, w - pad * 2, o.fit.lines.length, ts * 1.18, th, `${o.name}-tb`, ctx.rng));
  return g({name: o.name}, parts);
}

/**
 * Wall calendar block: a hanger bar with the supplied caption and a page with the supplied day. Local origin =
 * top-left of the hanger bar.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, ts:number, title:any, day:any, showText:boolean}} o  fitted title/day
 */
export function wallCalendar(ctx, o) {
  const th = ctx.theme;
  const {w, ts} = o;
  const barH = o.compact ? ts * 0.6 : o.title.height + ts * 0.7;
  const pageH = o.h - barH;
  const H = o.h;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(6, 8, w, H, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, barH - 6, w, pageH + 6, 6), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M8 ${r(H - 6)}H${r(w - 8)}M12 ${r(H - 11)}H${r(w - 12)}`, stroke: th.paperLine, 'stroke-width': 2}),
    h('path', {d: roundRectPath(0, 0, w, barH, 6), fill: th.accent2, stroke: INK, 'stroke-width': 2.4}),
    ...[0.22, 0.78].map(k => h('path', {d: `M${r(w * k)} ${r(ts * 0.3)}v${r(-ts * 0.75)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'})),
    o.showText && !o.compact ? textBlock(o.title, {x: w / 2, y: (barH - o.title.height) / 2, anchor: 'middle', fill: '#fff', name: `${o.name}-title`})
      : bars(w * 0.2, barH / 2 - ts * 0.18, w * 0.6, 1, ts, {paperLine: 'rgba(255,255,255,0.55)'}, `${o.name}-tb`, ctx.rng),
    o.showText ? textBlock(o.day, {x: w / 2, y: barH + (pageH - o.day.height) / 2, anchor: 'middle', fill: INK, name: `${o.name}-day`})
      : bars(w * 0.22, barH + pageH / 2 - ts * 0.2, w * 0.56, 1, ts, th, `${o.name}-db`, ctx.rng),
  );
  return {node, w, h: H};
}

/** Upper body of a standing party behind the counter: body layer and near-arm layer (legs are hidden). */
export function upperParty(ctx, o) {
  const rig = personRig(ctx, {name: o.name, look: o.look, pose: 'standing'});
  const [far, legs, upper, near] = rig.node.children;
  // (o.full: the whole figure, standing on the floor; otherwise the legs are hidden behind a counter)
  const body = o.full ? g({name: o.name}, far, legs, upper) : g({name: o.name}, far, upper);
  const nearNode = g({name: `${o.name}-nw`}, near);
  return {
    body,
    near: nearNode,
    frame(s) {
      const out = rig.frame(s);
      out.nodes[`${o.name}-nw`] = {transform: out.nodes[o.name].transform};
      return out;
    },
  };
}

/* ======================================================================== */
/* Stage plan                                                                */
/* ======================================================================== */

/** Person proportions (personRig local units). */
const SHOULDER = {x: 12, y: -302};
const HIP = {x: 0, y: -186};
const HEAD_C = {x: 5, y: -366};
const HEAD_R = 36;
const REACH = 80 + 76 + 15 * 0.6;
/** the counter top sits this far above the feet (local units): the hips are just hidden */
const COUNTER_LOCAL = 205;
/** fingertips lie about this far beyond the IK hand point (local units) */
const FINGER = 14;

/**
 * Geometry of a drafting stage (no nodes). Cheap: text fits are memoised by the text engine.
 * The case file (expediente) is the standing open folder at the left of the frame: its tab carries the reference,
 * its plate the title, and its three pockets are the trays holding the supplied pieces.
 * @param {any} ctx
 * @param {{p:any, ts:number, CW:number, PK:number, mode:'calTop'|'calRight', compact?:boolean, xTK?:number, flaps?:boolean, showText:boolean}} o
 */
export function planStage(ctx, o) {
  const {p, ts, CW, PK} = o;
  const compact = Boolean(o.compact);
  // (o.textCards with compact: the header, case file and calendar are compact but the pieces and headings keep their text)
  const cc = compact && !o.textCards;
  const pad = 0.5 * ts, band = 0.32 * ts, lipH = (cc ? 0.4 : 0.72) * ts, mb = lipH + (cc ? 0.22 : 0.4) * ts;
  const sm = 0.45 * ts, sgx = 0.22 * ts, sg = 0.22 * ts;
  // (compact: the section numbers sit in a column right of the slots instead of a heading line above them)
  const numCol = cc ? 1.25 * ts : 0;
  const SW = CW + 2 * sm + 2 * sgx + numCol;
  const inner = SW - 2 * sm;
  // (the text fits depend only on the text size and the card width: memoised per solve)
  const fk = `${ts}|${CW}|${compact}|${cc}|${o.trayK ?? 1}`;
  let F = o.fitCache && o.fitCache.get(fk);
  if (!F) {
    const TW0 = CW * (o.trayK ?? 1) + 0.6 * ts;
    F = {
      itemFits: p.sections.map(s => fitG(s.item, {maxWidth: CW - 2 * pad, size: ts, minSize: ts, maxLines: 8, weight: 600})),
      headFits: p.sections.map((s, i) => fitG(sectionHeading(p, i), {maxWidth: inner, size: ts, minSize: ts, maxLines: 3, weight: 700})),
      hf: compact ? null : {
        ref: fitG(p.documents.filing.ref, {maxWidth: inner, size: ts, minSize: ts, maxLines: 2, weight: 600, family: 'mono'}),
        title: fitG(p.documents.filing.title, {maxWidth: inner, size: ts, minSize: ts, maxLines: 4, weight: 700, family: 'serif'}),
        parties: fitG(partyLine(p), {maxWidth: inner, size: ts, minSize: ts, maxLines: 6, weight: 600}),
        date: fitG(p.dates.filing, {maxWidth: inner, size: ts, minSize: ts, maxLines: 3, weight: 500}),
      },
      cfTitle: compact ? null : fitG(p.documents.caseFile.title, {maxWidth: TW0 - ts, size: ts, minSize: ts, maxLines: 4, weight: 700, family: 'serif'}),
      cfRef: compact ? null : fitG(p.documents.caseFile.ref, {maxWidth: TW0 - ts * 1.2, size: ts, minSize: ts, maxLines: 2, weight: 700, family: 'mono'}),
      calTitle: fitG(p.labels.calendar, {maxWidth: ts * 8.6, size: ts, minSize: ts, maxLines: 3, weight: 700}),
      calDay: fitG(p.dates.calendar, {maxWidth: ts * 8.6, size: ts, minSize: ts, maxLines: 3, weight: 700}),
    };
    if (o.fitCache) o.fitCache.set(fk, F);
  }
  const {itemFits, headFits, hf, cfTitle, cfRef, calTitle, calDay} = F;
  // (a plan whose printed texts would break a word or a reference — "CF-2024-000520-AB" at a hyphen — or leave a 1–2
  // character line is not used)
  const wordsOk = !o.showText || ([...(cc ? [] : itemFits), ...(cc ? [] : headFits), ...(hf ? [hf.title, hf.parties, hf.date] : []), cfTitle, calTitle, calDay].filter(Boolean).every(f => wholeFit(f)) && [hf && hf.ref, cfRef].filter(Boolean).every(f => wholeFit(f, true)));
  const textH = cc ? ts * 1.3 : Math.max(...itemFits.map(f => f.height));
  const CH = band + pad * 0.8 + textH + mb;
  const headH = cc ? 0 : Math.max(...headFits.map(f => f.height));
  const slotH = CH + 2 * sg;
  const rowGap = (cc ? 0.25 : 0.5) * ts;
  const pitch = headH + (cc ? 0 : 0.25 * ts) + slotH + rowGap;
  const headerH = compact ? ts * 1.55 : sm * 0.9 + hf.ref.height + 0.3 * ts + hf.title.height + 0.3 * ts + hf.parties.height + 0.5 * ts + hf.date.height + 0.6 * ts;

  // ---- horizontal
  const xT = (o.xTK ?? 74) * PK;
  const tp = 0.3 * ts;
  // (o.trayK: a narrower tray column — an end-state stage whose trays are already empty)
  const TW = CW * (o.trayK ?? 1) + 2 * tp;
  const gx = (compact ? 0.5 : 0.7) * ts;
  const bx0 = xT - 0.3 * ts, bx1 = xT + TW + 0.3 * ts;   // the case file's back board
  const xS = bx1 + gx;
  const postW = Math.max(12, ts * 0.45);
  const postL = bx0 - postW - 6, postR = xS + SW + 6;
  const frameR = postR + postW;

  // ---- vertical (the counter top is y = 0; the frame stands on it)
  const baseH = 0.7 * ts;
  const rows = [];
  const rowBottom2 = -baseH - 0.35 * ts;
  const rowTop0 = rowBottom2 - 3 * pitch + rowGap;
  for (let i = 0; i < 3; i++) {
    const top = rowTop0 + i * pitch;
    const slotTop = top + headH + (cc ? 0 : 0.25 * ts);
    const cardTop = slotTop + sg;
    const runner = cardTop + CH;
    rows.push({top, slotTop, cardTop, runner, mid: cardTop + (CH - mb) / 2 + band / 2, slot: {x: xS + sm, y: slotTop, w: SW - 2 * sm - numCol, h: slotH}});
  }
  const sheetTop = rowTop0 - headerH - 0.25 * ts;
  const sheetBottom = rows[2].runner + sg + 0.4 * ts;

  // the case file: title plate over the pockets, the reference tab on top
  const trayTop0 = rows[0].cardTop - 0.35 * ts;
  const plateH = compact ? ts * 1.25 : cfTitle.height + ts * 0.6;
  const plateY = trayTop0 - plateH - 0.3 * ts;
  const plateW = TW;
  const boardTop = plateY - 0.35 * ts;
  const tabH = compact ? ts * 1.1 : cfRef.height + ts * 0.55;
  const tabW = compact ? TW * 0.4 : Math.max(TW * 0.4, cfRef.width + ts * 0.9);
  const tabTop = boardTop - tabH + 6;
  const frameTop = Math.min(sheetTop, tabTop) - 0.55 * ts;

  // ---- person (upper body) behind the counter
  const feetY = COUNTER_LOCAL * PK;
  const headC = {x: HEAD_C.x * PK, y: feetY + HEAD_C.y * PK};
  const headR = HEAD_R * PK;
  const headTop = feetY - 418 * PK;
  const restNear = {x: 44 * PK, y: -4};
  const restFar = {x: 26 * PK, y: -4};
  const PUSH = Math.max(40, 1.7 * ts);
  const grips = rows.map(rw => ({x: xT + tp - FINGER * PK - 1, y: rw.mid}));
  const pushes = grips.map(q => ({x: q.x + PUSH, y: q.y}));
  const D = (xS + sm + sgx) - (xT + tp);

  // reach and face clearance (straight shoulder → hand segment; the elbow bends below it)
  const lean = q => leanFor(PK, feetY, q);
  const reachOk = [...grips, ...pushes].every(q => lean(q) <= 16);
  const faceOk = [...grips, ...pushes].every(q => {
    const sh = shoulderAt(PK, feetY, lean(q));
    const hc = headAt(PK, feetY, lean(q));
    return segDist(hc, sh, q) >= headR + 0.25 * ts && Math.hypot(q.x - hc.x, q.y - hc.y) >= headR + 22 * PK;
  });

  // ---- calendar: on the wall above the person's head ('calTop') or right of the frame ('calRight')
  const personX0 = -54 * PK, personX1 = 50 * PK;
  // (compact: the caption bar carries filler only — the caption is printed once elsewhere — and the page the day)
  const calW = compact ? Math.max(ts * 4.4, calDay.width + ts * 1.2) : Math.max(ts * 5.4, calTitle.width, calDay.width) + ts * 1.2;
  const calH = compact ? ts * 0.6 + calDay.height + ts * 0.95 : calTitle.height + ts * 0.7 + calDay.height + ts * 1.3;
  let cal;
  if (o.mode === 'calTop') cal = {x: Math.max(personX0, bx0 - 0.9 * ts - calW - 20 * PK), y: headTop - 0.9 * ts - calH, w: calW, h: calH};
  else cal = {x: frameR + 1.1 * ts, y: frameTop + 0.4 * ts, w: calW, h: calH};
  // (a calendar above the head never reaches under the frame's post: such a plan is not used)
  const calOk = o.mode !== 'calTop' || cal.x + cal.w <= postL - 0.2 * ts;

  // ---- extents
  // below the counter top: the counter's front panel, or (o.full) the stand's legs down to the floor strip
  const floorH = 0.8 * ts;
  const panelH = o.full ? feetY + floorH : compact ? Math.max(27 * PK, 1.2 * ts) : Math.max(34 * PK, 1.6 * ts);
  // (o.reserveTop / o.reserveRight: free wall kept above the frame / right of it for a state tag)
  const top = Math.min(headTop, frameTop - (o.reserveTop ? o.reserveTop + 0.5 * ts : 0), cal.y - 12);
  const x0 = Math.min(personX0, cal.x) - 0.4 * ts;
  const x1 = Math.max(frameR + (o.reserveRight ? o.reserveRight + 0.7 * ts : 0), cal.x + cal.w) + 0.4 * ts;
  const wallPad = (compact ? 0.35 : 0.9) * ts;
  const ext = {x: x0, y: top - wallPad, w: x1 - x0, h: -(top - wallPad) + panelH};

  return {
    ...o, compact, cc, numCol, pad, band, lipH, mb, itemFits, textH, CH, sm, sgx, sg, SW, inner, headFits, headH, slotH, rowGap, pitch, hf, headerH,
    xT, tp, TW, gx, bx0, bx1, xS, postW, postL, postR, frameR, baseH, rows, sheetTop, sheetBottom, frameTop,
    cfTitle, cfRef, plateH, plateY, plateW, boardTop, tabH, tabW, tabTop, trayTop0,
    feetY, headC, headR, headTop, restNear, restFar, PUSH, grips, pushes, D, reachOk, faceOk, wordsOk, calOk,
    cal, calTitle, calDay, panelH, floorH, full: Boolean(o.full), ext, personX0, personX1,
    leanOf: lean,
  };
}

function shoulderAt(PK, feetY, lean) {
  const a = lean * Math.PI / 180;
  const dx = SHOULDER.x - HIP.x, dy = SHOULDER.y - HIP.y;
  return {x: (HIP.x + dx * Math.cos(a) - dy * Math.sin(a)) * PK, y: feetY + (HIP.y + dx * Math.sin(a) + dy * Math.cos(a)) * PK};
}
function headAt(PK, feetY, lean) {
  const a = lean * Math.PI / 180;
  const dx = HEAD_C.x - HIP.x, dy = HEAD_C.y - HIP.y;
  return {x: (HIP.x + dx * Math.cos(a) - dy * Math.sin(a)) * PK, y: feetY + (HIP.y + dx * Math.sin(a) + dy * Math.cos(a)) * PK};
}
/** distance from point c to segment ab */
function segDist(c, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const t = clamp(((c.x - a.x) * vx + (c.y - a.y) * vy) / (vx * vx + vy * vy || 1));
  return Math.hypot(a.x + vx * t - c.x, a.y + vy * t - c.y);
}
/** Smallest forward lean (0…24°) that brings `q` within reach (continuous in q). 99 when unreachable. */
function leanFor(PK, feetY, q) {
  const R = REACH * PK * 0.975;
  const d = lean => { const s = shoulderAt(PK, feetY, lean); return Math.hypot(q.x - s.x, q.y - s.y); };
  if (d(0) <= R) return 0;
  if (d(24) > R) return 99;
  let lo = 0, hi = 24;
  for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (d(mid) <= R) hi = mid; else lo = mid; }
  return hi;
}

/* ======================================================================== */
/* Stage build                                                               */
/* ======================================================================== */

/**
 * Build the stage nodes from a plan.
 * @param {any} ctx
 * @param {any} G  planStage() result
 * @param {{prefix:string, looks:{a:any}, supplied:boolean[], wallX0?:number, wallX1?:number, wallTop?:number, flaps?:boolean}} o
 *   supplied[i]: whether section i's piece is supplied (a pending section's tray holds no card)
 */
export function buildStage(ctx, G, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {ts, showText} = G;
  const A = upperParty(ctx, {name: `${P}-pa`, look: o.looks.a, full: G.full});
  const wx0 = o.wallX0 ?? G.ext.x, wx1 = o.wallX1 ?? G.ext.x + G.ext.w;
  const wallTop = Math.min(G.ext.y, o.wallTop ?? G.ext.y);
  // ---- wall (a backdrop only: never a sign of anything)
  const wall = G.full
    ? g({name: `${P}-wall`}, g({transform: T(0, G.feetY)}, backWall(ctx, {x0: wx0, x1: wx1, top: wallTop - G.feetY, plantX: null})))
    : g({name: `${P}-wall`}, backWall(ctx, {x0: wx0, x1: wx1, top: wallTop, plantX: null}));
  // ---- counter (its front panel hides the person's hips) or (full figure) a drafting stand on legs
  const sx0 = Math.min(28 * G.PK, G.postL - 16), sx1 = G.frameR + 14;
  const counter = G.full ? g({name: `${P}-counter`},
    ...[sx0 + 22, sx1 - 22].map(x => h('rect', {x: r(x - 9), y: 0, width: 18, height: r(G.feetY - 6), fill: shade(th.wood, -0.12), stroke: INK, 'stroke-width': 2.2})),
    ...[sx0 + 22, sx1 - 22].map(x => h('rect', {x: r(x - 16), y: r(G.feetY - 8), width: 32, height: 8, rx: 3, fill: shade(th.wood, -0.3), stroke: INK, 'stroke-width': 2})),
    h('rect', {x: r(sx0 + 22), y: r(G.feetY * 0.55), width: r(sx1 - sx0 - 44), height: 12, rx: 4, fill: shade(th.wood, -0.05), stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(sx0), y: -12, width: r(sx1 - sx0), height: 20, rx: 5, fill: th.woodTop, stroke: INK, 'stroke-width': 2.4}),
  ) : g({name: `${P}-counter`},
    h('rect', {x: r(wx0), y: 0, width: r(wx1 - wx0), height: r(G.panelH), fill: th.wood}),
    h('path', {d: `M${r(wx0)} ${r(G.panelH * 0.55)}H${r(wx1)}`, stroke: shade(th.wood, -0.14), 'stroke-width': 2}),
    h('rect', {x: r(wx0), y: -12, width: r(wx1 - wx0), height: 16, rx: 5, fill: th.woodTop, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(wx0)} ${r(G.panelH)}H${r(wx1)}`, stroke: INK, 'stroke-width': 2.4}),
  );
  // ---- frame posts, top bar, foot rail
  const fr = g({name: `${P}-frame`},
    h('rect', {x: r(G.postL), y: r(G.frameTop), width: r(G.postW), height: r(-G.frameTop), rx: 4, fill: th.woodDark, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(G.postR), y: r(G.frameTop), width: r(G.postW), height: r(-G.frameTop), rx: 4, fill: th.woodDark, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(G.postL - 6), y: r(G.frameTop - 4), width: r(G.frameR - G.postL + 12), height: r(G.postW + 4), rx: 5, fill: th.wood, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(G.postL - 10), y: r(-G.baseH), width: r(G.frameR - G.postL + 20), height: r(G.baseH - 10), rx: 5, fill: th.wood, stroke: INK, 'stroke-width': 2.2}),
  );
  // ---- the written filing
  const sheet = filingSheetNode(ctx, G, P);
  // ---- the case file: back board with its reference tab and title plate; its three pockets are the trays
  const cfc = '#c9a15e';
  const bw = G.bx1 - G.bx0;
  const tabX = G.bx1 - G.tabW - ts * 0.3;
  const cfParts = [
    h('path', {d: roundRectPath(G.bx0 + 7, G.boardTop + 8, bw, -G.baseH - G.boardTop, 9), fill: th.shadow}),
    h('path', {d: `M${r(tabX)} ${r(G.boardTop + 4)}V${r(G.tabTop + 8)}Q${r(tabX)} ${r(G.tabTop)} ${r(tabX + 8)} ${r(G.tabTop)}H${r(tabX + G.tabW - 8)}Q${r(tabX + G.tabW)} ${r(G.tabTop)} ${r(tabX + G.tabW)} ${r(G.tabTop + 8)}V${r(G.boardTop + 4)}Z`, fill: shade(cfc, 0.1), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(G.bx0, G.boardTop, bw, -G.baseH - G.boardTop, 9), fill: cfc, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(G.bx0), y: r(G.boardTop), width: r(ts * 0.45), height: r(-G.baseH - G.boardTop), rx: 4, fill: shade(cfc, -0.18)}),
    h('path', {d: roundRectPath(G.xT, G.plateY, G.plateW, G.plateH, 6), fill: th.paper, stroke: INK, 'stroke-width': 2}),
  ];
  if (G.compact) {
    cfParts.push(...bars(G.xT + ts * 0.45, G.plateY + G.plateH / 2 - ts * 0.18, G.plateW - ts * 0.9, 1, ts, th, `${P}-cftb`, ctx.rng));
    cfParts.push(...bars(tabX + ts * 0.4, G.tabTop + G.tabH / 2 - ts * 0.25, G.tabW - ts * 0.8, 1, ts, th, `${P}-cfrb`, ctx.rng));
  } else if (showText) {
    cfParts.push(textBlock(G.cfTitle, {x: G.xT + ts * 0.5, y: G.plateY + (G.plateH - G.cfTitle.height) / 2, fill: INK, name: `${P}-cf-title`}));
    cfParts.push(textBlock(G.cfRef, {x: tabX + G.tabW / 2, y: G.tabTop + ts * 0.3, anchor: 'middle', fill: INK, name: `${P}-cf-ref`}));
  } else {
    cfParts.push(...bars(G.xT + ts * 0.5, G.plateY + ts * 0.5, G.plateW - ts, G.cfTitle.lines.length, ts * 1.18, th, `${P}-cftb`, ctx.rng));
    cfParts.push(...bars(tabX + ts * 0.4, G.tabTop + ts * 0.45, G.tabW - ts * 0.8, G.cfRef.lines.length, ts * 1.18, th, `${P}-cfrb`, ctx.rng));
  }
  const cfBoard = g({name: `${P}-cfg`}, cfParts);
  // ---- trays (pockets of the case file): back panels behind the cards, lips in front of them, runners
  const trayBack = [], trayFront = [], runners = [];
  const lipTopOf = i => G.rows[i].runner - G.lipH;
  G.rows.forEach((rw, i) => {
    const y0 = rw.cardTop - 0.35 * ts;
    trayBack.push(h('path', {d: roundRectPath(G.xT, y0, G.TW, rw.runner - y0 + 6, 6), fill: '#efe3c8', stroke: INK, 'stroke-width': 2}));
    trayFront.push(g(null,
      h('path', {d: roundRectPath(G.xT - 4, lipTopOf(i), G.TW + 8, G.lipH + 8, 5), fill: '#8aa2b1', stroke: INK, 'stroke-width': 2.4}),
      h('rect', {x: r(G.xT + 6), y: r(lipTopOf(i) + 4), width: r(G.TW - 12), height: 3, rx: 1.5, fill: '#fff', opacity: 0.3}),
    ));
    // the runner: from inside the tray to the far end of the section's slot, the card's running surface
    runners.push(h('rect', {x: r(G.xT + 2), y: r(rw.runner), width: r(rw.slot.x + rw.slot.w - G.xT - 2), height: 6, rx: 3, fill: th.metal, stroke: INK, 'stroke-width': 1.6}));
  });
  // ---- cards (a pending section's tray holds none)
  const cards = G.rows.map((rw, i) => (o.supplied[i]
    ? g({name: `${P}-card${i}`, transform: T(G.xT + G.tp, rw.runner)}, itemCard(ctx, {name: `${P}-c${i}`, w: G.CW, h: G.CH, ts, fit: G.itemFits[i], showText, idx: i, compact: G.cc, band: G.band, pad: G.pad}))
    : null));
  // ---- tray flaps (contrast: the trays are covered until the change beat)
  const flaps = o.flaps ? G.rows.map((rw, i) => {
    const y0 = rw.cardTop - 0.3 * ts, y1 = lipTopOf(i) + 2;
    return g({name: `${P}-flap${i}`, transform: scaleAbout(0, y1, 1, 1)},
      h('path', {d: roundRectPath(G.xT - 2, y0, G.TW + 4, y1 - y0, 6), fill: '#c9d5dc', stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: `M${r(G.xT + G.TW * 0.42)} ${r(y0 + (y1 - y0) * 0.5)}h${r(G.TW * 0.16)}`, stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  }) : [];
  const calNode = g({transform: T(G.cal.x, G.cal.y)}, wallCalendar(ctx, {name: `${P}-cal`, w: G.cal.w, h: G.cal.h, ts, title: G.calTitle, day: G.calDay, showText, compact: G.compact}).node);

  const node = g({name: P},
    wall,
    calNode,
    fr,
    sheet.node,
    cfBoard,
    g({name: `${P}-trays`}, trayBack),
    runners,
    cards,
    g({name: `${P}-lips`}, trayFront),
    flaps,
    A.body,
    counter,
    A.near,
  );

  /**
   * @param {any} v  stageChoreo() values
   */
  function pose(v) {
    const nodes = {};
    const fa = A.frame({x: 0, y: G.feetY, facing: 1, scale: G.PK, lean: v.lean, near: v.hand, far: G.restFar, headTilt: v.head ?? 0});
    Object.assign(nodes, fa.nodes);
    G.rows.forEach((rw, i) => {
      if (o.supplied[i]) nodes[`${P}-card${i}`] = {transform: T(G.xT + G.tp + v.dx[i], rw.runner)};
      if (o.flaps) nodes[`${P}-flap${i}`] = {transform: scaleAbout(0, lipTopOf(i) + 2, 1, r(Math.max(0.04, 1 - 0.96 * (v.flap ?? 0)), 4))};
    });
    return {nodes, hands: fa.hands, head: fa.head, reached: fa.reached};
  }
  return {node, pose, sheet};
}

/** The written filing: header, three section rows with neutral empty slots. */
function filingSheetNode(ctx, G, P) {
  const th = ctx.theme;
  const {ts, showText, xS, SW, sm} = G;
  const x = xS, y = G.sheetTop, w = SW, hh = G.sheetBottom - G.sheetTop;
  const fold = ts * 0.9;
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 5), fill: th.shadow}),
    h('path', {d: `M${r(x)} ${r(y + 4)}Q${r(x)} ${r(y)} ${r(x + 4)} ${r(y)}H${r(x + w - fold)}L${r(x + w)} ${r(y + fold)}V${r(y + hh - 4)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - 4)} ${r(y + hh)}H${r(x + 4)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - 4)}Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + w - fold)} ${r(y)}V${r(y + fold * 0.85)}Q${r(x + w - fold)} ${r(y + fold)} ${r(x + w - fold * 0.85)} ${r(y + fold)}H${r(x + w)}Z`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    // the clip holding the sheet to the frame's top bar
    h('rect', {x: r(x + w * 0.32), y: r(y - ts * 0.55), width: r(w * 0.36), height: r(ts * 0.9), rx: 5, fill: th.metal, stroke: INK, 'stroke-width': 2.2}),
  ];
  // header
  let yy = y + sm * 0.9;
  const tx = x + sm;
  if (G.compact) {
    parts.push(...bars(tx, yy + ts * 0.2, G.inner * 0.5, 1, ts, th, `${P}-hr`, ctx.rng));
    parts.push(...bars(tx, yy + ts * 0.7, G.inner, 1, ts, th, `${P}-ht`, ctx.rng));
  } else {
    const hf = G.hf;
    const place = (fit, fill, name) => {
      const n = showText ? textBlock(fit, {x: tx, y: yy, fill, name}) : bars(tx, yy + ts * 0.2, G.inner * 0.85, fit.lines.length, ts * 1.18, th, `${name}-b`, ctx.rng);
      yy += fit.height;
      return n;
    };
    parts.push(place(hf.ref, th.inkSoft, `${P}-href`)); yy += 0.3 * ts;
    parts.push(place(hf.title, INK, `${P}-htitle`)); yy += 0.3 * ts;
    parts.push(place(hf.parties, INK, `${P}-hparties`)); yy += 0.5 * ts;
    parts.push(place(hf.date, th.inkSoft, `${P}-hdate`));
  }
  parts.push(h('rect', {x: r(tx), y: r(G.rows[0].top - 0.45 * ts), width: r(G.inner), height: 3, fill: th.accent2}));
  // rows: heading + neutral empty slot (dashed only because it is genuinely empty until its piece arrives)
  G.rows.forEach((rw, i) => {
    if (G.cc) {
      // compact sheet: the section's number in the column right of its slot (its heading is printed once elsewhere)
      const R = ts * 0.55, cx = rw.slot.x + rw.slot.w + G.numCol / 2 + 2, cy = rw.slot.y + rw.slot.h / 2;
      parts.push(h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.paperShade, stroke: INK, 'stroke-width': 1.8}));
      if (showText) parts.push(h('text', {x: r(cx), y: r(cy + ts * 0.34), 'text-anchor': 'middle', 'font-size': r(ts, 2), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: INK, name: `${P}-head${i}`}, String(i + 1)));
    } else {
      parts.push(showText ? textBlock(G.headFits[i], {x: tx, y: rw.top, fill: INK, name: `${P}-head${i}`})
        : bars(tx, rw.top + ts * 0.2, G.inner * 0.45, G.headFits[i].lines.length, ts * 1.18, th, `${P}-hb${i}`, ctx.rng));
    }
    parts.push(h('path', {name: `${P}-slot${i}`, d: roundRectPath(rw.slot.x, rw.slot.y, rw.slot.w, rw.slot.h, 7), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-dasharray': '8 7'}));
  });
  return {
    node: g({name: `${P}-sheet`}, parts),
    box: {x, y: y - ts * 0.55, w, h: hh + ts * 0.55},
  };
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/** Card windows of the shared action (clock c): slot k occupies [k·SLOT, k·SLOT + SLOT]. */
export const SLOT = 0.28;
/** clock at which the hand starts towards the first card (before c = 0: the entry lets c run from this value) */
export const FIRST_REACH = -0.12;
const REACH_W = [0, 0.32], PUSH_W = [0.32, 0.5], SLIDE_W = [0.5, 0.96];
const RETURN = 0.14;

/** Clock (c) at which slot k's push starts and ends, and its card lands. */
export const slotTimes = k => ({reach: k * SLOT, push0: k * SLOT + PUSH_W[0] * SLOT, push1: k * SLOT + PUSH_W[1] * SLOT, land: k * SLOT + SLIDE_W[1] * SLOT});

/**
 * Order in which the cards are pushed: bottom row first. The arm's elbow bends below the shoulder → hand line, so
 * with the lower cards already gone no forearm or upper arm is ever drawn over a card still waiting in its tray.
 */
export const PUSH_ORDER = [2, 1, 0];
/** Clock windows of card k (its slot in the push order). */
export const cardTimes = (k, order = PUSH_ORDER) => slotTimes(order.indexOf(k));

/**
 * Hand, lean and card positions for clock c.
 * @param {number} c 0..1
 * @param {any} G stage plan
 * @param {boolean[]} supplied which cards exist (a pending section's tray is empty)
 * @param {number[]} [order] push order of the cards (default bottom row first)
 */
export function stageChoreo(c, G, supplied, order = PUSH_ORDER) {
  const e = ease.inOutCubic;
  // hand keyframes: rest → grip0 → push0 → grip1 → push1 → … → rest
  // (the hand leaves the counter a little before the first slot, so the first reach is never hurried)
  const keys = [[FIRST_REACH, G.restNear]];
  let last = -1;
  for (const k of order) {
    if (!supplied[k]) continue;
    const slot = order.indexOf(k);
    const t = slotTimes(slot);
    let prev = keys[keys.length - 1];
    const reach0 = keys.length === 1 ? FIRST_REACH : t.reach;
    // (a skipped, pending section: the hand goes back to the counter meanwhile instead of hanging in the air)
    if (last >= 0 && slot > order.indexOf(last) + 1) {
      const t0 = cardTimes(last, order).push1 + 0.04;
      keys.push([t0, prev[1]], [t0 + RETURN, G.restNear]);
      prev = keys[keys.length - 1];
    }
    if (reach0 > prev[0]) keys.push([reach0, prev[1]]);
    keys.push([t.push0, G.grips[k]]);
    keys.push([t.push1, G.pushes[k]]);
    last = k;
  }
  if (last >= 0) {
    const t = cardTimes(last, order);
    const holdEnd = Math.min(1 - RETURN, t.land - 0.02);
    keys.push([Math.max(t.push1, holdEnd), G.pushes[last]]);
    keys.push([Math.min(1, Math.max(t.push1, holdEnd) + RETURN), G.restNear]);
  }
  let hand = keys[keys.length - 1][1];
  for (let i = 1; i < keys.length; i++) {
    if (c <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i];
      const f = t1 > t0 ? e(clamp((c - t0) / (t1 - t0))) : 1;
      hand = {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f)};
      break;
    }
  }
  // (the hand keeps the pushed card's edge while it pushes: the linear push matches the card exactly)
  const dx = [0, 1, 2].map(k => {
    if (!supplied[k]) return 0;
    const t = cardTimes(k, order);
    if (c < t.push0) return 0;
    if (c < t.push1) return G.PUSH * e(seg(c, t.push0, t.push1));
    return G.PUSH + (G.D - G.PUSH) * ease.outCubic(seg(c, t.push1, t.land));
  });
  // during a push the hand is exactly on the card's edge
  for (let k = 0; k < 3; k++) {
    if (!supplied[k]) continue;
    const t = cardTimes(k, order);
    if (c >= t.push0 && c <= t.push1) hand = {x: G.grips[k].x + dx[k], y: G.grips[k].y};
  }
  const lean = Math.min(16, G.leanOf(hand));
  const landed = [0, 1, 2].map(k => supplied[k] && c >= cardTimes(k, order).land);
  const pushing = [0, 1, 2].findIndex(k => supplied[k] && c >= cardTimes(k, order).push0 && c <= cardTimes(k, order).push1);
  return {hand, lean, dx, landed, pushing, cardEdge: [0, 1, 2].map(k => ({x: G.xT + G.tp + dx[k], y: G.rows[k].mid}))};
}

/* ======================================================================== */
/* Solving a stage for a box                                                 */
/* ======================================================================== */

/**
 * Pick the stage plan for an available box (design units). Tries the text sizes in `tsList` (largest first), card
 * widths from wide to narrow, person scales and case-file modes; keeps the first text size with a fitting plan,
 * preferring the plan with the largest people, then the widest stage.
 * @param {any} ctx
 * @param {{p:any, availW:number, availH:number, tsList:number[], modes:string[], showText:boolean, compact?:boolean,
 *   PKs:number[], cwRange:[number,number], headMinUnits:number, extraH?:(G:any)=>number, flaps?:boolean, xTK?:number,
 *   prefer?:'wide'|'people'}} o
 */
/**
 * True when a fit keeps every word whole and no wrapped line holds only 1–2 characters. A compound word may break
 * after its own hyphen ("Oyelaran- / Castellanos"); with `strict` (references, codes) no break at all is allowed inside
 * a token ("CF-2024-000520-AB" stays on one line).
 * @param {any} fit fitG result
 * @param {boolean} [strict]
 */
export function wholeFit(fit, strict = false) {
  if (!fit || fit.truncated) return true;
  const norm = t => String(t).replace(/\u00a0/g, ' ').split(/\s+/).filter(Boolean).join(' ');
  const lines = fit.lines.map(l => l.trim());
  const joined = strict ? lines.join(' ') : lines.reduce((a, l) => (a && /[-‐]$/.test(a) ? a + l : a ? `${a} ${l}` : l), '');
  return lines.slice(1).every(l => l.length > 2) && norm(joined) === norm(fit.full);
}

export function solveStage(ctx, o) {
  let best = null;
  // the fullest stage first (the smaller of its width and height shares of the box, in 2 % steps), then the
  // largest people, then the widest stage
  const needH = G => G.ext.h + (o.extraH ? o.extraH(G) : 0);
  const score = G => [Math.round(Math.min(G.ext.w / o.availW, needH(G) / o.availH) * 50), G.PK, G.ext.w];
  const better = (a, b) => { const x = score(a), y = score(b); for (let k = 0; k < x.length; k++) if (Math.abs(x[k] - y[k]) > 1e-6) return x[k] > y[k]; return false; };
  const diag = [];
  const fitCache = new Map();
  let loose = null;
  // (o.tsUp: larger text sizes weighed together with the first one — the fullest stage wins; the list below the
  // first size is only walked down when nothing fits)
  const rounds = [[...(o.tsUp || []), o.tsList[0]], ...o.tsList.slice(1).map(t => [t])];
  for (const round of rounds) for (const ts of round) {
    const cws = [];
    for (let cw = o.cwRange[1]; cw >= o.cwRange[0] - 1e-6; cw -= ts * 0.6) cws.push(Math.round(cw));
    // (o.trayKs: tray-column widths tried in turn — a wider one only when no plan fits with the narrower)
    for (const trayK of o.trayKs ?? [o.trayK]) {
    if (best && best.ts === ts) break;
    for (const mode of o.modes) {
      for (const cw of cws) {
        for (const PK of o.PKs) for (const xTK of o.xTKs ?? [74]) for (const full of o.fulls ?? [false]) {
          if (HEAD_R * 2 * PK < o.headMinUnits || (o.headMaxUnits && HEAD_R * 2 * PK > o.headMaxUnits)) continue;
          const G = planStage(ctx, {p: o.p, ts, CW: cw, PK, mode, compact: o.compact, textCards: o.textCards, trayK, showText: o.showText, flaps: o.flaps, xTK, full, fitCache, ...(o.reserve ? o.reserve(ts) : {})});
          if (o.diag && ts === o.tsList[0]) diag.push(`${mode}${full ? '/full' : ''} cw${cw} pk${PK} x${xTK} tk${trayK}: reach ${G.reachOk} face ${G.faceOk} words ${G.wordsOk} w ${Math.round(G.ext.w)}/${Math.round(o.availW)} h ${Math.round(needH(G))}/${Math.round(o.availH)}`);
          if (!G.reachOk || !G.faceOk || !G.wordsOk || !G.calOk) continue;
          if (G.ext.w > o.availW || needH(G) > o.availH) continue;
          // (o.minContentW: the drawn content — the extent without its wall margins — must be at least this wide)
          if (o.minContentW && G.ext.w - 0.8 * ts < o.minContentW) { if (!loose || better(G, loose)) loose = G; continue; }
          if (!best || better(G, best)) best = G;
        }
      }
    }
    }
    if (best && ts === round[round.length - 1]) return {G: best, fitted: true, ts: best.ts, diag};
    // (no plan wide enough at this size: the widest fitting one, before any smaller text)
    if (loose && ts === round[round.length - 1]) return {G: loose, fitted: true, ts: loose.ts, diag, narrow: true};
  }
  // nothing fits: the smallest text size, narrowest card and smallest people are returned and flagged (never thrown)
  const ts = o.tsList[o.tsList.length - 1];
  const G = planStage(ctx, {p: o.p, ts, CW: o.cwRange[0], PK: o.PKs[o.PKs.length - 1], mode: o.modes[o.modes.length - 1], compact: o.compact, textCards: o.textCards, showText: o.showText, flaps: o.flaps, xTK: (o.xTKs ?? [74])[0], full: (o.fulls ?? [false])[0], ...(o.reserve ? o.reserve(ts) : {})});
  return {G, fitted: false, ts, diag};
}
