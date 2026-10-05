/**
 * LAW-0185 — Mediación entre partes · story
 *
 * Storyboard (side view of a meeting table, slightly from above):
 *  0.00–0.15  rest: Party A (left end) and Party B (right end) seated facing
 *             each other; the mediator sits behind the table facing the
 *             viewer, hands on an agenda clipboard; a wooden turn token lies
 *             in front of the agenda.
 *  0.15–0.42  the mediator looks at the first speaker, slides the token
 *             across the table to them (hand on the token the whole way);
 *             the first speaker rests a hand on it, a speech bubble opens and
 *             their mouth moves; the agenda row of that turn lights up.
 *  0.42–0.73  the mediator raises an open hand (end of turn), ticks the row
 *             with the pen, pulls the token back to the centre where the
 *             other hand takes it and slides it to the second speaker, who
 *             takes the floor while the first listens.
 *  0.73–1.00  hold: the supplied final state (floor with the second speaker,
 *             floor kept by the first, or both turns completed). No outcome
 *             of the dispute is shown or implied.
 * Speaking order comes from the sequence relationship between the parties.
 * @module animations/roles/LAW-0185
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {mediationRolesFields, MEDIATION_DEFAULTS, speakingOrder, roleOf} from './kits/mediation-fields.js';
import {mediationStage, turnScript, MED_STAGES} from './kits/mediation-table.js';
import {fitNote, wchip} from './kits/mediation-labels.js';

const ID = 'LAW-0185';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/**
 * Action clock c: 0 at u=0.15, 1 at u=0.73 (second speaker has started).
 * Inside the action the clock is eased so the first turn is under way by the
 * middle of the action beat: c = x + 0.55·x·(1−x)², x = (u−0.15)/0.58 — a
 * monotone warp whose slope is 1 again at x = 1, so motion stays smooth where
 * the linear extension (x > 1, used for the hold) takes over.
 */
const C0 = 0.15, C1 = 0.73, WARP = 0.55;
const warp = x => (x > 0 && x < 1 ? x + WARP * x * (1 - x) * (1 - x) : x);
const PLAN = {'second-has-floor': 'second', 'first-has-floor': 'first', 'both-heard': 'both'};
const C_END = {second: 1.12, first: 1.12, both: 1.3};
const TARGETS = ['token', 'agenda'];

const STRINGS = {
  en: {hasFloor: 'has the floor', bothDone: 'Both turns completed'},
  es: {hasFloor: 'tiene la palabra', bothDone: 'Ambos turnos completados'},
};

