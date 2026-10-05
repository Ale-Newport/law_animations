/**
 * Parameter fields for the "Mediación entre partes" motif (LAW-0185..0188).
 * Built only from the shared builders in schemas/fields.js. This is a local
 * field set for the roles category (actors / roles / relationships / props);
 * it can be promoted to schemas/fields.js when another roles motif needs it.
 *
 * Conventions shared by the four entries:
 *  - actors[0] = Party A (seated at the left end), actors[1] = Party B (right
 *    end), actors[2] = the mediator (behind the table, facing the viewer);
 *  - a `sequence` relationship between the two parties sets the speaking
 *    order (its `from` speaks first). Other kinds are descriptive only.
 * @module animations/roles/kits/mediation-fields
 */
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';

/** Actor ids used by relationships and annotations. */
export const MEDIATION_ACTORS = ['a', 'b', 'mediator'];

const relationship = obj('A relationship between two actors', {
  from: oneOf('Source actor', MEDIATION_ACTORS),
  to: oneOf('Target actor', MEDIATION_ACTORS),
  kind: oneOf('relation | communication | sequence | causal. A sequence link between the two parties sets who speaks first (its "from").', RELATION_KINDS),
}, ['from', 'to', 'kind']);

/** Category fields for the roles category, specialised for this motif. */
export const mediationRolesFields = {
  actors: list('Party A, Party B and the mediator, in this order (fictional people)', party, 3, 3),
  roles: obj('Descriptive role captions (never a legal finding)', {
    a: str('Role caption for Party A', 40),
    b: str('Role caption for Party B', 40),
    mediator: str('Role caption for the third person who organises the turns', 40),
  }),
  relationships: list('Explicit relationships between the actors. A sequence link between the parties sets the speaking order', relationship, 1, 6),
  props: obj('Props on the table', {
    agendaTitle: str('Heading printed on the agenda clipboard', 30),
    agendaItems: list('Agenda items; the first two rows are the two speaking turns', str('Agenda item', 60), 2, 4),
    speech: obj('Optional short text inside the speech bubbles (empty = abstract speech lines)', {
      a: str('Text in Party A’s bubble', 48),
      b: str('Text in Party B’s bubble', 48),
    }),
  }),
};

/** Default category values shared by the four entries (fictional, illustrative). */
export const MEDIATION_DEFAULTS = {
  actors: [
    {name: 'Alex Moreno', role: 'Party A'},
    {name: 'Sam Okafor', role: 'Party B'},
    {name: 'Dana Reyes', role: 'Mediator'},
  ],
  roles: {a: 'Party A', b: 'Party B', mediator: 'Mediator'},
  relationships: [
    {from: 'mediator', to: 'a', kind: 'communication'},
    {from: 'mediator', to: 'b', kind: 'communication'},
    {from: 'a', to: 'b', kind: 'sequence'},
  ],
  props: {
    agendaTitle: 'Agenda',
    agendaItems: ['Party A: account', 'Party B: account', 'Questions'],
    speech: {a: '', b: ''},
  },
};

/** Spanish counterparts for presets. */
export const MEDIATION_DEFAULTS_ES = {
  actors: [
    {name: 'Alex Moreno', role: 'Parte A'},
    {name: 'Sam Okafor', role: 'Parte B'},
    {name: 'Dana Reyes', role: 'Mediadora'},
  ],
  roles: {a: 'Parte A', b: 'Parte B', mediator: 'Mediadora'},
  props: {
    agendaTitle: 'Orden del día',
    agendaItems: ['Parte A: exposición', 'Parte B: exposición', 'Preguntas'],
    speech: {a: '', b: ''},
  },
};

/**
 * Speaking order from the relationships: the `from` of the first sequence
 * link between the two parties speaks first. Defaults to A then B.
 * @param {Array<{from:string,to:string,kind:string}>} relationships
 * @returns {['a','b']|['b','a']}
 */
export function speakingOrder(relationships) {
  const seq = (relationships || []).find(r => r.kind === 'sequence' && ((r.from === 'a' && r.to === 'b') || (r.from === 'b' && r.to === 'a')));
  return seq && seq.from === 'b' ? ['b', 'a'] : ['a', 'b'];
}

/** Role caption of an actor id, falling back to the party's own role. */
export function roleOf(p, id) {
  const idx = id === 'a' ? 0 : id === 'b' ? 1 : 2;
  return (p.roles && p.roles[id]) || (p.actors[idx] && p.actors[idx].role) || '';
}
