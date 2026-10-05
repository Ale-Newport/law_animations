/**
 * Runtime parameter validation for a documented JSON-Schema subset, plus a
 * predictable deep-patch: objects merge by property, arrays and scalars are
 * REPLACED wholesale (never merged element-wise). Unknown and unsafe keys are
 * rejected with descriptive errors.
 * @module core/schema
 */

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class ParamError extends Error {
  /** @param {string[]} problems */
  constructor(problems) {
    super(`Invalid animation parameters:\n - ${problems.join('\n - ')}`);
    this.name = 'ParamError';
    this.problems = problems;
  }
}

/** Deep clone of JSON-compatible data. */
export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Validate a value against a schema node. Returns a list of problems.
 * Supported keywords: type (string|number|integer|boolean|object|array|null or
 * an array of those), enum, minLength, maxLength, pattern, minimum, maximum,
 * properties, required, additionalProperties(false), items, minItems, maxItems,
 * x-format ('color' | 'background').
 * @param {any} schema
 * @param {any} value
 * @param {string} [path]
 * @returns {string[]}
 */
export function validate(schema, value, path = 'params') {
  const problems = [];
  if (!schema) return problems;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : null;
  if (types) {
    const ok = types.some(t => typeMatches(t, value));
    if (!ok) {
      problems.push(`${path}: expected ${types.join(' | ')}, received ${describe(value)}`);
      return problems;
    }
  }
  if (value === null) return problems;
  if (schema.enum && !schema.enum.includes(value)) {
    problems.push(`${path}: must be one of ${schema.enum.map(v => JSON.stringify(v)).join(', ')}; received ${JSON.stringify(value)}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) problems.push(`${path}: must have at least ${schema.minLength} characters`);
    if (schema.maxLength != null && value.length > schema.maxLength) problems.push(`${path}: must have at most ${schema.maxLength} characters (received ${value.length})`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) problems.push(`${path}: does not match the documented format ${schema.pattern}`);
    if (schema['x-format'] === 'color' && !isColor(value)) problems.push(`${path}: expected a #rrggbb colour`);
    if (schema['x-format'] === 'background' && !isBackground(value)) problems.push(`${path}: expected transparent, paper, white, light-grey, charcoal or a #rrggbb colour`);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) problems.push(`${path}: must be a finite number`);
    if (schema.minimum != null && value < schema.minimum) problems.push(`${path}: must be >= ${schema.minimum} (received ${value})`);
    if (schema.maximum != null && value > schema.maximum) problems.push(`${path}: must be <= ${schema.maximum} (received ${value})`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) problems.push(`${path}: needs at least ${schema.minItems} item(s) (received ${value.length})`);
    if (schema.maxItems != null && value.length > schema.maxItems) problems.push(`${path}: allows at most ${schema.maxItems} item(s) (received ${value.length})`);
    if (schema.items) value.forEach((item, i) => problems.push(...validate(schema.items, item, `${path}[${i}]`)));
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (UNSAFE_KEYS.has(key)) problems.push(`${path}: unsafe key "${key}" rejected`);
    }
    const props = schema.properties || {};
    for (const req of schema.required || []) {
      if (value[req] === undefined) problems.push(`${path}.${req}: is required`);
    }
    for (const [key, v] of Object.entries(value)) {
      if (UNSAFE_KEYS.has(key)) continue;
      if (props[key]) problems.push(...validate(props[key], v, `${path}.${key}`));
      else if (schema.additionalProperties === false) problems.push(`${path}: unknown field "${key}"`);
    }
  }
  return problems;
}

function typeMatches(t, v) {
  switch (t) {
    case 'string': return typeof v === 'string';
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'integer': return Number.isInteger(v);
    case 'boolean': return typeof v === 'boolean';
    case 'null': return v === null;
    case 'array': return Array.isArray(v);
    case 'object': return isPlainObject(v);
    default: return false;
  }
}

function describe(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
  return typeof v;
}

export const isColor = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
export const BACKGROUNDS = ['transparent', 'paper', 'white', 'light-grey', 'charcoal'];
export const isBackground = v => BACKGROUNDS.includes(v) || isColor(v);

/**
 * Apply a deep patch following the schema: plain objects merge per property,
 * arrays/scalars replace. Returns a new object; inputs are not mutated.
 * @param {any} base
 * @param {any} patch
 * @param {any} schema
 * @param {string} [path]
 */
