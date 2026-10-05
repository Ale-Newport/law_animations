// LAW-0139 — Ámbito material · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (the
// subject tag supplied for the card) and no legal consequence is invented.
import fs from 'node:fs';
import {contractSuite} from '../harness/contract.js';

const presets = JSON.parse(fs.readFileSync(new URL('../../src/animations/sources/LAW-0139.presets.json', import.meta.url), 'utf8')).presets;
const P = name => presets.find(q => q.name === name).params;
// a square caption-safe box (the 1:1 composition) and a tall one (the 9:16 composition) inside the 16:9 test frame
const SQUARE = {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}};
const TALL = {safeArea: {top: 0.02, bottom: 0.02, left: 0.36, right: 0.36}};
const NO_STATE = "s.statesShown === 0 && s.neutralHeaders === 1 && s.headerColors[0] === s.headerColors[1]";
const FRAMED = 's.a.frameAroundChip && s.b.frameAroundChip && s.a.frameShown === 1';
const NAMED = 's.a.labelOnCard && s.b.labelOnCard';

contractSuite('LAW-0139', {
  continuity: ['cardA', 'cardB'],
  semantic: [
    {at: 0.1, fn: "s.samePanels && s.sameCard && s.a.holder === 'start' && s.b.holder === 'start' && s.a.tagShown === 0 && s.b.tagShown === 0 && JSON.stringify(s.a.card) === JSON.stringify(s.b.card)", label: 'base: two identical complete stations, the card waits with an empty tag slot in both'},
    {at: 0.3, fn: "s.a.tagShown > 0 && s.a.tagShown === s.b.tagShown && s.a.holder === 'start' && s.b.holder === 'start'", label: 'change beat: the tags are clipped on at the same moment, before anything moves'},
    {at: 0.38, fn: "s.a.tag === 'Transport' && s.b.tag === 'Culture' && s.a.state === 'included' && s.b.state === 'unclassified'", label: 'exactly the indicated fact differs: the supplied subject tag'},
    {at: 0.5, fn: 'JSON.stringify(s.a.card) === JSON.stringify(s.b.card)', label: 'parallel: same release, same speed (identical positions while the paths coincide)'},
    {at: 1, fn: "s.a.holder === 'bin0' && s.b.holder === 'side'", label: 'the changed tag changes the path: A drops into its keyed bin, B reaches the side bin'},
    {at: 1, fn: 's.guideProgress === 1 && s.trayLanded && !s.a.gateOpen && !s.b.gateOpen', label: 'the comparison guide joins the two chips in the tray at the end; no gate is left open'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.holder === 'bin2' && s.b.holder === 'side' && s.b.tag === ''", label: 'alternative: the third listed subject vs no tag supplied'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.a.holder === 'bin0' && s.b.holder === 'side'", label: 'labels hidden: the same difference is visible'},
    // defect class: states shown too early (headers, badge colours), also with labels hidden
    {at: 0.1, fn: NO_STATE, label: 'base: neutral A/B headers with the same badge colour — no state title before the change'},
    {at: 0.33, fn: NO_STATE, label: 'change beat: the state titles wait until the tag is on the card'},
    {at: 0.1, params: {textVisibility: 'none'}, fn: NO_STATE, label: 'labels hidden: the badges stay identical before the change'},
    {at: 0.45, fn: 's.statesShown === 1 && s.neutralHeaders === 0 && s.headerColors[0] !== s.headerColors[1]', label: 'after the tag change the supplied state titles are shown'},
    // defect class: detached label — the name is printed on the card body and travels with it
    {at: 0.1, fn: NAMED, label: 'the activity name is on the card (base)'},
    {at: 0.55, fn: NAMED, label: 'the activity name travels with the moving card'},
    {at: 1, fn: NAMED, label: 'the activity name is on the card at the hold'},
    {at: 1, params: P('long-labels-stress'), fn: NAMED, label: 'long labels: the name stays on the card'},
    // defect class: ring overprints — the frame encloses the whole chip and never crosses text
    {at: 1, fn: FRAMED, label: 'hold: the frame encloses the whole chip (outside its text), riding the card'},
    {at: 1, params: P('long-labels-stress'), fn: FRAMED, label: 'long labels: the frame encloses the whole chip'},
    {at: 1, params: P('baseline-es'), fn: FRAMED, label: 'Spanish: the frame encloses the whole chip'},
    {at: 1, params: SQUARE, fn: FRAMED, label: 'square box: the frame encloses the whole chip'},
    // defect class: key object too small (sizes in output px at 1920×1080)
    {at: 1, fn: 's.cardPx >= 160 && s.tagPx >= 18 && s.labelPx >= 18 && s.trayPx >= 16', label: '16:9: the card is ≥160 px wide, tag and name ≥18 px, tray chips ≥16 px (not above the keys)'},
    {at: 1, params: SQUARE, fn: "s.arrangement === 'column' && s.a.holder === 'bin0' && s.b.holder === 'side'", label: 'square box: A stacked over B (full-width stations), same result'},
    {at: 1, params: SQUARE, fn: 's.cardPx >= 100 && s.tagPx >= 13', label: 'square box: the card keeps a usable size'},
    {at: 1, params: TALL, fn: "s.arrangement === 'column' && s.a.holder === 'bin0' && s.b.holder === 'side'", label: 'tall box: stacked stations, same result'},
    // defect class: meaning lost to truncation (long labels, every composition)
    {at: 1, params: P('long-labels-stress'), fn: 's.truncated.length === 0', label: 'long labels 16:9: no author text is cut'},
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: 's.truncated.length === 0', label: 'long labels, square box: no author text is cut'},
    {at: 1, params: {...P('long-labels-stress'), ...TALL}, fn: 's.truncated.length === 0', label: 'long labels, tall box: no author text is cut'},
    // AUTHORING item 17: key card text ≥16 px at 1080p, never smaller than the generic notes and headers
    {at: 1, params: P('long-labels-stress'), fn: 's.ref.tag >= 16 && s.ref.label >= 16 && s.ref.tray >= 16 && s.notesNotLarger', label: 'long labels 16:9: tag, name and tray chips ≥16 px; no note or header larger than the card text'},
    {at: 1, params: {...P('long-labels-stress'), ...TALL}, fn: 's.ref.tag >= 16 && s.ref.label >= 16 && s.ref.tray >= 16 && s.notesNotLarger', label: 'long labels 9:16: tag, name and tray chips ≥16 px; no note or header larger than the card text'},
    // text-dense square boxes switch to the track stations (no waiting lane), as LAW-0083 switches layout
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: "s.stationKind === 'track' && s.ref.tag >= 16 && s.ref.label >= 16 && s.ref.tray >= 16 && s.notesNotLarger", label: 'long labels 1:1 (track stations): tag, name and tray chips ≥16 px; no note or header caption larger than the card text'},
    {at: 1, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: "s.stationKind === 'track' && s.ref.tag >= 16 && s.ref.label >= 16", label: 'alternative 1:1 (three gates, track stations): tag and name ≥16 px'},
    {at: 1, params: {...P('baseline-es'), ...SQUARE}, fn: 's.ref.tag >= 16 && s.ref.label >= 16', label: 'Spanish 1:1: tag and name ≥16 px'},
    {at: 1, params: P('baseline-es'), fn: 's.ref.tag >= 16 && s.ref.label >= 16', label: 'Spanish 16:9: tag and name ≥16 px'},
    {at: 1, params: {...P('contrast-or-alternative'), ...TALL}, fn: 's.ref.tag >= 16 && s.ref.label >= 16', label: 'alternative 9:16: tag and name ≥16 px'},
    // the track variant keeps the brief: identical A/B before the change, the action through the filter, the frame, the tray
    {at: 0.1, params: {...P('long-labels-stress'), ...SQUARE}, fn: "s.stationKind === 'track' && " + NO_STATE + " && s.a.holder === 'start' && JSON.stringify(s.a.card) === JSON.stringify(s.b.card)", label: 'track: A and B identical before the change beat'},
    {at: 0.5, params: {...P('long-labels-stress'), ...SQUARE}, fn: 'JSON.stringify(s.a.card) === JSON.stringify(s.b.card) && s.a.holder === "rail"', label: 'track: same release and speed along the track'},
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: "s.a.holder === 'bin0' && s.b.holder === 'side' && " + FRAMED + " && s.trayLanded && s.guideProgress === 1", label: 'track: A caught by its keyed pin, B runs to the end compartment; frame round the chip; comparison tray'},
    {at: 1, params: SQUARE, fn: 's.ref.tag >= 16 && s.ref.label >= 16 && s.ref.tray >= 16', label: 'default 1:1: tag, name and tray chips ≥16 px'},
    {at: 1, params: TALL, fn: 's.ref.tag >= 16 && s.ref.label >= 16 && s.ref.tray >= 16', label: 'default 9:16: tag, name and tray chips ≥16 px'},
    // round 3 (independent review): key content ≥16 px and supplied context ≥14 px in every preset × ratio —
    // card tag and name, the article's reference, heading and subject rows (the filter keys) and the key
    // plates; book title, book note and hierarchy level ≥14 px; the book note stays on its cover label
    ...[['default', {}], ...presets.map(q => [q.name, q.params])].flatMap(([name, prm]) => [['16:9', {}], ['9:16', TALL], ['1:1', SQUARE]].map(([ratio, box]) => ({
      at: 1, params: {...prm, ...box},
      fn: 's.ref.tag >= 16 && s.ref.label >= 16 && s.srcKeyPx >= 16 && s.platePx >= 16 && s.srcCtxPx >= 14 && s.noteInPage && s.srcTruncated === 0',
      label: `${name} ${ratio}: card, source keys and plates ≥16 px; title, note and level ≥14 px; note inside its label`,
    }))),
    // track stations: the card never passes through a compartment wall (the walls lift as it goes by)
    ...[0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56, 0.58, 0.6, 0.62, 0.64].flatMap(at => [
      {at, params: {...P('long-labels-stress'), ...SQUARE}, fn: "s.stationKind === 'track' && !s.wallCrossing", label: `1:1 long labels: no wall crosses the card @${at}`},
      {at, params: P('long-labels-stress'), fn: "s.stationKind === 'track' && !s.wallCrossing", label: `16:9 long labels: no wall crosses the card @${at}`},
      {at, params: {...P('contrast-or-alternative'), ...SQUARE}, fn: '!s.wallCrossing', label: `1:1 alternative: no wall crosses the card @${at}`},
    ]),
    {at: 0.1, params: {...P('long-labels-stress'), ...SQUARE}, fn: '!s.wallCrossing && s.wallsClosed', label: 'track: every wall is closed before the release'},
    {at: 1, params: {...P('long-labels-stress'), ...SQUARE}, fn: '!s.wallCrossing && s.wallsClosed', label: 'track: every wall is closed again at the hold'},
    // defect class: unused props — nothing is drawn that the scene does not use
    {at: 1, fn: "!s.props.includes('lupa') && s.sourceDrawnOnce", label: 'no unused magnifier; the shared source is drawn once'},
  ],
});
