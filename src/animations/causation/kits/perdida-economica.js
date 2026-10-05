/**
 * Motif kit for "Pérdida económica" (LAW-0701..0704): a flow of supplied
 * inflows and outflows moves unit tokens through a balance column; a SUPPLIED
 * difference between a reference scenario and an alleged loss is shown as a
 * gap between two solid level markers — never computed, valued or decided.
 *
 * Original vector art (side view):
 *  - UNIT TOKENS: neutral discs seen edge-on (no currency sign). One token
 *    stands for a fixed number of units (the model scale, shown as supplied or
 *    chosen so the column fits); amounts are always printed as supplied, with
 *    "(fictional)".
 *  - BALANCE COLUMN: a glass rack with tick marks (no numbers). Inflows drop
 *    tokens from a HOPPER above it; outflows let the bottom token out through a
 *    side GATE onto a TRAY, and the stack settles one step. A second gate (◆)
 *    carries the supplied alleged loss onto its own tray.
 *  - LEVEL MARKERS: two solid arms of identical weight: ● reference scenario
 *    (as stated) and ◆ alleged-loss level (as stated), joined by a solid
 *    bracket that carries the stated difference.
 *  - Nothing is red; nothing reads as an alarm; dashes are only used for a
 *    disputed link. No valuation, damages, compensation, liability, fault or
 *    causation conclusion is drawn; every figure is "as supplied".
 *
 * The kit owns geometry, art, text measurement and the token simulation. Each
 * entry owns its own timeline, layout and semantics. Chips, the record sheet and
 * the connectors follow kits/dano-material.js (read-only imports; the icon set
 * here is this motif's own).
 * @module animations/causation/kits/perdida-economica
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {str, int, num, oneOf, list, obj} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {barrierArt as barrierArt0} from './causal-chain.js';
import {flowRows, linkArt as linkArt0, tracerArt, boxExit, boxesMeet, floorArt, sideMark} from './dano-material.js';

export {fitG, chipG, balancedG, flowRows, tracerArt, boxExit, boxesMeet, floorArt, sideMark};

// This motif draws nothing in the theme's red accent (no alarm styling): the shared connector and barrier art are
// used through a context whose accent is neutral ink / metal (the shared kits stay untouched).
const neutral = (ctx, accent) => { const c = Object.create(ctx); c.theme = {...ctx.theme, accent, accentSoft: ctx.theme.paperShade}; return c; };

/** Connector (kits/dano-material.js linkArt) with a neutral ink colour for supplied causal links. */
export const linkArt = (ctx, o) => linkArt0(neutral(ctx, ctx.theme.ink), o);

/** Barrier (kits/causal-chain.js barrierArt) with neutral metal stripes. */
const barrierArt = (ctx, o) => barrierArt0(neutral(ctx, ctx.theme.metalDark), o);