export function applyPatch(base, patch, schema, path = 'params') {
  if (!isPlainObject(patch)) throw new ParamError([`${path}: a patch must be a plain object`]);
  const out = isPlainObject(base) ? clone(base) : {};
  const props = (schema && schema.properties) || {};
  for (const key of Object.keys(patch)) {
    if (UNSAFE_KEYS.has(key)) throw new ParamError([`${path}: unsafe key "${key}" rejected`]);
    if (!props[key]) throw new ParamError([`${path}: unknown field "${key}"`]);
    const value = patch[key];
    const sub = props[key];
    const subIsObject = sub && (sub.type === 'object' || (Array.isArray(sub.type) && sub.type.includes('object') && isPlainObject(value)));
    if (subIsObject && isPlainObject(value) && isPlainObject(out[key]) && sub.properties) {
      out[key] = applyPatch(out[key], value, sub, `${path}.${key}`);
    } else {
      out[key] = clone(value);
    }
  }
  return out;
}

/** Collect defaults declared in a schema's properties (shallow objects deep). */
export function schemaDefaults(schema) {
  if (!schema) return undefined;
  if (schema.default !== undefined) return clone(schema.default);
  if (schema.type === 'object' && schema.properties) {
    const out = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      const d = schemaDefaults(v);
      if (d !== undefined) out[k] = d;
    }
    return out;
  }
  return undefined;
}

/* ------------------------------------------------------------------------ */
/* Common controls shared by every animation.                               */
/* ------------------------------------------------------------------------ */

export const THEMES = ['editorial-flat'];
export const PALETTES = ['editorial', 'slate', 'warm', 'mono'];
export const LOCALES = ['en', 'es'];

/**
 * @param {number} defaultDurationMs
 */
export function commonSchema(defaultDurationMs) {
  return {
    durationMs: {type: 'number', minimum: 1000, maximum: 60000, default: defaultDurationMs,
      description: 'Total length of the finite timeline in milliseconds. Phases scale proportionally; the final state is held.'},
    seed: {type: 'integer', minimum: 0, maximum: 2147483647, default: 1,
      description: 'Seed for small deterministic variations (appearance defaults, hand-drawn jitter). Same seed + time + params = same frame.'},
    locale: {type: 'string', enum: LOCALES, default: 'en', description: 'Language of built-in labels (en or es). User-supplied text is never translated.'},
    theme: {type: 'string', enum: THEMES, default: 'editorial-flat', description: 'Render treatment. Only tested themes are listed.'},
    palette: {type: 'string', enum: PALETTES, default: 'editorial', description: 'Colour palette applied to props, actors and accents.'},
    background: {type: 'string', 'x-format': 'background', default: 'transparent',
      description: 'transparent, paper, white, light-grey, charcoal or a #rrggbb colour.'},
    safeArea: {type: 'object', additionalProperties: false, description: 'Caption-safe margins as fractions of the frame.',
      properties: {
        top: {type: 'number', minimum: 0, maximum: 0.45, default: 0.06},
        right: {type: 'number', minimum: 0, maximum: 0.45, default: 0.06},
        bottom: {type: 'number', minimum: 0, maximum: 0.45, default: 0.2},
        left: {type: 'number', minimum: 0, maximum: 0.45, default: 0.06},
      }},
    reducedMotion: {type: 'boolean', default: false,
      description: 'Removes decorative motion (overshoot, idle sway, camera drift) while keeping instructional motion.'},
    textVisibility: {type: 'string', enum: ['all', 'key', 'none'], default: 'all',
      description: 'all labels, key labels only, or none (the action must remain readable without labels).'},
    jurisdiction: {type: 'string', maxLength: 60, default: 'unspecified',
      description: 'Descriptive jurisdiction tag. "unspecified" means no legal system is asserted.'},
    contentNotice: {type: 'boolean', default: true,
      description: 'Shows a small "illustrative example" tag inside the safe area.'},
  };
}

export const COMMON_KEYS = Object.keys(commonSchema(6000));

/**
 * Compose a full params schema from common controls plus scene fields.
 * @param {number} defaultDurationMs
 * @param {Record<string, any>} sceneProperties
 */
export function buildParamsSchema(defaultDurationMs, sceneProperties) {
  for (const key of Object.keys(sceneProperties)) {
    if (COMMON_KEYS.includes(key)) throw new Error(`Scene field "${key}" collides with a common control`);
  }
  return {
    type: 'object',
    additionalProperties: false,
    'x-arrayMerge': 'replace',
    properties: {...commonSchema(defaultDurationMs), ...sceneProperties},
  };
}
