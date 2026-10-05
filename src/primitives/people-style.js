/**
 * Appearance resolution for stylized characters. Defaults derive from the
 * seed and the actor index; explicit appearance overrides always win.
 * Appearance is never tied to a role, outcome or trustworthiness.
 * @module primitives/people-style
 */
import {SKIN_TONES, HAIR_COLORS} from '../core/theme.js';

export const HAIR_STYLES = ['short', 'long', 'bun', 'curly', 'buzz', 'scarf'];

/**
 * @param {any} ctx
 * @param {{appearance?: {skin?:number, hair?:string, hairColor?:number, outfit?:number, glasses?:boolean}}} [party]
 * @param {number} index actor index within the scene
 */
export function actorLook(ctx, party, index) {
  const a = (party && party.appearance) || {};
  const cloth = ctx.theme.cloth;
  // Spread defaults so adjacent actors differ, seeded for variety.
  const base = Math.floor(ctx.rng('look-base') * 6);
  const skinIdx = a.skin ?? (base + index * 2 + Math.floor(ctx.rng('look-skin', index) * 2)) % SKIN_TONES.length;
  const hair = a.hair ?? HAIR_STYLES[(Math.floor(ctx.rng('look-hair-base') * 6) + index * 3 + (index > 1 ? 1 : 0)) % HAIR_STYLES.length];
  const hairColorIdx = a.hairColor ?? Math.floor(ctx.rng('look-hair-col', index) * HAIR_COLORS.length);
  const outfitIdx = a.outfit ?? (Math.floor(ctx.rng('look-outfit-base') * cloth.length) + index * 4 + (index > 1 ? 1 : 0)) % cloth.length;
  return {
    skin: SKIN_TONES[skinIdx],
    hair,
    hairColor: HAIR_COLORS[hairColorIdx],
    outfit: cloth[outfitIdx],
    glasses: a.glasses ?? ctx.rng('look-glasses', index) > 0.72,
  };
}