/** Two linked rings (a link note); dashed ring + "?" when disputed — neutral colours. */
export function linkIcon(ctx, {cx, cy, s, disputed}) {
  const th = ctx.theme;
  const R = s * 0.42;
  const col = disputed ? th.inkSoft : th.accent4;
  return g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? h('path', {d: `M${r(cx - R * 0.3)} ${r(cy - R * 0.3)}Q${r(cx - R * 0.3)} ${r(cy - R * 0.62)} ${r(cx)} ${r(cy - R * 0.62)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.62)} ${r(cx + R * 0.32)} ${r(cy - R * 0.3)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.05)} ${r(cx)} ${r(cy + R * 0.05)}V${r(cy + R * 0.22)}M${r(cx)} ${r(cy + R * 0.45)}V${r(cy + R * 0.5)}`, fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round'})
      : g(null,
        h('ellipse', {cx: r(cx - R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4}),
        h('ellipse', {cx: r(cx + R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4})),
  );
}
export {clamp, ease, lerp, r, seg};

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const peFields = {
  events: list('Flow entries in the supplied order (fictional): each adds (in) or removes (out) a supplied amount in BOTH scenarios', obj('Entry', {
    label: str('Entry text (fictional, descriptive; no valuation or finding)', 60),
    time: str('Optional fictional relative label, e.g. "Month 2" (shown as supplied; never a time limit)', 20),
    dir: oneOf('in (adds to the balance) or out (removes from it)', ['in', 'out']),
    amount: int('Fictional amount in the model unit (shown as supplied)', 0, 9999),
  }, ['label', 'dir', 'amount']), 2, 5),
  causalLinks: list('Per-link data. Link i joins entry i to the next entry; the link after the last entry joins it to the stated difference. Links not listed are a sequence as supplied.', obj('Link', {
    from: int('Index (0-based) of the entry where the link starts', 0, 4),
    kind: oneOf('sequence (default) or causal; a causal arrow is only drawn when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 48),
  }, ['from']), 0, 5),
  alternatives: list('Other explanations put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Alternative put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  losses: list('The stated difference: the first entry is the ALLEGED LOSS as someone states it (an amount the alleged scenario is below the reference scenario); an optional second entry is a noted detail. Never computed or decided.', obj('Stated difference', {
    label: str('How the difference is stated (fictional; no valuation, no "owed")', 72),
    amount: int('Fictional amount stated (model unit)', 0, 9999),
  }, ['label']), 1, 2),
  model: obj('Model scale and unit (display only)', {
    unit: str('Name of the fictional unit, e.g. "units"', 16),
    perToken: int('Units per token (0 = chosen so the column fits)', 0, 1000),
  }),
};

export const PE_STRINGS = {
  en: {
    record: 'Flow record (as supplied)',
    unit: 'units', fictional: 'fictional',
    inW: 'in', outW: 'out',
    reference: 'Reference scenario (as stated)',
    alleged: 'Alleged loss (as stated)',
    difference: 'Stated difference',
    asStated: 'as stated',
    scale: 'Model scale: 1\u00a0token\u00a0=\u00a0{n}\u00a0{u}',
    alsoNoted: 'Also noted',
    other: 'Put forward', alleged2: 'alleged', proposed: 'proposed', disputed: 'disputed',
    link: 'Link', kindCausal: 'causal (as supplied)', toDiff: 'stated difference',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    record: 'Registro de flujos (según lo aportado)',
    unit: 'unidades', fictional: 'ficticio',
    inW: 'entra', outW: 'sale',
    reference: 'Escenario de referencia (según lo declarado)',
    alleged: 'Pérdida alegada (según lo declarado)',
    difference: 'Diferencia declarada',
    asStated: 'según lo declarado',
    scale: 'Escala del modelo: 1\u00a0ficha\u00a0=\u00a0{n}\u00a0{u}',
    alsoNoted: 'También consta',
    other: 'Planteado', alleged2: 'alegado', proposed: 'propuesto', disputed: 'discutido',
    link: 'Enlace', kindCausal: 'causal (según lo aportado)', toDiff: 'diferencia declarada',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** "120 units (fictional)" — the number and its unit kept on one line. */
export function amountText(ctx, p, n) {
  const u = (p.model && p.model.unit) || ctx.t.unit;
  return `${n} ${u.replace(/ /g, ' ')} (${ctx.t.fictional})`;
}

/** Short supplied time label kept whole. */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, ' ') : String(s));

/** Record/band text of a flow entry. */
export function entryText(ctx, p, e) {
  return `${e.time ? `${nb(e.time)} · ` : ''}${e.label} · ${e.dir === 'in' ? ctx.t.inW : ctx.t.outW} ${amountText(ctx, p, e.amount)}`;
}

const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
export const MAX_TOKENS = 14;

/**
 * Resolve the model: tokens per entry at a scale that keeps the column within
 * MAX_TOKENS, the supplied running balance (never below 0: an outflow larger
 * than the balance removes what is there), the reference level and the tokens
 * of the stated difference. Nothing here is a valuation: it only sizes the
 * picture of the supplied figures.
 */
export function resolvePE(p) {
  const n = p.events.length;
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) {
    if (l.from < n) Object.assign(links[l.from], {kind: l.kind || 'sequence', status: l.status || 'proposed', label: l.label || ''});
  }
  let run = 0, peak = 0;
  for (const e of p.events) { run = Math.max(0, run + (e.dir === 'in' ? e.amount : -e.amount)); peak = Math.max(peak, run); }
  const diff = Math.max(0, (p.losses[0] && p.losses[0].amount) || 0);
  const need = Math.max(peak, 1);
  const per = p.model && p.model.perToken > 0 ? p.model.perToken : NICE.find(k => need / k <= MAX_TOKENS - 1) || 1000;
  const tok = a => Math.max(a > 0 ? 1 : 0, Math.round(a / per));
  const entries = p.events.map((e, i) => ({...e, i, tokens: Math.min(MAX_TOKENS, tok(e.amount))}));
  let stack = 0;
  for (const e of entries) { if (e.dir === 'in') { e.add = Math.min(MAX_TOKENS - stack, e.tokens); stack += e.add; } else { e.take = Math.min(stack, e.tokens); stack -= e.take; } }
  const refTokens = stack;
  const gapTokens = Math.min(refTokens, tok(diff));
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  return {n, entries, links, alternatives, losses: p.losses, per, refTokens, gapTokens, allegedTokens: refTokens - gapTokens, inTokens: entries.reduce((s, e) => s + (e.add || 0), 0)};
}

/** Link notes for links that carry supplied data. */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    const to = l.from + 1 < M.n ? String(l.from + 2) : t.toDiff;
    out.push({key: `lk${l.from}`, icon: 'link', disputed: l.status === 'disputed', text: `${t.link} ${l.from + 1} → ${to}: ${bits.join(' · ')}`});
  });
  return out;
}

