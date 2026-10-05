/**
 * Minimal retained SVG renderer. Scenes describe their graph as plain virtual
 * nodes (pure data, buildable without a DOM). The renderer materializes them
 * once per layout and then applies per-frame property records to named nodes.
 * All text is inserted through text nodes; there is no innerHTML path.
 * @module core/svg
 */
import {r} from './time.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {object} VNode
 * @property {string} tag
 * @property {Record<string, any>} attrs
 * @property {Array<VNode|string>} children
 */

/**
 * Hyperscript for SVG virtual nodes. `attrs.name` registers a dynamic handle.
 * String children become text nodes.
 * @param {string} tag
 * @param {Record<string, any>|null} [attrs]
 * @param {...any} children
 * @returns {VNode}
 */
export function h(tag, attrs, ...children) {
  return {tag, attrs: attrs || {}, children: flatten(children)};
}

function flatten(list, out = []) {
  for (const c of list) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) flatten(c, out);
    else if (typeof c === 'number') out.push(String(c));
    else out.push(c);
  }
  return out;
}

/** Group shortcut. */
export const g = (attrs, ...children) => h('g', attrs, ...children);

/** Format an attribute value for the DOM. */
export function fmt(value) {
  if (typeof value === 'number') return String(r(value, 3));
  return String(value);
}

const FORBIDDEN_TAGS = new Set(['script', 'foreignObject', 'iframe', 'image', 'use-external']);
const FORBIDDEN_ATTR = /^on/i;

/**
 * Materialize a virtual tree into a parent element.
 * @param {VNode|string} node
 * @param {Element} parent
 * @param {Map<string, Element>} registry named-node registry
 * @param {Document} doc
 */
export function mount(node, parent, registry, doc) {
  if (typeof node === 'string') {
    parent.appendChild(doc.createTextNode(node));
    return;
  }
  if (FORBIDDEN_TAGS.has(node.tag)) throw new Error(`Tag <${node.tag}> is not allowed in animation scenes`);
  const el = doc.createElementNS(SVG_NS, node.tag);
  for (const [key, value] of Object.entries(node.attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'name') {
      if (registry.has(value)) throw new Error(`Duplicate scene node name "${value}"`);
      registry.set(value, el);
      el.setAttribute('data-node', value);
      continue;
    }
    if (FORBIDDEN_ATTR.test(key)) throw new Error(`Event-handler attribute "${key}" is not allowed`);
    if ((key === 'href' || key === 'xlink:href') && !String(value).startsWith('#')) {
      throw new Error('External references are not allowed in animation scenes');
    }
    el.setAttribute(key, fmt(value));
  }
  for (const child of node.children) mount(child, el, registry, doc);
  parent.appendChild(el);
}

/**
 * Apply one frame's property record to named nodes, skipping unchanged values.
 * Supported keys: any SVG attribute name, plus `text` (textContent) and
 * `display` (boolean).
 * @param {Record<string, Record<string, any>>} nodes
 * @param {Map<string, Element>} registry
 * @param {Map<Element, Record<string,string>>} cache
 */
export function applyFrame(nodes, registry, cache) {
  for (const [name, props] of Object.entries(nodes)) {
    const el = registry.get(name);
    if (!el) throw new Error(`Frame references unknown scene node "${name}"`);
    let prev = cache.get(el);
    if (!prev) cache.set(el, (prev = {}));
    for (const [key, raw] of Object.entries(props)) {
      if (raw === undefined) continue;
      let value;
      if (key === 'display') value = raw ? 'inline' : 'none';
      else value = fmt(raw);
      if (prev[key] === value) continue;
      prev[key] = value;
      if (key === 'text') el.textContent = value;
      else el.setAttribute(key, value);
    }
  }
}

/** Serialize a frame record into plain, rounded data for getState(). */
export function serializeFrame(nodes) {
  const out = {};
  for (const [name, props] of Object.entries(nodes)) {
    const o = {};
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined) continue;
      o[k] = typeof v === 'number' ? r(v, 3) : typeof v === 'boolean' ? v : String(v);
    }
    out[name] = o;
  }
  return out;
}

/** Sanitize an instance id into a safe SVG id prefix. */
export function safeId(value) {
  const s = String(value).replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64);
  return /^[A-Za-z_]/.test(s) ? s : `i-${s}`;
}
