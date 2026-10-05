/**
 * Motif kit for "Declaración de testigo" (roles-03, LAW-0169..0172).
 *
 * A fictional witness recounts; each statement appears in a speech bubble and
 * a clerk writes it on a labelled fact card that is set, upright, in a card
 * rail on the table beside the witness. Every card carries the source type the
 * witness STATED ("direct observation (as stated)" / "information received
 * (as stated)"): the kit never judges credibility, truthfulness, reliability,
 * admissibility or weight, and draws no verdict glyphs (no tick, cross, score,
 * red flag). The two source glyphs are neutral pictograms: an eye (seen) and
 * a speech bubble with dots (told), in two non-alarm colours.
 *
 * Contents (geometry, props, pose solver and a recount script only; each
 * entry owns its timeline windows, layout choices and semantics):
 *  - fields / defaults / strings shared by the four entries;
 *  - sourceGlyph, sourceColor;
 *  - cardContent + factCard: a card whose text is revealed by a pen nib that
 *    travels along the fitted lines (writing), ending with a source-coloured
 *    underline band;
 *  - quoteBubble: speech bubble holding the supplied statement in quotes;
 *  - stageGeometry + witnessStage: side view of a table. The witness sits at
 *    the left end ('row', wide frames) or in the foreground ('stack', tall
 *    frames) holding the written statement; the clerk sits behind the table
 *    facing the viewer (frontMediator from the mediation kit, pen in the LEFT
 *    hand). Blank cards lie on a pad in front of the clerk; a card rail runs
 *    along the table's far edge towards the witness.
 *  - recountScript: per fact, the witness speaks; the clerk's right hand lifts
 *    a blank card off the pad and holds it upright in the rail slot S in front
 *    of their chest; the left hand writes the fact on it; the right hand lets
 *    go; the left hand pushes the whole row one card-width along the rail
 *    (cards abut, so the row moves together) and returns.
 *
 * Attachment rules (asserted by entry tests through semantics):
 *  - a lifted card is placed from the SOLVED right hand (grip = its right edge
 *    at mid-height); while the row is pushed, every card in the rail is placed
 *    from the SOLVED left hand (row shift = S.right − hand.x);
 *  - the pen nib (from the solved left hand) sits on the writing point of the
 *    card while writing;
 *  - the witness's statement sheet is placed from the witness's solved hand;
 *  - every IK target is within reach (`allReached`).
 * @module animations/roles/kits/declaracion-de-testigo
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf, party} from '../../../schemas/fields.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {frontMediator} from './mediation-props.js';
import {fitWords, wchip} from './mediation-labels.js';

const INK = '#1f2328';

/* ------------------------------------------------------------------ fields */

export const SOURCES = ['observed', 'received'];

/** One stated fact. */
export const factField = obj('A fact as the witness states it (fictional, supplied text)', {
  text: str('What the witness says: shown in the speech bubble and written on the fact card', 90),
  source: oneOf('Source type AS STATED by the witness: observed = direct observation, received = information received from someone else. Shown as stated, never assessed', SOURCES),
  via: str('For received information: from whom or what, as stated (empty = not stated)', 40),
}, ['text', 'source']);

/** Category fields for the roles category, specialised for this motif. */
export const witnessFields = {
  actors: list('The witness, the clerk who writes the cards and (optional third) the person the witness says they heard from — fictional people', party, 2, 3),
  roles: obj('Descriptive role captions (never a finding about credibility or reliability)', {
    witness: str('Role caption for the person giving the statement', 40),
    clerk: str('Role caption for the person writing the cards', 40),
    informant: str('Role caption for the person the witness says they heard from', 40),
  }),
  props: obj('Supplied statement content', {
    facts: list('Facts the witness states, in order; each becomes one labelled card', factField, 1, 3),
    sourceLabels: obj('Label printed on each card for the stated source type', {
      observed: str('Label for a direct observation (keep “as stated”)', 48),
      received: str('Label for information received (keep “as stated”)', 48),
    }),
  }),
};

/** Default category values shared by the four entries (fictional, illustrative). */
export const WITNESS_DEFAULTS = {
  actors: [
    {name: 'Ana Duarte', role: 'Witness'},
    {name: 'Leo Brandt', role: 'Clerk'},
    {name: 'Sam Osei', role: 'Neighbour'},
  ],
  roles: {witness: 'Witness', clerk: 'Clerk', informant: 'Neighbour'},
  props: {
    facts: [
      {text: 'A blue van parked by the north gate', source: 'observed', via: ''},
      {text: 'Two people carried boxes inside', source: 'observed', via: ''},
      {text: 'The van left before midnight', source: 'received', via: 'a neighbour'},
    ],
    sourceLabels: {observed: 'direct observation (as stated)', received: 'information received (as stated)'},
  },
};

/** Spanish counterparts for presets. */
export const WITNESS_DEFAULTS_ES = {
  actors: [
    {name: 'Ana Duarte', role: 'Testigo'},
    {name: 'Leo Brandt', role: 'Secretario'},
    {name: 'Sam Osei', role: 'Vecino'},
  ],
  roles: {witness: 'Testigo', clerk: 'Secretario', informant: 'Vecino'},
  props: {
    facts: [
      {text: 'Una furgoneta azul aparcó junto a la puerta norte', source: 'observed', via: ''},
      {text: 'Dos personas metieron cajas dentro', source: 'observed', via: ''},
      {text: 'La furgoneta se fue antes de medianoche', source: 'received', via: 'un vecino'},
    ],
    sourceLabels: {observed: 'observación directa (según declara)', received: 'información recibida (según declara)'},
  },
};

/** Built-in strings shared by the entries (merged into each entry's strings). */
export const WITNESS_STRINGS = {
  en: {from: 'from', keyNote: 'as supplied · no conclusion drawn', qOpen: '“', qClose: '”'},
  es: {from: 'de', keyNote: 'según lo aportado · sin conclusión', qOpen: '«', qClose: '»'},
};

/** Role caption of an actor id, falling back to the actor's own role. */
export function roleOf(p, id) {
  const idx = id === 'witness' ? 0 : id === 'clerk' ? 1 : 2;
  return (p.roles && p.roles[id]) || (p.actors[idx] && p.actors[idx].role) || '';
}

/** "Name · role" caption. */
export function captionOf(p, id, override) {
  const idx = id === 'witness' ? 0 : id === 'clerk' ? 1 : 2;
  const a = p.actors[idx];
  if (!a) return '';
  const role = override || roleOf(p, id);
  return role ? `${a.name} · ${role}` : a.name;
}

/** Tag text printed on a card for a source type. */
export const tagOf = (p, source) => (source === 'received' ? p.props.sourceLabels.received : p.props.sourceLabels.observed);

/** "from: …" line for a fact (received information with a stated origin only). */
export const fromOf = (ctx, f) => (f.source === 'received' && f.via ? `${ctx.t.from}: ${f.via}` : '');

/* ------------------------------------------------------------------ glyphs */

/** Neutral colour of a stated source type (never red/green, never alarm). */
export function sourceColor(ctx, source) {
  return source === 'received' ? ctx.theme.cloth[3] : ctx.theme.accent2;
}

/** Darker ink of a source colour for text. */
export const sourceInk = (ctx, source) => shade(sourceColor(ctx, source), -0.32);

/**
 * Source glyph centred on (x, y): an eye (direct observation) or a speech
 * bubble with three dots (information received). Neutral pictograms only.
 * @param {any} ctx
 * @param {'observed'|'received'} source
 * @param {{x?:number, y?:number, size?:number, name?:string, color?:string}} [o]  size = half width
 */
export function sourceGlyph(ctx, source, o = {}) {
  const s = o.size ?? 14;
  const x = o.x ?? 0, y = o.y ?? 0;
  const c = o.color ?? sourceColor(ctx, source);
  const sw = Math.max(2, s * 0.2);
  if (source === 'received') {
    const w = s * 2, hh = s * 1.5;
    const bx = x - s, by = y - hh * 0.62;
    const rr = s * 0.5;
    const tx = bx + w * 0.26;
    const d = `M${r(bx + rr)} ${r(by)}H${r(bx + w - rr)}Q${r(bx + w)} ${r(by)} ${r(bx + w)} ${r(by + rr)}V${r(by + hh - rr)}Q${r(bx + w)} ${r(by + hh)} ${r(bx + w - rr)} ${r(by + hh)}`
      + `H${r(tx + s * 0.32)}L${r(tx - s * 0.12)} ${r(by + hh + s * 0.55)}L${r(tx)} ${r(by + hh)}H${r(bx + rr)}Q${r(bx)} ${r(by + hh)} ${r(bx)} ${r(by + hh - rr)}V${r(by + rr)}Q${r(bx)} ${r(by)} ${r(bx + rr)} ${r(by)}Z`;
    return g({name: o.name},
      h('path', {d, fill: '#fff', stroke: c, 'stroke-width': r(sw), 'stroke-linejoin': 'round'}),
      [-1, 0, 1].map(i => h('circle', {cx: r(x + i * s * 0.5), cy: r(by + hh / 2), r: r(s * 0.16), fill: c})),
    );
  }
  return g({name: o.name},
    h('path', {d: `M${r(x - s)} ${r(y)}Q${r(x)} ${r(y - s * 1.25)} ${r(x + s)} ${r(y)}Q${r(x)} ${r(y + s * 1.25)} ${r(x - s)} ${r(y)}Z`, fill: '#fff', stroke: c, 'stroke-width': r(sw), 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(x), cy: r(y), r: r(s * 0.44), fill: c}),
    h('circle', {cx: r(x), cy: r(y), r: r(s * 0.18), fill: INK}),
  );
}