/* ------------------------------------------------------------------------ */
/* Token simulation (pure)                                                  */
/* ------------------------------------------------------------------------ */

/**
 * Plan the token moves of the supplied flow: every token gets an id; in-entries
 * drop tokens one after another from the hopper onto the stack, out-entries let
 * the bottom token slide out through the right gate (then the stack settles),
 * and the stated difference lets `gapTokens` bottom tokens out through the left
 * (◆) gate. Returns a list of steps with [start, end] in a local 0..1 time and a
 * function state(tIn, tGap) → per-token {slot|tray, progress}.
 * @param {ReturnType<typeof resolvePE>} M
 */
export function planFlow(M) {
  const steps = [];
  let id = 0;
  const stack = [];
  const inQueue = [];
  for (const e of M.entries) {
    if (e.dir === 'in') for (let k = 0; k < e.add; k++) { const tk = id++; inQueue.push(tk); steps.push({kind: 'in', entry: e.i, token: tk}); }
    else for (let k = 0; k < e.take; k++) steps.push({kind: 'out', entry: e.i});
  }
  const total = id;
  // replay to fix which token each out-step removes (the bottom one at that moment); each step's share of its phase
  // is weighted by how far its token travels (a drop from the hopper to a low slot takes longer than to a high one),
  // so no token moves faster than the others
  for (const s of steps) {
    if (s.kind === 'in') { s.w = 0.45 + (MAX_TOKENS - stack.length) / MAX_TOKENS; stack.push(s.token); }
    else { s.token = stack.shift(); s.w = 2.2; }
  }
  const refStack = stack.slice();
  const gapSteps = refStack.slice(0, M.gapTokens).map(tk => ({kind: 'gap', token: tk, w: 1}));
  return {steps, gapSteps, total, refStack, allegedStack: refStack.slice(M.gapTokens)};
}

/**
 * Token positions at flow progress `a` (0..1 over the shared entries) and gap
 * progress `b` (0..1 over the stated difference). Each step takes a share of its
 * phase weighted by how far its token travels: an in-step drops a token from
 * the hopper onto the stack (0..1); an out / gap step slides the bottom token
 * out through its gate (0..0.7) and then the rest of the stack settles one slot
 * (0.7..1).
 * `vslot` is the visual slot (0 = bottom), fractional while settling.
 * @returns {{tokens: Array<{id:number, where:'hopper'|'fall'|'stack'|'out'|'gap', vslot:number, drop:number, slide:number}>, stack:number[], activeEntry:number|null}}
 */
export function flowState(P, a, b) {
  const st = new Map();
  for (let k = 0; k < P.total; k++) st.set(k, {id: k, where: 'hopper', vslot: 0, drop: 0, slide: 0});
  const stack = [];
  let lift = 0;
  let activeEntry = null;
  const run = (steps, prog, outKind) => {
    const tot = steps.reduce((q, s) => q + (s.w || 1), 0);
    let acc = 0;
    steps.forEach(s => {
      const w = s.w || 1;
      const f = tot ? clamp((prog * tot - acc) / w) : 1;
      acc += w;
      if (f <= 0) return;
      if (s.entry !== undefined && f < 1) activeEntry = s.entry;
      if (s.kind === 'in') {
        lift = 0;
        stack.push(s.token);
        Object.assign(st.get(s.token), {where: f < 1 ? 'fall' : 'stack', drop: f});
      } else {
        stack.shift();
        Object.assign(st.get(s.token), {where: outKind, slide: clamp(f / 0.7)});
        lift = 1 - ease.inOutQuad(clamp((f - 0.7) / 0.3));
      }
    });
  };
  run(P.steps, a, 'out');
  if (b > 0) run(P.gapSteps, b, 'gap');
  stack.forEach((t2, j) => { const q = st.get(t2); q.vslot = j + (q.where === 'fall' ? 0 : lift); });
  return {tokens: [...st.values()], stack: stack.slice(), activeEntry};
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

/** A unit token seen edge-on. Local origin = centre. */
export function tokenArt(ctx, {name, w, hh, tone = 0}) {
  const th = ctx.theme;
  const col = shade(th.accent3, tone);
  return g({name},
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, hh * 0.45), fill: col, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(-w * 0.36)} ${r(-hh * 0.12)}H${r(w * 0.36)}`, stroke: shade(col, -0.25), 'stroke-width': Math.max(1.5, hh * 0.12), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-w * 0.3)} ${r(-hh * 0.3)}H${r(-w * 0.05)}`, stroke: '#ffffff', 'stroke-width': Math.max(1.5, hh * 0.1), 'stroke-linecap': 'round', opacity: 0.45}),
  );
}

