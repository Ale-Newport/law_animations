/**
 * Parameter fields for the "Oferta comunicada" motif (LAW-0441..0444).
 * Category fields from the briefs: parties, offer, terms, responses.
 * Built with the shared schema builders; kept local to this motif because
 * src/schemas/fields.js has no contract-formation set yet.
 *
 * Content rules encoded in the descriptions: fictional parties, descriptive
 * sent/received states only, hypothetical amounts labelled as hypothetical,
 * and no acceptance or contract formation is ever implied by the scene.
 * @module animations/contract-formation/kits/offer-fields
 */
import {str, list, obj, oneOf, party} from '../../../schemas/fields.js';

/** Roles a term can play. `quantity` × `unitPrice` enables a computed total. */
export const TERM_KEYS = ['item', 'quantity', 'unitPrice', 'delivery', 'payment', 'other'];

export const term = obj('One term of the offer as printed on the sheet', {
  key: oneOf('Role of the term (quantity × unitPrice enables a computed total in the inspect treatment)', TERM_KEYS),
  label: str('Printed label, e.g. "Unit price (hypothetical)"; label hypothetical amounts as hypothetical', 48),
  value: str('Printed value; numbers only for quantity/unitPrice if a computed total is wanted', 60),
}, ['key', 'label', 'value']);

export const offerFields = {
  parties: list('Offeror (first, sends the offer) and offeree (second, the addressee); fictional by default', party, 2, 2),
  offer: obj('The communicated offer sheet', {
    reference: str('Reference printed on the sheet (fictional)', 32),
    title: str('Heading printed on the sheet, e.g. "Offer to supply"', 80),
  }, ['reference', 'title']),
  terms: list('Terms printed on the offer, in order (2–4). They travel unchanged from offeror to offeree', term, 2, 4),
};

/** Optional descriptive notes from the offeree. Never an acceptance by default. */
export const responsesField = {
  responses: list('Descriptive notes shown at the offeree after receipt (e.g. "Received — reviewing"); the scene never turns them into an acceptance', obj('Note', {
    text: str('Note text (descriptive, not an acceptance)', 80),
  }, ['text']), 0, 1),
};