/* ------------------------------------------------------------------- cards */

const widestWord = (ctx, text, size, weight) => Math.max(0, ...String(text || '').split(/\s+/).filter(Boolean).map(w => ctx.measure(w, size, weight, 'sans')));

/**
 * Lay out the content of one fact card at font size `size` (no shrinking:
 * callers try sizes). Lines are wrapped between words only.
 * @param {any} ctx
 * @param {{w:number, text:string, tag:string, fromText?:string, size:number}} o
 * @returns {{s:number, pad:number, fF:any, fT:any, fV:any, blocks:any, lines:Array<any>, band:any, glyph:any, h:number, ok:boolean}}
 */
export function cardContent(ctx, o) {
  const s = o.size;
  const pad = s * 0.62;
  const x0 = pad;
  const inner = o.w - pad * 2;
  const gS = s * 0.56;
  const fit = (t, mw, wt) => fitWords(t, {maxWidth: mw, size: s, minSize: s, maxLines: 9, weight: wt});
  // tag beside its glyph when its longest word fits there, else the glyph gets its own row
  const inlineX = x0 + gS * 2 + s * 0.34;
  const tagWord = widestWord(ctx, o.tag, s, 700);
  const glyphRow = tagWord > o.w - pad - inlineX - 0.5;
  const tagX = glyphRow ? x0 : inlineX;
  const fF = fit(o.text, inner, 600);
  const fT = fit(o.tag, o.w - pad - tagX, 700);
  const fV = o.fromText ? fit(o.fromText, inner, 500) : null;
  // a word wider than its line would be broken mid-word: not acceptable
  const ok = !fF.truncated && !fT.truncated && !(fV && fV.truncated)
    && widestWord(ctx, o.text, s, 600) <= inner - 0.5
    && tagWord <= o.w - pad - tagX - 0.5
    && (!fV || widestWord(ctx, o.fromText, s, 500) <= inner - 0.5)
    // no mid-word break: every wrapped line ends/starts on a word boundary
    && [fF, fT, fV].every(f => !f || f.lines.join(' ').replace(/\s+/g, ' ').trim() === String(f === fF ? o.text : f === fT ? o.tag : o.fromText).replace(/\s+/g, ' ').trim());
  const lines = [];
  let y = pad * 0.95;
  const push = (f, x, kind, glyphInline) => {
    f.lines.forEach((ln, i) => {
      const tw = ctx.measure(ln, f.size, f.weight, 'sans');
      const lx = glyphInline && i === 0 ? x0 : x;
      lines.push({kind, x: lx, textX: x, textW: tw, w: x + tw - lx, top: y + i * f.lineHeight, h: s});
    });
  };
  const bF = {x: x0, y};
  push(fF, x0, 'text');
  y += fF.height + s * 0.5;
  let bT, glyph;
  if (glyphRow) {
    glyph = {x: x0 + gS, y: y + gS * 0.85, s: gS};
    lines.push({kind: 'glyph', x: x0, textX: x0, textW: gS * 2, w: gS * 2, top: y, h: gS * 1.7});
    y += gS * 1.7 + s * 0.2;
    bT = {x: tagX, y};
    push(fT, tagX, 'tag', false);
    y += fT.height;
  } else {
    const tagH = Math.max(fT.height, gS * 1.7);
    bT = {x: tagX, y: y + (tagH - fT.height) / 2};
    glyph = {x: x0 + gS, y: bT.y + s * 0.5, s: gS};
    const yT = y;
    y = bT.y;
    push(fT, tagX, 'tag', true);
    y = yT + tagH;
  }
  let bV = null;
  if (fV) {
    y += s * 0.3;
    bV = {x: x0, y};
    push(fV, x0, 'via');
    y += fV.height;
  }
  y += s * 0.55;
  const band = {x: pad * 0.7, y, w: o.w - pad * 1.4, h: Math.max(5, s * 0.3)};
  y += band.h + pad * 0.75;
  return {s, pad, fF, fT, fV, blocks: {F: bF, T: bT, V: bV}, lines, band, glyph, glyphRow, h: y, ok, w: o.w};
}

/**
 * Pick the largest size in [minSize, size] at which every card fits its width
 * without mid-word breaks (and, if given, whose tallest card ≤ maxH).
 * @param {any} ctx
 * @param {{w:number, items:Array<{text:string, tag:string, fromText?:string}>, size:number, minSize:number, maxH?:number, step?:number}} o
 */
export function fitCards(ctx, o) {
  const step = o.step ?? 0.5;
  let last = null;
  for (let s = o.size; s >= o.minSize - 1e-6; s -= step) {
    const contents = o.items.map(it => cardContent(ctx, {w: o.w, ...it, size: s}));
    const H = Math.max(...contents.map(c => c.h));
    last = {contents, H, size: s, ok: contents.every(c => c.ok) && (!o.maxH || H <= o.maxH)};
    if (last.ok) return last;
  }
  return last;
}

/**
 * Writing path over a card's LABEL lines (source glyph, source tag, "from"
 * line; then the underline band). The statement lines are not on the path:
 * they fill in as the witness says them (dictation, `frame(p, d)`). Local coords.
 * @param {ReturnType<typeof cardContent>} c
 */
function writingPath(c) {
  const segs = [];
  let prev = null;
  const s = c.s;
  const wob = (d, i) => Math.sin(d * 0.21 + i * 1.7) * s * 0.1;
  c.lines.forEach((ln, i) => {
    if (ln.kind === 'text' || ln.kind === 'via') return;
    const yb = ln.top + s * 0.62;
    const a = {x: ln.x, y: yb}, b = {x: ln.x + Math.max(2, ln.w), y: yb};
    if (prev) segs.push({a: prev, b: a, len: Math.hypot(a.x - prev.x, a.y - prev.y), line: -1});
    segs.push({a, b, len: Math.max(2, ln.w), line: i, wob: true});
    prev = b;
  });
  // underline, left → right: the nib ends at the card's right edge, where the hand then grips it
  const bandY = c.band.y + c.band.h / 2;
  const L0 = {x: c.band.x, y: bandY}, R0 = {x: c.band.x + c.band.w, y: bandY};
  const fromRight = false;
  const ba = fromRight ? R0 : L0, bb = fromRight ? L0 : R0;
  if (prev) segs.push({a: prev, b: ba, len: Math.hypot(ba.x - prev.x, ba.y - prev.y), line: -1});
  segs.push({a: ba, b: bb, len: c.band.w, line: 'band'});
  let acc = 0;
  for (const sg of segs) { sg.at = acc; acc += sg.len; }
  const total = acc;
  /** @param {number} p 0..1 → {pt, reveal:number[], band:number} */
  return p => {
    const d = clamp(p) * total;
    const reveal = c.lines.map(() => 0);
    let band = 0;
    let pt = segs[0].a;
    for (const sg of segs) {
      const k = sg.len ? clamp((d - sg.at) / sg.len) : 1;
      if (d >= sg.at) {
        pt = {x: lerp(sg.a.x, sg.b.x, k), y: lerp(sg.a.y, sg.b.y, k)};
        if (sg.wob) pt.y += wob(k * sg.len, sg.line);
      }
      if (sg.line === 'band') band = k;
      else if (sg.line >= 0) reveal[sg.line] = k;
    }
    return {pt, reveal, band, fromRight};
  };
}

/**
 * Fact card (local origin = top-left). Blank until written: `frame(p)` reveals
 * the lines as the nib passes (`nib(p)` = local nib point).
 * Named: `${name}` (placement), `${name}-ink` (text/bars layer), `${name}-rv${i}`
 * (reveal rects), `${name}-band` (source underline).
 * @param {any} ctx
 * @param {{name:string, content:ReturnType<typeof cardContent>, H:number, source:'observed'|'received', showText:boolean}} o
 */