/**
 * Balance column: a glass rack of `cap` token slots, ticks every slot (no
 * numbers), a right gate (outflows) and a left gate (◆, the stated
 * difference). Local geometry returned for the entry to place tokens.
 */
export function columnGeom(x, baseY, CH, cap = MAX_TOKENS) {
  const cw = CH * 0.42;
  const tk = CH / cap;
  return {x0: x - cw / 2, x1: x + cw / 2, cx: x, baseY, top: baseY - CH, cw, tk, cap, tokW: cw * 0.82, tokH: tk * 0.86,
    slotY: s => baseY - (s + 0.5) * tk};
}

export function columnArt(ctx, {name, C, gate2 = true}) {
  const th = ctx.theme;
  const {x0, x1, baseY, top, cw, tk, cap} = C;
  const ticks = [];
  for (let s = 1; s < cap; s++) ticks.push(`M${r(x1)} ${r(baseY - s * tk)}h${r(cw * (s % 5 === 0 ? 0.16 : 0.09))}`);
  return g({name},
    h('path', {d: roundRectPath(x0 - 8, top - 10, x1 - x0 + 16, baseY - top + 26, 10), fill: th.paper, opacity: 0.55}),
    h('path', {d: `M${r(x0)} ${r(top - 6)}V${r(baseY)}M${r(x1)} ${r(top - 6)}V${r(baseY)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: ticks.join(''), stroke: th.inkSoft, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x0 - 16, baseY, x1 - x0 + 32, 16, 4), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    // right gate (outflows) and left gate (◆ stated difference): openings at the foot of the column
    h('path', {d: roundRectPath(x1 - 3, baseY - tk * 1.15, 10, tk * 1.15, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    gate2 ? h('path', {d: roundRectPath(x0 - 7, baseY - tk * 1.15, 10, tk * 1.15, 3), fill: th.accent2, stroke: th.ink, 'stroke-width': 1.5}) : null,
  );
}

/** Hopper above the column: a funnel whose mouth is at (cx, mouthY). */
export function hopperArt(ctx, {name, cx, mouthY, w, hh}) {
  const th = ctx.theme;
  return g({name},
    h('path', {d: `M${r(cx - w / 2)} ${r(mouthY - hh)}H${r(cx + w / 2)}L${r(cx + w * 0.16)} ${r(mouthY - hh * 0.25)}V${r(mouthY)}H${r(cx - w * 0.16)}V${r(mouthY - hh * 0.25)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(cx - w * 0.4)} ${r(mouthY - hh * 0.82)}H${r(cx + w * 0.4)}`, stroke: shade(th.woodTop, -0.25), 'stroke-width': 3}),
  );
}

/** A tray on the floor that collects tokens (right: outflows; left: ◆ stated difference). */
export function trayArt(ctx, {name, x0, x1, floorY, hh, alleged}) {
  const th = ctx.theme;
  return g({name},
    h('path', {d: `M${r(x0)} ${r(floorY - hh)}V${r(floorY)}H${r(x1)}V${r(floorY - hh)}`, fill: alleged ? th.accent2Soft : th.paperShade, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
  );
}

/**
 * Level marker arm (● reference / ◆ alleged): identical weight; a solid
 * horizontal arm with its glyph at the outer end. Local origin = the column
 * wall point it touches; `dir` = -1 (left) or +1 (right).
 */
export function levelMarker(ctx, {name, len, dir, side, s}) {
  const th = ctx.theme;
  const endX = dir * len;
  return g({name},
    h('path', {d: `M0 0H${r(endX)}`, stroke: th.ink, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    sideMark(ctx, {cx: endX + dir * s * 0.55, cy: 0, s, side}),
  );
}

/* ------------------------------------------------------------------------ */
/* Icons                                                                    */
/* ------------------------------------------------------------------------ */

/** Icon for a chip / record row. Kinds: in, out, ref, alleged, diff, alt, link, record, hopper, gate, scale. */
export function peIcon(ctx, it, x, cy, s) {
  const th = ctx.theme;
  const tok = (dx, dy, k = 1) => g({transform: T(x + s * dx, cy + s * dy)}, tokenArt(ctx, {w: s * 0.62 * k, hh: s * 0.2 * k}));
  switch (it.icon) {
    case 'in': return g(null,
      h('path', {d: `M${r(x + s * 0.18)} ${r(cy - s * 0.45)}H${r(x + s * 0.82)}L${r(x + s * 0.6)} ${r(cy - s * 0.18)}H${r(x + s * 0.4)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 1.5}),
      tok(0.5, 0.05), tok(0.5, 0.3));
    case 'out': return g(null,
      tok(0.42, -0.2), tok(0.42, 0.05),
      h('path', {d: `M${r(x + s * 0.06)} ${r(cy + s * 0.22)}V${r(cy + s * 0.42)}H${r(x + s * 0.94)}V${r(cy + s * 0.22)}`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.5}),
      tok(0.62, 0.32, 0.7));
    case 'ref': case 'alleged': return g(null,
      h('path', {d: `M${r(x + s * 0.5)} ${r(cy - s * 0.45)}V${r(cy + s * 0.45)}`, stroke: th.metalDark, 'stroke-width': 3}),
      h('path', {d: `M${r(x + s * 0.5)} ${r(cy)}H${r(x + s * 0.12)}`, stroke: th.ink, 'stroke-width': 3}),
      sideMark(ctx, {cx: x + s * 0.12, cy, s: s * 0.34, side: it.icon === 'ref' ? 'before' : 'after'}),
      tok(0.72, 0.28, 0.7));
    case 'diff': return g(null,
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.4)}H${r(x + s * 0.55)}V${r(cy + s * 0.4)}H${r(x + s * 0.3)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
      sideMark(ctx, {cx: x + s * 0.18, cy: cy - s * 0.4, s: s * 0.26, side: 'before'}),
      sideMark(ctx, {cx: x + s * 0.18, cy: cy + s * 0.4, s: s * 0.26, side: 'after'}));
    case 'alt': return g({transform: T(x + s / 2, cy + s * 0.45)}, barrierArt(ctx, {name: `pealt-${it.key}-${Math.round(s)}`, w: s * 0.95, h: s * 0.9}));
    case 'link': return linkIcon(ctx, {cx: x + s / 2, cy, s, disputed: it.disputed});
    case 'record': return g(null,
      h('path', {d: roundRectPath(x + s * 0.18, cy - s * 0.42, s * 0.64, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.18)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}));
    case 'scale': return g(null, tok(0.5, -0.1), h('path', {d: `M${r(x + s * 0.15)} ${r(cy + s * 0.2)}H${r(x + s * 0.85)}M${r(x + s * 0.15)} ${r(cy + s * 0.1)}v${r(s * 0.2)}M${r(x + s * 0.85)} ${r(cy + s * 0.1)}v${r(s * 0.2)}`, stroke: th.ink, 'stroke-width': 2}));
    case 'hopper': return h('path', {d: `M${r(x + s * 0.1)} ${r(cy - s * 0.35)}H${r(x + s * 0.9)}L${r(x + s * 0.62)} ${r(cy + s * 0.1)}V${r(cy + s * 0.35)}H${r(x + s * 0.38)}V${r(cy + s * 0.1)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 1.5});
    case 'gate': return g(null, h('path', {d: roundRectPath(x + s * 0.4, cy - s * 0.4, s * 0.2, s * 0.8, 3), fill: th.accent2, stroke: th.ink, 'stroke-width': 1.5}), tok(0.2, 0.25, 0.6));
    default: return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Chips and the record sheet (after kits/dano-material.js, with this icon set) */
/* ------------------------------------------------------------------------ */

const itemIcon = (ctx, it, x, cy, s) => peIcon(ctx, it, x, cy, s);

/**
 * Measure an icon chip (icon at the left, fitted text in a rounded box).
 * @returns {{w:number,h:number,bad:boolean, build:(x:number,y:number,name:string,style?:any)=>{node:any, box:any}}}
 */
export function iconChip(ctx, it, o) {
  const th = ctx.theme;
  const size = o.size;
  const iconS = it.icon ? size * 1.5 : 0;
  const iw = it.icon ? iconS + 10 : 0;
  const mw = Math.max(size * 4, o.maxW - iw);
  const maxLines = it.maxLines ?? o.maxLines ?? 3;
  const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines});
  const probe = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines});
  const hh = Math.max(probe.box.h, iconS);
  const w = iw + probe.box.w;
  return {
    w, h: hh, bad: probe.fit.truncated || probe.fit.broken, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, it.text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft, dash: style.dash, textName: style.textName});
      const icon = it.icon ? itemIcon(ctx, it, x, y + hh / 2, iconS, o.kind) : null;
      return {node: g({name, opacity: style.opacity ?? 0}, icon, c.node), box: {x, y, w, h: hh}, chip: c.box};
    },
  };
}


/**
 * Measure / build the incident record. Rows: {key, icon, text, i?, level?}.
 * Text rows use fitG (glue-aware, never breaks a word); with labels hidden each
 * row shows simulated writing bars instead (a prop, not supplied text).
 * @param {any} ctx
 * @param {{prefix:string, w:number, size:number, header:string, rows:any[], kind:string, maxLines?:number, text:boolean}} o
 */
export function recordMeasure(ctx, o) {
  const size = o.size;
  const pad = Math.max(14, size * 0.7);
  const iconS = size * 1.9;
  const textW = o.w - 2 * pad - iconS - 12;
  // header: null → a sheet without a heading (e.g. a clipboard that only holds one row)
  const noHead = o.header === null;
  const headFit = o.text && !noHead ? fitG(ctx, o.header, {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const headH = noHead ? size * 0.3 : o.text ? headFit.height + size * 0.6 : size * 1.4;
  const rows = o.rows.map(rw => {
    if (!o.text) return {...rw, fit: null, h: Math.max(iconS, size * 1.5) + size * 0.5};
    const fit = fitG(ctx, rw.text, {maxWidth: textW, size, minSize: size, maxLines: rw.maxLines ?? o.maxLines ?? 3, weight: rw.weight ?? 600});
    return {...rw, fit, h: Math.max(iconS, fit.height) + size * 0.5};
  });
  const bad = (headFit && (headFit.truncated || headFit.broken)) || rows.some(rw => rw.fit && (rw.fit.truncated || rw.fit.broken));
  const clipH = Math.max(18, size * 0.9);
  const h0 = clipH * 0.5 + pad * 0.6 + headH + rows.reduce((s, rw) => s + rw.h, 0) + pad * 0.6;
  return {size, pad, iconS, textW, headFit, headH, rows, bad, h: h0, w: o.w, clipH, noHead};
}

/**
 * Build the record from a measurement at (x, y) (y = top of the clipboard).
 * Named nodes: `${prefix}` (whole), `${prefix}-row-${key}` (each row group),
 * `${prefix}-txt-${key}` (row text), `${prefix}-wipe-${key}-${line}` (clip rects
 * for rows marked `wipe`). Returns row boxes and each row's line geometry.
 */
export function recordBuild(ctx, m, o) {
  const th = ctx.theme;
  const {x, y} = o;
  const P = o.prefix;
  const {pad, iconS, size} = m;
  const w = m.w;
  const out = [];
  const nodes = [];
  let cy = y + m.clipH * 0.5 + pad * 0.6;
  if (m.headFit) nodes.push(textBlock(m.headFit, {x: x + pad, y: cy, fill: th.ink, name: `${P}-head`}));
  else if (!m.noHead) nodes.push(h('rect', {x: r(x + pad), y: r(cy + size * 0.2), width: r(w * 0.45), height: r(size * 0.5), rx: 3, fill: th.inkSoft, opacity: 0.55}));
  cy += m.headH;
  if (!m.noHead) nodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.3)}H${r(x + w - pad)}`, stroke: th.ink, 'stroke-width': 2}));
  const rowNodes = [];
  m.rows.forEach((rw, i) => {
    const top = cy;
    const icy = top + rw.h / 2 - size * 0.1;
    const tx = x + pad + iconS + 12;
    const icon = itemIcon(ctx, rw, x + pad, icy, iconS, o.kind);
    let textNode = null;
    let lines = [];
    const clipDefs = [];
    if (rw.fit) {
      const ty = top + (rw.h - size * 0.5 - rw.fit.height) / 2 + size * 0.05;
      lines = rw.fit.lines.map((ln, li) => ({x: tx, y: ty + li * rw.fit.lineHeight, w: ctx.measure(ln.replace(/\u00a0/g, ' '), rw.fit.size, rw.fit.weight, rw.fit.family), h: rw.fit.size}));
      const tb = textBlock(rw.fit, {x: tx, y: ty, fill: th.ink, name: `${P}-txt-${rw.key}`});
      if (rw.wipe) {
        clipDefs.push(h('clipPath', {id: ctx.id(`${P}-clip-${rw.key}`)}, lines.map((ln, li) => h('rect', {name: `${P}-wipe-${rw.key}-${li}`, x: r(ln.x - 4), y: r(ln.y - size * 0.25), width: 0, height: r(rw.fit.lineHeight + 2)}))));
        textNode = g({'clip-path': `url(#${ctx.id(`${P}-clip-${rw.key}`)})`}, tb);
      } else textNode = tb;
    } else {
      // simulated writing bars (labels hidden)
      const bw = m.textW;
      lines = [0, 1].map(li => ({x: tx, y: top + rw.h * 0.28 + li * size * 0.75, w: bw * (li ? 0.55 : 0.85), h: size * 0.4}));
      const bars = lines.map((ln, li) => h('path', {name: rw.wipe ? `${P}-bar-${rw.key}-${li}` : undefined, d: `M${r(ln.x)} ${r(ln.y + size * 0.2)}H${r(ln.x + ln.w)}`, stroke: th.inkSoft, 'stroke-width': r(size * 0.28), 'stroke-linecap': 'round', opacity: 0.6, 'stroke-dasharray': rw.wipe ? `${r(ln.w)} ${r(ln.w + 40)}` : null, 'stroke-dashoffset': rw.wipe ? r(ln.w) : null}));
      textNode = g(null, bars);
    }
    const hl = rw.highlight ? h('path', {name: `${P}-hl-${rw.key}`, d: roundRectPath(x + pad * 0.25, top + size * 0.05, w - pad * 0.5, rw.h - size * 0.4, 6), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, opacity: 0}) : null;
    const rowG = g({name: `${P}-row-${rw.key}`, opacity: rw.startHidden ? 0 : undefined}, hl, clipDefs.length ? h('defs', null, clipDefs) : null, g({name: `${P}-icon-${rw.key}`, opacity: rw.iconHidden ? 0 : undefined}, icon), textNode);
    rowNodes.push(rowG);
    const box = {x: x + pad * 0.5, y: top, w: w - pad, h: rw.h};
    out.push({key: rw.key, box, lines, iconBox: {x: x + pad, y: icy - iconS / 2, w: iconS, h: iconS}, textBox: rw.fit ? {x: tx, y: lines[0].y, w: Math.max(...lines.map(l => l.w)), h: rw.fit.height} : {x: tx, y: top, w: m.textW, h: rw.h}});
    cy += rw.h;
    if (i < m.rows.length - 1) rowNodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.25)}H${r(x + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5}));
  });
  const H0 = m.h;
  const board = g(null,
    h('path', {d: roundRectPath(x - 10, y - 4, w + 20, H0 + 14, 10), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(x, y + m.clipH * 0.3, w, H0 - m.clipH * 0.3, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x + w / 2 - w * 0.14, y - m.clipH * 0.35, w * 0.28, m.clipH, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
  );
  return {node: g({name: P}, board, nodes, rowNodes), rows: out, box: {x: x - 10, y: y - m.clipH * 0.35, w: w + 20, h: H0 + 14 + m.clipH * 0.35}, paper: {x, y: y + m.clipH * 0.3, w, h: H0 - m.clipH * 0.3}};
}


/* ------------------------------------------------------------------------ */
/* Mini balance column (mechanism / contrast / inspect elements)            */
/* ------------------------------------------------------------------------ */

/** Width of a mini column relative to its height. */
export const MINI_W = 0.56;

/**
 * Geometry of a mini balance column of height H (local origin = bottom centre):
 * token slot height, the reference level, the level shown and the "spot" (the
 * middle of the stated gap on an alleged column).
 */
export function miniGeom(H, M) {
  const W = MINI_W * H;
  const cap = MAX_TOKENS;
  const tk = H * 0.9 / cap;
  const lvl = n => -H * 0.06 - n * tk;
  return {W, H, tk, cap, refY: lvl(M.refTokens), allY: lvl(M.allegedTokens), spot: {x: 0, y: (lvl(M.refTokens) + lvl(M.allegedTokens)) / 2}, lvl};
}

/**
 * A mini balance column (static): rack, ticks, `n` tokens and a level arm of
 * the given side (● reference / ◆ alleged). The alleged column also shows the
 * reference level as a thin solid line (the stated gap is the empty space
 * between the line and the stack) — no dashes: nothing here is disputed.
 * Local origin = bottom centre.
 */
export function miniColumn(ctx, {name, H, M, side}) {
  const th = ctx.theme;
  const G = miniGeom(H, M);
  const {W, tk} = G;
  const n = side === 'after' ? M.allegedTokens : M.refTokens;
  const x0 = -W * 0.34, x1 = W * 0.34;
  const top = -H;
  const ticks = [];
  for (let s = 1; s < G.cap; s++) ticks.push(`M${r(x1)} ${r(G.lvl(s))}h${r(W * (s % 5 === 0 ? 0.08 : 0.045))}`);
  const toks = [];
  for (let k = 0; k < n; k++) toks.push(g({transform: T(0, G.lvl(k) - tk / 2)}, tokenArt(ctx, {w: (x1 - x0) * 0.84, hh: tk * 0.86, tone: (k % 3) * 0.05})));
  const armY = side === 'after' ? G.allY : G.refY;
  const arm = g(null,
    h('path', {d: `M${r(x0)} ${r(armY)}H${r(x0 - W * 0.22)}`, stroke: th.ink, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    sideMark(ctx, {cx: x0 - W * 0.22 - W * 0.09, cy: armY, s: W * 0.16, side}));
  return g({name},
    h('path', {d: roundRectPath(x0 - 6, top - 6, x1 - x0 + 12, H + 6, 8), fill: th.paper, opacity: 0.6}),
    h('path', {d: `M${r(x0)} ${r(top)}V${r(-H * 0.06)}M${r(x1)} ${r(top)}V${r(-H * 0.06)}`, stroke: th.metalDark, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('path', {d: ticks.join(''), stroke: th.inkSoft, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(x0 - 10, -H * 0.06, x1 - x0 + 20, H * 0.06, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    toks,
    // on the ◆ column the stated gap is a soft neutral band between the reference line (●) and the level shown
    side === 'after' && M.gapTokens ? h('path', {d: roundRectPath(x0 + 3, G.refY, x1 - x0 - 6, G.allY - G.refY, 3), fill: th.accent2Soft, opacity: 0.85}) : null,
    side === 'after' ? h('path', {d: `M${r(x0 + 2)} ${r(G.refY)}H${r(x1 - 2)}`, stroke: th.inkSoft, 'stroke-width': 2.5}) : null,
    side === 'after' ? sideMark(ctx, {cx: x0 + W * 0.1, cy: G.refY, s: W * 0.1, side: 'before'}) : null,
    // the stated gap on the ◆ column: a solid bracket from the reference line to the level shown
    side === 'after' && M.gapTokens ? h('path', {d: `M${r(x1 - 4)} ${r(G.refY)}H${r(x1 + W * 0.12)}V${r(G.allY)}H${r(x1 - 4)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}) : null,
    arm,
  );
}

/* ------------------------------------------------------------------------ */
/* Spanish defaults                                                         */
/* ------------------------------------------------------------------------ */

/** Shared Spanish versions of the default fictional content (events and the stated difference). */
export const PE_ES_DEFAULTS = {
  events: [
    {label: 'Ingresos de la tienda', time: 'Mes 1', dir: 'in', amount: 200},
    {label: 'Pago a un proveedor', time: 'Mes 1', dir: 'out', amount: 60},
    {label: 'Ingresos de la tienda', time: 'Mes 2', dir: 'in', amount: 160},
  ],
  losses: [{label: 'Diferencia declarada por la tienda', amount: 120}],
};

/**
 * Wrap a scene so that, with locale "es", every top-level param still equal to the English default is replaced by its
 * Spanish default (the author's own values are never touched; other locales and every supplied value render as
 * before). The replacement is a view of the context: layout, build and frame all see the same localised params.
 */
export function localizeScene(scene, defaults, es) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const cache = new WeakMap();
  const view = ctx => {
    const p = ctx.params;
    if (!p || p.locale !== 'es') return ctx;
    let c = cache.get(ctx);
    if (c) return c;
    const q = {...p};
    let changed = false;
    for (const [k, v] of Object.entries(es)) if (k in defaults && same(p[k], defaults[k])) { q[k] = v; changed = true; }
    c = changed ? {...ctx, params: q} : ctx;
    cache.set(ctx, c);
    return c;
  };
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => scene.frame(view(ctx), ...a),
  };
}
