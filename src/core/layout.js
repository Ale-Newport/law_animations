/**
 * Viewport, safe-area and design-space fitting. Each scene lays itself out in
 * an orientation-specific design space (landscape / portrait / square) which
 * is then uniformly fitted into the caption-safe content box. This is actual
 * layout adaptation, not scaling a landscape composition into portrait.
 * @module core/layout
 */

/**
 * @typedef {object} View
 * @property {number} width
 * @property {number} height
 * @property {'landscape'|'portrait'|'square'} orientation
 * @property {{x:number,y:number,w:number,h:number}} content  caption-safe box in pixels
 */

/**
 * @param {number} width
 * @param {number} height
 * @param {{top:number,right:number,bottom:number,left:number}} safe
 * @returns {View}
 */
export function makeView(width, height, safe) {
  const ratio = width / height;
  const orientation = ratio > 1.15 ? 'landscape' : ratio < 0.87 ? 'portrait' : 'square';
  const x = width * safe.left;
  const y = height * safe.top;
  const w = Math.max(1, width * (1 - safe.left - safe.right));
  const h = Math.max(1, height * (1 - safe.top - safe.bottom));
  return {width, height, orientation, ratio, content: {x, y, w, h}, shape: classify(w / h)};
}

/**
 * Shape of an available box: the layout family a scene should use. This is
 * decided from the caption-safe content box, not the frame, because safe
 * areas can make a square frame's usable area landscape-shaped.
 * @param {number} ratio width / height
 * @returns {'landscape'|'portrait'|'square'}
 */
export function classify(ratio) {
  return ratio > 1.45 ? 'landscape' : ratio < 0.8 ? 'portrait' : 'square';
}

/**
 * Fit a design space (dw × dh) into the content box; returns the transform
 * that maps design units to viewBox pixels, anchored centre.
 * @param {View} view
 * @param {number} dw
 * @param {number} dh
 */
export function fitDesign(view, dw, dh) {
  const c = view.content;
  const scale = Math.min(c.w / dw, c.h / dh);
  const ox = c.x + (c.w - dw * scale) / 2;
  const oy = c.y + (c.h - dh * scale) / 2;
  return {scale, ox, oy, dw, dh, transform: `translate(${round(ox)} ${round(oy)}) scale(${round(scale, 5)})`};
}

const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Choose a design size per orientation. Designers give the preferred design
 * spaces; the one matching orientation is used, adjusted to the actual ratio
 * of the content box so the available area is used without distortion.
 * @param {View} view
 * @param {{landscape:[number,number], portrait:[number,number], square:[number,number]}} sizes
 */
export function designSize(view, sizes) {
  const [bw, bh] = sizes[view.shape || view.orientation];
  const cr = view.content.w / view.content.h;
  const br = bw / bh;
  // Grow the design space along the axis the content box has spare room in,
  // so layouts can spread instead of letterboxing. Bounded to 35%.
  if (cr > br) return [Math.min(bw * 1.35, bh * cr), bh];
  return [bw, Math.min(bh * 1.35, bw / cr)];
}