export function factCard(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const c = o.content;
  const w = c.w, H = o.H;
  const col = sourceColor(ctx, o.source);
  const ink = sourceInk(ctx, o.source);
  const clip = `${N}-clip`;
  const s = c.s;
  const rects = c.lines.map((ln, i) => h('rect', {name: `${N}-rv${i}`, x: r(ln.x - s * 0.25), y: r(ln.top - s * 0.3), width: 0, height: r(ln.h + s * 0.6)}));
  const ink0 = [];
  if (o.showText) {
    ink0.push(textBlock(c.fF, {x: c.blocks.F.x, y: c.blocks.F.y, fill: INK}));
    ink0.push(textBlock(c.fT, {x: c.blocks.T.x, y: c.blocks.T.y, fill: ink}));
    if (c.fV) ink0.push(textBlock(c.fV, {x: c.blocks.V.x, y: c.blocks.V.y, fill: th.inkSoft, italic: true}));
  } else {
    c.lines.filter(ln => ln.kind !== 'glyph').forEach(ln => ink0.push(h('rect', {x: r(ln.textX), y: r(ln.top + s * 0.28), width: r(Math.max(6, ln.textW)), height: r(s * 0.42), rx: r(s * 0.21), fill: ln.kind === 'tag' ? col : ln.kind === 'via' ? th.inkFaint : th.inkSoft, opacity: 0.9})));
  }
  // faint ruled lines (stationery) under the text area
  const rules = [];
  for (let y = c.pad + s * 1.02; y < c.band.y - s * 0.4; y += s * 1.18) {
    rules.push(h('line', {x1: r(c.pad * 0.6), x2: r(w - c.pad * 0.6), y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 1.2, opacity: 0.55}));
  }
  // o.still: a fully written copy with no reveal machinery (used for the rail layer)
  const glyph = sourceGlyph(ctx, o.source, {x: c.glyph.x, y: c.glyph.y, size: c.glyph.s});
  const node = o.still
    ? g({name: N, opacity: 0},
      h('path', {d: roundRectPath(5, 7, w, H, 9), fill: th.shadow}),
      h('path', {d: roundRectPath(0, 0, w, H, 9), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
      rules, glyph, ink0,
      h('rect', {x: r(c.band.x), y: r(c.band.y), width: r(c.band.w), height: r(c.band.h), rx: r(c.band.h / 2), fill: col}))
    : g({name: N},
      h('defs', null, h('clipPath', {id: ctx.id(clip)}, rects)),
      h('path', {d: roundRectPath(5, 7, w, H, 9), fill: th.shadow}),
      h('path', {d: roundRectPath(0, 0, w, H, 9), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
      rules,
      g({name: `${N}-ink`, opacity: 0}, g({'clip-path': ctx.ref(clip)}, glyph, ink0)),
      h('rect', {name: `${N}-band`, x: r(c.band.x), y: r(c.band.y), width: 0, height: r(c.band.h), rx: r(c.band.h / 2), fill: col}),
    );
  const path = writingPath(c);
  const textW = c.lines.filter(ln => ln.kind === 'text' || ln.kind === 'via').reduce((a, ln) => a + ln.w, 0);
  return {
    node, w, H, content: c,
    /** local nib point while writing at progress p */
    nib: p => path(p).pt,
    /**
     * reveal props: p = label writing progress (under the nib), d = statement
     * lines filled in so far (dictation, by cumulative width; default: with p)
     */
    frame(p, d = p > 0 ? 1 : 0) {
      const out = {};
      if (o.still) return out;
      const st = path(p);
      out[`${N}-ink`] = {opacity: p > 0 || d > 0 ? 1 : 0};
      let at = clamp(d) * textW;
      c.lines.forEach((ln, i) => {
        let k = st.reveal[i];
        if (ln.kind === 'text' || ln.kind === 'via') { k = ln.w > 0 ? clamp(at / ln.w) : 1; at = Math.max(0, at - ln.w); }
        out[`${N}-rv${i}`] = {width: r((ln.w + s * 0.5) * k)};
      });
      out[`${N}-band`] = {x: r(st.fromRight ? c.band.x + c.band.w * (1 - st.band) : c.band.x), width: r(c.band.w * st.band)};
      return out;
    },
  };
}

/* ------------------------------------------------------------------ bubble */

/**
 * Speech bubble holding the supplied statement in quotes (or abstract speech
 * lines when labels are hidden). Tail points at `tail` (the speaker's mouth).
 * Named: `${name}` (open), `${name}-txt` / `${name}-w${i}`.
 * @param {any} ctx
 * @param {{name:string, box:{x:number,y:number,w:number,h:number}, tail:{x:number,y:number}, fit?:any, showText:boolean, stroke?:string}} o
 */
export function quoteBubble(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const rr = Math.min(30, hh * 0.28);
  const tip = o.tail;
  const below = tip.y > y + hh;
  const bw = Math.min(46, w * 0.12);
  const bx = clamp(tip.x, x + rr + bw, x + w - rr - bw);
  let d;
  if (!below && tip.x > x + w) {
    // tail on the right edge (speaker to the right of the bubble)
    const by = clamp(tip.y, y + rr + bw, y + hh - rr - bw);
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(by - bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(x + w)} ${r(by + bw / 2)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  } else if (below) {
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(bx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx - bw / 2)} ${r(y + hh)}H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  } else {
    // tail on the left edge (speaker to the left of the bubble)
    const by = clamp(tip.y, y + rr + bw, y + hh - rr - bw);
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(by + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(x)} ${r(by - bw / 2)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  }
  const stroke = o.stroke ?? th.ink;
  const parts = [
    h('path', {d, fill: th.shadow, transform: T(6, 8)}),
    h('path', {d, fill: th.card, stroke, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
  ];
  let txt = null;
  const lines = [];
  if (o.showText && o.fit) {
    txt = textBlock(o.fit, {x: x + w / 2, y: y + (hh - o.fit.height) / 2, anchor: 'middle', fill: th.ink, name: `${o.name}-txt`, opacity: 0});
  } else {
    const n = 3;
    const lh = hh / (n + 1);
    const padX = w * 0.1;
    for (let i = 0; i < n; i++) {
      const len = (w - padX * 2) * (i === n - 1 ? 0.5 + ctx.rng(`${o.name}-l`, i) * 0.2 : 0.8 + ctx.rng(`${o.name}-l`, i) * 0.2);
      lines.push({x1: x + padX, y: y + lh * (i + 1), len});
    }
  }
  const lw = Math.max(8, Math.min(14, hh * 0.07));
  const lineNodes = lines.map((l, i) => h('line', {name: `${o.name}-w${i}`, x1: r(l.x1), x2: r(l.x1 + l.len), y1: r(l.y), y2: r(l.y), stroke: th.inkSoft, 'stroke-width': r(lw), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(l.len)} ${r(l.len + 30)}`, 'stroke-dashoffset': r(l.len), opacity: 0.8}));
  const node = g({name: o.name, opacity: 0}, parts, lineNodes, txt);
  return {
    node, box: o.box, tip,
    /** open 0..1 (grows from the tail tip), words 0..1 */
    frame(open, words, reduced) {
      const out = {};
      const k = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      out[o.name] = {opacity: r(clamp(open * 3), 3), transform: scaleAbout(tip.x, tip.y, k)};
      lines.forEach((l, i) => { out[`${o.name}-w${i}`] = {'stroke-dashoffset': r(l.len * (1 - clamp(words * lines.length - i)))}; });
      if (txt) out[`${o.name}-txt`] = {opacity: r(clamp(words * 4), 3)};
      return out;
    },
  };
}

/** Fit a quoted statement into a bubble of inner width `w`. */
export function fitQuote(ctx, text, o) {
  return fitWords(`${ctx.t.qOpen}${text}${ctx.t.qClose}`, {maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 4, weight: 600});
}

/* ------------------------------------------------------------------- stage */

/** Card width in clerk units: keeps writing and pushing within arm reach. */
export const CARD_W_Z = 190;
const PAD_F = 0.42;
/** Witness chair: legs reach the floor at this local depth under the seat (× kW). */
const FLOOR_K = 130;
/** Witness hand holding the sheet, local to the seat point (× kW). */
const DOC_HAND = {x: 84, y: -60};

/**
 * Pure stage geometry (design units).
 *  - row (wide/square frames): witness at the table's left end, card rail
 *    from the witness to the clerk; speech bubbles (and the hold notes) in a
 *    band above the rail; the key on the table's front panel.
 *  - stack (tall frames): the table band on top (rail from the left margin to
 *    the clerk); the witness in the foreground below, larger (nearer), with
 *    the bubble beside the head and the key beside the sheet; the hold
 *    callouts for the cards on the table's front panel.
 * @param {{mode:'row'|'stack', W:number, H:number, z:number, n:number, cardW:number, cardH:number,
 *   doc:{w:number,h:number}, bubbleH:number, keyH?:number, margin?:number, chipH?:number, top?:number,
 *   noDoc?:boolean, sideCol?:number, colH?:number, band?:number, padRight?:number, heldRight?:boolean, closeup?:boolean,
 *   railGap?:number}} o
 *   top: y of the stage top (row mode; used to centre the stage vertically);
 *   noDoc: the witness holds no sheet; sideCol: width of a bubble column left of
 *   the witness (row mode) instead of the column above; colH: minimum height of
 *   the column above the witness's head.
 */
export function stageGeometry(o) {
  const m = o.margin ?? 16;
  const z = o.z;
  const w = o.cardW, Hc = o.cardH;
  const n = o.n;
  const chipH = o.chipH ?? 44;
  const G = {mode: o.mode, W: o.W, H: o.H, z, n, m, cardW: w, cardH: Hc, chipH};
  const docGrip = {x: o.doc.w * 0.14, y: o.doc.h * 0.62};
  G.doc = {w: o.doc.w, h: o.doc.h, grip: docGrip};
  // noDoc: the witness holds no sheet (hands rest on the table)
  // railGap: distance from the rail slot's right edge to the clerk's centre (default 50)
  const gap = o.railGap ?? 50;
  const docRightK = kk => (o.noDoc ? 46 * kk : DOC_HAND.x * kk - docGrip.x + o.doc.w);
  G.noDoc = Boolean(o.noDoc);
  if (o.mode === 'row') {
    const kW = 1.4 * z;
    G.kW = kW;
    // side column (optional): the bubble column sits left of the witness instead of above
    const sideW = o.sideCol || 0;
    const hipX = m + (sideW ? sideW + 24 : 0) + 64 * kW;
    const rowL = hipX + Math.max(docRightK(kW), 46 * kW) + 22;
    const cx = rowL + n * w + gap * z;
    const right = cx + (o.heldRight ? 252 : 112) * z;
    const shift = Math.max(0, (o.W - m - right) / 2);
    G.overflowX = right - (o.W - m);
    // band: a full-width band of this height above the whole stage (bubble / notes)
    const top = o.band ? m + o.band + 14 : (o.top ?? m);
    // colH: minimum height of the column above the witness's head (top column)
    const railY = Math.max(top + Hc, (o.band ? top - m : 0) + m + 262 * z, sideW || o.band ? 0 : m + (o.colH || 0) + 30 * kW + 160 * z);
    Object.assign(G, place(rowL + shift, cx + shift, railY, z));
    G.seatY = G.sy + 30 * z;
    G.hip = {x: hipX + shift, y: G.seatY};
    G.floor = G.seatY + FLOOR_K * kW;
    G.floorT = G.floor;
    G.panelBottom = G.floor - 30 * z;
    G.tableL = G.hip.x + 46 * z;
    G.tableR = Math.min(o.W - m * 0.5, cx + shift + (o.heldRight ? 262 : 150) * z);
    // speech bubbles (and the hold notes) in a column above the witness, left of the rail
    const headTop = G.seatY - 218 * kW;
    G.bubble = o.band ? {x: m, y: m, w: o.W - 2 * m, h: o.band}
      : sideW
        ? {x: m + shift * 0.5, y: m, w: sideW, h: G.floor + 6 + chipH - m}
        : {x: m, y: m, w: G.rowL - 16 - m, h: headTop - 30 * kW - m};
    G.free = {...G.bubble};
    // closeup: the scene is cropped just below the table edge (name chips in a row under it)
    G.clipY = o.closeup ? G.sy + 34 * z : null;
    G.overflowY = Math.max((o.closeup ? G.clipY : G.floor) + 6 + chipH - (o.H - 4), o.bubbleH - G.bubble.h);
    if (o.closeup && sideW) G.bubble.h = G.clipY - m;
  } else {
    const rowL = m;
    const cx = rowL + n * w + gap * z;
    const right = cx + (o.heldRight ? 252 : 112) * z;
    const shift = Math.max(0, (o.W - m - right) / 2);
    G.overflowX = right - (o.W - m);
    const railY = m + Math.max(Hc, 262 * z);
    Object.assign(G, place(rowL + shift, cx + shift, railY, z));
    G.panelBottom = G.sy + 176 * z;
    G.floorT = G.panelBottom + 32 * z;
    G.tableL = m * 0.5;
    G.tableR = o.W - m * 0.5;
    // witness in the foreground: as large as the band allows (nearer than the clerk)
    const bandTop = G.floorT + 12;
    const bottom = o.H - m - chipH - 6;
    const kW = Math.min(1.95 * z, (bottom - bandTop) / (218 + FLOOR_K));
    G.kW = kW;
    G.seatY = bottom - FLOOR_K * kW;
    G.hip = {x: m + 64 * kW, y: G.seatY};
    G.floor = G.seatY + FLOOR_K * kW;
    const headTop = G.seatY - 218 * kW;
    const docTop = G.seatY + DOC_HAND.y * kW - docGrip.y;
    const bx = G.hip.x + 58 * kW;
    G.bubble = {x: bx, y: Math.max(bandTop, headTop - 10), w: o.W - m - bx, h: 0};
    G.bubble.h = Math.max(o.bubbleH, docTop - 14 - G.bubble.y);
    G.free = {...G.bubble};
    const keyX = G.hip.x + docRightK(kW) + 24;
    G.key = {x: keyX, y: G.bubble.y + G.bubble.h + 18, w: o.W - m - keyX, h: 0};
    G.key.h = bottom + chipH - G.key.y;
    G.overflowY = Math.max(o.bubbleH - (docTop - 14 - G.bubble.y), (o.keyH || 0) - G.key.h, kW < 1.25 * z ? 1 : 0);
  }
  const k = G.kW;
  G.mouthW = {x: G.hip.x + 35 * k, y: G.seatY - 156 * k};
  G.headW = {x: G.hip.x + 5 * k, y: G.seatY - 176 * k, r: 36 * k};
  G.docHand = {x: G.hip.x + DOC_HAND.x * k, y: G.seatY + DOC_HAND.y * k};
  G.docBox = {x: G.docHand.x - docGrip.x, y: G.docHand.y - docGrip.y, w: o.doc.w, h: o.doc.h};
  G.farRest = o.mode === 'row' ? {x: G.hip.x + 112 * k, y: G.sy - 34 * z} : {x: G.hip.x + 70 * k, y: G.seatY - 26 * k};
  if (o.noDoc) G.docHand = {x: G.hip.x + 104 * k, y: G.sy - 30 * z};
  return G;

  /** clerk + table + rail placement from the row's left edge x0 and clerk centre cx */
  function place(x0, cx, railY, zz) {
    const yFar = railY - 5 * zz;
    const sy = yFar + 120 * zz;
    const med = {x: cx, y: sy - 222 * zz};
    // R: the rail slot at the row's right end, left of the clerk's face
    const R = {right: cx - gap * zz, left: cx - gap * zz - w};
    // cards lying flat on the pad are foreshortened so they fit the table's depth
    const pf = clamp((84 * zz) / Hc, 0.18, PAD_F);
    return {
      cx, sy, yFar, yNear: sy, railY, rowTop: railY - Hc, med, y0: med.y + 14 * zz,
      panelTop: sy + 16 * zz,
      R, rowL: x0,
      // pad: blank cards lying flat in front of the clerk; the top one is written on there
      pad: {right: cx + (o.padRight ?? 70) * zz, top: sy - 22 * zz - Hc * pf, f: pf, step: {x: 3 * zz, y: 2 * zz}},
      // pen hand at rest: on the pad right of centre, so the arm hangs clear of the rail
      restL: {x: cx + 20 * zz, y: sy - 32 * zz},
      restR: {x: cx + 118 * zz, y: sy - 44 * zz},
      // cards are gripped / pushed on their right edge this far above the card's
      // bottom (near the lower part, so tall cards stay within arm reach)
      gripUp: Math.min(Hc / 2, 104 * zz),
      // a written card left standing on the desk, right of the clerk's face (last-held state)
      desk: {x: cx + 50 * zz, y: sy - 22 * zz - Hc},
      restKeep: {x: cx + 26 * zz, y: sy - 28 * zz},
      midY: railY - Math.min(Hc / 2, 104 * zz),
    };
  }
}

/** Plain wooden chair seen from the side (local origin = seat point, facing +x; × k). */
function sideChair(k, facing = 1) {
  const c = '#6d5a4b', c2 = '#7d6857';
  const X = v => v * k * facing;
  return g(null,
    h('rect', {x: r(Math.min(X(-62), X(-40))), y: r(-112 * k), width: r(22 * k), height: r((FLOOR_K + 112) * k), rx: r(7 * k), fill: c, stroke: INK, 'stroke-width': 2.5}),
    h('rect', {x: r(Math.min(X(-58), X(70))), y: r(-6 * k), width: r(128 * k), height: r(15 * k), rx: r(6 * k), fill: c2, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: `M${r(X(58))} ${r(9 * k)}V${r(FLOOR_K * k)}`, stroke: INK, 'stroke-width': r(Math.max(5, 8 * k)), 'stroke-linecap': 'round'}),
  );
}

/**
 * Build the stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {ReturnType<typeof stageGeometry>} o.G
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.actors  [witness, clerk, …]
 * @param {Array<{content:any, source:string}>} o.cards  one per fact (content from cardContent)
 * @param {Array<any>} o.quotes  fitted quote per fact (or null)
 * @param {string} o.docTitle
 * @param {any} [o.docFit]
 * @param {boolean} [o.bubbles=true]
 */
export function witnessStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = o.G;
  const z = G.z, k = G.kW;
  const showAll = ctx.show('all');
  const looks = [0, 1].map(i => actorLook(ctx, o.actors[i], i));

  // --- characters
  const rigW = personRig(ctx, {name: `${P}-W`, look: looks[0], pose: 'seated', chair: false});
  const clerk = frontMediator(ctx, {name: `${P}-C`, look: looks[1], penSide: 'l'});

  // --- table (side view slightly from above, like the mediation table)
  const yNear = G.sy, yFar = G.yFar;
  const tl = G.tableL, tr = G.tableR;
  const inset = 36 * z;
  const topPath = `M${r(tl + inset)} ${r(yFar)}H${r(tr - inset)}L${r(tr)} ${r(yNear)}H${r(tl)}Z`;
  const grain = [];
  for (let i = 0; i < 5; i++) {
    const gy = yFar + ((i + 0.6) / 5.4) * (yNear - yFar);
    const wob = (4 + ctx.rng(`${P}-grain`, i) * 6) * z;
    grain.push(h('path', {d: `M${r(tl)} ${r(gy)}C${r(tl + (tr - tl) * 0.35)} ${r(gy - wob)} ${r(tl + (tr - tl) * 0.65)} ${r(gy + wob)} ${r(tr)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.6}));
  }
  const clipTop = `${P}-topclip`;
  const tabletop = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipTop)}, h('path', {d: topPath}))),
    h('path', {d: topPath, fill: th.woodTop, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    g({'clip-path': ctx.ref(clipTop)}, grain));
  const legW = 30 * z;
  const edge = 16 * z;
  const panelTop = yNear + edge;
  const tableFront = g(null,
    h('path', {d: roundRectPath(tl, yNear, tr - tl, edge, 3 * z), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(tl + legW * 0.6), y: r(panelTop), width: r(tr - tl - legW * 1.2), height: r(G.panelBottom - panelTop), fill: th.wood, stroke: INK, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(tl + legW * 1.4, panelTop + 14 * z, tr - tl - legW * 2.8, G.panelBottom - panelTop - 28 * z, 8 * z), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(tl), y: r(panelTop - 1), width: r(legW), height: r(G.floorT - panelTop + 1), rx: 4 * z, fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}),
    h('rect', {x: r(tr - legW), y: r(panelTop - 1), width: r(legW), height: r(G.floorT - panelTop + 1), rx: 4 * z, fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}),
  );
  const floor = h('ellipse', {cx: r((tl + tr) / 2), cy: r(G.floorT + 2 * z), rx: r((tr - tl) * 0.54), ry: r(15 * z), fill: th.shadow});
  const floorW = h('ellipse', {cx: r(G.hip.x + 20 * k), cy: r(G.floor + 2), rx: r(110 * k), ry: r(11 * k), fill: th.shadow});

  // --- card rail on the far edge (groove behind the cards, lip in front)
  const railL = G.rowL - 12 * z, railR = G.R.right + 16 * z;
  const railBack = h('path', {d: roundRectPath(railL, G.railY - 12 * z, railR - railL, 14 * z, 4 * z), fill: shade(th.woodDark, -0.1), stroke: INK, 'stroke-width': 2});
  const railLip = h('path', {d: roundRectPath(railL, G.railY - 6 * z, railR - railL, 12 * z, 4 * z), fill: th.woodDark, stroke: INK, 'stroke-width': 2});

  // --- pad (one static spare card under the working stack)
  const n = o.cards.length;
  const padBase = {x: G.pad.right - G.cardW, y: G.pad.top};
  const spareOff = {x: n * G.pad.step.x, y: n * G.pad.step.y};
  const spare = g({transform: `${T(padBase.x + spareOff.x, padBase.y + spareOff.y)} scale(1 ${r(G.pad.f, 4)})`},
    h('path', {d: roundRectPath(5, 7, G.cardW, G.cardH, 9), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, G.cardW, G.cardH, 9), fill: th.paper, stroke: INK, 'stroke-width': 2.4}));

  // --- cards: a working copy (pad / in hand / being written; drawn in front of
  //     the rail, last-first so card 0 lies on top of the pad) and a written
  //     copy standing in the rail (behind the lip). Exactly one is visible.
  const cards = o.cards.map((c, i) => factCard(ctx, {name: `${P}-card${i}`, content: c.content, H: G.cardH, source: c.source, showText: showAll}));
  const railCards = o.cards.map((c, i) => factCard(ctx, {name: `${P}-rcard${i}`, content: c.content, H: G.cardH, source: c.source, showText: showAll, still: true}));

  // --- statement sheet held by the witness
  const doc = statementSheet(ctx, {name: `${P}-doc`, w: G.doc.w, h: G.doc.h, title: o.docTitle, showText: showAll, fit: o.docFit});
  const thumb = g({name: `${P}-thumb`}, h('path', {d: `M${r(-7 * k)} ${r(-8 * k)}C${r(3 * k)} ${r(-14 * k)} ${r(13 * k)} ${r(-9 * k)} ${r(12 * k)} ${r(-1 * k)}C${r(11 * k)} ${r(7 * k)} ${r(-3 * k)} ${r(9 * k)} ${r(-8 * k)} ${r(4 * k)}Z`, fill: looks[0].skin, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));

  // --- bubbles (one per fact, same box; they never overlap in time)
  const tail = {x: G.mouthW.x + 8 * k, y: G.mouthW.y - 2 * k};
  const bubbles = (o.bubbles === false ? [] : o.cards.map((c, i) => (o.quotes && o.quotes[i]) || null)).map((q, i) => quoteBubble(ctx, {name: `${P}-bub${i}`, box: G.bubble, tail, fit: q, showText: showAll, stroke: shade(looks[0].outfit, -0.3)}));

  const witnessGroup = g(null, floorW, g({transform: T(G.hip.x, G.hip.y)}, sideChair(k)), rigW.node, G.noDoc ? null : doc.node, G.noDoc ? null : thumb);
  const node = g({name: P},
    floor,
    clerk.body,
    tabletop,
    spare,
    railBack,
    railLip,
    cards.slice().reverse().map(c => c.node),
    clerk.arms,
    // standing cards are in front of the clerk (the arms reach from behind them)
    railCards.map(c => c.node),
    G.mode === 'row' ? witnessGroup : null,
    tableFront,
    G.mode === 'stack' ? witnessGroup : null,
    bubbles.map(b => b.node),
  );

  const cardAtPad = i => ({x: padBase.x + i * G.pad.step.x, y: padBase.y + i * G.pad.step.y, f: G.pad.f});
  const penOff = clerk.penOffset(z);

  /**
   * Pose the stage.
   * @param {object} s
   * @param {{left:{x:number,y:number}, right:{x:number,y:number}, look:number, tilt:number, write:{card:number,p:number}|null}} s.clerk
   * @param {{mouth:number, lean:number, tilt:number}} s.witness
   * @param {Array<{at:'pad'|'hand'|'rail'|'desk', by?:'l'|'r', f?:number, k?:number, front?:number, write:number}>} s.cards
   *   at 'hand': carried by hand `by` (grip on its right edge, `gripUp` above its bottom), foreshortened by f;
   *   front = opacity of the standing copy drawn in front of the arms (a carried card that stands up ends in front)
   * @param {{card:number}|null} s.push   the row is being pushed by the pen hand (fingertip on card's right edge)
   * @param {Array<{open:number, words:number}>} s.bubbles
   */
  function pose(s) {
    const nodes = {};
    const cardPos = new Array(n).fill(null);
    const placeHeld = (hand, f) => ({x: hand.x - G.cardW, y: hand.y - f * (G.cardH - G.gripUp), f});
    const railPos = (i, sh) => ({x: G.R.right - (s.cards[i].k || 0) * G.cardW - sh - G.cardW, y: G.rowTop, f: 1});
    const target = side => (side === 'l' ? s.clerk.left : s.clerk.right);
    // pen target from the card as placed by the (reachable) hand target;
    // the card itself is then placed from the SOLVED hand
    let penTip = null;
    if (s.clerk.write) {
      const wi = s.clerk.write.card;
      const c = s.cards[wi];
      const base = c.at === 'hand' ? placeHeld(target(c.by), c.f) : c.at === 'pad' ? cardAtPad(wi) : railPos(wi, 0);
      const q = cards[wi].nib(s.clerk.write.p);
      penTip = {x: base.x + q.x, y: base.y + q.y * base.f};
    }
    const mf = clerk.frame({x: G.med.x, y: G.med.y, scale: z, left: s.clerk.left, right: s.clerk.right, look: s.clerk.look, tilt: s.clerk.tilt, mouth: 0, penTip, open: {}});
    Object.assign(nodes, mf.nodes);
    // row shift from the solved pushing hand (fingertip on the card's right edge)
    const shift = s.push ? clamp(G.R.right - (mf.hands.l.x - PUSH_GAP * z), 0, G.cardW) : 0;
    const tf = cp => `${T(cp.x, cp.y)}${cp.f !== 1 ? ` scale(1 ${r(cp.f, 4)})` : ''}`;
    let heldIdx = -1;
    for (let i = 0; i < n; i++) {
      const c = s.cards[i];
      if (c.at === 'pad') cardPos[i] = cardAtPad(i);
      else if (c.at === 'hand') { cardPos[i] = placeHeld(mf.hands[c.by || 'r'], c.f); heldIdx = i; }
      else if (c.at === 'desk') cardPos[i] = {x: G.desk.x, y: G.desk.y, f: 1};
      else cardPos[i] = railPos(i, shift);
      const cp = cardPos[i];
      const standing = c.at === 'rail' || c.at === 'desk';
      const front = standing ? 1 : c.at === 'hand' ? clamp(c.front || 0) : 0;
      Object.assign(nodes, cards[i].frame(c.write, c.dict ?? (c.write > 0 ? 1 : 0)));
      // working copy (behind the arms) until the standing copy in front of them is fully shown
      nodes[`${P}-card${i}`] = {transform: tf(cp), opacity: front >= 1 ? 0 : 1};
      nodes[`${P}-rcard${i}`] = {transform: tf(cp), opacity: r(front, 3)};
    }
    let writeTarget = null;
    if (s.clerk.write) {
      const wi = s.clerk.write.card;
      const q = cards[wi].nib(s.clerk.write.p);
      writeTarget = {x: cardPos[wi].x + q.x, y: cardPos[wi].y + q.y * cardPos[wi].f};
    }
    // witness (holds the statement sheet; the sheet is placed from the solved hand)
    const pw = rigW.frame({x: G.hip.x, y: G.hip.y, facing: 1, scale: k, lean: s.witness.lean, mouth: s.witness.mouth, headTilt: s.witness.tilt, near: G.docHand, far: G.farRest});
    Object.assign(nodes, pw.nodes);
    const hw = pw.hands.near;
    if (!G.noDoc) {
      nodes[`${P}-doc`] = {transform: T(hw.x - G.doc.grip.x, hw.y - G.doc.grip.y)};
      nodes[`${P}-thumb`] = {transform: T(hw.x, hw.y)};
    }
    bubbles.forEach((b, i) => Object.assign(nodes, b.frame(s.bubbles[i].open, s.bubbles[i].words, ctx.reduced)));
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    const held = heldIdx >= 0 ? cardPos[heldIdx] : null;
    const heldBy = heldIdx >= 0 ? s.cards[heldIdx].by || 'r' : null;
    const gripOf = cp => ({x: cp.x + G.cardW, y: cp.y + cp.f * (G.cardH - G.gripUp)});
    // the last-held card stays in the right hand on the desk
    const deskIdx = s.cards.findIndex(c => c.at === 'desk');
    const face = {x: G.cx - 40 * z, y: G.med.y - 130 * z, w: 80 * z, h: 76 * z};
    const coversFace = cp => cp.x < face.x + face.w && cp.x + G.cardW > face.x && cp.y < face.y + face.h && cp.y + cp.f * G.cardH > face.y;
    const pushedRight = s.push ? cardPos[s.push.card].x + G.cardW : null;  // card at the row's right end
    // arm segments (shoulder–elbow–hand) of both arms, for the "arm over card text" audit
    const sh = side => ({x: G.med.x + clerk.shoulders[side].x * z, y: G.med.y + clerk.shoulders[side].y * z});
    const arms = ['l', 'r'].map(side => ({side, a: sh(side), e: mf.elbows[side], h: mf.hands[side]}));
    return {
      nodes,
      cardPos,
      arms,
      semantic: {
        pen: P2(mf.pen),
        writeTarget: P2(writeTarget),
        handL: P2(mf.hands.l),
        handR: P2(mf.hands.r),
        // grip of a card carried by the pen hand / the other hand (right edge, gripUp above its bottom),
        // the pen hand's push point on the row, and the last-held card's grip on the desk
        gripL: held && heldBy === 'l' ? P2(gripOf(held)) : s.push ? P2({x: pushedRight + PUSH_GAP * z, y: G.midY}) : null,
        gripR: held && heldBy === 'r' ? P2(gripOf(held)) : deskIdx >= 0 && s.clerk.holdDesk ? P2(gripOf(cardPos[deskIdx])) : null,
        handW: P2(hw),
        docGrip: P2({x: G.docHand.x, y: G.docHand.y}),
        card0: P2(cardPos[0]), card1: P2(cardPos[1]), card2: P2(cardPos[2]),
        cardAt: s.cards.map(c => c.at),
        heldBy,
        written: s.cards.map(c => r(clamp(c.write), 3)),
        // statement text filled in on each card (dictation, as the witness says it)
        dictated: s.cards.map(c => r(clamp(c.dict ?? (c.write > 0 ? 1 : 0)), 3)),
        // while a card's statement fills in, the clerk's nib rests on that card
        fillNibIn: s.cards.every((c, i) => {
          const d = c.dict ?? (c.write > 0 ? 1 : 0);
          if (!(d > 0 && d < 1)) return true;
          const cp = cardPos[i];
          return Boolean(mf.pen) && mf.pen.x >= cp.x && mf.pen.x <= cp.x + G.cardW && mf.pen.y >= cp.y && mf.pen.y <= cp.y + cp.f * G.cardH;
        }),
        slots: s.cards.map(c => (c.at === 'rail' ? c.k || 0 : null)),
        shift: r(shift),
        bubbles: s.bubbles.map(b => r(b.open, 3)),
        // cards standing in the rail or held still never cover the clerk's face
        railOnFace: cardPos.some((cp, i) => s.cards[i].at === 'rail' && coversFace(cp)),
        heldOnFace: cardPos.some((cp, i) => s.cards[i].at === 'desk' && coversFace(cp)),
        reach: {clerk: mf.reached, witness: pw.reached},
        allReached: mf.reached && pw.reached,
      },
    };
  }

  return {
    node, pose, G, cards, bubbles, looks, clerk, rigW, doc, penOff, cardAtPad,
    /** world point of card i's nib at p while it lies on the pad */
    nibAtPad: (i, p) => { const q = cards[i].nib(p); const c = cardAtPad(i); return {x: c.x + q.x, y: c.y + q.y * c.f}; },
    /** nib resting on card i's left margin, level with its statement (while the statement fills in) */
    hoverAtPad: i => {
      const cc = cards[i].content;
      const ls = cc.lines.filter(q => q.kind === 'text');
      const y = ls.length ? (ls[0].top + ls[ls.length - 1].top + ls[ls.length - 1].h) / 2 : cc.pad;
      const c = cardAtPad(i);
      return {x: c.x + cc.pad * 0.4, y: c.y + y * c.f};
    },
    /** grip (right edge, mid) of card i on the pad */
    padGrip: i => { const c = cardAtPad(i); return {x: c.x + G.cardW, y: c.y + c.f * (G.cardH - G.gripUp)}; },
    /** grip of a card standing in the rail slot R (right edge, near its bottom) */
    rGrip: {x: G.R.right, y: G.midY},
  };
}

/** Gap between the pushing fingertip and the card edge (clerk units). */
export const PUSH_GAP = 3;

/**
 * Statement sheet (local origin = top-left): title text + simulated lines and
 * a signature line. Title is fitted by the caller (`fit`).
 */
export function statementSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const pad = w * 0.1;
  const parts = [
    h('path', {d: roundRectPath(4, 6, w, hh, 5), fill: th.shadow}),
    h('path', {d: `M0 4Q0 0 4 0H${r(w * 0.84)}L${r(w)} ${r(w * 0.16)}V${r(hh - 4)}Q${r(w)} ${r(hh)} ${r(w - 4)} ${r(hh)}H4Q0 ${r(hh)} 0 ${r(hh - 4)}Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w * 0.84)} 0V${r(w * 0.13)}Q${r(w * 0.84)} ${r(w * 0.16)} ${r(w * 0.87)} ${r(w * 0.16)}H${r(w)}Z`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  let y = pad * 1.1;
  if (o.showText && o.fit) {
    parts.push(textBlock(o.fit, {x: pad, y, fill: th.ink}));
    y += o.fit.height + pad * 0.7;
  } else {
    parts.push(h('rect', {x: r(pad), y: r(y), width: r(w * 0.62), height: r(w * 0.07), rx: 3, fill: th.ink, opacity: 0.8}));
    y += w * 0.07 + pad * 0.9;
  }
  const bar = Math.max(4, w * 0.035);
  for (let i = 0; y < hh - pad * 2.2 && i < 8; i++) {
    const lw = (w - pad * 2) * (0.62 + ctx.rng(`${o.name}-l`, i) * 0.36);
    parts.push(h('rect', {x: r(pad), y: r(y), width: r(lw), height: r(bar), rx: r(bar / 2), fill: th.paperLine}));
    y += bar * 2.6;
  }
  parts.push(h('line', {x1: r(pad), x2: r(w * 0.66), y1: r(hh - pad * 1.1), y2: r(hh - pad * 1.1), stroke: th.ink, 'stroke-width': 2}));
  return {node: g({name: o.name}, parts)};
}

/* ------------------------------------------------------------------ script */

/**
 * Per-fact windows on the fact clock (q = fraction of one fact's span; fact i
 * starts when its statement starts filling in).
 * Pen hand ('l'): rests its nib on the top blank card while the witness says
 * the statement — it fills in on that card under the nib (statement, then its
 * "from" line) → writes the card's stated-source LABEL (glyph, source tag,
 * underline) → moves aside while the other hand takes the card → pushes the
 * row one card-width towards the witness (frees the rail slot R) → comes to
 * rest on the next blank card. The row is pushed BEFORE the next statement is
 * said, so no text ever appears on a card without the nib on it.
 * Other hand ('r'): grips the written card's right edge and carries it in one
 * smooth move (sliding left, standing up) into R — in last-held, onto the desk
 * right of the clerk's face, keeping hold of it — then back to rest.
 * A lifted card is in front of both arms (no arm ever crosses its text).
 */
export const RECOUNT = {
  fill: [0, 0.17],
  left: {toLabel: [0.17, 0.2], write: [0.2, 0.53], toWait: [0.53, 0.605], toPush: [0.765, 0.812], push: [0.812, 0.912], toHover: [0.912, 1], back: [0.82, 0.95]},
  right: {toGrip: [0.55, 0.6], carry: [0.6, 0.81], back: [0.82, 0.99]},
  bubble: {open: [-0.05, 0], close: [0.55, 0.61]},
  first: {pen: [-0.12, 0]},
};
/** Share of a fact span before the first statement starts filling in (the pen comes to rest on card 0). */
export const PRE_ROLL = 0.12;

/**
 * Fact clock for a recount placed over [u0, u1] of the timeline: the pen
 * starts towards the first card at u0, the last card is in place by about u1.
 * @param {number} u  @param {number} u0  @param {number} u1  @param {number} n
 */
export function recountClock(u, u0, u1, n) {
  const span = (u1 - u0) / (n + PRE_ROLL);
  return (u - u0) / span - PRE_ROLL;
}

/**
 * Recount script: clock c ∈ [−PRE_ROLL, n] (fact i runs over [i, i+1]) → pose input.
 * @param {ReturnType<typeof witnessStage>} st
 * @param {{plan?:'all'|'last-held'}} [opt]  last-held: the last card is written,
 *   lifted by the other hand and held standing on the desk beside the clerk
 *   (not set in the rail).
 */
export function recountScript(st, opt = {}) {
  const G = st.G;
  const z = G.z;
  const n = st.cards.length;
  const W = RECOUNT;
  const lastHeld = opt.plan === 'last-held';
  const handAt = q => ({x: q.x + st.penOff.x, y: q.y + st.penOff.y});
  const handAtNib = (i, p) => handAt(st.nibAtPad(i, p));
  const hover = i => handAt(st.hoverAtPad(i));
  const pushAt = x => ({x: x + PUSH_GAP * z, y: G.midY});
  const E = t => ease.inOutSine(clamp(t));
  const arc = (a, b, t, lift) => {
    const c = {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift};
    const u = E(t);
    return mix(mix(a, c, u), mix(c, b, u), u);
  };
  // the pen hand waits just above the rail line, right of the slot, while the card is carried
  const wait = {x: G.R.right + 20 * z, y: Math.min(G.railY - 10 * z, G.pad.top - 24 * z)};
  // grip on the desk (last-held): right edge of the card standing right of the face
  const deskGrip = {x: G.desk.x + G.cardW, y: G.desk.y + G.cardH - G.gripUp};
  return (cRaw, timeMs, reduced) => {
    const cc = clamp(cRaw, 0, n);
    const done = cc >= n;
    const i = done ? n - 1 : Math.floor(cc);
    const q = done ? 1 : cc - i;
    const L = W.left, R = W.right;
    const last = i === n - 1;
    const keep = lastHeld && last;
    const pushing = !done && !last && q >= L.push[0] && q < L.push[1];
    const pushedAfter = !done && !last && q >= L.push[1];
    const dest = keep ? deskGrip : st.rGrip;

    // card states
    const cards = [];
    for (let j = 0; j < n; j++) {
      if (j < i) { cards.push({at: 'rail', k: i - j + (pushedAfter ? 1 : 0), write: 1, dict: 1}); continue; }
      if (j > i) { cards.push({at: 'pad', write: 0, dict: 0}); continue; }
      const dict = done ? 1 : seg(cRaw - j, ...W.fill);
      const wr = done ? 1 : seg(q, ...L.write);
      if (!done && q < R.carry[0]) cards.push({at: 'pad', write: wr, dict});
      else if (!done && q < R.carry[1]) {
        const t = seg(q, ...R.carry);
        // one smooth carry: flat while it slides off the pad, standing up over the second part
        const f = lerp(G.pad.f, 1, E((t - 0.15) / 0.85));
        cards.push({at: 'hand', by: 'r', f, front: 1, write: 1, dict: 1});
      } else if (keep) cards.push({at: 'desk', write: 1, dict: 1});
      else cards.push({at: 'rail', k: pushedAfter ? 1 : 0, write: 1, dict: 1});
    }
    let push = null;
    if (pushing) {
      push = {card: i};
      for (let j = 0; j <= i; j++) cards[j].k = i - j;
    }

    // pen hand
    let left = G.restL;
    let write = null;
    if (cRaw < 0) left = mix(G.restL, hover(0), E(seg(cRaw, ...W.first.pen)));
    else if (!done) {
      if (q < W.fill[1]) left = hover(i);
      else if (q < L.write[0]) left = mix(hover(i), handAtNib(i, 0), E(seg(q, ...L.toLabel)));
      else if (q < L.write[1]) { write = {card: i, p: seg(q, ...L.write)}; left = handAtNib(i, write.p); }
      else if (q < L.toPush[0] || (last && q < L.back[0])) left = arc(handAtNib(i, 1), wait, seg(q, ...L.toWait), 10 * z);
      else if (last) left = mix(wait, G.restL, E(seg(q, ...L.back)));
      else if (q < L.push[0]) left = mix(wait, pushAt(G.R.right), E(seg(q, ...L.toPush)));
      else if (q < L.push[1]) left = mix(pushAt(G.R.right), pushAt(G.R.left), E(seg(q, ...L.push)));
      else left = arc(pushAt(G.R.left), hover(i + 1), seg(q, ...L.toHover), 8 * z);
    }
    // other hand: rest (steadying the pad) → grip → carry into R / onto the desk → rest
    let right = G.restR;
    let holdDesk = false;
    if (!done && q >= R.toGrip[0]) {
      const pg = st.padGrip(i);
      if (q < R.carry[0]) right = mix(G.restR, pg, E(seg(q, ...R.toGrip)));
      else if (q < R.carry[1]) {
        const t = seg(q, ...R.carry);
        if (keep) right = arc(pg, dest, t, 16 * z);
        else {
          // slide left low, then rise into the slot: one continuous curve
          const a = mix(pg, {x: dest.x, y: pg.y}, E(Math.min(1, t / 0.7)));
          right = {x: a.x, y: lerp(pg.y, dest.y, E((t - 0.2) / 0.8))};
        }
      } else if (keep) { right = dest; holdDesk = true; }
      else right = mix(dest, G.restR, E(seg(q, ...R.back)));
    }
    if (done && lastHeld) { right = deskGrip; holdDesk = true; }

    // the witness says statement j while it fills in; its bubble opens just before and closes once card j is labelled
    let talk = 0;
    const bubbles = [];
    const B = W.bubble;
    for (let j = 0; j < n; j++) {
      const x = cRaw - j;
      if (x < B.open[0] || x > B.close[1] || cRaw >= n) { bubbles.push({open: 0, words: 0}); continue; }
      bubbles.push({open: seg(x, ...B.open) * (1 - seg(x, ...B.close)), words: seg(x, ...W.fill)});
      talk = Math.max(talk, seg(x, -0.02, 0.01) * (1 - seg(x, W.fill[1] - 0.02, W.fill[1] + 0.02)));
    }
    const flap = reduced ? 0.55 : 0.25 + 0.55 * Math.abs(Math.sin(timeMs * 0.0145));
    const writing = Boolean(write);
    return {
      clerk: {left, right, write, holdDesk, look: writing ? -0.2 : push ? -0.8 : -1, tilt: writing ? -4 : -2},
      witness: {mouth: talk * flap, lean: 3 * talk, tilt: talk * 2, speaking: talk > 0.5},
      cards,
      push,
      bubbles,
      fact: cRaw < 0 ? 0 : done ? n : i,
      q,
    };
  };
}

/**
 * Neutral pictogram of "what happened" for plans: a yard gate and a parked
 * van inside a round frame (local origin = centre, radius R). No people, no
 * suggestion of wrongdoing.
 * @param {any} ctx
 * @param {{R:number, name?:string}} o
 */
export function eventIcon(ctx, o) {
  const th = ctx.theme;
  const R = o.R;
  const u = R / 100;
  const gate = [];
  for (let i = 0; i < 5; i++) gate.push(h('rect', {x: r(-78 * u + i * 14 * u), y: r(-38 * u), width: r(6 * u), height: r(70 * u), rx: r(2 * u), fill: th.metalDark}));
  return g({name: o.name},
    h('circle', {r: r(R), fill: '#e9eef2', stroke: INK, 'stroke-width': 3}),
    h('path', {d: `M${r(-R * 0.98)} ${r(32 * u)}H${r(R * 0.98)}`, stroke: th.paperLine, 'stroke-width': r(6 * u)}),
    h('rect', {x: r(-84 * u), y: r(-44 * u), width: r(70 * u), height: r(8 * u), rx: r(3 * u), fill: th.metalDark}),
    gate,
    // van (side view)
    h('path', {d: `M${r(-4 * u)} ${r(24 * u)}V${r(-26 * u)}Q${r(-4 * u)} ${r(-32 * u)} ${r(2 * u)} ${r(-32 * u)}H${r(52 * u)}L${r(72 * u)} ${r(-10 * u)}H${r(78 * u)}Q${r(84 * u)} ${r(-10 * u)} ${r(84 * u)} ${r(-4 * u)}V${r(24 * u)}Z`, fill: th.accent2, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(52 * u)} ${r(-26 * u)}L${r(66 * u)} ${r(-10 * u)}H${r(52 * u)}Z`, fill: '#cfe3f3', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(14 * u), cy: r(26 * u), r: r(11 * u), fill: INK}),
    h('circle', {cx: r(64 * u), cy: r(26 * u), r: r(11 * u), fill: INK}),
    h('circle', {cx: r(14 * u), cy: r(26 * u), r: r(4 * u), fill: th.metal}),
    h('circle', {cx: r(64 * u), cy: r(26 * u), r: r(4 * u), fill: th.metal}),
  );
}

/**
 * Key: glyph + supplied label for each stated source type, and the neutral
 * note "as supplied · no conclusion drawn". Measured first, built at (x, y).
 */
export function keyLayout(ctx, p, o) {
  const th = ctx.theme;
  const s = o.size;
  const gS = s * 0.56;
  const tx = gS * 2 + s * 0.45;
  const rows = ['observed', 'received'].map(src => ({src, f: fitWords(tagOf(p, src), {maxWidth: o.w - tx, size: s, minSize: s, maxLines: 3, weight: 700})}));
  const note = fitWords(ctx.t.keyNote, {maxWidth: o.w - s * 0.8, size: s, minSize: s, maxLines: 3, weight: 600});
  const gap = s * 0.35;
  const rh = q => Math.max(q.f.height, gS * 1.8);
  const hgt = rows.reduce((a, q) => a + rh(q) + gap, 0) + note.height + s * 0.4;
  return {
    h: hgt,
    w: Math.max(note.width + s * 0.8, ...rows.map(q => tx + q.f.width)),
    ok: !note.truncated && rows.every(q => !q.f.truncated),
    build(x, y0) {
      const parts = [];
      let y = y0;
      for (const q of rows) {
        parts.push(sourceGlyph(ctx, q.src, {x: x + gS, y: y + rh(q) / 2, size: gS}));
        parts.push(textBlockAt(q.f, x + tx, y + (rh(q) - q.f.height) / 2, sourceInk(ctx, q.src)));
        y += rh(q) + gap;
      }
      const nb = {x, y, w: note.width + s * 0.8, h: note.height + s * 0.4};
      parts.push(h('rect', {x: r(nb.x), y: r(nb.y), width: r(nb.w), height: r(nb.h), rx: r(s * 0.35), fill: '#f7f1e3', stroke: th.ink, 'stroke-width': 2}));
      parts.push(textBlockAt(note, x + s * 0.4, y + s * 0.2, th.ink));
      return g({name: 'key'}, parts);
    },
  };
}

export function textBlockAt(f, x, y, fill) {
  const baseline = y + f.size * 0.8;
  return h('text', {x: r(x), y: r(baseline), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(f.size, 2), 'font-weight': f.weight, fill},
    f.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, line)));
}


export {wchip, fitWords};

/**
 * Audit: how many text lines of cards drawn BEHIND the arms (a carried card
 * before its standing copy is fully in front) are crossed by an arm segment
 * (shoulder–elbow or elbow–hand, arm half-width). Standing cards are drawn in
 * front of the arms and cannot be covered.
 * @param {ReturnType<typeof witnessStage>} st
 * @param {{cardPos:Array<any>, arms:Array<{a:any,e:any,h:any}>}} posed
 * @param {Array<{at:string, front?:number}>} cards  script card states
 * @returns {number}
 */
export function armOverText(st, posed, cards) {
  const z = st.G.z;
  const hw = 13 * z;
  let hits = 0;
  cards.forEach((c, i) => {
    if (c.at !== 'hand' || (c.front || 0) >= 1) return;
    const cp = posed.cardPos[i];
    for (const ln of st.cards[i].content.lines) {
      if (ln.kind === 'glyph') continue;
      const box = {x0: cp.x + ln.textX, x1: cp.x + ln.textX + ln.textW, y0: cp.y + ln.top * cp.f, y1: cp.y + (ln.top + ln.h) * cp.f};
      const near = p => Math.hypot(Math.max(box.x0 - p.x, 0, p.x - box.x1), Math.max(box.y0 - p.y, 0, p.y - box.y1)) <= hw;
      // the holding hand's fingers may touch the card's edge (the grip): skip points within 20z of it
      const grip = posed.arms.find(arm => arm.side === (c.by || 'r')).h;
      const crossed = posed.arms.some(arm => [[arm.a, arm.e], [arm.e, arm.h]].some(([p, q]) => {
        for (let k = 0; k <= 12; k++) {
          const pt = {x: p.x + (q.x - p.x) * k / 12, y: p.y + (q.y - p.y) * k / 12};
          if (arm.side === (c.by || 'r') && Math.hypot(pt.x - grip.x, pt.y - grip.y) < 20 * z) continue;
          if (near(pt)) return true;
        }
        return false;
      }));
      if (crossed) hits++;
    }
  });
  return hits;
}
