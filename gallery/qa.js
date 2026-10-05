/**
 * QA contact-sheet page: mounts one independent instance per requested time
 * and seeks each directly (no playback). Used by scripts/qa.mjs and for
 * manual inspection. Query parameters:
 *   id=LAW-0001  ratio=16:9|9:16|1:1  times=0,0.25,0.5,0.75,1 (normalized)
 *   preset=<name>  bg=transparent|paper|...  cell=<css px width>  cols=<n>
 *   params=<url-encoded JSON patch>  safe=1 (draw safe-area guides)
 */
import {load} from '../src/registry.js';

const q = new URLSearchParams(location.search);
const id = q.get('id') || 'LAW-0001';
const ratio = q.get('ratio') || '16:9';
const times = (q.get('times') || '0,0.15,0.35,0.55,0.8').split(',').map(Number);
const presetName = q.get('preset');
const bg = q.get('bg');
const cols = Number(q.get('cols') || (ratio === '9:16' ? 5 : 3));
const cellW = Number(q.get('cell') || (ratio === '9:16' ? 300 : 520));
const showSafe = q.get('safe') === '1';
const SIZES = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};

async function main() {
  const def = await load(id);
  let params = {};
  // "default" means the module's own defaultParams (the harness names it that way too)
  if (presetName && presetName !== 'default') {
    const rel = def.metadata && def.metadata.category ? `../src/animations/${def.metadata.category}/${id}.presets.json` : null;
    const presets = await (await fetch(rel)).json();
    const preset = presets.presets.find(p => p.name === presetName);
    if (!preset) throw new Error(`Unknown preset ${presetName}`);
    params = preset.params;
  }
  if (q.get('params')) params = {...params, ...JSON.parse(q.get('params'))};
  if (bg) params = {...params, background: bg};
  const [W, H] = SIZES[ratio];
  document.getElementById('head').innerHTML = '';
  const head = document.getElementById('head');
  head.append(`${id} · ${def.metadata.title}`);
  const sub = document.createElement('span');
  sub.textContent = `${ratio} · preset ${presetName || 'default'} · ${def.defaultParams.durationMs} ms default`;
  head.append(sub);
  const grid = document.getElementById('grid');
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellW}px)`;
  const instances = [];
  times.forEach((t, i) => {
    const fig = document.createElement('figure');
    const frame = document.createElement('div');
    frame.className = 'frame' + ((params.background && params.background !== 'transparent') ? ' solid' : '');
    frame.style.width = `${cellW}px`;
    frame.style.height = `${(cellW * H) / W}px`;
    const cap = document.createElement('figcaption');
    fig.append(frame, cap);
    grid.append(fig);
    const inst = def.create(frame, {width: W, height: H, instanceId: `qa-${i}`, params});
    instances.push({inst, t, cap, frame});
  });
  await Promise.all(instances.map(x => x.inst.ready));
  for (const x of instances) {
    const ms = x.t * x.inst.durationMs;
    x.inst.seek(ms);
    const st = x.inst.getState({bounds: false});
    x.cap.textContent = '';
    const a = document.createElement('b');
    a.textContent = `t=${x.t.toFixed(2)} (${Math.round(ms)} ms)`;
    const b = document.createElement('span');
    b.textContent = st.semantic.beat || '';
    x.cap.append(a, b);
    if (showSafe) {
      const sa = st.params.safeArea;
      const guide = document.createElement('div');
      guide.className = 'safe';
      Object.assign(guide.style, {left: `${sa.left * 100}%`, top: `${sa.top * 100}%`, right: `${sa.right * 100}%`, bottom: `${sa.bottom * 100}%`});
      x.frame.append(guide);
    }
  }
  document.body.dataset.ready = '1';
  window.__qa = {instances: instances.map(x => x.inst)};
}

main().catch(err => {
  document.getElementById('error').textContent = String(err && err.stack || err);
  document.body.dataset.ready = 'error';
});