const sceneSchema = {
  ...mediationRolesFields,
  actorLabels: obj('Chip captions next to each actor (empty = role caption)', {
    a: str('Caption for Party A', 50), b: str('Caption for Party B', 50), mediator: str('Caption for the mediator', 50),
  }),
  objectLabels: obj('Names of props used in captions', {token: str('Name of the turn token (used in the final status and callouts)', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no outcome of the dispute is inferred)', ['second-has-floor', 'first-has-floor', 'both-heard']),
};

const defaultParams = {
  ...MEDIATION_DEFAULTS,
  actorLabels: {a: '', b: '', mediator: ''},
  objectLabels: {token: 'Turn token'},
  actionProgress: 1,
  annotations: [{target: 'token', text: 'The token marks who has the floor'}],
  finalState: 'second-has-floor',
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const cfg = MED_STAGES[shape];
    const s = Math.min(ctx.design.w / cfg.W, ctx.design.h / cfg.H);
    const ox = (ctx.design.w - cfg.W * s) / 2;
    const oy = (ctx.design.h - cfg.H * s) / 2;
    // free design space around the stage (stage units): labels may use it
    const mx = ox / s, my = oy / s;
    const order = speakingOrder(p.relationships);
    const captions = {a: p.actorLabels.a || roleOf(p, 'a'), b: p.actorLabels.b || roleOf(p, 'b'), mediator: p.actorLabels.mediator || roleOf(p, 'mediator')};
    const plan = PLAN[p.finalState];
    const [F, S] = order;
    const narrow = cfg.W < 1000;

    // Editorial callouts sit on the table's front panel, leaders up to the
    // tabletop; each takes the panel half on the side of its target. They get
    // the largest font that fits the free band without cutting the text.
    const makeNotes = stage => {
      const G = stage.G;
      const endTok = plan === 'first' ? stage.spot(F) : stage.spot(S);
      const targetPt = {
        token: {x: endTok.x, y: endTok.y + 6 * G.z},
        agenda: {x: G.cx - G.agenda.w * 0.25, y: G.agenda.cy + 6 * G.z},
      };
      const n = p.annotations.length;
      const sideOf = a => Math.sign(targetPt[a.target].x - G.cx) || -1;
      const lanes = n > 1 ? (sideOf(p.annotations[0]) <= sideOf(p.annotations[1]) ? [-1, 1] : [1, -1]) : [0];
      return ctx.show('all') ? p.annotations.map((a, i) => fitNote(ctx, {
        name: `note${i}`, text: a.text, target: targetPt[a.target],
        chipAt: {x: G.cx + lanes[i] * G.nearHalf * 0.48, y: stage.panelFreeY},
        maxWidth: n > 1 ? G.nearHalf * 0.92 : G.nearHalf * 1.6,
        size: 28 * G.z, minSize: 19 * G.z, maxLines: narrow ? 5 : 4, bottom: stage.panelFreeBottom,
      })) : [];
    };
    const build = plateAt => {
      const stage = mediationStage(ctx, {prefix: 'st', cfg, actors: p.actors, captions, props: p.props, order, plateAt, marginX: mx, bottom: cfg.H + my - 4});
      const built = {stage, notes: makeNotes(stage)};
      built.ok = stage.chipsOK && !built.notes.some(x => x.overflow);
      return built;
    };
    // The name plate leaves the panel (to its lower edge, then to the floor
    // line) when the callouts need the room; a layout is only accepted when
    // no callout is cut and no name chip overlaps another.
    let built = build('panel');
    for (const alt of ['low', 'floor']) {
      if (built.ok) break;
      const next = build(alt);
      if (next.ok) built = next;
    }
    const {stage, notes} = built;
    const labelsFit = built.ok;
    const G = stage.G;
    const script = turnScript(stage, plan);

    // Final-state tag, anchored to the person who holds the floor: beside
    // their head on the free outer side (wide frames) or above their bubble.
    let tag = null;
    if (ctx.show('key')) {
      const tagChip = (text, o2) => wchip(ctx, text, {size: 34, minSize: 26, name: 'state-tag', color: th.accent4, stroke: th.accent4, weight: 700, ...o2});
      if (plan === 'both') {
        // both bubbles are closed in the hold: centred over the table
        const b = stage.bubA.box;
        tag = tagChip(`● ${ctx.t.bothDone}`, {x: G.cx, y: b.y + b.h * 0.22, anchor: 'middle', maxWidth: cfg.W - 80, maxLines: 2});
      } else {
        const who = plan === 'first' ? F : S;
        const dir = who === 'a' ? -1 : 1;
        const hip = who === 'a' ? G.hipA : G.hipB;
        const head = who === 'a' ? G.headA : G.headB;
        const bub = stage[who === 'a' ? 'bubA' : 'bubB'].box;
        const full = `● ${roleOf(p, who)} · ${ctx.t.hasFloor}`;
        const short = `● ${ctx.t.hasFloor}`;
        const outer = hip.x + dir * 70 * G.k;
        const edge = dir > 0 ? cfg.W + mx - 10 : -mx + 10;
        const room = Math.abs(edge - outer) - 16;
        if (cfg.bubbles === 'side' && room >= 240) {
          // one line (bounded shrink) first, then up to three lines, then the short form
          const o2 = {x: outer + dir * 16, anchor: dir > 0 ? 'start' : 'end', maxWidth: Math.min(room, 440)};
          const tries = [[full, 1], [full, 3], [short, 2]];
          let t = null;
          for (const [text, n] of tries) {
            t = tagChip(text, {...o2, y: 0, maxLines: n});
            if (!t.fit.truncated) break;
          }
          tag = tagChip(t.fit.full, {...o2, y: head.y - t.box.h / 2, maxLines: t.fit.lines.length});
        } else {
          // above the speaker's bubble: two lines over the bubble, else one
          // wider line across the top band, else the short form
          const bottom = bub.y - 14 * G.z;
          const room = bottom + my - 4;
          const place = (text, maxWidth, n) => {
            const o2 = {anchor: 'middle', maxWidth};
            const probe = tagChip(text, {...o2, x: 0, y: 0, maxLines: n});
            const half = probe.box.w / 2 + 6;
            return {...o2, x: Math.min(Math.max(bub.x + bub.w / 2, -mx + half), cfg.W + mx - half)};
          };
          const narrowW = Math.min(bub.w + 140 * G.z, cfg.W + 2 * mx - 20);
          const tries = [[full, place(full, narrowW, 2), 2], [full, place(full, cfg.W + 2 * mx - 20, 1), 1], [short, place(short, narrowW, 2), 2]];
          let t = null, o2 = null;
          for (const [text, oo, n] of tries) {
            o2 = {...oo, maxLines: n};
            t = tagChip(text, {...o2, y: 0});
            if (!t.fit.truncated && t.box.h <= room) break;
          }
          tag = tagChip(t.fit.full, {...o2, y: bottom - t.box.h});
        }
      }
    }
    return {stage, script, plan, s, ox, oy, tag, notes, labelsFit};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const cEnd = C_END[L.plan];
    const cRaw = warp((u - C0) / (C1 - C0));
    const cap = lerp(0, cEnd, p.actionProgress);
    const c = Math.max(0, Math.min(cRaw, cap));
    const input = L.script(c, timeMs, ctx.reduced);
    const posed = L.stage.pose(input);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const holdStart = L.plan === 'both' ? 0.9 : 0.8;
    const noteP = done ? seg(u, holdStart, holdStart + 0.08) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - holdStart) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        clock: Math.round(c * 1000) / 1000,
        order: L.stage.order.join('>'),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && cRaw > cap,
        plate: L.stage.plateAt,
        labelsFit: L.labelsFit,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-07-story',
    title: 'Mediation between parties — turn-taking at the table',
    titleEs: 'Mediación entre partes — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Mediación entre partes',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a meeting table: the mediator, seated behind it, slides a wooden turn token to the first speaker, ends that turn with an open hand, ticks the agenda and passes the token to the other party. Speech bubbles and mouths show who speaks; the final state is supplied by the author.',
    tags: ['mediation', 'turn-taking', 'token', 'agenda', 'speech bubble', 'table', 'three people', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/mediation-table.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-fields.js', 'src/primitives/person.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
