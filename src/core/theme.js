/**
 * Theme and palette tokens for the default `editorial-flat` treatment.
 * Themes are render treatments; they never create new animation IDs.
 * @module core/theme
 */

const PALETTES = {
  editorial: {
    accent: '#c8553d', accent2: '#2f6690', accent3: '#e0a458', accent4: '#588157',
    accentSoft: '#f3d9cf', accent2Soft: '#d3e3ef', accent3Soft: '#f7e6c9', accent4Soft: '#dbe7d3',
    cloth: ['#2f6690', '#c8553d', '#588157', '#7a5c8e', '#d08c2f', '#3d5a6c', '#9c4f4f', '#4f7c7a'], // i and i+4 contrast
  },
  slate: {
    accent: '#d1495b', accent2: '#00798c', accent3: '#edae49', accent4: '#30638e',
    accentSoft: '#f6d6db', accent2Soft: '#cce7eb', accent3Soft: '#fbebd0', accent4Soft: '#d3e0ec',
    cloth: ['#30638e', '#d1495b', '#2e8b7a', '#5d576b', '#edae49', '#3f4b5b', '#7d8491', '#00798c'],
  },
  warm: {
    accent: '#b5543c', accent2: '#6b705c', accent3: '#ddbea9', accent4: '#a5a58d',
    accentSoft: '#f0d9d2', accent2Soft: '#e1e2dc', accent3Soft: '#f5ece6', accent4Soft: '#ebebe1',
    cloth: ['#6b705c', '#b5543c', '#606c38', '#cb997e', '#bc6c25', '#9c6644', '#7f5539', '#a5a58d'],
  },
  mono: {
    accent: '#3a3a3a', accent2: '#6b6b6b', accent3: '#9a9a9a', accent4: '#525252',
    accentSoft: '#e4e4e4', accent2Soft: '#ececec', accent3Soft: '#f2f2f2', accent4Soft: '#e8e8e8',
    cloth: ['#4a4a4a', '#6e6e6e', '#8a8a8a', '#3c3c3c', '#5c5c5c', '#7a7a7a', '#545454', '#666666'],
  },
};

const BACKGROUNDS = {
  transparent: null,
  paper: '#f6f1e7',
  white: '#ffffff',
  'light-grey': '#eceef0',
  charcoal: '#23262b',
};

/** Diverse, neutral skin tones; never tied to roles. */
export const SKIN_TONES = ['#f1c9a5', '#e0ac85', '#c68863', '#a86b47', '#8a5234', '#5f3a24'];
export const HAIR_COLORS = ['#2b1d16', '#4a3122', '#7a4b2a', '#b98b52', '#8d8d8d', '#1c1c1c', '#5e3b2e'];

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * Resolve theme tokens for a theme/palette/background combination.
 * Free-floating ink adapts to dark backgrounds; props keep their own fills.
 * @param {{theme:string, palette:string, background:string}} p
 */
export function resolveTheme(p) {
  const pal = PALETTES[p.palette] || PALETTES.editorial;
  const bg = p.background in BACKGROUNDS ? BACKGROUNDS[p.background] : p.background;
  const dark = bg ? luminance(bg) < 0.2 : false;
  return {
    name: p.theme,
    background: bg,
    dark,
    // outlines & text
    ink: '#1f2328',
    inkSoft: '#57606a',
    inkFaint: '#8c959f',
    // free-floating text on the background
    fg: dark ? '#f4f1ea' : '#1f2328',
    fgSoft: dark ? '#c9c4b8' : '#57606a',
    // surfaces
    paper: '#fffdf8',
    paperShade: '#efe8da',
    paperLine: '#c9c2b4',
    card: '#ffffff',
    wood: '#b98a5e',
    woodDark: '#8e6441',
    woodTop: '#caa075',
    metal: '#9aa4ad',
    metalDark: '#5f6b75',
    shadow: dark ? 'rgba(0,0,0,0.35)' : 'rgba(31,35,40,0.12)',
    highlight: '#ffe58a',
    stroke: 2.5,
    strokeThin: 1.5,
    corner: 10,
    ...pal,
  };
}

export const PALETTE_NAMES = Object.keys(PALETTES);
